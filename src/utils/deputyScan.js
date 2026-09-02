import { store } from '../data/store.js';
import { hasDeputyMax } from './aiTier.js';

// The Emergency Scan surfaces urgent operational issues so the Deputy can act on them.
// It is a Deputy Max capability and is a no-op for lower tiers.

const DONE_JOB_STATUSES = ['Completed', 'Invoiced', 'Archived', 'Cancelled'];
const LARGE_INVOICE_BALANCE = 2000;
const INVOICE_OVERDUE_DAYS = 14;

export const SCAN_CATEGORIES = {
  EMERGENCY_JOB: 'Emergency Jobs',
  OVERDUE_INVOICE: 'Overdue Invoices',
  UNSCHEDULED_TODAY: 'Unscheduled Jobs',
  CRITICAL_STOCK: 'Critical Stock',
  TECH_CONFLICT: 'Technician Conflicts',
  OVERDUE_JOB: 'Overdue Jobs',
  OVERDUE_MAINTENANCE: 'Overdue Maintenance'
};

function toDateKey(d) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

// Normalise any date value (ISO string, 'YYYY-MM-DD', Date) to a 'YYYY-MM-DD' key or null.
function dateKey(value) {
  if (!value) return null;
  if (value instanceof Date) return toDateKey(value);
  const s = String(value);
  const m = s.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (m) return `${m[1]}-${m[2]}-${m[3]}`;
  const d = new Date(s);
  if (!isNaN(d.getTime())) return toDateKey(d);
  return null;
}

// Days from a date key to today (local midnights). Negative => future, positive => past/overdue.
function daysFromToday(value) {
  const key = dateKey(value);
  if (!key) return 0;
  const [y, m, d] = key.split('-').map(Number);
  const then = new Date(y, m - 1, d);
  const now = new Date();
  const nowMid = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  return Math.round((nowMid - then) / 86400000);
}

function isEmergencyJob(job) {
  if (job.isEmergency === true) return true;
  const p = (job.priority || '').toLowerCase();
  return ['emergency', 'critical', 'urgent'].includes(p);
}

function hasTechnician(job) {
  const name = (job.technicianName || '').trim();
  if (name && name !== 'Unassigned' && name !== 'unassigned') return true;
  return !!(job.technicians && job.technicians.length);
}

