import { test, describe } from 'node:test';
import assert from 'node:assert/strict';

import { addFrequency, nextDateAfter, daysUntil, passedMeterMilestone, isRetiredAsset } from './maintenanceSchedule.js';

describe('addFrequency', () => {
  test('steps each frequency', () => {
    assert.equal(addFrequency('2026-03-10', 'Weekly'), '2026-03-17');
    assert.equal(addFrequency('2026-03-10', 'Monthly'), '2026-04-10');
    assert.equal(addFrequency('2026-03-10', 'Quarterly'), '2026-06-10');
    assert.equal(addFrequency('2026-03-10', 'Semi-Annually'), '2026-09-10');
    assert.equal(addFrequency('2026-03-10', 'Annually'), '2027-03-10');
  });

  // setMonth overflow used to turn 31 Jan + 1 month into 3 March.
  test('clamps to the end of a shorter month instead of overflowing', () => {
    assert.equal(addFrequency('2026-01-31', 'Monthly'), '2026-02-28');
    assert.equal(addFrequency('2028-01-31', 'Monthly'), '2028-02-29');
    assert.equal(addFrequency('2026-08-31', 'Semi-Annually'), '2027-02-28');
    assert.equal(addFrequency('2028-02-29', 'Annually'), '2029-02-28');
  });

  test('several steps are measured from the original day', () => {
    assert.equal(addFrequency('2026-01-31', 'Monthly', 2), '2026-03-31');
    assert.equal(addFrequency('2026-11-30', 'Quarterly', 1), '2027-02-28');
    assert.equal(addFrequency('2026-12-29', 'Weekly', 1), '2027-01-05');
  });

  test('returns null for an unknown frequency or unreadable date', () => {
    assert.equal(addFrequency('2026-03-10', 'Fortnightly'), null);
    assert.equal(addFrequency('', 'Monthly'), null);
  });
});

describe('nextDateAfter', () => {
  test('a due date still ahead moves one period', () => {
    assert.equal(nextDateAfter('2026-11-05', 'Quarterly', '2026-10-31'), '2027-02-05');
  });

  // A paused plan resumed a year late is raised once and lands in the future,
  // rather than raising one notification per engine run as it catches up.
  test('a long-overdue date jumps to the first occurrence after today', () => {
    assert.equal(nextDateAfter('2025-06-15', 'Monthly', '2026-10-31'), '2026-11-15');
    assert.equal(nextDateAfter('2025-10-31', 'Annually', '2026-10-31'), '2027-10-31');
  });
});

test('daysUntil counts whole local days', () => {
  assert.equal(daysUntil('2026-10-31', '2026-11-07'), 7);
  assert.equal(daysUntil('2026-10-31', '2026-10-01'), -30);
});

describe('passedMeterMilestone', () => {
  test('moves to the last milestone at or below the reading', () => {
    assert.equal(passedMeterMilestone(0, 500, 520), 500);
    assert.equal(passedMeterMilestone(500, 500, 2130), 2000);
  });

  test('stays put below the next milestone or with no interval', () => {
    assert.equal(passedMeterMilestone(500, 500, 999), 500);
    assert.equal(passedMeterMilestone(500, 0, 5000), 500);
  });
});

test('Decommissioned and Lost/Stolen assets are retired', () => {
  assert.equal(isRetiredAsset({ status: 'Decommissioned' }), true);
  assert.equal(isRetiredAsset({ status: 'Lost/Stolen' }), true);
  assert.equal(isRetiredAsset({ status: 'In Maintenance' }), false);
  assert.equal(isRetiredAsset({ status: 'Active' }), false);
});
