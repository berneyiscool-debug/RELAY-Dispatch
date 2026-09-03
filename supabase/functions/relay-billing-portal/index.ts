import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

// ============================================
// RELAY — BILLING PORTAL (Stripe Customer Portal)
// ============================================
// Returns a one-time Stripe Billing Portal URL for the calling admin's company,
// where they manage their RELAY subscription: update card, change tier, see
// invoices, cancel. Auth: caller must be an `admin`. No SDK (REST, form-encoded).
//
// Request body: { "returnUrl"? }
// Response:      { "url": "https://billing.stripe.com/..." }
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

    const { data: company } = await admin
      .from('companies').select('stripe_customer_id').eq('id', profile.company_id).single()
    if (!company?.stripe_customer_id) {
      return json({ error: 'No subscription yet. Choose a plan first.' }, 400)
    }

    const { returnUrl } = await req.json().catch(() => ({}))
    const origin = req.headers.get('origin') || 'https://relay.app'

    const form = new URLSearchParams()
    form.set('customer', String(company.stripe_customer_id))
    form.set('return_url', returnUrl || `${origin}/#/settings?tab=billing`)

    const res = await fetch('https://api.stripe.com/v1/billing_portal/sessions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${stripeKey}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: form.toString(),
    })
    const data = await res.json()
    if (!res.ok) {
      throw new Error(`Stripe HTTP ${res.status}: ${data?.error?.message || JSON.stringify(data).slice(0, 200)}`)
    }

    return json({ url: data.url })
  } catch (err) {
    console.error('relay-billing-portal error:', err)
    return json({ error: String(err?.message || err) }, 500)
  }
})
