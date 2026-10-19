// ============================================
// RELAY — MANUAL CLOCK ENTRIES
// ============================================
// A technician who forgot to clock on and off still worked the day, so an admin has to
// be able to write the clock record for them. These helpers turn the times typed into
// the Clock History modals into session timestamps, using the same model the live clock
// writes: a break is a session closed with status 'break', and the break itself is the
// gap until the next session starts (utils/hoursMath.js dayTotals).
//
// Times are local "HH:MM" on a local "YYYY-MM-DD" day. A finish at or before its start
// rolls to the next day, so a night shift can be entered without a second date field.

function at(date, hhmm) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date || '') || !/^\d{2}:\d{2}$/.test(hhmm || '')) return null;
  const d = new Date(`${date}T${hhmm}`);
  return isNaN(d.getTime()) ? null : d;
}

/** `later` on the same day as `base`, or the following day when it would not be after it. */
function after(base, date, hhmm) {
  const d = at(date, hhmm);
  if (!d) return null;
  if (d <= base) d.setDate(d.getDate() + 1);
  return d;
}

/**
 * The sessions for one manually entered day.
 * @param {{date: string, clockIn: string, clockOut: string, breakStart?: string, breakEnd?: string}} input
 * @returns {{sessions?: Array<{clockInAt: string, clockOutAt: string, status: string}>, error?: string}}
 */
export function buildManualSessions({ date, clockIn, clockOut, breakStart = '', breakEnd = '' } = {}) {
  const start = at(date, clockIn);
  if (!start) return { error: 'Enter a date and a clock-in time' };
  const finish = after(start, date, clockOut);
  if (!finish) return { error: 'Enter a clock-out time' };

  if (!breakStart && !breakEnd) {
    return { sessions: [{ clockInAt: start.toISOString(), clockOutAt: finish.toISOString(), status: 'out' }] };
  }
  if (!breakStart || !breakEnd) return { error: 'Enter both a break start and a break end, or leave both empty' };

  const bStart = after(start, date, breakStart);
  const bEnd = bStart && after(bStart, date, breakEnd);
  if (!bStart || !bEnd || bEnd >= finish) {
    return { error: 'The break has to fall between clock-in and clock-out' };
  }
  return {
    sessions: [
      { clockInAt: start.toISOString(), clockOutAt: bStart.toISOString(), status: 'break' },
      { clockInAt: bEnd.toISOString(), clockOutAt: finish.toISOString(), status: 'out' }
    ]
  };
}

/**
 * New times for one existing session. An empty clock-out leaves the session open, for
 * when only the clock-in was wrong on a day still in progress.
 * @returns {{clockInAt?: string, clockOutAt?: string|null, error?: string}}
 */
export function editedSessionTimes({ date, clockIn, clockOut }) {
  const start = at(date, clockIn);
  if (!start) return { error: 'Enter a clock-in time' };
  if (!clockOut) return { clockInAt: start.toISOString(), clockOutAt: null };
  const finish = after(start, date, clockOut);
  if (!finish) return { error: 'Enter a valid clock-out time' };
  return { clockInAt: start.toISOString(), clockOutAt: finish.toISOString() };
}

/** "HH:MM" for a time input, from an ISO timestamp (local time). */
export function timeInputValue(iso) {
  if (!iso) return '';
  const d = new Date(iso);
  if (isNaN(d.getTime())) return '';
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
}
