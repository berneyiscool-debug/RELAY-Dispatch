import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { buildDemoDataset } from '../data/demoDataset.js';
import {
  KPIS, KPI_IDS, KPI_GROUPS, filterContext, linkFilter, linkCollection, computeAll,
  invoicePaidAt, isCallbackJob, leadClosedAt, periodRanges, defaultKpiIds, kpiNeeds,
  invoiceBalance, exGst, jobCompletedAt, quoteOutcome,
  formatKpiValue, formatKpiDelta, formatCurrency, kpiSubline,
} from './kpis.js';

const close = (actual, expected, msg) => assert.ok(Math.abs(actual - expected) < 0.01, `${msg}: ${actual} ≠ ${expected}`);
const run = (ids, data, opts) => computeAll([].concat(ids), data, opts);

// ── Demo dataset: fixed expected numbers ─────────────────────────────────────
// Thursday 8 October 2026, 10am. The demo builder is deterministic for a given
// `now`, so these numbers only move when a formula or the dataset changes.
describe('launch cards against the demo dataset', () => {
  const now = new Date(2026, 9, 8, 10, 0);
  const data = buildDemoDataset({ now }).collections;
  const month = computeAll(KPI_IDS, data, { period: 'month', now });
  const week = computeAll(KPI_IDS, data, { period: 'week', now });

  const expected = {
    //                     month value, previous month to date, this week
    revenue_invoiced:    [18252.8,  40142,   5127.8],
    payments_received:   [19416.7,  43621.9, 7520.7],
    outstanding:         [26242.6,  null,    26242.6],
    overdue:             [3376.9,   null,    3376.9],
    ready_to_invoice:    [4,        null,    4],
    active_jobs:         [41,       null,    41],
    jobs_completed:      [33,       50,      13],
    scheduled_today:     [8,        null,    8],
    unscheduled_backlog: [6,        null,    6],
    new_leads:           [7,        2,       3],
    quotes_sent:         [5,        4,       2],
    quote_win_rate:      [1,        1,       1],
    open_pipeline:       [21338.2,  null,    21338.2],
    utilisation:         [0.4323,   0.4696,  0.4135],
    gross_margin:        [0.6016,   0.6047,  0.6072],
    // Beyond the launch set
    average_invoice_value: [570.4,    771.9615, 569.7556],
    average_days_to_pay:   [7.3411,   8.2774,   12.7292],
    average_job_duration:  [0.0915,   0.0942,   0.0954],
    days_to_accept:        [4.0708,   5.6729,   4.0708],
    lead_conversion:       [1,        1,        1],
    hours_logged:          [97,       135.25,   45.5],
    billable_hours:        [1,        1,        1],
    jobs_per_tech:         [6.6,      10,       3.25],
    pending_timesheets:    [19,       null,     19],
    gross_profit:          [10980.37, 24272.04, 3113.75],
    labour_vs_materials:   [0.661,    0.5634,   0.6887],
    average_job_profit:    [343.1366, 466.77,   345.9722],
    new_customers:         [4,        1,        3],
    repeat_customers:      [1,        0.9762,   1],
    maintenance_due:       [1,        null,     1],
    top_customer_share:    [0.1285,   0.1502,   0.2018],
  };

  test('callback rate waits for a flagged callback (the demo has none)', () => {
    assert.equal(month.callback_rate.empty, true);
  });

  for (const [id, [v, prev, wk]] of Object.entries(expected)) {
    test(id, () => {
      assert.equal(month[id].empty, false);
      close(month[id].value, v, `${id} month`);
      if (prev == null) assert.equal(month[id].prev, null);
      else close(month[id].prev, prev, `${id} previous`);
      close(week[id].value, wk, `${id} week`);
    });
  }

  test('sub-lines carry the counts behind the value', () => {
    assert.equal(kpiSubline('overdue', month.overdue), '6 invoices');
    assert.equal(kpiSubline('outstanding', month.outstanding), '45 invoices');
    assert.equal(kpiSubline('scheduled_today', month.scheduled_today), '5 still to start');
    assert.equal(kpiSubline('quotes_sent', month.quotes_sent), '$25.6k quoted');
    assert.equal(kpiSubline('gross_margin', month.gross_margin), ''); // every job costed
  });

  test('tapping a card lists exactly the records behind its number', () => {
    const ctx = filterContext('month', now);
    const listed = (id) => data[linkCollection(KPIS[id].link)].filter(linkFilter(KPIS[id].link).build(data, ctx));
    assert.equal(listed('overdue').length, month.overdue.extra.count);
    assert.equal(listed('outstanding').length, month.outstanding.extra.count);
    assert.equal(listed('revenue_invoiced').length, month.revenue_invoiced.extra.count);
    assert.equal(listed('quote_win_rate').length, month.quote_win_rate.extra.count);
    assert.equal(listed('open_pipeline').length, month.open_pipeline.extra.count);
    for (const id of ['ready_to_invoice', 'active_jobs', 'jobs_completed', 'unscheduled_backlog', 'new_leads', 'quotes_sent', 'pending_timesheets', 'new_customers']) {
      assert.equal(listed(id).length, month[id].value, id);
    }
    for (const id of ['average_invoice_value', 'average_days_to_pay', 'days_to_accept', 'lead_conversion', 'repeat_customers']) {
      assert.equal(listed(id).length, month[id].extra.count, id);
    }
  });

  test('every card is defined and covered here', () => {
    assert.equal(KPI_IDS.length, 32);
    assert.equal(KPI_IDS.filter(id => KPIS[id].launch).length, 15);
    assert.deepEqual([...KPI_IDS].sort(), [...Object.keys(expected), 'callback_rate'].sort());
  });
});

