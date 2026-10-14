// ============================================
// RELAY — HOURS ARITHMETIC
// ============================================
// The measurement layer shared by every payroll surface (the Hours grid and the Pay
// Run). It lives in one place on purpose: if two screens derived "what counts toward
// pay" separately they would eventually disagree about the same day, and a payroll
// disagreement is a money bug.
//
// Two ideas carry the whole feature:
//
//   Measured  — what the clock says. The sum of a session's elapsed time.
//   Counted   — what is payable. A manager's correction when there is one, otherwise
//               the measurement, and nothing at all when the session was rejected.
//
// A day is one or more sessions, because a break is a clock-out (time-and-pay-spec.md
// §5). Any assumption of one row per technician per day is wrong.

import { formatDuration } from './timeClock.js';

const pad = n => String(n).padStart(2, '0');

export function isoOf(d) {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

// The period a payroll surface opens on: the current calendar month. There is no
// pay-period setting to read yet, so the month is the honest default and the filter
// says so rather than the grid silently showing an unbounded range.
export function currentMonthRange() {
  const now = new Date();
  return {
    start: isoOf(new Date(now.getFullYear(), now.getMonth(), 1)),
    end: isoOf(new Date(now.getFullYear(), now.getMonth() + 1, 0))
  };
}

export function addDays(dateStr, n) {
  const [y, m, d] = dateStr.split('-').map(Number);
  return isoOf(new Date(y, m - 1, d + n));
}

export function datesBetween(start, end) {
  const out = [];
  if (!start || !end || start > end) return out;
  let cursor = start;
  // Hard stop so a malformed range can never spin.
  for (let i = 0; cursor <= end && i < 400; i++) {
    out.push(cursor);
    cursor = addDays(cursor, 1);
  }
  return out;
}

// Elapsed time for one session, live while it is still open.
export function durationMs(rec, now) {
  if (!rec.clockInAt) return 0;
  const end = rec.clockOutAt ? new Date(rec.clockOutAt).getTime() : now.getTime();
  return Math.max(0, end - new Date(rec.clockInAt).getTime());
}

export const msToHours = ms => ms / 3600000;
export const round2 = n => Math.round(n * 100) / 100;

export function fmtTime(iso) {
  if (!iso) return '—';
  return new Date(iso).toLocaleTimeString('en-AU', { hour: 'numeric', minute: '2-digit' });
}

export function fmtDay(dateStr) {
  const [y, m, d] = dateStr.split('-').map(Number);
  return new Date(y, m - 1, d).toLocaleDateString('en-AU', { weekday: 'short', day: 'numeric', month: 'short' });
}

// Durations read as "8:30"; an empty duration reads as a dash rather than "0:00", so a
// missing day is never mistaken for a zero day.
export function hoursLabel(ms) {
  return ms ? formatDuration(ms) : '—';
}

export function measuredHours(session, now) {
  return round2(msToHours(durationMs(session, now)));
}

/**
 * What counts toward pay for one session: a rejected session counts nothing, otherwise
 * the corrected figure when a manager has set one, otherwise the measurement. Note that
 * a *pending* session counts its measurement — unsigned is not the same as unpaid, and
 * the sign-off state is reported separately rather than by hiding the hours.
 */
export function payableHours(session, now) {
  if (session.approvalStatus === 'rejected') return 0;
  return session.approvedHours != null ? Number(session.approvedHours) : measuredHours(session, now);
}

/**
 * A day's totals. Every session counts as worked time regardless of how it ended — a
 * session closed for a break is still time on the clock; the *break* is the gap between
 * that session's clock-out and the next session's clock-in. A trailing break (still on
 * one) accrues up to now so the day reads live.
 */
export function dayTotals(sessions, now) {
  const sorted = [...sessions].sort((a, b) =>
    new Date(a.clockInAt || 0) - new Date(b.clockInAt || 0));
  let workedMs = 0;
  let breakMs = 0;
  sorted.forEach((s, i) => {
    workedMs += durationMs(s, now);
    if (s.status !== 'break' || !s.clockOutAt) return;
    const next = sorted[i + 1];
    const gapEnd = next && next.clockInAt ? new Date(next.clockInAt).getTime() : now.getTime();
    breakMs += Math.max(0, gapEnd - new Date(s.clockOutAt).getTime());
  });
  return { sorted, workedMs, breakMs };
}

export function downloadCSV(filename, rows) {
  const csv = rows.map(r => r.map(cell => {
    const s = cell == null ? '' : String(cell);
    return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  }).join(',')).join('\n');
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

/** The signed-in user's display name, for stamping and attributing corrections. */
export function actorName(currentUser) {
  const u = currentUser || {};
  return u.name || u.username || u.email || String(u.id || 'Manager');
}
