import { store } from '../../data/store.js';
import { router } from '../../router.js';
import { escapeHTML } from '../../utils/security.js';

export function renderAssetDetail(container, params) {
  const asset = store.getById('assets', params.id);
  if (!asset) {
    container.innerHTML = `<div class="card"><p>Asset not found.</p></div>`;
    return;
  }

  const settings = store.getSettings();
  let assigneeName = 'Unassigned';
  if (asset.assignedToId) {
    const tech = store.getById('technicians', asset.assignedToId);
    if (tech) assigneeName = tech.name;
  }
  
  let ownerName = 'My Business';
  let ownerTypeLabel = 'Internal Asset';
  if (asset.ownerType === 'Customer' && asset.customerId) {
    const cust = store.getById('customers', asset.customerId);
    if (cust) ownerName = cust.company;
    ownerTypeLabel = 'Customer Asset';
  }

  const logs = asset.logs || [];
  const totalMaintCost = logs.reduce((sum, log) => sum + (parseFloat(log.cost) || 0), 0);
  
  // Service Interval Logic
  const lastService = logs.filter(l => l.type === 'Service').sort((a,b) => new Date(b.date) - new Date(a.date))[0];
  let nextServiceDate = 'Not Scheduled';
  let isOverdue = false;
  if (lastService && asset.serviceIntervalMonths) {
    const d = new Date(lastService.date);
    d.setMonth(d.getMonth() + parseInt(asset.serviceIntervalMonths));
    nextServiceDate = d.toLocaleDateString();
    isOverdue = d < new Date();
  }

  container.innerHTML = `
    <div class="page-header">
      <div style="display:flex; align-items:center; gap:12px">
        <div class="asset-icon-box" style="width:48px; height:48px; background:var(--bg-color); border-radius:10px; display:flex; align-items:center; justify-content:center; border:1px solid var(--border-color)">
          <span class="material-icons-outlined" style="color:var(--color-primary)">${asset.type === 'Vehicle' ? 'directions_car' : 'precision_manufacturing'}</span>
        </div>
        <div>
          <h1 style="margin: 0;">${escapeHTML(asset.name)}</h1>
          <div style="display:flex; align-items:center; gap:8px; margin-top:4px">
            <span class="badge ${asset.ownerType === 'Business' ? 'badge-primary' : 'badge-neutral'}">${ownerTypeLabel}</span>
            <span class="text-tertiary" style="font-size:12px">• ${escapeHTML(asset.identifier || asset.serial || 'No ID')}</span>
          </div>
        </div>
      </div>
      <div class="page-header-actions">
        <button class="btn btn-secondary" id="btn-edit"><span class="material-icons-outlined" style="font-size:18px">edit</span> Edit Details</button>
      </div>
    </div>

    <div class="grid-3" style="margin-bottom:var(--space-lg)">
      <div class="card">
        <div class="card-body">
          <div class="text-tertiary" style="font-size:11px; text-transform:uppercase; letter-spacing:0.5px; margin-bottom:4px">Current Status</div>
          <div style="display:flex; align-items:center; gap:8px">
            <div style="width:10px; height:10px; border-radius:50%; background:${asset.status === 'Active' ? 'var(--color-success)' : 'var(--color-warning)'}"></div>
            <span style="font-weight:600; font-size:16px">${asset.status || 'Active'}</span>
          </div>
        </div>
      </div>
      <div class="card">
        <div class="card-body">
          <div class="text-tertiary" style="font-size:11px; text-transform:uppercase; letter-spacing:0.5px; margin-bottom:4px">Next Service Due</div>
          <div style="font-weight:600; font-size:16px; color:${isOverdue ? 'var(--color-danger)' : 'inherit'}">
            ${nextServiceDate}
            ${isOverdue ? '<span style="font-size:11px; margin-left:6px; background:var(--color-danger-bg); color:var(--color-danger); padding:2px 6px; border-radius:4px">OVERDUE</span>' : ''}
          </div>
        </div>
      </div>
      <div class="card">
        <div class="card-body">
          <div class="text-tertiary" style="font-size:11px; text-transform:uppercase; letter-spacing:0.5px; margin-bottom:4px">
            ${asset.ownerType === 'Business' ? 'Total Maintenance Spend' : 'Current Meter Reading'}
          </div>
          <div style="font-weight:600; font-size:16px">
            ${asset.ownerType === 'Business' ? `$${totalMaintCost.toLocaleString()}` : `${asset.currentMeter || 0} hrs/km`}
          </div>
        </div>
      </div>
    </div>

    <div style="display: grid; grid-template-columns: 1fr 2fr; gap: var(--space-lg);">
      <div style="display:flex; flex-direction:column; gap:var(--space-lg)">
        <div class="card">
          <div class="card-header"><h4>Asset Information</h4></div>
          <div class="card-body">
            <div style="display: flex; flex-direction: column; gap: 12px;">
              <div style="display:flex; justify-content:space-between">
                <span class="text-secondary">Category</span>
                <span class="font-medium">${escapeHTML(asset.type || '-')}</span>
              </div>
              <div style="display:flex; justify-content:space-between">
                <span class="text-secondary">Owner</span>
                <span class="font-medium">${escapeHTML(ownerName)}</span>
              </div>
              <div style="display:flex; justify-content:space-between">
                <span class="text-secondary">Assigned To</span>
                <span class="font-medium">${escapeHTML(assigneeName)}</span>
              </div>
              <div style="display:flex; justify-content:space-between">
                <span class="text-secondary">Location</span>
                <span class="font-medium">${escapeHTML(asset.site || 'Main Office')}</span>
              </div>
              <div style="display:flex; justify-content:space-between">
                <span class="text-secondary">Interval</span>
                <span class="font-medium">${asset.serviceIntervalMonths || 6} Months</span>
              </div>
              ${asset.ownerType === 'Business' ? `
                <div style="display:flex; justify-content:space-between; padding-top:12px; border-top:1px solid var(--border-color); margin-top:4px">
                  <span class="text-secondary">Recovery Rate</span>
                  <span class="font-medium" style="color:var(--color-primary)">$${(asset.recoveryRate || 0).toFixed(2)}/hr</span>
                </div>
              ` : ''}
            </div>
          </div>
        </div>

        ${asset.description ? `
        <div class="card">
          <div class="card-header"><h4>Description</h4></div>
          <div class="card-body text-secondary" style="font-size:13px">
            ${escapeHTML(asset.description)}
          </div>
        </div>
        ` : ''}
      </div>

      <div class="card">
        <div class="card-header" style="display: flex; justify-content: space-between; align-items: center;">
          <h4 style="margin: 0;">Service & Activity History</h4>
          <button class="btn btn-sm btn-primary" id="btn-add-log">
            <span class="material-icons-outlined" style="font-size:16px">add</span> New Log
          </button>
        </div>

        <div class="card-body" style="padding:0">
          <table class="data-table">
            <thead>
              <tr>
                <th style="width:100px">Date</th>
                <th style="width:120px">Meter</th>
                <th style="width:120px">Type</th>
                <th>Notes</th>
                <th style="text-align:right">Cost</th>
              </tr>
            </thead>
            <tbody>
              ${logs.length === 0 ? `<tr><td colspan="5" class="text-center text-tertiary" style="padding:40px">No logs recorded for this asset.</td></tr>` :
                logs.sort((a,b) => new Date(b.date) - new Date(a.date)).map(log => `
                  <tr>
                    <td class="font-medium">${new Date(log.date).toLocaleDateString()}</td>
                    <td class="text-secondary">${log.meter || '-'}</td>
                    <td>
                      <span class="badge ${log.type === 'Service' ? 'badge-success' : log.type === 'Repair' ? 'badge-danger' : 'badge-neutral'}">
                        ${escapeHTML(log.type)}
                      </span>
                    </td>
                    <td><span class="text-secondary" style="font-size:13px">${escapeHTML(log.notes || '—')}</span></td>
                    <td style="text-align:right; font-weight:600">${log.cost > 0 ? `$${parseFloat(log.cost).toFixed(2)}` : '—'}</td>
                  </tr>
                `).join('')
              }
            </tbody>
          </table>
        </div>
      </div>
    </div>
  `;

  container.querySelector('#btn-edit').addEventListener('click', () => {
    router.navigate(`/assets/${params.id}/edit`);
  });

  container.querySelector('#btn-add-log').addEventListener('click', () => {
    openLogModal();
  });

  function openLogModal() {
    const content = document.createElement('div');
    content.innerHTML = `
      <div class="form-row">
        <div class="form-group">
          <label class="form-label">Date</label>
          <input type="date" id="log-date" class="form-input" value="${new Date().toISOString().split('T')[0]}" />
        </div>
        <div class="form-group">
          <label class="form-label">Log Type</label>
          <select id="log-type" class="form-select">
            <option value="Service">Routine Service</option>
            <option value="Repair">Repair</option>
            <option value="Inspection">Inspection</option>
            <option value="Refuel">Refuel / Usage</option>
            <option value="Other">Other</option>
          </select>
        </div>
      </div>
      <div class="form-row">
        <div class="form-group">
          <label class="form-label">Current Meter Reading</label>
          <input type="number" id="log-meter" class="form-input" value="${asset.currentMeter || 0}" />
        </div>
        <div class="form-group">
          <label class="form-label">Internal Cost ($)</label>
          <input type="number" id="log-cost" class="form-input" value="0" step="0.01" />
        </div>
      </div>
      <div class="form-group">
        <label class="form-label">Notes</label>
        <textarea id="log-notes" class="form-input" rows="3" placeholder="Describe the work performed..."></textarea>
      </div>
    `;

    import('../../components/Modal.js').then(({ showModal }) => {
      showModal({
        title: 'Add Activity Log',
        content,
        actions: [
          { label: 'Cancel', className: 'btn-secondary', onClick: c => c() },
          { label: 'Save Log', className: 'btn-primary', onClick: c => {
            const date = content.querySelector('#log-date').value;
            const type = content.querySelector('#log-type').value;
            const meter = parseFloat(content.querySelector('#log-meter').value);
            const cost = parseFloat(content.querySelector('#log-cost').value);
            const notes = content.querySelector('#log-notes').value;

            if (!date) return;

            const newLog = { date, type, meter, cost, notes };
            const updatedLogs = [...(asset.logs || []), newLog];
            
            store.update('assets', asset.id, { 
              logs: updatedLogs,
              currentMeter: meter,
              status: type === 'Repair' ? 'In Maintenance' : asset.status
            });
            
            c();
            renderAssetDetail(container, params);
          }}
        ]
      });
    });
  }
}
