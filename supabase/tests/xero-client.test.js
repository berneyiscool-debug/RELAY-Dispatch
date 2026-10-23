/**
 * Tests for the Xero auth plumbing shared by the relay-xero-* functions:
 * webhook signatures, signed OAuth state, token encryption, the OAuth request
 * builders, and the API client's refresh / rate-limit / error handling (with a
 * fake fetch, so nothing touches the network).
 *
 * Run with: npm run test:migrations
 */
import { describe, test } from 'node:test';
import assert from 'node:assert/strict';
import { createHmac, randomBytes } from 'node:crypto';
import {
  decryptToken,
  encryptToken,
  signState,
  verifyState,
  verifyWebhookSignature,
} from '../functions/_xero/crypto.js';
import {
  XERO_SCOPES,
  buildAuthorizeUrl,
  codeExchangeRequest,
  organisationTenants,
  parseTokenResponse,
  refreshRequest,
} from '../functions/_xero/oauth.js';
import { XeroError, createXeroClient, toXeroError, validationMessages } from '../functions/_xero/client.js';

const STATE_SECRET = 'state-secret-for-tests';
const TOKEN_KEY = randomBytes(32).toString('base64');

describe('webhook signature', () => {
  const key = 'webhook-key';
  const body = '{"events":[],"firstEventSequence":0,"lastEventSequence":0,"entropy":"ABC"}';
  const good = createHmac('sha256', key).update(body).digest('base64');

  test('accepts Xero\'s base64 HMAC of the raw body', async () => {
    assert.equal(await verifyWebhookSignature(body, good, key), true);
  });

  test('rejects a tampered body, wrong key, or missing header', async () => {
    assert.equal(await verifyWebhookSignature(body.replace('ABC', 'ABD'), good, key), false);
    assert.equal(await verifyWebhookSignature(body, good, 'other-key'), false);
    assert.equal(await verifyWebhookSignature(body, '', key), false);
    assert.equal(await verifyWebhookSignature(body, good, ''), false);
    // Re-serialised JSON is different bytes: this is why the raw body matters.
    assert.equal(await verifyWebhookSignature(JSON.stringify(JSON.parse(body), null, 1), good, key), false);
  });
});

describe('OAuth state', () => {
  const payload = { companyId: 'company-a', userId: 'user-a', returnPath: '/settings?tab=cost_centers' };

  test('round-trips and expires', async () => {
    const now = Date.UTC(2026, 9, 20, 9, 0, 0);
    const token = await signState(payload, STATE_SECRET, { now, ttlSec: 600 });
    const back = await verifyState(token, STATE_SECRET, { now: now + 599_000 });
    assert.equal(back.companyId, 'company-a');
    assert.equal(back.returnPath, '/settings?tab=cost_centers');
    assert.equal(await verifyState(token, STATE_SECRET, { now: now + 601_000 }), null);
  });

  test('a forged or edited state is rejected', async () => {
    const token = await signState(payload, STATE_SECRET);
    const [body, sig] = token.split('.');
    const forgedBody = Buffer.from(JSON.stringify({ ...payload, companyId: 'company-b', exp: 9e9 })).toString('base64url');
    assert.equal(await verifyState(`${forgedBody}.${sig}`, STATE_SECRET), null);
    assert.equal(await verifyState(token, 'other-secret'), null);
    assert.equal(await verifyState(`${body}.`, STATE_SECRET), null);
    assert.equal(await verifyState('nonsense', STATE_SECRET), null);
    assert.equal(await verifyState(null, STATE_SECRET), null);
  });

  test('two states for the same user differ (nonce)', async () => {
    assert.notEqual(await signState(payload, STATE_SECRET), await signState(payload, STATE_SECRET));
  });
});

describe('token encryption', () => {
  test('round-trips, and each encryption uses a fresh IV', async () => {
    const a = await encryptToken('refresh-token-value', TOKEN_KEY, 'company-a');
    const b = await encryptToken('refresh-token-value', TOKEN_KEY, 'company-a');
    assert.match(a, /^v1\./);
    assert.notEqual(a, b);
    assert.ok(!a.includes('refresh-token-value'));
    assert.equal(await decryptToken(a, TOKEN_KEY, 'company-a'), 'refresh-token-value');
  });

  test('ciphertext moved to another company, or a wrong key, fails to decrypt', async () => {
    const a = await encryptToken('refresh-token-value', TOKEN_KEY, 'company-a');
    await assert.rejects(() => decryptToken(a, TOKEN_KEY, 'company-b'));
    await assert.rejects(() => decryptToken(a, randomBytes(32).toString('base64'), 'company-a'));
    await assert.rejects(() => decryptToken('v2.x.y', TOKEN_KEY, 'company-a'), /Unrecognised/);
  });

  test('rejects a malformed key and passes empty values through', async () => {
    await assert.rejects(() => encryptToken('x', randomBytes(16).toString('base64'), 'c'), /32 bytes/);
    await assert.rejects(() => encryptToken('x', '', 'c'), /not configured/);
    assert.equal(await encryptToken('', TOKEN_KEY, 'c'), null);
    assert.equal(await decryptToken(null, TOKEN_KEY, 'c'), null);
  });
});

