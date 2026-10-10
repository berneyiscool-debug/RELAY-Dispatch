/**
 * Fuzzy record resolution.
 *
 * "the Wilson job", "Sarah", "Q-00042" all have to land on exactly one record,
 * or the action has to say why it could not. That is the difference between the
 * old regex layer (which failed silently) and this one.
 */

import { store } from '../data/store.js';
import { ambiguousMatch, notFound } from './errors.js';

/** Lowercase, strip punctuation and collapse whitespace so "O'Brien's" == "obriens". */
export function normalizeText(value) {
  return String(value ?? '')
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

function tokens(value) {
  return normalizeText(value).split(' ').filter(Boolean);
}

/**
 * 0..1 relevance score of `query` against one record's searchable text.
 * Exact id/number/name beats a substring, which beats all-words-present.
 */
export function scoreRecord(record, query, searchFields) {
  if (!record) return 0;
  const q = normalizeText(query);
  if (!q) return 0;

  const fields = searchFields && searchFields.length ? searchFields : Object.keys(record);
  const values = fields.map((field) => record[field]).filter((v) => v !== undefined && v !== null);
  const normalized = values.map(normalizeText);
  const haystack = normalized.join(' ');

  if (record.id && String(record.id).toLowerCase() === String(query).toLowerCase()) return 1;
  const qTokens = tokens(query);

  for (const value of normalized) {
    if (value === q) return 0.98;
  }
  for (const value of normalized) {
    if (value.startsWith(q)) return 0.9;
  }
  for (const value of normalized) {
    if (value.includes(q)) return 0.8;
  }
  if (qTokens.length > 1 && qTokens.every((token) => haystack.includes(token))) return 0.65;
  if (qTokens.length === 1 && qTokens.every((token) => tokens(haystack).some((word) => word.startsWith(token)))) {
    return 0.5;
  }
  return 0;
}

/** Scored, descending, above `minScore`. Ties break on most recently updated. */
export function searchCollection(collection, query, { searchFields, filter, minScore = 0.4, limit = 10 } = {}) {
  const rows = (typeof store.getAll === 'function' ? store.getAll(collection) : []) || [];
  return rows
    .filter((row) => (typeof filter === 'function' ? filter(row) : true))
    .map((row) => ({ record: row, score: scoreRecord(row, query, searchFields) }))
    .filter((hit) => hit.score >= minScore)
    .sort((a, b) => b.score - a.score || String(b.record.updatedAt || '').localeCompare(String(a.record.updatedAt || '')))
    .slice(0, limit);
}

function labelOf(record, labelField) {
  if (!record) return 'unknown';
  if (typeof labelField === 'function') return labelField(record);
  const fields = Array.isArray(labelField) ? labelField : [labelField || 'title', 'name', 'number'];
  const parts = fields.map((field) => record[field]).filter((v) => v !== undefined && v !== null && v !== '');
  return parts.length ? parts.join(' ') : String(record.id);
}

/**
 * Resolve a single record.
 *
 * @returns {{ record: object, candidates: object[] }}
 * @throws ActionError `not_found` when nothing matches, `ambiguous` (with an
 *   ask_user-ready `options` list) when more than one record does.
 */
export function resolveOne(collection, query, { label, searchFields, filter, minScore = 0.4, what } = {}) {
  const rows = (store.getAll(collection) || []).filter((row) => (typeof filter === 'function' ? filter(row) : true));

  // An explicit id always wins, even when the row would otherwise score low.
  const byId = query ? rows.find((row) => String(row.id) === String(query)) : null;
  if (byId) return { record: byId, candidates: [byId] };

  const hits = searchCollection(collection, query, { searchFields, filter, minScore, limit: 8 });
  if (!hits.length) throw notFound(what || collection, query);

  const top = hits[0];
  // A clearly better lead score is a confident match; near-ties need a question.
  if (top.score >= 0.9 || hits.length === 1 || top.score - hits[1].score >= 0.15) {
    return { record: top.record, candidates: hits.map((h) => h.record) };
  }

  throw ambiguousMatch(
    what || collection,
    query,
    hits.slice(0, 5).map((hit) => ({ id: hit.record.id, label: labelOf(hit.record, label) }))
  );
}

/** `resolveOne` that tolerates a missing record by returning null. */
export function tryResolveOne(collection, query, options = {}) {
  try {
    return resolveOne(collection, query, options).record;
  } catch {
    return null;
  }
}

export { labelOf };
