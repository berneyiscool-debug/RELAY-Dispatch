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
};

function useCloudAccount(subscription, companyId = CLOUD_ID) {
  store.companyId = companyId;
  store.companySettings = subscription === undefined ? {} : { _subscription: subscription };
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
      hasCustomer: false,
      compTier: null,
    });
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
