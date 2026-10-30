/**
 * brny can add, change and deactivate staff — for admins only, never with a
 * password it knows, and never making anyone an admin.
 *
 * Run against the demo business, so the `invite-user` and seat-sync calls of a
 * Cloud account are never reached.
 */

import { test, describe, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert/strict';

import { store, DEMO_COMPANY_ID } from '../data/store.js';
import { supabase } from '../utils/supabase.js';
import { executeAction } from './registry.js';
import { ERROR_CODES } from './errors.js';
import { continueAfterMaxSteps } from '../utils/brnyAgent.js';
import './index.js';

const ADMIN = { source: 'eval', actor: { id: 'user_test', name: 'Test Admin', role: 'admin' } };
const TECH = { source: 'eval', actor: { id: 'tech_test', name: 'Test Tech', role: 'technician' } };

describe('assistant staff tools', () => {
  const saved = {};
  let techType;

  beforeEach(async () => {
    saved.from = supabase.from;
    supabase.from = () => ({ upsert: async () => ({}), insert: async () => ({}), delete: () => ({ eq: async () => ({}), in: async () => ({}) }) });
    store.demoMode = true;
    store.companyId = DEMO_COMPANY_ID;
    store.db = { transaction: () => { throw new Error('IndexedDB touched'); } };
    await store.initializeDemo({ id: 'user_test', name: 'Test Admin', email: 'test@example.com' });
    techType = store.create('userTypes', { name: 'Probe Technician' });
    store.create('userTypes', { id: 'probe_ut_admin', name: 'Probe Administrator' });
  });

  afterEach(() => {
    supabase.from = saved.from;
    store.demoMode = false;
    store.db = null;
    store.clearSync();
  });

  test('add_staff_member needs approval, and sets a password nobody is told', async () => {
    const input = { name: 'Petra Probe', backupEmail: 'petra@example.com', userType: 'Probe Technician', role: 'Electrician', payRate: 55 };
    await assert.rejects(
      executeAction('add_staff_member', input, { ...ADMIN, source: 'brny' }),
      (error) => error.code === ERROR_CODES.APPROVAL_REQUIRED,
    );

    const { result } = await executeAction('add_staff_member', input, ADMIN);
    assert.strictEqual(result.staff.username, 'petra');
    assert.strictEqual(result.staff.userType, 'Probe Technician');
    assert.ok(!JSON.stringify(result).includes('password'), 'no password reaches the model');

    const person = store.getAll('technicians').find((p) => p.username === 'petra');
    assert.strictEqual(person.userTypeId, techType.id);
    assert.ok(person.password && person.password.length > 20, 'a long password is stored, hashed for a demo account');
  });

  test('a taken username, a bad email and an admin user type are refused', async () => {
    await executeAction('add_staff_member', { name: 'Petra Probe', backupEmail: 'petra@example.com', userType: 'Probe Technician' }, ADMIN);
    await assert.rejects(
      executeAction('add_staff_member', { name: 'Petra Other', backupEmail: 'p2@example.com', userType: 'Probe Technician' }, ADMIN),
      (error) => error.code === ERROR_CODES.CONFLICT,
    );
    await assert.rejects(
      executeAction('add_staff_member', { name: 'Quinn Probe', backupEmail: 'not-an-email', userType: 'Probe Technician' }, ADMIN),
      (error) => error.code === ERROR_CODES.INVALID_INPUT,
    );
    await assert.rejects(
      executeAction('add_staff_member', { name: 'Quinn Probe', backupEmail: 'q@example.com', userType: 'Probe Administrator' }, ADMIN),
      (error) => error.code === ERROR_CODES.INVALID_INPUT,
    );
  });

  test('only an admin can manage staff', async () => {
    await assert.rejects(
      executeAction('list_staff', {}, TECH),
      (error) => error.code === ERROR_CODES.PERMISSION_DENIED,
    );
  });

  test('update and deactivate, with the 30-day seat cooldown on reactivation', async () => {
    await executeAction('add_staff_member', { name: 'Petra Probe', backupEmail: 'petra@example.com', userType: 'Probe Technician' }, ADMIN);
    const updated = await executeAction('update_staff_member', { person: 'petra', payRate: 60, role: 'Leading Hand' }, ADMIN);
    assert.strictEqual(updated.result.staff.payRate, 60);

    const off = await executeAction('deactivate_staff_member', { person: 'petra' }, ADMIN);
    assert.strictEqual(off.result.staff.deactivated, true);
    await assert.rejects(
      executeAction('deactivate_staff_member', { person: 'petra', reactivate: true }, ADMIN),
      (error) => error.code === ERROR_CODES.INVALID_INPUT && /cooldown/i.test(error.message),
    );

    const listed = await executeAction('list_staff', {}, ADMIN);
    assert.ok(!listed.result.staff.some((p) => p.username === 'petra'), 'deactivated people are hidden by default');
  });
});

describe('carrying on after the step cap', () => {
  test('the nudge joins the last tool-result message instead of adding a second user turn', () => {
    const history = [
      { role: 'user', content: 'Set up the customer and quote' },
      { role: 'assistant', content: [{ type: 'tool_use', id: 't1', name: 'create_customer', input: {} }] },
      { role: 'user', content: [{ type: 'tool_result', tool_use_id: 't1', content: '{}' }] },
    ];
    const next = continueAfterMaxSteps(history);
    assert.strictEqual(next.length, 3);
    assert.strictEqual(next[2].content.length, 2);
    assert.strictEqual(next[2].content[1].type, 'text');
    assert.match(next[2].content[1].text, /Keep going/);
    assert.strictEqual(history[2].content.length, 1, 'the original history is not changed');
  });

  test('a history ending on the assistant gets its own user message', () => {
    const next = continueAfterMaxSteps([{ role: 'assistant', content: 'Working on it' }]);
    assert.strictEqual(next.length, 2);
    assert.strictEqual(next[1].role, 'user');
  });
});
