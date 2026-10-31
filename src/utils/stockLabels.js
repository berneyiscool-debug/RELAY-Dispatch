// ============================================
// RELAY — STOCK LABEL PRINT SHEET
// ============================================
// Builds the printable sheet of stock stickers. Every sticker is a fixed
// physical size (mm) so long item names can't squeeze their neighbours, and
// the person printing chooses which details appear on it. The barcode and QR
// code both encode the item's SKU, so any scanner reads back the same value.
// The sticker and sheet layout (labelHtml, labelSheetHtml) is shared with the
// asset labels in assetLabels.js.

import { escapeHTML } from './security.js';

export const LABEL_FIELDS = [
  { key: 'name', label: 'Item name' },
  { key: 'sku', label: 'SKU' },
  { key: 'barcode', label: 'Barcode' },
  { key: 'qr', label: 'QR code' },
  { key: 'price', label: 'Sell price' },
  { key: 'cost', label: 'Cost price' },
  { key: 'category', label: 'Category' },
  { key: 'supplier', label: 'Supplier' },
];

export const LABEL_SIZES = [
  { key: 'small', label: 'Small · 38 × 21 mm', width: 38, height: 21, font: 1.9, pad: 1.2 },
  { key: 'medium', label: 'Medium · 50 × 30 mm', width: 50, height: 30, font: 2.4, pad: 1.8 },
  { key: 'large', label: 'Large · 64 × 38 mm', width: 63.5, height: 38.1, font: 2.9, pad: 2.2 },
  { key: 'xlarge', label: 'Extra large · 100 × 50 mm', width: 100, height: 50, font: 3.6, pad: 3 },
];

export const DEFAULT_LABEL_OPTIONS = {
  fields: ['name', 'sku', 'barcode', 'price'],
  size: 'medium',
};

const STORAGE_KEY = 'relay.stockLabelPrint';

export function loadLabelOptions() {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || 'null');
    if (!saved) return { ...DEFAULT_LABEL_OPTIONS };
    const fields = (saved.fields || []).filter(f => LABEL_FIELDS.some(d => d.key === f));
    const size = LABEL_SIZES.some(s => s.key === saved.size) ? saved.size : DEFAULT_LABEL_OPTIONS.size;
    return { fields: fields.length ? fields : [...DEFAULT_LABEL_OPTIONS.fields], size };
  } catch {
    return { ...DEFAULT_LABEL_OPTIONS };
  }
}

export function saveLabelOptions(options) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(options));
  } catch { /* the choice just isn't remembered */ }
}

/**
 * Shrink each sticker's item name until everything on the sticker fits, so
 * the whole name always prints. Runs against the rendered print document
 * (it measures layout), from the opener because the sheet can't carry a
 * script of its own under the Content-Security-Policy.
 */
export function fitLabelNames(doc) {
  doc.querySelectorAll('.label .body').forEach(body => {
    const name = body.querySelector('.name');
    if (!name) return;
    let px = parseFloat(doc.defaultView.getComputedStyle(name).fontSize);
    const min = px * 0.35;
    while (body.scrollHeight > body.clientHeight + 0.5 && px > min) {
      px *= 0.93;
      name.style.fontSize = `${px}px`;
    }
  });
}

const money = (n) => `$${(Number(n) || 0).toFixed(2)}`;

/**
 * @param {object[]} items  stock items
 * @param {{fields: string[], size: string}} options
 * @param {{barcode?: (sku: string) => string, qr?: (sku: string) => string}} codes
 *   SVG markup for each SKU, rendered by the caller (the encoders need a browser).
 */
export function buildLabelSheetHtml(items, options, codes = {}) {
  const on = new Set(options.fields);

  const labels = items.map(item => {
    const sku = String(item.sku || '').trim();
    const prices = [
      on.has('price') && `<span class="price">${money(item.unitPrice)}</span>`,
      on.has('cost') && `<span class="cost">Cost ${money(item.costPrice)}</span>`,
    ].filter(Boolean);
    return labelHtml({
      qr: on.has('qr') && sku && codes.qr ? codes.qr(sku) : '',
      barcode: on.has('barcode') && sku && codes.barcode ? codes.barcode(sku) : '',
      name: on.has('name') ? (item.name || '') : null,
      code: on.has('sku') ? sku : '',
      meta: [on.has('category') && item.category, on.has('supplier') && item.supplier].filter(Boolean),
      pricesHtml: prices.join(''),
    });
  });

  return labelSheetHtml('Stock Labels', labels, options.size);
}

