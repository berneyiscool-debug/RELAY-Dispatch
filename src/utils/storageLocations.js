// ============================================
// RELAY — STORAGE LOCATIONS HELPER
// ============================================
// Single source of truth for stock storage locations. Replaces the
// hardcoded "Main Warehouse" / "Warehouse A/B" / "Vehicle - X" strings
// scattered across the app with a company-scoped `storage_locations`
// collection, plus shared dropdown rendering and stock-deduction logic.

import { store } from '../data/store.js';
import { escapeHTML } from './security.js';

export const STORAGE_LOCATION_TYPES = ['Warehouse', 'Vehicle', 'On Order', 'Asset'];

export function getStorageLocations() {
  return store.getAll('storageLocations') || [];
}

export function getActiveStorageLocations() {
  return getStorageLocations().filter(l => l.active !== false);
}

export function getStorageLocationByName(name) {
  return getStorageLocations().find(l => l.name === name) || null;
}

export function getAvailableLocations(stockItem) {
  return (stockItem?.locations || []).filter(l => l.quantity > 0);
}

// Total quantity of a given stock item held at a specific location.
export function getQuantityAtLocation(stockItem, locationName) {
  const loc = (stockItem?.locations || []).find(l => l.location === locationName);
  return loc ? (parseFloat(loc.quantity) || 0) : 0;
}

// Total quantity of ALL stock held at a location (used to guard deletes).
export function getStockHeldAtLocation(locationName) {
  return (store.getAll('stock') || []).reduce((sum, s) => sum + getQuantityAtLocation(s, locationName), 0);
}

// Deduct `qty` from a specific location on a stock item (mutates the object
// passed in and returns it, already summed + cleaned of zero-qty rows).
// Returns { ok, stockItem, reason }.
export function deductStockFromLocation(stockItem, locationName, qty) {
  const q = parseFloat(qty) || 0;
  const locations = Array.isArray(stockItem.locations) ? [...stockItem.locations] : [];
  const loc = locations.find(l => l.location === locationName);
  if (!loc) return { ok: false, reason: `No stock of "${stockItem.name}" at ${locationName}` };
  if ((parseFloat(loc.quantity) || 0) < q) {
    return { ok: false, reason: `Insufficient quantity at ${locationName} (${loc.quantity} available)` };
  }

  loc.quantity = (parseFloat(loc.quantity) || 0) - q;
  const remaining = locations.filter(l => (parseFloat(l.quantity) || 0) > 0);
  stockItem.locations = remaining;
  stockItem.quantity = remaining.reduce((sum, l) => sum + (parseFloat(l.quantity) || 0), 0);
  stockItem.location = remaining[0]?.location || locationName;
  return { ok: true, stockItem };
}

// Build grouped `<option>/<optgroup>` markup for a location `<select>`.
// Vehicle locations are sourced from storage_locations (type "Vehicle"),
// falling back to a virtual entry per active technician for backward compat.
// Asset and On-Order locations are surfaced when present.
export function getStorageLocationOptionsHtml(selected = '') {
  const locations = getActiveStorageLocations();
  const technicians = (store.getAll('technicians') || []).filter(t => !t.deactivated);
  const allTechnicians = store.getAll('technicians') || [];
  const assets = store.getAll('assets') || [];

  const byType = (type) => locations.filter(l => (l.type || 'Warehouse') === type).map(l => l.name);

  const vehicleNames = new Set(byType('Vehicle'));
  const virtualVehicles = technicians
    .map(t => `Vehicle - ${t.name}`)
    .filter(name => !vehicleNames.has(name));

  // Keep the currently-selected location available even if it belongs to a
  // deactivated technician (or a location the active list no longer contains).
  if (selected && !vehicleNames.has(selected) && !virtualVehicles.includes(selected)) {
    const deactivatedTech = allTechnicians.find(t => `Vehicle - ${t.name}` === selected);
    if (deactivatedTech) virtualVehicles.push(selected);
  }

  const assetNames = [...byType('Asset'), ...assets.map(a => a.name).filter(n => !locations.some(l => l.name === n))];

  const optgroup = (label, names) => {
    if (!names.length) return '';
    return `<optgroup label="${escapeHTML(label)}">${names.map(n => `<option value="${escapeHTML(n)}" ${selected === n ? 'selected' : ''}>${escapeHTML(n)}</option>`).join('')}</optgroup>`;
  };

  let html = '<option value="">Select location...</option>';
  html += optgroup('Warehouses', byType('Warehouse'));
  html += optgroup('Vehicles / Vans', [...vehicleNames, ...virtualVehicles]);
  html += optgroup('Assets', assetNames);
  html += optgroup('On Order', byType('On Order'));
  return html;
}

// Rename a storage location and propagate the new name to every stock item
// location entry and job material record that referenced the old name.
export function renameStorageLocation(oldName, newName) {
  if (!oldName || !newName || oldName === newName) return false;

  (store.getAll('stock') || []).forEach(s => {
    let changed = false;
    const locations = (s.locations || []).map(l => {
      if (l.location === oldName) { changed = true; return { ...l, location: newName }; }
      return l;
    });
    const patch = {};
    if (changed) patch.locations = locations;
    if (s.location === oldName) { patch.location = newName; }
    if (Object.keys(patch).length) store.update('stock', s.id, patch);
  });

  (store.getAll('jobMaterials') || []).forEach(m => {
    if (m.location === oldName) store.update('jobMaterials', m.id, { location: newName });
  });

  return true;
}
