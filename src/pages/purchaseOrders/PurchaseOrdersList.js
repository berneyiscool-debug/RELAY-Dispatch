// ============================================
// SIMPRO CLONE — PURCHASE ORDERS LIST PAGE
// ============================================

import { store } from '../../data/store.js';
import { createDataTable } from '../../components/DataTable.js';
import { router } from '../../router.js';
import { createBulkActionBar } from '../../components/BulkActionBar.js';
import { escapeHTML } from '../../utils/security.js';
import { showPurchaseOrderDrawer } from '../../utils/quickModals.js';
import { setListSearch } from '../../utils/listSearch.js';
import { createDateRangeFilter } from '../../utils/dateRangeFilter.js';

export function renderPurchaseOrdersList(container) {
  const pos = store.getAll('purchaseOrders');

  container.innerHTML = `
    <div class="page-header" style="margin-bottom:8px; display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:8px;">
      <h1>Purchase Orders</h1>
      <div class="page-header-actions" style="display:flex; align-items:center; gap:6px; flex-wrap:wrap;">
        <div id="date-range-mount" style="display:inline-flex; align-items:center;"></div>
        <select id="filter-status-select" class="form-select" style="height:25px; font-size:11px; padding:0 18px 0 8px; width:145px; margin:0; align-self:center;">
          <option value="all">All Statuses (${pos.length})</option>
          ${['Draft','Issued','Received','Cancelled'].map(s => `<option value="${s}">${s} (${pos.filter(p => p.status === s).length})</option>`).join('')}
        </select>
        <button class="btn btn-primary btn-sm" id="btn-new-po" style="height:25px; font-size:11px; padding:0 10px; display:inline-flex; align-items:center; gap:4px; margin:0; align-self:center;" data-tooltip="Draft a new purchase order" data-tooltip-pos="left">
          <span class="material-icons-outlined" style="font-size:13px;">add</span> <span class="btn-label">New PO</span>
        </button>
      </div>
    </div>
    <div id="po-table-container"></div>
  `;

  let filteredData = [...pos];

  const columns = [
    { key: 'number', label: 'PO #', render: (r) => `<span class="cell-link font-medium">${escapeHTML(r.number)}</span>`, width: '13%' },
    { key: 'supplier', label: 'Supplier', render: (r) => `<span class="text-secondary">${escapeHTML(r.supplierName || '—')}</span>`, width: '28%' },
    { key: 'job', label: 'Job Ref', render: (r) => r.jobId ? `<a href="#/jobs/${r.jobId}" class="cell-link">${escapeHTML(r.jobNumber)}</a>` : '<span class="text-secondary">—</span>', width: '22%' },
    { key: 'total', label: 'Total', render: (r) => `$${(r.total || 0).toFixed(2)}`, width: '12%' },
    { key: 'status', label: 'Status', render: (r) => {
      const b = { 'Draft':'badge-draft', 'Issued':'badge-primary', 'Received':'badge-success', 'Cancelled':'badge-danger' };
      return `<span class="badge ${b[r.status] || 'badge-neutral'}">${escapeHTML(r.status)}</span>`;
    }, width: '11%' },
    { key: 'date', label: 'Date', render: (r) => r.issueDate ? new Date(r.issueDate).toLocaleDateString('en-AU') : '—', width: '14%' }
  ];

  const table = createDataTable({ 
    columns, 
    data: filteredData, 
    onRowClick: (id) => showPurchaseOrderDrawer({ 
      id, 
      onSave: () => renderPurchaseOrdersList(container) 
    }), 
    emptyMessage: 'No purchase orders found', 
    emptyIcon: 'shopping_cart',
    selectable: true,
    onSelectionChange: (selectedIds) => {
      createBulkActionBar({
        container,
        selectedIds,
        onClear: () => table.clearSelection(),
        actions: [
          {
            label: 'Mark Received',
            icon: 'inventory',
            onClick: (ids) => {
              ids.forEach(id => store.update('purchaseOrders', id, { status: 'Received', receivedDate: new Date().toISOString() }));
              table.clearSelection();
              renderPurchaseOrdersList(container);
              import('../../components/Notifications.js').then(({ showToast }) => showToast(`Marked ${ids.length} POs as Received`, 'success'));
            }
          },
          {
            label: 'Change Status',
            icon: 'sync_alt',
            onClick: (ids) => {
              const content = document.createElement('div');
              content.innerHTML = `
                <div class="form-group">
                  <label class="form-label">New Status</label>
                  <select class="form-select" id="bulk-status">
                    <option value="Draft">Draft</option>
                    <option value="Issued">Issued</option>
                    <option value="Received">Received</option>
                    <option value="Cancelled">Cancelled</option>
                  </select>
                </div>
              `;
              import('../../components/Modal.js').then(({ showModal }) => {
                showModal({
                  title: `Update ${ids.length} Purchase Orders`,
                  content,
                  actions: [
                    { label: 'Cancel', className: 'btn-secondary', onClick: c => c() },
                    { label: 'Apply', className: 'btn-primary', onClick: c => {
                      const newStatus = content.querySelector('#bulk-status').value;
                      ids.forEach(id => store.update('purchaseOrders', id, { status: newStatus }));
                      table.clearSelection();
                      renderPurchaseOrdersList(container);
                      import('../../components/Notifications.js').then(({ showToast }) => showToast(`Updated ${ids.length} POs to ${newStatus}`, 'success'));
                      c();
                    }}
                  ]
                });
              });
            }
          },
          {
            label: 'Delete Selected',
            icon: 'delete',
            className: 'btn-danger',
            onClick: (ids) => {
              import('../../components/Modal.js').then(({ showModal }) => {
                const content = document.createElement('div');
                content.innerHTML = `<p>Are you sure you want to delete ${ids.length} purchase orders? This action cannot be undone.</p>`;
                showModal({
                  title: 'Confirm Bulk Delete',
                  content,
                  actions: [
                    { label: 'Cancel', className: 'btn-secondary', onClick: c => c() },
                    { label: 'Delete', className: 'btn-danger', onClick: c => {
                      ids.forEach(id => store.delete('purchaseOrders', id));
                      table.clearSelection();
                      renderPurchaseOrdersList(container);
                      import('../../components/Notifications.js').then(({ showToast }) => showToast(`Deleted ${ids.length} purchase orders`, 'success'));
                      c();
                    }}
                  ]
                });
              });
            }
          }
        ]
      });
    }
  });
  
  container.querySelector('#po-table-container').appendChild(table);
  container.querySelector('#btn-new-po').addEventListener('click', () => {
    showPurchaseOrderDrawer({
      onSave: () => renderPurchaseOrdersList(container)
    });
  });

  let activeStatusFilter = 'all';
  let searchQuery = '';
  let filterStartDate = '';
  let filterEndDate = '';

  function applyFilters() {
    let filtered = [...pos];
    if (activeStatusFilter !== 'all') {
      filtered = filtered.filter(p => p.status === activeStatusFilter);
    }
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      filtered = filtered.filter(p => 
        (p.number || '').toLowerCase().includes(q) || 
        (p.supplierName || '').toLowerCase().includes(q) ||
        (p.jobNumber || '').toLowerCase().includes(q)
      );
    }
    if (filterStartDate || filterEndDate) {
      filtered = filtered.filter(p => {
        const dateVal = p.issueDate || p.createdAt || '';
        const pDateStr = dateVal ? dateVal.split('T')[0] : '';
        if (filterStartDate && pDateStr < filterStartDate) return false;
        if (filterEndDate && pDateStr > filterEndDate) return false;
        return true;
      });
    }
    table.updateData(filtered);
  }

  createDateRangeFilter({
    container: container.querySelector('#date-range-mount'),
    onChange: (start, end) => {
      filterStartDate = start;
      filterEndDate = end;
      applyFilters();
    }
  });

  setListSearch('Search POs...', (q) => {
    searchQuery = q;
    applyFilters();
  });

  container.querySelector('#filter-status-select')?.addEventListener('change', (e) => {
    activeStatusFilter = e.target.value;
    applyFilters();
  });
}
