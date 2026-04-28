// ============================================
// SIMPRO CLONE — DASHBOARD PAGE (Tile Size System)
// ============================================
import { store } from '../data/store.js';

let isEditMode = false;
let grid = null;

// Tile sizes: S=small, M=medium, L=large, XL=extra-large
const TILE_SIZES = {
  S:  { w: 3,  h: 3,  label: 'Small' },
  M:  { w: 6,  h: 3,  label: 'Medium' },
  L:  { w: 6,  h: 5,  label: 'Large' },
  XL: { w: 12, h: 4,  label: 'Extra Large' },
};

// Order to cycle through
const SIZE_ORDER = ['S', 'M', 'L', 'XL'];

const MODULES = {
  'kpi-cards':            { title: 'KPI Cards',                   sizes: ['XL'],        defaultSize: 'XL', render: renderKpiCards },
  'job-status-chart':     { title: 'Job Status Chart',            sizes: ['M','L'],     defaultSize: 'M',  render: renderJobStatusChart },
  'tech-map':             { title: 'Technician GPS Map',          sizes: ['M','L'],     defaultSize: 'L',  render: renderTechMap },
  'recent-activity':      { title: 'Recent Activity',             sizes: ['M','XL'],    defaultSize: 'XL', render: renderRecentActivity },
  'recent-leads':         { title: 'Recent Leads',                sizes: ['M','L'],     defaultSize: 'L',  render: renderRecentLeads },
  'today-schedule':       { title: "Today's Schedule",            sizes: ['M','L'],     defaultSize: 'L',  render: renderTodaySchedule },
  'pinned-job':           { title: 'Pinned Job Progress',         sizes: ['S','M'],     defaultSize: 'M',  render: () => renderPlaceholder('Select a job to pin') },
  'unassigned-jobs':      { title: 'Unassigned Jobs Queue',       sizes: ['M','L'],     defaultSize: 'M',  render: () => renderPlaceholder('No unassigned jobs') },
  'uninvoiced-completed': { title: 'Uninvoiced Completed Jobs',   sizes: ['M','L'],     defaultSize: 'M',  render: () => renderPlaceholder('All completed jobs invoiced') },
  'low-stock':            { title: 'Low Stock Alerts',            sizes: ['S','M'],     defaultSize: 'S',  render: () => renderPlaceholder('Inventory looks good') },
  'profitability-chart':  { title: 'Profitability Chart',         sizes: ['M','L','XL'],defaultSize: 'L',  render: () => renderPlaceholder('Mock Profitability Data') },
  'staff-availability':   { title: 'Staff Availability Board',    sizes: ['M','L'],     defaultSize: 'M',  render: () => renderPlaceholder('All staff active') },
  'timesheet-exceptions': { title: 'Timesheet Exceptions',        sizes: ['S','M'],     defaultSize: 'S',  render: () => renderPlaceholder('No timesheet alerts') },
  'fleet-status':         { title: 'Fleet Status Alerts',         sizes: ['S','M'],     defaultSize: 'M',  render: () => renderPlaceholder('Fleet operational') },
  'overdue-maintenance':  { title: 'Overdue Maintenance',         sizes: ['S','M'],     defaultSize: 'M',  render: () => renderPlaceholder('No overdue maintenance') },
  'top-customers':        { title: 'Top Customers Leaderboard',   sizes: ['M','L'],     defaultSize: 'M',  render: () => renderPlaceholder('Mock Top Customers') },
  'daily-todo':           { title: 'Daily Quick To-Do',           sizes: ['S','M'],     defaultSize: 'S',  render: () => renderPlaceholder('No tasks added') },
  'pending-approvals':    { title: 'Pending Approvals',           sizes: ['S','M'],     defaultSize: 'M',  render: () => renderPlaceholder('No pending quotes') },
  'customer-nps':         { title: 'Customer Satisfaction (NPS)', sizes: ['S','M'],     defaultSize: 'S',  render: () => renderPlaceholder('NPS Score: 8.5/10') },
  'cash-flow':            { title: 'Cash Flow Summary',           sizes: ['S','M'],     defaultSize: 'M',  render: () => renderPlaceholder('+ $15,240 this week') },
  'weather-forecast':     { title: 'Weather Forecast',            sizes: ['S','M'],     defaultSize: 'S',  render: () => renderPlaceholder('Sunny, 24\u00b0C') },
};

