/**
 * Documents — saving quotes, invoices and purchase orders as PDFs.
 *
 * The PDF is the same one the app makes everywhere else: rendered by
 * `utils/documentPdf.js` from the Document Studio layout, named the way the
 * Documents page names it, and saved by `utils/pdfFolder.js` into the folder
 * picked in Settings › Local Storage, in its subfolder for the kind. With no
 * folder, or no permission to write to it right now, the browser downloads it.
 *
 * Rendering needs the app open in a browser, so this cannot run anywhere else.
 */

import { defineAction } from './registry.js';
import { objectSchema, str, enumOf, list, bool } from './schema.js';
import { invalidInput } from './errors.js';
import { assertPermission, logActivity } from './context.js';
import { store } from '../data/store.js';
import { resolveOne } from './resolve.js';
import { resolveQuote } from './quotes.js';
import { resolveInvoice } from './invoices.js';
import { resolvePurchaseOrder } from './purchasing.js';

const KINDS = {
  quote: { module: 'Quotes', render: 'quote', label: 'Quote', resolve: resolveQuote, name: (r) => `Quote ${r.number}.pdf` },
  invoice: { module: 'Invoices', render: 'invoice', label: 'Invoice', resolve: resolveInvoice, name: (r) => `Invoice ${r.number}.pdf` },
  purchase_order: { module: 'Purchase Orders', render: 'po', label: 'PO', resolve: resolvePurchaseOrder, name: (r) => `PO ${r.number}.pdf` },
};

const MAX_PER_CALL = 25;

defineAction({
  name: 'save_pdf',
  title: 'Save PDF',
  description:
    'Save quotes, invoices or purchase orders as PDFs — the same document the app prints — into the PDF folder picked in Settings, sorted into Quotes, Invoices and Purchase Orders. A file of the same name is replaced, so the folder always holds the latest copy. With no folder set up, or no access to it right now, each PDF downloads instead, and the reply says which happened. Needs the app open in a browser.',
  inputSchema: objectSchema(
    {
      kind: enumOf(Object.keys(KINDS), 'What to save.'),
      records: list(str('A number, e.g. "INV-1042", or the customer and job it covers.'), `Which ones, up to ${MAX_PER_CALL}.`),
    },
    ['kind', 'records']
  ),
  summarize: (input, result) => result.summary,
  async run(input, ctx) {
    const kind = KINDS[input.kind];
    assertPermission({ module: kind.module, key: 'view' }, ctx);
    const refs = [...new Set((input.records || []).map((r) => String(r).trim()).filter(Boolean))];
    if (!refs.length) throw invalidInput('Which ones? Pass at least one number.');
    if (refs.length > MAX_PER_CALL) throw invalidInput(`Save at most ${MAX_PER_CALL} at a time.`);
    if (typeof document === 'undefined') throw invalidInput('Saving a PDF needs the app open in a browser.');

    // Loaded lazily: the renderer and the folder code are browser-only.
    const [{ documentFile }, { preparePdfFolder, savePdf, getPdfFolder, PDF_SUBFOLDERS }] = await Promise.all([
      import('../utils/documentActions.js'),
      import('../utils/pdfFolder.js'),
    ]);
    // Without a click to ask from, this only succeeds when access is still granted
    // from earlier in the session; otherwise each PDF falls back to a download.
    const toFolder = await preparePdfFolder();

    const saved = [];
    const failed = [];
    for (const ref of refs) {
      let record;
      try {
        record = kind.resolve(ref);
        const file = await documentFile({ name: kind.name(record), render: { kind: kind.render, id: record.id } });
        const where = await savePdf(file, file.name, kind.render, { quiet: true });
        saved.push({ number: record.number, file: file.name, savedTo: where || 'downloaded' });
      } catch (error) {
        failed.push({ record: record?.number || ref, reason: error.message || String(error) });
      }
    }

    const folder = toFolder ? await getPdfFolder() : null;
    const place = folder ? `${folder.name}/${PDF_SUBFOLDERS[kind.render]}` : null;
    const inFolder = saved.filter((s) => s.savedTo !== 'downloaded').length;
    if (saved.length) {
      logActivity({ type: 'pdf_saved', text: `Saved ${saved.length} ${kind.label} PDF(s)${place && inFolder ? ` to ${place}` : ''}.` });
    }
    const parts = [];
    if (inFolder) parts.push(`Saved ${inFolder} ${kind.label} PDF(s) to ${place}`);
    if (saved.length - inFolder) parts.push(`downloaded ${saved.length - inFolder} (no PDF folder access right now — pick or re-allow it in Settings › Local Storage)`);
    if (failed.length) parts.push(`${failed.length} failed: ${failed[0].reason}`);
    if (!saved.length && failed.length) throw invalidInput(`No PDFs saved — ${failed[0].record}: ${failed[0].reason}`);

    return { summary: `${parts.join('; ')}.`, saved, failed, folder: place };
  },
});

export function resolveDocument(query) {
  return resolveOne('documents', query, {
    label: (doc) => doc.name || doc.id,
    searchFields: ['name', 'folder', 'type'],
    what: 'document',
  }).record;
}

