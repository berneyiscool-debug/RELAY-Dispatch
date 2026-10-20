// ============================================
// RELAY — XERO ACCOUNTING API CLIENT
// ============================================
// A thin fetch wrapper for one connected organisation. It attaches the bearer
// token and xero-tenant-id, refreshes the access token shortly before it
// expires (and once more on a 401), and turns Xero's failures into a typed
// XeroError the sync worker can act on:
//
//   rate_limited  → reschedule after retryAfterSec (minute vs daily limit)
//   auth_revoked  → mark the connection needs_reauth, park the company's jobs
//   validation    → fail the job and show Xero's message on the invoice
//   not_found     → the Xero record is gone
//   server/network → retry with backoff
//
// `fetch` and `now` are injected so tests run with no network. Plain ESM.

import { refreshRequest, parseTokenResponse } from './oauth.js';

export const XERO_API_BASE = 'https://api.xero.com/api.xro/2.0';

// Refresh when less than this much life is left, so a request never races expiry.
const REFRESH_MARGIN_MS = 2 * 60 * 1000;

export class XeroError extends Error {
  /**
   * @param {'rate_limited'|'auth_revoked'|'validation'|'not_found'|'server'|'network'} kind
   */
  constructor(kind, message, { status = 0, retryAfterSec = 0, limit = '', details = [] } = {}) {
    super(message);
    this.name = 'XeroError';
    this.kind = kind;
    this.status = status;
    this.retryAfterSec = retryAfterSec;
    this.limit = limit;
    this.details = details;
  }

  /** Worth trying the same request again later? */
  get retryable() {
    return this.kind === 'rate_limited' || this.kind === 'server' || this.kind === 'network';
  }
}

/** Pull human-readable messages out of Xero's ValidationException body. */
export function validationMessages(body) {
  if (!body || typeof body !== 'object') return [];
  const out = [];
  const add = (m) => { if (m && !out.includes(m)) out.push(String(m)); };
  for (const el of Array.isArray(body.Elements) ? body.Elements : []) {
    for (const v of Array.isArray(el?.ValidationErrors) ? el.ValidationErrors : []) add(v?.Message);
    for (const li of Array.isArray(el?.LineItems) ? el.LineItems : []) {
      for (const v of Array.isArray(li?.ValidationErrors) ? li.ValidationErrors : []) add(v?.Message);
    }
  }
  if (!out.length) add(body.Detail || body.Message || body.Title);
  return out;
}

/** Map an unsuccessful Xero response to a XeroError. */
export function toXeroError(status, body, headers) {
  const get = (name) => (headers && typeof headers.get === 'function' ? headers.get(name) : null);
  if (status === 429) {
    const limit = String(get('X-Rate-Limit-Problem') || '').toLowerCase();
    const retryAfter = Number(get('Retry-After'));
    return new XeroError('rate_limited', `Xero rate limit reached (${limit || 'unknown'})`, {
      status,
      limit,
      retryAfterSec: Number.isFinite(retryAfter) && retryAfter > 0 ? retryAfter : limit === 'day' ? 3600 : 60,
    });
  }
  if (status === 401 || status === 403) {
    return new XeroError('auth_revoked', 'Xero rejected the connection. An admin needs to reconnect Xero.', { status });
  }
  if (status === 404) return new XeroError('not_found', 'Record not found in Xero', { status });
  if (status === 400) {
    const details = validationMessages(body);
    return new XeroError('validation', details.join('; ') || 'Xero rejected the request', { status, details });
  }
  return new XeroError('server', `Xero HTTP ${status}`, { status });
}

/**
 * @param {object} opts
 * @param {{tenantId:string, accessToken:string, refreshToken:string, accessExpiresAt:string}} opts.connection
 *   decrypted connection state
 * @param {(tokens: {accessToken, refreshToken, accessExpiresAt, scopes}) => Promise<void>} opts.onTokens
 *   persist rotated tokens; it MUST succeed before the new tokens are used, since
 *   the old refresh token stops working once Xero rotates it
 */
