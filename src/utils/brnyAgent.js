/**
 * brny's agent loop.
 *
 * One turn is: send the conversation plus the tool list, run whatever the model
 * asks for, feed the results back, repeat until it answers in prose. Everything
 * the model can do comes from `src/actions/`, so this file owns no business
 * logic of its own — it decides when to call, what to do when a call fails, and
 * when to stop.
 *
 * Design rules that are not obvious from the code:
 *
 * - A tool failure is never swallowed. It goes back to the model as an `is_error`
 *   tool result so it can correct itself, and it is counted, so a turn that
 *   mostly failed cannot be reported as a success.
 * - The turn ends on its own only when it has prose, a question, an approval, or
 *   a real failure. The 12-step cap exists so a model looping on the same call
 *   cannot run up a bill; it is user-visible, not silent.
 * - Redaction is one context per turn. A context per request would renumber the
 *   placeholders mid-turn and a value redacted on step one would no longer
 *   rehydrate on step three.
 * - The context handed back in `messages` holds real values, not the placeholders
 *   the model sees, because it is the history a later turn will re-redact.
 *
 * @example
 * const turn = await runTurn({ prompt: 'Who owes us money?', onEvent: onProgress });
 * if (turn.pendingQuestion) {
 *   const next = await runTurn({ messages: turn.messages, resume: {
 *     toolUseId: turn.pendingQuestion.toolUseId, answer: 'Acme Pty Ltd',
 *   } });
 * }
 */

import { completeChat, rehydrateBlocks } from './aiEngine.js';
import { createRedactionContext } from './piiRedaction.js';
import { executeTool, getAction, toolDefinitions } from '../actions/index.js';
import { currentActor } from '../actions/context.js';

/** Hard stop for one turn. Long enough for a real multi-step job, short enough to cap a loop. */
export const MAX_STEPS = 12;

/** Used when the caller supplies no system prompt of its own. */
const BASE_INSTRUCTIONS = [
  'You are brny, the assistant inside RELAY, a field-service app used by Australian electrical and HVAC trades.',
  'Work from the tools, not from memory: read the record before you state a fact, a number, a name or a date.',
  'When the request is genuinely ambiguous, call ask_user instead of guessing. When an action needs approval, ask for it.',
  'Keep answers short - what you did, then the number or the name that was asked for.',
].join('\n');

/**
 * Cost in USD for one turn's usage.
 *
 * RELAY meters AI in units, not dollars, and no per-token price table ships with
 * the app, so a figure is only produced when the caller supplies one rather than
 * being invented here. Rates are USD per million tokens.
 */
export function costOf(usage, pricing) {
  if (!usage || !pricing) return null;
  const rate = (tokens, perMillion) => ((Number(tokens) || 0) / 1e6) * (Number(perMillion) || 0);
  const total = rate(usage.input_tokens, pricing.input)
    + rate(usage.output_tokens, pricing.output)
    + rate(usage.cache_read_input_tokens, pricing.cacheRead)
    + rate(usage.cache_creation_input_tokens, pricing.cacheWrite);
  return Math.round(total * 1e6) / 1e6;
}

function addUsage(total, usage) {
  if (!usage) return total;
  return {
    input_tokens: total.input_tokens + (Number(usage.input_tokens) || 0),
    output_tokens: total.output_tokens + (Number(usage.output_tokens) || 0),
    cache_read_input_tokens: total.cache_read_input_tokens + (Number(usage.cache_read_input_tokens) || 0),
    cache_creation_input_tokens: total.cache_creation_input_tokens + (Number(usage.cache_creation_input_tokens) || 0),
  };
}

/** The one word of a tool call worth showing in a live activity line. */
function keyArg(input) {
  if (!input || typeof input !== 'object') return null;
  for (const value of Object.values(input)) {
    if (typeof value === 'string' && value.trim()) {
      return value.length > 48 ? `${value.slice(0, 45)}...` : value;
    }
    if (typeof value === 'number') return String(value);
  }
  return null;
}

function toolResultMessage(toolUseId, toolResult) {
  return { type: 'tool_result', tool_use_id: toolUseId, is_error: toolResult.is_error, content: toolResult.content };
}

