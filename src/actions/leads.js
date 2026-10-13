/**
 * Leads — creation, the pipeline, and the conversion into a quote.
 *
 * The stage rules, history entries and owner notifications are the app's own
 * helpers (`src/pages/leads/leadStages.js`), not a second implementation, so a
 * lead moved by brny and one moved by hand leave identical records.
 */

import { store } from '../data/store.js';
import { defineAction } from './registry.js';
import { resolveOne, tryResolveOne } from './resolve.js';
import { objectSchema, str, num, enumOf, dateish } from './schema.js';
import { invalidInput, notFound } from './errors.js';
import { actorStamp, logActivity, currentActor } from './context.js';
import { resolveCustomer, customerLabel } from './customers.js';
import { parseDate } from './dates.js';
import { roundCurrency } from '../utils/pricing.js';
import { LEAD_STAGES, isOpenLead, logLeadStageChange, notifyLeadOwner } from '../pages/leads/leadStages.js';
import { addLeadActivityEntry, buildLeadActivityEntry } from '../pages/leads/leadActivity.js';

const LEAD_SOURCES = ['Website', 'Referral', 'Phone', 'Email', 'Trade Show', 'Google Ads'];
const PRIORITIES = ['Low', 'Medium', 'High'];

const leadLabel = (lead) => (lead ? `${lead.number || lead.id} ${lead.title || ''}`.trim() : '');

export const leadSearch = {
  label: leadLabel,
  searchFields: ['number', 'title', 'customerName', 'contactName', 'phone', 'email', 'description'],
  what: 'lead',
};

/** The lead a reference like "the Ashleigh Turner lead" or "LD-00042" means. */
export function resolveLead(query) {
  return resolveOne('leads', query, leadSearch).record;
}

/** A technician by name, or null when the name is unknown. */
export function findTechnician(query) {
  if (!query) return null;
  return tryResolveOne('technicians', query, {
    label: (tech) => tech.name || tech.email || tech.id,
    searchFields: ['name', 'email', 'role'],
    what: 'technician',
  });
}

/** Resolve an owner, defaulting to whoever asked. Returns {id, name}. */
export function resolveOwner(query, ctx) {
  if (query) {
    const tech = findTechnician(query);
    if (!tech) throw notFound('technician', query);
    return { id: tech.id, name: tech.name || tech.email || tech.id };
  }
  const actor = ctx.actor || currentActor();
  const self = findTechnician(actor.name);
  return { id: self ? self.id : actor.id, name: actor.name };
}

defineAction({
  name: 'create_lead',
  title: 'Add a lead',
  description:
    'Create a new lead in the pipeline. Pass the customer by name; an existing customer is reused, otherwise one is created. Use this for any new enquiry that is not yet a quote.',
  permission: { module: 'Leads', key: 'create' },
  inputSchema: objectSchema(
    {
      title: str('Short description of the work, e.g. "Switchboard upgrade — Cardiff".'),
      customer: str('Customer name. Matched against existing customers first.'),
      contactName: str('On-site contact person.'),
      phone: str('Contact phone number.'),
      email: str('Contact email address.'),
      value: num('Estimated value in dollars, excluding GST.'),
      budget: num('Customer budget in dollars, when stated.'),
      priority: enumOf(PRIORITIES, 'Defaults to Medium.'),
      source: enumOf(LEAD_SOURCES, 'Where the enquiry came from.'),
      description: str('What the customer asked for, in their words.'),
      requirements: str('Scope notes, access details or anything the job must satisfy.'),
      assignedTo: str('Technician or rep who owns it. Defaults to the person asking.'),
      nextActionDate: dateish('Follow-up date, e.g. "tomorrow" or "2026-03-04".'),
    },
    ['title', 'customer']
  ),
  summarize: (input, result) => result.summary,
  run: async (input, ctx) => {
    const { customer, created } = resolveCustomer(input.customer, {
      create: true,
      extra: {
        ...(input.phone ? { phone: input.phone } : {}),
        ...(input.email ? { email: input.email } : {}),
      },
    });
    const owner = resolveOwner(input.assignedTo, ctx);
    const actor = ctx.actor || currentActor();
    const stageHistory = logLeadStageChange({}, '', 'New', `Lead created for ${customerLabel(customer)}.`);

    const lead = store.create('leads', {
      title: input.title,
      customerId: customer.id,
      customerName: customerLabel(customer),
      contactName: input.contactName || undefined,
      phone: input.phone || customer.phone || undefined,
      email: input.email || customer.email || undefined,
      status: 'New',
      source: input.source || undefined,
      value: roundCurrency(input.value || 0),
      budget: roundCurrency(input.budget || 0),
      description: input.description || undefined,
      requirements: input.requirements || undefined,
      priority: input.priority || 'Medium',
      assignedTo: owner.id,
      salesRepName: owner.name,
      nextActionDate: input.nextActionDate ? parseDate(input.nextActionDate) : undefined,
      stageHistory,
      ...actorStamp(ctx),
    });

    const bits = [`Created lead ${lead.number} for ${customerLabel(customer)}`];
    if (lead.value) bits.push(`worth $${lead.value.toFixed(2)}`);
    if (created) bits.push('(new customer record added)');
    bits.push(`owner ${owner.name}, created by ${actor.name}`);

    return {
      summary: `${bits.join(', ')}.`,
      lead,
      customerCreated: created,
      customer: { id: customer.id, name: customerLabel(customer) },
    };
  },
});

