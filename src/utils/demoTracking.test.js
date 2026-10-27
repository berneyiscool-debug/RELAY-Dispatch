import { test, describe, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert';
import { supabase, isDemoFunction } from './supabase.js';
import { getDemoId, peekDemoId, trackDemoEvent, trackDemoSignup } from './demoTracking.js';

describe('demo tracking', () => {
  let local;
  let calls;
  let original;

  beforeEach(() => {
    local = {};
    calls = [];
    globalThis.localStorage = {
      getItem: (k) => (k in local ? local[k] : null),
      setItem: (k, v) => { local[k] = String(v); },
      removeItem: (k) => { delete local[k]; },
    };
    original = Object.getOwnPropertyDescriptor(supabase, 'functions');
    Object.defineProperty(supabase, 'functions', {
      configurable: true,
      get: () => ({ invoke: async (name, options) => { calls.push({ name, body: options.body }); return { data: null, error: null }; } }),
    });
  });

  afterEach(() => {
    Object.defineProperty(supabase, 'functions', original);
    delete globalThis.localStorage;
  });

  test('keeps one anonymous demo id per browser', () => {
    assert.strictEqual(peekDemoId(), null);
    const id = getDemoId();
    assert.match(id, /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/);
    assert.strictEqual(getDemoId(), id);
  });

  test('sends the event and source to relay-demo', async () => {
    await trackDemoEvent('demo_started', { source: 'site' });
    assert.deepStrictEqual(calls, [{ name: 'relay-demo?action=event', body: { demoId: getDemoId(), event: 'demo_started', source: 'site' } }]);
  });

  test('a signup is only credited on a browser that opened the demo', async () => {
    await trackDemoSignup();
    assert.deepStrictEqual(calls, []);
    getDemoId();
    await trackDemoSignup();
    assert.strictEqual(calls[0].body.event, 'signup_completed');
  });

  test('never throws when the call fails', async () => {
    Object.defineProperty(supabase, 'functions', { configurable: true, get: () => ({ invoke: async () => { throw new Error('offline'); } }) });
    await trackDemoEvent('signup_clicked');
  });
});

describe('demo function guard', () => {
  test('only relay-demo gets through from a demo tab', () => {
    assert.ok(isDemoFunction('relay-demo?action=event'));
    assert.ok(isDemoFunction('relay-demo'));
    assert.ok(!isDemoFunction('relay-demo-other'));
    assert.ok(!isDemoFunction('relay-copilot'));
    assert.ok(!isDemoFunction('relay-email'));
  });
});

describe('demo tab', () => {
  beforeEach(() => {
    const tab = { relay_demo_mode: '1' };
    globalThis.sessionStorage = { getItem: (k) => tab[k] ?? null, setItem: () => {}, removeItem: () => {} };
  });
  afterEach(() => { delete globalThis.sessionStorage; });

  test('refuses account functions but lets relay-demo through', async () => {
    const refused = await supabase.functions.invoke('relay-email', { body: {} });
    assert.match(refused.error.message, /demo mode/);
    const passed = await supabase.functions.invoke('relay-demo?action=event', { body: {} });
    assert.doesNotMatch(String(passed.error?.message), /demo mode/);
  });
});
