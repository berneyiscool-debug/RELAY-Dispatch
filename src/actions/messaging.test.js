/**
 * brny can hand work to a subcontractor and email its own people.
 *
 * Run against the demo business, whose email is simulated: a send is logged and
 * reported as sent, and nothing leaves the machine.
 */

import { test, describe, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert/strict';

import { store, DEMO_COMPANY_ID } from '../data/store.js';
import { supabase } from '../utils/supabase.js';
import { executeAction } from './registry.js';
import { ERROR_CODES } from './errors.js';
import './index.js';

const CTX = { source: 'eval', actor: { id: 'user_test', name: 'Test Admin', role: 'admin' } };
const CUSTOMER = 'Brny Messaging Probe Pty Ltd';

describe('assistant contractor and staff messaging', () => {
  const saved = {};
  let contractor;
  let job;

  beforeEach(async () => {
    saved.from = supabase.from;
    supabase.from = () => ({ upsert: async () => ({}), insert: async () => ({}), delete: () => ({ eq: async () => ({}), in: async () => ({}) }) });
    store.demoMode = true;
    store.companyId = DEMO_COMPANY_ID;
    store.db = { transaction: () => { throw new Error('IndexedDB touched'); } };
    await store.initializeDemo({ id: 'user_test', name: 'Test Admin', email: 'test@example.com' });
    store.create('customers', { company: CUSTOMER, status: 'Active', type: 'Company', email: 'customer@example.com' });
    contractor = store.create('contractors', { businessName: 'Probe Data Co', contactName: 'Dana', email: 'dana@probe.example', active: true });
    store.create('technicians', { name: 'Morgan Probe', username: 'morgan', email: 'morgan@probe.relay.internal', backupEmail: 'morgan@example.com' });
    job = (await executeAction('create_job', {
      customer: CUSTOMER,
      title: 'Data cabling',
      tasks: [{ name: 'Rough in', estimatedHours: 4 }, { name: 'Terminate', estimatedHours: 3 }],
    }, CTX)).result.job;
  });

  afterEach(() => {
    supabase.from = saved.from;
    store.demoMode = false;
    store.db = null;
    store.clearSync();
  });

  test('assign_contractor puts them on a task the way the job page does', async () => {
    const { result } = await executeAction('assign_contractor', { job: job.number, contractor: 'Probe Data', task: 'Terminate' }, CTX);
    assert.deepStrictEqual(result.tasks, ['Terminate']);
    const saved = store.getById('jobs', job.id);
    assert.deepStrictEqual(saved.tasks[1].assignedContractorIds, [contractor.id]);
    assert.ok(!saved.tasks[0].assignedContractorIds, 'other tasks are untouched');
    assert.strictEqual(saved.historyLog[0].action, 'contractor_assigned');

    const again = await executeAction('assign_contractor', { job: job.number, contractor: 'Probe Data', task: 'Terminate' }, CTX);
    assert.strictEqual(again.result.changed, false);
  });

  test('without a task they go on every top-level task, and remove takes them off', async () => {
    await executeAction('assign_contractor', { job: job.number, contractor: 'Probe Data' }, CTX);
    assert.ok(store.getById('jobs', job.id).tasks.every((t) => t.assignedContractorIds.includes(contractor.id)));
    await executeAction('assign_contractor', { job: job.number, contractor: 'Probe Data', remove: true }, CTX);
    assert.ok(store.getById('jobs', job.id).tasks.every((t) => !t.assignedContractorIds.includes(contractor.id)));
  });

  test('send_contractor_portal_link needs approval, saves the token, and emails the invite', async () => {
    await assert.rejects(
      executeAction('send_contractor_portal_link', { contractor: 'Probe Data' }, { ...CTX, source: 'brny' }),
      (error) => error.code === ERROR_CODES.APPROVAL_REQUIRED,
    );
    const { result } = await executeAction('send_contractor_portal_link', { contractor: 'Probe Data' }, CTX);
    assert.strictEqual(result.emailed, true);
    assert.strictEqual(result.to, 'dana@probe.example');
    const token = store.getById('contractors', contractor.id).portalToken;
    assert.match(token, /^c_pt_[0-9a-f]{32}$/);
    assert.ok(result.url.endsWith(`/contractor-portal/${token}`));
  });

  test('a contractor with no email still gets a link, and the reply says nothing was emailed', async () => {
    store.update('contractors', contractor.id, { email: '' });
    const { result } = await executeAction('send_contractor_portal_link', { contractor: 'Probe Data' }, CTX);
    assert.strictEqual(result.emailed, false);
    assert.match(result.summary, /NO email/);
    assert.ok(result.url);
  });

  test('send_email reaches staff at their backup address, never the internal sign-in one', async () => {
    const { result } = await executeAction('send_email', { to: 'Morgan', subject: 'Tomorrow', message: 'Start at 7 at the depot.' }, CTX);
    assert.strictEqual(result.emailed, true);
    assert.strictEqual(result.to, 'morgan@example.com');
  });

  test('send_email will not write to a customer', async () => {
    await assert.rejects(
      executeAction('send_email', { to: CUSTOMER, subject: 'Hi', message: 'Hello' }, CTX),
      (error) => error.code === ERROR_CODES.INVALID_INPUT,
    );
  });
});
