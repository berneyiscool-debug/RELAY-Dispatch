import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

// ============================================
// RELAY — CONNECT ONBOARD (Stripe Express)
// ============================================
// Creates (or reuses) the calling admin's company Stripe EXPRESS connected
// account and returns a hosted onboarding URL. After onboarding, invoice
// payments are charged directly on this account (see relay-create-payment), so
// the tenant is paid into their own Stripe. Auth: admin. No SDK.
//
// Request body: { "returnPath"? }   // where to return in-app (default Payments)
// Response:      { "url": "https://connect.stripe.com/setup/...", "accountId": "acct_..." }
//
// Secrets: STRIPE_SECRET_KEY (platform), SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY

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
    if (profile.role !== 'admin') return json({ error: 'Forbidden: only an administrator can set up payments.' }, 403)

    const { data: company } = await admin
      .from('companies').select('id, name, email, stripe_connect_account_id').eq('id', profile.company_id).single()
    if (!company) return json({ error: 'Company not found' }, 404)

    // Create the Express account if the company doesn't have one yet.
    let accountId = company.stripe_connect_account_id as string | null
    if (!accountId) {
      const account = await stripe('accounts', stripeKey, {
        type: 'express',
        country: 'AU',
        ...(company.email ? { email: String(company.email) } : {}),
        'capabilities[card_payments][requested]': 'true',
        'capabilities[transfers][requested]': 'true',
        'business_profile[name]': company.name || 'RELAY tenant',
        'metadata[company_id]': String(company.id),
      })
      accountId = account.id
      await admin.from('companies')
        .update({ stripe_connect_account_id: accountId, stripe_connect_updated_at: new Date().toISOString() })
        .eq('id', company.id)
    }

    const origin = req.headers.get('origin') || 'https://relay.app'
    const { returnPath } = await req.json().catch(() => ({}))
    const back = `${origin}/#${returnPath || '/settings?tab=payments'}`

    // Account Links are single-use and short-lived; the client always requests a
    // fresh one when starting/continuing onboarding.
    const link = await stripe('account_links', stripeKey, {
      account: String(accountId),
      type: 'account_onboarding',
      refresh_url: `${back}&connect=refresh`,
      return_url: `${back}&connect=return`,
    })

    return json({ url: link.url, accountId })
  } catch (err) {
    console.error('relay-connect-onboard error:', err)
    return json({ error: String(err?.message || err) }, 500)
  }
})
