// ============================================
// RELAY — HIDE SYSTEM NOTIFICATIONS PREFERENCE
// ============================================
// Per-user view preference: whether the notifications list and the dashboard
// notifications widget hide machine-generated ("system") notifications.
//
// Storage: profiles.dashboard_layout (jsonb) for cloud accounts, so it rides
// along with the layout the user already syncs and needs no new column, plus a
// localStorage mirror for local/offline accounts where there is no profile row.
// profiles is the only place per-user settings the technicians update() path
// can't carry are written (same as start_location in store.js).
//
// Dashboard.saveLayout() rewrites dashboard_layout wholesale with
// {widgets, view, pins}, so it merges withNotificationPrefs() — and adopts the
// value it just fetched via adoptNotificationPref() — to keep this key alive.
//
// Precedence when the copies disagree: a toggle made in this session, then the
// mirror (rewritten on every toggle), then the stored layout copy, except that a
// layout copy fetched from the profiles row itself counts as current and beats a
// stale mirror on a device that hasn't seen the newer choice yet.

import { supabase } from './supabase.js';

const MIRROR_PREFIX = 'notificationsHideSystem_';
const PREF_KEY = 'notificationsHideSystem';
const CHANGE_EVENT = 'relay:notif-pref-changed';

let cachedToken = null;
let cachedValue = null; // true / false once known, null while unknown
// Bumped on every user-initiated write so a slower in-flight read can't land on
// top of a newer choice.
let writeVersion = 0;
// The account that writeVersion belongs to: the guard above is per session, but a
// different account signing in is not editing this one's preference.
let writeToken = null;

function currentUser() {
  if (typeof localStorage === 'undefined') return null;
  try {
    return JSON.parse(localStorage.getItem('currentUser') || 'null');
  } catch {
    return null;
  }
}

function tokenFor(user) {
  return user?.id ? `${user.id}|${user.companyId || ''}` : 'anon';
}

// Local accounts use `acct_…` ids that are not UUIDs and would 400 against the
// profiles table, so they stay on the localStorage mirror.
function isCloudUser(user) {
  return !!(user?.id && user.companyId && !String(user.companyId).startsWith('acct_'));
}

function mirrorKey(user) {
  return `${MIRROR_PREFIX}${user?.id || 'anon'}`;
}

function readMirror(user) {
  if (typeof localStorage === 'undefined') return null;
  const raw = localStorage.getItem(mirrorKey(user));
  return raw === 'true' ? true : raw === 'false' ? false : null;
}

function writeMirror(user, value) {
  if (typeof localStorage === 'undefined') return;
  localStorage.setItem(mirrorKey(user), value ? 'true' : 'false');
}

function notify() {
  if (typeof window === 'undefined' || typeof window.dispatchEvent !== 'function') return;
  window.dispatchEvent(new CustomEvent(CHANGE_EVENT));
}

// The cache belongs to one account — a stale value must never leak into the next
// session on the same machine.
function ensureUserCache() {
  const user = currentUser();
  const token = tokenFor(user);
  if (token !== cachedToken) {
    cachedToken = token;
    cachedValue = readMirror(user);
  }
  return user;
}

/** Current value, synchronously. Unknown (first ever load) means "show everything". */
export function getHideSystemNotifications() {
  ensureUserCache();
  return cachedValue === true;
}

/**
 * Adopts the preference found in a profiles.dashboard_layout document.
 * Dashboard.loadLayout() calls this with the document it just fetched so a
 * layout save can never overwrite a preference it hasn't read yet.
 *
 * The layout document is the weaker of the two carriers: the mirror is rewritten
 * on every toggle while the layout is only rewritten on layout edits, so a layout
 * copy can easily be older than what this device already knows. `cloud: true`
 * marks the copy that came from the profiles row itself — the same column
 * setHideSystemNotifications() writes — which is current and may outrank a stale
 * mirror on a device that hasn't seen the newer choice yet.
 */
export function adoptNotificationPref(layout, { cloud = false } = {}) {
  if (!layout || typeof layout[PREF_KEY] !== 'boolean') return;
  const user = ensureUserCache();
  // A toggle in this session is the newest local intent; no document may undo it.
  if (writeVersion > 0 && writeToken === cachedToken) return;
  if (!cloud && cachedValue !== null) return;
  if (cachedValue === layout[PREF_KEY]) return;
  cachedValue = layout[PREF_KEY];
  writeMirror(user, cachedValue);
  notify();
}

/**
 * Merges the known preference into a dashboard_layout document. When the value
 * is still unknown the document is passed through untouched (if it already
 * carried a preference, that one survives).
 */
export function withNotificationPrefs(layout) {
  // Resolve against the account that is signed in now, so a value cached for a
  // previous user can never ride along into this one's saved layout.
  ensureUserCache();
  const doc = { ...(layout || {}) };
  if (typeof cachedValue === 'boolean') doc[PREF_KEY] = cachedValue;
  return doc;
}

/**
 * Resolves the preference for the current user: the cloud profile when it
 * answers, otherwise the local mirror (offline / local account).
 */
export async function loadHideSystemNotifications() {
  const user = ensureUserCache();
  if (!isCloudUser(user)) return getHideSystemNotifications();

  const token = cachedToken;
  const version = writeVersion;
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('dashboard_layout')
      .eq('id', user.id)
      .single();
    if (error) throw error;
    // A toggle (or an account switch) happened while this was in flight.
    if (token !== cachedToken || version !== writeVersion) return getHideSystemNotifications();

    // Supabase reached and answered, so its copy wins: no key means the user has
    // never hidden anything, even if this device's mirror says otherwise.
    const value = data?.dashboard_layout?.[PREF_KEY] === true;
    if (value !== cachedValue) {
      cachedValue = value;
      writeMirror(user, value);
      notify();
    }
  } catch (e) {
    console.warn('Failed to load the notification preference:', e);
  }
  return getHideSystemNotifications();
}

/** Persists the preference for the current user and returns the stored value. */
export async function setHideSystemNotifications(value) {
  const user = ensureUserCache();
  const next = value === true;
  cachedValue = next;
  const version = ++writeVersion;
  writeToken = cachedToken;
  writeMirror(user, next);
  notify();

  if (!isCloudUser(user)) return next;

  try {
    // Read-modify-write: dashboard_layout also holds the widget canvas, and
    // replacing the column outright would throw the layout away.
    const { data, error } = await supabase
      .from('profiles')
      .select('dashboard_layout')
      .eq('id', user.id)
      .single();
    if (error) throw error;
    // A newer toggle is already on its way — let that one write.
    if (version !== writeVersion) return getHideSystemNotifications();

    const layout = data && typeof data.dashboard_layout === 'object' && data.dashboard_layout
      ? data.dashboard_layout
      : {};
    const { error: saveError } = await supabase
      .from('profiles')
      .update({ dashboard_layout: { ...layout, [PREF_KEY]: next } })
      .eq('id', user.id);
    if (saveError) throw saveError;
  } catch (e) {
    // The choice is still applied locally, so the toggle works offline; it just
    // won't follow the user to another device until a write succeeds.
    console.warn('Failed to save the notification preference:', e);
  }
  return next;
}

/** Subscribes to preference changes. Returns an unsubscribe function. */
export function onNotificationPrefChanged(callback) {
  if (typeof window === 'undefined' || typeof window.addEventListener !== 'function') return () => {};
  const handler = () => callback(getHideSystemNotifications());
  window.addEventListener(CHANGE_EVENT, handler);
  return () => window.removeEventListener(CHANGE_EVENT, handler);
}
