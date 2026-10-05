// ============================================
// RELAY — NOTIFICATION VISIBILITY
// ============================================
// A notification is either raised by a person or emitted by a machine (the
// maintenance / recurring engine, stock auto-reorder, seeded demo data). The
// machine producers stamp `origin: 'system'`; every other notification — a human
// one, a legacy row, or a record synced from a device that predates the field —
// counts as user-raised, so a person's notification is never hidden by accident.
//
// A stored `origin` can be wrong (rows migrated before the machine shapes were
// known were stamped `'user'`), so rows are also recognised from the shapes only
// the machine producers emit — see `isMachineNotification`. A mis-stamped column
// must never be able to strand machine noise in the list.

export const SYSTEM_ORIGIN = 'system';

// Shapes only the machine producers have ever emitted, used to recognise rows that
// predate the `origin` field (or were stamped `'user'` by migration 033, which keyed
// off a `created_by` column the app never wrote). Kept in sync with
// supabase/migrations/035_notifications_origin_backfill.sql.
const MACHINE_TYPES = ['Recurring Job Created', 'Recurring Job Cleanup'];

const MACHINE_TITLES = [
  'Stock Auto-Reorder',
  'Recurring Job Created',
  'Duplicate recurring occurrences removed',
];

const MACHINE_TITLE_PREFIXES = [
  'System Alert - Service Due',
  'Maintenance Due: ',
  'Usage Maintenance Due: ',
];

// The engine writes its plan summary as the body of every "Recurring Job Due" it
// raises. People can pick that same type from the Raise Notification form, so the
// type alone is not enough to call a notification machine noise.
function hasServicePlanBody(notification) {
  return [notification.message, notification.description].some(
    text => typeof text === 'string' && text.trimStart().startsWith('Service Plan:')
  );
}

export function isMachineNotification(notification) {
  if (!notification) return false;
  const { createdBy, type, title } = notification;

  if (createdBy === 'System Engine') return true;
  if (MACHINE_TYPES.includes(type)) return true;
  if (MACHINE_TITLES.includes(title)) return true;
  if (typeof title === 'string' && MACHINE_TITLE_PREFIXES.some(prefix => title.startsWith(prefix))) return true;
  return type === 'Recurring Job Due' && hasServicePlanBody(notification);
}

// The stored `origin` is authoritative, but a row that matches a machine shape is
// hidden too: a person's notification never looks like one, and this keeps the
// toggle honest while the backfill is still being applied to a database.
export function isSystemNotification(notification) {
  return notification?.origin === SYSTEM_ORIGIN || isMachineNotification(notification);
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
