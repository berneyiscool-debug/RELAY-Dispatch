// ============================================
// RELAY — PAYROLL EXCEPTIONS
// ============================================
// Derives the difference between what the roster expected and what the clock
// recorded. Exceptions are *computed*, never stored, so they clear themselves the
// moment reality changes — someone arrives and the flag is gone, with nothing to
// unwind. Only dismissals ("they genuinely didn't work") are ever written down.
//
// Two questions are asked of this data, and they are deliberately not the same one:
//
//   - "Has anyone we expected gone missing right now?" — the presence panel. Time
//     agnostic on purpose: a dispatch board wants to know immediately, and real
//     roster rows often carry no start time, so lateness cannot be computed for them.
//   - "Is this day's record complete and trustworthy?" — the hours grid and the pay
//     run. Time aware and grace-period based, because payroll should not flag someone
//     who is a few minutes late.
//
// This module owns both answers so they can never disagree about who was expected or
// who turned up. Only two conditions block a pay run — an open session, and a day that
// ended with no session at all — because only they can mean unpaid work. Being late,
// working more or fewer hours than rostered, and working an unrostered day are all
// surfaced but never block. See time-and-pay-spec.md §5.

import { store } from '../data/store.js';
import { todayLocalISO } from './dateUtils.js';
import { getClockStatusForToday } from './timeClock.js';

export const EXCEPTION = {
  OPEN_SESSION: 'open-session',
  MISSING_HOURS: 'missing-hours',
  LATE: 'late'
};

// How long after an expected start someone can arrive before they count as late.
export const GRACE_MINUTES = 15;

// Roster types that aren't work, so they raise no expectation of hours at all.
const NON_WORK_TYPES = ['leave', 'blockout', 'meeting'];

// Whether an exception should hold up a pay run.
export function isBlocking(type) {
  return type === EXCEPTION.OPEN_SESSION || type === EXCEPTION.MISSING_HOURS;
}

// Roster rows for one day, keyed by technician id. A row carries its day as `date`
// (YYYY-MM-DD) or, on older rows, only as `startTime` — resolve both, matching how
// getScheduleBlocks reads them.
//
// A dismissed row is excluded: dismissing says "they genuinely didn't work, and I know
// why". The roster stops expecting them, so the missing-hours exception clears itself
// and nothing has to be unwound if the shift later happens after all. The dismissal
// lives on the roster row (schedule.status) rather than in a table of its own.
export function getRosterForDay(dateStr) {
  const byTech = new Map();
  (store.getAll('schedule') || []).forEach(s => {
    if (!s.technicianId) return;
    if (NON_WORK_TYPES.includes(s.type)) return;
    if (s.status === 'dismissed') return;
    const day = s.date || (s.startTime ? todayLocalISO(new Date(s.startTime)) : null);
    if (day !== dateStr) return;
    const id = String(s.technicianId);
    if (!byTech.has(id)) byTech.set(id, []);
    byTech.get(id).push(s);
  });
  return byTech;
}

// Sessions that *began* on the given day, keyed by technician id. A session belongs to
// the day of its clock-in, which is the existing attribution rule and what keeps period
// totals stable.
//
// Status is deliberately ignored: a break is a clock-out, so counting only 'in'/'out'
// would drop the middle of a split shift. Scoping is the caller's job — this query is
// not company-scoped, so callers must iterate a scoped technician list.
export function getSessionsForDay(dateStr) {
  const byTech = new Map();
  (store.getAll('timeClocks') || []).forEach(c => {
    if (!c.clockInAt) return;
    if (todayLocalISO(new Date(c.clockInAt)) !== dateStr) return;
    const id = String(c.technicianId);
    if (!byTech.has(id)) byTech.set(id, []);
    byTech.get(id).push(c);
  });
  return byTech;
}

// The rostered window for a technician's day: the earliest expected start and the
// latest expected end across their rows. Rows with no times (the seeded demo rows, and
// anything created before times were recorded) contribute no window, which means they
// can still raise "missing hours" once the day is over but can never raise "late".
export function getExpectedWindow(rosterRows) {
  let startAt = null;
  let endAt = null;
  rosterRows.forEach(r => {
    if (r.startTime) {
      const t = new Date(r.startTime);
      if (!isNaN(t.getTime()) && (!startAt || t < startAt)) startAt = t;
    }
    if (r.finishTime) {
      const t = new Date(r.finishTime);
      if (!isNaN(t.getTime()) && (!endAt || t > endAt)) endAt = t;
    }
  });
  return { startAt, endAt };
}

