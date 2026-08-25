// ============================================
// RELAY — KIT TYPES HELPER
// ============================================
// Single source of truth for the managed kit types that kits reference
// instead of the old hardcoded "category" string list. Mirrors the
// storage locations helper (name-referenced, company-scoped collection).

import { store } from '../data/store.js';

export function getKitTypes() {
  return store.getAll('kitTypes') || [];
}

export function getActiveKitTypes() {
  return getKitTypes().filter(t => t.active !== false);
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
