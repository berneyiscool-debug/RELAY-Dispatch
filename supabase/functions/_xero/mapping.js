// ============================================
// RELAY — RELAY → XERO MAPPING
// ============================================
// Pure functions that turn RELAY rows (as the service-role worker reads them:
// snake_case columns, invoice details packed into the line_items jsonb) into
// Xero Accounting API payloads. No I/O, so every rule is unit-tested in
// supabase/tests/xero-mapping.test.js. Plain ESM.
//
// Rules (docs/XERO_PHASE1_PLAN.md §3):
//   * Drafts are never pushed. Invoices go to Xero as AUTHORISED ACCREC, tax-exclusive.
//   * Line account: the line's job's cost center sales account, else the
//     labour/materials default for the line type, else the default sales account.
//     A line with no resolvable account is an error. Never guess.
//   * Tracking: the cost center's Xero tracking category + option, when both set.
//   * GST: OUTPUT when the invoice carries tax, EXEMPTOUTPUT when it doesn't.
//   * Negative (deposit credit) lines are fine; a negative invoice total isn't.
//   * Each RELAY payment is pushed once, keyed by a stable ref.

export const DEFAULT_TIME_ZONE = 'Australia/Sydney';

// Ask Xero to keep 4 decimals on unit prices, so marked-up material rates
// aren't rounded to cents before the line total is worked out.
export const INVOICE_QUERY = Object.freeze({ unitdp: 4 });

export class MappingError extends Error {
  constructor(code, message, details = {}) {
    super(message);
    this.name = 'MappingError';
    this.code = code;
    this.details = details;
  }
}

const round = (value, dp) => {
  const f = 10 ** dp;
  return Math.round((Number(value) + Number.EPSILON) * f) / f;
};
const round2 = (v) => round(v, 2);
const clip = (value, max) => String(value ?? '').trim().slice(0, max);

// ── Invoice details packed into line_items ───────────────────────────

/**
 * line_items is either a legacy plain array of lines or the object the store
 * writes ({ sections, jobIds, payments, issueDate, ... }). Normalise both.
 */
export function parseInvoiceMeta(lineItems) {
  let meta = lineItems;
  if (typeof meta === 'string') {
    try { meta = JSON.parse(meta); } catch { meta = []; }
  }
  if (Array.isArray(meta)) {
    return { sections: [{ name: 'Items', lineItems: meta }], jobIds: [], jobNumbers: [], payments: [], issueDate: '', invoiceType: 'Standard' };
  }
  meta = meta && typeof meta === 'object' ? meta : {};
  return {
    sections: Array.isArray(meta.sections) ? meta.sections : [],
    jobIds: Array.isArray(meta.jobIds) ? meta.jobIds.filter(Boolean).map(String) : [],
    jobNumbers: Array.isArray(meta.jobNumbers) ? meta.jobNumbers.filter(Boolean).map(String) : [],
    payments: Array.isArray(meta.payments) ? meta.payments : [],
    issueDate: meta.issueDate || '',
    invoiceType: meta.invoiceType || 'Standard',
  };
}

export function flattenLines(meta) {
  return meta.sections.flatMap((section) => (Array.isArray(section?.lineItems) ? section.lineItems : section?.items || []));
}

/** Every job an invoice bills: its own job_id first, then consolidated jobIds. */
export function invoiceJobIds(invoice, meta = parseInvoiceMeta(invoice.line_items)) {
  return [...new Set([invoice.job_id, ...meta.jobIds].filter(Boolean).map(String))];
}

// ── Dates ────────────────────────────────────────────────────────────

/**
 * A RELAY date (YYYY-MM-DD, or a full ISO timestamp from toISOString()) as the
 * calendar date in the company's time zone. An invoice issued at 9am Sydney on
 * the 20th is still the 19th in UTC.
 */
export function toXeroDate(value, timeZone = DEFAULT_TIME_ZONE) {
  if (!value) return null;
  const s = String(value).trim();
  if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return s;
  const d = new Date(s);
  if (Number.isNaN(d.getTime())) return null;
  return new Intl.DateTimeFormat('en-CA', { timeZone, year: 'numeric', month: '2-digit', day: '2-digit' }).format(d);
}

