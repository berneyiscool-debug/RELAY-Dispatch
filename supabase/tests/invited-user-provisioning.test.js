/**
 * Behavioural tests for invited-team-member provisioning.
 *
 * Two live bugs are pinned down here:
 *
 *   1. An invited staff member signed in and was asked to "Create your company",
 *      because the deployed `invite-user` never wrote a `profiles` row and the
 *      hardened `handle_new_user_profile()` trigger reads only app_metadata.
 *   2. Deleting that company left the account behind, because `delete-company`
 *      only knew about users through `profiles.company_id`.
 *
 * The decisions live in supabase/functions/invite-user/provision.js and
 * supabase/functions/delete-company/cleanup.js so they can be exercised for real.
 * The rules that matter are the ones that could hand somebody the wrong tenant:
 * which Auth account an interrupted invite is allowed to adopt, and which Auth
 * accounts are considered part of the company being deleted.
 *
 * Run with: npm run test:migrations
 */
import { describe, test } from 'node:test';
import assert from 'node:assert';

import {
  LEGACY_COMPANY_ID,
  RELAY_STAFF_DOMAIN,
  companyTechTypeId,
  isCompanyStaffEmail,
  normalizeStaffRole,
  findAuthUserByEmail,
  isDuplicateAuthUserError,
  readProfileForUser,
  staffProfileValues,
  ensureProfileForUser,
} from '../functions/invite-user/provision.js';

import {
  isCompanyStaffEmail as cleanupStaffEmail,
  listAllAuthUsers,
  companyAuthUserIds,
  isMissingAuthUserError,
} from '../functions/delete-company/cleanup.js';

const COMPANY_ID = 'a00f8dd3-1a1a-4887-ba24-a07925c358e7';
const OTHER_COMPANY_ID = 'f30f2acf-21c6-443e-b7b8-f1e7cb990e6e';
const CALLER_ID = 'admin-u1';

// A stand-in for the service-role Supabase client: only the surfaces the two
// helper modules touch, with the same result shapes.
function makeAdmin(options = {}) {
  const failures = options.failures || {};
  const state = {
    users: (options.users || []).map((user) => ({
      app_metadata: {},
      user_metadata: {},
      ...user,
    })),
    profiles: (options.profiles || []).map((profile) => ({ ...profile })),
    calls: {
      listUsers: [],
      createUser: [],
      updateUserById: [],
      deleteUser: [],
      profileInserts: [],
      profileUpdates: [],
    },
  };

  const matches = (row, filters) => filters.every(([column, value]) => row[column] === value);

  return {
    state,
    admin: {
      auth: {
        admin: {
          async listUsers({ page = 1, perPage = 200 } = {}) {
            state.calls.listUsers.push({ page, perPage });
            if (failures.listUsers) return { data: null, error: failures.listUsers };
            const start = (page - 1) * perPage;
            const batch = state.users.slice(start, start + perPage);
            const more = start + batch.length < state.users.length;
            return { data: { users: batch, nextPage: more ? page + 1 : null }, error: null };
          },
          async createUser(payload) {
            state.calls.createUser.push(payload);
            if (failures.createUser) return { data: { user: null }, error: failures.createUser };
            const user = {
              id: options.newUserId || 'created-u1',
              email: payload.email,
              user_metadata: { ...(payload.user_metadata || {}) },
              app_metadata: { ...(payload.app_metadata || {}) },
            };
            state.users.push(user);
            return { data: { user }, error: null };
          },
          async updateUserById(id, patch) {
            state.calls.updateUserById.push({ id, patch });
            if (failures.updateUserById) return { data: { user: null }, error: failures.updateUserById };
            const user = state.users.find((candidate) => candidate.id === id);
            if (user) Object.assign(user, patch);
            return { data: { user: user || { id } }, error: null };
          },
          async deleteUser(id) {
            state.calls.deleteUser.push(id);
            if (failures.deleteUser) return { error: failures.deleteUser };
            const index = state.users.findIndex((user) => user.id === id);
            if (index >= 0) state.users.splice(index, 1);
            return { error: null };
          },
        },
      },
      from(table) {
        assert.strictEqual(table, 'profiles', 'these helpers only touch profiles');
        return {
          select() {
            const filters = [];
            const chain = {
              eq(column, value) {
                filters.push([column, value]);
                return chain;
              },
              async maybeSingle() {
                if (failures.profileRead) return { data: null, error: failures.profileRead };
                return { data: state.profiles.find((row) => matches(row, filters)) || null, error: null };
              },
            };
            return chain;
          },
          insert(row) {
            state.calls.profileInserts.push(row);
            if (failures.profileInsert) return Promise.resolve({ error: failures.profileInsert });
            // `silentProfileInsert` models a write that reports success and
            // leaves nothing behind — the case the verify step must catch.
            if (!failures.silentProfileInsert) state.profiles.push({ ...row });
            return Promise.resolve({ error: null });
          },
          update(patch) {
            const filters = [];
            const run = async () => {
              state.calls.profileUpdates.push({ patch, filters: filters.map(([c, v]) => [c, v]) });
              if (failures.profileUpdate) return { error: failures.profileUpdate };
              for (const row of state.profiles) {
                if (matches(row, filters)) Object.assign(row, patch);
              }
              return { error: null };
            };
            const chain = {
              eq(column, value) {
                filters.push([column, value]);
                return chain;
              },
              then: (resolve, reject) => run().then(resolve, reject),
            };
            return chain;
          },
        };
      },
    },
  };
}

