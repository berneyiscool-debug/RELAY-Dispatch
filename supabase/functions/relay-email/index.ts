import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

// ============================================
// RELAY — EMAIL (Resend, shared sending domain)
// ============================================
// One entry point for all outbound email. Every tenant sends through RELAY's
// Resend account on RELAY's verified domain — customers do no setup at all.
//
//   quotes.testcompany@relaydispatch.com.au   quote
//   billing.testcompany@relaydispatch.com.au  invoice | receipt | reminder
//   hello.testcompany@relaydispatch.com.au    portal_invite | custom
//
// SECURITY — the From address is derived HERE, from the caller's JWT, and a
// client-supplied `from` is ignored. Because every tenant shares one verified
// domain, trusting the client would let any authenticated user send mail as any
// other tenant (billing.acompetitor@…) or as RELAY itself (support@…). The
// company's slug comes from companies.email_slug, which is unique-indexed and
// not writable through the settings UI. See migration 011.
//
// Replies go to the tenant's real address via reply_to — the shared-domain
// mailbox is not monitored.
//
// Actions (body.action, default "send"):
//   send          { to, subject, html, text?, template?, replyTo?, cc?, bcc? }
//                     -> { id, from }
//   sender.get    {}                            -> { addresses, replyTo, mode, ... }
//   domain.add    { name }                      -> { id, name, status, records }
//   domain.get    { domainId }                  -> { id, name, status, records }
//   domain.verify { domainId }                  -> { id, status }
//
// The domain.* actions remain for the "advanced: use your own domain" path and
// are restricted to admins/managers.
//
// Env: RESEND_API_KEY, RELAY_EMAIL_DOMAIN (default relaydispatch.com.au),
//      RELAY_EMAIL_DAILY_CAP (default 500), SUPABASE_URL,
//      SUPABASE_SERVICE_ROLE_KEY.

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
const DEFAULT_DOMAIN = 'relaydispatch.com.au'

// Which mailbox each kind of email appears to come from.
const ROLE_PREFIX: Record<string, string> = {
  quote: 'quotes',
  invoice: 'billing',
  receipt: 'billing',
  reminder: 'billing',
  portal_invite: 'hello',
  custom: 'hello',
}

