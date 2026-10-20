/**
 * Tests for the relay-xero-sync job logic with an in-memory database and a
 * scripted fake Xero: contacts are found before they're created, invoices are
 * never duplicated or pushed over someone else's, permanent errors stop and
 * show on the invoice, and rate limits / revoked access put work back in the
 * queue instead of burning retries.
 *
 * Run with: npm run test:migrations
 */
import { describe, test } from 'node:test';
import assert from 'node:assert/strict';
import { XeroError } from '../functions/_xero/client.js';
import { invoiceSourceUrl } from '../functions/_xero/mapping.js';
import { MAX_ATTEMPTS, WORKER_ACTIONS, backoffSeconds, classifyError, runJobs } from '../functions/_xero/worker.js';

const NOW = new Date('2026-10-20T00:00:00.000Z');
const COMPANY = 'company-a';
const SETTINGS = { defaultSalesAccountCode: '200', labourAccountCode: '210', materialsAccountCode: '220', paymentAccountCode: '090' };

function seed(overrides = {}) {
  return {
    invoices: {
      'inv-1': {
        id: 'inv-1', company_id: COMPANY, number: 'INV-1001', title: 'Hot water', status: 'Sent', customer_id: 'cust-1', job_id: 'job-1',
        subtotal: 300, tax: 30, total: 330, due_date: '2026-11-19', created_at: '2026-10-19T23:30:00Z', updated_at: '2026-10-20T00:00:00Z',
        line_items: { sections: [{ lineItems: [{ description: 'Labour', type: 'labor', qty: 2, rate: 100 }, { description: 'Valve', type: 'material', qty: 1, rate: 100 }] }], jobNumbers: ['J-42'] },
        xero_invoice_id: null, xero_status: null, xero_amount_due: null, xero_payment_ids: {},
      },
      ...(overrides.invoices || {}),
    },
    customers: {
      'cust-1': { id: 'cust-1', company_id: COMPANY, company: 'Acme Pty Ltd', email: 'a@acme.test', updated_at: '2026-10-01T00:00:00Z', xero_contact_id: null },
      ...(overrides.customers || {}),
    },
    jobs: [{ id: 'job-1', company_id: COMPANY, number: 'J-42', cost_center_id: null }],
    costCenters: [],
    settings: overrides.settings || SETTINGS,
  };
}

function fakeDb(data) {
  const finished = {};
  const connection = {};
  return {
    data, finished, connection,
    getInvoice: async (id) => (data.invoices[id] ? structuredClone(data.invoices[id]) : null),
    getCustomer: async (id) => (data.customers[id] ? structuredClone(data.customers[id]) : null),
    getJobs: async (companyId, ids) => data.jobs.filter((j) => j.company_id === companyId && ids.includes(j.id)),
    getCostCenters: async () => data.costCenters,
    getXeroSettings: async () => data.settings,
    updateInvoice: async (id, fields) => { Object.assign(data.invoices[id], fields); },
    updateCustomer: async (id, fields) => { Object.assign(data.customers[id], fields); },
    finishJob: async (id, fields) => { finished[id] = fields; },
    markConnection: async (companyId, fields) => { Object.assign(connection, fields); },
  };
}

/** Routes requests to handlers keyed "METHOD /path"; records every call. */
function fakeXero(routes) {
  const calls = [];
  return {
    calls,
    request: async (method, path, options = {}) => {
      calls.push({ method, path, ...options });
      const handler = routes[`${method} ${path}`];
      if (!handler) throw new Error(`Unexpected Xero call ${method} ${path}`);
      return { status: 200, data: await handler(options, calls) };
    },
  };
}

const job = (id, entity, action, entityId, attempts = 1) => ({ id, company_id: COMPANY, entity, entity_id: entityId, action, status: 'running', attempts });
const run = (db, xero, jobs, extra = {}) => runJobs({ jobs, db, xeroFor: async () => xero, now: () => NOW, ...extra });

const createdInvoice = (body, overrides = {}) => ({
  Invoices: [{ InvoiceID: body.Invoices[0].InvoiceID || 'xi-new', Status: 'AUTHORISED', Total: 330, AmountDue: 330, ...overrides }],
});

