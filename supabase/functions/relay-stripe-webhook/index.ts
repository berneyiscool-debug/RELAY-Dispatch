import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

// ============================================
// RELAY — STRIPE WEBHOOK
// ============================================
// One endpoint, two concerns:
//   1. Customer invoice payments (mode=payment Checkout) → mark the `invoices`
//      row Paid. This is a tenant billing THEIR customer.
//   2. RELAY subscription billing (mode=subscription + customer.subscription.*)
//      → persist tier/status/seats onto the `companies` row. This is RELAY
//      billing the tenant (Free / Cloud / Cloud+).
//
// Verifies the Stripe signature manually with Web Crypto (HMAC-SHA256) against
// the RAW body — no Stripe SDK. Writes with the service-role key (bypasses RLS
// and the companies_billing_guard, which only blocks client JWT sessions).
//
// Secrets (Supabase → Edge Function secrets):
//   STRIPE_WEBHOOK_SECRET       — the "whsec_..." signing secret for this endpoint
//   SUPABASE_URL                — project URL (auto-injected)
//   SUPABASE_SERVICE_ROLE_KEY   — service role key
//   STRIPE_PRICE_CLOUD          — Cloud   per-seat Price id  (maps price → tier)
//   STRIPE_PRICE_CLOUD_PLUS     — Cloud+  per-seat Price id
//
// Subscribe this endpoint (Stripe dashboard) to:
//   checkout.session.completed,
//   customer.subscription.created, customer.subscription.updated,
//   customer.subscription.deleted,
//   invoice.payment_failed

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

// ── Supabase REST helpers (service role) ─────────────────────────────
function supaEnv() {
  const url = Deno.env.get('SUPABASE_URL')
  const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
  if (!url || !serviceKey) throw new Error('SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY not configured')
  return { url, serviceKey }
}

async function supaPatch(pathAndQuery: string, body: unknown) {
  const { url, serviceKey } = supaEnv()
  const res = await fetch(`${url}/rest/v1/${pathAndQuery}`, {
    method: 'PATCH',
    headers: {
      'apikey': serviceKey,
      'Authorization': `Bearer ${serviceKey}`,
      'Content-Type': 'application/json',
      'Prefer': 'return=minimal',
    },
    body: JSON.stringify(body),
  })
  if (!res.ok) {
    const text = await res.text()
    throw new Error(`Supabase PATCH ${pathAndQuery} HTTP ${res.status}: ${text.slice(0, 200)}`)
  }
}

async function supaGet(pathAndQuery: string) {
  const { url, serviceKey } = supaEnv()
  const res = await fetch(`${url}/rest/v1/${pathAndQuery}`, {
    headers: { 'apikey': serviceKey, 'Authorization': `Bearer ${serviceKey}` },
  })
  if (!res.ok) throw new Error(`Supabase GET ${pathAndQuery} HTTP ${res.status}`)
  return await res.json()
}

async function markInvoicePaid(invoiceId: string, sessionId: string) {
  const today = new Date().toISOString().slice(0, 10)
  await supaPatch(`invoices?id=eq.${encodeURIComponent(invoiceId)}`, {
    status: 'Paid',
    paid_date: today,
    payment_method: 'Stripe (online)',
    stripe_session_id: sessionId,
  })
}

function money(n: number, currency = 'AUD') {
  try { return new Intl.NumberFormat('en-AU', { style: 'currency', currency }).format(n) }
  catch { return `$${Number(n).toFixed(2)}` }
}

function headerSafe(v: unknown, max = 200) {
  return String(v ?? '').replace(/[\r\n]+/g, ' ').slice(0, max).trim()
}
function isEmail(v: unknown) {
  const s = String(v ?? '').trim()
  return /^[^\s@,;]+@[^\s@,;]+\.[^\s@,;]+$/.test(s) && s.length <= 254
}

