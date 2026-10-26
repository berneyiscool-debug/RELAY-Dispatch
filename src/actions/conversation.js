/**
 * Conversation control.
 *
 * `ask_user` is an action like any other so that the model can reach for it with
 * a tool call, but its "result" is a question rather than a write. The agent loop
 * treats `interactive` outcomes as the end of a turn: brny stops, the card is
 * shown, and the answer starts the next turn.
 *
 * `update_plan` changes nothing either. It lays out the steps of a multi-step
 * job before brny starts, then ticks them off, so the panel can show the whole
 * plan at once and the user can see brny is partway through, not stuck.
 */

import { defineAction } from './registry.js';
import { objectSchema, objectOf, str, list, enumOf } from './schema.js';

export const PLAN_STATUSES = ['pending', 'in_progress', 'done'];

defineAction({
  name: 'update_plan',
  title: 'Plan',
  description:
    'Show the user your plan for a job that takes more than one tool call, and keep it current. Call it first with every step you intend to take — the first one in_progress, the rest pending — in the same response as the first tool that step needs. Each time you move on, call it again in the same response as the next step\'s tool, with the finished step done and the next one in_progress. Send the whole list every time. Steps are short, plain actions a tradie would recognise ("Find Harbour Electrical", "Book Jake in for Friday"), not tool names. Skip it for a single lookup or a one-tool job. It changes no records.',
  readOnly: true,
  inputSchema: objectSchema(
    {
      steps: list(
        objectOf(
          {
            title: str('The step, a few words long.'),
            status: enumOf(PLAN_STATUSES, 'pending, in_progress or done.'),
          },
          'One step of the plan.',
          ['title', 'status']
        ),
        'Every step of the plan in order, two to eight of them.'
      ),
    },
    ['steps']
  ),
  summarize: (input) => {
    const steps = input.steps || [];
    return `${steps.filter((s) => s.status === 'done').length} of ${steps.length} steps done`;
  },
  run: async ({ steps }) => ({ planned: true, steps }),
});

defineAction({
  name: 'ask_user',
  title: 'Ask the user',
  description:
    'Ask the user a question and end the turn; their answer resumes this same turn. Use this instead of writing a question into your reply — a prose question cannot be answered with a button. Call it when the request is genuinely ambiguous, when two records match, when a required detail is missing (which day, which customer, how long), or when only the user can decide. Always pass 2 to 6 short options when the answer is a choice (a day, a customer, a duration, yes or no), and omit them only when the answer is free text. Ask one question per call: the one that unblocks you, not a list. Do not use it to confirm something you could have looked up, and do not use it for anything that changes money or books a technician in — those need approval, not a question.',
  interactive: true,
  inputSchema: objectSchema(
    {
      question: str('The question, phrased the way a colleague would ask it out loud.'),
      options: list(str('One choice, a few words long.'), 'Two to six choices to render as buttons. Omit for a free-text answer.'),
      detail: str('One short line of context so the user can answer without re-reading the conversation.'),
    },
    ['question']
  ),
  summarize: (input) => input.question,
  run: async ({ question, options, detail }) => ({
    asked: true,
    question,
    detail: detail || '',
    options: options || [],
  }),
});
