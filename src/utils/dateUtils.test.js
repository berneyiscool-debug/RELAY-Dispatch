import { test, describe } from 'node:test';
import assert from 'node:assert';
import { parsePreferredTime, toDateKey, todayLocalISO, localDateLabel, localDateTimeLabel } from './dateUtils.js';

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

/**
 * These labels are what the model is told the date is. They are built from
 * fixed English name tables rather than `toLocaleString()` on purpose: a locale
 * string renders "15/10/2026" for an Australian user, which a model reads
 * month-first, and the machine's locale is neither ours to pick nor stable.
 */
describe('Date Utilities: local date labels', () => {
  test('names the day, the month and the weekday in English', () => {
    assert.strictEqual(localDateLabel(new Date(2026, 9, 15, 9, 14)), 'Thursday, 15 October 2026');
    assert.strictEqual(localDateLabel(new Date(2026, 0, 1, 23, 59)), 'Thursday, 1 January 2026');
    assert.strictEqual(localDateLabel(new Date(2026, 6, 5)), 'Sunday, 5 July 2026');
    assert.strictEqual(localDateLabel(new Date(2026, 11, 25)), 'Friday, 25 December 2026');
  });

  test('adds the local clock time and the UTC offset in force on that day', () => {
    assert.match(
      localDateTimeLabel(new Date(2026, 9, 15, 9, 14)),
      /^Thursday, 15 October 2026, 9:14 am \(UTC[+-]\d{1,2}(:\d{2})?\)$/,
    );
    assert.match(localDateTimeLabel(new Date(2026, 9, 15, 13, 5)), /, 1:05 pm \(/);
    assert.match(localDateTimeLabel(new Date(2026, 9, 15, 0, 30)), /, 12:30 am \(/, 'midnight is 12 am, not 0 am');
    assert.match(localDateTimeLabel(new Date(2026, 9, 15, 12, 0)), /, 12:00 pm \(/, 'midday is 12 pm, not 0 pm');
  });

  test('says nothing rather than "Invalid Date" when there is no date', () => {
    assert.strictEqual(localDateLabel(new Date('nonsense')), '');
    assert.strictEqual(localDateLabel(null), '');
    assert.strictEqual(localDateTimeLabel(new Date(NaN)), '');
  });

  test('defaults to today', () => {
    assert.match(localDateLabel(), /^(\w+day), \d{1,2} \w+ \d{4}$/);
    assert.match(localDateTimeLabel(), /^\w+day, \d{1,2} \w+ \d{4}, \d{1,2}:\d{2} (am|pm) \(UTC/);
  });
});
