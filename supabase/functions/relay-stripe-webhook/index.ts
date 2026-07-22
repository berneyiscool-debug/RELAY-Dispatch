import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

// ============================================
// RELAY — STRIPE WEBHOOK
// ============================================
// Receives Stripe events and marks the invoice Paid on checkout.session.completed.
// Verifies the Stripe signature manually with Web Crypto (HMAC-SHA256) against the
// RAW body — no Stripe SDK. Writes to the invoices table with the service-role key.
//
// Secrets required (Supabase → Edge Function secrets):
//   STRIPE_WEBHOOK_SECRET       — the "whsec_..." signing secret for this endpoint
//   SUPABASE_URL                — project URL (auto-injected in Supabase runtime)
//   SUPABASE_SERVICE_ROLE_KEY   — service role key (bypasses RLS for the update)
//
// Register this function's URL as a webhook endpoint in the Stripe dashboard and
// subscribe it to `checkout.session.completed`.

const enc = new TextEncoder()

// Constant-time-ish hex compare
function timingSafeEqual(a: string, b: string) {
  if (a.length !== b.length) return false
  let mismatch = 0
  for (let i = 0; i < a.length; i++) mismatch |= a.charCodeAt(i) ^ b.charCodeAt(i)
  return mismatch === 0
}

function toHex(buf: ArrayBuffer) {
  return [...new Uint8Array(buf)].map(b => b.toString(16).padStart(2, '0')).join('')
}

// Verify a Stripe-Signature header: "t=<ts>,v1=<sig>[,v1=<sig>...]".
async function verifyStripeSignature(rawBody: string, sigHeader: string, secret: string, toleranceSec = 300) {
  const parts = Object.fromEntries(
    sigHeader.split(',').map(kv => { const i = kv.indexOf('='); return [kv.slice(0, i), kv.slice(i + 1)] })
  ) as Record<string, string>
  const ts = parts['t']
  const v1 = sigHeader.split(',').filter(kv => kv.startsWith('v1=')).map(kv => kv.slice(3))
  if (!ts || !v1.length) return false

  // Reject stale timestamps (replay protection)
  const age = Math.abs(Math.floor(Date.now() / 1000) - parseInt(ts, 10))
  if (!Number.isFinite(age) || age > toleranceSec) return false

  const key = await crypto.subtle.importKey('raw', enc.encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign'])
  const sigBuf = await crypto.subtle.sign('HMAC', key, enc.encode(`${ts}.${rawBody}`))
  const expected = toHex(sigBuf)
  return v1.some(sig => timingSafeEqual(sig, expected))
}

async function markInvoicePaid(invoiceId: string, sessionId: string) {
  const url = Deno.env.get('SUPABASE_URL')
  const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
  if (!url || !serviceKey) throw new Error('SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY not configured')

  const today = new Date().toISOString().slice(0, 10)
  const res = await fetch(`${url}/rest/v1/invoices?id=eq.${encodeURIComponent(invoiceId)}`, {
    method: 'PATCH',
    headers: {
      'apikey': serviceKey,
      'Authorization': `Bearer ${serviceKey}`,
      'Content-Type': 'application/json',
      'Prefer': 'return=minimal',
    },
    body: JSON.stringify({
      status: 'Paid',
      paid_date: today,
      payment_method: 'Stripe (online)',
      stripe_session_id: sessionId,
    }),
  })
  if (!res.ok) {
    const body = await res.text()
    throw new Error(`Supabase PATCH invoices HTTP ${res.status}: ${body.slice(0, 200)}`)
  }
}

serve(async (req) => {
  if (req.method !== 'POST') return new Response('Method Not Allowed', { status: 405 })

  const secret = Deno.env.get('STRIPE_WEBHOOK_SECRET')
  if (!secret) return new Response('STRIPE_WEBHOOK_SECRET not configured', { status: 500 })

  const sig = req.headers.get('Stripe-Signature') || ''
  const rawBody = await req.text() // must verify against the raw, unparsed body

  const ok = await verifyStripeSignature(rawBody, sig, secret).catch(() => false)
  if (!ok) {
    console.warn('relay-stripe-webhook: signature verification failed')
    return new Response('Invalid signature', { status: 400 })
  }

  let evt: any
  try { evt = JSON.parse(rawBody) } catch { return new Response('Bad JSON', { status: 400 }) }

  try {
    if (evt.type === 'checkout.session.completed') {
      const session = evt.data?.object || {}
      // Only act on genuinely paid sessions
      if (session.payment_status === 'paid' || session.status === 'complete') {
        const invoiceId = session.metadata?.invoice_id || session.client_reference_id
        if (invoiceId) {
          await markInvoicePaid(String(invoiceId), String(session.id || ''))
          console.log(`relay-stripe-webhook: invoice ${invoiceId} marked Paid`)
        }
      }
    }
    // Acknowledge all other event types so Stripe stops retrying.
    return new Response(JSON.stringify({ received: true }), {
      status: 200, headers: { 'Content-Type': 'application/json' },
    })
  } catch (err) {
    console.error('relay-stripe-webhook handler error:', err)
    return new Response(JSON.stringify({ error: String(err?.message || err) }), { status: 500 })
  }
})
