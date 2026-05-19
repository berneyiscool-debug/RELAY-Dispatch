// ============================================
// FIELDFORGE — TIMESHEETS LIST & MANAGEMENT
// ============================================

import { store } from '../../data/store.js';
import { router } from '../../router.js';
import { showToast } from '../../components/Notifications.js';
import { showModal } from '../../components/Modal.js';
import { escapeHTML } from '../../utils/security.js';

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
    const allTimesheets = store.getAll('timesheets').sort((a, b) => new Date(b.date) - new Date(a.date));
    const technicians = store.getAll('technicians');
    
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

    container.innerHTML = `
      <div class="page-header">
        <h1>Timesheets & Approval</h1>
        <div class="page-header-actions">
          <button class="btn btn-secondary" id="btn-export-approved" style="margin-right:8px">
            <span class="material-icons-outlined">download</span> Export Approved
          </button>
          ${['admin', 'manager', 'office'].includes(currentUser.role) ? `
            <button class="btn btn-secondary" id="btn-log-time" style="margin-right:8px">
              <span class="material-icons-outlined">add</span> Log Time on Behalf
            </button>
          ` : ''}
          ${(currentUser.role === 'admin' || currentUser.role === 'manager' || (permissions && permissions.approve)) ? `
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

      <div class="page-toolbar" style="display:flex; flex-wrap:wrap; justify-content:space-between; align-items:center; gap:16px;">
        <div style="display:flex; align-items:center; gap:16px; flex-wrap:wrap;">
          <div class="toolbar-filters" style="margin:0">
            <button class="toolbar-filter ${filterStatus === 'All' ? 'active' : ''}" data-status="All">All</button>
            <button class="toolbar-filter ${filterStatus === 'Pending' ? 'active' : ''}" data-status="Pending">Pending</button>
            <button class="toolbar-filter ${filterStatus === 'Approved' ? 'active' : ''}" data-status="Approved">Approved</button>
            <button class="toolbar-filter ${filterStatus === 'Rejected' ? 'active' : ''}" data-status="Rejected">Rejected</button>
          </div>
          
          <div style="display:flex; align-items:center; gap:8px;">
            <label style="font-size:12px; color:var(--text-secondary); font-weight:500;">Date Range:</label>
            <input type="date" class="form-input" id="filter-date-start" value="${filterStartDate}" style="width:130px; height:32px; padding:0 8px; font-size:13px;" />
            <span style="font-size:12px; color:var(--text-secondary)">to</span>
            <input type="date" class="form-input" id="filter-date-end" value="${filterEndDate}" style="width:130px; height:32px; padding:0 8px; font-size:13px;" />
          </div>
        </div>

        ${canViewAll ? `
          <div style="display:flex; align-items:center; gap:8px;">
            <label style="font-size:12px; color:var(--text-secondary); font-weight:500;">Filter by Staff:</label>
            <div style="display:flex; align-items:center; gap:4px;">
              <button class="btn btn-ghost btn-sm btn-icon" id="btn-tech-prev" title="Previous technician" style="padding:0; height:32px; width:32px; min-width:32px; display:flex; align-items:center; justify-content:center; border:1px solid var(--border-color); border-radius:var(--border-radius); background:var(--card-bg);">
                <span class="material-icons-outlined" style="font-size:18px">chevron_left</span>
              </button>
              <select class="form-select" id="filter-tech" style="width:180px; height:32px; padding:0 8px; font-size:13px; margin:0;">
                <option value="All">All Technicians</option>
                ${technicians.map(t => `<option value="${t.id}" ${filterTechId === t.id ? 'selected' : ''}>${t.name}</option>`).join('')}
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
          <button class="btn btn-sm btn-secondary" id="btn-bulk-export" style="display:flex; align-items:center; gap:4px; padding:6px 12px; font-size:13px;">
            <span class="material-icons-outlined" style="font-size:16px">download</span> Export Selected
          </button>
        </div>
      </div>

      <div class="card">
        <div class="card-body" style="padding:0">
          <table class="data-table">
            <thead>
              <tr>
                <th style="width:40px; text-align:center;"><input type="checkbox" id="th-select-all" ${allSelected ? 'checked' : ''} style="cursor:pointer; width:16px; height:16px; margin:0;" /></th>
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
              ${groups.length === 0 ? '<tr><td colspan="8" class="text-secondary" style="text-align:center;padding:40px">No timesheets found</td></tr>' : groups.map(group => `
                <tr class="group-header" style="background:var(--content-bg); font-weight:600;">
                  <td></td>
                  <td colspan="4" style="color:var(--text-primary)">${group.dateStr}</td>
                  <td style="text-align:right; color:var(--color-primary)">${group.total.toFixed(2)} hrs</td>
                  <td></td>
                  <td></td>
                </tr>
                ${group.items.map(t => {
                  // Admin, managers, and office staff can edit any technician's timesheet. Technicians can edit their own if not yet approved.
                  const isOwner = String(t.technicianId) === String(currentUser.id);
                  const hasEditPerm = permissions ? permissions.edit === true : (currentUser.role === 'technician' && isOwner);
                  const canEdit = ['admin', 'manager', 'office'].includes(currentUser.role) || (hasEditPerm && t.status !== 'Approved');
                  const isRowChecked = selectedIds.includes(t.id);

                  return `
                  <tr>
                    <td style="width:40px; text-align:center;">
                      <input type="checkbox" class="row-checkbox" data-id="${t.id}" ${isRowChecked ? 'checked' : ''} style="cursor:pointer; width:16px; height:16px; margin:0;" />
                    </td>
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
                        <div style="display:flex; justify-content:flex-end; gap:4px;">
                          <button class="btn btn-ghost btn-sm btn-icon btn-edit-timesheet" data-id="${t.id}" title="Edit entry">
                            <span class="material-icons-outlined" style="font-size:18px">edit</span>
                          </button>
                          ${['admin', 'manager'].includes(currentUser.role) && t.status === 'Pending' ? `
                            <button class="btn btn-ghost btn-sm btn-icon btn-approve-single" data-id="${t.id}" title="Approve entry" style="color:var(--color-success)">
                              <span class="material-icons-outlined" style="font-size:18px">check</span>
                            </button>
                            <button class="btn btn-ghost btn-sm btn-icon btn-reject-single" data-id="${t.id}" title="Reject entry" style="color:var(--color-danger)">
                              <span class="material-icons-outlined" style="font-size:18px">close</span>
                            </button>
                          ` : ''}
                        </div>
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

    container.querySelector('#btn-bulk-export')?.addEventListener('click', () => {
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
    });

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

    // Export Approved to CSV
    container.querySelector('#btn-export-approved')?.addEventListener('click', () => {
      const allTimesheets = store.getAll('timesheets');
      const isOfficeStaff = ['admin', 'manager', 'office'].includes(currentUser.role);

      let approvedEntries = allTimesheets.filter(t => t.status === 'Approved');

      // Filter by date range
      if (filterStartDate) {
        approvedEntries = approvedEntries.filter(t => t.date >= filterStartDate);
      }
      if (filterEndDate) {
        approvedEntries = approvedEntries.filter(t => t.date <= filterEndDate);
      }

      // Restrict by permissions
      if (!isOfficeStaff) {
        const techs = store.getAll('technicians');
        const currentTech = techs.find(t => t.name === currentUser.name);
        const techId = currentTech ? currentTech.id : null;
        approvedEntries = approvedEntries.filter(t => t.technicianId === techId || t.technicianName === currentUser.name);
      } else if (filterTechId && filterTechId !== 'All') {
        approvedEntries = approvedEntries.filter(t => t.technicianId === filterTechId);
      }

      if (approvedEntries.length === 0) {
        showToast('No approved timesheets found to export', 'error');
        return;
      }

      // Generate CSV
      const headers = ['Date', 'Technician', 'Job Number', 'Task Name', 'Start Time', 'Finish Time', 'Hours', 'Description'];
      const csvRows = [headers.join(',')];

      approvedEntries.forEach(entry => {
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
          `"${(entry.description || '').replace(/"/g, '""')}"`
        ];
        csvRows.push(row.join(','));
      });

      const csvContent = csvRows.join('\n');
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      
      const link = document.createElement('a');
      link.setAttribute('href', url);
      const dateLabel = new Date().toISOString().split('T')[0];
      link.setAttribute('download', `FieldForge_Approved_Timesheets_${dateLabel}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      showToast(`Exported ${approvedEntries.length} approved timesheets to CSV!`, 'success');
    });

    // Log Time on Behalf
    container.querySelector('#btn-log-time')?.addEventListener('click', () => {
      openLogTimeModal();
    });
  }

  function openEditModal(timesheetId) {
    const ts = store.getById('timesheets', timesheetId);
    if (!ts) return;

    const pathBreadcrumbs = {};
    function populateBreadcrumbs(tasks, currentPath = [], currentNamePath = []) {
      if (!tasks) return;
      tasks.forEach((p, i) => {
        const pathStr = [...currentPath, i].join('-');
        const namePath = [...currentNamePath, p.name].join(' > ');
        pathBreadcrumbs[pathStr] = namePath;
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

    const startStr = ts.startTime || `${ts.date}T09:00`;
    const finishStr = ts.finishTime || `${ts.date}T10:00`;
    const technicians = store.getAll('technicians');
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
        <div class="form-group" style="margin:0">
          <label class="form-label">Technician *</label>
          <select class="form-select" id="lt-tech" style="width:100%">
            <option value="">Select technician...</option>
            ${technicians.map(t => `<option value="${t.id}" ${ts.technicianId === t.id ? 'selected' : ''}>${t.name}</option>`).join('')}
          </select>
        </div>
        <div class="form-group" style="margin:0">
          <label class="form-label">Job *</label>
          <select class="form-select" id="lt-job" style="width:100%">
            <option value="">Select job...</option>
            ${activeJobs.map(j => `<option value="${j.id}" ${ts.jobId === j.id ? 'selected' : ''}>${j.number} - ${escapeHTML(j.customerName)} (${escapeHTML(j.title)})</option>`).join('')}
          </select>
        </div>
      </div>
      <div class="form-group" style="margin-bottom:12px">
        <label class="form-label">Task *</label>
        <div class="custom-tree-select" id="lt-task-container" style="position:relative;">
          <button class="form-select" id="lt-task-trigger" type="button" style="width:100%; text-align:left; display:flex; justify-content:space-between; align-items:center;">
            <span>Select task...</span>
            <span class="material-icons-outlined" style="font-size:18px; color:var(--text-secondary)">keyboard_arrow_down</span>
          </button>
          <div class="tree-select-dropdown" id="lt-task-dropdown" style="display:none; position:absolute; top:100%; left:0; right:0; z-index:9999; background:var(--card-bg); border:1px solid var(--border-color); border-radius:var(--border-radius); box-shadow:var(--shadow-lg); max-height:280px; overflow-y:auto; padding:8px;">
            <!-- Hierarchical task tree populated here -->
          </div>
          <input type="hidden" id="lt-task" value="${ts.taskId || ts.taskPath || ''}" />
          <input type="hidden" id="lt-task-name" value="${escapeHTML(ts.taskName || '')}" />
        </div>
      </div>
      <div class="form-group" style="margin:0">
        <label class="form-label">Description</label>
        <input type="text" class="form-input" id="lt-desc" value="${escapeHTML(ts.description || '')}" placeholder="Brief description..." style="width:100%" />
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

    // Helper to refresh tasklist inside selector
    function refreshTaskList(jobId, selectedPath) {
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
      populateBreadcrumbs(job.tasks);

      // Build tree HTML
      taskDropdown.innerHTML = buildTreeHTML(job.tasks);
      taskTrigger.disabled = false;

      if (selectedPath && pathBreadcrumbs[selectedPath]) {
        taskTrigger.innerHTML = `<span>${escapeHTML(pathBreadcrumbs[selectedPath])}</span><span class="material-icons-outlined" style="font-size:18px; color:var(--text-secondary)">keyboard_arrow_down</span>`;
        taskHidden.value = selectedPath;
        taskNameHidden.value = pathBreadcrumbs[selectedPath];
      } else {
        taskTrigger.innerHTML = '<span>Select a task...</span><span class="material-icons-outlined" style="font-size:18px; color:var(--text-secondary)">keyboard_arrow_down</span>';
        taskHidden.value = '';
        taskNameHidden.value = '';
      }

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
          if (ev.target.classList.contains('tree-node-toggle')) return;

          const pathStr = row.dataset.path;
          
          // Verify if it is a parent task
          const pathArr = pathStr.split('-').map(Number);
          function checkHasSubTasks(tasks, pathArr) {
            let curr = tasks[pathArr[0]];
            for (let i = 1; i < pathArr.length; i++) {
              if (!curr || !curr.subTasks) return false;
              curr = curr.subTasks[pathArr[i]];
            }
            return curr && curr.subTasks && curr.subTasks.length > 0;
          }
          
          const hasChildren = checkHasSubTasks(job.tasks || [], pathArr);
          if (hasChildren) {
            // Parent clicked! Toggle subtasks collapse/expand instead of selecting.
            const childDiv = taskDropdown.querySelector(`#children-${pathStr}`);
            const toggle = taskDropdown.querySelector(`.tree-node-toggle[data-path="${pathStr}"]`);
            if (childDiv) {
              const isHidden = childDiv.style.display === 'none';
              childDiv.style.display = isHidden ? 'block' : 'none';
              if (toggle) toggle.classList.toggle('expanded', isHidden);
            }
            return;
          }

          const fullName = pathBreadcrumbs[pathStr] || row.dataset.name;

          taskHidden.value = pathStr;
          taskNameHidden.value = fullName;
          taskTrigger.innerHTML = `<span>${escapeHTML(fullName)}</span><span class="material-icons-outlined" style="font-size:18px; color:var(--text-secondary)">keyboard_arrow_down</span>`;
          taskDropdown.style.display = 'none';
        });
      });
    }

    // Initialize with current job/task
    refreshTaskList(ts.jobId, ts.taskId || ts.taskPath);

    // Bind change listener
    jobSelect.addEventListener('change', (e) => {
      refreshTaskList(e.target.value, null);
    });

    showModal({
      title: 'Edit Timesheet Entry',
      content,
      size: 'modal-70',
      actions: [
        { label: 'Cancel', className: 'btn-secondary', onClick: (close) => close() },
        { label: 'Save Changes', className: 'btn-primary', onClick: (close) => {
          const startVal = document.getElementById('lt-start').value;
          const finishVal = document.getElementById('lt-finish').value;
          const techId = document.getElementById('lt-tech').value;
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

          store.update('timesheets', ts.id, {
            jobId: job.id,
            jobNumber: job.number,
            taskId: taskPathVal,
            taskPath: taskPathVal,
            taskName: taskNameVal,
            technicianId: techId,
            technicianName: tech.name,
            date: startVal.split('T')[0],
            startTime: startVal,
            finishTime: finishVal,
            hours,
            description: descVal || taskNameVal
          });

          showToast('Timesheet updated successfully', 'success');
          close();
          render();
        }}
      ]
    });
  }

  function openLogTimeModal() {
    const pathBreadcrumbs = {};
    function populateBreadcrumbs(tasks, currentPath = [], currentNamePath = []) {
      if (!tasks) return;
      tasks.forEach((p, i) => {
        const pathStr = [...currentPath, i].join('-');
        const namePath = [...currentNamePath, p.name].join(' > ');
        pathBreadcrumbs[pathStr] = namePath;
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
    const technicians = store.getAll('technicians');
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
        <div class="form-group" style="margin:0">
          <label class="form-label">Technician *</label>
          <select class="form-select" id="lt-tech" style="width:100%">
            <option value="">Select technician...</option>
            ${technicians.map(t => `<option value="${t.id}" ${filterTechId === t.id ? 'selected' : ''}>${t.name}</option>`).join('')}
          </select>
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
          <button class="form-select" id="lt-task-trigger" type="button" style="width:100%; text-align:left; display:flex; justify-content:space-between; align-items:center;" disabled>
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
          
          // Verify if it is a parent task
          const pathArr = pathStr.split('-').map(Number);
          const job = activeJobs.find(j => j.id === jobId);
          
          function checkHasSubTasks(tasks, pathArr) {
            let curr = tasks[pathArr[0]];
            for (let i = 1; i < pathArr.length; i++) {
              if (!curr || !curr.subTasks) return false;
              curr = curr.subTasks[pathArr[i]];
            }
            return curr && curr.subTasks && curr.subTasks.length > 0;
          }
          
          const hasChildren = checkHasSubTasks(job.tasks || [], pathArr);
          if (hasChildren) {
            // Parent clicked! Toggle subtasks collapse/expand instead of selecting.
            const childDiv = taskDropdown.querySelector(`#children-${pathStr}`);
            const toggle = taskDropdown.querySelector(`.tree-node-toggle[data-path="${pathStr}"]`);
            if (childDiv) {
              const isHidden = childDiv.style.display === 'none';
              childDiv.style.display = isHidden ? 'block' : 'none';
              if (toggle) toggle.classList.toggle('expanded', isHidden);
            }
            return;
          }

          // Leaf task clicked! Select it.
          const fullName = pathBreadcrumbs[pathStr] || row.dataset.name;

          taskHidden.value = pathStr;
          taskNameHidden.value = fullName;
          taskTrigger.innerHTML = `<span>${escapeHTML(fullName)}</span><span class="material-icons-outlined" style="font-size:18px; color:var(--text-secondary)">keyboard_arrow_down</span>`;
          
          taskDropdown.style.display = 'none';
        });
      });
    });

    showModal({
      title: 'Log Time on Behalf of Staff',
      content,
      size: 'modal-70',
      actions: [
        { label: 'Cancel', className: 'btn-secondary', onClick: (close) => close() },
        { label: 'Log Time', className: 'btn-primary', onClick: (close) => {
          const startVal = document.getElementById('lt-start').value;
          const finishVal = document.getElementById('lt-finish').value;
          const techId = document.getElementById('lt-tech').value;
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
            description: descVal || taskNameVal,
            status: 'Pending'
          });

          showToast('Time logged successfully on behalf of staff', 'success');
          close();
          render();
        }}
      ]
    });
  }

  render();
}
