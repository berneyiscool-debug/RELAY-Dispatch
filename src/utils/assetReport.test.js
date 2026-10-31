import { test } from 'node:test';
import assert from 'node:assert/strict';
import { buildAssetReport } from './assetReport.js';

const TODAY = '2026-10-31';
const OCT = { start: new Date(2026, 9, 1), end: new Date(2026, 10, 1) };

const assets = [
  { id: 'gen', name: 'Generator', status: 'Active', currentMeter: 990, logs: [
    { date: '2026-10-05', type: 'Service', cost: 400, jobNumber: 'J-1' },
    { date: '2026-10-12', type: 'Repair', cost: 900 },
    { date: '2026-09-20', type: 'Repair', cost: 5000 }, // outside the range
    { date: '2026-10-20', type: 'Refuel', cost: 60 },
  ], compliance: [{ id: 'c', name: 'Test & tag', dueDate: '2026-11-10' }] },
  { id: 'ac', name: 'Split system', status: 'Active', logs: [{ date: '2026-10-02', type: 'Inspection', cost: 120 }] },
  { id: 'old', name: 'Old pump', status: 'Decommissioned', logs: [], compliance: [{ id: 'x', name: 'Check', dueDate: '2026-01-01' }] },
];
const jobs = [
  { id: 'j1', number: 'J-1', assetId: 'gen', status: 'Completed', scheduledDate: '2026-10-05', laborCost: 400, materialCost: 0 }, // already logged
  { id: 'j2', number: 'J-2', assetId: 'ac', status: 'Invoiced', scheduledDate: '2026-10-15', laborCost: 200, materialCost: 50 }, // no log: counts
  { id: 'j3', number: 'J-3', assetId: 'ac', status: 'Scheduled', scheduledDate: '2026-10-25', laborCost: 999 }, // not done
];
const maintenancePlans = [
  { id: 'p1', name: '500 hr service', assetId: 'gen', status: 'Active', triggerType: 'Meter', meterInterval: 500, lastTriggeredMeter: 500 },
  { id: 'p2', name: 'Quarterly', assetId: 'ac', status: 'Active', triggerType: 'Calendar', nextServiceDate: '2026-10-20' },
  { id: 'p3', name: 'Annual', assetId: 'ac', status: 'Active', triggerType: 'Calendar', nextServiceDate: '2027-06-01' },
  { id: 'p4', name: 'Paused', assetId: 'ac', status: 'Paused', triggerType: 'Calendar', nextServiceDate: '2026-10-01' },
  { id: 'p5', name: 'Retired', assetId: 'old', status: 'Active', triggerType: 'Calendar', nextServiceDate: '2026-10-01' },
];

test('spend per asset in the range, by type, without counting a logged job twice', () => {
  const r = buildAssetReport({ assets, maintenancePlans, jobs }, OCT, TODAY);
  const gen = r.rows.find(x => x.asset.id === 'gen');
  assert.deepEqual([gen.Service, gen.Repair, gen.Other, gen.total], [400, 900, 60, 1360]);
  const ac = r.rows.find(x => x.asset.id === 'ac');
  assert.deepEqual([ac.Inspection, ac.Service, ac.total], [120, 250, 370]);
  assert.equal(r.rows[0].asset.id, 'gen');
  assert.deepEqual(r.byType, { Service: 650, Repair: 900, Inspection: 120, Other: 60 });
  assert.equal(r.total, 1730);
  assert.equal(Math.round(r.repairShare * 1000) / 1000, 0.52);
});

test('no range counts every log', () => {
  const r = buildAssetReport({ assets, maintenancePlans, jobs }, null, TODAY);
  assert.equal(r.byType.Repair, 5900);
});

test('plans coming due: overdue first, then due soon; paused, distant and retired left out', () => {
  const r = buildAssetReport({ assets, maintenancePlans, jobs }, OCT, TODAY);
  assert.deepEqual(r.plansDue.map(p => [p.plan.id, p.state]), [['p2', 'overdue'], ['p1', 'due-soon']]);
  assert.equal(r.plansDue[1].meterTarget, 1000);
});

test('compliance coming due skips retired assets', () => {
  const r = buildAssetReport({ assets, maintenancePlans, jobs }, OCT, TODAY);
  assert.deepEqual(r.complianceDue.map(c => [c.asset.id, c.item.name, c.state]), [['gen', 'Test & tag', 'due-soon']]);
});

test('an empty business reports nothing', () => {
  const r = buildAssetReport({}, OCT, TODAY);
  assert.deepEqual([r.rows.length, r.total, r.repairShare, r.plansDue.length], [0, 0, null, 0]);
});
