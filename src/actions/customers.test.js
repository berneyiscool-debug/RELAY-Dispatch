/**
 * Customer sites — the named addresses that keep one customer's jobs apart.
 *
 * A site only means anything next to its customer, so the matching rules live
 * beside `resolveCustomer` and every action that has to pick one shares them.
 * The rules have to survive how people actually talk: a site called
 * "Ipswich depot" is asked for as "the Ipswich depot", and a street asked for
 * as "12 Smith St" is saved as "12 Smith Street, Ballarat".
 *
 * The actions run against the demo business, as in `data/demoMode.test.js`, so
 * nothing here reaches Supabase, the folder or IndexedDB.
 */

import { test, describe, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert/strict';

import { store, DEMO_COMPANY_ID } from '../data/store.js';
import { supabase } from '../utils/supabase.js';
import { executeAction, getAction } from './registry.js';
import { ERROR_CODES } from './errors.js';
import { customerSites, resolveSite, sameSite, scoreSite, siteLabel, siteOptions } from './customers.js';

const CTX = { source: 'eval', actor: { id: 'user_test', name: 'Test Admin', role: 'admin' } };
const CUSTOMER = 'Brny Site Probe Pty Ltd';

const HOME = { name: 'Home', address: '12 Smith Street, Ballarat' };
const DEPOT = { name: 'Ipswich depot', address: '4 Wattle Lane, Ipswich' };
const customerWith = (sites) => ({ company: 'Two Sites Pty Ltd', sites });

describe('a site is found however the caller names it', () => {
  test('the site\'s own name is a perfect match', () => {
    assert.strictEqual(scoreSite(DEPOT, 'Ipswich depot'), 1);
    assert.strictEqual(scoreSite(DEPOT, '  IPSWICH   DEPOT '), 1);
  });

  test('filler words do not have to be repeated back', () => {
    assert.strictEqual(scoreSite(DEPOT, 'the Ipswich depot'), 0.9);
  });

  test('an address is found from an abbreviation of it', () => {
    assert.strictEqual(scoreSite(HOME, '12 Smith St'), 0.8);
  });

  test('a site the caller knows nothing about matches nothing', () => {
    assert.strictEqual(scoreSite(DEPOT, 'Warehouse'), 0);
    assert.strictEqual(scoreSite(DEPOT, 'Smith Street'), 0);
  });

  test('two sites the customer calls Depot are a question, not a coin toss', () => {
    const customer = customerWith([
      { name: 'Depot', address: '4 Wattle Lane' },
      { name: 'Depot', address: '9 Bell St' },
    ]);

    const found = resolveSite(customer, 'Depot');
    assert.strictEqual(found.kind, 'many');
    assert.strictEqual(found.hits.length, 2);
  });

  test('an address two sites share is a question too', () => {
    const customer = customerWith([
      { name: 'Unit 1', address: '5 Main St' },
      { name: 'Unit 2', address: '5 Main St' },
    ]);

    assert.strictEqual(resolveSite(customer, '5 Main St').kind, 'many');
    assert.deepStrictEqual(siteOptions(resolveSite(customer, '5 Main St').hits), ['Unit 1', 'Unit 2']);
    assert.strictEqual(resolveSite(customer, 'Unit 2').kind, 'one');
    assert.strictEqual(resolveSite(customer, 'Unit 2').index, 1);
  });

  test('the shortlist handed to the user can be passed straight back in', () => {
    const customer = customerWith([
      { name: 'Depot', address: '4 Wattle Lane' },
      { name: 'Depot', address: '9 Bell St' },
    ]);
    const hits = resolveSite(customer, 'Depot').hits;

    assert.deepStrictEqual(siteOptions(hits), ['Depot (4 Wattle Lane)', 'Depot (9 Bell St)']);
    siteOptions(hits).forEach((option, index) => {
      const picked = resolveSite(customer, option);
      assert.strictEqual(picked.kind, 'one', `${option} has to pick one site`);
      assert.strictEqual(picked.site, customer.sites[index]);
    });
  });

  test('a label identifies a site the name alone could not', () => {
    assert.strictEqual(siteLabel(HOME), 'Home (12 Smith Street, Ballarat)');
    assert.strictEqual(siteLabel({ address: '4 Wattle Lane' }), '4 Wattle Lane');
    assert.strictEqual(siteLabel({}), '');
  });

  test('one site and one clear winner need no question asked', () => {
    assert.strictEqual(resolveSite(customerWith([HOME]), 'Smith St').kind, 'one');
    assert.strictEqual(resolveSite(customerWith([HOME]), 'Warehouse').kind, 'none');
    assert.strictEqual(resolveSite(customerWith([HOME, DEPOT]), 'the depot').site, DEPOT);
  });

  test('the same site is recognised by name or by address, but A St is not B St', () => {
    assert.ok(sameSite({ name: 'Depot' }, { name: 'depot' }));
    assert.ok(sameSite({ address: 'A St' }, { address: 'a  st' }));
    assert.ok(!sameSite({ address: 'A St' }, { address: 'B St' }));
    assert.ok(!sameSite({ name: 'Unit 1', address: '5 Main St' }, { name: 'Unit 2', address: '6 Bell St' }));
  });

  test('a customer saved before sites existed simply has none', () => {
    assert.deepStrictEqual(customerSites({ company: 'Old Co' }), []);
    assert.deepStrictEqual(customerSites({ company: 'Old Co', sites: null }), []);
  });
});

describe('the assistant can list, add and change a customer\'s sites', () => {
  let calls;
  let customer;
  const saved = {};

  beforeEach(async () => {
    calls = [];
    saved.from = supabase.from;
    supabase.from = (table) => { calls.push(table); return { upsert: async () => ({}), insert: async () => ({}), delete: () => ({ eq: async () => ({}), in: async () => ({}) }) }; };
    store.demoMode = true;
    store.companyId = DEMO_COMPANY_ID;
    store.db = { transaction: () => { calls.push('indexeddb'); throw new Error('IndexedDB touched'); } };
    await store.initializeDemo({ id: 'user_test', name: 'Test Admin', email: 'test@example.com' });
    customer = store.create('customers', { company: CUSTOMER, status: 'Active', type: 'Company', address: '1 Head Office Rd' });
  });

  afterEach(() => {
    supabase.from = saved.from;
    store.demoMode = false;
    store.db = null;
    store.clearSync();
  });

  const storedSites = () => customerSites(store.getById('customers', customer.id));

  test('a customer with no sites says so rather than inventing one', async () => {
    const outcome = await executeAction('list_sites', { customer: CUSTOMER }, CTX);

    assert.deepStrictEqual(outcome.result.sites, []);
    assert.match(outcome.result.summary, /no sites saved/);
    assert.match(outcome.result.summary, /1 Head Office Rd/);
  });

  test('add_site saves a site and list_sites reads it back', async () => {
    const added = await executeAction('add_site', { customer: CUSTOMER, ...DEPOT, notes: 'Gate code 1234' }, CTX);

    assert.strictEqual(added.result.created, true);
    assert.deepStrictEqual(storedSites(), [{ ...DEPOT, notes: 'Gate code 1234' }]);
    assert.match(added.result.summary, /Added site Ipswich depot \(4 Wattle Lane, Ipswich\)/);

    const listed = await executeAction('list_sites', { customer: CUSTOMER }, CTX);
    assert.strictEqual(listed.result.sites.length, 1);
    assert.strictEqual(listed.result.sites[0].name, 'Ipswich depot');
    assert.strictEqual(listed.result.sites[0].jobs, 0, 'a site nothing is booked at yet counts no jobs');
    assert.match(listed.result.summary, /has 1 site: Ipswich depot \(4 Wattle Lane, Ipswich\)\./);
  });

  test('adding a site the customer already has changes nothing', async () => {
    await executeAction('add_site', { customer: CUSTOMER, ...DEPOT }, CTX);
    const again = await executeAction('add_site', { customer: CUSTOMER, name: 'the Ipswich Depot', address: '4 Wattle Lane, Ipswich' }, CTX);

    assert.strictEqual(again.result.created, false);
    assert.strictEqual(storedSites().length, 1);
    assert.match(again.result.summary, /already had/);
  });

  test('add_site fills in a detail a site was saved without', async () => {
    store.update('customers', customer.id, { sites: [{ name: 'Depot', address: '' }] });
    const outcome = await executeAction('add_site', { customer: CUSTOMER, name: 'Depot', address: '4 Wattle Lane' }, CTX);

    assert.strictEqual(outcome.result.created, false);
    assert.deepStrictEqual(storedSites(), [{ name: 'Depot', address: '4 Wattle Lane', notes: '' }]);
  });

  test('update_site changes only the fields it was given', async () => {
    store.update('customers', customer.id, { sites: [{ ...DEPOT }] });
    const outcome = await executeAction('update_site', { customer: CUSTOMER, site: '4 Wattle', name: 'North Depot' }, CTX);

    assert.deepStrictEqual(outcome.result.fields, ['name']);
    assert.deepStrictEqual(storedSites(), [{ name: 'North Depot', address: '4 Wattle Lane, Ipswich' }]);
  });

  test('update_site asks which site when the reference fits two', async () => {
    store.update('customers', customer.id, { sites: [{ name: 'Depot', address: '4 Wattle Lane' }, { name: 'Depot', address: '9 Bell St' }] });

    await assert.rejects(
      () => executeAction('update_site', { customer: CUSTOMER, site: 'Depot', address: '1 New Rd' }, CTX),
      (error) => {
        assert.strictEqual(error.code, ERROR_CODES.AMBIGUOUS);
        assert.deepStrictEqual(error.details.options.map((option) => option.label), ['Depot (4 Wattle Lane)', 'Depot (9 Bell St)']);
        assert.match(error.message, /Which one did you mean/);
        return true;
      }
    );
    assert.deepStrictEqual(storedSites().map((site) => site.address), ['4 Wattle Lane', '9 Bell St'], 'an ambiguous reference changes nothing');
  });

  test('update_site says what the sites are when it cannot find one', async () => {
    store.update('customers', customer.id, { sites: [{ ...DEPOT }] });

    await assert.rejects(
      () => executeAction('update_site', { customer: CUSTOMER, site: 'Warehouse', name: 'Shed' }, CTX),
      (error) => {
        assert.strictEqual(error.code, ERROR_CODES.INVALID_INPUT);
        assert.match(error.message, /No site matched "Warehouse"/);
        assert.match(error.message, /Ipswich depot \(4 Wattle Lane, Ipswich\)/);
        return true;
      }
    );
  });

  test('update_site needs something to change', async () => {
    store.update('customers', customer.id, { sites: [{ ...DEPOT }] });
    await assert.rejects(
      () => executeAction('update_site', { customer: CUSTOMER, site: 'Depot' }, CTX),
      /at least one new value/
    );
  });

  test('the site actions carry a path back to the customer\'s sites tab', async () => {
    const outcome = await executeAction('add_site', { customer: CUSTOMER, ...DEPOT }, CTX);

    assert.deepStrictEqual(outcome.artifacts, [{ label: `${CUSTOMER} — sites`, path: `/people/${customer.id}?tab=sites` }]);
    assert.strictEqual(getAction('list_sites').readOnly, true);
    assert.deepStrictEqual(getAction('add_site').permission, { module: 'Customers', key: 'edit' });
  });

  test('the demo business must not reach Supabase or IndexedDB', async () => {
    await executeAction('list_sites', { customer: CUSTOMER }, CTX);
    await executeAction('add_site', { customer: CUSTOMER, ...DEPOT }, CTX);
    await executeAction('update_site', { customer: CUSTOMER, site: 'Depot', notes: 'Ring first' }, CTX);

    assert.deepStrictEqual(calls, [], 'the demo business must not reach Supabase or IndexedDB');
  });

  test('delete_site takes one site off the list and leaves the rest', async () => {
    store.update('customers', customer.id, { sites: [{ ...DEPOT }, { ...HOME }] });

    const outcome = await executeAction('delete_site', { customer: CUSTOMER, site: '4 Wattle', reason: 'Lease ended' }, CTX);

    assert.strictEqual(outcome.result.site.name, DEPOT.name);
    assert.deepStrictEqual(storedSites(), [{ ...HOME }]);
    assert.match(outcome.result.summary, /Removed site Ipswich depot/);
  });

  test('delete_site asks which site when the reference fits two', async () => {
    store.update('customers', customer.id, { sites: [{ name: 'Depot', address: '4 Wattle Lane' }, { name: 'Depot', address: '9 Bell St' }] });

    await assert.rejects(
      () => executeAction('delete_site', { customer: CUSTOMER, site: 'Depot' }, CTX),
      (error) => error.code === ERROR_CODES.AMBIGUOUS,
    );
    assert.strictEqual(storedSites().length, 2);
  });

  test('a contact can be added, changed and removed', async () => {
    const added = await executeAction('add_contact', { customer: CUSTOMER, name: 'Jane Smith', role: 'Site foreman', phone: '0400 000 000' }, CTX);
    assert.strictEqual(added.result.created, true);
    assert.deepStrictEqual(store.getById('customers', customer.id).contacts, [{ name: 'Jane Smith', role: 'Site foreman', phone: '0400 000 000' }]);

    const again = await executeAction('add_contact', { customer: CUSTOMER, name: 'jane smith', email: 'jane@example.com' }, CTX);
    assert.strictEqual(again.result.created, false, 'the same person is not added twice');

    const updated = await executeAction('update_contact', { customer: CUSTOMER, contact: 'Jane', role: 'Project manager' }, CTX);
    assert.deepStrictEqual(updated.result.fields, ['role']);
    assert.strictEqual(store.getById('customers', customer.id).contacts[0].role, 'Project manager');

    const removed = await executeAction('delete_contact', { customer: CUSTOMER, contact: '0400 000 000', reason: 'Left the company' }, CTX);
    assert.match(removed.result.summary, /Removed Jane Smith/);
    assert.deepStrictEqual(store.getById('customers', customer.id).contacts, []);
  });

  test('a contact that is not on the customer is refused, not guessed', async () => {
    store.update('customers', customer.id, { contacts: [{ name: 'Jane Smith' }] });

    await assert.rejects(
      () => executeAction('delete_contact', { customer: CUSTOMER, contact: 'Bob Jones' }, CTX),
      (error) => error.code === ERROR_CODES.INVALID_INPUT && /no contact matching/.test(error.message),
    );
    assert.strictEqual(store.getById('customers', customer.id).contacts.length, 1);
  });

  test('delete_customer removes the record and says what is left behind', async () => {
    store.create('jobs', { customerId: customer.id, title: 'Probe job', status: 'Pending' });
    store.create('quotes', { customerId: customer.id, title: 'Probe quote', status: 'Draft' });

    const outcome = await executeAction('delete_customer', { customer: CUSTOMER, reason: 'Duplicate record' }, CTX);

    assert.strictEqual(store.getById('customers', customer.id), null);
    assert.deepStrictEqual(outcome.result.linked.jobs, 1);
    assert.deepStrictEqual(outcome.result.linked.quotes, 1);
    assert.match(outcome.result.summary, /1 jobs/);
    assert.match(outcome.result.summary, /left on file without a customer/);
    assert.ok(store.getAll('activity').some((entry) => entry.type === 'customer_deleted' && entry.recordId === customer.id));
  });

  test('brny must ask before deleting a customer', async () => {
    await assert.rejects(
      () => executeAction('delete_customer', { customer: CUSTOMER }, { ...CTX, source: 'brny' }),
      (error) => error.code === ERROR_CODES.APPROVAL_REQUIRED,
    );
    assert.ok(store.getById('customers', customer.id), 'a declined approval deletes nothing');
  });
});
