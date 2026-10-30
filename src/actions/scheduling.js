/**
 * Scheduling — booking a job into the calendar, moving it, and assigning or
 * clearing the technician.
 *
 * The calendar is two records working together:
 *
 *  - a `schedule` allocation (see `ScheduleView.js#scheduleJob`) carrying the
 *    day, the start/finish time and the technician for one visit, and
 *  - the denormalised copy on the job itself (`scheduledDate`, `technicianId`,
 *    `technicianName`, `technicians`) which the job list and job page render.
 *
 * `syncJobWithSchedules` is a faithful port of `ScheduleView.js:224` and is the
 * only thing allowed to write those job fields, so an allocation written here
 * can never disagree with what the calendar derives.
 */

import { store } from '../data/store.js';
import { defineAction } from './registry.js';
import { objectSchema, str, num, bool, enumOf, list, dateish } from './schema.js';
import { invalidInput, notFound } from './errors.js';
import { logActivity } from './context.js';
import { normalizeText } from './resolve.js';
import { parseClock, parseDate } from './dates.js';
import { todayLocalISO, toDateKey } from '../utils/dateUtils.js';
import { resolveCustomer } from './customers.js';
import { findTechnician } from './leads.js';
import { jobLabel, notifyJobAssigned, resolveJob, resolveJobTask, technicianPatch } from './jobs.js';

const DEFAULT_HOURS = 4;
const MINUTES_IN_DAY = 24 * 60;

const pad = (value) => String(value).padStart(2, '0');
const clockText = (minutes) => `${pad(Math.floor(minutes / 60))}:${pad(minutes % 60)}`;

function allocationsOf(jobId) {
  return (store.getAll('schedule') || []).filter((slot) => slot.jobId === jobId);
}

function allocationOrder(slot) {
  if (slot.startTime) {
    const parsed = new Date(slot.startTime).getTime();
    if (!Number.isNaN(parsed)) return parsed;
  }
  if (slot.date && slot.startHour != null) return new Date(`${slot.date}T00:00`).getTime() + slot.startHour * 3600000;
  return 0;
}

function resolveTechnician(query) {
  if (!query) return null;
  const technician = findTechnician(query);
  if (!technician) throw notFound('technician', query);
  return technician;
}

/** Resolve the job named in the input, optionally scoped to a customer. */
function requireJob(input) {
  if (!input.customer) return resolveJob(input.job);
  const { customer } = resolveCustomer(input.customer);
  if (!customer) throw notFound('customer', input.customer);
  return resolveJob(input.job, { customerId: customer.id });
}

/** Start/finish of an allocation in decimal hours from midnight. */
function slotHours(slot) {
  if (slot.startHour != null) return { from: slot.startHour, to: slot.endHour ?? slot.startHour + (slot.hours || 0) };
  if (slot.startTime) {
    const from = new Date(slot.startTime);
    const fromHours = from.getHours() + from.getMinutes() / 60;
    return { from: fromHours, to: fromHours + (slot.hours || 0) };
  }
  return null;
}

/** Other allocations for the same technician that overlap the proposed one. */
function overlapWarnings(technicianId, dateKey, from, to, ignoreJobId) {
  if (!technicianId || from == null || to == null) return [];
  return (store.getAll('schedule') || []).filter((slot) => {
    if (slot.technicianId !== technicianId || slot.jobId === ignoreJobId) return false;
    if ((slot.date || slot.startTime?.split('T')[0]) !== dateKey) return false;
    const span = slotHours(slot);
    return !!span && span.from < to && span.to > from;
  });
}

/**
 * Re-derive the job's scheduling fields from its allocations.
 * Port of `ScheduleView.js#syncJobWithSchedules`; `patch` is merged on top so a
 * caller can change the status in the same write.
 */