function renderPlaceholder(msg) {
  return `<div style="height:100%;display:flex;align-items:center;justify-content:center;color:var(--text-tertiary);font-size:14px;text-align:center;padding:16px;">${msg}</div>`;
}

const DEFAULT_LAYOUT = [
  { id: 'kpi-cards',        x: 0, y: 0, size: 'XL' },
  { id: 'job-status-chart', x: 0, y: 4, size: 'M'  },
  { id: 'tech-map',         x: 6, y: 4, size: 'L'  },
  { id: 'recent-activity',  x: 0, y: 9, size: 'XL' },
  { id: 'recent-leads',     x: 0, y: 13, size: 'L' },
  { id: 'today-schedule',   x: 6, y: 13, size: 'L' },
];

export function renderDashboard(container) {
  let layout = DEFAULT_LAYOUT;
  try { const s = localStorage.getItem('dashboardLayout'); if (s) layout = JSON.parse(s); } catch(e) {}

  const data = {
    customers: store.getAll('customers'),
    jobs:      store.getAll('jobs'),
    quotes:    store.getAll('quotes'),
    invoices:  store.getAll('invoices'),
    leads:     store.getAll('leads'),
    people:    store.getAll('people'),
  };

  container.innerHTML = `
    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:20px;">
      <div style="display:flex;align-items:center;gap:10px;">
        <h1 style="margin:0;">Dashboard</h1>
        <button id="btn-edit-dashboard" class="btn btn-secondary btn-sm" style="display:flex;align-items:center;gap:4px;">
          <span class="material-icons-outlined" style="font-size:18px;">edit</span> Customise
        </button>
      </div>
      <div id="dashboard-actions" style="display:flex;gap:8px;"></div>
    </div>
    <div id="grid-container" class="grid-stack"></div>`;

  const gridContainer = container.querySelector('#grid-container');

  function buildItemHTML(item, editMode) {
    const mod = MODULES[item.id];
    if (!mod) return '';
    const tile = TILE_SIZES[item.size] || TILE_SIZES[mod.defaultSize];
    const sizeIdx = SIZE_ORDER.indexOf(item.size);
    const allowedSizes = mod.sizes;
    const nextSize = allowedSizes[(allowedSizes.indexOf(item.size) + 1) % allowedSizes.length];

    const editControls = editMode ? `
      <div style="display:flex;align-items:center;gap:4px;">
        <button class="btn btn-ghost btn-icon btn-sm btn-cycle-size" data-id="${item.id}" data-next="${nextSize}" title="Size: ${item.size} → ${nextSize}">
          <span class="material-icons-outlined" style="font-size:15px;">aspect_ratio</span>
        </button>
        <span style="font-size:11px;color:var(--text-tertiary);font-weight:600;">${item.size}</span>
        <button class="btn btn-ghost btn-icon btn-sm btn-remove-module" data-id="${item.id}">
          <span class="material-icons-outlined" style="font-size:15px;">close</span>
        </button>
      </div>` : '';

    return `
      <div class="grid-stack-item" gs-id="${item.id}" gs-x="${item.x || 0}" gs-y="${item.y || 0}" gs-w="${tile.w}" gs-h="${tile.h}" gs-no-resize="true">
        <div class="grid-stack-item-content" style="border-radius:8px;overflow:hidden;display:flex;flex-direction:column;height:100%;background:var(--card-bg);border:1px solid var(--card-border);box-shadow:var(--card-shadow);">
          <div style="display:flex;justify-content:space-between;align-items:center;padding:12px 16px;border-bottom:1px solid var(--border-color);flex-shrink:0;${editMode ? 'background:rgba(27,109,224,0.04);' : ''}">
            <span style="font-weight:600;font-size:14px;">${mod.title}</span>
            ${editControls}
          </div>
          <div style="flex:1;overflow:hidden;min-height:0;">
            ${mod.render(data)}
          </div>
        </div>
      </div>`;
  }

  function renderGrid() {
    gridContainer.innerHTML = '';
    layout.forEach(item => {
      const mod = MODULES[item.id];
      if (!mod) return;
      if (!item.size) item.size = mod.defaultSize;
      gridContainer.insertAdjacentHTML('beforeend', buildItemHTML(item, isEditMode));
    });

    if (grid) { try { grid.destroy(false); } catch(e) {} }

    if (typeof GridStack === 'undefined') {
      gridContainer.innerHTML = '<div style="padding:24px;text-align:center;color:var(--color-danger);">GridStack failed to load. Check index.html CDN links.</div>';
      return;
    }

    grid = GridStack.init({
      column: 12,
      cellHeight: 70,
      margin: 12,
      marginUnit: 'px',
      staticGrid: !isEditMode,
      disableResize: true,
      disableOneColumnMode: true,
      animate: true,
    }, gridContainer);

    // Wire up edit-mode buttons
    gridContainer.querySelectorAll('.btn-remove-module').forEach(btn => {
      btn.addEventListener('click', e => {
        const id = e.currentTarget.dataset.id;
        layout = layout.filter(i => i.id !== id);
        const el = gridContainer.querySelector(`.grid-stack-item[gs-id="${id}"]`);
        if (el && grid) grid.removeWidget(el);
      });
    });

    gridContainer.querySelectorAll('.btn-cycle-size').forEach(btn => {
      btn.addEventListener('click', e => {
        const id = e.currentTarget.dataset.id;
        const nextSize = e.currentTarget.dataset.next;
        const item = layout.find(i => i.id === id);
        if (!item) return;
        item.size = nextSize;
        const tile = TILE_SIZES[nextSize];
        const el = gridContainer.querySelector(`.grid-stack-item[gs-id="${id}"]`);
        if (el && grid) grid.update(el, { w: tile.w, h: tile.h });
        // Refresh the header controls to show updated size label
        const header = el.querySelector('.btn-cycle-size');
        const mod = MODULES[id];
        const allowedSizes = mod.sizes;
        const newNext = allowedSizes[(allowedSizes.indexOf(nextSize) + 1) % allowedSizes.length];
        if (header) {
          header.dataset.next = newNext;
          header.title = `Size: ${nextSize} → ${newNext}`;
          const sizeLabel = header.parentElement.querySelector('span:not(.material-icons-outlined)');
          if (sizeLabel) sizeLabel.textContent = nextSize;
        }
      });
    });
  }

  function updateHeader() {
    const actions = container.querySelector('#dashboard-actions');
    const editBtn = container.querySelector('#btn-edit-dashboard');

    if (isEditMode) {
      editBtn.style.display = 'none';
      actions.innerHTML = `
        <button class="btn btn-secondary btn-sm" id="btn-add-module"><span class="material-icons-outlined" style="font-size:16px;">add</span> Add Widget</button>
        <button class="btn btn-secondary btn-sm" id="btn-cancel-edit">Cancel</button>
        <button class="btn btn-primary btn-sm" id="btn-save-layout"><span class="material-icons-outlined" style="font-size:16px;">save</span> Save Layout</button>`;

      actions.querySelector('#btn-save-layout').addEventListener('click', () => {
        if (grid) {
          layout = grid.engine.nodes.map(n => ({
            id: n.el.getAttribute('gs-id'),
            x: n.x, y: n.y,
            size: layout.find(i => i.id === n.el.getAttribute('gs-id'))?.size || MODULES[n.el.getAttribute('gs-id')]?.defaultSize || 'M'
          }));
          localStorage.setItem('dashboardLayout', JSON.stringify(layout));
        }
        isEditMode = false;
        updateHeader();
        renderGrid();
      });

      actions.querySelector('#btn-cancel-edit').addEventListener('click', () => {
        // Restore saved layout
        try { const s = localStorage.getItem('dashboardLayout'); if (s) layout = JSON.parse(s); else layout = DEFAULT_LAYOUT; } catch(e) { layout = DEFAULT_LAYOUT; }
        isEditMode = false;
        updateHeader();
        renderGrid();
      });

      actions.querySelector('#btn-add-module').addEventListener('click', showAddModuleModal);
    } else {
      editBtn.style.display = '';
      actions.innerHTML = `
        <button class="btn btn-secondary btn-sm" onclick="window.location.hash='/jobs/new'"><span class="material-icons-outlined" style="font-size:16px;">add</span> New Job</button>
        <button class="btn btn-primary btn-sm" onclick="window.location.hash='/quotes/new'"><span class="material-icons-outlined" style="font-size:16px;">add</span> New Quote</button>`;
    }
  }

  container.querySelector('#btn-edit-dashboard').addEventListener('click', () => {
    isEditMode = true;
    updateHeader();
    renderGrid();
  });

  function showAddModuleModal() {
    const activeIds = layout.map(i => i.id);
    const available = Object.entries(MODULES).filter(([id]) => !activeIds.includes(id));
    const content = document.createElement('div');
    content.innerHTML = available.length === 0
      ? `<p style="text-align:center;color:var(--text-tertiary);">All modules are on your dashboard!</p>`
      : `<div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;max-height:420px;overflow-y:auto;">
          ${available.map(([id, mod]) => `
            <div data-id="${id}" style="padding:12px 14px;border:1px solid var(--border-color);border-radius:8px;cursor:pointer;display:flex;align-items:center;gap:8px;transition:all 0.15s;" 
              onmouseover="this.style.borderColor='var(--color-primary)';this.style.background='var(--color-primary-light)';"
              onmouseout="this.style.borderColor='var(--border-color)';this.style.background='';">
              <span class="material-icons-outlined" style="color:var(--color-primary);font-size:20px;">widgets</span>
              <div>
                <div style="font-weight:600;font-size:13px;">${mod.title}</div>
                <div style="font-size:11px;color:var(--text-tertiary);">Sizes: ${mod.sizes.join(', ')}</div>
              </div>
            </div>`).join('')}
        </div>`;

    import('../components/Modal.js').then(({ showModal }) => {
      showModal({ title: 'Add Widget', content, actions: [{ label: 'Close', className: 'btn-secondary', onClick: close => close() }] });

      content.querySelectorAll('[data-id]').forEach(el => {
        el.addEventListener('click', e => {
          const id = e.currentTarget.dataset.id;
          const mod = MODULES[id];
          const newItem = { id, x: 0, y: 0, size: mod.defaultSize };
          layout.push(newItem);
          const tile = TILE_SIZES[mod.defaultSize];
          const html = buildItemHTML(newItem, true);
          if (grid) {
            const widget = grid.addWidget(html.trim());
            widget.querySelector('.btn-remove-module')?.addEventListener('click', () => {
              layout = layout.filter(i => i.id !== id);
              grid.removeWidget(widget);
            });
            widget.querySelector('.btn-cycle-size')?.addEventListener('click', ev => {
              const nextSize = ev.currentTarget.dataset.next;
              newItem.size = nextSize;
              const t = TILE_SIZES[nextSize];
              grid.update(widget, { w: t.w, h: t.h });
            });
          }
          document.querySelector('.modal-overlay')?.remove();
        });
      });
    });
  }

  updateHeader();
  renderGrid();
}

