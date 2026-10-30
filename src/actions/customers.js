/**
 * Customers.
 *
 * Every other flow needs a customer to hang off, so this module owns the one
 * piece of shared resolution logic the rest of the action layer uses:
 * `resolveCustomer`. A name that matches nothing is created on demand, because
 * "add a lead for Jane Smith" is a normal thing to ask brny and refusing it
 * would be worse than a possible duplicate the office can merge later.
 *
 * It also owns the sites that hang off a customer — the named addresses such as
 * "Depot" or "12 Smith St" that keep one customer's jobs at different premises
 * apart — because a site only means anything next to its customer.
 */

import { store } from '../data/store.js';
import { defineAction } from './registry.js';
import { normalizeText, resolveOne, tryResolveOne } from './resolve.js';
import { objectSchema, str, num, enumOf } from './schema.js';
import { ambiguousMatch, invalidInput } from './errors.js';
import { logActivity } from './context.js';

const COMPANY_HINTS = /\b(pty|limited|ltd|inc|co|corp|group|holdings|services|trust|university|school|council|hotel|motel|club|tavern|brewing|hospital)\b/i;

export function customerLabel(customer) {
  if (!customer) return '';
  return customer.company || [customer.firstName, customer.lastName].filter(Boolean).join(' ') || customer.email || customer.id;
}

export function guessCustomerType(name) {
  return COMPANY_HINTS.test(String(name)) ? 'Company' : 'Individual';
}

/**
 * A non-negative whole number of days, or null when the caller said nothing.
 * Rejected rather than clamped: a negative term would put every new invoice's
 * due date in the past.
 */
function normalizeTerms(value) {
  if (value === null || value === undefined || value === '') return null;
  const days = Number(value);
  if (!Number.isFinite(days) || days < 0) {
    throw invalidInput('Payment terms must be a number of days, 0 or more.', { paymentTermsDays: value });
  }
  return Math.round(days);
}

