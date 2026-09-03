// ============================================
// RELAY — PAYMENTS CLIENT (Stripe Connect — customer invoice payments)
// ============================================
// Tenants connect THEIR OWN Stripe (Express) account; their customers pay
// invoices directly into it. This module drives onboarding + status and creates
// the hosted checkout link for an invoice. Cloud-gated + flag-gated (payments
// are a cloud feature, hidden until FLAGS.payments). The relay-stripe-webhook
// marks the invoice Paid when payment completes.

import { supabase } from './supabase.js';
import { store } from '../data/store.js';
import { FLAGS } from './flags.js';

// Cloud accounts only. Mirrors the check used across the app.
function isCloudUser() {
  return !!(store.companyId && !String(store.companyId).startsWith('acct_'));
}

// Per-company payments config (currency, per-doc toggles) lives in settings.payments.
export function paymentsSettings() {
  return (store.getSettings() || {}).payments || {};
}

// Server-managed Connect status (read-only), surfaced by the store.
export function connectInfo() {
  return (store.getSettings() || {})._connect || {};
}

// Has the tenant finished onboarding and can they accept charges?
export function connectReady() {
  return !!connectInfo().chargesEnabled;
}

// Feature available to this user right now (shows the Payments settings tab)?
export function paymentsEnabled() {
  return !!(FLAGS.payments && isCloudUser());
}

// Is online payment switched on for this document type? Requires a connected
// account that can actually take charges, plus the per-type toggle (default on).
export function paymentsEnabledFor(docType = 'invoice') {
  if (!paymentsEnabled()) return false;
  if (!connectReady()) return false;
  const per = paymentsSettings().enabledFor;
  return !per || per[docType] !== false;
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

// ── Connect onboarding / status (admin, in Settings → Payments) ──────

/** Begin (or resume) Stripe Express onboarding. Redirects to Stripe. */
export async function startConnectOnboarding(returnPath = '/settings?tab=payments') {
  if (!isCloudUser()) throw new Error('Create a cloud account first.');
  const data = await invoke('relay-connect-onboard', { returnPath });
  if (!data?.url) throw new Error('Could not start onboarding.');
  if (typeof location !== 'undefined') location.href = data.url;
  return data;
}

/** Refresh the connected-account status into the store. Returns the status. */
export async function refreshConnectStatus({ loginLink = false } = {}) {
  if (!isCloudUser()) return null;
  const data = await invoke('relay-connect-status', { loginLink });
  if (data && store.companySettings) {
    store.companySettings._connect = {
      accountId: connectInfo().accountId || null,
      chargesEnabled: !!data.chargesEnabled,
      detailsSubmitted: !!data.detailsSubmitted,
    };
    try { store.emit('settings', store.getSettings()); } catch (_) { /* non-fatal */ }
  }
  return data;
}

/** Open the tenant's Stripe dashboard (payouts, history). Full-dashboard
 *  accounts have no platform login link — send them to dashboard.stripe.com. */
export async function openConnectDashboard() {
  const data = await invoke('relay-connect-status', { loginLink: true });
  const url = data?.loginUrl || 'https://dashboard.stripe.com/';
  if (typeof location !== 'undefined') location.href = url;
  return data;
}

// ── Invoice payment link ─────────────────────────────────────────────

/**
 * Create a Stripe Checkout link to pay an invoice (charged on the tenant's
 * connected account). Works for the in-app "Pay Link" and emailed links.
 * @returns {Promise<{url:string, sessionId:string}>}
 */
export async function createInvoicePaymentLink(invoice) {
  if (!invoice || !invoice.id) throw new Error('A saved invoice is required.');
  return createPaymentLinkForInvoiceId(invoice.id);
}

/**
 * Create a checkout link from just an invoice id. Used by emailed links and the
 * (unauthenticated) customer portal — the edge function authorises by invoice.
 * @returns {Promise<{url:string, sessionId:string}>}
 */
export async function createPaymentLinkForInvoiceId(invoiceId, opts = {}) {
  if (!invoiceId) throw new Error('An invoice id is required.');
  const origin = (typeof location !== 'undefined' && location.origin) ? location.origin : 'https://relay.app';
  const data = await invoke('relay-create-payment', {
    invoiceId,
    successUrl: opts.successUrl || `${origin}/#/invoices?paid=${encodeURIComponent(invoiceId)}`,
    cancelUrl: opts.cancelUrl || `${origin}/#/invoices`,
  });
  if (!data?.url) throw new Error('No checkout URL was returned.');
  // Best-effort: remember the session id on the invoice for reconciliation.
  if (data.sessionId) {
    try { store.update('invoices', invoiceId, { stripeSessionId: data.sessionId }); } catch (_) { /* non-fatal */ }
  }
  return data;
}
