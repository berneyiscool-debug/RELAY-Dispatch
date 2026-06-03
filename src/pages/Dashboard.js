// ============================================
// RELAY — DASHBOARD (Infinite Canvas System)
// ============================================
// Widgets live on a pannable / zoomable infinite canvas.
//   • Pan   : drag empty canvas space (or click a guide/pin to fly to it)
//   • Zoom  : Ctrl + mouse-wheel (focal point follows cursor) OR the on-screen + / − buttons
//   • Snap  : widgets snap to a GRID-px grid when dragged or resized (edit mode)
//   • Guides: edge arrows always point to off-screen targets (Home + user pins) and
//             vanish once the target scrolls into view
//   • Pins  : user-droppable, colour + icon coded navigation waypoints
//   • Layout, view (pan/zoom) and pins persist per-user; new users get a role-based default
// ============================================
import { store } from '../data/store.js';
import { calculateTotalBillableMaterials } from '../utils/pricing.js';
import { hasPermission } from '../utils/permissions.js';

function getHeaderActionsHtml() {
  const canCreateJob = hasPermission('Jobs', 'create');
  const canCreateQuote = hasPermission('Quotes', 'create');
  let html = '';
  if (canCreateJob) {
    html += `
      <button class="btn btn-secondary btn-sm" onclick="window.location.hash='/jobs/new'">
        <span class="material-icons-outlined" style="font-size:16px;">add</span> New Job
      </button>`;
  }
  if (canCreateQuote) {
    html += `
      <button class="btn btn-primary btn-sm" onclick="window.location.hash='/quotes/new'">
        <span class="material-icons-outlined" style="font-size:16px;">add</span> New Quote
      </button>`;
  }
  return html;
}

// ── Canvas constants ───────────────────────────────────────────────────────────
const GRID = 20;            // snap grid in world px
const ZOOM_MIN = 0.1;
const ZOOM_MAX = 2;
const ZOOM_STEP = 0.05;     // zoom changes in clean 5% increments

// Default pixel sizes derived from a widget's declared width/height class
const W_PX = { S: 300, M: 460, L: 680, XL: 680 };
const H_PX = { standard: 160, tall: 320, xtall: 480 };
const MIN_W = 200, MIN_H = 120;

// Pin palette for the "Drop Pin" tool
const PIN_COLORS = ['#FF5C00', '#2563EB', '#059669', '#DC2626', '#8B5CF6', '#D97706'];
const PIN_ICONS  = [
  'star', 'flag', 'build', 'priority_high', 'attach_money', 'folder', 'bolt', 'place',
  'home', 'work', 'event', 'warning', 'check_circle', 'schedule', 'people', 'inventory_2',
  'receipt_long', 'request_quote', 'engineering', 'electrical_services', 'local_shipping', 'handyman',
  'analytics', 'notifications', 'push_pin', 'favorite', 'lightbulb', 'verified', 'visibility', 'map',
];

let isEditMode = false;

// Module-level live working state (survives in-session reloadDashboard calls so an
// action like "assign tech" doesn't reset the user's pan / zoom). Reset on user switch.
let live = null; // { userId, widgets:[], view:{panX,panY,zoom}, pins:[] }

const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));
const snap  = (v) => Math.round(v / GRID) * GRID;
// Snap a zoom value to the nearest clean 5% step (e.g. 0.85, 0.90, 0.95) and clamp it
const snapZoom = (z) => clamp(Math.round(Math.round(z / ZOOM_STEP) * ZOOM_STEP * 100) / 100, ZOOM_MIN, ZOOM_MAX);

function getLayoutKey() {
  const currentUser = JSON.parse(localStorage.getItem('currentUser') || 'null');
  return currentUser ? `dashboardCanvas_v1_${currentUser.id}` : 'dashboardCanvas_v1';
}

// Each module declares default size + which size options are sensible + its renderer
const MODULES = {
  'kpi-cards':            { title: 'KPI Cards',                   defaultW: 'L',  defaultH: 'standard', kpiStrip: true,  render: renderKpiCards },
  'job-status-chart':     { title: 'Job Status Chart',            defaultW: 'M',  defaultH: 'tall',     render: renderJobStatusChart },
  'tech-map':             { title: 'Technician Map',              defaultW: 'S',  defaultH: 'tall',     render: renderTechMap },
  'recent-activity':      { title: 'Recent Activity',             defaultW: 'M',  defaultH: 'tall',     render: renderRecentActivity },
  'recent-leads':         { title: 'Recent Leads',                defaultW: 'S',  defaultH: 'tall',     render: renderRecentLeads },
  'today-schedule':       { title: "Today's Schedule",            defaultW: 'M',  defaultH: 'tall',     render: renderTodaySchedule },
  'pinned-job':           { title: 'Pinned Job Progress',         defaultW: 'M',  defaultH: 'standard', configurable: true,  render: renderPinnedJob },
  'unassigned-jobs':      { title: 'Unassigned Jobs Queue',       defaultW: 'M',  defaultH: 'tall',     render: renderUnassignedJobs },
  'uninvoiced-completed': { title: 'Uninvoiced Completed Jobs',   defaultW: 'M',  defaultH: 'tall',     render: renderUninvoicedCompleted },
  'low-stock':            { title: 'Low Stock Alerts',            defaultW: 'S',  defaultH: 'standard', render: renderLowStock },
  'profitability-chart':  { title: 'Projected Profitability',     defaultW: 'L',  defaultH: 'tall',     render: renderProfitabilityChart },
  'staff-availability':   { title: 'Staff Availability',          defaultW: 'M',  defaultH: 'tall',     render: renderStaffAvailability },
  'timesheet-exceptions': { title: 'Timesheet Exceptions',        defaultW: 'M',  defaultH: 'standard', render: renderTimesheetExceptions },
  'asset-status':         { title: 'Asset Status',                defaultW: 'M',  defaultH: 'standard', render: renderAssetStatus },
  'overdue-maintenance':  { title: 'Overdue Maintenance',         defaultW: 'M',  defaultH: 'standard', render: renderOverdueMaintenance },
  'top-customers':        { title: 'Top Customers',               defaultW: 'M',  defaultH: 'tall',     render: renderTopCustomers },
  'daily-todo':           { title: 'Daily To-Do',                 defaultW: 'S',  defaultH: 'tall',     render: renderDailyTodo },
  'pending-approvals':    { title: 'Pending Approvals',           defaultW: 'M',  defaultH: 'standard', render: renderPendingApprovals },
  'customer-nps':         { title: 'Customer Satisfaction',       defaultW: 'S',  defaultH: 'standard', render: renderCustomerNPS },
  'cash-flow':            { title: 'Cash Flow Summary',           defaultW: 'S',  defaultH: 'standard', render: renderCashFlow },
  'weather-forecast':     { title: 'Weather Forecast',            defaultW: 'S',  defaultH: 'standard', render: renderWeatherForecast },

  // ── Live page widgets (full, interactive pages embedded in a widget) ──
  // Workflow group
  'page-leads': {
    title: 'Leads Page', defaultW: 'L', defaultH: 'xtall', page: true,
    mount: (body) => mountPageWidget(body, {
      list:   () => import('./leads/LeadsList.js').then(m => m.renderLeadsList),
      detail: () => import('./leads/LeadDetail.js').then(m => m.renderLeadDetail),
    }),
  },
  'page-quotes': {
    title: 'Quotes Page', defaultW: 'L', defaultH: 'xtall', page: true,
    mount: (body) => mountPageWidget(body, {
      list:   () => import('./quotes/QuotesList.js').then(m => m.renderQuotesList),
      detail: () => import('./quotes/QuoteDetail.js').then(m => m.renderQuoteDetail),
    }),
  },
  'page-jobs': {
    title: 'Jobs Page', defaultW: 'L', defaultH: 'xtall', page: true,
    mount: (body) => mountPageWidget(body, {
      list:   () => import('./jobs/JobsList.js').then(m => m.renderJobsList),
      detail: () => import('./jobs/JobDetail.js').then(m => m.renderJobDetail),
    }),
  },
  'page-notifications': {
    title: 'Notifications Page', defaultW: 'M', defaultH: 'xtall', page: true,
    mount: (body) => mountPageWidget(body, {
      list: () => import('./notifications/NotificationsList.js').then(m => m.renderNotificationsList),
    }),
  },
  'page-invoices': {
    title: 'Invoices Page', defaultW: 'L', defaultH: 'xtall', page: true,
    mount: (body) => mountPageWidget(body, {
      list:   () => import('./invoices/InvoicesList.js').then(m => m.renderInvoicesList),
      detail: () => import('./invoices/InvoiceDetail.js').then(m => m.renderInvoiceDetail),
    }),
  },
  // People group
  'page-customers': {
    title: 'Customers Page', defaultW: 'L', defaultH: 'xtall', page: true,
    mount: (body) => mountPageWidget(body, {
      list:   () => import('./people/PeopleList.js').then(m => m.renderPeopleList),
      detail: () => import('./people/PersonDetail.js').then(m => m.renderPersonDetail),
    }),
  },
  'page-contractors': {
    title: 'Contractors Page', defaultW: 'L', defaultH: 'xtall', page: true,
    mount: (body) => mountPageWidget(body, {
      list:   () => import('./contractors/ContractorsList.js').then(m => m.renderContractorsList),
      detail: () => import('./contractors/ContractorDetail.js').then(m => m.renderContractorDetail),
    }),
  },
  'page-suppliers': {
    title: 'Suppliers Page', defaultW: 'L', defaultH: 'xtall', page: true,
    mount: (body) => mountPageWidget(body, {
      list:   () => import('./suppliers/SuppliersList.js').then(m => m.renderSuppliersList),
      detail: () => import('./suppliers/SupplierDetail.js').then(m => m.renderSupplierDetail),
    }),
  },
  // Resources group
  'page-assets': {
    title: 'Assets Page', defaultW: 'L', defaultH: 'xtall', page: true,
    mount: (body) => mountPageWidget(body, {
      list:   () => import('./assets/AssetList.js').then(m => m.renderAssetList),
      detail: () => import('./assets/AssetDetail.js').then(m => m.renderAssetDetail),
    }),
  },
  'page-stock': {
    title: 'Stock Page', defaultW: 'L', defaultH: 'xtall', page: true,
    mount: (body) => mountPageWidget(body, {
      list:   () => import('./stock/StockList.js').then(m => m.renderStockList),
      detail: () => import('./stock/StockDetail.js').then(m => m.renderStockDetail),
    }),
  },
  'page-purchase-orders': {
    title: 'Purchase Orders Page', defaultW: 'L', defaultH: 'xtall', page: true,
    mount: (body) => mountPageWidget(body, {
      list:   () => import('./purchaseOrders/PurchaseOrdersList.js').then(m => m.renderPurchaseOrdersList),
      detail: () => import('./purchaseOrders/PurchaseOrderDetail.js').then(m => m.renderPurchaseOrderDetail),
    }),
  },
  'page-timesheets': {
    title: 'Timesheets Page', defaultW: 'L', defaultH: 'xtall', page: true,
    mount: (body) => mountPageWidget(body, {
      list: () => import('./timesheets/Timesheets.js').then(m => m.renderTimesheetsList),
    }),
  },
  // Schedule (single view)
  'page-schedule': {
    title: 'Schedule Page', defaultW: 'L', defaultH: 'xtall', page: true,
    mount: (body) => mountPageWidget(body, {
      list: () => import('./schedule/ScheduleView.js').then(m => m.renderScheduleView),
    }),
  },
};

// Module → permission required to even offer/show it. Absent = always allowed.
const WIDGET_PERMS = {
  'cash-flow':            ['Invoices', 'view'],
  'uninvoiced-completed': ['Invoices', 'view'],
  'profitability-chart':  ['Invoices', 'view'],
  'top-customers':        ['Invoices', 'view'],
  'pending-approvals':    ['Quotes', 'view'],
  'recent-leads':         ['Leads', 'view'],
  'low-stock':            ['Stock', 'view'],
  'unassigned-jobs':      ['Jobs', 'view'],
  'asset-status':         ['Assets', 'view'],
  'overdue-maintenance':  ['Assets', 'view'],
  'timesheet-exceptions': ['Timesheets', 'approve'],
  // Live page widgets — gated by their page's view permission
  'page-leads':           ['Leads', 'view'],
  'page-quotes':          ['Quotes', 'view'],
  'page-jobs':            ['Jobs', 'view'],
  'page-invoices':        ['Invoices', 'view'],
  'page-customers':       ['Customers', 'view'],
  'page-contractors':     ['Contractors', 'view'],
  'page-suppliers':       ['Suppliers', 'view'],
  'page-assets':          ['Assets', 'view'],
  'page-stock':           ['Stock', 'view'],
  'page-purchase-orders': ['Purchase Orders', 'view'],
  'page-timesheets':      ['Timesheets', 'view_own'],
  'page-schedule':        ['Schedule', 'view_own'],
};

function widgetAllowed(id) {
  const perm = WIDGET_PERMS[id];
  if (!perm) return true;
  return hasPermission(perm[0], perm[1]);
}

