/**
 * Every record the pages can delete, brny can delete too.
 *
 * Each delete resolves exactly one record, writes it away with the same
 * `store.delete` the UI uses, and records what was left behind. The tests run
 * against the demo business, so nothing reaches Supabase, IndexedDB or a folder.
 */

import { test, describe, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert/strict';

import { store, DEMO_COMPANY_ID } from '../data/store.js';
import { supabase } from '../utils/supabase.js';
import { executeAction, getAction } from './registry.js';
import { ERROR_CODES } from './errors.js';
import './index.js';

const CTX = { source: 'eval', actor: { id: 'user_test', name: 'Test Admin', role: 'admin' } };
const CUSTOMER = 'Brny Delete Probe Pty Ltd';

describe('the assistant can delete every record type', () => {
  const saved = {};

  beforeEach(async () => {
    saved.from = supabase.from;
    supabase.from = () => ({ upsert: async () => ({}), insert: async () => ({}), delete: () => ({ eq: async () => ({}), in: async () => ({}) }) });
    store.demoMode = true;
    store.companyId = DEMO_COMPANY_ID;
    store.db = { transaction: () => { throw new Error('IndexedDB touched'); } };
    await store.initializeDemo({ id: 'user_test', name: 'Test Admin', email: 'test@example.com' });
    store.create('customers', { company: CUSTOMER, status: 'Active', type: 'Company', email: 'probe@example.com' });
  });

  afterEach(() => {
    supabase.from = saved.from;
    store.demoMode = false;
    store.db = null;
    store.clearSync();
  });

  async function makeJob(title = 'Probe job', tasks = []) {
    const { result } = await executeAction('create_job', { customer: CUSTOMER, title, tasks }, CTX);
    return result.job;
  }

  test('every delete is behind the permission that owns the record', () => {
    const expected = {
      delete_customer: { module: 'Customers', key: 'delete' },
      delete_contact: { module: 'Customers', key: 'manage_contacts' },
      delete_site: { module: 'Customers', key: 'manage_contacts' },
      delete_lead: { module: 'Leads', key: 'delete' },
      delete_quote: { module: 'Quotes', key: 'delete' },
      delete_quote_template: { module: 'Quotes', key: 'delete' },
      delete_recurring_job: { module: 'Jobs', key: 'delete' },
      delete_job_task: { module: 'Jobs', key: 'manage_tasks' },
      delete_project: { module: 'Projects', key: 'delete' },
      delete_supplier: { module: 'Suppliers', key: 'delete' },
      delete_contractor: { module: 'Contractors', key: 'edit' },
      delete_asset: { module: 'Assets', key: 'delete' },
      delete_stock_item: { module: 'Stock', key: 'delete' },
      delete_kit: { module: 'Stock', key: 'delete' },
      delete_purchase_order: { module: 'Purchase Orders', key: 'approve' },
      delete_invoice: { module: 'Invoices', key: 'void' },
      delete_document: { module: 'Documents', key: 'upload' },
      delete_timesheet: { module: 'Timesheets', key: 'edit_all' },
      remove_job_material: { module: 'Jobs', key: 'manage_materials' },
    };
    for (const [name, permission] of Object.entries(expected)) {
      const action = getAction(name);
      assert.ok(action, `${name} is registered`);
      assert.deepStrictEqual(action.permission, permission, name);
      assert.strictEqual(action.risky, true, `${name} must ask first`);
    }
    assert.strictEqual(getAction('delete_notification').risky, false, 'housekeeping does not need a card');
    assert.strictEqual(getAction('delete_todo').risky, false, 'housekeeping does not need a card');
  });

  test('delete_lead removes the lead and keeps any quote it became', async () => {
    const { result: lead } = await executeAction('create_lead', { title: 'Bad enquiry', customer: CUSTOMER }, CTX);
    store.create('quotes', { customerId: lead.lead.customerId, title: 'Kept quote', leadId: lead.lead.id, status: 'Draft' });

    const outcome = await executeAction('delete_lead', { lead: lead.lead.number, reason: 'Duplicate' }, CTX);

    assert.strictEqual(store.getById('leads', lead.lead.id), null);
    assert.strictEqual(outcome.result.keptQuotes, 1);
    assert.match(outcome.result.summary, /1 converted quote kept/);
  });

  test('delete_quote removes the quote', async () => {
    const { result } = await executeAction('create_quote', { customer: CUSTOMER, title: 'Probe quote', items: [{ description: 'Labour', rate: 100 }] }, CTX);

    const outcome = await executeAction('delete_quote', { quote: result.quote.number }, CTX);

    assert.strictEqual(store.getById('quotes', result.quote.id), null);
    assert.strictEqual(outcome.result.quote.total, 110);
  });

  test('delete_quote_template removes only the template', async () => {
    const created = await executeAction('create_quote_template', { name: 'Standard install', items: [{ description: 'Labour', rate: 200 }] }, CTX);
    const quote = await executeAction('create_quote', { customer: CUSTOMER, title: 'Real quote', items: [{ description: 'Labour', rate: 200 }] }, CTX);

    const outcome = await executeAction('delete_quote_template', { template: 'Standard install' }, CTX);

    assert.strictEqual(store.getById('quoteTemplates', created.result.template.id), null);
    assert.ok(store.getById('quotes', quote.result.quote.id), 'quotes already created stay');
    assert.match(outcome.result.summary, /Standard install/);
  });

  test('delete_project unfiles its jobs instead of deleting them', async () => {
    const job = await makeJob('Warehouse job');
    const { result } = await executeAction('create_project', { customer: CUSTOMER, name: 'Warehouse fit-out' }, CTX);
    await executeAction('update_job', { job: job.number, project: 'Warehouse fit-out' }, CTX);

    const outcome = await executeAction('delete_project', { project: 'Warehouse fit-out' }, CTX);

    assert.strictEqual(store.getById('projects', result.project.id), null);
    assert.strictEqual(outcome.result.unfiledJobs.length, 1);
    assert.strictEqual(store.getById('jobs', job.id).projectId, null);
  });

  test('delete_supplier and delete_contractor remove the directory records', async () => {
    const supplier = await executeAction('create_supplier', { name: 'Probe Electrical Wholesale' }, CTX);
    const contractor = await executeAction('create_contractor', { businessName: 'Probe Contracting', contactName: 'Sam Lee' }, CTX);

    await executeAction('delete_supplier', { supplier: 'Probe Electrical Wholesale' }, CTX);
    await executeAction('delete_contractor', { contractor: 'Probe Contracting' }, CTX);

    assert.strictEqual(store.getById('suppliers', supplier.result.supplier.id), null);
    assert.strictEqual(store.getById('contractors', contractor.result.contractor.id), null);
  });

  test('delete_asset removes the asset and its plans', async () => {
    const asset = store.create('assets', { name: 'Probe HVAC unit', status: 'Active' });
    store.create('maintenancePlans', { name: 'Quarterly service', assetId: asset.id, status: 'Active' });
    const plansBefore = (store.getAll('maintenancePlans') || []).length;

    const outcome = await executeAction('delete_asset', { asset: 'Probe HVAC unit' }, CTX);

    assert.strictEqual(store.getById('assets', asset.id), null);
    assert.strictEqual(outcome.result.removedPlans, 1);
    assert.strictEqual((store.getAll('maintenancePlans') || []).length, plansBefore - 1);
    assert.strictEqual((store.getAll('maintenancePlans') || []).filter((plan) => plan.assetId === asset.id).length, 0);
  });

  test('delete_stock_item and delete_kit remove their own records', async () => {
    const stock = await executeAction('create_stock_item', { name: 'Probe RCBO', sku: 'PR-1' }, CTX);
    const kit = await executeAction('create_kit', { name: 'Probe kit', items: [{ name: 'Probe RCBO', stockItem: 'Probe RCBO', quantity: 2 }] }, CTX);

    await executeAction('delete_stock_item', { item: 'Probe RCBO' }, CTX);
    await executeAction('delete_kit', { kit: 'Probe kit' }, CTX);

    assert.strictEqual(store.getById('stock', stock.result.item.id), null);
    assert.strictEqual(store.getById('kits', kit.result.kit.id), null);
  });

  test('delete_purchase_order removes a draft', async () => {
    await executeAction('create_supplier', { name: 'PO Supplier' }, CTX);
    const { result } = await executeAction('create_purchase_order', { supplier: 'PO Supplier', items: [{ description: 'Cable', quantity: 2, unitCost: 50 }] }, CTX);

    const outcome = await executeAction('delete_purchase_order', { purchaseOrder: result.purchaseOrder.number }, CTX);

    assert.strictEqual(store.getById('purchaseOrders', result.purchaseOrder.id), null);
    assert.strictEqual(outcome.result.wasIssued, false);
  });

  test('delete_invoice removes the invoice and releases the job', async () => {
    const job = await makeJob('Invoice probe');
    const invoice = store.create('invoices', { number: 'INV-90001', jobId: job.id, jobNumber: job.number, customerName: CUSTOMER, status: 'Draft', total: 110 });
    store.update('jobs', job.id, { status: 'Invoiced' });

    const outcome = await executeAction('delete_invoice', { invoice: 'INV-90001' }, CTX);

    assert.strictEqual(store.getById('invoices', invoice.id), null);
    assert.strictEqual(outcome.result.jobReleased, job.number);
    assert.notStrictEqual(store.getById('jobs', job.id).status, 'Invoiced');
  });

  test('a document can be filed, moved and deleted', async () => {
    const added = await executeAction('add_document', { name: 'Site photos', folder: 'Jobs', notes: 'Before shots' }, CTX);
    assert.strictEqual(added.result.document.folder, 'Jobs');

    const moved = await executeAction('move_document', { document: 'Site photos', toRoot: true }, CTX);
    assert.strictEqual(moved.result.document.folder, '');

    await executeAction('delete_document', { document: 'Site photos' }, CTX);
    assert.strictEqual(store.getById('documents', added.result.document.id), null);
  });

  test('log_timesheet creates a booked shift and delete_timesheet removes it', async () => {
    const job = await makeJob('Shift probe');
    const logged = await executeAction('log_timesheet', {
      job: job.number,
      task: 'Main Task',
      start: '2026-03-04T07:30',
      finish: '2026-03-04T15:30',
      description: 'Rough in',
    }, CTX);
    assert.strictEqual(logged.result.timesheet.hours, 8);

    const updated = await executeAction('update_timesheet', { timesheet: job.number, description: 'Rough in and fit off' }, CTX);
    assert.strictEqual(updated.result.timesheet.description, 'Rough in and fit off');

    const outcome = await executeAction('delete_timesheet', { timesheet: job.number }, CTX);
    assert.strictEqual(store.getById('timesheets', logged.result.timesheet.id), null);
    assert.strictEqual(outcome.result.timesheet.hours, 8);
  });

  test('delete_notification and delete_todo clear housekeeping records', async () => {
    const raised = await executeAction('raise_notification', { title: 'Probe fault', description: 'Check it' }, CTX);
    const todo = await executeAction('add_todo', { title: 'Call the probe customer' }, CTX);

    await executeAction('delete_notification', { notification: raised.result.notification.number }, CTX);
    await executeAction('delete_todo', { todo: 'Call the probe customer' }, CTX);

    assert.strictEqual(store.getById('notifications', raised.result.notification.id), null);
    assert.strictEqual(store.getById('todos', todo.result.todo.id), null);
  });

  test('delete_job_task removes the task and its sub-tasks', async () => {
    const job = await makeJob('Task probe', [{ name: 'Rough in', estimatedHours: 2 }]);
    await executeAction('add_job_task', { job: job.number, name: 'Run cable', parent: 'Rough in', estimatedHours: 1 }, CTX);

    const outcome = await executeAction('delete_job_task', { job: job.number, task: 'Rough in' }, CTX);

    assert.strictEqual(outcome.result.subTasks, 1);
    assert.deepStrictEqual(store.getById('jobs', job.id).tasks, []);
    assert.match(outcome.summary, /and 1 sub-task/);
  });

  test('remove_job_material takes the line back off the job', async () => {
    const job = await makeJob('Materials probe');
    await executeAction('create_stock_item', { name: 'Probe cable', sku: 'PC-1', quantity: 10, location: 'Van 1 — Dale' }, CTX);
    await executeAction('add_job_material', { job: job.number, part: 'Probe cable', quantity: 2, location: 'Van 1 — Dale' }, CTX);

    const outcome = await executeAction('remove_job_material', { job: job.number, part: 'Probe cable' }, CTX);

    assert.deepStrictEqual(store.getById('jobs', job.id).materials, []);
    assert.strictEqual(outcome.result.returnedToStock, true);
    assert.strictEqual(store.getAll('stock').find((item) => item.sku === 'PC-1').quantity, 10);
  });

  test('brny is stopped for approval on a destructive delete', async () => {
    const job = await makeJob('Approval probe');
    await assert.rejects(
      executeAction('delete_job_task', { job: job.number, task: 'Main Task' }, { ...CTX, source: 'brny' }),
      (error) => error.code === ERROR_CODES.APPROVAL_REQUIRED,
    );
    assert.strictEqual(store.getById('jobs', job.id).tasks.length, 1);
  });
});
