// ============================================
// FIELDFORGE — TIMESHEETS LIST & MANAGEMENT
// ============================================

import { store } from '../../data/store.js';
import { router } from '../../router.js';
import { showToast } from '../../components/Notifications.js';
import { showModal } from '../../components/Modal.js';
import { showTimesheetEditModal } from '../../utils/timesheetModals.js';
import { escapeHTML } from '../../utils/security.js';
import { hasPermission } from '../../utils/permissions.js';

export function renderTimesheetsList(container) {
  const currentUser = JSON.parse(localStorage.getItem('currentUser') || '{"role":"admin"}');
  const userType = currentUser.userTypeId ? store.getById('userTypes', currentUser.userTypeId) : null;
  const permissions = userType ? userType.permissions?.find(p => p.module === 'Timesheets') : null;

  let filterStatus = 'All';
  let filterTechId = 'All';

  // Initialize date range filter defaults (last 7 days to today)
  const today = new Date();
  const oneWeekAgo = new Date();
  oneWeekAgo.setDate(today.getDate() - 7);
  
  const formatDate = (d) => {
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  let filterStartDate = formatDate(oneWeekAgo);
  let filterEndDate = formatDate(today);

  let selectedIds = [];

  function render() {
    const isLocalAdmin = localStorage.getItem('relay_login_mode') === 'local';
    const allTimesheets = store.getAll('timesheets').sort((a, b) => new Date(b.date) - new Date(a.date));
    const technicians = store.getAll('technicians').filter(t => !t.deactivated || filterTechId === t.id || allTimesheets.some(ts => ts.technicianId === t.id));
    
    // Enforce permissions: Admin, Manager, and Office Staff can view all timesheets
    let visibleTimesheets = [...allTimesheets];
    const canViewAll = ['admin', 'manager', 'office'].includes(currentUser.role) || (permissions && permissions.view);
    const canViewOwn = permissions && permissions.view_own;

    if (!canViewAll && canViewOwn) {
      visibleTimesheets = visibleTimesheets.filter(t => String(t.technicianId) === String(currentUser.id));
    } else if (!canViewAll && !canViewOwn && currentUser.role !== 'admin') {
      visibleTimesheets = [];
    }

    let filteredData = filterStatus === 'All' ? [...visibleTimesheets] : visibleTimesheets.filter(t => t.status === filterStatus);
    
    if (canViewAll && filterTechId !== 'All') {
      filteredData = filteredData.filter(t => String(t.technicianId) === String(filterTechId));
    }

    if (filterStartDate) {
      filteredData = filteredData.filter(t => {
        const tDate = t.date ? t.date.split('T')[0] : '';
        return tDate >= filterStartDate;
      });
    }
    if (filterEndDate) {
      filteredData = filteredData.filter(t => {
        const tDate = t.date ? t.date.split('T')[0] : '';
        return tDate <= filterEndDate;
      });
    }

    const totalPending = filteredData.filter(t => t.status === 'Pending').reduce((s, t) => s + (t.hours || 0), 0);

    const allFilteredIds = filteredData.map(t => t.id);
    const allSelected = allFilteredIds.length > 0 && allFilteredIds.every(id => selectedIds.includes(id));
    const showBulk = selectedIds.length > 0;

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
    const allJobs = store.getAll('jobs') || [];
    const jobMap = new Map(allJobs.map(j => [j.id, j]));

    container.innerHTML = `
      <div class="page-header">
        <h1>Timesheets & Approval</h1>
        <div class="page-header-actions">
          ${hasPermission('Timesheets', 'export') ? `
            <button class="btn btn-sm ${selectedIds.length > 0 ? 'btn-primary' : 'btn-secondary'}" id="btn-export-selected" ${selectedIds.length === 0 ? 'disabled' : ''} data-tooltip="Export selected timesheets to a payroll-ready CSV spreadsheet" data-tooltip-pos="left" style="margin-right:8px">
              <span class="material-icons-outlined">download</span> Export
            </button>
          ` : ''}
          ${hasPermission('Timesheets', 'create') ? `
            <button class="btn btn-sm ${(isLocalAdmin || !['admin', 'manager', 'office'].includes(currentUser.role)) ? 'btn-primary' : 'btn-secondary'}" id="btn-log-time" data-tooltip="${(isLocalAdmin || !['admin', 'manager', 'office'].includes(currentUser.role)) ? 'Log a new timesheet entry' : 'Manually enter a timesheet record for another employee'}" data-tooltip-pos="left" style="margin-right:8px">
              <span class="material-icons-outlined">add</span> Log Time
            </button>
          ` : ''}
          ${(currentUser.role === 'admin' || currentUser.role === 'manager' || (permissions && permissions.approve)) ? `
            <button class="btn btn-sm btn-primary" id="btn-approve-all-pending" data-tooltip="Instantly approve all pending timesheets in the active filtered view" data-tooltip-pos="left" ${!visibleTimesheets.some(t => t.status === 'Pending') ? 'disabled' : ''}>
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

      <!-- Filters & Controls -->
      <div class="card" style="margin-bottom:12px; padding:12px 16px;">
        <div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:12px;">
          <!-- Status Segmented Controls -->
          <div class="segmented-control" style="margin:0;">
            <button class="btn btn-sm ${filterStatus === 'All' ? 'active' : ''}" data-status="All">All</button>
            <button class="btn btn-sm ${filterStatus === 'Pending' ? 'active' : ''}" data-status="Pending">Pending</button>
            <button class="btn btn-sm ${filterStatus === 'Approved' ? 'active' : ''}" data-status="Approved">Approved</button>
            <button class="btn btn-sm ${filterStatus === 'Rejected' ? 'active' : ''}" data-status="Rejected">Rejected</button>
          </div>

          <!-- Date Navigation & Quick Presets -->
          <div style="display:flex; align-items:center; gap:8px;">
            <div style="display:flex; align-items:center; gap:6px;">
              <input type="date" class="form-input" id="filter-date-start" value="${filterStartDate}" style="padding:4px 8px; font-size:13px; width:auto;" />
              <span style="font-size:12px; color:var(--text-tertiary);">to</span>
              <input type="date" class="form-input" id="filter-date-end" value="${filterEndDate}" style="padding:4px 8px; font-size:13px; width:auto;" />
            </div>
          </div>
        </div>

        <!-- Technician Dropdown Filter (Admin/Manager or multi-tech view) -->
        ${(currentUser.role === 'admin' || currentUser.role === 'manager' || isLocalAdmin) ? `
          <div style="margin-top:12px; padding-top:12px; border-top:1px solid var(--border-color); display:flex; justify-content:space-between; align-items:center;">
            <div style="display:flex; align-items:center; gap:8px;">
              <span class="text-secondary" style="font-size:13px; font-weight:500;">Filter Technician:</span>
              <button class="btn btn-ghost btn-sm btn-icon" id="btn-tech-prev" title="Previous technician" style="padding:0; height:32px; width:32px; min-width:32px; display:flex; align-items:center; justify-content:center; border:1px solid var(--border-color); border-radius:var(--border-radius); background:var(--card-bg);">
                <span class="material-icons-outlined" style="font-size:18px">chevron_left</span>
              </button>
              <select class="form-select" id="filter-tech" style="width:auto; min-width:180px; padding:4px 8px; font-size:13px;">
                <option value="All" ${filterTechId === 'All' ? 'selected' : ''}>All Technicians</option>
                ${(() => {
                  const hasCurrentUser = technicians.some(t => t.id === currentUser.id);
                  let html = '';
                  if (!hasCurrentUser) {
                    html += `<option value="${currentUser.id}" ${filterTechId === currentUser.id ? 'selected' : ''}>${currentUser.name} (You)</option>`;
                  }
                  html += technicians.map(t => `<option value="${t.id}" ${filterTechId === t.id ? 'selected' : ''}>${t.name}</option>`).join('');
                  return html;
                })()}
              </select>
              <button class="btn btn-ghost btn-sm btn-icon" id="btn-tech-next" title="Next technician" style="padding:0; height:32px; width:32px; min-width:32px; display:flex; align-items:center; justify-content:center; border:1px solid var(--border-color); border-radius:var(--border-radius); background:var(--card-bg);">
                <span class="material-icons-outlined" style="font-size:18px">chevron_right</span>
              </button>
            </div>
          </div>
        ` : ''}
      </div>

      <div id="bulk-actions-bar" style="display:${showBulk ? 'flex' : 'none'}; align-items:center; justify-content:space-between; background:var(--color-primary-light); border:1px solid var(--color-primary); padding:10px 16px; border-radius:var(--border-radius); margin-bottom:12px; transition: all 0.2s ease;">
        <div style="display:flex; align-items:center; gap:12px;">
          <span style="font-weight:600; color:var(--color-primary); font-size:14px;"><span id="selected-count">${selectedIds.length}</span> items selected</span>
          <button class="btn btn-ghost btn-sm" id="btn-bulk-deselect" style="color:var(--color-primary); padding:2px 8px; font-weight:600;">Deselect All</button>
        </div>
        <div style="display:flex; gap:8px;">
          ${(currentUser.role === 'admin' || currentUser.role === 'manager' || (permissions && permissions.approve)) ? `
            <button class="btn btn-sm btn-success" id="btn-bulk-approve" style="display:flex; align-items:center; gap:4px; padding:6px 12px; font-size:13px; color:var(--color-success); border-color:var(--color-success); background:rgba(46, 204, 113, 0.1);">
              <span class="material-icons-outlined" style="font-size:16px">done</span> Approve Selected
            </button>
            <button class="btn btn-sm btn-danger" id="btn-bulk-reject" style="display:flex; align-items:center; gap:4px; padding:6px 12px; font-size:13px; color:var(--color-danger); border-color:var(--color-danger); background:rgba(231, 76, 60, 0.1);">
              <span class="material-icons-outlined" style="font-size:16px">close</span> Reject Selected
            </button>
          ` : ''}
          ${hasPermission('Timesheets', 'delete') || ['admin', 'manager', 'office'].includes(currentUser.role) ? `
            <button class="btn btn-sm btn-danger" id="btn-bulk-delete" style="display:flex; align-items:center; gap:4px; padding:6px 12px; font-size:13px; color:#ef4444; border-color:#ef4444; background:rgba(239, 68, 68, 0.1);">
              <span class="material-icons-outlined" style="font-size:16px">delete</span> Delete Selected
            </button>
          ` : ''}
        </div>
      </div>

      <div class="data-table-wrapper">
        <table class="data-table">
            <thead>
              <tr>
                <th style="width:40px; text-align:center;"><input type="checkbox" id="th-select-all" ${allSelected ? 'checked' : ''} style="cursor:pointer; width:16px; height:16px; margin:0;" /></th>
                <th style="width:120px">Date</th>
                <th>Technician</th>
                <th>Job</th>
                <th>Task</th>
                <th>Description</th>
                <th style="text-align:right; width:80px">Hours</th>
                <th style="width:110px">Status</th>
                <th style="width:60px; text-align:right">Actions</th>
              </tr>
            </thead>
            <tbody>
              ${groups.length === 0 ? '<tr><td colspan="9" class="text-secondary" style="text-align:center;padding:40px">No timesheets found</td></tr>' : groups.map(group => `
                <tr class="group-header" style="background:var(--content-bg); font-weight:600;">
                  <td></td>
                  <td colspan="5" style="color:var(--text-primary)">${group.dateStr}</td>
                  <td style="text-align:right; color:var(--color-primary)">${group.total.toFixed(2)} hrs</td>
                  <td></td>
                  <td></td>
                </tr>
                ${group.items.map(t => {
                  const isOwner = String(t.technicianId) === String(currentUser.id);
                  const hasEditPerm = (permissions && permissions.edit === true) || isOwner;
                  const hasDeletePerm = (permissions && permissions.delete === true) || isOwner;

                  const canEdit = ['admin', 'manager', 'office'].includes(currentUser.role) || (hasEditPerm && t.status !== 'Approved');
                  const canDelete = ['admin', 'manager', 'office'].includes(currentUser.role) || (hasDeletePerm && t.status !== 'Approved');
                  const isRowChecked = selectedIds.includes(t.id);

                  const job = jobMap.get(t.jobId);
                  let jobLabel = t.jobNumber || t.jobId;
                  if (job) {
                    if (job.number && job.title) jobLabel = `${job.number} — ${job.title}`;
                    else if (job.number) jobLabel = job.number;
                    else if (job.title) jobLabel = job.title;
                  } else if (t.jobTitle) {
                    jobLabel = t.jobNumber ? `${t.jobNumber} — ${t.jobTitle}` : t.jobTitle;
                  }

                  return `
                  <tr>
                    <td style="width:40px; text-align:center;">
                      <input type="checkbox" class="row-checkbox" data-id="${t.id}" ${isRowChecked ? 'checked' : ''} style="cursor:pointer; width:16px; height:16px; margin:0;" />
                    </td>
                    <td class="text-secondary" style="font-size:12px">${new Date(t.date).toLocaleDateString()}</td>
                    <td><span class="font-medium">${escapeHTML(t.technicianName)}</span></td>
                    <td><a href="#/jobs/${t.jobId}" class="cell-link" title="${escapeHTML(jobLabel)}">${escapeHTML(jobLabel)}</a></td>
                    <td><span class="text-secondary truncate" style="max-width:200px;display:inline-block">${escapeHTML(t.taskName || t.phaseName || t.task_name || '—')}</span></td>
                    <td><span class="text-secondary truncate" style="max-width:200px;display:inline-block">${escapeHTML(t.description || '—')}</span></td>
                    <td style="text-align:right; font-weight:600">${(t.hours ?? t.durationHours ?? t.duration_hours ?? 0).toFixed(2)}</td>
                    <td>
                      <span class="badge ${t.status === 'Approved' ? 'badge-success' : t.status === 'Rejected' ? 'badge-danger' : 'badge-warning'}">
                        ${escapeHTML(t.status)}
                      </span>
                    </td>
                    <td style="text-align:right">
                      <div style="display:flex; justify-content:flex-end; gap:4px;">
                        ${canEdit ? `
                          <button class="btn btn-ghost btn-sm btn-icon btn-edit-timesheet" data-id="${t.id}" data-tooltip="Edit timesheet entry" data-tooltip-pos="left">
                            <span class="material-icons-outlined" style="font-size:18px">edit</span>
                          </button>
                        ` : ''}
                        ${canDelete ? `
                          <button class="btn btn-ghost btn-sm btn-icon btn-delete-timesheet" data-id="${t.id}" data-tooltip="Delete timesheet entry" data-tooltip-pos="left" style="color:var(--color-danger)">
                            <span class="material-icons-outlined" style="font-size:18px">delete</span>
                          </button>
                        ` : ''}
                        ${['admin', 'manager'].includes(currentUser.role) && t.status === 'Pending' ? `
                          <button class="btn btn-ghost btn-sm btn-icon btn-approve-single" data-id="${t.id}" data-tooltip="Approve timesheet entry" data-tooltip-pos="left" style="color:var(--color-success)">
                            <span class="material-icons-outlined" style="font-size:18px">check</span>
                          </button>
                          <button class="btn btn-ghost btn-sm btn-icon btn-reject-single" data-id="${t.id}" data-tooltip="Reject timesheet entry" data-tooltip-pos="left" style="color:var(--color-danger)">
                            <span class="material-icons-outlined" style="font-size:18px">close</span>
                          </button>
                        ` : ''}
                      </div>
                    </td>
                  </tr>
                `;}).join('')}
              `).join('')}
            </tbody>
        </table>
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

    const techOptions = ['All', ...technicians.map(t => String(t.id))];

    container.querySelector('#btn-tech-prev')?.addEventListener('click', () => {
      const currentIndex = techOptions.indexOf(String(filterTechId));
      if (currentIndex !== -1) {
        const prevIndex = (currentIndex - 1 + techOptions.length) % techOptions.length;
        filterTechId = techOptions[prevIndex];
        render();
      }
    });

    container.querySelector('#btn-tech-next')?.addEventListener('click', () => {
      const currentIndex = techOptions.indexOf(String(filterTechId));
      if (currentIndex !== -1) {
        const nextIndex = (currentIndex + 1) % techOptions.length;
        filterTechId = techOptions[nextIndex];
        render();
      }
    });

    container.querySelector('#filter-date-start')?.addEventListener('change', (e) => {
      filterStartDate = e.target.value;
      render();
    });

    container.querySelector('#filter-date-end')?.addEventListener('change', (e) => {
      filterEndDate = e.target.value;
      render();
    });

    // Checkbox and Bulk Actions wiring
    container.querySelector('#th-select-all')?.addEventListener('change', (e) => {
      if (e.target.checked) {
        allFilteredIds.forEach(id => {
          if (!selectedIds.includes(id)) selectedIds.push(id);
        });
      } else {
        selectedIds = selectedIds.filter(id => !allFilteredIds.includes(id));
      }
      render();
    });

    container.querySelectorAll('.row-checkbox').forEach(cb => {
      cb.addEventListener('change', (e) => {
        const id = cb.dataset.id;
        if (e.target.checked) {
          if (!selectedIds.includes(id)) selectedIds.push(id);
        } else {
          selectedIds = selectedIds.filter(x => x !== id);
        }
        render();
      });
    });

    container.querySelector('#btn-bulk-deselect')?.addEventListener('click', () => {
      selectedIds = [];
      render();
    });

    container.querySelector('#btn-bulk-approve')?.addEventListener('click', () => {
      if (selectedIds.length === 0) return;
      selectedIds.forEach(id => {
        store.update('timesheets', id, { status: 'Approved' });
      });
      showToast(`Approved ${selectedIds.length} timesheets successfully`, 'success');
      selectedIds = [];
      render();
    });

    container.querySelector('#btn-bulk-reject')?.addEventListener('click', () => {
      if (selectedIds.length === 0) return;
      selectedIds.forEach(id => {
        store.update('timesheets', id, { status: 'Rejected' });
      });
      showToast(`Rejected ${selectedIds.length} timesheets`, 'error');
      selectedIds = [];
      render();
    });

    container.querySelector('#btn-bulk-delete')?.addEventListener('click', () => {
      if (selectedIds.length === 0) return;
      const count = selectedIds.length;
      showModal({
        title: 'Confirm Bulk Delete',
        content: `<p>Are you sure you want to delete <strong>${count}</strong> selected timesheet ${count === 1 ? 'entry' : 'entries'}? This action cannot be undone.</p>`,
        actions: [
          { label: 'Cancel', className: 'btn-secondary', onClick: (close) => close() },
          {
            label: `Delete (${count})`,
            className: 'btn-danger',
            onClick: (close) => {
              selectedIds.forEach(id => {
                store.delete('timesheets', id);
              });
              showToast(`Deleted ${count} timesheet ${count === 1 ? 'entry' : 'entries'} successfully`, 'success');
              selectedIds = [];
              close();
              render();
            }
          }
        ]
      });
    });

    const triggerExportSelected = () => {
      if (selectedIds.length === 0) return;

      const allTimesheets = store.getAll('timesheets');
      const selectedEntries = allTimesheets.filter(t => selectedIds.includes(t.id));

      if (selectedEntries.length === 0) {
        showToast('No entries found to export', 'error');
        return;
      }

      // Generate CSV
      const headers = ['Date', 'Technician', 'Job Number', 'Task Name', 'Start Time', 'Finish Time', 'Hours', 'Description', 'Status'];
      const csvRows = [headers.join(',')];

      selectedEntries.forEach(entry => {
        const start = entry.startTime ? new Date(entry.startTime).toLocaleString() : '';
        const finish = entry.finishTime ? new Date(entry.finishTime).toLocaleString() : '';
        
        const row = [
          entry.date || '',
          `"${(entry.technicianName || '').replace(/"/g, '""')}"`,
          `"${(entry.jobNumber || '').replace(/"/g, '""')}"`,
          `"${(entry.taskName || '').replace(/"/g, '""')}"`,
          `"${start}"`,
          `"${finish}"`,
          entry.hours || 0,
          `"${(entry.description || '').replace(/"/g, '""')}"`,
          entry.status || ''
        ];
        csvRows.push(row.join(','));
      });

      const csvContent = csvRows.join('\n');
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      
      const link = document.createElement('a');
      link.setAttribute('href', url);
      const dateLabel = new Date().toISOString().split('T')[0];
      link.setAttribute('download', `FieldForge_Selected_Timesheets_${dateLabel}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      showToast(`Exported ${selectedEntries.length} selected timesheets to CSV!`, 'success');
      selectedIds = [];
      render();
    };

    container.querySelector('#btn-bulk-export')?.addEventListener('click', triggerExportSelected);
    container.querySelector('#btn-export-selected')?.addEventListener('click', triggerExportSelected);

    // Bulk Approve All Pending
    container.querySelector('#btn-approve-all-pending')?.addEventListener('click', () => {
      const pending = visibleTimesheets.filter(t => t.status === 'Pending');
      pending.forEach(ts => store.update('timesheets', ts.id, { status: 'Approved' }));
      showToast(`Approved ${pending.length} pending timesheets`, 'success');
      render();
    });

    // Single approval/rejection events
    container.querySelectorAll('.btn-approve-single').forEach(btn => {
      btn.addEventListener('click', () => {
        store.update('timesheets', btn.dataset.id, { status: 'Approved' });
        showToast('Timesheet entry approved', 'success');
        render();
      });
    });

    container.querySelectorAll('.btn-reject-single').forEach(btn => {
      btn.addEventListener('click', () => {
        store.update('timesheets', btn.dataset.id, { status: 'Rejected' });
        showToast('Timesheet entry rejected', 'error');
        render();
      });
    });

    // Edit entry
    container.querySelectorAll('.btn-edit-timesheet').forEach(btn => {
      btn.addEventListener('click', () => {
        openEditModal(btn.dataset.id);
      });
    });

    // Delete entry
    container.querySelectorAll('.btn-delete-timesheet').forEach(btn => {
      btn.addEventListener('click', () => {
        const tsId = btn.dataset.id;
        const ts = store.getById('timesheets', tsId);
        if (!ts) return;

        showModal({
          title: 'Confirm Delete',
          content: `<p>Are you sure you want to delete this timesheet entry for <strong>${ts.hours} hrs</strong> on <strong>${new Date(ts.date).toLocaleDateString()}</strong>?</p>`,
          actions: [
            { label: 'Cancel', className: 'btn-secondary', onClick: (close) => close() },
            { label: 'Delete', className: 'btn-danger', onClick: (close) => {
              store.delete('timesheets', tsId);
              showToast('Timesheet entry deleted successfully', 'success');
              close();
              render();
            }}
          ]
        });
      });
    });

    // Export button actions are handled by the shared triggerExportSelected listener above.

    // Log Time on Behalf
    container.querySelector('#btn-log-time')?.addEventListener('click', () => {
      openLogTimeModal();
    });
  }

  function openEditModal(timesheetId) {
    showTimesheetEditModal(timesheetId, render);
  }

  function openLogTimeModal() {
    const isLocalAdmin = localStorage.getItem('relay_login_mode') === 'local';
    const isTech = currentUser.role === 'technician' || currentUser.userTypeId === 'ut_tech' || (currentUser.userTypeId && currentUser.userTypeId.endsWith('_ut_tech'));
    const pathBreadcrumbs = {};
    const idToPath = {};
    function populateBreadcrumbs(tasks, currentPath = [], currentNamePath = []) {
      if (!tasks) return;
      tasks.forEach((p, i) => {
        const pathStr = [...currentPath, i].join('-');
        const namePath = [...currentNamePath, p.name].join(' > ');
        pathBreadcrumbs[pathStr] = namePath;
        if (p.id) idToPath[p.id] = pathStr;
        if (p.subTasks) {
          populateBreadcrumbs(p.subTasks, [...currentPath, i], [...currentNamePath, p.name]);
        }
      });
    }

    function buildTreeHTML(tasks, currentPath = []) {
      if (!tasks || tasks.length === 0) return '';
      return tasks.map((p, i) => {
        const path = [...currentPath, i];
        const pathStr = path.join('-');
        const hasSubs = p.subTasks && p.subTasks.length > 0;
        
        return `
          <div class="tree-node" style="margin: 2px 0;">
            <div class="tree-node-row ${hasSubs ? 'parent-node' : 'leaf-node'}" data-path="${pathStr}" data-name="${escapeHTML(p.name)}" style="display:flex; justify-content:space-between; align-items:center;">
              <div style="display:flex; align-items:center; flex-grow:1;">
                ${hasSubs ? `
                  <span class="material-icons-outlined tree-node-toggle" data-path="${pathStr}" style="font-size:16px; margin-right:4px;">chevron_right</span>
                ` : `
                  <span class="material-icons-outlined" style="font-size:14px; margin-right:6px; color:var(--text-tertiary);">subdirectory_arrow_right</span>
                `}
                <span class="node-name" style="font-weight:${hasSubs ? '600' : '400'}">${escapeHTML(p.name)}</span>
              </div>
              ${hasSubs ? `
                <span style="font-size:10px; background:var(--content-bg); padding:2px 6px; border-radius:10px; color:var(--text-secondary)">${p.subTasks.length} subtasks</span>
              ` : ''}
            </div>
            ${hasSubs ? `
              <div class="tree-node-children" id="children-${pathStr}" style="display:none; padding-left:18px; border-left:1px dashed var(--border-color); margin-left:10px;">
                ${buildTreeHTML(p.subTasks, path)}
              </div>
            ` : ''}
          </div>
        `;
      }).join('');
    }

    const now = new Date();
    const p = n => n.toString().padStart(2, '0');
    const dateStr = `${now.getFullYear()}-${p(now.getMonth()+1)}-${p(now.getDate())}`;
    const startStr = `${dateStr}T09:00`;
    const finishStr = `${dateStr}T10:00`;
    const technicians = store.getAll('technicians').filter(t => !t.deactivated || t.id === currentUser.id);
    const activeJobs = store.getAll('jobs').filter(j => j.status !== 'Completed' && j.status !== 'Invoiced');

    const content = document.createElement('div');
    content.innerHTML = `
      <style>
        .tree-node-row {
          display: flex;
          align-items: center;
          padding: 6px 10px;
          border-radius: var(--border-radius-sm);
          font-size: 13px;
          transition: all 0.2s ease;
        }
        .tree-node-row.parent-node {
          cursor: pointer;
          color: var(--text-primary);
        }
        .tree-node-row.parent-node:hover {
          background: rgba(0, 0, 0, 0.03);
        }
        .tree-node-row.leaf-node {
          cursor: pointer;
          color: var(--color-primary);
        }
        .tree-node-row.leaf-node:hover {
          background: var(--color-primary-light) !important;
          color: var(--color-primary) !important;
        }
        .tree-node-toggle {
          cursor: pointer;
          user-select: none;
          color: var(--text-secondary);
          display: flex;
          align-items: center;
          justify-content: center;
          width: 20px;
          height: 20px;
          border-radius: 50%;
          transition: all 0.2s;
        }
        .tree-node-toggle:hover {
          background: rgba(0,0,0,0.05);
        }
        .tree-node-toggle.expanded {
          transform: rotate(90deg);
        }
      </style>
      <div class="form-row" style="display:grid; grid-template-columns:1fr 1fr; gap:12px; margin-bottom:12px;">
        <div class="form-group" style="margin:0">
          <label class="form-label">Start Time *</label>
          <input type="datetime-local" class="form-input" id="lt-start" value="${startStr}" style="width:100%" />
        </div>
        <div class="form-group" style="margin:0">
          <label class="form-label">Finish Time *</label>
          <input type="datetime-local" class="form-input" id="lt-finish" value="${finishStr}" style="width:100%" />
        </div>
      </div>
      <div class="form-row" style="display:grid; grid-template-columns:1fr 1fr; gap:12px; margin-bottom:12px;">
        <div class="form-group" style="margin:0; ${isLocalAdmin ? 'display:none;' : ''}">
          <label class="form-label">Technician *</label>
          ${isLocalAdmin ? `
            <select class="form-select" id="lt-tech" style="width:100%">
              <option value="${currentUser.id}" selected>${currentUser.name}</option>
            </select>
          ` : (() => {
            const hasTechRecord = technicians.some(t => t.id === currentUser.id);
            const forceOwnTech = isTech && hasTechRecord;
            return `
              <select class="form-select" id="lt-tech" style="width:100%" ${forceOwnTech ? 'disabled' : ''}>
                <option value="">Select technician...</option>
                ${!hasTechRecord ? `<option value="${currentUser.id}" selected>${currentUser.name} (You)</option>` : ''}
                ${technicians.map(t => `<option value="${t.id}" ${(forceOwnTech ? String(currentUser.id) === String(t.id) : false) ? 'selected' : ''}>${t.name}</option>`).join('')}
              </select>
            `;
          })()}
        </div>
        <div class="form-group" style="margin:0">
          <label class="form-label">Job *</label>
          <select class="form-select" id="lt-job" style="width:100%">
            <option value="">Select job...</option>
            ${activeJobs.map(j => `<option value="${j.id}">${j.number} - ${escapeHTML(j.customerName)} (${escapeHTML(j.title)})</option>`).join('')}
          </select>
        </div>
      </div>
      <div class="form-group" style="margin-bottom:12px">
        <label class="form-label">Task *</label>
        <div class="custom-tree-select" id="lt-task-container" style="position:relative;">
          <button class="form-select" id="lt-task-trigger" type="button" style="width:100%; text-align:left; display:flex; justify-content:space-between; align-items:center; background-image:none;" disabled>
            <span>Select a job first...</span>
            <span class="material-icons-outlined" style="font-size:18px; color:var(--text-secondary)">keyboard_arrow_down</span>
          </button>
          <div class="tree-select-dropdown" id="lt-task-dropdown" style="display:none; position:absolute; top:100%; left:0; right:0; z-index:9999; background:var(--card-bg); border:1px solid var(--border-color); border-radius:var(--border-radius); box-shadow:var(--shadow-lg); max-height:280px; overflow-y:auto; padding:8px;">
            <!-- Hierarchical task tree populated here -->
          </div>
          <input type="hidden" id="lt-task" value="" />
          <input type="hidden" id="lt-task-name" value="" />
        </div>
      </div>
      <div class="form-group" style="margin:0">
        <label class="form-label">Description</label>
        <input type="text" class="form-input" id="lt-desc" placeholder="Brief description..." style="width:100%" />
      </div>
    `;

    const jobSelect = content.querySelector('#lt-job');
    const taskTrigger = content.querySelector('#lt-task-trigger');
    const taskDropdown = content.querySelector('#lt-task-dropdown');
    const taskHidden = content.querySelector('#lt-task');
    const taskNameHidden = content.querySelector('#lt-task-name');

    // Toggle dropdown
    taskTrigger.addEventListener('click', (ev) => {
      ev.stopPropagation();
      const isVisible = taskDropdown.style.display === 'block';
      taskDropdown.style.display = isVisible ? 'none' : 'block';
    });

    // Close dropdown on click outside
    document.addEventListener('click', (ev) => {
      if (!content.contains(ev.target)) {
        taskDropdown.style.display = 'none';
      }
    });

    jobSelect.addEventListener('change', (e) => {
      const jobId = e.target.value;
      if (!jobId) {
        taskTrigger.innerHTML = '<span>Select a job first...</span><span class="material-icons-outlined" style="font-size:18px; color:var(--text-secondary)">keyboard_arrow_down</span>';
        taskTrigger.disabled = true;
        taskDropdown.style.display = 'none';
        taskHidden.value = '';
        taskNameHidden.value = '';
        return;
      }

      const job = activeJobs.find(j => j.id === jobId);
      if (!job || !job.tasks || job.tasks.length === 0) {
        taskTrigger.innerHTML = '<span>No tasks available</span><span class="material-icons-outlined" style="font-size:18px; color:var(--text-secondary)">keyboard_arrow_down</span>';
        taskTrigger.disabled = true;
        taskDropdown.style.display = 'none';
        taskHidden.value = '';
        taskNameHidden.value = '';
        return;
      }

      // Populate breadcrumbs dictionary
      for (const k in pathBreadcrumbs) delete pathBreadcrumbs[k];
      for (const k in idToPath) delete idToPath[k];
      populateBreadcrumbs(job.tasks);

      // Build tree HTML
      taskDropdown.innerHTML = buildTreeHTML(job.tasks);
      taskTrigger.innerHTML = '<span>Select a task...</span><span class="material-icons-outlined" style="font-size:18px; color:var(--text-secondary)">keyboard_arrow_down</span>';
      taskTrigger.disabled = false;
      
      // Bind toggle arrows
      taskDropdown.querySelectorAll('.tree-node-toggle').forEach(toggle => {
        toggle.addEventListener('click', (ev) => {
          ev.stopPropagation();
          const pathStr = toggle.dataset.path;
          const childDiv = taskDropdown.querySelector(`#children-${pathStr}`);
          if (childDiv) {
            const isHidden = childDiv.style.display === 'none';
            childDiv.style.display = isHidden ? 'block' : 'none';
            toggle.classList.toggle('expanded', isHidden);
          }
        });
      });

      // Bind node selection
      taskDropdown.querySelectorAll('.tree-node-row').forEach(row => {
        row.addEventListener('click', (ev) => {
          // If clicked toggle itself, don't trigger select
          if (ev.target.classList.contains('tree-node-toggle')) return;

          const pathStr = row.dataset.path;
          const fullName = pathBreadcrumbs[pathStr] || row.dataset.name;

          taskHidden.value = pathStr;
          taskNameHidden.value = fullName;
          taskTrigger.innerHTML = `<span>${escapeHTML(fullName)}</span><span class="material-icons-outlined" style="font-size:18px; color:var(--text-secondary)">keyboard_arrow_down</span>`;
          
          taskDropdown.style.display = 'none';
        });
      });
    });

    showModal({
      title: isTech ? 'Log Time' : 'Log Time on Behalf of Staff',
      content,
      size: 'modal-70',
      actions: [
        { label: 'Cancel', className: 'btn-secondary', onClick: (close) => close() },
        { label: 'Log Time', className: 'btn-primary', onClick: (close) => {
          const startVal = document.getElementById('lt-start').value;
          const finishVal = document.getElementById('lt-finish').value;
          const hasTechRecord = technicians.some(t => t.id === currentUser.id);
          const forceOwnTech = isTech && hasTechRecord;
          const techId = forceOwnTech ? currentUser.id : document.getElementById('lt-tech').value;
          const jobId = document.getElementById('lt-job').value;
          const taskPathVal = document.getElementById('lt-task').value;
          const taskNameVal = document.getElementById('lt-task-name').value;
          const descVal = document.getElementById('lt-desc').value;

          if (!startVal || !finishVal || !techId || !jobId || !taskPathVal) {
            showToast('Please fill all required fields, including the task', 'error');
            return;
          }

          const startDate = new Date(startVal);
          const finishDate = new Date(finishVal);
          
          if (finishDate <= startDate) {
            showToast('Finish time must be after start time', 'error');
            return;
          }

          const hours = Math.round(((finishDate - startDate) / 3600000) * 100) / 100;
          const tech = technicians.find(t => t.id === techId);
          const job = activeJobs.find(j => j.id === jobId);

          store.create('timesheets', {
            jobId: job.id,
            jobNumber: job.number,
            taskId: taskPathVal,
            taskName: taskNameVal,
            technicianId: techId,
            technicianName: tech.name,
            date: startVal.split('T')[0],
            startTime: startVal,
            finishTime: finishVal,
            hours,
            description: descVal || '',
            status: 'Pending'
          });

          showToast(isTech ? 'Time logged successfully' : 'Time logged successfully on behalf of staff', 'success');
          close();
          render();
        }}
      ]
    });

    import('../../utils/clockPicker.js').then(({ initClockPicker }) => {
      initClockPicker(document.getElementById('lt-start'));
      initClockPicker(document.getElementById('lt-finish'));
    });
  }

  // Bind store listeners to auto-refresh data
  const handleStoreChange = () => render();
  store.on('timesheets', handleStoreChange);
  store.on('jobs', handleStoreChange);
  store.on('technicians', handleStoreChange);

  // Initial render
  render();

  // If a router cleanup mechanism exists, we should ideally unbind:
  // store.off('timesheets', handleStoreChange) etc.
}
