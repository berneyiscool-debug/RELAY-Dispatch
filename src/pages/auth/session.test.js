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
