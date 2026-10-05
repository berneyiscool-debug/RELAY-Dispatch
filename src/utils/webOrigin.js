// ============================================
// RELAY — PUBLIC WEB ORIGIN
// ============================================
// Links that leave the app (Stripe Checkout, the Stripe billing portal, the
// Supabase password-reset redirect) must point at the hosted web app, because
// the packaged desktop build serves the bundle from file:// — there
// `location.origin` is the string "null", so any URL built from it is dead.

/** Canonical public web origin (see public/CNAME). */
export const WEB_ORIGIN = 'https://relaydispatch.com.au';

/**
 * Origin to build user-facing links on.
 *
 * Served over http(s) — the website and the Vite dev server — this is the
 * current origin. Everywhere else (desktop build on file://, non-browser
 * tooling) it falls back to the hosted web app.
 */
export function webOrigin() {
  const loc = typeof location !== 'undefined' ? location : null;
  const origin = loc && typeof loc.origin === 'string' ? loc.origin : '';
  return /^https?:\/\//i.test(origin) ? origin.replace(/\/+$/, '') : WEB_ORIGIN;
}
