/**
 * Mapping between the client's `activity` entries and `activity_log` rows.
 *
 * Writers have historically used different shapes for the same thing — a flat
 * `jobId` / `leadId` key, the generic `recordType` / `recordId` pair, or both —
 * and pages still filter on the flat keys. The row keeps one generic link, and
 * reading it back restores every key a page might look for.
 *
 * DOM-free and store-free so node --test can import it directly.
 */

/** Flat foreign-key name each page already reads on the shared activity log. */
export const LEGACY_ENTITY_KEYS = { lead: 'leadId', job: 'jobId', quote: 'quoteId', invoice: 'invoiceId' };

const emptyToNull = (value) => (value === undefined || value === null || value === '' ? null : value);

/** Which record an entry is about, whichever shape its writer used. */
function recordLink(entry) {
  if (entry.recordType) {
    const legacyKey = LEGACY_ENTITY_KEYS[entry.recordType];
    return {
      recordType: entry.recordType,
      recordId: emptyToNull(entry.recordId) ?? (legacyKey ? emptyToNull(entry[legacyKey]) : null) ?? emptyToNull(entry.entityId),
    };
  }
  for (const [recordType, key] of Object.entries(LEGACY_ENTITY_KEYS)) {
    if (emptyToNull(entry[key]) !== null) return { recordType, recordId: entry[key] };
  }
  return { recordType: null, recordId: emptyToNull(entry.entityId) };
}

/** Client entry -> `activity_log` row (only whitelisted columns). */
export function activityToRow(entry = {}) {
  const { recordType, recordId } = recordLink(entry);
  const now = new Date().toISOString();
  const row = {
    id: String(entry.id),
    type: emptyToNull(entry.type),
    text: emptyToNull(entry.text),
    status: emptyToNull(entry.status),
    record_type: recordType,
    record_id: recordId === null ? null : String(recordId),
    actor_name: emptyToNull(entry.user),
    occurred_at: emptyToNull(entry.timestamp) || emptyToNull(entry.createdAt) || now,
    created_at: emptyToNull(entry.createdAt) || now,
    updated_at: emptyToNull(entry.updatedAt) || now,
  };
  if (entry.companyId !== undefined) row.company_id = entry.companyId;
  return row;
}

/** `activity_log` row -> client entry, with the flat keys pages filter on. */
export function activityFromRow(row = {}) {
  const recordType = row.record_type || null;
  const recordId = row.record_id ?? null;
  const legacyKey = LEGACY_ENTITY_KEYS[recordType];
  return {
    id: row.id,
    companyId: row.company_id,
    type: row.type ?? null,
    text: row.text ?? '',
    status: row.status ?? null,
    recordType,
    recordId,
    entityId: recordId,
    ...(legacyKey && recordId !== null ? { [legacyKey]: recordId } : {}),
    user: row.actor_name ?? null,
    timestamp: row.occurred_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}
