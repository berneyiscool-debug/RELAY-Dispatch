// ============================================
// RELAY — DASHBOARD ACTION LISTS
// ============================================
// The data behind the dashboard's "do something about it" widgets: quotes to
// chase, invoices to chase, jobs going wrong, the crew's week, deliveries,
// waiting leads, portal activity, the BAS estimate, the cash forecast, the
// revenue goal and expiring contractor documents.
//
// Pure functions over plain record arrays (the store's camelCase records), like
// kpis.js, so they're tested against the demo dataset and the widgets only draw.
// Every function takes `ctx = { now }`; dates follow the device's local calendar.

import { toDate, invoiceBalance, isLiveInvoice, quoteSentAt, computeAll } from './kpis.js';

const DAY = 86400000;
const num = (v) => { const n = parseFloat(v); return isFinite(n) ? n : 0; };
const sum = (arr, f) => arr.reduce((s, x) => s + f(x), 0);
const startOfDay = (d) => new Date(d.getFullYear(), d.getMonth(), d.getDate());
const addDays = (d, n) => new Date(d.getFullYear(), d.getMonth(), d.getDate() + n);
const dayKey = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
// Whole calendar days from a to b (DST-safe: compares local midnights by date).
const daysFrom = (a, b) => Math.round((Date.UTC(b.getFullYear(), b.getMonth(), b.getDate()) - Date.UTC(a.getFullYear(), a.getMonth(), a.getDate())) / DAY);
const isWeekday = (d) => d.getDay() !== 0 && d.getDay() !== 6;
const isTemplate = (j) => j.isRecurring === true || j.status === 'Recurring Template';
const isLeave = (s) => /leave|holiday|unavailable|time off/i.test(`${s.type || ''} ${s.title || ''}`);
const OPEN_QUOTE = ['Sent', 'Viewed'];
const OPEN_JOB = ['Pending', 'Scheduled', 'In Progress', 'On Hold'];

function ctxDates(ctx = {}) {
  const now = ctx.now || new Date();
  return { now, today: startOfDay(now) };
}

function bookingHours(s) {
  if (num(s.hours) > 0) return num(s.hours);
  const a = toDate(s.startTime), b = toDate(s.finishTime);
  if (a && b && b > a) return (b - a) / 3600000;
  if (s.endHour != null && s.startHour != null) return Math.max(0, num(s.endHour) - num(s.startHour));
  return 0;
}

const activeStaff = (technicians = []) => technicians.filter(t => !t.deactivated && t.role !== 'customer');

// ── Quotes to follow up ──────────────────────────────────────────────────────
// Sent quotes still waiting after `staleDays`, and open quotes expiring within
// `expiringDays`. Expired ones are left to the win rate (they count as lost).
export function quotesToFollowUp({ quotes = [] }, ctx = {}) {
  const { today } = ctxDates(ctx);
  const staleDays = ctx.staleDays ?? 7, expiringDays = ctx.expiringDays ?? 7;
  const rows = [];
  quotes.forEach(q => {
    if (q.isTemplate || !OPEN_QUOTE.includes(q.status)) return;
    const expiry = toDate(q.validUntil);
    if (expiry && expiry < today) return;
    const sent = toDate(quoteSentAt(q));
    const waiting = sent ? daysFrom(sent, today) : null;
    const expiresIn = expiry ? daysFrom(today, expiry) : null;
    const expiring = expiresIn != null && expiresIn <= expiringDays;
    const stale = waiting != null && waiting >= staleDays;
    if (!expiring && !stale) return;
    rows.push({ quote: q, waiting, expiresIn, reason: expiring ? 'expiring' : 'stale' });
  });
  // Expiring soonest first, then the longest waiting.
  return rows.sort((a, b) =>
    (a.reason === 'expiring') !== (b.reason === 'expiring') ? (a.reason === 'expiring' ? -1 : 1)
      : a.reason === 'expiring' ? a.expiresIn - b.expiresIn : b.waiting - a.waiting);
}

