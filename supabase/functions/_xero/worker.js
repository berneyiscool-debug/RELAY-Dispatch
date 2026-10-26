// ============================================
// RELAY — XERO SYNC WORKER (job logic)
// ============================================
// Drains claimed xero_sync_jobs: contact and item (stock) upserts, invoice
// upserts and voids, payments recorded in RELAY (pay), and Xero's own state
// pulled back after a webhook (refresh).
//
// The database and Xero are injected: relay-xero-sync passes Supabase- and
// fetch-backed adapters, the tests pass in-memory fakes. Plain ESM.
//
// Error policy:
//   MappingError / Xero validation / not_found → job failed, message shown on the invoice
//   rate_limited  → this company's remaining jobs go back to pending after Retry-After
//   auth_revoked  → connection needs_reauth; its jobs go back to pending, and
//                   the claim RPC holds them until an admin reconnects
//   anything else → retry with backoff; failed after MAX_ATTEMPTS

import { XeroError } from './client.js';
import {
  INVOICE_QUERY,
  ITEM_QUERY,
  MappingError,
  buildContact,
  buildInvoice,
  buildItem,
  buildPayments,
  contactLookups,
  invoiceIdempotencyKey,
  invoiceJobIds,
  invoiceSourceUrl,
  invoiceStockIds,
  isRelayInvoice,
  itemCodeFor,
  itemIdempotencyKey,
  itemLookups,
  parseInvoiceMeta,
  parseXeroDate,
  pickContactMatch,
  pickItemMatch,
  reconcileTotals,
  whereString,
} from './mapping.js';
import { ensureTracking } from './tracking.js';

export const WORKER_ACTIONS = Object.freeze(['upsert', 'void', 'pay', 'refresh']);
export const MAX_ATTEMPTS = 6;
const BACKOFF_SECONDS = [60, 300, 1800, 7200, 43200];

/** Seconds to wait before attempt `attempts + 1`. */
export function backoffSeconds(attempts) {
  return BACKOFF_SECONDS[Math.min(Math.max(attempts, 1), BACKOFF_SECONDS.length) - 1];
}

/** Turn a handler error into what happens to the job. */
export function classifyError(err, attempts) {
  if (err instanceof MappingError) return { outcome: 'failed', message: err.message };
  if (err instanceof XeroError) {
    if (err.kind === 'validation' || err.kind === 'not_found') return { outcome: 'failed', message: err.message };
    if (err.kind === 'rate_limited') return { outcome: 'rate_limited', retryAfterSec: err.retryAfterSec || 60, message: err.message };
    if (err.kind === 'auth_revoked') return { outcome: 'auth_revoked', message: err.message };
  }
  const message = String(err?.message || err).slice(0, 500);
  if (attempts >= MAX_ATTEMPTS) return { outcome: 'failed', message: `Gave up after ${attempts} attempts: ${message}` };
  return { outcome: 'retry', retryAfterSec: backoffSeconds(attempts), message };
}

// ── Handlers ─────────────────────────────────────────────────────────

/** The customer's Xero ContactID, finding or creating the contact if needed. */
export async function ensureContact(customer, { db, xero }) {
  if (customer.xero_contact_id) return customer.xero_contact_id;

  const candidates = [];
  let match = {};
  for (const lookup of contactLookups(customer)) {
    const { data } = await xero.request('GET', '/Contacts', { query: { where: lookup.where } });
    candidates.push(...(data?.Contacts || []));
    match = pickContactMatch(customer, candidates);
    if (match.contact) break;
  }

  let contactId = match.contact?.ContactID;
  if (!contactId) {
    const payload = buildContact(customer, { nameSuffix: match.collision ? ' (RELAY)' : '' });
    const { data } = await xero.request('POST', '/Contacts', {
      body: { Contacts: [payload] },
      // Per version of the customer, so a contact deleted in Xero can be recreated.
      idempotencyKey: `relay-contact-${customer.id}-${Date.parse(customer.updated_at || '') || 0}`,
    });
    contactId = data?.Contacts?.[0]?.ContactID;
    if (!contactId) throw new Error('Xero did not return a ContactID');
  }
  await db.updateCustomer(customer.id, { xero_contact_id: contactId });
  customer.xero_contact_id = contactId;
  return contactId;
}

