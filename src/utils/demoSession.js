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
// A visitor with no account can open the demo too (`#/demo`, or "Try the demo"
// on the launch screen). They run as a guest owner held in this tab only —
// never in localStorage, which every tab shares — and getSessionUser()
// (pages/auth/session.js) hands that guest to the rest of the app.
//
// No imports on purpose: store.js, the geocoder and the router guard all read
// this, and it must not pull any of them into a cycle.

const KEY = 'relay_demo_mode';
const GUEST_KEY = 'relay_demo_guest';
// Where the demo was opened from, held until the start is recorded (see
// takeDemoStartSource) so a reload — the reset — is not counted as a new start.
const START_KEY = 'relay_demo_start';
// Set when a guest leaves the demo to sign up, so the launch screen opens on
// the signup form (see takeSignupRequest).
const SIGNUP_KEY = 'relay_demo_signup';
// Hash parameter that carries demo mode into a tab the demo opens (see demoTabUrl).
const HANDOFF_PARAM = 'demo';
// Public entry route: the website and the launch screen link here.
export const DEMO_ROUTE = '/demo';

// The owner a guest plays. The id follows the local single-user shape
// (`<account>_admin`) that the boot guard in main.js accepts, and the name is
// the demo dataset's default owner (demoDataset.test.js keeps them in step).
export const DEMO_GUEST_USER = Object.freeze({
  id: 'acct_demo_admin',
  companyId: 'acct_demo',
  name: 'Mick Harbour',
  email: 'owner@harbourline-electrical.example',
  role: 'admin',
  userTypeId: 'demo_ut_admin',
  userTypeName: 'Admin',
  color: '#FF5C00',
  demoGuest: true,
});

function sessionGet(key) {
  try {
    return typeof sessionStorage !== 'undefined' ? sessionStorage.getItem(key) : null;
  } catch {
    return null;
  }
}

function sessionSet(key, value) {
  try { sessionStorage.setItem(key, value); } catch { /* private mode: nothing to keep */ }
}

function sessionRemove(key) {
  try { sessionStorage.removeItem(key); } catch { /* nothing to clear */ }
}

export function isDemoSession() {
  return sessionGet(KEY) === '1';
}

/** True when this tab runs the demo as a guest, with no account behind it. */
export function isGuestDemo() {
  return isDemoSession() && sessionGet(GUEST_KEY) === '1';
}

/** The guest owner for a guest demo tab, or null. */
export function getDemoGuest() {
  return isGuestDemo() ? { ...DEMO_GUEST_USER } : null;
}

// True when an account is signed in on this browser. Only consulted when a
// demo link is opened, to decide between the account's demo and a guest one.
function hasSignedInAccount() {
  try {
    const user = JSON.parse(localStorage.getItem('currentUser') || 'null');
    return !!(user && user.id);
  } catch {
    return false;
  }
}

function startDemo({ guest, source }) {
  sessionSet(KEY, '1');
  if (guest) sessionSet(GUEST_KEY, '1'); else sessionRemove(GUEST_KEY);
  if (source) sessionSet(START_KEY, source);
}

/**
 * The source of a demo start that has not been recorded yet ('launch', 'site',
 * 'in_app'), or null. Reading it clears it, so each start is counted once.
 */
export function takeDemoStartSource() {
  const source = sessionGet(START_KEY);
  if (source) sessionRemove(START_KEY);
  return source;
}

/**
 * The URL for a new tab opened from this one. Tabs are opened with `noopener`,
 * which starts them with empty sessionStorage, so a demo tab marks the URL and
 * the new tab adopts the flag on boot. Without it, "open in new tab" from the
 * demo landed on the real account.
 */
export function demoTabUrl(url) {
  if (!isDemoSession() || !url || !url.startsWith('#/')) return url;
  return `${url}${url.includes('?') ? '&' : '?'}${HANDOFF_PARAM}=${isGuestDemo() ? 'guest' : '1'}`;
}

function replaceHash(hash) {
  try {
    window.history.replaceState(window.history.state, '', `${window.location.pathname}${window.location.search}${hash}`);
  } catch {
    window.location.hash = hash;
  }
}

/**
 * Adopts a demo link: the public `#/demo` entry (a guest demo, or the signed-in
 * account's own demo when there is one) and the `?demo=` marker a demo tab puts
 * on the tabs it opens. Runs on import, before the store (which imports this
 * module) decides which data to load. Markers are stripped so the router and
 * bookmarks never see them.
 */
export function adoptDemoLink() {
  if (typeof window === 'undefined' || !window.location) return;
  const hash = window.location.hash || '';
  const q = hash.indexOf('?');
  const path = q === -1 ? hash.slice(1) : hash.slice(1, q);
  const params = new URLSearchParams(q === -1 ? '' : hash.slice(q + 1));

  if (path === DEMO_ROUTE) {
    // `from` names where the link was, for the demo funnel ('site' from the website).
    const source = params.get('from') === 'site' ? 'site' : 'link';
    startDemo({ guest: !hasSignedInAccount(), source });
    replaceHash('#/');
    return;
  }

  const handoff = params.get(HANDOFF_PARAM);
  if (handoff !== '1' && handoff !== 'guest') return;
  startDemo({ guest: handoff === 'guest' });
  params.delete(HANDOFF_PARAM);
  const rest = params.toString();
  replaceHash(hash.slice(0, q) + (rest ? `?${rest}` : ''));
}
adoptDemoLink();

function restart() {
  window.location.hash = '#/';
  window.location.reload();
}

/** Enter demo mode in this tab and restart the app on the demo business. */
export function enterDemoMode() {
  startDemo({ guest: false, source: 'in_app' });
  restart();
}

/** Open the demo with no account (the launch screen's "Try the demo"). */
export function enterGuestDemo(source = 'launch') {
  startDemo({ guest: true, source });
  restart();
}

/** Throw away every change made in the demo and start it again from scratch. */
export function resetDemoMode() {
  restart();
}

/** Leave demo mode and reload the real account — or, for a guest, the launch screen. */
export function exitDemoMode() {
  clearDemoFlag();
  restart();
}

/** Leave a guest demo for the launch screen's signup form. */
export function exitDemoToSignup() {
  clearDemoFlag();
  sessionSet(SIGNUP_KEY, '1');
  restart();
}

// Held for the page load: the launch screen can be drawn more than once on boot.
let signupRequested = null;

/** True for the page load after exitDemoToSignup(): the launch screen should open on signup. */
export function takeSignupRequest() {
  if (signupRequested === null) {
    signupRequested = sessionGet(SIGNUP_KEY) === '1';
    if (signupRequested) sessionRemove(SIGNUP_KEY);
  }
  return signupRequested;
}

/** Drop the flag without reloading — used when the session ends (sign-out). */
export function clearDemoFlag() {
  sessionRemove(KEY);
  sessionRemove(GUEST_KEY);
  sessionRemove(START_KEY);
}
