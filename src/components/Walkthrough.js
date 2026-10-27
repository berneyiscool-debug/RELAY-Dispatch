// ============================================
// RELAY — NEW-USER WALKTHROUGH (floating guide + tours)
// ============================================
// Two pieces of UI, both driven by utils/onboarding.js:
//
//   - The guide: a small card pinned to the bottom-left of the page that follows
//     the user between pages while they take their first customer through
//     quote → job → invoice. It rings the control they need next and moves on by
//     itself the moment the store shows the step is done. It never blocks the page.
//
//   - The tours: a dimmed, step-by-step spotlight over the sidebar (pages tour)
//     or the Settings menu (settings tour) explaining what lives where.
//
// The Getting Started hub (SetupChecklist.js) is the entry point for both.
// ============================================

import { store } from '../data/store.js';
import { router } from '../router.js';
import { escapeHTML } from '../utils/security.js';
import { updateSidebarActive } from './Sidebar.js';
import { isCloudUser, isReadOnly } from '../utils/subscription.js';
import {
  loadOnboardingState, saveOnboardingState, workflowProgress, coachFor,
  PAGES_TOUR, SETTINGS_TOUR,
} from '../utils/onboarding.js';
import { getSessionUser } from '../pages/auth/session.js';
const GUIDE_ID = 'relay-guide';
const RING_ID = 'relay-guide-ring';
const TOUR_ID = 'relay-tour';

const listeners = new Set();

function currentUser() {
  try {
    return getSessionUser();
  } catch (e) {
    return null;
  }
}

/**
 * True for a RELAY Cloud company. store.companyId alone is not enough here: it is
 * null until cloud sync starts and clearSync() empties it again, so during those
 * windows a cloud company would read as local and be offered Cloud. The signed-in
 * user's own company id settles it.
 */
export function isCloudAccount() {
  if (isCloudUser()) return true;
  const id = currentUser()?.companyId;
  return !!id && !String(id).startsWith('acct_');
}

export function getOnboardingState() {
  return loadOnboardingState(currentUser());
}

export function setOnboardingState(patch) {
  const next = saveOnboardingState(currentUser(), patch);
  listeners.forEach(fn => { try { fn(next); } catch (e) { /* a listener must not break the others */ } });
  return next;
}

/** Called whenever onboarding state changes (the hub re-renders itself). */
export function onOnboardingChange(fn) {
  listeners.add(fn);
}

export function workflowData() {
  const get = (c) => { try { return store.getAll(c) || []; } catch (e) { return []; } };
  return { customers: get('customers'), quotes: get('quotes'), jobs: get('jobs'), invoices: get('invoices') };
}

