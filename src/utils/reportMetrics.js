// ============================================
// RELAY — REPORT METRICS
// ============================================
// The numbers behind the Reports page, as pure functions over the store's plain
// record arrays. Every figure the dashboard also shows comes from the dashboard's
// own formula in kpis.js, run over a custom date range, so the two screens always
// agree. Conventions are kpis.js's: money is GST-exclusive, revenue is what was
// invoiced, cash is what was paid, and profit is invoiced revenue less actual job
// cost on the jobs that could be costed.

import {
  KPIS, rows, toDate, inRange, invoiceIssued, invoiceJobShares,
  invoicedJobProfit, jobCosts, jobCompletedAt, lastBookingByJob,
  timesheetHours, isTemplate, revenueByCustomer, invoiceBalance,
} from './kpis.js';
import { customerPaymentTermsLabel } from './customerTerms.js';

const DAY = 86400000;
const num = (v) => { const n = parseFloat(v); return isFinite(n) ? n : 0; };
const sum = (arr, f) => arr.reduce((s, x) => s + f(x), 0);
const round2 = (v) => Math.round(v * 100) / 100;
const startOfDay = (d) => new Date(d.getFullYear(), d.getMonth(), d.getDate());
const addDays = (d, n) => new Date(d.getFullYear(), d.getMonth(), d.getDate() + n);
const isSet = (v) => !!v && v !== 'All';

// ── Filters and range ────────────────────────────────────────────────────────

// Filters: { start, end } as 'YYYY-MM-DD' (either may be empty), plus
// technicianId, customerId and assetType ('All' or empty means no filter).
export function emptyFilters() {
  return { start: '', end: '', technicianId: 'All', customerId: 'All', assetType: 'All' };
}

// The earliest day any record in the business is dated, for "all time".
function earliestDay(data, fallback) {
  let min = null;
  const see = (v) => { const d = toDate(v); if (d && (!min || d < min)) min = d; };
  (data.invoices || []).forEach(i => see(invoiceIssued(i)));
  (data.jobs || []).forEach(j => see(j.createdAt));
  (data.timesheets || []).forEach(t => see(t.date));
  (data.quotes || []).forEach(q => see(q.createdAt));
  (data.leads || []).forEach(l => see(l.createdAt));
  (data.customers || []).forEach(c => see(c.createdAt));
  return min ? startOfDay(min) : fallback;
}

// The report's window, end exclusive. An open end runs to the end of today.
export function reportRange(filters, data, now = new Date()) {
  const today = startOfDay(now);
  const end = filters.end ? addDays(toDate(filters.end), 1) : addDays(today, 1);
  const start = filters.start ? toDate(filters.start) : earliestDay(data, today);
  return { start: start < end ? start : addDays(end, -1), end };
}

// The context kpis.js formulas expect, for an arbitrary range.
export function reportContext(range, now = new Date(), workdayHours = 8) {
  return { range, full: range, period: 'custom', today: startOfDay(now), now, workdayHours };
}

// ── Scoping ──────────────────────────────────────────────────────────────────

const jobTechIds = (j) => [...new Set([j.technicianId, ...(j.technicians || []).map(t => t && t.id)].filter(Boolean).map(String))];
const jobAssetIds = (j) => [j.assetId, ...(j.assetIds || [])].filter(Boolean).map(String);

// An invoice cut down to the jobs in scope. A combined invoice billing several
// jobs keeps only the matching jobs' share of its amounts and payments, so it is
// never counted in full against one of them. Null when it bills none of them.
export function scopeInvoice(inv, jobIds) {
  const shares = invoiceJobShares(inv);
  const matched = shares.filter(s => jobIds.has(s.jobId));
  if (!matched.length) return null;
  if (matched.length === shares.length) return inv;
  const all = sum(shares, s => s.amount);
  const f = all > 0 ? sum(matched, s => s.amount) / all : matched.length / shares.length;
  const ids = new Set(matched.map(s => s.jobId));
  return {
    ...inv,
    jobId: matched[0].jobId,
    jobIds: [...ids],
    jobAmounts: Array.isArray(inv.jobAmounts) ? inv.jobAmounts.filter(a => ids.has(String(a.jobId))) : inv.jobAmounts,
    subtotal: num(inv.subtotal) * f,
    total: num(inv.total) * f,
    payments: Array.isArray(inv.payments) ? inv.payments.map(p => ({ ...p, amount: num(p.amount) * f })) : inv.payments,
  };
}