describe('company staff addresses', () => {
  test('the launch-screen domain is the one both modules match on', () => {
    assert.strictEqual(RELAY_STAFF_DOMAIN, 'relay.internal');
    assert.strictEqual(cleanupStaffEmail('a@x.relay.internal', 'x'), isCompanyStaffEmail('a@x.relay.internal', 'x'));
  });

  test('an address under the company slug is the company staff address', () => {
    assert.strictEqual(isCompanyStaffEmail('gracie@acme.relay.internal', 'acme'), true);
  });

  test('case and spacing do not change the answer', () => {
    assert.strictEqual(isCompanyStaffEmail('  GRACIE@Acme.Relay.Internal ', '  ACME '), true);
  });

  test('another company, another domain, or no slug is not a match', () => {
    assert.strictEqual(isCompanyStaffEmail('gracie@other.relay.internal', 'acme'), false);
    assert.strictEqual(isCompanyStaffEmail('gracie@acme.example.com', 'acme'), false);
    assert.strictEqual(isCompanyStaffEmail('gracie@acme.relay.internal', null), false);
    assert.strictEqual(isCompanyStaffEmail('gracie@acme.relay.internal', ''), false);
    assert.strictEqual(isCompanyStaffEmail('', 'acme'), false);
    assert.strictEqual(isCompanyStaffEmail(null, 'acme'), false);
  });

  test('a suffix that merely ends in the slug does not match', () => {
    assert.strictEqual(isCompanyStaffEmail('gracie@notacme.relay.internal', 'acme'), false);
  });

  test('the company\'s own admin address still matches its slug', () => {
    // joshua.berney@testrcomanieforpaymentflow.relay.internal — the live orphan.
    assert.strictEqual(
      isCompanyStaffEmail('joshua.berney@testrcomanieforpaymentflow.relay.internal', 'testrcomanieforpaymentflow'),
      true
    );
  });
});

describe('staff type ids', () => {
  test('modern companies are prefixed with their own id', () => {
    assert.strictEqual(companyTechTypeId(COMPANY_ID), `${COMPANY_ID}_ut_tech`);
  });

  test('the legacy company keeps its unprefixed ids', () => {
    assert.strictEqual(companyTechTypeId(LEGACY_COMPANY_ID), 'ut_tech');
  });
});

describe('role coercion', () => {
  test('an explicit manager stays a manager', () => {
    assert.strictEqual(normalizeStaffRole('manager'), 'manager');
  });

  test('everything else becomes a technician, as the Auth trigger does', () => {
    for (const role of ['admin', 'Teacher', 'technician', '', null, undefined]) {
      assert.strictEqual(normalizeStaffRole(role), 'technician');
    }
  });
});

