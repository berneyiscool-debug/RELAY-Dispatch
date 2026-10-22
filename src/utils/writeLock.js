// ============================================
// RELAY — EXPIRED-TRIAL WRITE LOCK
// ============================================
// When a cloud trial ends the account is read-only: `isReadOnly()` is true and
// `store.js` refuses every write. The app used to look fully interactive anyway,
// so a user could open a create/edit screen, fill everything in, and only find
// out at Save. This module moves that answer to the entry point: create, edit,
// add and save controls are greyed out with a subscribe prompt, create/edit
// routes are refused, and pages that are themselves editors (quotes, invoices,
// purchase orders, the document/email studios) have their fields locked too.
//
// The store gate stays in place as the final safety net for anything the UI
// cannot see (drag-and-drop, background autosave, assistant writes). This layer
// is only about not inviting work that cannot be saved.

import { store } from '../data/store.js';
import { isReadOnly } from './subscription.js';
import { router } from '../router.js';

export const WRITE_LOCKED_TOOLTIP = 'Subscribe to make changes';
export const SUBSCRIBE_PROMPT_ID = 'subscribe-required-prompt';

// Every create/edit/save affordance, matched by the conventions the app already
// uses: list-page `#btn-new-*`, detail-page `#btn-edit*`, inline `#btn-add-*` /
// `#btn-save*`, dashboard quick actions (`data-nav` to a `/new` route), and the
// Documents upload button. Anything outside these conventions can opt in with
// `data-write-action`.
//
// EXEMPT on purpose: navigation, search/filter, tabs, previews/print/PDF/export,
// delete, and the send/email actions. Those are either read-only already or cost
// nothing when they fail, and greying them would make a read-only account feel
// broken instead of paused.
export const EXTRA_WRITE_CONTROL_IDS = [
  // Entry points whose ids don't follow the btn-new/btn-edit convention.
  'btn-financials-new-quote',
  'btn-raise-po',
  'btn-po-new-stock',
  'btn-consolidated-invoice',
  'btn-header-generate-invoice',
  'btn-financials-deposit-inv',
  'btn-financials-progress-inv',
  'btn-financials-final-inv',
  // Copying or converting a record creates a new one.
  'btn-duplicate',
  'btn-duplicate-kit',
  'btn-convert-quote',
  'btn-convert-job',
  // Importing or uploading populates an editor / creates a document.
  'btn-import-quote',
  'btn-import-quote-parts',
  'btn-import-template',
  'btn-import-tasklist',
  'btn-import-stock',
  'btn-b2b-import',
  'btn-upload-file',
  'btn-upload-logo',
  'btn-trigger-upload',
  // Time and stock writes started from a detail page.
  'btn-log-time',
  'btn-log-time-tab',
  'btn-allocate-stock',
  'btn-transfer-stock',
  'btn-receive',
  'btn-issue',
  // Saves that don't sit on a btn-save id.
  'btn-lead-profile-save',
  // brny. Not a write itself, but every turn costs AI allowance and most of what
  // people ask for ends in a write the store refuses, so an expired trial pauses
  // it at the trigger too (see the guard in RelayAssistant.js).
  'btn-relay-assistant',
];

export const WRITE_CONTROL_SELECTOR = [
  '[data-write-action]',
  '[id^="btn-new-"]',
  '[id^="btn-edit"]',
  '[id^="btn-add-"]',
  '[id^="btn-save"]',
  '[id^="btn-create"]',
  '[data-nav$="/new"]',
  '[data-nav*="/new?"]',
  'a[href$="/new"]',
  'a[href*="/new?"]',
  // The help centre links by `data-path` rather than href.
  '[data-path$="/new"]',
  '[data-path*="/new?"]',
  '[data-act="upload"]',
  ...EXTRA_WRITE_CONTROL_IDS.map((id) => `[id="${id}"]`),
].join(',');

// Pages that are editors rather than read views. Their fields are locked while
// the account is read-only; every other page keeps its search, filters and
// navigation controls usable.
const EDITOR_ROUTE_PATTERNS = [
  /^\/quotes\/[^/]+$/,
  /^\/invoices\/[^/]+$/,
  /^\/purchase-orders\/[^/]+$/,
  /^\/settings\/documents$/,
  /^\/settings\/email-templates$/,
];

const LOCK_ATTR = 'data-write-locked';
const FIELD_LOCK_ATTR = 'data-write-field-locked';
const TOOLTIP_SAVED_ATTR = 'data-tooltip-saved';
const TITLE_SAVED_ATTR = 'data-title-saved';

