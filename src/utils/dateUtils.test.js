import { test, describe } from 'node:test';
import assert from 'node:assert';
import { parsePreferredTime, toDateKey, todayLocalISO } from './dateUtils.js';

describe('Date Utilities: parsePreferredTime', () => {
  test('should parse 24-hour formats correctly', () => {
    assert.deepStrictEqual(parsePreferredTime('14:30'), { hours: 14, minutes: 30 });
    assert.deepStrictEqual(parsePreferredTime('08:00'), { hours: 8, minutes: 0 });
    assert.deepStrictEqual(parsePreferredTime(' 23:59 '), { hours: 23, minutes: 59 });
  });

  test('should parse 12-hour formats correctly', () => {
    assert.deepStrictEqual(parsePreferredTime('2pm'), { hours: 14, minutes: 0 });
    assert.deepStrictEqual(parsePreferredTime('2:30 pm'), { hours: 14, minutes: 30 });
    assert.deepStrictEqual(parsePreferredTime('11am'), { hours: 11, minutes: 0 });
    assert.deepStrictEqual(parsePreferredTime('12:00 AM'), { hours: 0, minutes: 0 });
    assert.deepStrictEqual(parsePreferredTime('12:00 PM'), { hours: 12, minutes: 0 });
  });

  test('should parse text embedded formats correctly', () => {
    assert.deepStrictEqual(parsePreferredTime('a class at 2pm everyday'), { hours: 14, minutes: 0 });
    assert.deepStrictEqual(parsePreferredTime('Morning (9:30am) meeting'), { hours: 9, minutes: 30 });
  });

  test('should parse plain numbers correctly', () => {
    assert.deepStrictEqual(parsePreferredTime('14'), { hours: 14, minutes: 0 });
    assert.deepStrictEqual(parsePreferredTime(' 9 '), { hours: 9, minutes: 0 });
  });

  test('should return null for invalid formats', () => {
    assert.strictEqual(parsePreferredTime(null), null);
    assert.strictEqual(parsePreferredTime(''), null);
    assert.strictEqual(parsePreferredTime('Morning'), null);
    assert.strictEqual(parsePreferredTime('25:00'), null);
  });
});

describe('Date Utilities: toDateKey', () => {
  test('passes through local ISO date keys unchanged', () => {
    assert.strictEqual(toDateKey('2026-08-15'), '2026-08-15');
    assert.strictEqual(toDateKey(' 2026-08-15 '), '2026-08-15');
  });

  test('accepts the Australian day-first formats used by older builds', () => {
    assert.strictEqual(toDateKey('15/08/2026'), '2026-08-15');
    assert.strictEqual(toDateKey('5/8/2026'), '2026-08-05');
    assert.strictEqual(toDateKey('15.08.2026'), '2026-08-15');
    assert.strictEqual(toDateKey('15-08-2026'), '2026-08-15');
  });

  test('keeps the local calendar day of an ISO timestamp', () => {
    assert.strictEqual(toDateKey('2026-08-15T09:30:00'), '2026-08-15');
    assert.strictEqual(toDateKey('2026-08-15 09:30:00'), '2026-08-15');
    assert.strictEqual(toDateKey(`${todayLocalISO()}T00:00:00`), todayLocalISO());
  });

  test('converts Date instances using local calendar parts', () => {
    assert.strictEqual(toDateKey(new Date(2026, 7, 15, 23, 59)), '2026-08-15');
    assert.strictEqual(toDateKey(new Date(2026, 0, 1)), '2026-01-01');
  });

  test('returns null when there is no usable date', () => {
    assert.strictEqual(toDateKey(null), null);
    assert.strictEqual(toDateKey(undefined), null);
    assert.strictEqual(toDateKey(''), null);
    assert.strictEqual(toDateKey('   '), null);
    assert.strictEqual(toDateKey('next Tuesday'), null);
  });
});
