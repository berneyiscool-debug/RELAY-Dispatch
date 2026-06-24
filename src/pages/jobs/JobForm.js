// ============================================
// SIMPRO CLONE — JOB FORM (Create/Edit) v2
// ============================================

import { store } from '../../data/store.js';
import { router } from '../../router.js';
import { showToast } from '../../components/Notifications.js';
import { showModal } from '../../components/Modal.js';
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

  // Selected days for recurring config
  let selectedDaysOfWeek = [];
  let selectedDaysOfMonth = [];

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
      .day-toggle-btn {
        display: inline-flex; align-items: center; justify-content: center;
        width: 36px; height: 36px; border-radius: 50%;
        border: 1px solid var(--border-color); background: var(--bg-color);
        color: var(--text-primary); font-size: 13px; font-weight: 500;
        cursor: pointer; transition: all 0.15s ease; user-select: none;
      }
      .day-toggle-btn:hover {
        border-color: var(--color-primary);
        color: var(--color-primary);
        background: var(--bg-color);
      }
      .day-toggle-btn.active {
        background: var(--color-primary);
        border-color: var(--color-primary);
        color: #fff;
      }
      .month-grid {
        display: grid;
        grid-template-columns: repeat(7, 36px);
        gap: 8px;
        margin-top: 8px;
      }
      .week-flex {
        display: flex;
        gap: 8px;
        margin-top: 8px;
        flex-wrap: wrap;
      }
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
      <button type="button" class="tab" data-tab="tasks">Tasklists</button>
      <button type="button" class="tab" data-tab="forms">Compliance Forms</button>
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
                ${customers.map(c => `<option value="${c.id}" ${job.customerId === c.id ? 'selected' : ''}>${escapeHTML(c.company || `${c.firstName || ''} ${c.lastName || ''}`.trim() || 'Unnamed Customer')}</option>`).join('')}
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

          ${(!isEdit && !job.parentJobId) ? `
          <div class="form-row">
            <div class="form-group" style="display:flex;align-items:center;gap:8px">
              <input type="checkbox" id="is-recurring" style="width:16px;height:16px" />
              <label class="form-label" style="margin:0" for="is-recurring">Recurring Job</label>
            </div>
          </div>
          <div id="recurring-options" style="display:none; flex-direction:column; gap:16px; background:var(--card-bg); padding:16px; border-radius:4px; border:1px solid var(--border-color); margin-bottom:16px">
            <div style="display:grid; grid-template-columns:repeat(auto-fit, minmax(150px, 1fr)); gap:16px;">
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
            
            <div id="recurring-days-selection" style="display:none; flex-direction:column; gap:8px;">
              <label class="form-label" id="recurring-days-label" style="font-weight:var(--font-weight-medium);"></label>
              <div id="recurring-days-container"></div>
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
  
  <div id="jf-tab-tasks" style="display:none;">
    <div id="jf-task-container"></div>
  </div>
  
  <div id="jf-tab-forms" style="display:none;">
    <div id="jf-forms-container"></div>
  </div>
  `;

  // ---- Tabs ----
  container.querySelectorAll('#job-form-tabs .tab').forEach(tab => {
    tab.addEventListener('click', e => {
      container.querySelectorAll('#job-form-tabs .tab').forEach(t => t.classList.remove('active'));
      e.currentTarget.classList.add('active');
      const t = e.currentTarget.dataset.tab;
      container.querySelector('#jf-tab-details').style.display = t === 'details' ? 'block' : 'none';
      container.querySelector('#jf-tab-tasks').style.display = t === 'tasks' ? 'block' : 'none';
      container.querySelector('#jf-tab-forms').style.display = t === 'forms' ? 'block' : 'none';
      if (t === 'tasks') renderFormTasks();
      if (t === 'forms') renderFormSelection();
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
      const techs = store.getAll('technicians');
      if (techs.length > 0) {
        const t = techs[Math.floor(Math.random() * techs.length)];
        const mins = Math.floor(Math.random() * 15) + 5;
        const techName = t.name || `${t.firstName || ''} ${t.lastName || ''}`.trim();
        dispatchReason.innerHTML = `Based on current GPS location, <strong>${techName}</strong> is the most suitable technician (approx. ${mins} mins away).`;
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
  function updateRecurringDaysSelector() {
    const freqSelect = container.querySelector('#recurring-freq');
    const daysSelection = container.querySelector('#recurring-days-selection');
    const daysLabel = container.querySelector('#recurring-days-label');
    const daysContainer = container.querySelector('#recurring-days-container');
    
    if (!freqSelect || !daysSelection || !daysContainer) return;
    
    const freq = freqSelect.value;
    
    if (freq === 'Weekly') {
      daysSelection.style.display = 'flex';
      daysLabel.textContent = 'Select days of the week:';
      
      const weekdays = [
        { name: 'Mon', value: 1 },
        { name: 'Tue', value: 2 },
        { name: 'Wed', value: 3 },
        { name: 'Thu', value: 4 },
        { name: 'Fri', value: 5 },
        { name: 'Sat', value: 6 },
        { name: 'Sun', value: 0 }
      ];
      
      daysContainer.className = 'week-flex';
      daysContainer.innerHTML = weekdays.map(day => {
        const active = selectedDaysOfWeek.includes(day.value);
        return `<button type="button" class="day-toggle-btn ${active ? 'active' : ''}" data-day="${day.value}">${day.name}</button>`;
      }).join('');
      
      daysContainer.querySelectorAll('.day-toggle-btn').forEach(btn => {
        btn.addEventListener('click', () => {
          const dayVal = parseInt(btn.dataset.day, 10);
          if (selectedDaysOfWeek.includes(dayVal)) {
            selectedDaysOfWeek = selectedDaysOfWeek.filter(d => d !== dayVal);
            btn.classList.remove('active');
          } else {
            selectedDaysOfWeek.push(dayVal);
            btn.classList.add('active');
          }
        });
      });
      
    } else if (freq === 'Monthly') {
      daysSelection.style.display = 'flex';
      daysLabel.textContent = 'Select days of the month:';
      
      daysContainer.className = 'month-grid';
      let html = '';
      for (let i = 1; i <= 31; i++) {
        const active = selectedDaysOfMonth.includes(i);
        html += `<button type="button" class="day-toggle-btn ${active ? 'active' : ''}" data-date="${i}">${i}</button>`;
      }
      daysContainer.innerHTML = html;
      
      daysContainer.querySelectorAll('.day-toggle-btn').forEach(btn => {
        btn.addEventListener('click', () => {
          const dateVal = parseInt(btn.dataset.date, 10);
          if (selectedDaysOfMonth.includes(dateVal)) {
            selectedDaysOfMonth = selectedDaysOfMonth.filter(d => d !== dateVal);
            btn.classList.remove('active');
          } else {
            selectedDaysOfMonth.push(dateVal);
            btn.classList.add('active');
          }
        });
      });
      
    } else {
      daysSelection.style.display = 'none';
      daysContainer.innerHTML = '';
    }
  }

  if (!isEdit && !job.parentJobId) {
    const isRecurring = container.querySelector('#is-recurring');
    const recurringOptions = container.querySelector('#recurring-options');
    const freqSelect = container.querySelector('#recurring-freq');
    
    isRecurring?.addEventListener('change', e => {
      recurringOptions.style.display = e.target.checked ? 'flex' : 'none';
      if (e.target.checked) {
        updateRecurringDaysSelector();
      }
    });

    freqSelect?.addEventListener('change', () => {
      selectedDaysOfWeek = [];
      selectedDaysOfMonth = [];
      updateRecurringDaysSelector();
    });
  }

  // ---- Cancel ----
  container.querySelector('#btn-cancel').addEventListener('click', () =>
    router.navigate(isEdit ? `/jobs/${id}` : '/jobs')
  );

  // ==== Task List Management ====
  let jobTasks = job.tasks ? JSON.parse(JSON.stringify(job.tasks)) : [{ id: store.generateId(), name: 'Main Task', status: 'Not Started', progress: 0, estimatedHours: 2, people: 1, subTasks: [] }];
  jobTasks.forEach(p => { if (!p.subTasks) p.subTasks = []; });

  let taskExpandedPath = [0];
  let taskViewPath = [];
  let isInfoPanelEditing = true; // Default to editing in Job Form

  function getTaskByPath(tasks, path) {
    let curr = tasks[path[0]];
    if (!curr) return null;
    for (let i = 1; i < path.length; i++) {
      if (!curr.subTasks) return null;
      curr = curr.subTasks[path[i]];
      if (!curr) return null;
    }
    return curr;
  }

  function renderFormTasks() {
    const tc = container.querySelector('#jf-task-container');
    if (!tc) return;

    // Cleanup invalid paths
    let isValidPath = true;
    let curr = jobTasks;
    for (let i=0; i<taskExpandedPath.length; i++) {
       if (!curr || !curr[taskExpandedPath[i]]) { isValidPath = false; break; }
       curr = curr[taskExpandedPath[i]].subTasks;
    }
    if (!isValidPath) taskExpandedPath = [];

    const viewParentNode = taskViewPath.length > 0 ? getTaskByPath(jobTasks, taskViewPath) : null;
    const viewList = viewParentNode ? (viewParentNode.subTasks || []) : jobTasks;
    const viewTitle = viewParentNode ? escapeHTML(viewParentNode.name) : 'Main Tasks';

    tc.innerHTML = `
      <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:12px;">
        <h4 style="margin:0">Job Tasks</h4>
        <div style="display:flex; gap:8px;">
          <button type="button" class="btn btn-secondary btn-sm" id="btn-import-tasklist">
            <span class="material-icons-outlined" style="font-size:16px">download</span> Import
          </button>
          <button type="button" class="btn btn-secondary btn-sm" id="btn-save-as-template">
            <span class="material-icons-outlined" style="font-size:16px">bookmark_add</span> Save as Template
          </button>
        </div>
      </div>
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
                    ${p.valueFields && p.valueFields.length > 0 ? `<span style="font-size:10px; background:var(--color-primary-light); color:var(--color-primary); padding:2px 6px; border-radius:4px; margin-right:6px; font-weight:600; flex-shrink:0">${p.valueFields.length} fields</span>` : ''}
                    ${p.subTasks && p.subTasks.length > 0 ? `<button type="button" class="btn btn-ghost btn-icon btn-sm btn-drill-down" data-path="${currentPath.join('-')}" style="margin-left:8px; padding:2px; min-width:24px; min-height:24px; color:inherit"><span class="material-icons-outlined" style="font-size:18px">chevron_right</span></button>` : ''}
                  </div>
                `;
              }).join('')}
              ${viewList.length === 0 ? '<div style="color:var(--text-tertiary);font-size:12px;text-align:center;padding:12px">No tasks</div>' : ''}
            </div>
          </div>

          <!-- Task Details Form -->
          ${taskExpandedPath.length > 0 ? (() => {
            const path = taskExpandedPath;
            const node = getTaskByPath(jobTasks, path);
            if (!node) return '';
            const hasSubs = node.subTasks && node.subTasks.length > 0;
            return `
              <div style="flex: 1; min-width:300px; display:flex; flex-direction:column; border:1px solid var(--border-color); border-radius:4px; background:var(--content-bg); padding:16px">
                <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:16px">
                  <h4 style="margin:0; white-space:nowrap; overflow:hidden; text-overflow:ellipsis" title="${escapeHTML(node.name)}">Task Settings</h4>
                  <div style="display:flex;gap:8px">
                    ${path.length < 3 ? `<button type="button" class="btn btn-sm btn-secondary btn-add-child-task" data-path="${path.join('-')}" title="Add Sub-task"><span class="material-icons-outlined" style="font-size:16px">add_task</span> Add Sub-task</button>` : ''}
                    <button type="button" class="btn btn-sm btn-danger btn-remove-task" data-path="${path.join('-')}" title="Delete"><span class="material-icons-outlined" style="font-size:16px">delete</span> Delete</button>
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
                ${!hasSubs ? `
                <div style="margin-top:8px; border-top:1px solid var(--border-color); padding-top:16px">
                  <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:10px">
                    <div style="display:flex; align-items:center; gap:6px">
                      <span class="material-icons-outlined" style="font-size:18px; color:var(--color-primary)">assignment</span>
                      <span style="font-size:13px; font-weight:700; color:var(--text-primary); text-transform:uppercase; letter-spacing:0.3px">Value Fields</span>
                    </div>
                    <button type="button" class="btn btn-sm btn-secondary btn-add-value-field" data-path="${path.join('-')}"><span class="material-icons-outlined" style="font-size:14px">add</span> Add Field</button>
                  </div>
                  <div style="font-size:11px; color:var(--text-tertiary); margin-bottom:10px">Define the values a technician needs to record for this task (e.g. pressure readings, temperatures).</div>
                  <div style="display:flex; flex-direction:column; gap:8px" id="value-fields-config">
                    ${(node.valueFields || []).map((vf, vi) => {
                      const ft = vf.fieldType || 'text';
                      return `
                      <div style="padding:10px 12px; background:var(--bg-color); border:1px solid var(--border-color); border-radius:6px" data-vf-idx="${vi}">
                        <div style="display:flex; align-items:center; gap:8px; margin-bottom:${ft !== 'text' ? '8px' : '0'}">
                          <span class="material-icons-outlined" style="font-size:16px; color:var(--text-tertiary); cursor:grab">drag_indicator</span>
                          <input type="text" class="form-input vf-label-input" data-vf-idx="${vi}" value="${escapeHTML(vf.label)}" placeholder="Field label (e.g. Oil Pressure)" style="flex:2; height:32px; font-size:13px" />
                          <select class="form-input vf-type-select" data-vf-idx="${vi}" style="flex:0 0 110px; height:32px; font-size:12px">
                            <option value="text"${ft === 'text' ? ' selected' : ''}>Text</option>
                            <option value="number"${ft === 'number' ? ' selected' : ''}>Number</option>
                            <option value="dropdown"${ft === 'dropdown' ? ' selected' : ''}>Dropdown</option>
                          </select>
                          <button type="button" class="btn btn-ghost btn-sm btn-icon btn-remove-value-field" data-vf-idx="${vi}" style="color:var(--color-danger); min-width:28px; min-height:28px; padding:0"><span class="material-icons-outlined" style="font-size:16px">close</span></button>
                        </div>
                        ${ft === 'number' ? `
                        <div style="display:flex; align-items:center; gap:8px; margin-left:28px">
                          <input type="text" class="form-input vf-unit-input" data-vf-idx="${vi}" value="${escapeHTML(vf.unit || '')}" placeholder="Unit (e.g. PSI)" style="flex:1; height:30px; font-size:12px" />
                          <div style="display:flex; align-items:center; gap:4px; flex:2">
                            <span style="font-size:11px; color:var(--text-tertiary); white-space:nowrap">Range:</span>
                            <input type="number" class="form-input vf-min-input" data-vf-idx="${vi}" value="${vf.min !== undefined ? vf.min : ''}" placeholder="Min" style="flex:1; height:30px; font-size:12px" />
                            <span style="color:var(--text-tertiary)">–</span>
                            <input type="number" class="form-input vf-max-input" data-vf-idx="${vi}" value="${vf.max !== undefined ? vf.max : ''}" placeholder="Max" style="flex:1; height:30px; font-size:12px" />
                          </div>
                        </div>
                        ` : ''}
                        ${ft === 'text' ? `
                        <div style="display:flex; align-items:center; gap:8px; margin-left:28px; margin-top:4px">
                          <input type="text" class="form-input vf-unit-input" data-vf-idx="${vi}" value="${escapeHTML(vf.unit || '')}" placeholder="Unit (optional, e.g. PSI)" style="flex:1; height:30px; font-size:12px" />
                        </div>
                        ` : ''}
                        ${ft === 'dropdown' ? `
                        <div style="margin-left:28px; display:flex; flex-direction:column; gap:6px">
                          <div>
                            <div style="font-size:11px; color:var(--text-tertiary); margin-bottom:4px">Options (one per line)</div>
                            <textarea class="form-input vf-options-input" data-vf-idx="${vi}" rows="3" placeholder="Low\nAs Expected\nHigh" style="font-size:12px; line-height:1.5">${escapeHTML((vf.options || []).join('\n'))}</textarea>
                          </div>
                          <div>
                            <div style="font-size:11px; color:var(--text-tertiary); margin-bottom:4px">Expected / Ideal Value <span style="font-weight:400">(flags others as out of range)</span></div>
                            <select class="form-input vf-expected-select" data-vf-idx="${vi}" style="height:30px; font-size:12px">
                              <option value=""${!vf.expectedValue ? ' selected' : ''}>— No expected value —</option>
                              ${(vf.options || []).map(opt => `<option value="${escapeHTML(opt)}"${vf.expectedValue === opt ? ' selected' : ''}>${escapeHTML(opt)}</option>`).join('')}
                            </select>
                          </div>
                        </div>
                        ` : ''}
                      </div>`;
                    }).join('')}
                    ${(!node.valueFields || node.valueFields.length === 0) ? '<div style="color:var(--text-tertiary); font-size:12px; text-align:center; padding:16px; border:1px dashed var(--border-color); border-radius:6px">No value fields defined. Click "Add Field" to create one.</div>' : ''}
                  </div>
                </div>
                ` : ''}
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
       jobTasks.push({ id: store.generateId(), name: 'New Task', status: 'Not Started', progress: 0, startDate: new Date().toISOString(), technicians: [], subTasks: [] });
       taskExpandedPath = [jobTasks.length - 1];
       renderFormTasks();
    });

    tc.querySelectorAll('.btn-add-child-task').forEach(el => {
       el.addEventListener('click', () => {
          const path = el.dataset.path.split('-').map(Number);
          const node = getTaskByPath(jobTasks, path);
          if (node) {
             if (!node.subTasks) node.subTasks = [];
             node.subTasks.push({ id: store.generateId(), name: 'New Sub-task', status: 'Not Started', progress: 0, startDate: new Date().toISOString(), technicians: [], subTasks: [] });
             taskExpandedPath = [...path, node.subTasks.length - 1];
             taskViewPath = [...path];
             renderFormTasks();
          }
       });
    });

    tc.querySelectorAll('.btn-remove-task').forEach(el => {
       el.addEventListener('click', () => {
          const path = el.dataset.path.split('-').map(Number);
          if (confirm('Are you sure you want to delete this task and all its sub-tasks?')) {
             if (path.length === 1) {
                jobTasks.splice(path[0], 1);
                taskExpandedPath = jobTasks.length > 0 ? [0] : [];
             } else {
                const parent = getTaskByPath(jobTasks, path.slice(0, -1));
                if (parent && parent.subTasks) {
                   parent.subTasks.splice(path[path.length - 1], 1);
                }
                taskExpandedPath = [...path.slice(0, -1)];
             }
             renderFormTasks();
          }
       });
    });

    tc.querySelectorAll('.detail-input').forEach(inp => {
       inp.addEventListener('input', e => {
          const field = e.target.dataset.field;
          const val = e.target.value;
          const node = getTaskByPath(jobTasks, taskExpandedPath);
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
       
    });

    // Value Fields interactive configuration listeners
    tc.querySelector('.btn-add-value-field')?.addEventListener('click', () => {
       const node = getTaskByPath(jobTasks, taskExpandedPath);
       if (!node) return;
       if (!node.valueFields) node.valueFields = [];
       node.valueFields.push({ id: store.generateId(), label: '', unit: '', value: '', fieldType: 'text' });
       renderFormTasks();
    });

    tc.querySelectorAll('.btn-remove-value-field').forEach(btn => {
       btn.addEventListener('click', () => {
          const idx = parseInt(btn.dataset.vfIdx);
          const node = getTaskByPath(jobTasks, taskExpandedPath);
          if (!node || !node.valueFields) return;
          node.valueFields.splice(idx, 1);
          renderFormTasks();
       });
    });

    tc.querySelectorAll('.vf-label-input').forEach(inp => {
       inp.addEventListener('change', () => {
          const idx = parseInt(inp.dataset.vfIdx);
          const node = getTaskByPath(jobTasks, taskExpandedPath);
          if (node && node.valueFields && node.valueFields[idx]) {
             node.valueFields[idx].label = inp.value.trim();
          }
       });
    });

    tc.querySelectorAll('.vf-unit-input').forEach(inp => {
       inp.addEventListener('change', () => {
          const idx = parseInt(inp.dataset.vfIdx);
          const node = getTaskByPath(jobTasks, taskExpandedPath);
          if (node && node.valueFields && node.valueFields[idx]) {
             node.valueFields[idx].unit = inp.value.trim();
          }
       });
    });

    tc.querySelectorAll('.vf-type-select').forEach(sel => {
       sel.addEventListener('change', () => {
          const idx = parseInt(sel.dataset.vfIdx);
          const node = getTaskByPath(jobTasks, taskExpandedPath);
          if (node && node.valueFields && node.valueFields[idx]) {
             node.valueFields[idx].fieldType = sel.value;
             if (sel.value !== 'number') { node.valueFields[idx].min = undefined; node.valueFields[idx].max = undefined; }
             if (sel.value !== 'dropdown') { node.valueFields[idx].options = undefined; }
             if (sel.value === 'dropdown') { node.valueFields[idx].unit = ''; }
             node.valueFields[idx].value = '';
          }
          renderFormTasks();
       });
    });

    tc.querySelectorAll('.vf-min-input').forEach(inp => {
       inp.addEventListener('change', () => {
          const idx = parseInt(inp.dataset.vfIdx);
          const node = getTaskByPath(jobTasks, taskExpandedPath);
          if (node && node.valueFields && node.valueFields[idx]) {
             node.valueFields[idx].min = inp.value !== '' ? parseFloat(inp.value) : undefined;
          }
       });
    });

    tc.querySelectorAll('.vf-max-input').forEach(inp => {
       inp.addEventListener('change', () => {
          const idx = parseInt(inp.dataset.vfIdx);
          const node = getTaskByPath(jobTasks, taskExpandedPath);
          if (node && node.valueFields && node.valueFields[idx]) {
             node.valueFields[idx].max = inp.value !== '' ? parseFloat(inp.value) : undefined;
          }
       });
    });

    tc.querySelectorAll('.vf-options-input').forEach(inp => {
       inp.addEventListener('change', () => {
          const idx = parseInt(inp.dataset.vfIdx);
          const node = getTaskByPath(jobTasks, taskExpandedPath);
          if (node && node.valueFields && node.valueFields[idx]) {
             node.valueFields[idx].options = inp.value.split('\n').map(o => o.trim()).filter(Boolean);
             renderFormTasks();
          }
       });
    });

    tc.querySelectorAll('.vf-expected-select').forEach(inp => {
       inp.addEventListener('change', () => {
          const idx = parseInt(inp.dataset.vfIdx);
          const node = getTaskByPath(jobTasks, taskExpandedPath);
          if (node && node.valueFields && node.valueFields[idx]) {
             node.valueFields[idx].expectedValue = inp.value || undefined;
          }
       });
    });

    container.querySelector('#btn-save-as-template')?.addEventListener('click', () => {
      const content = document.createElement('div');
      content.innerHTML = `
        <div class="form-group">
          <label class="form-label">Template Name</label>
          <input type="text" class="form-input" id="tmpl-name" placeholder="e.g. Standard 50pt Maintenance" required />
        </div>
        <div class="form-group">
          <label class="form-label">Description</label>
          <textarea class="form-input" id="tmpl-desc" rows="3" placeholder="Describe when to use this template..."></textarea>
        </div>
        <div class="form-group">
          <label class="form-label">Tags (comma separated)</label>
          <input type="text" class="form-input" id="tmpl-tags" placeholder="Electrical, Maintenance, Commercial" />
        </div>
      `;

        showModal({
          title: 'Save Tasklist as Template',
          content,
          actions: [
            { label: 'Cancel', className: 'btn-secondary', onClick: (close) => close() },
            { label: 'Save Template', className: 'btn-primary', onClick: (close) => {
              const name = content.querySelector('#tmpl-name').value;
              const description = content.querySelector('#tmpl-desc').value;
              const tags = content.querySelector('#tmpl-tags').value.split(',').map(t => t.trim()).filter(Boolean);

              if (!name) {
                showToast('Template name is required', 'error');
                return;
              }

              function deepClone(tasks) {
                return tasks.map(p => ({
                  ...p,
                  id: store.generateId(),
                  status: 'Not Started',
                  progress: 0,
                  valueFields: p.valueFields ? p.valueFields.map(vf => ({ ...vf })) : undefined,
                  subTasks: p.subTasks ? deepClone(p.subTasks) : []
                }));
              }

              store.create('taskTemplates', {
                name,
                description,
                tags,
                tasks: deepClone(jobTasks),
                createdAt: new Date().toISOString()
              });

              showToast('Tasklist saved as template', 'success');
              close();
            }}
          ]
        });
    });

    container.querySelector('#btn-import-tasklist')?.addEventListener('click', () => {
      const templates = store.getAll('taskTemplates');
      const otherJobs = store.getAll('jobs').filter(j => j.id !== id && j.tasks && j.tasks.length > 0);
      let currentTab = 'templates';

      const content = document.createElement('div');
      content.innerHTML = `
        <div class="tabs" id="import-tabs" style="margin-bottom:12px">
          <button class="tab active" data-tab="templates">Templates</button>
          <button class="tab" data-tab="jobs">Other Jobs</button>
        </div>
        <div class="toolbar-search" style="margin-bottom:12px">
          <span class="material-icons-outlined">search</span>
          <input type="text" id="import-search" placeholder="Search templates..." style="width:100%" />
        </div>
        <div id="import-content" style="max-height:400px; overflow-y:auto">
           <!-- Content injected here -->
        </div>
      `;

      function renderImportList(query = '') {
        const listDiv = content.querySelector('#import-content');
        const q = query.toLowerCase();

        if (currentTab === 'templates') {
          const filtered = templates.filter(t => 
            t.name.toLowerCase().includes(q) || 
            (t.description || '').toLowerCase().includes(q) ||
            (t.tags || []).some(tag => tag.toLowerCase().includes(q))
          );

          listDiv.innerHTML = filtered.length ? filtered.map(t => `
            <div class="import-item" data-id="${t.id}" data-type="template" style="padding:12px; border:1px solid var(--border-color); border-radius:6px; margin-bottom:10px; cursor:pointer; transition:all 0.2s">
              <div style="display:flex; justify-content:space-between; align-items:start; margin-bottom:4px">
                <div style="font-weight:600; font-size:14px">${escapeHTML(t.name)}</div>
                <div style="font-size:11px; color:var(--text-tertiary)">${(t.tasks || t.phases || []).length} tasks</div>
              </div>
              <div style="font-size:12px; color:var(--text-secondary); margin-bottom:8px; line-height:1.4">${escapeHTML(t.description || 'No description.')}</div>
              <div style="display:flex; gap:4px; flex-wrap:wrap">
                ${(t.tags || []).map(tag => `<span style="font-size:10px; background:var(--bg-color); padding:2px 6px; border-radius:10px; border:1px solid var(--border-color)">${escapeHTML(tag)}</span>`).join('')}
              </div>
            </div>
          `).join('') : `<div class="text-secondary text-center" style="padding:24px">No templates matching "${query}"</div>`;
        } else {
          const filtered = otherJobs.filter(j => 
            j.number.toLowerCase().includes(q) || 
            j.title.toLowerCase().includes(q) ||
            j.customerName.toLowerCase().includes(q)
          );

          listDiv.innerHTML = filtered.length ? filtered.map(j => `
            <div class="import-item" data-id="${j.id}" data-type="job" style="padding:12px; border:1px solid var(--border-color); border-radius:6px; margin-bottom:10px; cursor:pointer; transition:all 0.2s">
              <div style="font-weight:600; font-size:14px; margin-bottom:2px">${escapeHTML(j.number)} - ${escapeHTML(j.title)}</div>
              <div style="font-size:12px; color:var(--text-secondary)">${escapeHTML(j.customerName)} · ${(j.tasks || j.phases || []).length} tasks</div>
            </div>
          `).join('') : `<div class="text-secondary text-center" style="padding:24px">No jobs matching "${query}"</div>`;
        }

        // Direct binding to newly created items to prevent bubbles / type mismatch bugs
        listDiv.querySelectorAll('.import-item').forEach(item => {
          item.addEventListener('click', () => {
            const sourceId = item.dataset.id;
            const type = item.dataset.type;
            
            const freshTemplates = store.getAll('taskTemplates');
            const freshJobs = store.getAll('jobs');
            const source = type === 'template' 
              ? freshTemplates.find(t => String(t.id) === String(sourceId)) 
              : freshJobs.find(j => String(j.id) === String(sourceId));
            
            if (source && (source.tasks || source.phases)) {
              const sourceTasks = source.tasks || source.phases;
              if (confirm(`Replace current tasklist with "${source.name || source.number}"?`)) {
                function deepClone(tasks) {
                  return tasks.map(p => ({
                    ...p,
                    id: store.generateId(),
                    status: 'Not Started',
                    progress: 0,
                    valueFields: p.valueFields ? p.valueFields.map(vf => ({ ...vf })) : undefined,
                    subTasks: (p.subTasks || p.subPhases) ? deepClone(p.subTasks || p.subPhases) : []
                  }));
                }
                jobTasks = deepClone(sourceTasks);
                taskExpandedPath = [0];
                taskViewPath = [];
                
                showToast(`Imported ${source.name || source.number}`, 'success');
                renderFormTasks();
                document.querySelector('.modal-overlay')?.remove();
              }
            } else {
              showToast('Could not find source data', 'error');
            }
          });
        });
      }

      renderImportList();

      // Attach tab listeners
      content.querySelectorAll('.tab').forEach(tab => {
        tab.addEventListener('click', () => {
          content.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
          tab.classList.add('active');
          currentTab = tab.dataset.tab;
          content.querySelector('#import-search').placeholder = currentTab === 'templates' ? 'Search templates...' : 'Search jobs...';
          renderImportList(content.querySelector('#import-search').value);
        });
      });

      content.querySelector('#import-search').addEventListener('input', (e) => {
        renderImportList(e.target.value);
      });

      showModal({
        title: 'Import Tasklist',
        content,
        actions: [{ label: 'Cancel', className: 'btn-secondary', onClick: (close) => close() }]
      });
    });
  }

  // ==== Compliance Forms Selection ====
  const allTemplates = store.getAll('formTemplates');
  const existingInstances = isEdit ? store.getAll('formInstances').filter(fi => fi.jobId === id) : [];
  let selectedFormTemplateIds = isEdit ? existingInstances.map(fi => fi.templateId) : [];

  function renderFormSelection() {
    const fc = container.querySelector('#jf-forms-container');
    if (!fc) return;

    fc.innerHTML = `
      <div style="margin-bottom:var(--space-lg)">
        <h4 style="margin-bottom:4px">Compliance & Safety Forms</h4>
        <p style="font-size:13px; color:var(--text-tertiary); margin-bottom:16px">Select the forms required for this job. Technicians will be prompted to complete these.</p>
      </div>
      <div style="display:grid; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); gap:16px">
        ${allTemplates.map(t => {
          const isSelected = selectedFormTemplateIds.includes(t.id);
          return `
            <div class="card form-template-selector ${isSelected ? 'active' : ''}" data-id="${t.id}" style="cursor:pointer; border:2px solid ${isSelected ? 'var(--color-primary)' : 'var(--border-color)'}; transition:all 0.2s">
              <div class="card-body" style="display:flex; gap:12px; align-items:start">
                <div style="width:20px; height:20px; border-radius:4px; border:2px solid ${isSelected ? 'var(--color-primary)' : 'var(--text-tertiary)'}; background:${isSelected ? 'var(--color-primary)' : 'transparent'}; display:flex; align-items:center; justify-content:center; flex-shrink:0">
                  ${isSelected ? '<span class="material-icons-outlined" style="font-size:16px; color:white">check</span>' : ''}
                </div>
                <div>
                  <div style="font-weight:600; font-size:14px; margin-bottom:4px">${escapeHTML(t.name)}</div>
                  <div style="font-size:12px; color:var(--text-secondary); line-height:1.4">${escapeHTML(t.description || 'No description.')}</div>
                  <div style="margin-top:8px; font-size:11px; color:var(--text-tertiary)">${(t.sections || []).reduce((sum, s) => sum + s.fields.length, 0)} Required Fields</div>
                </div>
              </div>
            </div>
          `;
        }).join('')}
        ${!allTemplates.length ? '<div style="grid-column: 1/-1; text-align:center; padding:40px; background:var(--bg-color); border-radius:8px">No form templates found. Create some in Settings first.</div>' : ''}
      </div>
    `;

    fc.querySelectorAll('.form-template-selector').forEach(el => {
      el.addEventListener('click', () => {
        const tid = el.dataset.id;
        if (selectedFormTemplateIds.includes(tid)) {
          selectedFormTemplateIds = selectedFormTemplateIds.filter(id => id !== tid);
        } else {
          selectedFormTemplateIds.push(tid);
        }
        renderFormSelection();
      });
    });
  }

  // ==== Form Submit / Save ====
  container.querySelector('#btn-save').addEventListener('click', () => {
    const form = container.querySelector('#job-form');
    if (!form.checkValidity()) {
      container.querySelectorAll('#job-form-tabs .tab').forEach(t => t.classList.remove('active'));
      container.querySelector('#job-form-tabs .tab[data-tab="details"]').classList.add('active');
      container.querySelector('#jf-tab-details').style.display = 'block';
      container.querySelector('#jf-tab-tasks').style.display = 'none';
      container.querySelector('#jf-tab-forms').style.display = 'none';
      form.reportValidity();
      return;
    }
    const data = Object.fromEntries(new FormData(form));

    const custId = data.customerId;
    const cust = customers.find(c => c.id === custId);
    data.customerName = cust ? (cust.company || `${cust.firstName || ''} ${cust.lastName || ''}`.trim()) : '';

    const selSiteOpt = siteSelect.selectedOptions[0];
    data.siteAddress = selSiteOpt?.dataset.address || '';
    data.siteName = selSiteOpt?.dataset.name || '';

    const priIdx = parseInt(data.primaryContactId);
    const addIdx = parseInt(data.additionalContactId);
    const primaryContact = !isNaN(priIdx) ? cust?.contacts?.[priIdx] : null;
    const additionalContact = !isNaN(addIdx) ? cust?.contacts?.[addIdx] : null;
    data.contactName = primaryContact?.name || (cust ? `${cust.firstName} ${cust.lastName}` : '');
    data.primaryContactName = primaryContact?.name || '';
    data.additionalContactName = additionalContact?.name || '';
    delete data.primaryContactId;
    delete data.additionalContactId;

    data.tags = selectedTags;
    data.description = editor.innerHTML;
    data.tasks = jobTasks;
    data.phases = jobTasks;
    data.tasks.forEach(t => { 
      if (!t.subTasks) t.subTasks = []; 
      t.subPhases = t.subTasks; 
    });
    
    delete data.notes;
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
      const startInput = container.querySelector('#recurring-start').value;
      const endInput = container.querySelector('#recurring-end').value;
      if (!startInput || !endInput) {
        showToast('Recurring dates required', 'error'); return;
      }
      data.isRecurring = true;
      data.recurringConfig = { 
        freq, 
        start: startInput, 
        end: endInput,
        daysOfWeek: selectedDaysOfWeek,
        daysOfMonth: selectedDaysOfMonth
      };
    } else {
      if (!isEdit) {
        data.isRecurring = false;
        data.recurringConfig = null;
      }
    }

    // Save Job
    const finalJob = isEdit ? store.update('jobs', id, data) : store.create('jobs', data);
    const jobId = finalJob.id;

    // Update Form Instances
    const allInstances = store.getAll('formInstances') || [];
    // Filter out removed forms IF they are empty
    let filteredInstances = allInstances.filter(fi => {
       if (fi.jobId !== jobId) return true;
       const isStillSelected = selectedFormTemplateIds.includes(fi.templateId);
       const hasData = fi.responses && Object.keys(fi.responses).length > 0;
       return isStillSelected || hasData;
    });

    // Add new instances
    selectedFormTemplateIds.forEach(tid => {
       const exists = filteredInstances.find(fi => fi.jobId === jobId && fi.templateId === tid);
       if (!exists) {
          filteredInstances.push({
             id: 'fi_' + Math.random().toString(36).substr(2, 9),
             jobId,
             templateId: tid,
             responses: {},
             status: 'Pending',
             createdAt: new Date().toISOString()
          });
       }
    });
    store.save('formInstances', filteredInstances);

    showToast(`Job ${isEdit ? 'updated' : 'created'} successfully`, 'success', { link: `/jobs/${jobId}` });
    router.navigate(`/jobs/${jobId}`);
  });
}
