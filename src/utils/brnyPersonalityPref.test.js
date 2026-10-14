/**
 * The personality preference is per *user*, and the read path runs on every prompt
 * build, so these pin the three things that would break brny silently: the key (a
 * wrong key reads another user's pick, or nobody's), the fallback (an unknown stored
 * value must not reach the playbook), and the tolerance of a missing/rejecting
 * storage (an unpicked user on a locked-down browser must still get the default).
 */

import test from 'node:test';
import assert from 'node:assert/strict';

import { DEFAULT_PERSONALITY_ID } from './brnyPersonalities.js';
import {
  brnyPersonalityKey,
  getUserBrnyPersonality,
  setUserBrnyPersonality
} from './brnyPersonalityPref.js';

function fakeStorage(initial = {}) {
  const data = new Map(Object.entries(initial));
  return {
    data,
    getItem: (key) => (data.has(key) ? data.get(key) : null),
    setItem: (key, value) => data.set(key, value)
  };
}

test('the key namespaces the pick to a single user', () => {
  assert.strictEqual(brnyPersonalityKey('user-1'), 'relay_brny_personality_user-1');
  assert.notStrictEqual(brnyPersonalityKey('user-1'), brnyPersonalityKey('user-2'));
  assert.strictEqual(brnyPersonalityKey(), 'relay_brny_personality_default');
  assert.strictEqual(brnyPersonalityKey(null), brnyPersonalityKey(undefined));
});

test('an unpicked user gets the default, never another user\'s pick', () => {
  const storage = fakeStorage({ 'relay_brny_personality_user-1': 'trainer' });

  assert.strictEqual(getUserBrnyPersonality('user-1', storage), 'trainer');
  assert.strictEqual(getUserBrnyPersonality('user-2', storage), DEFAULT_PERSONALITY_ID);
});

test('a round trip stores exactly what was asked for, and reads it back', () => {
  const storage = fakeStorage();

  assert.strictEqual(setUserBrnyPersonality('user-1', 'formal', storage), 'formal');
  assert.strictEqual(getUserBrnyPersonality('user-1', storage), 'formal');
});

test('a bad stored value resolves to the default instead of reaching the playbook', () => {
  for (const stored of ['not-a-personality', 'trainer2', '', '{"id":"brief"}']) {
    const storage = fakeStorage({ 'relay_brny_personality_user-1': stored });
    assert.strictEqual(getUserBrnyPersonality('user-1', storage), DEFAULT_PERSONALITY_ID);
  }
});

test('an invalid pick is normalised on the way in, not stored raw', () => {
  const storage = fakeStorage();

  assert.strictEqual(setUserBrnyPersonality('user-1', 'TRAINER', storage), 'trainer');
  assert.strictEqual(storage.getItem('relay_brny_personality_user-1'), 'trainer');

  assert.strictEqual(setUserBrnyPersonality('user-1', 'nonsense', storage), DEFAULT_PERSONALITY_ID);
  assert.strictEqual(storage.getItem('relay_brny_personality_user-1'), DEFAULT_PERSONALITY_ID);
});

test('a missing storage is the default, and an unpickable one is not a throw', () => {
  // No storage at all is what the test environment looks like.
  assert.strictEqual(getUserBrnyPersonality('user-1', null), DEFAULT_PERSONALITY_ID);

  const hostile = {
    getItem: () => { throw new Error('denied'); },
    setItem: () => { throw new Error('quota'); }
  };

  assert.strictEqual(getUserBrnyPersonality('user-1', hostile), DEFAULT_PERSONALITY_ID);
  assert.strictEqual(setUserBrnyPersonality('user-1', 'brief', hostile), 'brief');
});
