import test from 'node:test';
import assert from 'node:assert/strict';
import {
  MAX_EXPECTED_ROSTER_REPEAT_WEEKS,
  findExpectedRosterConflicts,
  getExpectedRosterRowsForDay,
  getExpectedRosterShiftBandsForDay,
  getExpectedRosterDefaultTimes,
  getExpectedRosterShiftHours,
  getExpectedRosterWeeks,
  getMondayDateKey,
  getRosterRepeatWeeks,
  isMondayDateKey,
  normalizeExpectedRosterTime
} from './expectedWorkRoster.js';

test('expected rosters repeat on full-week cycles from one through 52 weeks', () => {
  const weeks = getExpectedRosterWeeks('2026-10-12', 2);
  assert.equal(weeks.length, 2);
  assert.deepEqual(weeks[0].dates, [
    '2026-10-12', '2026-10-13', '2026-10-14', '2026-10-15',
    '2026-10-16', '2026-10-17', '2026-10-18'
  ]);
  assert.equal(getExpectedRosterWeeks('2026-10-12', MAX_EXPECTED_ROSTER_REPEAT_WEEKS).length, 52);
  assert.equal(getMondayDateKey('2026-10-15'), '2026-10-12');
  assert.equal(isMondayDateKey('2026-10-12'), true);
  assert.equal(isMondayDateKey('2026-10-13'), false);
  assert.throws(() => getExpectedRosterWeeks('2026-10-13', 1), /Monday/);
  assert.throws(() => getExpectedRosterWeeks('2026-10-12', 0), /1 and 52/);
  assert.throws(() => getExpectedRosterWeeks('2026-10-12', 53), /1 and 52/);
});

test('unassigned rosters create no technician attendance rows', () => {
  const roster = {
    id: 'r-unassigned',
    startDate: '2026-10-12',
    repeatEveryWeeks: 1,
    weekPatterns: [[true, false, false, false, false, false, false]],
    shiftHours: 8,
    technicianIds: []
  };
  assert.deepEqual(getExpectedRosterRowsForDay([roster], '2026-10-12'), []);
});

test('expected roster rows recur by week-pattern position indefinitely', () => {
  const roster = {
    id: 'r1',
    name: 'Workshop',
    startDate: '2026-10-12',
    repeatEveryWeeks: 2,
    weekPatterns: [
      [true, false, false, false, false, false, false],
      [false, false, true, false, false, false, false]
    ],
    shiftHours: 7.5,
    technicianIds: ['tech-1', 'tech-2']
  };
  assert.deepEqual(
    getExpectedRosterRowsForDay([roster], '2026-10-12').map(row => [row.technicianId, row.expectedHours]),
    [['tech-1', 7.5], ['tech-2', 7.5]]
  );
  assert.deepEqual(getExpectedRosterRowsForDay([roster], '2026-10-19'), []);
  assert.deepEqual(getExpectedRosterRowsForDay([roster], '2026-10-21').map(row => row.technicianId), ['tech-1', 'tech-2']);
  assert.deepEqual(getExpectedRosterRowsForDay([roster], '2026-10-26').map(row => row.technicianId), ['tech-1', 'tech-2']);
  assert.deepEqual(getExpectedRosterRowsForDay([roster], '2027-10-11').map(row => row.technicianId), ['tech-1', 'tech-2']);
  assert.deepEqual(getExpectedRosterRowsForDay([roster], '2026-10-11'), []);
});

test('expected roster days use their individual recurring shift times', () => {
  const roster = {
    id: 'r-times',
    name: 'Workshop',
    startDate: '2026-10-12',
    repeatEveryWeeks: 2,
    weekPatterns: [
      [true, true, false, false, false, false, false],
      [true, false, false, false, false, false, false]
    ],
    weekShiftTimes: [
      [
        { startTime: '07:00', endTime: '15:30' },
        { startTime: '09:00', endTime: '17:00' },
        null, null, null, null, null
      ],
      [
        { startTime: '10:00', endTime: '18:00' },
        null, null, null, null, null, null
      ]
    ],
    shiftHours: 8,
    technicianIds: ['tech-1']
  };

  assert.deepEqual(
    getExpectedRosterRowsForDay([roster], '2026-10-12').map(row => [
      row.expectedHours, row.expectedStartTime, row.expectedEndTime
    ]),
    [[8.5, '07:00', '15:30']]
  );
  assert.deepEqual(
    getExpectedRosterRowsForDay([roster], '2026-10-13').map(row => [
      row.expectedHours, row.expectedStartTime, row.expectedEndTime
    ]),
    [[8, '09:00', '17:00']]
  );
  assert.deepEqual(
    getExpectedRosterRowsForDay([roster], '2026-10-19').map(row => [
      row.expectedHours, row.expectedStartTime, row.expectedEndTime
    ]),
    [[8, '10:00', '18:00']]
  );
});

