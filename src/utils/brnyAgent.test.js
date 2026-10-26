/**
 * The agent loop's contract, pinned without touching the network.
 *
 * The provider is stubbed at `supabase.functions.invoke`, so these tests own the
 * exact request bodies brny sends and the exact replies the model gives back.
 * That is what lets them assert the things that are easy to break silently: that
 * a failed tool is fed back as an error rather than swallowed, that a risky
 * action stops for approval before it writes, that a question that has not been
 * answered is not answered on the wire, and that the history handed back is the
 * conversation itself - what travels to the provider is what the user typed, and
 * that what day it is reaches the model as a day rather than as a number it has
 * to interpret.
 *
 * The store is empty on purpose. Nothing here needs a dataset, which keeps the
 * assertions about the loop rather than about seeded records.
 */

import test from 'node:test';
import assert from 'node:assert/strict';

import { store } from '../data/store.js';
import { supabase } from './supabase.js';
import { runTurn, costOf, MAX_STEPS } from './brnyAgent.js';

const realInvoke = supabase.functions.invoke;

const ADMIN = { id: 'test_admin', name: 'Test Admin', role: 'admin', companyId: 'company-uuid' };
const EMAIL = 'dana@example.com';

// The action layer reads the signed-in user from the same storage the app does.
// An admin actor short-circuits permission checks, so no dataset is needed.
globalThis.localStorage = {
  getItem: (key) => (key === 'currentUser' ? JSON.stringify(ADMIN) : null),
  setItem() {},
  removeItem() {},
  clear() {},
};

let requests = [];

function stubProvider(reply) {
  requests = [];
  supabase.functions.invoke = async (name, options) => {
    requests.push(options.body);
    const data = typeof reply === 'function' ? reply(options.body, requests.length) : reply;
    return { data, error: null };
  };
}

/** Anthropic only reaches the proxy from a Cloud workspace. */
async function withCloud(body) {
  const previous = store.companyId;
  store.companyId = 'company-uuid';
  try {
    return await body();
  } finally {
    store.companyId = previous;
    supabase.functions.invoke = realInvoke;
    requests = [];
  }
}

const count = (usage) => ({ ...usage });

function textReply(value, usage) {
  return {
    content: [{ type: 'text', text: value }],
    stop_reason: 'end_turn',
    usage: usage || { input_tokens: 10, output_tokens: 5 },
  };
}

function toolCallsReply(calls, usage) {
  return {
    content: calls.map(({ id, name, input }) => ({ type: 'tool_use', id, name, input, caller: { type: 'direct' } })),
    stop_reason: 'tool_use',
    usage: usage || { input_tokens: 10, output_tokens: 5 },
  };
}

function toolReply(name, input, id = 'tool_1', usage) {
  return toolCallsReply([{ id, name, input }], usage);
}

/**
 * Anthropic's rule for a tool-calling conversation, checked the way the provider
 * enforces it: every `tool_use` in an assistant turn has to be answered by a
 * `tool_result` in the message immediately after it, and the turns alternate.
 * A conversation that breaks this comes back as a 400 instead of a reply.
 */
function wireFaults(body) {
  const faults = [];
  body.messages.forEach((message, index) => {
    if (index > 0 && message.role === body.messages[index - 1].role) {
      faults.push(`two ${message.role} turns in a row at ${index}`);
    }
    if (message.role !== 'assistant' || !Array.isArray(message.content)) return;
    const ids = message.content.filter((b) => b && b.type === 'tool_use').map((b) => b.id);
    if (!ids.length) return;
    const next = body.messages[index + 1];
    const answered = Array.isArray(next && next.content)
      ? next.content.filter((b) => b && b.type === 'tool_result').map((b) => b.tool_use_id)
      : [];
    for (const id of ids) if (!answered.includes(id)) faults.push(`${id} is unanswered at ${index}`);
  });
  return faults;
}

/** The tool_results the conversation holds for its assistant turn. */
function answeredCalls(messages) {
  const assistant = messages.findIndex((m) => m.role === 'assistant' && Array.isArray(m.content));
  const next = messages[assistant + 1];
  return (Array.isArray(next && next.content) ? next.content : []).filter((p) => p && p.type === 'tool_result');
}

