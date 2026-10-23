import { test, describe, beforeEach } from 'node:test';
import assert from 'node:assert';

const tab = new Map();
globalThis.sessionStorage = {
  getItem: (k) => (tab.has(k) ? tab.get(k) : null),
  setItem: (k, v) => tab.set(k, String(v)),
  removeItem: (k) => tab.delete(k),
  clear: () => tab.clear(),
};

const {
  TRIAL_WELCOME_KEY,
  markTrialWelcomePending,
  consumeTrialWelcomePending,
  clearTrialWelcomePending,
} = await import('./trialWelcome.js');

describe('Trial welcome marker', () => {
  beforeEach(() => tab.clear());

  test('is empty until a trial is provisioned', () => {
    assert.strictEqual(consumeTrialWelcomePending(), null);
  });

  test('hands the company id over exactly once', () => {
    markTrialWelcomePending('company_1');
    assert.strictEqual(tab.get(TRIAL_WELCOME_KEY), 'company_1');

    assert.strictEqual(consumeTrialWelcomePending(), 'company_1');
    assert.strictEqual(consumeTrialWelcomePending(), null, 'a second login must not replay the welcome');
  });

  test('ignores an empty company id', () => {
    markTrialWelcomePending(null);
    markTrialWelcomePending('');
    assert.strictEqual(consumeTrialWelcomePending(), null);
  });

  test('can be dropped without being shown', () => {
    markTrialWelcomePending('company_2');
    clearTrialWelcomePending();
    assert.strictEqual(consumeTrialWelcomePending(), null);
  });
});