export async function syncJobWithSchedules(jobId, patch = {}) {
  const job = store.getById('jobs', jobId);
  if (!job) return null;

  const blocks = allocationsOf(jobId);
  if (!blocks.length) {
    return store.update('jobs', jobId, {
      scheduledDate: null,
      technicianId: null,
      technicianName: '',
      technicians: [],
      ...patch,
    });
  }

  const first = [...blocks].sort((a, b) => allocationOrder(a) - allocationOrder(b))[0];
  const firstDate = first.date || first.startTime?.split('T')[0] || todayLocalISO();

  const byTechnician = {};
  blocks.forEach((slot) => {
    if (!slot.technicianId) return;
    if (!byTechnician[slot.technicianId]) {
      byTechnician[slot.technicianId] = { id: slot.technicianId, name: slot.technicianName || '', hours: 0 };
    }
    byTechnician[slot.technicianId].hours += slot.hours || 0;
  });

  const assigned = Object.values(byTechnician);
  return store.update('jobs', jobId, {
    scheduledDate: firstDate,
    technicianId: first.technicianId || null,
    technicianName: assigned.map((tech) => tech.name).join(', '),
    technicians: assigned,
    ...patch,
  });
}

defineAction({
  name: 'schedule_job',
  title: 'Schedule a job',
  description:
    'Book a job into the calendar on a date, optionally at a start time for a number of hours and to a technician. Creates a calendar allocation and updates the job. Reports when the technician is already booked for that time.',
  permission: { module: 'Jobs', key: 'book_time' },
  inputSchema: objectSchema(
    {
      job: str('Job number, title or id to schedule.'),
      date: dateish('Day to book the job on.'),
      startTime: str('Start time of the visit, e.g. "7:30am" or "13:00". Omit to just put the job on that day.'),
      hours: num(`How long the visit runs, in hours. Defaults to the job estimate, or ${DEFAULT_HOURS}.`),
      technician: str('Technician to assign. Defaults to the technician already on the job.'),
      task: str('Name of the checklist task this visit covers, when it is not the whole job.'),
      customer: str('Narrow the job lookup to this customer when the job name is not enough.'),
    },
    ['job', 'date']
  ),
  summarize: (input, result) =>
    result.allocation.start
      ? `Booked ${result.job.number} on ${result.allocation.date} from ${result.allocation.start}.`
      : `Booked ${result.job.number} on ${result.allocation.date}.`,
  artifacts: (result) => [
    { label: 'Open calendar', path: '/schedule' },
    { label: `Open job ${result.job.number}`, path: `/jobs/${result.job.id}` },
  ],
  async run(input) {
    const job = requireJob(input);
    if (!job) throw notFound('job', input.job);

    const dateKey = parseDate(input.date);
    const clock = input.startTime ? parseClock(input.startTime) : null;
    if (input.startTime && !clock) {
      throw invalidInput(`Could not read "${input.startTime}" as a time. Try "7:30am" or "13:00".`, { input: input.startTime });
    }

    const estimate = Number(job.estimatedHours) > 0 ? Number(job.estimatedHours) : null;
    const hours = Number(input.hours ?? estimate ?? DEFAULT_HOURS);
    const startMinutes = clock ? clock.hours * 60 + clock.minutes : null;
    const endMinutes = startMinutes != null ? startMinutes + Math.round(hours * 60) : null;
    if (endMinutes != null && (endMinutes > MINUTES_IN_DAY || hours <= 0)) {
      throw invalidInput(`${hours} hours from ${clockText(startMinutes)} does not fit in a day.`, { startTime: input.startTime, hours });
    }

    const technician = input.technician ? resolveTechnician(input.technician) : findTechnician(job.technicianId || job.technicianName) || null;
    const task = input.task ? resolveJobTask(job, input.task) : null;

    const conflicts = overlapWarnings(technician?.id, dateKey, startMinutes != null ? startMinutes / 60 : null, endMinutes != null ? endMinutes / 60 : null, job.id);

    const allocation = await store.create('schedule', {
      jobId: job.id,
      jobNumber: job.number,
      technicianId: technician?.id || '',
      technicianName: technician?.name || '',
      date: dateKey,
      startTime: startMinutes != null ? `${dateKey}T${clockText(startMinutes)}` : null,
      finishTime: endMinutes != null ? `${dateKey}T${clockText(endMinutes)}` : null,
      hours,
      taskId: task?.node.id || null,
      taskName: task?.node.name || null,
    });

    const updated = await syncJobWithSchedules(job.id, job.status === 'Pending' ? { status: 'Scheduled' } : {});

    logActivity({
      type: 'job_scheduled',
      text: `${jobLabel(job)} booked for ${dateKey}${startMinutes != null ? ` at ${clockText(startMinutes)}` : ''}${technician ? ` with ${technician.name}` : ''}.`,
      recordType: 'job',
      recordId: job.id,
    });

    if (technician && technician.id !== job.technicianId) await notifyJobAssigned(updated, technician);

    return {
      job: updated,
      allocation: {
        id: allocation.id,
        date: dateKey,
        start: startMinutes != null ? clockText(startMinutes) : null,
        finish: endMinutes != null ? clockText(endMinutes) : null,
        hours,
        task: task ? task.node.name : null,
      },
      technician: technician ? { id: technician.id, name: technician.name } : null,
      conflicts: conflicts.map((slot) => ({
        jobNumber: slot.jobNumber || null,
        date: slot.date || null,
        start: slot.startTime ? slot.startTime.split('T')[1] : null,
        hours: slot.hours || null,
      })),
      statusChanged: job.status === 'Pending',
    };
  },
});

