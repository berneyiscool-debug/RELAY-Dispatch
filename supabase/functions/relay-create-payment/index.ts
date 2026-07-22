import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

// ============================================
// RELAY — CREATE PAYMENT (Stripe Checkout Session)
// ============================================
// Creates a hosted Stripe Checkout Session for an invoice and returns its URL.
// The customer pays on Stripe's page; the `relay-stripe-webhook` function marks
// the invoice Paid when checkout.session.completed fires. Keeps STRIPE_SECRET_KEY
// server-side. Calls Stripe's REST API directly (form-encoded) — no SDK needed.
//
// Request body:
//   {
//     "invoiceId":     "inv_123",          // required — stamped into session metadata
//     "invoiceNumber": "INV-1005",         // shown on the Stripe line item
//     "amount":        165.00,             // required — invoice total in major units
//     "currency":      "aud",              // default aud
//     "customerEmail": "barry@acme.com",   // optional — prefills Stripe receipt
//     "companyName":   "Grace Dance",      // optional — line-item description
//     "successUrl":    "https://app/...",  // optional — where Stripe returns on success
//     "cancelUrl":     "https://app/..."   // optional
//   }
//
// Response: { "url": "https://checkout.stripe.com/...", "sessionId": "cs_..." }

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  try {
    const stripeKey = Deno.env.get('STRIPE_SECRET_KEY')
    if (!stripeKey) throw new Error('STRIPE_SECRET_KEY is not configured')

    const {
      invoiceId, invoiceNumber, amount, currency = 'aud',
      customerEmail, companyName, successUrl, cancelUrl,
    } = await req.json()

    if (!invoiceId) return json({ error: 'invoiceId is required' }, 400)
    const cents = Math.round(Number(amount) * 100)
    if (!Number.isFinite(cents) || cents <= 0) return json({ error: 'amount must be a positive number' }, 400)

    // Stripe expects application/x-www-form-urlencoded with bracketed nested keys.
    const form = new URLSearchParams()
    form.set('mode', 'payment')
    form.set('success_url', successUrl || 'https://relay.app/#/invoices?paid=1')
    form.set('cancel_url', cancelUrl || 'https://relay.app/#/invoices')
    form.set('client_reference_id', String(invoiceId))
    form.set('metadata[invoice_id]', String(invoiceId))
    if (invoiceNumber) form.set('metadata[invoice_number]', String(invoiceNumber))
    if (customerEmail) form.set('customer_email', String(customerEmail))
    form.set('line_items[0][quantity]', '1')
    form.set('line_items[0][price_data][currency]', String(currency).toLowerCase())
    form.set('line_items[0][price_data][unit_amount]', String(cents))
    form.set('line_items[0][price_data][product_data][name]',
      invoiceNumber ? `Invoice ${invoiceNumber}` : 'Invoice payment')
    if (companyName) {
      form.set('line_items[0][price_data][product_data][description]', `Payment to ${companyName}`)
    }

    const res = await fetch('https://api.stripe.com/v1/checkout/sessions', {
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

    return json({ url: data.url, sessionId: data.id })
  } catch (err) {
    console.error('relay-create-payment error:', err)
    return json({ error: String(err?.message || err) }, 500)
  }
})
