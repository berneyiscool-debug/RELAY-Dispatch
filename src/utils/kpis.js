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

function inRange(v, r) {
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

const OPEN_JOB = ['Pending', 'Scheduled', 'In Progress', 'On Hold'];
const ACTIVE_JOB = ['Scheduled', 'In Progress', 'On Hold'];
const DONE_JOB = ['Completed', 'Invoiced'];
const isTemplate = (j) => j.isRecurring === true || j.status === 'Recurring Template';

// Draft and void invoices are not revenue and nobody owes them.
export const isLiveInvoice = (i) => i.status !== 'Draft' && i.status !== 'Void';
const invoiceIssued = (i) => i.issueDate || i.sentAt || i.createdAt;

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
function invoiceJobShares(inv) {
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
// without a pay rate: guessing would report a margin we don't have.
function jobCosts({ timesheets = [], technicians = [], jobMaterials = [], purchaseOrders = [], jobs = [] }) {
  const rate = new Map(technicians.map(t => [String(t.id), num(t.payRate)]));
  const costs = new Map();
  const entry = (id) => {
    const k = String(id);
    if (!costs.has(k)) costs.set(k, { cost: 0, inputs: 0, missingRate: false });
    return costs.get(k);
  };
  timesheets.forEach(t => {
    if (!t.jobId) return;
    const e = entry(t.jobId);
    const r = rate.get(String(t.technicianId)) || 0;
    const h = num(t.hours != null ? t.hours : t.durationHours);
    if (h <= 0) return;
    if (r <= 0) { e.missingRate = true; return; }
    e.cost += h * r; e.inputs++;
  });
  jobMaterials.forEach(m => {
    if (!m.jobId) return;
    const c = num(m.totalCost) || num(m.unitCost) * num(m.quantity);
    if (c <= 0) return;
    const e = entry(m.jobId); e.cost += c; e.inputs++;
  });
  purchaseOrders.forEach(po => {
    if (!po.jobId || po.status === 'Draft' || po.status === 'Cancelled') return;
    const c = num(po.total);
    if (c <= 0) return;
    const e = entry(po.jobId); e.cost += c; e.inputs++;
  });
  // Jobs whose material cost is kept on the job itself rather than as line records.
  jobs.forEach(j => {
    const mc = num(j.materialCost);
    if (mc > 0 && !jobMaterials.some(m => String(m.jobId) === String(j.id))) {
      const e = entry(j.id); e.cost += mc; e.inputs++;
    }
  });
  return costs;
}

// Revenue and cost of jobs invoiced in a range. Each invoice carries its share of
// the job's cost (share = invoice amount ÷ everything billed to the job), so a job
// invoiced in two parts isn't costed twice.
function invoicedJobProfit(data, r) {
  const live = (data.invoices || []).filter(isLiveInvoice);
  const billedToJob = new Map();
  live.forEach(inv => invoiceJobShares(inv).forEach(s => billedToJob.set(s.jobId, (billedToJob.get(s.jobId) || 0) + s.amount)));
  const costs = jobCosts(data);
  let revenue = 0, cost = 0;
  const known = new Set(), all = new Set();
  live.filter(inv => inRange(invoiceIssued(inv), r)).forEach(inv => {
    invoiceJobShares(inv).forEach(s => {
      all.add(s.jobId);
      const c = costs.get(s.jobId);
      if (!c || c.inputs === 0 || c.missingRate) return;
      const billed = billedToJob.get(s.jobId) || 0;
      if (billed <= 0) return;
      known.add(s.jobId);
      revenue += s.amount;
      cost += c.cost * (s.amount / billed);
    });
  });
  return { revenue, cost, profit: revenue - cost, jobsKnown: known.size, jobsTotal: all.size };
}

// ── List filters ─────────────────────────────────────────────────────────────
// What a card counts, as a row filter. Tapping a card opens its list with the
// same filter applied (?filter=<name>&period=<id>), and the card's formula is
// built on that filter too, so the list always holds exactly the records behind
// the number. build(data, ctx) returns a predicate for one record of `collection`.

const lastBookingByJob = (schedule = []) => {
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
  },
  leads: {
    new: {
      label: 'New', periodic: true, needs: ['leads'],
      build: (d, { range }) => l => inRange(l.createdAt, range),
    },
  },
};

// Context for a filter outside computeAll (the list pages).
export function filterContext(period = DEFAULT_PERIOD, now = new Date()) {
  return { ...periodRanges(period, now), period, today: startOfDay(now), now };
}

// Records of `collection` matching the named filter.
function rows(collection, name, data, ctx) {
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
};

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
      if (delta != null && Math.round(Math.abs(delta) * 100) > 0) good = (delta > 0) === def.upIsGood;
    }
    out[id] = { empty: false, value, prev, delta, good, extra };
  });
  return out;
}

export function kpiDelta(value, prev, format) {
  if (value == null || prev == null) return null;
  if (format === 'percent' || format === 'days') return value - prev;
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
    default:         return Math.round(value).toLocaleString('en-AU');
  }
}

// "+12%", "−3 pts", "+1.5 days"
export function formatKpiDelta(delta, format) {
  if (delta == null) return '';
  const a = Math.abs(delta);
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
      return e.jobsTotal && e.jobsKnown < e.jobsTotal ? `based on ${e.jobsKnown} of ${e.jobsTotal} jobs` : '';
    default:
      return '';
  }
}
