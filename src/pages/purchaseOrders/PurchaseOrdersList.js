// ============================================
// SIMPRO CLONE — PURCHASE ORDERS LIST PAGE
// ============================================

import { store } from '../../data/store.js';
import { createDataTable } from '../../components/DataTable.js';
import { router } from '../../router.js';
import { createBulkActionBar } from '../../components/BulkActionBar.js';
import { escapeHTML } from '../../utils/security.js';
import { showPurchaseOrderDrawer } from '../../utils/quickModals.js';

export function renderPurchaseOrdersList(container) {
  const pos = store.getAll('purchaseOrders');

  container.innerHTML = `
    <div class="page-header">
      <h1>Purchase Orders</h1>
      <div class="page-header-actions">
        <button class="btn btn-primary" id="btn-new-po"><span class="material-icons-outlined">add</span> New PO</button>
      </div>
    </div>
    <div class="page-toolbar">
      <div class="toolbar-filters">
        <button class="toolbar-filter active" data-filter="all">All (${pos.length})</button>
        ${['Draft', 'Issued', 'Received', 'Cancelled'].map(status =>
          `<button class="toolbar-filter" data-filter="${status}">${status}</button>`
        ).join('')}
      </div>
      <div class="toolbar-search">
        <span class="material-icons-outlined">search</span>
        <input type="text" placeholder="Search POs..." id="po-search" />
      </div>
    </div>
    <div id="po-table-container"></div>
  `;

  let filteredData = [...pos];

  const columns = [
    { key: 'number', label: 'PO Number', render: (r) => `<span class="cell-link font-medium">${escapeHTML(r.number)}</span>`, width: '120px' },
    { key: 'supplier', label: 'Supplier', render: (r) => `<span class="text-secondary">${escapeHTML(r.supplierName || '—')}</span>` },
    { key: 'job', label: 'Job Ref', render: (r) => r.jobId ? `<a href="#/jobs/${r.jobId}" class="cell-link">${escapeHTML(r.jobNumber)}</a>` : '<span class="text-secondary">—</span>' },
    { key: 'date', label: 'Issue Date', render: (r) => r.issueDate ? new Date(r.issueDate).toLocaleDateString() : '—', width: '120px' },
    { key: 'total', label: 'Total', render: (r) => `$${(r.total || 0).toFixed(2)}`, width: '100px' },
    { key: 'status', label: 'Status', render: (r) => {
      const b = { 'Draft':'badge-draft', 'Issued':'badge-primary', 'Received':'badge-success', 'Cancelled':'badge-danger' };
      return `<span class="badge ${b[r.status] || 'badge-neutral'}">${escapeHTML(r.status)}</span>`;
    }, width: '110px' }
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

  container.querySelectorAll('.toolbar-filter').forEach(btn => {
    btn.addEventListener('click', () => {
      container.querySelectorAll('.toolbar-filter').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      const f = btn.dataset.filter;
      filteredData = f === 'all' ? [...pos] : pos.filter(p => p.status === f);
      table.updateData(filteredData);
    });
  });

  container.querySelector('#po-search').addEventListener('input', (e) => {
    const q = e.target.value.toLowerCase();
    filteredData = pos.filter(p => 
      p.number?.toLowerCase().includes(q) || 
      p.supplierName?.toLowerCase().includes(q) ||
      p.jobNumber?.toLowerCase().includes(q)
    );
    table.updateData(filteredData);
  });
}
