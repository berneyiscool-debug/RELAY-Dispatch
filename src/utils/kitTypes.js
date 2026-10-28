// ============================================
// RELAY — KIT TYPES HELPER
// ============================================
// Single source of truth for the managed kit types that kits reference
// instead of the old hardcoded "category" string list. Mirrors the
// storage locations helper (name-referenced, company-scoped collection).

import { store } from '../data/store.js';
import { escapeHTML } from './security.js';

// A kit doesn't need a type: an empty `category` reads as this everywhere.
export const NO_KIT_TYPE_LABEL = 'No type';
export const NEW_KIT_TYPE_OPTION = '__new_kit_type__';

const byName = (a, b) => a.name.localeCompare(b.name);

export function getKitTypes() {
  return store.getAll('kitTypes') || [];
}

export function getActiveKitTypes() {
  return getKitTypes().filter(t => t.active !== false).sort(byName);
}

export function kitTypeLabel(kit) {
  return kit?.category || NO_KIT_TYPE_LABEL;
}

/**
 * <option>s for picking a kit's type: "No type", the active types, the
 * current value even if it's since been retired (so saving doesn't silently
 * change it), and optionally a "New kit type…" entry.
 */
export function kitTypeOptionsHtml(selected = '', { allowNew = false } = {}) {
  const names = getActiveKitTypes().map(t => t.name);
  if (selected && !names.includes(selected)) names.unshift(selected);
  return [
    `<option value=""${selected ? '' : ' selected'}>${NO_KIT_TYPE_LABEL}</option>`,
    ...names.map(n => `<option value="${escapeHTML(n)}"${n === selected ? ' selected' : ''}>${escapeHTML(n)}</option>`),
    ...(allowNew ? [`<option value="${NEW_KIT_TYPE_OPTION}">+ New kit type…</option>`] : []),
  ].join('');
}

/**
 * Create a kit type, or reuse one with the same name (ignoring case),
 * reactivating it if it had been retired. Returns the type, or null for a
 * blank name.
 */
export function createKitType(name) {
  const clean = String(name || '').trim();
  if (!clean) return null;
  const existing = getKitTypes().find(t => t.name.toLowerCase() === clean.toLowerCase());
  if (existing) {
    if (existing.active === false) store.update('kitTypes', existing.id, { active: true });
    return store.getById('kitTypes', existing.id) || existing;
  }
  return store.create('kitTypes', { name: clean, active: true });
}

/**
 * DataTable `groupBy` for a kit list: one group per type that has kits, in
 * name order, with "No type" last.
 */
export function kitTypeGrouping(kits, persistKey) {
  const used = new Set(kits.map(k => k.category || ''));
  const named = [...used].filter(Boolean).sort((a, b) => a.localeCompare(b));
  return {
    getKey: (k) => k.category || '',
    order: [...named, ...(used.has('') ? [''] : [])],
    labelFor: (key) => key || NO_KIT_TYPE_LABEL,
    persistKey,
  };
}

export function getKitTypeByName(name) {
  return getKitTypes().find(t => t.name === name) || null;
}

// Rename a kit type and propagate the new name to every kit that referenced
// the old name via its `category` field.
export function renameKitType(oldName, newName) {
  if (!oldName || !newName || oldName === newName) return false;

  (store.getAll('kits') || []).forEach(k => {
    if (k.category === oldName) store.update('kits', k.id, { category: newName });
  });

  return true;
}