defineAction({
  name: 'reschedule_job',
  title: 'Move a job to another day',
  description:
    'Move an existing booking to a different date, keeping the times of day. Works on a job that was only ever given a day too. Use schedule_job to add an extra visit instead.',
  permission: { module: 'Jobs', key: 'book_time' },
  inputSchema: objectSchema(
    {
      job: str('Job number, title or id to move.'),
      date: dateish('New day for the job.'),
      technician: str('Also move the job to this technician.'),
      customer: str('Narrow the job lookup to this customer when the job name is not enough.'),
    },
    ['job', 'date']
  ),
  summarize: (input, result) =>
    result.movedAllocations
      ? `Moved job ${result.job.number} to ${result.date}.`
      : `Job ${result.job.number} was not booked — set it to ${result.date}.`,
  artifacts: (result) => [{ label: `Open job ${result.job.number}`, path: `/jobs/${result.job.id}` }],
  async run(input) {
    const job = requireJob(input);
    if (!job) throw notFound('job', input.job);

    const dateKey = parseDate(input.date);
    const previous = toDateKey(job.scheduledDate);
    const technician = input.technician ? resolveTechnician(input.technician) : null;
    const blocks = allocationsOf(job.id);

    for (const slot of blocks) {
      const patch = { date: dateKey };
      if (slot.startTime) patch.startTime = `${dateKey}T${slot.startTime.split('T')[1] || '00:00'}`;
      if (slot.finishTime) patch.finishTime = `${dateKey}T${slot.finishTime.split('T')[1] || '00:00'}`;
      if (technician) Object.assign(patch, { technicianId: technician.id, technicianName: technician.name });
      await store.update('schedule', slot.id, patch);
    }

    const statusPatch = !blocks.length && job.status === 'Pending' ? { status: 'Scheduled' } : {};
    const updated = blocks.length
      ? await syncJobWithSchedules(job.id, statusPatch)
      : await store.update('jobs', job.id, { scheduledDate: dateKey, ...statusPatch });

    logActivity({
      type: 'job_rescheduled',
      text: `${jobLabel(job)} moved from ${previous || 'unscheduled'} to ${dateKey}.`,
      recordType: 'job',
      recordId: job.id,
    });

    if (technician && technician.id !== job.technicianId) await notifyJobAssigned(updated, technician);

    return {
      job: updated,
      date: dateKey,
      previousDate: previous,
      movedAllocations: blocks.length,
      technician: technician ? { id: technician.id, name: technician.name } : null,
    };
  },
});

defineAction({
  name: 'assign_job',
  title: 'Assign a technician',
  description:
    'Put a technician on a job without changing the date. Any calendar allocations are updated so the job and the calendar agree.',
  permission: { module: 'Jobs', key: 'edit' },
  inputSchema: objectSchema(
    {
      job: str('Job number, title or id.'),
      technician: str('Technician to assign.'),
      notify: bool('Send the assignment notification. Defaults to true.'),
      customer: str('Narrow the job lookup to this customer when the job name is not enough.'),
    },
    ['job', 'technician']
  ),
  summarize: (input, result) => `Assigned ${result.technician.name} to job ${result.job.number}.`,
  artifacts: (result) => [{ label: `Open job ${result.job.number}`, path: `/jobs/${result.job.id}` }],
  async run(input) {
    const job = requireJob(input);
    if (!job) throw notFound('job', input.job);
    const technician = resolveTechnician(input.technician);
    const previous = job.technicianName || null;

    const blocks = allocationsOf(job.id);
    for (const slot of blocks) {
      await store.update('schedule', slot.id, { technicianId: technician.id, technicianName: technician.name });
    }

    const patch = technicianPatch(technician);
    const updated = blocks.length ? await syncJobWithSchedules(job.id, patch) : await store.update('jobs', job.id, patch);

    logActivity({
      type: 'job_assigned',
      text: `${technician.name} assigned to ${jobLabel(job)}${previous ? ` (was ${previous})` : ''}.`,
      recordType: 'job',
      recordId: job.id,
    });

    if (input.notify !== false && previous !== technician.name) await notifyJobAssigned(updated, technician);

    return { job: updated, technician: { id: technician.id, name: technician.name }, previousTechnician: previous, changed: previous !== technician.name };
  },
});

