import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { buildDemoDataset } from '../data/demoDataset.js';
import { computeAll, periodRanges } from './kpis.js';
import { buildReport, emptyFilters, scopeInvoice, monthsIn, reportRange, csvCell, toCsv } from './reportMetrics.js';

const close = (actual, expected, msg) => assert.ok(Math.abs(actual - expected) < 0.01, `${msg}: ${actual} ≠ ${expected}`);
const now = new Date(2026, 9, 8, 10, 0);
const filters = (f = {}) => ({ ...emptyFilters(), ...f });
const iso = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

// Two techs, two jobs. Job 1 is shared by both techs; job 2 is Bo's alone. One
// combined invoice bills both jobs (600 + 400 ex GST), half paid.
function fixture() {
  return {
    technicians: [
      { id: 't1', name: 'Ana', role: 'Electrician', payRate: 50 },
      { id: 't2', name: 'Bo', role: 'Electrician', payRate: 40 },
    ],
    customers: [{ id: 'c1', company: 'Acme', status: 'Active', createdAt: '2026-09-01' }],
    assets: [{ id: 'a1', type: 'Switchboard', customerId: 'c1' }],
    jobs: [
      { id: 'j1', customerId: 'c1', status: 'Invoiced', technicianId: 't1', technicians: [{ id: 't1' }, { id: 't2' }], assetId: 'a1', createdAt: '2026-10-01', completedAt: '2026-10-03', materialCost: 100 },
      { id: 'j2', customerId: 'c1', status: 'Invoiced', technicianId: 't2', createdAt: '2026-10-02', completedAt: '2026-10-04' },
    ],
    invoices: [
      { id: 'i1', customerId: 'c1', customerName: 'Acme', status: 'Partially Paid', issueDate: '2026-10-05',
        jobIds: ['j1', 'j2'], jobAmounts: [{ jobId: 'j1', amount: 600 }, { jobId: 'j2', amount: 400 }],
        subtotal: 1000, total: 1100, payments: [{ amount: 550, date: '2026-10-06' }] },
    ],
    timesheets: [
      { id: 's1', technicianId: 't1', jobId: 'j1', date: '2026-10-03', hours: 4 },
      { id: 's2', technicianId: 't2', jobId: 'j1', date: '2026-10-03', hours: 2, payRate: 45 },
      { id: 's3', technicianId: 't2', jobId: 'j2', date: '2026-10-04', hours: 3 },
      { id: 's4', technicianId: 't2', date: '2026-10-04', hours: 1 },
    ],
    schedule: [], quotes: [], leads: [], jobMaterials: [], purchaseOrders: [], stock: [], maintenancePlans: [],
  };
}

describe('money matches the dashboard conventions', () => {
  const r = buildReport(fixture(), filters({ start: '2026-10-01', end: '2026-10-31' }), { now });

  test('revenue is invoiced and ex GST', () => {
    assert.equal(r.money.revenue, 1000);
  });
  test('outstanding counts part-payments, ex GST', () => {
    close(r.money.outstanding, 500, 'outstanding');
    close(r.money.received, 500, 'received');
  });
});

describe('profit', () => {
  const r = buildReport(fixture(), filters({ start: '2026-10-01', end: '2026-10-31' }), { now });

  test('gross profit subtracts labour as well as materials', () => {
    // Labour: 4h × 50 + 2h × 45 (the timesheet's own rate) + 3h × 40 = 410. Materials: 100.
    close(r.profit.labour, 410, 'labour');
    close(r.profit.materials, 100, 'materials');
    close(r.profit.profit, 1000 - 510, 'profit');
    close(r.profit.margin, 0.49, 'margin');
  });
  test('each invoiced job has its own row', () => {
    const j1 = r.profit.jobs.find(j => j.jobId === 'j1');
    close(j1.revenue, 600, 'j1 revenue');
    close(j1.cost, 200 + 90 + 100, 'j1 cost');
    assert.equal(j1.hours, 6);
  });
  test('a job with time but no pay rate is left out, not costed at zero', () => {
    const data = fixture();
    data.technicians[1].payRate = 0;
    const p = buildReport(data, filters({ start: '2026-10-01', end: '2026-10-31' }), { now }).profit;
    assert.equal(p.jobsKnown, 1); // j1 still has s2's own rate; j2 has none
    assert.equal(p.jobs.find(j => j.jobId === 'j2').reason, 'no-pay-rate');
  });
});

describe('filters', () => {
  test('a technician filter counts only their jobs’ share of a combined invoice', () => {
    const r = buildReport(fixture(), filters({ start: '2026-10-01', end: '2026-10-31', technicianId: 't2' }), { now });
    assert.equal(r.money.revenue, 1000); // Bo is on both jobs
    const ana = buildReport(fixture(), filters({ start: '2026-10-01', end: '2026-10-31', technicianId: 't1' }), { now });
    close(ana.money.revenue, 600, 'only j1');
    close(ana.money.outstanding, 300, 'j1’s share of the balance');
  });
  test('an asset-type filter keeps jobs on that kind of asset', () => {
    const r = buildReport(fixture(), filters({ start: '2026-10-01', end: '2026-10-31', assetType: 'Switchboard' }), { now });
    assert.deepEqual(r.scoped.jobs.map(j => j.id), ['j1']);
    close(r.money.revenue, 600, 'j1 only');
  });
  test('scopeInvoice leaves an invoice alone when every job matches', () => {
    const inv = fixture().invoices[0];
    assert.equal(scopeInvoice(inv, new Set(['j1', 'j2'])), inv);
    assert.equal(scopeInvoice(inv, new Set(['j9'])), null);
  });
  test('jobs are dated by completion, not creation', () => {
    const r = buildReport(fixture(), filters({ start: '2026-10-04', end: '2026-10-31' }), { now });
    assert.deepEqual(r.jobs.completed.map(j => j.id), ['j2']);
  });
});

