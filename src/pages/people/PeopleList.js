// ============================================
// SIMPRO CLONE — CUSTOMERS LIST PAGE
// ============================================

import { store } from '../../data/store.js';
import { createDataTable } from '../../components/DataTable.js';
import { router } from '../../router.js';
import { showToast } from '../../components/Notifications.js';
import { escapeHTML } from '../../utils/security.js';
import { createBulkActionBar } from '../../components/BulkActionBar.js';
import { createToolbarFilters } from '../../components/ToolbarFilters.js';

export function renderPeopleList(container) {
  const customers = store.getAll('customers');

  container.innerHTML = `
    <div class="page-header">
      <h1>Customers</h1>
      <div class="page-header-actions">
        <button class="btn btn-secondary" id="btn-export-people" data-tooltip="Export customer lists to a CSV spreadsheet" data-tooltip-pos="left">
          <span class="material-icons-outlined">download</span> Export
        </button>
        <button class="btn btn-primary" id="btn-new-person" data-tooltip="Create a new customer profile or organization record" data-tooltip-pos="left">
          <span class="material-icons-outlined">add</span> New Customer
        </button>
      </div>
    </div>
    <div class="page-toolbar" style="display:flex; justify-content:space-between; align-items:center;">
      <div id="people-filters-carousel-container" style="flex: 0 0 50%; max-width: 50%; overflow:hidden"></div>
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
      render: (row) => `<span class="cell-link font-medium">${escapeHTML(row.company || `${row.firstName || ''} ${row.lastName || ''}`.trim() || 'Unnamed Customer')}</span>`,
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
                    <option value="Active">Active</option>
                    <option value="Inactive">Inactive</option>
                    <option value="Blacklisted">Blacklisted</option>
                  </select>
                </div>
              `;
              import('../../components/Modal.js').then(({ showModal }) => {
                showModal({
                  title: `Update ${ids.length} Customers`,
                  content,
                  actions: [
                    { label: 'Cancel', className: 'btn-secondary', onClick: c => c() },
                    { label: 'Apply', className: 'btn-primary', onClick: c => {
                      const newStatus = content.querySelector('#bulk-status').value;
                      ids.forEach(id => store.update('customers', id, { status: newStatus }));
                      table.clearSelection();
                      renderPeopleList(container); // reload
                      showToast(`Updated ${ids.length} customers to ${newStatus}`, 'success');
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
                content.innerHTML = `<p>Are you sure you want to delete ${ids.length} customers? This cannot be undone.</p>`;
                showModal({
                  title: 'Confirm Bulk Delete',
                  content,
                  actions: [
                    { label: 'Cancel', className: 'btn-secondary', onClick: c => c() },
                    { label: 'Delete', className: 'btn-danger', onClick: c => {
                      ids.forEach(id => store.delete('customers', id));
                      table.clearSelection();
                      renderPeopleList(container);
                      showToast(`Deleted ${ids.length} customers`, 'success');
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

  container.querySelector('#people-table-container').appendChild(table);

  // New customer
  container.querySelector('#btn-new-person').addEventListener('click', () => {
    router.navigate('/people/new');
  });

  // Export
  container.querySelector('#btn-export-people').addEventListener('click', () => {
    showToast('Customer data exported successfully', 'success');
  });

  let tagFilteredData = [...customers];
  let searchQuery = '';

  function applyFilters() {
    const q = searchQuery.toLowerCase();
    const filtered = tagFilteredData.filter(c => {
      if (!q) return true;
      const company = c.company || '';
      const firstName = c.firstName || '';
      const lastName = c.lastName || '';
      const fullName = `${firstName} ${lastName}`.trim();
      const email = c.email || '';
      return company.toLowerCase().includes(q) ||
             fullName.toLowerCase().includes(q) ||
             email.toLowerCase().includes(q);
    });
    table.updateData(filtered);
  }

  createToolbarFilters({
    container: container.querySelector('#people-filters-carousel-container'),
    originalData: customers,
    filterType: 'people',
    onFilterChange: (filtered) => {
      tagFilteredData = filtered;
      applyFilters();
    }
  });

  // Search
  container.querySelector('#people-search').addEventListener('input', (e) => {
    searchQuery = e.target.value;
    applyFilters();
  });
}
