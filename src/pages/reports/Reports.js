// ============================================
// RELAY DISPATCH — REPORTS MODULE
// ============================================
// Every number here comes from src/utils/reportMetrics.js, which runs the
// dashboard's own formulas over the report's filters, so Reports and the
// dashboard always agree. Money is GST-exclusive throughout.

import { store } from '../../data/store.js';
import { dispatchChat } from '../../utils/aiEngine.js';
import { isCloudUser } from '../../utils/aiTier.js';
import { escapeHTML } from '../../utils/security.js';
import { JOB_STATUS_COLORS, DOC_STATUS_COLORS } from '../../utils/statusColors.js';
import { statCard } from '../../components/StatCard.js';
import { buildReport, emptyFilters, toCsv } from '../../utils/reportMetrics.js';
import { toDate } from '../../utils/kpis.js';

const COLLECTIONS = [
  'jobs', 'quotes', 'invoices', 'customers', 'stock', 'technicians', 'leads', 'timesheets',
  'assets', 'maintenancePlans', 'schedule', 'jobMaterials', 'purchaseOrders',
];

const PRESETS = [
  { id: 'all', label: 'All time' },
  { id: 'month', label: 'This month' },
  { id: '30', label: '30 days' },
  { id: '90', label: '90 days' },
  { id: 'fy', label: 'Financial year' },
];

