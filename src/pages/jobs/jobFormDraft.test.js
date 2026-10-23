import { test, describe } from 'node:test';
import assert from 'node:assert';
import {
  mergeDraftValues,
  sectionSaveMissingFields,
  emergencyLabourCost,
  EMERGENCY_CALLOUT_FEE,
} from './jobFormDraft.js';

describe('Job form draft helpers', () => {
  test('merges every form value, including fields the user cleared', () => {
    const draft = { title: 'Old title', customerId: 'c1' };
    mergeDraftValues(draft, { title: 'New title', customerId: '' });

    assert.strictEqual(draft.title, 'New title');
    assert.strictEqual(draft.customerId, '', 'a cleared control must clear the draft too');
  });

  test('keeps draft-only keys that are not part of the form controls', () => {
    const draft = { customerName: 'Acme', recurringConfig: { freq: 'Weekly' } };
    mergeDraftValues(draft, { title: 'Pump repair' });

    assert.strictEqual(draft.customerName, 'Acme');
    assert.deepStrictEqual(draft.recurringConfig, { freq: 'Weekly' });
  });

  test('tolerates a missing draft or values object', () => {
    assert.strictEqual(mergeDraftValues(null, { a: 1 }), null);
    const draft = { a: 1 };
    assert.strictEqual(mergeDraftValues(draft, null), draft);
  });

  test('a section save needs both title and customer to create the job', () => {
    assert.deepStrictEqual(sectionSaveMissingFields({}), [
      { field: 'title', label: 'Title' },
      { field: 'customerId', label: 'Customer' },
    ]);

    assert.deepStrictEqual(sectionSaveMissingFields({ title: '   ' }), [
      { field: 'title', label: 'Title' },
      { field: 'customerId', label: 'Customer' },
    ]);
  });

  test('a section save is allowed once the identifying fields are present', () => {
    assert.deepStrictEqual(
      sectionSaveMissingFields({ title: 'Pump repair', customerId: 'cust_1' }),
      [],
    );
  });

  test('the emergency fee is added when the job becomes an emergency', () => {
    assert.strictEqual(
      emergencyLabourCost(200, false, true),
      200 + EMERGENCY_CALLOUT_FEE,
    );
  });

  test('the emergency fee is removed when the emergency flag is cleared', () => {
    assert.strictEqual(
      emergencyLabourCost(350, true, false),
      350 - EMERGENCY_CALLOUT_FEE,
    );
  });

  test('saving an unchanged emergency keeps the fee exactly once', () => {
    assert.strictEqual(emergencyLabourCost(350, true, true), 350);
    assert.strictEqual(emergencyLabourCost(200, false, false), 200);
  });

  test('removing the fee never drives labour cost below zero', () => {
    assert.strictEqual(emergencyLabourCost(0, true, false), 0);
  });
});