/** The last tool_result the loop sent back, with its content parsed when it is JSON. */
function lastToolResult(body) {
  const last = body.messages[body.messages.length - 1];
  const block = Array.isArray(last.content) ? last.content.find((p) => p.type === 'tool_result') : null;
  if (!block) return null;
  let json = null;
  try {
    json = JSON.parse(block.content);
  } catch (_) { /* a resume answer can be plain text */ }
  return { ...block, json };
}

test('a tool call is run locally and its result goes back to the model', async () => {
  await withCloud(async () => {
    stubProvider((body, call) => (call === 1
      ? toolReply('get_today', {})
      : textReply('Nothing is booked today.')));

    const turn = await runTurn({ prompt: 'What should I do today?', briefing: false, tools: [] });

    assert.equal(turn.status, 'done');
    assert.equal(turn.steps, 2);
    assert.equal(turn.text, 'Nothing is booked today.');
    assert.equal(turn.failed, 0);
    assert.deepEqual(turn.actions.map((a) => [a.tool, a.ok]), [['get_today', true]]);

    // The assistant turn is echoed back verbatim, then answered.
    const second = requests[1];
    assert.equal(second.messages[1].content[0].type, 'tool_use');
    const result = lastToolResult(second);
    assert.equal(result.is_error, false);
    assert.equal(result.tool_use_id, 'tool_1');
    assert.ok(result.json.summary, 'the tool result carries the action summary');
    assert.equal(result.json.summary, turn.actions[0].summary);
  });
});

test('a name the registry does not know comes back to the model as an error', async () => {
  await withCloud(async () => {
    stubProvider((body, call) => (call === 1
      ? toolReply('book_the_van', { when: 'tomorrow' })
      : textReply('I cannot do that.')));

    const turn = await runTurn({ prompt: 'Book the van', briefing: false, tools: [] });

    assert.equal(turn.status, 'done');
    assert.equal(turn.failed, 1);
    assert.equal(turn.failures[0].tool, 'book_the_van');
    assert.equal(turn.failures[0].code, 'not_found');
    assert.deepEqual(turn.actions.map((a) => a.ok), [false]);

    // Not swallowed: the model is told, so it can correct itself.
    const result = lastToolResult(requests[1]);
    assert.equal(result.is_error, true);
    assert.equal(result.json.code, 'not_found');
  });
});

test('the model failing on every step is reported as failures, not a success', async () => {
  await withCloud(async () => {
    stubProvider(toolReply('book_the_van', {}));

    const turn = await runTurn({ prompt: 'Book the van', briefing: false, tools: [], maxSteps: 3 });

    assert.equal(turn.status, 'max_steps');
    assert.equal(turn.failed, 3);
    // Every request after the first is answering a call that already failed.
    assert.equal(requests.length, 3);
    for (const request of requests.slice(1)) {
      assert.equal(lastToolResult(request).is_error, true);
    }
  });
});

test('a risky action stops the turn for approval before anything is written', async () => {
  await withCloud(async () => {
    stubProvider(toolReply('send_invoice', { invoice: 'INV-1001' }));

    const turn = await runTurn({ prompt: 'Send INV-1001', briefing: false, tools: [] });

    assert.equal(turn.status, 'approval_required');
    assert.equal(turn.steps, 1);
    assert.equal(requests.length, 1, 'the loop waits for the user instead of calling again');
    assert.equal(turn.pendingApproval.toolUseId, 'tool_1');
    assert.equal(turn.pendingApproval.name, 'send_invoice');
    assert.deepEqual(turn.pendingApproval.input, { invoice: 'INV-1001' });
    assert.ok(turn.pendingApproval.summary.trim(), 'the card needs something to show');
    assert.deepEqual(turn.approvals, []);
    assert.deepEqual(turn.actions, [], 'nothing ran, so nothing is reported as done');
    assert.equal(store.getAll('invoices').length, 0);
  });
});

