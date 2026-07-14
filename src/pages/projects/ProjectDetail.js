// ============================================
// FIELDFORGE — PROJECT DETAIL PAGE
// ============================================

import { store } from '../../data/store.js';
import { router } from '../../router.js';
import { showModal } from '../../components/Modal.js';
import { showToast } from '../../components/Notifications.js';
import { escapeHTML } from '../../utils/security.js';

export function renderProjectDetail(container, params) {
  const { id } = params;
  
  const project = store.getById('projects', id);
  if (!project) {
    container.innerHTML = `
      <div style="padding:32px; text-align:center">
        <h3>Project not found</h3>
        <p>The project with ID ${escapeHTML(id)} could not be loaded.</p>
        <a href="#/projects" class="btn btn-primary">Back to Projects</a>
      </div>
    `;
    return;
  }

  const jobs = store.getAll('jobs') || [];
  const invoices = store.getAll('invoices') || [];
  const customers = store.getAll('customers') || [];
  const costCenters = store.getAll('costCenters') || [];

  // Filter jobs that belong to this project
  const projectJobs = jobs.filter(j => j.projectId === project.id);

  // Track checkbox selections for billing/invoicing
  let selectedJobIds = [];

  const calculateProjectMetrics = () => {
    let totalValue = 0;
    let totalCost = 0;
    let totalBilled = 0;
    let totalPaid = 0;

    const costCenterSplit = {};

    projectJobs.forEach(job => {
      // Job value
      const matsTotal = (job.materials || []).reduce((s, m) => s + (m.total || 0), 0);
      const laborTotal = (job.labor || []).reduce((s, l) => s + (l.total || 0), 0);
      const jobValue = matsTotal + laborTotal;
      totalValue += jobValue;

      // Job cost (Materials cost + labor cost based on technician pay rate)
      const matsCost = (job.materials || []).reduce((s, m) => s + (m.cost * (m.qty || 1) || 0), 0);
      
      // Calculate actual labor cost
      let jobLaborCost = 0;
      if (job.labor && job.labor.length > 0) {
        job.labor.forEach(l => {
          // Fallback to tech payRate if available, else standard rate
          let techPayRate = 50; // default cost rate
          if (job.technicians && job.technicians.length > 0) {
            const firstTech = store.getById('technicians', job.technicians[0].id);
            if (firstTech && firstTech.payRate) {
              techPayRate = firstTech.payRate;
            }
          }
          jobLaborCost += (l.hours * techPayRate);
        });
      }
      const jobCost = matsCost + jobLaborCost;
      totalCost += jobCost;

      // Cost Center Split
      const ccId = job.costCenterId || 'unassigned';
      if (!costCenterSplit[ccId]) {
        costCenterSplit[ccId] = { value: 0, cost: 0 };
      }
      costCenterSplit[ccId].value += jobValue;
      costCenterSplit[ccId].cost += jobCost;

      // Job invoices
      const jobInvs = invoices.filter(inv => inv.jobId === job.id && inv.status !== 'Void');
      jobInvs.forEach(inv => {
        totalBilled += (inv.total || 0);
        if (inv.status === 'Paid') {
          totalPaid += (inv.total || 0);
        }
      });
    });

    const profit = totalValue - totalCost;
    const margin = totalValue > 0 ? (profit / totalValue) * 100 : 0;
    const unpaid = totalBilled - totalPaid;

    return {
      totalValue,
      totalCost,
      profit,
      margin,
      totalBilled,
      totalPaid,
      unpaid,
      costCenterSplit
    };
  };

  const metrics = calculateProjectMetrics();

  const render = () => {
    let statusClass = 'badge-neutral';
    if (project.status === 'In Progress') statusClass = 'badge-primary';
    if (project.status === 'Completed') statusClass = 'badge-success';
    if (project.status === 'Cancelled') statusClass = 'badge-danger';

    container.innerHTML = `
      <div style="margin-bottom:16px">
        <a href="#/projects" style="display:inline-flex; align-items:center; gap:4px; font-weight:700; color:var(--text-secondary); text-decoration:none">
          <span class="material-icons-outlined" style="font-size:16px">arrow_back</span> Back to Projects
        </a>
      </div>

      <div class="page-header" style="margin-bottom:24px">
        <div>
          <div style="display:flex; align-items:center; gap:12px; margin-bottom:4px">
            <span style="font-size:13px; font-weight:700; color:var(--text-tertiary); letter-spacing:0.5px">${escapeHTML(project.number)}</span>
            <span class="badge ${statusClass}">${escapeHTML(project.status)}</span>
          </div>
          <h1>${escapeHTML(project.name)}</h1>
          <div style="font-size:14px; color:var(--text-secondary); margin-top:4px">
            Customer: <strong style="color:var(--text-primary)">${escapeHTML(project.customerName || 'N/A')}</strong>
            ${project.siteAddress ? ` &bull; Site: <strong>${escapeHTML(project.siteAddress)}</strong>` : ''}
          </div>
        </div>
        <div class="page-header-actions">
          <button class="btn btn-secondary" id="btn-edit-project" style="display:flex; align-items:center; gap:6px">
            <span class="material-icons-outlined" style="font-size:18px">edit</span> Edit Details
          </button>
          <button class="btn btn-danger-outline" id="btn-delete-project" style="display:flex; align-items:center; gap:6px">
            <span class="material-icons-outlined" style="font-size:18px">delete</span> Delete
          </button>
        </div>
      </div>

      <div style="display:grid; grid-template-columns: 2fr 1fr; gap:24px">
        <!-- LEFT COLUMN: Stages and Scope -->
        <div style="display:flex; flex-direction:column; gap:24px">
          <!-- STAGES CARD -->
          <div class="card" style="margin:0; box-shadow:var(--shadow-sm)">
            <div class="card-header" style="display:flex; justify-content:space-between; align-items:center">
              <h4 style="margin:0">Project Stages (Jobs)</h4>
              <div style="display:flex; gap:10px">
                <button class="btn btn-secondary btn-sm" id="btn-add-existing-stage" style="display:flex; align-items:center; gap:4px">
                  <span class="material-icons-outlined" style="font-size:16px">link</span> Link Job
                </button>
                <button class="btn btn-primary btn-sm" id="btn-new-stage" style="display:flex; align-items:center; gap:4px">
                  <span class="material-icons-outlined" style="font-size:16px">add</span> Create Stage
                </button>
              </div>
            </div>
            <div class="card-body" style="padding:0">
              <table class="data-table">
                <thead>
                  <tr>
                    <th style="width:40px; padding-left:16px">
                      <input type="checkbox" id="select-all-stages" ${projectJobs.length > 0 && selectedJobIds.length === projectJobs.length ? 'checked' : ''} />
                    </th>
                    <th style="width:100px">Job No.</th>
                    <th>Stage Name</th>
                    <th>Cost Center</th>
                    <th style="width:110px">Status</th>
                    <th style="width:100px; text-align:right">Value</th>
                    <th style="width:100px; text-align:right">Invoiced</th>
                    <th style="width:70px; text-align:right; padding-right:16px">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  ${projectJobs.length === 0 ? `
                    <tr>
                      <td colspan="8" style="text-align:center; padding:48px 16px; color:var(--text-secondary)">
                        No stages configured yet. Link an existing job or create a new stage above.
                      </td>
                    </tr>
                  ` : projectJobs.map(job => {
                    const isSelected = selectedJobIds.includes(job.id);
                    const cc = costCenters.find(c => c.id === job.costCenterId);
                    
                    // Sum stage totals
                    const mSum = (job.materials || []).reduce((s, m) => s + (m.total || 0), 0);
                    const lSum = (job.labor || []).reduce((s, l) => s + (l.total || 0), 0);
                    const stageVal = mSum + lSum;

                    const stageInvs = invoices.filter(inv => inv.jobId === job.id && inv.status !== 'Void');
                    const stageBilled = stageInvs.reduce((s, inv) => s + (inv.total || 0), 0);

                    let statusClass = 'badge-neutral';
                    if (job.status === 'In Progress') statusClass = 'badge-primary';
                    if (job.status === 'Completed') statusClass = 'badge-success';
                    if (job.status === 'Invoiced') statusClass = 'badge-purple';

                    return `
                      <tr>
                        <td style="padding-left:16px">
                          <input type="checkbox" class="select-stage-checkbox" data-id="${job.id}" ${isSelected ? 'checked' : ''} />
                        </td>
                        <td>
                          <a href="#/jobs/${job.id}" style="font-weight:600; color:var(--color-primary); text-decoration:none">${escapeHTML(job.number)}</a>
                        </td>
                        <td>
                          <a href="#/jobs/${job.id}" style="font-weight:700; color:var(--text-primary); text-decoration:none; display:block">${escapeHTML(job.title)}</a>
                        </td>
                        <td>
                          <span style="font-size:12px; font-weight:600; color:var(--text-secondary)">
                            ${cc ? `${escapeHTML(cc.code)} — ${escapeHTML(cc.name)}` : 'Unassigned'}
                          </span>
                        </td>
                        <td>
                          <span class="badge ${statusClass}">${escapeHTML(job.status)}</span>
                        </td>
                        <td style="text-align:right; font-weight:600">$${stageVal.toLocaleString('en-AU', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                        <td style="text-align:right; font-weight:600; color:var(--color-success-dark)">$${stageBilled.toLocaleString('en-AU', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                        <td style="text-align:right; padding-right:16px">
                          <button class="btn btn-ghost btn-sm btn-unlink-stage" data-id="${job.id}" title="Unlink from project" style="color:var(--color-danger); padding:4px">
                            <span class="material-icons-outlined" style="font-size:18px">link_off</span>
                          </button>
                        </td>
                      </tr>
                    `;
                  }).join('')}
                </tbody>
              </table>
            </div>
            ${projectJobs.length > 0 ? `
              <div class="card-footer" style="background:#f9f9fb; padding:12px 16px; display:flex; justify-content:space-between; align-items:center; border-top:1px solid var(--border-color)">
                <span style="font-size:13px; color:var(--text-secondary); font-weight:500">
                  ${selectedJobIds.length} stage(s) selected
                </span>
                <button class="btn btn-primary" id="btn-consolidated-invoice" ${selectedJobIds.length === 0 ? 'disabled' : ''} style="display:flex; align-items:center; gap:6px">
                  <span class="material-icons-outlined" style="font-size:18px">receipt</span> Create Consolidated Invoice
                </button>
              </div>
            ` : ''}
          </div>

          <!-- DESCRIPTION CARD -->
          <div class="card" style="margin:0; box-shadow:var(--shadow-sm)">
            <div class="card-header"><h4>Description &amp; Scope</h4></div>
            <div class="card-body">
              <div style="font-size:14px; line-height:1.6; color:var(--text-primary); white-space:pre-wrap">${escapeHTML(project.description || 'No description provided.')}</div>
              <div style="display:grid; grid-template-columns:1fr 1fr; gap:16px; margin-top:20px; padding-top:20px; border-top:1px solid var(--border-color)">
                <div>
                  <div style="font-size:11px; font-weight:700; color:var(--text-tertiary); text-transform:uppercase; letter-spacing:0.5px">Start Date</div>
                  <div style="font-size:14px; font-weight:600; color:var(--text-primary); margin-top:4px">${project.startDate ? project.startDate : 'Not scheduled'}</div>
                </div>
                <div>
                  <div style="font-size:11px; font-weight:700; color:var(--text-tertiary); text-transform:uppercase; letter-spacing:0.5px">Target Completion</div>
                  <div style="font-size:14px; font-weight:600; color:var(--text-primary); margin-top:4px">${project.endDate ? project.endDate : 'Not scheduled'}</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- RIGHT COLUMN: Metrics and Cost Centers -->
        <div style="display:flex; flex-direction:column; gap:24px">
          <!-- METRICS SUMMARY CARD -->
          <div class="card" style="margin:0; box-shadow:var(--shadow-sm)">
            <div class="card-header"><h4>Financial Summary</h4></div>
            <div class="card-body" style="display:flex; flex-direction:column; gap:16px">
              <div>
                <div style="font-size:11px; font-weight:700; color:var(--text-tertiary); text-transform:uppercase; letter-spacing:0.5px">Project Revenue</div>
                <div style="font-size:24px; font-weight:800; color:var(--text-primary); margin-top:4px">$${metrics.totalValue.toLocaleString('en-AU', { minimumFractionDigits: 2 })}</div>
              </div>
              <div style="display:grid; grid-template-columns:1fr 1fr; gap:16px; padding-top:12px; border-top:1px solid var(--border-color)">
                <div>
                  <div style="font-size:11px; font-weight:700; color:var(--text-tertiary); text-transform:uppercase; letter-spacing:0.5px">Est. Cost</div>
                  <div style="font-size:16px; font-weight:700; color:var(--text-secondary); margin-top:4px">$${metrics.totalCost.toLocaleString('en-AU', { minimumFractionDigits: 2 })}</div>
                </div>
                <div>
                  <div style="font-size:11px; font-weight:700; color:var(--text-tertiary); text-transform:uppercase; letter-spacing:0.5px">Gross Profit</div>
                  <div style="font-size:16px; font-weight:700; color:${metrics.profit >= 0 ? 'var(--color-success-dark)' : 'var(--color-danger)'}; margin-top:4px">
                    $${metrics.profit.toLocaleString('en-AU', { minimumFractionDigits: 2 })}
                  </div>
                  <span style="font-size:11px; color:var(--text-secondary)">Margin: ${metrics.margin.toFixed(1)}%</span>
                </div>
              </div>
              <div style="display:grid; grid-template-columns:1fr 1fr; gap:16px; padding-top:12px; border-top:1px solid var(--border-color)">
                <div>
                  <div style="font-size:11px; font-weight:700; color:var(--text-tertiary); text-transform:uppercase; letter-spacing:0.5px">Invoiced</div>
                  <div style="font-size:16px; font-weight:700; color:var(--text-primary); margin-top:4px">$${metrics.totalBilled.toLocaleString('en-AU', { minimumFractionDigits: 2 })}</div>
                </div>
                <div>
                  <div style="font-size:11px; font-weight:700; color:var(--text-tertiary); text-transform:uppercase; letter-spacing:0.5px">Outstanding</div>
                  <div style="font-size:16px; font-weight:700; color:${metrics.unpaid > 0 ? 'var(--color-warning-dark)' : 'var(--text-secondary)'}; margin-top:4px">$${metrics.unpaid.toLocaleString('en-AU', { minimumFractionDigits: 2 })}</div>
                </div>
              </div>
            </div>
          </div>

          <!-- COST CENTER BREAKDOWN CARD -->
          <div class="card" style="margin:0; box-shadow:var(--shadow-sm)">
            <div class="card-header"><h4>Cost Center Split</h4></div>
            <div class="card-body" style="padding:0">
              <table class="data-table" style="font-size:13px">
                <thead>
                  <tr>
                    <th style="padding-left:16px">Center</th>
                    <th style="text-align:right">Revenue</th>
                    <th style="text-align:right; padding-right:16px">Margin</th>
                  </tr>
                </thead>
                <tbody>
                  ${Object.keys(metrics.costCenterSplit).length === 0 ? `
                    <tr>
                      <td colspan="3" style="text-align:center; padding:16px; color:var(--text-secondary)">No split details.</td>
                    </tr>
                  ` : Object.entries(metrics.costCenterSplit).map(([ccId, ccM]) => {
                    const cc = costCenters.find(c => c.id === ccId);
                    const ccProfit = ccM.value - ccM.cost;
                    const ccMargin = ccM.value > 0 ? (ccProfit / ccM.value) * 100 : 0;
                    return `
                      <tr>
                        <td style="padding-left:16px; font-weight:600">
                          ${cc ? escapeHTML(cc.code) : 'Unassigned'}
                        </td>
                        <td style="text-align:right; font-weight:600">$${ccM.value.toLocaleString('en-AU', { maximumFractionDigits: 0 })}</td>
                        <td style="text-align:right; padding-right:16px; font-weight:700; color:${ccProfit >= 0 ? 'var(--color-success-dark)' : 'var(--color-danger)'}">
                          ${ccMargin.toFixed(0)}%
                        </td>
                      </tr>
                    `;
                  }).join('')}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    `;

    // Hook general actions
    container.querySelector('#btn-edit-project')?.addEventListener('click', () => openEditProjectModal());
    container.querySelector('#btn-delete-project')?.addEventListener('click', () => handleDeleteProject());
    
    // Stage creations & links
    container.querySelector('#btn-new-stage')?.addEventListener('click', () => {
      router.navigate(`/jobs/new?projectId=${project.id}&customerId=${project.customerId}`);
    });
    container.querySelector('#btn-add-existing-stage')?.addEventListener('click', () => openLinkStageModal());

    // Table checkbox hooks
    container.querySelector('#select-all-stages')?.addEventListener('change', (e) => {
      if (e.target.checked) {
        selectedJobIds = projectJobs.map(j => j.id);
      } else {
        selectedJobIds = [];
      }
      render();
    });

    container.querySelectorAll('.select-stage-checkbox').forEach(chk => {
      chk.addEventListener('change', (e) => {
        const jobId = e.target.dataset.id;
        if (e.target.checked) {
          if (!selectedJobIds.includes(jobId)) selectedJobIds.push(jobId);
        } else {
          selectedJobIds = selectedJobIds.filter(id => id !== jobId);
        }
        render();
      });
    });

    container.querySelectorAll('.btn-unlink-stage').forEach(btn => {
      btn.addEventListener('click', async (e) => {
        const jobId = e.currentTarget.dataset.id;
        const job = store.getById('jobs', jobId);
        if (job) {
          if (confirm(`Are you sure you want to unlink Stage "${job.title}" from this project?`)) {
            await store.update('jobs', jobId, { projectId: null });
            showToast('Stage unlinked successfully', 'success');
            renderProjectDetail(container, params);
          }
        }
      });
    });

    // Invoicing triggers
    container.querySelector('#btn-consolidated-invoice')?.addEventListener('click', () => generateConsolidatedInvoice());
  };

  const openEditProjectModal = () => {
    const modalContent = document.createElement('div');
    modalContent.innerHTML = `
      <div class="form-group" style="margin-bottom:16px">
        <label class="form-label" style="display:block; margin-bottom:6px">Project Name <span style="color:var(--color-danger)">*</span></label>
        <input class="form-input" id="p-name" value="${escapeHTML(project.name)}" style="width:100%" />
      </div>
      <div class="form-group" style="margin-bottom:16px">
        <label class="form-label" style="display:block; margin-bottom:6px">Status</label>
        <select class="form-select" id="p-status" style="width:100%">
          <option value="In Progress" ${project.status === 'In Progress' ? 'selected' : ''}>In Progress</option>
          <option value="Completed" ${project.status === 'Completed' ? 'selected' : ''}>Completed</option>
          <option value="Cancelled" ${project.status === 'Cancelled' ? 'selected' : ''}>Cancelled</option>
        </select>
      </div>
      <div class="form-group" style="margin-bottom:16px">
        <label class="form-label" style="display:block; margin-bottom:6px">Description</label>
        <textarea class="form-textarea" id="p-desc" rows="3" style="width:100%">${escapeHTML(project.description || '')}</textarea>
      </div>
      <div class="form-row" style="display:grid; grid-template-columns:1fr 1fr; gap:16px; margin-bottom:16px">
        <div class="form-group">
          <label class="form-label" style="display:block; margin-bottom:6px">Start Date</label>
          <input type="date" class="form-input" id="p-start-date" value="${project.startDate || ''}" style="width:100%" />
        </div>
        <div class="form-group">
          <label class="form-label" style="display:block; margin-bottom:6px">End Date (Target)</label>
          <input type="date" class="form-input" id="p-end-date" value="${project.endDate || ''}" style="width:100%" />
        </div>
      </div>
    `;

    showModal({
      title: 'Edit Project Details',
      content: modalContent,
      actions: [
        { label: 'Cancel', className: 'btn-secondary', onClick: c => c() },
        { label: 'Save Changes', className: 'btn-primary btn-save-proj', onClick: async (c) => {
          const name = document.getElementById('p-name').value.trim();
          const status = document.getElementById('p-status').value;
          const description = document.getElementById('p-desc').value.trim();
          const startDate = document.getElementById('p-start-date').value;
          const endDate = document.getElementById('p-end-date').value;

          if (!name) { showToast('Project Name is required', 'error'); return; }

          try {
            await store.update('projects', project.id, { name, status, description, startDate, endDate });
            showToast('Project details updated', 'success');
            c();
            renderProjectDetail(container, params);
          } catch (err) {
            console.error('Error saving project:', err);
            showToast('Failed to save project details', 'error');
          }
        }}
      ]
    });
  };

  const handleDeleteProject = () => {
    if (confirm(`Are you sure you want to delete Project "${project.name}"?\nAssociated stages (jobs) will NOT be deleted, but they will be unlinked.`)) {
      try {
        // Unlink all jobs first
        projectJobs.forEach(async (job) => {
          await store.update('jobs', job.id, { projectId: null });
        });
        store.delete('projects', project.id);
        showToast('Project deleted successfully', 'success');
        router.navigate('/projects');
      } catch (err) {
        console.error(err);
        showToast('Failed to delete project', 'error');
      }
    }
  };

  const openLinkStageModal = () => {
    // Find jobs for this customer that don't have a projectId
    const unlinkedJobs = jobs.filter(j => j.customerId === project.customerId && !j.projectId);

    const modalContent = document.createElement('div');
    modalContent.innerHTML = `
      <div class="form-group" style="margin-bottom:16px">
        <label class="form-label" style="display:block; margin-bottom:6px">Select Job to Link <span style="color:var(--color-danger)">*</span></label>
        <select class="form-select" id="link-job-select" style="width:100%">
          <option value="">-- Select Job --</option>
          ${unlinkedJobs.map(j => `
            <option value="${j.id}">${escapeHTML(j.number)} — ${escapeHTML(j.title)} (${escapeHTML(j.status)})</option>
          `).join('')}
        </select>
      </div>
      <div style="font-size:12px; color:var(--text-secondary); line-height:1.5">
        Only unlinked jobs belonging to <strong>${escapeHTML(project.customerName)}</strong> are listed.
      </div>
    `;

    showModal({
      title: 'Link Job as Project Stage',
      content: modalContent,
      actions: [
        { label: 'Cancel', className: 'btn-secondary', onClick: c => c() },
        { label: 'Link Job', className: 'btn-primary btn-save-link', onClick: async (c) => {
          const jobId = document.getElementById('link-job-select').value;
          if (!jobId) { showToast('Please select a job', 'error'); return; }

          try {
            await store.update('jobs', jobId, { projectId: project.id });
            showToast('Job linked to project successfully', 'success');
            c();
            renderProjectDetail(container, params);
          } catch (err) {
            console.error('Error linking job:', err);
            showToast('Failed to link job', 'error');
          }
        }}
      ]
    });
  };

  const generateConsolidatedInvoice = async () => {
    if (selectedJobIds.length === 0) {
      showToast('No stages selected for invoicing', 'error');
      return;
    }

    const settings = store.getSettings();
    const sections = [];
    let invoiceSubtotal = 0;

    // Get selected jobs
    const selectedJobs = jobs.filter(j => selectedJobIds.includes(j.id));
    
    // Check if there is anything billable
    let hasBillableItems = false;

    selectedJobs.forEach(job => {
      const lineItems = [];
      
      // Calculate stage tasks labor
      const totalHours = (job.tasks || []).reduce((sum, t) => {
        // If task has bookings/timesheets, sum hours, otherwise 0
        const bookings = store.getAll('timesheets') || [];
        const taskBookings = bookings.filter(b => b.jobId === job.id && b.taskId === t.id);
        const bookedHrs = taskBookings.reduce((s, b) => s + parseFloat(b.hours || 0), 0);
        return sum + bookedHrs;
      }, 0);

      const defaultLaborRateObj = settings.laborRates.find(r => r.isDefault) || settings.laborRates[0];
      const rate = defaultLaborRateObj ? defaultLaborRateObj.rate : 145;
      const rateName = defaultLaborRateObj ? defaultLaborRateObj.name : 'Labour';

      if (totalHours > 0) {
        lineItems.push({
          id: store.generateId(),
          description: `${rateName} (${totalHours.toFixed(2)} hrs)`,
          type: 'labor',
          qty: totalHours,
          rate: rate,
          total: totalHours * rate
        });
      } else {
        // If no booked timesheet hours, check if there's a budgeted/estimated labor hours in the job form
        // Or if we can find default job labor
        if (job.labor && job.labor.length > 0) {
          job.labor.forEach(l => {
            lineItems.push({
              id: store.generateId(),
              description: l.name || 'Labour Services',
              type: 'labor',
              qty: l.hours || 1,
              rate: l.rate || rate,
              total: (l.hours || 1) * (l.rate || rate)
            });
          });
        }
      }

      // Add materials
      if (job.materials && job.materials.length > 0) {
        job.materials.forEach(m => {
          // calculate billable price based on cost + default settings markup
          const defaultPercent = settings.materialMarkup?.defaultPercent || 30;
          const unitPrice = m.price || m.unitCost * (1 + defaultPercent / 100);
          lineItems.push({
            id: store.generateId(),
            description: m.name,
            type: 'material',
            qty: m.qty || m.quantity || 1,
            rate: unitPrice,
            total: (m.qty || m.quantity || 1) * unitPrice
          });
        });
      }

      if (lineItems.length > 0) {
        hasBillableItems = true;
        const sectionSubtotal = lineItems.reduce((s, item) => s + (item.total || 0), 0);
        invoiceSubtotal += sectionSubtotal;
        
        sections.push({
          id: store.generateId(),
          name: `${job.number} — ${job.title}`,
          lineItems: lineItems,
          subtotal: sectionSubtotal
        });
      }
    });

    if (!hasBillableItems) {
      showToast('Selected stages do not have any billable materials or labor configurations', 'warning');
      return;
    }

    try {
      if (confirm(`Generate a single consolidated invoice of $${invoiceSubtotal.toLocaleString('en-AU', { minimumFractionDigits: 2 })} for ${selectedJobs.length} selected stages?`)) {
        // Create consolidated invoice
        const inv = await store.create('invoices', {
          number: store.getNextNumber('INV-', 'invoices'),
          invoiceType: 'Consolidated',
          customerId: project.customerId,
          customerName: project.customerName,
          title: `Consolidated Project Billing — ${project.name}`,
          status: 'Draft',
          sections: sections,
          subtotal: invoiceSubtotal,
          tax: invoiceSubtotal * store.getTaxRate(),
          total: invoiceSubtotal * (1 + store.getTaxRate()),
          issueDate: new Date().toISOString(),
          dueDate: new Date(Date.now() + 30 * 86400000).toISOString(),
          notes: `Consolidated milestone billing for Project ${project.number} stages: ${selectedJobs.map(j => j.number).join(', ')}.`
        });

        // Update selected jobs status to Invoiced
        for (const job of selectedJobs) {
          await store.update('jobs', job.id, { status: 'Invoiced' });
        }

        showToast('Consolidated Invoice generated successfully', 'success');
        router.navigate(`/invoices/${inv.id}`);
      }
    } catch (err) {
      console.error('Error generating consolidated invoice:', err);
      showToast('Failed to generate consolidated invoice', 'error');
    }
  };

  render();
}