async function contactUpsert(job, deps) {
  const customer = await deps.db.getCustomer(job.entity_id);
  if (!customer) return { status: 'skipped', note: 'Customer no longer exists.' };
  if (!customer.xero_contact_id) {
    await ensureContact(customer, deps);
    return { status: 'done' };
  }
  await deps.xero.request('POST', '/Contacts', { body: { Contacts: [buildContact(customer)] } });
  return { status: 'done' };
}

/**
 * Create or update the Xero Item for a stock row, matching an existing item by
 * code then name before creating one, and save the link. Returns the Code.
 */
export async function syncItem(stock, { db, xero, now }, settings) {
  let itemId = stock.xero_item_id || null;
  let row = stock;
  if (!itemId) {
    const candidates = [];
    for (const lookup of itemLookups(stock)) {
      const { data } = await xero.request('GET', '/Items', { query: { where: lookup.where } });
      candidates.push(...(data?.Items || []));
      const match = pickItemMatch(stock, candidates);
      if (match) {
        itemId = match.ItemID;
        // Adopted by name with no SKU of our own: keep the code it already has.
        row = { ...stock, xero_item_code: stock.xero_item_code || match.Code || null };
        break;
      }
    }
  }
  const code = itemCodeFor(row);
  const { data } = await xero.request('POST', '/Items', {
    body: { Items: [buildItem(row, { settings, code, itemId })] },
    query: ITEM_QUERY,
    idempotencyKey: itemIdempotencyKey(stock),
  });
  const saved = data?.Items?.[0];
  if (!saved?.ItemID) throw new Error('Xero did not return an ItemID');
  const fields = {
    xero_item_id: saved.ItemID,
    xero_item_code: saved.Code || code,
    xero_synced_at: now().toISOString(),
    xero_sync_error: null,
  };
  await db.updateStock(stock.id, fields);
  Object.assign(stock, fields);
  return fields.xero_item_code;
}

async function itemUpsert(job, deps) {
  const stock = await deps.db.getStock(job.entity_id);
  if (!stock) return { status: 'skipped', note: 'Stock item no longer exists.' };
  try {
    await syncItem(stock, deps, await deps.db.getXeroSettings(stock.company_id));
    return { status: 'done' };
  } catch (err) {
    if (isPermanent(err)) await deps.db.updateStock(stock.id, { xero_sync_error: String(err.message).slice(0, 1000) });
    throw err;
  }
}

/**
 * Item codes for an invoice's material lines, creating any item not in Xero
 * yet. An item Xero refuses doesn't hold the invoice back: its line goes
 * without a code, with a note.
 */
async function resolveItemCodes(invoice, meta, settings, deps) {
  const codes = new Map();
  const warnings = [];
  const ids = invoiceStockIds(invoice, meta);
  if (!ids.length) return { codes, warnings };
  for (const stock of await deps.db.getStockItems(invoice.company_id, ids)) {
    if (stock.xero_item_id && stock.xero_item_code) {
      codes.set(String(stock.id), stock.xero_item_code);
      continue;
    }
    try {
      codes.set(String(stock.id), await syncItem(stock, deps, settings));
    } catch (err) {
      if (!isPermanent(err)) throw err;
      await deps.db.updateStock(stock.id, { xero_sync_error: String(err.message).slice(0, 1000) });
      warnings.push(`Sent "${stock.name}" without its item code: ${err.message}`);
    }
  }
  return { codes, warnings };
}

function xeroHoldsPayment(invoice) {
  return invoice.xero_status === 'PAID'
    || (invoice.xero_payment_ids && Object.keys(invoice.xero_payment_ids).length > 0)
    || (invoice.xero_amount_due != null && Number(invoice.xero_amount_due) < Number(invoice.total));
}

/** Find an invoice RELAY already created (lost response, or a retry after a timeout). */
async function findOwnXeroInvoice(invoice, { xero, appBase }) {
  const { data } = await xero.request('GET', '/Invoices', {
    query: { where: `Type=="ACCREC"&&InvoiceNumber==${whereString(invoice.number)}` },
  });
  return (data?.Invoices || []).find((x) => isRelayInvoice(x, invoice.id, appBase)) || null;
}

