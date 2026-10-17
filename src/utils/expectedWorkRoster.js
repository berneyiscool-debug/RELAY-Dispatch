const DAY_MS = 24 * 60 * 60 * 1000;
const DAY_NAMES = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

export const MAX_EXPECTED_ROSTER_REPEAT_WEEKS = 52;
export const EXPECTED_ROSTER_DAYS = DAY_NAMES;

function parseDateOnly(value) {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return null;
  const [year, month, day] = value.split('-').map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));
  if (date.getUTCFullYear() !== year || date.getUTCMonth() !== month - 1 || date.getUTCDate() !== day) return null;
  return date;
}

function dateKey(date) {
  return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, '0')}-${String(date.getUTCDate()).padStart(2, '0')}`;
}

function validRepeatWeeks(value) {
  const weeks = Number(value);
  return Number.isInteger(weeks) && weeks >= 1 && weeks <= MAX_EXPECTED_ROSTER_REPEAT_WEEKS
    ? weeks
    : null;
}

function timeMinutes(value) {
  const match = /^([01]\d|2[0-3]):([0-5]\d)(?::[0-5]\d(?:\.\d+)?)?$/.exec(String(value || ''));
  return match ? Number(match[1]) * 60 + Number(match[2]) : null;
}

function timeFromMinutes(value) {
  const minutes = ((Math.round(value) % (24 * 60)) + (24 * 60)) % (24 * 60);
  return `${String(Math.floor(minutes / 60)).padStart(2, '0')}:${String(minutes % 60).padStart(2, '0')}`;
}

export function normalizeExpectedRosterTime(value) {
  const minutes = timeMinutes(value);
  return minutes === null ? null : timeFromMinutes(minutes);
}

export function getExpectedRosterShiftHours(startTime, endTime) {
  const start = timeMinutes(startTime);
  const end = timeMinutes(endTime);
  if (start === null || end === null) return null;
  const duration = (end - start + 24 * 60) % (24 * 60) || 24 * 60;
  return duration / 60;
}

export function getExpectedRosterDefaultTimes(roster) {
  const startTime = normalizeExpectedRosterTime(roster?.defaultStartTime) || '08:00';
  const savedEndTime = normalizeExpectedRosterTime(roster?.defaultEndTime);
  if (savedEndTime) return { startTime, endTime: savedEndTime };

  const shiftHours = Number(roster?.shiftHours);
  const durationMinutes = Number.isFinite(shiftHours) && shiftHours > 0 && shiftHours <= 24
    ? shiftHours * 60
    : 8 * 60;
  return {
    startTime,
    endTime: timeFromMinutes((timeMinutes(startTime) || 0) + durationMinutes)
  };
}

export function getRosterRepeatWeeks(roster) {
  const repeatWeeks = validRepeatWeeks(roster?.repeatEveryWeeks);
  if (repeatWeeks) return repeatWeeks;

  // Read old locally cached finite rosters as repeating weekly cycles.
  const start = parseDateOnly(roster?.startDate);
  const end = parseDateOnly(roster?.endDate);
  if (start && end && end > start) {
    return Math.min(
      MAX_EXPECTED_ROSTER_REPEAT_WEEKS,
      Math.max(1, Math.ceil((end.getTime() - start.getTime()) / (DAY_MS * 7)))
    );
  }
  if (roster?.duration === 'week') return 1;
  const oldMonthDuration = /^month_(\d+)$/.exec(String(roster?.duration || ''));
  if (oldMonthDuration) {
    const weeks = Math.ceil(Number(oldMonthDuration[1]) * 30.4375 / 7);
    return validRepeatWeeks(Math.min(weeks, MAX_EXPECTED_ROSTER_REPEAT_WEEKS));
  }
  return null;
}

export function isMondayDateKey(value) {
  const date = parseDateOnly(value);
  return !!date && date.getUTCDay() === 1;
}

export function getMondayDateKey(value) {
  const date = parseDateOnly(value);
  if (!date) throw new RangeError('A valid YYYY-MM-DD date is required.');
  const daysSinceMonday = (date.getUTCDay() + 6) % 7;
  date.setUTCDate(date.getUTCDate() - daysSinceMonday);
  return dateKey(date);
}

export function getExpectedRosterWeeks(startDate, repeatEveryWeeks) {
  const start = parseDateOnly(startDate);
  const weekCount = validRepeatWeeks(repeatEveryWeeks);
  if (!start) throw new RangeError('A valid YYYY-MM-DD start date is required.');
  if (start.getUTCDay() !== 1) throw new RangeError('Expected roster start dates must be a Monday.');
  if (!weekCount) throw new RangeError('Repeat interval must be between 1 and 52 full weeks.');

  return Array.from({ length: weekCount }, (_, weekIndex) => ({
    weekNumber: weekIndex + 1,
    dates: Array.from({ length: 7 }, (_, dayIndex) => {
      const date = new Date(start.getTime() + (weekIndex * 7 + dayIndex) * DAY_MS);
      return dateKey(date);
    })
  }));
}

export function getExpectedRosterRowsForDay(rosters, dateStr) {
  const date = parseDateOnly(dateStr);
  if (!date) return [];

  const rows = [];
  (rosters || []).forEach(roster => {
    const start = parseDateOnly(roster.startDate);
    const repeatWeeks = getRosterRepeatWeeks(roster);
    if (!start || start.getUTCDay() !== 1 || date < start || !repeatWeeks) return;

    const dayOffset = Math.floor((date.getTime() - start.getTime()) / DAY_MS);
    const weekIndex = Math.floor(dayOffset / 7) % repeatWeeks;
    const dayIndex = dayOffset % 7;
    if (roster.weekPatterns?.[weekIndex]?.[dayIndex] !== true) return;

    const dayShift = roster.weekShiftTimes?.[weekIndex]?.[dayIndex];
    const defaultTimes = getExpectedRosterDefaultTimes(roster);
    const startTime = normalizeExpectedRosterTime(dayShift?.startTime) || defaultTimes.startTime;
    const endTime = normalizeExpectedRosterTime(dayShift?.endTime) || defaultTimes.endTime;
    const dayShiftIsValid = !!normalizeExpectedRosterTime(dayShift?.startTime)
      && !!normalizeExpectedRosterTime(dayShift?.endTime);
    const shiftHours = dayShiftIsValid
      ? getExpectedRosterShiftHours(startTime, endTime)
      : Number(roster.shiftHours) || getExpectedRosterShiftHours(startTime, endTime);
    if (!Number.isFinite(shiftHours) || shiftHours <= 0 || shiftHours > 24) return;
    (Array.isArray(roster.technicianIds) ? roster.technicianIds : []).forEach(technicianId => {
      if (technicianId == null || String(technicianId).length === 0) return;
      const row = {
        id: `expected:${roster.id}:${technicianId}:${dateStr}`,
        type: 'expected_work_roster',
        date: dateStr,
        technicianId: String(technicianId),
        expectedHours: shiftHours,
        expectedWorkRosterId: String(roster.id),
        rosterName: roster.name || 'Expected work roster'
      };
      row.expectedStartTime = startTime;
      row.expectedEndTime = endTime;
      rows.push(row);
    });
  });
  return rows;
}

export function getExpectedRosterShiftBandsForDay(rosters, dateStr) {
  const date = parseDateOnly(dateStr);
  if (!date) return [];

  const previousDate = new Date(date.getTime() - DAY_MS);
  const previousDateStr = dateKey(previousDate);
  const bands = [];
  const appendBand = (row, fromPreviousDay) => {
    const start = timeMinutes(row.expectedStartTime);
    const end = timeMinutes(row.expectedEndTime);
    if (start === null || end === null) return;

    const endAfterMidnight = end <= start;
    const absoluteEnd = endAfterMidnight ? end + 24 * 60 : end;
    let startMinutes = start;
    let endMinutes = Math.min(absoluteEnd, 24 * 60);
    if (fromPreviousDay) {
      if (!endAfterMidnight) return;
      startMinutes = 0;
      endMinutes = absoluteEnd - 24 * 60;
    }
    if (endMinutes <= startMinutes) return;

    bands.push({
      technicianId: row.technicianId,
      rosterName: row.rosterName,
      startMinutes,
      endMinutes,
      continuesFromPreviousDay: fromPreviousDay,
      continuesIntoNextDay: !fromPreviousDay && endAfterMidnight
    });
  };

  getExpectedRosterRowsForDay(rosters, previousDateStr)
    .forEach(row => appendBand(row, true));
  getExpectedRosterRowsForDay(rosters, dateStr)
    .forEach(row => appendBand(row, false));
  return bands;
}

function greatestCommonDivisor(a, b) {
  let left = a;
  let right = b;
  while (right) [left, right] = [right, left % right];
  return left;
}

export function findExpectedRosterConflicts(rosters, technicianIds, startDate, repeatEveryWeeks, weekPatterns, excludeRosterId = null) {
  const selected = new Set((technicianIds || []).map(String));
  if (selected.size === 0) return [];

  const candidateCycle = validRepeatWeeks(repeatEveryWeeks);
  const candidateStart = parseDateOnly(startDate);
  if (!candidateCycle || !candidateStart || candidateStart.getUTCDay() !== 1) {
    throw new RangeError('Expected rosters require a Monday start and a repeat interval of 1–52 weeks.');
  }
  const candidate = {
    id: '__candidate__',
    startDate,
    repeatEveryWeeks: candidateCycle,
    weekPatterns,
    shiftHours: 1,
    technicianIds: [...selected]
  };
  const conflicts = new Map();

  (rosters || []).forEach(roster => {
    if (excludeRosterId != null && String(roster.id) === String(excludeRosterId)) return;
    const existingTechs = new Set((Array.isArray(roster.technicianIds) ? roster.technicianIds : []).map(String));
    const overlappingTechs = [...selected].filter(id => existingTechs.has(id));
    if (overlappingTechs.length === 0) return;

    const existingStart = parseDateOnly(roster.startDate);
    const existingCycle = getRosterRepeatWeeks(roster);
    if (!existingStart || existingStart.getUTCDay() !== 1 || !existingCycle) return;

    const overlapStart = new Date(Math.max(candidateStart.getTime(), existingStart.getTime()));
    const candidateWeekOffset = (overlapStart.getTime() - candidateStart.getTime()) / (DAY_MS * 7);
    const existingWeekOffset = (overlapStart.getTime() - existingStart.getTime()) / (DAY_MS * 7);
    const cycleWeeks = (candidateCycle / greatestCommonDivisor(candidateCycle, existingCycle)) * existingCycle;

    // Both patterns repeat forever; checking their least common cycle proves whether
    // any recurring weekday assignment will collide.
    for (let weekOffset = 0; weekOffset < cycleWeeks; weekOffset++) {
      const candidateWeek = (candidateWeekOffset + weekOffset) % candidateCycle;
      const existingWeek = (existingWeekOffset + weekOffset) % existingCycle;
      for (let dayIndex = 0; dayIndex < 7; dayIndex++) {
        if (candidate.weekPatterns?.[candidateWeek]?.[dayIndex] !== true
          || roster.weekPatterns?.[existingWeek]?.[dayIndex] !== true) continue;
        const conflictDate = new Date(overlapStart.getTime() + (weekOffset * 7 + dayIndex) * DAY_MS);
        const key = dateKey(conflictDate);
        overlappingTechs.forEach(technicianId => {
          const conflictKey = `${roster.id}|${technicianId}|${dayIndex}`;
          if (conflicts.has(conflictKey)) return;
          conflicts.set(conflictKey, {
            rosterName: roster.name || 'Saved roster',
            technicianId,
            date: key
          });
        });
      }
    }
  });
  return [...conflicts.values()];
}
