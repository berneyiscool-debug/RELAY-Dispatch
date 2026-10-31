// ============================================
// RELAY — MAINTENANCE PLAN SCHEDULE
// ============================================
// Date and meter arithmetic for maintenance plans, shared by the maintenance
// engine (raising a plan) and the store (completing the job it raised). No
// store import, so both can use it without a circular dependency.
//
// Dates are local "YYYY-MM-DD" keys throughout. `new Date('2026-01-31')` is UTC
// midnight and `setMonth` overflows (31 Jan + 1 month = 3 Mar), so neither is
// used here.

import { toDateKey } from './dateUtils.js';

const MONTHS_PER_FREQUENCY = { Monthly: 1, Quarterly: 3, 'Semi-Annually': 6, Annually: 12 };

/** Asset statuses that no longer raise maintenance work. */
export const RETIRED_ASSET_STATUSES = ['Decommissioned', 'Lost/Stolen'];

export function isRetiredAsset(asset) {
  return RETIRED_ASSET_STATUSES.includes(asset?.status);
}

function daysInMonth(year, monthIndex) {
  return new Date(year, monthIndex + 1, 0).getDate();
}

function keyOf(year, monthIndex, day) {
  const pad = (n) => String(n).padStart(2, '0');
  return `${year}-${pad(monthIndex + 1)}-${pad(day)}`;
}

/**
 * The date `steps` periods of `frequency` after `dateKey`. Month-based
 * frequencies keep the day of the month and clamp it to the month's length, so
 * 31 January goes to 28/29 February, not 3 March. Stepping several periods at
 * once is measured from the original day, so 31 Jan + 2 months is 31 March.
 *
 * @param {string} dateKey YYYY-MM-DD
 * @param {string} frequency Weekly | Monthly | Quarterly | Semi-Annually | Annually
 * @param {number} [steps]
 * @returns {string|null} YYYY-MM-DD, or null for an unreadable date or unknown frequency
 */
export function addFrequency(dateKey, frequency, steps = 1) {
  if (frequency === 'Weekly') {
    const key = toDateKey(dateKey);
    if (!key) return null;
    const [y, m, d] = key.split('-').map(Number);
    const next = new Date(y, m - 1, d + 7 * steps);
    return keyOf(next.getFullYear(), next.getMonth(), next.getDate());
  }
  const months = MONTHS_PER_FREQUENCY[frequency];
  return months ? addMonths(dateKey, months * steps) : null;
}

/** `dateKey` plus a number of months, clamped to the end of a shorter month. */
export function addMonths(dateKey, months) {
  const key = toDateKey(dateKey);
  const count = parseInt(months, 10);
  if (!key || !Number.isFinite(count)) return null;
  const [y, m, d] = key.split('-').map(Number);
  const total = (m - 1) + count;
  const year = y + Math.floor(total / 12);
  const monthIndex = ((total % 12) + 12) % 12;
  return keyOf(year, monthIndex, Math.min(d, daysInMonth(year, monthIndex)));
}

/**
 * The first occurrence of the plan's frequency after `todayKey`, counting from
 * `dateKey`. A plan whose due date has long passed (resumed after a pause, or
 * set up with an old date) is raised once and then moves straight to its next
 * future date, instead of raising one notification per engine run while it
 * catches up a period at a time.
 *
 * @returns {string|null}
 */
export function nextDateAfter(dateKey, frequency, todayKey) {
  let steps = 1;
  let next = addFrequency(dateKey, frequency, steps);
  while (next && next <= todayKey && steps < 1000) {
    steps += 1;
    next = addFrequency(dateKey, frequency, steps);
  }
  return next;
}

/** Whole days from one date key to another (negative when `toKey` is earlier). */
export function daysUntil(fromKey, toKey) {
  const [fy, fm, fd] = String(fromKey).split('-').map(Number);
  const [ty, tm, td] = String(toKey).split('-').map(Number);
  return Math.round((new Date(ty, tm - 1, td) - new Date(fy, fm - 1, fd)) / 86400000);
}

