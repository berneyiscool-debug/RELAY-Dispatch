/**
 * Invoices — drafting, issuing and settling a job's billing.
 *
 * Written the way `JobDetail.js` and `InvoiceDetail.js` write invoices, with two
 * deliberate differences:
 *
 * 1. The amount billed is summed from the price lines that end up on the
 *    invoice rather than copied from the quote's stored subtotal, so the tax and
 *    total always agree with the lines being printed. `InvoiceDetail.js`
 *    recomputes the subtotal from the lines the same way when it saves.
 * 2. `send_invoice` changes the status only. The real Send button also emails
 *    the customer — pay link, PDF and a ten-second undo window — which brny has
 *    no business doing unattended.
 *
 * A draft never moves the job to "Invoiced": `store.js` flips it when an invoice
 * leaves Draft with a status that is neither Draft nor Void, so an abandoned
 * draft can never strand a job.
 */

import { store } from '../data/store.js';
import { defineAction } from './registry.js';
import { resolveOne } from './resolve.js';
import { objectSchema, str, num, bool, enumOf, dateish } from './schema.js';
import { conflict, invalidInput } from './errors.js';
import { logActivity, currentActor } from './context.js';
import { resolveJob } from './jobs.js';
import { resolveCustomer } from './customers.js';
import { resolveQuote } from './quotes.js';
import { tasklistHours, worksDoneDescription } from './timeMaterials.js';
import { parseDate, todayLocalISO, dateLabel } from './dates.js';
import { roundCurrency, calculateBillableMaterialPrice, calculateTotalBillableMaterials } from '../utils/pricing.js';

export const INVOICE_STATUSES = ['Draft', 'Sent', 'Paid', 'Overdue', 'Void'];
export const INVOICE_TYPES = ['Standard', 'Deposit', 'Progress'];
export const PAYMENT_METHODS = ['Credit Card', 'Bank Transfer', 'Cash', 'Cheque'];

/** Written into `historyLog`, which the invoice timeline renders. */
const STATUS_BADGE = { Sent: 'badge-info', Paid: 'badge-success', Void: 'badge-void' };

const DEFAULT_TERM_DAYS = 30;
const DAY_MS = 86400000;

const money = (value) => `$${(Number(value) || 0).toFixed(2)}`;

const invoiceLabel = (invoice) =>
  invoice ? `${invoice.number || invoice.id} ${invoice.customerName || ''}`.trim() : '';

export const invoiceSearch = {
  label: invoiceLabel,
  searchFields: ['number', 'customerName', 'contactName', 'jobNumber', 'title', 'notes'],
  what: 'invoice',
};

/** The invoice a reference like "INV-00412" or "the Sorenson deposit invoice" means. */
export function resolveInvoice(query) {
  return resolveOne('invoices', query, invoiceSearch).record;
}

/** Scope a job lookup to one customer when the job name alone is ambiguous. */
function customerScope(name) {
  if (!name) return {};
  const { customer } = resolveCustomer(name, { create: false });
  return customer ? { customerId: customer.id } : {};
}

/** Price lines from a quote, flattened across both the section and legacy shapes. */
function lineItemsOf(quote) {
  if (!quote) return [];
  if (Array.isArray(quote.sections) && quote.sections.length) {
    return quote.sections.flatMap((section) => section.lineItems || section.items || []);
  }
  return Array.isArray(quote.lineItems) ? quote.lineItems : [];
}

/** A quote's sections, deep-cloned so edits never reach the quote record. */
function quoteSections(quote) {
  if (!quote) return [];
  if (Array.isArray(quote.sections) && quote.sections.length) {
    return JSON.parse(JSON.stringify(quote.sections)).map((section) => ({
      ...section,
      id: section.id || store.generateId(),
      name: section.name || 'Main Phase',
      lineItems: (section.lineItems || []).map((item) => lineTotal({ ...item })),
    }));
  }
  const lines = lineItemsOf(quote);
  if (!lines.length) return [];
  return [
    {
      id: store.generateId(),
      name: 'Main Phase',
      lineItems: lines.map((item) => lineTotal({ ...item })),
    },
  ];
}

