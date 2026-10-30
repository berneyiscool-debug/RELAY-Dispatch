// ============================================
// brny — ONE ROUTINE RUN
// ============================================
// A routine is a scheduled chat turn with nobody watching. It runs through the
// same tool loop as a typed message (`runTurn`), so it can actually do the work
// — chase an invoice, book a job, raise a to-do — instead of describing it.
//
// Nothing here touches the DOM: the panel decides where the report and any card
// are drawn. That keeps the run itself testable in Node.

import { runTurn as defaultRunTurn } from './brnyAgent.js';
import { describeTrigger } from './deputyRoutines.js';

/** Routines may chain more work than a typed request before they report back. */
export const ROUTINE_MAX_STEPS = 20;

/** The user turn a routine runs as: its instruction, framed as an unattended run. */
export function routinePrompt(routine) {
  return [
    `Scheduled routine "${routine.title}" (${describeTrigger(routine.trigger)}). Nobody is watching this run.`,
    'Do the work with your tools rather than describing it. Only ask a question when you cannot go on without the answer; a risky step will wait for approval on its own.',
    'Finish with a short report of what you did and anything that needs a person.',
    '',
    routine.prompt || '',
  ].join('\n');
}

function reportFor(result) {
  const text = String(result.text || '').trim();
  const ran = (result.actions || []).filter((a) => a.ok && !a.declined && a.tool !== 'update_plan').length;
  if (result.status === 'max_steps') return `${text || 'The routine ran out of steps before it finished.'}${result.note ? `\n\n${result.note}` : ''}`;
  if (text) return text;
  if (ran) return `Done — ${ran} action${ran === 1 ? '' : 's'} run.`;
  if (result.failures && result.failures.length) return `That did not work: ${result.failures[0].message}`;
  return '';
}

/**
 * Run one routine through the tool loop.
 *
 * @param {object} routine A normalised routine.
 * @param {object} options
 * @param {string} options.system The brny playbook prompt.
 * @param {Function} [options.runTurn] Injected for tests.
 * @returns {Promise<{report:string, pending:object|null, result:object}>}
 *   `pending` is set when the run stopped on a question or an approval, carrying
 *   what the panel needs to resume the turn from a card.
 */
export async function runRoutineTurn(routine, { system, runTurn = defaultRunTurn, signal } = {}) {
  const result = await runTurn({ system, prompt: routinePrompt(routine), maxSteps: ROUTINE_MAX_STEPS, signal });

  if (result.status === 'limit' || result.status === 'error') {
    throw result.error || new Error('brny could not reach the assistant service.');
  }

  let pending = null;
  let waiting = '';
  if (result.status === 'ask_user' && result.pendingQuestion) {
    pending = { messages: result.messages, pendingQuestion: result.pendingQuestion };
    waiting = 'This routine is waiting for your answer before it can carry on.';
  } else if (result.status === 'approval_required' && result.pendingApproval) {
    pending = { messages: result.messages, pendingApproval: result.pendingApproval };
    waiting = `This routine is waiting for your approval: ${result.pendingApproval.summary || result.pendingApproval.name || 'a risky step'}.`;
  }

  const body = reportFor(result);
  const report = [body, waiting].filter(Boolean).join('\n\n')
    || `Ran "${routine.title}" — ${describeTrigger(routine.trigger)}.`;
  return { report, pending, result };
}
