// ============================================
// RELAY — relay-billing-reconcile decision logic
// ============================================
// The pure half of the Stripe → `companies` repair path: which of a customer's
// subscriptions is the one that owns the company row, and what that subscription
// maps onto in the row's columns.
//
// This lives in its own module (rather than inline in index.ts) so node:test can
// exercise the real rules — see supabase/tests/billing-reconcile.test.js.
//
// Plain ESM, no Deno APIs, no types: importable from both the edge function and
// the node test runner. The mappings here MUST stay in step with
// relay-stripe-webhook's applySubscription()/tierForPrice(), because both write
// the same columns.

// Statuses in which Stripe is still billing the customer. Mirrors LIVE_STATUSES
// in src/utils/subscription.js and relay-billing-sync-seats.
export const LIVE_STATUSES = ['active', 'trialing', 'past_due'];

export function isLiveStatus(status) {
  return LIVE_STATUSES.includes(String(status || ''));
}

// A `cus_...` id is only valid inside the Stripe account *and* mode that minted
// it, so a test-mode id read with a live key (or a customer deleted in the
// dashboard) is gone rather than wrong. Stripe's words for that are Noise to a
// customer, but they are a real answer to "what does Stripe have for this
// company?": nothing. Same detection relay-billing-checkout uses to self-heal.
export function isStaleCustomerError(err) {
  const msg = String(err?.message ?? err);
  return msg.includes('No such customer') || msg.includes('resource_missing');
}

// Stripe price → our tier slug, by id (STRIPE_PRICE_* secret) or lookup_key —
// matching whichever setup relay-billing-checkout used. Unknown prices return
// null, which means "don't change the tier", so an add-on price cannot silently
// downgrade a company.
export function tierForPrice(price, prices = {}) {
  const id = price?.id;
  const lk = price?.lookup_key;
  if (id && id === prices.cloud) return 'cloud';
  if (id && id === prices.cloudPlus) return 'cloud_plus';
  if (lk === 'relay_cloud') return 'cloud';
  if (lk === 'relay_cloud_plus') return 'cloud_plus';
  return null;
}

// Which subscription should own the row?
//
//   - the one already recorded on the company, if Stripe still has it and it is
//     still live — a re-read of the same subscription is always safe;
//   - otherwise the newest live subscription — this is the checkout that just
//     finished, whose webhook never arrived;
//   - otherwise nothing. A cancelled/expired/incomplete subscription is NOT
//     adopted: the webhook remains the only writer that may downgrade a plan, so
//     a stale record can never cancel a live plan or a running trial.
export function pickSubscription(subs, currentId) {
  const list = (Array.isArray(subs) ? subs : []).filter(Boolean);
  const current = currentId ? list.find((s) => s?.id === currentId) : null;
  if (current && isLiveStatus(current.status)) return current;

  const live = list.filter((s) => isLiveStatus(s?.status));
  if (live.length > 1) {
    // Newest first: the just-completed checkout beats an older duplicate.
    live.sort((a, b) => Number(b.created || 0) - Number(a.created || 0));
  }
  return live[0] || null;
}

// Map a Stripe subscription onto the `companies` columns the webhook maintains.
// `nowIso` is injected so the caller controls the timestamp (and tests can pin it).
export function subscriptionPatch(sub, prices = {}, nowIso) {
  const item = sub?.items?.data?.[0];
  const customerId = typeof sub?.customer === 'string' ? sub.customer : sub?.customer?.id;
  const tier = tierForPrice(item?.price, prices);
  // In Stripe's flexible billing mode the period end lives on the subscription
  // ITEM; older (classic) subscriptions carry it at the top level. Prefer the
  // item, fall back to the subscription — same as the webhook.
  const periodEndUnix = item?.current_period_end ?? sub?.current_period_end;

  const patch = {
    subscription_status: sub?.status ?? null,
    stripe_subscription_id: sub?.id ?? null,
    subscription_seats: typeof item?.quantity === 'number' ? item.quantity : null,
    subscription_current_period_end: periodEndUnix
      ? new Date(periodEndUnix * 1000).toISOString()
      : null,
    subscription_updated_at: nowIso || new Date().toISOString(),
  };
  // Only overwrite the tier when we recognise the price (see tierForPrice).
  if (tier) patch.subscription_tier = tier;
  if (customerId) patch.stripe_customer_id = customerId;

  return { patch, active: isLiveStatus(sub?.status), tier, customerId: customerId || null };
}
