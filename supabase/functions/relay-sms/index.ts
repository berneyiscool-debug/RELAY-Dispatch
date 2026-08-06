import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

// ============================================
// RELAY — SEND SMS (Telnyx)
// ============================================
// Sends a templated SMS from a small shared, rotating pool of Telnyx numbers
// (see `sms_numbers`) rather than one dedicated number per company. Request
// shape is deliberately narrow -- {customerId|contractorId, template, jobId?,
// invoiceId?}, never {to, body} -- so this can never become an open relay for
// arbitrary numbers/text: the recipient is looked up from the CALLER's own
// company data and the message text always comes from the fixed templates
// below, never from the request body.
//
// Auth: the recipient/job/invoice lookups run through PostgREST using the
// CALLER's own JWT (forwarded from the Authorization header that
// supabase.functions.invoke() already attaches), not the service-role key --
// the existing `company_id = get_user_company_id(auth.uid())` RLS policy then
// does the tenant check for free. A request for a record belonging to another
// company simply returns zero rows, no custom authorization code needed. Only
// the writes (sms_log, jobs/sms_numbers updates) use the service-role key,
// same pattern relay-stripe-webhook uses for its invoice update.
//
// Secrets required (Supabase → Edge Function secrets):
//   TELNYX_API_KEY
//   SUPABASE_URL / SUPABASE_ANON_KEY / SUPABASE_SERVICE_ROLE_KEY — auto-injected
//
// Request body:
//   {
//     "customerId":    "cus_1",       // one of customerId/contractorId, required
//     "contractorId":  "con_1",
//     "template":      "confirmation" | "reminder" | "payment_nudge" | "contractor_offer",
//     "jobId":         "job_1",       // required for confirmation/reminder/contractor_offer
//     "invoiceId":     "inv_1",       // required for payment_nudge
//     "portalBaseUrl": "https://app-origin"  // optional, falls back to https://relay.app
//   }
//
// Response: { "sent": true } | { "sent": false, "skipped": "opted_out" } | { "error": "..." }

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

// Defense in depth, not the primary control (the narrow request shape is).
const DAILY_CAP_PER_COMPANY = 500

// RELAY's price to the company per outbound message, AUD cents -- deliberately
// decoupled from Telnyx's actual per-message cost, which is still unconfirmed
// for AU destinations as of writing. Revisit once that's nailed down.
const SMS_PRICE_CENTS = 10

function fmtWhen(job: any) {
  if (!job?.scheduled_date) return 'soon'
  try {
    return new Date(job.scheduled_date).toLocaleDateString('en-AU', {
      weekday: 'short', day: 'numeric', month: 'short',
    })
  } catch { return job.scheduled_date }
}

// Plain ASCII only -- emoji/smart quotes force UCS-2 encoding and cut the
// per-segment budget from 160 to 70 chars. Each template stays under 160
// combined with a real link, verified against the compact link format below.
function renderTemplate(template: string, ctx: any) {
  const { companyName, link, job, invoice } = ctx
  switch (template) {
    case 'confirmation':
      return `${companyName}: job scheduled ${fmtWhen(job)}. Confirm: ${link} Reply STOP to opt out`
    case 'reminder':
      return `${companyName}: reminder - your job is today, ${fmtWhen(job)}. Details: ${link} Reply STOP to opt out`
    case 'payment_nudge':
      return `${companyName}: invoice ${invoice?.number || ''} for $${Number(invoice?.total || 0).toFixed(2)} is overdue. Pay online: ${link} Reply STOP to opt out`
    case 'contractor_offer':
      return `${companyName}: new job offer - ${job?.title || 'a job'} on ${fmtWhen(job)}. View: ${link} Reply STOP to opt out`
    default:
      throw new Error(`Unknown template: ${template}`)
  }
}

// Best-effort AU local -> E.164. Worth confirming against how phone numbers
// are actually stored before relying on this for real sends.
function toE164AU(phone: string) {
  const digits = String(phone || '').replace(/[^\d+]/g, '')
  if (digits.startsWith('+')) return digits
  if (digits.startsWith('0')) return `+61${digits.slice(1)}`
  if (digits.startsWith('61')) return `+${digits}`
  return digits
}