describe('recognising a taken email address', () => {
  test('the codes and messages GoTrue uses for a duplicate', () => {
    assert.strictEqual(isDuplicateAuthUserError({ code: 'email_exists' }), true);
    assert.strictEqual(isDuplicateAuthUserError({ code: 'user_already_exists' }), true);
    assert.strictEqual(isDuplicateAuthUserError({ message: 'A user with this email address has already been registered' }), true);
  });

  test('other failures are not treated as a duplicate', () => {
    for (const error of [
      { code: 'validation_failed', message: 'Password should be at least 6 characters' },
      { code: 'email_address_invalid', status: 422, message: 'Email address is invalid' },
      { message: 'fetch failed' },
      null,
      undefined,
    ]) {
      assert.strictEqual(isDuplicateAuthUserError(error), false);
    }
  });
});

describe('looking up an Auth user by email', () => {
  const users = [
    { id: 'u1', email: 'a@one.relay.internal' },
    { id: 'u2', email: 'b@one.relay.internal' },
    { id: 'u3', email: 'c@one.relay.internal' },
  ];

  test('finds an address on a later page', async () => {
    const { admin, state } = makeAdmin({ users });
    const found = await findAuthUserByEmail(admin, 'c@one.relay.internal', { perPage: 2 });

    assert.strictEqual(found.id, 'u3');
    assert.deepStrictEqual(state.calls.listUsers, [
      { page: 1, perPage: 2 },
      { page: 2, perPage: 2 },
    ]);
  });

  test('compares addresses case-insensitively and trims the input', async () => {
    const { admin } = makeAdmin({ users });
    const found = await findAuthUserByEmail(admin, ' B@ONE.relay.internal ');
    assert.strictEqual(found.id, 'u2');
  });

  test('stops at the end of the list without looping forever', async () => {
    const { admin, state } = makeAdmin({ users });
    assert.strictEqual(await findAuthUserByEmail(admin, 'nobody@one.relay.internal', { perPage: 2 }), null);
    assert.strictEqual(state.calls.listUsers.length, 2);
  });

  test('an empty address is not looked up at all', async () => {
    const { admin, state } = makeAdmin({ users });
    assert.strictEqual(await findAuthUserByEmail(admin, ''), null);
    assert.strictEqual(state.calls.listUsers.length, 0);
  });

  test('a failing lookup surfaces instead of reading as "no such user"', async () => {
    const { admin } = makeAdmin({ users, failures: { listUsers: { message: 'rate limit exceeded' } } });
    await assert.rejects(
      () => findAuthUserByEmail(admin, 'a@one.relay.internal'),
      /rate limit exceeded/
    );
  });
});

describe('reading the profile of a user', () => {
  test('returns the row when there is one', async () => {
    const { admin } = makeAdmin({ profiles: [{ id: 'u1', company_id: COMPANY_ID, role: 'technician' }] });
    const { profile, error } = await readProfileForUser(admin, 'u1');
    assert.strictEqual(error, null);
    assert.strictEqual(profile.company_id, COMPANY_ID);
  });

  test('a missing row is not an error — it is exactly the situation being repaired', async () => {
    const { admin } = makeAdmin({});
    const { profile, error } = await readProfileForUser(admin, 'u1');
    assert.strictEqual(profile, null);
    assert.strictEqual(error, null);
  });

  test('a real read failure is reported, not mistaken for a missing row', async () => {
    const { admin } = makeAdmin({ failures: { profileRead: { message: 'permission denied' } } });
    const { profile, error } = await readProfileForUser(admin, 'u1');
    assert.strictEqual(profile, null);
    assert.match(error, /permission denied/);
  });
});

