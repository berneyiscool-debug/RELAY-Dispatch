import { store } from '../../data/store.js';
import { router } from '../../router.js';
import { escapeHTML } from '../../utils/security.js';
import { showModal } from '../../components/Modal.js';
import { showToast } from '../../components/Notifications.js';
import { updateBreadcrumbDetail } from '../../components/Breadcrumb.js';
import { renderDetailHeader } from '../../components/DetailHeader.js';
import { showDrawer } from '../../components/Drawer.js';
import { getContractorCompliance, getDocStatus } from '../../utils/compliance.js';

export function renderContractorDetail(container, params) {
  const contractor = store.getById('contractors', params.id);
  if (!contractor) {
    container.innerHTML = `<div class="empty-state"><span class="material-icons-outlined">error</span><h3>Contractor not found</h3></div>`;
    return;
  }

  // Self-healing check for contractor portal magic link token
  if (!contractor.portalToken) {
    const generatedToken = 'c_pt_' + Math.random().toString(36).substr(2, 9) + Date.now().toString(36).substr(-4);
    store.update('contractors', contractor.id, { portalToken: generatedToken });
    contractor.portalToken = generatedToken;
  }

  updateBreadcrumbDetail(contractor.businessName);

  const jobs = store.getAll('jobs').filter(j => j.contractorId === params.id);

  // Scan and compile task allocations where this contractor is assigned
  const allJobs = store.getAll('jobs');
  const taskAllocations = [];

  function findTaskAllocations(tasks, job, path = []) {
    if (!tasks) return;
    tasks.forEach((task, idx) => {
      const currentPath = [...path, idx];
      const assignedIds = task.assignedContractorIds || [];
      if (assignedIds.includes(params.id) || task.assignedContractorId === params.id) {
        taskAllocations.push({
          jobId: job.id,
          jobNumber: job.number,
          jobTitle: job.title,
          jobStatus: job.status,
          taskId: task.id,
          taskName: task.name,
          taskStatus: task.status || 'Not Started',
          taskProgress: task.progress || 0,
          taskEstimatedHours: task.estimatedHours || 0,
          taskStartDate: task.startDate,
          path: currentPath,
          isList: task.subTasks && task.subTasks.length > 0
        });
      }
      if (task.subTasks && task.subTasks.length > 0) {
        findTaskAllocations(task.subTasks, job, currentPath);
      }
    });
  }

  allJobs.forEach(job => {
    if (job.tasks) {
      findTaskAllocations(job.tasks, job);
    }
  });

  let activeTab = 'details';

  function render() {
    const compliance = getContractorCompliance(contractor);

    container.innerHTML = `
      ${renderDetailHeader({
        title: escapeHTML(contractor.businessName),
        icon: 'engineering',
        iconBgColor: 'var(--color-primary-light)',
        iconTextColor: 'var(--color-primary)',
        metaHtml: `
          <span><span class="material-icons-outlined" style="font-size:14px">person</span> ${escapeHTML(contractor.contactName)}</span>
          <span><span class="material-icons-outlined" style="font-size:14px">email</span> ${escapeHTML(contractor.email || '—')}</span>
          <span><span class="material-icons-outlined" style="font-size:14px">phone</span> ${escapeHTML(contractor.phone || '—')}</span>
          <span class="badge ${compliance.badgeClass}" title="${escapeHTML(compliance.reason || compliance.label)}" style="cursor:help">
            Compliance: ${escapeHTML(compliance.label)}
          </span>
          <span class="badge ${contractor.active ? 'badge-success' : 'badge-neutral'}">${contractor.active ? 'Active' : 'Inactive'}</span>
        `,
        actionsHtml: `
          <button class="btn btn-secondary" id="btn-edit-contractor">
            <span class="material-icons-outlined">edit</span> Edit
          </button>
          <button class="btn btn-danger" id="btn-delete-contractor">
            <span class="material-icons-outlined">delete</span> Delete
          </button>
        `
      })}

      <div class="tabs" id="contractor-tabs">
        <button class="tab ${activeTab === 'details' ? 'active' : ''}" data-tab="details">Overview & Details</button>
        <button class="tab ${activeTab === 'compliance' ? 'active' : ''}" data-tab="compliance">Compliance Registry (${(contractor.complianceDocs || []).length})</button>
        <button class="tab ${activeTab === 'rates' ? 'active' : ''}" data-tab="rates">Financials & Rates</button>
        <button class="tab ${activeTab === 'tasks' ? 'active' : ''}" data-tab="tasks">Task Allocations (${taskAllocations.length})</button>
      </div>

      <div class="tab-content" id="tab-content" style="margin-top: var(--space-base);"></div>
    `;

    renderTabContent();

    // Tab switching
    container.querySelectorAll('.tab').forEach(tab => {
      tab.addEventListener('click', () => {
        activeTab = tab.dataset.tab;
        container.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
        tab.classList.add('active');
        renderTabContent();
      });
    });

    // Edit
    container.querySelector('#btn-edit-contractor').addEventListener('click', () => {
      router.navigate(`/contractors/${params.id}/edit`);
    });

    // Delete
    container.querySelector('#btn-delete-contractor').addEventListener('click', () => {
      const content = document.createElement('div');
      content.innerHTML = `<p>Are you sure you want to delete <strong>${escapeHTML(contractor.businessName)}</strong>? This action cannot be undone.</p>`;
      showModal({
        title: 'Delete Contractor',
        content,
        actions: [
          { label: 'Cancel', className: 'btn-secondary', onClick: (close) => close() },
          { label: 'Delete', className: 'btn-danger', onClick: (close) => {
            store.delete('contractors', params.id);
            showToast('Contractor deleted successfully', 'success');
            close();
            router.navigate('/contractors');
          }},
        ],
      });
    });
  }

  function renderTabContent() {
    const tabContent = container.querySelector('#tab-content');
    if (!tabContent) return;

    if (activeTab === 'details') {
      const specialties = contractor.specialties || [];
      tabContent.innerHTML = `
        <div class="card">
          <div class="card-body">
            <div class="grid-2">
              <div>
                <h4 style="margin-bottom:var(--space-base)">Business & Contact Details</h4>
                <div style="display:flex;flex-direction:column;gap:12px">
                  ${detailRow('Business Name', contractor.businessName)}
                  ${detailRow('Contact Name', contractor.contactName)}
                  ${detailRow('Email Address', contractor.email || 'Not set')}
                  ${detailRow('Phone Number', contractor.phone || 'Not set')}
                  ${detailRow('Trade License No.', contractor.licenseNumber || 'Not set')}
                  ${detailRow('System Status', contractor.active ? 'Active (Ready for dispatch)' : 'Inactive (Do not dispatch)')}
                </div>
              </div>
              <div>
                <h4 style="margin-bottom:var(--space-base)">Specialties & Trade Skills</h4>
                <div style="margin-bottom:var(--space-lg); display: flex; flex-wrap: wrap; gap: 6px;">
                  ${specialties.map(s => `<span class="badge" style="background:var(--color-primary-light); color:var(--color-primary); font-weight:600;">${escapeHTML(s)}</span>`).join('')}
                  ${specialties.length === 0 ? '<span class="text-secondary">No trade specialties listed. Click Edit to add.</span>' : ''}
                </div>

                <h4 style="margin-bottom:var(--space-base)">Administrative Notes</h4>
                <div style="background:var(--card-bg-secondary, #f8fafc); border: 1px solid var(--border-color); padding: 12px; border-radius: 6px; font-size:var(--font-size-sm); color:var(--text-secondary); line-height: 1.5; white-space: pre-wrap;">${escapeHTML(contractor.notes || 'No administrative notes recorded for this contractor.')}</div>
              </div>
            </div>
          </div>
        </div>

        <div class="card" style="margin-top: var(--space-lg); border: 1px solid var(--color-primary-light); background: linear-gradient(135deg, white, rgba(27,109,224,0.015));">
          <div class="card-header" style="border-bottom: 1px solid var(--border-color); display:flex; align-items:center; gap:8px;">
            <span class="material-icons-outlined text-primary" style="font-size:20px;">vpn_key</span>
            <h4 style="margin:0; font-size:14px; font-weight:600;">Subcontractor Access Portal</h4>
          </div>
          <div class="card-body">
            <p class="text-secondary" style="font-size: var(--font-size-sm); margin:0 0 12px 0; line-height:1.5;">
              Share this secure magic link with the subcontractor. They will be able to view their assigned tasks, slide progress updates, leave site comments, and upload compliance documents without needing a password.
            </p>
            <div style="display:flex; gap: var(--space-sm); align-items:center;">
              <input type="text" readonly id="magic-link-url" class="form-input" style="flex:1; font-family:monospace; background: var(--content-bg); font-size:13px; color:var(--text-secondary);" value="${window.location.origin}${window.location.pathname}#/contractor-portal/${contractor.portalToken}" />
              <button class="btn btn-primary btn-sm" id="btn-copy-magic-link" style="display:flex; align-items:center; gap:6px; height: 32px;">
                <span class="material-icons-outlined" style="font-size:16px">content_copy</span> Copy Magic Link
              </button>
            </div>
          </div>
        </div>
      `;

      // Copy magic link clipboard click handler
      const copyBtn = tabContent.querySelector('#btn-copy-magic-link');
      if (copyBtn) {
        copyBtn.addEventListener('click', () => {
          const urlInput = tabContent.querySelector('#magic-link-url');
          if (urlInput) {
            navigator.clipboard.writeText(urlInput.value).then(() => {
              showToast('Magic link copied to clipboard!', 'success');
            }).catch(() => {
              showToast('Failed to copy link', 'error');
            });
          }
        });
      }
    } else if (activeTab === 'compliance') {
      const docs = contractor.complianceDocs || [];
      tabContent.innerHTML = `
        <div class="card">
          <div class="card-header" style="display:flex; justify-content:space-between; align-items:center; padding: 12px 20px;">
            <h4 style="margin:0">Credentials & Certificates Registry</h4>
            <button class="btn btn-primary btn-sm" id="btn-add-doc">
              <span class="material-icons-outlined">add</span> Add Certificate
            </button>
          </div>
          <div class="card-body" style="padding:0">
            <table class="data-table">
              <thead>
                <tr>
                  <th>Credential Type</th>
                  <th>Policy / License No.</th>
                  <th>Expiry Date</th>
                  <th>Document Status</th>
                  <th>Verified?</th>
                  <th style="width:100px; text-align:right">Actions</th>
                </tr>
              </thead>
              <tbody>
                ${docs.map((doc, idx) => {
                  const stat = getDocStatus(doc);
                  return `
                    <tr>
                      <td class="font-medium">
                        <div>${escapeHTML(doc.type)}</div>
                        ${doc.fileData ? `
                          <div style="margin-top:4px;">
                            <a href="${doc.fileData}" download="${doc.fileName}" target="_blank" class="text-primary" style="font-size:11px; font-weight:600; display:inline-flex; align-items:center; gap:4px; text-decoration:none;">
                              <span class="material-icons-outlined" style="font-size:14px">attachment</span> ${escapeHTML(doc.fileName)}
                            </a>
                          </div>
                        ` : ''}
                      </td>
                      <td style="font-family:monospace" class="text-secondary">${escapeHTML(doc.number || '—')}</td>
                      <td>${doc.expiryDate ? new Date(doc.expiryDate).toLocaleDateString('en-AU') : '—'}</td>
                      <td><span class="badge ${stat.colorClass}">${escapeHTML(stat.label)}</span></td>
                      <td>
                        <button class="btn btn-ghost btn-sm btn-toggle-verify" data-id="${doc.id}" style="padding: 2px 6px;">
                          ${doc.verified ? 
                            `<span class="material-icons-outlined text-success" style="font-size:18px">check_circle</span> <span class="text-success" style="font-size:12px;font-weight:600">Verified</span>` : 
                            `<span class="material-icons-outlined text-tertiary" style="font-size:18px">radio_button_unchecked</span> <span class="text-tertiary" style="font-size:12px">Click to verify</span>`
                          }
                        </button>
                      </td>
                      <td style="text-align:right">
                        <button class="btn btn-icon btn-sm btn-ghost btn-delete-doc text-danger" data-id="${doc.id}">
                          <span class="material-icons-outlined">delete</span>
                        </button>
                      </td>
                    </tr>
                  `;
                }).join('')}
                ${docs.length === 0 ? '<tr><td colspan="6" style="text-align:center;padding:32px" class="text-secondary">No credentials or certificates uploaded.</td></tr>' : ''}
              </tbody>
            </table>
          </div>
        </div>
      `;

      // Wire verification toggle
      tabContent.querySelectorAll('.btn-toggle-verify').forEach(btn => {
        btn.addEventListener('click', () => {
          const docId = btn.dataset.id;
          const updatedDocs = docs.map(d => d.id === docId ? { ...d, verified: !d.verified } : d);
          store.update('contractors', contractor.id, { complianceDocs: updatedDocs });
          contractor.complianceDocs = updatedDocs;
          showToast('Certificate verification status updated', 'success');
          render();
        });
      });

      // Wire delete document
      tabContent.querySelectorAll('.btn-delete-doc').forEach(btn => {
        btn.addEventListener('click', () => {
          const docId = btn.dataset.id;
          const content = document.createElement('div');
          content.innerHTML = `<p>Are you sure you want to delete this compliance certificate? This cannot be undone.</p>`;
          showModal({
            title: 'Delete Certificate',
            content,
            actions: [
              { label: 'Cancel', className: 'btn-secondary', onClick: c => c() },
              { label: 'Delete', className: 'btn-danger', onClick: c => {
                const updatedDocs = docs.filter(d => d.id !== docId);
                store.update('contractors', contractor.id, { complianceDocs: updatedDocs });
                contractor.complianceDocs = updatedDocs;
                showToast('Certificate deleted', 'success');
                c();
                render();
              }}
            ]
          });
        });
      });

      // Wire Add Credential button
      tabContent.querySelector('#btn-add-doc').addEventListener('click', () => {
        const formHtml = `
          <div class="form-group" style="margin-bottom: 12px;">
            <label class="form-label">Certificate Type *</label>
            <select id="new-doc-type" class="form-select">
              <option value="Public Liability Insurance">Public Liability Insurance</option>
              <option value="Workers Compensation">Workers Compensation</option>
              <option value="Trade License">Trade License</option>
              <option value="White Card">White Card (Safety Induction)</option>
              <option value="Other Certification">Other Certification</option>
            </select>
          </div>
          <div class="form-group" style="margin-bottom: 12px;">
            <label class="form-label">Policy / License Number *</label>
            <input type="text" id="new-doc-number" class="form-input" placeholder="e.g. PL-99201" required />
          </div>
          <div class="form-group" style="margin-bottom: 12px;">
            <label class="form-label">Expiry Date *</label>
            <input type="date" id="new-doc-expiry" class="form-input" required />
          </div>
          <div class="form-group" style="margin-bottom: 12px;">
            <label class="form-label">Notes</label>
            <textarea id="new-doc-notes" class="form-input" rows="3" placeholder="Additional coverage notes..."></textarea>
          </div>
        `;

        showDrawer({
          title: 'Add Credential',
          content: formHtml,
          actions: [
            { label: 'Cancel', className: 'btn-secondary', onClick: close => close() },
            { label: 'Save Credential', className: 'btn-primary', onClick: close => {
              const drawerOverlay = document.querySelector('.drawer-overlay');
              const type = drawerOverlay.querySelector('#new-doc-type').value;
              const number = drawerOverlay.querySelector('#new-doc-number').value.trim();
              const expiryDate = drawerOverlay.querySelector('#new-doc-expiry').value;
              const notes = drawerOverlay.querySelector('#new-doc-notes').value.trim();

              if (!number || !expiryDate) {
                showToast('Please fill in all required fields', 'error');
                return;
              }

              const newCredential = {
                id: Date.now().toString(36) + Math.random().toString(36).substr(2, 5),
                type,
                number,
                expiryDate,
                verified: false,
                notes
              };

              const updatedDocs = [...docs, newCredential];
              store.update('contractors', contractor.id, { complianceDocs: updatedDocs });
              contractor.complianceDocs = updatedDocs;
              showToast('Credential added to registry', 'success');
              close();
              render();
            }}
          ]
        });
      });
    } else if (activeTab === 'rates') {
      const hRate = contractor.hourlyRate || 0.00;
      const ahRate = contractor.afterHoursRate || 0.00;
      const cFee = contractor.calloutFee || 0.00;

      tabContent.innerHTML = `
        <div class="grid-2">
          <div class="card">
            <div class="card-header">
              <h4 style="margin:0">Contractor Pay Rates</h4>
            </div>
            <div class="card-body" style="display:flex; flex-direction:column; gap:16px;">
              <div style="display:flex; justify-content:space-between; align-items:center; border-bottom: 1px solid var(--border-color); padding-bottom:8px">
                <div>
                  <strong>Standard Hourly Rate</strong>
                  <p class="text-secondary" style="font-size:12px; margin:2px 0 0 0">Applicable for normal business hours Mon–Fri</p>
                </div>
                <div class="font-semibold" style="font-size:18px; color:var(--color-primary)">$${hRate.toFixed(2)}/hr</div>
              </div>
              <div style="display:flex; justify-content:space-between; align-items:center; border-bottom: 1px solid var(--border-color); padding-bottom:8px">
                <div>
                  <strong>After Hours Hourly Rate</strong>
                  <p class="text-secondary" style="font-size:12px; margin:2px 0 0 0">Applicable for weekends, nights, and public holidays</p>
                </div>
                <div class="font-semibold" style="font-size:18px; color:var(--color-primary)">$${ahRate.toFixed(2)}/hr</div>
              </div>
              <div style="display:flex; justify-content:space-between; align-items:center; padding-bottom:4px">
                <div>
                  <strong>Call-out / Mobilisation Fee</strong>
                  <p class="text-secondary" style="font-size:12px; margin:2px 0 0 0">Flat fee applied per job dispatch</p>
                </div>
                <div class="font-semibold" style="font-size:18px; color:var(--color-primary)">$${cFee.toFixed(2)}</div>
              </div>
            </div>
          </div>

          <div class="card">
            <div class="card-header">
              <h4 style="margin:0">Interactive Labor Cost Estimator</h4>
            </div>
            <div class="card-body">
              <div style="display:flex; flex-direction:column; gap:12px;">
                <p class="text-secondary" style="font-size:13px; margin:0 0 8px 0">Quickly estimate this contractor's billing for an upcoming work order allocation.</p>
                <div class="form-group">
                  <label class="form-label" style="font-size:12px">Estimated Hours</label>
                  <input type="number" id="calc-hours" class="form-input" value="8" min="0" step="0.5" />
                </div>
                <div class="form-group">
                  <label class="form-label" style="font-size:12px">Rate Type</label>
                  <select id="calc-rate-type" class="form-select">
                    <option value="standard">Standard Hourly ($${hRate.toFixed(2)})</option>
                    <option value="afterhours">After Hours ($${ahRate.toFixed(2)})</option>
                  </select>
                </div>
                <div class="form-group" style="display:flex; align-items:center; gap:8px;">
                  <input type="checkbox" id="calc-callout" checked />
                  <label for="calc-callout" class="form-label" style="margin:0; font-size:12px">Include Mobilisation Call-out Fee ($${cFee.toFixed(2)})</label>
                </div>

                <div style="background:var(--color-primary-light); color:var(--color-primary); padding: 15px; border-radius:6px; margin-top:12px; display:flex; justify-content:space-between; align-items:center;">
                  <div>
                    <strong style="display:block; font-size:12px; text-transform:uppercase; letter-spacing:0.5px">Estimated Total Billing</strong>
                    <span style="font-size:13px; opacity:0.8" id="calc-formula">8 hrs × $${hRate.toFixed(2)} + $${cFee.toFixed(2)}</span>
                  </div>
                  <div class="font-bold" style="font-size:24px" id="calc-total">$${(8 * hRate + cFee).toFixed(2)}</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      `;

      // Cost calculator wire-up
      const calcHours = tabContent.querySelector('#calc-hours');
      const calcRateType = tabContent.querySelector('#calc-rate-type');
      const calcCallout = tabContent.querySelector('#calc-callout');
      const calcFormula = tabContent.querySelector('#calc-formula');
      const calcTotal = tabContent.querySelector('#calc-total');

      function updateCalculation() {
        const hours = parseFloat(calcHours.value) || 0;
        const rate = calcRateType.value === 'standard' ? hRate : ahRate;
        const callout = calcCallout.checked ? cFee : 0;

        const total = (hours * rate) + callout;
        calcTotal.textContent = `$${total.toFixed(2)}`;
        
        const rateLabel = calcRateType.value === 'standard' ? `$${hRate.toFixed(2)}` : `$${ahRate.toFixed(2)}`;
        const calloutLabel = calcCallout.checked ? ` + $${cFee.toFixed(2)}` : '';
        calcFormula.textContent = `${hours} hrs × ${rateLabel}${calloutLabel}`;
      }

      if (calcHours && calcRateType && calcCallout) {
        calcHours.addEventListener('input', updateCalculation);
        calcHours.addEventListener('change', updateCalculation);
        calcRateType.addEventListener('change', updateCalculation);
        calcCallout.addEventListener('change', updateCalculation);
      }
    } else if (activeTab === 'tasks') {
      tabContent.innerHTML = `
        <div class="card">
          <div class="card-header">
            <h4 style="margin:0">Task Allocations & Subcontractor Deliverables</h4>
          </div>
          <div class="card-body" style="padding:0">
            <table class="data-table">
              <thead>
                <tr>
                  <th>Job #</th>
                  <th>Job Title</th>
                  <th>Task / Tasklist Name</th>
                  <th>Type</th>
                  <th>Start Date</th>
                  <th>Est. Hours</th>
                  <th>Status & Progress</th>
                </tr>
              </thead>
              <tbody>
                ${taskAllocations.map(alloc => {
                  const statusClasses = {
                    'Completed': 'badge-success',
                    'In Progress': 'badge-primary',
                    'Not Started': 'badge-neutral'
                  };

                  return `
                    <tr style="cursor:pointer" onclick="window.location.hash='#/jobs/${alloc.jobId}'" title="Click to view Job Tasklist">
                      <td class="font-medium cell-link">${escapeHTML(alloc.jobNumber)}</td>
                      <td>${escapeHTML(alloc.jobTitle)}</td>
                      <td class="font-semibold">${escapeHTML(alloc.taskName)}</td>
                      <td>
                        <span class="badge" style="${alloc.isList ? 'background:var(--color-primary-light); color:var(--color-primary)' : 'background:var(--bg-color); border:1px solid var(--border-color); color:var(--text-secondary)'}">
                          ${alloc.isList ? 'Tasklist' : 'Task'}
                        </span>
                      </td>
                      <td>${alloc.taskStartDate ? new Date(alloc.taskStartDate).toLocaleDateString('en-AU') : '—'}</td>
                      <td>${alloc.taskEstimatedHours || '—'} hrs</td>
                      <td>
                        <div style="display:flex; align-items:center; gap:8px">
                          <span class="badge ${statusClasses[alloc.taskStatus] || 'badge-neutral'}" style="margin:0">${escapeHTML(alloc.taskStatus)}</span>
                          <div style="width:60px; background:var(--border-color); height:12px; border-radius:6px; overflow:hidden; position:relative; display:inline-block" title="${alloc.taskProgress}% completed">
                            <div style="width:${alloc.taskProgress}%; background:var(--color-primary); height:100%"></div>
                          </div>
                          <span style="font-size:11px; font-weight:600; color:var(--text-secondary)">${alloc.taskProgress}%</span>
                        </div>
                      </td>
                    </tr>
                  `;
                }).join('')}
                ${taskAllocations.length === 0 ? '<tr><td colspan="7" style="text-align:center;padding:32px" class="text-secondary">No task-level allocations dispatched to this subcontractor.</td></tr>' : ''}
              </tbody>
            </table>
          </div>
        </div>
      `;
    }
  }

  function detailRow(label, value) {
    return `
      <div style="display:flex;gap:8px; border-bottom: 1px solid var(--border-color); padding-bottom: 8px;">
        <span style="width:140px;font-size:var(--font-size-sm);color:var(--text-tertiary);font-weight:500">${escapeHTML(label)}</span>
        <span style="font-size:var(--font-size-base); font-weight:500;">${escapeHTML(String(value))}</span>
      </div>
    `;
  }

  render();
}
