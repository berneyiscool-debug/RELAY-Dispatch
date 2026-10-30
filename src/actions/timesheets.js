/**
 * Timesheet sign-off — approving and rejecting clocked hours.
 *
 * What gets approved is a clock session (`timeClocks`), not a job-hours entry:
 * job hours are a record of what was booked to a job and carry no approval
 * state of their own. Sessions are stamped exactly the way the Hours grid in
 * `ClockHistory.js` stamps them, so the pay run cannot tell brny's sign-off
 * from a manager's.
 */

import { store } from '../data/store.js';
import { defineAction } from './registry.js';
import { objectSchema, str, enumOf, dateish, bool } from './schema.js';
import { invalidInput } from './errors.js';
import { assertPermission, logActivity, currentActor } from './context.js';
import { resolveOne } from './resolve.js';
import { parseDate, toDateKey } from './dates.js';
import { findTechnician } from './leads.js';
import { resolveJob, resolveJobTask } from './jobs.js';
import { resolveCustomer } from './customers.js';
import { actorName, measuredHours, payableHours, round2 } from '../utils/hoursMath.js';
import { toCsv } from '../utils/reportMetrics.js';
import { clockIn as openClock, clockOut as closeClock, getActiveClock } from '../utils/timeClock.js';

const APPROVAL_STATES = ['pending', 'approved', 'adjusted', 'rejected'];

const stateOf = (session) => session.approvalStatus || 'pending';
const dayOf = (session) => toDateKey(session.clockInAt);

/** Monday of the week before this one — the default pay period to review. */
function lastWeekRange() {
  const today = new Date();
  const monday = new Date(today.getFullYear(), today.getMonth(), today.getDate() - ((today.getDay() + 6) % 7) - 7);
  const sunday = new Date(monday.getFullYear(), monday.getMonth(), monday.getDate() + 6);
  return { from: toDateKey(monday), to: toDateKey(sunday) };
}

/** Sessions in a date range, for one technician or everyone. */
function selectSessions(input) {
  const fallback = lastWeekRange();
  const from = input.from ? parseDate(input.from) : fallback.from;
  const to = input.to ? parseDate(input.to) : (input.from ? from : fallback.to);
  if (to < from) throw invalidInput('The range ends before it starts.');
  const technician = input.technician ? findTechnician(input.technician) : null;

  const sessions = (store.getAll('timeClocks') || []).filter((session) => {
    const day = dayOf(session);
    if (!day || day < from || day > to) return false;
    return !technician || String(session.technicianId) === String(technician.id);
  });
  return { sessions, from, to, technician };
}

function sessionRow(session, now) {
  return {
    id: session.id,
    technician: session.technicianName || '',
    day: dayOf(session),
    clockIn: session.clockInAt,
    clockOut: session.clockOutAt || null,
    measuredHours: measuredHours(session, now),
    payableHours: round2(payableHours(session, now)),
    approval: stateOf(session),
    note: session.note || undefined,
  };
}

const rangeInput = {
  technician: str('Only this technician\'s hours. Leave out for everyone.'),
  from: dateish('First day of the period. Defaults to Monday of last week.'),
  to: dateish('Last day of the period. Defaults to `from`, or to Sunday of last week when neither is given.'),
};

