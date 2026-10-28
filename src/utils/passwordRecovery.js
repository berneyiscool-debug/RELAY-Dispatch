// ============================================
// RELAY — PASSWORD RESET LINKS
// ============================================
// A reset email lands on the app base with the recovery token as the URL's
// fragment: `/app/#access_token=…&refresh_token=…&type=recovery`, or
// `/app/#error=access_denied&error_code=otp_expired&…` when the link is stale.
// The hash router reads that fragment as a route it doesn't know and main.js
// rewrites it to `#/login` straight away, so the token was lost and the user
// just saw the launch screen.
//
// This module is imported by main.js ahead of the router and the Supabase
// client. On load it lifts the token out of the address bar (so neither the
// router nor Supabase's own URL detection sees it, and it isn't left in the
// history) and points the hash at `#/reset-password`, whose page takes the
// token from here once.

export const RESET_ROUTE = '/reset-password';

/**
 * What a URL fragment says about a reset link, or null when it isn't one.
 * @param {string} hash  location.hash, with or without the leading '#'
 * @returns {null | {kind: 'recovery', accessToken: string, refreshToken: string}
 *                | {kind: 'error', message: string}}
 */
export function parseRecoveryHash(hash) {
  const raw = String(hash || '').replace(/^#/, '');
  // A hash route (`#/jobs?x=1`) is never a Supabase callback.
  if (!raw || raw.startsWith('/')) return null;
  const params = new URLSearchParams(raw);
  if (params.get('type') === 'recovery' && params.get('access_token') && params.get('refresh_token')) {
    return { kind: 'recovery', accessToken: params.get('access_token'), refreshToken: params.get('refresh_token') };
  }
  if (params.get('error_code') || params.get('error')) {
    const expired = params.get('error_code') === 'otp_expired';
    return {
      kind: 'error',
      message: expired
        ? 'This reset link has expired or has already been used.'
        : (params.get('error_description') || 'This reset link could not be used.'),
    };
  }
  return null;
}

let pending = null;

function captureFromLocation() {
  if (typeof window === 'undefined' || !window.location) return;
  const found = parseRecoveryHash(window.location.hash);
  if (!found) return;
  pending = found;
  const { pathname, search } = window.location;
  try {
    window.history.replaceState(null, '', `${pathname}${search}#${RESET_ROUTE}`);
  } catch {
    window.location.hash = `#${RESET_ROUTE}`;
  }
}

captureFromLocation();

/** The captured reset link, handed out once. */
export function takeRecovery() {
  const out = pending;
  pending = null;
  return out;
}
