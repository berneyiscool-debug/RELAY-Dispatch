import { test, describe, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert/strict';

import { latestCondition } from './assetCondition.js';
import { store, DEMO_COMPANY_ID } from '../data/store.js';
import { supabase } from './supabase.js';
import { executeAction } from '../actions/registry.js';
import '../actions/jobs.js';

test('the latest log that recorded a condition wins', () => {
  const asset = { logs: [
    { date: '2026-05-01', condition: 'Good' },
    { date: '2026-09-01', condition: 'Poor', conditionNotes: 'Bearing noise' },
    { date: '2026-10-01' },
    { date: '2026-08-01', condition: 'Fair' },
  ] };
  assert.deepEqual(latestCondition(asset), { condition: 'Poor', notes: 'Bearing noise', date: '2026-09-01' });
  assert.equal(latestCondition({ logs: [{ date: '2026-01-01' }] }), null);
  assert.equal(latestCondition({}), null);
});

test('on the same day, the later log wins', () => {
  const asset = { logs: [{ date: '2026-09-01', condition: 'Fair' }, { date: '2026-09-01', condition: 'Unsafe' }] };
  assert.equal(latestCondition(asset).condition, 'Unsafe');
});

describe('completing a job on an asset', () => {
  const saved = {};
  const CTX = { source: 'eval', actor: { id: 'user_test', name: 'Test Admin', role: 'admin' } };

  beforeEach(async () => {
    saved.from = supabase.from;
    supabase.from = () => ({ upsert: async () => ({}), insert: async () => ({}), delete: () => ({ eq: async () => ({}), in: async () => ({}) }) });
    store.demoMode = true;
    store.companyId = DEMO_COMPANY_ID;
    store.db = { transaction: () => { throw new Error('IndexedDB touched'); } };
    await store.initializeDemo({ id: 'user_test', name: 'Test Admin', email: 'test@example.com' });
    store.save('assets', [{ id: 'gen', name: 'Generator', status: 'Active', currentMeter: 1180, meterUnit: 'hrs', logs: [] }]);
    store.save('maintenancePlans', [{ id: 'p_meter', name: '500 hr service', assetId: 'gen', status: 'Active', triggerType: 'Meter', meterInterval: 500, lastTriggeredMeter: 1000 }]);
  });

  afterEach(() => {
    supabase.from = saved.from;
    store.demoMode = false;
    store.db = null;
    store.clearSync();
  });

  test('the reading and condition go on the service log, the meter and the meter plan', async () => {
    const job = store.create('jobs', { number: 'J-99001', title: 'Generator — 500 hr service', status: 'In Progress', assetId: 'gen', maintenancePlanId: 'p_meter', technicianName: 'Dale' });

    await executeAction('complete_job', { job: job.id, meter: 1212.5, condition: 'Fair', conditionNotes: 'Coolant hose perished — replace next visit' }, CTX);

    const asset = store.getById('assets', 'gen');
    const log = asset.logs.at(-1);
    assert.equal(log.meter, 1212.5);
    assert.equal(log.condition, 'Fair');
    assert.equal(log.conditionNotes, 'Coolant hose perished — replace next visit');
    assert.equal(asset.currentMeter, 1212.5);
    assert.equal(store.getById('maintenancePlans', 'p_meter').lastTriggeredMeter, 1212.5);
    assert.equal(latestCondition(asset).condition, 'Fair');
  });

  test('without a reading the asset keeps its meter, and an older reading never winds it back', async () => {
    const a = store.create('jobs', { number: 'J-99002', title: 'Check', status: 'In Progress', assetId: 'gen' });
    await executeAction('complete_job', { job: a.id }, CTX);
    assert.equal(store.getById('assets', 'gen').logs.at(-1).meter, 1180);
    assert.equal(store.getById('assets', 'gen').logs.at(-1).condition, undefined);

    const b = store.create('jobs', { number: 'J-99003', title: 'Back-dated check', status: 'In Progress', assetId: 'gen' });
    await executeAction('complete_job', { job: b.id, meter: 900 }, CTX);
    assert.equal(store.getById('assets', 'gen').currentMeter, 1180);
  });
});
