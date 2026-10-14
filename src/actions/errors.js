/**
 * Typed errors for the shared action layer.
 *
 * Every action throws `ActionError` so the UI, brny's tool loop and the eval
 * suite all receive the same machine-readable `code` rather than a bare string.
 * The agent loop turns a thrown ActionError into a failed `tool_result`, which
 * is how the model learns to adapt instead of the old silent-regex failure.
 */

export const ERROR_CODES = {
  PERMISSION_DENIED: 'permission_denied',
  NOT_FOUND: 'not_found',
  INVALID_INPUT: 'invalid_input',
  AMBIGUOUS: 'ambiguous',
  CONFLICT: 'conflict',
  UNSUPPORTED: 'unsupported',
  APPROVAL_REQUIRED: 'approval_required',
  FAILED: 'failed',
};

export class ActionError extends Error {
  constructor(code, message, details = {}) {
    super(message);
    this.name = 'ActionError';
    this.code = code || ERROR_CODES.FAILED;
    this.details = details;
  }

  toJSON() {
    return { code: this.code, message: this.message, details: this.details };
  }
}

export function permissionDenied(module, key) {
  return new ActionError(
    ERROR_CODES.PERMISSION_DENIED,
    `You do not have permission to ${String(key).replace(/_/g, ' ')} on ${module}.`,
    { module, key }
  );
}

export function notFound(what, query) {
  return new ActionError(ERROR_CODES.NOT_FOUND, `No ${what} matched "${query}".`, { what, query });
}

/**
 * The request matched more than one record. `options` is the shortlist the
 * caller should choose from, shaped for an ask_user card.
 */
export function ambiguousMatch(what, query, options) {
  return new ActionError(
    ERROR_CODES.AMBIGUOUS,
    `"${query}" matches ${options.length} ${what}s: ${options.map((o) => o.label).join(', ')}. Which one did you mean?`,
    { what, query, options }
  );
}

export function invalidInput(message, details = {}) {
  return new ActionError(ERROR_CODES.INVALID_INPUT, message, details);
}

export function conflict(message, details = {}) {
  return new ActionError(ERROR_CODES.CONFLICT, message, details);
}

export function unsupported(message, details = {}) {
  return new ActionError(ERROR_CODES.UNSUPPORTED, message, details);
}

/**
 * Raised when brny wants to run an action that changes something the user should
 * see first. The conversation surfaces an approval card and re-runs the same
 * action with `ctx.approved = true` once it is confirmed.
 */
export function approvalRequired(action, summary) {
  return new ActionError(
    ERROR_CODES.APPROVAL_REQUIRED,
    `"${action}" needs your approval before it runs.`,
    { action, summary }
  );
}

export function isActionError(error) {
  return error instanceof ActionError;
}

/** Normalise any thrown value into an ActionError so callers never guess. */
export function asActionError(error) {
  if (isActionError(error)) return error;
  if (error instanceof Error) return new ActionError(ERROR_CODES.FAILED, error.message, { cause: error.name });
  return new ActionError(ERROR_CODES.FAILED, String(error));
}
