// ============================================
// FIELDFORGE — SUPPLIERS LIST PAGE
// ============================================

import { store } from '../../data/store.js';
import { createDataTable } from '../../components/DataTable.js';
import { router } from '../../router.js';
import { createBulkActionBar } from '../../components/BulkActionBar.js';
import { escapeHTML } from '../../utils/security.js';
import { hasPermission } from '../../utils/permissions.js';

export function renderSuppliersList(container) {
  const suppliers = store.getAll('suppliers');
  const canCreate = hasPermission('Suppliers', 'create');
  const canEdit = hasPermission('Suppliers', 'edit');
  const canDelete = hasPermission('Suppliers', 'delete');

  container.innerHTML = `
    <div class="page-header">
      <h1>Suppliers</h1>
      <div class="page-header-actions">
        ${canCreate ? `<button class="btn btn-primary" id="btn-new-supplier"><span class="material-icons-outlined">add</span> Add Supplier</button>` : ''}
      </div>
    </div>
    
    <div class="page-toolbar">
      <div class="toolbar-filters">
        <button class="toolbar-filter active" data-filter="all">All (${suppliers.length})</button>
        <button class="toolbar-filter" data-filter="active">Active</button>
        <button class="toolbar-filter" data-filter="inactive">Inactive</button>
      </div>
      <div class="toolbar-search">
        <span class="material-icons-outlined">search</span>
        <input type="text" placeholder="Search suppliers by name, contact, category, or email..." id="suppliers-search" />
      </div>
    </div>

    <div id="suppliers-table-container"></div>
  `;

  let filteredData = [...suppliers];

  const columns = [
    { key: 'name', label: 'Supplier Name', render: (r) => `<span class="cell-link font-medium">${escapeHTML(r.name)}</span>` },
    { key: 'contactName', label: 'Contact Person', render: (r) => escapeHTML(r.contactName || '—') },
    { key: 'category', label: 'Category', render: (r) => `<span class="badge badge-neutral">${escapeHTML(r.category || 'General')}</span>` },
    { key: 'email', label: 'Email', render: (r) => escapeHTML(r.email || '—') },
    { key: 'phone', label: 'Phone', render: (r) => escapeHTML(r.phone || '—') },
    { key: 'paymentTerms', label: 'Payment Terms', render: (r) => escapeHTML(r.paymentTerms || '—') },
    { key: 'active', label: 'Status', render: (r) => `<span class="badge ${r.active ? 'badge-success' : 'badge-neutral'}">${r.active ? 'Active' : 'Inactive'}</span>` },
  ];

  if (canEdit) {
    columns.push({ 
      key: 'actions', 
      label: '', 
      width: '80px', 
      render: (r) => `<button class="btn btn-ghost btn-sm supplier-edit-btn" data-id="${r.id}"><span class="material-icons-outlined" style="font-size:16px;">edit</span></button>` 
    });
  }

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
      result = result.filter(s => 
        s.name.toLowerCase().includes(searchTerm) || 
        (s.contactName || '').toLowerCase().includes(searchTerm) || 
        (s.category || '').toLowerCase().includes(searchTerm) ||
        (s.email || '').toLowerCase().includes(searchTerm)
      );
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

  container.querySelector('#suppliers-search').addEventListener('input', (e) => {
    searchTerm = e.target.value.toLowerCase();
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