// ── Definitions ──────────────────────────────────────────────────────────────

describe('definitions', () => {
  test('every card has the fields the dashboard draws from', () => {
    const groups = new Set(KPI_GROUPS.map(g => g.id));
    for (const id of KPI_IDS) {
      const d = KPIS[id];
      assert.ok(groups.has(d.group), `${id} group`);
      assert.ok(['period', 'snapshot'].includes(d.type), `${id} type`);
      assert.ok(['currency', 'count', 'percent', 'days', 'duration', 'hours', 'decimal'].includes(d.format), `${id} format`);
      assert.ok(typeof d.upIsGood === 'boolean' || d.upIsGood === null, `${id} upIsGood`);
      assert.ok(d.label && d.description && d.empty, `${id} copy`);
      assert.ok(Array.isArray(d.needs) && d.needs.length, `${id} needs`);
      assert.ok(d.link && d.link.route.startsWith('/'), `${id} link`);
      if (d.link.filter) {
        const f = linkFilter(d.link);
        // The page loads the filter's collections itself; the card must read them too.
        if (f) f.needs.forEach(c => assert.ok(d.needs.includes(c) || c === linkCollection(d.link), `${id} needs ${c}`));
        assert.ok(f, `${id} links to a filter its list understands`);
        // A period card's list must follow the period too, or the counts disagree.
        assert.equal(f.periodic, d.type === 'period', `${id} filter periodicity`);
      }
    }
  });

  test('default layouts use launch cards only, six each', () => {
    for (const n of [1, 4, 25]) {
      const ids = defaultKpiIds(n);
      assert.equal(ids.length, 6);
      ids.forEach(id => assert.ok(KPIS[id] && KPIS[id].launch, `${id} for ${n}`));
    }
    assert.equal(defaultKpiIds(1)[0], 'ready_to_invoice');
    assert.equal(defaultKpiIds(25)[1], 'gross_margin');
  });

  test('kpiNeeds loads each collection once', () => {
    assert.deepEqual(kpiNeeds(['overdue', 'outstanding', 'ready_to_invoice']).sort(), ['invoices', 'jobs', 'quotes']);
  });
});

// ── Periods ──────────────────────────────────────────────────────────────────

describe('periodRanges', () => {
  const now = new Date(2026, 9, 8, 10, 0); // Thu 8 Oct 2026

  test('month to date compares with the same days last month', () => {
    const r = periodRanges('month', now);
    assert.deepEqual(r.range.start, new Date(2026, 9, 1));
    assert.deepEqual(r.range.end, new Date(2026, 9, 9));
    assert.deepEqual(r.full.end, new Date(2026, 10, 1));
    assert.deepEqual(r.prev.range.start, new Date(2026, 8, 1));
    assert.deepEqual(r.prev.range.end, new Date(2026, 8, 9));
  });

  test('weeks start on Monday', () => {
    const r = periodRanges('week', now);
    assert.deepEqual(r.range.start, new Date(2026, 9, 5));
    assert.deepEqual(r.prev.range.start, new Date(2026, 8, 28));
  });

  test('financial year runs July to June', () => {
    assert.deepEqual(periodRanges('fy', now).range.start, new Date(2026, 6, 1));
    assert.deepEqual(periodRanges('fy', new Date(2026, 2, 3)).range.start, new Date(2025, 6, 1));
  });

  test('the previous window never runs past the previous period', () => {
    // 31 March: "same days of February" stops at the end of February.
    const r = periodRanges('month', new Date(2026, 2, 31, 12));
    assert.deepEqual(r.prev.range.end, new Date(2026, 2, 1));
  });
});

