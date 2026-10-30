/**
 * The authoring tools brny was missing: kits, quote templates, project filing
 * and the read types that make them addressable.
 */

import { test, describe, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert/strict';

import { store, DEMO_COMPANY_ID } from '../data/store.js';
import { supabase } from '../utils/supabase.js';
import { executeAction } from './registry.js';
import './index.js';

const CTX = { source: 'eval', actor: { id: 'user_test', name: 'Test Admin', role: 'admin' } };
const CUSTOMER = 'Brny Authoring Probe Pty Ltd';

describe('the assistant can author kits, templates and project links', () => {
  const saved = {};

  beforeEach(async () => {
    saved.from = supabase.from;
    supabase.from = () => ({ upsert: async () => ({}), insert: async () => ({}), delete: () => ({ eq: async () => ({}), in: async () => ({}) }) });
    store.demoMode = true;
    store.companyId = DEMO_COMPANY_ID;
    store.db = { transaction: () => { throw new Error('IndexedDB touched'); } };
    await store.initializeDemo({ id: 'user_test', name: 'Test Admin', email: 'test@example.com' });
    store.create('customers', { company: CUSTOMER, status: 'Active', type: 'Company', email: 'probe@example.com' });
  });

  afterEach(() => {
    supabase.from = saved.from;
    store.demoMode = false;
    store.db = null;
    store.clearSync();
  });

  test('a kit is built from stock and labour, priced and then editable', async () => {
    await executeAction('create_stock_item', { name: 'Probe RCBO', sku: 'PR-1', costPrice: 20, unitPrice: 40 }, CTX);

    const created = await executeAction('create_kit', {
      name: 'Switchboard kit',
      category: 'Electrical',
      items: [
        { name: 'Probe RCBO', stockItem: 'Probe RCBO', quantity: 2 },
        { name: 'Install labour', type: 'labor', quantity: 1, costPrice: 50, unitPrice: 100 },
      ],
    }, CTX);

    const kit = created.result.kit;
    assert.strictEqual(kit.items.length, 2);
    assert.strictEqual(kit.items[0].stockId, store.getAll('stock').find((item) => item.name === 'Probe RCBO').id, 'the stock line is linked');
    assert.strictEqual(kit.totalCost, 90);
    assert.strictEqual(kit.totalPrice, 180);

    const updated = await executeAction('update_kit', {
      kit: 'Switchboard kit',
      items: [{ name: 'Probe RCBO', stockItem: 'Probe RCBO', quantity: 3 }],
      marginOverrideEnabled: true,
      marginOverride: 25,
    }, CTX);
    assert.strictEqual(updated.result.kit.items.length, 1);
    assert.strictEqual(updated.result.kit.totalCost, 60);
    assert.strictEqual(updated.result.kit.totalPrice, 80, 'cost / (1 - 25%)');

    const listed = await executeAction('list_kits', {}, CTX);
    assert.ok(listed.result.kits.some((kit) => kit.name === 'Switchboard kit'));
  });

  test('quote templates can be created, listed and changed', async () => {
    await executeAction('create_quote_template', { name: 'Standard install', description: 'Typical split system', items: [{ description: 'Labour', rate: 500 }] }, CTX);

    const listed = await executeAction('list_quote_templates', {}, CTX);
    assert.strictEqual(listed.result.templates.length, 1);
    assert.strictEqual(listed.result.templates[0].sections, 1);

    const updated = await executeAction('update_quote_template', {
      template: 'Standard install',
      items: [{ description: 'Labour', rate: 700 }, { description: 'Materials', type: 'material', rate: 300 }],
    }, CTX);
    assert.deepStrictEqual(updated.result.fields, ['items']);
    assert.strictEqual(updated.result.template.total, 1100, '1000 ex GST plus 10% GST');
  });

  test('a job can be filed under a project and taken back out', async () => {
    const { result } = await executeAction('create_job', { customer: CUSTOMER, title: 'Filed job', estimatedHours: 2 }, CTX);
    const project = await executeAction('create_project', { customer: CUSTOMER, name: 'Probe project' }, CTX);

    await executeAction('update_job', { job: result.job.number, project: 'Probe project' }, CTX);
    assert.strictEqual(store.getById('jobs', result.job.id).projectId, project.result.project.id);

    const removed = await executeAction('remove_job_from_project', { job: result.job.number }, CTX);
    assert.strictEqual(removed.result.project.name, 'Probe project');
    assert.strictEqual(store.getById('jobs', result.job.id).projectId, null);
  });

  test('kits, quote templates and documents can be read with the record tools', async () => {
    await executeAction('create_kit', { name: 'Read kit', items: [{ name: 'Cable', quantity: 1 }] }, CTX);
    await executeAction('create_quote_template', { name: 'Read template', items: [{ description: 'Labour', rate: 100 }] }, CTX);
    await executeAction('add_document', { name: 'Read document', folder: 'Jobs' }, CTX);

    const kits = await executeAction('search_records', { type: 'kits', query: 'Read kit' }, CTX);
    assert.strictEqual(kits.result.matches.length, 1);
    assert.strictEqual(kits.result.matches[0].name, 'Read kit');

    const templates = await executeAction('list_records', { type: 'quoteTemplates' }, CTX);
    assert.ok(templates.result.records.some((record) => record.name === 'Read template'));
    assert.strictEqual(templates.result.records.find((record) => record.name === 'Read template').sections.length, 1);

    const document = await executeAction('get_record', { type: 'documents', query: 'Read document' }, CTX);
    assert.strictEqual(document.result.record.folder, 'Jobs');
  });
});