function isoDay(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

// { start, end } for a preset; the financial year runs July–June.
function presetDates(id, today = new Date()) {
  const end = isoDay(today);
  if (id === 'all') return { start: '', end: '' };
  if (id === 'month') return { start: isoDay(new Date(today.getFullYear(), today.getMonth(), 1)), end };
  if (id === 'fy') {
    const fy = today.getMonth() >= 6 ? today.getFullYear() : today.getFullYear() - 1;
    return { start: isoDay(new Date(fy, 6, 1)), end };
  }
  const start = new Date(today);
  start.setDate(today.getDate() - Number(id));
  return { start: isoDay(start), end };
}

function loadData() {
  const data = {};
  COLLECTIONS.forEach(c => { data[c] = store.getAll(c) || []; });
  return data;
}

export function renderReports(container, params) {
  const activeReport = (params && params.tab) || 'overview';
  const filters = emptyFilters();
  let activePreset = 'all';

  function render() {
    const data = loadData();
    const r = buildReport(data, filters);
    const assetTypes = [...new Set(data.assets.map(a => a.type).filter(Boolean))].sort();
    const staff = data.technicians.filter(t => !t.deactivated && t.role !== 'customer');
    const option = (value, label, selected) => `<option value="${escapeHTML(String(value))}" ${String(selected) === String(value) ? 'selected' : ''}>${escapeHTML(label)}</option>`;

    container.innerHTML = `
      <div class="page-header">
        <h1>Reports & Analytics</h1>
        <div class="page-header-actions">
          <button class="btn btn-secondary" id="btn-export-csv" data-tooltip="Export this report's table to CSV" data-tooltip-pos="left"><span class="material-icons-outlined">download</span> Export CSV</button>
        </div>
      </div>

      <div class="card" style="margin-bottom:var(--space-md);">
        <div class="card-body report-filters">
          <div class="report-filter-group">
            <span class="report-filter-label">Date range</span>
            <input type="date" class="form-input report-filter-input" id="global-filter-start" value="${escapeHTML(filters.start)}" aria-label="From" />
            <span class="report-filter-sep">to</span>
            <input type="date" class="form-input report-filter-input" id="global-filter-end" value="${escapeHTML(filters.end)}" aria-label="To" />
          </div>
          <div class="report-filter-group">
            ${PRESETS.map(p => `<button class="btn btn-preset ${activePreset === p.id ? 'active' : ''}" data-preset="${p.id}">${p.label}</button>`).join('')}
          </div>
          <div class="report-filter-group">
            <select class="form-input report-filter-input" data-filter="technicianId" aria-label="Technician">
              ${option('All', 'All technicians', filters.technicianId)}
              ${staff.map(t => option(t.id, t.name, filters.technicianId)).join('')}
            </select>
            <select class="form-input report-filter-input" data-filter="customerId" aria-label="Customer">
              ${option('All', 'All customers', filters.customerId)}
              ${data.customers.map(c => option(c.id, c.company || `${c.firstName || ''} ${c.lastName || ''}`.trim() || 'Customer', filters.customerId)).join('')}
            </select>
            ${assetTypes.length ? `
            <select class="form-input report-filter-input" data-filter="assetType" aria-label="Asset type">
              ${option('All', 'All asset types', filters.assetType)}
              ${assetTypes.map(t => option(t, t, filters.assetType)).join('')}
            </select>` : ''}
          </div>
        </div>
      </div>

      <div id="report-content"></div>
    `;

    container.querySelector('#report-content').innerHTML = renderReport(activeReport, r);
    bindEvents(r);
  }

  function bindEvents(r) {
    container.querySelector('#btn-export-csv')?.addEventListener('click', () => exportCSV(activeReport, r));

    container.querySelector('#global-filter-start')?.addEventListener('change', (e) => {
      filters.start = e.target.value;
      activePreset = null;
      render();
    });
    container.querySelector('#global-filter-end')?.addEventListener('change', (e) => {
      filters.end = e.target.value;
      activePreset = null;
      render();
    });
    container.querySelectorAll('[data-filter]').forEach(sel => {
      sel.addEventListener('change', (e) => {
        filters[e.target.dataset.filter] = e.target.value;
        render();
      });
    });
    container.querySelectorAll('.btn-preset').forEach(btn => {
      btn.addEventListener('click', (e) => {
        activePreset = e.currentTarget.dataset.preset;
        Object.assign(filters, presetDates(activePreset));
        render();
      });
    });
  }

  render();
}

function renderReport(id, r) {
  switch (id) {
    case 'overview': return renderOverviewReport(r);
    case 'revenue': return renderRevenueReport(r);
    case 'jobs': return renderJobsReport(r);
    case 'job_costing': return renderJobCostingReport(r);
    case 'technicians': return renderTechniciansReport(r);
    case 'timesheets_labor': return renderTimesheetsLaborReport(r);
    case 'assets_maintenance': return renderAssetsMaintenanceReport(r);
    case 'customers': return renderCustomersReport(r);
    case 'inventory': return renderInventoryReport(r);
    default: return '<div class="text-secondary">Select a report to view</div>';
  }
}

// ── Export ──────────────────────────────────────────────────────────────────

const jobLabel = (job, id) => (job && job.number) || id;

function csvFor(id, r) {
  const d = r.scoped;
  switch (id) {
    case 'overview':
    case 'revenue':
      return toCsv(['Invoice #', 'Customer', 'Status', 'Subtotal (ex GST)', 'Total', 'Issue date', 'Due date'],
        r.money.issued.map(i => [i.number, i.customerName, i.status, Number(i.subtotal) || 0, Number(i.total) || 0, i.issueDate || '', i.dueDate || '']));
    case 'jobs':
      return toCsv(['Job #', 'Title', 'Customer', 'Technician', 'Status', 'Completed', 'Hours logged'],
        r.jobs.completed.map(j => {
          const done = toDate(r.jobs.completedAt(j));
          return [j.number, j.title, j.customerName, j.technicianName || '', j.status, done ? isoDay(done) : '', r.jobs.hoursByJob.get(String(j.id)) || 0];
        }));
    case 'job_costing':
      return toCsv(['Job #', 'Customer', 'Hours', 'Revenue (ex GST)', 'Labour', 'Materials', 'Purchases', 'Cost', 'Profit', 'Margin %'],
        r.profit.jobs.map(j => [jobLabel(j.job, j.jobId), j.job?.customerName || '', j.hours, j.revenue,
          j.known ? j.labour : '', j.known ? j.materials : '', j.known ? j.purchases : '', j.known ? j.cost : '',
          j.known ? j.profit : '', j.margin != null ? j.margin * 100 : 'Not costed']));
    case 'technicians':
      return toCsv(['Name', 'Role', 'Jobs completed', 'Hours logged', 'Invoiced (shared)'],
        r.team.map(t => [t.name, t.role, t.jobsCompleted, t.hours, t.invoiced]));
    case 'timesheets_labor':
      return toCsv(['Technician', 'Role', 'Hours logged', 'Hours on jobs', 'Share on jobs %', 'Labour cost', 'Hours with no pay rate'],
        r.team.map(t => [t.name, t.role, t.hours, t.billableHours, t.billableShare != null ? t.billableShare * 100 : '', t.labourCost, t.unratedHours]));
    case 'assets_maintenance':
      return toCsv(['Asset', 'Serial', 'Customer', 'Plan', 'Frequency', 'Next service', 'Priority (1-10)', 'Service cost'],
        d.maintenancePlans.map(p => {
          const asset = d.assets.find(a => a.id === p.assetId);
          return [p.assetName || '', asset?.serial || '', p.customerName || '', p.name || '', p.frequency || 'Meter-Based', p.nextServiceDate || p.nextDue || '', p.priority || 5, assetServiceCost(asset)];
        }));
    case 'customers':
      return toCsv(['Company', 'First name', 'Last name', 'Email', 'Phone', 'Status', 'Invoiced in range (ex GST)'],
        d.customers.map(c => [c.company, c.firstName, c.lastName, c.email, c.phone, c.status, r.customers.revenueById.get(String(c.id)) || 0]));
    case 'inventory':
      return toCsv(['Name', 'SKU', 'Category', 'Quantity', 'Cost price', 'Sell price', 'Location', 'Supplier'],
        d.stock.map(i => [i.name, i.sku, i.category, Number(i.quantity) || 0, Number(i.costPrice) || 0, Number(i.unitPrice) || 0, i.location, i.supplier]));
    default:
      return '';
  }
}

function exportCSV(id, r) {
  const csv = csvFor(id, r);
  if (!csv) return;
  const blob = new Blob([csv], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `relay_${id}_report.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

// ── Cache & Insights Engine ────────────────────────────────────────────────
const cachedAIInsights = {};

// Insights have four possible sources: the Cloud AI ('live'), the on-device
// rule engine in a local workspace ('local'), that same rule engine standing
// in for an AI call that failed ('offline'), and the rule engine filling the
// panel in demo mode ('demo'). Only 'live' is a real AI response, so only
// 'live' may claim the AI branding.
function insightsCopy(source) {
  if (source === 'demo') {
    return { title: 'RELAY Insights', badgeLabel: 'Demo sample', badgeClass: 'badge-neutral', borderColor: 'var(--color-primary-light)' };
  }
  if (source === 'offline') {
    return { title: 'RELAY AI Insights', badgeLabel: 'RELAY Offline', badgeClass: 'badge-danger', borderColor: 'var(--color-danger-bg)' };
  }
  if (source === 'live') {
    return { title: 'RELAY AI Insights', badgeLabel: 'RELAY Live', badgeClass: 'badge-success', borderColor: 'var(--color-primary-light)' };
  }
  return { title: 'RELAY Insights', badgeLabel: 'RELAY Local', badgeClass: 'badge-neutral', borderColor: 'var(--color-primary-light)' };
}

// The panel asks the AI on every report view, unprompted. The demo simulates a
// Cloud account but must not spend AI on that, so it gets the rule engine's
// insights, built from the demo data, instead.
export function insightsUseAI() {
  return isCloudUser() && !store.demoMode;
}

function renderAIInsightsPanel(reportId, r) {
  const containerId = `ai-insights-${reportId}`;
  const statsSummary = getStatsSummaryText(reportId, r);
  const cacheKey = `${reportId}_${statsSummary}`;

  if (cachedAIInsights[cacheKey]) {
    return `<div class="card" id="${containerId}" style="margin-bottom:var(--space-lg);">${cachedAIInsights[cacheKey]}</div>`;
  }

  setTimeout(() => {
    fetchAIInsights(reportId, r, statsSummary, cacheKey);
  }, 100);

  // Only a Cloud workspace makes a real AI call, so only Cloud gets the
  // "Analyzing..." pending state; a local workspace and the demo resolve from rules.
  const cloud = insightsUseAI();
  const copy = insightsCopy(cloud ? 'live' : (store.demoMode ? 'demo' : 'local'));

  return `
    <style>
      @keyframes pulse {
        0% { opacity: 0.6; }
        50% { opacity: 1; }
        100% { opacity: 0.6; }
      }
    </style>
    <div class="card" id="${containerId}" style="margin-bottom:var(--space-lg); border: 1px solid var(--color-primary-light);">
      <div class="card-body" style="padding:16px 20px;">
        <div style="display:flex; align-items:center; gap:8px; margin-bottom:12px;">
          <span class="material-icons-outlined" style="color:var(--color-primary); animation: pulse 2s infinite;">psychology</span>
          <h5 style="margin:0; font-weight:600; color:var(--text-primary);">${escapeHTML(copy.title)}</h5>
          <span class="badge ${copy.badgeClass}" style="font-size:10px; margin-left:auto;">${cloud ? 'Analyzing...' : copy.badgeLabel}</span>
        </div>
        <div style="display:flex; flex-direction:column; gap:8px;">
          <div style="height:12px; background:var(--border-color); border-radius:4px; width:70%; animation: pulse 1.5s infinite;"></div>
          <div style="height:12px; background:var(--border-color); border-radius:4px; width:90%; animation: pulse 1.5s infinite;"></div>
          <div style="height:12px; background:var(--border-color); border-radius:4px; width:50%; animation: pulse 1.5s infinite;"></div>
        </div>
      </div>
    </div>
  `;
}

const INSIGHTS_PROMPT = `You are an expert business analyst and operational co-pilot for a field service management agency.
Analyze the provided summary report metrics and generate exactly 3 to 5 grounded, specific, non-generic observations tied to real numbers in the dataset.
Never write generic platitudes ("business is doing well!"), never fabricate benchmarks, and never present advice as certain facts.
All money figures are GST-exclusive. Revenue is what was invoiced in the date range; profit is invoiced revenue less actual job cost (labour, materials and purchase orders) on the jobs that could be costed.

Follow these Global Rules:
1. Every insight format: headline (short, specific, numbers-first), detail (pattern and why it matters -> what -> so what), action (one concrete next step -> now what).
2. Ground in real data only. Never invent benchmarks, percentages, or comparisons. If there is not enough historical job data (e.g. <5 jobs), do NOT output generic placeholders like "not enough data". Instead, celebrate their early setup progress (e.g. company profile creation, first technician registrations, customers added, or first quote/job logs), highlight what they have accomplished so far, and give positive, encouraging operational guidance to help them build business momentum!
3. Confidence scales with sample size. Set confidence to "high", "medium", or "low" based on data density.
4. No individual blame. Frame staffing/productivity at a team/role level or growth-framed, never negative individual callouts.
5. No authoritative compliance, legal, or tax advice. Use soft disclaimers ("worth checking against Fair Work obligations").
6. No customer profiling on protected characteristics. Churn/risk signals must be behavior-only (payment latency, cadence drop-offs).
7. Balanced, surface both wins and risks.
8. Use plain, specific, non-corporate language.

Per-Report Specifications:
- overview: The single biggest positive and negative signal in the figures. Limit to 3-4 insights.
- revenue: Margin, the split of cost between labour and materials, monthly pattern. Never suggest a specific price increase number.
- jobs: Completion volume, time logged per job, jobs waiting to be invoiced.
- job_costing: Jobs with thin or negative margins, jobs that could not be costed and why, labour vs materials cost.
- technicians: Jobs completed and time on jobs at team/role level. Coach, don't blame or rank.
- timesheets_labor: Share of hours on jobs, labour cost, hours missing a pay rate, soft disclaimers.
- assets_maintenance: Overdue maintenance, assets with the highest service cost, active agreements.
- customers: Revenue concentration, repeat customers, new customers.
- inventory: Low stock, capital tied up in stock.

Output Format:
You MUST return a raw JSON array of objects (no markdown, no \`\`\`json blocks). Each object has exactly these keys:
- "headline" (string, short, specific, numbers-first)
- "detail" (string, what -> so what)
- "action" (string, now what - one concrete next step)
- "confidence" (string, "high" | "medium" | "low")`;

async function fetchAIInsights(reportId, r, statsSummary, cacheKey) {
  const panel = document.getElementById(`ai-insights-${reportId}`);
  if (!panel) return;

  let insightsHTML = '';

  if (insightsUseAI()) {
    try {
      let reply = await dispatchChat([
        { role: 'system', content: INSIGHTS_PROMPT },
        { role: 'user', content: `Active Report: ${reportId}\nFiltered Metrics:\n${statsSummary}` },
      ]);
      if (reply.includes('```')) {
        reply = reply.replace(/```json/g, '').replace(/```/g, '').trim();
      }
      insightsHTML = renderInsightsListHTML(JSON.parse(reply), 'live');
    } catch (err) {
      console.error('AI Insights parsing or fetch error:', err);
      insightsHTML = renderInsightsListHTML(getLocalInsights(reportId, r), 'offline');
    }
  } else {
    insightsHTML = renderInsightsListHTML(getLocalInsights(reportId, r), store.demoMode ? 'demo' : 'local');
  }

  cachedAIInsights[cacheKey] = insightsHTML;
  panel.style.border = '';
  panel.innerHTML = insightsHTML;
}

const money = (n) => `$${(Number(n) || 0).toLocaleString('en-AU', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
const wholeMoney = (n) => `$${Math.round(Number(n) || 0).toLocaleString('en-AU')}`;
const pct = (v, digits = 1) => (v == null ? '—' : `${(v * 100).toFixed(digits)}%`);
const hrs = (n, digits = 1) => `${(Number(n) || 0).toFixed(digits)} hrs`;

function getStatsSummaryText(reportId, r) {
  const d = r.scoped;
  const settings = store.getSettings();
  let summary = `Workspace / Company Profile Name: ${settings.name || 'Company Name'}\n`;
  summary += `Date range: ${r.range.start.toDateString()} to ${new Date(r.range.end - 1).toDateString()}\n`;
  summary += `Technicians: ${d.technicians.length}\nCustomers: ${d.customers.length}\nAssets: ${d.assets.length}\n`;
  summary += `Quotes: ${d.quotes.length}\nJobs: ${d.jobs.length}\nInvoices: ${d.invoices.length}\nLeads: ${d.leads.length}\n\n`;

  if (reportId === 'overview' || reportId === 'revenue') {
    summary += `Revenue invoiced: ${money(r.money.revenue)} across ${r.money.invoiceCount} invoices\n`;
    summary += `Payments received: ${money(r.money.received)}\n`;
    summary += `Outstanding: ${money(r.money.outstanding)} on ${r.money.outstandingCount} invoices, of which overdue ${money(r.money.overdue)}\n`;
    summary += `Gross profit: ${money(r.profit.profit)} on ${r.profit.jobsKnown} of ${r.profit.jobsTotal} invoiced jobs costed (margin ${pct(r.profit.margin)})\n`;
    summary += `Cost on costed jobs: labour ${money(r.profit.labour)}, materials ${money(r.profit.materials)}, purchase orders ${money(r.profit.purchases)}\n`;
    summary += `Quote win rate: ${pct(r.sales.winRate)} of ${r.sales.quotesDecided} decided\n`;
    summary += `Lead conversion: ${pct(r.sales.leadConversion)} of ${r.sales.leadsClosed} closed\n`;
    if (reportId === 'revenue') {
      summary += `Monthly revenue: ${r.monthly.map(m => `${m.label} ${wholeMoney(m.revenue)}`).join(', ')}\n`;
    }
  } else if (reportId === 'jobs' || reportId === 'job_costing') {
    summary += `Jobs completed: ${r.jobs.completed.length}\nJobs created: ${r.jobs.created.length}\nActive jobs now: ${r.jobs.active}\n`;
    summary += `Completed jobs waiting to be invoiced: ${r.jobs.readyToInvoice}\n`;
    summary += `Average hours logged per completed job: ${r.jobs.averageHours == null ? 'none logged' : r.jobs.averageHours.toFixed(1)}\n`;
    summary += `Invoiced jobs: ${r.profit.jobsTotal}, costed: ${r.profit.jobsKnown}\n`;
    summary += `Revenue on costed jobs: ${money(r.profit.revenue)}, cost ${money(r.profit.cost)}, margin ${pct(r.profit.margin)}\n`;
    const losing = r.profit.jobs.filter(j => j.known && j.profit < 0).length;
    summary += `Costed jobs with a loss: ${losing}\n`;
  } else if (reportId === 'timesheets_labor' || reportId === 'technicians') {
    summary += `Hours logged: ${r.labour.hours.toFixed(1)}\nHours on jobs: ${r.labour.billableHours.toFixed(1)} (${pct(r.labour.billableShare)})\n`;
    summary += `Labour cost: ${money(r.labour.cost)}\nHours with no pay rate: ${r.labour.unratedHours.toFixed(1)}\n`;
    summary += `Jobs completed: ${r.jobs.completed.length}\n`;
    // Grouped by role to keep it aggregate (no individual blame).
    const byRole = {};
    r.team.forEach(t => {
      const role = t.role || 'Field Technician';
      const g = byRole[role] || (byRole[role] = { count: 0, completed: 0, hours: 0, invoiced: 0 });
      g.count++; g.completed += t.jobsCompleted; g.hours += t.hours; g.invoiced += t.invoiced;
    });
    Object.entries(byRole).forEach(([role, g]) => {
      summary += `Role group: ${role} (${g.count} people) -> jobs completed ${g.completed}, hours ${g.hours.toFixed(1)}, invoiced ${money(g.invoiced)}\n`;
    });
  } else if (reportId === 'customers') {
    summary += `Active customers: ${r.customers.active}\nNew customers in range: ${r.customers.new}\n`;
    summary += `Customers invoiced in range: ${r.customers.invoiced}, of which invoiced more than once: ${r.customers.repeat}\n`;
    const top = r.customers.top[0];
    if (top) summary += `Largest customer share of revenue: ${pct(top.share)}\n`;
    summary += `Lead conversion: ${pct(r.sales.leadConversion)}\nQuote win rate: ${pct(r.sales.winRate)}\n`;
  } else if (reportId === 'assets_maintenance') {
    summary += `Active service plans: ${d.maintenancePlans.filter(p => p.status === 'Active').length}\n`;
    summary += `Total service cost logged: ${money(d.assets.reduce((s, a) => s + assetServiceCost(a), 0))}\n`;
  } else if (reportId === 'inventory') {
    summary += `Stock lines: ${d.stock.length}\nBelow reorder level: ${lowStock(d.stock).length}\nStock value at cost: ${money(stockValue(d.stock))}\n`;
  }
  return summary;
}

function cleanString(str) {
  if (!str) return '';
  let formatted = str.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
  formatted = formatted.replace(/\*/g, '');
  return formatted;
}

function renderInsightsListHTML(insights, source) {
  const { title, badgeLabel, badgeClass, borderColor } = insightsCopy(source);
  const items = (Array.isArray(insights) ? insights : []).slice(0, 5);

  if (items.length === 0) {
    items.push({
      headline: 'Nothing stands out',
      detail: 'No figure in this report needs attention right now.',
      action: 'Check back after the next batch of jobs is invoiced.',
      confidence: 'medium',
    });
  }

  const confidenceColors = {
    high: { bg: 'rgba(16, 185, 129, 0.1)', text: 'var(--color-success)', border: 'rgba(16, 185, 129, 0.2)' },
    medium: { bg: 'rgba(245, 158, 11, 0.1)', text: 'var(--color-warning)', border: 'rgba(245, 158, 11, 0.2)' },
    low: { bg: 'rgba(239, 68, 68, 0.1)', text: 'var(--color-danger)', border: 'rgba(239, 68, 68, 0.2)' }
  };

  return `
    <div class="card-body" style="padding:16px 20px; border: 1px solid ${borderColor}">
      <div style="display:flex; align-items:center; gap:8px; margin-bottom:16px;">
        <span class="material-icons-outlined" style="color:var(--color-primary)">psychology</span>
        <h5 style="margin:0; font-weight:600; color:var(--text-primary);">${title}</h5>
        <span class="badge ${badgeClass}" style="font-size:10px; margin-left:auto;">${badgeLabel}</span>
      </div>

      <div style="display:flex; flex-direction:column; gap:16px;">
        ${items.map(item => {
          const conf = String(item.confidence || 'high').toLowerCase();
          const colors = confidenceColors[conf] || confidenceColors.high;
          return `
            <div style="display:flex; align-items:flex-start; gap:12px; padding-bottom:12px; border-bottom:1px solid var(--border-color);">
              <span style="font-size:18px; color:var(--color-primary); line-height:1; padding-top:2px;">•</span>
              <div style="flex:1;">
                <div style="display:flex; align-items:center; gap:8px; flex-wrap:wrap; margin-bottom:4px;">
                  <span style="font-weight:700; color:var(--text-primary); font-size:13px;">${cleanString(escapeHTML(item.headline))}</span>
                  <span style="font-size:9px; font-weight:600; text-transform:uppercase; padding:2px 6px; border-radius:4px; background:${colors.bg}; color:${colors.text}; border:1px solid ${colors.border};">
                    ${escapeHTML(conf)} confidence
                  </span>
                </div>
                <div style="font-size:12px; color:var(--text-secondary); line-height:1.5; margin-bottom:4px;">
                  ${cleanString(escapeHTML(item.detail))}
                </div>
                <div style="font-size:11px; color:var(--text-tertiary);">
                  <strong style="color:var(--color-primary)">Now what:</strong> ${cleanString(escapeHTML(item.action))}
                </div>
              </div>
            </div>
          `;
        }).join('')}
      </div>
    </div>
  `;
}

// On-device insights. They state what the figures show; they don't measure the
// business against targets nobody set.
function getLocalInsights(reportId, r) {
  const d = r.scoped;
  if (d.jobs.length < 5) {
    const settings = store.getSettings();
    const insights = [{
      headline: `Welcome to RELAY, ${settings.name || 'your company'}!`,
      detail: 'Your workspace is set up and ready to run dispatch.',
      action: 'Head to Settings to set your labour rates and material markups.',
      confidence: 'high',
    }];
    insights.push(d.technicians.length > 0 ? {
      headline: `${d.technicians.length} people on the team`,
      detail: 'Your field team is added and ready for scheduling.',
      action: 'Assign a job to your team from the Jobs page or the calendar.',
      confidence: 'high',
    } : {
      headline: 'Add your first technician',
      detail: "With nobody on the team you can't assign jobs or track timesheets yet.",
      action: 'Go to Admin -> People to add your field team.',
      confidence: 'high',
    });
    insights.push(d.customers.length > 0 ? {
      headline: `${d.customers.length} customers added`,
      detail: 'Your customer list is starting to grow.',
      action: 'Create a quote or job for one of your customers.',
      confidence: 'high',
    } : {
      headline: 'Add your first customer',
      detail: 'Customers are where quotes and jobs start.',
      action: 'Go to People -> Customers -> Add Customer.',
      confidence: 'high',
    });
    if (d.quotes.length > 0) insights.push({ headline: `${d.quotes.length} quotes prepared`, detail: 'Good progress bidding for new work.', action: 'Follow up on sent quotes to win approval.', confidence: 'high' });
    if (d.jobs.length > 0) insights.push({ headline: `${d.jobs.length} jobs logged`, detail: 'Your first jobs are in the system.', action: "Move active jobs to 'Scheduled' or 'In Progress' as work begins.", confidence: 'high' });
    return insights;
  }

  const insights = [];
  if (reportId === 'overview' || reportId === 'revenue') {
    if (r.money.overdue > 0) {
      insights.push({
        headline: `${wholeMoney(r.money.overdue)} overdue on ${r.money.overdueCount} invoices`,
        detail: `Of ${wholeMoney(r.money.outstanding)} still owed, this part is past its due date.`,
        action: 'Open the overdue invoices and send reminders.',
        confidence: 'high',
      });
    }
    if (r.profit.margin != null) {
      insights.push({
        headline: `${pct(r.profit.margin)} gross margin on ${r.profit.jobsKnown} costed jobs`,
        detail: `${wholeMoney(r.profit.revenue)} invoiced against ${wholeMoney(r.profit.cost)} of labour, materials and purchases.`,
        action: 'Check Job Costing for the jobs pulling the margin down.',
        confidence: r.profit.jobsKnown >= 10 ? 'high' : 'medium',
      });
    }
    if (r.profit.jobsTotal > r.profit.jobsKnown) {
      insights.push({
        headline: `${r.profit.jobsTotal - r.profit.jobsKnown} invoiced jobs couldn't be costed`,
        detail: "They have no logged time or materials, or time logged by someone with no pay rate, so they're left out of profit.",
        action: 'Add pay rates in People and log time against jobs.',
        confidence: 'high',
      });
    }
    if (r.sales.winRate != null) {
      insights.push({
        headline: `${pct(r.sales.winRate, 0)} of ${r.sales.quotesDecided} decided quotes won`,
        detail: 'Won quotes include those already converted to jobs.',
        action: 'Follow up on quotes still awaiting an answer.',
        confidence: r.sales.quotesDecided >= 10 ? 'high' : 'low',
      });
    }
  } else if (reportId === 'jobs' || reportId === 'job_costing') {
    const losing = r.profit.jobs.filter(j => j.known && j.profit < 0);
    if (losing.length) {
      insights.push({
        headline: `${losing.length} costed jobs lost money`,
        detail: `Together they cost ${wholeMoney(-losing.reduce((s, j) => s + j.profit, 0))} more than they invoiced.`,
        action: 'Open the red rows in Job Costing to see whether labour or materials ran over.',
        confidence: 'high',
      });
    }
    const overrun = r.jobs.completed.filter(j => (j.estimatedHours || 0) > 0 && (r.jobs.hoursByJob.get(String(j.id)) || 0) > j.estimatedHours * 1.1);
    if (overrun.length) {
      insights.push({
        headline: `${overrun.length} completed jobs ran over their estimated hours`,
        detail: 'Time logged was more than 10% above the estimate.',
        action: 'Compare these jobs with their quotes before the next similar job.',
        confidence: 'medium',
      });
    }
    if (r.jobs.readyToInvoice > 0) {
      insights.push({
        headline: `${r.jobs.readyToInvoice} completed jobs not invoiced yet`,
        detail: "Finished work that hasn't been billed.",
        action: 'Invoice them from the Jobs list.',
        confidence: 'high',
      });
    }
  } else if (reportId === 'timesheets_labor' || reportId === 'technicians') {
    if (r.labour.hours > 0 && r.labour.billableHours >= r.labour.hours) {
      insights.push({
        headline: `All ${r.labour.hours.toFixed(0)} logged hours were on jobs`,
        detail: 'Every timesheet in this range is logged against a job, so job costs include all of it.',
        action: 'Keep logging time to jobs as it happens.',
        confidence: 'high',
      });
    } else if (r.labour.hours > 0) {
      insights.push({
        headline: `${pct(r.labour.billableShare)} of ${r.labour.hours.toFixed(0)} logged hours were on jobs`,
        detail: `${(r.labour.hours - r.labour.billableHours).toFixed(1)} hours weren't logged against a job.`,
        action: 'Check whether that time was travel, yard or admin, and log it to jobs where it belongs.',
        confidence: 'high',
      });
    }
    if (r.labour.unratedHours > 0) {
      insights.push({
        headline: `${r.labour.unratedHours.toFixed(1)} hours have no pay rate`,
        detail: "These hours aren't in labour cost, so cost and margins read low.",
        action: 'Add pay rates in People.',
        confidence: 'high',
      });
    }
  } else if (reportId === 'customers') {
    const top = r.customers.top[0];
    if (top) {
      insights.push({
        headline: `Largest customer is ${pct(top.share, 0)} of revenue`,
        detail: `${top.name || 'One customer'} invoiced ${wholeMoney(top.revenue)} in this range.`,
        action: 'Keep an eye on how much the business depends on one account.',
        confidence: r.customers.invoiced >= 5 ? 'high' : 'low',
      });
    }
    if (r.customers.invoiced > 0) {
      insights.push({
        headline: `${r.customers.repeat} of ${r.customers.invoiced} invoiced customers are repeat`,
        detail: 'Repeat customers have been invoiced more than once.',
        action: 'Offer maintenance agreements to one-off customers.',
        confidence: 'medium',
      });
    }
  } else if (reportId === 'assets_maintenance') {
    const costs = d.assets.map(a => [a.name, assetServiceCost(a)]).filter(([, c]) => c > 0).sort((a, b) => b[1] - a[1]);
    if (costs.length) {
      insights.push({
        headline: `Highest service cost: ${costs[0][0]} (${wholeMoney(costs[0][1])})`,
        detail: 'This asset has the most service cost logged against it.',
        action: 'Check whether replacing it would cost less than repairing it.',
        confidence: 'medium',
      });
    }
    const active = d.maintenancePlans.filter(p => p.status === 'Active').length;
    if (active) {
      insights.push({ headline: `${active} active service agreements`, detail: 'Each has a next-service date to keep.', action: 'Review the due dates weekly.', confidence: 'high' });
    }
  } else if (reportId === 'inventory') {
    const low = lowStock(d.stock);
    insights.push(low.length ? {
      headline: `${low.length} stock items at or below reorder level`,
      detail: 'Jobs that need these parts could be held up.',
      action: 'Raise purchase orders for the low items.',
      confidence: 'high',
    } : {
      headline: 'All stock above reorder levels',
      detail: 'Nothing needs reordering right now.',
      action: 'Do a routine count to confirm the numbers.',
      confidence: 'high',
    });
    insights.push({ headline: `${wholeMoney(stockValue(d.stock))} held in stock at cost`, detail: 'Money tied up on the shelf.', action: 'Look for slow-moving lines to run down.', confidence: 'high' });
  }
  return insights.slice(0, 5);
}