describe('invoice upsert', () => {
  test('creates the contact, then the invoice, and records both links', async () => {
    const db = fakeDb(seed());
    const xero = fakeXero({
      'GET /Contacts': () => ({ Contacts: [] }),
      'POST /Contacts': ({ body }) => ({ Contacts: [{ ...body.Contacts[0], ContactID: 'xc-1' }] }),
      'GET /Invoices': () => ({ Invoices: [] }),
      'POST /Invoices': ({ body }) => createdInvoice(body),
    });
    const summary = await run(db, xero, [job(1, 'invoice', 'upsert', 'inv-1')]);
    assert.deepEqual(summary, { done: 1, skipped: 0, failed: 0, retried: 0, released: 0, paced: 0 });
    assert.equal(db.data.customers['cust-1'].xero_contact_id, 'xc-1');
    const inv = db.data.invoices['inv-1'];
    assert.equal(inv.xero_invoice_id, 'xi-new');
    assert.equal(inv.xero_status, 'AUTHORISED');
    assert.equal(inv.xero_sync_error, null);
    assert.equal(db.finished[1].status, 'done');

    // Three contact lookups (number, email, name), then create.
    assert.deepEqual(xero.calls.filter((c) => c.path === '/Contacts').map((c) => c.method), ['GET', 'GET', 'GET', 'POST']);
    const post = xero.calls.find((c) => c.method === 'POST' && c.path === '/Invoices');
    assert.equal(post.body.Invoices[0].Contact.ContactID, 'xc-1');
    assert.equal(post.body.Invoices[0].Url, invoiceSourceUrl('inv-1'));
    assert.equal(post.query.unitdp, 4);
    assert.match(post.idempotencyKey, /^relay-inv-inv-1-/);
  });

  test('links an existing Xero contact found by email instead of creating one', async () => {
    const db = fakeDb(seed());
    const xero = fakeXero({
      'GET /Contacts': ({ query }) => ({ Contacts: query.where.startsWith('EmailAddress') ? [{ ContactID: 'xc-existing', Name: 'Acme', EmailAddress: 'a@acme.test' }] : [] }),
      'GET /Invoices': () => ({ Invoices: [] }),
      'POST /Invoices': ({ body }) => createdInvoice(body),
    });
    await run(db, xero, [job(1, 'invoice', 'upsert', 'inv-1')]);
    assert.equal(db.data.customers['cust-1'].xero_contact_id, 'xc-existing');
    assert.ok(!xero.calls.some((c) => c.method === 'POST' && c.path === '/Contacts'));
    // Stops looking once matched: every read counts towards the Xero data allowance.
    assert.equal(xero.calls.filter((c) => c.path === '/Contacts').length, 2);
  });

  test('a name taken by a different contact creates a suffixed contact', async () => {
    const db = fakeDb(seed());
    const xero = fakeXero({
      'GET /Contacts': ({ query }) => ({ Contacts: query.where.startsWith('Name') ? [{ ContactID: 'xc-other', Name: 'Acme Pty Ltd', EmailAddress: 'someone@else.test' }] : [] }),
      'POST /Contacts': ({ body }) => ({ Contacts: [{ ContactID: 'xc-2', Name: body.Contacts[0].Name }] }),
      'GET /Invoices': () => ({ Invoices: [] }),
      'POST /Invoices': ({ body }) => createdInvoice(body),
    });
    await run(db, xero, [job(1, 'invoice', 'upsert', 'inv-1')]);
    assert.equal(xero.calls.find((c) => c.method === 'POST' && c.path === '/Contacts').body.Contacts[0].Name, 'Acme Pty Ltd (RELAY)');
  });

  test('adopts an invoice RELAY already created in Xero instead of duplicating it', async () => {
    const db = fakeDb(seed({ customers: { 'cust-1': { id: 'cust-1', company_id: COMPANY, company: 'Acme', xero_contact_id: 'xc-1' } } }));
    const xero = fakeXero({
      'GET /Invoices': () => ({ Invoices: [{ InvoiceID: 'xi-lost', Type: 'ACCREC', Status: 'AUTHORISED', Url: invoiceSourceUrl('inv-1') }] }),
      'POST /Invoices': ({ body }) => createdInvoice(body),
    });
    await run(db, xero, [job(1, 'invoice', 'upsert', 'inv-1')]);
    assert.equal(xero.calls.at(-1).body.Invoices[0].InvoiceID, 'xi-lost');
    assert.equal(db.data.invoices['inv-1'].xero_invoice_id, 'xi-lost');
  });

  test('never adopts someone else\'s invoice that happens to share the number', async () => {
    const db = fakeDb(seed({ customers: { 'cust-1': { id: 'cust-1', company_id: COMPANY, company: 'Acme', xero_contact_id: 'xc-1' } } }));
    const xero = fakeXero({
      'GET /Invoices': () => ({ Invoices: [{ InvoiceID: 'xi-theirs', Type: 'ACCREC', Status: 'AUTHORISED', Url: '' }] }),
      'POST /Invoices': () => { throw new XeroError('validation', 'Invoice # must be unique.'); },
    });
    const summary = await run(db, xero, [job(1, 'invoice', 'upsert', 'inv-1')]);
    assert.equal(summary.failed, 1);
    assert.equal(xero.calls.at(-1).body.Invoices[0].InvoiceID, undefined);
    assert.equal(db.data.invoices['inv-1'].xero_sync_error, 'Invoice # must be unique.');
    assert.equal(db.finished[1].status, 'failed');
  });

  test('an already-linked invoice is updated in place without lookups', async () => {
    const db = fakeDb(seed({
      invoices: { 'inv-1': { ...seed().invoices['inv-1'], xero_invoice_id: 'xi-1', xero_status: 'AUTHORISED', xero_amount_due: 330 } },
      customers: { 'cust-1': { id: 'cust-1', company_id: COMPANY, company: 'Acme', xero_contact_id: 'xc-1' } },
    }));
    const xero = fakeXero({ 'POST /Invoices': ({ body }) => createdInvoice(body) });
    await run(db, xero, [job(1, 'invoice', 'upsert', 'inv-1')]);
    assert.deepEqual(xero.calls.map((c) => `${c.method} ${c.path}`), ['POST /Invoices']);
    assert.equal(xero.calls[0].body.Invoices[0].InvoiceID, 'xi-1');
  });

  test('a total that Xero calculates differently is flagged on the invoice', async () => {
    const db = fakeDb(seed({ customers: { 'cust-1': { id: 'cust-1', company_id: COMPANY, company: 'Acme', xero_contact_id: 'xc-1' } } }));
    const xero = fakeXero({
      'GET /Invoices': () => ({ Invoices: [] }),
      'POST /Invoices': ({ body }) => createdInvoice(body, { Total: 335 }),
    });
    await run(db, xero, [job(1, 'invoice', 'upsert', 'inv-1')]);
    assert.match(db.data.invoices['inv-1'].xero_sync_error, /differs from RELAY/);
    assert.equal(db.finished[1].status, 'done');
  });

  test('a cent of GST rounding is noted on the job, not shown as an error', async () => {
    const db = fakeDb(seed({ customers: { 'cust-1': { id: 'cust-1', company_id: COMPANY, company: 'Acme', xero_contact_id: 'xc-1' } } }));
    const xero = fakeXero({
      'GET /Invoices': () => ({ Invoices: [] }),
      'POST /Invoices': ({ body }) => createdInvoice(body, { Total: 330.01 }),
    });
    await run(db, xero, [job(1, 'invoice', 'upsert', 'inv-1')]);
    assert.equal(db.data.invoices['inv-1'].xero_sync_error, null);
    assert.match(db.finished[1].last_error, /rounded the total by 0.01/);
  });

  test('missing account setup fails with an actionable message and makes no invoice call', async () => {
    const db = fakeDb(seed({ settings: {}, customers: { 'cust-1': { id: 'cust-1', company_id: COMPANY, company: 'Acme', xero_contact_id: 'xc-1' } } }));
    const xero = fakeXero({ 'GET /Invoices': () => ({ Invoices: [] }) });
    const summary = await run(db, xero, [job(1, 'invoice', 'upsert', 'inv-1')]);
    assert.equal(summary.failed, 1);
    assert.match(db.data.invoices['inv-1'].xero_sync_error, /No Xero sales account/);
    assert.ok(!xero.calls.some((c) => c.method === 'POST'));
  });

  test('an invoice with no customer fails clearly', async () => {
    const db = fakeDb(seed({ invoices: { 'inv-1': { ...seed().invoices['inv-1'], customer_id: null } } }));
    await run(db, fakeXero({}), [job(1, 'invoice', 'upsert', 'inv-1')]);
    assert.match(db.data.invoices['inv-1'].xero_sync_error, /Link this invoice to a customer/);
  });

  test('skips invoices that went back to draft, were voided, deleted, or that Xero now owns', async () => {
    const base = seed().invoices['inv-1'];
    const db = fakeDb(seed({
      invoices: {
        'inv-draft': { ...base, id: 'inv-draft', status: 'Draft' },
        'inv-void': { ...base, id: 'inv-void', status: 'Void' },
        'inv-paid-in-xero': { ...base, id: 'inv-paid-in-xero', xero_invoice_id: 'xi-9', xero_status: 'PAID' },
        'inv-part-paid': { ...base, id: 'inv-part-paid', xero_invoice_id: 'xi-8', xero_status: 'AUTHORISED', xero_amount_due: 100 },
      },
    }));
    const summary = await run(db, fakeXero({}), [
      job(1, 'invoice', 'upsert', 'inv-draft'), job(2, 'invoice', 'upsert', 'inv-void'),
      job(3, 'invoice', 'upsert', 'inv-gone'), job(4, 'invoice', 'upsert', 'inv-paid-in-xero'),
      job(5, 'invoice', 'upsert', 'inv-part-paid'),
    ]);
    assert.equal(summary.skipped, 5);
    assert.match(db.finished[4].last_error, /Xero owns/);
  });
});

