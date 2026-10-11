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

import { BRNY_PLAYBOOK, buildBrnyPlaybook } from './brnyPlaybook.js';

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
