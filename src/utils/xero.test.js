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
  xeroInvoiceSyncState,
  xeroHoldsPayment,
  groupInvoiceJobs,
  xeroSyncBadgeHtml,
  xeroInvoiceUrl,
} from './xero.js';
import { escapeHTML } from './security.js';

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

describe('invoice sync state', () => {
  const sent = { id: 'i1', status: 'Sent', total: 110 };

  test('reads queued and failed jobs before the invoice\'s own fields', () => {
    assert.equal(xeroInvoiceSyncState({ ...sent, status: 'Draft' }).state, 'draft');
    assert.equal(xeroInvoiceSyncState(sent, { pending: true, failed: [] }).state, 'pending');
    const failed = xeroInvoiceSyncState({ ...sent, xeroInvoiceId: 'x1' }, { pending: false, failed: [{ id: 3, lastError: 'Invoice # must be unique.' }] });
    assert.deepEqual([failed.state, failed.detail, failed.tone], ['error', 'Invoice # must be unique.', 'danger']);
    assert.equal(xeroInvoiceSyncState({ ...sent, xeroSyncError: 'No Xero sales account' }).state, 'error');
  });

  test('a linked invoice shows Xero\'s view, with any note as a warning', () => {
    assert.deepEqual(
      [xeroInvoiceSyncState({ ...sent, xeroInvoiceId: 'x1', xeroStatus: 'AUTHORISED' }).label, xeroInvoiceSyncState({ ...sent, xeroInvoiceId: 'x1', xeroStatus: 'PAID' }).label],
      ['In Xero', 'Paid in Xero']
    );
    const warn = xeroInvoiceSyncState({ ...sent, xeroInvoiceId: 'x1', xeroStatus: 'VOIDED', xeroSyncError: 'Voided in Xero but not in RELAY.' });
    assert.deepEqual([warn.state, warn.label], ['warning', 'Voided in Xero']);
  });

  test('void invoices never sent show nothing; older sent ones say they are not in Xero', () => {
    assert.equal(xeroInvoiceSyncState({ ...sent, status: 'Void' }).state, 'none');
    assert.equal(xeroInvoiceSyncState(sent).state, 'missing');
  });

  test('every visible state has an icon and words, not colour alone', () => {
    for (const s of [
      xeroInvoiceSyncState(sent, { pending: true, failed: [] }),
      xeroInvoiceSyncState(sent, { pending: false, failed: [{ id: 1, lastError: 'x' }] }),
      xeroInvoiceSyncState({ ...sent, xeroInvoiceId: 'x1' }),
      xeroInvoiceSyncState(sent),
    ]) {
      assert.ok(s.icon && s.label, s.state);
    }
  });

  test('payments held in Xero lock the invoice to Xero', () => {
    assert.equal(xeroHoldsPayment({ ...sent }), false);
    assert.equal(xeroHoldsPayment({ ...sent, xeroInvoiceId: 'x1', xeroAmountDue: 110 }), false);
    assert.equal(xeroHoldsPayment({ ...sent, xeroInvoiceId: 'x1', xeroAmountDue: 60 }), true);
    assert.equal(xeroHoldsPayment({ ...sent, xeroInvoiceId: 'x1', xeroStatus: 'PAID' }), true);
    assert.equal(xeroHoldsPayment({ ...sent, xeroInvoiceId: 'x1', xeroPaymentIds: { balance: 'p' } }), true);
  });

  test('jobs group by invoice; failed and queued are kept apart', () => {
    const grouped = groupInvoiceJobs([
      { id: 9, entity_id: 'i1', status: 'failed', last_error: 'bad' },
      { id: 8, entity_id: 'i1', status: 'pending' },
      { id: 7, entity_id: 'i2', status: 'running' },
    ]);
    assert.deepEqual(grouped.get('i1'), { pending: true, failed: [{ id: 9, lastError: 'bad' }] });
    assert.deepEqual(grouped.get('i2'), { pending: true, failed: [] });
  });

  test('the badge escapes Xero\'s error text and links nothing', () => {
    const html = xeroSyncBadgeHtml(sent, { pending: false, failed: [{ id: 1, lastError: '<img src=x onerror=alert(1)>' }] }, escapeHTML);
    assert.ok(!html.includes('<img'));
    assert.match(html, /Sync failed/);
    assert.equal(xeroSyncBadgeHtml({ ...sent, status: 'Draft' }, undefined, escapeHTML), '<span class="text-tertiary">—</span>');
    assert.match(xeroInvoiceUrl('a b'), /InvoiceID=a%20b$/);
  });
});

describe('store mapping of Xero fields', () => {
  test('xero_* columns map in for display and are never written back', () => {
    const inv = store.normalizeRecord({
      id: 'i1', number: 'INV-1', title: 't', status: 'Sent', line_items: [],
      xero_invoice_id: 'x1', xero_status: 'AUTHORISED', xero_amount_due: '110.00', xero_sync_error: null, xero_payment_ids: {},
    }, 'invoices');
    assert.equal(inv.xeroInvoiceId, 'x1');
    assert.equal(inv.xeroAmountDue, 110);
    assert.ok(!('xero_invoice_id' in inv));
    const out = store.denormalizeRecord(inv, 'invoices');
    assert.ok(!Object.keys(out).some((k) => /xero/i.test(k)), Object.keys(out).join(','));
    const cust = store.normalizeRecord({ id: 'c1', company: 'Acme', xero_contact_id: 'xc' }, 'customers');
    assert.equal(cust.xeroContactId, 'xc');
    assert.ok(!Object.keys(store.denormalizeRecord(cust, 'customers')).some((k) => /xero/i.test(k)));
  });
});
