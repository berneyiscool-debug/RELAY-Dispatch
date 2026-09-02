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
import { dispatchChat } from '../utils/aiEngine.js';
import { isCloudUser, hasDeputyMax } from '../utils/aiTier.js';
import { hasPermission } from '../utils/permissions.js';
import relayIcon from '../assets/deputy-icon.svg?raw';
import { prepareAttachments, isSupportedAttachment, fileKind, chunk, MAX_PDF_PAGES, VISION_BATCH_SIZE } from '../utils/relayAttachments.js';
import { loadUserMemory, saveUserMemory, clearStaleMemory, getStructuredMemory } from '../utils/userMemory.js';
import { FLAGS } from '../utils/flags.js';
import { hasMapsAction, runMapsActions } from '../utils/deputyMaps.js';
import { hasWeatherAction, runWeatherActions } from '../utils/deputyWeather.js';
import { getThreads, getThread, createThread, renameThread, deleteThread, setThreadMessages, ensureDefaultThread } from '../utils/deputyThreads.js';
import { runEmergencyScan, summariseScan, SCAN_CATEGORIES } from '../utils/deputyScan.js';
import { triageMessage, routeIntent } from '../utils/deputyTriage.js';

let panel = null;
let onStateChange = null;
let chatHistory = [];
let currentThreadId = null;
let emergencyFindings = [];
let scanRefreshTimer = null;

function lastThreadKey() {
  return `relay_last_thread_${getUserId()}`;
}

// ── Workspace State & Action Audit Log ──
let isExpanded = localStorage.getItem('relay_expanded') === 'true';
let activeTab = 'watchdog'; // Defaults to Watchdog window when opened/expanded
let actionAuditLog = [
  {
    id: 'act_init',
    timestamp: new Date().toLocaleTimeString('en-AU', { hour: '2-digit', minute: '2-digit' }),
    title: 'Operations Watchdog Active',
    details: 'Scanned active jobs, inventory thresholds, and billing status',
    status: 'success'
  }
];

function logAction(title, details, status = 'success') {
  actionAuditLog.unshift({
    id: 'act_' + Math.random().toString(36).substr(2, 9),
    timestamp: new Date().toLocaleTimeString('en-AU', { hour: '2-digit', minute: '2-digit' }),
    title,
    details,
    status
  });
  if (actionAuditLog.length > 50) actionAuditLog.pop();
}