// ── Helper rendering functions ──────────────────────────────────────────────

// Reports' own KPI colours, mapped onto the shared stat card's chip tones so
// every KPI in the app renders through one component.
const KPI_TONE = { green: 'success', blue: 'primary', orange: 'warning', red: 'danger' };

function kpi(label, value, icon, color, sub = '') {
  return statCard({ label, value, icon, tone: KPI_TONE[color] || 'neutral', sub });
}

function miniStat(label, value, icon) {
  return `
    <div class="card">
      <div class="card-body" style="display:flex;align-items:center;gap:12px;padding:var(--space-base)">
        <span class="material-icons-outlined" style="font-size:24px;color:var(--text-tertiary)">${icon}</span>
        <div>
          <div style="font-size:var(--font-size-xl);font-weight:700">${escapeHTML(String(value))}</div>
          <div style="font-size:var(--font-size-xs);color:var(--text-tertiary)">${escapeHTML(label)}</div>
        </div>
      </div>
    </div>
  `;
}

// Horizontal bars. `data` is [[label, value], …] in display order; `format`
// renders the value.
function barChart(data, colorMap = {}, defaultColor = '#1B6DE0', format = (v) => String(v)) {
  const entries = Array.isArray(data) ? data : Object.entries(data);
  if (entries.length === 0) return '<div class="text-secondary text-sm">No data available</div>';
  const max = Math.max(...entries.map(([, v]) => v));

  return entries.map(([label, value]) => {
    const color = colorMap[label] || defaultColor;
    const width = max > 0 ? Math.max(0, value) / max * 100 : 0;
    return `
      <div style="display:flex;align-items:center;gap:12px;margin-bottom:10px">
        <div style="width:100px;font-size:var(--font-size-sm);color:var(--text-secondary);text-align:right;flex-shrink:0">${escapeHTML(label)}</div>
        <div style="flex:1;height:24px;background:var(--border-color);border-radius:4px;overflow:hidden">
          <div style="height:100%;width:${width}%;background:${escapeHTML(color)};border-radius:4px;transition:width 0.5s ease"></div>
        </div>
        <div style="width:64px;font-size:var(--font-size-sm);font-weight:600;text-align:right">${escapeHTML(format(value))}</div>
      </div>
    `;
  }).join('');
}

