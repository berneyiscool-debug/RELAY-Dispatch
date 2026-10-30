/**
 * Routines run through brny's tool loop, and brny can set them up itself.
 *
 * The run is checked with a stand-in `runTurn`, so no model is called; the
 * routine tools run against the demo business with brny Max switched on.
 */

import { test, describe, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert/strict';

import { store, DEMO_COMPANY_ID } from '../data/store.js';
import { supabase } from '../utils/supabase.js';
import { executeAction } from './registry.js';
import { ERROR_CODES } from './errors.js';
import { routinePrompt, runRoutineTurn, ROUTINE_MAX_STEPS } from '../utils/routineTurn.js';
import { getRoutines } from '../utils/deputyRoutines.js';
import './routines.js';

const CTX = { source: 'eval', actor: { id: 'user_test', name: 'Test Admin', role: 'admin' } };
const ROUTINE = { id: 'r1', title: 'Chase overdue invoices', trigger: { type: 'morning' }, prompt: 'Chase anything 14 days overdue.' };

describe('a routine run', () => {
  test('runs the instruction through the tool loop with a larger step budget', async () => {
    let seen;
    const { report, pending } = await runRoutineTurn(ROUTINE, {
      system: 'PLAYBOOK',
      runTurn: async (options) => { seen = options; return { status: 'done', text: 'Chased 2 invoices.', actions: [] }; },
    });
    assert.strictEqual(seen.system, 'PLAYBOOK');
    assert.strictEqual(seen.maxSteps, ROUTINE_MAX_STEPS);
    assert.match(seen.prompt, /Chase anything 14 days overdue\./);
    assert.match(seen.prompt, /Nobody is watching/);
    assert.strictEqual(report, 'Chased 2 invoices.');
    assert.strictEqual(pending, null);
  });

  test('a run that stops for approval hands back what is needed to resume it', async () => {
    const approval = { toolUseId: 't1', name: 'send_invoice', summary: 'Send INV-1042' };
    const { report, pending } = await runRoutineTurn(ROUTINE, {
      system: 'P',
      runTurn: async () => ({ status: 'approval_required', text: 'INV-1042 is ready.', messages: ['m'], pendingApproval: approval }),
    });
    assert.deepStrictEqual(pending, { messages: ['m'], pendingApproval: approval });
    assert.match(report, /INV-1042 is ready\./);
    assert.match(report, /waiting for your approval: Send INV-1042/);
  });

  test('a run with no words still reports what it did', async () => {
    const { report } = await runRoutineTurn(ROUTINE, {
      system: 'P',
      runTurn: async () => ({ status: 'done', text: '', actions: [{ tool: 'update_plan', ok: true }, { tool: 'add_todo', ok: true }] }),
    });
    assert.strictEqual(report, 'Done — 1 action run.');
  });

  test('an AI failure is thrown so the panel logs it', async () => {
    await assert.rejects(
      runRoutineTurn(ROUTINE, { system: 'P', runTurn: async () => ({ status: 'limit', error: new Error('Daily limit reached') }) }),
      /Daily limit reached/,
    );
  });

  test('the prompt names the routine and its schedule', () => {
    assert.match(routinePrompt(ROUTINE), /"Chase overdue invoices" \(Every morning\)/);
  });
});

describe('routine tools', () => {
  const saved = {};

  beforeEach(async () => {
    saved.from = supabase.from;
    supabase.from = () => ({ upsert: async () => ({}), insert: async () => ({}), delete: () => ({ eq: async () => ({}), in: async () => ({}) }) });
    store.demoMode = true;
    store.companyId = DEMO_COMPANY_ID;
    store.db = { transaction: () => { throw new Error('IndexedDB touched'); } };
    await store.initializeDemo({ id: 'user_test', name: 'Test Admin', email: 'test@example.com' });
    const settings = store.getSettings();
    await store.saveSettings({ ...settings, ai: { ...(settings.ai || {}), tier: 'cloudPlus' } });
    store.save('deputyRoutines', []);
  });

  afterEach(() => {
    supabase.from = saved.from;
    store.demoMode = false;
    store.db = null;
    store.clearSync();
  });

  test('create_routine stores an interval routine the Routines tab can read', async () => {
    const { result } = await executeAction('create_routine', { title: 'Approve hours', prompt: 'Approve last week\'s timesheets.', every: 7, unit: 'days' }, CTX);
    assert.strictEqual(result.routine.schedule, 'Every 7 days');
    const stored = getRoutines();
    assert.strictEqual(stored.length, 1);
    assert.deepStrictEqual(stored[0].trigger, { type: 'interval', interval: 7, unit: 'days' });
  });

  test('a routine defaults to every morning, and refuses to run more often than every 15 minutes', async () => {
    const { result } = await executeAction('create_routine', { title: 'Morning check', prompt: 'Read today.' }, CTX);
    assert.strictEqual(result.routine.schedule, 'Every morning');
    await assert.rejects(
      executeAction('create_routine', { title: 'Too often', prompt: 'x', every: 5, unit: 'minutes' }, CTX),
      (error) => error.code === ERROR_CODES.INVALID_INPUT,
    );
  });

  test('update_routine pauses by name, and delete_routine needs approval', async () => {
    await executeAction('create_routine', { title: 'Chase overdue invoices', prompt: 'Chase them.' }, CTX);
    const paused = await executeAction('update_routine', { routine: 'chase invoices', enabled: false }, CTX);
    assert.strictEqual(paused.result.routine.enabled, false);

    await assert.rejects(
      executeAction('delete_routine', { routine: 'Chase overdue invoices' }, { ...CTX, source: 'brny' }),
      (error) => error.code === ERROR_CODES.APPROVAL_REQUIRED,
    );
    await executeAction('delete_routine', { routine: 'Chase overdue invoices' }, CTX);
    assert.strictEqual(getRoutines().length, 0);
  });

  test('routines are refused without brny Max', async () => {
    const settings = store.getSettings();
    await store.saveSettings({ ...settings, ai: { ...(settings.ai || {}), tier: 'cloud' } });
    await assert.rejects(
      executeAction('list_routines', {}, CTX),
      (error) => error.code === ERROR_CODES.UNSUPPORTED,
    );
  });
});
