// ============================================
// SIMPRO CLONE — JOB DETAIL PAGE
// ============================================

import { store } from '../../data/store.js';
import { router } from '../../router.js';
import { showModal } from '../../components/Modal.js';
import { showToast } from '../../components/Notifications.js';
import { updateBreadcrumbDetail } from '../../components/Breadcrumb.js';
import { escapeHTML } from '../../utils/security.js';

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
  let taskExpandedPath = [0];
  let taskViewPath = [];
  let isInfoPanelEditing = false;
  let cachedStockOptionsHtml = null;

  function getStockOptionsHtml() {
    if (!cachedStockOptionsHtml) {
      cachedStockOptionsHtml = store.getAll('stock')
        .map(s => `<option value="${s.id}">${escapeHTML(s.name)} (Qty: ${s.quantity}) - $${s.costPrice || s.unitPrice}</option>`)
        .join('');
    }
    return cachedStockOptionsHtml;
  }

  function render() {
    const totalCost = (job.laborCost || 0) + (job.materialCost || 0);

    container.innerHTML = `
      <div class="detail-header">
        <div class="detail-header-info">
          <div class="detail-header-icon" style="background:var(--color-primary-light);color:var(--color-primary)">
            <span class="material-icons-outlined">build</span>
          </div>
          <div>
            <div class="detail-header-text"><h2>${escapeHTML(job.number)} — ${escapeHTML(job.title)}</h2></div>
            <div class="detail-header-meta">
              <span><span class="material-icons-outlined" style="font-size:14px">business</span> ${escapeHTML(job.customerName)}</span>
              <span><span class="material-icons-outlined" style="font-size:14px">person</span> ${escapeHTML(job.technicianName || 'Unassigned')}</span>
              <span class="badge ${sb[job.status] || 'badge-neutral'}">${escapeHTML(job.status)}</span>
              <span class="badge ${pb[job.priority] || 'badge-neutral'}">${escapeHTML(job.priority)}</span>
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
        <button class="tab ${activeTab === 'phases' ? 'active' : ''}" data-tab="phases">TaskLists</button>
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
      let jobProgress = 0;
      if (job.phases && job.phases.length > 0) {
         let totalWeight = 0;
         let completedWeight = 0;
         job.phases.forEach(sp => {
            const weight = (parseFloat(sp.estimatedHours) || 1) * (parseInt(sp.people) || 1);
            totalWeight += weight;
            completedWeight += weight * ((sp.progress || 0) / 100);
         });
         jobProgress = totalWeight > 0 ? Math.round((completedWeight / totalWeight) * 100) : 0;
      }

      const techNames = job.technicians && job.technicians.length > 0 
        ? job.technicians.map(t => `${escapeHTML(t.name)} (${t.hours}h)`).join(', ')
        : escapeHTML(job.technicianName || 'Unassigned');

      tc.innerHTML = `
        <div class="grid-2">
          <div class="card">
            <div class="card-header"><h4>Job Information</h4></div>
            <div class="card-body">
              <div style="display:flex;flex-direction:column;gap:12px">
                ${r('Job Number', escapeHTML(job.number))}
                ${r('Title', escapeHTML(job.title))}
                ${r('Type', escapeHTML(job.type))}
                ${r('Status', escapeHTML(job.status))}
                ${r('Completion', `<div style="display:flex;align-items:center;gap:8px;max-width:200px"><div style="flex:1;background:var(--border-color);height:8px;border-radius:4px;overflow:hidden"><div style="width:${jobProgress}%;background:var(--color-primary);height:100%"></div></div><span style="font-size:12px;font-weight:600">${jobProgress}%</span></div>`)}
                ${r('Priority', escapeHTML(job.priority))}
                ${r('Customer', escapeHTML(job.customerName))}
                ${r('Contact', escapeHTML(job.contactName || '—'))}
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
                ${r('Site Address', escapeHTML(job.siteAddress || '—'))}
                ${r('Quote Ref', job.quoteId ? `<a href="#/quotes/${escapeHTML(job.quoteId)}">${escapeHTML(job.quoteId)}</a>` : '—')}
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
      const currentUser = JSON.parse(sessionStorage.getItem('currentUser') || '{}');
      let canEditTasks = true;
      if (currentUser.userTypeId) {
        const ut = store.getById('userTypes', currentUser.userTypeId);
        if (ut && ut.permissions) {
          const p = ut.permissions.find(p => p.module === 'Jobs');
          if (p) canEditTasks = p.edit;
        }
      } else if (currentUser.role === 'customer' || currentUser.role === 'technician') {
        canEditTasks = false;
      }

      if (!job.phases) {
        job.phases = [{ id: store.generateId(), name: 'Main Task', status: 'Not Started', progress: 0, startDate: new Date().toISOString(), technicians: [], subPhases: [] }];
      }
      
      // Ensure existing phases have subPhases array
      job.phases.forEach(p => { if (!p.subPhases) p.subPhases = []; });

      function getPhaseByPath(phases, path) {
        let curr = phases[path[0]];
        if (!curr) return null;
        for (let i = 1; i < path.length; i++) {
          if (!curr.subPhases) return null;
          curr = curr.subPhases[path[i]];
          if (!curr) return null;
        }
        return curr;
      }

      function calculateTotalHours(node) {
        if (!node.subPhases || node.subPhases.length === 0) {
           return (parseFloat(node.estimatedHours) || 0) * (parseInt(node.people) || 1);
        }
        return node.subPhases.reduce((sum, sp) => sum + calculateTotalHours(sp), 0);
      }

      function updateParentProgress(phases, path) {
        if (path.length <= 1) return;
        const parentPath = path.slice(0, -1);
        const parent = getPhaseByPath(phases, parentPath);
        if (parent && parent.subPhases && parent.subPhases.length > 0) {
          let totalWeight = 0;
          let completedWeight = 0;
          parent.subPhases.forEach(sp => {
             const weight = (parseFloat(sp.estimatedHours) || 1) * (parseInt(sp.people) || 1);
             totalWeight += weight;
             completedWeight += weight * ((sp.progress || 0) / 100);
          });
          parent.progress = totalWeight > 0 ? Math.round((completedWeight / totalWeight) * 100) : 0;
          if (parent.progress === 100) parent.status = 'Completed';
          else if (parent.progress > 0) parent.status = 'In Progress';
          else parent.status = 'Not Started';
          updateParentProgress(phases, parentPath); // recurse up
        }
      }

      // Cleanup invalid paths
      let isValidPath = true;
      let curr = job.phases;
      for (let i=0; i<taskExpandedPath.length; i++) {
         if (!curr || !curr[taskExpandedPath[i]]) { isValidPath = false; break; }
         curr = curr[taskExpandedPath[i]].subPhases;
      }
      if (!isValidPath) {
         taskExpandedPath = [];
      }

      tc.innerHTML = `
        <div class="card" style="margin-bottom:var(--space-lg)">
          <div class="card-header" style="display:flex; justify-content:space-between; align-items:center">
            <h4>Tasklists</h4>
            <div style="display:flex; gap:8px">
              ${canEditTasks ? `<button class="btn btn-sm btn-secondary" id="btn-save-tasklist-template"><span class="material-icons-outlined" style="font-size:14px">bookmark_add</span> Save as Template</button>` : ''}
              ${canEditTasks ? `<button class="btn btn-sm btn-primary" id="btn-save-phases"><span class="material-icons-outlined" style="font-size:14px">save</span> Save Tasks</button>` : ''}
            </div>
          </div>
          <div class="card-body" style="padding:16px; display:flex; gap:16px; overflow-x:auto; min-height:400px; align-items:stretch">
            
            <!-- Drill-Down List -->
            ${(() => {
              const viewParentNode = taskViewPath.length > 0 ? getPhaseByPath(job.phases, taskViewPath) : null;
              const viewList = viewParentNode ? (viewParentNode.subPhases || []) : job.phases;
              const viewTitle = viewParentNode ? escapeHTML(viewParentNode.name) : 'Main Tasks';
              
              return `
                <div style="flex: 0 0 300px; display:flex; flex-direction:column; border:1px solid var(--border-color); border-radius:4px; background:var(--content-bg);">
                  <div style="padding:12px; border-bottom:1px solid var(--border-color); font-weight:600; display:flex; justify-content:space-between; align-items:center">
                    <div style="display:flex; align-items:center; gap:8px; overflow:hidden">
                      ${taskViewPath.length > 0 ? `<button class="btn btn-ghost btn-sm btn-icon btn-view-back" title="Back"><span class="material-icons-outlined" style="font-size:18px">arrow_back</span></button>` : ''}
                      <span style="white-space:nowrap; overflow:hidden; text-overflow:ellipsis" title="${viewTitle}">${viewTitle}</span>
                    </div>
                    ${canEditTasks ? (taskViewPath.length === 0 ? `<button class="btn btn-ghost btn-sm btn-icon" id="btn-add-main-task" title="Add Main Task"><span class="material-icons-outlined">add</span></button>` : `<button class="btn btn-ghost btn-sm btn-icon btn-add-child-task" data-path="${taskViewPath.join('-')}" title="Add Task"><span class="material-icons-outlined">add</span></button>`) : ''}
                  </div>
                  <div style="padding:8px; display:flex; flex-direction:column; gap:4px; overflow-y:auto; flex:1">
                    ${viewList.map((p, i) => {
                      const currentPath = [...taskViewPath, i];
                      const isSelected = currentPath.join('-') === taskExpandedPath.join('-');
                      return `
                        <div class="task-list-item" data-path="${currentPath.join('-')}" style="padding:8px; border-radius:4px; cursor:pointer; display:flex; justify-content:space-between; align-items:center; ${isSelected ? 'background:var(--color-primary-light); color:var(--color-primary)' : 'background:var(--bg-color)'}">
                          <span style="font-weight:${isSelected ? '600' : '400'}; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; flex:1;" title="${escapeHTML(p.name)}">${escapeHTML(p.name)}</span>
                          ${p.subPhases && p.subPhases.length > 0 ? `<button class="btn btn-ghost btn-icon btn-sm btn-drill-down" data-path="${currentPath.join('-')}" style="margin-left:8px; padding:2px; min-width:24px; min-height:24px; color:inherit"><span class="material-icons-outlined" style="font-size:18px">chevron_right</span></button>` : `<input type="checkbox" class="task-list-checkbox" data-path="${currentPath.join('-')}" ${p.progress === 100 ? 'checked' : ''} style="margin-left:8px; width:18px; height:18px; cursor:pointer;" />`}
                        </div>
                      `;
                    }).join('')}
                    ${viewList.length === 0 ? '<div style="color:var(--text-tertiary);font-size:12px;text-align:center;padding:12px">No tasks</div>' : ''}
                  </div>
                </div>
              `;
            })()}

            <!-- Task Details Form -->
            ${taskExpandedPath.length > 0 ? (() => {
              const path = taskExpandedPath;
              const node = getPhaseByPath(job.phases, path);
              if (!node) return '';
              const hasSubs = node.subPhases && node.subPhases.length > 0;
              return `
                <div style="flex: 1; min-width:300px; display:flex; flex-direction:column; border:1px solid var(--border-color); border-radius:4px; background:var(--content-bg); padding:16px">
                  ${!isInfoPanelEditing ? `
                  <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:16px">
                    <h4 style="margin:0; white-space:nowrap; overflow:hidden; text-overflow:ellipsis" title="${escapeHTML(node.name)}">Info Panel: ${escapeHTML(node.name)}</h4>
                    <div style="display:flex;gap:8px">
                      ${canEditTasks && path.length < 3 ? `<button class="btn btn-sm btn-secondary btn-add-child-task" data-path="${path.join('-')}" title="Add Sub-task"><span class="material-icons-outlined" style="font-size:16px">add_task</span> Add Sub-task</button>` : ''}
                      <button class="btn btn-sm btn-secondary btn-book-time" data-path="${path.join('-')}"><span class="material-icons-outlined" style="font-size:16px">timer</span> Book Time</button>
                      ${canEditTasks ? `<button class="btn btn-sm btn-primary btn-edit-info" title="Edit"><span class="material-icons-outlined" style="font-size:16px">edit</span> Edit</button>` : ''}
                    </div>
                  </div>
                  <div style="margin-bottom:16px">
                    <div style="font-size:12px; color:var(--text-tertiary); margin-bottom:4px">Task Name</div>
                    <div style="font-size:16px; font-weight:500">${escapeHTML(node.name)}</div>
                  </div>
                  ${hasSubs ? `
                  <div style="margin-bottom:16px">
                    <div style="font-size:12px; color:var(--text-tertiary); margin-bottom:4px">Total Hours</div>
                    <div style="font-size:14px; font-weight:500">${calculateTotalHours(node)} hrs</div>
                  </div>
                  ` : `
                  <div style="display:flex; gap:24px; margin-bottom:16px">
                    <div style="flex:1">
                      <div style="font-size:12px; color:var(--text-tertiary); margin-bottom:4px">Start Date</div>
                      <div style="font-size:14px">${node.startDate ? node.startDate.split('T')[0] : '-'}</div>
                    </div>
                    <div style="flex:1">
                      <div style="font-size:12px; color:var(--text-tertiary); margin-bottom:4px">Estimated Hours</div>
                      <div style="font-size:14px">${node.estimatedHours ? node.estimatedHours + ' hrs' : '-'}</div>
                    </div>
                    <div style="flex:1">
                      <div style="font-size:12px; color:var(--text-tertiary); margin-bottom:4px">People</div>
                      <div style="font-size:14px">${node.people || '1'}</div>
                    </div>
                  </div>
                  `}
                  <div>
                    <div style="font-size:12px; color:var(--text-tertiary); margin-bottom:4px">Progress</div>
                    <div style="width:100%;background:var(--border-color);height:24px;border-radius:4px;overflow:hidden;position:relative">
                      <div style="width:${node.progress || 0}%;background:var(--color-primary);height:100%;transition:width 0.3s"></div>
                      <div style="position:absolute;inset:0;display:flex;align-items:center;justify-content:center;font-weight:600;font-size:12px;color:${node.progress > 50 ? '#fff' : '#000'}">${node.progress || 0}%</div>
                    </div>
                  </div>
                  <div style="margin-top:16px">
                    <div style="font-size:12px; color:var(--text-tertiary); margin-bottom:4px">Description</div>
                    <div style="font-size:14px; white-space:pre-wrap">${escapeHTML(node.description || 'No description provided.')}</div>
                  </div>
                  ` : `
                  <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:16px">
                    <h4 style="margin:0; white-space:nowrap; overflow:hidden; text-overflow:ellipsis" title="${escapeHTML(node.name)}">Edit Info Panel</h4>
                    <div style="display:flex;gap:8px">
                      <button class="btn btn-sm btn-primary btn-done-info">Done</button>
                      ${canEditTasks ? `<button class="btn btn-sm btn-secondary btn-duplicate-task" data-path="${path.join('-')}" title="Duplicate Task"><span class="material-icons-outlined" style="font-size:16px">content_copy</span></button>` : ''}
                      ${canEditTasks ? `<button class="btn btn-sm btn-danger btn-remove-task" data-path="${path.join('-')}"><span class="material-icons-outlined" style="font-size:16px">delete</span></button>` : ''}
                    </div>
                  </div>
                  <div class="form-group">
                    <label class="form-label">Task Name</label>
                    <input type="text" class="form-input detail-input" data-field="name" value="${escapeHTML(node.name)}" ${!canEditTasks ? 'disabled' : ''} />
                  </div>
                  ${hasSubs ? `
                  <div style="margin-bottom:16px">
                    <div style="font-size:12px; color:var(--text-tertiary); margin-bottom:4px">Total Hours</div>
                    <div style="font-size:14px; font-weight:500">${calculateTotalHours(node)} hrs</div>
                  </div>
                  ` : `
                  <div class="form-row">
                    <div class="form-group">
                      <label class="form-label">Start Date</label>
                      <input type="date" class="form-input detail-input" data-field="startDate" value="${node.startDate ? node.startDate.split('T')[0] : ''}" ${!canEditTasks ? 'disabled' : ''} />
                    </div>
                    <div class="form-group">
                      <label class="form-label">Estimated Hours</label>
                      <input type="number" class="form-input detail-input" data-field="estimatedHours" value="${node.estimatedHours || ''}" min="0" step="0.5" ${!canEditTasks ? 'disabled' : ''} />
                    </div>
                    <div class="form-group">
                      <label class="form-label">People</label>
                      <input type="number" class="form-input detail-input" data-field="people" value="${node.people || '1'}" min="1" step="1" ${!canEditTasks ? 'disabled' : ''} />
                    </div>
                  </div>
                  `}
                  <div class="form-group">
                    <label class="form-label">Progress</label>
                    <div style="width:100%;background:var(--border-color);height:36px;border-radius:4px;overflow:hidden;position:relative">
                      <div style="width:${node.progress || 0}%;background:var(--color-primary);height:100%;transition:width 0.3s"></div>
                      <div style="position:absolute;inset:0;display:flex;align-items:center;justify-content:center;font-weight:600;color:${node.progress > 50 ? '#fff' : '#000'}">${node.progress || 0}%</div>
                    </div>
                  </div>
                  <div class="form-group">
                    <label class="form-label">Description</label>
                    <textarea class="form-input detail-input" data-field="description" rows="3" ${!canEditTasks ? 'disabled' : ''}>${escapeHTML(node.description || '')}</textarea>
                  </div>
                  `}
                </div>
              `;
            })() : ''}
          </div>
        </div>
      `;

      tc.querySelector('.btn-view-back')?.addEventListener('click', () => {
         taskViewPath.pop();
         renderTabContent();
      });

      tc.querySelectorAll('.btn-drill-down').forEach(el => {
         el.addEventListener('click', (e) => {
            e.stopPropagation();
            taskViewPath = el.dataset.path.split('-').map(Number);
            taskExpandedPath = [...taskViewPath];
            renderTabContent();
         });
      });

      tc.querySelectorAll('.task-list-checkbox').forEach(chk => {
         chk.addEventListener('change', (e) => {
            const path = e.target.dataset.path.split('-').map(Number);
            const node = getPhaseByPath(job.phases, path);
            node.progress = e.target.checked ? 100 : 0;
            node.status = e.target.checked ? 'Completed' : 'Not Started';
            updateParentProgress(job.phases, path);
            renderTabContent();
         });
         chk.addEventListener('click', (e) => e.stopPropagation());
      });

      tc.querySelectorAll('.task-list-item').forEach(el => {
         el.addEventListener('click', (e) => {
            if (e.target.closest('.btn-drill-down')) return;
            const path = e.currentTarget.dataset.path.split('-').map(Number);
            taskExpandedPath = path;
            isInfoPanelEditing = false;
            renderTabContent();
         });
      });

      tc.querySelector('.btn-edit-info')?.addEventListener('click', () => {
         isInfoPanelEditing = true;
         renderTabContent();
      });

      tc.querySelector('.btn-done-info')?.addEventListener('click', () => {
         isInfoPanelEditing = false;
         renderTabContent();
      });

      tc.querySelector('#btn-add-main-task')?.addEventListener('click', () => {
         if (!job.phases) job.phases = [];
         job.phases.push({ id: store.generateId(), name: 'New Task', status: 'Not Started', progress: 0, startDate: new Date().toISOString(), technicians: [], subPhases: [] });
         taskExpandedPath = [job.phases.length - 1];
         renderTabContent();
      });

      tc.querySelectorAll('.btn-add-child-task').forEach(btn => {
         btn.addEventListener('click', (e) => {
            const path = e.currentTarget.dataset.path.split('-').map(Number);
            const parent = getPhaseByPath(job.phases, path);
            if (!parent.subPhases) parent.subPhases = [];
            parent.subPhases.push({ id: store.generateId(), name: 'New Sub-task', status: 'Not Started', progress: 0, startDate: new Date().toISOString(), technicians: [], subPhases: [] });
            taskExpandedPath = [...path, parent.subPhases.length - 1];
            renderTabContent();
         });
      });

      tc.querySelectorAll('.detail-input').forEach(input => {
         input.addEventListener('change', (e) => {
            const node = getPhaseByPath(job.phases, taskExpandedPath);
            const field = e.target.dataset.field;
            
            if (field === 'progress-check') {
               node.progress = e.target.checked ? 100 : 0;
               node.status = e.target.checked ? 'Completed' : 'Not Started';
            } else if (field === 'progress') {
               node.progress = parseInt(e.target.value);
               if (node.progress === 100) node.status = 'Completed';
               else if (node.progress === 0) node.status = 'Not Started';
               else node.status = 'In Progress';
            } else if (field === 'estimatedHours') {
               node.estimatedHours = parseFloat(e.target.value) || 0;
            } else {
               node[field] = e.target.value;
            }

            updateParentProgress(job.phases, taskExpandedPath);
            renderTabContent();
         });
      });

      tc.querySelectorAll('.btn-remove-task').forEach(btn => {
         btn.addEventListener('click', (e) => {
            if (confirm('Delete this task and all its sub-tasks?')) {
               const path = e.currentTarget.dataset.path.split('-').map(Number);
               if (path.length === 1) {
                  job.phases.splice(path[0], 1);
               } else {
                  const parentPath = path.slice(0, -1);
                  const parent = getPhaseByPath(job.phases, parentPath);
                  parent.subPhases.splice(path[path.length-1], 1);
                  updateParentProgress(job.phases, parentPath);
               }
               taskExpandedPath = path.slice(0, -1); // jump up one level
               renderTabContent();
            }
         });
      });

      tc.querySelector('#btn-save-phases')?.addEventListener('click', () => {
         store.update('jobs', id, { phases: job.phases });
         showToast('Tasks saved', 'success');
      });

      tc.querySelector('#btn-save-tasklist-template')?.addEventListener('click', () => {
         const tmplName = prompt('Enter a name for this Tasklist template:');
         if (tmplName) {
            function deepClonePhases(phases) {
               return phases.map(p => ({
                  ...p,
                  id: store.generateId(),
                  subPhases: p.subPhases ? deepClonePhases(p.subPhases) : []
               }));
            }
            store.create('tasklistTemplates', {
               name: tmplName,
               phases: deepClonePhases(job.phases),
               createdAt: new Date().toISOString()
            });
            showToast('Tasklist saved as template', 'success');
         }
      });

      tc.querySelectorAll('.btn-duplicate-task').forEach(btn => {
         btn.addEventListener('click', (e) => {
            const path = e.currentTarget.dataset.path.split('-').map(Number);
            const nodeToCopy = getPhaseByPath(job.phases, path);
            
            function cloneNode(node, isRootCopy) {
               return {
                  ...node,
                  id: store.generateId(),
                  name: node.name + (isRootCopy ? ' (Copy)' : ''),
                  progress: 0,
                  status: 'Not Started',
                  subPhases: node.subPhases ? node.subPhases.map(child => cloneNode(child, false)) : []
               };
            }
            
            const cloned = cloneNode(nodeToCopy, true);
            
            if (path.length === 1) {
               job.phases.splice(path[0] + 1, 0, cloned);
            } else {
               const parentPath = path.slice(0, -1);
               const parent = getPhaseByPath(job.phases, parentPath);
               parent.subPhases.splice(path[path.length - 1] + 1, 0, cloned);
               updateParentProgress(job.phases, parentPath);
            }
            renderTabContent();
         });
      });

      tc.querySelectorAll('.btn-book-time').forEach(btn => {
         btn.addEventListener('click', (e) => {
            const path = e.currentTarget.dataset.path.split('-').map(Number);
            const node = getPhaseByPath(job.phases, path);
            const currentUser = JSON.parse(sessionStorage.getItem('currentUser') || '{}');
            
            const allTimesheets = store.getAll('timesheets').filter(t => t.jobId === id);
            const techs = store.getAll('technicians');
            
            const now = new Date();
            const p = n => n.toString().padStart(2, '0');
            const dateStr = `${now.getFullYear()}-${p(now.getMonth()+1)}-${p(now.getDate())}`;
            const startStr = `${dateStr}T09:00`;
            const finishStr = `${dateStr}T10:00`;

            const content = document.createElement('div');
            content.innerHTML = `
            <div style="margin-bottom:var(--space-lg)">
              <h5 style="margin-bottom:8px">All Logged Time for this Job (${allTimesheets.reduce((s,t)=>s+(t.hours||0),0).toFixed(2)} hrs)</h5>
              <div style="max-height:150px;overflow-y:auto;background:var(--content-bg);border-radius:4px;border:1px solid var(--border-color)">
                <table class="data-table" style="font-size:13px">
                  <thead><tr><th>Date</th><th>Tech</th><th>Task</th><th>Hours</th></tr></thead>
                  <tbody>
                    ${allTimesheets.length ? allTimesheets.map(t => `
                      <tr>
                        <td>${t.startTime ? new Date(t.startTime).toLocaleString([], {month:'short', day:'numeric', hour:'2-digit', minute:'2-digit'}) : new Date(t.date).toLocaleDateString()}</td>
                        <td>${escapeHTML(t.technicianName)}</td>
                        <td>${escapeHTML(t.phaseName || 'ΓÇö')}</td>
                        <td style="font-weight:600">${t.hours}</td>
                      </tr>
                    `).join('') : '<tr><td colspan="4" style="text-align:center" class="text-secondary">No time logged</td></tr>'}
                  </tbody>
                </table>
              </div>
            </div>
            <div class="form-row">
              <div class="form-group">
                <label class="form-label">Start Time *</label>
                <input type="datetime-local" class="form-input" id="bt-start" value="${startStr}" />
              </div>
              <div class="form-group">
                <label class="form-label">Finish Time *</label>
                <input type="datetime-local" class="form-input" id="bt-finish" value="${finishStr}" />
              </div>
            </div>
            <div class="form-group">
              <label class="form-label">Technician *</label>
              <select class="form-select" id="bt-tech">
                <option value="">Select tech...</option>
                ${techs.map(t => `<option value="${t.id}" ${t.name === currentUser.name ? 'selected' : ''}>${t.name}</option>`).join('')}
              </select>
            </div>
            `;
            
            showModal({
              title: 'Book Time: ' + escapeHTML(node.name),
              content,
              size: 'modal-70',
              actions: [
                { label: 'Cancel', className: 'btn-secondary', onClick: (close) => close() },
                { label: 'Log Time', className: 'btn-primary', onClick: (close) => {
                  const startVal = content.querySelector('#bt-start').value;
                  const finishVal = content.querySelector('#bt-finish').value;
                  const techId = content.querySelector('#bt-tech').value;
                  const desc = '';
                  
                  if (!startVal || !finishVal || !techId) {
                    showToast('Please fill all required fields', 'error');
                    return;
                  }

                  const startDate = new Date(startVal);
                  const finishDate = new Date(finishVal);
                  
                  if (finishDate <= startDate) {
                    showToast('Finish time must be after start time', 'error');
                    return;
                  }
                  
                  const hours = Math.round(((finishDate - startDate) / 3600000) * 100) / 100;
                  const tech = techs.find(t => t.id === techId);
                  
                  store.create('timesheets', {
                    jobId: id,
                    jobNumber: job.number,
                    phaseId: node.id,
                    phaseName: node.name,
                    technicianId: techId,
                    technicianName: tech.name,
                    date: startVal.split('T')[0],
                    startTime: startVal,
                    finishTime: finishVal,
                    description: desc,
                    hours,
                    status: 'Approved'
                  });
                  
                  showToast('Time booked successfully', 'success');
                  renderTabContent();
                  close();
                }}
              ]
            });
         });
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
                        <div class="font-medium">${escapeHTML(m.name)}</div>
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
                    ${getStockOptionsHtml()}
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
        cachedStockOptionsHtml = null; // Invalidate cache
        
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
                      <button class="btn btn-icon btn-sm btn-ghost btn-delete-activity" data-id="${escapeHTML(log.id)}" style="position:absolute;top:4px;right:4px;padding:2px;min-height:24px;min-width:24px"><span class="material-icons-outlined" style="font-size:14px">close</span></button>
                    </div>
                    ${log.type === 'note' ? `<div style="font-size:var(--font-size-sm);white-space:pre-wrap">${escapeHTML(log.content)}</div>` :
                      `<div style="display:flex;align-items:center;gap:12px;border:1px solid var(--border-color);padding:8px;border-radius:4px;background:var(--card-bg);width:fit-content;max-width:100%">
                         ${log.file.type && log.file.type.startsWith('image/') ? 
                            `<div style="width:40px;height:40px;background:url('${escapeHTML(log.file.data)}') center/cover;border-radius:4px"></div>` :
                            `<span class="material-icons-outlined" style="font-size:32px;color:var(--text-tertiary)">description</span>`
                         }
                         <div style="overflow:hidden">
                           <div class="truncate font-medium" style="font-size:var(--font-size-sm);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;max-width:200px" title="${escapeHTML(log.file.name)}">${escapeHTML(log.file.name)}</div>
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
                    <td>${escapeHTML(t.technicianName)}</td>
                    <td class="text-secondary">${escapeHTML(t.description || '—')}</td>
                    <td style="text-align:right;font-weight:600">${t.hours}</td>
                    <td><span class="badge ${t.status === 'Approved' ? 'badge-success' : t.status === 'Rejected' ? 'badge-danger' : 'badge-warning'}">${t.status}</span></td>
                  </tr>
                `).join('') : '<tr><td colspan="5" style="text-align:center;padding:20px" class="text-secondary">No time logged yet</td></tr>'}
              </tbody>
            </table>
          </div>
        </div>
      `;
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
                    <td class="font-medium">${escapeHTML(f.type)}</td>
                    <td>${new Date(f.date).toLocaleString()}</td>
                    <td>${escapeHTML(f.completedBy || 'System')}</td>
                  </tr>
                `).join('') : '<tr><td colspan="3" style="text-align:center;padding:20px" class="text-secondary">No forms completed yet</td></tr>'}
              </tbody>
            </table>
          </div>
        </div>
      `;

      tc.querySelector('#btn-add-form')?.addEventListener('click', () => {
        const content = document.createElement('div');
        content.innerHTML = `
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
          `;
        showModal({
          title: 'Complete Form',
          content,
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
                    <td><a href="#/purchase-orders/${escapeHTML(p.id)}">${escapeHTML(p.number)}</a></td>
                    <td>${escapeHTML(p.supplierName || '—')}</td>
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
                    <td><a href="#/invoices/${escapeHTML(i.id)}">${escapeHTML(i.number)}</a></td>
                    <td><span class="badge badge-neutral">${escapeHTML(i.invoiceType || 'Standard')}</span></td>
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
        const content = document.createElement('div');
        content.innerHTML = `
            <div class="form-group">
              <label class="form-label">Percentage Complete (%)</label>
              <input type="number" id="progress-percent" class="form-input" min="1" max="100" value="50" />
            </div>
          `;
        showModal({
          title: 'Create Progress Invoice',
          content,
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
      const content = document.createElement('div');
      content.innerHTML = `<p>Delete job <strong>${escapeHTML(job.number)}</strong>?</p>`;
      showModal({
        title: 'Delete Job', content,
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
