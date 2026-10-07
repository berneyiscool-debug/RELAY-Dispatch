/**
 * Lead activity log - the pure half of the lead detail page's Activity tab.
 *
 * The log lives as an `activityLog` array ON the lead record (the same shape
 * the jobs page uses for job.activityLog) so it travels with store.update()
 * and through the cloud column whitelist instead of the cache-only 'activity'
 * collection, which has no object store and no table.
 *
 * DOM-free on purpose - this module is imported directly by node --test, so it
 * only transforms plain data. The markup builders stay in LeadDetail.js.
 */

/** Content longer than this (or more images than the cap) renders collapsed. */
export const ACTIVITY_PREVIEW_LENGTH = 400;
export const ACTIVITY_PREVIEW_IMAGES = 4;

const FALLBACK_AUTHOR = 'Unknown User';

/** Milliseconds for a date string, or 0 so sorting never sees NaN. */
function timeOf(entry) {
  const time = new Date((entry && entry.date) || '').getTime();
  return Number.isFinite(time) ? time : 0;
}

/**
 * Coerce anything stored on a lead into the canonical entry shape, newest
 * first. Tolerates the null / legacy / hand-edited values a record can carry.
 * Never mutates the input array or its entries.
 */
export function normalizeLeadActivityLog(log) {
  if (!Array.isArray(log)) return [];

  return log
    .filter((entry) => entry && typeof entry === 'object')
    .map((entry, index) => ({
      id: (typeof entry.id === 'string' && entry.id) || `lead_activity_legacy_${index}`,
      content: typeof entry.content === 'string' ? entry.content : '',
      files: Array.isArray(entry.files) ? entry.files.filter((file) => file && typeof file === 'object') : [],
      date: typeof entry.date === 'string' ? entry.date : '',
      author: typeof entry.author === 'string' && entry.author ? entry.author : FALLBACK_AUTHOR,
    }))
    .sort((a, b) => timeOf(b) - timeOf(a));
}

/**
 * Shape one new entry. `content` is trimmed because the composer posts the raw
 * textarea value; callers that need a stable id / date (tests, imports) can
 * inject both.
 */
export function buildLeadActivityEntry({ content = '', files = [], author } = {}, { id, date } = {}) {
  return {
    id: id || `lead_activity_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`,
    content: String(content).trim(),
    files: Array.isArray(files) ? files.slice() : [],
    date: date || new Date().toISOString(),
    author: author || FALLBACK_AUTHOR,
  };
}

/** Newest entry first - the feed is a reverse-chronological log. */
export function addLeadActivityEntry(log, entry) {
  if (!entry || typeof entry !== 'object') return normalizeLeadActivityLog(log);
  return [entry, ...normalizeLeadActivityLog(log)];
}

/** Returns a new log without `entryId`; a missing id leaves the log intact. */
export function removeLeadActivityEntry(log, entryId) {
  return normalizeLeadActivityLog(log).filter((entry) => entry.id !== entryId);
}

/**
 * Whether the feed should offer an expand toggle. Deterministic (content length
 * and file count) rather than a post-render height probe, so the markup is
 * correct on the first paint and in a headless snapshot.
 */
export function shouldCollapseLeadActivity(entry) {
  const content = (entry && entry.content) || '';
  const files = (entry && entry.files) || [];
  return content.length > ACTIVITY_PREVIEW_LENGTH || files.length > ACTIVITY_PREVIEW_IMAGES;
}

export function isLeadActivityImage(file) {
  return !!file && typeof file.type === 'string' && file.type.startsWith('image/');
}

/** Human-readable attachment size - falls back to "0 B" for junk input. */
export function leadActivityFileSize(bytes) {
  const size = Number(bytes) || 0;
  if (size < 1024) return `${Math.round(size)} B`;
  if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} KB`;
  return `${(size / (1024 * 1024)).toFixed(1)} MB`;
}

/** Up to two initials for the feed avatar; never returns an empty string. */
export function leadActivityInitials(author) {
  const words = String(author || '').trim().split(/\s+/).filter(Boolean);
  if (words.length === 0) return '?';
  const initials = words.slice(0, 2).map((word) => word[0]).join('');
  return initials.toUpperCase() || '?';
}
