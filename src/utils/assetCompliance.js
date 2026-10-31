// ============================================
// RELAY — ASSET WARRANTY & COMPLIANCE
// ============================================
// Dated obligations on an asset that aren't servicing: its warranty, and
// recurring compliance checks such as test & tag (AS/NZS 3760), emergency
// lighting (AS 2293.2) or a fire panel's annual survey. Each compliance item
// is { id, name, intervalMonths, lastDone, dueDate, reference }: it falls due
// intervalMonths after it was last done, unless dueDate pins a date.

import { toDateKey } from './dateUtils.js';
import { addMonths, daysUntil } from './maintenanceSchedule.js';

/** Within this many days, a date counts as due soon. */
export const COMPLIANCE_SOON_DAYS = 30;

/** Common checks offered when adding an item; any name is allowed. */
export const COMPLIANCE_PRESETS = [
  { name: 'Test & tag (AS/NZS 3760)', intervalMonths: 3 },
  { name: 'Emergency lighting test (AS 2293.2)', intervalMonths: 6 },
  { name: 'RCD test', intervalMonths: 6 },
  { name: 'Fire equipment inspection (AS 1851)', intervalMonths: 6 },
  { name: 'Annual fire safety statement', intervalMonths: 12 },
  { name: 'Gas safety check', intervalMonths: 24 },
  { name: 'Vehicle registration', intervalMonths: 12 },
];

function dateState(dueKey, todayKey) {
  if (!dueKey) return 'none';
  const days = daysUntil(todayKey, dueKey);
  return days < 0 ? 'overdue' : days <= COMPLIANCE_SOON_DAYS ? 'due-soon' : 'ok';
}

/** When a compliance item is next due: its pinned date, else lastDone + interval. */
export function complianceDueKey(item) {
  const pinned = toDateKey(item?.dueDate);
  if (pinned) return pinned;
  const last = toDateKey(item?.lastDone);
  const months = parseInt(item?.intervalMonths, 10);
  return last && months > 0 ? addMonths(last, months) : null;
}

/** @returns {{state: 'overdue'|'due-soon'|'ok'|'none', dueKey: string|null}} */
export function complianceStatus(item, todayKey) {
  const dueKey = complianceDueKey(item);
  return { state: dateState(dueKey, todayKey), dueKey };
}

/** The warranty: 'expired' once past, 'expiring' within 30 days, else 'ok'. */
export function warrantyStatus(asset, todayKey) {
  const dueKey = toDateKey(asset?.warrantyExpiry);
  const state = dateState(dueKey, todayKey);
  return { state: state === 'overdue' ? 'expired' : state === 'due-soon' ? 'expiring' : state, dueKey };
}

/** The asset's compliance items with their status, most urgent first. */
export function complianceItems(asset, todayKey) {
  const rank = { overdue: 0, 'due-soon': 1, ok: 2, none: 3 };
  return (asset?.compliance || [])
    .map(item => ({ item, ...complianceStatus(item, todayKey) }))
    .sort((a, b) => rank[a.state] - rank[b.state] || String(a.dueKey || '').localeCompare(String(b.dueKey || '')));
}

/** True when any compliance item is overdue or due within 30 days. */
export function hasComplianceDue(asset, todayKey) {
  return complianceItems(asset, todayKey).some(c => c.state === 'overdue' || c.state === 'due-soon');
}

/** The item after being done on `doneKey`: the date moves on and any pinned due date clears. */
export function markComplianceDone(item, doneKey) {
  const { dueDate, ...rest } = item;
  return { ...rest, lastDone: doneKey };
}
