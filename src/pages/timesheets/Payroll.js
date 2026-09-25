// ============================================
// RELAY — PAY RUN (the pay decision)
// ============================================
// The Hours grid is the record; this is the decision. It answers two questions and
// nothing else:
//
//   1. Is this period safe to pay?  A period is blocked while anything in it could
//      still mean unpaid work — an open session, or a rostered day with no hours at
//      all. Those are listed with a way to settle each one.
//   2. What does it come to?  Per-technician clocked, corrected and counted hours.
//
// There is deliberately no overtime, no rate and no gross pay here: hours booked to
// jobs are a different number from hours on the clock, and pay is settled on the clock
// (time-and-pay-spec.md §3). Dollar figures come back when there is a pay-rate source.
//
// Signing off a period records the measured hours as payable on every session that has
// not been signed off already, and leaves alone any session whose hours someone has
// already set. It never overwrites a correction or its reason — someone has already
// decided those hours, and re-deciding them silently is how a pay run destroys the
// paperwork for a change.

import { store } from '../../data/store.js';
import { router } from '../../router.js';
import { showToast } from '../../components/Notifications.js';
import { showModal } from '../../components/Modal.js';
import { createDataTable } from '../../components/DataTable.js';
import { createDateRangeFilter } from '../../utils/dateRangeFilter.js';
import { escapeHTML } from '../../utils/security.js';
import { hasPermission } from '../../utils/permissions.js';
import {
  EXCEPTION, getBlockingExceptions, getRosterForDay, getSessionsForDay
} from '../../utils/payrollExceptions.js';
import {
  actorName, currentMonthRange, datesBetween, dayTotals, downloadCSV, fmtDay, measuredHours,
  msToHours, payableHours, round2
} from '../../utils/hoursMath.js';
import { resolveSection, viewTitle } from '../../utils/timesheetSections.js';

const BLOCKER_BADGE = {
  [EXCEPTION.OPEN_SESSION]: { label: 'Still clocked in', icon: 'timer', cls: 'badge-danger' },
  [EXCEPTION.MISSING_HOURS]: { label: 'Missing hours', icon: 'error_outline', cls: 'badge-warning' }
};

// A session is signed off once someone has decided what it is worth — approved,
// corrected, or refused outright. Only 'pending' still needs a decision.
const SIGNED_OFF_STATUS = ['approved', 'adjusted', 'rejected'];

function getContext() {
  const currentUser = JSON.parse(localStorage.getItem('currentUser') || '{"role":"admin"}');
  const isLocalAdmin = localStorage.getItem('relay_login_mode') === 'local';
  const canViewAll = ['admin', 'manager', 'office'].includes(currentUser.role)
    || isLocalAdmin
    || hasPermission('Timesheets', 'view');
  // Signing off a period is a payroll decision, not an edit: `edit_all` lets a
  // technician correct a record, and must not also hand them the pay run.
  const canSignOff = ['admin', 'manager', 'office'].includes(currentUser.role)
    || hasPermission('Timesheets', 'approve');
  const canExport = hasPermission('Timesheets', 'export') || canSignOff;
  const technicians = (store.getAll('technicians') || [])
    .filter(t => !t.deactivated)
    .sort((a, b) => (a.name || '').localeCompare(b.name || ''));
  return { currentUser, isLocalAdmin, canViewAll, canSignOff, canExport, technicians };
}

const hours2 = n => (n == null ? '—' : Number(n).toFixed(2));

/** A signed change reads as a change, so it can never be mistaken for a clock total. */
function signedHours(n) {
  if (!n) return '—';
  return `${n > 0 ? '+' : '−'}${Math.abs(n).toFixed(2)}`;
}

function pendingSessions(sessions) {
  return sessions.filter(s => !SIGNED_OFF_STATUS.includes(s.approvalStatus || 'pending'));
}

function correctionReasons(sessions) {
  return sessions
    .filter(s => s.approvedHours != null && (s.note || '').trim())
    .map(s => `${s.approvedHours}h — ${s.note.trim()}${s.approvedBy ? ` (${s.approvedBy})` : ''}`);
}

