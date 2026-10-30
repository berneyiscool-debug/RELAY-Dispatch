/**
 * A job's history timeline: status changes, task ticks, contractor assignments.
 *
 * New entries are rows in `job_events` (the `jobEvents` collection), one per
 * entry, so two devices writing to the same job both keep theirs. Older
 * entries still live in the job's own `historyLog`, and some early ones were
 * filed in `activityLog` with type 'system'. Readers merge all three; nothing
 * is copied or rewritten, so opening a job never saves it.
 *
 * DOM-free and store-free so node --test can import it directly.
 */

const time = (entry) => {
  const t = new Date(entry && entry.date).getTime();
  return Number.isNaN(t) ? 0 : t;
};

/** Every history entry for `job`, newest first, each id once. */
export function mergeJobHistory(job, events = []) {
  if (!job) return [];
  const legacy = [
    ...(Array.isArray(job.historyLog) ? job.historyLog : []),
    ...(Array.isArray(job.activityLog) ? job.activityLog.filter(l => l && l.type === 'system') : []),
  ];
  const fresh = (events || []).filter(e => e && e.jobId === job.id && (e.kind || 'history') === 'history');

  const seen = new Set();
  return [...fresh, ...legacy]
    .filter(entry => {
      if (!entry) return false;
      const key = entry.id != null ? String(entry.id) : null;
      if (key === null) return true;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    })
    .sort((a, b) => time(b) - time(a));
}

/** A new `jobEvents` entry for the history timeline. */
export function newHistoryEvent({ id, jobId, action, content, author, payload, date }) {
  return {
    id,
    jobId,
    kind: 'history',
    type: 'system',
    action,
    content,
    payload: payload || {},
    author: author || 'System',
    date: date || new Date().toISOString(),
  };
}
