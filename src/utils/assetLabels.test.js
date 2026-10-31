import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  assetLabelCode, findAssetByCode, buildAssetLabelSheetHtml, loadAssetLabelOptions, DEFAULT_ASSET_LABEL_OPTIONS,
} from './assetLabels.js';

const assets = [
  { id: 'asset_van', name: 'Hino van', serial: 'XQG-123', type: 'Vehicle', ownerType: 'Business', site: 'Depot' },
  { id: 'asset_split', name: 'Daikin <b>split</b>', serial: '', type: 'Fixed Asset (HVAC/Solar/Fire)', ownerType: 'Customer', customerName: 'Harbour View', site: 'Level 2' },
];
const codes = { barcode: c => `<svg data-bar="${c}"></svg>`, qr: c => `<svg data-qr="${c}"></svg>` };

test('the label code is the serial, or the record id without one', () => {
  assert.equal(assetLabelCode(assets[0]), 'XQG-123');
  assert.equal(assetLabelCode(assets[1]), 'asset_split');
  assert.equal(assetLabelCode({ id: 'a1', identifier: 'ID-9' }), 'ID-9');
});

test('a scanned code finds its asset by serial or id, ignoring case and spaces', () => {
  assert.equal(findAssetByCode(assets, ' xqg-123 ')?.id, 'asset_van');
  assert.equal(findAssetByCode(assets, 'asset_split')?.id, 'asset_split');
  assert.equal(findAssetByCode(assets, 'XQG'), null);
  assert.equal(findAssetByCode(assets, ''), null);
});

test('a serial shared by two assets matches neither', () => {
  const twins = [{ id: 'a', serial: 'DUP' }, { id: 'b', serial: 'DUP' }];
  assert.equal(findAssetByCode(twins, 'DUP'), null);
  assert.equal(findAssetByCode(twins, 'b')?.id, 'b');
});

test('every asset gets a code, falling back to its id', () => {
  const html = buildAssetLabelSheetHtml(assets, { fields: ['barcode', 'qr', 'code'], size: 'small' }, codes);
  assert.equal((html.match(/data-qr="XQG-123"/g) || []).length, 1);
  assert.equal((html.match(/data-bar="asset_split"/g) || []).length, 1);
  assert.equal((html.match(/class="label"/g) || []).length, 2);
  assert.match(html, /Asset Labels \(2 assets\)/);
});

test('only the chosen details print, escaped', () => {
  const html = buildAssetLabelSheetHtml(assets, { fields: ['name', 'owner', 'site'], size: 'medium' }, codes);
  assert.match(html, /Daikin &lt;b&gt;split&lt;\/b&gt;/);
  assert.match(html, /My Business · Depot/);
  assert.match(html, /Harbour View · Level 2/);
  assert.doesNotMatch(html, /data-bar|data-qr|class="sku"/);
});

test('options fall back to defaults without storage', () => {
  assert.deepEqual(loadAssetLabelOptions(), DEFAULT_ASSET_LABEL_OPTIONS);
});
