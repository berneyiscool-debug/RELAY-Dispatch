// ============================================
// RELAY — SUBSCRIPTION / TIER CLIENT
// ============================================
// The account-tier layer that sits above the old binary local-vs-cloud gate.
//
//   free       — offline/local account (IndexedDB, `acct_` id). $0. No cloud row.
//   cloud      — $18 / active user / month. Core cloud features.
//   cloud_plus — $21 / active user / month. Adds Deputy Max (the expandable
//                full-workspace Deputy window). Cloud gets the same Deputy,
//                minimized-only.
//
// The tier + Stripe state are server-managed columns on `companies` (see
// 022_subscription_billing.sql); the store surfaces them read-only under
// settings._subscription. This module is the single place the UI asks
// "what can this account do?" and "start/manage a subscription".
//
// Feature gating splits in two:
//   • cloud features   — any cloud account (mirrors the existing isCloudUser gate)
//   • cloud+ features   — tier === 'cloud_plus' with a live subscription
// so we never regress a feature that used to work for every cloud account.

import { supabase } from './supabase.js';
import { store } from '../data/store.js';
import { webOrigin } from './webOrigin.js';

// Marketing/pricing catalogue. Amounts are AUD, per active user, per month.
export const PLAN_CATALOG = {
  free: {
    id: 'free',
    name: 'Free',
    price: 0,
    tagline: 'Offline-first. Runs entirely on this device.',
    features: ['Full dispatch, jobs, quotes & invoices', 'Local-only — no account needed', 'No per-seat fees'],
  },
  cloud: {
    id: 'cloud',
    name: 'Cloud',
    price: 18,
    tagline: 'The whole app, online — with brny.',
    features: ['Everything in Free', 'Cloud sync across your team', 'Online card payments & customer portal', 'RELAY email domain', 'brny AI assistant'],
  },
  cloud_plus: {
    id: 'cloud_plus',
    name: 'Cloud+',
    price: 21,
    tagline: 'Everything in Cloud, plus brny Max.',
    features: ['Everything in Cloud', 'brny Max — expand brny to the full workspace'],
  },
};

// Features that require the top tier. Keep this the ONE list the app consults.
// Cloud and Cloud+ are identical EXCEPT Deputy Max: the expandable, full-
// workspace Deputy window. Cloud gets Deputy minimized-only.
export const CLOUD_PLUS_FEATURES = new Set(['deputy_max']);

// Statuses in which a paid subscription is considered live.
const LIVE_STATUSES = new Set(['active', 'trialing', 'past_due']);

// Length of the no-card cloud trial. Mirrors the default in
// 037_terms_and_trial.sql (start_cloud_trial) and in migration 031's
// provisioning path — change all three together.
export const TRIAL_DAYS = 14;

// A real cloud account: a company id that isn't the local `acct_` namespace.
// Mirrors the inline check used across the app (and in payments.js).
export function isCloudUser() {
  return !!(store.companyId && !String(store.companyId).startsWith('acct_'));
}

// Raw server-managed subscription block (read-only).
export function getSubscription() {
  return (store.getSettings() || {})._subscription || {};
}

// Re-pull the server-side subscription state into the store. The app caches the
// company row at sign-in and doesn't get realtime updates on it, so anything
// that changes the subscription outside this tab — a Stripe Customer Portal
// switch/cancel, or the webhook finishing after checkout — is invisible until we
// refetch. Call this when showing billing. Best-effort; returns the raw row.
export async function refreshSubscription() {
  if (!isCloudUser()) return null;
  return await refreshSubscriptionFor(store.companyId);
}

// Same refetch for a company id that isn't the active one yet — a user who has
// a company row but is still parked on the paywall before the app boots.
export async function refreshSubscriptionFor(companyId) {
  if (!companyId) return null;
  try {
    const { data, error } = await supabase
      .from('companies')
      .select('subscription_tier, subscription_status, subscription_seats, subscription_current_period_end, stripe_customer_id, comp_tier, trial_ends_at')
      .eq('id', companyId)
      .single();
    if (error || !data) return null;
    if (store.companySettings && companyId === store.companyId) {
      store.companySettings._subscription = subscriptionFromRow(data);
      try { store.emit('settings', store.getSettings()); } catch (_) { /* non-fatal */ }
    }
    return data;
  } catch (_) {
    return null;
  }
}

// Map a `companies` row onto the read-only _subscription block. A row with no
// subscription yet comes back with NULL columns, which still means "known and
// unpaid" — distinct from a missing block, which means "not loaded".
export function subscriptionFromRow(data) {
  return {
    tier: data.subscription_tier || null,
    status: data.subscription_status || null,
    seats: data.subscription_seats ?? null,
    currentPeriodEnd: data.subscription_current_period_end || null,
    trialEndsAt: data.trial_ends_at || null,
    hasCustomer: !!data.stripe_customer_id,
    compTier: data.comp_tier || null,
  };
}

// Same "is this paid up?" question asked of a raw `companies` row rather than
// the cached settings block. The onboarding paywall polls a company row that
// isn't the active one yet, so it can't use subscriptionActive().
export function subscriptionActiveFromRow(data) {
  if (!data) return false;
  if (data.comp_tier) return true;
  return LIVE_STATUSES.has(String(data.subscription_status || ''));
}

