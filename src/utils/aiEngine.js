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
      // is on error.context (a Response). Surface it.
      let detail = error.message || String(error);
      try {
        if (error.context && typeof error.context.text === 'function') {
          const body = await error.context.text();
          if (body) {
            try { detail = JSON.parse(body).error || body; } catch { detail = body; }
          }
        }
      } catch (_) { /* keep generic message */ }
      throw new Error(`AI backend error: ${detail}`);
    }
    if (data && data.error) {
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