defineAction({
  name: 'review_timesheets',
  title: 'Review timesheets',
  description: 'List clocked sessions for a period with their hours and sign-off state (pending, approved, adjusted, rejected), and the totals per technician. Use before approving, and for "who hasn\'t been signed off?" or "how many hours did Sam do last week?".',
  permission: { module: 'Timesheets', key: 'view' },
  readOnly: true,
  inputSchema: objectSchema({
    ...rangeInput,
    approval: enumOf(APPROVAL_STATES, 'Only sessions in this state.'),
  }),
  summarize: (input, result) => `${result.sessions.length} session(s) ${result.from} to ${result.to}, ${result.pending} awaiting sign-off.`,
  run: async (input) => {
    const now = new Date();
    const { sessions, from, to } = selectSessions(input);
    const rows = sessions
      .filter((session) => !input.approval || stateOf(session) === input.approval)
      .map((session) => sessionRow(session, now))
      .sort((a, b) => (a.technician.localeCompare(b.technician) || String(a.clockIn).localeCompare(String(b.clockIn))));

    const byTechnician = {};
    rows.forEach((row) => {
      const total = byTechnician[row.technician] || { technician: row.technician, payableHours: 0, pending: 0 };
      total.payableHours = round2(total.payableHours + row.payableHours);
      if (row.approval === 'pending') total.pending++;
      byTechnician[row.technician] = total;
    });

    return {
      from,
      to,
      sessions: rows,
      totals: Object.values(byTechnician),
      pending: rows.filter((row) => row.approval === 'pending').length,
      stillClockedIn: rows.filter((row) => !row.clockOut).length,
    };
  },
});

defineAction({
  name: 'approve_timesheets',
  title: 'Approve timesheets',
  description:
    'Sign off clocked hours for a period, for one technician or everyone, so they count toward pay. Hours someone has already approved or corrected are left alone, a correction a technician recorded on an undecided session becomes the approved figure, and sessions still clocked in are skipped. Review with review_timesheets first.',
  permission: { module: 'Timesheets', key: 'approve' },
  inputSchema: objectSchema(rangeInput),
  summarize: (input, result) => result.summary,
  run: async (input) => {
    const now = new Date();
    const { sessions, from, to } = selectSessions(input);
    const stamp = { approvedBy: actorName(currentActor()), approvedAt: now.toISOString() };
    const approved = [];
    let signedOff = 0;
    let open = 0;

    for (const session of sessions) {
      const status = stateOf(session);
      if (status === 'approved' || status === 'adjusted') { signedOff++; continue; }
      if (!session.clockOutAt) { open++; continue; }
      // Same rule as the Hours grid: a rejection is not a figure to carry, so
      // approving it measures afresh; any other recorded figure is carried.
      const carried = status === 'rejected' || session.approvedHours == null ? null : Number(session.approvedHours);
      const approvedHours = carried == null ? measuredHours(session, now) : carried;
      await store.update('timeClocks', session.id, {
        ...stamp,
        approvalStatus: carried == null ? 'approved' : 'adjusted',
        approvedHours,
      });
      approved.push({ id: session.id, technician: session.technicianName || '', day: dayOf(session), hours: approvedHours });
    }

    const hours = round2(approved.reduce((sum, row) => sum + row.hours, 0));
    if (approved.length) {
      logActivity({ type: 'timesheets_approved', text: `Approved ${approved.length} clock session(s), ${hours}h, ${from} to ${to}.` });
    }

    const extras = [signedOff && `${signedOff} already signed off`, open && `${open} still clocked in`].filter(Boolean).join(', ');
    return {
      summary: approved.length
        ? `Approved ${approved.length} session(s), ${hours}h, ${from} to ${to}${extras ? ` (${extras})` : ''}.`
        : `Nothing to approve ${from} to ${to}${extras ? ` — ${extras}` : ''}.`,
      from,
      to,
      approved,
      hours,
      alreadySignedOff: signedOff,
      stillClockedIn: open,
    };
  },
});