// The current route without query string or hash, so the same helper works for
// a hash route, a plain path and a router override.
function cleanPath(path) {
  let clean = String(path || '').split('#').pop().split('?')[0];
  if (!clean.startsWith('/')) clean = '/' + clean;
  return clean.length > 1 ? clean.replace(/\/+$/, '') : clean;
}

function currentPath() {
  if (typeof window === 'undefined') return '/';
  return cleanPath(window.location.hash || '/');
}

// The lock only applies inside the signed-in app shell. The launch/login screen
// and the two portals own their own layout and can be shown to someone whose
// leftover company state would otherwise look read-only — greying out "Create
// Profile" on the launch screen would be a bug, not a nudge.
function outsideAppShell() {
  const path = currentPath();
  return path === '/login'
    || path.startsWith('/portal/')
    || path.startsWith('/contractor-portal');
}

// True when the UI should behave as read-only. Demo mode is a sandbox and is
// exempt, matching store._readOnlyBlocked().
export function isWriteLocked() {
  if (store.demoMode) return false;
  if (outsideAppShell()) return false;
  return isReadOnly();
}

// A create/edit form route: `/jobs/new`, `/people/:id/edit`, etc.
export function isWriteRoute(path) {
  const clean = cleanPath(path);
  return clean.endsWith('/new') || /\/edit$/.test(clean);
}

// A page whose whole surface is an editor.
export function isEditorRoute(path) {
  const clean = cleanPath(path);
  return EDITOR_ROUTE_PATTERNS.some((pattern) => pattern.test(clean));
}

// Where to send a blocked create/edit deep link instead of a dead end. Template
// editors live under Settings, so they return to their Settings tab rather than
// to a parent path that isn't a route.
export function writeRouteFallback(path) {
  const clean = cleanPath(path);
  if (clean.startsWith('/settings/forms')) return '/settings?tab=forms';
  if (clean.startsWith('/settings/quote-templates')) return '/settings?tab=quotes';
  if (clean === '/new' || clean.endsWith('/new')) {
    const parent = clean.slice(0, -4);
    return parent || '/';
  }
  if (/\/edit$/.test(clean)) return clean.slice(0, -5) || '/';
  return '/';
}

export function isWriteControl(el) {
  return !!(el && typeof el.matches === 'function' && el.matches(WRITE_CONTROL_SELECTOR));
}

function findWriteControl(target) {
  if (!target || typeof target.closest !== 'function') return null;
  return target.closest(WRITE_CONTROL_SELECTOR);
}

function markControl(el) {
  if (el.hasAttribute(LOCK_ATTR)) return;
  el.setAttribute(LOCK_ATTR, '');
  el.classList.add('is-write-locked');
  el.setAttribute('aria-disabled', 'true');
  // Keep the control's own explanation, and show the reason for the grey-out
  // for as long as it is locked. Some buttons carry a native `title` instead of
  // the app tooltip (the brny trigger does), so both are swapped.
  if (el.hasAttribute('data-tooltip')) {
    el.setAttribute(TOOLTIP_SAVED_ATTR, el.getAttribute('data-tooltip') || '');
  }
  el.setAttribute('data-tooltip', WRITE_LOCKED_TOOLTIP);
  if (el.hasAttribute('title')) {
    el.setAttribute(TITLE_SAVED_ATTR, el.getAttribute('title') || '');
    el.setAttribute('title', WRITE_LOCKED_TOOLTIP);
  }
}

function unmarkControl(el) {
  if (!el.hasAttribute(LOCK_ATTR)) return;
  el.removeAttribute(LOCK_ATTR);
  el.classList.remove('is-write-locked');
  el.removeAttribute('aria-disabled');
  if (el.hasAttribute(TOOLTIP_SAVED_ATTR)) {
    el.setAttribute('data-tooltip', el.getAttribute(TOOLTIP_SAVED_ATTR) || '');
    el.removeAttribute(TOOLTIP_SAVED_ATTR);
  } else {
    el.removeAttribute('data-tooltip');
  }
  if (el.hasAttribute(TITLE_SAVED_ATTR)) {
    el.setAttribute('title', el.getAttribute(TITLE_SAVED_ATTR) || '');
    el.removeAttribute(TITLE_SAVED_ATTR);
  }
}