/** A non-negative dollar credit limit, or null for "no limit". */
function normalizeCreditLimit(value) {
  if (value === null || value === undefined || value === '') return null;
  const limit = Number(value);
  if (!Number.isFinite(limit) || limit < 0) {
    throw invalidInput('Credit limit must be a dollar amount, 0 or more.', { creditLimit: value });
  }
  return limit;
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
 * A customer's sites, always as an array: a customer saved before sites existed
 * simply has no `sites` key.
 */
export function customerSites(customer) {
  return Array.isArray(customer?.sites) ? customer.sites : [];
}

/** "Depot (12 Smith St)", or whichever half of that exists. */
export function siteLabel(site) {
  if (!site) return '';
  const name = String(site.name || '').trim();
  const address = String(site.address || '').trim();
  if (name && address) return `${name} (${address})`;
  return name || address;
}

/**
 * Filler words that never have to be found, so "the Ipswich depot" still finds
 * "Ipswich Depot". Only articles, prepositions and possessives are dropped —
 * "depot" and "workshop" are exactly the words that tell two sites apart.
 */
const SITE_NOISE = new Set(['the', 'a', 'an', 'of', 'at', 'on', 'in', 'to', 'for', 'my', 'our', 'their', 'his', 'her', 'place']);

/** Two sites are the same one when the office would call them the same name or address. */
export function sameSite(a, b) {
  const name = nameTokens(a?.name).join(' ');
  const address = nameTokens(a?.address).join(' ');
  return (!!name && name === nameTokens(b?.name).join(' ')) || (!!address && address === nameTokens(b?.address).join(' '));
}

/**
 * How well a site answers to what the caller called it, 0 to 1.
 *
 * Every word of the query has to land somewhere in the site's name or address,
 * and a word may match the start of a longer one so "12 smith st" finds
 * "12 Smith Street". A query the name answers beats one only the address does,
 * and a query that spans both — "Depot (12 Smith St)", which is exactly the
 * label `siteLabel` hands back — still scores, weighted by how much of it the
 * site quotes word for word, so a shortlist read to the user can be passed
 * straight back in.
 */
export function scoreSite(site, query) {
  const wanted = nameTokens(query);
  if (!wanted.length || !site) return 0;
  const name = nameTokens(site.name);
  const address = nameTokens(site.address);
  const answeredBy = (words) => wanted.every((token) => SITE_NOISE.has(token) || words.some((word) => word.startsWith(token)));
  if (!answeredBy([...name, ...address])) return 0;
  if (answeredBy(name)) {
    return name.length === wanted.length && name.join(' ') === wanted.join(' ') ? 1 : 0.9;
  }
  if (answeredBy(address)) return 0.8;
  const words = [...name, ...address];
  const asked = wanted.filter((token) => !SITE_NOISE.has(token));
  return asked.length ? 0.7 * (asked.filter((token) => words.includes(token)).length / asked.length) : 0.7;
}

/** The customer's sites this query could mean, best first, with their index. */
export function matchSites(customer, query) {
  const text = String(query ?? '').trim();
  if (!text) return [];
  return customerSites(customer)
    .map((site, index) => ({ site, index, score: scoreSite(site, text) }))
    .filter((hit) => hit.score > 0)
    .sort((a, b) => b.score - a.score || a.index - b.index);
}

/**
 * Which of a customer's sites a request means.
 *
 * `{kind:'none'}` when nothing matches, `{kind:'one', site, index}` when one
 * site is clearly the one, and `{kind:'many', hits}` when a shortlist has to go
 * back to the user as a question. Only a clear winner counts as an answer: two
 * sites that tie — including two the customer calls by the same name — are a
 * question rather than a coin toss.
 */
export function resolveSite(customer, query) {
  const hits = matchSites(customer, query);
  if (!hits.length) return { kind: 'none', hits };
  const [top] = hits;
  const runnerUp = hits[1]?.score ?? 0;
  if (hits.length === 1 || top.score - runnerUp >= 0.15) {
    return { kind: 'one', site: top.site, index: top.index, hits };
  }
  return { kind: 'many', hits: hits.slice(0, 5) };
}

/**
 * Labels for a shortlist of sites, short enough for a question card. The name
 * alone reads best, so the address is only carried along when two candidates
 * would otherwise look identical.
 */
export function siteOptions(hits) {
  return hits.map((hit) => {
    const name = String(hit.site?.name || '').trim();
    if (!name) return siteLabel(hit.site);
    const shared = hits.some((other) => other !== hit && String(other.site?.name || '').trim().toLowerCase() === name.toLowerCase());
    return shared ? siteLabel(hit.site) : name;
  });
}

/** The error to hand back when a site name or address matches nothing. */
export function siteNotFound(customer, query) {
  const sites = customerSites(customer);
  const label = customerLabel(customer) || 'That customer';
  if (!sites.length) {
    return invalidInput(
      `${label} has no sites saved yet — only their address, ${customer?.address || 'none set'}. Add the site with add_site first, then name it on the job.`
    );
  }
  return invalidInput(
    `No site matched "${query}" for ${label}. Their sites are: ${sites.map((site) => siteLabel(site)).join(', ')}. Use one of those, or add a new one with add_site first.`
  );
}

/** The error to hand back when a site name or address fits more than one site. */
export function siteAmbiguous(query, hits) {
  const labels = siteOptions(hits);
  return ambiguousMatch('site', query, labels.map((label) => ({ id: label, label })));
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
      paymentTermsDays: num('Days of credit on new invoices, 0 for COD. Defaults to 30.', { minimum: 0 }),
      creditLimit: num('Dollar credit limit before a warning shows on a new invoice. Omit or 0 for no limit.', { minimum: 0 }),
      notes: str('Anything worth remembering about the customer.'),
    },
    ['name']
  ),
  run: async ({ name, type, firstName, lastName, email, phone, address, paymentTermsDays, creditLimit, notes }) => {
    const existing = (store.getAll('customers') || []).find((c) => sameCustomerName(customerLabel(c), name));
    if (existing) {
      return {
        summary: `${customerLabel(existing)} already exists — using that record.`,
        customer: existing,
        created: false,
      };
    }
    const isCompany = !firstName && !lastName && (type ? type === 'Company' : guessCustomerType(name) === 'Company');
    const terms = normalizeTerms(paymentTermsDays);
    const limit = normalizeCreditLimit(creditLimit);
    const record = store.create('customers', {
      status: 'Active',
      type: isCompany ? 'Company' : (type || 'Individual'),
      ...(isCompany ? { company: name } : { firstName: firstName || name, lastName: lastName || undefined }),
      ...(email ? { email } : {}),
      ...(phone ? { phone } : {}),
      ...(address ? { address } : {}),
      ...(terms !== null ? { paymentTermsDays: terms } : {}),
      ...(limit !== null ? { creditLimit: limit } : {}),
      ...(notes ? { notes } : {}),
    });
    return { summary: `Added customer ${customerLabel(record)}.`, customer: record, created: true };
  },
});