test('an approval callback lets the action run once, with the input the user saw', async () => {
  await withCloud(async () => {
    stubProvider((body, call) => (call === 1 ? toolReply('send_invoice', { invoice: 'INV-1001' }) : textReply('Done.')));
    const seen = [];

    const turn = await runTurn({
      prompt: 'Send INV-1001',
      briefing: false,
      tools: [],
      approve: async (pending) => { seen.push(pending); return true; },
    });

    assert.equal(seen.length, 1);
    assert.equal(turn.approvals.length, 1);
    assert.equal(turn.approvals[0].approved, true);
    assert.deepEqual(turn.approvals[0].input, { invoice: 'INV-1001' });
    assert.equal(requests.length, 2, 'the model is told the outcome');
    // The retry carries the same tool_use_id, so the call is answered exactly once.
    assert.equal(lastToolResult(requests[1]).tool_use_id, 'tool_1');
    // The invoice does not exist, so the attempted write is reported, not hidden.
    assert.equal(turn.failures[0].code, 'not_found');
  });
});

test('a declined approval is a cancelled tool result, not a failure', async () => {
  await withCloud(async () => {
    stubProvider((body, call) => (call === 1 ? toolReply('send_invoice', { invoice: 'INV-1001' }) : textReply('Left it alone.')));

    const turn = await runTurn({
      prompt: 'Send INV-1001',
      briefing: false,
      tools: [],
      approve: () => false,
    });

    assert.equal(turn.status, 'done');
    assert.equal(turn.failed, 0, 'the user saying no is not the app failing');
    assert.equal(turn.approvals[0].approved, false);
    assert.deepEqual(turn.actions.map((a) => a.declined), [true]);

    const result = lastToolResult(requests[1]);
    assert.equal(result.is_error, true);
    assert.equal(result.json.code, 'cancelled');
    assert.equal(store.getAll('invoices').length, 0);
  });
});

test('an approval answered from the UI continues the turn', async () => {
  await withCloud(async () => {
    stubProvider((body, call) => (call === 1 ? toolReply('send_invoice', { invoice: 'INV-1001' }) : textReply('Done.')));

    const first = await runTurn({ prompt: 'Send INV-1001', briefing: false, tools: [] });
    assert.equal(first.status, 'approval_required');

    const second = await runTurn({
      messages: first.messages,
      briefing: false,
      tools: [],
      resume: { toolUseId: first.pendingApproval.toolUseId, name: 'send_invoice', input: first.pendingApproval.input, approved: true },
    });

    assert.equal(second.status, 'done');
    assert.equal(second.approvals[0].approved, true);
    assert.equal(requests.length, 2, 'the second turn made one request of its own');
    const result = lastToolResult(requests[1]);
    assert.equal(result.tool_use_id, first.pendingApproval.toolUseId);
    assert.equal(result.json.code, 'not_found');
  });
});

test('a question stops the turn and is answered on the next one', async () => {
  await withCloud(async () => {
    stubProvider((body, call) => (call === 1
      ? toolReply('ask_user', { question: 'Which Acme did you mean?', options: ['Acme North', 'Acme South'] })
      : textReply('Quoted for Acme North.')));

    const first = await runTurn({ prompt: 'Quote the Acme job', briefing: false, tools: [] });

    assert.equal(first.status, 'ask_user');
    assert.equal(first.steps, 1);
    assert.equal(requests.length, 1, 'an unanswered question is never answered for the user');
    assert.deepEqual(first.pendingQuestion, {
      toolUseId: 'tool_1',
      name: 'ask_user',
      question: 'Which Acme did you mean?',
      detail: '',
      options: ['Acme North', 'Acme South'],
    });
    assert.equal(first.actions[0].ok, true);

    const second = await runTurn({
      messages: first.messages,
      briefing: false,
      tools: [],
      resume: { toolUseId: first.pendingQuestion.toolUseId, answer: 'Acme North' },
    });

    assert.equal(second.status, 'done');
    assert.equal(second.text, 'Quoted for Acme North.');
    assert.equal(second.pendingQuestion, null);
    const result = lastToolResult(requests[1]);
    assert.equal(result.tool_use_id, 'tool_1');
    assert.equal(result.content, 'Acme North');
    assert.equal(result.json, null, 'a plain answer is passed through as text');
    assert.equal(result.is_error, undefined, 'an answer is not an error result');
  });
});

