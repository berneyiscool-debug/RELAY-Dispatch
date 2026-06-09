// ============================================
// FIELDFORGE — SIMPLE / FIELD MODE
// ============================================
// A stripped-down, touch-friendly view for
// technicians who don't need the full UI.
// Routes: /field, /field/jobs, /field/jobs/:id
// ============================================

import { store } from '../../data/store.js';
import { router } from '../../router.js';
import { escapeHTML } from '../../utils/security.js';
import { showToast } from '../../components/Notifications.js';

// ---- Shared helpers ----

const STATUS_BADGE = {
  'Pending':     'badge-warning',
  'Scheduled':   'badge-info',
  'In Progress': 'badge-primary',
  'On Hold':     'badge-neutral',
  'Completed':   'badge-success',
  'Invoiced':    'badge-primary',
};

const PRIORITY_BADGE = {
  'Low':    'badge-neutral',
  'Medium': 'badge-warning',
  'High':   'badge-danger',
  'Urgent': 'badge-danger',
};

function fmt(dateStr) {
  if (!dateStr) return '—';
  return new Date(dateStr).toLocaleDateString('en-AU', { day: 'numeric', month: 'short', year: 'numeric' });
}

function fieldHeader(container, { title, subtitle = '', showBack = false, backPath = '/field' }) {
  const currentUser = JSON.parse(localStorage.getItem('currentUser') || 'null');
  const userName = currentUser?.name || '';

  const header = document.createElement('div');
  header.className = 'field-header';
  header.innerHTML = `
    <div class="field-header-left">
      ${showBack ? `<button class="field-header-back" id="field-back-btn" aria-label="Back">
        <span class="material-icons-outlined">arrow_back</span>
      </button>` : ''}
      <div>
        <div class="field-header-title">${escapeHTML(title)}</div>
        ${subtitle ? `<div class="field-header-subtitle">${escapeHTML(subtitle)}</div>` : ''}
      </div>
    </div>
    <div class="field-header-right">
      ${userName ? `<div class="field-user-chip">
        <span class="material-icons-outlined" style="font-size:13px;">person</span>
        ${escapeHTML(userName)}
      </div>` : ''}
      <a href="#/" class="field-header-exit" data-tooltip="Switch back to the full FieldForge interface">
        <span class="material-icons-outlined" style="font-size:14px;">open_in_full</span>
        Full view
      </a>
    </div>
  `;

  if (showBack) {
    header.querySelector('#field-back-btn').addEventListener('click', () => router.navigate(backPath));
  }

  container.appendChild(header);
}

// ============================================
// HOME SCREEN
// ============================================

