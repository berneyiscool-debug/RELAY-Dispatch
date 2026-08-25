// ============================================
// RELAY — LOCATION TYPES HELPER
// ============================================
// Single source of truth for the managed storage-location types that
// storage locations reference via their `type` field. Mirrors the kit
// types helper (name-referenced, company-scoped collection).

import { store } from '../data/store.js';

export function getLocationTypes() {
  return store.getAll('locationTypes') || [];
}

export function getActiveLocationTypes() {
  return getLocationTypes().filter(t => t.active !== false);
}

export function getLocationTypeByName(name) {
  return getLocationTypes().find(t => t.name === name) || null;
}

// Rename a location type and propagate the new name to every storage
// location that referenced the old name via its `type` field.
export function renameLocationType(oldName, newName) {
  if (!oldName || !newName || oldName === newName) return false;

  (store.getAll('storageLocations') || []).forEach(l => {
    if (l.type === oldName) store.update('storageLocations', l.id, { type: newName });
  });

  return true;
}
