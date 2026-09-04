// ============================================
// DEPUTY — ROUTINES (auto-triggering Deputy actions)
// ============================================
// A Routine pairs a human-readable trigger with a natural-language instruction
// the Deputy runs whenever that trigger fires. Routines live in the
// `deputyRoutines` store collection so they cloud-sync via Supabase.
//
// trigger shape:
//   { type: 'interval' | 'morning' | 'new_chat',
//     interval?: number,          // for 'interval'
//     unit?: 'minutes' | 'hours' | 'days' }  // for 'interval'
import { store } from '../data/store.js';
import { hasDeputyMax } from './aiTier.js';

const DEFAULT_TITLE = 'New routine';

function genId() {
  return 'routine_' + Date.now() + Math.random().toString(36).substr(2, 9);
}

function normalizeTrigger(t) {
  if (!t || typeof t !== 'object') return { type: 'interval', interval: 1, unit: 'days' };
  const type = t.type === 'morning' || t.type === 'new_chat' ? t.type : 'interval';
  const unit = t.unit === 'minutes' || t.unit === 'hours' ? t.unit : 'days';
  const interval = Math.max(1, Number(t.interval) || 1);
  return { type, interval, unit };
}

function normalizeRoutine(r) {
  return {
    id: r.id,
    title: r.title || DEFAULT_TITLE,
    trigger: normalizeTrigger(r.trigger),
    prompt: r.prompt || '',
    enabled: r.enabled !== false,
    lastRunAt: r.lastRunAt || r.last_run_at || null,
    createdAt: r.createdAt || r.created_at,
    updatedAt: r.updatedAt || r.updated_at,
  };
}

function persistAll(routines) {
  // store.save() defaults companyId/createdAt/updatedAt per record and handles
  // camel↔snake conversion via denormalizeRecord.
  store.save('deputyRoutines', routines);
}

// ── Reads ───────────────────────────────────────────────────────────────
export function getRoutines() {
  if (!hasDeputyMax()) return [];
  const routines = store.getAll('deputyRoutines') || [];
  return routines
    .filter(r => r && r.id)
    .map(normalizeRoutine)
    .sort((a, b) => new Date(b.updatedAt || 0) - new Date(a.updatedAt || 0));
}

export function getRoutine(id) {
  if (!hasDeputyMax()) return null;
  const r = store.getById('deputyRoutines', id);
  return r ? normalizeRoutine(r) : null;
}

// ── Writes ──────────────────────────────────────────────────────────────
export async function createRoutine(spec = {}) {
  const now = new Date().toISOString();
  const trigger = normalizeTrigger(spec.trigger);
  // Interval/morning routines start "armed": record the creation time as the last
  // run so they wait a full cadence before the next timer tick; new_chat routines
  // only fire on the actual new-chat event, so leave lastRunAt null.
  const lastRunAt = spec.lastRunAt || (trigger.type === 'new_chat' ? null : now);
  const routine = {
    id: genId(),
    title: (spec.title && spec.title.trim()) || DEFAULT_TITLE,
    trigger,
    prompt: spec.prompt || '',
    enabled: spec.enabled !== false,
    lastRunAt,
    createdAt: now,
    updatedAt: now,
  };
  const all = store.getAll('deputyRoutines') || [];
  all.push(routine);
  persistAll(all);
  return normalizeRoutine(routine);
}

export async function updateRoutine(id, patch = {}) {
  const all = store.getAll('deputyRoutines') || [];
  const r = all.find(x => x.id === id);
  if (!r) return null;
  if (patch.title !== undefined) r.title = (patch.title && patch.title.trim()) || r.title || DEFAULT_TITLE;
  if (patch.trigger !== undefined) r.trigger = normalizeTrigger(patch.trigger);
  if (patch.prompt !== undefined) r.prompt = patch.prompt || '';
  if (patch.enabled !== undefined) r.enabled = !!patch.enabled;
  if (patch.lastRunAt !== undefined) r.lastRunAt = patch.lastRunAt || null;
  r.updatedAt = new Date().toISOString();
  persistAll(all);
  return normalizeRoutine(r);
}

export async function deleteRoutine(id) {
  const all = store.getAll('deputyRoutines') || [];
  const next = all.filter(r => r.id !== id);
  persistAll(next);
  return all.length !== next.length;
}

// Mark a routine as having just run. Used so interval/morning triggers wait
// their full cadence before firing again.
export async function markRoutineRun(id) {
  return updateRoutine(id, { lastRunAt: new Date().toISOString() });
}

// ── Trigger evaluation ──────────────────────────────────────────────────
const UNIT_MS = { minutes: 60000, hours: 3600000, days: 86400000 };

// Determine whether a routine should fire right now.
// reason distinguishes a normal timer tick from the "on new chat" event.
export function routineIsDue(routine, { now = new Date(), reason = 'timer' } = {}) {
  if (!routine || routine.enabled === false) return false;
  const type = routine.trigger && routine.trigger.type;
  const lastRun = routine.lastRunAt ? new Date(routine.lastRunAt) : null;

  if (type === 'morning') {
    // Once per calendar day (coarse "every morning").
    if (!lastRun) return true;
    return lastRun.toDateString() !== now.toDateString();
  }

  if (type === 'new_chat') {
    // Only fires as a result of a new chat being created.
    return reason === 'new_chat';
  }

  // Default: interval.
  const unit = (routine.trigger && routine.trigger.unit) || 'days';
  const interval = Math.max(1, Number((routine.trigger && routine.trigger.interval) || 1));
  const ms = UNIT_MS[unit] || UNIT_MS.days;
  if (!lastRun) return true; // never run → due now
  return (now.getTime() - lastRun.getTime()) >= interval * ms;
}

// Human-readable trigger summary ("Every 2 days", "Every morning", "On new chat").
export function describeTrigger(trigger) {
  const t = normalizeTrigger(trigger);
  if (t.type === 'interval') {
    let unit = t.unit === 'minutes' ? 'minute' : t.unit === 'hours' ? 'hour' : 'day';
    if (t.interval !== 1) unit += 's';
    return `Every ${t.interval} ${unit}`;
  }
  if (t.type === 'morning') return 'Every morning';
  if (t.type === 'new_chat') return 'On new chat';
  return 'Interval';
}
