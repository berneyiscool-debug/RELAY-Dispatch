import { test, describe } from 'node:test';
import assert from 'node:assert';
import {
  findLocalUser,
  resolveLocalRole,
  defaultUserTypeId,
  companyIdFromLocalId,
  buildLocalUser,
} from './localUsers.js';

// Cover for local user lookup and identity.
//
// Three near-identical finders used to live in the sign-in paths, and they
// disagreed: one matched on email/username/name, another matched the local part
// of an email, and the Supabase-fallback path used a record's job title
// ("Senior Electrician") as its app role. These tests pin one superset finder
// and one user-type mapping so every sign-in route produces the same identity.

const TECH = { id: 'acct_1_tech_1', name: 'Jake Miller', username: 'jake', email: 'jake@apex.local', userTypeId: 'acct_1_ut_tech', color: '#FF5C00' };

describe('findLocalUser()', () => {
  const techs = [TECH, { id: 'acct_1_tech_2', name: 'Dana Reid', username: 'dana', userTypeId: 'acct_1_ut_admin' }];

  test('matches on name, username and email, case-insensitively', () => {
    assert.strictEqual(findLocalUser(techs, 'Jake Miller').id, 'acct_1_tech_1');
    assert.strictEqual(findLocalUser(techs, 'JAKE').id, 'acct_1_tech_1');
    assert.strictEqual(findLocalUser(techs, 'Jake@Apex.Local').id, 'acct_1_tech_1');
  });

  test('matches a username via the local part of a typed email', () => {
    assert.strictEqual(findLocalUser(techs, 'dana@apexpowerservices.local').id, 'acct_1_tech_2');
  });

  test('trims surrounding whitespace', () => {
    assert.strictEqual(findLocalUser(techs, '  dana  ').id, 'acct_1_tech_2');
  });

  test('returns null for unknown, blank or missing input', () => {
    assert.strictEqual(findLocalUser(techs, 'nobody'), null);
    assert.strictEqual(findLocalUser(techs, ''), null);
    assert.strictEqual(findLocalUser(techs, null), null);
    assert.strictEqual(findLocalUser([], 'jake'), null);
    assert.strictEqual(findLocalUser(undefined, 'jake'), null);
  });

  test('prefers the first match when records collide', () => {
    const dupes = [{ id: 'a', username: 'same' }, { id: 'b', username: 'same' }];
    assert.strictEqual(findLocalUser(dupes, 'same').id, 'a');
  });
});

describe('resolveLocalRole()', () => {
  test('maps bare and company-namespaced user type ids', () => {
    assert.deepStrictEqual(resolveLocalRole('ut_admin'), { role: 'admin', userTypeName: 'Admin' });
    assert.deepStrictEqual(resolveLocalRole('acct_1_ut_manager'), { role: 'manager', userTypeName: 'Manager' });
    assert.deepStrictEqual(resolveLocalRole('acct_1_ut_office'), { role: 'office', userTypeName: 'Office Staff' });
    assert.deepStrictEqual(resolveLocalRole('acct_1_ut_tech'), { role: 'technician', userTypeName: 'Technician' });
  });

  test('returns null for unknown or missing ids', () => {
    assert.strictEqual(resolveLocalRole('ut_supervisor'), null);
    assert.strictEqual(resolveLocalRole(''), null);
    assert.strictEqual(resolveLocalRole(undefined), null);
  });
});

describe('defaultUserTypeId()', () => {
  test('namespaces by company for local accounts', () => {
    assert.strictEqual(defaultUserTypeId('admin', 'acct_1'), 'acct_1_ut_admin');
    assert.strictEqual(defaultUserTypeId('technician', 'acct_1'), 'acct_1_ut_tech');
  });

  test('stays bare for non-local company ids', () => {
    assert.strictEqual(defaultUserTypeId('manager', null), 'ut_manager');
    assert.strictEqual(defaultUserTypeId('manager', '8dc14565-cloud'), 'ut_manager');
  });
});

describe('companyIdFromLocalId()', () => {
  test('extracts the account prefix', () => {
    assert.strictEqual(companyIdFromLocalId('acct_abc123_tech_1'), 'acct_abc123');
  });

  test('falls back when the id is not a local account id', () => {
    assert.strictEqual(companyIdFromLocalId('tech_1', 'acct_fallback'), 'acct_fallback');
    assert.strictEqual(companyIdFromLocalId(null), null);
  });
});

describe('buildLocalUser()', () => {
  test('uses the user-type mapping for the app role', () => {
    const user = buildLocalUser(TECH, { companyId: 'acct_1' });
    assert.strictEqual(user.role, 'technician');
    assert.strictEqual(user.userTypeName, 'Technician');
    assert.strictEqual(user.userTypeId, 'acct_1_ut_tech');
    assert.strictEqual(user.companyId, 'acct_1');
    assert.strictEqual(user.id, 'acct_1_tech_1');
    assert.strictEqual(user.email, 'jake@apex.local');
  });

  test('never leaks a job title into the role', () => {
    const user = buildLocalUser({ id: 't1', name: 'Sam', role: 'Senior Electrician', userTypeId: 'acct_1_ut_tech' });
    assert.strictEqual(user.role, 'technician');
  });

  test('keeps a real role when no user type is set', () => {
    const user = buildLocalUser({ id: 't1', name: 'Sam', role: 'admin' });
    assert.strictEqual(user.role, 'admin');
    assert.strictEqual(user.userTypeName, 'Admin');
    assert.strictEqual(user.userTypeId, 'ut_admin');
  });

  test('defaults to technician when nothing is known', () => {
    const user = buildLocalUser({ id: 't1', name: 'Sam' }, { companyId: 'acct_9' });
    assert.strictEqual(user.role, 'technician');
    assert.strictEqual(user.userTypeId, 'acct_9_ut_tech');
    assert.strictEqual(user.companyId, 'acct_9');
  });

  test('carries the record company id and pay rate through', () => {
    const user = buildLocalUser({ id: 't1', name: 'Sam', companyId: 'acct_5', payRate: 42 });
    assert.strictEqual(user.companyId, 'acct_5');
    assert.strictEqual(user.payRate, 42);
  });
});
