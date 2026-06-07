// ============================================
// SIMPRO CLONE — CONTRACTORS LIST PAGE
// ============================================

import { store } from '../../data/store.js';
import { createDataTable } from '../../components/DataTable.js';
import { router } from '../../router.js';
import { createBulkActionBar } from '../../components/BulkActionBar.js';
import { escapeHTML } from '../../utils/security.js';
import { getContractorCompliance } from '../../utils/compliance.js';

export function renderContractorsList(container) {
  const contractors = store.getAll('contractors');

  container.innerHTML = `
    <div class="page-header">
      <h1>Contractors</h1>
      <div class="page-header-actions">
        <button class="btn btn-primary" id="btn-new-contractor" data-tooltip="Onboard a new subcontractor technician" data-tooltip-pos="left"><span class="material-icons-outlined">add</span> Add Contractor</button>
      </div>
    </div>
    
    <div class="page-toolbar">
      <div class="toolbar-filters">
        <button class="toolbar-filter active" data-filter="all">All (${contractors.length})</button>
        <button class="toolbar-filter" data-filter="active">Active</button>
        <button class="toolbar-filter" data-filter="inactive">Inactive</button>
        <button class="toolbar-filter" data-filter="compliant">Compliant</button>
        <button class="toolbar-filter" data-filter="non-compliant">Non-Compliant</button>
      </div>
      <div class="toolbar-search">
        <span class="material-icons-outlined">search</span>
        <input type="text" placeholder="Search contractors by name, email or specialty..." id="contractors-search" />
      </div>
    </div>

    <div id="contractors-table-container"></div>
  `;

  let filteredData = [...contractors];

  const columns = [
    { key: 'businessName', label: 'Business Name', render: (r) => `<span class="cell-link font-medium">${escapeHTML(r.businessName)}</span>` },
    { key: 'contactName', label: 'Contact Name' },
    { key: 'email', label: 'Email', render: (r) => escapeHTML(r.email || '—') },
    { key: 'phone', label: 'Phone', render: (r) => escapeHTML(r.phone || '—') },
    { 
      key: 'compliance', 
      label: 'Compliance', 
      render: (r) => {
        const comp = getContractorCompliance(r);
        const tooltipText = comp.reason ? comp.reason : comp.label;
        return `<span class="badge ${comp.badgeClass}" data-tooltip="${escapeHTML(tooltipText)}" style="cursor:help">${escapeHTML(comp.label)}</span>`;
      }
    },
    { key: 'active', label: 'Status', render: (r) => `<span class="badge ${r.active ? 'badge-success' : 'badge-neutral'}">${r.active ? 'Active' : 'Inactive'}</span>` },
    { key: 'actions', label: '', width: '80px', render: (r) => `<button class="btn btn-ghost btn-sm contractor-edit-btn" data-id="${r.id}" data-tooltip="Edit contractor profile" data-tooltip-pos="left"><span class="material-icons-outlined" style="font-size:16px;">edit</span></button>` }
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

  container.querySelectorAll('.toolbar-filter').forEach(btn => {
    btn.addEventListener('click', () => {
      container.querySelectorAll('.toolbar-filter').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      activeFilter = btn.dataset.filter;
      updateFilteredData();
    });
  });

  container.querySelector('#contractors-search').addEventListener('input', (e) => {
    searchTerm = e.target.value.toLowerCase();
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