defineAction({
  name: 'add_document',
  title: 'Add a document record',
  description:
    'File a document in the Documents page — a link, a file the user has already saved, or a note such as a certificate number. Pass `url` for a link or data URL; leave it out for a note-only record. Use save_pdf to generate a quote, invoice or PO PDF.',
  permission: { module: 'Documents', key: 'upload' },
  inputSchema: objectSchema(
    {
      name: str('File name, e.g. "Certificate of Electrical Safety.pdf".'),
      folder: str('Folder to file it under. Defaults to the root of Documents.'),
      url: str('Link or data URL to the file.'),
      type: str('MIME type, e.g. application/pdf. Defaults to link.'),
      notes: str('What the document is.'),
    },
    ['name']
  ),
  summarize: (input, result) => result.summary,
  run: async ({ name, folder, url, type, notes }) => {
    const record = {
      name: name.trim(),
      folder: folder == null ? '' : String(folder).trim(),
      ...(url ? { url, type: type || 'link', size: 0 } : { type: type || 'note', size: 0 }),
      ...(notes ? { notes: String(notes).trim() } : {}),
      uploadedAt: new Date().toISOString(),
      uploadedBy: 'brny',
    };
    const document = store.create('documents', record);
    logActivity({ type: 'document_added', text: `Document ${document.name} added${document.folder ? ` to ${document.folder}` : ''}.`, recordType: 'document', recordId: document.id });
    return { summary: `Added document ${document.name}${document.folder ? ` to ${document.folder}` : ''}.`, document };
  },
  artifacts: (result) => [{ label: result.document.name, path: '/documents' }],
});

defineAction({
  name: 'move_document',
  title: 'Move a document',
  description: 'Change the folder a document is filed in. Pass `toRoot` to put it back at the top level of Documents.',
  permission: { module: 'Documents', key: 'upload' },
  inputSchema: objectSchema(
    {
      document: str('Document name or id.'),
      folder: str('Folder to move it to.'),
      toRoot: bool('Move it to the root of Documents instead of a folder.'),
    },
    ['document']
  ),
  summarize: (input, result) => result.summary,
  run: async ({ document: reference, folder, toRoot }) => {
    const document = resolveDocument(reference);
    if (!toRoot && folder == null) throw invalidInput('Which folder? Pass folder, or toRoot to put it at the root.');
    const to = toRoot ? '' : String(folder).trim();
    await store.update('documents', document.id, { folder: to });
    logActivity({ type: 'document_moved', text: `Document ${document.name} moved to ${to || 'the root folder'}.`, recordType: 'document', recordId: document.id });
    return { summary: `Moved ${document.name} to ${to || 'the root folder'}.`, document: { ...document, folder: to } };
  },
});

defineAction({
  name: 'rename_document',
  title: 'Rename a document',
  description: 'Change the name a document is filed under in the Documents page.',
  permission: { module: 'Documents', key: 'upload' },
  inputSchema: objectSchema(
    {
      document: str('Current document name or id.'),
      name: str('New name, including the file extension.'),
    },
    ['document', 'name']
  ),
  summarize: (input, result) => result.summary,
  run: async ({ document: reference, name }) => {
    const document = resolveDocument(reference);
    const clean = String(name || '').trim();
    if (!clean) throw invalidInput('A document name is required.');
    await store.update('documents', document.id, { name: clean });
    logActivity({ type: 'document_renamed', text: `Document ${document.name} renamed to ${clean}.`, recordType: 'document', recordId: document.id });
    return { summary: `Renamed ${document.name} to ${clean}.`, document: { ...document, name: clean } };
  },
});

defineAction({
  name: 'duplicate_document',
  title: 'Duplicate a document',
  description: 'Make a copy of a document record, filed in the same folder with " (Copy)" in the name.',
  permission: { module: 'Documents', key: 'upload' },
  inputSchema: objectSchema(
    {
      document: str('Document name or id.'),
      name: str('Name for the copy.'),
    },
    ['document']
  ),
  summarize: (input, result) => result.summary,
  run: async ({ document: reference, name }) => {
    const document = resolveDocument(reference);
    const dot = document.name.lastIndexOf('.');
    const copyName = name
      ? String(name).trim()
      : dot > 0 ? `${document.name.slice(0, dot)} (Copy)${document.name.slice(dot)}` : `${document.name} (Copy)`;
    const copy = store.create('documents', {
      ...document,
      id: undefined,
      name: copyName,
      uploadedAt: new Date().toISOString(),
      uploadedBy: 'brny',
    });
    logActivity({ type: 'document_added', text: `Document ${document.name} duplicated as ${copyName}.`, recordType: 'document', recordId: copy.id });
    return { summary: `Duplicated ${document.name} as ${copyName}.`, document: copy };
  },
});

defineAction({
  name: 'delete_document',
  title: 'Delete a document',
  description: 'Permanently delete a document record from the Documents page. This cannot be undone.',
  permission: { module: 'Documents', key: 'upload' },
  risky: true,
  inputSchema: objectSchema(
    {
      document: str('Document name or id.'),
      reason: str('Why the document is being deleted.'),
    },
    ['document']
  ),
  summarize: (input, result) => result.summary,
  run: async ({ document: reference, reason }) => {
    const document = resolveDocument(reference);
    const snapshot = { id: document.id, name: document.name, folder: document.folder || '' };
    await store.delete('documents', document.id);
    logActivity({
      type: 'document_deleted',
      text: `Document ${snapshot.name} deleted${reason ? ` — ${reason}` : ''}.`,
      recordType: 'document',
      recordId: snapshot.id,
    });
    return { summary: `Deleted document ${snapshot.name}.`, document: snapshot, reason: reason || null };
  },
});