defineAction({
  name: 'unassign_job',
  title: 'Clear the technician',
  description:
    'Take the technician off a job, leaving the job and any calendar allocations in place but unassigned. Use unschedule_job to remove it from the calendar as well.',
  permission: { module: 'Jobs', key: 'edit' },
  inputSchema: objectSchema({ job: str('Job number, title or id.') }, ['job']),
  summarize: (input, result) => `Cleared ${result.previousTechnician || 'the technician'} from job ${result.job.number}.`,
  artifacts: (result) => [{ label: `Open job ${result.job.number}`, path: `/jobs/${result.job.id}` }],
  async run(input) {
    const job = resolveJob(input.job);
    if (!job) throw notFound('job', input.job);
    const previous = job.technicianName || null;

    const blocks = allocationsOf(job.id);
    for (const slot of blocks) {
      await store.update('schedule', slot.id, { technicianId: '', technicianName: '' });
    }

    const updated = blocks.length
      ? await syncJobWithSchedules(job.id)
      : await store.update('jobs', job.id, { technicianId: null, technicianName: '', technicians: [] });

    logActivity({
      type: 'job_unassigned',
      text: `${previous || 'The technician'} taken off ${jobLabel(job)}.`,
      recordType: 'job',
      recordId: job.id,
    });

    return { job: updated, previousTechnician: previous };
  },
});

defineAction({
  name: 'unschedule_job',
  title: 'Remove a job from the calendar',
  description:
    'Delete every calendar allocation for a job and clear its booked date and technician. The job itself is kept. Use set_job_status to put a job on hold instead.',
  permission: { module: 'Jobs', key: 'book_time' },
  inputSchema: objectSchema({ job: str('Job number, title or id.') }, ['job']),
  summarize: (input, result) =>
    result.removedAllocations
      ? `Removed ${result.job.number} from the calendar (${result.removedAllocations} allocation${result.removedAllocations === 1 ? '' : 's'}).`
      : `Job ${result.job.number} was not on the calendar.`,
  artifacts: (result) => [{ label: `Open job ${result.job.number}`, path: `/jobs/${result.job.id}` }],
  async run(input) {
    const job = resolveJob(input.job);
    if (!job) throw notFound('job', input.job);
    const previous = toDateKey(job.scheduledDate);

    const blocks = allocationsOf(job.id);
    for (const slot of blocks) {
      await store.delete('schedule', slot.id);
    }

    const updated = await syncJobWithSchedules(job.id);

    logActivity({
      type: 'job_unscheduled',
      text: `${jobLabel(job)} removed from the calendar${previous ? ` (was ${previous})` : ''}.`,
      recordType: 'job',
      recordId: job.id,
    });

    return { job: updated, removedAllocations: blocks.length, previousDate: previous };
  },
});

// ── Non-job calendar blocks (leave, blockouts, meetings) ────────────────

const BLOCK_TYPES = ['leave', 'blockout', 'meeting'];

const blockLabel = (row) => [row.type, row.technicianName, row.date, row.notes].filter(Boolean).join(' · ');

function resolveBlock(query, { technician, date, type } = {}) {
  const text = String(query || '').trim();
  let rows = (store.getAll('schedule') || []).filter((row) => row.type);
  if (technician) {
    const person = findTechnician(technician);
    if (!person) throw notFound('technician', technician);
    rows = rows.filter((row) => String(row.technicianId) === String(person.id));
  }
  if (date) rows = rows.filter((row) => row.date === parseDate(date));
  if (type) rows = rows.filter((row) => row.type === type);
  const byId = rows.find((row) => String(row.id) === text);
  if (byId) return byId;
  const matches = rows.filter((row) => normalizeText(blockLabel(row)).includes(normalizeText(text)));
  if (matches.length === 1) return matches[0];
  if (!matches.length) throw notFound('calendar block', query);
  throw invalidInput(`"${query}" matches more than one calendar block: ${matches.slice(0, 5).map(blockLabel).join('; ')}.`);
}

