// ============================================
// DEPUTY — MULTICHAT THREADS
// ============================================
// Deputy Max multichat: multiple named conversation threads, each with its own
// messages. Threads live in the `deputyThreads` store collection so they
// cloud-sync via Supabase and follow the user across devices.
//
// The pre-Max single `chatHistory` is stored in localStorage under
// `relay_chat_history_<userId>`. `ensureDefaultThread()` migrates that legacy
// history once into a "Main" thread, then removes the old key.
import { store } from '../data/store.js';
import { hasDeputyMax } from './aiTier.js';

const LEGACY_HISTORY_KEY_PREFIX = 'relay_chat_history_';
const DEFAULT_TITLE = 'New chat';

function getUserId() {
  const currentUser = JSON.parse(localStorage.getItem('currentUser') || 'null');
  return currentUser ? currentUser.id : 'default';
}

function legacyHistoryKey() {
  return `${LEGACY_HISTORY_KEY_PREFIX}${getUserId()}`;
}

function genId() {
  return 'thread_' + Date.now() + Math.random().toString(36).substr(2, 9);
}

function normalizeThread(t) {
  return {
    id: t.id,
    title: t.title || DEFAULT_TITLE,
    messages: Array.isArray(t.messages) ? t.messages : [],
    createdAt: t.createdAt || t.created_at,
    updatedAt: t.updatedAt || t.updated_at,
  };
}

// Derive a short, human-friendly title from a thread's first user message so a
// new chat is auto-named from its opening context. Returns null when there is
// no user message yet (e.g. an untouched new chat).
//
// We strip common conversational filler ("lets create a", "can you", "i want", …)
// so titles read as clean labels ("Daily toolbox") rather than full sentences.
const TITLE_FILLER = [
  /^(?:hey|hi|hello|ok|okay|so|now|sure|right|alright|well|thanks|thank\s+you)\b[\s,.]*/i,
  /^(?:can|could|would|will)\s+you\s+/i,
  /^(?:i\s+(?:want|need|would\s+like|need\s+you|want\s+you)\s+(?:you\s+to\s+)?(?:to\s+)?)/i,
  /^(?:lets|let's|let\s+us)\s+/i,
  /^(?:please\s+)?(?:help\s+(?:me\s+)?)?/i,
  /^(?:please\s+)?(?:create|make|set\s+up|build|add|new|start|save|show|give|tell|report|run|check|look\s+(?:at|for)|find|open|pull|fetch|summarise|summarize|notify|remind|send|update)\s+(?:a\s+|an\s+|the\s+)?/i,
];
const TITLE_MAX = 36;

export function deriveThreadTitle(messages) {
  if (!Array.isArray(messages)) return null;
  const firstUser = messages.find(m => m && m.role === 'user' && typeof m.content === 'string' && m.content.trim());
  if (!firstUser) return null;
  let text = firstUser.content.replace(/\s+/g, ' ').trim();
  if (!text) return null;

  const stripped = TITLE_FILLER.reduce((t, re) => t.replace(re, ''), text).trim();
  if (stripped) text = stripped;

  const clean = text.replace(/[.,;:!?]+$/, '').trim();
  const base = clean.charAt(0).toUpperCase() + clean.slice(1);

  if (base.length <= TITLE_MAX) return base;
  const cut = base.slice(0, TITLE_MAX);
  const lastSpace = cut.lastIndexOf(' ');
  const title = (lastSpace > 10 ? cut.slice(0, lastSpace) : base.slice(0, TITLE_MAX)).replace(/[.,;:]+$/, '').trim();
  return title || base;
}

function persistAll(threads) {
  // store.save() defaults companyId/createdAt/updatedAt per record and handles
  // camel↔snake conversion (`companyId`→`company_id`, etc.) via denormalizeRecord.
  store.save('deputyThreads', threads);
}

// ── Reads ───────────────────────────────────────────────────────────────
export function getThreads() {
  if (!hasDeputyMax()) return [];
  const threads = store.getAll('deputyThreads') || [];
  return threads
    .filter(t => t && t.id)
    .map(normalizeThread)
    .sort((a, b) => new Date(b.updatedAt || 0) - new Date(a.updatedAt || 0));
}

export function getThread(id) {
  if (!hasDeputyMax()) return null;
  const t = store.getById('deputyThreads', id);
  return t ? normalizeThread(t) : null;
}

// ── Writes ──────────────────────────────────────────────────────────────
export async function createThread(title = DEFAULT_TITLE, seedMessages = []) {
  const now = new Date().toISOString();
  const thread = {
    id: genId(),
    title: title || DEFAULT_TITLE,
    messages: seedMessages && Array.isArray(seedMessages) ? seedMessages : [],
    createdAt: now,
    updatedAt: now,
  };
  const all = store.getAll('deputyThreads') || [];
  all.push(thread);
  persistAll(all);
  return normalizeThread(thread);
}

export async function renameThread(id, title) {
  const all = store.getAll('deputyThreads') || [];
  const t = all.find(x => x.id === id);
  if (!t) return null;
  t.title = (title && title.trim()) || t.title || DEFAULT_TITLE;
  t.updatedAt = new Date().toISOString();
  persistAll(all);
  return normalizeThread(t);
}

export async function deleteThread(id) {
  const all = store.getAll('deputyThreads') || [];
  const next = all.filter(t => t.id !== id);
  persistAll(next);
  return all.length !== next.length;
}

export async function appendMessage(threadId, role, content) {
  const all = store.getAll('deputyThreads') || [];
  const t = all.find(x => x.id === threadId);
  if (!t) return null;
  if (!Array.isArray(t.messages)) t.messages = [];
  t.messages.push({ role, content });
  t.updatedAt = new Date().toISOString();
  persistAll(all);
  return normalizeThread(t);
}

// Replace the whole message list in one write (used when persisting a trimmed
// history or clearing a thread).
export async function setThreadMessages(threadId, messages) {
  const all = store.getAll('deputyThreads') || [];
  const t = all.find(x => x.id === threadId);
  if (!t) return null;
  t.messages = Array.isArray(messages) ? messages : [];
  t.updatedAt = new Date().toISOString();
  persistAll(all);
  return normalizeThread(t);
}

export async function clearThreadMessages(id) {
  return setThreadMessages(id, []);
}

// ── Default thread + legacy migration ───────────────────────────────────
// If no threads exist and a legacy single-history exists, seed a "Main" thread
// from it and remove the legacy key. Otherwise ensure at least one thread exists.
export async function ensureDefaultThread() {
  if (!hasDeputyMax()) return null;

  const existing = store.getAll('deputyThreads') || [];
  if (existing.length > 0) {
    return normalizeThread(existing.find(t => t && t.id) || existing[0]);
  }

  let seed = [];
  try {
    const raw = localStorage.getItem(legacyHistoryKey());
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) seed = parsed;
    }
  } catch (e) {
    console.error('Failed to read legacy chat history', e);
  }

  let created;
  if (seed.length > 0) {
    created = await createThread('Main', seed);
    try {
      localStorage.removeItem(legacyHistoryKey());
    } catch (e) {
      console.error('Failed to remove legacy chat history', e);
    }
  } else {
    created = await createThread('Main');
  }
  return created;
}
