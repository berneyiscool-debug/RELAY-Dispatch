// ============================================
// RELAY — ATTENDANCE TRACKER
// ============================================
// The views behind the Attendance and Payroll sections, driven by ?tab= / ?view=:
//   attendance → log (clock in/out session log)
//   payroll    → run (pay-period hours & gross pay), variance (roster vs actual)
// Children are picked from the sidebar submenu, so no view renders its own tab strip
// (see utils/timesheetSections.js). The Hours section has its own page (Hours.js).
// All read the local-first store (cloud + offline) via the timeClocks,
// schedule and technicians collections.

import { store } from '../../data/store.js';
import { showToast } from '../../components/Notifications.js';
import { showModal } from '../../components/Modal.js';
import { createDataTable } from '../../components/DataTable.js';
import { createBulkActionBar } from '../../components/BulkActionBar.js';
import { escapeHTML } from '../../utils/security.js';
import { hasPermission } from '../../utils/permissions.js';
import { createDateRangeFilter } from '../../utils/dateRangeFilter.js';
import { formatDuration, mapsLink } from '../../utils/timeClock.js';
import { resolveSection, viewTitle, sectionPath } from '../../utils/timesheetSections.js';

const PAGE_SIZE_KEY = 'relay_table_page_size';

function getSavedPageSize() {
  const saved = parseInt(localStorage.getItem(PAGE_SIZE_KEY) || '15', 10);
  return [15, 30, 45, 60].includes(saved) ? saved : 15;
}

function localISODate(iso) {
  if (!iso) return '';
  const d = new Date(iso);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function fmtDate(iso) {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('en-AU', { day: 'numeric', month: 'short', year: 'numeric' });
}

function fmtTime(iso) {
  if (!iso) return '—';
  return new Date(iso).toLocaleTimeString('en-AU', { hour: 'numeric', minute: '2-digit' });
}

function fmtCoord(v) {
  if (typeof v === 'number' && isFinite(v)) return v.toFixed(5);
  return v != null ? String(v) : '';
}

function durationMs(rec) {
  if (!rec.clockInAt) return 0;
  const end = rec.clockOutAt ? new Date(rec.clockOutAt) : Date.now();
  return Math.max(0, end - new Date(rec.clockInAt));
}

function msToHours(ms) { return ms / 3600000; }

function round2(n) { return Math.round(n * 100) / 100; }

function defaultRange() {
  const end = new Date();
  const start = new Date();
  start.setDate(end.getDate() - 29);
  const pad = n => String(n).padStart(2, '0');
  const f = d => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
  return { start: f(start), end: f(end) };
}

function getContext() {
  const currentUser = JSON.parse(localStorage.getItem('currentUser') || '{"role":"admin"}');
  const isLocalAdmin = localStorage.getItem('relay_login_mode') === 'local';
  const userType = currentUser.userTypeId ? store.getById('userTypes', currentUser.userTypeId) : null;
  const permissions = userType ? userType.permissions?.find(p => p.module === 'Timesheets') : null;
  const canViewAll = ['admin', 'manager', 'office'].includes(currentUser.role) || (permissions && permissions.view) || isLocalAdmin;
  const canExport = hasPermission('Timesheets', 'export') || ['admin', 'manager', 'office'].includes(currentUser.role) || isLocalAdmin;
  const technicians = (store.getAll('technicians') || []).filter(t => !t.deactivated).sort((a, b) => (a.name || '').localeCompare(b.name || ''));
  const allClocks = store.getAll('timeClocks') || [];
  return { currentUser, isLocalAdmin, canViewAll, canExport, technicians, allClocks };
}

function paginationHTML(page, pageSize, totalRows) {
  const totalPages = Math.max(1, Math.ceil(totalRows / pageSize));
  const pageStart = (page - 1) * pageSize;
  return `
    <div class="pagination">
      <div class="pagination-info">
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
        <button ${page === 1 ? 'disabled' : ''} data-page="prev">‹</button>
        ${(() => {
          let s = '';
          for (let p = 1; p <= totalPages; p++) {
            if (totalPages > 7 && p > 2 && p < totalPages - 1 && Math.abs(p - page) > 1) {
              if (p === 3 || p === totalPages - 2) s += '<button disabled>…</button>';
              continue;
            }
            s += `<button class="${p === page ? 'page-active' : ''}" data-page="${p}">${p}</button>`;
          }
          return s;
        })()}
        <button ${page === totalPages || totalPages === 0 ? 'disabled' : ''} data-page="next">›</button>
      </div>
    </div>`;
}

function wirePagination(container, state, render) {
  const sizeTrigger = container.querySelector('.dt-page-size-trigger');
  const sizePop = container.querySelector('.dt-page-size-pop');
  if (sizeTrigger && sizePop) {
    sizeTrigger.addEventListener('click', (e) => { e.stopPropagation(); sizePop.hidden = !sizePop.hidden; });
    sizePop.querySelectorAll('.dt-page-size-opt').forEach(opt => {
      opt.addEventListener('click', (e) => {
        e.stopPropagation();
        const val = parseInt(opt.dataset.val, 10);
        if (val) {
          state.pageSize = val;
          localStorage.setItem(PAGE_SIZE_KEY, String(val));
          state.page = 1;
          render();
        }
      });
    });
  }
  container.querySelectorAll('.pagination-controls [data-page]').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const p = e.currentTarget.dataset.page;
      const totalPages = Math.max(1, Math.ceil((state.totalRows || 0) / state.pageSize));
      if (p === 'prev') state.page = Math.max(1, state.page - 1);
      else if (p === 'next') state.page = Math.min(totalPages, state.page + 1);
      else state.page = parseInt(p, 10);
      render();
    });
  });
}