function blockTimes(dateKey, start, finish) {
  const from = String(start || '').match(/^([01]\d|2[0-3]):([0-5]\d)/);
  const to = String(finish || '').match(/^([01]\d|2[0-3]):([0-5]\d)/);
  if (!from || !to) throw invalidInput('Give a start and finish time as HH:MM.');
  const startHour = Number(from[1]) + Number(from[2]) / 60;
  const finishHour = Number(to[1]) + Number(to[2]) / 60;
  const hours = finishHour > startHour ? finishHour - startHour : (24 - startHour) + finishHour;
  return {
    startTime: `${dateKey}T${from[1]}:${from[2]}`,
    finishTime: `${dateKey}T${to[1]}:${to[2]}`,
    startHour,
    endHour: finishHour,
    hours,
  };
}

defineAction({
  name: 'create_schedule_block',
  title: 'Schedule leave, a blockout or a meeting',
  description:
    'Put a non-job block on a technician\'s calendar — annual leave, a site blockout, a toolbox talk or meeting. Leave can span several days. Use schedule_job for actual work.',
  permission: { module: 'Schedule', key: 'edit' },
  inputSchema: objectSchema(
    {
      type: enumOf(BLOCK_TYPES, 'What the block is.'),
      technician: str('Who it applies to.'),
      date: dateish('First day. Defaults to today.'),
      until: dateish('Last day, for leave spanning several days. Defaults to the start date.'),
      start: str('Start time, HH:MM. Defaults to 07:00.'),
      finish: str('Finish time, HH:MM. Defaults to 15:30.'),
      notes: str('What it is, e.g. "Annual leave" or "Toolbox talk".'),
    },
    ['type', 'technician']
  ),
  summarize: (input, result) => result.summary,
  run: async ({ type, technician, date, until, start, finish, notes }) => {
    const person = findTechnician(technician);
    if (!person) throw notFound('technician', technician);
    const from = date ? parseDate(date) : todayLocalISO();
    const to = until ? parseDate(until) : from;
    if (to < from) throw invalidInput('The end date is before the start date.');
    if (type === 'meeting' && !String(notes || '').trim()) throw invalidInput('What is the meeting about? Pass notes.');
    const created = [];
    let cursor = new Date(`${from}T00:00`);
    const last = new Date(`${to}T00:00`);
    while (cursor <= last) {
      const key = toDateKey(cursor);
      const times = blockTimes(key, start || '07:00', finish || '15:30');
      created.push(store.create('schedule', {
        type,
        technicianId: person.id,
        technicianName: person.name,
        date: key,
        ...times,
        notes: notes || '',
      }));
      cursor = new Date(cursor.getTime() + 86400000);
    }
    logActivity({
      type: `schedule_${type}`,
      text: `${type === 'leave' ? 'Leave' : type === 'blockout' ? 'Blockout' : 'Meeting'} booked for ${person.name} ${from}${to === from ? '' : ` to ${to}`}${notes ? ` — ${notes}` : ''}.`,
    });
    return {
      summary: `Booked ${created.length} ${type} day(s) for ${person.name} from ${from}${to === from ? '' : ` to ${to}`}.`,
      blocks: created.map((row) => ({ id: row.id, date: row.date, hours: row.hours, type: row.type })),
    };
  },
});

