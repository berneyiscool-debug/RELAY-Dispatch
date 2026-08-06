import { test, describe, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert';
import { store } from '../data/store.js';
import { emailSettings } from './email.js';

// Regression cover for the settings.email / settings.mailer collision.
//
// settings.email is the company's business email ADDRESS — a plain string shown
// on invoice PDFs and the customer portal, and written to the companies.email
// text column. An early build of the email feature stored its CONFIG OBJECT at
// that same key, so saving email settings pushed an object into a text column;
// Postgres rejected the update and the whole settings save failed, meaning no
// email configuration ever persisted. Config now lives at settings.mailer.

describe('emailSettings(): which settings key holds the mailer config', () => {
  const original = store.getSettings;
  const withSettings = (s) => { store.getSettings = () => s; };

  beforeEach(() => { store.getSettings = original; });
  afterEach(() => { store.getSettings = original; });

  test('reads the config from settings.mailer', () => {
    withSettings({ email: 'office@acme.com.au', mailer: { fromName: 'Acme', replyTo: 'office@acme.com.au' } });
    assert.strictEqual(emailSettings().fromName, 'Acme');
  });

  test('never mistakes the business email string for config', () => {
    // The critical case: a company with an email address and no mailer config.
    // Returning the string here would make callers read .enabledFor/.branding
    // off a string and silently misbehave.
    withSettings({ email: 'office@acme.com.au' });
    assert.deepStrictEqual(emailSettings(), {});
  });

  test('still reads a legacy config object left at settings.email', () => {
    // Pre-migration data: the object is where the string should be.
    withSettings({ email: { fromName: 'Legacy Co', enabledFor: { quote: false } } });
    assert.strictEqual(emailSettings().fromName, 'Legacy Co');
    assert.strictEqual(emailSettings().enabledFor.quote, false);
  });

  test('prefers settings.mailer when both keys are populated', () => {
    withSettings({
      email: { fromName: 'Stale legacy' },
      mailer: { fromName: 'Current' },
    });
    assert.strictEqual(emailSettings().fromName, 'Current');
  });

  test('handles missing settings without throwing', () => {
    withSettings(null);
    assert.deepStrictEqual(emailSettings(), {});
    withSettings({});
    assert.deepStrictEqual(emailSettings(), {});
  });
});
