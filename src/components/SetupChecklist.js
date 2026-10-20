// ============================================
// RELAY — GETTING STARTED HUB
// ============================================
// A compact pill in the dashboard's empty top-left slot that opens a panel with
// everything a new account should do first:
//
//   1. Your first job, start to finish — customer → quote → job → invoice, each
//      ticked off from live store data. "Guide me" starts the floating guide
//      (Walkthrough.js), which follows the user between pages.
//   2. Get to know RELAY — the pages tour, the settings tour and, for Cloud,
//      inviting the team (Local gets the Move to Cloud note instead).
//
// "Dismiss forever" hides the hub and the guide for good. It is a per-user flag
// (utils/onboarding.js), and Help → "Restart getting started" brings it back.
//
// The panel opens by itself once, the first time a user lands on the dashboard.
// ============================================

import { store } from '../data/store.js';
import { isReadOnly } from '../utils/subscription.js';
import { hasPermission } from '../utils/permissions.js';
import { openMigrationModal } from './CloudUpgrade.js';
import { escapeHTML } from '../utils/security.js';
import { workflowProgress } from '../utils/onboarding.js';
import {
  getOnboardingState, setOnboardingState, onOnboardingChange, workflowData,
  startGuide, stopGuide, startTour, refreshWalkthrough, bindWalkthroughListeners, isCloudAccount,
} from './Walkthrough.js';

export const CHECKLIST_ID = 'relay-setup-checklist';

let panelOpen = false;
let confirmingDismiss = false;

function canRunWorkflow() {
  try {
    return hasPermission('Quotes', 'create');
  } catch (e) {
    return true;
  }
}

function technicianCount() {
  try { return (store.getAll('technicians') || []).length; } catch (e) { return 0; }
}

// null when there is nothing to show — no user, dismissed, read-only, demo, or
// every item already done.
export function checklistState() {
  let user = null;
  try { user = JSON.parse(localStorage.getItem('currentUser') || 'null'); } catch (e) { /* none */ }
  if (!user || store.demoMode || isReadOnly()) return null;

  const state = getOnboardingState();
  if (state.dismissed) return null;

  const cloud = isCloudAccount();
  const workflow = canRunWorkflow() ? workflowProgress(workflowData()) : null;

  const extras = [
    { key: 'tour', icon: 'explore', label: 'Tour the app', hint: 'Every page and what it\'s for, in under a minute.', action: 'Start', done: state.tourDone },
    { key: 'settings', icon: 'tune', label: 'Explore settings', hint: 'Your logo, tax rates, templates, payments and more.', action: 'Start', done: state.settingsDone },
  ];
  if (cloud) {
    extras.push({ key: 'team', icon: 'group_add', label: 'Invite your team', hint: 'Give each technician their own login.', action: 'Invite', done: technicianCount() > 1 });
  }

  const items = [...(workflow ? workflow.steps : []), ...extras];
  const done = items.filter(i => i.done).length;
  if (done === items.length) return null;

  return { cloud, workflow, extras, done, total: items.length, state };
}

function ringSvg(pct) {
  const r = 9;
  const c = 2 * Math.PI * r;
  return `
    <svg class="setup-hub-ring" viewBox="0 0 24 24" aria-hidden="true">
      <circle cx="12" cy="12" r="${r}" class="setup-hub-ring-track"/>
      <circle cx="12" cy="12" r="${r}" class="setup-hub-ring-fill" stroke-dasharray="${c}" stroke-dashoffset="${c * (1 - pct)}"/>
    </svg>`;
}

