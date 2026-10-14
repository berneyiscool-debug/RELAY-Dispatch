import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import {
  evaluateLimits,
  isCloudPlusCompany,
  limitMessage,
  nextResetUtc,
  poolLimit,
  readLimits,
  resolveSeats,
  startOfDayUtc,
  unitsToMessages,
  usageSnapshot,
  userLimit,
} from './limits.js'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// The only host the proxy may talk to. Never trust a caller-supplied URL:
// forwarding the server-side API key to an arbitrary endpoint exfiltrates it.
// brny is Anthropic-only, and clients no longer send an endpoint at all, so the
// allowlist below is defence in depth for older deployed builds.
// The default model: Haiku covers chat AND the attachment images, and is the
// cheapest tier that still drives tool use reliably. Costlier models stay
// reachable by name - `model` is passed through - but the default is pinned here
// so a stale saved setting can never quietly move the fleet onto a dearer one.
const ALLOWED_HOST = 'api.anthropic.com'
const API_KEY_ENV = 'ANTHROPIC_API_KEY'
const DEFAULT_MODEL = 'claude-haiku-5-5'
const DEFAULT_ENDPOINT = 'https://api.anthropic.com/v1/messages'
// Anthropic requires an explicit output ceiling on every request; leaving it out
// is a 400 rather than a default. It also caps what one runaway turn can cost.
const DEFAULT_MAX_TOKENS = 4096
// Pinned because the wire format is versioned: an unpinned client works until it
// silently doesn't.
const ANTHROPIC_VERSION = '2023-06-01'

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // ── Authenticate the caller ────────────────────────────────────────
    const supabaseUrl = Deno.env.get('SUPABASE_URL')
    const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
    if (!supabaseUrl || !serviceKey) {
      return new Response(
        JSON.stringify({ error: 'Server configuration error.' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const authHeader = req.headers.get('Authorization') || ''
    if (!authHeader.startsWith('Bearer ')) {
      return new Response(JSON.stringify({ error: 'Unauthorized: missing token' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    }

    const admin = createClient(supabaseUrl, serviceKey)
    const { data: { user }, error: authErr } = await admin.auth.getUser(authHeader.substring(7))
    if (authErr || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized: invalid token' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    }

    // ── Daily allowance: company pool + per-user ceiling ───────────────
    // The Anthropic budget is shared by every tenant, so no single account may
    // drain it — and inside one account no single seat may drain the day. Spend
    // is ledgered in public.api_usage (migration 031); 034 adds the user_id that
    // the ceiling counts. The tier comes from the company row, never the client.
    const limits = readLimits()
    const { data: profile, error: profErr } = await admin
      .from('profiles').select('company_id').eq('id', user.id).single()
    if (profErr || !profile?.company_id) {
      return new Response(JSON.stringify({ error: 'No company is linked to this user' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    }
    const companyId = profile.company_id

    // Only the tier flag is read out of settings: `ai_tier: settings->ai->tier`
    // extracts it in Postgres, because the rest of that document can hold an
    // uploaded logo as a data URL, which has no place on this hot path.
    const { data: company, error: compErr } = await admin
      .from('companies')
      .select('subscription_seats, subscription_tier, comp_tier, ai_tier:settings->ai->tier')
      .eq('id', companyId).single()
    // Losing this row only costs accuracy in the allowance, never access.
    if (compErr) console.error('company lookup failed:', compErr.message)

    let activeSeatCount: number | null = null
    if (!(Number(company?.subscription_seats) > 0)) {
      const { data: counted } = await admin
        .rpc('company_active_seat_count', { p_company_id: companyId })
      activeSeatCount = Number.isFinite(Number(counted)) ? Number(counted) : null
    }

    const cloudPlus = isCloudPlusCompany(company)
    const seats = resolveSeats(company, activeSeatCount)
    const pool = poolLimit(seats, cloudPlus, limits)
    const cap = userLimit(cloudPlus, limits)

    const usage = await usageToday(admin, companyId, 'copilot', startOfDayUtc(new Date()), user.id)

    // ── Usage meters ───────────────────────────────────────────────────
    // `relay-copilot?action=usage` answers "how much of today is left?" for the
    // two bars in the app. It is placed after authentication and before the
    // limit check, so a seat that is already blocked can still read its meters,
    // and it never reaches Anthropic or the ledger.
    //
    // The company figure is an aggregate, and the personal figure is the
    // caller's own row; no other seat's spend is ever returned. A query
    // parameter (rather than a body field) is used deliberately: reading the
    // body here would consume the stream that the proxy below still needs.
    if (new URL(req.url).searchParams.get('action') === 'usage') {
      const resetsAt = nextResetUtc(new Date()).toISOString()
      // A null read means the ledger is unreadable, which also means nothing is
      // being capped. Report the meters as unavailable rather than as zeroes.
      const body = usage
        ? { available: true, resetsAt, ...usageSnapshot({
            companyUnits: usage.companyUnits,
            userUnits: usage.userUnits,
            pool,
            cap,
            seats,
          }) }
        : { available: false, reason: 'ledger_unavailable', resetsAt }
      return new Response(JSON.stringify(body),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    }

    if (usage) {
      const verdict = evaluateLimits({
        companyUnits: usage.companyUnits,
        userUnits: usage.userUnits,
        pool,
        cap,
      })
      if (!verdict.allowed) {
        const resetsAt = nextResetUtc(new Date())
        return new Response(
          JSON.stringify({
            error: limitMessage({
              scope: verdict.scope,
              cap,
              pool,
              poolRemainingUnits: verdict.poolRemainingUnits,
              resetsAt,
            }),
            code: 'ai_daily_limit',
            scope: verdict.scope,
            remainingMessages: unitsToMessages(
              verdict.scope === 'company' ? verdict.poolRemainingUnits : verdict.userRemainingUnits
            ),
            // Sent even for a personal block: a seat that has spent its own day
            // should be told whether the team is out too.
            poolRemainingMessages: unitsToMessages(verdict.poolRemainingUnits),
            resetsAt: resetsAt.toISOString(),
          }),
          { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
      }
    }

    // ── Resolve target against the allowlist ───────────────────────────
    const { messages, endpoint, model, system, tools, tool_choice, max_tokens } = await req.json()
    if (!Array.isArray(messages) || messages.length === 0) {
      return new Response(JSON.stringify({ error: 'messages is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    }

    let targetUrl: URL
    try {
      targetUrl = new URL(endpoint || DEFAULT_ENDPOINT)
    } catch {
      return new Response(JSON.stringify({ error: 'Invalid endpoint URL.' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    }

    if (targetUrl.protocol !== 'https:') {
      return new Response(JSON.stringify({ error: 'Only https endpoints are allowed.' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    }

    if (targetUrl.hostname !== ALLOWED_HOST) {
      return new Response(JSON.stringify({ error: 'Endpoint is not allowed.' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    }

    const apiKey = Deno.env.get(API_KEY_ENV)
    if (!apiKey) {
      return new Response(
        JSON.stringify({ error: `${API_KEY_ENV} is not set on Supabase.` }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Anthropic takes the system prompt as a top-level field rather than as a
    // message, and rejects an empty one, so it is only sent when supplied.
    const payload: Record<string, unknown> = {
      model: model || DEFAULT_MODEL,
      // Mandatory upstream: an omitted ceiling is a 400, not a default.
      max_tokens: Number(max_tokens) > 0 ? Number(max_tokens) : DEFAULT_MAX_TOKENS,
      messages,
      // No `temperature`. The 5.5 generation rejects it outright with a 400
      // ("`temperature` is deprecated for this model"), so pinned sampling is
      // unavailable on the models this proxy is pointed at. Extended reasoning
      // stays off for the original reason: brny answers from CRM context, and
      // thinking only adds latency and tokens here.
    }
    if (system) payload.system = system
    if (Array.isArray(tools) && tools.length) {
      payload.tools = tools
      // `auto` still lets the model answer a plain question without calling
      // anything; anything else the caller asks for is forwarded verbatim.
      payload.tool_choice = tool_choice || { type: 'auto' }
    }

    const response = await fetch(targetUrl.toString(), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': ANTHROPIC_VERSION,
      },
      body: JSON.stringify(payload),
    })

    if (!response.ok) {
      const text = await response.text()
      return new Response(
        JSON.stringify({ error: `AI API error (model ${model || DEFAULT_MODEL}): ${response.status} - ${text}` }),
        { status: response.status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const data = await response.json()
    // Bill the tenant only for calls Anthropic actually served.
    await recordUsage(admin, companyId, 'copilot', 1, user.id)
    return new Response(
      JSON.stringify(data),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})

/**
 * Units already spent by one tenant and by one seat since `since` (Sydney local
 * midnight). Returns null when the ledger cannot be read, so the proxy stays
 * uncapped instead of breaking every user before migration 034 is applied.
 */
async function usageToday(admin: any, companyId: string, kind: string, since: Date, userId: string) {
  const { data, error } = await admin
    .from('api_usage')
    .select('units, user_id')
    .eq('company_id', companyId)
    .eq('kind', kind)
    .gte('created_at', since.toISOString())
  if (error) {
    console.error('api_usage read failed:', error.message)
    return null
  }
  let companyUnits = 0
  let userUnits = 0
  for (const row of data || []) {
    const units = row.units || 0
    companyUnits += units
    // Rows written before migration 034 carry no user_id and so count against the
    // team pool only, never against anyone's personal ceiling.
    if (row.user_id && row.user_id === userId) userUnits += units
  }
  return { companyUnits, userUnits }
}

/** Ledger write. Never fails the caller's request. */
async function recordUsage(admin: any, companyId: string, kind: string, units: number, userId?: string) {
  if (!(units > 0)) return
  try {
    const { error } = await admin
      .from('api_usage')
      .insert({ company_id: companyId, kind, units, user_id: userId || null })
    if (error) console.error('api_usage write failed:', error.message)
  } catch (err) {
    console.error('api_usage write threw:', err)
  }
}
