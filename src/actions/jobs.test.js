/**
 * Every job the assistant creates carries a task to book hours against.
 *
 * Hours attach to a task, not to a job: `log_time` needs a `task`, and the
 * timesheet invents one the first time somebody opens a job that has none.
 * `JobDetail.js`, `ScheduleView.js` and `timesheetModals.js` all hand-build the
 * same "Main Task" node when a person creates a job, so a job built by the
 * assistant has to look the same or the hours have nowhere to land.
 *
 * The actions run against the demo business, as in `data/demoMode.test.js`, so
 * nothing here reaches Supabase, the folder or IndexedDB.
 */

import { test, describe, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert/strict';

import { store, DEMO_COMPANY_ID } from '../data/store.js';
import { supabase } from '../utils/supabase.js';
import { executeAction, getAction } from './registry.js';
import { mainTaskNode } from './jobs.js';
import './quotes.js';

const CTX = { source: 'eval', actor: { id: 'user_test', name: 'Test Admin', role: 'admin' } };
const CUSTOMER = 'Brny Main Task Probe Pty Ltd';

/** The keys every hand-built task node carries, in the order they are written. */
const TASK_KEYS = ['id', 'name', 'status', 'progress', 'startDate', 'technicians', 'subTasks'];

describe('assistant job creation always leaves a task to book hours against', () => {
  let calls;
  const saved = {};

  beforeEach(async () => {
    calls = [];
    saved.from = supabase.from;
    supabase.from = (table) => { calls.push(table); return { upsert: async () => ({}), insert: async () => ({}), delete: () => ({ eq: async () => ({}), in: async () => ({}) }) }; };
    store.demoMode = true;
    store.companyId = DEMO_COMPANY_ID;
    store.db = { transaction: () => { calls.push('indexeddb'); throw new Error('IndexedDB touched'); } };
    await store.initializeDemo({ id: 'user_test', name: 'Test Admin', email: 'test@example.com' });
    store.create('customers', { company: CUSTOMER, status: 'Active', type: 'Company' });
  });

  afterEach(() => {
    supabase.from = saved.from;
    store.demoMode = false;
    store.db = null;
    store.clearSync();
  });

  test('mainTaskNode matches the node the job screens build by hand', () => {
    const task = mainTaskNode();
    assert.deepStrictEqual(Object.keys(task), TASK_KEYS);
    assert.ok(task.id);
    assert.strictEqual(task.name, 'Main Task');
    assert.strictEqual(task.status, 'Not Started');
    assert.strictEqual(task.progress, 0);
    assert.ok(!Number.isNaN(Date.parse(task.startDate)));
    assert.deepStrictEqual(task.technicians, []);
    assert.deepStrictEqual(task.subTasks, []);
  });

  test('create_job gives a job with no tasks a Main Task', async () => {
    const outcome = await executeAction('create_job', { customer: CUSTOMER, title: 'Fix leaking tap' }, CTX);
    const { job, tasks } = outcome.result;

    assert.strictEqual(job.tasks, tasks, 'the job record holds the task list it was created with');
    assert.strictEqual(tasks.length, 1);
    assert.strictEqual(tasks[0].name, 'Main Task');
    assert.strictEqual(tasks[0].status, 'Not Started');
    assert.strictEqual(tasks[0].progress, 0);
    assert.ok(tasks[0].id);
    assert.deepStrictEqual(tasks[0].technicians, []);
    assert.deepStrictEqual(tasks[0].subTasks, []);
    assert.deepStrictEqual(calls, [], 'the demo business must not reach Supabase or IndexedDB');
  });

  test('create_job keeps the tasks it was given', async () => {
    const outcome = await executeAction('create_job', {
      customer: CUSTOMER,
      title: 'Rough in the new circuit',
      tasks: [{ name: 'Rough in' }, { name: 'Fit off' }],
    }, CTX);

    assert.deepStrictEqual(outcome.result.tasks.map((task) => task.name), ['Rough in', 'Fit off']);
  });

  test('the create_job description tells the model about the Main Task', () => {
    assert.match(getAction('create_job').description, /main task/i);
  });

  test('convert_quote_to_job gives a sectionless quote a Main Task', async () => {
    const quote = store.create('quotes', {
      number: 'Q-90001',
      title: 'Probe quote',
      status: 'Accepted',
      customerName: CUSTOMER,
      subtotal: 0,
      tax: 0,
      total: 0,
      sections: [],
    });

    const outcome = await executeAction('convert_quote_to_job', { quote: quote.number }, CTX);
    const { job } = outcome.result;

    assert.strictEqual(job.tasks.length, 1);
    assert.strictEqual(job.tasks[0].name, 'Main Task');
    assert.strictEqual(job.phases, job.tasks, 'the phase list is the task list');
    assert.deepStrictEqual(calls, [], 'the demo business must not reach Supabase or IndexedDB');
  });

  test('convert_quote_to_job turns quote sections into tasks', async () => {
    const quote = store.create('quotes', {
      number: 'Q-90002',
      title: 'Probe quote with sections',
      status: 'Accepted',
      customerName: CUSTOMER,
      subtotal: 0,
      tax: 0,
      total: 0,
      sections: [{ name: 'Switchboard', lineItems: [] }, { name: 'Fit off', lineItems: [] }],
    });

    const outcome = await executeAction('convert_quote_to_job', { quote: quote.number }, CTX);

    assert.deepStrictEqual(outcome.result.job.tasks.map((task) => task.name), ['Switchboard', 'Fit off']);
  });
});
