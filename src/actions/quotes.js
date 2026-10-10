/**
 * Quotes — pricing, acceptance, and the conversion into a job.
 *
 * Totals and sections are written the way `QuoteDetail.js` writes them, so a
 * quote built by brny prices and converts exactly like one built by hand. The
 * one deliberate difference: the UI picks a random technician when converting,
 * while `convert_quote_to_job` takes an explicit `technician` (or leaves the
 * job unassigned) so the same request always produces the same record.
 */

import { store } from '../data/store.js';
import { defineAction } from './registry.js';
import { resolveOne } from './resolve.js';
import { objectSchema, str, num, enumOf, list, objectOf, dateish } from './schema.js';
import { invalidInput, notFound } from './errors.js';
import { logActivity, currentActor } from './context.js';
import { resolveCustomer, customerLabel } from './customers.js';
import { parseDate } from './dates.js';
import { roundCurrency } from '../utils/pricing.js';
import { findTechnician } from './leads.js';

const QUOTE_STATUSES = ['Draft', 'Finalised', 'Sent', 'Accepted', 'Declined', 'Archived'];

const quoteLabel = (quote) => (quote ? `${quote.number || quote.id} ${quote.title || ''}`.trim() : '');

export const quoteSearch = {
  label: quoteLabel,
  searchFields: ['number', 'title', 'customerName', 'contactName', 'notes'],
  what: 'quote',
};

/** The quote a reference like "Q-01284" or "the Turner EV charger quote" means. */
export function resolveQuote(query) {
  return resolveOne('quotes', query, quoteSearch).record;
}

function lineItemSchema() {
  return objectOf(
    {
      description: str('What is being charged for.'),
      type: enumOf(['labor', 'material'], 'Defaults to labor.'),
      qty: num('Quantity. Defaults to 1.'),
      rate: num('Unit price in dollars, excluding GST.'),
    },
    'One price line.',
    ['description', 'rate']
  );
}

/** Wrap price lines in the single "Main Scope" section the app quotes from. */
function buildSections(items) {
  return [
    {
      id: store.generateId(),
      name: 'Main Scope',
      lineItems: items.map((item) => {
        const qty = Number(item.qty ?? 1) || 1;
        const rate = Number(item.rate) || 0;
        return {
          description: item.description,
          type: item.type || 'labor',
          qty,
          rate: roundCurrency(rate),
          total: roundCurrency(qty * rate),
        };
      }),
    },
  ];
}

function totalsFor(sections) {
  const subtotal = roundCurrency(
    (sections || []).reduce(
      (sum, section) => sum + (section.lineItems || []).reduce((lineSum, item) => lineSum + (Number(item.total) || 0), 0),
      0
    )
  );
  const tax = roundCurrency(subtotal * store.getTaxRate());
  return { subtotal, tax, total: roundCurrency(subtotal + tax) };
}

defineAction({
  name: 'create_quote',
  title: 'Create a quote',
  description:
    'Draft a customer quote from price lines. Prices exclude GST — tax and the total are calculated for you. To turn a lead into a quote, use convert_lead_to_quote instead.',
  permission: { module: 'Quotes', key: 'create' },
  inputSchema: objectSchema(
    {
      customer: str('Customer name. Matched against existing customers first.'),
      title: str('Short description of the work being quoted.'),
      items: list(lineItemSchema(), 'Price lines, each with a description and a rate.'),
      contactName: str('On-site contact person.'),
      notes: str('Anything to show on the quote, e.g. inclusions or exclusions.'),
      validUntil: dateish('How long the price holds, e.g. "in 30 days" or "2026-04-01".'),
    },
    ['customer', 'title', 'items']
  ),
  summarize: (input, result) => result.summary,
  run: async ({ customer, title, items, contactName, notes, validUntil }) => {
    const { customer: record } = resolveCustomer(customer);
    if (!record) throw notFound('customer', customer);

    const sections = buildSections(items);
    const { subtotal, tax, total } = totalsFor(sections);

    const quote = store.create('quotes', {
      number: store.getNextNumber('Q-', 'quotes'),
      customerId: record.id,
      customerName: customerLabel(record),
      contactName: contactName || undefined,
      title,
      status: 'Draft',
      sections,
      subtotal,
      tax,
      total,
      notes: notes || undefined,
      validUntil: validUntil ? parseDate(validUntil) : undefined,
      createdAt: new Date().toISOString(),
    });

    return {
      summary: `Created draft quote ${quote.number} for ${quote.customerName} — $${quote.total.toFixed(2)} incl. GST (${items.length} line${items.length === 1 ? '' : 's'}).`,
      quote,
      customer: { id: record.id, name: quote.customerName },
    };
  },
});

