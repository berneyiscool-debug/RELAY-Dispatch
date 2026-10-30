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
import { objectSchema, str, num, bool, enumOf, list, objectOf, dateish } from './schema.js';
import { invalidInput, notFound } from './errors.js';
import { logActivity, currentActor } from './context.js';
import { resolveCustomer, customerLabel } from './customers.js';
import { parseDate } from './dates.js';
import { roundCurrency } from '../utils/pricing.js';
import { findTechnician } from './leads.js';
import { mainTaskNode } from './jobs.js';

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
    // A quote with no sections would otherwise convert into a job that cannot
    // take hours, so it converts the same way a hand-built job is created.
    if (!jobTasks.length) jobTasks.push(mainTaskNode());

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

defineAction({
  name: 'send_quote',
  title: 'Send a quote',
  description:
    'Email a quote to the customer — the same email, portal link and PDF as the Send Quote button — and mark it Sent. Check the total first. When email is not set up for this account the quote is only marked Sent, and the reply says that no email went out and why. Pass `resend` to email a quote that has already been sent.',
  permission: { module: 'Quotes', key: 'edit' },
  risky: true,
  inputSchema: objectSchema(
    {
      quote: str('Quote number or a description of the job it covers.'),
      resend: bool('Email it again even though it has already been sent.'),
    },
    ['quote']
  ),
  summarize: (input, result) => result.summary,
  artifacts: (result) => [{ label: result.quote.number, path: `/quotes/${result.quote.id}` }],
  run: async ({ quote: reference, resend }) => {
    const quote = resolveQuote(reference);
    if (['Accepted', 'Declined', 'Converted', 'Archived'].includes(quote.status)) {
      throw invalidInput(`${quote.number} is ${quote.status.toLowerCase()}, so there is nothing to send.`);
    }
    if (quote.status === 'Sent' && !resend) {
      return { summary: `${quote.number} has already been sent. Pass resend to email it again.`, quote, emailed: false };
    }

    // Loaded lazily: the PDF and email modules pull in the browser renderer.
    const { emailUnavailableReason, sendQuoteEmail } = await import('../utils/documentEmails.js');
    const blocked = emailUnavailableReason('quote', quote);
    const to = blocked ? null : await sendQuoteEmail(quote);

    const status = 'Sent';
    await store.update('quotes', quote.id, { status, emailStatus: 'Sent' });
    logActivity({
      type: 'quote_sent',
      text: to ? `Quote ${quote.number} emailed to ${to}.` : `Quote ${quote.number} marked as sent — no email went out (${blocked}).`,
      recordType: 'quote',
      recordId: quote.id,
    });

    return {
      summary: to
        ? `Quote ${quote.number} emailed to ${to} ($${Number(quote.total || 0).toFixed(2)} incl. GST).`
        : `Quote ${quote.number} marked as sent, but NO email went to the customer: ${blocked}`,
      quote: { ...quote, status, emailStatus: 'Sent' },
      emailed: !!to,
      to,
      emailBlockedReason: blocked,
    };
  },
});

defineAction({
  name: 'delete_quote',
  title: 'Delete quote',
  description:
    'Permanently delete a quote. This cannot be undone. Archive a declined quote with update_quote instead when the history matters, and never delete one a job or invoice was raised from.',
  permission: { module: 'Quotes', key: 'delete' },
  risky: true,
  inputSchema: objectSchema(
    {
      quote: str('Quote number or a description of the job it covers.'),
      reason: str('Why the quote is being deleted.'),
    },
    ['quote']
  ),
  summarize: (input, result) => result.summary,
  run: async ({ quote: reference, reason }) => {
    const quote = resolveQuote(reference);
    const jobs = (store.getAll('jobs') || []).filter((job) => job.quoteId === quote.id).length;
    const invoices = (store.getAll('invoices') || []).filter((invoice) => invoice.originalQuoteId === quote.id).length;
    const snapshot = {
      id: quote.id,
      number: quote.number || null,
      title: quote.title || null,
      customerName: quote.customerName || null,
      status: quote.status || null,
      total: quote.total || 0,
    };

    await store.delete('quotes', quote.id);
    await logActivity({
      type: 'quote_deleted',
      text: `Quote ${quoteLabel(quote)} deleted${reason ? ` — ${reason}` : ''}.`,
      recordType: 'quote',
      recordId: quote.id,
    });

    const left = [jobs ? `${jobs} job${jobs === 1 ? '' : 's'}` : '', invoices ? `${invoices} invoice${invoices === 1 ? '' : 's'}` : ''].filter(Boolean).join(', ');
    return {
      summary: `Deleted quote ${snapshot.number || snapshot.title}${left ? `; ${left} left on file` : ''}.`,
      quote: snapshot,
      linked: { jobs, invoices },
      reason: reason || null,
    };
  },
});