// Emails the customer a RELAY-branded receipt after an online payment — but only
// when the tenant chose RELAY (settings.payments.receiptSource !== 'stripe'), so
// the customer never gets both a RELAY and a Stripe receipt. Sent via Resend on
// RELAY's shared domain as the tenant's own billing.<slug>@… identity (the same
// From that relay-email builds). Best-effort: never throws — a receipt hiccup must
// not make Stripe retry the event and re-run the paid flow.
async function maybeSendReceipt(session: any, invoiceId: string) {
  try {
    const resendKey = Deno.env.get('RESEND_API_KEY')
    if (!resendKey) return
    const emailDomain = Deno.env.get('RELAY_EMAIL_DOMAIN') || 'relaydispatch.com.au'

    const inv = (await supaGet(`invoices?id=eq.${encodeURIComponent(invoiceId)}&select=number,total,company_id,customer_id`))?.[0]
    if (!inv) return
    const company = (await supaGet(`companies?id=eq.${encodeURIComponent(inv.company_id)}&select=id,name,email,email_slug,email_reply_to,settings`))?.[0]
    if (!company) return

    const payCfg = (company.settings || {}).payments || {}
    if (payCfg.receiptSource === 'stripe') return // tenant opted for Stripe's receipt
    if (!company.email_slug) return               // no sending identity yet

    // Prefer the email the payer entered at checkout; fall back to the customer.
    let to = session?.customer_details?.email || ''
    if (!to && inv.customer_id) {
      const cust = (await supaGet(`customers?id=eq.${encodeURIComponent(inv.customer_id)}&select=email`))?.[0]
      to = cust?.email || ''
    }
    if (!isEmail(to)) return

    const currency = String(payCfg.currency || 'AUD').toUpperCase()
    const amount = money(Number(inv.total), currency)
    const num = inv.number || invoiceId
    const co = company.name || 'the business'
    const today = new Date().toLocaleDateString('en-AU')

    // Same From shape as relay-email (receipt -> "billing" mailbox).
    const displayName = headerSafe(company.name || 'RELAY', 78).replace(/["<>\\]/g, '') || 'RELAY'
    const from = `${displayName} <billing.${company.email_slug}@${emailDomain}>`
    const replyTo = [company.email_reply_to, company.email].find((c) => isEmail(c))

    const html = `
      <div style="font-family:system-ui,Segoe UI,Arial,sans-serif;color:#1E2A3A;max-width:560px;">
        <h2 style="margin:0 0 4px;">Payment received</h2>
        <p style="margin:0 0 16px;color:#5b6b7c;">Thanks — your payment to ${headerSafe(co, 120)} has been received.</p>
        <table style="border-collapse:collapse;font-size:14px;">
          <tr><td style="padding:4px 16px 4px 0;color:#5b6b7c;">Invoice</td><td style="padding:4px 0;font-weight:600;">${headerSafe(num, 60)}</td></tr>
          <tr><td style="padding:4px 16px 4px 0;color:#5b6b7c;">Amount paid</td><td style="padding:4px 0;font-weight:600;">${amount}</td></tr>
          <tr><td style="padding:4px 16px 4px 0;color:#5b6b7c;">Date</td><td style="padding:4px 0;">${today}</td></tr>
          <tr><td style="padding:4px 16px 4px 0;color:#5b6b7c;">Method</td><td style="padding:4px 0;">Card (online)</td></tr>
        </table>
        <p style="margin:20px 0 0;color:#8a97a5;font-size:12px;">This is your receipt. No payment is due.</p>
      </div>`

    const body: Record<string, unknown> = { from, to: [to], subject: `Receipt for invoice ${num} — paid`, html }
    if (replyTo) body.reply_to = replyTo

    await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${resendKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })
    console.log(`relay-stripe-webhook: receipt emailed for invoice ${num}`)
  } catch (err) {
    console.error('relay-stripe-webhook: receipt send failed (non-fatal):', err)
  }
}

// Stripe price → our tier slug, by id (STRIPE_PRICE_* secret) or lookup_key —
// matching whichever setup relay-billing-checkout used. Unknown prices leave the
// tier untouched (null = "don't change"), so a future add-on price can't
// silently downgrade.
function tierForPrice(price: any): string | null {
  const id = price?.id
  const lk = price?.lookup_key
  if (id && id === Deno.env.get('STRIPE_PRICE_CLOUD')) return 'cloud'
  if (id && id === Deno.env.get('STRIPE_PRICE_CLOUD_PLUS')) return 'cloud_plus'
  if (lk === 'relay_cloud') return 'cloud'
  if (lk === 'relay_cloud_plus') return 'cloud_plus'
  return null
}

// A subscription only affects the company whose CURRENT subscription it is, or
// one that has no subscription yet (the first one to attach). This guard means a
// stray/duplicate subscription — or the cancellation of an old one — can never
// wipe the plan the company is actually on. As a PostgREST filter:
//   (stripe_subscription_id is null OR stripe_subscription_id = <this sub>)
function currentSubGuard(subId: string) {
  return `&or=(stripe_subscription_id.is.null,stripe_subscription_id.eq.${encodeURIComponent(subId)})`
}

// Persist a Stripe subscription object onto its company row. Matches the company
// by metadata.company_id first (most reliable), else by customer id, always
// scoped by currentSubGuard so only the relevant subscription wins.
async function applySubscription(sub: any) {
  const companyId = sub?.metadata?.company_id
  const customerId = typeof sub?.customer === 'string' ? sub.customer : sub?.customer?.id
  const subId = String(sub?.id || '')
  const item = sub?.items?.data?.[0]
  const tier = tierForPrice(item?.price)
  // In Stripe's flexible billing mode the period end lives on the subscription
  // ITEM; older (classic) subscriptions carry it at the top level. Prefer the
  // item, fall back to the subscription.
  const periodEndUnix = item?.current_period_end ?? sub?.current_period_end
  const periodEnd = periodEndUnix
    ? new Date(periodEndUnix * 1000).toISOString()
    : null

  const patch: Record<string, unknown> = {
    subscription_status: sub?.status ?? null,
    stripe_subscription_id: subId || null,
    subscription_seats: typeof item?.quantity === 'number' ? item.quantity : null,
    subscription_current_period_end: periodEnd,
    subscription_updated_at: new Date().toISOString(),
  }
  if (customerId) patch.stripe_customer_id = customerId
  // Only overwrite tier when we recognise the price (see tierForPrice).
  if (tier) patch.subscription_tier = tier
  // A terminated subscription drops the tier so features re-lock.
  if (sub?.status === 'canceled' || sub?.status === 'incomplete_expired') {
    patch.subscription_tier = null
  }

  const guard = currentSubGuard(subId)
  if (companyId) {
    await supaPatch(`companies?id=eq.${encodeURIComponent(companyId)}${guard}`, patch)
  } else if (customerId) {
    await supaPatch(`companies?stripe_customer_id=eq.${encodeURIComponent(customerId)}${guard}`, patch)
  } else {
    console.warn('relay-stripe-webhook: subscription event with no company_id or customer')
  }
}

// A subscription was deleted/cancelled. Clear the plan ONLY on the company whose
// current subscription is this exact one (match by sub id) — never by company_id,
// so cancelling a leftover duplicate can't wipe the active plan.
async function clearSubscription(sub: any) {
  const subId = String(sub?.id || '')
  if (!subId) return
  await supaPatch(`companies?stripe_subscription_id=eq.${encodeURIComponent(subId)}`, {
    subscription_status: sub?.status ?? 'canceled',
    subscription_tier: null,
    stripe_subscription_id: null,
    subscription_updated_at: new Date().toISOString(),
  })
}

// account.updated (Connect): reflect the tenant's Express onboarding readiness
// onto their company row, matched by connected-account id.
async function applyConnectAccount(account: any) {
  const acctId = String(account?.id || '')
  if (!acctId) return
  await supaPatch(`companies?stripe_connect_account_id=eq.${encodeURIComponent(acctId)}`, {
    stripe_connect_charges_enabled: !!account?.charges_enabled,
    stripe_connect_details_submitted: !!account?.details_submitted,
    stripe_connect_updated_at: new Date().toISOString(),
  })
}

// invoice.payment_failed carries the subscription id + customer.
async function applyInvoiceStatus(inv: any, status: string) {
  const subId = typeof inv?.subscription === 'string' ? inv.subscription : inv?.subscription?.id
  const customerId = typeof inv?.customer === 'string' ? inv.customer : inv?.customer?.id
  const patch = { subscription_status: status, subscription_updated_at: new Date().toISOString() }
  if (subId) {
    await supaPatch(`companies?stripe_subscription_id=eq.${encodeURIComponent(subId)}`, patch)
  } else if (customerId) {
    await supaPatch(`companies?stripe_customer_id=eq.${encodeURIComponent(customerId)}`, patch)
  }
}

serve(async (req) => {
  if (req.method !== 'POST') return new Response('Method Not Allowed', { status: 405 })

  // Two possible endpoints hit this URL: the platform account webhook and the
  // Connect webhook (connected-account events for direct-charge invoice
  // payments + account.updated). Each has its own signing secret — accept both.
  const secrets = [
    Deno.env.get('STRIPE_WEBHOOK_SECRET'),
    Deno.env.get('STRIPE_CONNECT_WEBHOOK_SECRET'),
  ].filter(Boolean) as string[]
  if (!secrets.length) return new Response('No webhook secret configured', { status: 500 })

  const sig = req.headers.get('Stripe-Signature') || ''
  const rawBody = await req.text() // must verify against the raw, unparsed body

  let ok = false
  for (const s of secrets) {
    if (await verifyStripeSignature(rawBody, sig, s).catch(() => false)) { ok = true; break }
  }
  if (!ok) {
    console.warn('relay-stripe-webhook: signature verification failed')
    return new Response('Invalid signature', { status: 400 })
  }

  let evt: any
  try { evt = JSON.parse(rawBody) } catch { return new Response('Bad JSON', { status: 400 }) }

  try {
    switch (evt.type) {
      case 'checkout.session.completed': {
        const session = evt.data?.object || {}
        if (session.mode === 'subscription') {
          // Subscription checkout: link the company to its new subscription.
          // The customer.subscription.created event carries the full detail
          // (price/quantity/period), but stamp the ids now so nothing races.
          const companyId = session.metadata?.company_id || session.client_reference_id
          const subId = typeof session.subscription === 'string' ? session.subscription : session.subscription?.id
          const customerId = typeof session.customer === 'string' ? session.customer : session.customer?.id
          if (companyId) {
            const patch: Record<string, unknown> = { subscription_updated_at: new Date().toISOString() }
            if (subId) patch.stripe_subscription_id = subId
            if (customerId) patch.stripe_customer_id = customerId
            if (session.metadata?.tier) patch.subscription_tier = session.metadata.tier
            await supaPatch(`companies?id=eq.${encodeURIComponent(companyId)}`, patch)
            console.log(`relay-stripe-webhook: company ${companyId} subscription checkout completed`)
          }
        } else {
          // One-off invoice payment (existing behaviour).
          if (session.payment_status === 'paid' || session.status === 'complete') {
            const invoiceId = session.metadata?.invoice_id || session.client_reference_id
            if (invoiceId) {
              await markInvoicePaid(String(invoiceId), String(session.id || ''))
              console.log(`relay-stripe-webhook: invoice ${invoiceId} marked Paid`)
              await maybeSendReceipt(session, String(invoiceId))
            }
          }
        }
        break
      }

      case 'customer.subscription.created':
      case 'customer.subscription.updated': {
        await applySubscription(evt.data?.object || {})
        console.log(`relay-stripe-webhook: ${evt.type} applied`)
        break
      }

      case 'customer.subscription.deleted': {
        await clearSubscription(evt.data?.object || {})
        console.log('relay-stripe-webhook: subscription deleted, plan cleared')
        break
      }

      case 'account.updated': {
        await applyConnectAccount(evt.data?.object || {})
        console.log('relay-stripe-webhook: connect account.updated applied')
        break
      }

      case 'invoice.payment_failed': {
        // Fast dunning signal. Recovery back to active/canceled/etc. comes
        // through customer.subscription.updated, which carries the real status
        // (we deliberately do NOT derive status from invoice.paid — a trial's
        // $0 invoice would otherwise overwrite a genuine "trialing" status).
        await applyInvoiceStatus(evt.data?.object || {}, 'past_due')
        break
      }
    }

    // Acknowledge all event types so Stripe stops retrying.
    return new Response(JSON.stringify({ received: true }), {
      status: 200, headers: { 'Content-Type': 'application/json' },
    })
  } catch (err) {
    console.error('relay-stripe-webhook handler error:', err)
    return new Response(JSON.stringify({ error: String(err?.message || err) }), { status: 500 })
  }
})
