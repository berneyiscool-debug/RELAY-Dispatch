// ============================================
// SIMPRO CLONE — JOB FORM (Create/Edit) v2
// ============================================

import { store } from '../../data/store.js';
import { router } from '../../router.js';
import { showToast } from '../../components/Notifications.js';
import { escapeHTML } from '../../utils/security.js';

const AVAILABLE_TAGS = [
  'Urgent', 'Follow-up', 'Warranty', 'Inspection', 'After-Hours',
  'High Value', 'Recurring', 'Compliance', 'Hazardous', 'New Site'
];

export function renderJobForm(container, { id }) {
  const isEdit = id && id !== 'new';
  const job = isEdit ? store.getById('jobs', id) : {};
  const customers = store.getAll('customers');
  const contractors = store.getAll('contractors').filter(c => c.active);

  // Selected tags state
  let selectedTags = job.tags ? [...job.tags] : [];

  function getCustomer(custId) {
    return customers.find(c => c.id === custId) || null;
  }

  function buildSiteOptions(custId, selectedSiteName) {
    const cust = getCustomer(custId);
    if (!cust || !cust.sites || cust.sites.length === 0) {
      return `<option value="">— No sites for this customer —</option>`;
    }
    return `<option value="">Select jobsite...</option>` +
      cust.sites.map((s, i) =>
        `<option value="${i}" data-address="${escapeHTML(s.address)}" data-name="${escapeHTML(s.name)}" ${selectedSiteName === s.name ? 'selected' : ''}>${escapeHTML(s.name)} — ${escapeHTML(s.address)}</option>`
      ).join('');
  }

  function buildContactOptions(custId, selectedContactName, placeholder) {
    const cust = getCustomer(custId);
    if (!cust || !cust.contacts || cust.contacts.length === 0) {
      return `<option value="">— Select customer first —</option>`;
    }
    return `<option value="">${placeholder}</option>` +
      cust.contacts.map((c, i) =>
        `<option value="${i}" ${selectedContactName === c.name ? 'selected' : ''}>${escapeHTML(c.name)} (${escapeHTML(c.role || '')})</option>`
      ).join('');
  }

  function renderTagPills() {
    return AVAILABLE_TAGS.map(tag => {
      const active = selectedTags.includes(tag);
      return `<button type="button" class="tag-pill ${active ? 'tag-pill-active' : ''}" data-tag="${escapeHTML(tag)}">${escapeHTML(tag)}</button>`;
    }).join('');
  }

  const initCustId = job.customerId || '';

  container.innerHTML = `
    <style>
      .tag-pill {
        display:inline-flex; align-items:center; padding:4px 10px;
        border-radius:999px; border:1.5px solid var(--border-color);
        background:var(--bg-color); color:var(--text-secondary);
        font-size:12px; cursor:pointer; transition:all 0.15s; margin:3px;
      }
      .tag-pill:hover { border-color:var(--color-primary); color:var(--color-primary); }
      .tag-pill-active {
        background:var(--color-primary); border-color:var(--color-primary);
        color:#fff;
      }
      .rich-editor-toolbar {
        display:flex; gap:2px; padding:6px 8px;
        background:var(--bg-color); border:1px solid var(--border-color);
        border-bottom:none; border-radius:4px 4px 0 0; flex-wrap:wrap;
      }
      .rich-editor-toolbar button {
        padding:3px 8px; border:1px solid transparent; border-radius:3px;
        background:transparent; cursor:pointer; font-size:13px;
        color:var(--text-primary); min-width:28px;
        transition: background 0.1s;
      }
      .rich-editor-toolbar button:hover { background:var(--border-color); }
      .rich-editor-toolbar button.active { background:var(--color-primary-light); color:var(--color-primary); border-color:var(--color-primary); }
      .rich-editor-toolbar .sep { width:1px; background:var(--border-color); margin:2px 4px; }
      #job-description-editor {
        min-height:160px; padding:12px; border:1px solid var(--border-color);
        border-radius:0 0 4px 4px; background:var(--content-bg);
        color:var(--text-primary); font-size:14px; line-height:1.6;
        outline:none; overflow-y:auto;
      }
      #job-description-editor:focus { border-color:var(--color-primary); }
      #job-description-editor h1,#job-description-editor h2,#job-description-editor h3 { margin:8px 0 4px; }
      #job-description-editor ul,#job-description-editor ol { padding-left:20px; }
      #job-description-editor blockquote { border-left:3px solid var(--color-primary); padding-left:10px; color:var(--text-secondary); margin:8px 0; }
      .site-address-hint { font-size:11px; color:var(--text-tertiary); margin-top:3px; font-style:italic; }
    </style>
    <div class="page-header">
      <h1>${isEdit ? 'Edit Job' : 'New Job'}</h1>
      <div class="page-header-actions">
        <button class="btn btn-secondary" id="btn-cancel">Cancel</button>
        <button class="btn btn-primary" id="btn-save"><span class="material-icons-outlined">save</span> ${isEdit ? 'Update' : 'Create'} Job</button>
      </div>
    </div>
    <div class="tabs" id="job-form-tabs" style="margin-bottom:16px">
      <button type="button" class="tab active" data-tab="details">Details</button>
      <button type="button" class="tab" data-tab="phases">TaskLists / Phases</button>
    </div>
    
    <div id="jf-tab-details">
      <div class="card">
        <div class="card-body">
          <form id="job-form">

          <!-- Title -->
          <div class="form-group">
            <label class="form-label">Title *</label>
            <input class="form-input" name="title" value="${escapeHTML(job.title || '')}" required placeholder="e.g. Electrical fault repair — Main Office" />
          </div>

          <!-- Customer + Type -->
          <div class="form-row">
            <div class="form-group">
              <label class="form-label">Customer *</label>
              <select class="form-select" id="jf-customer" name="customerId" required>
                <option value="">Select customer...</option>
                ${customers.map(c => `<option value="${c.id}" ${job.customerId === c.id ? 'selected' : ''}>${escapeHTML(c.company)}</option>`).join('')}
              </select>
            </div>
            <div class="form-group">
              <label class="form-label">Type</label>
              <select class="form-select" name="type">
                ${['Electrical','Plumbing','HVAC','Fire Protection','Security','General Maintenance'].map(t => `<option ${job.type === t ? 'selected' : ''}>${t}</option>`).join('')}
              </select>
            </div>
          </div>

          <!-- Jobsite -->
          <div class="form-group">
            <label class="form-label">Jobsite</label>
            <select class="form-select" id="jf-site" name="siteId" ${!initCustId ? 'disabled' : ''}>
              ${buildSiteOptions(initCustId, job.siteId)}
            </select>
            <div class="site-address-hint" id="jf-site-hint">${job.siteAddress ? escapeHTML(job.siteAddress) : 'Select a customer to enable jobsite selection'}</div>
          </div>

          <!-- Primary Contact + Additional Contact -->
          <div class="form-row">
            <div class="form-group">
              <label class="form-label">Primary Contact</label>
              <select class="form-select" id="jf-primary-contact" name="primaryContactId" ${!initCustId ? 'disabled' : ''}>
                ${buildContactOptions(initCustId, job.primaryContactId, 'Select primary contact...')}
              </select>
            </div>
            <div class="form-group">
              <label class="form-label">Additional Contact</label>
              <select class="form-select" id="jf-additional-contact" name="additionalContactId" ${!initCustId ? 'disabled' : ''}>
                ${buildContactOptions(initCustId, job.additionalContactId, 'None')}
              </select>
            </div>
          </div>

          <!-- Status + Priority -->
          <div class="form-row">
            <div class="form-group">
              <label class="form-label">Status</label>
              <select class="form-select" name="status">
                ${['Pending','Scheduled','In Progress','On Hold','Completed','Invoiced'].map(s => `<option ${job.status === s ? 'selected' : ''}>${s}</option>`).join('')}
              </select>
            </div>
            <div class="form-group">
              <label class="form-label">Priority</label>
              <select class="form-select" name="priority" id="job-priority">
                ${['Low','Medium','High','Urgent'].map(p => `<option ${job.priority === p ? 'selected' : ''}>${p}</option>`).join('')}
              </select>
            </div>
          </div>

          <!-- Contractor -->
          <div class="form-group">
            <label class="form-label">Assign to Contractor (Optional)</label>
            <select class="form-select" name="contractorId">
              <option value="">None (Internal Techs)</option>
              ${contractors.map(c => `<option value="${c.id}" ${job.contractorId === c.id ? 'selected' : ''}>${escapeHTML(c.businessName)}</option>`).join('')}
            </select>
          </div>

          <!-- Tags -->
          <div class="form-group">
            <label class="form-label">Tags</label>
            <div id="jf-tags" style="display:flex;flex-wrap:wrap;gap:2px;margin-top:4px;">
              ${renderTagPills()}
            </div>
          </div>

          <!-- Emergency -->
          <div class="form-row">
            <div class="form-group" style="display:flex;align-items:center;gap:8px">
              <input type="checkbox" id="is-emergency" style="width:16px;height:16px" ${job.isEmergency ? 'checked' : ''} />
              <label class="form-label" style="margin:0; color:var(--color-danger);" for="is-emergency">Is Emergency (Applies Callout Fee)</label>
            </div>
          </div>
          <div id="emergency-dispatch-suggestion" style="display:none; background:var(--color-warning-bg); border:1px solid var(--color-warning); padding:15px; border-radius:8px; margin-bottom:15px;">
            <strong>Emergency Dispatch Suggestion:</strong>
            <p style="margin:5px 0 0 0;" id="dispatch-reason">Loading best technician...</p>
          </div>

          ${!isEdit ? `
          <div class="form-row">
            <div class="form-group" style="display:flex;align-items:center;gap:8px">
              <input type="checkbox" id="is-recurring" style="width:16px;height:16px" />
              <label class="form-label" style="margin:0" for="is-recurring">Recurring Job</label>
            </div>
          </div>
          <div class="form-row" id="recurring-options" style="display:none;background:var(--card-bg);padding:16px;border-radius:4px;border:1px solid var(--border-color);margin-bottom:16px">
            <div class="form-group">
              <label class="form-label">Frequency</label>
              <select class="form-select" id="recurring-freq">
                <option value="Weekly">Weekly</option>
                <option value="Monthly">Monthly</option>
                <option value="Daily">Daily</option>
              </select>
            </div>
            <div class="form-group">
              <label class="form-label">First Job Date</label>
              <input type="date" class="form-input" id="recurring-start" value="${new Date().toISOString().split('T')[0]}" />
            </div>
            <div class="form-group">
              <label class="form-label">End Date (Max 50 occurrences)</label>
              <input type="date" class="form-input" id="recurring-end" />
            </div>
          </div>
          ` : ''}

          <!-- Rich Description Editor -->
          <div class="form-group">
            <label class="form-label">Description</label>
            <div class="rich-editor-toolbar" id="editor-toolbar">
              <button type="button" data-cmd="bold" title="Bold"><b>B</b></button>
              <button type="button" data-cmd="italic" title="Italic"><i>I</i></button>
              <button type="button" data-cmd="underline" title="Underline"><u>U</u></button>
              <div class="sep"></div>
              <button type="button" data-cmd="formatBlock" data-val="h2" title="Heading">H2</button>
              <button type="button" data-cmd="formatBlock" data-val="h3" title="Subheading">H3</button>
              <button type="button" data-cmd="formatBlock" data-val="p" title="Paragraph">P</button>
              <div class="sep"></div>
              <button type="button" data-cmd="insertUnorderedList" title="Bullet List">&#8226; List</button>
              <button type="button" data-cmd="insertOrderedList" title="Numbered List">1. List</button>
              <div class="sep"></div>
              <button type="button" data-cmd="formatBlock" data-val="blockquote" title="Blockquote">&#8220; Quote</button>
              <button type="button" data-cmd="removeFormat" title="Clear Formatting">&#10006; Clear</button>
              <div class="sep"></div>
              <button type="button" id="editor-link-btn" title="Insert Link">&#128279; Link</button>
            </div>
            <div id="job-description-editor" contenteditable="true" spellcheck="true">${job.description || job.notes || ''}</div>
          </div>

        </form>
      </div>
        </form>
      </div>
    </div>
  </div>
  
  <div id="jf-tab-phases" style="display:none;">
    <div id="jf-task-container"></div>
  </div>
  `;

  // ---- Tabs ----
  container.querySelectorAll('#job-form-tabs .tab').forEach(tab => {
    tab.addEventListener('click', e => {
      container.querySelectorAll('#job-form-tabs .tab').forEach(t => t.classList.remove('active'));
      e.currentTarget.classList.add('active');
      const t = e.currentTarget.dataset.tab;
      container.querySelector('#jf-tab-details').style.display = t === 'details' ? 'block' : 'none';
      container.querySelector('#jf-tab-phases').style.display = t === 'phases' ? 'block' : 'none';
      if (t === 'phases') renderFormTasks();
    });
  });

  // ---- Customer change → update site & contact dropdowns ----
  const custSelect = container.querySelector('#jf-customer');
  const siteSelect = container.querySelector('#jf-site');
  const siteHint = container.querySelector('#jf-site-hint');
  const primaryContactSel = container.querySelector('#jf-primary-contact');
  const additionalContactSel = container.querySelector('#jf-additional-contact');

  function refreshCustomerDependents(custId) {
    const disabled = !custId;
    siteSelect.innerHTML = buildSiteOptions(custId, '');
    siteSelect.disabled = disabled;
    primaryContactSel.innerHTML = buildContactOptions(custId, '', 'Select primary contact...');
    primaryContactSel.disabled = disabled;
    additionalContactSel.innerHTML = buildContactOptions(custId, '', 'None');
    additionalContactSel.disabled = disabled;
    siteHint.textContent = disabled ? 'Select a customer to enable jobsite selection' : 'Select a jobsite above';
  }

  custSelect.addEventListener('change', e => refreshCustomerDependents(e.target.value));

  // Site hint update on site change
  siteSelect.addEventListener('change', e => {
    const opt = e.target.selectedOptions[0];
    siteHint.textContent = opt?.dataset.address || '';
  });

  // ---- Tags ----
  container.querySelector('#jf-tags').addEventListener('click', e => {
    const pill = e.target.closest('.tag-pill');
    if (!pill) return;
    const tag = pill.dataset.tag;
    if (selectedTags.includes(tag)) {
      selectedTags = selectedTags.filter(t => t !== tag);
      pill.classList.remove('tag-pill-active');
    } else {
      selectedTags.push(tag);
      pill.classList.add('tag-pill-active');
    }
  });

  // ---- Rich Text Editor ----
  const editor = container.querySelector('#job-description-editor');
  const toolbar = container.querySelector('#editor-toolbar');

  toolbar.addEventListener('mousedown', e => {
    const btn = e.target.closest('button[data-cmd]');
    if (!btn) return;
    e.preventDefault();
    const cmd = btn.dataset.cmd;
    const val = btn.dataset.val || null;
    document.execCommand(cmd, false, val);
    editor.focus();
  });

  container.querySelector('#editor-link-btn').addEventListener('click', () => {
    const url = prompt('Enter URL:', 'https://');
    if (url) document.execCommand('createLink', false, url);
    editor.focus();
  });

  // Toolbar active state
  editor.addEventListener('keyup', updateToolbarState);
  editor.addEventListener('mouseup', updateToolbarState);
  function updateToolbarState() {
    toolbar.querySelectorAll('button[data-cmd]').forEach(btn => {
      try {
        btn.classList.toggle('active', document.queryCommandState(btn.dataset.cmd));
      } catch {}
    });
  }

  // ---- Emergency toggle ----
  const emergencyToggle = container.querySelector('#is-emergency');
  const suggestionBox = container.querySelector('#emergency-dispatch-suggestion');
  const dispatchReason = container.querySelector('#dispatch-reason');
  const prioritySelect = container.querySelector('#job-priority');

  function updateEmergencyUI(isEmg) {
    if (isEmg) {
      prioritySelect.value = 'Urgent';
      suggestionBox.style.display = 'block';
      const techs = store.getAll('people').filter(p => p.type === 'Staff');
      if (techs.length > 0) {
        const t = techs[Math.floor(Math.random() * techs.length)];
        const mins = Math.floor(Math.random() * 15) + 5;
        dispatchReason.innerHTML = `Based on current GPS location, <strong>${t.firstName} ${t.lastName}</strong> is the most suitable technician (approx. ${mins} mins away).`;
      } else {
        dispatchReason.innerHTML = 'No internal technicians available for dispatch.';
      }
    } else {
      suggestionBox.style.display = 'none';
    }
  }

  emergencyToggle?.addEventListener('change', e => updateEmergencyUI(e.target.checked));
  if (job.isEmergency) updateEmergencyUI(true);

  // ---- Recurring ----
  if (!isEdit) {
    const isRecurring = container.querySelector('#is-recurring');
    const recurringOptions = container.querySelector('#recurring-options');
    isRecurring?.addEventListener('change', e => {
      recurringOptions.style.display = e.target.checked ? 'flex' : 'none';
    });
  }

  // ---- Cancel ----
  container.querySelector('#btn-cancel').addEventListener('click', () =>
    router.navigate(isEdit ? `/jobs/${id}` : '/jobs')
  );

  // ==== Task List Management ====
  let jobPhases = job.phases ? JSON.parse(JSON.stringify(job.phases)) : [{ id: store.generateId(), name: 'Main Task', status: 'Not Started', progress: 0, estimatedHours: 2, people: 1, subPhases: [] }];
  jobPhases.forEach(p => { if (!p.subPhases) p.subPhases = []; });

  let taskExpandedPath = [0];
  let taskViewPath = [];
  let isInfoPanelEditing = true; // Default to editing in Job Form

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

  function renderFormTasks() {
    const tc = container.querySelector('#jf-task-container');
    if (!tc) return;

    // Cleanup invalid paths
    let isValidPath = true;
    let curr = jobPhases;
    for (let i=0; i<taskExpandedPath.length; i++) {
       if (!curr || !curr[taskExpandedPath[i]]) { isValidPath = false; break; }
       curr = curr[taskExpandedPath[i]].subPhases;
    }
    if (!isValidPath) taskExpandedPath = [];

    const viewParentNode = taskViewPath.length > 0 ? getPhaseByPath(jobPhases, taskViewPath) : null;
    const viewList = viewParentNode ? (viewParentNode.subPhases || []) : jobPhases;
    const viewTitle = viewParentNode ? escapeHTML(viewParentNode.name) : 'Main Tasks';

    tc.innerHTML = `
      <div class="card" style="margin-bottom:var(--space-lg)">
        <div class="card-body" style="padding:16px; display:flex; gap:16px; overflow-x:auto; min-height:400px; align-items:stretch">
          
          <!-- Drill-Down List -->
          <div style="flex: 0 0 300px; display:flex; flex-direction:column; border:1px solid var(--border-color); border-radius:4px; background:var(--content-bg);">
            <div style="padding:12px; border-bottom:1px solid var(--border-color); font-weight:600; display:flex; justify-content:space-between; align-items:center">
              <div style="display:flex; align-items:center; gap:8px; overflow:hidden">
                ${taskViewPath.length > 0 ? `<button type="button" class="btn btn-ghost btn-sm btn-icon btn-view-back" title="Back"><span class="material-icons-outlined" style="font-size:18px">arrow_back</span></button>` : ''}
                <span style="white-space:nowrap; overflow:hidden; text-overflow:ellipsis" title="${viewTitle}">${viewTitle}</span>
              </div>
              ${taskViewPath.length === 0 ? `<button type="button" class="btn btn-ghost btn-sm btn-icon" id="btn-add-main-task" title="Add Main Task"><span class="material-icons-outlined">add</span></button>` : `<button type="button" class="btn btn-ghost btn-sm btn-icon btn-add-child-task" data-path="${taskViewPath.join('-')}" title="Add Task"><span class="material-icons-outlined">add</span></button>`}
            </div>
            <div style="padding:8px; display:flex; flex-direction:column; gap:4px; overflow-y:auto; flex:1">
              ${viewList.map((p, i) => {
                const currentPath = [...taskViewPath, i];
                const isSelected = currentPath.join('-') === taskExpandedPath.join('-');
                return `
                  <div class="task-list-item" data-path="${currentPath.join('-')}" style="padding:8px; border-radius:4px; cursor:pointer; display:flex; justify-content:space-between; align-items:center; ${isSelected ? 'background:var(--color-primary-light); color:var(--color-primary)' : 'background:var(--bg-color)'}">
                    <span style="font-weight:${isSelected ? '600' : '400'}; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; flex:1;" title="${escapeHTML(p.name)}">${escapeHTML(p.name)}</span>
                    ${p.subPhases && p.subPhases.length > 0 ? `<button type="button" class="btn btn-ghost btn-icon btn-sm btn-drill-down" data-path="${currentPath.join('-')}" style="margin-left:8px; padding:2px; min-width:24px; min-height:24px; color:inherit"><span class="material-icons-outlined" style="font-size:18px">chevron_right</span></button>` : ''}
                  </div>
                `;
              }).join('')}
              ${viewList.length === 0 ? '<div style="color:var(--text-tertiary);font-size:12px;text-align:center;padding:12px">No tasks</div>' : ''}
            </div>
          </div>

          <!-- Task Details Form -->
          ${taskExpandedPath.length > 0 ? (() => {
            const path = taskExpandedPath;
            const node = getPhaseByPath(jobPhases, path);
            if (!node) return '';
            const hasSubs = node.subPhases && node.subPhases.length > 0;
            return `
              <div style="flex: 1; min-width:300px; display:flex; flex-direction:column; border:1px solid var(--border-color); border-radius:4px; background:var(--content-bg); padding:16px">
                <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:16px">
                  <h4 style="margin:0; white-space:nowrap; overflow:hidden; text-overflow:ellipsis" title="${escapeHTML(node.name)}">Task Settings</h4>
                  <div style="display:flex;gap:8px">
                    ${path.length < 3 ? `<button type="button" class="btn btn-sm btn-secondary btn-add-child-task" data-path="${path.join('-')}" title="Add Sub-task"><span class="material-icons-outlined" style="font-size:16px">add_task</span> Add Sub-task</button>` : ''}
                    <button type="button" class="btn btn-sm btn-danger btn-remove-task" data-path="${path.join('-')}"><span class="material-icons-outlined" style="font-size:16px">delete</span></button>
                  </div>
                </div>
                <div class="form-group">
                  <label class="form-label">Task Name</label>
                  <input type="text" class="form-input detail-input" data-field="name" value="${escapeHTML(node.name)}" />
                </div>
                ${!hasSubs ? `
                <div class="form-row">
                  <div class="form-group">
                    <label class="form-label">Start Date</label>
                    <input type="date" class="form-input detail-input" data-field="startDate" value="${node.startDate ? node.startDate.split('T')[0] : ''}" />
                  </div>
                  <div class="form-group">
                    <label class="form-label">Estimated Hours</label>
                    <input type="number" class="form-input detail-input" data-field="estimatedHours" value="${node.estimatedHours || ''}" min="0" step="0.5" />
                  </div>
                  <div class="form-group">
                    <label class="form-label">People</label>
                    <input type="number" class="form-input detail-input" data-field="people" value="${node.people || '1'}" min="1" step="1" />
                  </div>
                </div>
                ` : '<div style="margin-bottom:16px;color:var(--text-tertiary);font-size:13px;font-style:italic">This task has sub-tasks. Hours are calculated automatically.</div>'}
                <div class="form-group">
                  <label class="form-label">Description</label>
                  <textarea class="form-input detail-input" data-field="description" rows="3">${escapeHTML(node.description || '')}</textarea>
                </div>
              </div>
            `;
          })() : ''}
        </div>
      </div>
    `;

    tc.querySelector('.btn-view-back')?.addEventListener('click', () => {
       taskViewPath.pop();
       renderFormTasks();
    });

    tc.querySelectorAll('.btn-drill-down').forEach(el => {
       el.addEventListener('click', (e) => {
          e.stopPropagation();
          taskViewPath = el.dataset.path.split('-').map(Number);
          taskExpandedPath = [...taskViewPath];
          renderFormTasks();
       });
    });

    tc.querySelectorAll('.task-list-item').forEach(el => {
       el.addEventListener('click', () => {
          taskExpandedPath = el.dataset.path.split('-').map(Number);
          renderFormTasks();
       });
    });

    tc.querySelector('#btn-add-main-task')?.addEventListener('click', () => {
       jobPhases.push({ id: store.generateId(), name: 'New Task', status: 'Not Started', progress: 0, startDate: new Date().toISOString(), technicians: [], subPhases: [] });
       taskExpandedPath = [jobPhases.length - 1];
       renderFormTasks();
    });

    tc.querySelectorAll('.btn-add-child-task').forEach(el => {
       el.addEventListener('click', () => {
          const path = el.dataset.path.split('-').map(Number);
          const node = getPhaseByPath(jobPhases, path);
          if (node) {
             if (!node.subPhases) node.subPhases = [];
             node.subPhases.push({ id: store.generateId(), name: 'New Sub-task', status: 'Not Started', progress: 0, startDate: new Date().toISOString(), technicians: [], subPhases: [] });
             taskExpandedPath = [...path, node.subPhases.length - 1];
             taskViewPath = [...path];
             renderFormTasks();
          }
       });
    });

    tc.querySelectorAll('.btn-remove-task').forEach(el => {
       el.addEventListener('click', () => {
          if (!confirm('Are you sure you want to delete this task?')) return;
          const path = el.dataset.path.split('-').map(Number);
          if (path.length === 1) {
             jobPhases.splice(path[0], 1);
             taskExpandedPath = jobPhases.length > 0 ? [0] : [];
          } else {
             const parent = getPhaseByPath(jobPhases, path.slice(0, -1));
             if (parent && parent.subPhases) {
                parent.subPhases.splice(path[path.length - 1], 1);
                taskExpandedPath = [...path.slice(0, -1)];
             }
          }
          renderFormTasks();
       });
    });

    tc.querySelectorAll('.detail-input').forEach(inp => {
       inp.addEventListener('input', e => {
          const field = e.target.dataset.field;
          const val = e.target.value;
          const node = getPhaseByPath(jobPhases, taskExpandedPath);
          if (node) {
             if (field === 'estimatedHours') node[field] = parseFloat(val) || 0;
             else if (field === 'people') node[field] = parseInt(val) || 1;
             else node[field] = val;
             
             // specifically handle name update directly to avoid full re-render on every keystroke
             if (field === 'name') {
               const li = tc.querySelector(`.task-list-item[data-path="${taskExpandedPath.join('-')}"] span:first-child`);
               if (li) { li.textContent = val; li.title = val; }
               const h4 = tc.querySelector('h4[title]');
               if (h4) { h4.textContent = 'Task Settings: ' + val; h4.title = val; }
             }
          }
       });
       
       inp.addEventListener('change', () => renderFormTasks());
    });
  }

  // ==== Form Submit / Save ====
  container.querySelector('#btn-save').addEventListener('click', () => {
    const form = container.querySelector('#job-form');
    if (!form.checkValidity()) {
      // Force switch back to Details tab to show validation error
      container.querySelectorAll('#job-form-tabs .tab').forEach(t => t.classList.remove('active'));
      container.querySelector('#job-form-tabs .tab[data-tab="details"]').classList.add('active');
      container.querySelector('#jf-tab-details').style.display = 'block';
      container.querySelector('#jf-tab-phases').style.display = 'none';
      form.reportValidity();
      return;
    }
    const data = Object.fromEntries(new FormData(form));

    const custId = data.customerId;
    const cust = customers.find(c => c.id === custId);
    data.customerName = cust?.company || '';

    // Resolve site
    const selSiteOpt = siteSelect.selectedOptions[0];
    data.siteAddress = selSiteOpt?.dataset.address || '';
    data.siteName = selSiteOpt?.dataset.name || '';

    // Resolve contacts by index
    const priIdx = parseInt(data.primaryContactId);
    const addIdx = parseInt(data.additionalContactId);
    const primaryContact = !isNaN(priIdx) ? cust?.contacts?.[priIdx] : null;
    const additionalContact = !isNaN(addIdx) ? cust?.contacts?.[addIdx] : null;
    data.contactName = primaryContact?.name || (cust ? `${cust.firstName} ${cust.lastName}` : '');
    data.primaryContactName = primaryContact?.name || '';
    data.additionalContactName = additionalContact?.name || '';
    delete data.primaryContactId;
    delete data.additionalContactId;

    // Tags & description & phases
    data.tags = selectedTags;
    data.description = editor.innerHTML;
    data.phases = jobPhases;
    
    // Ensure all phases have subPhases array even if empty
    data.phases.forEach(p => { if (!p.subPhases) p.subPhases = []; });
    
    delete data.notes; // replaced by description

    data.number = job.number || `J-${Date.now().toString().slice(-6)}`;
    const isEmg = container.querySelector('#is-emergency')?.checked;
    data.isEmergency = isEmg;

    if (!isEdit) {
      data.technicians = [];
      data.laborCost = isEmg ? 150 : 0;
      data.materialCost = 0;
      data.estimatedHours = 0;
    } else {
      if (isEmg && !job.isEmergency) data.laborCost = (job.laborCost || 0) + 150;
      else if (!isEmg && job.isEmergency) data.laborCost = Math.max(0, (job.laborCost || 0) - 150);
    }

    if (container.querySelector('#is-recurring')?.checked) {
      const freq = container.querySelector('#recurring-freq').value;
      const start = new Date(container.querySelector('#recurring-start').value);
      const end = new Date(container.querySelector('#recurring-end').value);
      if (isNaN(start.getTime()) || isNaN(end.getTime()) || start > end) {
        showToast('Invalid recurring dates', 'error'); return;
      }
      
      data.recurringConfig = { freq, start: start.toISOString().split('T')[0], end: end.toISOString().split('T')[0] };
    }

    if (isEdit) {
      store.update('jobs', id, data);
      showToast('Job updated', 'success');
      router.navigate(`/jobs/${id}`);
    } else {
      const n = store.create('jobs', data);
      
      if (data.recurringConfig) {
        let current = new Date(data.recurringConfig.start);
        const end = new Date(data.recurringConfig.end);
        let count = 0;
        
        while (current <= end && count < 50) {
          store.create('notifications', {
            type: 'Recurring Job Due',
            jobId: n.id,
            title: `Recurring: ${n.title || n.number}`,
            description: `This recurring job is due on ${current.toISOString().split('T')[0]}`,
            dueDate: current.toISOString().split('T')[0],
            status: 'Pending',
            priority: n.priority || 'Normal',
            createdAt: new Date().toISOString()
          });
          
          if (data.recurringConfig.freq === 'Daily') current.setDate(current.getDate() + 1);
          else if (data.recurringConfig.freq === 'Weekly') current.setDate(current.getDate() + 7);
          else if (data.recurringConfig.freq === 'Monthly') current.setMonth(current.getMonth() + 1);
          count++;
        }
        showToast(`Job created and ${count} future notifications scheduled`, 'success');
      } else {
        showToast('Job created', 'success');
      }
      router.navigate(`/jobs/${n.id}`);
    }
  });
}