async function invoiceUpsert(job, deps) {
  const { db, xero } = deps;
  const invoice = await db.getInvoice(job.entity_id);
  if (!invoice) return { status: 'skipped', note: 'Invoice no longer exists.' };
  if (invoice.status === 'Draft') return { status: 'skipped', note: 'Invoice went back to draft.' };
  if (invoice.status === 'Void') return { status: 'skipped', note: 'Invoice is void.' };
  if (invoice.xero_invoice_id && xeroHoldsPayment(invoice)) {
    return { status: 'skipped', note: 'Xero already holds a payment, so Xero owns this invoice now.' };
  }

  try {
    if (!invoice.customer_id) throw new MappingError('no_customer', 'Link this invoice to a customer before it can go to Xero.');
    const customer = await db.getCustomer(invoice.customer_id);
    if (!customer) throw new MappingError('no_customer', 'The invoice\'s customer no longer exists.');
    const contactId = await ensureContact(customer, deps);

    const meta = parseInvoiceMeta(invoice.line_items);
    const jobs = await db.getJobs(invoice.company_id, invoiceJobIds(invoice, meta));
    const costCenters = await db.getCostCenters(invoice.company_id);
    const settings = await db.getXeroSettings(invoice.company_id);

    if (!invoice.xero_invoice_id) {
      const existing = await findOwnXeroInvoice(invoice, deps);
      if (existing) invoice.xero_invoice_id = existing.InvoiceID;
    }

    const tracked = await resolveTracking(jobs, costCenters, settings, deps);
    const items = await resolveItemCodes(invoice, meta, settings, deps);

    const { payload, warnings } = buildInvoice(invoice, {
      contactId, jobs, costCenters, settings, tracking: tracked.results, itemCodes: items.codes, timeZone: deps.timeZone,
      sourceUrl: invoiceSourceUrl(invoice.id, deps.appBase),
    });
    warnings.push(...tracked.warnings, ...items.warnings);
    const { data } = await xero.request('POST', '/Invoices', {
      body: { Invoices: [payload] },
      query: INVOICE_QUERY,
      idempotencyKey: invoiceIdempotencyKey(invoice),
    });
    const saved = data?.Invoices?.[0];
    if (!saved?.InvoiceID) throw new Error('Xero did not return an InvoiceID');

    const check = reconcileTotals(invoice.total, saved.Total);
    const syncNote = check.status === 'mismatch'
      ? `Xero's total (${Number(saved.Total).toFixed(2)}) differs from RELAY's (${Number(invoice.total).toFixed(2)}). Check the GST and line amounts in Xero.`
      : null;
    await db.updateInvoice(invoice.id, {
      xero_invoice_id: saved.InvoiceID,
      xero_status: saved.Status || 'AUTHORISED',
      xero_amount_due: saved.AmountDue ?? null,
      xero_synced_at: deps.now().toISOString(),
      xero_sync_error: syncNote,
    });
    const notes = [...warnings];
    if (check.status === 'warning') notes.push(`Xero rounded the total by ${check.diff.toFixed(2)}.`);
    return { status: 'done', note: notes.join(' ') || null };
  } catch (err) {
    await recordInvoiceError(invoice, err, deps);
    throw err;
  }
}

async function invoiceVoid(job, deps) {
  const { db, xero } = deps;
  const invoice = await db.getInvoice(job.entity_id);
  if (!invoice) return { status: 'skipped', note: 'Invoice no longer exists.' };
  if (!invoice.xero_invoice_id) return { status: 'skipped', note: 'Never reached Xero.' };
  if (invoice.status !== 'Void') return { status: 'skipped', note: 'Invoice is no longer void in RELAY.' };
  try {
    const { data } = await xero.request('POST', `/Invoices/${encodeURIComponent(invoice.xero_invoice_id)}`, {
      body: { Invoices: [{ InvoiceID: invoice.xero_invoice_id, Status: 'VOIDED' }] },
    });
    await db.updateInvoice(invoice.id, {
      xero_status: data?.Invoices?.[0]?.Status || 'VOIDED',
      xero_amount_due: 0,
      xero_synced_at: deps.now().toISOString(),
      xero_sync_error: null,
    });
    return { status: 'done' };
  } catch (err) {
    if (err instanceof XeroError && err.kind === 'validation') {
      const friendly = new XeroError('validation',
        `Xero wouldn't void this invoice (${err.message}). If it has payments in Xero, remove them there first, or void it in Xero.`,
        { status: err.status, details: err.details });
      await recordInvoiceError(invoice, friendly, deps);
      throw friendly;
    }
    await recordInvoiceError(invoice, err, deps);
    throw err;
  }
}

