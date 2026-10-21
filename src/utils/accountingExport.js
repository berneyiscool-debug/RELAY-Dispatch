// ============================================
// RELAY — ACCOUNTING EXPORTS (invoice list)
// ============================================
// Two honest exports, for companies that don't sync with Xero or who want a
// file for their accountant:
//
//   * xeroImportCsv — Xero's sales invoice import template: one row per line,
//     coded with the same accounts, tracking and GST the live sync uses (it
//     calls the sync's own mapping). Xero imports these as "Awaiting payment";
//     an import can't record payments, so paid invoices still need their
//     payment entered in Xero (the live connection does that part).
//   * plainCsv — one row per invoice for a spreadsheet.
//
// Pure functions over store records; the page does the download.

import { DEFAULT_TIME_ZONE, MappingError, buildInvoice, contactName, toXeroDate } from '../../supabase/functions/_xero/mapping.js';

// Column order and names of Xero's "Sales invoice" import template. Starred
// columns are required by Xero.
export const XERO_IMPORT_HEADERS = Object.freeze([
  '*ContactName', 'EmailAddress',
  'POAddressLine1', 'POAddressLine2', 'POAddressLine3', 'POAddressLine4',
  'POCity', 'PORegion', 'POPostalCode', 'POCountry',
  '*InvoiceNumber', 'Reference', '*InvoiceDate', '*DueDate', 'Total',
  'InventoryItemCode', '*Description', '*Quantity', '*UnitAmount', 'Discount',
  '*AccountCode', '*TaxType', 'TaxAmount',
  'TrackingName1', 'TrackingOption1', 'TrackingName2', 'TrackingOption2',
  'Currency', 'BrandingTheme',
]);

// The import takes tax rate names, not the API's TaxType codes.
const TAX_TYPE_NAMES = { OUTPUT: 'GST on Income', EXEMPTOUTPUT: 'GST Free Income' };

const cell = (value) => {
  const s = value === undefined || value === null ? '' : String(value);
  // Quote everything; double embedded quotes. A leading =, +, - or @ would run
  // as a formula when the file is opened in a spreadsheet, so it is defused.
  const safe = /^[=+\-@]/.test(s) && !/^-?\d+(\.\d+)?$/.test(s) ? `'${s}` : s;
  return `"${safe.replace(/"/g, '""')}"`;
};

export const toCsv = (rows) => rows.map((r) => r.map(cell).join(',')).join('\r\n');

/** YYYY-MM-DD → DD/MM/YYYY, the date format Xero's AU import expects. */
const auDate = (iso) => (iso ? iso.split('-').reverse().join('/') : '');

/** A store invoice (camelCase, sections) in the row shape the sync mapping reads. */
export function toMappingInvoice(inv) {
  return {
    id: inv.id,
    number: inv.number,
    title: inv.title,
    status: inv.status,
    job_id: inv.jobId || null,
    subtotal: inv.subtotal,
    tax: inv.tax,
    total: inv.total,
    due_date: inv.dueDate || null,
    created_at: inv.createdAt || null,
    line_items: {
      sections: inv.sections || [],
      jobIds: inv.jobIds || [],
      jobNumbers: inv.jobNumbers || [],
      issueDate: inv.issueDate || '',
    },
  };
}

const toMappingCustomer = (c) => c && ({
  id: c.id, company: c.company, first_name: c.firstName, last_name: c.lastName, email: c.email,
});
const toMappingJob = (j) => ({ id: j.id, number: j.number, cost_center_id: j.costCenterId || null });
const toMappingCostCenter = (cc) => ({
  id: cc.id,
  xero_sales_account_code: cc.xeroSalesAccountCode || null,
  xero_tracking_category_name: cc.xeroTrackingCategoryName || null,
  xero_tracking_option_name: cc.xeroTrackingOptionName || null,
});

