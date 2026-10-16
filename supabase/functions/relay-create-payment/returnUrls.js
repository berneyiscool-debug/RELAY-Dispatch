// ============================================
// RELAY — CHECKOUT RETURN URL ALLOW-LIST
// ============================================
// relay-create-payment is public: anyone holding an invoice id can mint a real
// Stripe Checkout for it. If the caller could also choose where Stripe sends the
// customer afterwards, a genuine checkout page could hand a paying customer
// straight to a look-alike site ("payment failed, re-enter your card"). So the
// success/cancel URLs, and the Origin-derived fallback, are only honoured when
// they point back at RELAY itself.
//
// Plain ESM with no Deno APIs, so supabase/tests can exercise it directly.

export const PUBLIC_APP_BASE = 'https://relaydispatch.com.au/app'

const PUBLIC_HOSTS = new Set(['relaydispatch.com.au', 'www.relaydispatch.com.au'])
const LOCAL_HOSTS = new Set(['localhost', '127.0.0.1', '[::1]'])

/**
 * Whether a URL is somewhere RELAY is actually served from: the public site over
 * https, or a local dev server. `extraOrigins` (exact origins, e.g. a preview
 * deploy) comes from the RELAY_RETURN_ORIGINS secret.
 */
export function isAllowedReturnUrl(value, extraOrigins = []) {
  if (typeof value !== 'string' || !value || value.length > 2048) return false
  let url
  try { url = new URL(value) } catch { return false }
  if (url.username || url.password) return false
  if (url.protocol === 'https:' && PUBLIC_HOSTS.has(url.hostname) && !url.port) return true
  if ((url.protocol === 'http:' || url.protocol === 'https:') && LOCAL_HOSTS.has(url.hostname)) return true
  return extraOrigins.includes(url.origin)
}

/** Parse the comma-separated RELAY_RETURN_ORIGINS secret into exact origins. */
export function parseExtraOrigins(raw) {
  return String(raw || '')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean)
    .map((s) => { try { return new URL(s).origin } catch { return null } })
    .filter((o) => o && o !== 'null')
}

/**
 * Base of the app to fall back to when the caller passes no (or a rejected) URL.
 * The public site serves the app under /app; a trusted dev or preview origin
 * serves it from its root; anything else — no Origin (desktop, file://) or a
 * foreign one — gets the hosted app.
 */
export function fallbackAppBase(origin, extraOrigins = []) {
  const o = String(origin || '').replace(/\/+$/, '')
  if (!o || !isAllowedReturnUrl(o, extraOrigins)) return PUBLIC_APP_BASE
  const host = new URL(o).hostname
  return PUBLIC_HOSTS.has(host) ? `${o}/app` : o
}

/** The success/cancel pair Stripe should actually use. */
export function resolveReturnUrls({ successUrl, cancelUrl, origin, invoiceRef, extraOrigins = [] }) {
  const base = fallbackAppBase(origin, extraOrigins)
  return {
    successUrl: isAllowedReturnUrl(successUrl, extraOrigins)
      ? successUrl
      : `${base}/#/invoices?paid=${encodeURIComponent(invoiceRef)}`,
    cancelUrl: isAllowedReturnUrl(cancelUrl, extraOrigins) ? cancelUrl : `${base}/#/invoices`,
  }
}
