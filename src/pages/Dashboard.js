// ============================================
// SIMPRO CLONE — DASHBOARD PAGE
// ============================================

import { store } from '../data/store.js';

export function renderDashboard(container) {
  const customers = store.getAll('customers');
  const jobs = store.getAll('jobs');
  const quotes = store.getAll('quotes');
  const invoices = store.getAll('invoices');
  const leads = store.getAll('leads');

  const activeJobs = jobs.filter(j => j.status === 'In Progress' || j.status === 'Scheduled').length;
  const pendingQuotes = quotes.filter(q => q.status === 'Sent' || q.status === 'Draft').length;
  const overdueInvoices = invoices.filter(i => i.status === 'Overdue').length;
  const totalRevenue = invoices.filter(i => i.status === 'Paid').reduce((sum, i) => sum + (i.total || 0), 0);

  const jobStatusCounts = {};
  jobs.forEach(j => { jobStatusCounts[j.status] = (jobStatusCounts[j.status] || 0) + 1; });

  container.innerHTML = `
    <div class="page-header">
      <h1>Dashboard</h1>
      <div class="page-header-actions">
        <button class="btn btn-secondary" onclick="window.location.hash='/jobs/new'">
          <span class="material-icons-outlined">add</span> New Job
        </button>
        <button class="btn btn-primary" onclick="window.location.hash='/quotes/new'">
          <span class="material-icons-outlined">add</span> New Quote
        </button>
      </div>
    </div>

    <!-- KPI Cards -->
    <div class="grid-4" style="margin-bottom:var(--space-xl)">
      <div class="stat-card">
        <div class="flex items-center justify-between">
          <div class="stat-label">Total Revenue</div>
          <div class="stat-icon blue"><span class="material-icons-outlined">payments</span></div>
        </div>
        <div class="stat-value">$${totalRevenue.toLocaleString('en-AU', { minimumFractionDigits: 0 })}</div>
        <div class="stat-change positive">
          <span class="material-icons-outlined" style="font-size:16px">trending_up</span>
          <span>+12.5% vs last month</span>
        </div>
      </div>
      <div class="stat-card">
        <div class="flex items-center justify-between">
          <div class="stat-label">Active Jobs</div>
          <div class="stat-icon green"><span class="material-icons-outlined">build</span></div>
        </div>
        <div class="stat-value">${activeJobs}</div>
        <div class="stat-change positive">
          <span class="material-icons-outlined" style="font-size:16px">trending_up</span>
          <span>${jobs.length} total jobs</span>
        </div>
      </div>
      <div class="stat-card">
        <div class="flex items-center justify-between">
          <div class="stat-label">Pending Quotes</div>
          <div class="stat-icon orange"><span class="material-icons-outlined">request_quote</span></div>
        </div>
        <div class="stat-value">${pendingQuotes}</div>
        <div class="stat-change">
          <span style="color:var(--text-tertiary)">${quotes.length} total quotes</span>
        </div>
      </div>
      <div class="stat-card">
        <div class="flex items-center justify-between">
          <div class="stat-label">Overdue Invoices</div>
          <div class="stat-icon red"><span class="material-icons-outlined">warning</span></div>
        </div>
        <div class="stat-value">${overdueInvoices}</div>
        <div class="stat-change ${overdueInvoices > 0 ? 'negative' : ''}">
          <span class="material-icons-outlined" style="font-size:16px">${overdueInvoices > 0 ? 'trending_down' : 'check_circle'}</span>
          <span>${overdueInvoices > 0 ? 'Requires attention' : 'All on track'}</span>
        </div>
      </div>
    </div>

    <div class="grid-2" style="margin-bottom:var(--space-xl)">
      <!-- Job Status Chart -->
      <div class="card">
        <div class="card-header">
          <h4>Job Status Overview</h4>
        </div>
        <div class="card-body">
          <div id="job-status-chart" style="display:flex;flex-direction:column;gap:10px">
            ${renderBarChart(jobStatusCounts, jobs.length)}
          </div>
        </div>
      </div>

      <!-- Recent Activity -->
      <div class="card">
        <div class="card-header">
          <h4>Recent Activity</h4>
        </div>
        <div class="card-body" style="max-height:300px;overflow-y:auto">
          ${renderActivityFeed(jobs, quotes, invoices)}
        </div>
      </div>
    </div>

    <div class="grid-2">
      <!-- Recent Leads -->
      <div class="card">
        <div class="card-header">
          <h4>Recent Leads</h4>
          <a href="#/leads" style="font-size:var(--font-size-sm)">View All →</a>
        </div>
        <div class="card-body" style="padding:0">
          <table class="data-table">
            <thead>
              <tr>
                <th>Lead</th>
                <th>Customer</th>
                <th>Status</th>
                <th>Value</th>
              </tr>
            </thead>
            <tbody>
              ${leads.slice(0, 5).map(l => `
                <tr style="cursor:pointer" onclick="window.location.hash='/leads/${l.id}'">
                  <td class="cell-link font-medium">${l.title}</td>
                  <td class="text-secondary">${l.customerName}</td>
                  <td>${renderLeadBadge(l.status)}</td>
                  <td class="font-medium">$${(l.value || 0).toLocaleString()}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      </div>

      <!-- Upcoming Schedule -->
      <div class="card">
        <div class="card-header">
          <h4>Today's Schedule</h4>
          <a href="#/schedule" style="font-size:var(--font-size-sm)">View Calendar →</a>
        </div>
        <div class="card-body" style="padding:0">
          ${renderTodaySchedule(jobs)}
        </div>
      </div>
    </div>
  `;
}

function renderBarChart(counts, total) {
  const statusColors = {
    'Pending': 'var(--color-warning)',
    'Scheduled': 'var(--color-info)',
    'In Progress': 'var(--color-primary)',
    'On Hold': 'var(--text-tertiary)',
    'Completed': 'var(--color-success)',
    'Invoiced': '#8B5CF6',
  };

  return Object.entries(counts).map(([status, count]) => {
    const pct = total > 0 ? (count / total * 100) : 0;
    const color = statusColors[status] || 'var(--text-tertiary)';
    return `
      <div style="display:flex;align-items:center;gap:12px">
        <span style="width:100px;font-size:var(--font-size-sm);color:var(--text-secondary)">${status}</span>
        <div style="flex:1;height:24px;background:var(--content-bg);border-radius:4px;overflow:hidden">
          <div style="width:${pct}%;height:100%;background:${color};border-radius:4px;transition:width 0.5s ease;min-width:${count > 0 ? '8px' : '0'}"></div>
        </div>
        <span style="width:30px;text-align:right;font-size:var(--font-size-sm);font-weight:600">${count}</span>
      </div>
    `;
  }).join('');
}

function renderActivityFeed(jobs, quotes, invoices) {
  const activities = [];

  jobs.slice(0, 3).forEach(j => {
    activities.push({
      icon: 'build',
      color: 'var(--color-primary)',
      text: `Job <strong>${j.number}</strong> — ${j.title}`,
      sub: j.customerName,
      time: j.updatedAt,
    });
  });

  quotes.slice(0, 3).forEach(q => {
    activities.push({
      icon: 'request_quote',
      color: 'var(--color-warning)',
      text: `Quote <strong>${q.number}</strong> ${q.status.toLowerCase()}`,
      sub: q.customerName,
      time: q.updatedAt,
    });
  });

  invoices.slice(0, 2).forEach(inv => {
    activities.push({
      icon: 'receipt_long',
      color: inv.status === 'Paid' ? 'var(--color-success)' : 'var(--color-danger)',
      text: `Invoice <strong>${inv.number}</strong> — ${inv.status}`,
      sub: inv.customerName,
      time: inv.updatedAt,
    });
  });

  activities.sort((a, b) => new Date(b.time) - new Date(a.time));

  return activities.map(a => `
    <div style="display:flex;gap:12px;padding:10px 0;border-bottom:1px solid var(--border-color)">
      <div style="width:32px;height:32px;border-radius:50%;background:${a.color}15;color:${a.color};display:flex;align-items:center;justify-content:center;flex-shrink:0">
        <span class="material-icons-outlined" style="font-size:16px">${a.icon}</span>
      </div>
      <div style="flex:1;min-width:0">
        <div style="font-size:var(--font-size-base)">${a.text}</div>
        <div style="font-size:var(--font-size-xs);color:var(--text-tertiary)">${a.sub} • ${formatTimeAgo(a.time)}</div>
      </div>
    </div>
  `).join('');
}

function renderLeadBadge(status) {
  const classes = {
    'New': 'badge-info',
    'Contacted': 'badge-primary',
    'Qualified': 'badge-warning',
    'Proposal': 'badge-warning',
    'Negotiation': 'badge-primary',
    'Won': 'badge-success',
    'Lost': 'badge-danger',
  };
  return `<span class="badge ${classes[status] || 'badge-neutral'}">${status}</span>`;
}

function renderTodaySchedule(jobs) {
  const scheduled = jobs.filter(j => j.status === 'Scheduled' || j.status === 'In Progress').slice(0, 5);
  if (scheduled.length === 0) {
    return '<div style="padding:24px;text-align:center;color:var(--text-tertiary)">No jobs scheduled today</div>';
  }

  return `<div style="display:flex;flex-direction:column">
    ${scheduled.map(j => `
      <div style="display:flex;align-items:center;gap:12px;padding:12px 20px;border-bottom:1px solid var(--border-color);cursor:pointer" onclick="window.location.hash='/jobs/${j.id}'">
        <div style="width:4px;height:36px;border-radius:2px;background:${j.status === 'In Progress' ? 'var(--color-primary)' : 'var(--color-warning)'}"></div>
        <div style="flex:1;min-width:0">
          <div style="font-size:var(--font-size-base);font-weight:500" class="truncate">${j.title}</div>
          <div style="font-size:var(--font-size-xs);color:var(--text-tertiary)">${j.technicianName} • ${j.customerName}</div>
        </div>
        <span class="badge ${j.status === 'In Progress' ? 'badge-primary' : 'badge-warning'}">${j.status}</span>
      </div>
    `).join('')}
  </div>`;
}

function formatTimeAgo(dateString) {
  const diff = Date.now() - new Date(dateString).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}