defineAction({
  name: 'reject_timesheets',
  title: 'Reject timesheet hours',
  description:
    'Reject clocked hours so they are not paid — one session by id, or every session for a technician on a day or period. A reason is required; it is written on every session so the technician sees why.',
  permission: { module: 'Timesheets', key: 'approve' },
  risky: true,
  inputSchema: objectSchema(
    {
      ...rangeInput,
      session: str('A single session id from review_timesheets, instead of a whole period.'),
      reason: str('Why these hours should not be paid.'),
    },
    ['reason']
  ),
  summarize: (input, result) => result.summary,
  run: async (input) => {
    if (!String(input.reason || '').trim()) throw invalidInput('A reason is required to reject hours.');
    const now = new Date();
    let sessions;
    if (input.session) {
      const session = store.getById('timeClocks', input.session);
      if (!session) throw invalidInput(`No clock session has the id "${input.session}".`);
      sessions = [session];
    } else {
      if (!input.technician) throw invalidInput('Name the technician, or pass a single session id.');
      sessions = selectSessions(input).sessions;
    }
    sessions = sessions.filter((session) => stateOf(session) !== 'rejected');
    if (!sessions.length) return { summary: 'Nothing to reject — no recorded hours that are not already rejected.', rejected: [] };

    const given = round2(sessions.reduce((sum, session) => sum + payableHours(session, now), 0));
    const stamp = { note: input.reason.trim(), approvedBy: actorName(currentActor()), approvedAt: now.toISOString() };
    for (const session of sessions) {
      await store.update('timeClocks', session.id, { ...stamp, approvalStatus: 'rejected', approvedHours: 0 });
    }
    logActivity({ type: 'timesheets_rejected', text: `Rejected ${sessions.length} clock session(s), ${given}h — ${input.reason.trim()}` });

    return {
      summary: `Rejected ${sessions.length} session(s), ${given}h no longer paid.`,
      rejected: sessions.map((session) => ({ id: session.id, technician: session.technicianName || '', day: dayOf(session) })),
      hoursRemoved: given,
    };
  },
});

// ── Logged time on a job (the Timesheets page rows) ─────────────────────

const timesheetLabel = (row) => [row.technicianName, row.date, row.jobNumber, row.taskName].filter(Boolean).join(' · ') || row.id;

function resolveTimesheet(query, { job, technician, date } = {}) {
  let jobId = null;
  if (job) jobId = resolveJob(job).id;
  const tech = technician ? findTechnician(technician) : null;
  if (technician && !tech) throw invalidInput(`No technician matches "${technician}".`);
  const day = date ? parseDate(date) : null;
  const filter = (row) =>
    (!jobId || row.jobId === jobId)
    && (!tech || String(row.technicianId) === String(tech.id))
    && (!day || row.date === day);
  return resolveOne('timesheets', query, {
    label: timesheetLabel,
    searchFields: ['jobNumber', 'taskName', 'technicianName', 'date', 'description'],
    what: 'timesheet entry',
    filter,
  }).record;
}

function parseDateTime(value, field) {
  const date = value ? new Date(value) : null;
  if (!date || Number.isNaN(date.getTime())) throw invalidInput(`${field} must be a date and time, e.g. 2026-03-04T07:30.`);
  return date;
}

const roundHours = (hours) => Math.round(hours * 100) / 100;

defineAction({
  name: 'log_timesheet',
  title: 'Log time on a job',
  description:
    'Add a booked time entry to a job — who worked, on which task, from when to when — as the Log Time button on the Timesheets page does. Use log_time instead when the user is recording job hours rather than a shift on the timesheet.',
  permission: { module: 'Timesheets', key: 'create' },
  inputSchema: objectSchema(
    {
      job: str('Job number, title, customer or id.'),
      customer: str('Customer, to narrow the job down when the name is not unique.'),
      task: str('The job task the hours belong to.'),
      technician: str('Who did the work. Defaults to the person asking.'),
      start: str('Start date and time, e.g. 2026-03-04T07:30.', { examples: ['2026-03-04T07:30'] }),
      finish: str('Finish date and time.', { examples: ['2026-03-04T15:30'] }),
      description: str('What was done.'),
    },
    ['job', 'task', 'start', 'finish']
  ),
  summarize: (input, result) => result.summary,
  artifacts: (result) => [{ label: `Job ${result.timesheet.jobNumber}`, path: `/jobs/${result.timesheet.jobId}` }],
  run: async (input) => {
    const customerId = input.customer ? resolveCustomer(input.customer, { create: false }).customer?.id : null;
    const job = resolveJob(input.job, { customerId });
    const entry = resolveJobTask({ tasks: job.tasks || [] }, input.task);
    const actor = currentActor();
    const technician = input.technician ? findTechnician(input.technician) : null;
    if (input.technician && !technician) throw invalidInput(`No technician matches "${input.technician}".`);
    const who = technician || { id: actor.id, name: actor.name };
    const start = parseDateTime(input.start, 'start');
    const finish = parseDateTime(input.finish, 'finish');
    if (finish <= start) throw invalidInput('Finish must be after start.');

    const hours = roundHours((finish - start) / 3600000);
    const timesheet = store.create('timesheets', {
      jobId: job.id,
      jobNumber: job.number,
      taskId: entry.node.id,
      taskName: entry.node.name,
      technicianId: who.id,
      technicianName: who.name,
      date: toDateKey(start),
      startTime: input.start,
      finishTime: input.finish,
      hours,
      description: input.description || '',
    });
    logActivity({
      type: 'timesheet_logged',
      text: `${hours}h logged on ${job.number} by ${who.name}${entry.node ? ` (${entry.node.name})` : ''}.`,
      recordType: 'timesheet',
      recordId: timesheet.id,
    });
    return { summary: `Logged ${hours}h for ${who.name} on ${job.number} (${entry.node.name}).`, timesheet };
  },
});

