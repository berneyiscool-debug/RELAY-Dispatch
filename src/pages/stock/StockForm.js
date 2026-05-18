// ============================================
// SIMPRO CLONE — STOCK FORM (Create/Edit)
// ============================================

import { store } from '../../data/store.js';
import { router } from '../../router.js';
import { showToast } from '../../components/Notifications.js';

export function renderStockForm(container, { id }) {
  const isEdit = id && id !== 'new';
  const item = isEdit ? store.getById('stock', id) : {};
  const assets = store.getAll('assets');

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
              <input class="form-input" name="sku" value="${item.sku || ''}" />
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
              <label class="form-label">Quantity</label>
              <input class="form-input" type="number" name="quantity" value="${item.quantity ?? ''}" />
            </div>
          </div>
          <div class="form-row">
            <div class="form-group">
              <label class="form-label">Cost Price ($)</label>
              <input class="form-input" type="number" name="costPrice" value="${item.costPrice || ''}" step="0.01" />
            </div>
            <div class="form-group">
              <label class="form-label">Sell Price ($)</label>
              <input class="form-input" type="number" name="unitPrice" value="${item.unitPrice || ''}" step="0.01" />
            </div>
          </div>
          <div class="form-row">
            <div class="form-group">
              <label class="form-label">Reorder Level</label>
              <input class="form-input" type="number" name="reorderLevel" value="${item.reorderLevel || '10'}" />
            </div>
            <div class="form-group">
              <label class="form-label">Supplier</label>
              <input class="form-input" name="supplier" value="${item.supplier || ''}" />
            </div>
          </div>
          <div class="form-group">
            <label class="form-label">Location</label>
            <select class="form-select" name="location">
              <option value="Main Warehouse" ${item.location === 'Main Warehouse' ? 'selected' : ''}>Main Warehouse</option>
              <optgroup label="Warehouses">
                ${['Warehouse A', 'Warehouse B'].map(l => `<option ${item.location === l ? 'selected' : ''}>${l}</option>`).join('')}
              </optgroup>
              <optgroup label="Vehicles">
                ${store.getAll('technicians').map(t => {
                  const locName = `Vehicle - ${t.name}`;
                  return `<option value="${locName}" ${item.location === locName ? 'selected' : ''}>${locName}</option>`;
                }).join('')}
              </optgroup>
              <optgroup label="Assets">
                ${assets.map(a => `<option value="${a.name}" ${item.location === a.name ? 'selected' : ''}>${a.name}</option>`).join('')}
              </optgroup>
              <option value="On Order" ${item.location === 'On Order' ? 'selected' : ''}>On Order</option>
            </select>
          </div>
        </form>
      </div>
      <div class="card-footer">
        <button class="btn btn-secondary" id="btn-cancel">Cancel</button>
        <button class="btn btn-primary" id="btn-save"><span class="material-icons-outlined">save</span> ${isEdit ? 'Update' : 'Create'} Item</button>
      </div>
    </div>
  `;

  container.querySelector('#btn-cancel').addEventListener('click', () => router.navigate(isEdit ? `/stock/${id}` : '/stock'));
  container.querySelector('#btn-save').addEventListener('click', () => {
    const form = container.querySelector('#stock-form');
    if (!form.checkValidity()) { form.reportValidity(); return; }
    const data = Object.fromEntries(new FormData(form));
    data.quantity = parseInt(data.quantity) || 0;
    data.costPrice = parseFloat(data.costPrice) || 0;
    data.unitPrice = parseFloat(data.unitPrice) || 0;
    data.reorderLevel = parseInt(data.reorderLevel) || 10;

    if (isEdit) {
      store.update('stock', id, data);
      showToast('Item updated', 'success');
      checkReorderLevel(data);
      router.navigate(`/stock/${id}`);
    }
    else {
      data.sku = data.sku || `SKU-${Date.now().toString().slice(-4)}`;
      const n = store.create('stock', data);
      showToast('Item created', 'success');
      checkReorderLevel(data);
      router.navigate(`/stock/${n.id}`);
    }
  });
}

function checkReorderLevel(data) {
  if (data.quantity <= data.reorderLevel) {
    const currentUser = JSON.parse(sessionStorage.getItem('currentUser') || '{}');
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
      // Optionally create a global notification
      store.create('notifications', {
        title: 'Stock Auto-Reorder',
        message: `${data.name} (SKU: ${data.sku}) has reached its reorder level. Current quantity: ${data.quantity}. Please reorder from ${data.supplier || 'supplier'}.`,
        read: false,
        link: '/stock'
      });
    }
  }
}