export function renderPayrollView(container, params = {}) {
  const nav = resolveSection(params.tab, params.view);
  const ctx = getContext();
  const month = currentMonthRange();
  const state = {
    start: params.start || month.start,
    end: params.end || month.end,
    tech: params.tech || 'All'
  };
  let dateFilter = null;
  let showData = false;
  // The last computation, kept so the toolbar handlers act on what is on screen.
  let rows = [];
  let blockers = [];

  function visibleTechnicians() {
    if (!ctx.canViewAll) {
      return ctx.technicians.filter(t => String(t.id) === String(ctx.currentUser.id));
    }
    return ctx.technicians.filter(t => state.tech === 'All' || String(t.id) === String(state.tech));
  }

  /**
   * One pass over the period, per technician: what was clocked, what was counted, and
   * which sessions still owe a decision.
   */
  function computePeriod() {
    const now = new Date();
    const dates = datesBetween(state.start, state.end);
    const out = [];
    const pending = [];

    visibleTechnicians().forEach(tech => {
      const key = String(tech.id);
      let days = 0;
      let sessions = 0;
      let unsigned = 0;
      let clockedHours = 0;
      let countedHours = 0;
      // Time on sessions nobody ever clocked out of. It keeps accruing until the day is
      // settled, so it is named in the totals rather than left to inflate them.
      let openHours = 0;
      let openSessions = 0;
      const dayRows = [];

      dates.forEach(date => {
        const list = getSessionsForDay(date).get(key) || [];
        if (list.length === 0) return;

        const { sorted, workedMs } = dayTotals(list, now);
        const clocked = round2(msToHours(workedMs));
        const counted = round2(sorted.reduce((sum, s) => sum + payableHours(s, now), 0));
        const unsignedHere = pendingSessions(sorted).length;
        const openHere = sorted.filter(s => !s.clockOutAt);

        days++;
        sessions += sorted.length;
        unsigned += unsignedHere;
        clockedHours += clocked;
        countedHours += counted;
        openSessions += openHere.length;
        openHours += round2(openHere.reduce((sum, s) => sum + measuredHours(s, now), 0));
        pending.push(...pendingSessions(sorted).map(s => ({ date, tech, session: s })));
        dayRows.push({ date, sessions: sorted.length, clocked, counted, unsigned: unsignedHere, open: openHere.length });
      });

      if (sessions === 0) return;
      clockedHours = round2(clockedHours);
      countedHours = round2(countedHours);
      out.push({
        id: key,
        tech,
        days,
        sessions,
        unsigned,
        clockedHours,
        countedHours,
        openHours: round2(openHours),
        openSessions,
        // By construction, so the three columns always reconcile: any gap between the
        // clock and the pay is a change someone made, and shows as one.
        corrections: round2(countedHours - clockedHours),
        reasons: dayRows.flatMap(d => correctionReasons(getSessionsForDay(d.date).get(key) || [])),
        dayRows
      });
    });

    out.sort((a, b) => (a.tech.name || '').localeCompare(b.tech.name || ''));
    return { rows: out, pending, sessionCount: out.reduce((sum, r) => sum + r.sessions, 0) };
  }

  /** Blocking exceptions, tagged with the technician they belong to. */
  function computeBlockers() {
    const byId = new Map(ctx.technicians.map(t => [String(t.id), t]));
    return getBlockingExceptions(state.start, state.end, visibleTechnicians().map(t => t.id))
      .map(e => ({
        ...e,
        techName: (byId.get(String(e.technicianId)) || {}).name || 'Unknown',
        badge: BLOCKER_BADGE[e.type] || { label: e.type, icon: 'info', cls: 'badge-warning' },
        // Dismissing says "they genuinely didn't work", which only makes sense for a
        // day the roster expected but the clock never saw. An open session is
        // unambiguous — someone is on the clock — so it must be resolved, not waved away.
        canDismiss: e.type === EXCEPTION.MISSING_HOURS
      }));
  }

  function periodState(counted, unsigned) {
    if (blockers.length > 0) return 'blocked';
    if (rows.length === 0) return 'empty';
    if (unsigned > 0) return 'unsigned';
    return 'signed-off';
  }

  function bannerHTML(periodStateId, period) {
    const base = 'display:flex; align-items:flex-start; gap:10px; padding:12px 14px; border-radius:8px; margin-bottom:14px;';
    const states = {
      blocked: {
        icon: 'error_outline',
        color: 'var(--color-danger)',
        bg: 'var(--color-danger-bg)',
        title: `${blockers.length} item${blockers.length === 1 ? '' : 's'} must be resolved before this period can be paid`,
        detail: 'Each one is a day that could still turn out to be unpaid work. Resolve it, or dismiss it if nothing was worked.'
      },
      unsigned: {
        icon: 'fact_check',
        color: 'var(--color-warning)',
        bg: 'var(--color-warning-bg)',
        title: `${period.unsigned} session${period.unsigned === 1 ? '' : 's'} still need${period.unsigned === 1 ? 's' : ''} sign-off`,
        detail: `Nothing is blocking: every rostered day has a record. Signing off records the clocked hours as payable and leaves corrections alone. ${hours2(period.counted)} hours counted.`
      },
      'signed-off': {
        icon: 'check_circle',
        color: 'var(--color-success)',
        bg: 'var(--color-success-bg)',
        title: 'This period is signed off',
        detail: `Every session has been decided, so the records are complete. ${hours2(period.counted)} hours payable across ${period.technicians} technician${period.technicians === 1 ? '' : 's'}.`
      },
      empty: {
        icon: 'hourglass_empty',
        color: 'var(--color-info)',
        bg: 'var(--color-info-bg)',
        title: 'No hours in this period',
        detail: 'Nobody clocked on for these dates. Widen the date range, or check the clock-in device.'
      }
    };
    const s = states[periodStateId];
    return `<div style="${base} background:${s.bg};">
      <span class="material-icons-outlined" style="color:${s.color}; font-size:18px;">${s.icon}</span>
      <div style="font-size:12px; line-height:1.5;">
        <div style="color:${s.color}; font-weight:600;">${escapeHTML(s.title)}</div>
        <div style="color:var(--text-secondary);">${escapeHTML(s.detail)}</div>
      </div>
    </div>`;
  }

  function blockerPanelHTML() {
    if (blockers.length === 0) return '';
    const list = blockers.map((b, i) => `
      <div style="display:flex; align-items:center; gap:10px; padding:9px 14px;${i > 0 ? ' border-top:1px solid var(--border-color);' : ''}">
        <span style="flex:0 0 92px; font-size:12px; color:var(--text-secondary);">${escapeHTML(fmtDay(b.date))}</span>
        <span style="flex:0 0 140px; font-size:12px;">${escapeHTML(b.techName)}</span>
        <span class="badge ${b.badge.cls}" style="flex:0 0 auto; display:inline-flex; align-items:center; gap:3px;">
          <span class="material-icons-outlined" style="font-size:12px;">${b.badge.icon}</span>${escapeHTML(b.badge.label)}
        </span>
        <span style="flex:1; min-width:0; font-size:12px; color:var(--text-secondary);">${escapeHTML(b.detail)}</span>
        <button class="btn btn-sm btn-secondary" data-resolve="${i}" style="flex:0 0 auto;">Resolve</button>
        ${b.canDismiss ? `<button class="btn btn-sm btn-secondary" data-dismiss="${i}" style="flex:0 0 auto;">Dismiss</button>` : ''}
      </div>`).join('');

    return `<div style="border:1px solid var(--border-color); border-radius:8px; margin-bottom:14px; overflow:hidden;">
      <div style="padding:9px 14px; background:var(--bg-secondary); font-size:12px; font-weight:600;">
        Holding up the pay run
      </div>
      ${list}
    </div>`;
  }

  function correctionsCell(row) {
    if (!row.corrections) return '<span class="text-tertiary">—</span>';
    const tip = row.reasons.length > 0 ? row.reasons.join(' | ') : 'Changed without a recorded reason';
    return `<span class="text-warning" data-tooltip="${escapeHTML(tip)}" data-tooltip-pos="left">${signedHours(row.corrections)}</span>`;
  }

  function stateCell(row) {
    if (row.blocked) {
      return '<span class="badge badge-danger">Blocked</span>';
    }
    // A day can be decided while its session is still running: the manager has said what
    // the hours are, the clock never closed. Both facts are worth seeing.
    const open = row.openSessions > 0
      ? ' <span class="badge badge-danger" data-tooltip="A session on this period was never clocked out. Its hours are decided, but the clock is still counting." data-tooltip-pos="left">Clock still open</span>'
      : '';
    if (row.unsigned > 0) {
      return `<span class="badge badge-warning">${row.unsigned} unsigned</span>${open}`;
    }
    return `<span class="badge badge-success">Signed off</span>${open}`;
  }

  function exportRows() {
    const csv = [['Technician', 'Days', 'Sessions', 'Clocked Hours', 'Corrections', 'Counted Hours', 'Sign-off', 'Correction Reasons']];
    rows.forEach(r => {
      const state = r.blocked ? 'Blocked' : (r.unsigned > 0 ? `${r.unsigned} unsigned` : 'Signed off');
      csv.push([
        r.tech.name || '', r.days, r.sessions, hours2(r.clockedHours), hours2(r.corrections ?? 0),
        hours2(r.countedHours),
        r.openSessions > 0 ? `${state} (clock still open)` : state,
        r.reasons.join('; ')
      ]);
    });
    downloadCSV(`payrun_${state.start}_${state.end}.csv`, csv);
    showToast(`Exported ${rows.length} technician${rows.length === 1 ? '' : 's'} to CSV`);
  }

  function openDismissModal(blocker) {
    const content = document.createElement('div');
    content.innerHTML = `
      <p style="font-size:12px; color:var(--text-secondary); margin:0 0 12px; line-height:1.5;">
        ${escapeHTML(blocker.techName)} was rostered to work on ${escapeHTML(fmtDay(blocker.date))}
        but the clock recorded nothing. Dismissing records that they genuinely did not work,
        so the day stops expecting hours and the pay run stops asking.
      </p>
      <div class="form-group">
        <label class="form-label">Reason <span style="color:var(--color-danger)">*</span></label>
        <textarea class="form-input" id="dismiss-note" rows="3">Did not work — no hours to record</textarea>
      </div>`;

    showModal({
      title: `Dismiss ${fmtDay(blocker.date)}`,
      size: 'modal-sm',
      content,
      actions: [
        { label: 'Cancel', className: 'btn-secondary' },
        {
          label: 'Dismiss day',
          className: 'btn-primary',
          onClick: (close) => {
            const reason = (document.querySelector('#dismiss-note')?.value || '').trim();
            if (!reason) { showToast('A reason is required to dismiss a day'); return; }

            const rosterRows = getRosterForDay(blocker.date).get(String(blocker.technicianId)) || [];
            if (rosterRows.length === 0) {
              showToast('That roster row has gone — nothing to dismiss');
              close();
              renderAll();
              return;
            }

            const stamp = new Date().toISOString();
            const by = actorName(ctx.currentUser);
            rosterRows.forEach(r => {
              const existing = (r.notes || '').trim();
              // Notes are appended, never replaced: a dismissal is one more thing that
              // happened to this shift, not a rewrite of its history.
              store.update('schedule', r.id, {
                status: 'dismissed',
                notes: `${existing ? `${existing}\n` : ''}[${stamp.slice(0, 10)}] Dismissed by ${by}: ${reason}`,
                updated_at: stamp
              });
            });

            showToast(`Dismissed ${rosterRows.length} roster row${rosterRows.length === 1 ? '' : 's'} for ${blocker.techName}`);
            close();
            renderAll();
          }
        }
      ]
    });
  }

  function openTechModal(row) {
    const content = document.createElement('div');
    const totalUnsigned = row.unsigned;
    content.innerHTML = `
      <div style="display:flex; gap:14px; font-size:11px; color:var(--text-secondary); margin-bottom:10px; flex-wrap:wrap;">
        <span>Clocked <strong>${hours2(row.clockedHours)} h</strong></span>
        <span>Corrections <strong>${signedHours(row.corrections)}</strong></span>
        <span>Counted <strong>${hours2(row.countedHours)} h</strong></span>
        ${totalUnsigned > 0 ? `<span style="color:var(--color-warning);">${totalUnsigned} session${totalUnsigned === 1 ? '' : 's'} unsigned</span>` : ''}
        ${row.openSessions > 0 ? `<span style="color:var(--color-warning);">${hours2(row.openHours)} h never clocked out</span>` : ''}
      </div>
      <div class="data-table-wrapper">
        <table class="data-table">
          <thead><tr>
            <th>Date</th><th class="num">Sessions</th><th class="num">Clocked (h)</th>
            <th class="num">Counted (h)</th><th>Sign-off</th>
          </tr></thead>
          <tbody>
            ${row.dayRows.map(d => `<tr>
              <td>${escapeHTML(fmtDay(d.date))}</td>
              <td class="num">${d.sessions}</td>
              <td class="num">${hours2(d.clocked)}</td>
              <td class="num">${hours2(d.counted)}</td>
              <td>${d.open > 0
                ? '<span class="badge badge-danger">Still clocked in</span>'
                : (d.unsigned > 0 ? `<span class="badge badge-warning">${d.unsigned} unsigned</span>` : '<span class="badge badge-success">Signed off</span>')}</td>
            </tr>`).join('')}
          </tbody>
        </table>
      </div>`;

    showModal({
      // showModal escapes its title, so this must stay a plain string.
      title: `${row.tech.name || 'Technician'} · ${fmtDay(state.start)} – ${fmtDay(state.end)}`,
      content,
      actions: [
        { label: 'Close', className: 'btn-secondary' },
        {
          label: 'Open in Hours',
          className: 'btn-primary',
          onClick: (close) => {
            close();
            router.navigate(`/timesheets?tab=hours&start=${state.start}&end=${state.end}&tech=${row.id}`);
          }
        }
      ]
    });
  }

  function renderTable() {
    const tableContainer = container.querySelector('#payroll-table-container');
    if (!tableContainer) return;
    tableContainer.innerHTML = '';

    const table = createDataTable({
      columns: [
        // Widths are the columns' measured content needs — the header label plus the
        // widest cell — as shares of the table, so every value is legible in full at
        // the app's window size instead of being ellipsised.
        { key: 'name', label: 'Technician', render: (r) => escapeHTML(r.tech.name || '—'), getValue: (r) => (r.tech.name || '').toLowerCase(), width: '16.2%' },
        { key: 'days', label: 'Days', render: (r) => String(r.days), getValue: (r) => r.days, width: '8.6%', align: 'right' },
        { key: 'clocked', label: 'Clocked (h)', render: (r) => hours2(r.clockedHours), getValue: (r) => r.clockedHours, width: '16.8%', align: 'right' },
        { key: 'corrections', label: 'Corrections (h)', render: correctionsCell, getValue: (r) => r.corrections, width: '22%', align: 'right' },
        { key: 'counted', label: 'Counted (h)', render: (r) => `<span class="font-semibold">${hours2(r.countedHours)}</span>`, getValue: (r) => r.countedHours, width: '17.1%', align: 'right' },
        { key: 'state', label: 'Sign-off', render: stateCell, getValue: (r) => (r.blocked ? 0 : (r.unsigned > 0 ? 1 : 2)), width: '19.3%' }
      ],
      data: rows,
      getId: (r) => r.id,
      emptyMessage: 'No hours in this period',
      emptyIcon: 'hourglass_empty',
      defaultSortKey: 'name',
      defaultSortDir: 'asc',
      rowClass: (r) => (r.blocked ? 'row-attention' : ''),
      onRowClick: (id) => {
        const row = rows.find(r => r.id === id);
        if (row) openTechModal(row);
      }
    });
    tableContainer.appendChild(table);

    const totals = rows.reduce((acc, r) => ({
      clocked: acc.clocked + r.clockedHours,
      counted: acc.counted + r.countedHours,
      unsigned: acc.unsigned + r.unsigned,
      openHours: acc.openHours + r.openHours,
      openSessions: acc.openSessions + r.openSessions
    }), { clocked: 0, counted: 0, unsigned: 0, openHours: 0, openSessions: 0 });

    const foot = document.createElement('div');
    foot.style.cssText = 'padding:10px 16px; font-size:11px; color:var(--text-tertiary); display:flex; gap:14px; flex-wrap:wrap;';
    foot.innerHTML = `
      <span>${rows.length} technician${rows.length === 1 ? '' : 's'}</span>
      <span>Clocked ${hours2(round2(totals.clocked))} h</span>
      ${totals.openSessions > 0
        ? `<span style="color:var(--color-warning);">Includes ${hours2(round2(totals.openHours))} h from ${totals.openSessions} session${totals.openSessions === 1 ? '' : 's'} never clocked out</span>`
        : ''}
      <span>Corrections ${signedHours(round2(totals.counted - totals.clocked))}</span>
      <span>Counted <strong>${hours2(round2(totals.counted))} h</strong></span>
      ${blockers.length > 0
        ? `<span style="color:var(--color-danger);">${blockers.length} item${blockers.length === 1 ? '' : 's'} holding up the pay run</span>`
        : (totals.unsigned > 0
          ? `<span style="color:var(--color-warning);">${totals.unsigned} session${totals.unsigned === 1 ? '' : 's'} still unsigned</span>`
          : '<span style="color:var(--color-success);">Ready to pay</span>')}`;
    tableContainer.appendChild(foot);
  }

  function syncToolbar(period) {
    const btn = container.querySelector('#btn-signoff');
    if (!btn) return;
    const blocked = blockers.length > 0;
    btn.disabled = blocked;
    btn.style.opacity = blocked ? '0.5' : '';
    btn.style.cursor = blocked ? 'not-allowed' : '';
    btn.setAttribute('data-tooltip', blocked
      ? `${blockers.length} item${blockers.length === 1 ? '' : 's'} must be resolved first`
      : 'Record the clocked hours as payable');
    btn.dataset.pending = String(period.pending.length);
  }

  function openSignOffModal(period) {
    if (period.pending.length === 0) {
      showToast('Nothing to sign off — every session in this period has been decided');
      return;
    }
    const already = period.sessionCount - period.pending.length;
    const payable = round2(period.rows.reduce((sum, r) => sum + r.countedHours, 0));
    const pendingHours = round2(period.pending.reduce((sum, p) => sum + (p.session.approvedHours != null
      ? Number(p.session.approvedHours)
      : measuredHours(p.session, new Date())), 0));
    // A technician can correct their own record but cannot sign it off, so a session
    // waiting here may already carry a figure. Signing off is what accepts it.
    const carried = period.pending.filter(p => p.session.approvedHours != null).length;
    const content = document.createElement('div');
    content.innerHTML = `
      <p style="font-size:12px; color:var(--text-secondary); margin:0; line-height:1.6;">
        Signing off accepts ${carried > 0 ? 'the hours recorded on' : 'what the clock measured on'} <strong>${period.pending.length} session${period.pending.length === 1 ? '' : 's'}</strong>
        — <strong>${hours2(pendingHours)} hours</strong> — as payable, and stops asking about
        ${period.pending.length === 1 ? 'it' : 'them'}.
        ${carried > 0 ? `${carried} of them carr${carried === 1 ? 'ies' : 'y'} a correction, which signing off takes as it stands.` : ''}
        ${already > 0 ? `${already} session${already === 1 ? '' : 's'} already decided will be left exactly as they are.` : ''}
        Corrections and their reasons are never overwritten, so the period will total
        <strong>${hours2(payable)} hours</strong> once this is done.
      </p>`;

    showModal({
      title: 'Sign off this period',
      size: 'modal-sm',
      content,
      actions: [
        { label: 'Cancel', className: 'btn-secondary' },
        {
          label: 'Sign off',
          className: 'btn-primary',
          onClick: (close) => {
            const now = new Date();
            const stamp = { approvedBy: actorName(ctx.currentUser), approvedAt: now.toISOString() };
            period.pending.forEach(({ session }) => {
              // A figure someone already recorded is a decision, not a draft: kept as it
              // stands. Only a session with no figure yet takes the measurement. A recorded
              // figure stays a correction afterwards, so signing off a technician's own
              // correction never reads back as an untouched day.
              const carried = session.approvedHours != null ? Number(session.approvedHours) : null;
              store.update('timeClocks', session.id, {
                ...stamp,
                approvalStatus: carried == null ? 'approved' : 'adjusted',
                approvedHours: carried == null ? measuredHours(session, now) : carried
              });
            });
            showToast(`Signed off ${period.pending.length} session${period.pending.length === 1 ? '' : 's'} · ${hours2(payable)} h payable`);
            close();
            renderAll();
          }
        }
      ]
    });
  }

  function renderAll() {
    const period = computePeriod();
    blockers = computeBlockers();
    rows = period.rows.map(r => ({ ...r, blocked: blockers.some(b => String(b.technicianId) === r.id) }));
    const unsignedTotal = rows.reduce((sum, r) => sum + r.unsigned, 0);
    const stateId = periodState(round2(rows.reduce((sum, r) => sum + r.countedHours, 0)), unsignedTotal);

    const body = container.querySelector('#payroll-body');
    if (!body) return;
    body.innerHTML = `
      ${bannerHTML(stateId, {
        counted: round2(rows.reduce((sum, r) => sum + r.countedHours, 0)),
        unsigned: unsignedTotal,
        technicians: rows.length
      })}
      ${blockerPanelHTML()}
      <div id="payroll-table-container"></div>`;

    body.querySelectorAll('[data-resolve]').forEach(btn => {
      btn.addEventListener('click', () => {
        const b = blockers[Number(btn.dataset.resolve)];
        if (!b) return;
        // The day in question is the whole question, so open Hours on exactly that day
        // for exactly that person rather than dropping the manager into a month.
        router.navigate(`/timesheets?tab=hours&start=${b.date}&end=${b.date}&tech=${b.technicianId}`);
      });
    });
    body.querySelectorAll('[data-dismiss]').forEach(btn => {
      btn.addEventListener('click', () => {
        const b = blockers[Number(btn.dataset.dismiss)];
        if (b) openDismissModal(b);
      });
    });

    renderTable();
    syncToolbar(period);
  }

  function mountShell() {
    container.innerHTML = `
      <div class="page-header" style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:8px;">
        <h1>${escapeHTML(viewTitle(nav.section, nav.view))}</h1>
        <div class="page-header-actions" style="display:flex; align-items:center; gap:6px; flex-wrap:wrap;">
          <div id="date-range-mount" style="display:inline-flex; align-items:center;"></div>
          ${ctx.canViewAll ? `<select id="filter-tech" class="form-select" style="height:25px; font-size:11px; padding:0 18px 0 8px; width:150px; margin:0; align-self:center;">
            <option value="All" ${state.tech === 'All' ? 'selected' : ''}>All Technicians</option>
            ${ctx.technicians.map(t => `<option value="${escapeHTML(String(t.id))}" ${String(state.tech) === String(t.id) ? 'selected' : ''}>${escapeHTML(t.name || '—')}</option>`).join('')}
          </select>` : ''}
          ${ctx.canExport ? `<button class="btn btn-sm btn-secondary" id="btn-export-payrun" style="height:25px; font-size:11px; padding:0 10px; display:inline-flex; align-items:center; gap:4px; margin:0; align-self:center;">
            <span class="material-icons-outlined" style="font-size:13px;">download</span> Export CSV
          </button>` : ''}
          ${ctx.canSignOff ? `<button class="btn btn-sm btn-primary" id="btn-signoff" style="height:25px; font-size:11px; padding:0 10px; display:inline-flex; align-items:center; gap:4px; margin:0; align-self:center;">
            <span class="material-icons-outlined" style="font-size:13px;">fact_check</span> Sign off period
          </button>` : ''}
        </div>
      </div>
      <div id="payroll-body"></div>`;

    const mount = container.querySelector('#date-range-mount');
    dateFilter = createDateRangeFilter({
      container: mount,
      onChange: (start, end) => {
        state.start = start || month.start;
        state.end = end || month.end;
        // Seeding the inputs fires this before the first paint.
        if (showData) renderAll();
      }
    });
    seedRange();

    container.querySelector('#filter-tech')?.addEventListener('change', (e) => {
      state.tech = e.target.value;
      renderAll();
    });
    container.querySelector('#btn-export-payrun')?.addEventListener('click', () => exportRows());
    container.querySelector('#btn-signoff')?.addEventListener('click', () => {
      // Read the period fresh: a stale closure would sign off sessions that no longer
      // match what the manager is looking at.
      openSignOffModal(computePeriod());
    });

    showData = true;
    renderAll();
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