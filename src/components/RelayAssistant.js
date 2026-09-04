// ============================================
// RELAY — IN-APP ASSISTANT (shell + local command handler)
// ============================================
// Phase 1 (now): a slide-in chat panel with a lightweight, rule-based command handler
// that performs real actions against the dashboard + data. No API key / backend needed.
// Phase 2 (later): swap `runLocalCommand` for a Claude API call via a Netlify/Supabase
// function for full natural-language understanding. The UI here won't need to change.
// ============================================
import { store } from '../data/store.js';
import { showToast } from './Notifications.js';
import { showModal } from './Modal.js';
import { dispatchChat } from '../utils/aiEngine.js';
import { isCloudUser, hasDeputyMax } from '../utils/aiTier.js';
import { hasPermission } from '../utils/permissions.js';
import { prepareAttachments, isSupportedAttachment, fileKind, chunk, MAX_PDF_PAGES, VISION_BATCH_SIZE } from '../utils/relayAttachments.js';
import { loadUserMemory, loadUserMemorySync, saveUserMemory, clearStaleMemory, getStructuredMemory } from '../utils/userMemory.js';
import { FLAGS } from '../utils/flags.js';
import { hasMapsAction, runMapsActions } from '../utils/deputyMaps.js';
import { hasWeatherAction, runWeatherActions } from '../utils/deputyWeather.js';
import { getThreads, getThread, createThread, renameThread, deleteThread, setThreadMessages, ensureDefaultThread, deriveThreadTitle } from '../utils/deputyThreads.js';
import { getRoutines, getRoutine, createRoutine, updateRoutine, deleteRoutine, markRoutineRun, routineIsDue, describeTrigger } from '../utils/deputyRoutines.js';
import { runEmergencyScan, summariseScan, SCAN_CATEGORIES } from '../utils/deputyScan.js';
import { triageMessage, routeIntent } from '../utils/deputyTriage.js';
import { marked } from 'marked';
import DOMPurify from 'dompurify';

let panel = null;
let onStateChange = null;
let chatHistory = [];
let currentThreadId = null;
let emergencyFindings = [];
let scanRefreshTimer = null;
let watchdogRefreshTimer = null;
let sidebarRailObserver = null;
let routineTimer = null;
let routineRunning = false;
let routineDraft = null; // in-progress conversational routine build (per thread)

// Align the expanded Deputy workspace to the live width of the main sidebar rail,
// so the panel sits flush against the rail edge (covering the contextual submenu)
// with no gap — regardless of the rail's expanded/collapsed state.
function syncPanelToSidebar() {
  if (!panel) return;
  const rail = document.querySelector('#sidebar .sidebar-rail');
  const offset = rail ? Math.round(rail.getBoundingClientRect().width) : 200;
  panel.style.setProperty('--relay-sidebar-offset', offset + 'px');
}

function observeSidebarRail() {
  if (sidebarRailObserver) return;
  const rail = document.querySelector('#sidebar .sidebar-rail');
  if (!rail) return;
  sidebarRailObserver = new ResizeObserver(() => syncPanelToSidebar());
  sidebarRailObserver.observe(rail);
}

function lastThreadKey() {
  return `relay_last_thread_${getUserId()}`;
}

// ── Workspace State & Action Audit Log ──
let isExpanded = localStorage.getItem('relay_expanded') === 'true';
let activeTab = 'chat'; // Defaults to Chat (now the default in both modes)

const AUDIT_LOG_KEY = 'deputyAuditLog';
const AUDIT_LOG_MAX = 100;

function loadAuditLog() {
  try {
    const raw = localStorage.getItem(AUDIT_LOG_KEY);
    if (raw !== null) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed;
    }
  } catch (e) {
    // Corrupt log — fall through to a fresh seed entry.
  }
  return [
    {
      id: 'act_init',
      timestamp: new Date().toLocaleTimeString('en-AU', { hour: '2-digit', minute: '2-digit' }),
      title: 'Operations Watchdog Active',
      details: 'Scanned active jobs, inventory thresholds, and billing status',
      status: 'success'
    }
  ];
}

function persistAuditLog() {
  try {
    localStorage.setItem(AUDIT_LOG_KEY, JSON.stringify(actionAuditLog));
  } catch (e) {
    // Storage may be unavailable (private mode / quota) — the in-memory log still works.
  }
}

let actionAuditLog = loadAuditLog();

function logAction(title, details, status = 'success') {
  actionAuditLog.unshift({
    id: 'act_' + Math.random().toString(36).substr(2, 9),
    timestamp: new Date().toLocaleTimeString('en-AU', { hour: '2-digit', minute: '2-digit' }),
    title,
    details,
    status
  });
  if (actionAuditLog.length > AUDIT_LOG_MAX) actionAuditLog.length = AUDIT_LOG_MAX;
  persistAuditLog();
}

// Positive = date is in the past (overdue / stale). Mirrors deputyScan.daysFromToday.
function daysSinceToday(value) {
  if (!value) return 0;
  const d = value instanceof Date ? value : new Date(value);
  if (isNaN(d.getTime())) return 0;
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const day = new Date(d); day.setHours(0, 0, 0, 0);
  return Math.round((today - day) / 86400000);
}

function formatAUD(value) {
  const n = Number(value) || 0;
  return n.toLocaleString('en-AU', { style: 'currency', currency: 'AUD' });
}

function formatWatchdogDate(value) {
  if (!value) return '—';
  const d = value instanceof Date ? value : new Date(value);
  if (isNaN(d.getTime())) return '—';
  return d.toLocaleDateString('en-AU', { day: 'numeric', month: 'short', year: 'numeric' });
}

function watchdogDrillRow(record) {
  const detail = record.detail ? `<span class="watchdog-drill-detail">${escapeHtml(record.detail)}</span>` : '';
  return `
    <div class="watchdog-drill-row">
      <div class="watchdog-drill-info">
        <span class="watchdog-drill-title">${escapeHtml(record.title)}</span>
        ${detail}
      </div>
      <button class="watchdog-drill-open" type="button" data-route="${escapeHtml(record.route)}" title="Open record">
        <span class="material-icons-outlined">open_in_new</span>
      </button>
    </div>`;
}

function renderWatchdogCard(domain) {
  const badgeClass = domain.count > 0 ? domain.badgeClass : 'badge-success';
  const records = domain.records || [];
  const rows = records.slice(0, 8).map(watchdogDrillRow).join('');
  const more = records.length > 8
    ? `<div class="watchdog-drill-more">+${records.length - 8} more — run a scan for the full list.</div>`
    : '';
  const list = rows
    ? `<div class="watchdog-drill">${rows}</div>${more}`
    : `<div class="watchdog-drill-empty">${domain.emptyText}</div>`;
  const action = domain.action
    ? `<button class="btn ${domain.action.cls || 'btn-primary'} btn-sm btn-wd-action" type="button" data-handler="${domain.action.handler}"
        ${domain.action.route ? `data-route="${domain.action.route}"` : ''}
        ${domain.action.disabled ? 'disabled' : ''}
        style="width:100%;display:inline-flex;align-items:center;justify-content:center;gap:6px;">
        <span class="material-icons-outlined" style="font-size:16px;">${domain.action.icon}</span>
        ${domain.action.label}
      </button>`
    : '';
  return `
    <div class="watchdog-card collapsed" data-watchdog-domain="${domain.id}">
      <button class="watchdog-card-head" type="button" aria-expanded="false">
        <div class="watchdog-card-title">
          <span class="material-icons-outlined">${domain.icon}</span>
          ${domain.title}
        </div>
        <div class="watchdog-card-head-right">
          <span class="badge ${badgeClass}">${domain.count} ${domain.badgeLabel}</span>
          <span class="material-icons-outlined watchdog-card-caret">expand_more</span>
        </div>
      </button>
      <div class="watchdog-card-body">
        <div class="watchdog-card-summary">${domain.summary}</div>
        ${list}
        ${action}
      </div>
    </div>`;
}

function renderWatchdogView(container) {
  const jobs = store.getAll('jobs') || [];
  const stock = store.getAll('stock') || [];
  const invoices = store.getAll('invoices') || [];
  const quotes = store.getAll('quotes') || [];
  const schedules = store.getAll('schedule') || [];
  const timesheets = store.getAll('timesheets') || [];
  const maintenancePlans = store.getAll('maintenancePlans') || [];
  const leads = store.getAll('leads') || [];
  const projects = store.getAll('projects') || [];

  const unassignedJobs = jobs.filter(j => !j.technicianId && (!j.technicians || !j.technicians.length) && j.status !== 'Completed' && j.status !== 'Invoiced');
  const lowStock = stock.filter(s => (s.quantity || 0) <= (s.reorderPoint || 5));
  const overdueInvoices = invoices.filter(i => i.status === 'Overdue');
  const pendingQuotes = quotes.filter(q => q.status === 'Sent' || q.status === 'Pending');
  const pendingTimesheets = timesheets.filter(t => t.status === 'Pending');
  const overdueMaintenance = maintenancePlans.filter(p => !['Completed', 'Archived'].includes(p.status) && daysSinceToday(p.nextServiceDate) > 0);
  const staleLeads = leads.filter(l => ['New', 'Contacted'].includes(l.status) && daysSinceToday(l.createdAt) > 7);
  const overdueProjects = projects.filter(p => p.status === 'In Progress' && daysSinceToday(p.endDate) > 0);

  const techBlocks = {};
  const conflictRecords = [];
  let conflictCount = 0;
  schedules.forEach(s => {
    if (!s.technicianId || !s.date) return;
    const key = `${s.technicianId}_${s.date}`;
    if (!techBlocks[key]) techBlocks[key] = [];
    techBlocks[key].push(s);
  });
  Object.values(techBlocks).forEach(blocks => {
    if (blocks.length > 1) {
      blocks.sort((a,b) => (a.startHour||0) - (b.startHour||0));
      for (let i = 1; i < blocks.length; i++) {
        if ((blocks[i].startHour||0) < (blocks[i-1].endHour||0)) {
          conflictCount++;
          conflictRecords.push({
            title: `${blocks[i].title || blocks[i].jobNumber || 'Scheduled job'} — ${blocks[i].technicianName || 'Technician'}`,
            detail: `Double-booked on ${formatWatchdogDate(blocks[i].date)}`,
            route: 'schedule'
          });
          break;
        }
      }
    }
  });

  const watchdogIssues = unassignedJobs.length + conflictCount + lowStock.length + overdueInvoices.length
    + pendingTimesheets.length + overdueMaintenance.length + staleLeads.length + overdueProjects.length;

  // Emergency-scan findings fold into the same dashboard (Deputy Max only).
  const canScan = hasDeputyMax();
  if (canScan && !emergencyFindings.length) emergencyFindings = runEmergencyScan();
  const findings = canScan ? emergencyFindings : [];
  const counts = { critical: 0, high: 0, medium: 0 };
  findings.forEach(f => { counts[f.severity] = (counts[f.severity] || 0) + 1; });
  const grouped = {};
  findings.forEach(f => {
    if (!grouped[f.category]) grouped[f.category] = [];
    grouped[f.category].push(f);
  });
  const alertCount = watchdogIssues + findings.length;
  const statusText = alertCount === 0
    ? 'All systems operating smoothly. No active conflicts or urgent issues detected.'
    : canScan && findings.length
      ? `Detected ${alertCount} alert${alertCount === 1 ? '' : 's'} — ${counts.critical} critical, ${counts.high} high, ${counts.medium} medium.`
      : `Detected ${alertCount} operational alert${alertCount === 1 ? '' : 's'} requiring attention.`;

  const domains = [
    {
      id: 'dispatch',
      icon: 'event_seat',
      title: 'Schedule & Dispatch',
      count: unassignedJobs.length + conflictCount,
      badgeClass: 'badge-warning',
      badgeLabel: 'Alerts',
      summary: unassignedJobs.length + conflictCount === 0
        ? 'No unassigned jobs or scheduling conflicts.'
        : `${unassignedJobs.length} unassigned job${unassignedJobs.length === 1 ? '' : 's'} and ${conflictCount} scheduling conflict${conflictCount === 1 ? '' : 's'}.`,
      records: [
        ...unassignedJobs.map(j => ({ title: j.title || j.number || 'Unassigned job', detail: 'No technician assigned', route: 'jobs' })),
        ...conflictRecords
      ],
      emptyText: 'Every job has a technician and no double-bookings were found.',
      action: { label: 'Auto-Fix & Assign', icon: 'auto_fix_high', cls: 'btn-primary', handler: 'autofix-dispatch', disabled: unassignedJobs.length === 0 && conflictCount === 0 }
    },
    {
      id: 'stock',
      icon: 'inventory_2',
      title: 'Inventory & Reorder',
      count: lowStock.length,
      badgeClass: 'badge-danger',
      badgeLabel: 'Low Stock',
      summary: lowStock.length === 0
        ? 'All inventory levels are above reorder thresholds.'
        : `${lowStock.length} stock item${lowStock.length === 1 ? '' : 's'} at or below reorder level.`,
      records: lowStock.map(s => ({ title: s.name || s.sku || 'Stock item', detail: `${s.quantity || 0} on hand · reorder at ${s.reorderPoint || 5}`, route: 'stock' })),
      emptyText: 'No low-stock items right now.',
      action: { label: 'Draft Reorder POs', icon: 'add_shopping_cart', cls: 'btn-secondary', handler: 'autofix-stock', disabled: lowStock.length === 0 }
    },
    {
      id: 'billing',
      icon: 'receipt_long',
      title: 'Overdue Billing & Invoices',
      count: overdueInvoices.length,
      badgeClass: 'badge-danger',
      badgeLabel: 'Overdue',
      summary: overdueInvoices.length === 0
        ? 'No overdue invoices.'
        : `${overdueInvoices.length} invoice${overdueInvoices.length === 1 ? '' : 's'} past payment terms.`,
      records: overdueInvoices.map(i => ({ title: `${i.number || 'Invoice'} — ${i.customerName || 'Customer'}`, detail: `${formatAUD(i.total)} · due ${formatWatchdogDate(i.dueDate)}`, route: 'invoices' })),
      emptyText: 'Nothing past payment terms.',
      action: { label: 'Send Payment Reminders', icon: 'mail', cls: 'btn-secondary', handler: 'autofix-invoices', disabled: overdueInvoices.length === 0 }
    },
    {
      id: 'quotes',
      icon: 'request_quote',
      title: 'Pending Proposals & Quotes',
      count: pendingQuotes.length,
      badgeClass: 'badge-info',
      badgeLabel: 'Pending',
      summary: pendingQuotes.length === 0
        ? 'No quotes waiting on a customer response.'
        : `${pendingQuotes.length} quote${pendingQuotes.length === 1 ? '' : 's'} currently sent or awaiting a response.`,
      records: pendingQuotes.map(q => ({ title: `${q.number || 'Quote'} — ${q.customerName || 'Customer'}`, detail: `${formatAUD(q.total)} · ${q.title || ''}`, route: 'quotes' })),
      emptyText: 'No pending proposals.',
      action: { label: 'Log Quote Follow-Ups', icon: 'mark_email_read', cls: 'btn-secondary', handler: 'autofix-quotes', disabled: pendingQuotes.length === 0 }
    },
    {
      id: 'timesheets',
      icon: 'schedule',
      title: 'Timesheets Awaiting Approval',
      count: pendingTimesheets.length,
      badgeClass: 'badge-warning',
      badgeLabel: 'Pending',
      summary: pendingTimesheets.length === 0
        ? 'All submitted timesheets are approved.'
        : `${pendingTimesheets.length} timesheet${pendingTimesheets.length === 1 ? '' : 's'} waiting for approval.`,
      records: pendingTimesheets.map(t => ({ title: `${t.technicianName || 'Technician'} — ${t.jobTitle || t.jobNumber || 'Job'}`, detail: `${t.durationHours || 0}h · ${formatWatchdogDate(t.date)}`, route: 'timesheets' })),
      emptyText: 'No pending timesheets.',
      action: { label: 'Approve All', icon: 'done_all', cls: 'btn-primary', handler: 'autofix-timesheets', disabled: pendingTimesheets.length === 0 }
    },
    {
      id: 'maintenance',
      icon: 'build',
      title: 'Overdue Maintenance',
      count: overdueMaintenance.length,
      badgeClass: 'badge-warning',
      badgeLabel: 'Overdue',
      summary: overdueMaintenance.length === 0
        ? 'All active maintenance plans are up to date.'
        : `${overdueMaintenance.length} maintenance plan${overdueMaintenance.length === 1 ? '' : 's'} past their next service date.`,
      records: overdueMaintenance.map(p => ({ title: p.name || 'Maintenance plan', detail: `Service due ${formatWatchdogDate(p.nextServiceDate)}`, route: 'assets' })),
      emptyText: 'No overdue maintenance.',
      action: { label: 'Open Assets', icon: 'arrow_forward', cls: 'btn-secondary', handler: 'navigate', route: 'assets' }
    },
    {
      id: 'leads',
      icon: 'person_search',
      title: 'Stale Leads',
      count: staleLeads.length,
      badgeClass: 'badge-warning',
      badgeLabel: 'Stale',
      summary: staleLeads.length === 0
        ? 'No new or contacted leads sitting idle.'
        : `${staleLeads.length} lead${staleLeads.length === 1 ? '' : 's'} untouched for over a week.`,
      records: staleLeads.map(l => ({ title: `${l.customerName || 'Lead'} — ${l.title || l.number || ''}`, detail: `Untouched for ${daysSinceToday(l.createdAt)} days`, route: 'leads' })),
      emptyText: 'No stale leads.',
      action: { label: 'Open Leads', icon: 'arrow_forward', cls: 'btn-secondary', handler: 'navigate', route: 'leads' }
    },
    {
      id: 'projects',
      icon: 'assignment',
      title: 'Projects Running Late',
      count: overdueProjects.length,
      badgeClass: 'badge-warning',
      badgeLabel: 'Late',
      summary: overdueProjects.length === 0
        ? 'No active projects have missed their end date.'
        : `${overdueProjects.length} active project${overdueProjects.length === 1 ? '' : 's'} past their end date.`,
      records: overdueProjects.map(p => ({ title: `${p.name || p.number || 'Project'} — ${p.customerName || 'Customer'}`, detail: `Due ${formatWatchdogDate(p.endDate)}`, route: 'projects' })),
      emptyText: 'No overdue projects.',
      action: { label: 'Open Projects', icon: 'arrow_forward', cls: 'btn-secondary', handler: 'navigate', route: 'projects' }
    }
  ];

  const scanSectionHtml = canScan ? `
    <div class="watchdog-scan-section">
      <div class="watchdog-scan-section-head">
        <div class="watchdog-scan-section-title">
          <span class="material-icons-outlined" style="color:var(--color-danger)">emergency</span>
          Scan Findings
        </div>
        ${findings.length ? `<span class="badge badge-danger">${findings.length} Finding${findings.length === 1 ? '' : 's'}</span>` : ''}
      </div>
      ${findings.length === 0 ? `
        <div class="scan-empty">
          <span class="material-icons-outlined" style="font-size:20px;opacity:0.5;">verified</span>
          Nothing needs urgent attention right now.
        </div>
      ` : `<div class="scan-list">${Object.entries(grouped).map(([cat, items]) => `
        <div class="scan-group collapsed" data-cat="${escapeHtml(cat)}">
          <button class="scan-group-head" type="button" aria-expanded="false">
            <span class="scan-group-label">${escapeHtml(cat)} <span class="badge ${items.some(i => i.severity === 'critical') ? 'badge-danger' : 'badge-warning'}">${items.length}</span></span>
            <span class="material-icons-outlined scan-group-caret" aria-hidden="true">expand_more</span>
          </button>
          <div class="scan-group-body">
          ${items.map(f => `
            <div class="scan-finding scan-sev-${f.severity}">
              <span class="scan-sev-badge scan-sev-${f.severity}">${f.severity}</span>
              <div class="scan-finding-body">
                <div class="scan-finding-title">${escapeHtml(f.title)}</div>
                <div class="scan-finding-detail">${escapeHtml(f.detail)}</div>
              </div>
              <button class="btn btn-secondary btn-sm btn-open-scan" data-route="${scanCategoryRoute(f.category)}">Open</button>
            </div>
          `).join('')}
          </div>
        </div>
      `).join('')}</div>`}
    </div>
  ` : '';

  container.innerHTML = `
    <div class="relay-page-head">
      <div class="relay-page-title">
        <span class="material-icons-outlined">shield</span>
        Operations Monitor
        <span class="relay-page-sub">${statusText}</span>
      </div>
      <div class="relay-page-actions">
        <span class="watchdog-alert-badge ${alertCount > 0 ? 'has-alerts' : ''}">
          <span class="material-icons-outlined">notifications_active</span>
          ${alertCount} Alert${alertCount === 1 ? '' : 's'}
        </span>
        ${canScan ? `<button class="btn btn-danger btn-sm btn-run-scan">
          <span class="material-icons-outlined">radar</span> Run Scan
        </button>` : ''}
        <button class="btn btn-secondary btn-sm watchdog-refresh-btn" title="Refresh monitor data">
          <span class="material-icons-outlined">refresh</span> Refresh
        </button>
      </div>
    </div>

    <div class="relay-page-body">
    <div class="watchdog-grid">${domains.map(renderWatchdogCard).join('')}</div>

    ${scanSectionHtml}
    </div>
  `;

  container.querySelector('.watchdog-refresh-btn')?.addEventListener('click', () => {
    renderWatchdogView(container);
    showToast('Monitor data refreshed.', 'info');
  });

  container.querySelector('.btn-run-scan')?.addEventListener('click', () => {
    emergencyFindings = runEmergencyScan();
    surfaceEmergencyAsks(emergencyFindings);
    logAction('Emergency Scan', `Ran scan — ${emergencyFindings.length} finding${emergencyFindings.length === 1 ? '' : 's'}`, emergencyFindings.length ? 'warning' : 'success');
    renderWatchdogView(container);
  });

  container.querySelectorAll('.btn-open-scan').forEach(btn => {
    btn.addEventListener('click', () => {
      window.location.hash = `#/${btn.dataset.route}`;
      showToast(`Opened ${btn.dataset.route} view.`, 'info');
    });
  });

  // Collapsible scan groups — tap the group header to expand/collapse its findings.
  container.querySelectorAll('.scan-group-head').forEach(head => {
    head.addEventListener('click', () => {
      const group = head.closest('.scan-group');
      if (!group) return;
      const collapsed = group.classList.toggle('collapsed');
      head.setAttribute('aria-expanded', String(!collapsed));
    });
  });

  // Collapsible watchdog cards — tap the card head to expand/collapse its drill-down.
  container.querySelectorAll('.watchdog-card-head').forEach(head => {
    head.addEventListener('click', () => {
      const card = head.closest('.watchdog-card');
      if (!card) return;
      const collapsed = card.classList.toggle('collapsed');
      head.setAttribute('aria-expanded', String(!collapsed));
    });
  });

  // Drill-down rows open the underlying record view.
  container.querySelectorAll('.watchdog-drill-open').forEach(btn => {
    btn.addEventListener('click', () => {
      window.location.hash = `#/${btn.dataset.route}`;
      showToast(`Opened ${btn.dataset.route} view.`, 'info');
    });
  });

  // Domain action buttons dispatch on their handler name.
  container.querySelectorAll('.btn-wd-action').forEach(btn => {
    btn.addEventListener('click', () => {
      const handler = btn.dataset.handler;

      if (handler === 'navigate') {
        window.location.hash = `#/${btn.dataset.route}`;
        showToast(`Opened ${btn.dataset.route} view.`, 'info');
        return;
      }

      if (handler === 'autofix-dispatch') {
        const techs = store.getAll('technicians').filter(t => !t.deactivated);
        if (!techs.length) {
          showToast('No active technicians found to assign.', 'warning');
          return;
        }
        let countFixed = 0;
        unassignedJobs.forEach((job, idx) => {
          const tech = techs[idx % techs.length];
          job.technicianId = tech.id;
          job.technicianName = tech.name;
          store.save('jobs', jobs);
          countFixed++;
        });
        logAction('Auto-Fix Dispatch', `Assigned ${countFixed} unassigned jobs to active technicians`);
        showToast(`Deputy assigned ${countFixed} jobs successfully!`, 'success');
        renderWatchdogView(container);
        return;
      }

      if (handler === 'autofix-stock') {
        if (!lowStock.length) return;
        const po = {
          id: 'po_' + Date.now(),
          number: store.getNextNumber('PO-', 'purchaseOrders'),
          supplierName: lowStock[0].supplier || 'General Supplier',
          issueDate: new Date().toISOString(),
          status: 'Draft',
          items: lowStock.map(s => ({
            name: s.name,
            sku: s.sku,
            quantity: Math.max(10, (s.reorderPoint || 5) * 2 - (s.quantity || 0)),
            unitPrice: s.costPrice || s.unitPrice || 0
          })),
          total: lowStock.reduce((sum, s) => sum + (s.costPrice || s.unitPrice || 0) * 10, 0)
        };
        const pos = store.getAll('purchaseOrders') || [];
        pos.push(po);
        store.save('purchaseOrders', pos);
        logAction('Draft Purchase Order', `Created PO ${po.number} for ${lowStock.length} low stock items`);
        showToast(`Draft Purchase Order ${po.number} created for ${lowStock.length} items!`, 'success');
        renderWatchdogView(container);
        return;
      }

      if (handler === 'autofix-invoices') {
        logAction('Payment Reminders', `Sent automated reminders for ${overdueInvoices.length} overdue invoices`);
        showToast(`Reminders sent for ${overdueInvoices.length} overdue invoices!`, 'success');
        renderWatchdogView(container);
        return;
      }

      if (handler === 'autofix-quotes') {
        logAction('Quote Follow-Up', `Logged follow-up tasks for ${pendingQuotes.length} pending quotes`);
        showToast(`Follow-ups logged for ${pendingQuotes.length} pending quotes!`, 'success');
        renderWatchdogView(container);
        return;
      }

      if (handler === 'autofix-timesheets') {
        const count = pendingTimesheets.length;
        if (!count) return;
        pendingTimesheets.forEach(t => store.update('timesheets', t.id, { status: 'Approved' }));
        logAction('Approve Timesheets', `Approved ${count} pending timesheets`);
        showToast(`Approved ${count} timesheets!`, 'success');
        renderWatchdogView(container);
        return;
      }
    });
  });
}

