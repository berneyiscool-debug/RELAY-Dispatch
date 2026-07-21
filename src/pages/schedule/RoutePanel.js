// ============================================
// RELAY — SCHEDULE ROUTE PANEL (v1.3 maps, flag-gated)
// ============================================
// Slide-in panel on the Schedule page: per-technician drive legs for the
// viewed day (office → job 1 → … → office), a "best order" suggestion via
// Google waypoint optimization, and one-click re-timing of the day's blocks
// to match the suggested order. Mounted only when FLAGS.maps is on.

import { store } from '../../data/store.js';
import { showToast } from '../../components/Notifications.js';
import { escapeHTML } from '../../utils/security.js';
import { computeRoute, getStartLocation, navigateUrl, fmtDuration } from '../../utils/routing.js';
import { getCachedGeo, geocodeAddress } from '../../utils/geocode.js';

const PANEL_ID = 'schedule-route-panel';
const BTN_ID = 'btn-schedule-route';

const dstr = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

function blocksFor(dateStr, techId) {
  // startTime is the authoritative time; startHour can sit at its column default
  const t = (s) => s.startTime ? new Date(s.startTime).getTime()
    : ((s.startHour || 0) * 3600 + (s.startMinute || 0) * 60) * 1000;
  return (store.getAll('schedule') || [])
    .filter(s => s.date === dateStr && (s.technicianId || 'unassigned') === techId)
    .sort((a, b) => t(a) - t(b));
}

async function stopForBlock(s) {
  const job = store.getById('jobs', s.jobId);
  const addr = job?.siteAddress;
  if (!addr) return null;
  const geo = job.geo || getCachedGeo(addr) || await geocodeAddress(addr);
  if (!geo) return null;
  // Trim generated suffixes ("… — Recurring (21/07/2026)") for display
  const title = (job.title || addr).replace(/\s*—\s*Recurring.*$/i, '').trim();
  return {
    id: s.id, blockId: s.id, jobId: s.jobId,
    number: job.number || '', title,
    label: `${job.number || ''} ${title}`.trim(),
    time: s.startTime ? s.startTime.slice(11, 16) : '',
    address: addr, lat: geo.lat, lng: geo.lng,
  };
}

function blockDurationMin(s) {
  if (s.startTime && s.finishTime) {
    const ms = new Date(s.finishTime) - new Date(s.startTime);
    if (ms > 0) return Math.round(ms / 60000);
  }
  if (typeof s.startHour === 'number' && typeof s.endHour === 'number' && s.endHour > s.startHour) {
    return Math.round((s.endHour - s.startHour) * 60);
  }
  return 60;
}