// A step can ask for several calls at once, and a pause lands in the middle of
// them. Whatever the model asked for still has to be answered in the user turn
// that follows it, or the resumed request is rejected with a 400 ("tool_use ids
// were found without tool_result blocks immediately after") rather than answered.

test('a step that pauses on an approval still answers every call it asked for', async () => {
  await withCloud(async () => {
    stubProvider((body, call) => (call === 1
      ? toolCallsReply([
        { id: 'tool_1', name: 'get_today', input: {} },
        { id: 'tool_2', name: 'send_invoice', input: { invoice: 'INV-1001' } },
        { id: 'tool_3', name: 'get_today', input: {} },
      ])
      : textReply('Done.')));

    const first = await runTurn({ prompt: 'Send the invoice, then tell me about today', briefing: false, tools: [] });

    assert.equal(first.status, 'approval_required');
    assert.deepEqual(wireFaults(requests[0]), []);
    assert.deepEqual(first.actions.map((a) => a.tool), ['get_today'], 'only the call before the pause ran');

    // The call that stopped the step, and the one behind it, are answered with a
    // result rather than dropped.
    const held = answeredCalls(first.messages);
    assert.deepEqual(held.map((r) => r.tool_use_id), ['tool_1', 'tool_2', 'tool_3']);
    assert.equal(held[0].is_error, false, 'the call that ran carries its own result');
    assert.equal(JSON.parse(held[1].content).code, 'awaiting_user');
    assert.equal(JSON.parse(held[2].content).code, 'not_run', 'a call the pause stopped from running is not reported as done');

    const second = await runTurn({
      messages: first.messages,
      briefing: false,
      tools: [],
      resume: { toolUseId: 'tool_2', name: 'send_invoice', input: { invoice: 'INV-1001' }, approved: true },
    });

    assert.equal(second.status, 'done');
    assert.equal(requests.length, 2);
    assert.deepEqual(wireFaults(requests[1]), [], 'the resumed request is a conversation the provider accepts');

    // The approval lands in the turn already holding the step's results...
    const settled = answeredCalls(second.messages);
    assert.deepEqual(settled.map((r) => r.tool_use_id), ['tool_1', 'tool_2', 'tool_3']);
    assert.equal(JSON.parse(settled[1].content).code, 'not_found', 'the real result replaced the placeholder');
    // ...and not in a second user turn of its own.
    assert.equal(second.messages.filter((m) => m.role === 'user').length, 2);
  });
});

test('a question leaves the calls behind it answered, not dropped', async () => {
  await withCloud(async () => {
    stubProvider((body, call) => (call === 1
      ? toolCallsReply([
        { id: 'tool_1', name: 'ask_user', input: { question: 'Which Acme did you mean?', options: ['Acme North', 'Acme South'] } },
        { id: 'tool_2', name: 'get_today', input: {} },
      ])
      : textReply('Quoted for Acme North.')));

    const first = await runTurn({ prompt: 'Quote the Acme job', briefing: false, tools: [] });

    assert.equal(first.status, 'ask_user');
    assert.deepEqual(answeredCalls(first.messages).map((r) => r.tool_use_id), ['tool_1', 'tool_2']);
    assert.equal(first.actions.length, 1, 'the call behind the question never ran');

    const second = await runTurn({
      messages: first.messages,
      briefing: false,
      tools: [],
      resume: { toolUseId: 'tool_1', answer: 'Acme North' },
    });

    assert.equal(second.status, 'done');
    assert.equal(second.text, 'Quoted for Acme North.');
    assert.deepEqual(wireFaults(requests[1]), []);

    const settled = answeredCalls(second.messages);
    assert.equal(settled[0].content, 'Acme North', 'the answer replaces the placeholder where it stood');
    assert.equal(settled[0].is_error, undefined, 'an answer is not an error result');
    assert.equal(JSON.parse(settled[1].content).code, 'not_run');
    assert.equal(second.messages.filter((m) => m.role === 'user').length, 2);
  });
});