/** Xero's "/Date(1573755038314+0000)/" (or an ISO string) → YYYY-MM-DD. */
export function parseXeroDate(value) {
  if (!value) return null;
  const s = String(value);
  // Xero's ISO dates ("2026-10-19T00:00:00") carry no zone: they are calendar
  // dates, and parsing them as local time would shift them a day in Australia.
  if (/^\d{4}-\d{2}-\d{2}/.test(s)) return s.slice(0, 10);
  const m = /\/Date\((-?\d+)([+-]\d{4})?\)\//.exec(s);
  const d = m ? new Date(Number(m[1])) : new Date(s);
  return Number.isNaN(d.getTime()) ? null : d.toISOString().slice(0, 10);
}

function addDays(isoDate, days) {
  const d = new Date(`${isoDate}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

// ── Contacts ─────────────────────────────────────────────────────────

/** Stable external id we stamp on the Xero contact, so re-links survive renames. */
export const contactNumberFor = (customer) => `RELAY-${customer.id}`.slice(0, 50);

export function contactName(customer) {
  const company = clip(customer?.company, 255);
  if (company) return company;
  const person = clip(`${customer?.first_name || ''} ${customer?.last_name || ''}`, 255);
  return person || clip(customer?.customer_name, 255);
}

/** POST /Contacts payload. `nameSuffix` disambiguates a Name already taken in Xero. */
export function buildContact(customer, { nameSuffix = '' } = {}) {
  const name = contactName(customer);
  if (!name) throw new MappingError('no_contact_name', 'The customer has no company or person name to use in Xero.');
  const contact = {
    Name: clip(`${name}${nameSuffix}`, 255),
    ContactNumber: contactNumberFor(customer),
  };
  if (customer.xero_contact_id) contact.ContactID = customer.xero_contact_id;
  if (customer.first_name) contact.FirstName = clip(customer.first_name, 255);
  if (customer.last_name) contact.LastName = clip(customer.last_name, 255);
  if (customer.email) contact.EmailAddress = clip(customer.email, 255);
  if (customer.phone) contact.Phones = [{ PhoneType: 'DEFAULT', PhoneNumber: clip(customer.phone, 50) }];
  if (customer.address) contact.Addresses = [{ AddressType: 'STREET', AddressLine1: clip(customer.address, 500) }];
  return contact;
}

/** Quote a value for a Xero `where` filter. */
export function whereString(value) {
  return `"${String(value).replace(/\\/g, '\\\\').replace(/"/g, '\\"')}"`;
}

/** Lookups to try, most specific first, before creating a new contact. */
export function contactLookups(customer) {
  const lookups = [{ by: 'contactNumber', where: `ContactNumber==${whereString(contactNumberFor(customer))}` }];
  if (customer.email) lookups.push({ by: 'email', where: `EmailAddress==${whereString(String(customer.email).trim())}` });
  const name = contactName(customer);
  if (name) lookups.push({ by: 'name', where: `Name==${whereString(name)}` });
  return lookups;
}

/**
 * Choose which existing Xero contact (if any) is this customer.
 * Returns { contact } on a match, { collision: true } when a different contact
 * already holds the name (create with a suffix), or {} to create normally.
 */
export function pickContactMatch(customer, candidates) {
  const list = (Array.isArray(candidates) ? candidates : []).filter((c) => c && c.ContactStatus !== 'ARCHIVED');
  const lower = (v) => String(v || '').trim().toLowerCase();
  const number = contactNumberFor(customer);
  const byNumber = list.find((c) => c.ContactNumber === number);
  if (byNumber) return { contact: byNumber };
  const email = lower(customer.email);
  if (email) {
    const byEmail = list.find((c) => lower(c.EmailAddress) === email);
    if (byEmail) return { contact: byEmail };
  }
  const name = lower(contactName(customer));
  const byName = list.find((c) => lower(c.Name) === name);
  if (!byName) return {};
  // Same name, and nothing says it's someone else: treat it as theirs.
  if (!email || !lower(byName.EmailAddress)) return { contact: byName };
  return { collision: true };
}

