// ============================================
// RELAY — HOURS (the payroll record)
// ============================================
// One row per technician per day for a period. This is the record everything else
// trusts: timeClocks is the only source of worked time, and nothing here reads job
// hours or pay rates.
//
//   Worked  — the measured clock total for the day (the sum of its sessions)
//   Breaks  — the gap spent off the clock between sessions. A break is recorded by
//             closing a session with status 'break', so the break itself is the gap to
//             the next session, not that session's own duration.
//   Status  — whether the day's sessions are pending, approved, corrected or rejected
//   Exceptions — derived from the roster, never stored (utils/payrollExceptions.js)
//   Leave   — booked on the roster, decided here. Leave is not hours: the booking shows
//             on the day it falls and deciding it changes nothing about pay.
//
// Corrections require a reason and are written onto the sessions with
// approvedHours/approvedBy/approvedAt/note so the change is auditable and visible to the
// technician. Correcting is not the same right as deciding: someone holding only the
// correction right (a technician fixing their own clock) records the figure and the reason
// against a session that still awaits a decision, so a correction can never sign itself
// off and the period still has to be approved.

import { store } from '../../data/store.js';
import { showToast } from '../../components/Notifications.js';
import { showModal } from '../../components/Modal.js';
import { createDataTable } from '../../components/DataTable.js';
import { createBulkActionBar } from '../../components/BulkActionBar.js';
import { createDateRangeFilter } from '../../utils/dateRangeFilter.js';
import { escapeHTML } from '../../utils/security.js';
import { hasPermission } from '../../utils/permissions.js';
import { formatDuration, mapsLink } from '../../utils/timeClock.js';
import {
  EXCEPTION, deriveExceptions, getRosterForDay, getSessionsForDay, isBlocking
} from '../../utils/payrollExceptions.js';
import {
  actorName, currentMonthRange, datesBetween, dayTotals, downloadCSV, durationMs, fmtDay,
  fmtTime, hoursLabel, isoOf, measuredHours, msToHours, payableHours, round2
} from '../../utils/hoursMath.js';
import { resolveSection, sectionTitle } from '../../utils/timesheetSections.js';

const EXCEPTION_BADGE = {
  [EXCEPTION.OPEN_SESSION]: { label: 'Still clocked in', icon: 'timer', cls: 'badge-danger' },
  [EXCEPTION.MISSING_HOURS]: { label: 'Missing hours', icon: 'error_outline', cls: 'badge-danger' },
  [EXCEPTION.LATE]: { label: 'Late', icon: 'schedule', cls: 'badge-warning' }
};

const STATUS_BADGE = {
  pending: { label: 'Pending', cls: 'badge-neutral' },
  approved: { label: 'Approved', cls: 'badge-success' },
  adjusted: { label: 'Corrected', cls: 'badge-warning' },
  rejected: { label: 'Rejected', cls: 'badge-danger' },
  mixed: { label: 'Mixed', cls: 'badge-info' },
  'no-record': { label: 'No record', cls: 'badge-danger' }
};

// Leave booked on the roster is part of the attendance record rather than a screen of
// its own: a technician on leave has a day here like any other, with no sessions and
// nothing measured. The decision is the roster row's own status, which is where
// payrollExceptions already looks for it (leave raises no expectation of hours), so
// deciding leave settles the record without touching a single hour of pay.
const LEAVE_BADGE = {
  pending: { label: 'Leave pending', cls: 'badge-neutral' },
  approved: { label: 'Leave approved', cls: 'badge-success' },
  rejected: { label: 'Leave declined', cls: 'badge-danger' },
  mixed: { label: 'Leave mixed', cls: 'badge-info' }
};

/** One roster leave row's decision. A booking made in the schedule starts undecided. */
function leaveState(block) {
  if (block.status === 'Approved') return 'approved';
  if (block.status === 'Rejected' || block.status === 'Denied') return 'rejected';
  return 'pending';
}

/**
 * The decision on a day's leave rows. One row a day is the norm; a split day can hold
 * two, so a disagreement between them stays pending rather than reading as decided.
 */
function leaveDecision(blocks) {
  const set = new Set(blocks.map(leaveState));
  if (set.size === 1) return [...set][0];
  return set.has('pending') ? 'pending' : 'mixed';
}

/** Booked leave as a duration. A booking with no hours on it is a full day. */
function leaveMs(blocks) {
  return blocks.reduce((sum, b) => {
    const hours = b.hours != null ? Number(b.hours) : Math.max(0, (b.endHour || 0) - (b.startHour || 0));
    return sum + (hours > 0 ? hours * 3600000 : 0);
  }, 0);
}

/** "8am–4pm" for the booked window, or "All day" when the booking carries no times. */
function leaveWindow(blocks) {
  const parts = blocks
    .filter(b => b.startHour != null && b.endHour != null)
    .sort((a, b) => a.startHour - b.startHour)
    .map(b => `${hourLabel(b.startHour)}–${hourLabel(b.endHour)}`);
  return parts.length ? parts.join(', ') : 'All day';
}

function hourLabel(t) {
  const h = Math.floor(t);
  const m = Math.round((t - h) * 60);
  return `${h % 12 === 0 ? 12 : h % 12}${m ? ':' + String(m).padStart(2, '0') : ''}${h < 12 ? 'am' : 'pm'}`;
}

/** Every note on a day's leave rows, for the tooltip and the day modal. */
function leaveNote(blocks) {
  return blocks.map(b => (b.notes || '').trim()).filter(Boolean).join(' · ');
}

