import { store } from '../data/store.js';
import { showModal } from '../components/Modal.js';
import { showToast } from '../components/Notifications.js';
import { escapeHTML } from './security.js';

export function showTimesheetEditModal(timesheetId, onSaveCallback) {
  const ts = store.getById('timesheets', timesheetId);
  if (!ts) return;

  const currentUser = JSON.parse(localStorage.getItem('currentUser') || '{}');
  const pathBreadcrumbs = {};
  const idToPath = {};

  function populateBreadcrumbs(tasks, currentPath = [], currentNamePath = []) {
    if (!tasks) return;
    tasks.forEach((p, i) => {
      const pathStr = [...currentPath, i].join('-');
      const namePath = [...currentNamePath, p.name].join(' > ');
      pathBreadcrumbs[pathStr] = namePath;
      if (p.id) idToPath[p.id] = pathStr;
      if (p.subTasks) {
        populateBreadcrumbs(p.subTasks, [...currentPath, i], [...currentNamePath, p.name]);
      }
    });
  }

  function buildTreeHTML(tasks, currentPath = []) {
    if (!tasks || tasks.length === 0) return '';
    return tasks.map((p, i) => {
      const path = [...currentPath, i];
      const pathStr = path.join('-');
      const hasSubs = p.subTasks && p.subTasks.length > 0;
      
      return `
        <div class="tree-node" style="margin: 2px 0;">
          <div class="tree-node-row ${hasSubs ? 'parent-node' : 'leaf-node'}" data-path="${pathStr}" data-name="${escapeHTML(p.name)}" style="display:flex; justify-content:space-between; align-items:center;">
            <div style="display:flex; align-items:center; flex-grow:1;">
              ${hasSubs ? `
                <span class="material-icons-outlined tree-node-toggle" data-path="${pathStr}" style="font-size:16px; margin-right:4px;">chevron_right</span>
              ` : `
                <span class="material-icons-outlined" style="font-size:14px; margin-right:6px; color:var(--text-tertiary);">subdirectory_arrow_right</span>
              `}
              <span class="node-name" style="font-weight:${hasSubs ? '600' : '400'}">${escapeHTML(p.name)}</span>
            </div>
            ${hasSubs ? `
              <span style="font-size:10px; background:var(--content-bg); padding:2px 6px; border-radius:10px; color:var(--text-secondary)">${p.subTasks.length} subtasks</span>
            ` : ''}
          </div>
          ${hasSubs ? `
            <div class="tree-node-children" id="children-${pathStr}" style="display:none; padding-left:18px; border-left:1px dashed var(--border-color); margin-left:10px;">
              ${buildTreeHTML(p.subTasks, path)}
            </div>
          ` : ''}
        </div>
      `;
    }).join('');
  }

  const startStr = ts.startTime || `${ts.date}T09:00`;
  const finishStr = ts.finishTime || `${ts.date}T10:00`;
  const technicians = store.getAll('technicians');
  const activeJobs = store.getAll('jobs').filter(j => j.status !== 'Completed' && j.status !== 'Invoiced' || j.id === ts.jobId);

  const content = document.createElement('div');
  content.innerHTML = `
    <style>
      .tree-node-row {
        display: flex;
        align-items: center;
        padding: 6px 10px;
        border-radius: var(--border-radius-sm);
        font-size: 13px;
        transition: all 0.2s ease;
      }
      .tree-node-row.parent-node {
        cursor: pointer;
        color: var(--text-primary);
      }
      .tree-node-row.parent-node:hover {
        background: rgba(0, 0, 0, 0.03);
      }
      .tree-node-row.leaf-node {
        cursor: pointer;
        color: var(--color-primary);
      }
      .tree-node-row.leaf-node:hover {
        background: var(--color-primary-light) !important;
        color: var(--color-primary) !important;
      }
      .tree-node-toggle {
        cursor: pointer;
        user-select: none;
        color: var(--text-secondary);
        display: flex;
        align-items: center;
        justify-content: center;
        width: 20px;
        height: 20px;
        border-radius: 50%;
        transition: all 0.2s;
      }
      .tree-node-toggle:hover {
        background: rgba(0,0,0,0.05);
      }
      .tree-node-toggle.expanded {
        transform: rotate(90deg);
      }
    </style>
    <div class="form-row" style="display:grid; grid-template-columns:1fr 1fr; gap:12px; margin-bottom:12px;">
      <div class="form-group" style="margin:0">
        <label class="form-label">Start Time *</label>
        <input type="datetime-local" class="form-input" id="lt-start" value="${startStr}" style="width:100%" />
      </div>
      <div class="form-group" style="margin:0">
        <label class="form-label">Finish Time *</label>
        <input type="datetime-local" class="form-input" id="lt-finish" value="${finishStr}" style="width:100%" />
      </div>
    </div>
    <div class="form-row" style="display:grid; grid-template-columns:1fr 1fr; gap:12px; margin-bottom:12px;">
      <div class="form-group" style="margin:0">
        <label class="form-label">Technician *</label>
        <select class="form-select" id="lt-tech" style="width:100%" ${(() => {
          const hasTechRecord = technicians.some(t => t.id === currentUser.id);
          return (currentUser.role === 'technician' && hasTechRecord) ? 'disabled' : '';
        })()}>
          <option value="">Select technician...</option>
          ${(() => {
            const hasTechRecord = technicians.some(t => t.id === currentUser.id);
            let html = '';
            if (!hasTechRecord) {
              html += `<option value="${currentUser.id}" ${ts.technicianId === currentUser.id ? 'selected' : ''}>${currentUser.name} (You)</option>`;
            }
            html += technicians.map(t => `<option value="${t.id}" ${ts.technicianId === t.id ? 'selected' : ''}>${t.name}</option>`).join('');
            return html;
          })()}
        </select>
      </div>
      <div class="form-group" style="margin:0">
        <label class="form-label">Job *</label>
        <select class="form-select" id="lt-job" style="width:100%">
          <option value="">Select job...</option>
          ${activeJobs.map(j => `<option value="${j.id}" ${ts.jobId === j.id ? 'selected' : ''}>${j.number} - ${escapeHTML(j.customerName)} (${escapeHTML(j.title)})</option>`).join('')}
        </select>
      </div>
    </div>
    <div class="form-group" style="margin-bottom:12px">
      <label class="form-label">Task *</label>
      <div class="custom-tree-select" id="lt-task-container" style="position:relative;">
        <button class="form-select" id="lt-task-trigger" type="button" style="width:100%; text-align:left; display:flex; justify-content:space-between; align-items:center; background-image:none;">
          <span>Select task...</span>
          <span class="material-icons-outlined" style="font-size:18px; color:var(--text-secondary)">keyboard_arrow_down</span>
        </button>
        <div class="tree-select-dropdown" id="lt-task-dropdown" style="display:none; position:absolute; top:100%; left:0; right:0; z-index:9999; background:var(--card-bg); border:1px solid var(--border-color); border-radius:var(--border-radius); box-shadow:var(--shadow-lg); max-height:280px; overflow-y:auto; padding:8px;">
          <!-- Hierarchical task tree populated here -->
        </div>
        <input type="hidden" id="lt-task" value="${ts.taskId || ts.taskPath || ''}" />
        <input type="hidden" id="lt-task-name" value="${escapeHTML(ts.taskName || '')}" />
      </div>
    </div>
    <div class="form-group" style="margin:0">
      <label class="form-label">Description</label>
      <input type="text" class="form-input" id="lt-desc" value="${escapeHTML(ts.description || '')}" placeholder="Brief description..." style="width:100%" />
    </div>
  `;

  const jobSelect = content.querySelector('#lt-job');
  const taskTrigger = content.querySelector('#lt-task-trigger');
  const taskDropdown = content.querySelector('#lt-task-dropdown');
  const taskHidden = content.querySelector('#lt-task');
  const taskNameHidden = content.querySelector('#lt-task-name');

  // Toggle dropdown
  taskTrigger.addEventListener('click', (ev) => {
    ev.stopPropagation();
    const isVisible = taskDropdown.style.display === 'block';
    taskDropdown.style.display = isVisible ? 'none' : 'block';
  });

  // Close dropdown on click outside
  document.addEventListener('click', (ev) => {
    if (!content.contains(ev.target)) {
      taskDropdown.style.display = 'none';
    }
  });

  // Helper to refresh tasklist inside selector
  function refreshTaskList(jobId, selectedPath) {
    if (!jobId) {
      taskTrigger.innerHTML = '<span>Select a job first...</span><span class="material-icons-outlined" style="font-size:18px; color:var(--text-secondary)">keyboard_arrow_down</span>';
      taskTrigger.disabled = true;
      taskDropdown.style.display = 'none';
      taskHidden.value = '';
      taskNameHidden.value = '';
      return;
    }

    const job = activeJobs.find(j => j.id === jobId);
    if (!job) {
      taskTrigger.innerHTML = '<span>No tasks available</span><span class="material-icons-outlined" style="font-size:18px; color:var(--text-secondary)">keyboard_arrow_down</span>';
      taskTrigger.disabled = true;
      taskDropdown.style.display = 'none';
      taskHidden.value = '';
      taskNameHidden.value = '';
      return;
    }

    if (!job.tasks || job.tasks.length === 0) {
      job.tasks = [{ id: store.generateId(), name: 'Main Task', status: 'Not Started', progress: 0, startDate: new Date().toISOString(), technicians: [], subTasks: [] }];
      store.update('jobs', jobId, { tasks: job.tasks });
    }

    // Populate breadcrumbs dictionary
    for (const k in pathBreadcrumbs) delete pathBreadcrumbs[k];
    for (const k in idToPath) delete idToPath[k];
    populateBreadcrumbs(job.tasks);

    // Build tree HTML
    taskDropdown.innerHTML = buildTreeHTML(job.tasks);
    taskTrigger.disabled = false;

    let finalPath = selectedPath;
    if (finalPath && !pathBreadcrumbs[finalPath] && idToPath[finalPath]) {
      finalPath = idToPath[finalPath];
    }

    if (finalPath && pathBreadcrumbs[finalPath]) {
      taskTrigger.innerHTML = `<span>${escapeHTML(pathBreadcrumbs[finalPath])}</span><span class="material-icons-outlined" style="font-size:18px; color:var(--text-secondary)">keyboard_arrow_down</span>`;
      taskHidden.value = finalPath;
      taskNameHidden.value = pathBreadcrumbs[finalPath];
    } else {
      taskTrigger.innerHTML = '<span>Select a task...</span><span class="material-icons-outlined" style="font-size:18px; color:var(--text-secondary)">keyboard_arrow_down</span>';
      taskHidden.value = '';
      taskNameHidden.value = '';
    }

    // Bind toggle arrows
    taskDropdown.querySelectorAll('.tree-node-toggle').forEach(toggle => {
      toggle.addEventListener('click', (ev) => {
        ev.stopPropagation();
        const pathStr = toggle.dataset.path;
        const childDiv = taskDropdown.querySelector('#children-' + pathStr);
        if (childDiv) {
          const isHidden = childDiv.style.display === 'none';
          childDiv.style.display = isHidden ? 'block' : 'none';
          toggle.classList.toggle('expanded', isHidden);
        }
      });
    });

    // Bind node selection
    taskDropdown.querySelectorAll('.tree-node-row').forEach(row => {
      row.addEventListener('click', (ev) => {
        if (ev.target.classList.contains('tree-node-toggle')) return;

        const pathStr = row.dataset.path;
        const fullName = pathBreadcrumbs[pathStr] || row.dataset.name;

        taskHidden.value = pathStr;
        taskNameHidden.value = fullName;
        taskTrigger.innerHTML = `<span>${escapeHTML(fullName)}</span><span class="material-icons-outlined" style="font-size:18px; color:var(--text-secondary)">keyboard_arrow_down</span>`;
        taskDropdown.style.display = 'none';
      });
    });
  }

  // Initialize with current job/task
  refreshTaskList(ts.jobId, ts.taskPath || ts.taskId);

  // Bind change listener
  jobSelect.addEventListener('change', (e) => {
    refreshTaskList(e.target.value, null);
  });

  showModal({
    title: 'Edit Timesheet Entry',
    content,
    size: 'modal-70',
    actions: [
      { label: 'Cancel', className: 'btn-secondary', onClick: (close) => close() },
      { label: 'Save Changes', className: 'btn-primary', onClick: (close) => {
        const startVal = document.getElementById('lt-start').value;
        const finishVal = document.getElementById('lt-finish').value;
        const techId = document.getElementById('lt-tech').value;
        const jobId = document.getElementById('lt-job').value;
        const taskPathVal = document.getElementById('lt-task').value;
        const taskNameVal = document.getElementById('lt-task-name').value;
        const descVal = document.getElementById('lt-desc').value;

        if (!startVal || !finishVal || !techId || !jobId || !taskPathVal) {
          showToast('Please fill all required fields, including the task', 'error');
          return;
        }

        const startDate = new Date(startVal);
        const finishDate = new Date(finishVal);
        
        if (finishDate <= startDate) {
          showToast('Finish time must be after start time', 'error');
          return;
        }

        const hours = Math.round(((finishDate - startDate) / 3600000) * 100) / 100;
        const tech = technicians.find(t => t.id === techId);
        const job = activeJobs.find(j => j.id === jobId);

        store.update('timesheets', ts.id, {
          jobId: job.id,
          jobNumber: job.number,
          taskId: taskPathVal,
          taskPath: taskPathVal,
          taskName: taskNameVal,
          technicianId: techId,
          technicianName: tech.name,
          date: startVal.split('T')[0],
          startTime: startVal,
          finishTime: finishVal,
          hours,
          description: descVal || ''
        });

        showToast('Timesheet updated successfully', 'success');
        close();
        if (onSaveCallback) onSaveCallback();
      }}
    ]
  });

  import('./clockPicker.js').then(({ initClockPicker }) => {
    initClockPicker(document.getElementById('lt-start'));
    initClockPicker(document.getElementById('lt-finish'));
  });
}