test('a turn stopped between calls still answers the ones it did not run', async () => {
  await withCloud(async () => {
    stubProvider(toolCallsReply([
      { id: 'tool_1', name: 'get_today', input: {} },
      { id: 'tool_2', name: 'get_today', input: {} },
    ]));
    const controller = new AbortController();

    const turn = await runTurn({
      prompt: 'Anything?',
      briefing: false,
      tools: [],
      signal: controller.signal,
      // The stop button lands while the step is mid-flight: the first call has
      // run, the second has not.
      onEvent: (event) => { if (event.type === 'tool') controller.abort(); },
    });

    assert.equal(turn.status, 'aborted');
    assert.equal(turn.steps, 1);
    assert.equal(requests.length, 1, 'a stopped turn asks the provider nothing more');
    assert.deepEqual(wireFaults(requests[0]), []);

    const settled = answeredCalls(turn.messages);
    assert.deepEqual(settled.map((r) => r.tool_use_id), ['tool_1', 'tool_2']);
    assert.equal(settled[0].is_error, false);
    assert.equal(JSON.parse(settled[1].content).code, 'not_run');
  });
});

test('the step cap is user-visible, and defaults to twelve', async () => {
  await withCloud(async () => {
    stubProvider(toolReply('get_today', {}));

    const turn = await runTurn({ prompt: 'Loop', briefing: false, tools: [], maxSteps: 2 });

    assert.equal(MAX_STEPS, 12);
    assert.equal(turn.status, 'max_steps');
    assert.equal(turn.steps, 2);
    assert.equal(turn.maxSteps, 2);
    assert.equal(turn.note, 'Stopped after 2 steps.');
    assert.equal(requests.length, 2);
  });
});

test('an aborted turn stops before the first request', async () => {
  await withCloud(async () => {
    stubProvider(textReply('never sent'));
    const controller = new AbortController();
    controller.abort();

    const turn = await runTurn({ prompt: 'Anything', briefing: false, tools: [], signal: controller.signal });

    assert.equal(turn.status, 'aborted');
    assert.equal(turn.steps, 0);
    assert.equal(requests.length, 0);
  });
});

// Stop cancels the request in flight, and the Supabase client reports that as a
// failed send. Read as an error, it dropped the panel into the offline
// assistant with "Failed to send a request to the Edge Function".
test('a turn stopped mid-request is aborted, not an error', async () => {
  await withCloud(async () => {
    const controller = new AbortController();
    requests = [];
    supabase.functions.invoke = async (name, options) => {
      requests.push(options.body);
      controller.abort();
      return { data: null, error: new Error('Failed to send a request to the Edge Function') };
    };

    const turn = await runTurn({ prompt: 'Anything', briefing: false, tools: [], signal: controller.signal });

    assert.equal(turn.status, 'aborted');
    assert.equal(turn.error, null);
    assert.equal(requests.length, 1);
  });
});

test('a failed send with no stop is still an error', async () => {
  await withCloud(async () => {
    requests = [];
    supabase.functions.invoke = async (name, options) => {
      requests.push(options.body);
      return { data: null, error: new Error('Failed to send a request to the Edge Function') };
    };

    const turn = await runTurn({ prompt: 'Anything', briefing: false, tools: [] });

    assert.equal(turn.status, 'error');
    assert.match(turn.error.message, /Failed to send a request/);
  });
});

