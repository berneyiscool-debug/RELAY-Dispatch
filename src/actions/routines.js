/**
 * Routines — instructions brny runs on its own on a schedule.
 *
 * A routine is stored by `utils/deputyRoutines.js`, the same module the Routines
 * tab uses, and runs through the tool loop whenever its trigger comes due while
 * the app is open somewhere. Routines are a brny Max feature, so every action
 * here refuses cleanly on a plan without it.
 */

import { defineAction } from './registry.js';
import { objectSchema, str, int, bool, enumOf } from './schema.js';
import { invalidInput, notFound, unsupported } from './errors.js';
import { scoreRecord } from './resolve.js';
import { hasDeputyMax } from '../utils/aiTier.js';
import {
  getRoutines,
  createRoutine,
  updateRoutine,
  deleteRoutine,
  describeTrigger,
} from '../utils/deputyRoutines.js';

const TRIGGER_TYPES = ['interval', 'morning', 'new_chat'];
const UNITS = ['minutes', 'hours', 'days'];

function requireMax() {
  if (!hasDeputyMax()) throw unsupported('Routines are a brny Max feature, and this account is not on it.');
}

/** A routine by id or by its title, best match first. */
export function resolveRoutine(query) {
  const routines = getRoutines();
  const byId = routines.find((r) => r.id === query);
  if (byId) return byId;
  const scored = routines
    .map((r) => ({ r, score: scoreRecord({ id: r.id, title: r.title }, query, ['title']) }))
    .filter((entry) => entry.score > 0)
    .sort((a, b) => b.score - a.score);
  if (!scored.length) throw notFound('routine', query);
  return scored[0].r;
}

function triggerFrom(input, current = null) {
  if (input.trigger == null && input.every == null && input.unit == null) return undefined;
  const type = input.trigger || (input.every != null || input.unit != null ? 'interval' : current?.type) || 'interval';
  if (type !== 'interval') return { type };
  const interval = input.every != null ? input.every : (current?.interval || 1);
  if (!(interval >= 1)) throw invalidInput('`every` must be at least 1.');
  if ((input.unit || current?.unit) === 'minutes' && interval < 15) {
    throw invalidInput('Run a routine at most every 15 minutes — each run uses AI allowance.');
  }
  return { type, interval, unit: input.unit || current?.unit || 'days' };
}

const view = (r) => ({ id: r.id, title: r.title, schedule: describeTrigger(r.trigger), prompt: r.prompt, enabled: r.enabled, lastRunAt: r.lastRunAt });

const triggerInput = {
  trigger: enumOf(TRIGGER_TYPES, '"interval" repeats every N units, "morning" runs once a day on the first check of the morning, "new_chat" runs whenever a new chat is opened.'),
  every: int('For an interval: how many units between runs.'),
  unit: enumOf(UNITS, 'For an interval: minutes, hours or days.'),
};

defineAction({
  name: 'create_routine',
  title: 'Create routine',
  description:
    'Set up something brny should do on its own on a schedule — "every morning, chase invoices more than 14 days overdue", "every Friday arvo, approve last week\'s timesheets". The prompt is the instruction brny will follow each run, with its tools. Runs happen while the app is open on any device; a risky step waits for approval. For repeating customer work (a monthly service) use create_recurring_job instead.',
  inputSchema: objectSchema(
    {
      title: str('Short name, e.g. "Chase overdue invoices".'),
      prompt: str('The instruction brny follows on each run, written as you would ask brny in chat.'),
      ...triggerInput,
    },
    ['title', 'prompt']
  ),
  summarize: (input, result) => `Routine "${result.routine.title}" set up — ${result.routine.schedule}.`,
  run: async (input) => {
    requireMax();
    if (!String(input.prompt || '').trim()) throw invalidInput('A routine needs an instruction to follow.');
    const trigger = triggerFrom(input) || { type: 'morning' };
    const routine = await createRoutine({ title: input.title, prompt: input.prompt.trim(), trigger });
    return { routine: view(routine) };
  },
});

defineAction({
  name: 'update_routine',
  title: 'Update routine',
  description: 'Change a routine\'s name, instruction or schedule, or pause and resume it with `enabled`.',
  inputSchema: objectSchema(
    {
      routine: str('Routine title or id.'),
      title: str('New name.'),
      prompt: str('New instruction.'),
      enabled: bool('false to pause the routine, true to resume it.'),
      ...triggerInput,
    },
    ['routine']
  ),
  summarize: (input, result) => `Routine "${result.routine.title}" updated — ${result.routine.enabled ? result.routine.schedule : 'paused'}.`,
  run: async (input) => {
    requireMax();
    const routine = resolveRoutine(input.routine);
    const patch = {};
    if (input.title != null) patch.title = input.title;
    if (input.prompt != null) patch.prompt = input.prompt;
    if (input.enabled != null) patch.enabled = input.enabled;
    const trigger = triggerFrom(input, routine.trigger);
    if (trigger) patch.trigger = trigger;
    if (!Object.keys(patch).length) throw invalidInput('Nothing to update — pass at least one new value.');
    return { routine: view(await updateRoutine(routine.id, patch)) };
  },
});

defineAction({
  name: 'list_routines',
  title: 'List routines',
  description: 'List brny\'s routines with their schedules, whether they are paused, and when each last ran.',
  readOnly: true,
  summarize: (input, result) => `${result.routines.length} routine(s).`,
  run: async () => {
    requireMax();
    return { routines: getRoutines().map(view) };
  },
});

defineAction({
  name: 'delete_routine',
  title: 'Delete routine',
  description: 'Delete a routine for good. To stop it for a while, pause it with update_routine instead.',
  risky: true,
  inputSchema: objectSchema({ routine: str('Routine title or id.') }, ['routine']),
  summarize: (input, result) => `Deleted routine "${result.routine.title}".`,
  run: async (input) => {
    requireMax();
    const routine = resolveRoutine(input.routine);
    await deleteRoutine(routine.id);
    return { routine: view(routine) };
  },
});
