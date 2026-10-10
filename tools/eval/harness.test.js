/**
 * Proves the eval harness itself works, with no API key and no network.
 *
 * The harness is only worth trusting if two things hold: the transport really
 * sends what `relay-copilot` would send, and a turn driven through it really
 * writes to the demo store so the assertions have something true to grade. Both
 * are checked here against a local mock of the Anthropic API that plays back
 * scripted replies, so this file runs in CI and costs nothing.
 *
 * The mock server is started and the app booted once for the whole file, because
 * `boot()` caches its harness per process: the transport has to be supplied on
 * the first call or not at all.
 */

import assert from 'node:assert/strict';
import http from 'node:http';
import { once } from 'node:events';
import { after, before, describe, it } from 'node:test';

import { createAnthropicTransport } from './transport.js';
import { boot } from './bootstrap.js';
import { createChecker, diff, todayKey } from './assert.js';
import { runTask, stageTask } from './run.js';
import { validateTasks } from './tasks/index.js';

/** What the mock server is currently playing back. */
const script = {
  queue: [],
  calls: [],
  headers: [],
};

let server;
let harness;

function textReply(text) {
  return {
    id: 'msg_mock',
    type: 'message',
    role: 'assistant',
    model: 'mock-model',
    content: [{ type: 'text', text }],
    stop_reason: 'end_turn',
    usage: { input_tokens: 11, output_tokens: 4 },
  };
}

function toolReply(name, input, id = 'toolu_1') {
  return {
    id: 'msg_mock',
    type: 'message',
    role: 'assistant',
    model: 'mock-model',
    content: [{ type: 'tool_use', id, name, input }],
    stop_reason: 'tool_use',
    usage: { input_tokens: 21, output_tokens: 9 },
  };
}

/** Queue a new script and forget the previous test's traffic. */
function stage(...replies) {
  script.queue = replies;
  script.calls = [];
  script.headers = [];
}

function readBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    req.on('data', (chunk) => chunks.push(chunk));
    req.on('end', () => resolve(Buffer.concat(chunks).toString('utf8')));
    req.on('error', reject);
  });
}

function writesIn(change, collection) {
  return [...change.created, ...change.updated].filter((entry) => entry.collection === collection);
}

before(async () => {
  server = http.createServer(async (req, res) => {
    const raw = await readBody(req);
    script.calls.push(JSON.parse(raw));
    script.headers.push(req.headers);
    const reply = script.queue.length > 1 ? script.queue.shift() : script.queue[0];
    res.writeHead(200, { 'content-type': 'application/json' });
    res.end(JSON.stringify(reply));
  });
  server.listen(0, '127.0.0.1');
  await once(server, 'listening');

  harness = await boot({
    transport: createAnthropicTransport({
      apiKey: 'test-key',
      baseUrl: `http://127.0.0.1:${server.address().port}`,
    }),
  });
});

after(async () => {
  server.closeAllConnections?.();
  await new Promise((resolve) => server.close(resolve));
});

