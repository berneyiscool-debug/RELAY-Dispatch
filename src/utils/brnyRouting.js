/**
 * Which engine answers a triaged turn.
 *
 * brny's agent loop is the only path that carries the action registry as tools,
 * so a turn that changes something has to land there. The specialist flows
 * behind it answer questions, propose `[ACTION: …]` tags, resolve drive times
 * and run the emergency scan - none of them can log time, add a task or raise an
 * invoice, so routing a write to them is what makes "add 2 hours to J-00028"
 * unanswerable.
 *
 * The ACTION intent covers writes and in-app shortcuts alike ("fit the canvas"
 * is an action too), so ACTION is not by itself enough to pick the loop. What
 * decides is whether the turn asks for something only the in-app shortcuts can
 * do - the canvas, navigation and memory commands are UI effects rather than
 * store writes, so there is no action for the agent to call and they keep the
 * specialist flow they have always used.
 *
 * EXTERNAL and URGENT own side effects of their own (weather and drive times,
 * the emergency scan and its watchdog panel) and are never rerouted.
 */

// Phrasings the in-app shortcuts own. Deliberately narrow: anything not listed
// here goes to the agent loop, which is the only path that can change records.
const IN_APP_SHORTCUT =
  /\b(canvas|widgets?|dashboards?|sidebar|layout|navigat\w*|conflicts?|double[- ]?book\w*|bulk|optimi[sz]e|reorder|fact\s?sheet|remember|memor(?:y|ies|ise|ize|ised|ized))\b/i;
// The same shortcuts phrased as a movement: "jump to a view", "take me to jobs",
// "open the schedule page".
const SHORTCUT_MOVEMENT =
  /\b(?:jump|going?|take\s+me|switch|bring\s+me|show|open)\s+(?:me\s+)?(?:up\s+)?(?:to\s+|the\s+)/i;

/** True when the turn asks for something only the in-app shortcuts can do. */
export function needsInAppShortcut(text) {
  const value = text == null ? '' : String(text);
  return IN_APP_SHORTCUT.test(value) || SHORTCUT_MOVEMENT.test(value);
}

/**
 * True when the agent loop should answer this turn.
 *
 * `agentAvailable` is `canRunBrnyAgent()`: without a mounted thread the loop has
 * nowhere to stream its steps, so the specialist flows stay in charge.
 */
export function shouldUseAgentLoop({ intent, text, agentAvailable } = {}) {
  if (!agentAvailable) return false;
  if (intent === 'QUESTION') return true;
  if (intent !== 'ACTION') return false;
  return !needsInAppShortcut(text);
}