describe('the profile row an invite writes', () => {
  const input = {
    userId: 'u9',
    companyId: COMPANY_ID,
    email: 'ada@acme.relay.internal',
    name: 'Ada',
    username: 'ada',
    role: 'technician',
    userTypeId: null,
    color: null,
    payRate: null,
    forcePasswordChange: false,
  };

  test('the created row carries the company link the app gates on', () => {
    const { create } = staffProfileValues(input);
    assert.deepStrictEqual(create, {
      id: 'u9',
      company_id: COMPANY_ID,
      name: 'Ada',
      email: 'ada@acme.relay.internal',
      username: 'ada',
      role: 'technician',
      user_type_id: `${COMPANY_ID}_ut_tech`,
      color: '#1B6DE0',
      pay_rate: 0,
      force_password_change: false,
    });
  });

  test('the legacy company gets the unprefixed technician type', () => {
    const { create } = staffProfileValues({ ...input, companyId: LEGACY_COMPANY_ID });
    assert.strictEqual(create.user_type_id, 'ut_tech');
  });

  test('an assigned type, colour and pay rate are kept', () => {
    const { create } = staffProfileValues({
      ...input,
      userTypeId: `${COMPANY_ID}_ut_office`,
      color: '#FF5C00',
      payRate: 27.5,
    });
    assert.strictEqual(create.user_type_id, `${COMPANY_ID}_ut_office`);
    assert.strictEqual(create.color, '#FF5C00');
    assert.strictEqual(create.pay_rate, 27.5);
  });

  test('role is coerced the way the Auth trigger would have coerced it', () => {
    assert.strictEqual(staffProfileValues({ ...input, role: 'admin' }).create.role, 'technician');
    assert.strictEqual(staffProfileValues({ ...input, role: 'manager' }).create.role, 'manager');
  });

  test('the update set matches what the invite used to write', () => {
    const { updates } = staffProfileValues({ ...input, color: '#FF5C00', payRate: 30 });
    assert.deepStrictEqual(updates, {
      color: '#FF5C00',
      pay_rate: 30,
      user_type_id: `${COMPANY_ID}_ut_tech`,
      username: 'ada',
      force_password_change: false,
    });
  });

  test('only a repaired or password-reset account is forced to change password', () => {
    assert.strictEqual(staffProfileValues(input).create.force_password_change, false);
    assert.strictEqual(staffProfileValues({ ...input, forcePasswordChange: true }).create.force_password_change, true);
    assert.strictEqual(staffProfileValues({ ...input, forcePasswordChange: true }).updates.force_password_change, true);
  });
});

