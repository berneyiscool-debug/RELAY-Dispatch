// ============================================
// RELAY — DASHBOARD KPI DEFINITIONS
// ============================================
// Every KPI card is one entry in KPIS: a pure formula over plain record arrays
// plus the metadata the dashboard needs to draw it. This file has NO imports and
// touches no browser APIs, so the same formulas can run on the device (local
// accounts, against the store cache) and in a Supabase Edge Function (Deno
// imports plain JS) for cloud accounts. Keep it that way.
//
// Spec: Notion › RELAY-Dispatch › Dashboard KPI Cards Spec.
// The app imports this through src/utils/kpis.js; the Edge Function beside it
// imports it directly.
//
// Conventions
//   • Money is GST-exclusive throughout (exGst below).
//   • compute() returns null when the business has no data of that kind yet; the
//     card then shows "—" plus the definition's `empty` hint. A rate whose
//     denominator is zero for the period returns { value: null } and shows "—".
//   • Period cards get ctx.range (period to date) and ctx.full (whole period);
//     computeAll runs them a second time over the previous period for the delta.
//   • Record shapes are the store's camelCase records. Lifecycle stamps that
//     older records may lack (completedAt, sentAt, acceptedAt…) have fallbacks.

const DAY = 86400000;

// ── Dates ────────────────────────────────────────────────────────────────────

// 'YYYY-MM-DD' is a local calendar day; anything else goes through Date.
export function toDate(v) {
  if (!v) return null;
  if (v instanceof Date) return isNaN(v) ? null : v;
  if (typeof v === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(v)) {
    const [y, m, d] = v.split('-').map(Number);
    return new Date(y, m - 1, d);
  }
  const d = new Date(v);
  return isNaN(d) ? null : d;
}

const startOfDay = (d) => new Date(d.getFullYear(), d.getMonth(), d.getDate());
const addDays = (d, n) => new Date(d.getFullYear(), d.getMonth(), d.getDate() + n);
const dayKey = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

export function inRange(v, r) {
  const d = toDate(v);
  return !!d && d >= r.start && d < r.end;
}

export const PERIODS = [
  { id: 'today',   label: 'Today' },
  { id: 'week',    label: 'This week' },
  { id: 'month',   label: 'This month' },
  { id: 'quarter', label: 'This quarter' },
  { id: 'fy',      label: 'Financial year' },
];
export const DEFAULT_PERIOD = 'month';

// Calendar bounds of the period containing `now`, and of the one before it.
// Weeks run Monday–Sunday; the financial year runs July–June.
function periodBounds(periodId, now) {
  const today = startOfDay(now);
  const y = today.getFullYear(), m = today.getMonth();
  switch (periodId) {
    case 'today':
      return { start: today, end: addDays(today, 1), prevStart: addDays(today, -1) };
    case 'week': {
      const start = addDays(today, -((today.getDay() + 6) % 7));
      return { start, end: addDays(start, 7), prevStart: addDays(start, -7) };
    }
    case 'quarter': {
      const qm = m - (m % 3);
      return { start: new Date(y, qm, 1), end: new Date(y, qm + 3, 1), prevStart: new Date(y, qm - 3, 1) };
    }
    case 'fy': {
      const fy = m >= 6 ? y : y - 1;
      return { start: new Date(fy, 6, 1), end: new Date(fy + 1, 6, 1), prevStart: new Date(fy - 1, 6, 1) };
    }
    case 'month':
    default:
      return { start: new Date(y, m, 1), end: new Date(y, m + 1, 1), prevStart: new Date(y, m - 1, 1) };
  }
}

// The windows a period card is measured over. `range` runs from the start of the
// period to the end of today, and `prev.range` covers the same number of days
// from the start of the previous period. Comparing month-to-date with the same
// days last month stops the delta looking terrible on the 3rd of every month.
// `full` is the whole period, for capacity measures like utilisation.
export function periodRanges(periodId, now = new Date()) {
  const b = periodBounds(periodId, now);
  const toDateEnd = new Date(Math.min(addDays(startOfDay(now), 1).getTime(), b.end.getTime()));
  const elapsedDays = Math.round((toDateEnd - b.start) / DAY);
  const prevEnd = b.start;
  const prevToDateEnd = new Date(Math.min(addDays(b.prevStart, elapsedDays).getTime(), prevEnd.getTime()));
  return {
    range: { start: b.start, end: toDateEnd },
    full: { start: b.start, end: b.end },
    prev: {
      range: { start: b.prevStart, end: prevToDateEnd },
      full: { start: b.prevStart, end: prevEnd },
    },
  };
}

// ── Record helpers ───────────────────────────────────────────────────────────

const num = (v) => { const n = parseFloat(v); return isFinite(n) ? n : 0; };
const sum = (arr, f) => arr.reduce((s, x) => s + f(x), 0);

export const OPEN_JOB = ['Pending', 'Scheduled', 'In Progress', 'On Hold'];
const ACTIVE_JOB = ['Scheduled', 'In Progress', 'On Hold'];
export const DONE_JOB = ['Completed', 'Invoiced'];
export const isTemplate = (j) => j.isRecurring === true || j.status === 'Recurring Template';

// Draft and void invoices are not revenue and nobody owes them.
export const isLiveInvoice = (i) => i.status !== 'Draft' && i.status !== 'Void';
export const invoiceIssued = (i) => i.issueDate || i.sentAt || i.createdAt;

// Payments recorded against an invoice. Invoices marked Paid without a payment
// record (older data, Stripe webhook, cloud rows) count as one full payment on
// paidDate.
export function invoicePayments(inv) {
  if (Array.isArray(inv.payments) && inv.payments.length) {
    return inv.payments.map(p => ({ amount: num(p.amount), date: p.date || p.paidDate }));
  }
  if (inv.status === 'Paid') return [{ amount: num(inv.total), date: inv.paidDate || inv.updatedAt }];
  return [];
}

export function invoiceBalance(inv) {
  if (!isLiveInvoice(inv) || inv.status === 'Paid') return 0;
  const paid = sum(invoicePayments(inv), p => p.amount);
  return Math.max(0, Math.round((num(inv.total) - paid) * 100) / 100);
}

// Scale a GST-inclusive amount on this invoice to its ex-GST share.
export function exGst(inv, amount) {
  const total = num(inv.total), sub = num(inv.subtotal);
  return total > 0 && sub > 0 ? amount * (sub / total) : amount;
}

// Every job an invoice bills, with the ex-GST amount billed to each. Combined
// invoices split by jobAmounts when present, otherwise evenly.
export function invoiceJobShares(inv) {
  const ids = [inv.jobId, ...(inv.jobIds || [])].filter(Boolean).map(String);
  const unique = [...new Set(ids)];
  if (!unique.length) return [];
  const sub = num(inv.subtotal);
  const amounts = Array.isArray(inv.jobAmounts) ? inv.jobAmounts : [];
  if (unique.length > 1 && amounts.length) {
    const byJob = new Map(amounts.map(a => [String(a.jobId), num(a.amount)]));
    const known = sum(unique, id => byJob.get(id) || 0);
    if (known > 0) return unique.map(id => ({ jobId: id, amount: sub * (byJob.get(id) || 0) / known }));
  }
  return unique.map(id => ({ jobId: id, amount: sub / unique.length }));
}

