import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { buildDemoDataset } from '../data/demoDataset.js';
import {
  quotesToFollowUp, chaseList, cashForecast, basEstimate, basDueDate, jobsAtRisk, crewWeek,
  deliveriesDue, leadsWaiting, portalActivity, revenueGoal, expiringDocuments,
} from './dashboardLists.js';

const now = new Date(2026, 9, 8, 10, 0); // Thu 8 Oct 2026, 10am
const ctx = { now };

// ── Demo dataset: fixed expected results ─────────────────────────────────────
describe('action lists against the demo dataset', () => {
  const d = buildDemoDataset({ now }).collections;

  test('quotes to follow up', () => {
    assert.deepEqual(quotesToFollowUp(d, ctx).map(r => `${r.quote.number}:${r.reason}:${r.waiting}`), ['Q-01281:stale:10', 'Q-01282:stale:9']);
  });
  test('chase list, biggest balance first', () => {
    const rows = chaseList(d, ctx);
    assert.equal(rows.length, 6);
    assert.equal(rows[0].invoice.number, 'INV-02468');
    assert.equal(rows[0].daysOverdue, 24);
  });
  test('cash forecast', () => {
    const f = cashForecast(d, ctx);
    assert.deepEqual([Math.round(f.overdue), ...f.buckets.map(b => Math.round(b.amount))], [3715, 17180, 2268, 1405, 4299]);
    assert.equal(f.toInvoiceCount, 9);
  });
  test('BAS estimate for Oct–Dec', () => {
    const b = basEstimate(d, ctx);
    assert.equal(b.label, 'Oct–Dec 2026');
    assert.equal(Math.round(b.net), 1241);
    assert.equal(b.daysToDue, 143);
  });
  test('jobs at risk, crew week, deliveries, leads, portal, docs', () => {
    assert.deepEqual(jobsAtRisk(d, ctx).map(r => r.job.number), ['J-02340', 'J-02402']);
    assert.deepEqual(crewWeek(d, ctx).rows.map(r => Math.round(r.booked)), [5, 23, 25, 31, 19, 0]);
    assert.deepEqual(deliveriesDue(d, ctx).map(r => r.po.number), ['PO-00020', 'PO-00021', 'PO-00022']);
    assert.deepEqual(leadsWaiting(d, ctx).map(r => r.lead.number), ['LD-00049', 'LD-00050']);
    assert.equal(portalActivity(d, ctx).length, 11);
    assert.deepEqual(expiringDocuments(d, ctx).map(r => `${r.doc.type}:${r.days}`), ['Public Liability Insurance:12']);
  });
  test('revenue goal', () => {
    const g = revenueGoal(d, { now, target: 60000 });
    assert.equal(Math.round(g.invoiced), 18253);
    assert.equal(g.workdaysLeft, 16);
    assert.equal(Math.round(g.perDayNeeded), 2609);
  });
});

// ── Rules ────────────────────────────────────────────────────────────────────

describe('quotes to follow up', () => {
  const q = (o) => ({ status: 'Sent', sentAt: '2026-10-05', validUntil: '2026-11-30', subtotal: 100, ...o });

  test('waiting past 7 days, or expiring within 7 days; expiring first', () => {
    const rows = quotesToFollowUp({ quotes: [
      q({ number: 'fresh' }),
      q({ number: 'stale', sentAt: '2026-09-20' }),
      q({ number: 'expiring', validUntil: '2026-10-10' }),
      q({ number: 'expired', sentAt: '2026-09-01', validUntil: '2026-10-01' }),
      q({ number: 'won', status: 'Accepted', sentAt: '2026-09-01' }),
    ] }, ctx);
    assert.deepEqual(rows.map(r => r.quote.number), ['expiring', 'stale']);
    assert.equal(rows[0].expiresIn, 2);
  });
});