/** Keep `total` honest against `qty × rate`, matching `InvoiceDetail.js`. */
function lineTotal(item) {
  const qty = Number(item.qty ?? 1) || 1;
  const rate = Number(item.rate) || 0;
  return { ...item, qty, rate, total: roundCurrency(qty * rate) };
}

function subtotalOf(sections) {
  return roundCurrency(
    (sections || []).reduce(
      (sum, section) => sum + (section.lineItems || []).reduce((lineSum, item) => lineSum + (Number(item.total) || 0), 0),
      0
    )
  );
}

/** The default labour rate the app prices task estimates against. */
function defaultLaborRate(settings) {
  const rates = (settings && settings.laborRates) || [];
  const rate = rates.find((entry) => entry.isDefault) || rates[0];
  return { rate: rate ? Number(rate.rate) || 85 : 85, name: (rate && rate.name) || 'Labour' };
}

/**
 * Price a job from its tasklist and materials — the fallback the UI uses when
 * there is no quote, and the basis for a progress payment.
 */
function tasklistSource(job) {
  const settings = store.getSettings() || {};
  const lines = [];

  const hours = tasklistHours(job.tasks || []);
  const labor = defaultLaborRate(settings);
  if (hours > 0) {
    const total = roundCurrency(hours * labor.rate);
    lines.push({
      id: store.generateId(),
      description: `${labor.name} (${hours.toFixed(2)} hrs)`,
      type: 'labor',
      qty: hours,
      rate: labor.rate,
      total,
    });
  }

  const additionalCost = Number(job.additionalMaterialCost) || 0;
  const materials = job.materials || [];
  const billableAdditional = calculateBillableMaterialPrice(additionalCost, settings);
  const totalBillableMaterials = calculateTotalBillableMaterials(materials, settings);

  if (materials.length) {
    for (const material of materials) {
      const qty = Number(material.quantity ?? 1) || 1;
      const rate = calculateBillableMaterialPrice(Number(material.unitCost) || 0, settings);
      lines.push({
        id: store.generateId(),
        description: material.name || material.partName || 'Material',
        type: 'material',
        qty,
        rate,
        total: roundCurrency(qty * rate),
      });
    }
    if (additionalCost > 0) {
      lines.push({
        id: store.generateId(),
        description: 'Additional Materials & Markup',
        type: 'material',
        qty: 1,
        rate: billableAdditional,
        total: billableAdditional,
      });
    }
  } else {
    const materialTotal =
      totalBillableMaterials + (additionalCost > 0 ? billableAdditional - additionalCost : 0) + additionalCost;
    const billable = roundCurrency(materialTotal || Number(job.materialCost) || 0);
    if (billable > 0) {
      lines.push({
        id: store.generateId(),
        description: 'Job Materials',
        type: 'material',
        qty: 1,
        rate: billable,
        total: billable,
      });
    }
  }

  return {
    kind: 'tasklist',
    sections: [{ id: store.generateId(), name: 'Job Items', lineItems: lines }],
    worksDescription: worksDoneDescription(job.tasks || []),
  };
}

/** The full price of a job: its quote when there is one, otherwise the tasklist. */
function standardSource(job, quote) {
  const sections = quoteSections(quote);
  if (sections.length) {
    return { kind: 'quote', sections, subtotal: subtotalOf(sections), worksDescription: '' };
  }
  const fallback = tasklistSource(job);
  return { ...fallback, subtotal: subtotalOf(fallback.sections) };
}

/**
 * Deposit bases, in the four flavours the deposit modal offers: quoted or actual
 * labour, quoted or actual materials.
 */
