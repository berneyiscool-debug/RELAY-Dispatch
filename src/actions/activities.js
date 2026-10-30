/**
 * The Activity Calendar — calls, follow-ups, site visits and internal tasks that
 * are not jobs.
 *
 * A record is the same `activities` row the calendar writes, with a technician
 * owner and an optional link to a job, customer, quote, invoice or lead.
 */

import { store } from '../data/store.js';
import { defineAction } from './registry.js';
import { objectSchema, str, num, enumOf, dateish } from './schema.js';
import { invalidInput, notFound } from './errors.js';
import { logActivity, currentActor } from './context.js';
import { normalizeText } from './resolve.js';
import { parseDate } from './dates.js';
import { findTechnician } from './leads.js';
import { resolveJob } from './jobs.js';
import { resolveCustomer } from './customers.js';

const ACTIVITY_TYPES = ['call', 'meeting', 'follow-up', 'site-visit', 'email', 'task', 'other'];
const ACTIVITY_PRIORITIES = ['low', 'normal', 'high'];
const ACTIVITY_STATUSES = ['pending', 'completed'];
const LINK_TYPES = ['job', 'customer', 'quote', 'invoice', 'lead'];

const label = (activity) => [activity.title, activity.date, activity.assignedToId].filter(Boolean).join(' · ');

function resolveActivity(query) {
  const text = String(query || '').trim();
  const rows = store.getAll('activities') || [];
  const byId = rows.find((row) => String(row.id) === text);
  if (byId) return byId;
  const exact = rows.filter((row) => normalizeText(row.title) === normalizeText(text));
  if (exact.length === 1) return exact[0];
  const partial = rows.filter((row) => normalizeText(label(row)).includes(normalizeText(text)));
  if (partial.length === 1) return partial[0];
  if (!partial.length) throw notFound('activity', text);
  throw invalidInput(`"${text}" matches more than one activity: ${partial.slice(0, 5).map((row) => `${row.title} (${row.date})`).join('; ')}.`);
}

function ownerFor(query, ctx) {
  const actor = ctx.actor || currentActor();
  if (query) {
    const person = findTechnician(query);
    if (!person) throw invalidInput(`No technician matches "${query}".`);
    return person;
  }
  return store.getById('technicians', actor.id) || { id: actor.id, name: actor.name };
}

function linkedRecord(linkedType, reference) {
  if (!linkedType) return { linkedType: '', linkedId: '', linkedLabel: '' };
  if (!LINK_TYPES.includes(linkedType)) throw invalidInput(`Linked type must be one of ${LINK_TYPES.join(', ')}.`);
  if (!reference) return { linkedType: linkedType, linkedId: '', linkedLabel: '' };
  if (linkedType === 'job') {
    const job = resolveJob(reference);
    return { linkedType, linkedId: job.id, linkedLabel: `Job ${job.number}` };
  }
  if (linkedType === 'customer') {
    const { customer } = resolveCustomer(reference, { create: false });
    if (!customer) throw notFound('customer', reference);
    const name = customer.company || [customer.firstName, customer.lastName].filter(Boolean).join(' ');
    return { linkedType, linkedId: customer.id, linkedLabel: name };
  }
  const collections = { quote: 'quotes', invoice: 'invoices', lead: 'leads' };
  const collection = collections[linkedType];
  const row = (store.getAll(collection) || []).find((record) => String(record.id) === String(reference) || normalizeText(record.number) === normalizeText(reference));
  if (!row) throw notFound(linkedType, reference);
  return { linkedType, linkedId: row.id, linkedLabel: row.number || row.title || row.id };
}

const view = (activity) => ({
  id: activity.id,
  title: activity.title,
  type: activity.type || 'task',
  priority: activity.priority || 'normal',
  date: activity.date,
  time: activity.time || '',
  duration: activity.duration || 0,
  assignedTo: store.getById('technicians', activity.assignedToId)?.name || activity.assignedToId || '',
  linkedType: activity.linkedType || '',
  linkedLabel: activity.linkedLabel || '',
  notes: activity.notes || '',
  status: activity.status || 'pending',
});

defineAction({
  name: 'list_activities',
  title: 'List activities',
  description: 'List calls, follow-ups, site visits and internal tasks on the Activity Calendar, filtered by owner, day or status.',
  permission: { module: 'Schedule', key: 'view' },
  readOnly: true,
  inputSchema: objectSchema({
    assignedTo: str('Only this technician\'s activities.'),
    status: enumOf(ACTIVITY_STATUSES, 'Only this status.'),
    from: dateish('First day. Defaults to today.'),
    to: dateish('Last day. Defaults to the start date.'),
  }),
  summarize: (input, result) => `${result.activities.length} activity(ies) ${result.from} to ${result.to}.`,
  run: async ({ assignedTo, status, from, to }) => {
    const start = parseDate(from || new Date().toISOString().slice(0, 10));
    const end = parseDate(to || start);
    const person = assignedTo ? findTechnician(assignedTo) : null;
    if (assignedTo && !person) throw invalidInput(`No technician matches "${assignedTo}".`);
    const activities = (store.getAll('activities') || [])
      .filter((activity) => activity.date >= start && activity.date <= end)
      .filter((activity) => !person || String(activity.assignedToId) === String(person.id))
      .filter((activity) => !status || (activity.status || 'pending') === status)
      .sort((a, b) => `${a.date}${a.time || ''}`.localeCompare(`${b.date}${b.time || ''}`))
      .map(view);
    return { from: start, to: end, activities };
  },
});

