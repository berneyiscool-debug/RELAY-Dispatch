import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

// ============================================
// RELAY — SYNC SEATS (per-seat proration)
// ============================================
// Reconciles the company's Stripe subscription quantity to its current active
// (non-deactivated) profile count, prorated. Call after adding/deactivating a
// user. Idempotent: no-op when the quantity already matches. Auth: caller must
// be an `admin`. No SDK (REST, form-encoded).
//
// Request body: {}                     (company is derived from the caller)
// Response:      { "seats": <n>, "changed": <bool> }
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
    // Managers can add/deactivate users too, so allow them to trigger a resync.
    if (profile.role !== 'admin' && profile.role !== 'manager') {
      return json({ error: 'Forbidden' }, 403)
    }

    const { data: company } = await admin
      .from('companies')
      .select('id, stripe_subscription_id, subscription_status, subscription_seats')
      .eq('id', profile.company_id).single()
    if (!company) return json({ error: 'Company not found' }, 404)

    const { data: seatCount } = await admin.rpc('company_active_seat_count', { p_company_id: company.id })
    const seats = Math.max(1, Number(seatCount) || 1)

    // No live subscription (free/offline was chosen, or cancelled): nothing to
    // bill. Record the count for display but don't touch Stripe.
    const liveStatuses = ['active', 'trialing', 'past_due']
    if (!company.stripe_subscription_id || !liveStatuses.includes(String(company.subscription_status))) {
      await admin.from('companies')
        .update({ subscription_seats: seats, subscription_updated_at: new Date().toISOString() })
        .eq('id', company.id)
      return json({ seats, changed: false, reason: 'no active subscription' })
    }

    if (Number(company.subscription_seats) === seats) {
      return json({ seats, changed: false })
    }

    // Update the (single) subscription item's quantity, prorated.
    const sub = await stripe(`subscriptions/${company.stripe_subscription_id}`, stripeKey)
    const itemId = sub?.items?.data?.[0]?.id
    if (!itemId) throw new Error('Subscription has no line item to update')

    await stripe(`subscriptions/${company.stripe_subscription_id}`, stripeKey, {
      'items[0][id]': String(itemId),
      'items[0][quantity]': String(seats),
      'proration_behavior': 'create_prorations',
    })

    // The subsequent customer.subscription.updated webhook will also persist
    // this, but write it now so the UI reflects the change immediately.
    await admin.from('companies')
      .update({ subscription_seats: seats, subscription_updated_at: new Date().toISOString() })
      .eq('id', company.id)

    return json({ seats, changed: true })
  } catch (err) {
    console.error('relay-billing-sync-seats error:', err)
    return json({ error: String(err?.message || err) }, 500)
  }
})
