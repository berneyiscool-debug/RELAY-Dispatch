// ============================================
// RELAY — BACKUP EMAIL CONFIRMATION
// ============================================
// A user an administrator adds signs in with a relay.internal address no
// mailbox receives; their backup email is the real one, and they confirm it
// before they can use RELAY. invite-user starts a confirmation when it creates
// a user or changes their address, and relay-confirm-email redeems links and
// sends fresh ones.
//
// Only a SHA-256 of each token is stored (backup_email_confirmations), along
// with the address it was sent to, so a link for an address that has since
// been replaced confirms nothing.
//
// Plain ESM, no Deno APIs: importable from the edge functions and node:test.

export const PUBLIC_APP_BASE = 'https://relaydispatch.com.au/app/'
export const TOKEN_TTL_MS = 48 * 60 * 60 * 1000
export const RESEND_COOLDOWN_MS = 60 * 1000
const DEFAULT_DOMAIN = 'relaydispatch.com.au'

export async function sha256Hex(value) {
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(String(value)))
  return Array.from(new Uint8Array(digest)).map((b) => b.toString(16).padStart(2, '0')).join('')
}

export function newToken() {
  const bytes = crypto.getRandomValues(new Uint8Array(32))
  return Array.from(bytes).map((b) => b.toString(16).padStart(2, '0')).join('')
}

/** A token is 64 lowercase hex characters; anything else is not worth a lookup. */
export function isTokenShaped(token) {
  return typeof token === 'string' && /^[0-9a-f]{64}$/.test(token)
}

export function confirmationLink(token, appBase = PUBLIC_APP_BASE) {
  const base = appBase.endsWith('/') ? appBase : `${appBase}/`
  return `${base}#/confirm-email?token=${encodeURIComponent(token)}`
}

function escapeHtml(value) {
  return String(value == null ? '' : value)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;').replace(/'/g, '&#39;')
}

export function confirmationEmail({ name, companyName, link }) {
  const who = String(name || '').trim() || 'there'
  const company = String(companyName || '').trim() || 'your company'
  const subject = `Confirm your email for ${company} on RELAY`
  const text = [
    `Hi ${who},`,
    '',
    `${company} has added you to RELAY Dispatch. Confirm this email address to start using your account:`,
    '',
    link,
    '',
    'This link works once and expires in 48 hours. If you were not expecting this, you can ignore it.',
  ].join('\n')
  const html = `
    <p>Hi ${escapeHtml(who)},</p>
    <p>${escapeHtml(company)} has added you to RELAY Dispatch. Confirm this email address to start using your account.</p>
    <p><a href="${escapeHtml(link)}" style="display:inline-block;padding:10px 18px;background:#FF5C00;color:#ffffff;border-radius:6px;text-decoration:none;font-weight:600">Confirm email</a></p>
    <p style="color:#666;font-size:13px">Or paste this link into your browser:<br>${escapeHtml(link)}</p>
    <p style="color:#666;font-size:13px">This link works once and expires in 48 hours. If you were not expecting this, you can ignore it.</p>
  `
  return { subject, text, html }
}

/**
 * Store a fresh token for `userId`, replacing any earlier ones. Refuses when a
 * link went out less than RESEND_COOLDOWN_MS ago, so the resend button cannot be
 * used to flood an inbox. Returns `{ token }` or `{ error, retryAfterMs }`.
 */
export async function issueConfirmationToken({ admin, userId, email, now = Date.now(), force = false }) {
  if (!force) {
    const { data: recent, error: recentError } = await admin
      .from('backup_email_confirmations')
      .select('created_at')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(1)
    if (recentError) return { error: `Could not check earlier confirmation emails: ${recentError.message}` }
    const last = recent && recent[0] ? Date.parse(recent[0].created_at) : NaN
    if (Number.isFinite(last) && now - last < RESEND_COOLDOWN_MS) {
      return { error: 'A confirmation email was sent less than a minute ago. Wait a moment and try again.', retryAfterMs: RESEND_COOLDOWN_MS - (now - last) }
    }
  }

  const { error: clearError } = await admin.from('backup_email_confirmations').delete().eq('user_id', userId)
  if (clearError) return { error: `Could not replace the earlier confirmation link: ${clearError.message}` }

  const token = newToken()
  const { error: insertError } = await admin.from('backup_email_confirmations').insert({
    token_hash: await sha256Hex(token),
    user_id: userId,
    email,
    created_at: new Date(now).toISOString(),
    expires_at: new Date(now + TOKEN_TTL_MS).toISOString(),
  })
  if (insertError) return { error: `Could not create the confirmation link: ${insertError.message}` }
  return { token }
}

