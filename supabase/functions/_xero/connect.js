// ============================================
// RELAY — XERO CONNECT-FLOW DECISIONS
// ============================================
// The pure parts of relay-xero-connect / -callback / -status: where the browser
// goes back to, which Xero organisations a consent just granted, whether one is
// usable, and what the Settings card is shown. The edge functions do the I/O.
// Plain ESM, no Deno APIs (tested by supabase/tests/xero-connect.test.js).

import { PUBLIC_APP_BASE, fallbackAppBase, isAllowedReturnUrl } from '../_shared/returnUrls.js';

export const SETTINGS_RETURN_PATH = '/settings?tab=cost_centers';
export const SUPPORTED_CURRENCY = 'AUD';

/** Outcomes the callback reports back to Settings as ?xero=<outcome>. */
export const OUTCOMES = Object.freeze([
  'connected', 'choose', 'cancelled', 'error', 'no_org', 'unsupported_currency', 'tenant_in_use', 'forbidden',
]);

/**
 * The app URL the callback sends the admin back to, worked out when the flow
 * starts (the callback itself is a top-level redirect from Xero with no useful
 * Origin). Only RELAY's own hosts are allowed; anything else, including the
 * desktop build's file:// (no Origin), lands on the hosted app.
 */
export function connectReturnUrl({ origin, returnPath, extraOrigins = [] }) {
  const base = fallbackAppBase(origin, extraOrigins);
  const path = typeof returnPath === 'string' && /^\/[A-Za-z0-9/_?=&%.-]*$/.test(returnPath) && !returnPath.startsWith('//')
    ? returnPath
    : SETTINGS_RETURN_PATH;
  return `${base}/#${path}`;
}

/** Append ?xero=<outcome> to the hash route, re-checking the URL on the way out. */
export function callbackRedirect(returnUrl, outcome, extraOrigins = []) {
  const safe = isAllowedReturnUrl(returnUrl, extraOrigins) ? returnUrl : `${PUBLIC_APP_BASE}/#${SETTINGS_RETURN_PATH}`;
  const value = OUTCOMES.includes(outcome) ? outcome : 'error';
  const [beforeHash, hash = SETTINGS_RETURN_PATH] = safe.split('#');
  const route = hash.replace(/[?&]xero=[^&]*/g, '');
  const joiner = route.includes('?') ? '&' : '?';
  return `${beforeHash}#${route}${joiner}xero=${value}`;
}

/** Read a JWT's payload without verifying it (it came straight from Xero over TLS). */
export function jwtClaims(token) {
  try {
    const part = String(token).split('.')[1];
    const b64 = part.replace(/-/g, '+').replace(/_/g, '/');
    return JSON.parse(atob(b64 + '='.repeat((4 - (b64.length % 4)) % 4)));
  } catch {
    return {};
  }
}

/**
 * Organisation connections made by THIS consent. GET /connections lists every
 * org the user has ever connected to the app; each carries the authEventId of
 * the consent that created it, which the access token also names. Falls back to
 * all organisations if Xero sent no event id.
 */
export function grantedTenants(connections, accessToken) {
  const orgs = (Array.isArray(connections) ? connections : [])
    .filter((c) => c && c.tenantId && (c.tenantType || 'ORGANISATION') === 'ORGANISATION');
  const eventId = jwtClaims(accessToken).authentication_event_id;
  const fromThisConsent = eventId ? orgs.filter((c) => c.authEventId === eventId) : [];
  return (fromThisConsent.length ? fromThisConsent : orgs).map((c) => ({
    tenantId: String(c.tenantId),
    tenantName: String(c.tenantName || ''),
    connectionId: String(c.id || ''),
  }));
}

/** Can RELAY work with this organisation? (GET /Organisation → Organisations[0]) */
export function checkOrganisation(org) {
  const currency = String(org?.BaseCurrency || '').toUpperCase();
  if (currency !== SUPPORTED_CURRENCY) {
    return { ok: false, outcome: 'unsupported_currency', baseCurrency: currency || null, name: org?.Name || '' };
  }
  return { ok: true, baseCurrency: currency, name: String(org?.Name || '') };
}

/**
 * What relay-xero-status returns for the Settings card. Never includes tokens.
 * @param {object|null} row  xero_connections row
 */
export function statusPayload(row, { pendingJobs = 0, failedJobs = 0, tenants = [] } = {}) {
  if (!row || row.status === 'disconnected') {
    return { connected: false, status: 'disconnected', tenantName: null, baseCurrency: null, lastError: null, pendingJobs: 0, failedJobs: 0 };
  }
  const payload = {
    connected: row.status === 'active',
    status: row.status,
    tenantName: row.tenant_name || null,
    baseCurrency: row.base_currency || null,
    lastError: row.last_error || null,
    updatedAt: row.updated_at || null,
    pendingJobs,
    failedJobs,
  };
  if (row.status === 'choose_tenant') payload.tenants = tenants.map(({ tenantId, tenantName }) => ({ tenantId, tenantName }));
  return payload;
}

const byName = (a, b) => String(a.name).localeCompare(String(b.name));

/**
 * Trim Xero's chart of accounts, tracking categories and tax rates down to what
 * the Settings dropdowns need.
 */
export function summariseSettings({ accounts = [], trackingCategories = [], taxRates = [] } = {}) {
  const active = (a) => a && a.Status === 'ACTIVE';
  const shape = (a) => ({ code: String(a.Code || ''), name: String(a.Name || ''), type: String(a.Type || '') });
  const coded = accounts.filter((a) => active(a) && a.Code);
  return {
    // Sales and other income accounts an invoice line can be coded to.
    revenueAccounts: coded.filter((a) => a.Class === 'REVENUE').map(shape).sort(byName),
    // Accounts Xero will accept payments into: bank accounts, plus any account
    // flagged "enable payments" (how a Stripe clearing account is usually set up).
    paymentAccounts: coded.filter((a) => a.Type === 'BANK' || a.EnablePaymentsToAccount === true).map(shape).sort(byName),
    expenseAccounts: coded.filter((a) => a.Class === 'EXPENSE').map(shape).sort(byName),
    trackingCategories: trackingCategories
      .filter((c) => active(c))
      .map((c) => ({
        name: String(c.Name || ''),
        options: (c.Options || []).filter((o) => active(o)).map((o) => String(o.Name || '')).sort(),
      })),
    taxRates: taxRates
      .filter((t) => active(t) && t.CanApplyToRevenue !== false)
      .map((t) => ({ type: String(t.TaxType || ''), name: String(t.Name || ''), rate: Number(t.EffectiveRate ?? t.DisplayTaxRate ?? 0) })),
  };
}
