import { test, describe } from 'node:test';
import assert from 'node:assert';
import { resolveSettingsTab, SETTINGS_DEFAULT_TAB, TAB_ALIASES } from './settingsTabs.js';

// The canonical settings tabs both the settings page and the sidebar agree on.
const CANONICAL_SETTINGS_TABS = [
  'company', 'billing', 'portal', 'portal_contractor', 'local_storage', 'system',
  'templates_forms', 'invoices_quotes', 'payments', 'email',
  'users', 'suppliers', 'materials', 'storage_options', 'cost_centers', 'tax'
];

// Sidebar entries that open a canonical tab but keep their own item id so the
// correct sub-tab stays highlighted (see the `groups` model in Sidebar.js).
const SIDEBAR_ONLY_ITEM_TABS = ['user_types', 'password_recovery'];

// Every alias must resolve to a tab the sidebar can find a group for, otherwise
// it highlights nothing and drops its "Back to Settings" button.
const SIDEBAR_SETTINGS_TABS = CANONICAL_SETTINGS_TABS.concat(SIDEBAR_ONLY_ITEM_TABS);

describe('Settings Tabs: resolveSettingsTab', () => {
  test('should default the sub-tabs while leaving the tab blank when absent', () => {
    for (const raw of [null, undefined, '', '   ']) {
      assert.deepStrictEqual(resolveSettingsTab(raw), {
        tab: '',
        templatesSubTab: 'tasklists',
        usersSubTab: 'users'
      });
    }
  });

  test('should pass canonical tab ids through unchanged', () => {
    for (const raw of CANONICAL_SETTINGS_TABS) {
      const resolved = resolveSettingsTab(raw);
      assert.strictEqual(resolved.tab, raw);
      assert.strictEqual(resolved.templatesSubTab, 'tasklists');
      assert.strictEqual(resolved.usersSubTab, 'users');
    }
  });

  test('should keep the sidebar-only user items on the users tab', () => {
    for (const raw of SIDEBAR_ONLY_ITEM_TABS) {
      assert.strictEqual(resolveSettingsTab(raw).tab, 'users');
    }
  });

  test('should map templates & forms aliases to the matching sub-tab', () => {
    assert.deepStrictEqual(resolveSettingsTab('forms'), { tab: 'templates_forms', templatesSubTab: 'forms', usersSubTab: 'users' });
    assert.deepStrictEqual(resolveSettingsTab('tasks'), { tab: 'templates_forms', templatesSubTab: 'tasklists', usersSubTab: 'users' });
    assert.deepStrictEqual(resolveSettingsTab('tasklists'), { tab: 'templates_forms', templatesSubTab: 'tasklists', usersSubTab: 'users' });
    assert.deepStrictEqual(resolveSettingsTab('quotes'), { tab: 'templates_forms', templatesSubTab: 'quotes', usersSubTab: 'users' });
    assert.deepStrictEqual(resolveSettingsTab('quote_templates'), { tab: 'templates_forms', templatesSubTab: 'quotes', usersSubTab: 'users' });
  });

  test('should map users aliases to the matching sub-tab', () => {
    assert.deepStrictEqual(resolveSettingsTab('users'), { tab: 'users', templatesSubTab: 'tasklists', usersSubTab: 'users' });
    assert.deepStrictEqual(resolveSettingsTab('user_types'), { tab: 'users', templatesSubTab: 'tasklists', usersSubTab: 'user_types' });
    assert.deepStrictEqual(resolveSettingsTab('password_recovery'), { tab: 'users', templatesSubTab: 'tasklists', usersSubTab: 'password_recovery' });
  });

  test('should map merged and removed pages onto their replacement tab', () => {
    assert.strictEqual(resolveSettingsTab('email_templates').tab, 'email');
    assert.strictEqual(resolveSettingsTab('api_keys').tab, 'company');
    assert.strictEqual(resolveSettingsTab('ai_assistant').tab, 'company');
    assert.strictEqual(resolveSettingsTab('folder_sync').tab, 'local_storage');
  });

  test('should trim surrounding whitespace before matching', () => {
    assert.strictEqual(resolveSettingsTab(' quotes ').tab, 'templates_forms');
    assert.strictEqual(resolveSettingsTab(' password_recovery ').usersSubTab, 'password_recovery');
  });

  test('should pass unknown values through so the settings page can fall back', () => {
    const resolved = resolveSettingsTab('not_a_real_tab');
    assert.strictEqual(resolved.tab, 'not_a_real_tab');
  });

  test('should only ever resolve to a tab the sidebar knows about', () => {
    // Every alias in the map, so adding one can't silently break the sidebar.
    const allLegacyTabs = Object.keys(TAB_ALIASES);
    for (const raw of allLegacyTabs.concat(SIDEBAR_SETTINGS_TABS, [SETTINGS_DEFAULT_TAB])) {
      const { tab } = resolveSettingsTab(raw);
      assert.ok(SIDEBAR_SETTINGS_TABS.includes(tab), `"${raw}" resolved to unknown tab "${tab}"`);
    }
  });

  test('should still provide every legacy link the app itself emits', () => {
    // The in-app back buttons and old bookmarks documented in the backlog item.
    const emittedLegacyTabs = ['forms', 'tasks', 'tasklists', 'quotes', 'quote_templates', 'email_templates', 'api_keys', 'ai_assistant', 'folder_sync'];
    for (const raw of emittedLegacyTabs) {
      assert.ok(TAB_ALIASES[raw], `"${raw}" is no longer mapped`);
    }
  });
});