// Has the book closed on this day? With an expected end we use it, otherwise the day is
// over when the calendar day is. An earlier date is always over.
function isDayOver(dateStr, endAt, now) {
  const endOfDay = new Date(`${dateStr}T23:59:59.999`);
  const cutoff = endAt && endAt < endOfDay ? endAt : endOfDay;
  return now > cutoff;
}

// Derive one technician's exceptions for a day.
// Pure: takes the roster rows and sessions so the policy can be reasoned about and
// tested without touching the store.
// @param {string} dateStr local YYYY-MM-DD
// @param {Array} sessions the technician's sessions that day, any status
// @param {Array} rosterRows the technician's expected-work roster rows that day
// @param {Date} [now]
// @returns {Array<{type: string, blocking: boolean, detail: string}>}
export function deriveExceptions(dateStr, sessions = [], rosterRows = [], now = new Date()) {
  const out = [];

  // An open session is the one thing that can mean unpaid work is still accruing, and
  // it is the only exception that can be raised for an unrostered day.
  //
  // A session a manager has already settled is not open in the sense that matters: the
  // blocking question is "could this still be unpaid work?", and once approvedHours and
  // a reason are recorded the money is known. Without this, a forgotten clock-out would
  // be a dead end — the manager often cannot know the real clock-out time, so the only
  // way to unblock payroll would be to invent one.
  sessions
    .filter(s => s.clockInAt && !s.clockOutAt && s.approvedHours == null)
    .forEach(s => out.push({
      type: EXCEPTION.OPEN_SESSION,
      blocking: true,
      sessionId: s.id,
      sinceAt: s.clockInAt,
      detail: `Clocked in at ${new Date(s.clockInAt).toLocaleTimeString()} and never out`
    }));

  // Nobody expected them: unrostered work is not an exception, it just isn't rostered.
  if (rosterRows.length === 0) return out;

  // Once they've arrived, the expectation is answered — lateness is about not knowing
  // where someone is, so it clears itself the moment they turn up.
  if (sessions.length > 0) return out;

  const { startAt, endAt } = getExpectedWindow(rosterRows);

  if (isDayOver(dateStr, endAt, now)) {
    out.push({
      type: EXCEPTION.MISSING_HOURS,
      blocking: true,
      detail: 'Rostered for work, no hours recorded'
    });
    return out;
  }

  if (startAt) {
    const graceEnds = new Date(startAt.getTime() + GRACE_MINUTES * 60000);
    if (now >= graceEnds) {
      out.push({
        type: EXCEPTION.LATE,
        blocking: false,
        expectedStartAt: startAt.toISOString(),
        detail: `Expected at ${startAt.toLocaleTimeString()}, not clocked in`
      });
    }
  }

  return out;
}

// Everyone rostered for work on a day who has not turned up at all, as technician ids.
// Time agnostic by design — see the header. An open session from an earlier day still
// means they are on site, which is what this list is about, so it is excluded the same
// way the presence panel excludes it.
export function getNotArrived(dateStr, technicianIds) {
  const roster = getRosterForDay(dateStr);
  const sessions = getSessionsForDay(dateStr);
  const out = [];

  technicianIds.forEach(rawId => {
    const id = String(rawId);
    if (!roster.has(id)) return;
    if ((sessions.get(id) || []).length > 0) return;
    if (getClockStatusForToday(id).status === 'in') return;
    out.push(id);
  });

  return out;
}

// Every exception for a day, across a known set of technicians. Iterating a scoped
// technician list is what keeps the result company-safe, since the underlying clock
// query is not filtered.
// @returns {Array<{technicianId: string, type: string, blocking: boolean, detail: string}>}
export function getDayExceptions(dateStr, technicianIds, now = new Date()) {
  const roster = getRosterForDay(dateStr);
  const sessions = getSessionsForDay(dateStr);
  const out = [];

  technicianIds.forEach(rawId => {
    const id = String(rawId);
    deriveExceptions(dateStr, sessions.get(id) || [], roster.get(id) || [], now)
      .forEach(e => out.push({ ...e, technicianId: id }));
  });

  return out;
}

// The exceptions that should hold up a pay run, for a whole period.
export function getBlockingExceptions(startDate, endDate, technicianIds, now = new Date()) {
  const out = [];
  for (let d = new Date(`${startDate}T12:00:00`); todayLocalISO(d) <= endDate; d.setDate(d.getDate() + 1)) {
    const dateStr = todayLocalISO(d);
    getDayExceptions(dateStr, technicianIds, now)
      .filter(e => e.blocking)
      .forEach(e => out.push({ ...e, date: dateStr }));
  }
  return out;
}
