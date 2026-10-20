/**
 * Tests for the Xero connect-flow decisions: where the admin is sent back to
 * (only RELAY's own hosts), which organisations a consent granted, which ones
 * RELAY can use, and what the Settings card is told (never a token).
 *
 * Run with: npm run test:migrations
 */
import { describe, test } from 'node:test';
import assert from 'node:assert/strict';
import {
  OUTCOMES,
  callbackRedirect,
  checkOrganisation,
  connectReturnUrl,
  grantedTenants,
  jwtClaims,
  statusPayload,
  summariseSettings,
} from '../functions/_xero/connect.js';

const jwt = (claims) => `h.${Buffer.from(JSON.stringify(claims)).toString('base64url')}.s`;

describe('return URLs', () => {
  test('the public site returns to /app; dev servers to their root; anything else to the hosted app', () => {
    assert.equal(connectReturnUrl({ origin: 'https://relaydispatch.com.au' }), 'https://relaydispatch.com.au/app/#/settings?tab=cost_centers');
    assert.equal(connectReturnUrl({ origin: 'http://localhost:5173', returnPath: '/settings?tab=cost_centers' }), 'http://localhost:5173/#/settings?tab=cost_centers');
    assert.equal(connectReturnUrl({ origin: null }), 'https://relaydispatch.com.au/app/#/settings?tab=cost_centers');
    assert.equal(connectReturnUrl({ origin: 'https://evil.example' }), 'https://relaydispatch.com.au/app/#/settings?tab=cost_centers');
    assert.equal(connectReturnUrl({ origin: 'https://preview.example', extraOrigins: ['https://preview.example'] }), 'https://preview.example/#/settings?tab=cost_centers');
  });

  test('a return path can only be an in-app route', () => {
    for (const bad of ['//evil.example/x', 'https://evil.example', 'javascript:alert(1)', '/settings?tab=<x>', 42]) {
      assert.equal(connectReturnUrl({ origin: 'http://localhost:5173', returnPath: bad }), 'http://localhost:5173/#/settings?tab=cost_centers', String(bad));
    }
  });

  test('the callback appends its outcome to the hash route, replacing a stale one', () => {
    assert.equal(
      callbackRedirect('https://relaydispatch.com.au/app/#/settings?tab=cost_centers', 'connected'),
      'https://relaydispatch.com.au/app/#/settings?tab=cost_centers&xero=connected'
    );
    assert.equal(
      callbackRedirect('http://localhost:5173/#/settings?tab=cost_centers&xero=error', 'choose'),
      'http://localhost:5173/#/settings?tab=cost_centers&xero=choose'
    );
    assert.equal(callbackRedirect('http://localhost:5173/#/settings', 'cancelled'), 'http://localhost:5173/#/settings?xero=cancelled');
  });

  test('the callback never redirects off RELAY, even with a tampered return URL', () => {
    assert.equal(
      callbackRedirect('https://evil.example/#/x', 'connected'),
      'https://relaydispatch.com.au/app/#/settings?tab=cost_centers&xero=connected'
    );
    assert.match(callbackRedirect('http://localhost:5173/#/settings', 'made-up'), /xero=error$/);
    assert.ok(OUTCOMES.includes('tenant_in_use'));
  });
});

describe('granted organisations', () => {
  const connections = [
    { id: 'conn-old', tenantId: 't-old', tenantName: 'Old Org', tenantType: 'ORGANISATION', authEventId: 'ev-1' },
    { id: 'conn-new', tenantId: 't-new', tenantName: 'New Org', tenantType: 'ORGANISATION', authEventId: 'ev-2' },
    { id: 'conn-pm', tenantId: 't-pm', tenantName: 'Practice', tenantType: 'PRACTICEMANAGER', authEventId: 'ev-2' },
  ];

  test('only the organisations from this consent count', () => {
    assert.deepEqual(grantedTenants(connections, jwt({ authentication_event_id: 'ev-2' })), [
      { tenantId: 't-new', tenantName: 'New Org', connectionId: 'conn-new' },
    ]);
  });

  test('falls back to every organisation when the token names no event', () => {
    assert.equal(grantedTenants(connections, jwt({})).length, 2);
    assert.equal(grantedTenants(connections, 'not-a-jwt').length, 2);
    assert.deepEqual(grantedTenants(null, 'x'), []);
  });

  test('jwtClaims tolerates junk', () => {
    assert.deepEqual(jwtClaims(undefined), {});
    assert.equal(jwtClaims(jwt({ a: 1 })).a, 1);
  });

  test('only AUD organisations are usable', () => {
    assert.deepEqual(checkOrganisation({ BaseCurrency: 'AUD', Name: 'Demo Company (AU)' }), { ok: true, baseCurrency: 'AUD', name: 'Demo Company (AU)' });
    assert.equal(checkOrganisation({ BaseCurrency: 'NZD', Name: 'Kiwi Ltd' }).outcome, 'unsupported_currency');
    assert.equal(checkOrganisation(undefined).ok, false);
  });
});

