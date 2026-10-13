/**
 * The playbook is the live system prompt for the agent path.
 *
 * It used to say "one focused question per ask, with short options" without ever
 * naming the `ask_user` tool, and the approval rule right below it said "call it
 * rather than asking in prose". Read together, prose looked like a legitimate way
 * to ask. It is not: a prose question cannot be matched to a tool result, so the
 * turn ends and the user retypes an answer the card would have offered as
 * buttons. These pin the rule that replaced it.
 *
 * The legacy `[QUESTION:]` / `[QUESTION_MULTI:]` ban is pinned too, because the
 * text protocol it removes is the obvious thing to reintroduce by accident.
 */

import test from 'node:test';
import assert from 'node:assert/strict';

import { BRNY_PLAYBOOK, LEGACY_BASE_PROMPT, buildBrnyPlaybook } from './brnyPlaybook.js';
import { BRNY_PERSONALITIES, DEFAULT_BRNY_TONE } from './brnyPersonalities.js';

test('the playbook names ask_user as the way to ask', () => {
  assert.match(BRNY_PLAYBOOK, /call ask_user/);
  assert.match(BRNY_PLAYBOOK, /A question is a tool call/);
});

test('the playbook forbids asking in prose', () => {
  assert.match(BRNY_PLAYBOOK, /Never write a question into your reply/);
});

test('the playbook asks for two to six options when the answer is a choice', () => {
  assert.match(BRNY_PLAYBOOK, /Pass 2 to 6 short options/);
  assert.match(BRNY_PLAYBOOK, /One question per call/);
});

test('the assembled prompt still bans the legacy question tags', () => {
  const prompt = buildBrnyPlaybook();
  assert.match(prompt, /\[QUESTION:\] \/ \[QUESTION_MULTI:\]/);
});

test('the assembled prompt carries the ask_user rule', () => {
  const prompt = buildBrnyPlaybook({ context: 'TODAY IS 2026-10-11.' });
  assert.match(prompt, /call ask_user/);
  assert.match(prompt, /TODAY IS 2026-10-11\./);
});

test('the playbook tells brny to read a customer\'s sites before booking', () => {
  assert.match(BRNY_PLAYBOOK, /what keeps one customer's jobs at different premises apart/);
  assert.match(BRNY_PLAYBOOK, /Read them with `list_sites`/);
  assert.match(BRNY_PLAYBOOK, /Pass `site` to `create_job` and `update_job`/);
});

test('the playbook asks rather than guesses between two of a customer\'s sites', () => {
  assert.match(BRNY_PLAYBOOK, /could mean two of the customer's sites, ask with ask_user/);
});

test('the playbook never invents a site', () => {
  assert.match(BRNY_PLAYBOOK, /Never invent a site/);
  assert.match(BRNY_PLAYBOOK, /add it with `add_site` first/);
  assert.match(BRNY_PLAYBOOK, /Only ever change an existing site with `update_site`/);
});

test('the assembled prompt with no override is the whole policy, not a base prompt', () => {
  const prompt = buildBrnyPlaybook();
  assert.match(prompt, /Every job you create starts with a Main Task/);
  assert.match(prompt, /HOW TO TALK/);
  assert.match(prompt, /Read them with `list_sites`/);
  assert.ok(!prompt.includes(LEGACY_BASE_PROMPT), 'the agent path must not fall back to the legacy base');
});

test('an override replaces the policy outright', () => {
  const prompt = buildBrnyPlaybook({ override: 'Talk like a pirate.' });
  assert.match(prompt, /Talk like a pirate\./);
  assert.ok(!prompt.includes('Every job you create starts with a Main Task'));
  assert.ok(!prompt.includes('HOW TO TALK'));
  // The escape hatches and the identity line are not part of the body, so they stay.
  assert.match(prompt, /\[QUESTION:\] \/ \[QUESTION_MULTI:\]/);
  assert.match(prompt, /Your name is brny \(lowercase\)/);
});

test('a blank override keeps the playbook', () => {
  assert.match(buildBrnyPlaybook({ override: '   ' }), /Every job you create starts with a Main Task/);
});

test('the legacy base prompt is exported for the non-agent paths', () => {
  assert.ok(LEGACY_BASE_PROMPT.length > 0);
  assert.ok(!BRNY_PLAYBOOK.includes(LEGACY_BASE_PROMPT));
});

// --- personalities -----------------------------------------------------------
//
// A personality rewrites one bullet. If the shipped tone line is ever reworded
// without the catalogue, every personality but the default silently stops working,
// so the first test here is the drift guard.

test('the personality tone line matches the shipped playbook exactly once', () => {
  assert.strictEqual(BRNY_PLAYBOOK.split(DEFAULT_BRNY_TONE).length - 1, 1);
});

test('no personality and the default personality produce the same prompt', () => {
  const withDefault = buildBrnyPlaybook({ personality: 'straight' });
  assert.strictEqual(withDefault, buildBrnyPlaybook());
  assert.ok(withDefault.startsWith(BRNY_PLAYBOOK));
});

test('a personality swaps the tone bullet and nothing else', () => {
  const tone = BRNY_PERSONALITIES.find((p) => p.id === 'brief').tone;
  const prompt = buildBrnyPlaybook({ personality: 'brief' });

  assert.ok(prompt.includes(tone));
  assert.ok(!prompt.includes(DEFAULT_BRNY_TONE));
  // The policy half is untouched.
  assert.match(prompt, /Every job you create starts with a Main Task/);
  assert.match(prompt, /Read them with `list_sites`/);
  assert.match(prompt, /call ask_user/);
  assert.match(prompt, /HOW TO TALK/);
  // The four presentation rules under the tone line are invariant.
  assert.match(prompt, /Do not use asterisks, bold markers, or emoji headings/);
  assert.match(prompt, /Write money as the business says it/);
  assert.match(prompt, /If you used a to-do or a notification/);
  assert.match(prompt, /\[QUESTION:\] \/ \[QUESTION_MULTI:\]/);
  assert.match(prompt, /Your name is brny \(lowercase\)/);
});

test('every personality is reachable and distinct from the default', () => {
  for (const personality of BRNY_PERSONALITIES) {
    const prompt = buildBrnyPlaybook({ personality: personality.id });
    assert.match(prompt, /HOW TO TALK/);
    if (personality.id === 'straight') continue;
    assert.ok(prompt.includes(personality.tone), `${personality.id} was not applied`);
    assert.ok(!prompt.includes(DEFAULT_BRNY_TONE), `${personality.id} kept the default tone`);
  }
});

test('an unknown personality falls back to the shipped playbook', () => {
  assert.strictEqual(buildBrnyPlaybook({ personality: 'not-a-personality' }), buildBrnyPlaybook());
});

test('an explicit override still beats the personality', () => {
  const prompt = buildBrnyPlaybook({ override: 'Talk like a pirate.', personality: 'trainer' });
  assert.match(prompt, /Talk like a pirate\./);
  assert.ok(!prompt.includes('HOW TO TALK'));
  assert.ok(!prompt.includes(BRNY_PERSONALITIES.find((p) => p.id === 'trainer').tone));
});
