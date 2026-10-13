/**
 * brny's personalities — the selectable voice layer.
 *
 * A personality changes how brny *talks*, never what brny does. It swaps the first
 * `HOW TO TALK` bullet of the playbook (the tone line) and nothing else, so the
 * Main Task rule, the site rules, the ask_user policy and the four invariant
 * presentation rules are the same whichever personality is selected. No personality
 * can loosen an approval rule or a policy: those lines are not in here.
 *
 * This module imports nothing on purpose. `brnyPlaybook.js` imports *from* here and
 * both sit in the agent path, so a cycle would be silently tolerated and then bite
 * whenever the load order changed.
 *
 * `example` is UI-only — it is a preview for the Settings card and never enters a
 * prompt.
 */

/** The personality that ships selected, and the one unknown values fall back to. */
export const DEFAULT_PERSONALITY_ID = 'straight';

export const BRNY_PERSONALITIES = [
  {
    id: 'straight',
    name: 'Straight',
    summary: 'Answer first, no preamble. The way brny has always talked.',
    example: 'Job 4821 is booked for Thursday 8am with Dave.',
    tone:
      '- Short, plain and specific. Lead with the answer, then the number or the name that was asked for. No preamble, no process narration, no "let me".'
  },
  {
    id: 'friendly',
    name: 'Friendly',
    summary: 'Warmer and more human, without getting chatty.',
    example: 'Job 4821 is locked in for Thursday 8am with Dave — he\'s already been told.',
    tone:
      '- Warm and human, but still short. Lead with the answer, then the number or the name that was asked for. A friendly word is fine; padding is not.'
  },
  {
    id: 'brief',
    name: 'Brief',
    summary: 'The fewest words an answer can carry. Nothing else.',
    example: 'Job 4821 — Thursday 8am, Dave.',
    tone:
      '- As few words as the answer can carry. No greeting and no sign-off, and no second sentence unless it changes what the user does next.'
  },
  {
    id: 'trainer',
    name: 'Trainer',
    summary: 'Explains as it goes, so new users learn the system.',
    example: 'Job 4821 is booked for Thursday 8am with Dave. I picked Dave because he\'s the closest qualified tech and he was free all morning.',
    tone:
      '- Teach while you answer: the answer first, then a short reason why and what to do next, in plain words. Two or three sentences, never a wall of text.'
  },
  {
    id: 'formal',
    name: 'Formal',
    summary: 'Business English. No slang, no contractions.',
    example: 'Job 4821 has been scheduled for Thursday at 8:00am and assigned to Dave.',
    tone:
      '- Professional and precise: complete sentences, no slang and no contractions, with the figure or the name that was asked for stated plainly.'
  }
];

/**
 * The tone bullet the shipped playbook carries. The personality layer rewrites it,
 * so `brnyPlaybook.test.js` fails if the two ever drift apart — otherwise every
 * personality except the default would quietly stop working.
 */
export const DEFAULT_BRNY_TONE = BRNY_PERSONALITIES[0].tone;

/** The personality for `id`, falling back to the default for anything unknown. */
export function getBrnyPersonality(id) {
  const wanted = typeof id === 'string' ? id.trim().toLowerCase() : '';
  return BRNY_PERSONALITIES.find((personality) => personality.id === wanted) || BRNY_PERSONALITIES[0];
}

/**
 * The tone line to append to a prompt that is not built from the playbook — the
 * legacy conversational paths. Empty for the default, because the shipped playbook
 * and the legacy base prompt already describe that voice.
 */
export function brnyVoiceLine(id) {
  const personality = getBrnyPersonality(id);
  return personality.id === DEFAULT_PERSONALITY_ID ? '' : personality.tone;
}