function progressBar(label, value, max, color) {
  const width = max > 0 ? Math.max(0, value) / max * 100 : 0;
  return `
    <div style="margin-bottom:16px">
      <div style="display:flex;justify-content:space-between;margin-bottom:4px">
        <span style="font-size:var(--font-size-sm);font-weight:500">${escapeHTML(label)}</span>
        <span style="font-size:var(--font-size-sm);font-weight:600">${money(value)}</span>
      </div>
      <div style="height:8px;background:var(--border-color);border-radius:4px;overflow:hidden">
        <div style="height:100%;width:${width}%;background:${escapeHTML(color)};border-radius:4px;transition:width 0.5s ease"></div>
      </div>
    </div>
  `;
}

const sortedEntries = (obj) => Object.entries(obj).sort((a, b) => b[1] - a[1]);
const costedSub = (p) => (p.jobsTotal > p.jobsKnown ? `${p.jobsKnown} of ${p.jobsTotal} invoiced jobs costed` : '');
const jobLink = (job, id) => job ? `<a href="#/jobs/${encodeURIComponent(job.id)}" class="cell-link">${escapeHTML(job.number || job.id)}</a>` : escapeHTML(String(id));
const emptyRow = (cols, text) => `<tr><td colspan="${cols}" style="text-align:center;padding:20px" class="text-secondary">${escapeHTML(text)}</td></tr>`;

