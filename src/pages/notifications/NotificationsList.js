import { store } from '../../data/store.js';
import { router } from '../../router.js';
import { showDrawer } from '../../components/Drawer.js';
import { showToast } from '../../components/Notifications.js';
import { escapeHTML } from '../../utils/security.js';
import { createDataTable } from '../../components/DataTable.js';
import { createBulkActionBar } from '../../components/BulkActionBar.js';

export function renderNotificationsList(container, params) {
  const allNotifications = store.getAll('notifications') || [];
  let searchTerm = '';
  let activeFilter = 'all';
  
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
      return matchesSearch && matchesFilter;
    });
  }

  container.innerHTML = `
    <div class="page-header">
      <h1>Notifications</h1>
      <div class="page-header-actions">
        <button class="btn btn-primary" id="btn-raise-notification">
          <span class="material-icons-outlined">campaign</span> Raise Notification
        </button>
      </div>
    </div>

    <div class="page-toolbar">
      <div class="toolbar-filters">
        <button class="toolbar-filter ${activeFilter === 'all' ? 'active' : ''}" data-filter="all">All (${allNotifications.length})</button>
        <button class="toolbar-filter ${activeFilter === 'Pending' ? 'active' : ''}" data-filter="Pending">Pending (${allNotifications.filter(n => n.status === 'Pending').length})</button>
        <button class="toolbar-filter ${activeFilter === 'Converted' ? 'active' : ''}" data-filter="Converted">Converted (${allNotifications.filter(n => n.status === 'Converted').length})</button>
      </div>
      <div class="toolbar-search">
        <span class="material-icons-outlined">search</span>
        <input type="text" id="notif-search" placeholder="Search notifications..." value="${escapeHTML(searchTerm)}" />
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
      key: 'createdAt', 
      label: 'Date', 
      render: (n) => n.createdAt ? new Date(n.createdAt).toLocaleDateString() : '—',
      getValue: (n) => n.createdAt ? new Date(n.createdAt).getTime() : 0,
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
      label: 'Title / Job Name', 
      render: (n) => {
        const isPortal = n.source === 'customer_portal' || 
                        (n.message && n.message.toLowerCase().includes('via portal')) ||
                        (n.description && n.description.toLowerCase().includes('via portal')) ||
                        (n.title && n.title.toLowerCase().includes('via portal'));
        
        const portalIcon = isPortal 
          ? `<span class="material-icons-outlined" style="font-size:18px;color:var(--color-primary);margin-right:6px;vertical-align:middle;" title="Submitted via Customer Portal">open_in_browser</span>` 
          : '';

        const linkedAsset = n.assetId ? store.getById('assets', n.assetId) : null;
        const linkedPlan = n.maintenancePlanId ? store.getById('maintenancePlans', n.maintenancePlanId) : null;
        
        return `
          <div style="font-weight:500;display:flex;align-items:center;">
            ${portalIcon}<span>${escapeHTML(n.title)}</span>
          </div>
          <div class="text-tertiary" style="font-size:12px;max-width:300px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${escapeHTML(n.description || n.message || '')}</div>
          ${n.type === 'Recurring Job Due' ? `
            <div style="display:flex;flex-wrap:wrap;gap:8px;margin-top:4px;font-size:11px">
              <span style="display:inline-flex;align-items:center;gap:3px;color:var(--text-secondary);background:var(--bg-color);padding:2px 6px;border-radius:4px;border:1px solid var(--border-color)">
                <span class="material-icons-outlined" style="font-size:12px">precision_manufacturing</span>
                ${escapeHTML(linkedAsset?.name || 'Asset')}
              </span>
              <span style="display:inline-flex;align-items:center;gap:3px;color:var(--text-secondary);background:var(--bg-color);padding:2px 6px;border-radius:4px;border:1px solid var(--border-color)">
                <span class="material-icons-outlined" style="font-size:12px">place</span>
                ${escapeHTML(linkedAsset?.site || 'Main Office')}
              </span>
              <span style="display:inline-flex;align-items:center;gap:3px;color:var(--color-primary-dark);background:var(--color-primary-light);padding:2px 6px;border-radius:4px;font-weight:600">
                <span class="material-icons-outlined" style="font-size:12px">calendar_month</span>
                Due: ${n.targetServiceDate 
                  ? new Date(n.targetServiceDate).toLocaleDateString('en-AU')
                  : n.currentMeterAtTrigger 
                    ? `${parseFloat(n.currentMeterAtTrigger) + (linkedPlan ? parseFloat(linkedPlan.meterInterval || 0) : 0)} ${escapeHTML(linkedAsset?.meterUnit || 'hrs')}`
                    : '—'}
              </span>
            </div>
          ` : ''}
          ${n.type === 'Recurring Job Created' ? `
            <div style="display:flex;flex-wrap:wrap;gap:8px;margin-top:4px;font-size:11px">
              <span style="display:inline-flex;align-items:center;gap:3px;color:var(--color-primary-dark);background:var(--color-primary-light);padding:2px 6px;border-radius:4px;font-weight:600">
                <span class="material-icons-outlined" style="font-size:12px">build</span>
                Job Spawned: Due ${n.dueDate ? new Date(n.dueDate).toLocaleDateString('en-AU') : '—'}
              </span>
            </div>
          ` : ''}
        `;
      }
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
      render: (n) => `<span class="badge ${n.status === 'Converted' ? 'badge-success' : 'badge-warning'}">${escapeHTML(n.status)}</span>`,
      width: '110px'
    },

    {
      key: 'actions',
      label: '',
      render: (n) => `
        <div style="text-align:right">
          ${n.status !== 'Converted' ? `
            <button class="btn btn-sm btn-ghost btn-convert-quote" data-id="${n.id}" title="Convert to Quote"><span class="material-icons-outlined">request_quote</span></button>
            <button class="btn btn-sm btn-ghost btn-convert-job" data-id="${n.id}" title="Convert to Job"><span class="material-icons-outlined">build</span></button>
          ` : ''}
          <button class="btn btn-sm btn-ghost btn-view-notification" data-id="${n.id}" title="View Details"><span class="material-icons-outlined">visibility</span></button>
          <button class="btn btn-sm btn-ghost btn-edit-notification" data-id="${n.id}" title="Edit"><span class="material-icons-outlined">edit</span></button>
        </div>
      `,
      width: '150px'
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

  const searchInput = container.querySelector('#notif-search');
  searchInput.addEventListener('input', (e) => {
    searchTerm = e.target.value;
    table.updateData(getFilteredData());
  });

  container.querySelectorAll('.toolbar-filter').forEach(btn => {
    btn.addEventListener('click', () => {
      container.querySelectorAll('.toolbar-filter').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      activeFilter = btn.dataset.filter;
      table.updateData(getFilteredData());
    });
  });

  container.querySelector('#btn-raise-notification').addEventListener('click', () => openNotificationFormDrawer());

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

    // Build maintenance plan details card if relevant
    let maintenanceDetailsCardHtml = '';
    if (n.type === 'Recurring Job Due') {
      maintenanceDetailsCardHtml = `
        <div class="maint-details-card" style="padding:16px;background:var(--bg-color);border:1px solid var(--border-color);border-radius:8px;margin-bottom:16px;display:flex;flex-direction:column;gap:12px">
          <div style="font-size:11px;font-weight:700;color:var(--text-tertiary);text-transform:uppercase;letter-spacing:0.5px;display:flex;align-items:center;gap:6px">
            <span class="material-icons-outlined" style="font-size:16px;color:var(--color-primary)">settings_suggest</span>
            Service Maintenance Details
          </div>
          
          <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px">
            <div>
              <div style="font-size:11px;color:var(--text-tertiary);font-weight:600">Service Plan</div>
              <div style="font-size:13px;font-weight:500;color:var(--text-primary)">${escapeHTML(linkedPlan?.name || '—')}</div>
            </div>
            <div>
              <div style="font-size:11px;color:var(--text-tertiary);font-weight:600">Frequency / Trigger</div>
              <div style="font-size:13px;font-weight:500;color:var(--text-primary)">
                ${escapeHTML(linkedPlan?.frequency || '—')} (${escapeHTML(linkedPlan?.triggerType || '—')})
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
              <div style="font-size:13px;font-weight:500;color:var(--text-primary)">${escapeHTML(customer?.company || customer?.name || '—')}</div>
            </div>
            <div>
              <div style="font-size:11px;color:var(--text-tertiary);font-weight:600">Location / Site</div>
              <div style="font-size:13px;font-weight:500;color:var(--text-primary)">
                ${escapeHTML(linkedAsset?.site || 'Main Office')}${customer?.address ? `<br><span style="font-size:11px;color:var(--text-secondary)">${escapeHTML(customer.address)}</span>` : ''}
              </div>
            </div>
          </div>

          <div style="border-top:1px solid var(--border-color);padding-top:10px;display:grid;grid-template-columns:1fr 1fr;gap:12px">
            <div>
              <div style="font-size:11px;color:var(--text-tertiary);font-weight:600">Due / Milestone</div>
              <div style="font-size:13px;font-weight:600;color:var(--color-primary-dark)">
                ${n.targetServiceDate 
                  ? new Date(n.targetServiceDate).toLocaleDateString('en-AU', { day: 'numeric', month: 'long', year: 'numeric' })
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
      actions: n.type === 'Recurring Job Created' ? [
        { label: 'Close', className: 'btn-secondary', onClick: close => close() },
        { label: 'View Job', className: 'btn-primary', onClick: close => { close(); router.navigate(`/jobs/${n.jobId}`); } }
      ] : (n.status !== 'Converted' ? [
        { label: 'Close', className: 'btn-secondary', onClick: close => close() },
        { label: 'Edit', className: 'btn-secondary', onClick: close => { close(); openNotificationFormDrawer(n); } },
        { label: 'Convert to Quote', className: 'btn-secondary', onClick: close => { close(); convertToQuote(n.id); } },
        { label: 'Convert to Job', className: 'btn-primary', onClick: close => { close(); convertToJob(n.id); } }
      ] : [
        { label: 'Close', className: 'btn-secondary', onClick: close => close() }
      ]),
      onMount: (drawerEl) => {
        drawerEl.querySelector('.drawer-link-quote')?.addEventListener('click', () => {
          drawerEl.querySelector('.drawer-close-btn')?.click();
          router.navigate(`/quotes/${linkedQuote.id}`);
        });
        drawerEl.querySelector('.drawer-link-job')?.addEventListener('click', () => {
          drawerEl.querySelector('.drawer-close-btn')?.click();
          router.navigate(`/jobs/${n.jobId}`);
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

    let jobData = {
      number: `J-${Date.now().toString().slice(-6)}`,
      title: cleanedTitle,
      description: n.description,
      priority: n.priority,
      status: 'Pending',
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

