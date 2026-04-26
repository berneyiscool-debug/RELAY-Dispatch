// ============================================
// SIMPRO CLONE — SCHEDULE VIEW (v2 — Drag & Drop)
// ============================================

import { store } from '../../data/store.js';
import { router } from '../../router.js';
import { showToast } from '../../components/Notifications.js';
import { escapeHTML } from '../../utils/security.js';

export function renderScheduleView(container) {
  const technicians = store.getAll('technicians');
  const jobs = store.getAll('jobs');

  let viewMode = 'week';
  let calendarType = 'schedule'; // 'schedule' or 'activity'
  let currentDate = new Date();
  const hours = Array.from({ length: 12 }, (_, i) => i + 7); // 7am–6pm
  let dragState = null;
  let selectedTechId = 'all';
  let contextMenu = null;

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

  // Build schedule blocks from jobs
  function getScheduleBlocks() {
    const blocks = [];
    const days = getWeekDays();

    jobs.filter(j => j.scheduledDate && j.status !== 'Completed' && j.status !== 'Invoiced')
      .forEach(job => {
        const jobDate = new Date(job.scheduledDate);
        days.forEach((day, dayIdx) => {
          if (jobDate.toDateString() === day.toDateString()) {
            const startHour = job.startHour || (7 + (Math.abs(hashStr(job.id)) % 6)); // use saved or deterministic
            
            if (job.technicians && job.technicians.length > 0) {
              job.technicians.forEach(t => {
                const duration = Math.min(t.hours || 2, 5);
                blocks.push({
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
              const duration = Math.min(job.estimatedHours || 2, 5);
              blocks.push({
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

    // Add stored schedule blocks
    // Add stored schedule blocks (legacy support, but we should scope to week if possible)
    const storedBlocks = store.getAll('schedule');
    storedBlocks.forEach(b => {
      // Avoid cross-week locking by matching the scheduled date if available
      if (b.date) {
        const bDate = new Date(b.date);
        const dayMatch = days.findIndex(d => d.toDateString() === bDate.toDateString());
        if (dayMatch !== -1 && !blocks.find(existing => existing.jobId === b.jobId && existing.dayIdx === dayMatch)) {
          blocks.push({ ...b, dayIdx: dayMatch });
        }
      } else {
        // Fallback for old data without date
        if (!blocks.find(existing => existing.jobId === b.jobId && existing.dayIdx === b.dayOffset)) {
          blocks.push({ ...b, dayIdx: b.dayOffset });
        }
      }
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
    const days = getWeekDays();
    const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

    if (calendarType === 'activity') {
      renderActivityCalendar();
      return;
    }

    const blocks = getScheduleBlocks();

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
            <select class="form-select form-select-sm" id="schedule-tech-filter" style="min-width:180px">
              <option value="all">All Technicians</option>
              ${technicians.map(t => `<option value="${t.id}" ${selectedTechId === t.id ? 'selected' : ''}>${t.name}</option>`).join('')}
            </select>
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

      <!-- Unscheduled jobs drawer -->
      <div class="card" style="margin-bottom:var(--space-base)" id="unscheduled-section">
        <div class="card-header" style="padding:8px 16px;cursor:pointer" id="unscheduled-toggle">
          <h4 style="font-size:var(--font-size-sm)"><span class="material-icons-outlined" style="font-size:16px;vertical-align:middle">pending_actions</span> Unscheduled Jobs</h4>
          <span class="material-icons-outlined" style="font-size:16px" id="unscheduled-chevron">expand_more</span>
        </div>
        <div id="unscheduled-drawer" style="padding:8px 16px;display:flex;flex-wrap:wrap;gap:8px;border-top:1px solid var(--border-color)">
          ${getUnscheduledJobs().map(j => `
            <div class="unscheduled-job" draggable="true" data-job-id="${j.id}" data-job-number="${j.number}" data-customer="${j.customerName}" data-title="${j.title}" data-hours="${j.estimatedHours || 2}" data-priority="${j.priority}">
              <span class="material-icons-outlined" style="font-size:14px;color:var(--text-tertiary)">drag_indicator</span>
              <span class="font-medium" style="font-size:var(--font-size-sm)">${j.number}</span>
              <span class="text-secondary" style="font-size:var(--font-size-xs)">${j.customerName}</span>
              <span class="badge ${j.priority === 'High' || j.priority === 'Urgent' ? 'badge-danger' : 'badge-neutral'}" style="font-size:9px">${j.priority}</span>
            </div>
          `).join('') || '<span class="text-secondary" style="font-size:var(--font-size-sm);padding:4px">All jobs are scheduled</span>'}
        </div>
      </div>

      <!-- Calendar Grid -->
      <div class="card" style="overflow:hidden">
        <div style="display:flex;height:calc(100vh - 310px);overflow:hidden">
          <!-- Calendar -->
          <div style="flex:1;overflow:auto" id="calendar-scroll">
            ${selectedTechId === 'all' ? `
              <!-- Top headers: Technicians -->
              <div style="display:grid;grid-template-columns:80px repeat(${technicians.length}, minmax(160px, 1fr));border-bottom:1px solid var(--border-color);position:sticky;top:0;background:var(--card-bg);z-index:10;width:fit-content;min-width:100%">
                <!-- Sticky Top-Left corner for Time/Date header -->
                <div style="height:44px;border-right:1px solid var(--border-color);background:var(--card-bg);position:sticky;left:0;z-index:11;display:flex;align-items:center;justify-content:center;font-size:var(--font-size-xs);color:var(--text-tertiary);font-weight:600;text-transform:uppercase">
                  Time
                </div>
                ${technicians.map(tech => `
                  <div style="height:44px;display:flex;flex-direction:column;align-items:center;justify-content:center;border-right:1px solid var(--border-color);background:var(--card-bg);">
                    <div style="font-size:var(--font-size-sm);font-weight:600;display:flex;align-items:center;gap:6px">
                      <div style="width:8px;height:8px;border-radius:50%;background:${tech.color};flex-shrink:0"></div>
                      <span style="white-space:nowrap;overflow:hidden;text-overflow:ellipsis;max-width:130px">${tech.name}</span>
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
                  <div style="display:grid;grid-template-columns:80px repeat(${technicians.length}, minmax(160px, 1fr));border-bottom:2px solid var(--border-color);width:fit-content;min-width:100%">

                    <!-- Hours Column (Sticky Left) -->
                    <div style="background:var(--card-bg);position:sticky;left:0;z-index:2;border-right:1px solid var(--border-color)">
                      ${hours.map(h => `
                        <div style="height:48px;border-bottom:1px solid var(--border-color);padding:4px 8px;font-size:var(--font-size-xs);color:var(--text-tertiary);text-align:right;display:flex;align-items:flex-start;justify-content:flex-end">
                          ${h > 12 ? h - 12 : h}${h >= 12 ? 'pm' : 'am'}
                        </div>
                      `).join('')}
                    </div>

                    <!-- Technician Columns for this Day -->
                    ${technicians.map(tech => {
                      const techBlocks = blocks.filter(b => b.technicianId === tech.id);
                      return `
                        <div class="schedule-day-col" style="position:relative;border-right:1px solid var(--border-color)" data-tech="${tech.id}" data-day="${dayIdx}">
                          ${hours.map(h => `<div class="schedule-hour-slot" style="height:48px;border-bottom:1px solid var(--border-color)" data-hour="${h}"></div>`).join('')}
                          ${renderBlocks(techBlocks, dayIdx, tech.color)}
                        </div>
                      `;
                    }).join('')}
                  </div>
                `;
              }).join('')}
            ` : `
              <!-- Top headers: Days -->
              <div style="display:grid;grid-template-columns:80px repeat(${days.length}, minmax(160px, 1fr));border-bottom:1px solid var(--border-color);position:sticky;top:0;background:var(--card-bg);z-index:10;width:fit-content;min-width:100%">
                <!-- Sticky Top-Left corner for Time/Date header -->
                <div style="height:44px;border-right:1px solid var(--border-color);background:var(--card-bg);position:sticky;left:0;z-index:11;display:flex;align-items:center;justify-content:center;font-size:var(--font-size-xs);color:var(--text-tertiary);font-weight:600;text-transform:uppercase">
                  Time
                </div>
                ${days.map(day => {
                  const isToday = day.toDateString() === new Date().toDateString();
                  return `
                    <div style="height:44px;display:flex;flex-direction:column;align-items:center;justify-content:center;border-right:1px solid var(--border-color);background:var(--card-bg);">
                      <div style="font-size:var(--font-size-sm);font-weight:600;${isToday ? 'color:var(--color-primary)' : 'color:var(--text-secondary)'};display:flex;align-items:center;gap:6px">
                        <span>${dayNames[day.getDay()]} ${day.getDate()} ${monthNames[day.getMonth()]}</span>
                      </div>
                    </div>
                  `;
                }).join('')}
              </div>

              <!-- Day Grid -->
              <div style="display:grid;grid-template-columns:80px repeat(${days.length}, minmax(160px, 1fr));width:fit-content;min-width:100%">
                <!-- Hours Column (Sticky Left) -->
                <div style="background:var(--card-bg);position:sticky;left:0;z-index:2;border-right:1px solid var(--border-color)">
                  ${hours.map(h => `
                    <div style="height:48px;border-bottom:1px solid var(--border-color);padding:4px 8px;font-size:var(--font-size-xs);color:var(--text-tertiary);text-align:right;display:flex;align-items:flex-start;justify-content:flex-end">
                      ${h > 12 ? h - 12 : h}${h >= 12 ? 'pm' : 'am'}
                    </div>
                  `).join('')}
                </div>

                <!-- Day Columns for the selected Technician -->
                ${days.map((day, dayIdx) => {
                  const tech = technicians.find(t => t.id === selectedTechId);
                  const techBlocks = blocks.filter(b => b.technicianId === tech.id);
                  return `
                    <div class="schedule-day-col" style="position:relative;border-right:1px solid var(--border-color)" data-tech="${tech.id}" data-day="${dayIdx}">
                      ${hours.map(h => `<div class="schedule-hour-slot" style="height:48px;border-bottom:1px solid var(--border-color)" data-hour="${h}"></div>`).join('')}
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
    bindDragAndDrop();
  }

  function getUnscheduledJobs() {
    return jobs.filter(j => (!j.scheduledDate || !j.technicianId) && j.status !== 'Completed' && j.status !== 'Invoiced');
  }

  function renderBlocks(techBlocks, dayIdx, color) {
    const priorityBorders = { 'Urgent': '#EF4444', 'High': '#F59E0B' };
    return techBlocks
      .filter(b => b.dayIdx === dayIdx)
      .map(b => {
        const top = (b.startHour - 7) * 48;
        const height = (b.endHour - b.startHour) * 48 - 2;
        const borderColor = priorityBorders[b.priority] || color;
        return `
          <div class="schedule-block" draggable="true" data-block-job-id="${b.jobId}" data-start="${b.startHour}" data-end="${b.endHour}" style="
            top:${top}px;height:${height}px;
            background:${color}12;
            border-color:${borderColor};
            color:${color};
            pointer-events: auto;
          ">
            <div style="pointer-events:none;font-weight:600;font-size:11px;line-height:1.3">${b.jobNumber}</div>
            <div style="pointer-events:none;font-size:10px;opacity:0.8;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${b.customerName}</div>
            ${height > 50 ? `<div style="pointer-events:none;font-size:9px;opacity:0.6;margin-top:2px">${b.startHour > 12 ? b.startHour - 12 : b.startHour}${b.startHour >= 12 ? 'pm' : 'am'} — ${b.endHour > 12 ? b.endHour - 12 : b.endHour}${b.endHour >= 12 ? 'pm' : 'am'}</div>` : ''}
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

    container.querySelector('#schedule-tech-filter')?.addEventListener('change', (e) => {
      selectedTechId = e.target.value;
      render();
    });

    // Toggle unscheduled drawer
    const toggle = container.querySelector('#unscheduled-toggle');
    const drawer = container.querySelector('#unscheduled-drawer');
    const chevron = container.querySelector('#unscheduled-chevron');
    toggle?.addEventListener('click', () => {
      const isOpen = drawer.style.display !== 'none';
      drawer.style.display = isOpen ? 'none' : 'flex';
      chevron.textContent = isOpen ? 'expand_more' : 'expand_less';
    });

    // Click existing blocks to navigate to job
    container.querySelectorAll('.schedule-block').forEach(block => {
      block.addEventListener('click', (e) => {
        if (e.defaultPrevented) return; // skip if drag happened
        router.navigate(`/jobs/${block.dataset.blockJobId}`);
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

  function bindDragAndDrop() {
    const days = getWeekDays();

    // Draggable: unscheduled jobs
    container.querySelectorAll('.unscheduled-job').forEach(el => {
      el.addEventListener('dragstart', (e) => {
        dragState = {
          type: 'unscheduled',
          jobId: el.dataset.jobId,
          jobNumber: el.dataset.jobNumber,
          customerName: el.dataset.customer,
          title: el.dataset.title,
          hours: parseInt(el.dataset.hours) || 2,
        };
        e.dataTransfer.effectAllowed = 'move';
        el.style.opacity = '0.5';
      });
      el.addEventListener('dragend', () => { 
        el.style.opacity = '1'; 
        dragState = null;
      });
    });

    // Draggable: existing blocks
    container.querySelectorAll('.schedule-block[draggable]').forEach(el => {
      el.addEventListener('dragstart', (e) => {
        e.stopPropagation();
        dragState = {
          type: 'existing',
          jobId: el.dataset.blockJobId,
          startHour: parseInt(el.dataset.start),
          endHour: parseInt(el.dataset.end),
        };
        e.dataTransfer.effectAllowed = 'move';
        el.style.opacity = '0.4';
      });
      el.addEventListener('dragend', () => { 
        el.style.opacity = '1'; 
        dragState = null;
      });
    });

    // Drop zones: each day column per technician
    container.querySelectorAll('.schedule-day-col').forEach(col => {
      col.addEventListener('dragover', (e) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
        col.style.background = 'rgba(27, 109, 224, 0.05)';
      });
      col.addEventListener('dragleave', () => {
        col.style.background = '';
      });
      col.addEventListener('drop', (e) => {
        e.preventDefault();
        col.style.background = '';

        if (!dragState) return;

        const targetTechId = col.dataset.tech;
        const targetDayIdx = parseInt(col.dataset.day);
        const targetDay = days[targetDayIdx];

        // Calculate drop hour from mouse position
        const rect = col.getBoundingClientRect();
        const relY = e.clientY - rect.top;
        const hourIdx = Math.floor(relY / 48);
        const dropHour = Math.max(7, Math.min(18, 7 + hourIdx));

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
            b.jobId !== job.id && // don't conflict with itself if just moving
            Math.max(b.startHour, dropHour) < Math.min(b.endHour, dropEndHour)
          );

          if (hasConflict) {
            if (!window.confirm('Technician already has a job scheduled at this time. Proceed anyway?')) {
              dragState = null;
              return;
            }
          }

          // Update job with new assignment

          let newTechs = job.technicians || [];
          if (!newTechs.find(t => t.id === targetTechId)) {
            newTechs = [{ id: targetTechId, name: tech?.name || '', hours: duration, rate: 85 }]; // Replace or add
          }

          const pad = n => n.toString().padStart(2, '0');
          const localDateStr = `${targetDay.getFullYear()}-${pad(targetDay.getMonth() + 1)}-${pad(targetDay.getDate())}`;

          store.update('jobs', job.id, {
            technicianId: targetTechId,
            technicianName: tech?.name || '',
            technicians: newTechs,
            scheduledDate: localDateStr,
            startHour: dropHour,
            status: job.status === 'Pending' ? 'Scheduled' : job.status,
          });

          showToast(`${job.number} → ${tech?.name || 'tech'} on ${targetDay.toLocaleDateString('en-AU', { weekday: 'short', day: 'numeric', month: 'short' })}`, 'success');
        }

        dragState = null;
        render();
      });
    });
  }

  function renderActivityCalendar() {
    const days = getWeekDays();
    const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

    const currentUser = JSON.parse(sessionStorage.getItem('currentUser') || '{}');
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
