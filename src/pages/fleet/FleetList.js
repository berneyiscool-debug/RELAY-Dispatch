// ============================================
// SIMPRO CLONE — FLEET LIST PAGE
// ============================================

import { store } from '../../data/store.js';
import { createDataTable } from '../../components/DataTable.js';
import { router } from '../../router.js';
import { escapeHTML } from '../../utils/security.js';

export function renderFleetList(container) {
  const vehicles = store.getAll('fleet');

  container.innerHTML = `
    <div class="page-header">
      <h1>Fleet / Vehicles</h1>
      <div class="page-header-actions">
        <button class="btn btn-primary" id="btn-new-vehicle"><span class="material-icons-outlined">add</span> Add Vehicle</button>
      </div>
    </div>
    
    <div class="page-toolbar">
      <div class="toolbar-search">
        <span class="material-icons-outlined">search</span>
        <input type="text" placeholder="Search fleet..." id="fleet-search" />
      </div>
    </div>

    <div id="fleet-table-container"></div>
  `;

  let filteredData = [...vehicles];

  const columns = [
    { key: 'name', label: 'Name / ID', render: (r) => `<span class="cell-link font-medium">${escapeHTML(r.name)}</span>` },
    { key: 'licensePlate', label: 'License Plate', render: (r) => escapeHTML(r.licensePlate || '—') },
    { key: 'type', label: 'Type', render: (r) => escapeHTML(r.type || '—') },
    { key: 'status', label: 'Status', render: (r) => `<span class="badge ${r.status === 'Active' ? 'badge-success' : (r.status === 'Maintenance' ? 'badge-warning' : 'badge-neutral')}">${escapeHTML(r.status || 'Active')}</span>` },
    { key: 'assignedTo', label: 'Assigned To', render: (r) => {
        if (!r.assignedToId) return '—';
        const tech = store.getById('people', r.assignedToId);
        return tech ? escapeHTML(`${tech.firstName} ${tech.lastName}`) : '—';
      }
    },
    { key: 'actions', label: '', width: '80px', render: (r) => `<button class="btn btn-ghost btn-sm fleet-edit-btn" data-id="${r.id}"><span class="material-icons-outlined" style="font-size:16px;">edit</span></button>` }
  ];

  const table = createDataTable({ 
    columns, 
    data: filteredData, 
    onRowClick: (id) => router.navigate(`/fleet/${id}`), 
    emptyMessage: 'No vehicles found', 
    emptyIcon: 'directions_car' 
  });
  
  container.querySelector('#fleet-table-container').appendChild(table);
  
  container.querySelector('#btn-new-vehicle').addEventListener('click', () => router.navigate('/fleet/new'));

  container.querySelector('#fleet-search').addEventListener('input', (e) => {
    const q = e.target.value.toLowerCase();
    filteredData = vehicles.filter(v => 
      v.name.toLowerCase().includes(q) || 
      (v.licensePlate || '').toLowerCase().includes(q) || 
      (v.type || '').toLowerCase().includes(q)
    );
    table.updateData(filteredData);
  });

  container.addEventListener('click', (e) => {
    const editBtn = e.target.closest('.fleet-edit-btn');
    if (editBtn) {
      e.stopPropagation();
      router.navigate(`/fleet/${editBtn.dataset.id}/edit`);
    }
  });
}