/**
 * Build the Xero sales invoice import file.
 *
 * @param {Array} invoices  store invoices to export
 * @param {object} ctx
 * @param {Array}  ctx.customers, ctx.jobs, ctx.costCenters  store records
 * @param {object} ctx.settings  Xero coding defaults (settings.xero shape)
 * @returns {{ csv: string, exported: number, skipped: Array<{ number: string, reason: string }> }}
 */
export function xeroImportCsv(invoices, { customers = [], jobs = [], costCenters = [], settings = {}, timeZone = DEFAULT_TIME_ZONE } = {}) {
  const customerById = new Map(customers.map((c) => [String(c.id), c]));
  const mappedJobs = jobs.map(toMappingJob);
  const mappedCenters = costCenters.map(toMappingCostCenter);
  const rows = [[...XERO_IMPORT_HEADERS]];
  const skipped = [];
  let exported = 0;

  for (const inv of invoices) {
    if (inv.status === 'Draft' || inv.status === 'Void') {
      skipped.push({ number: inv.number || '', reason: `${inv.status} invoices aren't exported.` });
      continue;
    }
    const customer = customerById.get(String(inv.customerId));
    const name = (customer && contactName(toMappingCustomer(customer))) || String(inv.customerName || '').trim();
    if (!name) {
      skipped.push({ number: inv.number || '', reason: 'The invoice has no customer name.' });
      continue;
    }
    let built;
    try {
      built = buildInvoice(toMappingInvoice(inv), {
        contactId: 'export', jobs: mappedJobs, costCenters: mappedCenters, settings, timeZone,
      });
    } catch (err) {
      if (!(err instanceof MappingError)) throw err;
      skipped.push({ number: inv.number || '', reason: err.message });
      continue;
    }
    const { payload } = built;
    for (const line of payload.LineItems) {
      const tracking = line.Tracking?.[0];
      const row = Object.fromEntries(XERO_IMPORT_HEADERS.map((h) => [h, '']));
      Object.assign(row, {
        '*ContactName': name,
        EmailAddress: customer?.email || '',
        '*InvoiceNumber': payload.InvoiceNumber,
        Reference: payload.Reference || '',
        '*InvoiceDate': auDate(payload.Date),
        '*DueDate': auDate(payload.DueDate),
        '*Description': line.Description,
        '*Quantity': line.Quantity,
        '*UnitAmount': line.UnitAmount,
        '*AccountCode': line.AccountCode,
        '*TaxType': TAX_TYPE_NAMES[line.TaxType] || line.TaxType,
        TrackingName1: tracking?.Name || '',
        TrackingOption1: tracking?.Option || '',
        Currency: 'AUD',
      });
      rows.push(XERO_IMPORT_HEADERS.map((h) => row[h]));
    }
    exported++;
  }
  return { csv: toCsv(rows), exported, skipped };
}

export const PLAIN_HEADERS = Object.freeze(['Invoice number', 'Customer', 'Job ref', 'Issue date', 'Due date', 'Status', 'Subtotal', 'GST', 'Total', 'Paid date', 'Payment method']);

/** One row per invoice, for a spreadsheet. `jobRefs(inv)` returns its job numbers. */
export function plainCsv(invoices, { jobRefs = () => [], timeZone = DEFAULT_TIME_ZONE } = {}) {
  const money = (n) => (Number(n) || 0).toFixed(2);
  const rows = invoices.map((inv) => [
    inv.number || '',
    inv.customerName || '',
    jobRefs(inv).join(', '),
    auDate(toXeroDate(inv.issueDate || inv.createdAt, timeZone)),
    auDate(toXeroDate(inv.dueDate, timeZone)),
    inv.status || '',
    money(inv.subtotal),
    money(inv.tax),
    money(inv.total),
    auDate(toXeroDate(inv.paidDate, timeZone)),
    inv.paymentMethod || '',
  ]);
  return toCsv([[...PLAIN_HEADERS], ...rows]);
}

/** Save a CSV in the browser. */
export function downloadCsv(filename, csv) {
  // A BOM so Excel reads the file as UTF-8 (names with accents survive).
  const blob = new Blob(['﻿', csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
