// ============================================
// SIMPRO CLONE — SCHEDULE VIEW (v2 — Drag & Drop)
// ============================================

import { store } from '../../data/store.js';
import { router } from '../../router.js';
import { showToast } from '../../components/Notifications.js';
import { escapeHTML } from '../../utils/security.js';
import { showDrawer } from '../../components/Drawer.js';

export function renderScheduleView(container) {
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
  }

  function restoreScroll() {
    const el = document.getElementById('calendar-scroll');
    if (el) { el.scrollTop = savedScrollTop; el.scrollLeft = savedScrollLeft; }
  }

  function closeContextMenu() {
    if (contextMenu) {
      contextMenu.remove();
      contextMenu = null;
    }
  }

  document.addEventListener('click', closeContextMenu);

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
            customerName: job.customerName,
            title: job.title,
            technicianId: s.technicianId,
            dayIdx,
            startHour,
            endHour,
            status: job.status,
            priority: job.priority,
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
      <div class="card" style="overflow:hidden">
        <div style="display:flex;height:calc(100vh - 160px);overflow:hidden">
          
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
          <div style="width:280px; border-left:1px solid var(--border-color); display:flex; flex-direction:column; background:var(--card-bg); overflow-y:auto; flex-shrink:0;">
            
            <!-- Visible Technicians Module -->
            <div style="padding:16px; border-bottom:1px solid var(--border-color);">
              <h4 style="font-size:var(--font-size-sm); margin-bottom:12px; display:flex; align-items:center; gap:6px;">
                <span class="material-icons-outlined" style="font-size:16px;">people</span> Visible Technicians
              </h4>
              <div style="display:flex; flex-direction:column; gap:10px;">
                ${technicians.map(t => `
                  <label style="display:flex; align-items:center; gap:8px; font-size:var(--font-size-sm); cursor:pointer;">
                    <input type="checkbox" class="tech-visibility-checkbox" value="${t.id}" ${visibleTechIds.has(t.id) ? 'checked' : ''}>
                    <div style="width:10px; height:10px; border-radius:50%; background:${t.color};"></div>
                    <span style="color:var(--text-primary); font-weight:500;">${t.name}</span>
                  </label>
                `).join('')}
              </div>
            </div>

            <!-- Unscheduled Jobs Module -->
            <div style="padding:16px;">
              <h4 style="font-size:var(--font-size-sm); margin-bottom:12px; display:flex; align-items:center; gap:6px;">
                <span class="material-icons-outlined" style="font-size:16px;">pending_actions</span> Unscheduled Jobs
              </h4>
              <div id="unscheduled-drawer" style="display:flex; flex-direction:column; gap:8px;">
                ${getUnscheduledJobs().map(j => `
                  <div class="unscheduled-job" draggable="true" data-job-id="${j.id}" data-job-number="${j.number}" data-customer="${j.customerName}" data-title="${j.title}" data-hours="${j.estimatedHours || 2}" data-priority="${j.priority}" style="padding:10px; background:var(--content-bg); border:1px solid var(--border-color); border-radius:4px; cursor:grab; transition:all 0.2s;">
                    <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:4px;">
                      <span class="font-medium" style="font-size:var(--font-size-sm)">${j.number}</span>
                      <span class="badge ${j.priority === 'High' || j.priority === 'Urgent' ? 'badge-danger' : 'badge-neutral'}" style="font-size:9px">${j.priority}</span>
                    </div>
                    <div class="text-secondary" style="font-size:var(--font-size-xs); white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">${j.customerName}</div>
                  </div>
                `).join('') || '<span class="text-secondary" style="font-size:var(--font-size-sm);">All jobs are scheduled</span>'}
              </div>
            </div>
          </div>
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



  function renderBlocks(techBlocks, dayIdx, color) {
    const priorityBorders = { 'Urgent': '#EF4444', 'High': '#F59E0B' };
    return techBlocks
      .filter(b => b.dayIdx === dayIdx)
      .map(b => {
        const top = b.startHour * PX_PER_HOUR;
        const height = Math.max((b.endHour - b.startHour) * PX_PER_HOUR - 2, PX_PER_QUARTER);
        const borderColor = priorityBorders[b.priority] || color;
        const timeLabel = `${formatHour(b.startHour)} — ${formatHour(b.endHour)}`;
        return `
          <div class="schedule-block" draggable="true"
            data-block-job-id="${b.jobId}"
            data-schedule-id="${b.id}"
            data-block-type="${b.type}"
            data-start="${b.startHour}"
            data-end="${b.endHour}"
            style="
              top:${top}px;
              height:${height}px;
              background:${color}12;
              border-color:${borderColor};
              color:${color};
              pointer-events:auto;
            ">
            <div style="pointer-events:none;font-weight:600;font-size:11px;line-height:1.3;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${b.jobNumber}</div>
            ${height > 20 ? `<div style="pointer-events:none;font-size:10px;opacity:0.8;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${b.customerName}</div>` : ''}
            ${height > 36 ? `<div class="schedule-block-time" style="pointer-events:none;font-size:9px;opacity:0.6;margin-top:2px">${timeLabel}</div>` : ''}
            <div class="schedule-resize-handle" data-block-job-id="${b.jobId}" data-schedule-id="${b.id}" data-block-type="${b.type}" data-start="${b.startHour}" data-end="${b.endHour}" title="Drag to resize"></div>
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



    // Click existing blocks to navigate to job or show drawer
    container.querySelectorAll('.schedule-block').forEach(block => {
      block.addEventListener('click', (e) => {
        if (e.defaultPrevented) return; // skip if drag/resize happened
        if (block.dataset.resized === 'true') { block.dataset.resized = 'false'; return; }

        const jobId = block.dataset.blockJobId;
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
      });
      block.addEventListener('contextmenu', (e) => {
        e.preventDefault();
        closeContextMenu();
        const jobId = block.dataset.blockJobId;
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

        contextMenu.innerHTML = `
          <button class="dropdown-item" id="ctx-view"><span class="material-icons-outlined" style="font-size:16px;margin-right:8px">visibility</span> View Job</button>
          <button class="dropdown-item text-danger" id="ctx-unschedule"><span class="material-icons-outlined" style="font-size:16px;margin-right:8px">event_busy</span> Unschedule</button>
        `;
        document.body.appendChild(contextMenu);

        contextMenu.querySelector('#ctx-view').addEventListener('click', () => {
          closeContextMenu();
          router.navigate(`/jobs/${jobId}`);
        });

        contextMenu.querySelector('#ctx-unschedule').addEventListener('click', () => {
          closeContextMenu();
          const job = jobs.find(j => j.id === jobId);
          if (job) {
            store.update('jobs', jobId, { scheduledDate: null });
            showToast('Job unscheduled', 'success');
            render();
          }
        });
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
        const rect = el.getBoundingClientRect();
        dragState = {
          type: 'unscheduled',
          jobId: el.dataset.jobId,
          jobNumber: el.dataset.jobNumber,
          customerName: el.dataset.customer,
          title: el.dataset.title,
          hours: parseInt(el.dataset.hours) || 2,
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
              hours: duration
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
    const days = getWeekDays();
    const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

    const currentUser = JSON.parse(localStorage.getItem('currentUser') || '{}');
    const activities = store.getAll('activities').filter(a => a.assignedToId === currentUser.id);

    container.innerHTML = `
      <div class="page-header">
        <h1>Activity Calendar</h1>
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
             <!-- Spacer -->
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
      <div class="card" style="height:calc(100vh - 160px); display:flex; flex-direction:column;">
        <div style="padding: 15px; border-bottom: 1px solid var(--border-color); display:flex; justify-content:space-between; align-items:center;">
          <h3 style="margin:0;">My Activities</h3>
          <button class="btn btn-primary btn-sm" id="btn-new-activity">New Activity</button>
        </div>
        <div style="flex:1; overflow-y:auto; padding: 15px;">
          ${days.map(day => {
      const dateStr = day.toISOString().split('T')[0];
      const dayActs = activities.filter(a => a.date === dateStr);
      return `
              <div style="margin-bottom: 20px;">
                <h4 style="margin: 0 0 10px 0; border-bottom: 1px solid var(--border-color); padding-bottom: 5px;">${day.toLocaleDateString('en-AU', { weekday: 'long', day: 'numeric', month: 'short' })}</h4>
                ${dayActs.length === 0 ? '<p style="color:var(--text-tertiary); font-size: 13px; margin: 0;">No activities.</p>' : `
                  <div style="display:flex; flex-direction:column; gap:8px;">
                    ${dayActs.map(a => `
                      <div style="background:var(--bg-surface); border:1px solid var(--border-color); border-radius:6px; padding:12px;">
                        <div style="display:flex; justify-content:space-between; margin-bottom:5px;">
                          <strong style="color:var(--text-primary);">${escapeHTML(a.title)}</strong>
                          <span style="font-size:12px; color:var(--text-secondary);">${a.time ? escapeHTML(a.time) : ''}</span>
                        </div>
                        ${a.linkedTo ? `<div style="font-size:12px; color:var(--text-secondary); margin-bottom:5px;">Linked to: ${escapeHTML(a.linkedTo)}</div>` : ''}
                        ${a.notes ? `<div style="font-size:13px;">${escapeHTML(a.notes)}</div>` : ''}
                      </div>
                    `).join('')}
                  </div>
                `}
              </div>
            `;
    }).join('')}
        </div>
      </div>
    `;

    bindEvents(); // Re-bind top toolbar events

    container.querySelector('#btn-new-activity')?.addEventListener('click', () => {
      const title = prompt('Activity Title:');
      if (!title) return;
      const date = prompt('Date (YYYY-MM-DD):', new Date().toISOString().split('T')[0]);
      if (!date) return;
      const time = prompt('Time (e.g. 10:00 AM):', '');
      const linkedTo = prompt('Linked To (Job/Customer Name):', '');
      const notes = prompt('Notes:', '');

      store.create('activities', {
        title, date, time, linkedTo, notes, assignedToId: currentUser.id
      });
      showToast('Activity added', 'success');
      render();
    });
  }

  render();
}