// When a job was finished. completedAt is stamped by the store on status change;
// older jobs fall back to their last completed task, then their last booking,
// then the record's last edit.
export function jobCompletedAt(job, lastBookingByJob) {
  if (job.completedAt) return job.completedAt;
  let latest = null;
  const tasks = Array.isArray(job.tasks) ? job.tasks : (Array.isArray(job.phases) ? job.phases : []);
  const walk = (list) => list.forEach(t => {
    if (t && t.completedAt && (!latest || t.completedAt > latest)) latest = t.completedAt;
    if (t && Array.isArray(t.subTasks)) walk(t.subTasks);
  });
  walk(tasks);
  if (latest) return latest;
  const booked = lastBookingByJob && lastBookingByJob.get(String(job.id));
  return booked || job.updatedAt || null;
}

const isLeaveEntry = (s) => /leave|holiday|unavailable|time off/i.test(String(s.type || '') + ' ' + String(s.title || ''));

function bookingHours(s) {
  if (num(s.hours) > 0) return num(s.hours);
  const a = toDate(s.startTime), b = toDate(s.finishTime);
  if (a && b && b > a) return (b - a) / 3600000;
  if (s.endHour != null && s.startHour != null) return Math.max(0, num(s.endHour) - num(s.startHour));
  return 0;
}

const WON_QUOTE = ['Accepted', 'Converted'];
const OPEN_QUOTE = ['Sent', 'Viewed'];

export function quoteSentAt(q) {
  if (q.sentAt) return q.sentAt;
  // Older and cloud quotes carry no stamp: anything past Draft was sent when made.
  return q.status && q.status !== 'Draft' ? q.createdAt : null;
}

const quoteExpired = (q, today) => OPEN_QUOTE.includes(q.status) && !!q.validUntil && toDate(q.validUntil) < today;

// 'won' | 'lost' | null, and the day the outcome was decided. An open quote past
// its valid-until date counts as lost on that date.
export function quoteOutcome(q, today) {
  if (WON_QUOTE.includes(q.status)) return { outcome: 'won', at: q.acceptedAt || q.signedAt || q.updatedAt };
  if (q.status === 'Declined') return { outcome: 'lost', at: q.declinedAt || q.updatedAt };
  if (q.status === 'Expired') return { outcome: 'lost', at: q.validUntil || q.updatedAt };
  if (quoteExpired(q, today)) return { outcome: 'lost', at: q.validUntil };
  return { outcome: null, at: null };
}

// Staff who do field work. Deactivated people and portal customers are not staff.
function activeStaff(technicians) {
  return (technicians || []).filter(t => !t.deactivated && t.role !== 'customer');
}

function weekdaysIn(r) {
  let n = 0;
  for (let d = new Date(r.start); d < r.end; d = addDays(d, 1)) {
    const wd = d.getDay();
    if (wd !== 0 && wd !== 6) n++;
  }
  return n;
}

// Job cost = timesheet hours × pay rate + materials at cost + purchase orders.
// A job is "unknown" when nothing was costed, or when someone logged time on it
// without a pay rate: guessing would report a margin we don't have. A timesheet's
// own pay rate (stamped when it was logged) wins over the person's current rate.
// Each job's cost is also split into labour, materials and purchases.
export function jobCosts({ timesheets = [], technicians = [], jobMaterials = [], purchaseOrders = [], jobs = [] }) {
  const rate = new Map(technicians.map(t => [String(t.id), num(t.payRate)]));
  const costs = new Map();
  const entry = (id) => {
    const k = String(id);
    if (!costs.has(k)) costs.set(k, { cost: 0, labour: 0, materials: 0, purchases: 0, hours: 0, inputs: 0, missingRate: false });
    return costs.get(k);
  };
  timesheets.forEach(t => {
    if (!t.jobId) return;
    const e = entry(t.jobId);
    const r = num(t.payRate) || rate.get(String(t.technicianId)) || 0;
    const h = timesheetHours(t);
    if (h <= 0) return;
    e.hours += h;
    if (r <= 0) { e.missingRate = true; return; }
    e.cost += h * r; e.labour += h * r; e.inputs++;
  });
  jobMaterials.forEach(m => {
    if (!m.jobId) return;
    const c = num(m.totalCost) || num(m.unitCost) * num(m.quantity);
    if (c <= 0) return;
    const e = entry(m.jobId); e.cost += c; e.materials += c; e.inputs++;
  });
  purchaseOrders.forEach(po => {
    if (!po.jobId || po.status === 'Draft' || po.status === 'Cancelled') return;
    const c = num(po.total);
    if (c <= 0) return;
    const e = entry(po.jobId); e.cost += c; e.purchases += c; e.inputs++;
  });
  // Jobs whose material cost is kept on the job itself rather than as line records.
  jobs.forEach(j => {
    const mc = num(j.materialCost);
    if (mc > 0 && !jobMaterials.some(m => String(m.jobId) === String(j.id))) {
      const e = entry(j.id); e.cost += mc; e.materials += mc; e.inputs++;
    }
  });
  return costs;
}

// Revenue and cost of jobs invoiced in a range. Each invoice carries its share of
// the job's cost (share = invoice amount ÷ everything billed to the job), so a job
// invoiced in two parts isn't costed twice. `jobs` lists every job invoiced in the
// range: its revenue, its share of cost, and why it couldn't be costed if it wasn't.
export function invoicedJobProfit(data, r) {
  const live = (data.invoices || []).filter(isLiveInvoice);
  const billedToJob = new Map();
  live.forEach(inv => invoiceJobShares(inv).forEach(s => billedToJob.set(s.jobId, (billedToJob.get(s.jobId) || 0) + s.amount)));
  const costs = jobCosts(data);
  let revenue = 0, cost = 0, labour = 0, materials = 0, purchases = 0;
  const known = new Set(), all = new Set();
  const byJob = new Map();
  live.filter(inv => inRange(invoiceIssued(inv), r)).forEach(inv => {
    invoiceJobShares(inv).forEach(s => {
      all.add(s.jobId);
      const c = costs.get(s.jobId);
      const row = byJob.get(s.jobId) || { jobId: s.jobId, revenue: 0, cost: 0, labour: 0, materials: 0, purchases: 0, hours: c ? c.hours : 0, known: false, reason: null };
      byJob.set(s.jobId, row);
      row.revenue += s.amount;
      if (!c || c.inputs === 0) { row.reason = c && c.missingRate ? 'no-pay-rate' : 'no-costs'; return; }
      if (c.missingRate) { row.reason = 'no-pay-rate'; return; }
      const billed = billedToJob.get(s.jobId) || 0;
      if (billed <= 0) return;
      const share = s.amount / billed;
      known.add(s.jobId);
      row.known = true;
      row.cost += c.cost * share; row.labour += c.labour * share;
      row.materials += c.materials * share; row.purchases += c.purchases * share;
      revenue += s.amount;
      cost += c.cost * share; labour += c.labour * share;
      materials += c.materials * share; purchases += c.purchases * share;
    });
  });
  return {
    revenue, cost, profit: revenue - cost, labour, materials, purchases,
    jobsKnown: known.size, jobsTotal: all.size, jobs: [...byJob.values()],
  };
}

// ── List filters ─────────────────────────────────────────────────────────────
// What a card counts, as a row filter. Tapping a card opens its list with the
// same filter applied (?filter=<name>&period=<id>), and the card's formula is
// built on that filter too, so the list always holds exactly the records behind
// the number. build(data, ctx) returns a predicate for one record of `collection`.

export const lastBookingByJob = (schedule = []) => {
  const m = new Map();
  schedule.forEach(s => {
    if (!s.jobId || !s.date) return;
    const k = String(s.jobId);
    if (!m.has(k) || s.date > m.get(k)) m.set(k, s.date);
  });
  return m;
};

const billedJobIds = (invoices = []) => {
  const billed = new Set();
  invoices.filter(i => i.status !== 'Void').forEach(i => invoiceJobShares(i).forEach(s => billed.add(s.jobId)));
  return billed;
};

