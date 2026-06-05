import { test, describe, beforeEach } from 'node:test';
import assert from 'node:assert';
import { store } from './store.js';
import { supabase } from '../utils/supabase.js';

// Mock Supabase client database operations to return success and avoid console logs/errors
supabase.from = () => ({
  select: () => ({
    eq: () => ({
      single: async () => ({ data: {}, error: null })
    })
  }),
  insert: async () => ({ error: null, data: {} }),
  update: () => ({
    eq: async () => ({ error: null, data: {} })
  }),
  delete: () => ({
    eq: async () => ({ error: null, data: {} })
  })
});

describe('DataStore', () => {
  beforeEach(() => {
    // Reset store cache and status before each test
    store.clearSync();
    store.listeners = {};
  });

  describe('getAll', () => {
    test('returns empty array when no data exists', () => {
      const result = store.getAll('customers');
      assert.deepStrictEqual(result, []);
    });

    test('returns cached data when it exists', () => {
      const customers = [{ id: '1', name: 'Alice' }];
      store.cache.customers = customers;
      const result = store.getAll('customers');
      assert.deepStrictEqual(result, customers);
    });
  });

  describe('create', () => {
    test('does not modify cache if companyId is not set', async () => {
      const item = { name: 'David' };
      const created = await store.create('customers', item);
      assert.deepStrictEqual(created, item);
      assert.deepStrictEqual(store.getAll('customers'), []);
    });

    test('creates item with generated id and timestamps when companyId is set', async () => {
      store.companyId = 'test-company';
      const item = { name: 'David' };
      const created = await store.create('customers', item);

      assert.ok(created.id);
      assert.ok(created.createdAt);
      assert.ok(created.updatedAt);
      assert.strictEqual(created.name, 'David');
      assert.strictEqual(created.companyId, 'test-company');

      // Check it was saved to cache
      const all = store.getAll('customers');
      assert.strictEqual(all.length, 1);
      assert.deepStrictEqual(all[0], created);
    });

    test('preserves provided id and createdAt when companyId is set', async () => {
      store.companyId = 'test-company';
      const item = {
        id: 'custom_id',
        name: 'Eve',
        createdAt: '2023-01-01T00:00:00.000Z'
      };
      const created = await store.create('customers', item);

      assert.strictEqual(created.id, 'custom_id');
      assert.strictEqual(created.createdAt, '2023-01-01T00:00:00.000Z');
      assert.ok(created.updatedAt);
    });
  });

  describe('update', () => {
    test('returns null if companyId is not set', async () => {
      const result = await store.update('customers', '1', { name: 'New' });
      assert.strictEqual(result, null);
    });

    test('updates existing item and its updatedAt timestamp when companyId is set', async () => {
      store.companyId = 'test-company';
      // Seed item in cache
      const item = { id: 'job_1', title: 'Fix roof', companyId: 'test-company', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() };
      store.cache.jobs = [item];

      const oldUpdatedAt = item.updatedAt;

      // Small delay
      await new Promise(resolve => setTimeout(resolve, 5));

      const updated = await store.update('jobs', 'job_1', { title: 'Fix window', status: 'done' });

      assert.ok(updated);
      assert.strictEqual(updated.title, 'Fix window');
      assert.strictEqual(updated.status, 'done');
      assert.strictEqual(updated.id, 'job_1');
      assert.notStrictEqual(updated.updatedAt, oldUpdatedAt);

      // Check cache
      const all = store.getAll('jobs');
      assert.strictEqual(all.length, 1);
      assert.deepStrictEqual(all[0], updated);
    });

    test('returns null when updating non-existent item', async () => {
      store.companyId = 'test-company';
      const result = await store.update('jobs', 'non-existent-id', { title: 'New' });
      assert.strictEqual(result, null);
    });
  });

  describe('delete', () => {
    test('deletes item from cache and emits event', async () => {
      store.companyId = 'test-company';
      const item = { id: 'job_1', title: 'Fix roof' };
      store.cache.jobs = [item];

      let emittedData = null;
      store.on('jobs', (data) => {
        emittedData = data;
      });

      await store.delete('jobs', 'job_1');

      assert.deepStrictEqual(store.getAll('jobs'), []);
      assert.deepStrictEqual(emittedData, []);
    });
  });

  describe('getSettings', () => {
    test('returns default settings when no companySettings exists', () => {
      const settings = store.getSettings();
      assert.strictEqual(settings.name, 'Company Name');
      assert.strictEqual(settings.materialMarkup.defaultPercent, 30);
    });

    test('returns merged settings when companySettings exists', () => {
      store.companySettings = {
        name: 'Custom Company',
        materialMarkup: { defaultPercent: 40 }
      };

      const settings = store.getSettings();
      assert.strictEqual(settings.name, 'Custom Company');
      assert.strictEqual(settings.materialMarkup.defaultPercent, 40);
    });
  });

  describe('saveSettings', () => {
    test('does not save settings if companyId is not set', async () => {
      const settings = { name: 'Offline Change' };
      await store.saveSettings(settings);
      assert.strictEqual(store.companySettings, null);
    });

    test('saves settings and emits event when companyId is set', async () => {
      store.companyId = 'test-company';
      const settings = { name: 'Online Change' };

      let emittedData = null;
      store.on('settings', (data) => {
        emittedData = data;
      });

      await store.saveSettings(settings);

      assert.deepStrictEqual(store.companySettings, settings);
      assert.deepStrictEqual(emittedData, settings);
    });
  });
});
