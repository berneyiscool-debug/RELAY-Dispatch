// ============================================
// SIMPRO CLONE — LEADS LIST PAGE
// ============================================

import { store } from '../../data/store.js';
import { createDataTable } from '../../components/DataTable.js';
import { router } from '../../router.js';
import { createBulkActionBar } from '../../components/BulkActionBar.js';
import { escapeHTML } from '../../utils/security.js';

export function renderLeadsList(container) {
  const leads = store.getAll('leads');

  container.innerHTML = `
    <div class="page-header">
      <h1>Leads</h1>
      <div class="page-header-actions">
        <button class="btn btn-primary" id="btn-new-lead">
          <span class="material-icons-outlined">add</span> New Lead
        </button>
      </div>
    </div>
    <div class="page-toolbar">
      <div class="toolbar-filters">
        <button class="toolbar-filter active" data-filter="all">All (${leads.length})</button>
        <button class="toolbar-filter" data-filter="New">New</button>
        <button class="toolbar-filter" data-filter="Contacted">Contacted</button>
        <button class="toolbar-filter" data-filter="Qualified">Qualified</button>
        <button class="toolbar-filter" data-filter="Won">Won</button>
        <button class="toolbar-filter" data-filter="Lost">Lost</button>
      </div>
      <div class="toolbar-search">
        <span class="material-icons-outlined">search</span>
        <input type="text" placeholder="Search leads..." id="leads-search" />
      </div>
    </div>
    <div id="leads-table-container"></div>
  `;

  let filteredData = [...leads];

  const statusBadges = {
    'New': 'badge-info', 'Contacted': 'badge-primary', 'Qualified': 'badge-warning',
    'Proposal': 'badge-warning', 'Negotiation': 'badge-primary', 'Won': 'badge-success', 'Lost': 'badge-danger',
  };
  const priorityBadges = { 'Low': 'badge-neutral', 'Medium': 'badge-warning', 'High': 'badge-danger' };

  const columns = [
    { key: 'title', label: 'Lead', render: (r) => `<span class="cell-link font-medium">${escapeHTML(r.title)}</span>` },
    { key: 'customerName', label: 'Customer', render: (r) => `<span class="text-secondary">${escapeHTML(r.customerName)}</span>` },
    { key: 'source', label: 'Source', render: (r) => `<span class="text-secondary">${escapeHTML(r.source)}</span>` },
    { key: 'status', label: 'Status', render: (r) => `<span class="badge ${statusBadges[r.status] || 'badge-neutral'}">${escapeHTML(r.status)}</span>` },
    { key: 'priority', label: 'Priority', render: (r) => `<span class="badge ${priorityBadges[r.priority] || 'badge-neutral'}">${escapeHTML(r.priority)}</span>` },
    { key: 'value', label: 'Value', render: (r) => `<span class="font-medium">$${(r.value || 0).toLocaleString()}</span>`, getValue: (r) => r.value },
    { key: 'createdAt', label: 'Created', render: (r) => `<span class="text-secondary">${new Date(r.createdAt).toLocaleDateString()}</span>`, getValue: (r) => new Date(r.createdAt).getTime() },
  ];

  const table = createDataTable({
    columns, data: filteredData,
    onRowClick: (id) => router.navigate(`/leads/${id}`),
    emptyMessage: 'No leads found', emptyIcon: 'trending_up',
    selectable: true,
    onSelectionChange: (selectedIds) => {
      createBulkActionBar({
        container,
        selectedIds,
        onClear: () => table.clearSelection(),
        actions: [
          {
            label: 'Change Status',
            icon: 'sync_alt',
            onClick: (ids) => {
              const content = document.createElement('div');
              content.innerHTML = `
                <div class="form-group">
                  <label class="form-label">New Status</label>
                  <select class="form-select" id="bulk-status">
                    <option value="New">New</option>
                    <option value="Contacted">Contacted</option>
                    <option value="Qualified">Qualified</option>
                    <option value="Won">Won</option>
                    <option value="Lost">Lost</option>
                  </select>
                </div>
              `;
              import('../../components/Modal.js').then(({ showModal }) => {
                showModal({
                  title: `Update ${ids.length} Leads`,
                  content,
                  actions: [
                    { label: 'Cancel', className: 'btn-secondary', onClick: c => c() },
                    { label: 'Apply', className: 'btn-primary', onClick: c => {
                      const newStatus = content.querySelector('#bulk-status').value;
                      ids.forEach(id => store.update('leads', id, { status: newStatus }));
                      table.clearSelection();
                      renderLeadsList(container);
                      import('../../components/Notifications.js').then(({ showToast }) => showToast(`Updated ${ids.length} leads to ${newStatus}`, 'success'));
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
                content.innerHTML = `<p>Are you sure you want to delete ${ids.length} leads? This action cannot be undone.</p>`;
                showModal({
                  title: 'Confirm Bulk Delete',
                  content,
                  actions: [
                    { label: 'Cancel', className: 'btn-secondary', onClick: c => c() },
                    { label: 'Delete', className: 'btn-danger', onClick: c => {
                      ids.forEach(id => store.delete('leads', id));
                      table.clearSelection();
                      renderLeadsList(container);
                      import('../../components/Notifications.js').then(({ showToast }) => showToast(`Deleted ${ids.length} leads`, 'success'));
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

  container.querySelector('#leads-table-container').appendChild(table);
  container.querySelector('#btn-new-lead').addEventListener('click', () => router.navigate('/leads/new'));

  container.querySelectorAll('.toolbar-filter').forEach(btn => {
    btn.addEventListener('click', () => {
      container.querySelectorAll('.toolbar-filter').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      const f = btn.dataset.filter;
      filteredData = f === 'all' ? [...leads] : leads.filter(l => l.status === f);
      table.updateData(filteredData);
    });
  });

  container.querySelector('#leads-search').addEventListener('input', (e) => {
    const q = e.target.value.toLowerCase();
    filteredData = leads.filter(l => l.title.toLowerCase().includes(q) || l.customerName.toLowerCase().includes(q));
    table.updateData(filteredData);
  });
}
