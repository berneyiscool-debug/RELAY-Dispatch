/**
 * The action registry.
 *
 * One place where every capability the app can perform is declared — its input
 * schema, the permission it needs, whether it is risky, and how it is described
 * to a user or to the model. The UI and brny both call through `executeAction`,
 * so numbering, validation, side effects and audit trails cannot drift apart.
 */

import { asActionError, approvalRequired, notFound } from './errors.js';
import { assertPermission, currentActor } from './context.js';
import { validateInput } from './validate.js';

const actions = new Map();

const DEFAULT_INPUT_SCHEMA = { type: 'object', properties: {}, additionalProperties: false };

/**
 * Declare an action.
 *
 * @param {object} definition
 * @param {string} definition.name        snake_case tool name, unique
 * @param {string} definition.title       short human label ("Create lead")
 * @param {string} definition.description written for the model: when to use it
 * @param {object} [definition.permission] `{ module, key }` or an array of them
 * @param {object} [definition.inputSchema] JSON Schema for the arguments
 * @param {boolean} [definition.readOnly]  no write; shown as a lookup
 * @param {boolean} [definition.risky]     brny must show an approval card first
 * @param {boolean} [definition.interactive] hands control back to the user
 * @param {boolean} [definition.cloudOnly]  unavailable in the demo workspace
 * @param {(input:object, ctx:object)=>string} [definition.summarize] sentence for the UI
 * @param {(input:object, ctx:object)=>Promise<any>} definition.run
 */
export function defineAction(definition) {
  if (!definition || !definition.name) throw new Error('An action needs a name.');
  if (typeof definition.run !== 'function') throw new Error(`Action "${definition.name}" needs a run function.`);
  if (actions.has(definition.name)) throw new Error(`Action "${definition.name}" is already defined.`);

  const action = {
    summary: null,
    artifacts: null,
    inputSchema: DEFAULT_INPUT_SCHEMA,
    readOnly: false,
    risky: false,
    interactive: false,
    cloudOnly: false,
    permission: null,
    ...definition,
    inputSchema: definition.inputSchema || DEFAULT_INPUT_SCHEMA,
  };

  actions.set(action.name, action);
  return action;
}

/** Test/seed helper: drop every registration. */
export function clearActions() {
  actions.clear();
}

export function getAction(name) {
  return actions.get(name) || null;
}

export function hasAction(name) {
  return actions.has(name);
}

/** Every registered action, in declaration order. */
export function listActions() {
  return [...actions.values()];
}

/** Only the actions this actor may actually run — brny is never offered the rest. */
export function listAvailableActions(ctx = {}) {
  return listActions().filter((action) => {
    try {
      assertPermission(action.permission, ctx);
      return true;
    } catch {
      return false;
    }
  });
}

/**
 * `tools` array for the Anthropic messages API.
 * Read-only actions carry a `[read-only]` marker so the model can prefer them
 * when it is only being asked a question.
 */
export function toToolDefinitions(ctx = {}) {
  return listAvailableActions(ctx).map((action) => ({
    name: action.name,
    description: action.readOnly ? `[read-only] ${action.description}` : action.description,
    input_schema: action.inputSchema,
  }));
}

function defaultSummary(action, input, result) {
  if (typeof action.summarize === 'function') {
    try {
      const text = action.summarize(input, result);
      if (typeof text === 'string' && text.trim()) return text;
    } catch {
      // A summary is cosmetic — never let it hide a real result.
    }
  }
  if (result && typeof result === 'object' && typeof result.summary === 'string') return result.summary;
  return action.title;
}

function collectArtifacts(action, result) {
  if (typeof action.artifacts === 'function') {
    try {
      return action.artifacts(result) || [];
    } catch {
      return [];
    }
  }
  const out = [];
  const push = (type, record, label) => {
    if (record && record.id) out.push({ type, id: record.id, label: label ?? record.number ?? record.title ?? record.name ?? record.id });
  };
  if (result && typeof result === 'object') {
    for (const [key, value] of Object.entries(result)) {
      if (!value || typeof value !== 'object') continue;
      if (value.id && typeof key === 'string') {
        const type = key.replace(/Id$/, '').replace(/([A-Z])/g, (m) => m.toLowerCase());
        push(type, value);
      }
    }
  }
  return out;
}

/**
 * Run an action on behalf of an actor.
 *
 * Throws an `ActionError` on every failure path — invalid input, missing
 * permission, ambiguity, approval required, or a downstream write failure — so
 * callers only ever have to catch one type.
 *
 * @param {string} name
 * @param {object} input raw arguments (validated and coerced here)
 * @param {object} [ctx]
 * @param {'ui'|'brny'|'eval'} [ctx.source]
 * @param {boolean} [ctx.approved] the user confirmed an approval card
 * @param {AbortSignal} [ctx.signal]
 * @returns {Promise<{action:string,title:string,summary:string,result:any,artifacts:Array}>}
 */
export async function executeAction(name, input = {}, ctx = {}) {
  const action = getAction(name);
  if (!action) throw notFound('action', name);

  const context = {
    ...ctx,
    actor: ctx.actor || currentActor(),
    source: ctx.source || 'ui',
    approved: !!ctx.approved,
    startedAt: Date.now(),
  };

  try {
    const clean = validateInput(action.inputSchema, input);
    assertPermission(action.permission, context);
    if (action.risky && context.source === 'brny' && !context.approved) {
      throw approvalRequired(name, defaultSummary(action, clean));
    }

    const result = await action.run(clean, context);
    return {
      action: action.name,
      title: action.title,
      summary: defaultSummary(action, clean, result),
      result,
      artifacts: collectArtifacts(action, result),
      risky: action.risky,
      interactive: action.interactive,
    };
  } catch (error) {
    throw asActionError(error, `Action "${name}" failed.`);
  }
}

/** Anthropic `tool_result` content for an action outcome. */
export function toToolResult(error, outcome) {
  if (error) {
    const safe = asActionError(error);
    return { is_error: true, content: JSON.stringify(safe.toJSON()) };
  }
  return { is_error: false, content: JSON.stringify({ summary: outcome.summary, ...(outcome.result ?? {}) }) };
}
