import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

// ============================================
// RELAY — CREATE PAYMENT (Stripe Connect direct charge)
// ============================================
// Creates a hosted Stripe Checkout Session to pay ONE invoice, charged directly
// on the tenant's connected Express account (Stripe-Account header), so the
// money lands with the tenant — not RELAY. The relay-stripe-webhook marks the
// invoice Paid on checkout.session.completed. No SDK.
//
// PUBLIC (verify_jwt = false): also called from the unauthenticated customer
// portal and from emailed links. It is authorised by the INVOICE itself — the
// caller supplies only an invoiceId; everything (amount, currency, connected
// account) is derived server-side with the service role. The only thing it can
// do is produce a checkout that PAYS the invoice to the tenant, so exposure is
// limited to whoever already holds the invoice id.
//
// Request body: { "invoiceId": "...", "successUrl"?, "cancelUrl"? }
// Response:      { "url": "https://checkout.stripe.com/...", "sessionId": "cs_..." }
//
// Secrets: STRIPE_SECRET_KEY (platform), SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY,
//          RELAY_CONNECT_FEE_BPS? (optional platform fee, basis points of total)

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

    const { invoiceId, successUrl, cancelUrl } = await req.json()
    if (!invoiceId) return json({ error: 'invoiceId is required' }, 400)

    // Load the invoice (service role — this is a public function).
    const { data: invoice } = await admin
      .from('invoices')
      .select('id, company_id, number, total, status, customer_name, stripe_session_id')
      .eq('id', invoiceId).single()
    if (!invoice) return json({ error: 'Invoice not found' }, 404)
    if (String(invoice.status).toLowerCase() === 'paid') return json({ error: 'This invoice is already paid.' }, 409)

    const cents = Math.round(Number(invoice.total) * 100)
    if (!Number.isFinite(cents) || cents <= 0) return json({ error: 'Invoice total must be greater than zero.' }, 400)

    // Load the tenant's company: connected account + currency + display name.
    const { data: company } = await admin
      .from('companies')
      .select('id, name, settings, stripe_connect_account_id, stripe_connect_charges_enabled')
      .eq('id', invoice.company_id).single()
    if (!company) return json({ error: 'Company not found' }, 404)
    if (!company.stripe_connect_account_id || !company.stripe_connect_charges_enabled) {
      return json({ error: 'Online payments are not set up for this business yet.', code: 'connect_not_ready' }, 409)
    }

    const payCfg = (company.settings || {}).payments || {}
    const currency = String(payCfg.currency || 'aud').toLowerCase()

    // Optional platform fee (basis points of the total), taken from the tenant.
    const feeBps = Number(Deno.env.get('RELAY_CONNECT_FEE_BPS') || '0')
    const applicationFee = feeBps > 0 ? Math.round(cents * feeBps / 10000) : 0

    const origin = req.headers.get('origin') || 'https://relay.app'
    const form = new URLSearchParams()
    form.set('mode', 'payment')
    form.set('success_url', successUrl || `${origin}/#/invoices?paid=${encodeURIComponent(invoice.number || invoice.id)}`)
    form.set('cancel_url', cancelUrl || `${origin}/#/invoices`)
    form.set('client_reference_id', String(invoice.id))
    form.set('metadata[invoice_id]', String(invoice.id))
    form.set('metadata[company_id]', String(company.id))
    if (invoice.number) form.set('metadata[invoice_number]', String(invoice.number))
    form.set('payment_intent_data[metadata][invoice_id]', String(invoice.id))
    if (applicationFee > 0) form.set('payment_intent_data[application_fee_amount]', String(applicationFee))
    form.set('line_items[0][quantity]', '1')
    form.set('line_items[0][price_data][currency]', currency)
    form.set('line_items[0][price_data][unit_amount]', String(cents))
    form.set('line_items[0][price_data][product_data][name]',
      invoice.number ? `Invoice ${invoice.number}` : 'Invoice payment')
    form.set('line_items[0][price_data][product_data][description]', `Payment to ${company.name || 'business'}`)

    // Direct charge ON the connected account.
    const res = await fetch('https://api.stripe.com/v1/checkout/sessions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${stripeKey}`,
        'Content-Type': 'application/x-www-form-urlencoded',
        'Stripe-Account': String(company.stripe_connect_account_id),
      },
      body: form.toString(),
    })
    const data = await res.json()
    if (!res.ok) {
      throw new Error(`Stripe HTTP ${res.status}: ${data?.error?.message || JSON.stringify(data).slice(0, 200)}`)
    }

    return json({ url: data.url, sessionId: data.id })
  } catch (err) {
    console.error('relay-create-payment error:', err)
    return json({ error: String(err?.message || err) }, 500)
  }
})