function getContext() {
  const currentUser = JSON.parse(localStorage.getItem('currentUser') || '{"role":"admin"}');
  const isLocalAdmin = localStorage.getItem('relay_login_mode') === 'local';
  const canViewAll = ['admin', 'manager', 'office'].includes(currentUser.role)
    || isLocalAdmin
    || hasPermission('Timesheets', 'view');
  // Correcting a record and deciding what it is worth are separate rights: `edit_all`
  // lets a technician fix a bad clock (a missed clock-out, a wrong figure) but cannot
  // sign their own hours off — approving and rejecting stay with the approval right.
  const canCorrect = ['admin', 'manager', 'office'].includes(currentUser.role)
    || hasPermission('Timesheets', 'approve')
    || hasPermission('Timesheets', 'edit_all');
  const canApprove = ['admin', 'manager', 'office'].includes(currentUser.role)
    || hasPermission('Timesheets', 'approve');
  const canExport = hasPermission('Timesheets', 'export') || canCorrect;
  const technicians = (store.getAll('technicians') || [])
    .filter(t => !t.deactivated)
    .sort((a, b) => (a.name || '').localeCompare(b.name || ''));
  return { currentUser, isLocalAdmin, canViewAll, canCorrect, canApprove, canExport, technicians };
}

function dayStatus(sessions) {
  if (sessions.length === 0) return STATUS_BADGE['no-record'];
  const set = new Set(sessions.map(s => s.approvalStatus || 'pending'));
  if (set.size === 1) return STATUS_BADGE[[...set][0]] || STATUS_BADGE.pending;
  if (set.has('adjusted')) return STATUS_BADGE.adjusted;
  if (set.has('pending')) return STATUS_BADGE.pending;
  return STATUS_BADGE.mixed;
}

/**
 * The status a correction leaves behind. An approver settles the session where it stands;
 * someone correcting without the approval right — a technician fixing their own clock —
 * records the figure and the reason against a session that still awaits a decision, so a
 * correction can never sign itself off.
 */
function correctionStatus(ctx) {
  return ctx.canApprove ? 'adjusted' : 'pending';
}

// Any figure with a reason behind it is a change to the record, whether it settled the
// session or is still waiting on approval, so both keep their line here.
function correctionNotes(sessions) {
  return sessions
    .filter(s => s.approvedHours != null && (s.note || '').trim())
    .map(s => ({ status: s.approvalStatus, hours: s.approvedHours, note: s.note.trim(), by: s.approvedBy }));
}

/** One stored change as a line of text: "rejected to 0h — no show (Demo Admin)". */
function noteLabel(n) {
  const verb = n.status === 'rejected' ? 'rejected to 0h' : `corrected to ${n.hours != null ? n.hours : 0}h`;
  return `${verb} — ${n.note}${n.by ? ` (${n.by})` : ''}`;
}

/** The changes as one line. A day-level decision writes the same note to every session
 *  on the day, so identical notes collapse into "… ×3" instead of repeating. */
function notesSummary(notes) {
  const counts = new Map();
  notes.forEach(n => {
    const label = noteLabel(n);
    counts.set(label, (counts.get(label) || 0) + 1);
  });
  return [...counts].map(([label, count]) => (count > 1 ? `${label} ×${count}` : label)).join(' | ');
}

/**
 * Split a corrected day total across the day's sessions in proportion to what each
 * measured. The total is exact — rounding is carried so the last session absorbs the
 * remainder. A day whose sessions measured nothing cannot be scaled, so the whole
 * figure lands on the last session.
 */
function allocateCorrection(sessions, totalHours, now) {
  const measured = sessions.map(s => msToHours(durationMs(s, now)));
  const sum = measured.reduce((a, b) => a + b, 0);
  if (sum <= 0) {
    return sessions.map((_, i) => (i === sessions.length - 1 ? round2(totalHours) : 0));
  }
  let running = 0;
  return sessions.map((_, i) => {
    if (i === sessions.length - 1) return round2(totalHours - running);
    const v = round2(totalHours * measured[i] / sum);
    running += v;
    return v;
  });
}