// ─── MODULE RENDERERS ────────────────────────────────────────────────────────

function renderKpiCards(data) {
  const activeJobs = data.jobs.filter(j => j.status === 'In Progress' || j.status === 'Scheduled').length;
  const pendingQuotes = data.quotes.filter(q => q.status === 'Sent' || q.status === 'Draft').length;
  const overdueInvoices = data.invoices.filter(i => i.status === 'Overdue').length;
  const totalRevenue = data.invoices.filter(i => i.status === 'Paid').reduce((s, i) => s + (i.total || 0), 0);
  const kpis = [
    { label: 'Total Revenue', value: '$' + totalRevenue.toLocaleString('en-AU'), icon: 'payments', color: 'blue', sub: '+12.5% vs last month', positive: true },
    { label: 'Active Jobs', value: activeJobs, icon: 'build', color: 'green', sub: `${data.jobs.length} total`, positive: true },
    { label: 'Pending Quotes', value: pendingQuotes, icon: 'request_quote', color: 'orange', sub: `${data.quotes.length} total`, positive: null },
    { label: 'Overdue Invoices', value: overdueInvoices, icon: 'warning', color: 'red', sub: overdueInvoices > 0 ? 'Requires attention' : 'All on track', positive: overdueInvoices === 0 },
  ];
  return `<div style="display:grid;grid-template-columns:repeat(4,1fr);gap:12px;padding:12px;height:100%;box-sizing:border-box;">
    ${kpis.map(k => `
      <div class="stat-card" style="margin:0;">
        <div style="display:flex;justify-content:space-between;align-items:center;">
          <div class="stat-label">${k.label}</div>
          <div class="stat-icon ${k.color}"><span class="material-icons-outlined">${k.icon}</span></div>
        </div>
        <div class="stat-value">${k.value}</div>
        <div class="stat-change ${k.positive === true ? 'positive' : k.positive === false ? 'negative' : ''}">
          <span style="font-size:12px;">${k.sub}</span>
        </div>
      </div>`).join('')}
  </div>`;
}

