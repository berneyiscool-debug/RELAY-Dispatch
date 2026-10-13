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
import { objectSchema, str, num, bool, dateish } from './schema.js';
import { invalidInput, notFound } from './errors.js';
import { logActivity } from './context.js';
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