describe('making sure the invited user has a profile', () => {
  const create = { id: 'u9', company_id: COMPANY_ID, role: 'technician', username: 'ada' };
  const updates = { username: 'ada', force_password_change: false };

  test('inserts the row the trigger never wrote and confirms it landed', async () => {
    const { admin, state } = makeAdmin({});
    const result = await ensureProfileForUser({ admin, userId: 'u9', create, updates });

    assert.strictEqual(result.error, undefined);
    assert.strictEqual(result.created, true);
    assert.strictEqual(result.profile.company_id, COMPANY_ID);
    assert.deepStrictEqual(state.calls.profileInserts, [create]);
    assert.strictEqual(state.calls.profileUpdates.length, 0);
  });

  test('updates a row the trigger already wrote instead of inserting a second one', async () => {
    const { admin, state } = makeAdmin({
      profiles: [{ id: 'u9', company_id: COMPANY_ID, role: 'technician' }],
      failures: { profileInsert: { message: 'duplicate key value violates unique constraint' } },
    });
    const result = await ensureProfileForUser({ admin, userId: 'u9', create, updates });

    assert.strictEqual(result.error, undefined);
    assert.strictEqual(result.created, false);
    assert.strictEqual(result.profile.id, 'u9');
    assert.strictEqual(state.calls.profileUpdates.length, 1);
    assert.deepStrictEqual(state.profiles[0].username, 'ada');
  });

  test('a write that reports success but leaves no row is a failure, never a success', async () => {
    const { admin } = makeAdmin({ failures: { silentProfileInsert: true } });
    const result = await ensureProfileForUser({ admin, userId: 'u9', create, updates });

    assert.ok(result.error, 'expected an error');
    assert.match(result.error, /could not be confirmed/);
  });

  test('an insert error is reported with its reason', async () => {
    const { admin } = makeAdmin({ failures: { profileInsert: { message: 'row level security violation' } } });
    const result = await ensureProfileForUser({ admin, userId: 'u9', create, updates });
    assert.match(result.error, /row level security violation/);
  });

  test('an update error is reported with its reason', async () => {
    const { admin } = makeAdmin({
      profiles: [{ id: 'u9', company_id: COMPANY_ID, role: 'technician' }],
      failures: { profileUpdate: { message: 'connection reset' } },
    });
    const result = await ensureProfileForUser({ admin, userId: 'u9', create, updates });
    assert.match(result.error, /connection reset/);
  });

  test('an unreadable profile is not silently treated as missing', async () => {
    const { admin, state } = makeAdmin({ failures: { profileRead: { message: 'timeout' } } });
    const result = await ensureProfileForUser({ admin, userId: 'u9', create, updates });

    assert.match(result.error, /timeout/);
    assert.strictEqual(state.calls.profileInserts.length, 0);
  });

  test('the orphaned invite from the live database is repaired by this path', async () => {
    // joshua.berney@… : an Auth account with app_metadata.company_id set and no
    // profiles row. Re-adding the same username must end with the row present.
    const { admin } = makeAdmin({
      users: [{
        id: '9e7e84e8-95d8-4a97-b3e5-447ee7e47f81',
        email: 'joshua.berney@testrcomanieforpaymentflow.relay.internal',
        app_metadata: { company_id: COMPANY_ID, role: 'technician' },
        user_metadata: { company_id: COMPANY_ID },
      }],
    });

    const found = await findAuthUserByEmail(admin, 'joshua.berney@testrcomanieforpaymentflow.relay.internal');
    assert.strictEqual(found.id, '9e7e84e8-95d8-4a97-b3e5-447ee7e47f81');

    const { profile } = await readProfileForUser(admin, found.id);
    assert.strictEqual(profile, null);

    const values = staffProfileValues({
      userId: found.id,
      companyId: COMPANY_ID,
      email: found.email,
      name: 'Joshua',
      username: 'joshua.berney',
      role: 'technician',
      forcePasswordChange: true,
    });
    const result = await ensureProfileForUser({ admin, userId: found.id, create: values.create, updates: values.updates });

    assert.strictEqual(result.error, undefined);
    assert.strictEqual(result.created, true);
    assert.strictEqual(result.profile.company_id, COMPANY_ID);
    assert.strictEqual(result.profile.force_password_change, true);
  });
});

describe('listing every Auth user', () => {
  const many = Array.from({ length: 5 }, (_, index) => ({ id: `u${index}`, email: `u${index}@x.relay.internal` }));

  test('walks the pages and reports the walk as complete', async () => {
    const { admin } = makeAdmin({ users: many });
    const { users, complete } = await listAllAuthUsers(admin, { perPage: 2 });

    assert.strictEqual(complete, true);
    assert.deepStrictEqual(users.map((user) => user.id), ['u0', 'u1', 'u2', 'u3', 'u4']);
  });

  test('refuses to call a truncated walk complete', async () => {
    const { admin } = makeAdmin({ users: many });
    const { users, complete } = await listAllAuthUsers(admin, { perPage: 2, maxPages: 2 });

    assert.strictEqual(complete, false);
    assert.strictEqual(users.length, 4);
  });

  test('a failing walk throws rather than looking like an empty company', async () => {
    const { admin } = makeAdmin({ users: many, failures: { listUsers: { message: 'permission denied' } } });
    await assert.rejects(() => listAllAuthUsers(admin), /permission denied/);
  });
});

