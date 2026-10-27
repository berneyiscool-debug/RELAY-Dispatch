import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import {
  evaluateLimits,
  nextResetUtc,
  startOfDayUtc,
  unitsToMessages,
  usageSnapshot,
} from '../relay-copilot/limits.js'
import {
  clientIp,
  guestLimitMessage,
  guestPayload,
  hashVisitor,
  isDemoId,
  parseClientEvent,
  readDemoLimits,
} from './demo.js'

// ============================================
// RELAY — NO-SIGNUP DEMO (events + guest brny)
// ============================================
// Serves the demo a visitor opens with no account (#/demo, "Try the demo").
//
//   POST ?action=event  { demoId, event, source? }
//       Records demo_started / signup_clicked / signup_completed in
//       public.demo_events. signup_completed must carry the new admin's JWT:
//       the company is looked up from it, never taken from the body.
//   POST ?action=chat   { demoId, messages, system?, tools?, tool_choice?, max_tokens? }
//       One brny call for a guest, proxied to Anthropic like relay-copilot but
//       with the guest allowance (demo.js) and a clamped request.
//   POST ?action=usage  { demoId }
//       The guest's allowance meter.
//
// PUBLIC (verify_jwt = false): a guest has no Supabase session. Deploy with
//     supabase functions deploy relay-demo --no-verify-jwt
// Nothing here reads or writes tenant data. Spend is bounded per visitor (keyed
// hash of the IP, RELAY_DEMO_IP_SALT) and for all guests together per Sydney day.

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Kept in step with relay-copilot (supabase/tests/demo-tracking.test.js).
const ALLOWED_HOST = 'api.anthropic.com'
const API_KEY_ENV = 'ANTHROPIC_API_KEY'
const DEFAULT_MODEL = 'claude-haiku-5-5'
const DEFAULT_ENDPOINT = 'https://api.anthropic.com/v1/messages'
const ANTHROPIC_VERSION = '2023-06-01'

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')
    const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
    if (!supabaseUrl || !serviceKey) return json({ error: 'Server configuration error.' }, 500)
    const admin = createClient(supabaseUrl, serviceKey)

    const action = new URL(req.url).searchParams.get('action') || 'event'
    const body = await req.json().catch(() => ({}))
    const visitor = await hashVisitor(clientIp(req.headers), Deno.env.get('RELAY_DEMO_IP_SALT') || serviceKey)
    const limits = readDemoLimits()
    const since = startOfDayUtc(new Date()).toISOString()

    if (action === 'event') return await recordEvent(admin, req, body, visitor, limits, since)

    if (action !== 'chat' && action !== 'usage') return json({ error: 'Unknown action' }, 400)
    if (!isDemoId(body?.demoId)) return json({ error: 'demoId must be a UUID' }, 400)
    // Without a visitor there is nothing to hold the allowance against.
    if (!visitor) return json({ error: 'brny is not available in this demo right now.' }, 403)

    const usage = await guestUsageToday(admin, visitor, since)
    // An unreadable ledger fails closed here, unlike relay-copilot: a guest is
    // anonymous, and an uncapped public proxy is the one thing this must not be.
    if (!usage) return json({ error: 'brny is not available in this demo right now.' }, 503)
    const { cap, pool } = limits

    if (action === 'usage') {
      const snap = usageSnapshot({ companyUnits: usage.allUnits, userUnits: usage.visitorUnits, pool, cap, seats: 1 })
      return json({
        available: true,
        guest: true,
        resetsAt: nextResetUtc(new Date()).toISOString(),
        blocked: snap.blocked,
        user: snap.user,
      })
    }

    const verdict = evaluateLimits({ companyUnits: usage.allUnits, userUnits: usage.visitorUnits, pool, cap })
    if (!verdict.allowed) {
      const resetsAt = nextResetUtc(new Date())
      return json({
        error: guestLimitMessage({ scope: verdict.scope, cap, resetsAt }),
        code: 'ai_daily_limit',
        scope: verdict.scope,
        remainingMessages: unitsToMessages(verdict.userRemainingUnits),
        poolRemainingMessages: unitsToMessages(verdict.poolRemainingUnits),
        resetsAt: resetsAt.toISOString(),
      }, 429)
    }

    const { payload, error } = guestPayload(body, { model: DEFAULT_MODEL })
    if (error) return json({ error }, 400)

    const target = new URL(DEFAULT_ENDPOINT)
    if (target.hostname !== ALLOWED_HOST) return json({ error: 'Endpoint is not allowed.' }, 403)
    const apiKey = Deno.env.get(API_KEY_ENV)
    if (!apiKey) return json({ error: `${API_KEY_ENV} is not set on Supabase.` }, 500)

    const response = await fetch(target.toString(), {
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
      console.error('demo brny upstream error:', response.status, text)
      return json({ error: `AI API error: ${response.status}` }, response.status)
    }

    const data = await response.json()
    // Count only calls Anthropic actually served, like relay-copilot.
    const { error: ledgerError } = await admin.from('demo_events').insert({
      demo_id: body.demoId, event: 'assistant_call', ip_hash: visitor,
    })
    if (ledgerError) console.error('demo ledger write failed:', ledgerError.message)
    return json(data)
  } catch (err) {
    console.error('relay-demo failed:', err)
    return json({ error: 'Something went wrong.' }, 500)
  }
})