// The account's effective tier: 'free' | 'cloud' | 'cloud_plus'.
// A local account is always Free. A cloud account is whatever tier it holds;
// until it picks a plan its tier column is null — treat that as 'cloud' so the
// core cloud experience works during onboarding, while cloud+ stays locked.
export function getTier() {
  if (!isCloudUser()) return 'free';
  const sub = getSubscription();
  // A complimentary grant (comp_tier, set only via Supabase) overrides Stripe.
  if (sub.compTier === 'cloud_plus' || sub.tier === 'cloud_plus') return 'cloud_plus';
  return 'cloud';
}

// True when the account has full cloud access right now — a live Stripe
// subscription (paying/trialing/past-due) OR a complimentary comp grant.
export function subscriptionActive() {
  if (!isCloudUser()) return false;
  const sub = getSubscription();
  if (sub.compTier) return true; // comp access is always "active", no charge
  return LIVE_STATUSES.has(String(sub.status || ''));
}

// Is this account on a free complimentary grant (no Stripe subscription)?
export function isComplimentary() {
  return !!getSubscription().compTier;
}

// Billing needs attention (card declined etc.) — surface a banner.
export function subscriptionPastDue() {
  return String(getSubscription().status || '') === 'past_due';
}

// --- Trial & read-only -------------------------------------------------------
//
// The cloud trial is a no-card trial: there is no Stripe subscription and no
// customer record, so Stripe reports nothing and `subscription_status` is set
// to 'trialing' by start_cloud_trial() purely so that LIVE_STATUSES (and
// therefore the paywall) treats the account as paid up. Expiry is therefore
// decided here from `trial_ends_at`, not from a webhook.

// Epoch ms of the trial end, or null when the account isn't on a dated trial.
function trialEndMs(sub) {
  if (!sub || !sub.trialEndsAt) return null;
  const ms = Date.parse(sub.trialEndsAt);
  return Number.isNaN(ms) ? null : ms;
}

// 'none' | 'running' | 'expired'. One predicate behind every trial question so
// the banner, the gate and the helper functions can't disagree.
// A legacy `trialing` row with no trial_ends_at was provisioned before migration
// 037 and has no clock to run out, so it counts as running rather than expired.
function trialState() {
  if (!isCloudUser()) return 'none';
  const sub = getSubscription();
  if (sub.compTier) return 'none'; // a comp grant outlives any trial clock
  if (String(sub.status || '') !== 'trialing') return 'none';
  const end = trialEndMs(sub);
  if (end === null) return 'running';
  return end > Date.now() ? 'running' : 'expired';
}

// True while a dated trial is running.
export function trialActive() {
  return trialState() === 'running';
}

// Whole days left in the trial, rounded up and never negative — 0 once it has
// run out, null only when the account isn't on a trial at all. A dated trial
// always has a number, so banner copy can rely on it without a separate expiry
// check; see trialEndTime() when the hours matter.
export function trialDaysLeft() {
  const state = trialState();
  if (state === 'none') return null;
  if (state === 'expired') return 0;
  const end = trialEndMs(getSubscription());
  if (end === null) return TRIAL_DAYS;
  return Math.max(0, Math.ceil((end - Date.now()) / 86400000));
}

// The trial's end instant in ms, or null when the account has no dated trial.
// Exposed so callers can tell "a few hours left" from "a few days left": the
// day count rounds up, so a trial with 20 seconds on the clock still reads as
// "1 day left", which is too coarse for final-stretch copy.
export function trialEndTime() {
  if (trialState() === 'none') return null;
  return trialEndMs(getSubscription());
}

// The trial ran and nobody subscribed. No card was ever on file, so nothing is
// charged and nothing is owed — the account just stops accepting writes.
export function trialExpired() {
  return trialState() === 'expired';
}

// True when the account may read but not write anything.
//
// Read-only is a trial-expiry state, not a paywall: the paywall (a hard
// redirect to /subscribe) only ever fires for a company row with a known and
// unpaid subscription status, and 'trialing' is not that. Fails OPEN for the
// same reason subscriptionRequired() does — an unloaded or unexpected
// subscription block must never lock a working account down to read-only.
export function isReadOnly() {
  return trialState() === 'expired';
}

// Why writes are blocked, for the banner and the toast. Null when they aren't.
export function readOnlyReason() {
  if (!isReadOnly()) return null;
  return `Your free trial ended, so changes are paused. Subscribe to start editing again — your data is safe and you can export it at any time.`;
}

// True when a signed-in cloud account must pay before using the app.
//
// This is the paywall. It fails OPEN on purpose: a cloud account whose
// subscription block was never loaded (_subscription absent, i.e. `status ===
// undefined`) is let through rather than locked out of a working account, and
// 'past_due' stays unlocked because Stripe is still retrying the card. What it
// catches is the known-and-unpaid state — a company row that exists with a null
// subscription status, which is exactly what a self-signup that skipped
// Checkout leaves behind.
export function subscriptionRequired() {
  if (!isCloudUser()) return false;
  const sub = getSubscription();
  if (sub.compTier) return false; // complimentary accounts never pay
  if (sub.status === undefined) return false; // not loaded — don't guess
  return !LIVE_STATUSES.has(String(sub.status || ''));
}