describe('which Auth accounts belong to the company being deleted', () => {
  test('profiles are the primary link', () => {
    const ids = companyAuthUserIds(
      [{ id: 'u1' }, { id: 'u2' }],
      { companyId: COMPANY_ID, profileIds: ['u1', 'u2'], emailSlug: 'acme' }
    );
    assert.deepStrictEqual(ids, ['u1', 'u2']);
  });

  test('an account whose profile row was never written is still found', () => {
    // This is the live orphan: no profile, but app_metadata.company_id is set.
    const ids = companyAuthUserIds(
      [
        { id: CALLER_ID, email: 'admin@acme.relay.internal' },
        { id: 'orphan', email: 'tech@acme.relay.internal', app_metadata: { company_id: COMPANY_ID } },
      ],
      { companyId: COMPANY_ID, profileIds: [CALLER_ID], emailSlug: 'acme' }
    );
    assert.deepStrictEqual(ids.sort(), [CALLER_ID, 'orphan'].sort());
  });

  test('an interrupted invite with no metadata at all is found by its staff address', () => {
    const ids = companyAuthUserIds(
      [{ id: 'orphan', email: 'tech@acme.relay.internal', app_metadata: { provider: 'email' } }],
      { companyId: COMPANY_ID, profileIds: [], emailSlug: 'acme' }
    );
    assert.deepStrictEqual(ids, ['orphan']);
  });

  test('another company is never swept up', () => {
    const ids = companyAuthUserIds(
      [
        { id: 'other-tenant', email: 'someone@other.relay.internal', app_metadata: { company_id: OTHER_COMPANY_ID } },
        { id: 'self-signup', email: 'someone@example.com', app_metadata: { provider: 'email' } },
      ],
      { companyId: COMPANY_ID, profileIds: [], emailSlug: 'acme' }
    );
    assert.deepStrictEqual(ids, []);
  });

  test('user_metadata is ignored, because the user can write it', () => {
    const ids = companyAuthUserIds(
      [{ id: 'forger', email: 'someone@example.com', user_metadata: { company_id: COMPANY_ID } }],
      { companyId: COMPANY_ID, profileIds: [], emailSlug: 'acme' }
    );
    assert.deepStrictEqual(ids, []);
  });

  test('each account appears once', () => {
    const ids = companyAuthUserIds(
      [{ id: 'u1', email: 'tech@acme.relay.internal', app_metadata: { company_id: COMPANY_ID } }],
      { companyId: COMPANY_ID, profileIds: ['u1'], emailSlug: 'acme' }
    );
    assert.deepStrictEqual(ids, ['u1']);
  });

  test('the caller is deleted last so a half-finished cleanup can be retried', () => {
    const ids = companyAuthUserIds(
      [
        { id: CALLER_ID, email: 'admin@acme.relay.internal' },
        { id: 'u2' },
      ],
      { companyId: COMPANY_ID, profileIds: [CALLER_ID, 'u2'], emailSlug: 'acme', callerId: CALLER_ID }
    );
    assert.deepStrictEqual(ids, ['u2', CALLER_ID]);
  });

  test('a missing email slug degrades to the metadata links instead of matching everything', () => {
    const ids = companyAuthUserIds(
      [
        { id: 'unknown', email: 'tech@acme.relay.internal' },
        { id: 'known', email: 'tech@acme.relay.internal', app_metadata: { company_id: COMPANY_ID } },
      ],
      { companyId: COMPANY_ID, profileIds: [], emailSlug: null }
    );
    assert.deepStrictEqual(ids, ['known']);
  });

  test('a user entry without an id is skipped', () => {
    const ids = companyAuthUserIds([null, {}, { id: 'u1' }], { companyId: COMPANY_ID, profileIds: ['u1'], emailSlug: 'acme' });
    assert.deepStrictEqual(ids, ['u1']);
  });
});

describe('a user id that is already gone', () => {
  test('is skipped rather than failing the whole deletion', () => {
    assert.strictEqual(isMissingAuthUserError({ code: 'user_not_found', message: 'User not found' }), true);
    assert.strictEqual(isMissingAuthUserError({ status: 404, message: 'Not found' }), true);
  });

  test('real failures still fail', () => {
    for (const error of [{ status: 500, message: 'Database error' }, { message: 'fetch failed' }, null, undefined]) {
      assert.strictEqual(isMissingAuthUserError(error), false);
    }
  });
});
