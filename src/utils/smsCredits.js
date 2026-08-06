// ============================================
// RELAY — SMS CREDITS CLIENT (v1.3 #6b)
// ============================================
// Reads the prepaid SMS credit balance. The balance lives on companies.
// sms_credit_cents, a real column guarded by a service-role-only trigger
// (migration 009_sms_credits.sql) -- never through store.getSettings(),
// which only caches `name`/`settings` at boot and would go stale the moment
// a send debits the balance server-side.
//
// No purchase function yet: the real Stripe top-up flow (relay-sms-buy-credits)
// is deferred until the subscription-billing project exists (see the SMS
// metered-billing plan). For now, credit is added directly via the
// increment_sms_credit RPC using the service-role key, outside the app.

import { supabase } from './supabase.js';
import { store } from '../data/store.js';

function isCloudUser() {
  return !!(store.companyId && !String(store.companyId).startsWith('acct_'));
}

/**
 * Current SMS credit balance, in AUD cents. Returns 0 for local/offline
 * accounts (SMS is a cloud-only feature) rather than throwing.
 */
export async function getSmsCreditCents() {
  if (!isCloudUser()) return 0;
  const { data, error } = await supabase
    .from('companies')
    .select('sms_credit_cents')
    .eq('id', store.companyId)
    .single();
  if (error) throw new Error(`Could not load SMS credit balance: ${error.message}`);
  return data?.sms_credit_cents ?? 0;
}
