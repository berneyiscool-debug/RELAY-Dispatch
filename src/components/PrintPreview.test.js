globalThis.localStorage = {
  getItem: () => null,
  setItem: () => {},
  removeItem: () => {},
  clear: () => {}
};

import { test, describe } from 'node:test';
import assert from 'node:assert';
const { formatDate } = await import('./PrintPreview.js');

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

describe('purchase order document', async () => {
  const { generateDocument } = await import('./PrintPreview.js');
  const po = {
    id: 'po_1', number: 'PO-0007', status: 'Issued', supplierName: 'Sparky <Supplies>',
    issueDate: '2026-10-01', jobNumber: 'J-100', notes: 'Leave at gate',
    lineItems: [
      { description: 'Cable 2.5mm', sku: 'CB-25', unitCost: 1.5, quantity: 100 },
      { description: 'RCD', sku: '', unitCost: 42, quantity: 2 },
    ],
    total: 234,
  };

  test('prints the order, supplier, items and total', () => {
    const html = generateDocument('po', po);
    assert.match(html, /PURCHASE ORDER/);
    assert.match(html, /PO-0007/);
    assert.match(html, /Cable 2\.5mm/);
    assert.match(html, /\$150\.00/);
    assert.match(html, /\$234\.00/);
    assert.match(html, /J-100/);
    assert.match(html, /Leave at gate/);
  });

  test('escapes record text', () => {
    const html = generateDocument('po', po);
    assert.match(html, /Sparky &lt;Supplies&gt;/);
    assert.doesNotMatch(html, /<Supplies>/);
  });

  test('accepts the older `items` field and totals it when total is missing', () => {
    const html = generateDocument('po', { number: 'PO-1', items: [{ description: 'X', unitCost: 2, quantity: 3 }] });
    assert.match(html, /\$6\.00/);
  });
});
