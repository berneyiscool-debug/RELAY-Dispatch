import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { pickSubscription, subscriptionPatch } from "./reconcile.js"

// ============================================
// RELAY — RECONCILE SUBSCRIPTION FROM STRIPE
// ============================================
// Repairs a company row from Stripe when the webhook never landed. `relay-stripe-webhook`
// is the only writer that reacts to Stripe events, so a misconfigured endpoint, a
// signing-secret mismatch, or a test/live mode mixup leaves a customer who has paid
// sitting on the paywall with no way out: the client can only re-read our own row.
// This function asks Stripe directly instead, and adopts a live subscription.
//
// Deliberately one-way: it only ever claims a live (active/trialing/past_due)
// subscription for the caller's company. It never writes a cancelled/expired state,
// so a stale Stripe record can never cancel a plan or a running no-card trial — the
// webhook stays the only thing allowed to downgrade. When Stripe reports nothing
// live it writes nothing and explains why, which makes the response useful as a
// diagnostic too.
//
// Auth: caller must be an `admin` or `manager` of the company (same gate as
// relay-billing-sync-seats). No SDK (REST, form-encoded).
//
// Request body: {}                     (company is derived from the caller)
// Response:      { active, status, tier, subscriptionId, customerId, found, updated, reason }
//
// Secrets: STRIPE_SECRET_KEY, STRIPE_PRICE_CLOUD, STRIPE_PRICE_CLOUD_PLUS,
//          SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY

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
    const prices = {
      cloud: Deno.env.get('STRIPE_PRICE_CLOUD'),
      cloudPlus: Deno.env.get('STRIPE_PRICE_CLOUD_PLUS'),
    }

    const admin = createClient(supabaseUrl, serviceKey)

    const authHeader = req.headers.get('Authorization') || ''
    if (!authHeader.startsWith('Bearer ')) return json({ error: 'Unauthorized: missing token' }, 401)
    const { data: { user }, error: authError } = await admin.auth.getUser(authHeader.substring(7))
    if (authError || !user) return json({ error: 'Unauthorized: invalid token' }, 401)

    const { data: profile } = await admin
      .from('profiles').select('company_id, role').eq('id', user.id).single()
    if (!profile) return json({ error: 'Forbidden: no profile' }, 403)
    // Managers hit the same paywall as admins, so let them repair it too. Not a
    // privilege escalation: the values written come from Stripe for their own company.
    if (profile.role !== 'admin' && profile.role !== 'manager') {
      return json({ error: 'Forbidden' }, 403)
    }

    const { data: company } = await admin
      .from('companies')
      .select('id, stripe_customer_id, stripe_subscription_id, subscription_status')
      .eq('id', profile.company_id).single()
    if (!company) return json({ error: 'Company not found' }, 404)

    // Nothing to ask Stripe about until Checkout has created a customer for them.
    if (!company.stripe_customer_id) {
      return json({
        active: false, status: company.subscription_status || null, tier: null,
        subscriptionId: null, customerId: null, found: false, updated: false,
        reason: 'no_customer',
      })
    }

    // status=all so a subscription Stripe has already ended is still returned —
    // pickSubscription ignores those, but the diagnostic needs to see them.
    const listed = await stripe(
      `subscriptions?customer=${encodeURIComponent(company.stripe_customer_id)}&status=all&limit=20`,
      stripeKey,
    )
    // pickSubscription only ever hands back a live subscription (or nothing), so
    // anything we get past this point is safe to adopt.
    const sub = pickSubscription(listed?.data, company.stripe_subscription_id)

    if (!sub) {
      const any = Array.isArray(listed?.data) && listed.data.length > 0
      return json({
        active: false, status: company.subscription_status || null, tier: null,
        subscriptionId: null, customerId: company.stripe_customer_id, found: false, updated: false,
        reason: any ? 'not_live' : 'no_subscription',
      })
    }

    const { patch, tier, customerId } = subscriptionPatch(sub, prices)
    const changed = patch.subscription_status !== company.subscription_status
      || patch.stripe_subscription_id !== company.stripe_subscription_id
    if (changed) {
      const { error: updateError } = await admin.from('companies').update(patch).eq('id', company.id)
      if (updateError) throw new Error(`Failed to update company: ${updateError.message}`)
    }

    return json({
      active: true,
      status: patch.subscription_status,
      tier,
      subscriptionId: patch.stripe_subscription_id,
      customerId,
      found: true,
      updated: changed,
    })
  } catch (err) {
    console.error('relay-billing-reconcile error:', err)
    return json({ error: String(err?.message || err) }, 500)
  }
})
