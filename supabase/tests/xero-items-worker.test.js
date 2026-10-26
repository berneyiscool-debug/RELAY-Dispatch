/**
 * Tests for the item (stock) jobs in relay-xero-sync, with an in-memory
 * database and a scripted fake Xero: items are matched before they're created,
 * a linked item is updated in place, invoices create the items their lines need,
 * and an item Xero refuses never holds an invoice back.
 *
 * Run with: npm run test:migrations
 */
import { describe, test } from 'node:test';
import assert from 'node:assert/strict';
import { XeroError } from '../functions/_xero/client.js';
import { runJobs } from '../functions/_xero/worker.js';

const NOW = new Date('2026-10-27T00:00:00.000Z');
const COMPANY = 'company-a';
const SETTINGS = { defaultSalesAccountCode: '200', materialsAccountCode: '220', purchasesAccountCode: '300' };

function seed(overrides = {}) {
  return {
    stock: {
      'S1': { id: 'S1', company_id: COMPANY, name: 'Tempering valve', sku: 'TV-15', unit_price: 145.5, cost_price: 82, updated_at: '2026-10-26T00:00:00Z', xero_item_id: null, xero_item_code: null },
      'S2': { id: 'S2', company_id: COMPANY, name: 'Thread tape', sku: null, unit_price: 4.5, cost_price: 1.2, updated_at: '2026-10-26T00:00:00Z', xero_item_id: null, xero_item_code: null },
      ...(overrides.stock || {}),
    },
    invoices: {
      'inv-1': {
        id: 'inv-1', company_id: COMPANY, number: 'INV-1', title: 'Job', status: 'Sent', customer_id: 'cust-1', job_id: null,
        subtotal: 250, tax: 25, total: 275, due_date: '2026-11-19', created_at: '2026-10-26T00:00:00Z', updated_at: '2026-10-26T00:00:00Z',
        line_items: { sections: [{ lineItems: [
          { description: 'Labour', type: 'labor', qty: 1, rate: 100 },
          { description: 'Tempering valve', type: 'material', qty: 1, rate: 145.5, stockId: 'S1' },
          { description: 'Thread tape', type: 'material', qty: 1, rate: 4.5, stockId: 'S2' },
        ] }] },
        xero_invoice_id: null, xero_payment_ids: {},
      },
    },
    customers: { 'cust-1': { id: 'cust-1', company_id: COMPANY, company: 'Acme', xero_contact_id: 'xc-1' } },
    settings: SETTINGS,
  };
}

function fakeDb(data) {
  const finished = {};
  return {
    data, finished,
    getStock: async (id) => (data.stock[id] ? structuredClone(data.stock[id]) : null),
    getStockItems: async (companyId, ids) => Object.values(data.stock).filter((s) => s.company_id === companyId && ids.includes(s.id)).map((s) => structuredClone(s)),
    updateStock: async (id, fields) => { Object.assign(data.stock[id], fields); },
    getInvoice: async (id) => structuredClone(data.invoices[id] || null),
    getCustomer: async (id) => structuredClone(data.customers[id] || null),
    getJobs: async () => [],
    getCostCenters: async () => [],
    getXeroSettings: async () => data.settings,
    updateInvoice: async (id, fields) => { Object.assign(data.invoices[id], fields); },
    updateCustomer: async () => {},
    finishJob: async (id, fields) => { finished[id] = fields; },
    markConnection: async () => {},
  };
}

function fakeXero(routes) {
  const calls = [];
  return {
    calls,
    request: async (method, path, options = {}) => {
      calls.push({ method, path, ...options });
      const handler = routes[`${method} ${path}`];
      if (!handler) throw new Error(`Unexpected Xero call ${method} ${path}`);
      return { status: 200, data: await handler(options, calls) };
    },
  };
}