function assetServiceCost(asset) {
  return ((asset && asset.logs) || []).filter(l => l.type === 'Service').reduce((s, l) => s + (Number(l.cost) || 0), 0);
}
const lowStock = (stock) => stock.filter(i => (Number(i.quantity) || 0) <= (Number(i.reorderLevel) || 0));
const stockValue = (stock) => stock.reduce((s, i) => s + (Number(i.quantity) || 0) * (Number(i.costPrice) || 0), 0);

// ── Report Renderers ────────────────────────────────────────────────────────

function renderOverviewReport(r) {
  const d = r.scoped;
  return `
    ${renderAIInsightsPanel('overview', r)}
    <div class="grid-4" style="margin-bottom:var(--space-lg)">
      ${kpi('Revenue (ex GST)', money(r.money.revenue), 'account_balance', 'green', `${r.money.invoiceCount} invoices issued`)}
      ${kpi('Payments received', money(r.money.received), 'payments', 'blue')}
      ${kpi('Outstanding', money(r.money.outstanding), 'pending', 'orange', r.money.overdue > 0 ? `${escapeHTML(money(r.money.overdue))} overdue` : '')}
      ${kpi('Gross margin', pct(r.profit.margin), 'trending_up', 'green', escapeHTML(costedSub(r.profit)))}
    </div>
    <div class="grid-2" style="margin-bottom:var(--space-lg)">
      <div class="card">
        <div class="card-header"><h4>New jobs by status</h4></div>
        <div class="card-body">${barChart(sortedEntries(r.jobs.byStatus), JOB_STATUS_COLORS)}</div>
      </div>
      <div class="card">
        <div class="card-header"><h4>Invoices issued by status</h4></div>
        <div class="card-body">${barChart(sortedEntries(r.invoicesByStatus), DOC_STATUS_COLORS)}</div>
      </div>
    </div>
    <div class="grid-3">
      ${miniStat('Jobs completed', r.jobs.completed.length, 'build')}
      ${miniStat('Quotes sent', r.sales.quotesSent, 'request_quote')}
      ${miniStat('Quote win rate', pct(r.sales.winRate, 0), 'emoji_events')}
      ${miniStat('Lead conversion', pct(r.sales.leadConversion, 0), 'trending_up')}
      ${miniStat('Avg invoice value', r.money.averageInvoice == null ? '—' : wholeMoney(r.money.averageInvoice), 'paid')}
      ${miniStat('Stock items', `${d.stock.length} (${lowStock(d.stock).length} low)`, 'inventory_2')}
    </div>
  `;
}