// ── Chase list ───────────────────────────────────────────────────────────────
// Overdue invoices, biggest balance first, with the last reminder sent.
export function chaseList({ invoices = [], emailLog = [] }, ctx = {}) {
  const { today } = ctxDates(ctx);
  const lastReminder = new Map();
  emailLog.forEach(l => {
    if (l.template !== 'reminder' || l.status !== 'sent' || !l.relatedId) return;
    const at = toDate(l.createdAt);
    const k = String(l.relatedId);
    if (at && (!lastReminder.has(k) || at > lastReminder.get(k))) lastReminder.set(k, at);
  });
  return invoices
    .map(inv => {
      const balance = invoiceBalance(inv);
      const due = toDate(inv.dueDate);
      if (balance <= 0 || !due || due >= today) return null;
      return { invoice: inv, balance, daysOverdue: daysFrom(due, today), lastReminder: lastReminder.get(String(inv.id)) || null };
    })
    .filter(Boolean)
    .sort((a, b) => b.balance - a.balance);
}

// ── Cash forecast ────────────────────────────────────────────────────────────
// Money expected in over the next `weeks` weeks, incl. GST (it's cash): unpaid
// invoice balances by due date (anything already overdue lands in "Overdue"),
// plus the work won but not yet invoiced, whose timing isn't known.
export function cashForecast({ invoices = [], quotes = [], jobs = [] }, ctx = {}) {
  const { today } = ctxDates(ctx);
  const weeks = ctx.weeks ?? 4;
  const buckets = Array.from({ length: weeks }, (_, i) => ({
    start: addDays(today, i * 7), end: addDays(today, (i + 1) * 7), amount: 0, count: 0,
  }));
  let overdue = 0, overdueCount = 0, later = 0;
  invoices.forEach(inv => {
    const bal = invoiceBalance(inv);
    if (bal <= 0) return;
    const due = toDate(inv.dueDate) || today;
    if (due < today) { overdue += bal; overdueCount++; return; }
    const b = buckets.find(x => due >= x.start && due < x.end);
    if (b) { b.amount += bal; b.count++; } else later += bal;
  });
  // Won, not yet billed: accepted quotes not converted to a job, plus completed
  // jobs with no invoice (valued at their quote).
  const billed = new Set();
  invoices.filter(i => i.status !== 'Void').forEach(i => [i.jobId, ...(i.jobIds || [])].filter(Boolean).forEach(id => billed.add(String(id))));
  const quoteById = new Map(quotes.map(q => [String(q.id), q]));
  const accepted = quotes.filter(q => !q.isTemplate && q.status === 'Accepted');
  const readyJobs = jobs.filter(j => !isTemplate(j) && j.status === 'Completed' && !billed.has(String(j.id)));
  const toInvoice = sum(accepted, q => num(q.total)) + sum(readyJobs, j => { const q = j.quoteId && quoteById.get(String(j.quoteId)); return q ? num(q.total) : 0; });
  return {
    overdue, overdueCount, buckets, later,
    toInvoice, toInvoiceCount: accepted.length + readyJobs.length,
    total: overdue + sum(buckets, b => b.amount),
  };
}

// ── GST / BAS estimate ───────────────────────────────────────────────────────
// Quarterly BAS on an accrual basis: GST on invoices issued in the quarter less
// GST credits on purchase orders raised in it (PO totals are ex GST, so 10%).
// Lodgement dates for quarterly lodgers: 28 Oct, 28 Feb, 28 Apr, 28 Jul.
export function basEstimate({ invoices = [], purchaseOrders = [] }, ctx = {}) {
  const { today } = ctxDates(ctx);
  const y = today.getFullYear(), m = today.getMonth();
  const qm = m - (m % 3);
  const start = new Date(y, qm, 1), end = new Date(y, qm + 3, 1);
  const dueDate = basDueDate(start);
  const inQuarter = (v) => { const d = toDate(v); return !!d && d >= start && d < end; };
  const issued = invoices.filter(i => isLiveInvoice(i) && inQuarter(i.issueDate || i.sentAt || i.createdAt));
  const collected = sum(issued, i => num(i.tax) || Math.max(0, num(i.total) - num(i.subtotal)));
  const pos = purchaseOrders.filter(p => p.status !== 'Draft' && p.status !== 'Cancelled' && inQuarter(p.issueDate || p.createdAt));
  const credits = sum(pos, p => num(p.total) * 0.1);
  return {
    start, end, label: quarterLabel(start),
    collected, credits, net: collected - credits,
    invoiceCount: issued.length, poCount: pos.length,
    dueDate, daysToDue: daysFrom(today, dueDate),
  };
}