export function renderFieldHome(container) {
  container.innerHTML = '';
  container.style.padding = '0';

  const wrap = document.createElement('div');
  wrap.className = 'field-mode';

  fieldHeader(wrap, { title: 'SAM Mobility', subtitle: 'Simple Mode' });

  const currentUser = JSON.parse(localStorage.getItem('currentUser') || 'null');
  const firstName = (currentUser?.name || 'Technician').split(' ')[0];

  const allJobs = store.getAll('jobs');
  const today = new Date().toISOString().split('T')[0];
  const todayCount = allJobs.filter(j => j.scheduledDate?.startsWith(today)).length;
  const activeCount = allJobs.filter(j => ['Scheduled', 'In Progress'].includes(j.status)).length;

  const body = document.createElement('div');
  body.className = 'field-body';
  body.innerHTML = `
    <div class="field-greeting">
      <h2>Hello, ${escapeHTML(firstName)}</h2>
      <p>${new Date().toLocaleDateString('en-AU', { weekday: 'long', day: 'numeric', month: 'long' })}</p>
    </div>

    <div class="field-tiles-grid">
      <div class="field-tile" id="tile-today">
        <div class="field-tile-icon">
          <span class="material-icons-outlined">today</span>
        </div>
        <div>
          <div class="field-tile-label">Today's Jobs</div>
          <div class="field-tile-count">${todayCount} scheduled</div>
        </div>
      </div>

      <div class="field-tile" id="tile-all">
        <div class="field-tile-icon">
          <span class="material-icons-outlined">build</span>
        </div>
        <div>
          <div class="field-tile-label">All Jobs</div>
          <div class="field-tile-count">${activeCount} active</div>
        </div>
      </div>

      <div class="field-tile" id="tile-schedule">
        <div class="field-tile-icon">
          <span class="material-icons-outlined">calendar_month</span>
        </div>
        <div>
          <div class="field-tile-label">Schedule</div>
          <div class="field-tile-count">Full calendar</div>
        </div>
      </div>

      <div class="field-tile" id="tile-timesheets">
        <div class="field-tile-icon">
          <span class="material-icons-outlined">schedule</span>
        </div>
        <div>
          <div class="field-tile-label">Timesheets</div>
          <div class="field-tile-count">Log your time</div>
        </div>
      </div>

      <div class="field-tile" id="tile-notifications">
        <div class="field-tile-icon">
          <span class="material-icons-outlined">notifications</span>
        </div>
        <div>
          <div class="field-tile-label">Notifications</div>
          <div class="field-tile-count">Updates &amp; alerts</div>
        </div>
      </div>
    </div>
  `;

  wrap.appendChild(body);
  container.appendChild(wrap);

  body.querySelector('#tile-today').addEventListener('click', () => router.navigate('/field/jobs?filter=today'));
  body.querySelector('#tile-all').addEventListener('click', () => router.navigate('/field/jobs'));
  body.querySelector('#tile-schedule').addEventListener('click', () => router.navigate('/schedule'));
  body.querySelector('#tile-timesheets').addEventListener('click', () => router.navigate('/timesheets'));
  body.querySelector('#tile-notifications').addEventListener('click', () => router.navigate('/notifications'));
}

// ============================================
// JOBS LIST
// ============================================

export function renderFieldJobsList(container, params) {
  container.innerHTML = '';
  container.style.padding = '0';

  const initialFilter = params?.filter || 'all';

  const wrap = document.createElement('div');
  wrap.className = 'field-mode';

  fieldHeader(wrap, { title: 'Service Orders', showBack: true, backPath: '/field' });

  const body = document.createElement('div');
  body.className = 'field-body';
  wrap.appendChild(body);
  container.appendChild(wrap);

  function renderList(filter) {
    body.innerHTML = '';

    const today = new Date().toISOString().split('T')[0];
    let jobs = store.getAll('jobs');

    if (filter === 'today') {
      jobs = jobs.filter(j => j.scheduledDate?.startsWith(today));
    } else if (filter === 'active') {
      jobs = jobs.filter(j => ['Scheduled', 'In Progress'].includes(j.status));
    } else if (filter === 'completed') {
      jobs = jobs.filter(j => ['Completed', 'Invoiced'].includes(j.status));
    }

    jobs.sort((a, b) => {
      const order = ['In Progress', 'Scheduled', 'Pending', 'On Hold', 'Completed', 'Invoiced'];
      return order.indexOf(a.status) - order.indexOf(b.status);
    });

    body.innerHTML = `
      <div class="field-filter-row">
        <button class="field-filter-chip ${filter === 'all' ? 'active' : ''}" data-filter="all">All Jobs</button>
        <button class="field-filter-chip ${filter === 'today' ? 'active' : ''}" data-filter="today">Today</button>
        <button class="field-filter-chip ${filter === 'active' ? 'active' : ''}" data-filter="active">Active</button>
        <button class="field-filter-chip ${filter === 'completed' ? 'active' : ''}" data-filter="completed">Completed</button>
      </div>
      <div id="field-jobs-items"></div>
    `;

    body.querySelectorAll('.field-filter-chip').forEach(btn => {
      btn.addEventListener('click', () => renderList(btn.dataset.filter));
    });

    const listEl = body.querySelector('#field-jobs-items');

    if (!jobs.length) {
      listEl.innerHTML = `
        <div class="field-jobs-empty">
          <span class="material-icons-outlined">build_circle</span>
          <p>No service orders found</p>
        </div>
      `;
      return;
    }

    listEl.className = 'field-jobs-list';
    jobs.forEach(job => {
      const card = document.createElement('div');
      card.className = 'field-job-card';
      card.innerHTML = `
        <div class="field-job-card-header">
          <div class="field-job-card-title">${escapeHTML(job.title || 'Untitled Job')}</div>
          <div class="field-job-card-number">${escapeHTML(job.number || '')}</div>
        </div>
        <div class="field-job-card-meta">
          <span class="badge ${STATUS_BADGE[job.status] || 'badge-neutral'}">${escapeHTML(job.status)}</span>
          <span class="badge ${PRIORITY_BADGE[job.priority] || 'badge-neutral'}">${escapeHTML(job.priority || '')}</span>
          ${job.customerName ? `<span class="field-job-card-meta-item">
            <span class="material-icons-outlined">person</span>
            ${escapeHTML(job.customerName)}
          </span>` : ''}
          ${job.siteAddress ? `<span class="field-job-card-meta-item">
            <span class="material-icons-outlined">location_on</span>
            ${escapeHTML(job.siteAddress)}
          </span>` : ''}
          ${job.scheduledDate ? `<span class="field-job-card-meta-item">
            <span class="material-icons-outlined">event</span>
            ${fmt(job.scheduledDate)}
          </span>` : ''}
        </div>
      `;
      card.addEventListener('click', () => router.navigate(`/field/jobs/${job.id}`));
      listEl.appendChild(card);
    });
  }

  renderList(initialFilter);
}

