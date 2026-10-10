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
    'Ask the user a question and end the turn. Use this when the request is genuinely ambiguous — two customers with the same name, a date you cannot pin down, or a choice only the user can make. Give short options when the answer is a choice. Do not use it to confirm something you could have looked up, and do not use it for anything that changes money or books a technician in — those need approval, not a question.',
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
