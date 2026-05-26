// ============================================
// SIMPRO CLONE — DASHBOARD (CSS Grid System)
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

let isEditMode = false;

// Width class → grid-column span
const WIDTH_CLASS = { S: 'module-s', M: 'module-m', L: 'module-l', XL: 'module-l' };
// Height class → grid-row span
const HEIGHT_CLASS = { standard: '', tall: 'module-tall', xtall: 'module-xtall' };

function getLayoutKey() {
  const currentUser = JSON.parse(localStorage.getItem('currentUser') || 'null');
  return currentUser ? `dashboardLayout_v3_${currentUser.id}` : 'dashboardLayout_v3'; /* Shifting storage key to reload fresh layout */
}

// Each module declares its default width + height, and which options are sensible
const MODULES = {
  'kpi-cards':            { title: 'KPI Cards',                   defaultW: 'L',  defaultH: 'standard', widths: ['M','L'],           heights: ['standard'],               kpiStrip: true,  render: renderKpiCards },
  'job-status-chart':     { title: 'Job Status Chart',            defaultW: 'M',  defaultH: 'tall',     widths: ['M','L'],           heights: ['tall','xtall'],           render: renderJobStatusChart },
  'tech-map':             { title: 'Technician Map',              defaultW: 'S',  defaultH: 'tall',     widths: ['S','M','L'],       heights: ['tall','xtall'],           render: renderTechMap },
  'recent-activity':      { title: 'Recent Activity',             defaultW: 'M',  defaultH: 'tall',     widths: ['M','L'],           heights: ['tall','xtall'],           render: renderRecentActivity },
  'recent-leads':         { title: 'Recent Leads',                defaultW: 'S',  defaultH: 'tall',     widths: ['S','M','L'],       heights: ['tall','xtall'],           render: renderRecentLeads },
  'today-schedule':       { title: "Today's Schedule",            defaultW: 'M',  defaultH: 'tall',     widths: ['S','M','L'],       heights: ['tall','xtall'],           render: renderTodaySchedule },
  'pinned-job':           { title: 'Pinned Job Progress',         defaultW: 'M',  defaultH: 'standard', widths: ['S','M','L'],       heights: ['standard','tall'],        configurable: true,  render: renderPinnedJob },
  'unassigned-jobs':      { title: 'Unassigned Jobs Queue',       defaultW: 'M',  defaultH: 'tall',     widths: ['M','L'],           heights: ['tall','xtall'],           render: () => renderPlaceholder('assignment_late', 'No unassigned jobs') },
  'uninvoiced-completed': { title: 'Uninvoiced Completed Jobs',   defaultW: 'M',  defaultH: 'tall',     widths: ['M','L'],           heights: ['tall','xtall'],           render: () => renderPlaceholder('receipt_long', 'All jobs invoiced') },
  'low-stock':            { title: 'Low Stock Alerts',            defaultW: 'S',  defaultH: 'standard', widths: ['S','M'],           heights: ['standard','tall'],        render: () => renderPlaceholder('inventory', 'Inventory looks good') },
  'profitability-chart':  { title: 'Projected Profitability',     defaultW: 'L',  defaultH: 'tall',     widths: ['L'],               heights: ['tall','xtall'],           render: renderProfitabilityChart },
  'staff-availability':   { title: 'Staff Availability',          defaultW: 'M',  defaultH: 'tall',     widths: ['M','L'],           heights: ['tall','xtall'],           render: () => renderPlaceholder('people', 'All staff active') },
  'timesheet-exceptions': { title: 'Timesheet Exceptions',        defaultW: 'M',  defaultH: 'standard', widths: ['S','M','L'],       heights: ['standard','tall'],        render: () => renderPlaceholder('schedule', 'No timesheet alerts') },
  'asset-status':         { title: 'Asset Status',                defaultW: 'M',  defaultH: 'standard', widths: ['S','M','L'],       heights: ['standard','tall'],        render: () => renderPlaceholder('precision_manufacturing', 'All assets operational') },
  'overdue-maintenance':  { title: 'Overdue Maintenance',         defaultW: 'M',  defaultH: 'standard', widths: ['S','M','L'],       heights: ['standard','tall'],        render: () => renderPlaceholder('build', 'No overdue maintenance') },
  'top-customers':        { title: 'Top Customers',               defaultW: 'M',  defaultH: 'tall',     widths: ['M','L'],           heights: ['tall','xtall'],           render: () => renderPlaceholder('emoji_events', 'Mock Top Customers') },
  'daily-todo':           { title: 'Daily To-Do',                 defaultW: 'S',  defaultH: 'tall',     widths: ['S','M'],           heights: ['tall','xtall'],           render: () => renderPlaceholder('checklist', 'No tasks added') },
  'pending-approvals':    { title: 'Pending Approvals',           defaultW: 'M',  defaultH: 'standard', widths: ['S','M','L'],       heights: ['standard','tall'],        render: () => renderPlaceholder('approval', 'No pending approvals') },
  'customer-nps':         { title: 'Customer Satisfaction',       defaultW: 'S',  defaultH: 'standard', widths: ['S','M'],           heights: ['standard'],               render: () => renderPlaceholder('star', 'NPS Score: 8.5/10') },
  'cash-flow':            { title: 'Cash Flow Summary',           defaultW: 'S',  defaultH: 'standard', widths: ['S','M','L'],       heights: ['standard','tall'],        render: () => renderPlaceholder('account_balance', '+ $15,240 this week') },
  'weather-forecast':     { title: 'Weather Forecast',            defaultW: 'S',  defaultH: 'standard', widths: ['S','M'],           heights: ['standard'],               render: () => renderPlaceholder('wb_sunny', 'Sunny, 24°C') },
};

