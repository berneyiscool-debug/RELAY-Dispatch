import { store } from '../../data/store.js';
import { router } from '../../router.js';
import { escapeHTML } from '../../utils/security.js';

export function renderAssetDetail(container, params) {
  const asset = store.getById('assets', params.id);
  if (!asset) {
    container.innerHTML = `<div class="card"><p>Asset not found.</p></div>`;
    return;
  }

  let assigneeName = 'Unassigned';
  if (asset.assignedToId) {
    const tech = store.getById('people', asset.assignedToId);
    if (tech) assigneeName = `${tech.firstName} ${tech.lastName}`;
  }
  
  let ownerName = 'My Business';
  if (asset.ownerType === 'Customer' && asset.customerId) {
    const cust = store.getById('customers', asset.customerId) || store.getById('people', asset.customerId);
    if (cust) ownerName = cust.company || `${cust.firstName} ${cust.lastName}`;
  }

  const logs = asset.logs || [];

  container.innerHTML = `
    <div class="page-header" style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
      <div>
        <h1 style="margin: 0;">${escapeHTML(asset.name)}</h1>
        <p style="margin: 5px 0 0 0; color: var(--text-secondary);">${escapeHTML(asset.identifier || asset.licensePlate || 'No Identifier')}</p>
      </div>
      <button class="btn btn-outline" id="btn-edit">Edit</button>
    </div>

    <div style="display: grid; grid-template-columns: 1fr 2fr; gap: 20px;">
      <div class="card">
        <h3 style="margin-top: 0;">Details</h3>
        <div style="display: flex; flex-direction: column; gap: 10px;">
          <div><strong>Type:</strong> ${escapeHTML(asset.type || '-')}</div>
          <div><strong>Owner:</strong> ${escapeHTML(ownerName)}</div>
          <div><strong>Status:</strong> <span class="badge ${asset.status === 'Active' ? 'badge-success' : (asset.status === 'Maintenance' ? 'badge-warning' : 'badge-neutral')}">${escapeHTML(asset.status || 'Active')}</span></div>
          <div><strong>Assigned To:</strong> ${escapeHTML(assigneeName)}</div>
        </div>
      </div>

      <div class="card">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px;">
          <h3 style="margin: 0;">Service & Activity Logs</h3>
          <button class="btn btn-sm btn-primary" id="btn-add-log">Add Log</button>
        </div>

        <table class="table">
          <thead>
            <tr>
              <th>Date</th>
              <th>Metric/Mileage</th>
              <th>Type</th>
              <th>Notes</th>
            </tr>
          </thead>
          <tbody>
            ${logs.length === 0 ? `<tr><td colspan="4" class="text-center">No logs recorded.</td></tr>` :
              logs.map(log => `
                <tr>
                  <td>${escapeHTML(log.date)}</td>
                  <td>${escapeHTML(log.mileage)}</td>
                  <td>${escapeHTML(log.type)}</td>
                  <td>${escapeHTML(log.notes || '-')}</td>
                </tr>
              `).join('')
            }
          </tbody>
        </table>
      </div>
    </div>
  `;

  container.querySelector('#btn-edit').addEventListener('click', () => {
    router.navigate(`/assets/${params.id}/edit`);
  });

  container.querySelector('#btn-add-log').addEventListener('click', () => {
    const date = prompt('Enter date (YYYY-MM-DD):', new Date().toISOString().split('T')[0]);
    if (!date) return;
    const mileage = prompt('Enter current metric/mileage:');
    if (!mileage) return;
    const type = prompt('Enter log type (e.g. Regular Service, Refuel, Repair, Inspection):', 'Regular Service');
    if (!type) return;
    const notes = prompt('Enter notes (optional):', '');

    const newLog = { date, mileage, type, notes };
    const updatedLogs = [...(asset.logs || []), newLog];

    store.update('assets', asset.id, { logs: updatedLogs });
    renderAssetDetail(container, params); // Re-render to show new log
  });
}