defineAction({
  name: 'update_customer',
  title: 'Update a customer',
  description: 'Change a customer\'s contact details or account terms. Only pass the fields that change.',
  permission: { module: 'Customers', key: 'edit' },
  inputSchema: objectSchema(
    {
      customer: str('Customer name or id.'),
      name: str('New company name.'),
      email: str('New email address.'),
      phone: str('New phone number.'),
      address: str('New address.'),
      type: enumOf(['Company', 'Individual'], 'New customer type.'),
      paymentTermsDays: num('Days of credit on new invoices, 0 for COD.', { minimum: 0 }),
      creditLimit: num('Dollar credit limit before a new invoice shows a warning. 0 for no limit.', { minimum: 0 }),
    },
    ['customer']
  ),
  run: async ({ customer, name, email, phone, address, type, paymentTermsDays, creditLimit }) => {
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
    if (paymentTermsDays !== undefined) changes.paymentTermsDays = normalizeTerms(paymentTermsDays);
    if (creditLimit !== undefined) changes.creditLimit = normalizeCreditLimit(creditLimit);
    if (!Object.keys(changes).length) throw invalidInput('Nothing to update — pass at least one new value.');
    await store.update('customers', found.id, changes);
    return { summary: `Updated ${customerLabel(found)} (${Object.keys(changes).join(', ')}).`, customerId: found.id, changes };
  },
});

/** The customer a site action is about, or the reason there is not exactly one. */
function requireCustomerRecord(query) {
  const text = String(query ?? '').trim();
  if (!text) throw invalidInput('A customer name or id is required.');
  return resolveOne('customers', text, {
    label: customerLabel,
    searchFields: ['company', 'firstName', 'lastName', 'email', 'phone', 'address'],
    what: 'customer',
  }).record;
}

/** How many of a customer's jobs sit at a site, matched the way the office books them. */
function siteJobCount(jobs, site) {
  const name = String(site.name || '').trim().toLowerCase();
  const address = String(site.address || '').trim().toLowerCase();
  return jobs.filter((job) => {
    if (name && String(job.siteName || '').trim().toLowerCase() === name) return true;
    return !!address && String(job.siteAddress || '').trim().toLowerCase() === address;
  }).length;
}

/** A path back to the customer's sites tab, for the button under the reply. */
const sitesArtifact = (result) => [{ label: `${result.customerName} — sites`, path: `/people/${result.customerId}?tab=sites` }];

