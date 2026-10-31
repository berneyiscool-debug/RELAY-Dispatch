// ============================================
// RELAY — ASSET LABEL PRINT SHEET
// ============================================
// Asset tags, printed the way stock labels are (same sticker sizes and
// layout, from stockLabels.js). The barcode and QR code both encode the
// asset's code — its serial number, or its record id when it has none — so a
// scanner reads back a value that finds exactly that asset in search.

import { LABEL_SIZES, labelHtml, labelSheetHtml } from './stockLabels.js';

export const ASSET_LABEL_FIELDS = [
  { key: 'name', label: 'Asset name' },
  { key: 'code', label: 'Serial / ID' },
  { key: 'barcode', label: 'Barcode' },
  { key: 'qr', label: 'QR code' },
  { key: 'type', label: 'Category' },
  { key: 'owner', label: 'Owner' },
  { key: 'site', label: 'Site' },
];

export const DEFAULT_ASSET_LABEL_OPTIONS = {
  fields: ['name', 'code', 'qr'],
  size: 'medium',
};

const STORAGE_KEY = 'relay.assetLabelPrint';

export function loadAssetLabelOptions() {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || 'null');
    if (!saved) return { ...DEFAULT_ASSET_LABEL_OPTIONS };
    const fields = (saved.fields || []).filter(f => ASSET_LABEL_FIELDS.some(d => d.key === f));
    const size = LABEL_SIZES.some(s => s.key === saved.size) ? saved.size : DEFAULT_ASSET_LABEL_OPTIONS.size;
    return { fields: fields.length ? fields : [...DEFAULT_ASSET_LABEL_OPTIONS.fields], size };
  } catch {
    return { ...DEFAULT_ASSET_LABEL_OPTIONS };
  }
}

export function saveAssetLabelOptions(options) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(options));
  } catch { /* the choice just isn't remembered */ }
}

/** The value an asset's barcode and QR code carry: serial, else the record id. */
export function assetLabelCode(asset) {
  return String(asset?.serial || asset?.identifier || asset?.id || '').trim();
}

/**
 * The asset a scanned or typed code belongs to: an exact, case-insensitive
 * match on serial, identifier or id. Null when none matches, or when two
 * assets share a serial and the code can't tell them apart.
 */
export function findAssetByCode(assets, code) {
  const wanted = String(code || '').trim().toLowerCase();
  if (!wanted) return null;
  const hits = (assets || []).filter(a =>
    [a.serial, a.identifier, a.id].some(v => String(v || '').trim().toLowerCase() === wanted)
  );
  return hits.length === 1 ? hits[0] : null;
}

/**
 * @param {object[]} assets
 * @param {{fields: string[], size: string}} options
 * @param {{barcode?: (code: string) => string, qr?: (code: string) => string}} codes
 *   SVG markup for each code, rendered by the caller (labelPrint.js).
 * @param {(asset: object) => string} [ownerName] owner shown when 'owner' is chosen
 */
export function buildAssetLabelSheetHtml(assets, options, codes = {}, ownerName = (a) => a.customerName || 'My Business') {
  const on = new Set(options.fields);
  const labels = assets.map(asset => {
    const code = assetLabelCode(asset);
    return labelHtml({
      qr: on.has('qr') && code && codes.qr ? codes.qr(code) : '',
      barcode: on.has('barcode') && code && codes.barcode ? codes.barcode(code) : '',
      name: on.has('name') ? (asset.name || '') : null,
      code: on.has('code') ? code : '',
      meta: [
        on.has('type') && asset.type,
        on.has('owner') && ownerName(asset),
        on.has('site') && asset.site,
      ].filter(Boolean),
    });
  });
  return labelSheetHtml('Asset Labels', labels, options.size, 'asset');
}