const job = (id, entity, action, entityId) => ({ id, company_id: COMPANY, entity, entity_id: entityId, action, status: 'running', attempts: 1 });
const run = (db, xero, jobs) => runJobs({ jobs, db, xeroFor: async () => xero, now: () => NOW });
const savedItem = (body, id = 'xi-new') => ({ Items: [{ ItemID: body.Items[0].ItemID || id, Code: body.Items[0].Code }] });

describe('item upsert', () => {
  test('creates the item when no code or name matches, and saves the link', async () => {
    const db = fakeDb(seed());
    const xero = fakeXero({
      'GET /Items': () => ({ Items: [] }),
      'POST /Items': ({ body }) => savedItem(body),
    });
    const summary = await run(db, xero, [job(1, 'item', 'upsert', 'S1')]);
    assert.equal(summary.done, 1);
    assert.deepEqual(xero.calls.map((c) => `${c.method} ${c.query?.where || ''}`), ['GET Code=="TV-15"', 'GET Name=="Tempering valve"', 'POST ']);
    const post = xero.calls.at(-1);
    assert.equal(post.body.Items[0].Code, 'TV-15');
    assert.equal(post.body.Items[0].ItemID, undefined);
    assert.equal(post.query.unitdp, 4);
    assert.match(post.idempotencyKey, /^relay-item-S1-/);
    const s = db.data.stock.S1;
    assert.equal(s.xero_item_id, 'xi-new');
    assert.equal(s.xero_item_code, 'TV-15');
    assert.equal(s.xero_synced_at, NOW.toISOString());
    assert.equal(s.xero_sync_error, null);
  });

  test('adopts an item with the same code and stops looking', async () => {
    const db = fakeDb(seed());
    const xero = fakeXero({
      'GET /Items': () => ({ Items: [{ ItemID: 'xi-existing', Code: 'tv-15', Name: 'Valve' }] }),
      'POST /Items': ({ body }) => savedItem(body),
    });
    await run(db, xero, [job(1, 'item', 'upsert', 'S1')]);
    assert.equal(xero.calls.filter((c) => c.method === 'GET').length, 1);
    assert.equal(xero.calls.at(-1).body.Items[0].ItemID, 'xi-existing');
    assert.equal(db.data.stock.S1.xero_item_id, 'xi-existing');
  });

  test('adopted by name with no SKU, it keeps the code Xero already uses', async () => {
    const db = fakeDb(seed());
    const xero = fakeXero({
      'GET /Items': ({ query }) => ({ Items: query.where.startsWith('Name') ? [{ ItemID: 'xi-tape', Code: 'TAPE', Name: 'thread tape' }] : [] }),
      'POST /Items': ({ body }) => savedItem(body),
    });
    await run(db, xero, [job(1, 'item', 'upsert', 'S2')]);
    assert.equal(xero.calls.at(-1).body.Items[0].Code, 'TAPE');
    assert.equal(db.data.stock.S2.xero_item_code, 'TAPE');
  });

  test('a linked item is updated in place with no lookups, renamed to a new SKU', async () => {
    const db = fakeDb(seed({ stock: { S1: { ...seed().stock.S1, sku: 'TV-15B', xero_item_id: 'xi-1', xero_item_code: 'TV-15' } } }));
    const xero = fakeXero({ 'POST /Items': ({ body }) => savedItem(body) });
    await run(db, xero, [job(1, 'item', 'upsert', 'S1')]);
    assert.equal(xero.calls.length, 1);
    assert.equal(xero.calls[0].body.Items[0].ItemID, 'xi-1');
    assert.equal(xero.calls[0].body.Items[0].Code, 'TV-15B');
    assert.equal(db.data.stock.S1.xero_item_code, 'TV-15B');
  });

  test('a Xero validation error fails the job and shows on the stock row', async () => {
    const db = fakeDb(seed());
    const xero = fakeXero({
      'GET /Items': () => ({ Items: [] }),
      'POST /Items': () => { throw new XeroError('validation', 'Account code 220 is not a valid code for this document.'); },
    });
    const summary = await run(db, xero, [job(1, 'item', 'upsert', 'S1')]);
    assert.equal(summary.failed, 1);
    assert.match(db.data.stock.S1.xero_sync_error, /Account code 220/);
  });

  test('a deleted stock row is skipped', async () => {
    const db = fakeDb(seed());
    const summary = await run(db, fakeXero({}), [job(1, 'item', 'upsert', 'gone')]);
    assert.equal(summary.skipped, 1);
  });
});

