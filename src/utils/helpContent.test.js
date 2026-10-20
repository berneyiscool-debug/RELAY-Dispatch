import { test } from 'node:test';
import assert from 'node:assert/strict';
import { HELP_GROUPS, HELP_TOPICS, getHelpTopic, searchHelp, visibleTopics } from './helpContent.js';

test('every topic is well formed and in a known group', () => {
  const ids = new Set();
  for (const t of HELP_TOPICS) {
    assert.ok(t.id && t.title && t.summary && t.icon, t.id);
    assert.ok(!ids.has(t.id), `duplicate id ${t.id}`);
    ids.add(t.id);
    assert.ok(HELP_GROUPS.includes(t.group), `${t.id} group`);
    for (const s of t.sections || []) {
      assert.ok(s.heading && s.items.length, `${t.id} section`);
      s.items.forEach(i => assert.ok(i.label && i.text, `${t.id} item`));
    }
    for (const a of t.actions || []) {
      assert.ok(a.label && (a.path || ['tour', 'settings-tour', 'restart'].includes(a.run)), `${t.id} action`);
      if (a.path) assert.ok(a.path.startsWith('/'), `${t.id} path`);
    }
  }
});

test('every group has at least one topic', () => {
  HELP_GROUPS.forEach(g => assert.ok(HELP_TOPICS.some(t => t.group === g), g));
});

test('getHelpTopic finds by id', () => {
  assert.equal(getHelpTopic('quotes').title, 'Quotes');
  assert.equal(getHelpTopic('nope'), null);
});

test('search matches topics and items, all words required', () => {
  assert.deepEqual(searchHelp(''), []);
  const reminder = searchHelp('payment reminder');
  assert.ok(reminder.some(r => r.item && r.item.label === 'Reminders'));
  const recurring = searchHelp('RECURRING');
  assert.ok(recurring.some(r => r.topic.id === 'jobs'));
  assert.deepEqual(searchHelp('zzzz-not-a-thing'), []);
});

test('topic-level hits come before item hits', () => {
  const r = searchHelp('invoices');
  const firstItem = r.findIndex(x => x.item);
  const lastTopic = r.map(x => !x.item).lastIndexOf(true);
  assert.ok(firstItem === -1 || lastTopic < firstItem);
});

test('cloud companies are not shown the Cloud upsell topic', () => {
  assert.ok(visibleTopics({ cloud: false }).some(t => t.id === 'cloud'));
  assert.ok(!visibleTopics({ cloud: true }).some(t => t.id === 'cloud'));
  assert.equal(visibleTopics({ cloud: true }).length, HELP_TOPICS.length - HELP_TOPICS.filter(t => t.localOnly).length);
});
