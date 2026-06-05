import { test, describe } from 'node:test';
import assert from 'node:assert';

// We extract and verify the matching and iteration logic we implemented in JobForm.js
function generateOccurrences({ freq, start, end, daysOfWeek = [], daysOfMonth = [] }) {
  const [sYear, sMonth, sDay] = start.split('-').map(Number);
  let current = new Date(sYear, sMonth - 1, sDay);

  const [eYear, eMonth, eDay] = end.split('-').map(Number);
  const endDate = new Date(eYear, eMonth - 1, eDay, 23, 59, 59);

  let count = 0;
  let iterations = 0;
  const results = [];

  let matchDaysOfWeek = [...daysOfWeek];
  let matchDaysOfMonth = [...daysOfMonth];

  if (freq === 'Weekly' && matchDaysOfWeek.length === 0) {
    matchDaysOfWeek.push(current.getDay());
  }
  if (freq === 'Monthly' && matchDaysOfMonth.length === 0) {
    matchDaysOfMonth.push(current.getDate());
  }

  while (current <= endDate && count < 50 && iterations < 1000) {
    iterations++;
    let isMatch = false;

    if (freq === 'Daily') {
      isMatch = true;
    } else if (freq === 'Weekly') {
      isMatch = matchDaysOfWeek.includes(current.getDay());
    } else if (freq === 'Monthly') {
      isMatch = matchDaysOfMonth.includes(current.getDate());
    }

    if (isMatch) {
      const yyyy = current.getFullYear();
      const mm = String(current.getMonth() + 1).padStart(2, '0');
      const dd = String(current.getDate()).padStart(2, '0');
      results.push(`${yyyy}-${mm}-${dd}`);
      count++;
    }

    current.setDate(current.getDate() + 1);
  }

  return results;
}

describe('Job Recurring Schedule Generator', () => {
  test('Daily recurrence generates a date every day', () => {
    const dates = generateOccurrences({
      freq: 'Daily',
      start: '2026-06-01',
      end: '2026-06-05'
    });
    assert.deepStrictEqual(dates, [
      '2026-06-01',
      '2026-06-02',
      '2026-06-03',
      '2026-06-04',
      '2026-06-05'
    ]);
  });

  test('Weekly recurrence with no custom days defaults to the start date day of week', () => {
    // 2026-06-01 is a Monday (1)
    const dates = generateOccurrences({
      freq: 'Weekly',
      start: '2026-06-01',
      end: '2026-06-20',
      daysOfWeek: []
    });
    assert.deepStrictEqual(dates, [
      '2026-06-01', // Mon
      '2026-06-08', // Mon
      '2026-06-15'  // Mon
    ]);
  });

  test('Weekly recurrence with custom days (Tuesday=2, Thursday=4)', () => {
    // Start date: 2026-06-01 (Monday)
    const dates = generateOccurrences({
      freq: 'Weekly',
      start: '2026-06-01',
      end: '2026-06-12',
      daysOfWeek: [2, 4]
    });
    assert.deepStrictEqual(dates, [
      '2026-06-02', // Tue
      '2026-06-04', // Thu
      '2026-06-09', // Tue
      '2026-06-11'  // Thu
    ]);
  });

  test('Monthly recurrence with no custom days defaults to start date day of month', () => {
    const dates = generateOccurrences({
      freq: 'Monthly',
      start: '2026-06-10',
      end: '2026-08-15',
      daysOfMonth: []
    });
    assert.deepStrictEqual(dates, [
      '2026-06-10',
      '2026-07-10',
      '2026-08-10'
    ]);
  });

  test('Monthly recurrence with custom days of month (5, 20)', () => {
    const dates = generateOccurrences({
      freq: 'Monthly',
      start: '2026-06-01',
      end: '2026-07-10',
      daysOfMonth: [5, 20]
    });
    assert.deepStrictEqual(dates, [
      '2026-06-05',
      '2026-06-20',
      '2026-07-05'
    ]);
  });

  test('Cap at 50 occurrences', () => {
    const dates = generateOccurrences({
      freq: 'Daily',
      start: '2026-06-01',
      end: '2026-12-01'
    });
    assert.strictEqual(dates.length, 50);
  });
});
