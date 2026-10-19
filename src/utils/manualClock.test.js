import { test } from 'node:test';
import assert from 'node:assert/strict';
import { buildManualSessions, editedSessionTimes, timeInputValue } from './manualClock.js';

const local = (date, hhmm) => new Date(`${date}T${hhmm}`).toISOString();

test('a day with no break is one closed session', () => {
  const { sessions, error } = buildManualSessions({ date: '2026-10-16', clockIn: '07:00', clockOut: '15:30' });
  assert.equal(error, undefined);
  assert.deepEqual(sessions, [{ clockInAt: local('2026-10-16', '07:00'), clockOutAt: local('2026-10-16', '15:30'), status: 'out' }]);
});

test('a break splits the day into a break-closed session and a finishing one', () => {
  const { sessions } = buildManualSessions({ date: '2026-10-16', clockIn: '07:00', clockOut: '15:30', breakStart: '12:00', breakEnd: '12:30' });
  assert.equal(sessions.length, 2);
  assert.equal(sessions[0].status, 'break');
  assert.equal(sessions[0].clockOutAt, local('2026-10-16', '12:00'));
  assert.equal(sessions[1].clockInAt, local('2026-10-16', '12:30'));
  assert.equal(sessions[1].status, 'out');
});

test('a finish before the start rolls to the next day', () => {
  const { sessions } = buildManualSessions({ date: '2026-10-16', clockIn: '22:00', clockOut: '06:00' });
  assert.equal(sessions[0].clockOutAt, local('2026-10-17', '06:00'));
});

test('half a break, or a break outside the shift, is refused', () => {
  assert.ok(buildManualSessions({ date: '2026-10-16', clockIn: '07:00', clockOut: '15:00', breakStart: '12:00' }).error);
  assert.ok(buildManualSessions({ date: '2026-10-16', clockIn: '07:00', clockOut: '15:00', breakStart: '14:00', breakEnd: '16:00' }).error);
  assert.ok(buildManualSessions({ date: '2026-10-16', clockIn: '', clockOut: '15:00' }).error);
});

test('editing a session can set a missed clock-out or leave it open', () => {
  assert.deepEqual(editedSessionTimes({ date: '2026-10-16', clockIn: '07:00', clockOut: '15:00' }),
    { clockInAt: local('2026-10-16', '07:00'), clockOutAt: local('2026-10-16', '15:00') });
  assert.equal(editedSessionTimes({ date: '2026-10-16', clockIn: '07:00', clockOut: '' }).clockOutAt, null);
});

test('time input values read back in local time', () => {
  assert.equal(timeInputValue(local('2026-10-16', '07:05')), '07:05');
  assert.equal(timeInputValue(null), '');
});