function workflowHtml(wf) {
  const started = wf.done > 0;
  return `
    <section class="setup-hub-section">
      <div class="setup-hub-section-head">
        <span>Your first job, start to finish</span>
        <span class="setup-hub-section-count">${wf.done}/${wf.total}</span>
      </div>
      <ol class="setup-hub-steps">
        ${wf.steps.map((s, i) => {
          const current = wf.current && wf.current.key === s.key;
          return `
            <li class="setup-hub-step${s.done ? ' is-done' : ''}${current ? ' is-current' : ''}">
              <span class="setup-hub-step-dot">
                ${s.done ? '<span class="material-icons-outlined">check</span>' : i + 1}
              </span>
              <div class="setup-hub-step-text">
                <span class="setup-hub-step-label">${escapeHTML(s.label)}</span>
                ${current ? `<span class="setup-hub-step-hint">${escapeHTML(s.blurb)}</span>` : ''}
              </div>
            </li>`;
        }).join('')}
      </ol>
      ${wf.complete ? '' : `
        <button type="button" class="btn btn-primary setup-hub-cta" data-hub="guide">
          <span class="material-icons-outlined">near_me</span>
          ${started ? 'Continue the guide' : 'Guide me through it'}
        </button>`}
    </section>`;
}

function extraHtml(item) {
  return `
    <li class="setup-hub-extra${item.done ? ' is-done' : ''}">
      <span class="material-icons-outlined setup-hub-extra-icon">${item.done ? 'check_circle' : item.icon}</span>
      <div class="setup-hub-step-text">
        <span class="setup-hub-step-label">${escapeHTML(item.label)}</span>
        ${item.done ? '' : `<span class="setup-hub-step-hint">${escapeHTML(item.hint)}</span>`}
      </div>
      <button type="button" class="btn btn-secondary btn-sm" data-hub="${item.key}">${item.done ? 'Again' : escapeHTML(item.action)}</button>
    </li>`;
}

function panelHtml(s) {
  const fresh = s.done === 0;
  return `
    <div class="setup-hub-panel" role="dialog" aria-label="Getting started">
      <div class="setup-hub-hero">
        <span class="material-icons-outlined setup-hub-hero-icon">rocket_launch</span>
        <div>
          <div class="setup-hub-title">${fresh ? 'Welcome to RELAY' : 'Getting started'}</div>
          <p class="setup-hub-sub">${fresh
            ? 'Let\'s take your first customer from quote to paid invoice, then show you around.'
            : `${s.done} of ${s.total} done — pick up where you left off.`}</p>
        </div>
        <button type="button" class="setup-hub-close" data-hub="close" aria-label="Close" title="Close">
          <span class="material-icons-outlined">close</span>
        </button>
      </div>

      ${s.workflow ? workflowHtml(s.workflow) : ''}

      <section class="setup-hub-section">
        <div class="setup-hub-section-head"><span>Get to know RELAY</span></div>
        <ul class="setup-hub-extras">${s.extras.map(extraHtml).join('')}</ul>
      </section>

      ${s.cloud ? '' : `
        <div class="setup-checklist-note">
          <span class="material-icons-outlined">cloud</span>
          <div class="setup-checklist-note-text">
            <strong>Team logins and sync need RELAY Cloud</strong>
            <p>This profile runs on this device with a single owner sign-in. With RELAY Cloud everyone signs in with their own email and permissions.</p>
            <button type="button" class="btn btn-secondary btn-sm" data-hub="cloud">
              <span class="material-icons-outlined">cloud_upload</span> Move to cloud
            </button>
          </div>
        </div>`}

      <div class="setup-hub-foot">
        ${confirmingDismiss ? `
          <span class="setup-hub-confirm">Hide getting started for good? You can bring it back from Help.</span>
          <button type="button" class="btn btn-secondary btn-sm" data-hub="dismiss-cancel">Keep it</button>
          <button type="button" class="btn btn-danger btn-sm" data-hub="dismiss-confirm">Dismiss</button>
        ` : `
          <button type="button" class="setup-hub-dismiss" data-hub="dismiss">
            <span class="material-icons-outlined">visibility_off</span> Dismiss forever
          </button>
        `}
      </div>
    </div>`;
}

