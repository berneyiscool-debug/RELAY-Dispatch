/**
 * To-dos — the things the team has to remember that are not jobs.
 *
 * Until now the dashboard's Daily To-Do widget kept a per-user `localStorage`
 * blob, so a to-do could not be assigned, dated or linked to anything. These
 * actions write real records instead, which is what lets brny file one on
 * someone else's behalf: "Add a to-do for Dale to call Louise Petrakis, due
 * Friday 4pm".
 */

import { store } from '../data/store.js';
import { defineAction } from './registry.js';
import { resolveOne } from './resolve.js';
import { objectSchema, str, bool, enumOf } from './schema.js';
import { invalidInput, notFound } from './errors.js';
import { logActivity, currentActor } from './context.js';
import { parseDate, atTimeISO, dateLabel, todayLocalISO } from './dates.js';
import { findTechnician, resolveOwner } from './leads.js';
import { resolveJob } from './jobs.js';
import { resolveCustomer, customerLabel } from './customers.js';

const TODO_STATUSES = ['open', 'done'];
const RECORD_TYPES = ['job', 'customer'];

const assignedName = (todo) => todo.assignedToName || 'Unassigned';

const todoLabel = (todo) => {
  if (!todo) return '';
  const due = todo.dueDate ? ` (due ${dateLabel(todo.dueDate)})` : '';
  return `${todo.title}${due}`;
};

export const todoSearch = {
  label: todoLabel,
  searchFields: ['title', 'notes', 'assignedToName', 'recordLabel'],
  what: 'to-do',
};

/** The to-do a reference like "the Petrakis call" or "the one due Friday" means. */
export function resolveTodo(query) {
  return resolveOne('todos', query, todoSearch).record;
}

/**
 * Split "Friday 4pm" into a date phrase and a clock, because `parseDate` reads
 * dates and `parseClock` reads times but neither reads both.
 */
function parseDue(input, { reference = new Date() } = {}) {
  const raw = String(input ?? '').trim();
  if (!raw) return { dueDate: null, dueAt: null };

  const trailing = raw.match(/^(.*?)[\s,]+(?:at\s+|by\s+)?(\d{1,2}(?::\d{2})?\s*(?:am|pm))$/i);
  const datePhrase = trailing && trailing[1].trim() ? trailing[1].trim() : raw;
  const clock = trailing ? trailing[2].replace(/\s+/g, '') : null;

  const dueDate = parseDate(datePhrase, { reference });
  return {
    dueDate,
    // A bare "Friday" means the start of that working day, which is also
    // `atTimeISO`'s default, so `dueAt` is never null while `dueDate` is set.
    dueAt: atTimeISO(dueDate, clock),
  };
}

/** Link a to-do to a job or a customer, so the record can show a to-do chip. */
function parseRecord({ recordType, record }) {
  if (!recordType && !record) return null;
  if (!recordType) {
    throw invalidInput('Say what the record is — pass recordType "job" or "customer" alongside record.');
  }
  if (!record) {
    throw invalidInput(`recordType "${recordType}" needs a record — pass the job number or customer name.`);
  }
  if (recordType === 'job') {
    const job = resolveJob(record);
    return { recordType: 'job', recordId: job.id, recordLabel: `${job.number} ${job.title || ''}`.trim() };
  }
  const { customer } = resolveCustomer(record, { create: false });
  if (!customer) throw notFound('customer', record);
  return { recordType: 'customer', recordId: customer.id, recordLabel: customerLabel(customer) };
}

