import { test, describe, beforeEach } from 'node:test';
import assert from 'node:assert';

// permissions.js reads localStorage directly, so shim it before importing.
const mem = new Map();
globalThis.localStorage = {
  getItem: (k) => (mem.has(k) ? mem.get(k) : null),
  setItem: (k, v) => mem.set(k, String(v)),
  removeItem: (k) => mem.delete(k),
  clear: () => mem.clear(),
};

const { hasPermission, MODULE_PERMS } = await import('./permissions.js');
const { store } = await import('../data/store.js');

function signIn(user) {
  mem.set('currentUser', JSON.stringify(user));
}

describe('hasPermission', () => {
  beforeEach(() => {
    mem.clear();
    store.cache = {};
  });

  test('denies everything when nobody is signed in', () => {
    assert.strictEqual(hasPermission('Jobs', 'view'), false);
    assert.strictEqual(hasPermission('Settings', 'view'), false);
  });

  test('grants an admin every module and key', () => {
    signIn({ role: 'admin', userTypeId: null });
    assert.strictEqual(hasPermission('Jobs', 'delete'), true);
    assert.strictEqual(hasPermission('Settings', 'manage_users'), true);
    assert.strictEqual(hasPermission('Anything', 'anything'), true);
  });

  test('denies a customer regardless of module', () => {
    signIn({ role: 'customer' });
    assert.strictEqual(hasPermission('Jobs', 'view'), false);
    assert.strictEqual(hasPermission('Invoices', 'view'), false);
  });

  test('falls back to technician rules when no user type is linked', () => {
    signIn({ role: 'technician', userTypeId: null });
    assert.strictEqual(hasPermission('Dashboard', 'view'), true);
    assert.strictEqual(hasPermission('Dashboard', 'edit'), false);
    assert.strictEqual(hasPermission('Timesheets', 'view_own'), true);
    assert.strictEqual(hasPermission('Timesheets', 'edit_all'), true);
    assert.strictEqual(hasPermission('Settings', 'manage_users'), false);
  });

  test('falls back to technician rules when the linked user type is missing', () => {
    signIn({ role: 'technician', userTypeId: 'ut_gone' });
    assert.strictEqual(hasPermission('Jobs', 'view'), true);
  });

  test('prefers the linked user type permissions when present', () => {
    store.cache = {
      userTypes: [{ id: 'ut_limited', permissions: [{ module: 'Jobs', view: true, delete: false }] }],
    };
    signIn({ role: 'technician', userTypeId: 'ut_limited' });
    assert.strictEqual(hasPermission('Jobs', 'view'), true);
    assert.strictEqual(hasPermission('Jobs', 'delete'), false);
    // A module the user type says nothing about is denied, not defaulted.
    assert.strictEqual(hasPermission('Customers', 'view'), false);
  });

  test('ignores an empty permissions array on the user type', () => {
    store.cache = { userTypes: [{ id: 'ut_empty', permissions: [] }] };
    signIn({ role: 'technician', userTypeId: 'ut_empty' });
    assert.strictEqual(hasPermission('Jobs', 'view'), false);
  });

  test('gives a manager everything except unrestricted Settings', () => {
    signIn({ role: 'manager', userTypeId: null });
    assert.strictEqual(hasPermission('Jobs', 'delete'), true);
    assert.strictEqual(hasPermission('Settings', 'view'), true);
    assert.strictEqual(hasPermission('Settings', 'manage_tax'), true);
    assert.strictEqual(hasPermission('Settings', 'manage_users'), false);
  });

  test('denies an unrecognised role', () => {
    signIn({ role: 'contractor', userTypeId: null });
    assert.strictEqual(hasPermission('Jobs', 'view'), false);
  });

  // NOTE: the "local admin in technician view" branch inside hasPermission() is
  // unreachable for role 'admin' — the earlier `role === 'admin'` return wins.
  // The branch therefore only ever applies to non-admin local users, which is
  // what these two tests pin down.
  test('an admin keeps full access even in technician view', () => {
    store.cache = {
      userTypes: [{ id: 'ut_all', permissions: [{ module: 'Settings', view: true, manage_users: true }] }],
    };
    signIn({ role: 'admin', userTypeId: 'ut_all' });
    mem.set('relay_login_mode', 'local');
    mem.set('uiMode', 'technician');

    assert.strictEqual(hasPermission('Settings', 'manage_users'), true);
    assert.strictEqual(hasPermission('Anything', 'anything'), true);
  });

  test('a local user in technician view is capped by the bypass list', () => {
    store.cache = {
      userTypes: [{ id: 'ut_all', permissions: [{ module: 'Settings', view: true, manage_users: true }] }],
    };
    signIn({ role: 'technician', userTypeId: 'ut_all' });
    mem.set('relay_login_mode', 'local');
    mem.set('uiMode', 'technician');

    assert.strictEqual(hasPermission('Settings', 'manage_users'), false);
    assert.strictEqual(hasPermission('Dashboard', 'view'), true);
    assert.strictEqual(hasPermission('Jobs', 'manage_materials'), true);
    assert.strictEqual(hasPermission('Leads', 'view'), false);
  });

  test('technician view only kicks in for local login mode', () => {
    signIn({ role: 'technician', userTypeId: 'ut_limited' });
    store.cache = {
      userTypes: [{ id: 'ut_limited', permissions: [{ module: 'Settings', view: true }] }],
    };
    mem.set('relay_login_mode', 'cloud');
    mem.set('uiMode', 'technician');

    assert.strictEqual(hasPermission('Settings', 'view'), true);
  });
});

describe('MODULE_PERMS', () => {
  test('every module exposes unique keys and non-empty labels', () => {
    for (const [module, perms] of Object.entries(MODULE_PERMS)) {
      const keys = perms.map(p => p.key);
      assert.strictEqual(new Set(keys).size, keys.length, `${module} has duplicate permission keys`);
      for (const p of perms) {
        assert.ok(p.label, `${module}.${p.key} is missing a label`);
      }
    }
  });

  test('declared cost-visibility permissions stay admin-only', () => {
    const jobKeys = MODULE_PERMS.Jobs.map(p => p.key);
    assert.ok(jobKeys.includes('view_costs'), 'Jobs should declare view_costs');

    signIn({ role: 'technician', userTypeId: null });
    assert.strictEqual(hasPermission('Jobs', 'view_costs'), false);
    assert.strictEqual(hasPermission('Jobs', 'view_quotes_tab'), false);
    assert.strictEqual(hasPermission('Jobs', 'view_pos_tab'), false);
  });
});