function renderJobStatusChart(data) {
  const counts = {};
  data.jobs.forEach(j => { counts[j.status] = (counts[j.status] || 0) + 1; });
  const total = data.jobs.length;
  const colors = { 'Pending': 'var(--color-warning)', 'Scheduled': 'var(--color-info)', 'In Progress': 'var(--color-primary)', 'On Hold': 'var(--text-tertiary)', 'Completed': 'var(--color-success)', 'Invoiced': '#8B5CF6' };
  return `<div style="padding:16px;display:flex;flex-direction:column;gap:10px;height:100%;box-sizing:border-box;overflow-y:auto;">
    ${Object.entries(counts).map(([status, count]) => {
      const pct = total > 0 ? (count / total * 100).toFixed(1) : 0;
      const color = colors[status] || 'var(--text-tertiary)';
      return `<div style="display:flex;align-items:center;gap:10px;">
        <span style="width:90px;font-size:13px;color:var(--text-secondary);flex-shrink:0;">${status}</span>
        <div style="flex:1;height:20px;background:var(--content-bg);border-radius:4px;overflow:hidden;">
          <div style="width:${pct}%;height:100%;background:${color};border-radius:4px;transition:width 0.5s;min-width:${count > 0 ? '6px' : '0'};"></div>
        </div>
        <span style="width:24px;text-align:right;font-size:13px;font-weight:600;">${count}</span>
      </div>`;
    }).join('')}
  </div>`;
}

