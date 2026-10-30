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
 * - Every call the model makes is answered in the user turn that follows it, even
 *   the ones a pause stopped from running. The provider rejects a conversation
 *   that leaves a `tool_use` block without a `tool_result`, and a pause is
 *   exactly when the loop stops part-way through a step's calls, so a paused turn
 *   writes a placeholder result that the resume replaces with the real one.
 * - The turn ends on its own only when it has prose, a question, an approval, or
 *   a real failure. The 12-step cap exists so a model looping on the same call
 *   cannot run up a bill; it is user-visible, not silent.
 * - A conversation is sent to the provider as the caller wrote it, and the
 *   history handed back in `messages` is that same conversation, so a later turn
 *   can hand it straight in again.
 *
 * @example
 * const turn = await runTurn({ prompt: 'Who owes us money?', onEvent: onProgress });
 * if (turn.pendingQuestion) {
 *   const next = await runTurn({ messages: turn.messages, resume: {
 *     toolUseId: turn.pendingQuestion.toolUseId, answer: 'Acme Pty Ltd',
 *   } });
 * }
 */

import { completeChat } from './aiEngine.js';
import { executeTool, getAction, toolDefinitions } from '../actions/index.js';
import { currentActor } from '../actions/context.js';
import { localDateLabel, todayLocalISO } from './dateUtils.js';

/**
 * Hard stop for one turn. Long enough for a real multi-step job — set up a
 * customer, quote it, book it, order the parts — short enough to cap a loop. A
 * turn that hits it can be carried on with `continueAfterMaxSteps`.
 */
export const MAX_STEPS = 25;

const KEEP_GOING = 'Keep going from where you stopped. Do not redo anything that already worked.';

/**
 * The history to send to carry on a turn that stopped at the step cap.
 *
 * A capped turn ends on the tool results of its last step, so the nudge is added
 * to that same user message rather than as a second user message in a row.
 */
export function continueAfterMaxSteps(messages) {
  const history = (messages || []).map((message) => ({ ...message }));
  const last = history[history.length - 1];
  if (last && last.role === 'user' && Array.isArray(last.content)) {
    last.content = [...last.content, { type: 'text', text: KEEP_GOING }];
  } else {
    history.push({ role: 'user', content: KEEP_GOING });
  }
  return history;
}

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

/**
 * The result for a call this turn did not finish.
 *
 * The provider accepts a conversation only when every `tool_use` block in an
 * assistant turn is answered in the user turn directly after it, so a step that
 * pauses on a question or an approval has to answer the calls it left behind -
 * and the one it stopped on - even though there is no outcome yet. The pause
 * point is settled by the resume, which replaces this with the real result; the
 * calls behind it never ran and are answered as such so the model can re-issue
 * them, rather than being reported as done.
 */
function unansweredResult(toolUseId, code, message) {
  return {
    type: 'tool_result',
    tool_use_id: toolUseId,
    is_error: true,
    content: JSON.stringify({ code, message }),
  };
}

/**
 * Put a resume's tool result where the provider expects it: in the user turn
 * that already answers the call it belongs to.
 *
 * A second user turn would leave the call unanswered in the message immediately
 * after the assistant turn, which the provider rejects - and it would be a second
 * turn of the same role in a row. So the placeholder the pause left in that turn
 * is what gets replaced, and an answer with no placeholder to replace joins the
 * results already there. Only a history whose last turn is not a user turn gets
 * a turn of its own, as the resume always did.
 */
function settleResumedResult(turn, message) {
  const lastIndex = turn.length - 1;
  const last = turn[lastIndex];
  const content = last && last.role === 'user' && Array.isArray(last.content) ? last.content : null;
  if (!content) {
    turn.push({ role: 'user', content: [message] });
    return;
  }
  const placeholder = content.findIndex((part) => part && part.type === 'tool_result' && part.tool_use_id === message.tool_use_id);
  const settled = placeholder < 0
    ? content.concat(message)
    : content.map((part, index) => (index === placeholder ? message : part));
  turn[lastIndex] = { ...last, content: settled };
}

/**
 * The line that tells the model what day it is. This is the one piece of the
 * briefing that is never optional: without it the model answers "what's on
 * today?" out of its training data. `get_today` supplies the counts as well, so
 * the date is written twice on purpose — the counts can be missing, the date
 * cannot.
 */
function dateLine(result = {}) {
  const now = new Date();
  const iso = result.date || todayLocalISO(now);
  return `Today is ${iso} (${result.dateLabel || localDateLabel(now)}).`;
}

/** One short line of grounding so the model does not have to spend a step asking what day it is. */
async function buildBriefing(baseCtx) {
  const { outcome, error } = await executeTool('get_today', {}, baseCtx);
  if (error || !outcome) return null;
  const result = outcome.result || {};
  return `${dateLine(result)} ${result.summary || ''}`.trim();
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
    if (resumed.message) settleResumedResult(turn, resumed.message);
  }

  if (options.prompt) turn.push({ role: 'user', content: String(options.prompt) });

  if (!turn.length) throw new Error('runTurn needs a prompt, a history, or a resume.');

  let system = options.system || BASE_INSTRUCTIONS;
  if (options.briefing !== false) {
    let briefing = dateLine();
    try {
      briefing = (await buildBriefing(baseCtx)) || briefing;
    } catch (_) { /* the date alone still grounds the turn; only the counts are lost */ }
    system = `${system}\n\n${briefing}`;
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
        signal,
        maxTokens: options.maxTokens,
      });
    } catch (err) {
      // Stopping cancels the request in flight, and the engine reports that as a
      // failed send. It is the user's own stop, not a broken turn.
      if (signal && signal.aborted) {
        status = 'aborted';
        break;
      }
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

    // The assistant turn goes back exactly as it arrived - ids and all - because
    // the provider matches a tool result to the call it answers.
    turn.push({ role: 'assistant', content: blocks.length ? blocks : reply.content });

    if (!calls.length) break;

    const results = [];
    let stoppedAt = -1;
    for (let index = 0; index < calls.length; index += 1) {
      const call = calls[index];
      if (signal && signal.aborted) {
        status = 'aborted';
        break;
      }
      const handled = await handleCall(call, steps, baseCtx, { actions, failures, questions, approvals, approve, emit });
      if (handled.stop) {
        status = handled.stop;
        stoppedAt = index;
        if (handled.pendingQuestion) pendingQuestion = handled.pendingQuestion;
        if (handled.pendingApproval) pendingApproval = handled.pendingApproval;
        break;
      }
      results.push(handled.toolResult);
    }

    // Every call in the assistant turn is answered here, run or not: the provider
    // matches a result to the call it answers and rejects a request in which any
    // tool_use block is left without one, so a pause that stopped this step
    // part-way through its calls would otherwise fail on the way back in.
    if (stoppedAt >= 0) {
      results.push(unansweredResult(calls[stoppedAt].id, 'awaiting_user', 'Waiting for the user to answer or approve this call.'));
    }
    for (let index = results.length; index < calls.length; index += 1) {
      results.push(unansweredResult(calls[index].id, 'not_run', 'Not run: this step stopped at an earlier call.'));
    }
    if (results.length) turn.push({ role: 'user', content: results });
  }

  // The history is returned as it was sent: a later turn hands it straight back.
  const messages = turn;

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

export default { runTurn, costOf, continueAfterMaxSteps, MAX_STEPS };
