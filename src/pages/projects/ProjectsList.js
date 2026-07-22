// ============================================
// FIELDFORGE — PROJECTS LIST PAGE
// ============================================

import { store } from '../../data/store.js';
import { router } from '../../router.js';
import { showModal } from '../../components/Modal.js';
import { showToast } from '../../components/Notifications.js';
import { escapeHTML } from '../../utils/security.js';
import { isWithinDateRange } from '../../utils/dateUtils.js';

export function renderProjectsList(container) {
  const projects = store.getAll('projects') || [];
  const jobs = store.getAll('jobs') || [];
  const invoices = store.getAll('invoices') || [];
  const customers = store.getAll('customers') || [];

  let currentFilter = 'all';
  let searchQuery = '';
  let currentDateRange = 'all-time';

  const calculateMetrics = (filteredProjs) => {
    const totalCount = filteredProjs.length;
    let totalValue = 0;
    let totalBilled = 0;

    filteredProjs.forEach(proj => {
      const projJobs = jobs.filter(j => j.projectId === proj.id);
      projJobs.forEach(job => {
        const matsTotal = (job.materials || []).reduce((s, m) => s + (m.total || 0), 0);
        const laborTotal = (job.labor || []).reduce((s, l) => s + (l.total || 0), 0);
        totalValue += (matsTotal + laborTotal);

        const jobInvoices = invoices.filter(inv => inv.jobId === job.id && inv.status !== 'Void');
        totalBilled += jobInvoices.reduce((s, inv) => s + (inv.total || 0), 0);
      });
    });

    return { totalCount, totalValue, totalBilled };
  };

  const getFilteredProjects = () => {
    return projects.filter(proj => {
      // Status Filter
      if (currentFilter !== 'all' && proj.status !== currentFilter) {
        return false;
      }
      
      // Date Range Filter (based on startDate, fallback to createdAt)
      const projDate = proj.startDate || proj.createdAt;
      if (projDate && !isWithinDateRange(projDate, currentDateRange)) {
        return false;
      }

      // Search filter
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        const numMatch = (proj.number || '').toLowerCase().includes(query);
        const nameMatch = (proj.name || '').toLowerCase().includes(query);
        const custMatch = (proj.customerName || '').toLowerCase().includes(query);
        return numMatch || nameMatch || custMatch;
      }
      return true;
    });
  };

  const render = () => {
    const filtered = getFilteredProjects();
    const metrics = calculateMetrics(filtered);

    container.innerHTML = `
      <style>
        .kpi-card {
          margin: 0;
          box-shadow: var(--shadow-sm);
          transition: transform 0.2s cubic-bezier(0.4, 0, 0.2, 1), box-shadow 0.2s cubic-bezier(0.4, 0, 0.2, 1);
          border: none;
          position: relative;
          overflow: hidden;
        }
        .kpi-card:hover {
          transform: translateY(-4px);
          box-shadow: var(--shadow-md);
        }
        .kpi-card::before {
          content: "";
          position: absolute;
          top: 0; left: 0; bottom: 0; width: 4px;
        }
        .kpi-card.kpi-primary::before { background: var(--color-primary); }
        .kpi-card.kpi-success::before { background: var(--color-success); }
        .kpi-card.kpi-warning::before { background: var(--color-warning); }

        .progress-bar-container {
          width: 100%;
          height: 6px;
          background-color: var(--border-color);
          border-radius: 4px;
          overflow: hidden;
          margin-top: 4px;
        }
        .progress-bar-fill {
          height: 100%;
          background-color: var(--color-primary);
          transition: width 0.4s ease;
        }
      </style>

      <div class="page-header">
        <h1>Projects</h1>
        <div class="page-header-actions">
          <button class="btn btn-primary" id="btn-new-project" data-tooltip="Create a new parent project" data-tooltip-pos="left">
            <span class="material-icons-outlined">add</span> New Project
          </button>
        </div>
      </div>

      <!-- Projects KPI Summary Row -->
      <div style="display:grid; grid-template-columns: repeat(auto-fit, minmax(260px, 1fr)); gap:20px; margin-bottom:24px">
        
        <!-- Card 1: Total Projects -->
        <div class="card kpi-card kpi-primary">
          <div class="card-body" style="padding:20px; display:flex; align-items:center; gap:16px">
            <div style="width:52px; height:52px; border-radius:12px; background:linear-gradient(135deg, var(--color-primary-light), #e0e7ff); color:var(--color-primary); display:flex; align-items:center; justify-content:center; box-shadow: 0 4px 12px rgba(79, 70, 229, 0.15)">
              <span class="material-icons-outlined" style="font-size:26px">folder_copy</span>
            </div>
            <div>
              <div style="font-size:11px; font-weight:700; color:var(--text-tertiary); text-transform:uppercase; letter-spacing:0.5px">Active Projects</div>
              <div style="font-size:24px; font-weight:800; color:var(--text-primary); margin-top:2px; line-height:1.2">${filtered.filter(p => p.status === 'In Progress').length} / ${metrics.totalCount}</div>
              <div style="font-size:11px; color:var(--text-secondary); margin-top:2px">Projects currently in progress</div>
            </div>
          </div>
        </div>

        <!-- Card 2: Est. Portfolio Value -->
        <div class="card kpi-card kpi-success">
          <div class="card-body" style="padding:20px; display:flex; align-items:center; gap:16px">
            <div style="width:52px; height:52px; border-radius:12px; background:linear-gradient(135deg, var(--color-success-bg), #dcfce7); color:var(--color-success); display:flex; align-items:center; justify-content:center; box-shadow: 0 4px 12px rgba(16, 185, 129, 0.15)">
              <span class="material-icons-outlined" style="font-size:26px">monetization_on</span>
            </div>
            <div>
              <div style="font-size:11px; font-weight:700; color:var(--text-tertiary); text-transform:uppercase; letter-spacing:0.5px">Total Portfolio Value</div>
              <div style="font-size:24px; font-weight:800; color:var(--color-success-dark); margin-top:2px; line-height:1.2">$${metrics.totalValue.toLocaleString('en-AU', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
              <div style="font-size:11px; color:var(--text-secondary); margin-top:2px">Sum of stage/job values</div>
            </div>
          </div>
        </div>

        <!-- Card 3: Portfolio Billed -->
        <div class="card kpi-card kpi-warning">
          <div class="card-body" style="padding:20px; display:flex; align-items:center; gap:16px">
            <div style="width:52px; height:52px; border-radius:12px; background:linear-gradient(135deg, var(--color-warning-bg), #fef9c3); color:var(--color-warning-dark); display:flex; align-items:center; justify-content:center; box-shadow: 0 4px 12px rgba(245, 158, 11, 0.15)">
              <span class="material-icons-outlined" style="font-size:26px">receipt_long</span>
            </div>
            <div>
              <div style="font-size:11px; font-weight:700; color:var(--text-tertiary); text-transform:uppercase; letter-spacing:0.5px">Total Invoiced</div>
              <div style="font-size:24px; font-weight:800; color:var(--text-primary); margin-top:2px; line-height:1.2">$${metrics.totalBilled.toLocaleString('en-AU', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
              <div style="font-size:11px; color:var(--text-secondary); margin-top:2px">${Math.round(metrics.totalValue > 0 ? (metrics.totalBilled / metrics.totalValue) * 100 : 0)}% of total value billed</div>
            </div>
          </div>
        </div>
      </div>

      <!-- Filters & Toolbar -->
      <div class="page-toolbar" style="display:flex; justify-content:space-between; flex-wrap:wrap; gap:16px;">
        <div class="toolbar-filters">
          <button class="toolbar-filter ${currentFilter === 'all' ? 'active' : ''}" data-filter="all">All (${projects.length})</button>
          <button class="toolbar-filter ${currentFilter === 'In Progress' ? 'active' : ''}" data-filter="In Progress">In Progress</button>
          <button class="toolbar-filter ${currentFilter === 'Completed' ? 'active' : ''}" data-filter="Completed">Completed</button>
          <button class="toolbar-filter ${currentFilter === 'Cancelled' ? 'active' : ''}" data-filter="Cancelled">Cancelled</button>
        </div>
        <div style="display:flex; gap:12px; align-items:center;">
          <select id="projects-date-range" class="form-select" style="min-width:160px; height:38px; border-radius:8px;">
            <option value="all-time" ${currentDateRange === 'all-time' ? 'selected' : ''}>All Time</option>
            <option value="today" ${currentDateRange === 'today' ? 'selected' : ''}>Today</option>
            <option value="this-week" ${currentDateRange === 'this-week' ? 'selected' : ''}>This Week</option>
            <option value="last-week" ${currentDateRange === 'last-week' ? 'selected' : ''}>Last Week</option>
            <option value="this-month" ${currentDateRange === 'this-month' ? 'selected' : ''}>This Month</option>
            <option value="last-month" ${currentDateRange === 'last-month' ? 'selected' : ''}>Last Month</option>
            <option value="this-year" ${currentDateRange === 'this-year' ? 'selected' : ''}>This Year</option>
          </select>
          <div class="toolbar-search">
            <span class="material-icons-outlined">search</span>
            <input type="text" placeholder="Search projects..." id="projects-search" value="${escapeHTML(searchQuery)}" />
          </div>
        </div>
      </div>

      <!-- Projects Table -->
      <div class="card" style="padding:0; box-shadow:var(--shadow-sm)">
        <div class="card-body" style="padding:0">
          <table class="data-table table-hover">
            <thead>
              <tr>
                <th style="padding-left:16px; width:120px">Project No.</th>
                <th>Project Name</th>
                <th>Customer</th>
                <th style="width:130px">Status</th>
                <th style="width:120px">Start Date</th>
                <th style="width:140px; text-align:center">Progress</th>
                <th style="width:120px; text-align:right">Value</th>
                <th style="width:120px; text-align:right">Invoiced</th>
                <th style="width:80px; text-align:right; padding-right:16px">Actions</th>
              </tr>
            </thead>
            <tbody>
              ${filtered.length === 0 ? `
                <tr>
                  <td colspan="9" style="text-align:center; padding:64px 16px; color:var(--text-secondary)">
                    <span class="material-icons-outlined" style="font-size:48px; color:var(--border-color); display:block; margin-bottom:12px;">search_off</span>
                    No projects found matching the criteria.
                  </td>
                </tr>
              ` : filtered.map(proj => {
                const projJobs = jobs.filter(j => j.projectId === proj.id);
                const stagesCount = projJobs.length;
                const completedStages = projJobs.filter(j => j.status === 'Completed' || j.status === 'Invoiced').length;
                const progressPct = stagesCount === 0 ? 0 : Math.round((completedStages / stagesCount) * 100);

                // Sum project jobs value & invoices
                let val = 0;
                let billed = 0;
                projJobs.forEach(job => {
                  const mSum = (job.materials || []).reduce((s, m) => s + (m.total || 0), 0);
                  const lSum = (job.labor || []).reduce((s, l) => s + (l.total || 0), 0);
                  val += (mSum + lSum);

                  const jobInvs = invoices.filter(inv => inv.jobId === job.id && inv.status !== 'Void');
                  billed += jobInvs.reduce((s, inv) => s + (inv.total || 0), 0);
                });

                let statusClass = 'badge-neutral';
                if (proj.status === 'In Progress') statusClass = 'badge-primary';
                if (proj.status === 'Completed') statusClass = 'badge-success';
                if (proj.status === 'Cancelled') statusClass = 'badge-danger';

                return `
                  <tr>
                    <td style="padding-left:16px">
                      <a href="#/projects/${proj.id}" style="font-weight:600; color:var(--color-primary); text-decoration:none">${escapeHTML(proj.number)}</a>
                    </td>
                    <td>
                      <a href="#/projects/${proj.id}" style="font-weight:700; color:var(--text-primary); text-decoration:none; display:block">${escapeHTML(proj.name)}</a>
                    </td>
                    <td>${escapeHTML(proj.customerName || 'N/A')}</td>
                    <td>
                      <span class="badge ${statusClass}">${escapeHTML(proj.status)}</span>
                    </td>
                    <td>${proj.startDate ? proj.startDate : '—'}</td>
                    <td style="padding-right:24px;">
                      <div style="display:flex; justify-content:space-between; font-size:11px; margin-bottom:2px; font-weight:600;">
                        <span style="color:var(--text-secondary)">${completedStages}/${stagesCount} Stages</span>
                        <span style="color:${progressPct === 100 ? 'var(--color-success)' : 'var(--text-primary)'}">${progressPct}%</span>
                      </div>
                      <div class="progress-bar-container">
                        <div class="progress-bar-fill" style="width:${progressPct}%; background-color:${progressPct === 100 ? 'var(--color-success)' : 'var(--color-primary)'};"></div>
                      </div>
                    </td>
                    <td style="text-align:right; font-weight:600">$${val.toLocaleString('en-AU', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                    <td style="text-align:right; font-weight:600; color:var(--color-success-dark)">$${billed.toLocaleString('en-AU', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                    <td style="text-align:right; padding-right:16px">
                      <a href="#/projects/${proj.id}" class="btn btn-secondary btn-sm" style="display:inline-flex; align-items:center; justify-content:center; padding:6px 10px; font-weight:600; border-radius:6px;">View</a>
                    </td>
                  </tr>
                `;
              }).join('')}
            </tbody>
          </table>
        </div>
      </div>
    `;

    // Hook events
    container.querySelector('#btn-new-project')?.addEventListener('click', () => openNewProjectModal());
    
    // Search listener
    const searchInput = container.querySelector('#projects-search');
    if (searchInput) {
      searchInput.addEventListener('input', (e) => {
        searchQuery = e.target.value;
        render();
      });
      searchInput.focus();
      // place cursor at end
      const len = searchInput.value.length;
      searchInput.setSelectionRange(len, len);
    }

    // Date Range listener
    const dateRangeSelect = container.querySelector('#projects-date-range');
    if (dateRangeSelect) {
      dateRangeSelect.addEventListener('change', (e) => {
        currentDateRange = e.target.value;
        render();
      });
    }

    // Filter clicks
    container.querySelectorAll('.toolbar-filter').forEach(btn => {
      btn.addEventListener('click', () => {
        currentFilter = btn.dataset.filter;
        render();
      });
    });
  };

  const openNewProjectModal = () => {
    const modalContent = document.createElement('div');
    modalContent.innerHTML = `
      <div style="margin-bottom:16px; padding:12px; background:var(--color-primary-light); border-radius:8px; border-left:4px solid var(--color-primary); color:var(--color-primary-dark); font-size:13px; line-height:1.5;">
        <strong>Parent Projects</strong> group multiple stages (Jobs) together under a single umbrella. This allows you to track overall progress, margins, and issue consolidated invoices across multiple jobs.
      </div>
      <div class="form-group" style="margin-bottom:16px">
        <label class="form-label" style="display:block; margin-bottom:6px">Project Name <span style="color:var(--color-danger)">*</span></label>
        <input class="form-input" id="p-name" placeholder="e.g. Dubbo Shopping Mall Solar Install" style="width:100%" />
      </div>
      <div class="form-group" style="margin-bottom:16px">
        <label class="form-label" style="display:block; margin-bottom:6px">Customer <span style="color:var(--color-danger)">*</span></label>
        <select class="form-select" id="p-customer" style="width:100%">
          <option value="">-- Select Customer --</option>
          ${customers.map(c => `
            <option value="${c.id}">${escapeHTML(c.company || `${c.firstName} ${c.lastName}`)}</option>
          `).join('')}
        </select>
      </div>
      <div class="form-group" style="margin-bottom:16px">
        <label class="form-label" style="display:block; margin-bottom:6px">Site Address</label>
        <select class="form-select" id="p-site" style="width:100%">
          <option value="">-- Select Customer First --</option>
        </select>
      </div>
      <div class="form-group" style="margin-bottom:16px">
        <label class="form-label" style="display:block; margin-bottom:6px">Description & Scope</label>
        <textarea class="form-textarea" id="p-desc" rows="3" placeholder="Provide a brief scope / summary of the project" style="width:100%"></textarea>
      </div>
      <div class="form-row" style="display:grid; grid-template-columns:1fr 1fr; gap:16px; margin-bottom:16px">
        <div class="form-group">
          <label class="form-label" style="display:block; margin-bottom:6px">Start Date</label>
          <input type="date" class="form-input" id="p-start-date" style="width:100%" />
        </div>
        <div class="form-group">
          <label class="form-label" style="display:block; margin-bottom:6px">End Date (Target)</label>
          <input type="date" class="form-input" id="p-end-date" style="width:100%" />
        </div>
      </div>
    `;

    const customerSelect = modalContent.querySelector('#p-customer');
    const siteSelect = modalContent.querySelector('#p-site');

    customerSelect.addEventListener('change', () => {
      const custId = customerSelect.value;
      if (!custId) {
        siteSelect.innerHTML = '<option value="">-- Select Customer First --</option>';
        return;
      }
      const c = store.getById('customers', custId);
      if (c && c.sites && c.sites.length > 0) {
        siteSelect.innerHTML = `
          <option value="">-- Select Site --</option>
          ${c.sites.map(s => `<option value="${escapeHTML(s.address)}">${escapeHTML(s.name)} — ${escapeHTML(s.address)}</option>`).join('')}
        `;
      } else {
        siteSelect.innerHTML = '<option value="">No sites configured for this customer</option>';
      }
    });

    showModal({
      title: 'Create New Project',
      content: modalContent,
      actions: [
        { label: 'Cancel', className: 'btn-secondary', onClick: c => c() },
        { label: 'Create Project', className: 'btn-primary btn-create-proj', onClick: async (c) => {
          const name = document.getElementById('p-name').value.trim();
          const customerId = document.getElementById('p-customer').value;
          const siteAddress = document.getElementById('p-site').value;
          const description = document.getElementById('p-desc').value.trim();
          const startDate = document.getElementById('p-start-date').value;
          const endDate = document.getElementById('p-end-date').value;

          if (!name) { showToast('Project Name is required', 'error'); return; }
          if (!customerId) { showToast('Customer selection is required', 'error'); return; }

          const selectedCust = store.getById('customers', customerId);
          const customerName = selectedCust.company || `${selectedCust.firstName} ${selectedCust.lastName}`;

          try {
            const btn = document.querySelector('.btn-create-proj');
            if (btn) {
              btn.disabled = true;
              btn.innerHTML = 'Creating...';
            }

            const newProj = await store.create('projects', {
              name,
              customerId,
              customerName,
              siteAddress,
              description,
              startDate,
              endDate,
              status: 'In Progress'
            });

            showToast(`Project ${newProj.number} created successfully`, 'success');
            c();
            router.navigate(`/projects/${newProj.id}`);
          } catch (err) {
            console.error('Error creating project:', err);
            showToast('Failed to create project: ' + err.message, 'error');
          }
        }}
      ]
    });
  };

  render();
}
