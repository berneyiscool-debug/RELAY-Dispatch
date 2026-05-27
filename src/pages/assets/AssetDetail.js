import { store } from '../../data/store.js';
import { router } from '../../router.js';
import { escapeHTML } from '../../utils/security.js';
import { showDrawer } from '../../components/Drawer.js';
import { showToast } from '../../components/Notifications.js';

export function renderAssetDetail(container, params) {
  const asset = store.getById('assets', params.id);
  if (!asset) {
    container.innerHTML = `<div class="card"><p>Asset not found.</p></div>`;
    return;
  }

  let activeTab = 'history'; // 'history' or 'maint'

  function render() {
    // Re-fetch fresh asset data in case of updates
    const currentAsset = store.getById('assets', params.id);
    const settings = store.getSettings();
    
    let assigneeName = 'Unassigned';
    if (currentAsset.assignedToId) {
      const tech = store.getById('technicians', currentAsset.assignedToId);
      if (tech) assigneeName = tech.name;
    }
    
    let ownerName = 'My Business';
    let ownerTypeLabel = 'Internal Asset';
    if (currentAsset.ownerType === 'Customer' && currentAsset.customerId) {
      const cust = store.getById('customers', currentAsset.customerId);
      if (cust) ownerName = cust.company;
      ownerTypeLabel = 'Customer Asset';
    }

    const logs = currentAsset.logs || [];
    const totalMaintCost = logs.reduce((sum, log) => sum + (parseFloat(log.cost) || 0), 0);
    
    // Service Interval Logic (Calendar fallback)
    const lastService = logs.filter(l => l.type === 'Service').sort((a,b) => new Date(b.date) - new Date(a.date))[0];
    let nextServiceDate = 'Not Scheduled';
    let isOverdue = false;
    if (lastService && currentAsset.serviceIntervalMonths) {
      const d = new Date(lastService.date);
      d.setMonth(d.getMonth() + parseInt(currentAsset.serviceIntervalMonths));
      nextServiceDate = d.toLocaleDateString();
      isOverdue = d < new Date();
    }

    // Fetch Maintenance Plans
    const plans = store.getAll('maintenancePlans').filter(p => p.assetId === currentAsset.id) || [];
    const activePlan = plans.find(p => p.status === 'Active');

    // Override overdue states if there is an active maintenance plan
    if (activePlan) {
      if (activePlan.triggerType === 'Calendar') {
        nextServiceDate = new Date(activePlan.nextServiceDate).toLocaleDateString();
        isOverdue = new Date(activePlan.nextServiceDate) < new Date();
      } else if (activePlan.triggerType === 'Meter') {
        const currentMeterVal = parseFloat(currentAsset.currentMeter || 0);
        const lastTriggered = parseFloat(activePlan.lastTriggeredMeter || 0);
        const interval = parseFloat(activePlan.meterInterval || 0);
        const targetMeter = lastTriggered + interval;
        nextServiceDate = `At ${targetMeter} ${currentAsset.meterUnit || 'hrs'}`;
        isOverdue = currentMeterVal >= targetMeter;
      }
    }

    container.innerHTML = `
      <div class="page-header">
        <div style="display:flex; align-items:center; gap:12px">
          <div class="asset-icon-box" style="width:48px; height:48px; background:var(--bg-color); border-radius:10px; display:flex; align-items:center; justify-content:center; border:1px solid var(--border-color)">
            <span class="material-icons-outlined" style="color:var(--color-primary)">${currentAsset.type === 'Vehicle' ? 'directions_car' : 'precision_manufacturing'}</span>
          </div>
          <div>
            <h1 style="margin: 0;">${escapeHTML(currentAsset.name)}</h1>
            <div style="display:flex; align-items:center; gap:8px; margin-top:4px">
              <span class="badge ${currentAsset.ownerType === 'Business' ? 'badge-primary' : 'badge-neutral'}">${ownerTypeLabel}</span>
              <span class="text-tertiary" style="font-size:12px">• ${escapeHTML(currentAsset.identifier || currentAsset.serial || 'No ID')}</span>
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
              <div style="width:10px; height:10px; border-radius:50%; background:${currentAsset.status === 'Active' ? 'var(--color-success)' : 'var(--color-warning)'}"></div>
              <span style="font-weight:600; font-size:16px">${currentAsset.status || 'Active'}</span>
            </div>
          </div>
        </div>
        <div class="card">
          <div class="card-body">
            <div class="text-tertiary" style="font-size:11px; text-transform:uppercase; letter-spacing:0.5px; margin-bottom:4px">Next Service Due</div>
            <div style="font-weight:600; font-size:16px; color:${isOverdue ? 'var(--color-danger)' : 'inherit'}">
              ${nextServiceDate}
              ${isOverdue ? `<span style="font-size:11px; margin-left:6px; background:var(--color-danger-bg); color:var(--color-danger); padding:2px 6px; border-radius:4px">${activePlan?.triggerType === 'Meter' ? 'LIMIT MET' : 'OVERDUE'}</span>` : ''}
            </div>
          </div>
        </div>
        <div class="card">
          <div class="card-body">
            <div style="display:flex; justify-content:space-between; align-items:flex-start;">
              <div>
                <div class="text-tertiary" style="font-size:11px; text-transform:uppercase; letter-spacing:0.5px; margin-bottom:4px">
                  ${currentAsset.ownerType === 'Business' ? 'Total Maintenance Spend' : 'Current Meter Reading'}
                </div>
                <div style="font-weight:600; font-size:16px">
                  ${currentAsset.ownerType === 'Business' ? `$${totalMaintCost.toLocaleString()}` : `${currentAsset.currentMeter || 0} ${currentAsset.meterUnit || 'hrs'}`}
                </div>
              </div>
              <button class="btn btn-xs btn-secondary" id="btn-update-meter" style="padding: 2px 8px; font-size:11px; display:flex; align-items:center; gap:4px; margin-top:2px;">
                <span class="material-icons-outlined" style="font-size:14px">speed</span> Update Meter
              </button>
            </div>
            ${currentAsset.ownerType === 'Business' ? `
              <div style="margin-top:8px; padding-top:8px; border-top:1px dashed var(--border-color); display:flex; justify-content:space-between; align-items:center; font-size:12px; color:var(--text-secondary)">
                <span>Current Meter:</span>
                <span class="font-medium">${currentAsset.currentMeter || 0} ${currentAsset.meterUnit || 'hrs'}</span>
              </div>
            ` : ''}
          </div>
        </div>
      </div>

      <div class="grid-3" style="align-items: start;">
        <div style="grid-column: span 1; display:flex; flex-direction:column; gap:var(--space-lg)">
          <div class="card">
            <div class="card-header"><h4>Asset Information</h4></div>
            <div class="card-body">
              <div style="display: flex; flex-direction: column; gap: 12px;">
                <div style="display:flex; justify-content:space-between">
                  <span class="text-secondary">Category</span>
                  <span class="font-medium">${escapeHTML(currentAsset.type || '-')}</span>
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
                  <span class="font-medium">${escapeHTML(currentAsset.site || 'Main Office')}</span>
                </div>
                <div style="display:flex; justify-content:space-between">
                  <span class="text-secondary">Interval</span>
                  <span class="font-medium">${currentAsset.serviceIntervalMonths || 6} Months</span>
                </div>
                ${currentAsset.ownerType === 'Business' ? `
                  <div style="display:flex; justify-content:space-between; padding-top:12px; border-top:1px solid var(--border-color); margin-top:4px">
                    <span class="text-secondary">Recovery Rate</span>
                    <span class="font-medium" style="color:var(--color-primary)">$${(currentAsset.recoveryRate || 0).toFixed(2)}/hr</span>
                  </div>
                ` : ''}
              </div>
            </div>
          </div>

          ${currentAsset.description ? `
          <div class="card">
            <div class="card-header"><h4>Description</h4></div>
            <div class="card-body text-secondary" style="font-size:13px">
              ${escapeHTML(currentAsset.description)}
            </div>
          </div>
          ` : ''}
        </div>

        <div class="card" style="grid-column: span 2">
          <div class="card-header" style="display: flex; justify-content: space-between; align-items: center; padding: 12px var(--space-lg); border-bottom: 1px solid var(--border-color)">
            <div class="tabs" style="border:none; margin:0; padding:0">
              <button class="tab ${activeTab === 'history' ? 'active' : ''}" id="tab-history" style="padding: 6px 12px; font-size:14px">Activity History</button>
              <button class="tab ${activeTab === 'maint' ? 'active' : ''}" id="tab-maint" style="padding: 6px 12px; font-size:14px">Maintenance Agreements</button>
            </div>
            ${activeTab === 'history' ? `
              <button class="btn btn-sm btn-primary" id="btn-add-log">
                <span class="material-icons-outlined" style="font-size:16px">add</span> New Log
              </button>
            ` : `
              <button class="btn btn-sm btn-primary" id="btn-configure-plan">
                <span class="material-icons-outlined" style="font-size:16px">settings</span> Configure Plan
              </button>
            `}
          </div>

          <div class="card-body" style="padding:0" id="right-column-content">
            ${renderTabContent(currentAsset, logs, plans)}
          </div>
        </div>
      </div>
    `;

    bindEvents(currentAsset);
  }

  function renderTabContent(currentAsset, logs, plans) {
    if (activeTab === 'history') {
      return `
        <table class="data-table">
          <thead>
            <tr>
              <th style="width:100px">Date</th>
              <th style="width:120px">Meter (${currentAsset.meterUnit || 'hrs'})</th>
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
      `;
    }

    if (activeTab === 'maint') {
      if (plans.length === 0) {
        return `
          <div style="padding:40px; text-align:center" class="text-secondary">
            <span class="material-icons-outlined" style="font-size:48px; color:var(--text-tertiary); margin-bottom:12px">engineering</span>
            <h4 style="margin:0 0 6px 0; color:var(--text-primary)">No Active Maintenance Plan</h4>
            <p style="font-size:13px; margin:0 0 16px 0; max-width:320px; margin-inline:auto">Link this asset to a quote blueprint to auto-generate preventive service schedules and material checks.</p>
            <button class="btn btn-primary btn-sm" id="btn-configure-plan-empty"><span class="material-icons-outlined" style="font-size:16px">add</span> Set Up Plan</button>
          </div>
        `;
      }

      return plans.map(p => {
        const quote = store.getById('quotes', p.quoteId);
        const quoteNum = quote ? quote.number : 'Unknown';
        
        let scheduleDetail = '';
        let overdueBadge = '';
        if (p.triggerType === 'Calendar') {
          const nextDate = new Date(p.nextServiceDate);
          const today = new Date();
          const isPastDue = nextDate < today;
          scheduleDetail = `Next Service Due: <strong style="color:${isPastDue ? 'var(--color-danger)' : 'inherit'}">${p.nextServiceDate}</strong>`;
          overdueBadge = isPastDue ? `<span class="badge badge-danger">OVERDUE</span>` : '';
        } else {
          const currentMeter = parseFloat(currentAsset.currentMeter || 0);
          const lastTriggered = parseFloat(p.lastTriggeredMeter || 0);
          const interval = parseFloat(p.meterInterval || 0);
          const targetMeter = lastTriggered + interval;
          const isPastDue = currentMeter >= targetMeter;
          scheduleDetail = `Trigger Milestone: <strong>${targetMeter} ${currentAsset.meterUnit || 'hrs'}</strong> (Current: ${currentMeter} ${currentAsset.meterUnit || 'hrs'})`;
          overdueBadge = isPastDue ? `<span class="badge badge-danger">LIMIT EXCEEDED</span>` : '';
        }

        return `
          <div style="padding:20px; border-bottom:1px solid var(--border-color); display:flex; justify-content:space-between; align-items:center">
            <div>
              <div style="display:flex; align-items:center; gap:8px; margin-bottom:6px">
                <h4 style="margin:0; font-size:15px; color:var(--text-primary)">${escapeHTML(p.name)}</h4>
                <span class="badge ${p.status === 'Active' ? 'badge-success' : 'badge-neutral'}">${p.status}</span>
                ${overdueBadge}
              </div>
              <div style="font-size:13px; color:var(--text-secondary); display:flex; flex-direction:column; gap:4px">
                <span>Trigger Rule: <strong>${p.triggerType}</strong> ${p.triggerType === 'Calendar' ? `(${p.frequency})` : `(Every ${p.meterInterval} ${currentAsset.meterUnit || 'hrs'})`}</span>
                <span>${scheduleDetail}</span>
                <span>Blueprint Template: <a href="#/quotes/${p.quoteId}" class="cell-link font-medium">Quote ${escapeHTML(quoteNum)}</a></span>
              </div>
            </div>
            <div style="display:flex; gap:8px">
              <button class="btn btn-sm ${p.status === 'Active' ? 'btn-secondary' : 'btn-primary'} btn-toggle-plan" data-id="${p.id}">
                <span class="material-icons-outlined" style="font-size:16px">${p.status === 'Active' ? 'pause' : 'play_arrow'}</span>
                ${p.status === 'Active' ? 'Pause' : 'Resume'}
              </button>
              <button class="btn btn-sm btn-secondary btn-edit-plan" data-id="${p.id}">Edit</button>
              <button class="btn btn-sm btn-ghost text-danger btn-delete-plan" data-id="${p.id}"><span class="material-icons-outlined" style="font-size:18px">delete</span></button>
            </div>
          </div>
        `;
      }).join('');
    }
  }

  function bindEvents(currentAsset) {
    container.querySelector('#btn-edit').addEventListener('click', () => {
      router.navigate(`/assets/${params.id}/edit`);
    });

    // Tab toggles
    container.querySelector('#tab-history').addEventListener('click', () => {
      activeTab = 'history';
      render();
    });

    container.querySelector('#tab-maint').addEventListener('click', () => {
      activeTab = 'maint';
      render();
    });

    // Add log
    container.querySelector('#btn-add-log')?.addEventListener('click', () => {
      openLogModal();
    });

    // Plan Configuration Drawer
    container.querySelector('#btn-configure-plan')?.addEventListener('click', () => {
      openPlanDrawer();
    });

    container.querySelector('#btn-configure-plan-empty')?.addEventListener('click', () => {
      openPlanDrawer();
    });

    // Plan list triggers
    container.querySelectorAll('.btn-toggle-plan').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const id = e.target.closest('button').dataset.id;
        const plans = store.getAll('maintenancePlans');
        const plan = plans.find(p => p.id === id);
        if (plan) {
          const nextStatus = plan.status === 'Active' ? 'Paused' : 'Active';
          store.update('maintenancePlans', id, { status: nextStatus });
          showToast(`Plan ${nextStatus === 'Active' ? 'resumed' : 'paused'} successfully`, 'success');
          render();
        }
      });
    });

    container.querySelectorAll('.btn-edit-plan').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const id = e.target.closest('button').dataset.id;
        const plan = store.getById('maintenancePlans', id);
        if (plan) openPlanDrawer(plan);
      });
    });

    container.querySelectorAll('.btn-delete-plan').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const id = e.target.closest('button').dataset.id;
        const plan = store.getById('maintenancePlans', id);
        if (!plan) return;

        import('../../components/Modal.js').then(({ showModal }) => {
          const modalContent = document.createElement('div');
          modalContent.innerHTML = `<p>Are you sure you want to delete the maintenance plan "${escapeHTML(plan.name)}"? This action cannot be undone.</p>`;
          showModal({
            title: 'Delete Maintenance Plan',
            content: modalContent,
            actions: [
              { label: 'Cancel', className: 'btn-secondary', onClick: c => c() },
              { label: 'Delete', className: 'btn-danger', onClick: c => {
                store.delete('maintenancePlans', id);
                showToast('Maintenance plan deleted', 'success');
                c();
                render();
              }}
            ]
          });
        });
      });
    });
    container.querySelector('#btn-update-meter')?.addEventListener('click', () => {
      openUpdateMeterModal();
    });
  }

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
          <label class="form-label">Current Meter Reading (${asset.meterUnit || 'hrs'})</label>
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
            
            // If the meter changes, run maintenance checks immediately
            import('../../utils/maintenanceEngine.js').then(({ checkMaintenancePlans }) => {
              checkMaintenancePlans();
              c();
              render();
            });
          }}
        ]
      });
    });
  }

  function openUpdateMeterModal() {
    const content = document.createElement('div');
    content.innerHTML = `
      <div class="form-group" style="margin-top:8px">
        <label class="form-label">New Meter Reading (${escapeHTML(asset.meterUnit || 'hrs')}) *</label>
        <input type="number" id="new-meter-val" class="form-input" value="${asset.currentMeter || 0}" step="any" required />
      </div>
    `;

    import('../../components/Modal.js').then(({ showModal }) => {
      showModal({
        title: 'Update Meter Reading',
        content,
        actions: [
          { label: 'Cancel', className: 'btn-secondary', onClick: c => c() },
          { label: 'Update Meter', className: 'btn-primary', onClick: c => {
            const meter = parseFloat(content.querySelector('#new-meter-val').value);
            if (isNaN(meter)) return showToast('Please enter a valid meter reading', 'error');

            store.update('assets', asset.id, { currentMeter: meter });
            showToast('Meter reading updated successfully', 'success');

            // Trigger maintenance checks immediately
            import('../../utils/maintenanceEngine.js').then(({ checkMaintenancePlans }) => {
              checkMaintenancePlans();
              c();
              render();
            });
          }}
        ]
      });
    });
  }

  function openPlanDrawer(existingPlan = null) {
    const quotes = store.getAll('quotes') || [];
    const taskTemplates = store.getAll('taskTemplates') || [];
    const title = existingPlan ? 'Edit Maintenance Plan' : 'Configure Maintenance Plan';

    const content = document.createElement('div');
    content.innerHTML = `
      <div style="display:flex; flex-direction:column; gap:16px;">
        <div class="form-group">
          <label class="form-label">Plan Name *</label>
          <input type="text" class="form-input" id="plan-name" placeholder="e.g. Semi-Annual HVAC PM" value="${escapeHTML(existingPlan?.name || '')}" required />
        </div>

        <div class="form-group">
          <label class="form-label">Trigger Type *</label>
          <select class="form-select" id="plan-trigger-type">
            <option value="Calendar" ${existingPlan?.triggerType === 'Calendar' ? 'selected' : ''}>Calendar-Based</option>
            <option value="Meter" ${existingPlan?.triggerType === 'Meter' ? 'selected' : ''}>Usage/Meter-Based</option>
          </select>
        </div>

        <!-- Calendar Triggers -->
        <div id="plan-calendar-fields" style="display: ${!existingPlan || existingPlan.triggerType === 'Calendar' ? 'block' : 'none'};">
          <div class="form-group" style="margin-bottom:16px">
            <label class="form-label">Recurrence Frequency</label>
            <select class="form-select" id="plan-frequency">
              <option value="Weekly" ${existingPlan?.frequency === 'Weekly' ? 'selected' : ''}>Weekly</option>
              <option value="Monthly" ${existingPlan?.frequency === 'Monthly' ? 'selected' : ''}>Monthly</option>
              <option value="Quarterly" ${!existingPlan || existingPlan?.frequency === 'Quarterly' ? 'selected' : ''}>Quarterly</option>
              <option value="Semi-Annually" ${existingPlan?.frequency === 'Semi-Annually' ? 'selected' : ''}>Semi-Annually</option>
              <option value="Annually" ${existingPlan?.frequency === 'Annually' ? 'selected' : ''}>Annually</option>
            </select>
          </div>
          <div class="form-group">
            <label class="form-label">Next Service Date *</label>
            <input type="date" class="form-input" id="plan-next-date" value="${existingPlan?.nextServiceDate || new Date().toISOString().split('T')[0]}" />
          </div>
        </div>

        <!-- Meter Triggers -->
        <div id="plan-meter-fields" style="display: ${existingPlan?.triggerType === 'Meter' ? 'block' : 'none'};">
          <div class="form-group" style="margin-bottom:16px">
            <label class="form-label">Trigger Interval (${asset.meterUnit || 'hrs'}) *</label>
            <input type="number" class="form-input" id="plan-meter-interval" value="${existingPlan?.meterInterval || 500}" placeholder="e.g. 500" />
          </div>
          <div class="form-group">
            <label class="form-label">Last Triggered Meter Milestone (${asset.meterUnit || 'hrs'})</label>
            <input type="number" class="form-input" id="plan-last-meter" value="${existingPlan?.lastTriggeredMeter || asset.currentMeter || 0}" />
          </div>
        </div>

        <div class="form-group">
          <label class="form-label">Priority Level (1-10, 10 is Highest) *</label>
          <select class="form-select" id="plan-priority">
            ${[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(val => {
              const label = val === 1 ? '1 (Lowest)' : (val === 10 ? '10 (Highest)' : val.toString());
              let isSelected = false;
              if (existingPlan) {
                let planPriorityVal = existingPlan.priority;
                if (planPriorityVal === 'Minor') planPriorityVal = 2;
                else if (planPriorityVal === 'Standard') planPriorityVal = 5;
                else if (planPriorityVal === 'Major') planPriorityVal = 8;
                isSelected = parseInt(planPriorityVal || 5) === val;
              } else {
                isSelected = val === 5;
              }
              return `<option value="${val}" ${isSelected ? 'selected' : ''}>${label}</option>`;
            }).join('')}
          </select>
        </div>

        <div class="form-group">
          <label class="form-label">Blueprint Quote (Item Packs & Labor) *</label>
          <select class="form-select" id="plan-quote-id">
            <option value="">Select quote blueprint...</option>
            ${quotes.map(q => `<option value="${q.id}" ${existingPlan?.quoteId === q.id ? 'selected' : ''}>${escapeHTML(q.number)} - ${escapeHTML(q.title)}</option>`).join('')}
          </select>
        </div>

        <div class="form-group">
          <label class="form-label">Link Task List Template</label>
          <select class="form-select" id="plan-task-template-id">
            <option value="">None (create standard job task)</option>
            ${taskTemplates.map(t => `<option value="${t.id}" ${existingPlan?.taskTemplateId === t.id ? 'selected' : ''}>${escapeHTML(t.name)}</option>`).join('')}
          </select>
        </div>

        <div style="display:flex; align-items:center; gap:10px; margin:14px 0 8px 0; padding-left:2px;">
          <input type="checkbox" id="plan-collision-merging" ${existingPlan?.collisionMerging === true ? 'checked' : ''} style="width:18px; height:18px; margin:0; cursor:pointer; accent-color:var(--primary);" />
          <label for="plan-collision-merging" style="margin:0; cursor:pointer; font-size:13px; font-weight:500; color:var(--text-primary); line-height:1.2;">Enable Collision Merging (auto-merge with other due plans)</label>
        </div>

        <div style="display:flex; align-items:center; gap:10px; margin:0 0 4px 0; padding-left:2px;">
          <input type="checkbox" id="plan-merge-tasks" ${existingPlan?.mergeTasks === true ? 'checked' : ''} style="width:18px; height:18px; margin:0; cursor:pointer; accent-color:var(--primary);" />
          <label for="plan-merge-tasks" style="margin:0; cursor:pointer; font-size:13px; font-weight:500; color:var(--text-primary); line-height:1.2;">Merge Task Lists on Collision</label>
        </div>
        <div style="margin:0 0 16px 30px; font-size:11px; color:var(--text-tertiary); line-height:1.4;">
          If left unchecked, only the task list of the highest priority plan will be adopted when a collision occurs.
        </div>

        <div class="form-group">
          <label class="form-label">Plan Status</label>
          <select class="form-select" id="plan-status">
            <option value="Active" ${!existingPlan || existingPlan?.status === 'Active' ? 'selected' : ''}>Active</option>
            <option value="Paused" ${existingPlan?.status === 'Paused' ? 'selected' : ''}>Paused</option>
          </select>
        </div>
      </div>
    `;

    // Dynamic switching
    const triggerSelect = content.querySelector('#plan-trigger-type');
    const calFields = content.querySelector('#plan-calendar-fields');
    const meterFields = content.querySelector('#plan-meter-fields');

    triggerSelect.addEventListener('change', (e) => {
      const isCal = e.target.value === 'Calendar';
      calFields.style.display = isCal ? 'block' : 'none';
      meterFields.style.display = isCal ? 'none' : 'block';
    });

    showDrawer({
      title,
      width: 450,
      content,
      actions: [
        { label: 'Cancel', className: 'btn-secondary', onClick: (close) => close() },
        { label: existingPlan ? 'Save Plan' : 'Create Plan', className: 'btn-primary', onClick: (close) => {
          const name = content.querySelector('#plan-name').value.trim();
          const triggerType = triggerSelect.value;
          const frequency = content.querySelector('#plan-frequency').value;
          const nextServiceDate = content.querySelector('#plan-next-date').value;
          const meterInterval = parseFloat(content.querySelector('#plan-meter-interval').value);
          const lastTriggeredMeter = parseFloat(content.querySelector('#plan-last-meter').value);
          const quoteId = content.querySelector('#plan-quote-id').value;
          const priority = parseInt(content.querySelector('#plan-priority').value || 5);
          const collisionMerging = content.querySelector('#plan-collision-merging').checked;
          const mergeTasks = content.querySelector('#plan-merge-tasks').checked;
          const taskTemplateId = content.querySelector('#plan-task-template-id').value || null;
          const status = content.querySelector('#plan-status').value;

          if (!name) return showToast('Plan Name is required', 'error');
          if (!quoteId) return showToast('Please select a blueprint quote', 'error');

          const planData = {
            name,
            assetId: asset.id,
            quoteId,
            triggerType,
            status,
            priority,
            collisionMerging,
            mergeTasks,
            taskTemplateId,
            frequency: triggerType === 'Calendar' ? frequency : null,
            nextServiceDate: triggerType === 'Calendar' ? nextServiceDate : null,
            meterInterval: triggerType === 'Meter' ? meterInterval : null,
            lastTriggeredMeter: triggerType === 'Meter' ? lastTriggeredMeter : 0,
            lastNotificationDate: existingPlan ? existingPlan.lastNotificationDate : null
          };

          if (existingPlan) {
            store.update('maintenancePlans', existingPlan.id, planData);
            showToast('Maintenance plan updated successfully', 'success');
          } else {
            store.create('maintenancePlans', planData);
            showToast('Maintenance plan configured successfully', 'success');
          }

          // Trigger a check in case we should immediately spawn a notification
          import('../../utils/maintenanceEngine.js').then(({ checkMaintenancePlans }) => {
            checkMaintenancePlans();
            close();
            render();
          });
        }}
      ]
    });
  }

  // Initial render
  render();
}