const firstBookingByJob = (schedule = []) => {
  const m = new Map();
  schedule.forEach(s => {
    if (!s.jobId || isLeaveEntry(s)) return;
    const start = toDate(s.startTime) || toDate(s.date);
    if (!start) return;
    const k = String(s.jobId);
    if (!m.has(k) || start < m.get(k)) m.set(k, start);
  });
  return m;
};

const mean = (xs) => (xs.length ? sum(xs, x => x) / xs.length : null);
function median(xs) {
  if (!xs.length) return null;
  const s = [...xs].sort((a, b) => a - b), mid = Math.floor(s.length / 2);
  return s.length % 2 ? s[mid] : (s[mid - 1] + s[mid]) / 2;
}
// Days between two moments by the local wall clock, so a span across a daylight
// saving change still counts 25 Sep → 5 Oct as 10 days, not 9.96.
const wallMs = (d) => Date.UTC(d.getFullYear(), d.getMonth(), d.getDate(), d.getHours(), d.getMinutes(), d.getSeconds());
const daysBetween = (a, b) => { const x = toDate(a), y = toDate(b); return x && y ? (wallMs(y) - wallMs(x)) / DAY : null; };

// When an invoice was paid off: its paid date, else the last recorded payment.
// Null while anything is still owing.
export function invoicePaidAt(inv) {
  if (!isLiveInvoice(inv)) return null;
  const pays = invoicePayments(inv);
  if (inv.status !== 'Paid' && !(pays.length && sum(pays, p => p.amount) >= num(inv.total) - 0.005)) return null;
  if (inv.paidDate) return inv.paidDate;
  const dates = pays.map(p => toDate(p.date)).filter(Boolean);
  return dates.length ? new Date(Math.max(...dates)) : null;
}

// Callbacks are flagged on the job, or booked as a callback / rework / warranty job type.
export const isCallbackJob = (j) => j.isCallback === true || /callback|call-back|rework|warranty/i.test(String(j.type || ''));

// Leads close as Won or Lost; the stage history says when.
const LEAD_CLOSED = ['Won', 'Lost'];
export function leadClosedAt(lead) {
  if (!LEAD_CLOSED.includes(lead.status)) return null;
  const hit = (lead.stageHistory || [])
    .filter(h => h && h.status === lead.status && h.timestamp)
    .sort((a, b) => String(b.timestamp).localeCompare(String(a.timestamp)))[0];
  return hit ? hit.timestamp : (lead.closedAt || lead.updatedAt || null);
}

export const timesheetHours = (t) => num(t.hours != null ? t.hours : t.durationHours);

// Ex-GST amount of one invoice line.
const lineAmount = (l) => num(l.total) || num(l.qty) * num(l.rate != null ? l.rate : l.unitPrice);
const invoiceLines = (inv) => (inv.sections || []).flatMap(s => s.lineItems || []).concat(inv.lineItems || []);

// Revenue by customer for invoices issued in a range.
export function revenueByCustomer(invoices, r) {
  const m = new Map();
  invoices.filter(i => isLiveInvoice(i) && inRange(invoiceIssued(i), r)).forEach(i => {
    const k = String(i.customerId || i.customerName || '');
    if (!k) return;
    const e = m.get(k) || { name: i.customerName || '', revenue: 0 };
    e.revenue += num(i.subtotal);
    m.set(k, e);
  });
  return m;
}

// Retired assets raise no maintenance (src/utils/maintenanceSchedule.js,
// RETIRED_ASSET_STATUSES; this file takes no imports).
const RETIRED_ASSET_STATUSES = ['Decommissioned', 'Lost/Stolen'];
// A meter plan within this share of its interval counts as due, as on the
// asset list (maintenanceSchedule.js, DUE_SOON_METER_SHARE).
const METER_DUE_SHARE = 0.1;

// Active plans due in the next 7 days, or already overdue: calendar plans by
// date, meter plans by the asset's reading against the next milestone. A plan
// on a retired or deleted asset counts for nothing.
function maintenanceStatus(plan, today, assetsById) {
  if (plan.status && plan.status !== 'Active') return null;
  const asset = assetsById ? assetsById.get(String(plan.assetId)) : null;
  if (assetsById && (!asset || RETIRED_ASSET_STATUSES.includes(asset.status))) return null;

  if (plan.triggerType === 'Meter') {
    const interval = num(plan.meterInterval);
    if (!asset || interval <= 0) return null;
    const remaining = num(plan.lastTriggeredMeter) + interval - num(asset.currentMeter);
    if (remaining <= 0) return 'overdue';
    return remaining <= interval * METER_DUE_SHARE ? 'due' : null;
  }

  const d = toDate(plan.nextServiceDate || plan.nextDue);
  if (!d) return null;
  if (d < today) return 'overdue';
  return d < addDays(today, 7) ? 'due' : null;
}

const assetIndex = (assets) => new Map((assets || []).map(a => [String(a.id), a]));

