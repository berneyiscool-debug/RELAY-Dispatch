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
  return (store.getAll('schedule') || [])
    .filter(s => s.date === dateStr && (s.technicianId || 'unassigned') === techId)
    .sort((a, b) => (a.startHour - b.startHour) || ((a.startMinute || 0) - (b.startMinute || 0)));
}

async function stopForBlock(s) {
  const job = store.getById('jobs', s.jobId);
  const addr = job?.siteAddress;
  if (!addr) return null;
  const geo = job.geo || getCachedGeo(addr) || await geocodeAddress(addr);
  return geo ? { id: s.id, blockId: s.id, jobId: s.jobId, label: `${job.number || ''} ${job.title || addr}`.trim(), address: addr, lat: geo.lat, lng: geo.lng } : null;
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
    const legRows = route.legs.map(leg => {
      const from = leg.fromId === 'origin' ? `<em>${escapeHTML(start.source === 'user' ? 'My start' : 'Office')}</em>` : escapeHTML(stops.find(s => s.id === leg.fromId)?.label || '');
      const to = leg.toId === 'origin' ? `<em>${escapeHTML(start.source === 'user' ? 'My start' : 'Office')}</em>` : escapeHTML(stops.find(s => s.id === leg.toId)?.label || '');
      return `<div class="rp-leg"><span class="material-icons-outlined" style="font-size:13px;">directions_car</span>
        <span class="rp-leg-path">${from} → ${to}</span>
        <span class="rp-leg-time">${fmtDuration(leg.durationSec)}</span></div>`;
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
      .rp-leg { display: flex; align-items: center; gap: 6px; font-size: 12px; color: var(--text-secondary); padding: 3px 0; }
      .rp-leg-path { flex: 1; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
      .rp-leg-time { font-weight: 600; color: var(--text-primary); }
      .rp-muted { font-size: 12px; color: var(--text-tertiary); }
      .rp-suggestion { margin-top: 6px; }
    </style>
    ${sections.length ? sections.join('') : `<div style="padding:24px;color:var(--text-tertiary);font-size:13px;">No allocations on this day.</div>`}`;

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
               <div style="font-weight:600;margin-bottom:4px;">Suggested: ${orderedStops.map(s => escapeHTML(s.label.split(' ')[0])).join(' → ')}
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
  panel.style.cssText = 'position:fixed;top:0;right:-380px;width:360px;height:100vh;background:var(--card-bg);border-left:1px solid var(--border-color);box-shadow:-8px 0 30px rgba(0,0,0,0.15);z-index:450;transition:right 0.28s cubic-bezier(0.16,1,0.3,1);display:flex;flex-direction:column;';
  panel.innerHTML = `
    <div style="display:flex;align-items:center;justify-content:space-between;padding:14px 18px;border-bottom:1px solid var(--border-color);">
      <div style="font-weight:700;font-size:14px;display:flex;align-items:center;gap:8px;">
        <span class="material-icons-outlined" style="color:var(--color-primary);">route</span>
        Route Planner <span id="rp-date" style="font-weight:500;color:var(--text-tertiary);font-size:12px;"></span>
      </div>
      <button class="btn btn-ghost btn-icon btn-sm" id="rp-close"><span class="material-icons-outlined">close</span></button>
    </div>
    <div id="rp-body" style="flex:1;overflow-y:auto;"></div>`;
  document.body.appendChild(panel);

  const open = () => {
    panel.style.right = '0';
    const date = ctx.getDate();
    panel.querySelector('#rp-date').textContent = date.toLocaleDateString('en-AU', { weekday: 'short', day: 'numeric', month: 'short' });
    renderPanelContent(panel.querySelector('#rp-body'), date, ctx.getTechnicians(), ctx.refresh);
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