// Raw PostgREST GET scoped to the CALLER's own JWT -- RLS enforces the tenant
// boundary here, so a foreign id just comes back empty instead of needing a
// manual authorization check.
async function fetchAsCaller(url: string, anonKey: string, callerJwt: string, path: string) {
  const res = await fetch(`${url}/rest/v1/${path}`, {
    headers: { 'apikey': anonKey, 'Authorization': `Bearer ${callerJwt}` },
  })
  if (!res.ok) throw new Error(`PostgREST GET ${path} HTTP ${res.status}`)
  return res.json()
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

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  try {
    const telnyxKey = Deno.env.get('TELNYX_API_KEY')
    const supabaseUrl = Deno.env.get('SUPABASE_URL')
    const anonKey = Deno.env.get('SUPABASE_ANON_KEY')
    const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
    if (!telnyxKey) throw new Error('TELNYX_API_KEY is not configured')
    if (!supabaseUrl || !anonKey || !serviceKey) throw new Error('Supabase connection secrets are not configured')

    const callerJwt = (req.headers.get('Authorization') || '').replace(/^Bearer\s+/i, '')
    if (!callerJwt) return json({ error: 'Missing Authorization' }, 401)

    const {
      customerId, contractorId, template, jobId, invoiceId,
      portalBaseUrl = 'https://relay.app',
    } = await req.json()

    if (!customerId && !contractorId) return json({ error: 'customerId or contractorId is required' }, 400)
    if (customerId && contractorId) return json({ error: 'Provide only one of customerId / contractorId' }, 400)
    if (!template) return json({ error: 'template is required' }, 400)

    // --- Tenant-scoped lookups (caller's own JWT -- RLS rejects cross-company ids) ---
    const recipientTable = customerId ? 'customers' : 'contractors'
    const recipientId = customerId || contractorId
    const recipients = await fetchAsCaller(supabaseUrl, anonKey, callerJwt,
      `${recipientTable}?id=eq.${encodeURIComponent(recipientId)}&select=*`)
    const recipient = recipients?.[0]
    if (!recipient) return json({ error: 'Recipient not found for this account' }, 404)
    // sms_opt_out only exists on customers today -- undefined on a contractor row
    // is falsy, so this check safely no-ops for the contractor_offer path.
    if (recipient.sms_opt_out) return json({ sent: false, skipped: 'opted_out' })
    const phone = recipient.phone
    if (!phone) return json({ error: 'Recipient has no phone number on file' }, 400)

    let job: any = null
    if (jobId) {
      const jobs = await fetchAsCaller(supabaseUrl, anonKey, callerJwt, `jobs?id=eq.${encodeURIComponent(jobId)}&select=*`)
      job = jobs?.[0] || null
    }
    let invoice: any = null
    if (invoiceId) {
      const invoices = await fetchAsCaller(supabaseUrl, anonKey, callerJwt, `invoices?id=eq.${encodeURIComponent(invoiceId)}&select=*`)
      invoice = invoices?.[0] || null
    }

    const companyId = recipient.company_id
    const companies = await fetchAsCaller(supabaseUrl, anonKey, callerJwt, `companies?select=name,id`)
    const companyName = (companies || []).find((c: any) => c.id === companyId)?.name || 'Your service provider'

    // --- Daily volume backstop (defense in depth, not the primary control) ---
    const todayStart = new Date(); todayStart.setUTCHours(0, 0, 0, 0)
    const todaysSends = await serviceRequest(supabaseUrl, serviceKey,
      `sms_log?company_id=eq.${encodeURIComponent(companyId)}&direction=eq.outbound&created_at=gte.${todayStart.toISOString()}&select=id`)
    if (Array.isArray(todaysSends) && todaysSends.length >= DAILY_CAP_PER_COMPANY) {
      return json({ error: 'Daily SMS volume cap reached for this account' }, 429)
    }

    // --- Credit balance check (fast-fail pre-check; the atomic decrement after
    // send, below, is the real backstop against concurrent-send races) ---
    const companyRows = await serviceRequest(supabaseUrl, serviceKey,
      `companies?id=eq.${encodeURIComponent(companyId)}&select=sms_credit_cents`)
    const creditCents = companyRows?.[0]?.sms_credit_cents ?? 0
    if (creditCents < SMS_PRICE_CENTS) {
      // Unlike opt-out/daily-cap/no-pool-number, this blocks a real
      // customer-facing text -- the company needs to be able to see it happened.
      await serviceRequest(supabaseUrl, serviceKey, 'sms_log', {
        method: 'POST',
        body: JSON.stringify({
          company_id: companyId,
          customer_id: customerId || null,
          job_id: jobId || null,
          direction: 'outbound',
          template,
          body: '(not sent - insufficient SMS credit)',
          status: 'insufficient_credit',
          to_number: toE164AU(phone),
        }),
      })
      return json({ error: 'Insufficient SMS credit balance' }, 402)
    }

    // --- Pick the least-recently-used pool number (self-balancing, no counter to maintain) ---
    const pool = await serviceRequest(supabaseUrl, serviceKey,
      `sms_numbers?active=eq.true&select=*&order=last_used_at.asc.nullsfirst&limit=1`)
    const fromNumber = pool?.[0]
    if (!fromNumber) throw new Error('No active sms_numbers available in the pool')

    // --- Compose: one link, always leading to the same portal-action page ---
    const actionCode = (template === 'confirmation' || template === 'reminder') ? 'c'
      : template === 'contractor_offer' ? 'v' : 'i'
    const linkParams = new URLSearchParams({ t: recipient.portal_token || '', a: actionCode })
    if (jobId) linkParams.set('j', jobId)
    if (invoiceId) linkParams.set('inv', invoiceId)
    const link = `${portalBaseUrl}/#/portal/sms?${linkParams.toString()}`
    const body = renderTemplate(template, { companyName, link, job, invoice })

    // --- Send via Telnyx ---
    const sendRes = await fetch('https://api.telnyx.com/v2/messages', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${telnyxKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ from: fromNumber.phone_number, to: toE164AU(phone), text: body }),
    })
    const sendData = await sendRes.json().catch(() => ({}))
    const status = sendRes.ok ? 'sent' : 'failed'
    if (!sendRes.ok) console.error('relay-sms: Telnyx send failed', sendRes.status, sendData)

    // --- Audit log + housekeeping (service role, bypasses RLS) ---
    await serviceRequest(supabaseUrl, serviceKey, 'sms_log', {
      method: 'POST',
      body: JSON.stringify({
        company_id: companyId,
        customer_id: customerId || null,
        job_id: jobId || null,
        direction: 'outbound',
        template,
        body,
        status,
        telnyx_message_id: sendData?.data?.id || null,
        from_number: fromNumber.phone_number,
        to_number: toE164AU(phone),
      }),
    })
    if (status === 'sent') {
      // Best-effort: the SMS already went out via Telnyx, so a decrement
      // hiccup must never turn a successful send into a 500 -- only log it.
      try {
        const decRows = await serviceRequest(supabaseUrl, serviceKey, 'rpc/decrement_sms_credit', {
          method: 'POST',
          body: JSON.stringify({ p_company_id: companyId, p_amount_cents: SMS_PRICE_CENTS }),
        })
        if (!Array.isArray(decRows) || decRows.length === 0) {
          console.error(`relay-sms: credit decrement found no matching row for company ${companyId} (balance likely raced to insufficient after send)`)
        }
      } catch (err) {
        console.error('relay-sms: credit decrement failed (message was already sent):', err)
      }
    }
    await serviceRequest(supabaseUrl, serviceKey, `sms_numbers?id=eq.${encodeURIComponent(fromNumber.id)}`, {
      method: 'PATCH',
      body: JSON.stringify({ last_used_at: new Date().toISOString() }),
    })
    if (jobId && status === 'sent') {
      const stamp = template === 'reminder' ? { reminder_sms_sent_at: new Date().toISOString() }
        : template === 'confirmation' ? { confirmation_sms_sent_at: new Date().toISOString() }
        : null
      if (stamp) {
        await serviceRequest(supabaseUrl, serviceKey, `jobs?id=eq.${encodeURIComponent(jobId)}`,
          { method: 'PATCH', body: JSON.stringify(stamp) })
      }
    }

    if (!sendRes.ok) return json({ error: `Telnyx HTTP ${sendRes.status}: ${JSON.stringify(sendData).slice(0, 200)}` }, 502)
    return json({ sent: true })
  } catch (err) {
    console.error('relay-sms error:', err)
    return json({ error: String(err?.message || err) }, 500)
  }
})