describe('invoice void', () => {
  const voided = (extra = {}) => seed({ invoices: { 'inv-1': { ...seed().invoices['inv-1'], status: 'Void', xero_invoice_id: 'xi-1', ...extra } } });

  test('voids the Xero invoice', async () => {
    const db = fakeDb(voided());
    const xero = fakeXero({ 'POST /Invoices/xi-1': () => ({ Invoices: [{ InvoiceID: 'xi-1', Status: 'VOIDED' }] }) });
    await run(db, xero, [job(1, 'invoice', 'void', 'inv-1')]);
    assert.deepEqual(xero.calls[0].body, { Invoices: [{ InvoiceID: 'xi-1', Status: 'VOIDED' }] });
    assert.equal(db.data.invoices['inv-1'].xero_status, 'VOIDED');
  });

  test('explains when Xero refuses because of payments', async () => {
    const db = fakeDb(voided());
    const xero = fakeXero({ 'POST /Invoices/xi-1': () => { throw new XeroError('validation', 'Payments have been made against this invoice.'); } });
    const summary = await run(db, xero, [job(1, 'invoice', 'void', 'inv-1')]);
    assert.equal(summary.failed, 1);
    assert.match(db.data.invoices['inv-1'].xero_sync_error, /remove them there first, or void it in Xero/);
  });

  test('skips an invoice un-voided since, or never sent to Xero', async () => {
    const db = fakeDb(seed({ invoices: { 'inv-2': { ...seed().invoices['inv-1'], id: 'inv-2', status: 'Void' }, 'inv-3': { ...seed().invoices['inv-1'], id: 'inv-3', xero_invoice_id: 'xi-3' } } }));
    const summary = await run(db, fakeXero({}), [job(1, 'invoice', 'void', 'inv-2'), job(2, 'invoice', 'void', 'inv-3')]);
    assert.equal(summary.skipped, 2);
  });
});

