import { store } from '../../data/store.js';
import { router } from '../../router.js';
import { showDrawer } from '../../components/Drawer.js';
import { showToast } from '../../components/Notifications.js';
import { escapeHTML } from '../../utils/security.js';
import { createDataTable } from '../../components/DataTable.js';

export function renderNotificationsList(container) {
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
      render: (n) => `
        <div style="font-weight:500">${escapeHTML(n.title)}</div>
        <div class="text-tertiary" style="font-size:12px;max-width:300px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${escapeHTML(n.description)}</div>
      `
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
      key: 'createdBy', 
      label: 'Raised By',
      width: '150px'
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
    emptyIcon: 'campaign'
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
    showDrawer({
      title: `Notification Details`,
      width: 450,
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
          ${n.jobId ? `
            <div>
              <label class="form-label">Related Job ID</label>
              <div><a href="#/jobs/${n.jobId}">${escapeHTML(n.jobId)}</a></div>
            </div>
          ` : ''}
        </div>
      `,
      actions: n.status !== 'Converted' ? [
        { label: 'Close', className: 'btn-secondary', onClick: close => close() },
        { label: 'Edit', className: 'btn-secondary', onClick: close => { close(); openNotificationFormDrawer(n); } },
        { label: 'Convert to Quote', className: 'btn-secondary', onClick: close => { close(); convertToQuote(n.id); } },
        { label: 'Convert to Job', className: 'btn-primary', onClick: close => { close(); convertToJob(n.id); } }
      ] : [
        { label: 'Close', className: 'btn-secondary', onClick: close => close() }
      ]
    });
  }

  function convertToQuote(id) {
    const n = store.getById('notifications', id);
    if (!n) return;
    
    // Create Quote directly
    const quote = store.create('quotes', {
      number: `Q-${Date.now().toString().slice(-6)}`,
      title: n.title,
      description: n.description,
      priority: n.priority,
      status: 'Draft',
      notes: `Generated from Notification: ${n.title}\n\n${n.description}`,
      createdAt: new Date().toISOString()
    });

    // Update Notification status
    store.update('notifications', id, { status: 'Converted', convertedTo: `Quote ${quote.number}` });
    
    showToast('Converted to Quote successfully', 'success');
    router.navigate(`/quotes/${quote.id}`);
  }

  function convertToJob(id) {
    const n = store.getById('notifications', id);
    if (!n) return;
    
    // Create Job directly
    const job = store.create('jobs', {
      number: `J-${Date.now().toString().slice(-6)}`,
      title: n.title,
      description: n.description,
      priority: n.priority,
      status: 'Pending',
      notes: `Generated from Notification: ${n.title}\n\n${n.description}`,
      createdAt: new Date().toISOString()
    });

    // Update Notification status
    store.update('notifications', id, { status: 'Converted', convertedTo: `Job ${job.number}` });
    
    showToast('Converted to Job successfully', 'success');
    router.navigate(`/jobs/${job.id}`);
  }
}
