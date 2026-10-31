import { test, describe, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert/strict';

import { complianceDueKey, complianceStatus, complianceItems, hasComplianceDue, warrantyStatus, markComplianceDone } from './assetCompliance.js';
import { store, DEMO_COMPANY_ID } from '../data/store.js';
import { supabase } from './supabase.js';
import { executeAction } from '../actions/registry.js';
import { todayLocalISO } from './dateUtils.js';
import '../actions/assets.js';

const TODAY = '2026-10-31';

test('a check falls due its interval after it was last done, unless a date is pinned', () => {
  assert.equal(complianceDueKey({ lastDone: '2026-08-31', intervalMonths: 3 }), '2026-11-30');
  assert.equal(complianceDueKey({ lastDone: '2026-08-31', intervalMonths: 3, dueDate: '2026-12-15' }), '2026-12-15');
  assert.equal(complianceDueKey({ lastDone: '2026-08-31' }), null);
  assert.equal(complianceDueKey({}), null);
});

test('status: overdue, due within 30 days, ok, or none', () => {
  assert.equal(complianceStatus({ dueDate: '2026-10-30' }, TODAY).state, 'overdue');
  assert.equal(complianceStatus({ dueDate: '2026-11-30' }, TODAY).state, 'due-soon');
  assert.equal(complianceStatus({ dueDate: '2026-12-01' }, TODAY).state, 'ok');
  assert.equal(complianceStatus({}, TODAY).state, 'none');
});

test('items sort most urgent first, and any due one flags the asset', () => {
  const asset = { compliance: [
    { id: 'a', name: 'Registration', dueDate: '2027-06-01' },
    { id: 'b', name: 'Test & tag', dueDate: '2026-10-01' },
    { id: 'c', name: 'RCD test', dueDate: '2026-11-10' },
  ] };
  assert.deepEqual(complianceItems(asset, TODAY).map(c => c.item.id), ['b', 'c', 'a']);
  assert.equal(hasComplianceDue(asset, TODAY), true);
  assert.equal(hasComplianceDue({ compliance: [{ dueDate: '2027-06-01' }] }, TODAY), false);
  assert.equal(hasComplianceDue({}, TODAY), false);
});

test('warranty: expired, expiring within 30 days, covered, or not recorded', () => {
  assert.equal(warrantyStatus({ warrantyExpiry: '2026-10-01' }, TODAY).state, 'expired');
  assert.equal(warrantyStatus({ warrantyExpiry: '2026-11-15' }, TODAY).state, 'expiring');
  assert.equal(warrantyStatus({ warrantyExpiry: '2028-01-01' }, TODAY).state, 'ok');
  assert.equal(warrantyStatus({}, TODAY).state, 'none');
});

test('marking done moves the check on and clears a pinned date', () => {
  const done = markComplianceDone({ id: 'b', name: 'Test & tag', intervalMonths: 3, lastDone: '2026-07-01', dueDate: '2026-10-15' }, TODAY);
  assert.equal(done.lastDone, TODAY);
  assert.equal('dueDate' in done, false);
  assert.equal(complianceDueKey(done), '2027-01-31');
});

describe('set_compliance_check', () => {
  const saved = {};
  const CTX = { source: 'eval', actor: { id: 'user_test', name: 'Test Admin', role: 'admin' } };

  beforeEach(async () => {
    saved.from = supabase.from;
    supabase.from = () => ({ upsert: async () => ({}), insert: async () => ({}), delete: () => ({ eq: async () => ({}), in: async () => ({}) }) });
    store.demoMode = true;
    store.companyId = DEMO_COMPANY_ID;
    store.db = { transaction: () => { throw new Error('IndexedDB touched'); } };
    await store.initializeDemo({ id: 'user_test', name: 'Test Admin', email: 'test@example.com' });
    store.save('assets', [{ id: 'reg', name: 'Workshop tools register', serial: 'WS-REG', status: 'Active', logs: [] }]);
  });

  afterEach(() => {
    supabase.from = saved.from;
    store.demoMode = false;
    store.db = null;
    store.clearSync();
  });

  test('adds a check, updates it by name, and records it done', async () => {
    await executeAction('set_compliance_check', { asset: 'WS-REG', name: 'Test & tag (AS/NZS 3760)', intervalMonths: 3, lastDone: '2026-08-01' }, CTX);
    let asset = store.getById('assets', 'reg');
    assert.equal(asset.compliance.length, 1);
    assert.equal(complianceDueKey(asset.compliance[0]), '2026-11-01');

    await executeAction('set_compliance_check', { asset: 'WS-REG', name: 'test & tag (as/nzs 3760)', reference: 'Tag batch 44' }, CTX);
    asset = store.getById('assets', 'reg');
    assert.equal(asset.compliance.length, 1);
    assert.equal(asset.compliance[0].reference, 'Tag batch 44');

    await executeAction('set_compliance_check', { asset: 'WS-REG', name: 'Test & tag (AS/NZS 3760)', done: true }, CTX);
    asset = store.getById('assets', 'reg');
    assert.equal(asset.compliance[0].lastDone, todayLocalISO());
    assert.equal(asset.logs.at(-1).type, 'Inspection');
    assert.match(asset.logs.at(-1).notes, /Test & tag/);
  });

  test('a check with no way to work out a due date is refused', async () => {
    await assert.rejects(executeAction('set_compliance_check', { asset: 'WS-REG', name: 'Mystery check' }, CTX), /due date/);
    assert.equal((store.getById('assets', 'reg').compliance || []).length, 0);
  });
});
