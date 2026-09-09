// ============================================
// RELAY — ATTENDANCE TRACKER
// ============================================
// Three child views under Timesheets, driven by ?tab=:
//   1. attendance         — clock in/out session log + CSV export
//   2. schedule-vs-actual — booked schedule hours vs clocked attendance
//   3. payroll            — pay-period hours, overtime & gross pay
// All read the local-first store (cloud + offline) via the timeClocks,
// schedule and technicians collections.

import { store } from '../../data/store.js';
import { showToast } from '../../components/Notifications.js';
import { showModal } from '../../components/Modal.js';
import { escapeHTML } from '../../utils/security.js';
import { hasPermission } from '../../utils/permissions.js';
import { createDateRangeFilter } from '../../utils/dateRangeFilter.js';
import { formatDuration, mapsLink } from '../../utils/timeClock.js';

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

function truncate(s, n) {
  if (!s) return '';
  return s.length > n ? s.slice(0, n - 1) + '…' : s;
}

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
  const canApprove = ['admin', 'manager', 'office'].includes(currentUser.role) || hasPermission('Timesheets', 'approve') || isLocalAdmin;
  const technicians = (store.getAll('technicians') || []).filter(t => !t.deactivated).sort((a, b) => (a.name || '').localeCompare(b.name || ''));
  const allClocks = store.getAll('timeClocks') || [];
  return { currentUser, isLocalAdmin, canViewAll, canExport, canApprove, technicians, allClocks };
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
function renderAttendanceRecords(container) {
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
    const totalPages = Math.max(1, Math.ceil(rows.length / state.pageSize));
    if (state.page > totalPages) state.page = totalPages;
    const pageStart = (state.page - 1) * state.pageSize;
    const paged = rows.slice(pageStart, pageStart + state.pageSize);
    const techOptions = ctx.technicians;

    container.innerHTML = `
      <div class="page-header" style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:8px;">
        <h1>Attendance Records</h1>
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
      <div id="attendance-table-container">
        <div class="card data-table-card">
          ${paged.length === 0 ? `
            <div class="empty-state">
              <span class="material-icons-outlined">event_available</span>
              <h3>No attendance records found</h3>
              <p>Try adjusting your date range or technician filter.</p>
            </div>
          ` : `
            <div class="data-table-wrapper">
              <table class="data-table">
                <thead>
                  <tr>
                    <th style="width:11%">Date</th>
                    <th style="width:16%">Technician</th>
                    <th style="width:13%">Clock In</th>
                    <th style="width:13%">Clock Out</th>
                    <th class="num" style="width:10%">Duration</th>
                    <th style="width:24%">Location</th>
                    <th style="width:9%">Status</th>
                  </tr>
                </thead>
                <tbody>
                  ${paged.map(x => {
                    const loc = x.clockInLocation;
                    const link = mapsLink(loc);
                    const inProgress = !x.clockOutAt;
                    return `
                      <tr>
                        <td class="text-secondary">${fmtDate(x.clockInAt)}</td>
                        <td>${escapeHTML(x.technicianName || '—')}</td>
                        <td>${fmtTime(x.clockInAt)}</td>
                        <td>${fmtTime(x.clockOutAt)}</td>
                        <td class="num">${formatDuration(durationMs(x))}</td>
                        <td>${link ? `<a href="${link}" target="_blank" rel="noopener" class="cell-link" title="Open in Maps">${escapeHTML(fmtCoord(loc.lat))}, ${escapeHTML(fmtCoord(loc.lng))}</a>` : '<span class="text-secondary">—</span>'}</td>
                        <td><span class="badge ${inProgress ? 'badge-warning' : 'badge-success'}">${inProgress ? 'In Progress' : 'Completed'}</span></td>
                      </tr>`;
                  }).join('')}
                </tbody>
              </table>
            </div>
            ${paginationHTML(state.page, state.pageSize, state.totalRows)}
          `}
        </div>
      </div>
    `;

    wirePagination(container, state, render);
    mountDateRange(container, state, render);
    container.querySelector('#filter-tech')?.addEventListener('change', (e) => { state.tech = e.target.value; state.page = 1; render(); });
    container.querySelector('#btn-export-csv')?.addEventListener('click', () => {
      const rows = compute();
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
function renderScheduleVsActual(container) {
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
    const totalPages = Math.max(1, Math.ceil(rows.length / state.pageSize));
    if (state.page > totalPages) state.page = totalPages;
    const pageStart = (state.page - 1) * state.pageSize;
    const paged = rows.slice(pageStart, pageStart + state.pageSize);

    container.innerHTML = `
      <div class="page-header" style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:8px;">
        <h1>Schedule vs Actual</h1>
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
      <div id="attendance-table-container">
        <div class="card data-table-card">
          ${paged.length === 0 ? `
            <div class="empty-state">
              <span class="material-icons-outlined">compare_arrows</span>
              <h3>No schedule or attendance data</h3>
              <p>No booked schedule or clocked hours were found in this date range.</p>
            </div>
          ` : `
            <div class="data-table-wrapper">
              <table class="data-table">
                <thead>
                  <tr>
                    <th style="width:14%">Date</th>
                    <th style="width:18%">Technician</th>
                    <th class="num" style="width:12%">Scheduled</th>
                    <th class="num" style="width:12%">Actual</th>
                    <th class="num" style="width:12%">Variance</th>
                    <th style="width:14%">Status</th>
                  </tr>
                </thead>
                <tbody>
                  ${paged.map(x => `
                    <tr>
                      <td class="text-secondary">${fmtDate(x.date)}</td>
                      <td>${escapeHTML(x.tech.name || '—')}</td>
                      <td class="num">${x.sched.toFixed(2)}</td>
                      <td class="num">${x.actual.toFixed(2)}</td>
                      <td class="num" style="color:${x.variance < 0 ? 'var(--color-danger)' : x.variance > 0 ? 'var(--color-warning)' : 'var(--text-secondary)'}">${(x.variance > 0 ? '+' : '') + x.variance.toFixed(2)}</td>
                      <td><span class="badge ${flagBadge[x.flag] || 'badge-warning'}">${escapeHTML(x.flag)}</span></td>
                    </tr>`).join('')}
                </tbody>
              </table>
            </div>
            ${paginationHTML(state.page, state.pageSize, state.totalRows)}
          `}
        </div>
      </div>
    `;

    wirePagination(container, state, render);
    mountDateRange(container, state, render);
    container.querySelector('#filter-tech')?.addEventListener('change', (e) => {
      state.tech = e.target.value;
      state.page = 1;
      render();
    });
    container.querySelector('#btn-export-csv')?.addEventListener('click', () => {
      const rows = compute();
      const csv = [['Date', 'Technician', 'Scheduled Hours', 'Actual Hours', 'Variance', 'Status']];
      rows.forEach(x => {
        csv.push([fmtDate(x.date), x.tech.name || '', x.sched.toFixed(2), x.actual.toFixed(2), x.variance.toFixed(2), x.flag]);
      });
      downloadCSV(`schedule_vs_actual_${state.start || 'all'}_${state.end || 'all'}.csv`, csv);
      showToast('Schedule vs actual comparison exported to CSV');
    });
  }

  render();
}

// ------------------------------------------------------------
// 3. HOURS & PAYROLL — pay-period hours, overtime & gross pay
// ------------------------------------------------------------
function renderPayroll(container) {
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
  const hourMoney = (n) => (n || 0).toLocaleString('en-AU', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  const techOptions = ctx.canViewAll ? ctx.technicians : [];

  function render() {
    const rows = compute();
    state.totalRows = rows.length;
    const totalPages = Math.max(1, Math.ceil(rows.length / state.pageSize));
    if (state.page > totalPages) state.page = totalPages;
    const pageStart = (state.page - 1) * state.pageSize;
    const paged = rows.slice(pageStart, pageStart + state.pageSize);
    const totals = rows.reduce((acc, x) => {
      acc.reg += x.reg; acc.ot += x.ot; acc.total += x.total; acc.regPay += x.regPay; acc.otPay += x.otPay; acc.gross += x.gross;
      return acc;
    }, { reg: 0, ot: 0, total: 0, regPay: 0, otPay: 0, gross: 0 });

    container.innerHTML = `
      <div class="page-header" style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:8px;">
        <h1>Hours & Payroll</h1>
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
      <div id="attendance-table-container">
        ${state.pendingCount > 0 ? `
          <div style="padding:10px 16px; font-size:11px; color:var(--color-warning); background:var(--color-warning-bg); border-radius:var(--border-radius); margin-bottom:10px; display:flex; align-items:center; gap:8px;">
            <span class="material-icons-outlined" style="font-size:15px;">info</span>
            <span>${state.pendingCount} session${state.pendingCount === 1 ? '' : 's'} ${state.pendingCount === 1 ? 'is' : 'are'} pending approval and ${state.pendingCount === 1 ? 'is' : 'are'} not included in this payroll. Review them in <a href="#/timesheets?tab=attendance-approvals" style="text-decoration:underline; color:inherit;">Attendance Approvals</a>.</span>
          </div>` : ''}
        <div class="card data-table-card">
          ${paged.length === 0 ? `
            <div class="empty-state">
              <span class="material-icons-outlined">payments</span>
              <h3>No payroll hours in this period</h3>
              <p>No approved clocked attendance was found in this date range.</p>
            </div>
          ` : `
            <div class="data-table-wrapper">
              <table class="data-table">
                <thead>
                  <tr>
                    <th style="width:18%">Technician</th>
                    <th class="num" style="width:8%">Days</th>
                    <th class="num" style="width:10%">Reg Hrs</th>
                    <th class="num" style="width:10%">OT Hrs</th>
                    <th class="num" style="width:10%">Total Hrs</th>
                    <th class="num" style="width:10%">Rate</th>
                    <th class="num" style="width:12%">Reg Pay</th>
                    <th class="num" style="width:12%">OT Pay</th>
                    <th class="num" style="width:12%">Gross Pay</th>
                  </tr>
                </thead>
                <tbody>
                  ${paged.map(x => `
                    <tr>
                      <td>${escapeHTML(x.tech.name || '—')}</td>
                      <td class="num">${x.days}</td>
                      <td class="num">${x.reg.toFixed(2)}</td>
                      <td class="num">${x.ot.toFixed(2)}</td>
                      <td class="num"><strong>${x.total.toFixed(2)}</strong></td>
                      <td class="num">${hourMoney(x.rate)}</td>
                      <td class="num">${fmtMoney(x.regPay)}</td>
                      <td class="num">${fmtMoney(x.otPay)}</td>
                      <td class="num"><strong>${fmtMoney(x.gross)}</strong></td>
                    </tr>`).join('')}
                </tbody>
                ${state.tech === 'All' ? `
                <tfoot>
                  <tr>
                    <td><strong>Totals</strong></td>
                    <td class="num">—</td>
                    <td class="num">${totals.reg.toFixed(2)}</td>
                    <td class="num">${totals.ot.toFixed(2)}</td>
                    <td class="num">${totals.total.toFixed(2)}</td>
                    <td class="num">—</td>
                    <td class="num">${fmtMoney(totals.regPay)}</td>
                    <td class="num">${fmtMoney(totals.otPay)}</td>
                    <td class="num"><strong>${fmtMoney(totals.gross)}</strong></td>
                  </tr>
                </tfoot>` : ''}
              </table>
              <div style="padding:10px 16px; font-size:11px; color:var(--text-tertiary); border-top:1px solid var(--border-color);">
                Overtime is calculated at ${OT_MULTIPLIER}x for hours over ${OVERTIME_DAILY_HOURS}h in a single day.
              </div>
            </div>
            ${paginationHTML(state.page, state.pageSize, state.totalRows)}
          `}
        </div>
      </div>
    `;

    wirePagination(container, state, render);
    mountDateRange(container, state, render);
    container.querySelector('#filter-tech')?.addEventListener('change', (e) => {
      state.tech = e.target.value;
      state.page = 1;
      render();
    });
    container.querySelector('#btn-export-csv')?.addEventListener('click', () => {
      const rows = compute();
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
// 4. ATTENDANCE APPROVALS — approve/adjust/reject clocked hours
// ------------------------------------------------------------
function renderAttendanceApprovals(container) {
  const r = defaultRange();
  const state = { start: r.start, end: r.end, tech: 'All', status: 'All', page: 1, pageSize: getSavedPageSize(), totalRows: 0 };
  let ctx = getContext();

  const statusMeta = {
    pending: { label: 'Pending', cls: 'badge-warning' },
    approved: { label: 'Approved', cls: 'badge-success' },
    adjusted: { label: 'Adjusted', cls: 'badge-info' },
    rejected: { label: 'Rejected', cls: 'badge-danger' }
  };

  function approvalStatusOf(rec) { return rec.approvalStatus || 'pending'; }
  function rawHours(rec) { return round2(msToHours(durationMs(rec))); }
  function approvedHours(rec) {
    const st = approvalStatusOf(rec);
    if (st === 'rejected') return 0;
    return rec.approvedHours != null ? Number(rec.approvedHours) : rawHours(rec);
  }

  function actorName() {
    const u = ctx.currentUser || {};
    return u.name || u.username || u.email || String(u.id || 'Manager');
  }

  function compute() {
    let rows = ctx.allClocks.filter(x => x.clockOutAt);
    if (!ctx.canViewAll) rows = rows.filter(x => String(x.technicianId) === String(ctx.currentUser.id));
    else if (state.tech !== 'All') rows = rows.filter(x => String(x.technicianId) === String(state.tech));
    rows = rows.filter(x => {
      const d = localISODate(x.clockInAt);
      if (state.start && d < state.start) return false;
      if (state.end && d > state.end) return false;
      return true;
    });
    rows = rows.filter(x => state.status === 'All' || approvalStatusOf(x) === state.status);
    return rows.sort((a, b) => new Date(b.clockInAt) - new Date(a.clockInAt));
  }

  function approve(rec) {
    store.update('timeClocks', rec.id, {
      approvalStatus: 'approved',
      approvedHours: rec.approvedHours != null ? Number(rec.approvedHours) : rawHours(rec),
      approvedBy: actorName(),
      approvedAt: new Date().toISOString(),
      note: rec.note || ''
    });
    showToast('Session approved');
    render();
  }

  function reject(rec) {
    store.update('timeClocks', rec.id, {
      approvalStatus: 'rejected',
      approvedHours: 0,
      approvedBy: actorName(),
      approvedAt: new Date().toISOString(),
      note: rec.note || ''
    });
    showToast('Session rejected');
    render();
  }

  function approveAllPending() {
    const pending = compute().filter(x => approvalStatusOf(x) === 'pending');
    if (pending.length === 0) { showToast('No pending sessions to approve'); return; }
    pending.forEach(x => {
      store.update('timeClocks', x.id, {
        approvalStatus: 'approved',
        approvedHours: x.approvedHours != null ? Number(x.approvedHours) : rawHours(x),
        approvedBy: actorName(),
        approvedAt: new Date().toISOString(),
        note: x.note || ''
      });
    });
    showToast(`Approved ${pending.length} session${pending.length === 1 ? '' : 's'}`);
    render();
  }

  function adjust(rec) {
    const cur = approvedHours(rec);
    const content = document.createElement('div');
    content.innerHTML = `
      <div style="margin-bottom:12px; font-size:12px; color:var(--text-secondary);">
        ${escapeHTML(rec.technicianName || 'Technician')} · ${fmtDate(rec.clockInAt)}<br>
        Clocked: <strong>${formatDuration(durationMs(rec))}</strong> (${rawHours(rec).toFixed(2)}h)
      </div>
      <label style="display:block; font-size:11px; font-weight:600; margin-bottom:4px;">Approved hours</label>
      <input type="number" id="adjust-hours" step="0.01" min="0" value="${cur}" style="width:100%; margin-bottom:12px; padding:6px 8px; font-size:13px; border:1px solid var(--border-color); border-radius:var(--border-radius); background:var(--card-bg); color:var(--text-primary); box-sizing:border-box;"/>
      <label style="display:block; font-size:11px; font-weight:600; margin-bottom:4px;">Note</label>
      <textarea id="adjust-note" rows="3" placeholder="Reason for adjustment" style="width:100%; padding:6px 8px; font-size:12px; border:1px solid var(--border-color); border-radius:var(--border-radius); background:var(--card-bg); color:var(--text-primary); box-sizing:border-box;">${escapeHTML(rec.note || '')}</textarea>
    `;
    showModal({
      title: 'Adjust Hours',
      size: 'modal-sm',
      content,
      actions: [
        { label: 'Cancel', className: 'btn-secondary' },
        {
          label: 'Save',
          className: 'btn-primary',
          onClick: (close) => {
            const hours = parseFloat(document.querySelector('#adjust-hours')?.value);
            if (!(hours >= 0)) { showToast('Enter a valid number of hours'); return; }
            const note = (document.querySelector('#adjust-note')?.value || '').trim();
            store.update('timeClocks', rec.id, {
              approvalStatus: 'adjusted',
              approvedHours: round2(hours),
              approvedBy: actorName(),
              approvedAt: new Date().toISOString(),
              note
            });
            showToast('Hours adjusted');
            close();
            render();
          }
        }
      ]
    });
  }

  function actionRow(x) {
    const st = approvalStatusOf(x);
    const meta = statusMeta[st] || statusMeta.pending;
    const approved = approvedHours(x);
    const approvedInfo = x.approvedBy && x.approvedAt
      ? `${escapeHTML(x.approvedBy)}<span class="text-secondary"> · ${fmtDate(x.approvedAt)}</span>`
      : '<span class="text-secondary">—</span>';
    const noteCell = x.note
      ? `<span class="cell-link" title="${escapeHTML(x.note)}">${escapeHTML(truncate(x.note, 18))}</span>`
      : '<span class="text-secondary">—</span>';
    const actions = ctx.canApprove ? `
      <td>
        <div style="display:inline-flex; gap:4px;">
          <button class="btn btn-sm btn-secondary" data-act="approve" data-id="${escapeHTML(String(x.id))}" style="height:22px; font-size:11px; padding:0 6px;">Approve</button>
          <button class="btn btn-sm btn-secondary" data-act="adjust" data-id="${escapeHTML(String(x.id))}" style="height:22px; font-size:11px; padding:0 6px;">Adjust</button>
          <button class="btn btn-sm btn-secondary" data-act="reject" data-id="${escapeHTML(String(x.id))}" style="height:22px; font-size:11px; padding:0 6px;">Reject</button>
        </div>
      </td>
    ` : '';
    return `<tr>
      <td class="text-secondary">${fmtDate(x.clockInAt)}</td>
      <td>${escapeHTML(x.technicianName || '—')}</td>
      <td>${fmtTime(x.clockInAt)}</td>
      <td>${fmtTime(x.clockOutAt)}</td>
      <td class="num">${rawHours(x).toFixed(2)}</td>
      <td class="num">${st === 'pending' ? '<span class="text-secondary">—</span>' : approved.toFixed(2)}</td>
      <td><span class="badge ${meta.cls}">${meta.label}</span></td>
      <td>${approvedInfo}</td>
      <td>${noteCell}</td>
      ${actions}
    </tr>`;
  }

  function render() {
    ctx = getContext();
    const rows = compute();
    state.totalRows = rows.length;
    const totalPages = Math.max(1, Math.ceil(rows.length / state.pageSize));
    if (state.page > totalPages) state.page = totalPages;
    const pageStart = (state.page - 1) * state.pageSize;
    const paged = rows.slice(pageStart, pageStart + state.pageSize);
    const techOptions = ctx.technicians;

    container.innerHTML = `
      <div class="page-header" style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:8px;">
        <h1>Attendance Approvals</h1>
        <div class="page-header-actions" style="display:flex; align-items:center; gap:6px; flex-wrap:wrap;">
          <div id="date-range-mount" style="display:inline-flex; align-items:center;"></div>
          ${ctx.canViewAll ? `<select id="filter-tech" class="form-select" style="height:25px; font-size:11px; padding:0 18px 0 8px; width:150px; margin:0; align-self:center;">
            <option value="All" ${state.tech === 'All' ? 'selected' : ''}>All Technicians</option>
            ${techOptions.map(t => `<option value="${escapeHTML(String(t.id))}" ${String(state.tech) === String(t.id) ? 'selected' : ''}>${escapeHTML(t.name)}</option>`).join('')}
          </select>` : ''}
          <select id="filter-status" class="form-select" style="height:25px; font-size:11px; padding:0 18px 0 8px; width:135px; margin:0; align-self:center;">
            <option value="All" ${state.status === 'All' ? 'selected' : ''}>All Statuses</option>
            ${Object.keys(statusMeta).map(s => `<option value="${s}" ${state.status === s ? 'selected' : ''}>${statusMeta[s].label}</option>`).join('')}
          </select>
          ${ctx.canApprove ? `<button class="btn btn-sm btn-primary" id="btn-approve-all" data-tooltip="Approve all pending sessions in this range" data-tooltip-pos="left" style="height:25px; font-size:11px; padding:0 10px; display:inline-flex; align-items:center; gap:4px; margin:0; align-self:center;">
            <span class="material-icons-outlined" style="font-size:13px;">done_all</span> Approve All Pending
          </button>` : ''}
        </div>
      </div>
      <div id="attendance-table-container">
        <div class="card data-table-card">
          ${paged.length === 0 ? `
            <div class="empty-state">
              <span class="material-icons-outlined">fact_check</span>
              <h3>No attendance to approve</h3>
              <p>Completed clock-in/out sessions in this range will appear here once a technician clocks out.</p>
            </div>
          ` : `
            <div class="data-table-wrapper">
              <table class="data-table">
                <thead>
                  <tr>
                    <th style="width:11%">Date</th>
                    <th style="width:16%">Technician</th>
                    <th style="width:11%">Clock In</th>
                    <th style="width:11%">Clock Out</th>
                    <th class="num" style="width:8%">Hours</th>
                    <th class="num" style="width:8%">Approved</th>
                    <th style="width:11%">Status</th>
                    <th style="width:15%">Approved By</th>
                    <th style="width:6%">Note</th>
                    ${ctx.canApprove ? `<th style="width:16%">Actions</th>` : ''}
                  </tr>
                </thead>
                <tbody>
                  ${paged.map(actionRow).join('')}
                </tbody>
              </table>
            </div>
            ${paginationHTML(state.page, state.pageSize, state.totalRows)}
          `}
        </div>
      </div>
    `;

    wirePagination(container, state, render);
    mountDateRange(container, state, render);
    container.querySelector('#filter-tech')?.addEventListener('change', (e) => { state.tech = e.target.value; state.page = 1; render(); });
    container.querySelector('#filter-status')?.addEventListener('change', (e) => { state.status = e.target.value; state.page = 1; render(); });
    container.querySelector('#btn-approve-all')?.addEventListener('click', approveAllPending);
    container.querySelectorAll('[data-act]').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const rec = rows.find(x => x.id === e.currentTarget.dataset.id);
        if (!rec) return;
        const act = e.currentTarget.dataset.act;
        if (act === 'approve') approve(rec);
        else if (act === 'adjust') adjust(rec);
        else if (act === 'reject') reject(rec);
      });
    });
  }

  render();
}

// ------------------------------------------------------------
// Dispatch entry
// ------------------------------------------------------------
export function renderAttendanceView(container, params = {}) {
  const tab = params.tab;
  if (tab === 'schedule-vs-actual') return renderScheduleVsActual(container, params);
  if (tab === 'payroll') return renderPayroll(container, params);
  if (tab === 'attendance-approvals') return renderAttendanceApprovals(container, params);
  return renderAttendanceRecords(container, params);
}
