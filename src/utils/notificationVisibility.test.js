import { test } from 'node:test';
import assert from 'node:assert/strict';

import {
  SYSTEM_ORIGIN,
  isMachineNotification,
  isSystemNotification,
  filterSystemNotifications,
  countByStatus,
  emptyStateMessage,
} from './notificationVisibility.js';

const STATUSES = ['Pending', 'Converted', 'Dismissed'];

const notif = (origin, status = 'Pending', id = origin) => ({ id, origin, status });

test('isSystemNotification trusts an explicit system origin', () => {
  assert.equal(isSystemNotification(notif(SYSTEM_ORIGIN)), true);
  assert.equal(isSystemNotification(notif('user')), false);
  // Legacy / device-synced rows carry no origin and must stay visible.
  assert.equal(isSystemNotification({ id: 'legacy' }), false);
  assert.equal(isSystemNotification({ id: 'x', origin: 'System' }), false);
  assert.equal(isSystemNotification(null), false);
  assert.equal(isSystemNotification(undefined), false);
});

// The exact payloads the machine producers write, minus the origin stamp: a row
// that was mis-classified has to be recognised from its shape alone.
const MAINTENANCE_DUE = {
  type: 'Recurring Job Due',
  title: 'Maintenance Due: Generator - Annual Service',
  description: 'Service Plan: Annual Service\nAsset: Generator (S/N: 4471)',
  message: 'Service Plan: Annual Service\nAsset: Generator (S/N: 4471)',
};
const USAGE_MAINTENANCE_DUE = {
  type: 'Recurring Job Due',
  title: 'Usage Maintenance Due: Generator - 500hr Service',
  description: 'Service Plan: 500hr Service\nAsset: Generator (hrs)',
  message: 'Service Plan: 500hr Service\nAsset: Generator (hrs)',
};
const MERGED_PLAN = {
  type: 'Recurring Job Due',
  title: 'Annual Service (includes Oil Change tasks)',
  description: 'Service Plan: Annual Service (includes Oil Change tasks)\nAsset: Generator',
  message: 'Service Plan: Annual Service (includes Oil Change tasks)\nAsset: Generator',
};

test('isMachineNotification recognises every machine producer shape', () => {
  assert.equal(isMachineNotification({ createdBy: 'System Engine', title: 'Anything at all' }), true);
  assert.equal(isMachineNotification({ title: 'Stock Auto-Reorder' }), true);
  assert.equal(isMachineNotification({ title: 'System Alert - Service Due 2' }), true);
  assert.equal(isMachineNotification({ title: 'Recurring Job Created', type: 'Recurring Job Created' }), true);
  assert.equal(
    isMachineNotification({ title: 'Duplicate recurring occurrences removed', type: 'Recurring Job Cleanup' }),
    true
  );
  assert.equal(isMachineNotification(MAINTENANCE_DUE), true);
  assert.equal(isMachineNotification(USAGE_MAINTENANCE_DUE), true);
  // The merged path titles the notification after the plan it collapsed.
  assert.equal(isMachineNotification(MERGED_PLAN), true);
  assert.equal(isMachineNotification(null), false);
  assert.equal(isMachineNotification(undefined), false);
});

test('isMachineNotification never claims a notification a person raised', () => {
  // The Raise Notification form offers "Recurring Job Due" as a type, so the type
  // on its own must not be enough.
  assert.equal(
    isMachineNotification({
      type: 'Recurring Job Due',
      title: 'Generator making a noise',
      description: 'Customer called it in after the site visit',
      createdBy: 'Dana Tech',
    }),
    false
  );
  // ...and neither must a body that merely mentions a service plan.
  assert.equal(
    isMachineNotification({
      type: 'Recurring Job Due',
      title: 'Check the plan',
      description: 'Please check the Service Plan before you attend',
    }),
    false
  );
  assert.equal(isMachineNotification({ title: 'Quote Accepted', createdBy: 'Dana Tech', quoteId: 'q1' }), false);
  assert.equal(isMachineNotification({ title: 'Maintenance Due', description: 'Just a title' }), false);
  assert.equal(isMachineNotification({ title: 'Customer reported a fault', createdBy: 'System' }), false);
});

test('filterSystemNotifications hides a machine row that was stamped user', () => {
  const list = [
    { id: 's1', origin: 'user', ...MERGED_PLAN },
    notif('user', 'Pending', 'u1'),
  ];

  assert.deepEqual(filterSystemNotifications(list, true).map(n => n.id), ['u1']);
  assert.deepEqual(filterSystemNotifications(list, false).map(n => n.id), ['s1', 'u1']);
});

test('filterSystemNotifications hides only machine-raised rows', () => {
  const list = [
    notif(SYSTEM_ORIGIN, 'Pending', 's1'),
    notif('user', 'Pending', 'u1'),
    { id: 'legacy', status: 'Dismissed' },
  ];

  assert.deepEqual(
    filterSystemNotifications(list, true).map(n => n.id),
    ['u1', 'legacy']
  );
  assert.deepEqual(
    filterSystemNotifications(list, false).map(n => n.id),
    ['s1', 'u1', 'legacy']
  );
});

test('filterSystemNotifications returns the original array when not hiding', () => {
  const list = [notif('user')];
  assert.equal(filterSystemNotifications(list, false), list);
  assert.deepEqual(filterSystemNotifications(null, true), []);
  assert.deepEqual(filterSystemNotifications(undefined, false), []);
});

test('countByStatus counts the list it is given', () => {
  const counts = countByStatus(
    [
      notif('user', 'Pending', 'a'),
      notif(SYSTEM_ORIGIN, 'Converted', 'b'),
      notif('user', 'Converted', 'c'),
      notif('user', 'Dismissed', 'd'),
    ],
    STATUSES
  );
  assert.deepEqual(counts, { all: 4, Pending: 1, Converted: 2, Dismissed: 1 });
});

test('countByStatus drops the system rows when they are filtered out first', () => {
  const all = [notif('user', 'Pending', 'a'), notif(SYSTEM_ORIGIN, 'Pending', 'b')];
  const visible = filterSystemNotifications(all, true);
  assert.deepEqual(countByStatus(visible, STATUSES), {
    all: 1,
    Pending: 1,
    Converted: 0,
    Dismissed: 0,
  });
});

test('countByStatus always reports every requested status', () => {
  assert.deepEqual(countByStatus([], STATUSES), {
    all: 0,
    Pending: 0,
    Converted: 0,
    Dismissed: 0,
  });
});

test('emptyStateMessage explains an empty list caused by hiding system rows', () => {
  assert.equal(emptyStateMessage(true, 3), 'No notifications from your team');
  // Nothing exists at all — hiding system rows is not the reason it's empty.
  assert.equal(emptyStateMessage(true, 0), 'No notifications found');
  assert.equal(emptyStateMessage(false, 3), 'No notifications found');
  assert.equal(emptyStateMessage(false, 0), 'No notifications found');
});
