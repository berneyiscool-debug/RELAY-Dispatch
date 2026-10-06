/**
 * Behavioural tests for the Stripe → companies reconcile path.
 *
 * The decision logic lives in supabase/functions/relay-billing-reconcile/reconcile.js
 * so it can be exercised here for real. The rules that matter are the ones that
 * could take a paying customer's access away or hand it to them: which of a
 * customer's subscriptions is adopted (never a cancelled one), and which columns
 * are written (the tier only when the price is recognised).
 *
 * Run with: npm run test:migrations
 */
import { describe, test } from 'node:test';
import assert from 'node:assert';
import {
  LIVE_STATUSES,
  isLiveStatus,
  pickSubscription,
  subscriptionPatch,
  tierForPrice,
} from '../functions/relay-billing-reconcile/reconcile.js';

const PRICES = { cloud: 'price_cloud_123', cloudPlus: 'price_plus_456' };

// Stripe's flexible billing mode puts the period end on the subscription item.
const sub = (over = {}) => ({
  id: 'sub_1',
  status: 'active',
  created: 1_700_000_000,
  customer: 'cus_1',
  items: { data: [{ id: 'si_1', quantity: 3, price: { id: PRICES.cloud } }] },
  ...over,
});

describe('live statuses', () => {
  test('active, trialing and past_due still entitle the account', () => {
    assert.deepStrictEqual(LIVE_STATUSES, ['active', 'trialing', 'past_due']);
    for (const s of LIVE_STATUSES) assert.strictEqual(isLiveStatus(s), true);
  });

  test('cancelled, unpaid, incomplete and missing do not', () => {
    for (const s of ['canceled', 'unpaid', 'incomplete', 'incomplete_expired', 'paused', '', null, undefined]) {
      assert.strictEqual(isLiveStatus(s), false);
    }
  });
});

describe('tier from price', () => {
  test('matches by price id', () => {
    assert.strictEqual(tierForPrice({ id: PRICES.cloud }, PRICES), 'cloud');
    assert.strictEqual(tierForPrice({ id: PRICES.cloudPlus }, PRICES), 'cloud_plus');
  });

  test('falls back to the lookup key', () => {
    assert.strictEqual(tierForPrice({ id: 'price_x', lookup_key: 'relay_cloud' }, PRICES), 'cloud');
    assert.strictEqual(tierForPrice({ id: 'price_x', lookup_key: 'relay_cloud_plus' }, PRICES), 'cloud_plus');
  });

  test('an unrecognised price yields no tier (so the row is left alone)', () => {
    assert.strictEqual(tierForPrice({ id: 'price_addon', lookup_key: 'relay_extra_seat' }, PRICES), null);
    assert.strictEqual(tierForPrice({ id: 'price_x' }, {}), null);
    assert.strictEqual(tierForPrice(undefined, PRICES), null);
  });
});

describe('choosing which subscription owns the company', () => {
  test('keeps the recorded subscription while it is still live', () => {
    const other = sub({ id: 'sub_2', created: 1_800_000_000, status: 'active' });
    const mine = sub({ id: 'sub_1', status: 'past_due', created: 1_600_000_000 });
    assert.strictEqual(pickSubscription([other, mine], 'sub_1'), mine);
  });

  test('adopts the newest live subscription when none is recorded yet', () => {
    const older = sub({ id: 'sub_old', created: 1_600_000_000 });
    const newer = sub({ id: 'sub_new', created: 1_800_000_000 });
    assert.strictEqual(pickSubscription([older, newer], null), newer);
    assert.strictEqual(pickSubscription([newer, older], null), newer);
  });

  test('a recorded subscription Stripe has ended is NOT kept', () => {
    const dead = sub({ id: 'sub_1', status: 'canceled' });
    const fresh = sub({ id: 'sub_2', status: 'active', created: 1_900_000_000 });
    assert.strictEqual(pickSubscription([dead, fresh], 'sub_1'), fresh);
  });

  test('nothing live means nothing is adopted — a cancelled record can never cancel a plan', () => {
    const dead = sub({ id: 'sub_1', status: 'canceled' });
    const unpaid = sub({ id: 'sub_2', status: 'unpaid' });
    assert.strictEqual(pickSubscription([dead, unpaid], 'sub_1'), null);
    assert.strictEqual(pickSubscription([], null), null);
    assert.strictEqual(pickSubscription(undefined, 'sub_1'), null);
    assert.strictEqual(pickSubscription([null, undefined], null), null);
  });

  test('a trialing subscription is adoptable (no-card trial has no subscription id yet)', () => {
    const trial = sub({ id: 'sub_trial', status: 'trialing' });
    assert.strictEqual(pickSubscription([trial], null), trial);
  });
});

