// ============================================
// SIMPRO CLONE — REPORTS MODULE
// ============================================

import { store } from '../../data/store.js';

export function renderReports(container) {
  let activeReport = 'overview';

  const reports = [
    { id: 'overview', label: 'Business Overview', icon: 'dashboard' },
    { id: 'revenue', label: 'Revenue & Profit', icon: 'trending_up' },
    { id: 'jobs', label: 'Job Performance', icon: 'build' },
    { id: 'job_costing', label: 'Job Costing', icon: 'price_check' },
    { id: 'technicians', label: 'Technician Productivity', icon: 'engineering' },
    { id: 'customers', label: 'Customer Analysis', icon: 'people' },
    { id: 'inventory', label: 'Inventory Report', icon: 'inventory_2' },
  ];

  function getData() {
    const jobs = store.getAll('jobs');
    const quotes = store.getAll('quotes');
    const invoices = store.getAll('invoices');
    const customers = store.getAll('customers');
    const stock = store.getAll('stock');
    const technicians = store.getAll('technicians');
    const leads = store.getAll('leads');

    // Revenue calcs
    const totalRevenue = invoices.filter(i => i.status === 'Paid').reduce((s, i) => s + (i.total || 0), 0);
    const totalOutstanding = invoices.filter(i => i.status === 'Sent' || i.status === 'Overdue').reduce((s, i) => s + (i.total || 0), 0);
    const avgJobValue = jobs.length > 0 ? jobs.reduce((s, j) => s + (j.laborCost || 0) + (j.materialCost || 0), 0) / jobs.length : 0;
    const quoteWinRate = quotes.length > 0 ? (quotes.filter(q => q.status === 'Accepted').length / quotes.length * 100) : 0;
    const leadConvRate = leads.length > 0 ? (leads.filter(l => l.status === 'Won').length / leads.length * 100) : 0;

    // By status
    const jobsByStatus = {};
    jobs.forEach(j => { jobsByStatus[j.status] = (jobsByStatus[j.status] || 0) + 1; });
    const invByStatus = {};
    invoices.forEach(i => { invByStatus[i.status] = (invByStatus[i.status] || 0) + 1; });

    // Technician stats
    const techStats = technicians.map(t => {
      const techJobs = jobs.filter(j => j.technicianId === t.id);
      const completed = techJobs.filter(j => j.status === 'Completed' || j.status === 'Invoiced').length;
      const revenue = techJobs.reduce((s, j) => s + (j.laborCost || 0) + (j.materialCost || 0), 0);
      return { ...t, totalJobs: techJobs.length, completed, revenue };
    });

    // Customer revenue
    const custRevenue = {};
    invoices.filter(i => i.status === 'Paid').forEach(i => {
      custRevenue[i.customerName] = (custRevenue[i.customerName] || 0) + (i.total || 0);
    });
    const topCustomers = Object.entries(custRevenue).sort((a, b) => b[1] - a[1]).slice(0, 10);

    // Stock value
    const totalStockValue = stock.reduce((s, i) => s + (i.quantity * i.costPrice), 0);
    const lowStockItems = stock.filter(i => i.quantity <= i.reorderLevel);
    const timesheets = store.getAll('timesheets');

    // Pre-calculate hours and costs by job for performance
    const hoursByJob = {};
    const internalLaborCostByJob = {};
    
    const people = store.getAll('technicians');
    const techRates = {};
    people.forEach(p => { if (p.payRate) techRates[p.id] = p.payRate; });

    timesheets.forEach(t => {
      hoursByJob[t.jobId] = (hoursByJob[t.jobId] || 0) + (t.hours || 0);
      const rate = t.payRate || techRates[t.technicianId] || 0;
      internalLaborCostByJob[t.jobId] = (internalLaborCostByJob[t.jobId] || 0) + (t.hours * rate);
    });

    return { 
      jobs, quotes, invoices, customers, stock, technicians, leads, 
      totalRevenue, totalOutstanding, avgJobValue, quoteWinRate, leadConvRate, 
      jobsByStatus, invByStatus, techStats, topCustomers, totalStockValue, 
      lowStockItems, timesheets, hoursByJob, internalLaborCostByJob 
    };
  }

  function render() {
    const d = getData();

    container.innerHTML = `
      <div class="page-header">
        <h1>Reports & Analytics</h1>
        <div class="page-header-actions">
          <button class="btn btn-secondary" id="btn-export-csv" data-tooltip="Export current report data to CSV" data-tooltip-pos="left"><span class="material-icons-outlined">download</span> Export CSV</button>
        </div>
      </div>

      <div style="display:flex;gap:var(--space-lg)">
        <!-- Report Sidebar -->
        <div style="width:220px;flex-shrink:0">
          <div class="card">
            <div class="card-body" style="padding:var(--space-sm)">
              ${reports.map(r => `
                <button class="report-nav-item ${activeReport === r.id ? 'active' : ''}" data-report="${r.id}" data-tooltip="View ${escapeHTML(r.label)} report" data-tooltip-pos="right" style="
                  display:flex;align-items:center;gap:10px;padding:10px 14px;width:100%;border:none;
                  background:${activeReport === r.id ? 'var(--color-primary-light)' : 'transparent'};
                  color:${activeReport === r.id ? 'var(--color-primary)' : 'var(--text-secondary)'};
                  border-radius:var(--border-radius);cursor:pointer;font-size:var(--font-size-sm);
                  font-weight:${activeReport === r.id ? '600' : '500'};transition:all var(--transition-fast);
                  text-align:left;
                ">
                  <span class="material-icons-outlined" style="font-size:18px">${r.icon}</span>
                  ${r.label}
                </button>
              `).join('')}
            </div>
          </div>
        </div>

        <!-- Report Content -->
        <div style="flex:1" id="report-content"></div>
      </div>
    `;

    renderReport(d);
    bindEvents(d);
  }

  function renderReport(d) {
    const rc = container.querySelector('#report-content');

    switch (activeReport) {
      case 'overview':
        rc.innerHTML = renderOverviewReport(d);
        break;
      case 'revenue':
        rc.innerHTML = renderRevenueReport(d);
        break;
      case 'jobs':
        rc.innerHTML = renderJobsReport(d);
        break;
      case 'job_costing':
        rc.innerHTML = renderJobCostingReport(d);
        break;
      case 'technicians':
        rc.innerHTML = renderTechniciansReport(d);
        break;
      case 'customers':
        rc.innerHTML = renderCustomersReport(d);
        break;
      case 'inventory':
        rc.innerHTML = renderInventoryReport(d);
        break;
      default:
        rc.innerHTML = '<div class="text-secondary">Select a report to view</div>';
    }
  }

  function bindEvents(d) {
    container.querySelectorAll('[data-report]').forEach(btn => {
      btn.addEventListener('click', () => { activeReport = btn.dataset.report; render(); });
    });

    container.querySelector('#btn-export-csv')?.addEventListener('click', () => exportCSV(d));
  }

  function exportCSV(d) {
    let csv = '';
    if (activeReport === 'overview' || activeReport === 'revenue') {
      csv = 'Invoice #,Customer,Status,Total,Issue Date,Due Date\n';
      d.invoices.forEach(i => {
        csv += `"${i.number}","${i.customerName}","${i.status}",${i.total || 0},"${i.issueDate || ''}","${i.dueDate || ''}"\n`;
      });    } else if (activeReport === 'job_costing') {
      const settings = store.getSettings();
      csv = 'Job #,Technician,Actual Hrs,Internal Labor Cost,Billable Labor,Profit,Margin %\n';
      const costingData = d.jobs.filter(j => j.status === 'Completed' || j.status === 'Invoiced').map(j => {
        const actualH = d.hoursByJob[j.id] || 0;
        const actualLabor = d.internalLaborCostByJob[j.id] || j.laborCost || 0;
        
        const profile = settings.laborRates.find(r => r.id === j.laborRateProfileId) || settings.laborRates.find(r => r.isDefault);
        const billableLabor = Math.max(actualH * (profile?.rate || 85), profile?.minCallOutFee || 0);
        const profit = billableLabor - actualLabor;
        const margin = billableLabor > 0 ? (profit / billableLabor * 100) : 0;
        
        return { num: j.number, tech: j.technicianName || '', actualH, actualLabor, billableLabor, profit, margin };
      });
      costingData.forEach(j => {
        csv += `"${j.num}","${j.tech}",${j.actualH},${j.actualLabor.toFixed(2)},${j.billableLabor.toFixed(2)},${j.profit.toFixed(2)},${j.margin.toFixed(1)}%\n`;
      });

    } else if (activeReport === 'jobs') {
      csv = 'Job #,Title,Customer,Technician,Status,Priority,Labor,Material\n';
      d.jobs.forEach(j => {
        csv += `"${j.number}","${j.title}","${j.customerName}","${j.technicianName || ''}","${j.status}","${j.priority}",${j.laborCost || 0},${j.materialCost || 0}\n`;
      });
    } else if (activeReport === 'technicians') {
      csv = 'Name,Role,Total Jobs,Completed,Revenue\n';
      d.techStats.forEach(t => {
        csv += `"${t.name}","${t.role}",${t.totalJobs},${t.completed},${t.revenue}\n`;
      });
    } else if (activeReport === 'customers') {
      csv = 'Company,First Name,Last Name,Email,Phone,Status\n';
      d.customers.forEach(c => {
        csv += `"${c.company}","${c.firstName}","${c.lastName}","${c.email}","${c.phone}","${c.status}"\n`;
      });
    } else if (activeReport === 'inventory') {
      csv = 'Name,SKU,Category,Quantity,Cost Price,Sell Price,Location,Supplier\n';
      d.stock.forEach(i => {
        csv += `"${i.name}","${i.sku}","${i.category}",${i.quantity},${i.costPrice},${i.unitPrice},"${i.location}","${i.supplier}"\n`;
      });
    }

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `simpro_${activeReport}_report.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  render();
}

// ---- Helper rendering functions ----

function kpi(label, value, icon, color) {
  const colors = { green: 'var(--color-success)', blue: 'var(--color-primary)', orange: 'var(--color-warning)', red: 'var(--color-danger)' };
  const bgs = { green: 'var(--color-success-bg)', blue: 'var(--color-primary-light)', orange: 'var(--color-warning-bg)', red: 'var(--color-danger-bg)' };
  return `
    <div class="stat-card">
      <div style="display:flex;justify-content:space-between;align-items:flex-start">
        <div class="stat-label">${label}</div>
        <div style="width:36px;height:36px;border-radius:var(--border-radius);background:${bgs[color]};display:flex;align-items:center;justify-content:center">
          <span class="material-icons-outlined" style="font-size:18px;color:${colors[color]}">${icon}</span>
        </div>
      </div>
      <div class="stat-value" style="font-size:var(--font-size-2xl)">${value}</div>
    </div>
  `;
}

function miniStat(label, value, icon) {
  return `
    <div class="card">
      <div class="card-body" style="display:flex;align-items:center;gap:12px;padding:var(--space-base)">
        <span class="material-icons-outlined" style="font-size:24px;color:var(--text-tertiary)">${icon}</span>
        <div>
          <div style="font-size:var(--font-size-xl);font-weight:700">${value}</div>
          <div style="font-size:var(--font-size-xs);color:var(--text-tertiary)">${label}</div>
        </div>
      </div>
    </div>
  `;
}

function barChart(data, colorMap = {}, defaultColor = '#1B6DE0') {
  const entries = Object.entries(data);
  if (entries.length === 0) return '<div class="text-secondary text-sm">No data available</div>';
  const max = Math.max(...entries.map(([, v]) => v));

  return entries.map(([label, value]) => {
    const color = colorMap[label] || defaultColor;
    const pct = max > 0 ? (value / max * 100) : 0;
    return `
      <div style="display:flex;align-items:center;gap:12px;margin-bottom:10px">
        <div style="width:100px;font-size:var(--font-size-sm);color:var(--text-secondary);text-align:right;flex-shrink:0">${label}</div>
        <div style="flex:1;height:24px;background:var(--border-color);border-radius:4px;overflow:hidden">
          <div style="height:100%;width:${pct}%;background:${color};border-radius:4px;transition:width 0.5s ease"></div>
        </div>
        <div style="width:50px;font-size:var(--font-size-sm);font-weight:600;text-align:right">${typeof value === 'number' && value >= 1000 ? `$${(value/1000).toFixed(1)}k` : value}</div>
      </div>
    `;
  }).join('');
}

function progressBar(label, value, max, color) {
  const pct = max > 0 ? (value / max * 100) : 0;
  const formatted = typeof value === 'number' ? `$${value.toLocaleString('en-AU', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : value;
  return `
    <div style="margin-bottom:16px">
      <div style="display:flex;justify-content:space-between;margin-bottom:4px">
        <span style="font-size:var(--font-size-sm);font-weight:500">${label}</span>
        <span style="font-size:var(--font-size-sm);font-weight:600">${formatted}</span>
      </div>
      <div style="height:8px;background:var(--border-color);border-radius:4px;overflow:hidden">
        <div style="height:100%;width:${pct}%;background:${color};border-radius:4px;transition:width 0.5s ease"></div>
      </div>
    </div>
  `;
}

function renderOverviewReport(d) {
  return `
    <div class="grid-4" style="margin-bottom:var(--space-lg)">
      ${kpi('Total Revenue', `$${d.totalRevenue.toLocaleString('en-AU',{minimumFractionDigits:2,maximumFractionDigits:2})}`, 'account_balance', 'green')}
      ${kpi('Outstanding', `$${d.totalOutstanding.toLocaleString('en-AU',{minimumFractionDigits:2,maximumFractionDigits:2})}`, 'pending', 'orange')}
      ${kpi('Quote Win Rate', `${d.quoteWinRate.toFixed(0)}%`, 'emoji_events', 'blue')}
      ${kpi('Lead Conversion', `${d.leadConvRate.toFixed(0)}%`, 'trending_up', 'green')}
    </div>
    <div class="grid-2" style="margin-bottom:var(--space-lg)">
      <div class="card">
        <div class="card-header"><h4>Jobs by Status</h4></div>
        <div class="card-body">${barChart(d.jobsByStatus, { 'Pending':'#F59E0B','Scheduled':'#3B82F6','In Progress':'#1B6DE0','On Hold':'#6B7280','Completed':'#10B981','Invoiced':'#8B5CF6' })}</div>
      </div>
      <div class="card">
        <div class="card-header"><h4>Invoices by Status</h4></div>
        <div class="card-body">${barChart(d.invByStatus, { 'Draft':'#6B7280','Sent':'#3B82F6','Paid':'#10B981','Overdue':'#EF4444' })}</div>
      </div>
    </div>
    <div class="grid-3">
      ${miniStat('Total Jobs', d.jobs.length, 'build')}
      ${miniStat('Total Quotes', d.quotes.length, 'request_quote')}
      ${miniStat('Total Invoices', d.invoices.length, 'receipt_long')}
      ${miniStat('Total Customers', d.customers.length, 'people')}
      ${miniStat('Avg Job Value', `$${d.avgJobValue.toFixed(0)}`, 'paid')}
      ${miniStat('Stock Items', `${d.stock.length} (${d.lowStockItems.length} low)`, 'inventory_2')}
    </div>
  `;
}

function renderRevenueReport(d) {
  const paidInvoices = d.invoices.filter(i => i.status === 'Paid');
  const monthlyRev = {};
  paidInvoices.forEach(i => {
    const m = new Date(i.issueDate || i.createdAt).toLocaleDateString('en-AU', { month: 'short', year: '2-digit' });
    monthlyRev[m] = (monthlyRev[m] || 0) + (i.total || 0);
  });

  const totalCost = d.jobs.reduce((s, j) => s + (j.materialCost || 0), 0);
  const totalLabor = d.jobs.reduce((s, j) => s + (j.laborCost || 0), 0);
  const grossProfit = d.totalRevenue - totalCost;

  return `
    <div class="grid-4" style="margin-bottom:var(--space-lg)">
      ${kpi('Gross Revenue', `$${d.totalRevenue.toFixed(0)}`, 'account_balance', 'green')}
      ${kpi('Total Labor', `$${totalLabor.toFixed(0)}`, 'engineering', 'blue')}
      ${kpi('Material Costs', `$${totalCost.toFixed(0)}`, 'inventory_2', 'orange')}
      ${kpi('Gross Profit', `$${grossProfit.toFixed(0)}`, 'savings', 'green')}
    </div>
    <div class="card" style="margin-bottom:var(--space-lg)">
      <div class="card-header"><h4>Revenue by Month</h4></div>
      <div class="card-body">${barChart(monthlyRev, {}, '#1B6DE0')}</div>
    </div>
    <div class="card">
      <div class="card-header"><h4>Profit Breakdown</h4></div>
      <div class="card-body">
        ${progressBar('Revenue', d.totalRevenue, d.totalRevenue, '#10B981')}
        ${progressBar('Labor Cost', totalLabor, d.totalRevenue, '#3B82F6')}
        ${progressBar('Material Cost', totalCost, d.totalRevenue, '#F59E0B')}
        ${progressBar('Gross Profit', grossProfit, d.totalRevenue, '#10B981')}
      </div>
    </div>
  `;
}

function renderJobsReport(d) {
  const completedJobs = d.jobs.filter(j => j.status === 'Completed' || j.status === 'Invoiced');
  const avgHours = completedJobs.length > 0 ? completedJobs.reduce((s, j) => s + (j.estimatedHours || 0), 0) / completedJobs.length : 0;

  return `
    <div class="grid-4" style="margin-bottom:var(--space-lg)">
      ${kpi('Total Jobs', d.jobs.length, 'build', 'blue')}
      ${kpi('Completed', completedJobs.length, 'check_circle', 'green')}
      ${kpi('In Progress', d.jobsByStatus['In Progress'] || 0, 'pending', 'orange')}
      ${kpi('Avg Hours', avgHours.toFixed(1), 'schedule', 'blue')}
    </div>
    <div class="card" style="margin-bottom:var(--space-lg)">
      <div class="card-header"><h4>Job Status Distribution</h4></div>
      <div class="card-body">${barChart(d.jobsByStatus, { 'Pending':'#F59E0B','Scheduled':'#3B82F6','In Progress':'#1B6DE0','On Hold':'#6B7280','Completed':'#10B981','Invoiced':'#8B5CF6' })}</div>
    </div>
    <div class="card">
      <div class="card-header"><h4>Top Jobs by Value</h4></div>
      <div class="card-body" style="padding:0">
        <table class="data-table">
          <thead><tr><th>Job</th><th>Customer</th><th>Status</th><th style="text-align:right">Value</th></tr></thead>
          <tbody>
            ${d.jobs.sort((a, b) => ((b.laborCost||0)+(b.materialCost||0)) - ((a.laborCost||0)+(a.materialCost||0))).slice(0, 8).map(j => `
              <tr>
                <td class="font-medium">${j.number}</td>
                <td class="text-secondary">${j.customerName}</td>
                <td><span class="badge badge-neutral">${j.status}</span></td>
                <td style="text-align:right;font-weight:600">$${((j.laborCost||0)+(j.materialCost||0)).toFixed(0)}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
    </div>
  `;
}

function renderJobCostingReport(d) {
  const settings = store.getSettings();
  const completedJobs = d.jobs.filter(j => j.status === 'Completed' || j.status === 'Invoiced');
  
  const costingData = completedJobs.map(j => {
    const actualH = d.hoursByJob[j.id] || 0;
    const actualLabor = d.internalLaborCostByJob[j.id] || j.laborCost || 0;
    
    const profile = settings.laborRates.find(r => r.id === j.laborRateProfileId) || settings.laborRates.find(r => r.isDefault);
    const billableLabor = Math.max(actualH * (profile?.rate || 85), profile?.minCallOutFee || 0);
    
    const profit = billableLabor - actualLabor;
    const margin = billableLabor > 0 ? (profit / billableLabor * 100) : 0;
    
    return {
      ...j, actualH, actualLabor, billableLabor, profit, margin
    };
  });

  const totalActualLabor = costingData.reduce((s, j) => s + j.actualLabor, 0);
  const totalBillableLabor = costingData.reduce((s, j) => s + j.billableLabor, 0);
  const totalProfit = totalBillableLabor - totalActualLabor;
  const avgMargin = totalBillableLabor > 0 ? (totalProfit / totalBillableLabor * 100) : 0;

  return `
    <div class="grid-3" style="margin-bottom:var(--space-lg)">
      ${kpi('Internal Labor Cost', '$' + totalActualLabor.toLocaleString('en-AU', { minimumFractionDigits: 2, maximumFractionDigits: 2 }), 'engineering', 'orange')}
      ${kpi('Billable Labor Rev.', '$' + totalBillableLabor.toLocaleString('en-AU', { minimumFractionDigits: 2, maximumFractionDigits: 2 }), 'payments', 'green')}
      ${kpi('Labor Profitability', (avgMargin.toFixed(1)) + '% Margin', 'trending_up', avgMargin >= 40 ? 'green' : 'orange')}
    </div>
    <div class="card">
      <div class="card-header" style="display:flex; justify-content:space-between; align-items:center">
        <h4 style="margin:0">Labor Costing Analysis (Completed Jobs)</h4>
        <div style="font-size:12px; color:var(--text-tertiary)">Actual Tech Pay vs. Profile Billable Rate</div>
      </div>
      <div class="card-body" style="padding:0">
        <table class="data-table">
          <thead>
            <tr>
              <th>Job</th>
              <th>Technician</th>
              <th style="text-align:right">Hrs</th>
              <th style="text-align:right">Internal Cost</th>
              <th style="text-align:right">Billable</th>
              <th style="text-align:right">Profit</th>
              <th style="text-align:right">Margin</th>
            </tr>
          </thead>
          <tbody>
            ${costingData.map(j => `
              <tr>
                <td class="font-medium"><a href="#/jobs/${j.id}" class="cell-link">${j.number}</a></td>
                <td>${j.technicianName || '—'}</td>
                <td style="text-align:right">${j.actualH.toFixed(2)}</td>
                <td style="text-align:right">$${j.actualLabor.toFixed(2)}</td>
                <td style="text-align:right">$${j.billableLabor.toFixed(2)}</td>
                <td style="text-align:right;font-weight:600;color:${j.profit >= 0 ? 'var(--color-success)' : 'var(--color-danger)'}">
                  $${j.profit.toFixed(2)}
                </td>
                <td style="text-align:right">
                   <span class="badge ${j.margin >= 40 ? 'badge-success' : j.margin >= 20 ? 'badge-warning' : 'badge-danger'}">
                    ${j.margin.toFixed(1)}%
                   </span>
                </td>
              </tr>
            `).join('')}
            ${!costingData.length ? '<tr><td colspan="7" style="text-align:center;padding:20px" class="text-secondary">No completed jobs to analyze</td></tr>' : ''}
          </tbody>
        </table>
      </div>
    </div>
  `;
}

function renderTechniciansReport(d) {
  return `
    <div class="card" style="margin-bottom:var(--space-lg)">
      <div class="card-header"><h4>Technician Performance</h4></div>
      <div class="card-body" style="padding:0">
        <table class="data-table">
          <thead><tr><th></th><th>Name</th><th>Role</th><th style="text-align:center">Total Jobs</th><th style="text-align:center">Completed</th><th style="text-align:right">Revenue</th></tr></thead>
          <tbody>
            ${d.techStats.sort((a, b) => b.revenue - a.revenue).map(t => `
              <tr>
                <td><div style="width:8px;height:8px;border-radius:50%;background:${t.color}"></div></td>
                <td class="font-medium">${t.name}</td>
                <td class="text-secondary">${t.role}</td>
                <td style="text-align:center">${t.totalJobs}</td>
                <td style="text-align:center"><span class="badge badge-success">${t.completed}</span></td>
                <td style="text-align:right;font-weight:600">$${t.revenue.toLocaleString('en-AU', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
    </div>
    <div class="card">
      <div class="card-header"><h4>Revenue by Technician</h4></div>
      <div class="card-body">
        ${d.techStats.map(t => progressBar(t.name, t.revenue, Math.max(...d.techStats.map(x => x.revenue)), t.color)).join('')}
      </div>
    </div>
  `;
}

function renderCustomersReport(d) {
  return `
    <div class="grid-3" style="margin-bottom:var(--space-lg)">
      ${kpi('Total Customers', d.customers.length, 'people', 'blue')}
      ${kpi('Active Customers', d.customers.filter(c => c.status === 'Active').length, 'check_circle', 'green')}
      ${kpi('Total Leads', d.leads.length, 'trending_up', 'orange')}
    </div>
    <div class="card">
      <div class="card-header"><h4>Top Customers by Revenue</h4></div>
      <div class="card-body" style="padding:0">
        <table class="data-table">
          <thead><tr><th>#</th><th>Customer</th><th style="text-align:right">Revenue</th><th>Share</th></tr></thead>
          <tbody>
            ${d.topCustomers.map(([name, rev], i) => `
              <tr>
                <td class="text-secondary">${i + 1}</td>
                <td class="font-medium">${name}</td>
                <td style="text-align:right;font-weight:600">$${rev.toLocaleString('en-AU', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                <td>
                  <div style="display:flex;align-items:center;gap:8px">
                    <div style="flex:1;height:6px;background:var(--border-color);border-radius:3px;overflow:hidden">
                      <div style="height:100%;width:${d.totalRevenue > 0 ? (rev/d.totalRevenue*100) : 0}%;background:var(--color-primary);border-radius:3px"></div>
                    </div>
                    <span class="text-secondary" style="font-size:var(--font-size-xs)">${d.totalRevenue > 0 ? (rev/d.totalRevenue*100).toFixed(2) : '0.00'}%</span>
                  </div>
                </td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
    </div>
  `;
}

function renderInventoryReport(d) {
  const sellValue = d.stock.reduce((s, i) => s + (i.quantity * i.unitPrice), 0);
  return `
    <div class="grid-3" style="margin-bottom:var(--space-lg)">
      ${kpi('Total Items', d.stock.length, 'inventory_2', 'blue')}
      ${kpi('Stock Value (Cost)', `$${d.totalStockValue.toFixed(0)}`, 'account_balance', 'orange')}
      ${kpi('Stock Value (Sell)', `$${sellValue.toFixed(0)}`, 'paid', 'green')}
    </div>
    ${d.lowStockItems.length > 0 ? `
      <div class="card" style="margin-bottom:var(--space-lg);border-color:var(--color-danger)">
        <div class="card-header" style="background:var(--color-danger-bg)">
          <h4 style="color:var(--color-danger)"><span class="material-icons-outlined" style="font-size:18px;vertical-align:middle">warning</span> Low Stock Alert (${d.lowStockItems.length} items)</h4>
        </div>
        <div class="card-body" style="padding:0">
          <table class="data-table">
            <thead><tr><th>Item</th><th>SKU</th><th style="text-align:center">Qty</th><th style="text-align:center">Reorder Level</th><th>Supplier</th></tr></thead>
            <tbody>
              ${d.lowStockItems.map(i => `
                <tr>
                  <td class="font-medium">${i.name}</td>
                  <td class="text-secondary" style="font-family:monospace">${i.sku}</td>
                  <td style="text-align:center;color:var(--color-danger);font-weight:600">${i.quantity}</td>
                  <td style="text-align:center">${i.reorderLevel}</td>
                  <td class="text-secondary">${i.supplier}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      </div>
    ` : ''}
    <div class="card">
      <div class="card-header"><h4>Stock by Category</h4></div>
      <div class="card-body">
        ${barChart(d.stock.reduce((acc, i) => { acc[i.category] = (acc[i.category] || 0) + i.quantity; return acc; }, {}), {}, '#1B6DE0')}
      </div>
    </div>
  `;
}
