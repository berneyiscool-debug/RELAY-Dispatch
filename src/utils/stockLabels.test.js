import { test } from 'node:test';
import assert from 'node:assert/strict';
import { buildLabelSheetHtml, loadLabelOptions, DEFAULT_LABEL_OPTIONS } from './stockLabels.js';

const items = [
  { name: 'RCBO 1P+N 20A 30mA Type A', sku: 'HL-RCBO20', unitPrice: 64, costPrice: 41.5, category: 'Protection', supplier: 'Haymans' },
  { name: 'No code <b>item</b>', sku: '', unitPrice: 5 },
];
const codes = { barcode: sku => `<svg data-bar="${sku}"></svg>`, qr: sku => `<svg data-qr="${sku}"></svg>` };

test('only the chosen fields are printed', () => {
  const html = buildLabelSheetHtml(items, { fields: ['name', 'price'], size: 'medium' }, codes);
  assert.match(html, /RCBO 1P\+N 20A/);
  assert.match(html, /\$64\.00/);
  assert.doesNotMatch(html, /class="sku"/);
  assert.doesNotMatch(html, /data-bar|data-qr/);
  assert.doesNotMatch(html, /Cost \$/);
});

test('codes print for items with a SKU and are skipped without one', () => {
  const html = buildLabelSheetHtml(items, { fields: ['barcode', 'qr', 'cost', 'supplier'], size: 'small' }, codes);
  assert.equal((html.match(/data-bar="HL-RCBO20"/g) || []).length, 1);
  assert.equal((html.match(/data-qr="HL-RCBO20"/g) || []).length, 1);
  assert.equal((html.match(/class="label"/g) || []).length, 2);
  assert.match(html, /Cost \$41\.50/);
  assert.match(html, /Haymans/);
});

test('every sticker is the chosen fixed size', () => {
  const html = buildLabelSheetHtml(items, { fields: ['name'], size: 'large' }, codes);
  assert.match(html, /\.label \{ width: 63\.5mm; height: 38\.1mm;/);
  assert.match(html, /repeat\(auto-fill, 63\.5mm\)/);
});

test('item text is escaped', () => {
  const html = buildLabelSheetHtml(items, { fields: ['name'], size: 'medium' }, codes);
  assert.match(html, /No code &lt;b&gt;item&lt;\/b&gt;/);
});

test('options fall back to defaults without storage', () => {
  assert.deepEqual(loadLabelOptions(), DEFAULT_LABEL_OPTIONS);
});