describe('invoices and items', () => {
  const invoiceRoutes = (extra = {}) => ({
    'GET /Invoices': () => ({ Invoices: [] }),
    'POST /Invoices': ({ body }) => ({ Invoices: [{ InvoiceID: 'xi-inv', Status: 'AUTHORISED', Total: 275, AmountDue: 275, Echo: body }] }),
    ...extra,
  });

  test('material lines carry item codes, creating items that aren\'t in Xero yet', async () => {
    const db = fakeDb(seed({ stock: { S1: { ...seed().stock.S1, xero_item_id: 'xi-1', xero_item_code: 'TV-15' } } }));
    const xero = fakeXero(invoiceRoutes({
      'GET /Items': () => ({ Items: [] }),
      'POST /Items': ({ body }) => savedItem(body, 'xi-2'),
    }));
    const summary = await run(db, xero, [job(1, 'invoice', 'upsert', 'inv-1')]);
    assert.equal(summary.done, 1);
    // S1 was already linked: no item calls for it. S2 is created first.
    assert.equal(xero.calls.filter((c) => c.path === '/Items' && c.method === 'POST').length, 1);
    assert.equal(db.data.stock.S2.xero_item_id, 'xi-2');
    const lines = xero.calls.find((c) => c.path === '/Invoices' && c.method === 'POST').body.Invoices[0].LineItems;
    assert.deepEqual(lines.map((l) => l.ItemCode), [undefined, 'TV-15', db.data.stock.S2.xero_item_code]);
    assert.match(db.data.stock.S2.xero_item_code, /^RELAY-S2$/);
  });

  test('an item Xero refuses goes without its code, and the invoice still syncs', async () => {
    const db = fakeDb(seed());
    const xero = fakeXero(invoiceRoutes({
      'GET /Items': () => ({ Items: [] }),
      'POST /Items': ({ body }) => {
        if (body.Items[0].Code === 'TV-15') throw new XeroError('validation', 'Code already in use.');
        return savedItem(body, 'xi-2');
      },
    }));
    const summary = await run(db, xero, [job(1, 'invoice', 'upsert', 'inv-1')]);
    assert.equal(summary.done, 1);
    const lines = xero.calls.find((c) => c.path === '/Invoices' && c.method === 'POST').body.Invoices[0].LineItems;
    assert.equal(lines[1].ItemCode, undefined);
    assert.equal(lines[2].ItemCode, 'RELAY-S2');
    assert.match(db.data.stock.S1.xero_sync_error, /Code already in use/);
    assert.match(db.finished[1].last_error, /Tempering valve.*without its item code/);
  });

  test('a rate limit while creating an item puts the invoice back in the queue', async () => {
    const db = fakeDb(seed());
    const xero = fakeXero(invoiceRoutes({
      'GET /Items': () => { throw new XeroError('rate_limited', 'Too many requests', { retryAfterSec: 30 }); },
    }));
    const summary = await run(db, xero, [job(1, 'invoice', 'upsert', 'inv-1')]);
    assert.equal(summary.released, 1);
    assert.equal(db.finished[1].status, 'pending');
  });

  test('invoices without stock lines make no item calls', async () => {
    const data = seed();
    data.invoices['inv-1'].line_items = { sections: [{ lineItems: [{ description: 'Labour', type: 'labor', qty: 1, rate: 250 }] }] };
    const db = fakeDb(data);
    const xero = fakeXero(invoiceRoutes());
    await run(db, xero, [job(1, 'invoice', 'upsert', 'inv-1')]);
    assert.ok(!xero.calls.some((c) => c.path === '/Items'));
  });
});