defineAction({
  name: 'update_lead',
  title: 'Update a lead',
  description: 'Change lead details such as value, priority, contact or follow-up date. Only pass the fields that change.',
  permission: { module: 'Leads', key: 'edit' },
  inputSchema: objectSchema(
    {
      lead: str('Lead number, title or customer name.'),
      title: str('New title.'),
      contactName: str('New contact person.'),
      phone: str('New phone number.'),
      email: str('New email address.'),
      value: num('New estimated value in dollars.'),
      budget: num('New customer budget in dollars.'),
      priority: enumOf(PRIORITIES, 'New priority.'),
      source: enumOf(LEAD_SOURCES, 'New source.'),
      description: str('New description.'),
      requirements: str('New scope notes.'),
      nextActionDate: dateish('New follow-up date.'),
      assignedTo: str('New owner, by technician name.'),
    },
    ['lead']
  ),
  run: async (input, ctx) => {
    const lead = resolveLead(input.lead);
    const changes = {};
    for (const field of ['title', 'contactName', 'phone', 'email', 'description', 'requirements', 'priority', 'source']) {
      if (input[field] !== undefined) changes[field] = input[field];
    }
    if (input.value !== undefined) changes.value = roundCurrency(input.value);
    if (input.budget !== undefined) changes.budget = roundCurrency(input.budget);
    if (input.nextActionDate !== undefined) changes.nextActionDate = parseDate(input.nextActionDate);
    if (input.assignedTo !== undefined) {
      const owner = resolveOwner(input.assignedTo, ctx);
      changes.assignedTo = owner.id;
      changes.salesRepName = owner.name;
    }
    if (!Object.keys(changes).length) throw invalidInput('Nothing to update — pass at least one field to change.');

    await store.update('leads', lead.id, changes);
    return {
      summary: `Updated ${lead.number || lead.title} (${Object.keys(changes).join(', ')}).`,
      leadId: lead.id,
      changes,
    };
  },
});

