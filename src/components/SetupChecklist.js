// ============================================
// RELAY — FIRST-RUN SETUP CHECKLIST
// ============================================
// A short list of first actions for a brand-new install: add a technician,
// create a job, invite a second user. Nothing here is ever clicked to tick off —
// every item is derived from live store data, so the card retires itself once the
// account is actually running and can never nag about work already done.
//
// Dismissal is a plain per-user localStorage flag. It deliberately does not go
// into the dashboard_layout document next to notificationPrefs: Dashboard.saveLayout()
// rewrites that document wholesale, so a second key in it needs merge-and-adopt
// plumbing in two more places for no real gain. The checklist is derived state, so
// on a second device it re-appears once and then ticks itself off again.
//
// Local mode gets a different list, because it genuinely has no team to invite and
// no technician records to add — see LOCAL_ITEMS below.

import { store } from '../data/store.js';
import { isCloudUser, isReadOnly } from '../utils/subscription.js';
import { openMigrationModal } from './CloudUpgrade.js';
import { escapeHTML } from '../utils/security.js';

export const CHECKLIST_ID = 'relay-setup-checklist';

const DISMISS_PREFIX = 'relay_setup_checklist_dismissed_';

// The Cloud list is the spec's: technician → job → team. Everything is a real
// write, so a read-only account is not offered the list at all.
const CLOUD_ITEMS = [
  {
    key: 'technician',
    label: 'Add a technician',
    hint: 'Give someone a login so jobs can be assigned to them.',
    action: 'Add',
    path: '/settings?tab=users',
    done: () => (store.getAll('technicians') || []).length > 0,
  },
  {
    key: 'job',
    label: 'Create a job',
    hint: 'A job is the work you quote, schedule and invoice against.',
    action: 'Create',
    path: '/jobs/new',
    done: () => (store.getAll('jobs') || []).length > 0,
  },
  {
    key: 'team',
    label: 'Invite your team',
    hint: 'A second sign-in so more than one person can use the account.',
    action: 'Invite',
    path: '/settings?tab=users',
    // More than one technician means somebody else was added. One technician is
    // the owner finishing their own setup.
    done: () => (store.getAll('technicians') || []).length > 1,
  },
];

// Local is one person on one device: the Users tab shows the Cloud notice rather
// than a technician form (Settings.renderLocalTeamNotice), and store.getAll('technicians')
// synthesises the owner as the only technician, so an "Add a technician" item would
// arrive pre-ticked and un-actionable. The two items below are the ones a local
// profile can genuinely complete, and the team item is replaced by a Cloud card.
const LOCAL_ITEMS = [
  {
    key: 'job',
    label: 'Create a job',
    hint: 'A job is the work you quote, schedule and invoice against.',
    action: 'Create',
    path: '/jobs/new',
    done: () => (store.getAll('jobs') || []).length > 0,
  },
  {
    key: 'lead',
    label: 'Add your first lead',
    hint: 'Capture an enquiry so it is not lost in a phone call.',
    action: 'Add',
    path: '/leads/new',
    done: () => (store.getAll('leads') || []).length > 0,
  },
];

const LOCAL_NOTE = {
  title: 'Team logins and sync need RELAY Cloud',
  body: 'This profile runs on this device, so it has a single owner sign-in and no staff logins to set up here. Team logins are available with RELAY Cloud, where everyone signs in with their own email address and permissions.',
};

function currentUser() {
  try {
    return JSON.parse(localStorage.getItem('currentUser') || 'null');
  } catch (e) {
    return null;
  }
}

function dismissKey(user) {
  return `${DISMISS_PREFIX}${(user && user.id) || 'anon'}`;
}

function isDismissed(user) {
  try {
    return localStorage.getItem(dismissKey(user)) === '1';
  } catch (e) {
    return false;
  }
}

export function dismissSetupChecklist() {
  try {
    localStorage.setItem(dismissKey(currentUser()), '1');
  } catch (e) {
    // Private mode: dismissing just won't survive a reload.
  }
}