// ============================================
// JOB DETAIL
// ============================================

export function renderFieldJobDetail(container, { id }) {
  container.innerHTML = '';
  container.style.padding = '0';

  const job = store.getById('jobs', id);
  if (!job) {
    container.innerHTML = `<div class="field-mode"><div class="field-body">
      <div class="field-jobs-empty">
        <span class="material-icons-outlined">error_outline</span>
        <p>Service order not found</p>
      </div>
    </div></div>`;
    return;
  }

  let activeTab = 'overview';

  const wrap = document.createElement('div');
  wrap.className = 'field-mode';

  fieldHeader(wrap, {
    title: job.number || 'Job Detail',
    subtitle: job.title,
    showBack: true,
    backPath: '/field/jobs',
  });

  const body = document.createElement('div');
  body.className = 'field-body';
  wrap.appendChild(body);
  container.appendChild(wrap);

  function render() {
    body.innerHTML = '';

    // Hero card
    body.innerHTML = `
      <div class="field-detail-hero">
        <div class="field-detail-hero-title">${escapeHTML(job.title || 'Untitled Job')}</div>
        <div class="field-detail-hero-sub">${escapeHTML(job.customerName || '')}${job.siteAddress ? ' · ' + escapeHTML(job.siteAddress) : ''}</div>
        <div class="field-detail-badges">
          <span class="badge ${STATUS_BADGE[job.status] || 'badge-neutral'}">${escapeHTML(job.status)}</span>
          <span class="badge ${PRIORITY_BADGE[job.priority] || 'badge-neutral'}">${escapeHTML(job.priority || '')}</span>
          ${job.type ? `<span class="badge badge-neutral">${escapeHTML(job.type)}</span>` : ''}
        </div>
      </div>

      <div class="field-status-row">
        <label for="field-status-select">Update Status</label>
        <select class="field-status-select" id="field-status-select">
          ${['Pending', 'Scheduled', 'In Progress', 'On Hold', 'Completed'].map(s =>
            `<option value="${s}" ${job.status === s ? 'selected' : ''}>${s}</option>`
          ).join('')}
        </select>
      </div>

      <div class="field-tabs">
        <button class="field-tab-btn ${activeTab === 'overview' ? 'active' : ''}" data-tab="overview">Overview</button>
        <button class="field-tab-btn ${activeTab === 'tasks' ? 'active' : ''}" data-tab="tasks">Tasks</button>
        <button class="field-tab-btn ${activeTab === 'notes' ? 'active' : ''}" data-tab="notes">Notes</button>
        <button class="field-tab-btn ${activeTab === 'time' ? 'active' : ''}" data-tab="time">Time</button>
      </div>

      <div id="field-tab-content"></div>
    `;

    body.querySelectorAll('.field-tab-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        activeTab = btn.dataset.tab;
        body.querySelectorAll('.field-tab-btn').forEach(b => b.classList.toggle('active', b.dataset.tab === activeTab));
        renderTabContent();
      });
    });

    body.querySelector('#field-status-select').addEventListener('change', (e) => {
      store.update('jobs', id, { status: e.target.value });
      job.status = e.target.value;
      // Update the hero badges without a full re-render
      const badges = body.querySelector('.field-detail-badges');
      if (badges) {
        badges.querySelector('.badge:first-child').className = `badge ${STATUS_BADGE[job.status] || 'badge-neutral'}`;
        badges.querySelector('.badge:first-child').textContent = job.status;
      }
      showToast(`Status updated to ${e.target.value}`, 'success');
    });

    renderTabContent();
  }

  function renderTabContent() {
    const el = body.querySelector('#field-tab-content');
    if (!el) return;

    if (activeTab === 'overview') renderOverviewTab(el);
    else if (activeTab === 'tasks') renderTasksTab(el);
    else if (activeTab === 'notes') renderNotesTab(el);
    else if (activeTab === 'time') renderTimeTab(el);
  }

  function renderOverviewTab(el) {
    const techName = job.technicians?.length
      ? job.technicians.map(t => t.name).join(', ')
      : (job.technicianName || '—');

    el.innerHTML = `
      <div class="field-info-grid">
        <div class="field-info-card">
          <div class="field-info-label">Job Number</div>
          <div class="field-info-value">${escapeHTML(job.number || '—')}</div>
        </div>
        <div class="field-info-card">
          <div class="field-info-label">Type</div>
          <div class="field-info-value">${escapeHTML(job.type || '—')}</div>
        </div>
        <div class="field-info-card">
          <div class="field-info-label">Customer</div>
          <div class="field-info-value">${escapeHTML(job.customerName || '—')}</div>
        </div>
        <div class="field-info-card">
          <div class="field-info-label">Contact</div>
          <div class="field-info-value">${escapeHTML(job.contactName || '—')}</div>
        </div>
        <div class="field-info-card full-width">
          <div class="field-info-label">Site Address</div>
          <div class="field-info-value">${escapeHTML(job.siteAddress || '—')}</div>
        </div>
        <div class="field-info-card">
          <div class="field-info-label">Scheduled Date</div>
          <div class="field-info-value">${fmt(job.scheduledDate)}</div>
        </div>
        <div class="field-info-card">
          <div class="field-info-label">Est. Hours</div>
          <div class="field-info-value">${job.estimatedHours ? job.estimatedHours + 'h' : '—'}</div>
        </div>
        <div class="field-info-card full-width">
          <div class="field-info-label">Assigned To</div>
          <div class="field-info-value">${escapeHTML(techName)}</div>
        </div>
      </div>
    `;
  }

  function renderTasksTab(el) {
    const tasks = job.tasks || [];

    if (!tasks.length) {
      el.innerHTML = `<div class="field-jobs-empty">
        <span class="material-icons-outlined">checklist</span>
        <p>No tasks on this job</p>
      </div>`;
      return;
    }

    el.innerHTML = `<div class="field-tasks-list" id="field-tasks-inner"></div>`;
    const list = el.querySelector('#field-tasks-inner');

    function renderTasks(taskList, depth = 0) {
      taskList.forEach((task, idx) => {
        const item = document.createElement('div');
        item.className = `field-task-item${task.completed ? ' completed' : ''}`;
        item.style.marginLeft = depth ? `${depth * 16}px` : '';
        item.innerHTML = `
          <div class="field-task-check ${task.completed ? 'done' : ''}">
            ${task.completed ? '<span class="material-icons-outlined">check</span>' : ''}
          </div>
          <div class="field-task-text ${task.completed ? 'done' : ''}">${escapeHTML(task.name || task.description || 'Task')}</div>
        `;
        item.addEventListener('click', () => {
          task.completed = !task.completed;
          store.update('jobs', id, { tasks: job.tasks });
          renderTasksTab(el);
        });
        list.appendChild(item);

        if (task.subtasks?.length) {
          renderTasks(task.subtasks, depth + 1);
        }
      });
    }

    renderTasks(tasks);
  }

  function renderNotesTab(el) {
    const notes = job.notes || '';
    el.innerHTML = `
      <div class="field-notes-card">
        ${notes
          ? `<p class="field-notes-text">${escapeHTML(notes)}</p>`
          : `<p class="field-notes-text" style="color:var(--text-tertiary);font-style:italic;">No notes on this job.</p>`
        }
      </div>
    `;
  }

  function renderTimeTab(el) {
    const allTimesheets = store.getAll('timesheets');
    const jobSheets = allTimesheets.filter(t => t.jobId === id);
    const totalHours = jobSheets.reduce((s, t) => s + (t.durationHours || 0), 0);

    const currentUser = JSON.parse(localStorage.getItem('currentUser') || 'null');
    let timerRunning = false;
    let timerStartKey = `field_timer_${id}`;
    let timerStart = localStorage.getItem(timerStartKey);
    if (timerStart) timerRunning = true;

    el.innerHTML = `
      <div class="field-info-grid" style="margin-bottom:var(--space-base)">
        <div class="field-info-card">
          <div class="field-info-label">Total Logged</div>
          <div class="field-info-value">${totalHours.toFixed(1)}h</div>
        </div>
        <div class="field-info-card">
          <div class="field-info-label">Est. Hours</div>
          <div class="field-info-value">${job.estimatedHours ? job.estimatedHours + 'h' : '—'}</div>
        </div>
      </div>

      <div style="margin-bottom:var(--space-lg)">
        <button class="field-timer-btn ${timerRunning ? 'stop' : 'start'}" id="field-timer-btn">
          <span class="material-icons-outlined">${timerRunning ? 'stop_circle' : 'play_circle'}</span>
          ${timerRunning ? 'Stop Timer' : 'Start Timer'}
        </button>
        ${timerRunning ? `<div style="margin-top:var(--space-sm);font-size:var(--font-size-xs);color:var(--text-tertiary)">
          Started ${new Date(parseInt(timerStart)).toLocaleTimeString('en-AU', { hour: '2-digit', minute: '2-digit' })}
        </div>` : ''}
      </div>

      ${jobSheets.length ? `
        <div class="field-section-label">Time Entries</div>
        <div class="field-jobs-list">
          ${jobSheets.map(t => `
            <div class="field-job-card" style="cursor:default">
              <div class="field-job-card-header">
                <div class="field-job-card-title" style="font-size:var(--font-size-md)">${escapeHTML(t.technicianName || '—')}</div>
                <span class="badge ${t.status === 'Approved' ? 'badge-success' : t.status === 'Rejected' ? 'badge-danger' : 'badge-warning'}">${escapeHTML(t.status || 'Pending')}</span>
              </div>
              <div class="field-job-card-meta">
                <span class="field-job-card-meta-item">
                  <span class="material-icons-outlined">calendar_today</span>
                  ${fmt(t.date)}
                </span>
                <span class="field-job-card-meta-item">
                  <span class="material-icons-outlined">schedule</span>
                  ${t.durationHours || 0}h logged
                </span>
              </div>
            </div>
          `).join('')}
        </div>
      ` : ''}
    `;

    el.querySelector('#field-timer-btn').addEventListener('click', () => {
      if (!timerRunning) {
        localStorage.setItem(timerStartKey, Date.now().toString());
        showToast('Timer started', 'success');
      } else {
        const started = parseInt(localStorage.getItem(timerStartKey));
        const elapsed = (Date.now() - started) / 3600000;
        localStorage.removeItem(timerStartKey);

        if (currentUser) {
          store.create('timesheets', {
            technicianId: currentUser.id,
            technicianName: currentUser.name,
            jobId: id,
            jobNumber: job.number,
            date: new Date().toISOString().split('T')[0],
            durationHours: Math.round(elapsed * 10) / 10,
            status: 'Pending',
          });
          showToast(`Logged ${(Math.round(elapsed * 10) / 10)}h`, 'success');
        }
      }
      renderTimeTab(el);
    });
  }

  render();
}
