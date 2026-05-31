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
  'unassigned-jobs':      { title: 'Unassigned Jobs Queue',       defaultW: 'M',  defaultH: 'tall',     widths: ['M','L'],           heights: ['tall','xtall'],           render: renderUnassignedJobs },
  'uninvoiced-completed': { title: 'Uninvoiced Completed Jobs',   defaultW: 'M',  defaultH: 'tall',     widths: ['M','L'],           heights: ['tall','xtall'],           render: renderUninvoicedCompleted },
  'low-stock':            { title: 'Low Stock Alerts',            defaultW: 'S',  defaultH: 'standard', widths: ['S','M'],           heights: ['standard','tall'],        render: renderLowStock },
  'profitability-chart':  { title: 'Projected Profitability',     defaultW: 'L',  defaultH: 'tall',     widths: ['L'],               heights: ['tall','xtall'],           render: renderProfitabilityChart },
  'staff-availability':   { title: 'Staff Availability',          defaultW: 'M',  defaultH: 'tall',     widths: ['M','L'],           heights: ['tall','xtall'],           render: renderStaffAvailability },
  'timesheet-exceptions': { title: 'Timesheet Exceptions',        defaultW: 'M',  defaultH: 'standard', widths: ['S','M','L'],       heights: ['standard','tall'],        render: renderTimesheetExceptions },
  'asset-status':         { title: 'Asset Status',                defaultW: 'M',  defaultH: 'standard', widths: ['S','M','L'],       heights: ['standard','tall'],        render: renderAssetStatus },
  'overdue-maintenance':  { title: 'Overdue Maintenance',         defaultW: 'M',  defaultH: 'standard', widths: ['S','M','L'],       heights: ['standard','tall'],        render: renderOverdueMaintenance },
  'top-customers':        { title: 'Top Customers',               defaultW: 'M',  defaultH: 'tall',     widths: ['M','L'],           heights: ['tall','xtall'],           render: renderTopCustomers },
  'daily-todo':           { title: 'Daily To-Do',                 defaultW: 'S',  defaultH: 'tall',     widths: ['S','M'],           heights: ['tall','xtall'],           render: renderDailyTodo },
  'pending-approvals':    { title: 'Pending Approvals',           defaultW: 'M',  defaultH: 'standard', widths: ['S','M','L'],       heights: ['standard','tall'],        render: renderPendingApprovals },
  'customer-nps':         { title: 'Customer Satisfaction',       defaultW: 'S',  defaultH: 'standard', widths: ['S','M'],           heights: ['standard'],               render: renderCustomerNPS },
  'cash-flow':            { title: 'Cash Flow Summary',           defaultW: 'S',  defaultH: 'standard', widths: ['S','M','L'],       heights: ['standard','tall'],        render: renderCashFlow },
  'weather-forecast':     { title: 'Weather Forecast',            defaultW: 'S',  defaultH: 'standard', widths: ['S','M'],           heights: ['standard'],               render: renderWeatherForecast },
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
  // Setup reactive reload trigger in fieldForge global
  if (!window.__fieldForge) window.__fieldForge = {};
  window.__fieldForge.reloadDashboard = () => renderDashboard(container);

  let layout = JSON.parse(JSON.stringify(DEFAULT_LAYOUT));
  try { const s = localStorage.getItem(getLayoutKey()); if (s) layout = JSON.parse(s); } catch(e) {}

  // Conditionally filter layout based on user permissions
  const canViewQuotes = hasPermission('Quotes', 'view');
  const canViewInvoices = hasPermission('Invoices', 'view');
  const isTechUser = !canViewQuotes && !canViewInvoices;

  layout = layout.filter(item => {
    if (item.id === 'cash-flow' && !canViewInvoices) return false;
    if (item.id === 'uninvoiced-completed' && !canViewInvoices) return false;
    if (item.id === 'pending-approvals' && !canViewQuotes) return false;
    if (item.id === 'profitability-chart' && !canViewInvoices) return false;
    
    if (isTechUser) {
      const allowedWidgets = ['kpi-cards', 'today-schedule', 'recent-activity', 'tech-map', 'daily-todo', 'weather-forecast', 'pinned-job'];
      if (!allowedWidgets.includes(item.id)) return false;
    }
    return true;
  });

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

    const kpiCardsCount = item.id === 'kpi-cards' 
      ? ( (hasPermission('Quotes', 'view') ? 1 : 0) + (hasPermission('Invoices', 'view') ? 2 : 0) + (hasPermission('Jobs', 'view') ? 1 : 0) )
      : 0;
    const bodyStyle = item.id === 'kpi-cards' ? `style="display:grid; grid-template-columns: repeat(${kpiCardsCount}, 1fr);"` : '';

    grid.insertAdjacentHTML('beforeend', `
      <div class="${classes}" data-instance-id="${item.instanceId}" data-id="${item.id}" style="position:relative;">
        <div class="card ${mod.kpiStrip ? 'kpi-strip' : ''}">
          <div class="card-header" style="${headerBg}">
            <span style="font-weight:600;font-size:14px;">${mod.title}</span>
            ${widgetControls}
          </div>
          <div class="card-body" ${bodyStyle}>${mod.render(data, item)}</div>
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

      // Add schedule block
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

      // Update next service date +3 months
      const nextDate = new Date();
      nextDate.setMonth(nextDate.getMonth() + 3);
      store.update('maintenancePlans', plan.id, { nextServiceDate: nextDate.toISOString().split('T')[0] });

      import('../components/Notifications.js').then(({ showToast }) => {
        showToast(`Maintenance Job ${job.number} Dispatched!`, 'success');
      });
      window.__fieldForge.reloadDashboard?.();
    });
  });

  // 9. Daily To-Do Checklist checklist persistency
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
      <div style="background:linear-gradient(135deg, var(--color-primary), #487291); padding:16px; border-radius:10px; color:white; box-shadow:0 4px 15px rgba(49, 86, 113, 0.2); margin-bottom:10px;">
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
