/**
 * The action-tag parser's contract, pinned without a DOM.
 *
 * This parser used to live inside RelayAssistant.js, which cannot be imported in
 * node at all (it pulls in `?url` workers and DOMPurify), so it could only be
 * exercised by hand in a browser. It is a pure string helper, so it now lives
 * here and gets the tests it never had.
 *
 * The first case is a real production bug. answerAgentTurn handed a pending
 * promise from an async path into the reply pipeline, the promise reached
 * `.toUpperCase()`, and the user saw "The model returned an empty reply." with a
 * local fallback instead of the model's answer. A non-string reply must degrade
 * to "no tags, no text" rather than throw.
 */

import test from 'node:test';
import assert from 'node:assert/strict';

import { extractActions } from './relayActionTags.js';

test('a non-string reply yields no tags instead of throwing', () => {
  for (const value of [undefined, null, 42, {}, [], Promise.resolve('x'), () => {}]) {
    assert.deepEqual(extractActions(value), { actions: [], cleanReply: '' });
  }
});

test('a reply with no tags passes through untouched', () => {
  const reply = '  Nothing to see here.\n';
  assert.deepEqual(extractActions(reply), { actions: [], cleanReply: reply.trim() });
});

test('one tag is extracted and removed from the prose', () => {
  const { actions, cleanReply } = extractActions('Booked the job [ACTION: CREATE_JOB, {"customer":"Acme"}] for tomorrow');
  assert.deepEqual(actions, [{ action: 'CREATE_JOB', param: '{"customer":"Acme"}' }]);
  assert.equal(cleanReply, 'Booked the job  for tomorrow');
});

test('a bare tag has a null param', () => {
  assert.deepEqual(extractActions('[ACTION: LIST_JOBS]'), { actions: [{ action: 'LIST_JOBS', param: null }], cleanReply: '' });
});

test('tag name and prefix are case-insensitive and upper-cased', () => {
  assert.deepEqual(extractActions('go [action: go_home]'), { actions: [{ action: 'GO_HOME', param: null }], cleanReply: 'go' });
});

test('the param splits on the first comma only', () => {
  const { actions } = extractActions('[ACTION: FIND_CUSTOMER, Acme Ltd, Suite 4]');
  assert.deepEqual(actions, [{ action: 'FIND_CUSTOMER', param: 'Acme Ltd, Suite 4' }]);
});

test('brackets inside a JSON param do not end the tag early', () => {
  const { actions, cleanReply } = extractActions('[ACTION: SET_X, {"list":[1,2]}] done');
  assert.deepEqual(actions, [{ action: 'SET_X', param: '{"list":[1,2]}' }]);
  assert.equal(cleanReply, 'done');
});

test('several tags in one reply are all extracted', () => {
  assert.deepEqual(extractActions('[ACTION: A] and [ACTION: B, x]'), {
    actions: [{ action: 'A', param: null }, { action: 'B', param: 'x' }],
    cleanReply: 'and',
  });
});

test('an unclosed tag is left alone rather than swallowed', () => {
  const reply = 'oops [ACTION: BROKEN and no close';
  assert.deepEqual(extractActions(reply), { actions: [], cleanReply: reply });
});

test('the cleaned reply is trimmed', () => {
  assert.equal(extractActions('   [ACTION: A]   ').cleanReply, '');
});
