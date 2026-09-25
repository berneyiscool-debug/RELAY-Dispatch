// ============================================
// RELAY DISPATCH — JOB TIME LEDGER
// ============================================
// A job's Schedule tab reads as one ledger: every row is either Scheduled (a
// planned dispatch) or Booked (recorded time). Bookings are paired to plan
// blocks at render time and never write back to the plan — `schedule` stays the
// dispatch record, `timesheets` stays the record of booked hours. Deriving keeps
// both stores intact and lets the plan and the record disagree in the open,
// which is exactly what the Status/Scheduled/Booked columns are for.

function hoursOf(record) {
  const raw = record?.hours ?? record?.durationHours ?? record?.duration_hours;
  const value = Number(raw);
  return Number.isFinite(value) ? value : 0;
}

function dayOf(record) {
  const value = record?.date || record?.startTime;
  return value ? String(value).slice(0, 10) : '';
}

function timeOf(record) {
  const match = String(record?.startTime || '').match(/T(\d{2}:\d{2})/);
  return match ? match[1] : '';
}

const byStartTime = (a, b) => timeOf(a).localeCompare(timeOf(b));

/**
 * Build the job's time ledger from its dispatches and its bookings.
 *
 * Pairing rule: same job + technician + day, preferring an exact start-time
 * match and otherwise the earliest unused booking. A dispatch that consumed a
 * booking reports both the planned and the booked hours, so a partly-worked
 * block stays one row. Bookings with no matching plan stay visible as unplanned
 * work.
 */
export function buildJobTimeLedger({ schedule = [], timesheets = [], includeBookings = true } = {}) {
  const plan = schedule.filter(s => s && s.type !== 'shift').sort(byStartTime);
  const bookings = includeBookings ? timesheets.filter(t => t).sort(byStartTime) : [];
  const consumed = new Set();

  const rows = plan.map(dispatch => {
    const day = dayOf(dispatch);
    const candidates = bookings.filter(booking => !consumed.has(booking.id)
      && String(booking.technicianId) === String(dispatch.technicianId)
      && dayOf(booking) === day);
    const start = timeOf(dispatch);
    const booking = candidates.find(b => timeOf(b) === start) || candidates[0] || null;
    if (booking) consumed.add(booking.id);

    return {
      key: `s:${dispatch.id}`,
      type: booking ? 'Booked' : 'Scheduled',
      day,
      technicianId: dispatch.technicianId,
      technicianName: dispatch.technicianName || '',
      taskName: booking?.taskName || booking?.phaseName || dispatch.taskName || '',
      startTime: booking?.startTime || dispatch.startTime || '',
      finishTime: booking?.finishTime || dispatch.finishTime || '',
      scheduledHours: hoursOf(dispatch),
      bookedHours: booking ? hoursOf(booking) : null,
      dispatchId: dispatch.id,
      bookingId: booking ? booking.id : null
    };
  });

  bookings.forEach(booking => {
    if (consumed.has(booking.id)) return;
    rows.push({
      key: `b:${booking.id}`,
      type: 'Booked',
      day: dayOf(booking),
      technicianId: booking.technicianId,
      technicianName: booking.technicianName || '',
      taskName: booking.taskName || booking.phaseName || '',
      startTime: booking.startTime || '',
      finishTime: booking.finishTime || '',
      scheduledHours: null,
      bookedHours: hoursOf(booking),
      dispatchId: null,
      bookingId: booking.id
    });
  });

  rows.sort((a, b) => {
    if (a.day !== b.day) return a.day < b.day ? 1 : -1;
    const tech = String(a.technicianName).localeCompare(String(b.technicianName));
    if (tech !== 0) return tech;
    return timeOf(a).localeCompare(timeOf(b));
  });

  return rows;
}

const round2 = value => Math.round(value * 100) / 100;

/** Ledger totals. `variance` is booked minus planned: positive means over-run. */
export function summariseJobTimeLedger(rows = []) {
  let planned = 0;
  let booked = 0;
  rows.forEach(row => {
    planned += row.scheduledHours || 0;
    booked += row.bookedHours || 0;
  });
  planned = round2(planned);
  booked = round2(booked);
  return {
    planned,
    booked,
    outstanding: Math.max(0, round2(planned - booked)),
    variance: round2(booked - planned)
  };
}