function renderTechMap(data) {
  const techs = data.people.filter(p => p.type === 'Staff').slice(0, 4);
  const markers = techs.length === 0
    ? '<div style="position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);color:#888;">No technicians active</div>'
    : techs.map((t, i) => {
        const top = 15 + (i * 22) + (Math.sin(i) * 12);
        const left = 15 + (i * 18) + (Math.cos(i) * 18);
        return `<div style="position:absolute;top:${top}%;left:${left}%;transform:translate(-50%,-100%);display:flex;flex-direction:column;align-items:center;z-index:10;">
          <div style="background:white;padding:2px 6px;border-radius:4px;font-size:10px;font-weight:600;box-shadow:0 2px 4px rgba(0,0,0,0.2);margin-bottom:2px;white-space:nowrap;">${t.firstName}</div>
          <div style="width:22px;height:22px;background:var(--color-primary);color:white;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:11px;font-weight:bold;border:2px solid white;box-shadow:0 2px 4px rgba(0,0,0,0.3);">${t.firstName[0]}</div>
          <div style="width:0;height:0;border-left:5px solid transparent;border-right:5px solid transparent;border-top:7px solid var(--color-primary);margin-top:-1px;"></div>
        </div>`;
      }).join('');
  return `<div style="position:relative;width:100%;height:100%;background:#e5e3df;overflow:hidden;">
    <div style="position:absolute;inset:0;background-image:linear-gradient(rgba(0,0,0,0.05) 1px,transparent 1px),linear-gradient(90deg,rgba(0,0,0,0.05) 1px,transparent 1px);background-size:20px 20px;"></div>
    ${markers}
    <div style="position:absolute;bottom:8px;right:8px;background:rgba(255,255,255,0.85);padding:4px 8px;font-size:10px;border-radius:4px;box-shadow:0 1px 3px rgba(0,0,0,0.2);">Mock Map</div>
  </div>`;
}