const templateLabel = (template) => (template ? template.name || template.id : '');

export function resolveQuoteTemplate(query) {
  return resolveOne('quoteTemplates', query, {
    label: templateLabel,
    searchFields: ['name', 'description'],
    what: 'quote template',
  }).record;
}

defineAction({
  name: 'list_quote_templates',
  title: 'List quote templates',
  description: 'List the saved quote templates — reusable scope and price lines for common work.',
  permission: { module: 'Quotes', key: 'view' },
  readOnly: true,
  inputSchema: objectSchema({}),
  summarize: (input, result) => `${result.templates.length} quote template(s).`,
  run: async () => ({
    templates: (store.getAll('quoteTemplates') || []).map((template) => ({
      id: template.id,
      name: template.name,
      description: template.description || '',
      sections: (template.sections || []).length,
      total: template.total || 0,
    })),
  }),
});

defineAction({
  name: 'create_quote_template',
  title: 'Create a quote template',
  description:
    'Save reusable price lines as a quote template, so a common job can be quoted again in one step. Use the same lines create_quote takes.',
  permission: { module: 'Quotes', key: 'create' },
  inputSchema: objectSchema(
    {
      name: str('Template name, e.g. "Switchboard upgrade — standard".'),
      description: str('When to use it.'),
      items: list(lineItemSchema(), 'The price lines the template starts with.'),
    },
    ['name', 'items']
  ),
  summarize: (input, result) => result.summary,
  run: async ({ name, description, items }) => {
    const sections = buildSections(items);
    const totals = totalsFor(sections);
    const template = store.create('quoteTemplates', {
      name,
      description: description || '',
      sections,
      ...totals,
      createdAt: new Date().toISOString(),
    });
    return {
      summary: `Created quote template "${template.name}" (${items.length} line${items.length === 1 ? '' : 's'}, $${totals.total.toFixed(2)} incl. GST).`,
      template,
    };
  },
  artifacts: (result) => [{ label: result.template.name, path: `/quotes/${result.template.id}?type=template` }],
});

defineAction({
  name: 'update_quote_template',
  title: 'Update a quote template',
  description: 'Rename a quote template, change its description, or replace its price lines.',
  permission: { module: 'Quotes', key: 'edit' },
  inputSchema: objectSchema(
    {
      template: str('Template name or id.'),
      name: str('New name.'),
      description: str('New description.'),
      items: list(lineItemSchema(), 'Replacement price lines. The existing lines are replaced.'),
    },
    ['template']
  ),
  summarize: (input, result) => result.summary,
  run: async ({ template: reference, name, description, items }) => {
    const template = resolveQuoteTemplate(reference);
    const patch = {};
    const fields = [];
    if (name != null) { patch.name = name; fields.push('name'); }
    if (description != null) { patch.description = description; fields.push('description'); }
    if (items != null) {
      const sections = buildSections(items);
      patch.sections = sections;
      Object.assign(patch, totalsFor(sections));
      fields.push('items');
    }
    if (!fields.length) throw invalidInput('Nothing to update — pass at least one new value.');
    await store.update('quoteTemplates', template.id, patch);
    const updated = store.getById('quoteTemplates', template.id);
    return { summary: `Updated quote template "${updated.name}" (${fields.join(', ')}).`, template: updated, fields };
  },
  artifacts: (result) => [{ label: result.template.name, path: `/quotes/${result.template.id}?type=template` }],
});