describe('chase list', () => {
  test('uses the latest sent reminder and ignores failed ones', () => {
    const inv = { id: 'i1', status: 'Sent', total: 110, subtotal: 100, dueDate: '2026-10-01' };
    const rows = chaseList({ invoices: [inv], emailLog: [
      { template: 'reminder', status: 'sent', relatedId: 'i1', createdAt: '2026-10-02T01:00:00Z' },
      { template: 'reminder', status: 'sent', relatedId: 'i1', createdAt: '2026-10-06T01:00:00Z' },
      { template: 'reminder', status: 'failed', relatedId: 'i1', createdAt: '2026-10-07T01:00:00Z' },
    ] }, ctx);
    assert.equal(rows[0].daysOverdue, 7);
    assert.deepEqual(rows[0].lastReminder, new Date('2026-10-06T01:00:00Z'));
  });
});

describe('cash forecast', () => {
  test('balances land in the week they fall due; overdue and later kept apart', () => {
    const inv = (dueDate, total) => ({ status: 'Sent', total, subtotal: total / 1.1, dueDate });
    const f = cashForecast({ invoices: [inv('2026-10-01', 110), inv('2026-10-09', 220), inv('2026-10-20', 330), inv('2026-12-25', 440)] }, ctx);
    assert.equal(f.overdue, 110);
    assert.deepEqual(f.buckets.map(b => b.amount), [220, 330, 0, 0]); // weeks from Thu 8, 15, 22, 29 Oct
    assert.equal(f.later, 440);
    assert.equal(f.total, 660);
  });
});

describe('BAS', () => {
  test('quarterly lodgement dates', () => {
    assert.deepEqual(basDueDate(new Date(2026, 6, 1)), new Date(2026, 9, 28));
    assert.deepEqual(basDueDate(new Date(2026, 9, 1)), new Date(2027, 1, 28));
    assert.deepEqual(basDueDate(new Date(2027, 0, 1)), new Date(2027, 3, 28));
    assert.deepEqual(basDueDate(new Date(2027, 3, 1)), new Date(2027, 6, 28));
  });
  test('GST collected less 10% of PO totals, this quarter only', () => {
    const b = basEstimate({
      invoices: [
        { status: 'Sent', subtotal: 1000, tax: 100, total: 1100, issueDate: '2026-10-02' },
        { status: 'Draft', subtotal: 1000, tax: 100, total: 1100, issueDate: '2026-10-02' },
        { status: 'Paid', subtotal: 500, tax: 50, total: 550, issueDate: '2026-09-30' },
      ],
      purchaseOrders: [{ status: 'Issued', total: 300, issueDate: '2026-10-03' }, { status: 'Draft', total: 900, issueDate: '2026-10-03' }],
    }, ctx);
    assert.equal(b.collected, 100);
    assert.equal(b.credits, 30);
    assert.equal(b.net, 70);
  });
});

describe('jobs at risk', () => {
  test('over hours and late starts; finished jobs ignored', () => {
    const rows = jobsAtRisk({
      jobs: [
        { id: 'a', number: 'over', status: 'In Progress', estimatedHours: 4 },
        { id: 'b', number: 'late', status: 'Scheduled', scheduledDate: '2026-10-05' },
        { id: 'c', number: 'done', status: 'Completed', estimatedHours: 1 },
        { id: 'd', number: 'fine', status: 'In Progress', estimatedHours: 10 },
      ],
      timesheets: [{ jobId: 'a', hours: 6 }, { jobId: 'c', hours: 5 }, { jobId: 'd', hours: 3 }],
    }, ctx);
    assert.deepEqual(rows.map(r => r.job.number), ['over', 'late']);
    assert.equal(rows[0].reasons[0].over, 0.5);
    assert.equal(rows[1].reasons[0].daysLate, 3);
  });
});

