// ============================================
// FIELDFORGE — SUPPLIERS LIST PAGE
// ============================================

import { store } from '../../data/store.js';
import { createDataTable } from '../../components/DataTable.js';
import { router } from '../../router.js';
import { createBulkActionBar } from '../../components/BulkActionBar.js';
import { escapeHTML } from '../../utils/security.js';
import { hasPermission } from '../../utils/permissions.js';
import { setListSearch } from '../../utils/listSearch.js';
import { createDateRangeFilter } from '../../utils/dateRangeFilter.js';

export function renderSuppliersList(container) {
  const suppliers = store.getAll('suppliers');
  const canCreate = hasPermission('Suppliers', 'create');
  const canEdit = hasPermission('Suppliers', 'edit');
  const canDelete = hasPermission('Suppliers', 'delete');

  container.innerHTML = `
    <div class="page-header" style="margin-bottom:8px; display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:8px;">
      <h1>Suppliers</h1>
      <div class="page-header-actions" style="display:flex; align-items:center; gap:6px; flex-wrap:wrap;">
        <div id="date-range-mount" style="display:inline-flex; align-items:center;"></div>
        <select id="filter-status-select" class="form-select" style="height:25px; font-size:11px; padding:0 18px 0 8px; width:145px; margin:0; align-self:center;">
          <option value="all">All Suppliers (${suppliers.length})</option>
          <option value="active">Active (${suppliers.filter(s => s.active === true).length})</option>
          <option value="inactive">Inactive (${suppliers.filter(s => s.active === false).length})</option>
        </select>
        ${canCreate ? `
          <button class="btn btn-primary btn-sm" id="btn-new-supplier" style="height:25px; font-size:11px; padding:0 10px; display:inline-flex; align-items:center; gap:4px; margin:0; align-self:center;" data-tooltip="Register a new supplier">
            <span class="material-icons-outlined" style="font-size:13px;">add</span> <span class="btn-label">Add Supplier</span>
          </button>` : ''}
      </div>
    </div>
    <div id="suppliers-table-container"></div>
  `;

  let filteredData = [...suppliers];

  const columns = [
    { key: 'name', label: 'Supplier', render: (r) => `<span class="cell-link font-medium">${escapeHTML(r.name)}</span>`, width: '24%' },
    { key: 'contactName', label: 'Contact', render: (r) => escapeHTML(r.contactName || '—'), width: '18%' },
    { key: 'category', label: 'Category', render: (r) => `<span class="badge badge-neutral">${escapeHTML(r.category || 'General')}</span>`, width: '14%' },
    { key: 'email', label: 'Email', render: (r) => escapeHTML(r.email || '—'), width: '18%' },
    { key: 'phone', label: 'Phone', render: (r) => escapeHTML(r.phone || '—'), width: '12%' },
    { key: 'paymentTerms', label: 'Terms', render: (r) => escapeHTML(r.paymentTerms || '—'), width: '10%' },
    { key: 'active', label: 'Status', render: (r) => `<span class="badge ${r.active ? 'badge-success' : 'badge-neutral'}">${r.active ? 'Active' : 'Inactive'}</span>`, width: '10%' },
  ];

  const table = createDataTable({ 
    columns, 
    data: filteredData, 
    onRowClick: (id) => router.navigate(`/suppliers/${id}`), 
    emptyMessage: 'No suppliers found', 
    emptyIcon: 'local_shipping',
    selectable: canEdit || canDelete,
    onSelectionChange: (selectedIds) => {
      const actions = [];
      
      if (canEdit) {
        actions.push(
          {
            label: 'Activate',
            icon: 'check_circle',
            onClick: (ids) => {
              ids.forEach(id => store.update('suppliers', id, { active: true }));
              table.clearSelection();
              renderSuppliersList(container);
              import('../../components/Notifications.js').then(({ showToast }) => showToast(`Activated ${ids.length} suppliers`, 'success'));
            }
          },
          {
            label: 'Deactivate',
            icon: 'block',
            onClick: (ids) => {
              ids.forEach(id => store.update('suppliers', id, { active: false }));
              table.clearSelection();
              renderSuppliersList(container);
              import('../../components/Notifications.js').then(({ showToast }) => showToast(`Deactivated ${ids.length} suppliers`, 'warning'));
            }
          }
        );
      }

      if (canDelete) {
        actions.push({
          label: 'Delete Selected',
          icon: 'delete',
          className: 'btn-danger',
          onClick: (ids) => {
            import('../../components/Modal.js').then(({ showModal }) => {
              const content = document.createElement('div');
              content.innerHTML = `<p>Are you sure you want to delete ${ids.length} suppliers? This action cannot be undone.</p>`;
              showModal({
                title: 'Confirm Bulk Delete',
                content,
                actions: [
                  { label: 'Cancel', className: 'btn-secondary', onClick: c => c() },
                  { label: 'Delete', className: 'btn-danger', onClick: c => {
                    ids.forEach(id => store.delete('suppliers', id));
                    table.clearSelection();
                    renderSuppliersList(container);
                    import('../../components/Notifications.js').then(({ showToast }) => showToast(`Deleted ${ids.length} suppliers`, 'success'));
                    c();
                  }}
                ]
              });
            });
          }
        });
      }

      createBulkActionBar({
        container,
        selectedIds,
        onClear: () => table.clearSelection(),
        actions
      });
    }
  });
  
  container.querySelector('#suppliers-table-container').appendChild(table);
  
  if (canCreate) {
    container.querySelector('#btn-new-supplier').addEventListener('click', () => router.navigate('/suppliers/new'));
  }
  container.querySelector('#filter-sort-select')?.addEventListener('change', (e) => {
    const val = e.target.value;
    const [key, dir] = val.split('_');
    table.setSort(key, dir);
  });

  let activeFilter = 'all';
  let searchTerm = '';

  function updateFilteredData() {
    let result = [...suppliers];

    // Apply filter status
    if (activeFilter === 'active') {
      result = result.filter(s => s.active === true);
    } else if (activeFilter === 'inactive') {
      result = result.filter(s => s.active === false);
    }

    // Apply search term
    if (searchTerm) {
      result = result.filter(s => {
        const name = s.name || '';
        const cName = s.contactName || '';
        const cat = s.category || '';
        const email = s.email || '';
        return name.toLowerCase().includes(searchTerm) || 
               cName.toLowerCase().includes(searchTerm) || 
               cat.toLowerCase().includes(searchTerm) ||
               email.toLowerCase().includes(searchTerm);
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

  setListSearch('Search suppliers...', (q) => {
    searchTerm = q.toLowerCase();
    updateFilteredData();
  });

  container.querySelector('#filter-status-select')?.addEventListener('change', (e) => {
    activeFilter = e.target.value;
    updateFilteredData();
  });

  if (canEdit) {
    // Action button clicks inside the table should navigate to edit instead of triggering row click
    container.addEventListener('click', (e) => {
      const editBtn = e.target.closest('.supplier-edit-btn');
      if (editBtn) {
        e.stopPropagation();
        router.navigate(`/suppliers/${editBtn.dataset.id}/edit`);
      }
    });
  }
}
