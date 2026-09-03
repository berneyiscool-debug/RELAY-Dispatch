import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

// ============================================
// RELAY — CONNECT STATUS (Accounts v2)
// ============================================
// Reads + persists whether the company's v2 connected account can accept card
// payments (configuration.merchant.capabilities.card_payments.status === active)
// and, best-effort, mints an Express dashboard login link. The client calls this
// on return from onboarding to refresh. Auth: admin. No SDK.
//
// Request body: { "loginLink"?: boolean }
// Response: { connected, chargesEnabled, detailsSubmitted, loginUrl? }
//
// Secrets: STRIPE_SECRET_KEY, SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })
}

// v2 endpoints require an explicit API version header (v1 does not).
const STRIPE_V2_VERSION = Deno.env.get('STRIPE_API_VERSION') || '2026-08-26.dahlia'

async function stripeV2Get(path: string, key: string) {
  const res = await fetch(`https://api.stripe.com/v2/${path}`, {
    headers: { 'Authorization': `Bearer ${key}`, 'Stripe-Version': STRIPE_V2_VERSION },
  })
  const data = await res.json()
  if (!res.ok) throw new Error(`Stripe HTTP ${res.status}: ${data?.error?.message || data?.message || JSON.stringify(data).slice(0, 200)}`)
  return data
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })
  if (req.method !== 'POST') return json({ error: 'Method Not Allowed' }, 405)

  try {
    const stripeKey = Deno.env.get('STRIPE_SECRET_KEY')
    const supabaseUrl = Deno.env.get('SUPABASE_URL')
    const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
    if (!stripeKey) return json({ error: 'STRIPE_SECRET_KEY is not configured' }, 500)
    if (!supabaseUrl || !serviceKey) return json({ error: 'Supabase keys are not configured' }, 500)

    const admin = createClient(supabaseUrl, serviceKey)

    const authHeader = req.headers.get('Authorization') || ''
    if (!authHeader.startsWith('Bearer ')) return json({ error: 'Unauthorized: missing token' }, 401)
    const { data: { user }, error: authError } = await admin.auth.getUser(authHeader.substring(7))
    if (authError || !user) return json({ error: 'Unauthorized: invalid token' }, 401)

    const { data: profile } = await admin
      .from('profiles').select('company_id, role').eq('id', user.id).single()
    if (!profile) return json({ error: 'Forbidden: no profile' }, 403)
    if (profile.role !== 'admin') return json({ error: 'Forbidden' }, 403)

    const { data: company } = await admin
      .from('companies').select('id, stripe_connect_account_id').eq('id', profile.company_id).single()
    if (!company) return json({ error: 'Company not found' }, 404)

    if (!company.stripe_connect_account_id) {
      return json({ connected: false, chargesEnabled: false, detailsSubmitted: false })
    }

    const account = await stripeV2Get(
      `core/accounts/${company.stripe_connect_account_id}?include=configuration.merchant`, stripeKey)
    const cardStatus = account?.configuration?.merchant?.capabilities?.card_payments?.status || 'unrequested'
    const chargesEnabled = cardStatus === 'active'
    // "Details submitted" ~ they've provided enough that the capability is no
    // longer un-started. Good enough to distinguish "in progress" from "not begun".
    const detailsSubmitted = chargesEnabled || cardStatus === 'pending'

    await admin.from('companies').update({
      stripe_connect_charges_enabled: chargesEnabled,
      stripe_connect_details_submitted: detailsSubmitted,
      stripe_connect_updated_at: new Date().toISOString(),
    }).eq('id', company.id)

    // Best-effort Express dashboard login link (v1 endpoint still serves the
    // Express dashboard for these accounts; ignore if unavailable).
    let loginUrl: string | undefined
    const { loginLink } = await req.json().catch(() => ({}))
    if (loginLink && chargesEnabled) {
      try {
        const res = await fetch(
          `https://api.stripe.com/v1/accounts/${company.stripe_connect_account_id}/login_links`,
          { method: 'POST', headers: { 'Authorization': `Bearer ${stripeKey}`, 'Content-Type': 'application/x-www-form-urlencoded' } })
        const link = await res.json()
        if (res.ok) loginUrl = link.url
      } catch (_) { /* dashboard link optional */ }
    }

    return json({ connected: true, chargesEnabled, detailsSubmitted, loginUrl })
  } catch (err) {
    console.error('relay-connect-status error:', err)
    return json({ error: String(err?.message || err) }, 500)
  }
})
