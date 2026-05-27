// ============================================
// SIMPRO CLONE — SCHEDULE VIEW (v2 — Drag & Drop)
// ============================================

import { store } from '../../data/store.js';
import { router } from '../../router.js';
import { showToast } from '../../components/Notifications.js';
import { escapeHTML } from '../../utils/security.js';
import { showDrawer } from '../../components/Drawer.js';
import { renderActivityCalendar as renderActivityModule } from './ActivityCalendar.js';

export function renderScheduleView(container) {
  container.style.height = '100%';
  container.style.display = 'flex';
  container.style.flexDirection = 'column';
  container.style.overflow = 'hidden';

  const technicians = store.getAll('technicians');
  // jobs read fresh each render — do NOT cache here

  // Role-based access: read who is logged in
  const currentUser = JSON.parse(localStorage.getItem('currentUser') || '{}');
  const isTechnician = currentUser.role === 'technician';

  let viewMode = 'week';
  let calendarType = 'schedule'; // 'schedule' or 'activity'
  let currentDate = new Date();
  const hours = Array.from({ length: 24 }, (_, i) => i); // 00:00–23:00
  let dragState = null;
  let resizeState = null;
  // Technicians are locked to their own view; admins/managers can toggle multiple
  let visibleTechIds = new Set(isTechnician ? [currentUser.id] : technicians.map(t => t.id));
  let contextMenu = null;
  let savedScrollTop = 0;
  let savedScrollLeft = 0;
  let savedSearchResultsScrollTop = 0;
  let isSidebarCollapsed = false;
  let isActionMenuOpen = false;
  let isTechsPanelCollapsed = true;
  let isJobsPanelCollapsed = true;
  let isSearchActive = false;
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

  document.addEventListener('click', closeContextMenu);

  function handleDocumentClick(e) {
    const searchInput = document.getElementById('job-search-input');
    const searchSection = document.getElementById('job-search-section-wrapper');
    if (isSearchActive && searchInput && searchSection) {
      if (!searchInput.contains(e.target) && !searchSection.contains(e.target)) {
        isSearchActive = false;
        isJobsPanelCollapsed = true;
        render();
      }
    }
  }
  document.addEventListener('click', handleDocumentClick);

  function getWeekDays() {
    const start = new Date(currentDate);
    if (viewMode === 'day') return [new Date(currentDate)];
    start.setDate(start.getDate() - start.getDay() + 1); // Monday
    return Array.from({ length: 5 }, (_, i) => {
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
              technicianId: s.technicianId,
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
      if (!job || job.status === 'Completed' || job.status === 'Invoiced') return;

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
             technicianId: s.technicianId,
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
    jobs.filter(j => j.scheduledDate && !jobIdsWithSchedules.has(j.id) && j.status !== 'Completed' && j.status !== 'Invoiced')
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
                  technicianId: t.id,
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
                technicianId: job.technicianId,
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

  function render() {
    saveScroll();
    const days = getWeekDays();
    const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

    if (calendarType === 'activity') {
      renderActivityCalendar();
      return;
    }

    const blocks = getScheduleBlocks();
    const visibleTechs = technicians.filter(t => visibleTechIds.has(t.id));
    const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
    const menuBg = isDark ? '#1e293b' : '#ffffff';

    container.innerHTML = `
      <div class="page-header">
        <h1>Schedule</h1>
        <div class="page-header-actions">
          <div class="flex gap-sm items-center">
            <button class="btn btn-secondary btn-sm" id="btn-prev"><span class="material-icons-outlined">chevron_left</span></button>
            <button class="btn btn-secondary btn-sm" id="btn-today">Today</button>
            <button class="btn btn-secondary btn-sm" id="btn-next"><span class="material-icons-outlined">chevron_right</span></button>
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

      <!-- Calendar Grid + Right Sidebar -->
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

          <!-- Right Sidebar (For Non-Technicians) -->
          ${!isTechnician ? `
            ${isSidebarCollapsed ? `
              <!-- Collapsed Sidebar -->
              <div style="width:48px; border-left:1px solid var(--border-color); display:flex; flex-direction:column; align-items:center; background:var(--card-bg); padding:16px 0; flex-shrink:0;">
                <button class="btn btn-ghost btn-icon btn-sm" id="btn-toggle-sidebar" title="Expand Sidebar" style="color:var(--text-secondary); width:32px; height:32px; border-radius:50%; display:flex; align-items:center; justify-content:center;">
                  <span class="material-icons-outlined" style="font-size:20px">chevron_left</span>
                </button>
                
                <!-- Action Button Trigger (Plus Icon) -->
                <div style="margin-top:12px; position:relative; display:flex; flex-direction:column; align-items:center;">
                  <button class="btn btn-primary btn-icon btn-sm" id="btn-action-menu-trigger" title="Add to Schedule" style="width:32px; height:32px; border-radius:50%; display:flex; align-items:center; justify-content:center; padding:0">
                    <span class="material-icons-outlined" style="font-size:20px">add</span>
                  </button>
                  ${isActionMenuOpen ? `
                    <!-- Action Dropdown Menu -->
                    <div id="action-dropdown-menu" class="sidebar-collapsed-flyout" style="position:absolute; top:0; right:42px; width:220px; z-index:100; display:flex; flex-direction:column; overflow:hidden;">
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

                <div style="margin-top:20px; color:var(--text-tertiary); display:flex; flex-direction:column; align-items:center; gap:16px">
                  <span class="material-icons-outlined" title="Visible Technicians" style="font-size:20px">people</span>
                  <div style="display:flex; flex-direction:column; gap:6px; align-items:center">
                    ${technicians.filter(t => visibleTechIds.has(t.id)).map(t => `
                      <div style="width:6px; height:6px; border-radius:50%; background:${t.color}" title="${t.name}"></div>
                    `).join('')}
                  </div>
                </div>
              </div>
            ` : `
              <!-- Expanded Sidebar -->
              <div style="width:280px; border-left:1px solid var(--border-color); display:flex; flex-direction:column; background:var(--card-bg); overflow:hidden; height:100%; flex-shrink:0;">
                
                <!-- Action Button Trigger + Search + Collapse Sidebar -->
                <div style="padding:12px 16px; border-bottom:1px solid var(--border-color); display:flex; align-items:center; gap:8px; position:relative;">
                  <!-- Circular plus action button -->
                  <button class="btn btn-primary btn-icon btn-sm" id="btn-action-menu-trigger" title="Add to Schedule" style="width:32px; height:32px; border-radius:50%; display:flex; align-items:center; justify-content:center; padding:0; flex-shrink:0;">
                    <span class="material-icons-outlined" style="font-size:20px">add</span>
                  </button>
                  
                  <!-- Inline search input -->
                  <div class="topbar-search" style="flex: 1; max-width: 100%; position: relative; height: 32px; display: flex; align-items: center; min-width: 0;">
                    <span class="material-icons-outlined search-icon" style="position:absolute; left:8px; top:50%; transform:translateY(-50%); font-size:16px; color:var(--text-tertiary);">search</span>
                    <input type="text" id="job-search-input" value="${jobSearchQuery}" placeholder="Search jobs/tasks..." style="width:100%; padding:6px 8px 6px 26px; border:1px solid var(--border-color); border-radius:var(--border-radius); font-size:var(--font-size-sm); background:var(--content-bg); color:var(--text-primary); outline:none; transition:all var(--transition-fast);">
                  </div>

                  <!-- Collapse sidebar button -->
                  <button class="btn btn-ghost btn-icon btn-sm" id="btn-toggle-sidebar" title="Collapse Sidebar" style="color:var(--text-secondary); width:32px; height:32px; border-radius:50%; display:flex; align-items:center; justify-content:center; padding:0; flex-shrink:0;">
                    <span class="material-icons-outlined" style="font-size:20px">chevron_right</span>
                  </button>

                  ${isActionMenuOpen ? `
                    <!-- Action Dropdown Menu -->
                    <div id="action-dropdown-menu" class="sidebar-collapsed-flyout" style="position:absolute; top:48px; left:16px; width:220px; z-index:100; display:flex; flex-direction:column; overflow:hidden;">
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
                <!-- Job & Task Search Module -->
                <div id="job-search-section-wrapper" style="padding:16px; border-bottom:1px solid var(--border-color); display:${isSearchActive ? 'flex' : 'none'}; flex-direction:column; gap:12px; ${isJobsPanelCollapsed ? 'flex:0 0 auto;' : 'flex:1; min-height:0; overflow:hidden;'}">
                  <div style="display:flex; justify-content:space-between; align-items:center;">
                    <h4 style="font-size:var(--font-size-sm); margin:0; display:flex; align-items:center; gap:6px;">
                      <span class="material-icons-outlined" style="font-size:16px;">search</span> Job & Task Search
                    </h4>
                    <button class="btn btn-ghost btn-icon btn-sm" id="btn-toggle-jobs-panel" title="${isJobsPanelCollapsed ? 'Expand' : 'Collapse'}" style="color:var(--text-secondary); width:24px; height:24px; border-radius:50%; display:flex; align-items:center; justify-content:center; padding:0">
                      <span class="material-icons-outlined" style="font-size:18px">${isJobsPanelCollapsed ? 'expand_more' : 'expand_less'}</span>
                    </button>
                  </div>
                  ${!isJobsPanelCollapsed ? `
                    <div id="job-search-results" style="flex:1; overflow-y:auto; display:flex; flex-direction:column; gap:8px; padding-right:4px; margin-top:4px;">
                      ${(() => {
                        const allJobs = store.getAll('jobs');
                        const query = jobSearchQuery.trim().toLowerCase();
                        const matchingJobs = allJobs.filter(j => {
                          if (j.status === 'Completed' || j.status === 'Invoiced') return false;
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
                          return `
                            <div style="font-size:11px; color:var(--text-tertiary); text-align:center; padding:16px;">
                              No matching active jobs found.
                            </div>
                          `;
                        }

                        return matchingJobs.map(j => {
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
                      })()}
                    </div>
                  ` : ''}
                </div>

                <!-- Visible Technicians Module -->
                <div style="padding:16px; border-bottom:1px solid var(--border-color); display:flex; flex-direction:column; gap:10px;">
                  <div style="display:flex; justify-content:space-between; align-items:center;">
                    <h4 style="font-size:var(--font-size-sm); margin:0; display:flex; align-items:center; gap:6px;">
                      <span class="material-icons-outlined" style="font-size:16px;">people</span> Visible Technicians
                    </h4>
                    <button class="btn btn-ghost btn-icon btn-sm" id="btn-toggle-techs" title="${isTechsPanelCollapsed ? 'Expand' : 'Collapse'}" style="color:var(--text-secondary); width:24px; height:24px; border-radius:50%; display:flex; align-items:center; justify-content:center; padding:0">
                      <span class="material-icons-outlined" style="font-size:18px">${isTechsPanelCollapsed ? 'expand_more' : 'expand_less'}</span>
                    </button>
                  </div>
                  ${!isTechsPanelCollapsed ? `
                    <div style="display:flex; flex-direction:column; gap:10px;">
                      ${technicians.map(t => `
                        <label style="display:flex; align-items:center; gap:8px; font-size:var(--font-size-sm); cursor:pointer;">
                          <input type="checkbox" class="tech-visibility-checkbox" value="${t.id}" ${visibleTechIds.has(t.id) ? 'checked' : ''}>
                          <div style="width:10px; height:10px; border-radius:50%; background:${t.color};"></div>
                          <span style="color:var(--text-primary); font-weight:500;">${t.name}</span>
                        </label>
                      `).join('')}
                    </div>
                  ` : ''}
                </div>
              </div>
            `}
          ` : ''}

        </div>
      </div>
    `;

    bindEvents();
    bindDragAndDrop(days);
    bindResize();
    restoreScroll();
  }

  function getUnscheduledJobs() {
    const jobs = store.getAll('jobs');
    return jobs.filter(j => (!j.scheduledDate || !j.technicianId) && j.status !== 'Completed' && j.status !== 'Invoiced');
  }

  function handleAddJobSchedule() {
    const unscheduledJobs = getUnscheduledJobs();
    const technicians = store.getAll('technicians');

    if (unscheduledJobs.length === 0) {
      showToast('No unscheduled jobs available.', 'info');
      return;
    }

    showDrawer({
      title: 'Schedule Unscheduled Job',
      content: `
        <form id="drawer-add-job-form" style="display:flex; flex-direction:column; gap:16px;">
          <div class="form-group">
            <label class="form-label">Select Job <span style="color:var(--color-danger)">*</span></label>
            <select class="form-select" name="jobId" required>
              ${unscheduledJobs.map(j => `<option value="${j.id}">${j.number} — ${escapeHTML(j.customerName)} (${escapeHTML(j.title)})</option>`).join('')}
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

            const job = store.getById('jobs', jobId);
            if (!job) {
              showToast('Selected job not found or has been deleted.', 'error');
              return;
            }
            const tech = store.getById('technicians', techId);

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
              hours: duration
            });

            store.update('jobs', job.id, {
              scheduledDate: dateStr,
              startHour: startHour,
              technicianId: techId
            });

            showToast(`Scheduled Job ${job.number} to ${tech?.name}`, 'success');
            c();
            render();
          }
        }
      ]
    });
  }

  function handleAddLeave() {
    const technicians = store.getAll('technicians');

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
              <input type="number" class="form-input" name="duration" min="0.5" step="0.5" value="8" required />
            </div>
          </div>
          <div class="form-group">
            <label class="form-label">Leave Type / Notes <span style="color:var(--color-danger)">*</span></label>
            <select class="form-select" name="notes" required>
              <option value="Annual Leave">Annual Leave</option>
              <option value="Sick Leave">Sick Leave</option>
              <option value="Personal Leave">Personal Leave</option>
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
              type: 'leave',
              technicianId: techId,
              technicianName: tech?.name || '',
              date: dateStr,
              startTime: startTimeISO,
              finishTime: finishTimeISO,
              hours: duration,
              notes: notes
            });

            showToast(`Leave booked for ${tech?.name}`, 'success');
            c();
            render();
          }
        }
      ]
    });
  }

  function handleAddBlockout() {
    const technicians = store.getAll('technicians');

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
    const technicians = store.getAll('technicians');

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
    return techBlocks
      .filter(b => b.dayIdx === dayIdx)
      .map(b => {
        const top = b.startHour * PX_PER_HOUR;
        const height = Math.max((b.endHour - b.startHour) * PX_PER_HOUR - 2, PX_PER_QUARTER);
        let borderColor = priorityBorders[b.priority] || color;
        let background = `${color}12`;
        let textColor = color;

        // Custom styling overrides for leave, blockout, meeting
        if (b.type === 'leave') {
          borderColor = '#EF4444'; // Red for leave
          background = 'rgba(239, 68, 68, 0.1)';
          textColor = '#EF4444';
        } else if (b.type === 'blockout') {
          borderColor = '#6B7280'; // Gray for blockout
          background = 'rgba(107, 114, 128, 0.1)';
          textColor = '#4B5563';
        } else if (b.type === 'meeting') {
          borderColor = '#3B82F6'; // Blue for meetings
          background = 'rgba(59, 130, 246, 0.1)';
          textColor = '#2563EB';
        }

        const timeLabel = `${formatHour(b.startHour)} — ${formatHour(b.endHour)}`;
        return `
          <div class="schedule-block" draggable="true"
            data-block-job-id="${b.jobId || ''}"
            data-schedule-id="${b.id}"
            data-block-type="${b.type}"
            data-start="${b.startHour}"
            data-end="${b.endHour}"
            style="
              top:${top}px;
              height:${height}px;
              background:${background};
              border-color:${borderColor};
              color:${textColor};
              pointer-events:auto;
            ">
            <div style="pointer-events:none;font-weight:700;font-size:11px;line-height:1.3;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${b.jobNumber}</div>
            ${height > 20 ? `<div style="pointer-events:none;font-size:10px;opacity:0.9;font-weight:500;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${b.customerName}</div>` : ''}
            ${height > 36 ? `<div class="schedule-block-time" style="pointer-events:none;font-size:9px;opacity:0.7;margin-top:2px">${timeLabel}</div>` : ''}
            <div class="schedule-resize-handle" data-block-job-id="${b.jobId || ''}" data-schedule-id="${b.id}" data-block-type="${b.type}" data-start="${b.startHour}" data-end="${b.endHour}" title="Drag to resize"></div>
          </div>
        `;
      }).join('');
  }

  function bindEvents() {
    container.querySelector('#btn-prev')?.addEventListener('click', () => {
      currentDate.setDate(currentDate.getDate() - (viewMode === 'week' ? 7 : 1));
      render();
    });
    container.querySelector('#btn-next')?.addEventListener('click', () => {
      currentDate.setDate(currentDate.getDate() + (viewMode === 'week' ? 7 : 1));
      render();
    });
    container.querySelector('#btn-today')?.addEventListener('click', () => {
      currentDate = new Date();
      render();
    });
    container.querySelectorAll('[data-view]').forEach(btn => {
      btn.addEventListener('click', () => { viewMode = btn.dataset.view; render(); });
    });
    container.querySelectorAll('[data-cal]').forEach(btn => {
      btn.addEventListener('click', () => { calendarType = btn.dataset.cal; render(); });
    });

    container.querySelectorAll('.tech-visibility-checkbox').forEach(cb => {
      cb.addEventListener('change', (e) => {
        if (e.target.checked) visibleTechIds.add(e.target.value);
        else visibleTechIds.delete(e.target.value);
        render();
      });
    });

    container.querySelector('#btn-toggle-sidebar')?.addEventListener('click', () => {
      isSidebarCollapsed = !isSidebarCollapsed;
      render();
    });

    container.querySelector('#btn-toggle-techs')?.addEventListener('click', () => {
      isTechsPanelCollapsed = !isTechsPanelCollapsed;
      if (!isTechsPanelCollapsed) {
        isJobsPanelCollapsed = true;
      }
      render();
    });

    container.querySelector('#btn-toggle-jobs-panel')?.addEventListener('click', () => {
      isJobsPanelCollapsed = !isJobsPanelCollapsed;
      if (!isJobsPanelCollapsed) {
        isTechsPanelCollapsed = true;
      }
      render();
    });

    const searchInput = container.querySelector('#job-search-input');
    if (searchInput) {
      if (isSearchActive) {
        searchInput.focus();
        const len = searchInput.value.length;
        searchInput.setSelectionRange(len, len);
      }
      
      searchInput.addEventListener('focus', () => {
        if (!isSearchActive) {
          isSearchActive = true;
          isJobsPanelCollapsed = false;
          isTechsPanelCollapsed = true;
          render();
        }
      });

      searchInput.addEventListener('click', (e) => {
        e.stopPropagation();
        if (!isSearchActive) {
          isSearchActive = true;
          isJobsPanelCollapsed = false;
          isTechsPanelCollapsed = true;
          render();
        }
      });

      searchInput.addEventListener('input', (e) => {
        jobSearchQuery = e.target.value;
        render();
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

        if (isJobBlock) {
          contextMenu.innerHTML = `
            <button class="dropdown-item" id="ctx-view"><span class="material-icons-outlined" style="font-size:16px;margin-right:8px">visibility</span> View Job</button>
            <button class="dropdown-item text-danger" id="ctx-unschedule"><span class="material-icons-outlined" style="font-size:16px;margin-right:8px">event_busy</span> Unschedule</button>
          `;
          document.body.appendChild(contextMenu);

          contextMenu.querySelector('#ctx-view').addEventListener('click', () => {
            closeContextMenu();
            const jobId = block.dataset.blockJobId;
            router.navigate(`/jobs/${jobId}`);
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
              store.update('jobs', jobId, { scheduledDate: null, technicianId: null });
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
        const rect = el.getBoundingClientRect();
        dragState = {
          type: 'existing',
          blockType: el.dataset.blockType,
          scheduleId: el.dataset.scheduleId,
          jobId: el.dataset.blockJobId,
          startHour: parseFloat(el.dataset.start),
          endHour: parseFloat(el.dataset.end),
          offsetY: e.clientY - rect.top,
        };
        e.dataTransfer.effectAllowed = 'move';
        el.style.opacity = '0.4';
      });
      el.addEventListener('dragend', () => {
        el.style.opacity = '1';
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
            store.update('schedule', dragState.scheduleId, {
              technicianId: targetTechId,
              technicianName: tech?.name || '',
              date: localDateStr,
              startTime: startTimeStr,
              finishTime: finishTimeStr,
              hours: duration
            });
            showToast(`Moved ${job.number} for ${tech?.name} to ${localDateStr}`, 'success');
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
            showToast(`Assigned ${job.number} to ${tech?.name}`, 'success');
          }
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
            if (resizeState.blockType === 'schedule') {
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
                  hours: duration
                });
                showToast(`Time updated to ${formatHour(startHour)} — ${formatHour(endHour)}`, 'success');
              }
            } else {
              // Legacy update
              const job = store.getAll('jobs').find(j => j.id === jobId);
              if (job) {
                let updatedTechs = job.technicians || [];
                if (updatedTechs.length > 0) {
                  updatedTechs = updatedTechs.map(t => ({ ...t, hours: duration }));
                }
                store.update('jobs', jobId, {
                  startHour,
                  estimatedHours: parseFloat(duration.toFixed(4)),
                  technicians: updatedTechs.length > 0 ? updatedTechs : job.technicians,
                });
                showToast(`Job time updated`, 'success');
              }
            }
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

  render();
}
