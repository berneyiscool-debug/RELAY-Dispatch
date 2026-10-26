// ============================================
// RELAY — CROSS-RECORD LINKS
// ============================================
// Anywhere one record names another — a job's customer, an invoice's job, a PO's
// supplier — that name should be the way to reach it. This is the one place that
// knows which records have a page and what that page's route is, so a call site
// never has to guess and can never emit a link to nowhere.
//
// Call sites always use `entityLink()`. It returns an anchor when there is
// something to open and the escaped text when there is not, so markup does not
// branch at every mention. `resolveEntityId()` is what makes the name-only case
// work: plenty of records store `customerName` with no id alongside it.
//
// Navigation itself is the browser's: these are real anchors on a hash router, so
// a plain click opens in this tab and ctrl/cmd/shift-click or a middle click opens
// another, with no JavaScript involved. (The packaged desktop app is a single
// Electron window, so modifiers land in the same window there.)

import { store } from '../data/store.js';
import { escapeHTML } from '../utils/security.js';

// kind → the page that record lives on. A kind missing here is a programming
// mistake, not a data condition: callers get plain text rather than a bad href.
const ROUTES = {
  customer: (id) => `/people/${encodeURIComponent(id)}`,
  job: (id) => `/jobs/${encodeURIComponent(id)}`,
  quote: (id) => `/quotes/${encodeURIComponent(id)}`,
  invoice: (id) => `/invoices/${encodeURIComponent(id)}`,
  purchaseOrder: (id) => `/purchase-orders/${encodeURIComponent(id)}`,
  project: (id) => `/projects/${encodeURIComponent(id)}`,
  asset: (id) => `/assets/${encodeURIComponent(id)}`,
  stock: (id) => `/stock/${encodeURIComponent(id)}`,
  kit: (id) => `/kits/${encodeURIComponent(id)}`,
  supplier: (id) => `/suppliers/${encodeURIComponent(id)}`,
  contractor: (id) => `/contractors/${encodeURIComponent(id)}`,
  lead: (id) => `/leads/${encodeURIComponent(id)}`,
  // Sites are nested inside a customer rather than records of their own, so the id
  // here is the owning customer's and the link lands on that customer's Sites tab.
  site: (id) => `/people/${encodeURIComponent(id)}?tab=sites`,
  // Technicians are shop users, not records with a page of their own; the Users
  // tab is the closest thing to "who is this".
  technician: () => '/settings?tab=users',
};

// kind → store collection, used to prove an id still exists and for the name→id
// fallback.
const COLLECTION = {
  customer: 'customers',
  job: 'jobs',
  quote: 'quotes',
  invoice: 'invoices',
  purchaseOrder: 'purchaseOrders',
  project: 'projects',
  asset: 'assets',
  stock: 'stock',
  kit: 'kits',
  supplier: 'suppliers',
  contractor: 'contractors',
  lead: 'leads',
  technician: 'technicians',
  // A site is addressed through its customer, so that is what has to exist.
  site: 'customers',
};

function norm(value) {
  return String(value == null ? '' : value).trim().replace(/\s+/g, ' ').toLowerCase();
}

// The strings a record can legitimately be referred to by. Used to match a saved
// `customerName` / `jobNumber` back to the record it came from.
function nameKeys(kind, rec) {
  if (!rec) return [];
  if (kind === 'customer') {
    return [rec.company, `${rec.firstName || ''} ${rec.lastName || ''}`].filter(Boolean).map(norm);
  }
  if (kind === 'job') {
    return [rec.number, rec.title].filter(Boolean).map(norm);
  }
  if (kind === 'stock' || kind === 'kit' || kind === 'asset') {
    return [rec.name, rec.sku, rec.serial, rec.identifier].filter(Boolean).map(norm);
  }
  if (kind === 'contractor') {
    return [rec.companyName, rec.name, rec.businessName].filter(Boolean).map(norm);
  }
  if (kind === 'supplier') return [rec.name, rec.companyName].filter(Boolean).map(norm);
  if (kind === 'technician') {
    return [rec.name, `${rec.firstName || ''} ${rec.lastName || ''}`].filter(Boolean).map(norm);
  }
  // quote / invoice / purchaseOrder / project / lead: the number is what gets
  // written into other records, with the title as a second chance.
  return [rec.number, rec.title, rec.name].filter(Boolean).map(norm);
}

function safeGet(collection, id) {
  try {
    return store.getById(collection, id) || null;
  } catch (_) {
    return null;
  }
}

/**
 * The id to link to, or null when there is nothing unambiguous to open.
 *
 * An explicit id always wins — but only while the record still exists. A job
 * keeps the customerId of a customer that has since been deleted, and a link
 * into that page would land on "not found"; those fall back to plain text.
 * Otherwise a name is matched against the collection and only a single exact
 * hit counts, so two customers with the same company name cannot send a click
 * to an arbitrary one.
 *
 * @param {string} kind
 * @param {{ id?: string|null, name?: string|null }} ref
 * @returns {string|null}
 */
export function resolveEntityId(kind, { id, name } = {}) {
  const collection = COLLECTION[kind];

  if (id) {
    if (!collection || safeGet(collection, id)) return String(id);
    return null;
  }

  const wanted = norm(name);
  if (!collection || !wanted) return null;

  let records;
  try {
    records = store.getAll(collection) || [];
  } catch (_) {
    return null;
  }
  const hits = records.filter((rec) => nameKeys(kind, rec).includes(wanted));
  return hits.length === 1 ? hits[0].id : null;
}

/**
 * Route for a record's page, or null when the kind is unknown.
 * @param {string} kind
 * @param {string} id
 * @returns {string|null} hash route, e.g. `/jobs/abc`
 */
export function entityHref(kind, id) {
  const route = ROUTES[kind];
  if (!route || !id) return null;
  return route(String(id));
}

/**
 * A link to a record, or its text when it cannot be linked.
 *
 * @param {object} opts
 * @param {string} opts.kind        entity kind (see ROUTES)
 * @param {string} [opts.id]        explicit record id, when the caller has one
 * @param {string} [opts.name]      display text, and the fallback match key
 * @param {string} [opts.label]     different display text from `name`
 * @param {boolean} [opts.stopPropagation] set when the link sits inside a
 *   clickable row, so the row's own handler does not also fire
 * @param {string} [opts.className] extra classes on the anchor
 * @returns {string} HTML
 */
export function entityLink({ kind, id, name, label, stopPropagation = false, className = '' } = {}) {
  const text = label != null ? label : (name != null ? name : '');
  const safeText = escapeHTML(text === '' ? '—' : text);
  const targetId = resolveEntityId(kind, { id, name });
  const href = entityHref(kind, targetId);
  if (!href) return safeText;

  const classes = ['entity-link', className].filter(Boolean).join(' ');
  const stop = stopPropagation ? ' data-stop-propagation' : '';
  const title = escapeHTML(text === '' ? '' : text);
  return `<a href="#${href}" class="${classes}"${stop}${title ? ` title="${title}"` : ''}>${safeText}</a>`;
}
