/**
 * brny can register and service assets, and run the stock room.
 *
 * Run against the demo business, as in `jobs.test.js`, so nothing reaches
 * Supabase or IndexedDB.
 */

import { test, describe, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert/strict';

import { store, DEMO_COMPANY_ID } from '../data/store.js';
import { supabase } from '../utils/supabase.js';
import { executeAction } from './registry.js';
import { ERROR_CODES } from './errors.js';
import './index.js';

const CTX = { source: 'eval', actor: { id: 'user_test', name: 'Test Admin', role: 'admin' } };
const CUSTOMER = 'Brny Asset Probe Pty Ltd';

describe('assistant assets and stock', () => {
  const saved = {};

  beforeEach(async () => {
    saved.from = supabase.from;
    supabase.from = () => ({ upsert: async () => ({}), insert: async () => ({}), delete: () => ({ eq: async () => ({}), in: async () => ({}) }) });
    store.demoMode = true;
    store.companyId = DEMO_COMPANY_ID;
    store.db = { transaction: () => { throw new Error('IndexedDB touched'); } };
    await store.initializeDemo({ id: 'user_test', name: 'Test Admin', email: 'test@example.com' });
    store.create('customers', { company: CUSTOMER, status: 'Active', type: 'Company', sites: [{ name: 'Depot', address: '1 Depot Rd' }] });
    store.create('storageLocations', { name: 'Probe Warehouse', active: true });
    store.create('storageLocations', { name: 'Probe Van', active: true });
  });

  afterEach(() => {
    supabase.from = saved.from;
    store.demoMode = false;
    store.db = null;
    store.clearSync();
  });

  describe('assets', () => {
    test('create_asset writes a customer asset at a site', async () => {
      const { result } = await executeAction('create_asset', {
        name: 'Probe split system', customer: CUSTOMER, site: 'Depot', type: 'Fixed Asset (HVAC/Solar/Fire)', serial: 'SN-1',
      }, CTX);
      assert.strictEqual(result.asset.ownerType, 'Customer');
      assert.strictEqual(result.asset.site, 'Depot');
      assert.strictEqual(result.asset.identifier, 'SN-1');
      assert.deepStrictEqual(result.asset.logs, []);
    });

    test('a repair log puts the asset In Maintenance and moves the meter', async () => {
      await executeAction('create_asset', { name: 'Probe excavator', type: 'Plant & Equipment', currentMeter: 100 }, CTX);
      const { result } = await executeAction('log_asset_service', { asset: 'Probe excavator', type: 'Repair', meter: 120, cost: 450, notes: 'Hydraulic hose' }, CTX);
      assert.strictEqual(result.asset.status, 'In Maintenance');
      assert.strictEqual(result.asset.currentMeter, 120);
      assert.strictEqual(result.asset.logs.length, 1);
    });

    test('set_maintenance_plan needs a blueprint quote, and updates a plan of the same name', async () => {
      await executeAction('create_asset', { name: 'Probe chiller', customer: CUSTOMER }, CTX);
      await assert.rejects(
        executeAction('set_maintenance_plan', { asset: 'Probe chiller', name: 'Quarterly service' }, CTX),
        (error) => error.code === ERROR_CODES.INVALID_INPUT,
      );
      const quote = (await executeAction('create_quote', { customer: CUSTOMER, title: 'Chiller service', items: [{ description: 'Service', rate: 300 }] }, CTX)).result.quote;
      const first = await executeAction('set_maintenance_plan', { asset: 'Probe chiller', name: 'Quarterly service', quote: quote.number, nextServiceDate: '2027-01-15' }, CTX);
      assert.strictEqual(first.result.created, true);
      assert.strictEqual(first.result.plan.frequency, 'Quarterly');
      assert.strictEqual(first.result.plan.quoteId, quote.id);

      const second = await executeAction('set_maintenance_plan', { asset: 'Probe chiller', name: 'quarterly service', status: 'Paused' }, CTX);
      assert.strictEqual(second.result.created, false);
      assert.strictEqual(second.result.plan.status, 'Paused');
      assert.strictEqual(store.getAll('maintenancePlans').filter((p) => p.assetId === first.result.asset.id).length, 1);
    });
  });

  describe('stock', () => {
    async function rcbo(quantity = 20) {
      return (await executeAction('create_stock_item', { name: 'Probe RCBO 20A', sku: 'PRB-20', costPrice: 30, reorderLevel: 5, quantity, location: 'Probe Warehouse' }, CTX)).result.item;
    }

    test('create_stock_item keeps the totals the stock screens read, and refuses an unknown location', async () => {
      const item = await rcbo();
      assert.deepStrictEqual(item.locations, [{ location: 'Probe Warehouse', quantity: 20 }]);
      assert.strictEqual(item.quantity, 20);
      assert.strictEqual(item.location, 'Probe Warehouse');
      await assert.rejects(
        executeAction('create_stock_item', { name: 'Other', quantity: 1, location: 'Narnia' }, CTX),
        (error) => error.code === ERROR_CODES.INVALID_INPUT,
      );
    });

    test('transfer_stock moves parts between locations', async () => {
      await rcbo();
      const { result } = await executeAction('transfer_stock', { item: 'PRB-20', from: 'Probe Warehouse', to: 'probe van', quantity: 8 }, CTX);
      assert.deepStrictEqual(result.item.locations, [{ location: 'Probe Warehouse', quantity: 12 }, { location: 'Probe Van', quantity: 8 }]);
      assert.strictEqual(result.item.quantity, 20);
      await assert.rejects(
        executeAction('transfer_stock', { item: 'PRB-20', from: 'Probe Van', to: 'Probe Warehouse', quantity: 9 }, CTX),
        (error) => error.code === ERROR_CODES.INVALID_INPUT,
      );
    });

    test('adjust_stock counts and raises the reorder alert at the reorder level', async () => {
      await rcbo();
      const before = store.getAll('notifications').length;
      const { result } = await executeAction('adjust_stock', { item: 'PRB-20', location: 'Probe Warehouse', count: 4, reason: 'stocktake' }, CTX);
      assert.strictEqual(result.from, 20);
      assert.strictEqual(result.to, 4);
      assert.strictEqual(result.reorderAlert, true);
      assert.strictEqual(store.getAll('notifications').length, before + 1);

      const low = await executeAction('list_low_stock', {}, CTX);
      assert.ok(low.result.items.some((item) => item.sku === 'PRB-20' && item.onHand === 4));
    });

    test('adjust_stock takes count or change, not both', async () => {
      await rcbo();
      await assert.rejects(
        executeAction('adjust_stock', { item: 'PRB-20', location: 'Probe Warehouse', count: 1, change: -1, reason: 'x' }, CTX),
        (error) => error.code === ERROR_CODES.INVALID_INPUT,
      );
    });

    test('add_kit_to_job puts the materials on the job and lists the labour', async () => {
      const item = await rcbo();
      store.create('kits', {
        name: 'Probe board kit',
        items: [
          { type: 'material', stockId: item.id, name: item.name, qty: 2, costPrice: 30 },
          { type: 'labor', stockId: null, name: 'Labour', qty: 3, costPrice: 45 },
        ],
      });
      const job = (await executeAction('create_job', { customer: CUSTOMER, title: 'Board upgrade' }, CTX)).result.job;
      const { result } = await executeAction('add_kit_to_job', { kit: 'Probe board kit', job: job.number, quantity: 2 }, CTX);
      assert.deepStrictEqual(result.added.map((a) => [a.name, a.quantity]), [['Probe RCBO 20A', 4]]);
      assert.deepStrictEqual(result.labour, [{ name: 'Labour', hours: 6 }]);
      assert.strictEqual(store.getById('stock', item.id).quantity, 16);
      assert.strictEqual(store.getById('jobs', job.id).materials.length, 1);
    });
  });
});
