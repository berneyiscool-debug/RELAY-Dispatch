/**
 * The personality catalogue feeds two things: the Settings cards and the tone
 * bullet. A bad entry breaks the Settings page silently (a missing tone means the
 * card does nothing), so these pin the shape of the data.
 */

import test from 'node:test';
import assert from 'node:assert/strict';

import {
  BRNY_PERSONALITIES,
  DEFAULT_BRNY_TONE,
  DEFAULT_PERSONALITY_ID,
  brnyVoiceLine,
  getBrnyPersonality
} from './brnyPersonalities.js';

test('the default personality is the first entry', () => {
  assert.strictEqual(BRNY_PERSONALITIES[0].id, DEFAULT_PERSONALITY_ID);
  assert.strictEqual(DEFAULT_BRNY_TONE, BRNY_PERSONALITIES[0].tone);
});

test('every personality carries the fields the Settings card renders', () => {
  for (const personality of BRNY_PERSONALITIES) {
    assert.match(personality.id, /^[a-z][a-z0-9_]*$/, `${personality.id} is not a stable id`);
    assert.ok(personality.name && personality.name.trim(), `${personality.id} has no name`);
    assert.ok(personality.summary && personality.summary.trim(), `${personality.id} has no summary`);
    assert.ok(personality.example && personality.example.trim(), `${personality.id} has no example`);
    assert.match(personality.tone, /^- /, `${personality.id} does not use the playbook bullet style`);
  }
});

test('the ids and the tone lines are distinct', () => {
  const ids = BRNY_PERSONALITIES.map((p) => p.id);
  const tones = BRNY_PERSONALITIES.map((p) => p.tone);
  assert.strictEqual(new Set(ids).size, ids.length);
  assert.strictEqual(new Set(tones).size, tones.length);
});

test('an unknown, empty or wrong-typed id is the default, never a throw', () => {
  for (const value of ['nope', '', '   ', 'FRIENDLY_HACK', null, undefined, 42, {}]) {
    assert.strictEqual(getBrnyPersonality(value).id, DEFAULT_PERSONALITY_ID);
  }
});

test('the id is matched case- and whitespace-insensitively', () => {
  assert.strictEqual(getBrnyPersonality('  Trainer ').id, 'trainer');
  assert.strictEqual(getBrnyPersonality('FORMAL').id, 'formal');
});

test('the default adds no extra line, the others do', () => {
  assert.strictEqual(brnyVoiceLine(undefined), '');
  assert.strictEqual(brnyVoiceLine('straight'), '');
  assert.strictEqual(brnyVoiceLine('nope'), '');
  for (const personality of BRNY_PERSONALITIES) {
    if (personality.id === DEFAULT_PERSONALITY_ID) continue;
    assert.strictEqual(brnyVoiceLine(personality.id), personality.tone);
  }
});