// ── Role-based default layouts (world px coordinates) ────────────────────────────
const ADMIN_DEFAULT = [
  { id: 'kpi-cards',        x: 40,  y: 40,  w: 680, h: 150 },
  { id: 'job-status-chart', x: 40,  y: 220, w: 420, h: 320 },
  { id: 'cash-flow',        x: 480, y: 220, w: 240, h: 320 },
  { id: 'today-schedule',   x: 760, y: 40,  w: 440, h: 300 },
  { id: 'recent-activity',  x: 760, y: 360, w: 440, h: 300 },
  { id: 'recent-leads',     x: 40,  y: 560, w: 420, h: 280 },
  { id: 'tech-map',         x: 480, y: 560, w: 240, h: 280 },
];

const TECH_DEFAULT = [
  { id: 'kpi-cards',        x: 40,  y: 40,  w: 300, h: 150 },
  { id: 'weather-forecast', x: 360, y: 40,  w: 300, h: 150 },
  { id: 'today-schedule',   x: 40,  y: 220, w: 440, h: 380 },
  { id: 'daily-todo',       x: 500, y: 220, w: 300, h: 380 },
  { id: 'recent-activity',  x: 700, y: 40,  w: 0,   h: 0 }, // placeholder removed below if dup
];

function defaultLayoutForUser() {
  const canViewQuotes = hasPermission('Quotes', 'view');
  const canViewInvoices = hasPermission('Invoices', 'view');
  const isTechUser = !canViewQuotes && !canViewInvoices;

  let base = isTechUser ? TECH_DEFAULT : ADMIN_DEFAULT;
  // clone + drop any zero-size placeholders + drop disallowed widgets
  return base
    .filter(w => w.w > 0 && w.h > 0 && widgetAllowed(w.id) && MODULES[w.id])
    .map(w => ({ ...w, instanceId: 'inst_' + Math.random().toString(36).substr(2, 9) }));
}

// The default "Home" saved view — centred on the widget cluster. It's seeded for new
// users but is an ordinary view: movable, editable AND removable once they customise.
function makeHomeView(widgets) {
  let x = 40, y = 40;
  if (widgets && widgets.length) {
    let sx = 0, sy = 0;
    widgets.forEach(w => { sx += w.x + w.w / 2; sy += w.y + w.h / 2; });
    x = snap(sx / widgets.length);
    y = snap(sy / widgets.length);
  }
  return { id: 'view_home', x, y, zoom: 1, color: '#FF5C00', icon: 'home', label: 'Home' };
}

function loadLayout() {
  let widgets = null, view = null, pins = null, home = null, stored = false;
  try {
    const s = localStorage.getItem(getLayoutKey());
    if (s) {
      const parsed = JSON.parse(s);
      if (parsed && Array.isArray(parsed.widgets)) {
        stored = true;
        widgets = parsed.widgets;
        view = parsed.view || null;
        pins = Array.isArray(parsed.pins) ? parsed.pins : [];
        home = parsed.home || null; // legacy separate home → migrate into views below
      }
    }
  } catch (e) {}

  if (!stored) widgets = defaultLayoutForUser();

  // Ensure every widget has an instanceId + valid module + is permitted
  widgets = widgets.filter(w => MODULES[w.id] && widgetAllowed(w.id));
  widgets.forEach(w => {
    if (!w.instanceId) w.instanceId = 'inst_' + Math.random().toString(36).substr(2, 9);
    if (typeof w.x !== 'number') w.x = 40;
    if (typeof w.y !== 'number') w.y = 40;
    if (typeof w.w !== 'number') w.w = 440;
    if (typeof w.h !== 'number') w.h = 200;
  });

  // Saved views store a centre + zoom. Normalise + migrate any legacy separate home.
  pins = (pins || []).map(p => ({ ...p, zoom: typeof p.zoom === 'number' ? p.zoom : 1 }));
  if (home) {
    if (typeof home.zoom !== 'number') home.zoom = 1;
    if (!home.id) home.id = 'view_home';
    pins.unshift(home);
  }
  // A brand-new user (no saved layout) gets a default Home view; once they've saved,
  // their choice stands — even an empty list (Home removed) is respected.
  if (!stored) pins = [makeHomeView(widgets)];

  return {
    widgets,
    view: view || { panX: 40, panY: 90, zoom: 1 },
    pins,
  };
}

function saveLayout() {
  if (!live) return;
  localStorage.setItem(getLayoutKey(), JSON.stringify({
    widgets: live.widgets,
    view: live.view,
    pins: live.pins,
  }));
}

function renderPlaceholder(icon, msg) {
  return `<div style="height:100%;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:8px;color:var(--text-tertiary);padding:16px;text-align:center;">
    <span class="material-icons-outlined" style="font-size:28px;opacity:0.4;">${icon}</span>
    <span style="font-size:13px;">${msg}</span>
  </div>`;
}

// ── Top-level render ─────────────────────────────────────────────────────────────
export function renderDashboard(container) {
  if (!window.__fieldForge) window.__fieldForge = {};
  window.__fieldForge.reloadDashboard = () => renderDashboard(container);

  const currentUser = JSON.parse(localStorage.getItem('currentUser') || 'null');
  const uid = currentUser ? currentUser.id : 'anon';

  // (Re)load live state on first paint or when the user changes; otherwise keep the
  // in-session working copy so pan/zoom survive widget-triggered reloads.
  if (!live || live.userId !== uid) {
    const loaded = loadLayout();
    live = { userId: uid, widgets: loaded.widgets, view: loaded.view, pins: loaded.pins };
  }

  const data = {
    jobs:     store.getAll('jobs'),
    quotes:   store.getAll('quotes'),
    invoices: store.getAll('invoices'),
    leads:    store.getAll('leads'),
    people:   store.getAll('people'),
  };

  container.innerHTML = `
    <div class="page-content-wrapper dash-page">
      <div id="dash-viewport" class="dash-viewport">
        <div id="dash-world" class="dash-world"></div>
        <div id="dash-guides" class="dash-guides"></div>

        <div class="dash-topbar">
          <div class="dash-topbar-left">
            <h1 style="margin:0;">Dashboard</h1>
            <button id="btn-edit-dashboard" class="btn btn-secondary btn-sm" style="display:flex;align-items:center;gap:4px;">
              <span class="material-icons-outlined" style="font-size:16px;">dashboard_customize</span> Customise
            </button>
          </div>
          <div id="dashboard-header-actions" class="dash-topbar-right">
            ${getHeaderActionsHtml()}
          </div>
        </div>

        <div class="dash-views" id="dash-views"></div>

        <div class="dash-zoom-controls">
          <button class="dash-zoom-btn" id="zoom-in" title="Zoom in">
            <span class="material-icons-outlined" style="font-size:18px;">add</span>
          </button>
          <button class="dash-zoom-pct" id="zoom-pct" title="Reset to 100%">100%</button>
          <button class="dash-zoom-btn" id="zoom-out" title="Zoom out">
            <span class="material-icons-outlined" style="font-size:18px;">remove</span>
          </button>
          <div class="dash-zoom-divider"></div>
          <button class="dash-zoom-btn" id="zoom-reset" title="Reset view — fit all widgets">
            <span class="material-icons-outlined" style="font-size:18px;">center_focus_strong</span>
          </button>
        </div>
      </div>
    </div>`;

  const viewport = container.querySelector('#dash-viewport');
  const world = container.querySelector('#dash-world');
  const guides = container.querySelector('#dash-guides');

  renderWidgets(world, data);
  renderPins(world);
  wireCanvas(container, viewport, world, guides, data);
  applyTransform(viewport, world, guides);

  container.querySelector('#btn-edit-dashboard').addEventListener('click', () => {
    isEditMode = true;
    viewport.classList.add('edit-mode');
    renderWidgets(world, data);
    renderPins(world);
    showEditHeader(container, viewport, world, guides, data);
  });
}

// ── Widget rendering (positioned absolutely in world space) ──────────────────────
function renderWidgets(world, data) {
  world.innerHTML = '';
  live.widgets.forEach(item => {
    const mod = MODULES[item.id];
    if (!mod) return;

    const widgetControls = `
      <div style="display:flex;align-items:center;gap:4px;">
        ${mod.configurable ? `
          <button class="btn btn-ghost btn-icon btn-sm btn-configure" data-instance-id="${item.instanceId}" title="Configure widget" style="pointer-events:auto;position:relative;z-index:20;">
            <span class="material-icons-outlined" style="font-size:15px;${!isEditMode ? 'opacity:0.5;' : ''}">settings</span>
          </button>` : ''}
        ${isEditMode ? `
          <button class="btn btn-ghost btn-icon btn-sm btn-remove" data-instance-id="${item.instanceId}" title="Remove widget" style="pointer-events:auto;position:relative;z-index:20;">
            <span class="material-icons-outlined" style="font-size:15px;">close</span>
          </button>` : ''}
      </div>`;

    const kpiCardsCount = item.id === 'kpi-cards'
      ? ((hasPermission('Quotes', 'view') ? 1 : 0) + (hasPermission('Invoices', 'view') ? 2 : 0) + (hasPermission('Jobs', 'view') ? 1 : 0))
      : 0;
    const bodyStyle = item.id === 'kpi-cards' ? `style="display:grid; grid-template-columns: repeat(${Math.max(kpiCardsCount, 1)}, 1fr);"` : '';

    const resizeHandles = isEditMode ? `
      <div class="dash-resize dash-resize-r"  data-instance-id="${item.instanceId}" title="Drag to resize width"></div>
      <div class="dash-resize dash-resize-b"  data-instance-id="${item.instanceId}" title="Drag to resize height"></div>
      <div class="dash-resize dash-resize-br" data-instance-id="${item.instanceId}" title="Drag to resize">
        <span class="material-icons-outlined" style="font-size:12px;transform:rotate(45deg);">open_in_full</span>
      </div>` : '';

    const el = document.createElement('div');
    el.className = 'dash-widget' + (isEditMode ? ' edit-mode' : '') + (mod.page ? ' page-widget' : '');
    el.dataset.instanceId = item.instanceId;
    el.dataset.id = item.id;
    el.style.left = item.x + 'px';
    el.style.top = item.y + 'px';
    el.style.width = item.w + 'px';
    el.style.height = item.h + 'px';
    const bodyContent = mod.render ? mod.render(data, item) : '';
    el.innerHTML = `
      <div class="card ${mod.kpiStrip ? 'kpi-strip' : ''}" style="height:100%;display:flex;flex-direction:column;overflow:hidden;margin:0;">
        <div class="card-header dash-drag-handle">
          <span style="font-weight:600;font-size:14px;">${mod.title}</span>
          ${widgetControls}
        </div>
        <div class="card-body" ${bodyStyle} style="flex:1;overflow-y:auto;min-height:0;">${bodyContent}</div>
      </div>
      ${resizeHandles}`;
    world.appendChild(el);

    // Page widgets render a real, live page into their body via a mount hook
    if (mod.page && mod.mount) {
      const body = el.querySelector('.card-body');
      // In edit mode the body is non-interactive so it doesn't fight widget dragging
      if (isEditMode) body.style.pointerEvents = 'none';
      try { mod.mount(body, item); } catch (e) { body.innerHTML = renderPlaceholder('error_outline', 'Could not load page'); }
    }
  });

  wireWidgetControls(world, data);
  if (isEditMode) wireEditControls(world, data);
}

// ── Page widgets: render a real CRM page live inside a widget body ────────────────
// The shared DataTable wires row clicks as bubble-phase listeners, so a capture-phase
// listener here intercepts them first — letting us open the detail INSIDE the widget
// (Back button returns to the list) instead of navigating the whole app away.
function mountPageWidget(body, cfg) {
  body.classList.add('pw-root');
  let mode = 'list';
  let listFn = null, detailFn = null;

  const showList = () => {
    mode = 'list';
    body.innerHTML = '';
    const host = document.createElement('div');
    host.className = 'pw-host';
    body.appendChild(host);
    if (listFn) { try { listFn(host); } catch (e) { host.innerHTML = renderPlaceholder('error_outline', 'Failed to load'); } }
  };

  const showDetail = (id) => {
    if (!detailFn) return;
    mode = 'detail';
    body.innerHTML = '';
    const bar = document.createElement('div');
    bar.className = 'pw-backbar';
    bar.innerHTML = `<button class="btn btn-secondary btn-sm pw-back"><span class="material-icons-outlined" style="font-size:16px;">arrow_back</span> Back to list</button>`;
    const host = document.createElement('div');
    host.className = 'pw-host';
    body.appendChild(bar);
    body.appendChild(host);
    bar.querySelector('.pw-back').addEventListener('click', showList);
    try { detailFn(host, { id }); } catch (e) { host.innerHTML = renderPlaceholder('error_outline', 'Failed to load detail'); }
  };

  // Intercept list row clicks (capture phase) → open detail in-widget.
  // Only when this page has a detail view; otherwise rows behave normally.
  if (cfg.detail) {
    body.addEventListener('click', e => {
      if (mode !== 'list') return;
      const tr = e.target.closest('tbody tr[data-id]');
      if (!tr) return;
      if (e.target.closest('.dt-select-cell') || e.target.closest('input')) return;
      e.stopPropagation();
      e.preventDefault();
      showDetail(tr.dataset.id);
    }, true);
  }

  // Lazy-load the page modules, then render the list
  Promise.all([cfg.list(), cfg.detail ? cfg.detail() : Promise.resolve(null)])
    .then(([l, d]) => { listFn = l; detailFn = d; showList(); })
    .catch(() => { body.innerHTML = renderPlaceholder('error_outline', 'Could not load page'); });
}