function currentRoute() {
  const h = (typeof window !== 'undefined' && window.location.hash) || '';
  return h.replace(/^#/, '') || '/';
}

function routeHidesGuide(route) {
  return /^\/(login|setup|subscribe|terms|privacy|refunds|acceptable-use|portal|contractor-portal)/.test(route);
}

// ── Spotlight ring ─────────────────────────────────────────────────────────────
// A fixed-position outline that tracks one element. It polls rather than relying
// on route callbacks because pages render asynchronously and re-render in place.

let ringTarget = null;
let ringTimer = null;
let ringDim = false;

function placeRing() {
  const ring = document.getElementById(RING_ID);
  if (!ring) return;
  const found = ringTarget ? document.querySelector(ringTarget) : null;
  // A searchable <select> is visually replaced by its container; ring that instead.
  const el = found && (found.closest('.searchable-select-container') || found);
  const rect = el && el.offsetParent !== null ? el.getBoundingClientRect() : null;
  if (!rect || (rect.width === 0 && rect.height === 0)) {
    ring.hidden = true;
    return;
  }
  const pad = 4;
  ring.hidden = false;
  ring.style.top = `${rect.top - pad}px`;
  ring.style.left = `${rect.left - pad}px`;
  ring.style.width = `${rect.width + pad * 2}px`;
  ring.style.height = `${rect.height + pad * 2}px`;
}

function setRing(selector, { dim = false } = {}) {
  ringTarget = selector || null;
  ringDim = dim;
  let ring = document.getElementById(RING_ID);
  if (!ringTarget) {
    ring?.remove();
    clearInterval(ringTimer);
    ringTimer = null;
    return;
  }
  if (!ring) {
    ring = document.createElement('div');
    ring.id = RING_ID;
    ring.setAttribute('aria-hidden', 'true');
    document.body.appendChild(ring);
  }
  ring.classList.toggle('is-dim', ringDim);
  placeRing();
  if (!ringTimer) ringTimer = setInterval(placeRing, 300);
}

if (typeof window !== 'undefined') {
  window.addEventListener('resize', placeRing);
  window.addEventListener('scroll', placeRing, true);
}

// ── Floating guide ─────────────────────────────────────────────────────────────

let lastStepKey = null;
let celebrate = null;
let celebrateTimer = null;
let minimized = false;

export function startGuide() {
  minimized = false;
  setOnboardingState({ guideActive: true });
  refreshWalkthrough();
  // Take them straight to where the next step starts.
  const prog = workflowProgress(workflowData());
  if (prog.current) {
    const coach = coachFor(prog.current.key, currentRoute(), workflowData());
    if (coach && coach.action) router.navigate(coach.action.path);
  }
}

export function stopGuide() {
  setOnboardingState({ guideActive: false });
  unmountGuide();
}

function unmountGuide() {
  document.getElementById(GUIDE_ID)?.remove();
  if (!document.getElementById(TOUR_ID)) setRing(null);
}

function guideShouldShow(state) {
  if (!currentUser() || store.demoMode || isReadOnly()) return false;
  if (state.dismissed || !state.guideActive) return false;
  if (document.getElementById(TOUR_ID)) return false;
  return !routeHidesGuide(currentRoute());
}

// Keeps the card clear of the sidebar, whatever width it is at.
function guideLeft() {
  const side = document.getElementById('sidebar');
  const r = side && side.style.display !== 'none' ? side.getBoundingClientRect() : null;
  return Math.max(16, (r ? r.right : 0) + 16);
}

function segmentsHtml(prog) {
  return prog.steps.map(s => `
    <span class="relay-guide-seg${s.done ? ' is-done' : ''}${prog.current && prog.current.key === s.key ? ' is-current' : ''}" title="${escapeHTML(s.label)}"></span>
  `).join('');
}

function guideBodyHtml(prog, coach) {
  if (prog.complete) {
    return `
      <div class="relay-guide-done">
        <span class="material-icons-outlined">celebration</span>
        <div>
          <strong>You've run a job end to end</strong>
          <p>Customer, quote, job and invoice — that's the whole loop. Want a quick look at everything else RELAY can do?</p>
        </div>
      </div>
      <div class="relay-guide-actions">
        <button type="button" class="btn btn-primary btn-sm" data-guide="tour">
          <span class="material-icons-outlined">explore</span> Take the tour
        </button>
        <button type="button" class="btn btn-secondary btn-sm" data-guide="close">Finish</button>
      </div>`;
  }
  const step = prog.current;
  const idx = prog.steps.findIndex(s => s.key === step.key) + 1;
  return `
    ${celebrate ? `<div class="relay-guide-cheer"><span class="material-icons-outlined">check_circle</span>${escapeHTML(celebrate)}</div>` : ''}
    <div class="relay-guide-step">Step ${idx} of ${prog.total} · ${escapeHTML(step.label)}</div>
    <div class="relay-guide-title">${escapeHTML(coach.title)}</div>
    <p class="relay-guide-text">${escapeHTML(coach.text)}</p>
    <div class="relay-guide-actions">
      ${coach.action ? `
        <button type="button" class="btn btn-primary btn-sm" data-guide="go" data-path="${escapeHTML(coach.action.path)}">
          ${escapeHTML(coach.action.label)} <span class="material-icons-outlined">arrow_forward</span>
        </button>` : ''}
      ${coach.target ? `
        <button type="button" class="btn btn-secondary btn-sm" data-guide="show">
          <span class="material-icons-outlined">my_location</span> Show me
        </button>` : ''}
    </div>`;
}

const DONE_MESSAGES = {
  customer: 'Customer added — nice start.',
  quote: 'Quote created.',
  job: 'Job is live.',
  invoice: 'Invoice created.',
};

/** Re-render the guide for the current route and data. Safe to call often. */
export function refreshWalkthrough() {
  if (typeof document === 'undefined') return;
  const state = getOnboardingState();
  if (!guideShouldShow(state)) {
    unmountGuide();
    return;
  }

  const data = workflowData();
  const prog = workflowProgress(data);

  // A step that was current and is now done earns a one-line cheer.
  const key = prog.current ? prog.current.key : 'complete';
  if (lastStepKey && lastStepKey !== key && DONE_MESSAGES[lastStepKey] && prog.steps.find(s => s.key === lastStepKey)?.done) {
    celebrate = DONE_MESSAGES[lastStepKey];
    minimized = false;
    clearTimeout(celebrateTimer);
    celebrateTimer = setTimeout(() => { celebrate = null; refreshWalkthrough(); }, 6000);
  }
  lastStepKey = key;

  const coach = prog.current ? coachFor(prog.current.key, currentRoute(), data) : null;

  let card = document.getElementById(GUIDE_ID);
  if (!card) {
    card = document.createElement('aside');
    card.id = GUIDE_ID;
    card.setAttribute('role', 'complementary');
    card.setAttribute('aria-label', 'Getting started guide');
    card.addEventListener('click', onGuideClick);
    document.body.appendChild(card);
  }
  card.style.left = `${guideLeft()}px`;
  card.classList.toggle('is-min', minimized);

  card.innerHTML = `
    <div class="relay-guide-head">
      <span class="material-icons-outlined relay-guide-logo">near_me</span>
      <span class="relay-guide-name">Getting started</span>
      <span class="relay-guide-segs" aria-label="${prog.done} of ${prog.total} steps done">${segmentsHtml(prog)}</span>
      <button type="button" class="relay-guide-icon" data-guide="min" title="${minimized ? 'Expand' : 'Minimise'}" aria-label="${minimized ? 'Expand guide' : 'Minimise guide'}">
        <span class="material-icons-outlined">${minimized ? 'expand_less' : 'expand_more'}</span>
      </button>
      <button type="button" class="relay-guide-icon" data-guide="close" title="Close the guide" aria-label="Close the guide">
        <span class="material-icons-outlined">close</span>
      </button>
    </div>
    ${minimized ? '' : `<div class="relay-guide-body">${guideBodyHtml(prog, coach)}</div>`}
  `;

  setRing(!minimized && coach && coach.target ? coach.target : null);
}

function onGuideClick(e) {
  const btn = e.target.closest('[data-guide]');
  if (!btn) {
    // The tucked-away bar opens again from anywhere on it.
    if (minimized && e.target.closest('.relay-guide-head')) { minimized = false; refreshWalkthrough(); }
    return;
  }
  const act = btn.dataset.guide;
  if (act === 'go') router.navigate(btn.dataset.path);
  else if (act === 'show') {
    const el = ringTarget && document.querySelector(ringTarget);
    if (el) {
      el.scrollIntoView({ block: 'center', behavior: 'smooth' });
      const ring = document.getElementById(RING_ID);
      ring?.classList.remove('is-ping');
      void ring?.offsetWidth;
      ring?.classList.add('is-ping');
    }
  } else if (act === 'min') {
    minimized = !minimized;
    refreshWalkthrough();
  } else if (act === 'close') {
    stopGuide();
  } else if (act === 'tour') {
    stopGuide();
    startTour('pages');
  }
}

// ── Tours ──────────────────────────────────────────────────────────────────────

let tour = null; // { kind, stops, index, returnTo }

export function startTour(kind = 'pages') {
  endTour(false);
  const stops = kind === 'settings' ? SETTINGS_TOUR.map(s => ({ ...s, target: '#sidebar-submenu' })) : PAGES_TOUR;
  tour = { kind, stops, index: 0, returnTo: currentRoute() };
  unmountGuide();

  const root = document.createElement('div');
  root.id = TOUR_ID;
  root.innerHTML = `
    <div class="relay-tour-catch"></div>
    <div class="relay-tour-pop" role="dialog" aria-modal="true" aria-labelledby="relay-tour-title"></div>
  `;
  root.addEventListener('click', onTourClick);
  document.body.appendChild(root);
  document.addEventListener('keydown', onTourKey);
  showStop();
}

function cloudBadge() {
  return '<span class="relay-tour-cloud" title="Available with RELAY Cloud"><span class="material-icons-outlined">cloud</span>Cloud</span>';
}

function pointHtml(p, local) {
  if (typeof p === 'string') {
    const [name, ...rest] = p.split(' — ');
    return `<li><strong>${escapeHTML(name)}</strong>${rest.length ? ` — ${escapeHTML(rest.join(' — '))}` : ''}</li>`;
  }
  return `
    <li>
      <button type="button" class="relay-tour-link" data-tour="tab" data-tab="${escapeHTML(p.tab)}">${escapeHTML(p.label)}</button>
      — ${escapeHTML(p.note)}${p.cloud && local ? ` ${cloudBadge()}` : ''}
    </li>`;
}

function showStop() {
  const root = document.getElementById(TOUR_ID);
  if (!root || !tour) return;
  const stop = tour.stops[tour.index];
  const last = tour.index === tour.stops.length - 1;
  const local = !isCloudAccount();

  if (stop.path) router.navigate(stop.path);
  if (stop.section) document.getElementById(`rail-${stop.section}`)?.click();

  const pop = root.querySelector('.relay-tour-pop');
  pop.innerHTML = `
    <div class="relay-tour-meta">
      <span>${tour.kind === 'settings' ? 'Settings tour' : 'Tour'} · ${tour.index + 1} of ${tour.stops.length}</span>
      <button type="button" class="relay-guide-icon" data-tour="end" aria-label="End tour" title="End tour"><span class="material-icons-outlined">close</span></button>
    </div>
    <h3 id="relay-tour-title" class="relay-tour-title">${escapeHTML(stop.title)}</h3>
    <p class="relay-tour-text">${escapeHTML(stop.text)}</p>
    ${stop.points ? `<ul class="relay-tour-points">${stop.points.map(p => pointHtml(p, local)).join('')}</ul>` : ''}
    <div class="relay-tour-foot">
      <span class="relay-tour-dots">${tour.stops.map((_, i) => `<span class="${i === tour.index ? 'is-on' : ''}"></span>`).join('')}</span>
      ${tour.index > 0 ? '<button type="button" class="btn btn-secondary btn-sm" data-tour="back">Back</button>' : ''}
      <button type="button" class="btn btn-primary btn-sm" data-tour="${last ? 'finish' : 'next'}">${last ? 'Done' : 'Next'}</button>
    </div>
  `;

  setRing(stop.target, { dim: true });
  // Pages render after navigation; place the popover once the target has settled.
  requestAnimationFrame(() => positionPop());
  setTimeout(positionPop, 250);
  pop.querySelector('[data-tour="next"],[data-tour="finish"]')?.focus();
}

function positionPop() {
  const root = document.getElementById(TOUR_ID);
  if (!root || !tour) return;
  const pop = root.querySelector('.relay-tour-pop');
  const stop = tour.stops[tour.index];
  const el = stop.target && document.querySelector(stop.target);
  const rect = el && el.offsetParent !== null ? el.getBoundingClientRect() : null;
  const vw = window.innerWidth;
  const vh = window.innerHeight;
  const pw = pop.offsetWidth;
  const ph = pop.offsetHeight;
  const gap = 14;

  pop.classList.remove('is-center');
  if (!rect || vw < 640) {
    pop.classList.add('is-center');
    pop.style.top = '';
    pop.style.left = '';
    return;
  }
  let left;
  let top;
  if (rect.right + gap + pw < vw - 16) {
    // Beside the target (sidebar items, the settings menu).
    left = rect.right + gap;
    top = rect.top + Math.min(rect.height, 80) / 2 - 40;
  } else {
    // Below it (top bar buttons).
    left = rect.right - pw;
    top = rect.bottom + gap;
  }
  left = Math.max(16, Math.min(left, vw - pw - 16));
  top = Math.max(16, Math.min(top, vh - ph - 16));
  pop.style.left = `${left}px`;
  pop.style.top = `${top}px`;
}

function onTourClick(e) {
  const btn = e.target.closest('[data-tour]');
  if (!btn || !tour) return;
  const act = btn.dataset.tour;
  if (act === 'next') { tour.index++; showStop(); }
  else if (act === 'back') { tour.index--; showStop(); }
  else if (act === 'finish') endTour(true);
  else if (act === 'end') endTour(false);
  else if (act === 'tab') {
    const tab = btn.dataset.tab;
    endTour(true, false);
    router.navigate(`/settings?tab=${encodeURIComponent(tab)}`);
  }
}

function onTourKey(e) {
  if (!tour) return;
  if (e.key === 'Escape') { e.preventDefault(); endTour(false); }
  else if (e.key === 'ArrowRight' && tour.index < tour.stops.length - 1) { tour.index++; showStop(); }
  else if (e.key === 'ArrowLeft' && tour.index > 0) { tour.index--; showStop(); }
}

/** Close the tour. `completed` ticks it off in the hub; `restore` returns to where it started. */
export function endTour(completed = false, restore = true) {
  document.removeEventListener('keydown', onTourKey);
  const root = document.getElementById(TOUR_ID);
  if (!root) { tour = null; return; }
  root.remove();
  setRing(null);
  const was = tour;
  tour = null;
  if (!was) return;
  // Reaching the last stop or closing part-way both count — the user has seen it.
  const seen = completed || was.index > 0;
  if (seen) setOnboardingState(was.kind === 'settings' ? { settingsDone: true } : { tourDone: true });
  if (restore && was.returnTo && was.returnTo !== currentRoute()) router.navigate(was.returnTo);
  else updateSidebarActive(currentRoute().split('?')[0]);
  refreshWalkthrough();
}

/** Undo "Dismiss forever" and open the hub again (Help → Getting started). */
export function restartOnboarding() {
  setOnboardingState({ dismissed: false, welcomed: false });
  router.navigate('/');
}

let bound = false;

// Bound once for the session: the store has no matching removal for a
// module-lifetime subscriber, and a second bind would double-render.
export function bindWalkthroughListeners() {
  if (bound) return;
  bound = true;
  ['customers', 'quotes', 'jobs', 'invoices'].forEach(c => store.on(c, () => refreshWalkthrough()));
  // A new page gets the full instructions again...
  window.addEventListener('hashchange', () => {
    minimized = false;
    setTimeout(refreshWalkthrough, 0);
  });
  // ...and once the user starts filling the page in, the guide tucks itself into
  // its header bar so it never sits on top of the fields they are working in.
  document.addEventListener('focusin', (e) => {
    const t = e.target;
    if (minimized || !t || !t.matches || !t.matches('input, textarea, select, [contenteditable="true"]')) return;
    if (t.closest(`#${GUIDE_ID}, #${TOUR_ID}, .modal-overlay, .modal`)) return;
    if (!document.getElementById(GUIDE_ID)) return;
    minimized = true;
    refreshWalkthrough();
  });
  window.addEventListener('resize', () => {
    const card = document.getElementById(GUIDE_ID);
    if (card) card.style.left = `${guideLeft()}px`;
    positionPop();
  });
}
