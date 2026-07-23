// ============================================
// RELAY — PAYMENTS CLIENT (Stripe online payments)
// ============================================
// Thin client over the `relay-create-payment` edge function. Creates a hosted
// Stripe Checkout link for an invoice; the `relay-stripe-webhook` function marks
// the invoice Paid when payment completes. Cloud-gated + flag-gated (v1.3 #3,
// dark until launch): local/offline accounts never see it, and the whole feature
// stays hidden behind FLAGS.payments until 1.3.0 cuts.

import { supabase } from './supabase.js';
import { store } from '../data/store.js';
import { FLAGS } from './flags.js';

// Cloud accounts only (paid API). Mirrors the inline check used across the app:
// a real company id that isn't a local `acct_` namespace.
function isCloudUser() {
  return !!(store.companyId && !String(store.companyId).startsWith('acct_'));
}

// Per-company payments config lives in settings.payments (set in Settings → Payments).
export function paymentsSettings() {
  return (store.getSettings() || {}).payments || {};
}

// Feature available to this user right now?
export function paymentsEnabled() {
  return !!(FLAGS.payments && isCloudUser());
}

// Is online payment switched on for this document type? Requires the admin to have
// ticked "Payments configured & live" in Settings → Payments (so we never show a
// Pay button before Stripe is actually set up).
export function paymentsEnabledFor(docType = 'invoice') {
  if (!paymentsEnabled()) return false;
  const cfg = paymentsSettings();
  if (!cfg.connected) return false;
  const per = cfg.enabledFor;
  return !per || per[docType] !== false; // default on once connected
}

function resolveCustomerEmail(invoice) {
  if (invoice.customerEmail) return invoice.customerEmail;
  const cid = invoice.customer_id || invoice.customerId;
  if (cid) {
    const c = store.getById('customers', cid);
    if (c?.email) return c.email;
  }
  return undefined;
}

/**
 * Create a Stripe Checkout link for an invoice.
 * @returns {Promise<{url:string, sessionId:string}>}
 * @throws if not enabled, invalid amount, or the edge function errors.
 */
export async function createInvoicePaymentLink(invoice) {
  if (!paymentsEnabled()) throw new Error('Online payments are not enabled for this account.');
  if (!invoice || !invoice.id) throw new Error('A saved invoice is required.');
  const amount = Number(invoice.total);
  if (!Number.isFinite(amount) || amount <= 0) throw new Error('Invoice total must be greater than zero.');

  const settings = store.getSettings() || {};
  const cfg = settings.payments || {};
  const origin = (typeof location !== 'undefined' && location.origin) ? location.origin : 'https://relay.app';

  const { data, error } = await supabase.functions.invoke('relay-create-payment', {
    body: {
      invoiceId: invoice.id,
      invoiceNumber: invoice.number,
      amount,
      currency: (cfg.currency || 'aud').toLowerCase(),
      customerEmail: resolveCustomerEmail(invoice),
      companyName: settings.name,
      successUrl: `${origin}/#/invoices?paid=${encodeURIComponent(invoice.number || invoice.id)}`,
      cancelUrl: `${origin}/#/invoices`,
    },
  });

  if (error) {
    let detail = error.message || String(error);
    try {
      if (error.context && typeof error.context.text === 'function') {
        const body = await error.context.text();
        if (body) { try { detail = JSON.parse(body).error || body; } catch { detail = body; } }
      }
    } catch (_) { /* keep generic */ }
    throw new Error(`Payment link failed: ${detail}`);
  }
  if (data?.error) throw new Error(data.error);
  if (!data?.url) throw new Error('No checkout URL was returned.');

  // Best-effort: remember the session id on the invoice for reconciliation.
  if (data.sessionId) {
    try { store.update('invoices', invoice.id, { stripeSessionId: data.sessionId }); } catch (_) { /* non-fatal */ }
  }
  return data;
}
