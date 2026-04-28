import { store } from '../../data/store.js';
import { router } from '../../router.js';

export function renderVehicleForm(container, params) {
  const isNew = params.id === 'new';
  let vehicle = isNew ? { status: 'Active' } : store.getById('fleet', params.id);

  if (!vehicle && !isNew) {
    container.innerHTML = `<div class="empty-state"><span class="material-icons-outlined">error</span><h3>Vehicle not found</h3></div>`;
    return;
  }

  const staff = store.getAll('people').filter(p => p.type === 'Staff');

  container.innerHTML = `
    <div class="page-header">
      <h1>${isNew ? 'New Vehicle' : 'Edit Vehicle'}</h1>
      <div class="page-header-actions">
        <button class="btn btn-secondary" id="btn-cancel">Cancel</button>
        <button class="btn btn-primary" id="btn-save"><span class="material-icons-outlined">save</span> Save</button>
      </div>
    </div>

    <div class="card" style="max-width: 600px;">
      <div class="card-body">
        <form id="vehicle-form" style="display: flex; flex-direction: column; gap: 15px;">
          <div class="form-group">
            <label class="form-label">Vehicle Name/ID *</label>
            <input type="text" id="name" class="form-input" value="${vehicle.name || ''}" required />
          </div>
          <div class="form-row">
            <div class="form-group">
              <label class="form-label">License Plate</label>
              <input type="text" id="licensePlate" class="form-input" value="${vehicle.licensePlate || ''}" />
            </div>
            <div class="form-group">
              <label class="form-label">Type</label>
              <select id="type" class="form-select">
                ${['Van', 'Truck', 'Car', 'Other'].map(t => `<option value="${t}" ${vehicle.type === t ? 'selected' : ''}>${t}</option>`).join('')}
              </select>
            </div>
          </div>
          <div class="form-row">
            <div class="form-group">
              <label class="form-label">Status</label>
              <select id="status" class="form-select">
                ${['Active', 'Maintenance', 'Inactive'].map(s => `<option value="${s}" ${vehicle.status === s ? 'selected' : ''}>${s}</option>`).join('')}
              </select>
            </div>
            <div class="form-group">
              <label class="form-label">Assign To (Staff)</label>
              <select id="assignedToId" class="form-select">
                <option value="">Unassigned</option>
                ${staff.map(s => `<option value="${s.id}" ${vehicle.assignedToId === s.id ? 'selected' : ''}>${s.firstName} ${s.lastName}</option>`).join('')}
              </select>
            </div>
          </div>
        </form>
      </div>
    </div>
  `;

  container.querySelector('#btn-cancel').addEventListener('click', () => {
    router.navigate(isNew ? '/fleet' : `/fleet/${params.id}`);
  });

  container.querySelector('#btn-save').addEventListener('click', () => {
    const data = {
      name: container.querySelector('#name').value,
      licensePlate: container.querySelector('#licensePlate').value,
      type: container.querySelector('#type').value,
      status: container.querySelector('#status').value,
      assignedToId: container.querySelector('#assignedToId').value
    };

    if (!data.name) {
      alert('Vehicle Name is required.');
      return;
    }

    if (isNew) {
      data.logs = [];
      store.create('fleet', data);
    } else {
      store.update('fleet', params.id, data);
    }

    router.navigate('/fleet');
  });
}