// The collections cut down to the report's filters. Dates are not applied here:
// each formula picks the date that matters to it (issued, paid, completed…).
export function scopeData(data, filters) {
  const tech = isSet(filters.technicianId) ? String(filters.technicianId) : null;
  const cust = isSet(filters.customerId) ? String(filters.customerId) : null;
  const type = isSet(filters.assetType) ? filters.assetType : null;
  const assets = data.assets || [];
  const typedAssets = type ? new Set(assets.filter(a => a.type === type).map(a => String(a.id))) : null;

  const jobs = (data.jobs || []).filter(j =>
    (!cust || String(j.customerId) === cust) &&
    (!tech || jobTechIds(j).includes(tech)) &&
    (!typedAssets || jobAssetIds(j).some(id => typedAssets.has(id))));
  const jobIds = new Set(jobs.map(j => String(j.id)));
  const jobLevel = !!(tech || type);
  const byJob = (r) => !(cust || jobLevel) || (r.jobId && jobIds.has(String(r.jobId)));

  let invoices = (data.invoices || []).filter(i => !cust || String(i.customerId) === cust);
  if (jobLevel) invoices = invoices.map(i => scopeInvoice(i, jobIds)).filter(Boolean);

  const byCustomer = (r) => !cust || String(r.customerId) === cust;
  const assetIds = new Set(assets.filter(a => byCustomer(a) && (!type || a.type === type)).map(a => String(a.id)));

  return {
    ...data,
    jobs,
    invoices,
    quotes: (data.quotes || []).filter(byCustomer),
    leads: (data.leads || []).filter(byCustomer),
    customers: (data.customers || []).filter(c => !cust || String(c.id) === cust),
    technicians: (data.technicians || []).filter(t => !tech || String(t.id) === tech),
    timesheets: (data.timesheets || []).filter(t => (!tech || String(t.technicianId) === tech) && byJob(t)),
    schedule: (data.schedule || []).filter(s => (!tech || String(s.technicianId) === tech) && byJob(s)),
    assets: assets.filter(a => assetIds.has(String(a.id))),
    maintenancePlans: (data.maintenancePlans || []).filter(p => byCustomer(p) && (!type || assetIds.has(String(p.assetId)))),
  };
}

// ── Building blocks ──────────────────────────────────────────────────────────

// One dashboard formula's result over this report's scope and range; null when
// the business has no data of that kind.
function kpi(id, data, ctx) {
  try { return KPIS[id].compute(data, ctx) || null; } catch (e) { return null; }
}

const MONTH = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

// Calendar months overlapping the range, oldest first, each clipped to the range.
export function monthsIn(range) {
  const out = [];
  for (let m = new Date(range.start.getFullYear(), range.start.getMonth(), 1); m < range.end; m = new Date(m.getFullYear(), m.getMonth() + 1, 1)) {
    const next = new Date(m.getFullYear(), m.getMonth() + 1, 1);
    out.push({
      key: `${m.getFullYear()}-${String(m.getMonth() + 1).padStart(2, '0')}`,
      label: `${MONTH[m.getMonth()]} ${String(m.getFullYear()).slice(2)}`,
      range: { start: m < range.start ? range.start : m, end: next > range.end ? range.end : next },
    });
  }
  return out;
}

// Labour hours and cost per person. A timesheet's own pay rate wins over the
// person's current rate, as in job costing; hours with no rate at all are
// counted separately rather than costed at zero.
function labourByTech(timesheets, technicians, range) {
  const rate = new Map(technicians.map(t => [String(t.id), num(t.payRate)]));
  const out = new Map();
  timesheets.forEach(t => {
    const h = timesheetHours(t);
    if (h <= 0 || !inRange(t.date, range)) return;
    const k = String(t.technicianId || '');
    const e = out.get(k) || { hours: 0, billableHours: 0, cost: 0, unratedHours: 0 };
    out.set(k, e);
    e.hours += h;
    if (t.jobId) e.billableHours += h;
    const r = num(t.payRate) || rate.get(k) || 0;
    if (r > 0) e.cost += h * r; else e.unratedHours += h;
  });
  return out;
}