// Live-refresh the Watchdog dashboard whenever the data it reads changes,
// so the "watch" in Watchdog actually watches — no manual refresh needed.
function refreshWatchdog() {
  if (panel && activeTab === 'watchdog') {
    renderWatchdogView(panel.querySelector('#relay-workspace-view'));
  }
}

function scheduleWatchdogRefresh() {
  if (watchdogRefreshTimer) clearTimeout(watchdogRefreshTimer);
  watchdogRefreshTimer = setTimeout(refreshWatchdog, 800);
}

async function renderMemoryInspectorView(container) {
  const memory = await loadUserMemory();
  const entries = Object.entries(memory || {}).filter(([k]) => k !== 'lastUpdated' && k !== 'interactionCount');
  const interactionCount = (memory && memory.interactionCount) || 0;
  const lastUpdated = (memory && memory.lastUpdated)
    ? new Date(memory.lastUpdated).toLocaleString('en-AU', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })
    : null;

  // Structured "personal memory" factsheet, categorised the same way the chat context uses it.
  const currentUser = JSON.parse(localStorage.getItem('currentUser') || 'null');
  const userId = currentUser ? currentUser.id : 'default';
  const factsheetKey = `relay_factsheet_${userId}`;
  const enabledKey = `relay_factsheet_enabled_${userId}`;
  const memEnabled = localStorage.getItem(enabledKey) !== 'false';
  const rawFactsheet = memEnabled ? (localStorage.getItem(factsheetKey) || '') : '';
  const structured = memEnabled ? getStructuredMemory(rawFactsheet) : { preferences: [], dispatchRules: [], clientNotes: [], general: [] };

  const memorySections = [
    { key: 'preferences', label: 'User Preferences', icon: 'favorite' },
    { key: 'dispatchRules', label: 'Dispatch Rules', icon: 'rule' },
    { key: 'clientNotes', label: 'Client Notes', icon: 'groups' },
    { key: 'general', label: 'General Notes', icon: 'notes' }
  ];
  const memorySectionsHtml = memorySections.map(sec => {
    const items = structured[sec.key] || [];
    return `
      <div class="memory-section">
        <div class="memory-section-head">
          <span class="material-icons-outlined">${sec.icon}</span>
          <span class="memory-section-label">${sec.label}</span>
          <span class="badge ${items.length ? 'badge-info' : 'badge-neutral'}">${items.length}</span>
        </div>
        ${items.length
          ? `<ul class="memory-section-list">${items.map(i => `<li>${escapeHtml(i)}</li>`).join('')}</ul>`
          : '<div class="memory-section-empty">Nothing recorded yet.</div>'}
      </div>`;
  }).join('');

  const pendingAsks = (store.getAll('deputyAsks') || [])
    .filter(a => a.status === 'pending')
    .sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

  const statusBadge = { success: 'badge-success', warning: 'badge-warning', error: 'badge-danger' };

  container.innerHTML = `
    <div class="relay-page-head">
      <div class="relay-page-title">
        <span class="material-icons-outlined">psychology</span>
        Memory & Audit Inspector
        <span class="relay-page-sub">Inspect what Deputy has learned, approve outstanding proposals, and review every automated action.</span>
      </div>
    </div>

    <div class="relay-page-body">
    <div class="inspector-grid">
      <div class="inspector-card">
        <div class="inspector-card-head">
          <div class="inspector-card-title">
            <span class="material-icons-outlined" style="color:var(--color-primary)">memory</span>
            Deputy Memory
          </div>
          <div class="inspector-card-meta">${interactionCount} interaction${interactionCount === 1 ? '' : 's'}${lastUpdated ? ` · updated ${lastUpdated}` : ''}</div>
        </div>

        <div class="memory-profile">
          <div class="memory-profile-label">
            <span class="material-icons-outlined" style="font-size:16px;">self_improvement</span>
            Personal Memory ${memEnabled ? '' : '<span class="badge badge-neutral">Disabled</span>'}
          </div>
          ${memEnabled
            ? `<div class="memory-sections">${memorySectionsHtml}</div>`
            : '<div class="memory-section-empty">Personal memory tracking is turned off in settings.</div>'}
        </div>

        <div class="memory-keys">
          <div class="memory-keys-head">
            <span>Learned Keys (${entries.length})</span>
            <button class="btn btn-sm btn-primary btn-add-memory-key" style="font-size:11px;padding:3px 8px;">+ Add Key</button>
          </div>
          <div class="memory-keys-list">
            ${entries.length === 0 ? '<div class="memory-section-empty">No custom memory entries stored yet.</div>' : entries.map(([key, val]) => `
              <div class="memory-entry-row">
                <div class="memory-entry-key">
                  <span class="memory-entry-name">${escapeHtml(key)}:</span>
                  <span class="memory-entry-value">${escapeHtml(typeof val === 'object' ? JSON.stringify(val) : String(val))}</span>
                </div>
                <button class="btn btn-ghost btn-sm btn-delete-memory" data-key="${escapeHtml(key)}" title="Delete Key" style="height:24px;padding:0 6px;color:var(--color-danger);">
                  <span class="material-icons-outlined" style="font-size:14px;">delete</span>
                </button>
              </div>
            `).join('')}
          </div>
        </div>
      </div>

      <div class="inspector-col">
        <div class="inspector-card">
          <div class="inspector-card-head">
            <div class="inspector-card-title">
              <span class="material-icons-outlined" style="color:var(--color-info)">mark_email_read</span>
              Pending Approvals (${pendingAsks.length})
            </div>
          </div>
          <div class="ask-list">
            ${pendingAsks.length === 0 ? '<div class="ask-empty"><span class="material-icons-outlined" style="font-size:28px;opacity:0.5;margin-bottom:6px;">check_circle</span><div>Nothing waiting on your approval.</div></div>' : pendingAsks.map(ask => `
              <div class="ask-row">
                <div class="ask-title">
                  <span class="material-icons-outlined">auto_awesome</span>
                  ${escapeHtml(ask.title || 'Proposal')}
                </div>
                <div class="ask-desc">${escapeHtml(ask.description || '')}</div>
                <div class="ask-actions">
                  <button class="btn btn-primary btn-sm btn-approve-ask" data-id="${escapeHtml(ask.id)}">Approve</button>
                  <button class="btn btn-secondary btn-sm btn-dismiss-ask" data-id="${escapeHtml(ask.id)}">Dismiss</button>
                </div>
              </div>
            `).join('')}
          </div>
        </div>

        <div class="inspector-card">
          <div class="inspector-card-head">
            <div class="inspector-card-title">
              <span class="material-icons-outlined" style="color:var(--color-info)">history</span>
              Action Audit Log (${actionAuditLog.length})
            </div>
            <button class="btn btn-sm btn-secondary btn-clear-audit" style="font-size:11px;padding:3px 8px;" ${actionAuditLog.length === 0 ? 'disabled' : ''}>Clear Log</button>
          </div>
          <div class="audit-list">
            ${actionAuditLog.length === 0 ? '<div class="ask-empty">No automated actions recorded yet.</div>' : actionAuditLog.map(act => `
              <div class="audit-row">
                <div class="audit-row-main">
                  <div class="audit-title">
                    <span class="badge ${statusBadge[act.status] || 'badge-neutral'}">${escapeHtml(act.status || 'info')}</span>
                    ${escapeHtml(act.title)}
                  </div>
                  <div class="audit-detail">${escapeHtml(act.details)}</div>
                </div>
                <span class="audit-time">${escapeHtml(act.timestamp)}</span>
              </div>
            `).join('')}
          </div>
        </div>
      </div>
    </div>
    </div>
  `;

  container.querySelector('.btn-add-memory-key')?.addEventListener('click', () => {
    const content = document.createElement('div');
    content.innerHTML = `
      <div style="display:flex;flex-direction:column;gap:14px;padding-top:4px;">
        <div class="form-group">
          <label class="form-label">Key Name *</label>
          <input type="text" id="mk-key" class="form-input" placeholder="e.g. preferredDispatchZone" autocomplete="off" />
        </div>
        <div class="form-group">
          <label class="form-label">Value</label>
          <textarea id="mk-value" class="form-input" rows="3" placeholder="What should Deputy remember?"></textarea>
        </div>
        <div class="memory-modal-hint">This key is saved to Deputy's learned memory and included in future context.</div>
      </div>
    `;

    const save = async (close) => {
      const key = (content.querySelector('#mk-key').value || '').trim();
      if (!key) { showToast('Please enter a key name', 'error'); return; }
      const value = (content.querySelector('#mk-value').value || '').trim();
      memory[key] = value;
      await saveUserMemory(memory);
      logAction('Added Memory Key', `Saved "${key}" = "${value}"`);
      showToast(`Memory key "${key}" saved!`, 'success');
      close();
      renderMemoryInspectorView(container);
    };

    const { close } = showModal({
      title: 'Add Memory Key',
      content,
      actions: [
        { label: 'Cancel', className: 'btn-secondary', onClick: (close) => close() },
        { label: 'Save Key', className: 'btn-primary', onClick: (close) => save(close) }
      ]
    });

    // Enter in either field saves; Escape already closes via Modal.js.
    content.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' && e.target.tagName !== 'TEXTAREA') {
        e.preventDefault();
        save(close);
      }
    });
    content.querySelector('#mk-key')?.focus();
  });

  container.querySelectorAll('.btn-delete-memory').forEach(btn => {
    btn.addEventListener('click', async (e) => {
      const key = e.currentTarget.dataset.key;
      delete memory[key];
      await saveUserMemory(memory);
      logAction('Deleted Memory Key', `Removed "${key}"`);
      showToast(`Memory key "${key}" deleted`, 'info');
      renderMemoryInspectorView(container);
    });
  });

  container.querySelectorAll('.btn-approve-ask').forEach(btn => {
    btn.addEventListener('click', async () => {
      const askId = btn.dataset.id;
      const ask = (store.getAll('deputyAsks') || []).find(a => a.id === askId);
      if (!ask) return;
      btn.disabled = true;
      try {
        await parseAndExecuteActions(ask.proposedAction);
        store.update('deputyAsks', askId, { status: 'resolved', updated_at: new Date().toISOString() });
        logAction('Approved Proposal', ask.title || 'Pending proposal');
        showToast('Proposal approved and executed.', 'success');
      } catch (err) {
        logAction('Proposal Failed', err.message || String(err), 'error');
        showToast('Failed to execute the proposal.', 'error');
      }
      renderMemoryInspectorView(container);
    });
  });

  container.querySelectorAll('.btn-dismiss-ask').forEach(btn => {
    btn.addEventListener('click', () => {
      const askId = btn.dataset.id;
      const ask = (store.getAll('deputyAsks') || []).find(a => a.id === askId);
      store.update('deputyAsks', askId, { status: 'dismissed', updated_at: new Date().toISOString() });
      logAction('Dismissed Proposal', ask ? ask.title : 'Pending proposal', 'warning');
      showToast('Proposal dismissed.', 'info');
      renderMemoryInspectorView(container);
    });
  });

  container.querySelector('.btn-clear-audit')?.addEventListener('click', () => {
    actionAuditLog = [];
    persistAuditLog();
    showToast('Audit log cleared', 'info');
    renderMemoryInspectorView(container);
  });
}

function scanCategoryRoute(category) {
  switch (category) {
    case SCAN_CATEGORIES.OVERDUE_INVOICE: return 'invoices';
    case SCAN_CATEGORIES.CRITICAL_STOCK: return 'stock';
    case SCAN_CATEGORIES.TECH_CONFLICT: return 'schedule';
    case SCAN_CATEGORIES.OVERDUE_MAINTENANCE: return 'assets';
    default: return 'jobs';
  }
}

function scanProposalForFinding(finding) {
  const id = (finding.recordIds || [])[0] || '';
  switch (finding.category) {
    case SCAN_CATEGORIES.EMERGENCY_JOB: {
      const techs = (store.getAll('technicians') || []).filter(t => !t.deactivated);
      if (techs.length) {
        return `[ACTION: ASSIGN_TECH, {"jobId":"${id}","technicianName":"${techs[0].name}"}]`;
      }
      return `[ACTION: NAVIGATE, {"page":"jobs"}]`;
    }
    case SCAN_CATEGORIES.CRITICAL_STOCK:
      return `[ACTION: REORDER_STOCK, {"itemId":"${id}","quantity":10}]`;
    default:
      return `[ACTION: NAVIGATE, {"page":"${scanCategoryRoute(finding.category)}"}]`;
  }
}

function surfaceEmergencyAsks(findings) {
  const critical = findings.filter(f => f.severity === 'critical');
  if (!critical.length) return;
  const allAsks = store.getAll('deputyAsks') || [];
  const unresolvedAsks = allAsks.filter(a => a.status === 'pending');
  let added = false;
  critical.forEach(finding => {
    const signature = (finding.recordIds || []).sort().join(',');
    const alreadyAsked = unresolvedAsks.some(a => a.conflictJobIds === signature && a.title === finding.title);
    if (alreadyAsked) return;
    allAsks.push({
      id: 'ask_' + Date.now() + Math.random().toString(36).substr(2, 9),
      company_id: store.companyId,
      title: finding.title,
      description: finding.detail,
      proposedAction: scanProposalForFinding(finding),
      status: 'pending',
      conflictJobIds: signature,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    });
    added = true;
  });
  if (added) store.save('deputyAsks', allAsks);
}

function refreshEmergencyScan() {
  if (!hasDeputyMax()) return;
  emergencyFindings = runEmergencyScan();
  surfaceEmergencyAsks(emergencyFindings);
  if (panel && activeTab === 'watchdog') {
    renderWatchdogView(panel.querySelector('#relay-workspace-view'));
  }
}

function scheduleEmergencyScanRefresh() {
  if (!hasDeputyMax()) return;
  if (scanRefreshTimer) clearTimeout(scanRefreshTimer);
  scanRefreshTimer = setTimeout(refreshEmergencyScan, 1200);
}

function updateWorkspaceView(panel) {
  if (!panel) return;
  const workspaceView = panel.querySelector('#relay-workspace-view');
  const chatContainer = panel.querySelector('#relay-chat-container');
  const navTabs = panel.querySelector('#relay-nav-tabs');
  const expandBtn = document.querySelector('#relay-expand');
  const sidebar = panel.querySelector('#relay-thread-sidebar');

  if (navTabs) {
    navTabs.style.display = isExpanded ? 'flex' : 'none';
    navTabs.querySelectorAll('.relay-nav-tab').forEach(tab => {
      tab.classList.toggle('active', tab.dataset.tab === activeTab);
    });
  }

  if (expandBtn) {
    expandBtn.querySelector('.material-icons-outlined').textContent = isExpanded ? 'close_fullscreen' : 'open_in_full';
    expandBtn.title = isExpanded ? 'Minimise to Side Drawer' : 'Expand to Full Workspace';
  }

  // The thread sidebar lives in the expanded workspace.
  if (sidebar && hasDeputyMax()) {
    sidebar.style.display = isExpanded ? 'flex' : 'none';
  }

  if (isExpanded) {
    panel.classList.add('expanded');
    document.body.classList.add('relay-expanded');
    syncPanelToSidebar();
  } else {
    panel.classList.remove('expanded');
    document.body.classList.remove('relay-expanded');
  }

  if (activeTab === 'chat') {
    if (workspaceView) workspaceView.style.display = 'none';
    if (chatContainer) {
      // Fill the expanded workspace (flex column, no overflow) so the chat
      // occupies the whole area rather than hugging the top.
      chatContainer.style.display = 'flex';
      chatContainer.style.flexDirection = 'column';
      chatContainer.style.flex = '1';
      chatContainer.style.minHeight = '0';
      chatContainer.style.overflow = 'hidden';
    }
    if (hasDeputyMax()) renderThreadSidebar();
  } else {
    if (chatContainer) chatContainer.style.display = 'none';
    if (workspaceView) {
      workspaceView.style.display = 'flex';
      if (activeTab === 'watchdog') {
        renderWatchdogView(workspaceView);
      } else if (activeTab === 'inspector') {
        renderMemoryInspectorView(workspaceView);
      } else if (activeTab === 'routines') {
        renderRoutinesView(workspaceView);
      }
    }
  }
}