export const KPI_FILTERS = {
  invoices: {
    issued: {
      label: 'Invoiced', periodic: true, needs: ['invoices'],
      build: (d, { range }) => i => isLiveInvoice(i) && inRange(invoiceIssued(i), range),
    },
    paid: {
      label: 'Payment received', periodic: true, needs: ['invoices'],
      build: (d, { range }) => i => isLiveInvoice(i) && invoicePayments(i).some(p => inRange(p.date, range)),
    },
    unpaid: {
      label: 'Outstanding', periodic: false, needs: ['invoices'],
      build: () => i => invoiceBalance(i) > 0,
    },
    overdue: {
      label: 'Overdue', periodic: false, needs: ['invoices'],
      build: (d, { today }) => i => invoiceBalance(i) > 0 && !!i.dueDate && toDate(i.dueDate) < today,
    },
    'paid-off': {
      label: 'Paid off', periodic: true, needs: ['invoices'],
      build: (d, { range }) => i => inRange(invoicePaidAt(i), range),
    },
  },
  jobs: {
    active: {
      label: 'Active', periodic: false, needs: ['jobs'],
      build: () => j => !isTemplate(j) && ACTIVE_JOB.includes(j.status),
    },
    completed: {
      label: 'Completed', periodic: true, needs: ['jobs', 'schedule'],
      build: (d, { range }) => {
        const last = lastBookingByJob(d.schedule);
        return j => !isTemplate(j) && DONE_JOB.includes(j.status) && inRange(jobCompletedAt(j, last), range);
      },
    },
    'ready-to-invoice': {
      label: 'Ready to invoice', periodic: false, needs: ['jobs', 'invoices'],
      build: (d) => {
        const billed = billedJobIds(d.invoices);
        return j => !isTemplate(j) && j.status === 'Completed' && !billed.has(String(j.id));
      },
    },
    unscheduled: {
      label: 'Unscheduled', periodic: false, needs: ['jobs', 'schedule'],
      build: (d, { today }) => {
        const todayKey = dayKey(today);
        const booked = new Set((d.schedule || []).filter(s => s.jobId && s.date && s.date >= todayKey).map(s => String(s.jobId)));
        return j => !isTemplate(j) && OPEN_JOB.includes(j.status) && !booked.has(String(j.id));
      },
    },
    callbacks: {
      label: 'Callbacks', periodic: true, needs: ['jobs', 'schedule'],
      build: (d, ctx) => {
        const done = KPI_FILTERS.jobs.completed.build(d, ctx);
        return j => isCallbackJob(j) && done(j);
      },
    },
  },
  quotes: {
    sent: {
      label: 'Sent', periodic: true, needs: ['quotes'],
      build: (d, { range }) => q => !q.isTemplate && inRange(quoteSentAt(q), range),
    },
    decided: {
      label: 'Decided', periodic: true, needs: ['quotes'],
      build: (d, { range, today }) => q => {
        if (q.isTemplate) return false;
        const o = quoteOutcome(q, today);
        return !!o.outcome && inRange(o.at, range);
      },
    },
    open: {
      label: 'Awaiting an answer', periodic: false, needs: ['quotes'],
      build: (d, { today }) => q => !q.isTemplate && OPEN_QUOTE.includes(q.status) && !quoteExpired(q, today),
    },
    accepted: {
      label: 'Accepted', periodic: true, needs: ['quotes'],
      build: (d, { range, today }) => q => {
        if (q.isTemplate) return false;
        const o = quoteOutcome(q, today);
        return o.outcome === 'won' && inRange(o.at, range);
      },
    },
  },
  leads: {
    new: {
      label: 'New', periodic: true, needs: ['leads'],
      build: (d, { range }) => l => inRange(l.createdAt, range),
    },
    closed: {
      label: 'Closed', periodic: true, needs: ['leads'],
      build: (d, { range }) => l => inRange(leadClosedAt(l), range),
    },
  },
  timesheets: {
    logged: {
      label: 'Logged', periodic: true, needs: ['timesheets'],
      build: (d, { range }) => t => timesheetHours(t) > 0 && inRange(t.date, range),
    },
    'non-billable': {
      label: 'Not on a job', periodic: true, needs: ['timesheets'],
      build: (d, { range }) => t => timesheetHours(t) > 0 && !t.jobId && inRange(t.date, range),
    },
    pending: {
      label: 'Awaiting approval', periodic: false, needs: ['timesheets'],
      build: () => t => t.status === 'Pending',
    },
  },
  customers: {
    new: {
      label: 'New', periodic: true, needs: ['customers'],
      build: (d, { range }) => c => inRange(c.createdAt, range),
    },
    // Invoiced this period, and also invoiced at some point before it.
    repeat: {
      label: 'Repeat', periodic: true, needs: ['customers', 'invoices'],
      build: (d, { range }) => {
        const before = new Set(), now = new Set();
        (d.invoices || []).filter(isLiveInvoice).forEach(i => {
          const at = toDate(invoiceIssued(i));
          if (!at || !i.customerId) return;
          if (at < range.start) before.add(String(i.customerId));
          else if (at < range.end) now.add(String(i.customerId));
        });
        return c => now.has(String(c.id)) && before.has(String(c.id));
      },
    },
    invoiced: {
      label: 'Invoiced', periodic: true, needs: ['customers', 'invoices'],
      build: (d, { range }) => {
        const billed = new Set((d.invoices || []).filter(i => isLiveInvoice(i) && inRange(invoiceIssued(i), range)).map(i => String(i.customerId)));
        return c => billed.has(String(c.id));
      },
    },
  },
  assets: {
    // The assets behind the Maintenance due card's plans.
    'maintenance-due': {
      label: 'Maintenance due', periodic: false, needs: ['assets', 'maintenancePlans'],
      build: (d, { today }) => {
        const assetsById = assetIndex(d.assets);
        const ids = new Set((d.maintenancePlans || []).filter(p => maintenanceStatus(p, today, assetsById)).map(p => String(p.assetId)));
        return a => ids.has(String(a.id));
      },
    },
  },
};

// Context for a filter outside computeAll (the list pages).
export function filterContext(period = DEFAULT_PERIOD, now = new Date()) {
  return { ...periodRanges(period, now), period, today: startOfDay(now), now };
}

// The collection a card's link filters; the route names it unless they differ
// (customers live at /people).
export const linkCollection = (link) => link.collection || link.route.slice(1);

// The filter definition a card's link names, or null.
export function linkFilter(link) {
  if (!link || !link.filter) return null;
  const group = KPI_FILTERS[linkCollection(link)];
  return group && Object.prototype.hasOwnProperty.call(group, link.filter) ? group[link.filter] : null;
}

// Records of `collection` matching the named filter.
export function rows(collection, name, data, ctx) {
  return (data[collection] || []).filter(KPI_FILTERS[collection][name].build(data, ctx));
}

// ── Definitions ──────────────────────────────────────────────────────────────

export const KPI_GROUPS = [
  { id: 'money',         label: 'Money' },
  { id: 'jobs',          label: 'Jobs' },
  { id: 'sales',         label: 'Sales and quotes' },
  { id: 'team',          label: 'Team' },
  { id: 'profitability', label: 'Profitability' },
  { id: 'customers',     label: 'Customers' },
];