// ── Money rules ──────────────────────────────────────────────────────────────

describe('money', () => {
  const now = new Date(2026, 9, 8, 10, 0);
  const inv = (o) => ({ status: 'Sent', subtotal: 1000, tax: 100, total: 1100, issueDate: '2026-10-02', dueDate: '2026-10-30', ...o });

  test('balances net off part payments and ignore drafts and voids', () => {
    assert.equal(invoiceBalance(inv({ payments: [{ amount: 400, date: '2026-10-03' }] })), 700);
    assert.equal(invoiceBalance(inv({ status: 'Paid' })), 0);
    assert.equal(invoiceBalance(inv({ status: 'Draft' })), 0);
    assert.equal(invoiceBalance(inv({ status: 'Void' })), 0);
  });

  test('amounts are reported ex GST', () => {
    assert.equal(exGst(inv({}), 1100), 1000);
    const r = run(['outstanding', 'payments_received', 'revenue_invoiced'], {
      invoices: [inv({ payments: [{ amount: 550, date: '2026-10-05' }] }), inv({ status: 'Draft', subtotal: 9999, total: 9999 })],
    }, { now });
    assert.equal(r.outstanding.value, 500);
    assert.equal(r.payments_received.value, 500);
    assert.equal(r.revenue_invoiced.value, 1000);
  });

  test('a Paid invoice without payment records counts once on its paid date', () => {
    const r = run('payments_received', { invoices: [inv({ status: 'Paid', paidDate: '2026-10-06' })] }, { now });
    assert.equal(r.payments_received.value, 1000);
  });

  test('overdue is by due date, not the status label', () => {
    const r = run('overdue', { invoices: [inv({ dueDate: '2026-10-01' }), inv({ status: 'Overdue', dueDate: '2026-10-01', payments: [{ amount: 1100 }] })] }, { now });
    assert.equal(r.overdue.value, 1000);
    assert.equal(r.overdue.extra.count, 1);
  });

  test('ready to invoice skips jobs on a combined invoice', () => {
    const data = {
      jobs: [{ id: 'a', status: 'Completed' }, { id: 'b', status: 'Completed' }, { id: 'c', status: 'Completed', quoteId: 'q1' }],
      invoices: [inv({ jobId: null, jobIds: ['a', 'b'] })],
      quotes: [{ id: 'q1', subtotal: 2500 }],
    };
    const r = run('ready_to_invoice', data, { now });
    assert.equal(r.ready_to_invoice.value, 1);
    assert.equal(r.ready_to_invoice.extra.estimate, 2500);
  });
});

// ── Jobs and quotes ──────────────────────────────────────────────────────────