/**
 * The meter milestone a plan has now passed: the last multiple of the interval
 * (counted from `lastTriggered`) at or below the current reading. A reading
 * that jumps several intervals raises one service, not one per interval.
 *
 * @returns {number} the new lastTriggeredMeter; unchanged when no milestone was passed
 */
export function passedMeterMilestone(lastTriggered, interval, currentMeter) {
  const last = parseFloat(lastTriggered) || 0;
  const step = parseFloat(interval) || 0;
  const current = parseFloat(currentMeter) || 0;
  if (step <= 0 || current < last + step) return last;
  return last + Math.floor((current - last) / step) * step;
}

/** Calendar services within this many days count as due soon. */
const DUE_SOON_DAYS = 30;
/** Meter services within this share of their interval count as due soon. */
const DUE_SOON_METER_SHARE = 0.1;

const STATE_RANK = { overdue: 0, 'due-soon': 1, ok: 2 };

function planServiceStatus(plan, asset, todayKey) {
  if (plan.triggerType === 'Calendar') {
    const dueKey = toDateKey(plan.nextServiceDate);
    if (!dueKey) return null;
    const days = daysUntil(todayKey, dueKey);
    return { state: days < 0 ? 'overdue' : days <= DUE_SOON_DAYS ? 'due-soon' : 'ok', dueKey, meterTarget: null, plan, sort: days };
  }
  if (plan.triggerType === 'Meter') {
    const interval = parseFloat(plan.meterInterval) || 0;
    if (interval <= 0) return null;
    const target = (parseFloat(plan.lastTriggeredMeter) || 0) + interval;
    const remaining = target - (parseFloat(asset.currentMeter) || 0);
    const state = remaining <= 0 ? 'overdue' : remaining <= interval * DUE_SOON_METER_SHARE ? 'due-soon' : 'ok';
    return { state, dueKey: null, meterTarget: target, plan, sort: remaining / interval * 365 };
  }
  return null;
}

/**
 * When an asset is next due for service, as the asset list and asset page show
 * it. Active maintenance plans decide it — the most urgent one wins. Without a
 * plan it falls back to the asset's service interval counted from its last
 * Service log.
 *
 * @param {object} asset
 * @param {object[]} plans every maintenance plan (filtered to this asset here)
 * @param {string} todayKey YYYY-MM-DD
 * @returns {{ state: 'overdue'|'due-soon'|'ok'|'none'|'retired', source: 'plan'|'interval'|null,
 *   dueKey: string|null, meterTarget: number|null, plan: object|null }}
 */
export function assetServiceStatus(asset, plans, todayKey) {
  const none = { state: 'none', source: null, dueKey: null, meterTarget: null, plan: null };
  if (!asset) return none;
  if (isRetiredAsset(asset)) return { ...none, state: 'retired' };

  const statuses = (plans || [])
    .filter(p => p.assetId === asset.id && p.status === 'Active')
    .map(p => planServiceStatus(p, asset, todayKey))
    .filter(Boolean)
    .sort((a, b) => STATE_RANK[a.state] - STATE_RANK[b.state] || a.sort - b.sort);
  if (statuses.length) {
    const { state, dueKey, meterTarget, plan } = statuses[0];
    return { state, source: 'plan', dueKey, meterTarget, plan };
  }

  const lastService = (asset.logs || [])
    .filter(l => l.type === 'Service' && toDateKey(l.date))
    .map(l => toDateKey(l.date))
    .sort()
    .pop();
  const dueKey = lastService && asset.serviceIntervalMonths ? addMonths(lastService, asset.serviceIntervalMonths) : null;
  if (!dueKey) return none;
  const days = daysUntil(todayKey, dueKey);
  return { state: days < 0 ? 'overdue' : days <= DUE_SOON_DAYS ? 'due-soon' : 'ok', source: 'interval', dueKey, meterTarget: null, plan: null };
}
