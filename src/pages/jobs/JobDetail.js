// ============================================
// SIMPRO CLONE — JOB DETAIL PAGE
// ============================================

import { store } from '../../data/store.js';
import { router } from '../../router.js';
import { showModal } from '../../components/Modal.js';
import { showToast } from '../../components/Notifications.js';
import { updateBreadcrumbDetail } from '../../components/Breadcrumb.js';

export function renderJobDetail(container, { id }) {
  const job = store.getById('jobs', id);
  if (!job) {
    container.innerHTML = '<div class="empty-state"><span class="material-icons-outlined">error</span><h3>Job not found</h3></div>';
    return;
  }

  updateBreadcrumbDetail(job.number);

  const sb = { 'Pending':'badge-warning','Scheduled':'badge-info','In Progress':'badge-primary','On Hold':'badge-neutral','Completed':'badge-success','Invoiced':'badge-primary' };
  const pb = { 'Low':'badge-neutral','Medium':'badge-warning','High':'badge-danger','Urgent':'badge-danger' };
  let activeTab = 'overview';

  function render() {
    const totalCost = (job.laborCost || 0) + (job.materialCost || 0);

    container.innerHTML = `
      <div class="detail-header">
        <div class="detail-header-info">
          <div class="detail-header-icon" style="background:var(--color-primary-light);color:var(--color-primary)">
            <span class="material-icons-outlined">build</span>
          </div>
          <div>
            <div class="detail-header-text"><h2>${job.number} — ${job.title}</h2></div>
            <div class="detail-header-meta">
              <span><span class="material-icons-outlined" style="font-size:14px">business</span> ${job.customerName}</span>
              <span><span class="material-icons-outlined" style="font-size:14px">person</span> ${job.technicianName || 'Unassigned'}</span>
              <span class="badge ${sb[job.status] || 'badge-neutral'}">${job.status}</span>
              <span class="badge ${pb[job.priority] || 'badge-neutral'}">${job.priority}</span>
            </div>
          </div>
        </div>
        <div class="flex gap-sm">
          <!-- Moved invoice creation to Invoices tab -->
          <button class="btn btn-secondary" id="btn-edit-job"><span class="material-icons-outlined">edit</span> Edit</button>
          <button class="btn btn-danger btn-icon" id="btn-delete-job"><span class="material-icons-outlined">delete</span></button>
        </div>
      </div>

      <div class="tabs" id="job-tabs" style="flex-wrap:wrap">
        <button class="tab ${activeTab === 'overview' ? 'active' : ''}" data-tab="overview">Overview</button>
        <button class="tab ${activeTab === 'phases' ? 'active' : ''}" data-tab="phases">Phases</button>
        <button class="tab ${activeTab === 'costs' ? 'active' : ''}" data-tab="costs">Costs</button>
        <button class="tab ${activeTab === 'forms' ? 'active' : ''}" data-tab="forms">Forms</button>
        <button class="tab ${activeTab === 'pos' ? 'active' : ''}" data-tab="pos">POs</button>
        <button class="tab ${activeTab === 'activity' ? 'active' : ''}" data-tab="activity">Activity</button>
        <button class="tab ${activeTab === 'timesheets' ? 'active' : ''}" data-tab="timesheets">Timesheets</button>
        <button class="tab ${activeTab === 'invoices' ? 'active' : ''}" data-tab="invoices">Invoices</button>
      </div>
      <div class="tab-content" id="tab-content"></div>
    `;

    renderTabContent();
    bindEvents();
  }

  function renderTabContent() {
    const tc = container.querySelector('#tab-content');
    const totalCost = (job.laborCost || 0) + (job.materialCost || 0);

    if (activeTab === 'overview') {
      const techNames = job.technicians && job.technicians.length > 0 
        ? job.technicians.map(t => `${t.name} (${t.hours}h)`).join(', ') 
        : (job.technicianName || 'Unassigned');

      tc.innerHTML = `
        <div class="grid-2">
          <div class="card">
            <div class="card-header"><h4>Job Information</h4></div>
            <div class="card-body">
              <div style="display:flex;flex-direction:column;gap:12px">
                ${r('Job Number', job.number)}
                ${r('Title', job.title)}
                ${r('Type', job.type)}
                ${r('Status', job.status)}
                ${r('Priority', job.priority)}
                ${r('Customer', job.customerName)}
                ${r('Contact', job.contactName || '—')}
              </div>
            </div>
          </div>
          <div class="card">
            <div class="card-header" style="display:flex;justify-content:space-between;align-items:center">
              <h4 style="margin:0">Schedule & Assignment</h4>
              <button class="btn btn-ghost btn-sm" id="btn-add-schedule" style="font-size:12px;padding:4px 8px">
                <span class="material-icons-outlined" style="font-size:14px;margin-right:4px">calendar_month</span> Add to Schedule
              </button>
            </div>
            <div class="card-body">
              <div style="display:flex;flex-direction:column;gap:12px">
                ${r('Technicians', techNames)}
                ${r('Scheduled', job.scheduledDate ? new Date(job.scheduledDate).toLocaleDateString() : '—')}
                ${r('Est. Hours', job.estimatedHours || '—')}
                ${r('Site Address', job.siteAddress || '—')}
                ${r('Quote Ref', job.quoteId ? `<a href="#/quotes/${job.quoteId}">${job.quoteId}</a>` : '—')}
                ${r('Created', new Date(job.createdAt).toLocaleDateString())}
              </div>
            </div>
          </div>
        </div>
      `;

      tc.querySelector('#btn-add-schedule')?.addEventListener('click', () => {
        router.navigate(`/schedule?jobId=${id}`);
      });
    } else if (activeTab === 'phases') {
      if (!job.phases) {
        job.phases = [{ id: store.generateId(), name: 'Main Phase', status: 'Not Started', progress: 0, startDate: new Date().toISOString(), technicians: [] }];
      }
      
      tc.innerHTML = `
        <div class="card" style="margin-bottom:var(--space-lg)">
          <div class="card-header" style="display:flex; justify-content:space-between; align-items:center">
            <h4>Project Phases / Milestones</h4>
            <button class="btn btn-sm btn-primary" id="btn-add-phase"><span class="material-icons-outlined" style="font-size:14px">add</span> Add Phase</button>
          </div>
          <div class="card-body" style="padding:0">
            <table class="data-table">
              <thead><tr><th>Phase Name</th><th>Status</th><th>Progress</th><th>Start Date</th><th></th></tr></thead>
              <tbody>
                ${job.phases.map((p, i) => `
                  <tr data-index="${i}">
                    <td><input type="text" class="form-input phase-input" data-field="name" value="${p.name || ''}" style="width:200px" /></td>
                    <td>
                      <select class="form-select phase-input" data-field="status">
                        ${['Not Started','In Progress','Completed'].map(s => `<option ${p.status === s ? 'selected' : ''}>${s}</option>`).join('')}
                      </select>
                    </td>
                    <td>
                      <div style="display:flex;align-items:center;gap:8px">
                        <input type="range" class="phase-input" data-field="progress" min="0" max="100" value="${p.progress || 0}" style="width:100px" />
                        <span style="font-size:12px;width:32px">${p.progress || 0}%</span>
                      </div>
                    </td>
                    <td><input type="date" class="form-input phase-input" data-field="startDate" value="${p.startDate ? p.startDate.split('T')[0] : ''}" /></td>
                    <td><button class="btn btn-ghost btn-icon btn-sm btn-remove-phase" data-index="${i}"><span class="material-icons-outlined" style="font-size:16px">close</span></button></td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>
          <div class="card-footer">
            <button class="btn btn-primary" id="btn-save-phases" style="width:100%"><span class="material-icons-outlined">save</span> Save Phases</button>
          </div>
        </div>
      `;

      tc.querySelector('#btn-add-phase')?.addEventListener('click', () => {
        job.phases.push({ id: store.generateId(), name: 'New Phase', status: 'Not Started', progress: 0, startDate: new Date().toISOString(), technicians: [] });
        renderTabContent();
      });

      tc.querySelectorAll('.phase-input').forEach(input => {
        input.addEventListener('change', () => {
          const idx = parseInt(input.closest('tr').dataset.index);
          const field = input.dataset.field;
          job.phases[idx][field] = field === 'progress' ? parseInt(input.value) : input.value;
          if (field === 'progress') renderTabContent();
        });
      });

      tc.querySelectorAll('.btn-remove-phase').forEach(btn => {
        btn.addEventListener('click', () => {
          const idx = parseInt(btn.dataset.index);
          if (confirm('Delete this phase?')) {
            job.phases.splice(idx, 1);
            renderTabContent();
          }
        });
      });

      tc.querySelector('#btn-save-phases')?.addEventListener('click', () => {
        store.update('jobs', id, { phases: job.phases });
        showToast('Phases saved', 'success');
      });
    } else if (activeTab === 'costs') {
      if (job.technicianId && (!job.technicians || job.technicians.length === 0)) {
        job.technicians = [{ id: job.technicianId, name: job.technicianName, hours: job.estimatedHours || 0, rate: 85 }];
      }
      if (!job.technicians) job.technicians = [];

      const allTechs = store.getAll('technicians');

      tc.innerHTML = `
        <div class="grid-2">
          <div class="card">
            <div class="card-header"><h4>Technicians & Internal Labor</h4></div>
            <div class="card-body">
              <div id="techs-container" style="display:flex;flex-direction:column;gap:12px;margin-bottom:16px">
                ${job.technicians.map((t, i) => `
                  <div class="tech-row form-row" data-index="${i}" style="align-items:flex-end">
                    <div class="form-group" style="margin-bottom:0;flex:2">
                      <label class="form-label">Technician</label>
                      <select class="form-select tech-select">
                        <option value="">Select...</option>
                        ${allTechs.map(tech => `<option value="${tech.id}" ${t.id === tech.id ? 'selected' : ''}>${tech.name}</option>`).join('')}
                      </select>
                    </div>
                    <div class="form-group" style="margin-bottom:0;flex:1">
                      <label class="form-label">Est. Hours</label>
                      <input type="number" class="form-input tech-hours" value="${t.hours || 0}" min="0" step="0.5" />
                    </div>
                    <div class="form-group" style="margin-bottom:0;flex:1">
                      <label class="form-label">Pay Rate ($/hr)</label>
                      <input type="number" class="form-input tech-rate" value="${t.rate || 0}" min="0" step="0.01" />
                    </div>
                    <button class="btn btn-danger btn-icon btn-remove-tech"><span class="material-icons-outlined">close</span></button>
                  </div>
                `).join('')}
              </div>
              <button class="btn btn-secondary btn-sm" id="btn-add-tech" style="width:100%"><span class="material-icons-outlined">add</span> Add Technician</button>
            </div>
          </div>
          
          <div style="display:flex;flex-direction:column;gap:var(--space-lg)">
            <div class="card">
              <div class="card-header"><h4>Material Costs</h4></div>
              <div class="card-body">
                <div id="materials-container" style="display:flex;flex-direction:column;gap:12px;margin-bottom:16px">
                  ${(job.materials || []).map((m, i) => `
                    <div style="display:flex;justify-content:space-between;align-items:center;padding:8px;border:1px solid var(--border-color);border-radius:4px">
                      <div>
                        <div class="font-medium">${m.name}</div>
                        <div class="text-secondary" style="font-size:12px">${m.quantity} x $${(m.unitCost || 0).toFixed(2)}</div>
                      </div>
                      <div class="font-medium">$${(m.quantity * (m.unitCost || 0)).toFixed(2)}</div>
                    </div>
                  `).join('')}
                  ${(!job.materials || job.materials.length === 0) ? '<div class="text-secondary" style="font-size:14px">No materials added.</div>' : ''}
                </div>
                <div style="display:flex;gap:8px">
                  <select class="form-select" id="mat-select" style="flex:2">
                    <option value="">Select from Stock...</option>
                    ${store.getAll('stock').map(s => `<option value="${s.id}">${s.name} (Qty: ${s.quantity}) - $${s.costPrice || s.unitPrice}</option>`).join('')}
                  </select>
                  <input type="number" class="form-input" id="mat-qty" value="1" min="1" style="flex:1" />
                  <button class="btn btn-primary" id="btn-add-material">Add</button>
                </div>
                <div class="form-group" style="margin-top:16px;margin-bottom:0">
                  <label class="form-label">Manual Add. Cost ($)</label>
                  <input type="number" class="form-input" id="inp-material-cost" value="${job.additionalMaterialCost || 0}" step="0.01" />
                </div>
              </div>
            </div>

            <div class="card">
              <div class="card-header"><h4>Internal Cost Summary</h4></div>
              <div class="card-body">
                <div style="display:flex;justify-content:space-between;padding:8px 0;border-bottom:1px solid var(--border-color)">
                  <span class="text-secondary">Est. Hours</span><span id="sum-hours" class="font-medium">${job.estimatedHours || 0}</span>
                </div>
                <div style="display:flex;justify-content:space-between;padding:8px 0;border-bottom:1px solid var(--border-color)">
                  <span class="text-secondary">Labor Cost</span><span id="sum-labor" class="font-medium">$${(job.laborCost || 0).toFixed(2)}</span>
                </div>
                <div style="display:flex;justify-content:space-between;padding:8px 0;border-bottom:1px solid var(--border-color)">
                  <span class="text-secondary">Material Cost</span><span id="sum-mat" class="font-medium">$${(job.materialCost || 0).toFixed(2)}</span>
                </div>
                <div style="display:flex;justify-content:space-between;padding:12px 0;font-size:var(--font-size-lg);font-weight:700">
                  <span>Total Internal Cost</span><span id="sum-total">$${((job.laborCost || 0) + (job.materialCost || 0)).toFixed(2)}</span>
                </div>
              </div>
              <div class="card-footer">
                <button class="btn btn-primary" id="btn-save-costs" style="width:100%"><span class="material-icons-outlined">save</span> Save Costs & Techs</button>
              </div>
            </div>
          </div>
        </div>
      `;

      tc.querySelector('#btn-add-tech')?.addEventListener('click', () => {
        job.technicians.push({ id: '', name: '', hours: 2, rate: 85 });
        renderTabContent();
      });

      tc.addEventListener('click', (e) => {
        if (e.target.closest('.btn-remove-tech')) {
          const idx = e.target.closest('.tech-row').dataset.index;
          job.technicians.splice(idx, 1);
          renderTabContent();
        }
      });

      function updateSummary() {
        let h = 0, l = 0;
        tc.querySelectorAll('.tech-row').forEach(row => {
          const hrs = parseFloat(row.querySelector('.tech-hours').value) || 0;
          const rate = parseFloat(row.querySelector('.tech-rate').value) || 0;
          h += hrs;
          l += (hrs * rate);
        });
        const addedMat = (job.materials || []).reduce((sum, m) => sum + (m.quantity * (m.unitCost || 0)), 0);
        const addCost = parseFloat(tc.querySelector('#inp-material-cost').value) || 0;
        const m = addedMat + addCost;
        
        tc.querySelector('#sum-hours').textContent = h;
        tc.querySelector('#sum-labor').textContent = '$' + l.toFixed(2);
        tc.querySelector('#sum-mat').textContent = '$' + m.toFixed(2);
        tc.querySelector('#sum-total').textContent = '$' + (l + m).toFixed(2);
      }

      tc.addEventListener('input', (e) => {
        if (e.target.matches('.tech-hours, .tech-rate, #inp-material-cost')) {
          updateSummary();
        }
      });

      tc.querySelector('#btn-add-material')?.addEventListener('click', () => {
        const matSel = tc.querySelector('#mat-select');
        const qty = parseInt(tc.querySelector('#mat-qty').value) || 1;
        const stockId = matSel.value;
        if (!stockId) return;

        const stockItem = store.getById('stock', stockId);
        if (!stockItem) return;

        if (stockItem.quantity < qty) {
          showToast(`Not enough stock. Available: ${stockItem.quantity}`, 'error');
          return;
        }

        // Deduct from stock
        store.update('stock', stockId, { quantity: stockItem.quantity - qty });
        
        // Add to job materials
        if (!job.materials) job.materials = [];
        job.materials.push({
          stockId: stockItem.id,
          name: stockItem.name,
          quantity: qty,
          unitCost: stockItem.costPrice || stockItem.unitPrice || 0
        });

        // Recalculate materialCost
        job.materialCost = job.materials.reduce((sum, m) => sum + (m.quantity * m.unitCost), 0) + (parseFloat(tc.querySelector('#inp-material-cost').value) || 0);
        store.update('jobs', id, { materials: job.materials, materialCost: job.materialCost });
        showToast(`Added ${qty}x ${stockItem.name}`, 'success');
        renderTabContent();
      });

      tc.querySelector('#btn-save-costs')?.addEventListener('click', () => {
        let totalH = 0, totalL = 0;
        const newTechs = Array.from(tc.querySelectorAll('.tech-row')).map(row => {
          const tSel = row.querySelector('.tech-select');
          const id = tSel.value;
          const name = tSel.options[tSel.selectedIndex].text;
          const hours = parseFloat(row.querySelector('.tech-hours').value) || 0;
          const rate = parseFloat(row.querySelector('.tech-rate').value) || 0;
          totalH += hours;
          totalL += (hours * rate);
          return { id, name, hours, rate };
        });

        const addCost = parseFloat(tc.querySelector('#inp-material-cost').value) || 0;
        const addedMat = (job.materials || []).reduce((sum, m) => sum + (m.quantity * (m.unitCost || 0)), 0);
        const mat = addedMat + addCost;
        
        job.technicians = newTechs;
        job.estimatedHours = totalH;
        job.laborCost = totalL;
        job.materialCost = mat;
        job.additionalMaterialCost = addCost;
        
        store.update('jobs', id, {
          technicians: newTechs,
          estimatedHours: totalH,
          laborCost: totalL,
          materialCost: mat,
          additionalMaterialCost: addCost
        });
        showToast('Costs and Technicians saved', 'success');
        // If we want to refresh overview or just stay
      });
    } else if (activeTab === 'activity') {
      if (!job.activityLog) {
        job.activityLog = [];
        if (job.notes) {
          job.activityLog.push({ id: Math.random().toString(36).substr(2,9), type: 'note', content: job.notes, date: job.createdAt || new Date().toISOString() });
        }
        if (job.attachments) {
          job.attachments.forEach(a => {
            job.activityLog.push({ id: Math.random().toString(36).substr(2,9), type: 'attachment', file: a, date: job.updatedAt || new Date().toISOString() });
          });
        }
        job.activityLog.sort((a,b) => new Date(b.date) - new Date(a.date));
      }

      tc.innerHTML = `
        <div class="card" style="max-width:800px;margin-bottom:var(--space-lg)">
          <div class="card-body">
            <div style="display:flex;gap:8px;margin-bottom:var(--space-base)">
              <input type="text" class="form-input" id="new-note-input" placeholder="Type a new note..." style="flex:1" />
              <button class="btn btn-primary" id="btn-add-note">Post</button>
              <label class="btn btn-secondary" for="upload-attachment" style="cursor:pointer">
                <span class="material-icons-outlined" style="font-size:16px">attach_file</span> Attach
                <input type="file" id="upload-attachment" style="display:none" multiple accept="image/*,.pdf,.doc,.docx" />
              </label>
            </div>
            
            <div class="activity-feed" style="display:flex;flex-direction:column;gap:16px;margin-top:24px">
              ${job.activityLog.length ? job.activityLog.map((log, i) => `
                <div style="display:flex;gap:12px">
                  <div style="width:36px;height:36px;border-radius:50%;background:var(--content-bg);display:flex;align-items:center;justify-content:center;flex-shrink:0;color:var(--text-secondary)">
                    <span class="material-icons-outlined" style="font-size:18px">${log.type === 'note' ? 'chat_bubble_outline' : 'attachment'}</span>
                  </div>
                  <div style="flex:1;background:var(--content-bg);padding:12px;border-radius:var(--border-radius);position:relative">
                    <div style="display:flex;justify-content:space-between;margin-bottom:8px">
                      <span class="text-secondary" style="font-size:var(--font-size-xs)">${new Date(log.date).toLocaleString()}</span>
                      <button class="btn btn-icon btn-sm btn-ghost btn-delete-activity" data-id="${log.id}" style="position:absolute;top:4px;right:4px;padding:2px;min-height:24px;min-width:24px"><span class="material-icons-outlined" style="font-size:14px">close</span></button>
                    </div>
                    ${log.type === 'note' ? `<div style="font-size:var(--font-size-sm);white-space:pre-wrap">${log.content}</div>` : 
                      `<div style="display:flex;align-items:center;gap:12px;border:1px solid var(--border-color);padding:8px;border-radius:4px;background:var(--card-bg);width:fit-content;max-width:100%">
                         ${log.file.type && log.file.type.startsWith('image/') ? 
                            `<div style="width:40px;height:40px;background:url('${log.file.data}') center/cover;border-radius:4px"></div>` : 
                            `<span class="material-icons-outlined" style="font-size:32px;color:var(--text-tertiary)">description</span>`
                         }
                         <div style="overflow:hidden">
                           <div class="truncate font-medium" style="font-size:var(--font-size-sm);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;max-width:200px" title="${log.file.name}">${log.file.name}</div>
                           <div class="text-secondary" style="font-size:10px">${(log.file.size / 1024).toFixed(1)} KB</div>
                         </div>
                       </div>`
                    }
                  </div>
                </div>
              `).join('') : '<div class="text-secondary text-center" style="padding:24px">No activity yet.</div>'}
            </div>
          </div>
        </div>
      `;

      tc.querySelector('#btn-add-note')?.addEventListener('click', () => {
        const val = tc.querySelector('#new-note-input').value.trim();
        if (!val) return;
        job.activityLog.unshift({ id: Math.random().toString(36).substr(2,9), type: 'note', content: val, date: new Date().toISOString() });
        store.update('jobs', id, { activityLog: job.activityLog });
        renderTabContent();
      });

      tc.querySelector('#upload-attachment')?.addEventListener('change', (e) => {
        const files = Array.from(e.target.files);
        if (!files.length) return;
        let processed = 0;
        files.forEach(file => {
          const reader = new FileReader();
          reader.onload = (ev) => {
            job.activityLog.unshift({
              id: Math.random().toString(36).substr(2,9),
              type: 'attachment',
              date: new Date().toISOString(),
              file: { name: file.name, size: file.size, type: file.type, data: ev.target.result }
            });
            processed++;
            if (processed === files.length) {
              store.update('jobs', id, { activityLog: job.activityLog });
              showToast(`${files.length} file(s) attached`, 'success');
              renderTabContent();
            }
          };
          reader.readAsDataURL(file);
        });
      });

      tc.querySelectorAll('.btn-delete-activity').forEach(btn => {
        btn.addEventListener('click', () => {
          job.activityLog = job.activityLog.filter(l => l.id !== btn.dataset.id);
          store.update('jobs', id, { activityLog: job.activityLog });
          renderTabContent();
        });
      });
    } else if (activeTab === 'timesheets') {
      const timesheets = store.getAll('timesheets').filter(t => t.jobId === id);
      const totalHours = timesheets.reduce((sum, t) => sum + (t.hours || 0), 0);
      const techs = store.getAll('technicians');
      
      tc.innerHTML = `
        <div class="card" style="margin-bottom:var(--space-lg)">
          <div class="card-header">
            <h4>Timesheets (${totalHours} hrs total)</h4>
          </div>
          <div class="card-body" style="padding:0">
            <table class="data-table">
              <thead><tr><th>Date</th><th>Technician</th><th>Description</th><th style="text-align:right">Hours</th><th>Status</th></tr></thead>
              <tbody>
                ${timesheets.length ? timesheets.map(t => `
                  <tr>
                    <td>${new Date(t.date).toLocaleDateString()}</td>
                    <td>${t.technicianName}</td>
                    <td class="text-secondary">${t.description || '—'}</td>
                    <td style="text-align:right;font-weight:600">${t.hours}</td>
                    <td><span class="badge ${t.status === 'Approved' ? 'badge-success' : t.status === 'Rejected' ? 'badge-danger' : 'badge-warning'}">${t.status}</span></td>
                  </tr>
                `).join('') : '<tr><td colspan="5" style="text-align:center;padding:20px" class="text-secondary">No time logged yet</td></tr>'}
              </tbody>
            </table>
          </div>
        </div>
        
        <div class="card" style="max-width:600px">
          <div class="card-header"><h4>Log Time</h4></div>
          <div class="card-body">
            <div class="form-row">
              <div class="form-group">
                <label class="form-label">Date *</label>
                <input type="date" class="form-input" id="ts-date" value="${new Date().toISOString().split('T')[0]}" />
              </div>
              <div class="form-group">
                <label class="form-label">Technician *</label>
                <select class="form-select" id="ts-tech">
                  <option value="">Select technician...</option>
                  ${techs.map(t => `<option value="${t.id}" ${job.technicianId === t.id ? 'selected' : ''}>${t.name}</option>`).join('')}
                </select>
              </div>
            </div>
            <div class="form-row">
              <div class="form-group" style="grid-column: span 2">
                <label class="form-label">Description</label>
                <input type="text" class="form-input" id="ts-desc" placeholder="What work was completed?" />
              </div>
            </div>
            <div class="form-row" style="align-items:flex-end">
              <div class="form-group" style="margin-bottom:0">
                <label class="form-label">Hours *</label>
                <input type="number" class="form-input" id="ts-hours" value="1" step="0.5" min="0.5" />
              </div>
              <button class="btn btn-primary" id="btn-log-time"><span class="material-icons-outlined">add_task</span> Log Time</button>
            </div>
          </div>
        </div>
      `;
      
      tc.querySelector('#btn-log-time')?.addEventListener('click', () => {
        const date = tc.querySelector('#ts-date').value;
        const techId = tc.querySelector('#ts-tech').value;
        const desc = tc.querySelector('#ts-desc').value;
        const hours = parseFloat(tc.querySelector('#ts-hours').value);
        
        if (!date || !techId || !hours) {
          showToast('Please fill all required fields', 'error');
          return;
        }
        
        const tech = techs.find(t => t.id === techId);
        
        store.create('timesheets', {
          jobId: id,
          jobNumber: job.number,
          technicianId: techId,
          technicianName: tech.name,
          date,
          description: desc,
          hours,
          status: 'Pending'
        });
        
        showToast('Time logged successfully', 'success');
        renderTabContent();
      });
    } else if (activeTab === 'forms') {
      job.forms = job.forms || [];
      
      tc.innerHTML = `
        <div class="card" style="margin-bottom:var(--space-lg)">
          <div class="card-header" style="display:flex; justify-content:space-between; align-items:center;">
            <h4 style="margin:0">Digital Forms / Checklists</h4>
            <button class="btn btn-sm btn-primary" id="btn-add-form"><span class="material-icons-outlined" style="font-size:16px;">post_add</span> Complete Form</button>
          </div>
          <div class="card-body" style="padding:0">
            <table class="data-table">
              <thead><tr><th>Form Type</th><th>Completed Date</th><th>Completed By</th></tr></thead>
              <tbody>
                ${job.forms.length ? job.forms.map(f => `
                  <tr>
                    <td class="font-medium">${f.type}</td>
                    <td>${new Date(f.date).toLocaleString()}</td>
                    <td>${f.completedBy || 'System'}</td>
                  </tr>
                `).join('') : '<tr><td colspan="3" style="text-align:center;padding:20px" class="text-secondary">No forms completed yet</td></tr>'}
              </tbody>
            </table>
          </div>
        </div>
      `;

      tc.querySelector('#btn-add-form')?.addEventListener('click', () => {
        showModal({
          title: 'Complete Form',
          content: `
            <div class="form-group">
              <label class="form-label">Form Type</label>
              <select class="form-select" id="new-form-type">
                <option value="JSA (Job Safety Analysis)">JSA (Job Safety Analysis)</option>
                <option value="SWMS (Safe Work Method Statement)">SWMS (Safe Work Method Statement)</option>
                <option value="Site Inspection">Site Inspection</option>
              </select>
            </div>
            <div class="form-group">
              <label class="form-label">Checklist Items</label>
              <div style="display:flex;flex-direction:column;gap:8px;">
                <label style="display:flex;align-items:center;gap:8px"><input type="checkbox" checked /> Hazards Identified</label>
                <label style="display:flex;align-items:center;gap:8px"><input type="checkbox" checked /> PPE Required</label>
                <label style="display:flex;align-items:center;gap:8px"><input type="checkbox" /> Tools Inspected</label>
                <label style="display:flex;align-items:center;gap:8px"><input type="checkbox" /> Site Secure</label>
              </div>
            </div>
            <div class="form-group">
              <label class="form-label">Notes</label>
              <textarea class="form-textarea" id="new-form-notes"></textarea>
            </div>
          `,
          actions: [
            { label: 'Cancel', className: 'btn-secondary', onClick: (close) => close() },
            { label: 'Submit', className: 'btn-primary', onClick: (close) => {
              job.forms.push({
                type: document.getElementById('new-form-type').value,
                notes: document.getElementById('new-form-notes').value,
                date: new Date().toISOString(),
                completedBy: 'Current User' // Placeholder for logged-in user
              });
              store.update('jobs', id, { forms: job.forms });
              showToast('Form submitted successfully', 'success');
              renderTabContent();
              close();
            }}
          ]
        });
      });
    } else if (activeTab === 'pos') {
      const pos = store.getAll('purchaseOrders').filter(p => p.jobId === id);
      
      tc.innerHTML = `
        <div class="card" style="margin-bottom:var(--space-lg)">
          <div class="card-header" style="display:flex; justify-content:space-between; align-items:center;">
            <h4 style="margin:0">Purchase Orders</h4>
            <button class="btn btn-sm btn-primary" id="btn-raise-po"><span class="material-icons-outlined" style="font-size:16px;">add_shopping_cart</span> Raise PO</button>
          </div>
          <div class="card-body" style="padding:0">
            <table class="data-table">
              <thead><tr><th>PO Number</th><th>Supplier</th><th>Issue Date</th><th>Total</th><th>Status</th></tr></thead>
              <tbody>
                ${pos.length ? pos.map(p => `
                  <tr>
                    <td><a href="#/purchase-orders/${p.id}">${p.number}</a></td>
                    <td>${p.supplierName || '—'}</td>
                    <td>${p.issueDate ? new Date(p.issueDate).toLocaleDateString() : '—'}</td>
                    <td style="font-weight:600;">$${(p.total || 0).toFixed(2)}</td>
                    <td><span class="badge ${p.status === 'Received' ? 'badge-success' : p.status === 'Draft' ? 'badge-neutral' : p.status === 'Cancelled' ? 'badge-danger' : 'badge-primary'}">${p.status}</span></td>
                  </tr>
                `).join('') : '<tr><td colspan="5" style="text-align:center;padding:20px" class="text-secondary">No purchase orders linked to this job</td></tr>'}
              </tbody>
            </table>
          </div>
        </div>
      `;

      tc.querySelector('#btn-raise-po')?.addEventListener('click', () => {
        router.navigate(`/purchase-orders/new?jobId=${id}`);
      });
    } else if (activeTab === 'invoices') {
      const invoices = store.getAll('invoices').filter(i => i.jobId === id);
      
      tc.innerHTML = `
        <div class="card" style="margin-bottom:var(--space-lg)">
          <div class="card-header" style="display:flex; justify-content:space-between; align-items:center;">
            <h4 style="margin:0">Invoices</h4>
            <div style="display:flex; gap:8px;">
              <button class="btn btn-sm btn-secondary" id="btn-create-deposit-invoice">Create Deposit Invoice</button>
              <button class="btn btn-sm btn-secondary" id="btn-create-progress-invoice">Create Progress Invoice</button>
              <button class="btn btn-sm btn-primary" id="btn-create-standard-invoice"><span class="material-icons-outlined" style="font-size:16px;">add</span> Create Standard Invoice</button>
            </div>
          </div>
          <div class="card-body" style="padding:0">
            <table class="data-table">
              <thead><tr><th>Number</th><th>Type</th><th>Issue Date</th><th>Due Date</th><th>Total</th><th>Status</th></tr></thead>
              <tbody>
                ${invoices.length ? invoices.map(i => `
                  <tr>
                    <td><a href="#/invoices/${i.id}">${i.number}</a></td>
                    <td><span class="badge badge-neutral">${i.invoiceType || 'Standard'}</span></td>
                    <td>${i.issueDate ? i.issueDate.split('T')[0] : '—'}</td>
                    <td>${i.dueDate ? i.dueDate.split('T')[0] : '—'}</td>
                    <td style="font-weight:600;">$${(i.total || 0).toFixed(2)}</td>
                    <td><span class="badge ${i.status === 'Paid' ? 'badge-success' : i.status === 'Draft' ? 'badge-neutral' : i.status === 'Overdue' ? 'badge-danger' : 'badge-info'}">${i.status}</span></td>
                  </tr>
                `).join('') : '<tr><td colspan="6" style="text-align:center;padding:20px" class="text-secondary">No invoices created for this job yet</td></tr>'}
              </tbody>
            </table>
          </div>
        </div>
      `;

      function createDraftInvoice(type, lineItems, subtotal) {
        const inv = store.create('invoices', {
          number: `INV-${Date.now().toString().slice(-6)}`,
          invoiceType: type,
          jobId: id, jobNumber: job.number,
          customerId: job.customerId, customerName: job.customerName, contactName: job.contactName,
          status: 'Draft',
          lineItems: lineItems,
          subtotal: subtotal, tax: subtotal * 0.1, total: subtotal * 1.1,
          issueDate: new Date().toISOString(), dueDate: new Date(Date.now() + 30 * 86400000).toISOString(),
        });
        store.update('jobs', id, { status: 'Invoiced' });
        showToast(`${type} Invoice created`, 'success');
        router.navigate(`/invoices/${inv.id}`);
      }

      function getJobTotalCosts() {
        let lineItems = [];
        let subtotal = 0;
        if (job.quoteId) {
          const quote = store.getById('quotes', job.quoteId);
          if (quote && quote.lineItems && quote.lineItems.length > 0) {
            lineItems = quote.lineItems.map(i => ({...i}));
            subtotal = quote.subtotal || quote.lineItems.reduce((s, i) => s + (i.total || 0), 0);
          }
        }
        if (lineItems.length === 0) {
          const lCost = job.laborCost || 0;
          const mCost = job.materialCost || 0;
          lineItems = [
            { description: `${job.title} - Labor`, type: 'labor', qty: 1, rate: lCost, total: lCost },
            { description: `${job.title} - Materials`, type: 'material', qty: 1, rate: mCost, total: mCost },
          ];
          subtotal = lCost + mCost;
        }
        return { lineItems, subtotal };
      }

      tc.querySelector('#btn-create-standard-invoice')?.addEventListener('click', () => {
        const { lineItems, subtotal } = getJobTotalCosts();
        createDraftInvoice('Standard', lineItems, subtotal);
      });

      tc.querySelector('#btn-create-deposit-invoice')?.addEventListener('click', () => {
        const lineItems = [{ description: `Deposit for Job ${job.number}`, type: 'other', qty: 1, rate: 0, total: 0 }];
        createDraftInvoice('Deposit', lineItems, 0);
      });

      tc.querySelector('#btn-create-progress-invoice')?.addEventListener('click', () => {
        showModal({
          title: 'Create Progress Invoice',
          content: `
            <div class="form-group">
              <label class="form-label">Percentage Complete (%)</label>
              <input type="number" id="progress-percent" class="form-input" min="1" max="100" value="50" />
            </div>
          `,
          actions: [
            { label: 'Cancel', className: 'btn-secondary', onClick: (close) => close() },
            { label: 'Create', className: 'btn-primary', onClick: (close) => {
              const pct = parseFloat(document.getElementById('progress-percent').value) || 0;
              if (pct <= 0 || pct > 100) { showToast('Enter a valid percentage (1-100)', 'error'); return; }
              const { subtotal } = getJobTotalCosts();
              const partialAmount = subtotal * (pct / 100);
              const lineItems = [{ description: `Progress Payment (${pct}% of job)`, type: 'other', qty: 1, rate: partialAmount, total: partialAmount }];
              createDraftInvoice('Progress', lineItems, partialAmount);
              close();
            }}
          ]
        });
      });
    }
  }

  function bindEvents() {
    container.querySelectorAll('.tab').forEach(tab => {
      tab.addEventListener('click', () => {
        activeTab = tab.dataset.tab;
        container.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
        tab.classList.add('active');
        renderTabContent();
      });
    });

    container.querySelector('#btn-edit-job')?.addEventListener('click', () => router.navigate(`/jobs/${id}/edit`));

    container.querySelector('#btn-delete-job')?.addEventListener('click', () => {
      showModal({
        title: 'Delete Job', content: `<p>Delete job <strong>${job.number}</strong>?</p>`,
        actions: [
          { label: 'Cancel', className: 'btn-secondary', onClick: (close) => close() },
          { label: 'Delete', className: 'btn-danger', onClick: (close) => { store.delete('jobs', id); showToast('Job deleted', 'success'); close(); router.navigate('/jobs'); }},
        ],
      });
    });

    // Invoice creation logic moved to Invoices tab
  }

  render();
}

function r(label, value) {
  return `<div style="display:flex;gap:8px"><span style="width:120px;font-size:var(--font-size-sm);color:var(--text-tertiary);font-weight:500">${label}</span><span>${value}</span></div>`;
}