// ── Invoices ─────────────────────────────────────────────────────────

/** Changes whenever the invoice changes, so Xero de-dupes retries of one version only. */
export function invoiceIdempotencyKey(invoice) {
  const stamp = Date.parse(invoice.updated_at || '') || 0;
  return `relay-inv-${invoice.id}-${stamp}`.slice(0, 128);
}

function accountForLine(line, costCenter, settings) {
  if (costCenter?.xero_sales_account_code) return costCenter.xero_sales_account_code;
  if (line?.type === 'labor' && settings.labourAccountCode) return settings.labourAccountCode;
  if (line?.type === 'material' && settings.materialsAccountCode) return settings.materialsAccountCode;
  return settings.defaultSalesAccountCode || null;
}

function trackingFor(costCenter) {
  const name = clip(costCenter?.xero_tracking_category_name, 100);
  const option = clip(costCenter?.xero_tracking_option_name, 100);
  return name && option ? [{ Name: name, Option: option }] : undefined;
}

/**
 * Build the POST /Invoices payload for one RELAY invoice.
 *
 * @param {object} invoice  invoices row (service-role read)
 * @param {object} ctx
 * @param {string} ctx.contactId             Xero ContactID for the customer
 * @param {Array}  [ctx.jobs]                [{ id, number, cost_center_id }] for the invoice's jobs
 * @param {Array}  [ctx.costCenters]         cost_centers rows
 * @param {object} [ctx.settings]            companies.settings.xero
 * @param {string} [ctx.timeZone]
 * @returns {{ payload: object, warnings: string[], expectedSubtotal: number }}
 */
