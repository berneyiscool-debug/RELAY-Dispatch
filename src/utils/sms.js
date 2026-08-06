// ============================================
// RELAY — SMS CLIENT (Telnyx, shared number pool)
// ============================================
// Thin client over the `relay-sms` edge function. Deliberately has no template
// text or recipient-address logic of its own -- the server renders the message
// from its own company/job/invoice lookups so this can never be used to send
// arbitrary free text to an arbitrary number. Cloud-gated + flag-gated (v1.3 #6,
// dark until launch): local/offline accounts never see it, and the whole
// feature stays hidden behind FLAGS.sms until 1.3.0 cuts.

import { supabase } from './supabase.js';
import { store } from '../data/store.js';
import { FLAGS } from './flags.js';

// Mirrors the inline check used across the app: a real company id that isn't
// a local `acct_` namespace.
function isCloudUser() {
  return !!(store.companyId && !String(store.companyId).startsWith('acct_'));
}

// Feature available to this user right now? (Master switch -- settings.sms.enabled
// defaults on until a company explicitly turns it off in Settings → SMS.)
export function smsEnabled() {
  if (!(FLAGS.sms && isCloudUser())) return false;
  const cfg = (store.getSettings() || {}).sms || {};
  return cfg.enabled !== false;
}

// Per-template send preference, independent of the master switch above.
// Defaults on, same shape as payments.js's paymentsEnabledFor().
export function smsEventEnabled(template) {
  if (!smsEnabled()) return false;
  const per = ((store.getSettings() || {}).sms || {}).enabledFor || {};
  return per[template] !== false;
}

/**
 * Send a templated SMS to a customer or contractor via the shared Telnyx pool.
 * @param {Object} params
 * @param {string} [params.customerId]    - one of customerId/contractorId, required
 * @param {string} [params.contractorId]
 * @param {'confirmation'|'reminder'|'payment_nudge'|'contractor_offer'} params.template
 * @param {string} [params.jobId]
 * @param {string} [params.invoiceId]
 * @returns {Promise<{sent:boolean, skipped?:string}>}
 * @throws if SMS isn't enabled for this account, or the edge function errors.
 */
export async function sendSms({ customerId, contractorId, template, jobId, invoiceId } = {}) {
  if (!smsEnabled()) throw new Error('SMS is not enabled for this account.');
  if (!customerId && !contractorId) throw new Error('customerId or contractorId is required.');
  if (!template) throw new Error('template is required.');

  const portalBaseUrl = (typeof location !== 'undefined' && location.origin) ? location.origin : 'https://relay.app';

  const { data, error } = await supabase.functions.invoke('relay-sms', {
    body: { customerId, contractorId, template, jobId, invoiceId, portalBaseUrl },
  });

  if (error) {
    let detail = error.message || String(error);
    try {
      if (error.context && typeof error.context.text === 'function') {
        const body = await error.context.text();
        if (body) { try { detail = JSON.parse(body).error || body; } catch { detail = body; } }
      }
    } catch (_) { /* keep generic */ }
    throw new Error(`SMS send failed: ${detail}`);
  }
  if (data?.error) throw new Error(data.error);
  return data;
}
