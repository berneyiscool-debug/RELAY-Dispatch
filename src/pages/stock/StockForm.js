// ============================================
// FIELDFORGE — STOCK FORM (Create/Edit)
// ============================================

import { store } from '../../data/store.js';
import { router } from '../../router.js';
import { showToast } from '../../components/Notifications.js';
import { escapeHTML } from '../../utils/security.js';

export function renderStockForm(container, { id }) {
  const isEdit = id && id !== 'new';
  const item = isEdit ? store.getById('stock', id) : {};
  const technicians = store.getAll('technicians').filter(t => !t.deactivated || item.location === `Vehicle - ${t.name}`);
  const assets = store.getAll('assets');
  const activeSuppliers = store.getAll('suppliers').filter(s => s.active !== false);

  // Helper to build options for locations select dropdown
  function getLocationOptions(selectedLoc = '') {
    let html = `<option value="">Select location...</option>`;
    html += `<option value="Main Warehouse" ${selectedLoc === 'Main Warehouse' ? 'selected' : ''}>Main Warehouse</option>`;
    
    html += `<optgroup label="Warehouses">`;
    ['Warehouse A', 'Warehouse B'].forEach(w => {
      html += `<option value="${w}" ${selectedLoc === w ? 'selected' : ''}>${w}</option>`;
    });
    html += `</optgroup>`;
    
    html += `<optgroup label="Vehicles">`;
    technicians.forEach(t => {
      const locName = `Vehicle - ${t.name}`;
      html += `<option value="${locName}" ${selectedLoc === locName ? 'selected' : ''}>${locName}</option>`;
    });
    html += `</optgroup>`;

    html += `<optgroup label="Assets">`;
    assets.forEach(a => {
      html += `<option value="${a.name}" ${selectedLoc === a.name ? 'selected' : ''}>${a.name}</option>`;
    });
    html += `</optgroup>`;

    html += `<option value="On Order" ${selectedLoc === 'On Order' ? 'selected' : ''}>On Order</option>`;
    return html;
  }

  // Generate HTML for a single location stock row
  function createLocationRowHtml(loc = '', qty = 0) {
    return `
      <div class="location-row" style="display:flex; gap:12px; align-items:center; margin-bottom:10px">
        <div style="flex:1">
          <select class="form-select loc-select" required style="width:100%">
            ${getLocationOptions(loc)}
          </select>
        </div>
        <div style="width:120px">
          <input type="number" class="form-input loc-qty" min="0" value="${qty}" required style="width:100%" />
        </div>
        <div>
          <button type="button" class="btn btn-icon btn-danger btn-remove-loc" style="padding:6px"><span class="material-icons-outlined">delete</span></button>
        </div>
      </div>
    `;
  }

  // Pre-populate location rows
  let initialLocationsHtml = '';
  if (isEdit && item.locations && item.locations.length > 0) {
    initialLocationsHtml = item.locations.map(l => createLocationRowHtml(l.location, l.quantity)).join('');
  } else {
    // If new item or has no locations, render one empty default row
    initialLocationsHtml = createLocationRowHtml(item.location || 'Warehouse A', item.quantity || 0);
  }

  container.innerHTML = `
    <div class="page-header"><h1>${isEdit ? 'Edit Stock Item' : 'New Stock Item'}</h1></div>
    <div class="card" style="max-width:720px">
      <div class="card-body">
        <form id="stock-form">
          <div class="form-group">
            <label class="form-label">Item Name *</label>
            <input class="form-input" name="name" value="${item.name || ''}" required />
          </div>
          <div class="form-row">
            <div class="form-group">
              <label class="form-label">SKU</label>
              <input class="form-input" name="sku" value="${item.sku || ''}" placeholder="e.g. SKU-1000" />
            </div>
            <div class="form-group">
              <label class="form-label">Category</label>
              <select class="form-select" name="category">
                ${['Electrical','Plumbing','HVAC','Fire Safety','Security','General'].map(c => `<option ${item.category === c ? 'selected' : ''}>${c}</option>`).join('')}
              </select>
            </div>
          </div>
          <div class="form-row">
            <div class="form-group">
              <label class="form-label">Unit</label>
              <input class="form-input" name="unit" value="${item.unit || 'each'}" />
            </div>
            <div class="form-group">
              <label class="form-label">Reorder Level</label>
              <input class="form-input" type="number" name="reorderLevel" value="${item.reorderLevel || '10'}" min="0" />
            </div>
          </div>
          <div class="form-row">
            <div class="form-group">
              <label class="form-label">Cost Price ($) *</label>
              <input class="form-input" type="number" name="costPrice" value="${item.costPrice || ''}" step="0.01" required min="0" />
            </div>
            <div class="form-group">
              <label class="form-label">Sell Price ($) *</label>
              <input class="form-input" type="number" name="unitPrice" value="${item.unitPrice || ''}" step="0.01" required min="0" />
            </div>
          </div>
          <div class="form-group">
            <label class="form-label">Supplier</label>
            <select class="form-input" name="supplier">
              <option value="">Select a supplier...</option>
              ${activeSuppliers.map(s => `<option value="${escapeHTML(s.name)}" ${item.supplier === s.name ? 'selected' : ''}>${escapeHTML(s.name)}</option>`).join('')}
              ${item.supplier && !activeSuppliers.some(s => s.name === item.supplier) ? `<option value="${escapeHTML(item.supplier)}" selected>${escapeHTML(item.supplier)} (Inactive / Custom)</option>` : ''}
            </select>
          </div>
          
          <div class="form-group" style="margin-top:20px; border-top:1px solid var(--border-color); padding-top:15px">
            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:12px">
              <label class="form-label" style="margin:0; font-weight:600">Stock Locations & Quantities *</label>
              <button type="button" class="btn btn-secondary btn-sm" id="btn-add-loc-row">
                <span class="material-icons-outlined" style="font-size:16px">add</span> Add Location
              </button>
            </div>
            <div id="locations-editor-container">
              ${initialLocationsHtml}
            </div>
          </div>
        </form>
      </div>
      <div class="card-footer">
        <button class="btn btn-secondary" id="btn-cancel">Cancel</button>
        <button class="btn btn-primary" id="btn-save"><span class="material-icons-outlined">save</span> ${isEdit ? 'Update' : 'Create'} Item</button>
      </div>
    </div>
  `;

  // Dynamic Row Operations Event Listeners
  const editorContainer = container.querySelector('#locations-editor-container');
  
  container.querySelector('#btn-add-loc-row').addEventListener('click', () => {
    const div = document.createElement('div');
    div.innerHTML = createLocationRowHtml();
    const row = div.firstElementChild;
    editorContainer.appendChild(row);
    bindRowEvents(row);
  });

  function bindRowEvents(row) {
    row.querySelector('.btn-remove-loc').addEventListener('click', () => {
      // Keep at least one row
      if (editorContainer.querySelectorAll('.location-row').length > 1) {
        row.remove();
      } else {
        showToast('At least one stock location is required', 'error');
      }
    });
  }

  // Bind initial rows
  editorContainer.querySelectorAll('.location-row').forEach(bindRowEvents);

  container.querySelector('#btn-cancel').addEventListener('click', () => router.navigate(isEdit ? `/stock/${id}` : '/stock'));
  
  container.querySelector('#btn-save').addEventListener('click', () => {
    const form = container.querySelector('#stock-form');
    if (!form.checkValidity()) { form.reportValidity(); return; }

    const locationRows = Array.from(editorContainer.querySelectorAll('.location-row'));
    const locations = locationRows.map(row => {
      const loc = row.querySelector('.loc-select').value;
      const qty = parseInt(row.querySelector('.loc-qty').value) || 0;
      return { location: loc, quantity: qty };
    }).filter(l => l.location !== '');

    if (locations.length === 0) {
      showToast('Please select at least one valid stock location', 'error');
      return;
    }

    // Check for duplicate locations in form
    const locNames = locations.map(l => l.location);
    if (new Set(locNames).size !== locNames.length) {
      showToast('Duplicate locations detected. Please merge them into a single row.', 'error');
      return;
    }

    const data = Object.fromEntries(new FormData(form));
    data.costPrice = parseFloat(data.costPrice) || 0;
    data.unitPrice = parseFloat(data.unitPrice) || 0;
    data.reorderLevel = parseInt(data.reorderLevel) || 10;
    data.locations = locations;
    data.quantity = locations.reduce((sum, l) => sum + l.quantity, 0);
    data.location = locations[0]?.location || 'Main Warehouse';

    if (isEdit) {
      store.update('stock', id, data);
      showToast('Item updated successfully', 'success');
      checkReorderLevel(data);
      router.navigate(`/stock/${id}`);
    }
    else {
      data.sku = data.sku || `SKU-${Date.now().toString().slice(-4)}`;
      const n = store.create('stock', data);
      showToast('Item created successfully', 'success');
      checkReorderLevel(data);
      router.navigate(`/stock/${n.id}`);
    }
  });
}

function checkReorderLevel(data) {
  if (data.quantity <= data.reorderLevel) {
    const currentUser = JSON.parse(localStorage.getItem('currentUser') || '{}');
    let hasStockPerm = false;
    if (currentUser.role === 'admin') hasStockPerm = true;
    else if (currentUser.userTypeId) {
      const ut = store.getById('userTypes', currentUser.userTypeId);
      if (ut && ut.permissions) {
        const p = ut.permissions.find(p => p.module === 'Stock');
        if (p) hasStockPerm = p.edit || p.create;
      }
    }
    
    if (hasStockPerm) {
      import('../../components/Notifications.js').then(({ showToast }) => {
        showToast(`Auto-Reorder Alert: ${data.name} is at or below its reorder level (${data.quantity} left).`, 'warning');
      });
      store.create('notifications', {
        title: 'Stock Auto-Reorder',
        message: `${data.name} (SKU: ${data.sku}) has reached its reorder level. Current quantity: ${data.quantity}. Please reorder from ${data.supplier || 'supplier'}.`,
        read: false,
        link: '/stock'
      });
    }
  }
}