defineAction({
  name: 'list_sites',
  title: 'List a customer\'s sites',
  description:
    'List the sites saved for a customer — the named addresses such as "Depot" or "12 Smith St" their jobs can be booked at. Read this before booking a job for a customer with more than one premises.',
  permission: { module: 'Customers', key: 'view' },
  readOnly: true,
  inputSchema: objectSchema({ customer: str('Customer name or id.') }, ['customer']),
  summarize: (input, result) => result.summary,
  run: async ({ customer }) => {
    const record = requireCustomerRecord(customer);
    const jobs = (store.getAll('jobs') || []).filter((job) => job.customerId === record.id);
    const sites = customerSites(record).map((site) => ({
      name: String(site.name || '').trim(),
      address: String(site.address || '').trim(),
      notes: site.notes || '',
      jobs: siteJobCount(jobs, site),
    }));
    const label = customerLabel(record);
    return {
      summary: sites.length
        ? `${label} has ${sites.length} site${sites.length === 1 ? '' : 's'}: ${sites.map((site) => siteLabel(site)).join(', ')}.`
        : `${label} has no sites saved — their address is ${record.address || 'not set'}.`,
      customerId: record.id,
      customerName: label,
      address: record.address || '',
      sites,
    };
  },
  artifacts: sitesArtifact,
});

defineAction({
  name: 'add_site',
  title: 'Add a site to a customer',
  description:
    'Save a site — a named address a customer\'s work happens at — so jobs can be booked to it by name. Use it when the address a job is at is not on the customer\'s site list yet.',
  permission: { module: 'Customers', key: 'edit' },
  inputSchema: objectSchema(
    {
      customer: str('Customer name or id.'),
      name: str('Short name for the site, such as "Depot" or "Home".'),
      address: str('Street address of the site.'),
      notes: str('Access details or anything else worth knowing about the site.'),
    },
    ['customer', 'name', 'address']
  ),
  summarize: (input, result) => result.summary,
  run: async ({ customer, name, address, notes }) => {
    const record = requireCustomerRecord(customer);
    const label = customerLabel(record);
    const sites = customerSites(record).map((site) => ({ ...site }));
    const wanted = {
      name: String(name).trim(),
      address: String(address).trim(),
      notes: notes == null ? '' : String(notes).trim(),
    };
    const existing = sites.findIndex((site) => sameSite(site, wanted));
    if (existing !== -1) {
      const site = sites[existing];
      sites[existing] = {
        ...site,
        name: site.name || wanted.name,
        address: site.address || wanted.address,
        notes: site.notes || wanted.notes,
      };
      await store.update('customers', record.id, { sites });
      return {
        summary: `${label} already had ${siteLabel(sites[existing])} — nothing was added.`,
        customerId: record.id,
        customerName: label,
        site: sites[existing],
        index: existing,
        sites,
        created: false,
      };
    }
    sites.push(wanted);
    await store.update('customers', record.id, { sites });
    return {
      summary: `Added site ${siteLabel(wanted)} to ${label}.`,
      customerId: record.id,
      customerName: label,
      site: wanted,
      index: sites.length - 1,
      sites,
      created: true,
    };
  },
  artifacts: sitesArtifact,
});

defineAction({
  name: 'update_site',
  title: 'Update a customer\'s site',
  description: 'Change the name, address or notes of a site already saved for a customer. Only pass the fields that change.',
  permission: { module: 'Customers', key: 'edit' },
  inputSchema: objectSchema(
    {
      customer: str('Customer name or id.'),
      site: str('The site to change — its name or its address.'),
      name: str('New name for the site.'),
      address: str('New address for the site.'),
      notes: str('New notes for the site.'),
    },
    ['customer', 'site']
  ),
  summarize: (input, result) => result.summary,
  run: async ({ customer, site: reference, name, address, notes }) => {
    const record = requireCustomerRecord(customer);
    const label = customerLabel(record);
    const found = resolveSite(record, reference);
    if (found.kind === 'many') throw siteAmbiguous(reference, found.hits);
    if (found.kind === 'none') throw siteNotFound(record, reference);
    const patch = {};
    if (name) patch.name = String(name).trim();
    if (address) patch.address = String(address).trim();
    if (notes != null) patch.notes = String(notes).trim();
    if (!Object.keys(patch).length) throw invalidInput('Nothing to update — pass at least one new value.');
    const sites = customerSites(record).map((site) => ({ ...site }));
    sites[found.index] = { ...sites[found.index], ...patch };
    await store.update('customers', record.id, { sites });
    return {
      summary: `Updated ${siteLabel(sites[found.index])} for ${label} (${Object.keys(patch).join(', ')}).`,
      customerId: record.id,
      customerName: label,
      site: sites[found.index],
      index: found.index,
      fields: Object.keys(patch),
      sites,
    };
  },
  artifacts: sitesArtifact,
});

