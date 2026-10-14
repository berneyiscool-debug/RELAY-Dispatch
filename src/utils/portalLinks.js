// ============================================
// RELAY — PORTAL MAGIC LINKS
// ============================================
// One place that builds the token'd portal URLs we hand to customers and
// contractors, and that self-heals a missing token the same way the detail
// pages do. Emails, the "copy link" buttons and anything else that points
// someone at their portal should come through here so the link format only
// ever lives in one file.
//
// Customers land on the portal where they can review, accept or decline quotes
// and see their invoices — which is why quote and invoice emails point at it.

import { store } from '../data/store.js';
import { webAppBaseUrl } from './webOrigin.js';

// The app is served from a hash router, sometimes under a sub-path
// (relaydispatch.com.au/app on GitHub Pages) and sometimes from file://
// (Electron), so build from the live location rather than assuming an origin —
// webAppBaseUrl() owns that decision (see utils/webOrigin.js).

// Portal tokens are the only thing standing between a URL and someone else's
// quotes, invoices and job history, so they have to come from the CSPRNG.
// Math.random() is seeded per realm, its output is predictable from a couple of
// samples, and the old shape leaked the mint time as well — a few thousand
// guesses could walk the space. 128 random bits keeps the token short enough to
// paste into an email while making enumeration hopeless.
//
// getRandomValues (rather than randomUUID) because the app also runs from
// file:// in Electron, where randomUUID's secure-context requirement is not met.
export function generatePortalToken() {
  const webCrypto = globalThis.crypto;
  if (webCrypto?.getRandomValues) {
    const bytes = webCrypto.getRandomValues(new Uint8Array(16));
    return 'c_pt_' + Array.from(bytes, b => b.toString(16).padStart(2, '0')).join('');
  }
  // No supported runtime reaches this, but a link that cannot be minted is
  // worse than a weak one, so keep the legacy shape as a labelled last resort.
  console.error('Portal token generated without a CSPRNG.');
  return 'c_pt_' + Math.random().toString(36).substr(2, 9) + Date.now().toString(36).substr(-4);
}

// Writes the token and reports whether the database actually took it.
//
// This used to be an un-awaited store.update() inside a try/catch, which could not
// work: store.update resolves with { ok: false } instead of throwing, and the record
// is handed the token either way. The link therefore went out for a token that was
// never stored — and because the next visit mints a *different* token for the same
// record, issuing a link that was not saved silently invalidated every link issued
// before it. Awaited here so a link is only ever built on a token that is on file.
async function persistToken(collection, record, token) {
  const result = await store.update(collection, record.id, { portalToken: token });
  // null: the record is not in the loaded cache, or the install is read-only (both
  // return null rather than writing). { ok: false }: the cloud write was refused.
  if (!result || result.ok === false) {
    console.warn('Could not save a portal token, so no link was issued.', result);
    return null;
  }
  record.portalToken = token;
  return token;
}

// Returns the record's portal token, minting and persisting one if it predates portal
// access. Mutates the passed record so the caller can keep using it. Async because the
// write has to be confirmed before a link may be built from the token.
export async function ensureCustomerToken(customer) {
  if (!customer || !customer.id) return null;
  if (customer.portalToken) return customer.portalToken;
  return persistToken('customers', customer, generatePortalToken());
}

export async function ensureContractorToken(contractor) {
  if (!contractor || !contractor.id) return null;
  if (contractor.portalToken) return contractor.portalToken;
  return persistToken('contractors', contractor, generatePortalToken());
}

function customerUrlForToken(token) {
  return `${webAppBaseUrl()}#/portal/customer?token=${encodeURIComponent(token)}`;
}

function contractorUrlForToken(token) {
  return `${webAppBaseUrl()}#/contractor-portal/${encodeURIComponent(token)}`;
}

// Magic link to the customer portal — quotes to review and accept, invoices, job
// history. Returns null when no token could be established and stored.
export async function customerPortalUrl(customer) {
  const token = await ensureCustomerToken(customer);
  return token ? customerUrlForToken(token) : null;
}

// Magic link to the contractor portal — assigned jobs, documents, timesheets.
export async function contractorPortalUrl(contractor) {
  const token = await ensureContractorToken(contractor);
  return token ? contractorUrlForToken(token) : null;
}

// The link for a token that already exists, or null. Writes nothing, so this is safe
// to call while rendering a page that merely wants to display the link — minting stays
// an explicit action.
export function savedCustomerPortalUrl(customer) {
  return customer && customer.portalToken ? customerUrlForToken(customer.portalToken) : null;
}

export function savedContractorPortalUrl(contractor) {
  return contractor && contractor.portalToken ? contractorUrlForToken(contractor.portalToken) : null;
}

// Resolve the customer record behind a quote/invoice so its email can carry a
// portal link. Documents store the id under a couple of different keys
// depending on how old the record is.
export function customerForDocument(doc) {
  if (!doc) return null;
  const id = doc.customerId || doc.customer_id || doc.customerID;
  if (id) {
    const found = store.getById('customers', id);
    if (found) return found;
  }
  // Fall back to matching on name — older records only carried the label.
  const name = doc.customerName || doc.customer;
  if (!name) return null;
  return store.getAll('customers').find(c => c.name === name) || null;
}

// The portal link for whoever a quote/invoice belongs to, or null. Awaited by the
// email paths so a message never carries a link that was not stored: a link that does
// not resolve is worse than no link, and callers render the same email either way.
export async function portalUrlForDocument(doc) {
  const customer = customerForDocument(doc);
  return customer ? await customerPortalUrl(customer) : null;
}
