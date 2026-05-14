import { store } from '../../data/store.js';
import { createDataTable } from '../../components/DataTable.js';
import { router } from '../../router.js';
import { createBulkActionBar } from '../../components/BulkActionBar.js';
import { escapeHTML } from '../../utils/security.js';

export function renderAssetList(container) {
  let assets = store.getAll('assets');
  
  // Migrate any old 'fleet' data if 'assets' is empty
  const fleet = store.getAll('fleet');
  if (assets.length === 0 && fleet.length > 0) {
    fleet.forEach(f => {
      f.ownerType = 'Business';
      f.identifier = f.licensePlate;
      store.create('assets', f);
    });
    // Just refresh the asset array
    assets = store.getAll('assets');
  }

  container.innerHTML = `
    <div class="page-header">
      <h1>Assets Manager</h1>
      <div class="page-header-actions">
        <button class="btn btn-primary" id="btn-new-asset"><span class="material-icons-outlined">add</span> Add Asset</button>
      </div>
    </div>
    
    <div class="page-toolbar">
      <div class="toolbar-search">
        <span class="material-icons-outlined">search</span>
        <input type="text" placeholder="Search assets..." id="asset-search" />
      </div>
    </div>

    <div id="asset-table-container"></div>
  `;

  let filteredData = [...assets];

  const columns = [
    { key: 'name', label: 'Name / ID', render: (r) => `<span class="cell-link font-medium">${escapeHTML(r.name)}</span>` },
    { key: 'identifier', label: 'Identifier/Serial', render: (r) => escapeHTML(r.serial || r.identifier || r.licensePlate || '—') },
    { key: 'type', label: 'Type', render: (r) => escapeHTML(r.type || '—') },
    { key: 'owner', label: 'Owner', render: (r) => {
        if (r.ownerType === 'Customer' && r.customerId) {
          const cust = store.getById('customers', r.customerId) || store.getById('people', r.customerId);
          return cust ? `<span class="badge badge-info">${escapeHTML(cust.company || cust.firstName + ' ' + cust.lastName)}</span>` : 'Customer';
        }
        return `<span class="badge badge-neutral">My Business</span>`;
      } 
    },
    { key: 'status', label: 'Status', render: (r) => `<span class="badge ${r.status === 'Active' ? 'badge-success' : (r.status === 'Maintenance' ? 'badge-warning' : 'badge-neutral')}">${escapeHTML(r.status || 'Active')}</span>` },
    { key: 'assignedTo', label: 'Assigned To', render: (r) => {
        if (!r.assignedToId) return '—';
        const tech = store.getById('people', r.assignedToId);
        return tech ? escapeHTML(`${tech.firstName} ${tech.lastName}`) : '—';
      }
    },
    { key: 'actions', label: '', width: '80px', render: (r) => `<button class="btn btn-ghost btn-sm asset-edit-btn" data-id="${r.id}"><span class="material-icons-outlined" style="font-size:16px;">edit</span></button>` }
  ];

  const table = createDataTable({ 
    columns, 
    data: filteredData, 
    onRowClick: (id) => router.navigate(`/assets/${id}`), 
    emptyMessage: 'No assets found', 
    emptyIcon: 'category',
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
                    <option value="Maintenance">Maintenance</option>
                    <option value="Broken">Broken</option>
                    <option value="Inactive">Inactive</option>
                  </select>
                </div>
              `;
              import('../../components/Modal.js').then(({ showModal }) => {
                showModal({
                  title: `Update ${ids.length} Assets`,
                  content,
                  actions: [
                    { label: 'Cancel', className: 'btn-secondary', onClick: c => c() },
                    { label: 'Apply', className: 'btn-primary', onClick: c => {
                      const newStatus = content.querySelector('#bulk-status').value;
                      ids.forEach(id => store.update('assets', id, { status: newStatus }));
                      table.clearSelection();
                      renderAssetList(container);
                      import('../../components/Notifications.js').then(({ showToast }) => showToast(`Updated ${ids.length} assets to ${newStatus}`, 'success'));
                      c();
                    }}
                  ]
                });
              });
            }
          },
          {
            label: 'Print Labels',
            icon: 'qr_code_2',
            onClick: (ids) => {
              import('../../components/Notifications.js').then(({ showToast }) => showToast(`Generating tags for ${ids.length} assets...`, 'info'));
            }
          },
          {
            label: 'Delete Selected',
            icon: 'delete',
            className: 'btn-danger',
            onClick: (ids) => {
              import('../../components/Modal.js').then(({ showModal }) => {
                const content = document.createElement('div');
                content.innerHTML = `<p>Are you sure you want to delete ${ids.length} assets? This action cannot be undone.</p>`;
                showModal({
                  title: 'Confirm Bulk Delete',
                  content,
                  actions: [
                    { label: 'Cancel', className: 'btn-secondary', onClick: c => c() },
                    { label: 'Delete', className: 'btn-danger', onClick: c => {
                      ids.forEach(id => store.delete('assets', id));
                      table.clearSelection();
                      renderAssetList(container);
                      import('../../components/Notifications.js').then(({ showToast }) => showToast(`Deleted ${ids.length} assets`, 'success'));
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
  
  container.querySelector('#asset-table-container').appendChild(table);
  
  container.querySelector('#btn-new-asset').addEventListener('click', () => router.navigate('/assets/new'));

  container.querySelector('#asset-search').addEventListener('input', (e) => {
    const q = e.target.value.toLowerCase();
    filteredData = assets.filter(a => 
      a.name.toLowerCase().includes(q) || 
      (a.serial || a.identifier || a.licensePlate || '').toLowerCase().includes(q) || 
      (a.type || '').toLowerCase().includes(q)
    );
    table.updateData(filteredData);
  });

  container.addEventListener('click', (e) => {
    const editBtn = e.target.closest('.asset-edit-btn');
    if (editBtn) {
      e.stopPropagation();
      router.navigate(`/assets/${editBtn.dataset.id}/edit`);
    }
  });
}
