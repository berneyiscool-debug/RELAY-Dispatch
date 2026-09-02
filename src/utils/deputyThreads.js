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