defineAction({
  name: 'update_timesheet',
  title: 'Update a timesheet entry',
  description: 'Correct a logged time entry — its start, finish or description. Hours are recalculated when the times change.',
  permission: { module: 'Timesheets', key: 'edit_all' },
  inputSchema: objectSchema(
    {
      timesheet: str('The entry: its technician, job number, task or date.'),
      job: str('Narrow to this job.'),
      technician: str('Narrow to this technician.'),
      date: dateish('Narrow to this day.'),
      start: str('New start date and time.'),
      finish: str('New finish date and time.'),
      description: str('New description.'),
    },
    ['timesheet']
  ),
  summarize: (input, result) => result.summary,
  run: async (input) => {
    const row = resolveTimesheet(input.timesheet, { job: input.job, technician: input.technician, date: input.date });
    const patch = {};
    if (input.description != null) patch.description = input.description;
    if (input.start != null) patch.startTime = input.start;
    if (input.finish != null) patch.finishTime = input.finish;
    if (!Object.keys(patch).length) throw invalidInput('Nothing to update — pass at least one new value.');

    const start = parseDateTime(patch.startTime ?? row.startTime, 'start');
    const finish = parseDateTime(patch.finishTime ?? row.finishTime, 'finish');
    if (finish <= start) throw invalidInput('Finish must be after start.');
    patch.startTime = patch.startTime ?? row.startTime;
    patch.finishTime = patch.finishTime ?? row.finishTime;
    patch.hours = roundHours((finish - start) / 3600000);
    patch.date = toDateKey(start);

    await store.update('timesheets', row.id, patch);
    logActivity({
      type: 'timesheet_updated',
      text: `Timesheet entry for ${row.technicianName} on ${row.jobNumber} updated.`,
      recordType: 'timesheet',
      recordId: row.id,
    });
    const updated = store.getById('timesheets', row.id);
    return { summary: `Updated ${updated.technicianName || 'the entry'} on ${updated.jobNumber || 'the job'} — ${updated.hours}h.`, timesheet: updated, fields: Object.keys(patch) };
  },
});

defineAction({
  name: 'delete_timesheet',
  title: 'Delete a timesheet entry',
  description: 'Permanently delete a logged time entry. This cannot be undone.',
  permission: { module: 'Timesheets', key: 'edit_all' },
  risky: true,
  inputSchema: objectSchema(
    {
      timesheet: str('The entry: its technician, job number, task or date.'),
      job: str('Narrow to this job.'),
      technician: str('Narrow to this technician.'),
      date: dateish('Narrow to this day.'),
      reason: str('Why the entry is being deleted.'),
    },
    ['timesheet']
  ),
  summarize: (input, result) => result.summary,
  run: async (input) => {
    const row = resolveTimesheet(input.timesheet, { job: input.job, technician: input.technician, date: input.date });
    const snapshot = { id: row.id, technician: row.technicianName || null, jobNumber: row.jobNumber || null, taskName: row.taskName || null, date: row.date || null, hours: row.hours || 0 };
    await store.delete('timesheets', row.id);
    logActivity({
      type: 'timesheet_deleted',
      text: `Timesheet entry ${snapshot.technician || ''} ${snapshot.jobNumber || ''} (${snapshot.hours}h) deleted${input.reason ? ` — ${input.reason}` : ''}.`,
      recordType: 'timesheet',
      recordId: snapshot.id,
    });
    return { summary: `Deleted ${snapshot.hours}h logged by ${snapshot.technician || 'a technician'} on ${snapshot.jobNumber || 'a job'}.`, timesheet: snapshot, reason: input.reason || null };
  },
});