// Checkbox/radio/file/colour/range cannot be made read-only, so those (and
// selects) are disabled. Everything else uses readOnly so the value stays
// selectable, copyable and legible — this is still a page the user can read.
function lockField(field) {
  if (!field || field.hasAttribute(FIELD_LOCK_ATTR)) return;
  if (field.tagName === 'INPUT' && (field.getAttribute('type') || '').toLowerCase() === 'hidden') return;

  field.setAttribute(FIELD_LOCK_ATTR, '');

  if (field.isContentEditable) {
    field.setAttribute('data-write-field-prev-contenteditable', field.getAttribute('contenteditable') || '');
    field.setAttribute('contenteditable', 'false');
    field.setAttribute('data-write-field-prev-tabindex', field.getAttribute('tabindex') || '');
    field.setAttribute('tabindex', '-1');
    return;
  }

  const tag = field.tagName;
  const type = (field.getAttribute('type') || '').toLowerCase();
  const useDisabled = tag === 'SELECT'
    || (tag === 'INPUT' && /^(checkbox|radio|file|color|range|date|time|datetime-local|month|week)$/.test(type));

  if (useDisabled) {
    field.setAttribute('data-write-field-prev-disabled', field.disabled ? '1' : '0');
    field.disabled = true;
  } else {
    field.setAttribute('data-write-field-prev-readonly', field.readOnly ? '1' : '0');
    field.readOnly = true;
  }
}

function unlockField(field) {
  if (!field || !field.hasAttribute(FIELD_LOCK_ATTR)) return;

  if (field.hasAttribute('data-write-field-prev-contenteditable')) {
    const previous = field.getAttribute('data-write-field-prev-contenteditable');
    if (previous) field.setAttribute('contenteditable', previous);
    else field.removeAttribute('contenteditable');
    const tabindex = field.getAttribute('data-write-field-prev-tabindex');
    if (tabindex !== null && tabindex !== '') field.setAttribute('tabindex', tabindex);
    else field.removeAttribute('tabindex');
  } else if (field.hasAttribute('data-write-field-prev-disabled')) {
    if (field.getAttribute('data-write-field-prev-disabled') !== '1') field.disabled = false;
  } else if (field.hasAttribute('data-write-field-prev-readonly')) {
    if (field.getAttribute('data-write-field-prev-readonly') !== '1') field.readOnly = false;
  }

  field.removeAttribute(FIELD_LOCK_ATTR);
  field.removeAttribute('data-write-field-prev-disabled');
  field.removeAttribute('data-write-field-prev-readonly');
  field.removeAttribute('data-write-field-prev-contenteditable');
  field.removeAttribute('data-write-field-prev-tabindex');
}

/**
 * Apply (or clear) the write lock for the current subscription state.
 * Idempotent; safe to call after every render.
 * @param {ParentNode} [root]
 * @param {{path?: string}} [options]
 */
export function applyWriteLock(root = document, { path = currentPath() } = {}) {
  const locked = isWriteLocked();
  const body = typeof document !== 'undefined' ? document.body : null;
  if (body) {
    body.classList.toggle('is-read-only', locked);
    if (locked) body.setAttribute('data-read-only', '');
    else body.removeAttribute('data-read-only');
  }

  if (!root || typeof root.querySelectorAll !== 'function') return;

  const controls = [];
  if (isWriteControl(root)) controls.push(root);
  controls.push(...root.querySelectorAll(WRITE_CONTROL_SELECTOR));
  for (const el of controls) {
    if (locked) markControl(el);
    else unmarkControl(el);
  }

  if (locked && isEditorRoute(path)) {
    for (const field of root.querySelectorAll('input, select, textarea, [contenteditable="true"]')) {
      lockField(field);
    }
  } else {
    for (const field of root.querySelectorAll(`[${FIELD_LOCK_ATTR}]`)) {
      unlockField(field);
    }
  }
}

// ---- Prompt -----------------------------------------------------------------

let promptEl = null;

function positionPrompt(prompt) {
  if (!prompt || typeof window === 'undefined') return;
  const banner = document.getElementById('relay-trial-banner');
  if (!banner) {
    prompt.style.bottom = '';
    return;
  }
  const rect = banner.getBoundingClientRect();
  if (!rect.height) return;
  const gap = 12; // keep the two cards visually separate
  prompt.style.bottom = `${Math.round(window.innerHeight - rect.top + gap)}px`;
}

function onPromptResize() {
  positionPrompt(promptEl);
}

function onPromptEscape(event) {
  if (event.key === 'Escape') hideSubscribeRequiredPrompt();
}

