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
import { objectSchema, str, enumOf, dateish } from './schema.js';
import { invalidInput } from './errors.js';
import { logActivity, currentActor } from './context.js';
import { parseDate, toDateKey } from './dates.js';
import { findTechnician } from './leads.js';
import { actorName, measuredHours, payableHours, round2 } from '../utils/hoursMath.js';

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

