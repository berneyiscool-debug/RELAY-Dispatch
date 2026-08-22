// ============================================
// SIMPRO CLONE — CONTRACTORS LIST PAGE
// ============================================

import { store } from '../../data/store.js';
import { createDataTable } from '../../components/DataTable.js';
import { router } from '../../router.js';
import { createBulkActionBar } from '../../components/BulkActionBar.js';
import { escapeHTML } from '../../utils/security.js';
import { getContractorCompliance } from '../../utils/compliance.js';
import { setListSearch } from '../../utils/listSearch.js';
import { createDateRangeFilter } from '../../utils/dateRangeFilter.js';

export function renderContractorsList(container) {
  const contractors = store.getAll('contractors');

  container.innerHTML = `
    <div class="page-header" style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:8px;">
      <h1>Contractors</h1>
      <div class="page-header-actions" style="display:flex; align-items:center; gap:6px; flex-wrap:wrap;">
        <div id="date-range-mount" style="display:inline-flex; align-items:center;"></div>
        <select id="filter-status-select" class="form-select" style="height:25px; font-size:11px; padding:0 18px 0 8px; width:145px; margin:0; align-self:center;">
          <option value="all">All Contractors (${contractors.length})</option>
          <option value="active">Active (${contractors.filter(c => c.active === true).length})</option>
          <option value="inactive">Inactive (${contractors.filter(c => c.active === false).length})</option>
          <option value="compliant">Compliant (${contractors.filter(c => getContractorCompliance(c).status === 'compliant').length})</option>
          <option value="non-compliant">Non-Compliant (${contractors.filter(c => getContractorCompliance(c).status !== 'compliant').length})</option>
        </select>
        <button class="btn btn-primary btn-sm" id="btn-new-contractor" style="height:25px; font-size:11px; padding:0 10px; display:inline-flex; align-items:center; gap:4px; margin:0; align-self:center;" data-tooltip="Onboard a new subcontractor technician">
          <span class="material-icons-outlined" style="font-size:13px;">add</span> <span class="btn-label">Add Contractor</span>
        </button>
      </div>
    </div>
    <div id="contractors-table-container"></div>
  `;

  let filteredData = [...contractors];

  const columns = [
    { key: 'businessName', label: 'Business', render: (r) => `<span class="cell-link font-medium">${escapeHTML(r.businessName)}</span>`, width: '24%' },
    { key: 'contactName', label: 'Contact', width: '19%' },
    { key: 'email', label: 'Email', render: (r) => escapeHTML(r.email || '—'), width: '22%' },
    { key: 'phone', label: 'Phone', render: (r) => escapeHTML(r.phone || '—'), width: '13%' },
    { 
      key: 'compliance', 
      label: 'Compliance', 
      render: (r) => {
        const comp = getContractorCompliance(r);
        const tooltipText = comp.reason ? comp.reason : comp.label;
        return `<span class="badge ${comp.badgeClass}" data-tooltip="${escapeHTML(tooltipText)}" style="cursor:help">${escapeHTML(comp.label)}</span>`;
      }, width: '12%'
    },
    { key: 'active', label: 'Status', render: (r) => `<span class="badge ${r.active ? 'badge-success' : 'badge-neutral'}">${r.active ? 'Active' : 'Inactive'}</span>`, width: '10%' }
  ];

  const table = createDataTable({ 
    columns, 
    data: filteredData, 
    onRowClick: (id) => router.navigate(`/contractors/${id}`), 
    emptyMessage: 'No contractors found', 
    emptyIcon: 'engineering',
    selectable: true,
    onSelectionChange: (selectedIds) => {
      createBulkActionBar({
        container,
        selectedIds,
        onClear: () => table.clearSelection(),
        actions: [
          {
            label: 'Activate',
            icon: 'check_circle',
            onClick: (ids) => {
              ids.forEach(id => store.update('contractors', id, { active: true }));
              table.clearSelection();
              renderContractorsList(container);
              import('../../components/Notifications.js').then(({ showToast }) => showToast(`Activated ${ids.length} contractors`, 'success'));
            }
          },
          {
            label: 'Deactivate',
            icon: 'block',
            onClick: (ids) => {
              ids.forEach(id => store.update('contractors', id, { active: false }));
              table.clearSelection();
              renderContractorsList(container);
              import('../../components/Notifications.js').then(({ showToast }) => showToast(`Deactivated ${ids.length} contractors`, 'warning'));
            }
          },
          {
            label: 'Delete Selected',
            icon: 'delete',
            className: 'btn-danger',
            onClick: (ids) => {
              import('../../components/Modal.js').then(({ showModal }) => {
                const content = document.createElement('div');
                content.innerHTML = `<p>Are you sure you want to delete ${ids.length} contractors? This action cannot be undone.</p>`;
                showModal({
                  title: 'Confirm Bulk Delete',
                  content,
                  actions: [
                    { label: 'Cancel', className: 'btn-secondary', onClick: c => c() },
                    { label: 'Delete', className: 'btn-danger', onClick: c => {
                      ids.forEach(id => store.delete('contractors', id));
                      table.clearSelection();
                      renderContractorsList(container);
                      import('../../components/Notifications.js').then(({ showToast }) => showToast(`Deleted ${ids.length} contractors`, 'success'));
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
  
  container.querySelector('#contractors-table-container').appendChild(table);
  
  container.querySelector('#btn-new-contractor').addEventListener('click', () => router.navigate('/contractors/new'));
  container.querySelector('#filter-sort-select')?.addEventListener('change', (e) => {
    const val = e.target.value;
    const [key, dir] = val.split('_');
    table.setSort(key, dir);
  });

  let activeFilter = 'all';
  let searchTerm = '';

  function updateFilteredData() {
    let result = [...contractors];

    // Apply filter status
    if (activeFilter === 'active') {
      result = result.filter(c => c.active === true);
    } else if (activeFilter === 'inactive') {
      result = result.filter(c => c.active === false);
    } else if (activeFilter === 'compliant') {
      result = result.filter(c => getContractorCompliance(c).status === 'compliant');
    } else if (activeFilter === 'non-compliant') {
      result = result.filter(c => getContractorCompliance(c).status === 'non-compliant' || getContractorCompliance(c).status === 'warning');
    }

    // Apply search term
    if (searchTerm) {
      result = result.filter(c => {
        const bName = c.businessName || '';
        const cName = c.contactName || '';
        const email = c.email || '';
        const specs = c.specialties || [];
        return bName.toLowerCase().includes(searchTerm) || 
               cName.toLowerCase().includes(searchTerm) || 
               email.toLowerCase().includes(searchTerm) ||
               specs.some(s => (s || '').toLowerCase().includes(searchTerm));
      });
    }

    filteredData = result;
    table.updateData(filteredData);
  }

  createDateRangeFilter({
    container: container.querySelector('#date-range-mount'),
    onChange: (start, end) => {
      // Filter by date if needed
      updateFilteredData();
    }
  });

  setListSearch('Search contractors...', (q) => {
    searchTerm = q.toLowerCase();
    updateFilteredData();
  });

  container.querySelector('#filter-status-select')?.addEventListener('change', (e) => {
    activeFilter = e.target.value;
    updateFilteredData();
  });

  // Action button clicks inside the table should navigate to edit instead of triggering row click
  container.addEventListener('click', (e) => {
    const editBtn = e.target.closest('.contractor-edit-btn');
    if (editBtn) {
      e.stopPropagation();
      router.navigate(`/contractors/${editBtn.dataset.id}/edit`);
    }
  });
}
