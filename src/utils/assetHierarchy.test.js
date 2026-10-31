import { test, describe, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert/strict';

import { childrenOf, ancestorsOf, descendantIds, parentOptions, isValidParent } from './assetHierarchy.js';
import { store, DEMO_COMPANY_ID } from '../data/store.js';
import { supabase } from './supabase.js';
import { executeAction } from '../actions/registry.js';
import '../actions/assets.js';

const assets = [
  { id: 'site', name: 'Plant room', ownerType: 'Customer', customerId: 'c1' },
  { id: 'msb', name: 'Main switchboard', ownerType: 'Customer', customerId: 'c1', parentAssetId: 'site' },
  { id: 'cb2', name: 'Breaker 2', ownerType: 'Customer', customerId: 'c1', parentAssetId: 'msb' },
  { id: 'cb1', name: 'Breaker 1', ownerType: 'Customer', customerId: 'c1', parentAssetId: 'msb' },
  { id: 'other', name: 'Other customer board', ownerType: 'Customer', customerId: 'c2' },
  { id: 'van', name: 'Van', ownerType: 'Business' },
];

test('children, by name', () => {
  assert.deepEqual(childrenOf(assets, 'msb').map(a => a.id), ['cb1', 'cb2']);
  assert.deepEqual(childrenOf(assets, 'cb1'), []);
});

test('ancestors, outermost first, and a loop does not hang', () => {
  assert.deepEqual(ancestorsOf(assets, assets.find(a => a.id === 'cb1')).map(a => a.id), ['site', 'msb']);
  const loop = [{ id: 'a', parentAssetId: 'b' }, { id: 'b', parentAssetId: 'a' }];
  assert.deepEqual(ancestorsOf(loop, loop[0]).map(a => a.id), ['b']);
  assert.deepEqual([...descendantIds(loop, 'a')], ['b']);
});

test('descendants at any depth', () => {
  assert.deepEqual([...descendantIds(assets, 'site')].sort(), ['cb1', 'cb2', 'msb']);
});

test('a parent must have the same owner and not be inside the asset', () => {
  const msb = assets.find(a => a.id === 'msb');
  assert.deepEqual(parentOptions(assets, msb).map(a => a.id), ['site']);
  assert.equal(isValidParent(assets, msb, 'cb1'), false);
  assert.equal(isValidParent(assets, msb, 'other'), false);
  assert.equal(isValidParent(assets, msb, 'van'), false);
  assert.equal(isValidParent(assets, msb, ''), true);
  assert.deepEqual(parentOptions(assets, { ownerType: 'Business' }).map(a => a.id), ['van']);
});

describe('asset hierarchy in the store and actions', () => {
  const saved = {};
  const CTX = { source: 'eval', actor: { id: 'user_test', name: 'Test Admin', role: 'admin' } };

  beforeEach(async () => {
    saved.from = supabase.from;
    supabase.from = () => ({ upsert: async () => ({}), insert: async () => ({}), delete: () => ({ eq: async () => ({}), in: async () => ({}) }) });
    store.demoMode = true;
    store.companyId = DEMO_COMPANY_ID;
    store.db = { transaction: () => { throw new Error('IndexedDB touched'); } };
    await store.initializeDemo({ id: 'user_test', name: 'Test Admin', email: 'test@example.com' });
    store.save('assets', [
      { id: 'msb', name: 'Main switchboard', serial: 'MSB-1', ownerType: 'Business', logs: [] },
      { id: 'cb1', name: 'Breaker 1', serial: 'CB-1', ownerType: 'Business', parentAssetId: 'msb', logs: [] },
      { id: 'van', name: 'Van', serial: 'VAN-1', ownerType: 'Business', logs: [] },
    ]);
  });

  afterEach(() => {
    supabase.from = saved.from;
    store.demoMode = false;
    store.db = null;
    store.clearSync();
  });

  test('create_asset places a new asset inside another', async () => {
    const outcome = await executeAction('create_asset', { name: 'Breaker 2', serial: 'CB-2', partOf: 'MSB-1' }, CTX);
    assert.equal(store.getById('assets', outcome.result.asset.id).parentAssetId, 'msb');
  });

  test('update_asset refuses a loop, and partOf "none" makes it top-level', async () => {
    await assert.rejects(executeAction('update_asset', { asset: 'MSB-1', partOf: 'CB-1' }, CTX), /can't contain/);
    await executeAction('update_asset', { asset: 'CB-1', partOf: 'none' }, CTX);
    assert.equal(store.getById('assets', 'cb1').parentAssetId, '');
  });

  test('deleting a parent lifts its components to the top level', () => {
    store.delete('assets', 'msb');
    assert.equal(store.getById('assets', 'msb'), null);
    assert.equal(store.getById('assets', 'cb1').parentAssetId, '');
  });
});