// ── Pins (home pin + navigation pins) ───────────────────────────────────────────
function renderPins(world) {
  world.querySelectorAll('.dash-pin').forEach(p => p.remove());

  // Keep the right-hand Views section in sync with the current views
  renderViewsSection();

  // Saved views are INVISIBLE during normal use — represented only by edge lines + chips.
  // Their anchor markers appear only in edit mode, so they can be moved / edited / removed.
  if (!isEditMode) return;

  // Every saved view (incl. the default Home) renders as a movable/editable/removable marker
  live.pins.forEach(ref => {
    const el = document.createElement('div');
    el.className = 'dash-pin edit-mode';
    el.dataset.pinId = ref.id;
    el.style.left = ref.x + 'px';
    el.style.top = ref.y + 'px';
    el.style.setProperty('--pin-color', ref.color);
    el.innerHTML = `
      <div class="dash-pin-marker" style="background:${ref.color};">
        <span class="material-icons-outlined" style="font-size:15px;">${ref.icon}</span>
      </div>
      ${ref.label ? `<div class="dash-pin-label">${ref.label}</div>` : ''}
      <button class="dash-pin-remove" title="Remove view"><span class="material-icons-outlined" style="font-size:13px;">close</span></button>`;

    world.appendChild(el);
    wirePin(el, ref, ref.id, world);
  });
}

// Wire a single saved-view marker (edit mode): drag · edit-on-click · remove
function wirePin(el, ref, id, world) {
  const viewport = document.querySelector('#dash-viewport');
  const guides = document.querySelector('#dash-guides');

  const rm = el.querySelector('.dash-pin-remove');
  if (rm) {
    rm.addEventListener('click', e => {
      e.stopPropagation();
      live.pins = live.pins.filter(p => p.id !== id);
      renderPins(world);
      updateGuides(viewport, guides);
    });
  }

  const marker = el.querySelector('.dash-pin-marker');
  if (!marker) return;
  marker.style.cursor = isEditMode ? 'grab' : 'pointer';

  marker.addEventListener('mousedown', e => {
    if (e.button !== 0) return;
    e.stopPropagation(); // never start a canvas pan from a pin
    const startX = e.clientX, startY = e.clientY;
    const origX = ref.x, origY = ref.y;
    let moved = false;

    const onMove = mv => {
      const dx = mv.clientX - startX, dy = mv.clientY - startY;
      if (!moved && Math.hypot(dx, dy) < 5) return;
      if (!isEditMode) return; // view mode: pins don't drag, a click flies to them
      if (!moved) { moved = true; el.classList.add('dragging'); }
      ref.x = origX + dx / live.view.zoom;
      ref.y = origY + dy / live.view.zoom;
      el.style.left = ref.x + 'px';
      el.style.top = ref.y + 'px';
    };
    const onUp = () => {
      document.removeEventListener('mousemove', onMove);
      document.removeEventListener('mouseup', onUp);
      if (moved) {
        el.classList.remove('dragging');
        ref.x = snap(ref.x);
        ref.y = snap(ref.y);
        el.style.left = ref.x + 'px';
        el.style.top = ref.y + 'px';
        updateGuides(viewport, guides);
      } else {
        // A click with no drag: edit it (edit mode) or fly to it (view mode)
        if (isEditMode) openPinEditor(viewport, world, guides, { pin: ref });
        else flyTo(viewport, ref.x, ref.y, ref.zoom);
      }
    };
    document.addEventListener('mousemove', onMove);
    document.addEventListener('mouseup', onUp);
  });
}

// ── Transform + guides ─────────────────────────────────────────────────────────
function applyTransform(viewport, world, guides) {
  if (viewport.scrollTop || viewport.scrollLeft) { viewport.scrollTop = 0; viewport.scrollLeft = 0; }
  const { panX, panY, zoom } = live.view;
  world.style.transform = `translate(${panX}px, ${panY}px) scale(${zoom})`;
  viewport.style.backgroundPosition = `${panX}px ${panY}px`;
  viewport.style.backgroundSize = `${GRID * zoom}px ${GRID * zoom}px`;
  const pct = viewport.querySelector('#zoom-pct');
  if (pct) pct.textContent = Math.round(zoom * 100) + '%';
  updateGuides(viewport, guides);
}


// Draw a short coloured stroke on whichever wall an off-screen saved view lies beyond.
// The stroke is a fixed total length. When the view is beyond a CORNER, the stroke runs
// along both edges AND curves smoothly around the canvas's rounded corner (via an SVG
// path), so it wraps the corner cleanly instead of meeting at a hard 90°. Length is split
// between the two edges by direction. Colour matches the view.
function updateGuides(viewport, guides) {
  const vw = viewport.clientWidth;
  const vh = viewport.clientHeight;
  const { panX, panY, zoom } = live.view;
  const T = 5;        // stroke thickness
  const LEN = 46;     // total stroke length
  const R = 16;       // canvas corner radius (matches --border-radius-md)
  const M = 6;        // inset from the very edge so the stroke sits comfortably inside
  const ARC = 18;     // length budget the corner curve consumes
  const PAD = R + LEN / 2; // keep single-edge strokes clear of the corner arcs

  guides.innerHTML = '';
  const NS = 'http://www.w3.org/2000/svg';
  const svg = document.createElementNS(NS, 'svg');
  svg.setAttribute('width', vw);
  svg.setAttribute('height', vh);
  svg.style.position = 'absolute';
  svg.style.inset = '0';
  let any = false;

  const addPath = (d, color) => {
    const path = document.createElementNS(NS, 'path');
    path.setAttribute('d', d);
    path.setAttribute('stroke', color);
    path.setAttribute('stroke-width', T);
    path.setAttribute('fill', 'none');
    path.setAttribute('stroke-linecap', 'round');
    path.setAttribute('stroke-linejoin', 'round');
    svg.appendChild(path);
    any = true;
  };

  live.pins.forEach(p => {
    const sx = panX + p.x * zoom;
    const sy = panY + p.y * zoom;
    if (sx >= 0 && sx <= vw && sy >= 0 && sy <= vh) return; // in frame → no indicator

    const onLeft = sx < 0, onRight = sx > vw, onTop = sy < 0, onBottom = sy > vh;

    if ((onLeft || onRight) && (onTop || onBottom)) {
      // Corner: straight along each edge + a quadratic curve hugging the rounded corner
      const ox = onRight ? (sx - vw) : -sx;
      const oy = onBottom ? (sy - vh) : -sy;
      const sum = ox + oy || 1;
      const straight = Math.max(0, LEN - ARC);
      const vLen = straight * (ox / sum); // more horizontal overshoot → more along the side edge
      const hLen = straight * (oy / sum);

      const xEdge = onLeft ? M : vw - M;     // x of the vertical run
      const yEdge = onTop ? M : vh - M;       // y of the horizontal run
      const arcCy = onTop ? R : vh - R;       // where the curve meets the vertical edge
      const arcCx = onLeft ? R : vw - R;      // where the curve meets the horizontal edge
      const vFarY = onBottom ? arcCy - vLen : arcCy + vLen;
      const hFarX = onRight ? arcCx - hLen : arcCx + hLen;

      addPath(`M ${xEdge} ${vFarY} L ${xEdge} ${arcCy} Q ${xEdge} ${yEdge} ${arcCx} ${yEdge} L ${hFarX} ${yEdge}`, p.color);
    } else if (onLeft || onRight) {
      const x = onLeft ? M : vw - M;
      const cy = clamp(sy, PAD, vh - PAD);
      addPath(`M ${x} ${cy - LEN / 2} L ${x} ${cy + LEN / 2}`, p.color);
    } else {
      const y = onTop ? M : vh - M;
      const cx = clamp(sx, PAD, vw - PAD);
      addPath(`M ${cx - LEN / 2} ${y} L ${cx + LEN / 2} ${y}`, p.color);
    }
  });

  if (any) guides.appendChild(svg);
}

// The "Views section": a clickable column of view chips, above the zoom controls
function renderViewsSection() {
  const cont = document.querySelector('#dash-views');
  const viewport = document.querySelector('#dash-viewport');
  if (!cont || !viewport) return;

  cont.innerHTML = '';
  live.pins.forEach(ref => {
    const chip = document.createElement('button');
    chip.className = 'dash-view-chip';
    chip.title = ref.label || 'Saved view';
    chip.style.setProperty('--chip-color', ref.color);
    chip.innerHTML = `<span class="material-icons-outlined" style="font-size:16px;">${ref.icon}</span>`;
    chip.addEventListener('click', () => flyTo(viewport, ref.x, ref.y, ref.zoom));
    cont.appendChild(chip);
  });
}

function flyTo(viewport, wx, wy, targetZoom) {
  const vw = viewport.clientWidth, vh = viewport.clientHeight;
  if (typeof targetZoom === 'number') live.view.zoom = clamp(targetZoom, ZOOM_MIN, ZOOM_MAX);
  const { zoom } = live.view;
  live.view.panX = vw / 2 - wx * zoom;
  live.view.panY = vh / 2 - wy * zoom;
  const world = viewport.querySelector('#dash-world');
  const guides = viewport.querySelector('#dash-guides');
  world.style.transition = 'transform 0.35s cubic-bezier(0.16,1,0.3,1)';
  applyTransform(viewport, world, guides);
  setTimeout(() => { world.style.transition = ''; }, 380);
}

function resetView(viewport) {
  const vw = viewport.clientWidth, vh = viewport.clientHeight;
  if (!live.widgets.length) {
    live.view = { panX: 40, panY: 40, zoom: 1 };
  } else {
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    live.widgets.forEach(w => {
      minX = Math.min(minX, w.x); minY = Math.min(minY, w.y);
      maxX = Math.max(maxX, w.x + w.w); maxY = Math.max(maxY, w.y + w.h);
    });
    const pad = 60;
    const bw = (maxX - minX) + pad * 2;
    const bh = (maxY - minY) + pad * 2;
    // Floor the fit zoom to a clean 5% step so it stays on-grid AND still fits
    const rawFit = clamp(Math.min(vw / bw, vh / bh), ZOOM_MIN, ZOOM_MAX);
    const zoom = clamp(Math.floor(rawFit / ZOOM_STEP) * ZOOM_STEP, ZOOM_MIN, ZOOM_MAX);
    const cx = (minX + maxX) / 2, cy = (minY + maxY) / 2;
    live.view = { zoom, panX: vw / 2 - cx * zoom, panY: vh / 2 - cy * zoom };
  }
  const world = viewport.querySelector('#dash-world');
  const guides = viewport.querySelector('#dash-guides');
  world.style.transition = 'transform 0.35s cubic-bezier(0.16,1,0.3,1)';
  applyTransform(viewport, world, guides);
  setTimeout(() => { world.style.transition = ''; }, 380);
}

// ── Canvas interaction: pan, zoom, pin-drop ──────────────────────────────────────
function wireCanvas(container, viewport, world, guides, data) {
  // Zoom toward an anchor point (screen coords relative to viewport)
  const zoomTo = (newZoom, ax, ay) => {
    const z = snapZoom(newZoom);
    const { panX, panY, zoom } = live.view;
    const wx = (ax - panX) / zoom;
    const wy = (ay - panY) / zoom;
    live.view.zoom = z;
    live.view.panX = ax - wx * z;
    live.view.panY = ay - wy * z;
    applyTransform(viewport, world, guides);
  };

  viewport.addEventListener('wheel', e => {
    // Ctrl + wheel = zoom toward the cursor
    if (e.ctrlKey) {
      e.preventDefault();
      const rect = viewport.getBoundingClientRect();
      const step = e.deltaY < 0 ? ZOOM_STEP : -ZOOM_STEP;
      zoomTo(live.view.zoom + step, e.clientX - rect.left, e.clientY - rect.top);
      return;
    }

    // Plain wheel = scroll the canvas — UNLESS the cursor is over a widget body
    // that can still scroll in that direction (then let the widget scroll natively).
    const body = e.target.closest('.card-body');
    if (body) {
      const canScroll = body.scrollHeight - body.clientHeight > 1;
      if (canScroll) {
        const atTop = body.scrollTop <= 0;
        const atBottom = body.scrollTop + body.clientHeight >= body.scrollHeight - 1;
        const goingUp = e.deltaY < 0;
        if (!((goingUp && atTop) || (!goingUp && atBottom))) return; // widget scrolls itself
      }
    }

    e.preventDefault();
    live.view.panY -= e.deltaY;
    live.view.panX -= e.deltaX; // trackpad horizontal / shift-wheel
    applyTransform(viewport, world, guides);
  }, { passive: false });

  // On-screen zoom buttons (focal point = viewport centre)
  container.querySelector('#zoom-in').addEventListener('click', () =>
    zoomTo(live.view.zoom + ZOOM_STEP, viewport.clientWidth / 2, viewport.clientHeight / 2));
  container.querySelector('#zoom-out').addEventListener('click', () =>
    zoomTo(live.view.zoom - ZOOM_STEP, viewport.clientWidth / 2, viewport.clientHeight / 2));
  container.querySelector('#zoom-pct').addEventListener('click', () =>
    zoomTo(1, viewport.clientWidth / 2, viewport.clientHeight / 2));
  container.querySelector('#zoom-reset').addEventListener('click', () => resetView(viewport));

  // Drag anywhere to pan. A press that doesn't move past a small threshold is
  // treated as a click (so widget links/buttons still work); a press that moves
  // becomes a pan and its trailing click is suppressed.
  let didPan = false;
  viewport.addEventListener('mousedown', e => {
    if (e.button !== 0) return;
    didPan = false; // a fresh press always clears any stale drag-suppression flag
    // Controls and their own draggables handle themselves
    if (e.target.closest('.dash-zoom-controls') || e.target.closest('.dash-guide') ||
        e.target.closest('.dash-topbar button') || e.target.closest('.dash-pin')) return;

    // In edit mode, only the widget's title bar moves it; pressing the body pans the canvas
    if (isEditMode && e.target.closest('.dash-drag-handle')) return;

    const startX = e.clientX, startY = e.clientY;
    const startPanX = live.view.panX, startPanY = live.view.panY;
    let panning = false;

    const onMove = mv => {
      const dx = mv.clientX - startX, dy = mv.clientY - startY;
      if (!panning && Math.hypot(dx, dy) < 5) return; // below threshold: still a click
      if (!panning) { panning = true; viewport.classList.add('panning'); }
      live.view.panX = startPanX + dx;
      live.view.panY = startPanY + dy;
      applyTransform(viewport, world, guides);
    };
    const onUp = () => {
      document.removeEventListener('mousemove', onMove);
      document.removeEventListener('mouseup', onUp);
      viewport.classList.remove('panning');
      if (panning) { didPan = true; }
    };
    document.addEventListener('mousemove', onMove);
    document.addEventListener('mouseup', onUp);
  });

  // Cancel the click that follows a drag-pan so it doesn't trigger links/navigation
  viewport.addEventListener('click', e => {
    if (didPan) { e.stopPropagation(); e.preventDefault(); didPan = false; }
  }, true);

  // Absolutely-positioned widgets create scrollable overflow inside the viewport;
  // a stray focus/anchor scroll would shove the floating topbar out of view. Pin it.
  viewport.addEventListener('scroll', () => {
    if (viewport.scrollTop || viewport.scrollLeft) { viewport.scrollTop = 0; viewport.scrollLeft = 0; }
  });

  window.addEventListener('resize', () => updateGuides(viewport, guides));
}