// Anything landing in a mail header must not carry CR/LF (header injection) and
// a display name must not carry quotes or angle brackets (it would break out of
// the "Name <addr>" construction).
function headerSafe(v: unknown, max = 200): string {
  return String(v ?? '').replace(/[\r\n]+/g, ' ').slice(0, max).trim()
}
function displayNameSafe(v: unknown): string {
  return headerSafe(v, 78).replace(/["<>\\]/g, '').trim()
}
function isEmail(v: unknown): boolean {
  const s = String(v ?? '').trim()
  return /^[^\s@,;]+@[^\s@,;]+\.[^\s@,;]+$/.test(s) && s.length <= 254
}

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

    const supabaseUrl = Deno.env.get('SUPABASE_URL')
    const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
    if (!supabaseUrl || !serviceKey) throw new Error('SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY not configured')

    const domain = Deno.env.get('RELAY_EMAIL_DOMAIN') || DEFAULT_DOMAIN
    const dailyCap = Number(Deno.env.get('RELAY_EMAIL_DAILY_CAP') || '500')

    const admin = createClient(supabaseUrl, serviceKey)

    // ── 1. Who is calling? ────────────────────────────────────────────
    const authHeader = req.headers.get('Authorization') || ''
    if (!authHeader.startsWith('Bearer ')) return json({ error: 'Unauthorized: missing token' }, 401)

    const { data: { user }, error: authErr } = await admin.auth.getUser(authHeader.substring(7))
    if (authErr || !user) return json({ error: 'Unauthorized: invalid token' }, 401)

    const { data: profile, error: profErr } = await admin
      .from('profiles').select('company_id, role, name, email').eq('id', user.id).single()
    if (profErr || !profile?.company_id) return json({ error: 'No company is linked to this user' }, 403)

    const { data: company, error: compErr } = await admin
      .from('companies').select('id, name, email, email_slug, email_reply_to, settings')
      .eq('id', profile.company_id).single()
    if (compErr || !company) return json({ error: 'Company not found' }, 403)

    // ── 2. Resolve this tenant's sending identity (server-side only) ──
    const mailer = (company.settings?.mailer ?? {}) as Record<string, unknown>
    const ownDomain =
      mailer.mode === 'own-domain' &&
      mailer.domainStatus === 'verified' &&
      isEmail(mailer.fromAddress)

    const displayName = displayNameSafe(mailer.fromName || company.name || 'RELAY') || 'RELAY'

    const senderFor = (template: string) => {
      if (ownDomain) return `${displayName} <${String(mailer.fromAddress).trim()}>`
      const prefix = ROLE_PREFIX[template] || ROLE_PREFIX.custom
      return `${displayName} <${prefix}.${company.email_slug}@${domain}>`
    }

    // Replies must reach the business, not the shared RELAY mailbox.
    const defaultReplyTo = [company.email_reply_to, company.email, mailer.replyTo, profile.email]
      .find((c) => isEmail(c)) as string | undefined

    const payload = await req.json().catch(() => ({}))
    const action = payload.action || 'send'

    // ── sender.get — what the Settings screen displays ────────────────
    if (action === 'sender.get') {
      if (!company.email_slug && !ownDomain) {
        return json({ error: 'This company has no sending identity yet. Run migration 011.' }, 409)
      }
      const addresses: Record<string, string> = {}
      for (const t of Object.keys(ROLE_PREFIX)) addresses[t] = senderFor(t)
      return json({
        mode: ownDomain ? 'own-domain' : 'relay',
        domain: ownDomain ? String(mailer.fromAddress).split('@')[1] : domain,
        slug: company.email_slug,
        displayName,
        replyTo: defaultReplyTo || null,
        addresses,
        dailyCap,
      })
    }

    if (action === 'send') {
      const { to, subject, html, text, replyTo, cc, bcc } = payload
      const template = String(payload.template || 'custom')

      const recipients = (Array.isArray(to) ? to : [to]).map((r: unknown) => String(r ?? '').trim()).filter(Boolean)
      if (!recipients.length) return json({ error: 'to is required' }, 400)
      if (recipients.length > 25) return json({ error: 'Too many recipients (max 25)' }, 400)
      const bad = recipients.find((r) => !isEmail(r))
      if (bad) return json({ error: `Not a valid email address: ${bad}` }, 400)
      if (!subject) return json({ error: 'subject is required' }, 400)
      if (!html && !text) return json({ error: 'html or text is required' }, 400)
      if (!ownDomain && !company.email_slug) {
        return json({ error: 'This company has no sending identity yet. Run migration 011.' }, 409)
      }

      // Shared domain means shared reputation — one tenant blasting mail hurts
      // deliverability for everyone, so cap each company per day.
      const since = new Date()
      since.setUTCHours(0, 0, 0, 0)
      const { count } = await admin
        .from('email_log')
        .select('id', { count: 'exact', head: true })
        .eq('company_id', company.id)
        .eq('status', 'sent')
        .gte('created_at', since.toISOString())
      if ((count ?? 0) >= dailyCap) {
        return json({ error: `Daily email limit reached (${dailyCap}). Try again tomorrow or contact RELAY support.` }, 429)
      }

      const from = senderFor(template)
      const emailBody: Record<string, unknown> = {
        from,
        to: recipients,
        subject: headerSafe(subject, 200),
      }
      if (html) emailBody.html = html
      if (text) emailBody.text = text

      const rt = isEmail(replyTo) ? String(replyTo).trim() : defaultReplyTo
      if (rt) emailBody.reply_to = rt
      if (cc) {
        const list = (Array.isArray(cc) ? cc : [cc]).map((v: unknown) => String(v ?? '').trim()).filter(isEmail)
        if (list.length) emailBody.cc = list
      }
      if (bcc) {
        const list = (Array.isArray(bcc) ? bcc : [bcc]).map((v: unknown) => String(v ?? '').trim()).filter(isEmail)
        if (list.length) emailBody.bcc = list
      }

      const data = await resend('/emails', key, 'POST', emailBody)
      return json({ id: data.id, from })
    }

    // ── domain.* — the advanced "bring your own domain" path ──────────
    // These mutate RELAY's Resend account, so keep them to admins/managers.
    if (action.startsWith('domain.')) {
      if (profile.role !== 'admin' && profile.role !== 'manager') {
        return json({ error: 'Only administrators can manage sending domains.' }, 403)
      }

      if (action === 'domain.add') {
        const name = String(payload.name || '').trim().toLowerCase()
        if (!name) return json({ error: 'name is required' }, 400)
        if (!/^[a-z0-9.-]+\.[a-z]{2,}$/.test(name)) return json({ error: 'That does not look like a domain name.' }, 400)
        // Nobody gets to register RELAY's own domain under their tenant.
        if (name === domain || name.endsWith(`.${domain}`)) {
          return json({ error: `${domain} is managed by RELAY and cannot be added.` }, 403)
        }
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
    }

    return json({ error: `Unknown action: ${action}` }, 400)
  } catch (err) {
    console.error('relay-email error:', err)
    return json({ error: String((err as Error)?.message || err) }, 500)
  }
})
