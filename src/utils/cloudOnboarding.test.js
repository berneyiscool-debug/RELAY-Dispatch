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
  MIN_PASSWORD_LENGTH,
  RESEND_COOLDOWN_MS,
  TERMS_ROUTE,
  PRIVACY_ROUTE,
  TRIAL_DAYS,
  passwordStrength,
  friendlyAuthError,
  resendCooldownRemaining,
  markResendSent,
  resendVerificationEmail,
  provisionCloudAccount,
} = await import('./cloudOnboarding.js');

const originalMigrate = store.migrateLocalToCloud;
const originalDeleteLocal = store.deleteLocalAccountData;
const originalFrom = supabase.from;
const originalRpc = supabase.rpc;
const originalResend = supabase.auth.resend;

async function quiet(fn) {
  const original = console.error;
  console.error = () => {};
  try {
    return await fn();
  } finally {
    console.error = original;
  }
}

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
  supabase.rpc = originalRpc;
  supabase.auth.resend = originalResend;
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

describe('password strength', () => {
  test('reports a short password as too short and unusable', () => {
    const result = passwordStrength('x7k2m9p');
    assert.strictEqual(result.score, 0);
    assert.strictEqual(result.label, 'Too short');
    assert.strictEqual(result.hint, `Use at least ${MIN_PASSWORD_LENGTH} characters.`);
    assert.strictEqual(result.ok, false);
  });

  test('accepts the minimum length even when the score is low', () => {
    const result = passwordStrength('x7k2m9p4');
    assert.strictEqual(result.score, 1);
    assert.strictEqual(result.label, 'Weak');
    assert.strictEqual(result.ok, true);
  });

  test('rewards a long password that mixes character classes', () => {
    const result = passwordStrength('Correct-Horse-9');
    assert.strictEqual(result.score, 4);
    assert.strictEqual(result.label, 'Strong');
    assert.strictEqual(result.hint, 'Strong password.');
    assert.strictEqual(result.ok, true);
  });

  test('does not cap a strong password that merely contains a digit run', () => {
    const result = passwordStrength('Xy9mKq2vBn4t');
    assert.strictEqual(result.score, 4);
    assert.strictEqual(result.label, 'Strong');
  });

  test('lands mid-scale for a long password with few character classes', () => {
    const result = passwordStrength('simply8chars');
    assert.strictEqual(result.score, 2);
    assert.strictEqual(result.label, 'Fair');
    assert.strictEqual(result.ok, true);
  });

  test('caps a repeated character and says why', () => {
    const result = passwordStrength('aaaaaaaaaaaa');
    assert.strictEqual(result.score, 1);
    assert.strictEqual(result.label, 'Weak');
    assert.match(result.hint, /same character repeated/);
    assert.strictEqual(result.ok, true);
  });

  test('caps a sequential run and says why', () => {
    const result = passwordStrength('Abcdefgh1234');
    assert.strictEqual(result.score, 1);
    assert.strictEqual(result.label, 'Weak');
    assert.match(result.hint, /Avoid runs like/);
    assert.match(result.hint, /\u2014/);
  });

  test('leaves a four-character password uncapped rather than calling it weak', () => {
    const result = passwordStrength('abcd');
    assert.strictEqual(result.score, 0);
    assert.strictEqual(result.label, 'Too short');
    assert.strictEqual(result.ok, false);
  });

  test('treats missing input as empty', () => {
    for (const input of [null, undefined, '']) {
      const result = passwordStrength(input);
      assert.strictEqual(result.score, 0);
      assert.strictEqual(result.ok, false);
    }
  });
});

