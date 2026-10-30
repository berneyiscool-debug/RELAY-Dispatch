/**
 * An invoice's labour can be priced from the job's tasklist estimates or from
 * the hours booked against it in timesheets.
 *
 * `hoursSource: "booked"` is the request the UI sends when the person picks
 * "Hours booked" in the modal before an invoice is drafted. A job with no time
 * recorded is refused rather than quietly falling back to the estimates, and a
 * quoted job never bills booked hours because its labour is already priced.
 *
 * The actions run against the demo business, as in `data/demoMode.test.js`, so
 * nothing here reaches Supabase, the folder or IndexedDB.
 */

import { test, describe, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert/strict';

import { store, DEMO_COMPANY_ID } from '../data/store.js';
import { supabase } from '../utils/supabase.js';
import { executeAction } from './registry.js';
import { ERROR_CODES } from './errors.js';
import './index.js';

const CTX = { source: 'eval', actor: { id: 'user_test', name: 'Test Admin', role: 'admin' } };
const CUSTOMER = 'Invoice Hours Source Pty Ltd';

describe('invoicing a job from its tasklist estimates or its booked hours', () => {
  beforeEach(async () => {
    supabase.from = () => ({ upsert: async () => ({}), insert: async () => ({}), delete: () => ({ eq: async () => ({}), in: async () => ({}) }) });
    store.demoMode = true;
    store.companyId = DEMO_COMPANY_ID;
    store.db = { transaction: () => { throw new Error('IndexedDB touched'); } };
    await store.initializeDemo({ id: 'user_test', name: 'Test Admin', email: 'test@example.com' });
    store.create('customers', { company: CUSTOMER, status: 'Active', type: 'Company' });
  });

  afterEach(() => {
    store.demoMode = false;
    store.db = null;
    store.clearSync();
  });

  /** A job estimated at 10 hours, with nothing booked against it yet. */
  async function jobWithEstimate(title = 'Switchboard upgrade') {
    const outcome = await executeAction('create_job', {
      customer: CUSTOMER,
      title,
      estimatedHours: 10,
      tasks: [{ name: 'Rough in', estimatedHours: 6 }, { name: 'Fit off', estimatedHours: 4 }],
    }, CTX);
    return outcome.result.job;
  }

  /** Book hours against a job the way a timesheet entry does. */
  function bookHours(job, hours) {
    return store.create('timesheets', {
      jobId: job.id,
      jobNumber: job.number,
      jobTitle: job.title,
      technicianId: 'tech_probe',
      technicianName: 'Probe Tech',
      taskName: 'Main Task',
      date: '2026-10-14',
      hours,
      status: 'Pending',
    });
  }

  const labourLineOf = (invoice) =>
    invoice.sections.flatMap((section) => section.lineItems).find((line) => line.type === 'labor');

  test('the default keeps pricing labour from the tasklist estimates', async () => {
    const job = await jobWithEstimate();

    const invoice = (await executeAction('create_invoice', { job: job.number }, CTX)).result.invoice;

    assert.strictEqual(invoice.hoursSource, '', 'a blank hoursSource means the estimates were billed');
    assert.strictEqual(labourLineOf(invoice).qty, 10);
    assert.match(labourLineOf(invoice).description, /10\.00 hrs/);
  });

  test('asking for booked hours prices the labour from the timesheets', async () => {
    const job = await jobWithEstimate();
    bookHours(job, 12.5);
    bookHours(job, 2);

    const invoice = (await executeAction('create_invoice', { job: job.number, hoursSource: 'booked' }, CTX)).result.invoice;

    assert.strictEqual(invoice.hoursSource, 'booked');
    assert.strictEqual(labourLineOf(invoice).qty, 14.5, 'estimated hours must not leak into a booked invoice');
    assert.match(labourLineOf(invoice).description, /14\.50 hrs/);
  });

  test('a booked invoice refuses a job with no time recorded', async () => {
    const job = await jobWithEstimate();

    await assert.rejects(
      () => executeAction('create_invoice', { job: job.number, hoursSource: 'booked' }, CTX),
      (error) => {
        assert.strictEqual(error.code, ERROR_CODES.CONFLICT);
        assert.match(error.message, /no hours booked/i);
        return true;
      }
    );

    assert.strictEqual(
      store.getAll('invoices').filter((invoice) => invoice.jobId === job.id).length,
      0,
      'a refused invoice must not leave a draft behind'
    );
  });

  test('a progress invoice records which hours its labour came from', async () => {
    const job = await jobWithEstimate();
    bookHours(job, 4);

    const booked = (await executeAction('create_invoice', { job: job.number, type: 'Progress', percent: 50, hoursSource: 'booked' }, CTX)).result.invoice;
    assert.strictEqual(booked.hoursSource, 'booked');

    const estimated = (await executeAction('create_invoice', { job: job.number, type: 'Progress', percent: 25 }, CTX)).result.invoice;
    assert.strictEqual(estimated.hoursSource, '');
  });

  test('a deposit invoice is never priced from booked hours', async () => {
    const job = await jobWithEstimate();
    bookHours(job, 4);

    await assert.rejects(
      () => executeAction('create_invoice', { job: job.number, type: 'Deposit', percent: 30, hoursSource: 'booked' }, CTX),
      (error) => {
        assert.strictEqual(error.code, ERROR_CODES.CONFLICT);
        assert.match(error.message, /deposit/i);
        return true;
      }
    );
  });

  test('a quoted job refuses booked hours because its labour is already priced', async () => {
    const job = await jobWithEstimate('Quoted rewire');
    bookHours(job, 4);
    store.create('quotes', {
      number: 'Q-90001',
      jobId: job.id,
      jobNumber: job.number,
      customerId: job.customerId,
      customerName: job.customerName,
      title: 'Rewire the shed',
      status: 'Accepted',
      sections: [{
        id: 'sec_quote_1',
        name: 'Main Phase',
        lineItems: [{ id: 'li_quote_1', description: 'Rewire the shed', type: 'labor', qty: 1, rate: 2200, total: 2200 }],
      }],
      subtotal: 2200,
      total: 2420,
    });

    await assert.rejects(
      () => executeAction('create_invoice', { job: job.number, hoursSource: 'booked' }, CTX),
      (error) => {
        assert.strictEqual(error.code, ERROR_CODES.CONFLICT);
        assert.match(error.message, /quote/i);
        return true;
      }
    );

    const invoice = (await executeAction('create_invoice', { job: job.number }, CTX)).result.invoice;
    assert.strictEqual(invoice.hoursSource, '');
    assert.strictEqual(labourLineOf(invoice).id, 'li_quote_1', 'a quoted invoice carries the quote\'s own lines');
    assert.strictEqual(labourLineOf(invoice).rate, 2200);
  });
});

describe('a customer\'s payment terms and credit limit on a drafted invoice', () => {
  const TERMS_CUSTOMER = 'Invoice Terms Probe Pty Ltd';

  beforeEach(async () => {
    supabase.from = () => ({ upsert: async () => ({}), insert: async () => ({}), delete: () => ({ eq: async () => ({}), in: async () => ({}) }) });
    store.demoMode = true;
    store.companyId = DEMO_COMPANY_ID;
    store.db = { transaction: () => { throw new Error('IndexedDB touched'); } };
    await store.initializeDemo({ id: 'user_test', name: 'Test Admin', email: 'test@example.com' });
    store.create('customers', {
      company: TERMS_CUSTOMER,
      status: 'Active',
      type: 'Company',
      paymentTermsDays: 7,
      creditLimit: 1000,
    });
  });

  afterEach(() => {
    store.demoMode = false;
    store.db = null;
    store.clearSync();
  });

  /** A job worth about $935 inc GST at the default rate: inside a $1,000 limit. */
  async function jobFor(customer, estimatedHours = 10) {
    const outcome = await executeAction('create_job', { customer, title: 'Terms probe job', estimatedHours }, CTX);
    return outcome.result.job;
  }

  const daysUntil = (value) => Math.round((new Date(value).getTime() - Date.now()) / 86400000);

  test('the due date follows the customer\'s terms, not a flat 30 days', async () => {
    const job = await jobFor(TERMS_CUSTOMER);

    const invoice = (await executeAction('create_invoice', { job: job.number }, CTX)).result.invoice;

    assert.strictEqual(daysUntil(invoice.dueDate), 7);
  });

  test('a customer with no terms of their own keeps the 30-day default', async () => {
    store.create('customers', { company: 'Invoice No Terms Pty Ltd', status: 'Active', type: 'Company' });
    const job = await jobFor('Invoice No Terms Pty Ltd');

    const invoice = (await executeAction('create_invoice', { job: job.number }, CTX)).result.invoice;

    assert.strictEqual(daysUntil(invoice.dueDate), 30);
  });

  test('an explicit dueInDays still wins over the account terms', async () => {
    const job = await jobFor(TERMS_CUSTOMER);

    const invoice = (await executeAction('create_invoice', { job: job.number, dueInDays: 45 }, CTX)).result.invoice;

    assert.strictEqual(daysUntil(invoice.dueDate), 45);
  });

  test('a draft inside the limit is drafted quietly', async () => {
    const job = await jobFor(TERMS_CUSTOMER, 4);

    const result = (await executeAction('create_invoice', { job: job.number }, CTX)).result;

    assert.strictEqual(result.creditWarning, '');
    assert.doesNotMatch(result.summary, /credit limit/i);
  });

  test('a draft over the limit still gets drafted, and the summary says how far over', async () => {
    const job = await jobFor(TERMS_CUSTOMER, 20); // ~$1,870 inc GST against a $1,000 limit

    const result = (await executeAction('create_invoice', { job: job.number }, CTX)).result;

    assert.ok(result.invoice, 'a credit limit warns, it never blocks the draft');
    assert.match(result.creditWarning, /\$1,000\.00 credit limit/);
    assert.match(result.creditWarning, /over the limit/);
    assert.match(result.summary, /credit limit/);
  });

  test('money already owed counts towards the limit', async () => {
    const job = await jobFor(TERMS_CUSTOMER);
    const first = (await executeAction('create_invoice', { job: job.number }, CTX)).result.invoice;

    // The first invoice is only debt once it leaves Draft.
    await executeAction('send_invoice', { invoice: first.number }, CTX);
    const second = (await executeAction('create_invoice', { job: job.number }, CTX)).result;

    assert.match(second.creditWarning, /already owes/);
  });
});
