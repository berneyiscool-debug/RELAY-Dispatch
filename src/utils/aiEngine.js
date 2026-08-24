// ============================================
// RELAY — Central AI engine / pipeline
// ============================================
// Single transport for every AI call (Deputy chat, autopilot, RELAY Insights).
// Pipeline: redact PII -> request provider -> rehydrate PII. Returns the full
// completion (content + usage) so callers can observe token usage where needed.
//
// Transport routes the same way the old RelayAssistant.dispatchChat did:
//   cloud   -> Supabase edge function `relay-copilot` (server-side keys)
//   desktop -> Electron secure IPC handler
//   local   -> direct fetch with the user's own API key

import { store } from '../data/store.js';
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
async function requestCompletion(messages, ai, model, endpoint) {
  const ep = endpoint || ai?.endpoint;

  if (isCloudUser()) {
    const { data, error } = await supabase.functions.invoke('relay-copilot', {
      body: { messages, endpoint: ep, model },
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

  if (window.electronAPI && window.electronAPI.callAIAssistant) {
    return await window.electronAPI.callAIAssistant({ messages, endpoint: ep, model });
  }

  const res = await fetch(ep || 'https://api.deepseek.com/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${ai.apiKey}`,
    },
    body: JSON.stringify({ model: model || 'deepseek-chat', messages, temperature: 0.3 }),
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`HTTP ${res.status}: ${body}`);
  }

  return await res.json();
}

// Redact -> call -> rehydrate. Returns { content, usage }.
export async function completeChat(messages, ai, model, endpoint) {
  const ctx = createRedactionContext();
  const redacted = messages.map((m) => ({ ...m, content: redactMessageContent(m.content, ctx) }));
  const data = await requestCompletion(redacted, ai, model, endpoint);
  const raw = data?.choices?.[0]?.message?.content || '';
  return {
    content: rehydrateText(raw, ctx),
    usage: data?.usage || null,
  };
}

// Back-compatible wrapper: returns just the content string.
export async function dispatchChat(messages, ai, model, endpoint) {
  const result = await completeChat(messages, ai, model, endpoint);
  return result.content;
}
