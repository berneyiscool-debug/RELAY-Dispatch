import { test, describe, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert';

const mem = new Map();
globalThis.localStorage = {
  getItem: (k) => (mem.has(k) ? mem.get(k) : null),
  setItem: (k, v) => mem.set(k, String(v)),
  removeItem: (k) => mem.delete(k),
  clear: () => mem.clear(),
};

// createCheckoutSession() navigates by assigning location.href.
let navigatedTo = [];
globalThis.location = {
  origin: 'https://app.relay.test',
  get href() { return ''; },
  set href(value) { navigatedTo.push(value); },
};

const { supabase } = await import('./supabase.js');
const { store } = await import('../data/store.js');
const {
  subscriptionRequired,
  subscriptionActive,
  subscriptionFromRow,
  subscriptionActiveFromRow,
  refreshSubscription,
  refreshSubscriptionFor,
  startSubscribeCheckout,
  startCheckout,
  TRIAL_DAYS,
  trialActive,
  trialDaysLeft,
  trialEndTime,
  trialExpired,
  isReadOnly,
  readOnlyReason,
  isComplimentary,
} = await import('./subscription.js');

const originalFrom = supabase.from;
const originalInvoke = supabase.functions.invoke;
const originalGetSession = supabase.auth.getSession;

const CLOUD_ID = '0f1e2d3c-4b5a-6978-8a9b-0c1d2e3f4a5b';
const ROW = {
  subscription_tier: 'cloud',
  subscription_status: 'active',
  subscription_seats: 4,
  subscription_current_period_end: '2026-01-31T00:00:00Z',
  stripe_customer_id: 'cus_123',
  comp_tier: null,
  trial_ends_at: '2026-02-14T00:00:00Z',
};

function useCloudAccount(subscription, companyId = CLOUD_ID) {
  store.companyId = companyId;
  store.companySettings = subscription === undefined ? {} : { _subscription: subscription };
}

// Puts the account on a dated no-card trial ending `remainingMs` from now (negative
// for a trial that has already lapsed). Returns the ISO end date so a test can
// compare it against trialEndTime().
function useTrial(remainingMs, overrides = {}) {
  const end = new Date(Date.now() + remainingMs).toISOString();
  useCloudAccount({ tier: null, status: 'trialing', trialEndsAt: end, ...overrides });
  return end;
}

function stubCompaniesRow(result) {
  supabase.from = (table) => {
    assert.strictEqual(table, 'companies');
    return {
      select: () => ({
        eq: (column, value) => {
          assert.strictEqual(column, 'id');
          assert.ok(value);
          return { single: async () => result };
        },
      }),
    };
  };
}

let invokes = [];

function stubInvoke(result) {
  supabase.functions.invoke = async (fn, options) => {
    invokes.push({ fn, body: options && options.body });
    return result;
  };
}

beforeEach(() => {
  mem.clear();
  navigatedTo = [];
  invokes = [];
  store.companyId = null;
  store.companySettings = null;
  supabase.auth.getSession = async () => ({ data: { session: null }, error: null });
  stubInvoke({ data: { url: 'https://checkout.stripe.test/session' }, error: null });
});

afterEach(() => {
  supabase.from = originalFrom;
  supabase.functions.invoke = originalInvoke;
  supabase.auth.getSession = originalGetSession;
});

describe('subscriptionRequired gating', () => {
  test('never blocks a local account', () => {
    store.companyId = 'acct_local1';
    store.companySettings = { _subscription: { status: null } };
    assert.strictEqual(subscriptionRequired(), false);
  });

  test('never blocks before the subscription block has been loaded', () => {
    useCloudAccount(undefined);
    assert.strictEqual(subscriptionRequired(), false);
  });

  test('blocks a cloud account that has never paid', () => {
    useCloudAccount({ tier: null, status: null });
    assert.strictEqual(subscriptionRequired(), true);
  });

  test('does not block a live subscription', () => {
    for (const status of ['active', 'trialing', 'past_due']) {
      useCloudAccount({ tier: 'cloud', status });
      assert.strictEqual(subscriptionRequired(), false, `status ${status} should stay unlocked`);
    }
  });

  test('blocks a dead subscription', () => {
    for (const status of ['canceled', 'unpaid', 'incomplete_expired']) {
      useCloudAccount({ tier: 'cloud', status });
      assert.strictEqual(subscriptionRequired(), true, `status ${status} should be gated`);
    }
  });

  test('never blocks a complimentary account', () => {
    useCloudAccount({ tier: null, status: null, compTier: 'cloud' });
    assert.strictEqual(subscriptionRequired(), false);
  });

  test('agrees with subscriptionActive() on what counts as paid', () => {
    const cases = [
      { subscription: { tier: null, status: null }, required: true },
      { subscription: { tier: 'cloud', status: 'active' }, required: false },
      { subscription: { tier: 'cloud', status: 'canceled' }, required: true },
      { subscription: { tier: null, status: null, compTier: 'cloud' }, required: false },
    ];
    for (const { subscription, required } of cases) {
      useCloudAccount(subscription);
      assert.strictEqual(subscriptionRequired(), required);
      assert.strictEqual(subscriptionActive(), !required);
    }
  });
});

describe('reading subscription state off a companies row', () => {
  test('maps a fully populated row', () => {
    assert.deepStrictEqual(subscriptionFromRow(ROW), {
      tier: 'cloud',
      status: 'active',
      seats: 4,
      currentPeriodEnd: '2026-01-31T00:00:00Z',
      trialEndsAt: '2026-02-14T00:00:00Z',
      hasCustomer: true,
      compTier: null,
    });
  });

  test('maps a never-subscribed row to a known-unpaid block', () => {
    assert.deepStrictEqual(subscriptionFromRow({}), {
      tier: null,
      status: null,
      seats: null,
      currentPeriodEnd: null,
      trialEndsAt: null,
      hasCustomer: false,
      compTier: null,
    });
  });

  test('carries the free-trial end date off the row', () => {
    assert.strictEqual(
      subscriptionFromRow({ trial_ends_at: '2026-02-14T00:00:00Z' }).trialEndsAt,
      '2026-02-14T00:00:00Z'
    );
    assert.strictEqual(subscriptionFromRow({ trial_ends_at: null }).trialEndsAt, null);
  });

  test('keeps a complimentary grant', () => {
    assert.strictEqual(subscriptionFromRow({ comp_tier: 'cloud_plus' }).compTier, 'cloud_plus');
  });

  test('refuses to fetch without a company id', async () => {
    supabase.from = () => { throw new Error('should not be called'); };
    assert.strictEqual(await refreshSubscriptionFor(null), null);
    assert.strictEqual(await refreshSubscriptionFor(''), null);
  });

  test('caches the row on the active company and returns it', async () => {
    useCloudAccount(undefined);
    stubCompaniesRow({ data: ROW, error: null });
    const row = await refreshSubscriptionFor(CLOUD_ID);
    assert.strictEqual(row, ROW);
    assert.deepStrictEqual(store.companySettings._subscription, subscriptionFromRow(ROW));
  });

  test('does not leak another company\'s subscription into the active account', async () => {
    useCloudAccount(undefined, 'other-company-id');
    stubCompaniesRow({ data: ROW, error: null });
    assert.strictEqual(await refreshSubscriptionFor(CLOUD_ID), ROW);
    assert.deepStrictEqual(store.companySettings, {});
  });

  test('returns null instead of throwing when the row is unreadable', async () => {
    useCloudAccount(undefined);
    stubCompaniesRow({ data: null, error: { message: 'network' } });
    assert.strictEqual(await refreshSubscriptionFor(CLOUD_ID), null);
    assert.deepStrictEqual(store.companySettings, {});
  });

  test('refreshSubscription stays local-account aware after the refactor', async () => {
    store.companyId = 'acct_local1';
    store.companySettings = {};
    supabase.from = () => { throw new Error('should not be called'); };
    assert.strictEqual(await refreshSubscription(), null);

    useCloudAccount(undefined);
    stubCompaniesRow({ data: ROW, error: null });
    assert.strictEqual(await refreshSubscription(), ROW);
  });
  test('treats an unreadable (null) row as not yet paid', () => {
    assert.strictEqual(subscriptionActiveFromRow(null), false);
    assert.strictEqual(subscriptionActiveFromRow(undefined), false);
  });

  test('accepts the live Stripe statuses plus a complimentary grant', () => {
    for (const status of ['active', 'trialing', 'past_due']) {
      assert.strictEqual(subscriptionActiveFromRow({ subscription_status: status }), true, status);
    }
    assert.strictEqual(subscriptionActiveFromRow({ subscription_status: 'canceled' }), false);
    assert.strictEqual(subscriptionActiveFromRow({ subscription_status: null }), false);
    assert.strictEqual(subscriptionActiveFromRow({}), false);
    assert.strictEqual(subscriptionActiveFromRow({ subscription_status: 'canceled', comp_tier: 'cloud' }), true);
  });

  test('treats an expired no-card trial as not yet paid', () => {
    const past = new Date(Date.now() - 60000).toISOString();
    const future = new Date(Date.now() + 60000).toISOString();
    assert.strictEqual(
      subscriptionActiveFromRow({ subscription_status: 'trialing', trial_ends_at: past }),
      false,
    );
    assert.strictEqual(
      subscriptionActiveFromRow({ subscription_status: 'trialing', trial_ends_at: future }),
      true,
    );
    // Legacy trialing rows with no end date still count as running.
    assert.strictEqual(subscriptionActiveFromRow({ subscription_status: 'trialing' }), true);
    // A complimentary grant outlives the trial clock regardless of the date.
    assert.strictEqual(
      subscriptionActiveFromRow({ subscription_status: 'trialing', trial_ends_at: past, comp_tier: 'cloud' }),
      true,
    );
  });
});

describe('starting checkout during onboarding', () => {
  test('rejects an unknown plan', async () => {
    await assert.rejects(() => startSubscribeCheckout('free'), /Unknown plan/);
  });

  test('requires a Supabase session even before the app has a company', async () => {
    store.companyId = null;
    await assert.rejects(() => startSubscribeCheckout('cloud'), /Sign in to activate your subscription/);
    assert.deepStrictEqual(invokes, []);
  });

  test('sends the paywall return URLs and redirects to Stripe', async () => {
    supabase.auth.getSession = async () => ({ data: { session: { access_token: 't' } }, error: null });
    const data = await startSubscribeCheckout('cloud');

    assert.strictEqual(data.url, 'https://checkout.stripe.test/session');
    assert.deepStrictEqual(invokes, [{
      fn: 'relay-billing-checkout',
      body: {
        tier: 'cloud',
        successUrl: 'https://app.relay.test/#/subscribe?billing=success&tier=cloud',
        cancelUrl: 'https://app.relay.test/#/subscribe?billing=cancelled&tier=cloud',
      },
    }]);
    assert.deepStrictEqual(navigatedTo, ['https://checkout.stripe.test/session']);
  });

  test('defaults to the cloud plan', async () => {
    supabase.auth.getSession = async () => ({ data: { session: { access_token: 't' } }, error: null });
    await startSubscribeCheckout();
    assert.strictEqual(invokes[0].body.tier, 'cloud');
  });

  test('echoes the chosen tier back through the return URLs', async () => {
    supabase.auth.getSession = async () => ({ data: { session: { access_token: 't' } }, error: null });
    await startSubscribeCheckout('cloud_plus');
    assert.strictEqual(invokes[0].body.successUrl, 'https://app.relay.test/#/subscribe?billing=success&tier=cloud_plus');
    assert.strictEqual(invokes[0].body.cancelUrl, 'https://app.relay.test/#/subscribe?billing=cancelled&tier=cloud_plus');
  });

  test('surfaces a checkout failure', async () => {
    supabase.auth.getSession = async () => ({ data: { session: { access_token: 't' } }, error: null });
    stubInvoke({ data: null, error: new Error('Function returned 403') });
    await assert.rejects(() => startSubscribeCheckout('cloud_plus'), /403/);
    assert.deepStrictEqual(navigatedTo, []);
  });

  test('startCheckout still returns to the billing tab from Settings', async () => {
    useCloudAccount({ tier: 'cloud', status: 'active' });
    await startCheckout('cloud_plus');
    assert.deepStrictEqual(invokes[0].body, {
      tier: 'cloud_plus',
      successUrl: 'https://app.relay.test/#/settings?tab=billing&billing=success',
      cancelUrl: 'https://app.relay.test/#/settings?tab=billing&billing=cancelled',
    });
  });
});

describe('the 14-day cloud trial clock', () => {
  test('pins the trial length the migration also defaults to', () => {
    assert.strictEqual(TRIAL_DAYS, 14);
  });

  test('counts the days left on a running trial', () => {
    const end = useTrial(14 * 86400000);
    assert.strictEqual(trialActive(), true);
    assert.strictEqual(trialDaysLeft(), 14);
    assert.strictEqual(trialExpired(), false);
    assert.strictEqual(isReadOnly(), false);
    assert.strictEqual(trialEndTime(), Date.parse(end));
  });

  test('rounds a part-day up so the last stretch still reads as a day', () => {
    useTrial(20000);
    assert.strictEqual(trialDaysLeft(), 1);
    assert.strictEqual(trialActive(), true);
    assert.strictEqual(isReadOnly(), false);
  });

  test('reports zero days and a read-only account once the clock runs out', () => {
    const end = useTrial(-3600000);
    assert.strictEqual(trialActive(), false);
    assert.strictEqual(trialDaysLeft(), 0);
    assert.strictEqual(trialExpired(), true);
    assert.strictEqual(isReadOnly(), true);
    assert.strictEqual(trialEndTime(), Date.parse(end));
    assert.match(readOnlyReason(), /trial ended/);
    assert.match(readOnlyReason(), /export/);
  });

  test('is not a trial at all once the account is paying', () => {
    useCloudAccount({
      tier: 'cloud',
      status: 'active',
      trialEndsAt: new Date(Date.now() - 86400000).toISOString(),
    });
    assert.strictEqual(trialActive(), false);
    assert.strictEqual(trialExpired(), false);
    assert.strictEqual(trialDaysLeft(), null);
    assert.strictEqual(trialEndTime(), null);
    assert.strictEqual(isReadOnly(), false);
  });

  test('treats a legacy trialing row with no end date as running, never expired', () => {
    useCloudAccount({ tier: null, status: 'trialing', trialEndsAt: null });
    assert.strictEqual(trialActive(), true);
    assert.strictEqual(trialDaysLeft(), TRIAL_DAYS);
    assert.strictEqual(trialEndTime(), null);
    assert.strictEqual(isReadOnly(), false);
  });

  test('treats an unparseable end date the same way rather than locking the account', () => {
    useCloudAccount({ tier: null, status: 'trialing', trialEndsAt: 'not-a-date' });
    assert.strictEqual(trialActive(), true);
    assert.strictEqual(trialDaysLeft(), TRIAL_DAYS);
    assert.strictEqual(trialEndTime(), null);
    assert.strictEqual(isReadOnly(), false);
  });

  test('lets a complimentary grant outlive the trial clock', () => {
    useTrial(-86400000, { compTier: 'cloud' });
    assert.strictEqual(isComplimentary(), true);
    assert.strictEqual(trialExpired(), false);
    assert.strictEqual(isReadOnly(), false);
    assert.strictEqual(trialDaysLeft(), null);
    assert.strictEqual(subscriptionActive(), true);
  });

  test('never puts a local account in a trial', () => {
    store.companyId = 'acct_local1';
    store.companySettings = {
      _subscription: {
        tier: null,
        status: 'trialing',
        trialEndsAt: new Date(Date.now() - 86400000).toISOString(),
      },
    };
    assert.strictEqual(trialActive(), false);
    assert.strictEqual(trialExpired(), false);
    assert.strictEqual(trialDaysLeft(), null);
    assert.strictEqual(trialEndTime(), null);
    assert.strictEqual(isReadOnly(), false);
  });

  test('never locks a cloud account whose subscription block was never loaded', () => {
    useCloudAccount(undefined);
    assert.strictEqual(trialExpired(), false);
    assert.strictEqual(isReadOnly(), false);
    assert.strictEqual(readOnlyReason(), null);
  });
});

describe('read-only gating on an expired trial', () => {
  let writeTables = [];
  let warns = [];
  let originalWarn;

  // Every write path is supposed to bail before touching the network, so any
  // recorded table name is proof that a guard let a write through.
  function stubWrites() {
    supabase.from = (table) => {
      writeTables.push(table);
      return {
        select: () => ({ eq: () => ({ single: async () => ({ data: {}, error: null }) }) }),
        insert: async () => ({ error: null, data: {} }),
        upsert: async () => ({ error: null, data: {} }),
        update: () => ({ eq: async () => ({ error: null, data: {} }) }),
        delete: () => ({ eq: async () => ({ error: null, data: {} }) }),
      };
    };
  }

  beforeEach(() => {
    writeTables = [];
    warns = [];
    originalWarn = console.warn;
    console.warn = (...args) => warns.push(args.join(' '));
    store.clearSync();
    store.listeners = {};
    store.companyId = null;
    store.companySettings = null;
    stubWrites();
  });

  afterEach(() => {
    console.warn = originalWarn;
  });

  test('still reads while the trial has expired', () => {
    useTrial(-3600000);
    store.cache.jobs = [{ id: 'j1', title: 'Existing' }];
    assert.deepStrictEqual(store.getAll('jobs'), [{ id: 'j1', title: 'Existing' }]);
    assert.strictEqual(store.getById('jobs', 'j1').title, 'Existing');
    assert.deepStrictEqual(writeTables, []);
  });

  test('refuses an update without mutating the cached row', () => {
    useTrial(-3600000);
    store.cache.jobs = [{ id: 'j1', title: 'Existing' }];
    assert.strictEqual(store.update('jobs', 'j1', { title: 'Nope' }), null);
    assert.strictEqual(store.cache.jobs[0].title, 'Existing');
    assert.deepStrictEqual(writeTables, []);
    assert.ok(warns.some((line) => line.includes('Blocked write to jobs')));
  });

  test('refuses a delete and leaves the row in place', () => {
    useTrial(-3600000);
    store.cache.jobs = [{ id: 'j1', title: 'Existing' }];
    assert.strictEqual(store.delete('jobs', 'j1'), undefined);
    assert.deepStrictEqual(store.cache.jobs, [{ id: 'j1', title: 'Existing' }]);
    assert.deepStrictEqual(writeTables, []);
  });

  test('refuses a create but still hands back a stamped item', async () => {
    useTrial(-3600000);
    const created = await store.create('jobs', { title: 'Nope' });
    assert.ok(created && created.id, 'callers still need an id to render against');
    assert.strictEqual(created.companyId, CLOUD_ID);
    assert.deepStrictEqual(store.cache.jobs, []);
    assert.deepStrictEqual(writeTables, []);
  });

  test('refuses a settings save without overwriting the live settings', async () => {
    useTrial(-3600000);
    store.companySettings = { ...store.companySettings, name: 'Locked Co' };
    assert.strictEqual(await store.saveSettings({ name: 'Changed' }), undefined);
    assert.strictEqual(store.companySettings.name, 'Locked Co');
    assert.deepStrictEqual(writeTables, []);
  });

  test('refuses a bulk save without replacing the collection', async () => {
    useTrial(-3600000);
    store.cache.jobs = [{ id: 'j1', title: 'Existing' }];
    assert.strictEqual(await store.save('jobs', [{ id: 'j1', title: 'Nope' }]), undefined);
    assert.deepStrictEqual(store.cache.jobs, [{ id: 'j1', title: 'Existing' }]);
    assert.deepStrictEqual(writeTables, []);
  });

  test('lets a running trial write straight through', async () => {
    useTrial(14 * 86400000);
    await store.create('jobs', { title: 'Allowed' });
    assert.deepStrictEqual(writeTables, ['jobs']);
  });

  test('lets a paying customer write even though the trial date has passed', async () => {
    useCloudAccount({
      tier: 'cloud',
      status: 'active',
      trialEndsAt: new Date(Date.now() - 86400000).toISOString(),
    });
    await store.create('jobs', { title: 'Allowed' });
    assert.deepStrictEqual(writeTables, ['jobs']);
  });
});