test('roster times normalize cloud time values and support shifts ending the next day', () => {
  assert.equal(normalizeExpectedRosterTime('07:30:00'), '07:30');
  assert.equal(normalizeExpectedRosterTime('25:00'), null);
  assert.equal(getExpectedRosterShiftHours('22:00', '06:00'), 8);
  assert.equal(getExpectedRosterShiftHours('08:00', '08:00'), 24);
  assert.deepEqual(getExpectedRosterDefaultTimes({ shiftHours: 7.5 }), {
    startTime: '08:00',
    endTime: '15:30'
  });
});

test('roster shift bands map each day to its actual hours and show overnight continuations', () => {
  const roster = {
    id: 'r-bands',
    startDate: '2026-10-12',
    repeatEveryWeeks: 1,
    weekPatterns: [[true, false, true, false, false, false, false]],
    weekShiftTimes: [[
      { startTime: '08:00', endTime: '16:00' },
      null,
      { startTime: '22:00', endTime: '06:00' },
      null, null, null, null
    ]],
    shiftHours: 8,
    technicianIds: ['tech-1']
  };

  assert.deepEqual(
    getExpectedRosterShiftBandsForDay([roster], '2026-10-12').map(band => [
      band.technicianId, band.startMinutes, band.endMinutes, band.continuesIntoNextDay
    ]),
    [['tech-1', 480, 960, false]]
  );
  assert.deepEqual(
    getExpectedRosterShiftBandsForDay([roster], '2026-10-14').map(band => [
      band.technicianId, band.startMinutes, band.endMinutes, band.continuesIntoNextDay
    ]),
    [['tech-1', 1320, 1440, true]]
  );
  assert.deepEqual(
    getExpectedRosterShiftBandsForDay([roster], '2026-10-15').map(band => [
      band.technicianId, band.startMinutes, band.endMinutes, band.continuesFromPreviousDay
    ]),
    [['tech-1', 0, 360, true]]
  );
  assert.deepEqual(getExpectedRosterShiftBandsForDay([roster], 'invalid'), []);
});

test('legacy finite rosters are interpreted as full-week recurring cycles', () => {
  assert.equal(getRosterRepeatWeeks({
    startDate: '2026-10-12',
    endDate: '2026-11-12',
    duration: 'month_1'
  }), 5);
  assert.equal(getRosterRepeatWeeks({
    startDate: '2026-10-12',
    endDate: '2026-10-19',
    duration: 'week'
  }), 1);
});

test('roster conflicts detect overlapping days throughout recurring cycles', () => {
  const existing = {
    id: 'existing',
    name: 'Early shift',
    startDate: '2026-10-12',
    repeatEveryWeeks: 1,
    weekPatterns: [[true, false, false, false, false, false, false]],
    shiftHours: 8,
    technicianIds: ['tech-1']
  };
  const futureRepeatConflict = findExpectedRosterConflicts(
    [existing], ['tech-1'], '2026-10-12', 2,
    [
      [false, false, false, false, false, false, false],
      [true, false, false, false, false, false, false]
    ]
  );
  assert.deepEqual(futureRepeatConflict.map(conflict => conflict.date), ['2026-10-19']);
  assert.deepEqual(findExpectedRosterConflicts(
    [existing], ['tech-1'], '2026-10-12', 1,
    [[false, true, false, false, false, false, false]]
  ), []);
  assert.deepEqual(findExpectedRosterConflicts(
    [existing], ['tech-2'], '2026-10-12', 1,
    [[true, false, false, false, false, false, false]]
  ), []);
});
