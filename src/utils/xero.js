// ============================================
// RELAY — XERO CLIENT (Settings → Accounting & Xero)
// ============================================
// Connects a cloud company to one Xero organisation, reads what the Settings
// card shows, and works out each invoice's sync state for the invoice pages.
// Everything that touches Xero runs server-side (relay-xero-*); tokens never
// reach the browser. Cloud-only and flag-gated (FLAGS.xero).

import { store } from '../data/store.js';
import { FLAGS } from './flags.js';
import { invoke } from './payments.js';
import { supabase } from './supabase.js';
import { isCloudUser } from './subscription.js';
import { desiredTracking, trackingCollisions, trackingName } from '../../supabase/functions/_xero/tracking.js';

export const XERO_RETURN_PATH = '/settings?tab=accounting';

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
  'purchasesAccountCode',
  'paymentAccountCode',
  'stripeAccountCode',
  'taxTypeTaxed',
  'defaultDueDays',
  'trackingCategoryName',
  'trackCostCenters',
];

/**
 * Normalise the defaults form into what relay-xero-sync reads. Blank values are
 * dropped so the worker's fallbacks apply; due days must be a whole 0–365.
 * Cost center tracking is on unless turned off, so only `false` is stored.
 */
export function normaliseXeroDefaults(input = {}) {
  const out = {};
  for (const key of DEFAULT_KEYS) {
    const raw = input[key];
    if (key === 'trackCostCenters') {
      if (raw === false || raw === 'false') out[key] = false;
      continue;
    }
    if (raw === undefined || raw === null || String(raw).trim() === '') continue;
    if (key === 'trackingCategoryName') {
      out[key] = trackingName(raw);
    } else if (key === 'defaultDueDays') {
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

/** Save some of the Xero settings; keys left out keep their saved value, blanks clear. */
export async function saveXeroDefaults(input) {
  const s = store.getSettings() || {};
  s.xero = { ...normaliseXeroDefaults({ ...xeroSettings(), ...input }) };
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
  // The demo's simulated cloud company has no Xero organisation behind it.
  if (store.demoMode) return remember({ connected: false, status: 'disconnected' });
  return remember(await invoke('relay-xero-status', {}));
}

// The last status seen, so the invoice pages and the sync nudge don't each ask
// the server. Settings always fetches fresh.
let lastStatus = null;
let lastStatusAt = 0;
function remember(status) {
  lastStatus = status || null;
  lastStatusAt = Date.now();
  return status;
}

export async function getXeroStatusCached({ maxAgeMs = 60_000 } = {}) {
  if (!xeroEnabled()) return null;
  if (lastStatusAt && Date.now() - lastStatusAt < maxAgeMs) return lastStatus;
  return getXeroStatus();
}

export async function selectXeroTenant(tenantId) {
  return remember(await invoke('relay-xero-status', { selectTenant: tenantId }));
}

export async function disconnectXero() {
  return remember(await invoke('relay-xero-status', { disconnect: true }));
}

export async function retryXeroSync(jobId = 'all') {
  invoiceJobsAt = 0;
  return remember(await invoke('relay-xero-status', { retry: jobId }));
}

/**
 * Ask the worker to sync this company now instead of on the next minute tick.
 * Fire-and-forget: the database already queued the work, so a failure here
 * only means it goes out on the schedule instead.
 */
let nudgeTimer = null;
export function nudgeXeroSync() {
  // Only for a company known to be connected: an unconnected company has no
  // queued work, and this runs after every invoice and customer save.
  if (!xeroEnabled() || !lastStatus?.connected) return;
  // Bulk actions save many rows at once; one worker run covers them all.
  clearTimeout(nudgeTimer);
  nudgeTimer = setTimeout(() => {
    invoiceJobsAt = 0;
    invoke('relay-xero-sync', {}).catch(() => { /* the scheduled run picks it up */ });
  }, 1500);
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

/**
 * Match every active cost center to its Xero tracking option now, creating
 * what's missing. Returns the status plus `tracking`: per cost center
 * { costCenterId, action, message, tracking }.
 */
export async function syncXeroTracking() {
  const data = await invoke('relay-xero-status', { syncTracking: true });
  accountsCache = null; // new categories and options show in the pickers
  remember(data);
  return data;
}

/** A store cost center in the row shape tracking.js reads. */
export const trackingRow = (cc) => ({
  id: cc.id,
  name: cc.name,
  xero_tracking_category_name: cc.xeroTrackingCategoryName || null,
  xero_tracking_option_name: cc.xeroTrackingOptionName || null,
});

/**
 * What each cost center's lines are tagged with in Xero, for the Accounting
 * page, given the tracking categories Xero has now (listXeroAccounts).
 * state: in_xero (exists, active) | will_create (RELAY adds it on the next
 * sync, or needs a reconnect first when `writable` is false) | off
 */
export function costCenterTrackingPlan(costCenters, settings, xeroCategories = [], { writable = true } = {}) {
  const lower = (s) => trackingName(s).toLowerCase();
  const collided = new Set(trackingCollisions(costCenters.map(trackingRow), settings).flat());
  return costCenters.map((cc) => {
    const want = desiredTracking(trackingRow(cc), settings);
    if (!want) return { id: cc.id, state: 'off' };
    const category = xeroCategories.find((c) => lower(c.name) === lower(want.category));
    const option = category?.options.find((o) => lower(o) === lower(want.option));
    return {
      id: cc.id,
      source: want.source,
      category: category?.name || want.category,
      option: option || want.option,
      state: option ? 'in_xero' : 'will_create',
      needsReconnect: !option && !writable,
      collision: collided.has(String(cc.id)),
    };
  });
}

export function clearXeroAccountsCache() {
  accountsCache = null;
}

// ── Invoice sync state (invoice list + detail) ───────────────────────

/** Does Xero hold a payment on this invoice? Then Xero owns it and RELAY edits stay local. */
export function xeroHoldsPayment(invoice) {
  if (!invoice || !invoice.xeroInvoiceId) return false;
  if (invoice.xeroStatus === 'PAID') return true;
  if (invoice.xeroPaymentIds && Object.keys(invoice.xeroPaymentIds).length) return true;
  return invoice.xeroAmountDue != null && Number(invoice.xeroAmountDue) < Number(invoice.total || 0);
}

export function xeroInvoiceUrl(xeroInvoiceId) {
  return `https://go.xero.com/AccountsReceivable/View.aspx?InvoiceID=${encodeURIComponent(xeroInvoiceId)}`;
}

/**
 * Where an invoice stands with Xero, for a badge. `jobs` is this invoice's
 * entry from fetchInvoiceSyncJobs(): { pending, failed: [{ id, lastError }] }.
 * Every state carries an icon and words, never colour alone.
 * @returns {{ state: string, label: string, tone: string, icon: string, detail: string }}
 */
export function xeroInvoiceSyncState(invoice, jobs = { pending: false, failed: [] }) {
  const failed = jobs.failed || [];
  const error = failed[0]?.lastError || invoice?.xeroSyncError || '';
  if (!invoice || invoice.status === 'Draft') {
    return { state: 'draft', label: 'Not sent', tone: 'neutral', icon: 'edit_note', detail: 'Goes to Xero when it\'s sent.' };
  }
  if (jobs.pending) {
    return { state: 'pending', label: 'Syncing', tone: 'info', icon: 'sync', detail: 'Waiting to sync to Xero.' };
  }
  if (failed.length || (invoice.xeroSyncError && !invoice.xeroInvoiceId)) {
    return { state: 'error', label: 'Sync failed', tone: 'danger', icon: 'sync_problem', detail: error };
  }
  if (invoice.xeroInvoiceId) {
    const label = invoice.xeroStatus === 'PAID' ? 'Paid in Xero'
      : invoice.xeroStatus === 'VOIDED' ? 'Voided in Xero' : 'In Xero';
    if (invoice.xeroSyncError) return { state: 'warning', label, tone: 'warning', icon: 'warning_amber', detail: invoice.xeroSyncError };
    return { state: 'synced', label, tone: 'success', icon: 'cloud_done', detail: '' };
  }
  if (invoice.status === 'Void') return { state: 'none', label: '—', tone: 'neutral', icon: 'remove', detail: '' };
  return { state: 'missing', label: 'Not in Xero', tone: 'neutral', icon: 'cloud_off', detail: 'Sent before Xero was connected.' };
}

// Unfinished invoice jobs, keyed by invoice id. One small query serves the
// whole list; it is the only reliable way to know something is still queued.
let invoiceJobs = new Map();
let invoiceJobsAt = 0;

/** @returns {Promise<Map<string, { pending: boolean, failed: Array<{ id: number, lastError: string }> }>>} */
export async function fetchInvoiceSyncJobs({ force = false, maxAgeMs = 20_000 } = {}) {
  if (!xeroEnabled() || store.demoMode) return new Map();
  if (!force && invoiceJobsAt && Date.now() - invoiceJobsAt < maxAgeMs) return invoiceJobs;
  const { data, error } = await supabase
    .from('xero_sync_jobs')
    .select('id, entity_id, status, last_error')
    .eq('entity', 'invoice')
    .in('status', ['pending', 'running', 'failed'])
    .order('id', { ascending: false })
    .limit(1000);
  if (error) throw new Error(error.message);
  invoiceJobs = groupInvoiceJobs(data || []);
  invoiceJobsAt = Date.now();
  return invoiceJobs;
}

export function groupInvoiceJobs(rows) {
  const out = new Map();
  for (const row of rows) {
    const key = String(row.entity_id);
    if (!out.has(key)) out.set(key, { pending: false, failed: [] });
    const entry = out.get(key);
    if (row.status === 'failed') entry.failed.push({ id: row.id, lastError: row.last_error || '' });
    else entry.pending = true;
  }
  return out;
}

/**
 * "Send to Xero": 'missing' queues every sent invoice not yet in Xero (the
 * backfill for invoices sent before connecting); an id list resends those.
 * Drafts and voids are skipped server-side. Returns how many were queued.
 */
export async function pushToXero(target = 'missing') {
  const data = await invoke('relay-xero-status', { push: target });
  remember(data);
  invoiceJobsAt = 0;
  nudgeXeroSync();
  return data?.queued || 0;
}

/**
 * Everything the Accounting page lists under "Needs attention", from the
 * invoices in the store and the queue: failed syncs (with the reason, and
 * whether the fix is a setting rather than a retry) and how many sent invoices
 * never reached Xero.
 */
export function xeroAttention(invoices, jobs = new Map()) {
  const failed = [];
  let missing = 0;
  let inXero = 0;
  let lastSyncedAt = '';
  for (const inv of invoices || []) {
    const s = xeroInvoiceSyncState(inv, jobs.get(String(inv.id)));
    if (inv.xeroInvoiceId) inXero++;
    if (inv.xeroSyncedAt && inv.xeroSyncedAt > lastSyncedAt) lastSyncedAt = inv.xeroSyncedAt;
    if (s.state === 'error') {
      failed.push({
        id: inv.id,
        number: inv.number || '',
        reason: s.detail || 'Xero rejected this invoice.',
        // These are fixed in the settings below, not by retrying as-is.
        needsSetting: /sales account|payments are received into|payment account/i.test(s.detail || ''),
      });
    } else if (s.state === 'missing') {
      missing++;
    }
  }
  return { failed, missing, inXero, lastSyncedAt: lastSyncedAt || null };
}

/** Requeue this invoice's failed jobs. Returns how many were requeued. */
export async function retryInvoiceSync(invoiceId) {
  const jobs = (await fetchInvoiceSyncJobs({ force: true })).get(String(invoiceId));
  let requeued = 0;
  for (const job of jobs?.failed || []) requeued += (await retryXeroSync(job.id))?.requeued || 0;
  nudgeXeroSync();
  return requeued;
}

// ── Stock ↔ Xero Items ───────────────────────────────────────────────

/**
 * Where a stock item stands with Xero, for a badge. `jobs` is this item's
 * entry from fetchStockSyncJobs(). Icon and words, never colour alone.
 */
export function xeroStockSyncState(stock, jobs = { pending: false, failed: [] }) {
  const failed = jobs.failed || [];
  if (!stock) return { state: 'none', label: '—', tone: 'neutral', icon: 'remove', detail: '' };
  if (jobs.pending) return { state: 'pending', label: 'Syncing', tone: 'info', icon: 'sync', detail: 'Waiting to sync to Xero.' };
  if (failed.length || (stock.xeroSyncError && !stock.xeroItemId)) {
    return { state: 'error', label: 'Sync failed', tone: 'danger', icon: 'sync_problem', detail: failed[0]?.lastError || stock.xeroSyncError || '' };
  }
  if (stock.xeroItemId) {
    const detail = stock.xeroItemCode ? `Xero item code ${stock.xeroItemCode}` : '';
    if (stock.xeroSyncError) return { state: 'warning', label: 'In Xero', tone: 'warning', icon: 'warning_amber', detail: stock.xeroSyncError };
    return { state: 'synced', label: 'In Xero', tone: 'success', icon: 'cloud_done', detail };
  }
  return { state: 'missing', label: 'Not in Xero', tone: 'neutral', icon: 'cloud_off', detail: 'Added before Xero was connected. Use Send stock to Xero.' };
}

let stockJobs = new Map();
let stockJobsAt = 0;

/** Unfinished item jobs, keyed by stock id (same shape as fetchInvoiceSyncJobs). */
export async function fetchStockSyncJobs({ force = false, maxAgeMs = 20_000 } = {}) {
  if (!xeroEnabled() || store.demoMode) return new Map();
  if (!force && stockJobsAt && Date.now() - stockJobsAt < maxAgeMs) return stockJobs;
  const { data, error } = await supabase
    .from('xero_sync_jobs')
    .select('id, entity_id, status, last_error')
    .eq('entity', 'item')
    .in('status', ['pending', 'running', 'failed'])
    .order('id', { ascending: false })
    .limit(1000);
  if (error) throw new Error(error.message);
  stockJobs = groupInvoiceJobs(data || []);
  stockJobsAt = Date.now();
  return stockJobs;
}

/** "Send stock to Xero": 'missing' or a list of stock ids. Returns how many were queued. */
export async function pushStockToXero(target = 'missing') {
  const data = await invoke('relay-xero-status', { pushItems: target });
  remember(data);
  stockJobsAt = 0;
  nudgeXeroSync();
  return data?.queued || 0;
}

/**
 * Import items from Xero. 'preview' only counts; 'confirm' links matching
 * stock (SKU, then name) and adds the rest with quantity 0.
 * @returns {Promise<{ linked: number, created: number, already_linked: number, applied: boolean }>}
 */
export async function importXeroItems(mode = 'preview') {
  const data = await invoke('relay-xero-status', { importItems: mode });
  remember(data);
  // The import wrote stock server-side; reload it rather than rely on realtime.
  if (data?.import?.applied) await reloadStock().catch(() => {});
  return data?.import || { linked: 0, created: 0, already_linked: 0, applied: false };
}

async function reloadStock() {
  const { data, error } = await supabase.from('stock').select('*').eq('company_id', store.companyId);
  if (error) throw new Error(error.message);
  store.cache.stock = store.normalizeData(data || [], 'stock');
  store.emit('stock', store.cache.stock);
}

/** Requeue this stock item's failed jobs. Returns how many were requeued. */
export async function retryStockSync(stockId) {
  const jobs = (await fetchStockSyncJobs({ force: true })).get(String(stockId));
  let requeued = 0;
  for (const job of jobs?.failed || []) requeued += (await retryXeroSync(job.id))?.requeued || 0;
  stockJobsAt = 0;
  nudgeXeroSync();
  return requeued;
}

/** How much stock is in Xero, waiting, or failed, for the Accounting page. */
export function xeroStockAttention(stock, jobs = new Map()) {
  let inXero = 0;
  let missing = 0;
  const failed = [];
  for (const s of stock || []) {
    const state = xeroStockSyncState(s, jobs.get(String(s.id)));
    if (s.xeroItemId) inXero++;
    if (state.state === 'error') failed.push({ id: s.id, name: s.name || '', reason: state.detail || 'Xero rejected this item.' });
    else if (state.state === 'missing') missing++;
  }
  return { inXero, missing, failed };
}

/** What the last fetches saw, for synchronous renders. */
export const cachedXeroStatus = () => lastStatus;
export const cachedInvoiceSyncJobs = () => invoiceJobs;
export const cachedStockSyncJobs = () => stockJobs;

/** Small inline badge for an invoice's sync state (icon + words, tooltip for detail). */
export function xeroSyncBadgeHtml(invoice, jobs, escape) {
  return badgeHtml(xeroInvoiceSyncState(invoice, jobs), escape);
}

/** The same badge for a stock item. */
export function xeroStockBadgeHtml(stock, jobs, escape) {
  return badgeHtml(xeroStockSyncState(stock, jobs), escape);
}

function badgeHtml(s, escape) {
  if (s.state === 'none' || s.state === 'draft') return '<span class="text-tertiary">—</span>';
  const tip = s.detail ? ` data-tooltip="${escape(s.detail)}" data-tooltip-pos="left"` : '';
  return `<span class="badge badge-${s.tone}" style="display:inline-flex;align-items:center;gap:3px;"${tip}><span class="material-icons-outlined" style="font-size:12px;" aria-hidden="true">${s.icon}</span>${escape(s.label)}</span>`;
}