// format: 'currency' | 'count' | 'percent' | 'days'
// type:   'period' (has a delta) | 'snapshot' (current state, no delta)
// link:   where tapping the card goes; `filter` names a KPI_FILTERS entry for
//         the route's collection.
export const KPIS = {
  // ── Money ──
  revenue_invoiced: {
    group: 'money', label: 'Revenue invoiced', type: 'period', format: 'currency', upIsGood: true, launch: true,
    description: 'Invoiced this period, ex GST',
    empty: 'Send your first invoice to see this',
    needs: ['invoices'],
    compute: (data, ctx) => {
      if (!(data.invoices || []).some(isLiveInvoice)) return null;
      const issued = rows('invoices', 'issued', data, ctx);
      return { value: sum(issued, i => num(i.subtotal)), count: issued.length };
    },
    link: { route: '/invoices', filter: 'issued' },
  },
  payments_received: {
    group: 'money', label: 'Payments received', type: 'period', format: 'currency', upIsGood: true, launch: true,
    description: 'Money in this period, ex GST',
    empty: 'Record your first payment to see this',
    needs: ['invoices'],
    compute: (data, ctx) => {
      const live = (data.invoices || []).filter(isLiveInvoice);
      if (!live.some(i => invoicePayments(i).length)) return null;
      let value = 0;
      rows('invoices', 'paid', data, ctx).forEach(inv =>
        invoicePayments(inv).forEach(p => { if (inRange(p.date, ctx.range)) value += exGst(inv, p.amount); }));
      return { value };
    },
    link: { route: '/invoices', filter: 'paid' },
  },
  outstanding: {
    group: 'money', label: 'Outstanding', type: 'snapshot', format: 'currency', upIsGood: false, launch: true,
    description: 'Unpaid on sent invoices, ex GST',
    empty: 'Send your first invoice to see this',
    needs: ['invoices'],
    compute: (data, ctx) => {
      if (!(data.invoices || []).some(isLiveInvoice)) return null;
      const owing = rows('invoices', 'unpaid', data, ctx);
      return { value: sum(owing, i => exGst(i, invoiceBalance(i))), count: owing.length };
    },
    link: { route: '/invoices', filter: 'unpaid' },
  },
  overdue: {
    group: 'money', label: 'Overdue', type: 'snapshot', format: 'currency', upIsGood: false, launch: true,
    description: 'Past the due date and still unpaid',
    empty: 'Send your first invoice to see this',
    needs: ['invoices'],
    compute: (data, ctx) => {
      if (!(data.invoices || []).some(isLiveInvoice)) return null;
      const late = rows('invoices', 'overdue', data, ctx);
      return { value: sum(late, i => exGst(i, invoiceBalance(i))), count: late.length, alert: late.length > 0 };
    },
    link: { route: '/invoices', filter: 'overdue' },
  },
  ready_to_invoice: {
    group: 'money', label: 'Ready to invoice', type: 'snapshot', format: 'count', upIsGood: false, launch: true,
    description: 'Completed jobs with no invoice yet',
    empty: 'Complete your first job to see this',
    needs: ['jobs', 'invoices', 'quotes'],
    compute: (data, ctx) => {
      if (!(data.jobs || []).some(j => !isTemplate(j) && DONE_JOB.includes(j.status))) return null;
      const ready = rows('jobs', 'ready-to-invoice', data, ctx);
      // Estimated value: the job's accepted quote, where it has one.
      const quoteById = new Map((data.quotes || []).map(q => [String(q.id), q]));
      const estimate = sum(ready, j => { const q = j.quoteId && quoteById.get(String(j.quoteId)); return q ? num(q.subtotal) : 0; });
      return { value: ready.length, estimate };
    },
    link: { route: '/jobs', filter: 'ready-to-invoice' },
  },

  credit_over: {
    group: 'money', label: 'Over credit limit', type: 'snapshot', format: 'currency', upIsGood: false, launch: false,
    description: 'Owed beyond the credit limit on the account, incl. GST',
    empty: 'Set a credit limit on a customer to see this',
    needs: ['customers', 'invoices'],
    compute: ({ customers = [], invoices = [] }) => {
      const limited = customers.filter(c => num(c.creditLimit) > 0);
      if (!limited.length) return null;
      // Balances are the same GST-inclusive ones the customer page and the
      // over-limit warning use, so all three agree.
      const owing = new Map();
      invoices.forEach(i => {
        if (!i || !i.customerId) return;
        const balance = invoiceBalance(i);
        if (balance > 0) owing.set(String(i.customerId), (owing.get(String(i.customerId)) || 0) + balance);
      });
      let value = 0, count = 0;
      limited.forEach(c => {
        const over = (owing.get(String(c.id)) || 0) - num(c.creditLimit);
        if (over > 0) { value += over; count++; }
      });
      return { value: Math.round(value * 100) / 100, count, alert: count > 0 };
    },
    link: { route: '/people', collection: 'customers' },
  },

  // ── Jobs ──
  active_jobs: {
    group: 'jobs', label: 'Active jobs', type: 'snapshot', format: 'count', upIsGood: true, launch: true,
    description: 'Scheduled, in progress or on hold',
    empty: 'Create your first job to see this',
    needs: ['jobs'],
    compute: (data, ctx) => {
      if (!(data.jobs || []).some(j => !isTemplate(j))) return null;
      return { value: rows('jobs', 'active', data, ctx).length };
    },
    link: { route: '/jobs', filter: 'active' },
  },
  jobs_completed: {
    group: 'jobs', label: 'Jobs completed', type: 'period', format: 'count', upIsGood: true, launch: true,
    description: 'Finished this period',
    empty: 'Complete your first job to see this',
    needs: ['jobs', 'schedule'],
    compute: (data, ctx) => {
      if (!(data.jobs || []).some(j => !isTemplate(j) && DONE_JOB.includes(j.status))) return null;
      return { value: rows('jobs', 'completed', data, ctx).length };
    },
    link: { route: '/jobs', filter: 'completed' },
  },
  scheduled_today: {
    group: 'jobs', label: 'Scheduled today', type: 'snapshot', format: 'count', upIsGood: true, launch: true,
    description: 'Bookings on the schedule today',
    empty: 'Book your first job to see this',
    needs: ['schedule'],
    compute: ({ schedule = [] }, { today, now }) => {
      const bookings = schedule.filter(s => !isLeaveEntry(s));
      if (!bookings.length) return null;
      const key = dayKey(today);
      const todays = bookings.filter(s => s.date === key || (toDate(s.startTime) && dayKey(toDate(s.startTime)) === key));
      const toStart = todays.filter(s => { const st = toDate(s.startTime); return st ? st > now : false; }).length;
      return { value: todays.length, toStart };
    },
    link: { route: '/schedule' },
  },
  unscheduled_backlog: {
    group: 'jobs', label: 'Unscheduled backlog', type: 'snapshot', format: 'count', upIsGood: false, launch: true,
    description: 'Open jobs with nothing booked ahead',
    empty: 'Create your first job to see this',
    needs: ['jobs', 'schedule'],
    compute: (data, ctx) => {
      if (!(data.jobs || []).some(j => !isTemplate(j))) return null;
      return { value: rows('jobs', 'unscheduled', data, ctx).length };
    },
    link: { route: '/jobs', filter: 'unscheduled' },
  },

  // ── Sales and quotes ──
  new_leads: {
    group: 'sales', label: 'New leads', type: 'period', format: 'count', upIsGood: true, launch: true,
    description: 'Enquiries received this period',
    empty: 'Add your first lead to see this',
    needs: ['leads'],
    perm: ['Leads', 'view'],
    compute: (data, ctx) => {
      if (!(data.leads || []).length) return null;
      return { value: rows('leads', 'new', data, ctx).length };
    },
    link: { route: '/leads', filter: 'new' },
  },
  quotes_sent: {
    group: 'sales', label: 'Quotes sent', type: 'period', format: 'count', upIsGood: true, launch: true,
    description: 'Quotes sent this period, with value',
    empty: 'Send your first quote to see this',
    needs: ['quotes'],
    compute: (data, ctx) => {
      if (!(data.quotes || []).some(q => !q.isTemplate && quoteSentAt(q))) return null;
      const sent = rows('quotes', 'sent', data, ctx);
      return { value: sent.length, amount: sum(sent, q => num(q.subtotal)) };
    },
    link: { route: '/quotes', filter: 'sent' },
  },
  quote_win_rate: {
    group: 'sales', label: 'Quote win rate', type: 'period', format: 'percent', upIsGood: true, launch: true,
    description: 'Won ÷ decided, this period',
    empty: 'Send your first quote to see this',
    needs: ['quotes'],
    // Converted counts as a win and the base is decided quotes, matching Reports.
    compute: (data, ctx) => {
      if (!(data.quotes || []).some(q => !q.isTemplate && quoteSentAt(q))) return null;
      const decided = rows('quotes', 'decided', data, ctx);
      const won = decided.filter(q => quoteOutcome(q, ctx.today).outcome === 'won').length;
      return { value: decided.length ? won / decided.length : null, count: decided.length };
    },
    emptyPeriod: 'No quotes decided this period',
    link: { route: '/quotes', filter: 'decided' },
  },
  open_pipeline: {
    group: 'sales', label: 'Open pipeline', type: 'snapshot', format: 'currency', upIsGood: true, launch: true,
    description: 'Sent quotes still awaiting an answer',
    empty: 'Send your first quote to see this',
    needs: ['quotes'],
    compute: (data, ctx) => {
      if (!(data.quotes || []).some(q => !q.isTemplate && quoteSentAt(q))) return null;
      const open = rows('quotes', 'open', data, ctx);
      return { value: sum(open, q => num(q.subtotal)), count: open.length };
    },
    link: { route: '/quotes', filter: 'open' },
  },

  // ── Team ──
  utilisation: {
    group: 'team', label: 'Utilisation', type: 'period', format: 'percent', upIsGood: true, launch: true,
    description: 'Booked job hours ÷ available hours',
    empty: 'Book your first job to see this',
    needs: ['schedule', 'technicians'],
    // Today and this week include bookings still ahead; longer periods are measured
    // to date, or the weeks not booked yet would drag every month down.
    compute: ({ schedule = [], technicians = [] }, { period, range, full, workdayHours = 8 }) => {
      if (!schedule.some(s => s.jobId)) return null;
      const win = period === 'today' || period === 'week' ? full : range;
      const staff = activeStaff(technicians);
      const staffIds = new Set(staff.map(t => String(t.id)));
      const headcount = Math.max(staff.length, 1);
      const inPeriod = schedule.filter(s => s.date && inRange(s.date, win) && (!staffIds.size || !s.technicianId || staffIds.has(String(s.technicianId))));
      const leave = sum(inPeriod.filter(isLeaveEntry), bookingHours);
      const booked = sum(inPeriod.filter(s => s.jobId && !isLeaveEntry(s)), bookingHours);
      const available = weekdaysIn(win) * workdayHours * headcount - leave;
      return { value: available > 0 ? booked / available : null, hours: booked };
    },
    emptyPeriod: 'No working days in this period',
    link: { route: '/schedule' },
  },

  // ── Profitability ──
  gross_margin: {
    group: 'profitability', label: 'Gross margin', type: 'period', format: 'percent', upIsGood: true, launch: true,
    description: 'Profit on invoiced jobs ÷ revenue',
    empty: 'Invoice a costed job to see this',
    needs: ['invoices', 'jobs', 'timesheets', 'technicians', 'jobMaterials', 'purchaseOrders'],
    compute: (data, { range }) => {
      if (!(data.invoices || []).some(i => isLiveInvoice(i) && invoiceJobShares(i).length)) return null;
      const p = invoicedJobProfit(data, range);
      return {
        value: p.revenue > 0 ? p.profit / p.revenue : null,
        jobsKnown: p.jobsKnown, jobsTotal: p.jobsTotal,
      };
    },
    emptyPeriod: 'No costed jobs invoiced this period',
    link: { route: '/reports' },
  },

  // ── Beyond the launch set ──────────────────────────────────────────────────
  // Optional per-card fields used below:
  //   perm      — [module, action] the viewer needs, overriding the group's
  //   available — (env) => bool; hides the card from the menu, e.g. one-user accounts
  //   display   — 'split' draws a two-part bar instead of a single number
  //   upIsGood  — null when neither direction is good news (no delta colour)

  // Money
  average_invoice_value: {
    group: 'money', label: 'Average invoice value', type: 'period', format: 'currency', upIsGood: true, launch: false,
    description: 'Revenue invoiced ÷ invoices issued',
    empty: 'Send your first invoice to see this',
    needs: ['invoices'],
    compute: (data, ctx) => {
      if (!(data.invoices || []).some(isLiveInvoice)) return null;
      const issued = rows('invoices', 'issued', data, ctx);
      return { value: issued.length ? sum(issued, i => num(i.subtotal)) / issued.length : null, count: issued.length };
    },
    emptyPeriod: 'No invoices issued this period',
    link: { route: '/invoices', filter: 'issued' },
  },
  average_days_to_pay: {
    group: 'money', label: 'Average days to pay', type: 'period', format: 'days', upIsGood: false, launch: false,
    description: 'Issue to paid in full, for invoices paid off',
    empty: 'Get your first invoice paid to see this',
    needs: ['invoices'],
    compute: (data, ctx) => {
      if (!(data.invoices || []).some(invoicePaidAt)) return null;
      const days = rows('invoices', 'paid-off', data, ctx)
        .map(i => daysBetween(invoiceIssued(i), invoicePaidAt(i)))
        .filter(d => d != null).map(d => Math.max(0, d));
      return { value: mean(days), count: days.length };
    },
    emptyPeriod: 'No invoices paid off this period',
    link: { route: '/invoices', filter: 'paid-off' },
  },

  // Jobs
  average_job_duration: {
    group: 'jobs', label: 'Average job duration', type: 'period', format: 'duration', upIsGood: false, launch: false,
    description: 'First booking to completion',
    empty: 'Complete a booked job to see this',
    needs: ['jobs', 'schedule'],
    compute: (data, ctx) => {
      const first = firstBookingByJob(data.schedule);
      if (!(data.jobs || []).some(j => DONE_JOB.includes(j.status) && first.has(String(j.id)))) return null;
      const last = lastBookingByJob(data.schedule);
      const days = rows('jobs', 'completed', data, ctx)
        .filter(j => first.has(String(j.id)))
        .map(j => daysBetween(first.get(String(j.id)), jobCompletedAt(j, last)))
        .filter(d => d != null).map(d => Math.max(0, d));
      return { value: mean(days), count: days.length };
    },
    emptyPeriod: 'No booked jobs completed this period',
    link: { route: '/jobs', filter: 'completed' },
  },
  callback_rate: {
    group: 'jobs', label: 'Callback rate', type: 'period', format: 'percent', upIsGood: false, launch: false,
    description: 'Callbacks ÷ jobs completed',
    empty: 'Flag a callback job to start tracking this',
    needs: ['jobs', 'schedule'],
    // Until someone flags a callback, 0% would claim a quality record nobody measured.
    compute: (data, ctx) => {
      if (!(data.jobs || []).some(isCallbackJob)) return null;
      const done = rows('jobs', 'completed', data, ctx);
      const callbacks = done.filter(isCallbackJob).length;
      return { value: done.length ? callbacks / done.length : null, count: callbacks };
    },
    emptyPeriod: 'No jobs completed this period',
    link: { route: '/jobs', filter: 'callbacks' },
  },

  // Sales and quotes
  days_to_accept: {
    group: 'sales', label: 'Days to accept', type: 'period', format: 'days', upIsGood: false, launch: false,
    description: 'Median days from sent to accepted',
    empty: 'Get your first quote accepted to see this',
    needs: ['quotes'],
    // Median, so one quote left sitting for months doesn't skew it.
    compute: (data, ctx) => {
      const won = (data.quotes || []).filter(q => !q.isTemplate && WON_QUOTE.includes(q.status));
      if (!won.length) return null;
      const days = rows('quotes', 'accepted', data, ctx)
        .map(q => daysBetween(quoteSentAt(q), quoteOutcome(q, ctx.today).at))
        .filter(d => d != null).map(d => Math.max(0, d));
      return { value: median(days), count: days.length };
    },
    emptyPeriod: 'No quotes accepted this period',
    link: { route: '/quotes', filter: 'accepted' },
  },
  lead_conversion: {
    group: 'sales', label: 'Lead conversion', type: 'period', format: 'percent', upIsGood: true, launch: false,
    description: 'Won ÷ leads closed this period',
    empty: 'Close your first lead to see this',
    needs: ['leads'],
    perm: ['Leads', 'view'],
    compute: (data, ctx) => {
      if (!(data.leads || []).some(l => LEAD_CLOSED.includes(l.status))) return null;
      const closed = rows('leads', 'closed', data, ctx);
      const won = closed.filter(l => l.status === 'Won').length;
      return { value: closed.length ? won / closed.length : null, count: closed.length };
    },
    emptyPeriod: 'No leads closed this period',
    link: { route: '/leads', filter: 'closed' },
  },

  // Team
  hours_logged: {
    group: 'team', label: 'Hours logged', type: 'period', format: 'hours', upIsGood: true, launch: false,
    description: 'Timesheet hours this period',
    empty: 'Log your first timesheet to see this',
    needs: ['timesheets'],
    perm: ['Timesheets', 'view'],
    compute: (data, ctx) => {
      if (!(data.timesheets || []).some(t => timesheetHours(t) > 0)) return null;
      return { value: sum(rows('timesheets', 'logged', data, ctx), timesheetHours) };
    },
    link: { route: '/timesheets', filter: 'logged' },
  },
  billable_hours: {
    group: 'team', label: 'Billable hours', type: 'period', format: 'percent', upIsGood: true, launch: false,
    description: 'Share of logged hours on a job',
    empty: 'Log your first timesheet to see this',
    needs: ['timesheets'],
    perm: ['Timesheets', 'view'],
    compute: (data, ctx) => {
      if (!(data.timesheets || []).some(t => timesheetHours(t) > 0)) return null;
      const logged = rows('timesheets', 'logged', data, ctx);
      const total = sum(logged, timesheetHours);
      const billable = sum(logged.filter(t => t.jobId), timesheetHours);
      return { value: total > 0 ? billable / total : null, hours: total - billable };
    },
    emptyPeriod: 'No hours logged this period',
    link: { route: '/timesheets', filter: 'non-billable' },
  },
  jobs_per_tech: {
    group: 'team', label: 'Jobs per tech', type: 'period', format: 'decimal', upIsGood: true, launch: false,
    description: 'Jobs completed ÷ staff who logged time',
    empty: 'Complete a job and log time to see this',
    needs: ['jobs', 'schedule', 'timesheets'],
    available: ({ staffCount }) => staffCount > 1,
    compute: (data, ctx) => {
      if (!(data.jobs || []).some(j => DONE_JOB.includes(j.status)) || !(data.timesheets || []).length) return null;
      const techs = new Set(rows('timesheets', 'logged', data, ctx).map(t => String(t.technicianId)).filter(Boolean));
      const done = rows('jobs', 'completed', data, ctx).length;
      return { value: techs.size ? done / techs.size : null, techs: techs.size };
    },
    emptyPeriod: 'No time logged this period',
    link: { route: '/jobs', filter: 'completed' },
  },
  pending_timesheets: {
    group: 'team', label: 'Pending timesheets', type: 'snapshot', format: 'count', upIsGood: false, launch: false,
    description: 'Waiting for approval',
    empty: 'Log your first timesheet to see this',
    needs: ['timesheets'],
    perm: ['Timesheets', 'approve'],
    compute: (data, ctx) => {
      if (!(data.timesheets || []).length) return null;
      const pending = rows('timesheets', 'pending', data, ctx);
      return { value: pending.length, hours: sum(pending, timesheetHours) };
    },
    link: { route: '/timesheets', filter: 'pending' },
  },

  // Profitability
  gross_profit: {
    group: 'profitability', label: 'Gross profit', type: 'period', format: 'currency', upIsGood: true, launch: false,
    description: 'Revenue less cost, on invoiced jobs',
    empty: 'Invoice a costed job to see this',
    needs: ['invoices', 'jobs', 'timesheets', 'technicians', 'jobMaterials', 'purchaseOrders'],
    compute: (data, { range }) => {
      if (!(data.invoices || []).some(i => isLiveInvoice(i) && invoiceJobShares(i).length)) return null;
      const p = invoicedJobProfit(data, range);
      return { value: p.jobsKnown ? p.profit : null, jobsKnown: p.jobsKnown, jobsTotal: p.jobsTotal };
    },
    emptyPeriod: 'No costed jobs invoiced this period',
    link: { route: '/reports' },
  },
  labour_vs_materials: {
    group: 'profitability', label: 'Labour vs materials', type: 'period', format: 'percent', upIsGood: null, launch: false,
    display: 'split',
    description: 'Share of invoiced revenue from each',
    empty: 'Send your first invoice to see this',
    needs: ['invoices'],
    compute: (data, ctx) => {
      if (!(data.invoices || []).some(isLiveInvoice)) return null;
      let labour = 0, materials = 0;
      rows('invoices', 'issued', data, ctx).forEach(inv => invoiceLines(inv).forEach(l => {
        const t = String(l.type || '').toLowerCase();
        if (t === 'labor' || t === 'labour') labour += lineAmount(l);
        else if (t === 'material' || t === 'materials') materials += lineAmount(l);
      }));
      const base = labour + materials;
      return { value: base > 0 ? labour / base : null, labour, materials };
    },
    emptyPeriod: 'No labour or material lines invoiced this period',
    link: { route: '/invoices', filter: 'issued' },
  },
  average_job_profit: {
    group: 'profitability', label: 'Average job profit', type: 'period', format: 'currency', upIsGood: true, launch: false,
    description: 'Gross profit ÷ costed jobs invoiced',
    empty: 'Invoice a costed job to see this',
    needs: ['invoices', 'jobs', 'timesheets', 'technicians', 'jobMaterials', 'purchaseOrders'],
    compute: (data, { range }) => {
      if (!(data.invoices || []).some(i => isLiveInvoice(i) && invoiceJobShares(i).length)) return null;
      const p = invoicedJobProfit(data, range);
      return { value: p.jobsKnown ? p.profit / p.jobsKnown : null, jobsKnown: p.jobsKnown, jobsTotal: p.jobsTotal };
    },
    emptyPeriod: 'No costed jobs invoiced this period',
    link: { route: '/reports' },
  },

  // Customers
  new_customers: {
    group: 'customers', label: 'New customers', type: 'period', format: 'count', upIsGood: true, launch: false,
    description: 'Customers added this period',
    empty: 'Add your first customer to see this',
    needs: ['customers'],
    compute: (data, ctx) => {
      if (!(data.customers || []).length) return null;
      return { value: rows('customers', 'new', data, ctx).length };
    },
    link: { route: '/people', collection: 'customers', filter: 'new' },
  },
  repeat_customers: {
    group: 'customers', label: 'Repeat customers', type: 'period', format: 'percent', upIsGood: true, launch: false,
    description: 'Invoiced customers who had bought before',
    empty: 'Send your first invoice to see this',
    needs: ['customers', 'invoices'],
    perm: ['Invoices', 'view'],
    compute: (data, ctx) => {
      if (!(data.invoices || []).some(isLiveInvoice)) return null;
      const invoiced = rows('customers', 'invoiced', data, ctx);
      const repeat = rows('customers', 'repeat', data, ctx);
      return { value: invoiced.length ? repeat.length / invoiced.length : null, count: repeat.length };
    },
    emptyPeriod: 'No customers invoiced this period',
    link: { route: '/people', collection: 'customers', filter: 'repeat' },
  },
  maintenance_due: {
    group: 'customers', label: 'Maintenance due', type: 'snapshot', format: 'count', upIsGood: false, launch: false,
    description: 'Plans due in the next 7 days, or near their meter milestone',
    empty: 'Set up a maintenance plan to see this',
    needs: ['maintenancePlans', 'assets'],
    perm: ['Assets', 'view'],
    compute: ({ maintenancePlans = [], assets = [] }, { today }) => {
      if (!maintenancePlans.length) return null;
      const assetsById = assetIndex(assets);
      let due = 0, overdue = 0;
      maintenancePlans.forEach(p => {
        const s = maintenanceStatus(p, today, assetsById);
        if (s === 'due') due++;
        else if (s === 'overdue') overdue++;
      });
      return { value: due, overdue, subAlert: overdue > 0 };
    },
    link: { route: '/assets', filter: 'maintenance-due' },
  },
  top_customer_share: {
    group: 'customers', label: 'Top customer share', type: 'period', format: 'percent', upIsGood: false, launch: false,
    description: 'Biggest customer’s share of revenue',
    empty: 'Send your first invoice to see this',
    needs: ['invoices'],
    perm: ['Invoices', 'view'],
    // Over 30% means the business leans hard on one builder or strata manager.
    compute: ({ invoices = [] }, { range }) => {
      if (!invoices.some(isLiveInvoice)) return null;
      const by = [...revenueByCustomer(invoices, range).values()];
      const total = sum(by, c => c.revenue);
      if (total <= 0) return { value: null };
      const top = by.reduce((a, b) => (b.revenue > a.revenue ? b : a));
      const share = top.revenue / total;
      return { value: share, customer: top.name, warn: share > 0.3 };
    },
    emptyPeriod: 'No revenue invoiced this period',
    link: { route: '/people', collection: 'customers', filter: 'invoiced' },
  },
};