function downloadCSV(filename, rows) {
  const csv = rows.map(r => r.map(cell => {
    const s = cell == null ? '' : String(cell);
    return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  }).join(',')).join('\n');
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

function mountDateRange(container, state, render) {
  const dateMount = container.querySelector('#date-range-mount');
  if (!dateMount) return;
  createDateRangeFilter({
    container: dateMount,
    onChange: (start, end) => {
      state.start = start;
      state.end = end;
      state.page = 1;
      render();
    }
  });
}

// ------------------------------------------------------------
// 1. ATTENDANCE RECORDS — clock in/out session log
// ------------------------------------------------------------
function renderAttendanceRecords(container, params = {}) {
  const nav = resolveSection(params.tab, params.view);
  const ctx = getContext();
  const r = defaultRange();
  const state = { start: r.start, end: r.end, tech: 'All', page: 1, pageSize: getSavedPageSize(), totalRows: 0 };

  function compute() {
    let rows = ctx.allClocks;
    if (!ctx.canViewAll) rows = rows.filter(x => String(x.technicianId) === String(ctx.currentUser.id));
    else if (state.tech !== 'All') rows = rows.filter(x => String(x.technicianId) === String(state.tech));
    rows = rows.filter(x => {
      const d = localISODate(x.clockInAt);
      if (state.start && d < state.start) return false;
      if (state.end && d > state.end) return false;
      return true;
    });
    return rows.sort((a, b) => new Date(b.clockInAt) - new Date(a.clockInAt));
  }

  function render() {
    const rows = compute();
    state.totalRows = rows.length;
    const techOptions = ctx.technicians;

    container.innerHTML = `
      <div class="page-header" style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:8px;">
        <h1>${viewTitle(nav.section, nav.view)}</h1>
        <div class="page-header-actions" style="display:flex; align-items:center; gap:6px; flex-wrap:wrap;">
          <div id="date-range-mount" style="display:inline-flex; align-items:center;"></div>
          ${ctx.canViewAll ? `<select id="filter-tech" class="form-select" style="height:25px; font-size:11px; padding:0 18px 0 8px; width:150px; margin:0; align-self:center;">
            <option value="All" ${state.tech === 'All' ? 'selected' : ''}>All Technicians</option>
            ${techOptions.map(t => `<option value="${escapeHTML(String(t.id))}" ${String(state.tech) === String(t.id) ? 'selected' : ''}>${escapeHTML(t.name)}</option>`).join('')}
          </select>` : ''}
          ${ctx.canExport ? `<button class="btn btn-sm btn-secondary" id="btn-export-csv" data-tooltip="Export attendance records to CSV" data-tooltip-pos="left" style="height:25px; font-size:11px; padding:0 10px; display:inline-flex; align-items:center; gap:4px; margin:0; align-self:center;">
            <span class="material-icons-outlined" style="font-size:13px;">download</span> Export CSV
          </button>` : ''}
        </div>
      </div>
      <div id="attendance-table-container"></div>
    `;

    const tableContainer = container.querySelector('#attendance-table-container');
    let table;
    table = createDataTable({
      columns: [
        // Widths are the columns' measured content needs — the header label plus the
        // widest cell — as shares of the table, so every value is legible in full at
        // the app's window size instead of being ellipsised.
        { key: 'date', label: 'Date', render: (x) => `<span class="text-secondary">${fmtDate(x.clockInAt)}</span>`, getValue: (x) => new Date(x.clockInAt).getTime(), width: '13.6%' },
        { key: 'technicianName', label: 'Technician', render: (x) => escapeHTML(x.technicianName || '—'), getValue: (x) => (x.technicianName || '').toLowerCase(), width: '14.3%' },
        { key: 'clockIn', label: 'Clock In', render: (x) => fmtTime(x.clockInAt), getValue: (x) => new Date(x.clockInAt).getTime(), width: '11%' },
        { key: 'clockOut', label: 'Clock Out', render: (x) => fmtTime(x.clockOutAt), getValue: (x) => new Date(x.clockOutAt || x.clockInAt).getTime(), width: '12.9%' },
        { key: 'duration', label: 'Duration', render: (x) => formatDuration(durationMs(x)), getValue: (x) => durationMs(x), width: '11.3%', align: 'right' },
        { key: 'location', label: 'Location', render: (x) => {
          const loc = x.clockInLocation;
          const link = mapsLink(loc);
          if (!link) return '<span class="text-secondary">—</span>';
          return `<a href="${link}" target="_blank" rel="noopener" class="cell-link" title="Open in Maps">${escapeHTML(fmtCoord(loc.lat))}, ${escapeHTML(fmtCoord(loc.lng))}</a>`;
        }, width: '21.6%' },
        { key: 'status', label: 'Status', render: (x) => {
          const inProgress = !x.clockOutAt;
          return `<span class="badge ${inProgress ? 'badge-warning' : 'badge-success'}">${inProgress ? 'In Progress' : 'Completed'}</span>`;
        }, getValue: (x) => (!x.clockOutAt ? 'In Progress' : 'Completed'), width: '15.3%' }
      ],
      data: rows,
      getId: (x) => String(x.id),
      selectable: true,
      defaultSortKey: 'date',
      defaultSortDir: 'desc',
      onSelectionChange: (selectedIds) => {
        createBulkActionBar({
          container: tableContainer,
          selectedIds,
          actions: [{
            label: 'Export CSV',
            icon: 'download',
            className: 'btn-secondary',
            onClick: (ids) => {
              const selectedRows = rows.filter(row => ids.includes(String(row.id)));
              if (!selectedRows.length) return;
              const csv = [['Date', 'Technician', 'Clock In', 'Clock Out', 'Duration', 'Hours', 'Latitude', 'Longitude', 'Status']];
              selectedRows.forEach(x => {
                csv.push([
                  fmtDate(x.clockInAt),
                  x.technicianName || '',
                  fmtTime(x.clockInAt),
                  fmtTime(x.clockOutAt),
                  formatDuration(durationMs(x)),
                  msToHours(durationMs(x)).toFixed(2),
                  fmtCoord(x.clockInLocation?.lat),
                  fmtCoord(x.clockInLocation?.lng),
                  x.clockOutAt ? 'Completed' : 'In Progress'
                ]);
              });
              downloadCSV(`attendance_records_selected_${new Date().toISOString().slice(0, 10)}.csv`, csv);
              showToast(`Exported ${selectedRows.length} selected attendance records to CSV`);
              table.clearSelection();
            }
          }],
          onClear: () => table.clearSelection()
        });
      }
    });
    tableContainer.appendChild(table);

    mountDateRange(container, state, render);
    container.querySelector('#filter-tech')?.addEventListener('change', (e) => { state.tech = e.target.value; state.page = 1; render(); });
    container.querySelector('#btn-export-csv')?.addEventListener('click', () => {
      const csv = [['Date', 'Technician', 'Clock In', 'Clock Out', 'Duration', 'Hours', 'Latitude', 'Longitude', 'Status']];
      rows.forEach(x => {
        csv.push([
          fmtDate(x.clockInAt),
          x.technicianName || '',
          fmtTime(x.clockInAt),
          fmtTime(x.clockOutAt),
          formatDuration(durationMs(x)),
          msToHours(durationMs(x)).toFixed(2),
          fmtCoord(x.clockInLocation?.lat),
          fmtCoord(x.clockInLocation?.lng),
          x.clockOutAt ? 'Completed' : 'In Progress'
        ]);
      });
      downloadCSV(`attendance_records_${state.start || 'all'}_${state.end || 'all'}.csv`, csv);
      showToast('Attendance records exported to CSV');
    });
  }

  render();
}

// ------------------------------------------------------------
// 2. SCHEDULE vs ACTUAL — booked hours compared to clocked hours
// ------------------------------------------------------------
function renderScheduleVsActual(container, params = {}) {
  const nav = resolveSection(params.tab, params.view);
  const ctx = getContext();
  const r = defaultRange();
  const state = { start: r.start, end: r.end, tech: 'All', page: 1, pageSize: getSavedPageSize(), totalRows: 0 };

  function schedHoursFor(techId, date) {
    let sum = 0;
    (store.getAll('schedule') || []).forEach(s => {
      if (s.type === 'leave') return;
      if (!s.date || s.date.split('T')[0] !== date) return;
      if (String(s.technicianId) !== String(techId)) return;
      sum += (s.hours ?? (s.endHour != null && s.startHour != null ? s.endHour - s.startHour : 0));
    });
    return sum;
  }

  function actualHoursFor(techId, date) {
    let sum = 0;
    ctx.allClocks.forEach(c => {
      if (String(c.technicianId) !== String(techId)) return;
      if (localISODate(c.clockInAt) !== date) return;
      sum += msToHours(durationMs(c));
    });
    return sum;
  }

  function compute() {
    const rows = [];
    const schedules = store.getAll('schedule') || [];
    const visibleTechs = ctx.canViewAll
      ? ctx.technicians.filter(t => state.tech === 'All' || String(t.id) === String(state.tech))
      : ctx.technicians.filter(t => String(t.id) === String(ctx.currentUser.id));
    visibleTechs.forEach(tech => {
      const days = new Set();
      schedules.forEach(s => { if (String(s.technicianId) === String(tech.id)) days.add(s.date.split('T')[0]); });
      ctx.allClocks.forEach(c => { if (String(c.technicianId) === String(tech.id)) days.add(localISODate(c.clockInAt)); });
      days.forEach(date => {
        if (state.start && date < state.start) return;
        if (state.end && date > state.end) return;
        const sched = round2(schedHoursFor(tech.id, date));
        const actual = round2(actualHoursFor(tech.id, date));
        const variance = round2(actual - sched);
        let flag;
        if (sched > 0 && actual === 0) flag = 'No Show';
        else if (sched === 0 && actual > 0) flag = 'Unscheduled';
        else if (actual > sched) flag = 'Over';
        else if (actual < sched) flag = 'Under';
        else flag = 'On Track';
        rows.push({ date, tech, sched, actual, variance, flag });
      });
    });
    rows.sort((a, b) => b.date.localeCompare(a.date) || (a.tech.name || '').localeCompare(b.tech.name || ''));
    return rows;
  }

  const flagBadge = {
    'On Track': 'badge-success',
    'Over': 'badge-warning',
    'Under': 'badge-warning',
    'Unscheduled': 'badge-warning',
    'No Show': 'badge-danger'
  };

  const techOptions = ctx.canViewAll ? ctx.technicians : [];

  function render() {
    const rows = compute();
    state.totalRows = rows.length;

    container.innerHTML = `
      <div class="page-header" style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:8px;">
        <h1>${viewTitle(nav.section, nav.view)}</h1>
        <div class="page-header-actions" style="display:flex; align-items:center; gap:6px; flex-wrap:wrap;">
          <div id="date-range-mount" style="display:inline-flex; align-items:center;"></div>
          ${ctx.canViewAll ? `<select id="filter-tech" class="form-select" style="height:25px; font-size:11px; padding:0 18px 0 8px; width:150px; margin:0; align-self:center;">
            <option value="All" ${state.tech === 'All' ? 'selected' : ''}>All Technicians</option>
            ${techOptions.map(t => `<option value="${escapeHTML(String(t.id))}" ${String(state.tech) === String(t.id) ? 'selected' : ''}>${escapeHTML(t.name)}</option>`).join('')}
          </select>` : ''}
          ${ctx.canExport ? `<button class="btn btn-sm btn-secondary" id="btn-export-csv" data-tooltip="Export schedule vs actual comparison to CSV" data-tooltip-pos="left" style="height:25px; font-size:11px; padding:0 10px; display:inline-flex; align-items:center; gap:4px; margin:0; align-self:center;">
            <span class="material-icons-outlined" style="font-size:13px;">download</span> Export CSV
          </button>` : ''}
        </div>
      </div>
      <div id="attendance-table-container"></div>
    `;

    const tableContainer = container.querySelector('#attendance-table-container');
    let table;
    table = createDataTable({
      columns: [
        // Widths are the columns' measured content needs — the header label plus the
        // widest cell — as shares of the table, so every value is legible in full at
        // the app's window size instead of being ellipsised.
        { key: 'date', label: 'Date', render: (x) => `<span class="text-secondary">${fmtDate(x.date)}</span>`, getValue: (x) => new Date(x.date).getTime(), width: '16.9%' },
        { key: 'techName', label: 'Technician', render: (x) => escapeHTML(x.tech.name || '—'), getValue: (x) => (x.tech.name || '').toLowerCase(), width: '17.8%' },
        { key: 'sched', label: 'Scheduled', render: (x) => x.sched.toFixed(2), getValue: (x) => x.sched, width: '16.2%', align: 'right' },
        { key: 'actual', label: 'Actual', render: (x) => x.actual.toFixed(2), getValue: (x) => x.actual, width: '12.7%', align: 'right' },
        { key: 'variance', label: 'Variance', render: (x) => `${(x.variance > 0 ? '+' : '') + x.variance.toFixed(2)}` , getValue: (x) => x.variance, width: '14.6%', align: 'right' },
        { key: 'flag', label: 'Status', render: (x) => `<span class="badge ${flagBadge[x.flag] || 'badge-warning'}">${escapeHTML(x.flag)}</span>`, getValue: (x) => x.flag, width: '21.8%' }
      ],
      data: rows,
      getId: (x) => `${x.date}-${x.tech.id}`,
      selectable: true,
      defaultSortKey: 'date',
      defaultSortDir: 'desc',
      onSelectionChange: (selectedIds) => {
        createBulkActionBar({
          container: tableContainer,
          selectedIds,
          actions: [{
            label: 'Export CSV',
            icon: 'download',
            className: 'btn-secondary',
            onClick: (ids) => {
              const selectedRows = rows.filter(row => ids.includes(`${row.date}-${row.tech.id}`));
              if (!selectedRows.length) return;
              const csv = [['Date', 'Technician', 'Scheduled Hours', 'Actual Hours', 'Variance', 'Status']];
              selectedRows.forEach(x => csv.push([fmtDate(x.date), x.tech.name || '', x.sched.toFixed(2), x.actual.toFixed(2), x.variance.toFixed(2), x.flag]));
              downloadCSV(`schedule_vs_actual_selected_${new Date().toISOString().slice(0, 10)}.csv`, csv);
              showToast(`Exported ${selectedRows.length} selected schedule rows to CSV`);
              table.clearSelection();
            }
          }],
          onClear: () => table.clearSelection()
        });
      }
    });
    tableContainer.appendChild(table);

    mountDateRange(container, state, render);
    container.querySelector('#filter-tech')?.addEventListener('change', (e) => {
      state.tech = e.target.value;
      state.page = 1;
      render();
    });
    container.querySelector('#btn-export-csv')?.addEventListener('click', () => {
      const csv = [['Date', 'Technician', 'Scheduled Hours', 'Actual Hours', 'Variance', 'Status']];
      rows.forEach(x => csv.push([fmtDate(x.date), x.tech.name || '', x.sched.toFixed(2), x.actual.toFixed(2), x.variance.toFixed(2), x.flag]));
      downloadCSV(`schedule_vs_actual_${state.start || 'all'}_${state.end || 'all'}.csv`, csv);
      showToast('Schedule vs actual comparison exported to CSV');
    });
  }

  render();
}

// ------------------------------------------------------------
// 3. HOURS & PAYROLL — pay-period hours, overtime & gross pay
// ------------------------------------------------------------
function renderPayroll(container, params = {}) {
  const nav = resolveSection(params.tab, params.view);
  const ctx = getContext();
  const r = defaultRange();
  const OVERTIME_DAILY_HOURS = 8;
  const OT_MULTIPLIER = 1.5;
  const state = { start: r.start, end: r.end, tech: 'All', page: 1, pageSize: getSavedPageSize(), totalRows: 0 };

  function payableHours(c) {
    const st = c.approvalStatus || 'pending';
    if (st === 'rejected' || st === 'pending') return 0;
    return c.approvedHours != null ? Number(c.approvedHours) : msToHours(durationMs(c));
  }

  function dailyHours(techId) {
    const map = {};
    ctx.allClocks.forEach(c => {
      if (String(c.technicianId) !== String(techId)) return;
      const d = localISODate(c.clockInAt);
      if (state.start && d < state.start) return;
      if (state.end && d > state.end) return;
      map[d] = (map[d] || 0) + payableHours(c);
    });
    return map;
  }

  function pendingCountInRange() {
    let n = 0;
    ctx.allClocks.forEach(c => {
      if (!ctx.canViewAll && String(c.technicianId) !== String(ctx.currentUser.id)) return;
      if (ctx.canViewAll && state.tech !== 'All' && String(c.technicianId) !== String(state.tech)) return;
      const d = localISODate(c.clockInAt);
      if (state.start && d < state.start) return;
      if (state.end && d > state.end) return;
      if ((c.approvalStatus || 'pending') === 'pending') n++;
    });
    return n;
  }

  function compute() {
    const rows = [];
    state.pendingCount = pendingCountInRange();
    const payees = ctx.canViewAll
      ? ctx.technicians.filter(t => state.tech === 'All' || String(t.id) === String(state.tech))
      : ctx.technicians.filter(t => String(t.id) === String(ctx.currentUser.id));
    payees.forEach(tech => {
      const dayMap = dailyHours(tech.id);
      const dayKeys = Object.keys(dayMap);
      if (dayKeys.length === 0) return;
      let reg = 0;
      let ot = 0;
      dayKeys.forEach(d => {
        const h = dayMap[d];
        if (h > OVERTIME_DAILY_HOURS) { reg += OVERTIME_DAILY_HOURS; ot += h - OVERTIME_DAILY_HOURS; }
        else reg += h;
      });
      reg = round2(reg);
      ot = round2(ot);
      const rate = tech.payRate ?? tech.pay_rate ?? tech.rate ?? 0;
      const regPay = round2(reg * rate);
      const otPay = round2(ot * rate * OT_MULTIPLIER);
      const gross = round2(regPay + otPay);
      rows.push({ tech, days: dayKeys.length, reg, ot, total: round2(reg + ot), rate, regPay, otPay, gross });
    });
    rows.sort((a, b) => (a.tech.name || '').localeCompare(b.tech.name || ''));
    return rows;
  }

  const fmtMoney = (n) => (n || 0).toLocaleString('en-AU', { style: 'currency', currency: 'AUD' });
  const hourMoney = (n) => (n || 0).toLocaleString('en-AU', { minimumFractionDigits: 2, maximumFractionDigits: 2, style: 'currency', currency: 'AUD' });

  const techOptions = ctx.canViewAll ? ctx.technicians : [];

  function render() {
    const rows = compute();
    state.totalRows = rows.length;

    container.innerHTML = `
      <div class="page-header" style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:8px;">
        <h1>${viewTitle(nav.section, nav.view)}</h1>
        <div class="page-header-actions" style="display:flex; align-items:center; gap:6px; flex-wrap:wrap;">
          <div id="date-range-mount" style="display:inline-flex; align-items:center;"></div>
          ${ctx.canViewAll ? `<select id="filter-tech" class="form-select" style="height:25px; font-size:11px; padding:0 18px 0 8px; width:150px; margin:0; align-self:center;">
            <option value="All" ${state.tech === 'All' ? 'selected' : ''}>All Technicians</option>
            ${techOptions.map(t => `<option value="${escapeHTML(String(t.id))}" ${String(state.tech) === String(t.id) ? 'selected' : ''}>${escapeHTML(t.name)}</option>`).join('')}
          </select>` : ''}
          ${ctx.canExport ? `<button class="btn btn-sm btn-secondary" id="btn-export-csv" data-tooltip="Export payroll summary to CSV" data-tooltip-pos="left" style="height:25px; font-size:11px; padding:0 10px; display:inline-flex; align-items:center; gap:4px; margin:0; align-self:center;">
            <span class="material-icons-outlined" style="font-size:13px;">download</span> Export CSV
          </button>` : ''}
        </div>
      </div>
      <div id="attendance-table-container"></div>
    `;

    const tableContainer = container.querySelector('#attendance-table-container');
    let table;
    table = createDataTable({
      columns: [
        { key: 'techName', label: 'Technician', render: (x) => escapeHTML(x.tech.name || '—'), getValue: (x) => (x.tech.name || '').toLowerCase(), width: '18%' },
        { key: 'days', label: 'Days', render: (x) => x.days, getValue: (x) => x.days, width: '8%', align: 'right' },
        { key: 'reg', label: 'Reg Hrs', render: (x) => x.reg.toFixed(2), getValue: (x) => x.reg, width: '10%', align: 'right' },
        { key: 'ot', label: 'OT Hrs', render: (x) => x.ot.toFixed(2), getValue: (x) => x.ot, width: '10%', align: 'right' },
        { key: 'total', label: 'Total Hrs', render: (x) => `<strong>${x.total.toFixed(2)}</strong>`, getValue: (x) => x.total, width: '11%', align: 'right' },
        { key: 'rate', label: 'Rate', render: (x) => hourMoney(x.rate), getValue: (x) => x.rate, width: '10%', align: 'right' },
        { key: 'regPay', label: 'Reg Pay', render: (x) => fmtMoney(x.regPay), getValue: (x) => x.regPay, width: '12%', align: 'right' },
        { key: 'otPay', label: 'OT Pay', render: (x) => fmtMoney(x.otPay), getValue: (x) => x.otPay, width: '10%', align: 'right' },
        { key: 'gross', label: 'Gross Pay', render: (x) => `<strong>${fmtMoney(x.gross)}</strong>`, getValue: (x) => x.gross, width: '12%', align: 'right' }
      ],
      data: rows,
      getId: (x) => String(x.tech.id),
      selectable: true,
      defaultSortKey: 'techName',
      defaultSortDir: 'asc',
      onSelectionChange: (selectedIds) => {
        createBulkActionBar({
          container: tableContainer,
          selectedIds,
          actions: [{
            label: 'Export CSV',
            icon: 'download',
            className: 'btn-secondary',
            onClick: (ids) => {
              const selectedRows = rows.filter(row => ids.includes(String(row.tech.id)));
              if (!selectedRows.length) return;
              const csv = [['Technician', 'Days', 'Regular Hours', 'OT Hours', 'Total Hours', 'Rate', 'Regular Pay', 'OT Pay', 'Gross Pay']];
              selectedRows.forEach(x => csv.push([x.tech.name || '', x.days, x.reg.toFixed(2), x.ot.toFixed(2), x.total.toFixed(2), x.rate.toFixed(2), x.regPay.toFixed(2), x.otPay.toFixed(2), x.gross.toFixed(2)]));
              downloadCSV(`payroll_selected_${new Date().toISOString().slice(0, 10)}.csv`, csv);
              showToast(`Exported ${selectedRows.length} selected payroll rows to CSV`);
              table.clearSelection();
            }
          }],
          onClear: () => table.clearSelection()
        });
      }
    });
    tableContainer.appendChild(table);

    if (state.pendingCount > 0) {
      const note = document.createElement('div');
      note.style.cssText = 'padding:10px 16px; font-size:11px; color:var(--color-warning); background:var(--color-warning-bg); border-radius:var(--border-radius); margin:10px 0; display:flex; align-items:center; gap:8px;';
      note.innerHTML = `<span class="material-icons-outlined" style="font-size:15px;">info</span><span>${state.pendingCount} session${state.pendingCount === 1 ? '' : 's'} ${state.pendingCount === 1 ? 'is' : 'are'} pending approval and ${state.pendingCount === 1 ? 'is' : 'are'} not included in this payroll. Review them in <a href="#${sectionPath('hours', null)}" style="text-decoration:underline; color:inherit;">Hours</a>.</span>`;
      tableContainer.appendChild(note);
    }

    const foot = document.createElement('div');
    foot.style.cssText = 'padding:10px 16px; font-size:11px; color:var(--text-tertiary); border-top:1px solid var(--border-color);';
    foot.textContent = `Overtime is calculated at ${OT_MULTIPLIER}x for hours over ${OVERTIME_DAILY_HOURS}h in a single day.`;
    tableContainer.appendChild(foot);

    mountDateRange(container, state, render);
    container.querySelector('#filter-tech')?.addEventListener('change', (e) => {
      state.tech = e.target.value;
      state.page = 1;
      render();
    });
    container.querySelector('#btn-export-csv')?.addEventListener('click', () => {
      const csv = [['Technician', 'Days', 'Regular Hours', 'OT Hours', 'Total Hours', 'Rate', 'Regular Pay', 'OT Pay', 'Gross Pay']];
      rows.forEach(x => {
        csv.push([x.tech.name || '', x.days, x.reg.toFixed(2), x.ot.toFixed(2), x.total.toFixed(2), x.rate.toFixed(2), x.regPay.toFixed(2), x.otPay.toFixed(2), x.gross.toFixed(2)]);
      });
      downloadCSV(`payroll_${state.start || 'all'}_${state.end || 'all'}.csv`, csv);
      showToast('Payroll summary exported to CSV');
    });
  }

  render();
}

// ------------------------------------------------------------
// Dispatch entry
// ------------------------------------------------------------
export function renderAttendanceView(container, params = {}) {
  const { section, view } = resolveSection(params.tab, params.view);
  const resolved = { ...params, tab: section, view };
  if (view === 'variance') return renderScheduleVsActual(container, resolved);
  if (view === 'run') return renderPayroll(container, resolved);
  return renderAttendanceRecords(container, resolved);
}
