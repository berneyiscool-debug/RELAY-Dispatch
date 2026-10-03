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
  userLimit,
} from './limits.js'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// The only host the proxy may talk to. Never trust a caller-supplied URL:
// forwarding the server-side API key to an arbitrary endpoint exfiltrates it.
// Deputy is DeepSeek-only, and clients no longer send an endpoint at all, so the
// allowlist below is defence in depth for older deployed builds.
// The single model: Flash covers chat AND the attachment images. The legacy ids
// `deepseek-chat` / `deepseek-reasoner` were retired on 2026-07-24, and V4-Pro
// cannot read images.
const ALLOWED_HOST = 'api.deepseek.com'
const API_KEY_ENV = 'DEEPSEEK_API_KEY'
const DEFAULT_MODEL = 'deepseek-flash'
const DEFAULT_ENDPOINT = 'https://api.deepseek.com/chat/completions'

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
    // The DeepSeek budget is shared by every tenant, so no single account may
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
    const { messages, endpoint, model } = await req.json()
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

    const response = await fetch(targetUrl.toString(), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: model || DEFAULT_MODEL,
        messages,
        temperature: 0.3,
        // Deputy answers from CRM context, so chain-of-thought only adds latency
        // and tokens here. Explicit so an upstream default change can't re-enable it.
        thinking: { type: 'disabled' }
      })
    })

    if (!response.ok) {
      const text = await response.text()
      return new Response(
        JSON.stringify({ error: `AI API error (model ${model || DEFAULT_MODEL}): ${response.status} - ${text}` }),
        { status: response.status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const data = await response.json()
    // Bill the tenant only for calls DeepSeek actually served.
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
