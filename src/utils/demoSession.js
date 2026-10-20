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
// Hash parameter that carries demo mode into a tab the demo opens (see demoTabUrl).
const HANDOFF_PARAM = 'demo';

export function isDemoSession() {
  try {
    return typeof sessionStorage !== 'undefined' && sessionStorage.getItem(KEY) === '1';
  } catch {
    return false;
  }
}

/**
 * The URL for a new tab opened from this one. Tabs are opened with `noopener`,
 * which starts them with empty sessionStorage, so a demo tab marks the URL and
 * the new tab adopts the flag on boot. Without it, "open in new tab" from the
 * demo landed on the real account.
 */
export function demoTabUrl(url) {
  if (!isDemoSession() || !url || !url.startsWith('#/')) return url;
  return `${url}${url.includes('?') ? '&' : '?'}${HANDOFF_PARAM}=1`;
}

// Runs on import, before the store (which imports this module) decides which
// data to load. The marker is stripped so the router and bookmarks never see it.
function adoptDemoHandoff() {
  if (typeof window === 'undefined' || !window.location) return;
  const hash = window.location.hash || '';
  const q = hash.indexOf('?');
  if (q === -1) return;
  const params = new URLSearchParams(hash.slice(q + 1));
  if (params.get(HANDOFF_PARAM) !== '1') return;
  try { sessionStorage.setItem(KEY, '1'); } catch { /* private mode: stays on the account */ }
  params.delete(HANDOFF_PARAM);
  const rest = params.toString();
  const cleaned = hash.slice(0, q) + (rest ? `?${rest}` : '');
  try {
    window.history.replaceState(window.history.state, '', `${window.location.pathname}${window.location.search}${cleaned}`);
  } catch {
    window.location.hash = cleaned;
  }
}
adoptDemoHandoff();

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
