import { test, describe } from 'node:test';
import assert from 'node:assert';
import { formatDate } from './PrintPreview.js';

describe('formatDate', () => {
  test('formats a valid date string correctly', () => {
    const result = formatDate('2023-10-27');
    // Expecting Australian format: day Month Year
    assert.strictEqual(result, '27 October 2023');
  });

  test('returns a dash for empty or null input', () => {
    assert.strictEqual(formatDate(''), '—');
    assert.strictEqual(formatDate(null), '—');
    assert.strictEqual(formatDate(undefined), '—');
  });

  test('returns the original input when the catch block is triggered', () => {
    // A Symbol will throw when passed to new Date(), triggering the catch block
    const sym = Symbol('test');
    assert.strictEqual(formatDate(sym), sym);
  });

  test('handles invalid date strings by returning "Invalid Date" (current behavior)', () => {
    const result = formatDate('not-a-date');
    assert.strictEqual(result, 'Invalid Date');
  });
});
