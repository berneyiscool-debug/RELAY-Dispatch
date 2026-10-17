import test from 'node:test';
import assert from 'node:assert/strict';
import { store } from '../data/store.js';
import { getNotArrived, getRosterForDay } from './payrollExceptions.js';
import { getMondayDateKey } from './expectedWorkRoster.js';
import { todayLocalISO } from './dateUtils.js';
import { getClockStatusForToday } from './timeClock.js';

test('expected rosters join attendance expectations and per-day dismissals remove only that shift', () => {
  const collections = ['schedule', 'expectedWorkRosters', 'expectedWorkRosterDismissals'];
  const previous = Object.fromEntries(collections.map(name => [name, store.cache[name]]));
  store.cache.schedule = [{
    id: 'job-schedule',
    type: 'job',
    date: '2026-10-12',
    technicianId: 'tech-1'
  }];
  store.cache.expectedWorkRosters = [{
    id: 'roster-1',
    name: 'Workshop',
    startDate: '2026-10-12',
    repeatEveryWeeks: 1,
    weekPatterns: [[true, false, false, false, false, false, false]],
    shiftHours: 7.5,
    technicianIds: ['tech-1', 'tech-2']
  }];
  store.cache.expectedWorkRosterDismissals = [{
    id: 'dismissal-1',
    rosterId: 'roster-1',
    technicianId: 'tech-2',
    date: '2026-10-12'
  }];

  try {
    const rows = getRosterForDay('2026-10-12');
    assert.equal(rows.get('tech-1').length, 2);
    assert.equal(rows.get('tech-1').find(row => row.expectedHours)?.expectedHours, 7.5);
    assert.equal(rows.has('tech-2'), false);
    assert.equal(getRosterForDay('2026-10-13').has('tech-1'), false);
  } finally {
    collections.forEach(name => {
      if (previous[name] === undefined) delete store.cache[name];
      else store.cache[name] = previous[name];
    });
  }
});

test('rostered staff who clocked out are not classified as not-yet-arrived', () => {
  const collections = ['schedule', 'expectedWorkRosters', 'expectedWorkRosterDismissals', 'timeClocks'];
  const previous = Object.fromEntries(collections.map(name => [name, store.cache[name]]));
  const today = todayLocalISO();
  const monday = getMondayDateKey(today);
  const dayIndex = (new Date(`${today}T12:00:00`).getDay() + 6) % 7;
  const week = Array.from({ length: 7 }, () => false);
  week[dayIndex] = true;
  store.cache.schedule = [];
  store.cache.expectedWorkRosters = [{
    id: 'roster-clocked-out',
    name: 'Today',
    startDate: monday,
    repeatEveryWeeks: 1,
    weekPatterns: [week],
    shiftHours: 8,
    technicianIds: ['tech-clocked-out']
  }];
  store.cache.expectedWorkRosterDismissals = [];
  store.cache.timeClocks = [{
    id: 'session-clocked-out',
    technicianId: 'tech-clocked-out',
    clockInAt: new Date(Date.now() - 60 * 60 * 1000).toISOString(),
    clockOutAt: new Date(Date.now() - 1000).toISOString(),
    status: 'out'
  }];

  try {
    assert.equal(getRosterForDay(today).has('tech-clocked-out'), true);
    assert.equal(getClockStatusForToday('tech-clocked-out').status, 'out');
    assert.deepEqual(getNotArrived(today, ['tech-clocked-out']), []);
  } finally {
    collections.forEach(name => {
      if (previous[name] === undefined) delete store.cache[name];
      else store.cache[name] = previous[name];
    });
  }
});

test('not-yet-arrived attendance follows each rostered shift start and grace period', () => {
  const collections = ['schedule', 'expectedWorkRosters', 'expectedWorkRosterDismissals', 'timeClocks'];
  const previous = Object.fromEntries(collections.map(name => [name, store.cache[name]]));
  const today = todayLocalISO();
  const monday = getMondayDateKey(today);
  const dayIndex = (new Date(`${today}T12:00:00`).getDay() + 6) % 7;
  const week = Array.from({ length: 7 }, (_, index) => index === dayIndex);
  const shiftTimes = startTime => [
    Array.from({ length: 7 }, (_, index) => (
      index === dayIndex ? { startTime, endTime: '17:00' } : null
    ))
  ];
  store.cache.schedule = [];
  store.cache.expectedWorkRosters = [
    {
      id: 'roster-early-start',
      name: 'Early shift',
      startDate: monday,
      repeatEveryWeeks: 1,
      weekPatterns: [week],
      weekShiftTimes: shiftTimes('09:00'),
      defaultStartTime: '08:00',
      defaultEndTime: '16:00',
      shiftHours: 8,
      technicianIds: ['tech-early']
    },
    {
      id: 'roster-late-start',
      name: 'Late shift',
      startDate: monday,
      repeatEveryWeeks: 1,
      weekPatterns: [week],
      weekShiftTimes: shiftTimes('11:00'),
      defaultStartTime: '08:00',
      defaultEndTime: '16:00',
      shiftHours: 8,
      technicianIds: ['tech-late']
    }
  ];
  store.cache.expectedWorkRosterDismissals = [];
  store.cache.timeClocks = [];

  try {
    const technicianIds = ['tech-early', 'tech-late'];
    assert.deepEqual(
      getNotArrived(today, technicianIds, new Date(`${today}T09:14:59`)),
      []
    );
    assert.deepEqual(
      getNotArrived(today, technicianIds, new Date(`${today}T09:15:00`)),
      ['tech-early']
    );
    assert.deepEqual(
      getNotArrived(today, technicianIds, new Date(`${today}T11:15:00`)),
      technicianIds
    );
  } finally {
    collections.forEach(name => {
      if (previous[name] === undefined) delete store.cache[name];
      else store.cache[name] = previous[name];
    });
  }
});
