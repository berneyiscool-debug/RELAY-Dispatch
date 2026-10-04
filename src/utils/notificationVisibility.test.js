import { test } from 'node:test';
import assert from 'node:assert/strict';

import {
  SYSTEM_ORIGIN,
  isSystemNotification,
  filterSystemNotifications,
  countByStatus,
  emptyStateMessage,
} from './notificationVisibility.js';

const STATUSES = ['Pending', 'Converted', 'Dismissed'];

const notif = (origin, status = 'Pending', id = origin) => ({ id, origin, status });

test('isSystemNotification only trusts an explicit system origin', () => {
  assert.equal(isSystemNotification(notif(SYSTEM_ORIGIN)), true);
  assert.equal(isSystemNotification(notif('user')), false);
  // Legacy / device-synced rows carry no origin and must stay visible.
  assert.equal(isSystemNotification({ id: 'legacy' }), false);
  assert.equal(isSystemNotification({ id: 'x', origin: 'System' }), false);
  assert.equal(isSystemNotification(null), false);
  assert.equal(isSystemNotification(undefined), false);
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