/** A customer's contacts, always as an array. */
export function customerContacts(customer) {
  return Array.isArray(customer?.contacts) ? customer.contacts : [];
}

/** "Jane Smith (Site foreman)", or whichever part of that exists. */
export function contactLabel(contact) {
  if (!contact) return '';
  const name = String(contact.name || '').trim();
  const role = String(contact.role || '').trim();
  if (name && role) return `${name} (${role})`;
  return name || role || String(contact.email || contact.phone || '').trim() || 'contact';
}

/**
 * Which of a customer's contacts a request means.
 *
 * Matching runs over name, role, email and phone, with an exact hit beating a
 * prefix and a prefix beating a substring. Two contacts that tie are a question
 * rather than a coin toss, because the wrong person on a quote is worse than
 * one more card.
 */
export function resolveContact(customer, query) {
  const text = normalizeText(query);
  if (!text) throw invalidInput('A contact name is required.');
  const hits = customerContacts(customer)
    .map((contact, index) => {
      const values = [contact.name, contact.role, contact.email, contact.phone].map(normalizeText).filter(Boolean);
      let score = 0;
      if (values.includes(text)) score = 1;
      else if (values.some((value) => value.startsWith(text))) score = 0.9;
      else if (values.some((value) => value.includes(text))) score = 0.8;
      else if (text.split(' ').every((token) => values.join(' ').includes(token))) score = 0.6;
      return { contact, index, score };
    })
    .filter((hit) => hit.score > 0)
    .sort((a, b) => b.score - a.score || a.index - b.index);

  if (!hits.length) {
    const known = customerContacts(customer).map((contact) => contactLabel(contact)).join(', ');
    throw invalidInput(
      `${customerLabel(customer) || 'That customer'} has no contact matching "${query}".${known ? ` Their contacts are: ${known}.` : ' They have no contacts saved yet — add one with add_contact first.'}`
    );
  }
  const [top] = hits;
  if (hits.length === 1 || top.score - hits[1].score >= 0.15 || (top.score === 1 && hits[1].score < 1)) {
    return { contact: top.contact, index: top.index, hits };
  }
  throw ambiguousMatch(
    'contact',
    query,
    hits.slice(0, 5).map((hit) => ({ id: contactLabel(hit.contact), label: contactLabel(hit.contact) }))
  );
}

defineAction({
  name: 'add_contact',
  title: 'Add a customer contact',
  description:
    'Save a person at a customer — the site foreman, the accounts clerk, the owner — with their role, email and phone. Use it when a job or quote needs a named contact who is not on the customer record yet.',
  permission: { module: 'Customers', key: 'manage_contacts' },
  inputSchema: objectSchema(
    {
      customer: str('Customer name or id.'),
      name: str('The person\'s name.'),
      role: str('Their role, e.g. "Site foreman" or "Accounts".'),
      email: str('Email address.'),
      phone: str('Phone number.'),
    },
    ['customer', 'name']
  ),
  summarize: (input, result) => result.summary,
  run: async ({ customer, name, role, email, phone }) => {
    const record = requireCustomerRecord(customer);
    const label = customerLabel(record);
    const contacts = customerContacts(record).map((contact) => ({ ...contact }));
    const wanted = {
      name: String(name).trim(),
      ...(role != null ? { role: String(role).trim() } : {}),
      ...(email != null ? { email: String(email).trim() } : {}),
      ...(phone != null ? { phone: String(phone).trim() } : {}),
    };
    const existing = contacts.find((contact) => normalizeText(contact.name) === normalizeText(wanted.name));
    if (existing) {
      return {
        summary: `${label} already has ${contactLabel(existing)} — use update_contact to change it.`,
        customerId: record.id,
        customerName: label,
        contact: existing,
        created: false,
        contacts,
      };
    }
    contacts.push(wanted);
    await store.update('customers', record.id, { contacts });
    return {
      summary: `Added ${contactLabel(wanted)} to ${label}.`,
      customerId: record.id,
      customerName: label,
      contact: wanted,
      created: true,
      contacts,
    };
  },
  artifacts: (result) => [{ label: `${result.customerName} — contacts`, path: `/people/${result.customerId}?tab=contacts` }],
});

