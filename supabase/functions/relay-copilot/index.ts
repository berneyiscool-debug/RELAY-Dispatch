import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

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

    // ── Per-tenant daily cap ───────────────────────────────────────────
    // The DeepSeek budget is shared by every tenant, so no single account may
    // drain it. Spend is ledgered in public.api_usage (migration 031).
    const dailyCap = Number(Deno.env.get('RELAY_COPILOT_DAILY_CAP') || '500') || 500
    const { data: profile, error: profErr } = await admin
      .from('profiles').select('company_id').eq('id', user.id).single()
    if (profErr || !profile?.company_id) {
      return new Response(JSON.stringify({ error: 'No company is linked to this user' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    }
    if ((await spentToday(admin, profile.company_id, 'copilot')) + 1 > dailyCap) {
      return new Response(
        JSON.stringify({ error: `Daily AI limit reached (${dailyCap} requests). Try again tomorrow or contact RELAY support.` }),
        { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
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
        temperature: 0.3
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
    await recordUsage(admin, profile.company_id, 'copilot', 1)
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

/** Units already spent by one tenant today (UTC). */
async function spentToday(admin: any, companyId: string, kind: string) {
  const since = new Date()
  since.setUTCHours(0, 0, 0, 0)
  const { data, error } = await admin
    .from('api_usage')
    .select('units')
    .eq('company_id', companyId)
    .eq('kind', kind)
    .gte('created_at', since.toISOString())
  if (error) {
    // Migration 031 not applied yet: stay uncapped rather than break every user.
    console.error('api_usage read failed:', error.message)
    return 0
  }
  return (data || []).reduce((sum: number, row: any) => sum + (row.units || 0), 0)
}

/** Ledger write. Never fails the caller's request. */
async function recordUsage(admin: any, companyId: string, kind: string, units: number) {
  if (!(units > 0)) return
  try {
    const { error } = await admin.from('api_usage').insert({ company_id: companyId, kind, units })
    if (error) console.error('api_usage write failed:', error.message)
  } catch (err) {
    console.error('api_usage write threw:', err)
  }
}