defineAction({
  name: 'delete_quote_template',
  title: 'Delete a quote template',
  description: 'Permanently delete a saved quote template. Quotes already created from it are not affected.',
  permission: { module: 'Quotes', key: 'delete' },
  risky: true,
  inputSchema: objectSchema(
    {
      template: str('Template name or id.'),
      reason: str('Why the template is being deleted.'),
    },
    ['template']
  ),
  summarize: (input, result) => result.summary,
  run: async ({ template: reference, reason }) => {
    const template = resolveQuoteTemplate(reference);
    const snapshot = { id: template.id, name: template.name, description: template.description || '' };
    await store.delete('quoteTemplates', template.id);
    await logActivity({
      type: 'quote_template_deleted',
      text: `Quote template "${snapshot.name}" deleted${reason ? ` — ${reason}` : ''}.`,
      recordType: 'quote',
      recordId: snapshot.id,
    });
    return { summary: `Deleted quote template "${snapshot.name}".`, template: snapshot, reason: reason || null };
  },
});

defineAction({
  name: 'create_quote_from_template',
  title: 'Create a quote from a template',
  description: 'Start a draft quote for a customer from a saved quote template, copying its sections and prices so they can be adjusted.',
  permission: { module: 'Quotes', key: 'create' },
  inputSchema: objectSchema(
    {
      template: str('Template name or id.'),
      customer: str('Customer name, number or id.'),
      title: str('Quote title. Defaults to the template name.'),
      validUntil: dateish('How long the quote is valid.'),
    },
    ['template', 'customer']
  ),
  summarize: (input, result) => result.summary,
  artifacts: (result) => [{ label: result.quote.number, path: `/quotes/${result.quote.id}` }],
  run: async ({ template: templateRef, customer: customerRef, title, validUntil }) => {
    const template = resolveQuoteTemplate(templateRef);
    const { customer } = resolveCustomer(customerRef, { create: false });
    if (!customer) throw notFound('customer', customerRef);
    const sections = (template.sections || []).map((section) => ({
      ...section,
      id: store.generateId(),
      lineItems: (section.lineItems || []).map((line) => ({ ...line, id: store.generateId() })),
    }));
    const totals = totalsFor(sections);
    const quote = store.create('quotes', {
      number: store.getNextNumber('Q-', 'quotes'),
      customerId: customer.id,
      customerName: customerLabel(customer),
      title: title || template.name,
      status: 'Draft',
      version: 1,
      validUntil: validUntil ? parseDate(validUntil) : null,
      sections,
      ...totals,
      createdAt: new Date().toISOString(),
    });
    logActivity({ type: 'quote_created', text: `Quote ${quote.number} created from template ${template.name} for ${quote.customerName}.`, recordType: 'quote', recordId: quote.id });
    return { summary: `Created quote ${quote.number} from ${template.name} for ${quote.customerName} ($${totals.total.toFixed(2)} incl. GST).`, quote };
  },
});

defineAction({
  name: 'revise_quote',
  title: 'Create a quote revision',
  description:
    'Archive the current quote and start a new draft version of it with the same sections and prices, ready to edit. Use it when a customer wants changes rather than editing an agreed quote in place.',
  permission: { module: 'Quotes', key: 'edit' },
  risky: true,
  inputSchema: objectSchema({ quote: str('Quote number or a description of the job it covers.') }, ['quote']),
  summarize: (input, result) => result.summary,
  artifacts: (result) => [{ label: `${result.quote.number} v${result.quote.version}`, path: `/quotes/${result.quote.id}` }],
  run: async ({ quote: reference }) => {
    const quote = resolveQuote(reference);
    if (quote.status === 'Archived') throw invalidInput(`${quote.number} is already archived.`);
    const copy = JSON.parse(JSON.stringify(quote));
    delete copy.id;
    copy.version = (quote.version || 1) + 1;
    copy.status = 'Draft';
    copy.createdAt = new Date().toISOString();
    copy.emailStatus = null;
    await store.update('quotes', quote.id, { status: 'Archived' });
    const revision = store.create('quotes', copy);
    logActivity({
      type: 'quote_revised',
      text: `Quote ${quote.number} archived and revision v${copy.version} drafted.`,
      recordType: 'quote',
      recordId: revision.id,
    });
    return {
      summary: `Archived ${quote.number} and created revision v${copy.version} as a draft.`,
      quote: revision,
      previous: { id: quote.id, number: quote.number, status: 'Archived' },
    };
  },
});
