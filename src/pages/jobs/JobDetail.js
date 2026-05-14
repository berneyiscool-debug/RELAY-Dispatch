// ============================================
// SIMPRO CLONE — JOB DETAIL PAGE
// ============================================

import { store } from '../../data/store.js';
import { router } from '../../router.js';
import { showModal } from '../../components/Modal.js';
import { showDrawer } from '../../components/Drawer.js';
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
  let stagedFiles = [];

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
        <button class="tab ${activeTab === 'quotes' ? 'active' : ''}" data-tab="quotes">Quotes</button>
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
        const techs = store.getAll('technicians');
        const existingSchedules = store.getAll('timesheets').filter(t => t.jobId === id);

        // Build the modal content element
        const content = document.createElement('div');

        function getFlatTasks(phases, currentPath = [], currentNamePath = []) {
          let result = [];
          if (!phases) return result;
          phases.forEach((p, i) => {
            const path = [...currentPath, i].join('-');
            const namePath = [...currentNamePath, p.name].join(' > ');
            result.push({ path, name: namePath, isLeaf: !p.subPhases || p.subPhases.length === 0 });
            if (p.subPhases) {
              result = result.concat(getFlatTasks(p.subPhases, [...currentPath, i], [...currentNamePath, p.name]));
            }
          });
          return result;
        }
        const flatTasks = getFlatTasks(job.phases || []);

        function renderEntries(entries) {
          let html = '';
          entries.forEach((e, i) => {
            html += '<div class="sched-entry" data-index="' + i + '" style="background:var(--card-bg);border:1px solid var(--border-color);border-radius:8px;padding:16px;margin-bottom:12px">';
            html += '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px">';
            html += '<span style="font-weight:600;font-size:13px;color:var(--text-secondary)">Entry ' + (i + 1) + '</span>';
            if (entries.length > 1) {
              html += '<button type="button" class="btn btn-sm btn-danger btn-remove-entry" data-index="' + i + '" style="padding:2px 8px">\u2715 Remove</button>';
            }
            html += '</div>';
            html += '<div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:12px">';
            html += '<div class="form-group" style="margin:0;grid-column:1/-1"><label class="form-label">Task <span class="text-danger">*</span></label>';
            html += '<select class="form-select sched-task" style="width:100%">';
            html += '<option value="">-- Select a Task --</option>';
            flatTasks.forEach(t => {
              html += `<option value="${t.path}" ${e.taskPath === t.path ? 'selected' : ''}>${escapeHTML(t.name)}</option>`;
            });
            html += '</select></div>';
            html += '<div class="form-group" style="margin:0"><label class="form-label">Start</label>';
            html += '<input type="datetime-local" class="form-input sched-start" value="' + e.start + '"></div>';
            html += '<div class="form-group" style="margin:0"><label class="form-label">Finish</label>';
            html += '<input type="datetime-local" class="form-input sched-finish" value="' + e.finish + '"></div>';
            html += '</div>';
            html += '<div class="form-group" style="margin:0"><label class="form-label">Technicians</label>';
            html += '<div style="display:flex;flex-wrap:wrap;gap:8px;margin-top:4px" class="tech-chips">';
            techs.forEach(t => {
              const active = e.techIds.includes(t.id);
              const border = active ? 'var(--color-primary)' : 'var(--border-color)';
              const bg = active ? 'var(--color-primary-light)' : 'transparent';
              const color = active ? 'var(--color-primary)' : 'var(--text-secondary)';
              html += '<label style="display:flex;align-items:center;gap:6px;padding:4px 10px;border:1.5px solid ' + border + ';border-radius:999px;cursor:pointer;font-size:13px;background:' + bg + ';color:' + color + ';transition:all 0.15s">';
              html += '<input type="checkbox" class="tech-check" data-tech-id="' + t.id + '" ' + (active ? 'checked' : '') + ' style="display:none">';
              html += '<span class="material-icons-outlined" style="font-size:14px">person</span>';
              html += escapeHTML(t.name);
              html += '</label>';
            });
            html += '</div></div></div>';
          });
          return html;
        }


        function renderModal(entries) {
          // Inject scoped styles once
          if (!document.getElementById('sched-modal-styles')) {
            const s = document.createElement('style');
            s.id = 'sched-modal-styles';
            s.textContent = '.sched-summary-row{display:flex;gap:8px;padding:6px 0;border-bottom:1px solid var(--border-color);font-size:13px;align-items:center}.sched-summary-row:last-child{border-bottom:none}';
            document.head.appendChild(s);
          }

          let html = '';

          if (existingSchedules.length > 0) {
            html += '<div style="margin-bottom:16px">';
            html += '<div style="font-size:12px;font-weight:600;color:var(--text-tertiary);text-transform:uppercase;letter-spacing:0.5px;margin-bottom:8px">Current Schedule</div>';
            existingSchedules.forEach(s => {
              const dt = new Date(s.startTime || s.date).toLocaleString([], {weekday:'short',month:'short',day:'numeric',hour:'2-digit',minute:'2-digit'});
              html += '<div class="sched-summary-row" style="flex-wrap:wrap">';
              html += '<span class="material-icons-outlined" style="font-size:16px;color:var(--color-primary)">schedule</span>';
              html += '<span style="font-weight:500">' + escapeHTML(s.technicianName) + '</span>';
              html += '<span style="color:var(--text-tertiary);font-size:12px;margin-left:8px;padding-left:8px;border-left:1px solid var(--border-color)">' + escapeHTML(s.taskName || 'General Task') + '</span>';
              html += '<span style="color:var(--text-tertiary);margin-left:auto">' + dt + '</span>';
              html += '<span style="font-weight:600;margin-left:12px">' + s.hours + 'h</span>';
              html += '</div>';
            });
            html += '</div>';
            html += '<hr style="border-color:var(--border-color);margin-bottom:16px">';
          }

          html += '<div style="font-size:12px;font-weight:600;color:var(--text-tertiary);text-transform:uppercase;letter-spacing:0.5px;margin-bottom:12px">New Schedule Entries</div>';
          html += '<div id="sched-entries">' + renderEntries(entries) + '</div>';
          html += '<button type="button" id="btn-add-entry" class="btn btn-secondary btn-sm" style="width:100%;margin-top:4px">';
          html += '<span class="material-icons-outlined" style="font-size:16px">add</span> Add Another Entry</button>';

          content.innerHTML = html;

          // Tech chip toggles
          content.querySelectorAll('.tech-check').forEach(chk => {
            const label = chk.closest('label');
            chk.addEventListener('change', () => {
              if (chk.checked) {
                label.style.borderColor = 'var(--color-primary)';
                label.style.background = 'var(--color-primary-light)';
                label.style.color = 'var(--color-primary)';
              } else {
                label.style.borderColor = 'var(--border-color)';
                label.style.background = 'transparent';
                label.style.color = 'var(--text-secondary)';
              }
            });
          });

          // Remove entry buttons
          content.querySelectorAll('.btn-remove-entry').forEach(btn => {
            btn.addEventListener('click', () => {
              entries.splice(parseInt(btn.dataset.index), 1);
              renderModal(entries);
            });
          });

          // Add another entry
          content.querySelector('#btn-add-entry').addEventListener('click', () => {
            const p = n => n.toString().padStart(2, '0');
            const d = new Date();
            d.setDate(d.getDate() + 1);
            const ds = `${d.getFullYear()}-${p(d.getMonth()+1)}-${p(d.getDate())}`;
            entries.push({ taskPath: '', start: `${ds}T08:00`, finish: `${ds}T16:00`, techIds: [] });
            renderModal(entries);
          });
        }

        // Default first entry: today 8am-4pm, pre-select job's assigned tech if any
        const p = n => n.toString().padStart(2, '0');
        const now2 = new Date();
        const ds = `${now2.getFullYear()}-${p(now2.getMonth()+1)}-${p(now2.getDate())}`;
        const defaultTechIds = job.technicianId ? [job.technicianId] : [];
        const entries = [{ taskPath: '', start: `${ds}T08:00`, finish: `${ds}T16:00`, techIds: defaultTechIds }];
        renderModal(entries);

        function readCurrentEntries() {
          const result = [];
          content.querySelectorAll('.sched-entry').forEach((el, i) => {
            const taskPath = el.querySelector('.sched-task')?.value;
            const start = el.querySelector('.sched-start')?.value;
            const finish = el.querySelector('.sched-finish')?.value;
            const techIds = [...el.querySelectorAll('.tech-check:checked')].map(c => c.dataset.techId);
            result.push({ taskPath, start, finish, techIds });
          });
          return result;
        }

        showModal({
          title: `Schedule Job: ${escapeHTML(job.title || job.number)}`,
          content,
          size: 'modal-70',
          actions: [
            { label: 'Cancel', className: 'btn-secondary', onClick: close => close() },
            { label: 'Save Schedule', className: 'btn-primary', onClick: close => {
              const currentEntries = readCurrentEntries();
              let saved = 0;
              let errors = [];

              currentEntries.forEach((e, i) => {
                if (!e.taskPath) { errors.push(`Entry ${i+1}: please select a task`); return; }
                if (!e.start || !e.finish) { errors.push(`Entry ${i+1}: missing start or finish`); return; }
                const startDate = new Date(e.start);
                const finishDate = new Date(e.finish);
                if (finishDate <= startDate) { errors.push(`Entry ${i+1}: finish must be after start`); return; }
                if (e.techIds.length === 0) { errors.push(`Entry ${i+1}: select at least one technician`); return; }

                const hours = Math.round(((finishDate - startDate) / 3600000) * 100) / 100;
                const taskName = flatTasks.find(t => t.path === e.taskPath)?.name || 'Unknown Task';

                e.techIds.forEach(techId => {
                  const tech = techs.find(t => t.id === techId);
                  if (!tech) return;
                  store.create('timesheets', {
                    jobId: id,
                    jobNumber: job.number,
                    taskPath: e.taskPath,
                    taskName: taskName,
                    technicianId: techId,
                    technicianName: tech.name,
                    date: e.start.split('T')[0],
                    startTime: e.start,
                    finishTime: e.finish,
                    hours,
                    status: 'Approved'
                  });
                  saved++;
                });
              });

              if (errors.length) {
                showToast(errors[0], 'error');
                return;
              }

              // Update job's scheduled date and technicians list from first entry
              if (currentEntries.length > 0 && currentEntries[0].start) {
                const allTechIds = [...new Set(currentEntries.flatMap(e => e.techIds))];
                const jobTechs = allTechIds.map(tid => {
                  const t = techs.find(x => x.id === tid);
                  const totalHours = currentEntries
                    .filter(e => e.techIds.includes(tid))
                    .reduce((sum, e) => {
                      const h = (new Date(e.finish) - new Date(e.start)) / 3600000;
                      return sum + (isNaN(h) ? 0 : h);
                    }, 0);
                  return { id: tid, name: t?.name || '', hours: Math.round(totalHours * 100) / 100 };
                });
                store.update('jobs', id, {
                  scheduledDate: currentEntries[0].start.split('T')[0],
                  technicians: jobTechs,
                  technicianName: jobTechs.map(t => t.name).join(', ')
                });
              }

              showToast(`${saved} schedule ${saved === 1 ? 'entry' : 'entries'} saved`, 'success');
              close();
              renderTabContent();
            }}
          ]
        });
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
            
            showDrawer({
              title: 'Book Time: ' + escapeHTML(node.name),
              content: content.outerHTML,
              actions: [
                { label: 'Cancel', className: 'btn-secondary', onClick: (close) => close() },
                { label: 'Log Time', className: 'btn-primary', onClick: (close) => {
                  const dOverlay = document.querySelector('.drawer-overlay');
                  const startVal = dOverlay.querySelector('#bt-start').value;
                  const finishVal = dOverlay.querySelector('#bt-finish').value;
                  const techId = dOverlay.querySelector('#bt-tech').value;
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
      // Auto-pull materials from quote if empty
      if (!job.materials) {
         const linkedQuotes = store.getAll('quotes').filter(q => q.jobId === id || job.quoteId === q.id);
         const acceptedQuote = linkedQuotes.find(q => q.status === 'Accepted') || store.getById('quotes', job.quoteId);
         
         if (acceptedQuote && acceptedQuote.sections) {
            job.materials = [];
            acceptedQuote.sections.forEach(sec => {
               (sec.lineItems || []).forEach(item => {
                  if (item.type === 'material') {
                     const sMatch = store.getAll('stock').find(s => s.name === item.description);
                     job.materials.push({
                        stockId: sMatch ? sMatch.id : null,
                        name: item.description || 'Unknown Material',
                        quantity: item.qty || 1,
                        unitCost: sMatch ? (sMatch.costPrice || sMatch.unitPrice || 0) : 0
                     });
                  }
               });
            });
            store.update('jobs', id, { materials: job.materials });
         }
      }
      if (!job.materials) job.materials = [];

      // Auto-calculate labor from timesheets
      const timesheets = store.getAll('timesheets').filter(t => t.jobId === id);
      const allTechs = store.getAll('technicians');
      const loggedLabor = {};
      let totalLoggedHours = 0;
      let totalLaborCost = 0;

      timesheets.forEach(t => {
         if (!loggedLabor[t.technicianId]) {
            const tech = allTechs.find(x => x.id === t.technicianId);
            loggedLabor[t.technicianId] = {
               id: t.technicianId,
               name: t.technicianName || (tech ? tech.name : 'Unknown Tech'),
               hours: 0,
               rate: tech ? (tech.hourlyRate || 85) : 85
            };
         }
         loggedLabor[t.technicianId].hours += (t.hours || 0);
      });
      const autoTechs = Object.values(loggedLabor);
      autoTechs.forEach(t => {
         totalLoggedHours += t.hours;
         totalLaborCost += (t.hours * t.rate);
      });

      // Determine material cost
      const matCost = job.materials.reduce((sum, m) => sum + (m.quantity * (m.unitCost || 0)), 0);
      const additionalMatCost = parseFloat(job.additionalMaterialCost || 0);
      const totalMatCost = matCost + additionalMatCost;

      // Update job properties silently if they changed
      if (job.laborCost !== totalLaborCost || job.estimatedHours !== totalLoggedHours || job.materialCost !== totalMatCost) {
          job.laborCost = totalLaborCost;
          job.estimatedHours = totalLoggedHours;
          job.materialCost = totalMatCost;
          store.update('jobs', id, { laborCost: totalLaborCost, estimatedHours: totalLoggedHours, materialCost: totalMatCost });
      }

      tc.innerHTML = `
        <div class="grid-2">
          <div class="card">
            <div class="card-header"><h4>Technicians & Internal Labor (Auto-Synced)</h4></div>
            <div class="card-body">
              <div style="font-size:12px; color:var(--text-tertiary); margin-bottom:16px;">
                Labor hours are automatically calculated based on timesheets booked against this job's tasks.
              </div>
              <table class="data-table" style="font-size:13px">
                <thead>
                  <tr>
                    <th>Technician</th>
                    <th style="width:80px">Hours</th>
                    <th style="width:80px">Rate</th>
                    <th style="width:100px">Total Cost</th>
                  </tr>
                </thead>
                <tbody>
                  ${autoTechs.map(t => `
                    <tr>
                      <td>${escapeHTML(t.name)}</td>
                      <td style="font-weight:600">${t.hours.toFixed(2)}</td>
                      <td>$${t.rate.toFixed(2)}</td>
                      <td style="font-weight:600">$${(t.hours * t.rate).toFixed(2)}</td>
                    </tr>
                  `).join('')}
                  ${autoTechs.length === 0 ? '<tr><td colspan="4" class="text-secondary" style="text-align:center">No time logged yet. Book time in the TaskLists tab.</td></tr>' : ''}
                </tbody>
              </table>
            </div>
          </div>
          
          <div style="display:flex;flex-direction:column;gap:var(--space-lg)">
            <div class="card">
              <div class="card-header"><h4>Material Costs</h4></div>
              <div class="card-body">
                <div id="materials-container" style="display:flex;flex-direction:column;gap:12px;margin-bottom:16px">
                  ${job.materials.map((m, i) => `
                    <div style="display:flex;justify-content:space-between;align-items:center;padding:8px;border:1px solid var(--border-color);border-radius:4px">
                      <div>
                        <div class="font-medium">${escapeHTML(m.name)}</div>
                        <div class="text-secondary" style="font-size:12px">${m.quantity} x $${(m.unitCost || 0).toFixed(2)}</div>
                      </div>
                      <div style="display:flex; align-items:center; gap:12px">
                        <div class="font-medium">$${(m.quantity * (m.unitCost || 0)).toFixed(2)}</div>
                        <button class="btn btn-ghost btn-sm btn-icon btn-remove-mat" data-index="${i}"><span class="material-icons-outlined" style="color:var(--color-danger);font-size:16px">delete</span></button>
                      </div>
                    </div>
                  `).join('')}
                  ${(job.materials.length === 0) ? '<div class="text-secondary" style="font-size:14px">No materials added.</div>' : ''}
                </div>
                <div style="display:flex;gap:8px">
                  <select class="form-select" id="mat-select" style="flex:2">
                    <option value="">Select from Stock...</option>
                    ${getStockOptionsHtml()}
                  </select>
                  <input type="number" class="form-input" id="mat-qty" value="1" min="1" style="flex:1" />
                  <button class="btn btn-primary" id="btn-add-material">Add Item</button>
                </div>
                <div class="form-group" style="margin-top:16px;margin-bottom:0">
                  <label class="form-label">Manual Add. Cost ($) (Permits, Travel, etc.)</label>
                  <input type="number" class="form-input" id="inp-material-cost" value="${job.additionalMaterialCost || 0}" step="0.01" />
                </div>
              </div>
            </div>

            <div class="card">
              <div class="card-header"><h4>Job Cost Summary</h4></div>
              <div class="card-body">
                <div style="display:flex;justify-content:space-between;padding:8px 0;border-bottom:1px solid var(--border-color)">
                  <span class="text-secondary">Logged Hours</span><span id="sum-hours" class="font-medium">${totalLoggedHours.toFixed(2)}</span>
                </div>
                <div style="display:flex;justify-content:space-between;padding:8px 0;border-bottom:1px solid var(--border-color)">
                  <span class="text-secondary">Labor Cost</span><span id="sum-labor" class="font-medium">$${totalLaborCost.toFixed(2)}</span>
                </div>
                <div style="display:flex;justify-content:space-between;padding:8px 0;border-bottom:1px solid var(--border-color)">
                  <span class="text-secondary">Material Cost</span><span id="sum-mat" class="font-medium">$${totalMatCost.toFixed(2)}</span>
                </div>
                <div style="display:flex;justify-content:space-between;padding:12px 0;font-size:var(--font-size-lg);font-weight:700">
                  <span>Total Internal Cost</span><span id="sum-total">$${(totalLaborCost + totalMatCost).toFixed(2)}</span>
                </div>
                ${job.quoteId ? (() => {
                  const q = store.getById('quotes', job.quoteId);
                  if (!q) return '';
                  const profit = (q.subtotal || 0) - (totalLaborCost + totalMatCost);
                  const margin = (q.subtotal || 0) > 0 ? (profit / q.subtotal) * 100 : 0;
                  return `
                    <div style="display:flex;justify-content:space-between;padding:12px 0;border-top:2px solid var(--border-color);margin-top:8px">
                      <span class="text-secondary">Quoted Revenue (Ex. Tax)</span><span class="font-medium">$${(q.subtotal || 0).toFixed(2)}</span>
                    </div>
                    <div style="display:flex;justify-content:space-between;padding:12px 0;font-size:var(--font-size-lg);font-weight:700;color:${profit >= 0 ? 'var(--color-success)' : 'var(--color-danger)'}">
                      <span>Est. Profit</span><span>$${profit.toFixed(2)} (${margin.toFixed(1)}%)</span>
                    </div>
                  `;
                })() : ''}
              </div>
              <div class="card-footer">
                <button class="btn btn-primary" id="btn-save-costs" style="width:100%"><span class="material-icons-outlined">save</span> Save Additional Costs</button>
              </div>
            </div>
          </div>
        </div>
      `;

      tc.addEventListener('click', (e) => {
        const removeMatBtn = e.target.closest('.btn-remove-mat');
        if (removeMatBtn) {
          const idx = parseInt(removeMatBtn.dataset.index);
          job.materials.splice(idx, 1);
          renderTabContent();
        }
      });

      function updateMaterialCostLive() {
         const addedMat = (job.materials || []).reduce((sum, m) => sum + (m.quantity * (m.unitCost || 0)), 0);
         const addCost = parseFloat(tc.querySelector('#inp-material-cost').value) || 0;
         const m = addedMat + addCost;
         tc.querySelector('#sum-mat').textContent = '$' + m.toFixed(2);
         tc.querySelector('#sum-total').textContent = '$' + (totalLaborCost + m).toFixed(2);
      }

      tc.querySelector('#inp-material-cost')?.addEventListener('input', updateMaterialCostLive);

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
        job.materials.push({
          stockId: stockItem.id,
          name: stockItem.name,
          quantity: qty,
          unitCost: stockItem.costPrice || stockItem.unitPrice || 0
        });

        showToast(`Added ${qty}x ${stockItem.name}`, 'success');
        renderTabContent();
      });

      tc.querySelector('#btn-save-costs')?.addEventListener('click', () => {
        const addCost = parseFloat(tc.querySelector('#inp-material-cost').value) || 0;
        const addedMat = (job.materials || []).reduce((sum, m) => sum + (m.quantity * (m.unitCost || 0)), 0);
        const mat = addedMat + addCost;
        
        job.materialCost = mat;
        job.additionalMaterialCost = addCost;
        
        store.update('jobs', id, {
          materials: job.materials,
          materialCost: mat,
          additionalMaterialCost: addCost
        });
        showToast('Additional costs saved', 'success');
        renderTabContent();
      });
    } else if (activeTab === 'quotes') {
      const linkedQuotes = store.getAll('quotes').filter(q => q.jobId === id || job.quoteId === q.id);
      
      tc.innerHTML = `
        <div class="card" style="margin-bottom:var(--space-lg)">
          <div class="card-header" style="display:flex;justify-content:space-between;align-items:center">
             <h4>Associated Quotes</h4>
             <button class="btn btn-primary btn-sm" id="btn-new-quote"><span class="material-icons-outlined">add</span> New Quote</button>
          </div>
          <div class="card-body" style="padding:0">
            <table class="data-table">
              <thead>
                <tr>
                  <th>Number</th>
                  <th>Title</th>
                  <th>Status</th>
                  <th>Total</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                ${linkedQuotes.length ? linkedQuotes.map(q => `
                  <tr>
                    <td><a href="#/quotes/${q.id}" style="color:var(--color-primary);text-decoration:none;font-weight:500">${escapeHTML(q.number)}</a></td>
                    <td>${escapeHTML(q.title || 'Untitled Quote')}</td>
                    <td><span class="badge ${q.status==='Accepted'?'badge-success':(q.status==='Declined'?'badge-danger':(q.status==='Sent'?'badge-info':'badge-neutral'))}">${escapeHTML(q.status)}</span></td>
                    <td style="font-weight:600">$${(q.total || 0).toFixed(2)}</td>
                    <td style="text-align:right">
                      <a href="#/quotes/${q.id}" class="btn btn-secondary btn-sm">View</a>
                    </td>
                  </tr>
                `).join('') : `<tr><td colspan="5" class="text-secondary" style="text-align:center">No quotes linked to this job.</td></tr>`}
              </tbody>
            </table>
          </div>
        </div>
      `;

      tc.querySelector('#btn-new-quote')?.addEventListener('click', () => {
         const newQ = store.create('quotes', {
            customerId: job.customerId,
            customerName: job.customerName,
            title: job.title,
            jobId: job.id, 
            status: 'Draft',
            version: 1,
            sections: [{ id: store.generateId(), name: 'Main Phase', lineItems: [] }],
            subtotal: 0, tax: 0, total: 0,
            number: 'Q-' + Date.now().toString().slice(-7)
         });
         showToast('Draft quote created', 'success');
         router.navigate('/quotes/' + newQ.id);
      });
    } else if (activeTab === 'activity') {
      if (!job.activityLog) job.activityLog = [];
      // Migrate old logs
      job.activityLog = job.activityLog.map(l => {
         if (l.type === 'note' || l.type === 'attachment') {
            return {
               id: l.id,
               type: 'combined',
               date: l.date,
               content: l.type === 'note' ? l.content : '',
               files: l.type === 'attachment' ? [l.file] : []
            };
         }
         return l;
      });

      tc.innerHTML = `
        <div class="card" style="max-width:800px;margin-bottom:var(--space-lg)">
          <div class="card-body">
            <div style="display:flex;gap:8px;margin-bottom:var(--space-base)">
              <input type="text" class="form-input" id="new-note-input" placeholder="Type a new note..." style="flex:1" />
              <label class="btn btn-secondary" for="upload-attachment" style="cursor:pointer">
                <span class="material-icons-outlined" style="font-size:16px">attach_file</span> Attach
                <input type="file" id="upload-attachment" style="display:none" multiple accept="image/*,.pdf,.doc,.docx" />
              </label>
              <button class="btn btn-primary" id="btn-add-note">Post</button>
            </div>
            
            <div id="staged-files-container" style="display:flex; gap:8px; flex-wrap:wrap; margin-bottom: ${stagedFiles.length ? '16px' : '0'}">
              ${stagedFiles.map((f, i) => `
                <div style="display:flex;align-items:center;background:var(--content-bg);padding:4px 8px;border-radius:4px;font-size:12px;border:1px solid var(--border-color)">
                   <span class="truncate" style="max-width:100px">${escapeHTML(f.name)}</span>
                   <span class="material-icons-outlined text-danger btn-remove-staged" data-idx="${i}" style="font-size:14px;cursor:pointer;margin-left:8px">close</span>
                </div>
              `).join('')}
            </div>
            
            <div class="activity-feed" style="display:flex;flex-direction:column;gap:16px;margin-top:24px">
              ${job.activityLog.length ? job.activityLog.map((log, i) => `
                <div style="display:flex;gap:12px">
                  <div style="width:36px;height:36px;border-radius:50%;background:var(--content-bg);display:flex;align-items:center;justify-content:center;flex-shrink:0;color:var(--text-secondary)">
                    <span class="material-icons-outlined" style="font-size:18px">${(log.files && log.files.length) ? 'attachment' : 'chat_bubble_outline'}</span>
                  </div>
                  <div style="flex:1;background:var(--content-bg);padding:12px;border-radius:var(--border-radius);position:relative;" class="activity-log-item" data-expanded="false">
                    <div style="display:flex;justify-content:space-between;margin-bottom:8px">
                      <span class="text-secondary" style="font-size:var(--font-size-xs)">${new Date(log.date).toLocaleString()}</span>
                      <button class="btn btn-icon btn-sm btn-ghost btn-delete-activity" data-id="${escapeHTML(log.id)}" style="position:absolute;top:4px;right:4px;padding:2px;min-height:24px;min-width:24px;z-index:2"><span class="material-icons-outlined" style="font-size:14px">close</span></button>
                    </div>
                    <div class="activity-content-wrapper" style="max-height: 200px; overflow: hidden; position: relative; transition: max-height 0.3s ease;">
                      ${log.content ? `<div style="font-size:var(--font-size-sm);white-space:pre-wrap;margin-bottom:8px">${escapeHTML(log.content)}</div>` : ''}
                      ${log.files && log.files.length ? `
                        <div style="display:flex; flex-wrap:wrap; gap:8px">
                          ${log.files.map(f => `
                            <div style="display:flex;align-items:center;gap:12px;border:1px solid var(--border-color);padding:8px;border-radius:4px;background:var(--card-bg);width:fit-content;max-width:100%">
                               ${f.type && f.type.startsWith('image/') ? 
                                  `<div style="width:40px;height:40px;background:url('${escapeHTML(f.data)}') center/cover;border-radius:4px"></div>` :
                                  `<span class="material-icons-outlined" style="font-size:32px;color:var(--text-tertiary)">description</span>`
                               }
                               <div style="overflow:hidden">
                                 <div class="truncate font-medium" style="font-size:var(--font-size-sm);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;max-width:200px" title="${escapeHTML(f.name)}">${escapeHTML(f.name)}</div>
                                 <div class="text-secondary" style="font-size:10px">${(f.size / 1024).toFixed(1)} KB</div>
                               </div>
                             </div>
                          `).join('')}
                        </div>
                      ` : ''}
                    </div>
                    <div class="expand-overlay" style="display:none; position:absolute;bottom:0;left:0;right:0;height:40px;background:linear-gradient(transparent, var(--content-bg));align-items:flex-end;justify-content:center;padding-bottom:4px;cursor:pointer;border-bottom-left-radius:var(--border-radius);border-bottom-right-radius:var(--border-radius)">
                       <span class="text-primary font-medium" style="font-size:12px">Expand to view</span>
                    </div>
                  </div>
                </div>
              `).join('') : '<div class="text-secondary text-center" style="padding:24px">No activity yet.</div>'}
            </div>
          </div>
        </div>
      `;

      // Show/Hide expand buttons based on content height
      setTimeout(() => {
         tc.querySelectorAll('.activity-log-item').forEach(item => {
            const wrapper = item.querySelector('.activity-content-wrapper');
            const overlay = item.querySelector('.expand-overlay');
            if (wrapper && wrapper.scrollHeight > 200) {
               overlay.style.display = 'flex';
               item.style.paddingBottom = '32px'; // make room for the overlay
               overlay.addEventListener('click', () => {
                  if (item.dataset.expanded === 'false') {
                     wrapper.style.maxHeight = wrapper.scrollHeight + 'px';
                     overlay.style.background = 'transparent';
                     overlay.innerHTML = '<span class="text-primary font-medium" style="font-size:12px">Collapse</span>';
                     item.dataset.expanded = 'true';
                  } else {
                     wrapper.style.maxHeight = '200px';
                     overlay.style.background = 'linear-gradient(transparent, var(--content-bg))';
                     overlay.innerHTML = '<span class="text-primary font-medium" style="font-size:12px">Expand to view</span>';
                     item.dataset.expanded = 'false';
                  }
               });
            }
         });
      }, 0);

      tc.querySelectorAll('.btn-remove-staged').forEach(btn => {
         btn.addEventListener('click', (e) => {
            const idx = parseInt(e.currentTarget.dataset.idx);
            stagedFiles.splice(idx, 1);
            renderTabContent();
         });
      });

      tc.querySelector('#btn-add-note')?.addEventListener('click', () => {
        const val = tc.querySelector('#new-note-input').value.trim();
        if (!val && !stagedFiles.length) return;
        
        job.activityLog.unshift({
           id: Math.random().toString(36).substr(2,9),
           type: 'combined',
           content: val,
           files: [...stagedFiles],
           date: new Date().toISOString()
        });
        
        store.update('jobs', id, { activityLog: job.activityLog });
        stagedFiles = []; // clear staging
        renderTabContent();
      });

      tc.querySelector('#upload-attachment')?.addEventListener('change', (e) => {
        const files = Array.from(e.target.files);
        if (!files.length) return;
        let processed = 0;
        files.forEach(file => {
          const reader = new FileReader();
          reader.onload = (ev) => {
            stagedFiles.push({
               name: file.name,
               size: file.size,
               type: file.type,
               data: ev.target.result
            });
            processed++;
            if (processed === files.length) {
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
          <div class="card-header" style="display:flex; justify-content:space-between; align-items:center;">
            <h4 style="margin:0">Timesheets (${totalHours} hrs total)</h4>
            <button class="btn btn-sm btn-primary" id="btn-log-time-tab"><span class="material-icons-outlined" style="font-size:16px;">add_task</span> Log Time</button>
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

      tc.querySelector('#btn-log-time-tab')?.addEventListener('click', () => {
        const currentUser = JSON.parse(sessionStorage.getItem('currentUser') || '{}');
        const now = new Date();
        const p = n => n.toString().padStart(2, '0');
        const dateStr = `${now.getFullYear()}-${p(now.getMonth()+1)}-${p(now.getDate())}`;

        const content = document.createElement('div');
        content.innerHTML = `
          <div class="form-row">
            <div class="form-group">
              <label class="form-label">Date *</label>
              <input type="date" class="form-input" id="lt-date" value="${dateStr}" />
            </div>
            <div class="form-group">
              <label class="form-label">Technician *</label>
              <select class="form-select" id="lt-tech">
                <option value="">Select tech...</option>
                ${techs.map(t => `<option value="${t.id}" ${t.name === currentUser.name ? 'selected' : ''}>${t.name}</option>`).join('')}
              </select>
            </div>
          </div>
          <div class="form-row">
            <div class="form-group">
              <label class="form-label">Hours *</label>
              <input type="number" class="form-input" id="lt-hours" value="1" min="0.5" step="0.5" />
            </div>
            <div class="form-group">
              <label class="form-label">Description</label>
              <input type="text" class="form-input" id="lt-desc" placeholder="Brief description..." />
            </div>
          </div>
        `;

        showDrawer({
          title: 'Log Time',
          content: content.outerHTML,
          actions: [
            { label: 'Cancel', className: 'btn-secondary', onClick: (close) => close() },
            { label: 'Save', className: 'btn-primary', onClick: (close) => {
              const dOverlay = document.querySelector('.drawer-overlay');
              const dateVal = dOverlay.querySelector('#lt-date').value;
              const techId = dOverlay.querySelector('#lt-tech').value;
              const hoursVal = parseFloat(dOverlay.querySelector('#lt-hours').value);
              const descVal = dOverlay.querySelector('#lt-desc').value;

              if (!dateVal || !techId || isNaN(hoursVal)) {
                showToast('Please fill all required fields', 'error');
                return;
              }

              const tech = techs.find(t => t.id === techId);
              store.create('timesheets', {
                jobId: id,
                jobNumber: job.number,
                technicianId: techId,
                technicianName: tech.name,
                date: dateVal,
                hours: hoursVal,
                description: descVal,
                status: 'Pending'
              });

              showToast('Time logged successfully', 'success');
              renderTabContent();
              close();
            }}
          ]
        });
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
        showDrawer({
          title: 'Complete Form',
          content: content.outerHTML,
          actions: [
            { label: 'Cancel', className: 'btn-secondary', onClick: (close) => close() },
            { label: 'Submit', className: 'btn-primary', onClick: (close) => {
              const dOverlay = document.querySelector('.drawer-overlay');
              job.forms.push({
                type: dOverlay.querySelector('#new-form-type').value,
                notes: dOverlay.querySelector('#new-form-notes').value,
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
        const suppliers = store.getAll('suppliers'); // Assuming a suppliers collection exists or use basic array
        const stockItems = store.getAll('stock');

        const content = document.createElement('div');
        content.innerHTML = `
          <div class="form-group">
            <label class="form-label">Supplier *</label>
            <input type="text" class="form-input" id="po-supplier" placeholder="e.g. Reece Plumbing" />
          </div>
          <div class="form-group">
            <label class="form-label">Part Required *</label>
            <select class="form-select" id="po-part">
              <option value="">Select or type...</option>
              ${stockItems.map(s => `<option value="${s.id}">${s.name} - $${s.costPrice || 0}</option>`).join('')}
            </select>
          </div>
          <div class="form-row">
            <div class="form-group">
              <label class="form-label">Quantity *</label>
              <input type="number" class="form-input" id="po-qty" value="1" min="1" />
            </div>
            <div class="form-group">
              <label class="form-label">Expected Date</label>
              <input type="date" class="form-input" id="po-date" value="${new Date().toISOString().split('T')[0]}" />
            </div>
          </div>
        `;

        showDrawer({
          title: 'Quick Purchase Order',
          content: content.outerHTML, // Pass HTML string or handle element appending
          actions: [
            { label: 'Cancel', className: 'btn-secondary', onClick: (close) => close() },
            { label: 'Create PO', className: 'btn-primary', onClick: (close) => {
              // Note: showDrawer content is recreated via innerHTML, so we must query the document
              const dOverlay = document.querySelector('.drawer-overlay');
              const supplier = dOverlay.querySelector('#po-supplier').value;
              const partId = dOverlay.querySelector('#po-part').value;
              const qty = parseInt(dOverlay.querySelector('#po-qty').value) || 1;
              const date = dOverlay.querySelector('#po-date').value;

              if (!supplier || !partId) {
                showToast('Supplier and Part are required', 'error');
                return;
              }

              const part = stockItems.find(s => s.id === partId);
              
              store.create('purchaseOrders', {
                number: `PO-${Date.now().toString().slice(-5)}`,
                jobId: id,
                supplierName: supplier,
                issueDate: new Date().toISOString(),
                expectedDate: date,
                status: 'Draft',
                items: [{ stockId: partId, name: part.name, quantity: qty, unitCost: part.costPrice || 0, total: (part.costPrice || 0) * qty }],
                total: (part.costPrice || 0) * qty
              });

              showToast('Quick PO Created', 'success');
              renderTabContent();
              close();
            }}
          ]
        });
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