export function runEmergencyScan() {
  if (!hasDeputyMax()) return [];

  const jobs = store.getAll('jobs') || [];
  const stock = store.getAll('stock') || [];
  const invoices = store.getAll('invoices') || [];
  const schedules = store.getAll('schedule') || [];
  const maintenancePlans = store.getAll('maintenancePlans') || [];
  const jobMaterials = store.getAll('jobMaterials') || [];

  const findings = [];

  // 1. Emergency jobs that are unassigned / not started and due today or overdue.
  jobs.forEach(job => {
    if (!isEmergencyJob(job)) return;
    if (DONE_JOB_STATUSES.includes(job.status)) return;
    if (daysFromToday(job.scheduledDate) < 0) return; // not yet due
    const unassigned = !hasTechnician(job);
    findings.push({
      id: `escan_${SCAN_CATEGORIES.EMERGENCY_JOB}_${job.id}`,
      severity: 'critical',
      category: SCAN_CATEGORIES.EMERGENCY_JOB,
      title: `Emergency job #${job.number || ''} ${unassigned ? 'unassigned' : 'not started'}`,
      detail: `${job.title || 'Untitled job'}${job.customerName ? ` for ${job.customerName}` : ''}${job.scheduledDate ? ` — due ${job.scheduledDate}` : ''}. ${unassigned ? 'No technician assigned.' : 'Needs attention before it slips.'}`,
      recordIds: [job.id]
    });
  });

  // 2. Overdue invoices: more than 14 days past due, or a large outstanding balance.
  invoices.forEach(inv => {
    if (inv.status !== 'Overdue') return;
    const days = daysFromToday(inv.dueDate);
    const balance = inv.total || inv.subtotal || 0;
    if (days < INVOICE_OVERDUE_DAYS && balance < LARGE_INVOICE_BALANCE) return;
    findings.push({
      id: `escan_${SCAN_CATEGORIES.OVERDUE_INVOICE}_${inv.id}`,
      severity: 'high',
      category: SCAN_CATEGORIES.OVERDUE_INVOICE,
      title: `Invoice #${inv.number || ''} ${days >= INVOICE_OVERDUE_DAYS ? `${days} days overdue` : 'large balance'}`,
      detail: `${inv.customerName || (inv.customer ? inv.customer : 'Customer')} owes ${formatCurrency(balance)}${inv.dueDate ? ` (due ${inv.dueDate})` : ''}.`,
      recordIds: [inv.id]
    });
  });

  // 3. Today's scheduled jobs that still have no technician assigned.
  jobs.forEach(job => {
    if (job.status !== 'Scheduled') return;
    if (daysFromToday(job.scheduledDate) !== 0) return;
    if (hasTechnician(job)) return;
    findings.push({
      id: `escan_${SCAN_CATEGORIES.UNSCHEDULED_TODAY}_${job.id}`,
      severity: 'high',
      category: SCAN_CATEGORIES.UNSCHEDULED_TODAY,
      title: `Job #${job.number || ''} scheduled today with no technician`,
      detail: `${job.title || 'Untitled job'}${job.customerName ? ` for ${job.customerName}` : ''} needs a technician assigned before it starts.`,
      recordIds: [job.id]
    });
  });

  // 4. Critical stock (qty <= 0), escalated to critical when needed by a scheduled job.
  const scheduledJobIds = new Set(jobs.filter(j => j.status === 'Scheduled').map(j => j.id));
  const criticalStockIds = new Set(stock.filter(s => (s.quantity || 0) <= 0).map(s => s.id));
  const neededStockIds = new Set();
  jobMaterials.forEach(mat => {
    if (criticalStockIds.has(mat.partId) && scheduledJobIds.has(mat.jobId)) neededStockIds.add(mat.partId);
  });
  stock.forEach(s => {
    if ((s.quantity || 0) > 0) return;
    const needed = neededStockIds.has(s.id);
    findings.push({
      id: `escan_${SCAN_CATEGORIES.CRITICAL_STOCK}_${s.id}`,
      severity: needed ? 'critical' : 'high',
      category: SCAN_CATEGORIES.CRITICAL_STOCK,
      title: `${needed ? 'Critical' : 'Out of stock'}: ${s.name || 'Item'}`,
      detail: `${s.name || 'Stock item'} has 0 on hand${needed ? ' and is required by a job scheduled today' : ''}${s.supplier ? ` (supplier: ${s.supplier})` : ''}.`,
      recordIds: [s.id]
    });
  });

  // 5. Technician time conflicts across active schedules.
  const techBlocks = {};
  schedules.forEach(s => {
    if (!s.technicianId || !s.date) return;
    const key = `${s.technicianId}_${s.date}`;
    if (!techBlocks[key]) techBlocks[key] = [];
    techBlocks[key].push(s);
  });
  Object.entries(techBlocks).forEach(([key, blocks]) => {
    if (blocks.length <= 1) return;
    blocks.sort((a, b) => (a.startHour || 0) - (b.startHour || 0));
    let conflicted = false;
    for (let i = 1; i < blocks.length; i++) {
      if ((blocks[i].startHour || 0) < (blocks[i - 1].endHour || 0)) { conflicted = true; break; }
    }
    if (!conflicted) return;
    const techName = blocks[0].technicianName || 'Technician';
    const jobIds = blocks.map(b => b.jobId).filter(Boolean);
    const snippet = blocks.map(b => `#${b.jobNumber || ''} ${b.title || ''} (${b.startHour || 0}:00-${b.endHour || 0}:00)`).join(', ');
    findings.push({
      id: `escan_${SCAN_CATEGORIES.TECH_CONFLICT}_${key}`,
      severity: 'high',
      category: SCAN_CATEGORIES.TECH_CONFLICT,
      title: `Schedule conflict for ${techName}`,
      detail: `${techName} is double-booked on ${blocks[0].date}: ${snippet}.`,
      recordIds: jobIds
    });
  });

  // 6. Jobs past their scheduled start with no status change (still 'Scheduled').
  jobs.forEach(job => {
    if (job.status !== 'Scheduled') return;
    const days = daysFromToday(job.scheduledDate);
    if (days <= 0) return;
    findings.push({
      id: `escan_${SCAN_CATEGORIES.OVERDUE_JOB}_${job.id}`,
      severity: 'high',
      category: SCAN_CATEGORIES.OVERDUE_JOB,
      title: `Job #${job.number || ''} overdue by ${days} day${days === 1 ? '' : 's'}`,
      detail: `${job.title || 'Untitled job'}${job.customerName ? ` for ${job.customerName}` : ''} was scheduled for ${job.scheduledDate} but is still 'Scheduled'.`,
      recordIds: [job.id]
    });
  });

  // 7. Overdue maintenance plans (next service date in the past, not completed).
  maintenancePlans.forEach(plan => {
    if (['Completed', 'Archived'].includes(plan.status)) return;
    const days = daysFromToday(plan.nextServiceDate);
    if (days <= 0) return;
    findings.push({
      id: `escan_${SCAN_CATEGORIES.OVERDUE_MAINTENANCE}_${plan.id}`,
      severity: 'medium',
      category: SCAN_CATEGORIES.OVERDUE_MAINTENANCE,
      title: `Maintenance overdue by ${days} day${days === 1 ? '' : 's'}`,
      detail: `${plan.name || 'Maintenance plan'} was due on ${plan.nextServiceDate} and has not been serviced.`,
      recordIds: [plan.id]
    });
  });

  // Severity-ordered sort (critical first), then category.
  const order = { critical: 0, high: 1, medium: 2 };
  return findings.sort((a, b) => (order[a.severity] - order[b.severity]) || a.category.localeCompare(b.category));
}

export function summariseScan(findings) {
  if (!hasDeputyMax()) return '';
  const list = findings || [];
  if (list.length === 0) {
    return 'Emergency scan complete — no urgent issues detected. All systems look clear.';
  }
  const counts = { critical: 0, high: 0, medium: 0 };
  list.forEach(f => { counts[f.severity] = (counts[f.severity] || 0) + 1; });
  const parts = [];
  if (counts.critical) parts.push(`${counts.critical} critical`);
  if (counts.high) parts.push(`${counts.high} high`);
  if (counts.medium) parts.push(`${counts.medium} medium`);
  const top = list.slice(0, 3).map(f => `• ${f.title}`).join('\n');
  return `Emergency scan found ${list.length} issue${list.length === 1 ? '' : 's'} (${parts.join(', ')}).\n${top}${list.length > 3 ? '\n…and more' : ''}`;
}

function formatCurrency(value) {
  const n = Number(value) || 0;
  return n.toLocaleString('en-AU', { style: 'currency', currency: 'AUD' });
}