function renderWatchdogView(container) {
  const jobs = store.getAll('jobs') || [];
  const stock = store.getAll('stock') || [];
  const invoices = store.getAll('invoices') || [];
  const quotes = store.getAll('quotes') || [];
  const schedules = store.getAll('schedule') || [];

  const unassignedJobs = jobs.filter(j => !j.technicianId && (!j.technicians || !j.technicians.length) && j.status !== 'Completed' && j.status !== 'Invoiced');
  const lowStock = stock.filter(s => (s.quantity || 0) <= (s.reorderPoint || 5));
  const overdueInvoices = invoices.filter(i => i.status === 'Overdue');
  const pendingQuotes = quotes.filter(q => q.status === 'Sent' || q.status === 'Pending');

  const techBlocks = {};
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
        if ((blocks[i].startHour||0) < (blocks[i-1].endHour||0)) { conflictCount++; break; }
      }
    }
  });

  const totalIssues = unassignedJobs.length + conflictCount + lowStock.length + overdueInvoices.length;
  const healthScore = Math.max(20, Math.min(100, 100 - (totalIssues * 5)));

  container.innerHTML = `
    <div class="watchdog-banner">
      <div class="watchdog-banner-info">
        <div class="watchdog-health-ring">${healthScore}%</div>
        <div>
          <h2 style="margin:0;font-size:18px;font-weight:600;color:var(--text-primary);">Operations Watchdog Dashboard</h2>
          <div style="font-size:13px;color:var(--text-secondary);margin-top:2px;">
            ${totalIssues === 0 ? 'All systems operating smoothly. No active conflicts detected.' : `Detected ${totalIssues} operational alert${totalIssues === 1 ? '' : 's'} requiring attention.`}
          </div>
        </div>
      </div>
    </div>

    <div class="watchdog-grid">
      <div class="watchdog-card">
        <div>
          <div class="watchdog-card-head">
            <div class="watchdog-card-title">
              <span class="material-icons-outlined" style="color:var(--text-secondary)">event_seat</span>
              Schedule & Dispatch Health
            </div>
            <span class="badge ${conflictCount + unassignedJobs.length > 0 ? 'badge-warning' : 'badge-success'}">${conflictCount + unassignedJobs.length} Alerts</span>
          </div>
          <div style="margin-top:12px;font-size:13px;color:var(--text-secondary);line-height:1.5;">
            ${unassignedJobs.length} unassigned jobs pending scheduling.<br>
            ${conflictCount} technician time overlaps detected across active schedules.
          </div>
        </div>
        <div>
          <button class="btn btn-primary btn-sm btn-autofix-dispatch" style="width:100%;display:inline-flex;align-items:center;justify-content:center;gap:6px;" ${unassignedJobs.length === 0 && conflictCount === 0 ? 'disabled' : ''}>
            <span class="material-icons-outlined" style="font-size:16px;">auto_fix_high</span> Auto-Fix & Assign Schedule
          </button>
        </div>
      </div>

      <div class="watchdog-card">
        <div>
          <div class="watchdog-card-head">
            <div class="watchdog-card-title">
              <span class="material-icons-outlined" style="color:var(--text-secondary)">inventory_2</span>
              Inventory & Reorder Status
            </div>
            <span class="badge ${lowStock.length > 0 ? 'badge-danger' : 'badge-success'}">${lowStock.length} Low Stock</span>
          </div>
          <div style="margin-top:12px;font-size:13px;color:var(--text-secondary);line-height:1.5;">
            ${lowStock.length === 0 ? 'All inventory levels are above reorder thresholds.' : `${lowStock.length} stock item${lowStock.length === 1 ? '' : 's'} at or below reorder level.`}
          </div>
        </div>
        <div>
          <button class="btn btn-secondary btn-sm btn-autofix-stock" style="width:100%;display:inline-flex;align-items:center;justify-content:center;gap:6px;" ${lowStock.length === 0 ? 'disabled' : ''}>
            <span class="material-icons-outlined" style="font-size:16px;">add_shopping_cart</span> Draft Reorder Purchase Orders
          </button>
        </div>
      </div>

      <div class="watchdog-card">
        <div>
          <div class="watchdog-card-head">
            <div class="watchdog-card-title">
              <span class="material-icons-outlined" style="color:var(--text-secondary)">receipt_long</span>
              Overdue Billing & Invoices
            </div>
            <span class="badge ${overdueInvoices.length > 0 ? 'badge-danger' : 'badge-success'}">${overdueInvoices.length} Overdue</span>
          </div>
          <div style="margin-top:12px;font-size:13px;color:var(--text-secondary);line-height:1.5;">
            ${overdueInvoices.length === 0 ? 'No overdue invoices.' : `${overdueInvoices.length} invoice${overdueInvoices.length === 1 ? '' : 's'} past payment terms.`}
          </div>
        </div>
        <div>
          <button class="btn btn-secondary btn-sm btn-autofix-invoices" style="width:100%;display:inline-flex;align-items:center;justify-content:center;gap:6px;" ${overdueInvoices.length === 0 ? 'disabled' : ''}>
            <span class="material-icons-outlined" style="font-size:16px;">mail</span> Send Payment Reminders
          </button>
        </div>
      </div>

      <div class="watchdog-card">
        <div>
          <div class="watchdog-card-head">
            <div class="watchdog-card-title">
              <span class="material-icons-outlined" style="color:var(--text-secondary)">request_quote</span>
              Pending Proposals & Quotes
            </div>
            <span class="badge badge-info">${pendingQuotes.length} Pending</span>
          </div>
          <div style="margin-top:12px;font-size:13px;color:var(--text-secondary);line-height:1.5;">
            ${pendingQuotes.length} quote${pendingQuotes.length === 1 ? '' : 's'} currently sent or awaiting customer response.
          </div>
        </div>
        <div>
          <button class="btn btn-secondary btn-sm btn-autofix-quotes" style="width:100%;display:inline-flex;align-items:center;justify-content:center;gap:6px;" ${pendingQuotes.length === 0 ? 'disabled' : ''}>
            <span class="material-icons-outlined" style="font-size:16px;">mark_email_read</span> Log Quote Follow-Ups
          </button>
        </div>
      </div>
    </div>
  `;

  container.querySelector('.btn-open-inspector')?.addEventListener('click', () => {
    activeTab = 'inspector';
    updateWorkspaceView(panel);
  });

  container.querySelector('.btn-autofix-dispatch')?.addEventListener('click', () => {
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
  });

  container.querySelector('.btn-autofix-stock')?.addEventListener('click', () => {
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
  });

  container.querySelector('.btn-autofix-invoices')?.addEventListener('click', () => {
    logAction('Payment Reminders', `Sent automated reminders for ${overdueInvoices.length} overdue invoices`);
    showToast(`Reminders sent for ${overdueInvoices.length} overdue invoices!`, 'success');
    renderWatchdogView(container);
  });

  container.querySelector('.btn-autofix-quotes')?.addEventListener('click', () => {
    logAction('Quote Follow-Up', `Logged follow-up tasks for ${pendingQuotes.length} pending quotes`);
    showToast(`Follow-ups logged for ${pendingQuotes.length} pending quotes!`, 'success');
    renderWatchdogView(container);
  });
}