/**
 * Push RELAY-recorded payments (manual, part-payments, Stripe) to Xero. Each is
 * keyed by a stable ref and saved to xero_payment_ids as soon as Xero accepts
 * it, so a crash mid-way never pushes one twice.
 */
async function invoicePay(job, deps) {
  const { db, xero } = deps;
  const invoice = await db.getInvoice(job.entity_id);
  if (!invoice) return { status: 'skipped', note: 'Invoice no longer exists.' };
  if (invoice.status === 'Void') return { status: 'skipped', note: 'Invoice is void.' };
  if (invoice.xero_status === 'PAID') return { status: 'skipped', note: 'Already paid in Xero.' };
  // The upsert job runs first; if it hasn't succeeded yet, wait for it (backoff).
  if (!invoice.xero_invoice_id) throw new Error('Waiting for the invoice to reach Xero first.');

  try {
    const settings = await db.getXeroSettings(invoice.company_id);
    const payments = buildPayments(invoice, { settings, timeZone: deps.timeZone });
    if (!payments.length) return { status: 'skipped', note: 'No new payments to send.' };

    const pushed = { ...(invoice.xero_payment_ids || {}) };
    let last = null;
    for (const p of payments) {
      const { data } = await xero.request('PUT', '/Payments', {
        body: { Payments: [p.payload] },
        idempotencyKey: p.idempotencyKey,
      });
      const saved = data?.Payments?.[0];
      if (!saved?.PaymentID) throw new Error('Xero did not return a PaymentID');
      pushed[p.ref] = saved.PaymentID;
      last = saved;
      await db.updateInvoice(invoice.id, { xero_payment_ids: { ...pushed } });
    }

    const after = last?.Invoice || {};
    await db.updateInvoice(invoice.id, {
      xero_status: after.Status || (Number(after.AmountDue) === 0 ? 'PAID' : invoice.xero_status),
      xero_amount_due: after.AmountDue ?? invoice.xero_amount_due,
      xero_synced_at: deps.now().toISOString(),
      xero_sync_error: null,
    });
    return { status: 'done' };
  } catch (err) {
    await recordInvoiceError(invoice, err, deps);
    throw err;
  }
}

/**
 * A webhook said a Xero invoice changed: read it and apply what Xero now says
 * (paid there → Paid in RELAY; voided there → flagged). entity_id is the Xero
 * InvoiceID; the RPC matches it to the RELAY invoice and keeps the enqueue
 * trigger quiet so the pull doesn't echo back as a push.
 */
async function xeroInvoiceRefresh(job, { db, xero }) {
  let found;
  try {
    const { data } = await xero.request('GET', `/Invoices/${encodeURIComponent(job.entity_id)}`);
    found = data?.Invoices?.[0];
  } catch (err) {
    if (err instanceof XeroError && err.kind === 'not_found') return { status: 'skipped', note: 'No longer in Xero.' };
    throw err;
  }
  if (!found) return { status: 'skipped', note: 'No longer in Xero.' };
  const relayId = await db.applyInvoicePull(job.company_id, job.entity_id, {
    status: found.Status || null,
    amountDue: found.AmountDue ?? null,
    paidDate: parseXeroDate(found.FullyPaidOnDate),
  });
  return relayId ? { status: 'done' } : { status: 'skipped', note: 'Not a RELAY invoice.' };
}

/**
 * The Xero tracking for the cost centers on an invoice's jobs, creating what's
 * missing (tracking.js). A cost center Xero can't take tracking for is sent
 * without it and noted on the job rather than holding the invoice back; the
 * Accounting page lists those problems.
 */