defineAction({
  name: 'add_todo',
  title: 'Add a to-do',
  description:
    'File a to-do for someone to action. Assign it to the person it belongs to — defaulting to whoever asked — and give it a due date when they said one ("Friday", "tomorrow 4pm", "next Tuesday"). Link it to a job or customer when it is about a specific record.',
  inputSchema: objectSchema(
    {
      title: str('What needs doing, e.g. "Call Louise Petrakis about the quote".'),
      assign: str('Technician to assign it to, by name. Defaults to whoever asked.'),
      due: str('When it is due, e.g. "Friday", "tomorrow 4pm", "next Tuesday". Omit for someday.'),
      notes: str('Extra detail worth keeping with the to-do.'),
      recordType: enumOf(RECORD_TYPES, 'What the linked record is, if any.'),
      record: str('The job number or customer name the to-do is about.'),
    },
    ['title']
  ),
  summarize: (input, result) => result.summary,
  run: async ({ title, assign, due, notes, recordType, record }, ctx = {}) => {
    const owner = resolveOwner(assign, ctx);
    const { dueDate, dueAt } = parseDue(due);
    const link = parseRecord({ recordType, record });
    const actor = ctx.actor || currentActor();

    const todo = store.create('todos', {
      title,
      notes: notes || '',
      status: 'open',
      assignedTo: owner.id,
      assignedToName: owner.name,
      dueDate,
      dueAt,
      recordType: link ? link.recordType : null,
      recordId: link ? link.recordId : null,
      recordLabel: link ? link.recordLabel : '',
      createdBy: actor.name || actor.id,
      createdByName: actor.name || actor.id,
      origin: ctx.source === 'brny' ? 'brny' : 'ui',
      completedAt: null,
      completedBy: null,
    });

    logActivity({
      type: 'todo',
      text: `Added to-do for ${owner.name}: ${title}${dueDate ? ` (due ${dateLabel(dueDate)})` : ''}`,
      recordType: 'todo',
      recordId: todo.id,
    });

    return {
      summary: `Added to-do for ${owner.name}: ${title}${dueDate ? ` (due ${dateLabel(dueDate)})` : ''}.`,
      todo,
      assignee: owner,
    };
  },
});

defineAction({
  name: 'list_todos',
  title: 'List to-dos',
  description:
    'List open to-dos, overdue ones first. Filter by who they are assigned to, or ask for a single day. Use this before telling the user what is on someone\'s plate.',
  readOnly: true,
  inputSchema: objectSchema({
    assign: str('Only this technician\'s to-dos, by name.'),
    due: str('Only to-dos due on this day, e.g. "today" or "Friday".'),
    includeDone: bool('Include to-dos that are already done. Defaults to open ones only.'),
  }),
  summarize: (input, result) => result.summary,
  run: async ({ assign, due, includeDone }) => {
    const today = todayLocalISO();

    let rows = (store.getAll('todos') || []).filter((todo) => includeDone || todo.status !== 'done');

    if (assign) {
      const owner = findTechnician(assign);
      if (!owner) throw invalidInput(`No technician called "${assign}".`);
      rows = rows.filter((todo) => todo.assignedTo === owner.id);
    }

    if (due) {
      const day = parseDate(due);
      rows = rows.filter((todo) => todo.dueDate === day);
    }

    rows = [...rows].sort((a, b) => {
      const aDay = a.dueDate || '9999-99-99';
      const bDay = b.dueDate || '9999-99-99';
      if (aDay !== bDay) return aDay.localeCompare(bDay);
      return String(a.dueAt || '').localeCompare(String(b.dueAt || ''));
    });

    const overdue = rows.filter((todo) => todo.dueDate && todo.dueDate < today && todo.status !== 'done');

    return {
      summary: rows.length
        ? `${rows.length} to-do${rows.length === 1 ? '' : 's'}${overdue.length ? `, ${overdue.length} overdue` : ''}: ${rows.slice(0, 5).map(todoLabel).join('; ')}.`
        : 'No to-dos match.',
      todos: rows,
      count: rows.length,
      overdueCount: overdue.length,
    };
  },
});