export function renderHoursView(container, params = {}) {
  const nav = resolveSection(params.tab, params.view);
  const ctx = getContext();
  const month = currentMonthRange();
  // The period can be set by the URL so the pay run can hand over a single day —
  // "this one is blocking the run, go and look at it".
  const state = {
    start: params.start || month.start,
    end: params.end || month.end,
    tech: params.tech || 'All'
  };
  let table = null;
  let dateFilter = null;
  let rows = [];
  let showData = false;

  function visibleTechnicians() {
    if (!ctx.canViewAll) {
      return ctx.technicians.filter(t => String(t.id) === String(ctx.currentUser.id));
    }
    return ctx.technicians.filter(t => state.tech === 'All' || String(t.id) === String(state.tech));
  }

  function compute() {
    const now = new Date();
    const out = [];
    // Booked leave rides on the same technician-day rows as worked time. Rows come from
    // the roster and the clock, so the leave is gathered here by the day it falls on.
    const leaveByDay = new Map();
    (store.getAll('schedule') || []).forEach(s => {
      if (s.type !== 'leave' || !s.technicianId) return;
      const day = s.date || (s.startTime ? isoOf(new Date(s.startTime)) : null);
      if (!day) return;
      const key = `${s.technicianId}|${day}`;
      if (!leaveByDay.has(key)) leaveByDay.set(key, []);
      leaveByDay.get(key).push(s);
    });

    datesBetween(state.start, state.end).forEach(date => {
      const sessionsByTech = getSessionsForDay(date);
      const rosterByTech = getRosterForDay(date);
      visibleTechnicians().forEach(tech => {
        const key = String(tech.id);
        const sessions = sessionsByTech.get(key) || [];
        const rosterRows = rosterByTech.get(key) || [];
        const leave = leaveByDay.get(`${key}|${date}`) || [];
        const exceptions = deriveExceptions(date, sessions, rosterRows, now);
        // A day earns a row when there is something to see: recorded time, a hole where
        // time was expected, or booked leave waiting on a decision. Quiet future days
        // stay out of the way.
        if (sessions.length === 0 && exceptions.length === 0 && leave.length === 0) return;

        const { sorted, workedMs, breakMs } = dayTotals(sessions, now);
        const payableMs = sorted.reduce((sum, s) => sum + payableHours(s, now) * 3600000, 0);
        const decision = leave.length ? leaveDecision(leave) : null;
        // A leave-only day has no sessions and no roster expectation, so dayStatus() has
        // nothing to read and would fall back to "no record". The leave decision takes
        // the Status column instead.
        const leaveOnly = decision && sorted.length === 0 && exceptions.length === 0;
        out.push({
          id: `${key}|${date}`,
          date,
          tech,
          sessions: sorted,
          workedMs,
          breakMs,
          payableHours: round2(msToHours(payableMs)),
          status: leaveOnly ? LEAVE_BADGE[decision] : dayStatus(sorted),
          exceptions,
          notes: correctionNotes(sorted),
          leave,
          leaveDecision: decision,
          hasBlocking: exceptions.some(e => isBlocking(e.type))
        });
      });
    });
    // Newest first, then by name, so ties inside a day read alphabetically.
    out.sort((a, b) => b.date.localeCompare(a.date) || (a.tech.name || '').localeCompare(b.tech.name || ''));
    return out;
  }

  function sessionsCell(row) {
    if (row.sessions.length === 0) {
      // Nothing was measured and nothing was expected — the booking is the whole content
      // of the day, so the cell shows the leave rather than an empty "no sessions".
      if (row.leave.length > 0) {
        const booked = leaveMs(row.leave);
        const note = leaveNote(row.leave);
        const tooltip = `Leave ${leaveWindow(row.leave)}${note ? ` · ${note}` : ''}`;
        return `<span class="text-secondary" data-tooltip="${escapeHTML(tooltip)}" data-tooltip-pos="left">On leave${booked ? ` · ${escapeHTML(formatDuration(booked))}` : ''}</span>`;
      }
      return '<span class="text-tertiary">No sessions</span>';
    }
    const ranges = row.sessions.map(s => `${fmtTime(s.clockInAt)}–${s.clockOutAt ? fmtTime(s.clockOutAt) : 'now'}`);
    // Every cell in the shared table is single-line, so the ranges run inline and are
    // capped to keep the uniform 40px row rhythm. The full list is on the tooltip and in
    // the day modal.
    const MAX_RANGES = 2;
    const shown = ranges.slice(0, MAX_RANGES).join(', ') + (ranges.length > MAX_RANGES ? ` +${ranges.length - MAX_RANGES}` : '');
    return `<span class="text-secondary" data-tooltip="${escapeHTML(ranges.join(' · '))}" data-tooltip-pos="left">${escapeHTML(shown)}</span>`;
  }

  function statusCell(row) {
    const badge = `<span class="badge ${row.status.cls}">${escapeHTML(row.status.label)}</span>`;
    if (row.notes.length === 0) return badge;
    const tooltip = notesSummary(row.notes);
    return `${badge} <span class="material-icons-outlined text-warning" style="font-size:13px; vertical-align:middle;" data-tooltip="${escapeHTML(tooltip)}" data-tooltip-pos="left">edit_note</span>`;
  }

  function exceptionsCell(row) {
    const badges = row.exceptions.map(e => {
      const badge = EXCEPTION_BADGE[e.type] || { label: e.type, icon: 'info', cls: 'badge-warning' };
      return `<span class="badge ${badge.cls}" data-tooltip="${escapeHTML(e.detail)}" data-tooltip-pos="left" style="display:inline-flex; align-items:center; gap:3px;">
        <span class="material-icons-outlined" style="font-size:12px;">${badge.icon}</span>${escapeHTML(badge.label)}
      </span>`;
    });
    // Worked time and booked leave can share a day. The Status column carries the hours
    // decision, so the leave side is named here instead of being lost in the day modal.
    if (row.sessions.length > 0 && row.leave.length > 0) {
      const leave = LEAVE_BADGE[row.leaveDecision];
      badges.unshift(`<span class="badge badge-info" data-tooltip="Leave ${escapeHTML(leaveWindow(row.leave))} — ${escapeHTML(leave.label.toLowerCase())}" data-tooltip-pos="left" style="display:inline-flex; align-items:center; gap:3px;">
        <span class="material-icons-outlined" style="font-size:12px;">beach_access</span>Leave
      </span>`);
    }
    if (badges.length === 0) return '<span class="text-tertiary">—</span>';
    return badges.join(' ');
  }

  function exportRows(list, filename) {
    const csv = [['Date', 'Technician', 'Sessions', 'Clocked Hours', 'Break Hours', 'Counted Hours', 'Corrected Hours', 'Correction Reason', 'Status', 'Exceptions']];
    list.forEach(r => {
      const base = [r.date, r.tech.name || '', r.sessions.length, round2(msToHours(r.workedMs)),
        round2(msToHours(r.breakMs)), r.payableHours, '', '', r.status.label,
        [...r.exceptions.map(e => e.type), ...(r.leave.length ? [`leave ${r.leaveDecision}`] : [])].join('; ')];
      if (r.notes.length === 0) {
        csv.push(base);
        return;
      }
      // One line per correction so clocked and manual hours stay separable.
      r.notes.forEach((n, i) => {
        const line = i === 0 ? [...base] : base.map(() => '');
        line[6] = n.hours != null ? n.hours : 0;
        line[7] = n.note;
        csv.push(line);
      });
    });
    downloadCSV(filename, csv);
    showToast(`Exported ${list.length} day${list.length === 1 ? '' : 's'} to CSV`);
  }

  function buildBulkActions(selectedIds) {
    const selected = rows.filter(r => selectedIds.includes(r.id));
    const actions = [];

    if (ctx.canApprove || ctx.canCorrect) {
      if (ctx.canApprove) actions.push({
        label: 'Approve days',
        icon: 'check_circle',
        className: 'btn-success',
        onClick: () => {
          const now = Date.now();
          const stamp = { approvedBy: actorName(ctx.currentUser), approvedAt: new Date().toISOString() };
          let count = 0;
          let signedOff = 0;
          selected.forEach(row => {
            row.sessions.forEach(s => {
              const status = s.approvalStatus || 'pending';
              // A correction is a stronger statement than an approval, so a bulk approve
              // must never overwrite hours someone has already corrected and explained.
              if (status === 'approved' || status === 'adjusted') { signedOff++; return; }
              // A figure recorded against a session nobody has decided yet — a technician's
              // own correction — is carried forward rather than measured over the top of
              // it, which is how it reaches the pay run. A rejection is not a figure to
              // carry: approving that day measures it afresh.
              const carried = status === 'rejected' || s.approvedHours == null
                ? null
                : Number(s.approvedHours);
              store.update('timeClocks', s.id, {
                ...stamp,
                approvalStatus: carried == null ? 'approved' : 'adjusted',
                approvedHours: carried == null ? measuredHours(s, now) : carried
              });
              count++;
            });
          });
          showToast(count === 0
            ? (signedOff > 0
              ? 'Nothing to approve — the selected sessions are already signed off'
              : 'Nothing to approve — the selected days have no recorded hours')
            : `Approved ${count} session${count === 1 ? '' : 's'}${signedOff > 0 ? `, left ${signedOff} already signed off` : ''}`);
          if (table) table.clearSelection();
          renderTable();
        }
      });
      if (ctx.canCorrect) actions.push({
        label: 'Correct days',
        icon: 'edit_note',
        className: 'btn-primary',
        onClick: () => openCorrectionModal(selected)
      });
      if (ctx.canApprove) actions.push({
        label: 'Reject days',
        icon: 'block',
        className: 'btn-secondary',
        onClick: () => rejectDays(selected, () => renderTable())
      });
    }

    // Leave rides on the same day rows as worked time but is a separate decision with its
    // own verbs, so these appear only when the selection actually holds leave and they
    // never touch a recorded hour. The wording keeps the two decisions apart.
    if (ctx.canApprove) {
      const leaveBlocks = selected.flatMap(r => r.leave);
      const toApprove = leaveBlocks.filter(b => leaveState(b) !== 'approved');
      const toDecline = leaveBlocks.filter(b => leaveState(b) !== 'rejected');
      if (toApprove.length > 0) {
        actions.push({
          label: 'Approve leave',
          icon: 'beach_access',
          className: 'btn-success',
          onClick: () => {
            toApprove.forEach(b => store.update('schedule', b.id, { status: 'Approved' }));
            showToast(`Approved ${toApprove.length} leave day${toApprove.length === 1 ? '' : 's'}`);
            if (table) table.clearSelection();
            renderTable();
          }
        });
      }
      if (toDecline.length > 0) {
        actions.push({
          label: 'Decline leave',
          icon: 'block',
          className: 'btn-secondary',
          onClick: () => {
            toDecline.forEach(b => store.update('schedule', b.id, { status: 'Rejected' }));
            showToast(`Declined ${toDecline.length} leave day${toDecline.length === 1 ? '' : 's'}`);
            if (table) table.clearSelection();
            renderTable();
          }
        });
      }
    }

    if (ctx.canExport) {
      actions.push({
        label: 'Export CSV',
        icon: 'download',
        className: 'btn-secondary',
        onClick: () => {
          exportRows(selected, `hours_selected_${isoOf(new Date())}.csv`);
          if (table) table.clearSelection();
        }
      });
    }

    return actions;
  }

  function openCorrectionModal(selectedDays) {
    const candidates = selectedDays.filter(r => r.sessions.length > 0);
    if (candidates.length === 0) {
      showToast('Nothing to correct — these days have no recorded hours');
      return;
    }
    const already = candidates.reduce((sum, r) => sum + r.payableHours, 0);
    const multi = candidates.some(r => r.sessions.length > 1);
    // showModal() escapes string content, so rich markup must arrive as an element.
    const content = document.createElement('div');
    content.innerHTML = `
      <div class="form-group" style="margin-bottom:12px;">
        <label class="form-label">Hours that count, per day</label>
        <input type="number" class="form-input" id="correction-hours" step="0.25" min="0" value="${round2(already / candidates.length)}">
        <p style="font-size:11px; color:var(--text-tertiary); margin:6px 0 0;">
          ${candidates.length === 1 ? 'This day will be set to the figure above.' : `Each of the ${candidates.length} selected days will be set to the figure above.`}
          ${multi ? ' Days with several sessions are split in proportion to what each session measured.' : ''}
        </p>
      </div>
      <div class="form-group">
        <label class="form-label">Reason <span style="color:var(--color-danger)">*</span></label>
        <textarea class="form-input" id="correction-note" rows="3" placeholder="Why are these hours different from the clock?"></textarea>
      </div>`;

    showModal({
      title: candidates.length === 1 ? `Correct ${fmtDay(candidates[0].date)}` : `Correct ${candidates.length} days`,
      size: 'modal-sm',
      content,
      actions: [
        { label: 'Cancel', className: 'btn-secondary' },
        {
          label: 'Save correction',
          className: 'btn-primary',
          onClick: (close) => {
            const hours = parseFloat(document.querySelector('#correction-hours')?.value);
            if (!(hours >= 0)) { showToast('Enter a valid number of hours'); return; }
            const reason = (document.querySelector('#correction-note')?.value || '').trim();
            if (!reason) { showToast('A reason is required for a correction'); return; }

            const now = new Date();
            const stamp = { note: reason, approvedBy: actorName(ctx.currentUser), approvedAt: now.toISOString() };
            candidates.forEach(row => {
              const allocations = allocateCorrection(row.sessions, hours, now);
              row.sessions.forEach((s, i) => {
                store.update('timeClocks', s.id, {
                  ...stamp,
                  approvalStatus: correctionStatus(ctx),
                  approvedHours: allocations[i]
                });
              });
            });
            showToast(ctx.canApprove
              ? `Corrected ${candidates.length} day${candidates.length === 1 ? '' : 's'}`
              : `Recorded ${candidates.length} correction${candidates.length === 1 ? '' : 's'} — still waiting on approval`);
            close();
            if (table) table.clearSelection();
            renderTable();
          }
        }
      ]
    });
  }

  /**
   * The confirmation every rejection goes through. Rejecting is the one action that takes
   * pay away, so it always states what is being given up and always carries a reason —
   * which is written onto every session it touches, where the technician reading their own
   * hours and the period close both find it.
   */
  function openRejectModal({ sessions, summary, after }) {
    const content = document.createElement('div');
    content.innerHTML = `
      <div style="margin-bottom:12px; font-size:12px; color:var(--text-secondary); line-height:1.6;">${summary}</div>
      <div class="form-group">
        <label class="form-label">Reason <span style="color:var(--color-danger)">*</span></label>
        <textarea class="form-input" id="reject-note" rows="3" placeholder="Why should these hours not be paid?"></textarea>
      </div>`;

    showModal({
      title: sessions.length === 1 ? 'Reject session' : `Reject ${sessions.length} sessions`,
      size: 'modal-sm',
      content,
      actions: [
        { label: 'Cancel', className: 'btn-secondary' },
        {
          label: 'Reject hours',
          className: 'btn-danger',
          onClick: (close) => {
            const reason = (document.querySelector('#reject-note')?.value || '').trim();
            if (!reason) { showToast('A reason is required to reject hours'); return; }
            const stamp = { note: reason, approvedBy: actorName(ctx.currentUser), approvedAt: new Date().toISOString() };
            sessions.forEach(s => {
              store.update('timeClocks', s.id, { ...stamp, approvalStatus: 'rejected', approvedHours: 0 });
            });
            showToast(`Rejected ${sessions.length} session${sessions.length === 1 ? '' : 's'}`);
            close();
            after();
          }
        }
      ]
    });
  }

  function rejectDays(selectedDays, after) {
    const candidates = selectedDays.filter(r => r.sessions.length > 0);
    if (candidates.length === 0) {
      showToast('Nothing to reject — these days have no recorded hours');
      return;
    }
    const sessions = candidates.flatMap(r => r.sessions);
    const given = round2(candidates.reduce((sum, r) => sum + r.payableHours, 0));
    const open = sessions.filter(s => !s.clockOutAt).length;
    const techCount = new Set(candidates.map(r => String(r.tech.id))).size;
    const scope = candidates.length === 1
      ? `${escapeHTML(candidates[0].tech.name || 'Technician')} · ${escapeHTML(fmtDay(candidates[0].date))}`
      : `${candidates.length} days across ${techCount} technician${techCount === 1 ? '' : 's'}`;
    openRejectModal({
      sessions,
      summary: `${scope}<br>
        ${sessions.length} session${sessions.length === 1 ? '' : 's'} stop counting, giving up <strong>${given}h</strong>.`
        + (open > 0 ? `<br>${open} ${open === 1 ? 'is' : 'are'} still open, so the day keeps reading "still clocked in".` : ''),
      after: () => { if (table) table.clearSelection(); after(); }
    });
  }

  function rejectSession(session, dayRow, after) {
    const now = new Date();
    openRejectModal({
      sessions: [session],
      summary: `${escapeHTML(dayRow.tech.name || 'Technician')} · ${escapeHTML(fmtDay(dayRow.date))}<br>
        ${escapeHTML(fmtTime(session.clockInAt))}–${escapeHTML(session.clockOutAt ? fmtTime(session.clockOutAt) : 'still open')},
        giving up <strong>${round2(payableHours(session, now))}h</strong>.`,
      after
    });
  }

  function acceptSession(session, after) {
    store.update('timeClocks', session.id, {
      approvalStatus: 'approved',
      approvedHours: measuredHours(session, new Date()),
      approvedBy: actorName(ctx.currentUser),
      approvedAt: new Date().toISOString()
    });
    showToast('Session approved');
    after();
  }

  /** A correction aimed at one session, for when the day total is not in question. */
  function openSessionHoursModal(session, dayRow, after) {
    const now = new Date();
    const content = document.createElement('div');
    content.innerHTML = `
      <div style="margin-bottom:12px; font-size:12px; color:var(--text-secondary); line-height:1.6;">
        ${escapeHTML(dayRow.tech.name || 'Technician')} · ${escapeHTML(fmtDay(dayRow.date))}<br>
        ${escapeHTML(fmtTime(session.clockInAt))}–${escapeHTML(session.clockOutAt ? fmtTime(session.clockOutAt) : 'still open')},
        clocked <strong>${escapeHTML(formatDuration(durationMs(session, now)))}</strong> (${measuredHours(session, now).toFixed(2)}h)
      </div>
      <div class="form-group" style="margin-bottom:12px;">
        <label class="form-label">Hours that count</label>
        <input type="number" class="form-input" id="session-hours" step="0.25" min="0" value="${payableHours(session, now)}">
      </div>
      <div class="form-group">
        <label class="form-label">Reason <span style="color:var(--color-danger)">*</span></label>
        <textarea class="form-input" id="session-note" rows="3" placeholder="Why are these hours different from the clock?">${escapeHTML(session.note || '')}</textarea>
      </div>`;

    showModal({
      title: 'Correct session',
      size: 'modal-sm',
      content,
      actions: [
        { label: 'Cancel', className: 'btn-secondary' },
        {
          label: 'Save correction',
          className: 'btn-primary',
          onClick: (close) => {
            const hours = parseFloat(document.querySelector('#session-hours')?.value);
            if (!(hours >= 0)) { showToast('Enter a valid number of hours'); return; }
            const reason = (document.querySelector('#session-note')?.value || '').trim();
            if (!reason) { showToast('A reason is required for a correction'); return; }
            store.update('timeClocks', session.id, {
              approvalStatus: correctionStatus(ctx),
              approvedHours: round2(hours),
              note: reason,
              approvedBy: actorName(ctx.currentUser),
              approvedAt: new Date().toISOString()
            });
            showToast(ctx.canApprove ? 'Session corrected' : 'Correction recorded — still waiting on approval');
            close();
            after();
          }
        }
      ]
    });
  }

  /** Per-session verbs, so one wrong session can be settled without touching the day. */
  function sessionActionsCell(s) {
    if (!ctx.canCorrect && !ctx.canApprove) return '<span class="text-tertiary">—</span>';
    const id = escapeHTML(String(s.id));
    const open = !s.clockOutAt;
    const buttons = [];
    if (ctx.canApprove) {
      buttons.push(`
      <button class="btn-icon btn-secondary" data-session="${id}" data-act="accept" ${open ? 'disabled' : ''}
        data-tooltip="${open ? 'Still on the clock — it has to be clocked out before it can be accepted' : (s.approvalStatus === 'pending' && s.approvedHours != null ? 'Accept as clocked — this replaces the correction recorded on this session' : 'Accept as clocked')}" data-tooltip-pos="left">
        <span class="material-icons-outlined" style="font-size:15px;">check_circle</span>
      </button>`);
    }
    if (ctx.canCorrect) {
      buttons.push(`
      <button class="btn-icon btn-secondary" data-session="${id}" data-act="correct" data-tooltip="Correct these hours" data-tooltip-pos="left">
        <span class="material-icons-outlined" style="font-size:15px;">edit_note</span>
      </button>`);
    }
    if (ctx.canApprove) {
      buttons.push(`
      <button class="btn-icon btn-secondary" data-session="${id}" data-act="reject" data-tooltip="Reject — these hours stop counting" data-tooltip-pos="left">
        <span class="material-icons-outlined" style="font-size:15px;">block</span>
      </button>`);
    }
    return `<div style="display:flex; gap:2px; justify-content:flex-end;">${buttons.join('')}</div>`;
  }

  function openDayModal(row) {
    const id = row.id;
    // Repainted from the store after every action, so the drill-down shows what was just
    // written rather than what was on screen when it opened.
    const content = document.createElement('div');

    function paint() {
      const current = rows.find(r => r.id === id);
      if (!current) return;
      row = current;
      const now = new Date();
      const sessionsHTML = row.sessions.length === 0
        ? `<tr><td colspan="6" class="text-tertiary" style="text-align:center; padding:14px;">${row.leave.length ? 'No sessions recorded — this day is booked leave.' : 'No sessions recorded on this day.'}</td></tr>`
        : row.sessions.map(s => {
          const link = mapsLink(s.clockInLocation);
          const status = STATUS_BADGE[s.approvalStatus || 'pending'] || STATUS_BADGE.pending;
          return `<tr>
            <td>${escapeHTML(fmtTime(s.clockInAt))}</td>
            <td>${escapeHTML(s.clockOutAt ? fmtTime(s.clockOutAt) : 'still open')}${s.status === 'break' ? ' <span class="badge badge-warning" style="font-size:9px;">break</span>' : ''}</td>
            <td class="num">${escapeHTML(formatDuration(durationMs(s, now)))}</td>
            <td><span class="badge ${status.cls}">${escapeHTML(status.label)}</span>${s.approvedHours != null ? ` <span class="text-tertiary" style="font-size:10px;">${s.approvedHours}h counted</span>` : ''}</td>
            <td>${link ? `<a href="${link}" target="_blank" rel="noopener">Map</a>` : '<span class="text-tertiary">—</span>'}</td>
            <td>${sessionActionsCell(s)}</td>
          </tr>`;
        }).join('');

      const exceptionsHTML = row.exceptions.length === 0 ? '' : `
        <div style="margin-bottom:12px; display:flex; flex-direction:column; gap:6px;">
          ${row.exceptions.map(e => {
            const badge = EXCEPTION_BADGE[e.type] || { label: e.type, icon: 'info', cls: 'badge-warning' };
            return `<div style="display:flex; align-items:center; gap:6px; font-size:12px;">
              <span class="badge ${badge.cls}">${escapeHTML(badge.label)}</span>
              <span style="color:var(--text-secondary)">${escapeHTML(e.detail)}</span>
            </div>`;
          }).join('')}
        </div>`;

      const leaveHTML = row.leave.length === 0 ? '' : `
        <div style="margin-bottom:12px; padding:8px 10px; border-radius:6px; background:var(--content-bg); border:1px solid var(--card-border); font-size:11px; display:flex; align-items:center; gap:8px; flex-wrap:wrap;">
          <span class="material-icons-outlined" style="font-size:14px; color:var(--color-primary);">beach_access</span>
          <strong>Leave</strong>
          <span style="color:var(--text-secondary)">${escapeHTML(leaveWindow(row.leave))}</span>
          <span class="badge ${LEAVE_BADGE[row.leaveDecision].cls}">${escapeHTML(LEAVE_BADGE[row.leaveDecision].label)}</span>
          ${leaveMs(row.leave) ? `<span style="color:var(--text-tertiary)">${escapeHTML(formatDuration(leaveMs(row.leave)))} booked</span>` : ''}
          ${leaveNote(row.leave) ? `<span style="color:var(--text-tertiary)">${escapeHTML(leaveNote(row.leave))}</span>` : ''}
        </div>`;

      const notesHTML = row.notes.length === 0 ? '' : `
        <div style="margin-bottom:12px; padding:8px 10px; border-radius:6px; background:var(--color-warning-bg); font-size:11px;">
          <strong>Changes:</strong> ${escapeHTML(notesSummary(row.notes))}
        </div>`;

      content.innerHTML = `
        ${exceptionsHTML}
        ${leaveHTML}
        ${notesHTML}
        <div style="display:flex; gap:14px; font-size:11px; color:var(--text-secondary); margin-bottom:10px; flex-wrap:wrap;">
          <span>Worked <strong>${escapeHTML(formatDuration(row.workedMs))}</strong></span>
          <span>Breaks <strong>${escapeHTML(formatDuration(row.breakMs))}</strong></span>
          ${row.leave.length ? `<span>Leave <strong>${escapeHTML(formatDuration(leaveMs(row.leave)))}</strong></span>` : ''}
          <span>Counted <strong>${row.payableHours}h</strong></span>
        </div>
        <div class="data-table-wrapper">
          <table class="data-table">
            <thead><tr>
              <th style="width:96px;">In</th><th style="width:96px;">Out</th><th class="num" style="width:84px;">Duration</th><th style="width:240px;">Status</th><th style="width:64px;">Location</th><th style="width:112px; text-align:right;">Actions</th>
            </tr></thead>
            <tbody>${sessionsHTML}</tbody>
          </table>
        </div>`;
    }

    function refresh() {
      renderTable();
      paint();
    }

    // Delegated once: repainting replaces the buttons, not the listener.
    content.addEventListener('click', (e) => {
      const btn = e.target.closest('button[data-session]');
      if (!btn) return;
      const session = row.sessions.find(s => String(s.id) === btn.dataset.session);
      if (!session) return;
      if (btn.dataset.act === 'accept') acceptSession(session, refresh);
      else if (btn.dataset.act === 'correct') openSessionHoursModal(session, row, refresh);
      else if (btn.dataset.act === 'reject') rejectSession(session, row, refresh);
    });

    paint();

    const actions = [{ label: 'Close', className: 'btn-secondary' }];
    if (ctx.canApprove && row.sessions.length > 0) {
      actions.unshift({
        label: 'Reject day',
        className: 'btn-danger',
        onClick: () => rejectDays([row], refresh)
      });
    }
    if (ctx.canCorrect && row.sessions.length > 0) {
      actions.unshift({
        label: 'Correct hours',
        className: 'btn-primary',
        onClick: (close) => { close(); openCorrectionModal([row]); }
      });
    }
    // Leave is decided from the day it falls on, and the decision is the booking's own
    // status. Re-reading the row at click time keeps a repaint from writing a stale one.
    if (ctx.canApprove && row.leave.length > 0) {
      const decide = (status, past) => () => {
        const live = rows.find(r => r.id === id);
        const blocks = (live?.leave || row.leave).filter(b => leaveState(b) !== status);
        if (blocks.length === 0) {
          showToast(`Leave on ${fmtDay(row.date)} is already ${past}`);
          return;
        }
        blocks.forEach(b => store.update('schedule', b.id, { status: status === 'approved' ? 'Approved' : 'Rejected' }));
        showToast(`Leave ${past} for ${fmtDay(row.date)}`);
        refresh();
      };
      actions.unshift({ label: 'Decline leave', className: 'btn-secondary', onClick: decide('rejected', 'declined') });
      actions.unshift({ label: 'Approve leave', className: 'btn-success', onClick: decide('approved', 'approved') });
    }

    showModal({
      title: `${row.tech.name || 'Technician'} · ${fmtDay(row.date)}`,
      content,
      size: 'modal-lg',
      actions
    });
  }

  function renderTable() {
    rows = compute();
    if (table) table.clearSelection();
    // A stale bar can outlive the table that owned it; clearing it restores the filters.
    createBulkActionBar({ container, selectedIds: [], actions: [], onClear: () => {} });

    const tableContainer = container.querySelector('#hours-table-container');
    if (!tableContainer) return;
    tableContainer.innerHTML = '';

    table = createDataTable({
      columns: [
        // Widths are the columns' measured content needs — the header label plus the
        // widest cell — as shares of the table, so every value is legible in full at
        // the app's window size instead of being ellipsised.
        { key: 'date', label: 'Date', render: (r) => escapeHTML(fmtDay(r.date)), getValue: (r) => r.date, width: '11.7%' },
        { key: 'techName', label: 'Technician', render: (r) => escapeHTML(r.tech.name || '—'), getValue: (r) => (r.tech.name || '').toLowerCase(), width: '12.8%' },
        { key: 'sessions', label: 'Sessions', render: sessionsCell, getValue: (r) => r.sessions.length, width: '30.5%' },
        { key: 'worked', label: 'Worked', render: (r) => (r.workedMs > 0 ? `<span class="font-semibold">${hoursLabel(r.workedMs)}</span>` : hoursLabel(r.workedMs)), getValue: (r) => r.workedMs, width: '8.9%', align: 'right' },
        { key: 'breaks', label: 'Breaks', render: (r) => hoursLabel(r.breakMs), getValue: (r) => r.breakMs, width: '8.3%', align: 'right' },
        { key: 'status', label: 'Status', render: statusCell, getValue: (r) => r.status.label, width: '15.4%' },
        { key: 'exceptions', label: 'Exceptions', render: exceptionsCell, getValue: (r) => (r.exceptions.length ? 1 : 0), width: '12.4%' }
      ],
      data: rows,
      getId: (r) => r.id,
      emptyMessage: 'No hours in this period',
      emptyIcon: 'hourglass_empty',
      selectable: ctx.canCorrect || ctx.canExport,
      defaultSortKey: 'date',
      defaultSortDir: 'desc',
      rowClass: (r) => (r.hasBlocking ? 'row-attention' : ''),
      onRowClick: (id) => {
        const row = rows.find(r => r.id === id);
        if (row) openDayModal(row);
      },
      onSelectionChange: (selectedIds) => {
        createBulkActionBar({
          container,
          selectedIds,
          actions: buildBulkActions(selectedIds),
          onClear: () => table.clearSelection()
        });
      }
    });
    tableContainer.appendChild(table);

    const blocking = rows.filter(r => r.hasBlocking).length;
    // Leave is outstanding until someone decides it, but it is not a pay blocker, so it
    // gets its own line instead of being folded into the attention count.
    const pendingLeave = rows.filter(r => r.leave.length > 0 && r.leaveDecision === 'pending').length;
    // Hours nobody has decided yet are not exceptions — they don't make the day need
    // attention — but they do hold up the pay run, so saying nothing about them would
    // contradict the pay run's own "still needs sign-off" count.
    const undecided = rows.reduce((n, r) => n + r.sessions.filter(s => (s.approvalStatus || 'pending') === 'pending').length, 0);
    const totalWorkedMs = rows.reduce((sum, r) => sum + r.workedMs, 0);
    const totalBreakMs = rows.reduce((sum, r) => sum + r.breakMs, 0);
    const foot = document.createElement('div');
    foot.style.cssText = 'padding:10px 16px; font-size:11px; color:var(--text-tertiary); display:flex; gap:14px; flex-wrap:wrap;';
    foot.innerHTML = `
      <span>${rows.length} day${rows.length === 1 ? '' : 's'} shown</span>
      <span>Worked ${formatDuration(totalWorkedMs)}</span>
      <span>Breaks ${formatDuration(totalBreakMs)}</span>
      ${pendingLeave > 0 ? `<span style="color:var(--color-warning);">${pendingLeave} leave request${pendingLeave === 1 ? '' : 's'} awaiting a decision</span>` : ''}
      ${undecided > 0 ? `<span style="color:var(--color-warning);">${undecided} session${undecided === 1 ? '' : 's'} ${ctx.canApprove ? 'awaiting your decision' : 'still waiting on approval'}</span>` : ''}
      ${blocking > 0
        ? `<span style="color:var(--color-danger);">${blocking} day${blocking === 1 ? ' needs' : 's need'} attention before the pay run</span>`
        : (undecided > 0 || pendingLeave > 0
          ? '<span style="color:var(--color-warning);">No pay blockers — decisions pending</span>'
          : '<span style="color:var(--color-success);">Nothing outstanding in this period</span>')}`;
    tableContainer.appendChild(foot);
  }

  function mountShell() {
    container.innerHTML = `
      <div class="page-header" style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:8px;">
        <h1>${escapeHTML(sectionTitle(nav.section))}</h1>
        <div class="page-header-actions" style="display:flex; align-items:center; gap:6px; flex-wrap:wrap;">
          <div id="date-range-mount" style="display:inline-flex; align-items:center;"></div>
          ${ctx.canViewAll ? `<select id="filter-tech" class="form-select" style="height:25px; font-size:11px; padding:0 18px 0 8px; width:150px; margin:0; align-self:center;">
            <option value="All" ${state.tech === 'All' ? 'selected' : ''}>All Technicians</option>
            ${ctx.technicians.map(t => `<option value="${escapeHTML(String(t.id))}" ${String(state.tech) === String(t.id) ? 'selected' : ''}>${escapeHTML(t.name || '—')}</option>`).join('')}
          </select>` : ''}
          ${ctx.canExport ? `<button class="btn btn-sm btn-secondary" id="btn-export-hours"  data-tooltip="Export this period to CSV" data-tooltip-pos="left" style="height:25px; font-size:11px; padding:0 10px; display:inline-flex; align-items:center; gap:4px; margin:0; align-self:center;">
            <span class="material-icons-outlined" style="font-size:13px;">download</span> Export CSV
          </button>` : ''}
        </div>
      </div>
      <div id="hours-table-container"></div>
    `;

    const mount = container.querySelector('#date-range-mount');
    dateFilter = createDateRangeFilter({
      container: mount,
      onChange: (start, end) => {
        state.start = start || month.start;
        state.end = end || month.end;
        // Seeding the inputs fires this before the first paint.
        if (showData) renderTable();
      }
    });
    // Show the period actually being listed, so the filter never reads "Date" over a
    // month of rows.
    seedRange();

    container.querySelector('#filter-tech')?.addEventListener('change', (e) => {
      state.tech = e.target.value;
      renderTable();
    });
    container.querySelector('#btn-export-hours')?.addEventListener('click', () => {
      exportRows(rows, `hours_${state.start}_${state.end}.csv`);
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