// Re-time a tech's blocks to the given stop order: anchor at the day's earliest
// start, keep each block's duration, insert drive time (rounded up to 5 min) between.
function applyOrder(dateStr, orderedStops, legs, refresh) {
  const first = orderedStops[0] && store.getById('schedule', orderedStops[0].blockId);
  if (!first) return;
  let cursor = first.startTime ? new Date(first.startTime)
    : new Date(`${dateStr}T${String(Math.floor(first.startHour ?? 8)).padStart(2, '0')}:${String(first.startMinute || 0).padStart(2, '0')}`);

  const legAfter = (blockId) => legs.find(l => l.fromId === blockId && l.toId !== 'origin');
  orderedStops.forEach((stop) => {
    const block = store.getById('schedule', stop.blockId);
    if (!block) return;
    const durMin = blockDurationMin(block);
    const start = new Date(cursor);
    const end = new Date(start.getTime() + durMin * 60000);
    const fmt = (d) => `${dateStr}T${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
    store.update('schedule', block.id, {
      startTime: fmt(start),
      finishTime: fmt(end),
      startHour: start.getHours() + start.getMinutes() / 60,
      endHour: end.getHours() + end.getMinutes() / 60,
      startMinute: start.getMinutes(),
      hours: durMin / 60,
    });
    const drive = legAfter(stop.blockId);
    const driveMin = drive ? Math.ceil((drive.durationSec / 60) / 5) * 5 : 0;
    cursor = new Date(end.getTime() + driveMin * 60000);
  });
  showToast('Schedule re-timed to the suggested order', 'success');
  refresh();
}

async function renderPanelContent(body, date, technicians, refresh) {
  try {
    await renderPanelContentInner(body, date, technicians, refresh);
  } catch (e) {
    console.warn('Route panel error:', e);
    body.innerHTML = `<div style="padding:24px;font-size:13px;color:var(--color-danger);">
      Route calculation failed.<br><span style="color:var(--text-tertiary);font-size:12px;">${escapeHTML(String(e?.message || e))}</span></div>`;
  }
}

async function renderPanelContentInner(body, date, technicians, refresh) {
  const dateStr = dstr(date);
  body.innerHTML = `<div style="padding:24px;color:var(--text-tertiary);font-size:13px;">Calculating routes…</div>`;

  const start = await getStartLocation();
  if (!start) {
    body.innerHTML = `<div style="padding:24px;color:var(--text-tertiary);font-size:13px;">Set a company address (Settings) or a personal start location (Profile) to enable routing.</div>`;
    return;
  }

  const sections = [];
  for (const tech of technicians) {
    const blocks = blocksFor(dateStr, tech.id);
    if (!blocks.length) continue;
    const stops = (await Promise.all(blocks.map(stopForBlock))).filter(Boolean);
    if (!stops.length) {
      sections.push(`<div class="rp-section"><div class="rp-tech">${escapeHTML(tech.name)}</div>
        <div class="rp-muted">No geocodable job addresses for this day.</div></div>`);
      continue;
    }
    const route = await computeRoute({ origin: { lat: start.lat, lng: start.lng }, stops, roundTrip: true });
    if (!route) {
      sections.push(`<div class="rp-section"><div class="rp-tech">${escapeHTML(tech.name)}</div>
        <div class="rp-muted">Route service unavailable.</div></div>`);
      continue;
    }
    const nav = navigateUrl([...stops.map(s => s.address), start.label]);

    // Vertical timeline: origin → each stop (in route order) → origin, with the
    // drive time chip sitting on the connector between nodes.
    const baseName = start.source === 'user' ? 'My start' : 'Office';
    const orderedStops = route.order.map(id => stops.find(s => s.id === id)).filter(Boolean);
    const nodes = [
      { type: 'base', name: baseName },
      ...orderedStops.map(s => ({ type: 'job', ...s })),
      { type: 'base', name: baseName },
    ];
    const legRows = nodes.map((n, i) => {
      const nodeHtml = n.type === 'base'
        ? `<div class="rp-node"><span class="rp-node-ic material-icons-outlined">home</span>
             <div class="rp-node-txt"><span class="rp-node-title rp-node-base">${escapeHTML(n.name)}</span></div></div>`
        : `<div class="rp-node"><span class="rp-node-dot"></span>
             <div class="rp-node-txt">
               <span class="rp-node-title">${n.time ? `<span class="rp-node-time">${n.time}</span>` : ''}<strong>${escapeHTML(n.number)}</strong> ${escapeHTML(n.title)}</span>
               <span class="rp-node-addr">${escapeHTML(n.address)}</span>
             </div></div>`;
      const leg = route.legs[i]; // leg i connects node i → node i+1
      const connector = i < nodes.length - 1 && leg
        ? `<div class="rp-connector"><span class="rp-drive-chip"><span class="material-icons-outlined" style="font-size:12px;">directions_car</span>${fmtDuration(leg.durationSec)}</span></div>`
        : '';
      return nodeHtml + connector;
    }).join('');

    sections.push(`<div class="rp-section" data-tech="${tech.id}">
      <div class="rp-tech">${escapeHTML(tech.name)}
        <span class="rp-total">${fmtDuration(route.totalDurationSec)} · ${(route.totalDistanceMeters / 1000).toFixed(0)} km</span>
        ${nav ? `<a href="${nav}" target="_blank" rel="noopener" title="Open in Google Maps" class="rp-nav"><span class="material-icons-outlined" style="font-size:15px;">open_in_new</span></a>` : ''}
      </div>
      ${legRows}
      <button class="btn btn-secondary btn-sm rp-optimize" data-tech="${tech.id}" style="margin-top:8px;">
        <span class="material-icons-outlined" style="font-size:15px;">auto_fix_high</span> Suggest best order
      </button>
      <div class="rp-suggestion" data-tech="${tech.id}"></div>
    </div>`);
  }

  body.innerHTML = `
    <style>
      .rp-section { padding: 14px 18px; border-bottom: 1px solid var(--border-color); }
      .rp-tech { font-weight: 600; font-size: 13.5px; display: flex; align-items: center; gap: 8px; margin-bottom: 8px; }
      .rp-total { font-weight: 500; font-size: 12px; color: var(--color-primary); margin-left: auto; }
      .rp-nav { color: var(--color-primary); display: flex; }
      .rp-node { display: flex; align-items: flex-start; gap: 10px; }
      .rp-node-ic { font-size: 17px; color: var(--text-secondary); width: 18px; text-align: center; flex-shrink: 0; margin-top: 1px; }
      .rp-node-dot { width: 10px; height: 10px; border-radius: 50%; background: var(--color-primary); border: 2px solid var(--bg-color); box-shadow: 0 0 0 2px var(--color-primary); flex-shrink: 0; margin: 4px 4px 0; }
      .rp-node-txt { display: flex; flex-direction: column; min-width: 0; flex: 1; }
      .rp-node-title { font-size: 12.5px; color: var(--text-primary); line-height: 1.35; overflow-wrap: break-word; }
      .rp-node-title strong { font-weight: 700; }
      .rp-node-base { font-weight: 600; color: var(--text-secondary); }
      .rp-node-time { display: inline-block; font-size: 10.5px; font-weight: 700; color: var(--text-tertiary); background: var(--border-color); border-radius: 3px; padding: 0 4px; margin-right: 6px; vertical-align: 1px; }
      .rp-node-addr { font-size: 11px; color: var(--text-tertiary); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
      .rp-connector { border-left: 2px solid var(--border-color); margin-left: 12px; padding: 5px 0 5px 14px; }
      .rp-drive-chip { display: inline-flex; align-items: center; gap: 4px; font-size: 11px; font-weight: 600; color: var(--color-primary); background: color-mix(in srgb, var(--color-primary) 10%, transparent); border-radius: 10px; padding: 2px 8px; }
      .rp-muted { font-size: 12px; color: var(--text-tertiary); }
      .rp-suggestion { margin-top: 6px; }
    </style>
    ${sections.length ? sections.join('') : `
      <div style="padding:28px 24px;text-align:center;">
        <span class="material-icons-outlined" style="font-size:34px;color:var(--text-tertiary);opacity:0.5;">event_busy</span>
        <div style="font-size:13px;font-weight:600;margin-top:8px;">Nothing scheduled on ${escapeHTML(date.toLocaleDateString('en-AU', { weekday: 'long', day: 'numeric', month: 'long' }))}</div>
        <div style="font-size:12px;color:var(--text-tertiary);margin-top:6px;line-height:1.5;">
          The planner routes the day you're viewing on the schedule.<br>
          Use the ‹ › arrows to move to a day with jobs, then reopen Route.
        </div>
      </div>`}`;

  // Wire "suggest best order" per tech
  body.querySelectorAll('.rp-optimize').forEach(btn => {
    btn.addEventListener('click', async () => {
      const techId = btn.dataset.tech;
      const slot = body.querySelector(`.rp-suggestion[data-tech="${techId}"]`);
      btn.disabled = true;
      slot.innerHTML = `<div class="rp-muted">Optimizing…</div>`;
      try {
        const blocks = blocksFor(dateStr, techId);
        const stops = (await Promise.all(blocks.map(stopForBlock))).filter(Boolean);
        const current = await computeRoute({ origin: { lat: start.lat, lng: start.lng }, stops, roundTrip: true });
        const best = await computeRoute({ origin: { lat: start.lat, lng: start.lng }, stops, roundTrip: true, optimize: true });
        if (!best) { slot.innerHTML = `<div class="rp-muted">Route service unavailable.</div>`; return; }
        const orderedStops = best.order.map(id => stops.find(s => s.id === id)).filter(Boolean);
        const savedSec = current ? current.totalDurationSec - best.totalDurationSec : 0;
        const sameOrder = current && best.order.join() === stops.map(s => s.id).join();
        slot.innerHTML = sameOrder
          ? `<div class="rp-muted" style="padding:6px 0;">✓ Current order is already optimal.</div>`
          : `<div style="font-size:12px;padding:6px 0;">
               <div style="font-weight:600;margin-bottom:4px;">Suggested: ${orderedStops.map(s => escapeHTML(s.number || s.title.split(' ')[0])).join(' → ')}
                 <span style="color:var(--color-success);">${savedSec > 60 ? `saves ${fmtDuration(savedSec)}` : ''}</span></div>
               <button class="btn btn-primary btn-sm rp-apply">Apply order & re-time day</button>
             </div>`;
        slot.querySelector('.rp-apply')?.addEventListener('click', () => applyOrder(dateStr, orderedStops, best.legs, refresh));
      } finally {
        btn.disabled = false;
      }
    });
  });
}

/**
 * Mount the Route button + panel onto the schedule page.
 * ctx: { getDate: () => Date, getTechnicians: () => [{id,name}], refresh: () => void }
 */
export function mountRoutePanel(container, ctx) {
  document.getElementById(PANEL_ID)?.remove();
  document.getElementById(BTN_ID)?.remove();

  // Mounted on <body>, NOT the page container: ScheduleView rebuilds its
  // container.innerHTML on every internal render (navigation, drag, realtime),
  // which would wipe the button. A hashchange listener tears both down when
  // the user leaves the schedule page.
  const btn = document.createElement('button');
  btn.id = BTN_ID;
  btn.className = 'btn btn-primary';
  btn.title = 'Route planner — drive times & best job order for the viewed day';
  btn.style.cssText = 'position:fixed;bottom:18px;right:18px;z-index:440;border-radius:24px;box-shadow:0 4px 14px rgba(0,0,0,0.22);display:flex;gap:6px;';
  btn.innerHTML = `<span class="material-icons-outlined" style="font-size:18px;">route</span> Route`;
  document.body.appendChild(btn);

  const panel = document.createElement('div');
  panel.id = PANEL_ID;
  // background: var(--bg-color) — solid in every theme (var(--card-bg) is translucent glass)
  panel.style.cssText = 'position:fixed;top:0;right:-380px;width:360px;height:100vh;background:var(--bg-color);border-left:1px solid var(--border-color);box-shadow:-8px 0 30px rgba(0,0,0,0.25);z-index:450;transition:right 0.28s cubic-bezier(0.16,1,0.3,1);display:flex;flex-direction:column;';
  panel.innerHTML = `
    <div style="display:flex;align-items:center;justify-content:space-between;padding:14px 18px;border-bottom:1px solid var(--border-color);">
      <div style="font-weight:700;font-size:14px;display:flex;align-items:center;gap:8px;">
        <span class="material-icons-outlined" style="color:var(--color-primary);">route</span>
        Route Planner <span id="rp-date" style="font-weight:500;color:var(--text-tertiary);font-size:12px;"></span>
      </div>
      <button class="btn btn-ghost btn-icon btn-sm" id="rp-close"><span class="material-icons-outlined">close</span></button>
    </div>
    <div id="rp-week" style="display:none;padding:10px 18px 0;font-size:12px;font-weight:600;color:var(--text-secondary);"></div>
    <div id="rp-days" style="display:none;gap:4px;padding:8px 14px 10px;border-bottom:1px solid var(--border-color);"></div>
    <div id="rp-body" style="flex:1;overflow-y:auto;"></div>`;
  document.body.appendChild(panel);

  const showDay = (date) => {
    panel.querySelector('#rp-date').textContent = date.toLocaleDateString('en-AU', { weekday: 'short', day: 'numeric', month: 'short' });
    renderPanelContent(panel.querySelector('#rp-body'), date, ctx.getTechnicians(), ctx.refresh);
  };

  const open = () => {
    panel.style.right = '0';
    const date = ctx.getDate();
    const daysRow = panel.querySelector('#rp-days');

    // Week view: pick a day of the viewed week (dots mark days with allocations).
    // Defaults to today when it's inside the week, else the first day with jobs.
    const weekRow = panel.querySelector('#rp-week');
    if (ctx.getViewMode?.() === 'week') {
      const monday = new Date(date);
      const dow = monday.getDay();
      monday.setDate(monday.getDate() - dow + (dow === 0 ? -6 : 1));
      const days = Array.from({ length: 7 }, (_, i) => { const d = new Date(monday); d.setDate(d.getDate() + i); return d; });
      const hasBlocks = (d) => (store.getAll('schedule') || []).some(s => s.date === dstr(d));
      const todayStr = dstr(new Date());
      const selected = days.find(d => dstr(d) === todayStr) || days.find(hasBlocks) || days[0];

      // Week label above the day buttons, e.g. "Week of 20 – 26 July"
      const sunday = days[6];
      const sameMonth = monday.getMonth() === sunday.getMonth();
      weekRow.style.display = 'block';
      weekRow.textContent = `Week of ${monday.getDate()}${sameMonth ? '' : ' ' + monday.toLocaleDateString('en-AU', { month: 'long' })} – ${sunday.getDate()} ${sunday.toLocaleDateString('en-AU', { month: 'long' })}`;

      daysRow.style.display = 'flex';
      daysRow.style.justifyContent = 'space-between';
      daysRow.innerHTML = days.map(d => `
        <div style="display:flex;flex-direction:column;align-items:center;gap:3px;">
          <button class="rp-day toolbar-filter ${dstr(d) === dstr(selected) ? 'active' : ''}" data-date="${dstr(d)}"
            title="${d.toLocaleDateString('en-AU', { weekday: 'long', day: 'numeric', month: 'long' })}"
            style="width:34px;height:34px;border-radius:50%;padding:0;font-size:12.5px;font-weight:700;display:flex;align-items:center;justify-content:center;">
            ${d.toLocaleDateString('en-AU', { weekday: 'narrow' })}
          </button>
          <span style="width:5px;height:5px;border-radius:50%;background:${hasBlocks(d) ? 'var(--color-primary)' : 'transparent'};"></span>
        </div>`).join('');
      daysRow.querySelectorAll('.rp-day').forEach(b => b.addEventListener('click', () => {
        daysRow.querySelectorAll('.rp-day').forEach(x => x.classList.remove('active'));
        b.classList.add('active');
        showDay(new Date(b.dataset.date + 'T12:00:00'));
      }));
      showDay(selected);
    } else {
      weekRow.style.display = 'none';
      daysRow.style.display = 'none';
      showDay(date);
    }
  };
  const close = () => { panel.style.right = '-380px'; };
  btn.addEventListener('click', () => (panel.style.right === '0px' ? close() : open()));
  panel.querySelector('#rp-close').addEventListener('click', close);

  // Tear down when leaving the schedule page
  const onHashChange = () => {
    if (!location.hash.startsWith('#/schedule')) {
      btn.remove();
      panel.remove();
      window.removeEventListener('hashchange', onHashChange);
    }
  };
  window.addEventListener('hashchange', onHashChange);
}
