import { test, describe, beforeEach, after } from 'node:test';
import assert from 'node:assert';

const mem = new Map();
globalThis.localStorage = {
  getItem: (k) => (mem.has(k) ? mem.get(k) : null),
  setItem: (k, v) => mem.set(k, String(v)),
  removeItem: (k) => mem.delete(k),
  clear: () => mem.clear(),
};

// webAppBaseUrl() reads the live location, which it resolves through
// webOrigin() — so mirror what a browser exposes in both places.
const browserLocation = { origin: 'https://relay.example', pathname: '/app/' };

function useLocation(next) {
  globalThis.location = next;
  globalThis.window = { location: next };
}

useLocation(browserLocation);

const {
  ensureCustomerToken,
  ensureContractorToken,
  customerPortalUrl,
  contractorPortalUrl,
  customerForDocument,
  portalUrlForDocument,
  generatePortalToken,
} = await import('./portalLinks.js');
const { webAppBaseUrl } = await import('./webOrigin.js');
const { store } = await import('../data/store.js');

const realUpdate = store.update;
let writes;

describe('portal links', () => {
  beforeEach(() => {
    mem.clear();
    writes = [];
    useLocation(browserLocation);
    store.cache = {};
    store.companyId = null;
    store.update = (collection, id, data) => { writes.push({ collection, id, data }); };
  });

  after(() => { store.update = realUpdate; });

  test('builds from the live location, not a hardcoded origin', () => {
    assert.strictEqual(webAppBaseUrl(), 'https://relay.example/app/');
  });

  test('points at the hosted web app when the desktop build serves file://', () => {
    // Electron loads the bundle from file://, where the origin is the string
    // "null" and the pathname is the local index.html — neither belongs in a
    // link we email to a customer.
    useLocation({ origin: 'null', protocol: 'file:', pathname: '/C:/Program%20Files/RELAY/index.html' });

    assert.strictEqual(webAppBaseUrl(), 'https://relaydispatch.com.au/app/');
    assert.strictEqual(
      customerPortalUrl({ id: 'cus_1', portalToken: 'c_pt_abc' }),
      'https://relaydispatch.com.au/app/#/portal/customer?token=c_pt_abc'
    );
    assert.strictEqual(
      contractorPortalUrl({ id: 'con_1', portalToken: 'c_pt_con' }),
      'https://relaydispatch.com.au/app/#/contractor-portal/c_pt_con'
    );
  });

  test('customer links carry the portal token', () => {
    const customer = { id: 'cus_1', portalToken: 'c_pt_abc' };
    assert.strictEqual(customerPortalUrl(customer), 'https://relay.example/app/#/portal/customer?token=c_pt_abc');
    assert.deepStrictEqual(writes, []);
  });

  test('mints and persists a token for legacy customers', () => {
    const customer = { id: 'cus_2' };
    const url = customerPortalUrl(customer);

    assert.ok(customer.portalToken, 'the record should be mutated for the caller');
    assert.match(customer.portalToken, /^c_pt_/);
    assert.strictEqual(writes.length, 1);
    assert.strictEqual(writes[0].collection, 'customers');
    assert.strictEqual(writes[0].id, 'cus_2');
    assert.strictEqual(writes[0].data.portalToken, customer.portalToken);
    assert.ok(url.includes(encodeURIComponent(customer.portalToken)));
  });

  test('reuses a token instead of minting a second one', () => {
    const customer = { id: 'cus_3', portalToken: 'c_pt_keep' };
    ensureCustomerToken(customer);
    ensureCustomerToken(customer);
    assert.deepStrictEqual(writes, []);
    assert.strictEqual(customer.portalToken, 'c_pt_keep');
  });

  test('contractor links use the token path form', () => {
    const contractor = { id: 'con_1', portalToken: 'c_pt_con' };
    assert.strictEqual(contractorPortalUrl(contractor), 'https://relay.example/app/#/contractor-portal/c_pt_con');
    assert.deepStrictEqual(writes, []);
  });

  test('returns null when a record has no id to persist against', () => {
    assert.strictEqual(ensureCustomerToken(null), null);
    assert.strictEqual(ensureCustomerToken({}), null);
    assert.strictEqual(customerPortalUrl({}), null);
    assert.strictEqual(ensureContractorToken(undefined), null);
  });

  test('resolves a document owner by customerId', () => {
    store.cache = { customers: [{ id: 'cus_9', name: 'Acme' }] };
    assert.strictEqual(customerForDocument({ customerId: 'cus_9' })?.name, 'Acme');
  });

  test('resolves legacy snake_case and shouted id keys', () => {
    store.cache = { customers: [{ id: 'cus_9', name: 'Acme' }] };
    assert.strictEqual(customerForDocument({ customer_id: 'cus_9' })?.name, 'Acme');
    assert.strictEqual(customerForDocument({ customerID: 'cus_9' })?.name, 'Acme');
  });

  test('falls back to matching on the stored customer name', () => {
    store.cache = { customers: [{ id: 'cus_9', name: 'Acme' }] };
    assert.strictEqual(customerForDocument({ customerName: 'Acme' })?.id, 'cus_9');
    assert.strictEqual(customerForDocument({ customer: 'Acme' })?.id, 'cus_9');
  });

  test('returns nothing when the document has no resolvable owner', () => {
    store.cache = { customers: [{ id: 'cus_9', name: 'Acme' }] };
    assert.strictEqual(customerForDocument({}), null);
    assert.strictEqual(customerForDocument(null), null);
    assert.strictEqual(customerForDocument({ customerName: 'Nobody' }), null);
    assert.strictEqual(portalUrlForDocument({ customerName: 'Nobody' }), null);
  });

  test('gives a document the same link its customer would get', () => {
    const customer = { id: 'cus_9', name: 'Acme', portalToken: 'c_pt_acme' };
    store.cache = { customers: [customer] };
    assert.strictEqual(
      portalUrlForDocument({ customerId: 'cus_9' }),
      'https://relay.example/app/#/portal/customer?token=c_pt_acme'
    );
  });

  test('tokens come from the CSPRNG, not Math.random()', () => {
    const realRandom = Math.random;
    try {
      // A predictable generator would hand the same value back every time.
      Math.random = () => 0.42;
      const tokens = new Set();
      for (let i = 0; i < 200; i++) tokens.add(generatePortalToken());
      assert.strictEqual(tokens.size, 200, 'every mint should be unique');
      for (const token of tokens) {
        assert.match(token, /^c_pt_[0-9a-f]{32}$/);
      }
    } finally {
      Math.random = realRandom;
    }
  });
});
