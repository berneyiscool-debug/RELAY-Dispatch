// ============================================
// RELAY — XERO CLIENT (Settings → Cost Centers & Xero)
// ============================================
// Connects a cloud company to one Xero organisation and reads what the Settings
// card shows. Everything that touches Xero runs server-side (relay-xero-*);
// tokens never reach the browser. Cloud-only and flag-gated (FLAGS.xero) until
// the sync worker ships.

import { store } from '../data/store.js';
import { FLAGS } from './flags.js';
import { invoke } from './payments.js';

export const XERO_RETURN_PATH = '/settings?tab=cost_centers';

function isCloudUser() {
  return !!(store.companyId && !String(store.companyId).startsWith('acct_'));
}

/** Show the Xero tab and card for this user? */
export function xeroEnabled() {
  return !!(FLAGS.xero && isCloudUser());
}

/** Per-company Xero defaults (accounts, terms) live in settings.xero. */
export function xeroSettings() {
  const value = (store.getSettings() || {}).xero;
  return value && typeof value === 'object' ? value : {};
}

const DEFAULT_KEYS = [
  'defaultSalesAccountCode',
  'labourAccountCode',
  'materialsAccountCode',
  'paymentAccountCode',
  'stripeAccountCode',
  'defaultDueDays',
];

/**
 * Normalise the defaults form into what relay-xero-sync reads. Blank values are
 * dropped so the worker's fallbacks apply; due days must be a whole 0–365.
 */
export function normaliseXeroDefaults(input = {}) {
  const out = {};
  for (const key of DEFAULT_KEYS) {
    const raw = input[key];
    if (raw === undefined || raw === null || String(raw).trim() === '') continue;
    if (key === 'defaultDueDays') {
      const days = Number(raw);
      if (!Number.isInteger(days) || days < 0 || days > 365) throw new Error('Payment terms must be a whole number of days between 0 and 365.');
      out[key] = days;
    } else {
      out[key] = String(raw).trim().slice(0, 50);
    }
  }
  return out;
}

/** Problems that would stop invoices or payments syncing, in plain words. */
export function xeroDefaultsWarnings(defaults = xeroSettings()) {
  const warnings = [];
  if (!defaults.defaultSalesAccountCode) {
    warnings.push('Choose a default sales account. Lines with no cost center or type account will fail to sync without one.');
  }
  if (!defaults.paymentAccountCode) {
    warnings.push('Choose the account payments are received into, or payments recorded in RELAY won\'t reach Xero.');
  }
  return warnings;
}

export async function saveXeroDefaults(input) {
  const s = store.getSettings() || {};
  s.xero = { ...normaliseXeroDefaults(input) };
  await store.saveSettings(s);
  return s.xero;
}

/**
 * What a return from the Xero consent screen (?xero=<outcome>) means for the
 * admin. Returns null when there is nothing to say.
 */
export function xeroReturnMessage(outcome) {
  switch (outcome) {
    case 'connected': return { type: 'success', text: 'Xero connected.' };
    case 'choose': return { type: 'info', text: 'You gave access to more than one Xero organisation. Choose the one RELAY should use.' };
    case 'cancelled': return { type: 'info', text: 'Xero connection cancelled.' };
    case 'no_org': return { type: 'error', text: 'No Xero organisation was selected. Try again and tick the organisation to connect.' };
    case 'unsupported_currency': return { type: 'error', text: 'RELAY only works with Xero organisations that use Australian dollars.' };
    case 'tenant_in_use': return { type: 'error', text: 'That Xero organisation is already connected to another RELAY company.' };
    case 'forbidden': return { type: 'error', text: 'Only an administrator can connect Xero.' };
    case 'error': return { type: 'error', text: 'Xero connection failed. Please try again.' };
    default: return null;
  }
}

// ── Server calls ─────────────────────────────────────────────────────

/** Begin the Xero consent flow. Redirects the browser to Xero. */
export async function startXeroConnect(returnPath = XERO_RETURN_PATH) {
  if (!isCloudUser()) throw new Error('Create a cloud account first.');
  const data = await invoke('relay-xero-connect', { returnPath });
  if (!data?.url) throw new Error('Could not start the Xero connection.');
  if (typeof location !== 'undefined') location.href = data.url;
  return data;
}

/** { connected, status, tenantName, baseCurrency, lastError, pendingJobs, failedJobs, tenants? } */
export async function getXeroStatus() {
  if (!isCloudUser()) return null;
  return invoke('relay-xero-status', {});
}

export function selectXeroTenant(tenantId) {
  return invoke('relay-xero-status', { selectTenant: tenantId });
}

export function disconnectXero() {
  return invoke('relay-xero-status', { disconnect: true });
}

export function retryXeroSync(jobId = 'all') {
  return invoke('relay-xero-status', { retry: jobId });
}

/**
 * Ask the worker to sync this company now instead of on the next minute tick.
 * Fire-and-forget: the database already queued the work, so a failure here
 * only means it goes out on the schedule instead.
 */
export function nudgeXeroSync() {
  if (!xeroEnabled()) return;
  invoke('relay-xero-sync', {}).catch(() => { /* the scheduled run picks it up */ });
}

// The chart of accounts changes rarely; one fetch per page visit is plenty, and
// every read counts towards the app's Xero data allowance.
let accountsCache = null;

/** { revenueAccounts, paymentAccounts, expenseAccounts, trackingCategories, taxRates } */
export async function listXeroAccounts({ force = false } = {}) {
  if (accountsCache && !force) return accountsCache;
  const data = await invoke('relay-xero-status', { accounts: true });
  accountsCache = data?.settings || null;
  return accountsCache;
}

export function cachedXeroAccounts() {
  return accountsCache;
}

export function clearXeroAccountsCache() {
  accountsCache = null;
}
