import { test, describe, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert';
import { demoTabUrl } from './demoSession.js';

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
