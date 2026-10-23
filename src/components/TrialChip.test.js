import { test, describe, beforeEach } from 'node:test';
import assert from 'node:assert';

const mem = new Map();
globalThis.localStorage = {
  getItem: (k) => (mem.has(k) ? mem.get(k) : null),
  setItem: (k, v) => mem.set(k, String(v)),
  removeItem: (k) => mem.delete(k),
  clear: () => mem.clear(),
};

const { store } = await import('../data/store.js');
const { trialChipState, renderTrialChip } = await import('./TrialChip.js');

const CLOUD_ID = '0f1e2d3c-4b5a-6978-8a9b-0c1d2e3f4a5b';

function useCloudAccount(subscription, companyId = CLOUD_ID) {
  store.companyId = companyId;
  store.companySettings = subscription === undefined ? {} : { _subscription: subscription };
}

function useTrial(remainingMs, overrides = {}) {
  const end = new Date(Date.now() + remainingMs).toISOString();
  useCloudAccount({ tier: null, status: 'trialing', trialEndsAt: end, ...overrides });
  return end;
}

describe('Trial chip', () => {
  beforeEach(() => {
    store.companyId = null;
    store.companySettings = {};
  });

  test('is hidden for local accounts', () => {
    useCloudAccount(undefined, 'acct_123');
    assert.strictEqual(trialChipState(), null);
    assert.strictEqual(renderTrialChip(), '');
  });

  test('is hidden for a paying cloud account', () => {
    useCloudAccount({ tier: 'cloud', status: 'active', trialEndsAt: null });
    assert.strictEqual(trialChipState(), null);
  });

  test('is hidden for a complimentary grant', () => {
    useCloudAccount({ tier: 'cloud', status: 'active', compTier: 'cloud', trialEndsAt: null });
    assert.strictEqual(trialChipState(), null);
  });

  test('is hidden after the trial expires (the banner owns that message)', () => {
    useTrial(-60 * 1000);
    assert.strictEqual(trialChipState(), null);
  });

  test('shows days remaining from the first day of the trial', () => {
    useTrial(10 * 86400000);
    const state = trialChipState();
    assert.strictEqual(state.label, 'Trial · 10 days left');
    assert.strictEqual(state.tone, 'info');
  });

  test('warns in the final two days', () => {
    useTrial(2 * 86400000);
    assert.strictEqual(trialChipState().tone, 'warning');
  });

  test('reads "ends today" inside the final 24 hours', () => {
    useTrial(86400000);
    assert.strictEqual(trialChipState().label, 'Trial · ends today');

    useTrial(2 * 60 * 60 * 1000);
    const state = trialChipState();
    assert.strictEqual(state.label, 'Trial · ends today');
    assert.strictEqual(state.tone, 'warning');
  });

  test('legacy trialing rows without an end date still show the trial length', () => {
    useCloudAccount({ tier: null, status: 'trialing', trialEndsAt: null });
    assert.strictEqual(trialChipState().label, 'Trial · 14 days left');
  });

  test('renders a clickable chip with the billing route in its title', () => {
    useTrial(10 * 86400000);
    const html = renderTrialChip();
    assert.match(html, /id="relay-trial-chip"/);
    assert.match(html, /Trial · 10 days left/);
    assert.match(html, /Free trial — 10 days left/);
  });
});