describe('eval harness', () => {
  it('sends an edge-function-shaped request', async () => {
    stage(toolReply('add_todo', { title: 'Order more RCBO20s' }), textReply('Added it.'));

    await harness.reset();
    const result = await harness.runTurn({
      prompt: 'Add a to-do to order more RCBO20s',
      system: harness.playbook,
    });

    assert.equal(result.status, 'done');
    assert.equal(result.failures.length, 0);

    const [headers] = script.headers;
    assert.equal(headers['x-api-key'], 'test-key');
    assert.equal(headers['anthropic-version'], '2023-06-01');
    assert.match(headers['content-type'], /application\/json/);

    const [first] = script.calls;
    assert.equal(first.model, 'claude-haiku-5-5');
    assert.ok(first.max_tokens > 0, 'max_tokens is required upstream');
    assert.ok(first.system.length > 200, 'the playbook should be sent as the system prompt');
    // Sampling and thinking are both omitted: the 5.5 generation 400s on a
    // `temperature`, so the eval must mirror the proxy exactly to stay valid.
    assert.equal(first.temperature, undefined);
    assert.equal(first.thinking, undefined);
    assert.deepEqual(first.tool_choice, { type: 'auto' });
    assert.ok(first.tools.some((tool) => tool.name === 'add_todo'));
    assert.equal(first.messages[0].role, 'user');
  });

  it('feeds the tool result back as a user turn and writes to the store', async () => {
    stage(toolReply('add_todo', { title: 'Order more RCBO20s' }), textReply('Added it.'));

    await harness.reset();
    const before = harness.snapshot();
    const result = await harness.runTurn({
      prompt: 'Add a to-do to order more RCBO20s',
      system: harness.playbook,
    });

    const [, second] = script.calls;
    const echo = second.messages.at(-1);
    assert.equal(echo.role, 'user');
    assert.equal(echo.content[0].type, 'tool_result');
    assert.equal(echo.content[0].tool_use_id, 'toolu_1');

    // The assistant turn has to be echoed back as it arrived, or the provider
    // rejects the follow-up, so the tool_use block survives the round trip.
    const assistantTurn = second.messages.at(-2);
    assert.equal(assistantTurn.role, 'assistant');
    assert.equal(assistantTurn.content[0].type, 'tool_use');
    assert.equal(assistantTurn.content[0].id, 'toolu_1');
    assert.equal(assistantTurn.content[0].name, 'add_todo');

    const change = diff(before, harness.snapshot());
    const created = writesIn(change, 'todos');
    assert.equal(created.length, 1);
    assert.match(created[0].record.title, /rcbo/i);
    assert.match(result.text, /added/i);
  });

  it('leaves the dataset untouched when the model only reads', async () => {
    stage(toolReply('get_today', {}), textReply('Nothing is booked yet today.'));

    await harness.reset();
    const before = harness.snapshot();
    const result = await harness.runTurn({ prompt: "What's on today?", system: harness.playbook });

    assert.equal(result.status, 'done');
    const change = diff(before, harness.snapshot());
    assert.deepEqual(change.created, []);
    assert.deepEqual(change.updated, []);
    assert.deepEqual(change.removed, []);
    assert.equal(harness.cloudTouches, 0);
    assert.equal(harness.dbTouches, 0);
  });

  it('declines a risky action without writing, and allows it when approved', async () => {
    const call = () => toolReply('void_invoice', { invoice: 'INV-02512', reason: 'raised against the wrong job' });

    stage(call(), textReply('I have left it alone.'));
    await harness.reset();
    const beforeDecline = harness.snapshot();
    const declined = await harness.runTurn({
      prompt: 'Void INV-02512',
      system: harness.playbook,
      approve: () => false,
    });

    assert.equal(declined.status, 'done');
    assert.ok(declined.approvals.some((entry) => entry.approved === false), 'the refusal should be recorded');
    assert.deepEqual(writesIn(diff(beforeDecline, harness.snapshot()), 'invoices'), []);

    stage(call(), textReply('Voided.'));
    await harness.reset();
    const beforeAllow = harness.snapshot();
    const allowed = await harness.runTurn({
      prompt: 'Void INV-02512',
      system: harness.playbook,
      approve: () => true,
    });

    assert.equal(allowed.status, 'done');
    assert.equal(allowed.failures.length, 0);
    assert.ok(allowed.approvals.some((entry) => entry.approved === true));
    const updated = writesIn(diff(beforeAllow, harness.snapshot()), 'invoices');
    assert.equal(updated.length, 1);
    assert.match(updated[0].record.status, /void/i);
  });

  it('grades a task through the runner', async () => {
    stage(toolReply('add_todo', { title: 'Order more RCBO20s' }), textReply('Added it.'));

    const task = {
      id: 'mock-todo-add',
      category: 'todos',
      prompt: 'Add a to-do to order more RCBO20s',
      check(t, ctx) {
        t.ok(ctx.change.created.some((entry) => entry.collection === 'todos'), 'a to-do should have been created');
        t.match(ctx.result.text, /added/i, 'the answer should say what happened');
      },
    };

    await harness.reset();
    const before = harness.snapshot();
    const outcome = await runTask(harness, task);
    const checker = createChecker();
    task.check(checker, { change: diff(before, harness.snapshot()), result: outcome.result });
    assert.deepEqual(checker.failures, []);

    // And a task that asks for something the turn did not do must fail.
    const wrong = { ...task, check(t, ctx) { t.ok(writesIn(ctx.change, 'customers').length === 1, 'expected a customer to be added'); } };
    const failing = createChecker();
    wrong.check(failing, { change: diff(before, harness.snapshot()), result: outcome.result });
    assert.equal(failing.failures.length, 1);
  });

  it('stages a task fixture before the baseline, so setup is never graded as agent work', async () => {
    let staged;
    const task = {
      setup: async (h) => {
        const [customer] = h.store.getAll('customers');
        assert.ok(customer, 'the demo dataset should have customers to stage');
        staged = customer.id;
        await h.store.update('customers', customer.id, { notes: 'staged by setup' });
      },
    };

    await harness.reset();
    const pristine = harness.snapshot();
    const { before, failure } = await stageTask(harness, task);

    assert.equal(failure, null);
    // The fixture landed in the store...
    const applied = writesIn(diff(pristine, before), 'customers');
    assert.equal(applied.length, 1);
    assert.equal(applied[0].record.id, staged);
    assert.equal(applied[0].record.notes, 'staged by setup');
    assert.ok(before.customers.some((row) => row.id === staged && row.notes === 'staged by setup'));
    // ...but it is already inside the baseline, so it cannot be read as the turn's doing.
    assert.deepEqual(diff(before, harness.snapshot()), { created: [], updated: [], removed: [] });
  });

  it('reports a throwing setup as a failure instead of throwing out of the run', async () => {
    const task = {
      id: 'broken-fixture',
      category: 'risky',
      prompt: 'Send an invoice that the fixture never staged.',
      check() {},
      setup() {
        throw new Error('no Draft invoice in the demo data');
      },
    };

    const { before, failure } = await stageTask(harness, task);

    assert.match(failure, /setup threw: Error: no Draft invoice in the demo data/);
    assert.ok(before && typeof before === 'object', 'a baseline is still handed back so the run can carry on');
  });

  it('rejects a malformed setup hook at validation time', () => {
    const base = { id: 'x', category: 'read', prompt: 'A prompt long enough to be real.', check() {} };
    assert.deepEqual(validateTasks([base]).problems, []);
    assert.deepEqual(validateTasks([{ ...base, setup: async () => {} }]).problems, []);
    assert.deepEqual(validateTasks([{ ...base, setup: 'not a function' }]).problems, [
      'task x: setup must be a function that stages the store',
    ]);
  });

  it('reports a dateless, timezone-safe today key', () => {
    assert.match(todayKey(), /^\d{4}-\d{2}-\d{2}$/);
    assert.equal(todayKey(new Date(2026, 9, 3, 23, 30)), '2026-10-03');
  });
});