// ── Routines (Deputy Max automated actions) ────────────────────────────────────
function renderRoutinesView(container) {
  if (!container) return;
  if (!hasDeputyMax()) {
    container.innerHTML = `
      <div style="padding:40px 16px;text-align:center;color:var(--text-tertiary);">
        <span class="material-icons-outlined" style="font-size:40px;opacity:0.5;margin-bottom:12px;">autorenew</span>
        <div>Automated Routines are a Deputy Max feature.</div>
      </div>`;
    return;
  }

  const routines = getRoutines();
  const enabledCount = routines.filter(r => r.enabled).length;

  const cardHtml = routines.map(r => `
    <div class="routine-card ${r.enabled ? '' : 'disabled'}" data-id="${r.id}">
      <div class="routine-card-main">
        <div class="routine-card-title">
          <button class="routine-switch ${r.enabled ? 'on' : 'off'}" data-id="${r.id}" role="switch" aria-checked="${r.enabled}" title="${r.enabled ? 'Disable routine' : 'Enable routine'}">
            <span class="routine-switch-knob"></span>
          </button>
          <span class="routine-name">${escapeHtml(r.title)}</span>
        </div>
        <div class="routine-trigger"><span class="material-icons-outlined">schedule</span> ${escapeHtml(describeTrigger(r.trigger))}</div>
        <div class="routine-prompt">${escapeHtml(r.prompt)}</div>
        <div class="routine-meta">${r.lastRunAt ? `Last ran ${formatRelativeTime(r.lastRunAt)}` : 'Not run yet'}</div>
      </div>
      <div class="routine-card-actions">
        <button class="btn btn-sm btn-secondary btn-routine-run" data-id="${r.id}"><span class="material-icons-outlined" style="font-size:15px;">play_arrow</span> Run now</button>
        <button class="btn btn-sm btn-secondary btn-routine-edit" data-id="${r.id}"><span class="material-icons-outlined" style="font-size:15px;">edit</span> Edit</button>
        <button class="btn btn-sm btn-danger btn-routine-delete" data-id="${r.id}"><span class="material-icons-outlined" style="font-size:15px;">delete</span> Delete</button>
      </div>
    </div>
  `).join('');

  container.innerHTML = `
    <div class="relay-page-head">
      <div class="relay-page-title">
        <span class="material-icons-outlined">autorenew</span>
        Routines
        <span class="relay-page-sub">${
          routines.length === 0
            ? 'Create Deputy actions that run automatically on a schedule.'
            : `${routines.length} routine${routines.length === 1 ? '' : 's'} defined, ${enabledCount} enabled.`
        }</span>
      </div>
      <div class="relay-page-actions">
        <button class="btn btn-primary btn-sm btn-routine-new"><span class="material-icons-outlined">add</span> New Routine</button>
      </div>
    </div>
    <div class="relay-page-body">
    ${routines.length === 0
      ? `<div style="padding:24px 16px;text-align:center;color:var(--text-tertiary);">
           <span class="material-icons-outlined" style="font-size:32px;opacity:0.5;margin-bottom:8px;">event_repeat</span>
           <div>No routines yet. Create one and Deputy will run it on its schedule.</div>
         </div>`
      : `<div class="routines-list">${cardHtml}</div>`}
    </div>
  `;

  container.querySelector('.btn-routine-new')?.addEventListener('click', () => openRoutineEditor(null, container));

  container.querySelectorAll('.btn-routine-edit').forEach(btn => {
    btn.addEventListener('click', () => {
      const r = getRoutine(btn.dataset.id);
      if (r) openRoutineEditor(r, container);
    });
  });

  container.querySelectorAll('.btn-routine-delete').forEach(btn => {
    btn.addEventListener('click', async () => {
      const r = getRoutine(btn.dataset.id);
      const title = r ? r.title : 'this routine';
      showModal({
        title: 'Delete routine',
        content: `Delete "${title}"? Deputy will stop running this routine. This cannot be undone.`,
        actions: [
          { label: 'Cancel', className: 'btn-secondary', onClick: c => c() },
          { label: 'Delete', className: 'btn-danger', onClick: async c => { c(); await deleteRoutine(btn.dataset.id); renderRoutinesView(container); showToast('Routine deleted.', 'success'); } }
        ]
      });
    });
  });

  container.querySelectorAll('.routine-switch').forEach(btn => {
    btn.addEventListener('click', async () => {
      const cur = getRoutine(btn.dataset.id);
      if (!cur) return;
      await updateRoutine(btn.dataset.id, { enabled: !cur.enabled });
      renderRoutinesView(container);
      showToast(cur.enabled ? 'Routine disabled.' : 'Routine enabled.', 'success');
    });
  });

  container.querySelectorAll('.btn-routine-run').forEach(btn => {
    btn.addEventListener('click', async () => {
      const r = getRoutine(btn.dataset.id);
      if (!r) return;
      const s = store.getSettings();
      const ai = s.ai || {};
      if (!ai.enabled) { showToast('Routines need the cloud AI enabled.', 'error'); return; }
      showToast(`Running "${r.title}"…`, 'info');
      await runRoutine(r, ai);
    });
  });
}

// Open the "create / edit routine" modal. `routine` is null for a new routine.
function openRoutineEditor(routine, container) {
  const editing = !!routine;
  const t = routine ? routine.trigger : { type: 'interval', interval: 1, unit: 'days' };

  const form = document.createElement('div');
  form.className = 'routine-editor';
  form.innerHTML = `
    <div class="routine-field">
      <label class="routine-label">Name</label>
      <input type="text" class="form-input routine-fold-title" value="${escapeHtml(routine ? routine.title : '')}" placeholder="e.g. Morning briefing" maxlength="80">
    </div>
    <div class="routine-field">
      <label class="routine-label">Trigger</label>
      <select class="form-input routine-fold-type">
        <option value="interval" ${t.type === 'interval' ? 'selected' : ''}>Every X minutes / hours / days</option>
        <option value="morning" ${t.type === 'morning' ? 'selected' : ''}>Every morning (once a day)</option>
        <option value="new_chat" ${t.type === 'new_chat' ? 'selected' : ''}>On new chat</option>
      </select>
    </div>
    <div class="routine-field routine-fold-interval ${t.type === 'interval' ? '' : 'hidden'}">
      <div class="routine-fold-interval-row">
        <input type="number" class="form-input routine-fold-interval-num" min="1" step="1" value="${t.type === 'interval' ? (t.interval || 1) : 1}">
        <select class="form-input routine-fold-interval-unit">
          <option value="minutes" ${t.unit === 'minutes' ? 'selected' : ''}>minutes</option>
          <option value="hours" ${t.unit === 'hours' ? 'selected' : ''}>hours</option>
          <option value="days" ${(t.unit || 'days') === 'days' ? 'selected' : ''}>days</option>
        </select>
      </div>
    </div>
    <div class="routine-field">
      <label class="routine-label">What should Deputy do?</label>
      <textarea class="form-input routine-fold-prompt" rows="4" placeholder="e.g. Summarise today's schedule, flag unassigned jobs and overdue invoices…">${escapeHtml(routine ? routine.prompt : '')}</textarea>
    </div>
    <div class="routine-divider"><span>Or describe it to Deputy</span></div>
    <div class="routine-field">
      <label class="routine-label">Describe the routine in plain language</label>
      <textarea class="form-input routine-fold-describe" rows="2" placeholder="e.g. Every morning before I start, give me a rundown of the day's jobs"></textarea>
      <button type="button" class="btn btn-secondary btn-sm routine-fold-design"><span class="material-icons-outlined" style="font-size:16px;">auto_awesome</span> Design with Deputy</button>
      <div class="routine-design-status" style="display:none"></div>
    </div>
  `;

  const intervalGroup = form.querySelector('.routine-fold-interval');
  form.querySelector('.routine-fold-type').addEventListener('change', (e) => {
    intervalGroup.classList.toggle('hidden', e.target.value !== 'interval');
  });

  const modal = showModal({
    title: editing ? 'Edit routine' : 'New routine',
    size: 'modal-lg',
    content: form,
    actions: [
      { label: 'Cancel', className: 'btn-secondary', onClick: c => c() },
      {
        label: editing ? 'Save changes' : 'Save routine',
        className: 'btn-primary',
        onClick: async c => {
          const title = form.querySelector('.routine-fold-title').value.trim();
          const type = form.querySelector('.routine-fold-type').value;
          const prompt = form.querySelector('.routine-fold-prompt').value.trim();
          if (!prompt) { showToast('Tell Deputy what the routine should do.', 'error'); return; }
          const trigger = {
            type,
            interval: Math.max(1, Number(form.querySelector('.routine-fold-interval-num').value) || 1),
            unit: form.querySelector('.routine-fold-interval-unit').value
          };
          if (editing) await updateRoutine(routine.id, { title: title || routine.title, trigger, prompt });
          else await createRoutine({ title, trigger, prompt });
          c();
          renderRoutinesView(container);
          showToast(editing ? 'Routine updated.' : 'Routine created.', 'success');
        }
      }
    ]
  });

  form.querySelector('.routine-fold-design').addEventListener('click', async () => {
    const describe = form.querySelector('.routine-fold-describe').value.trim();
    if (!describe) { showToast('Describe what you want the routine to do first.', 'info'); return; }
    const s = store.getSettings();
    const ai = s.ai || {};
    if (!ai.enabled || !hasDeputyMax()) {
      showToast('Design with Deputy needs the cloud AI enabled.', 'error');
      return;
    }
    // Run the guided, multiple-choice routine designer inside this modal.
    try {
      await runRoutineDesignWizard(modal, describe, container, ai);
    } catch (err) {
      console.error('Routine wizard failed', err);
      showToast('Couldn’t start the routine designer.', 'error');
    }
  });
}

// Ask Deputy to come up with a couple of multiple-choice clarifying questions for
// the routine's purpose. Returns [{ text, options: [] }]. Falls back to generic
// questions (or none) if the AI is unavailable or returns unparseable output.
async function generateRoutineClarifications(intent, ai, model) {
  const fallback = [
    { text: 'What should the routine focus on?', options: ['Jobs only', 'Jobs and invoices', 'Overdue items', 'Everything needing attention'] },
    { text: 'How detailed should the result be?', options: ['A quick summary', 'A detailed report', 'A checklist of action items'] },
    { text: 'How should urgent issues be handled?', options: ['Just mention them', 'Flag them as critical', 'List them at the top'] },
    { text: 'The next run should show?', options: ['Only new changes', 'Everything, every time', 'Just a short update'] }
  ];
  if (!ai || !ai.enabled) return fallback;
  const messages = [
    {
      role: 'system',
      content: 'You are Deputy, designing an automated routine for a dispatcher. Ask 3-4 short, useful multiple-choice questions that clarify the routine\'s intent and expand what it should produce, so the final routine is precise and genuinely useful. Each question must be answerable by tapping ONE option (3-4 options). Do NOT ask anything requiring typed input. Vary the questions across scope, detail, urgency and output. Return ONLY a JSON object, no markdown, no prose, in this exact shape: {"questions":[{"text":"...","options":["...","...","..."]}]}'
    },
    { role: 'user', content: `ROUTINE PURPOSE: ${intent}` }
  ];
  let raw = '';
  try { raw = await dispatchChat(messages, ai, model); } catch { return fallback; }
  try {
    const start = raw.indexOf('{');
    const end = raw.lastIndexOf('}');
    const json = start >= 0 && end > start ? raw.slice(start, end + 1) : raw;
    const parsed = JSON.parse(json);
    const questions = (parsed.questions || [])
      .filter(q => q && q.text && Array.isArray(q.options) && q.options.length >= 2)
      .map(q => ({ text: q.text.trim(), options: q.options.map(o => String(o).trim()).filter(Boolean) }))
      .filter(q => q.options.length >= 2)
      .slice(0, 4);
    if (questions.length) return questions;
  } catch { /* fall through to generic questions */ }
  return fallback;
}

// Guided, multiple-choice routine designer that runs inside the "New routine"
// modal. Every question is answered by tapping an option — no free text. Walks
// trigger → (custom interval) → confirm, then saves the routine.
async function runRoutineDesignWizard(modal, describe, container, ai) {
  // `showModal` returns { close, modal, overlay } — `modal` here is that object.
  const { close, modal: modalEl } = modal;
  const body = modalEl.querySelector('.modal-body');
  if (!body) return;
  const footer = modalEl.querySelector('.modal-footer');
  if (footer) footer.style.display = 'none';

  const model = (ai && ai.model) || 'deepseek-chat';
  const ctx = {
    describe,
    trigger: null,
    triggerLabel: '',
    stage: 'trigger',
    questions: null,
    qIndex: 0,
    qAnswers: [],
    loading: false
  };

  const deriveName = () => {
    const base = (ctx.describe || '')
      .replace(/^(?:please\s+)?(?:every\s+(?:morning|afternoon|evening|night|day|hour|week|month)|each\s+(?:morning|day|week|month)|daily|weekly|monthly|on\s+new\s+chat)\s*[:,]?\s*/i, '')
      .replace(/^(?:just\s+|please\s+|i\s+want\s+(?:you\s+to\s+)?)/i, '')
      .replace(/[.?!]+$/, '').trim();
    if (base) return capitalise(base.slice(0, 48));
    if (ctx.trigger && ctx.trigger.type === 'morning') return 'Morning routine';
    if (ctx.trigger && ctx.trigger.type === 'new_chat') return 'On new chat';
    return 'Routine';
  };

  const wizard = document.createElement('div');
  wizard.className = 'routine-design-wizard';
  wizard.innerHTML = `
    <div class="routine-design-head">
      <span class="material-icons-outlined">auto_awesome</span>
      <span>Designing your routine</span>
    </div>
    <div class="routine-design-body"></div>
    <div class="routine-design-foot">
      <button type="button" class="btn btn-ghost btn-sm routine-design-cancel">Cancel</button>
    </div>
  `;
  body.innerHTML = '';
  body.appendChild(wizard);

  const qBody = wizard.querySelector('.routine-design-body');
  wizard.querySelector('.routine-design-cancel').addEventListener('click', () => close());

  const optionButtons = (options) => options.map(o =>
    `<button type="button" class="relay-question-opt-btn" data-value="${escapeHtml(o.value)}" data-label="${escapeHtml(o.label)}">${escapeHtml(o.label)}</button>`
  ).join('');

  const wire = (onPick) => {
    qBody.querySelectorAll('.relay-question-opt-btn').forEach(btn => {
      btn.addEventListener('click', () => onPick(btn.dataset.value, btn.dataset.label));
    });
  };

  const fetchClarifications = async () => {
    ctx.loading = true;
    render();
    const questions = await generateRoutineClarifications(ctx.describe, ai, model);
    ctx.questions = questions;
    ctx.loading = false;
    render();
  };

  const render = () => {
    qBody.innerHTML = '';

    if (ctx.stage === 'trigger') {
      qBody.innerHTML = `
        <div class="routine-design-q">
          <div class="relay-question-title">When should this routine run?</div>
          <div class="relay-question-options">${optionButtons([
            { label: 'Every morning', value: 'morning' },
            { label: 'Every day', value: 'day' },
            { label: 'Every hour', value: 'hour' },
            { label: 'On new chat', value: 'new_chat' },
            { label: 'Custom interval', value: 'custom' }
          ])}</div>
        </div>
      `;
      wire((val) => {
        if (val === 'morning') { ctx.trigger = { type: 'morning' }; ctx.triggerLabel = 'Every morning'; ctx.stage = 'clarify'; render(); }
        else if (val === 'day') { ctx.trigger = { type: 'interval', interval: 1, unit: 'days' }; ctx.triggerLabel = 'Every day'; ctx.stage = 'clarify'; render(); }
        else if (val === 'hour') { ctx.trigger = { type: 'interval', interval: 1, unit: 'hours' }; ctx.triggerLabel = 'Every hour'; ctx.stage = 'clarify'; render(); }
        else if (val === 'new_chat') { ctx.trigger = { type: 'new_chat' }; ctx.triggerLabel = 'On new chat'; ctx.stage = 'clarify'; render(); }
        else { ctx.stage = 'interval'; render(); }
      });
      return;
    }

    if (ctx.stage === 'interval') {
      qBody.innerHTML = `
        <div class="routine-design-q">
          <div class="relay-question-title">How often should it run?</div>
          <div class="relay-question-options">${optionButtons([
            { label: 'Every 30 minutes', value: '30 minutes' },
            { label: 'Every 2 hours', value: '2 hours' },
            { label: 'Every 6 hours', value: '6 hours' },
            { label: 'Once a day', value: '1 day' },
            { label: 'Once a week', value: '1 week' }
          ])}</div>
        </div>
      `;
      wire((val, label) => {
        ctx.triggerLabel = label;
        ctx.trigger = parseIntervalAnswer(val);
        ctx.stage = 'clarify';
        render();
      });
      return;
    }

    if (ctx.stage === 'clarify') {
      if (!ctx.questions) {
        if (!ctx.loading) fetchClarifications();
        qBody.innerHTML = `
          <div class="routine-design-q">
            <div class="relay-question-title">Deputy is thinking up a couple of quick questions…</div>
            <div class="routine-design-loading">Loading</div>
          </div>
        `;
        return;
      }
      const q = ctx.questions[ctx.qIndex];
      if (!q) { ctx.stage = 'confirm'; render(); return; }
      qBody.innerHTML = `
        <div class="routine-design-q">
          <div class="relay-question-title">${escapeHtml(q.text)}</div>
          <div class="relay-question-options">${optionButtons(q.options.map(o => ({ label: o, value: o })))}</div>
        </div>
      `;
      wire((val, label) => {
        ctx.qAnswers.push({ q: q.text, a: label });
        ctx.qIndex++;
        render();
      });
      return;
    }

    // confirm stage
    const detail = ctx.qAnswers.map(a => a.a).join(', ');
    const prompt = ctx.qAnswers.length
      ? `${ctx.describe}. ${ctx.qAnswers.map(a => `${a.q} ${a.a}`).join('; ')}`
      : ctx.describe;
    qBody.innerHTML = `
      <div class="routine-design-summary">
        <div class="routine-summary-row"><span class="routine-summary-key">Do</span><span>${escapeHtml(ctx.describe)}</span></div>
        <div class="routine-summary-row"><span class="routine-summary-key">When</span><span>${escapeHtml(ctx.triggerLabel)}</span></div>
        ${detail ? `<div class="routine-summary-row"><span class="routine-summary-key">Details</span><span>${escapeHtml(detail)}</span></div>` : ''}
        <div class="routine-summary-row"><span class="routine-summary-key">Name</span><span>${escapeHtml(deriveName())}</span></div>
      </div>
      <div class="routine-design-q">
        <div class="relay-question-title">Save this routine?</div>
        <div class="relay-question-options">
          <button type="button" class="relay-question-opt-btn routine-q-save" data-value="save">Save routine</button>
          <button type="button" class="relay-question-opt-btn" data-value="change">Change when it runs</button>
        </div>
      </div>
    `;
    qBody.querySelector('.routine-q-save').addEventListener('click', async () => {
      await createRoutine({ title: deriveName(), trigger: ctx.trigger, prompt });
      close();
      renderRoutinesView(container);
      showToast('Routine created.', 'success');
    });
    qBody.querySelectorAll('.relay-question-opt-btn').forEach(btn => {
      if (btn.dataset.value === 'change') {
        btn.addEventListener('click', () => { ctx.stage = 'trigger'; ctx.trigger = null; ctx.triggerLabel = ''; ctx.qIndex = 0; ctx.qAnswers = []; render(); });
      }
    });
  };

  render();
}

// Start the routine scheduler: a ~60s tick that fires any due interval/morning
// routines. Runs for Max users regardless of whether the Deputy panel is open.
function scheduleRoutineEvaluation() {
  if (routineTimer) clearInterval(routineTimer);
  routineTimer = setInterval(() => { evaluateRoutines({ reason: 'timer' }); }, 60000);
}

async function evaluateRoutines({ reason = 'timer' } = {}) {
  if (!hasDeputyMax()) return;
  const s = store.getSettings();
  const ai = s.ai || {};
  if (!ai.enabled) return;
  if (routineRunning) return;

  const routines = getRoutines();
  const due = routines.filter(r => routineIsDue(r, { reason }));
  if (!due.length) return;

  routineRunning = true;
  try {
    await Promise.all(due.map(r => runRoutine(r, ai)));
  } finally {
    routineRunning = false;
    if (panel && activeTab === 'routines') {
      const ws = panel.querySelector('#relay-workspace-view');
      if (ws) renderRoutinesView(ws);
    }
  }
}

// Run a single routine: send its prompt to the AI, execute any action tags, and
// surface the result in chat.
async function runRoutine(routine, ai) {
  const systemPrompt = buildSystemPrompt(ai);
  const model = ai.model || 'deepseek-chat';
  try {
    const reply = await dispatchChat([
      { role: 'system', content: systemPrompt },
      { role: 'user', content: routine.prompt }
    ], ai, model);
    const clean = await finaliseRoutineReply(reply, systemPrompt, ai, model);
    const surfaceText = (clean && clean.trim()) || `Ran "${routine.title}" — ${describeTrigger(routine.trigger)}.`;
    await surfaceRoutineResult(routine, surfaceText);
    const t = await markRoutineRun(routine.id);
    logAction('Routine', `Ran "${t ? t.title : routine.title}" — ${describeTrigger(routine.trigger)}`);
  } catch (err) {
    console.error(`Routine "${routine.title}" failed:`, err);
    logAction('Routine', `"${routine.title}" failed — ${err.message || err}`, 'error');
  }
}

// Record a routine result into its own, appropriately-named chat tab so the
// output is easy to find and never clutters whatever the user was doing.
async function surfaceRoutineResult(routine, text) {
  if (hasDeputyMax()) {
    // The routine runs as its own system: seed a title card for the routine
    // (not the raw prompt) so the result reads as a standalone report, and name
    // the tab after the routine's short title.
    const tabTitle = routine.title && routine.title !== 'New routine' ? routine.title : 'Routine result';
    const seed = [
      { role: 'routine', title: tabTitle, triggerLabel: describeTrigger(routine.trigger) },
      { role: 'assistant', content: text }
    ];
    const t = await createThread(tabTitle, seed);
    currentThreadId = t.id;
    localStorage.setItem(lastThreadKey(), t.id);
    chatHistory = loadChatHistory();
  } else {
    chatHistory.push({ role: 'assistant', content: text });
    trimHistory();
    saveChatHistory(chatHistory);
  }

  // Refresh the thread DOM even if the user is on another tab, so the result is
  // visible the moment they switch back to Chat.
  const threadEl = panel ? panel.querySelector('#relay-thread') : null;
  if (threadEl) await renderChatThread(threadEl);
  if (hasDeputyMax()) renderThreadSidebar();
}