// Current viewport centre (world coords) + zoom — the framing a "saved view" captures
function currentViewCentre(viewport) {
  const { panX, panY, zoom } = live.view;
  return {
    x: snap((viewport.clientWidth / 2 - panX) / zoom),
    y: snap((viewport.clientHeight / 2 - panY) / zoom),
    zoom,
  };
}

// opts: {} to save the CURRENT view as a new saved view,
//       or { pin } to edit an existing saved view.
function openPinEditor(viewport, world, guides, opts) {
  const editing = !!opts.pin;
  let chosenColor = editing ? opts.pin.color : PIN_COLORS[0];
  let chosenIcon  = editing ? opts.pin.icon  : PIN_ICONS[0];
  const initialLabel = editing ? (opts.pin.label || '') : '';
  let recapture = false; // (edit mode) re-grab centre+zoom from the current view on save

  const content = document.createElement('div');
  content.innerHTML = `
    <div style="display:flex;flex-direction:column;gap:16px;">
      <div>
        <label style="font-size:12px;font-weight:600;display:block;margin-bottom:6px;">Label (optional)</label>
        <input type="text" id="pin-label" class="form-input" placeholder="e.g. Finance view" style="width:100%;" maxlength="24" value="${initialLabel.replace(/"/g, '&quot;')}" />
      </div>
      <div>
        <label style="font-size:12px;font-weight:600;display:block;margin-bottom:6px;">Colour</label>
        <div id="pin-color-row" style="display:flex;gap:8px;">
          ${PIN_COLORS.map(c => `<button type="button" class="pin-swatch" data-color="${c}" style="width:30px;height:30px;border-radius:50%;background:${c};border:3px solid ${c === chosenColor ? 'var(--text-primary)' : 'transparent'};cursor:pointer;"></button>`).join('')}
        </div>
      </div>
      <div>
        <label style="font-size:12px;font-weight:600;display:block;margin-bottom:6px;">Icon</label>
        <div id="pin-icon-row" style="display:flex;gap:8px;flex-wrap:wrap;">
          ${PIN_ICONS.map(ic => `<button type="button" class="pin-icon-opt${ic === chosenIcon ? ' selected' : ''}" data-icon="${ic}" style="width:34px;height:34px;border-radius:8px;border:1px solid var(--border-color);background:${ic === chosenIcon ? 'var(--color-primary-light)' : 'var(--card-bg)'};cursor:pointer;display:flex;align-items:center;justify-content:center;"><span class="material-icons-outlined" style="font-size:18px;">${ic}</span></button>`).join('')}
        </div>
      </div>
      ${editing ? `
      <button type="button" id="pin-recapture" class="btn btn-secondary btn-sm" style="align-self:flex-start;display:flex;align-items:center;gap:6px;">
        <span class="material-icons-outlined" style="font-size:15px;">center_focus_strong</span> Move to current view (centre + zoom)
      </button>
      <div id="pin-recapture-note" style="font-size:11px;color:var(--color-success);display:none;">✓ Will snap to the current view on save</div>` : `
      <div style="font-size:11px;color:var(--text-tertiary);">Captures the current centre and zoom level so you can return to this exact framing.</div>`}
    </div>`;

  content.querySelectorAll('.pin-swatch').forEach(s => s.addEventListener('click', () => {
    chosenColor = s.dataset.color;
    content.querySelectorAll('.pin-swatch').forEach(o => o.style.borderColor = 'transparent');
    s.style.borderColor = 'var(--text-primary)';
  }));
  content.querySelectorAll('.pin-icon-opt').forEach(s => s.addEventListener('click', () => {
    chosenIcon = s.dataset.icon;
    content.querySelectorAll('.pin-icon-opt').forEach(o => { o.style.background = 'var(--card-bg)'; o.classList.remove('selected'); });
    s.style.background = 'var(--color-primary-light)';
    s.classList.add('selected');
  }));
  const recBtn = content.querySelector('#pin-recapture');
  if (recBtn) recBtn.addEventListener('click', () => {
    recapture = true;
    content.querySelector('#pin-recapture-note').style.display = 'block';
  });

  import('../components/Modal.js').then(({ showModal }) => {
    showModal({
      title: editing ? 'Edit Saved View' : 'Save Current View',
      content,
      actions: [
        { label: 'Cancel', className: 'btn-secondary', onClick: c => c() },
        { label: editing ? 'Save' : 'Save View', className: 'btn-primary', onClick: c => {
            const label = content.querySelector('#pin-label').value.trim();
            if (editing) {
              opts.pin.color = chosenColor;
              opts.pin.icon = chosenIcon;
              opts.pin.label = label;
              if (recapture) {
                const v = currentViewCentre(viewport);
                opts.pin.x = v.x; opts.pin.y = v.y; opts.pin.zoom = v.zoom;
              }
            } else {
              const v = currentViewCentre(viewport);
              live.pins.push({ id: 'pin_' + Math.random().toString(36).substr(2, 9), x: v.x, y: v.y, zoom: v.zoom, color: chosenColor, icon: chosenIcon, label });
            }
            renderPins(world);
            updateGuides(viewport, guides);
            c();
          } },
      ],
    });
  });
}

// ── Widget drag + resize (edit mode) ─────────────────────────────────────────────
function wireEditControls(world, data) {
  const viewport = document.querySelector('#dash-viewport');
  const guides = document.querySelector('#dash-guides');

  // Remove widget
  world.querySelectorAll('.btn-remove').forEach(btn => {
    btn.addEventListener('click', e => {
      e.stopPropagation();
      const instId = e.currentTarget.dataset.instanceId;
      live.widgets = live.widgets.filter(i => i.instanceId !== instId);
      renderWidgets(world, data);
      renderPins(world);
      updateGuides(viewport, guides);
    });
  });

  // Drag to move — only by grabbing the widget's title bar (so the body can be
  // pressed without accidentally picking up the widget; the body pans the canvas).
  world.querySelectorAll('.dash-widget.edit-mode').forEach(el => {
    const handle = el.querySelector('.dash-drag-handle');
    if (!handle) return;
    handle.addEventListener('mousedown', e => {
      if (e.target.closest('.btn-remove') || e.target.closest('.btn-configure') || e.target.closest('.dash-resize')) return;
      if (e.button !== 0) return;
      e.preventDefault();
      e.stopPropagation();
      const instId = el.dataset.instanceId;
      const item = live.widgets.find(i => i.instanceId === instId);
      if (!item) return;

      const startX = e.clientX, startY = e.clientY;
      const origX = item.x, origY = item.y;
      el.classList.add('dragging');

      const onMove = mv => {
        const dx = (mv.clientX - startX) / live.view.zoom;
        const dy = (mv.clientY - startY) / live.view.zoom;
        item.x = origX + dx;
        item.y = origY + dy;
        el.style.left = item.x + 'px';
        el.style.top = item.y + 'px';
      };
      const onUp = () => {
        document.removeEventListener('mousemove', onMove);
        document.removeEventListener('mouseup', onUp);
        el.classList.remove('dragging');
        item.x = snap(item.x);
        item.y = snap(item.y);
        resolveOverlap(item);
        el.style.left = item.x + 'px';
        el.style.top = item.y + 'px';
        updateGuides(viewport, guides);
      };
      document.addEventListener('mousemove', onMove);
      document.addEventListener('mouseup', onUp);
    });
  });

  // Resize handles
  world.querySelectorAll('.dash-resize').forEach(handle => {
    handle.addEventListener('mousedown', e => {
      e.preventDefault();
      e.stopPropagation();
      const instId = handle.dataset.instanceId;
      const item = live.widgets.find(i => i.instanceId === instId);
      const el = world.querySelector(`.dash-widget[data-instance-id="${instId}"]`);
      if (!item || !el) return;

      const isR = handle.classList.contains('dash-resize-r') || handle.classList.contains('dash-resize-br');
      const isB = handle.classList.contains('dash-resize-b') || handle.classList.contains('dash-resize-br');
      const startX = e.clientX, startY = e.clientY;
      const origW = item.w, origH = item.h;
      el.classList.add('dragging');

      const onMove = mv => {
        if (isR) {
          const dw = (mv.clientX - startX) / live.view.zoom;
          item.w = Math.max(MIN_W, origW + dw);
          el.style.width = item.w + 'px';
        }
        if (isB) {
          const dh = (mv.clientY - startY) / live.view.zoom;
          item.h = Math.max(MIN_H, origH + dh);
          el.style.height = item.h + 'px';
        }
      };
      const onUp = () => {
        document.removeEventListener('mousemove', onMove);
        document.removeEventListener('mouseup', onUp);
        el.classList.remove('dragging');
        item.w = Math.max(MIN_W, snap(item.w));
        item.h = Math.max(MIN_H, snap(item.h));
        el.style.width = item.w + 'px';
        el.style.height = item.h + 'px';
        updateGuides(viewport, guides);
      };
      document.addEventListener('mousemove', onMove);
      document.addEventListener('mouseup', onUp);
    });
  });
}

// Nudge a just-dropped widget downward until it no longer overlaps any other widget
// Move a just-dropped widget to the NEAREST free grid position to where it was
// dropped (expanding-ring search), rather than shoving it far down/out of view.
function resolveOverlap(item) {
  const overlaps = (a, b) =>
    a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
  const others = live.widgets.filter(w => w.instanceId !== item.instanceId);
  const collidesAt = (x, y) => others.some(o => overlaps({ x, y, w: item.w, h: item.h }, o));

  if (!collidesAt(item.x, item.y)) return; // already clear

  const ox = item.x, oy = item.y;
  let best = null, bestDist = Infinity;

  for (let r = 1; r <= 300 && !best; r++) {
    for (let dx = -r; dx <= r; dx++) {
      for (let dy = -r; dy <= r; dy++) {
        if (Math.max(Math.abs(dx), Math.abs(dy)) !== r) continue; // perimeter of ring r only
        const x = ox + dx * GRID, y = oy + dy * GRID;
        if (collidesAt(x, y)) continue;
        const dist = (x - ox) * (x - ox) + (y - oy) * (y - oy);
        if (dist < bestDist) { bestDist = dist; best = { x, y }; }
      }
    }
    // once a ring yields any free cell, the nearest within it is the global nearest
  }

  if (best) { item.x = best.x; item.y = best.y; }
}