// Today's guest brny calls: this visitor's, and every guest's together.
async function guestUsageToday(admin: any, visitor: string, since: string) {
  const count = async (scoped: boolean) => {
    let query = admin.from('demo_events')
      .select('id', { count: 'exact', head: true })
      .eq('event', 'assistant_call')
      .gte('created_at', since)
    if (scoped) query = query.eq('ip_hash', visitor)
    const { count: n, error } = await query
    if (error) {
      console.error('demo ledger read failed:', error.message)
      return null
    }
    return n || 0
  }
  const [visitorUnits, allUnits] = await Promise.all([count(true), count(false)])
  if (visitorUnits === null || allUnits === null) return null
  return { visitorUnits, allUnits }
}

async function recordEvent(admin: any, req: Request, body: any, visitor: string | null, limits: any, since: string) {
  const parsed = parseClientEvent(body)
  if ('error' in parsed) return json({ error: parsed.error }, 400)

  // A visitor past the day's event budget is ignored quietly: tracking must
  // never surface an error in the app.
  if (visitor) {
    const { count, error } = await admin.from('demo_events')
      .select('id', { count: 'exact', head: true })
      .eq('ip_hash', visitor)
      .neq('event', 'assistant_call')
      .gte('created_at', since)
    if (!error && (count || 0) >= limits.eventsPerDay) return new Response(null, { status: 204, headers: corsHeaders })
  }

  let companyId: string | null = null
  if (parsed.event === 'signup_completed') {
    const auth = req.headers.get('Authorization') || ''
    const token = auth.startsWith('Bearer ') ? auth.substring(7) : ''
    const user = token ? (await admin.auth.getUser(token)).data?.user : null
    if (!user) return json({ error: 'Sign in to record a signup.' }, 401)
    const { data: profile } = await admin.from('profiles').select('company_id').eq('id', user.id).single()
    if (!profile?.company_id) return json({ error: 'No company is linked to this user.' }, 400)
    companyId = profile.company_id
  }

  const { error } = await admin.from('demo_events').insert({
    demo_id: parsed.demoId,
    event: parsed.event,
    source: parsed.source,
    company_id: companyId,
    ip_hash: visitor,
  })
  // 23505: this company's signup is already recorded.
  if (error && error.code !== '23505') {
    console.error('demo event write failed:', error.message)
    return json({ error: 'Could not record the event.' }, 500)
  }
  return new Response(null, { status: 204, headers: corsHeaders })
}