// Format an ISO timestamp as a short human relative time ("5m ago", "2h ago").
function formatRelativeTime(iso) {
  if (!iso) return '';
  const then = new Date(iso);
  const diff = Date.now() - then.getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}d ago`;
  return then.toLocaleDateString();
}

// ── Top-bar Deputy controls ──
// The expand / clear / close actions now live in the page top bar (next to the
// Deputy trigger), so they outlive the drawer element and must be bound once.
let topbarRelayBound = false;

function handleExpandClick() {
  if (!panel) return;
  isExpanded = !isExpanded;
  localStorage.setItem('relay_expanded', isExpanded);
  activeTab = 'chat';
  updateWorkspaceView(panel);
}

function handleClearChatClick() {
  if (!panel) return;
  const thread = panel.querySelector('#relay-thread');
  if (!thread) return;
  showModal({
    title: 'Clear chat',
    content: hasDeputyMax()
      ? 'Clear this conversation? Its messages will be removed but the chat stays in your list.'
      : 'Clear this chat? This will permanently remove the conversation history.',
    actions: [
      { label: 'Cancel', className: 'btn-secondary', onClick: c => c() },
      {
        label: 'Clear',
        className: 'btn-danger',
        onClick: async c => {
          c();
          if (hasDeputyMax()) {
            // Max: clear only the active thread, keep the rest.
            await clearDeputyThread(currentThreadId);
          } else {
            chatHistory = [];
            localStorage.removeItem(`relay_chat_history_${getUserId()}`);
            localStorage.removeItem(`relay_draft_message_${getUserId()}`);
            thread.innerHTML = '';
            renderIntroDashboard(thread, {});
            showToast('Chat cleared.', 'success');
          }
        }
      }
    ]
  });
}

function bindTopbarRelayControls() {
  if (topbarRelayBound) return;
  const expandBtn = document.querySelector('#relay-expand');
  const clearBtn = document.querySelector('#relay-clear-chat');
  const closeBtn = document.querySelector('#relay-close');
  if (!expandBtn || !clearBtn || !closeBtn) return;
  expandBtn.addEventListener('click', handleExpandClick);
  clearBtn.addEventListener('click', handleClearChatClick);
  closeBtn.addEventListener('click', closeRelay);
  topbarRelayBound = true;
}

// Files the user has attached to the next message (not yet sent).
function renderIntroDashboard(thread, memory) {
  // Get user details
  const currentUser = JSON.parse(localStorage.getItem('currentUser') || 'null');
  const userName = currentUser ? (currentUser.name || 'Admin') : 'Admin';
  const firstName = userName.split(' ')[0];

  // Get current time greeting
  const hours = new Date().getHours();
  let timeGreeting = 'Good day';
  if (hours < 12) timeGreeting = 'Good morning';
  else if (hours < 18) timeGreeting = 'Good afternoon';
  else timeGreeting = 'Good evening';

  // Retrieve metrics
  const jobs = store.getAll('jobs') || [];
  const quotes = store.getAll('quotes') || [];
  const invoices = store.getAll('invoices') || [];
  const stock = store.getAll('stock') || [];
  
  const activeJobsList = jobs.filter(j => j.status === 'Scheduled' || j.status === 'In Progress');
  const activeJobsCount = activeJobsList.length;
  const pendingQuotes = quotes.filter(q => q.status === 'Sent' || q.status === 'Pending' || q.status === 'Draft').length;
  const overdueInvoices = invoices.filter(i => i.status === 'Overdue').length;
  const unassignedJobs = jobs.filter(j => {
    if (j.status !== 'Scheduled' && j.status !== 'In Progress' && j.status !== 'Pending') return false;
    const hasTechName = j.technicianName && j.technicianName !== 'Unassigned';
    const hasTechArray = j.technicians && j.technicians.length > 0;
    return !hasTechName && !hasTechArray;
  });
  const lowStock = stock.filter(s => (s.quantity || 0) <= (s.reorderPoint || 5));
  
  // Detect schedule conflicts (overlapping schedule blocks)
  const schedules = store.getAll('schedule') || [];
  const techDateBlocks = {};
  schedules.forEach(s => {
    if (!s.technicianId || !s.date) return;
    const key = `${s.technicianId}_${s.date}`;
    if (!techDateBlocks[key]) techDateBlocks[key] = [];
    techDateBlocks[key].push(s);
  });
  
  let conflictCount = 0;
  Object.values(techDateBlocks).forEach(blocks => {
    if (blocks.length > 1) {
      blocks.sort((a, b) => (a.startHour || 0) - (b.startHour || 0));
      for (let i = 1; i < blocks.length; i++) {
        if ((blocks[i].startHour || 0) < (blocks[i-1].endHour || 0)) {
          conflictCount++;
          break; // Count at most 1 conflict per tech per day
        }
      }
    }
  });

  const count = memory.interactionCount || 0;
  const welcomeText = count > 0 
    ? `Welcome back! You've checked in with Deputy ${count} ${count === 1 ? 'time' : 'times'} recently.` 
    : `Welcome to Deputy! I'm here to help you coordinate your dispatch and jobs today.`;

  const card = document.createElement('div');
  card.className = 'relay-intro-card assistant-intro';
  card.innerHTML = `
    <div class="relay-intro-banner">
      <div class="relay-intro-emoji"><span class="material-icons-outlined">waving_hand</span></div>
      <div class="relay-intro-welcome">
        <h3>${timeGreeting}, ${escapeHtml(firstName)}!</h3>
        <p>${welcomeText}</p>
      </div>
    </div>
    
    <div class="relay-intro-stats-grid">
      <div class="relay-stat-item" data-cmd="how many overdue invoices">
        <span class="relay-stat-num">${overdueInvoices}</span>
        <span class="relay-stat-label">Overdue Invoices</span>
      </div>
      <div class="relay-stat-item" data-cmd="how many active jobs">
        <span class="relay-stat-num">${activeJobsCount}</span>
        <span class="relay-stat-label">Active Jobs</span>
      </div>
      <div class="relay-stat-item" data-cmd="how many pending quotes">
        <span class="relay-stat-num">${pendingQuotes}</span>
        <span class="relay-stat-label">Pending Quotes</span>
      </div>
    </div>

    <div class="relay-intro-suggestions">
      <div class="relay-suggestions-title">Quick Commands & Proactive Alerts</div>
      <div class="relay-suggestion-chips">
        ${unassignedJobs.length > 0 ? `<button class="relay-chip-btn warning-chip" data-cmd="assign technicians to unassigned jobs"><span class="material-icons-outlined chip-ico">warning</span> ${unassignedJobs.length} Unassigned Job(s) — Auto Assign</button>` : ''}
        ${conflictCount > 0 ? `<button class="relay-chip-btn warning-chip" data-cmd="optimize today's schedule and resolve conflicts"><span class="material-icons-outlined chip-ico">warning</span> ${conflictCount} Schedule Collision(s) — Optimize</button>` : ''}
        ${lowStock.length > 0 ? `<button class="relay-chip-btn info-chip" data-cmd="show low stock items and reorder"><span class="material-icons-outlined chip-ico">inventory_2</span> ${lowStock.length} Low Stock Item(s) — Reorder</button>` : ''}
        ${FLAGS.maps ? `<button class="relay-chip-btn" data-cmd="What's the best order to run today's jobs, with drive times?"><span class="material-icons-outlined chip-ico">map</span> Plan Today's Route</button>` : ''}
        <button class="relay-chip-btn" data-cmd="What's happening this week?"><span class="material-icons-outlined chip-ico">calendar_month</span> What's Happening This Week</button>
        ${(() => {
            let topChip = { cmd: '', label: '' };
            if (activeJobsCount >= overdueInvoices && activeJobsCount >= pendingQuotes) {
              topChip = { cmd: 'create a new job', label: '<span class="material-icons-outlined chip-ico">build</span> Create New Job' };
            } else if (overdueInvoices >= activeJobsCount && overdueInvoices >= pendingQuotes) {
              topChip = { cmd: `show ${overdueInvoices} overdue invoices`, label: `<span class="material-icons-outlined chip-ico">receipt_long</span> Overdue Invoices (${overdueInvoices})` };
            } else {
              topChip = { cmd: `show ${pendingQuotes} pending quotes`, label: `<span class="material-icons-outlined chip-ico">request_quote</span> Pending Quotes (${pendingQuotes})` };
            }
            return '<button class="relay-chip-btn" data-cmd="' + topChip.cmd + '">' + topChip.label + '</button>';
          })()}
      </div>
    </div>
  `;

  // Attach click listeners to all items that submit a command
  const submitCmd = (cmd) => {
    const panelEl = thread.closest('.relay-panel');
    const inputEl = panelEl ? panelEl.querySelector('#relay-input') : null;
    const sendBtn = panelEl ? panelEl.querySelector('#relay-send') : null;
    if (inputEl && sendBtn) {
      inputEl.value = cmd;
      sendBtn.click();
    }
  };

  card.querySelectorAll('[data-cmd]').forEach(el => {
    el.addEventListener('click', () => {
      submitCmd(el.getAttribute('data-cmd'));
    });
  });

  thread.appendChild(card);
  return card;
}
// objects — converted to image data URLs at send time so previews stay cheap.
let pendingAttachments = [];
// When true, per-record success toasts are suppressed so a bulk import shows one
// summary toast instead of dozens.
let suppressActionToasts = false;

// Whether the AI backend is usable right now. Cloud users go through the secure
// edge function (no client key needed); local users must enable AI + supply a key.
function canUseAI(ai) {
  return isCloudUser() ? (ai.enabled !== false) : !!(ai.enabled && ai.apiKey);
}

function getUserId() {
  const currentUser = JSON.parse(localStorage.getItem('currentUser') || 'null');
  return currentUser ? currentUser.id : 'default';
}

function loadChatHistory() {
  // Deputy Max: history lives in the active thread (cloud-synced).
  if (hasDeputyMax()) {
    if (!currentThreadId) return [];
    const t = getThread(currentThreadId);
    return t && Array.isArray(t.messages) ? t.messages : [];
  }
  // Base/cloud: legacy single-history in localStorage.
  const key = `relay_chat_history_${getUserId()}`;
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : [];
  } catch (e) {
    console.error('Failed to load chat history', e);
    return [];
  }
}

function saveChatHistory(history) {
  // Deputy Max: persist to the active thread.
  if (hasDeputyMax()) {
    if (currentThreadId) {
      setThreadMessages(currentThreadId, history);
      autoTitleThread(currentThreadId, history);
    }
    return;
  }
  // Base/cloud: legacy single-history in localStorage.
  const key = `relay_chat_history_${getUserId()}`;
  try {
    localStorage.setItem(key, JSON.stringify(history));
  } catch (e) {
    console.error('Failed to save chat history', e);
  }
}

// Auto-name a new chat from its first user message while it still has the
// placeholder title. Re-renders the sidebar so the updated name shows.
async function autoTitleThread(threadId, history) {
  if (!hasDeputyMax() || !threadId) return;
  const t = getThread(threadId);
  if (!t) return;
  if (t.title && t.title !== 'New chat') return;
  const derived = deriveThreadTitle(history);
  if (!derived || derived === t.title) return;
  await renameThread(threadId, derived);
  renderThreadSidebar();
}



export function isRelayOpen() { return !!panel; }
export function onRelayToggle(cb) { onStateChange = cb; }

export function toggleRelay() { panel ? closeRelay() : openRelay(); }

export async function openDeputyWithPrompt(promptText) {
  if (!panel) {
    await openRelay();
  }
  const input = panel.querySelector('#relay-input');
  if (input) {
    input.value = promptText;
    input.focus();
  }
}

export async function openRelay() {
  if (panel) return;

  if (!hasPermission('AI Assistant', 'use')) return;

  // Chat is the default tab in both minimised and expanded modes.
  activeTab = 'chat';

  const draftKey = `relay_draft_message_${getUserId()}`;
  const draftVal = localStorage.getItem(draftKey) || '';
  const cloud = isCloudUser();
  pendingAttachments = [];

  panel = document.createElement('div');
  panel.className = `relay-panel ${isExpanded ? 'expanded' : ''}`;
  panel.innerHTML = `
    <div class="relay-body">
      <div class="relay-tabs-rail" id="relay-nav-tabs" style="${isExpanded ? 'display:flex' : 'display:none'}">
        <div class="relay-tabs-rail-head">Deputy</div>
        <nav class="relay-tabs-rail-nav">
          <button class="relay-nav-tab ${activeTab === 'chat' ? 'active' : ''}" data-tab="chat" title="Chat Stream"><span class="material-icons-outlined">chat</span> Chat</button>
          <button class="relay-nav-tab ${activeTab === 'routines' ? 'active' : ''}" data-tab="routines" title="Automated Routines" style="${hasDeputyMax() ? '' : 'display:none'}"><span class="material-icons-outlined">autorenew</span> Routines</button>
          <button class="relay-nav-tab ${activeTab === 'watchdog' ? 'active' : ''}" data-tab="watchdog" title="Operations Monitor"><span class="material-icons-outlined">shield</span> Watchdog</button>
          <button class="relay-nav-tab ${activeTab === 'inspector' ? 'active' : ''}" data-tab="inspector" title="Memory & Audit Inspector"><span class="material-icons-outlined">psychology</span> Inspector</button>
        </nav>
      </div>
      <div class="relay-main">
        <div class="relay-workspace-view" id="relay-workspace-view" style="${activeTab !== 'chat' ? 'display:flex' : 'display:none'}"></div>
      <div class="relay-chat-container" id="relay-chat-container" style="${activeTab === 'chat' ? 'display:flex;flex-direction:column;flex:1;overflow:hidden' : 'display:none'}">
      <div class="relay-chat-body">
        <div class="relay-thread-sidebar" id="relay-thread-sidebar" style="${hasDeputyMax() ? '' : 'display:none'}"></div>
        <div class="relay-chat-main">
          <div class="relay-weekly-overlay" id="relay-weekly-overlay"></div>
          <div class="relay-thread" id="relay-thread"></div>
          <div class="relay-attach-row" id="relay-attach-row"></div>
          <div class="relay-input-wrap">
            <button class="relay-attach" id="relay-attach" title="${hasDeputyMax() ? 'Attach an image or PDF — catalogue, business card…' : 'Attachments are a Deputy Max feature'}" ${hasDeputyMax() ? '' : 'disabled'}><span class="material-icons-outlined">attach_file</span></button>
            <input type="file" id="relay-file-input" accept="image/*,application/pdf" multiple hidden>
            <textarea id="relay-input" class="relay-input" rows="1" placeholder="Ask Deputy">${escapeHtml(draftVal)}</textarea>
            <button class="relay-send" id="relay-send" title="Send"><span class="material-icons-outlined">arrow_upward</span></button>
          </div>
          <div class="relay-foot">This is an early version. You may need to be patient</div>
        </div>
      </div>
      </div>
      </div>
    </div>
  `;
  document.body.appendChild(panel);
  document.body.classList.add('relay-assistant-open');
  syncPanelToSidebar();
  observeSidebarRail();
  void panel.offsetWidth;
  panel.classList.add('open');

  const thread = panel.querySelector('#relay-thread');
  const input = panel.querySelector('#relay-input');
  const send = panel.querySelector('#relay-send');
  const navTabs = panel.querySelector('#relay-nav-tabs');

  bindTopbarRelayControls();

  if (navTabs) {
    navTabs.querySelectorAll('.relay-nav-tab').forEach(tab => {
      tab.addEventListener('click', (e) => {
        activeTab = e.currentTarget.dataset.tab;
        updateWorkspaceView(panel);
      });
    });
  }

  // Watchdog: live-refresh the dashboard on relevant store changes.
  ['jobs', 'schedule', 'invoices', 'stock', 'quotes'].forEach(coll => store.on(coll, scheduleWatchdogRefresh));

  // Emergency scan: refresh on relevant store changes + run once on open.
  if (hasDeputyMax()) {
    ['jobs', 'schedule', 'invoices', 'stock', 'maintenancePlans'].forEach(coll => store.on(coll, scheduleEmergencyScanRefresh));
    refreshEmergencyScan();
  }

  updateWorkspaceView(panel);

  if (draftVal) {
    autoGrow(input);
  }

  // Select the active thread (Deputy Max) or fall back to the legacy single
  // history. Max users restore the last-opened thread across sessions.
  if (hasDeputyMax()) {
    await ensureDefaultThread();
    const threads = getThreads();
    const saved = localStorage.getItem(lastThreadKey());
    currentThreadId = (saved && threads.some(t => t.id === saved))
      ? saved
      : (threads.length ? threads[0].id : null);
    if (currentThreadId) localStorage.setItem(lastThreadKey(), currentThreadId);
    renderThreadSidebar();
  }

  // Load persisted history
  chatHistory = loadChatHistory();

  // Update interaction count and timestamp
  let memory = await loadUserMemory();
  memory = clearStaleMemory(memory);
  const updatedMemory = {
    ...memory,
    interactionCount: (memory.interactionCount || 0) + 1,
    lastUpdated: Date.now(),
  };
  await saveUserMemory(updatedMemory);

  await renderChatThread(thread);

  const submit = async () => {
    const text = input.value.trim();
    const hasFiles = pendingAttachments.length > 0;
    if (!text && !hasFiles) return;

    localStorage.removeItem(draftKey);

    // ── Attachment turn (vision extraction, cloud only) ──
    if (hasFiles) {
      const files = pendingAttachments.slice();
      clearAttachments();

      const displayText = text ? `${text}\n\n${attachmentLabel(files)}` : attachmentLabel(files);
      chatHistory = loadChatHistory();
      chatHistory.push({ role: 'user', content: displayText });
      trimHistory();
      saveChatHistory(chatHistory);
      addMessage(thread, 'user', displayText);
      input.value = '';
      autoGrow(input);

      const ai = (store.getSettings() || {}).ai || {};
      if (isCloudUser()) {
        if (!hasDeputyMax()) {
          const reply = "Attachments and document extraction are a Deputy Max feature — upgrade your plan to Cloud+ to use them.";
          pushAssistant(reply);
          addMessage(thread, 'relay', reply);
          return;
        }
        if (!canUseAI(ai)) {
          const reply = "Attachments need the cloud AI assistant enabled. An admin can turn it on in Settings → AI.";
          pushAssistant(reply);
          addMessage(thread, 'relay', reply);
          return;
        }
      } else if (!canUseAI(ai)) {
        const reply = "Attachments need the AI assistant enabled with an API key. An admin can turn it on in Settings → AI.";
        pushAssistant(reply);
        addMessage(thread, 'relay', reply);
        return;
      }

      const typing = addTyping(thread);
      try {
        await runVisionExtraction(text, files, thread, typing);
      } catch (err) {
        console.error('Relay vision extraction failed:', err);
        typing.remove();
        const reply = `I couldn't read that attachment. (${err.message || err})`;
        pushAssistant(reply);
        addMessage(thread, 'relay', reply);
      }
      return;
    }

    // ── Plain text turn ──
    chatHistory = loadChatHistory();
    chatHistory.push({ role: 'user', content: text });
    trimHistory();
    saveChatHistory(chatHistory);

    addMessage(thread, 'user', text);
    input.value = '';
    autoGrow(input);

    // Deputy Max: a routine request triggers a guided interview instead of a
    // single-shot answer, so the routine is fully flushed out before it's saved.
    if (hasDeputyMax()) {
      const built = await runRoutineBuilder(text);
      if (built.handled) {
        pushAssistant(built.reply);
        addMessage(thread, 'relay', built.reply);
        return;
      }
    }

    const typing = addTyping(thread);

    try {
      const s = store.getSettings();
      const ai = s.ai || {};

      if (canUseAI(ai)) {
        const response = hasDeputyMax() ? await callAIEngineWithTriage() : await callAIEngine();
        typing.remove();
        addMessage(thread, 'relay', response);
      } else {
        // Fallback to rule-based local assistant
        setTimeout(() => {
          typing.remove();
          const reply = runLocalCommand(text);
          pushAssistant(reply);
          addMessage(thread, 'relay', reply);
        }, 380);
      }
    } catch (err) {
      console.error('AI assistant failed, falling back to local commands:', err);
      typing.remove();
      const reply = `[Error: ${err.message || err}]. Falling back to local assistant:\n\n` + runLocalCommand(text);
      pushAssistant(reply);
      addMessage(thread, 'relay', reply);
    }
  };

  send.addEventListener('click', submit);
  input.addEventListener('keydown', e => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); submit(); }
  });
  input.addEventListener('input', () => {
    autoGrow(input);
    localStorage.setItem(draftKey, input.value);
  });
  input.addEventListener('focus', () => {
    input.classList.add('focused');
    autoGrow(input);
  });
  input.addEventListener('blur', () => {
    setTimeout(() => {
      input.classList.remove('focused');
      autoGrow(input);
    }, 150);
  });

  // Attachment picker (cloud users only)
  const attachBtn = panel.querySelector('#relay-attach');
  const fileInput = panel.querySelector('#relay-file-input');
  if (cloud && attachBtn && fileInput) {
    attachBtn.addEventListener('click', () => fileInput.click());
    fileInput.addEventListener('change', () => {
      const picked = Array.from(fileInput.files || []);
      let skipped = 0;
      picked.forEach(file => {
        if (isSupportedAttachment(file)) {
          pendingAttachments.push({ file, name: file.name, kind: fileKind(file) });
        } else {
          skipped++;
        }
      });
      fileInput.value = '';
      renderAttachmentChips();
      if (skipped) showToast(`${skipped} file(s) skipped — only images and PDFs are supported.`, 'info');
    });
  }

  const toggleWeekBtn = panel.querySelector('.relay-toggle-week');
  if (toggleWeekBtn) {
    toggleWeekBtn.addEventListener('click', () => {
      const overlay = panel.querySelector('#relay-weekly-overlay');
      if (overlay.classList.contains('open')) {
        overlay.classList.remove('open');
        toggleWeekBtn.classList.remove('active');
      } else {
        overlay.classList.add('open');
        toggleWeekBtn.classList.add('active');
        if (!overlay.innerHTML) renderWeeklyReportWidget(overlay);
      }
    });
  }
  document.addEventListener('keydown', escClose, true);

  if (onStateChange) onStateChange(true);
}

export function closeRelay() {
  if (!panel) return;
  document.removeEventListener('keydown', escClose, true);
  if (scanRefreshTimer) { clearTimeout(scanRefreshTimer); scanRefreshTimer = null; }
  if (watchdogRefreshTimer) { clearTimeout(watchdogRefreshTimer); watchdogRefreshTimer = null; }
  ['jobs', 'schedule', 'invoices', 'stock', 'quotes'].forEach(coll => store.off(coll, scheduleWatchdogRefresh));
  ['jobs', 'schedule', 'invoices', 'stock', 'maintenancePlans'].forEach(coll => store.off(coll, scheduleEmergencyScanRefresh));
  if (sidebarRailObserver) { sidebarRailObserver.disconnect(); sidebarRailObserver = null; }
  const p = panel;
  panel = null;
  p.classList.remove('open');
  document.body.classList.remove('relay-assistant-open');
  document.body.classList.remove('relay-expanded');
  setTimeout(() => p.remove(), 220);
  if (onStateChange) onStateChange(false);
}

function escClose(e) { if (e.key === 'Escape') closeRelay(); }

function autoGrow(el) {
  const prevHeight = el.style.height;
  el.style.height = 'auto';
  const contentHeight = el.scrollHeight;
  el.style.height = prevHeight;
  
  // Force a reflow so the browser registers the previous height for the transition
  void el.offsetHeight;

  const isFocused = el.classList.contains('focused');
  const minH = isFocused ? 108 : 38;
  el.style.height = Math.min(Math.max(contentHeight, minH), 120) + 'px';
}

// Make markdown links open in a new tab, with noopener/noreferrer for safety.
let relayMarkdownHookAdded = false;
function ensureRelayLinkHook() {
  if (relayMarkdownHookAdded) return;
  relayMarkdownHookAdded = true;
  DOMPurify.addHook('afterSanitizeAttributes', (node) => {
    if (node.tagName === 'A') {
      node.setAttribute('target', '_blank');
      node.setAttribute('rel', 'noopener noreferrer');
    }
  });
}

