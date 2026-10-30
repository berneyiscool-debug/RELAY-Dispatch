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
import { objectSchema, str, enumOf, list } from './schema.js';
import { invalidInput } from './errors.js';
import { assertPermission, logActivity } from './context.js';
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