describe('jobs and quotes', () => {
  const now = new Date(2026, 9, 8, 10, 0);

  test('job completion falls back to the last completed task, then the last booking', () => {
    assert.equal(jobCompletedAt({ completedAt: '2026-10-01T00:00:00Z' }), '2026-10-01T00:00:00Z');
    assert.equal(jobCompletedAt({ tasks: [{ completedAt: '2026-09-01T00:00:00Z', subTasks: [{ completedAt: '2026-09-03T00:00:00Z' }] }] }), '2026-09-03T00:00:00Z');
    assert.equal(jobCompletedAt({ id: 7, updatedAt: 'x' }, new Map([['7', '2026-09-09']])), '2026-09-09');
  });

  test('templates never count as jobs', () => {
    const r = run('active_jobs', { jobs: [{ status: 'Scheduled' }, { status: 'Scheduled', isRecurring: true }, { status: 'Recurring Template' }] }, { now });
    assert.equal(r.active_jobs.value, 1);
  });

  test('unscheduled backlog ignores jobs booked today or later', () => {
    const r = run('unscheduled_backlog', {
      jobs: [{ id: 1, status: 'Pending' }, { id: 2, status: 'Pending' }, { id: 3, status: 'Completed' }],
      schedule: [{ jobId: 2, date: '2026-10-08' }, { jobId: 1, date: '2026-10-01' }],
    }, { now });
    assert.equal(r.unscheduled_backlog.value, 1);
  });

  test('an open quote past valid-until is lost on that date', () => {
    const today = new Date(2026, 9, 8);
    assert.deepEqual(quoteOutcome({ status: 'Sent', validUntil: '2026-10-03' }, today), { outcome: 'lost', at: '2026-10-03' });
    assert.equal(quoteOutcome({ status: 'Sent', validUntil: '2026-10-30' }, today).outcome, null);
    assert.equal(quoteOutcome({ status: 'Converted', signedAt: '2026-10-02' }, today).outcome, 'won');
  });

  test('win rate counts Converted as won, over decided quotes', () => {
    const quotes = [
      { status: 'Converted', sentAt: '2026-09-20', signedAt: '2026-10-02' },
      { status: 'Accepted', sentAt: '2026-09-20', acceptedAt: '2026-10-03' },
      { status: 'Declined', sentAt: '2026-09-20', declinedAt: '2026-10-04' },
      { status: 'Sent', sentAt: '2026-09-01', validUntil: '2026-10-05' },
      { status: 'Sent', sentAt: '2026-10-01', validUntil: '2026-11-05', subtotal: 800 },
    ];
    const r = run(['quote_win_rate', 'open_pipeline'], { quotes }, { now });
    assert.equal(r.quote_win_rate.value, 0.5);
    assert.equal(r.open_pipeline.value, 800);
  });

  test('a rate with nothing to measure is "—", never 0%', () => {
    const r = run('quote_win_rate', { quotes: [{ status: 'Sent', sentAt: '2026-10-01', validUntil: '2026-11-01' }] }, { now });
    assert.equal(r.quote_win_rate.empty, false);
    assert.equal(r.quote_win_rate.value, null);
    assert.equal(formatKpiValue(r.quote_win_rate.value, 'percent'), '—');
  });
});

// ── Team and profitability ───────────────────────────────────────────────────

describe('team and profitability', () => {
  const now = new Date(2026, 9, 8, 10, 0); // week of Mon 5 Oct

  test('utilisation subtracts leave from available hours', () => {
    const r = run('utilisation', {
      technicians: [{ id: 't1' }],
      schedule: [
        { jobId: 'j', technicianId: 't1', date: '2026-10-05', hours: 8 },
        { jobId: 'j', technicianId: 't1', date: '2026-10-06', hours: 8 },
        { technicianId: 't1', date: '2026-10-09', hours: 8, type: 'Leave' },
      ],
    }, { period: 'week', now });
    assert.equal(r.utilisation.value, 16 / 32); // 5 days × 8h − 8h leave
  });

  test('margin leaves out jobs with no costing and says so', () => {
    const data = {
      technicians: [{ id: 't1', payRate: 50 }, { id: 't2' }],
      jobs: [{ id: 'a' }, { id: 'b' }, { id: 'c' }],
      timesheets: [{ jobId: 'a', technicianId: 't1', hours: 4 }, { jobId: 'c', technicianId: 't2', hours: 2 }],
      jobMaterials: [{ jobId: 'a', totalCost: 100 }],
      invoices: [
        { status: 'Sent', jobId: 'a', subtotal: 1000, total: 1100, issueDate: '2026-10-02' },
        { status: 'Sent', jobId: 'b', subtotal: 500, total: 550, issueDate: '2026-10-02' },
        { status: 'Sent', jobId: 'c', subtotal: 500, total: 550, issueDate: '2026-10-02' },
      ],
    };
    const r = run('gross_margin', data, { now });
    assert.equal(r.gross_margin.value, 0.7); // (1000 − 300) ÷ 1000; b uncosted, c has no pay rate
    assert.equal(kpiSubline('gross_margin', r.gross_margin), 'based on 1 of 3 jobs');
  });

  test('a job invoiced in two parts carries its cost in proportion', () => {
    const data = {
      technicians: [{ id: 't1', payRate: 100 }],
      jobs: [{ id: 'a' }],
      timesheets: [{ jobId: 'a', technicianId: 't1', hours: 10 }], // $1,000 cost
      invoices: [
        { status: 'Paid', jobId: 'a', subtotal: 1500, total: 1650, issueDate: '2026-09-15' },
        { status: 'Sent', jobId: 'a', subtotal: 500, total: 550, issueDate: '2026-10-02' },
      ],
    };
    const r = run('gross_margin', data, { now });
    close(r.gross_margin.value, (500 - 250) / 500, 'second invoice carries a quarter of the cost');
  });
});

// ── Empty states, deltas, formatting ─────────────────────────────────────────