describe('payments to Xero', () => {
  const paid = (extra = {}) => seed({
    invoices: {
      'inv-1': {
        ...seed().invoices['inv-1'], status: 'Paid', paid_date: '2026-10-21', payment_method: 'Bank Transfer',
        xero_invoice_id: 'xi-1', xero_status: 'AUTHORISED', xero_amount_due: 330, ...extra,
      },
    },
  });
  const paymentRoute = (overrides = {}) => ({
    'PUT /Payments': ({ body }) => ({
      Payments: [{ PaymentID: `xp-${body.Payments[0].Amount}`, Invoice: { InvoiceID: 'xi-1', Status: 'PAID', AmountDue: 0 }, ...overrides }],
    }),
  });

  test('a manually marked-paid invoice becomes one Xero payment, recorded once', async () => {
    const db = fakeDb(paid());
    const xero = fakeXero(paymentRoute());
    await run(db, xero, [job(1, 'invoice', 'pay', 'inv-1')]);
    const put = xero.calls[0];
    assert.deepEqual(put.body.Payments[0], { Invoice: { InvoiceID: 'xi-1' }, Account: { Code: '090' }, Date: '2026-10-21', Amount: 330, Reference: 'Bank Transfer' });
    assert.equal(put.idempotencyKey, 'relay-pay-inv-1-balance');
    const inv = db.data.invoices['inv-1'];
    assert.deepEqual(inv.xero_payment_ids, { balance: 'xp-330' });
    assert.equal(inv.xero_status, 'PAID');
    assert.equal(inv.xero_amount_due, 0);

    // Running the job again sends nothing.
    const again = fakeXero(paymentRoute());
    const summary = await run(db, again, [job(2, 'invoice', 'pay', 'inv-1')]);
    assert.equal(again.calls.length, 0);
    assert.equal(summary.skipped, 1);
  });

  test('part-payments go one by one and each is saved as soon as Xero accepts it', async () => {
    const data = paid();
    data.invoices['inv-1'].line_items.payments = [
      { id: 'pay-a', amount: 100, date: '2026-10-10', method: 'Cash' },
      { id: 'pay-b', amount: 50, date: '2026-10-12', method: 'Cash' },
    ];
    const db = fakeDb(data);
    let n = 0;
    const xero = fakeXero({
      'PUT /Payments': ({ body }) => {
        if (++n === 2) throw new XeroError('server', 'Xero HTTP 503');
        return { Payments: [{ PaymentID: `xp-${body.Payments[0].Amount}` }] };
      },
    });
    const summary = await run(db, xero, [job(1, 'invoice', 'pay', 'inv-1')]);
    assert.equal(summary.retried, 1);
    assert.deepEqual(db.data.invoices['inv-1'].xero_payment_ids, { 'p:pay-a': 'xp-100' });

    // The retry sends only what is left: the second part-payment and the balance.
    const retry = fakeXero(paymentRoute());
    await run(db, retry, [job(1, 'invoice', 'pay', 'inv-1', 2)]);
    assert.deepEqual(retry.calls.map((c) => c.body.Payments[0].Amount), [50, 180]);
    assert.deepEqual(Object.keys(db.data.invoices['inv-1'].xero_payment_ids), ['p:pay-a', 'p:pay-b', 'balance']);
  });

  test('a Stripe payment goes to the Stripe account, keyed by its session', async () => {
    const db = fakeDb(paid({ payment_method: 'Stripe (online)', stripe_session_id: 'cs_1' }));
    db.data.settings = { ...SETTINGS, stripeAccountCode: '091' };
    const xero = fakeXero(paymentRoute());
    await run(db, xero, [job(1, 'invoice', 'pay', 'inv-1')]);
    assert.equal(xero.calls[0].body.Payments[0].Account.Code, '091');
    assert.equal(xero.calls[0].idempotencyKey, 'relay-pay-inv-1-stripe:cs_1');
  });

  test('waits (with backoff) while the invoice itself has not reached Xero', async () => {
    const db = fakeDb(paid({ xero_invoice_id: null }));
    const summary = await run(db, fakeXero({}), [job(1, 'invoice', 'pay', 'inv-1')]);
    assert.equal(summary.retried, 1);
    assert.match(db.finished[1].last_error, /reach Xero first/);
  });

  test('skips invoices already paid in Xero or voided', async () => {
    const data = paid({ xero_status: 'PAID' });
    data.invoices['inv-2'] = { ...data.invoices['inv-1'], id: 'inv-2', status: 'Void', xero_status: 'AUTHORISED' };
    const summary = await run(fakeDb(data), fakeXero({}), [job(1, 'invoice', 'pay', 'inv-1'), job(2, 'invoice', 'pay', 'inv-2')]);
    assert.equal(summary.skipped, 2);
  });

  test('Xero refusing an over-payment fails the job and says why on the invoice', async () => {
    const db = fakeDb(paid());
    const xero = fakeXero({ 'PUT /Payments': () => { throw new XeroError('validation', 'Payment amount exceeds the amount outstanding on this document'); } });
    const summary = await run(db, xero, [job(1, 'invoice', 'pay', 'inv-1')]);
    assert.equal(summary.failed, 1);
    assert.match(db.data.invoices['inv-1'].xero_sync_error, /exceeds the amount outstanding/);
  });

  test('no payment account configured fails with the setting to fix', async () => {
    const db = fakeDb(paid());
    db.data.settings = { defaultSalesAccountCode: '200' };
    await run(db, fakeXero({}), [job(1, 'invoice', 'pay', 'inv-1')]);
    assert.match(db.data.invoices['inv-1'].xero_sync_error, /account payments are received into/);
  });
});