defineAction({
  name: 'move_lead_stage',
  title: 'Move a lead stage',
  description: `Move a lead through the pipeline. Stages: ${LEAD_STAGES.join(', ')}. Records the transition in the lead's history and notifies the owner.`,
  permission: { module: 'Leads', key: 'edit' },
  inputSchema: objectSchema(
    {
      lead: str('Lead number, title or customer name.'),
      stage: enumOf(LEAD_STAGES, 'The stage to move to.'),
      note: str('Optional note recorded against the transition.'),
    },
    ['lead', 'stage']
  ),
  run: async ({ lead: reference, stage, note }) => {
    const lead = resolveLead(reference);
    const from = lead.status || 'New';
    if (from === stage) return { summary: `${lead.number || lead.title} is already at ${stage}.`, leadId: lead.id, changed: false };

    // Build history locally rather than assigning onto `lead`: store.update
    // captures the live cache object as its rollback target.
    const stageHistory = logLeadStageChange(lead, from, stage, note);
    const entry = stageHistory[0];

    notifyLeadOwner(lead, {
      title: 'Lead stage updated',
      message: `${lead.title || 'Lead'} moved from ${from} to ${stage}.`,
    });
    await store.update('leads', lead.id, { status: stage, stageHistory });
    logActivity({
      id: entry.id,
      type: 'lead_stage_changed',
      text: entry.text,
      status: stage,
      recordType: 'lead',
      recordId: lead.id,
      user: entry.user,
      timestamp: entry.timestamp,
    });

    return {
      summary: `Moved ${lead.number || lead.title} from ${from} to ${stage}.`,
      leadId: lead.id,
      from,
      to: stage,
      isOpen: isOpenLead({ ...lead, status: stage }),
    };
  },
});

defineAction({
  name: 'log_lead_activity',
  title: 'Note on a lead',
  description: 'Post a note to a lead\'s activity feed — a phone call, a site visit, anything the team should see.',
  permission: { module: 'Leads', key: 'edit' },
  inputSchema: objectSchema({ lead: str('Lead number, title or customer name.'), note: str('What happened.') }, ['lead', 'note']),
  run: async ({ lead: reference, note }, ctx) => {
    const lead = resolveLead(reference);
    const entry = buildLeadActivityEntry({ content: note, author: (ctx.actor || currentActor()).name });
    const activityLog = addLeadActivityEntry(lead.activityLog, entry);
    await store.update('leads', lead.id, { activityLog });
    return { summary: `Noted on ${lead.number || lead.title}: ${note}`, leadId: lead.id, entryId: entry.id };
  },
});

defineAction({
  name: 'convert_lead_to_quote',
  title: 'Convert lead to quote',
  description:
    'Create a draft quote from a won lead and mark the lead Won. The quote starts as a single "Main Scope" line at the lead value. Use after the customer has accepted the work.',
  permission: [{ module: 'Leads', key: 'convert' }, { module: 'Quotes', key: 'create' }],
  inputSchema: objectSchema({ lead: str('Lead number, title or customer name.') }, ['lead']),
  artifacts: (result) => [{ type: 'quote', id: result.quote.id, label: `Quote ${result.quote.number}`, path: `/quotes/${result.quote.id}` }],
  run: async ({ lead: reference }) => {
    const lead = resolveLead(reference);
    const value = lead.value || 0;
    const taxRate = store.getTaxRate();

    const quote = store.create('quotes', {
      number: store.getNextNumber('Q-', 'quotes'),
      customerId: lead.customerId,
      customerName: lead.customerName,
      contactName: lead.contactName,
      title: lead.title,
      status: 'Draft',
      sections: [
        {
          id: store.generateId(),
          name: 'Main Scope',
          lineItems: [
            { description: `${lead.title} - Scope of Work`, type: 'labor', qty: 1, rate: value, total: value },
          ],
        },
      ],
      subtotal: value,
      tax: roundCurrency(value * taxRate),
      total: roundCurrency(value * (1 + taxRate)),
      leadId: lead.id,
      createdAt: new Date().toISOString(),
    });

    const stageHistory = logLeadStageChange(lead, lead.status || 'New', 'Won', `Converted to Quote ${quote.number} (Status: Won).`);
    await store.update('leads', lead.id, { status: 'Won', stageHistory });
    notifyLeadOwner(lead, {
      title: 'Lead converted',
      message: `${lead.title || 'Lead'} was converted to quote ${quote.number}.`,
    });

    return {
      summary: `Converted ${lead.number || lead.title} to draft quote ${quote.number} ($${quote.total.toFixed(2)} incl. GST).`,
      quote,
      leadId: lead.id,
    };
  },
});