function cancelledResult(toolUseId, reason) {
  return {
    type: 'tool_result',
    tool_use_id: toolUseId,
    is_error: true,
    content: JSON.stringify({ code: 'cancelled', message: reason || 'The user declined this action.' }),
  };
}

/** One short line of grounding so the model does not have to spend a step asking what day it is. */
async function buildBriefing(baseCtx) {
  const { outcome, error } = await executeTool('get_today', {}, baseCtx);
  if (error || !outcome) return null;
  const result = outcome.result || {};
  return `Today is ${result.date}. ${result.summary || ''}`.trim();
}

/**
 * Run one turn of the conversation.
 *
 * @param {object} options
 * @param {string} [options.prompt]            The user's message.
 * @param {Array}  [options.messages]          Prior history, as returned by an earlier turn.
 * @param {object} [options.resume]            Continue a turn that ended on a question or an approval:
 *                                             `{ toolUseId, answer }` to answer a question,
 *                                             `{ toolUseId, approved: false }` to decline,
 *                                             `{ toolUseId, name, input, approved: true }` to allow.
 * @param {string} [options.system]            Full system prompt (the playbook), which replaces the
 *                                             base instructions rather than adding to them. Include
 *                                             brny's identity in it if you pass one.
 * @param {boolean}[options.briefing=true]     Set false to skip the "today" briefing.
 * @param {object} [options.actor]             Acting user; defaults to the signed-in user.
 * @param {Function}[options.approve]          `async (pending) => boolean` to auto-resolve approvals.
 * @param {object} [options.pricing]           Per-million-token USD rates, to also report `costUsd`.
 * @param {AbortSignal} [options.signal]       Checked between steps and forwarded to the request in flight.
 * @param {Function}[options.onEvent]          Progress callback; see the event list in the README-free docs.
 * @param {number} [options.maxSteps=MAX_STEPS] Override the step cap.
 * @returns {Promise<object>} The turn result. `status` is one of
 *   `done | ask_user | approval_required | max_steps | aborted | limit | error`.
 */