describe('pulls from Xero (webhook)', () => {
  function pullDb() {
    const db = fakeDb(seed());
    db.pulls = [];
    db.applyInvoicePull = async (companyId, xeroId, state) => {
      db.pulls.push({ companyId, xeroId, ...state });
      return xeroId === 'xi-1' ? 'inv-1' : null;
    };
    return db;
  }

  test('applies the paid status and date Xero reports', async () => {
    const db = pullDb();
    const xero = fakeXero({
      'GET /Invoices/xi-1': () => ({ Invoices: [{ InvoiceID: 'xi-1', Status: 'PAID', AmountDue: 0, FullyPaidOnDate: '/Date(1760918400000+0000)/' }] }),
    });
    const summary = await run(db, xero, [job(1, 'xero_invoice', 'refresh', 'xi-1')]);
    assert.equal(summary.done, 1);
    assert.deepEqual(db.pulls, [{ companyId: COMPANY, xeroId: 'xi-1', status: 'PAID', amountDue: 0, paidDate: '2025-10-20' }]);
  });

  test('an invoice deleted from Xero, or not RELAY\'s, is skipped', async () => {
    const db = pullDb();
    const xero = fakeXero({
      'GET /Invoices/xi-gone': () => { throw new XeroError('not_found', 'Record not found in Xero'); },
      'GET /Invoices/xi-other': () => ({ Invoices: [{ InvoiceID: 'xi-other', Status: 'AUTHORISED', AmountDue: 5 }] }),
    });
    const summary = await run(db, xero, [job(1, 'xero_invoice', 'refresh', 'xi-gone'), job(2, 'xero_invoice', 'refresh', 'xi-other')]);
    assert.equal(summary.skipped, 2);
  });
});