// ── Clock in / clock out ────────────────────────────────────────────────

const clockView = (session) => ({
  id: session.id,
  technician: session.technicianName || '',
  day: toDateKey(session.clockInAt),
  clockIn: session.clockInAt,
  clockOut: session.clockOutAt || null,
  hours: session.clockOutAt ? round2(measuredHours(session, new Date())) : null,
  approval: session.approvalStatus || 'pending',
  note: session.note || '',
});

function resolveClockSession(query, { technician, date } = {}) {
  const text = String(query || '').trim();
  const person = technician ? findTechnician(technician) : null;
  if (technician && !person) throw invalidInput(`No technician matches "${technician}".`);
  const day = date ? parseDate(date) : null;
  const rows = (store.getAll('timeClocks') || []).filter((session) => {
    if (person && String(session.technicianId) !== String(person.id)) return false;
    if (day && toDateKey(session.clockInAt) !== day) return false;
    return true;
  });
  const byId = rows.find((session) => String(session.id) === text);
  if (byId) return byId;
  const label = (session) => [session.technicianName, toDateKey(session.clockInAt), session.note].filter(Boolean).join(' · ');
  const matches = rows.filter((session) => label(session).toLowerCase().includes(text.toLowerCase()));
  if (matches.length === 1) return matches[0];
  if (!matches.length) throw invalidInput(`No clock session matches "${query}".`);
  throw invalidInput(`"${query}" matches more than one clock session: ${matches.slice(0, 5).map(label).join('; ')}.`);
}

function staffForSelfOr(ctx, query) {
  const actor = ctx.actor || currentActor();
  if (!query) {
    const person = store.getById('technicians', actor.id) || { id: actor.id, name: actor.name };
    return person;
  }
  const person = findTechnician(query);
  if (!person) throw invalidInput(`No technician matches "${query}".`);
  if (String(person.id) !== String(actor.id)) assertPermission({ module: 'Timesheets', key: 'edit_all' }, ctx);
  return person;
}

defineAction({
  name: 'clock_in',
  title: 'Clock in',
  description: 'Start a clock session for the signed-in user. Someone with timesheet approval rights can clock another person in by naming them.',
  inputSchema: objectSchema({
    technician: str('Clock this person in instead of yourself. Needs timesheet approval rights.'),
  }),
  summarize: (input, result) => result.summary,
  run: async ({ technician }, ctx) => {
    const person = staffForSelfOr(ctx, technician);
    const active = getActiveClock(person.id);
    if (active) return { summary: `${person.name} is already clocked in since ${new Date(active.clockInAt).toLocaleTimeString('en-AU', { hour: '2-digit', minute: '2-digit' })}.`, session: clockView(active), changed: false };
    const { record } = await openClock(person);
    logActivity({ type: 'clock_in', text: `${person.name} clocked in.` });
    return { summary: `${person.name} clocked in at ${new Date(record.clockInAt).toLocaleTimeString('en-AU', { hour: '2-digit', minute: '2-digit' })}.`, session: clockView(record), changed: true };
  },
});

