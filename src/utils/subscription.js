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
    tagline: 'The whole app, online — with Deputy.',
    features: ['Everything in Free', 'Cloud sync across your team', 'Online card payments & customer portal', 'RELAY email domain', 'Deputy AI assistant'],
  },
  cloud_plus: {
    id: 'cloud_plus',
    name: 'Cloud+',
    price: 21,
    tagline: 'Everything in Cloud, plus Deputy Max.',
    features: ['Everything in Cloud', 'Deputy Max — expand Deputy to the full workspace'],
  },
};

// Features that require the top tier. Keep this the ONE list the app consults.
// Cloud and Cloud+ are identical EXCEPT Deputy Max: the expandable, full-
// workspace Deputy window. Cloud gets Deputy minimized-only.
export const CLOUD_PLUS_FEATURES = new Set(['deputy_max']);

// Statuses in which a paid subscription is considered live.
const LIVE_STATUSES = new Set(['active', 'trialing', 'past_due']);

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
  try {
    const { data, error } = await supabase
      .from('companies')
      .select('subscription_tier, subscription_status, subscription_seats, subscription_current_period_end, stripe_customer_id, comp_tier')
      .eq('id', store.companyId)
      .single();
    if (error || !data) return null;
    if (store.companySettings) {
      store.companySettings._subscription = {
        tier: data.subscription_tier || null,
        status: data.subscription_status || null,
        seats: data.subscription_seats ?? null,
        currentPeriodEnd: data.subscription_current_period_end || null,
        hasCustomer: !!data.stripe_customer_id,
        compTier: data.comp_tier || null,
      };
      try { store.emit('settings', store.getSettings()); } catch (_) { /* non-fatal */ }
    }
    return data;
  } catch (_) {
    return null;
  }
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

/**
 * Begin (or change to) a paid plan. Redirects the browser to Stripe Checkout.
 * @param {'cloud'|'cloud_plus'} tier
 */
export async function startCheckout(tier) {
  if (!isCloudUser()) throw new Error('Create a cloud account first to subscribe.');
  if (tier !== 'cloud' && tier !== 'cloud_plus') throw new Error('Unknown plan.');
  const origin = (typeof location !== 'undefined' && location.origin) ? location.origin : 'https://relay.app';
  const data = await invoke('relay-billing-checkout', {
    tier,
    successUrl: `${origin}/#/settings?tab=billing&billing=success`,
    cancelUrl: `${origin}/#/settings?tab=billing&billing=cancelled`,
  });
  if (!data?.url) throw new Error('No checkout URL was returned.');
  if (typeof location !== 'undefined') location.href = data.url;
  return data;
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
  const origin = (typeof location !== 'undefined' && location.origin) ? location.origin : 'https://relay.app';
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
