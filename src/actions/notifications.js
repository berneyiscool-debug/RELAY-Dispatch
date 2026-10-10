/**
 * Notifications — the in-app notification inbox.
 *
 * A notification is the app's own record of something that needs attention (a
 * field fault, a client request, a safety hazard), not a message to a person.
 * Raised records are written the way the "Raise Notification" drawer writes
 * them, so they land in the inbox with the same defaults.
 */

import { store } from '../data/store.js';
import { defineAction } from './registry.js';
import { resolveOne } from './resolve.js';
import { objectSchema, str, enumOf } from './schema.js';
import { invalidInput, conflict } from './errors.js';
import { logActivity, currentActor } from './context.js';
import { resolveJob } from './jobs.js';

const NOTIFICATION_TYPES = ['Field Fault', 'Client Request', 'Safety Hazard', 'Recurring Job Due', 'Other'];
const NOTIFICATION_PRIORITIES = ['Low', 'Normal', 'High', 'Urgent'];
const NOTIFICATION_STATUSES = ['Pending', 'Converted', 'Dismissed'];

const notificationLabel = (entry) =>
  entry ? `${entry.number || entry.id} ${entry.title || ''}`.trim() : '';

export const notificationSearch = {
  label: notificationLabel,
  searchFields: ['number', 'title', 'description', 'type', 'customerName', 'siteName', 'jobNumber'],
  what: 'notification',
};

/** The notification a reference like "NT-00012" or "the leaking pipe fault" means. */
export function resolveNotification(query) {
  return resolveOne('notifications', query, notificationSearch).record;
}

defineAction({
  name: 'raise_notification',
  title: 'Raise a notification',
  description:
    'Log something that needs following up in the notifications inbox — a field fault, a client request, a safety hazard or a recurring job that is due. Raise one instead of only telling the user, so it is not lost.',
  inputSchema: objectSchema(
    {
      title: str('Short subject, e.g. "Leaking pipe discovered".'),
      description: str('What needs to be rectified, in enough detail to act on.'),
      type: enumOf(NOTIFICATION_TYPES, 'Kind of notification. Defaults to Other.'),
      priority: enumOf(NOTIFICATION_PRIORITIES, 'Defaults to Normal.'),
      job: str('Job it relates to, e.g. "J-02412". Optional.'),
    },
    ['title', 'description']
  ),
  summarize: (input, result) => result.summary,
  run: async ({ title, description, type, priority, job }) => {
    const targetJob = job ? resolveJob(job) : null;
    const actor = currentActor();

    const notification = store.create('notifications', {
      type: type || 'Other',
      title,
      description,
      priority: priority || 'Normal',
      status: 'Pending',
      jobId: targetJob ? targetJob.id : null,
      jobNumber: targetJob ? targetJob.number : '',
      customerId: targetJob ? targetJob.customerId : '',
      customerName: targetJob ? targetJob.customerName : '',
      siteName: targetJob ? targetJob.siteAddress || '' : '',
      read: false,
      createdBy: actor.name || 'Unknown',
      origin: 'system',
      createdAt: new Date().toISOString(),
    });

    logActivity({
      type: 'notification',
      text: `Notification ${notification.number} raised — ${title}`,
      recordType: 'notification',
      recordId: notification.id,
    });

    return {
      summary: `Raised ${notification.number} (${notification.type}, ${notification.priority} priority)${targetJob ? ` against ${targetJob.number}` : ''}.`,
      notification,
      job: targetJob,
    };
  },
});

defineAction({
  name: 'update_notification',
  title: 'Update a notification',
  description: 'Change the type, title, priority or description of a notification that is still Pending.',
  inputSchema: objectSchema(
    {
      notification: str('The notification to change, e.g. "NT-00012".'),
      title: str('Replacement subject.'),
      description: str('Replacement description.'),
      type: enumOf(NOTIFICATION_TYPES, 'Replacement type.'),
      priority: enumOf(NOTIFICATION_PRIORITIES, 'Replacement priority.'),
    },
    ['notification']
  ),
  summarize: (input, result) => result.summary,
  run: async ({ notification, title, description, type, priority }) => {
    const entry = resolveNotification(notification);
    if (entry.status !== 'Pending') {
      throw conflict(`${entry.number} is ${entry.status} — only pending notifications can be edited.`);
    }

    const fields = { title, description, type, priority };
    const updates = {};
    for (const [key, value] of Object.entries(fields)) {
      if (value != null) updates[key] = value;
    }
    if (!Object.keys(updates).length) throw invalidInput('Nothing to change — pass at least one field.');

    store.update('notifications', entry.id, updates);
    const updated = store.getById('notifications', entry.id) || { ...entry, ...updates };

    return {
      summary: `Updated ${updated.number} (${Object.keys(updates).join(', ')}).`,
      notification: updated,
      changed: Object.keys(updates),
    };
  },
});

defineAction({
  name: 'dismiss_notification',
  title: 'Dismiss a notification',
  description: 'Close a notification that needs no further action, marking it Dismissed. Use update_notification, not this, to record that it was dealt with.',
  inputSchema: objectSchema(
    {
      notification: str('The notification to dismiss, e.g. "NT-00012".'),
      reason: str('Why it needs no action — recorded in the activity log.'),
    },
    ['notification']
  ),
  summarize: (input, result) => result.summary,
  run: async ({ notification, reason }) => {
    const entry = resolveNotification(notification);
    if (entry.status === 'Dismissed') {
      return { summary: `${entry.number} was already dismissed.`, notification: entry, changed: false };
    }

    store.update('notifications', entry.id, { status: 'Dismissed' });
    const updated = store.getById('notifications', entry.id) || { ...entry, status: 'Dismissed' };

    logActivity({
      type: 'notification',
      text: `Notification ${updated.number} dismissed${reason ? ` — ${reason}` : ''}`,
      recordType: 'notification',
      recordId: updated.id,
      status: 'Dismissed',
    });

    return {
      summary: `Dismissed ${updated.number} (${updated.title})${reason ? ` — ${reason}` : ''}.`,
      notification: updated,
      changed: true,
    };
  },
});

export { NOTIFICATION_TYPES, NOTIFICATION_PRIORITIES, NOTIFICATION_STATUSES };
