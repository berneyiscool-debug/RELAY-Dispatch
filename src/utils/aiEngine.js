// ============================================
// RELAY — Central AI engine / pipeline
// ============================================
// The single transport for every AI call in the app: Deputy chat, autopilot,
// RELAY Insights and the attachment batches. Pipeline: redact PII -> request the
// provider -> rehydrate PII. Returns the full completion (content + usage) so
// callers can observe token usage where needed.
//
// Provider routing is deliberately not a caller concern. The Supabase edge
// function `relay-copilot` holds the DeepSeek key server-side and is hard-coded
// to api.deepseek.com, so no caller - and no stale saved setting - can point
// Deputy at another vendor or reach for a client-side key. Deputy ships with a
// paid Cloud workspace, so there is deliberately no local key path either.

import { supabase } from './supabase.js';
import { isCloudUser } from './aiTier.js';
import { createRedactionContext, redactText, rehydrateText } from './piiRedaction.js';

// The allowance resets at Sydney midnight. Callers show the reset in the user's
// own local time, so the instant matters more than the wording.
export function formatLocalReset(at) {
  const time = new Intl.DateTimeFormat(undefined, { hour: 'numeric', minute: '2-digit' }).format(at);
  const today = new Date();
  const tomorrow = new Date(today.getTime() + 86400000);
  if (at.toDateString() === today.toDateString()) return `${time} today`;
  if (at.toDateString() === tomorrow.toDateString()) return `${time} tomorrow`;
  const day = new Intl.DateTimeFormat(undefined, { weekday: 'short', day: 'numeric', month: 'short' }).format(at);
  return `${time} on ${day}`;
}

// Thrown when this seat, or the whole company, has used the day's AI allowance.
// A distinct type so callers can show it plainly instead of falling back to the
// offline local assistant, which would look like the AI had broken.
export class AILimitError extends Error {
  constructor({ message, scope, remainingMessages, poolRemainingMessages, resetsAt }) {
    super(message);
    this.name = 'AILimitError';
    this.scope = scope === 'user' ? 'user' : 'company';
    this.remainingMessages = Number.isFinite(remainingMessages) ? remainingMessages : null;
    this.poolRemainingMessages = Number.isFinite(poolRemainingMessages) ? poolRemainingMessages : null;
    this.resetsAt = parseReset(resetsAt);
  }
}

// A reset instant only counts if it parses: the value travels as an ISO string
// from the proxy, so anything else is treated as absent rather than rendered.
function parseReset(value) {
  if (!value) return null;
  const at = new Date(value);
  return Number.isNaN(at.getTime()) ? null : at;
}

// Copy that names the reset in the reader's own timezone. `message` from the
// server is the fallback when there is no reset instant to render. Exported for
// tests: this is the sentence a blocked user actually reads.
export function limitErrorMessage(body) {
  const resetAt = parseReset(body.resetsAt);
  const reset = resetAt ? formatLocalReset(resetAt) : null;
  if (!reset) return body.message;
  if (body.scope === 'user') {
    // A personal block says nothing about the team, so say it explicitly.
    const teamLeft = Number.isFinite(body.poolRemainingMessages) ? body.poolRemainingMessages : null;
    const tail = teamLeft > 0
      ? ` Your team can still send about ${teamLeft} more message${teamLeft === 1 ? '' : 's'} today.`
      : ' Your team is out of AI allowance for today too.';
    return `You've reached your personal brny allowance for today. It resets at ${reset}.${tail}`;
  }
  return `Your team's brny allowance for today is used up. It resets at ${reset}.`;
}

// A 429 from the proxy carries the structured allowance body; anything else is a
// transport or provider failure. Shared by every non-2xx path below.
function errorFromResponseBody(body) {
  let parsed = null;
  try { parsed = JSON.parse(body); } catch (_) { /* not JSON */ }
  if (parsed && parsed.code === 'ai_daily_limit') return limitErrorFrom(parsed);
  return new Error(`AI backend error: ${(parsed && parsed.error) || body}`);
}

function limitErrorFrom(parsed) {
  return new AILimitError({
    message: limitErrorMessage(parsed),
    scope: parsed.scope,
    remainingMessages: parsed.remainingMessages,
    poolRemainingMessages: parsed.poolRemainingMessages,
    resetsAt: parsed.resetsAt,
  });
}

function redactMessageContent(content, ctx) {
  if (typeof content === 'string') return redactText(content, ctx);
  if (Array.isArray(content)) {
    return content.map((part) => {
      if (part && typeof part === 'object' && typeof part.text === 'string') {
        return { ...part, text: redactText(part.text, ctx) };
      }
      return part;
    });
  }
  return content;
}

// Low-level provider request. Returns the raw provider payload (choices + usage).
// The edge function owns the host and the model, so there is nothing
// provider-related left for a caller to pass in.
async function requestCompletion(messages) {
  if (isCloudUser()) {
    const { data, error } = await supabase.functions.invoke('relay-copilot', {
      body: { messages },
    });
    if (error) {
      // supabase-js hides the real upstream message on non-2xx; the actual body
      // is on error.context (a Response). Surface it, keeping the structured
      // allowance body intact so a daily cap reads as a cap, not a failure.
      let body = '';
      try {
        if (error.context && typeof error.context.text === 'function') {
          body = await error.context.text();
        }
      } catch (_) { /* keep generic message */ }
      if (body) throw errorFromResponseBody(body);
      throw new Error(`AI backend error: ${error.message || String(error)}`);
    }
    if (data && data.error) {
      if (data.code === 'ai_daily_limit') throw limitErrorFrom(data);
      throw new Error(data.error);
    }
    return data;
  }

  // Local (non-Cloud) workspaces never reach the edge function above and have no
  // key of their own; they run the rule-based local assistant instead.
  throw new Error('brny needs a paid Cloud workspace - sign in to a Cloud account to use the managed AI service.');
}

// Redact -> call -> rehydrate. Returns { content, usage }.
export async function completeChat(messages) {
  const ctx = createRedactionContext();
  const redacted = messages.map((m) => ({ ...m, content: redactMessageContent(m.content, ctx) }));
  const data = await requestCompletion(redacted);
  const raw = data?.choices?.[0]?.message?.content || '';
  return {
    content: rehydrateText(raw, ctx),
    usage: data?.usage || null,
  };
}

// Back-compatible wrapper: returns just the content string.
export async function dispatchChat(messages) {
  const result = await completeChat(messages);
  return result.content;
}
