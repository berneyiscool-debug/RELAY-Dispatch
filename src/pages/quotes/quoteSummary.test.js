import { test } from 'node:test';
import assert from 'node:assert/strict';
import { quoteEstimate, quoteStatusOptions, isSignedQuote } from './quoteSummary.js';

test('a converted quote keeps its status in the select', () => {
  assert.ok(quoteStatusOptions('Converted').includes('Converted'));
  assert.ok(!quoteStatusOptions('Draft').includes('Converted'), 'not offered by hand');
});

test('converted quotes count as signed', () => {
  assert.equal(isSignedQuote('Accepted'), true);
  assert.equal(isSignedQuote('Converted'), true);
  assert.equal(isSignedQuote('Sent'), false);
});

test('the stored estimate is used when present', () => {
  assert.deepEqual(quoteEstimate({ subtotal: 1000, totalInternalCost: 600 }), { cost: 600, margin: 400, percent: 40 });
});

test('a quote without a stored estimate is costed from its lines, never NaN', () => {
  const quote = {
    subtotal: 1260,
    sections: [
      { lineItems: [{ qty: 2, internalCost: 100 }, { qty: 1, internalCost: 60 }] },
      { lineItems: [{ qty: 5, internalCost: 70 }] },
    ],
  };
  assert.deepEqual(quoteEstimate(quote), { cost: 610, margin: 650, percent: 52 });
  assert.deepEqual(quoteEstimate({}), { cost: 0, margin: 0, percent: 0 });
});
