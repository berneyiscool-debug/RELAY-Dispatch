// ============================================
// RELAY — CLOUD TRIAL & READ-ONLY BANNER
// ============================================
// A cloud account on the no-card trial gets a countdown in its final week, and
// an account whose trial has run out stays inside the app in read-only mode
// with this banner as the one persistent affordance. The banner is deliberately
// the place the subscribe CTA lives instead of a /subscribe redirect: an expired
// trial keeps every read, every export and every navigation working, so the user
// can look at their data and decide rather than being locked out of it.
//
// The store blocks the actual writes (see store.js _readOnlyBlocked), which also
// fires a throttled toast. That toast is the immediate feedback; this banner is
// the standing explanation.

import { isReadOnly, readOnlyReason, subscriptionRequired, trialActive, trialDaysLeft, trialEndTime } from '../utils/subscription.js';
import { downloadDataSnapshot } from '../utils/dataBackup.js';
import { showToast } from './Notifications.js';
import { escapeHTML } from '../utils/security.js';

export const BANNER_ID = 'relay-trial-banner';

// How many days of trial are left when the countdown starts showing. Earlier
// than this and the banner is noise on a trial the user has barely started.
const COUNTDOWN_FROM_DAYS = 7;

// Dismissal is per calendar day, so a short trial still gets one reminder a day
// without the banner reappearing on every navigation.
const DISMISS_KEY = 'relay_trial_banner_dismissed_on';

function today() {
  return new Date().toISOString().slice(0, 10);
}

function dismissedToday() {
  try {
    return localStorage.getItem(DISMISS_KEY) === today();
  } catch (e) {
    return false;
  }
}

function dismissForToday() {
  try {
    localStorage.setItem(DISMISS_KEY, today());
  } catch (e) {
    // Storage unavailable (private mode): the banner just reappears next render.
  }
}

// What the banner should say right now, or null when there is nothing to say.
// Kept separate from the markup so the copy can be unit-tested without a DOM.
export function trialBannerState() {
  // The paywall owns this account's messaging, and READ-ONLY must not be shown
  // to a comp grant or an active subscriber — isReadOnly() already excludes both.
  if (subscriptionRequired()) return null;

  if (isReadOnly()) {
    return {
      tone: 'danger',
      icon: 'lock',
      title: 'Your free trial has ended',
      body: readOnlyReason() || 'Changes are paused until you subscribe. Your data is safe.',
      dismissible: false,
      showExport: true,
    };
  }

  if (!trialActive()) return null;

  const days = trialDaysLeft();
  if (days === null || days > COUNTDOWN_FROM_DAYS) return null;
  if (dismissedToday()) return null;

  // The day count rounds up, so a trial with hours on the clock still reports 1.
  // Anything inside the final 24 hours is "today" instead of a wrong-ish "1 day".
  const endTime = trialEndTime();
  const finalDay = endTime !== null && endTime - Date.now() <= 86400000;
  const when = finalDay
    ? 'today'
    : days === 1 ? 'in 1 day' : `in ${days} days`;

  return {
    tone: days <= 2 ? 'warning' : 'info',
    icon: 'schedule',
    title: finalDay ? 'Your free trial ends today' : `${days} days left in your free trial`,
    body: `No card is needed yet. Subscribe before your trial ends ${when} to keep editing — your data stays put either way.`,
    dismissible: true,
    showExport: false,
  };
}

export function renderTrialBanner() {
  const state = trialBannerState();
  if (!state) return '';

  // The banner reuses the `.cloud-prompt` popup surface (fixed bottom-right card,
  // hairline border, soft shadow) so it reads the same size and sits in the same
  // spot as the "create a Cloud account" prompt. Only the icon chip tone differs:
  // danger for the expired read-only state, warning/info for the countdown (see
  // `.trial-banner-icon--*` in components.css).
  return `
    <div id="${BANNER_ID}" class="cloud-prompt trial-banner" role="status">
      <span class="material-icons-outlined cloud-prompt-icon trial-banner-icon trial-banner-icon--${state.tone}" aria-hidden="true">${state.icon}</span>
      <div class="cloud-prompt-body">
        <div class="cloud-prompt-title">${escapeHTML(state.title)}</div>
        <div class="cloud-prompt-text">${escapeHTML(state.body)}</div>
        <div class="cloud-prompt-actions">
          ${state.showExport ? '<button type="button" id="trial-banner-export" class="btn btn-secondary btn-sm">Export data</button>' : ''}
          <button type="button" id="trial-banner-subscribe" class="btn btn-primary btn-sm">Subscribe</button>
        </div>
      </div>
      ${state.dismissible ? '<button type="button" id="trial-banner-dismiss" class="cloud-prompt-close" title="Hide for today" aria-label="Hide for today"><span class="material-icons-outlined" aria-hidden="true">close</span></button>' : ''}
    </div>
  `;
}

// Mounted next to the page container rather than inside it: pages replace their
// own innerHTML on every render, which would delete the banner.
//
// The banner is `position: fixed`, so navigation never needs to move it. The
// rendered HTML is cached so a route change doesn't re-insert an identical
// element — that would replay the `.cloud-prompt` entry animation on every page.
let lastRenderedHtml = '';

export function mountTrialBanner(pageContainer) {
  if (!pageContainer || !pageContainer.parentNode) return;
  const existing = document.getElementById(BANNER_ID);
  const html = renderTrialBanner();

  if (!html) {
    if (existing) existing.remove();
    lastRenderedHtml = '';
    return;
  }

  if (existing && html === lastRenderedHtml) {
    return; // unchanged — keep the element and its listeners as they are
  }

  if (existing) {
    existing.outerHTML = html;
  } else {
    pageContainer.insertAdjacentHTML('beforebegin', html);
  }
  lastRenderedHtml = html;

  document.getElementById('trial-banner-subscribe')?.addEventListener('click', () => {
    window.__relay?.router?.navigate('/subscribe');
  });

  document.getElementById('trial-banner-export')?.addEventListener('click', () => {
    try {
      const file = downloadDataSnapshot('relay-backup');
      showToast(`Downloaded ${file}`, 'success');
    } catch (err) {
      console.error('Trial banner export failed:', err);
      showToast('Could not download your data copy.', 'error');
    }
  });

  document.getElementById('trial-banner-dismiss')?.addEventListener('click', () => {
    dismissForToday();
    document.getElementById(BANNER_ID)?.remove();
  });
}

export function unmountTrialBanner() {
  document.getElementById(BANNER_ID)?.remove();
}
