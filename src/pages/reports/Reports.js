// ============================================
// SIMPRO CLONE — REPORTS MODULE
// ============================================

import { store } from '../../data/store.js';
import { escapeHTML } from '../../utils/security.js';

let reportViewMode = 'detailed'; // Simple vs. Detailed report toggle

export function renderReports(container) {
  let activeReport = 'overview';

  // Global filters state
  let filterStartDate = '';
  let filterEndDate = '';
  let filterTechId = 'All';
  let filterAssetType = 'All';
  let filterCustomerId = 'All';

  const reports = [
    { id: 'overview', label: 'Business Overview', icon: 'dashboard' },
    { id: 'revenue', label: 'Revenue & Profit', icon: 'trending_up' },
    { id: 'jobs', label: 'Job Performance', icon: 'build' },
    { id: 'job_costing', label: 'Job Costing', icon: 'price_check' },
    { id: 'technicians', label: 'Technician Productivity', icon: 'engineering' },
    { id: 'timesheets_labor', label: 'Timesheet & Labor', icon: 'schedule' },
    { id: 'assets_maintenance', label: 'Asset Maintenance', icon: 'settings' },
    { id: 'customers', label: 'Customer Analysis', icon: 'people' },
    { id: 'inventory', label: 'Inventory Report', icon: 'inventory_2' },
  ];

  function formatDate(date) {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }

  function getData() {
    let jobs = store.getAll('jobs') || [];
    let quotes = store.getAll('quotes') || [];
    let invoices = store.getAll('invoices') || [];
    const customers = store.getAll('customers') || [];
    const stock = store.getAll('stock') || [];
    const technicians = store.getAll('technicians') || [];
    let leads = store.getAll('leads') || [];
    const timesheets = store.getAll('timesheets') || [];
    const assets = store.getAll('assets') || [];
    const maintenancePlans = store.getAll('maintenancePlans') || [];

    // 1. Date Range Filtering
    if (filterStartDate) {
      jobs = jobs.filter(j => (j.createdAt || '').split('T')[0] >= filterStartDate);
      quotes = quotes.filter(q => (q.createdAt || '').split('T')[0] >= filterStartDate);
      invoices = invoices.filter(i => (i.issueDate || i.createdAt || '').split('T')[0] >= filterStartDate);
      leads = leads.filter(l => (l.createdAt || '').split('T')[0] >= filterStartDate);
    }
    if (filterEndDate) {
      jobs = jobs.filter(j => (j.createdAt || '').split('T')[0] <= filterEndDate);
      quotes = quotes.filter(q => (q.createdAt || '').split('T')[0] <= filterEndDate);
      invoices = invoices.filter(i => (i.issueDate || i.createdAt || '').split('T')[0] <= filterEndDate);
      leads = leads.filter(l => (l.createdAt || '').split('T')[0] <= filterEndDate);
    }

    // 2. Customer Filtering
    if (filterCustomerId !== 'All') {
      jobs = jobs.filter(j => j.customerId === filterCustomerId);
      quotes = quotes.filter(q => q.customerId === filterCustomerId);
      invoices = invoices.filter(i => i.customerId === filterCustomerId);
      leads = leads.filter(l => l.customerId === filterCustomerId);
    }

    // 3. Technician Filtering
    if (filterTechId !== 'All') {
      jobs = jobs.filter(j => j.technicianId === filterTechId || (j.technicians && j.technicians.some(t => t.id === filterTechId)));
      invoices = invoices.filter(i => {
        if (!i.jobId) return false;
        const job = store.getById('jobs', i.jobId);
        return job && (job.technicianId === filterTechId || (job.technicians && job.technicians.some(t => t.id === filterTechId)));
      });
    }

    // 4. Asset Category / Type Filtering
    if (filterAssetType !== 'All') {
      const targetAssetIds = assets.filter(a => a.type === filterAssetType).map(a => a.id);
      jobs = jobs.filter(j => {
        if (j.assetId && targetAssetIds.includes(j.assetId)) return true;
        if (j.assetIds && j.assetIds.some(id => targetAssetIds.includes(id))) return true;
        return false;
      });
      invoices = invoices.filter(i => {
        if (!i.jobId) return false;
        const job = store.getById('jobs', i.jobId);
        if (!job) return false;
        if (job.assetId && targetAssetIds.includes(job.assetId)) return true;
        if (job.assetIds && job.assetIds.some(id => targetAssetIds.includes(id))) return true;
        return false;
      });
    }

    // Timesheets Filtering
    let filteredTimesheets = [...timesheets];
    if (filterStartDate) {
      filteredTimesheets = filteredTimesheets.filter(t => t.date >= filterStartDate);
    }
    if (filterEndDate) {
      filteredTimesheets = filteredTimesheets.filter(t => t.date <= filterEndDate);
    }
    if (filterTechId !== 'All') {
      filteredTimesheets = filteredTimesheets.filter(t => t.technicianId === filterTechId);
    }
    if (filterCustomerId !== 'All') {
      filteredTimesheets = filteredTimesheets.filter(t => {
        if (!t.jobId) return false;
        const job = store.getById('jobs', t.jobId);
        return job && job.customerId === filterCustomerId;
      });
    }
    if (filterAssetType !== 'All') {
      const targetAssetIds = assets.filter(a => a.type === filterAssetType).map(a => a.id);
      filteredTimesheets = filteredTimesheets.filter(t => {
        if (!t.jobId) return false;
        const job = store.getById('jobs', t.jobId);
        if (!job) return false;
        if (job.assetId && targetAssetIds.includes(job.assetId)) return true;
        if (job.assetIds && job.assetIds.some(id => targetAssetIds.includes(id))) return true;
        return false;
      });
    }

    // Assets & Plans Filtering
    let filteredAssets = [...assets];
    let filteredPlans = [...maintenancePlans];
    if (filterCustomerId !== 'All') {
      filteredAssets = filteredAssets.filter(a => a.customerId === filterCustomerId);
      filteredPlans = filteredPlans.filter(p => p.customerId === filterCustomerId);
    }
    if (filterAssetType !== 'All') {
      filteredAssets = filteredAssets.filter(a => a.type === filterAssetType);
      filteredPlans = filteredPlans.filter(p => {
        const asset = assets.find(a => a.id === p.assetId);
        return asset && asset.type === filterAssetType;
      });
    }

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
      const techJobs = jobs.filter(j => j.technicianId === t.id || (j.technicians && j.technicians.some(x => x.id === t.id)));
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

    // Pre-calculate hours and costs by job for performance
    const hoursByJob = {};
    const internalLaborCostByJob = {};
    
    const techRates = {};
    technicians.forEach(p => { if (p.payRate) techRates[p.id] = p.payRate; });

    filteredTimesheets.forEach(t => {
      hoursByJob[t.jobId] = (hoursByJob[t.jobId] || 0) + (t.hours || 0);
      const rate = t.payRate || techRates[t.technicianId] || 0;
      internalLaborCostByJob[t.jobId] = (internalLaborCostByJob[t.jobId] || 0) + (t.hours * rate);
    });

    return { 
      jobs, quotes, invoices, customers, stock, technicians, leads, 
      totalRevenue, totalOutstanding, avgJobValue, quoteWinRate, leadConvRate, 
      jobsByStatus, invByStatus, techStats, topCustomers, totalStockValue, 
      lowStockItems, timesheets: filteredTimesheets, hoursByJob, internalLaborCostByJob,
      assets: filteredAssets, maintenancePlans: filteredPlans
    };
  }

  function render() {
    const d = getData();
    const technicians = store.getAll('technicians') || [];
    const assets = store.getAll('assets') || [];
    const customers = store.getAll('customers') || [];
    const uniqueAssetTypes = [...new Set(assets.map(a => a.type).filter(Boolean))];

    container.innerHTML = `
      <div class="page-header">
        <h1>Reports & Analytics</h1>
        <div class="page-header-actions">
          <button class="btn btn-secondary" id="btn-export-csv" data-tooltip="Export current report data to CSV" data-tooltip-pos="left"><span class="material-icons-outlined">download</span> Export CSV</button>
        </div>
      </div>

      <!-- Global Filter Bar -->
      <div class="card" style="margin-bottom:var(--space-md);">
        <div class="card-body" style="display:flex; flex-wrap:wrap; align-items:center; gap:16px; padding:16px;">
          <div style="display:flex; align-items:center; gap:8px;">
            <span style="font-size:12px; font-weight:600; color:var(--text-secondary); text-transform:uppercase; letter-spacing:0.5px;">Date Range</span>
            <input type="date" class="form-input" id="global-filter-start" value="${filterStartDate}" style="width:135px; height:32px; font-size:12px; margin:0; padding:4px 8px;" />
            <span style="font-size:11px; color:var(--text-tertiary)">to</span>
            <input type="date" class="form-input" id="global-filter-end" value="${filterEndDate}" style="width:135px; height:32px; font-size:12px; margin:0; padding:4px 8px;" />
          </div>
          
          <div style="display:flex; gap:4px; align-items:center;">
            <button class="btn btn-preset ${!filterStartDate && !filterEndDate ? 'active' : ''}" data-preset="all" style="padding:4px 10px; font-size:11px; height:32px; background:var(--card-bg); border:1px solid var(--border-color); color:var(--text-secondary); border-radius:var(--border-radius); cursor:pointer;">All Time</button>
            <button class="btn btn-preset" data-preset="30" style="padding:4px 10px; font-size:11px; height:32px; background:var(--card-bg); border:1px solid var(--border-color); color:var(--text-secondary); border-radius:var(--border-radius); cursor:pointer;">30 Days</button>
            <button class="btn btn-preset" data-preset="90" style="padding:4px 10px; font-size:11px; height:32px; background:var(--card-bg); border:1px solid var(--border-color); color:var(--text-secondary); border-radius:var(--border-radius); cursor:pointer;">90 Days</button>
            <button class="btn btn-preset" data-preset="year" style="padding:4px 10px; font-size:11px; height:32px; background:var(--card-bg); border:1px solid var(--border-color); color:var(--text-secondary); border-radius:var(--border-radius); cursor:pointer;">This Year</button>
          </div>
          
          <!-- Simple / Detailed View Mode Toggle -->
          <div style="display:flex; align-items:center; gap:8px;">
            <span style="font-size:12px; font-weight:600; color:var(--text-secondary); text-transform:uppercase; letter-spacing:0.5px;">View Mode</span>
            <div style="display:flex; border:1px solid var(--border-color); border-radius:var(--border-radius); overflow:hidden; height:32px; background:var(--card-bg);">
              <button class="btn btn-view-mode ${reportViewMode === 'simple' ? 'active' : ''}" data-mode="simple" style="border:none; padding:4px 12px; font-size:11px; height:100%; cursor:pointer; background:${reportViewMode === 'simple' ? 'var(--color-primary)' : 'transparent'}; color:${reportViewMode === 'simple' ? '#fff' : 'var(--text-secondary)'}; font-weight:600; transition:all var(--transition-fast);">Simple</button>
              <button class="btn btn-view-mode ${reportViewMode === 'detailed' ? 'active' : ''}" data-mode="detailed" style="border:none; padding:4px 12px; font-size:11px; height:100%; cursor:pointer; background:${reportViewMode === 'detailed' ? 'var(--color-primary)' : 'transparent'}; color:${reportViewMode === 'detailed' ? '#fff' : 'var(--text-secondary)'}; font-weight:600; border-left:1px solid var(--border-color); transition:all var(--transition-fast);">Detailed</button>
            </div>
          </div>
          
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
        rc.innerHTML = renderOverviewReport(d, reportViewMode);
        break;
      case 'revenue':
        rc.innerHTML = renderRevenueReport(d, reportViewMode);
        break;
      case 'jobs':
        rc.innerHTML = renderJobsReport(d, reportViewMode);
        break;
      case 'job_costing':
        rc.innerHTML = renderJobCostingReport(d, reportViewMode);
        break;
      case 'technicians':
        rc.innerHTML = renderTechniciansReport(d, reportViewMode);
        break;
      case 'timesheets_labor':
        rc.innerHTML = renderTimesheetsLaborReport(d, reportViewMode);
        break;
      case 'assets_maintenance':
        rc.innerHTML = renderAssetsMaintenanceReport(d, reportViewMode);
        break;
      case 'customers':
        rc.innerHTML = renderCustomersReport(d, reportViewMode);
        break;
      case 'inventory':
        rc.innerHTML = renderInventoryReport(d, reportViewMode);
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

    // Global filters elements
    container.querySelector('#global-filter-start')?.addEventListener('change', (e) => {
      filterStartDate = e.target.value;
      render();
    });

    container.querySelector('#global-filter-end')?.addEventListener('change', (e) => {
      filterEndDate = e.target.value;
      render();
    });



    // View mode toggle elements
    container.querySelectorAll('.btn-view-mode').forEach(btn => {
      btn.addEventListener('click', (e) => {
        reportViewMode = e.target.dataset.mode;
        render();
      });
    });

    // Preset button triggers
    container.querySelectorAll('.btn-preset').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const preset = e.target.dataset.preset;
        const today = new Date();
        if (preset === 'all') {
          filterStartDate = '';
          filterEndDate = '';
        } else if (preset === '30') {
          const start = new Date();
          start.setDate(today.getDate() - 30);
          filterStartDate = formatDate(start);
          filterEndDate = formatDate(today);
        } else if (preset === '90') {
          const start = new Date();
          start.setDate(today.getDate() - 90);
          filterStartDate = formatDate(start);
          filterEndDate = formatDate(today);
        } else if (preset === 'year') {
          const start = new Date(today.getFullYear(), 0, 1);
          filterStartDate = formatDate(start);
          filterEndDate = formatDate(today);
        }
        render();
      });
    });
  }

  function exportCSV(d) {
    let csv = '';
    if (activeReport === 'overview' || activeReport === 'revenue') {
      csv = 'Invoice #,Customer,Status,Total,Issue Date,Due Date\n';
      d.invoices.forEach(i => {
        csv += `"${i.number}","${i.customerName}","${i.status}",${i.total || 0},"${i.issueDate || ''}","${i.dueDate || ''}"\n`;
      });
    } else if (activeReport === 'job_costing') {
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
    } else if (activeReport === 'timesheets_labor') {
      csv = 'Technician,Role,Approved Hrs,Pending Hrs,Utilization %,Total Cost\n';
      d.technicians.forEach(t => {
        const tSheets = d.timesheets.filter(ts => ts.technicianId === t.id);
        const total = tSheets.reduce((s, ts) => s + (ts.hours || 0), 0);
        const approved = tSheets.filter(ts => ts.status === 'Approved').reduce((s, ts) => s + (ts.hours || 0), 0);
        const pending = tSheets.filter(ts => ts.status === 'Pending').reduce((s, ts) => s + (ts.hours || 0), 0);
        const billable = tSheets.filter(ts => ts.jobId).reduce((s, ts) => s + (ts.hours || 0), 0);
        const util = total > 0 ? (billable / total * 100) : 0;
        
        let payTotal = 0;
        tSheets.forEach(ts => {
          const rate = ts.payRate || t.payRate || 0;
          payTotal += (ts.hours * rate);
        });

        csv += `"${t.name}","${t.role}",${approved.toFixed(2)},${pending.toFixed(2)},${util.toFixed(1)}%,${payTotal.toFixed(2)}\n`;
      });
    } else if (activeReport === 'assets_maintenance') {
      csv = 'Asset,Serial,Customer,Plan Name,Frequency,Next Service,Priority (1-10),Maintenance Cost\n';
      d.maintenancePlans.forEach(p => {
        const asset = d.assets.find(a => a.id === p.assetId);
        let maintCost = 0;
        if (asset && asset.logs) {
          asset.logs.forEach(l => {
            if (l.type === 'Service') maintCost += (l.cost || 0);
          });
        }
        csv += `"${p.assetName || ''}","${asset?.serial || ''}","${p.customerName || ''}","${p.name || ''}","${p.frequency || 'Meter-Based'}","${p.nextServiceDate || p.nextDue || '—'}",${p.priority || 5},${maintCost.toFixed(2)}\n`;
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

// ── Cache & Insights Engine ────────────────────────────────────────────────
const cachedAIInsights = {};

function renderAIInsightsPanel(reportId, filteredData) {
  const containerId = `ai-insights-${reportId}`;
  const cacheKey = `${reportId}_${filteredData.timesheets.length}_${filteredData.jobs.length}_${filteredData.invoices.length}_${reportViewMode}`;
  
  if (cachedAIInsights[cacheKey]) {
    return cachedAIInsights[cacheKey];
  }

  setTimeout(() => {
    fetchAIInsights(reportId, filteredData, cacheKey);
  }, 100);

  return `
    <style>
      @keyframes pulse {
        0% { opacity: 0.6; }
        50% { opacity: 1; }
        100% { opacity: 0.6; }
      }
    </style>
    <div class="card" id="${containerId}" style="margin-bottom:var(--space-lg); border: 1px solid var(--color-primary-light); background: linear-gradient(135deg, rgba(27, 109, 224, 0.04) 0%, rgba(139, 92, 246, 0.04) 100%);">
      <div class="card-body" style="padding:16px 20px;">
        <div style="display:flex; align-items:center; gap:8px; margin-bottom:12px;">
          <span class="material-icons-outlined" style="color:var(--color-primary); animation: pulse 2s infinite;">psychology</span>
          <h5 style="margin:0; font-weight:600; color:var(--text-primary);">RELAY AI Insights</h5>
          <span class="badge badge-neutral" style="font-size:10px; margin-left:auto;">Analyzing...</span>
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

async function fetchAIInsights(reportId, d, cacheKey) {
  const panel = document.getElementById(`ai-insights-${reportId}`);
  if (!panel) return;

  const s = store.getSettings();
  const ai = s.ai || {};
  const hasKey = ai.apiKey || import.meta.env.VITE_DEEPSEEK_API_KEY;

  let insightsHTML = '';
  const isSimpleMode = cacheKey.endsWith('_simple');
  const mode = isSimpleMode ? 'simple' : 'detailed';

  if (ai.enabled && hasKey) {
    try {
      const statsSummary = getStatsSummaryText(reportId, d);
      let messages = [];

      if (isSimpleMode) {
        messages = [
          {
            role: 'system',
            content: 'You are a friendly, encouraging operational co-pilot for a field service company. Analyze the provided metrics and write exactly 3 to 5 simple, friendly, easy-to-understand operational tips or encouraging updates in a JSON array of strings. The output MUST be a valid JSON array of strings, e.g., ["Tip 1", "Tip 2", "Tip 3"]. Avoid complex business jargon or threatening financial metrics. Focus on team efforts, customer service, or helpful reminders (e.g., "Keep up the great work on service schedules!", "Order parts soon to keep jobs running smoothly"). Do not output any markdown formatting, asterisks (*), code blocks (like ```json), or explanatory text. Return ONLY the raw JSON string.'
          },
          {
            role: 'user',
            content: `Active Report: ${reportId}\nFiltered Metrics:\n${statsSummary}`
          }
        ];
      } else {
        messages = [
          {
            role: 'system',
            content: 'You are an expert business analyst and operational co-pilot for a field service management agency. Analyze the provided summary report metrics and write exactly 3 to 5 high-value, highly specific, and actionable business insights or operational warnings in JSON format. The output MUST be a valid JSON array of objects, where each object has exactly these keys: "headline" (string, short, specific, numbers-first), "detail" (string, what -> so what), "action" (string, now what - one concrete next step), and "confidence" (string, "high" | "medium" | "low"). Rank the objects in the array by operational impact (highest impact first). Do not output any markdown formatting, code blocks (like ```json), or explanatory text. Return ONLY the raw JSON string.'
          },
          {
            role: 'user',
            content: `Active Report: ${reportId}\nFiltered Metrics:\n${statsSummary}`
          }
        ];
      }

      const endpoint = ai.endpoint || 'https://api.deepseek.com/chat/completions';
      const model = ai.model || 'deepseek-chat';
      const apiKey = ai.apiKey || import.meta.env.VITE_DEEPSEEK_API_KEY;

      const res = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`
        },
        body: JSON.stringify({
          model: model,
          messages: messages,
          temperature: 0.3
        })
      });

      if (!res.ok) {
        throw new Error(`API returned status ${res.status}`);
      }

      const resData = await res.json();
      let reply = resData.choices?.[0]?.message?.content || '[]';
      
      if (reply.includes('```')) {
        reply = reply.replace(/```json/g, '').replace(/```/g, '').trim();
      }
      
      const insights = JSON.parse(reply);
      insightsHTML = renderInsightsListHTML(reportId, insights, false, mode);
    } catch (err) {
      console.error('AI Insights parsing or fetch error:', err);
      const localInsights = isSimpleMode ? getLocalSimpleInsights(reportId, d) : getLocalInsightsJSON(reportId, d);
      insightsHTML = renderInsightsListHTML(reportId, localInsights, true, mode);
    }
  } else {
    const localInsights = isSimpleMode ? getLocalSimpleInsights(reportId, d) : getLocalInsightsJSON(reportId, d);
    insightsHTML = renderInsightsListHTML(reportId, localInsights, false, mode);
  }

  cachedAIInsights[cacheKey] = insightsHTML;
  panel.innerHTML = insightsHTML;
}

function getStatsSummaryText(reportId, d) {
  let summary = '';
  if (reportId === 'overview' || reportId === 'revenue') {
    summary += `Gross Revenue: $${d.totalRevenue.toFixed(2)}\n`;
    summary += `Outstanding Bills: $${d.totalOutstanding.toFixed(2)}\n`;
    summary += `Quote Win Rate: ${d.quoteWinRate.toFixed(1)}%\n`;
    summary += `Lead Conversion: ${d.leadConvRate.toFixed(1)}%\n`;
    summary += `Total Jobs: ${d.jobs.length}\n`;
    summary += `Total Invoices: ${d.invoices.length}\n`;
    summary += `Avg Job Value: $${d.avgJobValue.toFixed(2)}\n`;
  } else if (reportId === 'jobs' || reportId === 'job_costing') {
    const completedJobs = d.jobs.filter(j => j.status === 'Completed' || j.status === 'Invoiced');
    summary += `Completed Jobs Analyzed: ${completedJobs.length}\n`;
    const settings = store.getSettings();
    let totalActualLabor = 0;
    let totalBillableLabor = 0;
    completedJobs.forEach(j => {
      const actualH = d.hoursByJob[j.id] || 0;
      const actualLabor = d.internalLaborCostByJob[j.id] || j.laborCost || 0;
      const profile = settings.laborRates.find(r => r.id === j.laborRateProfileId) || settings.laborRates.find(r => r.isDefault);
      const billableLabor = Math.max(actualH * (profile?.rate || 85), profile?.minCallOutFee || 0);
      totalActualLabor += actualLabor;
      totalBillableLabor += billableLabor;
    });
    const profit = totalBillableLabor - totalActualLabor;
    const margin = totalBillableLabor > 0 ? (profit / totalBillableLabor * 100) : 0;
    summary += `Total Internal Labor Cost: $${totalActualLabor.toFixed(2)}\n`;
    summary += `Total Billable Labor Revenue: $${totalBillableLabor.toFixed(2)}\n`;
    summary += `Labor Margin: ${margin.toFixed(1)}%\n`;
  } else if (reportId === 'timesheets_labor') {
    const totalHrs = d.timesheets.reduce((s, t) => s + (t.hours || 0), 0);
    const billableHrs = d.timesheets.filter(t => t.jobId).reduce((s, t) => s + (t.hours || 0), 0);
    const utilization = totalHrs > 0 ? (billableHrs / totalHrs * 100) : 0;
    const approvedHrs = d.timesheets.filter(t => t.status === 'Approved').reduce((s, t) => s + (t.hours || 0), 0);
    const pendingHrs = d.timesheets.filter(t => t.status === 'Pending').reduce((s, t) => s + (t.hours || 0), 0);
    summary += `Total Logged Hours: ${totalHrs.toFixed(2)} hrs\n`;
    summary += `Billable Job Hours: ${billableHrs.toFixed(2)} hrs\n`;
    summary += `Labor Utilization: ${utilization.toFixed(1)}%\n`;
    summary += `Approved Hours: ${approvedHrs.toFixed(2)} hrs\n`;
    summary += `Pending Hours: ${pendingHrs.toFixed(2)} hrs\n`;
  } else if (reportId === 'assets_maintenance') {
    summary += `Total Assets Matching: ${d.assets.length}\n`;
    summary += `Active Service Plans: ${d.maintenancePlans.filter(p => p.status === 'Active').length}\n`;
    let totalMaintCost = 0;
    let logCount = 0;
    d.assets.forEach(a => {
      (a.logs || []).forEach(l => {
        if (l.type === 'Service') {
          totalMaintCost += (l.cost || 0);
          logCount++;
        }
      });
    });
    summary += `Total Servicing Actions Taken: ${logCount}\n`;
    summary += `Cumulative Maintenance Cost: $${totalMaintCost.toFixed(2)}\n`;
  } else if (reportId === 'inventory') {
    summary += `Stock Items Types: ${d.stock.length}\n`;
    summary += `Low Stock Alert Items: ${d.lowStockItems.length}\n`;
    summary += `Cumulative Stock Cost Value: $${d.totalStockValue.toFixed(2)}\n`;
  }
  return summary;
}

function cleanString(str) {
  if (!str) return '';
  let formatted = str.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
  formatted = formatted.replace(/\*/g, '');
  return formatted;
}

function renderInsightsListHTML(reportId, insights, isOfflineWarning, mode) {
  const badgeLabel = isOfflineWarning ? 'RELAY Offline' : 'RELAY Live';
  const badgeClass = isOfflineWarning ? 'badge-danger' : 'badge-success';
  const borderStyle = isOfflineWarning ? 'border: 1px solid var(--color-danger-bg)' : 'border: 1px solid var(--color-primary-light)';

  const items = (Array.isArray(insights) ? insights : []).slice(0, 5);

  if (items.length === 0) {
    items.push(mode === 'simple' ? "Operational check completed: everything is running smoothly." : {
      headline: "Operational Metrics: Stable",
      detail: "All filtered business metrics are within normal operating parameters.",
      action: "Continue monitoring scheduled maintenance and jobs.",
      confidence: "high"
    });
  }

  if (mode === 'simple') {
    return `
      <div class="card-body" style="padding:16px 20px; ${borderStyle}">
        <div style="display:flex; align-items:center; gap:8px; margin-bottom:12px;">
          <span class="material-icons-outlined" style="color:var(--color-primary)">psychology</span>
          <h5 style="margin:0; font-weight:600; color:var(--text-primary);">RELAY AI Insights</h5>
          <span class="badge ${badgeClass}" style="font-size:10px; margin-left:auto;">${badgeLabel}</span>
        </div>
        <div style="display:flex; flex-direction:column; gap:10px; font-size:13px; color:var(--text-secondary); line-height:1.6; font-family:var(--font-family);">
          ${items.map(item => {
            const text = typeof item === 'string' ? item : (item.detail || item.headline || '');
            return `
              <div style="display:flex; align-items:flex-start; gap:8px;">
                <span style="color:var(--color-primary); font-size:16px; line-height:1.2;">•</span>
                <span>${cleanString(text)}</span>
              </div>
            `;
          }).join('')}
        </div>
      </div>
    `;
  }

  const confidenceColors = {
    high: { bg: 'rgba(16, 185, 129, 0.1)', text: 'var(--color-success)', border: 'rgba(16, 185, 129, 0.2)' },
    medium: { bg: 'rgba(245, 158, 11, 0.1)', text: 'var(--color-warning)', border: 'rgba(245, 158, 11, 0.2)' },
    low: { bg: 'rgba(239, 68, 68, 0.1)', text: 'var(--color-danger)', border: 'rgba(239, 68, 68, 0.2)' }
  };

  return `
    <div class="card-body" style="padding:16px 20px; ${borderStyle}">
      <div style="display:flex; align-items:center; gap:8px; margin-bottom:16px;">
        <span class="material-icons-outlined" style="color:var(--color-primary)">psychology</span>
        <h5 style="margin:0; font-weight:600; color:var(--text-primary);">RELAY AI Insights</h5>
        <span class="badge ${badgeClass}" style="font-size:10px; margin-left:auto;">${badgeLabel}</span>
      </div>
      
      <div style="display:flex; flex-direction:column; gap:16px;">
        ${items.map(item => {
          const conf = (item.confidence || 'high').toLowerCase();
          const colors = confidenceColors[conf] || confidenceColors.high;
          return `
            <div style="display:flex; align-items:flex-start; gap:12px; padding-bottom:12px; border-bottom:1px solid var(--border-color);">
              <span style="font-size:18px; color:var(--color-primary); line-height:1; padding-top:2px;">•</span>
              
              <div style="flex:1;">
                <div style="display:flex; align-items:center; gap:8px; flex-wrap:wrap; margin-bottom:4px;">
                  <span style="font-weight:700; color:var(--text-primary); font-size:13px;">${cleanString(item.headline)}</span>
                  <span style="font-size:9px; font-weight:600; text-transform:uppercase; padding:2px 6px; border-radius:4px; background:${colors.bg}; color:${colors.text}; border:1px solid ${colors.border};">
                    ${conf} confidence
                  </span>
                </div>
                <div style="font-size:12px; color:var(--text-secondary); line-height:1.5; margin-bottom:4px;">
                  ${cleanString(item.detail)}
                </div>
                <div style="font-size:11px; color:var(--text-tertiary);">
                  <strong style="color:var(--color-primary)">Now what:</strong> ${cleanString(item.action)}
                </div>
              </div>
            </div>
          `;
        }).join('')}
      </div>
    </div>
  `;
}

function getLocalSimpleInsights(reportId, d) {
  const tips = [];
  if (reportId === 'overview' || reportId === 'revenue') {
    if (d.totalOutstanding > d.totalRevenue * 0.3) {
      tips.push("We have a few outstanding invoices. Sending a friendly follow-up note to clients will help keep our cash flow running smoothly.");
    } else {
      tips.push("Our collections are in great shape! Keep up the excellent work sending invoices promptly.");
    }
    if (d.quoteWinRate < 45) {
      tips.push("Let's try to follow up on open quotes within 2 days. A quick check-in can make a big difference in winning more jobs.");
    } else {
      tips.push("Great job on proposals! Our quote acceptance rate is looking very strong.");
    }
    if (d.leadConvRate < 35) {
      tips.push("We have some new leads waiting. Reaching out quickly helps build trust with new customers.");
    }
  } else if (reportId === 'jobs' || reportId === 'job_costing') {
    tips.push("Keep estimating as accurately as possible so we can maintain healthy margins on completed service calls.");
    const overrunJobs = d.jobs.filter(j => {
      const actualH = d.hoursByJob[j.id] || 0;
      return actualH > (j.estimatedHours || 0) * 1.1;
    });
    if (overrunJobs.length > 0) {
      tips.push("A few complex jobs took a bit longer than expected. Checking in on site challenges helps us prepare better next time.");
    }
  } else if (reportId === 'timesheets_labor') {
    const totalHrs = d.timesheets.reduce((s, t) => s + (t.hours || 0), 0);
    const billableHrs = d.timesheets.filter(t => t.jobId).reduce((s, t) => s + (t.hours || 0), 0);
    const utilization = totalHrs > 0 ? (billableHrs / totalHrs * 100) : 0;
    if (utilization < 70) {
      tips.push("Let's look for ways to optimize travel and setup time, helping our team spend more of their active hours helping clients on site.");
    } else {
      tips.push("Awesome job on team efficiency! The crew is spending a solid amount of their logged time on actual jobs.");
    }
    const pending = d.timesheets.filter(t => t.status === 'Pending').reduce((s, t) => s + (t.hours || 0), 0);
    if (pending > 10) {
      tips.push("Remember to review and approve pending timesheets regularly so our job costings stay completely up-to-date.");
    }
  } else if (reportId === 'assets_maintenance') {
    tips.push("Preventative check-ups are the best way to avoid emergency breakdowns. Let's keep those scheduled visits on track!");
    tips.push("Keep a close eye on maintenance agreements to ensure we are always meeting customer expectations.");
  } else if (reportId === 'inventory') {
    if (d.lowStockItems.length > 0) {
      tips.push("We have a few items running low in the warehouse. Let's place a supplier order soon to avoid any job delays.");
    } else {
      tips.push("Warehouse stock is in great shape! All parts are above their minimum levels.");
    }
    tips.push("Reviewing slow-moving stock helps keep our warehouse organized and frees up resources for active projects.");
  }

  if (tips.length === 0) {
    tips.push("Operational check completed: All metrics are within normal parameters. Keep up the excellent work!");
  }
  return tips.slice(0, 5);
}

function getLocalInsightsJSON(reportId, d) {
  const insights = [];

  if (reportId === 'overview' || reportId === 'revenue') {
    if (d.totalOutstanding > d.totalRevenue * 0.3) {
      const pct = ((d.totalOutstanding / (d.totalRevenue + d.totalOutstanding || 1)) * 100).toFixed(0);
      insights.push({
        headline: `${pct}% Outstanding Billing Overload`,
        detail: `Outstanding invoices ($${d.totalOutstanding.toLocaleString('en-AU', {maximumFractionDigits:0})}) represent a significant portion of billing → this restricts working cash flow.`,
        action: "Trigger automated payment reminder emails to all Sent/Overdue customers.",
        confidence: "high"
      });
    } else {
      insights.push({
        headline: "A/R Aging: Stable and Healthy",
        detail: "Outstanding customer balances are low relative to paid revenues → indicates strong collection health.",
        action: "Maintain current invoicing payment terms and auto-reminder settings.",
        confidence: "high"
      });
    }

    if (d.quoteWinRate < 45) {
      insights.push({
        headline: `${d.quoteWinRate.toFixed(0)}% Proposal Approval Deficit`,
        detail: "Quote acceptance win rate has dipped below target thresholds → suggests pricing friction or delayed follow-ups.",
        action: "Audit pricing templates and follow up on sent quotes within 48 hours.",
        confidence: "high"
      });
    } else {
      insights.push({
        headline: `Proposal Wins: Strong at ${d.quoteWinRate.toFixed(0)}%`,
        detail: "Quote win rate is exceeding standard targets → suggests healthy competitive positioning.",
        action: "Document best-selling quote scopes for team training.",
        confidence: "high"
      });
    }

    if (d.leadConvRate < 35) {
      insights.push({
        headline: `${d.leadConvRate.toFixed(0)}% Lead Qualification Lag`,
        detail: "Lead-to-job conversion rate is below target capacity → suggests low marketing fit or slow response times.",
        action: "Audit sales response times and filter low-probability lead categories.",
        confidence: "medium"
      });
    }
  } else if (reportId === 'jobs' || reportId === 'job_costing') {
    const settings = store.getSettings();
    const completedJobs = d.jobs.filter(j => j.status === 'Completed' || j.status === 'Invoiced');
    let totalActualLabor = 0;
    let totalBillableLabor = 0;
    completedJobs.forEach(j => {
      const actualH = d.hoursByJob[j.id] || 0;
      const actualLabor = d.internalLaborCostByJob[j.id] || j.laborCost || 0;
      const profile = settings.laborRates.find(r => r.id === j.laborRateProfileId) || settings.laborRates.find(r => r.isDefault);
      const billableLabor = Math.max(actualH * (profile?.rate || 85), profile?.minCallOutFee || 0);
      totalActualLabor += actualLabor;
      totalBillableLabor += billableLabor;
    });
    const profit = totalBillableLabor - totalActualLabor;
    const margin = totalBillableLabor > 0 ? (profit / totalBillableLabor * 100) : 0;

    if (margin < 35) {
      insights.push({
        headline: `${margin.toFixed(1)}% Tight Labor Gross Margin`,
        detail: "Average labor profit margin is thin → indicates potential labor rate underpricing or worker overruns.",
        action: "Review labor rate profiles in Settings and adjust minimum call-out fees.",
        confidence: "high"
      });
    } else {
      insights.push({
        headline: `Labor Margins: Healthy at ${margin.toFixed(1)}%`,
        detail: "Completed job costing shows strong labor profitability margins.",
        action: "Keep monitoring timesheet entry accuracy vs job estimates.",
        confidence: "high"
      });
    }
    
    const overrunJobs = completedJobs.filter(j => {
      const actualH = d.hoursByJob[j.id] || 0;
      return actualH > (j.estimatedHours || 0) * 1.1;
    });
    if (overrunJobs.length > 0) {
      insights.push({
        headline: `${overrunJobs.length} Completed Jobs Exceeded Estimates`,
        detail: "Technicians spent over 110% of estimated hours on site → leads to labor margin leakage.",
        action: "Update job estimation parameters for historically complex job types.",
        confidence: "high"
      });
    }
  } else if (reportId === 'timesheets_labor') {
    const totalHrs = d.timesheets.reduce((s, t) => s + (t.hours || 0), 0);
    const billableHrs = d.timesheets.filter(t => t.jobId).reduce((s, t) => s + (t.hours || 0), 0);
    const utilization = totalHrs > 0 ? (billableHrs / totalHrs * 100) : 0;
    const pendingHrs = d.timesheets.filter(t => t.status === 'Pending').reduce((s, t) => s + (t.hours || 0), 0);

    if (utilization < 70) {
      insights.push({
        headline: `${utilization.toFixed(1)}% Utilization Rate Deficit`,
        detail: "Field technicians are logging high non-billable / general hours → reduces billable revenue potential.",
        action: "Audit administrative overhead and improve route scheduling density.",
        confidence: "high"
      });
    } else {
      insights.push({
        headline: `Field Utilization: High at ${utilization.toFixed(1)}%`,
        detail: "Field personnel are spending the majority of their logged hours on billable site jobs.",
        action: "Optimize scheduling slots to maintain this high-efficiency threshold.",
        confidence: "high"
      });
    }
    if (pendingHrs > 10) {
      insights.push({
        headline: `${pendingHrs.toFixed(1)} hrs Pending Timesheet Approvals`,
        detail: "Unresolved timesheet entries delay precise job labor costing calculations.",
        action: "Send manager alerts to review and approve timesheets before billing cycles.",
        confidence: "high"
      });
    }
  } else if (reportId === 'assets_maintenance') {
    let totalMaintCost = 0;
    let logCount = 0;
    const assetCosts = {};
    d.assets.forEach(a => {
      let aCost = 0;
      (a.logs || []).forEach(l => {
        if (l.type === 'Service') {
          aCost += (l.cost || 0);
        }
      });
      if (aCost > 0) {
        assetCosts[a.name] = aCost;
        totalMaintCost += aCost;
        logCount++;
      }
    });
    const topAsset = Object.entries(assetCosts).sort((a,b) => b[1] - a[1])[0];

    if (logCount > 0) {
      insights.push({
        headline: `$${totalMaintCost.toLocaleString('en-AU', {maximumFractionDigits:0})} Cumulative Servicing Cost`,
        detail: "Servicing routines have accumulated substantial overhead across active service events.",
        action: "Establish preventative maintenance schedules to reduce emergency call-outs.",
        confidence: "high"
      });
    }
    if (topAsset) {
      insights.push({
        headline: `Highest Asset Maintenance: "${topAsset[0]}" ($${topAsset[1].toLocaleString('en-AU', {maximumFractionDigits:0})})`,
        detail: "This asset represents the highest individual repair overhead in your inventory.",
        action: "Conduct replacement lifecycle audit to check if replacement is cheaper than repair.",
        confidence: "medium"
      });
    }
    const activePlans = d.maintenancePlans.filter(p => p.status === 'Active');
    if (activePlans.length > 0) {
      insights.push({
        headline: `${activePlans.length} Active Asset Servicing Agreements`,
        detail: "Routine service contracts require daily monitoring → prevents schedule defaults and client disputes.",
        action: "Assign dedicated dispatcher to monitor asset due-date schedules weekly.",
        confidence: "high"
      });
    }
  } else if (reportId === 'inventory') {
    if (d.lowStockItems.length > 0) {
      insights.push({
        headline: `${d.lowStockItems.length} Warehouse Items Below Reorder Point`,
        detail: "Critical parts quantities are insufficient → threatens scheduling downtime for pending jobs.",
        action: "Generate supplier purchase orders immediately for all items in low stock.",
        confidence: "high"
      });
    } else {
      insights.push({
        headline: "Inventory Stock Levels: Optimal",
        detail: "All warehouse parts are currently stocked above minimum reorder points.",
        action: "Conduct routine monthly counts to verify catalog count integrity.",
        confidence: "high"
      });
    }
    insights.push({
      headline: `$${d.totalStockValue.toLocaleString('en-AU', {maximumFractionDigits:0})} Capital Tied in Inventory`,
      detail: "Warehouse contains significant asset value in stock cost pricing.",
      action: "Review slow-moving categories to reduce inventory carrying cost.",
      confidence: "high"
    });
  }

  if (insights.length === 0) {
    insights.push({
      headline: "Operational Metrics: Stable",
      detail: "Key business performance indicators show steady execution without anomalies.",
      action: "Continue monitoring job cost margins and invoicing turnaround.",
      confidence: "high"
    });
  }
  
  return insights.slice(0, 5);
}



// ── Helper rendering functions ──────────────────────────────────────────────

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

// ── Report Renderers ────────────────────────────────────────────────────────

function renderOverviewReport(d, mode) {
  const showCharts = mode === 'detailed';
  return `
    ${renderAIInsightsPanel('overview', d)}
    <div class="grid-4" style="margin-bottom:var(--space-lg)">
      ${kpi('Total Revenue', `$${d.totalRevenue.toLocaleString('en-AU',{minimumFractionDigits:2,maximumFractionDigits:2})}`, 'account_balance', 'green')}
      ${kpi('Outstanding', `$${d.totalOutstanding.toLocaleString('en-AU',{minimumFractionDigits:2,maximumFractionDigits:2})}`, 'pending', 'orange')}
      ${kpi('Quote Win Rate', `${d.quoteWinRate.toFixed(0)}%`, 'emoji_events', 'blue')}
      ${kpi('Lead Conversion', `${d.leadConvRate.toFixed(0)}%`, 'trending_up', 'green')}
    </div>
    ${showCharts ? `
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
    ` : ''}
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

function renderRevenueReport(d, mode) {
  const showCharts = mode === 'detailed';
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
    ${renderAIInsightsPanel('revenue', d)}
    <div class="grid-4" style="margin-bottom:var(--space-lg)">
      ${kpi('Gross Revenue', `$${d.totalRevenue.toFixed(0)}`, 'account_balance', 'green')}
      ${kpi('Total Labor', `$${totalLabor.toFixed(0)}`, 'engineering', 'blue')}
      ${kpi('Material Costs', `$${totalCost.toFixed(0)}`, 'inventory_2', 'orange')}
      ${kpi('Gross Profit', `$${grossProfit.toFixed(0)}`, 'savings', 'green')}
    </div>
    ${showCharts ? `
    <div class="card" style="margin-bottom:var(--space-lg)">
      <div class="card-header"><h4>Revenue by Month</h4></div>
      <div class="card-body">${barChart(monthlyRev, {}, '#1B6DE0')}</div>
    </div>
    ` : ''}
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

function renderJobsReport(d, mode) {
  const showCharts = mode === 'detailed';
  const completedJobs = d.jobs.filter(j => j.status === 'Completed' || j.status === 'Invoiced');
  const avgHours = completedJobs.length > 0 ? completedJobs.reduce((s, j) => s + (j.estimatedHours || 0), 0) / completedJobs.length : 0;

  return `
    ${renderAIInsightsPanel('jobs', d)}
    <div class="grid-4" style="margin-bottom:var(--space-lg)">
      ${kpi('Total Jobs', d.jobs.length, 'build', 'blue')}
      ${kpi('Completed', completedJobs.length, 'check_circle', 'green')}
      ${kpi('In Progress', d.jobsByStatus['In Progress'] || 0, 'pending', 'orange')}
      ${kpi('Avg Hours', avgHours.toFixed(1), 'schedule', 'blue')}
    </div>
    ${showCharts ? `
    <div class="card" style="margin-bottom:var(--space-lg)">
      <div class="card-header"><h4>Job Status Distribution</h4></div>
      <div class="card-body">${barChart(d.jobsByStatus, { 'Pending':'#F59E0B','Scheduled':'#3B82F6','In Progress':'#1B6DE0','On Hold':'#6B7280','Completed':'#10B981','Invoiced':'#8B5CF6' })}</div>
    </div>
    ` : ''}
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

function renderJobCostingReport(d, mode) {
  const showTable = mode === 'detailed';
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
    ${renderAIInsightsPanel('job_costing', d)}
    <div class="grid-3" style="margin-bottom:var(--space-lg)">
      ${kpi('Internal Labor Cost', '$' + totalActualLabor.toLocaleString('en-AU', { minimumFractionDigits: 2, maximumFractionDigits: 2 }), 'engineering', 'orange')}
      ${kpi('Billable Labor Rev.', '$' + totalBillableLabor.toLocaleString('en-AU', { minimumFractionDigits: 2, maximumFractionDigits: 2 }), 'payments', 'green')}
      ${kpi('Labor Profitability', (avgMargin.toFixed(1)) + '% Margin', 'trending_up', avgMargin >= 40 ? 'green' : 'orange')}
    </div>
    ${showTable ? `
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
    ` : ''}
  `;
}

function renderTechniciansReport(d, mode) {
  const showBars = mode === 'detailed';
  return `
    ${renderAIInsightsPanel('technicians', d)}
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
    ${showBars ? `
    <div class="card">
      <div class="card-header"><h4>Revenue by Technician</h4></div>
      <div class="card-body">
        ${d.techStats.map(t => progressBar(t.name, t.revenue, Math.max(...d.techStats.map(x => x.revenue)), t.color)).join('')}
      </div>
    </div>
    ` : ''}
  `;
}

function renderTimesheetsLaborReport(d, mode) {
  const showBars = mode === 'detailed';
  const totalHrs = d.timesheets.reduce((s, t) => s + (t.hours || 0), 0);
  const billableHrs = d.timesheets.filter(t => t.jobId).reduce((s, t) => s + (t.hours || 0), 0);
  const utilization = totalHrs > 0 ? (billableHrs / totalHrs * 100) : 0;
  
  let totalLaborCost = 0;
  d.timesheets.forEach(ts => {
    const rate = ts.payRate || 0;
    totalLaborCost += (ts.hours * rate);
  });

  const techRows = d.technicians.map(tech => {
    const tSheets = d.timesheets.filter(ts => ts.technicianId === tech.id);
    const techTotal = tSheets.reduce((s, ts) => s + (ts.hours || 0), 0);
    const approved = tSheets.filter(ts => ts.status === 'Approved').reduce((s, ts) => s + (ts.hours || 0), 0);
    const pending = tSheets.filter(ts => ts.status === 'Pending').reduce((s, ts) => s + (ts.hours || 0), 0);
    const billable = tSheets.filter(ts => ts.jobId).reduce((s, ts) => s + (ts.hours || 0), 0);
    const util = techTotal > 0 ? (billable / techTotal * 100) : 0;
    
    let techCost = 0;
    tSheets.forEach(ts => {
      const rate = ts.payRate || tech.payRate || 0;
      techCost += (ts.hours * rate);
    });

    return {
      name: tech.name,
      role: tech.role,
      total: techTotal,
      approved,
      pending,
      util,
      cost: techCost,
      color: tech.color || '#3B82F6'
    };
  });

  return `
    ${renderAIInsightsPanel('timesheets_labor', d)}

    <div class="grid-4" style="margin-bottom:var(--space-lg)">
      ${kpi('Total Logged Hours', `${totalHrs.toFixed(1)} hrs`, 'schedule', 'blue')}
      ${kpi('Billable Job Hours', `${billableHrs.toFixed(1)} hrs`, 'work', 'green')}
      ${kpi('Labor Utilization', `${utilization.toFixed(1)}%`, 'trending_up', utilization >= 70 ? 'green' : 'orange')}
      ${kpi('Internal Labor Cost', `$${totalLaborCost.toLocaleString('en-AU', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, 'payments', 'orange')}
    </div>

    <div class="card" style="margin-bottom:var(--space-lg)">
      <div class="card-header"><h4>Technician Hours & Cost Breakdown</h4></div>
      <div class="card-body" style="padding:0">
        <table class="data-table">
          <thead>
            <tr>
              <th>Technician</th>
              <th>Role</th>
              <th style="text-align:right">Logged Hrs</th>
              <th style="text-align:right">Approved</th>
              <th style="text-align:right">Pending</th>
              <th style="text-align:right">Utilization %</th>
              <th style="text-align:right">Est. Cost</th>
            </tr>
          </thead>
          <tbody>
            ${techRows.map(tr => `
              <tr>
                <td class="font-medium">${escapeHTML(tr.name)}</td>
                <td class="text-secondary">${escapeHTML(tr.role)}</td>
                <td style="text-align:right; font-weight:600">${tr.total.toFixed(2)}</td>
                <td style="text-align:right; color:var(--color-success)">${tr.approved.toFixed(2)}</td>
                <td style="text-align:right; color:var(--color-warning)">${tr.pending.toFixed(2)}</td>
                <td style="text-align:right">
                  <span class="badge ${tr.util >= 75 ? 'badge-success' : tr.util >= 50 ? 'badge-warning' : 'badge-danger'}">
                    ${tr.util.toFixed(1)}%
                  </span>
                </td>
                <td style="text-align:right; font-weight:600">$${tr.cost.toFixed(2)}</td>
              </tr>
            `).join('')}
            ${!techRows.length ? '<tr><td colspan="7" style="text-align:center;padding:20px" class="text-secondary">No timesheet records logged</td></tr>' : ''}
          </tbody>
        </table>
      </div>
    </div>

    ${showBars ? `
    <div class="card">
      <div class="card-header"><h4>Utilization Rates comparison</h4></div>
      <div class="card-body">
        ${techRows.sort((a,b) => b.util - a.util).map(tr => `
          <div style="margin-bottom:16px">
            <div style="display:flex;justify-content:space-between;margin-bottom:4px">
              <span style="font-size:var(--font-size-sm);font-weight:500">${escapeHTML(tr.name)} <span style="font-size:var(--font-size-xs);color:var(--text-tertiary)">(${escapeHTML(tr.role)})</span></span>
              <span style="font-size:var(--font-size-sm);font-weight:600">${tr.util.toFixed(1)}%</span>
            </div>
            <div style="height:8px;background:var(--border-color);border-radius:4px;overflow:hidden">
              <div style="height:100%;width:${tr.util}%;background:${tr.color};border-radius:4px;transition:width 0.5s ease"></div>
            </div>
          </div>
        `).join('')}
      </div>
    </div>
    ` : ''}
  `;
}

function renderAssetsMaintenanceReport(d, mode) {
  const isDetailed = mode === 'detailed';
  let logCount = 0;
  let totalMaintCost = 0;
  const assetCosts = {};

  d.assets.forEach(a => {
    let aCost = 0;
    (a.logs || []).forEach(l => {
      if (l.type === 'Service') {
        aCost += (l.cost || 0);
        logCount++;
      }
    });
    if (aCost > 0) {
      assetCosts[a.name] = aCost;
      totalMaintCost += aCost;
    }
  });

  const recentLogs = [];
  d.assets.forEach(a => {
    (a.logs || []).forEach(l => {
      if (l.type === 'Service') {
        recentLogs.push({
          ...l,
          assetName: a.name,
          serial: a.serial
        });
      }
    });
  });
  recentLogs.sort((a, b) => new Date(b.date) - new Date(a.date));
  const displayLogs = recentLogs.slice(0, 8);

  const activePlans = d.maintenancePlans.filter(p => p.status === 'Active');

  return `
    ${renderAIInsightsPanel('assets_maintenance', d)}

    <div class="grid-4" style="margin-bottom:var(--space-lg)">
      ${kpi('Total Assets', d.assets.length, 'inventory_2', 'blue')}
      ${kpi('Active Agreements', activePlans.length, 'history_edu', 'green')}
      ${kpi('Service Actions Logged', logCount, 'engineering', 'orange')}
      ${kpi('Cumulative Servicing Cost', `$${totalMaintCost.toLocaleString('en-AU', { maximumFractionDigits: 0 })}`, 'savings', 'green')}
    </div>

    ${isDetailed ? `
    <div class="grid-2" style="margin-bottom:var(--space-lg);">
      <div class="card">
        <div class="card-header"><h4>Active Maintenance Agreements</h4></div>
        <div class="card-body" style="padding:0; overflow-y:auto; max-height:400px;">
          <table class="data-table">
            <thead>
              <tr>
                <th>Agreement Plan</th>
                <th>Asset Name</th>
                <th>Priority</th>
                <th>Next Due</th>
              </tr>
            </thead>
            <tbody>
              ${d.maintenancePlans.map(p => `
                <tr>
                  <td class="font-medium">${escapeHTML(p.name)}</td>
                  <td class="text-secondary">${escapeHTML(p.assetName)}</td>
                  <td>
                    <span class="badge ${p.priority >= 8 ? 'badge-danger' : p.priority >= 4 ? 'badge-warning' : 'badge-success'}">
                      Priority ${p.priority || 5}
                    </span>
                  </td>
                  <td class="text-secondary" style="font-size:12px">${escapeHTML(p.nextServiceDate || p.nextDue || '—')}</td>
                </tr>
              `).join('')}
              ${!d.maintenancePlans.length ? '<tr><td colspan="4" style="text-align:center;padding:20px" class="text-secondary">No maintenance plans active</td></tr>' : ''}
            </tbody>
          </table>
        </div>
      </div>

      <div class="card">
        <div class="card-header"><h4>Maintenance Cost by Asset</h4></div>
        <div class="card-body">
          ${barChart(assetCosts, {}, '#EF4444')}
        </div>
      </div>
    </div>

    <div class="card">
      <div class="card-header"><h4>Recent Servicing Actions History</h4></div>
      <div class="card-body" style="padding:0">
        <table class="data-table">
          <thead>
            <tr>
              <th>Date</th>
              <th>Asset Name</th>
              <th>Serial Number</th>
              <th>Technician</th>
              <th>Job #</th>
              <th style="text-align:right">Service Cost</th>
              <th>Observations</th>
            </tr>
          </thead>
          <tbody>
            ${displayLogs.map(l => `
              <tr>
                <td class="text-secondary" style="font-size:12px">${new Date(l.date).toLocaleDateString()}</td>
                <td class="font-medium">${escapeHTML(l.assetName)}</td>
                <td class="text-secondary" style="font-family:monospace; font-size:12px">${escapeHTML(l.serial || '—')}</td>
                <td>${escapeHTML(l.technicianName || 'Unassigned')}</td>
                <td><span class="badge badge-neutral">${escapeHTML(l.jobNumber || '—')}</span></td>
                <td style="text-align:right; font-weight:600; color:var(--color-danger)">$${(l.cost || 0).toFixed(2)}</td>
                <td class="text-secondary truncate" style="max-width:250px;">${escapeHTML(l.notes || '—')}</td>
              </tr>
            `).join('')}
            ${!displayLogs.length ? '<tr><td colspan="7" style="text-align:center;padding:20px" class="text-secondary">No service logs registered yet</td></tr>' : ''}
          </tbody>
        </table>
      </div>
    </div>
    ` : `
    <div class="card">
      <div class="card-header"><h4>Active Maintenance Agreements</h4></div>
      <div class="card-body" style="padding:0; overflow-y:auto; max-height:400px;">
        <table class="data-table">
          <thead>
            <tr>
              <th>Agreement Plan</th>
              <th>Asset Name</th>
              <th>Priority</th>
              <th>Next Due</th>
            </tr>
          </thead>
          <tbody>
            ${d.maintenancePlans.map(p => `
              <tr>
                <td class="font-medium">${escapeHTML(p.name)}</td>
                <td class="text-secondary">${escapeHTML(p.assetName)}</td>
                <td>
                  <span class="badge ${p.priority >= 8 ? 'badge-danger' : p.priority >= 4 ? 'badge-warning' : 'badge-success'}">
                    Priority ${p.priority || 5}
                  </span>
                </td>
                <td class="text-secondary" style="font-size:12px">${escapeHTML(p.nextServiceDate || p.nextDue || '—')}</td>
              </tr>
            `).join('')}
            ${!d.maintenancePlans.length ? '<tr><td colspan="4" style="text-align:center;padding:20px" class="text-secondary">No maintenance plans active</td></tr>' : ''}
          </tbody>
        </table>
      </div>
    </div>
    `}
  `;
}

function renderCustomersReport(d, mode) {
  const isDetailed = mode === 'detailed';
  return `
    ${renderAIInsightsPanel('customers', d)}
    <div class="grid-3" style="margin-bottom:var(--space-lg)">
      ${kpi('Total Customers', d.customers.length, 'people', 'blue')}
      ${kpi('Active Customers', d.customers.filter(c => c.status === 'Active').length, 'check_circle', 'green')}
      ${kpi('Total Leads', d.leads.length, 'trending_up', 'orange')}
    </div>
    ${isDetailed ? `
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
    ` : ''}
  `;
}

function renderInventoryReport(d, mode) {
  const isDetailed = mode === 'detailed';
  const sellValue = d.stock.reduce((s, i) => s + (i.quantity * i.unitPrice), 0);
  return `
    ${renderAIInsightsPanel('inventory', d)}
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
    ${isDetailed ? `
    <div class="card">
      <div class="card-header"><h4>Stock by Category</h4></div>
      <div class="card-body">
        ${barChart(d.stock.reduce((acc, i) => { acc[i.category] = (acc[i.category] || 0) + i.quantity; return acc; }, {}), {}, '#1B6DE0')}
      </div>
    </div>
    ` : ''}
  `;
}
