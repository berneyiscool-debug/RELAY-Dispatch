import { test, describe } from 'node:test';
import assert from 'node:assert';

// Sidebar.js reads persisted state while building its nav model, so provide the
// browser storage APIs before importing it.
globalThis.localStorage = {
  getItem: () => null,
  setItem() {},
  removeItem() {}
};

const { getContextualMenu } = await import('./Sidebar.js');

// Sibling panels that set the pattern the settings panel must follow: a
// second-level panel always offers a control back to the first-level panel it
// hangs off (data-back-section) or to its parent list (data-path).
const SIBLING_BACK_CONTROLS = [
  { hash: '/stock', backSection: 'cat-resources', backLabel: 'Back to Resources' },
  { hash: '/leads', backSection: 'cat-workflow', backLabel: 'Back to Workflow' }
];

describe('Sidebar: settings submenu back control', () => {
  test('offers a back control to the Admin panel from the group list', () => {
    const contextual = getContextualMenu('/settings');

    assert.strictEqual(contextual.railId, 'cat-admin');
    assert.strictEqual(contextual.headerTitle, 'Settings & Config');
    assert.strictEqual(contextual.openGroupId, null);
    assert.strictEqual(contextual.backSection, 'cat-admin');
    assert.strictEqual(contextual.backLabel, 'Back to Admin');
    assert.strictEqual(contextual.backPath, undefined);
  });

  test('renders the group list when no tab is requested', () => {
    const contextual = getContextualMenu('/settings');

    assert.deepStrictEqual(contextual.groups.map(g => g.id), [
      'general', 'workflow', 'people', 'resources'
    ]);
  });

  test('returns to the group list from a drilled-in group', () => {
    const contextual = getContextualMenu('/settings?tab=company');

    assert.strictEqual(contextual.openGroupId, 'general');
    assert.strictEqual(contextual.backPath, '/settings');
    assert.strictEqual(contextual.backLabel, 'Back to Settings');
    assert.strictEqual(contextual.backSection, undefined);
  });

  test('drills in for legacy tab aliases instead of falling back to the group list', () => {
    const aliases = {
      forms: 'workflow',
      tasks: 'workflow',
      quote_templates: 'workflow',
      quotes: 'workflow',
      user_types: 'people',
      password_recovery: 'people',
      email_templates: 'workflow',
      api_keys: 'general',
      ai_assistant: 'general',
      folder_sync: 'general'
    };

    for (const [alias, groupId] of Object.entries(aliases)) {
      const contextual = getContextualMenu(`/settings?tab=${alias}`);

      assert.strictEqual(contextual.openGroupId, groupId, `?tab=${alias} should open ${groupId}`);
      assert.strictEqual(contextual.backPath, '/settings', `?tab=${alias} should offer a way back`);
    }
  });

  test('every settings panel exposes exactly one back control', () => {
    const groupList = getContextualMenu('/settings');

    const routes = ['/settings'];
    for (const group of groupList.groups) {
      for (const item of group.items) routes.push(item.path);
    }

    for (const route of routes) {
      const contextual = getContextualMenu(route);
      const controls = [contextual.backPath, contextual.backSection].filter(Boolean);

      assert.strictEqual(controls.length, 1, `${route} should offer exactly one back control`);
      assert.ok(contextual.backLabel, `${route} should label its back control`);
    }
  });

  test('follows the same back-control shape as the sibling panels', () => {
    for (const sibling of SIBLING_BACK_CONTROLS) {
      const contextual = getContextualMenu(sibling.hash);

      assert.strictEqual(contextual.backSection, sibling.backSection, `${sibling.hash} back section`);
      assert.strictEqual(contextual.backLabel, sibling.backLabel, `${sibling.hash} back label`);
    }
  });
});

describe('Sidebar: lead detail submenu tabs', () => {
  const routeFor = (tab) => `/leads/lead_prev_0${tab ? `?tab=${tab}` : ''}`;

  test('exposes the Details and Activity tabs', () => {
    const contextual = getContextualMenu(routeFor());

    assert.deepStrictEqual(contextual.items.map(i => i.id), ['overview', 'activity']);
    assert.deepStrictEqual(contextual.items.map(i => i.label), ['Details', 'Activity']);
  });

  test('defaults to the Details tab and targets the lead in every path', () => {
    const contextual = getContextualMenu(routeFor());

    assert.strictEqual(contextual.activeTab, 'overview');
    for (const item of contextual.items) {
      assert.ok(item.path.startsWith('/leads/lead_prev_0?tab='), `${item.id} should stay on the lead`);
    }
  });

  test('activates the tab named in the query string', () => {
    assert.strictEqual(getContextualMenu(routeFor('activity')).activeTab, 'activity');
    assert.strictEqual(getContextualMenu(routeFor('overview')).activeTab, 'overview');
  });

  test('falls back to the Details tab for an unknown tab', () => {
    assert.strictEqual(getContextualMenu(routeFor('nonsense')).activeTab, 'overview');
  });

  test('leaves the lead form and create routes without tabs', () => {
    assert.strictEqual(getContextualMenu('/leads/new'), null);
    assert.strictEqual(getContextualMenu('/leads/lead_prev_0/edit'), null);
  });
});