/**
 * One sticker. Text is escaped here; `qr`, `barcode` and `pricesHtml` are
 * trusted markup from the caller.
 *
 * @param {{qr?: string, barcode?: string, name?: string|null, code?: string, meta?: string[], pricesHtml?: string}} parts
 *   `name` null leaves the name line out; an empty `code` leaves the code line out.
 */
export function labelHtml({ qr = '', barcode = '', name = null, code = '', meta = [], pricesHtml = '' }) {
  const hasText = name !== null || code || meta.length || pricesHtml;
  return `
      <div class="label">
        ${qr || hasText ? `<div class="top">
          ${qr ? `<div class="qr">${qr}</div>` : ''}
          ${hasText ? `<div class="body">
            ${name !== null ? `<div class="name">${escapeHTML(name)}</div>` : ''}
            ${code ? `<div class="sku">${escapeHTML(code)}</div>` : ''}
            ${meta.length ? `<div class="meta">${meta.map(m => escapeHTML(m)).join(' · ')}</div>` : ''}
            ${pricesHtml ? `<div class="prices">${pricesHtml}</div>` : ''}
          </div>` : ''}
        </div>` : ''}
        ${barcode ? `<div class="barcode${qr || hasText ? '' : ' only'}">${barcode}</div>` : ''}
      </div>`;
}

/**
 * The printable sheet: fixed-size stickers in a grid.
 *
 * @param {string} title e.g. "Stock Labels"
 * @param {string[]} labels markup from labelHtml()
 * @param {string} sizeKey one of LABEL_SIZES
 * @param {string} [noun] what each sticker is for, in the on-screen heading
 */
export function labelSheetHtml(title, labels, sizeKey, noun = 'item') {
  const size = LABEL_SIZES.find(s => s.key === sizeKey) || LABEL_SIZES[1];
  const { width, height, font, pad } = size;
  const inner = height - pad * 2;
  const count = labels.length;

  return `<!doctype html>
<html>
<head>
  <meta charset="utf-8">
  <title>${escapeHTML(title)}</title>
  <style>
    @page { margin: 8mm; }
    * { box-sizing: border-box; }
    body { font-family: 'Inter', Arial, sans-serif; margin: 0; padding: 8mm; color: #111; }
    .sheet-title { margin: 0 0 4mm; font-size: 14px; border-bottom: 1px solid #eee; padding-bottom: 2mm; }
    .grid { display: grid; grid-template-columns: repeat(auto-fill, ${width}mm); gap: 2mm; }
    .label { width: ${width}mm; height: ${height}mm; padding: ${pad}mm; border: 0.2mm dashed #bbb; border-radius: 1mm;
      display: flex; flex-direction: column; gap: ${pad * 0.6}mm; overflow: hidden; break-inside: avoid; page-break-inside: avoid; }
    .top { flex: 1 1 0; min-height: 0; display: flex; justify-content: center; gap: ${pad}mm; }
    .qr { flex: 0 0 auto; height: 100%; aspect-ratio: 1; }
    .qr svg { width: 100%; height: 100%; display: block; }
    .body { flex: 1 1 auto; min-width: 0; overflow: hidden; display: flex; flex-direction: column; justify-content: safe center; gap: ${font * 0.25}mm; text-align: center; }
    /* Never truncated: fitLabelNames() shrinks the font until the whole name fits. */
    .name { font-weight: 600; font-size: ${font}mm; line-height: 1.15; overflow-wrap: anywhere; }
    .sku { font-family: monospace; font-size: ${font * 0.85}mm; color: #444; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
    .meta { font-size: ${font * 0.8}mm; color: #555; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
    /* Full label width along the bottom, so the bars stay wide enough to scan. */
    .barcode { flex: 0 0 ${(inner * 0.3).toFixed(2)}mm; }
    .barcode.only { flex: 1 1 0; }
    .barcode svg { width: 100%; height: 100%; display: block; }
    .prices { display: flex; justify-content: center; align-items: baseline; gap: ${font}mm; white-space: nowrap; }
    .price { font-weight: 700; font-size: ${font * 1.1}mm; }
    .cost { font-size: ${font * 0.8}mm; color: #555; }
    @media print {
      body { padding: 0; }
      .sheet-title { display: none; }
    }
  </style>
</head>
<body>
  <h3 class="sheet-title">${escapeHTML(title)} (${count} ${noun}${count === 1 ? '' : 's'}) · ${escapeHTML(size.label)}</h3>
  <div class="grid">${labels.join('')}</div>
</body>
</html>`;
}
