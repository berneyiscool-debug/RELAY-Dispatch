// ============================================
// RELAY — CLOCKED VS JOB HOURS (Time Tracking → Clocked vs Job Hours)
// ============================================
// Puts the two time records side by side, per technician per day (or per technician
// for the whole period):
//
//   Clocked   — measured time on the clock (timeClocks), the same figure Clock History
//               shows as Worked
//   Approved  — what counts after approval/corrections (payableHours)
//   Job hours — hours booked against jobs (timesheets)
//   Unbooked  — clocked minus job hours. Positive is time on the clock that no job
//               carries; negative means more was booked to jobs than was clocked.
//   Booked %  — job hours as a share of clocked hours
//
// Nothing here is editable: corrections happen in Clock History, bookings in Job Hours.

import { store } from '../../data/store.js';
import { showToast } from '../../components/Notifications.js';
import { showModal } from '../../components/Modal.js';
import { createDataTable } from '../../components/DataTable.js';
import { createBulkActionBar } from '../../components/BulkActionBar.js';
import { createDateRangeFilter } from '../../utils/dateRangeFilter.js';
import { escapeHTML } from '../../utils/security.js';
import { hasPermission } from '../../utils/permissions.js';
import { formatDuration } from '../../utils/timeClock.js';
import { hoursOf } from '../../utils/jobTimeLedger.js';
import {
  currentMonthRange, dayTotals, downloadCSV, durationMs, fmtDay, fmtTime, isoOf,
  msToHours, payableHours, round2
} from '../../utils/hoursMath.js';
import { resolveSection, sectionTitle } from '../../utils/timesheetSections.js';

// Small gaps are rounding and travel, not a finding — only flag a day past this.
const TOLERANCE_HOURS = 0.25;

function getContext() {
  const currentUser = JSON.parse(localStorage.getItem('currentUser') || '{"role":"admin"}');
  const isLocalAdmin = localStorage.getItem('relay_login_mode') === 'local';
  const canViewAll = ['admin', 'manager', 'office'].includes(currentUser.role)
    || isLocalAdmin
    || hasPermission('Timesheets', 'view');
  const canExport = hasPermission('Timesheets', 'export')
    || ['admin', 'manager', 'office'].includes(currentUser.role)
    || isLocalAdmin;
  const technicians = (store.getAll('technicians') || [])
    .filter(t => !t.deactivated)
    .sort((a, b) => (a.name || '').localeCompare(b.name || ''));
  return { currentUser, canViewAll, canExport, technicians };
}

const h2 = n => Number(n || 0).toFixed(2);

function signed(n) {
  if (Math.abs(n) < 0.005) return '0.00';
  return `${n > 0 ? '+' : '−'}${Math.abs(n).toFixed(2)}`;
}

function bookedPct(job, clocked) {
  return clocked > 0 ? Math.round((job / clocked) * 100) : null;
}

/** The one-word reading of a row, so the eye can scan a month for problems. */
function verdict(r) {
  if (r.clocked === 0 && r.job > 0) return { label: 'No clock record', cls: 'badge-danger' };
  if (r.clocked > 0 && r.job === 0) return { label: 'Nothing booked', cls: 'badge-warning' };
  if (r.unbooked < -TOLERANCE_HOURS) return { label: 'Over-booked', cls: 'badge-danger' };
  if (r.unbooked > TOLERANCE_HOURS) return { label: 'Unbooked time', cls: 'badge-warning' };
  return { label: 'Matches', cls: 'badge-success' };
}