const DEFAULT_LAYOUT = [
  { id: 'kpi-cards',        w: 'L', h: 'standard' }, /* Level 3 max width (100%) */
  { id: 'job-status-chart', w: 'M', h: 'tall' },
  { id: 'cash-flow',        w: 'S', h: 'tall' },
  { id: 'today-schedule',   w: 'M', h: 'tall' },
  { id: 'recent-leads',     w: 'S', h: 'tall' },
  { id: 'recent-activity',  w: 'M', h: 'tall' },
  { id: 'tech-map',         w: 'S', h: 'tall' },
];

function renderPlaceholder(icon, msg) {
  return `<div style="height:100%;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:8px;color:var(--text-tertiary);padding:16px;text-align:center;">
    <span class="material-icons-outlined" style="font-size:28px;opacity:0.4;">${icon}</span>
    <span style="font-size:13px;">${msg}</span>
  </div>`;
}

export function renderDashboard(container) {
  let layout = JSON.parse(JSON.stringify(DEFAULT_LAYOUT));
  try { const s = localStorage.getItem(getLayoutKey()); if (s) layout = JSON.parse(s); } catch(e) {}

  // Ensure every item has a unique instanceId for precise tracking
  layout.forEach(item => {
    if (!item.instanceId) item.instanceId = 'inst_' + Math.random().toString(36).substr(2, 9);
  });

  const data = {
    jobs:     store.getAll('jobs'),
    quotes:   store.getAll('quotes'),
    invoices: store.getAll('invoices'),
    leads:    store.getAll('leads'),
    people:   store.getAll('people'),
  };

  container.innerHTML = `
    <div class="page-content-wrapper">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:var(--space-lg);">
        <div style="display:flex;align-items:center;gap:10px;">
          <h1 style="margin:0;">Dashboard</h1>
          <button id="btn-edit-dashboard" class="btn btn-secondary btn-sm" style="display:flex;align-items:center;gap:4px;">
            <span class="material-icons-outlined" style="font-size:16px;">dashboard_customize</span> Customise
          </button>
        </div>
        <div id="dashboard-header-actions" style="display:flex;gap:8px;">
          ${getHeaderActionsHtml()}
        </div>
      </div>
      <div id="dashboard-grid" class="dashboard-grid"></div>
    </div>`;

  const grid = container.querySelector('#dashboard-grid');
  renderGrid(grid, layout, data);

  container.querySelector('#btn-edit-dashboard').addEventListener('click', () => {
    isEditMode = true;
    renderGrid(grid, layout, data);
    showEditHeader(container, grid, layout, data);
  });
}