// Cloud-tier features: any cloud account (unchanged from today's gate).
export function hasCloudFeatures() {
  return isCloudUser();
}

// Cloud+ features: must be on the Cloud+ tier with a live subscription.
export function isCloudPlus() {
  return getTier() === 'cloud_plus' && subscriptionActive();
}

// The one gate the UI calls. Unknown feature keys default to cloud-tier.
export function featureAllowed(feature) {
  if (CLOUD_PLUS_FEATURES.has(feature)) return isCloudPlus();
  return hasCloudFeatures();
}

// The minimum tier a feature needs — for tooltips ("Requires Cloud+").
export function requiredTierFor(feature) {
  return CLOUD_PLUS_FEATURES.has(feature) ? 'cloud_plus' : 'cloud';
}

async function invoke(fn, body) {
  const { data, error } = await supabase.functions.invoke(fn, { body: body || {} });
  if (error) {
    let detail = error.message || String(error);
    try {
      if (error.context && typeof error.context.text === 'function') {
        const text = await error.context.text();
        if (text) { try { detail = JSON.parse(text).error || text; } catch { detail = text; } }
      }
    } catch (_) { /* keep generic */ }
    throw new Error(detail);
  }
  if (data?.error) throw new Error(data.error);
  return data;
}

async function createCheckoutSession(tier, successUrl, cancelUrl) {
  if (tier !== 'cloud' && tier !== 'cloud_plus') throw new Error('Unknown plan.');
  const data = await invoke('relay-billing-checkout', { tier, successUrl, cancelUrl });
  if (!data?.url) throw new Error('No checkout URL was returned.');
  if (typeof location !== 'undefined') location.href = data.url;
  return data;
}

// Stripe returns the user to this origin, so it has to be the hosted web app
// rather than whatever origin the bundle happens to be running from — in the
// packaged desktop build that is file://, whose origin is unusable.
function checkoutOrigin() {
  return webOrigin();
}

/**
 * Begin (or change to) a paid plan. Redirects the browser to Stripe Checkout.
 * @param {'cloud'|'cloud_plus'} tier
 */
export async function startCheckout(tier) {
  if (!isCloudUser()) throw new Error('Create a cloud account first to subscribe.');
  const origin = checkoutOrigin();
  return await createCheckoutSession(
    tier,
    `${origin}/#/settings?tab=billing&billing=success`,
    `${origin}/#/settings?tab=billing&billing=cancelled`,
  );
}

/**
 * Collect payment details during onboarding, before the account is usable.
 * Unlike startCheckout() this only needs a *Supabase* session — the company row
 * may exist with no subscription yet (that is the state that lands here) — and
 * it returns the user to the paywall so onboarding can finish on the way back.
 * @param {'cloud'|'cloud_plus'} tier
 */
export async function startSubscribeCheckout(tier = 'cloud') {
  if (tier !== 'cloud' && tier !== 'cloud_plus') throw new Error('Unknown plan.');
  const { data } = await supabase.auth.getSession();
  if (!data?.session) throw new Error('Sign in to activate your subscription.');
  const origin = checkoutOrigin();
  return await createCheckoutSession(
    tier,
    `${origin}/#/subscribe?billing=success&tier=${tier}`,
    `${origin}/#/subscribe?billing=cancelled&tier=${tier}`,
  );
}

/**
 * Switch an EXISTING subscription between Cloud and Cloud+ in place (prorated).
 * Use this when subscriptionActive() — it swaps the price on the current
 * subscription instead of creating a second one. No redirect.
 * @param {'cloud'|'cloud_plus'} tier
 */
export async function changePlan(tier) {
  if (!isCloudUser()) throw new Error('No subscription to change.');
  if (tier !== 'cloud' && tier !== 'cloud_plus') throw new Error('Unknown plan.');
  return await invoke('relay-billing-change-plan', { tier });
}

/** Open Stripe's hosted portal to manage/cancel/update the subscription. */
export async function openBillingPortal() {
  if (!isCloudUser()) throw new Error('No subscription to manage.');
  const origin = webOrigin();
  const data = await invoke('relay-billing-portal', { returnUrl: `${origin}/#/settings?tab=billing` });
  if (!data?.url) throw new Error('No portal URL was returned.');
  if (typeof location !== 'undefined') location.href = data.url;
  return data;
}

/**
 * Reconcile Stripe's seat quantity to the current active-user count (prorated).
 * Best-effort: call after adding/deactivating a user. Never throws to the caller
 * flow — a failed sync is logged and reconciled again on the next change.
 */
export async function syncSeats() {
  if (!isCloudUser() || !subscriptionActive()) return null;
  try {
    return await invoke('relay-billing-sync-seats', {});
  } catch (e) {
    console.warn('syncSeats failed (will reconcile on next change):', e?.message || e);
    return null;
  }
}