function depositBases(job, quote) {
  const settings = store.getSettings() || {};
  const lines = lineItemsOf(quote);
  const sumOfType = (type) =>
    lines.reduce((sum, item) => {
      if (item.type !== type) return sum;
      return sum + (Number(item.total) || (Number(item.qty) || 0) * (Number(item.rate) || 0));
    }, 0);

  let quotedLabor = sumOfType('labor');
  if (!quotedLabor) quotedLabor = tasklistHours(job.tasks || []) * defaultLaborRate(settings).rate;

  let quotedMaterials = sumOfType('material');
  if (!quotedMaterials) quotedMaterials = Number(job.estimatedMaterialCost || job.materialCost) || 0;

  const technicians = store.getAll('technicians') || [];
  const actualLabor = (store.getAll('timesheets') || [])
    .filter((sheet) => sheet.jobId === job.id)
    .reduce((sum, sheet) => {
      const technician = technicians.find((entry) => entry.id === sheet.technicianId);
      const rate = technician ? technician.payRate || technician.hourlyRate || 45 : 45;
      return sum + (Number(sheet.hours ?? sheet.durationHours ?? sheet.duration_hours) || 0) * rate;
    }, 0);

  const purchaseOrders = store.getAll('purchaseOrders') || [];
  const purchaseOrderCost = purchaseOrders
    .filter(
      (order) =>
        (order.jobId && String(order.jobId) === String(job.id)) ||
        (order.jobNumber && job.number && String(order.jobNumber) === String(job.number))
    )
    .reduce((sum, order) => sum + (Number(order.total) || 0), 0);
  const materialCost = (job.materials || []).reduce(
    (sum, material) => sum + (Number(material.quantity ?? 1) || 1) * (Number(material.unitCost) || 0),
    0
  );
  const actualMaterials = materialCost + (Number(job.additionalMaterialCost) || 0) + purchaseOrderCost;

  return { quotedLabor, quotedMaterials, actualLabor, actualMaterials };
}

/**
 * Append "Less Deposit Billed" credits so a final invoice never bills a deposit
 * twice — the same deduction `JobDetail.js` applies to a standard invoice.
 */
function applyDepositCredits(job, sections, subtotal) {
  const deposits = (store.getAll('invoices') || []).filter(
    (invoice) =>
      String(invoice.jobId) === String(job.id) && invoice.invoiceType === 'Deposit' && invoice.status !== 'Void'
  );
  const credited = roundCurrency(deposits.reduce((sum, deposit) => sum + (Number(deposit.subtotal) || 0), 0));
  if (credited <= 0) return { credited: 0, subtotal };

  const credits = deposits.map((deposit) => ({
    id: store.generateId(),
    description: `Less Deposit Billed (${deposit.number})`,
    type: 'other',
    qty: 1,
    rate: -(Number(deposit.subtotal) || 0),
    total: -(Number(deposit.subtotal) || 0),
  }));

  const target = sections[sections.length - 1];
  if (target) target.lineItems = [...(target.lineItems || []), ...credits];
  else sections.push({ id: store.generateId(), name: 'Prepayments & Deposits Credit', lineItems: credits });

  return { credited, subtotal: roundCurrency(Math.max(0, subtotal - credited)) };
}

/**
 * The quote an invoice should reference: a named one, the job's own, or the
 * single accepted quote covering the job. `"tasklist"`/`"none"` forces the
 * tasklist fallback.
 */
function resolveInvoiceQuote(job, reference) {
  const named = String(reference || '').toLowerCase();
  if (['tasklist', 'none', 'no quote'].includes(named)) return null;
  if (named && named !== 'accepted') return resolveQuote(reference);

  const own = job.quoteId ? store.getById('quotes', job.quoteId) : null;
  if (own) return own;

  const accepted = (store.getAll('quotes') || []).filter(
    (quote) => (quote.jobId === job.id || quote.id === job.quoteId) && quote.status === 'Accepted'
  );
  if (accepted.length > 1) {
    throw conflict(
      `Job ${job.number} has ${accepted.length} accepted quotes, so there is no one price to bill against. Name the quote you mean.`,
      { quotes: accepted.map((quote) => ({ number: quote.number, title: quote.title || '', total: quote.total })) }
    );
  }
  return accepted[0] || null;
}

/** Only these statuses mean the customer has the invoice and may be settled. */
function assertSettleable(invoice) {
  if (invoice.status === 'Paid') throw conflict(`${invoice.number} is already marked as paid.`);
  if (invoice.status === 'Void') throw conflict(`${invoice.number} has been voided.`);
  if (invoice.status !== 'Sent' && invoice.status !== 'Overdue') {
    throw conflict(`${invoice.number} is still a draft. Send it before recording a payment against it.`);
  }
}

