import { test, describe, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert';
import { store } from '../data/store.js';
import {
  WORK_RULES_MODULE, defaultWorkRules, getWorkRules, withWorkRules, workRulesForType, workRulesFromPermissions,
} from './workRules.js';

const type = (id, rules) => ({ id, name: id, permissions: rules ? withWorkRules([{ module: 'Jobs', view: true }], rules) : [{ module: 'Jobs', view: true }] });

describe('work rules', () => {
  let saved;
  beforeEach(() => { saved = { companyId: store.companyId, demoMode: store.demoMode }; store.companyId = 'company-1'; store.demoMode = false; });
  afterEach(() => { store.companyId = saved.companyId; store.demoMode = saved.demoMode; });

  test('templates start with the agreed defaults', () => {
    assert.deepStrictEqual(defaultWorkRules('Technician'), { clockOn: true, booksJobTime: true, schedulable: true });
    assert.deepStrictEqual(defaultWorkRules('Manager'), { clockOn: true, booksJobTime: true, schedulable: true });
    assert.deepStrictEqual(defaultWorkRules('Office Staff'), { clockOn: false, booksJobTime: false, schedulable: false });
    assert.deepStrictEqual(defaultWorkRules('Admin'), { clockOn: false, booksJobTime: false, schedulable: true });
  });

  test('rules are stored alongside permissions and read back', () => {
    const perms = withWorkRules([{ module: 'Jobs', view: true }], { clockOn: false, booksJobTime: true, schedulable: false });
    assert.strictEqual(perms.filter(p => p.module === WORK_RULES_MODULE).length, 1);
    assert.ok(perms.some(p => p.module === 'Jobs' && p.view), 'other permissions kept');
    assert.deepStrictEqual(workRulesFromPermissions(perms), { clockOn: false, booksJobTime: true, schedulable: false });
    // Saving again replaces the entry rather than adding a second one.
    const again = withWorkRules(perms, { clockOn: true, booksJobTime: true, schedulable: true });
    assert.strictEqual(again.filter(p => p.module === WORK_RULES_MODULE).length, 1);
    assert.strictEqual(workRulesFromPermissions(again).clockOn, true);
  });

  test("a person follows their user type's stored rules", () => {
    const types = [type('ut_office', defaultWorkRules('Office Staff'))];
    assert.deepStrictEqual(getWorkRules({ userTypeId: 'ut_office' }, types), { clockOn: false, booksJobTime: false, schedulable: false });
  });

  test('a type saved before the rules existed keeps the old behaviour', () => {
    const types = [type('ut_old')];
    assert.deepStrictEqual(getWorkRules({ userTypeId: 'ut_old' }, types), { clockOn: true, booksJobTime: true, schedulable: true });
    assert.deepStrictEqual(getWorkRules({ userTypeId: 'ut_old', fieldStaff: false }, types), { clockOn: true, booksJobTime: false, schedulable: false });
    assert.deepStrictEqual(workRulesForType(types[0]), { clockOn: true, booksJobTime: true, schedulable: true });
  });

  test('a local account is one person doing everything, so the rules never apply', () => {
    store.companyId = 'acct_local';
    const types = [type('ut_office', defaultWorkRules('Office Staff'))];
    assert.deepStrictEqual(getWorkRules({ userTypeId: 'ut_office' }, types), { clockOn: true, booksJobTime: true, schedulable: true });
  });

  test('the demo uses the rules even though its account id is local-style', () => {
    store.companyId = 'acct_demo';
    store.demoMode = true;
    const types = [type('ut_office', defaultWorkRules('Office Staff'))];
    assert.strictEqual(getWorkRules({ userTypeId: 'ut_office' }, types).clockOn, false);
  });
});
