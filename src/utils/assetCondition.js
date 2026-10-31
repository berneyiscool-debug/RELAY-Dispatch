// ============================================
// RELAY — ASSET CONDITION
// ============================================
// The condition a technician records when they log work on an asset or
// complete a job on it. It lives on the service log entry (asset.logs, which
// is already stored), so an asset's current condition is simply its most
// recent log that recorded one.

import { toDateKey } from './dateUtils.js';

export const ASSET_CONDITIONS = ['Good', 'Fair', 'Poor', 'Unsafe'];

export const CONDITION_BADGES = {
  Good: 'badge-success',
  Fair: 'badge-neutral',
  Poor: 'badge-warning',
  Unsafe: 'badge-danger',
};

/**
 * The asset's latest recorded condition.
 * @returns {{condition: string, notes: string, date: string|null}|null}
 */
export function latestCondition(asset) {
  const withCondition = (asset?.logs || [])
    .map((log, index) => ({ log, index }))
    .filter(({ log }) => ASSET_CONDITIONS.includes(log.condition));
  if (!withCondition.length) return null;
  // Newest date wins; on the same day, the one logged later.
  withCondition.sort((a, b) =>
    String(toDateKey(b.log.date) || '').localeCompare(String(toDateKey(a.log.date) || '')) || b.index - a.index
  );
  const { log } = withCondition[0];
  return { condition: log.condition, notes: log.conditionNotes || '', date: toDateKey(log.date) };
}
