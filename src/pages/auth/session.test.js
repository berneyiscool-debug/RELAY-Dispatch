import { test, describe, beforeEach } from 'node:test';
import assert from 'node:assert';

const mem = new Map();
globalThis.localStorage = {
  getItem: (k) => (mem.has(k) ? mem.get(k) : null),
  setItem: (k, v) => mem.set(k, String(v)),
  removeItem: (k) => mem.delete(k),
  clear: () => mem.clear(),
};

const {
  setSessionUser,
  clearSessionUser,
  getSessionUser,
  rememberIdentity,
  getRememberedIdentity,
  isRememberMeEnabled,
} = await import('./session.js');

describe('session user', () => {
  beforeEach(() => mem.clear());

  test('stores the signed-in user under the key the rest of the app reads', () => {
    setSessionUser({ id: 'tech_1', name: 'Jake' });
    assert.strictEqual(mem.get('currentUser'), JSON.stringify({ id: 'tech_1', name: 'Jake' }));
    assert.deepStrictEqual(getSessionUser(), { id: 'tech_1', name: 'Jake' });
  });

  test('returns null rather than throwing when nobody is signed in', () => {
    assert.strictEqual(getSessionUser(), null);
    mem.set('currentUser', '{not json');
    assert.strictEqual(getSessionUser(), null);
  });

  test('clearing removes the user', () => {
    setSessionUser({ id: 'tech_1' });
    clearSessionUser();
    assert.strictEqual(mem.has('currentUser'), false);
    assert.strictEqual(getSessionUser(), null);
  });
});

describe('remembered sign-in identity', () => {
  beforeEach(() => mem.clear());

  test('each form keeps its own keys, unchanged from the old per-screen code', () => {
    rememberIdentity('login', 'jake@apexpowerservices.local', true);
    assert.strictEqual(mem.get('relay_remember_me'), 'true');
    assert.strictEqual(mem.get('relay_remembered_email'), 'jake@apexpowerservices.local');

    rememberIdentity('local', 'jake', true);
    assert.strictEqual(mem.get('relay_local_remember_me'), 'true');
    assert.strictEqual(mem.get('relay_local_remembered_email'), 'jake');

    rememberIdentity('cloud', 'jake@example.com', true);
    assert.strictEqual(mem.get('relay_cloud_remember_me'), 'true');
    assert.strictEqual(mem.get('relay_cloud_remembered_email'), 'jake@example.com');
  });

  test('one form never reads another form\'s identity', () => {
    rememberIdentity('local', 'jake', true);
    assert.strictEqual(getRememberedIdentity('local'), 'jake');
    assert.strictEqual(getRememberedIdentity('cloud'), '');
    assert.strictEqual(getRememberedIdentity(), '');
  });

  test('remembering nothing clears a previously remembered identity', () => {
    rememberIdentity('login', 'jake', true);
    assert.strictEqual(isRememberMeEnabled(), true);

    rememberIdentity('login', 'jake', false);
    assert.strictEqual(isRememberMeEnabled(), false);
    assert.strictEqual(getRememberedIdentity(), '');
    assert.strictEqual(mem.has('relay_remember_me'), false);
    assert.strictEqual(mem.has('relay_remembered_email'), false);
  });

  test('an empty identity is not remembered', () => {
    rememberIdentity('login', '', true);
    assert.strictEqual(isRememberMeEnabled(), false);
    assert.strictEqual(getRememberedIdentity(), '');
  });

  test('an unknown form falls back to the login form', () => {
    rememberIdentity('mystery', 'jake', true);
    assert.strictEqual(mem.get('relay_remember_me'), 'true');
    assert.strictEqual(getRememberedIdentity('mystery'), 'jake');
  });

  test('a flag without an identity reads as nothing remembered', () => {
    mem.set('relay_remember_me', 'true');
    assert.strictEqual(isRememberMeEnabled(), true);
    assert.strictEqual(getRememberedIdentity(), '');
  });

  test('a non-string identity is never stored', () => {
    // Guards against call sites that hand the remember-me flag in the identity
    // position, which would otherwise prefill "true" into the username field.
    rememberIdentity('login', true, true);
    assert.strictEqual(isRememberMeEnabled(), false);
    assert.strictEqual(mem.has('relay_remembered_email'), false);

    rememberIdentity('login', { name: 'jake' }, true);
    assert.strictEqual(mem.has('relay_remembered_email'), false);
  });
});

describe('guest demo user', () => {
  const tab = new Map();
  beforeEach(() => {
    mem.clear();
    tab.clear();
    globalThis.sessionStorage = {
      getItem: (k) => (tab.has(k) ? tab.get(k) : null),
      setItem: (k, v) => tab.set(k, String(v)),
      removeItem: (k) => tab.delete(k),
    };
  });

  test('a guest demo tab sees its guest, even with an account signed in elsewhere', async () => {
    const { DEMO_GUEST_USER } = await import('../../utils/demoSession.js');
    setSessionUser({ id: 'u1', companyId: 'c1', name: 'Real' });
    tab.set('relay_demo_mode', '1');
    tab.set('relay_demo_guest', '1');
    assert.deepStrictEqual(getSessionUser(), { ...DEMO_GUEST_USER });
    assert.strictEqual(JSON.parse(mem.get('currentUser')).id, 'u1', 'the account is left signed in');
  });

  test('an account demo still sees the account', () => {
    setSessionUser({ id: 'u1', companyId: 'c1' });
    tab.set('relay_demo_mode', '1');
    assert.strictEqual(getSessionUser().id, 'u1');
  });
});

describe('one read path for the signed-in user', () => {
  test('nothing outside session.js reads currentUser from localStorage directly', async () => {
    // A demo guest lives only in its tab, not in localStorage, so a direct read
    // would see "nobody signed in" (or the real account) inside a guest demo.
    const { readdir, readFile } = await import('node:fs/promises');
    const { join, relative } = await import('node:path');
    const srcRoot = new URL('../../', import.meta.url).pathname;
    const READ_ALLOWED = new Set(['session.js', 'demoSession.js']);
    const offenders = [];
    const walk = async (dir) => {
      for (const entry of await readdir(dir, { withFileTypes: true })) {
        const full = join(dir, entry.name);
        if (entry.isDirectory()) await walk(full);
        // demoSession.js checks for a signed-in account only to choose between a
        // guest demo and the account's own demo when a demo link is opened.
        else if (entry.name.endsWith('.js') && !entry.name.endsWith('.test.js') && !READ_ALLOWED.has(entry.name)) {
          if (/getItem\(\s*['"]currentUser['"]\s*\)/.test(await readFile(full, 'utf8'))) offenders.push(relative(srcRoot, full));
        }
      }
    };
    await walk(srcRoot);
    assert.deepStrictEqual(offenders, [], `use getSessionUser() instead in: ${offenders.join(', ')}`);
  });
});
