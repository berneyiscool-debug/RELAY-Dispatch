/**
 * The maintenance engine raises a "Recurring Job Due" notification when a plan
 * comes due and moves the plan on to its next service. Runs against the demo
 * business, so nothing reaches Supabase or IndexedDB.
 */

import { test, describe, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert/strict';

import { store, DEMO_COMPANY_ID } from '../data/store.js';
import { supabase } from './supabase.js';
import { raiseDueMaintenance, planDueMaintenance } from './maintenanceEngine.js';

const TODAY = '2026-10-31';

const QUOTE = {
  id: 'q_service',
  number: 'Q-9001',
  title: 'Standard service',
  sections: [{
    lineItems: [
      { type: 'material', description: 'Air filter', qty: 2, rate: 20, total: 40 },
      { type: 'labor', description: 'Technician', qty: 1.5, rate: 100, total: 150 },
    ],
  }],
};
const QUOTE_B = {
  id: 'q_inspect',
  number: 'Q-9002',
  title: 'Inspection',
  lineItems: [
    { type: 'material', description: 'Air filter', qty: 1, rate: 20, total: 20 },
    { type: 'labor', description: 'Technician', qty: 0.5, rate: 100, total: 50 },
  ],
};

function seed({ asset = {}, plans }) {
  store.save('quotes', [QUOTE, QUOTE_B]);
  store.save('stock', []);
  store.save('notifications', []);
  store.save('assets', [{ id: 'asset_1', name: 'Generator', type: 'Plant & Equipment', status: 'Active', currentMeter: 0, meterUnit: 'hrs', ...asset }]);
  store.save('maintenancePlans', plans.map((plan) => ({ assetId: 'asset_1', quoteId: QUOTE.id, status: 'Active', priority: 5, ...plan })));
}

const plan = (id) => store.getById('maintenancePlans', id);

describe('maintenance engine', () => {
  const saved = {};

  beforeEach(async () => {
    saved.from = supabase.from;
    supabase.from = () => ({ upsert: async () => ({}), insert: async () => ({}), delete: () => ({ eq: async () => ({}), in: async () => ({}) }) });
    store.demoMode = true;
    store.companyId = DEMO_COMPANY_ID;
    store.db = { transaction: () => { throw new Error('IndexedDB touched'); } };
    await store.initializeDemo({ id: 'user_test', name: 'Test Admin', email: 'test@example.com' });
  });

  afterEach(() => {
    supabase.from = saved.from;
    store.demoMode = false;
    store.db = null;
    store.clearSync();
  });

  test('a calendar plan due within a week raises one notification and moves on a period', () => {
    seed({ plans: [{ id: 'p1', name: 'Quarterly service', triggerType: 'Calendar', frequency: 'Quarterly', nextServiceDate: '2026-11-05' }] });

    const raised = raiseDueMaintenance(TODAY);

    assert.equal(raised.length, 1);
    const [n] = raised;
    assert.equal(n.type, 'Recurring Job Due');
    assert.equal(n.maintenancePlanId, 'p1');
    assert.equal(n.targetServiceDate, '2026-11-05');
    assert.equal(n.totalLaborHrs, 1.5);
    assert.equal(n.totalMaterialCost, 40);
    assert.deepEqual(n.mergedMaterialsList.map((m) => [m.name, m.quantity]), [['Air filter', 2]]);
    assert.equal(plan('p1').nextServiceDate, '2027-02-05');
    assert.equal(store.getAll('notifications').length, 1);

    // A second run the same day raises nothing more.
    assert.equal(raiseDueMaintenance(TODAY).length, 0);
  });

  test('a calendar plan more than a week out raises nothing', () => {
    seed({ plans: [{ id: 'p1', name: 'Quarterly service', triggerType: 'Calendar', frequency: 'Quarterly', nextServiceDate: '2026-11-20' }] });
    assert.equal(raiseDueMaintenance(TODAY).length, 0);
    assert.equal(plan('p1').nextServiceDate, '2026-11-20');
  });

  test('a long-overdue plan is raised once and jumps to its next future date', () => {
    seed({ plans: [{ id: 'p1', name: 'Monthly check', triggerType: 'Calendar', frequency: 'Monthly', nextServiceDate: '2025-06-15' }] });

    assert.equal(raiseDueMaintenance(TODAY).length, 1);
    assert.equal(plan('p1').nextServiceDate, '2026-11-15');
    assert.equal(raiseDueMaintenance(TODAY).length, 0);
  });

  test('month-end due dates do not overflow into the next month', () => {
    seed({ plans: [{ id: 'p1', name: 'Monthly check', triggerType: 'Calendar', frequency: 'Monthly', nextServiceDate: '2027-01-31' }] });
    raiseDueMaintenance('2027-01-28');
    assert.equal(plan('p1').nextServiceDate, '2027-02-28');
  });

  test('retired assets raise nothing', () => {
    for (const status of ['Decommissioned', 'Lost/Stolen']) {
      seed({ asset: { status }, plans: [{ id: 'p1', name: 'Quarterly service', triggerType: 'Calendar', frequency: 'Quarterly', nextServiceDate: '2026-11-01' }] });
      assert.equal(raiseDueMaintenance(TODAY).length, 0, status);
      assert.equal(plan('p1').nextServiceDate, '2026-11-01', status);
    }
  });

  test('a meter plan raises once when the reading jumps several intervals', () => {
    seed({ asset: { currentMeter: 2130 }, plans: [{ id: 'p1', name: '500 hr service', triggerType: 'Meter', meterInterval: 500, lastTriggeredMeter: 500 }] });

    const raised = raiseDueMaintenance(TODAY);
    assert.equal(raised.length, 1);
    assert.equal(raised[0].currentMeterAtTrigger, 2130);
    assert.equal(plan('p1').lastTriggeredMeter, 2000);

    // Even once that notification is dealt with, nothing more is due until 2500.
    store.save('notifications', store.getAll('notifications').map((n) => ({ ...n, status: 'Converted' })));
    assert.equal(raiseDueMaintenance(TODAY).length, 0);
  });

  test('a meter plan with no interval never fires', () => {
    seed({ asset: { currentMeter: 100 }, plans: [{ id: 'p1', name: 'Broken plan', triggerType: 'Meter', meterInterval: 0, lastTriggeredMeter: 0 }] });
    assert.equal(raiseDueMaintenance(TODAY).length, 0);
  });

  test('collision-merging plans due together become one job led by the highest priority', () => {
    seed({
      plans: [
        { id: 'p_low', name: 'Filter Plan', quoteId: QUOTE_B.id, triggerType: 'Calendar', frequency: 'Monthly', nextServiceDate: '2026-11-02', collisionMerging: true, priority: 3 },
        { id: 'p_high', name: 'Major service', triggerType: 'Calendar', frequency: 'Annually', nextServiceDate: '2026-11-03', collisionMerging: true, priority: 9 },
      ],
    });

    const raised = raiseDueMaintenance(TODAY);

    assert.equal(raised.length, 1);
    const [n] = raised;
    assert.equal(n.maintenancePlanId, 'p_high');
    assert.deepEqual(n.mergedPlanIds, ['p_low']);
    assert.equal(n.title, 'Major service (includes Filter tasks)');
    assert.equal(n.priority, 'High');
    assert.equal(n.totalLaborHrs, 2);
    assert.deepEqual(n.mergedMaterialsList.map((m) => [m.name, m.quantity]), [['Air filter', 3]]);
    assert.equal(plan('p_high').nextServiceDate, '2027-11-03');
    assert.equal(plan('p_low').nextServiceDate, '2026-12-02');
  });

  test('plans sharing a blueprint quote are raised separately even when set to merge', () => {
    seed({
      plans: [
        { id: 'p1', name: 'A', triggerType: 'Calendar', frequency: 'Monthly', nextServiceDate: '2026-11-02', collisionMerging: true },
        { id: 'p2', name: 'B', triggerType: 'Calendar', frequency: 'Monthly', nextServiceDate: '2026-11-02', collisionMerging: true },
      ],
    });
    const raised = raiseDueMaintenance(TODAY);
    assert.deepEqual(raised.map((n) => n.maintenancePlanId).sort(), ['p1', 'p2']);
    assert.ok(raised.every((n) => n.mergedPlanIds.length === 0));
  });

  test('a plan\'s own lead time decides how early calendar work is raised', () => {
    seed({
      plans: [
        { id: 'p_early', name: 'Annual fire test', triggerType: 'Calendar', frequency: 'Annually', nextServiceDate: '2026-11-25', leadDays: 30 },
        { id: 'p_default', name: 'Quarterly service', quoteId: QUOTE_B.id, triggerType: 'Calendar', frequency: 'Quarterly', nextServiceDate: '2026-11-25' },
        { id: 'p_sameday', name: 'Monthly check', triggerType: 'Calendar', frequency: 'Monthly', nextServiceDate: '2026-11-01', leadDays: 0 },
      ],
    });

    assert.deepEqual(raiseDueMaintenance(TODAY).map((n) => n.maintenancePlanId), ['p_early']);
    assert.deepEqual(raiseDueMaintenance('2026-11-01').map((n) => n.maintenancePlanId), ['p_sameday']);
  });

  test('a plan set to create its job raises the job straight away', () => {
    store.save('technicians', [{ id: 'tech_1', name: 'Dale Whitford', active: true }]);
    seed({
      asset: { site: 'Depot' },
      plans: [{ id: 'p1', name: 'Quarterly service', triggerType: 'Calendar', frequency: 'Quarterly', nextServiceDate: '2026-11-05', autoCreateJob: true, defaultTechnicianId: 'tech_1' }],
    });
    const jobsBefore = store.getAll('jobs').length;

    const [n] = raiseDueMaintenance(TODAY);

    assert.equal(n.status, 'Converted');
    const jobs = store.getAll('jobs');
    assert.equal(jobs.length, jobsBefore + 1);
    const job = jobs.find((j) => n.convertedTo === `Job ${j.number}`);
    assert.ok(job, 'the notification names the job it became');
    assert.equal(job.maintenancePlanId, 'p1');
    assert.equal(job.assetId, 'asset_1');
    assert.equal(job.quoteId, QUOTE.id);
    assert.equal(job.scheduledDate, '2026-11-05');
    assert.equal(job.technicianId, 'tech_1');
    assert.equal(job.status, 'Scheduled');
    assert.deepEqual(job.materials.map((m) => [m.name, m.quantity]), [['Air filter', 2]]);
    assert.equal(job.laborCost, 150);

    // Converted notifications still count as raised: nothing doubles up.
    assert.equal(raiseDueMaintenance(TODAY).length, 0);
    assert.equal(store.getAll('jobs').length, jobsBefore + 1);
  });

  test('plans left on the default only raise a notification', () => {
    seed({ plans: [{ id: 'p1', name: 'Quarterly service', triggerType: 'Calendar', frequency: 'Quarterly', nextServiceDate: '2026-11-05' }] });
    const jobsBefore = store.getAll('jobs').length;
    const [n] = raiseDueMaintenance(TODAY);
    assert.equal(n.status, 'Pending');
    assert.equal(store.getAll('jobs').length, jobsBefore);
  });

  test('a merged group creates one job when its leading plan says so', () => {
    seed({
      plans: [
        { id: 'p_low', name: 'Filter Plan', quoteId: QUOTE_B.id, triggerType: 'Calendar', frequency: 'Monthly', nextServiceDate: '2026-11-02', collisionMerging: true, priority: 3 },
        { id: 'p_high', name: 'Major service', triggerType: 'Calendar', frequency: 'Annually', nextServiceDate: '2026-11-03', collisionMerging: true, priority: 9, autoCreateJob: true },
      ],
    });
    const jobsBefore = store.getAll('jobs').length;
    const raised = raiseDueMaintenance(TODAY);
    assert.equal(raised.length, 1);
    assert.equal(store.getAll('jobs').length, jobsBefore + 1);
    const job = store.getAll('jobs').find((j) => j.maintenancePlanId === 'p_high');
    assert.deepEqual(job.mergedPlanIds, ['p_low']);
  });

  test('a plan without its blueprint quote raises nothing', () => {
    seed({ plans: [{ id: 'p1', name: 'Orphan', quoteId: 'q_missing', triggerType: 'Calendar', frequency: 'Monthly', nextServiceDate: '2026-11-01' }] });
    assert.equal(raiseDueMaintenance(TODAY).length, 0);
  });
});

// The store-free core a server runner would use: same decisions, nothing changed in place.
describe('planDueMaintenance', () => {
  const asset = { id: 'a', name: 'Generator', status: 'Active', currentMeter: 1210 };
  const plans = [
    { id: 'cal', name: 'Quarterly', assetId: 'a', quoteId: QUOTE.id, status: 'Active', triggerType: 'Calendar', frequency: 'Quarterly', nextServiceDate: '2026-11-03', autoCreateJob: true },
    { id: 'met', name: '500 hr', assetId: 'a', quoteId: QUOTE_B.id, status: 'Active', triggerType: 'Meter', meterInterval: 500, lastTriggeredMeter: 500 },
    { id: 'far', name: 'Annual', assetId: 'a', quoteId: QUOTE.id, status: 'Active', triggerType: 'Calendar', frequency: 'Annually', nextServiceDate: '2027-06-01' },
  ];

  test('returns what to raise, how each plan moves on, and which become jobs', () => {
    const input = { plans, assets: [asset], quotes: [QUOTE, QUOTE_B], notifications: [], stock: [] };
    const before = JSON.stringify(input);

    const r = planDueMaintenance(input, TODAY, '2026-10-31T00:00:00.000Z');

    assert.deepEqual(r.notifications.map(n => n.maintenancePlanId).sort(), ['cal', 'met']);
    assert.deepEqual(Object.fromEntries(r.planPatches.map(p => [p.id, p.patch])), {
      cal: { lastNotificationDate: '2026-10-31T00:00:00.000Z', nextServiceDate: '2027-02-03' },
      met: { lastNotificationDate: '2026-10-31T00:00:00.000Z', lastTriggeredMeter: 1000 },
    });
    assert.deepEqual(r.autoConvert, [r.notifications.find(n => n.maintenancePlanId === 'cal').id]);
    assert.equal(JSON.stringify(input), before, 'inputs are left untouched');
  });

  test('already-raised work is not raised again', () => {
    const first = planDueMaintenance({ plans, assets: [asset], quotes: [QUOTE, QUOTE_B] }, TODAY);
    const again = planDueMaintenance({ plans, assets: [asset], quotes: [QUOTE, QUOTE_B], notifications: first.notifications }, TODAY);
    assert.equal(again.notifications.length, 0);
  });
});
