import { test, describe, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert';
import {
  demoTabUrl,
  adoptDemoLink,
  isDemoSession,
  isGuestDemo,
  getDemoGuest,
  clearDemoFlag,
  takeDemoStartSource,
  DEMO_GUEST_USER,
} from './demoSession.js';

// New tabs open with `noopener` and start with empty sessionStorage, so a demo
// tab has to mark the URL or the new tab boots on the real account.
describe('demoTabUrl', () => {
  let store;

  beforeEach(() => {
    store = {};
    globalThis.sessionStorage = {
      getItem: (k) => (k in store ? store[k] : null),
      setItem: (k, v) => { store[k] = String(v); },
      removeItem: (k) => { delete store[k]; },
    };
  });

  afterEach(() => {
    delete globalThis.sessionStorage;
  });

  test('leaves the URL alone outside demo mode', () => {
    assert.strictEqual(demoTabUrl('#/jobs/j1'), '#/jobs/j1');
  });

  test('marks in-app routes opened from a demo tab', () => {
    store.relay_demo_mode = '1';
    assert.strictEqual(demoTabUrl('#/document/view'), '#/document/view?demo=1');
    assert.strictEqual(demoTabUrl('#/jobs/j1?tab=forms&form=f1'), '#/jobs/j1?tab=forms&form=f1&demo=1');
  });

  test('never marks external links', () => {
    store.relay_demo_mode = '1';
    assert.strictEqual(demoTabUrl('https://example.com'), 'https://example.com');
  });
});

describe('guest demo', () => {
  let session;
  let local;
  let replaced;

  function visit(hash) {
    window.location.hash = hash;
    adoptDemoLink();
  }

  beforeEach(() => {
    session = {};
    local = {};
    replaced = null;
    globalThis.sessionStorage = {
      getItem: (k) => (k in session ? session[k] : null),
      setItem: (k, v) => { session[k] = String(v); },
      removeItem: (k) => { delete session[k]; },
    };
    globalThis.localStorage = {
      getItem: (k) => (k in local ? local[k] : null),
      setItem: (k, v) => { local[k] = String(v); },
      removeItem: (k) => { delete local[k]; },
    };
    globalThis.window = {
      location: { hash: '', pathname: '/app/', search: '' },
      history: { state: null, replaceState: (_s, _t, url) => { replaced = url; } },
    };
  });

  afterEach(() => {
    delete globalThis.sessionStorage;
    delete globalThis.localStorage;
    delete globalThis.window;
  });

  test('#/demo with nobody signed in opens a guest demo on the dashboard', () => {
    visit('#/demo');
    assert.ok(isDemoSession());
    assert.ok(isGuestDemo());
    assert.deepStrictEqual(getDemoGuest(), { ...DEMO_GUEST_USER });
    assert.strictEqual(replaced, '/app/#/');
    assert.deepStrictEqual(local, {}, 'nothing is written where other tabs would see it');
  });

  test('#/demo for a signed-in account opens that account\'s demo, not a guest', () => {
    local.currentUser = JSON.stringify({ id: 'u1', companyId: 'c1' });
    visit('#/demo');
    assert.ok(isDemoSession());
    assert.strictEqual(isGuestDemo(), false);
    assert.strictEqual(getDemoGuest(), null);
  });

  test('records where the demo was opened from, once', () => {
    visit('#/demo?from=site');
    assert.strictEqual(takeDemoStartSource(), 'site');
    assert.strictEqual(takeDemoStartSource(), null, 'a reload is not a new start');
  });

  test('a guest tab hands the guest on to the tabs it opens', () => {
    visit('#/demo');
    const url = demoTabUrl('#/jobs/j1');
    assert.strictEqual(url, '#/jobs/j1?demo=guest');

    session = {};
    visit(url);
    assert.ok(isGuestDemo());
    assert.strictEqual(replaced, '/app/#/jobs/j1');
  });

  test('the guest key alone is not a demo', () => {
    session.relay_demo_guest = '1';
    assert.strictEqual(isGuestDemo(), false);
  });

  test('clearing the demo ends the guest too', () => {
    visit('#/demo');
    clearDemoFlag();
    assert.strictEqual(isDemoSession(), false);
    assert.strictEqual(isGuestDemo(), false);
    assert.strictEqual(takeDemoStartSource(), null);
  });

  test('other routes are left alone', () => {
    visit('#/jobs?tab=open');
    assert.strictEqual(isDemoSession(), false);
    assert.strictEqual(replaced, null);
  });
});

describe('leaving a guest demo to sign up', () => {
  let session;
  beforeEach(() => {
    session = {};
    globalThis.sessionStorage = {
      getItem: (k) => (k in session ? session[k] : null),
      setItem: (k, v) => { session[k] = String(v); },
      removeItem: (k) => { delete session[k]; },
    };
    globalThis.window = { location: { hash: '#/', reload: () => {} } };
  });

  afterEach(() => {
    delete globalThis.sessionStorage;
    delete globalThis.window;
  });

  test('ends the demo and asks the launch screen for the signup form', async () => {
    const { exitDemoToSignup, takeSignupRequest } = await import('./demoSession.js');
    session.relay_demo_mode = '1';
    session.relay_demo_guest = '1';
    exitDemoToSignup();
    assert.strictEqual(isDemoSession(), false);
    assert.strictEqual(takeSignupRequest(), true);
    assert.strictEqual(takeSignupRequest(), true, 'the launch screen may draw twice on boot');
    assert.strictEqual(session.relay_demo_signup, undefined, 'a later reload opens on sign-in');
  });
});
