import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

// ============================================
// RELAY — CHANGE PLAN (swap tier in place)
// ============================================
// Switches an EXISTING subscription between Cloud and Cloud+ by swapping the
// subscription item's price, prorated. This is what a tier change must use —
// creating a fresh Checkout Session would leave the old subscription running
// and double-bill. Auth: caller must be an `admin`. No SDK (REST, form-encoded).
//
// Request body: { "tier": "cloud" | "cloud_plus" }
// Response:      { "ok": true, "tier": "...", "subscription": "sub_..." }
//
// Secrets: STRIPE_SECRET_KEY, STRIPE_PRICE_CLOUD?, STRIPE_PRICE_CLOUD_PLUS?,
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

    const admin = createClient(supabaseUrl, serviceKey)

    const authHeader = req.headers.get('Authorization') || ''
    if (!authHeader.startsWith('Bearer ')) return json({ error: 'Unauthorized: missing token' }, 401)
    const { data: { user }, error: authError } = await admin.auth.getUser(authHeader.substring(7))
    if (authError || !user) return json({ error: 'Unauthorized: invalid token' }, 401)

    const { data: profile } = await admin
      .from('profiles').select('company_id, role').eq('id', user.id).single()
    if (!profile) return json({ error: 'Forbidden: no profile' }, 403)
    if (profile.role !== 'admin') return json({ error: 'Forbidden: only an administrator can manage billing.' }, 403)

    const { tier } = await req.json()
    if (tier !== 'cloud' && tier !== 'cloud_plus') return json({ error: 'tier must be "cloud" or "cloud_plus"' }, 400)

    const { data: company } = await admin
      .from('companies')
      .select('id, stripe_subscription_id, subscription_status')
      .eq('id', profile.company_id).single()
    if (!company) return json({ error: 'Company not found' }, 404)

    const liveStatuses = ['active', 'trialing', 'past_due']
    if (!company.stripe_subscription_id || !liveStatuses.includes(String(company.subscription_status))) {
      // Nothing to change in place — the caller should start a Checkout instead.
      return json({ error: 'No active subscription to change. Start a checkout first.', code: 'no_active_subscription' }, 409)
    }

    // Resolve the target price (STRIPE_PRICE_* secret, else lookup_key).
    const LOOKUP_KEYS: Record<string, string> = { cloud: 'relay_cloud', cloud_plus: 'relay_cloud_plus' }
    let price = Deno.env.get(tier === 'cloud' ? 'STRIPE_PRICE_CLOUD' : 'STRIPE_PRICE_CLOUD_PLUS') || ''
    if (!price) {
      const prices = await stripe(`prices?lookup_keys[]=${encodeURIComponent(LOOKUP_KEYS[tier])}&active=true&limit=1`, stripeKey)
      price = prices?.data?.[0]?.id || ''
    }
    if (!price) return json({ error: `No Stripe Price for ${tier}.` }, 500)

    // Swap the (single) item's price in place, prorated. Already on it? No-op.
    const sub = await stripe(`subscriptions/${company.stripe_subscription_id}`, stripeKey)
    const item = sub?.items?.data?.[0]
    if (!item?.id) throw new Error('Subscription has no line item to change')
    if (item.price?.id === price) {
      return json({ ok: true, tier, subscription: company.stripe_subscription_id, changed: false })
    }

    await stripe(`subscriptions/${company.stripe_subscription_id}`, stripeKey, {
      'items[0][id]': String(item.id),
      'items[0][price]': price,
      'proration_behavior': 'create_prorations',
      'metadata[company_id]': String(company.id),
      'metadata[tier]': String(tier),
    })

    // The customer.subscription.updated webhook persists the new tier; write it
    // now too so the UI reflects the change immediately.
    await admin.from('companies')
      .update({ subscription_tier: tier, subscription_updated_at: new Date().toISOString() })
      .eq('id', company.id)

    return json({ ok: true, tier, subscription: company.stripe_subscription_id, changed: true })
  } catch (err) {
    console.error('relay-billing-change-plan error:', err)
    return json({ error: String(err?.message || err) }, 500)
  }
})