// Render a chat bubble's body as Markdown → sanitised HTML. `marked` converts
// the markdown to HTML (single newlines become <br>), and DOMPurify strips any
// scripts / event handlers the AI output might contain.
function renderMarkdown(text) {
  if (!text) return '';
  ensureRelayLinkHook();
  const html = marked.parse(text, { breaks: true, gfm: true });
  return DOMPurify.sanitize(html);
}

function addMessage(thread, role, text) {
  // 1. Strip any raw [ACTION: ...] tags from the visible text in the bubble using the robust parser
  let cleanedText = extractActions(text).cleanReply;

  // 2. Parse any [QUESTION: ...] or [QUESTION_MULTI: ...] tag
  let questionText = '';
  let options = [];
  let isMulti = false;

  let qMatch = cleanedText.match(/\[QUESTION_MULTI:\s*([^\]|]+)(?:\|([^\]]+))?\]/i);
  if (qMatch) {
    isMulti = true;
  } else {
    qMatch = cleanedText.match(/\[QUESTION:\s*([^\]|]+)(?:\|([^\]]+))?\]/i);
  }

  if (qMatch) {
    questionText = qMatch[1].trim();
    if (qMatch[2]) {
      options = qMatch[2].split('|').map(o => o.trim()).filter(Boolean);
    }
    // Remove the question tag from the visible bubble text
    cleanedText = cleanedText.replace(/\[QUESTION(?:_MULTI)?:\s*[^\]]+\]/gi, '').trim();
  }

  // 3. Assistants get Markdown rendering; user text stays escaped plain text
  //    so a `#` typed by the user doesn't become a heading.
  const bubbleHtml = role === 'relay' ? renderMarkdown(cleanedText) : escapeHtml(cleanedText);

  const m = document.createElement('div');
  m.className = `relay-msg relay-msg-${role}`;
  m.innerHTML = `<div class="relay-bubble">${bubbleHtml}</div>`;
  thread.appendChild(m);

  // 3. Render the interactive question card if present
  if (options.length > 0) {
    const card = document.createElement('div');
    card.className = 'relay-question-card';
    card.innerHTML = `
      <div class="relay-question-title">${escapeHtml(questionText)}</div>
      <div class="relay-question-options">
        ${options.map(opt => `
          <button class="relay-question-opt-btn" data-value="${escapeHtml(opt)}">${escapeHtml(opt)}</button>
        `).join('')}
      </div>
      ${isMulti ? `
        <div class="relay-question-actions">
          <button class="relay-question-submit-btn" disabled>Submit</button>
        </div>
      ` : ''}
    `;

    if (isMulti) {
      const submitBtn = card.querySelector('.relay-question-submit-btn');
      const optBtns = card.querySelectorAll('.relay-question-opt-btn');

      optBtns.forEach(btn => {
        btn.addEventListener('click', (e) => {
          btn.classList.toggle('selected');
          const hasSelected = Array.from(optBtns).some(b => b.classList.contains('selected'));
          submitBtn.disabled = !hasSelected;
        });
      });

      submitBtn.addEventListener('click', () => {
        const selectedVals = Array.from(optBtns)
          .filter(b => b.classList.contains('selected'))
          .map(b => b.getAttribute('data-value'));

        optBtns.forEach(b => b.disabled = true);
        submitBtn.disabled = true;

        const val = selectedVals.join(', ');
        const panel = thread.closest('.relay-panel');
        const input = panel ? panel.querySelector('#relay-input') : null;
        const sendBtn = panel ? panel.querySelector('#relay-send') : null;
        if (input && sendBtn) {
          input.value = val;
          sendBtn.click();
        }
      });
    } else {
      // Single-select mode: click auto-submits
      card.querySelectorAll('.relay-question-opt-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
          const val = btn.getAttribute('data-value');
          card.querySelectorAll('.relay-question-opt-btn').forEach(b => {
            b.disabled = true;
            b.classList.remove('selected');
          });
          btn.classList.add('selected');

          const panel = thread.closest('.relay-panel');
          const input = panel ? panel.querySelector('#relay-input') : null;
          const sendBtn = panel ? panel.querySelector('#relay-send') : null;
          if (input && sendBtn) {
            input.value = val;
            sendBtn.click();
          }
        });
      });
    }

    thread.appendChild(card);
  }

  thread.scrollTop = thread.scrollHeight;
  return m;
}

// Render a routine "title card" at the top of a routine result thread. This is
// the routine's own header — the routine name and when it ran — followed by the
// assistant's output beneath it, so the result reads as a standalone report.
function renderRoutineTitleCard(thread, msg) {
  const meta = document.createElement('div');
  meta.className = 'relay-msg relay-msg-routine';
  meta.innerHTML = `
    <div class="relay-routine-titlecard">
      <div class="relay-routine-titlecard-badge">
        <span class="material-icons-outlined">autorenew</span>
      </div>
      <div class="relay-routine-titlecard-body">
        <div class="relay-routine-titlecard-kicker">Routine result</div>
        <div class="relay-routine-titlecard-title">${escapeHtml(msg.title || 'Routine')}</div>
        ${msg.triggerLabel ? `<div class="relay-routine-titlecard-meta">${escapeHtml(msg.triggerLabel)}</div>` : ''}
      </div>
    </div>
  `;
  thread.appendChild(meta);
  thread.scrollTop = thread.scrollHeight;
  return meta;
}

function addTyping(thread) {
  const m = document.createElement('div');
  m.className = 'relay-msg relay-msg-relay';
  m.innerHTML = `<div class="relay-bubble relay-typing"><span></span><span></span><span></span></div>`;
  thread.appendChild(m);
  thread.scrollTop = thread.scrollHeight;
  return m;
}

function escapeHtml(s) {
  return String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}

// ── History helpers ────────────────────────────────────────────────────────────
function trimHistory() {
  const limit = hasDeputyMax() ? 20 : 12;
  if (chatHistory.length > limit) chatHistory = chatHistory.slice(-limit);
}

// Chat history used to build AI context. Excludes non-conversation meta messages
// (e.g. the `routine` title-card marker we store in result threads) so they never
// reach the model as an unknown role.
function aiHistory() {
  return chatHistory.filter(m => m && (m.role === 'user' || m.role === 'assistant' || m.role === 'system'));
}

function pushAssistant(reply) {
  chatHistory.push({ role: 'assistant', content: reply });
  trimHistory();
  saveChatHistory(chatHistory);
  // Keep the sidebar ordered by most-recent activity.
  if (hasDeputyMax()) renderThreadSidebar();
}

// ── Attachment chips (pending files, shown above the input) ─────────────────────
function attachmentLabel(files) {
  return `📎 ${files.map(f => f.name).join(', ')}`;
}

function clearAttachments() {
  pendingAttachments = [];
  renderAttachmentChips();
}

// ── Chat thread rendering ──────────────────────────────────────────────────────
// Re-render the active thread's messages + greeting card. Used on open and when
// switching threads (Deputy Max multichat).
async function renderChatThread(thread) {
  thread.innerHTML = '';
  const isRoutineResult = chatHistory.some(m => m && m.role === 'routine');
  chatHistory.forEach(msg => {
    if (msg.role === 'routine') { renderRoutineTitleCard(thread, msg); return; }
    const uiRole = msg.role === 'assistant' ? 'relay' : msg.role;
    addMessage(thread, uiRole, msg.content);
  });

  // Routine results are their own system: show the title card at the top and the
  // output underneath, without the welcome dashboard pinning the view elsewhere.
  if (isRoutineResult) {
    thread.classList.add('relay-thread-has-history');
    thread.scrollTop = 0;
    return;
  }

  const memory = clearStaleMemory(await loadUserMemory());
  const card = renderIntroDashboard(thread, memory);

  if (chatHistory.length > 0) {
    thread.classList.add('relay-thread-has-history');
    // Pin the greeting card's top to the thread's visible top. card.offsetTop is
    // relative to the positioned panel and includes the header height, so subtract
    // the thread's own offset to get the card's position WITHIN the scrollable
    // thread. offsetTop is layout-based, so the card's slide-in animation doesn't
    // skew it the way getBoundingClientRect would.
    setTimeout(() => {
      const cardPos = card.offsetTop - thread.offsetTop;
      thread.scrollTop = Math.max(0, cardPos - (thread.clientHeight - card.offsetHeight) / 2);
    }, 60);
  } else {
    thread.classList.remove('relay-thread-has-history');
    thread.scrollTop = 0;
  }
}

// Clear a single Deputy thread's messages. If it's the active thread, also
// reset the visible conversation. The thread itself (and its title) survives.
async function clearDeputyThread(threadId) {
  if (!threadId) return;
  await setThreadMessages(threadId, []);
  if (threadId === currentThreadId) {
    chatHistory = [];
    const threadEl = panel ? panel.querySelector('#relay-thread') : null;
    if (threadEl) {
      threadEl.innerHTML = '';
      renderIntroDashboard(threadEl, {});
    }
    localStorage.removeItem(`relay_draft_message_${getUserId()}`);
  }
  renderThreadSidebar();
  showToast('Chat cleared.', 'success');
}

// Render the left-hand thread sidebar (list, new chat, rename, clear, delete)
// for Max users. Visible in the expanded workspace; hidden in the minimised drawer.
function renderThreadSidebar() {
  if (!panel || !hasDeputyMax()) return;
  const sidebar = panel.querySelector('#relay-thread-sidebar');
  if (!sidebar) return;

  ensureThreadMenuDocHandler();

  const threads = getThreads();

  sidebar.innerHTML = `
    <div class="relay-thread-sidebar-head">
      <span class="relay-thread-sidebar-title">Conversations</span>
      <button class="relay-thread-new" id="relay-thread-new" title="Start a new chat" aria-label="Start a new chat">
        <span class="material-icons-outlined">add</span>
      </button>
    </div>
    <div class="relay-thread-list">
      ${threads.length === 0
        ? '<div class="relay-thread-empty">No chats yet</div>'
        : threads.map(t => `
          <div class="relay-thread-item ${t.id === currentThreadId ? 'active' : ''}" data-id="${t.id}">
            <button class="relay-thread-pick" data-id="${t.id}" title="Open chat">
              <span class="material-icons-outlined">chat_bubble_outline</span>
              <span class="relay-thread-name">${escapeHtml(t.title)}</span>
            </button>
            <button class="relay-thread-more" data-id="${t.id}" title="More options" aria-label="More options"><span class="material-icons-outlined">more_vert</span></button>
            <div class="relay-thread-menu" data-id="${t.id}">
              <button class="relay-thread-menu-item" data-action="rename" data-id="${t.id}"><span class="material-icons-outlined">edit</span>Rename</button>
              <button class="relay-thread-menu-item" data-action="clear" data-id="${t.id}"><span class="material-icons-outlined">delete_sweep</span>Clear</button>
              <button class="relay-thread-menu-item" data-action="delete" data-id="${t.id}"><span class="material-icons-outlined">delete</span>Delete</button>
            </div>
          </div>
        `).join('')}
    </div>
  `;

  sidebar.querySelector('#relay-thread-new')?.addEventListener('click', async () => {
    const t = await createThread();
    currentThreadId = t.id;
    localStorage.setItem(lastThreadKey(), t.id);
    chatHistory = [];
    const threadEl = panel.querySelector('#relay-thread');
    if (threadEl) await renderChatThread(threadEl);
    renderThreadSidebar();
    evaluateRoutines({ reason: 'new_chat' });
  });

  sidebar.querySelectorAll('.relay-thread-pick').forEach(btn => {
    btn.addEventListener('click', async () => {
      currentThreadId = btn.dataset.id;
      localStorage.setItem(lastThreadKey(), currentThreadId);
      chatHistory = loadChatHistory();
      const threadEl = panel.querySelector('#relay-thread');
      if (threadEl) await renderChatThread(threadEl);
      renderThreadSidebar();
    });
  });

  // The 3-dot menu: tap <more_vert> to reveal Rename / Clear / Delete.
  sidebar.querySelectorAll('.relay-thread-more').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const id = btn.dataset.id;
      const menu = sidebar.querySelector(`.relay-thread-menu[data-id="${id}"]`);
      sidebar.querySelectorAll('.relay-thread-menu.open').forEach(m => {
        if (m !== menu) m.classList.remove('open');
      });
      if (menu) menu.classList.toggle('open');
    });
  });

  sidebar.querySelectorAll('.relay-thread-menu-item').forEach(item => {
    item.addEventListener('click', (e) => {
      e.stopPropagation();
      const id = item.dataset.id;
      const action = item.dataset.action;
      const menu = item.closest('.relay-thread-menu');
      if (menu) menu.classList.remove('open');

      if (action === 'rename') renameThreadDialog(id);
      else if (action === 'clear') clearThreadConfirm(id);
      else if (action === 'delete') deleteThreadConfirm(id);
    });
  });
}

// Close any open thread menu when the user clicks elsewhere.
let threadMenuDocHandlerAdded = false;
function ensureThreadMenuDocHandler() {
  if (threadMenuDocHandlerAdded) return;
  threadMenuDocHandlerAdded = true;
  document.addEventListener('click', (e) => {
    if (e.target.closest('.relay-thread-menu') || e.target.closest('.relay-thread-more')) return;
    document.querySelectorAll('.relay-thread-menu.open').forEach(m => m.classList.remove('open'));
  });
}

function clearThreadConfirm(id) {
  const cur = getThread(id);
  const title = cur ? cur.title : 'this chat';
  showModal({
    title: 'Clear chat',
    content: `Clear "${title}"? Its messages will be removed but the chat stays in your list.`,
    actions: [
      { label: 'Cancel', className: 'btn-secondary', onClick: c => c() },
      { label: 'Clear', className: 'btn-danger', onClick: async c => { c(); await clearDeputyThread(id); } }
    ]
  });
}

function renameThreadDialog(id) {
  const cur = getThread(id);
  const currentTitle = cur ? cur.title : '';

  // Use the app-standard modal (not window.prompt) so rename works reliably
  // and matches the rest of the site's dialogs.
  const input = document.createElement('input');
  input.type = 'text';
  input.className = 'form-input';
  input.value = currentTitle;
  input.maxLength = 80;
  input.placeholder = 'Chat name';
  setTimeout(() => { input.focus(); input.select(); }, 0);

  const modal = showModal({
    title: 'Rename chat',
    content: input,
    actions: [
      { label: 'Cancel', className: 'btn-secondary', onClick: c => c() },
      {
        label: 'Save',
        className: 'btn-primary',
        onClick: async c => {
          const title = input.value.trim() || 'New chat';
          await renameThread(id, title);
          c();
          renderThreadSidebar();
        }
      }
    ]
  });

  input.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      modal.modal.querySelector('.modal-action-1')?.click();
    }
  });
}

function deleteThreadConfirm(id) {
  const cur = getThread(id);
  const title = cur ? cur.title : 'this chat';
  showModal({
    title: 'Delete chat',
    content: `Delete "${title}"? This permanently removes the chat and its messages. This cannot be undone.`,
    actions: [
      { label: 'Cancel', className: 'btn-secondary', onClick: c => c() },
      {
        label: 'Delete',
        className: 'btn-danger',
        onClick: async c => {
          c();
          const wasCurrent = id === currentThreadId;
          await deleteThread(id);
          if (wasCurrent) {
            // Never leave Max users with zero threads — recreate a default one.
            if (!getThreads().length) await ensureDefaultThread();
            const remaining = getThreads();
            currentThreadId = remaining.length ? remaining[0].id : null;
            if (currentThreadId) localStorage.setItem(lastThreadKey(), currentThreadId);
            else localStorage.removeItem(lastThreadKey());
            chatHistory = loadChatHistory();
            const threadEl = panel.querySelector('#relay-thread');
            if (threadEl) await renderChatThread(threadEl);
          }
          renderThreadSidebar();
        }
      }
    ]
  });
}

function renderAttachmentChips() {
  if (!panel) return;
  const row = panel.querySelector('#relay-attach-row');
  if (!row) return;
  if (!pendingAttachments.length) {
    row.innerHTML = '';
    row.classList.remove('has-items');
    return;
  }
  row.classList.add('has-items');
  row.innerHTML = pendingAttachments.map((f, i) => `
    <span class="relay-chip">
      <span class="material-icons-outlined">${f.kind === 'pdf' ? 'picture_as_pdf' : 'image'}</span>
      <span class="relay-chip-name">${escapeHtml(f.name)}</span>
      <button class="relay-chip-x" data-idx="${i}" title="Remove">&times;</button>
    </span>`).join('');
  row.querySelectorAll('.relay-chip-x').forEach(btn => {
    btn.addEventListener('click', () => {
      pendingAttachments.splice(Number(btn.dataset.idx), 1);
      renderAttachmentChips();
    });
  });
}

// Replace the animated typing dots with a live status line.
function setTypingStatus(typingEl, text) {
  const bubble = typingEl && typingEl.querySelector('.relay-bubble');
  if (bubble) {
    bubble.classList.remove('relay-typing');
    bubble.innerHTML = '';
    bubble.textContent = text;
  }
}

// ── Vision extraction (image / PDF → records) ───────────────────────────────────
async function runVisionExtraction(userText, files, thread, typing) {
  setTypingStatus(typing, 'Reading your attachment…');
  const { images, truncated } = await prepareAttachments(files.map(a => a.file), {
    onProgress: ({ page, pageCount }) => setTypingStatus(typing, `Rendering page ${page} of ${pageCount}…`)
  });

  if (!images.length) {
    typing.remove();
    const reply = "I couldn't get any readable pages out of that file.";
    pushAssistant(reply);
    addMessage(thread, 'relay', reply);
    return;
  }

  const ai = (store.getSettings() || {}).ai || {};
  const isDeepSeek = (ai.model || '').toLowerCase().includes('deepseek') || (ai.visionModel || '').toLowerCase().includes('deepseek');
  if (isDeepSeek) {
    const note = "⚠️ Note: The DeepSeek API does not currently support multimodal/image inputs natively. I'm passing this to the vision endpoint, but it may be ignored or fail until multimodal support is fully rolled out.";
    pushAssistant(note);
    addMessage(thread, 'relay', note);
  }

  // Send page-images in batches so no single request carries the whole catalogue.
  const batches = chunk(images, VISION_BATCH_SIZE);
  const allActions = [];
  const proseParts = [];
  for (let b = 0; b < batches.length; b++) {
    setTypingStatus(typing, batches.length > 1
      ? `Extracting… batch ${b + 1} of ${batches.length}`
      : 'Extracting details…');
    const reply = await callVisionEngine(userText, batches[b], b, batches.length);
    const { actions, cleanReply } = extractActions(reply);
    allActions.push(...actions);
    if (cleanReply) proseParts.push(cleanReply);
  }

  typing.remove();

  let summary = proseParts.join('\n\n').trim();
  if (truncated) {
    summary += `${summary ? '\n\n' : ''}⚠️ That document was longer than ${MAX_PDF_PAGES} pages — I only read the first ${MAX_PDF_PAGES}. Send the rest as a second file to continue.`;
  }
  if (!summary) {
    summary = allActions.length
      ? `I found ${allActions.length} item${allActions.length === 1 ? '' : 's'} in that attachment.`
      : "I read the attachment but couldn't find anything to add.";
  }
  pushAssistant(summary);
  addMessage(thread, 'relay', summary);

  // Confirm before creating — a misread scan shouldn't silently flood the CRM.
  if (allActions.length) {
    renderActionConfirmation(thread, allActions);
  }
}

async function callVisionEngine(userText, images, batchIndex, batchCount) {
  const ai = (store.getSettings() || {}).ai || {};
  const model = ai.visionModel || 'gemini-2.0-flash';
  const basePrompt = ai.systemPrompt || 'You are Relay, an intelligent CRM co-pilot assistant.';
  const systemPrompt = `${basePrompt}\n\n${getVisionContext()}`;

  const instruction = batchCount > 1
    ? `${userText || 'Extract every record from this document.'}\n\n(Batch ${batchIndex + 1} of ${batchCount} — extract only what appears in the images below.)`
    : (userText || 'Extract every record from this attachment.');

  const content = [
    { type: 'text', text: instruction },
    ...images.map(url => ({ type: 'image_url', image_url: { url } }))
  ];

  return dispatchChat([
    { role: 'system', content: systemPrompt },
    { role: 'user', content }
  ], ai, model, ai.visionEndpoint);
}

function getVisionContext() {
  return `The user has attached one or more images (photos, scans, or rendered PDF pages). Read them carefully and extract structured records to add to the CRM.

Likely cases:
- A SUPPLIER CATALOGUE / price list → extract EVERY product line item. One action per item:
  [ACTION: CREATE_RECORD, stock | name: <product name> | sku: <code if shown> | costPrice: <trade/buy price> | unitPrice: <list/RRP if shown> | unit: Each | category: <category if shown>]
- A BUSINESS CARD / contact → emit:
  [ACTION: CREATE_RECORD, contractors | name: <business name> | contactName: <person> | email: <email> | phone: <phone> | trade: <trade or role>]
  If it is clearly a MATERIALS SUPPLIER rather than a labour contractor, use: [ACTION: CREATE_RECORD, suppliers | name: <company> | contactName: <person> | email: <email> | phone: <phone> | address: <address>]

Rules:
- Emit one [ACTION: CREATE_RECORD, ...] tag per record. Include only fields you can actually read; omit the rest.
- Numbers must be plain, no currency symbols (85 not $85.00).
- First write ONE short sentence summarising what you found (e.g. "I found 42 products across 3 pages."), THEN the action tags. The app asks the user to confirm before saving, so always include the tags — do not ask the user for confirmation yourself.
- If the images are unreadable or contain no records, say so plainly and emit no tags.`;
}