export async function sendViaResend({ resendKey, domain = DEFAULT_DOMAIN, to, subject, text, html, fetchImpl = fetch }) {
  const res = await fetchImpl('https://api.resend.com/emails', {
    method: 'POST',
    headers: { Authorization: `Bearer ${resendKey}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ from: `RELAY Dispatch <no-reply@${domain}>`, to: [to], subject, text, html }),
  })
  if (!res.ok) {
    const data = await res.json().catch(() => ({}))
    throw new Error(`Resend HTTP ${res.status}: ${data?.message || 'send failed'}`)
  }
}

/**
 * Email `userId` a confirmation link for their current backup email.
 * Returns `{ sent: true, email }` or `{ error, status, retryAfterMs? }`.
 */
export async function startBackupEmailConfirmation({ admin, userId, resendKey, domain, appBase, now = Date.now(), force = false, fetchImpl }) {
  if (!resendKey) return { error: 'Email sending is not configured (RESEND_API_KEY).', status: 500 }

  const { data: profile, error: profileError } = await admin
    .from('profiles')
    .select('id, name, company_id, backup_email, backup_email_confirmed_at')
    .eq('id', userId)
    .maybeSingle()
  if (profileError) return { error: `Could not read the user: ${profileError.message}`, status: 500 }
  if (!profile) return { error: 'That user no longer exists.', status: 404 }
  if (!profile.backup_email) return { error: 'This user has no backup email to confirm.', status: 400 }
  if (profile.backup_email_confirmed_at) return { error: 'This backup email is already confirmed.', status: 409 }

  const { data: company } = await admin.from('companies').select('name').eq('id', profile.company_id).maybeSingle()

  const issued = await issueConfirmationToken({ admin, userId, email: profile.backup_email, now, force })
  if (issued.error) return { error: issued.error, status: issued.retryAfterMs ? 429 : 500, retryAfterMs: issued.retryAfterMs }

  const message = confirmationEmail({
    name: profile.name,
    companyName: company && company.name,
    link: confirmationLink(issued.token, appBase),
  })
  try {
    await sendViaResend({ resendKey, domain, to: profile.backup_email, ...message, fetchImpl })
  } catch (err) {
    return { error: `The confirmation email could not be sent: ${err.message}`, status: 502 }
  }
  return { sent: true, email: profile.backup_email }
}

/**
 * Redeem a link. Returns `{ confirmed: true }` or `{ error, status }`.
 * The token is single-use: every pending link for the user is cleared on success.
 */
export async function confirmBackupEmail({ admin, token, now = Date.now() }) {
  if (!isTokenShaped(token)) return { error: 'This confirmation link is not valid.', status: 400 }

  const { data: row, error: rowError } = await admin
    .from('backup_email_confirmations')
    .select('user_id, email, expires_at')
    .eq('token_hash', await sha256Hex(token))
    .maybeSingle()
  if (rowError) return { error: `Could not check the link: ${rowError.message}`, status: 500 }
  if (!row) return { error: 'This confirmation link is invalid or has already been used.', status: 404 }
  if (Date.parse(row.expires_at) <= now) return { error: 'This confirmation link has expired. Ask for a new one from the sign-in screen.', status: 410 }

  const { data: profile, error: profileError } = await admin
    .from('profiles')
    .select('backup_email')
    .eq('id', row.user_id)
    .maybeSingle()
  if (profileError) return { error: `Could not read the account: ${profileError.message}`, status: 500 }
  if (!profile || String(profile.backup_email || '').toLowerCase() !== String(row.email).toLowerCase()) {
    return { error: 'This link was for an email address that has since changed. Ask for a new one.', status: 409 }
  }

  const { error: updateError } = await admin
    .from('profiles')
    .update({ backup_email_confirmed_at: new Date(now).toISOString() })
    .eq('id', row.user_id)
  if (updateError) return { error: `Could not confirm the email: ${updateError.message}`, status: 500 }

  await admin.from('backup_email_confirmations').delete().eq('user_id', row.user_id)
  return { confirmed: true }
}
