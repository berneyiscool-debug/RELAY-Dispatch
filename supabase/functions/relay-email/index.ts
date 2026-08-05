import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

// ============================================
// RELAY — EMAIL (Resend)
// ============================================
// One entry point for all outbound email + domain management via Resend.
// Keeps RESEND_API_KEY server-side (Supabase Edge Function secret). Mirrors the
// relay-create-payment pattern: hits the provider's REST API directly, no SDK.
//
// Actions (body.action, default "send"):
//   send          { from, to, subject, html, text?, replyTo?, cc?, bcc? }
//                     -> { id }                 (Resend message id)
//   domain.add    { name }                      -> { id, name, status, records }
//   domain.get    { domainId }                  -> { id, name, status, records }
//   domain.verify { domainId }                  -> { id, status }
//
// The domain.* actions drive the Settings -> Email & Domain verification wizard:
// `records` is the list of DNS entries the customer adds at their registrar, and
// `status` flips to "verified" once Resend can see them.

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

const RESEND = 'https://api.resend.com'

async function resend(path: string, key: string, method = 'GET', body?: unknown) {
  const res = await fetch(`${RESEND}${path}`, {
    method,
    headers: {
      'Authorization': `Bearer ${key}`,
      'Content-Type': 'application/json',
    },
    body: body ? JSON.stringify(body) : undefined,
  })
  const data = await res.json().catch(() => ({}))
  if (!res.ok) {
    const msg = data?.message || data?.error?.message || JSON.stringify(data).slice(0, 200)
    throw new Error(`Resend HTTP ${res.status}: ${msg}`)
  }
  return data
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  try {
    const key = Deno.env.get('RESEND_API_KEY')
    if (!key) throw new Error('RESEND_API_KEY is not configured')

    const payload = await req.json()
    const action = payload.action || 'send'

    if (action === 'send') {
      const { from, to, subject, html, text, replyTo, cc, bcc } = payload
      if (!from) return json({ error: 'from is required' }, 400)
      if (!to || (Array.isArray(to) && to.length === 0)) return json({ error: 'to is required' }, 400)
      if (!subject) return json({ error: 'subject is required' }, 400)
      if (!html && !text) return json({ error: 'html or text is required' }, 400)

      const emailBody: Record<string, unknown> = {
        from,
        to: Array.isArray(to) ? to : [to],
        subject,
      }
      if (html) emailBody.html = html
      if (text) emailBody.text = text
      if (replyTo) emailBody.reply_to = replyTo
      if (cc) emailBody.cc = Array.isArray(cc) ? cc : [cc]
      if (bcc) emailBody.bcc = Array.isArray(bcc) ? bcc : [bcc]

      const data = await resend('/emails', key, 'POST', emailBody)
      return json({ id: data.id })
    }

    if (action === 'domain.add') {
      const { name } = payload
      if (!name) return json({ error: 'name is required' }, 400)
      const data = await resend('/domains', key, 'POST', { name })
      return json({ id: data.id, name: data.name, status: data.status, records: data.records || [] })
    }

    if (action === 'domain.get') {
      const { domainId } = payload
      if (!domainId) return json({ error: 'domainId is required' }, 400)
      const data = await resend(`/domains/${domainId}`, key)
      return json({ id: data.id, name: data.name, status: data.status, records: data.records || [] })
    }

    if (action === 'domain.verify') {
      const { domainId } = payload
      if (!domainId) return json({ error: 'domainId is required' }, 400)
      const data = await resend(`/domains/${domainId}/verify`, key, 'POST')
      return json({ id: data.id || domainId, status: data.status || 'pending' })
    }

    return json({ error: `Unknown action: ${action}` }, 400)
  } catch (err) {
    console.error('relay-email error:', err)
    return json({ error: String((err as Error)?.message || err) }, 500)
  }
})
