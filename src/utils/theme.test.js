// ============================================
// THEME -- light-only appearance at launch
// ============================================

import { test, describe, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert';

import { applyTheme, resolveTheme, systemTheme, watchSystemTheme } from './theme.js';

const DARK_QUERY = '(prefers-color-scheme: dark)';

function installDom({ darkMode = false, withMatchMedia = true } = {}) {
  const attrs = new Map();
  const writes = [];

  globalThis.document = {
    documentElement: {
      setAttribute: (key, value) => { attrs.set(key, String(value)); },
      removeAttribute: (key) => { attrs.delete(key); },
      getAttribute: (key) => (attrs.has(key) ? attrs.get(key) : null),
    },
  };

  globalThis.localStorage = {
    getItem: () => null,
    setItem: (key, value) => { writes.push([key, value]); },
    removeItem: () => {},
  };

  const listeners = [];
  const mql = {
    matches: darkMode,
    addEventListener: (type, cb) => { if (type === 'change') listeners.push(cb); },
    removeEventListener: () => {},
  };

  globalThis.window = withMatchMedia
    ? { matchMedia: (query) => { assert.strictEqual(query, DARK_QUERY); return mql; } }
    : {};

  return {
    theme: () => attrs.get('data-theme') ?? null,
    mode: () => attrs.get('data-theme-mode') ?? null,
    writes,
    listenerCount: () => listeners.length,
    setOsDark(value) {
      mql.matches = value;
      listeners.forEach(cb => cb({ matches: value }));
    },
  };
}

let dom;

beforeEach(() => { dom = installDom(); });

afterEach(() => {
  delete globalThis.document;
  delete globalThis.window;
  delete globalThis.localStorage;
});

describe('systemTheme', () => {
  test('is light even when the OS is dark (light-only launch)', () => {
    dom = installDom({ darkMode: true });
    assert.strictEqual(systemTheme(), 'light');

    dom = installDom({ darkMode: false });
    assert.strictEqual(systemTheme(), 'light');
  });

  test('falls back to light when matchMedia is unavailable', () => {
    dom = installDom({ withMatchMedia: false });
    assert.strictEqual(systemTheme(), 'light');
  });
});

describe('resolveTheme', () => {
  test('collapses every requested theme to light', () => {
    assert.strictEqual(resolveTheme('light'), 'light');
    assert.strictEqual(resolveTheme('dark'), 'light');
  });

  test('resolves removed decorative theme names to light', () => {
    dom = installDom({ darkMode: true });
    assert.strictEqual(resolveTheme('nordic-aurora'), 'light');
    assert.strictEqual(resolveTheme('ballet-pointe'), 'light');
  });

  test('treats a null theme as "clear", not as a theme', () => {
    assert.strictEqual(resolveTheme(null), null);
    assert.strictEqual(resolveTheme(''), null);
    assert.strictEqual(resolveTheme(undefined), null);
  });
});

describe('applyTheme', () => {
  test('applies light when called with no argument, whatever the OS says', () => {
    dom = installDom({ darkMode: true });
    assert.strictEqual(applyTheme(), 'light');
    assert.strictEqual(dom.theme(), 'light');
    assert.strictEqual(dom.mode(), 'light');

    dom = installDom({ darkMode: false });
    assert.strictEqual(applyTheme(), 'light');
    assert.strictEqual(dom.theme(), 'light');
    assert.strictEqual(dom.mode(), 'light');
  });

  test('keeps data-theme and data-theme-mode in sync', () => {
    applyTheme('light');
    assert.strictEqual(dom.theme(), 'light');
    assert.strictEqual(dom.mode(), 'light');
  });

  test('does not leave the document unstyled for a legacy theme name', () => {
    dom = installDom({ darkMode: false });
    applyTheme('neon-cyberpunk');
    assert.strictEqual(dom.theme(), 'light');
    assert.strictEqual(dom.mode(), 'light');
  });

  test('ignores an explicit dark request', () => {
    assert.strictEqual(applyTheme('dark'), 'light');
    assert.strictEqual(dom.theme(), 'light');
    assert.strictEqual(dom.mode(), 'light');
  });

  test('clears both attributes for the auth screens', () => {
    applyTheme('light');
    assert.strictEqual(applyTheme(null), null);
    assert.strictEqual(dom.theme(), null);
    assert.strictEqual(dom.mode(), null);
  });

  test('never persists a theme preference', () => {
    applyTheme('dark');
    applyTheme();
    applyTheme(null);
    assert.deepStrictEqual(dom.writes, []);
    assert.strictEqual(globalThis.localStorage.getItem('simpro_theme'), null);
  });
});

describe('watchSystemTheme', () => {
  test('does not follow the OS scheme while the app is light only', () => {
    dom = installDom({ darkMode: false });
    applyTheme();
    assert.strictEqual(dom.theme(), 'light');

    watchSystemTheme();
    watchSystemTheme();
    assert.strictEqual(dom.listenerCount(), 0);

    dom.setOsDark(true);
    assert.strictEqual(dom.theme(), 'light');
    assert.strictEqual(dom.mode(), 'light');
  });
});
