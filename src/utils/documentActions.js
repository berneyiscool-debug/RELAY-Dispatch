// ============================================
// RELAY — DOCUMENT ACTIONS
// ============================================
// What you can do with any document in the Document Center:
//   View         — read the document itself in a new tab (a file, or an
//                  invoice / quote / completed form drawn as its printed page)
//   Open record  — jump to the job, invoice, customer… it belongs to
//   Download     — save it to the computer (rendered records become a PDF)
// Shared by the browser and the viewer tab so both behave the same way.

import { store } from '../data/store.js';

// Records that the print layout can draw as a document. A browser entry opts in
// with `render: { kind, id }`.
const RENDER_KINDS = new Set(['invoice', 'quote', 'form', 'form-template', 'tasklist-template']);

function isRoute(url) {
  return !!(url && url.startsWith('#/'));
}

function hasFile(doc) {
  return !!(doc && doc.url && doc.url !== '#' && !isRoute(doc.url));
}

function isRendered(doc) {
  return !!(doc && doc.render && RENDER_KINDS.has(doc.render.kind) && doc.render.id);
}

/** The in-app route of the record this entry belongs to, if any. */
export function recordPath(doc) {
  if (!doc) return null;
  if (isRoute(doc.url)) return doc.url;
  return doc.recordPath || null;
}

/** True when the document itself can be shown in a new tab. */
export function canView(doc) {
  return hasFile(doc) || isRendered(doc);
}

/** True when the entry links to a record that can be opened. */
export function canOpenRecord(doc) {
  return !!recordPath(doc);
}

/** True when a Download action makes sense for this entry. */
export function canDownload(doc) {
  return hasFile(doc) || isRendered(doc);
}

/**
 * Build the data the print layout needs for a rendered record, or null when
 * the record no longer exists.
 * @returns {{type: 'invoice'|'quote'|'form', data: object} | null}
 */
export function resolveRenderable(render) {
  if (!render || !RENDER_KINDS.has(render.kind)) return null;
  if (render.kind === 'invoice' || render.kind === 'quote') {
    const data = store.getById(render.kind === 'invoice' ? 'invoices' : 'quotes', render.id);
    return data ? { type: render.kind, data } : null;
  }
  // Templates print as blank sheets to fill in by hand.
  if (render.kind === 'form-template') {
    const template = store.getById('formTemplates', render.id);
    return template ? { type: 'form', data: { template, blank: true, responses: {}, number: template.name } } : null;
  }
  if (render.kind === 'tasklist-template') {
    const template = store.getById('taskTemplates', render.id);
    return template ? { type: 'tasklist', data: template } : null;
  }
  // Completed compliance forms / checksheets, in the same shape the job page
  // hands to the print preview.
  const fi = store.getById('formInstances', render.id);
  if (!fi) return null;
  const template = store.getById('formTemplates', fi.templateId);
  if (!template) return null;
  const job = fi.jobId ? store.getById('jobs', fi.jobId) : null;
  const customer = job && job.customerId ? store.getById('people', job.customerId) : null;
  const submitter = fi.submittedBy ? store.getById('people', fi.submittedBy) : null;
  return {
    type: 'form',
    data: {
      ...fi,
      template,
      jobNumber: job ? job.number : '',
      customerName: (customer && customer.companyName) || 'Unknown Customer',
      submittedByName: submitter ? `${submitter.firstName} ${submitter.lastName}` : 'Unknown Technician',
      number: `F-${job ? job.number : 'FORM'}-${String(fi.id).slice(3, 7).toUpperCase()}`,
    },
  };
}

/**
 * Show the document itself in a new tab, through the read-only viewer route.
 */
export function viewDocumentInNewTab(doc) {
  if (!canView(doc)) return false;
  // The viewer tab reads the document from localStorage, so it must be written
  // before the tab is opened.
  localStorage.setItem('currentDocumentView', JSON.stringify(
    isRendered(doc)
      ? { name: doc.name, render: doc.render }
      : { name: doc.name, url: doc.url, type: doc.type },
  ));
  window.open('#/document/view', '_blank', 'noopener');
  return true;
}

/** Open the record the entry belongs to in a new tab. */
export function openRecordInNewTab(doc) {
  const path = recordPath(doc);
  if (!path) return false;
  window.open(path, '_blank', 'noopener');
  return true;
}

function saveBlob(blob, filename) {
  const href = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = href;
  a.download = filename || 'document';
  a.rel = 'noopener';
  document.body.appendChild(a);
  a.click();
  a.remove();
  // Give the browser a moment to start the download before freeing the blob.
  setTimeout(() => URL.revokeObjectURL(href), 10000);
}

function base64ToBlob(base64, type) {
  const bin = atob(base64);
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  return new Blob([bytes], { type });
}

function pdfName(name) {
  const base = String(name || 'document').replace(/\.pdf$/i, '');
  return `${base.replace(/[\\/:*?"<>|]+/g, '_')}.pdf`;
}

/**
 * Save the document to the computer. Invoices, quotes and forms are rendered
 * to a PDF on the spot; files are saved as they are.
 * @returns {Promise<void>} rejects with a user-readable message on failure
 */
export async function downloadDocument(doc) {
  if (!canDownload(doc)) throw new Error('This item has no file to download.');

  if (isRendered(doc)) {
    const source = resolveRenderable(doc.render);
    if (!source) throw new Error('The linked record could not be found.');
    const { renderDocumentPdf } = await import('./documentPdf.js');
    const pdf = await renderDocumentPdf(source.type, source.data, { filename: pdfName(doc.name) });
    saveBlob(base64ToBlob(pdf.base64, 'application/pdf'), pdf.filename);
    return;
  }

  const url = await store.getDocumentUrl(doc);
  if (!url) throw new Error('The file location is missing.');

  // Uploaded files are usually inline data URLs; decode them directly (the
  // CSP's connect-src does not allow fetching data: URLs).
  const inline = /^data:([^;,]*)(;base64)?,(.*)$/s.exec(url);
  if (inline) {
    const [, mime, isB64, payload] = inline;
    const blob = isB64
      ? base64ToBlob(payload, mime || doc.type || 'application/octet-stream')
      : new Blob([decodeURIComponent(payload)], { type: mime || 'text/plain' });
    saveBlob(blob, doc.name);
    return;
  }

  let blob;
  try {
    const res = await fetch(url);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    blob = await res.blob();
  } catch {
    // The host refused a script fetch (no CORS). Hand the URL to the browser
    // directly: it still downloads same-origin files and opens the rest.
    const a = document.createElement('a');
    a.href = url;
    a.download = doc.name || 'document';
    a.target = '_blank';
    a.rel = 'noopener';
    document.body.appendChild(a);
    a.click();
    a.remove();
    return;
  }
  saveBlob(blob, doc.name);
}