function renderRevenueReport(r) {
  const p = r.profit;
  const months = r.monthly.slice(-24);
  return `
    ${renderAIInsightsPanel('revenue', r)}
    <div class="grid-4" style="margin-bottom:var(--space-lg)">
      ${kpi('Revenue (ex GST)', wholeMoney(r.money.revenue), 'account_balance', 'green', `${r.money.invoiceCount} invoices issued`)}
      ${kpi('Labour cost', wholeMoney(p.labour), 'engineering', 'blue', 'on costed jobs')}
      ${kpi('Materials and purchases', wholeMoney(p.materials + p.purchases), 'inventory_2', 'orange', 'on costed jobs')}
      ${kpi('Gross profit', wholeMoney(p.profit), 'savings', p.profit >= 0 ? 'green' : 'red', escapeHTML(costedSub(p) || `${pct(p.margin)} margin`))}
    </div>
    <div class="card" style="margin-bottom:var(--space-lg)">
      <div class="card-header"><h4>Revenue by month</h4></div>
      <div class="card-body">${barChart(months.map(m => [m.label, m.revenue]), {}, '#1B6DE0', wholeMoney)}</div>
    </div>
    <div class="card">
      <div class="card-header"><h4>Profit breakdown (costed jobs)</h4></div>
      <div class="card-body">
        ${progressBar('Revenue', p.revenue, p.revenue, '#10B981')}
        ${progressBar('Labour cost', p.labour, p.revenue, '#3B82F6')}
        ${progressBar('Material cost', p.materials, p.revenue, '#F59E0B')}
        ${progressBar('Purchase orders', p.purchases, p.revenue, '#8B5CF6')}
        ${progressBar('Gross profit', p.profit, p.revenue, p.profit >= 0 ? '#10B981' : '#EF4444')}
      </div>
    </div>
  `;
}

function renderJobsReport(r) {
  const top = r.profit.jobs.slice(0, 8);
  return `
    ${renderAIInsightsPanel('jobs', r)}
    <div class="grid-4" style="margin-bottom:var(--space-lg)">
      ${kpi('Jobs completed', r.jobs.completed.length, 'check_circle', 'green')}
      ${kpi('New jobs', r.jobs.created.length, 'build', 'blue')}
      ${kpi('Active now', r.jobs.active, 'pending', 'orange', 'scheduled, in progress or on hold')}
      ${kpi('Avg hours per job', r.jobs.averageHours == null ? '—' : r.jobs.averageHours.toFixed(1), 'schedule', 'blue', 'logged on completed jobs')}
    </div>
    <div class="card" style="margin-bottom:var(--space-lg)">
      <div class="card-header"><h4>New jobs by status</h4></div>
      <div class="card-body">${barChart(sortedEntries(r.jobs.byStatus), JOB_STATUS_COLORS)}</div>
    </div>
    <div class="card">
      <div class="card-header"><h4>Top jobs by invoiced value</h4></div>
      <div class="card-body" style="padding:0">
        <table class="data-table">
          <thead><tr><th>Job</th><th>Customer</th><th>Status</th><th style="text-align:right">Invoiced (ex GST)</th></tr></thead>
          <tbody>
            ${top.map(j => `
              <tr>
                <td class="font-medium">${jobLink(j.job, j.jobId)}</td>
                <td class="text-secondary">${escapeHTML(j.job?.customerName || '—')}</td>
                <td><span class="badge badge-neutral">${escapeHTML(j.job?.status || '—')}</span></td>
                <td style="text-align:right;font-weight:600">${wholeMoney(j.revenue)}</td>
              </tr>
            `).join('')}
            ${!top.length ? emptyRow(4, 'No jobs invoiced in this range') : ''}
          </tbody>
        </table>
      </div>
    </div>
  `;
}

const NOT_COSTED = { 'no-pay-rate': 'Time logged with no pay rate', 'no-costs': 'No time or materials logged' };

function renderJobCostingReport(r) {
  const p = r.profit;
  return `
    ${renderAIInsightsPanel('job_costing', r)}
    <div class="grid-3" style="margin-bottom:var(--space-lg)">
      ${kpi('Job cost', money(p.cost), 'engineering', 'orange', 'labour, materials and purchases')}
      ${kpi('Revenue (ex GST)', money(p.revenue), 'payments', 'green', 'on costed jobs')}
      ${kpi('Gross margin', pct(p.margin), 'trending_up', p.margin == null || p.margin >= 0.4 ? 'green' : 'orange', escapeHTML(costedSub(p)))}
    </div>
    <div class="card">
      <div class="card-header" style="display:flex; justify-content:space-between; align-items:center">
        <h4 style="margin:0">Jobs invoiced in this range</h4>
        <div style="font-size:12px; color:var(--text-tertiary)">Invoiced revenue vs actual cost</div>
      </div>
      <div class="card-body" style="padding:0; overflow-x:auto">
        <table class="data-table">
          <thead>
            <tr>
              <th>Job</th>
              <th style="text-align:right">Hrs</th>
              <th style="text-align:right">Revenue</th>
              <th style="text-align:right">Labour</th>
              <th style="text-align:right">Materials</th>
              <th style="text-align:right">Profit</th>
              <th style="text-align:right">Margin</th>
            </tr>
          </thead>
          <tbody>
            ${p.jobs.map(j => `
              <tr>
                <td class="font-medium">${jobLink(j.job, j.jobId)}</td>
                <td style="text-align:right">${j.hours.toFixed(2)}</td>
                <td style="text-align:right">${money(j.revenue)}</td>
                ${j.known ? `
                <td style="text-align:right">${money(j.labour)}</td>
                <td style="text-align:right">${money(j.materials + j.purchases)}</td>
                <td style="text-align:right;font-weight:600;color:${j.profit >= 0 ? 'var(--color-success)' : 'var(--color-danger)'}">${money(j.profit)}</td>
                <td style="text-align:right">
                  <span class="badge ${j.margin >= 0.4 ? 'badge-success' : j.margin >= 0.2 ? 'badge-warning' : 'badge-danger'}">${pct(j.margin)}</span>
                </td>` : `
                <td colspan="4" style="text-align:right" class="text-secondary">${escapeHTML(NOT_COSTED[j.reason] || 'Not costed')}</td>`}
              </tr>
            `).join('')}
            ${!p.jobs.length ? emptyRow(7, 'No jobs invoiced in this range') : ''}
          </tbody>
        </table>
      </div>
    </div>
  `;
}

