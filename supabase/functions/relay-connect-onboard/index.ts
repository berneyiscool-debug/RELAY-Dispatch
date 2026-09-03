import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

// ============================================
// RELAY — CONNECT ONBOARD (Stripe Accounts v2)
// ============================================
// Creates (or reuses) the calling admin's company connected account via the
// Accounts v2 API (merchant configuration, Express dashboard) and returns a
// hosted onboarding URL (v2 account link). After onboarding, invoice payments
// are charged directly on this account (relay-create-payment), so the tenant is
// paid into their own Stripe. Auth: admin. No SDK — v2 REST with JSON bodies.
//
// Request body: { "returnPath"? }
// Response:      { "url": "https://connect.stripe.com/...", "accountId": "acct_..." }
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

// Stripe v2 REST helper — JSON body (v2 does not use form-encoding).
// v2 endpoints require an explicit API version header (v1 does not).
const STRIPE_V2_VERSION = Deno.env.get('STRIPE_API_VERSION') || '2026-08-26.dahlia'

async function stripeV2(path: string, key: string, body?: unknown, method = body ? 'POST' : 'GET') {
  const res = await fetch(`https://api.stripe.com/v2/${path}`, {
    method,
    headers: {
      'Authorization': `Bearer ${key}`,
      'Content-Type': 'application/json',
      'Stripe-Version': STRIPE_V2_VERSION,
    },
    body: body ? JSON.stringify(body) : undefined,
  })
  const data = await res.json()
  if (!res.ok) {
    throw new Error(`Stripe HTTP ${res.status}: ${data?.error?.message || data?.message || JSON.stringify(data).slice(0, 200)}`)
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

    // Create the v2 connected account (merchant config) if none yet.
    let accountId = company.stripe_connect_account_id as string | null
    if (!accountId) {
      const account = await stripeV2('core/accounts', stripeKey, {
        display_name: company.name || 'RELAY tenant',
        ...(company.email ? { contact_email: String(company.email) } : {}),
        dashboard: 'express',
        configuration: {
          merchant: { capabilities: { card_payments: { requested: true } } },
        },
        // Stripe-owned pricing: the tenant is merchant of record, pays Stripe
        // fees, and Stripe covers their negative balances (lowest platform risk).
        defaults: { responsibilities: { fees_collector: 'stripe', losses_collector: 'stripe' } },
        include: ['configuration.merchant'],
        metadata: { company_id: String(company.id) },
      })
      accountId = account.id
      await admin.from('companies')
        .update({ stripe_connect_account_id: accountId, stripe_connect_updated_at: new Date().toISOString() })
        .eq('id', company.id)
    }

    const origin = req.headers.get('origin') || 'https://relay.app'
    const { returnPath } = await req.json().catch(() => ({}))
    const back = `${origin}/#${returnPath || '/settings?tab=payments'}`

    // v2 account link — hosted onboarding.
    const link = await stripeV2('core/account_links', stripeKey, {
      account: String(accountId),
      use_case: {
        type: 'account_onboarding',
        account_onboarding: {
          refresh_url: `${back}&connect=refresh`,
          return_url: `${back}&connect=return`,
          collection_options: { fields: 'eventually_due' },
        },
      },
    })

    return json({ url: link.url, accountId })
  } catch (err) {
    console.error('relay-connect-onboard error:', err)
    return json({ error: String(err?.message || err) }, 500)
  }
})
