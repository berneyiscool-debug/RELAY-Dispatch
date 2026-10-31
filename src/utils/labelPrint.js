// ============================================
// RELAY — LABEL CODES AND PRINTING
// ============================================
// Browser half of the sticker sheets in stockLabels.js and assetLabels.js:
// renders the barcode and QR code for each value, and prints the finished
// sheet from a popup.

import JsBarcode from 'jsbarcode';
import QRCode from 'qrcode';
import { fitLabelNames } from './stockLabels.js';

/**
 * SVG markup per value for the codes the sheet shows. QR rendering is async,
 * so it's done up front and handed to the (synchronous) sheet builder.
 *
 * @param {string[]} values the strings the codes encode (SKU, asset code)
 * @param {string[]} fields the chosen sticker fields; 'barcode' and 'qr' render codes
 * @returns {Promise<{barcode: (value: string) => string, qr: (value: string) => string}>}
 */
export async function renderLabelCodes(values, fields) {
  const unique = [...new Set(values.map(v => String(v || '').trim()).filter(Boolean))];
  const barcodes = new Map();
  const qrs = new Map();
  if (fields.includes('barcode')) {
    for (const value of unique) {
      const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
      try {
        JsBarcode(svg, value, { format: 'CODE128', displayValue: false, margin: 0, height: 60, width: 2 });
      } catch { continue; /* value has characters CODE128 can't carry */ }
      // Scale to the label rather than keep JsBarcode's fixed pixel size.
      svg.setAttribute('viewBox', `0 0 ${parseFloat(svg.getAttribute('width'))} ${parseFloat(svg.getAttribute('height'))}`);
      svg.setAttribute('preserveAspectRatio', 'none');
      svg.removeAttribute('width');
      svg.removeAttribute('height');
      svg.removeAttribute('style');
      barcodes.set(value, svg.outerHTML);
    }
  }
  if (fields.includes('qr')) {
    await Promise.all(unique.map(async value => {
      qrs.set(value, await QRCode.toString(value, { type: 'svg', margin: 0, errorCorrectionLevel: 'M' }));
    }));
  }
  return { barcode: value => barcodes.get(value) || '', qr: value => qrs.get(value) || '' };
}

/**
 * Open the print popup. Call straight from the click handler, before any
 * await, so the browser still counts it as user-initiated.
 *
 * @returns {Window|null} null when pop-ups are blocked
 */
export function openLabelWindow() {
  return window.open('', '_blank');
}

/** Write the sheet into the popup and open the print dialog. */
export function printLabelSheet(printWindow, html) {
  // The Content-Security-Policy no longer allows inline scripts, so the
  // print dialog is triggered from here rather than from a <script> tag
  // inside the document written below. The sheet has no external
  // resources, so printing straight after close() is deterministic —
  // waiting on the popup's `load` is not, because an about:blank popup
  // fires its own load event before the written document renders.
  printWindow.document.write(html);
  printWindow.document.close();
  fitLabelNames(printWindow.document);
  printWindow.focus();
  printWindow.print();
}