// ── The report ───────────────────────────────────────────────────────────────

export function buildReport(data, filters = emptyFilters(), { now = new Date(), workdayHours = 8 } = {}) {
  const range = reportRange(filters, data, now);
  const ctx = reportContext(range, now, workdayHours);
  const d = scopeData(data, filters);
  const jobById = new Map((data.jobs || []).map(j => [String(j.id), j]));
  const val = (id) => { const r = kpi(id, d, ctx); return r ? r.value : null; };

  // Money
  const issued = rows('invoices', 'issued', d, ctx);
  const revenue = kpi('revenue_invoiced', d, ctx);
  const outstanding = kpi('outstanding', d, ctx);
  const overdue = kpi('overdue', d, ctx);
  const money = {
    issued,
    revenue: revenue ? revenue.value : 0,
    invoiceCount: issued.length,
    received: val('payments_received') || 0,
    outstanding: outstanding ? outstanding.value : 0,
    outstandingCount: outstanding ? outstanding.count : 0,
    overdue: overdue ? overdue.value : 0,
    overdueCount: overdue ? overdue.count : 0,
    averageInvoice: val('average_invoice_value'),
  };

  // Profit on invoiced jobs, with each job's row joined to its record.
  const p = invoicedJobProfit(d, range);
  const profit = {
    ...p,
    margin: p.revenue > 0 ? p.profit / p.revenue : null,
    jobs: p.jobs
      .map(r => ({ ...r, job: jobById.get(String(r.jobId)) || null, profit: r.revenue - r.cost, margin: r.known && r.revenue > 0 ? (r.revenue - r.cost) / r.revenue : null }))
      .sort((a, b) => b.revenue - a.revenue),
  };

  const monthly = monthsIn(range).map(m => {
    const mctx = reportContext(m.range, now, workdayHours);
    const rev = kpi('revenue_invoiced', d, mctx);
    const mp = invoicedJobProfit(d, m.range);
    return { key: m.key, label: m.label, revenue: rev ? rev.value : 0, costedRevenue: mp.revenue, cost: mp.cost, profit: mp.profit };
  });

  const invoicesByStatus = {};
  issued.forEach(i => { invoicesByStatus[i.status] = (invoicesByStatus[i.status] || 0) + 1; });

  // Jobs
  const lastBooking = lastBookingByJob(d.schedule);
  const realJobs = d.jobs.filter(j => !isTemplate(j));
  const completed = rows('jobs', 'completed', d, ctx);
  const created = realJobs.filter(j => inRange(j.createdAt, range));
  const jobsByStatus = {};
  created.forEach(j => { jobsByStatus[j.status] = (jobsByStatus[j.status] || 0) + 1; });
  const costs = jobCosts(d);
  const hoursOn = (j) => { const c = costs.get(String(j.id)); return c ? c.hours : 0; };
  const timed = completed.filter(j => hoursOn(j) > 0);
  const jobs = {
    created,
    completed,
    byStatus: jobsByStatus,
    active: val('active_jobs') || 0,
    readyToInvoice: rows('jobs', 'ready-to-invoice', d, ctx).length,
    averageHours: timed.length ? sum(timed, hoursOn) / timed.length : null,
    hoursByJob: new Map(realJobs.map(j => [String(j.id), hoursOn(j)])),
    completedAt: (j) => jobCompletedAt(j, lastBooking),
  };

  // Team: each person's hours and labour cost, jobs completed with them on it, and
  // their share of what those jobs invoiced (a job's invoice split evenly across
  // everyone on it, so a two-person job isn't counted twice).
  const labour = labourByTech(d.timesheets, data.technicians || [], range);
  const invoicedShare = new Map();
  issued.forEach(inv => invoiceJobShares(inv).forEach(s => {
    const job = jobById.get(s.jobId);
    const techs = job ? jobTechIds(job) : [];
    techs.forEach(id => invoicedShare.set(id, (invoicedShare.get(id) || 0) + s.amount / techs.length));
  }));
  const team = d.technicians.filter(t => t.role !== 'customer').map(t => {
    const k = String(t.id);
    const l = labour.get(k) || { hours: 0, billableHours: 0, cost: 0, unratedHours: 0 };
    return {
      ...t,
      hours: l.hours,
      billableHours: l.billableHours,
      billableShare: l.hours > 0 ? l.billableHours / l.hours : null,
      labourCost: l.cost,
      unratedHours: l.unratedHours,
      jobsCompleted: completed.filter(j => jobTechIds(j).includes(k)).length,
      invoiced: invoicedShare.get(k) || 0,
    };
  });
  const allLabour = [...labour.values()];
  const totalHours = sum(allLabour, l => l.hours);
  const billableHours = sum(allLabour, l => l.billableHours);
  const labourTotals = {
    hours: totalHours,
    billableHours,
    billableShare: totalHours > 0 ? billableHours / totalHours : null,
    cost: sum(allLabour, l => l.cost),
    unratedHours: sum(allLabour, l => l.unratedHours),
  };

  // Sales
  const winRate = kpi('quote_win_rate', d, ctx);
  const conversion = kpi('lead_conversion', d, ctx);
  const sales = {
    winRate: winRate ? winRate.value : null,
    quotesDecided: winRate ? winRate.count : 0,
    leadConversion: conversion ? conversion.value : null,
    leadsClosed: conversion ? conversion.count : 0,
    newLeads: rows('leads', 'new', d, ctx).length,
    quotesSent: rows('quotes', 'sent', d, ctx).length,
  };

  // Customers
  const byCustomer = [...revenueByCustomer(d.invoices, range).entries()]
    .map(([id, e]) => ({ id, name: e.name, revenue: e.revenue }))
    .sort((a, b) => b.revenue - a.revenue);
  const customerRevenue = sum(byCustomer, c => c.revenue);
  // Repeat: invoiced in the range and more than once up to its end, either before
  // it or twice within it. The dashboard's card only looks before the period,
  // which would make every all-time report read zero.
  const invoicesSoFar = new Map();
  d.invoices.forEach(i => {
    const at = toDate(invoiceIssued(i));
    if (!at || at >= range.end || !i.customerId || i.status === 'Draft' || i.status === 'Void') return;
    const k = String(i.customerId);
    invoicesSoFar.set(k, (invoicesSoFar.get(k) || 0) + 1);
  });
  const customers = {
    total: d.customers.length,
    active: d.customers.filter(c => c.status === 'Active').length,
    new: rows('customers', 'new', d, ctx).length,
    repeat: byCustomer.filter(c => (invoicesSoFar.get(c.id) || 0) > 1).length,
    invoiced: byCustomer.length,
    top: byCustomer.slice(0, 10).map(c => ({ ...c, share: customerRevenue > 0 ? c.revenue / customerRevenue : 0 })),
    revenueById: new Map(byCustomer.map(c => [c.id, c.revenue])),
  };

  // Credit — GST-inclusive on both sides, because a limit is something set
  // against what the customer will actually owe. Balances come from the
  // *unscoped* invoice list: a technician or asset filter slices an invoice's
  // labour, and half an invoice is not half a credit exposure.
  const owingByCustomer = new Map();
  (data.invoices || []).forEach(i => {
    if (!i || !i.customerId) return;
    const balance = invoiceBalance(i);
    if (balance <= 0) return;
    const key = String(i.customerId);
    owingByCustomer.set(key, (owingByCustomer.get(key) || 0) + balance);
  });
  const creditAccounts = d.customers.map(c => {
    const limit = num(c.creditLimit);
    const owing = round2(owingByCustomer.get(String(c.id)) || 0);
    return {
      id: c.id,
      name: c.company || [c.firstName, c.lastName].filter(Boolean).join(' ') || c.email || c.id,
      terms: customerPaymentTermsLabel(c),
      limit,
      owing,
      overBy: round2(owing - limit),
    };
  });
  const limited = creditAccounts.filter(a => a.limit > 0);
  const over = creditAccounts.filter(a => a.limit > 0 && a.overBy > 0).sort((a, b) => b.overBy - a.overBy);
  const granted = sum(limited, a => a.limit);
  const credit = {
    accounts: limited.length,
    granted: round2(granted),
    used: round2(sum(limited, a => a.owing)),
    overCount: over.length,
    overTotal: round2(sum(over, a => a.overBy)),
    // Share of the granted credit in use. Over-limit accounts push this past
    // 100%, which is the point of showing it.
    utilization: granted > 0 ? round2(sum(limited, a => a.owing)) / granted : null,
    over,
    // Every scoped customer, limit or not, so the CSV can carry a balance column.
    byId: new Map(creditAccounts.map(a => [String(a.id), a])),
  };

  // Aged receivables, by the terms each account is on. Same GST-inclusive
  // balances and the same "whole invoice" rule as credit: a technician filter
  // slices an invoice's share, but a customer still owes the whole thing. The
  // report's date range is deliberately ignored — this is what is owed *now*,
  // exactly like the Outstanding and Overdue cards.
  const today = startOfDay(now);
  const inScope = new Set(d.customers.map(c => String(c.id)));
  const ageBuckets = { current: 0, d1_30: 0, d31_60: 0, d61_90: 0, d90p: 0 };
  const ageByCustomer = new Map();
  (data.invoices || []).forEach(i => {
    if (!i || !i.customerId || !inScope.has(String(i.customerId))) return;
    const balance = invoiceBalance(i);
    if (balance <= 0) return;
    const due = toDate(i.dueDate);
    const daysPast = due ? Math.floor((today - startOfDay(due)) / DAY) : 0;
    const bucket = daysPast <= 0 ? 'current'
      : daysPast <= 30 ? 'd1_30'
        : daysPast <= 60 ? 'd31_60'
          : daysPast <= 90 ? 'd61_90' : 'd90p';
    ageBuckets[bucket] += balance;
    const key = String(i.customerId);
    const entry = ageByCustomer.get(key) || { current: 0, d1_30: 0, d31_60: 0, d61_90: 0, d90p: 0 };
    entry[bucket] += balance;
    ageByCustomer.set(key, entry);
  });
  const agingRows = d.customers
    .filter(c => ageByCustomer.has(String(c.id)))
    .map(c => {
      const e = ageByCustomer.get(String(c.id));
      const total = round2(e.current + e.d1_30 + e.d31_60 + e.d61_90 + e.d90p);
      return {
        id: c.id,
        name: c.company || [c.firstName, c.lastName].filter(Boolean).join(' ') || c.email || c.id,
        terms: customerPaymentTermsLabel(c),
        current: round2(e.current),
        d1_30: round2(e.d1_30),
        d31_60: round2(e.d31_60),
        d61_90: round2(e.d61_90),
        d90p: round2(e.d90p),
        total,
      };
    })
    .sort((a, b) => b.total - a.total);
  const aging = {
    buckets: {
      current: round2(ageBuckets.current),
      d1_30: round2(ageBuckets.d1_30),
      d31_60: round2(ageBuckets.d31_60),
      d61_90: round2(ageBuckets.d61_90),
      d90p: round2(ageBuckets.d90p),
    },
    overdue: round2(ageBuckets.d1_30 + ageBuckets.d31_60 + ageBuckets.d61_90 + ageBuckets.d90p),
    total: round2(sum(Object.values(ageBuckets), v => v)),
    rows: agingRows,
  };

  return { range, ctx, scoped: d, money, profit, monthly, invoicesByStatus, jobs, team, labour: labourTotals, sales, customers, credit, aging };
}

// Days covered by a range, for labels.
export const rangeDays = (range) => Math.round((range.end - range.start) / DAY);

// ── CSV ──────────────────────────────────────────────────────────────────────

// One CSV cell. Quotes are doubled and the cell quoted when needed, and text a
// spreadsheet would run as a formula (=, +, -, @, tab, CR) is prefixed with an
// apostrophe. Numbers are written as-is.
export function csvCell(v) {
  if (v == null) return '';
  if (typeof v === 'number') return isFinite(v) ? String(Math.sign(v) * Math.round(Math.abs(v) * 100) / 100) : '';
  let s = String(v);
  if (/^[=+\-@\t\r]/.test(s)) s = `'${s}`;
  return /[",\r\n]/.test(s) || s !== s.trim() ? `"${s.replace(/"/g, '""')}"` : s;
}

export function toCsv(header, body) {
  return [header, ...body].map(r => r.map(csvCell).join(',')).join('\r\n') + '\r\n';
}