function renderGrid(grid, layout, data) {
  grid.innerHTML = '';
  layout.forEach(item => {
    const mod = MODULES[item.id];
    if (!mod) return;
    const wClass = WIDTH_CLASS[item.w] || 'module-m';
    const hClass = HEIGHT_CLASS[item.h] || '';
    const classes = ['dashboard-module', wClass, hClass, isEditMode ? 'edit-mode' : ''].filter(Boolean).join(' ');

    const canResizeW = mod.widths.length > 1;
    const canResizeH = mod.heights.length > 1;

    const resizeHandles = isEditMode ? `
      ${canResizeW ? `<div class="resize-handle resize-r" title="Drag to resize width"><span class="material-icons-outlined" style="font-size:12px;transform:rotate(90deg);">unfold_more</span></div>` : ''}
      ${canResizeH ? `<div class="resize-handle resize-b" title="Drag to resize height"><span class="material-icons-outlined" style="font-size:12px;">unfold_more</span></div>` : ''}
      ${canResizeW && canResizeH ? `<div class="resize-handle resize-br" title="Drag to resize"><span class="material-icons-outlined" style="font-size:12px;transform:rotate(45deg);">open_in_full</span></div>` : ''}
    ` : '';

    const widgetControls = `
      <div style="display:flex;align-items:center;gap:4px;">
        ${mod.configurable ? `
          <button class="btn btn-ghost btn-icon btn-sm btn-configure" data-instance-id="${item.instanceId}" title="Configure widget" style="pointer-events:auto;position:relative;z-index:20;">
            <span class="material-icons-outlined" style="font-size:15px;${!isEditMode ? 'opacity:0.5;' : ''}">settings</span>
          </button>
        ` : ''}
        ${isEditMode ? `
          <button class="btn btn-ghost btn-icon btn-sm btn-remove" data-instance-id="${item.instanceId}" title="Remove widget" style="pointer-events:auto;position:relative;z-index:20;">
            <span class="material-icons-outlined" style="font-size:15px;">close</span>
          </button>
        ` : ''}
      </div>`;

    const headerBg = isEditMode ? 'background:rgba(27,109,224,0.04);' : '';

    grid.insertAdjacentHTML('beforeend', `
      <div class="${classes}" data-instance-id="${item.instanceId}" data-id="${item.id}" style="position:relative;">
        <div class="card ${mod.kpiStrip ? 'kpi-strip' : ''}">
          <div class="card-header" style="${headerBg}">
            <span style="font-weight:600;font-size:14px;">${mod.title}</span>
            ${widgetControls}
          </div>
          <div class="card-body">${mod.render(data, item)}</div>
        </div>
        ${resizeHandles}
      </div>`);
  });

  wireWidgetControls(grid, layout, data);
  if (isEditMode) wireEditControls(grid, layout, data);
}