// Confirmation card shown before bulk-creating extracted records.
function renderActionConfirmation(thread, actions) {
  const n = actions.length;
  const m = document.createElement('div');
  m.className = 'relay-msg relay-msg-relay';
  m.innerHTML = `<div class="relay-bubble relay-confirm">
    <div class="relay-confirm-title">Add ${n} record${n === 1 ? '' : 's'} to your CRM?</div>
    <div class="relay-confirm-list">${summariseActions(actions)}</div>
    <div class="relay-confirm-actions">
      <button class="relay-confirm-yes">${n === 1 ? 'Add it' : `Add all ${n}`}</button>
      <button class="relay-confirm-no">Cancel</button>
    </div>
  </div>`;
  thread.appendChild(m);
  thread.scrollTop = thread.scrollHeight;

  const actionsBar = m.querySelector('.relay-confirm-actions');
  m.querySelector('.relay-confirm-yes').addEventListener('click', () => {
    let ok = 0;
    suppressActionToasts = true;
    try {
      actions.forEach(({ action, param }) => {
        try { executeAction(action, param); ok++; } catch (e) { console.error(e); }
      });
    } finally {
      suppressActionToasts = false;
    }
    actionsBar.innerHTML = `<span class="relay-confirm-done">✓ Added ${ok} record${ok === 1 ? '' : 's'}.</span>`;
    const doneMsg = `Added ${ok} record${ok === 1 ? '' : 's'} to your CRM.`;
    pushAssistant(doneMsg);
    showToast(doneMsg, 'success');
  });
  m.querySelector('.relay-confirm-no').addEventListener('click', () => {
    actionsBar.innerHTML = `<span class="relay-confirm-done">Cancelled — nothing was added.</span>`;
    pushAssistant('Cancelled — nothing was added.');
  });
}

function summariseActions(actions) {
  const groups = {};
  actions.forEach(({ action, param }) => {
    const parts = (param || '').split('|').map(p => p.trim());
    const coll = action === 'CREATE_RECORD' ? (parts[0] || 'record') : action.replace('CREATE_', '').toLowerCase();
    const name = fieldFromParts(parts, 'name') || firstPipeValue(parts) || '(unnamed)';
    (groups[coll] = groups[coll] || []).push(name);
  });
  return Object.entries(groups).map(([coll, names]) => {
    const preview = names.slice(0, 6).map(escapeHtml).join(', ');
    const more = names.length > 6 ? ` +${names.length - 6} more` : '';
    const label = coll.charAt(0).toUpperCase() + coll.slice(1);
    return `<div><strong>${escapeHtml(label)} (${names.length}):</strong> ${preview}${more}</div>`;
  }).join('');
}

function fieldFromParts(parts, key) {
  for (let i = 1; i < parts.length; i++) {
    const idx = parts[i].indexOf(':');
    if (idx !== -1 && parts[i].slice(0, idx).trim().toLowerCase() === key) {
      return parts[i].slice(idx + 1).trim();
    }
  }
  return '';
}

function firstPipeValue(parts) {
  return parts.length > 1 ? parts[1] : '';
}

// ── Local (no-LLM) command handler — performs real dashboard/data actions ──────────
const PAGE_WIDGETS = {
  jobs: 'page-jobs', quotes: 'page-quotes', leads: 'page-leads', invoices: 'page-invoices',
  notifications: 'page-notifications', customers: 'page-customers', contractors: 'page-contractors',
  suppliers: 'page-suppliers', assets: 'page-assets', stock: 'page-stock', timesheets: 'page-timesheets',
  timesheet: 'page-timesheets', schedule: 'page-schedule', 'purchase orders': 'page-purchase-orders',
  'purchase order': 'page-purchase-orders', po: 'page-purchase-orders', pos: 'page-purchase-orders',
};

function onDashboard() { return !!document.querySelector('#dash-viewport'); }
const NOT_ON_DASH = "That one works on the dashboard canvas — head to the Dashboard and ask me again.";

function runLocalCommand(raw) {
  const ff = window.__fieldForge || {};
  const t = raw.toLowerCase().trim();

  if (/\b(help|what can you|commands|capabilities)\b/.test(t)) {
    return "Right now I'm running in local mode. I can:\n• Add a page widget — “add a jobs widget”\n• Jump to a saved view — “go to the finance view”\n• Fit everything — “fit the canvas”\n• Lock / unlock — “lock the canvas”\n• Quick counts — “how many overdue invoices?”\n\nTo chat freely, connect your own API key in Settings or upgrade to a paid Cloud account.";
  }

  // Lock / unlock (dashboard canvas)
  if (/\bunlock\b/.test(t)) { if (!onDashboard()) return NOT_ON_DASH; ff.setLock?.(false); return "Canvas unlocked — drag away."; }
  if (/\block\b/.test(t)) { if (!onDashboard()) return NOT_ON_DASH; ff.setLock?.(true); return "Canvas locked 🔒 — no more accidental grabs."; }

  // Fit all
  if (/\b(fit|reset view|show everything|zoom to fit|fit all)\b/.test(t)) { if (!onDashboard()) return NOT_ON_DASH; ff.fitAll?.(); return "Fitted everything to the screen."; }

  // Add a widget
  if (/\badd\b/.test(t)) {
    const key = Object.keys(PAGE_WIDGETS).sort((a, b) => b.length - a.length).find(k => t.includes(k));
    if (key) {
      if (!onDashboard()) return NOT_ON_DASH;
      const title = ff.addWidgetById?.(PAGE_WIDGETS[key]);
      if (title === false) return `You don't have access to ${key}, so I can't add that one.`;
      if (title) return `Added the ${title} widget for you.`;
      return "I couldn't add that widget.";
    }
    return "Which page? Try “add a jobs widget” — I know jobs, quotes, leads, invoices, customers, assets, stock, schedule and more.";
  }

  // Jump to a saved view
  if (/\b(go to|jump to|take me to|show me|open)\b/.test(t)) {
    const m = t.match(/(?:go to|jump to|take me to|show me|open)\s+(?:the\s+)?(.+?)(?:\s+view)?\.?$/);
    if (m && m[1]) {
      if (!onDashboard()) return NOT_ON_DASH;
      const label = ff.flyToViewByName?.(m[1].trim());
      if (label) return `Jumped to “${label}”.`;
      return `I couldn't find a saved view called “${m[1].trim()}”.`;
    }
  }

  // Quick counts
  if (/how many|count|number of/.test(t)) {
    if (/overdue/.test(t)) return countMsg('overdue invoices', store.getAll('invoices').filter(i => i.status === 'Overdue').length);
    if (/active|in progress/.test(t) && /job/.test(t)) return countMsg('active jobs', store.getAll('jobs').filter(j => j.status === 'In Progress' || j.status === 'Scheduled').length);
    if (/pending/.test(t) && /quote/.test(t)) return countMsg('pending quotes', store.getAll('quotes').filter(q => q.status === 'Sent' || q.status === 'Draft').length);
    if (/job/.test(t)) return countMsg('jobs', store.getAll('jobs').length);
    if (/quote/.test(t)) return countMsg('quotes', store.getAll('quotes').length);
    if (/invoice/.test(t)) return countMsg('invoices', store.getAll('invoices').length);
    if (/lead/.test(t)) return countMsg('leads', store.getAll('leads').length);
    if (/customer/.test(t)) return countMsg('customers', store.getAll('customers').length);
    if (/asset/.test(t)) return countMsg('assets', store.getAll('assets').length);
  }

  if (/\b(hi|hello|hey|yo)\b/.test(t)) return "Hey! Ask me to add a widget, jump to a view, or fit/lock the canvas.";
  if (/\b(thanks|thank you|cheers|ta)\b/.test(t)) return "Anytime. 👍";

  return "To chat freely with Deputy, please connect your own API key in **Settings → AI**, or upgrade your workspace to a **paid Cloud account**.";
}

function countMsg(label, n) {
  return `You have ${n} ${label}.`;
}

async function renderWeeklyReportWidget(container) {
  container.innerHTML = `<div style="padding: 20px; text-align: center; color: var(--text-tertiary);">Building your week ahead...</div>`;
  
  // 1. Get next 7 days
  const today = new Date();
  const days = [];
  for (let i = 0; i < 7; i++) {
    const d = new Date(today);
    d.setDate(today.getDate() + i);
    days.push(d);
  }
  
  // 2. Fetch jobs
  const jobs = store.getAll('jobs') || [];
  const activeJobs = jobs.filter(j => j.status === 'Scheduled' || j.status === 'In Progress');
  
  // 3. Fetch weather if FLAG is on
  let weatherData = null;
  if (FLAGS.weather) {
    try {
      const { getOfficeForecast } = await import('../utils/weather.js');
      weatherData = await getOfficeForecast();
    } catch (e) {
      console.warn('Failed to load weather for weekly widget', e);
    }
  }
  
  // 4. Build HTML
  let html = `<div class="relay-weekly-report">
    <div class="relay-weekly-header">
      <h4>📅 What's Happening This Week</h4>
    </div>`;
    
  if (weatherData && weatherData.daily && weatherData.daily.length > 0) {
    html += `<div class="relay-weather-ribbon">`;
    weatherData.daily.forEach(day => {
      // Find matching date in the 7 days if possible, or just iterate
      html += `<div class="relay-weather-day">
        <div class="rw-date">${new Date(day.date).toLocaleDateString('en-US', {weekday:'short'})}</div>
        <div class="rw-icon" title="${day.text}">${day.severe ? '⚠️' : (day.text.toLowerCase().includes('rain') ? '🌧️' : '☀️')}</div>
        <div class="rw-temp">${day.maxC}°<span class="rw-low">/${day.minC}°</span></div>
      </div>`;
    });
    html += `</div>`;
  }
  
  html += `<div class="relay-weekly-timeline">`;
  
  days.forEach((d, i) => {
    const dateStr = d.toISOString().split('T')[0];
    const dayJobs = activeJobs.filter(j => j.scheduledDate === dateStr);
    
    // Group jobs by tech
    const techJobs = {};
    dayJobs.forEach(j => {
      const tech = j.technicianName || 'Unassigned';
      if (!techJobs[tech]) techJobs[tech] = [];
      techJobs[tech].push(j);
    });
    
    const isToday = i === 0;
    const label = isToday ? 'Today' : d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
    
    html += `<div class="relay-timeline-day">
      <div class="rtd-header">
        <span class="rtd-date">${label}</span>
        <span class="rtd-count">${dayJobs.length} job${dayJobs.length !== 1 ? 's' : ''}</span>
      </div>
      <div class="rtd-body">`;
      
    if (dayJobs.length === 0) {
      html += `<div class="rtd-empty">No jobs scheduled.</div>`;
    } else {
      Object.entries(techJobs).forEach(([tech, jobs]) => {
        const locations = jobs.map(j => {
           let loc = j.location || 'Unknown location';
           if (typeof loc === 'object') loc = loc.label || loc.address || 'Unknown location';
           return loc.split(',')[0]; // Just the street or city
        }).join(' → ');
        
        html += `<div class="rtd-tech-row">
          <div class="rtd-tech-name">${tech}</div>
          <div class="rtd-tech-route" title="${locations}">📍 ${jobs.length} stop${jobs.length !== 1 ? 's' : ''} <span class="route-locs">(${locations})</span></div>
        </div>`;
      });
    }
    
    html += `</div></div>`;
  });
  
  html += `</div></div>`; // close timeline and report
  container.innerHTML = html;
}

// ── AI Engine completions call ───────────────────────────────────

async function callAIEngine() {
  const s = store.getSettings();
  const ai = s.ai || {};
  const model = ai.model || 'deepseek-chat';
  const systemPrompt = buildSystemPrompt(ai);

  const messages = [
    { role: 'system', content: systemPrompt },
    ...aiHistory()
  ];

  const reply = await dispatchChat(messages, ai, model);
  return finaliseExternalReply(reply, systemPrompt, ai, model);
}

function buildSystemPrompt(ai) {
  const basePrompt = ai.systemPrompt || 'You are Relay, an intelligent CRM co-pilot assistant. You help dispatchers manage jobs, quotes, invoices, and scheduling.';
  return `${basePrompt}\n\n${getSystemContext(!hasDeputyMax())}`;
}

// Some actions can't be answered in one turn: they need real external data
// (drive times from the routing service, live forecasts). Fetch it, then feed
// the result back so Deputy phrases the final answer with real numbers instead
// of an empty tag.
async function finaliseExternalReply(reply, systemPrompt, ai, model, { parseActions = true } = {}) {
  let externalData = '';
  if (FLAGS.maps && hasMapsAction(reply)) {
    const routeData = await runMapsActions(reply);
    if (routeData) externalData += (externalData ? '\n\n' : '') + routeData;
  }
  if (FLAGS.weather && hasWeatherAction(reply)) {
    const wxData = await runWeatherActions(reply);
    if (wxData) externalData += (externalData ? '\n\n' : '') + wxData;
  }

  const lookupMatches = [...reply.matchAll(/\[ACTION:\s*LOOKUP_RECORD\s*\|\s*([^\|\]]+)\s*\|\s*([^\]]+)\]/gi)];
  for (const match of lookupMatches) {
    const collection = match[1].trim();
    if (collection.toLowerCase() === 'settings') {
      externalData += `[RECORD LOOKUP - SETTINGS]: Access Denied.\n\n`;
      continue;
    }
    const idOrNum = match[2].trim();
    const list = store.getAll(collection) || [];
    const record = list.find(r => r.id === idOrNum || String(r.number) === String(idOrNum));
    let lookupResult = '';
    if (record) {
      if (collection === 'jobs') {
        const sch = (store.getAll('schedule') || []).find(s => s.jobId === record.id);
        if (sch) record._scheduleInfo = { date: sch.date, startHour: sch.startHour, endHour: sch.endHour };
      }
      lookupResult = `[RECORD LOOKUP - ${collection.toUpperCase()} - ${idOrNum}]\n${JSON.stringify(record, null, 2)}`;
    } else {
      lookupResult = `[RECORD LOOKUP - ${collection.toUpperCase()} - ${idOrNum}]: Not found.`;
    }
    externalData += (externalData ? '\n\n' : '') + lookupResult;
  }

  if (externalData.trim()) {
    const followup = [
      { role: 'system', content: systemPrompt },
      ...aiHistory(),
      { role: 'assistant', content: reply },
      { role: 'user', content: `[LIVE SERVICE RESULTS / LOOKUP DATA]\n${externalData}\n\nUsing only this additional data, answer my previous question concisely and naturally. Do NOT emit any action tags in this response.` }
    ];
    const finalReply = await dispatchChat(followup, ai, model);
    pushAssistant(finalReply);
    return parseActions ? parseAndExecuteActions(finalReply) : finalReply;
  }

  pushAssistant(reply);
  return parseActions ? parseAndExecuteActions(reply) : reply;
}

// Routines run outside the user's chat thread, so they need their own two-stage
// lookup flow: fetch any LOOKUP_RECORD / live-data results and feed them back in a
// clean follow-up, without contaminating the routine with unrelated chat history.
async function finaliseRoutineReply(reply, systemPrompt, ai, model) {
  let externalData = '';
  if (FLAGS.maps && hasMapsAction(reply)) {
    const routeData = await runMapsActions(reply);
    if (routeData) externalData += (externalData ? '\n\n' : '') + routeData;
  }
  if (FLAGS.weather && hasWeatherAction(reply)) {
    const wxData = await runWeatherActions(reply);
    if (wxData) externalData += (externalData ? '\n\n' : '') + wxData;
  }

  const lookupMatches = [...reply.matchAll(/\[ACTION:\s*LOOKUP_RECORD\s*\|\s*([^\|\]]+)\s*\|\s*([^\]]+)\]/gi)];
  for (const match of lookupMatches) {
    const collection = match[1].trim();
    if (collection.toLowerCase() === 'settings') {
      externalData += `[RECORD LOOKUP - SETTINGS]: Access Denied.\n\n`;
      continue;
    }
    const idOrNum = match[2].trim();
    const list = store.getAll(collection) || [];
    const record = list.find(r => r.id === idOrNum || String(r.number) === String(idOrNum));
    let lookupResult = '';
    if (record) {
      if (collection === 'jobs') {
        const sch = (store.getAll('schedule') || []).find(s => s.jobId === record.id);
        if (sch) record._scheduleInfo = { date: sch.date, startHour: sch.startHour, endHour: sch.endHour };
      }
      lookupResult = `[RECORD LOOKUP - ${collection.toUpperCase()} - ${idOrNum}]\n${JSON.stringify(record, null, 2)}`;
    } else {
      lookupResult = `[RECORD LOOKUP - ${collection.toUpperCase()} - ${idOrNum}]: Not found.`;
    }
    externalData += (externalData ? '\n\n' : '') + lookupResult;
  }

  if (externalData.trim()) {
    const followup = [
      { role: 'system', content: systemPrompt },
      { role: 'assistant', content: reply },
      { role: 'user', content: `[LIVE SERVICE RESULTS / LOOKUP DATA]\n${externalData}\n\nUsing only this additional data, produce your final routine output now. Do NOT emit any action tags, and do NOT narrate your process or thinking.` }
    ];
    const finalReply = await dispatchChat(followup, ai, model);
    return parseAndExecuteActions(finalReply);
  }

  return parseAndExecuteActions(reply);
}

// ── 2-stage triage route handlers (Deputy Max) ────────────────────────────────
// QUESTION: synthesis prompt, no action parsing.
async function answerSynthesisPrompt(systemPrompt, ai, model) {
  const reply = await dispatchChat([{ role: 'system', content: systemPrompt }, ...aiHistory()], ai, model);
  pushAssistant(reply);
  return reply;
}

// ACTION: focused prompt, execute action tags immediately (with permission checks).
async function runActionPrompt(systemPrompt, ai, model) {
  const reply = await dispatchChat([{ role: 'system', content: systemPrompt }, ...aiHistory()], ai, model);
  return finaliseExternalReply(reply, systemPrompt, ai, model);
}

// EXTERNAL: gather live data first, then answer (no action tags executed).
async function resolveExternalPrompt(systemPrompt, ai, model) {
  const reply = await dispatchChat([{ role: 'system', content: systemPrompt }, ...aiHistory()], ai, model);
  return finaliseExternalReply(reply, systemPrompt, ai, model, { parseActions: false });
}

// URGENT: run the emergency scan, surface critical findings as proposals,
// open the Watchdog (Operations Monitor) view, and summarise.
async function handleUrgentIntent() {
  emergencyFindings = runEmergencyScan();
  surfaceEmergencyAsks(emergencyFindings);
  if (panel) {
    if (!isExpanded) {
      isExpanded = true;
      localStorage.setItem('relay_expanded', 'true');
    }
    activeTab = 'watchdog';
    updateWorkspaceView(panel);
  }
  const reply = summariseScan(emergencyFindings) || 'I ran an emergency scan.';
  pushAssistant(reply);
  return reply;
}

// Classify the latest user turn, then route to the matching handler.
async function callAIEngineWithTriage() {
  const s = store.getSettings();
  const ai = s.ai || {};
  const model = ai.model || 'deepseek-chat';
  const systemPrompt = buildSystemPrompt(ai);
  const lastUser = [...chatHistory].reverse().find(m => m.role === 'user');
  const text = lastUser ? lastUser.content : '';
  const triage = await triageMessage(text, { ai, model, chatHistory });
  const ctx = {
    text,
    answerQuestion: () => answerSynthesisPrompt(systemPrompt, ai, model),
    runAction: () => runActionPrompt(systemPrompt, ai, model),
    resolveExternal: () => resolveExternalPrompt(systemPrompt, ai, model),
    handleUrgent: () => handleUrgentIntent()
  };
  return routeIntent(triage.intent, ctx);
}

// ── Conversational routine builder (Deputy Max) ────────────────────────────────
// Instead of guessing a routine spec in one shot, Deputy runs a short guided
// interview: it clarifies what the routine should do, when it should run, and what
// to call it — then saves a concrete, well-formed routine.

const ROUTINE_DRAFT_KEY = id => `relay_routine_draft_${id}`;

function loadRoutineDraft() {
  if (!currentThreadId) return null;
  try { return JSON.parse(localStorage.getItem(ROUTINE_DRAFT_KEY(currentThreadId)) || 'null'); }
  catch { return null; }
}
function saveRoutineDraft() {
  if (!currentThreadId) return;
  if (routineDraft) localStorage.setItem(ROUTINE_DRAFT_KEY(currentThreadId), JSON.stringify(routineDraft));
  else localStorage.removeItem(ROUTINE_DRAFT_KEY(currentThreadId));
}

function capitalise(s) {
  return s ? s.charAt(0).toUpperCase() + s.slice(1) : s;
}

// Heuristic for "the user wants Deputy to build a routine" (distinct from asking
// about routines). We keep it conservative so normal questions aren't hijacked.
function looksLikeRoutineRequest(text) {
  const t = (text || '').toLowerCase().trim();
  if (!t) return false;
  if (/(cancel|stop|never ?mind|abort)/.test(t)) return false;
  if (/^(what|whats|how|why|explain|tell me about)\b/.test(t)) return false;
  if (/(set\s*up|create|make|build|add|new|want|need)\s+(?:a\s+|an\s+)?routine/.test(t)) return true;
  if (/\broutine\b/.test(t) && /\b(to\s|that\s|which\s|for\s|should)\b/.test(t)) return true;
  if (/(\bevery\s+(?:morning|day|hour|night|week|month)|on\s+new\s+chat)/.test(t) && /\b(routine|auto|remind|check|summar|notify|run|give|show|tell|report|fetch|pull|alert)\b/.test(t)) return true;
  return false;
}

function suggestTitle(d) {
  const base = (d.intent || '').replace(/^(?:please\s+)?(?:create|make|set\s*up|build|add|new|i\s+want)\s+(?:a\s+|an\s+)?routine\s+(?:to\s+|that\s+|which\s+)?/i, '');
  const trimmed = base.replace(/[.?!]+$/, '').trim();
  if (trimmed) return capitalise(trimmed.slice(0, 40));
  if (d.trigger && d.trigger.type === 'morning') return 'Morning routine';
  if (d.trigger && d.trigger.type === 'new_chat') return 'On new chat';
  return 'Routine';
}

function parseTriggerAnswer(text) {
  const t = (text || '').toLowerCase();
  if (/new chat/.test(t)) return { type: 'new_chat' };
  if (/morning/.test(t)) return { type: 'morning' };
  const m = t.match(/(\d+)\s*(min|hour|day|week|month)/);
  if (m) {
    const unit = /min/.test(m[2]) ? 'minutes' : /hour/.test(m[2]) ? 'hours' : (/(week|month)/.test(m[2]) ? 'days' : 'days');
    const interval = /week/.test(m[2]) ? Number(m[1]) * 7 : /month/.test(m[2]) ? Number(m[1]) * 30 : Number(m[1]);
    return { type: 'interval', interval, unit };
  }
  if (/custom/.test(t)) return { custom: true };
  if (/hour/.test(t)) return { type: 'interval', interval: 1, unit: 'hours' };
  if (/week/.test(t)) return { type: 'interval', interval: 7, unit: 'days' };
  if (/day|daily/.test(t)) return { type: 'interval', interval: 1, unit: 'days' };
  return { type: 'interval', interval: 1, unit: 'days' };
}