defineAction({
  name: 'update_schedule_block',
  title: 'Update a calendar block',
  description: 'Move, retime or rename a leave, blockout or meeting entry.',
  permission: { module: 'Schedule', key: 'edit' },
  inputSchema: objectSchema(
    {
      block: str('The entry: its type, technician, date or notes.'),
      technician: str('Narrow to this technician.'),
      date: dateish('Narrow to this day.'),
      type: enumOf(BLOCK_TYPES, 'Narrow to this type.'),
      newDate: dateish('New day.'),
      start: str('New start time, HH:MM.'),
      finish: str('New finish time, HH:MM.'),
      notes: str('New notes.'),
      assign: str('Move it to another technician.'),
    },
    ['block']
  ),
  summarize: (input, result) => result.summary,
  run: async ({ block: reference, technician, date, type, newDate, start, finish, notes, assign }) => {
    const row = resolveBlock(reference, { technician, date, type });
    const patch = {};
    const fields = [];
    if (newDate != null) { patch.date = parseDate(newDate); fields.push('date'); }
    if (notes != null) { patch.notes = notes; fields.push('notes'); }
    if (assign != null) {
      const person = findTechnician(assign);
      if (!person) throw notFound('technician', assign);
      patch.technicianId = person.id;
      patch.technicianName = person.name;
      fields.push('technician');
    }
    if (start != null || finish != null) {
      const times = blockTimes(patch.date || row.date, start || row.startTime?.slice(11, 16) || '07:00', finish || row.finishTime?.slice(11, 16) || '15:30');
      Object.assign(patch, times);
      fields.push('time');
    }
    if (!fields.length) throw invalidInput('Nothing to update — pass at least one new value.');
    await store.update('schedule', row.id, patch);
    logActivity({ type: 'schedule_updated', text: `Calendar ${row.type} for ${patch.technicianName || row.technicianName} updated (${fields.join(', ')}).` });
    return { summary: `Updated the ${row.type} on ${patch.date || row.date} (${fields.join(', ')}).`, block: store.getById('schedule', row.id) };
  },
});

defineAction({
  name: 'delete_schedule_block',
  title: 'Delete a calendar block',
  description: 'Permanently remove a leave, blockout or meeting from the calendar. Job bookings are removed with unschedule_job.',
  permission: { module: 'Schedule', key: 'edit' },
  risky: true,
  inputSchema: objectSchema(
    {
      block: str('The entry: its type, technician, date or notes.'),
      technician: str('Narrow to this technician.'),
      date: dateish('Narrow to this day.'),
      type: enumOf(BLOCK_TYPES, 'Narrow to this type.'),
      reason: str('Why it is being removed.'),
    },
    ['block']
  ),
  summarize: (input, result) => result.summary,
  run: async ({ block: reference, technician, date, type, reason }) => {
    const row = resolveBlock(reference, { technician, date, type });
    await store.delete('schedule', row.id);
    logActivity({ type: 'schedule_deleted', text: `Calendar ${row.type} for ${row.technicianName} on ${row.date} deleted${reason ? ` — ${reason}` : ''}.` });
    return { summary: `Deleted the ${row.type} for ${row.technicianName || 'the technician'} on ${row.date}.`, block: { id: row.id, type: row.type, date: row.date }, reason: reason || null };
  },
});

defineAction({
  name: 'list_schedule_blocks',
  title: 'List calendar blocks',
  description: 'List leave, blockouts and meetings between two dates, optionally for one technician. Job bookings are read with get_schedule.',
  permission: { module: 'Schedule', key: 'view' },
  readOnly: true,
  inputSchema: objectSchema(
    {
      from: dateish('First day. Defaults to today.'),
      to: dateish('Last day. Defaults to the start date.'),
      technician: str('Only this technician.'),
      type: enumOf(BLOCK_TYPES, 'Only this type.'),
    }
  ),
  summarize: (input, result) => `${result.blocks.length} block(s) ${result.from} to ${result.to}.`,
  run: async ({ from, to, technician, type }) => {
    const start = parseDate(from || todayLocalISO());
    const end = parseDate(to || start);
    const person = technician ? findTechnician(technician) : null;
    if (technician && !person) throw notFound('technician', technician);
    const blocks = (store.getAll('schedule') || [])
      .filter((row) => row.type && row.date >= start && row.date <= end)
      .filter((row) => !person || String(row.technicianId) === String(person.id))
      .filter((row) => !type || row.type === type)
      .sort((a, b) => String(a.date).localeCompare(String(b.date)))
      .map((row) => ({ id: row.id, type: row.type, technician: row.technicianName || '', date: row.date, start: row.startTime?.slice(11, 16) || '', finish: row.finishTime?.slice(11, 16) || '', hours: row.hours || 0, notes: row.notes || '' }));
    return { from: start, to: end, blocks };
  },
});

// ── Expected work rosters ───────────────────────────────────────────────