defineAction({
  name: 'create_invoice',
  title: 'Draft an invoice',
  description:
    'Draft an invoice for a job from its accepted quote, or from the job\'s own tasklist and materials. Pass type "Deposit" or "Progress" with a percent to bill part of the job up front. The invoice starts as a draft and only reaches the customer once you send it, so the job is not marked as invoiced yet.',
  permission: { module: 'Invoices', key: 'create' },
  inputSchema: objectSchema(
    {
      job: str('Job number, or a description of the job such as "Rough in at Ashgrove".'),
      customer: str('Customer, to narrow the job down when the name on its own is ambiguous.'),
      quote: str('Quote to bill from. Omit to use the job\'s quote, then the tasklist.'),
      type: enumOf(INVOICE_TYPES, 'Kind of invoice. Defaults to Standard, or Deposit/Progress when a percent is given.'),
      percent: num('How much of the job to bill, for a Deposit or Progress invoice, e.g. 30.'),
      basis: enumOf(['quoted', 'actual'], 'Deposit only: price the deposit on quoted figures or actual costs.'),
      applyDeposits: bool('Standard invoices: deduct any deposit already billed. Defaults to true.'),
      dueInDays: num('Payment terms in days from today. Defaults to 30.'),
      notes: str('Notes to show on the invoice.'),
    },
    ['job']
  ),
  summarize: (input, result) =>
    `${result.invoice.number} drafted for ${result.job.number}: ${money(result.invoice.total)} inc GST, due ${dateLabel(result.invoice.dueDate)}.`,
  artifacts: (result) => [{ label: `${result.invoice.number} — ${result.job.number}`, path: `/invoices/${result.invoice.id}` }],
  run: async (input) => {
    const job = resolveJob(input.job, customerScope(input.customer));
    const type = input.type || (input.percent != null ? 'Progress' : 'Standard');
    const percent = input.percent == null ? null : Number(input.percent);

    if (type !== 'Standard' && !(percent > 0 && percent <= 100)) {
      throw invalidInput(`A ${type.toLowerCase()} invoice needs a percentage between 1 and 100.`, { percent: input.percent });
    }

    const termDays = input.dueInDays == null ? DEFAULT_TERM_DAYS : Number(input.dueInDays);
    if (!Number.isFinite(termDays) || termDays < 0) {
      throw invalidInput('Payment terms must be a number of days from today.', { dueInDays: input.dueInDays });
    }

    const reference = resolveInvoiceQuote(job, input.quote);

    let sections;
    let subtotal;
    let worksDescription = '';
    let source;

    if (type === 'Deposit') {
      const bases = depositBases(job, reference);
      const basis = input.basis === 'actual' ? 'actual' : 'quoted';
      const labor = basis === 'actual' ? bases.actualLabor : bases.quotedLabor;
      const materials = basis === 'actual' ? bases.actualMaterials : bases.quotedMaterials;
      subtotal = roundCurrency((labor + materials) * (percent / 100));
      if (!(subtotal > 0)) {
        throw conflict(
          `There is nothing to base a deposit on — job ${job.number} has no ${basis} labour or materials recorded yet.`,
          { basis, ...bases }
        );
      }

      const laborLabel = basis === 'actual' ? 'Actual' : 'Quoted';
      const materialLabel = basis === 'actual' ? 'Actual' : 'Quoted';
      sections = [
        {
          id: store.generateId(),
          name: `Deposit (${percent}%)`,
          lineItems: [
            {
              id: store.generateId(),
              description: `Deposit Payment (${percent}% of ${laborLabel} Labor & ${materialLabel} Materials)`,
              type: 'other',
              qty: 1,
              rate: subtotal,
              total: subtotal,
            },
          ],
          subtotal,
        },
      ];
      source = { kind: 'deposit', basis, percent, basisTotal: roundCurrency(labor + materials) };
    } else if (type === 'Progress') {
      const base = standardSource(job, reference);
      subtotal = roundCurrency(base.subtotal * (percent / 100));
      if (!(subtotal > 0)) {
        throw conflict(
          `There is nothing to base a progress payment on — job ${job.number} has no accepted quote, task estimates or materials to price.`,
          { jobNumber: job.number }
        );
      }
      sections = [
        {
          id: store.generateId(),
          name: `Progress Payment (${percent}%)`,
          lineItems: [
            {
              description: `Progress Payment (${percent}% of job)`,
              type: 'other',
              qty: 1,
              rate: subtotal,
              total: subtotal,
            },
          ],
          subtotal,
        },
      ];
      source = { kind: base.kind, percent, jobTotal: base.subtotal };
    } else {
      const base = standardSource(job, reference);
      sections = base.sections;
      subtotal = base.subtotal;
      worksDescription = base.worksDescription || '';
      let credited = 0;

      if (subtotal <= 0) {
        throw conflict(
          `Job ${job.number} has nothing to invoice yet — no accepted quote, task estimates or materials. Price the work first.`,
          { jobNumber: job.number }
        );
      }

      if (input.applyDeposits !== false) {
        const applied = applyDepositCredits(job, sections, subtotal);
        credited = applied.credited;
        subtotal = applied.subtotal;
      }
      source = { kind: base.kind, quote: reference ? reference.number : null, credited };
    }

    const tax = roundCurrency(subtotal * store.getTaxRate());
    const total = roundCurrency(subtotal + tax);

    const invoice = store.create('invoices', {
      number: store.getNextNumber('INV-', 'invoices'),
      invoiceType: type,
      jobId: job.id,
      jobNumber: job.number,
      customerId: job.customerId,
      customerName: job.customerName,
      contactName: job.contactName,
      status: 'Draft',
      sections,
      originalQuoteId: reference ? reference.id : '',
      originalQuoteNumber: reference ? reference.number : '',
      originalSubtotal: subtotal,
      subtotal,
      tax,
      total,
      issueDate: new Date().toISOString(),
      dueDate: new Date(Date.now() + termDays * DAY_MS).toISOString(),
      notes: input.notes || worksDescription || '',
    });

    if (type === 'Deposit') {
      // The job carries a running deposit tally so a later standard invoice can
      // show the customer what has already been paid.
      await store.update('jobs', job.id, {
        depositInvoicedAmount: roundCurrency((Number(job.depositInvoicedAmount) || 0) + subtotal),
        depositPercentage: percent,
      });
    }

    logActivity({
      type: 'invoice_created',
      text: `${type} invoice ${invoice.number} drafted for job ${job.number} — ${money(total)} inc GST.`,
      recordType: 'invoice',
      recordId: invoice.id,
    });

    return {
      summary: `${invoice.number} drafted: a ${type.toLowerCase()} invoice for ${invoice.customerName}, ${money(total)} inc GST (${money(subtotal)} + ${money(tax)} GST), due ${dateLabel(invoice.dueDate)}. It is a draft until you send it.`,
      invoice,
      job,
      source,
    };
  },
});