// ── Inner widget interactions (preserved verbatim from the grid version) ─────────
function wireWidgetControls(grid, data) {
  // Configure button (always available if widget is configurable)
  grid.querySelectorAll('.btn-configure').forEach(btn => {
    btn.addEventListener('click', e => {
      e.stopPropagation();
      const instId = e.currentTarget.dataset.instanceId;
      const item = live.widgets.find(i => i.instanceId === instId);
      if (!item) return;

      if (item.id === 'pinned-job') {
        const jobs = data.jobs;
        const content = document.createElement('div');
        content.innerHTML = `
          <div style="margin-bottom: 12px;">
            <input type="text" id="job-search" placeholder="Search by Job #, Title or Customer..."
              style="width: 100%; padding: 10px; border: 1px solid var(--border-color); border-radius: 6px; font-size: 14px; outline: none; transition: border-color 0.2s;"
              onfocus="this.style.borderColor='var(--color-primary)'"
              onblur="this.style.borderColor='var(--border-color)'">
          </div>
          <div id="job-list-container" style="max-height:300px;overflow-y:auto;display:flex;flex-direction:column;gap:8px;">
          </div>
        `;

        function updateJobList(filter = '') {
          const cont = content.querySelector('#job-list-container');
          const filtered = jobs.filter(j =>
            j.number.toLowerCase().includes(filter.toLowerCase()) ||
            j.title.toLowerCase().includes(filter.toLowerCase()) ||
            j.customerName.toLowerCase().includes(filter.toLowerCase())
          );

          cont.innerHTML = filtered.length > 0 ? filtered.map(j => `
            <div class="job-option" data-job-id="${j.id}" style="padding:10px;border:1px solid var(--border-color);border-radius:6px;cursor:pointer;transition:all 0.15s;"
              onmouseover="this.style.borderColor='var(--color-primary)';this.style.background='var(--color-primary-light)';"
              onmouseout="this.style.borderColor='var(--border-color)';this.style.background='';">
              <div style="font-weight:600;font-size:13px;">#${j.number} - ${j.title}</div>
              <div style="font-size:11px;color:var(--text-tertiary);">${j.customerName}</div>
            </div>
          `).join('') : `<div style="text-align:center; padding:20px; color:var(--text-tertiary); font-size:13px;">No matching jobs found</div>`;

          cont.querySelectorAll('.job-option').forEach(opt => {
            opt.addEventListener('click', () => {
              item.config = { ...item.config, jobId: opt.dataset.jobId };
              if (!isEditMode) saveLayout();
              document.querySelector('.modal-overlay')?.remove();
              renderWidgets(grid, data);
              renderPins(grid);
            });
          });
        }

        updateJobList();
        content.querySelector('#job-search').addEventListener('input', e => updateJobList(e.target.value));

        import('../components/Modal.js').then(({ showModal }) => {
          showModal({
            title: 'Select Job to Pin',
            content,
            actions: [{ label: 'Cancel', className: 'btn-secondary', onClick: c => c() }]
          });
        });
      }
    });
  });

  // 1. Unassigned Jobs dispatching
  grid.querySelectorAll('.select-assign-tech').forEach(select => {
    select.addEventListener('change', e => {
      const jobId = e.target.dataset.jobId;
      const techId = e.target.value;
      if (!techId) return;
      const techs = store.getAll('technicians');
      const tech = techs.find(t => t.id === techId);
      if (!tech) return;

      store.update('jobs', jobId, { technicianId: tech.id, technicianName: tech.name, status: 'Scheduled' });

      const schedule = store.getAll('schedule') || [];
      const job = store.getById('jobs', jobId);
      schedule.push({
        id: `sched_` + Date.now(),
        jobId: job.id,
        jobNumber: job.number,
        title: job.title,
        technicianId: tech.id,
        technicianName: tech.name,
        color: tech.color || '#3B82F6',
        dayOffset: 0,
        startHour: 9,
        endHour: 13,
        customerName: job.customerName,
        siteAddress: job.siteAddress || ''
      });
      store.save('schedule', schedule);

      import('../components/Notifications.js').then(({ showToast }) => {
        showToast(`Job assigned to ${tech.name}`, 'success');
      });
      window.__fieldForge.reloadDashboard?.();
    });
  });

  // 2. Uninvoiced completed invoicing
  grid.querySelectorAll('.btn-quick-invoice').forEach(btn => {
    btn.addEventListener('click', e => {
      const jobId = e.target.dataset.jobId;
      const job = store.getById('jobs', jobId);
      if (!job) return;

      const settings = store.getSettings();
      const matCost = calculateTotalBillableMaterials(job.materials || [], settings);
      const profile = settings.laborRates.find(r => r.id === job.laborRateProfileId) || settings.laborRates.find(r => r.isDefault);
      const labHours = (job.estimatedHours || 0);
      const billableLab = Math.max(labHours * (profile?.rate || 85), profile?.minCallOutFee || 0);
      const subtotal = matCost + billableLab;
      const tax = subtotal * 0.1;

      const inv = store.create('invoices', {
        jobNumber: job.number,
        jobId: job.id,
        customerId: job.customerId,
        customerName: job.customerName,
        contactName: job.contactName || '',
        status: 'Draft',
        lineItems: [
          { description: `${job.title} - Labor`, amount: billableLab },
          { description: `${job.title} - Materials`, amount: matCost },
        ],
        subtotal,
        tax,
        total: subtotal + tax,
        invoiceType: 'Standard',
        issueDate: new Date().toISOString(),
        dueDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        paidDate: null,
        notes: ''
      });

      store.update('jobs', job.id, { status: 'Invoiced' });

      import('../components/Notifications.js').then(({ showToast }) => {
        showToast(`Standard Invoice Created for #${job.number}`, 'success');
      });
      window.location.hash = `/invoices/${inv.id}`;
    });
  });

  // 3. Low stock PO reordering
  grid.querySelectorAll('.btn-quick-reorder').forEach(btn => {
    btn.addEventListener('click', e => {
      const stockId = e.currentTarget.dataset.stockId;
      const item = store.getById('stock', stockId);
      if (!item) return;

      const orderQty = item.reorderLevel * 2 || 20;
      const totalCost = item.costPrice * orderQty;

      const po = store.create('purchaseOrders', {
        number: 'PO-' + Date.now().toString().substr(-6),
        supplierName: item.supplier || 'General Supplier',
        supplierId: 'sup_1',
        issueDate: new Date().toISOString(),
        status: 'Draft',
        total: totalCost,
        lineItems: [
          { name: item.name, sku: item.sku, qty: orderQty, rate: item.costPrice, total: totalCost }
        ]
      });

      import('../components/Notifications.js').then(({ showToast }) => {
        showToast(`PO ${po.number} drafted successfully!`, 'success');
      });
      window.location.hash = `/purchase-orders`;
    });
  });

  // 5. Timesheet exception quick approvals
  grid.querySelectorAll('.btn-quick-ts-approve').forEach(btn => {
    btn.addEventListener('click', e => {
      const tsId = e.currentTarget.dataset.tsId;
      store.update('timesheets', tsId, { status: 'Approved' });
      import('../components/Notifications.js').then(({ showToast }) => {
        showToast('Timesheet entry approved', 'success');
      });
      window.__fieldForge.reloadDashboard?.();
    });
  });

  grid.querySelectorAll('.btn-quick-ts-reject').forEach(btn => {
    btn.addEventListener('click', e => {
      const tsId = e.currentTarget.dataset.tsId;
      store.update('timesheets', tsId, { status: 'Rejected' });
      import('../components/Notifications.js').then(({ showToast }) => {
        showToast('Timesheet entry rejected', 'error');
      });
      window.__fieldForge.reloadDashboard?.();
    });
  });

  // 7. Maintenance quick dispatching
  grid.querySelectorAll('.btn-maint-dispatch').forEach(btn => {
    btn.addEventListener('click', e => {
      const planId = e.currentTarget.dataset.planId;
      const plan = store.getById('maintenancePlans', planId);
      if (!plan) return;

      const assets = store.getAll('assets') || [];
      const asset = assets.find(a => a.id === plan.assetId);

      const job = store.create('jobs', {
        number: 'J-' + Date.now().toString().substr(-6),
        customerId: asset?.customerId || 'cust_1',
        customerName: 'Internal Asset Maintenance',
        siteAddress: asset?.site || 'Main Workshop',
        title: plan.name,
        type: 'General Maintenance',
        status: 'Scheduled',
        priority: 'High',
        technicianId: 'tech1',
        technicianName: 'Mark Sullivan',
        scheduledDate: new Date().toISOString().split('T')[0],
        estimatedHours: 4,
        laborCost: 200,
        materialCost: 0,
        tasks: [
          { id: 'p1', name: 'Maintenance Run', status: 'In Progress', progress: 50 }
        ]
      });

      const nextDate = new Date();
      nextDate.setMonth(nextDate.getMonth() + 3);
      store.update('maintenancePlans', plan.id, { nextServiceDate: nextDate.toISOString().split('T')[0] });

      import('../components/Notifications.js').then(({ showToast }) => {
        showToast(`Maintenance Job ${job.number} Dispatched!`, 'success');
      });
      window.__fieldForge.reloadDashboard?.();
    });
  });

  // 9. Daily To-Do Checklist persistency
  const currentUser = JSON.parse(localStorage.getItem('currentUser') || 'null');
  const userKey = currentUser ? `todo_${currentUser.id}` : 'todo_default';

  grid.querySelectorAll('.todo-item-check').forEach(chk => {
    chk.addEventListener('change', e => {
      let todos = [];
      try { todos = JSON.parse(localStorage.getItem(userKey) || '[]'); } catch(err) {}
      const idx = e.target.dataset.idx;
      if (todos[idx]) {
        todos[idx].completed = e.target.checked;
        localStorage.setItem(userKey, JSON.stringify(todos));
      }
      window.__fieldForge.reloadDashboard?.();
    });
  });

  grid.querySelectorAll('.btn-remove-todo').forEach(btn => {
    btn.addEventListener('click', e => {
      let todos = [];
      try { todos = JSON.parse(localStorage.getItem(userKey) || '[]'); } catch(err) {}
      const idx = e.currentTarget.dataset.idx;
      todos.splice(idx, 1);
      localStorage.setItem(userKey, JSON.stringify(todos));
      window.__fieldForge.reloadDashboard?.();
    });
  });

  const todoInput = grid.querySelector('#todo-input-field');
  const todoAddBtn = grid.querySelector('#btn-add-todo');

  if (todoAddBtn && todoInput) {
    const handleAdd = () => {
      const text = todoInput.value.trim();
      if (!text) return;
      let todos = [];
      try { todos = JSON.parse(localStorage.getItem(userKey) || '[]'); } catch(err) {}
      todos.push({ text, completed: false });
      localStorage.setItem(userKey, JSON.stringify(todos));
      todoInput.value = '';
      window.__fieldForge.reloadDashboard?.();
    };

    todoAddBtn.addEventListener('click', handleAdd);
    todoInput.addEventListener('keydown', e => {
      if (e.key === 'Enter') handleAdd();
    });
  }

  // 10. Quote approvals
  grid.querySelectorAll('.btn-quote-approve').forEach(btn => {
    btn.addEventListener('click', e => {
      const qId = e.currentTarget.dataset.quoteId;
      store.update('quotes', qId, { status: 'Accepted' });
      import('../components/Notifications.js').then(({ showToast }) => {
        showToast('Quote status marked as Accepted', 'success');
      });
      window.__fieldForge.reloadDashboard?.();
    });
  });

  grid.querySelectorAll('.btn-quote-decline').forEach(btn => {
    btn.addEventListener('click', e => {
      const qId = e.currentTarget.dataset.quoteId;
      store.update('quotes', qId, { status: 'Declined' });
      import('../components/Notifications.js').then(({ showToast }) => {
        showToast('Quote status marked as Declined', 'error');
      });
      window.__fieldForge.reloadDashboard?.();
    });
  });
}

