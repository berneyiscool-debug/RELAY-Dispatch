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
import { createBulkActionBar } from '../../components/BulkActionBar.js';
import { createDateRangeFilter } from '../../utils/dateRangeFilter.js';
import { setListSearch } from '../../utils/listSearch.js';

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

  // Pagination — shares the global page-size preference key with the DataTable component
  // so the footer looks and behaves identically to the other list pages.
  const PAGE_SIZE_KEY = 'relay_table_page_size';
  const savedPageSize = parseInt(localStorage.getItem(PAGE_SIZE_KEY) || '15', 10);
  let pageSize = [15, 30, 45, 60].includes(savedPageSize) ? savedPageSize : 15;
  let currentPage = 1;
  let closePageSizePop = null; // outside-click handler, removed before each re-attach

  function getCombinedTimesheets() {
    const rawTimesheets = store.getAll('timesheets') || [];
    const schedules = store.getAll('schedule') || [];
    
    // Inject booked leave
    const leaveBlocks = schedules.filter(s => s.type === 'leave').map(s => {
      const startD = new Date(s.date + 'T' + String(Math.floor(s.startHour)).padStart(2, '0') + ':00');
      const endD = new Date(s.date + 'T' + String(Math.floor(s.endHour)).padStart(2, '0') + ':00');
      
      return {
        id: `leave_${s.id}`, // Prefix to intercept actions
        isLeave: true,
        originalScheduleId: s.id,
        technicianId: s.technicianId,
        date: s.date,
        startTime: startD.toISOString(),
        finishTime: endD.toISOString(),
        hours: s.endHour - s.startHour,
        jobNumber: 'LEAVE',
        taskName: 'Leave / Time Off',
        description: s.notes || 'Booked Leave',
        status: s.status || 'Pending' // default to Pending
      };
    });

    return [...rawTimesheets, ...leaveBlocks].sort((a, b) => new Date(b.date) - new Date(a.date));
  }

  function render() {
    const isLocalAdmin = localStorage.getItem('relay_login_mode') === 'local';
    const allTimesheets = getCombinedTimesheets();
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

    // Apply the tech + date-range filters first (across all statuses). This is the base
    // set the status-count chips are computed from, so their numbers match what the table
    // actually shows for the current tech/date window. The status filter is layered on top.
    let dateTechFiltered = [...visibleTimesheets];
    if (canViewAll && filterTechId !== 'All') {
      dateTechFiltered = dateTechFiltered.filter(t => String(t.technicianId) === String(filterTechId));
    }
    if (filterStartDate) {
      dateTechFiltered = dateTechFiltered.filter(t => (t.date ? t.date.split('T')[0] : '') >= filterStartDate);
    }
    if (filterEndDate) {
      dateTechFiltered = dateTechFiltered.filter(t => (t.date ? t.date.split('T')[0] : '') <= filterEndDate);
    }

    let filteredData = filterStatus === 'All' ? [...dateTechFiltered] : dateTechFiltered.filter(t => t.status === filterStatus);

    const totalPending = filteredData.filter(t => t.status === 'Pending').reduce((s, t) => s + (t.hours || 0), 0);

    const allFilteredIds = filteredData.map(t => t.id);
    const allSelected = allFilteredIds.length > 0 && allFilteredIds.every(id => selectedIds.includes(id));
    const showBulk = selectedIds.length > 0;

    // Paginate the flat (already date-sorted) entry list; grouping is applied to the
    // current page only. "Showing X–Y of Z" therefore counts individual entries, just
    // like the shared DataTable footer.
    const totalRows = filteredData.length;
    const totalPages = Math.max(1, Math.ceil(totalRows / pageSize));
    if (currentPage > totalPages) currentPage = totalPages;
    const pageStart = (currentPage - 1) * pageSize;
    const pagedData = filteredData.slice(pageStart, pageStart + pageSize);

    // Group by date (current page only)
    const groups = [];
    pagedData.forEach(t => {
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

    // Pagination footer — markup mirrors the shared DataTable component so it inherits
    // the same .pagination / .pagination-controls / .dt-page-size-* styling and behaviour.
    const paginationHTML = `
      <div class="pagination">
        <div class="pagination-info" style="display:flex; align-items:center; gap:12px;">
          <span>Showing ${totalRows === 0 ? 0 : pageStart + 1}–${Math.min(pageStart + pageSize, totalRows)} of ${totalRows}</span>
          <div class="pagination-page-size" style="position:relative; display:inline-flex; align-items:center; gap:4px; font-size:11px;">
            <span style="color:var(--text-secondary)">Per page:</span>
            <button type="button" class="btn btn-secondary btn-sm dt-page-size-trigger" style="height:22px; padding:0 6px; font-size:11px; display:inline-flex; align-items:center; gap:2px;">
              <span>${pageSize}</span>
              <span class="material-icons-outlined" style="font-size:13px">unfold_more</span>
            </button>
            <div class="dt-page-size-pop" hidden style="position:absolute; bottom:calc(100% + 4px); left:46px; background:var(--card-bg); border:1px solid var(--card-border); border-radius:var(--border-radius); box-shadow:var(--shadow-lg); padding:4px 0; z-index:1000; min-width:64px;">
              ${[15, 30, 45, 60].map(sz => `
                <div class="dt-page-size-opt ${sz === pageSize ? 'active' : ''}" data-val="${sz}" style="padding:4px 10px; cursor:pointer; font-size:11px; background:${sz === pageSize ? 'var(--color-primary-light)' : 'transparent'}; color:${sz === pageSize ? 'var(--color-primary)' : 'var(--text-primary)'}; font-weight:${sz === pageSize ? '600' : '400'};">
                  ${sz}
                </div>
              `).join('')}
            </div>
          </div>
        </div>
        <div class="pagination-controls">
          <button ${currentPage === 1 ? 'disabled' : ''} data-page="prev">‹</button>
          ${(() => {
            let s = '';
            for (let p = 1; p <= totalPages; p++) {
              if (totalPages > 7 && p > 2 && p < totalPages - 1 && Math.abs(p - currentPage) > 1) {
                if (p === 3 || p === totalPages - 2) s += '<button disabled>…</button>';
                continue;
              }
              s += `<button class="${p === currentPage ? 'page-active' : ''}" data-page="${p}">${p}</button>`;
            }
            return s;
          })()}
          <button ${currentPage === totalPages || totalPages === 0 ? 'disabled' : ''} data-page="next">›</button>
        </div>
      </div>`;

    container.innerHTML = `
      <div class="page-header" style="margin-bottom:8px; display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:8px;">
        <h1>Timesheets & Approval</h1>
        <div class="page-header-actions" style="display:flex; align-items:center; gap:6px; flex-wrap:wrap;">
          <div id="date-range-mount" style="display:inline-flex; align-items:center;"></div>
          <select id="filter-sort-select" class="form-select" style="height:25px; font-size:11px; padding:0 18px 0 8px; width:145px; margin:0; align-self:center;" title="Sort Timesheets">
            <option value="date_desc">Sort: Newest First</option>
            <option value="date_asc">Sort: Oldest First</option>
            <option value="technician_asc">Sort: Technician (A-Z)</option>
            <option value="hours_desc">Sort: Hours (High-Low)</option>
            <option value="status_asc">Sort: Status</option>
          </select>
          ${(currentUser.role === 'admin' || currentUser.role === 'manager' || isLocalAdmin) ? `
          <select class="form-select" id="filter-tech" style="height:25px; font-size:11px; padding:0 18px 0 8px; width:145px; margin:0; align-self:center;">
            <option value="All" ${filterTechId === 'All' ? 'selected' : ''}>All Technicians</option>
            ${(() => {
              const hasCurrentUser = technicians.some(t => t.id === currentUser.id);
              let html = '';
              if (!hasCurrentUser) {
                html += '<option value="' + currentUser.id + '" ' + (filterTechId === currentUser.id ? 'selected' : '') + '>' + currentUser.name + ' (You)</option>';
              }
              html += technicians.map(t => '<option value="' + t.id + '" ' + (filterTechId === t.id ? 'selected' : '') + '>' + t.name + '</option>').join('');
              return html;
            })()}
          </select>` : ''}
          <select id="filter-status-select" class="form-select" style="height:25px; font-size:11px; padding:0 18px 0 8px; width:145px; margin:0; align-self:center;">
            <option value="All" ${filterStatus === 'All' ? 'selected' : ''}>All Statuses (${dateTechFiltered.length})</option>
            <option value="Pending" ${filterStatus === 'Pending' ? 'selected' : ''}>Pending (${dateTechFiltered.filter(t => t.status === 'Pending').length})</option>
            <option value="Approved" ${filterStatus === 'Approved' ? 'selected' : ''}>Approved (${dateTechFiltered.filter(t => t.status === 'Approved').length})</option>
            <option value="Rejected" ${filterStatus === 'Rejected' ? 'selected' : ''}>Rejected (${dateTechFiltered.filter(t => t.status === 'Rejected').length})</option>
          </select>
          ${hasPermission('Timesheets', 'create') ? `
            <button class="btn btn-sm btn-primary" id="btn-log-time" data-tooltip="${(isLocalAdmin || !['admin', 'manager', 'office'].includes(currentUser.role)) ? 'Log a new timesheet entry' : 'Manually enter a timesheet record for another employee'}" data-tooltip-pos="left" style="height:25px; font-size:11px; padding:0 10px; display:inline-flex; align-items:center; gap:4px; margin:0; align-self:center;">
              <span class="material-icons-outlined" style="font-size:13px;">add</span> <span class="btn-label">Log Time</span>
            </button>
          ` : ''}
          ${(currentUser.role === 'admin' || currentUser.role === 'manager' || (permissions && permissions.approve)) ? `
            <button class="btn btn-sm btn-primary" id="btn-approve-all-pending" data-tooltip="Instantly approve all pending timesheets in the active filtered view" data-tooltip-pos="left" style="height:25px; font-size:11px; padding:0 10px; display:inline-flex; align-items:center; gap:4px; margin:0; align-self:center;" ${!visibleTimesheets.some(t => t.status === 'Pending') ? 'disabled' : ''}>
              <span class="material-icons-outlined" style="font-size:13px;">done_all</span> <span class="btn-label">Approve All</span>
            </button>
          ` : ''}
        </div>
      </div>

      <div id="timesheets-table-container">
      <div class="card data-table-card">
        ${groups.length === 0 ? `
        <div class="empty-state">
          <span class="material-icons-outlined">schedule</span>
          <h3>No timesheets found</h3>
          <p>Try adjusting your filters or log a new time entry.</p>
        </div>
        ` : `
        <div class="data-table-wrapper">
          <table class="data-table">
            <thead>
              <tr>
                <th style="width:40px; text-align:center;"><input type="checkbox" id="th-select-all" ${allSelected ? 'checked' : ''} style="cursor:pointer; width:16px; height:16px; margin:0;" /></th>
                <th style="width:120px">Date</th>
                <th>Technician</th>
                <th>Job</th>
                <th>Task</th>
                <th style="text-align:right; width:80px">Hours</th>
                <th style="width:110px">Status</th>
                <th style="width:104px; text-align:right">Actions</th>
              </tr>
            </thead>
            <tbody>
              ${groups.map(group => `
                <tr class="group-header" style="background:var(--content-bg); font-weight:600;">
                  <td></td>
                  <td colspan="4" style="color:var(--text-primary)">${group.dateStr}</td>
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
                    <td style="text-align:right; font-weight:600">${(t.hours ?? t.durationHours ?? t.duration_hours ?? 0).toFixed(2)}</td>
                    <td>
                      <span class="badge ${t.status === 'Approved' ? 'badge-success' : t.status === 'Rejected' ? 'badge-danger' : 'badge-warning'}">
                        ${escapeHTML(t.status)}
                      </span>
                    </td>
                    <td style="text-align:right; padding-top:2px; padding-bottom:2px">
                      <div style="display:flex; align-items:center; justify-content:flex-end; gap:2px;">
                        ${canEdit ? `
                          <button class="btn btn-sm btn-ghost btn-edit-timesheet" data-id="${t.id}" data-tooltip="Edit timesheet entry" data-tooltip-pos="left" style="height:25px;padding:0 4px;">
                            <span class="material-icons-outlined" style="font-size:16px">edit</span>
                          </button>
                        ` : ''}
                        ${canDelete ? `
                          <button class="btn btn-sm btn-ghost btn-delete-timesheet" data-id="${t.id}" data-tooltip="Delete timesheet entry" data-tooltip-pos="left" style="height:25px;padding:0 4px;color:var(--color-danger)">
                            <span class="material-icons-outlined" style="font-size:16px">delete</span>
                          </button>
                        ` : ''}
                        ${['admin', 'manager'].includes(currentUser.role) && t.status === 'Pending' ? `
                          <button class="btn btn-sm btn-ghost btn-approve-single" data-id="${t.id}" data-tooltip="Approve timesheet entry" data-tooltip-pos="left" style="height:25px;padding:0 4px;color:var(--color-success)">
                            <span class="material-icons-outlined" style="font-size:16px">check</span>
                          </button>
                          <button class="btn btn-sm btn-ghost btn-reject-single" data-id="${t.id}" data-tooltip="Reject timesheet entry" data-tooltip-pos="left" style="height:25px;padding:0 4px;color:var(--color-danger)">
                            <span class="material-icons-outlined" style="font-size:16px">close</span>
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
        ${paginationHTML}
        `}
      </div>
      </div>
    `;

    // Filter events
    container.querySelector('#filter-status-select')?.addEventListener('change', (e) => {
      filterStatus = e.target.value;
      render();
    });

    container.querySelector('#filter-tech')?.addEventListener('change', (e) => {
      filterTechId = e.target.value;
      render();
    });

    setListSearch((q) => {
      render();
    }, 'timesheets');

    const dateMount = container.querySelector('#date-range-mount');
    if (dateMount) {
      createDateRangeFilter({
        container: dateMount,
        onChange: (start, end) => {
          filterStartDate = start;
          filterEndDate = end;
          render();
        }
      });
    }

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

    // Pagination: per-page popover (opens upward, mirrors the DataTable component)
    const sizeTrigger = container.querySelector('.dt-page-size-trigger');
    const sizePop = container.querySelector('.dt-page-size-pop');
    if (sizeTrigger && sizePop) {
      sizeTrigger.addEventListener('click', (e) => {
        e.stopPropagation();
        sizePop.hidden = !sizePop.hidden;
      });
      sizePop.querySelectorAll('.dt-page-size-opt').forEach(opt => {
        opt.addEventListener('click', (e) => {
          e.stopPropagation();
          const val = parseInt(opt.dataset.val, 10);
          if (val) {
            pageSize = val;
            localStorage.setItem(PAGE_SIZE_KEY, String(pageSize));
            currentPage = 1;
            render();
          }
        });
      });
      // Re-attach a single outside-click closer (avoids piling up listeners across renders)
      if (closePageSizePop) document.removeEventListener('click', closePageSizePop);
      closePageSizePop = (e) => {
        if (!sizeTrigger.contains(e.target) && !sizePop.contains(e.target)) sizePop.hidden = true;
      };
      document.addEventListener('click', closePageSizePop);
    }

    // Pagination: prev / next / numbered page controls
    container.querySelectorAll('.pagination-controls button[data-page]').forEach(btn => {
      btn.addEventListener('click', () => {
        const page = btn.dataset.page;
        if (page === 'prev') currentPage--;
        else if (page === 'next') currentPage++;
        else currentPage = parseInt(page, 10);
        render();
      });
    });

    // Reconcile the shared bulk-action bar. Called (deferred) on every render so an
    // empty selection cleans up too. It MUST run after the app shell's page-header
    // relocation (a MutationObserver microtask that clears #breadcrumb-actions on each
    // re-render) — otherwise that relocation wipes the bar and leaves the filters hidden
    // by the lingering `has-bulk` class. A macrotask (setTimeout 0) runs after microtasks.
    const syncBulkBar = () => {
      const actions = [];
      if (currentUser.role === 'admin' || currentUser.role === 'manager' || (permissions && permissions.approve)) {
        actions.push({
          label: 'Approve',
          icon: 'done',
          className: 'btn-success',
          onClick: (ids) => {
            ids.forEach(id => {
              if (id.startsWith('leave_')) {
                store.update('schedule', id.replace('leave_', ''), { status: 'Approved' });
              } else {
                store.update('timesheets', id, { status: 'Approved' });
              }
            });
            showToast(`Approved ${ids.length} timesheets successfully`, 'success');
            selectedIds = [];
            render();
          }
        });
        actions.push({
          label: 'Reject',
          icon: 'close',
          className: 'btn-danger',
          onClick: (ids) => {
            ids.forEach(id => {
              if (id.startsWith('leave_')) {
                store.update('schedule', id.replace('leave_', ''), { status: 'Rejected' });
              } else {
                store.update('timesheets', id, { status: 'Rejected' });
              }
            });
            showToast(`Rejected ${ids.length} timesheets`, 'error');
            selectedIds = [];
            render();
          }
        });
      }
      if (hasPermission('Timesheets', 'delete') || ['admin', 'manager', 'office'].includes(currentUser.role)) {
        actions.push({
          label: 'Delete',
          icon: 'delete',
          className: 'btn-danger',
          onClick: (ids) => {
            const count = ids.length;
            showModal({
              title: 'Confirm Bulk Delete',
              content: `<p>Are you sure you want to delete <strong>${count}</strong> selected timesheet ${count === 1 ? 'entry' : 'entries'}? This action cannot be undone.</p>`,
              actions: [
                { label: 'Cancel', className: 'btn-secondary', onClick: (close) => close() },
                {
                  label: `Delete (${count})`,
                  className: 'btn-danger',
                  onClick: (close) => {
                    ids.forEach(id => {
                      if (id.startsWith('leave_')) {
                        store.delete('schedule', id.replace('leave_', ''));
                      } else {
                        store.delete('timesheets', id);
                      }
                    });
                    showToast(`Deleted ${count} timesheet ${count === 1 ? 'entry' : 'entries'} successfully`, 'success');
                    selectedIds = [];
                    close();
                    render();
                  }
                }
              ]
            });
          }
        });
      }

      createBulkActionBar({
        container,
        selectedIds,
        actions,
        onClear: () => {
          selectedIds = [];
          render();
        }
      });
    };
    setTimeout(syncBulkBar, 0);

    const triggerExportSelected = () => {
      if (selectedIds.length === 0) return;

      const allTimesheets = getCombinedTimesheets();
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
      pending.forEach(ts => {
        if (ts.isLeave) {
          store.update('schedule', ts.originalScheduleId, { status: 'Approved' });
        } else {
          store.update('timesheets', ts.id, { status: 'Approved' });
        }
      });
      showToast(`Approved ${pending.length} pending timesheets`, 'success');
      render();
    });

    // Single approval/rejection events
    container.querySelectorAll('.btn-approve-single').forEach(btn => {
      btn.addEventListener('click', () => {
        const id = btn.dataset.id;
        if (id.startsWith('leave_')) {
          store.update('schedule', id.replace('leave_', ''), { status: 'Approved' });
        } else {
          store.update('timesheets', id, { status: 'Approved' });
        }
        showToast('Timesheet entry approved', 'success');
        render();
      });
    });

    container.querySelectorAll('.btn-reject-single').forEach(btn => {
      btn.addEventListener('click', () => {
        const id = btn.dataset.id;
        if (id.startsWith('leave_')) {
          store.update('schedule', id.replace('leave_', ''), { status: 'Rejected' });
        } else {
          store.update('timesheets', id, { status: 'Rejected' });
        }
        showToast('Timesheet entry rejected', 'error');
        render();
      });
    });

    // Edit entry
    container.querySelectorAll('.btn-edit-timesheet').forEach(btn => {
      btn.addEventListener('click', () => {
        if (btn.dataset.id.startsWith('leave_')) {
          showToast('Leave blocks cannot be edited from timesheets. Edit them from the schedule.', 'info');
          return;
        }
        openEditModal(btn.dataset.id);
      });
    });

    // Delete entry
    container.querySelectorAll('.btn-delete-timesheet').forEach(btn => {
      btn.addEventListener('click', () => {
        const tsId = btn.dataset.id;
        const ts = getCombinedTimesheets().find(t => t.id === tsId);
        if (!ts) return;

        showModal({
          title: 'Confirm Delete',
          content: `<p>Are you sure you want to delete this ${ts.isLeave ? 'leave block' : 'timesheet entry'} for <strong>${ts.hours} hrs</strong> on <strong>${new Date(ts.date).toLocaleDateString()}</strong>?</p>`,
          actions: [
            { label: 'Cancel', className: 'btn-secondary', onClick: (close) => close() },
            { label: 'Delete', className: 'btn-danger', onClick: (close) => {
              if (ts.isLeave) {
                store.delete('schedule', ts.originalScheduleId);
              } else {
                store.delete('timesheets', tsId);
              }
              showToast(`${ts.isLeave ? 'Leave block' : 'Timesheet entry'} deleted successfully`, 'success');
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
