/**
 * Customers.
 *
 * Every other flow needs a customer to hang off, so this module owns the one
 * piece of shared resolution logic the rest of the action layer uses:
 * `resolveCustomer`. A name that matches nothing is created on demand, because
 * "add a lead for Jane Smith" is a normal thing to ask brny and refusing it
 * would be worse than a possible duplicate the office can merge later.
 */

import { store } from '../data/store.js';
import { defineAction } from './registry.js';
import { resolveOne, tryResolveOne } from './resolve.js';
import { objectSchema, str, enumOf } from './schema.js';
import { invalidInput } from './errors.js';

const COMPANY_HINTS = /\b(pty|limited|ltd|inc|co|corp|group|holdings|services|trust|university|school|council|hotel|motel|club|tavern|brewing|hospital)\b/i;

export function customerLabel(customer) {
  if (!customer) return '';
  return customer.company || [customer.firstName, customer.lastName].filter(Boolean).join(' ') || customer.email || customer.id;
}

export function guessCustomerType(name) {
  return COMPANY_HINTS.test(String(name)) ? 'Company' : 'Individual';
}

function nameTokens(text) {
  return String(text ?? '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim()
    .split(' ')
    .filter(Boolean);
}

/**
 * True when one name is the other plus extra words, e.g. "Ballarat Solar Co"
 * and "Ballarat Solar Co Pty Ltd". Compared word by word so "Bill" does not
 * match "Billings Haulage".
 */
export function sameCustomerName(a, b) {
  const x = nameTokens(a);
  const y = nameTokens(b);
  if (!x.length || !y.length) return false;
  const [shorter, longer] = x.length <= y.length ? [x, y] : [y, x];
  return shorter.every((token, index) => token === longer[index]);
}

/**
 * Find a customer by name, or create one when `create` is set.
 *
 * Matching runs through the shared scorer, which already ranks an exact id or
 * exact field above a partial one, so only genuinely ambiguous names are
 * rejected (see `resolveOne`).
 */
export function resolveCustomer(query, { create = false, extra = {} } = {}) {
  const text = String(query ?? '').trim();
  if (!text) throw invalidInput('A customer name or id is required.');

  const existing = tryResolveOne('customers', text, {
    label: customerLabel,
    searchFields: ['company', 'firstName', 'lastName', 'email', 'phone', 'address'],
    what: 'customer',
  });
  if (existing) return { customer: existing, created: false };

  if (!create) return { customer: null, created: false };

  const isCompany = guessCustomerType(text) === 'Company';
  const customer = store.create('customers', {
    status: 'Active',
    type: isCompany ? 'Company' : 'Individual',
    ...(isCompany ? { company: text } : { firstName: text }),
    ...extra,
  });
  return { customer, created: true };
}

defineAction({
  name: 'find_customer',
  title: 'Look up a customer',
  description:
    'Find a customer and their contact details. Use it to confirm which customer a request refers to before quoting or invoicing.',
  permission: { module: 'Customers', key: 'view' },
  readOnly: true,
  inputSchema: objectSchema({ customer: str('Customer name, company, email, phone, address or id.') }, ['customer']),
  run: async ({ customer }) => {
    const record = resolveOne('customers', customer, {
      label: customerLabel,
      searchFields: ['company', 'firstName', 'lastName', 'email', 'phone', 'address'],
      what: 'customer',
    }).record;
    const jobs = (store.getAll('jobs') || []).filter((job) => job.customerId === record.id);
    const quotes = (store.getAll('quotes') || []).filter((quote) => quote.customerId === record.id);
    return {
      summary: `Found ${customerLabel(record)} (${jobs.length} jobs, ${quotes.length} quotes).`,
      customer: record,
      counts: { jobs: jobs.length, quotes: quotes.length },
    };
  },
});

defineAction({
  name: 'create_customer',
  title: 'Add a customer',
  description:
    'Create a customer record. If a customer with that name already exists — including a longer version of it such as adding "Pty Ltd" — the existing record is returned instead of creating a duplicate.',
  permission: { module: 'Customers', key: 'create' },
  inputSchema: objectSchema(
    {
      name: str('Company name, or the person\'s full name for an individual.'),
      type: enumOf(['Company', 'Individual'], 'Defaults to Company when the name looks like a business.'),
      firstName: str('First name, for an individual.'),
      lastName: str('Last name, for an individual.'),
      email: str('Email address.'),
      phone: str('Phone number.'),
      address: str('Site or billing address.'),
      notes: str('Anything worth remembering about the customer.'),
    },
    ['name']
  ),
  run: async ({ name, type, firstName, lastName, email, phone, address, notes }) => {
    const existing = (store.getAll('customers') || []).find((c) => sameCustomerName(customerLabel(c), name));
    if (existing) {
      return {
        summary: `${customerLabel(existing)} already exists — using that record.`,
        customer: existing,
        created: false,
      };
    }
    const isCompany = !firstName && !lastName && (type ? type === 'Company' : guessCustomerType(name) === 'Company');
    const record = store.create('customers', {
      status: 'Active',
      type: isCompany ? 'Company' : (type || 'Individual'),
      ...(isCompany ? { company: name } : { firstName: firstName || name, lastName: lastName || undefined }),
      ...(email ? { email } : {}),
      ...(phone ? { phone } : {}),
      ...(address ? { address } : {}),
      ...(notes ? { notes } : {}),
    });
    return { summary: `Added customer ${customerLabel(record)}.`, customer: record, created: true };
  },
});

defineAction({
  name: 'update_customer',
  title: 'Update a customer',
  description: 'Change a customer\'s contact details. Only pass the fields that change.',
  permission: { module: 'Customers', key: 'edit' },
  inputSchema: objectSchema(
    {
      customer: str('Customer name or id.'),
      name: str('New company name.'),
      email: str('New email address.'),
      phone: str('New phone number.'),
      address: str('New address.'),
      type: enumOf(['Company', 'Individual'], 'New customer type.'),
    },
    ['customer']
  ),
  run: async ({ customer, name, email, phone, address, type }) => {
    const found = resolveOne('customers', customer, {
      label: customerLabel,
      searchFields: ['company', 'firstName', 'lastName', 'email', 'phone'],
      what: 'customer',
    }).record;
    const changes = {};
    if (name) changes[found.type === 'Individual' && !found.company ? 'firstName' : 'company'] = name;
    if (email) changes.email = email;
    if (phone) changes.phone = phone;
    if (address) changes.address = address;
    if (type) changes.type = type;
    if (!Object.keys(changes).length) throw invalidInput('Nothing to update — pass at least one new value.');
    await store.update('customers', found.id, changes);
    return { summary: `Updated ${customerLabel(found)} (${Object.keys(changes).join(', ')}).`, customerId: found.id, changes };
  },
});