defineAction({
  name: 'update_quote',
  title: 'Update a quote',
  description:
    'Change a quote\'s details, status or price lines. Passing items replaces the whole scope and re-prices the quote.',
  permission: { module: 'Quotes', key: 'edit' },
  inputSchema: objectSchema(
    {
      quote: str('Quote number or a description of the job it covers.'),
      title: str('New short description.'),
      status: enumOf(QUOTE_STATUSES, 'New status. Use accept_quote or decline_quote for those outcomes.'),
      items: list(lineItemSchema(), 'Replacement price lines. This replaces every existing line.'),
      notes: str('Replacement notes.'),
      validUntil: dateish('New expiry date, e.g. "2026-04-01".'),
    },
    ['quote']
  ),
  summarize: (input, result) => result.summary,
  run: async (input) => {
    const quote = resolveQuote(input.quote);
    const changes = {};

    if (input.title) changes.title = input.title;
    if (input.status) changes.status = input.status;
    if (input.notes !== undefined) changes.notes = input.notes;
    if (input.validUntil) changes.validUntil = parseDate(input.validUntil);

    if (input.items && input.items.length) {
      const sections = buildSections(input.items);
      Object.assign(changes, { sections, ...totalsFor(sections) });
    }

    if (!Object.keys(changes).length) throw invalidInput('Nothing to update — pass at least one field to change.');

    await store.update('quotes', quote.id, changes);

    return {
      summary: `Updated quote ${quote.number}: ${Object.keys(changes).join(', ')}.`,
      quote: { ...quote, ...changes },
    };
  },
});

defineAction({
  name: 'accept_quote',
  title: 'Record a quote as accepted',
  description:
    'Record that the customer accepted a quote. Use it when the customer says yes over the phone or by email — the app\'s portal records on-line signatures itself.',
  permission: { module: 'Quotes', key: 'edit' },
  inputSchema: objectSchema(
    {
      quote: str('Quote number or a description of the job it covers.'),
      signedBy: str('Name of the person who accepted. Defaults to the quote contact.'),
    },
    ['quote']
  ),
  summarize: (input, result) => result.summary,
  run: async ({ quote: reference, signedBy }) => {
    const quote = resolveQuote(reference);
    if (quote.status === 'Converted') throw invalidInput(`${quote.number} has already been converted to a job.`);
    if (quote.status === 'Accepted') {
      return { summary: `${quote.number} is already marked as accepted.`, quote, changed: false };
    }

    const name = signedBy || quote.contactName || quote.customerName || currentActor().name;
    const signedAt = new Date().toISOString();
    await store.update('quotes', quote.id, {
      status: 'Accepted',
      signedByName: name,
      signedAt,
      signatureData: name,
    });

    store.create('notifications', {
      title: `Quote ${quote.number} Accepted`,
      description: `${name} accepted Quote ${quote.number} ("${quote.title || 'Untitled'}"). Ready for conversion to a job.`,
      type: 'Quote Accepted',
      priority: 'High',
      status: 'Pending',
      quoteId: quote.id,
      link: `/quotes/${quote.id}`,
      createdAt: signedAt,
      createdBy: currentActor().name,
      origin: 'system',
    });

    return {
      summary: `Quote ${quote.number} accepted by ${name} ($${quote.total.toFixed(2)} incl. GST) — ready to convert to a job.`,
      quote: { ...quote, status: 'Accepted', signedByName: name, signedAt },
    };
  },
});

defineAction({
  name: 'decline_quote',
  title: 'Record a quote as declined',
  description: 'Record that the customer turned a quote down, keeping the reason on file.',
  permission: { module: 'Quotes', key: 'edit' },
  inputSchema: objectSchema(
    {
      quote: str('Quote number or a description of the job it covers.'),
      reason: str('Why the customer declined, as they described it.'),
    },
    ['quote']
  ),
  summarize: (input, result) => result.summary,
  run: async ({ quote: reference, reason }) => {
    const quote = resolveQuote(reference);
    if (quote.status === 'Converted') throw invalidInput(`${quote.number} has already been converted to a job.`);
    if (quote.status === 'Declined') {
      return { summary: `${quote.number} is already marked as declined.`, quote, changed: false };
    }

    const changes = { status: 'Declined', declinedAt: new Date().toISOString() };
    if (reason) changes.declineReason = reason;
    await store.update('quotes', quote.id, changes);

    return {
      summary: `Quote ${quote.number} marked as declined${reason ? ` — ${reason}` : ''}.`,
      quote: { ...quote, ...changes },
    };
  },
});

