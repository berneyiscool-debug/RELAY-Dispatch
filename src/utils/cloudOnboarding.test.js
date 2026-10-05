import { test, describe, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert';

// No jsdom in this repo — the module under test only needs storage plus the
// shared Supabase stub, so both are stood up before the import.
const localMem = new Map();
globalThis.localStorage = {
  getItem: (k) => (localMem.has(k) ? localMem.get(k) : null),
  setItem: (k, v) => localMem.set(k, String(v)),
  removeItem: (k) => localMem.delete(k),
  clear: () => localMem.clear(),
};

const sessionMem = new Map();
globalThis.sessionStorage = {
  getItem: (k) => (sessionMem.has(k) ? sessionMem.get(k) : null),
  setItem: (k, v) => sessionMem.set(k, String(v)),
  removeItem: (k) => sessionMem.delete(k),
  clear: () => sessionMem.clear(),
};

const { supabase } = await import('./supabase.js');
const { store } = await import('../data/store.js');
const { getSessionUser, clearSessionUser } = await import('../pages/auth/session.js');
const {
  authEmailCandidates,
  canonicalAuthEmail,
  describeSignUpResult,
  signInWithEmailCandidates,
  fetchProfile,
  sessionUserFromProfile,
  forgetLocalAccount,
  completeCloudMigration,
  savePendingSignup,
  readPendingSignup,
  clearPendingSignup,
  savePendingMigration,
  readPendingMigration,
  clearPendingMigration,
  PENDING_SIGNUP_KEY,
  PENDING_MIGRATION_KEY,
} = await import('./cloudOnboarding.js');

const originalMigrate = store.migrateLocalToCloud;
const originalDeleteLocal = store.deleteLocalAccountData;
const originalFrom = supabase.from;

let deletedLocalIds = [];

function stubSignIn(handler) {
  supabase.auth.signInWithPassword = handler;
}

beforeEach(() => {
  localMem.clear();
  sessionMem.clear();
  deletedLocalIds = [];
  clearSessionUser();
  clearPendingSignup();
  clearPendingMigration();
  store.migrateLocalToCloud = async () => {};
  store.deleteLocalAccountData = (id) => { deletedLocalIds.push(id); };
  stubSignIn(async () => ({ data: null, error: { message: 'invalid login credentials' } }));
});

afterEach(() => {
  store.migrateLocalToCloud = originalMigrate;
  store.deleteLocalAccountData = originalDeleteLocal;
  supabase.from = originalFrom;
});

describe('cloud auth email aliases', () => {
  test('keeps the typed address first so pre-normalisation accounts still sign in', () => {
    assert.deepStrictEqual(
      authEmailCandidates('admin@acme'),
      ['admin@acme', 'admin@acme.relay.internal', 'admin@acme.RELAY.internal']
    );
  });

  test('adds the internal alias and the legacy uppercase variant for relay domains', () => {
    assert.deepStrictEqual(
      authEmailCandidates('admin@acme.RELAY.internal'),
      ['admin@acme.RELAY.internal', 'admin@acme.relay.internal']
    );
    assert.deepStrictEqual(
      authEmailCandidates('admin@acme.relay.internal'),
      ['admin@acme.relay.internal', 'admin@acme.RELAY.internal']
    );
  });

  test('leaves real domains alone', () => {
    assert.deepStrictEqual(authEmailCandidates('admin@acme.com.au'), ['admin@acme.com.au']);
  });

  test('trims and has no candidates for an empty box', () => {
    assert.deepStrictEqual(authEmailCandidates('  admin@acme.com  '), ['admin@acme.com']);
    assert.deepStrictEqual(authEmailCandidates('   '), []);
    assert.deepStrictEqual(authEmailCandidates(null), []);
  });

  test('canonicalises the address a new account is stored under', () => {
    assert.strictEqual(canonicalAuthEmail('admin@acme'), 'admin@acme.relay.internal');
    assert.strictEqual(canonicalAuthEmail('Admin@ACME'), 'admin@acme.relay.internal');
    assert.strictEqual(canonicalAuthEmail('admin@acme.RELAY.internal'), 'admin@acme.relay.internal');
    assert.strictEqual(canonicalAuthEmail('admin@acme.com.au'), 'admin@acme.com.au');
    assert.strictEqual(canonicalAuthEmail('  admin@acme.com.au  '), 'admin@acme.com.au');
    assert.strictEqual(canonicalAuthEmail(''), '');
  });
});

describe('signing in through the alias list', () => {
  test('uses the typed address when it works', async () => {
    const tried = [];
    stubSignIn(async ({ email }) => {
      tried.push(email);
      return { data: { user: { id: 'u1' } }, error: null };
    });

    const result = await signInWithEmailCandidates('admin@acme', 'pw');
    assert.deepStrictEqual(tried, ['admin@acme']);
    assert.strictEqual(result.data.user.id, 'u1');
  });

  test('falls back to the internal address for accounts created after normalisation', async () => {
    const tried = [];
    stubSignIn(async ({ email }) => {
      tried.push(email);
      if (email === 'admin@acme.relay.internal') return { data: { user: { id: 'u2' } }, error: null };
      return { data: null, error: { message: 'Invalid login credentials', code: 'invalid_credentials' } };
    });

    const result = await signInWithEmailCandidates('admin@acme', 'pw');
    assert.deepStrictEqual(tried, ['admin@acme', 'admin@acme.relay.internal']);
    assert.strictEqual(result.data.user.id, 'u2');
  });

  test('tries the legacy uppercase domain last', async () => {
    const tried = [];
    stubSignIn(async ({ email }) => {
      tried.push(email);
      if (email === 'admin@acme.RELAY.internal') return { data: { user: { id: 'u3' } }, error: null };
      return { data: null, error: { message: 'Invalid login credentials', code: 'invalid_credentials' } };
    });

    const result = await signInWithEmailCandidates('admin@acme', 'pw');
    assert.deepStrictEqual(tried, ['admin@acme', 'admin@acme.relay.internal', 'admin@acme.RELAY.internal']);
    assert.strictEqual(result.data.user.id, 'u3');
  });

  test('does not hammer the server after a failure that is not a credential failure', async () => {
    let calls = 0;
    stubSignIn(async () => {
      calls += 1;
      return { data: null, error: { message: 'Email rate limit exceeded', code: 'over_email_send_rate_limit' } };
    });

    const result = await signInWithEmailCandidates('admin@acme', 'pw');
    assert.strictEqual(calls, 1);
    assert.match(result.error.message, /rate limit/i);
  });

  test('surfaces the last credential error when nothing matches', async () => {
    stubSignIn(async () => ({ data: null, error: { message: 'Invalid login credentials' } }));
    const result = await signInWithEmailCandidates('admin@acme', 'pw');
    assert.match(result.error.message, /Invalid login credentials/);
  });
});

describe('interpreting a signup response', () => {
  test('throws the Supabase error when signup fails outright', () => {
    const boom = new Error('User already registered');
    assert.throws(() => describeSignUpResult({ data: null, error: boom }), /User already registered/);
  });

  test('rejects a response with no user', () => {
    assert.throws(
      () => describeSignUpResult({ data: { user: null }, error: null }),
      /Verification required or signup was blocked/
    );
  });

  test('names the duplicate-email fake success instead of pretending to send mail', () => {
    assert.throws(
      () => describeSignUpResult({ data: { user: { id: 'u1', identities: [] }, session: null }, error: null }),
      /An account already exists for that email address/
    );
  });

  test('reports confirmation as pending when no session comes back', () => {
    const result = describeSignUpResult({
      data: { user: { id: 'u1', identities: [{ id: 'i1' }] }, session: null },
      error: null,
    });
    assert.deepStrictEqual(result, { userId: 'u1', needsConfirmation: true });
  });

  test('reports a usable session', () => {
    const result = describeSignUpResult({
      data: { user: { id: 'u1' }, session: { access_token: 't' } },
      error: null,
    });
    assert.deepStrictEqual(result, { userId: 'u1', needsConfirmation: false });
  });
});

describe('session user from a profile', () => {
  test('maps a modern admin profile', () => {
    const user = sessionUserFromProfile({
      id: 'p1',
      company_id: 'c1',
      name: 'Ada',
      role: 'admin',
      user_type_id: null,
      color: null,
      avatar_url: null,
    });
    assert.deepStrictEqual(user, {
      id: 'p1',
      companyId: 'c1',
      name: 'Ada',
      role: 'admin',
      userTypeName: 'Admin',
      userTypeId: 'c1_ut_admin',
      color: '#3B82F6',
      avatarUrl: null,
    });
  });

  test('keeps the legacy company id on the short user-type ids', () => {
    const user = sessionUserFromProfile({
      id: 'p2',
      company_id: '8dc14565-23c2-4f7d-aeb3-1da615df7644',
      name: 'Bob',
      role: 'technician',
      color: '#FF5C00',
      avatar_url: 'https://example.com/a.png',
    });
    assert.strictEqual(user.userTypeId, 'ut_tech');
    assert.strictEqual(user.userTypeName, 'Technician');
    assert.strictEqual(user.color, '#FF5C00');
    assert.strictEqual(user.avatarUrl, 'https://example.com/a.png');
  });

  test('honours an assigned user type and a custom fallback colour', () => {
    const user = sessionUserFromProfile(
      { id: 'p3', company_id: 'c3', name: 'Cy', role: 'manager', user_type_id: 'c3_ut_manager' },
      '#FF5C00'
    );
    assert.strictEqual(user.userTypeId, 'c3_ut_manager');
    assert.strictEqual(user.color, '#FF5C00');
  });
});

describe('onboarding markers', () => {
  test('round-trips a pending signup and clears it', () => {
    assert.strictEqual(readPendingSignup(), null);
    savePendingSignup({ userId: 'u1', companyName: 'Acme' });
    const marker = readPendingSignup();
    assert.strictEqual(marker.userId, 'u1');
    assert.strictEqual(marker.companyName, 'Acme');
    assert.ok(marker.createdAt > 0);
    assert.ok(sessionMem.has(PENDING_SIGNUP_KEY));
    clearPendingSignup();
    assert.strictEqual(readPendingSignup(), null);
    assert.ok(!sessionMem.has(PENDING_SIGNUP_KEY));
  });

  test('round-trips a pending migration and clears it', () => {
    savePendingMigration({ userId: 'u1', companyId: 'c1', localAccountId: 'acct_1' });
    assert.strictEqual(readPendingMigration().localAccountId, 'acct_1');
    assert.ok(sessionMem.has(PENDING_MIGRATION_KEY));
    clearPendingMigration();
    assert.strictEqual(readPendingMigration(), null);
  });

  test('ignores a marker that is too old to belong to this attempt', () => {
    sessionMem.set(PENDING_SIGNUP_KEY, JSON.stringify({
      userId: 'u1',
      createdAt: Date.now() - (25 * 60 * 60 * 1000),
    }));
    assert.strictEqual(readPendingSignup(), null);
    assert.ok(!sessionMem.has(PENDING_SIGNUP_KEY));
  });

  test('ignores and clears unreadable marker data', () => {
    sessionMem.set(PENDING_SIGNUP_KEY, '{not json');
    assert.strictEqual(readPendingSignup(), null);
    assert.ok(!sessionMem.has(PENDING_SIGNUP_KEY));
  });
});

describe('finishing a paid migration', () => {
  function seedLocalAccount(id) {
    localMem.set('relay_accounts', JSON.stringify([{ id }, { id: 'acct_keep' }]));
    sessionMem.set('relay_active_account', id);
  }

  test('copies the data up, retires the local account and starts the cloud session', async () => {
    const calls = [];
    store.migrateLocalToCloud = async (companyId, userId) => { calls.push([companyId, userId]); };
    seedLocalAccount('acct_1');
    savePendingMigration({ userId: 'u1', companyId: 'c1', localAccountId: 'acct_1' });

    const user = await completeCloudMigration({
      userId: 'u1',
      companyId: 'c1',
      profile: { id: 'u1', company_id: 'c1', name: 'Ada', role: 'admin' },
    });

    assert.deepStrictEqual(calls, [['c1', 'u1']]);
    assert.deepStrictEqual(JSON.parse(localMem.get('relay_accounts')).map(a => a.id), ['acct_keep']);
    assert.deepStrictEqual(deletedLocalIds, ['acct_1']);
    assert.strictEqual(sessionMem.has('relay_active_account'), false);
    assert.strictEqual(readPendingMigration(), null);
    assert.strictEqual(getSessionUser().companyId, 'c1');
    assert.strictEqual(user.companyId, 'c1');
  });

  test('falls back to the tab\'s active account when the marker has no id', async () => {
    seedLocalAccount('acct_9');
    await completeCloudMigration({
      userId: 'u1',
      companyId: 'c1',
      profile: { id: 'u1', company_id: 'c1', name: 'Ada', role: 'admin' },
    });
    assert.deepStrictEqual(deletedLocalIds, ['acct_9']);
  });

  test('keeps every local record when the migration itself fails', async () => {
    store.migrateLocalToCloud = async () => { throw new Error('network down'); };
    seedLocalAccount('acct_1');
    savePendingMigration({ userId: 'u1', companyId: 'c1', localAccountId: 'acct_1' });

    await assert.rejects(
      () => completeCloudMigration({ userId: 'u1', companyId: 'c1', profile: { id: 'u1', company_id: 'c1' } }),
      /network down/
    );

    assert.deepStrictEqual(JSON.parse(localMem.get('relay_accounts')).map(a => a.id), ['acct_1', 'acct_keep']);
    assert.deepStrictEqual(deletedLocalIds, []);
    assert.strictEqual(getSessionUser(), null);
    assert.strictEqual(readPendingMigration().localAccountId, 'acct_1');
  });

  test('forgetLocalAccount tolerates unreadable account storage', () => {
    localMem.set('relay_accounts', 'not json');
    assert.doesNotThrow(() => forgetLocalAccount('acct_1'));
    assert.deepStrictEqual(deletedLocalIds, ['acct_1']);
    assert.strictEqual(forgetLocalAccount(null), undefined);
  });
});

describe('profile lookup', () => {
  test('returns the row', async () => {
    supabase.from = () => ({
      select: () => ({ eq: () => ({ single: async () => ({ data: { id: 'u1', company_id: 'c1' }, error: null }) }) }),
    });
    assert.strictEqual((await fetchProfile('u1')).company_id, 'c1');
  });

  test('explains a missing profile rather than returning undefined', async () => {
    supabase.from = () => ({
      select: () => ({ eq: () => ({ single: async () => ({ data: null, error: { message: 'no rows', code: 'PGRST116' } }) }) }),
    });
    await assert.rejects(() => fetchProfile('u1'), /Your user profile could not be found: no rows \(PGRST116\)/);
  });
});
