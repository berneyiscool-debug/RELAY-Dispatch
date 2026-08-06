import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

// ============================================
// RELAY — SMS PORTAL ACTION (confirm / opt-out / view)
// ============================================
// Backs the no-login `#/portal/sms` page a customer reaches by tapping the
// link in an SMS. Deliberately NOT routed through the existing PIN-gated
// customer portal (Portal.js) -- ACMA requires that opting out of SMS not
// require logging in or creating an account, and the confirm/reschedule
// action should carry the same low friction.
//
// Runs entirely on the service-role key: `customers`' only RLS policy requires
// an authenticated Supabase session tied to a company
// (company_id = get_user_company_id(auth.uid())), and an anonymous visitor who
// just clicked an SMS link has no such session. The `portal_token` itself is
// the credential here -- verified against the DB before anything is read or
// written, same trust boundary the existing Pay-Now portal link already
// relies on (see Portal.js / payments.js).
//
// Secrets required (Supabase → Edge Function secrets):
//   SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY — auto-injected
//
// Request body:
//   {
//     "token":     "c_pt_...",                  // customer.portal_token, required
//     "action":    "lookup" | "confirm" | "optout",
//     "jobId":     "job_1",                      // for lookup/confirm
//     "invoiceId": "inv_1"                       // for lookup (payment_nudge context)
//   }
//
// Response (lookup):  { companyName, customerFirstName, job?: {...}, invoice?: {...}, alreadyConfirmed, optedOut }
// Response (confirm):  { confirmed: true }
// Response (optout):   { optedOut: true }

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
    const supabaseUrl = Deno.env.get('SUPABASE_URL')
    const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
    if (!supabaseUrl || !serviceKey) throw new Error('Supabase connection secrets are not configured')

    const { token, action, jobId, invoiceId } = await req.json()
    if (!token) return json({ error: 'token is required' }, 400)
    if (!['lookup', 'confirm', 'optout'].includes(action)) return json({ error: 'Invalid action' }, 400)

    const customers = await serviceRequest(supabaseUrl, serviceKey,
      `customers?portal_token=eq.${encodeURIComponent(token)}&select=*`)
    const customer = customers?.[0]
    if (!customer) return json({ error: 'Invalid or expired link' }, 404)

    if (action === 'optout') {
      await serviceRequest(supabaseUrl, serviceKey, `customers?id=eq.${encodeURIComponent(customer.id)}`, {
        method: 'PATCH',
        body: JSON.stringify({ sms_opt_out: true, sms_opt_out_at: new Date().toISOString() }),
      })
      return json({ optedOut: true })
    }

    // 'lookup' and 'confirm' both need the job (if the link carries one), scoped
    // to this same customer so a token can't be used to poke at another job.
    let job: any = null
    if (jobId) {
      const jobs = await serviceRequest(supabaseUrl, serviceKey,
        `jobs?id=eq.${encodeURIComponent(jobId)}&customer_id=eq.${encodeURIComponent(customer.id)}&select=*`)
      job = jobs?.[0] || null
      if (!job) return json({ error: 'Job not found for this link' }, 404)
    }

    if (action === 'confirm') {
      if (!job) return json({ error: 'jobId is required to confirm' }, 400)
      await serviceRequest(supabaseUrl, serviceKey, `jobs?id=eq.${encodeURIComponent(jobId)}`, {
        method: 'PATCH',
        body: JSON.stringify({ confirmed_at: new Date().toISOString() }),
      })
      return json({ confirmed: true })
    }

    // action === 'lookup'
    let invoice: any = null
    if (invoiceId) {
      const invoices = await serviceRequest(supabaseUrl, serviceKey,
        `invoices?id=eq.${encodeURIComponent(invoiceId)}&customer_id=eq.${encodeURIComponent(customer.id)}&select=*`)
      invoice = invoices?.[0] || null
    }
    const companies = await serviceRequest(supabaseUrl, serviceKey,
      `companies?id=eq.${encodeURIComponent(customer.company_id)}&select=name`)
    const companyName = companies?.[0]?.name || 'Your service provider'

    return json({
      companyName,
      customerFirstName: customer.first_name || '',
      optedOut: !!customer.sms_opt_out,
      job: job ? {
        id: job.id, title: job.title, scheduledDate: job.scheduled_date,
        status: job.status, alreadyConfirmed: !!job.confirmed_at,
      } : null,
      invoice: invoice ? {
        id: invoice.id, number: invoice.number, total: invoice.total, dueDate: invoice.due_date,
      } : null,
    })
  } catch (err) {
    console.error('relay-sms-portal-action error:', err)
    return json({ error: String(err?.message || err) }, 500)
  }
})
