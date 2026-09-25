import { test, describe, beforeEach } from 'node:test';
import assert from 'node:assert';

const mem = new Map();
globalThis.localStorage = {
  getItem: (k) => (mem.has(k) ? mem.get(k) : null),
  setItem: (k, v) => mem.set(k, String(v)),
  removeItem: (k) => mem.delete(k),
  clear: () => mem.clear(),
};

const {
  paymentsSettings,
  connectInfo,
  connectReady,
  paymentsEnabled,
  paymentsEnabledFor,
} = await import('./payments.js');
const { FLAGS } = await import('./flags.js');
const { store } = await import('../data/store.js');

const LOCAL_ID = 'acct_local123';
const CLOUD_ID = '0f1e2d3c-4b5a-6978-8a9b-0c1d2e3f4a5b'; // uuid → cloud account

function useAccount(companyId, settings = {}) {
  store.companyId = companyId;
  store.companySettings = settings;
}

describe('payments gating', () => {
  beforeEach(() => {
    mem.clear();
    store.companyId = null;
    store.companySettings = null;
  });

  test('payments are flagged on for this build', () => {
    assert.strictEqual(FLAGS.payments, true);
  });

  test('the Payments surface is hidden for local accounts', () => {
    useAccount(LOCAL_ID);
    assert.strictEqual(paymentsEnabled(), false);
  });

  test('the Payments surface is hidden when no company is loaded', () => {
    useAccount(null);
    assert.strictEqual(paymentsEnabled(), false);
  });

  test('the Payments surface shows for cloud accounts', () => {
    useAccount(CLOUD_ID);
    assert.strictEqual(paymentsEnabled(), true);
  });

  test('settings and connect info default to empty objects', () => {
    useAccount(CLOUD_ID);
    assert.deepStrictEqual(paymentsSettings(), {});
    assert.deepStrictEqual(connectInfo(), {});
    assert.strictEqual(connectReady(), false);
  });

  test('connect is only ready once charges are enabled', () => {
    useAccount(CLOUD_ID, { _connect: { accountId: 'acct_1', detailsSubmitted: true, chargesEnabled: false } });
    assert.strictEqual(connectReady(), false);

    useAccount(CLOUD_ID, { _connect: { accountId: 'acct_1', detailsSubmitted: true, chargesEnabled: true } });
    assert.strictEqual(connectReady(), true);
  });
});

describe('paymentsEnabledFor', () => {
  beforeEach(() => {
    mem.clear();
    store.companyId = null;
    store.companySettings = null;
  });

  test('is false for everyone until the Stripe account can take charges', () => {
    useAccount(CLOUD_ID, { _connect: { chargesEnabled: false } });
    assert.strictEqual(paymentsEnabledFor('invoice'), false);
  });

  test('is false for local accounts even when connect info says otherwise', () => {
    useAccount(LOCAL_ID, { _connect: { chargesEnabled: true } });
    assert.strictEqual(paymentsEnabledFor('invoice'), false);
  });

  test('defaults each document type to on once connected', () => {
    useAccount(CLOUD_ID, { _connect: { chargesEnabled: true } });
    assert.strictEqual(paymentsEnabledFor('invoice'), true);
    assert.strictEqual(paymentsEnabledFor('quote'), true);
  });

  test('respects an explicit per-document opt-out', () => {
    useAccount(CLOUD_ID, {
      _connect: { chargesEnabled: true },
      payments: { enabledFor: { invoice: false } },
    });
    assert.strictEqual(paymentsEnabledFor('invoice'), false);
    // An opt-out on one type must not leak to the others.
    assert.strictEqual(paymentsEnabledFor('quote'), true);
  });

  test('defaults to the invoice document type', () => {
    useAccount(CLOUD_ID, {
      _connect: { chargesEnabled: true },
      payments: { enabledFor: { invoice: false } },
    });
    assert.strictEqual(paymentsEnabledFor(), false);
  });
});
