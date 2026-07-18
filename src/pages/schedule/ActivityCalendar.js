// ============================================
// FIELDFORGE — ACTIVITY CALENDAR MODULE
// ============================================

import { store } from '../../data/store.js';
import { router } from '../../router.js';
import { showToast } from '../../components/Notifications.js';
import { showModal } from '../../components/Modal.js';
import { escapeHTML } from '../../utils/security.js';

const ACTIVITY_TYPES = [
  { value: 'call',       label: 'Call',        icon: 'phone',           color: '#3B82F6' },
  { value: 'meeting',    label: 'Meeting',     icon: 'groups',          color: '#8B5CF6' },
  { value: 'follow-up',  label: 'Follow-up',   icon: 'reply',           color: '#F59E0B' },
  { value: 'site-visit',  label: 'Site Visit',  icon: 'location_on',     color: '#10B981' },
  { value: 'email',      label: 'Email',       icon: 'email',           color: '#06B6D4' },
  { value: 'task',       label: 'Task',        icon: 'task_alt',        color: '#64748B' },
  { value: 'other',      label: 'Other',       icon: 'more_horiz',      color: '#94A3B8' },
];

function getTypeMeta(type) {
  return ACTIVITY_TYPES.find(t => t.value === type) || ACTIVITY_TYPES[6];
}

function getLinkedRoute(linkedType, linkedId) {
  if (!linkedType || !linkedId) return null;
  const routes = { job: '/jobs/', quote: '/quotes/', invoice: '/invoices/', customer: '/customers/', lead: '/leads/' };
  return routes[linkedType] ? routes[linkedType] + linkedId : null;
}