defineAction({
  name: 'clock_out',
  title: 'Clock out',
  description: 'End the signed-in user\'s open clock session. Pass `break: true` for a break — the session is marked as a break so the app can tell it apart from going home.',
  inputSchema: objectSchema({
    technician: str('Clock this person out instead of yourself. Needs timesheet approval rights.'),
    break: bool('End the session for a break rather than the end of the shift.'),
  }),
  summarize: (input, result) => result.summary,
  run: async ({ technician, break: isBreak }, ctx) => {
    const person = staffForSelfOr(ctx, technician);
    const active = getActiveClock(person.id);
    if (!active) throw invalidInput(`${person.name} is not clocked in.`);
    const { record } = await closeClock(active.id, { break: !!isBreak });
    logActivity({ type: 'clock_out', text: `${person.name} clocked ${isBreak ? 'out for a break' : 'out'}.` });
    return { summary: `${person.name} clocked ${isBreak ? 'out for a break' : 'out'}.`, session: clockView(record), changed: true };
  },
});

defineAction({
  name: 'add_clock_session',
  title: 'Add a clock session',
  description: 'Record worked hours for a technician when they forgot to clock on — a correction for a past day, left pending approval.',
  permission: { module: 'Timesheets', key: 'edit_all' },
  inputSchema: objectSchema(
    {
      technician: str('Who worked.'),
      date: dateish('The day. Defaults to today.'),
      start: str('Start time, HH:MM. Defaults to 07:00.'),
      finish: str('Finish time, HH:MM. Defaults to 15:30.'),
      note: str('Why the session is being added.'),
    },
    ['technician']
  ),
  summarize: (input, result) => result.summary,
  run: async ({ technician, date, start, finish, note }) => {
    const person = findTechnician(technician);
    if (!person) throw invalidInput(`No technician matches "${technician}".`);
    const day = parseDate(date || toDateKey(new Date().toISOString()));
    const from = String(start || '07:00');
    const to = String(finish || '15:30');
    if (!/^([01]\d|2[0-3]):[0-5]\d$/.test(from) || !/^([01]\d|2[0-3]):[0-5]\d$/.test(to)) throw invalidInput('Times must be HH:MM.');
    if (to <= from) throw invalidInput('Finish must be after start.');
    const session = store.create('timeClocks', {
      technicianId: person.id,
      technicianName: person.name,
      clockInAt: `${day}T${from}`,
      clockOutAt: `${day}T${to}`,
      clockInLocation: null,
      clockOutLocation: null,
      status: 'out',
      approvalStatus: 'pending',
      note: note || 'Added manually',
    });
    logActivity({ type: 'clock_added', text: `Clock session added for ${person.name} on ${day} (${from}–${to}).` });
    return { summary: `Added ${person.name}'s ${from}–${to} session on ${day}; it is waiting for approval.`, session: clockView(session) };
  },
});

defineAction({
  name: 'update_clock_session',
  title: 'Update a clock session',
  description: 'Correct a clock session\'s start, finish or note. Changing the times clears any earlier approval so the corrected hours are signed off again.',
  permission: { module: 'Timesheets', key: 'edit_all' },
  inputSchema: objectSchema(
    {
      session: str('The session: its id, technician and day, or note.'),
      technician: str('Narrow to this technician.'),
      date: dateish('Narrow to this day.'),
      start: str('New clock-in time, HH:MM.'),
      finish: str('New clock-out time, HH:MM.'),
      note: str('New note.'),
    },
    ['session']
  ),
  summarize: (input, result) => result.summary,
  run: async ({ session: reference, technician, date, start, finish, note }) => {
    const session = resolveClockSession(reference, { technician, date });
    const patch = {};
    const fields = [];
    const day = toDateKey(session.clockInAt);
    if (start != null) { patch.clockInAt = `${day}T${start}`; fields.push('start'); }
    if (finish != null) { patch.clockOutAt = `${day}T${finish}`; fields.push('finish'); }
    if (note != null) { patch.note = note; fields.push('note'); }
    if (!fields.length) throw invalidInput('Nothing to update — pass at least one new value.');
    const nextIn = patch.clockInAt ?? session.clockInAt;
    const nextOut = patch.clockOutAt ?? session.clockOutAt;
    if (nextOut && nextIn && new Date(nextOut) <= new Date(nextIn)) throw invalidInput('Finish must be after start.');
    if (fields.some((field) => field === 'start' || field === 'finish')) {
      patch.approvalStatus = 'pending';
      patch.approvedHours = null;
      patch.approvedBy = null;
      patch.approvedAt = null;
    }
    await store.update('timeClocks', session.id, patch);
    logActivity({ type: 'clock_updated', text: `Clock session for ${session.technicianName} on ${day} updated (${fields.join(', ')}).` });
    return { summary: `Updated ${session.technicianName}'s session on ${day} (${fields.join(', ')}).`, session: clockView(store.getById('timeClocks', session.id)) };
  },
});

