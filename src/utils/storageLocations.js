// ============================================
// RELAY — STORAGE LOCATIONS HELPER
// ============================================
// Single source of truth for stock storage locations. Replaces the
// hardcoded "Main Warehouse" / "Warehouse A/B" / "Vehicle - X" strings
// scattered across the app with a company-scoped `storage_locations`
// collection, plus shared dropdown rendering and stock-deduction logic.

import { store } from '../data/store.js';
import { escapeHTML } from './security.js';
import { getActiveLocationTypes } from './locationTypes.js';

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

// Receive `qty` of a stock item into a physical location (mutates the object).
// Also clears the matching quantity from the "On Order" pool, so a received PO
// moves stock out of "On Order" rather than double-counting it.
export function receiveStockIntoLocation(stockItem, targetLoc, qty) {
  const q = parseFloat(qty) || 0;
  const locations = Array.isArray(stockItem.locations)
    ? stockItem.locations.map(l => ({ ...l }))
    : [];

  const target = locations.find(l => l.location === targetLoc);
  if (target) target.quantity = (parseFloat(target.quantity) || 0) + q;
  else locations.push({ location: targetLoc, quantity: q });

  if (q > 0) {
    const onOrder = locations.find(l => l.location === 'On Order');
    if (onOrder) onOrder.quantity = Math.max(0, (parseFloat(onOrder.quantity) || 0) - q);
  }

  stockItem.locations = locations.filter(l => (parseFloat(l.quantity) || 0) > 0);
  stockItem.quantity = stockItem.locations.reduce((sum, l) => sum + (parseFloat(l.quantity) || 0), 0);
  stockItem.location = stockItem.locations[0]?.location || targetLoc;
  stockItem.updatedAt = new Date().toISOString();
  return stockItem;
}

// Build `<option>` markup for a location-type `<select>` (Warehouse, Vehicle, …).
export function getStorageLocationTypeOptionsHtml(selectedType = '') {
  return getActiveLocationTypes().map(t =>
    `<option value="${t.name}" ${selectedType === t.name ? 'selected' : ''}>${t.name}</option>`
  ).join('');
}

// Type options for a receive/transfer destination (physical locations only,
// i.e. everything except "On Order").
export function getPhysicalLocationTypeOptionsHtml(selectedType = '') {
  return getActiveLocationTypes()
    .filter(t => t.name !== 'On Order')
    .map(t => `<option value="${t.name}" ${selectedType === t.name ? 'selected' : ''}>${t.name}</option>`)
    .join('');
}

// Infer a location's type from its name (used to pre-select the type dropdown).
export function getStorageLocationTypeByName(name) {
  if (!name) return '';
  const loc = getStorageLocations().find(l => l.name === name);
  if (loc) return loc.type || 'Warehouse';
  if (name.startsWith('Vehicle - ')) return 'Vehicle';
  return '';
}

// Build grouped `<option>/<optgroup>` markup for a location `<select>`.
// Vehicle locations are sourced from storage_locations (type "Vehicle"),
// falling back to a virtual entry per active technician for backward compat.
// Asset and On-Order locations are surfaced when present.
// Pass a `type` to restrict the list to a single location type, and
// `includeOnOrder = false` to drop the "On Order" group (e.g. receive/transfer
// destinations, where stock is moving INTO a physical location).
export function getStorageLocationOptionsHtml(selected = '', type = null, includeOnOrder = true) {
  const locations = getActiveStorageLocations();
  const technicians = (store.getAll('technicians') || []).filter(t => !t.deactivated);
  const allTechnicians = store.getAll('technicians') || [];
  const assets = store.getAll('assets') || [];

  const byType = (t) => locations.filter(l => (l.type || 'Warehouse') === t).map(l => l.name);

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

  const typeLabels = {
    'Warehouse': 'Warehouses',
    'Vehicle': 'Vehicles / Vans',
    'Asset': 'Assets',
    'On Order': 'On Order'
  };

  // Build a group per active location type, preserving the special handling for
  // Vehicle (virtual technician vans) and Asset (linked asset names).
  const activeTypes = getActiveLocationTypes().map(t => t.name);
  const groups = {};
  activeTypes.forEach(t => {
    let names = byType(t);
    if (t === 'Vehicle') names = [...vehicleNames, ...virtualVehicles];
    if (t === 'Asset') names = assetNames;
    groups[t] = { label: typeLabels[t] || (t.endsWith('s') ? t : `${t}s`), names };
  });

  const option = (n) => `<option value="${escapeHTML(n)}" ${selected === n ? 'selected' : ''}>${escapeHTML(n)}</option>`;
  const optgroup = (label, names) => {
    if (!names.length) return '';
    return `<optgroup label="${escapeHTML(label)}">${names.map(option).join('')}</optgroup>`;
  };

  let html = '<option value="">Select location...</option>';
  if (type && groups[type]) {
    if (type !== 'On Order' || includeOnOrder) {
      html += groups[type].names.map(option).join('');
    }
  } else {
    activeTypes.forEach(t => {
      if (t === 'On Order' && !includeOnOrder) return;
      html += optgroup(groups[t].label, groups[t].names);
    });
  }
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