describe('crew week', () => {
  test('leave takes hours out of capacity; weekends have none', () => {
    const w = crewWeek({
      technicians: [{ id: 't1', name: 'Ann' }, { id: 'gone', deactivated: true }],
      schedule: [
        { technicianId: 't1', jobId: 'j', date: '2026-10-08', hours: 6 },
        { technicianId: 't1', date: '2026-10-09', hours: 8, type: 'Leave' },
      ],
    }, ctx);
    assert.equal(w.rows.length, 1);
    const [thu, fri, sat] = w.rows[0].cells;
    assert.equal(thu.booked, 6); assert.equal(thu.capacity, 8);
    assert.equal(fri.capacity, 0); assert.equal(fri.leave, 8);
    assert.equal(sat.capacity, 0);
    assert.equal(w.rows[0].capacity, 8 * 4); // Thu + Mon/Tue/Wed
  });
});

describe('deliveries, leads, portal, goal, documents', () => {
  test('deliveries: late first, received and far-off ignored', () => {
    const rows = deliveriesDue({ purchaseOrders: [
      { number: 'soon', status: 'Issued', expectedDate: '2026-10-12' },
      { number: 'late', status: 'Issued', expectedDate: '2026-10-01' },
      { number: 'got', status: 'Received', expectedDate: '2026-10-02' },
      { number: 'far', status: 'Issued', expectedDate: '2026-11-30' },
    ] }, ctx);
    assert.deepEqual(rows.map(r => r.po.number), ['late', 'soon']);
    assert.equal(rows[0].daysLate, 7);
  });
  test('leads: still New after a day, oldest first', () => {
    const rows = leadsWaiting({ leads: [
      { number: 'new', status: 'New', createdAt: '2026-10-08T08:00:00' },
      { number: 'old', status: 'New', createdAt: '2026-10-05T08:00:00' },
      { number: 'mid', status: 'New', createdAt: '2026-10-06T08:00:00' },
      { number: 'called', status: 'Contacted', createdAt: '2026-10-01T08:00:00' },
    ] }, ctx);
    assert.deepEqual(rows.map(r => r.lead.number), ['old', 'mid']);
    assert.equal(rows[0].hoursWaiting, 74);
  });
  test('portal: recent customer actions only, newest first', () => {
    const ev = portalActivity({
      quotes: [{ id: 'q', number: 'Q-1', status: 'Accepted', signedAt: '2026-10-07T01:00:00Z', total: 500 }, { id: 'old', status: 'Accepted', signedAt: '2026-08-01' }],
      notifications: [{ id: 'n', source: 'customer_portal', title: 'Fault', createdAt: '2026-10-07T20:00:00Z' }, { id: 'x', source: 'internal', createdAt: '2026-10-08' }],
      customers: [{ id: 'c', company: 'Acme', portalLastAccessed: '2026-10-06T00:00:00Z' }],
    }, ctx);
    assert.deepEqual(ev.map(e => e.type), ['request', 'signed', 'visit']);
  });
  test('revenue goal: pace and what is needed per working day', () => {
    const g = revenueGoal({ invoices: [{ status: 'Sent', subtotal: 5000, total: 5500, issueDate: '2026-10-02' }] }, { now, target: 22000 });
    assert.equal(g.invoiced, 5000);
    assert.equal(g.pct, 5000 / 22000);
    // October 2026 has 22 working days; 6 have passed by Thu 8 Oct.
    assert.equal(g.workdaysLeft, 16);
    assert.equal(g.expected, 22000 * 6 / 22);
    assert.equal(g.perDayNeeded, 17000 / 16);
  });
  test('documents: expired and due within 30 days, active contractors only', () => {
    const rows = expiringDocuments({ contractors: [
      { businessName: 'A', active: true, complianceDocs: [{ type: 'PL', expiryDate: '2026-10-01' }, { type: 'WC', expiryDate: '2026-10-20' }, { type: 'Lic', expiryDate: '2027-06-01' }] },
      { businessName: 'B', active: false, complianceDocs: [{ type: 'PL', expiryDate: '2026-10-02' }] },
    ] }, ctx);
    assert.deepEqual(rows.map(r => `${r.doc.type}:${r.days}`), ['PL:-7', 'WC:12']);
  });
});
