import { test, describe, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert';

const mem = new Map();
globalThis.localStorage = {
  getItem: (k) => (mem.has(k) ? mem.get(k) : null),
  setItem: (k, v) => mem.set(k, String(v)),
  removeItem: (k) => mem.delete(k),
  clear: () => mem.clear(),
};

const { store } = await import('../data/store.js');
const {
  EXTRA_WRITE_CONTROL_IDS,
  WRITE_CONTROL_SELECTOR,
  WRITE_LOCKED_TOOLTIP,
  applyWriteLock,
  blockedWriteControl,
  blockedWriteSubmit,
  isEditorRoute,
  isWriteControl,
  isWriteLocked,
  isWriteRoute,
  writeRouteFallback,
} = await import('./writeLock.js');

const CLOUD_ID = '0f1e2d3c-4b5a-6978-8a9b-0c1d2e3f4a5b';

function useCloudAccount(subscription, companyId = CLOUD_ID) {
  store.companyId = companyId;
  store.companySettings = subscription === undefined ? {} : { _subscription: subscription };
}

function useExpiredTrial() {
  useCloudAccount({
    tier: null,
    status: 'trialing',
    trialEndsAt: new Date(Date.now() - 60_000).toISOString(),
  });
}

function useRunningTrial() {
  useCloudAccount({
    tier: null,
    status: 'trialing',
    trialEndsAt: new Date(Date.now() + 86_400_000).toISOString(),
  });
}

// ---- Minimal DOM doubles ----------------------------------------------------

function fakeControl({ tooltip = null, title = null } = {}) {
  const attrs = new Map();
  const classes = new Set();
  if (tooltip !== null) attrs.set('data-tooltip', tooltip);
  if (title !== null) attrs.set('title', title);
  return {
    attrs,
    classes,
    classList: {
      add: (name) => classes.add(name),
      remove: (name) => classes.delete(name),
      contains: (name) => classes.has(name),
    },
    getAttribute: (name) => (attrs.has(name) ? attrs.get(name) : null),
    setAttribute: (name, value) => attrs.set(name, String(value)),
    removeAttribute: (name) => attrs.delete(name),
    hasAttribute: (name) => attrs.has(name),
  };
}

function fakeField({ tagName = 'INPUT', type = 'text', readOnly = false, disabled = false } = {}) {
  const attrs = new Map([['type', type]]);
  return {
    tagName,
    type,
    readOnly,
    disabled,
    isContentEditable: false,
    getAttribute: (name) => (attrs.has(name) ? attrs.get(name) : null),
    setAttribute: (name, value) => attrs.set(name, String(value)),
    removeAttribute: (name) => attrs.delete(name),
    hasAttribute: (name) => attrs.has(name),
  };
}

function fakeRoot({ controls = [], fields = [] } = {}) {
  return {
    querySelectorAll(selector) {
      if (selector === 'input, select, textarea, [contenteditable="true"]') return fields;
      if (selector === '[data-write-field-locked]') {
        return fields.filter((field) => field.hasAttribute('data-write-field-locked'));
      }
      if (selector === WRITE_CONTROL_SELECTOR) return controls;
      return [];
    },
  };
}

beforeEach(() => {
  mem.clear();
  store.companyId = null;
  store.companySettings = null;
  store.demoMode = false;
});

afterEach(() => {
  store.companyId = null;
  store.companySettings = null;
  store.demoMode = false;
});

// ---- Gating state -----------------------------------------------------------

describe('isWriteLocked', () => {
  test('locks an expired cloud trial', () => {
    useExpiredTrial();
    assert.strictEqual(isWriteLocked(), true);
  });

  test('does not lock a running trial', () => {
    useRunningTrial();
    assert.strictEqual(isWriteLocked(), false);
  });

  test('does not lock an active subscription', () => {
    useCloudAccount({ tier: 'cloud', status: 'active', trialEndsAt: null });
    assert.strictEqual(isWriteLocked(), false);
  });

  test('does not lock a complimentary grant', () => {
    useCloudAccount({ tier: 'cloud', status: null, compTier: 'cloud', trialEndsAt: null });
    assert.strictEqual(isWriteLocked(), false);
  });

  test('does not lock a local account', () => {
    store.companyId = 'acct_local1';
    store.companySettings = { _subscription: { status: null } };
    assert.strictEqual(isWriteLocked(), false);
  });

  test('fails open when the subscription block was never loaded', () => {
    useCloudAccount(undefined);
    assert.strictEqual(isWriteLocked(), false);
  });

  test('never locks demo mode', () => {
    useExpiredTrial();
    store.demoMode = true;
    assert.strictEqual(isWriteLocked(), false);
  });

  test('never locks outside the signed-in app shell', () => {
    useExpiredTrial();
    const original = globalThis.window;
    try {
      for (const hash of ['#/login', '#/portal/customer?token=abc', '#/contractor-portal/tok']) {
        globalThis.window = { location: { hash } };
        assert.strictEqual(isWriteLocked(), false, hash);
      }
      globalThis.window = { location: { hash: '#/jobs' } };
      assert.strictEqual(isWriteLocked(), true);
    } finally {
      if (original === undefined) delete globalThis.window;
      else globalThis.window = original;
    }
  });
});

// ---- Route classification --------------------------------------------------

describe('isWriteRoute', () => {
  test('matches create and edit routes', () => {
    for (const path of [
      '/jobs/new',
      '/people/new',
      '/quotes/new',
      '/invoices/new',
      '/kits/new',
      '/people/abc/edit',
      '/jobs/abc/edit',
      '/settings/forms/f1/edit',
      '/settings/quote-templates/t1/edit',
    ]) {
      assert.strictEqual(isWriteRoute(path), true, path);
    }
  });

  test('ignores read routes, the paywall and query strings', () => {
    for (const path of ['/', '/jobs', '/jobs/abc', '/settings', '/subscribe', '/new-job', '/jobs/newer']) {
      assert.strictEqual(isWriteRoute(path), false, path);
    }
    assert.strictEqual(isWriteRoute('/jobs/new?isRecurring=true'), true);
    assert.strictEqual(isWriteRoute('#/jobs/new'), true);
  });
});

describe('writeRouteFallback', () => {
  test('sends a create form to its list page', () => {
    assert.strictEqual(writeRouteFallback('/jobs/new'), '/jobs');
    assert.strictEqual(writeRouteFallback('/people/new'), '/people');
    assert.strictEqual(writeRouteFallback('/quotes/new?customerId=c1'), '/quotes');
    assert.strictEqual(writeRouteFallback('/kits/new'), '/kits');
  });

  test('sends an edit form to the record it edits', () => {
    assert.strictEqual(writeRouteFallback('/people/abc/edit'), '/people/abc');
    assert.strictEqual(writeRouteFallback('/jobs/abc/edit'), '/jobs/abc');
    assert.strictEqual(writeRouteFallback('/assets/a1/edit?customerId=c1'), '/assets/a1');
  });

  test('sends template editors to their Settings tab', () => {
    assert.strictEqual(writeRouteFallback('/settings/forms/new'), '/settings?tab=forms');
    assert.strictEqual(writeRouteFallback('/settings/forms/f1/edit'), '/settings?tab=forms');
    assert.strictEqual(writeRouteFallback('/settings/quote-templates/new'), '/settings?tab=quotes');
    assert.strictEqual(writeRouteFallback('/settings/quote-templates/t1/edit'), '/settings?tab=quotes');
  });

  test('always yields a route, never an empty string', () => {
    for (const path of ['/new', '/edit', '', null, undefined]) {
      const fallback = writeRouteFallback(path);
      assert.ok(typeof fallback === 'string' && fallback.startsWith('/'), String(path));
      assert.ok(!isWriteRoute(fallback), `${String(path)} -> ${fallback}`);
    }
  });
});

describe('isEditorRoute', () => {
  test('matches the pages whose whole surface is an editor', () => {
    for (const path of [
      '/quotes/q1',
      '/invoices/i1',
      '/purchase-orders/p1',
      '/settings/documents',
      '/settings/email-templates',
    ]) {
      assert.strictEqual(isEditorRoute(path), true, path);
    }
  });

  test('leaves list, ordinary detail and settings pages alone', () => {
    for (const path of [
      '/',
      '/quotes',
      '/invoices',
      '/purchase-orders',
      '/jobs/abc',
      '/people/abc',
      '/documents',
      '/settings',
      '/subscribe',
    ]) {
      assert.strictEqual(isEditorRoute(path), false, path);
    }
    assert.strictEqual(isEditorRoute('/quotes/q1?tab=history'), true);
  });
});

// ---- Control matching ------------------------------------------------------

describe('isWriteControl', () => {
  test('the selector list covers the conventions used across the app', () => {
    for (const fragment of [
      '[data-write-action]',
      '[id^="btn-new-"]',
      '[id^="btn-edit"]',
      '[id^="btn-add-"]',
      '[id^="btn-save"]',
      '[id^="btn-create"]',
      '[data-nav$="/new"]',
      '[data-path$="/new"]',
      '[data-act="upload"]',
    ]) {
      assert.ok(WRITE_CONTROL_SELECTOR.includes(fragment), fragment);
    }
  });

  test('covers the create/edit ids that break the naming convention', () => {
    assert.ok(EXTRA_WRITE_CONTROL_IDS.length > 0);
    for (const id of EXTRA_WRITE_CONTROL_IDS) {
      assert.ok(WRITE_CONTROL_SELECTOR.includes(`[id="${id}"]`), id);
    }
  });

  test('locks the brny trigger, which is a paid feature rather than a write', () => {
    assert.ok(EXTRA_WRITE_CONTROL_IDS.includes('btn-relay-assistant'));
    assert.ok(WRITE_CONTROL_SELECTOR.includes('[id="btn-relay-assistant"]'));
  });

  test('leaves read-only and account-level controls out of the lock', () => {
    for (const id of [
      'btn-cancel',
      'btn-delete',
      'btn-preview-pdf',
      'btn-print-pdf',
      'btn-export-csv',
      'btn-send-quote',
      'btn-today',
      'btn-logout',
    ]) {
      assert.ok(!WRITE_CONTROL_SELECTOR.includes(`[id="${id}"]`), id);
    }
  });

  test('delegates to the element matcher', () => {
    let received = null;
    const el = { matches: (selector) => { received = selector; return true; } };
    assert.strictEqual(isWriteControl(el), true);
    assert.strictEqual(received, WRITE_CONTROL_SELECTOR);
  });

  test('rejects non-elements', () => {
    assert.strictEqual(isWriteControl(null), false);
    assert.strictEqual(isWriteControl({}), false);
  });
});

// ---- Applying the lock -----------------------------------------------------

describe('applyWriteLock', () => {
  test('greys controls, swaps their tooltip, and restores both when unlocked', () => {
    useExpiredTrial();
    const newJob = fakeControl({ tooltip: 'Create a job' });
    const root = fakeRoot({ controls: [newJob] });

    applyWriteLock(root, { path: '/' });
    assert.ok(newJob.hasAttribute('data-write-locked'));
    assert.ok(newJob.classes.has('is-write-locked'));
    assert.strictEqual(newJob.getAttribute('aria-disabled'), 'true');
    assert.strictEqual(newJob.getAttribute('data-tooltip'), WRITE_LOCKED_TOOLTIP);

    useCloudAccount({ tier: 'cloud', status: 'active', trialEndsAt: null });
    applyWriteLock(root, { path: '/' });
    assert.strictEqual(newJob.hasAttribute('data-write-locked'), false);
    assert.strictEqual(newJob.classes.has('is-write-locked'), false);
    assert.strictEqual(newJob.hasAttribute('aria-disabled'), false);
    assert.strictEqual(newJob.getAttribute('data-tooltip'), 'Create a job');
  });

  test('removes the tooltip it added to a control that had none', () => {
    useExpiredTrial();
    const addItem = fakeControl();
    const root = fakeRoot({ controls: [addItem] });

    applyWriteLock(root, { path: '/' });
    assert.strictEqual(addItem.getAttribute('data-tooltip'), WRITE_LOCKED_TOOLTIP);

    useCloudAccount({ tier: 'cloud', status: 'active', trialEndsAt: null });
    applyWriteLock(root, { path: '/' });
    assert.strictEqual(addItem.hasAttribute('data-tooltip'), false);
  });

  test('swaps a native title tooltip too, and restores it', () => {
    useExpiredTrial();
    const brny = fakeControl({ title: 'brny — your co-pilot' });
    const root = fakeRoot({ controls: [brny] });

    applyWriteLock(root, { path: '/' });
    assert.strictEqual(brny.getAttribute('title'), WRITE_LOCKED_TOOLTIP);

    useCloudAccount({ tier: 'cloud', status: 'active', trialEndsAt: null });
    applyWriteLock(root, { path: '/' });
    assert.strictEqual(brny.getAttribute('title'), 'brny — your co-pilot');
  });

  test('locks editor fields and restores their previous state', () => {
    useExpiredTrial();
    const text = fakeField();
    const select = fakeField({ tagName: 'SELECT', disabled: true });
    const root = fakeRoot({ fields: [text, select] });

    applyWriteLock(root, { path: '/quotes/q1' });
    assert.strictEqual(text.readOnly, true);
    assert.ok(text.hasAttribute('data-write-field-locked'));
    assert.strictEqual(select.disabled, true);

    applyWriteLock(root, { path: '/' });
    assert.strictEqual(text.readOnly, false);
    assert.strictEqual(text.hasAttribute('data-write-field-locked'), false);
    // It was already disabled for its own reasons, so unlocking must not enable it.
    assert.strictEqual(select.disabled, true);
  });

  test('locks checkboxes with disabled rather than readOnly', () => {
    useExpiredTrial();
    const checkbox = fakeField({ type: 'checkbox' });
    const root = fakeRoot({ fields: [checkbox] });

    applyWriteLock(root, { path: '/invoices/i1' });
    assert.strictEqual(checkbox.disabled, true);
    assert.strictEqual(checkbox.readOnly, false);
  });

  test('does not touch fields on non-editor pages', () => {
    useExpiredTrial();
    const search = fakeField({ type: 'search' });
    const root = fakeRoot({ fields: [search] });

    applyWriteLock(root, { path: '/jobs' });
    assert.strictEqual(search.readOnly, false);
    assert.strictEqual(search.hasAttribute('data-write-field-locked'), false);
  });
});

// ---- Interaction guard ------------------------------------------------------

describe('blockedWriteControl', () => {
  test('refuses a click on a create control while read-only', () => {
    useExpiredTrial();
    const control = { matches: () => true };
    const target = { closest: (selector) => (selector === WRITE_CONTROL_SELECTOR ? control : null) };

    assert.strictEqual(blockedWriteControl(target), control);
  });

  test('allows a click that lands on a read control', () => {
    useExpiredTrial();
    const target = { closest: () => null };
    assert.strictEqual(blockedWriteControl(target), null);
  });

  test('allows every click when the account can write', () => {
    useCloudAccount({ tier: 'cloud', status: 'active', trialEndsAt: null });
    const target = { closest: () => ({ matches: () => true }) };
    assert.strictEqual(blockedWriteControl(target), null);
  });

  test('tolerates a target without closest()', () => {
    useExpiredTrial();
    assert.strictEqual(blockedWriteControl(null), null);
    assert.strictEqual(blockedWriteControl({}), null);
  });
});

describe('blockedWriteSubmit', () => {
  test('refuses a form that offers a write action while read-only', () => {
    useExpiredTrial();
    const form = { querySelector: (selector) => (selector === WRITE_CONTROL_SELECTOR ? { id: 'btn-save' } : null) };
    assert.strictEqual(blockedWriteSubmit(form), true);
  });

  test('allows a search form with no write action', () => {
    useExpiredTrial();
    const form = { querySelector: () => null };
    assert.strictEqual(blockedWriteSubmit(form), false);
  });

  test('allows every submit when the account can write', () => {
    useCloudAccount({ tier: 'cloud', status: 'active', trialEndsAt: null });
    const form = { querySelector: () => ({ id: 'btn-save' }) };
    assert.strictEqual(blockedWriteSubmit(form), false);
  });

  test('tolerates a non-form target', () => {
    useExpiredTrial();
    assert.strictEqual(blockedWriteSubmit(null), false);
    assert.strictEqual(blockedWriteSubmit({}), false);
  });
});