// null when there is nothing to show — no user yet, already dismissed, every item
// done, or the account is read-only so the list could not be acted on anyway.
export function checklistState() {
  const user = currentUser();
  if (!user) return null;
  if (isDismissed(user)) return null;
  if (isReadOnly()) return null;

  // Resolve the list before building anything: caller-supplied templates are only
  // read once, so a throwing getAll can't half-render a card.
  let items;
  try {
    items = (isCloudUser() ? CLOUD_ITEMS : LOCAL_ITEMS).map(({ key, label, hint, action, path, done }) => ({
      key, label, hint, action, path, done: !!done(),
    }));
  } catch (e) {
    return null;
  }

  const done = items.filter(i => i.done).length;
  if (done === items.length) return null;

  return {
    cloud: isCloudUser(),
    items,
    done,
    total: items.length,
    note: isCloudUser() ? null : LOCAL_NOTE,
  };
}

function itemHtml(item) {
  return `
    <li class="setup-checklist-item${item.done ? ' is-done' : ''}">
      <span class="material-icons-outlined setup-checklist-tick">${item.done ? 'check_circle' : 'radio_button_unchecked'}</span>
      <div class="setup-checklist-text">
        <span class="setup-checklist-label">${escapeHTML(item.label)}</span>
        ${item.done ? '' : `<span class="setup-checklist-hint">${escapeHTML(item.hint)}</span>`}
      </div>
      ${item.done ? '' : `<button type="button" class="btn btn-secondary btn-sm setup-checklist-go" data-path="${escapeHTML(item.path)}">${escapeHTML(item.action)}</button>`}
    </li>
  `;
}

export function renderSetupChecklist() {
  const state = checklistState();
  if (!state) return '';

  const pct = Math.round((state.done / state.total) * 100);
  return `
    <div id="${CHECKLIST_ID}" class="setup-checklist" role="region" aria-label="Getting started">
      <div class="setup-checklist-head">
        <span class="material-icons-outlined setup-checklist-icon">rocket_launch</span>
        <span class="setup-checklist-title">Getting started</span>
        <span class="setup-checklist-count">${state.done} of ${state.total}</span>
        <button type="button" class="setup-checklist-dismiss" id="setup-checklist-dismiss" title="Hide for this user" aria-label="Hide for this user">
          <span class="material-icons-outlined">close</span>
        </button>
      </div>
      <div class="setup-checklist-track"><span style="width:${pct}%"></span></div>
      <ul class="setup-checklist-items">${state.items.map(itemHtml).join('')}</ul>
      ${state.note ? `
        <div class="setup-checklist-note">
          <span class="material-icons-outlined">cloud</span>
          <div class="setup-checklist-note-text">
            <strong>${escapeHTML(state.note.title)}</strong>
            <p>${escapeHTML(state.note.body)}</p>
            <button type="button" class="btn btn-secondary btn-sm" id="setup-checklist-cloud">
              <span class="material-icons-outlined">cloud_upload</span> Move to cloud
            </button>
          </div>
        </div>` : ''}
    </div>
  `;
}

// Writes into a dedicated header slot rather than replacing it wholesale, so the
// slot can hold the page title too.
export function mountSetupChecklist(host) {
  if (!host) return;
  const html = renderSetupChecklist();
  if (!html) {
    unmountSetupChecklist();
    return;
  }

  const existing = host.querySelector(`#${CHECKLIST_ID}`);
  if (existing) existing.outerHTML = html;
  else host.insertAdjacentHTML('beforeend', html);

  const card = document.getElementById(CHECKLIST_ID);
  if (!card) return;

  card.querySelector('#setup-checklist-dismiss')?.addEventListener('click', () => {
    dismissSetupChecklist();
    unmountSetupChecklist();
  });
  card.querySelector('#setup-checklist-cloud')?.addEventListener('click', () => openMigrationModal());
  card.querySelectorAll('.setup-checklist-go').forEach(btn => {
    btn.addEventListener('click', () => {
      window.__relay?.router?.navigate(btn.dataset.path);
    });
  });
}

export function unmountSetupChecklist() {
  document.getElementById(CHECKLIST_ID)?.remove();
}

// Re-rendered in place so the card can cross itself off the moment the user
// finishes an item on the page underneath it.
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
  ['jobs', 'technicians', 'leads'].forEach(event => {
    store.on(event, () => refreshSetupChecklist());
  });
}