defineAction({
  name: 'update_contact',
  title: 'Update a customer contact',
  description: 'Change a contact\'s name, role, email or phone. Only pass the fields that change.',
  permission: { module: 'Customers', key: 'manage_contacts' },
  inputSchema: objectSchema(
    {
      customer: str('Customer name or id.'),
      contact: str('The contact to change — their name, email or phone.'),
      name: str('New name.'),
      role: str('New role.'),
      email: str('New email address.'),
      phone: str('New phone number.'),
    },
    ['customer', 'contact']
  ),
  summarize: (input, result) => result.summary,
  run: async ({ customer, contact: reference, name, role, email, phone }) => {
    const record = requireCustomerRecord(customer);
    const label = customerLabel(record);
    const found = resolveContact(record, reference);
    const contacts = customerContacts(record).map((entry) => ({ ...entry }));
    const patch = {};
    if (name != null) patch.name = String(name).trim();
    if (role != null) patch.role = String(role).trim();
    if (email != null) patch.email = String(email).trim();
    if (phone != null) patch.phone = String(phone).trim();
    if (!Object.keys(patch).length) throw invalidInput('Nothing to update — pass at least one new value.');
    contacts[found.index] = { ...contacts[found.index], ...patch };
    await store.update('customers', record.id, { contacts });
    return {
      summary: `Updated ${contactLabel(contacts[found.index])} at ${label} (${Object.keys(patch).join(', ')}).`,
      customerId: record.id,
      customerName: label,
      contact: contacts[found.index],
      fields: Object.keys(patch),
      contacts,
    };
  },
  artifacts: (result) => [{ label: `${result.customerName} — contacts`, path: `/people/${result.customerId}?tab=contacts` }],
});

defineAction({
  name: 'delete_contact',
  title: 'Delete a customer contact',
  description: 'Permanently remove a contact from a customer. This cannot be undone.',
  permission: { module: 'Customers', key: 'manage_contacts' },
  risky: true,
  inputSchema: objectSchema(
    {
      customer: str('Customer name or id.'),
      contact: str('The contact to remove — their name, email or phone.'),
      reason: str('Why the contact is being removed.'),
    },
    ['customer', 'contact']
  ),
  summarize: (input, result) => result.summary,
  run: async ({ customer, contact: reference, reason }) => {
    const record = requireCustomerRecord(customer);
    const label = customerLabel(record);
    const found = resolveContact(record, reference);
    const contacts = customerContacts(record).map((entry) => ({ ...entry }));
    const [removed] = contacts.splice(found.index, 1);
    await store.update('customers', record.id, { contacts });
    await logActivity({
      type: 'customer_updated',
      text: `Contact ${contactLabel(removed)} removed from ${label}${reason ? ` — ${reason}` : ''}.`,
      recordType: 'customer',
      recordId: record.id,
    });
    return {
      summary: `Removed ${contactLabel(removed)} from ${label}.`,
      customerId: record.id,
      customerName: label,
      contact: removed,
      reason: reason || null,
      contacts,
    };
  },
  artifacts: (result) => [{ label: `${result.customerName} — contacts`, path: `/people/${result.customerId}?tab=contacts` }],
});

