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
  savedCustomerPortalUrl,
  savedContractorPortalUrl,
  customerForDocument,
  portalUrlForDocument,
  generatePortalToken,
} = await import('./portalLinks.js');
const { webAppBaseUrl } = await import('./webOrigin.js');
const { store } = await import('../data/store.js');

const realUpdate = store.update;
let writes;
let writeResult;

describe('portal links', () => {
  beforeEach(() => {
    mem.clear();
    writes = [];
    writeResult = { ok: true };
    useLocation(browserLocation);
    store.cache = {};
    store.companyId = null;
    store.update = (collection, id, data) => {
      writes.push({ collection, id, data });
      // store.update resolves with { ok } in cloud mode and returns the record itself
      // in local mode; null when the row is not cached or the install is read-only.
      return writeResult;
    };
  });

  after(() => { store.update = realUpdate; });

  test('builds from the live location, not a hardcoded origin', () => {
    assert.strictEqual(webAppBaseUrl(), 'https://relay.example/app/');
  });

  test('points at the hosted web app when the desktop build serves file://', async () => {
    // Electron loads the bundle from file://, where the origin is the string
    // "null" and the pathname is the local index.html — neither belongs in a
    // link we email to a customer.
    useLocation({ origin: 'null', protocol: 'file:', pathname: '/C:/Program%20Files/RELAY/index.html' });

    assert.strictEqual(webAppBaseUrl(), 'https://relaydispatch.com.au/app/');
    assert.strictEqual(
      await customerPortalUrl({ id: 'cus_1', portalToken: 'c_pt_abc' }),
      'https://relaydispatch.com.au/app/#/portal/customer?token=c_pt_abc'
    );
    assert.strictEqual(
      await contractorPortalUrl({ id: 'con_1', portalToken: 'c_pt_con' }),
      'https://relaydispatch.com.au/app/#/contractor-portal/c_pt_con'
    );
  });

  test('customer links carry the portal token', async () => {
    const customer = { id: 'cus_1', portalToken: 'c_pt_abc' };
    assert.strictEqual(await customerPortalUrl(customer), 'https://relay.example/app/#/portal/customer?token=c_pt_abc');
    assert.deepStrictEqual(writes, []);
  });

  test('mints and persists a token for legacy customers', async () => {
    const customer = { id: 'cus_2' };
    const url = await customerPortalUrl(customer);

    assert.ok(customer.portalToken, 'the record should be mutated for the caller');
    assert.match(customer.portalToken, /^c_pt_/);
    assert.strictEqual(writes.length, 1);
    assert.strictEqual(writes[0].collection, 'customers');
    assert.strictEqual(writes[0].id, 'cus_2');
    assert.strictEqual(writes[0].data.portalToken, customer.portalToken);
    assert.ok(url.includes(encodeURIComponent(customer.portalToken)));
  });

  // A link is only worth issuing if its token is on file. Minting one that was never
  // stored hands out a URL that resolves to nothing — and because the next visit mints
  // a different token for the same record, it also kills every link issued before it.
  test('issues no link when the token could not be stored', async () => {
    for (const refusal of [null, { ok: false, error: new Error('denied') }]) {
      writeResult = refusal;
      const customer = { id: 'cus_4' };
      assert.strictEqual(await customerPortalUrl(customer), null);
      assert.strictEqual(customer.portalToken, undefined, 'an unsaved token must not reach the record');
      assert.strictEqual(await ensureCustomerToken(customer), null);
    }
  });

  test('issues no contractor link when the token could not be stored', async () => {
    writeResult = null;
    const contractor = { id: 'con_2' };
    assert.strictEqual(await contractorPortalUrl(contractor), null);
    assert.strictEqual(contractor.portalToken, undefined);
  });

  test('saved-link helpers never write and never mint', () => {
    assert.strictEqual(savedCustomerPortalUrl({ id: 'cus_5' }), null);
    assert.strictEqual(savedContractorPortalUrl({ id: 'con_5' }), null);
    assert.strictEqual(
      savedCustomerPortalUrl({ id: 'cus_5', portalToken: 'c_pt_have' }),
      'https://relay.example/app/#/portal/customer?token=c_pt_have'
    );
    assert.strictEqual(
      savedContractorPortalUrl({ id: 'con_5', portalToken: 'c_pt_have' }),
      'https://relay.example/app/#/contractor-portal/c_pt_have'
    );
    assert.deepStrictEqual(writes, []);
  });

  test('reuses a token instead of minting a second one', async () => {
    const customer = { id: 'cus_3', portalToken: 'c_pt_keep' };
    await ensureCustomerToken(customer);
    await ensureCustomerToken(customer);
    assert.deepStrictEqual(writes, []);
    assert.strictEqual(customer.portalToken, 'c_pt_keep');
  });

  test('contractor links use the token path form', async () => {
    const contractor = { id: 'con_1', portalToken: 'c_pt_con' };
    assert.strictEqual(await contractorPortalUrl(contractor), 'https://relay.example/app/#/contractor-portal/c_pt_con');
    assert.deepStrictEqual(writes, []);
  });

  test('returns null when a record has no id to persist against', async () => {
    assert.strictEqual(await ensureCustomerToken(null), null);
    assert.strictEqual(await ensureCustomerToken({}), null);
    assert.strictEqual(await customerPortalUrl({}), null);
    assert.strictEqual(await ensureContractorToken(undefined), null);
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

  test('returns nothing when the document has no resolvable owner', async () => {
    store.cache = { customers: [{ id: 'cus_9', name: 'Acme' }] };
    assert.strictEqual(customerForDocument({}), null);
    assert.strictEqual(customerForDocument(null), null);
    assert.strictEqual(customerForDocument({ customerName: 'Nobody' }), null);
    assert.strictEqual(await portalUrlForDocument({ customerName: 'Nobody' }), null);
  });

  test('gives a document the same link its customer would get', async () => {
    const customer = { id: 'cus_9', name: 'Acme', portalToken: 'c_pt_acme' };
    store.cache = { customers: [customer] };
    assert.strictEqual(
      await portalUrlForDocument({ customerId: 'cus_9' }),
      'https://relay.example/app/#/portal/customer?token=c_pt_acme'
    );
  });

  test('an emailed document link is withheld when the token cannot be saved', async () => {
    store.cache = { customers: [{ id: 'cus_9', name: 'Acme' }] };
    writeResult = { ok: false, error: new Error('denied') };
    assert.strictEqual(await portalUrlForDocument({ customerId: 'cus_9' }), null);
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
