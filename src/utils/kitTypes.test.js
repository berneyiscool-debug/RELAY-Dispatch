import { test, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { store } from '../data/store.js';
import {
  createKitType, getActiveKitTypes, kitTypeOptionsHtml, kitTypeGrouping, kitTypeLabel,
  NEW_KIT_TYPE_OPTION, NO_KIT_TYPE_LABEL,
} from './kitTypes.js';

beforeEach(() => {
  store.cache.kitTypes = [];
  store.cache.kits = [];
});

test('createKitType reuses a name regardless of case and revives a retired one', () => {
  const a = createKitType('Service Kits');
  const again = createKitType('  service kits ');
  assert.equal(again.id, a.id);
  assert.equal(store.getAll('kitTypes').length, 1);

  store.update('kitTypes', a.id, { active: false });
  assert.equal(getActiveKitTypes().length, 0);
  createKitType('SERVICE KITS');
  assert.equal(getActiveKitTypes().length, 1);
  assert.equal(createKitType('   '), null);
});

test('options offer No type, sorted active types, a retired current value and New', () => {
  createKitType('Vehicle Loadouts');
  createKitType('Compliance Kits');
  const html = kitTypeOptionsHtml('Old Type', { allowNew: true });
  const values = [...html.matchAll(/value="([^"]*)"/g)].map(m => m[1]);
  assert.deepEqual(values, ['', 'Old Type', 'Compliance Kits', 'Vehicle Loadouts', NEW_KIT_TYPE_OPTION]);
  assert.match(html, /value="Old Type" selected/);
  assert.match(kitTypeOptionsHtml(''), /value="" selected/);
});

test('grouping lists only types in use, by name, with No type last', () => {
  const kits = [{ category: 'Vehicle Loadouts' }, { category: '' }, { category: 'Compliance Kits' }, {}];
  const g = kitTypeGrouping(kits, 'k');
  assert.deepEqual(g.order, ['Compliance Kits', 'Vehicle Loadouts', '']);
  assert.equal(g.labelFor(''), NO_KIT_TYPE_LABEL);
  assert.equal(g.getKey({}), '');
  assert.equal(kitTypeLabel({ category: '' }), NO_KIT_TYPE_LABEL);
});
