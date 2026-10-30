/**
 * `save_pdf` refuses cleanly where it cannot work. The render itself needs a
 * browser, so it is checked in the running app, not here.
 */

import { test, describe, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert/strict';

import { store, DEMO_COMPANY_ID } from '../data/store.js';
import { supabase } from '../utils/supabase.js';
import { executeAction, getAction } from './registry.js';
import { ERROR_CODES } from './errors.js';
import './index.js';

const CTX = { source: 'eval', actor: { id: 'user_test', name: 'Test Admin', role: 'admin' } };

describe('save_pdf', () => {
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

  test('is offered to brny with the three kinds', () => {
    const action = getAction('save_pdf');
    assert.ok(action);
    assert.deepStrictEqual(action.inputSchema.properties.kind.enum, ['quote', 'invoice', 'purchase_order']);
    assert.strictEqual(action.risky, false, 'saving a copy changes nothing, so it needs no approval');
  });

  test('says plainly that it needs the app open in a browser', async () => {
    const invoice = store.getAll('invoices')[0];
    await assert.rejects(
      executeAction('save_pdf', { kind: 'invoice', records: [invoice.number] }, CTX),
      (error) => error.code === ERROR_CODES.INVALID_INPUT && /browser/.test(error.message),
    );
  });

  test('refuses an empty list and an oversized batch', async () => {
    await assert.rejects(
      executeAction('save_pdf', { kind: 'quote', records: [] }, CTX),
      (error) => error.code === ERROR_CODES.INVALID_INPUT,
    );
    await assert.rejects(
      executeAction('save_pdf', { kind: 'quote', records: Array.from({ length: 26 }, (_, i) => `Q-${i}`) }, CTX),
      (error) => error.code === ERROR_CODES.INVALID_INPUT && /at most 25/.test(error.message),
    );
  });
});
