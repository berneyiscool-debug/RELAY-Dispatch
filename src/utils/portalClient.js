// RELAY — PORTAL CLIENT (anonymous magic-link access)
//
// The customer and contractor portals are the only pages reachable without a
// session, and RLS correctly withholds every row from a signed-out visitor. The
// portal therefore cannot read the store like a staff page does; it asks the
// `relay-portal` function, which resolves the token with the service role and
// hands back exactly the rows the link is entitled to.
//
// This module is the single place that talks to that function, so the two portals
// share one request shape, one grant store and one failure vocabulary.

import { supabase } from './supabase.js';
import { store } from '../data/store.js';

// The unlock grant is per tab, not per browser: closing the tab should end the
// session, and a second tab should have to enter the PIN again.
const GRANT_PREFIX = 'relay_portal_grant_';

// `renderCustomerPortal` re-renders itself after unlocking, and the page body
// re-reads the bundle on every tab switch. Both should reuse the answer the server
// already gave rather than re-query it.
const bundles = new Map();

export function portalGrantKey(kind, token) {
  return `${GRANT_PREFIX}${kind}_${token}`;
}

export function readPortalGrant(kind, token) {
  try {
    return sessionStorage.getItem(portalGrantKey(kind, token)) || null;
  } catch (_) {
    return null;
  }
}

export function rememberPortalGrant(kind, token, grant) {
  try {
    if (grant) sessionStorage.setItem(portalGrantKey(kind, token), grant);
    else sessionStorage.removeItem(portalGrantKey(kind, token));
  } catch (_) { /* private mode: the visitor simply re-enters the PIN on reload */ }
}

/** Forgets everything held for one link: its grant, its cached bundle, its scope. */
export function forgetPortal(kind, token) {
  rememberPortalGrant(kind, token, null);
  if (kind && token) bundles.delete(`${kind}:${token}`);
  store.clearPortalScope();
}

/**
 * Invokes the resolver. The function answers with a `status` for every outcome the
 * portal can render, so a non-2xx response here is a transport or configuration
 * failure and is reported as one.
 */
async function invokePortal(body) {
  const { data, error } = await supabase.functions.invoke('relay-portal', { body });
  if (error) {
    // supabase-js turns every non-2xx into an error, but the resolver also refuses
    // individual actions with a 403 and a readable reason ("Current PIN is
    // incorrect."). That is an answer, not a failure, so it is passed through.
    let parsed = null;
    try {
      if (error.context && typeof error.context.text === 'function') {
        const text = await error.context.text();
        if (text) { try { parsed = JSON.parse(text); } catch { parsed = null; } }
      }
    } catch (_) { /* fall through to the transport message */ }
    if (parsed && typeof parsed === 'object' && parsed.error) {
      return { status: 'denied', ...parsed };
    }
    return { status: 'error', error: error.message || String(error) };
  }
  if (!data || typeof data !== 'object') return { status: 'error', error: 'The portal is unavailable.' };
  if (data.error && !data.status) return { ...data, status: 'error' };
  return data;
}

/**
 * Resolves a magic link and, once it is open, fills the store with the visitor's
 * scope so the rest of the page reads it exactly as it always has.
 *
 * @returns one of `ok`, `locked`, `passcode_setup`, `offline`, `throttled`,
 *          `invalid` or `error`, plus whatever that status needs to render.
 */
export async function loadPortal(kind, token, { force = false } = {}) {
  const key = `${kind}:${token}`;
  const cached = bundles.get(key);
  // Re-filling the store from the cached bundle matters after the operator opened the
  // link, navigated into the app (which ends the portal scope) and came back: the
  // answer is still good, the scope is not.
  if (cached && cached.status === 'ok' && !force) return applyBundle(kind, token, cached);

  const result = await invokePortal({ action: 'load', kind, token, grant: readPortalGrant(kind, token) });
  return settle(kind, token, result);
}

/** A PIN entry, a PIN change, or a portal write. Keeps the grant in step. */
export async function portalAction(kind, token, body) {
  const result = await invokePortal({ ...body, kind, token, grant: readPortalGrant(kind, token) });
  return settle(kind, token, result);
}

/** Reads a cached bundle without turning a miss into a request. */
export function portalBundle(kind, token) {
  return bundles.get(`${kind}:${token}`) || null;
}

// Answers that describe the page itself. A `denied` action answer says nothing
// about the link, so it is never cached and never disturbs a live session.
const PAGE_STATUSES = new Set(['ok', 'locked', 'passcode_setup', 'offline', 'throttled', 'invalid']);

// An open link is the only answer that also fills the store: the locked and setup
// screens render from the few public fields the resolver released, and no related
// rows travel until the PIN is in.
function applyBundle(kind, token, result) {
  rememberPortalGrant(kind, token, result.grant);
  store.hydratePortalScope({
    kind,
    token,
    record: result.record,
    settings: result.settings,
    tables: result.tables,
    grant: result.grant || readPortalGrant(kind, token),
  });
  return result;
}

function settle(kind, token, result) {
  if (result.status === 'ok') {
    // The resolver mints a new grant on unlock and on a PIN change, and echoes the
    // presented one back on a plain load; storing whatever came back covers all three.
    applyBundle(kind, token, result);
  } else if (result.status === 'invalid') {
    // A link that no longer resolves must not leave the previous visitor's rows in
    // the store for the next render to read. A transport failure deliberately does
    // not come through here: it says nothing about the link, so the grant survives
    // a dropped connection.
    forgetPortal(kind, token);
  }
  if (PAGE_STATUSES.has(result.status)) bundles.set(`${kind}:${token}`, result);
  return result;
}