export function createXeroClient({ connection, clientId, clientSecret, onTokens, fetch: fetchImpl = globalThis.fetch, now = () => Date.now() }) {
  if (!connection?.tenantId) throw new Error('A connected tenant is required');
  const state = { ...connection };
  const limits = { minuteRemaining: null, dayRemaining: null, appMinuteRemaining: null };

  async function refresh() {
    const { url, init } = refreshRequest({ refreshToken: state.refreshToken, clientId, clientSecret });
    let res;
    try {
      res = await fetchImpl(url, init);
    } catch (err) {
      throw new XeroError('network', `Could not reach Xero to refresh: ${err?.message || err}`);
    }
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      // invalid_grant = refresh token expired, revoked, or already rotated.
      if (res.status === 400 || res.status === 401) {
        throw new XeroError('auth_revoked', `Xero refresh failed (${data?.error || res.status}). An admin needs to reconnect Xero.`, { status: res.status });
      }
      throw new XeroError('server', `Xero refresh HTTP ${res.status}`, { status: res.status });
    }
    const tokens = parseTokenResponse(data, { now: now() });
    if (onTokens) await onTokens(tokens);
    Object.assign(state, tokens);
    return tokens;
  }

  function needsRefresh() {
    const expires = Date.parse(state.accessExpiresAt || '');
    return !state.accessToken || !Number.isFinite(expires) || expires - now() < REFRESH_MARGIN_MS;
  }

  function readLimits(headers) {
    const num = (name) => {
      const v = headers?.get?.(name);
      return v == null || v === '' ? null : Number(v);
    };
    limits.minuteRemaining = num('X-MinLimit-Remaining') ?? limits.minuteRemaining;
    limits.dayRemaining = num('X-DayLimit-Remaining') ?? limits.dayRemaining;
    limits.appMinuteRemaining = num('X-AppMinLimit-Remaining') ?? limits.appMinuteRemaining;
  }

  /**
   * @param {'GET'|'POST'|'PUT'|'DELETE'} method
   * @param {string} path e.g. '/Invoices' (relative to the Accounting API) or an absolute URL
   * @param {{body?:unknown, query?:Record<string,string|number|boolean>, idempotencyKey?:string, ifModifiedSince?:string}} [options]
   */
  async function request(method, path, { body, query, idempotencyKey, ifModifiedSince } = {}) {
    if (needsRefresh()) await refresh();

    const url = new URL(/^https?:/.test(path) ? path : `${XERO_API_BASE}${path}`);
    for (const [k, v] of Object.entries(query || {})) {
      if (v !== undefined && v !== null) url.searchParams.set(k, String(v));
    }

    const send = async () => {
      const headers = {
        Authorization: `Bearer ${state.accessToken}`,
        'xero-tenant-id': state.tenantId,
        Accept: 'application/json',
      };
      if (body !== undefined) headers['Content-Type'] = 'application/json';
      if (idempotencyKey) headers['Idempotency-Key'] = String(idempotencyKey).slice(0, 128);
      if (ifModifiedSince) headers['If-Modified-Since'] = ifModifiedSince;
      try {
        return await fetchImpl(url.toString(), {
          method,
          headers,
          body: body === undefined ? undefined : JSON.stringify(body),
        });
      } catch (err) {
        throw new XeroError('network', `Could not reach Xero: ${err?.message || err}`);
      }
    };

    let res = await send();
    // A token can be revoked or invalidated early; refresh once and retry.
    if (res.status === 401) {
      await refresh();
      res = await send();
    }
    readLimits(res.headers);

    if (res.status === 304) return { status: 304, data: null };
    const text = await res.text();
    let data = null;
    if (text) {
      try { data = JSON.parse(text); } catch { data = { Message: text.slice(0, 500) }; }
    }
    if (!res.ok) throw toXeroError(res.status, data, res.headers);
    return { status: res.status, data };
  }

  return {
    request,
    refresh,
    get limits() { return { ...limits }; },
    get tokens() {
      return { accessToken: state.accessToken, refreshToken: state.refreshToken, accessExpiresAt: state.accessExpiresAt };
    },
  };
}