function parseIntervalAnswer(text) {
  const t = (text || '').toLowerCase();
  const m = t.match(/(\d+)?\s*(min|minutes|hour|hours|day|days|week|weeks)/);
  if (!m) return { type: 'interval', interval: 1, unit: 'days' };
  const raw = m[1] ? Number(m[1]) : null;
  const w = m[2];
  if (/min/.test(w)) return { type: 'interval', interval: raw || 30, unit: 'minutes' };
  if (/hour/.test(w)) return { type: 'interval', interval: raw || 1, unit: 'hours' };
  if (/week/.test(w)) return { type: 'interval', interval: (raw || 1) * 7, unit: 'days' };
  return { type: 'interval', interval: raw || 1, unit: 'days' };
}

function summaryReply(d) {
  const triggerTxt = d.trigger ? describeTrigger(d.trigger) : '—';
  return `Here's what I've got so far:\n\n**Do:** ${d.intent || '—'}\n**When:** ${triggerTxt}`;
}

async function finaliseRoutineCreate(d) {
  const title = d.title || suggestTitle(d);
  const routine = await createRoutine({
    title,
    trigger: d.trigger || { type: 'interval', interval: 1, unit: 'days' },
    prompt: d.intent || title,
  });
  routineDraft = null;
  saveRoutineDraft();
  // Refresh the Routines tab if it's currently visible.
  if (panel && activeTab === 'routines') {
    const ws = panel.querySelector('#relay-workspace-view');
    if (ws) renderRoutinesView(ws);
  }
  return {
    handled: true,
    reply: `Done! I've saved a routine called **${routine.title}**.\n\n**${describeTrigger(routine.trigger)}** — ${routine.prompt}\n\nYou can review, tweak, or toggle it anytime in the **Routines** tab.`
  };
}

function advanceRoutineDraft(text) {
  const d = routineDraft;
  const answer = (text || '').trim();
  switch (d.stage) {
    case 'action':
      d.intent = answer || d.intent;
      d.stage = 'trigger';
      saveRoutineDraft();
      return { handled: true, reply: "When should I run it?\n\n[QUESTION: When should this routine run?|Every morning|Every day|Every hour|On new chat|Custom interval]" };
    case 'trigger': {
      const parsed = parseTriggerAnswer(answer);
      if (parsed.custom) {
        d.stage = 'interval';
        saveRoutineDraft();
        return { handled: true, reply: "How often?\n\n[QUESTION: How often?|Every 30 minutes|Every 2 hours|Every 6 hours|Once a day|Once a week]" };
      }
      d.trigger = parsed;
      d.stage = 'title';
      saveRoutineDraft();
      return { handled: true, reply: summaryReply(d) + `\n\nWhat should I call it? Reply with a name, or just say **ok** to use **${suggestTitle(d)}**.` };
    }
    case 'interval': {
      d.trigger = parseIntervalAnswer(answer);
      d.stage = 'title';
      saveRoutineDraft();
      return { handled: true, reply: summaryReply(d) + `\n\nWhat should I call it? Reply with a name, or just say **ok** to use **${suggestTitle(d)}**.` };
    }
    case 'title': {
      const a = answer.toLowerCase();
      d.title = (/^(ok|yes|yep|sure|default|fine)$/.test(a) || !answer) ? suggestTitle(d) : answer;
      return finaliseRoutineCreate(d);
    }
    default:
      return { handled: false };
  }
}

// Entry point for the chat send path. Returns { handled, reply? }. When handled,
// the caller should pushAssistant(reply) and render it. Returns { handled: false }
// so the normal AI pipeline runs for non-routine messages.
async function runRoutineBuilder(text) {
  if (!hasDeputyMax()) return { handled: false };

  // Keep the in-memory draft aligned with whichever thread is open.
  if (!routineDraft || routineDraft.threadId !== currentThreadId) {
    routineDraft = loadRoutineDraft();
  }

  if (routineDraft && routineDraft.threadId === currentThreadId) {
    if (/^(cancel|stop|never ?mind|abort)\b/i.test((text || '').trim())) {
      routineDraft = null;
      saveRoutineDraft();
      return { handled: true, reply: "No worries — I've cancelled that routine. Just tell me when you want to build another." };
    }
    return advanceRoutineDraft(text);
  }

  if (looksLikeRoutineRequest(text)) {
    routineDraft = { threadId: currentThreadId, intent: text.trim(), stage: 'action' };
    saveRoutineDraft();
    const seedText = text.trim();
    return {
      handled: true,
      reply: `I'll help you build that as an automated routine. 💡\n\n**What should I do each time it runs?**\n` +
        (seedText ? `You mentioned: "${seedText}"\n\n` : '') +
        `Pick an option below, or type your own action and what you'd like me to do with the result.\n\n` +
        `[QUESTION: What should each run do?|Scan and summarise problems in chat|Flag overdue jobs for me|Flag overdue invoices for me|Check unscheduled jobs for today|Flag critical stock|List technician conflicts for me]`
    };
  }

  return { handled: false };
}

export function getSystemContext(slim = false) {
  // Pull current DB state
  const jobs = store.getAll('jobs') || [];
  const invoices = store.getAll('invoices') || [];
  const quotes = store.getAll('quotes') || [];
  const customers = store.getAll('customers') || [];
  const stock = store.getAll('stock') || [];
  const technicians = (store.getAll('technicians') || []).filter(t => !t.deactivated);

  const activeJobs = jobs.filter(j => j.status === 'In Progress' || j.status === 'Scheduled');
  const completedJobs = jobs.filter(j => j.status === 'Completed' || j.status === 'Invoiced');
  const pendingJobs = jobs.filter(j => j.status === 'Pending');
  const unassignedJobs = jobs.filter(j => (j.status === 'Scheduled' || j.status === 'In Progress' || j.status === 'Pending') && (!j.technicianName || j.technicianName === 'Unassigned'));
  const overdueInvoices = invoices.filter(i => i.status === 'Overdue');
  const pendingQuotes = quotes.filter(q => q.status === 'Sent' || q.status === 'Draft');
  const lowStockItems = stock.filter(s => (s.quantity || 0) <= (s.reorderPoint || 5));

  const allTechs = store.getAll('technicians') || [];
  const deactivatedTechNames = new Set(allTechs.filter(t => t.deactivated).map(t => t.name.toLowerCase()));
  
  const jobsList = activeJobs.slice(0, slim ? 5 : 10).map(j => {
    const techName = j.technicianName || 'Unassigned';
    const isDeactivated = techName && deactivatedTechNames.has(techName.toLowerCase());
    const techDisplay = isDeactivated ? `${techName} (DEACTIVATED)` : techName;
    return `Job #${j.number || j.id}: ${j.title} (${j.status}) - Cust: ${j.customerName || 'None'} - Tech: ${techDisplay} - Date: ${j.scheduledDate || 'TBD'}`;
  }).join('\n');

  const unassignedJobsList = unassignedJobs.map(j => `Job #${j.number || j.id}: ${j.title} (${j.status}) - Cust: ${j.customerName || 'None'} - Date: ${j.scheduledDate || 'TBD'}`).join('\n');
  const overdueInvoicesList = overdueInvoices.slice(0, slim ? 4 : 8).map(i => `Invoice #${i.number || i.id}: ${i.title} - Total: $${i.total} - Due: ${i.dueDate || 'TBD'}`).join('\n');
  const lowStockList = lowStockItems.map(s => `${s.name} (Qty: ${s.quantity || 0}, Reorder Point: ${s.reorderPoint || 5})`).join(', ');

  const techWorkloadMap = technicians.map(t => {
    const assignedCount = activeJobs.filter(j => j.technicianName === t.name || j.technician_id === t.id).length;
    return `${t.name} (${t.role || 'Tech'}): ${assignedCount} active job(s)`;
  }).join(' | ');

  const currentUser = JSON.parse(localStorage.getItem('currentUser') || 'null');
  const userId = currentUser ? currentUser.id : 'default';
  const factsheetKey = `relay_factsheet_${userId}`;
  const enabledKey = `relay_factsheet_enabled_${userId}`;
  const isEnabled = localStorage.getItem(enabledKey) !== 'false';
  const rawFactsheet = isEnabled ? (localStorage.getItem(factsheetKey) || '') : 'User has disabled AI Personal Memory tracking.';
  
  let formattedMemory = '  No specific preferences recorded yet.';
  if (!slim && isEnabled && rawFactsheet) {
    const memNodes = getStructuredMemory(rawFactsheet);
    formattedMemory = [];
    if (memNodes.dispatchRules.length) formattedMemory.push('  [Dispatch Rules]:\n' + memNodes.dispatchRules.map(l => `    - ${l}`).join('\n'));
    if (memNodes.clientNotes.length) formattedMemory.push('  [Client Context]:\n' + memNodes.clientNotes.map(l => `    - ${l}`).join('\n'));
    if (memNodes.preferences.length) formattedMemory.push('  [User Preferences]:\n' + memNodes.preferences.map(l => `    - ${l}`).join('\n'));
    if (memNodes.general.length) formattedMemory.push('  [General Notes]:\n' + memNodes.general.map(l => `    - ${l}`).join('\n'));
    formattedMemory = formattedMemory.join('\n');
  }

  // Manually-added memory keys (Inspector → "+ Add Key") — surfaced as explicit facts Deputy must respect.
  const rawKeys = slim ? {} : loadUserMemorySync();
  const learnedKeyEntries = Object.entries(rawKeys || {})
    .filter(([k]) => k !== 'lastUpdated' && k !== 'interactionCount')
    .map(([k, v]) => `${k}: ${typeof v === 'object' ? JSON.stringify(v) : String(v)}`);
  const learnedKeys = learnedKeyEntries.length
    ? learnedKeyEntries.map(l => `    - ${l}`).join('\n')
    : '  No manually-added memory keys yet.';

  const modules = ['Jobs', 'Quotes', 'Invoices', 'Customers', 'Schedule', 'Stock', 'Purchase Orders', 'Assets'];
  const userPermissions = modules.map(m => {
    const actions = [];
    if (hasPermission(m, 'create')) actions.push('Create');
    if (hasPermission(m, 'edit')) actions.push('Edit');
    if (hasPermission(m, 'delete')) actions.push('Delete');
    return `${m}: ${actions.length > 0 ? actions.join(', ') : 'Read-only'}`;
  }).join(' | ');

  return `Assistant Role & Core Competencies:
- You are the central dispatch co-pilot and operations coordinator. You do NOT just answer questions passively; you proactively manage task allocation, schedule jobs to the best-suited technicians, resolve scheduling conflicts, and coordinate field operations.
- Always check the list of active technicians and their roles. When a job is mentioned, match it to the technician with the corresponding role/skills. Suggest the best candidates based on workload, and proactively allocate the job using the appropriate action tags.
- You must ONLY use, suggest, or assign jobs to technicians who are currently listed in the "Active Technicians" list below. Do NOT reference, suggest, or assign jobs to any other technicians (including those from older chat history, memory, or previous job assignments) as they are deactivated.
- Be highly analytical and helpful. When answering user questions about CRM metrics, synthesize a clear, structural summary from the live data context (e.g., outlining workload distribution, quote conversion states, or timesheet approvals).
- SECURITY & ACCESS MODEL: You have universal READ access to all CRM records in the system. You can view and lookup any record (except Settings) regardless of the user's view permissions. However, you can ONLY perform modifications (Create/Edit/Delete/Assign) if the user has the required explicit permission listed below. You have absolutely NO access to the Settings page or system configuration—if asked, you must refuse.
- DEEP RECORD LOOKUP: You only see a high-level summary of records by default. If you need to read the specific details, description, notes, tasks, materials, or scheduled times for ANY record (jobs, customers, quotes, invoices, stock, etc.), you MUST query it using this action tag: [ACTION: LOOKUP_RECORD | collection | id_or_number]. For example: [ACTION: LOOKUP_RECORD | jobs | JOB-001]. The system will immediately fetch the full details and provide them to you so you can answer the user's question accurately. Do NOT tell the user you lack access to job details—use the LOOKUP_RECORD tag instead!

Assistant Tone & Formatting Guidelines:
- You are a professional dispatch co-pilot. Keep your tone helpful, direct, concise, and business-focused.
- DO NOT use overly familiar pet names (e.g. "gorgeous", "darling") or sassy/flamboyant language.
- Use emojis sparingly and only to highlight key structural items (e.g. checkmarks, warnings). Avoid emotional, decorative, or dramatic emojis.
- Keep your answers clean, direct, and scans-friendly. Do not write verbose diagnostics for simple empty states.
- CRITICAL FORMATTING RULE: DO NOT OUTPUT ANY ASTERISKS (*) WHATSOEVER IN YOUR RESPONSE. NO BOLDING (**), NO ITALICS (*). They are an eye sore. Instead, use standard dashes (-) for lists, and HTML tables or paragraphs to create structure and emphasis.
- NO SELF-TALK OR PROCESS NARRATION: Never narrate your internal thinking or announce what you are about to do. Do NOT write phrases like "Wait", "Let me check", "Let me look that up", "I need to pull the details", "I will look into this", or any play-by-play of how you arrived at an answer. If you need record details, silently emit the LOOKUP_RECORD action tag (it is invisible to the user) and then present the finished answer only.
- ROUTINE OUTPUT RULE: When an automated routine runs, deliver the routine's finished output directly (the rundown, toolbox, report, or summary it was asked to produce). Do NOT include setup commentary, caveats about missing data, or a description of how you searched. Lead with the result, not the process.

Current Live CRM Data Context (updated real-time):
- Current Local Date & Time: ${new Date().toLocaleString()}
- CRITICAL DATE AWARENESS: The "Current Local Date & Time" above is the absolute ground truth. If it differs from any dates mentioned in past chat messages, ALWAYS use the date above.
- Active Technicians & Workloads: ${techWorkloadMap || 'None'}
- Total Registered Customers: ${customers.length}
- Jobs Summary: Total: ${jobs.length}, Active/Scheduled: ${activeJobs.length}, Completed/Invoiced: ${completedJobs.length}, Pending: ${pendingJobs.length}, Unassigned: ${unassignedJobs.length}
- Active/Scheduled Jobs (${activeJobs.length}):
${jobsList || 'None'}
- Unassigned Jobs Needing Technician Assignment (${unassignedJobs.length}):
${unassignedJobsList || 'None (All active jobs assigned)'}
- Overdue Invoices (${overdueInvoices.length}):
${overdueInvoicesList || 'None'}
- Pending Quotes: ${pendingQuotes.length}
- Low Stock Items Needing Reorder: ${lowStockList || 'None (All stock levels adequate)'}

Currently Logged-in User Profile:
- Name: ${currentUser ? currentUser.name : 'Unknown User'}
- Role: ${currentUser ? currentUser.role : 'Unknown Role'}
- Permissions: ${userPermissions}
- Deep User Memory Graph (Structured Preferences/Rules):
${formattedMemory}
- Manually Added Memory Keys (explicit user-supplied facts — treat these as authoritative and apply them whenever relevant):
${learnedKeys}

Action Execution Formats:
Action parameters can be passed as structured JSON objects OR pipe-separated strings. JSON payloads are preferred for precision.
- To assign a job to a technician: [ACTION: ASSIGN_TECH, {"jobId": "1002", "technicianName": "John Doe"}]
- To resolve scheduling conflict: [ACTION: RESOLVE_CONFLICT, {"jobId": "1002", "scheduledDate": "2026-07-25", "technicianName": "Jane Smith"}]
- To analyze schedule and suggest bulk optimizations: [ACTION: OPTIMIZE_SCHEDULE, {"date": "2026-07-25"}]
- To bulk update status: [ACTION: BULK_UPDATE_STATUS, {"collection": "jobs", "identifiers": ["1001", "1002"], "status": "In Progress"}]
- To reorder stock item: [ACTION: REORDER_STOCK, {"itemId": "stock_123", "supplierName": "Rexel", "quantity": 10}]
- To jump to a view: [ACTION: JUMP_VIEW, SavedViewName]
- To add a dashboard widget: [ACTION: ADD_WIDGET, WidgetID]
- To fit canvas: [ACTION: FIT_CANVAS]
- To lock/unlock canvas: [ACTION: LOCK_CANVAS, true] or [ACTION: LOCK_CANVAS, false]
- To navigate to a page or open a specific record: [ACTION: NAVIGATE, PageNameOrPath] (e.g. jobs, invoices, invoices/INV-00001, jobs/JOB-123, customers/CUST-100, etc.)
- To create customer: [ACTION: CREATE_CUSTOMER, {"type": "Commercial", "firstName": "Barry", "lastName": "Buttons", "companyName": "Buttons Plumbing", "email": "barry@buttons.example.com"}]
- To create job: [ACTION: CREATE_JOB, {"title": "Fix Tap", "status": "Scheduled", "customerName": "Barry Buttons", "technicianName": "John Doe", "scheduledDate": "2026-07-25"}]
- To create quote: [ACTION: CREATE_QUOTE, {"title": "Proposal", "status": "Draft", "customerName": "Barry Buttons", "total": 1100, "line_items": [{"name": "Tap", "quantity": 1, "unitPrice": 100}]}]
- To create invoice: [ACTION: CREATE_INVOICE, {"title": "Invoice", "status": "Sent", "jobNum": "1005", "customerName": "Barry Buttons", "total": 165, "line_items": [{"name": "Tap", "quantity": 1, "unitPrice": 150}]}]
- To update a record's fields: [ACTION: UPDATE_RECORD, {"collection": "jobs", "id": "1002", "updates": {"status": "In Progress", "technicianName": "Jane Smith"}}]
- To delete record: [ACTION: DELETE_RECORD, jobs | 1002]
- To save memory fact: [ACTION: UPDATE_FACTSHEET, Single concise fact]
- To ask single question: [QUESTION: Text? | Opt 1 | Opt 2]
- To ask multi question: [QUESTION_MULTI: Text? | Opt 1 | Opt 2]
${FLAGS.maps ? `
Routing & Drive Times (live Google Maps data):
- You have access to real driving distances, ETAs and route optimisation. When the user asks about the best order to visit jobs, a technician's route/run for a day, or the drive time between two places, emit ONE of these tags and STOP — the routing service will compute the real numbers and hand them back to you to phrase the final answer. Never invent drive times or distances yourself.
- Best visit order + ETAs for a technician's day: [ACTION: ROUTE_PLAN, {"technicianName": "John Doe", "date": "2026-07-25"}] (technicianName optional = whole team; date accepts "today"/"tomorrow" or YYYY-MM-DD — resolve relative dates using the Current Local Date above).
- Drive time between two points: [ACTION: DRIVE_TIME, {"from": "office", "to": "#1005"}] — each of from/to may be "office", a job number like "#1005", a customer name, or a literal address.
` : ''}${FLAGS.weather ? `
Weather (live forecast data):
- You can answer weather questions for the office or any job site. When the user asks about weather/rain/conditions/temperature at a place or on a day, emit this tag and STOP — the forecast service returns real data for you to phrase the answer. Never invent forecasts.
- [ACTION: WEATHER_LOOKUP, {"location": "#1005", "date": "tomorrow"}] — location may be "office", a job number, a customer name, or a literal address (omit for the office); date accepts "today"/"tomorrow" or YYYY-MM-DD within the next 7 days (resolve relative dates using the Current Local Date above).
` : ''}
Always perform requested actions using action tags. Do not state you are unable to modify data.`;
}

const ACTION_REGEX = /\[ACTION:\s*([A-Z_]+)(?:\s*,\s*([^\]]+))?\]/gi;

// Parse [ACTION: ...] tags out of a reply WITHOUT executing them.
// Returns { actions: [{ action, param }], cleanReply }. The attachment flow uses
// this to hold extracted records for user confirmation before creating them.
function extractActions(reply) {
  const actions = [];
  let cleanReply = reply;
  
  const prefix = '[ACTION:';
  let startIndex = 0;
  
  while ((startIndex = cleanReply.toUpperCase().indexOf(prefix, startIndex)) !== -1) {
    let bracketCount = 0;
    let endIndex = -1;
    
    for (let i = startIndex; i < cleanReply.length; i++) {
      if (cleanReply[i] === '[') bracketCount++;
      else if (cleanReply[i] === ']') bracketCount--;
      
      if (bracketCount === 0) {
        endIndex = i;
        break;
      }
    }
    
    if (endIndex !== -1) {
      const fullTag = cleanReply.substring(startIndex, endIndex + 1);
      const inner = fullTag.substring(prefix.length, fullTag.length - 1).trim();
      
      const firstComma = inner.indexOf(',');
      let actionName, paramStr;
      
      if (firstComma !== -1) {
        actionName = inner.substring(0, firstComma).trim().toUpperCase();
        paramStr = inner.substring(firstComma + 1).trim();
      } else {
        actionName = inner.toUpperCase();
        paramStr = null;
      }
      
      actions.push({ action: actionName, param: paramStr });
      cleanReply = cleanReply.substring(0, startIndex) + cleanReply.substring(endIndex + 1);
    } else {
      // Malformed tag, just skip past it
      startIndex += prefix.length;
    }
  }
  
  cleanReply = cleanReply.trim();
  return { actions, cleanReply };
}

function parseJsonParam(param) {
  if (!param) return null;
  const trimmed = param.trim();
  if (trimmed.startsWith('{') && trimmed.endsWith('}')) {
    try {
      return JSON.parse(trimmed);
    } catch (e) {
      console.warn('Failed to parse JSON action parameter:', param, e);
      return null;
    }
  }
  return null;
}