export function showSubscribeRequiredPrompt() {
  if (typeof document === 'undefined') return;
  hideSubscribeRequiredPrompt();

  const prompt = document.createElement('div');
  prompt.id = SUBSCRIBE_PROMPT_ID;
  prompt.className = 'cloud-prompt subscribe-prompt';
  prompt.setAttribute('role', 'status');
  prompt.innerHTML = `
    <span class="material-icons-outlined cloud-prompt-icon subscribe-prompt-icon" aria-hidden="true">lock</span>
    <div class="cloud-prompt-body">
      <div class="cloud-prompt-title">Your free trial has ended</div>
      <div class="cloud-prompt-text">Subscribe to keep creating and editing. Your data is safe, and you can export it at any time.</div>
      <div class="cloud-prompt-actions">
        <button type="button" class="btn btn-primary btn-sm" data-subscribe-prompt-subscribe>Subscribe</button>
        <button type="button" class="btn btn-secondary btn-sm" data-subscribe-prompt-dismiss>Not now</button>
      </div>
    </div>
    <button type="button" class="cloud-prompt-close" data-subscribe-prompt-dismiss aria-label="Dismiss">
      <span class="material-icons-outlined" aria-hidden="true">close</span>
    </button>
  `;

  prompt.querySelector('[data-subscribe-prompt-subscribe]')?.addEventListener('click', () => {
    hideSubscribeRequiredPrompt();
    router.navigate('/subscribe');
  });
  prompt.querySelectorAll('[data-subscribe-prompt-dismiss]').forEach((btn) => {
    btn.addEventListener('click', () => hideSubscribeRequiredPrompt());
  });

  document.body.appendChild(prompt);
  promptEl = prompt;
  positionPrompt(prompt);

  // No navigation listener: when the router refuses a create/edit deep link it
  // rewrites the hash back to the previous route, and hiding on that hashchange
  // would make this prompt flash and disappear. The card stays until dismissed
  // or the user subscribes.
  window.addEventListener('resize', onPromptResize);
  document.addEventListener('keydown', onPromptEscape);
}

export function hideSubscribeRequiredPrompt() {
  if (typeof window !== 'undefined') {
    window.removeEventListener('resize', onPromptResize);
  }
  if (typeof document !== 'undefined') {
    document.removeEventListener('keydown', onPromptEscape);
  }
  if (promptEl) {
    promptEl.remove();
    promptEl = null;
  }
  const existing = typeof document !== 'undefined' ? document.getElementById(SUBSCRIBE_PROMPT_ID) : null;
  if (existing) existing.remove();
}

// ---- Interaction guard ------------------------------------------------------

/**
 * The write control a click should be refused on, or null when the click is
 * allowed. Pure apart from the subscription state, so the rule is testable
 * without a DOM.
 */
export function blockedWriteControl(target) {
  if (!isWriteLocked()) return null;
  return findWriteControl(target);
}

function onCaptureClick(event) {
  const control = blockedWriteControl(event.target);
  if (!control) return;
  event.preventDefault();
  event.stopPropagation();
  event.stopImmediatePropagation();
  showSubscribeRequiredPrompt();
}

/** True when a submit on this form would be a blocked write. */
export function blockedWriteSubmit(form) {
  if (!isWriteLocked()) return false;
  // Only a form that offers a create/edit/save action is refused; search and
  // filter forms on read pages stay functional.
  if (!form || typeof form.querySelector !== 'function') return false;
  return !!form.querySelector(WRITE_CONTROL_SELECTOR);
}

function onCaptureSubmit(event) {
  if (!blockedWriteSubmit(event.target)) return;
  event.preventDefault();
  event.stopPropagation();
  event.stopImmediatePropagation();
  showSubscribeRequiredPrompt();
}

let installed = false;

/** Idempotent wiring for the capture guards and the re-render observer. */
export function installWriteLock(root = document) {
  if (installed) return false;
  installed = true;

  root.addEventListener('click', onCaptureClick, true);
  root.addEventListener('submit', onCaptureSubmit, true);

  // Pages and modals render and re-render constantly, and the app shell moves
  // header buttons into the breadcrumb after render. Re-apply on those changes
  // instead of asking every page to remember to do it.
  const body = typeof document !== 'undefined' ? document.body : null;
  const Observer = typeof MutationObserver !== 'undefined' ? MutationObserver : null;
  if (body && Observer) {
    let scheduled = false;
    const observer = new Observer(() => {
      if (scheduled || !isWriteLocked()) return;
      scheduled = true;
      const run = () => {
        scheduled = false;
        applyWriteLock(document);
      };
      if (typeof requestAnimationFrame === 'function') requestAnimationFrame(run);
      else setTimeout(run, 0);
    });
    observer.observe(body, { childList: true, subtree: true });
  }

  applyWriteLock(document);
  return true;
}
