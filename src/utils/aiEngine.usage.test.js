// The usage meters describe a server-side allowance that only exists for a Cloud
// workspace: a pooled daily budget with a per-seat ceiling. An offline or local
// ("acct_...") workspace has no pool and no readable ledger, so it must never be
// shown a meter - not even a flattering "0% used".
//
// These tests pin that at the network boundary rather than at the renderer: for a
// non-Cloud workspace `fetchUsage()` must make no call at all, which also means a
// free user cannot be told anything about a limit by watching the network tab.
import test from 'node:test';
import assert from 'node:assert/strict';
import { supabase } from './supabase.js';
import { store } from '../data/store.js';
import { fetchUsage } from './aiEngine.js';

const realInvoke = supabase.functions.invoke;
let calls = 0;
let lastCall = null;

function stubInvoke(impl) {
  calls = 0;
  lastCall = null;
  supabase.functions.invoke = async (...args) => {
    calls += 1;
    lastCall = args;
    return impl(...args);
  };
}

// Runs `body` with the store pretending to be `companyId`, then puts everything
// back - the store and the client are both module singletons.
async function asCompany(companyId, body) {
  const previous = store.companyId;
  store.companyId = companyId;
  try {
    return await body();
  } finally {
    store.companyId = previous;
    supabase.functions.invoke = realInvoke;
  }
}

const ok = (overrides = {}) => ({
  data: {
    available: true,
    resetsAt: '2026-10-04T13:00:00.000Z',
    blocked: null,
    seats: 2,
    user: { percent: 26 },
    company: { percent: 34 },
    ...overrides,
  },
  error: null,
});

test('a free workspace is never asked about an allowance it does not have', async () => {
  stubInvoke(ok);
  const local = await asCompany('acct_1234567890', fetchUsage);
  assert.strictEqual(local, null);
  assert.strictEqual(calls, 0);   // not even a request that ignores the answer
});

test('a workspace with no company at all is treated the same way', async () => {
  stubInvoke(ok);
  const none = await asCompany(null, fetchUsage);
  assert.strictEqual(none, null);
  assert.strictEqual(calls, 0);
});

test('a Cloud workspace reads its allowance through the usage action', async () => {
  stubInvoke(ok);
  const snapshot = await asCompany('company-uuid', fetchUsage);
  assert.strictEqual(calls, 1);
  assert.strictEqual(lastCall[0], 'relay-copilot?action=usage');
  assert.strictEqual(snapshot.user.percent, 26);
  assert.strictEqual(snapshot.company.percent, 34);
  assert.ok(snapshot.resetsAt instanceof Date);
});

test('a ledger that cannot be read is reported as nothing, not as zero', async () => {
  stubInvoke(() => ok({ available: false, reason: 'ledger_unavailable' }));
  const unreadable = await asCompany('company-uuid', fetchUsage);
  assert.strictEqual(unreadable, null);

  stubInvoke(() => ({ data: null, error: new Error('offline') }));
  const failed = await asCompany('company-uuid', fetchUsage);
  assert.strictEqual(failed, null);
});

test('a refresh never rejects, so it cannot break the panel it sits in', async () => {
  stubInvoke(() => { throw new Error('network down'); });
  const thrown = await asCompany('company-uuid', fetchUsage);
  assert.strictEqual(thrown, null);
});
