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
import { showModal } from '../../components/Modal.js';
import { showToast } from '../../components/Notifications.js';
import { buildReport, emptyFilters, toCsv } from '../../utils/reportMetrics.js';
import { toDate } from '../../utils/kpis.js';
import {
  REPORTS, reportSpec, selectBlocks, localInsights,
  money, wholeMoney, pct, hrs, assetServiceCost, lowStock, stockValue, costedSub, NOT_COSTED,
  assetReportFor, ASSET_CSV_HEADERS, assetCsvRows,
} from './reportSpec.js';
import { SPEND_TYPES } from '../../utils/assetReport.js';
import { formatLocalDate } from '../../utils/dateUtils.js';

const COLLECTIONS = [
  'jobs', 'quotes', 'invoices', 'customers', 'stock', 'technicians', 'leads', 'timesheets',
  'assets', 'maintenancePlans', 'schedule', 'jobMaterials', 'purchaseOrders',
];

const PRESETS = [
  { id: 'all', label: 'All time' },
  { id: 'month', label: 'This month' },
  { id: '30', label: 'Last 30 days' },
  { id: '90', label: 'Last 90 days' },
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
  let openMenu = null;       // 'period' | 'filters' while one is being used, so a re-render keeps it open
  let onDocClick = () => {};

  function render() {
    const data = loadData();
    const r = buildReport(data, filters);
    const assetTypes = [...new Set(data.assets.map(a => a.type).filter(Boolean))].sort();
    const staff = data.technicians.filter(t => !t.deactivated && t.role !== 'customer');
    const option = (value, label, selected) => `<option value="${escapeHTML(String(value))}" ${String(selected) === String(value) ? 'selected' : ''}>${escapeHTML(label)}</option>`;

    const lines = filterLines(data);
    const preset = PRESETS.find(p => p.id === activePreset);
    const periodLabel = preset ? preset.label : shortRangeText(r.range);
    const isOpen = (id) => openMenu === id;

    // Everything in .page-header-actions is moved into the breadcrumb bar by
    // main.js, so the controls are kept to three compact menus: Period (presets
    // and a custom range), Filters (who and what), and Export.
    container.innerHTML = `
      <div class="page-header">
        <h1>Reports & Analytics</h1>
        <div class="page-header-actions">
          <div class="dropdown report-menu" data-menu="period">
            <button class="btn btn-secondary" id="btn-report-period" aria-haspopup="true" aria-expanded="${isOpen('period')}">
              <span class="material-icons-outlined">calendar_today</span> ${escapeHTML(periodLabel)}
            </button>
            <div class="dropdown-menu report-period-pop" style="display:${isOpen('period') ? 'block' : 'none'}">
              ${PRESETS.map(p => `<button type="button" class="dropdown-item${activePreset === p.id ? ' selected' : ''}" data-preset="${p.id}">${p.label}</button>`).join('')}
              <div class="dropdown-divider"></div>
              <div class="report-pop-custom">
                <span class="report-pop-heading">Custom range</span>
                <label class="report-pop-field"><span>From</span><input type="date" class="form-input" id="report-from" value="${escapeHTML(filters.start)}" /></label>
                <label class="report-pop-field"><span>To</span><input type="date" class="form-input" id="report-to" value="${escapeHTML(filters.end)}" /></label>
              </div>
            </div>
          </div>
          <div class="dropdown report-menu" data-menu="filters">
            <button class="btn btn-secondary" id="btn-report-filters" aria-haspopup="true" aria-expanded="${isOpen('filters')}" data-tooltip="${escapeHTML(lines.join(' · ') || 'Filter by technician, customer or asset type')}" data-tooltip-pos="bottom">
              <span class="material-icons-outlined">filter_list</span> Filters${lines.length ? `<span class="report-filter-count">${lines.length}</span>` : ''}
            </button>
            <div class="dropdown-menu report-filter-pop" style="display:${isOpen('filters') ? 'block' : 'none'}">
              <label class="report-pop-field"><span>Technician</span>
                <select class="form-select" data-filter="technicianId">
                  ${option('All', 'All technicians', filters.technicianId)}
                  ${staff.map(t => option(t.id, t.name, filters.technicianId)).join('')}
                </select>
              </label>
              <label class="report-pop-field"><span>Customer</span>
                <select class="form-select" data-filter="customerId">
                  ${option('All', 'All customers', filters.customerId)}
                  ${data.customers.map(c => option(c.id, c.company || `${c.firstName || ''} ${c.lastName || ''}`.trim() || 'Customer', filters.customerId)).join('')}
                </select>
              </label>
              ${assetTypes.length ? `
              <label class="report-pop-field"><span>Asset type</span>
                <select class="form-select" data-filter="assetType">
                  ${option('All', 'All asset types', filters.assetType)}
                  ${assetTypes.map(t => option(t, t, filters.assetType)).join('')}
                </select>
              </label>` : ''}
              ${lines.length ? '<button type="button" class="btn btn-ghost btn-sm" id="btn-clear-filters">Clear filters</button>' : ''}
            </div>
          </div>
          <div class="dropdown report-menu" data-menu="export">
            <button class="btn btn-secondary" id="btn-report-export" aria-haspopup="true"><span class="material-icons-outlined">download</span> Export</button>
            <div class="dropdown-menu" style="display:none">
              <button type="button" class="dropdown-item" id="btn-export-csv"><span class="material-icons-outlined">table_view</span> CSV of this report</button>
              <button type="button" class="dropdown-item" id="btn-export-pdf"><span class="material-icons-outlined">picture_as_pdf</span> PDF, choose what's in it</button>
            </div>
          </div>
        </div>
      </div>

      <div id="report-content"></div>
    `;

    container.querySelector('#report-content').innerHTML = renderReport(activeReport, r);
    bindEvents(r, lines);
  }

  // The filters in use, in words, for the PDF header.
  function filterLines(data) {
    const lines = [];
    const tech = data.technicians.find(t => String(t.id) === String(filters.technicianId));
    const cust = data.customers.find(c => String(c.id) === String(filters.customerId));
    if (tech) lines.push(`Technician: ${tech.name}`);
    if (cust) lines.push(`Customer: ${cust.company || `${cust.firstName || ''} ${cust.lastName || ''}`.trim()}`);
    if (filters.assetType && filters.assetType !== 'All') lines.push(`Asset type: ${filters.assetType}`);
    return lines;
  }

  // Bound while the controls are still inside `container`; main.js moves them
  // into the breadcrumb bar afterwards and the listeners go with them.
  function bindEvents(r, lines) {
    const q = (sel) => container.querySelector(sel);
    const menus = [...container.querySelectorAll('.report-menu')];
    const closeMenus = () => {
      menus.forEach(m => {
        m.querySelector('.dropdown-menu').style.display = 'none';
        m.querySelector('.btn').setAttribute('aria-expanded', 'false');
      });
      openMenu = null;
    };
    menus.forEach(m => {
      const btn = m.querySelector('.btn');
      const pop = m.querySelector('.dropdown-menu');
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const open = pop.style.display === 'none';
        closeMenus();
        pop.style.display = open ? 'block' : 'none';
        btn.setAttribute('aria-expanded', String(open));
        openMenu = open ? m.dataset.menu : null;
      });
      pop.addEventListener('click', (e) => e.stopPropagation());
    });
    document.removeEventListener('click', onDocClick);
    onDocClick = closeMenus;
    document.addEventListener('click', onDocClick);

    q('#btn-export-csv')?.addEventListener('click', () => { closeMenus(); exportCSV(activeReport, r); });
    q('#btn-export-pdf')?.addEventListener('click', () => { closeMenus(); openPdfDialog(activeReport, r, lines); });

    container.querySelectorAll('[data-preset]').forEach(btn => btn.addEventListener('click', () => {
      activePreset = btn.dataset.preset;
      Object.assign(filters, presetDates(activePreset));
      openMenu = null;
      render();
    }));
    // Typing a date makes it a custom range; the menu stays open for the other end.
    const setDate = (key) => (e) => {
      filters[key] = e.target.value;
      activePreset = 'custom';
      openMenu = 'period';
      render();
    };
    q('#report-from')?.addEventListener('change', setDate('start'));
    q('#report-to')?.addEventListener('change', setDate('end'));

    container.querySelectorAll('[data-filter]').forEach(sel => {
      sel.addEventListener('change', (e) => {
        filters[e.target.dataset.filter] = e.target.value;
        openMenu = 'filters';
        render();
      });
    });
    q('#btn-clear-filters')?.addEventListener('click', () => {
      Object.assign(filters, { technicianId: 'All', customerId: 'All', assetType: 'All' });
      openMenu = 'filters';
      render();
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
      return toCsv(ASSET_CSV_HEADERS, assetCsvRows(r));
    case 'customers':
      return toCsv(['Company', 'First name', 'Last name', 'Email', 'Phone', 'Status', 'Invoiced in range (ex GST)', 'Credit limit', 'Owing (incl. GST)', 'Over limit by'],
        d.customers.map(c => {
          const a = r.credit.byId.get(String(c.id));
          return [c.company, c.firstName, c.lastName, c.email, c.phone, c.status, r.customers.revenueById.get(String(c.id)) || 0,
            a && a.limit > 0 ? a.limit : '', a ? a.owing : 0, a && a.overBy > 0 ? a.overBy : ''];
        }));
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

// ── PDF export ──────────────────────────────────────────────────────────────

const rangeText = (range) => {
  const f = (d) => d.toLocaleDateString('en-AU', { day: 'numeric', month: 'short', year: 'numeric' });
  return `${f(range.start)} – ${f(new Date(range.end - 1))}`;
};

// For the Period button: "1 Sep – 28 Oct 2026", with the first year only when it differs.
const shortRangeText = (range) => {
  const a = range.start, b = new Date(range.end - 1);
  const day = (d, year) => d.toLocaleDateString('en-AU', { day: 'numeric', month: 'short', ...(year ? { year: 'numeric' } : {}) });
  return `${day(a, a.getFullYear() !== b.getFullYear())} – ${day(b, true)}`;
};

// Pick reports and the blocks inside each, then download them as one PDF. The
// open report starts fully ticked; the others start unticked.
function openPdfDialog(activeId, r, lines) {
  const companyName = store.getSettings().name || '';
  const specs = REPORTS.map(rep => reportSpec(rep.id, r, { insights: insightsFor(rep.id, r), companyName }));

  const content = document.createElement('div');
  content.className = 'report-pdf-picker';
  content.innerHTML = `
    <p class="text-secondary" style="margin:0 0 12px;font-size:13px">
      Uses the filters on screen: ${escapeHTML(rangeText(r.range))}${lines.length ? `, ${escapeHTML(lines.join(', '))}` : ''}.
    </p>
    <div style="display:flex;gap:8px;margin-bottom:12px">
      <button type="button" class="btn btn-secondary btn-sm" data-pick="all">Select everything</button>
      <button type="button" class="btn btn-secondary btn-sm" data-pick="none">Clear</button>
    </div>
    ${specs.map(s => `
      <details class="report-pdf-report" ${s.id === activeId ? 'open' : ''}>
        <summary>
          <label><input type="checkbox" data-report="${escapeHTML(s.id)}" ${s.id === activeId ? 'checked' : ''} /> ${escapeHTML(s.title)}</label>
        </summary>
        <div class="report-pdf-blocks">
          ${s.blocks.map(b => `
            <label><input type="checkbox" data-block="${escapeHTML(s.id)}" value="${escapeHTML(b.key)}" ${s.id === activeId ? 'checked' : ''} />
              ${escapeHTML(b.title)}${b.kind === 'table' ? ` <span class="text-tertiary">(${b.rows.length} rows)</span>` : ''}</label>
          `).join('')}
        </div>
      </details>
    `).join('')}
    <div class="report-pdf-error" role="alert" style="display:none;color:var(--color-danger);font-size:13px;margin-top:8px">Choose at least one thing to include.</div>
  `;

  const error = content.querySelector('.report-pdf-error');
  const blocksOf = (id) => [...content.querySelectorAll(`[data-block="${CSS.escape(id)}"]`)];
  const syncReport = (id) => {
    const box = content.querySelector(`[data-report="${CSS.escape(id)}"]`);
    const ticked = blocksOf(id).filter(b => b.checked).length;
    box.checked = ticked > 0;
    box.indeterminate = ticked > 0 && ticked < blocksOf(id).length;
  };
  content.querySelectorAll('[data-report]').forEach(box => box.addEventListener('change', () => {
    blocksOf(box.dataset.report).forEach(b => { b.checked = box.checked; });
    box.indeterminate = false;
    error.style.display = 'none';
  }));
  content.querySelectorAll('[data-block]').forEach(b => b.addEventListener('change', () => {
    syncReport(b.dataset.block);
    error.style.display = 'none';
  }));
  content.querySelectorAll('[data-pick]').forEach(btn => btn.addEventListener('click', () => {
    const on = btn.dataset.pick === 'all';
    content.querySelectorAll('[data-block]').forEach(b => { b.checked = on; });
    specs.forEach(s => syncReport(s.id));
    error.style.display = 'none';
  }));
  // A click on the checkbox inside <summary> shouldn't also fold the section.
  content.querySelectorAll('summary label').forEach(l => l.addEventListener('click', e => e.stopPropagation()));

  showModal({
    title: 'Export PDF',
    content,
    actions: [
      { label: 'Cancel', className: 'btn-secondary', onClick: c => c() },
      { label: 'Download PDF', className: 'btn-primary', onClick: async (close) => {
        const selection = {};
        content.querySelectorAll('[data-block]:checked').forEach(b => {
          (selection[b.dataset.block] = selection[b.dataset.block] || new Set()).add(b.value);
        });
        const sections = selectBlocks(specs, selection);
        if (!sections.length) { error.style.display = ''; return; }
        try {
          const { preparePdfFolder, savePdf } = await import('../../utils/pdfFolder.js');
          await preparePdfFolder();
          const { buildReportPdf } = await import('../../utils/reportPdf.js');
          const { doc, filename } = await buildReportPdf({ company: companyName, rangeLabel: rangeText(r.range), filterLines: lines, sections });
          await savePdf(doc.output('blob'), filename, 'report');
          close();
        } catch (err) {
          console.error('Report PDF failed:', err);
          showToast("Couldn't build the PDF. Try again.", 'error');
        }
      } },
    ],
  });
}

// ── Cache & Insights Engine ────────────────────────────────────────────────
// Keyed by report and the figures it was given, so a change of filters asks again.
const cachedAIInsights = {};

// The insights a report's panel last showed for these figures, for the PDF.
function insightsFor(reportId, r) {
  const hit = cachedAIInsights[`${reportId}_${getStatsSummaryText(reportId, r)}`];
  return hit ? { items: hit.items, source: hit.source } : null;
}

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
    return `<div class="card" id="${containerId}" style="margin-bottom:var(--space-lg);">${cachedAIInsights[cacheKey].html}</div>`;
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

  const companyName = store.getSettings().name || 'your company';
  let items, source;

  if (insightsUseAI()) {
    try {
      let reply = await dispatchChat([
        { role: 'system', content: INSIGHTS_PROMPT },
        { role: 'user', content: `Active Report: ${reportId}\nFiltered Metrics:\n${statsSummary}` },
      ]);
      if (reply.includes('```')) {
        reply = reply.replace(/```json/g, '').replace(/```/g, '').trim();
      }
      items = JSON.parse(reply);
      if (!Array.isArray(items)) throw new Error('Insights reply is not a list');
      source = 'live';
    } catch (err) {
      console.error('AI Insights parsing or fetch error:', err);
      items = localInsights(reportId, r, companyName);
      source = 'offline';
    }
  } else {
    items = localInsights(reportId, r, companyName);
    source = store.demoMode ? 'demo' : 'local';
  }

  const html = renderInsightsListHTML(items, source);
  cachedAIInsights[cacheKey] = { html, items: items.slice(0, 5), source };
  panel.style.border = '';
  panel.innerHTML = html;
}

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
    const ar = assetReportFor(r);
    summary += `Active service plans: ${d.maintenancePlans.filter(p => p.status === 'Active').length}\n`;
    summary += `Maintenance spend in range: ${money(ar.total)} (service ${money(ar.byType.Service)}, repairs ${money(ar.byType.Repair)}, inspections ${money(ar.byType.Inspection)}, other ${money(ar.byType.Other)})\n`;
    summary += `Plans overdue: ${ar.plansDue.filter(p => p.state === 'overdue').length}; due within 30 days: ${ar.plansDue.filter(p => p.state === 'due-soon').length}\n`;
    summary += `Compliance checks overdue or due within 30 days: ${ar.complianceDue.length}\n`;
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
const jobLink = (job, id) => job ? `<a href="#/jobs/${encodeURIComponent(job.id)}" class="cell-link">${escapeHTML(job.number || job.id)}</a>` : escapeHTML(String(id));
const emptyRow = (cols, text) => `<tr><td colspan="${cols}" style="text-align:center;padding:20px" class="text-secondary">${escapeHTML(text)}</td></tr>`;

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
  const ar = assetReportFor(r);
  const assetCosts = ar.rows.filter(x => x.total > 0).map(x => [x.asset.name, x.total]);
  const assetById = new Map(d.assets.map(a => [a.id, a]));
  const fmtDay = (key) => (key ? formatLocalDate(key, { day: 'numeric', month: 'short', year: 'numeric' }) : '—');
  const dueBadge = (state) => `<span class="badge ${state === 'overdue' ? 'badge-danger' : 'badge-warning'}">${state === 'overdue' ? 'Overdue' : 'Due soon'}</span>`;
  const overdueCount = ar.plansDue.filter(p => p.state === 'overdue').length;

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
      ${kpi('Active agreements', activePlans.length, 'history_edu', 'green')}
      ${kpi('Maintenance spend', wholeMoney(ar.total), 'savings', 'blue')}
      ${kpi('Spent on repairs', pct(ar.repairShare, 0), 'build', 'orange')}
      ${kpi('Plans due or overdue', overdueCount ? `${ar.plansDue.length} (${overdueCount} overdue)` : ar.plansDue.length, 'event', overdueCount ? 'orange' : 'green')}
    </div>

    <div class="grid-2" style="margin-bottom:var(--space-lg);">
      <div class="card">
        <div class="card-header"><h4>Plans coming due</h4></div>
        <div class="card-body" style="padding:0; overflow-y:auto; max-height:400px;">
          <table class="data-table">
            <thead><tr><th>Plan</th><th>Asset</th><th>Due</th><th>Status</th></tr></thead>
            <tbody>
              ${ar.plansDue.map(p => `
                <tr>
                  <td class="font-medium">${escapeHTML(p.plan.name || '')}</td>
                  <td class="text-secondary">${assetLink(p.asset.id, p.asset.name)}${p.asset.customerName ? `<div class="text-tertiary" style="font-size:11px">${escapeHTML(p.asset.customerName)}</div>` : ''}</td>
                  <td class="text-secondary" style="font-size:12px">${p.dueKey ? fmtDay(p.dueKey) : `at ${escapeHTML(String(p.meterTarget))} ${escapeHTML(p.asset.meterUnit || 'hrs')}`}</td>
                  <td>${dueBadge(p.state)}</td>
                </tr>
              `).join('')}
              ${!ar.plansDue.length ? emptyRow(4, 'Nothing due in the next 30 days') : ''}
            </tbody>
          </table>
        </div>
      </div>

      <div class="card">
        <div class="card-header"><h4>Spend by type</h4></div>
        <div class="card-body">
          ${barChart(SPEND_TYPES.map(t => [t, ar.byType[t]]).filter(([, v]) => v > 0), {}, '#3B82F6', wholeMoney)}
          ${ar.total > 0 ? `<p class="text-tertiary" style="font-size:12px; margin:8px 0 0">${pct(ar.plannedShare, 0)} planned work (service and inspections), ${pct(ar.repairShare, 0)} repairs.</p>` : ''}
        </div>
      </div>
    </div>

    <div class="card" style="margin-bottom:var(--space-lg)">
      <div class="card-header"><h4>Cost per asset</h4></div>
      <div class="card-body" style="padding:0; overflow-x:auto">
        <table class="data-table">
          <thead><tr><th>Asset</th><th>Customer</th><th style="text-align:right">Service</th><th style="text-align:right">Repair</th><th style="text-align:right">Inspection</th><th style="text-align:right">Other</th><th style="text-align:right">Total</th></tr></thead>
          <tbody>
            ${ar.rows.filter(x => x.total > 0).map(x => `
              <tr>
                <td class="font-medium">${assetLink(x.asset.id, x.asset.name)}</td>
                <td class="text-secondary">${escapeHTML(x.asset.customerName || 'My Business')}</td>
                <td style="text-align:right">${money(x.Service)}</td>
                <td style="text-align:right${x.Repair > 0 ? '; color:var(--color-danger)' : ''}">${money(x.Repair)}</td>
                <td style="text-align:right">${money(x.Inspection)}</td>
                <td style="text-align:right">${money(x.Other)}</td>
                <td style="text-align:right; font-weight:600">${money(x.total)}</td>
              </tr>
            `).join('')}
            ${!assetCosts.length ? emptyRow(7, 'No maintenance spend logged in this range') : ''}
          </tbody>
        </table>
      </div>
    </div>

    <div class="grid-2" style="margin-bottom:var(--space-lg);">
      <div class="card">
        <div class="card-header"><h4>Compliance coming due</h4></div>
        <div class="card-body" style="padding:0; overflow-y:auto; max-height:400px;">
          <table class="data-table">
            <thead><tr><th>Check</th><th>Asset</th><th>Due</th><th>Status</th></tr></thead>
            <tbody>
              ${ar.complianceDue.map(c => `
                <tr>
                  <td class="font-medium">${escapeHTML(c.item.name || '')}</td>
                  <td class="text-secondary">${assetLink(c.asset.id, c.asset.name)}</td>
                  <td class="text-secondary" style="font-size:12px">${fmtDay(c.dueKey)}</td>
                  <td>${dueBadge(c.state)}</td>
                </tr>
              `).join('')}
              ${!ar.complianceDue.length ? emptyRow(4, 'No compliance checks due') : ''}
            </tbody>
          </table>
        </div>
      </div>

      <div class="card">
        <div class="card-header"><h4>Maintenance agreements</h4></div>
        <div class="card-body" style="padding:0; overflow-y:auto; max-height:400px;">
          <table class="data-table">
            <thead><tr><th>Agreement plan</th><th>Asset</th><th>Priority</th><th>Next due</th></tr></thead>
            <tbody>
              ${d.maintenancePlans.map(p => `
                <tr>
                  <td class="font-medium">${escapeHTML(p.name)}${p.status !== 'Active' ? ` <span class="badge badge-neutral">${escapeHTML(p.status || '')}</span>` : ''}</td>
                  <td class="text-secondary">${assetLink(p.assetId, assetById.get(p.assetId)?.name)}</td>
                  <td>
                    <span class="badge ${p.priority >= 8 ? 'badge-danger' : p.priority >= 4 ? 'badge-warning' : 'badge-success'}">Priority ${escapeHTML(String(p.priority || 5))}</span>
                  </td>
                  <td class="text-secondary" style="font-size:12px">${p.nextServiceDate ? fmtDay(p.nextServiceDate) : (p.triggerType === 'Meter' ? 'By meter' : '—')}</td>
                </tr>
              `).join('')}
              ${!d.maintenancePlans.length ? emptyRow(4, 'No maintenance plans active') : ''}
            </tbody>
          </table>
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
                <td class="text-secondary" style="font-size:12px">${escapeHTML(fmtDay(l.date))}</td>
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