export function renderActivityCalendar(container, { getWeekDays, viewMode, currentDate, calendarType, isTechnician, onNav, onToday, onViewMode, onCalType }) {
  container.style.height = '100%';
  container.style.display = 'flex';
  container.style.flexDirection = 'column';
  container.style.overflow = 'hidden';

  const days = getWeekDays();
  const monthNames = ['January','February','March','April','May','June','July','August','September','October','November','December'];
  const currentUser = JSON.parse(localStorage.getItem('currentUser') || '{}');
  const technicians = store.getAll('technicians').filter(t => !t.deactivated || filterTechId === t.id);

  // Filter state
  let filterStatus = 'active'; // 'all' | 'active' | 'completed' | 'overdue'
  let filterTechId = isTechnician ? currentUser.id : 'all';

  function getFilteredActivities() {
    let acts = store.getAll('activities');
    // Tech filter
    if (filterTechId !== 'all') acts = acts.filter(a => a.assignedToId === filterTechId);
    // Status filter
    const todayStr = new Date().toISOString().split('T')[0];
    if (filterStatus === 'active') acts = acts.filter(a => a.status !== 'completed');
    else if (filterStatus === 'completed') acts = acts.filter(a => a.status === 'completed');
    else if (filterStatus === 'overdue') acts = acts.filter(a => a.status !== 'completed' && a.date < todayStr);
    return acts;
  }

  function getStats() {
    let acts = store.getAll('activities');
    if (filterTechId !== 'all') acts = acts.filter(a => a.assignedToId === filterTechId);
    const todayStr = new Date().toISOString().split('T')[0];
    const weekDates = days.map(d => d.toISOString().split('T')[0]);
    const thisWeek = acts.filter(a => weekDates.includes(a.date));
    return {
      total: thisWeek.length,
      completed: thisWeek.filter(a => a.status === 'completed').length,
      pending: thisWeek.filter(a => a.status !== 'completed').length,
      overdue: acts.filter(a => a.status !== 'completed' && a.date < todayStr).length,
    };
  }

  function renderCard(a) {
    const meta = getTypeMeta(a.type);
    const isComplete = a.status === 'completed';
    const todayStr = new Date().toISOString().split('T')[0];
    const isOverdue = !isComplete && a.date < todayStr;
    const linkedRoute = getLinkedRoute(a.linkedType, a.linkedId);
    const priorityBadge = a.priority === 'high' ? '<span style="display:inline-block;width:6px;height:6px;border-radius:50%;background:#EF4444;margin-right:4px" title="High priority"></span>' : a.priority === 'low' ? '<span style="display:inline-block;width:6px;height:6px;border-radius:50%;background:#94A3B8;margin-right:4px" title="Low priority"></span>' : '';

    return `
      <div class="activity-card ${isComplete ? 'completed' : ''} ${isOverdue ? 'overdue' : ''}" data-id="${a.id}" style="
        background:var(--card-bg); border:1px solid ${isOverdue ? '#FCA5A5' : 'var(--border-color)'};
        border-left:3px solid ${isComplete ? '#94A3B8' : meta.color}; border-radius:8px;
        padding:12px 14px; transition:all 0.2s; ${isComplete ? 'opacity:0.6;' : ''}
        display:flex; gap:12px; align-items:flex-start; position:relative;
      ">
        <div style="width:32px;height:32px;border-radius:8px;background:${meta.color}14;display:flex;align-items:center;justify-content:center;flex-shrink:0;margin-top:2px">
          <span class="material-icons-outlined" style="font-size:18px;color:${meta.color}">${meta.icon}</span>
        </div>
        <div style="flex:1;min-width:0">
          <div style="display:flex;justify-content:space-between;align-items:flex-start;gap:8px;margin-bottom:4px">
            <div style="font-weight:600;font-size:13px;${isComplete ? 'text-decoration:line-through;color:var(--text-tertiary)' : 'color:var(--text-primary)'};overflow:hidden;text-overflow:ellipsis;white-space:nowrap">
              ${priorityBadge}${escapeHTML(a.title)}
            </div>
            <div style="display:flex;gap:2px;flex-shrink:0">
              <button class="btn btn-ghost btn-sm btn-icon act-toggle-complete" data-id="${a.id}" title="${isComplete ? 'Mark pending' : 'Mark complete'}" style="width:26px;height:26px">
                <span class="material-icons-outlined" style="font-size:16px;color:${isComplete ? '#10B981' : 'var(--text-tertiary)'}">${isComplete ? 'check_circle' : 'radio_button_unchecked'}</span>
              </button>
              <button class="btn btn-ghost btn-sm btn-icon act-edit" data-id="${a.id}" title="Edit" style="width:26px;height:26px">
                <span class="material-icons-outlined" style="font-size:16px">edit</span>
              </button>
              <button class="btn btn-ghost btn-sm btn-icon act-delete" data-id="${a.id}" title="Delete" style="width:26px;height:26px">
                <span class="material-icons-outlined" style="font-size:16px;color:var(--color-danger)">close</span>
              </button>
            </div>
          </div>
          <div style="display:flex;flex-wrap:wrap;gap:8px;font-size:11px;color:var(--text-secondary)">
            ${a.time ? `<span style="display:flex;align-items:center;gap:3px"><span class="material-icons-outlined" style="font-size:13px">schedule</span>${escapeHTML(a.time)}${a.duration ? ` (${a.duration}min)` : ''}</span>` : ''}
            <span style="display:flex;align-items:center;gap:3px;background:${meta.color}14;color:${meta.color};padding:1px 6px;border-radius:10px;font-weight:500">${meta.label}</span>
            ${a.linkedLabel ? `<span class="act-linked-record" data-type="${a.linkedType || ''}" data-linked-id="${a.linkedId || ''}" style="display:flex;align-items:center;gap:3px;cursor:${linkedRoute ? 'pointer' : 'default'};${linkedRoute ? 'color:var(--color-primary);text-decoration:underline;' : ''}"><span class="material-icons-outlined" style="font-size:13px">link</span>${escapeHTML(a.linkedLabel)}</span>` : ''}
            ${filterTechId === 'all' ? `<span style="display:flex;align-items:center;gap:3px"><span class="material-icons-outlined" style="font-size:13px">person</span>${escapeHTML(technicians.find(t => t.id === a.assignedToId)?.name || 'Unassigned')}</span>` : ''}
          </div>
          ${a.notes ? `<div style="margin-top:6px;font-size:12px;color:var(--text-secondary);line-height:1.4;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${escapeHTML(a.notes)}</div>` : ''}
        </div>
      </div>`;
  }

  function draw() {
    const activities = getFilteredActivities();
    const stats = getStats();
    const dayNames = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];

    container.innerHTML = `
      <div class="page-header">
        <h1>Activity Calendar</h1>
        <div class="page-header-actions">
          <div class="flex gap-sm items-center">
            <button class="btn btn-secondary btn-sm" id="btn-prev"><span class="material-icons-outlined">chevron_left</span></button>
            <button class="btn btn-secondary btn-sm" id="btn-today">Today</button>
            <button class="btn btn-secondary btn-sm" id="btn-next"><span class="material-icons-outlined">chevron_right</span></button>
            <span style="font-weight:600;font-size:var(--font-size-md);margin:0 8px">${monthNames[currentDate.getMonth()]} ${currentDate.getFullYear()}</span>
          </div>
          <div class="flex gap-xs" style="margin-right:16px;">
            <button class="toolbar-filter ${calendarType === 'schedule' ? 'active' : ''}" data-cal="schedule">Schedule</button>
            <button class="toolbar-filter ${calendarType === 'activity' ? 'active' : ''}" data-cal="activity">Activities</button>
          </div>
          <div class="flex gap-xs">
            <button class="toolbar-filter ${viewMode === 'day' ? 'active' : ''}" data-view="day">Day</button>
            <button class="toolbar-filter ${viewMode === 'week' ? 'active' : ''}" data-view="week">Week</button>
          </div>
        </div>
      </div>

      <div style="display:flex;gap:16px;flex:1;min-height:0;overflow:hidden">
        <!-- Main Content -->
        <div class="card" style="flex:1;display:flex;flex-direction:column;overflow:hidden">
          <div style="padding:14px 18px;border-bottom:1px solid var(--border-color);display:flex;justify-content:space-between;align-items:center">
            <div style="display:flex;gap:6px">
              <button class="toolbar-filter act-filter ${filterStatus === 'active' ? 'active' : ''}" data-filter="active">Active</button>
              <button class="toolbar-filter act-filter ${filterStatus === 'all' ? 'active' : ''}" data-filter="all">All</button>
              <button class="toolbar-filter act-filter ${filterStatus === 'completed' ? 'active' : ''}" data-filter="completed">Completed</button>
              <button class="toolbar-filter act-filter ${filterStatus === 'overdue' ? 'active' : ''}" data-filter="overdue" style="${stats.overdue > 0 ? 'color:var(--color-danger)' : ''}">Overdue${stats.overdue > 0 ? ` (${stats.overdue})` : ''}</button>
            </div>
            <button class="btn btn-primary btn-sm" id="btn-new-activity" data-tooltip="Schedule a new meeting, call, or email follow-up" data-tooltip-pos="left"><span class="material-icons-outlined" style="font-size:16px;margin-right:4px">add</span>New Activity</button>
          </div>
          <div style="flex:1;overflow-y:auto;padding:16px">
            ${days.map(day => {
              const dateStr = day.toISOString().split('T')[0];
              const isToday = dateStr === new Date().toISOString().split('T')[0];
              const dayActs = activities.filter(a => a.date === dateStr).sort((a, b) => (a.time || '99:99').localeCompare(b.time || '99:99'));
              return `
                <div style="margin-bottom:20px">
                  <div style="display:flex;align-items:center;gap:8px;margin-bottom:10px;padding-bottom:6px;border-bottom:1px solid var(--border-color)">
                    ${isToday ? '<span style="width:8px;height:8px;border-radius:50%;background:var(--color-primary);flex-shrink:0"></span>' : ''}
                    <h4 style="margin:0;font-size:13px;${isToday ? 'color:var(--color-primary)' : 'color:var(--text-secondary)'}">${dayNames[day.getDay()]}, ${day.getDate()} ${monthNames[day.getMonth()]}</h4>
                    <span style="font-size:11px;color:var(--text-tertiary)">${dayActs.length} ${dayActs.length === 1 ? 'activity' : 'activities'}</span>
                  </div>
                  ${dayActs.length === 0 ? '<p style="color:var(--text-tertiary);font-size:12px;margin:0 0 0 16px">No activities scheduled.</p>' : `
                    <div style="display:flex;flex-direction:column;gap:8px">${dayActs.map(a => renderCard(a)).join('')}</div>
                  `}
                </div>`;
            }).join('')}
          </div>
        </div>

        <!-- Sidebar -->
        <div class="card" style="width:280px;flex-shrink:0;display:flex;flex-direction:column;overflow-y:auto;height:100%;min-height:0">
          <!-- Stats -->
          <div style="padding:16px;border-bottom:1px solid var(--border-color)">
            <h4 style="font-size:var(--font-size-sm);margin:0 0 12px 0;display:flex;align-items:center;gap:6px">
              <span class="material-icons-outlined" style="font-size:16px">insights</span>This Week
            </h4>
            <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px">
              <div style="text-align:center;padding:10px;background:var(--content-bg);border-radius:8px">
                <div style="font-size:20px;font-weight:700;color:var(--color-primary)">${stats.pending}</div>
                <div style="font-size:10px;color:var(--text-tertiary);text-transform:uppercase;font-weight:600">Pending</div>
              </div>
              <div style="text-align:center;padding:10px;background:var(--content-bg);border-radius:8px">
                <div style="font-size:20px;font-weight:700;color:#10B981">${stats.completed}</div>
                <div style="font-size:10px;color:var(--text-tertiary);text-transform:uppercase;font-weight:600">Done</div>
              </div>
              ${stats.overdue > 0 ? `
              <div style="text-align:center;padding:10px;background:#FEF2F2;border-radius:8px;grid-column:span 2">
                <div style="font-size:20px;font-weight:700;color:#EF4444">${stats.overdue}</div>
                <div style="font-size:10px;color:#EF4444;text-transform:uppercase;font-weight:600">Overdue</div>
              </div>` : ''}
            </div>
          </div>
          ${!isTechnician ? `
          <!-- Team Filter -->
          <div style="padding:16px;border-bottom:1px solid var(--border-color)">
            <h4 style="font-size:var(--font-size-sm);margin:0 0 12px 0;display:flex;align-items:center;gap:6px">
              <span class="material-icons-outlined" style="font-size:16px">people</span>View By
            </h4>
            <select class="form-select" id="act-tech-filter" style="width:100%">
              <option value="all" ${filterTechId === 'all' ? 'selected' : ''}>All Team Members</option>
              ${technicians.map(t => `<option value="${t.id}" ${filterTechId === t.id ? 'selected' : ''}>${t.name}</option>`).join('')}
            </select>
          </div>` : ''}
          <!-- Quick Create -->
          <div style="padding:16px">
            <h4 style="font-size:var(--font-size-sm);margin:0 0 12px 0;display:flex;align-items:center;gap:6px">
              <span class="material-icons-outlined" style="font-size:16px">bolt</span>Quick Add
            </h4>
            <div style="display:flex;flex-direction:column;gap:6px">
              ${ACTIVITY_TYPES.slice(0, 5).map(t => `
                <button class="btn btn-secondary btn-sm act-quick-add" data-type="${t.value}" style="justify-content:flex-start;gap:8px;text-align:left">
                  <span class="material-icons-outlined" style="font-size:16px;color:${t.color}">${t.icon}</span>${t.label}
                </button>
              `).join('')}
            </div>
          </div>
        </div>
      </div>`;

    bindActivityEvents();
  }

  function openActivityModal(existing = null) {
    const isEdit = !!existing;
    const a = existing || { title: '', type: 'call', date: new Date().toISOString().split('T')[0], time: '', duration: 15, priority: 'normal', status: 'pending', assignedToId: currentUser.id, linkedType: '', linkedId: '', linkedLabel: '', notes: '' };

    const jobs = store.getAll('jobs').filter(j => j.status !== 'Completed' && j.status !== 'Invoiced');
    const customers = store.getAll('customers');
    const quotes = store.getAll('quotes');

    const content = document.createElement('div');
    content.innerHTML = `
      <div class="form-group" style="margin-bottom:12px">
        <label class="form-label">Title *</label>
        <input type="text" class="form-input" id="act-title" value="${escapeHTML(a.title)}" placeholder="e.g. Follow up on quote..." style="width:100%" />
      </div>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:12px">
        <div class="form-group" style="margin:0">
          <label class="form-label">Type</label>
          <select class="form-select" id="act-type" style="width:100%">
            ${ACTIVITY_TYPES.map(t => `<option value="${t.value}" ${a.type === t.value ? 'selected' : ''}>${t.label}</option>`).join('')}
          </select>
        </div>
        <div class="form-group" style="margin:0">
          <label class="form-label">Priority</label>
          <select class="form-select" id="act-priority" style="width:100%">
            <option value="low" ${a.priority === 'low' ? 'selected' : ''}>Low</option>
            <option value="normal" ${a.priority === 'normal' ? 'selected' : ''}>Normal</option>
            <option value="high" ${a.priority === 'high' ? 'selected' : ''}>High</option>
          </select>
        </div>
      </div>
      <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:12px;margin-bottom:12px">
        <div class="form-group" style="margin:0">
          <label class="form-label">Date *</label>
          <input type="date" class="form-input" id="act-date" value="${a.date}" style="width:100%" />
        </div>
        <div class="form-group" style="margin:0">
          <label class="form-label">Time</label>
          <input type="time" class="form-input" id="act-time" value="${a.time || ''}" style="width:100%" />
        </div>
        <div class="form-group" style="margin:0">
          <label class="form-label">Duration (min)</label>
          <input type="number" class="form-input" id="act-duration" value="${a.duration || ''}" min="0" step="5" style="width:100%" />
        </div>
      </div>
      ${!isTechnician ? `
      <div class="form-group" style="margin-bottom:12px">
        <label class="form-label">Assign To</label>
        <select class="form-select" id="act-assignee" style="width:100%">
          ${store.getAll('technicians').filter(t => !t.deactivated || a.assignedToId === t.id).map(t => `<option value="${t.id}" ${a.assignedToId === t.id ? 'selected' : ''}>${t.name}</option>`).join('')}
        </select>
      </div>` : ''}
      <div style="display:grid;grid-template-columns:1fr 2fr;gap:12px;margin-bottom:12px">
        <div class="form-group" style="margin:0">
          <label class="form-label">Link To</label>
          <select class="form-select" id="act-link-type" style="width:100%">
            <option value="">None</option>
            <option value="job" ${a.linkedType === 'job' ? 'selected' : ''}>Job</option>
            <option value="customer" ${a.linkedType === 'customer' ? 'selected' : ''}>Customer</option>
            <option value="quote" ${a.linkedType === 'quote' ? 'selected' : ''}>Quote</option>
          </select>
        </div>
        <div class="form-group" style="margin:0">
          <label class="form-label">Record</label>
          <select class="form-select" id="act-link-record" style="width:100%">
            <option value="">Select...</option>
          </select>
        </div>
      </div>
      <div class="form-group" style="margin-bottom:12px">
        <label class="form-label">Notes</label>
        <textarea class="form-input" id="act-notes" rows="3" placeholder="Additional details..." style="width:100%">${escapeHTML(a.notes || '')}</textarea>
      </div>
      ${!isEdit ? `
      <div style="border:1px solid var(--border-color);border-radius:var(--border-radius);overflow:hidden">
        <label style="display:flex;align-items:center;gap:8px;padding:10px 14px;cursor:pointer;font-size:13px;font-weight:500;color:var(--text-primary);background:var(--content-bg)">
          <input type="checkbox" id="act-recur-enabled" />
          <span class="material-icons-outlined" style="font-size:16px;color:var(--text-secondary)">repeat</span>
          Make this a recurring activity
        </label>
        <div id="act-recur-details" style="display:none;padding:12px 14px;border-top:1px solid var(--border-color);background:var(--card-bg)">
          <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:10px">
            <div class="form-group" style="margin:0">
              <label class="form-label">Frequency</label>
              <select class="form-select" id="act-recur-freq" style="width:100%">
                <option value="daily">Daily</option>
                <option value="weekly" selected>Weekly</option>
                <option value="fortnightly">Fortnightly</option>
                <option value="monthly">Monthly</option>
              </select>
            </div>
            <div class="form-group" style="margin:0">
              <label class="form-label">Repeat for</label>
              <div style="display:flex;align-items:center;gap:6px">
                <input type="number" class="form-input" id="act-recur-count" value="4" min="2" max="52" style="width:70px" />
                <span style="font-size:12px;color:var(--text-secondary)">occurrences</span>
              </div>
            </div>
          </div>
          <div id="act-recur-weekdays" style="display:flex;gap:4px;flex-wrap:wrap">
            ${['Mon','Tue','Wed','Thu','Fri','Sat','Sun'].map((d, i) => `
              <label style="display:flex;align-items:center;gap:4px;font-size:12px;padding:4px 8px;border:1px solid var(--border-color);border-radius:4px;cursor:pointer">
                <input type="checkbox" class="recur-day-cb" value="${i + 1}" ${i < 5 ? '' : ''} />${d}
              </label>
            `).join('')}
          </div>
          <div style="margin-top:8px;font-size:11px;color:var(--text-tertiary)">For weekly/fortnightly, select which days. For daily/monthly the date field is used as the anchor.</div>
        </div>
      </div>` : ''}
    `;

    // Populate linked records dropdown
    function populateRecords(type, selectedId) {
      const sel = content.querySelector('#act-link-record');
      let opts = '<option value="">Select...</option>';
      if (type === 'job') opts += jobs.map(j => `<option value="${j.id}" data-label="Job ${j.number}" ${selectedId === j.id ? 'selected' : ''}>${j.number} — ${escapeHTML(j.title)}</option>`).join('');
      else if (type === 'customer') opts += customers.map(c => `<option value="${c.id}" data-label="${escapeHTML(c.company || c.firstName + ' ' + c.lastName)}" ${selectedId === c.id ? 'selected' : ''}>${escapeHTML(c.company || c.firstName + ' ' + c.lastName)}</option>`).join('');
      else if (type === 'quote') opts += quotes.map(q => `<option value="${q.id}" data-label="Quote ${q.number}" ${selectedId === q.id ? 'selected' : ''}>${q.number} — ${escapeHTML(q.customerName || '')}</option>`).join('');
      sel.innerHTML = opts;
    }

    populateRecords(a.linkedType, a.linkedId);
    content.querySelector('#act-link-type').addEventListener('change', e => populateRecords(e.target.value, ''));

    // Recurrence toggle
    const recurCheck = content.querySelector('#act-recur-enabled');
    const recurDetails = content.querySelector('#act-recur-details');
    const recurWeekdays = content.querySelector('#act-recur-weekdays');
    const recurFreq = content.querySelector('#act-recur-freq');
    if (recurCheck) {
      recurCheck.addEventListener('change', () => { recurDetails.style.display = recurCheck.checked ? 'block' : 'none'; });
      recurFreq?.addEventListener('change', () => { recurWeekdays.style.display = (recurFreq.value === 'weekly' || recurFreq.value === 'fortnightly') ? 'flex' : 'none'; });
    }

    showModal({
      title: isEdit ? 'Edit Activity' : 'New Activity',
      content,
      size: 'modal-70',
      actions: [
        { label: 'Cancel', className: 'btn-secondary', onClick: close => close() },
        { label: isEdit ? 'Save Changes' : 'Create Activity', className: 'btn-primary', onClick: close => {
          const title = content.querySelector('#act-title').value.trim();
          const date = content.querySelector('#act-date').value;
          if (!title || !date) { showToast('Title and date are required', 'error'); return; }

          const linkType = content.querySelector('#act-link-type').value;
          const linkSel = content.querySelector('#act-link-record');
          const linkOpt = linkSel.options[linkSel.selectedIndex];

          const data = {
            title,
            type: content.querySelector('#act-type').value,
            priority: content.querySelector('#act-priority').value,
            date,
            time: content.querySelector('#act-time').value || '',
            duration: parseInt(content.querySelector('#act-duration').value) || 0,
            assignedToId: isTechnician ? currentUser.id : (content.querySelector('#act-assignee')?.value || currentUser.id),
            linkedType: linkType,
            linkedId: linkSel.value || '',
            linkedLabel: linkOpt?.dataset?.label || '',
            notes: content.querySelector('#act-notes').value,
            status: isEdit ? a.status : 'pending',
          };

          if (isEdit) {
            store.update('activities', a.id, data);
            showToast('Activity updated', 'success');
          } else {
            // Check for recurrence
            const isRecurring = content.querySelector('#act-recur-enabled')?.checked;
            if (isRecurring) {
              const freq = content.querySelector('#act-recur-freq').value;
              const count = Math.min(parseInt(content.querySelector('#act-recur-count').value) || 4, 52);
              const selectedDays = [...content.querySelectorAll('.recur-day-cb:checked')].map(cb => parseInt(cb.value));

              const dates = [];
              const baseDate = new Date(date + 'T12:00:00');

              if (freq === 'daily') {
                for (let i = 0; i < count; i++) {
                  const d = new Date(baseDate); d.setDate(d.getDate() + i); dates.push(d);
                }
              } else if (freq === 'weekly' || freq === 'fortnightly') {
                const step = freq === 'fortnightly' ? 2 : 1;
                const useDays = selectedDays.length > 0 ? selectedDays : [baseDate.getDay() === 0 ? 7 : baseDate.getDay()];
                let weekStart = new Date(baseDate);
                weekStart.setDate(weekStart.getDate() - ((weekStart.getDay() + 6) % 7)); // Monday
                let added = 0;
                for (let w = 0; added < count && w < 200; w++) {
                  for (const dow of useDays) {
                    if (added >= count) break;
                    const d = new Date(weekStart); d.setDate(d.getDate() + (dow - 1));
                    if (d >= baseDate) { dates.push(d); added++; }
                  }
                  weekStart.setDate(weekStart.getDate() + 7 * step);
                }
              } else if (freq === 'monthly') {
                for (let i = 0; i < count; i++) {
                  const d = new Date(baseDate); d.setMonth(d.getMonth() + i); dates.push(d);
                }
              }

              const pad = n => n.toString().padStart(2, '0');
              dates.forEach(d => {
                const ds = `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
                store.create('activities', { ...data, date: ds, recurrenceGroup: data.title + '_' + date });
              });
              showToast(`Created ${dates.length} recurring activities`, 'success');
            } else {
              store.create('activities', data);
              showToast('Activity created', 'success');
            }
          }
          close();
          draw();
        }}
      ]
    });
  }

  function bindActivityEvents() {
    container.querySelector('#btn-prev')?.addEventListener('click', () => onNav(-1));
    container.querySelector('#btn-next')?.addEventListener('click', () => onNav(1));
    container.querySelector('#btn-today')?.addEventListener('click', onToday);
    container.querySelectorAll('[data-view]').forEach(b => b.addEventListener('click', () => onViewMode(b.dataset.view)));
    container.querySelectorAll('[data-cal]').forEach(b => b.addEventListener('click', () => onCalType(b.dataset.cal)));

    // Filters
    container.querySelectorAll('.act-filter').forEach(b => b.addEventListener('click', () => { filterStatus = b.dataset.filter; draw(); }));
    container.querySelector('#act-tech-filter')?.addEventListener('change', e => { filterTechId = e.target.value; draw(); });

    // New activity
    container.querySelector('#btn-new-activity')?.addEventListener('click', () => openActivityModal());

    // Quick add
    container.querySelectorAll('.act-quick-add').forEach(b => b.addEventListener('click', () => {
      const type = b.dataset.type;
      openActivityModal({ title: '', type, date: new Date().toISOString().split('T')[0], time: '', duration: 15, priority: 'normal', status: 'pending', assignedToId: currentUser.id, linkedType: '', linkedId: '', linkedLabel: '', notes: '' });
    }));

    // Card actions
    container.querySelectorAll('.act-toggle-complete').forEach(b => b.addEventListener('click', e => {
      e.stopPropagation();
      const act = store.getById('activities', b.dataset.id);
      if (act) { store.update('activities', act.id, { status: act.status === 'completed' ? 'pending' : 'completed' }); draw(); }
    }));

    container.querySelectorAll('.act-edit').forEach(b => b.addEventListener('click', e => {
      e.stopPropagation();
      const act = store.getById('activities', b.dataset.id);
      if (act) openActivityModal(act);
    }));

    container.querySelectorAll('.act-delete').forEach(b => b.addEventListener('click', e => {
      e.stopPropagation();
      showModal({
        title: 'Delete Activity',
        content: '<p>Are you sure you want to delete this activity?</p>',
        actions: [
          { label: 'Cancel', className: 'btn-secondary', onClick: c => c() },
          { label: 'Delete', className: 'btn-danger', onClick: c => { store.delete('activities', b.dataset.id); showToast('Activity deleted', 'success'); c(); draw(); }}
        ]
      });
    }));

    // Linked record navigation
    container.querySelectorAll('.act-linked-record').forEach(el => el.addEventListener('click', e => {
      e.stopPropagation();
      const route = getLinkedRoute(el.dataset.type, el.dataset.linkedId);
      if (route) router.navigate(route);
    }));
  }

  draw();
}