function wireWidgetControls(grid, layout, data) {
  // Configure button (always available if widget is configurable)
  grid.querySelectorAll('.btn-configure').forEach(btn => {
    btn.addEventListener('click', e => {
      const instId = e.currentTarget.dataset.instanceId;
      const item = layout.find(i => i.instanceId === instId);
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
            <!-- Jobs will be rendered here -->
          </div>
        `;

        function updateJobList(filter = '') {
          const container = content.querySelector('#job-list-container');
          const filtered = jobs.filter(j => 
            j.number.toLowerCase().includes(filter.toLowerCase()) ||
            j.title.toLowerCase().includes(filter.toLowerCase()) ||
            j.customerName.toLowerCase().includes(filter.toLowerCase())
          );

          container.innerHTML = filtered.length > 0 ? filtered.map(j => `
            <div class="job-option" data-job-id="${j.id}" style="padding:10px;border:1px solid var(--border-color);border-radius:6px;cursor:pointer;transition:all 0.15s;"
              onmouseover="this.style.borderColor='var(--color-primary)';this.style.background='var(--color-primary-light)';"
              onmouseout="this.style.borderColor='var(--border-color)';this.style.background='';">
              <div style="font-weight:600;font-size:13px;">#${j.number} - ${j.title}</div>
              <div style="font-size:11px;color:var(--text-tertiary);">${j.customerName}</div>
            </div>
          `).join('') : `<div style="text-align:center; padding:20px; color:var(--text-tertiary); font-size:13px;">No matching jobs found</div>`;

          // Re-attach click listeners
          container.querySelectorAll('.job-option').forEach(opt => {
            opt.addEventListener('click', () => {
              item.config = { ...item.config, jobId: opt.dataset.jobId };
              
              // If we are not in edit mode, auto-save the change to localStorage
              if (!isEditMode) {
                localStorage.setItem(getLayoutKey(), JSON.stringify(layout));
              }

              document.querySelector('.modal-overlay')?.remove();
              renderGrid(grid, layout, data);
            });
          });
        }

        updateJobList();

        content.querySelector('#job-search').addEventListener('input', e => {
          updateJobList(e.target.value);
        });

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
}

function wireEditControls(grid, layout, data) {
  // Remove button
  grid.querySelectorAll('.btn-remove').forEach(btn => {
    btn.addEventListener('click', e => {
      const instId = e.currentTarget.dataset.instanceId;
      const idx = layout.findIndex(i => i.instanceId === instId);
      if (idx !== -1) {
        layout.splice(idx, 1);
        renderGrid(grid, layout, data);
      }
    });
  });

  // Initialize SortableJS for smooth drag and drop reordering
  if (window.Sortable && !grid.sortableInstance) {
    grid.sortableInstance = new window.Sortable(grid, {
      handle: '.card',
      animation: 250,
      easing: 'cubic-bezier(0.2, 0, 0, 1)',
      ghostClass: 'sortable-ghost',
      dragClass: 'sortable-drag',
      swapThreshold: 0.65, // iOS style: must significantly overlap to trigger swap
      forceFallback: true, // Forces custom smooth dragging instead of clunky HTML5 ghost image
      fallbackClass: 'sortable-drag',
      fallbackOnBody: true,
      filter: '.btn-remove, .resize-handle',
      preventOnFilter: false,
      onEnd: function() {
        // Sync the layout array to match the new DOM order Sortable created
        const domOrder = Array.from(grid.children).map(el => el.dataset.instanceId);
        const newLayout = [];
        domOrder.forEach(instId => {
          const item = layout.find(i => i.instanceId === instId);
          if (item) newLayout.push(item);
        });
        layout.splice(0, layout.length, ...newLayout);
      }
    });
  }
  if (grid.sortableInstance) {
    grid.sortableInstance.option('disabled', false);
  }

  // Resize logic
  grid.querySelectorAll('.resize-handle').forEach(handle => {
    handle.addEventListener('mousedown', e => {
      e.preventDefault();
      e.stopPropagation();
      const moduleEl = e.target.closest('.dashboard-module');
      const instId = moduleEl.dataset.instanceId;
      const item = layout.find(i => i.instanceId === instId);
      const mod = MODULES[item?.id];
      if (!item || !mod) return;

      const handleEl = e.target.closest('.resize-handle');
      const isRight = handleEl && (handleEl.classList.contains('resize-r') || handleEl.classList.contains('resize-br'));
      const isBottom = handleEl && (handleEl.classList.contains('resize-b') || handleEl.classList.contains('resize-br'));

      let lastX = e.clientX;
      let lastY = e.clientY;
      let accX = 0;
      let accY = 0;

      // Distance the mouse must move to trigger a size bump
      const threshold = 60;

      const wOrder = ['S','M','L','XL'].filter(o => mod.widths.includes(o));
      const hOrder = ['standard','tall','xtall'].filter(o => mod.heights.includes(o));

      function onMouseMove(moveEvent) {
        if (isRight) {
          accX += (moveEvent.clientX - lastX);
          if (accX > threshold) {
            let idx = wOrder.indexOf(item.w);
            if (idx < wOrder.length - 1) {
              item.w = wOrder[idx + 1];
              moduleEl.className = ['dashboard-module', WIDTH_CLASS[item.w] || 'module-m', HEIGHT_CLASS[item.h] || '', 'edit-mode'].filter(Boolean).join(' ');
            }
            accX = 0;
          } else if (accX < -threshold) {
            let idx = wOrder.indexOf(item.w);
            if (idx > 0) {
              item.w = wOrder[idx - 1];
              moduleEl.className = ['dashboard-module', WIDTH_CLASS[item.w] || 'module-m', HEIGHT_CLASS[item.h] || '', 'edit-mode'].filter(Boolean).join(' ');
            }
            accX = 0;
          }
        }
        
        if (isBottom) {
          accY += (moveEvent.clientY - lastY);
          if (accY > threshold) {
            let idx = hOrder.indexOf(item.h);
            if (idx < hOrder.length - 1) {
              item.h = hOrder[idx + 1];
              moduleEl.className = ['dashboard-module', WIDTH_CLASS[item.w] || 'module-m', HEIGHT_CLASS[item.h] || '', 'edit-mode'].filter(Boolean).join(' ');
            }
            accY = 0;
          } else if (accY < -threshold) {
            let idx = hOrder.indexOf(item.h);
            if (idx > 0) {
              item.h = hOrder[idx - 1];
              moduleEl.className = ['dashboard-module', WIDTH_CLASS[item.w] || 'module-m', HEIGHT_CLASS[item.h] || '', 'edit-mode'].filter(Boolean).join(' ');
            }
            accY = 0;
          }
        }

        lastX = moveEvent.clientX;
        lastY = moveEvent.clientY;
      }

      function onMouseUp() {
        document.removeEventListener('mousemove', onMouseMove);
        document.removeEventListener('mouseup', onMouseUp);
        document.body.style.cursor = '';
        document.body.style.userSelect = '';
      }

      document.addEventListener('mousemove', onMouseMove);
      document.addEventListener('mouseup', onMouseUp);
      document.body.style.cursor = window.getComputedStyle(e.target).cursor;
      document.body.style.userSelect = 'none';
    });
  });
}

function showEditHeader(container, grid, layout, data) {
  const headerActions = container.querySelector('#dashboard-header-actions');
  const editBtn = container.querySelector('#btn-edit-dashboard');
  editBtn.style.display = 'none';
  headerActions.innerHTML = `
    <button class="btn btn-secondary btn-sm" id="btn-add-widget">
      <span class="material-icons-outlined" style="font-size:16px;">add</span> Add Widget
    </button>
    <button class="btn btn-ghost btn-sm" id="btn-reset-default" title="Reset to default dashboard">Reset to Default</button>
    <div style="width:1px; height:20px; background:var(--border-color); margin:0 4px;"></div>
    <button class="btn btn-secondary btn-sm" id="btn-cancel-edit">Cancel</button>
    <button class="btn btn-primary btn-sm" id="btn-save-layout">
      <span class="material-icons-outlined" style="font-size:16px;">save</span> Save Layout
    </button>`;

  headerActions.querySelector('#btn-reset-default').addEventListener('click', () => {
    if (confirm('Are you sure you want to reset your dashboard to the default layout?')) {
      layout.splice(0, layout.length, ...JSON.parse(JSON.stringify(DEFAULT_LAYOUT)));
      renderGrid(grid, layout, data);
      wireEditControls(grid, layout, data);
    }
  });

  headerActions.querySelector('#btn-save-layout').addEventListener('click', () => {
    localStorage.setItem(getLayoutKey(), JSON.stringify(layout));
    isEditMode = false;
    if (grid.sortableInstance) grid.sortableInstance.option('disabled', true);
    editBtn.style.display = '';
    headerActions.innerHTML = getHeaderActionsHtml();
    renderGrid(grid, layout, data);
  });

  headerActions.querySelector('#btn-cancel-edit').addEventListener('click', () => {
    try { const s = localStorage.getItem(getLayoutKey()); if (s) layout.splice(0, layout.length, ...JSON.parse(s)); } catch(e) {}
    isEditMode = false;
    if (grid.sortableInstance) grid.sortableInstance.option('disabled', true);
    editBtn.style.display = '';
    headerActions.innerHTML = getHeaderActionsHtml();
    renderGrid(grid, layout, data);
  });

  headerActions.querySelector('#btn-add-widget').addEventListener('click', () => {
    const available = Object.entries(MODULES);
    const content = document.createElement('div');
    content.innerHTML = `<div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;max-height:420px;overflow-y:auto;">
          ${available.map(([id, mod]) => `
            <div data-id="${id}" style="padding:12px;border:1px solid var(--border-color);border-radius:8px;cursor:pointer;display:flex;align-items:center;gap:8px;transition:all 0.15s;"
              onmouseover="this.style.borderColor='var(--color-primary)';this.style.background='var(--color-primary-light)';"
              onmouseout="this.style.borderColor='var(--border-color)';this.style.background='';">
              <span class="material-icons-outlined" style="color:var(--color-primary);font-size:18px;">widgets</span>
              <div>
                <div style="font-weight:600;font-size:13px;">${mod.title}</div>
                <div style="font-size:11px;color:var(--text-tertiary);">Default: ${mod.defaultW} · ${mod.defaultH}</div>
              </div>
            </div>`).join('')}
        </div>`;

    import('../components/Modal.js').then(({ showModal }) => {
      showModal({ title: 'Add Widget', content, actions: [{ label: 'Close', className: 'btn-secondary', onClick: c => c() }] });
      content.querySelectorAll('[data-id]').forEach(el => {
        el.addEventListener('click', e => {
          const id = e.currentTarget.dataset.id;
          const mod = MODULES[id];
          layout.push({ id, instanceId: 'inst_' + Math.random().toString(36).substr(2, 9), w: mod.defaultW, h: mod.defaultH });
          document.querySelector('.modal-overlay')?.remove();
          renderGrid(grid, layout, data);
          wireEditControls(grid, layout, data);
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
  return [
    { label: 'Total Revenue',    value: '$' + revenue.toLocaleString('en-AU'), icon: 'payments',       color: 'blue',   sub: '+12.5% vs last month', pos: true },
    { label: 'Active Jobs',      value: activeJobs,                             icon: 'build',           color: 'green',  sub: `${data.jobs.length} total`, pos: true },
    { label: 'Pending Quotes',   value: pendingQuotes,                          icon: 'request_quote',   color: 'orange', sub: `${data.quotes.length} total`, pos: null },
    { label: 'Overdue Invoices', value: overdue,                                icon: 'warning',         color: 'red',    sub: overdue > 0 ? 'Requires attention' : 'All on track', pos: overdue === 0 },
  ].map(k => `
    <div class="stat-card" style="margin:0;">
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
  
  // Calculate overall progress from top-level tasks
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
    // 1. Calculate Internal Cost
    const matCost = (job.materials || []).reduce((s, m) => s + (m.quantity * (m.unitCost || 0)), 0);
    const labCost = (job.laborCost || 0);
    totalInternalCost += (matCost + labCost);

    // 2. Calculate Projected Revenue (using tiered markup)
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
            <span style="font-weight:600; color:var(--color-success);">+$${profit.toLocaleString('en-AU', { minimumFractionDigits: 2 })}</span>
          </div>
          <div style="height:12px; background:var(--bg-color); border-radius:6px; overflow:hidden; border:1px solid var(--border-color);">
            <div style="width:${Math.min(margin, 100)}%; height:100%; background:linear-gradient(90deg, var(--color-primary), var(--color-success));"></div>
          </div>
        </div>

        <div style="display:flex; flex-direction:column; gap:8px;">
          <div style="display:flex; align-items:center; gap:8px; font-size:12px;">
            <div style="width:10px; height:10px; border-radius:2px; background:var(--color-primary);"></div>
            <span style="color:var(--text-secondary); flex:1;">Internal Costs (Labor + Mat)</span>
            <span style="font-weight:500;">$${totalInternalCost.toLocaleString()}</span>
          </div>
          <div style="display:flex; align-items:center; gap:8px; font-size:12px;">
            <div style="width:10px; height:10px; border-radius:2px; background:var(--color-success);"></div>
            <span style="color:var(--text-secondary); flex:1;">Tiered Markup (Proj. Profit)</span>
            <span style="font-weight:500;">$${profit.toLocaleString()}</span>
          </div>
        </div>
      </div>

      <div style="font-size:11px; color:var(--text-tertiary); text-align:center; padding-top:8px; border-top:1px solid var(--border-color);">
        Based on ${jobs.length} active jobs using tiered material markups.
      </div>
    </div>
  `;
}