describe('contact upsert', () => {
  test('pushes a linked customer\'s changes to its Xero contact', async () => {
    const db = fakeDb(seed({ customers: { 'cust-1': { id: 'cust-1', company_id: COMPANY, company: 'Acme Renamed', email: 'a@acme.test', xero_contact_id: 'xc-1' } } }));
    const xero = fakeXero({ 'POST /Contacts': ({ body }) => ({ Contacts: body.Contacts }) });
    await run(db, xero, [job(1, 'contact', 'upsert', 'cust-1')]);
    assert.deepEqual(
      { id: xero.calls[0].body.Contacts[0].ContactID, name: xero.calls[0].body.Contacts[0].Name },
      { id: 'xc-1', name: 'Acme Renamed' }
    );
  });
});

describe('failure handling', () => {
  const linked = () => seed({ customers: { 'cust-1': { id: 'cust-1', company_id: COMPANY, company: 'Acme', xero_contact_id: 'xc-1' } } });

  test('a rate limit puts this and the company\'s remaining jobs back without spending an attempt', async () => {
    const data = linked();
    data.invoices['inv-2'] = { ...data.invoices['inv-1'], id: 'inv-2', number: 'INV-1002' };
    const db = fakeDb(data);
    const xero = fakeXero({ 'GET /Invoices': () => { throw new XeroError('rate_limited', 'Xero rate limit reached (minute)', { retryAfterSec: 42 }); } });
    const summary = await run(db, xero, [job(1, 'invoice', 'upsert', 'inv-1', 3), job(2, 'invoice', 'upsert', 'inv-2', 1)]);
    assert.deepEqual(summary, { done: 0, skipped: 0, failed: 0, retried: 0, released: 2, paced: 0 });
    assert.deepEqual(db.finished[1], { status: 'pending', attempts: 2, run_after: '2026-10-20T00:00:42.000Z', last_error: 'Xero rate limit reached (minute)' });
    assert.equal(db.finished[2].attempts, 0);
    assert.equal(data.invoices['inv-1'].xero_sync_error, undefined, 'a rate limit is not an invoice error');
  });

  test('revoked access marks the connection for reconnecting and parks its jobs', async () => {
    const db = fakeDb(linked());
    const xero = fakeXero({ 'GET /Invoices': () => { throw new XeroError('auth_revoked', 'Reconnect Xero'); } });
    const summary = await run(db, xero, [job(1, 'invoice', 'upsert', 'inv-1')]);
    assert.equal(summary.released, 1);
    assert.deepEqual(db.connection, { status: 'needs_reauth', last_error: 'Reconnect Xero' });
    assert.equal(db.finished[1].status, 'pending');
  });

  test('transient errors back off, then give up after the last attempt', async () => {
    const db = fakeDb(linked());
    const xero = fakeXero({ 'GET /Invoices': () => { throw new XeroError('server', 'Xero HTTP 503'); } });
    await run(db, xero, [job(1, 'invoice', 'upsert', 'inv-1', 2)]);
    assert.equal(db.finished[1].status, 'pending');
    assert.equal(db.finished[1].run_after, '2026-10-20T00:05:00.000Z');
    await run(db, xero, [job(1, 'invoice', 'upsert', 'inv-1', MAX_ATTEMPTS)]);
    assert.equal(db.finished[1].status, 'failed');
    assert.match(db.finished[1].last_error, /Gave up after 6 attempts/);
  });

  test('a company whose connection is gone has its jobs released', async () => {
    const db = fakeDb(linked());
    const summary = await runJobs({ jobs: [job(1, 'invoice', 'upsert', 'inv-1')], db, xeroFor: async () => null, now: () => NOW });
    assert.equal(summary.released, 1);
    assert.equal(db.finished[1].run_after, '2026-10-20T00:10:00.000Z');
  });

  test('running out of time releases the rest untouched', async () => {
    const db = fakeDb(linked());
    let calls = 0;
    const summary = await run(db, fakeXero({}), [job(1, 'invoice', 'upsert', 'inv-1'), job(2, 'invoice', 'upsert', 'inv-1')], { outOfTime: () => calls++ > 0 });
    // The first job runs (and retries: this fake Xero has no routes); the second is released.
    assert.equal(summary.retried, 1);
    assert.equal(summary.released, 1);
    assert.equal(db.finished[2].status, 'pending');
  });

  test('claims every job kind it has a handler for; anything else goes back untouched', async () => {
    assert.deepEqual([...WORKER_ACTIONS], ['upsert', 'void', 'pay', 'refresh']);
    const db = fakeDb(linked());
    const summary = await run(db, fakeXero({}), [job(1, 'contact', 'void', 'cust-1')]);
    assert.equal(summary.released, 1);
  });

  test('backoff grows and classification is stable', () => {
    assert.deepEqual([1, 2, 3, 4, 5, 9].map(backoffSeconds), [60, 300, 1800, 7200, 43200, 43200]);
    assert.equal(classifyError(new XeroError('not_found', 'gone'), 1).outcome, 'failed');
    assert.equal(classifyError(new Error('boom'), 1).outcome, 'retry');
  });
});