const DAY_NAMES = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

function rosterPattern(weeks, defaultDays) {
  const patterns = Array.isArray(weeks) && weeks.length ? weeks : [defaultDays];
  return patterns.map((days) => {
    const set = new Set((days || []).map((day) => String(day).trim().toLowerCase()));
    const unknown = [...set].filter((day) => !DAY_NAMES.some((name) => name.toLowerCase() === day));
    if (unknown.length) throw invalidInput(`Unknown day(s): ${unknown.join(', ')}. Use ${DAY_NAMES.join(', ')}.`);
    return DAY_NAMES.map((name) => set.has(name.toLowerCase()));
  });
}

function buildRoster(input) {
  const startDate = parseDate(input.startDate);
  const start = new Date(`${startDate}T00:00Z`);
  if (start.getUTCDay() !== 1) throw invalidInput('An expected roster has to start on a Monday.');
  const repeatEveryWeeks = Math.min(Math.max(
    Number(input.repeatEveryWeeks) || (Array.isArray(input.weeks) && input.weeks.length ? input.weeks.length : 1),
    1
  ), 52);
  const weekPatterns = rosterPattern(input.weeks, input.days || ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday']);
  if (weekPatterns.length !== repeatEveryWeeks) {
    throw invalidInput(`Give ${repeatEveryWeeks} week pattern(s), or set repeatEveryWeeks to ${weekPatterns.length}.`);
  }
  if (!weekPatterns.some((week) => week.some(Boolean))) throw invalidInput('Select at least one work day.');
  const defaultStartTime = input.defaultStartTime || '07:00';
  const defaultEndTime = input.defaultEndTime || '15:30';
  const from = Number(defaultStartTime.slice(0, 2)) * 60 + Number(defaultStartTime.slice(3, 5));
  const to = Number(defaultEndTime.slice(0, 2)) * 60 + Number(defaultEndTime.slice(3, 5));
  const shiftHours = ((to - from + 1440) % 1440 || 1440) / 60;
  const weekShiftTimes = weekPatterns.map((week) => week.map((selected) => (selected ? { startTime: defaultStartTime, endTime: defaultEndTime } : null)));
  return {
    name: String(input.name || '').trim(),
    startDate,
    repeatEveryWeeks,
    weekPatterns,
    defaultStartTime,
    defaultEndTime,
    weekShiftTimes,
    shiftHours,
    technicianIds: (input.technicians || []).map((name) => {
      const person = findTechnician(name);
      if (!person) throw notFound('technician', name);
      return person.id;
    }),
  };
}

async function saveRoster(roster, excludeId = null) {
  const { findExpectedRosterConflicts } = await import('../utils/expectedWorkRoster.js');
  const conflicts = findExpectedRosterConflicts(
    store.getAll('expectedWorkRosters') || [],
    roster.technicianIds,
    roster.startDate,
    roster.repeatEveryWeeks,
    roster.weekPatterns,
    excludeId
  );
  if (conflicts.length) {
    const names = new Map((store.getAll('technicians') || []).map((person) => [String(person.id), person.name]));
    const examples = conflicts.slice(0, 3).map((conflict) => `${names.get(String(conflict.technicianId)) || 'Staff'} on ${conflict.date} (${conflict.rosterName})`);
    throw invalidInput(`That roster overlaps another: ${examples.join('; ')}.`);
  }
  return excludeId ? store.update('expectedWorkRosters', excludeId, roster) : store.create('expectedWorkRosters', roster);
}

defineAction({
  name: 'list_expected_rosters',
  title: 'List expected work rosters',
  description: 'List the recurring rostered-hours patterns, who is on each and which weeks they repeat over.',
  permission: { module: 'Schedule', key: 'view' },
  readOnly: true,
  inputSchema: objectSchema({}),
  summarize: (input, result) => `${result.rosters.length} expected roster(s).`,
  run: async () => {
    const names = new Map((store.getAll('technicians') || []).map((person) => [String(person.id), person.name]));
    return {
      rosters: (store.getAll('expectedWorkRosters') || []).map((roster) => ({
        id: roster.id,
        name: roster.name,
        startDate: roster.startDate,
        repeatEveryWeeks: roster.repeatEveryWeeks,
        technicians: (roster.technicianIds || []).map((id) => names.get(String(id)) || id),
        days: (roster.weekPatterns || []).map((week) => DAY_NAMES.filter((_, index) => week[index])),
        defaultStartTime: roster.defaultStartTime,
        defaultEndTime: roster.defaultEndTime,
      })),
    };
  },
});

defineAction({
  name: 'create_expected_roster',
  title: 'Create an expected work roster',
  description:
    'Set the hours a crew is expected to work — who is rostered, from which Monday, on which days, and how many weeks the pattern repeats. This drives "not arrived" and expected-hours reporting.',
  permission: { module: 'Schedule', key: 'edit' },
  inputSchema: objectSchema(
    {
      name: str('Roster name, e.g. "Day shift".'),
      technicians: list(str('A technician name.'), 'Who the roster applies to.'),
      startDate: dateish('First Monday of the pattern.'),
      repeatEveryWeeks: num('How many weeks the pattern repeats over, 1-52. Defaults to 1.'),
      days: list(str('A weekday name.'), 'Work days for a one-week pattern.'),
      weeks: list(list(str('A weekday name.'), 'Work days in this week.'), 'A different set of work days for each week of the cycle.'),
      defaultStartTime: str('Shift start, HH:MM. Defaults to 07:00.'),
      defaultEndTime: str('Shift finish, HH:MM. Defaults to 15:30.'),
    },
    ['name', 'technicians', 'startDate']
  ),
  summarize: (input, result) => result.summary,
  run: async (input) => {
    if (!input.technicians?.length) throw invalidInput('Who is on the roster?');
    const roster = buildRoster(input);
    if (!roster.technicianIds.length) throw invalidInput('Who is on the roster?');
    const saved = await saveRoster(roster);
    logActivity({ type: 'roster_created', text: `Expected roster ${roster.name} created from ${roster.startDate}.` });
    return { summary: `Created expected roster ${roster.name} for ${roster.technicianIds.length} technician(s) from ${roster.startDate}.`, roster: saved };
  },
});

defineAction({
  name: 'update_expected_roster',
  title: 'Update an expected work roster',
  description: 'Change who is on a roster, its start Monday, its work-day pattern or its shift times.',
  permission: { module: 'Schedule', key: 'edit' },
  inputSchema: objectSchema(
    {
      roster: str('Roster name or id.'),
      name: str('New name.'),
      technicians: list(str('A technician name.'), 'Replacement technicians.'),
      startDate: dateish('New first Monday.'),
      repeatEveryWeeks: num('New repeat cycle in weeks.'),
      days: list(str('A weekday name.'), 'Work days.'),
      weeks: list(list(str('A weekday name.'), 'Work days in this week.'), 'Work days for each week.'),
      defaultStartTime: str('Shift start, HH:MM.'),
      defaultEndTime: str('Shift finish, HH:MM.'),
    },
    ['roster']
  ),
  summarize: (input, result) => result.summary,
  run: async (input) => {
    const text = String(input.roster || '').trim().toLowerCase();
    const existing = (store.getAll('expectedWorkRosters') || []).find((roster) =>
      String(roster.id) === String(input.roster) || String(roster.name || '').toLowerCase() === text);
    if (!existing) throw notFound('expected roster', input.roster);
    const merged = {
      name: input.name ?? existing.name,
      technicians: input.technicians ?? (existing.technicianIds || []).map((id) => store.getById('technicians', id)?.name).filter(Boolean),
      startDate: input.startDate ?? existing.startDate,
      repeatEveryWeeks: input.repeatEveryWeeks ?? existing.repeatEveryWeeks,
      weeks: input.weeks ?? (input.days ? undefined : existing.weekPatterns?.map((week) => DAY_NAMES.filter((_, index) => week[index]))),
      days: input.days ?? DAY_NAMES.filter((_, index) => existing.weekPatterns?.[0]?.[index]),
      defaultStartTime: input.defaultStartTime ?? existing.defaultStartTime,
      defaultEndTime: input.defaultEndTime ?? existing.defaultEndTime,
    };
    const roster = buildRoster(merged);
    await saveRoster(roster, existing.id);
    logActivity({ type: 'roster_updated', text: `Expected roster ${roster.name} updated.` });
    return { summary: `Updated expected roster ${roster.name}.`, roster: store.getById('expectedWorkRosters', existing.id) };
  },
});
