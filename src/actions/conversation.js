/**
 * Conversation control.
 *
 * `ask_user` is an action like any other so that the model can reach for it with
 * a tool call, but its "result" is a question rather than a write. The agent loop
 * treats `interactive` outcomes as the end of a turn: brny stops, the card is
 * shown, and the answer starts the next turn.
 */

import { defineAction } from './registry.js';
import { objectSchema, str, list } from './schema.js';

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