describe('status payload', () => {
  const row = {
    company_id: 'c', tenant_id: 't', tenant_name: 'Demo Company (AU)', base_currency: 'AUD', status: 'active',
    access_token_enc: 'v1.secret', refresh_token_enc: 'v1.secret', last_error: null, updated_at: '2026-10-20T00:00:00Z',
  };

  test('reports the connection and queue without ever including tokens', () => {
    const payload = statusPayload(row, { pendingJobs: 2, failedJobs: 1 });
    assert.equal(payload.connected, true);
    assert.equal(payload.tenantName, 'Demo Company (AU)');
    assert.equal(payload.pendingJobs, 2);
    assert.ok(!JSON.stringify(payload).includes('secret'));
  });

  test('no row or a disconnected one reads as not connected', () => {
    assert.equal(statusPayload(null).connected, false);
    assert.equal(statusPayload({ ...row, status: 'disconnected' }).status, 'disconnected');
    assert.equal(statusPayload({ ...row, status: 'disconnected' }).tenantName, null);
  });

  test('needs_reauth is not connected; choose_tenant lists the options', () => {
    assert.equal(statusPayload({ ...row, status: 'needs_reauth' }).connected, false);
    const choose = statusPayload({ ...row, status: 'choose_tenant' }, { tenants: [{ tenantId: 't1', tenantName: 'A', connectionId: 'secret-conn' }] });
    assert.deepEqual(choose.tenants, [{ tenantId: 't1', tenantName: 'A' }]);
  });
});

describe('settings summary', () => {
  test('keeps active coded accounts, payment-capable accounts, and active tracking', () => {
    const summary = summariseSettings({
      accounts: [
        { Code: '200', Name: 'Sales', Type: 'REVENUE', Class: 'REVENUE', Status: 'ACTIVE' },
        { Code: '260', Name: 'Other Revenue', Type: 'OTHERINCOME', Class: 'REVENUE', Status: 'ACTIVE' },
        { Code: '201', Name: 'Old Sales', Type: 'REVENUE', Class: 'REVENUE', Status: 'ARCHIVED' },
        { Code: '090', Name: 'Business Bank', Type: 'BANK', Class: 'ASSET', Status: 'ACTIVE' },
        { Code: '091', Name: 'Stripe Clearing', Type: 'CURRLIAB', Class: 'LIABILITY', Status: 'ACTIVE', EnablePaymentsToAccount: true },
        { Code: '400', Name: 'Advertising', Type: 'EXPENSE', Class: 'EXPENSE', Status: 'ACTIVE' },
        { Name: 'No code bank', Type: 'BANK', Class: 'ASSET', Status: 'ACTIVE' },
      ],
      trackingCategories: [
        { Name: 'Division', Status: 'ACTIVE', Options: [{ Name: 'Plumbing', Status: 'ACTIVE' }, { Name: 'Gone', Status: 'ARCHIVED' }, { Name: 'Electrical', Status: 'ACTIVE' }] },
        { Name: 'Old', Status: 'ARCHIVED', Options: [] },
      ],
      taxRates: [
        { TaxType: 'OUTPUT', Name: 'GST on Income', Status: 'ACTIVE', EffectiveRate: 10, CanApplyToRevenue: true },
        { TaxType: 'INPUT', Name: 'GST on Expenses', Status: 'ACTIVE', EffectiveRate: 10, CanApplyToRevenue: false },
      ],
    });
    assert.deepEqual(summary.revenueAccounts.map((a) => a.code), ['260', '200']);
    assert.deepEqual(summary.paymentAccounts.map((a) => a.code), ['090', '091']);
    assert.deepEqual(summary.expenseAccounts.map((a) => a.code), ['400']);
    assert.deepEqual(summary.trackingCategories, [{ name: 'Division', options: ['Electrical', 'Plumbing'] }]);
    assert.deepEqual(summary.taxRates, [{ type: 'OUTPUT', name: 'GST on Income', rate: 10 }]);
    assert.deepEqual(summariseSettings().revenueAccounts, []);
  });
});
