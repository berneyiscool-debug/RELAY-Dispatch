// `completeChat` is the seam between the app and the provider, and the agent
// loop depends on three things it alone guarantees: the conversation arrives in
// a shape Anthropic accepts, the model's tool arguments come back as real values
// the store can act on, and what we send back up is redacted. Each of those is a
// silent failure otherwise - a 400 the user reads as "brny is broken", a lookup
// that finds nothing, or a customer's email leaving the machine.
//
// The response shape is pinned here too. A tool-calling loop that reads the
// wrong field does not throw; it just never calls anything.
import test from 'node:test';
import assert from 'node:assert/strict';
import { supabase } from './supabase.js';
import { store } from '../data/store.js';
import { completeChat, dispatchChat } from './aiEngine.js';
import { createRedactionContext } from './piiRedaction.js';

const realInvoke = supabase.functions.invoke;

// Captures the request body and answers with an Anthropic-shaped payload. The
// answering function sees the body, which is how a test can echo back a
// placeholder the transport invented for this call.
function stubProvider(reply) {
  let sent = null;
  supabase.functions.invoke = async (name, options) => {
    sent = options.body;
    return { data: reply === undefined ? { content: [] } : (typeof reply === 'function' ? reply(options.body) : reply), error: null };
  };
  return () => sent;
}

// Runs `body` with the store presenting itself as a Cloud workspace, then puts
// the client and the store back - both are module singletons.
async function asCloud(body) {
  const previous = store.companyId;
  store.companyId = 'company-uuid';
  try {
    return await body();
  } finally {
    store.companyId = previous;
    supabase.functions.invoke = realInvoke;
  }
}

const EMAIL = 'dana@example.com';

test('the system prompt is lifted out of the history the provider sees', async () => {
  await asCloud(async () => {
    const body = stubProvider({ content: [{ type: 'text', text: 'Hi.' }] });
    await completeChat([
      { role: 'system', content: 'You are brny.' },
      { role: 'user', content: 'hello' },
    ]);
    const request = body();
    assert.equal(request.system, 'You are brny.');
    // Anthropic rejects any role but user/assistant inside `messages`.
    assert.equal(request.messages.length, 1);
    assert.equal(request.messages[0].role, 'user');
    assert.equal(request.messages[0].content, 'hello');
  });
});

test('consecutive plain-text turns are merged rather than rejected', async () => {
  await asCloud(async () => {
    const body = stubProvider({ content: [{ type: 'text', text: 'ok' }] });
    await completeChat([
      { role: 'user', content: 'first' },
      { role: 'user', content: 'second' },
    ]);
    const request = body();
    assert.equal(request.messages.length, 1);
    assert.equal(request.messages[0].content, 'first\n\nsecond');
  });
});

test('tools, a tool choice and a token ceiling reach the provider', async () => {
  await asCloud(async () => {
    const body = stubProvider({ content: [{ type: 'text', text: 'ok' }] });
    const tools = [{ name: 'find_customer', description: 'Find one.', input_schema: { type: 'object' } }];
    await completeChat([{ role: 'user', content: 'find dana' }], {
      system: 'You are brny.',
      tools,
      toolChoice: { type: 'tool', name: 'find_customer' },
      maxTokens: 1024,
    });
    const request = body();
    assert.equal(request.system, 'You are brny.');
    assert.equal(request.tools[0].name, 'find_customer');
    assert.deepEqual(request.tool_choice, { type: 'tool', name: 'find_customer' });
    assert.equal(request.max_tokens, 1024);
    // Only what was asked for travels: a field the client invents is a field the
    // provider can reject the whole request over.
    assert.equal(request.temperature, undefined);
  });
});

test('a tool call comes back rehydrated for the executor and verbatim for echo', async () => {
  await asCloud(async () => {
    const body = stubProvider((request) => {
      const placeholder = request.messages[0].content.match(/\[\[PII_\d+\]\]/)[0];
      return {
        content: [
          { type: 'text', text: `Looking up ${placeholder} now.` },
          { type: 'tool_use', id: 'toolu_1', name: 'find_customer', input: { query: placeholder } },
        ],
        stop_reason: 'tool_use',
        usage: { input_tokens: 12, output_tokens: 7 },
      };
    });
    const result = await completeChat([{ role: 'user', content: `Find ${EMAIL}` }], {
      redaction: createRedactionContext(),
    });

    // What left the machine, what the user reads, and what the store is asked
    // for are three different values, and only the third is real.
    assert.ok(!body().messages[0].content.includes(EMAIL));
    assert.equal(result.content, `Looking up ${EMAIL} now.`);
    assert.equal(result.toolCalls[0].input.query, EMAIL);
    assert.equal(result.toolCalls[0].name, 'find_customer');
    assert.equal(result.toolCalls[0].id, 'toolu_1');
    // The assistant turn is echoed back untouched, so the provider sees exactly
    // what it wrote and the tool result lines up with its own call.
    assert.equal(result.contentBlocks[1].input.query, body().messages[0].content.match(/\[\[PII_\d+\]\]/)[0]);
    assert.equal(result.stopReason, 'tool_use');
    assert.equal(result.usage.input_tokens, 12);
  });
});

test('a tool result is redacted on the way back up', async () => {
  await asCloud(async () => {
    const body = stubProvider({ content: [{ type: 'text', text: 'Done.' }] });
    const ctx = createRedactionContext();
    await completeChat([
      { role: 'user', content: `Find ${EMAIL}` },
      {
        role: 'assistant',
        content: [{ type: 'tool_use', id: 'toolu_1', name: 'find_customer', input: { query: EMAIL } }],
      },
      {
        role: 'user',
        content: [{ type: 'tool_result', tool_use_id: 'toolu_1', content: `One match: ${EMAIL}` }],
      },
    ], { redaction: ctx });

    const serialised = JSON.stringify(body().messages);
    assert.ok(!serialised.includes(EMAIL), 'the tool result must not carry the raw value back');
    // The shared context is what makes the round trip reversible: the call made
    // on turn one has to redact to the same placeholder on turn three.
    assert.equal(body().messages[1].content[0].input.query, body().messages[2].content[0].content.split(': ')[1]);
  });
});

test('dispatchChat still returns just the text', async () => {
  await asCloud(async () => {
    stubProvider({ content: [{ type: 'text', text: 'Just words.' }], stop_reason: 'end_turn' });
    assert.equal(await dispatchChat([{ role: 'user', content: 'hi' }]), 'Just words.');
  });
});

test('several text blocks are joined into the one answer a caller reads', async () => {
  await asCloud(async () => {
    stubProvider({ content: [{ type: 'text', text: 'One.' }, { type: 'text', text: 'Two.' }] });
    const result = await completeChat([{ role: 'user', content: 'hi' }]);
    assert.equal(result.content, 'One.\n\nTwo.');
    assert.equal(result.stopReason, null);
  });
});