// 28 Oct for Jul–Sep, 28 Feb for Oct–Dec, 28 Apr for Jan–Mar, 28 Jul for Apr–Jun:
// the month after the quarter ends, except Oct–Dec, which gets an extra month.
export function basDueDate(quarterStart) {
  const y = quarterStart.getFullYear(), m = quarterStart.getMonth();
  return m === 9 ? new Date(y + 1, 1, 28) : new Date(y, m + 3, 28);
}

function quarterLabel(start) {
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const m = start.getMonth();
  return `${months[m]}–${months[m + 2]} ${start.getFullYear()}`;
}

// ── Jobs at risk ─────────────────────────────────────────────────────────────
// Open jobs over their estimated hours, and jobs whose booked date has passed
// without the work starting.
export function jobsAtRisk({ jobs = [], timesheets = [] }, ctx = {}) {
  const { today } = ctxDates(ctx);
  const logged = new Map();
  timesheets.forEach(t => {
    if (!t.jobId) return;
    const h = num(t.hours != null ? t.hours : t.durationHours);
    logged.set(String(t.jobId), (logged.get(String(t.jobId)) || 0) + h);
  });
  const rows = [];
  jobs.forEach(j => {
    if (isTemplate(j) || !OPEN_JOB.includes(j.status)) return;
    const reasons = [];
    const est = num(j.estimatedHours), hours = logged.get(String(j.id)) || 0;
    if (est > 0 && hours > est) reasons.push({ type: 'over-hours', hours, estimated: est, over: hours / est - 1 });
    const booked = toDate(j.scheduledDate);
    if (booked && booked < today && (j.status === 'Scheduled' || j.status === 'Pending')) {
      reasons.push({ type: 'late', date: booked, daysLate: daysFrom(booked, today) });
    }
    if (reasons.length) rows.push({ job: j, reasons });
  });
  // Biggest overrun first, then the most days late.
  const score = (r) => sum(r.reasons, x => (x.type === 'over-hours' ? 100 + x.over * 100 : x.daysLate));
  return rows.sort((a, b) => score(b) - score(a));
}

// ── Crew week ahead ──────────────────────────────────────────────────────────
// Each active staff member's booked job hours against available hours for the
// next `days` days. Leave takes the day's hours out of capacity.
export function crewWeek({ schedule = [], technicians = [] }, ctx = {}) {
  const { today } = ctxDates(ctx);
  const days = Array.from({ length: ctx.days ?? 7 }, (_, i) => addDays(today, i));
  const keys = days.map(dayKey);
  const workday = ctx.workdayHours ?? 8;
  const staff = activeStaff(technicians);
  const rows = staff.map(t => {
    const cells = days.map((d, i) => {
      const mine = schedule.filter(s => String(s.technicianId) === String(t.id) && s.date === keys[i]);
      const leave = sum(mine.filter(isLeave), bookingHours);
      const booked = sum(mine.filter(s => s.jobId && !isLeave(s)), bookingHours);
      const capacity = isWeekday(d) ? Math.max(0, workday - leave) : 0;
      return { date: d, booked, leave, capacity, load: capacity > 0 ? booked / capacity : (booked > 0 ? Infinity : null) };
    });
    const booked = sum(cells, c => c.booked), capacity = sum(cells, c => c.capacity);
    return { tech: t, cells, booked, capacity, load: capacity > 0 ? booked / capacity : null };
  });
  return { days, rows };
}

// ── Deliveries due ───────────────────────────────────────────────────────────
// Issued purchase orders not yet received: overdue first, then those expected
// within `days` days.
export function deliveriesDue({ purchaseOrders = [] }, ctx = {}) {
  const { today } = ctxDates(ctx);
  const horizon = addDays(today, ctx.days ?? 7);
  return purchaseOrders
    .filter(p => !['Draft', 'Received', 'Cancelled', 'Closed'].includes(p.status) && !p.receivedDate)
    .map(p => {
      const expected = toDate(p.expectedDate);
      if (!expected || expected >= horizon) return null;
      return { po: p, expected, daysLate: Math.max(0, daysFrom(expected, today)), overdue: expected < today, inDays: daysFrom(today, expected) };
    })
    .filter(Boolean)
    .sort((a, b) => a.expected - b.expected);
}