defineAction({
  name: 'delete_clock_session',
  title: 'Delete a clock session',
  description: 'Permanently delete a clock session. This removes those hours from pay — use reject_timesheets when the hours should stay on record but not be paid.',
  permission: { module: 'Timesheets', key: 'edit_all' },
  risky: true,
  inputSchema: objectSchema(
    {
      session: str('The session: its id, technician and day, or note.'),
      technician: str('Narrow to this technician.'),
      date: dateish('Narrow to this day.'),
      reason: str('Why the session is being deleted.'),
    },
    ['session']
  ),
  summarize: (input, result) => result.summary,
  run: async ({ session: reference, technician, date, reason }) => {
    const session = resolveClockSession(reference, { technician, date });
    const snapshot = clockView(session);
    await store.delete('timeClocks', session.id);
    logActivity({ type: 'clock_deleted', text: `Clock session for ${session.technicianName} on ${snapshot.day} deleted${reason ? ` — ${reason}` : ''}.` });
    return { summary: `Deleted ${session.technicianName}'s clock session on ${snapshot.day}${snapshot.hours != null ? ` (${snapshot.hours}h)` : ''}.`, session: snapshot, reason: reason || null };
  },
});

defineAction({
  name: 'export_timesheets_csv',
  title: 'Export timesheet hours as CSV',
  description: 'Return the booked job-hours rows as CSV text, for a date range and optional technician. Same columns as the Timesheets page export.',
  permission: { module: 'Timesheets', key: 'export' },
  readOnly: true,
  inputSchema: objectSchema({
    from: dateish('First day. Defaults to all time.'),
    to: dateish('Last day. Defaults to today.'),
    technician: str('Only this technician.'),
  }),
  summarize: (input, result) => result.summary,
  run: async ({ from, to, technician }) => {
    const person = technician ? findTechnician(technician) : null;
    if (technician && !person) throw invalidInput(`No technician matches "${technician}".`);
    const start = from ? parseDate(from) : '';
    const end = to ? parseDate(to) : '';
    const jobs = new Map((store.getAll('jobs') || []).map((job) => [job.id, job]));
    const rows = (store.getAll('timesheets') || [])
      .filter((row) => (!start || row.date >= start) && (!end || row.date <= end))
      .filter((row) => !person || String(row.technicianId) === String(person.id))
      .sort((a, b) => String(a.date).localeCompare(String(b.date)));
    const clock = (value) => String(value || '').match(/T(\d{2}:\d{2})/)?.[1] || '';
    const csv = toCsv(
      ['Date', 'Technician', 'Job Number', 'Job Title', 'Customer', 'Task', 'Start', 'Finish', 'Hours', 'Description'],
      rows.map((row) => {
        const job = jobs.get(row.jobId);
        return [
          row.date ? String(row.date).slice(0, 10) : '',
          row.technicianName || '',
          job?.number || row.jobNumber || '',
          job?.title || row.jobTitle || '',
          job?.customerName || '',
          row.taskName || row.phaseName || '',
          clock(row.startTime),
          clock(row.finishTime),
          (Number(row.hours) || 0).toFixed(2),
          row.description || '',
        ];
      })
    );
    logActivity({ type: 'timesheets_exported', text: `Exported ${rows.length} job-hour row(s) to CSV.` });
    return { summary: `${rows.length} job-hour row(s) exported as CSV.`, filename: `job_hours_${start || 'all'}_${end || 'all'}.csv`, csv };
  },
});