defineAction({
  name: 'convert_quote_to_job',
  title: 'Convert an accepted quote into a job',
  description:
    'Create the live job for an accepted quote. The quote\'s scope becomes the job tasks. Only accepted quotes can be converted, and converting twice returns the job that already exists.',
  permission: { module: 'Quotes', key: 'convert' },
  risky: true,
  inputSchema: objectSchema(
    {
      quote: str('Quote number or a description of the job it covers.'),
      technician: str('Technician to assign the job to. Leave empty to assign it later.'),
    },
    ['quote']
  ),
  summarize: (input, result) => result.summary,
  artifacts: (result) => (result.job ? [{ label: `Job ${result.job.number}`, path: `/jobs/${result.job.id}` }] : []),
  run: async ({ quote: reference, technician }) => {
    const quote = resolveQuote(reference);

    const existing = (store.getAll('jobs') || []).find((job) => job.quoteId === quote.id);
    if (existing) {
      return {
        summary: `${quote.number} is already on job ${existing.number}.`,
        job: existing,
        quote,
        changed: false,
      };
    }

    if (quote.status !== 'Accepted' && quote.status !== 'Approved') {
      throw invalidInput(`${quote.number} is ${quote.status || 'Draft'} — record the customer's acceptance first with accept_quote.`);
    }

    let tech = null;
    if (technician) {
      tech = findTechnician(technician);
      if (!tech) throw notFound('technician', technician);
    }

    const sections = quote.sections || [];
    let laborCost = 0;
    let materialCost = 0;
    sections.forEach((section) => {
      (section.lineItems || []).forEach((item) => {
        if (item.type === 'labor') laborCost += Number(item.total) || 0;
        if (item.type === 'material') materialCost += Number(item.total) || 0;
      });
    });

    const jobTasks = sections.map((section) => ({
      id: store.generateId(),
      name: section.name,
      status: 'Not Started',
      progress: 0,
      startDate: new Date().toISOString(),
      technicians: [],
    }));

    const job = store.create('jobs', {
      number: store.getNextNumber('J-', 'jobs'),
      customerId: quote.customerId,
      customerName: quote.customerName,
      contactName: quote.contactName,
      title: quote.title,
      type: 'Project',
      status: 'Pending',
      priority: 'Medium',
      technicianId: tech ? tech.id : undefined,
      technicianName: tech ? tech.name : undefined,
      quoteId: quote.id,
      tasks: jobTasks,
      phases: jobTasks,
      laborCost: roundCurrency(laborCost),
      materialCost: roundCurrency(materialCost),
      estimatedLaborCost: roundCurrency(laborCost),
      estimatedMaterialCost: roundCurrency(materialCost),
    });

    await store.update('quotes', quote.id, { status: 'Converted' });

    logActivity({
      type: 'job_converted_from_quote',
      text: `Live job ${job.number} created from accepted Quote ${quote.number}.`,
      recordType: 'job',
      recordId: job.id,
      user: 'System Automation',
    });

    store.create('notifications', {
      title: 'New Job Assigned',
      message: `Quote ${quote.number} became live job ${job.number} (${job.title || 'Untitled'}).`,
      description: `Live job ${job.number} (${job.title || 'Untitled'}) created from accepted Quote ${quote.number}.`,
      type: 'Job Assigned',
      priority: 'High',
      status: 'Pending',
      jobId: job.id,
      quoteId: quote.id,
      link: `/jobs/${job.id}`,
      createdAt: new Date().toISOString(),
      createdBy: 'System Automation',
      origin: 'system',
    });

    return {
      summary: `Converted quote ${quote.number} into live job ${job.number} ($${quote.total.toFixed(2)} incl. GST)${tech ? ` for ${tech.name}` : ''}.`,
      job,
      quote: { ...quote, status: 'Converted' },
      artifacts: [{ label: `Job ${job.number}`, path: `/jobs/${job.id}` }],
    };
  },
});
