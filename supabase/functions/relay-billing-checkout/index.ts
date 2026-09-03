import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

// ============================================
// RELAY — BILLING CHECKOUT (Stripe subscription)
// ============================================
// Opens a hosted Stripe Checkout Session in `subscription` mode for the calling
// admin's company, priced PER ACTIVE SEAT. On completion the relay-stripe-webhook
// function stamps the subscription onto the company row. Calls Stripe's REST API
// directly (form-encoded) — no SDK — mirroring relay-create-payment.
//
// Auth: caller must be an `admin` of the company (JWT verified server-side).
//
// Request body: { "tier": "cloud" | "cloud_plus", "successUrl"?, "cancelUrl"? }
// Response:      { "url": "https://checkout.stripe.com/..." }
//
// Secrets (Supabase → Edge Function secrets):
//   STRIPE_SECRET_KEY          — sk_live_... / sk_test_...
//   STRIPE_PRICE_CLOUD         — recurring per-seat Price id for Cloud   ($18/user/mo)
//   STRIPE_PRICE_CLOUD_PLUS    — recurring per-seat Price id for Cloud+  ($21/user/mo)
//   SUPABASE_URL               — auto-injected
//   SUPABASE_SERVICE_ROLE_KEY  — service role (write stripe_customer_id, bypass RLS)

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

// Stripe REST helper: form-encodes a flat map (bracket keys already flattened).
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

    // 1. Authenticate the caller and confirm they administer a company.
    const authHeader = req.headers.get('Authorization') || ''
    if (!authHeader.startsWith('Bearer ')) return json({ error: 'Unauthorized: missing token' }, 401)
    const { data: { user }, error: authError } = await admin.auth.getUser(authHeader.substring(7))
    if (authError || !user) return json({ error: 'Unauthorized: invalid token' }, 401)

    const { data: profile } = await admin
      .from('profiles').select('company_id, role').eq('id', user.id).single()
    if (!profile) return json({ error: 'Forbidden: no profile' }, 403)
    if (profile.role !== 'admin') return json({ error: 'Forbidden: only an administrator can manage billing.' }, 403)

    // 2. Resolve the requested tier → Stripe Price.
    const { tier, successUrl, cancelUrl } = await req.json()
    const priceByTier: Record<string, string | undefined> = {
      cloud: Deno.env.get('STRIPE_PRICE_CLOUD'),
      cloud_plus: Deno.env.get('STRIPE_PRICE_CLOUD_PLUS'),
    }
    if (tier !== 'cloud' && tier !== 'cloud_plus') return json({ error: 'tier must be "cloud" or "cloud_plus"' }, 400)
    const price = priceByTier[tier]
    if (!price) return json({ error: `Price for ${tier} is not configured (STRIPE_PRICE_${tier === 'cloud' ? 'CLOUD' : 'CLOUD_PLUS'})` }, 500)

    // 3. Load the company + ensure a Stripe customer exists.
    const { data: company } = await admin
      .from('companies').select('id, name, email, stripe_customer_id').eq('id', profile.company_id).single()
    if (!company) return json({ error: 'Company not found' }, 404)

    let customerId = company.stripe_customer_id as string | null
    if (!customerId) {
      const customer = await stripe('customers', stripeKey, {
        name: company.name || 'RELAY tenant',
        ...(company.email ? { email: String(company.email) } : {}),
        'metadata[company_id]': String(company.id),
      })
      customerId = customer.id
      await admin.from('companies').update({ stripe_customer_id: customerId }).eq('id', company.id)
    }

    // 4. Seat quantity = current active (non-deactivated) profiles.
    const { data: seatCount } = await admin.rpc('company_active_seat_count', { p_company_id: company.id })
    const seats = Math.max(1, Number(seatCount) || 1)

    // 5. Create the subscription-mode Checkout Session.
    const origin = req.headers.get('origin') || 'https://relay.app'
    const session = await stripe('checkout/sessions', stripeKey, {
      mode: 'subscription',
      customer: String(customerId),
      'line_items[0][price]': price,
      'line_items[0][quantity]': String(seats),
      // Let admins add/remove seats from the Checkout page too; webhook reconciles.
      'line_items[0][adjustable_quantity][enabled]': 'true',
      'line_items[0][adjustable_quantity][minimum]': '1',
      'subscription_data[metadata][company_id]': String(company.id),
      'subscription_data[metadata][tier]': String(tier),
      'metadata[company_id]': String(company.id),
      'metadata[tier]': String(tier),
      client_reference_id: String(company.id),
      allow_promotion_codes: 'true',
      success_url: successUrl || `${origin}/#/settings?billing=success`,
      cancel_url: cancelUrl || `${origin}/#/settings?billing=cancelled`,
    })

    return json({ url: session.url })
  } catch (err) {
    console.error('relay-billing-checkout error:', err)
    return json({ error: String(err?.message || err) }, 500)
  }
})
