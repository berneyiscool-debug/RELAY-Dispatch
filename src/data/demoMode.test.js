import { test, describe, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert';
import { store, DEMO_COMPANY_ID } from './store.js';
import { supabase } from '../utils/supabase.js';

// Demo mode must stay in memory: any write that reaches IndexedDB, the local
// folder or Supabase would land on the real account the demo was opened from.
describe('demo mode', () => {
  let calls;
  const saved = {};

  beforeEach(async () => {
    calls = [];
    saved.from = supabase.from;
    supabase.from = (table) => { calls.push(table); return { upsert: async () => ({}), insert: async () => ({}), delete: () => ({ eq: async () => ({}), in: async () => ({}) }) }; };
    store.demoMode = true;
    store.companyId = DEMO_COMPANY_ID;
    store.db = { transaction: () => { calls.push('indexeddb'); throw new Error('IndexedDB touched'); } };
    await store.initializeDemo({ id: 'user_1', name: 'Pat Owner', email: 'pat@test.example' });
  });

  afterEach(() => {
    supabase.from = saved.from;
    store.demoMode = false;
    store.db = null;
    store.clearSync();
  });

  test('loads the demo business into memory', () => {
    assert.strictEqual(store.getSettings().name, 'Harbourline Electrical & Air');
    assert.ok(store.getAll('jobs').length > 100);
    assert.ok(store.getAll('technicians').some((t) => t.id === 'user_1' && t.name === 'Pat Owner'), 'the visitor plays the owner');
    assert.ok(store.isDemoCrew());
    const ft = new Set(store.getAll('formTemplates').map((f) => f.id));
    store.getAll('formInstances').forEach((fi) => assert.ok(ft.has(fi.templateId)));
  });

  test('create, update, delete and save stay in memory', async () => {
    const lead = store.create('leads', { title: 'Demo test lead', status: 'New' });
    assert.ok(store.getById('leads', lead.id));
    store.update('leads', lead.id, { status: 'Contacted' });
    assert.strictEqual(store.getById('leads', lead.id).status, 'Contacted');
    store.delete('leads', lead.id);
    assert.strictEqual(store.getById('leads', lead.id), null);
    await store.save('customers', store.getAll('customers').slice(1));
    await store.saveSettings({ ...store.getSettings(), name: 'Renamed' });
    await new Promise((r) => setTimeout(r, 10));
    assert.deepStrictEqual(calls, []);
  });

  test('clearAll never wipes anything from a demo tab', async () => {
    const before = store.getAll('jobs').length;
    await store.clearAll();
    assert.strictEqual(store.getAll('jobs').length, before);
    assert.deepStrictEqual(calls, []);
  });
});
