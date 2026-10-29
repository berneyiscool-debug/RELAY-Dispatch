// ============================================
// RELAY — PURCHASE ORDER PDFS
// ============================================
// Save one or many POs as PDFs, one file per PO, as last saved. They land in
// the PDF folder's "Purchase Orders" subfolder when one is set up.

import { store } from '../data/store.js';
import { showToast } from '../components/Notifications.js';
import { downloadDocument } from './documentActions.js';
import { preparePdfFolder, getPdfFolder, PDF_SUBFOLDERS } from './pdfFolder.js';

function plural(n, word) {
  return `${n} ${word}${n === 1 ? '' : 's'}`;
}

/**
 * Save each PO as its own PDF. Call straight from a click: it asks for folder
 * access first.
 * @returns {Promise<number>} how many PDFs were saved
 */
export async function savePurchaseOrderPdfs(ids) {
  const pos = ids.map(id => store.getById('purchaseOrders', id)).filter(Boolean);
  if (!pos.length) return 0;
  const toFolder = await preparePdfFolder();
  const bulk = pos.length > 1;
  if (bulk) showToast(`Preparing ${plural(pos.length, 'PDF')}…`, 'info');
  let saved = 0;
  for (const po of pos) {
    try {
      await downloadDocument({ name: `PO ${po.number}.pdf`, render: { kind: 'po', id: po.id } }, { quiet: bulk });
      saved++;
    } catch (err) {
      showToast(`${po.number}: ${err.message || 'could not create the PDF'}`, 'error');
    }
  }
  if (bulk && saved) {
    const folder = toFolder ? await getPdfFolder() : null;
    showToast(folder ? `Saved ${plural(saved, 'PDF')} to ${folder.name}/${PDF_SUBFOLDERS.po}` : `Downloaded ${plural(saved, 'PDF')}`, 'success');
  }
  return saved;
}