export async function runTurn(options = {}) {
  const maxSteps = Number(options.maxSteps) > 0 ? Number(options.maxSteps) : MAX_STEPS;
  const signal = options.signal || null;
  const approve = typeof options.approve === 'function' ? options.approve : null;
  const actor = options.actor || currentActor();
  const redaction = options.redaction || createRedactionContext();

  // `source: 'brny'` is what puts the risky actions behind an approval; the same
  // actions run without one when the user clicks them in the UI.
  const baseCtx = { source: 'brny', actor, signal };

  const tools = options.tools || toolDefinitions({ actor });

  const turn = [];
  const actions = [];
  const failures = [];
  const questions = [];
  const approvals = [];

  let usage = { input_tokens: 0, output_tokens: 0, cache_read_input_tokens: 0, cache_creation_input_tokens: 0 };
  let text = '';
  let status = 'done';
  let error = null;
  let note = null;
  let steps = 0;
  let pendingQuestion = null;
  let pendingApproval = null;

  const emit = (event) => {
    if (!options.onEvent) return;
    try {
      options.onEvent(event);
    } catch (_) { /* a listener must never be able to kill a turn */ }
  };

  for (const message of options.messages || []) {
    if (message && message.role && message.role !== 'system') turn.push(message);
  }

  // An approval or answer arriving from the UI is a tool result for a call the
  // model already made, so it has to stay in the same order it was asked for.
  if (options.resume) {
    const resumed = await resumeCall(options.resume, baseCtx, { actions, failures, approvals, emit });
    if (resumed.status) status = resumed.status;
    if (resumed.error) error = resumed.error;
    if (resumed.message) turn.push({ role: 'user', content: [resumed.message] });
  }

  if (options.prompt) turn.push({ role: 'user', content: String(options.prompt) });

  if (!turn.length) throw new Error('runTurn needs a prompt, a history, or a resume.');

  let system = options.system || BASE_INSTRUCTIONS;
  if (options.briefing !== false) {
    try {
      const briefing = await buildBriefing(baseCtx);
      if (briefing) system = `${system}\n\n${briefing}`;
    } catch (_) { /* the briefing is a nicety; a turn still works without it */ }
  }

  while (status === 'done') {
    if (signal && signal.aborted) {
      status = 'aborted';
      break;
    }
    if (steps >= maxSteps) {
      status = 'max_steps';
      note = `Stopped after ${maxSteps} steps.`;
      break;
    }
    steps += 1;
    emit({ type: 'step', index: steps, of: maxSteps });

    let reply;
    try {
      reply = await completeChat(turn, {
        system,
        tools,
        redaction,
        signal,
        maxTokens: options.maxTokens,
      });
    } catch (err) {
      // A daily allowance is not a broken turn: keep the steps and the usage so
      // the panel can still show what was done, and let the caller render the
      // limit card from `error`.
      status = err && err.name === 'AILimitError' ? 'limit' : 'error';
      error = err;
      break;
    }

    usage = addUsage(usage, reply.usage);
    emit({ type: 'usage', usage: reply.usage, total: usage, costUsd: costOf(usage, options.pricing) });

    const blocks = Array.isArray(reply.contentBlocks) ? reply.contentBlocks : [];
    const calls = Array.isArray(reply.toolCalls) ? reply.toolCalls : [];
    if (reply.content && reply.content.trim()) {
      text = reply.content;
      emit({ type: 'text', text });
    }

    if (!blocks.length && !calls.length) {
      if (!text) {
        status = 'error';
        error = new Error('The model returned an empty reply.');
      }
      break;
    }

    // The assistant turn goes back exactly as it arrived - placeholders, ids and
    // all - because the provider matches a tool result to the call it answers.
    turn.push({ role: 'assistant', content: blocks.length ? blocks : reply.content });

    if (!calls.length) break;

    const results = [];
    for (const call of calls) {
      if (signal && signal.aborted) {
        status = 'aborted';
        break;
      }
      const handled = await handleCall(call, steps, baseCtx, { actions, failures, questions, approvals, approve, emit });
      if (handled.stop) {
        status = handled.stop;
        if (handled.pendingQuestion) pendingQuestion = handled.pendingQuestion;
        if (handled.pendingApproval) pendingApproval = handled.pendingApproval;
        break;
      }
      results.push(handled.toolResult);
    }

    // Anything already run must still be answered, or the provider rejects the
    // next request for a tool call left without a result.
    if (results.length) turn.push({ role: 'user', content: results });
  }

  const messages = turn.map((message) => (
    message.role === 'assistant'
      ? { ...message, content: rehydrateBlocks(message.content, redaction) }
      : message
  ));

  const result = {
    status,
    text,
    steps,
    maxSteps,
    note,
    actions,
    failures,
    failed: failures.length,
    questions,
    approvals,
    pendingQuestion,
    pendingApproval,
    usage,
    costUsd: costOf(usage, options.pricing),
    messages,
    error,
  };
  emit({
    type: 'done',
    status,
    text,
    steps,
    note,
    actions,
    failures,
    usage,
    costUsd: result.costUsd,
  });
  return result;
}