export async function resolveTracking(jobs, costCenters, settings, deps) {
  const ids = new Set(jobs.map((j) => j.cost_center_id).filter(Boolean).map(String));
  const needed = costCenters.filter((cc) => ids.has(String(cc.id)));
  if (!needed.length) return { results: new Map(), warnings: [] };
  deps.trackingCache ||= {};
  let results;
  try {
    results = await ensureTracking({
      xero: deps.xero, costCenters: needed, settings, canEdit: deps.xero.canEditTracking === true, cache: deps.trackingCache,
    });
  } catch (err) {
    if (!(err instanceof XeroError && err.kind === 'validation')) throw err;
    return { results: new Map(), warnings: [`Sent without tracking: ${err.message}`] };
  }
  await saveTrackingLinks(needed, results, deps.db);
  const warnings = [...results.values()].filter((r) => r.action === 'problem').map((r) => `Sent without tracking: ${r.message}`);
  return { results, warnings };
}

/** Remember which Xero option each cost center is, so a rename follows it. */
export async function saveTrackingLinks(costCenters, results, db) {
  for (const cc of costCenters) {
    const optionId = results.get(String(cc.id))?.optionId;
    if (optionId && optionId !== cc.xero_tracking_option_id) {
      await db.updateCostCenter(cc.id, { xero_tracking_option_id: optionId });
      cc.xero_tracking_option_id = optionId;
    }
  }
}

// Only permanent problems are shown on the invoice; a transient blip that the
// next retry fixes shouldn't flash an error badge.
function isPermanent(err) {
  return err instanceof MappingError || (err instanceof XeroError && (err.kind === 'validation' || err.kind === 'not_found'));
}

async function recordInvoiceError(invoice, err, { db }) {
  if (!isPermanent(err)) return;
  await db.updateInvoice(invoice.id, { xero_sync_error: String(err.message).slice(0, 1000) });
}

const HANDLERS = {
  'contact:upsert': contactUpsert,
  'item:upsert': itemUpsert,
  'invoice:upsert': invoiceUpsert,
  'invoice:void': invoiceVoid,
  'invoice:pay': invoicePay,
  'xero_invoice:refresh': xeroInvoiceRefresh,
};

// ── Runner ───────────────────────────────────────────────────────────

// Pacing: stop a company's run while Xero still has a little headroom, rather
// than spending calls into a 429. Remaining counts come from the response
// headers of the company's last call (client.limits).
export const DEFAULT_CONCURRENCY = 8;
export const MINUTE_FLOOR = 3;
export const DAY_FLOOR = 25;
const PACE_MINUTE_SEC = 60;
const PACE_DAY_SEC = 3600;

/**
 * Should this company pause before its next call? Returns the wait in seconds
 * and why, or null to carry on.
 */
export function paceFor(limits, { minuteFloor = MINUTE_FLOOR, dayFloor = DAY_FLOOR } = {}) {
  if (!limits) return null;
  if (limits.dayRemaining != null && limits.dayRemaining <= dayFloor) {
    return { waitSec: PACE_DAY_SEC, message: `Paused: ${limits.dayRemaining} Xero calls left today for this organisation.` };
  }
  if (limits.minuteRemaining != null && limits.minuteRemaining <= minuteFloor) {
    return { waitSec: PACE_MINUTE_SEC, message: 'Paused for a minute: Xero\'s per-minute limit for this organisation is nearly used.' };
  }
  if (limits.appMinuteRemaining != null && limits.appMinuteRemaining <= minuteFloor) {
    return { waitSec: PACE_MINUTE_SEC, message: 'Paused for a minute: RELAY\'s Xero app limit is nearly used.' };
  }
  return null;
}

/**
 * Process claimed jobs. Up to `concurrency` companies run at once; within a
 * company jobs run one at a time in id order, so an invoice's upsert always
 * lands before its later jobs and no organisation sees more than one call in
 * flight from a run (Xero allows 5).
 *
 * @param {object} deps
 * @param {Array}  deps.jobs      claimed rows (status 'running')
 * @param {object} deps.db        adapter (see worker tests for the shape)
 * @param {(companyId: string) => Promise<object|null>} deps.xeroFor  API client for an active connection
 * @param {() => Date} [deps.now]
 * @param {() => boolean} [deps.outOfTime]  stop early and release the rest
 * @param {number} [deps.concurrency]  companies processed at the same time
 * @returns {Promise<{done:number, skipped:number, failed:number, retried:number, released:number, paced:number}>}
 */
