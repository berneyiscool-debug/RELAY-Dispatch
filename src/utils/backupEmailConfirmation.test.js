import { test, describe } from 'node:test';
import assert from 'node:assert';
import { needsBackupEmailConfirmation, backupEmailStatus } from './backupEmailConfirmation.js';

// Users an admin adds from now on cannot sign in until their backup email is
// confirmed; accounts from before it was required are never blocked.

describe('needsBackupEmailConfirmation()', () => {
  test('blocks a required, unconfirmed profile', () => {
    assert.strictEqual(needsBackupEmailConfirmation({ backup_email_confirmation_required: true, backup_email_confirmed_at: null }), true);
  });

  test('lets a confirmed profile through', () => {
    assert.strictEqual(needsBackupEmailConfirmation({ backup_email_confirmation_required: true, backup_email_confirmed_at: '2026-10-28T00:00:00Z' }), false);
  });

  test('never blocks an account from before confirmation was required', () => {
    assert.strictEqual(needsBackupEmailConfirmation({ backup_email_confirmation_required: false, backup_email_confirmed_at: null }), false);
    assert.strictEqual(needsBackupEmailConfirmation({}), false);
    assert.strictEqual(needsBackupEmailConfirmation(null), false);
  });
});

describe('backupEmailStatus()', () => {
  test('reports each state the Users table shows', () => {
    assert.strictEqual(backupEmailStatus({ backupEmail: 'a@b.co', backupEmailConfirmedAt: '2026-10-28T00:00:00Z' }), 'confirmed');
    assert.strictEqual(backupEmailStatus({ backupEmail: 'a@b.co', backupEmailConfirmedAt: null }), 'pending');
    assert.strictEqual(backupEmailStatus({ backupEmail: null }), 'none');
    assert.strictEqual(backupEmailStatus(undefined), 'none');
  });
});