describe('presentation', () => {
  test('a business with no records gets hints, not zeros', () => {
    const r = computeAll(KPI_IDS, {}, { now: new Date(2026, 9, 8) });
    for (const id of KPI_IDS) assert.equal(r[id].empty, true, id);
  });

  test('snapshot cards have no delta; period cards colour by direction', () => {
    const now = new Date(2026, 9, 8, 10);
    const invoices = [
      { status: 'Sent', subtotal: 2000, total: 2200, issueDate: '2026-10-02', dueDate: '2026-09-01' },
      { status: 'Sent', subtotal: 1000, total: 1100, issueDate: '2026-09-02' },
    ];
    const r = run(['revenue_invoiced', 'overdue'], { invoices }, { now });
    assert.equal(r.revenue_invoiced.delta, 1);
    assert.equal(r.revenue_invoiced.good, true);
    assert.equal(r.overdue.delta, null);
  });

  test('formatting', () => {
    assert.equal(formatCurrency(9876.4), '$9,876');
    assert.equal(formatCurrency(12400), '$12.4k');
    assert.equal(formatCurrency(368000), '$368k');
    assert.equal(formatCurrency(1250000), '$1.3M');
    assert.equal(formatKpiValue(0.4323, 'percent'), '43%');
    assert.equal(formatKpiValue(41, 'count'), '41');
    assert.equal(formatKpiDelta(0.125, 'currency'), '+13%');
    assert.equal(formatKpiDelta(-0.03, 'percent'), '−3 pts');
    assert.equal(formatKpiDelta(-0.001, 'currency'), '0%');
  });
});

// ── Cards beyond the launch set ──────────────────────────────────────────────

