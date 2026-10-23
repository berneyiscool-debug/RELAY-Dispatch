// ============================================
// RELAY — ASSET ↔ JOB LINK
// ============================================
// A job points at one piece of equipment through `job.assetId`. That single
// field is written when the asset is chosen on the job form's Asset tab, and by
// the recurring-maintenance engine for every service job it raises. Reading it
// back in one place keeps the job overview and the asset's history from
// disagreeing about what is linked.

/**
 * When a job counts as having happened: the scheduled day if it has one,
 * otherwise when it was raised. Missing or unparseable values sort last (0)
 * rather than producing NaN comparisons.
 *
 * @param {object} job
 * @returns {number} epoch ms, or 0
 */
export function jobActivityDate(job) {
  const raw = job?.scheduledDate || job?.createdAt || job?.updatedAt;
  const ms = raw ? new Date(raw).getTime() : NaN;
  return Number.isNaN(ms) ? 0 : ms;
}

/**
 * Every job linked to one asset, newest first.
 *
 * @param {object[]} jobs
 * @param {string} assetId
 * @returns {object[]} a new array; the input is not reordered
 */
export function jobsForAsset(jobs, assetId) {
  if (!assetId) return [];
  return (jobs || [])
    .filter((job) => job && job.assetId === assetId)
    .sort((a, b) => jobActivityDate(b) - jobActivityDate(a));
}
