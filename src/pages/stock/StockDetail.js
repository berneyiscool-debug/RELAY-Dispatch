// ============================================
// FIELDFORGE — STOCK DETAIL PAGE
// ============================================

import { store } from '../../data/store.js';
import { router } from '../../router.js';
import { showModal } from '../../components/Modal.js';
import { escapeHTML } from '../../utils/security.js';
import { showToast } from '../../components/Notifications.js';
import { updateBreadcrumbDetail } from '../../components/Breadcrumb.js';
import { renderDetailHeader } from '../../components/DetailHeader.js';

export function renderStockDetail(container, { id }) {
  const item = store.getById('stock', id);
  if (!item) {
    container.innerHTML = '<div class="empty-state"><span class="material-icons-outlined">error</span><h3>Item not found</h3></div>';
    return;
  }

  updateBreadcrumbDetail(item.name);
  
  const totalQty = (item.locations || []).reduce((sum, l) => sum + l.quantity, 0);
  const isLow = totalQty <= item.reorderLevel;
  const margin = item.unitPrice > 0 ? ((item.unitPrice - item.costPrice) / item.unitPrice * 100).toFixed(1) : 0;

  const locationsHtml = (item.locations || []).map(loc => {
    const isVehicle = loc.location.toLowerCase().includes('vehicle') || loc.location.toLowerCase().includes('van') || loc.location.toLowerCase().includes('truck');
    return `
      <div style="display:flex; justify-content:space-between; align-items:center; padding:12px 0; border-bottom:1px solid var(--border-color)">
        <div style="display:flex; align-items:center; gap:8px">
          <span class="material-icons-outlined" style="font-size:20px; color:var(--text-tertiary)">${isVehicle ? 'local_shipping' : 'warehouse'}</span>
          <span class="text-secondary" style="font-weight:500">${escapeHTML(loc.location)}</span>
        </div>
        <span style="font-weight:600; font-size:14px; color:var(--text-primary)">${loc.quantity} ${escapeHTML(item.unit || 'each')}s</span>
      </div>
    `;
  }).join('') || '<div class="text-tertiary" style="padding:12px 0">No stock in any location</div>';

  container.innerHTML = `
    ${renderDetailHeader({
      title: item.name,
      icon: 'inventory_2',
      iconBgColor: isLow ? 'var(--color-danger-bg)' : 'var(--color-success-bg)',
      iconTextColor: isLow ? 'var(--color-danger)' : 'var(--color-success)',
      metaHtml: `
        <span style="font-family:monospace">${item.sku}</span>
        <span class="badge badge-neutral">${item.category}</span>
        ${isLow ? '<span class="badge badge-danger">LOW STOCK</span>' : '<span class="badge badge-success">IN STOCK</span>'}
      `,
      actionsHtml: `
        <button class="btn btn-secondary" id="btn-edit-stock"><span class="material-icons-outlined">edit</span> Edit</button>
        <button class="btn btn-danger btn-icon" id="btn-delete-stock"><span class="material-icons-outlined">delete</span></button>
      `
    })}

    <div class="grid-3" style="margin-bottom:var(--space-lg)">
      <div class="stat-card">
        <div class="stat-label">Consolidated Stock</div>
        <div class="stat-value" style="color:${isLow ? 'var(--color-danger)' : 'var(--text-primary)'}">${totalQty}</div>
        <div class="text-sm text-secondary">Reorder at ${item.reorderLevel} ${item.unit}s</div>
      </div>
      <div class="stat-card">
        <div class="stat-label">Unit Price</div>
        <div class="stat-value">$${item.unitPrice.toFixed(2)}</div>
        <div class="text-sm text-secondary">Cost: $${item.costPrice.toFixed(2)}</div>
      </div>
      <div class="stat-card">
        <div class="stat-label">Profit Margin</div>
        <div class="stat-value">${margin}%</div>
        <div class="text-sm text-secondary">Stock Value (Cost): $${(totalQty * item.costPrice).toFixed(2)}</div>
      </div>
    </div>

    <div class="grid-2">
      <div style="display:flex; flex-direction:column; gap:20px">
        <div class="card">
          <div class="card-header"><h4>Location Stock Breakdown</h4></div>
          <div class="card-body" style="padding-top:0">
            ${locationsHtml}
          </div>
        </div>
        
        <div class="card">
          <div class="card-header"><h4>Item Details</h4></div>
          <div class="card-body">
            <div style="display:flex;flex-direction:column;gap:12px">
              ${r('Name', item.name)}
              ${r('SKU', item.sku)}
              ${r('Category', item.category)}
              ${r('Unit', item.unit)}
              ${r('Supplier', item.supplier)}
            </div>
          </div>
        </div>
      </div>

      <div class="card" style="height: fit-content;">
        <div class="card-header"><h4>Pricing & Value</h4></div>
        <div class="card-body">
          <div style="display:flex;flex-direction:column;gap:12px">
            ${r('Cost Price', `$${item.costPrice.toFixed(2)}`)}
            ${r('Sell Price', `$${item.unitPrice.toFixed(2)}`)}
            ${r('Margin', `${margin}%`)}
            ${r('Consolidated Value (Sell)', `$${(totalQty * item.unitPrice).toFixed(2)}`)}
            ${r('Consolidated Value (Cost)', `$${(totalQty * item.costPrice).toFixed(2)}`)}
          </div>
        </div>
      </div>
    </div>
  `;

  container.querySelector('#btn-edit-stock').addEventListener('click', () => router.navigate(`/stock/${id}/edit`));
  container.querySelector('#btn-delete-stock').addEventListener('click', () => {
    const content = document.createElement('div');
    content.innerHTML = `<p>Delete <strong>${escapeHTML(item.name)}</strong>?</p>`;
    showModal({
      title: 'Delete Stock Item', content,
      actions: [
        { label: 'Cancel', className: 'btn-secondary', onClick: (close) => close() },
        { label: 'Delete', className: 'btn-danger', onClick: (close) => { store.delete('stock', id); showToast('Item deleted', 'success'); close(); router.navigate('/stock'); }},
      ],
    });
  });
}

function r(label, value) {
  return `<div style="display:flex;gap:8px"><span style="width:180px;font-size:var(--font-size-sm);color:var(--text-tertiary);font-weight:500">${label}</span><span style="font-weight:600">${value}</span></div>`;
}
