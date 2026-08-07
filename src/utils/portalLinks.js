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

// The app is served from a hash router, sometimes under a sub-path (GitHub
// Pages) and sometimes from file:// (Electron), so build from the live location
// rather than assuming an origin.
export function appBaseUrl() {
  if (typeof window === 'undefined') return '';
  return `${window.location.origin}${window.location.pathname}`;
}

function newToken() {
  return 'c_pt_' + Math.random().toString(36).substr(2, 9) + Date.now().toString(36).substr(-4);
}

// Returns the customer's portal token, minting and persisting one if this
// record predates portal access. Mutates the passed record so the caller can
// keep using it.
export function ensureCustomerToken(customer) {
  if (!customer || !customer.id) return null;
  if (customer.portalToken) return customer.portalToken;
  const token = newToken();
  try {
    store.update('customers', customer.id, { portalToken: token });
    customer.portalToken = token;
  } catch (err) {
    console.warn('Could not save a portal token for this customer:', err);
    return null;
  }
  return token;
}

export function ensureContractorToken(contractor) {
  if (!contractor || !contractor.id) return null;
  if (contractor.portalToken) return contractor.portalToken;
  const token = newToken();
  try {
    store.update('contractors', contractor.id, { portalToken: token });
    contractor.portalToken = token;
  } catch (err) {
    console.warn('Could not save a portal token for this contractor:', err);
    return null;
  }
  return token;
}

// Magic link to the customer portal — quotes to review and accept, invoices,
// job history. Returns null when no token could be established.
export function customerPortalUrl(customer) {
  const token = ensureCustomerToken(customer);
  if (!token) return null;
  return `${appBaseUrl()}#/portal/customer?token=${encodeURIComponent(token)}`;
}

// Magic link to the contractor portal — assigned jobs, documents, timesheets.
export function contractorPortalUrl(contractor) {
  const token = ensureContractorToken(contractor);
  if (!token) return null;
  return `${appBaseUrl()}#/contractor-portal/${encodeURIComponent(token)}`;
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

// The portal link for whoever a quote/invoice belongs to, or null.
export function portalUrlForDocument(doc) {
  const customer = customerForDocument(doc);
  return customer ? customerPortalUrl(customer) : null;
}