// Who may see a card: [module, action], by group unless the card names its own.
export const KPI_GROUP_PERMS = {
  money:         ['Invoices', 'view'],
  profitability: ['Invoices', 'view'],
  sales:         ['Quotes', 'view'],
  jobs:          ['Jobs', 'view'],
  team:          ['Jobs', 'view'],
  customers:     ['Customers', 'view'],
};
export const kpiPermission = (id) => (KPIS[id] ? KPIS[id].perm || KPI_GROUP_PERMS[KPIS[id].group] || null : null);

// Ids in the order the widget menu lists them.
export const KPI_IDS = KPI_GROUPS.flatMap(g => Object.keys(KPIS).filter(id => KPIS[id].group === g.id));

// Six starting cards, picked by team size (spec: "How many people work in the
// business?"). Until sign-up asks, the caller passes the active staff count.
export function defaultKpiIds(staffCount) {
  if (staffCount <= 1) return ['ready_to_invoice', 'overdue', 'payments_received', 'scheduled_today', 'quotes_sent', 'gross_margin'];
  if (staffCount <= 10) return ['revenue_invoiced', 'overdue', 'ready_to_invoice', 'active_jobs', 'utilisation', 'quote_win_rate'];
  return ['revenue_invoiced', 'gross_margin', 'outstanding', 'unscheduled_backlog', 'utilisation', 'open_pipeline'];
}