export async function runJobs({
  jobs, db, xeroFor, now = () => new Date(), outOfTime = () => false, timeZone, appBase,
  concurrency = DEFAULT_CONCURRENCY, pacing = {},
}) {
  const summary = { done: 0, skipped: 0, failed: 0, retried: 0, released: 0, paced: 0 };
  const byCompany = new Map();
  for (const job of [...jobs].sort((a, b) => Number(a.id) - Number(b.id))) {
    if (!byCompany.has(job.company_id)) byCompany.set(job.company_id, []);
    byCompany.get(job.company_id).push(job);
  }

  const release = async (rest, runAfterSec, message) => {
    for (const job of rest) {
      await db.finishJob(job.id, {
        status: 'pending',
        attempts: Math.max(0, job.attempts - 1), // not the job's fault
        run_after: new Date(now().getTime() + runAfterSec * 1000).toISOString(),
        last_error: message,
      });
      summary.released++;
    }
  };

  async function runCompany(companyId, companyJobs) {
    let xero;
    try {
      xero = await xeroFor(companyId);
    } catch (err) {
      const verdict = classifyError(err, 1);
      if (verdict.outcome === 'auth_revoked') await db.markConnection(companyId, { status: 'needs_reauth', last_error: verdict.message });
      await release(companyJobs, verdict.outcome === 'auth_revoked' ? 0 : 300, verdict.message);
      return;
    }
    if (!xero) {
      await release(companyJobs, 600, 'Xero is not connected.');
      return;
    }
    // trackingCache: one tracking-category read per company per run.
    const deps = { db, xero, now, timeZone, appBase, trackingCache: {} };

    for (let i = 0; i < companyJobs.length; i++) {
      const job = companyJobs[i];
      if (outOfTime()) {
        await release(companyJobs.slice(i), 0, null);
        return;
      }
      const pause = paceFor(xero.limits, pacing);
      if (pause) {
        await release(companyJobs.slice(i), pause.waitSec, pause.message);
        summary.paced++;
        return;
      }
      const handler = HANDLERS[`${job.entity}:${job.action}`];
      if (!handler) {
        // Claimed by an RPC call without the action filter: put it back untouched.
        await release([job], 0, null);
        continue;
      }
      try {
        const result = await handler(job, deps);
        await db.finishJob(job.id, { status: result.status, last_error: result.note || null });
        summary[result.status === 'skipped' ? 'skipped' : 'done']++;
      } catch (err) {
        const verdict = classifyError(err, job.attempts);
        if (verdict.outcome === 'failed') {
          await db.finishJob(job.id, { status: 'failed', last_error: verdict.message });
          summary.failed++;
        } else if (verdict.outcome === 'retry') {
          await db.finishJob(job.id, {
            status: 'pending',
            run_after: new Date(now().getTime() + verdict.retryAfterSec * 1000).toISOString(),
            last_error: verdict.message,
          });
          summary.retried++;
        } else if (verdict.outcome === 'rate_limited') {
          await release(companyJobs.slice(i), verdict.retryAfterSec, verdict.message);
          return;
        } else if (verdict.outcome === 'auth_revoked') {
          await db.markConnection(companyId, { status: 'needs_reauth', last_error: verdict.message });
          await release(companyJobs.slice(i), 0, verdict.message);
          return;
        }
      }
    }
  }

  // A fixed pool of lanes pulling the next company off a shared list.
  const companies = [...byCompany.entries()];
  let next = 0;
  const lane = async () => {
    while (next < companies.length) {
      const [companyId, companyJobs] = companies[next++];
      await runCompany(companyId, companyJobs);
    }
  };
  const lanes = Math.max(1, Math.min(Number(concurrency) || 1, companies.length));
  await Promise.all(Array.from({ length: lanes }, lane));
  return summary;
}

/** Connections due a keep-alive refresh: refresh tokens die after 60 days unused. */
export const IDLE_REFRESH_DAYS = 30;