describe('column mapping', () => {
  const now = '2026-10-07T00:00:00.000Z';

  test('writes the same columns the webhook does', () => {
    const { patch, active, tier, customerId } = subscriptionPatch(
      sub({ items: { data: [{ quantity: 3, price: { id: PRICES.cloud }, current_period_end: 1_800_000_000 }] } }),
      PRICES,
      now,
    );
    assert.deepStrictEqual(patch, {
      subscription_status: 'active',
      stripe_subscription_id: 'sub_1',
      subscription_seats: 3,
      subscription_current_period_end: new Date(1_800_000_000 * 1000).toISOString(),
      subscription_updated_at: now,
      subscription_tier: 'cloud',
      stripe_customer_id: 'cus_1',
    });
    assert.strictEqual(active, true);
    assert.strictEqual(tier, 'cloud');
    assert.strictEqual(customerId, 'cus_1');
  });

  test('prefers the item period end and falls back to the subscription one', () => {
    const itemLevel = subscriptionPatch(
      sub({ items: { data: [{ quantity: 2, price: { id: PRICES.cloud }, current_period_end: 1_800_000_000 }] } }),
      PRICES, now,
    );
    assert.strictEqual(itemLevel.patch.subscription_current_period_end, new Date(1_800_000_000 * 1000).toISOString());

    const topLevel = subscriptionPatch(
      sub({ current_period_end: 1_700_000_000, items: { data: [{ quantity: 2, price: { id: PRICES.cloud } }] } }),
      PRICES, now,
    );
    assert.strictEqual(topLevel.patch.subscription_current_period_end, new Date(1_700_000_000 * 1000).toISOString());
  });

  test('leaves the tier untouched for an unrecognised price', () => {
    const { patch, tier } = subscriptionPatch(
      sub({ items: { data: [{ quantity: 1, price: { id: 'price_unknown' } }] } }),
      PRICES, now,
    );
    assert.strictEqual('subscription_tier' in patch, false);
    assert.strictEqual(tier, null);
  });

  test('a missing quantity reports null rather than inventing a seat count', () => {
    const { patch } = subscriptionPatch(sub({ items: { data: [{ price: { id: PRICES.cloud } }] } }), PRICES, now);
    assert.strictEqual(patch.subscription_seats, null);
  });

  test('tolerates an expanded customer object and a subscription with no items', () => {
    const expanded = subscriptionPatch(sub({ customer: { id: 'cus_1' } }), PRICES, now);
    assert.strictEqual(expanded.patch.stripe_customer_id, 'cus_1');

    const { patch } = subscriptionPatch({ id: 'sub_9', status: 'active', customer: 'cus_9' }, PRICES, now);
    assert.deepStrictEqual(patch, {
      subscription_status: 'active',
      stripe_subscription_id: 'sub_9',
      subscription_seats: null,
      subscription_current_period_end: null,
      subscription_updated_at: now,
      stripe_customer_id: 'cus_9',
    });
  });

  test('defaults the timestamp when none is supplied', () => {
    const { patch } = subscriptionPatch(sub(), PRICES);
    assert.match(String(patch.subscription_updated_at), /^\d{4}-\d{2}-\d{2}T/);
  });
});
