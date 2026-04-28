import { store } from '../../data/store.js';
import { createDataTable } from '../../components/DataTable.js';
import { router } from '../../router.js';
import { escapeHTML } from '../../utils/security.js';

export function renderFleetList(container) {
  const vehicles = store.getAll('fleet');

  const columns = [
    {
      key: 'name',
      label: 'Name / ID',
      render: (v) => escapeHTML(v.name)
    },
    {
      key: 'licensePlate',
      label: 'License Plate',
      render: (v) => escapeHTML(v.licensePlate || '-')
    },
    {
      key: 'type',
      label: 'Type',
      render: (v) => escapeHTML(v.type || '-')
    },
    {
      key: 'status',
      label: 'Status',
      render: (v) => {
        const status = v.status || 'Active';
        const badgeClass = status === 'Active' ? 'badge-success' : (status === 'Maintenance' ? 'badge-warning' : 'badge-neutral');
        return `<span class="badge ${badgeClass}">${escapeHTML(status)}</span>`;
      }
    },
    {
      key: 'assignedToId',
      label: 'Assigned To',
      render: (v) => {
        let assigneeName = '—';
        if (v.assignedToId) {
          const tech = store.getById('people', v.assignedToId);
          if (tech) assigneeName = `${tech.firstName} ${tech.lastName}`;
        }
        return escapeHTML(assigneeName);
      }
    },
    {
      key: 'actions',
      label: 'Actions',
      render: (v) => `<button class="btn btn-ghost btn-sm fleet-edit-btn" data-id="${v.id}">Edit</button>`
    }
  ];

  container.innerHTML = `
    <div class="page-header" style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
      <h1>Fleet / Vehicles</h1>
      <button class="btn btn-primary" id="btn-new-vehicle">Add Vehicle</button>
    </div>

    <div id="fleet-table-container"></div>
  `;

  const table = createDataTable({
    columns,
    data: vehicles,
    emptyMessage: 'No vehicles found',
    emptyIcon: 'local_shipping'
  });

  container.querySelector('#fleet-table-container').appendChild(table);

  // Use event delegation for both row clicks and edit buttons
  container.querySelector('#fleet-table-container').addEventListener('click', (e) => {
    const editBtn = e.target.closest('.fleet-edit-btn');
    if (editBtn) {
      e.stopPropagation();
      router.navigate(`/fleet/${editBtn.dataset.id}/edit`);
      return;
    }

    const row = e.target.closest('tr[data-id]');
    if (row) {
      router.navigate(`/fleet/${row.dataset.id}`);
    }
  });

  container.querySelector('#btn-new-vehicle').addEventListener('click', () => {
    router.navigate('/fleet/new');
  });
}