// ── Edit-mode header (Add Widget · Drop Pin · Reset View · Reset Default · Cancel · Save) ──
function showEditHeader(container, viewport, world, guides, data) {
  const headerActions = container.querySelector('#dashboard-header-actions');
  const editBtn = container.querySelector('#btn-edit-dashboard');
  editBtn.style.display = 'none';
  headerActions.innerHTML = `
    <button class="btn btn-secondary btn-sm" id="btn-add-widget">
      <span class="material-icons-outlined" style="font-size:16px;">add</span> Add Widget
    </button>
    <button class="btn btn-secondary btn-sm" id="btn-save-view" title="Save the current centre + zoom as a quick-jump view">
      <span class="material-icons-outlined" style="font-size:16px;">bookmark_add</span> Save View
    </button>
    <button class="btn btn-ghost btn-sm" id="btn-reset-default" title="Reset to default dashboard">Reset to Default</button>
    <div style="width:1px; height:20px; background:var(--border-color); margin:0 4px;"></div>
    <button class="btn btn-secondary btn-sm" id="btn-cancel-edit">Cancel</button>
    <button class="btn btn-primary btn-sm" id="btn-save-layout">
      <span class="material-icons-outlined" style="font-size:16px;">save</span> Save Layout
    </button>`;

  const exitEdit = () => {
    isEditMode = false;
    viewport.classList.remove('edit-mode');
    editBtn.style.display = '';
    headerActions.innerHTML = getHeaderActionsHtml();
    renderWidgets(world, data);
    renderPins(world);
    updateGuides(viewport, guides);
  };

  headerActions.querySelector('#btn-save-view').addEventListener('click', () => {
    openPinEditor(viewport, world, guides, {}); // captures the current centre + zoom
  });

  headerActions.querySelector('#btn-reset-default').addEventListener('click', () => {
    if (confirm('Reset your dashboard to the default layout? This clears your widgets and saved views.')) {
      live.widgets = defaultLayoutForUser();
      live.pins = [makeHomeView(live.widgets)];
      renderWidgets(world, data);
      renderPins(world);
      resetView(viewport);
    }
  });

  headerActions.querySelector('#btn-save-layout').addEventListener('click', () => {
    saveLayout();
    exitEdit();
    import('../components/Notifications.js').then(({ showToast }) => {
      showToast('Dashboard layout saved', 'success');
    }).catch(() => {});
  });

  headerActions.querySelector('#btn-cancel-edit').addEventListener('click', () => {
    const loaded = loadLayout();
    live.widgets = loaded.widgets;
    live.pins = loaded.pins;
    live.view = loaded.view;
    applyTransform(viewport, world, guides);
    exitEdit();
  });

  headerActions.querySelector('#btn-add-widget').addEventListener('click', () => {
    // Only offer modules the user is permitted to see
    const available = Object.entries(MODULES).filter(([id]) => widgetAllowed(id));
    const content = document.createElement('div');
    content.innerHTML = `<div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;max-height:420px;overflow-y:auto;">
          ${available.map(([id, mod]) => `
            <div data-id="${id}" style="padding:12px;border:1px solid var(--border-color);border-radius:8px;cursor:pointer;display:flex;align-items:center;gap:8px;transition:all 0.15s;"
              onmouseover="this.style.borderColor='var(--color-primary)';this.style.background='var(--color-primary-light)';"
              onmouseout="this.style.borderColor='var(--border-color)';this.style.background='';">
              <span class="material-icons-outlined" style="color:var(--color-primary);font-size:18px;">widgets</span>
              <div>
                <div style="font-weight:600;font-size:13px;">${mod.title}</div>
                <div style="font-size:11px;color:var(--text-tertiary);">${mod.defaultW} · ${mod.defaultH}</div>
              </div>
            </div>`).join('')}
        </div>`;

    import('../components/Modal.js').then(({ showModal }) => {
      showModal({ title: 'Add Widget', content, actions: [{ label: 'Close', className: 'btn-secondary', onClick: c => c() }] });
      content.querySelectorAll('[data-id]').forEach(el => {
        el.addEventListener('click', e => {
          const id = e.currentTarget.dataset.id;
          const mod = MODULES[id];
          // Drop the new widget near the current viewport centre, then de-overlap
          const cx = (viewport.clientWidth / 2 - live.view.panX) / live.view.zoom;
          const cy = (viewport.clientHeight / 2 - live.view.panY) / live.view.zoom;
          const item = {
            id,
            instanceId: 'inst_' + Math.random().toString(36).substr(2, 9),
            x: snap(cx - (W_PX[mod.defaultW] || 460) / 2),
            y: snap(cy - (H_PX[mod.defaultH] || 200) / 2),
            w: W_PX[mod.defaultW] || 460,
            h: H_PX[mod.defaultH] || 200,
          };
          resolveOverlap(item);
          live.widgets.push(item);
          document.querySelector('.modal-overlay')?.remove();
          renderWidgets(world, data);
          renderPins(world);
          updateGuides(viewport, guides);
        });
      });
    });
  });
}

// ── Module renderers ──────────────────────────────────────────────────────────

function renderKpiCards(data, item) {
  const activeJobs    = data.jobs.filter(j => j.status === 'In Progress' || j.status === 'Scheduled').length;
  const pendingQuotes = data.quotes.filter(q => q.status === 'Sent' || q.status === 'Draft').length;
  const overdue       = data.invoices.filter(i => i.status === 'Overdue').length;
  const revenue       = data.invoices.filter(i => i.status === 'Paid').reduce((s, i) => s + (i.total || 0), 0);

  const canViewQuotes = hasPermission('Quotes', 'view');
  const canViewInvoices = hasPermission('Invoices', 'view');

  const cards = [];

  if (canViewInvoices) {
    cards.push({ label: 'Total Revenue', value: '$' + revenue.toLocaleString('en-AU', { minimumFractionDigits: 2, maximumFractionDigits: 2 }), icon: 'payments', color: 'blue', sub: '+12.5% vs last month', pos: true, tooltip: 'Total payments received from all successfully settled invoices.' });
  }

  if (hasPermission('Jobs', 'view')) {
    cards.push({ label: 'Active Jobs', value: activeJobs, icon: 'build', color: 'green', sub: `${data.jobs.length} total`, pos: true, tooltip: 'Total volume of active projects and service tasks currently Scheduled or In Progress.' });
  }

  if (canViewQuotes) {
    cards.push({ label: 'Pending Quotes', value: pendingQuotes, icon: 'request_quote', color: 'orange', sub: `${data.quotes.length} total`, pos: null, tooltip: 'Draft proposals or sent estimates currently awaiting customer response.' });
  }

  if (canViewInvoices) {
    cards.push({ label: 'Overdue Invoices', value: overdue, icon: 'warning', color: 'red', sub: overdue > 0 ? 'Requires attention' : 'All on track', pos: overdue === 0, tooltip: 'Invoices past their designated payment terms that remain unpaid.' });
  }

  return cards.map(k => `
    <div class="stat-card" style="margin:0;" data-tooltip="${k.tooltip}">
      <div style="display:flex;justify-content:space-between;align-items:flex-start;">
        <div class="stat-label">${k.label}</div>
        <div class="stat-icon ${k.color}"><span class="material-icons-outlined">${k.icon}</span></div>
      </div>
      <div class="stat-value">${k.value}</div>
      <div class="stat-change ${k.pos === true ? 'positive' : k.pos === false ? 'negative' : ''}">
        <span style="font-size:12px;">${k.sub}</span>
      </div>
    </div>`).join('');
}

function renderJobStatusChart(data, item) {
  const counts = {};
  data.jobs.forEach(j => { counts[j.status] = (counts[j.status] || 0) + 1; });
  const total = data.jobs.length || 1;
  const colors = { 'Pending':'var(--color-warning)','Scheduled':'var(--color-info)','In Progress':'var(--color-primary)','On Hold':'var(--text-tertiary)','Completed':'var(--color-success)','Invoiced':'#8B5CF6' };
  return `<div style="display:flex;flex-direction:column;gap:10px;padding:4px 0;">
    ${Object.entries(counts).map(([s, c]) => `
      <div style="display:flex;align-items:center;gap:10px;">
        <span style="width:88px;font-size:12px;color:var(--text-secondary);flex-shrink:0;">${s}</span>
        <div style="flex:1;height:20px;background:var(--content-bg);border-radius:4px;overflow:hidden;">
          <div style="width:${(c/total*100).toFixed(1)}%;height:100%;background:${colors[s]||'var(--text-tertiary)'};border-radius:4px;transition:width 0.5s;min-width:${c>0?'6px':'0'};"></div>
        </div>
        <span style="width:22px;text-align:right;font-size:12px;font-weight:600;">${c}</span>
      </div>`).join('')}
  </div>`;
}

function renderTechMap(data, item) {
  const techs = data.people.filter(p => p.type === 'Staff').slice(0, 4);
  const markers = techs.map((t, i) => {
    const top = 15 + i * 22 + Math.sin(i) * 12, left = 15 + i * 18 + Math.cos(i) * 18;
    return `<div style="position:absolute;top:${top}%;left:${left}%;transform:translate(-50%,-100%);display:flex;flex-direction:column;align-items:center;z-index:10;">
      <div style="background:white;padding:2px 6px;border-radius:4px;font-size:10px;font-weight:600;box-shadow:0 2px 4px rgba(0,0,0,.2);margin-bottom:2px;white-space:nowrap;">${t.firstName}</div>
      <div style="width:22px;height:22px;background:var(--color-primary);color:white;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:11px;font-weight:bold;border:2px solid white;">${t.firstName[0]}</div>
      <div style="width:0;height:0;border-left:5px solid transparent;border-right:5px solid transparent;border-top:7px solid var(--color-primary);margin-top:-1px;"></div>
    </div>`;
  }).join('');
  return `<div style="position:relative;width:100%;height:100%;background:#e5e3df;overflow:hidden;">
    <div style="position:absolute;inset:0;background-image:linear-gradient(rgba(0,0,0,.05) 1px,transparent 1px),linear-gradient(90deg,rgba(0,0,0,.05) 1px,transparent 1px);background-size:20px 20px;"></div>
    ${markers || '<div style="position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);color:#888;font-size:13px;">No technicians</div>'}
    <div style="position:absolute;bottom:8px;right:8px;background:rgba(255,255,255,.85);padding:4px 8px;font-size:10px;border-radius:4px;">Mock Map</div>
  </div>`;
}

function renderRecentActivity(data, item) {
  const acts = [];
  data.jobs.slice(0,4).forEach(j => acts.push({ icon:'build', color:'var(--color-primary)', text:`Job <strong>${j.number}</strong> — ${j.title}`, sub: j.customerName, time: j.updatedAt }));
  data.quotes.slice(0,3).forEach(q => acts.push({ icon:'request_quote', color:'var(--color-warning)', text:`Quote <strong>${q.number}</strong> ${q.status.toLowerCase()}`, sub: q.customerName, time: q.updatedAt }));
  data.invoices.slice(0,2).forEach(inv => acts.push({ icon:'receipt_long', color: inv.status==='Paid'?'var(--color-success)':'var(--color-danger)', text:`Invoice <strong>${inv.number}</strong> — ${inv.status}`, sub: inv.customerName, time: inv.updatedAt }));
  acts.sort((a,b) => new Date(b.time) - new Date(a.time));
  return acts.map(a => `
    <div style="display:flex;gap:10px;padding:9px 0;border-bottom:1px solid var(--border-color);">
      <div style="width:28px;height:28px;border-radius:50%;background:${a.color}20;color:${a.color};display:flex;align-items:center;justify-content:center;flex-shrink:0;">
        <span class="material-icons-outlined" style="font-size:14px;">${a.icon}</span>
      </div>
      <div style="flex:1;min-width:0;">
        <div style="font-size:13px;">${a.text}</div>
        <div style="font-size:11px;color:var(--text-tertiary);">${a.sub} · ${fmtAgo(a.time)}</div>
      </div>
    </div>`).join('');
}

function renderRecentLeads(data, item) {
  const bc = { New:'badge-info', Contacted:'badge-primary', Qualified:'badge-warning', Won:'badge-success', Lost:'badge-danger' };
  return `<table class="data-table" style="width:100%;">
    <thead><tr><th>Lead</th><th>Customer</th><th>Status</th></tr></thead>
    <tbody>${data.leads.slice(0,8).map(l => `
      <tr style="cursor:pointer;" onclick="window.location.hash='/leads/${l.id}'">
        <td class="cell-link font-medium">${l.title}</td>
        <td style="color:var(--text-secondary);">${l.customerName}</td>
        <td><span class="badge ${bc[l.status]||'badge-neutral'}">${l.status}</span></td>
      </tr>`).join('')}
    </tbody>
  </table>`;
}

function renderTodaySchedule(data, item) {
  const jobs = data.jobs.filter(j => j.status === 'Scheduled' || j.status === 'In Progress').slice(0, 8);
  if (!jobs.length) return `<div style="height:100%;display:flex;align-items:center;justify-content:center;color:var(--text-tertiary);font-size:13px;">No jobs scheduled today</div>`;
  return jobs.map(j => `
    <div style="display:flex;align-items:center;gap:10px;padding:9px 0;border-bottom:1px solid var(--border-color);cursor:pointer;" onclick="window.location.hash='/jobs/${j.id}'">
      <div style="width:3px;height:30px;border-radius:2px;flex-shrink:0;background:${j.status==='In Progress'?'var(--color-primary)':'var(--color-warning)'};"></div>
      <div style="flex:1;min-width:0;">
        <div style="font-size:13px;font-weight:500;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">${j.title}</div>
        <div style="font-size:11px;color:var(--text-tertiary);">${j.technicianName} · ${j.customerName}</div>
      </div>
      <span class="badge ${j.status==='In Progress'?'badge-primary':'badge-warning'}">${j.status}</span>
    </div>`).join('');
}

