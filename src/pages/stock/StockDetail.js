// ============================================
// RELAY — STOCK DETAIL PAGE
// ============================================

import { store } from '../../data/store.js';
import { router } from '../../router.js';
import { showModal } from '../../components/Modal.js';
import { escapeHTML } from '../../utils/security.js';
import { showToast } from '../../components/Notifications.js';
import { updateBreadcrumbDetail } from '../../components/Breadcrumb.js';
import { renderDetailHeader } from '../../components/DetailHeader.js';
import { xeroEnabled, getXeroStatusCached, fetchStockSyncJobs, xeroStockSyncState, retryStockSync, pushStockToXero } from '../../utils/xero.js';
import { entityLink } from '../../components/EntityLink.js';

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
          <span class="text-secondary" style="font-weight:400">${escapeHTML(loc.location)}</span>
        </div>
        <span style="font-weight:400; font-size:14px; color:var(--text-primary)">${loc.quantity} ${escapeHTML(item.unit || 'each')}s</span>
      </div>
    `;
  }).join('') || '<div class="text-tertiary" style="padding:12px 0">No stock in any location</div>';

  container.innerHTML = `
    ${renderDetailHeader({
      title: escapeHTML(item.name),
      icon: 'inventory_2',
      iconBgColor: isLow ? 'var(--color-danger-bg)' : 'var(--color-success-bg)',
      iconTextColor: isLow ? 'var(--color-danger)' : 'var(--color-success)',
      metaHtml: `
        <span style="font-family:var(--font-mono)">${escapeHTML(item.sku)}</span>
        <span class="badge badge-neutral">${escapeHTML(item.category)}</span>
        ${isLow ? '<span class="badge badge-danger">LOW STOCK</span>' : '<span class="badge badge-success">IN STOCK</span>'}
      `,
      actionsHtml: `
        <button class="btn btn-secondary" id="btn-edit-stock"><span class="material-icons-outlined">edit</span> Edit</button>
        <button class="btn btn-danger btn-icon" id="btn-delete-stock"><span class="material-icons-outlined">delete</span></button>
      `
    })}

    ${xeroEnabled() ? '<div id="xero-stock-row"></div>' : ''}

    <div class="grid-3" style="align-items: start;">
      <div style="grid-column: span 2; display:flex; flex-direction:column; gap:20px">
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
              ${r('Name', escapeHTML(item.name))}
              ${r('SKU', escapeHTML(item.sku))}
              ${r('Category', escapeHTML(item.category))}
              ${r('Unit', escapeHTML(item.unit))}
              ${r('Supplier', item.supplier ? entityLink({ kind: 'supplier', id: item.supplierId, name: item.supplier }) : '')}
            </div>
          </div>
        </div>

        ${(() => {
          const kits = store.getAll('kits') || [];
          const linkedKits = kits.filter(k => (k.items || []).some(ki => ki.stockId === id));
          if (linkedKits.length === 0) return '';
          return `
            <div class="card">
              <div class="card-header"><h4>Appears in Kits</h4></div>
              <div class="card-body" style="padding:0">
                ${linkedKits.map((k, idx) => {
                  const isLast = idx === linkedKits.length - 1;
                  return `
                    <div class="kit-link-row" data-kit-id="${k.id}" style="display:flex; justify-content:space-between; align-items:center; padding:14px var(--space-lg); ${isLast ? '' : 'border-bottom:1px solid var(--border-color);'} cursor:pointer; transition:background var(--transition-fast)">
                      <div style="display:flex; align-items:center; gap:12px">
                        <span class="material-icons-outlined kit-icon" style="font-size:20px; color:var(--text-tertiary); transition:color var(--transition-fast)">widgets</span>
                        <span class="kit-name font-medium" style="font-weight:400; color:var(--color-primary); transition:text-decoration var(--transition-fast)">${escapeHTML(k.name)}</span>
                        <span class="badge badge-neutral" style="font-size:10px">${escapeHTML(k.category || 'No type')}</span>
                      </div>
                      <span class="material-icons-outlined chevron-icon" style="font-size:18px; color:var(--text-tertiary); transition:transform var(--transition-fast), color var(--transition-fast)">chevron_right</span>
                    </div>
                  `;
                }).join('')}
              </div>
            </div>
          `;
        })()}
      </div>

      <div class="card" style="grid-column: span 1; height: fit-content;">
        <div class="card-header"><h4>Pricing & Value</h4></div>
        <div class="card-body">
          <div style="display:flex;flex-direction:column;gap:12px">
            ${r('Cost Price', `$${item.costPrice.toFixed(2)}`)}
            ${r('Sell Price', `$${item.unitPrice.toFixed(2)}`)}
            ${r('Margin', `${margin}%`)}
            ${r('Consolidated Value (Sell)', `$${(totalQty * item.unitPrice).toFixed(2)}`, { amount: true })}
            ${r('Consolidated Value (Cost)', `$${(totalQty * item.costPrice).toFixed(2)}`)}
          </div>
        </div>
      </div>
    </div>
  `;

  renderXeroRow();

  // Where this item stands with Xero: only shown once the company is known to
  // be connected. Filled after the page draws so a slow lookup never blocks it.
  async function renderXeroRow() {
    const el = container.querySelector('#xero-stock-row');
    if (!el) return;
    let jobs;
    try {
      const st = await getXeroStatusCached();
      if (!st?.connected) return;
      jobs = (await fetchStockSyncJobs()).get(String(item.id));
    } catch (_) {
      return; // the item works without it
    }
    if (!el.isConnected) return;
    const s = xeroStockSyncState(item, jobs);
    const synced = item.xeroSyncedAt ? new Date(item.xeroSyncedAt).toLocaleString('en-AU', { dateStyle: 'medium', timeStyle: 'short' }) : '';
    const bits = [
      s.detail,
      s.state === 'synced' || s.state === 'warning' ? (synced ? `Last synced ${synced}.` : '') : '',
    ].filter(Boolean);
    el.innerHTML = `
      <div class="card" style="margin-bottom:var(--space-lg);">
        <div class="card-body" style="display:flex;align-items:center;gap:12px;flex-wrap:wrap;padding:10px 16px;">
          <span class="material-icons-outlined" style="color:${s.tone === 'neutral' ? 'var(--text-secondary)' : `var(--color-${s.tone})`};" aria-hidden="true">${s.icon}</span>
          <div style="flex:1;min-width:200px;">
            <div style="font-weight:600;">Xero: ${escapeHTML(s.label)}</div>
            ${bits.length ? `<div style="color:var(--text-tertiary);font-size:12px;">${escapeHTML(bits.join(' '))}</div>` : ''}
          </div>
          ${s.state === 'error' && jobs?.failed?.length ? `<button class="btn btn-secondary btn-sm" id="btn-xero-retry"><span class="material-icons-outlined" aria-hidden="true">replay</span> Retry</button>` : ''}
          ${s.state === 'missing' ? `<button class="btn btn-secondary btn-sm" id="btn-xero-send"><span class="material-icons-outlined" aria-hidden="true">sync</span> Send to Xero</button>` : ''}
        </div>
      </div>`;
    el.querySelector('#btn-xero-retry')?.addEventListener('click', async (e) => {
      const btn = e.currentTarget;
      btn.disabled = true;
      try {
        const n = await retryStockSync(item.id);
        showToast(n ? 'Queued to sync to Xero again.' : 'Nothing to retry.', 'info');
        renderXeroRow();
      } catch (err) {
        showToast(err.message || 'Could not retry', 'error');
        btn.disabled = false;
      }
    });
    el.querySelector('#btn-xero-send')?.addEventListener('click', async (e) => {
      const btn = e.currentTarget;
      btn.disabled = true;
      try {
        await pushStockToXero([item.id]);
        showToast('Queued for Xero.', 'success');
        renderXeroRow();
      } catch (err) {
        showToast(err.message || 'Could not send to Xero', 'error');
        btn.disabled = false;
      }
    });
  }

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

  container.querySelectorAll('.kit-link-row').forEach(row => {
    const kitName = row.querySelector('.kit-name');
    const chevronIcon = row.querySelector('.chevron-icon');
    const kitIcon = row.querySelector('.kit-icon');
    
    row.addEventListener('mouseenter', () => {
      row.style.background = 'var(--color-primary-light, rgba(255, 92, 0, 0.04))';
      if (kitName) kitName.style.textDecoration = 'underline';
      if (chevronIcon) {
        chevronIcon.style.color = 'var(--color-primary)';
        chevronIcon.style.transform = 'translateX(4px)';
      }
      if (kitIcon) {
        kitIcon.style.color = 'var(--color-primary)';
      }
    });
    
    row.addEventListener('mouseleave', () => {
      row.style.background = '';
      if (kitName) kitName.style.textDecoration = 'none';
      if (chevronIcon) {
        chevronIcon.style.color = 'var(--text-tertiary)';
        chevronIcon.style.transform = 'none';
      }
      if (kitIcon) {
        kitIcon.style.color = 'var(--text-tertiary)';
      }
    });
    
    row.addEventListener('click', () => {
      router.navigate(`/kits/${row.dataset.kitId}`);
    });
  });
}

function r(label, value, opts = {}) {
  return `
    <div class="detail-row">
      <span class="detail-row-label">${label}</span>
      <span class="detail-row-value${opts.amount ? ' detail-row-value--amount' : ''}">${value || '—'}</span>
    </div>`;
}
