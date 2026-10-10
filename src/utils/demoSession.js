// ============================================
// RELAY — DEMO MODE SESSION
// ============================================
// Demo mode swaps the whole app onto the Harbourline Electrical & Air demo
// business (data/demoDataset.js), held in memory only. Nothing is written to
// IndexedDB, the local folder or Supabase, so a demo can never touch the
// account it was opened from — and no real business can be run from it.
//
// The flag lives in sessionStorage, so it belongs to one browser tab: a reload
// rebuilds a fresh demo (the reset), closing the tab or signing out ends it,
// and other tabs keep working on the real account.
//
// No imports on purpose: store.js, the geocoder and the router guard all read
// this, and it must not pull any of them into a cycle.

const KEY = 'relay_demo_mode';

export function isDemoSession() {
  try {
    return typeof sessionStorage !== 'undefined' && sessionStorage.getItem(KEY) === '1';
  } catch {
    return false;
  }
}

function restart() {
  window.location.hash = '#/';
  window.location.reload();
}

/** Enter demo mode in this tab and restart the app on the demo business. */
export function enterDemoMode() {
  try { sessionStorage.setItem(KEY, '1'); } catch { /* private mode: nothing to enter */ }
  restart();
}

/** Throw away every change made in the demo and start it again from scratch. */
export function resetDemoMode() {
  restart();
}

/** Leave demo mode and reload the real account. */
export function exitDemoMode() {
  clearDemoFlag();
  restart();
}

/** Drop the flag without reloading — used when the session ends (sign-out). */
export function clearDemoFlag() {
  try { sessionStorage.removeItem(KEY); } catch { /* nothing to clear */ }
}