function renderTechniciansReport(r) {
  const team = [...r.team].sort((a, b) => b.invoiced - a.invoiced);
  const maxInvoiced = Math.max(0, ...team.map(t => t.invoiced));
  return `
    ${renderAIInsightsPanel('technicians', r)}
    <div class="card" style="margin-bottom:var(--space-lg)">
      <div class="card-header"><h4>Technician performance</h4></div>
      <div class="card-body" style="padding:0">
        <table class="data-table">
          <thead><tr><th></th><th>Name</th><th>Role</th><th style="text-align:center">Jobs completed</th><th style="text-align:right">Hours logged</th><th style="text-align:right">Invoiced (shared)</th></tr></thead>
          <tbody>
            ${team.map(t => `
              <tr>
                <td><div style="width:8px;height:8px;border-radius:50%;background:${escapeHTML(t.color || '#3B82F6')}"></div></td>
                <td class="font-medium">${escapeHTML(t.name)}</td>
                <td class="text-secondary">${escapeHTML(t.role)}</td>
                <td style="text-align:center"><span class="badge badge-success">${t.jobsCompleted}</span></td>
                <td style="text-align:right">${t.hours.toFixed(1)}</td>
                <td style="text-align:right;font-weight:600">${money(t.invoiced)}</td>
              </tr>
            `).join('')}
            ${!team.length ? emptyRow(6, 'No technicians') : ''}
          </tbody>
        </table>
      </div>
    </div>
    <div class="card">
      <div class="card-header"><h4>Invoiced by technician</h4></div>
      <div class="card-body">
        <div style="font-size:12px;color:var(--text-tertiary);margin-bottom:12px">A job's invoice is split evenly between everyone on the job.</div>
        ${team.map(t => progressBar(t.name, t.invoiced, maxInvoiced, t.color || '#3B82F6')).join('')}
      </div>
    </div>
  `;
}

function renderTimesheetsLaborReport(r) {
  const team = [...r.team].sort((a, b) => (b.billableShare || 0) - (a.billableShare || 0));
  const shareBadge = (v) => (v == null ? '—' : `<span class="badge ${v >= 0.75 ? 'badge-success' : v >= 0.5 ? 'badge-warning' : 'badge-danger'}">${pct(v)}</span>`);
  return `
    ${renderAIInsightsPanel('timesheets_labor', r)}

    <div class="grid-4" style="margin-bottom:var(--space-lg)">
      ${kpi('Hours logged', hrs(r.labour.hours), 'schedule', 'blue')}
      ${kpi('Hours on jobs', hrs(r.labour.billableHours), 'work', 'green')}
      ${kpi('Share on jobs', pct(r.labour.billableShare), 'trending_up', (r.labour.billableShare || 0) >= 0.7 ? 'green' : 'orange')}
      ${kpi('Labour cost', money(r.labour.cost), 'payments', 'orange', r.labour.unratedHours > 0 ? `${escapeHTML(hrs(r.labour.unratedHours))} with no pay rate` : '')}
    </div>

    <div class="card" style="margin-bottom:var(--space-lg)">
      <div class="card-header"><h4>Hours and cost by technician</h4></div>
      <div class="card-body" style="padding:0">
        <table class="data-table">
          <thead>
            <tr>
              <th>Technician</th>
              <th>Role</th>
              <th style="text-align:right">Logged hrs</th>
              <th style="text-align:right">On jobs</th>
              <th style="text-align:right">Labour cost</th>
            </tr>
          </thead>
          <tbody>
            ${team.map(t => `
              <tr>
                <td class="font-medium">${escapeHTML(t.name)}</td>
                <td class="text-secondary">${escapeHTML(t.role)}</td>
                <td style="text-align:right; font-weight:600">${t.hours.toFixed(2)}</td>
                <td style="text-align:right">${shareBadge(t.billableShare)}</td>
                <td style="text-align:right; font-weight:600">${money(t.labourCost)}</td>
              </tr>
            `).join('')}
            ${!team.length ? emptyRow(5, 'No timesheet records logged') : ''}
          </tbody>
        </table>
      </div>
    </div>

    <div class="card">
      <div class="card-header"><h4>Share of hours on jobs</h4></div>
      <div class="card-body">
        ${team.filter(t => t.billableShare != null).map(t => `
          <div style="margin-bottom:16px">
            <div style="display:flex;justify-content:space-between;margin-bottom:4px">
              <span style="font-size:var(--font-size-sm);font-weight:500">${escapeHTML(t.name)} <span style="font-size:var(--font-size-xs);color:var(--text-tertiary)">(${escapeHTML(t.role)})</span></span>
              <span style="font-size:var(--font-size-sm);font-weight:600">${pct(t.billableShare)}</span>
            </div>
            <div style="height:8px;background:var(--border-color);border-radius:4px;overflow:hidden">
              <div style="height:100%;width:${t.billableShare * 100}%;background:${escapeHTML(t.color || '#3B82F6')};border-radius:4px;transition:width 0.5s ease"></div>
            </div>
          </div>
        `).join('') || '<div class="text-secondary text-sm">No hours logged in this range</div>'}
      </div>
    </div>
  `;
}

