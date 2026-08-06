import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

// ============================================
// RELAY — SMS INBOUND WEBHOOK (Telnyx)
// ============================================
// Handles STOP/START compliance replies on the shared number pool. This is a
// backstop, not the primary opt-out path -- the link in every SMS (handled by
// relay-sms-portal-action) is unambiguous by construction, while a bare
// inbound reply has to be resolved against sms_log to figure out which
// company/customer it belongs to, since many tenants share the same numbers.
// Telnyx's own STOP-detection blocks at the messaging-profile level (i.e.
// across ALL pool numbers at once), not per RELAY company, so it can't be
// relied on as the source of truth here -- this function is.
//
// Verifies the Ed25519 signature against the RAW body before parsing, same
// principle as relay-stripe-webhook (which uses Stripe's HMAC scheme instead --
// Telnyx signs differently). NOTE: unlike relay-sms/relay-sms-portal-action
// (called from the browser, which always carries the Supabase anon key),
// Telnyx's servers won't present any Supabase key at all, so **JWT
// verification must be turned OFF for this function** in the Supabase
// dashboard (Edge Functions → relay-sms-inbound → disable "Enforce JWT
// Verification"), the same requirement relay-stripe-webhook has.
//
// Secrets required (Supabase → Edge Function secrets):
//   TELNYX_PUBLIC_KEY           — base64 Ed25519 public key, from the Telnyx
//                                 dashboard: Account Settings → Keys & Credentials
//   SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY — auto-injected
//
// Register this function's URL against your Telnyx messaging profile's
// inbound webhook URL.

const STOP_KEYWORDS = new Set(['STOP', 'STOPALL', 'UNSUBSCRIBE', 'CANCEL', 'END', 'QUIT', 'OPTOUT']);
const START_KEYWORDS = new Set(['START', 'UNSTOP', 'YES']);

function timingSafeEqual(a: Uint8Array, b: Uint8Array) {
  if (a.length !== b.length) return false
  let mismatch = 0
  for (let i = 0; i < a.length; i++) mismatch |= a[i] ^ b[i]
  return mismatch === 0
}

function b64ToBytes(b64: string) {
  return Uint8Array.from(atob(b64), c => c.charCodeAt(0))
}

// Reconstructs "{timestamp}|{raw body}" and checks it against the account's
// Ed25519 public key. Unverified against a real Telnyx event as of writing --
// smoke-test this against a real webhook delivery before relying on it.
async function verifyTelnyxSignature(rawBody: string, signatureB64: string, timestamp: string, publicKeyB64: string, toleranceSec = 300) {
  const age = Math.abs(Math.floor(Date.now() / 1000) - parseInt(timestamp, 10))
  if (!Number.isFinite(age) || age > toleranceSec) return false

  const key = await crypto.subtle.importKey('raw', b64ToBytes(publicKeyB64), { name: 'Ed25519' }, false, ['verify'])
  const signedPayload = new TextEncoder().encode(`${timestamp}|${rawBody}`)
  return await crypto.subtle.verify('Ed25519', key, b64ToBytes(signatureB64), signedPayload)
    .catch(() => false)
}

async function serviceRequest(url: string, serviceKey: string, path: string, init: RequestInit = {}) {
  const res = await fetch(`${url}/rest/v1/${path}`, {
    ...init,
    headers: {
      'apikey': serviceKey,
      'Authorization': `Bearer ${serviceKey}`,
      'Content-Type': 'application/json',
      'Prefer': init.method === 'POST' ? 'return=representation' : 'return=minimal',
      ...(init.headers || {}),
    },
  })
  if (!res.ok) {
    const body = await res.text()
    throw new Error(`Supabase ${init.method || 'GET'} ${path} HTTP ${res.status}: ${body.slice(0, 200)}`)
  }
  return res.status === 204 ? null : res.json()
}

