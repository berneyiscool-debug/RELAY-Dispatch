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

  test('create_job keeps the task descriptions it was given', async () => {
    const outcome = await executeAction('create_job', {
      customer: CUSTOMER,
      title: 'Rough in the new circuit',
      tasks: [
        { name: 'Rough in', description: 'Pull the new circuit through to the board.' },
        { name: 'Fit off', description: '   ' },
      ],
    }, CTX);

    const [roughIn, fitOff] = outcome.result.tasks;
    assert.strictEqual(roughIn.description, 'Pull the new circuit through to the board.');
    assert.ok(!('description' in fitOff), 'an empty description must not add the key the job screens do not write');
  });

  test('a job estimate lands on the task list so the Tasks tab is not blank', async () => {
    const outcome = await executeAction('create_job', {
      customer: CUSTOMER,
      title: 'Switchboard upgrade',
      description: 'Replace the old board and re-certify.',
      estimatedHours: 6,
    }, CTX);

    const { job, tasks } = outcome.result;
    assert.strictEqual(job.estimatedHours, 6);
    assert.strictEqual(job.description, 'Replace the old board and re-certify.');
    assert.strictEqual(tasks[0].estimatedHours, 6, 'a job-level estimate alone leaves every task unbookable');
  });

  test('a job estimate is shared across several named tasks', async () => {
    const outcome = await executeAction('create_job', {
      customer: CUSTOMER,
      title: 'Full rewire',
      estimatedHours: 10,
      tasks: [{ name: 'Rough in' }, { name: 'Fit off' }, { name: 'Test and tag' }],
    }, CTX);

    const hours = outcome.result.tasks.map((task) => task.estimatedHours);
    assert.deepStrictEqual(hours, [3.33, 3.33, 3.34]);
    assert.strictEqual(outcome.result.job.estimatedHours, 10);
    assert.strictEqual(hours.reduce((sum, value) => sum + value, 0), 10, 'the parts must add back to the whole');
  });

  test('task hours roll up into the job estimate when no job figure was given', async () => {
    const outcome = await executeAction('create_job', {
      customer: CUSTOMER,
      title: 'Two-part job',
      tasks: [{ name: 'Rough in', estimatedHours: 2 }, { name: 'Fit off', estimatedHours: 3 }],
    }, CTX);

    assert.strictEqual(outcome.result.job.estimatedHours, 5, 'the scheduler reads the job figure, not the task list');
    assert.deepStrictEqual(outcome.result.tasks.map((task) => task.estimatedHours), [2, 3]);
  });

  test('a job estimate and task hours given together are left as written', async () => {
    const outcome = await executeAction('create_job', {
      customer: CUSTOMER,
      title: 'Estimate and task hours',
      estimatedHours: 8,
      tasks: [{ name: 'Rough in', estimatedHours: 2 }],
    }, CTX);

    assert.strictEqual(outcome.result.job.estimatedHours, 8);
    assert.strictEqual(outcome.result.tasks[0].estimatedHours, 2);
  });

  test('add_job_task writes the description and hours it was given', async () => {
    const created = await executeAction('create_job', { customer: CUSTOMER, title: 'Add task probe' }, CTX);

    const outcome = await executeAction('add_job_task', {
      job: created.result.job.number,
      name: 'Fit off',
      description: 'Terminate and test the new circuit.',
      estimatedHours: 2.5,
    }, CTX);

    assert.strictEqual(outcome.result.task.description, 'Terminate and test the new circuit.');
    assert.strictEqual(outcome.result.task.estimatedHours, 2.5);
    assert.deepStrictEqual(outcome.result.tasks.map((task) => task.name), ['Main Task', 'Fit off']);
  });

  test('update_job_task changes a task description', async () => {
    const created = await executeAction('create_job', {
      customer: CUSTOMER,
      title: 'Update task probe',
      tasks: [{ name: 'Rough in', description: 'Old wording.' }],
    }, CTX);

    const outcome = await executeAction('update_job_task', {
      job: created.result.job.number,
      task: 'Rough in',
      description: 'New wording.',
    }, CTX);

    assert.deepStrictEqual(outcome.result.fields, ['description']);
    assert.strictEqual(outcome.result.task.description, 'New wording.');
  });

  test('the create_job description tells the model about the Main Task', () => {
    assert.match(getAction('create_job').description, /main task/i);
  });

  test('the create_job description asks for a name, a description and task hours', () => {
    const { description } = getAction('create_job');
    assert.match(description, /name the job/i);
    assert.match(description, /describe the work/i);
    assert.match(description, /description/i);
    assert.match(description, /hours/i);
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
