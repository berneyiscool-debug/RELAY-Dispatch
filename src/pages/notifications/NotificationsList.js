import { store } from '../../data/store.js';
import { router } from '../../router.js';
import { showDrawer } from '../../components/Drawer.js';
import { showToast } from '../../components/Notifications.js';
import { escapeHTML } from '../../utils/security.js';
import { createDataTable } from '../../components/DataTable.js';
import { createBulkActionBar } from '../../components/BulkActionBar.js';
import { setListSearch } from '../../utils/listSearch.js';
import { createDateRangeFilter } from '../../utils/dateRangeFilter.js';
import { todayLocalISO } from '../../utils/dateUtils.js';

export function renderNotificationsList(container, params) {
  const allNotifications = store.getAll('notifications') || [];
  let searchTerm = '';
  let activeFilter = 'all';
  let filterStartDate = '';
  let filterEndDate = '';
  
  function getFilteredData() {
    return allNotifications.filter(n => {
      const search = searchTerm.toLowerCase();
      const matchesSearch = (
        n.title?.toLowerCase().includes(search) ||
        n.description?.toLowerCase().includes(search) ||
        n.createdBy?.toLowerCase().includes(search) ||
        n.type?.toLowerCase().includes(search) ||
        n.priority?.toLowerCase().includes(search)
      );
      const matchesFilter = (activeFilter === 'all') || (n.status === activeFilter);

      if (filterStartDate || filterEndDate) {
        const nDateStr = n.createdAt ? n.createdAt.split('T')[0] : '';
        if (filterStartDate && nDateStr < filterStartDate) return false;
        if (filterEndDate && nDateStr > filterEndDate) return false;
      }

      return matchesSearch && matchesFilter;
    });
  }

  container.innerHTML = `
    <div class="page-header" style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:8px;">
      <h1>Notifications</h1>
      <div class="page-header-actions" style="display:flex; align-items:center; gap:6px; flex-wrap:wrap;">
        <div id="date-range-mount" style="display:inline-flex; align-items:center;"></div>
        <select id="filter-status-select" class="form-select" style="height:25px; font-size:11px; padding:0 18px 0 8px; width:145px; margin:0; align-self:center;">
          <option value="all">All Statuses (${allNotifications.length})</option>
          ${['Pending','Converted','Dismissed'].map(s => `<option value="${s}">${s} (${allNotifications.filter(n => n.status === s).length})</option>`).join('')}
        </select>
        <button class="btn btn-primary btn-sm" id="btn-raise-notification" style="height:25px; font-size:11px; padding:0 10px; display:inline-flex; align-items:center; gap:4px; margin:0; align-self:center;">
          <span class="material-icons-outlined" style="font-size:13px;">campaign</span> <span class="btn-label">Raise Notification</span>
        </button>
      </div>
    </div>
    <div id="notifications-table-container"></div>
  `;

  const columns = [
    { 
      key: 'number', 
      label: 'Notif #', 
      render: (n) => `<span class="cell-link font-medium">${escapeHTML(n.number || 'NT-' + (n.id.includes('_') ? n.id.split('_')[1].padStart(5, '0') : n.id.substring(0, 5).toUpperCase()))}</span>`,
      getValue: (n) => n.number || n.id,
      width: '100px'
    },
    { 
      key: 'type', 
      label: 'Type', 
      render: (n) => `<span class="badge badge-neutral">${escapeHTML(n.type || 'Field Alert')}</span>`,
      width: '120px'
    },
    { 
      key: 'title', 
      label: 'Title', 
      render: (n) => {
        const isPortal = n.source === 'customer_portal' || 
                        (n.message && n.message.toLowerCase().includes('via portal')) ||
                        (n.description && n.description.toLowerCase().includes('via portal')) ||
                        (n.title && n.title.toLowerCase().includes('via portal'));
        
        const portalIcon = isPortal 
          ? `<span class="material-icons-outlined" style="font-size:16px;color:var(--color-primary);margin-right:4px;vertical-align:middle;" title="Submitted via Customer Portal">open_in_browser</span>` 
          : '';

        return `
          <div style="font-weight:500;display:inline-flex;align-items:center;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">
            ${portalIcon}<span>${escapeHTML(n.title)}</span>
          </div>
        `;
      }
    },
    {
      key: 'reference',
      label: 'Reference',
      render: (n) => {
        const linkedJob = n.jobId ? store.getById('jobs', n.jobId) : null;
        if (linkedJob) {
          return `
            <a href="#/jobs/${linkedJob.id}" class="cell-link font-medium" style="display:inline-flex;align-items:center;gap:4px">
              <span class="material-icons-outlined" style="font-size:14px;color:var(--color-primary)">build</span>
              <span>${escapeHTML(linkedJob.number || linkedJob.title || 'Job')}</span>
            </a>
          `;
        }
        
        const linkedAsset = n.assetId ? store.getById('assets', n.assetId) : null;
        if (linkedAsset) {
          return `
            <a href="#/assets/${linkedAsset.id}" class="cell-link font-medium" style="display:inline-flex;align-items:center;gap:4px">
              <span class="material-icons-outlined" style="font-size:14px;color:var(--text-secondary)">precision_manufacturing</span>
              <span>${escapeHTML(linkedAsset.name || linkedAsset.number || 'Asset')}</span>
            </a>
          `;
        }

        if (n.jobNumber) {
          return `<span class="font-medium" style="display:inline-flex;align-items:center;gap:4px"><span class="material-icons-outlined" style="font-size:14px;color:var(--color-primary)">build</span>${escapeHTML(n.jobNumber)}</span>`;
        }
        if (n.assetName) {
          return `<span class="font-medium" style="display:inline-flex;align-items:center;gap:4px"><span class="material-icons-outlined" style="font-size:14px;color:var(--text-secondary)">precision_manufacturing</span>${escapeHTML(n.assetName)}</span>`;
        }

        return '<span class="text-tertiary">—</span>';
      },
      width: '140px'
    },
    { 
      key: 'priority', 
      label: 'Priority', 
      render: (n) => `<span class="badge ${n.priority === 'Urgent' || n.priority === 'High' ? 'badge-danger' : 'badge-neutral'}">${escapeHTML(n.priority || 'Normal')}</span>`,
      width: '100px'
    },
    { 
      key: 'status', 
      label: 'Status', 
      render: (n) => `<span class="badge ${n.status === 'Converted' ? 'badge-success' : 'badge-warning'}">${escapeHTML(n.status || 'Pending')}</span>`,
      width: '110px'
    },
    { 
      key: 'createdAt', 
      label: 'Date', 
      render: (n) => n.createdAt ? new Date(n.createdAt).toLocaleDateString() : '—',
      getValue: (n) => n.createdAt ? new Date(n.createdAt).getTime() : 0,
      width: '110px'
    },
    {
      key: 'actions',
      label: 'Actions',
      render: (n) => `
        <div style="display:flex;align-items:center;justify-content:flex-end;gap:4px;">
          <button class="btn btn-sm btn-ghost btn-edit-notification" data-id="${n.id}" title="Edit Notification" style="height:25px;padding:0 6px;">
            <span class="material-icons-outlined" style="font-size:16px;">edit</span>
          </button>
          <button class="btn btn-sm btn-ghost btn-delete-notification" data-id="${n.id}" title="Delete Notification" style="height:25px;padding:0 6px;color:var(--color-danger)">
            <span class="material-icons-outlined" style="font-size:16px;">delete</span>
          </button>
        </div>
      `,
      width: '90px'
    }
  ];

  const table = createDataTable({
    columns,
    data: getFilteredData(),
    onRowClick: (id) => {
      const n = allNotifications.find(notif => notif.id === id);
      if (n) openNotificationDetails(n);
    },
    emptyMessage: 'No notifications found',
    emptyIcon: 'campaign',
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
              import('../../components/Modal.js').then(({ showModal }) => {
                const content = document.createElement('div');
                content.innerHTML = `
                  <div class="form-group">
                    <label class="form-label">New Status</label>
                    <select class="form-select" id="bulk-status">
                      <option value="Pending">Pending</option>
                      <option value="Converted">Converted</option>
                    </select>
                  </div>
                `;
                showModal({
                  title: `Update ${ids.length} Notification${ids.length > 1 ? 's' : ''}`,
                  content,
                  actions: [
                    { label: 'Cancel', className: 'btn-secondary', onClick: c => c() },
                    { label: 'Apply', className: 'btn-primary', onClick: c => {
                      const newStatus = content.querySelector('#bulk-status').value;
                      ids.forEach(id => store.update('notifications', id, { status: newStatus }));
                      table.clearSelection();
                      renderNotificationsList(container);
                      showToast(`Updated ${ids.length} notification${ids.length > 1 ? 's' : ''} to ${newStatus}`, 'success');
                      c();
                    }}
                  ]
                });
              });
            }
          },
          {
            label: 'Delete Selected',
            icon: 'delete',
            className: 'btn-danger',
            onClick: (ids) => {
              import('../../components/Modal.js').then(({ showModal }) => {
                const content = document.createElement('div');
                content.innerHTML = `<p>Are you sure you want to delete ${ids.length} notification${ids.length > 1 ? 's' : ''}? This cannot be undone.</p>`;
                showModal({
                  title: 'Confirm Bulk Delete',
                  content,
                  actions: [
                    { label: 'Cancel', className: 'btn-secondary', onClick: c => c() },
                    { label: 'Delete', className: 'btn-danger', onClick: c => {
                      ids.forEach(id => store.delete('notifications', id));
                      table.clearSelection();
                      renderNotificationsList(container);
                      showToast(`Deleted ${ids.length} notification${ids.length > 1 ? 's' : ''}`, 'success');
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

  container.querySelector('#notifications-table-container').appendChild(table);

  createDateRangeFilter({
    container: container.querySelector('#date-range-mount'),
    onChange: (start, end) => {
      filterStartDate = start;
      filterEndDate = end;
      table.updateData(getFilteredData());
    }
  });

  setListSearch('Search notifications...', (q) => {
    searchTerm = q;
    table.updateData(getFilteredData());
  });

  container.querySelector('#filter-status-select')?.addEventListener('change', (e) => {
    activeFilter = e.target.value;
    table.updateData(getFilteredData());
  });

  container.querySelector('#btn-raise-notification')?.addEventListener('click', () => openNotificationFormDrawer());

  table.addEventListener('click', (e) => {
    const btn = e.target.closest('button');
    if (!btn) return;
    
    e.stopPropagation();
    const id = btn.dataset.id;
    if (btn.classList.contains('btn-view-notification')) {
      const n = allNotifications.find(notif => notif.id === id);
      if (n) openNotificationDetails(n);
    } else if (btn.classList.contains('btn-edit-notification')) {
      const n = allNotifications.find(notif => notif.id === id);
      if (n) openNotificationFormDrawer(n);
    } else if (btn.classList.contains('btn-convert-quote')) {
      convertToQuote(id);
    } else if (btn.classList.contains('btn-convert-job')) {
      convertToJob(id);
    } else if (btn.classList.contains('btn-view-job')) {
      const jobId = btn.dataset.jobId;
      if (jobId) router.navigate(`/jobs/${jobId}`);
    } else if (btn.classList.contains('btn-view-quote')) {
      const quoteId = btn.dataset.quoteId;
      if (quoteId) router.navigate(`/quotes/${quoteId}`);
    } else if (btn.classList.contains('btn-delete-notification')) {
      import('../../components/Modal.js').then(({ showModal }) => {
        const content = document.createElement('div');
        content.innerHTML = `<p>Are you sure you want to delete this notification?</p>`;
        showModal({
          title: 'Delete Notification',
          content,
          actions: [
            { label: 'Cancel', className: 'btn-secondary', onClick: c => c() },
            { label: 'Delete', className: 'btn-danger', onClick: c => {
              store.delete('notifications', id);
              renderNotificationsList(container);
              showToast('Notification deleted', 'success');
              c();
            }}
          ]
        });
      });
    }
  });

  function refreshAll() {
    renderNotificationsList(container);
  }

  function openNotificationFormDrawer(existingN = null) {
    const jobs = store.getAll('jobs');
    const currentUser = JSON.parse(localStorage.getItem('currentUser') || '{}');

    showDrawer({
      title: existingN ? 'Edit Notification' : 'Raise Notification',
      width: 450,
      content: `
        <div style="display:flex;flex-direction:column;gap:16px;">
          <div class="form-group">
            <label class="form-label">Type</label>
            <select class="form-select" id="notif-type">
              <option value="Field Fault" ${existingN?.type === 'Field Fault' ? 'selected' : ''}>Field Fault</option>
              <option value="Client Request" ${existingN?.type === 'Client Request' ? 'selected' : ''}>Client Request</option>
              <option value="Safety Hazard" ${existingN?.type === 'Safety Hazard' ? 'selected' : ''}>Safety Hazard</option>
              <option value="Recurring Job Due" ${existingN?.type === 'Recurring Job Due' ? 'selected' : ''}>Recurring Job Due</option>
              <option value="Other" ${existingN?.type === 'Other' ? 'selected' : ''}>Other</option>
            </select>
          </div>
          <div class="form-group">
            <label class="form-label">Related Job (Optional)</label>
            <select class="form-select" id="notif-job">
              <option value="">-- None --</option>
              ${jobs.map(j => `<option value="${j.id}" ${existingN?.jobId === j.id ? 'selected' : ''}>${escapeHTML(j.number)} - ${escapeHTML(j.title)}</option>`).join('')}
            </select>
          </div>
          <div class="form-group">
            <label class="form-label">Title / Subject <span class="text-danger">*</span></label>
            <input type="text" class="form-input" id="notif-title" placeholder="E.g. Leaking pipe discovered" value="${escapeHTML(existingN?.title || '')}" />
          </div>
          <div class="form-group">
            <label class="form-label">Priority</label>
            <select class="form-select" id="notif-priority">
              <option value="Low" ${existingN?.priority === 'Low' ? 'selected' : ''}>Low</option>
              <option value="Normal" ${!existingN || existingN?.priority === 'Normal' ? 'selected' : ''}>Normal</option>
              <option value="High" ${existingN?.priority === 'High' ? 'selected' : ''}>High</option>
              <option value="Urgent" ${existingN?.priority === 'Urgent' ? 'selected' : ''}>Urgent</option>
            </select>
          </div>
          <div class="form-group">
            <label class="form-label">Fault / Description <span class="text-danger">*</span></label>
            <textarea class="form-input" id="notif-desc" rows="5" placeholder="Provide details of what needs to be rectified...">${escapeHTML(existingN?.description || '')}</textarea>
          </div>
        </div>
      `,
      actions: [
        { label: 'Cancel', className: 'btn-secondary', onClick: close => close() },
        { label: existingN ? 'Save Changes' : 'Submit Notification', className: 'btn-primary', onClick: close => {
          const type = document.getElementById('notif-type').value;
          const jobId = document.getElementById('notif-job').value;
          const title = document.getElementById('notif-title').value.trim();
          const priority = document.getElementById('notif-priority').value;
          const description = document.getElementById('notif-desc').value.trim();

          if (!title || !description) {
            showToast('Title and Description are required', 'error');
            return;
          }

          if (existingN) {
            store.update('notifications', existingN.id, {
              type,
              jobId: jobId || null,
              title,
              priority,
              description
            });
            showToast('Notification updated', 'success');
          } else {
            store.create('notifications', {
              type,
              jobId: jobId || null,
              title,
              priority,
              description,
              status: 'Pending',
              createdAt: new Date().toISOString(),
              createdBy: currentUser.name || 'Unknown'
            });
            showToast('Notification raised successfully', 'success');
          }
          
          close();
          renderNotificationsList(container);
        }}
      ]
    });
  }

  function openNotificationDetails(n) {
    // Resolve linked entities for full context
    const linkedQuote = n.quoteId ? store.getById('quotes', n.quoteId) : null;
    const linkedAsset = n.assetId ? store.getById('assets', n.assetId) : null;
    const linkedPlan = n.maintenancePlanId ? store.getById('maintenancePlans', n.maintenancePlanId) : null;
    const customer = linkedAsset?.customerId ? store.getById('customers', linkedAsset.customerId) : null;
    const technicians = (store.getAll('technicians') || []).filter(t => !t.deactivated || t.id === n.technicianId);

    // Auto-filled default technician (from notification, maintenance plan, or linked quote)
    const defaultTechId = n.technicianId || linkedPlan?.defaultTechnicianId || linkedPlan?.recurringConfig?.defaultTechnicianId || '';

    // Build maintenance plan details card if relevant
    let maintenanceDetailsCardHtml = '';
    if (n.type === 'Recurring Job Due' || n.maintenancePlanId) {
      const materialsList = n.mergedMaterialsList || [];
      const totalLaborHrs = parseFloat(n.totalLaborHrs || 0);
      const totalLaborCost = parseFloat(n.totalLaborCost || 0);
      const totalMaterialCost = parseFloat(n.totalMaterialCost || 0);
      const totalJobCost = totalLaborCost + totalMaterialCost;

      maintenanceDetailsCardHtml = `
        <div class="maint-details-card" style="padding:16px;background:var(--card-bg);border:1px solid var(--border-color);border-radius:8px;margin-bottom:16px;display:flex;flex-direction:column;gap:12px">
          <div style="font-size:11px;font-weight:700;color:var(--text-tertiary);text-transform:uppercase;letter-spacing:0.5px;display:flex;align-items:center;gap:6px">
            <span class="material-icons-outlined" style="font-size:16px;color:var(--color-primary)">settings_suggest</span>
            Service Maintenance & Job Info
          </div>
          
          <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px">
            <div>
              <div style="font-size:11px;color:var(--text-tertiary);font-weight:600">Service Plan</div>
              <div style="font-size:13px;font-weight:500;color:var(--text-primary)">${escapeHTML(linkedPlan?.name || n.title || '—')}</div>
            </div>
            <div>
              <div style="font-size:11px;color:var(--text-tertiary);font-weight:600">Frequency / Trigger</div>
              <div style="font-size:13px;font-weight:500;color:var(--text-primary)">
                ${escapeHTML(linkedPlan?.frequency || 'Scheduled')} (${escapeHTML(linkedPlan?.triggerType || 'Calendar')})
              </div>
            </div>
          </div>

          <div style="border-top:1px solid var(--border-color);padding-top:10px;display:grid;grid-template-columns:1fr 1fr;gap:12px">
            <div>
              <div style="font-size:11px;color:var(--text-tertiary);font-weight:600">Asset Name</div>
              <div style="font-size:13px;font-weight:500;color:var(--text-primary)">${escapeHTML(linkedAsset?.name || '—')}</div>
            </div>
            <div>
              <div style="font-size:11px;color:var(--text-tertiary);font-weight:600">Asset Type & S/N</div>
              <div style="font-size:13px;font-weight:500;color:var(--text-primary)">
                ${escapeHTML(linkedAsset?.type || '—')} · S/N: ${escapeHTML(linkedAsset?.serial || '—')}
              </div>
            </div>
          </div>

          <div style="border-top:1px solid var(--border-color);padding-top:10px;display:grid;grid-template-columns:1fr 1fr;gap:12px">
            <div>
              <div style="font-size:11px;color:var(--text-tertiary);font-weight:600">Customer</div>
              <div style="font-size:13px;font-weight:500;color:var(--text-primary)">${escapeHTML(customer?.company || customer?.name || n.customerName || '—')}</div>
            </div>
            <div>
              <div style="font-size:11px;color:var(--text-tertiary);font-weight:600">Location / Site</div>
              <div style="font-size:13px;font-weight:500;color:var(--text-primary)">
                ${escapeHTML(linkedAsset?.site || n.siteName || 'Main Office')}${customer?.address ? `<br><span style="font-size:11px;color:var(--text-secondary)">${escapeHTML(customer.address)}</span>` : ''}
              </div>
            </div>
          </div>

          <div style="border-top:1px solid var(--border-color);padding-top:10px;display:grid;grid-template-columns:1fr 1fr;gap:12px">
            <div>
              <div style="font-size:11px;color:var(--text-tertiary);font-weight:600">Target Due Date</div>
              <div style="font-size:13px;font-weight:600;color:var(--color-primary-dark)">
                ${n.targetServiceDate 
                  ? new Date(n.targetServiceDate).toLocaleDateString('en-AU', { day: 'numeric', month: 'short', year: 'numeric' })
                  : n.currentMeterAtTrigger 
                    ? `Milestone: ${parseFloat(n.currentMeterAtTrigger) + (linkedPlan ? parseFloat(linkedPlan.meterInterval || 0) : 0)} ${escapeHTML(linkedAsset?.meterUnit || 'hrs')}`
                    : '—'}
              </div>
            </div>
            <div>
              <div style="font-size:11px;color:var(--text-tertiary);font-weight:600">Current Reading</div>
              <div style="font-size:13px;font-weight:500;color:var(--text-primary)">
                ${linkedAsset?.currentMeter ? `${escapeHTML(linkedAsset.currentMeter)} ${escapeHTML(linkedAsset.meterUnit || 'hrs')}` : '—'}
              </div>
            </div>
          </div>
        </div>

        <!-- Interactive Technician Assignment & Reschedule Options -->
        <div style="padding:16px;background:var(--bg-color);border:1px solid var(--border-color);border-radius:8px;margin-bottom:16px;display:flex;flex-direction:column;gap:14px">
          <div style="font-size:11px;font-weight:700;color:var(--text-tertiary);text-transform:uppercase;letter-spacing:0.5px;display:flex;align-items:center;gap:6px">
            <span class="material-icons-outlined" style="font-size:16px;color:var(--color-primary)">tune</span>
            Dispatch Controls & Scheduling
          </div>

          <!-- Assign Technician -->
          <div>
            <label class="form-label" style="font-weight:600;font-size:12px;margin-bottom:4px;display:flex;align-items:center;gap:6px">
              <span class="material-icons-outlined" style="font-size:16px;color:var(--color-primary)">person_add</span>
              Assign Technician
            </label>
            <select class="form-select" id="notif-assign-tech" style="height:36px">
              <option value="">-- Unassigned (Pending) --</option>
              ${technicians.map(t => `<option value="${t.id}" ${defaultTechId === t.id ? 'selected' : ''}>${escapeHTML(t.name)}</option>`).join('')}
            </select>
            <div style="font-size:11px;color:var(--text-tertiary);margin-top:2px">Autofilled if plan has default technician. Job will be auto-scheduled upon dispatch.</div>
          </div>

          <!-- Reschedule Occurrence -->
          <div style="border-top:1px solid var(--border-color);padding-top:12px">
            <label class="form-label" style="font-weight:600;font-size:12px;margin-bottom:4px;display:flex;align-items:center;gap:6px">
              <span class="material-icons-outlined" style="font-size:16px;color:var(--color-primary)">event</span>
              Reschedule Occurrence
            </label>
            <div style="display:flex;gap:8px">
              <input type="date" class="form-input" id="notif-reschedule-date" value="${n.targetServiceDate || n.dueDate || ''}" style="height:36px;flex:1" />
              <button type="button" class="btn btn-secondary btn-sm" id="btn-reschedule-occurrence" style="height:36px;white-space:nowrap;padding:0 12px">
                <span class="material-icons-outlined" style="font-size:16px">update</span> Reschedule
              </button>
            </div>
          </div>
        </div>

        <!-- Required Parts & Financial Breakdown -->
        ${materialsList.length > 0 ? `
          <div style="padding:16px;background:var(--bg-color);border:1px solid var(--border-color);border-radius:8px;margin-bottom:16px;display:flex;flex-direction:column;gap:10px">
            <div style="font-size:11px;font-weight:700;color:var(--text-tertiary);text-transform:uppercase;letter-spacing:0.5px">Required Parts & Job Estimates</div>
            <table style="width:100%;font-size:12px;border-collapse:collapse">
              <thead>
                <tr style="border-bottom:1px solid var(--border-color);text-align:left;color:var(--text-tertiary)">
                  <th style="padding:4px">Required Part</th>
                  <th style="padding:4px;text-align:center">Qty</th>
                  <th style="padding:4px;text-align:right">Cost</th>
                </tr>
              </thead>
              <tbody>
                ${materialsList.map(m => `
                  <tr style="border-bottom:1px dashed var(--border-color)">
                    <td style="padding:6px 4px;font-weight:500">${escapeHTML(m.name)}</td>
                    <td style="padding:6px 4px;text-align:center">${m.quantity}</td>
                    <td style="padding:6px 4px;text-align:right">$${((m.unitCost || 0) * (m.quantity || 1)).toFixed(2)}</td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
            <div style="display:flex;justify-content:space-between;padding-top:8px;border-top:1px solid var(--border-color);font-size:12px;color:var(--text-secondary)">
              <span>Est. Labor: ${totalLaborHrs} hrs ($${totalLaborCost.toFixed(2)})</span>
              <span>Parts: $${totalMaterialCost.toFixed(2)}</span>
            </div>
            <div style="display:flex;justify-content:space-between;font-size:13px;font-weight:700;color:var(--text-primary)">
              <span>Total Estimated Job Value:</span>
              <span style="color:var(--color-primary)">$${totalJobCost.toLocaleString('en-AU', { minimumFractionDigits: 2 })}</span>
            </div>
          </div>
        ` : ''}
      `;
    }

    // Build linked references section
    let referencesHtml = '';
    if (linkedQuote || linkedAsset || linkedPlan || n.targetServiceDate || n.convertedTo || n.jobId) {
      referencesHtml = `
        <div style="padding:14px;background:var(--bg-color);border:1px solid var(--border-color);border-radius:8px;display:flex;flex-direction:column;gap:12px">
          <div style="font-size:11px;font-weight:700;color:var(--text-tertiary);text-transform:uppercase;letter-spacing:0.5px">Linked References</div>
          ${linkedQuote ? `
            <div style="display:flex;justify-content:space-between;align-items:center">
              <div>
                <div style="font-size:11px;color:var(--text-tertiary);font-weight:600">Linked Quote</div>
                <div style="font-size:14px;font-weight:600;color:var(--color-primary);cursor:pointer" class="drawer-link-quote" data-id="${linkedQuote.id}">${escapeHTML(linkedQuote.number)} — ${escapeHTML(linkedQuote.title || linkedQuote.customerName || 'Untitled')}</div>
                <div style="font-size:12px;color:var(--text-secondary);margin-top:2px">Total: $${(linkedQuote.total || linkedQuote.subtotal || 0).toLocaleString('en-AU', { minimumFractionDigits: 2 })} · Status: ${escapeHTML(linkedQuote.status || '—')}</div>
              </div>
              <span class="material-icons-outlined" style="font-size:18px;color:var(--text-tertiary)">request_quote</span>
            </div>
          ` : ''}
          ${linkedAsset ? `
            <div style="display:flex;justify-content:space-between;align-items:center;${linkedQuote ? 'border-top:1px solid var(--border-color);padding-top:12px' : ''}">
              <div>
                <div style="font-size:11px;color:var(--text-tertiary);font-weight:600">Asset</div>
                <div style="font-size:14px;font-weight:600;color:var(--text-primary)">${escapeHTML(linkedAsset.name)}</div>
                <div style="font-size:12px;color:var(--text-secondary);margin-top:2px">${escapeHTML(linkedAsset.type || '')}${linkedAsset.site ? ` · Site: ${escapeHTML(linkedAsset.site)}` : ''}${linkedAsset.serial ? ` · S/N: ${escapeHTML(linkedAsset.serial)}` : ''}</div>
              </div>
              <span class="material-icons-outlined" style="font-size:18px;color:var(--text-tertiary)">precision_manufacturing</span>
            </div>
          ` : ''}
          ${linkedPlan ? `
            <div style="display:flex;justify-content:space-between;align-items:center;border-top:1px solid var(--border-color);padding-top:12px">
              <div>
                <div style="font-size:11px;color:var(--text-tertiary);font-weight:600">Maintenance Plan</div>
                <div style="font-size:14px;font-weight:600;color:var(--text-primary)">${escapeHTML(linkedPlan.name)}</div>
                <div style="font-size:12px;color:var(--text-secondary);margin-top:2px">Frequency: ${escapeHTML(linkedPlan.frequency || '—')} · Trigger: ${escapeHTML(linkedPlan.triggerType || '—')}</div>
              </div>
              <span class="material-icons-outlined" style="font-size:18px;color:var(--text-tertiary)">event_repeat</span>
            </div>
          ` : ''}
          ${n.targetServiceDate ? `
            <div style="display:flex;justify-content:space-between;align-items:center;border-top:1px solid var(--border-color);padding-top:12px">
              <div>
                <div style="font-size:11px;color:var(--text-tertiary);font-weight:600">Target Service Date</div>
                <div style="font-size:14px;font-weight:600;color:var(--text-primary)">${new Date(n.targetServiceDate).toLocaleDateString('en-AU', { day: 'numeric', month: 'long', year: 'numeric' })}</div>
              </div>
              <span class="material-icons-outlined" style="font-size:18px;color:var(--text-tertiary)">calendar_month</span>
            </div>
          ` : ''}
          ${n.jobId ? `
            <div style="display:flex;justify-content:space-between;align-items:center;border-top:1px solid var(--border-color);padding-top:12px">
              <div>
                <div style="font-size:11px;color:var(--text-tertiary);font-weight:600">Related Job</div>
                <div style="font-size:14px;font-weight:600;color:var(--color-primary);cursor:pointer" class="drawer-link-job" data-id="${n.jobId}">${escapeHTML(n.jobId)}</div>
              </div>
              <span class="material-icons-outlined" style="font-size:18px;color:var(--text-tertiary)">build</span>
            </div>
          ` : ''}
          ${n.convertedTo ? `
            <div style="display:flex;justify-content:space-between;align-items:center;border-top:1px solid var(--border-color);padding-top:12px">
              <div>
                <div style="font-size:11px;color:var(--text-tertiary);font-weight:600">Converted To</div>
                <div style="font-size:14px;font-weight:700;color:var(--color-success)">${escapeHTML(n.convertedTo)}</div>
              </div>
              <span class="material-icons-outlined" style="font-size:18px;color:var(--color-success)">check_circle</span>
            </div>
          ` : ''}
        </div>
      `;
    }

    showDrawer({
      title: `Notification Details`,
      width: 480,
      content: `
        <div style="display:flex;flex-direction:column;gap:16px;">
          <div>
            <label class="form-label">Status</label>
            <div><span class="badge ${n.status === 'Converted' ? 'badge-success' : 'badge-warning'}">${escapeHTML(n.status)}</span></div>
          </div>
          <div>
            <label class="form-label">Subject</label>
            <div style="font-size:16px;font-weight:500">${escapeHTML(n.title)}</div>
          </div>
          <div>
            <label class="form-label">Description / Fault</label>
            <div style="padding:12px;background:var(--bg-color);border:1px solid var(--border-color);border-radius:4px;white-space:pre-wrap;font-size:14px">${escapeHTML(n.description)}</div>
          </div>
          <div style="display:flex;gap:32px">
            <div>
              <label class="form-label">Priority</label>
              <div>${escapeHTML(n.priority || 'Normal')}</div>
            </div>
            <div>
              <label class="form-label">Raised By</label>
              <div>${escapeHTML(n.createdBy || 'System')}</div>
            </div>
            <div>
              <label class="form-label">Date</label>
              <div>${n.createdAt ? new Date(n.createdAt).toLocaleDateString() : '—'}</div>
            </div>
          </div>
          ${maintenanceDetailsCardHtml}
          ${referencesHtml}
        </div>
      `,
      actions: (() => {
        const linkedJobId = n.jobId || (n.link && n.link.startsWith('/jobs/') ? n.link.split('/').pop() : null);
        const linkedQuoteId = n.quoteId || (n.link && n.link.startsWith('/quotes/') ? n.link.split('/').pop() : null);

        if (n.status === 'Converted' || linkedJobId || linkedQuoteId) {
          const acts = [{ label: 'Close', className: 'btn-secondary', onClick: close => close() }];
          if (linkedQuoteId) {
            acts.push({ label: 'View Quote', className: 'btn-secondary', onClick: close => { close(); router.navigate(`/quotes/${linkedQuoteId}`); } });
          }
          if (linkedJobId) {
            acts.push({ label: 'View Job', className: 'btn-primary', onClick: close => { close(); router.navigate(`/jobs/${linkedJobId}`); } });
          }
          return acts;
        }

        const isMaintenanceNotif = n.type === 'Recurring Job Due' || n.maintenancePlanId;

        return [
          { label: 'Close', className: 'btn-secondary', onClick: close => close() },
          { label: 'Edit', className: 'btn-secondary', onClick: close => { close(); openNotificationFormDrawer(n); } },
          { label: 'Convert to Quote', className: 'btn-secondary', onClick: close => { close(); convertToQuote(n.id); } },
          { 
            label: isMaintenanceNotif ? 'Dispatch Job' : 'Convert to Job', 
            className: 'btn-primary', 
            onClick: close => { close(); convertToJob(n.id); } 
          }
        ];
      })(),
      onMount: (drawerEl) => {
        drawerEl.querySelector('.drawer-link-quote')?.addEventListener('click', () => {
          drawerEl.querySelector('.drawer-close-btn')?.click();
          router.navigate(`/quotes/${linkedQuote.id}`);
        });
        drawerEl.querySelector('.drawer-link-job')?.addEventListener('click', () => {
          drawerEl.querySelector('.drawer-close-btn')?.click();
          router.navigate(`/jobs/${n.jobId}`);
        });

        // Technician assignment listener
        drawerEl.querySelector('#notif-assign-tech')?.addEventListener('change', (e) => {
          const newTechId = e.target.value || null;
          store.update('notifications', n.id, { technicianId: newTechId });
          n.technicianId = newTechId;
          showToast('Technician assignment updated', 'success');
        });

        // Reschedule occurrence listener
        drawerEl.querySelector('#btn-reschedule-occurrence')?.addEventListener('click', () => {
          const newDate = drawerEl.querySelector('#notif-reschedule-date')?.value;
          if (!newDate) {
            showToast('Please select a valid target date', 'error');
            return;
          }
          store.update('notifications', n.id, { targetServiceDate: newDate, dueDate: newDate });
          n.targetServiceDate = newDate;
          n.dueDate = newDate;
          if (linkedPlan) {
            store.update('maintenancePlans', linkedPlan.id, { nextServiceDate: newDate });
          }
          showToast(`Occurrence rescheduled to ${newDate}`, 'success');
          renderNotificationsList(container);
        });
      }
    });
  }

  function convertToQuote(id) {
    const n = store.getById('notifications', id);
    if (!n) return;
    
    // Create Quote directly
    const quote = store.create('quotes', {
      number: store.getNextNumber('Q-', 'quotes'),
      title: n.title,
      description: n.description,
      priority: n.priority,
      status: 'Draft',
      notes: `Generated from Notification: ${n.title}\n\n${n.description}`,
      createdAt: new Date().toISOString(),
      customerId: n.customerId || '',
      customerName: n.customerName || '',
      contactName: n.contactName || ''
    });

    // Update Notification status
    store.update('notifications', id, { status: 'Converted', convertedTo: `Quote ${quote.number}` });
    
    showToast('Converted to Quote successfully', 'success');
    router.navigate(`/quotes/${quote.id}`);
  }

  function convertToJob(id) {
    const n = store.getById('notifications', id);
    if (!n) return;
    
    function compileJobTasks(mainTemplateId, mergedTemplateIds = []) {
      const allTasks = [];
      const templateIds = [mainTemplateId, ...mergedTemplateIds].filter(Boolean);
      
      templateIds.forEach(tid => {
        const template = store.getById('taskTemplates', tid);
        if (template && template.tasks) {
          const clonedTasks = JSON.parse(JSON.stringify(template.tasks));
          clonedTasks.forEach(task => {
            task.id = store.generateId();
            task.status = 'Not Started';
            task.progress = 0;
            task.startDate = new Date().toISOString();
            task.technicians = [];
            if (task.subTasks) {
              task.subTasks.forEach(st => {
                st.id = store.generateId();
                st.status = 'Not Started';
                st.progress = 0;
                st.startDate = new Date().toISOString();
                st.technicians = [];
              });
            }
          });
          allTasks.push(...clonedTasks);
        }
      });
      return allTasks;
    }

    function cleanTitle(title) {
      let t = title || '';
      t = t.replace(/^(Usage\s+)?Maintenance\s+Due:\s*/i, '');
      t = t.replace(/\s+-\s+/g, ' — ');
      
      const parts = t.split(' — ');
      if (parts.length >= 2) {
        const assetName = parts[0].trim();
        let planName = parts[1].trim();
        
        const assetWords = assetName.toLowerCase().split(/\s+/);
        const planWords = planName.split(/\s+/);
        let matchCount = 0;
        for (let i = 0; i < Math.min(assetWords.length, planWords.length); i++) {
          if (assetWords[i] === planWords[i].toLowerCase()) {
            matchCount++;
          } else {
            break;
          }
        }
        if (matchCount > 0) {
          planName = planWords.slice(matchCount).join(' ');
        }
        planName = planName.replace(/\s+(Plan|Service Plan)$/i, '');
        t = `${assetName} — ${planName}`;
      }
      return t;
    }

    const cleanedTitle = cleanTitle(n.title);

    const assignedTechId = n.technicianId || (n.maintenancePlanId ? store.getById('maintenancePlans', n.maintenancePlanId)?.defaultTechnicianId : null);
    const techObj = assignedTechId ? store.getById('technicians', assignedTechId) : null;

    let jobData = {
      number: store.getNextNumber('J-', 'jobs'),
      title: cleanedTitle,
      description: n.description,
      priority: n.priority || 'Normal',
      status: assignedTechId ? 'Scheduled' : 'Pending',
      technicianId: assignedTechId || undefined,
      technicianName: techObj ? techObj.name : '',
      technicians: assignedTechId ? [{ id: assignedTechId, name: techObj ? techObj.name : '' }] : [],
      scheduledDate: n.targetServiceDate || n.dueDate || todayLocalISO(),
      notes: `Generated from Notification: ${n.title}\n\n${n.description}`,
      createdAt: new Date().toISOString()
    };

    if (n.mergedMaterialsList && n.mergedMaterialsList.length > 0) {
      const asset = n.assetId ? store.getById('assets', n.assetId) : null;
      const customer = asset ? store.getById('customers', asset.customerId) : null;
      
      const jobMaterials = n.mergedMaterialsList.map(item => ({
        stockId: item.stockId || null,
        name: item.name,
        quantity: item.quantity,
        unitCost: item.unitCost || 0,
        fromQuote: true
      }));

      jobData = {
        ...jobData,
        customerId: asset ? (asset.customerId || '') : '',
        customerName: customer ? customer.company : 'Internal',
        contactName: customer ? `${customer.firstName} ${customer.lastName}` : 'Unassigned',
        siteAddress: asset ? (asset.site || 'Main Office') : 'Main Office',
        assetId: asset ? asset.id : undefined,
        quoteId: n.quoteId || undefined,
        quoteNumber: n.quoteId ? (store.getById('quotes', n.quoteId)?.number || '') : '',
        materials: jobMaterials,
        laborCost: parseFloat(n.totalLaborCost || 0),
        materialCost: parseFloat(n.totalMaterialCost || 0),
        estimatedLaborCost: parseFloat(n.totalLaborCost || 0),
        estimatedMaterialCost: parseFloat(n.totalMaterialCost || 0),
        maintenancePlanId: n.maintenancePlanId || undefined,
        mergedPlanIds: n.mergedPlanIds || []
      };
    } else if (n.quoteId) {
      const asset = n.assetId ? store.getById('assets', n.assetId) : null;
      const quote = store.getById('quotes', n.quoteId);
      if (quote) {
        const customer = quote.customerId ? store.getById('customers', quote.customerId) : (asset ? store.getById('customers', asset.customerId) : null);
        
        let laborCost = 0;
        let materialCost = 0;
        const items = [];

        if (quote.sections) {
          quote.sections.forEach(sec => {
            if (sec.lineItems) items.push(...sec.lineItems);
          });
        } else if (quote.lineItems) {
          items.push(...quote.lineItems);
        }

        const jobMaterials = [];
        items.forEach(item => {
          if (item.type === 'material') {
            const sMatch = store.getAll('stock').find(s => s.name === item.description);
            jobMaterials.push({
              stockId: sMatch ? sMatch.id : null,
              name: item.description || 'Unknown Material',
              quantity: item.qty || 1,
              unitCost: sMatch ? (sMatch.costPrice || sMatch.unitPrice || 0) : 0,
              fromQuote: true
            });
            materialCost += item.total || 0;
          } else if (item.type === 'labor') {
            laborCost += item.total || 0;
          }
        });

        jobData = {
          ...jobData,
          customerId: quote.customerId || (asset ? asset.customerId : ''),
          customerName: customer ? customer.company : (quote.customerName || 'Internal'),
          contactName: customer ? `${customer.firstName} ${customer.lastName}` : (quote.contactName || 'Unassigned'),
          siteAddress: asset ? (asset.site || 'Main Office') : 'Main Office',
          assetId: asset ? asset.id : undefined,
          quoteId: quote.id,
          quoteNumber: quote.number,
          materials: jobMaterials,
          laborCost,
          materialCost,
          estimatedLaborCost: laborCost,
          estimatedMaterialCost: materialCost,
          maintenancePlanId: n.maintenancePlanId || undefined,
          mergedPlanIds: n.mergedPlanIds || []
        };
      }
    } else if (n.maintenancePlanId) {
      const asset = store.getById('assets', n.assetId);
      if (asset) {
        const customer = store.getById('customers', asset.customerId);
        jobData = {
          ...jobData,
          customerId: asset.customerId || '',
          customerName: customer ? customer.company : 'Internal',
          contactName: customer ? `${customer.firstName} ${customer.lastName}` : 'Unassigned',
          siteAddress: asset.site || 'Main Office',
          assetId: asset.id,
          maintenancePlanId: n.maintenancePlanId,
          mergedPlanIds: []
        };
      }
    } else if (n.jobId) {
      const parentJob = store.getById('jobs', n.jobId);
      if (parentJob) {
        const jobMaterials = parentJob.materials ? JSON.parse(JSON.stringify(parentJob.materials)) : [];
        const jobTasks = parentJob.tasks ? JSON.parse(JSON.stringify(parentJob.tasks)) : [];
        jobTasks.forEach(task => {
          task.id = store.generateId();
          task.status = 'Not Started';
          task.progress = 0;
          task.startDate = new Date().toISOString();
          task.technicians = [];
          if (task.subTasks) {
            task.subTasks.forEach(st => {
              st.id = store.generateId();
              st.status = 'Not Started';
              st.progress = 0;
              st.startDate = new Date().toISOString();
              st.technicians = [];
            });
          }
        });

        jobData = {
          ...jobData,
          title: parentJob.title || parentJob.number,
          parentJobId: parentJob.id,
          customerId: parentJob.customerId || '',
          customerName: parentJob.customerName || '',
          contactName: parentJob.contactName || '',
          siteAddress: parentJob.siteAddress || '',
          assetId: parentJob.assetId || undefined,
          priority: parentJob.priority || 'Normal',
          description: parentJob.description || '',
          materials: jobMaterials,
          laborCost: parentJob.laborCost || 0,
          materialCost: parentJob.materialCost || 0,
          estimatedLaborCost: parentJob.estimatedLaborCost || 0,
          estimatedMaterialCost: parentJob.estimatedMaterialCost || 0,
          isRecurring: false,
          recurringConfig: null,
          tasks: jobTasks,
        };
      }
    } else if (n.customerId) {
      const customer = store.getById('customers', n.customerId);
      const asset = n.assetId ? store.getById('assets', n.assetId) : null;
      let siteAddress = 'Main Office';
      if (n.siteName && customer && customer.sites) {
        const matchingSite = customer.sites.find(s => s.name === n.siteName);
        if (matchingSite) siteAddress = matchingSite.address || matchingSite.name;
      }
      jobData = {
        ...jobData,
        customerId: n.customerId,
        customerName: customer ? customer.company : (n.customerName || 'Internal'),
        contactName: n.contactName || (customer ? `${customer.firstName} ${customer.lastName}` : 'Unassigned'),
        siteAddress: siteAddress,
        siteName: n.siteName || '',
        assetId: n.assetId || undefined
      };
    }

    let tasks = [];
    if (n.taskTemplateId || (n.mergedTaskTemplateIds && n.mergedTaskTemplateIds.length > 0)) {
      tasks = compileJobTasks(n.taskTemplateId, n.mergedTaskTemplateIds || []);
    }
    if (tasks.length > 0) {
      jobData.tasks = tasks;
    }

    if (n.dueDate) {
      jobData.scheduledDate = n.dueDate;
    }

    // Create Job directly
    const job = store.create('jobs', jobData);

    // Update Notification status
    store.update('notifications', id, { status: 'Converted', convertedTo: `Job ${job.number}` });
    
    showToast('Converted to Job successfully', 'success');
    router.navigate(`/jobs/${job.id}`);
  }

  if (params && params.id) {
    const targetNotif = allNotifications.find(n => n.id === params.id);
    if (targetNotif) {
      setTimeout(() => {
        openNotificationDetails(targetNotif);
      }, 50);
    }
  }
}

