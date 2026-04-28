// ============================================
// SIMPRO CLONE — STOCK DETAIL PAGE
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
  const isLow = item.quantity <= item.reorderLevel;
  const margin = item.unitPrice > 0 ? ((item.unitPrice - item.costPrice) / item.unitPrice * 100).toFixed(1) : 0;

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
        <div class="stat-label">Current Stock</div>
        <div class="stat-value" style="color:${isLow ? 'var(--color-danger)' : 'var(--text-primary)'}">${item.quantity}</div>
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
        <div class="text-sm text-secondary">Stock value: $${(item.quantity * item.costPrice).toFixed(2)}</div>
      </div>
    </div>

    <div class="grid-2">
      <div class="card">
        <div class="card-header"><h4>Item Details</h4></div>
        <div class="card-body">
          <div style="display:flex;flex-direction:column;gap:12px">
            ${r('Name', item.name)}
            ${r('SKU', item.sku)}
            ${r('Category', item.category)}
            ${r('Unit', item.unit)}
            ${r('Supplier', item.supplier)}
            ${r('Location', item.location)}
          </div>
        </div>
      </div>
      <div class="card">
        <div class="card-header"><h4>Pricing</h4></div>
        <div class="card-body">
          <div style="display:flex;flex-direction:column;gap:12px">
            ${r('Cost Price', `$${item.costPrice.toFixed(2)}`)}
            ${r('Sell Price', `$${item.unitPrice.toFixed(2)}`)}
            ${r('Margin', `${margin}%`)}
            ${r('Total Value', `$${(item.quantity * item.unitPrice).toFixed(2)}`)}
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
  return `<div style="display:flex;gap:8px"><span style="width:100px;font-size:var(--font-size-sm);color:var(--text-tertiary);font-weight:500">${label}</span><span>${value}</span></div>`;
}