function renderRecentActivity(data) {
  const acts = [];
  data.jobs.slice(0,3).forEach(j => acts.push({ icon:'build', color:'var(--color-primary)', text:`Job <strong>${j.number}</strong> — ${j.title}`, sub: j.customerName, time: j.updatedAt }));
  data.quotes.slice(0,3).forEach(q => acts.push({ icon:'request_quote', color:'var(--color-warning)', text:`Quote <strong>${q.number}</strong> ${q.status.toLowerCase()}`, sub: q.customerName, time: q.updatedAt }));
  data.invoices.slice(0,2).forEach(inv => acts.push({ icon:'receipt_long', color: inv.status==='Paid' ? 'var(--color-success)' : 'var(--color-danger)', text:`Invoice <strong>${inv.number}</strong> — ${inv.status}`, sub: inv.customerName, time: inv.updatedAt }));
  acts.sort((a,b) => new Date(b.time) - new Date(a.time));
  return `<div style="overflow-y:auto;height:100%;padding:0 16px;">
    ${acts.map(a => `<div style="display:flex;gap:10px;padding:10px 0;border-bottom:1px solid var(--border-color);">
      <div style="width:30px;height:30px;border-radius:50%;background:${a.color}20;color:${a.color};display:flex;align-items:center;justify-content:center;flex-shrink:0;">
        <span class="material-icons-outlined" style="font-size:15px;">${a.icon}</span>
      </div>
      <div style="flex:1;min-width:0;">
        <div style="font-size:13px;">${a.text}</div>
        <div style="font-size:11px;color:var(--text-tertiary);">${a.sub} · ${formatTimeAgo(a.time)}</div>
      </div>
    </div>`).join('')}
  </div>`;
}

function renderRecentLeads(data) {
  const bc = { 'New':'badge-info','Contacted':'badge-primary','Qualified':'badge-warning','Won':'badge-success','Lost':'badge-danger' };
  return `<div style="overflow-y:auto;height:100%;">
    <table class="data-table" style="width:100%;">
      <thead><tr><th>Lead</th><th>Customer</th><th>Status</th></tr></thead>
      <tbody>${data.leads.slice(0,6).map(l => `
        <tr style="cursor:pointer;" onclick="window.location.hash='/leads/${l.id}'">
          <td class="cell-link font-medium">${l.title}</td>
          <td style="color:var(--text-secondary);">${l.customerName}</td>
          <td><span class="badge ${bc[l.status]||'badge-neutral'}">${l.status}</span></td>
        </tr>`).join('')}
      </tbody>
    </table>
  </div>`;
}

function renderTodaySchedule(data) {
  const jobs = data.jobs.filter(j => j.status === 'Scheduled' || j.status === 'In Progress').slice(0,6);
  if (!jobs.length) return `<div style="height:100%;display:flex;align-items:center;justify-content:center;color:var(--text-tertiary);">No jobs scheduled today</div>`;
  return `<div style="overflow-y:auto;height:100%;display:flex;flex-direction:column;">
    ${jobs.map(j => `
      <div style="display:flex;align-items:center;gap:10px;padding:10px 16px;border-bottom:1px solid var(--border-color);cursor:pointer;" onclick="window.location.hash='/jobs/${j.id}'">
        <div style="width:3px;height:32px;border-radius:2px;flex-shrink:0;background:${j.status==='In Progress'?'var(--color-primary)':'var(--color-warning)'};"></div>
        <div style="flex:1;min-width:0;">
          <div style="font-size:13px;font-weight:500;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">${j.title}</div>
          <div style="font-size:11px;color:var(--text-tertiary);">${j.technicianName} · ${j.customerName}</div>
        </div>
        <span class="badge ${j.status==='In Progress'?'badge-primary':'badge-warning'}">${j.status}</span>
      </div>`).join('')}
  </div>`;
}

function formatTimeAgo(d) {
  const m = Math.floor((Date.now() - new Date(d)) / 60000);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}
