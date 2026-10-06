// ============================================
// RELAY — PUBLIC WEB ORIGIN
// ============================================
// Links that leave the app (Stripe Checkout, the Stripe billing portal, the
// Supabase password-reset redirect) must point at the hosted web app, because
// the packaged desktop build serves the bundle from file:// — there
// `location.origin` is the string "null", so any URL built from it is dead.

/** Canonical public web origin (see public/CNAME). */
export const WEB_ORIGIN = 'https://relaydispatch.com.au';

// The web app is published under a path, not the origin root: relaydispatch.com.au
// keeps `/` free for the marketing website (the "homepage and the app fight over /"
// problem). Same origin, so Local mode's IndexedDB/localStorage is untouched — a
// subdomain would be a new origin and every browser Local user would see an empty app.
// Kept in step with the Pages build, see scripts/build-pages.mjs.
export const WEB_APP_PATH = '/app/';

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

function servedOverHttp(loc) {
  const origin = loc && typeof loc.origin === 'string' ? loc.origin : '';
  return /^https?:\/\//i.test(origin);
}

/**
 * The directory the app is served from, always leading and trailing slashed:
 * '/' on the Vite dev server, '/app/' once published. The hash router keeps the
 * pathname fixed for the whole session, so whatever the browser reports *is* the
 * base — no need to assume the deployed path.
 */
function appBasePath(loc) {
  let path = loc && typeof loc.pathname === 'string' ? loc.pathname : '/';
  if (path.endsWith('index.html')) path = path.slice(0, -'index.html'.length);
  if (!path.startsWith('/')) path = `/${path}`;
  return path.endsWith('/') ? path : `${path}/`;
}

/**
 * Base URL of the hosted web app, trailing slash included — e.g.
 * 'http://localhost:5173/' in dev, 'https://relaydispatch.com.au/app/' live.
 *
 * On file:// (the packaged desktop build) the pathname is the local
 * index.html, which means nothing to whoever opens the link, so the hosted
 * location is used instead.
 */
export function webAppBaseUrl() {
  const loc = typeof location !== 'undefined' ? location : null;
  if (!servedOverHttp(loc)) return `${WEB_ORIGIN}${WEB_APP_PATH}`;
  return `${webOrigin()}${appBasePath(loc)}`;
}

/**
 * Absolute URL to a hash-router route in the app, so the '/app/' base never
 * has to be spelled out at the call site:
 *   appUrl('/settings?tab=billing') → https://relaydispatch.com.au/app/#/settings?tab=billing
 */
export function appUrl(route = '') {
  const clean = String(route).replace(/^#?\/?/, '');
  return `${webAppBaseUrl()}#/${clean}`;
}