export function renderClockedVsJobsView(container, params = {}) {
  const nav = resolveSection(params.tab);
  const ctx = getContext();
  const month = currentMonthRange();
  const state = {
    start: params.start || month.start,
    end: params.end || month.end,
    tech: params.tech || 'All',
    group: 'day' // 'day' | 'tech'
  };
  let table = null;
  let dateFilter = null;
  let rows = [];
  let showData = false;

  function visibleTechIds() {
    if (!ctx.canViewAll) return new Set([String(ctx.currentUser.id)]);
    if (state.tech !== 'All') return new Set([String(state.tech)]);
    return null; // everyone
  }

  function techName(id, fallback) {
    const t = ctx.technicians.find(x => String(x.id) === String(id))
      || (store.getAll('technicians') || []).find(x => String(x.id) === String(id));
    return (t && t.name) || fallback || '—';
  }

  /** Technician × day buckets holding that day's clock sessions and job bookings. */
  function buildDays() {
    const allow = visibleTechIds();
    const inRange = d => d && d >= state.start && d <= state.end;
    const buckets = new Map();
    const bucket = (techId, date, name) => {
      const key = `${techId}|${date}`;
      if (!buckets.has(key)) buckets.set(key, { id: key, techId: String(techId), techName: name, date, sessions: [], bookings: [] });
      return buckets.get(key);
    };

    (store.getAll('timeClocks') || []).forEach(c => {
      if (!c.clockInAt || c.technicianId == null) return;
      if (allow && !allow.has(String(c.technicianId))) return;
      const date = isoOf(new Date(c.clockInAt));
      if (!inRange(date)) return;
      bucket(c.technicianId, date, c.technicianName).sessions.push(c);
    });

    (store.getAll('timesheets') || []).forEach(t => {
      if (t.technicianId == null) return;
      if (allow && !allow.has(String(t.technicianId))) return;
      const date = t.date ? String(t.date).slice(0, 10) : (t.startTime ? String(t.startTime).slice(0, 10) : '');
      if (!inRange(date)) return;
      bucket(t.technicianId, date, t.technicianName).bookings.push(t);
    });

    const now = new Date();
    return [...buckets.values()].map(b => {
      const { sorted, workedMs, breakMs } = dayTotals(b.sessions, now);
      const clocked = round2(msToHours(workedMs));
      const approved = round2(sorted.reduce((sum, s) => sum + payableHours(s, now), 0));
      const job = round2(b.bookings.reduce((sum, t) => sum + hoursOf(t), 0));
      return {
        ...b,
        techName: techName(b.techId, b.techName),
        sessions: sorted,
        breakMs,
        clocked,
        approved,
        job,
        unbooked: round2(clocked - job),
        pending: sorted.filter(s => (s.approvalStatus || 'pending') === 'pending').length
      };
    });
  }

  function byTechnician(days) {
    const map = new Map();
    days.forEach(d => {
      if (!map.has(d.techId)) {
        map.set(d.techId, { id: d.techId, techId: d.techId, techName: d.techName, days: [], clocked: 0, approved: 0, job: 0, breakMs: 0, pending: 0 });
      }
      const t = map.get(d.techId);
      t.days.push(d);
      t.clocked += d.clocked;
      t.approved += d.approved;
      t.job += d.job;
      t.breakMs += d.breakMs;
      t.pending += d.pending;
    });
    return [...map.values()].map(t => ({
      ...t,
      clocked: round2(t.clocked),
      approved: round2(t.approved),
      job: round2(t.job),
      unbooked: round2(t.clocked - t.job),
      flagged: t.days.filter(d => verdict(d).label !== 'Matches').length
    }));
  }

  function compute() {
    const days = buildDays().sort((a, b) => b.date.localeCompare(a.date) || a.techName.localeCompare(b.techName));
    return state.group === 'tech'
      ? byTechnician(days).sort((a, b) => a.techName.localeCompare(b.techName))
      : days;
  }

  function pctCell(r) {
    const pct = bookedPct(r.job, r.clocked);
    if (pct == null) return '<span class="text-tertiary">—</span>';
    const color = pct > 100 ? 'var(--color-danger)' : pct >= 85 ? 'var(--color-success)' : 'var(--color-warning)';
    return `<span style="color:${color}; font-weight:600;">${pct}%</span>`;
  }

  function unbookedCell(r) {
    const color = r.unbooked < -TOLERANCE_HOURS ? 'var(--color-danger)'
      : r.unbooked > TOLERANCE_HOURS ? 'var(--color-warning)' : 'var(--text-secondary)';
    return `<span style="color:${color};">${signed(r.unbooked)}</span>`;
  }

  function columns() {
    const numeric = [
      { key: 'clocked', label: 'Clocked', render: (r) => `<span class="font-semibold">${h2(r.clocked)}</span>`, getValue: (r) => r.clocked, width: '10%', align: 'right' },
      { key: 'approved', label: 'Approved', render: (r) => {
        const text = h2(r.approved);
        return r.pending > 0
          ? `<span data-tooltip="${r.pending} session${r.pending === 1 ? '' : 's'} not yet approved in Clock History">${text} <span class="material-icons-outlined text-warning" style="font-size:12px; vertical-align:middle;">schedule</span></span>`
          : text;
      }, getValue: (r) => r.approved, width: '11%', align: 'right' },
      { key: 'job', label: 'Job Hours', render: (r) => `<span class="font-semibold">${h2(r.job)}</span>`, getValue: (r) => r.job, width: '10%', align: 'right' },
      { key: 'unbooked', label: 'Unbooked', render: unbookedCell, getValue: (r) => r.unbooked, width: '10%', align: 'right' },
      { key: 'pct', label: 'Booked %', render: pctCell, getValue: (r) => bookedPct(r.job, r.clocked) ?? -1, width: '9%', align: 'right' }
    ];
    if (state.group === 'tech') {
      return [
        { key: 'techName', label: 'Technician', render: (r) => escapeHTML(r.techName), getValue: (r) => r.techName.toLowerCase(), width: '22%' },
        { key: 'days', label: 'Days', render: (r) => String(r.days.length), getValue: (r) => r.days.length, width: '8%', align: 'right' },
        ...numeric,
        { key: 'flagged', label: 'Days to check', render: (r) => (r.flagged
          ? `<span class="badge badge-warning">${r.flagged} day${r.flagged === 1 ? '' : 's'}</span>`
          : '<span class="badge badge-success">All match</span>'), getValue: (r) => r.flagged, width: '20%' }
      ];
    }
    return [
      { key: 'date', label: 'Date', render: (r) => escapeHTML(fmtDay(r.date)), getValue: (r) => r.date, width: '12%' },
      { key: 'techName', label: 'Technician', render: (r) => escapeHTML(r.techName), getValue: (r) => r.techName.toLowerCase(), width: '16%' },
      ...numeric,
      { key: 'verdict', label: 'Result', render: (r) => { const v = verdict(r); return `<span class="badge ${v.cls}">${escapeHTML(v.label)}</span>`; }, getValue: (r) => verdict(r).label, width: '22%' }
    ];
  }

  function exportRows(list, filename) {
    let csv;
    if (state.group === 'tech') {
      csv = [['Technician', 'From', 'To', 'Days', 'Clocked Hours', 'Break Hours', 'Approved Hours', 'Job Hours', 'Unbooked Hours', 'Booked %', 'Days To Check']];
      list.forEach(r => csv.push([r.techName, state.start, state.end, r.days.length, h2(r.clocked), h2(msToHours(r.breakMs)),
        h2(r.approved), h2(r.job), h2(r.unbooked), bookedPct(r.job, r.clocked) ?? '', r.flagged]));
    } else {
      csv = [['Date', 'Technician', 'Clocked Hours', 'Break Hours', 'Approved Hours', 'Unapproved Sessions', 'Job Hours', 'Unbooked Hours', 'Booked %', 'Jobs', 'Result']];
      const jobMap = new Map((store.getAll('jobs') || []).map(j => [j.id, j]));
      [...list].sort((a, b) => a.date.localeCompare(b.date) || a.techName.localeCompare(b.techName)).forEach(r => {
        const jobs = [...new Set(r.bookings.map(t => jobMap.get(t.jobId)?.number || t.jobNumber || t.jobId).filter(Boolean))].join('; ');
        csv.push([r.date, r.techName, h2(r.clocked), h2(msToHours(r.breakMs)), h2(r.approved), r.pending, h2(r.job), h2(r.unbooked),
          bookedPct(r.job, r.clocked) ?? '', jobs, verdict(r).label]);
      });
    }
    downloadCSV(filename, csv);
    showToast(`Exported ${list.length} row${list.length === 1 ? '' : 's'} to CSV`);
  }

  function openDayModal(r) {
    const now = new Date();
    const jobMap = new Map((store.getAll('jobs') || []).map(j => [j.id, j]));
    const v = verdict(r);
    const sessionsHTML = r.sessions.length === 0
      ? '<tr><td colspan="3" class="text-tertiary" style="text-align:center; padding:12px;">No clock record on this day.</td></tr>'
      : r.sessions.map(s => `<tr>
          <td>${escapeHTML(fmtTime(s.clockInAt))}</td>
          <td>${escapeHTML(s.clockOutAt ? fmtTime(s.clockOutAt) : 'still open')}${s.status === 'break' ? ' <span class="badge badge-warning" style="font-size:9px;">then break</span>' : ''}</td>
          <td class="num">${escapeHTML(formatDuration(durationMs(s, now)))}</td>
        </tr>`).join('');
    const bookingsHTML = r.bookings.length === 0
      ? '<tr><td colspan="3" class="text-tertiary" style="text-align:center; padding:12px;">Nothing booked to jobs on this day.</td></tr>'
      : r.bookings.map(t => {
        const job = jobMap.get(t.jobId);
        const label = job ? `${job.number || ''}${job.title ? ` — ${job.title}` : ''}` : (t.jobNumber || t.jobId || '—');
        return `<tr>
          <td><a href="#/jobs/${escapeHTML(String(t.jobId))}" class="cell-link">${escapeHTML(label)}</a></td>
          <td class="text-secondary">${escapeHTML(t.taskName || t.phaseName || '—')}</td>
          <td class="num">${h2(hoursOf(t))}</td>
        </tr>`;
      }).join('');

    const content = document.createElement('div');
    content.innerHTML = `
      <div style="display:flex; gap:14px; font-size:11px; color:var(--text-secondary); margin-bottom:12px; flex-wrap:wrap; align-items:center;">
        <span class="badge ${v.cls}">${escapeHTML(v.label)}</span>
        <span>Clocked <strong>${h2(r.clocked)}h</strong></span>
        <span>Breaks <strong>${escapeHTML(formatDuration(r.breakMs))}</strong></span>
        <span>Job hours <strong>${h2(r.job)}h</strong></span>
        <span>Unbooked <strong>${signed(r.unbooked)}h</strong></span>
      </div>
      <div style="display:grid; grid-template-columns:repeat(auto-fit, minmax(260px, 1fr)); gap:14px;">
        <div>
          <div style="font-size:11px; font-weight:600; margin-bottom:6px;">On the clock</div>
          <div class="data-table-wrapper"><table class="data-table">
            <thead><tr><th>In</th><th>Out</th><th class="num">Duration</th></tr></thead>
            <tbody>${sessionsHTML}</tbody>
          </table></div>
        </div>
        <div>
          <div style="font-size:11px; font-weight:600; margin-bottom:6px;">Booked to jobs</div>
          <div class="data-table-wrapper"><table class="data-table">
            <thead><tr><th>Job</th><th>Task</th><th class="num">Hours</th></tr></thead>
            <tbody>${bookingsHTML}</tbody>
          </table></div>
        </div>
      </div>`;

    showModal({
      title: `${r.techName} · ${fmtDay(r.date)}`,
      content,
      size: 'modal-lg',
      actions: [
        { label: 'Open in Clock History', className: 'btn-secondary', onClick: (close) => {
          close();
          window.location.hash = `#/timesheets?tab=clock&start=${r.date}&end=${r.date}&tech=${encodeURIComponent(r.techId)}`;
        } },
        { label: 'Close', className: 'btn-primary' }
      ]
    });
  }

  function renderTable() {
    rows = compute();
    if (table) table.clearSelection();
    createBulkActionBar({ container, selectedIds: [], actions: [], onClear: () => {} });

    const tableContainer = container.querySelector('#compare-table-container');
    if (!tableContainer) return;
    tableContainer.innerHTML = '';

    table = createDataTable({
      columns: columns(),
      data: rows,
      getId: (r) => r.id,
      emptyMessage: 'No clocked or job hours in this period',
      emptyIcon: 'compare_arrows',
      selectable: ctx.canExport,
      defaultSortKey: state.group === 'tech' ? 'techName' : 'date',
      defaultSortDir: state.group === 'tech' ? 'asc' : 'desc',
      onRowClick: (id) => {
        const row = rows.find(r => r.id === id);
        if (!row) return;
        if (state.group === 'tech') {
          // A technician row drills into that technician's days.
          state.group = 'day';
          state.tech = row.techId;
          const groupSelect = container.querySelector('#filter-group');
          const techSelect = container.querySelector('#filter-tech');
          if (groupSelect) groupSelect.value = 'day';
          if (techSelect) techSelect.value = row.techId;
          renderTable();
          return;
        }
        openDayModal(row);
      },
      onSelectionChange: (selectedIds) => {
        createBulkActionBar({
          container,
          selectedIds,
          actions: ctx.canExport ? [{
            label: 'Export CSV',
            icon: 'download',
            className: 'btn-secondary',
            onClick: () => {
              exportRows(rows.filter(r => selectedIds.includes(r.id)), `clocked_vs_job_hours_selected_${isoOf(new Date())}.csv`);
              if (table) table.clearSelection();
            }
          }] : [],
          onClear: () => table.clearSelection()
        });
      }
    });
    tableContainer.appendChild(table);

    const totals = rows.reduce((t, r) => ({ clocked: t.clocked + r.clocked, approved: t.approved + r.approved, job: t.job + r.job }), { clocked: 0, approved: 0, job: 0 });
    const unbooked = round2(totals.clocked - totals.job);
    const pct = bookedPct(totals.job, totals.clocked);
    const foot = document.createElement('div');
    foot.style.cssText = 'padding:10px 16px; font-size:11px; color:var(--text-tertiary); display:flex; gap:14px; flex-wrap:wrap;';
    foot.innerHTML = `
      <span>${rows.length} ${state.group === 'tech' ? `technician${rows.length === 1 ? '' : 's'}` : `day${rows.length === 1 ? '' : 's'}`} shown</span>
      <span>Clocked ${h2(totals.clocked)}h</span>
      <span>Approved ${h2(totals.approved)}h</span>
      <span>Job hours ${h2(totals.job)}h</span>
      <span style="color:${unbooked > TOLERANCE_HOURS ? 'var(--color-warning)' : unbooked < -TOLERANCE_HOURS ? 'var(--color-danger)' : 'inherit'};">Unbooked ${signed(unbooked)}h</span>
      ${pct != null ? `<span>Booked ${pct}% of clocked time</span>` : ''}`;
    tableContainer.appendChild(foot);
  }

  function mountShell() {
    const selectStyle = 'height:25px; font-size:11px; padding:0 18px 0 8px; margin:0; align-self:center;';
    container.innerHTML = `
      <div class="page-header" style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:8px;">
        <h1>${escapeHTML(sectionTitle(nav.section))}</h1>
        <div class="page-header-actions" style="display:flex; align-items:center; gap:6px; flex-wrap:wrap;">
          <div id="date-range-mount" style="display:inline-flex; align-items:center;"></div>
          <select id="filter-group" class="form-select" style="${selectStyle} width:130px;" title="Group rows">
            <option value="day">By day</option>
            <option value="tech">By technician</option>
          </select>
          ${ctx.canViewAll ? `<select id="filter-tech" class="form-select" style="${selectStyle} width:150px;">
            <option value="All" ${state.tech === 'All' ? 'selected' : ''}>All Technicians</option>
            ${ctx.technicians.map(t => `<option value="${escapeHTML(String(t.id))}" ${String(state.tech) === String(t.id) ? 'selected' : ''}>${escapeHTML(t.name || '—')}</option>`).join('')}
          </select>` : ''}
          ${ctx.canExport ? `<button class="btn btn-sm btn-secondary" id="btn-export-compare" style="height:25px; font-size:11px; padding:0 10px; display:inline-flex; align-items:center; gap:4px; margin:0; align-self:center;">
            <span class="material-icons-outlined" style="font-size:13px;">download</span> Export CSV
          </button>` : ''}
        </div>
      </div>
      <div id="compare-table-container"></div>
    `;

    dateFilter = createDateRangeFilter({
      container: container.querySelector('#date-range-mount'),
      onChange: (start, end) => {
        state.start = start || month.start;
        state.end = end || month.end;
        if (showData) renderTable();
      }
    });
    seedRange();

    container.querySelector('#filter-group')?.addEventListener('change', (e) => { state.group = e.target.value; renderTable(); });
    container.querySelector('#filter-tech')?.addEventListener('change', (e) => { state.tech = e.target.value; renderTable(); });
    container.querySelector('#btn-export-compare')?.addEventListener('click', () => {
      exportRows(rows, `clocked_vs_job_hours_${state.group === 'tech' ? 'by_technician_' : ''}${state.start}_${state.end}.csv`);
    });

    showData = true;
    renderTable();
  }

  function seedRange() {
    if (!dateFilter) return;
    const startInput = dateFilter.querySelector('[data-role="start"]');
    const endInput = dateFilter.querySelector('[data-role="end"]');
    if (!startInput || !endInput) return;
    startInput.value = state.start;
    endInput.value = state.end;
    startInput.dispatchEvent(new Event('change'));
    endInput.dispatchEvent(new Event('change'));
  }

  mountShell();
}