// ── Compute ──────────────────────────────────────────────────────────────────

// Collections the given cards read, so a caller loads each table once.
export function kpiNeeds(ids) {
  return [...new Set(ids.flatMap(id => (KPIS[id] ? KPIS[id].needs : [])))];
}

// Run every requested card in one pass over `data` ({ collection: records[] }).
// Returns { [id]: { empty, value, prev, delta, good, extra } }:
//   empty — no data of this kind yet (show the hint)
//   value — the number, or null when the period has nothing to measure
//   delta — change against the previous period (relative for money/counts,
//           absolute points/days for percent/days); null for snapshots
//   good  — whether that change is good news (null when flat or unknown)
export function computeAll(ids, data, { period = DEFAULT_PERIOD, now = new Date(), workdayHours = 8 } = {}) {
  const today = startOfDay(now);
  const ranges = periodRanges(period, now);
  const ctx = { ...ranges, period, today, now, workdayHours };
  const prevCtx = { ...ctx, range: ranges.prev.range, full: ranges.prev.full };
  const out = {};
  ids.forEach(id => {
    const def = KPIS[id];
    if (!def) return;
    let cur;
    try { cur = def.compute(data, ctx); } catch (e) { cur = null; }
    if (!cur) { out[id] = { empty: true, value: null, prev: null, delta: null, good: null, extra: {} }; return; }
    const { value, ...extra } = cur;
    let prev = null, delta = null, good = null;
    if (def.type === 'period' && value != null) {
      try { const p = def.compute(data, prevCtx); prev = p ? p.value : null; } catch (e) { prev = null; }
      delta = kpiDelta(value, prev, def.format);
      if (delta != null && def.upIsGood != null && Math.round(Math.abs(delta) * 100) > 0) good = (delta > 0) === def.upIsGood;
    }
    out[id] = { empty: false, value, prev, delta, good, extra };
  });
  return out;
}

