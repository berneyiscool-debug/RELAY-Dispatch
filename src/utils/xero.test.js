import { test, describe, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import { store } from '../data/store.js';
import { FLAGS } from './flags.js';
import {
  normaliseXeroDefaults,
  xeroDefaultsWarnings,
  xeroEnabled,
  xeroReturnMessage,
  xeroSettings,
} from './xero.js';

describe('xeroEnabled(): cloud-only and behind FLAGS.xero', () => {
  const originalCompany = store.companyId;
  const originalFlag = FLAGS.xero;
  afterEach(() => { store.companyId = originalCompany; FLAGS.xero = originalFlag; });

  test('is dark outside the dev build (no import.meta.env under node)', () => {
    assert.equal(originalFlag, false);
  });

  test('needs both the flag and a cloud company', () => {
    FLAGS.xero = true;
    store.companyId = '00000000-0000-0000-0000-00000000000a';
    assert.equal(xeroEnabled(), true);
    store.companyId = 'acct_local';
    assert.equal(xeroEnabled(), false);
    store.companyId = null;
    assert.equal(xeroEnabled(), false);
    FLAGS.xero = false;
    store.companyId = '00000000-0000-0000-0000-00000000000a';
    assert.equal(xeroEnabled(), false);
  });
});

describe('xeroSettings()', () => {
  const original = store.getSettings;
  beforeEach(() => { store.getSettings = original; });
  afterEach(() => { store.getSettings = original; });

  test('reads settings.xero and ignores anything that is not an object', () => {
    store.getSettings = () => ({ xero: { paymentAccountCode: '090' } });
    assert.equal(xeroSettings().paymentAccountCode, '090');
    store.getSettings = () => ({ xero: 'nonsense' });
    assert.deepEqual(xeroSettings(), {});
    store.getSettings = () => null;
    assert.deepEqual(xeroSettings(), {});
  });
});

describe('normaliseXeroDefaults()', () => {
  test('keeps known keys, trims codes and drops blanks so the worker fallbacks apply', () => {
    assert.deepEqual(
      normaliseXeroDefaults({ defaultSalesAccountCode: ' 200 ', labourAccountCode: '', paymentAccountCode: '090', stray: 'x', defaultDueDays: '14' }),
      { defaultSalesAccountCode: '200', paymentAccountCode: '090', defaultDueDays: 14 }
    );
  });

  test('payment terms must be a whole number of days', () => {
    assert.throws(() => normaliseXeroDefaults({ defaultDueDays: '7.5' }), /whole number/);
    assert.throws(() => normaliseXeroDefaults({ defaultDueDays: '-1' }), /whole number/);
    assert.throws(() => normaliseXeroDefaults({ defaultDueDays: '400' }), /whole number/);
    assert.deepEqual(normaliseXeroDefaults({ defaultDueDays: '0' }), { defaultDueDays: 0 });
  });
});

describe('xeroDefaultsWarnings()', () => {
  test('names the two settings sync cannot run without', () => {
    assert.equal(xeroDefaultsWarnings({}).length, 2);
    assert.match(xeroDefaultsWarnings({ paymentAccountCode: '090' })[0], /default sales account/);
    assert.deepEqual(xeroDefaultsWarnings({ defaultSalesAccountCode: '200', paymentAccountCode: '090' }), []);
  });
});

describe('xeroReturnMessage()', () => {
  test('explains every callback outcome and ignores anything else', () => {
    for (const outcome of ['connected', 'choose', 'cancelled', 'no_org', 'unsupported_currency', 'tenant_in_use', 'forbidden', 'error']) {
      const message = xeroReturnMessage(outcome);
      assert.ok(message && message.text, outcome);
      assert.ok(['success', 'info', 'error'].includes(message.type), outcome);
    }
    assert.equal(xeroReturnMessage('connected').type, 'success');
    assert.equal(xeroReturnMessage(null), null);
    assert.equal(xeroReturnMessage('<script>'), null);
  });
});
