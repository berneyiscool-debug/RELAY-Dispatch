/**
 * `ask_user` — the question tool.
 *
 * A clarifying question has to be a tool call, because only a tool result
 * resumes the paused turn: a question written into prose ends the turn with the
 * user retyping what the card would have offered as buttons. These pin the
 * contract the loop and the question card both depend on — the action is
 * interactive, it carries no permission (so brny is always offered it), the
 * options arrive as plain strings, and the tool description says the
 * prose-question rule out loud, since the description is the one place the model
 * reads on every turn whether or not a custom prompt is set.
 */

import test from 'node:test';
import assert from 'node:assert/strict';

import './conversation.js';
import { executeAction, getAction, listAvailableActions, toToolDefinitions } from './registry.js';

const CTX = { source: 'brny', actor: { id: 'user_test', name: 'Test Admin', role: 'admin' } };

test('ask_user is registered as an interactive action', () => {
  const action = getAction('ask_user');
  assert.ok(action, 'ask_user must be registered');
  assert.equal(action.interactive, true, 'the loop only ends the turn on an interactive outcome');
  assert.equal(action.risky, false, 'a question must never raise an approval card');
  assert.equal(action.readOnly, false);
});

test('ask_user carries no permission, so the model is always offered it', () => {
  assert.ok(listAvailableActions(CTX).some((action) => action.name === 'ask_user'));
  assert.ok(toToolDefinitions(CTX).some((tool) => tool.name === 'ask_user'));
});

test('the tool description tells the model to call it instead of asking in prose', () => {
  const { description } = getAction('ask_user');
  assert.match(description, /instead of writing a question into your reply/);
  assert.match(description, /2 to 6 short options/, 'choices are what the card renders as buttons');
  assert.match(description, /One question per call|one question per call/);
});

test('the options are declared as an array of short strings', () => {
  const { inputSchema } = getAction('ask_user');
  assert.deepEqual(inputSchema.required, ['question']);
  assert.equal(inputSchema.properties.options.type, 'array');
  assert.equal(inputSchema.properties.options.items.type, 'string');
  assert.equal(inputSchema.additionalProperties, false);
});

test('a question with choices comes back as the pause payload', async () => {
  const outcome = await executeAction(
    'ask_user',
    {
      question: 'Which Acme did you mean?',
      options: ['Acme North', 'Acme South'],
      detail: 'Two customers match that name.',
    },
    CTX
  );

  assert.equal(outcome.interactive, true);
  assert.equal(outcome.summary, 'Which Acme did you mean?');
  assert.deepEqual(outcome.result, {
    asked: true,
    question: 'Which Acme did you mean?',
    detail: 'Two customers match that name.',
    options: ['Acme North', 'Acme South'],
  });
});

test('a free-text question carries no options', async () => {
  const outcome = await executeAction('ask_user', { question: 'What is the gate code?' }, CTX);
  assert.deepEqual(outcome.result.options, []);
  assert.equal(outcome.result.detail, '');
});

test('a question with no question, or an unknown field, is rejected', async () => {
  await assert.rejects(() => executeAction('ask_user', { options: ['Yes'] }, CTX), /question is required/);
  await assert.rejects(
    () => executeAction('ask_user', { question: 'Which one?', choices: ['Acme North'] }, CTX),
    /Unrecognised input field/
  );
});

// `update_plan` is the checklist brny shows before a multi-step job. It must be
// offered to everyone, change nothing, and never stop the turn or ask approval,
// or laying out a plan would itself stall the work it describes.
test('update_plan is a read-only, always-offered action that never pauses the turn', () => {
  const action = getAction('update_plan');
  assert.ok(action, 'update_plan must be registered');
  assert.equal(action.readOnly, true);
  assert.equal(action.risky, false);
  assert.equal(action.interactive, false);
  assert.ok(toToolDefinitions(CTX).some((tool) => tool.name === 'update_plan'));
});

test('update_plan hands the steps straight back and summarises progress', async () => {
  const steps = [
    { title: 'Find Harbour Electrical', status: 'done' },
    { title: 'Book Jake in for Friday', status: 'in_progress' },
    { title: 'Add a to-do for the quote', status: 'pending' },
  ];
  const outcome = await executeAction('update_plan', { steps }, CTX);
  assert.deepEqual(outcome.result, { planned: true, steps });
  assert.equal(outcome.summary, '1 of 3 steps done');
});

test('update_plan rejects a status the panel cannot draw', async () => {
  await assert.rejects(() => executeAction('update_plan', { steps: [{ title: 'Find them', status: 'started' }] }, CTX));
  await assert.rejects(() => executeAction('update_plan', {}, CTX), /steps is required/);
});

test('the update_plan description says to plan first, alongside the first tool', () => {
  const { description } = getAction('update_plan');
  assert.match(description, /Call it first with every step/);
  assert.match(description, /in the same response as the first tool/);
  assert.match(description, /Skip it for a single lookup/);
});
