import test from 'node:test';
import assert from 'node:assert/strict';
import { store } from './store.js';

test('expected roster cloud records round-trip recurring week counts and JSON patterns', () => {
  const pattern = [
    [true, false, true, false, false, false, false],
    [false, true, false, true, false, false, false]
  ];
  const ids = ['tech-1', 'tech-2'];
  const weekShiftTimes = [
    [
      { startTime: '07:00', endTime: '15:30' },
      { startTime: '09:00', endTime: '17:00' },
      null, null, null, null, null
    ],
    [null, { startTime: '10:00', endTime: '18:00' }, null, null, null, null, null]
  ];
  const local = store.normalizeRecord({
    id: 'roster-1',
    company_id: 'company-1',
    name: 'Workshop',
    start_date: '2026-10-12',
    repeat_every_weeks: 2,
    week_patterns: pattern,
    default_start_time: '08:00:00',
    default_end_time: '16:00:00',
    week_shift_times: weekShiftTimes,
    shift_hours: '7.5',
    technician_ids: ids
  }, 'expectedWorkRosters');

  assert.equal(local.companyId, 'company-1');
  assert.equal(local.startDate, '2026-10-12');
  assert.equal(local.repeatEveryWeeks, 2);
  assert.equal(local.shiftHours, 7.5);
  assert.equal(local.defaultStartTime, '08:00:00');
  assert.equal(local.defaultEndTime, '16:00:00');
  assert.deepEqual(local.weekPatterns, pattern);
  assert.deepEqual(local.weekShiftTimes, weekShiftTimes);
  assert.deepEqual(local.technicianIds, ids);

  const cloud = store.denormalizeRecord(local, 'expectedWorkRosters');
  assert.equal(cloud.company_id, 'company-1');
  assert.equal(cloud.start_date, '2026-10-12');
  assert.equal(cloud.repeat_every_weeks, 2);
  assert.equal(cloud.shift_hours, 7.5);
  assert.equal(cloud.default_start_time, '08:00:00');
  assert.equal(cloud.default_end_time, '16:00:00');
  assert.deepEqual(cloud.week_patterns, pattern);
  assert.deepEqual(cloud.week_shift_times, weekShiftTimes);
  assert.deepEqual(cloud.technician_ids, ids);
  assert.equal('end_date' in cloud, false);
  assert.equal('duration' in cloud, false);
  assert.equal('weekPatterns' in cloud, false);
  assert.equal('weekShiftTimes' in cloud, false);
  assert.equal('technicianIds' in cloud, false);
});

test('expected roster dismissal records map their relationship and actor columns', () => {
  const local = store.normalizeRecord({
    id: 'dismissal-1',
    company_id: 'company-1',
    roster_id: 'roster-1',
    technician_id: 'tech-1',
    date: '2026-10-12',
    reason: 'No work',
    dismissed_by: 'Admin'
  }, 'expectedWorkRosterDismissals');
  const cloud = store.denormalizeRecord(local, 'expectedWorkRosterDismissals');

  assert.equal(local.rosterId, 'roster-1');
  assert.equal(local.technicianId, 'tech-1');
  assert.equal(local.dismissedBy, 'Admin');
  assert.equal(cloud.roster_id, 'roster-1');
  assert.equal(cloud.technician_id, 'tech-1');
  assert.equal(cloud.dismissed_by, 'Admin');
});
