// ============================================
// RELAY — ASSET REPORT FIGURES
// ============================================
// The numbers behind the Asset Maintenance report, on screen and in the PDF:
// what each asset cost to look after in the report's date range, how that
// spend splits between servicing, repairs and inspections, and which plans
// and compliance checks are coming due. Pure: records and a range in,
// figures out.

import { toDateKey } from './dateUtils.js';
import { isRetiredAsset, planServiceStatus } from './maintenanceSchedule.js';
import { complianceItems } from './assetCompliance.js';
import { jobActivityDate } from './assetJobs.js';

export const SPEND_TYPES = ['Service', 'Repair', 'Inspection', 'Other'];
const DONE_JOB = ['Completed', 'Invoiced'];

const num = (v) => { const n = parseFloat(v); return Number.isFinite(n) ? n : 0; };
const spendType = (logType) => (SPEND_TYPES.includes(logType) ? logType : 'Other');

function keyInRange(key, range) {
  if (!key || !range) return !!key;
  const [y, m, d] = key.split('-').map(Number);
  const at = new Date(y, m - 1, d);
  return at >= range.start && at < range.end;
}

/**
 * @param {{assets?: object[], maintenancePlans?: object[], jobs?: object[]}} data
 * @param {{start: Date, end: Date}|null} range spend is counted inside it; null counts everything
 * @param {string} todayKey YYYY-MM-DD, for what's coming due
 */
export function buildAssetReport({ assets = [], maintenancePlans = [], jobs = [] } = {}, range, todayKey) {
  const byType = Object.fromEntries(SPEND_TYPES.map(t => [t, 0]));

  // Spend: every log with a cost, by its type. A completed job on the asset
  // that never wrote a completion log (finished before the asset was linked,
  // or before logs were kept) counts as servicing at its job cost.
  const rows = assets.map(asset => {
    const row = { asset, Service: 0, Repair: 0, Inspection: 0, Other: 0, total: 0, actions: 0 };
    const loggedJobs = new Set();
    (asset.logs || []).forEach(log => {
      if (log.jobNumber) loggedJobs.add(String(log.jobNumber));
      if (!keyInRange(toDateKey(log.date), range)) return;
      const type = spendType(log.type);
      row[type] += num(log.cost);
      row.actions += 1;
    });
    jobs
      .filter(j => j.assetId === asset.id && DONE_JOB.includes(j.status) && !loggedJobs.has(String(j.number)))
      .forEach(j => {
        const at = jobActivityDate(j);
        if (!at || !keyInRange(toDateKey(new Date(at)), range)) return;
        row.Service += num(j.laborCost) + num(j.materialCost);
        row.actions += 1;
      });
    row.total = SPEND_TYPES.reduce((s, t) => s + row[t], 0);
    SPEND_TYPES.forEach(t => { byType[t] += row[t]; });
    return row;
  }).sort((a, b) => b.total - a.total);

  const total = SPEND_TYPES.reduce((s, t) => s + byType[t], 0);
  const planned = byType.Service + byType.Inspection;

  // Coming due: active plans on in-service assets that are overdue or due
  // soon, by the same rule as the asset list.
  const assetById = new Map(assets.map(a => [a.id, a]));
  const rank = { overdue: 0, 'due-soon': 1, ok: 2 };
  const plansDue = maintenancePlans
    .filter(p => p.status === 'Active')
    .map(plan => {
      const asset = assetById.get(plan.assetId);
      if (!asset || isRetiredAsset(asset)) return null;
      const status = planServiceStatus(plan, asset, todayKey);
      return status && status.state !== 'ok' ? { plan, asset, ...status } : null;
    })
    .filter(Boolean)
    .sort((a, b) => rank[a.state] - rank[b.state] || a.sort - b.sort);

  const complianceDue = assets
    .filter(a => !isRetiredAsset(a))
    .flatMap(asset => complianceItems(asset, todayKey)
      .filter(c => c.state === 'overdue' || c.state === 'due-soon')
      .map(c => ({ asset, ...c })))
    .sort((a, b) => rank[a.state] - rank[b.state] || String(a.dueKey).localeCompare(String(b.dueKey)));

  return {
    rows,
    byType,
    total,
    // Share of spend that went on breakdowns rather than planned work.
    repairShare: total > 0 ? byType.Repair / total : null,
    plannedShare: total > 0 ? planned / total : null,
    plansDue,
    complianceDue,
  };
}