test('a daily allowance surfaces as a limit and keeps the work already done', async () => {
  await withCloud(async () => {
    requests = [];
    supabase.functions.invoke = async (name, options) => {
      requests.push(options.body);
      if (requests.length === 1) return { data: toolReply('get_today', {}), error: null };
      return {
        data: null,
        error: {
          message: 'non-2xx',
          context: {
            text: async () => JSON.stringify({
              code: 'ai_daily_limit',
              scope: 'user',
              remainingMessages: 0,
              poolRemainingMessages: 4,
              resetsAt: '2026-10-11T00:00:00.000Z',
            }),
          },
        },
      };
    };

    const turn = await runTurn({ prompt: 'What should I do today?', briefing: false, tools: [] });

    assert.equal(turn.status, 'limit');
    assert.equal(turn.error.name, 'AILimitError');
    assert.equal(turn.error.scope, 'user');
    assert.equal(turn.actions.length, 1, 'the completed step is still reported');
    assert.equal(turn.usage.input_tokens, 10);
    assert.equal(turn.steps, 2);
  });
});

test('usage accumulates across steps and only becomes a cost when priced', async () => {
  await withCloud(async () => {
    stubProvider((body, call) => (call === 1
      ? toolReply('get_today', {}, 'tool_1', { input_tokens: 100, output_tokens: 20, cache_read_input_tokens: 5, cache_creation_input_tokens: 7 })
      : textReply('All clear.', { input_tokens: 200, output_tokens: 30 })));

    const turn = await runTurn({ prompt: 'Anything?', briefing: false, tools: [] });

    assert.deepEqual(turn.usage, {
      input_tokens: 300,
      output_tokens: 50,
      cache_read_input_tokens: 5,
      cache_creation_input_tokens: 7,
    });
    assert.equal(turn.costUsd, null, 'no price table ships with the app, so none is invented');

    assert.equal(costOf(turn.usage, { input: 1, output: 5, cacheRead: 0.1, cacheWrite: 1.25 }), 0.000559);
    assert.equal(costOf({ input_tokens: 1000000, output_tokens: 1000000 }, { input: 3, output: 15 }), 18);
    assert.equal(costOf(null, { input: 3 }), null);

    const priced = await runTurn({
      prompt: 'Anything?',
      briefing: false,
      tools: [],
      pricing: { input: 3, output: 15 },
    });
    assert.equal(priced.costUsd, costOf(priced.usage, { input: 3, output: 15 }));
  });
});

test('the conversation travels as written and the history comes back the same way', async () => {
  await withCloud(async () => {
    stubProvider((body, call) => (call === 1
      // The model only ever sees what it was sent, so echoing it back is what a
      // real reply does.
      ? toolReply('get_today', { note: body.messages[0].content }, 'tool_1')
      : textReply('Noted.')));

    const turn = await runTurn({ prompt: `Email ${EMAIL} about the quote`, briefing: false, tools: [] });

    // Nothing rewrites the user's words on the way out...
    assert.equal(requests[0].messages[0].content, `Email ${EMAIL} about the quote`);
    // ...and customer details travel in every request, unmasked.
    assert.ok(requests.every((r) => JSON.stringify(r).includes(EMAIL)));

    // ...so what comes back is that same conversation, tool call and result
    // included, and a later turn can hand it straight back in.
    assert.equal(turn.messages[0].content, `Email ${EMAIL} about the quote`);
    const assistant = turn.messages.find((m) => m.role === 'assistant');
    assert.equal(assistant.content[0].input.note, `Email ${EMAIL} about the quote`);
    assert.equal(lastToolResult(requests[1]).tool_use_id, 'tool_1');

    // The second request carried that conversation verbatim, and the turn hands
    // it back with the final reply appended, so a later turn can send it again.
    assert.equal(JSON.stringify(turn.messages.slice(0, -1)), JSON.stringify(requests[1].messages));
    assert.equal(turn.messages.at(-1).content[0].text, 'Noted.');
  });
});

test('the base instructions and the briefing make up the system prompt', async () => {
  await withCloud(async () => {
    stubProvider(textReply('Nothing on today.'));

    const turn = await runTurn({ prompt: 'What is on today?', tools: [] });

    assert.equal(turn.status, 'done');
    const system = requests[0].system;
    assert.match(system, /You are brny/);
    assert.match(system, /Today is \d{4}-\d{2}-\d{2}/);
    assert.equal(requests[0].messages[0].role, 'user', 'no system turn is ever sent inside messages');
  });
});

