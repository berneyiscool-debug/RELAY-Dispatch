// ============================================
// SIMPRO CLONE — TIMESHEETS LIST
// ============================================

import { store } from '../../data/store.js';
import { router } from '../../router.js';
import { showToast } from '../../components/Notifications.js';
import { showModal } from '../../components/Modal.js';
import { escapeHTML } from '../../utils/security.js';

export function renderTimesheetsList(container) {
  const currentUser = JSON.parse(sessionStorage.getItem('currentUser') || '{"role":"admin"}');
  const userType = currentUser.userTypeId ? store.getById('userTypes', currentUser.userTypeId) : null;
  const permissions = userType ? userType.permissions?.find(p => p.module === 'Timesheets') : null;

  let filterStatus = 'All';
  let filterTechId = 'All';

  function render() {
    const allTimesheets = store.getAll('timesheets').sort((a, b) => new Date(b.date) - new Date(a.date));
    const technicians = store.getAll('technicians');
    
    // Enforce permissions
    let visibleTimesheets = [...allTimesheets];
    const canViewAll = currentUser.role === 'admin' || (permissions && permissions.view);
    const canViewOwn = permissions && permissions.view_own;

    if (!canViewAll && canViewOwn) {
      visibleTimesheets = visibleTimesheets.filter(t => String(t.technicianId) === String(currentUser.id));
    } else if (!canViewAll && !canViewOwn && currentUser.role !== 'admin') {
      visibleTimesheets = [];
    }

    const totalPending = visibleTimesheets.filter(t => t.status === 'Pending').reduce((s, t) => s + (t.hours || 0), 0);

    let filteredData = filterStatus === 'All' ? [...visibleTimesheets] : visibleTimesheets.filter(t => t.status === filterStatus);
    
    if (canViewAll && filterTechId !== 'All') {
      filteredData = filteredData.filter(t => String(t.technicianId) === String(filterTechId));
    }

    // Group by date
    const groups = [];
    filteredData.forEach(t => {
      const d = new Date(t.date);
      const dateStr = d.toLocaleDateString('en-AU', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
      let group = groups.find(g => g.dateStr === dateStr);
      if (!group) {
        group = { dateStr, items: [], total: 0 };
        groups.push(group);
      }
      group.items.push(t);
      group.total += (t.hours || 0);
    });

    container.innerHTML = `
      <div class="page-header">
        <h1>Timesheets & Approval</h1>
        <div class="page-header-actions">
          ${(currentUser.role === 'admin' || (permissions && permissions.approve)) ? `
            <button class="btn btn-primary" id="btn-approve-all-pending" ${!visibleTimesheets.some(t => t.status === 'Pending') ? 'disabled' : ''}>
              <span class="material-icons-outlined">done_all</span> Approve All Pending
            </button>
          ` : ''}
        </div>
      </div>
      
      <div class="grid-4" style="margin-bottom:var(--space-lg)">
        <div class="stat-card">
          <div class="stat-label">Pending Approval</div>
          <div class="stat-value" style="color:var(--color-warning)">${totalPending.toFixed(2)} <span style="font-size:14px;color:var(--text-secondary)">hrs</span></div>
        </div>
      </div>

      <div class="page-toolbar" style="display:flex; justify-content:space-between; align-items:center;">
        <div class="toolbar-filters">
          <button class="toolbar-filter ${filterStatus === 'All' ? 'active' : ''}" data-status="All">All</button>
          <button class="toolbar-filter ${filterStatus === 'Pending' ? 'active' : ''}" data-status="Pending">Pending</button>
          <button class="toolbar-filter ${filterStatus === 'Approved' ? 'active' : ''}" data-status="Approved">Approved</button>
          <button class="toolbar-filter ${filterStatus === 'Rejected' ? 'active' : ''}" data-status="Rejected">Rejected</button>
        </div>
        ${canViewAll ? `
          <div style="display:flex; align-items:center; gap:8px;">
            <label style="font-size:12px; color:var(--text-secondary); font-weight:500;">Filter by Staff:</label>
            <select class="form-select" id="filter-tech" style="width:180px; height:32px; padding:0 8px; font-size:13px;">
              <option value="All">All Technicians</option>
              ${technicians.map(t => `<option value="${t.id}" ${filterTechId === t.id ? 'selected' : ''}>${t.name}</option>`).join('')}
            </select>
          </div>
        ` : ''}
      </div>

      <div class="card">
        <div class="card-body" style="padding:0">
          <table class="data-table">
            <thead>
              <tr>
                <th style="width:120px">Date</th>
                <th>Technician</th>
                <th>Job</th>
                <th>Description</th>
                <th style="text-align:right; width:80px">Hours</th>
                <th style="width:110px">Status</th>
                <th style="width:60px; text-align:right">Actions</th>
              </tr>
            </thead>
            <tbody>
              ${groups.length === 0 ? '<tr><td colspan="7" class="text-secondary" style="text-align:center;padding:40px">No timesheets found</td></tr>' : groups.map(group => `
                <tr class="group-header" style="background:var(--content-bg); font-weight:600;">
                  <td colspan="4" style="color:var(--text-primary)">${group.dateStr}</td>
                  <td style="text-align:right; color:var(--color-primary)">${group.total.toFixed(2)} hrs</td>
                  <td></td>
                  <td></td>
                </tr>
                ${group.items.map(t => {
                  // Technicians can edit their own entries if not yet approved. Admins can edit anything.
                  const isOwner = String(t.technicianId) === String(currentUser.id);
                  const hasEditPerm = permissions ? permissions.edit === true : (currentUser.role === 'technician' && isOwner);
                  const canEdit = currentUser.role === 'admin' || (hasEditPerm && t.status !== 'Approved');

                  return `
                  <tr>
                    <td class="text-secondary" style="font-size:12px">${new Date(t.date).toLocaleDateString()}</td>
                    <td><span class="font-medium">${escapeHTML(t.technicianName)}</span></td>
                    <td><a href="#/jobs/${t.jobId}" class="cell-link">${escapeHTML(t.jobNumber || t.jobId)}</a></td>
                    <td><span class="text-secondary truncate" style="max-width:300px;display:inline-block">${escapeHTML(t.description || '—')}</span></td>
                    <td style="text-align:right; font-weight:600">${t.hours.toFixed(2)}</td>
                    <td>
                      <span class="badge ${t.status === 'Approved' ? 'badge-success' : t.status === 'Rejected' ? 'badge-danger' : 'badge-warning'}">
                        ${escapeHTML(t.status)}
                      </span>
                    </td>
                    <td style="text-align:right">
                      ${canEdit ? `
                        <button class="btn btn-ghost btn-sm btn-icon btn-edit-timesheet" data-id="${t.id}" title="Edit entry">
                          <span class="material-icons-outlined" style="font-size:18px">edit</span>
                        </button>
                      ` : ''}
                    </td>
                  </tr>
                `;}).join('')}
              `).join('')}
            </tbody>
          </table>
        </div>
      </div>
    `;

    // Filter events
    container.querySelectorAll('.toolbar-filter').forEach(btn => {
      btn.addEventListener('click', () => {
        filterStatus = btn.dataset.status;
        render();
      });
    });

    container.querySelector('#filter-tech')?.addEventListener('change', (e) => {
      filterTechId = e.target.value;
      render();
    });

    // Bulk Approve All Pending
    container.querySelector('#btn-approve-all-pending')?.addEventListener('click', () => {
      const pending = visibleTimesheets.filter(t => t.status === 'Pending');
      pending.forEach(ts => store.update('timesheets', ts.id, { status: 'Approved' }));
      showToast(`Approved ${pending.length} pending timesheets`, 'success');
      render();
    });

    // Edit entry
    container.querySelectorAll('.btn-edit-timesheet').forEach(btn => {
      btn.addEventListener('click', () => {
        openEditModal(btn.dataset.id);
      });
    });
  }

  function openEditModal(timesheetId) {
    const ts = store.getById('timesheets', timesheetId);
    if (!ts) return;

    const content = document.createElement('div');
    content.innerHTML = `
      <div class="form-group">
        <label class="form-label">Date</label>
        <input type="date" class="form-input" id="edit-ts-date" value="${ts.date}" />
      </div>
      <div class="form-group">
        <label class="form-label">Hours</label>
        <input type="number" class="form-input" id="edit-ts-hours" value="${ts.hours}" step="0.25" min="0" />
      </div>
      <div class="form-group">
        <label class="form-label">Description</label>
        <textarea class="form-input" id="edit-ts-desc" rows="3">${escapeHTML(ts.description || '')}</textarea>
      </div>
    `;

    showModal({
      title: 'Edit Timesheet Entry',
      content,
      actions: [
        { label: 'Cancel', className: 'btn-secondary', onClick: (close) => close() },
        { label: 'Save Changes', className: 'btn-primary', onClick: (close) => {
          const date = document.getElementById('edit-ts-date').value;
          const hours = parseFloat(document.getElementById('edit-ts-hours').value);
          const description = document.getElementById('edit-ts-desc').value;

          if (!date || isNaN(hours)) {
            showToast('Please enter valid date and hours', 'error');
            return;
          }

          store.update('timesheets', timesheetId, { date, hours, description });
          showToast('Timesheet updated', 'success');
          close();
          render();
        }}
      ]
    });
  }

  render();
}

