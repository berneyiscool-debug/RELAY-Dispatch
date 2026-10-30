/**
 * The rest of the app: settings, user types, catalogues, calendars, clocks,
 * forms, activities and reports.
 *
 * Everything runs against the demo business, so no write reaches Supabase,
 * IndexedDB or a mail server.
 */

import { test, describe, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert/strict';

import { store, DEMO_COMPANY_ID } from '../data/store.js';
import { supabase } from '../utils/supabase.js';
import { executeAction, getAction } from './registry.js';
import { ERROR_CODES } from './errors.js';
import { setSessionUser } from '../pages/auth/session.js';
import './index.js';

const CTX = { source: 'eval', actor: { id: 'user_admin', name: 'Test Admin', role: 'admin' } };
const USER = { id: 'user_admin', name: 'Test Admin', email: 'admin@example.com', role: 'admin', companyId: DEMO_COMPANY_ID };

function nextMonday() {
  const date = new Date();
  const add = ((8 - date.getDay()) % 7) || 7;
  date.setDate(date.getDate() + add);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

function todayKey() {
  const date = new Date();
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

describe('the assistant can run the rest of the app', () => {
  const saved = {};
  const memory = new Map();

  beforeEach(async () => {
    saved.from = supabase.from;
    saved.localStorage = globalThis.localStorage;
    supabase.from = () => ({ upsert: async () => ({}), insert: async () => ({}), delete: () => ({ eq: async () => ({}), in: async () => ({}) }) });
    globalThis.localStorage = {
      getItem: (key) => (memory.has(key) ? memory.get(key) : null),
      setItem: (key, value) => memory.set(key, String(value)),
      removeItem: (key) => memory.delete(key),
      clear: () => memory.clear(),
    };
    memory.clear();
    store.demoMode = true;
    store.companyId = DEMO_COMPANY_ID;
    store.db = { transaction: () => { throw new Error('IndexedDB touched'); } };
    await store.initializeDemo({ id: USER.id, name: USER.name, email: USER.email });
    setSessionUser(USER);
  });

  afterEach(() => {
    supabase.from = saved.from;
    globalThis.localStorage = saved.localStorage;
    store.demoMode = false;
    store.db = null;
    store.clearSync();
  });

  test('settings can be read and changed tab by tab', async () => {
    await executeAction('update_company_details', { name: 'Probe Electrical', abn: '51 234 567 890', phone: '0400 000 000' }, CTX);
    assert.strictEqual(store.getSettings().name, 'Probe Electrical');

    await executeAction('update_tax_and_rates', { taxRate: 15, laborRounding: 5, laborRates: [{ name: 'Standard', rate: 99 }, { name: 'After hours', rate: 150, isDefault: true }] }, CTX);
    assert.strictEqual(store.getSettings().taxRate, 15);
    assert.strictEqual(store.getSettings().laborRounding, 5);
    assert.strictEqual(store.getSettings().laborRates.find((rate) => rate.isDefault).name, 'After hours');

    await executeAction('update_materials_pricing', { materialCategories: ['Cable', 'Switchgear'], jobTypes: ['Service'] }, CTX);
    assert.deepStrictEqual(store.getSettings().materialCategories, ['Cable', 'Switchgear']);

    await executeAction('update_portal_settings', { customerEnabled: false, customerWelcome: 'Hello' }, CTX);
    assert.strictEqual(store.getSettings().enableCustomerPortal, false);

    await executeAction('update_email_settings', { fromName: 'Probe Office', quote: false, remindersEnabled: true, afterDays: 3 }, CTX);
    assert.strictEqual(store.getSettings().mailer.fromName, 'Probe Office');
    assert.strictEqual(store.getSettings().mailer.enabledFor.quote, false);
    assert.strictEqual(store.getSettings().mailer.reminders.afterDays, 3);

    await executeAction('update_document_theme', { quotePrefix: 'QU-', invoiceStartingNumber: 42 }, CTX);
    assert.strictEqual(store.getSettings().documentTheme.quotePrefix, 'QU-');
    assert.strictEqual(store.getSettings().documentTheme.invoiceStartingNumber, 42);

    const read = await executeAction('get_company_settings', {}, CTX);
    assert.strictEqual(read.result.company.name, 'Probe Electrical');
    assert.strictEqual(read.result.tax.rate, 15);
  });

  test('user types can be created, re-permissioned and deleted', async () => {
    await executeAction('create_user_type', { name: 'Coordinator', description: 'Runs the board', template: 'Technician' }, CTX);
    const created = store.getAll('userTypes').find((type) => type.name === 'Coordinator');
    assert.ok(created);
    assert.strictEqual(created.permissions.find((row) => row.module === 'Jobs').create, false);

    await executeAction('set_user_type_permissions', { userType: 'Coordinator', permissions: { Jobs: ['view', 'create'] } }, CTX);
    const updated = store.getAll('userTypes').find((type) => type.name === 'Coordinator');
    assert.strictEqual(updated.permissions.find((row) => row.module === 'Jobs').create, true);

    await executeAction('update_user_type', { userType: 'Coordinator', name: 'Service Coordinator' }, CTX);
    const listed = await executeAction('list_user_types', {}, CTX);
    assert.ok(listed.result.userTypes.some((type) => type.name === 'Service Coordinator'));

    await executeAction('delete_user_type', { userType: 'Service Coordinator', reason: 'Not used' }, CTX);
    assert.ok(!store.getAll('userTypes').some((type) => type.name === 'Service Coordinator'));
  });

  test('my profile and brny personality can be changed', async () => {
    const before = await executeAction('get_my_profile', {}, CTX);
    assert.strictEqual(before.result.profile.name, 'Test Admin');

    await executeAction('update_my_profile', { name: 'Probe Admin' }, CTX);
    assert.strictEqual((await executeAction('get_my_profile', {}, CTX)).result.profile.name, 'Probe Admin');

    await executeAction('set_my_start_location', { address: '1 Probe Street' }, CTX);
    assert.strictEqual((await executeAction('get_my_profile', {}, CTX)).result.profile.startLocation, '1 Probe Street');

    await executeAction('set_brny_personality', { personality: 'brief' }, CTX);
    assert.strictEqual((await executeAction('get_my_profile', {}, CTX)).result.profile.personality, 'brief');
  });

  test('storage locations, location types and kit types can be managed', async () => {
    await executeAction('create_location_type', { name: 'Test Bay' }, CTX);
    await executeAction('create_storage_location', { name: 'Probe Bay 1', type: 'Test Bay' }, CTX);
    const locations = await executeAction('list_storage_locations', {}, CTX);
    assert.ok(locations.result.locations.some((location) => location.name === 'Probe Bay 1'));

    await executeAction('update_storage_location', { location: 'Probe Bay 1', name: 'Probe Bay 2' }, CTX);
    assert.ok(store.getAll('storageLocations').some((location) => location.name === 'Probe Bay 2'));
    await executeAction('delete_storage_location', { location: 'Probe Bay 2' }, CTX);
    await executeAction('delete_location_type', { locationType: 'Test Bay' }, CTX);

    await executeAction('create_kit_type', { name: 'Test Kits' }, CTX);
    await executeAction('create_kit', { name: 'Probe Test Kit', items: [{ name: 'Part' }], category: 'Test Kits' }, CTX);
    await executeAction('update_kit_type', { kitType: 'Test Kits', name: 'Test Kits 2' }, CTX);
    assert.ok(store.getAll('kits').some((kit) => kit.category === 'Test Kits 2'));
  });

  test('cost centres and tasklist templates can be managed', async () => {
    await executeAction('create_cost_center', { code: 'prb', name: 'Probe Division' }, CTX);
    await executeAction('update_cost_center', { costCenter: 'PRB', name: 'Probe Division 2' }, CTX);
    const centers = await executeAction('list_cost_centers', {}, CTX);
    assert.ok(centers.result.costCenters.some((center) => center.name === 'Probe Division 2'));

    await executeAction('create_task_template', {
      name: 'Probe tasklist',
      tasks: [{ name: 'Rough in', estimatedHours: 2, subTasks: [{ name: 'Pull cable', estimatedHours: 1 }] }],
    }, CTX);
    const template = store.getAll('taskTemplates').find((row) => row.name === 'Probe tasklist');
    assert.strictEqual(template.tasks[0].subTasks.length, 1);

    await executeAction('update_task_template', { template: 'Probe tasklist', tasks: [{ name: 'Fit off', estimatedHours: 1 }] }, CTX);
    assert.strictEqual(store.getAll('taskTemplates').find((row) => row.name === 'Probe tasklist').tasks[0].name, 'Fit off');
    await executeAction('delete_task_template', { template: 'Probe tasklist' }, CTX);
  });

  test('a form template can be built, attached, filled and removed', async () => {
    await executeAction('create_form_template', {
      name: 'Probe safety check',
      sections: [{ title: 'Site', fields: [
        { type: 'text', label: 'Site contact', required: true },
        { type: 'select', label: 'Risk level', options: ['Low', 'High'] },
      ] }],
    }, CTX);
    const templates = await executeAction('list_form_templates', {}, CTX);
    assert.ok(templates.result.templates.some((template) => template.name === 'Probe safety check'));

    const { result } = await executeAction('create_job', { customer: 'Form Probe Customer', createCustomer: true, title: 'Form job' }, CTX);
    await executeAction('attach_form_to_job', { job: result.job.number, form: 'Probe safety check' }, CTX);
    await executeAction('fill_job_form', { job: result.job.number, form: 'Probe safety check', responses: { 'Site contact': 'Sam', 'Risk level': 'Low' } }, CTX);
    const instance = store.getAll('formInstances').find((row) => row.jobId === result.job.id);
    assert.strictEqual(instance.responses['Site contact'], 'Sam');

    await executeAction('remove_form_from_job', { job: result.job.number, form: 'Probe safety check' }, CTX);
    assert.strictEqual(store.getAll('formInstances').filter((row) => row.jobId === result.job.id).length, 0);
    await executeAction('delete_form_template', { template: 'Probe safety check' }, CTX);
  });

  test('leave, blockouts and meetings can be booked, moved and deleted', async () => {
    const technician = store.create('technicians', { name: 'Calendar Probe', role: 'technician' });

    const created = await executeAction('create_schedule_block', { type: 'leave', technician: 'Calendar Probe', date: todayKey(), until: todayKey(), notes: 'Annual leave' }, CTX);
    assert.strictEqual(created.result.blocks.length, 1);

    const listed = await executeAction('list_schedule_blocks', { from: todayKey(), to: todayKey(), technician: 'Calendar Probe' }, CTX);
    assert.strictEqual(listed.result.blocks.length, 1);

    await executeAction('update_schedule_block', { block: 'Annual leave', technician: 'Calendar Probe', date: todayKey(), start: '09:00', finish: '17:00' }, CTX);
    assert.strictEqual(store.getAll('schedule').find((row) => row.technicianId === technician.id).hours, 8);

    await executeAction('delete_schedule_block', { block: 'Annual leave', technician: 'Calendar Probe', date: todayKey() }, CTX);
    assert.strictEqual(store.getAll('schedule').filter((row) => row.technicianId === technician.id).length, 0);
  });

  test('an expected roster can be created and changed', async () => {
    store.create('technicians', { name: 'Roster Probe', role: 'technician' });
    await executeAction('create_expected_roster', {
      name: 'Probe day shift',
      technicians: ['Roster Probe'],
      startDate: nextMonday(),
      days: ['Monday', 'Tuesday'],
    }, CTX);
    const roster = store.getAll('expectedWorkRosters').find((row) => row.name === 'Probe day shift');
    assert.ok(roster);
    assert.deepStrictEqual(roster.weekPatterns[0].slice(0, 2), [true, true]);

    const listed = await executeAction('list_expected_rosters', {}, CTX);
    assert.ok(listed.result.rosters.some((row) => row.name === 'Probe day shift'));

    await executeAction('update_expected_roster', { roster: 'Probe day shift', defaultStartTime: '06:00', defaultEndTime: '14:00' }, CTX);
    assert.strictEqual(store.getAll('expectedWorkRosters').find((row) => row.name === 'Probe day shift').defaultStartTime, '06:00');
  });

  test('clocking in and out, and correcting a session', async () => {
    const started = await executeAction('clock_in', {}, CTX);
    assert.strictEqual(started.result.changed, true);
    const out = await executeAction('clock_out', {}, CTX);
    assert.strictEqual(out.result.changed, true);
    assert.ok(out.result.session.clockOut);

    const technician = store.create('technicians', { name: 'Clock Probe', role: 'technician' });
    const added = await executeAction('add_clock_session', { technician: 'Clock Probe', date: todayKey(), start: '07:00', finish: '15:00', note: 'Forgot to clock on' }, CTX);
    await executeAction('update_clock_session', { session: added.result.session.id, finish: '16:00' }, CTX);
    assert.strictEqual(store.getById('timeClocks', added.result.session.id).clockOutAt, `${todayKey()}T16:00`);
    await executeAction('delete_clock_session', { session: added.result.session.id, reason: 'Entered twice' }, CTX);
    assert.strictEqual(store.getById('timeClocks', added.result.session.id), null);
    assert.strictEqual(store.getAll('timeClocks').filter((row) => row.technicianId === technician.id).length, 0);
  });

  test('a quote can be revised into a new draft version', async () => {
    store.create('customers', { company: 'Revision Probe Customer', status: 'Active', type: 'Company', email: 'revision@example.com' });
    const { result } = await executeAction('create_quote', { customer: 'Revision Probe Customer', title: 'Probe quote', items: [{ description: 'Labour', rate: 100 }] }, CTX);
    const revised = await executeAction('revise_quote', { quote: result.quote.number }, CTX);

    assert.strictEqual(store.getById('quotes', result.quote.id).status, 'Archived');
    assert.strictEqual(revised.result.quote.version, 2);
    assert.strictEqual(revised.result.quote.status, 'Draft');
  });

  test('activities can be scheduled, completed and deleted', async () => {
    const created = await executeAction('create_activity', { title: 'Probe follow-up', type: 'follow-up', date: todayKey(), assign: 'Test Admin' }, CTX);
    assert.strictEqual(created.result.activity.status, 'pending');

    const listed = await executeAction('list_activities', { from: todayKey(), to: todayKey() }, CTX);
    assert.ok(listed.result.activities.some((activity) => activity.title === 'Probe follow-up'));

    await executeAction('update_activity', { activity: 'Probe follow-up', status: 'completed' }, CTX);
    assert.strictEqual(store.getAll('activities').find((activity) => activity.title === 'Probe follow-up').status, 'completed');

    await executeAction('delete_activity', { activity: 'Probe follow-up' }, CTX);
    assert.ok(!store.getAll('activities').some((activity) => activity.title === 'Probe follow-up'));
  });

  test('reports can be run and exported', async () => {
    const report = await executeAction('run_report', { report: 'overview' }, CTX);
    assert.ok(Array.isArray(report.result.blocks) && report.result.blocks.length > 0);

    const csv = await executeAction('export_report_csv', { report: 'inventory' }, CTX);
    assert.match(csv.result.csv, /Name,SKU/);
    assert.match(csv.result.filename, /inventory/);
  });

  test('a data copy needs a browser, and invoice email uses the demo sender', async () => {
    await assert.rejects(
      executeAction('export_data_copy', {}, CTX),
      (error) => error.code === ERROR_CODES.INVALID_INPUT,
    );

    store.create('invoices', { number: 'INV-91001', customerName: 'Email Probe', customerId: store.getAll('customers')[0]?.id, status: 'Sent', dueDate: todayKey(), total: 110 });
    const sent = await executeAction('send_invoice_email', { invoice: 'INV-91001' }, CTX);
    assert.strictEqual(sent.result.emailed, true);
    assert.ok(store.getAll('emailLog').some((row) => row.relatedId === sent.result.invoice.id));
  });

  test('email templates, kits, stock and documents can be managed', async () => {
    await executeAction('update_email_template', { template: 'invoice', subject: 'Invoice {number} from {company}', accent: '#112233' }, CTX);
    assert.strictEqual(store.getSettings().mailer.templates.invoice.subject, 'Invoice {number} from {company}');
    assert.strictEqual(store.getSettings().mailer.branding.accent, '#112233');

    await executeAction('create_stock_item', { name: 'Bulk Probe', sku: 'BP-1', unitPrice: 100, category: 'Old' }, CTX);
    await executeAction('create_stock_item', { name: 'Bulk Probe 2', sku: 'BP-2', unitPrice: 50, category: 'Old' }, CTX);
    await executeAction('bulk_update_stock', { items: ['Bulk Probe', 'BP-2'], category: 'New', pricePercent: 10 }, CTX);
    assert.strictEqual(store.getAll('stock').find((item) => item.sku === 'BP-1').unitPrice, 110);
    assert.strictEqual(store.getAll('stock').find((item) => item.sku === 'BP-2').category, 'New');

    const kit = await executeAction('create_kit', { name: 'Clone Me', items: [{ name: 'Bulk Probe' }] }, CTX);
    const cloned = await executeAction('duplicate_kit', { kit: 'Clone Me' }, CTX);
    assert.strictEqual(cloned.result.kit.name, 'Clone Me (Copy)');
    assert.notStrictEqual(cloned.result.kit.items[0].id, kit.result.kit.items[0].id);

    const added = await executeAction('add_document', { name: 'Probe.pdf', folder: 'Company Docs' }, CTX);
    await executeAction('rename_document', { document: 'Probe.pdf', name: 'Probe renamed.pdf' }, CTX);
    const copy = await executeAction('duplicate_document', { document: 'Probe renamed.pdf' }, CTX);
    assert.strictEqual(copy.result.document.name, 'Probe renamed (Copy).pdf');
    await executeAction('delete_document', { document: 'Probe renamed (Copy).pdf' }, CTX);
    assert.ok(store.getById('documents', added.result.document.id));
  });

  test('maintenance plans can be deleted and timesheets exported', async () => {
    const asset = store.create('assets', { name: 'Plan Probe', status: 'Active' });
    store.create('maintenancePlans', { name: 'Annual service', assetId: asset.id, status: 'Active' });
    await executeAction('delete_maintenance_plan', { asset: 'Plan Probe', plan: 'Annual service' }, CTX);
    assert.strictEqual(store.getAll('maintenancePlans').filter((plan) => plan.assetId === asset.id).length, 0);

    store.create('timesheets', { date: todayKey(), technicianName: 'Probe Tech', jobNumber: 'J-9001', taskName: 'Main Task', hours: 4, startTime: `${todayKey()}T07:00`, finishTime: `${todayKey()}T11:00` });
    const exported = await executeAction('export_timesheets_csv', { from: todayKey(), to: todayKey() }, CTX);
    assert.match(exported.result.csv, /Date,Technician,Job Number/);
    assert.match(exported.result.csv, /Probe Tech/);
  });

  test('notes and quote templates can be used from a job and a quote', async () => {
    const { result } = await executeAction('create_job', { customer: 'Note Probe Customer', createCustomer: true, title: 'Note job' }, CTX);
    await executeAction('add_job_note', { job: result.job.number, note: 'Call the site supervisor before arriving' }, CTX);
    await executeAction('delete_job_note', { job: result.job.number, note: 'site supervisor' }, CTX);
    assert.strictEqual((store.getById('jobs', result.job.id).activityLog || []).length, 0);

    await executeAction('create_quote_template', { name: 'Probe template', items: [{ description: 'Labour', rate: 250 }] }, CTX);
    const quote = await executeAction('create_quote_from_template', { template: 'Probe template', customer: 'Note Probe Customer', title: 'From template' }, CTX);
    assert.strictEqual(quote.result.quote.customerName, 'Note Probe Customer');
    assert.strictEqual(quote.result.quote.total, 275);
    assert.strictEqual(quote.result.quote.status, 'Draft');
  });

  test('a job can be linked to an asset and time records asset usage', async () => {
    const asset = store.create('assets', { name: 'Asset Probe Unit', serial: 'AP-1', status: 'Active', recoveryRate: 12 });
    const created = await executeAction('create_job', { customer: 'Asset Probe Customer', createCustomer: true, title: 'Asset job', asset: 'Asset Probe Unit' }, CTX);
    assert.strictEqual(store.getById('jobs', created.result.job.id).assetId, asset.id);

    await executeAction('log_time', { job: created.result.job.number, hours: 2, assets: ['Asset Probe Unit'] }, CTX);
    const usage = store.getAll('assetUsage').filter((row) => row.jobId === created.result.job.id);
    assert.strictEqual(usage.length, 1);
    assert.strictEqual(usage[0].hours, 2);
    assert.strictEqual(usage[0].recoveryRate, 12);

    await executeAction('update_job', { job: created.result.job.number, removeAsset: true }, CTX);
    assert.strictEqual(store.getById('jobs', created.result.job.id).assetId, null);
  });

  test('pending proposals can be listed, resolved and dismissed', async () => {
    store.save('deputyAsks', [
      { id: 'ask_probe_1', title: 'Schedule Collision for Sam', description: 'Sam is double booked on Tuesday.', proposedAction: '[ACTION: MOVE_JOB, {}]', status: 'pending', created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
      { id: 'ask_probe_2', title: 'Schedule Collision for Alex', description: 'Alex has two jobs at 9am.', proposedAction: '[ACTION: MOVE_JOB, {}]', status: 'pending', created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
      { id: 'ask_probe_3', title: 'Already handled', description: 'Old one.', proposedAction: '[ACTION: MOVE_JOB, {}]', status: 'resolved', created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
    ]);

    const listed = await executeAction('list_proposals', {}, CTX);
    assert.deepStrictEqual(listed.result.proposals.map((row) => row.id).sort(), ['ask_probe_1', 'ask_probe_2']);

    await executeAction('resolve_proposal', { proposal: 'Collision for Sam', note: 'Moved to Wednesday' }, CTX);
    assert.strictEqual(store.getById('deputyAsks', 'ask_probe_1').status, 'resolved');

    await executeAction('dismiss_proposal', { proposal: 'ask_probe_2', reason: 'Client moved the visit' }, CTX);
    assert.strictEqual(store.getById('deputyAsks', 'ask_probe_2').status, 'dismissed');

    const after = await executeAction('list_proposals', {}, CTX);
    assert.strictEqual(after.result.proposals.length, 0);
  });

  test('the new destructive tools keep their permission and approval flags', () => {
    const expected = {
      set_user_type_permissions: { module: 'Settings', key: 'manage_users' },
      delete_user_type: { module: 'Settings', key: 'manage_users' },
      delete_storage_location: { module: 'Stock', key: 'delete' },
      delete_location_type: { module: 'Stock', key: 'delete' },
      delete_kit_type: { module: 'Stock', key: 'delete' },
      delete_task_template: { module: 'Jobs', key: 'delete' },
      delete_form_template: { module: 'Settings', key: 'edit_company' },
      remove_form_from_job: { module: 'Jobs', key: 'manage_tasks' },
      delete_schedule_block: { module: 'Schedule', key: 'edit' },
      delete_clock_session: { module: 'Timesheets', key: 'edit_all' },
      delete_activity: { module: 'Schedule', key: 'edit' },
      send_invoice_email: { module: 'Invoices', key: 'send' },
      send_invoice_reminder: { module: 'Invoices', key: 'send' },
      send_invoice_receipt: { module: 'Invoices', key: 'send' },
      revise_quote: { module: 'Quotes', key: 'edit' },
      reset_company_data: { module: 'Settings', key: 'manage_users' },
      delete_company_profile: { module: 'Settings', key: 'manage_users' },
      bulk_update_stock: { module: 'Stock', key: 'edit' },
      push_stock_to_xero: { module: 'Stock', key: 'edit' },
      import_xero_items: { module: 'Stock', key: 'edit' },
      delete_maintenance_plan: { module: 'Assets', key: 'edit' },
      delete_job_note: { module: 'Jobs', key: 'edit' },
      resolve_proposal: { module: 'Schedule', key: 'edit' },
      dismiss_proposal: { module: 'Schedule', key: 'edit' },
    };
    for (const [name, permission] of Object.entries(expected)) {
      const action = getAction(name);
      assert.ok(action, `${name} is registered`);
      assert.deepStrictEqual(action.permission, permission, name);
      assert.strictEqual(action.risky, true, `${name} must ask first`);
    }
  });
});
