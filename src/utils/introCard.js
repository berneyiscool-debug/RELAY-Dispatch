// ============================================
// RELAY — Assistant greeting card (data layer)
// ============================================
// Everything the greeting card at the top of the assistant panel shows is derived
// here from plain local collections: no DOM, no store, no network. The component
// only lays the result out, which keeps the numbers testable without a browser.
// ============================================
import { toDateKey, todayLocalISO } from './dateUtils.js';

const OPEN_JOB_STATUSES = ['Scheduled', 'In Progress', 'Pending'];

/** Jobs that are still open but have nobody assigned to them. */
export function unassignedJobCount(jobs = []) {
  return jobs.filter(j => {
    if (!OPEN_JOB_STATUSES.includes(j.status)) return false;
    const hasTechName = j.technicianName && j.technicianName !== 'Unassigned';
    const hasTechArray = j.technicians && j.technicians.length > 0;
    return !hasTechName && !hasTechArray;
  }).length;
}

/** Distinct jobs on today's board: today's schedule blocks plus jobs dated today. */
export function jobsScheduledToday(jobs = [], schedule = [], todayKey = todayLocalISO()) {
  const today = todayKey || todayLocalISO();
  const ids = new Set();
  schedule.forEach(b => {
    if (b && b.jobId && toDateKey(b.date) === today) ids.add(String(b.jobId));
  });
  jobs.forEach(j => {
    if (j && OPEN_JOB_STATUSES.includes(j.status) && toDateKey(j.scheduledDate) === today) ids.add(String(j.id));
  });
  return ids.size;
}

/** Technicians double-booked on one day, counted once per technician per day. */
export function scheduleConflictCount(schedule = []) {
  const byTechDay = new Map();
  schedule.forEach(s => {
    if (!s || !s.technicianId || !s.date) return;
    const key = `${s.technicianId}_${toDateKey(s.date)}`;
    if (!byTechDay.has(key)) byTechDay.set(key, []);
    byTechDay.get(key).push(s);
  });
  let count = 0;
  byTechDay.forEach(blocks => {
    if (blocks.length < 2) return;
    blocks.sort((a, b) => (a.startHour || 0) - (b.startHour || 0));
    for (let i = 1; i < blocks.length; i++) {
      if ((blocks[i].startHour || 0) < (blocks[i - 1].endHour || 0)) { count++; return; }
    }
  });
  return count;
}

/** Whole dollars, e.g. $12,480 — the app's summary money format. */
export function formatFullMoney(amount) {
  return '$' + Math.round(Number(amount) || 0).toLocaleString('en-AU');
}

/** Short money for a narrow tile: $940, $1.2k, $12.5k, $125k, $1.5M. */
export function formatTileMoney(amount) {
  const n = Math.max(0, Math.round(Number(amount) || 0));
  const trim = (v) => {
    const r = v >= 100 ? Math.round(v) : Math.round(v * 10) / 10;
    return Number.isInteger(r) ? String(r) : r.toFixed(1);
  };
  if (n >= 1000 && n < 1000000) {
    const k = n / 1000;
    if (Math.round(k) < 1000) return `$${trim(k)}k`;
  }
  if (n >= 1000000) return `$${trim(n / 1000000)}M`;
  return `$${n.toLocaleString('en-AU')}`;
}

/**
 * Build the greeting card's content: three stat tiles, the "needs attention"
 * chips and the plain action chips, all as plain data.
 */
export function buildIntroCard({ jobs = [], quotes = [], invoices = [], stock = [], schedule = [], maps = false, todayKey = todayLocalISO() } = {}) {
  const today = todayKey || todayLocalISO();
  const todayBlocks = schedule.filter(s => s && toDateKey(s.date) === today);

  const jobsToday = jobsScheduledToday(jobs, todayBlocks, today);
  const unassigned = unassignedJobCount(jobs);
  const overdue = invoices.filter(i => i.status === 'Overdue');
  const overdueTotal = overdue.reduce((sum, i) => sum + (Number(i.total) || 0), 0);
  const conflicts = scheduleConflictCount(todayBlocks);
  const lowStock = stock.filter(s => (s.quantity || 0) <= (s.reorderPoint || 5)).length;
  const pendingQuotes = quotes.filter(q => q.status === 'Sent' || q.status === 'Pending' || q.status === 'Draft').length;

  const tiles = [
    {
      key: 'jobs-today',
      value: String(jobsToday),
      label: 'Jobs Today',
      tone: 'neutral',
      title: jobsToday === 1 ? "1 job on today's board" : `${jobsToday} jobs on today's board`,
      cmd: 'how many jobs are scheduled today',
    },
    {
      key: 'unassigned',
      value: String(unassigned),
      label: 'Unassigned',
      tone: unassigned > 0 ? 'warning' : 'neutral',
      title: unassigned === 1 ? '1 open job with no technician' : `${unassigned} open jobs with no technician`,
      cmd: 'how many jobs are unassigned',
    },
    {
      key: 'overdue',
      value: formatTileMoney(overdueTotal),
      label: 'Overdue $',
      tone: overdueTotal > 0 ? 'warning' : 'neutral',
      title: overdue.length
        ? `${overdue.length} overdue invoice${overdue.length === 1 ? '' : 's'} • ${formatFullMoney(overdueTotal)}`
        : 'No overdue invoices',
      cmd: 'how many overdue invoices',
    },
  ];

  const attention = [];
  if (overdue.length) attention.push({ icon: 'receipt_long', tone: 'warning', label: `${overdue.length} Overdue Invoice(s) — Chase`, cmd: `show ${overdue.length} overdue invoices` });
  if (unassigned) attention.push({ icon: 'person_off', tone: 'warning', label: `${unassigned} Unassigned Job(s) — Auto Assign`, cmd: 'assign technicians to unassigned jobs' });
  if (conflicts) attention.push({ icon: 'event_busy', tone: 'warning', label: `${conflicts} Schedule Collision(s) Today — Optimize`, cmd: "optimize today's schedule and resolve conflicts" });
  if (lowStock) attention.push({ icon: 'inventory_2', tone: 'info', label: `${lowStock} Low Stock Item(s) — Reorder`, cmd: 'show low stock items and reorder' });

  const actions = [];
  if (pendingQuotes) actions.push({ icon: 'request_quote', tone: 'neutral', label: `${pendingQuotes} Pending Quote(s) — Follow Up`, cmd: `show ${pendingQuotes} pending quotes` });
  if (maps) actions.push({ icon: 'map', tone: 'neutral', label: "Plan Today's Route", cmd: "What's the best order to run today's jobs, with drive times?" });
  actions.push({ icon: 'calendar_month', tone: 'neutral', label: "What's Happening This Week", cmd: "What's happening this week?" });
  actions.push({ icon: 'build', tone: 'neutral', label: 'Create New Job', cmd: 'create a new job' });

  return {
    tiles,
    attention,
    actions,
    counts: { jobsToday, unassigned, overdueCount: overdue.length, overdueTotal, conflicts, lowStock, pendingQuotes },
  };
}
