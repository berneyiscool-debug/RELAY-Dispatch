// ============================================
// RELAY — XERO OAUTH 2.0 HELPERS
// ============================================
// Builds the requests for Xero's standard authorization-code flow. Pure
// functions returning { url, init } so the edge functions do the fetch and the
// tests can assert on exactly what would be sent. Plain ESM, no Deno APIs.
//
// Access tokens live 30 minutes; refresh tokens (offline_access) rotate on every
// refresh and expire after 60 days unused.

export const XERO_AUTHORIZE_URL = 'https://login.xero.com/identity/connect/authorize';
export const XERO_TOKEN_URL = 'https://identity.xero.com/connect/token';
export const XERO_REVOKE_URL = 'https://identity.xero.com/connect/revocation';
export const XERO_CONNECTIONS_URL = 'https://api.xero.com/connections';

// Granular scopes (mandatory for apps created after 2 March 2026). Settings is
// read-only: Phase 1 lists accounts, tracking categories and tax rates but never
// changes them.
export const XERO_SCOPES = Object.freeze([
  'openid',
  'profile',
  'email',
  'offline_access',
  'accounting.contacts',
  'accounting.invoices',
  'accounting.payments',
  'accounting.settings.read',
]);

/** The URL the admin's browser is sent to in order to grant access. */
export function buildAuthorizeUrl({ clientId, redirectUri, state, scopes = XERO_SCOPES }) {
  if (!clientId || !redirectUri || !state) throw new Error('clientId, redirectUri and state are required');
  const url = new URL(XERO_AUTHORIZE_URL);
  url.searchParams.set('response_type', 'code');
  url.searchParams.set('client_id', clientId);
  url.searchParams.set('redirect_uri', redirectUri);
  url.searchParams.set('scope', scopes.join(' '));
  url.searchParams.set('state', state);
  return url.toString();
}

function basicAuth(clientId, clientSecret) {
  if (!clientId || !clientSecret) throw new Error('XERO_CLIENT_ID / XERO_CLIENT_SECRET are not configured');
  return `Basic ${btoa(`${clientId}:${clientSecret}`)}`;
}

function formPost(url, clientId, clientSecret, fields) {
  return {
    url,
    init: {
      method: 'POST',
      headers: {
        Authorization: basicAuth(clientId, clientSecret),
        'Content-Type': 'application/x-www-form-urlencoded',
        Accept: 'application/json',
      },
      body: new URLSearchParams(fields).toString(),
    },
  };
}

/** Exchange the callback's ?code for tokens. */
export function codeExchangeRequest({ code, redirectUri, clientId, clientSecret }) {
  if (!code) throw new Error('Missing authorization code');
  return formPost(XERO_TOKEN_URL, clientId, clientSecret, {
    grant_type: 'authorization_code',
    code,
    redirect_uri: redirectUri,
  });
}

/** Trade the (rotating) refresh token for a new pair. */
export function refreshRequest({ refreshToken, clientId, clientSecret }) {
  if (!refreshToken) throw new Error('Missing refresh token');
  return formPost(XERO_TOKEN_URL, clientId, clientSecret, {
    grant_type: 'refresh_token',
    refresh_token: refreshToken,
  });
}

/** Revoke a refresh token on disconnect (also drops every connection it granted). */
export function revokeRequest({ refreshToken, clientId, clientSecret }) {
  return formPost(XERO_REVOKE_URL, clientId, clientSecret, { token: refreshToken });
}

/**
 * Normalise a token endpoint response into what xero_connections stores.
 * `now` is injectable for tests.
 */
export function parseTokenResponse(data, { now = Date.now() } = {}) {
  if (!data || !data.access_token || !data.refresh_token) {
    throw new Error(`Xero token response missing tokens${data?.error ? `: ${data.error}` : ''}`);
  }
  const expiresIn = Number(data.expires_in) || 1800;
  return {
    accessToken: String(data.access_token),
    refreshToken: String(data.refresh_token),
    accessExpiresAt: new Date(now + expiresIn * 1000).toISOString(),
    scopes: String(data.scope || ''),
  };
}

/**
 * From GET /connections, keep only organisation tenants (not practice-manager
 * ones). Returns [{ tenantId, tenantName, connectionId }].
 */
export function organisationTenants(connections) {
  return (Array.isArray(connections) ? connections : [])
    .filter((c) => c && c.tenantId && (c.tenantType || 'ORGANISATION') === 'ORGANISATION')
    .map((c) => ({ tenantId: String(c.tenantId), tenantName: String(c.tenantName || ''), connectionId: String(c.id || '') }));
}
