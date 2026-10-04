// ============================================
// RELAY — NOTIFICATION VISIBILITY
// ============================================
// A notification is either raised by a person or emitted by a machine (the
// maintenance / recurring engine, stock auto-reorder, seeded demo data). The
// machine producers stamp `origin: 'system'`; every other notification — a human
// one, a legacy row, or a record synced from a device that predates the field —
// counts as user-raised, so a person's notification is never hidden by accident.

export const SYSTEM_ORIGIN = 'system';

export function isSystemNotification(notification) {
  return notification?.origin === SYSTEM_ORIGIN;
}

// `hideSystem` is the per-user toggle. Returns the same array when nothing is
// hidden so the common case doesn't copy the (potentially large) list.
export function filterSystemNotifications(notifications, hideSystem) {
  const list = notifications || [];
  return hideSystem ? list.filter(n => !isSystemNotification(n)) : list;
}

// Status counts for the list's filter dropdown, derived from what is actually
// visible so the numbers always agree with the rows on screen.
export function countByStatus(notifications, statuses) {
  const list = notifications || [];
  const counts = { all: list.length };
  statuses.forEach(status => {
    counts[status] = list.filter(n => n.status === status).length;
  });
  return counts;
}

// Empty-state copy for the list. Saying nothing would be confusing when the only
// reason the list is empty is that the machine noise is being hidden.
export function emptyStateMessage(hideSystem, totalCount) {
  return hideSystem && totalCount > 0
    ? 'No notifications from your team'
    : 'No notifications found';
}
