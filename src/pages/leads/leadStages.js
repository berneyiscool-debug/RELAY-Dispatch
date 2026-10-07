/**
 * Lead pipeline configuration - the single source of truth for stages,
 * win likelihood, badge classes and the derived pipeline maths.
 *
 * Every lead surface - LeadsList.js, LeadDetail.js and LeadForm.js - reads
 * stages, badge classes and the owner/next-action markup from here, so no
 * screen can drift from another.
 *
 * DOM-free on purpose - this module is imported directly by node --test, so
 * nothing here touches document/window; the HTML builders only return strings
 * and the one localStorage read is guarded.
 */
import { store } from '../../data/store.js';
import { escapeHTML } from '../../utils/security.js';
import { todayLocalISO } from '../../utils/dateUtils.js';

export const LEAD_STAGES = ['New', 'Contacted', 'Qualified', 'Proposal', 'Negotiation', 'Won', 'Lost'];

/** Pipeline order alias - same array, exported for callers that want intent. */
export const LEAD_STAGE_ORDER = LEAD_STAGES;

/** Every stage that still needs work: an open lead is neither Won nor Lost. */
export const OPEN_STAGES = LEAD_STAGES.filter((stage) => stage !== 'Won' && stage !== 'Lost');

export const LEAD_LIKELIHOOD = {
  New: 10,
  Contacted: 30,
  Qualified: 50,
  Proposal: 70,
  Negotiation: 85,
  Won: 100,
  Lost: 0,
};

export const LEAD_STATUS_BADGES = {
  New: 'badge-info',
  Contacted: 'badge-neutral',
  Qualified: 'badge-warning',
  Proposal: 'badge-primary',
  Negotiation: 'badge-purple',
  Won: 'badge-success',
  Lost: 'badge-danger',
};

export const LEAD_PRIORITY_BADGES = {
  Low: 'badge-neutral',
  Medium: 'badge-warning',
  High: 'badge-danger',
};

/** Colour ramp for the pipeline strip, cool (early) to warm (late). */
export const LEAD_STAGE_ACCENTS = {
  New: 'var(--color-info)',
  Contacted: 'var(--color-primary)',
  Qualified: 'var(--color-warning)',
  Proposal: 'var(--color-primary-hover)',
  Negotiation: 'var(--color-primary-ink)',
  Won: 'var(--color-success)',
  Lost: 'var(--color-danger)',
};

/** Days without activity before a lead is considered stale. */
export const STALE_DAYS = 14;

const MS_PER_DAY = 86400000;

const round2 = (value) => Math.round(value * 100) / 100;