// ── Leads waiting ────────────────────────────────────────────────────────────
// Leads still at New after `hours` hours, oldest first.
export function leadsWaiting({ leads = [] }, ctx = {}) {
  const { now } = ctxDates(ctx);
  const cutoff = now.getTime() - (ctx.hours ?? 24) * 3600000;
  return leads
    .filter(l => (l.status || 'New') === 'New')
    .map(l => ({ lead: l, created: toDate(l.createdAt) }))
    .filter(r => r.created && r.created.getTime() <= cutoff)
    .map(r => ({ ...r, hoursWaiting: Math.floor((now - r.created) / 3600000) }))
    .sort((a, b) => a.created - b.created);
}

// ── Customer portal activity ─────────────────────────────────────────────────
// What customers did in the last `days` days: signed or declined quotes,
// requests raised through the portal, and portal visits. Newest first.
export function portalActivity({ quotes = [], notifications = [], customers = [] }, ctx = {}) {
  const { now } = ctxDates(ctx);
  const since = now.getTime() - (ctx.days ?? 14) * DAY;
  const events = [];
  const push = (at, e) => { const d = toDate(at); if (d && d.getTime() >= since && d <= now) events.push({ ...e, at: d }); };
  quotes.forEach(q => {
    if (['Accepted', 'Converted'].includes(q.status) && (q.signedAt || q.acceptedAt)) {
      push(q.signedAt || q.acceptedAt, { type: 'signed', label: `${q.signedByName || q.customerName || 'Customer'} signed ${q.number || 'a quote'}`, href: `/quotes/${q.id}`, amount: num(q.total) });
    }
    if (q.status === 'Declined' && q.declinedAt) {
      push(q.declinedAt, { type: 'declined', label: `${q.customerName || 'Customer'} declined ${q.number || 'a quote'}`, href: `/quotes/${q.id}` });
    }
  });
  notifications.forEach(n => {
    if (n.source !== 'customer_portal') return;
    push(n.createdAt, { type: 'request', label: n.title || 'Portal request', detail: n.message || '', href: `/notifications?id=${n.id}` });
  });
  customers.forEach(c => {
    if (!c.portalLastAccessed) return;
    push(c.portalLastAccessed, { type: 'visit', label: `${c.company || [c.firstName, c.lastName].filter(Boolean).join(' ') || 'A customer'} opened the portal`, href: `/people/${c.id}` });
  });
  return events.sort((a, b) => b.at - a.at);
}

// ── Revenue goal ─────────────────────────────────────────────────────────────
// Progress against a monthly target (ex GST, matching the Revenue invoiced card)
// and the pace needed over the working days left.
export function revenueGoal(data, ctx = {}) {
  const { now, today } = ctxDates(ctx);
  const target = num(ctx.target);
  const r = computeAll(['revenue_invoiced'], data, { period: 'month', now }).revenue_invoiced;
  const invoiced = r && !r.empty ? r.value : 0;
  const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
  const monthEnd = new Date(today.getFullYear(), today.getMonth() + 1, 1);
  let total = 0, elapsed = 0;
  for (let d = monthStart; d < monthEnd; d = addDays(d, 1)) {
    if (!isWeekday(d)) continue;
    total++;
    if (d <= today) elapsed++;
  }
  const left = Math.max(0, total - elapsed);
  const expected = total ? target * (elapsed / total) : 0;
  return {
    target, invoiced,
    pct: target > 0 ? invoiced / target : null,
    expected,
    ahead: invoiced - expected,
    workdaysLeft: left,
    perDayNeeded: target > invoiced && left > 0 ? (target - invoiced) / left : 0,
  };
}

// ── Expiring documents ───────────────────────────────────────────────────────
// Active contractors' compliance documents expired or expiring within `days`.
export function expiringDocuments({ contractors = [] }, ctx = {}) {
  const { today } = ctxDates(ctx);
  const within = ctx.days ?? 30;
  const rows = [];
  contractors.forEach(c => {
    if (c.active === false) return;
    (c.complianceDocs || []).forEach(doc => {
      const exp = toDate(doc.expiryDate);
      if (!exp) return;
      const days = daysFrom(today, exp);
      if (days > within) return;
      rows.push({ contractor: c, doc, expiry: exp, days, expired: days < 0 });
    });
  });
  return rows.sort((a, b) => a.days - b.days);
}
