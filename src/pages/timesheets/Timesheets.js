// ============================================
// SIMPRO CLONE — TIMESHEETS LIST
// ============================================

import { store } from '../../data/store.js';

export function renderTimesheetsList(container) {
  const timesheets = store.getAll('timesheets').sort((a, b) => new Date(b.date) - new Date(a.date));
  let filterStatus = 'All';

  function render() {
    const filtered = filterStatus === 'All' ? timesheets : timesheets.filter(t => t.status === filterStatus);
    
    // Stats calculation
    const totalPending = timesheets.filter(t => t.status === 'Pending').reduce((s, t) => s + (t.hours || 0), 0);
    const totalApproved = timesheets.filter(t => t.status === 'Approved').reduce((s, t) => s + (t.hours || 0), 0);
    
    container.innerHTML = `
      <div class="page-header">
        <h1>Timesheets & Approval</h1>
        <div class="page-header-actions">
          <button class="btn btn-primary" id="btn-approve-all" ${!timesheets.some(t => t.status === 'Pending') ? 'disabled' : ''}>
            <span class="material-icons-outlined">done_all</span> Approve All Pending
          </button>
        </div>
      </div>
      
      <div class="grid-4" style="margin-bottom:var(--space-lg)">
        <div class="stat-card">
          <div class="stat-label">Pending Approval</div>
          <div class="stat-value" style="color:var(--color-warning)">${totalPending} <span style="font-size:14px;color:var(--text-secondary)">hrs</span></div>
        </div>
        <div class="stat-card">
          <div class="stat-label">Approved</div>
          <div class="stat-value" style="color:var(--color-success)">${totalApproved} <span style="font-size:14px;color:var(--text-secondary)">hrs</span></div>
        </div>
      </div>

      <div class="card" style="margin-bottom:var(--space-base)">
        <div class="card-header">
          <div style="display:flex;gap:var(--space-sm)">
            <button class="toolbar-filter ${filterStatus === 'All' ? 'active' : ''}" data-status="All">All</button>
            <button class="toolbar-filter ${filterStatus === 'Pending' ? 'active' : ''}" data-status="Pending">Pending</button>
            <button class="toolbar-filter ${filterStatus === 'Approved' ? 'active' : ''}" data-status="Approved">Approved</button>
            <button class="toolbar-filter ${filterStatus === 'Rejected' ? 'active' : ''}" data-status="Rejected">Rejected</button>
          </div>
        </div>
        <div class="card-body" style="padding:0">
          <table class="data-table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Technician</th>
                <th>Job</th>
                <th>Description</th>
                <th style="text-align:right">Hours</th>
                <th>Status</th>
                <th style="text-align:right">Actions</th>
              </tr>
            </thead>
            <tbody>
              ${filtered.length ? filtered.map(t => `
                <tr data-id="${t.id}">
                  <td>${new Date(t.date).toLocaleDateString()}</td>
                  <td class="font-medium">${t.technicianName}</td>
                  <td><a href="#/jobs/${t.jobId}" class="cell-link">${t.jobNumber || t.jobId}</a></td>
                  <td class="text-secondary">${t.description || '—'}</td>
                  <td style="text-align:right;font-weight:600">${t.hours}</td>
                  <td><span class="badge ${t.status === 'Approved' ? 'badge-success' : t.status === 'Rejected' ? 'badge-danger' : 'badge-warning'}">${t.status}</span></td>
                  <td style="text-align:right">
                    ${t.status === 'Pending' ? `
                      <button class="btn btn-sm btn-ghost btn-icon btn-approve" title="Approve"><span class="material-icons-outlined" style="color:var(--color-success)">check_circle</span></button>
                      <button class="btn btn-sm btn-ghost btn-icon btn-reject" title="Reject"><span class="material-icons-outlined" style="color:var(--color-danger)">cancel</span></button>
                    ` : '—'}
                  </td>
                </tr>
              `).join('') : `<tr><td colspan="7" style="text-align:center;padding:40px" class="text-secondary">No ${filterStatus !== 'All' ? filterStatus.toLowerCase() : ''} timesheets found</td></tr>`}
            </tbody>
          </table>
        </div>
      </div>
    `;

    bindEvents();
  }

  function bindEvents() {
    container.querySelectorAll('.toolbar-filter').forEach(btn => {
      btn.addEventListener('click', () => { filterStatus = btn.dataset.status; render(); });
    });

    container.querySelectorAll('.btn-approve').forEach(btn => {
      btn.addEventListener('click', () => {
        const id = btn.closest('tr').dataset.id;
        const ts = timesheets.find(t => t.id === id);
        if (ts) {
          ts.status = 'Approved';
          store.update('timesheets', id, { status: 'Approved' });
          render();
        }
      });
    });

    container.querySelectorAll('.btn-reject').forEach(btn => {
      btn.addEventListener('click', () => {
        const id = btn.closest('tr').dataset.id;
        const ts = timesheets.find(t => t.id === id);
        if (ts) {
          ts.status = 'Rejected';
          store.update('timesheets', id, { status: 'Rejected' });
          render();
        }
      });
    });

    container.querySelector('#btn-approve-all')?.addEventListener('click', () => {
      timesheets.filter(t => t.status === 'Pending').forEach(ts => {
        ts.status = 'Approved';
        store.update('timesheets', ts.id, { status: 'Approved' });
      });
      render();
    });
  }

  render();
}
