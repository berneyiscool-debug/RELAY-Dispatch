/**
 * The action layer's front door.
 *
 * Importing this module registers every action, because each module calls
 * `defineAction` as a side effect of being loaded. Everything the UI, brny's
 * agent loop and the eval suite need hangs off here, so there is exactly one
 * place where "what can the app do" is answered.
 *
 * Import order matters only for readability — `defineAction` throws on a
 * duplicate name, so a collision fails loudly at boot rather than silently
 * shadowing a tool.
 */

import './customers.js';
import './leads.js';
import './quotes.js';
import './jobs.js';
import './scheduling.js';
import './timeMaterials.js';
import './invoices.js';
import './purchasing.js';
import './notifications.js';
import './todos.js';
import './reads.js';
import './conversation.js';

export { executeAction, toToolResult, getAction, hasAction, listActions, listAvailableActions, toToolDefinitions } from './registry.js';
export { ActionError, ERROR_CODES, isActionError } from './errors.js';

import { executeAction, toToolResult, listAvailableActions, toToolDefinitions } from './registry.js';

/** Every action this actor may run. */
export function listTools(ctx = {}) {
  return listAvailableActions(ctx);
}

/** `tools` array for the Anthropic messages API. */
export function toolDefinitions(ctx = {}) {
  return toToolDefinitions(ctx);
}

/**
 * Run a tool call and shape the outcome as an Anthropic `tool_result`.
 *
 * Never throws: a failed action becomes `is_error: true` with the typed
 * `{code, message}` payload, which is what lets the model correct itself rather
 * than the whole turn dying.
 *
 * @returns {Promise<{ outcome: object|null, error: Error|null, toolResult: object }>}
 */
export async function executeTool(name, input, ctx = {}) {
  try {
    const outcome = await executeAction(name, input, ctx);
    return { outcome, error: null, toolResult: toToolResult(null, outcome) };
  } catch (error) {
    return { outcome: null, error, toolResult: toToolResult(error) };
  }
}