describe('throughput and pacing', () => {
  // Two companies, each with an invoice that needs one Xero POST (contact
  // already linked, invoice already in Xero so there is no lookup).
  function twoCompanies() {
    const base = seed().invoices['inv-1'];
    const data = seed();
    data.invoices = {};
    data.customers = {};
    for (const c of ['a', 'b', 'c']) {
      data.customers[`cust-${c}`] = { id: `cust-${c}`, company_id: `company-${c}`, company: `Co ${c}`, xero_contact_id: `xc-${c}` };
      for (const n of [1, 2]) {
        data.invoices[`inv-${c}${n}`] = {
          ...base, id: `inv-${c}${n}`, company_id: `company-${c}`, number: `INV-${c}${n}`, customer_id: `cust-${c}`,
          job_id: null, xero_invoice_id: `xi-${c}${n}`, xero_status: 'AUTHORISED', xero_amount_due: 330,
        };
      }
    }
    return data;
  }
  const jobFor = (id, company, invoiceId) => ({ id, company_id: company, entity: 'invoice', entity_id: invoiceId, action: 'upsert', status: 'running', attempts: 1 });

  /** A fake Xero per company whose POSTs wait for the test to let them finish. */
  function gatedXero(log, limitsFor = () => ({})) {
    let inFlight = 0;
    const stats = { maxInFlight: 0 };
    const make = (company) => {
      const client = {
        limits: {},
        request: async (method, path, { body }) => {
          inFlight++;
          stats.maxInFlight = Math.max(stats.maxInFlight, inFlight);
          log.push(`start ${company} ${body.Invoices[0].InvoiceNumber}`);
          await new Promise((r) => setTimeout(r, 5));
          log.push(`end ${company} ${body.Invoices[0].InvoiceNumber}`);
          inFlight--;
          client.limits = limitsFor(company, body.Invoices[0].InvoiceNumber);
          return { status: 200, data: { Invoices: [{ InvoiceID: body.Invoices[0].InvoiceID, Status: 'AUTHORISED', Total: 330, AmountDue: 330 }] } };
        },
      };
      return client;
    };
    const clients = {};
    return { stats, xeroFor: async (company) => (clients[company] ||= make(company)) };
  }

  const jobsForAll = () => [
    jobFor(1, 'company-a', 'inv-a1'), jobFor(2, 'company-b', 'inv-b1'), jobFor(3, 'company-c', 'inv-c1'),
    jobFor(4, 'company-a', 'inv-a2'), jobFor(5, 'company-b', 'inv-b2'), jobFor(6, 'company-c', 'inv-c2'),
  ];

  test('companies run side by side, each in its own order, one call at a time per company', async () => {
    const log = [];
    const { stats, xeroFor } = gatedXero(log);
    const db = fakeDb(twoCompanies());
    const summary = await runJobs({ jobs: jobsForAll(), db, xeroFor, now: () => NOW, concurrency: 8 });
    assert.equal(summary.done, 6);
    // All three companies were in flight together...
    assert.equal(stats.maxInFlight, 3);
    // ...but within a company the second invoice starts only after the first ends.
    for (const c of ['a', 'b', 'c']) {
      assert.ok(log.indexOf(`end company-${c} INV-${c}1`) < log.indexOf(`start company-${c} INV-${c}2`), c);
    }
  });

  test('the pool size caps how many companies run at once', async () => {
    const log = [];
    const { stats, xeroFor } = gatedXero(log);
    const summary = await runJobs({ jobs: jobsForAll(), db: fakeDb(twoCompanies()), xeroFor, now: () => NOW, concurrency: 2 });
    assert.equal(summary.done, 6);
    assert.equal(stats.maxInFlight, 2);
    const one = gatedXero([]);
    await runJobs({ jobs: jobsForAll(), db: fakeDb(twoCompanies()), xeroFor: one.xeroFor, now: () => NOW, concurrency: 1 });
    assert.equal(one.stats.maxInFlight, 1);
  });

  test('a company low on Xero\'s per-minute allowance pauses; the others carry on', async () => {
    const { xeroFor } = gatedXero([], (company) => (company === 'company-b' ? { minuteRemaining: 2, dayRemaining: 4000 } : { minuteRemaining: 50 }));
    const db = fakeDb(twoCompanies());
    const summary = await runJobs({ jobs: jobsForAll(), db, xeroFor, now: () => NOW });
    assert.equal(summary.done, 5);
    assert.equal(summary.paced, 1);
    assert.deepEqual(db.finished[5], {
      status: 'pending', attempts: 0, run_after: '2026-10-20T00:01:00.000Z',
      last_error: 'Paused for a minute: Xero\'s per-minute limit for this organisation is nearly used.',
    });
    assert.equal(db.finished[4].status, 'done');
    assert.equal(db.finished[6].status, 'done');
  });

  test('a company close to its daily allowance pauses for an hour', async () => {
    const { xeroFor } = gatedXero([], () => ({ minuteRemaining: 50, dayRemaining: 10 }));
    const db = fakeDb(twoCompanies());
    const summary = await runJobs({ jobs: jobsForAll(), db, xeroFor, now: () => NOW });
    assert.equal(summary.done, 3);
    assert.equal(summary.paced, 3);
    assert.equal(db.finished[4].run_after, '2026-10-20T01:00:00.000Z');
    assert.match(db.finished[4].last_error, /10 Xero calls left today/);
  });

  test('paceFor ignores unknown limits and checks the app-wide minute too', async () => {
    const { paceFor } = await import('../functions/_xero/worker.js');
    assert.equal(paceFor(undefined), null);
    assert.equal(paceFor({ minuteRemaining: null, dayRemaining: null }), null);
    assert.equal(paceFor({ minuteRemaining: 4 }), null);
    assert.equal(paceFor({ minuteRemaining: 3 }).waitSec, 60);
    assert.match(paceFor({ appMinuteRemaining: 1 }).message, /app limit/);
    assert.equal(paceFor({ dayRemaining: 25, minuteRemaining: 1 }).waitSec, 3600);
  });
});