/**
 * The bug these pin: the model was told the date as `2026-10-15`, and a
 * weekday is not recoverable from that without arithmetic the small, fast
 * models brny runs on get wrong - so "is Friday this week?" was answered from
 * an unrelated week. An ISO date and the same day spelled out both travel, and
 * the spelled-out form is the one a model can read without guessing.
 */
test('the briefing spells the day out as well as naming it in ISO', async () => {
  await withCloud(async () => {
    stubProvider(textReply('Nothing on today.'));

    await runTurn({ prompt: 'What is on today?', tools: [] });

    assert.match(
      requests[0].system,
      /Today is \d{4}-\d{2}-\d{2} \(\w+day, \d{1,2} \w+ \d{4}\)\./,
      'an ISO date alone leaves the weekday to be worked out',
    );
  });
});

test('the date reaches the provider even when the briefing cannot be built', async () => {
  await withCloud(async () => {
    stubProvider(textReply('Nothing on today.'));
    const realGetAll = store.getAll;
    store.getAll = () => { throw new Error('the store is unavailable'); };

    let turn;
    try {
      turn = await runTurn({ prompt: 'What is on today?', tools: [] });
    } finally {
      store.getAll = realGetAll;
    }

    assert.equal(turn.status, 'done');
    assert.match(requests[0].system, /Today is \d{4}-\d{2}-\d{2} \(\w+day, \d{1,2} \w+ \d{4}\)\./);
  });
});

test('a caller-supplied system prompt still gets the date appended', async () => {
  await withCloud(async () => {
    stubProvider(textReply('ok'));

    await runTurn({ prompt: 'Hi', system: 'You are brny, written by RELAY.', tools: [] });

    const system = requests[0].system;
    assert.match(system, /You are brny, written by RELAY\./);
    assert.match(system, /Today is \d{4}-\d{2}-\d{2} \(\w+day, \d{1,2} \w+ \d{4}\)\./);
  });
});

test('the tool list reaches the provider by default and can be overridden', async () => {
  await withCloud(async () => {
    stubProvider(textReply('ok'));

    await runTurn({ prompt: 'Hi', briefing: false });
    const names = requests[0].tools.map((tool) => tool.name);
    assert.ok(names.includes('get_today'));
    assert.ok(names.includes('ask_user'));
    assert.ok(names.includes('send_invoice'));

    await runTurn({ prompt: 'Hi', briefing: false, tools: [] });
    assert.equal(requests[1].tools, undefined, 'an empty tool list sends no tools at all');
  });
});

test('a turn with nothing to send is a programming error, not a silent empty request', async () => {
  await withCloud(async () => {
    stubProvider(textReply('ok'));
    await assert.rejects(() => runTurn({ briefing: false }), /needs a prompt, a history, or a resume/);
    assert.equal(requests.length, 0);
  });
});

test('an empty reply is reported as an error', async () => {
  await withCloud(async () => {
    stubProvider({ content: [], stop_reason: 'end_turn', usage: count({ input_tokens: 1, output_tokens: 0 }) });

    const turn = await runTurn({ prompt: 'Hello?', briefing: false, tools: [] });

    assert.equal(turn.status, 'error');
    assert.match(turn.error.message, /empty reply/);
  });
});

test('events describe the turn as it happens, and a bad listener cannot break it', async () => {
  await withCloud(async () => {
    stubProvider((body, call) => (call === 1 ? toolReply('get_today', {}) : textReply('All clear.')));
    const events = [];

    const turn = await runTurn({
      prompt: 'Anything?',
      briefing: false,
      tools: [],
      onEvent: (event) => {
        events.push(event);
        throw new Error('a listener blowing up must not matter');
      },
    });

    assert.equal(turn.status, 'done');
    assert.deepEqual(events.map((e) => e.type), ['step', 'usage', 'label', 'tool', 'step', 'usage', 'text', 'done']);
    assert.equal(events[0].index, 1);
    assert.equal(events[0].of, MAX_STEPS);
    assert.equal(events[3].tool, 'get_today');
    assert.equal(events[3].ok, true);
    assert.equal(events[events.length - 1].status, 'done');
  });
});
