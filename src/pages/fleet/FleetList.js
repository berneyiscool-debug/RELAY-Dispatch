import { store } from '../../data/store.js';
import { router } from '../../router.js';
import { escapeHTML } from '../../utils/security.js';

export function renderFleetList(container) {
  const vehicles = store.getAll('fleet');

  container.innerHTML = `
    <div class="page-header" style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
      <h1>Fleet / Vehicles</h1>
      <button class="btn btn-primary" id="btn-new-vehicle">Add Vehicle</button>
    </div>

    <div class="card">
      <div class="table-responsive">
        <table class="table">
          <thead>
            <tr>
              <th>Name / ID</th>
              <th>License Plate</th>
              <th>Type</th>
              <th>Status</th>
              <th>Assigned To</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            ${vehicles.length === 0 ? `<tr><td colspan="6" class="text-center">No vehicles found.</td></tr>` :
              vehicles.map(v => {
                let assigneeName = '—';
                if (v.assignedToId) {
                  const tech = store.getById('people', v.assignedToId);
                  if (tech) assigneeName = `${tech.firstName} ${tech.lastName}`;
                }

                return `
                  <tr class="fleet-row" data-id="${v.id}" style="cursor: pointer;">
                    <td>${escapeHTML(v.name)}</td>
                    <td>${escapeHTML(v.licensePlate || '-')}</td>
                    <td>${escapeHTML(v.type || '-')}</td>
                    <td><span class="badge ${v.status === 'Active' ? 'badge-success' : (v.status === 'Maintenance' ? 'badge-warning' : 'badge-neutral')}">${escapeHTML(v.status || 'Active')}</span></td>
                    <td>${escapeHTML(assigneeName)}</td>
                    <td>
                      <button class="btn btn-ghost btn-sm fleet-edit-btn" data-id="${v.id}">Edit</button>
                    </td>
                  </tr>
                `;
              }).join('')
            }
          </tbody>
        </table>
      </div>
    </div>
  `;

  container.querySelectorAll('.fleet-row').forEach(row => {
    row.addEventListener('click', () => {
      router.navigate(`/fleet/${row.dataset.id}`);
    });
  });

  container.querySelectorAll('.fleet-edit-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      router.navigate(`/fleet/${btn.dataset.id}/edit`);
    });
  });

  container.querySelector('#btn-new-vehicle').addEventListener('click', () => {
    router.navigate('/fleet/new');
  });
}
