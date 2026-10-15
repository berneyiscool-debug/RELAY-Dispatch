// ============================================
// RELAY DISPATCH — INVOICE LABOUR SOURCE
// ============================================
// When an invoice is raised against a job's tasklist the labour line can be
// priced two ways: from the tasklist estimates (`estimated`) or from the time
// actually recorded against the job (`booked`). The choice belongs to the modal
// shown before generation, so the shared pieces live here: the radio-card the
// modals render, the DOM-light readers the submit handlers use, and the
// booked-hours arithmetic that JobDetail, JobsList and ProjectDetail all need.

import { escapeHTML } from './security.js';
import { hoursOf } from './jobTimeLedger.js';

export const HOURS_SOURCE = {
  ESTIMATED: 'estimated',
  BOOKED: 'booked'
};

const FALLBACK_LABOUR_RATE = 85;
const RADIO_NAME = 'hours-source';

export function hoursSourceLabel(source) {
  return source === HOURS_SOURCE.BOOKED ? 'Hours Booked' : 'Hours Estimated';
}

/** Booked hours on one timesheet row, tolerating the legacy column names. */
export function bookedHours(record) {
  return hoursOf(record);
}

/**
 * Total booked hours per job. Keys are job ids as strings so a timesheet whose
 * `jobId` arrived as a string from the cloud still matches the numeric job id.
 */
export function bookedHoursByJob(timesheets = []) {
  const byJob = new Map();
  for (const record of timesheets || []) {
    const key = record?.jobId === undefined || record?.jobId === null ? '' : String(record.jobId);
    if (!key) continue;
    byJob.set(key, (byJob.get(key) || 0) + bookedHours(record));
  }
  return byJob;
}

/** Booked hours for one job from a map built by bookedHoursByJob. */
export function bookedHoursForJob(byJob, jobId) {
  if (!byJob || jobId === undefined || jobId === null) return 0;
  return byJob.get(String(jobId)) || 0;
}

/** Sum the estimate and booked columns of `[{ estimatedHours, bookedHours }]`. */
export function hoursSourceTotals(rows = []) {
  let estimated = 0;
  let booked = 0;
  for (const row of rows || []) {
    estimated += Number(row?.estimatedHours) || 0;
    booked += Number(row?.bookedHours) || 0;
  }
  return { estimated, booked };
}

/** The rows that have no booked time at all — invoicing those is blocked. */
export function jobsWithoutBookedHours(rows = []) {
  return (rows || []).filter(row => !(Number(row?.bookedHours) > 0));
}

/** The single default Settings labour rate, mirroring the tasklist pricing. */
export function defaultLabourRate(settings) {
  const rates = (settings && settings.laborRates) || [];
  const profile = rates.find(r => r.isDefault) || rates[0];
  const rate = Number(profile && profile.rate);
  return {
    rate: Number.isFinite(rate) ? rate : FALLBACK_LABOUR_RATE,
    name: (profile && profile.name) || 'Labour'
  };
}

/** Labour line priced from booked hours, shaped like the estimated one. */
export function bookedLabourLine({ hours, rate, rateName, makeId }) {
  if (!(hours > 0)) return null;
  return {
    id: makeId(),
    description: `${rateName} (${hours.toFixed(2)} hrs)`,
    type: 'labor',
    qty: hours,
    rate,
    total: hours * rate
  };
}

function jobLabel(row) {
  const number = row?.jobNumber ? `#${row.jobNumber}` : '';
  const title = row?.jobTitle || '';
  const label = [number, title].filter(Boolean).join(' ');
  if (label) return label;
  return row?.jobId === undefined || row?.jobId === null ? 'the selected job' : `Job ${row.jobId}`;
}

/** Why booked hours cannot be used, or '' when the choice is usable. */
export function hoursSourceError(source, rows = []) {
  if (source !== HOURS_SOURCE.BOOKED) return '';
  const missing = jobsWithoutBookedHours(rows);
  if (missing.length === 0) return '';
  const names = missing.map(jobLabel).join(', ');
  const subject = missing.length === 1 ? 'that job' : 'those jobs';
  return `No booked hours recorded for ${names}, so ${subject} cannot be invoiced from booked hours. Record time against the job, or bill from estimated hours.`;
}

/**
 * The radio-card group the pre-invoice modals render. `rows` describe what is
 * about to be invoiced: `[{ jobId, jobNumber, jobTitle, estimatedHours, bookedHours }]`.
 */
export function hoursSourceCardHtml({ name = RADIO_NAME, selected = HOURS_SOURCE.ESTIMATED, rows = [], rate = 0 } = {}) {
  const totals = hoursSourceTotals(rows);
  const rateValue = Number(rate) || 0;
  const money = hours => (rateValue > 0 ? ` = $${(hours * rateValue).toFixed(2)}` : '');
  const cardStyle = 'display:flex; align-items:flex-start; gap:8px; font-size:13px; cursor:pointer; padding:10px; border:1px solid var(--border-color); border-radius:8px';
  const detailStyle = 'display:block; color:var(--text-secondary); font-size:12px; margin-top:2px';
  const missing = jobsWithoutBookedHours(rows);
  const estimatedChecked = selected === HOURS_SOURCE.BOOKED ? '' : ' checked';
  const bookedChecked = selected === HOURS_SOURCE.BOOKED ? ' checked' : '';

  return `
    <div class="card" style="padding:12px; background:var(--bg-color); border:1px solid var(--border-color); margin-bottom:0">
      <label class="form-label" style="font-weight:700; margin-bottom:8px; display:block">Bill Labour From</label>
      <div style="display:grid; grid-template-columns:1fr 1fr; gap:12px">
        <label style="${cardStyle}">
          <input type="radio" name="${escapeHTML(name)}" value="${HOURS_SOURCE.ESTIMATED}"${estimatedChecked} />
          <span>
            <strong>Hours Estimated</strong>
            <span style="${detailStyle}">Tasklist estimates — ${totals.estimated.toFixed(2)} hrs${money(totals.estimated)}</span>
          </span>
        </label>
        <label style="${cardStyle}">
          <input type="radio" name="${escapeHTML(name)}" value="${HOURS_SOURCE.BOOKED}"${bookedChecked} />
          <span>
            <strong>Hours Booked</strong>
            <span style="${detailStyle}">Recorded timesheets — ${totals.booked.toFixed(2)} hrs${money(totals.booked)}</span>
          </span>
        </label>
      </div>
      ${missing.length > 0 ? `
        <div style="margin-top:8px; font-size:12px; color:var(--color-danger)">
          No booked hours recorded for ${escapeHTML(missing.map(jobLabel).join(', '))} — those jobs cannot be invoiced from booked hours.
        </div>
      ` : ''}
      <div class="hours-source-error" style="display:none; margin-top:8px; font-size:12px; color:var(--color-danger)"></div>
    </div>
  `;
}

/** The chosen labour source in a rendered modal, defaulting to estimates. */
export function readHoursSource(root, name = RADIO_NAME) {
  const checked = root && root.querySelector ? root.querySelector(`input[name="${name}"]:checked`) : null;
  return checked && checked.value === HOURS_SOURCE.BOOKED ? HOURS_SOURCE.BOOKED : HOURS_SOURCE.ESTIMATED;
}

/** Show or clear the modal's inline validation message. */
export function setHoursSourceError(root, message) {
  const el = root && root.querySelector ? root.querySelector('.hours-source-error') : null;
  if (!el) return;
  el.textContent = message || '';
  el.style.display = message ? 'block' : 'none';
}
