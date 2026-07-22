// ============================================
// SIMPRO CLONE — SCHEDULE VIEW (v2 — Drag & Drop)
// ============================================

import { store } from '../../data/store.js';
import { router } from '../../router.js';
import { showToast } from '../../components/Notifications.js';
import { escapeHTML } from '../../utils/security.js';
import { showDrawer } from '../../components/Drawer.js';
import { showModal } from '../../components/Modal.js';
import { renderActivityCalendar as renderActivityModule } from './ActivityCalendar.js';
import { parsePreferredTime } from '../../utils/dateUtils.js';
import { FLAGS } from '../../utils/flags.js';
import { getVirtualRecurringOccurrences, materializeVirtualOccurrence } from '../../utils/maintenanceEngine.js';

export function renderScheduleView(container) {
  document.querySelectorAll('.schedule-tooltip-popover').forEach(t => t.remove());
  container.style.height = '100%';
  container.style.display = 'flex';
  container.style.flexDirection = 'column';
  container.style.overflow = 'hidden';

  const currentUser = JSON.parse(localStorage.getItem('currentUser') || '{}');
  const loginMode = localStorage.getItem('relay_login_mode');
  const isLocalAdmin = loginMode === 'local';

  function getTechnicians() {
    const allTechs = store.getAll('technicians') || [];
    if (isLocalAdmin) {
      return [{
        id: currentUser.id,
        name: currentUser.name || 'Local Admin',
        role: 'Administrator',
        color: currentUser.color || '#FF5C00',
        userTypeId: currentUser.userTypeId
      }];
    }
    const techs = allTechs.filter(t => !t.deactivated);
    const hasCurrentUser = techs.some(t => t.id === currentUser.id || t.name === currentUser.name);
    if (!hasCurrentUser && currentUser.id) {
      techs.push({
        id: currentUser.id,
        name: currentUser.name || 'Staff User',
        role: currentUser.role === 'admin' ? 'Administrator' : (currentUser.role === 'manager' ? 'Manager' : 'Staff'),
        color: currentUser.color || '#FF5C00',
        userTypeId: currentUser.userTypeId || 'ut_admin'
      });
    }
    return techs;
  }

  let technicians = getTechnicians();
  // jobs read fresh each render — do NOT cache here

  // Role-based access: read who is logged in
  const isTechnician = currentUser.role === 'technician' || (loginMode === 'local' && localStorage.getItem('uiMode') === 'technician');
  const hasTechRecord = technicians.some(t => t.id === currentUser.id);
  const isLocalAdminTechView = isTechnician && !hasTechRecord;

  let viewMode = 'week';
  let calendarType = 'schedule'; // 'schedule' or 'activity'
  let currentDate = new Date();
  const hours = Array.from({ length: 24 }, (_, i) => i); // 00:00–23:00
  let dragState = null;
  let resizeState = null;
  let selectedScheduleIds = new Set(); // marquee multi-select of schedule blocks
  let marqueeState = null;
  // Technicians are locked to their own view; admins/managers can toggle multiple
  // If in technician view but has no technician record (local admin toggled), show all.
  let visibleTechIds = new Set((isTechnician && hasTechRecord) ? [currentUser.id] : technicians.map(t => t.id));
  let contextMenu = null;
  let savedScrollTop = 0;
  let savedScrollLeft = 0;
  let savedSearchResultsScrollTop = 0;
  let isActionMenuOpen = false;
  let isSearchActive = false;
  let isTechsPanelOpen = false;
  let jobSearchQuery = '';
  let expandedJobTasklistIds = new Set();

  // 15-min precision: 1 hour = 32px, so 1 quarter = 8px
  const PX_PER_HOUR = 32;
  const PX_PER_QUARTER = PX_PER_HOUR / 4; // 8px

  function snapToQuarter(hours) {
    return Math.round(hours * 4) / 4;
  }

  function formatHour(h) {
    const hrs = Math.floor(h);
    const mins = Math.round((h - hrs) * 60);
    return `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`;
  }

  function saveScroll() {
    const el = document.getElementById('calendar-scroll');
    if (el) { savedScrollTop = el.scrollTop; savedScrollLeft = el.scrollLeft; }
    const searchEl = document.getElementById('job-search-results');
    if (searchEl) { savedSearchResultsScrollTop = searchEl.scrollTop; }
  }

  function restoreScroll() {
    const el = document.getElementById('calendar-scroll');
    if (el) { el.scrollTop = savedScrollTop; el.scrollLeft = savedScrollLeft; }
    const searchEl = document.getElementById('job-search-results');
    if (searchEl) { searchEl.scrollTop = savedSearchResultsScrollTop; }
  }

  function closeContextMenu() {
    if (contextMenu) {
      contextMenu.remove();
      contextMenu = null;
    }
  }

  // Remove the PREVIOUS visit's listener (a fresh function each render, so a plain
  // removeEventListener(closeContextMenu) is a no-op and stale closures pile up —
  // their render() calls then snap the calendar back to the old week, breaking the
  // prev/next arrows). Track the live handler globally instead.
  if (window.__schedCtxListener) document.removeEventListener('click', window.__schedCtxListener);
  window.__schedCtxListener = closeContextMenu;
  document.addEventListener('click', closeContextMenu);

  function syncJobWithSchedules(jobId) {
    if (!jobId) return;
    const job = store.getById('jobs', jobId);
    if (!job) return;

    const jobSchedules = store.getAll('schedule').filter(s => s.jobId === jobId);
    if (jobSchedules.length === 0) {
      store.update('jobs', jobId, {
        scheduledDate: null,
        technicianId: null,
        technicianName: '',
        technicians: []
      });
      return;
    }

    const sorted = [...jobSchedules].sort((a, b) => {
      const aTime = a.startTime ? new Date(a.startTime).getTime() : 0;
      const bTime = b.startTime ? new Date(b.startTime).getTime() : 0;
      return aTime - bTime;
    });

    const firstSched = sorted[0];
    const firstDate = firstSched.date || firstSched.startTime?.split('T')[0] || new Date().toISOString().split('T')[0];

    const techsMap = {};
    jobSchedules.forEach(s => {
      if (!s.technicianId) return;
      if (!techsMap[s.technicianId]) {
        techsMap[s.technicianId] = {
          id: s.technicianId,
          name: s.technicianName || '',
          hours: 0
        };
      }
      techsMap[s.technicianId].hours += s.hours || 0;
    });

    const jobTechs = Object.values(techsMap);

    store.update('jobs', jobId, {
      scheduledDate: firstDate,
      technicianId: firstSched.technicianId || null,
      technicianName: jobTechs.map(t => t.name).join(', '),
      technicians: jobTechs
    });
  }

  function handleDocumentClick(e) {
    if (!e.target.isConnected) return;

    // 1. Quick Add click-away
    const actionTrigger = document.getElementById('btn-action-menu-trigger');
    const actionMenu = document.getElementById('action-dropdown-menu');
    if (isActionMenuOpen && actionTrigger && actionMenu) {
      if (!actionTrigger.contains(e.target) && !actionMenu.contains(e.target)) {
        isActionMenuOpen = false;
        render();
      }
    }

    // 2. Visible Team click-away
    const techTrigger = document.getElementById('btn-tech-filter-trigger');
    const techMenu = document.getElementById('tech-filter-dropdown');
    if (isTechsPanelOpen && techTrigger && techMenu) {
      if (!techTrigger.contains(e.target) && !techMenu.contains(e.target)) {
        isTechsPanelOpen = false;
        render();
      }
    }

    // 3. Search results click-away
    const searchInput = document.getElementById('job-search-input');
    const searchSection = document.getElementById('job-search-section-wrapper');
    if (isSearchActive && searchInput && searchSection) {
      if (!searchInput.contains(e.target) && !searchSection.contains(e.target)) {
        const isChevronClick = e.target.closest('.btn-toggle-job-tasks');
        if (!isChevronClick) {
          isSearchActive = false;
          if (searchSection) searchSection.style.display = 'none';
          if (searchInput) searchInput.blur();
        }
      }
    }
  }
  // Same stale-listener guard as closeContextMenu above — the arrow buttons broke
  // because prior visits' handleDocumentClick closures kept re-rendering old state.
  if (window.__schedDocListener) document.removeEventListener('click', window.__schedDocListener);
  window.__schedDocListener = handleDocumentClick;
  document.addEventListener('click', handleDocumentClick);

  function getWeekDays() {
    const start = new Date(currentDate);
    if (viewMode === 'day') return [new Date(currentDate)];
    const day = start.getDay();
    const diff = start.getDate() - day + (day === 0 ? -6 : 1); // Monday
    start.setDate(diff);
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(start);
      d.setDate(d.getDate() + i);
      return d;
    });
  }

  // Build schedule blocks from jobs (always reads fresh from store)
  function getScheduleBlocks() {
    const jobs = store.getAll('jobs');
    const schedules = store.getAll('schedule');
    const blocks = [];
    const days = getWeekDays();

    // 1. Process schedule allocations for scheduled blocks
    schedules.forEach(s => {
      if (s.type === 'leave' || s.type === 'blockout' || s.type === 'meeting') {
        const sDate = s.date ? new Date(s.date + 'T12:00:00') : (s.startTime ? new Date(s.startTime) : null);
        if (!sDate) return;

        days.forEach((day, dayIdx) => {
          if (sDate.toDateString() === day.toDateString()) {
            let startHour = 8;
            let endHour = 10;
            if (s.startTime && s.finishTime) {
              const startD = new Date(s.startTime);
              const finishD = new Date(s.finishTime);
              startHour = startD.getHours() + (startD.getMinutes() / 60);
              endHour = finishD.getHours() + (finishD.getMinutes() / 60);
            } else if (s.startHour !== undefined && s.endHour !== undefined) {
              startHour = s.startHour;
              endHour = s.endHour;
            }
            blocks.push({
              id: s.id,
              type: s.type,
              jobId: null,
              jobNumber: s.type === 'leave' ? 'LEAVE' : (s.type === 'blockout' ? 'BLOCKOUT' : 'MEETING'),
              customerName: s.notes || (s.type === 'leave' ? 'On Leave' : (s.type === 'blockout' ? 'Calendar Block' : 'Scheduled Meeting')),
              title: s.notes || '',
              technicianId: isLocalAdmin ? currentUser.id : s.technicianId,
              dayIdx,
              startHour,
              endHour,
              status: 'Draft',
              priority: 'Normal',
            });
          }
        });
        return;
      }

      const job = jobs.find(j => j.id === s.jobId);
      if (!job || job.isRecurring === true) return;

      // Handle both seeded dayOffset and absolute date!
      let sDate = null;
      if (s.date) {
        sDate = new Date(s.date + 'T12:00:00'); // set mid-day to avoid timezone shifting issues
      } else if (s.startTime) {
        sDate = new Date(s.startTime);
      } else if (s.dayOffset !== undefined) {
        // Seeded relative dayOffset (Monday of the current week + dayOffset)
        const monday = days[0]; // Monday
        if (monday) {
          sDate = new Date(monday);
          sDate.setDate(sDate.getDate() + s.dayOffset);
        }
      }

      if (!sDate) return;

      days.forEach((day, dayIdx) => {
        if (sDate.toDateString() === day.toDateString()) {
          let startHour = 8;
          let endHour = 10;

          if (s.startTime && s.finishTime) {
            const startD = new Date(s.startTime);
            const finishD = new Date(s.finishTime);
            startHour = startD.getHours() + (startD.getMinutes() / 60);
            endHour = finishD.getHours() + (finishD.getMinutes() / 60);
          } else if (s.startHour !== undefined && s.endHour !== undefined) {
            startHour = s.startHour;
            endHour = s.endHour;
          }

           blocks.push({
             id: s.id,
             type: 'schedule',
             jobId: job.id,
             jobNumber: job.number,
             customerName: s.taskName ? `${job.customerName} (${s.taskName})` : job.customerName,
             title: job.title,
             technicianId: isLocalAdmin ? currentUser.id : s.technicianId,
             dayIdx,
             startHour,
             endHour,
             status: job.status,
             priority: job.priority,
             taskName: s.taskName || null,
           });
        }
      });
    });

    // 2. Legacy fallback for jobs without schedules
    const jobIdsWithSchedules = new Set(schedules.map(s => s.jobId));
    jobs.filter(j => j.scheduledDate && j.isRecurring !== true && !jobIdsWithSchedules.has(j.id) && j.status !== 'Completed' && j.status !== 'Invoiced')
      .forEach(job => {
        const jobDate = new Date(job.scheduledDate);
        days.forEach((day, dayIdx) => {
          if (jobDate.toDateString() === day.toDateString()) {
            const startHour = job.startHour !== undefined ? job.startHour : (7 + (Math.abs(hashStr(job.id)) % 6));

            if (job.technicians && job.technicians.length > 0) {
              job.technicians.forEach(t => {
                const duration = t.hours || 2;
                blocks.push({
                  id: `legacy-${job.id}-${t.id}`,
                  type: 'legacy',
                  jobId: job.id,
                  jobNumber: job.number,
                  customerName: job.customerName,
                  title: job.title,
                  technicianId: isLocalAdmin ? currentUser.id : t.id,
                  dayIdx,
                  startHour,
                  endHour: startHour + duration,
                  status: job.status,
                  priority: job.priority,
                });
              });
            } else if (job.technicianId) {
              const duration = job.estimatedHours || 2;
              blocks.push({
                id: `legacy-${job.id}`,
                type: 'legacy',
                jobId: job.id,
                jobNumber: job.number,
                customerName: job.customerName,
                title: job.title,
                technicianId: isLocalAdmin ? currentUser.id : job.technicianId,
                dayIdx,
                startHour,
                endHour: startHour + duration,
                status: job.status,
                priority: job.priority,
              });
            }
          }
        });
      });

    // 3. Virtual forecast blocks for active recurring job templates
    if (days.length > 0) {
      const firstDay = days[0];
      const lastDay = days[days.length - 1];
      const startDateStr = `${firstDay.getFullYear()}-${String(firstDay.getMonth() + 1).padStart(2, '0')}-${String(firstDay.getDate()).padStart(2, '0')}`;
      const endDateStr = `${lastDay.getFullYear()}-${String(lastDay.getMonth() + 1).padStart(2, '0')}-${String(lastDay.getDate()).padStart(2, '0')}`;
      const virtualOccurrences = getVirtualRecurringOccurrences(startDateStr, endDateStr);

      const technicians = getTechnicians();
      virtualOccurrences.forEach(occ => {
        const [y, m, d] = occ.scheduledDate.split('-').map(Number);
        const occDate = new Date(y, m - 1, d);
        days.forEach((day, dayIdx) => {
          if (occDate.toDateString() === day.toDateString()) {
            const techId = isLocalAdmin ? currentUser.id : (occ.technicianId || (technicians[0] ? technicians[0].id : ''));
            const duration = parseFloat(occ.estimatedHours) || 2;

            let startHour = 8;
            if (occ.preferredTime) {
              const parsed = parsePreferredTime(occ.preferredTime);
              if (parsed) {
                startHour = parsed.hours + (parsed.minutes / 60);
              }
            }
            const endHour = startHour + duration;

            // Detect collision with existing allocations for this technician and day
            const existingIntervals = blocks
              .filter(b => b.technicianId === techId && b.dayIdx === dayIdx)
              .map(b => ({ start: b.startHour, end: b.endHour }));

            const hasCollision = existingIntervals.some(inv => Math.max(startHour, inv.start) < Math.min(endHour, inv.end));

            blocks.push({
              id: occ.id,
              type: 'virtual',
              isVirtual: true,
              hasCollision,
              jobId: occ.parentJobId,
              parentJobId: occ.parentJobId,
              parentJobNumber: occ.parentJobNumber,
              jobNumber: occ.parentJobNumber,
              customerName: occ.customerName ? occ.customerName : 'Recurring Template',
              title: occ.title,
              technicianId: techId,
              dayIdx,
              startHour,
              endHour,
              status: hasCollision ? 'Collision' : 'Forecast',
              priority: occ.priority || 'Normal',
              dateStr: occ.scheduledDate
            });
          }
        });
      });
    }

    // Detect collisions among all blocks (real and virtual)
    for (let i = 0; i < blocks.length; i++) {
      for (let j = i + 1; j < blocks.length; j++) {
        const b1 = blocks[i];
        const b2 = blocks[j];
        if (b1.technicianId === b2.technicianId && b1.dayIdx === b2.dayIdx) {
          if (Math.max(b1.startHour, b2.startHour) < Math.min(b1.endHour, b2.endHour)) {
            b1.hasCollision = true;
            b2.hasCollision = true;
          }
        }
      }
    }

    return blocks;
  }

  function hashStr(str) {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      hash = ((hash << 5) - hash) + str.charCodeAt(i);
      hash |= 0;
    }
    return hash;
  }

  function bindSearchListEvents() {
    container.querySelectorAll('.btn-toggle-job-tasks').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const jobId = btn.dataset.jobId;
        if (expandedJobTasklistIds.has(jobId)) {
          expandedJobTasklistIds.delete(jobId);
        } else {
          expandedJobTasklistIds.clear();
          expandedJobTasklistIds.add(jobId);
        }
        renderSearchResultsList();
      });
    });
  }

  function renderSearchResultsList() {
    const listContainer = container.querySelector('#job-search-results-list');
    if (!listContainer) return;

    const allJobs = store.getAll('jobs');
    const query = jobSearchQuery.trim().toLowerCase();
    const matchingJobs = allJobs.filter(j => {
      if (j.status === 'Completed' || j.status === 'Invoiced' || j.isRecurring === true) return false;
      if (!query) return true; // Show all active when query is empty
      
      const matchesJob = j.number.toLowerCase().includes(query) ||
                         (j.customerName && j.customerName.toLowerCase().includes(query)) ||
                         (j.title && j.title.toLowerCase().includes(query));
      
      const matchesTask = j.tasks && j.tasks.some(t => 
        t.name.toLowerCase().includes(query) ||
        (t.subTasks && t.subTasks.some(st => st.name.toLowerCase().includes(query)))
      );
      
      return matchesJob || matchesTask;
    });

    if (matchingJobs.length === 0) {
      listContainer.innerHTML = `
        <div style="font-size:11px; color:var(--text-tertiary); text-align:center; padding:16px;">
          No matching active jobs found.
        </div>
      `;
      return;
    }

    listContainer.innerHTML = matchingJobs.map(j => {
      const isTasklistExpanded = expandedJobTasklistIds.has(j.id);
      return `
        <div class="unscheduled-job" draggable="true" 
          data-job-id="${j.id}" 
          data-job-number="${j.number}" 
          data-customer="${escapeHTML(j.customerName || '')}" 
          data-title="${escapeHTML(j.title || '')}" 
          data-hours="${j.estimatedHours || 2}" 
          style="width:100%; display:flex; flex-direction:column; gap:2px; padding:8px 10px; background:var(--card-bg); border:1px solid var(--border-color); border-radius:var(--border-radius); cursor:grab; pointer-events:auto; transition: all var(--transition-fast);"
        >
          <div style="display:flex; justify-content:space-between; align-items:flex-start; width:100%; gap:4px;">
            <div style="display:flex; flex-direction:column; text-align:left; pointer-events:none; min-width:0; flex:1;">
              <div style="font-weight:700; font-size:11.5px; color:var(--text-primary); display:flex; align-items:center; gap:5px; margin-bottom:1px;">
                <span style="color:var(--color-primary); flex-shrink:0;">${j.number}</span>
                <span style="color:var(--text-tertiary); font-weight:normal;">•</span>
                <span style="overflow:hidden; text-overflow:ellipsis; white-space:nowrap; font-weight:600;">${escapeHTML(j.customerName || '')}</span>
              </div>
              <div style="font-size:10px; color:var(--text-secondary); overflow:hidden; text-overflow:ellipsis; white-space:nowrap;" title="${escapeHTML(j.title || '')}">${escapeHTML(j.title || '')}</div>
            </div>
            ${j.tasks && j.tasks.length > 0 ? `
              <button class="btn btn-ghost btn-icon btn-sm btn-toggle-job-tasks" data-job-id="${j.id}" title="${isTasklistExpanded ? 'Hide Tasks' : 'Show Tasks'}" style="color:var(--text-secondary); width:18px; height:18px; border-radius:50%; display:flex; align-items:center; justify-content:center; padding:0; pointer-events:auto; border:none; background:none; cursor:pointer; flex-shrink:0;">
                <span class="material-icons-outlined" style="font-size:14px">${isTasklistExpanded ? 'expand_less' : 'expand_more'}</span>
              </button>
            ` : ''}
          </div>
          
          <!-- Tasks Section -->
          ${j.tasks && j.tasks.length > 0 && isTasklistExpanded ? `
            <div style="margin-top:6px; padding-top:6px; border-top:1px dashed var(--border-color); display:flex; flex-direction:column; gap:4px;">
              <div style="font-size:9px; font-weight:700; color:var(--text-tertiary); text-transform:uppercase; text-align:left; pointer-events:none; margin-bottom:2px;">Tasks (Drag tasks or sub-tasks to assign)</div>
              ${j.tasks.map(t => {
                const tHours = t.estimatedHours || 2;
                const hasSubtasks = t.subTasks && t.subTasks.length > 0;
                return `
                  <div style="display:flex; flex-direction:column; gap:3px;">
                    <div class="unscheduled-job-task" draggable="true" 
                      data-job-id="${j.id}" 
                      data-job-number="${j.number}" 
                      data-customer="${escapeHTML(j.customerName || '')}" 
                      data-title="${escapeHTML(t.name)}" 
                      data-hours="${tHours}" 
                      data-task-id="${t.id}" 
                      data-task-name="${escapeHTML(t.name)}" 
                      style="display:flex; align-items:center; justify-content:space-between; padding:4px 6px; background:var(--content-bg); border:1px solid var(--border-color); border-radius:4px; cursor:grab; font-size:10px; font-weight:500; color:var(--text-primary); transition: background var(--transition-fast);"
                    >
                      <div style="display:flex; align-items:center; pointer-events:none; flex:1; min-width:0;">
                        <span class="material-icons-outlined" style="font-size:12px; color:var(--color-primary); margin-right:4px; flex-shrink:0;">assignment</span>
                        <span style="text-align:left; overflow:hidden; text-overflow:ellipsis; white-space:nowrap;">${escapeHTML(t.name)}</span>
                      </div>
                      <span style="font-size:9px; color:var(--text-tertiary); margin-left:6px; font-weight:600; flex-shrink:0; pointer-events:none;">${tHours}h</span>
                    </div>
                    ${hasSubtasks ? `
                      <div style="display:flex; flex-direction:column; gap:3px; margin-left:8px; border-left:1px dashed var(--border-color); padding-left:6px; margin-top:2px; margin-bottom:4px;">
                        ${t.subTasks.map(st => {
                          const stHours = st.estimatedHours || 1;
                          return `
                            <div class="unscheduled-job-subtask" draggable="true" 
                              data-job-id="${j.id}" 
                              data-job-number="${j.number}" 
                              data-customer="${escapeHTML(j.customerName || '')}" 
                              data-title="${escapeHTML(t.name)} - ${escapeHTML(st.name)}" 
                              data-hours="${stHours}" 
                              data-task-id="${t.id}" 
                              data-task-name="${escapeHTML(t.name)} - ${escapeHTML(st.name)}" 
                              data-subtask-id="${st.id}" 
                              data-subtask-name="${escapeHTML(st.name)}" 
                              style="display:flex; align-items:center; justify-content:space-between; padding:3px 6px; background:rgba(0,0,0,0.015); border:1px solid rgba(0,0,0,0.04); border-radius:3px; cursor:grab; font-size:9px; font-weight:400; color:var(--text-secondary); transition: background var(--transition-fast);"
                            >
                              <div style="display:flex; align-items:center; pointer-events:none; flex:1; min-width:0;">
                                <span class="material-icons-outlined" style="font-size:10px; color:var(--text-tertiary); margin-right:3px; flex-shrink:0;">subdirectory_arrow_right</span>
                                <span style="text-align:left; overflow:hidden; text-overflow:ellipsis; white-space:nowrap;">${escapeHTML(st.name)}</span>
                              </div>
                              <span style="font-size:8px; color:var(--text-tertiary); margin-left:4px; font-weight:500; flex-shrink:0; pointer-events:none;">${stHours}h</span>
                            </div>
                          `;
                        }).join('')}
                      </div>
                    ` : ''}
                  </div>
                `;
              }).join('')}
            </div>
          ` : ''}
        </div>
      `;
    }).join('');

    bindSearchListEvents();

    const days = getWeekDays();
    bindDragAndDrop(days);
  }

  function render() {
    try {
      saveScroll();
      technicians = getTechnicians();

      // Clean up visibleTechIds to only include active/real technicians
      const activeTechIds = new Set(technicians.map(t => t.id));
      for (const id of visibleTechIds) {
        if (!activeTechIds.has(id)) {
          visibleTechIds.delete(id);
        }
      }
      if (visibleTechIds.size === 0 && technicians.length > 0) {
        technicians.forEach(t => visibleTechIds.add(t.id));
      }

      const days = getWeekDays();
      const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
      const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

    if (calendarType === 'activity') {
      renderActivityCalendar();
      return;
    }

    const blocks = getScheduleBlocks();
    const visibleTechs = technicians.filter(t => visibleTechIds.has(t.id));

    // SUCCESSFUL RENDER LOG HOOK
    const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
    const menuBg = isDark ? '#1e293b' : '#ffffff';

    container.innerHTML = `
      <div class="page-header">
        <h1>Schedule</h1>
        <div class="page-header-actions">
          <div class="flex gap-sm items-center">
            <button class="btn btn-secondary btn-sm" id="btn-prev"><span class="material-icons-outlined" style="pointer-events: none;">chevron_left</span></button>
            <button class="btn btn-secondary btn-sm" id="btn-today">Today</button>
            <button class="btn btn-secondary btn-sm" id="btn-next"><span class="material-icons-outlined" style="pointer-events: none;">chevron_right</span></button>
            <span style="font-weight:600;font-size:var(--font-size-md);margin:0 8px">
              ${monthNames[currentDate.getMonth()]} ${currentDate.getFullYear()}
            </span>
          </div>
          <div class="flex gap-sm items-center" style="margin-left:auto;margin-right:16px">
            ${!isTechnician ? '' : `<span style="font-size:var(--font-size-sm);color:var(--text-secondary);font-weight:500"><span class="material-icons-outlined" style="font-size:16px;vertical-align:middle;margin-right:4px">person</span>${currentUser.name}</span>`}
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

      <!-- Schedule Page Toolbar -->
      <div class="page-toolbar" style="margin-bottom: 16px;">
        <div class="toolbar-selectors flex gap-sm items-center">
          <!-- Quick Add Button with Dropdown -->
          <div style="position:relative;">
            <button class="btn btn-primary btn-sm btn-icon" id="btn-action-menu-trigger" title="Add to Schedule" style="width:32px; height:32px; padding:0; display:flex; align-items:center; justify-content:center;">
              <span class="material-icons-outlined" style="font-size:18px">add</span>
            </button>
            ${isActionMenuOpen ? `
              <!-- Action Dropdown Menu -->
              <div id="action-dropdown-menu" class="sidebar-collapsed-flyout" style="position:absolute; top:36px; left:0; width:220px; z-index:var(--z-dropdown); display:flex; flex-direction:column; overflow:hidden;">
                <button class="sidebar-nav-item sub-item action-menu-opt" data-action="job" style="margin:2px 0; width:100%; border:none; background:none; cursor:pointer; display:flex !important; align-items:center !important;">
                  <span class="nav-icon"><span class="material-icons-outlined" style="color:var(--color-primary); font-size:18px">assignment</span></span>
                  <span class="nav-label" style="opacity: 1 !important; display: block !important; width: auto !important;">Add Job Schedule</span>
                </button>
                <button class="sidebar-nav-item sub-item action-menu-opt" data-action="leave" style="margin:2px 0; width:100%; border:none; background:none; cursor:pointer; display:flex !important; align-items:center !important;">
                  <span class="nav-icon"><span class="material-icons-outlined" style="color:#EF4444; font-size:18px">flight_takeoff</span></span>
                  <span class="nav-label" style="opacity: 1 !important; display: block !important; width: auto !important;">Add Leave / Time Off</span>
                </button>
                <button class="sidebar-nav-item sub-item action-menu-opt" data-action="blockout" style="margin:2px 0; width:100%; border:none; background:none; cursor:pointer; display:flex !important; align-items:center !important;">
                  <span class="nav-icon"><span class="material-icons-outlined" style="color:#6B7280; font-size:18px">block</span></span>
                  <span class="nav-label" style="opacity: 1 !important; display: block !important; width: auto !important;">Add Calendar Blockout</span>
                </button>
                <button class="sidebar-nav-item sub-item action-menu-opt" data-action="meeting" style="margin:2px 0; width:100%; border:none; background:none; cursor:pointer; display:flex !important; align-items:center !important;">
                  <span class="nav-icon"><span class="material-icons-outlined" style="color:#3B82F6; font-size:18px">groups</span></span>
                  <span class="nav-label" style="opacity: 1 !important; display: block !important; width: auto !important;">Add Team Meeting</span>
                </button>
              </div>
            ` : ''}
          </div>

          <!-- Team / Technician Filter Button & Dropdown -->
          ${(!isTechnician || isLocalAdminTechView) && !isLocalAdmin ? `
            <div style="position:relative;">
              <button class="btn btn-secondary btn-sm btn-icon" id="btn-tech-filter-trigger" title="Visible Team (${visibleTechIds.size})" style="position:relative; width:32px; height:32px; padding:0; display:flex; align-items:center; justify-content:center;">
                <span class="material-icons-outlined" style="font-size:18px">people</span>
                <span style="position:absolute; top:-6px; right:-6px; background:var(--color-primary); color:white; font-size:9px; border-radius:50%; width:16px; height:16px; display:flex; align-items:center; justify-content:center; font-weight:bold; border:1.5px solid var(--content-bg); font-family:var(--font-family); line-height:1; box-sizing:border-box;">${visibleTechIds.size}</span>
              </button>
              ${isTechsPanelOpen ? `
                <div id="tech-filter-dropdown" class="sidebar-collapsed-flyout" style="position:absolute; top:36px; left:0; width:240px; z-index:var(--z-dropdown); display:flex; flex-direction:column; padding:12px; gap:8px;">
                  <div style="font-size:11px; font-weight:700; color:var(--text-tertiary); text-transform:uppercase; margin-bottom:4px;">Toggle Visibility</div>
                  ${technicians.map(t => `
                    <label style="display:flex; align-items:center; gap:8px; font-size:var(--font-size-sm); cursor:pointer; padding:4px 0;">
                      <input type="checkbox" class="tech-visibility-checkbox" value="${t.id}" ${visibleTechIds.has(t.id) ? 'checked' : ''}>
                      <div style="width:10px; height:10px; border-radius:50%; background:${t.color};"></div>
                      <span style="color:var(--text-primary); font-weight:500;">${t.name}</span>
                    </label>
                  `).join('')}
                </div>
              ` : ''}
            </div>
          ` : ''}
        </div>

        <div style="position:relative;">
          <div class="toolbar-search">
            <span class="material-icons-outlined">search</span>
            <input type="text" id="job-search-input" value="${jobSearchQuery}" placeholder="Search jobs/tasks...">
          </div>
          <div id="job-search-section-wrapper" class="sidebar-collapsed-flyout" style="position:absolute; top:36px; right:0; width:350px; max-height:400px; z-index:var(--z-dropdown); overflow-y:auto; padding:12px; display:${isSearchActive ? 'flex' : 'none'}; flex-direction:column; gap:8px;">
            <div style="font-size:11px; font-weight:700; color:var(--text-tertiary); text-transform:uppercase; margin-bottom:4px;">Jobs & Tasks (Drag to assign)</div>
            <div id="job-search-results-list" style="display:flex; flex-direction:column; gap:8px;"></div>
          </div>
        </div>
      </div>

      <!-- Calendar Grid (Full Width) -->
      <div class="card" style="flex:1;min-height:0;display:flex;flex-direction:column;overflow:hidden">
        <div style="display:flex;flex:1;min-height:0;overflow:hidden">
          
          <!-- Calendar -->
          <div style="flex:1;overflow:auto" id="calendar-scroll">
            ${visibleTechIds.size !== 1 ? `
              <!-- Top headers: Technicians -->
              <div style="display:grid;grid-template-columns:56px repeat(${visibleTechs.length}, minmax(120px, 1fr));border-bottom:1px solid var(--border-color);position:sticky;top:0;background:var(--card-bg);z-index:10;width:fit-content;min-width:100%">
                <!-- Sticky Top-Left corner for Time/Date header -->
                <div style="height:34px;border-right:1px solid var(--border-color);background:var(--card-bg);position:sticky;left:0;z-index:11;display:flex;align-items:center;justify-content:center;font-size:var(--font-size-xs);color:var(--text-tertiary);font-weight:600;text-transform:uppercase">
                  Time
                </div>
                ${visibleTechs.map(tech => `
                  <div style="height:34px;display:flex;flex-direction:column;align-items:center;justify-content:center;border-right:1px solid var(--border-color);background:var(--card-bg);">
                    <div style="font-size:11px;font-weight:600;display:flex;align-items:center;gap:4px">
                      <div style="width:6px;height:6px;border-radius:50%;background:${tech.color};flex-shrink:0"></div>
                      <span style="white-space:nowrap;overflow:hidden;text-overflow:ellipsis;max-width:100px">${tech.name}</span>
                    </div>
                  </div>
                `).join('')}
              </div>

              <!-- Rows: Days -->
              ${days.map((day, dayIdx) => {
      const isToday = day.toDateString() === new Date().toDateString();
      return `
                  <!-- Day Header Row -->
                  <div style="display:flex;background:var(--content-bg);border-bottom:1px solid var(--border-color);position:sticky;left:0;z-index:2;width:fit-content;min-width:100%">
                     <div style="padding:6px 12px;font-size:var(--font-size-sm);font-weight:600;${isToday ? 'color:var(--color-primary)' : 'color:var(--text-secondary)'};position:sticky;left:0;background:var(--content-bg);">
                       ${dayNames[day.getDay()]}, ${day.getDate()} ${monthNames[day.getMonth()]}
                     </div>
                  </div>

                  <!-- Day Grid -->
                  <div style="display:grid;grid-template-columns:56px repeat(${visibleTechs.length}, minmax(120px, 1fr));border-bottom:2px solid var(--border-color);width:fit-content;min-width:100%">

                    <!-- Hours Column (Sticky Left) -->
                    <div style="background:var(--card-bg);position:sticky;left:0;z-index:2;border-right:1px solid var(--border-color)">
                      ${hours.map(h => `
                        <div style="height:32px;border-bottom:1px solid var(--border-color);padding:2px 4px;font-size:10px;color:var(--text-tertiary);text-align:right;display:flex;align-items:flex-start;justify-content:flex-end">
                          ${h.toString().padStart(2, '0')}:00
                        </div>
                      `).join('')}
                    </div>

                    <!-- Technician Columns for this Day -->
                    ${visibleTechs.map(tech => {
        const techBlocks = blocks.filter(b => b.technicianId === tech.id);
        return `
                        <div class="schedule-day-col" style="position:relative;border-right:1px solid var(--border-color)" data-tech="${tech.id}" data-day="${dayIdx}" data-date="${days[dayIdx].getFullYear()}-${(days[dayIdx].getMonth() + 1).toString().padStart(2, '0')}-${days[dayIdx].getDate().toString().padStart(2, '0')}">
                          ${hours.map(h => `<div class="schedule-hour-slot" style="height:32px;border-bottom:1px solid var(--border-color)" data-hour="${h}"></div>`).join('')}
                          ${renderBlocks(techBlocks, dayIdx, tech.color)}
                        </div>
                      `;
      }).join('')}
                  </div>
                `;
    }).join('')}
            ` : `
              <!-- Top headers: Days -->
              <div style="display:grid;grid-template-columns:56px repeat(${days.length}, minmax(120px, 1fr));border-bottom:1px solid var(--border-color);position:sticky;top:0;background:var(--card-bg);z-index:10;width:fit-content;min-width:100%">
                <!-- Sticky Top-Left corner for Time/Date header -->
                <div style="height:34px;border-right:1px solid var(--border-color);background:var(--card-bg);position:sticky;left:0;z-index:11;display:flex;align-items:center;justify-content:center;font-size:var(--font-size-xs);color:var(--text-tertiary);font-weight:600;text-transform:uppercase">
                  Time
                </div>
                ${days.map(day => {
      const isToday = day.toDateString() === new Date().toDateString();
      return `
                    <div style="height:34px;display:flex;flex-direction:column;align-items:center;justify-content:center;border-right:1px solid var(--border-color);background:var(--card-bg);">
                      <div style="font-size:11px;font-weight:600;${isToday ? 'color:var(--color-primary)' : 'color:var(--text-secondary)'};display:flex;align-items:center;gap:6px">
                        <span>${dayNames[day.getDay()]} ${day.getDate()} ${monthNames[day.getMonth()]}</span>
                      </div>
                    </div>
                  `;
    }).join('')}
              </div>

              <!-- Day Grid -->
              <div style="display:grid;grid-template-columns:56px repeat(${days.length}, minmax(120px, 1fr));width:fit-content;min-width:100%">
                <!-- Hours Column (Sticky Left) -->
                <div style="background:var(--card-bg);position:sticky;left:0;z-index:2;border-right:1px solid var(--border-color)">
                  ${hours.map(h => `
                    <div style="height:32px;border-bottom:1px solid var(--border-color);padding:2px 4px;font-size:10px;color:var(--text-tertiary);text-align:right;display:flex;align-items:flex-start;justify-content:flex-end">
                      ${h.toString().padStart(2, '0')}:00
                    </div>
                  `).join('')}
                </div>

                <!-- Day Columns for the selected Technician -->
                ${days.map((day, dayIdx) => {
      const tech = technicians.find(t => t.id === [...visibleTechIds][0]);
      const techBlocks = blocks.filter(b => b.technicianId === tech.id);
      return `
                    <div class="schedule-day-col" style="position:relative;border-right:1px solid var(--border-color)" data-tech="${tech.id}" data-day="${dayIdx}" data-date="${days[dayIdx].getFullYear()}-${(days[dayIdx].getMonth() + 1).toString().padStart(2, '0')}-${days[dayIdx].getDate().toString().padStart(2, '0')}">
                      ${hours.map(h => `<div class="schedule-hour-slot" style="height:32px;border-bottom:1px solid var(--border-color)" data-hour="${h}"></div>`).join('')}
                      ${renderBlocks(techBlocks, dayIdx, tech.color)}
                    </div>
                  `;
    }).join('')}
              </div>
            `}
          </div>
        </div>
      </div>
    `;

    bindEvents();
    bindDragAndDrop(days);
    bindResize();
    bindMarquee(days);
    applySelectionStyles();
    updateSelectionBar();
    restoreScroll();
    renderSearchResultsList();
    } catch (err) {
      console.error("RENDER ERROR:", err);
    }
  }

  // ── Marquee multi-select ────────────────────────────────────────────────────
  function applySelectionStyles() {
    // Drop ids that no longer exist on the calendar (e.g. after a delete)
    const live = new Set([...container.querySelectorAll('.schedule-block[data-schedule-id]')].map(b => b.dataset.scheduleId));
    [...selectedScheduleIds].forEach(id => { if (!live.has(id)) selectedScheduleIds.delete(id); });
    container.querySelectorAll('.schedule-block').forEach(b => {
      b.classList.toggle('sched-selected', selectedScheduleIds.has(b.dataset.scheduleId));
    });
  }

  function clearSelection() {
    selectedScheduleIds.clear();
    applySelectionStyles();
    updateSelectionBar();
  }

  // Selection has no floating bar — the right-click bulk menu is the action surface.
  // Kept as a cleanup no-op so any stray bar (from an older render) is removed.
  function updateSelectionBar() {
    document.getElementById('sched-selection-bar')?.remove();
  }

  function selectedSchedules() {
    return [...selectedScheduleIds].map(id => store.getById('schedule', id)).filter(Boolean);
  }

  function bulkUnschedule() {
    const scheds = selectedSchedules();
    if (!scheds.length) return;
    if (!window.confirm(`Unschedule ${scheds.length} allocation${scheds.length > 1 ? 's' : ''}?`)) return;
    const jobIds = new Set();
    scheds.forEach(s => { jobIds.add(s.jobId); store.delete('schedule', s.id); });
    jobIds.forEach(jid => syncJobWithSchedules(jid));
    showToast(`Unscheduled ${scheds.length} allocation${scheds.length > 1 ? 's' : ''}`, 'success');
    clearSelection();
    render();
  }

  function bulkBookTime() {
    const scheds = selectedSchedules();
    if (!scheds.length) return;

    const allAllocationPlans = [];
    let overallHours = 0;

    scheds.forEach(s => {
      const job = store.getById('jobs', s.jobId);
      if (!job) return;
      const plan = computeBtipSlices(s, job);
      if (!plan) return;
      allAllocationPlans.push({
        sched: s,
        job,
        slices: plan.slices,
        totalHours: plan.totalHours,
        date: s.date,
        techName: s.technicianName || 'Unassigned'
      });
      overallHours += plan.totalHours;
    });

    if (!allAllocationPlans.length) {
      showToast('No valid allocations selected for booking', 'error');
      return;
    }

    const content = document.createElement('div');
    content.innerHTML = `
      <p style="font-size:13px;color:var(--text-secondary);margin-bottom:12px;">
        Booking <strong>${overallHours.toFixed(2)} hrs</strong> across <strong>${allAllocationPlans.length} allocation${allAllocationPlans.length > 1 ? 's' : ''}</strong>:
      </p>
      <div style="max-height:280px;overflow-y:auto;border:1px solid var(--border-color);border-radius:4px;margin-bottom:10px;">
        <table class="data-table" style="font-size:13px;width:100%;">
          <thead>
            <tr>
              <th>Date / Tech</th>
              <th>Job</th>
              <th>Task / Window</th>
              <th style="text-align:right;">Booked</th>
            </tr>
          </thead>
          <tbody>
            ${allAllocationPlans.map(planItem => {
              return planItem.slices.map(s => `
                <tr>
                  <td>
                    <div style="font-weight:500;">${planItem.date}</div>
                    <div style="font-size:11px;color:var(--text-tertiary);">${escapeHTML(planItem.techName)}</div>
                  </td>
                  <td>
                    <div style="font-weight:500;">${escapeHTML(planItem.job.number || '')}</div>
                    <div style="font-size:11px;color:var(--text-tertiary);">${escapeHTML(planItem.job.title || '')}</div>
                  </td>
                  <td>
                    <div>${escapeHTML(s.node ? s.node.name : 'General (whole job)')}</div>
                    <div style="font-size:11px;color:var(--text-tertiary);">${s.start.slice(11, 16)}–${s.finish.slice(11, 16)}</div>
                  </td>
                  <td style="text-align:right;font-weight:600;">${s.hours.toFixed(2)} hrs</td>
                </tr>
              `).join('');
            }).join('')}
          </tbody>
        </table>
      </div>
      <p style="font-size:11.5px;color:var(--text-tertiary);margin-top:8px;">
        Entries will be created as Pending timesheets — adjust or delete them from the job's tasklist or Timesheets.
      </p>`;

    showModal({
      title: `Book Time in Place (${allAllocationPlans.length} Allocations)`,
      content,
      actions: [
        { label: 'Cancel', className: 'btn-secondary', onClick: c => c() },
        {
          label: `Book ${overallHours.toFixed(2)} hrs`,
          className: 'btn-primary',
          onClick: c => {
            let totalEntries = 0;
            allAllocationPlans.forEach(planItem => {
              createBtipTimesheets(planItem.sched, planItem.job, planItem.slices);
              totalEntries += planItem.slices.length;
            });
            showToast(`Booked ${overallHours.toFixed(2)} hrs across ${totalEntries} timesheet ${totalEntries === 1 ? 'entry' : 'entries'}`, 'success');
            c();
            clearSelection();
            render();
          }
        },
      ],
      width: 580
    });
  }

  function bindMarquee(days) {
    const scroll = document.getElementById('calendar-scroll');
    if (!scroll || scroll.dataset.marqueeBound) return;
    scroll.dataset.marqueeBound = '1';

    scroll.addEventListener('mousedown', (e) => {
      if (e.button !== 0) return;
      // Only start on empty grid space — never on a block, resize handle, or its own bar
      if (e.target.closest('.schedule-block') || e.target.closest('.schedule-resize-handle')) return;
      if (!e.target.closest('.schedule-day-col')) return;

      const startX = e.clientX, startY = e.clientY;
      const additive = e.shiftKey || e.metaKey || e.ctrlKey;
      const baseSelection = additive ? new Set(selectedScheduleIds) : new Set();
      let box = null, moved = false;

      const onMove = (mv) => {
        const dx = Math.abs(mv.clientX - startX), dy = Math.abs(mv.clientY - startY);
        if (!moved && dx < 4 && dy < 4) return;
        moved = true;
        if (!box) {
          box = document.createElement('div');
          box.className = 'sched-marquee';
          box.style.cssText = 'position:fixed;z-index:400;border:1.5px dashed rgba(100,116,139,0.85);background:rgba(148,163,184,0.14);pointer-events:none;border-radius:3px;';
          document.body.appendChild(box);
          document.body.style.userSelect = 'none';
        }
        const x = Math.min(startX, mv.clientX), y = Math.min(startY, mv.clientY);
        const w = Math.abs(mv.clientX - startX), h = Math.abs(mv.clientY - startY);
        Object.assign(box.style, { left: x + 'px', top: y + 'px', width: w + 'px', height: h + 'px' });

        const mRect = { left: x, top: y, right: x + w, bottom: y + h };
        const next = new Set(baseSelection);
        container.querySelectorAll('.schedule-block[data-block-type="schedule"]').forEach(bl => {
          const r = bl.getBoundingClientRect();
          const hit = r.left < mRect.right && r.right > mRect.left && r.top < mRect.bottom && r.bottom > mRect.top;
          if (hit) next.add(bl.dataset.scheduleId);
        });
        selectedScheduleIds = next;
        applySelectionStyles();
      };

      const onUp = () => {
        document.removeEventListener('mousemove', onMove);
        document.removeEventListener('mouseup', onUp);
        document.body.style.userSelect = '';
        if (box) box.remove();
        if (!moved && !additive) clearSelection(); // plain click on empty space clears
        updateSelectionBar();
      };
      document.addEventListener('mousemove', onMove);
      document.addEventListener('mouseup', onUp);
    });

    // Esc clears selection; leaving the schedule page tears down the floating bar
    if (!scroll.dataset.escBound) {
      scroll.dataset.escBound = '1';
      document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && selectedScheduleIds.size && location.hash.startsWith('#/schedule')) clearSelection();
      });
      window.addEventListener('hashchange', () => {
        if (!location.hash.startsWith('#/schedule')) {
          selectedScheduleIds.clear();
          document.getElementById('sched-selection-bar')?.remove();
          document.querySelector('.sched-marquee')?.remove();
        }
      });
    }
  }

  function getUnscheduledJobs() {
    const jobs = store.getAll('jobs') || [];
    return jobs.filter(j => j.status !== 'Completed' && j.status !== 'Invoiced' && j.isRecurring !== true);
  }

  function handleAddJobSchedule() {
    const activeJobs = getUnscheduledJobs();
    const technicians = getTechnicians();

    if (activeJobs.length === 0) {
      showToast('No active jobs available.', 'info');
      return;
    }

    showDrawer({
      title: 'Schedule Job',
      content: `
        <form id="drawer-add-job-form" style="display:flex; flex-direction:column; gap:16px;">
          <div class="form-group">
            <label class="form-label">Select Job <span style="color:var(--color-danger)">*</span></label>
            <select class="form-select" name="jobId" required>
              ${activeJobs.map(j => `<option value="${j.id}">${j.number} — ${escapeHTML(j.customerName)} (${escapeHTML(j.title)})</option>`).join('')}
            </select>
          </div>
          <div class="form-group">
            <label class="form-label">Task (Optional)</label>
            <select class="form-select" name="taskId">
              <!-- Populated dynamically -->
            </select>
          </div>
          <div class="form-group">
            <label class="form-label">Technician <span style="color:var(--color-danger)">*</span></label>
            <select class="form-select" name="technicianId" required>
              ${technicians.map(t => `<option value="${t.id}">${escapeHTML(t.name)}</option>`).join('')}
            </select>
          </div>
          <div class="form-group">
            <label class="form-label">Date <span style="color:var(--color-danger)">*</span></label>
            <input type="date" class="form-input" name="date" value="${new Date().toISOString().split('T')[0]}" required />
          </div>
          <div style="display:grid; grid-template-columns:1fr 1fr; gap:12px">
            <div class="form-group">
              <label class="form-label">Start Time <span style="color:var(--color-danger)">*</span></label>
              <input type="time" class="form-input" name="startTime" value="08:00" required />
            </div>
            <div class="form-group">
              <label class="form-label">Duration (Hours) <span style="color:var(--color-danger)">*</span></label>
              <input type="number" class="form-input" name="duration" min="0.5" step="0.5" value="2" required />
            </div>
          </div>
        </form>
      `,
      actions: [
        { label: 'Cancel', className: 'btn-secondary', onClick: c => c() },
        {
          label: 'Schedule Job',
          className: 'btn-primary',
          onClick: c => {
            const form = document.getElementById('drawer-add-job-form');
            if (!form.checkValidity()) return form.reportValidity();

            const fd = new FormData(form);
            const jobId = fd.get('jobId');
            const techId = fd.get('technicianId');
            const dateStr = fd.get('date');
            const timeStr = fd.get('startTime');
            const duration = parseFloat(fd.get('duration'));
            const taskPath = fd.get('taskId');

            const job = store.getById('jobs', jobId);
            if (!job) {
              showToast('Selected job not found or has been deleted.', 'error');
              return;
            }
            const tech = store.getById('technicians', techId);

            function getFlatTasks(tasks, currentPath = [], currentNamePath = []) {
              let result = [];
              if (!tasks) return result;
              tasks.forEach((p, i) => {
                const path = [...currentPath, i].join('-');
                const namePath = [...currentNamePath, p.name].join(' > ');
                result.push({ path, name: namePath });
                if (p.subTasks) {
                  result = result.concat(getFlatTasks(p.subTasks, [...currentPath, i], [...currentNamePath, p.name]));
                }
              });
              return result;
            }

            const flatTasks = getFlatTasks(job.tasks || []);
            const selectedTask = flatTasks.find(t => t.path === taskPath);
            const taskName = selectedTask ? selectedTask.name.split(' > ').pop() : 'Whole Job';

            const startHour = parseFloat(timeStr.split(':')[0]) + (parseFloat(timeStr.split(':')[1]) / 60);
            const endHour = startHour + duration;

            const startTimeISO = `${dateStr}T${timeStr}`;
            const endHourH = Math.floor(endHour);
            const endHourM = Math.round((endHour - endHourH) * 60);
            const finishTimeISO = `${dateStr}T${endHourH.toString().padStart(2, '0')}:${endHourM.toString().padStart(2, '0')}`;

            store.create('schedule', {
              jobId: job.id,
              jobNumber: job.number,
              technicianId: techId,
              technicianName: tech?.name || '',
              date: dateStr,
              startTime: startTimeISO,
              finishTime: finishTimeISO,
              hours: duration,
              taskId: taskPath || null,
              taskName: taskName || null
            });

            store.update('jobs', job.id, {
              scheduledDate: dateStr,
              startHour: startHour,
              technicianId: techId
            });
            syncJobWithSchedules(job.id);

            showToast(`Scheduled Job ${job.number} to ${tech?.name}`, 'success');
            c();
            render();
          }
        }
      ]
    });

    const form = document.getElementById('drawer-add-job-form');
    if (form) {
      const jobSelect = form.querySelector('select[name="jobId"]');
      const taskSelect = form.querySelector('select[name="taskId"]');

      function updateTasksForJob(jobId) {
        const job = store.getById('jobs', jobId);
        if (!job) return;

        if (!job.tasks || job.tasks.length === 0) {
          job.tasks = [{ id: store.generateId(), name: 'Main Task', status: 'Not Started', progress: 0, startDate: new Date().toISOString(), technicians: [], subTasks: [] }];
          store.update('jobs', jobId, { tasks: job.tasks });
        }

        if (job.preferredTime) {
          const parsed = parsePreferredTime(job.preferredTime);
          if (parsed) {
            const timeInput = form.querySelector('input[name="startTime"]');
            if (timeInput) {
              timeInput.value = `${parsed.hours.toString().padStart(2, '0')}:${parsed.minutes.toString().padStart(2, '0')}`;
            }
          }
        } else {
          const timeInput = form.querySelector('input[name="startTime"]');
          if (timeInput) {
            timeInput.value = "08:00";
          }
        }

        function getFlatTasks(tasks, currentPath = [], currentNamePath = []) {
          let result = [];
          if (!tasks) return result;
          tasks.forEach((p, i) => {
            const path = [...currentPath, i].join('-');
            const namePath = [...currentNamePath, p.name].join(' > ');
            result.push({ path, name: namePath });
            if (p.subTasks) {
              result = result.concat(getFlatTasks(p.subTasks, [...currentPath, i], [...currentNamePath, p.name]));
            }
          });
          return result;
        }

        const flatTasks = getFlatTasks(job.tasks);
        taskSelect.innerHTML = `<option value="">-- Whole Job / General --</option>` + flatTasks.map(t => `<option value="${t.path}">${escapeHTML(t.name)}</option>`).join('');
      }

      if (jobSelect && taskSelect) {
        jobSelect.addEventListener('change', (e) => {
          updateTasksForJob(e.target.value);
        });
        updateTasksForJob(jobSelect.value);
      }
    }
  }

  function handleAddLeave() {
    const technicians = getTechnicians();
    const todayStr = new Date().toISOString().split('T')[0];

    showDrawer({
      title: 'Book Technician Leave',
      content: `
        <form id="drawer-add-leave-form" style="display:flex; flex-direction:column; gap:16px;">
          <div class="form-group">
            <label class="form-label">Technician <span style="color:var(--color-danger)">*</span></label>
            <select class="form-select" name="technicianId" required>
              ${technicians.map(t => `<option value="${t.id}">${escapeHTML(t.name)}</option>`).join('')}
            </select>
          </div>
          <div style="display:grid; grid-template-columns:1fr 1fr; gap:12px">
            <div class="form-group">
              <label class="form-label">Start Date <span style="color:var(--color-danger)">*</span></label>
              <input type="date" class="form-input" name="startDate" value="${todayStr}" required />
            </div>
            <div class="form-group">
              <label class="form-label">End Date <span style="color:var(--color-danger)">*</span></label>
              <input type="date" class="form-input" name="endDate" value="${todayStr}" required />
            </div>
          </div>
          <div style="display:grid; grid-template-columns:1fr 1fr; gap:12px">
            <div class="form-group">
              <label class="form-label">Start Time <span style="color:var(--color-danger)">*</span></label>
              <input type="time" class="form-input" name="startTime" value="08:00" required />
            </div>
            <div class="form-group">
              <label class="form-label">Hours / Day <span style="color:var(--color-danger)">*</span></label>
              <input type="number" class="form-input" name="duration" min="0.5" step="0.5" value="8" required />
            </div>
          </div>
          <div class="form-group">
            <label class="form-label">Leave Type / Notes <span style="color:var(--color-danger)">*</span></label>
            <select class="form-select" name="notes" required>
              <option value="Annual Leave">Annual Leave</option>
              <option value="Personal/Carer's Leave">Personal/Carer's Leave</option>
              <option value="Parental Leave">Parental Leave</option>
              <option value="Family and Domestic Violence Leave">Family and Domestic Violence Leave</option>
              <option value="Compassionate Leave">Compassionate Leave</option>
              <option value="Community Service Leave">Community Service Leave</option>
              <option value="Long Service Leave">Long Service Leave</option>
              <option value="Unpaid Leave">Unpaid Leave</option>
              <option value="Public Holiday">Public Holiday</option>
            </select>
          </div>
        </form>
      `,
      actions: [
        { label: 'Cancel', className: 'btn-secondary', onClick: c => c() },
        {
          label: 'Book Leave',
          className: 'btn-primary',
          onClick: c => {
            const form = document.getElementById('drawer-add-leave-form');
            if (!form.checkValidity()) return form.reportValidity();

            const fd = new FormData(form);
            const techId = fd.get('technicianId');
            const startDateStr = fd.get('startDate');
            const endDateStr = fd.get('endDate');
            const timeStr = fd.get('startTime');
            const duration = parseFloat(fd.get('duration'));
            const notes = fd.get('notes');

            const startD = new Date(startDateStr + 'T12:00:00');
            const endD = new Date(endDateStr + 'T12:00:00');

            if (endD < startD) {
              showToast('End date cannot be earlier than start date.', 'error');
              return;
            }

            const tech = store.getById('technicians', techId);
            const startHour = parseFloat(timeStr.split(':')[0]) + (parseFloat(timeStr.split(':')[1]) / 60);
            const endHour = startHour + duration;
            const endHourH = Math.floor(endHour);
            const endHourM = Math.round((endHour - endHourH) * 60);

            let createdCount = 0;
            const cur = new Date(startD);

            while (cur <= endD) {
              const pad = n => n.toString().padStart(2, '0');
              const dStr = `${cur.getFullYear()}-${pad(cur.getMonth() + 1)}-${pad(cur.getDate())}`;
              const startTimeISO = `${dStr}T${timeStr}`;
              const finishTimeISO = `${dStr}T${pad(endHourH)}:${pad(endHourM)}`;

              store.create('schedule', {
                type: 'leave',
                technicianId: techId,
                technicianName: tech?.name || '',
                date: dStr,
                startTime: startTimeISO,
                finishTime: finishTimeISO,
                hours: duration,
                startHour: startHour,
                endHour: endHour,
                notes: notes
              });

              createdCount++;
              cur.setDate(cur.getDate() + 1);
            }

            showToast(`Booked ${createdCount} day(s) of leave for ${tech?.name || 'technician'}`, 'success');
            c();
            render();
          }
        }
      ]
    });
  }

  function handleAddBlockout() {
    const technicians = getTechnicians();

    showDrawer({
      title: 'Book Calendar Blockout',
      content: `
        <form id="drawer-add-blockout-form" style="display:flex; flex-direction:column; gap:16px;">
          <div class="form-group">
            <label class="form-label">Technician <span style="color:var(--color-danger)">*</span></label>
            <select class="form-select" name="technicianId" required>
              ${technicians.map(t => `<option value="${t.id}">${escapeHTML(t.name)}</option>`).join('')}
            </select>
          </div>
          <div class="form-group">
            <label class="form-label">Date <span style="color:var(--color-danger)">*</span></label>
            <input type="date" class="form-input" name="date" value="${new Date().toISOString().split('T')[0]}" required />
          </div>
          <div style="display:grid; grid-template-columns:1fr 1fr; gap:12px">
            <div class="form-group">
              <label class="form-label">Start Time <span style="color:var(--color-danger)">*</span></label>
              <input type="time" class="form-input" name="startTime" value="12:00" required />
            </div>
            <div class="form-group">
              <label class="form-label">Duration (Hours) <span style="color:var(--color-danger)">*</span></label>
              <input type="number" class="form-input" name="duration" min="0.5" step="0.5" value="1" required />
            </div>
          </div>
          <div class="form-group">
            <label class="form-label">Blockout Reason / Notes <span style="color:var(--color-danger)">*</span></label>
            <input type="text" class="form-input" name="notes" placeholder="e.g. Vehicle Maintenance, Doctor, Training" required />
          </div>
        </form>
      `,
      actions: [
        { label: 'Cancel', className: 'btn-secondary', onClick: c => c() },
        {
          label: 'Create Blockout',
          className: 'btn-primary',
          onClick: c => {
            const form = document.getElementById('drawer-add-blockout-form');
            if (!form.checkValidity()) return form.reportValidity();

            const fd = new FormData(form);
            const techId = fd.get('technicianId');
            const dateStr = fd.get('date');
            const timeStr = fd.get('startTime');
            const duration = parseFloat(fd.get('duration'));
            const notes = fd.get('notes');

            const tech = store.getById('technicians', techId);
            const startHour = parseFloat(timeStr.split(':')[0]) + (parseFloat(timeStr.split(':')[1]) / 60);
            const endHour = startHour + duration;

            const startTimeISO = `${dateStr}T${timeStr}`;
            const endHourH = Math.floor(endHour);
            const endHourM = Math.round((endHour - endHourH) * 60);
            const finishTimeISO = `${dateStr}T${endHourH.toString().padStart(2, '0')}:${endHourM.toString().padStart(2, '0')}`;

            store.create('schedule', {
              type: 'blockout',
              technicianId: techId,
              technicianName: tech?.name || '',
              date: dateStr,
              startTime: startTimeISO,
              finishTime: finishTimeISO,
              hours: duration,
              notes: notes
            });

            showToast(`Blockout scheduled for ${tech?.name}`, 'success');
            c();
            render();
          }
        }
      ]
    });
  }

  function handleAddMeeting() {
    const technicians = getTechnicians();

    showDrawer({
      title: 'Book Team Meeting',
      content: `
        <form id="drawer-add-meeting-form" style="display:flex; flex-direction:column; gap:16px;">
          <div class="form-group">
            <label class="form-label">Technician <span style="color:var(--color-danger)">*</span></label>
            <select class="form-select" name="technicianId" required>
              ${technicians.map(t => `<option value="${t.id}">${escapeHTML(t.name)}</option>`).join('')}
            </select>
          </div>
          <div class="form-group">
            <label class="form-label">Date <span style="color:var(--color-danger)">*</span></label>
            <input type="date" class="form-input" name="date" value="${new Date().toISOString().split('T')[0]}" required />
          </div>
          <div style="display:grid; grid-template-columns:1fr 1fr; gap:12px">
            <div class="form-group">
              <label class="form-label">Start Time <span style="color:var(--color-danger)">*</span></label>
              <input type="time" class="form-input" name="startTime" value="09:00" required />
            </div>
            <div class="form-group">
              <label class="form-label">Duration (Hours) <span style="color:var(--color-danger)">*</span></label>
              <input type="number" class="form-input" name="duration" min="0.5" step="0.5" value="1" required />
            </div>
          </div>
          <div class="form-group">
            <label class="form-label">Meeting Subject <span style="color:var(--color-danger)">*</span></label>
            <input type="text" class="form-input" name="notes" placeholder="e.g. Weekly Toolbox Talk, Safety Sync" required />
          </div>
        </form>
      `,
      actions: [
        { label: 'Cancel', className: 'btn-secondary', onClick: c => c() },
        {
          label: 'Schedule Meeting',
          className: 'btn-primary',
          onClick: c => {
            const form = document.getElementById('drawer-add-meeting-form');
            if (!form.checkValidity()) return form.reportValidity();

            const fd = new FormData(form);
            const techId = fd.get('technicianId');
            const dateStr = fd.get('date');
            const timeStr = fd.get('startTime');
            const duration = parseFloat(fd.get('duration'));
            const notes = fd.get('notes');

            const tech = store.getById('technicians', techId);
            const startHour = parseFloat(timeStr.split(':')[0]) + (parseFloat(timeStr.split(':')[1]) / 60);
            const endHour = startHour + duration;

            const startTimeISO = `${dateStr}T${timeStr}`;
            const endHourH = Math.floor(endHour);
            const endHourM = Math.round((endHour - endHourH) * 60);
            const finishTimeISO = `${dateStr}T${endHourH.toString().padStart(2, '0')}:${endHourM.toString().padStart(2, '0')}`;

            store.create('schedule', {
              type: 'meeting',
              technicianId: techId,
              technicianName: tech?.name || '',
              date: dateStr,
              startTime: startTimeISO,
              finishTime: finishTimeISO,
              hours: duration,
              notes: notes
            });

            showToast(`Meeting scheduled for ${tech?.name}`, 'success');
            c();
            render();
          }
        }
      ]
    });
  }



  function renderBlocks(techBlocks, dayIdx, color) {
    const priorityBorders = { 'Urgent': '#EF4444', 'High': '#F59E0B' };
    const isDark = document.documentElement.getAttribute('data-theme-mode') === 'dark';
    return techBlocks
      .filter(b => b.dayIdx === dayIdx)
      .map(b => {
        const top = b.startHour * PX_PER_HOUR;
        const height = Math.max((b.endHour - b.startHour) * PX_PER_HOUR - 2, PX_PER_QUARTER);
        const statusColors = {
          'Pending': {
            border: 'var(--color-warning, #F59E0B)',
            bg: 'var(--color-warning-bg, rgba(245, 158, 11, 0.08))',
            text: 'var(--color-warning, #D97706)'
          },
          'Scheduled': {
            border: 'var(--color-info, #3B82F6)',
            bg: 'var(--color-info-bg, rgba(59, 130, 246, 0.08))',
            text: 'var(--color-info, #2563EB)'
          },
          'In Progress': {
            border: 'var(--color-primary, #6366F1)',
            bg: 'var(--color-primary-light, rgba(99, 102, 241, 0.08))',
            text: 'var(--color-primary, #4F46E5)'
          },
          'On Hold': {
            border: 'var(--text-secondary, #6B7280)',
            bg: 'var(--content-bg, rgba(107, 114, 128, 0.08))',
            text: 'var(--text-secondary, #4B5563)'
          },
          'Completed': {
            border: 'var(--color-success, #10B981)',
            bg: 'var(--color-success-bg, rgba(16, 185, 129, 0.08))',
            text: 'var(--color-success, #059669)'
          },
          'Invoiced': {
            border: '#9CA3AF',
            bg: isDark ? 'rgba(55, 65, 81, 0.3)' : 'rgba(243, 244, 246, 0.7)',
            text: isDark ? '#D1D5DB' : '#6B7280'
          },
          'Recurring Template': {
            border: '#9333ea',
            bg: 'rgba(147, 51, 234, 0.08)',
            text: '#9333ea'
          }
        };

        let borderColor = priorityBorders[b.priority] || color;
        let background = `${color}12`;
        let textColor = color;

        // Custom styling overrides for leave, blockout, meeting
        if (b.type === 'leave') {
          if (b.status === 'Approved') {
            borderColor = '#10B981'; // Green for approved leave
            background = 'rgba(16, 185, 129, 0.16)';
            textColor = '#059669';
          } else if (b.status === 'Denied' || b.status === 'Rejected') {
            borderColor = '#EF4444'; // Red for denied leave
            background = 'rgba(239, 68, 68, 0.16)';
            textColor = '#DC2626';
          } else {
            borderColor = '#F59E0B'; // Orange for pending leave
            background = 'rgba(245, 158, 11, 0.1)';
            textColor = '#D97706';
          }
        } else if (b.type === 'blockout') {
          borderColor = '#6B7280'; // Gray for blockout
          background = 'rgba(107, 114, 128, 0.1)';
          textColor = '#4B5563';
        } else if (b.type === 'meeting') {
          borderColor = '#3B82F6'; // Blue for meetings
          background = 'rgba(59, 130, 246, 0.1)';
          textColor = '#2563EB';
        } else if (b.type === 'virtual') {
          if (b.hasCollision) {
            borderColor = '#EF4444';
            background = 'rgba(239, 68, 68, 0.16)';
            textColor = '#DC2626';
          } else {
            borderColor = '#9333ea';
            background = 'rgba(147, 51, 234, 0.08)';
            textColor = '#9333ea';
          }
        } else {
          // Standard jobs: use status colors!
          const colors = statusColors[b.status];
          if (colors) {
            borderColor = priorityBorders[b.priority] || colors.border;
            background = colors.bg;
            textColor = colors.text;
          }
        }
        // Apply styling for collisions to ALL blocks
        if (b.hasCollision) {
          borderColor = '#EF4444';
          background = 'rgba(239, 68, 68, 0.16)';
          textColor = '#DC2626';
        }

        const isVirtual = b.type === 'virtual';
        const timeLabel = `${formatHour(b.startHour)} — ${formatHour(b.endHour)}`;
        let tooltipTitle = b.title;
        
        if (isVirtual) {
          tooltipTitle = b.hasCollision ? `⚠️ COLLISION DETECTED: ${b.title} (Overlaps existing schedule)` : `${b.title} (Right-click -> Create as Job)`;
        } else if (b.type === 'leave') {
          tooltipTitle = 'LEAVE';
        } else if (b.type === 'blockout') {
          tooltipTitle = 'BLOCKOUT';
        } else if (b.type === 'meeting') {
          tooltipTitle = 'MEETING';
        }
        
        if (!isVirtual && b.hasCollision) {
          tooltipTitle = `⚠️ COLLISION DETECTED: ${tooltipTitle} (Overlaps existing schedule)`;
        }

        return `
          <div class="schedule-block ${b.hasCollision ? 'schedule-block-collision' : ''} ${isVirtual ? 'schedule-block-virtual' : ''}"
            draggable="${isVirtual ? 'false' : 'true'}"
            data-block-job-id="${b.jobId || ''}"
            data-parent-job-id="${b.parentJobId || ''}"
            data-date="${b.dateStr || ''}"
            data-tech-id="${b.technicianId || ''}"
            data-schedule-id="${b.id}"
            data-block-type="${b.type}"
            data-start="${b.startHour}"
            data-end="${b.endHour}"
            data-tooltip-title="${escapeHTML(tooltipTitle || '')}"
            data-tooltip-customer="${escapeHTML(b.customerName || '')}"
            data-tooltip-time="${escapeHTML(timeLabel)}"
            data-tooltip-jobnum="${escapeHTML(b.jobNumber || '')}"
            style="
              top:${top}px;
              height:${height}px;
              background:${background};
              border-color:${borderColor};
              color:${textColor};
              pointer-events:auto;
            ">
            <div style="pointer-events:none;font-weight:700;font-size:11px;line-height:1.3;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;display:flex;align-items:center;justify-content:space-between">
              <span>${b.jobNumber}</span>
              ${b.hasCollision ? `<span class="virtual-forecast-badge virtual-collision-badge">COLLISION</span>` : (isVirtual ? `<span class="virtual-forecast-badge">FORECAST</span>` : '')}
              ${b.type === 'leave' && (b.status === 'Approved' || b.status === 'Denied' || b.status === 'Rejected') ? `<span class="virtual-forecast-badge" style="background:${b.status === 'Approved' ? '#10B981' : '#EF4444'};color:white;border:none;">${b.status.toUpperCase()}</span>` : ''}
            </div>
            ${height > 20 ? `<div style="pointer-events:none;font-size:10px;opacity:0.9;font-weight:500;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${b.customerName}</div>` : ''}
            ${height > 36 ? `<div class="schedule-block-time" style="pointer-events:none;font-size:9px;opacity:0.7;margin-top:2px">${timeLabel}</div>` : ''}
            ${!isVirtual ? `<div class="schedule-resize-handle" data-block-job-id="${b.jobId || ''}" data-schedule-id="${b.id}" data-block-type="${b.type}" data-start="${b.startHour}" data-end="${b.endHour}" title="Drag to resize"></div>` : ''}
          </div>
        `;
      }).join('');
  }

  function bindEvents() {
    // Custom Hover Tooltips for Schedule Blocks
    container.querySelectorAll('.schedule-block').forEach(block => {
      block.addEventListener('mouseenter', (e) => {
        removeTooltip();

        const title = block.dataset.tooltipTitle;
        const customer = block.dataset.tooltipCustomer;
        const time = block.dataset.tooltipTime;
        const jobNum = block.dataset.tooltipJobnum;
        const blockType = block.dataset.blockType;

        if (!title && !customer && !time) return;

        const tooltip = document.createElement('div');
        tooltip.className = 'schedule-tooltip-popover';
        
        let contentHtml = '';
        if (blockType === 'leave' || blockType === 'blockout' || blockType === 'meeting') {
          contentHtml = `
            <div style="font-weight:700; font-size:12px; margin-bottom:4px; color:var(--text-primary); text-transform:uppercase;">${title}</div>
            <div style="font-size:11px; color:var(--text-secondary); display:flex; align-items:center; gap:4px;">
              <span class="material-icons-outlined" style="font-size:12px">schedule</span> ${time}
            </div>
          `;
        } else {
          contentHtml = `
            <div style="font-weight:700; font-size:12px; margin-bottom:2px; color:var(--text-primary); display:flex; align-items:center; gap:6px;">
              <span style="background:var(--color-primary-light); color:var(--color-primary); padding:1px 4px; border-radius:3px; font-size:9px; font-weight:800;">${jobNum || 'JOB'}</span>
              <span style="overflow:hidden; text-overflow:ellipsis; white-space:nowrap; max-width:180px;">${title}</span>
            </div>
            <div style="font-size:11px; color:var(--text-secondary); margin-bottom:2px; display:flex; align-items:center; gap:4px;">
              <span class="material-icons-outlined" style="font-size:12px; opacity:0.7;">person</span> ${customer || 'Unknown Customer'}
            </div>
            <div style="font-size:11px; color:var(--text-secondary); display:flex; align-items:center; gap:4px;">
              <span class="material-icons-outlined" style="font-size:12px; opacity:0.7;">schedule</span> ${time}
            </div>
          `;
        }

        tooltip.innerHTML = contentHtml;
        document.body.appendChild(tooltip);

        const rect = block.getBoundingClientRect();
        const tooltipWidth = tooltip.offsetWidth || 230;
        const tooltipHeight = tooltip.offsetHeight || 60;
        
        let left = rect.left + (rect.width / 2) - (tooltipWidth / 2);
        let top = rect.top - tooltipHeight - 8;

        if (left < 10) left = 10;
        if (left + tooltipWidth > window.innerWidth - 10) {
          left = window.innerWidth - tooltipWidth - 10;
        }
        if (top < 10) {
          top = rect.bottom + 8;
        }

        tooltip.style.left = `${left + window.scrollX}px`;
        tooltip.style.top = `${top + window.scrollY}px`;
        
        setTimeout(() => tooltip.classList.add('active'), 10);
      });

      block.addEventListener('mouseleave', removeTooltip);
      block.addEventListener('click', removeTooltip);
      block.addEventListener('dragstart', removeTooltip);
    });

    function removeTooltip() {
      document.querySelectorAll('.schedule-tooltip-popover').forEach(t => t.remove());
    }

    // Ensure tooltips are cleared when navigating away
    const origCleanup = window.addEventListener ? window.removeEventListener : null;
    
    container.querySelector('#btn-prev')?.addEventListener('click', (e) => {
      e.stopPropagation();
      currentDate.setDate(currentDate.getDate() - (viewMode === 'week' ? 7 : 1));
      render();
    });
    container.querySelector('#btn-next')?.addEventListener('click', (e) => {
      e.stopPropagation();
      currentDate.setDate(currentDate.getDate() + (viewMode === 'week' ? 7 : 1));
      render();
    });
    container.querySelector('#btn-today')?.addEventListener('click', (e) => {
      e.stopPropagation();
      currentDate = new Date();
      render();
    });
    container.querySelectorAll('[data-view]').forEach(btn => {
      btn.addEventListener('click', (e) => { e.stopPropagation(); viewMode = btn.dataset.view; render(); });
    });
    container.querySelectorAll('[data-cal]').forEach(btn => {
      btn.addEventListener('click', (e) => { e.stopPropagation(); calendarType = btn.dataset.cal; render(); });
    });

    container.querySelectorAll('.tech-visibility-checkbox').forEach(cb => {
      cb.addEventListener('change', (e) => {
        if (e.target.checked) visibleTechIds.add(e.target.value);
        else visibleTechIds.delete(e.target.value);
        render();
      });
    });

    container.querySelector('#btn-tech-filter-trigger')?.addEventListener('click', (e) => {
      e.stopPropagation();
      isTechsPanelOpen = !isTechsPanelOpen;
      render();
    });

    container.querySelector('#tech-filter-dropdown')?.addEventListener('click', (e) => {
      e.stopPropagation();
    });

    container.querySelector('#job-search-section-wrapper')?.addEventListener('click', (e) => {
      e.stopPropagation();
    });

    const searchInput = container.querySelector('#job-search-input');
    if (searchInput) {
      searchInput.addEventListener('focus', () => {
        if (!isSearchActive) {
          isSearchActive = true;
          const wrapper = document.getElementById('job-search-section-wrapper');
          if (wrapper) {
            wrapper.style.display = 'flex';
          }
        }
      });

      searchInput.addEventListener('click', (e) => {
        e.stopPropagation();
        if (!isSearchActive) {
          isSearchActive = true;
          const wrapper = document.getElementById('job-search-section-wrapper');
          if (wrapper) {
            wrapper.style.display = 'flex';
          }
        }
      });

      searchInput.addEventListener('input', (e) => {
        jobSearchQuery = e.target.value;
        renderSearchResultsList();
      });
    }

    container.querySelector('#btn-action-menu-trigger')?.addEventListener('click', (e) => {
      e.stopPropagation();
      isActionMenuOpen = !isActionMenuOpen;
      render();
    });

    container.querySelectorAll('.action-menu-opt').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const action = btn.dataset.action;
        isActionMenuOpen = false;
        render();

        if (action === 'job') handleAddJobSchedule();
        else if (action === 'leave') handleAddLeave();
        else if (action === 'blockout') handleAddBlockout();
        else if (action === 'meeting') handleAddMeeting();
      });
    });

    // Click existing blocks to navigate to job or show drawer
    container.querySelectorAll('.schedule-block').forEach(block => {
      block.addEventListener('click', (e) => {
        if (e.defaultPrevented) return; // skip if drag/resize happened
        if (block.dataset.resized === 'true') { block.dataset.resized = 'false'; return; }

        if (e.ctrlKey || e.metaKey) {
          e.preventDefault();
          e.stopPropagation();
          const scheduleId = block.dataset.scheduleId;
          if (scheduleId) {
            if (selectedScheduleIds.has(scheduleId)) {
              selectedScheduleIds.delete(scheduleId);
            } else {
              selectedScheduleIds.add(scheduleId);
            }
            applySelectionStyles();
            updateSelectionBar();
          }
          return;
        }

        const jobId = block.dataset.blockJobId;
        const blockType = block.dataset.blockType;
        const scheduleId = block.dataset.scheduleId;
        
        if (blockType === 'schedule' || blockType === 'legacy') {
          const job = store.getById('jobs', jobId);
          if (!job) return;

          showDrawer({
            title: `Job Quick View: ${job.number}`,
            content: `
              <div style="display:flex;flex-direction:column;gap:16px;">
                <div>
                  <label class="form-label">Title</label>
                  <div class="font-medium" style="font-size:16px">${job.title || 'Untitled'}</div>
                </div>
                <div>
                  <label class="form-label">Customer</label>
                  <div>${job.customerName || 'N/A'}</div>
                </div>
                <div>
                  <label class="form-label">Site Address</label>
                  <div>${job.siteAddress || 'No address provided'}</div>
                </div>
                <div>
                  <label class="form-label">Priority</label>
                  <div><span class="badge ${job.priority === 'Urgent' || job.priority === 'High' ? 'badge-danger' : 'badge-neutral'}">${job.priority || 'Normal'}</span></div>
                </div>
                <div>
                  <label class="form-label">Notes</label>
                  <div style="font-size:var(--font-size-sm);white-space:pre-wrap;background:var(--content-bg);padding:12px;border-radius:4px;border:1px solid var(--border-color);">${job.notes || 'No notes available'}</div>
                </div>
              </div>
            `,
            actions: [
              { label: 'Close', className: 'btn-secondary', onClick: (close) => close() },
              { label: 'Open Full Job', className: 'btn-primary', onClick: (close) => { close(); router.navigate(`/jobs/${jobId}`); } }
            ],
            width: 450
          });
        } else {
          // Leave, blockout, meeting quick view
          const s = store.getById('schedule', scheduleId);
          if (!s) return;
          const label = blockType === 'leave' ? 'Leave Details' : (blockType === 'blockout' ? 'Blockout Details' : 'Meeting Details');
          const tech = store.getById('technicians', s.technicianId);
          showDrawer({
            title: label,
            content: `
              <div style="display:flex;flex-direction:column;gap:16px;">
                <div>
                  <label class="form-label">Type</label>
                  <div class="font-medium" style="font-size:16px; text-transform:uppercase">${blockType}</div>
                </div>
                <div>
                  <label class="form-label">Technician</label>
                  <div>${escapeHTML(tech?.name || s.technicianName || 'Unknown')}</div>
                </div>
                <div>
                  <label class="form-label">Date</label>
                  <div>${s.date || 'N/A'}</div>
                </div>
                <div>
                  <label class="form-label">Duration</label>
                  <div>${s.hours || 0} Hours</div>
                </div>
                <div>
                  <label class="form-label">Notes / Description</label>
                  <div style="font-size:var(--font-size-sm);white-space:pre-wrap;background:var(--content-bg);padding:12px;border-radius:4px;border:1px solid var(--border-color);">${escapeHTML(s.notes || 'No details entered')}</div>
                </div>
              </div>
            `,
            actions: [
              { label: 'Close', className: 'btn-secondary', onClick: (close) => close() },
              {
                label: 'Remove Allocation',
                className: 'btn-danger',
                onClick: (close) => {
                  close();
                  store.delete('schedule', scheduleId);
                  showToast('Allocation removed successfully', 'success');
                  render();
                }
              }
            ],
            width: 450
          });
        }
      });
      block.addEventListener('contextmenu', (e) => {
        e.preventDefault();
        closeContextMenu();
        const scheduleId = block.dataset.scheduleId;
        const blockType = block.dataset.blockType;
        const isJobBlock = blockType === 'schedule' || blockType === 'legacy';

        // Bulk menu: right-clicking a block that's part of a multi-selection acts on
        // the whole selection instead of the single block.
        if (blockType === 'schedule' && selectedScheduleIds.has(scheduleId) && selectedScheduleIds.size > 1) {
          const n = selectedScheduleIds.size;
          contextMenu = document.createElement('div');
          contextMenu.className = 'dropdown-menu';
          contextMenu.style.cssText = `position:fixed;top:${e.clientY}px;left:${e.clientX}px;z-index:1000;background:var(--card-bg);box-shadow:var(--shadow-md);border:1px solid var(--border-color);border-radius:var(--border-radius);padding:4px 0;min-width:180px;`;
          contextMenu.innerHTML = `
            <div style="padding:4px 12px;font-size:11px;color:var(--text-tertiary);font-weight:600;">${n} allocations selected</div>
            <button class="dropdown-item" id="ctx-bulk-book"><span class="material-icons-outlined" style="font-size:16px;margin-right:8px">timer</span> Book Time in Place (${n})</button>
            <button class="dropdown-item text-danger" id="ctx-bulk-unsched"><span class="material-icons-outlined" style="font-size:16px;margin-right:8px">event_busy</span> Unschedule (${n})</button>`;
          document.body.appendChild(contextMenu);
          contextMenu.querySelector('#ctx-bulk-book').addEventListener('click', () => { closeContextMenu(); bulkBookTime(); });
          contextMenu.querySelector('#ctx-bulk-unsched').addEventListener('click', () => { closeContextMenu(); bulkUnschedule(); });
          return;
        }

        contextMenu = document.createElement('div');
        contextMenu.className = 'dropdown-menu';
        contextMenu.style.position = 'fixed';
        contextMenu.style.top = `${e.clientY}px`;
        contextMenu.style.left = `${e.clientX}px`;
        contextMenu.style.zIndex = 1000;
        contextMenu.style.background = 'var(--card-bg)';
        contextMenu.style.boxShadow = 'var(--shadow-md)';
        contextMenu.style.border = '1px solid var(--border-color)';
        contextMenu.style.borderRadius = 'var(--border-radius)';
        contextMenu.style.padding = '4px 0';
        contextMenu.style.minWidth = '140px';

        if (blockType === 'virtual') {
          contextMenu.style.minWidth = '170px';
          contextMenu.innerHTML = `
            <button class="dropdown-item text-primary" id="ctx-create-job"><span class="material-icons-outlined" style="font-size:16px;margin-right:8px">add_task</span> Create as Job</button>
            <button class="dropdown-item" id="ctx-view-parent"><span class="material-icons-outlined" style="font-size:16px;margin-right:8px">visibility</span> View Template Job</button>
            <button class="dropdown-item text-danger" id="ctx-skip-occurrence"><span class="material-icons-outlined" style="font-size:16px;margin-right:8px">block</span> Skip Occurrence</button>
          `;
          document.body.appendChild(contextMenu);

          contextMenu.querySelector('#ctx-skip-occurrence').addEventListener('click', () => {
            closeContextMenu();
            const parentJobId = block.dataset.parentJobId;
            const dateStr = block.dataset.date;
            const parentJob = store.getById('jobs', parentJobId);
            if (parentJob && parentJob.recurringConfig) {
              if (!parentJob.recurringConfig.skippedDates) {
                parentJob.recurringConfig.skippedDates = [];
              }
              if (!parentJob.recurringConfig.skippedDates.includes(dateStr)) {
                parentJob.recurringConfig.skippedDates.push(dateStr);
                store.update('jobs', parentJobId, { recurringConfig: parentJob.recurringConfig });
                showToast(`Skipped occurrence on ${dateStr}`, 'success');
                render();
              }
            }
          });

          contextMenu.querySelector('#ctx-create-job').addEventListener('click', () => {
            closeContextMenu();
            const parentJobId = block.dataset.parentJobId;
            const dateStr = block.dataset.date;
            const techId = block.dataset.techId || null;
            const startHour = parseFloat(block.dataset.start) || 8;
            const duration = (parseFloat(block.dataset.end) || 10) - startHour;

            const newJob = materializeVirtualOccurrence(parentJobId, dateStr, techId, startHour, duration);
            if (newJob) {
              showToast(`Created job ${newJob.number} from recurring template`, 'success');
              render();
            }
          });

          contextMenu.querySelector('#ctx-view-parent').addEventListener('click', () => {
            closeContextMenu();
            const parentJobId = block.dataset.parentJobId;
            if (parentJobId) {
              router.navigate(`/jobs/${parentJobId}`);
            }
          });
          return;
        }

        if (isJobBlock) {
          const isRealSchedule = blockType === 'schedule';
          const jobId = block.dataset.blockJobId;
          const job = store.getById('jobs', jobId);
          const parentJob = job?.parentJobId ? store.getById('jobs', job.parentJobId) : null;
          const isRecurringChild = parentJob && parentJob.isRecurring === true;

          const isBatch = selectedScheduleIds.size > 1 && selectedScheduleIds.has(scheduleId);

          if (isBatch) {
            contextMenu.innerHTML = `
              <button class="dropdown-item" id="ctx-batch-reassign"><span class="material-icons-outlined" style="font-size:16px;margin-right:8px">person_add</span> Reassign (${selectedScheduleIds.size})</button>
              <button class="dropdown-item text-danger" id="ctx-batch-unschedule"><span class="material-icons-outlined" style="font-size:16px;margin-right:8px">event_busy</span> Unschedule (${selectedScheduleIds.size})</button>
            `;
          } else {
            contextMenu.innerHTML = `
              <button class="dropdown-item" id="ctx-view"><span class="material-icons-outlined" style="font-size:16px;margin-right:8px">visibility</span> View Job</button>
              ${isRealSchedule ? `
                <button class="dropdown-item" id="ctx-change-task"><span class="material-icons-outlined" style="font-size:16px;margin-right:8px">assignment</span> Change Task</button>
                <button class="dropdown-item" id="ctx-reassign"><span class="material-icons-outlined" style="font-size:16px;margin-right:8px">person_add</span> Reassign</button>
                <button class="dropdown-item" id="ctx-book-time"><span class="material-icons-outlined" style="font-size:16px;margin-right:8px">timer</span> Book Time in Place</button>
              ` : ''}
              <button class="dropdown-item text-danger" id="ctx-unschedule"><span class="material-icons-outlined" style="font-size:16px;margin-right:8px">event_busy</span> Unschedule</button>
              ${isRecurringChild ? `
                <button class="dropdown-item text-danger" id="ctx-skip-occurrence"><span class="material-icons-outlined" style="font-size:16px;margin-right:8px">block</span> Skip Occurrence</button>
              ` : ''}
            `;
          }
          document.body.appendChild(contextMenu);

          function promptReassign(idsToReassign) {
            const techs = store.getAll('technicians').filter(t => !t.deactivated);
            const options = techs.map(t => `<option value="${t.id}">${t.name}</option>`).join('');
            showModal({
              title: 'Reassign ' + (idsToReassign.length > 1 ? 'Jobs' : 'Job'),
              content: `<div class="form-group"><label class="form-label">Select Technician</label><select id="reassign-tech" class="form-select">${options}</select></div>`,
              actions: [
                { label: 'Cancel', className: 'btn-secondary', onClick: c => c() },
                { label: 'Reassign', className: 'btn-primary', onClick: c => {
                     const newTechId = document.getElementById('reassign-tech').value;
                     idsToReassign.forEach(id => {
                         store.update('schedule', id, { technicianId: newTechId });
                     });
                     showToast('Reassigned successfully', 'success');
                     selectedScheduleIds.clear();
                     render();
                     c();
                }}
              ]
            });
          }

          if (isBatch) {
            contextMenu.querySelector('#ctx-batch-reassign').addEventListener('click', () => {
              closeContextMenu();
              promptReassign(Array.from(selectedScheduleIds));
            });
            contextMenu.querySelector('#ctx-batch-unschedule').addEventListener('click', () => {
              closeContextMenu();
              const count = selectedScheduleIds.size;
              selectedScheduleIds.forEach(id => store.delete('schedule', id));
              selectedScheduleIds.clear();
              showToast(`Unscheduled ${count} jobs`, 'success');
              render();
            });
            return;
          }

          if (isRecurringChild) {
            contextMenu.querySelector('#ctx-skip-occurrence').addEventListener('click', () => {
              closeContextMenu();
              const dateStr = job.scheduledDate;
              if (dateStr) {
                if (!parentJob.recurringConfig.skippedDates) {
                  parentJob.recurringConfig.skippedDates = [];
                }
                if (!parentJob.recurringConfig.skippedDates.includes(dateStr)) {
                  parentJob.recurringConfig.skippedDates.push(dateStr);
                  store.update('jobs', parentJob.id, { recurringConfig: parentJob.recurringConfig });
                }
              }
              // Also delete the job instance so it disappears
              store.delete('jobs', jobId);
              showToast('Occurrence skipped and removed from schedule', 'success');
              render();
            });
          }

          contextMenu.querySelector('#ctx-view').addEventListener('click', () => {
            closeContextMenu();
            const jobId = block.dataset.blockJobId;
            router.navigate(`/jobs/${jobId}`);
          });

          if (isRealSchedule) {
            contextMenu.querySelector('#ctx-reassign').addEventListener('click', () => {
              closeContextMenu();
              promptReassign([scheduleId]);
            });

            contextMenu.querySelector('#ctx-change-task').addEventListener('click', () => {
              closeContextMenu();
              const jobId = block.dataset.blockJobId;
              const job = store.getById('jobs', jobId);
              if (!job) return;

              const tasks = job.tasks || [];
              if (tasks.length === 0) {
                showToast('This job has no tasks.', 'error');
                return;
              }

              const schedRecord = store.getById('schedule', scheduleId);
              const currentTaskId = schedRecord ? schedRecord.taskId : null;
              const currentTaskName = schedRecord ? schedRecord.taskName : null;

              let optionsHtml = '';
              
              const isNoTaskSelected = !currentTaskId;
              optionsHtml += `
                <div class="task-select-item ${isNoTaskSelected ? 'active' : ''}" data-value="null" style="display: flex; align-items: center; justify-content: space-between; padding: 10px 14px; border: 1.5px solid ${isNoTaskSelected ? 'var(--color-primary)' : 'var(--border-color)'}; background: ${isNoTaskSelected ? 'rgba(59, 130, 246, 0.08)' : 'var(--card-bg)'}; border-radius: 8px; cursor: pointer; transition: all 0.2s ease; margin-bottom: 8px;">
                  <div style="display: flex; align-items: center; gap: 8px;">
                    <span class="material-icons-outlined" style="color: ${isNoTaskSelected ? 'var(--color-primary)' : 'var(--text-tertiary)'}; font-size: 18px;">block</span>
                    <span style="font-weight: 500; font-size: 13px; color: var(--text-primary);">No Task / Clear Task</span>
                  </div>
                  ${isNoTaskSelected ? '<span class="material-icons-outlined" style="color: var(--color-primary); font-size: 18px;">check_circle</span>' : ''}
                </div>
              `;

              tasks.forEach(t => {
                const mainVal = JSON.stringify({ taskId: t.id, taskName: t.name });
                const isSelected = currentTaskId === t.id && currentTaskName === t.name;
                
                optionsHtml += `
                  <div class="task-select-item ${isSelected ? 'active' : ''}" data-value="${escapeHTML(mainVal)}" style="display: flex; align-items: center; justify-content: space-between; padding: 10px 14px; border: 1.5px solid ${isSelected ? 'var(--color-primary)' : 'var(--border-color)'}; background: ${isSelected ? 'rgba(59, 130, 246, 0.08)' : 'var(--card-bg)'}; border-radius: 8px; cursor: pointer; transition: all 0.2s ease; margin-bottom: 8px;">
                    <div style="display: flex; align-items: center; gap: 8px; flex: 1; min-width: 0;">
                      <span class="material-icons-outlined" style="color: var(--color-primary); font-size: 18px;">assignment</span>
                      <span style="font-weight: 600; font-size: 13px; color: var(--text-primary); text-overflow: ellipsis; overflow: hidden; white-space: nowrap;">${escapeHTML(t.name)}</span>
                    </div>
                    ${isSelected ? '<span class="material-icons-outlined" style="color: var(--color-primary); font-size: 18px;">check_circle</span>' : ''}
                  </div>
                `;

                if (t.subTasks && t.subTasks.length > 0) {
                  t.subTasks.forEach(st => {
                    const fullSubTaskName = `${t.name} - ${st.name}`;
                    const subVal = JSON.stringify({ taskId: t.id, taskName: fullSubTaskName });
                    const isSubSelected = currentTaskId === t.id && currentTaskName === fullSubTaskName;
                    
                    optionsHtml += `
                      <div class="task-select-item ${isSubSelected ? 'active' : ''}" data-value="${escapeHTML(subVal)}" style="display: flex; align-items: center; justify-content: space-between; padding: 8px 12px; margin-left: 20px; border: 1.5px solid ${isSubSelected ? 'var(--color-primary)' : 'var(--border-color)'}; background: ${isSubSelected ? 'rgba(59, 130, 246, 0.08)' : 'var(--card-bg)'}; border-radius: 6px; cursor: pointer; transition: all 0.2s ease; margin-bottom: 8px; position: relative;">
                        <div style="position: absolute; left: -14px; top: -10px; bottom: 50%; width: 10px; border-left: 1.5px dashed var(--border-color); border-bottom: 1.5px dashed var(--border-color);"></div>
                        <div style="display: flex; align-items: center; gap: 6px; flex: 1; min-width: 0;">
                          <span class="material-icons-outlined" style="color: var(--text-tertiary); font-size: 16px;">subdirectory_arrow_right</span>
                          <span style="font-weight: 500; font-size: 12px; color: var(--text-secondary); text-overflow: ellipsis; overflow: hidden; white-space: nowrap;">${escapeHTML(st.name)}</span>
                        </div>
                        ${isSubSelected ? '<span class="material-icons-outlined" style="color: var(--color-primary); font-size: 16px;">check_circle</span>' : ''}
                      </div>
                    `;
                  });
                }
              });

              const content = document.createElement('div');
              content.style.padding = '8px 0';
              content.innerHTML = `
                <div class="form-group" style="margin-bottom: 16px;">
                  <label style="display: block; margin-bottom: 12px; font-weight: 500; font-size: 13px; color: var(--text-secondary);">Select Task</label>
                  <div id="task-select-container" style="max-height: 280px; overflow-y: auto; padding-right: 4px; display: flex; flex-direction: column;">
                    ${optionsHtml}
                  </div>
                </div>
              `;

              let selectedValue = isNoTaskSelected ? 'null' : JSON.stringify({ taskId: currentTaskId, taskName: currentTaskName });

              // Bind item click events
              const items = content.querySelectorAll('.task-select-item');
              items.forEach(item => {
                item.addEventListener('mouseenter', () => {
                  if (!item.classList.contains('active')) {
                    item.style.background = 'rgba(0, 0, 0, 0.02)';
                  }
                });
                item.addEventListener('mouseleave', () => {
                  if (!item.classList.contains('active')) {
                    item.style.background = 'var(--card-bg)';
                  }
                });

                item.addEventListener('click', () => {
                  items.forEach(x => {
                    x.classList.remove('active');
                    x.style.borderColor = 'var(--border-color)';
                    x.style.background = 'var(--card-bg)';
                    const check = x.querySelector('.material-icons-outlined[style*="check_circle"]');
                    if (check) check.remove();
                  });

                  item.classList.add('active');
                  item.style.borderColor = 'var(--color-primary)';
                  item.style.background = 'rgba(59, 130, 246, 0.08)';
                  selectedValue = item.dataset.value;

                  const isSub = item.style.marginLeft === '20px';
                  const size = isSub ? '16px' : '18px';
                  const rightIcon = document.createElement('span');
                  rightIcon.className = 'material-icons-outlined';
                  rightIcon.style.color = 'var(--color-primary)';
                  rightIcon.style.fontSize = size;
                  rightIcon.textContent = 'check_circle';
                  item.appendChild(rightIcon);
                });
              });

              showModal({
                title: `Change Task for ${job.number}`,
                content: content,
                actions: [
                  {
                    label: 'Cancel',
                    className: 'btn-secondary',
                    onClick: (closeModal) => closeModal()
                  },
                  {
                    label: 'Update Task',
                    className: 'btn-primary',
                    onClick: (closeModal) => {
                      let newTaskId = null;
                      let newTaskName = null;
                      
                      if (selectedValue !== 'null') {
                        try {
                          const parsed = JSON.parse(selectedValue);
                          newTaskId = parsed.taskId;
                          newTaskName = parsed.taskName;
                        } catch (e) {
                          console.error(e);
                        }
                      }
                      
                      store.update('schedule', scheduleId, {
                        taskId: newTaskId,
                        taskName: newTaskName
                      });
                      
                      syncJobWithSchedules(jobId);
                      showToast('Task updated successfully', 'success');
                      render();
                      closeModal();
                    }
                  }
                ]
              });
            });
          }

          // Book Time in Place — turn this allocation's slot into logged time
          // against the job's tasklist without opening the job page.
          contextMenu.querySelector('#ctx-book-time')?.addEventListener('click', () => {
            closeContextMenu();
            const sched = store.getById('schedule', scheduleId);
            const job = sched && store.getById('jobs', sched.jobId);
            if (!sched || !job) { showToast('Could not find this allocation', 'error'); return; }
            openBookTimeInPlace(sched, job);
          });

          contextMenu.querySelector('#ctx-unschedule').addEventListener('click', () => {
            closeContextMenu();
            const jobId = block.dataset.blockJobId;
            const allSchedules = store.getAll('schedule');
            const matching = allSchedules.find(s => s.id === scheduleId);
            if (matching) {
              store.delete('schedule', scheduleId);
            }
            if (jobId) {
              syncJobWithSchedules(jobId);
            }
            showToast('Job unscheduled', 'success');
            render();
          });
        } else {
          contextMenu.innerHTML = `
            <button class="dropdown-item text-danger" id="ctx-delete-allocation"><span class="material-icons-outlined" style="font-size:16px;margin-right:8px">delete</span> Delete Allocation</button>
          `;
          document.body.appendChild(contextMenu);

          contextMenu.querySelector('#ctx-delete-allocation').addEventListener('click', () => {
            closeContextMenu();
            store.delete('schedule', scheduleId);
            showToast('Allocation removed successfully', 'success');
            render();
          });
        }
      });
    });

    container.querySelectorAll('.btn-toggle-job-tasks').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const jobId = btn.dataset.jobId;
        if (expandedJobTasklistIds.has(jobId)) {
          expandedJobTasklistIds.delete(jobId);
        } else {
          expandedJobTasklistIds.clear();
          expandedJobTasklistIds.add(jobId);
        }
        render();
      });
    });
  }

  function bindDragAndDrop(days) {
    // 'days' is passed from render() so it always matches the currently rendered DOM

    const scrollContainer = document.getElementById('calendar-scroll');
    if (scrollContainer) {
      // Auto-scroll when mouse is near top/bottom edges
      scrollContainer.addEventListener('dragover', (e) => {
        if (!dragState) return;
        const rect = scrollContainer.getBoundingClientRect();
        const threshold = 60; // pixels from edge to trigger scroll
        const speed = 15; // scroll speed per tick

        if (e.clientY - rect.top < threshold) {
          scrollContainer.scrollTop -= speed;
        } else if (rect.bottom - e.clientY < threshold) {
          scrollContainer.scrollTop += speed;
        }
      });

      // Allow mouse wheel scrolling during drag
      scrollContainer.addEventListener('wheel', (e) => {
        if (dragState) {
          scrollContainer.scrollTop += e.deltaY;
        }
      }, { passive: true });
    }

    // Draggable: unscheduled jobs
    container.querySelectorAll('.unscheduled-job').forEach(el => {
      el.addEventListener('dragstart', (e) => {
        if (e.target.closest('.unscheduled-job-task') || e.target.closest('.unscheduled-job-subtask')) return; // Ignore if dragging nested task or subtask
        const rect = el.getBoundingClientRect();
        dragState = {
          type: 'unscheduled',
          jobId: el.dataset.jobId,
          jobNumber: el.dataset.jobNumber,
          customerName: el.dataset.customer,
          title: el.dataset.title,
          hours: parseFloat(el.dataset.hours) || 2,
          offsetY: e.clientY - rect.top,
        };
        e.dataTransfer.effectAllowed = 'move';
        el.style.opacity = '0.5';
      });
      el.addEventListener('dragend', () => {
        el.style.opacity = '1';
        dragState = null;
        document.querySelectorAll('.schedule-drag-preview').forEach(p => p.remove());
      });
    });

    // Draggable: unscheduled tasks
    container.querySelectorAll('.unscheduled-job-task').forEach(el => {
      el.addEventListener('dragstart', (e) => {
        e.stopPropagation(); // Avoid parent card drag
        const rect = el.getBoundingClientRect();
        dragState = {
          type: 'unscheduled',
          jobId: el.dataset.jobId,
          jobNumber: el.dataset.jobNumber,
          customerName: el.dataset.customer,
          title: el.dataset.title,
          hours: parseFloat(el.dataset.hours) || 2,
          taskId: el.dataset.taskId,
          taskName: el.dataset.taskName,
          offsetY: e.clientY - rect.top,
        };
        e.dataTransfer.effectAllowed = 'move';
        el.style.opacity = '0.5';
      });
      el.addEventListener('dragend', (e) => {
        e.stopPropagation();
        el.style.opacity = '1';
        dragState = null;
        document.querySelectorAll('.schedule-drag-preview').forEach(p => p.remove());
      });
    });

    // Draggable: unscheduled subtasks
    container.querySelectorAll('.unscheduled-job-subtask').forEach(el => {
      el.addEventListener('dragstart', (e) => {
        e.stopPropagation(); // Avoid parent card/task drag
        const rect = el.getBoundingClientRect();
        dragState = {
          type: 'unscheduled',
          jobId: el.dataset.jobId,
          jobNumber: el.dataset.jobNumber,
          customerName: el.dataset.customer,
          title: el.dataset.title,
          hours: parseFloat(el.dataset.hours) || 1,
          taskId: el.dataset.taskId,
          taskName: el.dataset.taskName,
          subTaskId: el.dataset.subTaskId,
          subTaskName: el.dataset.subTaskName,
          offsetY: e.clientY - rect.top,
        };
        e.dataTransfer.effectAllowed = 'move';
        el.style.opacity = '0.5';
      });
      el.addEventListener('dragend', (e) => {
        e.stopPropagation();
        el.style.opacity = '1';
        dragState = null;
        document.querySelectorAll('.schedule-drag-preview').forEach(p => p.remove());
      });
    });

    // Draggable: existing blocks
    container.querySelectorAll('.schedule-block[draggable]').forEach(el => {
      el.addEventListener('dragstart', (e) => {
        e.stopPropagation();
        const id = el.dataset.scheduleId;
        // Dragging a block that isn't part of the selection drops to a single move
        if (!selectedScheduleIds.has(id)) clearSelection();
        const rect = el.getBoundingClientRect();
        dragState = {
          type: 'existing',
          blockType: el.dataset.blockType,
          scheduleId: id,
          jobId: el.dataset.blockJobId,
          startHour: parseFloat(el.dataset.start),
          endHour: parseFloat(el.dataset.end),
          offsetY: e.clientY - rect.top,
        };
        // Group move: capture every other selected allocation's current position so
        // the drop can shift them all by the same day + time delta (techs preserved).
        if (el.dataset.blockType === 'schedule' && selectedScheduleIds.size > 1 && selectedScheduleIds.has(id)) {
          dragState.group = [...selectedScheduleIds]
            .map(sid => store.getById('schedule', sid))
            .filter(s => s && s.id !== id)
            .map(s => ({ id: s.id, date: s.date, startHour: s.startHour, endHour: s.endHour, technicianId: s.technicianId, technicianName: s.technicianName }));
        }
        e.dataTransfer.effectAllowed = 'move';
        el.style.opacity = '0.4';
        if (dragState.group) container.querySelectorAll('.sched-selected').forEach(b => b.style.opacity = '0.4');
      });
      el.addEventListener('dragend', () => {
        el.style.opacity = '1';
        container.querySelectorAll('.sched-selected').forEach(b => b.style.opacity = '');
        dragState = null;
        document.querySelectorAll('.schedule-drag-preview').forEach(p => p.remove());
      });
    });

    // Drop zones: each day column per technician
    container.querySelectorAll('.schedule-day-col').forEach(col => {
      col.addEventListener('dragover', (e) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
        col.style.background = 'rgba(27, 109, 224, 0.05)';

        if (!dragState) return;

        const rect = col.getBoundingClientRect();
        const offsetY = dragState.offsetY || 0;
        const relY = e.clientY - offsetY - rect.top;
        const rawHour = relY / PX_PER_HOUR;
        const dropHour = Math.min(23.75, Math.max(0, snapToQuarter(rawHour)));

        let preview = col.querySelector('.schedule-drag-preview');
        if (!preview) {
          preview = document.createElement('div');
          preview.className = 'schedule-drag-preview';
          preview.style.position = 'absolute';
          preview.style.left = '3px';
          preview.style.right = '3px';
          preview.style.background = 'rgba(27, 109, 224, 0.15)';
          preview.style.border = '2px dashed var(--color-primary)';
          preview.style.borderRadius = '4px';
          preview.style.pointerEvents = 'none';
          preview.style.zIndex = '10';
          col.appendChild(preview);
        }

        const duration = dragState.type === 'existing'
          ? (dragState.endHour - dragState.startHour)
          : (dragState.hours || 2);

        const top = dropHour * PX_PER_HOUR;
        const height = Math.max(duration * PX_PER_HOUR - 2, PX_PER_QUARTER);

        preview.style.top = top + 'px';
        preview.style.height = height + 'px';
      });
      col.addEventListener('dragleave', (e) => {
        if (!col.contains(e.relatedTarget)) {
          col.style.background = '';
          const preview = col.querySelector('.schedule-drag-preview');
          if (preview) preview.remove();
        }
      });
      col.addEventListener('drop', (e) => {
        const jobs = store.getAll('jobs'); // fresh read
        e.preventDefault();
        col.style.background = '';
        const preview = col.querySelector('.schedule-drag-preview');
        if (preview) preview.remove();

        if (!dragState) return;

        const targetTechId = col.dataset.tech;
        const targetDayIdx = parseInt(col.dataset.day);
        // Use the stamped date string as the ground truth — avoids index drift
        const targetDay = col.dataset.date ? new Date(col.dataset.date + 'T12:00:00') : days[targetDayIdx];

        // Calculate drop hour from mouse position — snap to 15-min grid
        const rect = col.getBoundingClientRect();
        const offsetY = dragState.offsetY || 0;
        const relY = e.clientY - offsetY - rect.top;
        const rawHour = relY / PX_PER_HOUR;
        const dropHour = Math.min(23.75, Math.max(0, snapToQuarter(rawHour)));

        const tech = technicians.find(t => t.id === targetTechId);

        if (dragState.type === 'existing' && ['leave', 'blockout', 'meeting'].includes(dragState.blockType)) {
          const duration = dragState.endHour - dragState.startHour;
          const dropEndHour = dropHour + duration;
          const pad = n => n.toString().padStart(2, '0');
          const localDateStr = `${targetDay.getFullYear()}-${pad(targetDay.getMonth() + 1)}-${pad(targetDay.getDate())}`;
          const startH = Math.floor(dropHour);
          const startM = Math.round((dropHour - startH) * 60);
          const endH = Math.floor(dropEndHour);
          const endM = Math.round((dropEndHour - endH) * 60);
          const startTimeStr = `${localDateStr}T${pad(startH)}:${pad(startM)}`;
          const finishTimeStr = `${localDateStr}T${pad(endH)}:${pad(endM)}`;

          store.update('schedule', dragState.scheduleId, {
            technicianId: targetTechId,
            technicianName: tech?.name || '',
            date: localDateStr,
            startTime: startTimeStr,
            finishTime: finishTimeStr,
            hours: duration,
            startHour: dropHour,
            endHour: dropEndHour
          });

          showToast(`Moved ${dragState.blockType.toUpperCase()} entry for ${tech?.name || 'technician'} to ${localDateStr}`, 'success');
          dragState = null;
          render();
          return;
        }

        const job = jobs.find(j => j.id === dragState.jobId);

        if (job) {
          const duration = dragState.type === 'existing'
            ? (dragState.endHour - dragState.startHour)
            : (dragState.hours || job.estimatedHours || 2);

          const dropEndHour = dropHour + duration;

          // Conflict Detection
          const blocks = getScheduleBlocks();
          const hasConflict = blocks.some(b =>
            b.technicianId === targetTechId &&
            b.dayIdx === targetDayIdx &&
            (dragState.scheduleId ? b.id !== dragState.scheduleId : b.jobId !== job.id) &&
            Math.max(b.startHour, dropHour) < Math.min(b.endHour, dropEndHour)
          );

          if (hasConflict) {
            if (!window.confirm('Technician already has a job scheduled at this time. Proceed anyway?')) {
              dragState = null;
              return;
            }
          }

          const pad = n => n.toString().padStart(2, '0');
          const localDateStr = `${targetDay.getFullYear()}-${pad(targetDay.getMonth() + 1)}-${pad(targetDay.getDate())}`;
          const startH = Math.floor(dropHour);
          const startM = Math.round((dropHour - startH) * 60);
          const endH = Math.floor(dropEndHour);
          const endM = Math.round((dropEndHour - endH) * 60);
          const startTimeStr = `${localDateStr}T${pad(startH)}:${pad(startM)}`;
          const finishTimeStr = `${localDateStr}T${pad(endH)}:${pad(endM)}`;

          if (dragState.type === 'existing' && dragState.blockType === 'schedule') {
            // Group move: work out the day + time shift from the primary block BEFORE
            // it moves, then apply the same delta to every other selected allocation
            // (each keeps its own technician and duration).
            const group = dragState.group;
            let primaryOrig = null;
            if (group && group.length) {
              const rec = store.getById('schedule', dragState.scheduleId);
              primaryOrig = rec ? { date: rec.date, startHour: rec.startHour } : null;
            }

            store.update('schedule', dragState.scheduleId, {
              technicianId: targetTechId,
              technicianName: tech?.name || '',
              date: localDateStr,
              startTime: startTimeStr,
              finishTime: finishTimeStr,
              hours: duration
            });
            syncJobWithSchedules(job.id);

            if (group && group.length && primaryOrig) {
              const dayMs = 86400000;
              const deltaDays = Math.round((new Date(localDateStr + 'T12:00:00') - new Date(primaryOrig.date + 'T12:00:00')) / dayMs);
              const deltaHour = dropHour - (primaryOrig.startHour ?? 0);
              group.forEach(g => {
                const nd = new Date(g.date + 'T12:00:00'); nd.setDate(nd.getDate() + deltaDays);
                const ndStr = `${nd.getFullYear()}-${pad(nd.getMonth() + 1)}-${pad(nd.getDate())}`;
                const dur = (g.endHour ?? (g.startHour + 1)) - g.startHour;
                let ns = Math.min(23.75, Math.max(0, snapToQuarter((g.startHour ?? 0) + deltaHour)));
                const ne = ns + dur;
                store.update('schedule', g.id, {
                  date: ndStr,
                  startTime: `${ndStr}T${pad(Math.floor(ns))}:${pad(Math.round((ns - Math.floor(ns)) * 60))}`,
                  finishTime: `${ndStr}T${pad(Math.floor(ne))}:${pad(Math.round((ne - Math.floor(ne)) * 60))}`,
                });
                if (g.id !== dragState.scheduleId) { const gj = store.getById('schedule', g.id); if (gj) syncJobWithSchedules(gj.jobId); }
              });
              showToast(`Moved ${group.length + 1} allocations`, 'success');
            } else {
              showToast(`Moved ${job.number} for ${tech?.name} to ${localDateStr}`, 'success');
            }
          } else {
            // New schedule booking for unscheduled or legacy blocks
            store.create('schedule', {
              jobId: job.id,
              jobNumber: job.number,
              technicianId: targetTechId,
              technicianName: tech?.name || '',
              date: localDateStr,
              startTime: startTimeStr,
              finishTime: finishTimeStr,
              hours: duration,
              taskId: dragState.taskId || null,
              taskName: dragState.taskName || null
            });

            // Update job's scheduled info
            store.update('jobs', job.id, {
              scheduledDate: localDateStr,
              startHour: dropHour,
              technicianId: targetTechId,
              technicianName: tech?.name || '',
              status: job.status === 'Pending' ? 'Scheduled' : job.status,
            });
            syncJobWithSchedules(job.id);
            showToast(`Assigned ${job.number} to ${tech?.name}`, 'success');
          }
        }

        if (dragState && dragState.type === 'unscheduled') {
          isSearchActive = false;
        }
        dragState = null;
        render();
      });
    });
  }

  function bindResize() {
    container.querySelectorAll('.schedule-resize-handle').forEach(handle => {
      handle.addEventListener('mousedown', (e) => {
        e.preventDefault();
        e.stopPropagation();

        const block = handle.closest('.schedule-block');
        const col = block.closest('.schedule-day-col');
        const startHour = parseFloat(handle.dataset.start);
        const initialEndHour = parseFloat(handle.dataset.end);
        const colRect = col.getBoundingClientRect();

        resizeState = {
          blockType: handle.dataset.blockType,
          scheduleId: handle.dataset.scheduleId,
          jobId: handle.dataset.blockJobId,
          block,
          col,          // store the element, not its rect
          startHour,
          endHour: initialEndHour,
        };

        block.dataset.resized = 'false';
        block.style.opacity = '0.85';
        block.style.userSelect = 'none';
        document.body.style.cursor = 'ns-resize';

        function onMouseMove(ev) {
          if (!resizeState) return;
          // Re-fetch rect live on every move — avoids stale rect + scroll double-counting
          const liveRect = resizeState.col.getBoundingClientRect();
          const relY = ev.clientY - liveRect.top;
          // Snap to nearest 15 min
          const rawHours = relY / PX_PER_HOUR;
          const snapped = snapToQuarter(rawHours);
          // Minimum 15 min duration
          const minEnd = resizeState.startHour + 0.25;
          const newEnd = Math.max(snapped, minEnd);

          if (newEnd !== resizeState.endHour) {
            resizeState.endHour = newEnd;
            resizeState.block.dataset.resized = 'true';
            const newHeight = Math.max((newEnd - resizeState.startHour) * PX_PER_HOUR - 2, PX_PER_QUARTER);
            resizeState.block.style.height = newHeight + 'px';
            // Update time label live
            const timeEl = resizeState.block.querySelector('.schedule-block-time');
            if (timeEl) timeEl.textContent = `${formatHour(resizeState.startHour)} — ${formatHour(newEnd)}`;
          }
        }

        function onMouseUp() {
          document.removeEventListener('mousemove', onMouseMove);
          document.removeEventListener('mouseup', onMouseUp);
          document.body.style.cursor = '';

          if (!resizeState) return;

          const { jobId, startHour, endHour } = resizeState;
          const duration = endHour - startHour;
          resizeState.block.style.opacity = '';
          resizeState.block.style.userSelect = '';

          if (Math.abs(endHour - initialEndHour) >= 0.25) {
            if (['schedule', 'leave', 'blockout', 'meeting'].includes(resizeState.blockType)) {
              const sched = store.getById('schedule', resizeState.scheduleId);
              if (sched) {
                const sDateStr = sched.date || sched.startTime?.split('T')[0] || new Date().toISOString().split('T')[0];
                const pad = n => n.toString().padStart(2, '0');
                const startH = Math.floor(startHour);
                const startM = Math.round((startHour - startH) * 60);
                const endH = Math.floor(endHour);
                const endM = Math.round((endHour - endH) * 60);

                store.update('schedule', resizeState.scheduleId, {
                  startTime: `${sDateStr}T${pad(startH)}:${pad(startM)}`,
                  finishTime: `${sDateStr}T${pad(endH)}:${pad(endM)}`,
                  hours: duration,
                  startHour: startHour,
                  endHour: endHour
                });
                if (jobId) syncJobWithSchedules(jobId);
                showToast(`Time updated to ${formatHour(startHour)} — ${formatHour(endHour)}`, 'success');
              }
            } else {
              // Convert legacy block into proper schedule allocation on resize
              const job = store.getAll('jobs').find(j => j.id === jobId);
              if (job) {
                const sDateStr = job.scheduledDate || new Date().toISOString().split('T')[0];
                const pad = n => n.toString().padStart(2, '0');
                const startH = Math.floor(startHour);
                const startM = Math.round((startHour - startH) * 60);
                const endH = Math.floor(endHour);
                const endM = Math.round((endHour - endH) * 60);

                store.create('schedule', {
                  jobId: job.id,
                  jobNumber: job.number,
                  technicianId: job.technicianId || technicians[0]?.id || '',
                  technicianName: job.technicianName || '',
                  date: sDateStr,
                  startTime: `${sDateStr}T${pad(startH)}:${pad(startM)}`,
                  finishTime: `${sDateStr}T${pad(endH)}:${pad(endM)}`,
                  hours: duration
                });
                syncJobWithSchedules(jobId);
                showToast(`Converted block to independent schedule allocation`, 'success');
              }
            }
            render(); // sync calendar DOM elements with updated database values
          }

          resizeState = null;
        }

        document.addEventListener('mousemove', onMouseMove);
        document.addEventListener('mouseup', onMouseUp);
      });
    });
  }

  function renderActivityCalendar() {
    renderActivityModule(container, {
      getWeekDays,
      viewMode,
      currentDate,
      calendarType,
      isTechnician,
      onNav: (dir) => { currentDate.setDate(currentDate.getDate() + (viewMode === 'week' ? 7 * dir : dir)); render(); },
      onToday: () => { currentDate = new Date(); render(); },
      onViewMode: (v) => { viewMode = v; render(); },
      onCalType: (c) => { calendarType = c; render(); },
    });
  }

  // Listen to store updates to keep schedule in sync with background cloud sync
  const handleStoreChange = () => {
    if (!document.getElementById('calendar-scroll')) {
      store.off('technicians', handleStoreChange);
      store.off('jobs', handleStoreChange);
      store.off('schedule', handleStoreChange);
      document.getElementById('sched-selection-bar')?.remove();
      return;
    }
    render();
  };
  store.on('technicians', handleStoreChange);
  store.on('jobs', handleStoreChange);
  store.on('schedule', handleStoreChange);

  render();

  // v1.3 maps (flag-gated): route planner panel for the viewed day
  if (FLAGS.maps) {
    import('./RoutePanel.js').then(({ mountRoutePanel }) => {
      mountRoutePanel(container, {
        getDate: () => new Date(currentDate),
        getViewMode: () => viewMode,
        getTechnicians: () => technicians.filter(t => visibleTechIds.has(t.id)),
        refresh: () => render(),
      });
    }).catch(() => {});
  }
}

// ── Book Time in Place ───────────────────────────────────────────────────────
// Converts a schedule allocation's time slot directly into logged timesheet
// entries. A task-specific allocation books everything against that task; a
// whole-job allocation splits the slot evenly across the job's incomplete
// leaf tasks (falling back to all tasks, then to a single general entry).
function btipTaskByPath(tasks, path) {
  let node = null, list = tasks || [];
  for (const i of path) {
    node = list[i];
    if (!node) return null;
    list = node.subTasks || node.subPhases || [];
  }
  return node;
}

function btipLeafTasks(tasks, path = [], out = []) {
  (tasks || []).forEach((t, i) => {
    const kids = t.subTasks || t.subPhases || [];
    const p = [...path, i];
    if (kids.length) btipLeafTasks(kids, p, out);
    else out.push({ node: t, path: p });
  });
  return out;
}

// Compute the estimate-weighted split of an allocation's slot into timesheet
// slices with consecutive time windows. Returns { totalHours, startISO, finishISO, slices }
// or null if the slot has no valid span. Shared by single + bulk booking.
function computeBtipSlices(sched, job) {
  const pad = n => String(n).padStart(2, '0');
  const hourToStr = h => `${pad(Math.floor(h))}:${pad(Math.round((h - Math.floor(h)) * 60))}`;
  const startISO = sched.startTime || `${sched.date}T${hourToStr(sched.startHour ?? 9)}`;
  const finishISO = sched.finishTime || `${sched.date}T${hourToStr(sched.endHour ?? ((sched.startHour ?? 9) + 1))}`;
  const totalHours = Math.round(((new Date(finishISO) - new Date(startISO)) / 36e5) * 100) / 100;
  if (!(totalHours > 0)) return null;

  let slices;
  if (sched.taskId) {
    const path = String(sched.taskId).split('-').map(Number);
    const node = btipTaskByPath(job.tasks, path);
    slices = [{ node, path: node ? path : null, hours: totalHours }];
  } else {
    const leaves = btipLeafTasks(job.tasks);
    const active = leaves.filter(l => (l.node.progress || 0) < 100 && l.node.status !== 'Completed');
    const pool = active.length ? active : leaves;
    if (!pool.length) {
      slices = [{ node: null, path: null, hours: totalHours }];
    } else {
      // Proportional to each task's estimatedHours, quantised to 0.25h via
      // largest-remainder so the pieces always sum to the slot exactly.
      const est = pool.map(l => parseFloat(l.node.estimatedHours) || 0);
      const known = est.filter(v => v > 0);
      const fallback = known.length ? known.reduce((a, b) => a + b, 0) / known.length : 1;
      const weights = est.map(v => v > 0 ? v : fallback);
      const wSum = weights.reduce((a, b) => a + b, 0);

      const q = 0.25;
      const totalQ = Math.round(totalHours / q);
      const exact = weights.map(w => totalQ * w / wSum);
      const units = exact.map(Math.floor);
      let left = totalQ - units.reduce((a, b) => a + b, 0);
      exact.map((e, i) => ({ i, frac: e - Math.floor(e) }))
        .sort((a, b) => b.frac - a.frac)
        .forEach(({ i }) => { if (left > 0) { units[i]++; left--; } });

      slices = pool.map((l, i) => ({
        node: l.node, path: l.path,
        est: est[i] > 0 ? est[i] : null,
        hours: Math.round(units[i] * q * 100) / 100,
      })).filter(s => s.hours > 0);
    }
  }

  let cursor = new Date(startISO);
  const fmtLocal = d => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
  slices.forEach(s => {
    s.start = fmtLocal(cursor);
    cursor = new Date(cursor.getTime() + s.hours * 36e5);
    s.finish = fmtLocal(cursor);
  });
  return { totalHours, startISO, finishISO, slices };
}

function createBtipTimesheets(sched, job, slices) {
  slices.forEach(s => {
    store.create('timesheets', {
      jobId: job.id,
      jobNumber: job.number,
      taskId: s.node ? s.node.id : null,
      taskPath: s.path ? s.path.join('-') : null,
      taskName: s.node ? s.node.name : 'General',
      phaseId: s.node ? s.node.id : null,
      phaseName: s.node ? s.node.name : 'General',
      technicianId: sched.technicianId || null,
      technicianName: sched.technicianName || 'Unassigned',
      date: s.start.split('T')[0],
      startTime: s.start,
      finishTime: s.finish,
      description: s.node ? s.node.name : `Scheduled time — ${job.title || job.number}`,
      hours: s.hours,
      status: 'Pending',
    });
  });
  return slices.length;
}

// Book an allocation with no modal (used by bulk book). Returns entries created.
function bookTimeInPlaceSilent(sched, job) {
  const plan = computeBtipSlices(sched, job);
  if (!plan) return 0;
  return createBtipTimesheets(sched, job, plan.slices);
}

function openBookTimeInPlace(sched, job) {
  const plan = computeBtipSlices(sched, job);
  if (!plan) { showToast('This allocation has no valid time span', 'error'); return; }
  const { totalHours, startISO, finishISO, slices } = plan;

  const content = document.createElement('div');
  content.innerHTML = `
    <p style="font-size:13px;color:var(--text-secondary);margin-bottom:12px;">
      Books <strong>${totalHours.toFixed(2)} hrs</strong>
      (${startISO.slice(11, 16)}–${finishISO.slice(11, 16)}) for
      <strong>${escapeHTML(sched.technicianName || 'Unassigned')}</strong> against
      <strong>${escapeHTML(job.number || '')}</strong>${sched.taskId ? '' : ', split across the tasklist'}:
    </p>
    <table class="data-table" style="font-size:13px;width:100%;">
      <thead><tr><th>Task</th><th>Window</th><th style="text-align:right;">Est.</th><th style="text-align:right;">Booked</th></tr></thead>
      <tbody>
        ${slices.map(s => `<tr>
          <td>${escapeHTML(s.node ? s.node.name : 'General (whole job)')}</td>
          <td style="color:var(--text-tertiary);">${s.start.slice(11, 16)}–${s.finish.slice(11, 16)}</td>
          <td style="text-align:right;color:var(--text-tertiary);">${s.est ? s.est.toFixed(2) : '—'}</td>
          <td style="text-align:right;font-weight:600;">${s.hours.toFixed(2)}</td>
        </tr>`).join('')}
      </tbody>
    </table>
    <p style="font-size:11.5px;color:var(--text-tertiary);margin-top:10px;">
      Entries are created as Pending timesheets — adjust or delete them from the job's tasklist or Timesheets.
    </p>`;

  showModal({
    title: 'Book Time in Place',
    content,
    actions: [
      { label: 'Cancel', className: 'btn-secondary', onClick: c => c() },
      {
        label: `Book ${totalHours.toFixed(2)} hrs`, className: 'btn-primary', onClick: c => {
          createBtipTimesheets(sched, job, slices);
          showToast(`Booked ${totalHours.toFixed(2)} hrs across ${slices.length} ${slices.length === 1 ? 'entry' : 'entries'}`, 'success');
          c();
        }
      },
    ],
  });
}
