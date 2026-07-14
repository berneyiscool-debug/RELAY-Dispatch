// ============================================
// FIELDFORGE — PROJECTS LIST PAGE
// ============================================

import { store } from '../../data/store.js';
import { router } from '../../router.js';
import { showModal } from '../../components/Modal.js';
import { showToast } from '../../components/Notifications.js';
import { escapeHTML } from '../../utils/security.js';

export function renderProjectsList(container) {
  const projects = store.getAll('projects') || [];
  const jobs = store.getAll('jobs') || [];
  const invoices = store.getAll('invoices') || [];
  const customers = store.getAll('customers') || [];

  let currentFilter = 'all';
  let searchQuery = '';

  const calculateMetrics = () => {
    // Total Projects
    const totalCount = projects.length;

    // Total Project Value (sum of all jobs under projects)
    let totalValue = 0;
    let totalBilled = 0;

    projects.forEach(proj => {
      const projJobs = jobs.filter(j => j.projectId === proj.id);
      projJobs.forEach(job => {
        // Value of job is materials total + labor total
        const matsTotal = (job.materials || []).reduce((s, m) => s + (m.total || 0), 0);
        const laborTotal = (job.labor || []).reduce((s, l) => s + (l.total || 0), 0);
        totalValue += (matsTotal + laborTotal);

        // Find invoices for this job
        const jobInvoices = invoices.filter(inv => inv.jobId === job.id && inv.status !== 'Void');
        totalBilled += jobInvoices.reduce((s, inv) => s + (inv.total || 0), 0);
      });
    });

    return { totalCount, totalValue, totalBilled };
  };

  const metrics = calculateMetrics();

  const getFilteredProjects = () => {
    return projects.filter(proj => {
      // Status Filter
      if (currentFilter !== 'all' && proj.status !== currentFilter) {
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

    container.innerHTML = `
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
        <div class="card" style="margin:0; box-shadow:var(--shadow-sm); border-left:4px solid var(--color-primary)">
          <div class="card-body" style="padding:16px 20px; display:flex; align-items:center; gap:16px">
            <div style="width:48px; height:48px; border-radius:50%; background:var(--color-primary-light); color:var(--color-primary); display:flex; align-items:center; justify-content:center">
              <span class="material-icons-outlined" style="font-size:24px">folder_copy</span>
            </div>
            <div>
              <div style="font-size:11px; font-weight:700; color:var(--text-tertiary); text-transform:uppercase; letter-spacing:0.5px">Active Projects</div>
              <div style="font-size:22px; font-weight:800; color:var(--text-primary); margin-top:4px">${projects.filter(p => p.status === 'In Progress').length} / ${metrics.totalCount}</div>
              <div style="font-size:11px; color:var(--text-secondary); margin-top:2px">Projects currently in progress</div>
            </div>
          </div>
        </div>

        <!-- Card 2: Est. Portfolio Value -->
        <div class="card" style="margin:0; box-shadow:var(--shadow-sm); border-left:4px solid var(--color-success)">
          <div class="card-body" style="padding:16px 20px; display:flex; align-items:center; gap:16px">
            <div style="width:48px; height:48px; border-radius:50%; background:var(--color-success-bg); color:var(--color-success); display:flex; align-items:center; justify-content:center">
              <span class="material-icons-outlined" style="font-size:24px">monetization_on</span>
            </div>
            <div>
              <div style="font-size:11px; font-weight:700; color:var(--text-tertiary); text-transform:uppercase; letter-spacing:0.5px">Total Portfolio Value</div>
              <div style="font-size:22px; font-weight:800; color:var(--color-success-dark); margin-top:4px">$${metrics.totalValue.toLocaleString('en-AU', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
              <div style="font-size:11px; color:var(--text-secondary); margin-top:2px">Sum of stage/job values</div>
            </div>
          </div>
        </div>

        <!-- Card 3: Portfolio Billed -->
        <div class="card" style="margin:0; box-shadow:var(--shadow-sm); border-left:4px solid var(--color-warning)">
          <div class="card-body" style="padding:16px 20px; display:flex; align-items:center; gap:16px">
            <div style="width:48px; height:48px; border-radius:50%; background:var(--color-warning-bg); color:var(--color-warning-dark); display:flex; align-items:center; justify-content:center">
              <span class="material-icons-outlined" style="font-size:24px">receipt_long</span>
            </div>
            <div>
              <div style="font-size:11px; font-weight:700; color:var(--text-tertiary); text-transform:uppercase; letter-spacing:0.5px">Total Invoiced</div>
              <div style="font-size:22px; font-weight:800; color:var(--text-primary); margin-top:4px">$${metrics.totalBilled.toLocaleString('en-AU', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
              <div style="font-size:11px; color:var(--text-secondary); margin-top:2px">${Math.round(metrics.totalValue > 0 ? (metrics.totalBilled / metrics.totalValue) * 100 : 0)}% of total value billed</div>
            </div>
          </div>
        </div>
      </div>

      <!-- Filters & Toolbar -->
      <div class="page-toolbar">
        <div class="toolbar-filters">
          <button class="toolbar-filter ${currentFilter === 'all' ? 'active' : ''}" data-filter="all">All (${projects.length})</button>
          <button class="toolbar-filter ${currentFilter === 'In Progress' ? 'active' : ''}" data-filter="In Progress">In Progress</button>
          <button class="toolbar-filter ${currentFilter === 'Completed' ? 'active' : ''}" data-filter="Completed">Completed</button>
          <button class="toolbar-filter ${currentFilter === 'Cancelled' ? 'active' : ''}" data-filter="Cancelled">Cancelled</button>
        </div>
        <div class="toolbar-search">
          <span class="material-icons-outlined">search</span>
          <input type="text" placeholder="Search projects..." id="projects-search" value="${escapeHTML(searchQuery)}" />
        </div>
      </div>

      <!-- Projects Table -->
      <div class="card" style="padding:0; box-shadow:var(--shadow-sm)">
        <div class="card-body" style="padding:0">
          <table class="data-table">
            <thead>
              <tr>
                <th style="padding-left:16px; width:120px">Project No.</th>
                <th>Project Name</th>
                <th>Customer</th>
                <th style="width:130px">Status</th>
                <th style="width:120px">Start Date</th>
                <th style="width:120px">End Date</th>
                <th style="width:90px; text-align:center">Stages</th>
                <th style="width:120px; text-align:right">Value</th>
                <th style="width:120px; text-align:right">Invoiced</th>
                <th style="width:80px; text-align:right; padding-right:16px">Actions</th>
              </tr>
            </thead>
            <tbody>
              ${filtered.length === 0 ? `
                <tr>
                  <td colspan="10" style="text-align:center; padding:48px 16px; color:var(--text-secondary)">
                    No projects found matching the criteria.
                  </td>
                </tr>
              ` : filtered.map(proj => {
                const projJobs = jobs.filter(j => j.projectId === proj.id);
                const stagesCount = projJobs.length;

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
                    <td>${proj.endDate ? proj.endDate : '—'}</td>
                    <td style="text-align:center; font-weight:600">${stagesCount}</td>
                    <td style="text-align:right; font-weight:600">$${val.toLocaleString('en-AU', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                    <td style="text-align:right; font-weight:600; color:var(--color-success-dark)">$${billed.toLocaleString('en-AU', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                    <td style="text-align:right; padding-right:16px">
                      <a href="#/projects/${proj.id}" class="btn btn-secondary btn-sm" style="display:inline-flex; align-items:center; justify-content:center; padding:4px 8px; font-weight:700">View</a>
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
        <label class="form-label" style="display:block; margin-bottom:6px">Description</label>
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