function toE164AU(phone: string) {
  const digits = String(phone || '').replace(/[^\d+]/g, '')
  if (digits.startsWith('+')) return digits
  if (digits.startsWith('0')) return `+61${digits.slice(1)}`
  if (digits.startsWith('61')) return `+${digits}`
  return digits
}

serve(async (req) => {
  if (req.method !== 'POST') return new Response('Method Not Allowed', { status: 405 })

  const publicKey = Deno.env.get('TELNYX_PUBLIC_KEY')
  const supabaseUrl = Deno.env.get('SUPABASE_URL')
  const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
  if (!publicKey || !supabaseUrl || !serviceKey) {
    return new Response('Server not configured', { status: 500 })
  }

  const signature = req.headers.get('telnyx-signature-ed25519') || ''
  const timestamp = req.headers.get('telnyx-timestamp') || ''
  const rawBody = await req.text() // must verify against the raw, unparsed body

  const ok = await verifyTelnyxSignature(rawBody, signature, timestamp, publicKey)
  if (!ok) {
    console.warn('relay-sms-inbound: signature verification failed')
    return new Response('Invalid signature', { status: 400 })
  }

  let evt: any
  try { evt = JSON.parse(rawBody) } catch { return new Response('Bad JSON', { status: 400 }) }

  try {
    const payload = evt?.data?.payload
    if (evt?.data?.event_type === 'message.received' && payload?.direction === 'inbound') {
      const inboundFrom = toE164AU(payload.from?.phone_number || '')
      const inboundTo = toE164AU(payload.to?.[0]?.phone_number || '')
      const text = String(payload.text || '').trim().toUpperCase()

      // Resolve which company/customer this belongs to via the most recent
      // outbound message on this exact (pool number, customer) pair -- direct
      // and unambiguous, no cross-tenant guessing needed.
      const matches = await serviceRequest(supabaseUrl, serviceKey,
        `sms_log?from_number=eq.${encodeURIComponent(inboundTo)}&to_number=eq.${encodeURIComponent(inboundFrom)}&direction=eq.outbound&select=company_id,customer_id&order=created_at.desc&limit=1`)
      const match = matches?.[0]

      if (match?.customer_id) {
        if (STOP_KEYWORDS.has(text)) {
          await serviceRequest(supabaseUrl, serviceKey, `customers?id=eq.${encodeURIComponent(match.customer_id)}`, {
            method: 'PATCH',
            body: JSON.stringify({ sms_opt_out: true, sms_opt_out_at: new Date().toISOString() }),
          })
        } else if (START_KEYWORDS.has(text)) {
          await serviceRequest(supabaseUrl, serviceKey, `customers?id=eq.${encodeURIComponent(match.customer_id)}`, {
            method: 'PATCH',
            body: JSON.stringify({ sms_opt_out: false, sms_opt_out_at: null }),
          })
        }
        // Anything else inbound: logged below, not parsed -- this is a
        // no-reply system by design (the portal link is the real interaction).
        await serviceRequest(supabaseUrl, serviceKey, 'sms_log', {
          method: 'POST',
          body: JSON.stringify({
            company_id: match.company_id,
            customer_id: match.customer_id,
            direction: 'inbound',
            template: STOP_KEYWORDS.has(text) ? 'stop_reply' : START_KEYWORDS.has(text) ? 'start_reply' : 'unrecognized_reply',
            body: payload.text || '',
            status: 'received',
            from_number: inboundTo,
            to_number: inboundFrom,
          }),
        })
      } else {
        console.warn('relay-sms-inbound: could not resolve inbound reply to a known customer', inboundFrom, inboundTo)
      }
    }
    // Acknowledge all other event types so Telnyx stops retrying.
    return new Response(JSON.stringify({ received: true }), {
      status: 200, headers: { 'Content-Type': 'application/json' },
    })
  } catch (err) {
    console.error('relay-sms-inbound handler error:', err)
    return new Response(JSON.stringify({ error: String(err?.message || err) }), { status: 500 })
  }
})