defineAction({
  name: 'send_invoice',
  title: 'Send an invoice',
  description:
    'Mark a draft invoice as sent. This is the point the job becomes "Invoiced" and the invoice appears in the customer\'s accounts — check the amount first. brny does not email the customer; the invoice is marked as sent so you can email or print it from the invoice page.',
  permission: { module: 'Invoices', key: 'send' },
  risky: true,
  inputSchema: objectSchema(
    {
      invoice: str('Invoice number, or the customer and job it covers.'),
    },
    ['invoice']
  ),
  summarize: (input, result) => `${result.invoice.number} marked as sent to ${result.invoice.customerName}.`,
  artifacts: (result) => [{ label: result.invoice.number, path: `/invoices/${result.invoice.id}` }],
  run: async ({ invoice: reference }) => {
    const invoice = resolveInvoice(reference);
    if (invoice.status === 'Sent') {
      return { summary: `${invoice.number} has already been sent.`, invoice, changed: false };
    }
    if (invoice.status !== 'Draft') {
      throw conflict(`${invoice.number} is ${invoice.status.toLowerCase()} and cannot be sent from there.`);
    }

    const sentAt = new Date().toISOString();
    await store.update('invoices', invoice.id, { status: 'Sent', sentAt });

    logActivity({
      type: 'invoice_sent',
      text: `Invoice ${invoice.number} sent to ${invoice.customerName} — ${money(invoice.total)} inc GST.`,
      recordType: 'invoice',
      recordId: invoice.id,
    });

    return {
      summary: `${invoice.number} marked as sent — ${money(invoice.total)} inc GST to ${invoice.customerName}, due ${dateLabel(invoice.dueDate)}. Job ${invoice.jobNumber || ''} is now invoiced.`,
      invoice: { ...invoice, status: 'Sent', sentAt },
      changed: true,
    };
  },
});