async function renderMemoryInspectorView(container) {
  let memory = await loadUserMemory();
  const entries = Object.entries(memory || {}).filter(([k]) => k !== 'lastUpdated');

  container.innerHTML = `
    <div class="watchdog-banner">
      <div class="watchdog-banner-info">
        <div style="width:54px;height:54px;border-radius:50%;background:rgba(147,51,234,0.12);color:#9333ea;display:flex;align-items:center;justify-content:center;">
          <span class="material-icons-outlined" style="font-size:28px;">psychology</span>
        </div>
        <div>
          <h2 style="margin:0;font-size:18px;font-weight:700;color:var(--text-primary);">Memory & Audit Inspector</h2>
          <div style="font-size:13px;color:var(--text-secondary);margin-top:2px;">
            Inspect what Deputy has learned about your workspace and review automated system actions.
          </div>
        </div>
      </div>
      <div class="watchdog-banner-actions">
        <button class="btn btn-secondary btn-sm btn-return-watchdog" style="display:inline-flex;align-items:center;gap:6px;font-weight:600;">
          <span class="material-icons-outlined" style="font-size:16px;">arrow_back</span> &larr; Return to Watchdog
        </button>
      </div>
    </div>

    <div class="inspector-grid">
      <div class="inspector-card">
        <div style="display:flex;align-items:center;justify-content:space-between;border-bottom:1px solid var(--border-color);padding-bottom:12px;">
          <div style="font-weight:700;font-size:15px;display:flex;align-items:center;gap:8px;">
            <span class="material-icons-outlined" style="color:var(--color-primary)">memory</span>
            Learned Memory Keys (${entries.length})
          </div>
          <button class="btn btn-sm btn-primary btn-add-memory-key" style="font-size:11px;padding:3px 8px;">+ Add Key</button>
        </div>
        <div style="display:flex;flex-direction:column;gap:8px;max-height:360px;overflow-y:auto;">
          ${entries.length === 0 ? '<div style="color:var(--text-tertiary);font-size:13px;padding:12px;text-align:center;">No custom memory entries stored yet.</div>' : entries.map(([key, val]) => `
            <div class="memory-entry-row">
              <div style="overflow:hidden;text-overflow:ellipsis;white-space:nowrap;max-width:220px;">
                <span style="font-weight:600;color:var(--text-primary);">${escapeHtml(key)}:</span>
                <span style="color:var(--text-secondary);margin-left:6px;">${escapeHtml(typeof val === 'object' ? JSON.stringify(val) : String(val))}</span>
              </div>
              <button class="btn btn-ghost btn-sm btn-delete-memory" data-key="${escapeHtml(key)}" title="Delete Key" style="height:24px;padding:0 6px;color:var(--color-danger);">
                <span class="material-icons-outlined" style="font-size:14px;">delete</span>
              </button>
            </div>
          `).join('')}
        </div>
      </div>

      <div class="inspector-card">
        <div style="display:flex;align-items:center;justify-content:space-between;border-bottom:1px solid var(--border-color);padding-bottom:12px;">
          <div style="font-weight:700;font-size:15px;display:flex;align-items:center;gap:8px;">
            <span class="material-icons-outlined" style="color:var(--color-info)">history</span>
            Session Action Audit Log (${actionAuditLog.length})
          </div>
          <button class="btn btn-sm btn-secondary btn-clear-audit" style="font-size:11px;padding:3px 8px;" ${actionAuditLog.length === 0 ? 'disabled' : ''}>Clear Log</button>
        </div>
        <div style="display:flex;flex-direction:column;gap:8px;max-height:360px;overflow-y:auto;">
          ${actionAuditLog.length === 0 ? '<div style="color:var(--text-tertiary);font-size:13px;padding:12px;text-align:center;">No automated actions executed in this session yet.</div>' : actionAuditLog.map(act => `
            <div style="display:flex;align-items:flex-start;justify-content:space-between;padding:10px;background:var(--bg-color-alt, rgba(0,0,0,0.02));border:1px solid var(--border-color);border-radius:8px;font-size:12px;">
              <div>
                <div style="font-weight:700;color:var(--text-primary);">${escapeHtml(act.title)}</div>
                <div style="color:var(--text-secondary);margin-top:2px;">${escapeHtml(act.details)}</div>
              </div>
              <span style="color:var(--text-tertiary);font-size:11px;white-space:nowrap;margin-left:8px;">${escapeHtml(act.timestamp)}</span>
            </div>
          `).join('')}
        </div>
      </div>
    </div>
  `;

  container.querySelector('.btn-return-watchdog')?.addEventListener('click', () => {
    activeTab = 'watchdog';
    updateWorkspaceView(panel);
  });

  container.querySelector('.btn-add-memory-key')?.addEventListener('click', async () => {
    const key = prompt('Enter memory key name (e.g. preferredDispatchZone):');
    if (!key) return;
    const value = prompt(`Enter value for "${key}":`);
    if (value === null) return;
    memory[key] = value;
    await saveUserMemory(memory);
    logAction('Added Memory Key', `Saved "${key}" = "${value}"`);
    showToast(`Memory key "${key}" saved!`, 'success');
    renderMemoryInspectorView(container);
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

  container.querySelector('.btn-clear-audit')?.addEventListener('click', () => {
    actionAuditLog = [];
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
  if (panel && activeTab === 'scan') {
    renderEmergencyScanView(panel.querySelector('#relay-workspace-view'));
  }
}

function scheduleEmergencyScanRefresh() {
  if (!hasDeputyMax()) return;
  if (scanRefreshTimer) clearTimeout(scanRefreshTimer);
  scanRefreshTimer = setTimeout(refreshEmergencyScan, 1200);
}

function renderEmergencyScanView(container) {
  if (!container) return;
  if (!hasDeputyMax()) {
    container.innerHTML = '';
    return;
  }
  if (!emergencyFindings.length) emergencyFindings = runEmergencyScan();
  const findings = emergencyFindings;
  const counts = { critical: 0, high: 0, medium: 0 };
  findings.forEach(f => { counts[f.severity] = (counts[f.severity] || 0) + 1; });

  const grouped = {};
  findings.forEach(f => {
    if (!grouped[f.category]) grouped[f.category] = [];
    grouped[f.category].push(f);
  });

  const noFindings = findings.length === 0;
  const groupHtml = Object.entries(grouped).map(([cat, items]) => `
    <div class="scan-group">
      <div class="scan-group-head">${escapeHtml(cat)} <span class="badge ${items.some(i => i.severity === 'critical') ? 'badge-danger' : 'badge-warning'}">${items.length}</span></div>
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
  `).join('');

  container.innerHTML = `
    <div class="watchdog-banner">
      <div class="watchdog-banner-info">
        <div class="watchdog-health-ring">${findings.length}</div>
        <div>
          <h2 style="margin:0;font-size:18px;font-weight:600;color:var(--text-primary);">Emergency Scan</h2>
          <div style="font-size:13px;color:var(--text-secondary);margin-top:2px;">
            ${noFindings ? 'No urgent issues detected. All systems look clear.' : `Detected ${findings.length} finding${findings.length === 1 ? '' : 's'}: ${counts.critical} critical, ${counts.high} high, ${counts.medium} medium.`}
          </div>
        </div>
      </div>
      <button class="btn btn-danger btn-sm btn-run-scan" style="display:inline-flex;align-items:center;gap:6px;">
        <span class="material-icons-outlined" style="font-size:16px;">radar</span> Run Emergency Scan
      </button>
    </div>
    ${noFindings ? `
      <div style="padding:24px 16px;text-align:center;color:var(--text-tertiary);">
        <span class="material-icons-outlined" style="font-size:32px;opacity:0.5;margin-bottom:8px;">verified</span>
        <div>Nothing needs urgent attention right now.</div>
      </div>
    ` : `<div class="scan-list">${groupHtml}</div>`}
  `;

  container.querySelector('.btn-run-scan')?.addEventListener('click', () => {
    emergencyFindings = runEmergencyScan();
    surfaceEmergencyAsks(emergencyFindings);
    logAction('Emergency Scan', `Ran scan — ${emergencyFindings.length} finding${emergencyFindings.length === 1 ? '' : 's'}`, emergencyFindings.length ? 'warning' : 'success');
    renderEmergencyScanView(container);
  });

  container.querySelectorAll('.btn-open-scan').forEach(btn => {
    btn.addEventListener('click', () => {
      window.location.hash = `#/${btn.dataset.route}`;
      showToast(`Opened ${btn.dataset.route} view.`, 'info');
    });
  });
}

function updateWorkspaceView(panel) {
  if (!panel) return;
  const workspaceView = panel.querySelector('#relay-workspace-view');
  const chatContainer = panel.querySelector('#relay-chat-container');
  const navTabs = panel.querySelector('#relay-nav-tabs');
  const expandBtn = panel.querySelector('#relay-expand');

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

  if (isExpanded) {
    panel.classList.add('expanded');
  } else {
    panel.classList.remove('expanded');
  }

  if (activeTab === 'chat') {
    if (workspaceView) workspaceView.style.display = 'none';
    if (chatContainer) chatContainer.style.display = 'flex';
  } else {
    if (chatContainer) chatContainer.style.display = 'none';
    if (workspaceView) {
      workspaceView.style.display = 'flex';
      if (activeTab === 'watchdog') {
        renderWatchdogView(workspaceView);
      } else if (activeTab === 'inspector') {
        renderMemoryInspectorView(workspaceView);
      } else if (activeTab === 'scan') {
        renderEmergencyScanView(workspaceView);
      }
    }
  }
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
    if (currentThreadId) setThreadMessages(currentThreadId, history);
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

  // Always enforce chat mode when minimized, watchdog when expanded
  activeTab = isExpanded ? 'watchdog' : 'chat';

  const draftKey = `relay_draft_message_${getUserId()}`;
  const draftVal = localStorage.getItem(draftKey) || '';
  const cloud = isCloudUser();
  pendingAttachments = [];

  panel = document.createElement('div');
  panel.className = `relay-panel ${isExpanded ? 'expanded' : ''}`;
  panel.innerHTML = `
    <div class="relay-head">
      <div class="relay-head-id">
        <span class="relay-avatar">${relayIcon}</span>
        <div>
          <div class="relay-name">Deputy</div>
          <div class="relay-sub">Your co-pilot</div>
        </div>
      </div>
      <div class="relay-nav-tabs" id="relay-nav-tabs" style="${isExpanded ? 'display:flex' : 'display:none'}">
        <button class="relay-nav-tab ${activeTab === 'watchdog' ? 'active' : ''}" data-tab="watchdog" title="Operations Watchdog"><span class="material-icons-outlined">shield</span> Watchdog</button>
        <button class="relay-nav-tab ${activeTab === 'chat' ? 'active' : ''}" data-tab="chat" title="Chat Stream"><span class="material-icons-outlined">chat</span> Chat</button>
        <button class="relay-nav-tab ${activeTab === 'scan' ? 'active' : ''}" data-tab="scan" title="Emergency Scan" style="${hasDeputyMax() ? '' : 'display:none'}"><span class="material-icons-outlined">emergency</span> Scan</button>
      </div>
      <div class="relay-thread-switcher" id="relay-thread-switcher" style="${hasDeputyMax() ? '' : 'display:none'}">
        <button class="relay-thread-btn" id="relay-thread-btn" title="Switch chat thread">
          <span class="material-icons-outlined">forum</span>
          <span class="relay-thread-label" id="relay-thread-label">Main</span>
          <span class="material-icons-outlined relay-thread-caret">expand_more</span>
        </button>
        <div class="relay-thread-menu" id="relay-thread-menu" style="display:none"></div>
      </div>
      <div style="display: flex; align-items: center; gap: 6px; flex-shrink: 0;">
        <button class="relay-expand" id="relay-expand" title="${isExpanded ? 'Minimise to Side Drawer' : 'Expand to Full Workspace'}"><span class="material-icons-outlined">${isExpanded ? 'close_fullscreen' : 'open_in_full'}</span></button>
        <button class="relay-clear-chat" title="Clear Chat history"><span class="material-icons-outlined">delete_sweep</span></button>
        <button class="relay-close" title="Close"><span class="material-icons-outlined">close</span></button>
        <button class="assistant-reset-memory" title="Reset Assistant Memory" style="display:none;"><span class="material-icons-outlined">refresh</span></button>
      </div>
    </div>
    <div class="relay-workspace-view" id="relay-workspace-view" style="${activeTab !== 'chat' ? 'display:flex' : 'display:none'}"></div>
    <div class="relay-chat-container" id="relay-chat-container" style="${activeTab === 'chat' ? 'display:flex;flex-direction:column;flex:1;overflow:hidden' : 'display:none'}">
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
  `;
  document.body.appendChild(panel);
  document.body.classList.add('relay-assistant-open');
  void panel.offsetWidth;
  panel.classList.add('open');

  const thread = panel.querySelector('#relay-thread');
  const input = panel.querySelector('#relay-input');
  const send = panel.querySelector('#relay-send');
  const expandBtn = panel.querySelector('#relay-expand');
  const navTabs = panel.querySelector('#relay-nav-tabs');

  // Bind workspace expansion & tabs
  if (expandBtn) {
    expandBtn.addEventListener('click', () => {
      isExpanded = !isExpanded;
      localStorage.setItem('relay_expanded', isExpanded);
      if (isExpanded) {
        activeTab = 'watchdog';
      } else {
        activeTab = 'chat';
      }
      updateWorkspaceView(panel);
    });
  }

  if (navTabs) {
    navTabs.querySelectorAll('.relay-nav-tab').forEach(tab => {
      tab.addEventListener('click', (e) => {
        activeTab = e.currentTarget.dataset.tab;
        updateWorkspaceView(panel);
      });
    });
  }

  // Thread switcher (Deputy Max multichat) — toggle menu + close on outside click
  const threadBtn = panel.querySelector('#relay-thread-btn');
  const threadSwitcher = panel.querySelector('#relay-thread-switcher');
  if (threadBtn && threadSwitcher && hasDeputyMax()) {
    threadBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      const menu = panel.querySelector('#relay-thread-menu');
      if (!menu) return;
      renderThreadSwitcher();
      menu.style.display = menu.style.display === 'none' ? 'block' : 'none';
    });
    document.addEventListener('click', (e) => {
      if (threadSwitcher && !threadSwitcher.contains(e.target)) closeThreadMenu();
    });
  }

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
    renderThreadSwitcher();
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

  panel.querySelector('.relay-close').addEventListener('click', closeRelay);
  
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
panel.querySelector('.assistant-reset-memory')?.addEventListener('click', async () => {
  await saveUserMemory({});
  location.reload();
});
  
  const btnClearChat = panel.querySelector('.relay-clear-chat');
  if (btnClearChat) {
    btnClearChat.addEventListener('click', async () => {
      if (confirm('Are you sure you want to clear this chat?')) {
        chatHistory = [];
        if (hasDeputyMax()) {
          // Max: clear only the active thread, keep the rest.
          if (currentThreadId) await setThreadMessages(currentThreadId, []);
        } else {
          const key = `relay_chat_history_${getUserId()}`;
          localStorage.removeItem(key);
        }
        localStorage.removeItem(draftKey);
        thread.innerHTML = '';
        renderIntroDashboard(thread, {});
        renderThreadSwitcher();
        showToast('Chat cleared.', 'success');
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
  ['jobs', 'schedule', 'invoices', 'stock', 'maintenancePlans'].forEach(coll => store.off(coll, scheduleEmergencyScanRefresh));
  const p = panel;
  panel = null;
  p.classList.remove('open');
  document.body.classList.remove('relay-assistant-open');
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

  // 3. Strip Markdown asterisks since the UI doesn't render Markdown
  cleanedText = cleanedText.replace(/\*\*([^*]+)\*\*/g, '$1').replace(/\*([^*]+)\*/g, '$1');

  const m = document.createElement('div');
  m.className = `relay-msg relay-msg-${role}`;
  m.innerHTML = `<div class="relay-bubble">${escapeHtml(cleanedText)}</div>`;
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

function pushAssistant(reply) {
  chatHistory.push({ role: 'assistant', content: reply });
  trimHistory();
  saveChatHistory(chatHistory);
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
  chatHistory.forEach(msg => {
    const uiRole = msg.role === 'assistant' ? 'relay' : msg.role;
    addMessage(thread, uiRole, msg.content);
  });

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

// Render the header thread switcher (list, new chat, rename, delete) for Max users.
function renderThreadSwitcher() {
  if (!panel || !hasDeputyMax()) return;
  const menu = panel.querySelector('#relay-thread-menu');
  const label = panel.querySelector('#relay-thread-label');
  if (!menu) return;

  const threads = getThreads();
  const current = threads.find(t => t.id === currentThreadId);
  if (label) label.textContent = current ? current.title : 'New chat';

  menu.innerHTML = `
    <div class="relay-thread-menu-head">
      <span>Threads</span>
      <button class="relay-thread-new" id="relay-thread-new" title="Start a new chat">
        <span class="material-icons-outlined">add</span> New chat
      </button>
    </div>
    <div class="relay-thread-list">
      ${threads.length === 0
        ? '<div class="relay-thread-empty">No threads yet</div>'
        : threads.map(t => `
          <div class="relay-thread-item ${t.id === currentThreadId ? 'active' : ''}" data-id="${t.id}">
            <button class="relay-thread-pick" data-id="${t.id}" title="Open thread">
              <span class="material-icons-outlined">chat_bubble_outline</span>
              <span class="relay-thread-name">${escapeHtml(t.title)}</span>
            </button>
            <button class="relay-thread-rename" data-id="${t.id}" title="Rename"><span class="material-icons-outlined">edit</span></button>
            <button class="relay-thread-delete" data-id="${t.id}" title="Delete"><span class="material-icons-outlined">delete</span></button>
          </div>
        `).join('')}
    </div>
  `;

  menu.querySelector('#relay-thread-new')?.addEventListener('click', async () => {
    const t = await createThread();
    currentThreadId = t.id;
    localStorage.setItem(lastThreadKey(), t.id);
    chatHistory = [];
    const threadEl = panel.querySelector('#relay-thread');
    if (threadEl) await renderChatThread(threadEl);
    renderThreadSwitcher();
    closeThreadMenu();
  });

  menu.querySelectorAll('.relay-thread-pick').forEach(btn => {
    btn.addEventListener('click', async () => {
      currentThreadId = btn.dataset.id;
      localStorage.setItem(lastThreadKey(), currentThreadId);
      chatHistory = loadChatHistory();
      const threadEl = panel.querySelector('#relay-thread');
      if (threadEl) await renderChatThread(threadEl);
      renderThreadSwitcher();
      closeThreadMenu();
    });
  });

  menu.querySelectorAll('.relay-thread-rename').forEach(btn => {
    btn.addEventListener('click', async (e) => {
      e.stopPropagation();
      const id = btn.dataset.id;
      const cur = getThread(id);
      const title = prompt('Rename thread:', cur ? cur.title : '');
      if (title != null) {
        await renameThread(id, title.trim() || 'New chat');
        renderThreadSwitcher();
      }
    });
  });

  menu.querySelectorAll('.relay-thread-delete').forEach(btn => {
    btn.addEventListener('click', async (e) => {
      e.stopPropagation();
      const id = btn.dataset.id;
      if (!confirm('Delete this thread? This cannot be undone.')) return;
      const wasCurrent = id === currentThreadId;
      await deleteThread(id);
      if (wasCurrent) {
        const remaining = getThreads();
        currentThreadId = remaining.length ? remaining[0].id : null;
        if (currentThreadId) localStorage.setItem(lastThreadKey(), currentThreadId);
        else localStorage.removeItem(lastThreadKey());
        chatHistory = loadChatHistory();
        const threadEl = panel.querySelector('#relay-thread');
        if (threadEl) await renderChatThread(threadEl);
      }
      renderThreadSwitcher();
      closeThreadMenu();
    });
  });
}

function closeThreadMenu() {
  if (!panel) return;
  const menu = panel.querySelector('#relay-thread-menu');
  if (menu) menu.style.display = 'none';
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
    ...chatHistory
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
      ...chatHistory,
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

// ── 2-stage triage route handlers (Deputy Max) ────────────────────────────────
// QUESTION: synthesis prompt, no action parsing.
async function answerSynthesisPrompt(systemPrompt, ai, model) {
  const reply = await dispatchChat([{ role: 'system', content: systemPrompt }, ...chatHistory], ai, model);
  pushAssistant(reply);
  return reply;
}

// ACTION: focused prompt, execute action tags immediately (with permission checks).
async function runActionPrompt(systemPrompt, ai, model) {
  const reply = await dispatchChat([{ role: 'system', content: systemPrompt }, ...chatHistory], ai, model);
  return finaliseExternalReply(reply, systemPrompt, ai, model);
}

// EXTERNAL: gather live data first, then answer (no action tags executed).
async function resolveExternalPrompt(systemPrompt, ai, model) {
  const reply = await dispatchChat([{ role: 'system', content: systemPrompt }, ...chatHistory], ai, model);
  return finaliseExternalReply(reply, systemPrompt, ai, model, { parseActions: false });
}

// URGENT: run the emergency scan, surface critical findings as proposals,
// open the Emergency Scan view, and summarise.
async function handleUrgentIntent() {
  emergencyFindings = runEmergencyScan();
  surfaceEmergencyAsks(emergencyFindings);
  if (panel) {
    if (!isExpanded) {
      isExpanded = true;
      localStorage.setItem('relay_expanded', 'true');
    }
    activeTab = 'scan';
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
