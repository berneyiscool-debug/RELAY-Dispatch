// ============================================
// SIMPRO CLONE — LEADS LIST PAGE
// ============================================

import { store } from '../../data/store.js';
import { createDataTable } from '../../components/DataTable.js';
import { router } from '../../router.js';
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
