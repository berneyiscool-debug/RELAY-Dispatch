import { test, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert/strict';

import {
  getHideSystemNotifications,
  adoptNotificationPref,
  withNotificationPrefs,
  loadHideSystemNotifications,
  setHideSystemNotifications,
  onNotificationPrefChanged,
} from './notificationPrefs.js';

const PREF_KEY = 'notificationsHideSystem';

let storage;
let listeners;
let dispatched;

// The module caches per account, so each test uses a distinct user id to
// simulate a fresh session instead of reaching into module internals.
let userSeq = 0;
function signIn(extra = {}) {
  userSeq += 1;
  const user = { id: `user-${userSeq}`, ...extra };
  storage.set('currentUser', JSON.stringify(user));
  return user;
}

function mirrorOf(user) {
  return storage.get(`notificationsHideSystem_${user.id}`) ?? null;
}

beforeEach(() => {
  storage = new Map();
  listeners = new Map();
  dispatched = [];
  globalThis.localStorage = {
    getItem: key => (storage.has(key) ? storage.get(key) : null),
    setItem: (key, value) => storage.set(key, String(value)),
    removeItem: key => storage.delete(key),
    clear: () => storage.clear(),
  };
  globalThis.window = {
    addEventListener: (type, handler) => {
      if (!listeners.has(type)) listeners.set(type, new Set());
      listeners.get(type).add(handler);
    },
    removeEventListener: (type, handler) => listeners.get(type)?.delete(handler),
    dispatchEvent: event => {
      dispatched.push(event.type);
      listeners.get(event.type)?.forEach(handler => handler(event));
      return true;
    },
  };
});

afterEach(() => {
  delete globalThis.localStorage;
  delete globalThis.window;
});

test('defaults to showing everything when nothing was ever saved', () => {
  const user = signIn();
  assert.equal(getHideSystemNotifications(), false);
  assert.equal(mirrorOf(user), null);
});

test('local accounts persist the choice to the localStorage mirror', async () => {
  const user = signIn(); // no companyId → local account, never hits Supabase
  const stored = await setHideSystemNotifications(true);

  assert.equal(stored, true);
  assert.equal(mirrorOf(user), 'true');
  assert.equal(getHideSystemNotifications(), true);
  assert.deepEqual(dispatched, ['relay:notif-pref-changed']);
});

test('the choice survives a new session on the same account', async () => {
  const user = signIn();
  await setHideSystemNotifications(true);

  // Same stored currentUser, cold module cache: `userSeq` is unchanged, so make
  // the module forget by signing in as somebody else and back again.
  signIn();
  storage.set('currentUser', JSON.stringify(user));

  assert.equal(getHideSystemNotifications(), true);
});

test('a stale value never leaks into the next account on the same machine', async () => {
  await setHideSystemNotifications(true);
  signIn(); // different user, no mirror of their own
  assert.equal(getHideSystemNotifications(), false);
});

test('loadHideSystemNotifications resolves the local mirror for local accounts', async () => {
  const user = signIn();
  storage.set(`notificationsHideSystem_${user.id}`, 'true');
  assert.equal(await loadHideSystemNotifications(), true);
});

test('toggling sticky when hidden twice in a row', async () => {
  signIn();
  assert.equal(await setHideSystemNotifications(true), true);
  assert.equal(await setHideSystemNotifications(false), false);
  assert.equal(getHideSystemNotifications(), false);
});

test('withNotificationPrefs preserves every other layout key', () => {
  signIn();
  const layout = { widgets: [{ id: 'w1' }], view: 'grid', pins: ['a'] };
  assert.deepEqual(withNotificationPrefs(layout), layout);
  assert.deepEqual(layout, { widgets: [{ id: 'w1' }], view: 'grid', pins: ['a'] });
});

test('withNotificationPrefs carries the known preference onto a save', async () => {
  signIn();
  await setHideSystemNotifications(true);
  assert.deepEqual(withNotificationPrefs({ widgets: [] }), {
    widgets: [],
    [PREF_KEY]: true,
  });
  assert.deepEqual(withNotificationPrefs(null), { [PREF_KEY]: true });
});

test('adoptNotificationPref takes the value from a freshly loaded layout', () => {
  const user = signIn();
  adoptNotificationPref({ widgets: [], [PREF_KEY]: true });

  assert.equal(getHideSystemNotifications(), true);
  assert.equal(mirrorOf(user), 'true');
  assert.deepEqual(dispatched, ['relay:notif-pref-changed']);
});

test('adoptNotificationPref ignores layouts without a boolean preference', () => {
  signIn();
  adoptNotificationPref({ [PREF_KEY]: 'true' });
  adoptNotificationPref({ widgets: [] });
  adoptNotificationPref(null);

  assert.equal(getHideSystemNotifications(), false);
  assert.deepEqual(dispatched, []);
});

test('adoptNotificationPref is a no-op when the value already matches', () => {
  const user = signIn();
  storage.set(`notificationsHideSystem_${user.id}`, 'true');
  dispatched = [];

  adoptNotificationPref({ [PREF_KEY]: true }, { cloud: true });
  assert.equal(getHideSystemNotifications(), true);
  assert.deepEqual(dispatched, []);
});

test('a layout document cannot undo a choice made in this session', async () => {
  signIn();
  await setHideSystemNotifications(true);
  dispatched = [];

  adoptNotificationPref({ [PREF_KEY]: false });
  adoptNotificationPref({ [PREF_KEY]: false }, { cloud: true });

  assert.equal(getHideSystemNotifications(), true);
  assert.deepEqual(dispatched, []);
});

test('a stale local layout copy cannot override the mirror', () => {
  const user = signIn();
  storage.set(`notificationsHideSystem_${user.id}`, 'true');
  dispatched = [];

  adoptNotificationPref({ widgets: [{ id: 'w1' }], [PREF_KEY]: false });

  assert.equal(getHideSystemNotifications(), true);
  assert.equal(mirrorOf(user), 'true');
  assert.deepEqual(dispatched, []);
});

test('a cloud layout copy outranks a stale mirror', () => {
  const user = signIn();
  storage.set(`notificationsHideSystem_${user.id}`, 'true');

  adoptNotificationPref({ widgets: [], [PREF_KEY]: false }, { cloud: true });

  assert.equal(getHideSystemNotifications(), false);
  assert.equal(mirrorOf(user), 'false');
  assert.deepEqual(dispatched, ['relay:notif-pref-changed']);
});

test('a toggle guards only the account that made it', async () => {
  await setHideSystemNotifications(true);
  signIn(); // a different account, no mirror of its own

  adoptNotificationPref({ [PREF_KEY]: true });

  assert.equal(getHideSystemNotifications(), true);
});

test('onNotificationPrefChanged reports changes and can be detached', async () => {
  signIn();
  const seen = [];
  const detach = onNotificationPrefChanged(value => seen.push(value));

  await setHideSystemNotifications(true);
  await setHideSystemNotifications(false);
  assert.deepEqual(seen, [true, false]);

  detach();
  await setHideSystemNotifications(true);
  assert.deepEqual(seen, [true, false]);
});

test('a failed cloud write still applies the choice locally', async () => {
  // A real profile id with a company id is treated as a cloud account; the
  // offline Supabase stub errors out, which must not break the toggle.
  const user = signIn({
    id: '11111111-2222-3333-4444-555555555555',
    companyId: 'comp-1',
  });
  const warn = console.warn;
  console.warn = () => {};
  try {
    assert.equal(await setHideSystemNotifications(true), true);
  } finally {
    console.warn = warn;
  }

  assert.equal(mirrorOf(user), 'true');
  assert.equal(getHideSystemNotifications(), true);
});