defineAction({
  name: 'create_activity',
  title: 'Create an activity',
  description:
    'Schedule a call, follow-up, site visit, email or internal task for someone on the Activity Calendar, optionally linked to a job, customer, quote, invoice or lead.',
  permission: { module: 'Schedule', key: 'edit' },
  inputSchema: objectSchema(
    {
      title: str('What needs doing.'),
      type: enumOf(ACTIVITY_TYPES, 'Kind of activity. Defaults to task.'),
      priority: enumOf(ACTIVITY_PRIORITIES, 'Defaults to normal.'),
      date: dateish('The day. Defaults to today.'),
      time: str('Start time, HH:MM.'),
      duration: num('Minutes.'),
      assign: str('Technician to own it. Defaults to the person asking.'),
      linkedType: enumOf(LINK_TYPES, 'What it relates to.'),
      linkedRecord: str('The related job number, customer, quote, invoice or lead.'),
      notes: str('Detail to keep with the activity.'),
    },
    ['title']
  ),
  summarize: (input, result) => result.summary,
  run: async (input, ctx) => {
    const owner = ownerFor(input.assign, ctx);
    const link = linkedRecord(input.linkedType, input.linkedRecord);
    const activity = store.create('activities', {
      title: String(input.title).trim(),
      type: input.type || 'task',
      priority: input.priority || 'normal',
      date: parseDate(input.date || new Date().toISOString().slice(0, 10)),
      time: input.time || '',
      duration: Number(input.duration) || 0,
      assignedToId: owner.id,
      ...link,
      notes: input.notes || '',
      status: 'pending',
    });
    logActivity({ type: 'activity_created', text: `Activity "${activity.title}" added for ${owner.name} on ${activity.date}.` });
    return { summary: `Added "${activity.title}" for ${owner.name} on ${activity.date}${activity.time ? ` at ${activity.time}` : ''}.`, activity: view(activity) };
  },
});

defineAction({
  name: 'update_activity',
  title: 'Update an activity',
  description: 'Change an activity\'s title, date, time, owner, priority, notes or status, or re-link it.',
  permission: { module: 'Schedule', key: 'edit' },
  inputSchema: objectSchema(
    {
      activity: str('The activity: its title, or title and date.'),
      title: str('New title.'),
      type: enumOf(ACTIVITY_TYPES, 'New type.'),
      priority: enumOf(ACTIVITY_PRIORITIES, 'New priority.'),
      status: enumOf(ACTIVITY_STATUSES, 'Mark it pending or completed.'),
      date: dateish('New day.'),
      time: str('New start time, HH:MM.'),
      duration: num('New duration in minutes.'),
      assign: str('New owner.'),
      linkedType: enumOf(LINK_TYPES, 'New linked record type.'),
      linkedRecord: str('New linked record.'),
      notes: str('New notes.'),
    },
    ['activity']
  ),
  summarize: (input, result) => result.summary,
  run: async (input, ctx) => {
    const activity = resolveActivity(input.activity);
    const patch = {};
    const fields = [];
    if (input.title != null) { patch.title = String(input.title).trim(); fields.push('title'); }
    if (input.type != null) { patch.type = input.type; fields.push('type'); }
    if (input.priority != null) { patch.priority = input.priority; fields.push('priority'); }
    if (input.status != null) { patch.status = input.status; fields.push('status'); }
    if (input.date != null) { patch.date = parseDate(input.date); fields.push('date'); }
    if (input.time != null) { patch.time = input.time; fields.push('time'); }
    if (input.duration != null) { patch.duration = Number(input.duration) || 0; fields.push('duration'); }
    if (input.assign != null) {
      const owner = ownerFor(input.assign, ctx);
      patch.assignedToId = owner.id;
      fields.push('owner');
    }
    if (input.linkedType != null) {
      Object.assign(patch, linkedRecord(input.linkedType, input.linkedRecord));
      fields.push('link');
    }
    if (input.notes != null) { patch.notes = input.notes; fields.push('notes'); }
    if (!fields.length) throw invalidInput('Nothing to update — pass at least one new value.');
    await store.update('activities', activity.id, patch);
    logActivity({ type: 'activity_updated', text: `Activity "${patch.title || activity.title}" updated (${fields.join(', ')}).` });
    return { summary: `Updated activity "${patch.title || activity.title}" (${fields.join(', ')}).`, activity: view(store.getById('activities', activity.id)) };
  },
});

defineAction({
  name: 'delete_activity',
  title: 'Delete an activity',
  description: 'Permanently delete an activity from the calendar. This cannot be undone.',
  permission: { module: 'Schedule', key: 'edit' },
  risky: true,
  inputSchema: objectSchema(
    {
      activity: str('The activity: its title, or title and date.'),
      reason: str('Why it is being deleted.'),
    },
    ['activity']
  ),
  summarize: (input, result) => result.summary,
  run: async ({ activity: reference, reason }) => {
    const activity = resolveActivity(reference);
    const snapshot = view(activity);
    await store.delete('activities', activity.id);
    logActivity({ type: 'activity_deleted', text: `Activity "${activity.title}" on ${activity.date} deleted${reason ? ` — ${reason}` : ''}.` });
    return { summary: `Deleted activity "${snapshot.title}" on ${snapshot.date}.`, activity: snapshot, reason: reason || null };
  },
});