// Execute a single parsed action against the store / dashboard.
function executeAction(action, param) {
  const ff = window.__fieldForge || {};
  const json = parseJsonParam(param);

  try {
      if (action === 'ASSIGN_TECH' && param) {
        if (!checkCollectionPermission('jobs', 'edit')) return;
        let jobId = json?.jobId || json?.id;
        let techName = json?.technicianName || json?.techName || json?.technicianId;
        if (!json) {
          const parts = param.split('|').map(p => p.trim());
          jobId = parts[0];
          techName = parts[1];
        }

        const list = store.getAll('jobs') || [];
        const job = list.find(j => j.id === jobId || String(j.number) === String(jobId));
        if (!job) {
          showToast(`Could not find Job "${jobId}".`, 'error');
          return;
        }

        const allTechs = store.getAll('technicians') || [];
        if (techName) {
          const isDeactivated = allTechs.some(t => t.name.toLowerCase() === techName.toLowerCase() && t.deactivated);
          if (isDeactivated) {
            showToast(`Cannot assign job: ${techName} is a deactivated technician.`, 'error');
            return;
          }
        }

        const technicians = allTechs.filter(t => !t.deactivated);
        const tech = technicians.find(t => t.name.toLowerCase() === (techName || '').toLowerCase() || t.id === techName);
        job.technicianName = tech ? tech.name : (techName || 'Unassigned');
        job.technician_id = tech ? tech.id : null;
        job.updatedAt = new Date().toISOString();
        store.save('jobs', list);
        showToast(`Assigned Job #${job.number || job.id} to ${job.technicianName}.`, 'success');

      } else if (action === 'RESOLVE_CONFLICT' && param) {
        if (!checkCollectionPermission('jobs', 'edit')) return;
        let jobId = json?.jobId || json?.id;
        let newDate = json?.scheduledDate || json?.newDate;
        let newTech = json?.technicianName || json?.newTech;
        if (!json) {
          const parts = param.split('|').map(p => p.trim());
          jobId = parts[0];
          newDate = parts[1];
          newTech = parts[2];
        }

        const list = store.getAll('jobs') || [];
        const job = list.find(j => j.id === jobId || String(j.number) === String(jobId));
        if (!job) {
          showToast(`Could not find Job "${jobId}".`, 'error');
          return;
        }

        if (newDate) job.scheduledDate = newDate;
        if (newTech) {
          const allTechs = store.getAll('technicians') || [];
          const tech = allTechs.filter(t => !t.deactivated).find(t => t.name.toLowerCase() === newTech.toLowerCase());
          job.technicianName = tech ? tech.name : newTech;
          job.technician_id = tech ? tech.id : null;
        }
        job.updatedAt = new Date().toISOString();
        store.save('jobs', list);
        showToast(`Resolved schedule conflict for Job #${job.number || job.id}.`, 'success');

      } else if (action === 'OPTIMIZE_SCHEDULE' && param) {
        // Just acknowledging the command visually, the AI handles the actual text reasoning and emits RESOLVE_CONFLICTs
        let date = json?.date;
        if (!json) date = param.trim();
        showToast(`Optimizing schedule conflicts for ${date || 'all dates'}...`, 'info');

      } else if (action === 'BULK_UPDATE_STATUS' && param) {
        let collection = json?.collection;
        let identifiers = (json?.identifiers || json?.ids || []).map(String);
        let status = json?.status;
        if (!json) {
          const parts = param.split('|').map(p => p.trim());
          collection = parts[0];
          status = parts[1];
          identifiers = parts[2] ? parts[2].split(',').map(s => String(s.trim())) : [];
        }

        if (!collection || !status || !checkCollectionPermission(collection, 'edit')) return;
        const list = store.getAll(collection) || [];
        let count = 0;
        list.forEach(item => {
          if (identifiers.includes(item.id) || identifiers.includes(String(item.number))) {
            item.status = status;
            item.updatedAt = new Date().toISOString();
            count++;
          }
        });
        if (count > 0) {
          store.save(collection, list);
          showToast(`Updated status to "${status}" for ${count} item(s) in ${collection}.`, 'success');
        } else {
          showToast(`No matching items found in ${collection} to update status.`, 'error');
        }

      } else if (action === 'REORDER_STOCK' && param) {
        if (!checkCollectionPermission('purchaseOrders', 'create')) return;
        let itemId = json?.itemId || json?.id;
        let supplierName = json?.supplierName || json?.supplier || 'Default Supplier';
        let qty = Number(json?.quantity || json?.qty) || 10;
        if (!json) {
          const parts = param.split('|').map(p => p.trim());
          itemId = parts[0];
          qty = Number(parts[1]) || 10;
          supplierName = parts[2] || 'Default Supplier';
        }

        const stockList = store.getAll('stock') || [];
        const stockItem = stockList.find(s => s.id === itemId || s.name?.toLowerCase() === itemId?.toLowerCase());
        const itemName = stockItem ? stockItem.name : (itemId || 'Stock Item');

        const nextNum = store.getNextNumber('PO-', 'purchaseOrders');

        const newPo = {
          id: store.generateId(),
          number: String(nextNum),
          title: `PO for Reorder: ${itemName}`,
          supplierName: supplierName,
          status: 'Pending',
          total: (stockItem ? (stockItem.costPrice || 0) : 0) * qty,
          items: [{ stockId: stockItem ? stockItem.id : null, name: itemName, quantity: qty }],
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };
        pos.push(newPo);
        store.save('purchaseOrders', pos);
        showToast(`Created PO #${nextNum} to reorder ${qty}x "${itemName}".`, 'success');

      } else if (action === 'ADD_WIDGET' && param) {
        const title = ff.addWidgetById?.(param);
        if (title) {
          showToast(`Relay added the "${title}" widget.`, 'success');
        }
      } else if (action === 'FIT_CANVAS') {
        ff.fitAll?.();
        showToast('Relay fitted the dashboard canvas.', 'info');
      } else if (action === 'LOCK_CANVAS') {
        const lock = param === 'true';
        ff.setLock?.(lock);
        showToast(`Relay ${lock ? 'locked' : 'unlocked'} the canvas.`, 'info');
      } else if (action === 'JUMP_VIEW' && param) {
        const label = ff.flyToViewByName?.(param);
        if (label) {
          showToast(`Relay jumped to saved view "${label}".`, 'info');
        }
      } else if (action === 'NAVIGATE' && param) {
        const route = (json?.page || param).toLowerCase().trim();
        let targetHash = `#/${route}`;
        if (route === 'dashboard' || route === 'home') {
          targetHash = '#/';
        }

        const permissionMapping = {
          jobs: 'Jobs',
          customers: 'Customers',
          quotes: 'Quotes',
          invoices: 'Invoices',
          schedule: 'Schedule',
          timesheets: 'Timesheets',
          stock: 'Stock',
          assets: 'Assets',
          settings: 'Settings',
          suppliers: 'Suppliers',
          contractors: 'Contractors',
          'purchase-orders': 'Purchase Orders'
        };

        const baseRoute = route.split('/')[0];
        if (baseRoute === 'settings') {
          showToast(`Permission Denied: Assistant cannot access Settings.`, 'error');
          return;
        }

        const moduleName = permissionMapping[baseRoute];
        if (moduleName) {
          const allowed = hasPermission(moduleName, 'view') || hasPermission(moduleName, 'view_own');
          if (!allowed) {
            showToast(`Permission Denied: You do not have permission to view ${moduleName}.`, 'error');
            return;
          }
        }

        window.location.hash = targetHash;
        showToast(`Navigated to ${route} page.`, 'info');
      } else if (action === 'CREATE_CUSTOMER' && param) {
        if (!checkCollectionPermission('customers', 'create')) return;
        let type, firstName, lastName, companyName, email, phone, address;
        if (json) {
          type = json.type || 'Residential';
          firstName = json.firstName || json.first_name || '';
          lastName = json.lastName || json.last_name || '';
          companyName = json.companyName || json.company || '';
          email = json.email || '';
          phone = json.phone || '';
          address = json.address || '';
        } else {
          const parts = param.split('|').map(p => p.trim());
          type = parts[0] || 'Residential';
          firstName = parts[1] || '';
          lastName = parts[2] || '';
          companyName = parts[3] || '';
          email = parts[4] || '';
          phone = parts[5] || '';
          address = parts[6] || '';
        }

        const list = store.getAll('customers') || [];
        const newItem = {
          id: store.generateId(),
          first_name: firstName,
          last_name: lastName,
          company: companyName,
          email,
          phone,
          address,
          status: 'Active',
          type: type,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };
        list.push(newItem);
        store.save('customers', list);
        const displayName = companyName || `${firstName} ${lastName}`.trim() || 'New Customer';
        showToast(`Created customer "${displayName}" successfully.`, 'success');

      } else if (action === 'CREATE_JOB' && param) {
        if (!checkCollectionPermission('jobs', 'create')) return;
        let title, status, customerName, techName, scheduledDate, estHours, notes;
        if (json) {
          title = json.title || 'New Job';
          status = json.status || 'Scheduled';
          customerName = json.customerName || json.customer || '';
          techName = json.technicianName || json.techName || '';
          scheduledDate = json.scheduledDate || json.date || '';
          estHours = Number(json.estimated_hours || json.estHours || json.hours) || 0;
          notes = json.notes || '';
        } else {
          const parts = param.split('|').map(p => p.trim());
          title = parts[0] || 'New Job';
          status = parts[1] || 'Scheduled';
          customerName = parts[2] || '';
          techName = parts[3] || '';
          scheduledDate = parts[4] || '';
          estHours = Number(parts[5]) || 0;
          notes = parts[6] || '';
        }

        const nextNum = store.getNextNumber('J-', 'jobs');

        const customers = store.getAll('customers') || [];
        const customer = customers.find(c => `${c.first_name || ''} ${c.last_name || ''}`.trim().toLowerCase() === customerName.toLowerCase() || c.company?.toLowerCase() === customerName.toLowerCase());

        const allTechs = store.getAll('technicians') || [];
        if (techName) {
          const isDeactivated = allTechs.some(t => t.name.toLowerCase() === techName.toLowerCase() && t.deactivated);
          if (isDeactivated) {
            showToast(`Cannot create job: ${techName} is a deactivated technician.`, 'error');
            return;
          }
        }
        const technicians = allTechs.filter(t => !t.deactivated);
        const tech = technicians.find(t => t.name.toLowerCase() === techName.toLowerCase());

        const newItem = {
          id: store.generateId(),
          number: String(nextNum),
          title,
          status,
          customer_id: customer ? customer.id : null,
          customerName: customer ? `${customer.first_name || ''} ${customer.last_name || ''}`.trim() : customerName,
          technician_id: tech ? tech.id : null,
          technicianName: tech ? tech.name : techName,
          scheduledDate,
          estimated_hours: estHours,
          notes,
          tasks: [],
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };
        list.push(newItem);
        store.save('jobs', list);
        showToast(`Created Job #${nextNum} "${title}" successfully.`, 'success');

      } else if (action === 'CREATE_QUOTE' && param) {
        if (!checkCollectionPermission('quotes', 'create')) return;
        let title, status, customerName, subtotal, tax, total, validUntil, notes;
        if (json) {
          title = json.title || 'New Quote';
          status = json.status || 'Draft';
          customerName = json.customerName || json.customer || '';
          subtotal = Number(json.subtotal) || 0;
          tax = Number(json.tax) || 0;
          total = Number(json.total) || 0;
          validUntil = json.valid_until || json.validUntil || '';
          notes = json.notes || '';
        } else {
          const parts = param.split('|').map(p => p.trim());
          title = parts[0] || 'New Quote';
          status = parts[1] || 'Draft';
          customerName = parts[2] || '';
          subtotal = Number(parts[3]) || 0;
          tax = Number(parts[4]) || 0;
          total = Number(parts[5]) || 0;
          validUntil = parts[6] || '';
          notes = parts[7] || '';
        }

        const nextNum = store.getNextNumber('Q-', 'quotes');

        const customers = store.getAll('customers') || [];
        const customer = customers.find(c => `${c.first_name || ''} ${c.last_name || ''}`.trim().toLowerCase() === customerName.toLowerCase());

        const newItem = {
          id: store.generateId(),
          number: String(nextNum),
          title,
          status,
          customer_id: customer ? customer.id : null,
          customerName: customer ? `${customer.first_name || ''} ${customer.last_name || ''}`.trim() : customerName,
          subtotal,
          tax,
          total,
          valid_until: validUntil,
          notes,
          line_items: [],
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };
        list.push(newItem);
        store.save('quotes', list);
        showToast(`Created Quote #${nextNum} successfully.`, 'success');

      } else if (action === 'CREATE_INVOICE' && param) {
        if (!checkCollectionPermission('invoices', 'create')) return;
        let title, status, jobNum, customerName, subtotal, tax, total, dueDate, notes;
        if (json) {
          title = json.title || 'New Invoice';
          status = json.status || 'Sent';
          jobNum = json.job_id || json.jobNum || '';
          customerName = json.customerName || json.customer || '';
          subtotal = Number(json.subtotal) || 0;
          tax = Number(json.tax) || 0;
          total = Number(json.total) || 0;
          dueDate = json.due_date || json.dueDate || '';
          notes = json.notes || '';
        } else {
          const parts = param.split('|').map(p => p.trim());
          title = parts[0] || 'New Invoice';
          status = parts[1] || 'Sent';
          jobNum = parts[2] || '';
          customerName = parts[3] || '';
          subtotal = Number(parts[4]) || 0;
          tax = Number(parts[5]) || 0;
          total = Number(parts[6]) || 0;
          dueDate = parts[7] || '';
          notes = parts[8] || '';
        }

        const nextNum = store.getNextNumber('INV-', 'invoices');

        const customers = store.getAll('customers') || [];
        const customer = customers.find(c => `${c.first_name || ''} ${c.last_name || ''}`.trim().toLowerCase() === customerName.toLowerCase());

        const newItem = {
          id: store.generateId(),
          number: String(nextNum),
          title,
          status,
          job_id: jobNum,
          customer_id: customer ? customer.id : null,
          customerName: customer ? `${customer.first_name || ''} ${customer.last_name || ''}`.trim() : customerName,
          subtotal,
          tax,
          total,
          due_date: dueDate,
          notes,
          line_items: [],
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };
        list.push(newItem);
        store.save('invoices', list);
        showToast(`Created Invoice #${nextNum} successfully.`, 'success');
      } else if (action === 'UPDATE_RECORD' && param) {
        let collection, identifier, updates;
        if (json) {
          collection = json.collection;
          let rawId = json.id || json.identifier || json.number;
          identifier = rawId != null ? String(rawId) : '';
          if (json.updates && typeof json.updates === 'object') {
            updates = json.updates;
          } else {
            const fieldName = json.field || json.fieldName;
            const newValue = json.value || json.newValue;
            updates = {};
            if (fieldName) updates[fieldName] = newValue;
          }
        } else {
          const parts = param.split('|').map(p => p.trim());
          collection = parts[0];
          identifier = parts[1];
          updates = {};
          if (parts[2]) updates[parts[2]] = parts[3];
        }

        if (!checkCollectionPermission(collection, 'edit')) return;

        const list = store.getAll(collection) || [];
        const item = list.find(it => it.id === identifier || String(it.number) === identifier || (it.first_name && `${it.first_name || ''} ${it.last_name || ''}`.trim().toLowerCase() === identifier.toLowerCase()));
        if (item) {
          let updatedCount = 0;
          for (const [fieldName, newValue] of Object.entries(updates)) {
            let targetField = fieldName;
            if (fieldName === 'scheduled_date') targetField = 'scheduledDate';
            if (fieldName === 'technician_name') targetField = 'technicianName';
            if (fieldName === 'technician_id') targetField = 'technician_id';
            if (fieldName === 'estimated_hours') targetField = 'estimated_hours';
            if (fieldName === 'due_date') targetField = 'due_date';
            if (fieldName === 'valid_until') targetField = 'valid_until';

            let val = newValue;
            if (newValue === 'true') val = true;
            if (newValue === 'false') val = false;
            if (newValue === 'null') val = null;
            if (typeof newValue === 'string' && !isNaN(newValue) && newValue !== '') val = Number(newValue);

            if (targetField === 'technicianName' && val) {
              const allTechs = store.getAll('technicians') || [];
              const isDeactivated = allTechs.some(t => t.name.toLowerCase() === val.toLowerCase() && t.deactivated);
              if (isDeactivated) {
                showToast(`Cannot assign job: ${val} is a deactivated technician.`, 'error');
                return;
              }
            }

            item[targetField] = val;
            updatedCount++;
          }
          item.updatedAt = new Date().toISOString();

          // Try to link technician_id if tech name was updated
          if (updates.technicianName || updates.technician_name) {
            const val = updates.technicianName || updates.technician_name;
            const allTechs = store.getAll('technicians') || [];
            const tech = allTechs.filter(t => !t.deactivated).find(t => t.name.toLowerCase() === (val || '').toLowerCase());
            if (tech) {
              item.technician_id = tech.id;
            } else {
              item.technician_id = null;
            }
          }

          store.save(collection, list);
          const displayLabel = item.number ? `#${item.number}` : (item.name || item.title || `${item.first_name || ''} ${item.last_name || ''}`.trim() || item.id);
          const updatedFields = Object.keys(updates).join(', ');
          showToast(`Updated [${updatedFields}] for ${collection.slice(0, -1)} "${displayLabel}".`, 'success');
        } else {
          showToast(`Could not find ${collection.slice(0, -1)} "${identifier}".`, 'error');
        }

      } else if (action === 'DELETE_RECORD' && param) {
        let collection, identifier;
        if (json) {
          collection = json.collection;
          let rawId = json.id || json.identifier || json.number;
          identifier = rawId != null ? String(rawId) : '';
        } else {
          const parts = param.split('|').map(p => p.trim());
          collection = parts[0];
          identifier = parts[1];
        }

        if (!checkCollectionPermission(collection, 'delete')) return;

        const list = store.getAll(collection) || [];
        const index = list.findIndex(it => it.id === identifier || String(it.number) === identifier || (it.first_name && `${it.first_name || ''} ${it.last_name || ''}`.trim().toLowerCase() === identifier.toLowerCase()));
        if (index !== -1) {
          const removed = list.splice(index, 1)[0];
          store.save(collection, list);
          const displayLabel = removed.number ? `#${removed.number}` : (removed.name || removed.title || `${removed.first_name || ''} ${removed.last_name || ''}`.trim() || removed.id);
          showToast(`Deleted ${collection.slice(0, -1)} "${displayLabel}" successfully.`, 'success');
        } else {
          showToast(`Could not find ${collection.slice(0, -1)} "${identifier}".`, 'error');
        }
      } else if (action === 'UPDATE_FACTSHEET' && param) {
        const currentUser = JSON.parse(localStorage.getItem('currentUser') || 'null');
        const userId = currentUser ? currentUser.id : 'default';
        const enabledKey = `relay_factsheet_enabled_${userId}`;
        const isEnabled = localStorage.getItem(enabledKey) !== 'false';
        if (!isEnabled) {
          console.log('User has disabled AI memory, skipping factsheet write.');
          return;
        }
        const factsheetKey = `relay_factsheet_${userId}`;
        const existing = localStorage.getItem(factsheetKey) || '';
        const updated = (existing.trim() ? existing.trim() + '\n- ' : '- ') + param;
        localStorage.setItem(factsheetKey, updated);
        window.dispatchEvent(new Event('storage'));
        showToast('Relay updated your personal factsheet.', 'success');
      } else if (action === 'CREATE_RECORD' && param) {
        const parts = param.split('|').map(p => p.trim());
        const collection = parts[0];
        if (!checkCollectionPermission(collection, 'create')) return;

        const fields = {};
        for (let i = 1; i < parts.length; i++) {
          const fieldPart = parts[i];
          const colonIdx = fieldPart.indexOf(':');
          if (colonIdx !== -1) {
            const fieldName = fieldPart.slice(0, colonIdx).trim();
            const valueStr = fieldPart.slice(colonIdx + 1).trim();

            let val = valueStr;
            if ((valueStr.startsWith('{') && valueStr.endsWith('}')) || (valueStr.startsWith('[') && valueStr.endsWith(']'))) {
              try {
                val = JSON.parse(valueStr);
              } catch (e) {
                console.error('Failed to parse JSON field value', e);
              }
            } else {
              if (valueStr === 'true') val = true;
              if (valueStr === 'false') val = false;
              if (valueStr === 'null') val = null;
              if (!isNaN(valueStr) && valueStr !== '') val = Number(valueStr);
            }

            fields[fieldName] = val;
          }
        }

        const list = store.getAll(collection) || [];
        const newItem = {
          id: store.generateId(),
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          ...fields
        };

        if (['jobs', 'quotes', 'invoices', 'purchaseOrders', 'leads'].includes(collection)) {
          if (!newItem.number) {
            const pref = collection === 'jobs' ? 'J-' : collection === 'quotes' ? 'Q-' : collection === 'invoices' ? 'INV-' : collection === 'purchaseOrders' ? 'PO-' : 'LD-';
            newItem.number = store.getNextNumber(pref, collection);
          }
        }

        list.push(newItem);
        store.save(collection, list);

        const displayLabel = newItem.number ? `#${newItem.number}` : (newItem.name || newItem.title || newItem.id);
        if (!suppressActionToasts) {
          showToast(`Created new ${collection.slice(0, -1)} "${displayLabel}" successfully.`, 'success');
        }
      }
    } catch (e) {
      console.error(`AI action failed: ${action}`, e);
    }
}

// Text-chat path: execute every action in a reply and return the cleaned prose.
export async function parseAndExecuteActions(reply) {
  const { actions, cleanReply } = extractActions(reply);
  actions.forEach(({ action, param }) => {
    console.log(`Executing AI action: ${action} with param: ${param}`);
    executeAction(action, param);
  });
  return cleanReply;
}

function checkCollectionPermission(collection, action) {
  const mapping = {
    jobs: 'Jobs',
    customers: 'Customers',
    quotes: 'Quotes',
    invoices: 'Invoices',
    purchaseOrders: 'Purchase Orders',
    suppliers: 'Suppliers',
    contractors: 'Contractors',
    leads: 'Leads',
    assets: 'Assets',
    stock: 'Stock',
    timesheets: 'Timesheets'
  };

  const moduleName = mapping[collection];
  if (!moduleName) return true;

  let key = action;
  if (action === 'delete' && moduleName === 'Invoices') {
    key = 'void';
  }

  const allowed = hasPermission(moduleName, key);
  if (!allowed) {
    showToast(`Permission Denied: You do not have permission to ${action} ${collection}.`, 'error');
    return false;
  }
  return true;
}

// Kick off the Routine scheduler once the app loads. It ticks on a ~60s cadence
// so interval/morning routines fire even while the Deputy panel stays closed.
scheduleRoutineEvaluation();
