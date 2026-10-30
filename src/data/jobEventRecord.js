/**
 * Mapping between the client's `jobEvents` entries and `job_events` rows.
 *
 * A client entry has the same shape as the legacy entries in a job's
 * `historyLog` ({ id, type, action, date, author, content }) plus `jobId`,
 * `kind` and `payload`, so the timeline renders old and new entries the same way.
 *
 * DOM-free and store-free so node --test can import it directly.
 */

const emptyToNull = (value) => (value === undefined || value === null || value === '' ? null : value);

/** Client entry -> `job_events` row (only whitelisted columns). */
export function jobEventToRow(entry = {}) {
  const now = new Date().toISOString();
  const payload = entry.payload && typeof entry.payload === 'object' && !Array.isArray(entry.payload)
    ? entry.payload
    : {};
  const row = {
    id: String(entry.id),
    job_id: String(entry.jobId),
    kind: entry.kind || 'history',
    action: emptyToNull(entry.action),
    content: emptyToNull(entry.content),
    payload,
    actor_name: emptyToNull(entry.author),
    occurred_at: emptyToNull(entry.date) || now,
  };
  if (entry.companyId !== undefined) row.company_id = entry.companyId;
  return row;
}

/** `job_events` row -> client entry, shaped like a legacy historyLog entry. */
export function jobEventFromRow(row = {}) {
  return {
    id: row.id,
    companyId: row.company_id,
    jobId: row.job_id,
    kind: row.kind || 'history',
    type: 'system',
    action: row.action ?? null,
    content: row.content ?? '',
    payload: row.payload && typeof row.payload === 'object' ? row.payload : {},
    author: row.actor_name ?? null,
    actorId: row.actor_id ?? null,
    date: row.occurred_at,
    createdAt: row.created_at,
  };
}