defineAction({
  name: 'complete_todo',
  title: 'Complete a to-do',
  description: 'Mark a to-do as done. Use this once someone has actually done the thing.',
  inputSchema: objectSchema(
    {
      todo: str('The to-do to complete, e.g. "call Louise Petrakis".'),
      note: str('Optional note recorded on the to-do and in the activity log.'),
    },
    ['todo']
  ),
  summarize: (input, result) => result.summary,
  run: async ({ todo: reference, note }, ctx = {}) => {
    const todo = resolveTodo(reference);
    if (todo.status === 'done') {
      return { summary: `"${todo.title}" was already done.`, todo, changed: false };
    }

    const actor = ctx.actor || currentActor();
    const completedBy = actor.name || actor.id;
    store.update('todos', todo.id, {
      status: 'done',
      completedAt: new Date().toISOString(),
      completedBy,
      notes: note ? [todo.notes, note].filter(Boolean).join('\n') : todo.notes || '',
    });

    const updated = store.getById('todos', todo.id) || { ...todo, status: 'done', completedBy };

    logActivity({
      type: 'todo',
      text: `Completed to-do for ${assignedName(updated)}: ${updated.title}`,
      recordType: 'todo',
      recordId: updated.id,
      status: 'done',
    });

    return { summary: `Completed "${updated.title}" for ${assignedName(updated)}.`, todo: updated, changed: true };
  },
});

defineAction({
  name: 'update_todo',
  title: 'Update a to-do',
  description: 'Reassign a to-do, push its due date out, correct its title, or reopen one that was closed by mistake.',
  inputSchema: objectSchema(
    {
      todo: str('The to-do to change.'),
      title: str('Replacement title.'),
      assign: str('Reassign it to this technician, by name.'),
      due: str('New due date, e.g. "Friday 4pm".'),
      notes: str('Replacement notes.'),
      status: enumOf(TODO_STATUSES, 'Set back to open to reopen it, or done to close it.'),
    },
    ['todo']
  ),
  summarize: (input, result) => result.summary,
  run: async ({ todo: reference, title, assign, due, notes, status }, ctx = {}) => {
    const todo = resolveTodo(reference);
    const updates = {};
    const changed = [];

    if (title != null) {
      updates.title = title;
      changed.push('title');
    }
    if (notes != null) {
      updates.notes = notes;
      changed.push('notes');
    }
    if (assign != null) {
      const owner = resolveOwner(assign, ctx);
      updates.assignedTo = owner.id;
      updates.assignedToName = owner.name;
      changed.push('assignedToName');
    }
    if (due != null) {
      const parsed = parseDue(due);
      updates.dueDate = parsed.dueDate;
      updates.dueAt = parsed.dueAt;
      changed.push('dueDate');
    }
    if (status != null) {
      if (status === 'done' && todo.status !== 'done') {
        const actor = ctx.actor || currentActor();
        updates.completedAt = new Date().toISOString();
        updates.completedBy = actor.name || actor.id;
      }
      if (status === 'open') {
        updates.completedAt = null;
        updates.completedBy = null;
      }
      updates.status = status;
      changed.push('status');
    }

    if (!Object.keys(updates).length) throw invalidInput('Nothing to change — pass at least one field.');

    store.update('todos', todo.id, updates);
    const updated = store.getById('todos', todo.id) || { ...todo, ...updates };

    const parts = [];
    if (updates.title) parts.push('title');
    if (updates.assignedToName) parts.push(`assigned to ${updates.assignedToName}`);
    if (updates.dueDate !== undefined) parts.push(updates.dueDate ? `due ${dateLabel(updates.dueDate)}` : 'due date cleared');
    if (updates.status) parts.push(`marked ${updates.status}`);
    if (notes != null) parts.push('notes');

    logActivity({
      type: 'todo',
      text: `Updated to-do for ${assignedName(updated)}: ${updated.title} (${parts.join(', ') || 'amended'})`,
      recordType: 'todo',
      recordId: updated.id,
    });

    return {
      summary: `Updated "${updated.title}"${parts.length ? ` — ${parts.join(', ')}` : ''}.`,
      todo: updated,
      changed,
    };
  },
});

export { TODO_STATUSES, RECORD_TYPES };