export function renderSetupChecklist() {
  const s = checklistState();
  if (!s) return '';
  const pct = s.done / s.total;
  return `
    <div id="${CHECKLIST_ID}" class="setup-hub${panelOpen ? ' is-open' : ''}">
      <button type="button" class="setup-hub-pill" data-hub="toggle" aria-expanded="${panelOpen}" aria-haspopup="dialog">
        ${ringSvg(pct)}
        <span class="setup-hub-pill-label">Getting started</span>
        <span class="setup-hub-pill-count">${s.done}/${s.total}</span>
        <span class="material-icons-outlined setup-hub-pill-caret">expand_more</span>
      </button>
      ${panelOpen ? panelHtml(s) : ''}
    </div>`;
}

function onHubClick(e) {
  const btn = e.target.closest('[data-hub]');
  if (!btn) return;
  const act = btn.dataset.hub;
  switch (act) {
    case 'toggle': panelOpen = !panelOpen; confirmingDismiss = false; break;
    case 'close': panelOpen = false; confirmingDismiss = false; break;
    case 'guide': panelOpen = false; startGuide(); break;
    case 'tour': panelOpen = false; startTour('pages'); break;
    case 'settings': panelOpen = false; startTour('settings'); break;
    case 'team': panelOpen = false; window.__relay?.router?.navigate('/settings?tab=users'); break;
    case 'cloud': openMigrationModal(); break;
    case 'dismiss': confirmingDismiss = true; break;
    case 'dismiss-cancel': confirmingDismiss = false; break;
    case 'dismiss-confirm':
      panelOpen = false;
      confirmingDismiss = false;
      setOnboardingState({ dismissed: true, guideActive: false });
      stopGuide();
      unmountSetupChecklist();
      import('./Notifications.js').then(({ showToast }) =>
        showToast('Getting started hidden. Restart it any time from Help.', 'info'));
      return;
    default: return;
  }
  refreshSetupChecklist();
}

function onOutside(e) {
  if (!panelOpen) return;
  const el = document.getElementById(CHECKLIST_ID);
  if (el && !el.contains(e.target)) {
    panelOpen = false;
    confirmingDismiss = false;
    refreshSetupChecklist();
  }
}

function onKey(e) {
  if (e.key === 'Escape' && panelOpen) {
    panelOpen = false;
    confirmingDismiss = false;
    refreshSetupChecklist();
  }
}

// Writes into a dedicated header slot rather than replacing it wholesale, so the
// slot can hold the page title too.
export function mountSetupChecklist(host) {
  if (!host) return;

  // Open the panel by itself the very first time, so a new user sees it.
  const state = getOnboardingState();
  if (!state.welcomed && !state.dismissed && checklistState()) {
    panelOpen = true;
    setOnboardingState({ welcomed: true });
  }

  const html = renderSetupChecklist();
  if (!html) {
    unmountSetupChecklist();
    return;
  }

  const existing = host.querySelector(`#${CHECKLIST_ID}`);
  if (existing) existing.outerHTML = html;
  else host.insertAdjacentHTML('beforeend', html);

  document.getElementById(CHECKLIST_ID)?.addEventListener('click', onHubClick);
}

export function unmountSetupChecklist() {
  document.getElementById(CHECKLIST_ID)?.remove();
}

// Re-rendered in place so the hub can cross items off the moment the user
// finishes them on the page underneath.
export function refreshSetupChecklist() {
  const el = document.getElementById(CHECKLIST_ID);
  if (!el || !el.parentNode) return;
  mountSetupChecklist(el.parentNode);
}

let listenersBound = false;

// Bound once per session; store.on has no matching removal for a module-lifetime
// subscriber, and a second bind would double-render.
export function bindChecklistStoreListeners() {
  if (listenersBound) return;
  listenersBound = true;
  bindWalkthroughListeners();
  ['customers', 'quotes', 'jobs', 'invoices', 'technicians'].forEach(event => {
    store.on(event, () => refreshSetupChecklist());
  });
  onOnboardingChange(() => refreshSetupChecklist());
  document.addEventListener('mousedown', onOutside);
  document.addEventListener('keydown', onKey);
  refreshWalkthrough();
}
