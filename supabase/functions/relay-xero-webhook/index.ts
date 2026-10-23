import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { adminClient } from '../_xero/edge.ts'
import { verifyWebhookSignature } from '../_xero/crypto.js'
import { invoiceEvents, invoiceIdsByTenant } from '../_xero/mapping.js'

// ============================================
// RELAY — XERO WEBHOOK
// ============================================
// Xero posts INVOICE (and CONTACT) events here. Each event only names the
// tenant and the record id, so this function queues a pull for every invoice
// RELAY pushed (xero_enqueue_pulls) and answers at once; relay-xero-sync then
// reads the invoice and marks it Paid in RELAY if it was paid in Xero.
//
// Xero's rules, which the "intent to receive" check enforces when the webhook
// is saved and keeps checking afterwards:
//   * verify x-xero-signature (base64 HMAC-SHA256 of the RAW body, webhook key)
//   * correct signature → 200, wrong signature → 401, both with an empty body
//   * answer within 5 seconds
//
// PUBLIC (verify_jwt = false): Xero sends no Supabase JWT; the signature is the
// authentication.
//
// Secrets: XERO_WEBHOOK_KEY (Xero app → Webhooks → "Webhooks key"),
//          SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY

const empty = (status: number) => new Response(null, { status })

serve(async (req) => {
  if (req.method !== 'POST') return empty(405)
  const key = Deno.env.get('XERO_WEBHOOK_KEY') || ''
  if (!key) {
    console.error('relay-xero-webhook: XERO_WEBHOOK_KEY is not configured')
    return empty(500)
  }

  const raw = await req.text()
  if (!(await verifyWebhookSignature(raw, req.headers.get('x-xero-signature'), key))) return empty(401)

  let body: unknown
  try { body = JSON.parse(raw) } catch { return empty(200) }

  const byTenant = invoiceIdsByTenant(invoiceEvents(body))
  const tenants = Object.keys(byTenant)
  if (!tenants.length) return empty(200) // intent-to-receive, or contact-only events

  try {
    const admin = adminClient()
    for (const tenantId of tenants) {
      const { error } = await admin.rpc('xero_enqueue_pulls', { p_tenant_id: tenantId, p_xero_invoice_ids: byTenant[tenantId] })
      if (error) throw new Error(error.message)
    }
    return empty(200)
  } catch (err) {
    // A non-200 makes Xero retry the delivery later, which is what we want for
    // a database blip. Persistent failures would get the webhook switched off,
    // so this is logged loudly.
    console.error('relay-xero-webhook: could not queue pulls:', err)
    return empty(500)
  }
})
