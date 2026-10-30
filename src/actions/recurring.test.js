/**
 * The assistant can set up and run recurring jobs.
 *
 * A template built here has to be the same record `JobForm.js` writes — a `T-`
 * number, status "Recurring Template" and a `recurringConfig` — because the
 * maintenance engine and the schedule only recognise that shape. The actions run
 * against the demo business, so nothing reaches Supabase or IndexedDB.
 */

import { test, describe, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert/strict';

import { store, DEMO_COMPANY_ID } from '../data/store.js';
import { supabase } from '../utils/supabase.js';
import { executeAction } from './registry.js';
import { ERROR_CODES } from './errors.js';
import { todayLocalISO, toDateKey } from './dates.js';
import './recurring.js';

const CTX = { source: 'eval', actor: { id: 'user_test', name: 'Test Admin', role: 'admin' } };
const CUSTOMER = 'Brny Recurring Probe Pty Ltd';

function addDaysKey(days) {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return toDateKey(d);
}

describe('assistant recurring jobs', () => {
  const saved = {};

  beforeEach(async () => {
    saved.from = supabase.from;
    supabase.from = () => ({ upsert: async () => ({}), insert: async () => ({}), delete: () => ({ eq: async () => ({}), in: async () => ({}) }) });
    store.demoMode = true;
    store.companyId = DEMO_COMPANY_ID;
    store.db = { transaction: () => { throw new Error('IndexedDB touched'); } };
    await store.initializeDemo({ id: 'user_test', name: 'Test Admin', email: 'test@example.com' });
    store.create('customers', { company: CUSTOMER, status: 'Active', type: 'Company' });
  });

  afterEach(() => {
    supabase.from = saved.from;
    store.demoMode = false;
    store.db = null;
    store.clearSync();
  });

  test('create_recurring_job writes a template and spawns the coming week', async () => {
    const outcome = await executeAction('create_recurring_job', {
      customer: CUSTOMER,
      title: 'Daily plant check',
      frequency: 'Daily',
      estimatedHours: 1,
    }, CTX);
    const { template, nextDates } = outcome.result;

    assert.match(template.number, /^T-/);
    assert.strictEqual(template.status, 'Recurring Template');
    assert.strictEqual(template.isRecurring, true);
    assert.strictEqual(template.recurringConfig.freq, 'Daily');
    assert.strictEqual(template.recurringConfig.start, todayLocalISO());
    assert.ok(template.recurringConfig.end > template.recurringConfig.start, 'defaults to a year-long series');
    assert.strictEqual(template.tasks.length, 1);
    assert.strictEqual(nextDates[0], todayLocalISO());

    const children = store.getAll('jobs').filter((job) => job.parentJobId === template.id);
    assert.ok(children.length >= 7, `expected the week to be spawned, got ${children.length}`);
  });

  test('weekly days are stored as the weekday numbers the engine matches on', async () => {
    const outcome = await executeAction('create_recurring_job', {
      customer: CUSTOMER,
      title: 'Weekly clean',
      frequency: 'Weekly',
      daysOfWeek: ['Monday', 'Thursday'],
    }, CTX);
    assert.deepStrictEqual(outcome.result.template.recurringConfig.daysOfWeek, [1, 4]);
    assert.deepStrictEqual(outcome.result.template.recurringConfig.daysOfMonth, []);
  });

  test('update_recurring_job changes the schedule and stops a series', async () => {
    const { result } = await executeAction('create_recurring_job', { customer: CUSTOMER, title: 'Monthly RCD test', frequency: 'Monthly', daysOfMonth: [15] }, CTX);
    const today = todayLocalISO();
    const updated = await executeAction('update_recurring_job', { template: result.template.number, end: today, title: 'RCD test' }, CTX);

    assert.strictEqual(updated.result.template.recurringConfig.end, today);
    assert.strictEqual(updated.result.template.title, 'RCD test');
    assert.deepStrictEqual(updated.result.fields, ['title', 'end']);
  });

  test('skip_recurring_occurrence skips and restores a date', async () => {
    const { result } = await executeAction('create_recurring_job', { customer: CUSTOMER, title: 'Gate check', frequency: 'Daily', start: addDaysKey(30) }, CTX);
    const date = addDaysKey(31);

    const skipped = await executeAction('skip_recurring_occurrence', { template: result.template.number, date }, CTX);
    assert.deepStrictEqual(skipped.result.template.recurringConfig.skippedDates, [date]);

    const restored = await executeAction('skip_recurring_occurrence', { template: result.template.number, date, restore: true }, CTX);
    assert.deepStrictEqual(restored.result.template.recurringConfig.skippedDates, []);
  });

  test('list_recurring_jobs reads templates for a customer', async () => {
    await executeAction('create_recurring_job', { customer: CUSTOMER, title: 'Filter swap', frequency: 'Monthly' }, CTX);
    const outcome = await executeAction('list_recurring_jobs', { customer: CUSTOMER }, CTX);
    assert.strictEqual(outcome.result.templates.length, 1);
    assert.strictEqual(outcome.result.templates[0].title, 'Filter swap');
    assert.match(outcome.result.templates[0].schedule, /^Monthly/);
  });

  test('a series that ends before it starts is refused', async () => {
    await assert.rejects(
      executeAction('create_recurring_job', { customer: CUSTOMER, title: 'Bad', frequency: 'Daily', start: addDaysKey(10), end: addDaysKey(1) }, CTX),
      (error) => error.code === ERROR_CODES.INVALID_INPUT,
    );
  });
});