defineAction({
  name: 'delete_site',
  title: 'Delete a customer\'s site',
  description:
    'Permanently remove a site from a customer\'s site list. Jobs already booked at that address keep the address they have. This cannot be undone.',
  permission: { module: 'Customers', key: 'manage_contacts' },
  risky: true,
  inputSchema: objectSchema(
    {
      customer: str('Customer name or id.'),
      site: str('The site to remove — its name or its address.'),
      reason: str('Why the site is being removed.'),
    },
    ['customer', 'site']
  ),
  summarize: (input, result) => result.summary,
  run: async ({ customer, site: reference, reason }) => {
    const record = requireCustomerRecord(customer);
    const label = customerLabel(record);
    const found = resolveSite(record, reference);
    if (found.kind === 'many') throw siteAmbiguous(reference, found.hits);
    if (found.kind === 'none') throw siteNotFound(record, reference);
    const sites = customerSites(record).map((site) => ({ ...site }));
    const [removed] = sites.splice(found.index, 1);
    await store.update('customers', record.id, { sites });
    const jobs = (store.getAll('jobs') || []).filter((job) => job.customerId === record.id);
    const booked = siteJobCount(jobs, removed);
    await logActivity({
      type: 'customer_updated',
      text: `Site ${siteLabel(removed)} removed from ${label}${reason ? ` — ${reason}` : ''}.`,
      recordType: 'customer',
      recordId: record.id,
    });
    return {
      summary: `Removed site ${siteLabel(removed)} from ${label}${booked ? `; ${booked} job${booked === 1 ? '' : 's'} still carry that address` : ''}.`,
      customerId: record.id,
      customerName: label,
      site: removed,
      bookedJobs: booked,
      reason: reason || null,
      sites,
    };
  },
  artifacts: sitesArtifact,
});

defineAction({
  name: 'delete_customer',
  title: 'Delete a customer',
  description:
    'Permanently delete a customer and their contacts and sites. This cannot be undone, and it is the wrong tool when the history should stay. Jobs, quotes, invoices and projects that pointed at the customer are left on file without one — read the record first and tell the user what will be orphaned.',
  permission: { module: 'Customers', key: 'delete' },
  risky: true,
  inputSchema: objectSchema(
    {
      customer: str('Customer name or id.'),
      reason: str('Why the customer is being deleted.'),
    },
    ['customer']
  ),
  summarize: (input, result) => result.summary,
  run: async ({ customer, reason }) => {
    const record = requireCustomerRecord(customer);
    const label = customerLabel(record);
    const count = (collection) => (store.getAll(collection) || []).filter((row) => row.customerId === record.id).length;
    const linked = {
      jobs: count('jobs'),
      quotes: count('quotes'),
      invoices: count('invoices'),
      projects: count('projects'),
      assets: count('assets'),
      leads: count('leads'),
    };
    const snapshot = {
      id: record.id,
      name: label,
      email: record.email || null,
      phone: record.phone || null,
      contacts: customerContacts(record).length,
      sites: customerSites(record).length,
    };
    const total = Object.values(linked).reduce((sum, n) => sum + n, 0);

    await store.delete('customers', record.id);
    await logActivity({
      type: 'customer_deleted',
      text: `Customer ${label} deleted${reason ? ` — ${reason}` : ''}${total ? ` (${total} linked records left on file)` : ''}.`,
      recordType: 'customer',
      recordId: snapshot.id,
    });

    const left = Object.entries(linked).filter(([, n]) => n).map(([name, n]) => `${n} ${name}`).join(', ');
    return {
      summary: `Deleted customer ${label}${left ? `; ${left} left on file without a customer` : ''}.`,
      customer: snapshot,
      linked,
      reason: reason || null,
    };
  },
});