describe('OAuth requests', () => {
  test('the authorize URL asks for the granular scopes and carries state', () => {
    const url = new URL(buildAuthorizeUrl({ clientId: 'cid', redirectUri: 'https://x.supabase.co/functions/v1/relay-xero-callback', state: 's.t' }));
    assert.equal(url.origin + url.pathname, 'https://login.xero.com/identity/connect/authorize');
    assert.equal(url.searchParams.get('response_type'), 'code');
    assert.equal(url.searchParams.get('state'), 's.t');
    const scopes = url.searchParams.get('scope').split(' ');
    assert.deepEqual(scopes, [...XERO_SCOPES]);
    assert.ok(scopes.includes('offline_access'));
    assert.ok(!scopes.includes('accounting.transactions'), 'broad scope is retired for new apps');
  });

  test('token requests use basic auth and form encoding', () => {
    const { url, init } = codeExchangeRequest({ code: 'abc', redirectUri: 'https://r', clientId: 'cid', clientSecret: 'sec' });
    assert.equal(url, 'https://identity.xero.com/connect/token');
    assert.equal(init.headers.Authorization, `Basic ${Buffer.from('cid:sec').toString('base64')}`);
    assert.equal(init.headers['Content-Type'], 'application/x-www-form-urlencoded');
    assert.equal(init.body, 'grant_type=authorization_code&code=abc&redirect_uri=https%3A%2F%2Fr');
    assert.equal(refreshRequest({ refreshToken: 'rt', clientId: 'cid', clientSecret: 'sec' }).init.body, 'grant_type=refresh_token&refresh_token=rt');
    assert.throws(() => refreshRequest({ refreshToken: 'rt', clientId: 'cid' }), /not configured/);
  });

  test('token responses and tenant lists are normalised', () => {
    const t = parseTokenResponse({ access_token: 'a', refresh_token: 'r', expires_in: 1800, scope: 'openid' }, { now: 0 });
    assert.deepEqual(t, { accessToken: 'a', refreshToken: 'r', accessExpiresAt: '1970-01-01T00:30:00.000Z', scopes: 'openid' });
    assert.throws(() => parseTokenResponse({ error: 'invalid_grant' }), /invalid_grant/);
    assert.deepEqual(
      organisationTenants([
        { id: 'conn-1', tenantId: 't1', tenantName: 'Demo Company (AU)', tenantType: 'ORGANISATION' },
        { id: 'conn-2', tenantId: 't2', tenantName: 'Practice', tenantType: 'PRACTICEMANAGER' },
      ]),
      [{ tenantId: 't1', tenantName: 'Demo Company (AU)', connectionId: 'conn-1' }]
    );
  });
});

// ── API client ───────────────────────────────────────────────────────