function toDate(value) {
  if (!value) return null;
  const date = value instanceof Date ? value : new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

function currentUserName() {
  if (typeof localStorage === 'undefined') return 'System';
  try {
    const raw = localStorage.getItem('currentUser');
    if (!raw) return 'System';
    return JSON.parse(raw)?.name || 'System';
  } catch (error) {
    return 'System';
  }
}

/** Expected value of a lead: pipeline value weighted by stage likelihood. */
export function weightedLeadValue(lead) {
  if (!lead) return 0;
  return (Number(lead.value) || 0) * (LEAD_LIKELIHOOD[lead.status] ?? 0) / 100;
}

/** Last activity timestamp, preferring an update over the record's creation. */
export function lastLeadActivityAt(lead) {
  if (!lead) return null;
  const candidates = [lead.updatedAt, lead.updated_at, lead.createdAt, lead.created_at];
  for (const candidate of candidates) {
    const date = toDate(candidate);
    if (date) return date.toISOString();
  }
  return null;
}

/** Whole days of silence, 0 when unknown. Never negative. */
export function leadIdleDays(lead, now = new Date()) {
  const activity = toDate(lastLeadActivityAt(lead));
  const reference = toDate(now);
  if (!activity || !reference) return 0;
  return Math.max(0, Math.floor((reference.getTime() - activity.getTime()) / MS_PER_DAY));
}

/**
 * True when nothing has happened on the lead for longer than `days`.
 * Boundary note: exactly `days` of silence is not yet stale.
 */
export function isLeadStale(lead, days = STALE_DAYS, now = new Date()) {
  const activity = toDate(lastLeadActivityAt(lead));
  const reference = toDate(now);
  if (!activity || !reference) return false;
  return reference.getTime() - activity.getTime() > days * MS_PER_DAY;
}

/**
 * Returns a NEW history array with the transition prepended, matching the
 * newest-first order and entry shape LeadDetail.js writes. `text` overrides the
 * default transition sentence for special cases such as a quote conversion.
 */
export function logLeadStageChange(lead, from, to, text) {
  const history = lead && Array.isArray(lead.stageHistory) ? lead.stageHistory : [];
  const entry = {
    id: `hist_${Date.now()}`,
    status: to,
    text: text || `Lead stage transitioned from "${from}" to "${to}".`,
    user: currentUserName(),
    timestamp: new Date().toISOString(),
  };
  return [entry, ...history];
}

/**
 * In-app notification for the lead's owner. No-op when the lead is unowned.
 * The id is stable per lead per day so a second device does not stack
 * duplicates for the same update.
 */
export function notifyLeadOwner(lead, { title, message } = {}) {
  const owner = lead && (lead.assignedTo || lead.assigned_to);
  if (!owner) return null;

  const id = `notif_lead_${lead.id || 'unknown'}_${todayLocalISO()}`;
  if (store.getById('notifications', id)) return null;

  const description = message || title || 'Lead updated';
  const record = {
    id,
    type: 'Lead Activity',
    title: title || `Lead update: ${lead.title || lead.number || lead.id}`,
    leadId: lead.id,
    assignedTo: owner,
    description,
    message: description,
    status: 'Info',
    createdAt: new Date().toISOString(),
    createdBy: 'Lead Pipeline',
    origin: 'system',
  };
  if (lead.number) record.link = `/leads/${lead.id}`;
  return store.create('notifications', record);
}

/** Badge class for a stage. A blank status reads as New; an unrecognised one stays neutral. */
export function leadStageBadge(status) {
  return LEAD_STATUS_BADGES[status || 'New'] || 'badge-neutral';
}

/** The stage a lead is reported against, defaulting a blank or unknown status to New. */
export function primaryLeadStage(lead) {
  const status = lead ? lead.status : '';
  return LEAD_STAGES.includes(status) ? status : 'New';
}

/** True while the lead still needs work - neither Won nor Lost. */
export function isOpenLead(lead) {
  return OPEN_STAGES.includes(primaryLeadStage(lead));
}

/** Display name of the lead's owner, or '' when nobody is assigned. */
function leadOwnerName(lead) {
  if (!lead) return '';
  return lead.assignedToName || lead.salesRepName || lead.sales_rep_name || '';
}

/** Owner cell: initials avatar plus name, or an Unassigned placeholder. */
export function leadOwnerHtml(lead) {
  const name = leadOwnerName(lead);
  if (!name) return '<span class="lead-owner-unassigned">Unassigned</span>';
  const initials = name.trim().split(/\s+/).slice(0, 2).map((word) => word.charAt(0)).join('');
  return `<span class="lead-owner"><span class="lead-owner-avatar">${escapeHTML(initials)}</span><span class="lead-owner-name">${escapeHTML(name)}</span></span>`;
}

/**
 * `YYYY-MM-DD` for a stored date or ISO timestamp, '' when unusable.
 * Guards against the `Invalid Date` that a raw `.split('T')[0]` would leak.
 */
export function leadDatePart(value) {
  if (!value) return '';
  const source = value instanceof Date ? value.toISOString() : String(value);
  const part = source.split('T')[0];
  return /^\d{4}-\d{2}-\d{2}$/.test(part) ? part : '';
}

/** Friendly `en-AU` label for a date or timestamp, '' when unusable. */
export function leadDateLabel(value) {
  const part = leadDatePart(value);
  return part ? new Date(`${part}T00:00:00`).toLocaleDateString('en-AU') : '';
}

/** Next action cell: the date (red once overdue) plus a stale badge. */
export function leadNextActionHtml(lead, { withStale = true } = {}) {
  const due = leadDatePart(lead && lead.nextActionDate);
  const dateHtml = due
    ? `<span class="lead-next-action${due < todayLocalISO() ? ' is-overdue' : ''}">${leadDateLabel(due)}</span>`
    : '<span class="text-secondary">—</span>';
  const stale = withStale && isOpenLead(lead) && isLeadStale(lead)
    ? `<span class="lead-stale-badge" title="No activity in ${leadIdleDays(lead)} days">Stale</span>`
    : '';
  return dateHtml + stale;
}

/** One row per stage, always in pipeline order, zero-count stages included. */
export function summarizeByStage(leads) {
  const list = Array.isArray(leads) ? leads.filter(Boolean) : [];
  return LEAD_STAGES.map((stage) => {
    const stageLeads = list.filter((lead) => lead.status === stage);
    return {
      stage,
      count: stageLeads.length,
      totalValue: round2(stageLeads.reduce((sum, lead) => sum + (Number(lead.value) || 0), 0)),
      weightedValue: round2(stageLeads.reduce((sum, lead) => sum + weightedLeadValue(lead), 0)),
    };
  });
}
