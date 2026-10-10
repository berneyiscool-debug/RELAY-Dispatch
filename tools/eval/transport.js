/**
 * The eval harness's Anthropic transport.
 *
 * In the browser the app never talks to Anthropic directly: `aiEngine.js` calls
 * `supabase.functions.invoke('relay-copilot', { body })` and the edge function
 * forwards the body upstream with the API key. The harness has no edge function,
 * so this file stands in for it — and it reproduces `relay-copilot/index.ts`
 * exactly (same defaults, same header set, same error wording) so a green run
 * here says something about the deployed path rather than about a convenient
 * shortcut.
 *
 * The `invoke` contract is supabase-js's, because that is what `requestCompletion`
 * destructures: `{ data, error }`, with `error.context.text()` carrying the raw
 * upstream body.
 */

/** Mirrors `DEFAULT_MODEL` in the edge function. */
export const DEFAULT_MODEL = 'claude-haiku-5-5';

/** Mirrors `DEFAULT_MAX_TOKENS` in the edge function. */
export const DEFAULT_MAX_TOKENS = 4096;

/** Mirrors `ANTHROPIC_VERSION` in the edge function. */
export const ANTHROPIC_VERSION = '2023-06-01';

const DEFAULT_BASE_URL = 'https://api.anthropic.com';

/**
 * Build the upstream request body from the client's body.
 *
 * Same field order and same conditionals as the edge function: `system` is only
 * sent when truthy (Anthropic rejects an empty one), and tools only when the
 * array has something in it. `temperature` and `thinking` are absent there too —
 * the 5.5 generation 400s on a temperature — and an eval that sent one would
 * fail for a reason the deployed proxy never would.
 */
export function anthropicPayload(body = {}, { model, maxTokens } = {}) {
  const limit = Number(body.max_tokens) > 0 ? Number(body.max_tokens) : maxTokens;
  const payload = {
    model: model || DEFAULT_MODEL,
    max_tokens: Number(limit) > 0 ? Number(limit) : DEFAULT_MAX_TOKENS,
    messages: body.messages,
  };
  if (body.system) payload.system = body.system;
  if (Array.isArray(body.tools) && body.tools.length) {
    payload.tools = body.tools;
    payload.tool_choice = body.tool_choice || { type: 'auto' };
  }
  return payload;
}

/**
 * Create the transport.
 *
 * @param {object}   [options]
 * @param {string}   [options.apiKey]   Defaults to `process.env.ANTHROPIC_API_KEY`.
 * @param {string}   [options.model]    Defaults to `process.env.RELAY_EVAL_MODEL`.
 * @param {number}   [options.maxTokens]
 * @param {string}   [options.baseUrl]  Override for a mock server, so the harness
 *                                      can be exercised without a key or a network.
 * @param {Function} [options.fetchImpl] Defaults to global `fetch`.
 * @param {Function} [options.onCall]   `(info) => void`, called after every request
 *                                      with the payload and the parsed reply or error.
 * @returns {{ invoke: Function, hasKey: boolean, calls: Array }}
 */
export function createAnthropicTransport(options = {}) {
  const apiKey = options.apiKey || process.env.ANTHROPIC_API_KEY || '';
  const model = options.model || process.env.RELAY_EVAL_MODEL || DEFAULT_MODEL;
  const maxTokens = Number(options.maxTokens) > 0 ? Number(options.maxTokens) : null;
  const baseUrl = (options.baseUrl || process.env.RELAY_EVAL_BASE_URL || DEFAULT_BASE_URL).replace(/\/+$/, '');
  const doFetch = options.fetchImpl || globalThis.fetch;
  const onCall = typeof options.onCall === 'function' ? options.onCall : null;
  const calls = [];

  async function invoke(name, request = {}) {
    const fn = String(name || '').split('?')[0];
    if (fn !== 'relay-copilot') {
      return { data: null, error: new Error(`The eval transport only serves relay-copilot, not ${name}.`) };
    }
    if (!apiKey) {
      return { data: null, error: new Error('ANTHROPIC_API_KEY is not set, so the eval cannot reach the model.') };
    }

    const payload = anthropicPayload(request.body || {}, { model, maxTokens });
    const started = Date.now();
    let response;
    try {
      response = await doFetch(`${baseUrl}/v1/messages`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': apiKey,
          'anthropic-version': ANTHROPIC_VERSION,
        },
        body: JSON.stringify(payload),
        signal: request.signal,
      });
    } catch (err) {
      calls.push({ payload, failed: true, status: 0, ms: Date.now() - started });
      if (onCall) onCall({ payload, error: err });
      return { data: null, error: err };
    }

    const text = await response.text();
    const ms = Date.now() - started;

    if (!response.ok) {
      // Same wording as the edge function, and the same `error.context.text()`
      // escape hatch supabase-js gives `requestCompletion` to unwrap it.
      const message = `AI API error (model ${payload.model}): ${response.status} - ${text}`;
      const error = new Error(message);
      error.status = response.status;
      error.context = { text: async () => message };
      calls.push({ payload, failed: true, status: response.status, ms });
      if (onCall) onCall({ payload, status: response.status, body: text, error });
      return { data: null, error };
    }

    let data;
    try {
      data = JSON.parse(text);
    } catch (err) {
      calls.push({ payload, failed: true, status: response.status, ms });
      if (onCall) onCall({ payload, status: response.status, body: text, error: err });
      return { data: null, error: err };
    }

    calls.push({ payload, data, status: response.status, ms });
    if (onCall) onCall({ payload, status: response.status, data });
    return { data, error: null };
  }

  return { invoke, hasKey: Boolean(apiKey), model, baseUrl, calls };
}