function response(status, body, headers = {}) {
  return new Response(body === undefined ? '' : JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json', ...headers } });
}

function fakeFetch(handlers) {
  const calls = [];
  const fn = async (url, init = {}) => {
    calls.push({ url: String(url), init });
    const next = handlers.shift();
    if (!next) throw new Error(`Unexpected request ${url}`);
    return typeof next === 'function' ? next(String(url), init) : next;
  };
  fn.calls = calls;
  return fn;
}

const NOW = Date.UTC(2026, 9, 20, 9, 0, 0);
const fresh = () => ({ tenantId: 'tenant-1', accessToken: 'at-1', refreshToken: 'rt-1', accessExpiresAt: new Date(NOW + 20 * 60_000).toISOString() });

describe('API client', () => {
  test('sends the tenant header, idempotency key and JSON body, and reads the limits', async () => {
    const fetch = fakeFetch([response(200, { Invoices: [{ InvoiceID: 'xi-1' }] }, { 'X-MinLimit-Remaining': '59', 'X-DayLimit-Remaining': '4999' })]);
    const client = createXeroClient({ connection: fresh(), clientId: 'cid', clientSecret: 'sec', fetch, now: () => NOW });
    const { data } = await client.request('POST', '/Invoices', { body: { Invoices: [] }, query: { unitdp: 4 }, idempotencyKey: 'k'.repeat(200) });
    assert.equal(data.Invoices[0].InvoiceID, 'xi-1');
    const [call] = fetch.calls;
    assert.equal(call.url, 'https://api.xero.com/api.xro/2.0/Invoices?unitdp=4');
    assert.equal(call.init.headers.Authorization, 'Bearer at-1');
    assert.equal(call.init.headers['xero-tenant-id'], 'tenant-1');
    assert.equal(call.init.headers['Idempotency-Key'].length, 128);
    assert.equal(call.init.body, '{"Invoices":[]}');
    assert.deepEqual(client.limits, { minuteRemaining: 59, dayRemaining: 4999, appMinuteRemaining: null });
  });

  test('refreshes a nearly expired token first and persists the rotated pair before using it', async () => {
    const persisted = [];
    const fetch = fakeFetch([
      response(200, { access_token: 'at-2', refresh_token: 'rt-2', expires_in: 1800 }),
      (url, init) => {
        assert.equal(persisted.length, 1, 'tokens saved before first use');
        assert.equal(init.headers.Authorization, 'Bearer at-2');
        return response(200, { Organisations: [] });
      },
    ]);
    const connection = { ...fresh(), accessExpiresAt: new Date(NOW + 60_000).toISOString() };
    const client = createXeroClient({
      connection, clientId: 'cid', clientSecret: 'sec', fetch, now: () => NOW,
      onTokens: async (t) => { persisted.push(t); },
    });
    await client.request('GET', '/Organisation');
    assert.equal(fetch.calls[0].url, 'https://identity.xero.com/connect/token');
    assert.match(fetch.calls[0].init.body, /refresh_token=rt-1/);
    assert.equal(persisted[0].refreshToken, 'rt-2');
    assert.equal(client.tokens.refreshToken, 'rt-2');
  });

  test('if saving rotated tokens fails, the request is not made', async () => {
    const fetch = fakeFetch([response(200, { access_token: 'at-2', refresh_token: 'rt-2', expires_in: 1800 })]);
    const client = createXeroClient({
      connection: { ...fresh(), accessExpiresAt: null }, clientId: 'cid', clientSecret: 'sec', fetch, now: () => NOW,
      onTokens: async () => { throw new Error('db down'); },
    });
    await assert.rejects(() => client.request('GET', '/Organisation'), /db down/);
    assert.equal(fetch.calls.length, 1);
  });

  test('a 401 triggers one refresh and retry', async () => {
    const fetch = fakeFetch([
      response(401, { Title: 'Unauthorized' }),
      response(200, { access_token: 'at-2', refresh_token: 'rt-2', expires_in: 1800 }),
      response(200, { ok: true }),
    ]);
    const client = createXeroClient({ connection: fresh(), clientId: 'cid', clientSecret: 'sec', fetch, now: () => NOW });
    const { data } = await client.request('GET', '/Invoices/xi-1');
    assert.deepEqual(data, { ok: true });
    assert.equal(fetch.calls[2].init.headers.Authorization, 'Bearer at-2');
  });

  test('a rejected refresh token means the admin must reconnect', async () => {
    const fetch = fakeFetch([response(400, { error: 'invalid_grant' })]);
    const client = createXeroClient({ connection: { ...fresh(), accessExpiresAt: null }, clientId: 'cid', clientSecret: 'sec', fetch, now: () => NOW });
    const err = await client.request('GET', '/Organisation').catch((e) => e);
    assert.ok(err instanceof XeroError);
    assert.equal(err.kind, 'auth_revoked');
    assert.equal(err.retryable, false);
  });

  test('rate limits say how long to wait and which limit was hit', async () => {
    const fetch = fakeFetch([response(429, undefined, { 'Retry-After': '42', 'X-Rate-Limit-Problem': 'minute' })]);
    const client = createXeroClient({ connection: fresh(), clientId: 'cid', clientSecret: 'sec', fetch, now: () => NOW });
    const err = await client.request('GET', '/Invoices').catch((e) => e);
    assert.equal(err.kind, 'rate_limited');
    assert.equal(err.retryAfterSec, 42);
    assert.equal(err.limit, 'minute');
    assert.equal(err.retryable, true);
    assert.equal(toXeroError(429, null, new Headers({ 'X-Rate-Limit-Problem': 'day' })).retryAfterSec, 3600);
  });

  test('validation errors surface Xero\'s messages; 5xx and network errors are retryable', async () => {
    const body = {
      Type: 'ValidationException',
      Elements: [{
        ValidationErrors: [{ Message: 'Invoice # must be unique.' }],
        LineItems: [{ ValidationErrors: [{ Message: 'Account code \'999\' is not a valid code for this document.' }] }],
      }],
    };
    assert.deepEqual(validationMessages(body), ['Invoice # must be unique.', 'Account code \'999\' is not a valid code for this document.']);
    const fetch = fakeFetch([response(400, body), response(503, {}), async () => { throw new Error('ECONNRESET'); }]);
    const client = createXeroClient({ connection: fresh(), clientId: 'cid', clientSecret: 'sec', fetch, now: () => NOW });
    const v = await client.request('POST', '/Invoices', { body: {} }).catch((e) => e);
    assert.equal(v.kind, 'validation');
    assert.match(v.message, /must be unique.*not a valid code/);
    assert.equal(v.retryable, false);
    const s = await client.request('GET', '/Invoices').catch((e) => e);
    assert.equal(s.kind, 'server');
    assert.equal(s.retryable, true);
    const n = await client.request('GET', '/Invoices').catch((e) => e);
    assert.equal(n.kind, 'network');
    assert.equal(toXeroError(404, null).kind, 'not_found');
  });

  test('refuses to build without a tenant', () => {
    assert.throws(() => createXeroClient({ connection: { accessToken: 'x' } }), /tenant/);
  });
});