describe('extended cards', () => {
  const now = new Date(2026, 9, 8, 10, 0); // Thu 8 Oct 2026

  test('an invoice is paid off on its paid date, or its last payment once nothing is owed', () => {
    assert.equal(invoicePaidAt({ status: 'Paid', total: 100, paidDate: '2026-10-03' }), '2026-10-03');
    const full = invoicePaidAt({ status: 'Sent', total: 100, payments: [{ amount: 40, date: '2026-10-01' }, { amount: 60, date: '2026-10-04' }] });
    assert.deepEqual(full, new Date(2026, 9, 4));
    assert.equal(invoicePaidAt({ status: 'Sent', total: 100, payments: [{ amount: 40, date: '2026-10-01' }] }), null);
    assert.equal(invoicePaidAt({ status: 'Void', total: 100, paidDate: '2026-10-03' }), null);
  });

  test('average days to pay measures issue to paid off', () => {
    const r = run('average_days_to_pay', { invoices: [
      { status: 'Paid', total: 110, subtotal: 100, issueDate: '2026-09-25', paidDate: '2026-10-05' },
      { status: 'Paid', total: 110, subtotal: 100, issueDate: '2026-10-01', paidDate: '2026-10-03' },
    ] }, { now });
    assert.equal(r.average_days_to_pay.value, 6);
    assert.equal(formatKpiValue(r.average_days_to_pay.value, 'days'), '6 days');
  });

  test('callbacks come from the flag or a callback job type', () => {
    assert.ok(isCallbackJob({ isCallback: true }));
    assert.ok(isCallbackJob({ type: 'Warranty callback' }));
    assert.ok(!isCallbackJob({ type: 'Installation' }));
    const jobs = [
      { id: 1, status: 'Completed', completedAt: '2026-10-02', isCallback: true },
      { id: 2, status: 'Completed', completedAt: '2026-10-03' },
      { id: 3, status: 'Invoiced', completedAt: '2026-10-04' },
      { id: 4, status: 'Invoiced', completedAt: '2026-10-05' },
    ];
    const r = run('callback_rate', { jobs, schedule: [] }, { now });
    assert.equal(r.callback_rate.value, 0.25);
    assert.equal(kpiSubline('callback_rate', r.callback_rate), '1 callback');
  });

  test('days to accept is the median, so one slow quote does not skew it', () => {
    const q = (sent, acc) => ({ status: 'Accepted', sentAt: sent, acceptedAt: acc });
    const r = run('days_to_accept', { quotes: [q('2026-10-01', '2026-10-02'), q('2026-10-01', '2026-10-04'), q('2026-06-01', '2026-10-05')] }, { now });
    assert.equal(r.days_to_accept.value, 3);
  });

  test('lead conversion uses the date the stage history closed the lead', () => {
    const lead = (status, at) => ({ status, stageHistory: [{ status, timestamp: at }, { status: 'Proposal', timestamp: '2026-08-01' }] });
    assert.equal(leadClosedAt(lead('Won', '2026-10-02T01:00:00Z')), '2026-10-02T01:00:00Z');
    assert.equal(leadClosedAt({ status: 'Qualified' }), null);
    const r = run('lead_conversion', { leads: [lead('Won', '2026-10-02'), lead('Lost', '2026-10-03'), lead('Lost', '2026-10-04'), lead('Won', '2026-08-04')] }, { now });
    assert.equal(r.lead_conversion.value, 1 / 3);
  });

  test('timesheet cards: hours, billable share and pending approvals', () => {
    const timesheets = [
      { jobId: 'a', technicianId: 't1', date: '2026-10-05', hours: 6, status: 'Approved' },
      { technicianId: 't1', date: '2026-10-06', hours: 2, status: 'Pending' },
      { jobId: 'b', technicianId: 't2', date: '2026-09-02', hours: 8, status: 'Pending' },
    ];
    const r = run(['hours_logged', 'billable_hours', 'pending_timesheets'], { timesheets }, { now });
    assert.equal(r.hours_logged.value, 8);
    assert.equal(r.billable_hours.value, 0.75);
    assert.equal(kpiSubline('billable_hours', r.billable_hours), '2 h not on a job');
    assert.equal(r.pending_timesheets.value, 2); // snapshot: every pending entry, any date
  });

  test('jobs per tech is only offered to teams', () => {
    assert.equal(KPIS.jobs_per_tech.available({ staffCount: 1 }), false);
    assert.equal(KPIS.jobs_per_tech.available({ staffCount: 3 }), true);
  });

  test('labour vs materials splits invoiced line revenue and ignores other lines', () => {
    const inv = { status: 'Sent', subtotal: 1000, total: 1100, issueDate: '2026-10-02', sections: [{ lineItems: [
      { type: 'labor', total: 600 }, { type: 'material', qty: 2, rate: 100 }, { type: 'other', total: 200 },
    ] }] };
    const r = run('labour_vs_materials', { invoices: [inv] }, { now });
    assert.equal(r.labour_vs_materials.value, 0.75);
    assert.equal(kpiSubline('labour_vs_materials', r.labour_vs_materials), 'Labour 75% · Materials 25%');
    assert.equal(r.labour_vs_materials.good, null); // neither direction is good news
  });

  test('repeat customers had an invoice before the period', () => {
    const inv = (customerId, issueDate) => ({ status: 'Sent', subtotal: 100, total: 110, customerId, issueDate });
    const r = run('repeat_customers', {
      customers: [{ id: 'c1' }, { id: 'c2' }],
      invoices: [inv('c1', '2026-05-01'), inv('c1', '2026-10-02'), inv('c2', '2026-10-03')],
    }, { now });
    assert.equal(r.repeat_customers.value, 0.5);
  });

  test('top customer share flags over 30% in amber', () => {
    const inv = (customerId, subtotal) => ({ status: 'Sent', subtotal, total: subtotal * 1.1, customerId, customerName: customerId, issueDate: '2026-10-02' });
    const r = run('top_customer_share', { invoices: [inv('Big Builder', 700), inv('A', 200), inv('B', 100)] }, { now });
    assert.equal(r.top_customer_share.value, 0.7);
    assert.equal(r.top_customer_share.extra.warn, true);
    assert.equal(kpiSubline('top_customer_share', r.top_customer_share), 'Big Builder');
  });

  test('maintenance due counts the next 7 days and calls out overdue plans', () => {
    const plan = (nextServiceDate, status = 'Active') => ({ assetId: 'a', status, nextServiceDate });
    const r = run('maintenance_due', { maintenancePlans: [
      plan('2026-10-08'), plan('2026-10-14'), plan('2026-10-15'), plan('2026-10-01'), plan('2026-10-02', 'Paused'), plan(null),
    ] }, { now });
    assert.equal(r.maintenance_due.value, 2);
    assert.equal(kpiSubline('maintenance_due', r.maintenance_due), '+1 overdue');
    assert.equal(r.maintenance_due.extra.subAlert, true);
  });

  test('durations under a day read in hours', () => {
    assert.equal(formatKpiValue(0.1, 'duration'), '2.4 h');
    assert.equal(formatKpiValue(3.25, 'duration'), '3.3 days');
    assert.equal(formatKpiDelta(-0.05, 'duration'), '−1.2 h');
    assert.equal(formatKpiValue(1503.8, 'hours'), '1,503.8 h');
    assert.equal(formatKpiValue(6.62, 'decimal'), '6.6');
  });
});
