// ============================================
// RELAY — TOP BAR TRIAL CHIP
// ============================================
// TrialBanner only speaks up in the final week; until then a new cloud account
// looks exactly like a paying one. This chip is the standing answer to "am I on
// a trial?" — visible from the day the trial starts, on every page, and one
// click away from Plan & Billing.
//
// It is deliberately quiet: no dismissal and no animation beyond the normal
// hover, and it disappears the moment the account subscribes or the trial
// expires (TrialBanner owns the expired read-only message).

import { isCloudUser, trialActive, trialDaysLeft, trialEndTime } from '../utils/subscription.js';
import { escapeHTML } from '../utils/security.js';
import { router } from '../router.js';

export const TRIAL_CHIP_ID = 'relay-trial-chip';
export const TRIAL_SLOT_ID = 'topbar-trial-slot';

// What the chip should say right now, or null when the account isn't on a
// running trial. Kept pure so the copy can be unit-tested without a DOM.
export function trialChipState() {
  if (!isCloudUser() || !trialActive()) return null;

  const days = trialDaysLeft();
  if (days === null) return null;

  const end = trialEndTime();
  const finalDay = end !== null && end - Date.now() <= 86400000;

  const label = finalDay ? 'Trial · ends today' : `Trial · ${days} days left`;

  const title = finalDay
    ? 'Your free trial ends today — open Plan & Billing to subscribe'
    : `Free trial — ${days === 1 ? '1 day' : `${days} days`} left. No card needed until it ends.`;

  return {
    label,
    title,
    tone: finalDay || days <= 2 ? 'warning' : 'info',
  };
}

export function renderTrialChip() {
  const state = trialChipState();
  if (!state) return '';
  return `
    <button type="button" id="${TRIAL_CHIP_ID}" class="topbar-trial-chip topbar-trial-chip--${state.tone}" title="${escapeHTML(state.title)}">
      <span class="material-icons-outlined" aria-hidden="true">schedule</span>
      <span class="topbar-trial-chip-label">${escapeHTML(state.label)}</span>
    </button>
  `;
}

// Rendered into a slot the top bar owns rather than appended to the action row:
// the bar is built once at boot, before the subscription block has loaded, and
// this keeps the chip in one predictable place across re-renders.
export function mountTrialChip(topbarEl) {
  const topbar = topbarEl || document.getElementById('topbar');
  if (!topbar) return;
  const slot = topbar.querySelector(`#${TRIAL_SLOT_ID}`);
  if (!slot) return;

  const html = renderTrialChip();
  if (!html) {
    if (slot.innerHTML) slot.innerHTML = '';
    return;
  }

  // Identical markup keeps the existing element (and its listener) — otherwise
  // every settings event would replace the button while it is being clicked.
  if (slot.innerHTML.trim() === html.trim()) return;

  slot.innerHTML = html;
  slot.querySelector(`#${TRIAL_CHIP_ID}`)?.addEventListener('click', () => {
    router.navigate('/settings?tab=billing');
  });
}
