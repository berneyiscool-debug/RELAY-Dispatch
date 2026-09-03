import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

// ============================================
// RELAY — CONNECT STATUS
// ============================================
// Returns (and persists) the company's Stripe Express account readiness:
// charges_enabled + details_submitted. Also mints an Express dashboard login
// link when requested (so an onboarded tenant can manage payouts). The webhook
// (account.updated) keeps these columns fresh too; this lets the UI refresh on
// demand (e.g. right after the tenant returns from onboarding). Auth: admin.
//
// Request body: { "loginLink"?: boolean }
// Response: { connected, chargesEnabled, detailsSubmitted, requirementsDue, loginUrl? }
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

async function stripe(path: string, key: string, params?: Record<string, string>) {
  const init: RequestInit = {
    method: params ? 'POST' : 'GET',
    headers: {
      'Authorization': `Bearer ${key}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
  }
  if (params) {
    const form = new URLSearchParams()
    for (const [k, v] of Object.entries(params)) form.set(k, v)
    init.body = form.toString()
  }
  const res = await fetch(`https://api.stripe.com/v1/${path}`, init)
  const data = await res.json()
  if (!res.ok) {
    throw new Error(`Stripe HTTP ${res.status}: ${data?.error?.message || JSON.stringify(data).slice(0, 200)}`)
  }
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
      return json({ connected: false, chargesEnabled: false, detailsSubmitted: false, requirementsDue: [] })
    }

    const account = await stripe(`accounts/${company.stripe_connect_account_id}`, stripeKey)
    const chargesEnabled = !!account.charges_enabled
    const detailsSubmitted = !!account.details_submitted
    const requirementsDue = account?.requirements?.currently_due || []

    await admin.from('companies').update({
      stripe_connect_charges_enabled: chargesEnabled,
      stripe_connect_details_submitted: detailsSubmitted,
      stripe_connect_updated_at: new Date().toISOString(),
    }).eq('id', company.id)

    let loginUrl: string | undefined
    const { loginLink } = await req.json().catch(() => ({}))
    if (loginLink && detailsSubmitted) {
      const link = await stripe(`accounts/${company.stripe_connect_account_id}/login_links`, stripeKey, {})
      loginUrl = link.url
    }

    return json({ connected: true, chargesEnabled, detailsSubmitted, requirementsDue, loginUrl })
  } catch (err) {
    console.error('relay-connect-status error:', err)
    return json({ error: String(err?.message || err) }, 500)
  }
})