function renderAssetsMaintenanceReport(r) {
  const d = r.scoped;
  const assetCosts = d.assets.map(a => [a.name, assetServiceCost(a)]).filter(([, c]) => c > 0).sort((a, b) => b[1] - a[1]);
  const totalMaintCost = assetCosts.reduce((s, [, c]) => s + c, 0);

  const serviceLogs = [];
  d.assets.forEach(a => {
    (a.logs || []).forEach(l => {
      if (l.type === 'Service') serviceLogs.push({ ...l, asset: a });
    });
  });
  serviceLogs.sort((a, b) => new Date(b.date) - new Date(a.date));
  const displayLogs = serviceLogs.slice(0, 8);
  const activePlans = d.maintenancePlans.filter(p => p.status === 'Active');
  const assetLink = (id, name) => id ? `<a href="#/assets/${encodeURIComponent(id)}" class="cell-link">${escapeHTML(name || '—')}</a>` : escapeHTML(name || '—');

  return `
    ${renderAIInsightsPanel('assets_maintenance', r)}

    <div class="grid-4" style="margin-bottom:var(--space-lg)">
      ${kpi('Total assets', d.assets.length, 'inventory_2', 'blue')}
      ${kpi('Active agreements', activePlans.length, 'history_edu', 'green')}
      ${kpi('Service actions logged', serviceLogs.length, 'engineering', 'orange')}
      ${kpi('Total service cost', wholeMoney(totalMaintCost), 'savings', 'green')}
    </div>

    <div class="grid-2" style="margin-bottom:var(--space-lg);">
      <div class="card">
        <div class="card-header"><h4>Maintenance agreements</h4></div>
        <div class="card-body" style="padding:0; overflow-y:auto; max-height:400px;">
          <table class="data-table">
            <thead><tr><th>Agreement plan</th><th>Asset</th><th>Priority</th><th>Next due</th></tr></thead>
            <tbody>
              ${d.maintenancePlans.map(p => `
                <tr>
                  <td class="font-medium">${escapeHTML(p.name)}</td>
                  <td class="text-secondary">${assetLink(p.assetId, p.assetName)}</td>
                  <td>
                    <span class="badge ${p.priority >= 8 ? 'badge-danger' : p.priority >= 4 ? 'badge-warning' : 'badge-success'}">Priority ${escapeHTML(String(p.priority || 5))}</span>
                  </td>
                  <td class="text-secondary" style="font-size:12px">${escapeHTML(p.nextServiceDate || p.nextDue || '—')}</td>
                </tr>
              `).join('')}
              ${!d.maintenancePlans.length ? emptyRow(4, 'No maintenance plans active') : ''}
            </tbody>
          </table>
        </div>
      </div>

      <div class="card">
        <div class="card-header"><h4>Service cost by asset</h4></div>
        <div class="card-body">
          ${barChart(assetCosts.slice(0, 10), {}, '#EF4444', wholeMoney)}
        </div>
      </div>
    </div>

    <div class="card">
      <div class="card-header"><h4>Recent service history</h4></div>
      <div class="card-body" style="padding:0; overflow-x:auto">
        <table class="data-table">
          <thead>
            <tr><th>Date</th><th>Asset</th><th>Serial number</th><th>Technician</th><th>Job #</th><th style="text-align:right">Service cost</th><th>Observations</th></tr>
          </thead>
          <tbody>
            ${displayLogs.map(l => `
              <tr>
                <td class="text-secondary" style="font-size:12px">${escapeHTML(new Date(l.date).toLocaleDateString())}</td>
                <td class="font-medium">${assetLink(l.asset.id, l.asset.name)}</td>
                <td class="text-secondary" style="font-family:var(--font-mono); font-size:12px">${escapeHTML(l.asset.serial || '—')}</td>
                <td>${escapeHTML(l.technicianName || 'Unassigned')}</td>
                <td>${l.jobId ? `<a href="#/jobs/${encodeURIComponent(l.jobId)}" class="cell-link">${escapeHTML(l.jobNumber || 'Job')}</a>` : `<span class="badge badge-neutral">${escapeHTML(l.jobNumber || '—')}</span>`}</td>
                <td style="text-align:right; font-weight:600; color:var(--color-danger)">${money(l.cost)}</td>
                <td class="text-secondary truncate" style="max-width:250px;">${escapeHTML(l.notes || '—')}</td>
              </tr>
            `).join('')}
            ${!displayLogs.length ? emptyRow(7, 'No service logs registered yet') : ''}
          </tbody>
        </table>
      </div>
    </div>
  `;
}

function renderCustomersReport(r) {
  const c = r.customers;
  return `
    ${renderAIInsightsPanel('customers', r)}
    <div class="grid-4" style="margin-bottom:var(--space-lg)">
      ${kpi('Active customers', c.active, 'people', 'blue', `${c.total} in total`)}
      ${kpi('New customers', c.new, 'person_add', 'green', 'added in this range')}
      ${kpi('Invoiced', c.invoiced, 'receipt_long', 'blue', 'customers invoiced in this range')}
      ${kpi('Repeat', c.repeat, 'repeat', 'green', 'invoiced more than once')}
    </div>
    <div class="card">
      <div class="card-header"><h4>Top customers by revenue</h4></div>
      <div class="card-body" style="padding:0">
        <table class="data-table">
          <thead><tr><th>#</th><th>Customer</th><th style="text-align:right">Revenue (ex GST)</th><th>Share</th></tr></thead>
          <tbody>
            ${c.top.map((t, i) => `
              <tr>
                <td class="text-secondary">${i + 1}</td>
                <td class="font-medium">${r.scoped.customers.some(x => String(x.id) === t.id) ? `<a href="#/people/${encodeURIComponent(t.id)}" class="cell-link">${escapeHTML(t.name || 'Customer')}</a>` : escapeHTML(t.name || 'Customer')}</td>
                <td style="text-align:right;font-weight:600">${money(t.revenue)}</td>
                <td>
                  <div style="display:flex;align-items:center;gap:8px">
                    <div style="flex:1;height:6px;background:var(--border-color);border-radius:3px;overflow:hidden">
                      <div style="height:100%;width:${t.share * 100}%;background:var(--color-primary);border-radius:3px"></div>
                    </div>
                    <span class="text-secondary" style="font-size:var(--font-size-xs)">${pct(t.share)}</span>
                  </div>
                </td>
              </tr>
            `).join('')}
            ${!c.top.length ? emptyRow(4, 'No customers invoiced in this range') : ''}
          </tbody>
        </table>
      </div>
    </div>
  `;
}

function renderInventoryReport(r) {
  const stock = r.scoped.stock;
  const low = lowStock(stock);
  const sellValue = stock.reduce((s, i) => s + (Number(i.quantity) || 0) * (Number(i.unitPrice) || 0), 0);
  const byCategory = {};
  stock.forEach(i => { const k = i.category || 'Uncategorised'; byCategory[k] = (byCategory[k] || 0) + (Number(i.quantity) || 0); });
  return `
    ${renderAIInsightsPanel('inventory', r)}
    <div class="grid-3" style="margin-bottom:var(--space-lg)">
      ${kpi('Total items', stock.length, 'inventory_2', 'blue')}
      ${kpi('Stock value (cost)', wholeMoney(stockValue(stock)), 'account_balance', 'orange')}
      ${kpi('Stock value (sell)', wholeMoney(sellValue), 'paid', 'green')}
    </div>
    ${low.length > 0 ? `
      <div class="card" style="margin-bottom:var(--space-lg);border-color:var(--color-danger)">
        <div class="card-header" style="background:var(--color-danger-bg)">
          <h4 style="color:var(--color-danger)"><span class="material-icons-outlined" style="font-size:18px;vertical-align:middle">warning</span> Low stock (${low.length} items)</h4>
        </div>
        <div class="card-body" style="padding:0">
          <table class="data-table">
            <thead><tr><th>Item</th><th>SKU</th><th style="text-align:center">Qty</th><th style="text-align:center">Reorder level</th><th>Supplier</th></tr></thead>
            <tbody>
              ${low.map(i => `
                <tr>
                  <td class="font-medium"><a href="#/stock/${encodeURIComponent(i.id)}" class="cell-link">${escapeHTML(i.name)}</a></td>
                  <td class="text-secondary" style="font-family:var(--font-mono)">${escapeHTML(i.sku)}</td>
                  <td style="text-align:center;color:var(--color-danger);font-weight:600">${escapeHTML(String(i.quantity))}</td>
                  <td style="text-align:center">${escapeHTML(String(i.reorderLevel))}</td>
                  <td class="text-secondary">${escapeHTML(i.supplier)}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      </div>
    ` : ''}
    <div class="card">
      <div class="card-header"><h4>Stock by category</h4></div>
      <div class="card-body">
        ${barChart(sortedEntries(byCategory), {}, '#1B6DE0')}
      </div>
    </div>
  `;
}
