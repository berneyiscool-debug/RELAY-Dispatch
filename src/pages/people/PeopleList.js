// ============================================
// SIMPRO CLONE — CUSTOMERS LIST PAGE
// ============================================

import { store } from '../../data/store.js';
import { createDataTable } from '../../components/DataTable.js';
import { router } from '../../router.js';
import { showToast } from '../../components/Notifications.js';
import { escapeHTML } from '../../utils/security.js';

export function renderPeopleList(container) {
  const customers = store.getAll('customers');

  container.innerHTML = `
    <div class="page-header">
      <h1>Customers</h1>
      <div class="page-header-actions">
        <button class="btn btn-secondary" id="btn-export-people">
          <span class="material-icons-outlined">download</span> Export
        </button>
        <button class="btn btn-primary" id="btn-new-person">
          <span class="material-icons-outlined">add</span> New Customer
        </button>
      </div>
    </div>
    <div class="page-toolbar">
      <div class="toolbar-filters">
        <button class="toolbar-filter active" data-filter="all">All (${customers.length})</button>
        <button class="toolbar-filter" data-filter="Active">Active (${customers.filter(c => c.status === 'Active').length})</button>
        <button class="toolbar-filter" data-filter="Inactive">Inactive (${customers.filter(c => c.status === 'Inactive').length})</button>
      </div>
      <div class="toolbar-search">
        <span class="material-icons-outlined">search</span>
        <input type="text" placeholder="Search customers..." id="people-search" />
      </div>
    </div>
    <div id="people-table-container"></div>
  `;

  let filteredData = [...customers];

  const columns = [
    {
      key: 'company',
      label: 'Company / Name',
      render: (row) => `<span class="cell-link font-medium">${escapeHTML(row.company)}</span>`,
    },
    {
      key: 'contact',
      label: 'Contact',
      render: (row) => `${escapeHTML(row.firstName)} ${escapeHTML(row.lastName)}`,
    },
    {
      key: 'email',
      label: 'Email',
      render: (row) => `<span class="text-secondary">${escapeHTML(row.email)}</span>`,
    },
    {
      key: 'phone',
      label: 'Phone',
      render: (row) => `<span class="text-secondary">${escapeHTML(row.phone)}</span>`,
    },
    {
      key: 'type',
      label: 'Type',
      render: (row) => `<span class="badge badge-neutral">${escapeHTML(row.type)}</span>`,
    },
    {
      key: 'status',
      label: 'Status',
      render: (row) => `<span class="badge ${row.status === 'Active' ? 'badge-success' : 'badge-neutral'}">${escapeHTML(row.status)}</span>`,
    },
  ];

  const table = createDataTable({
    columns,
    data: filteredData,
    onRowClick: (id) => router.navigate(`/people/${id}`),
    emptyMessage: 'No customers found',
    emptyIcon: 'people',
  });

  container.querySelector('#people-table-container').appendChild(table);

  // New customer
  container.querySelector('#btn-new-person').addEventListener('click', () => {
    router.navigate('/people/new');
  });

  // Export
  container.querySelector('#btn-export-people').addEventListener('click', () => {
    showToast('Customer data exported successfully', 'success');
  });

  // Filters
  container.querySelectorAll('.toolbar-filter').forEach(btn => {
    btn.addEventListener('click', () => {
      container.querySelectorAll('.toolbar-filter').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      const filter = btn.dataset.filter;
      filteredData = filter === 'all' ? [...customers] : customers.filter(c => c.status === filter);
      table.updateData(filteredData);
    });
  });

  // Search
  container.querySelector('#people-search').addEventListener('input', (e) => {
    const q = e.target.value.toLowerCase();
    filteredData = customers.filter(c =>
      c.company.toLowerCase().includes(q) ||
      `${c.firstName} ${c.lastName}`.toLowerCase().includes(q) ||
      c.email.toLowerCase().includes(q)
    );
    const activeFilter = container.querySelector('.toolbar-filter.active')?.dataset.filter;
    if (activeFilter && activeFilter !== 'all') {
      filteredData = filteredData.filter(c => c.status === activeFilter);
    }
    table.updateData(filteredData);
  });
}