function fmtAgo(d) {
  const m = Math.floor((Date.now() - new Date(d)) / 60000);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

function renderPinnedJob(data, item) {
  const jobId = item.config?.jobId;
  if (!jobId) return renderPlaceholder('push_pin', 'Click settings to pin a job');

  const job = data.jobs.find(j => j.id === jobId);
  if (!job) return renderPlaceholder('warning', 'Job not found');

  function getTaskHierarchy(tasks, depth = 0) {
    let result = [];
    if (!tasks) return result;
    tasks.forEach((p) => {
      const isParent = (p.subTasks && p.subTasks.length > 0) || (p.subPhases && p.subPhases.length > 0);
      result.push({ ...p, depth, isParent });
      if (isParent) {
        result = result.concat(getTaskHierarchy(p.subTasks || p.subPhases, depth + 1));
      }
    });
    return result;
  }

  const jobTasks = job.tasks || job.phases || [];
  const hierarchy = getTaskHierarchy(jobTasks);
  const totalTasks = hierarchy.length;

  let progress = 0;
  if (jobTasks.length > 0) {
    const sum = jobTasks.reduce((acc, p) => acc + (p.progress || 0), 0);
    progress = Math.round(sum / jobTasks.length);
  }

  return `
    <div style="padding:2px 0;">
      <div style="display:flex;justify-content:space-between;margin-bottom:8px;align-items:center;">
        <span style="font-size:12px;font-weight:700;color:var(--text-primary);letter-spacing:0.5px;">JOB #${job.number}</span>
        <span style="font-size:14px;font-weight:700;color:var(--color-primary);">${progress}%</span>
      </div>

      <div style="height:6px;background:var(--border-color);border-radius:3px;overflow:hidden;margin-bottom:14px;">
        <div style="width:${progress}%;height:100%;background:var(--color-primary);border-radius:3px;transition:width 0.8s cubic-bezier(0.4, 0, 0.2, 1);"></div>
      </div>

      <div style="display:flex;flex-direction:column;gap:6px;margin-bottom:16px;max-height:240px;overflow-y:auto;padding-right:4px;">
        ${totalTasks > 0 ? hierarchy.map(t => {
          const completed = t.progress === 100;
          const indent = t.depth * 14;
          return `
          <div style="display:flex;align-items:center;gap:8px;padding-left:${indent}px; opacity:${!t.isParent && completed ? 0.6 : 1}">
            ${t.isParent ?
              `<span class="material-icons-outlined" style="font-size:14px;color:var(--text-tertiary);margin-top:2px;">folder</span>` :
              `<span class="material-icons-outlined" style="font-size:16px;color:${completed ? 'var(--color-success)' : 'var(--text-tertiary)'};">
                ${completed ? 'check_circle' : 'radio_button_unchecked'}
              </span>`
            }
            <span style="font-size:12px;font-weight:${t.isParent ? '700' : '400'};text-decoration:${!t.isParent && completed ? 'line-through' : 'none'};white-space:nowrap;overflow:hidden;text-overflow:ellipsis;flex:1;color:${t.isParent ? 'var(--text-primary)' : 'var(--text-secondary)'};">
              ${t.name}
            </span>
            ${t.isParent ? `<span style="font-size:10px;font-weight:600;color:var(--text-tertiary);">${t.progress}%</span>` : ''}
          </div>`;
        }).join('') : `<div style="font-size:12px;color:var(--text-tertiary);text-align:center;padding:10px;">No tasks assigned</div>`}
      </div>

      <div style="display:flex;justify-content:space-between;align-items:center;background:var(--bg-primary);padding:8px;border-radius:6px;border:1px dashed var(--border-color);">
        <div style="flex:1;min-width:0;">
          <div style="font-weight:700;font-size:12px;color:var(--text-primary);margin-bottom:2px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">${job.title}</div>
          <div style="font-size:11px;color:var(--text-tertiary);">${job.customerName}</div>
        </div>
        <button class="btn btn-ghost btn-icon btn-sm" onclick="window.location.hash='/jobs/${job.id}'" title="View Job Details" style="margin-left:8px;">
          <span class="material-icons-outlined" style="font-size:18px;color:var(--color-primary);">open_in_new</span>
        </button>
      </div>
    </div>
  `;
}

function renderProfitabilityChart(data, item) {
  const settings = store.getSettings();
  const jobs = data.jobs.filter(j => j.status !== 'Invoiced' && j.status !== 'Archived');

  let totalInternalCost = 0;
  let totalProjectedRevenue = 0;

  jobs.forEach(job => {
    const matCost = (job.materials || []).reduce((s, m) => s + (m.quantity * (m.unitCost || 0)), 0);
    const labCost = (job.laborCost || 0);
    totalInternalCost += (matCost + labCost);

    const billableMat = calculateTotalBillableMaterials(job.materials || [], settings);

    const profile = settings.laborRates.find(r => r.id === job.laborRateProfileId) || settings.laborRates.find(r => r.isDefault);
    const labHours = (job.estimatedHours || 0);
    const billableLab = Math.max(labHours * (profile?.rate || 85), profile?.minCallOutFee || 0);

    totalProjectedRevenue += (billableMat + billableLab);
  });

  const profit = totalProjectedRevenue - totalInternalCost;
  const margin = totalProjectedRevenue > 0 ? (profit / totalProjectedRevenue) * 100 : 0;

  return `
    <div style="display:flex; flex-direction:column; gap:20px; height:100%; padding:4px;">
      <div style="display:grid; grid-template-columns:1fr 1fr; gap:12px;">
        <div style="background:var(--bg-color); padding:12px; border-radius:8px; border:1px solid var(--border-color);">
          <div style="font-size:11px; color:var(--text-tertiary); text-transform:uppercase; letter-spacing:0.5px; margin-bottom:4px;">Projected Rev.</div>
          <div style="font-size:18px; font-weight:700; color:var(--text-primary);">$${totalProjectedRevenue.toLocaleString('en-AU', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
        </div>
        <div style="background:var(--bg-color); padding:12px; border-radius:8px; border:1px solid var(--border-color);">
          <div style="font-size:11px; color:var(--text-tertiary); text-transform:uppercase; letter-spacing:0.5px; margin-bottom:4px;">Avg. Margin</div>
          <div style="font-size:18px; font-weight:700; color:${margin >= 30 ? 'var(--color-success)' : 'var(--color-warning)'};">${margin.toFixed(1)}%</div>
        </div>
      </div>

      <div style="flex:1; display:flex; flex-direction:column; justify-content:center; gap:16px;">
        <div>
          <div style="display:flex; justify-content:space-between; font-size:12px; margin-bottom:6px;">
            <span style="color:var(--text-secondary);">Projected Profit</span>
            <span style="font-weight:600; color:var(--color-success);">+$${profit.toLocaleString('en-AU', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
          </div>
          <div style="height:12px; background:var(--bg-color); border-radius:6px; overflow:hidden; border:1px solid var(--border-color);">
            <div style="width:${Math.min(margin, 100)}%; height:100%; background:linear-gradient(90deg, var(--color-primary), var(--color-success));"></div>
          </div>
        </div>

        <div style="display:flex; flex-direction:column; gap:8px;">
          <div style="display:flex; align-items:center; gap:8px; font-size:12px;">
            <div style="width:10px; height:10px; border-radius:2px; background:var(--color-primary);"></div>
            <span style="color:var(--text-secondary); flex:1;">Internal Costs (Labor + Mat)</span>
            <span style="font-weight:500;">$${totalInternalCost.toLocaleString('en-AU', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
          </div>
          <div style="display:flex; align-items:center; gap:8px; font-size:12px;">
            <div style="width:10px; height:10px; border-radius:2px; background:var(--color-success);"></div>
            <span style="color:var(--text-secondary); flex:1;">Tiered Markup (Proj. Profit)</span>
            <span style="font-weight:500;">$${profit.toLocaleString('en-AU', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
          </div>
        </div>
      </div>

      <div style="font-size:11px; color:var(--text-tertiary); text-align:center; padding-top:8px; border-top:1px solid var(--border-color);">
        Based on ${jobs.length} active jobs using tiered material markups.
      </div>
    </div>
  `;
}

// ── Supercharged Named Renderers ──

function renderUnassignedJobs(data, item) {
  const unassigned = data.jobs.filter(j => !j.technicianId || j.status === 'Pending');
  if (!unassigned.length) return renderPlaceholder('assignment_late', 'No unassigned jobs');

  const techs = store.getAll('technicians');

  return `
    <div style="display:flex; flex-direction:column; gap:10px; padding:4px 0;">
      ${unassigned.map(j => `
        <div style="display:flex; align-items:center; justify-content:space-between; gap:12px; padding:10px; background:var(--bg-color); border:1px solid var(--border-color); border-radius:8px;">
          <div style="flex:1; min-width:0;">
            <div style="display:flex; align-items:center; gap:6px; margin-bottom:2px;">
              <span class="badge ${j.priority === 'Urgent' ? 'badge-danger' : j.priority === 'High' ? 'badge-warning' : 'badge-neutral'}">${j.priority}</span>
              <a href="#/jobs/${j.id}" style="font-weight:600; font-size:12px; color:var(--color-primary); text-decoration:none;">#${j.number}</a>
            </div>
            <div style="font-weight:500; font-size:13px; text-overflow:ellipsis; overflow:hidden; white-space:nowrap; color:var(--text-primary);">${j.title}</div>
            <div style="font-size:11px; color:var(--text-tertiary);">${j.customerName}</div>
          </div>
          <div style="flex-shrink:0;">
            <select class="form-select select-assign-tech" data-job-id="${j.id}" style="font-size:11px; padding:4px 8px; width:120px; height:28px; margin:0;">
              <option value="">Assign Tech...</option>
              ${techs.map(t => `<option value="${t.id}">${t.name}</option>`).join('')}
            </select>
          </div>
        </div>
      `).join('')}
    </div>
  `;
}

function renderUninvoicedCompleted(data, item) {
  const completed = data.jobs.filter(j => j.status === 'Completed');
  if (!completed.length) return renderPlaceholder('receipt_long', 'All jobs invoiced');

  const settings = store.getSettings();

  return `
    <div style="display:flex; flex-direction:column; gap:10px; padding:4px 0;">
      ${completed.map(j => {
        const matCost = (j.materials || []).reduce((s, m) => s + (m.quantity * (m.unitCost || 0)), 0);
        const labCost = (j.laborCost || 0);
        const totalCost = matCost + labCost;

        return `
          <div style="display:flex; align-items:center; justify-content:space-between; gap:12px; padding:10px; background:var(--bg-color); border:1px solid var(--border-color); border-radius:8px;">
            <div style="flex:1; min-width:0;">
              <div style="font-weight:600; font-size:12px; margin-bottom:2px;">
                <a href="#/jobs/${j.id}" style="color:var(--color-primary); text-decoration:none;">#${j.number}</a>
                <span style="color:var(--color-success); font-weight:700; margin-left:6px;">$${totalCost.toLocaleString('en-AU', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
              </div>
              <div style="font-weight:500; font-size:13px; text-overflow:ellipsis; overflow:hidden; white-space:nowrap; color:var(--text-primary);">${j.title}</div>
              <div style="font-size:11px; color:var(--text-tertiary);">${j.customerName}</div>
            </div>
            <div style="flex-shrink:0;">
              <button class="btn btn-primary btn-sm btn-quick-invoice" data-job-id="${j.id}" style="padding:4px 10px; font-size:12px; height:28px;">Invoice</button>
            </div>
          </div>
        `;
      }).join('')}
    </div>
  `;
}

function renderLowStock(data, item) {
  const stock = store.getAll('stock') || [];
  const low = stock.filter(s => s.quantity <= s.reorderLevel);
  if (!low.length) return renderPlaceholder('inventory', 'Inventory looks good');

  return `
    <div style="display:flex; flex-direction:column; gap:10px; padding:4px 0;">
      ${low.map(s => `
        <div style="display:flex; align-items:center; justify-content:space-between; gap:12px; padding:10px; background:var(--bg-color); border:1px solid var(--border-color); border-radius:8px;">
          <div style="flex:1; min-width:0;">
            <div style="font-weight:600; font-size:12px; margin-bottom:2px; display:flex; align-items:center; gap:6px;">
              <span class="text-secondary">${s.sku}</span>
              <span class="badge badge-danger" style="font-size:10px; padding:1px 6px;">${s.quantity} left</span>
            </div>
            <div style="font-weight:500; font-size:13px; text-overflow:ellipsis; overflow:hidden; white-space:nowrap; color:var(--text-primary);">${s.name}</div>
            <div style="font-size:11px; color:var(--text-tertiary);">Reorder trigger: ${s.reorderLevel}</div>
          </div>
          <div style="flex-shrink:0;">
            <button class="btn btn-secondary btn-sm btn-quick-reorder" data-stock-id="${s.id}" style="padding:4px 10px; font-size:12px; height:28px;">Reorder</button>
          </div>
        </div>
      `).join('')}
    </div>
  `;
}

function renderStaffAvailability(data, item) {
  const techs = store.getAll('technicians') || [];
  const activeJobs = data.jobs.filter(j => j.status === 'In Progress');

  return `
    <div style="display:flex; flex-direction:column; gap:10px; padding:4px 0;">
      ${techs.map(t => {
        const isWorking = activeJobs.find(j => j.technicianId === t.id);
        const statusText = isWorking ? `On Job #${isWorking.number}` : 'Available';
        const statusColor = isWorking ? 'var(--color-info)' : 'var(--color-success)';
        const dotBg = isWorking ? 'var(--color-info)' : 'var(--color-success)';

        return `
          <div style="display:flex; align-items:center; justify-content:space-between; padding:10px; background:var(--bg-color); border:1px solid var(--border-color); border-radius:8px;">
            <div style="display:flex; align-items:center; gap:10px; min-width:0;">
              <div style="width:24px; height:24px; border-radius:50%; background:${t.color || 'var(--color-primary)'}; color:white; display:flex; align-items:center; justify-content:center; font-size:11px; font-weight:bold; flex-shrink:0;">
                ${t.name[0]}
              </div>
              <div style="min-width:0;">
                <div style="font-weight:600; font-size:13px; color:var(--text-primary); text-overflow:ellipsis; overflow:hidden; white-space:nowrap;">${t.name}</div>
                <div style="font-size:11px; color:var(--text-tertiary);">${t.role || 'Field Staff'}</div>
              </div>
            </div>
            <div style="display:flex; align-items:center; gap:6px; flex-shrink:0;">
              <span style="width:8px; height:8px; border-radius:50%; background:${dotBg}; display:inline-block;"></span>
              <span style="font-size:12px; font-weight:600; color:${statusColor};">${statusText}</span>
            </div>
          </div>
        `;
      }).join('')}
    </div>
  `;
}

function renderTimesheetExceptions(data, item) {
  const timesheets = store.getAll('timesheets') || [];
  const pending = timesheets.filter(t => t.status === 'Pending');
  if (!pending.length) return renderPlaceholder('schedule', 'No timesheet alerts');

  return `
    <div style="display:flex; flex-direction:column; gap:8px; padding:4px 0;">
      ${pending.map(t => `
        <div style="display:flex; align-items:center; justify-content:space-between; gap:12px; padding:10px; background:var(--bg-color); border:1px solid var(--border-color); border-radius:8px;">
          <div style="flex:1; min-width:0;">
            <div style="font-weight:600; font-size:12px; margin-bottom:2px; color:var(--text-primary);">
              ${t.technicianName}
              <span style="color:var(--color-primary); font-weight:700; margin-left:6px;">${t.hours} hrs</span>
            </div>
            <div style="font-size:12px; color:var(--text-secondary); text-overflow:ellipsis; overflow:hidden; white-space:nowrap;">Job ${t.jobNumber || ''} : ${t.description || '—'}</div>
            <div style="font-size:11px; color:var(--text-tertiary);">${new Date(t.date).toLocaleDateString()}</div>
          </div>
          <div style="display:flex; gap:4px; flex-shrink:0;">
            <button class="btn btn-ghost btn-icon btn-sm btn-quick-ts-approve" data-ts-id="${t.id}" title="Approve" style="color:var(--color-success); border:1px solid var(--border-color); background:white;">
              <span class="material-icons-outlined" style="font-size:16px;">check</span>
            </button>
            <button class="btn btn-ghost btn-icon btn-sm btn-quick-ts-reject" data-ts-id="${t.id}" title="Reject" style="color:var(--color-danger); border:1px solid var(--border-color); background:white;">
              <span class="material-icons-outlined" style="font-size:16px;">close</span>
            </button>
          </div>
        </div>
      `).join('')}
    </div>
  `;
}

function renderAssetStatus(data, item) {
  const assets = store.getAll('assets') || [];
  if (!assets.length) return renderPlaceholder('precision_manufacturing', 'No assets registered');

  return `
    <div style="display:flex; flex-direction:column; gap:10px; padding:4px 0;">
      ${assets.map(a => `
        <div style="display:flex; align-items:center; justify-content:space-between; padding:10px; background:var(--bg-color); border:1px solid var(--border-color); border-radius:8px;">
          <div style="min-width:0; flex:1;">
            <div style="font-weight:600; font-size:13px; color:var(--text-primary);">${a.name}</div>
            <div style="font-size:11px; color:var(--text-tertiary);">${a.type} · ${a.serial || '—'}</div>
          </div>
          <span class="badge ${a.status === 'Active' ? 'badge-success' : 'badge-neutral'}">${a.status}</span>
        </div>
      `).join('')}
    </div>
  `;
}

function renderOverdueMaintenance(data, item) {
  const plans = store.getAll('maintenancePlans') || [];
  const activePlans = plans.filter(p => p.status === 'Active');
  const today = new Date().toISOString().split('T')[0];
  const overdue = activePlans.filter(p => p.nextServiceDate && p.nextServiceDate <= today);

  if (!overdue.length) return renderPlaceholder('build', 'No overdue maintenance');

  return `
    <div style="display:flex; flex-direction:column; gap:10px; padding:4px 0;">
      ${overdue.map(p => `
        <div style="display:flex; align-items:center; justify-content:space-between; gap:12px; padding:10px; background:var(--bg-color); border:1px solid var(--border-color); border-radius:8px;">
          <div style="flex:1; min-width:0;">
            <div style="font-weight:600; font-size:12px; margin-bottom:2px; color:var(--color-danger);">
              Overdue Date: ${p.nextServiceDate}
            </div>
            <div style="font-weight:500; font-size:13px; text-overflow:ellipsis; overflow:hidden; white-space:nowrap; color:var(--text-primary);">${p.name}</div>
          </div>
          <button class="btn btn-primary btn-sm btn-maint-dispatch" data-plan-id="${p.id}" style="padding:4px 10px; font-size:12px; height:28px;">Dispatch</button>
        </div>
      `).join('')}
    </div>
  `;
}

function renderTopCustomers(data, item) {
  const invoices = data.invoices || [];
  const paid = invoices.filter(i => i.status === 'Paid');
  const spentMap = {};
  paid.forEach(i => {
    spentMap[i.customerName] = (spentMap[i.customerName] || 0) + (i.total || 0);
  });

  const sorted = Object.entries(spentMap).sort((a,b) => b[1] - a[1]).slice(0, 4);
  if (!sorted.length) return renderPlaceholder('emoji_events', 'No paid transactions yet');

  const maxSpend = sorted[0][1] || 1;

  return `
    <div style="display:flex; flex-direction:column; gap:12px; padding:4px 0;">
      ${sorted.map(([name, spend]) => {
        const percent = Math.round((spend / maxSpend) * 100);
        return `
          <div>
            <div style="display:flex; justify-content:space-between; font-size:12px; margin-bottom:4px;">
              <span style="font-weight:600; color:var(--text-primary); text-overflow:ellipsis; overflow:hidden; white-space:nowrap; max-width:200px;">${name}</span>
              <span style="font-weight:700; color:var(--color-primary);">$${spend.toLocaleString('en-AU', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
            </div>
            <div style="height:8px; background:var(--bg-color); border-radius:4px; overflow:hidden;">
              <div style="width:${percent}%; height:100%; background:linear-gradient(90deg, var(--color-primary), #60a5fa); border-radius:4px;"></div>
            </div>
          </div>
        `;
      }).join('')}
    </div>
  `;
}

function renderDailyTodo(data, item) {
  const currentUser = JSON.parse(localStorage.getItem('currentUser') || 'null');
  const userKey = currentUser ? `todo_${currentUser.id}` : 'todo_default';
  let todos = [];
  try { todos = JSON.parse(localStorage.getItem(userKey) || '[]'); } catch(e) {}

  if (!todos.length) {
    todos = [
      { text: 'Check timesheet submissions', completed: false },
      { text: 'Verify stock levels for split systems', completed: false }
    ];
    localStorage.setItem(userKey, JSON.stringify(todos));
  }

  return `
    <div style="display:flex; flex-direction:column; gap:10px; height:100%;">
      <div style="display:flex; gap:6px; margin-bottom:4px;">
        <input type="text" id="todo-input-field" placeholder="Add custom task..." class="form-input" style="flex:1; height:30px; font-size:12px; padding:0 8px; margin:0;" />
        <button class="btn btn-primary btn-sm" id="btn-add-todo" style="padding:0 12px; height:30px; font-size:12px;">Add</button>
      </div>
      <div id="todo-list-inner" style="display:flex; flex-direction:column; gap:6px; max-height:160px; overflow-y:auto; padding-right:4px;">
        ${todos.map((t, idx) => `
          <div style="display:flex; align-items:center; justify-content:space-between; padding:8px; background:var(--bg-color); border:1px solid var(--border-color); border-radius:6px;">
            <label style="display:flex; align-items:center; gap:8px; cursor:pointer; font-size:12px; color:${t.completed ? 'var(--text-tertiary)' : 'var(--text-primary)'}; text-decoration:${t.completed ? 'line-through' : 'none'}; flex:1; min-width:0; margin:0;">
              <input type="checkbox" class="todo-item-check" data-idx="${idx}" ${t.completed ? 'checked' : ''} style="cursor:pointer; width:14px; height:14px; margin:0;" />
              <span class="truncate">${t.text}</span>
            </label>
            <button class="btn btn-ghost btn-sm btn-icon btn-remove-todo" data-idx="${idx}" style="color:var(--color-danger); padding:0; width:22px; height:22px;" title="Delete">
              <span class="material-icons-outlined" style="font-size:16px;">delete</span>
            </button>
          </div>
        `).join('')}
      </div>
    </div>
  `;
}

function renderPendingApprovals(data, item) {
  const quotes = store.getAll('quotes') || [];
  const pending = quotes.filter(q => q.status === 'Sent');
  if (!pending.length) return renderPlaceholder('approval', 'No pending quotes waiting');

  return `
    <div style="display:flex; flex-direction:column; gap:10px; padding:4px 0;">
      ${pending.map(q => `
        <div style="display:flex; align-items:center; justify-content:space-between; gap:12px; padding:10px; background:var(--bg-color); border:1px solid var(--border-color); border-radius:8px;">
          <div style="flex:1; min-width:0;">
            <div style="font-weight:600; font-size:12px; margin-bottom:2px;">
              <a href="#/quotes/${q.id}" style="color:var(--color-primary); text-decoration:none;">#${q.number}</a>
              <span style="color:var(--color-primary); font-weight:700; margin-left:6px;">$${(q.total || 0).toLocaleString('en-AU', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
            </div>
            <div style="font-weight:500; font-size:13px; text-overflow:ellipsis; overflow:hidden; white-space:nowrap; color:var(--text-primary);">${q.title}</div>
            <div style="font-size:11px; color:var(--text-tertiary);">${q.customerName}</div>
          </div>
          <div style="display:flex; gap:4px; flex-shrink:0;">
            <button class="btn btn-ghost btn-icon btn-sm btn-quote-approve" data-quote-id="${q.id}" title="Approve" style="color:var(--color-success); border:1px solid var(--border-color); background:white;">
              <span class="material-icons-outlined" style="font-size:16px;">check</span>
            </button>
            <button class="btn btn-ghost btn-icon btn-sm btn-quote-decline" data-quote-id="${q.id}" title="Decline" style="color:var(--color-danger); border:1px solid var(--border-color); background:white;">
              <span class="material-icons-outlined" style="font-size:16px;">close</span>
            </button>
          </div>
        </div>
      `).join('')}
    </div>
  `;
}

function renderCustomerNPS(data, item) {
  return `
    <div style="display:flex; align-items:center; justify-content:center; gap:20px; height:100%; padding:8px;">
      <div style="position:relative; width:80px; height:80px; display:flex; align-items:center; justify-content:center;">
        <svg viewBox="0 0 36 36" style="width:100%; height:100%; transform: rotate(-90deg);">
          <path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="var(--bg-color)" stroke-width="3" />
          <path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="var(--color-success)" stroke-width="3.5" stroke-dasharray="88, 100" />
        </svg>
        <div style="position:absolute; font-size:18px; font-weight:800; color:var(--text-primary);">8.8</div>
      </div>
      <div style="font-size:12px; color:var(--text-secondary); line-height:1.4;">
        <div style="font-weight:700; color:var(--color-success); font-size:13px;">Excellent Score</div>
        <div>Promoters: <strong style="color:var(--text-primary)">82%</strong></div>
        <div>Detractors: <strong style="color:var(--text-primary)">6%</strong></div>
        <div style="color:var(--text-tertiary); font-size:10px; margin-top:2px;">Last 30 days review loop</div>
      </div>
    </div>
  `;
}

function renderCashFlow(data, item) {
  const invoices = data.invoices || [];
  const paidTotal = invoices.filter(i => i.status === 'Paid').reduce((sum, i) => sum + (i.total || 0), 0);
  const sentTotal = invoices.filter(i => i.status === 'Sent' || i.status === 'Overdue').reduce((sum, i) => sum + (i.total || 0), 0);

  return `
    <div style="display:flex; flex-direction:column; justify-content:center; height:100%; padding:4px;">
      <div style="background:linear-gradient(135deg, var(--color-primary), #FF7A2E); padding:16px; border-radius:10px; color:white; box-shadow:0 4px 15px rgba(255, 92, 0, 0.2); margin-bottom:10px;">
        <div style="font-size:10px; text-transform:uppercase; letter-spacing:0.5px; opacity:0.8; margin-bottom:2px;">Total Paid Cash Flow</div>
        <div style="font-size:22px; font-weight:800;">$${paidTotal.toLocaleString('en-AU', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
      </div>
      <div style="display:flex; justify-content:space-between; align-items:center; font-size:12px; padding:0 4px;">
        <span style="color:var(--text-secondary);">Receivables Outstanding</span>
        <strong style="color:var(--color-warning);">$${sentTotal.toLocaleString('en-AU', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</strong>
      </div>
    </div>
  `;
}

function renderWeatherForecast(data, item) {
  return `
    <div style="display:flex; align-items:center; gap:16px; height:100%; padding:4px;">
      <div style="display:flex; flex-direction:column; align-items:center; justify-content:center; flex-shrink:0;">
        <span class="material-icons-outlined" style="font-size:40px; color:#f59e0b;">wb_sunny</span>
        <span style="font-size:14px; font-weight:700; color:var(--text-primary); margin-top:2px;">24°C</span>
      </div>
      <div style="flex:1; font-size:12px; color:var(--text-secondary); line-height:1.4;">
        <div style="font-weight:700; color:var(--color-primary); font-size:13px; margin-bottom:2px;">Sunny & Clear</div>
        <div>Wind: 12 km/h · Precip: 5%</div>
        <div style="margin-top:4px; font-style:italic; color:var(--color-success); font-weight:500;">
          ☀️ Perfect weather for all outdoor asset servicing and safety checkups!
        </div>
      </div>
    </div>
  `;
}
