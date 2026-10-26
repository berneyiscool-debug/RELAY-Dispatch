import { test, describe, beforeEach } from 'node:test';
import assert from 'node:assert';

const mem = new Map();
globalThis.localStorage = {
  getItem: (k) => (mem.has(k) ? mem.get(k) : null),
  setItem: (k, v) => mem.set(k, String(v)),
  removeItem: (k) => mem.delete(k),
  clear: () => mem.clear(),
};

const { store } = await import('../data/store.js');
const { entityHref, entityLink, resolveEntityId } = await import('./EntityLink.js');

function seed() {
  store.cache = {};
  store.listeners = {};
  store.companyId = 'acct_test';
  store.create('customers', { id: 'cust_1', company: 'Lakeside Early Learning Centre' });
  store.create('customers', { id: 'cust_2', company: 'Acme Electrical', firstName: 'Ada', lastName: 'Lovelace' });
  store.create('customers', { id: 'cust_3', company: 'Duplicate Co' });
  store.create('customers', { id: 'cust_4', company: 'Duplicate Co' });
  store.create('jobs', { id: 'job_1', number: 'J-1001', title: 'Pump repair' });
  store.create('suppliers', { id: 'sup_1', name: 'Bolt & Fastener Co' });
  store.create('stock', { id: 'stock_1', name: 'Cable 2.5mm', sku: 'CBL-25' });
}

describe('Entity links — routes', () => {
  test('every kind maps to the page that record lives on', () => {
    const cases = {
      customer: '/people/cust_1',
      job: '/jobs/job_1',
      quote: '/quotes/q_1',
      invoice: '/invoices/i_1',
      purchaseOrder: '/purchase-orders/po_1',
      project: '/projects/p_1',
      asset: '/assets/a_1',
      stock: '/stock/s_1',
      kit: '/kits/k_1',
      supplier: '/suppliers/sup_1',
      contractor: '/contractors/c_1',
      lead: '/leads/l_1',
    };
    for (const [kind, href] of Object.entries(cases)) {
      assert.strictEqual(entityHref(kind, href.split('/').pop()), href, kind);
    }
  });

  test('an unknown kind never produces a link', () => {
    assert.strictEqual(entityHref('unicorn', 'u_1'), null);
    assert.strictEqual(entityLink({ kind: 'unicorn', id: 'u_1', name: 'Sparkles' }), 'Sparkles');
  });

  test('a missing id never produces a link', () => {
    assert.strictEqual(entityHref('job', ''), null);
    assert.strictEqual(entityHref('job', null), null);
  });
});

describe('Entity links — name resolution', () => {
  beforeEach(seed);

  test('an explicit id wins over the name', () => {
    assert.strictEqual(resolveEntityId('customer', { id: 'cust_2', name: 'Lakeside Early Learning Centre' }), 'cust_2');
  });

  test('an explicit id pointing at a deleted record links nowhere', () => {
    assert.strictEqual(resolveEntityId('customer', { id: 'cust_gone', name: 'Lakeside Early Learning Centre' }), null);
  });

  test('a site is proven through its owning customer', () => {
    assert.strictEqual(resolveEntityId('site', { id: 'cust_1' }), 'cust_1');
    assert.strictEqual(resolveEntityId('site', { id: 'cust_gone' }), null);
  });

  test('a customer name matches its record', () => {
    assert.strictEqual(resolveEntityId('customer', { name: 'Lakeside Early Learning Centre' }), 'cust_1');
  });

  test('a person name matches the first/last form of the record', () => {
    assert.strictEqual(resolveEntityId('customer', { name: 'Ada Lovelace' }), 'cust_2');
  });

  test('matching ignores case and extra whitespace', () => {
    assert.strictEqual(resolveEntityId('customer', { name: '  lakeside   early learning centre ' }), 'cust_1');
  });

  test('an ambiguous name resolves to nothing rather than an arbitrary record', () => {
    assert.strictEqual(resolveEntityId('customer', { name: 'Duplicate Co' }), null);
  });

  test('an unknown name resolves to nothing', () => {
    assert.strictEqual(resolveEntityId('customer', { name: 'Nobody Ltd' }), null);
    assert.strictEqual(resolveEntityId('customer', { name: '' }), null);
    assert.strictEqual(resolveEntityId('customer', {}), null);
  });

  test('a job matches on its number', () => {
    assert.strictEqual(resolveEntityId('job', { name: 'J-1001' }), 'job_1');
  });

  test('a stock item matches on its SKU as well as its name', () => {
    assert.strictEqual(resolveEntityId('stock', { name: 'CBL-25' }), 'stock_1');
    assert.strictEqual(resolveEntityId('stock', { name: 'Cable 2.5mm' }), 'stock_1');
  });

  test('a supplier name stored as free text resolves', () => {
    assert.strictEqual(resolveEntityId('supplier', { name: 'Bolt & Fastener Co' }), 'sup_1');
  });
});

describe('Entity links — markup', () => {
  beforeEach(seed);

  test('renders a real anchor on a hash route', () => {
    const html = entityLink({ kind: 'customer', id: 'cust_1', name: 'Lakeside Early Learning Centre' });
    assert.strictEqual(html, '<a href="#/people/cust_1" class="entity-link" title="Lakeside Early Learning Centre">Lakeside Early Learning Centre</a>');
  });

  test('resolves the id from the name when the record only stored a name', () => {
    const html = entityLink({ kind: 'customer', name: 'Lakeside Early Learning Centre' });
    assert.match(html, /href="#\/people\/cust_1"/);
  });

  test('falls back to plain text when nothing matches', () => {
    const html = entityLink({ kind: 'customer', name: 'Nobody Ltd' });
    assert.ok(!html.includes('<a '), 'no anchor');
    assert.strictEqual(html, 'Nobody Ltd');
  });

  test('falls back to plain text for an ambiguous name', () => {
    assert.strictEqual(entityLink({ kind: 'customer', name: 'Duplicate Co' }), 'Duplicate Co');
  });

  test('escapes the label so a record name cannot inject markup', () => {
    const html = entityLink({ kind: 'customer', id: 'cust_1', name: '<img src=x onerror=alert(1)>' });
    assert.ok(!html.includes('<img'), 'no injected element');
    assert.ok(html.includes('&lt;img src=x onerror=alert(1)&gt;'), 'escaped');
  });

  test('escapes the same way when it stays text', () => {
    assert.strictEqual(entityLink({ kind: 'customer', name: '<b>nope</b>' }), '&lt;b&gt;nope&lt;/b&gt;');
  });

  test('label overrides the visible text but not the lookup', () => {
    const html = entityLink({ kind: 'customer', name: 'Lakeside Early Learning Centre', label: 'Lakeside ELC' });
    assert.match(html, />Lakeside ELC<\/a>$/);
    assert.match(html, /href="#\/people\/cust_1"/);
  });

  test('an empty name renders a dash rather than an empty cell', () => {
    assert.strictEqual(entityLink({ kind: 'customer' }), '—');
  });

  test('stopPropagation is opt-in, for links inside a clickable row', () => {
    assert.ok(!entityLink({ kind: 'job', id: 'job_1', name: 'J-1001' }).includes('data-stop-propagation'));
    assert.ok(entityLink({ kind: 'job', id: 'job_1', name: 'J-1001', stopPropagation: true }).includes('data-stop-propagation'));
  });

  test('extra classes are kept alongside entity-link', () => {
    assert.match(entityLink({ kind: 'job', id: 'job_1', name: 'J-1001', className: 'font-medium' }), /class="entity-link font-medium"/);
  });
});