describe('friendly auth errors', () => {
  test('falls back to a generic message when there is no error', () => {
    for (const input of [null, undefined, '', 0]) {
      assert.strictEqual(friendlyAuthError(input), 'Something went wrong. Please try again.');
    }
  });

  test('blames the connection when the request never landed', () => {
    assert.match(friendlyAuthError(new TypeError('Failed to fetch')), /couldn't reach RELAY/);
    assert.match(friendlyAuthError({ message: 'NetworkError when attempting to fetch resource.' }), /couldn't reach RELAY/);
  });

  test('prefers rate limiting over the duplicate-email message', () => {
    const message = friendlyAuthError({ message: 'User already registered', status: 429 });
    assert.match(message, /Too many attempts/);
  });

  test('points an existing account at sign-in and password reset', () => {
    assert.match(friendlyAuthError({ message: 'User already registered' }), /Sign in instead/);
    assert.match(friendlyAuthError({ code: 'user_already_exists' }), /already exists for that email/);
  });

  test('repeats the minimum length when Supabase rejects a weak password', () => {
    assert.match(friendlyAuthError({ code: 'weak_password' }), new RegExp(`${MIN_PASSWORD_LENGTH} characters`));
    assert.match(friendlyAuthError({ message: 'Password should be at least 6 characters.' }), /stronger password/);
  });

  test('tells an unverified user to open the emailed link', () => {
    assert.match(friendlyAuthError({ message: 'Email not confirmed' }), /not confirmed yet/);
    assert.match(friendlyAuthError({ message: 'email_not_confirmed' }), /not confirmed yet/);
  });

  test('flags an address Supabase could not validate', () => {
    assert.match(friendlyAuthError({ code: 'email_address_invalid' }), /does not look valid/);
    assert.match(friendlyAuthError({ message: 'Invalid email' }), /does not look valid/);
  });

  test('explains paused signups', () => {
    assert.match(friendlyAuthError({ message: 'Signups not allowed for this instance' }), /signups are paused/i);
  });

  test('points a mismatched password at the reset link', () => {
    assert.match(friendlyAuthError({ message: 'Invalid login credentials' }), /do not match/);
  });

  test('passes an unrecognised message through instead of hiding it', () => {
    assert.strictEqual(friendlyAuthError({ message: 'pg: unexpected_failure' }), 'pg: unexpected_failure');
  });
});

describe('resend verification email', () => {
  test('exposes the shared constants the signup screen relies on', () => {
    assert.strictEqual(MIN_PASSWORD_LENGTH, 8);
    assert.strictEqual(RESEND_COOLDOWN_MS, 60 * 1000);
    assert.strictEqual(TERMS_ROUTE, '#/terms');
    assert.strictEqual(PRIVACY_ROUTE, '#/privacy');
    assert.strictEqual(TRIAL_DAYS, 14);
  });

  test('allows the first send for an address', () => {
    assert.strictEqual(resendCooldownRemaining('dana@example.com'), 0);
  });

  test('sends the canonical address and starts the cooldown afterwards', async () => {
    const calls = [];
    supabase.auth.resend = async (options) => {
      calls.push(options);
      return { data: { sent: true }, error: null };
    };
    const data = await resendVerificationEmail('Admin@Acme');
    assert.deepStrictEqual(calls, [{ type: 'signup', email: 'admin@acme.relay.internal' }]);
    assert.deepStrictEqual(data, { sent: true });
    assert.ok(resendCooldownRemaining('Admin@Acme') > 0);
  });

  test('does not start a cooldown when the send fails', async () => {
    supabase.auth.resend = async () => ({ data: null, error: new TypeError('Failed to fetch') });
    await assert.rejects(() => resendVerificationEmail('dana@example.com'), /couldn't reach RELAY/);
    assert.strictEqual(resendCooldownRemaining('dana@example.com'), 0);
  });

  test('refuses to send without an address', async () => {
    let called = false;
    supabase.auth.resend = async () => {
      called = true;
      return { data: null, error: null };
    };
    await assert.rejects(() => resendVerificationEmail(''), /Enter the email address you signed up with/);
    assert.strictEqual(called, false);
  });

  test('counts the cooldown down to zero', () => {
    Date.now = () => 1000000;
    markResendSent('dana@example.com');
    assert.strictEqual(resendCooldownRemaining('dana@example.com'), RESEND_COOLDOWN_MS);
    Date.now = () => 1000000 + RESEND_COOLDOWN_MS - 1;
    assert.strictEqual(resendCooldownRemaining('dana@example.com'), 1);
    Date.now = () => 1000000 + RESEND_COOLDOWN_MS;
    assert.strictEqual(resendCooldownRemaining('dana@example.com'), 0);
  });

  test('shares one cooldown between the aliases of a bare domain', () => {
    markResendSent('admin@acme');
    assert.ok(resendCooldownRemaining('admin@acme.relay.internal') > 0);
  });

  test('keys a normal address by its exact spelling', () => {
    markResendSent('Dana@Example.com');
    assert.ok(resendCooldownRemaining('Dana@Example.com') > 0);
    assert.strictEqual(resendCooldownRemaining('dana@example.com'), 0);
  });

  test('records nothing for an address it cannot canonicalise', () => {
    markResendSent('');
    assert.strictEqual(localMem.has('relay_resend_cooldown'), false);
  });
});

function stubRpc(handler) {
  const calls = [];
  supabase.rpc = async (name, args) => {
    calls.push({ name, args });
    return handler(name, args);
  };
  return calls;
}

describe('cloud provisioning', () => {
  test('refuses to provision without a signed-in user', async () => {
    const calls = stubRpc(() => ({ data: null, error: null }));
    await assert.rejects(() => provisionCloudAccount({ companyName: 'Acme Electrical' }), /Sign in again to finish setting up/);
    assert.strictEqual(calls.length, 0);
  });

  test('sends the trimmed company name and nulls the optional fields', async () => {
    const calls = stubRpc((name) => (name === 'create_company_and_admin' ? { data: 'comp_1', error: null } : { data: null, error: null }));
    const result = await provisionCloudAccount({ userId: 'u1', companyName: '  Acme Electrical  ', adminName: '', adminPhone: '' });
    assert.deepStrictEqual(calls[0], {
      name: 'create_company_and_admin',
      args: { user_id: 'u1', company_name: 'Acme Electrical', admin_name: null, admin_phone: null },
    });
    assert.deepStrictEqual(calls.map((call) => call.name), ['create_company_and_admin', 'start_cloud_trial']);
    assert.deepStrictEqual(result, { companyId: 'comp_1', trialEndsAt: null });
  });

  test('passes the prefill through as typed', async () => {
    const calls = stubRpc((name) => (name === 'create_company_and_admin' ? { data: 'comp_1', error: null } : { data: null, error: null }));
    await provisionCloudAccount({ userId: 'u1', companyName: 'Acme', adminName: 'Dana Reed', adminPhone: '555 0100' });
    assert.strictEqual(calls[0].args.admin_name, 'Dana Reed');
    assert.strictEqual(calls[0].args.admin_phone, '555 0100');
  });

  test('reports a rejected RPC once, without starting a trial', async () => {
    const calls = stubRpc(() => ({ data: null, error: { message: 'company name is already taken', code: 'P0001' } }));
    await assert.rejects(() => provisionCloudAccount({ userId: 'u1', companyName: 'Acme' }), /company name is already taken/);
    assert.deepStrictEqual(calls.map((call) => call.name), ['create_company_and_admin']);
  });

  test('stamps the terms acceptance and starts the trial, in order', async () => {
    const calls = stubRpc((name) => {
      if (name === 'create_company_and_admin') return { data: 'comp_1', error: null };
      if (name === 'start_cloud_trial') return { data: '2026-01-15T00:00:00.000Z', error: null };
      return { data: null, error: null };
    });
    const result = await provisionCloudAccount({ userId: 'u1', companyName: 'Acme', termsAccepted: true });
    assert.deepStrictEqual(calls.map((call) => call.name), [
      'create_company_and_admin',
      'record_terms_acceptance',
      'start_cloud_trial',
    ]);
    assert.strictEqual(calls[1].args, undefined);
    assert.deepStrictEqual(calls[2].args, { p_days: TRIAL_DAYS });
    assert.deepStrictEqual(result, { companyId: 'comp_1', trialEndsAt: '2026-01-15T00:00:00.000Z' });
  });

  test('skips the terms stamp when the box was not ticked', async () => {
    const calls = stubRpc((name) => (name === 'create_company_and_admin' ? { data: 'comp_1', error: null } : { data: null, error: null }));
    await provisionCloudAccount({ userId: 'u1', companyName: 'Acme', termsAccepted: false });
    assert.strictEqual(calls.some((call) => call.name === 'record_terms_acceptance'), false);
  });

  test('still returns the company when the terms and trial calls fail', async () => {
    await quiet(async () => {
      const calls = stubRpc((name) => (name === 'create_company_and_admin' ? { data: 'comp_1', error: null } : { data: null, error: { message: 'not so fast' } }));
      const result = await provisionCloudAccount({ userId: 'u1', companyName: 'Acme', termsAccepted: true });
      assert.deepStrictEqual(calls.map((call) => call.name), [
        'create_company_and_admin',
        'record_terms_acceptance',
        'start_cloud_trial',
      ]);
      assert.deepStrictEqual(result, { companyId: 'comp_1', trialEndsAt: null });
    });
  });

  test('survives a terms or trial call that throws', async () => {
    await quiet(async () => {
      stubRpc((name) => {
        if (name === 'create_company_and_admin') return { data: 'comp_1', error: null };
        throw new Error('rpc exploded');
      });
      const result = await provisionCloudAccount({ userId: 'u1', companyName: 'Acme', termsAccepted: true });
      assert.deepStrictEqual(result, { companyId: 'comp_1', trialEndsAt: null });
    });
  });
});