export function buildInvoice(invoice, ctx = {}) {
  const settings = ctx.settings || {};
  const timeZone = ctx.timeZone || DEFAULT_TIME_ZONE;
  const warnings = [];

  if (!invoice || !invoice.id) throw new MappingError('no_invoice', 'Invoice not found.');
  if (invoice.status === 'Draft') throw new MappingError('draft', 'Draft invoices are not sent to Xero.');
  if (invoice.status === 'Void') throw new MappingError('void', 'Void invoices are voided in Xero, not pushed.');
  if (!clip(invoice.number, 255)) throw new MappingError('no_number', 'The invoice has no number.');
  if (!ctx.contactId) throw new MappingError('no_contact', 'The customer is not linked to a Xero contact yet.');
  if (round2(invoice.total) < 0) {
    throw new MappingError('negative_total', 'Xero can\'t take an invoice with a negative total. Raise a credit note in Xero instead.');
  }

  const meta = parseInvoiceMeta(invoice.line_items);
  const lines = flattenLines(meta);
  if (!lines.length) throw new MappingError('no_lines', 'The invoice has no line items.');

  const jobs = Array.isArray(ctx.jobs) ? ctx.jobs : [];
  const jobById = new Map(jobs.map((j) => [String(j.id), j]));
  const ccById = new Map((ctx.costCenters || []).map((cc) => [String(cc.id), cc]));
  const jobIds = invoiceJobIds(invoice, meta);
  const primaryJob = jobById.get(jobIds[0]) || null;
  const ccForJob = (job) => (job?.cost_center_id ? ccById.get(String(job.cost_center_id)) || null : null);

  // Consolidated invoices don't record which job each line came from. If those
  // jobs sit in different cost centers, everything lands on the first one.
  const distinctCcs = new Set(jobIds.map((id) => jobById.get(id)?.cost_center_id || '').filter(Boolean));
  if (distinctCcs.size > 1 && lines.some((l) => !l.jobId)) {
    warnings.push('This invoice combines jobs from different cost centers. Lines were coded to the first job\'s cost center.');
  }

  const taxed = round2(invoice.tax) > 0;
  const taxType = taxed ? settings.taxTypeTaxed || 'OUTPUT' : settings.taxTypeExempt || 'EXEMPTOUTPUT';

  const missing = [];
  let expectedSubtotal = 0;
  const lineItems = lines.map((line) => {
    const job = (line.jobId && jobById.get(String(line.jobId))) || primaryJob;
    const cc = ccForJob(job);
    const quantity = round(Number(line.qty ?? 1) || 1, 4);
    const unitAmount = round(Number(line.rate ?? line.total ?? 0) || 0, 4);
    expectedSubtotal += round2(quantity * unitAmount);
    const accountCode = accountForLine(line, cc, settings);
    if (!accountCode) missing.push(clip(line.description, 60) || 'Unnamed line');
    const item = {
      Description: clip(line.description, 4000) || 'Item',
      Quantity: quantity,
      UnitAmount: unitAmount,
      AccountCode: accountCode,
      TaxType: taxType,
    };
    const tracking = trackingFor(cc);
    if (tracking) item.Tracking = tracking;
    return item;
  });
  if (missing.length) {
    throw new MappingError(
      'no_account',
      `No Xero sales account for: ${missing.join(', ')}. Set a default sales account in Settings → Accounting & Xero.`,
      { lines: missing }
    );
  }

  expectedSubtotal = round2(expectedSubtotal);
  if (Math.abs(expectedSubtotal - round2(invoice.subtotal)) > 0.01) {
    warnings.push(`Line totals (${expectedSubtotal.toFixed(2)}) differ from the RELAY subtotal (${round2(invoice.subtotal).toFixed(2)}).`);
  }

  const date = toXeroDate(meta.issueDate, timeZone) || toXeroDate(invoice.created_at, timeZone);
  if (!date) throw new MappingError('no_date', 'The invoice has no issue date.');
  let dueDate = toXeroDate(invoice.due_date, timeZone);
  if (!dueDate) {
    dueDate = addDays(date, Number(settings.defaultDueDays) || 30);
    warnings.push(`No due date set; used ${dueDate}.`);
  }

  const jobNumbers = meta.jobNumbers.length ? meta.jobNumbers : jobIds.map((id) => jobById.get(id)?.number).filter(Boolean);

  const payload = {
    Type: 'ACCREC',
    Contact: { ContactID: ctx.contactId },
    InvoiceNumber: clip(invoice.number, 255),
    Reference: clip(jobNumbers.length ? jobNumbers.join(', ') : invoice.title, 255) || undefined,
    Date: date,
    DueDate: dueDate,
    Status: 'AUTHORISED',
    LineAmountTypes: 'Exclusive',
    CurrencyCode: 'AUD',
    LineItems: lineItems,
  };
  if (invoice.xero_invoice_id) payload.InvoiceID = invoice.xero_invoice_id;
  if (ctx.sourceUrl) payload.Url = ctx.sourceUrl;
  return { payload, warnings, expectedSubtotal };
}

export const APP_BASE = 'https://relaydispatch.com.au/app';

/**
 * The "View source" link on the Xero invoice. It doubles as RELAY's marker:
 * an existing Xero invoice with this link is one RELAY created and can be
 * adopted after a lost response, while a number clash without it is someone
 * else's invoice and is never overwritten.
 */
export function invoiceSourceUrl(invoiceId, appBase = APP_BASE) {
  return `${appBase}/#/invoices/${encodeURIComponent(invoiceId)}`;
}

/** Is this Xero invoice (from GET /Invoices) the one RELAY pushed for `invoiceId`? */
export function isRelayInvoice(xeroInvoice, invoiceId, appBase = APP_BASE) {
  return !!xeroInvoice && xeroInvoice.Type === 'ACCREC' && xeroInvoice.Url === invoiceSourceUrl(invoiceId, appBase)
    && !['DELETED', 'VOIDED'].includes(xeroInvoice.Status);
}

/**
 * Compare Xero's computed total with RELAY's. GST is recalculated per line in
 * Xero, so a few cents of rounding is expected; more than that needs a person.
 */
export function reconcileTotals(relayTotal, xeroTotal, tolerance = 0.05) {
  const diff = round2(Number(xeroTotal) - Number(relayTotal));
  if (diff === 0) return { status: 'ok', diff };
  if (Math.abs(diff) <= tolerance) return { status: 'warning', diff };
  return { status: 'mismatch', diff };
}

// ── Payments ─────────────────────────────────────────────────────────