defineAction({
  name: 'record_invoice_payment',
  title: 'Record an invoice payment',
  description:
    'Record that a sent invoice has been paid, with the date and how it was paid. Use this once the money is actually in the bank — it is the figure your reports count as income.',
  permission: { module: 'Invoices', key: 'send' },
  risky: true,
  inputSchema: objectSchema(
    {
      invoice: str('Invoice number, or the customer and job it covers.'),
      paidDate: dateish('When the payment landed. Defaults to today.'),
      paymentMethod: enumOf(PAYMENT_METHODS, 'How it was paid. Defaults to Credit Card.'),
    },
    ['invoice']
  ),
  summarize: (input, result) =>
    `${result.invoice.number} recorded as paid — ${money(result.invoice.total)} by ${result.invoice.paymentMethod} on ${result.invoice.paidDate}.`,
  artifacts: (result) => [{ label: result.invoice.number, path: `/invoices/${result.invoice.id}` }],
  run: async ({ invoice: reference, paidDate, paymentMethod }) => {
    const invoice = resolveInvoice(reference);
    assertSettleable(invoice);

    const date = paidDate ? parseDate(paidDate) : todayLocalISO();
    const method = paymentMethod || PAYMENT_METHODS[0];
    if (!PAYMENT_METHODS.includes(method)) throw invalidInput(`Unknown payment method "${method}".`, { paymentMethod });

    const entry = {
      id: store.generateId(),
      date: new Date().toISOString(),
      type: 'Payment',
      title: 'Payment Settled',
      description: `Payment recorded via ${method} on ${date}`,
      user: currentActor().name,
      icon: 'check_circle',
      badgeClass: STATUS_BADGE.Paid,
    };
    const historyLog = [entry, ...(invoice.historyLog || [])];

    await store.update('invoices', invoice.id, { status: 'Paid', paidDate: date, paymentMethod: method, historyLog });

    logActivity({
      type: 'invoice_paid',
      text: `Invoice ${invoice.number} paid — ${money(invoice.total)} by ${method}.`,
      recordType: 'invoice',
      recordId: invoice.id,
    });

    return {
      summary: `${invoice.number} recorded as paid: ${money(invoice.total)} by ${method} on ${date}.`,
      invoice: { ...invoice, status: 'Paid', paidDate: date, paymentMethod: method, historyLog },
      changed: true,
    };
  },
});

defineAction({
  name: 'void_invoice',
  title: 'Void an invoice',
  description:
    'Void an invoice that should never have been raised, or was replaced by a new one. The record is kept for the audit trail but stops counting towards what the customer owes.',
  permission: { module: 'Invoices', key: 'void' },
  risky: true,
  inputSchema: objectSchema(
    {
      invoice: str('Invoice number, or the customer and job it covers.'),
      reason: str('Why it is being voided, for the record.'),
    },
    ['invoice']
  ),
  summarize: (input, result) =>
    `${result.invoice.number} voided${input.reason ? ` — ${input.reason}` : ''}.`,
  artifacts: (result) => [{ label: result.invoice.number, path: `/invoices/${result.invoice.id}` }],
  run: async ({ invoice: reference, reason }) => {
    const invoice = resolveInvoice(reference);
    if (invoice.status === 'Void') {
      return { summary: `${invoice.number} has already been voided.`, invoice, changed: false };
    }

    const entry = {
      id: store.generateId(),
      date: new Date().toISOString(),
      type: 'Status',
      title: 'Invoice Voided',
      description: reason ? `Voided by ${currentActor().name} — ${reason}` : `Voided by ${currentActor().name}`,
      user: currentActor().name,
      icon: 'block',
      badgeClass: STATUS_BADGE.Void,
    };
    const historyLog = [entry, ...(invoice.historyLog || [])];

    await store.update('invoices', invoice.id, { status: 'Void', historyLog });

    logActivity({
      type: 'invoice_voided',
      text: `Invoice ${invoice.number} voided${reason ? ` — ${reason}` : ''}.`,
      recordType: 'invoice',
      recordId: invoice.id,
    });

    return {
      summary: `${invoice.number} (${money(invoice.total)} inc GST) voided${reason ? ` — ${reason}` : ''}.`,
      invoice: { ...invoice, status: 'Void', historyLog },
      changed: true,
    };
  },
});