/** Run one tool call, resolving an approval if one is needed and possible. */
async function handleCall(call, step, baseCtx, state) {
  const { actions, failures, questions, approvals, approve, emit } = state;
  const action = getAction(call.name);

  if (!action) {
    // Not registered, or not permitted for this actor - `executeTool` reports it
    // either way, so let it.
    emit({ type: 'label', tool: call.name, title: call.name, arg: keyArg(call.input) });
  } else {
    emit({ type: 'label', tool: call.name, title: action.title, arg: keyArg(call.input) });
  }

  let outcome = await executeTool(call.name, call.input, baseCtx);
  let declined = false;

  if (outcome.error && outcome.error.code === 'approval_required') {
    const pending = {
      toolUseId: call.id,
      name: call.name,
      input: call.input,
      title: (action && action.title) || call.name,
      summary: (outcome.error.details && outcome.error.details.summary) || outcome.error.message,
      message: outcome.error.message,
    };
    emit({ type: 'approval', ...pending });
    if (!approve) {
      return { stop: 'approval_required', pendingApproval: pending };
    }
    let allowed = false;
    try {
      allowed = !!(await approve(pending));
    } catch (_) {
      allowed = false;
    }
    emit({ type: 'approval_decision', toolUseId: call.id, approved: allowed });
    if (!allowed) {
      declined = true;
      approvals.push({ ...pending, approved: false });
      outcome = { outcome: null, error: null, toolResult: null };
    } else {
      approvals.push({ ...pending, approved: true });
      outcome = await executeTool(call.name, call.input, { ...baseCtx, approved: true });
    }
  }

  if (declined) {
    actions.push({ step, tool: call.name, ok: false, declined: true, summary: 'Declined by the user.' });
    emit({ type: 'tool', tool: call.name, input: call.input, ok: false, declined: true, code: 'cancelled' });
    return { toolResult: cancelledResult(call.id, 'The user declined this action.') };
  }

  if (outcome.error) {
    const code = outcome.error.code || 'error';
    failures.push({ tool: call.name, code, message: outcome.error.message });
    actions.push({ step, tool: call.name, ok: false, summary: outcome.error.message });
    emit({ type: 'tool', tool: call.name, input: call.input, ok: false, code, summary: outcome.error.message });
    return { toolResult: toolResultMessage(call.id, outcome.toolResult) };
  }

  actions.push({ step, tool: call.name, ok: true, summary: outcome.outcome.summary });
  emit({ type: 'tool', tool: call.name, input: call.input, ok: true, summary: outcome.outcome.summary });

  if (outcome.outcome.interactive) {
    const asked = outcome.outcome.result || {};
    const pending = {
      toolUseId: call.id,
      name: call.name,
      question: asked.question || outcome.outcome.summary,
      detail: asked.detail || '',
      options: Array.isArray(asked.options) ? asked.options : [],
    };
    questions.push(pending);
    emit({ type: 'question', ...pending });
    return { stop: 'ask_user', pendingQuestion: pending };
  }

  return { toolResult: toolResultMessage(call.id, outcome.toolResult) };
}

/**
 * Turn a UI decision into the tool result the model is waiting for.
 *
 * An approval that is granted is executed here rather than being handed back to
 * the loop, so the record is written exactly once and with the same input the
 * user saw on the card.
 */
async function resumeCall(resume, baseCtx, state) {
  const { actions, failures, approvals, emit } = state;
  if (!resume || !resume.toolUseId) {
    throw new Error('A resume needs the toolUseId of the call it answers.');
  }

  if (resume.answer !== undefined) {
    emit({ type: 'resume', toolUseId: resume.toolUseId, kind: 'answer' });
    const answer = typeof resume.answer === 'string' ? resume.answer : JSON.stringify(resume.answer);
    return { message: { type: 'tool_result', tool_use_id: resume.toolUseId, content: answer } };
  }

  if (resume.approved !== true) {
    emit({ type: 'resume', toolUseId: resume.toolUseId, kind: 'declined' });
    approvals.push({ toolUseId: resume.toolUseId, name: resume.name || null, approved: false });
    return { message: cancelledResult(resume.toolUseId, resume.reason) };
  }

  const action = getAction(resume.name);
  emit({ type: 'label', tool: resume.name, title: (action && action.title) || resume.name, arg: keyArg(resume.input) });
  const outcome = await executeTool(resume.name, resume.input, { ...baseCtx, approved: true });
  approvals.push({ toolUseId: resume.toolUseId, name: resume.name, input: resume.input, approved: true });

  if (outcome.error) {
    const code = outcome.error.code || 'error';
    failures.push({ tool: resume.name, code, message: outcome.error.message });
    actions.push({ step: 0, tool: resume.name, ok: false, summary: outcome.error.message });
    emit({ type: 'tool', tool: resume.name, input: resume.input, ok: false, code, summary: outcome.error.message });
    return { message: toolResultMessage(resume.toolUseId, outcome.toolResult) };
  }

  actions.push({ step: 0, tool: resume.name, ok: true, summary: outcome.outcome.summary });
  emit({ type: 'tool', tool: resume.name, input: resume.input, ok: true, summary: outcome.outcome.summary });
  return { message: toolResultMessage(resume.toolUseId, outcome.toolResult) };
}

export default { runTurn, costOf, MAX_STEPS };
