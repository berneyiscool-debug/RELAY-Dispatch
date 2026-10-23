// ============================================
// RELAY — TRIAL WELCOME MARKER
// ============================================
// Signup is the one moment the app knows for certain that a trial has just
// started. The provisioning path and the login shell are separate modules, so
// the fact is handed between them through a tab-scoped marker instead of a
// function parameter every caller has to thread through.
//
// sessionStorage keeps the marker in the tab that signed up; a second tab (or a
// later sign-in) must not replay the welcome for an account that is days into
// its trial. Falls back to memory when storage is unavailable.

export const TRIAL_WELCOME_KEY = 'relay_trial_welcome_pending';

const memoryTab = new Map();

function readTab(key) {
  try {
    return sessionStorage.getItem(key);
  } catch (_) {
    return memoryTab.has(key) ? memoryTab.get(key) : null;
  }
}

function writeTab(key, value) {
  try {
    sessionStorage.setItem(key, value);
  } catch (_) {
    memoryTab.set(key, value);
  }
}

function removeTab(key) {
  try {
    sessionStorage.removeItem(key);
  } catch (_) {
    memoryTab.delete(key);
  }
}

/** Remember that this tab has just started a trial for `companyId`. */
export function markTrialWelcomePending(companyId) {
  if (!companyId) return;
  writeTab(TRIAL_WELCOME_KEY, String(companyId));
}

/**
 * Read and clear the pending welcome.
 * @returns {string|null} the company id the trial was started for
 */
export function consumeTrialWelcomePending() {
  const companyId = readTab(TRIAL_WELCOME_KEY);
  if (companyId) removeTab(TRIAL_WELCOME_KEY);
  return companyId;
}

/** Test/cleanup helper — drop the marker without showing anything. */
export function clearTrialWelcomePending() {
  removeTab(TRIAL_WELCOME_KEY);
}