describe('team', () => {
  const r = buildReport(fixture(), filters({ start: '2026-10-01', end: '2026-10-31' }), { now });
  const ana = r.team.find(t => t.id === 't1');
  const bo = r.team.find(t => t.id === 't2');

  test('a shared job’s invoice is split between the people on it', () => {
    close(ana.invoiced, 300, 'Ana: half of j1');
    close(bo.invoiced, 700, 'Bo: half of j1 + all of j2');
    close(ana.invoiced + bo.invoiced, r.money.revenue, 'adds up to revenue');
  });
  test('labour cost per person adds up to the total', () => {
    close(bo.labourCost, 2 * 45 + 3 * 40 + 1 * 40, 'Bo');
    close(r.labour.cost, ana.labourCost + bo.labourCost, 'total = sum of rows');
    close(r.labour.billableShare, 9 / 10, 'billable share');
  });
});

describe('customers', () => {
  test('repeat means invoiced more than once, before or within the range', () => {
    const data = fixture();
    data.customers.push({ id: 'c2', company: 'Bolt', status: 'Active' });
    data.invoices.push(
      { id: 'i4', customerId: 'c1', status: 'Sent', issueDate: '2026-10-07', subtotal: 10, total: 11 },
      { id: 'i5', customerId: 'c2', status: 'Sent', issueDate: '2026-10-07', subtotal: 10, total: 11 },
    );
    const all = buildReport(data, filters(), { now });
    assert.equal(all.customers.invoiced, 2);
    assert.equal(all.customers.repeat, 1); // Acme twice in range; Bolt once
    const late = buildReport(data, filters({ start: '2026-10-06', end: '2026-10-31' }), { now });
    assert.equal(late.customers.repeat, 1); // Acme once in range, but also before it
  });
});

describe('months', () => {
  test('are in date order whatever order invoices arrive in', () => {
    const data = fixture();
    data.invoices.push(
      { id: 'i3', status: 'Sent', issueDate: '2026-08-10', subtotal: 50, total: 55 },
      { id: 'i2', status: 'Sent', issueDate: '2026-09-10', subtotal: 70, total: 77 },
    );
    const r = buildReport(data, filters({ start: '2026-08-01', end: '2026-10-31' }), { now });
    assert.deepEqual(r.monthly.map(m => m.key), ['2026-08', '2026-09', '2026-10']);
    assert.deepEqual(r.monthly.map(m => m.revenue), [50, 70, 1000]);
  });
  test('are clipped to the range', () => {
    const m = monthsIn({ start: new Date(2026, 8, 15), end: new Date(2026, 9, 3) });
    assert.equal(m.length, 2);
    assert.equal(m[0].range.start.getDate(), 15);
    assert.equal(m[1].range.end.getDate(), 3);
  });
  test('all time starts at the first record', () => {
    const r = reportRange(emptyFilters(), fixture(), now);
    assert.equal(iso(r.start), '2026-09-01');
  });
});

describe('Reports agree with the dashboard on the demo dataset', () => {
  const data = buildDemoDataset({ now }).collections;
  const { range } = periodRanges('month', now);
  const r = buildReport(data, filters({ start: iso(range.start), end: iso(now) }), { now });
  const k = computeAll(['revenue_invoiced', 'payments_received', 'outstanding', 'gross_margin', 'gross_profit', 'quote_win_rate'], data, { period: 'month', now });

  test('money', () => {
    close(r.money.revenue, k.revenue_invoiced.value, 'revenue');
    close(r.money.received, k.payments_received.value, 'received');
    close(r.money.outstanding, k.outstanding.value, 'outstanding');
  });
  test('profit', () => {
    close(r.profit.profit, k.gross_profit.value, 'gross profit');
    close(r.profit.margin, k.gross_margin.value, 'gross margin');
  });
  test('sales', () => {
    assert.equal(r.sales.winRate, k.quote_win_rate.value);
  });
});

describe('CSV', () => {
  test('quotes and commas are escaped', () => {
    assert.equal(csvCell('Smith, "Bob"'), '"Smith, ""Bob"""');
    assert.equal(csvCell('plain'), 'plain');
  });
  test('formula-looking text is neutralised', () => {
    assert.equal(csvCell('=HYPERLINK("x")'), '"\'=HYPERLINK(""x"")"');
    assert.equal(csvCell('+61 400'), "'+61 400");
  });
  test('numbers stay numbers and missing values are blank', () => {
    assert.equal(csvCell(-12.346), '-12.35');
    assert.equal(csvCell(0), '0');
    assert.equal(csvCell(null), '');
    assert.equal(toCsv(['a', 'b'], [[1, 'x']]), 'a,b\r\n1,x\r\n');
  });
});