/**
 * The Xero payments still to push for an invoice: each recorded part-payment,
 * plus the unrecorded balance once RELAY marks it Paid (manual "Mark paid" and
 * Stripe set status without adding to the payments list). Refs already in
 * xero_payment_ids are skipped.
 *
 * @returns {Array<{ ref: string, idempotencyKey: string, payload: object }>}
 */
export function buildPayments(invoice, ctx = {}) {
  const settings = ctx.settings || {};
  const timeZone = ctx.timeZone || DEFAULT_TIME_ZONE;
  const xeroInvoiceId = ctx.xeroInvoiceId || invoice.xero_invoice_id;
  if (!xeroInvoiceId) throw new MappingError('not_in_xero', 'The invoice has not been sent to Xero yet.');

  const pushed = invoice.xero_payment_ids && typeof invoice.xero_payment_ids === 'object' ? invoice.xero_payment_ids : {};
  const meta = parseInvoiceMeta(invoice.line_items);
  const isStripe = (method) => /stripe/i.test(String(method || ''));

  const wanted = [];
  let recordedSum = 0;
  meta.payments.forEach((p, index) => {
    const amount = round2(p?.amount);
    if (!(amount > 0)) return;
    recordedSum += amount;
    wanted.push({
      ref: `p:${p.id || index}`,
      amount,
      date: toXeroDate(p.date || p.createdAt, timeZone),
      method: p.method || '',
      reference: p.reference || '',
    });
  });

  if (invoice.status === 'Paid') {
    const balance = round2(Number(invoice.total) - recordedSum);
    if (balance > 0.005) {
      const stripeRef = isStripe(invoice.payment_method) && invoice.stripe_session_id ? `stripe:${invoice.stripe_session_id}` : '';
      wanted.push({
        ref: stripeRef || 'balance',
        amount: balance,
        // Invoices bulk-marked paid before paid_date was set there have no date;
        // the last change (marking it paid) is the best stand-in.
        date: toXeroDate(invoice.paid_date, timeZone) || toXeroDate(invoice.updated_at, timeZone),
        method: invoice.payment_method || '',
        reference: '',
      });
    }
  }

  const todo = wanted.filter((p) => !pushed[p.ref]);
  return todo.map((p) => {
    const code = isStripe(p.method) ? settings.stripeAccountCode || settings.paymentAccountCode : settings.paymentAccountCode;
    if (!code) {
      throw new MappingError('no_payment_account', 'Choose the Xero account payments are received into in Settings → Accounting & Xero.');
    }
    if (!p.date) throw new MappingError('no_payment_date', 'A payment has no date.');
    return {
      ref: p.ref,
      idempotencyKey: `relay-pay-${invoice.id}-${p.ref}`.slice(0, 128),
      payload: {
        Invoice: { InvoiceID: xeroInvoiceId },
        Account: { Code: code },
        Date: p.date,
        Amount: p.amount,
        Reference: clip([p.method, p.reference].filter(Boolean).join(' · '), 255) || undefined,
      },
    };
  });
}

// ── Webhooks ─────────────────────────────────────────────────────────

/**
 * Invoice events from a verified webhook body. Contact events are ignored in
 * Phase 1; the intent-to-receive handshake has none at all.
 * @returns {Array<{ tenantId: string, resourceId: string, type: string }>}
 */
export function invoiceEvents(body) {
  const events = Array.isArray(body?.events) ? body.events : [];
  const seen = new Set();
  const out = [];
  for (const e of events) {
    if (String(e?.eventCategory).toUpperCase() !== 'INVOICE' || !e.tenantId || !e.resourceId) continue;
    const key = `${e.tenantId}:${e.resourceId}`;
    if (seen.has(key)) continue;
    seen.add(key);
    out.push({ tenantId: String(e.tenantId), resourceId: String(e.resourceId), type: String(e.eventType || '') });
  }
  return out;
}

/** { tenantId: [InvoiceID, ...] } from invoiceEvents(), for one enqueue call per tenant. */
export function invoiceIdsByTenant(events) {
  const out = {};
  for (const e of events) (out[e.tenantId] ||= []).push(e.resourceId);
  return out;
}