export function kpiDelta(value, prev, format) {
  if (value == null || prev == null) return null;
  if (format === 'percent' || format === 'days' || format === 'duration') return value - prev;
  if (prev === 0) return null; // "∞% up" tells nobody anything
  return (value - prev) / Math.abs(prev);
}

// ── Formatting ───────────────────────────────────────────────────────────────

export function formatCurrency(n) {
  const v = Math.round(num(n));
  const a = Math.abs(v), sign = v < 0 ? '-' : '';
  if (a >= 1e6) return `${sign}$${(a / 1e6).toFixed(a >= 1e7 ? 0 : 1).replace(/\.0$/, '')}M`;
  if (a >= 1e4) return `${sign}$${(a / 1e3).toFixed(a >= 1e5 ? 0 : 1).replace(/\.0$/, '')}k`;
  return `${sign}$${a.toLocaleString('en-AU')}`;
}

export function formatKpiValue(value, format) {
  if (value == null) return '—';
  switch (format) {
    case 'currency': return formatCurrency(value);
    case 'percent':  return `${Math.round(value * 100)}%`;
    case 'days':     return `${(Math.round(value * 10) / 10).toLocaleString('en-AU')} days`;
    case 'hours':    return `${(Math.round(value * 10) / 10).toLocaleString('en-AU')} h`;
    // A value in days; same-day work reads better in hours.
    case 'duration': return value < 1 ? formatKpiValue(value * 24, 'hours') : formatKpiValue(value, 'days');
    case 'decimal':  return (Math.round(value * 10) / 10).toLocaleString('en-AU');
    default:         return Math.round(value).toLocaleString('en-AU');
  }
}

// "+12%", "−3 pts", "+1.5 days", "−2.4 h"
export function formatKpiDelta(delta, format) {
  if (delta == null) return '';
  const a = Math.abs(delta);
  if (format === 'duration') {
    const inHours = a < 1;
    const shown = Math.round((inHours ? a * 24 : a) * 10) / 10;
    const sign = shown === 0 ? '' : delta > 0 ? '+' : '−';
    return `${sign}${shown}${inHours ? ' h' : ' days'}`;
  }
  const shown = format === 'days' ? Math.round(a * 10) / 10 : Math.round(a * 100);
  const sign = shown === 0 ? '' : delta > 0 ? '+' : '−';
  if (format === 'percent') return `${sign}${shown} pts`;
  if (format === 'days') return `${sign}${shown} days`;
  return `${sign}${shown}%`;
}

// Secondary line under the value, built from the card's extra fields.
export function kpiSubline(id, result) {
  if (!result || result.empty) return '';
  const e = result.extra || {};
  switch (id) {
    case 'outstanding':
    case 'overdue':
      return e.count ? `${e.count} invoice${e.count === 1 ? '' : 's'}` : '';
    case 'open_pipeline':
      return e.count ? `${e.count} quote${e.count === 1 ? '' : 's'}` : '';
    case 'ready_to_invoice':
      return e.estimate > 0 ? `≈ ${formatCurrency(e.estimate)} to bill` : '';
    case 'scheduled_today':
      return result.value ? `${e.toStart} still to start` : '';
    case 'quotes_sent':
      return e.amount > 0 ? `${formatCurrency(e.amount)} quoted` : '';
    case 'gross_margin':
    case 'gross_profit':
    case 'average_job_profit':
      return e.jobsTotal && e.jobsKnown < e.jobsTotal ? `based on ${e.jobsKnown} of ${e.jobsTotal} jobs` : '';
    case 'average_invoice_value':
      return e.count ? `${e.count} invoice${e.count === 1 ? '' : 's'}` : '';
    case 'callback_rate':
      return result.value != null ? `${e.count} callback${e.count === 1 ? '' : 's'}` : '';
    case 'billable_hours':
      return e.hours > 0 ? `${formatKpiValue(e.hours, 'hours')} not on a job` : '';
    case 'jobs_per_tech':
      return e.techs ? `across ${e.techs} ${e.techs === 1 ? 'person' : 'people'}` : '';
    case 'pending_timesheets':
      return e.hours > 0 ? formatKpiValue(e.hours, 'hours') : '';
    case 'labour_vs_materials':
      return result.value != null ? `Labour ${Math.round(result.value * 100)}% · Materials ${100 - Math.round(result.value * 100)}%` : '';
    case 'maintenance_due':
      return e.overdue ? `+${e.overdue} overdue` : '';
    case 'credit_over':
      return e.count ? `${e.count} account${e.count === 1 ? '' : 's'} over` : 'all within their limits';
    case 'top_customer_share':
      return e.customer || '';
    default:
      return '';
  }
}
