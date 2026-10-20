/**
 * Tests for the RELAY → Xero mapping used by relay-xero-sync. These pin down
 * the accounting rules: what gets pushed, which account and tracking each line
 * lands on, GST, dates in the company's time zone, and that each payment is
 * pushed exactly once.
 *
 * Run with: npm run test:migrations
 */
import { describe, test } from 'node:test';
import assert from 'node:assert/strict';
import {
  MappingError,
  buildContact,
  buildInvoice,
  buildPayments,
  contactLookups,
  invoiceEvents,
  invoiceIdsByTenant,
  invoiceIdempotencyKey,
  parseInvoiceMeta,
  parseXeroDate,
  pickContactMatch,
  reconcileTotals,
  toXeroDate,
  whereString,
} from '../functions/_xero/mapping.js';

const SETTINGS = {
  defaultSalesAccountCode: '200',
  labourAccountCode: '210',
  materialsAccountCode: '220',
  paymentAccountCode: '090',
  stripeAccountCode: '091',
};

const COST_CENTERS = [
  { id: 'cc-plumb', xero_sales_account_code: '201', xero_tracking_category_name: 'Division', xero_tracking_option_name: 'Plumbing' },
  { id: 'cc-elec', xero_sales_account_code: '202', xero_tracking_category_name: 'Division', xero_tracking_option_name: 'Electrical' },
  { id: 'cc-bare', xero_sales_account_code: null, xero_tracking_category_name: 'Division', xero_tracking_option_name: null },
];

function invoice(overrides = {}) {
  return {
    id: 'inv-1',
    number: 'INV-1001',
    title: 'Hot water service',
    status: 'Sent',
    customer_id: 'cust-1',
    job_id: 'job-1',
    subtotal: 300,
    tax: 30,
    total: 330,
    due_date: '2026-11-19',
    created_at: '2026-10-19T23:30:00.000Z',
    updated_at: '2026-10-20T01:00:00.000Z',
    line_items: {
      sections: [{
        name: 'Job Items',
        lineItems: [
          { description: 'Labour (2.00 hrs)', type: 'labor', qty: 2, rate: 100, total: 200 },
          { description: 'Tempering valve', type: 'material', qty: 1, rate: 100, total: 100 },
        ],
      }],
      issueDate: '2026-10-19T23:30:00.000Z',
      jobIds: [],
      jobNumbers: ['J-0042'],
      payments: [],
    },
    xero_invoice_id: null,
    xero_payment_ids: {},
    ...overrides,
  };
}

const ctx = (overrides = {}) => ({
  contactId: 'xero-contact-1',
  jobs: [{ id: 'job-1', number: 'J-0042', cost_center_id: null }],
  costCenters: COST_CENTERS,
  settings: SETTINGS,
  ...overrides,
});

const code = (fn) => {
  try { fn(); } catch (err) {
    assert.ok(err instanceof MappingError, `expected MappingError, got ${err}`);
    return err.code;
  }
  assert.fail('expected a MappingError');
};

describe('invoice meta', () => {
  test('reads both the legacy plain-array and the sections object shapes', () => {
    const legacy = parseInvoiceMeta([{ description: 'A', qty: 1, rate: 5 }]);
    assert.equal(legacy.sections[0].lineItems.length, 1);
    assert.deepEqual(legacy.payments, []);
    const packed = parseInvoiceMeta(JSON.stringify({ sections: [{ lineItems: [] }], jobIds: ['j1', null], payments: [{ amount: 5 }] }));
    assert.deepEqual(packed.jobIds, ['j1']);
    assert.equal(packed.payments.length, 1);
    assert.deepEqual(parseInvoiceMeta('not json').sections[0].lineItems, []);
  });
});

describe('dates', () => {
  test('ISO timestamps become the calendar date in the company time zone', () => {
    // 23:30 UTC on the 19th is the morning of the 20th in Sydney.
    assert.equal(toXeroDate('2026-10-19T23:30:00.000Z'), '2026-10-20');
    assert.equal(toXeroDate('2026-10-19T23:30:00.000Z', 'Australia/Perth'), '2026-10-20');
    assert.equal(toXeroDate('2026-10-19T10:00:00.000Z', 'Australia/Perth'), '2026-10-19');
    assert.equal(toXeroDate('2026-10-19'), '2026-10-19');
    assert.equal(toXeroDate(''), null);
    assert.equal(toXeroDate('garbage'), null);
  });

  test('parses Xero\'s /Date()/ format', () => {
    assert.equal(parseXeroDate('/Date(1760918400000+0000)/'), '2025-10-20');
    assert.equal(parseXeroDate('2026-10-19T00:00:00'), '2026-10-19');
    assert.equal(parseXeroDate(null), null);
  });
});

describe('contacts', () => {
  test('a company name wins; otherwise the person; phone and address carried', () => {
    const c = buildContact({ id: 'c1', company: ' Acme Pty Ltd ', first_name: 'Sam', last_name: 'Lee', email: 's@acme.test', phone: '0400 000 000', address: '1 Main St, Sydney NSW 2000' });
    assert.equal(c.Name, 'Acme Pty Ltd');
    assert.equal(c.ContactNumber, 'RELAY-c1');
    assert.equal(c.EmailAddress, 's@acme.test');
    assert.deepEqual(c.Phones, [{ PhoneType: 'DEFAULT', PhoneNumber: '0400 000 000' }]);
    assert.equal(c.Addresses[0].AddressLine1, '1 Main St, Sydney NSW 2000');
    assert.equal(buildContact({ id: 'c2', first_name: 'Sam', last_name: 'Lee' }).Name, 'Sam Lee');
    assert.equal(buildContact({ id: 'c3', company: 'Acme', xero_contact_id: 'x-9' }, { nameSuffix: ' (RELAY)' }).Name, 'Acme (RELAY)');
    assert.equal(buildContact({ id: 'c3', company: 'Acme', xero_contact_id: 'x-9' }).ContactID, 'x-9');
    assert.equal(code(() => buildContact({ id: 'c4' })), 'no_contact_name');
  });

  test('lookups escape quotes so a name can\'t break out of the where filter', () => {
    assert.equal(whereString('Bob "The Builder" \\ Co'), '"Bob \\"The Builder\\" \\\\ Co"');
    const lookups = contactLookups({ id: 'c1', company: 'Acme', email: ' a@acme.test ' });
    assert.deepEqual(lookups.map((l) => l.by), ['contactNumber', 'email', 'name']);
    assert.equal(lookups[1].where, 'EmailAddress=="a@acme.test"');
  });

  test('matching prefers our own contact number, then email, then a compatible name', () => {
    const customer = { id: 'c1', company: 'Acme', email: 'a@acme.test' };
    const ours = { ContactID: 'x1', ContactNumber: 'RELAY-c1', Name: 'Renamed' };
    const byEmail = { ContactID: 'x2', Name: 'Acme Holdings', EmailAddress: 'A@ACME.test' };
    const sameNameNoEmail = { ContactID: 'x3', Name: 'acme' };
    const sameNameOtherEmail = { ContactID: 'x4', Name: 'Acme', EmailAddress: 'other@x.test' };
    assert.equal(pickContactMatch(customer, [byEmail, ours]).contact.ContactID, 'x1');
    assert.equal(pickContactMatch(customer, [sameNameNoEmail, byEmail]).contact.ContactID, 'x2');
    assert.equal(pickContactMatch(customer, [sameNameNoEmail]).contact.ContactID, 'x3');
    assert.deepEqual(pickContactMatch(customer, [sameNameOtherEmail]), { collision: true });
    assert.deepEqual(pickContactMatch(customer, [{ ...ours, ContactStatus: 'ARCHIVED' }]), {});
    assert.deepEqual(pickContactMatch(customer, []), {});
  });
});

describe('invoice payload', () => {
  test('a sent invoice becomes an authorised, tax-exclusive ACCREC with typed accounts', () => {
    const { payload, warnings, expectedSubtotal } = buildInvoice(invoice(), ctx());
    assert.deepEqual(warnings, []);
    assert.equal(expectedSubtotal, 300);
    assert.equal(payload.Type, 'ACCREC');
    assert.equal(payload.Status, 'AUTHORISED');
    assert.equal(payload.LineAmountTypes, 'Exclusive');
    assert.equal(payload.InvoiceNumber, 'INV-1001');
    assert.equal(payload.Reference, 'J-0042');
    assert.deepEqual(payload.Contact, { ContactID: 'xero-contact-1' });
    assert.equal(payload.Date, '2026-10-20');
    assert.equal(payload.DueDate, '2026-11-19');
    assert.equal(payload.InvoiceID, undefined);
    assert.deepEqual(payload.LineItems.map((l) => [l.AccountCode, l.TaxType, l.Quantity, l.UnitAmount]), [
      ['210', 'OUTPUT', 2, 100],
      ['220', 'OUTPUT', 1, 100],
    ]);
    assert.ok(payload.LineItems.every((l) => l.Tracking === undefined));
  });

  test('a job\'s cost center overrides the account and adds tracking', () => {
    const { payload } = buildInvoice(invoice(), ctx({ jobs: [{ id: 'job-1', number: 'J-0042', cost_center_id: 'cc-plumb' }] }));
    assert.deepEqual(payload.LineItems.map((l) => l.AccountCode), ['201', '201']);
    assert.deepEqual(payload.LineItems[0].Tracking, [{ Name: 'Division', Option: 'Plumbing' }]);
  });

  test('a cost center with no account falls back, and half-set tracking is left off', () => {
    const { payload } = buildInvoice(invoice(), ctx({ jobs: [{ id: 'job-1', cost_center_id: 'cc-bare' }] }));
    assert.deepEqual(payload.LineItems.map((l) => l.AccountCode), ['210', '220']);
    assert.equal(payload.LineItems[0].Tracking, undefined);
  });

  test('a line with no resolvable account fails instead of guessing', () => {
    const err = (() => { try { buildInvoice(invoice(), ctx({ settings: { labourAccountCode: '210' } })); } catch (e) { return e; } })();
    assert.equal(err.code, 'no_account');
    assert.deepEqual(err.details.lines, ['Tempering valve']);
  });

  test('GST-free invoices use the exempt tax type; overrides are honoured', () => {
    const exempt = buildInvoice(invoice({ tax: 0, total: 300 }), ctx()).payload;
    assert.ok(exempt.LineItems.every((l) => l.TaxType === 'EXEMPTOUTPUT'));
    const custom = buildInvoice(invoice(), ctx({ settings: { ...SETTINGS, taxTypeTaxed: 'OUTPUT2' } })).payload;
    assert.ok(custom.LineItems.every((l) => l.TaxType === 'OUTPUT2'));
  });

  test('deposit credit lines go through; a negative total does not', () => {
    const withCredit = invoice({ subtotal: 200, tax: 20, total: 220 });
    withCredit.line_items.sections.push({ name: 'Prepayments & Deposits Credit', lineItems: [{ description: 'Less Deposit Billed (INV-0999)', type: 'other', qty: 1, rate: -100, total: -100 }] });
    const { payload, warnings } = buildInvoice(withCredit, ctx());
    assert.deepEqual(warnings, []);
    assert.deepEqual(payload.LineItems[2], { Description: 'Less Deposit Billed (INV-0999)', Quantity: 1, UnitAmount: -100, AccountCode: '200', TaxType: 'OUTPUT' });
    assert.equal(code(() => buildInvoice(invoice({ total: -5 }), ctx())), 'negative_total');
  });

  test('consolidated invoices take the first job\'s coding and warn when cost centers differ', () => {
    const combined = invoice({ job_id: null });
    combined.line_items.jobIds = ['job-1', 'job-2'];
    combined.line_items.jobNumbers = [];
    const jobs = [
      { id: 'job-1', number: 'J-1', cost_center_id: 'cc-plumb' },
      { id: 'job-2', number: 'J-2', cost_center_id: 'cc-elec' },
    ];
    const { payload, warnings } = buildInvoice(combined, ctx({ jobs }));
    assert.equal(payload.Reference, 'J-1, J-2');
    assert.deepEqual(payload.LineItems.map((l) => l.AccountCode), ['201', '201']);
    assert.match(warnings[0], /different cost centers/);

    // A line that does record its job is coded to that job.
    combined.line_items.sections[0].lineItems[1].jobId = 'job-2';
    const perLine = buildInvoice(combined, ctx({ jobs })).payload;
    assert.equal(perLine.LineItems[1].AccountCode, '202');
    assert.deepEqual(perLine.LineItems[1].Tracking, [{ Name: 'Division', Option: 'Electrical' }]);
  });

  test('unit prices keep 4 decimals and a subtotal drift is reported', () => {
    const odd = invoice({ subtotal: 33.34 });
    odd.line_items.sections = [{ lineItems: [{ description: 'Pipe', type: 'material', qty: 3, rate: 11.11111, total: 33.33 }] }];
    const { payload, warnings, expectedSubtotal } = buildInvoice(odd, ctx());
    assert.equal(payload.LineItems[0].UnitAmount, 11.1111);
    assert.equal(expectedSubtotal, 33.33);
    assert.match(warnings[0], /differ from the RELAY subtotal/);
  });

  test('an already-linked invoice carries its InvoiceID so Xero updates it', () => {
    assert.equal(buildInvoice(invoice({ xero_invoice_id: 'xi-1' }), ctx()).payload.InvoiceID, 'xi-1');
  });

  test('missing due date falls back to the configured terms with a warning', () => {
    const { payload, warnings } = buildInvoice(invoice({ due_date: null }), ctx({ settings: { ...SETTINGS, defaultDueDays: 14 } }));
    assert.equal(payload.DueDate, '2026-11-03');
    assert.match(warnings[0], /No due date/);
  });

  test('refuses drafts, voids, unlinked customers, empty invoices and missing numbers', () => {
    assert.equal(code(() => buildInvoice(invoice({ status: 'Draft' }), ctx())), 'draft');
    assert.equal(code(() => buildInvoice(invoice({ status: 'Void' }), ctx())), 'void');
    assert.equal(code(() => buildInvoice(invoice(), ctx({ contactId: null }))), 'no_contact');
    assert.equal(code(() => buildInvoice(invoice({ line_items: { sections: [] } }), ctx())), 'no_lines');
    assert.equal(code(() => buildInvoice(invoice({ number: ' ' }), ctx())), 'no_number');
  });

  test('legacy plain-array line items still map', () => {
    const { payload } = buildInvoice(invoice({ line_items: [{ description: 'Callout', qty: 1, rate: 300 }] }), ctx());
    assert.deepEqual(payload.LineItems.map((l) => [l.Description, l.AccountCode]), [['Callout', '200']]);
    assert.equal(payload.Date, '2026-10-20'); // from created_at
  });

  test('idempotency keys change with each version of the invoice', () => {
    const a = invoiceIdempotencyKey(invoice());
    assert.equal(a, invoiceIdempotencyKey(invoice()));
    assert.notEqual(a, invoiceIdempotencyKey(invoice({ updated_at: '2026-10-20T02:00:00.000Z' })));
    assert.ok(a.length <= 128);
  });

  test('totals reconcile within a few cents of GST rounding', () => {
    assert.deepEqual(reconcileTotals(330, 330), { status: 'ok', diff: 0 });
    assert.deepEqual(reconcileTotals(330, 330.03), { status: 'warning', diff: 0.03 });
    assert.deepEqual(reconcileTotals(330, 329.95), { status: 'warning', diff: -0.05 });
    assert.deepEqual(reconcileTotals(330, 331), { status: 'mismatch', diff: 1 });
  });
});

describe('payments', () => {
  const paid = (overrides = {}) => invoice({ status: 'Paid', paid_date: '2026-10-21', payment_method: 'Bank Transfer', xero_invoice_id: 'xi-1', ...overrides });

  test('a manually marked-paid invoice pushes one payment for the full balance', () => {
    const [p, ...rest] = buildPayments(paid(), { settings: SETTINGS });
    assert.deepEqual(rest, []);
    assert.equal(p.ref, 'balance');
    assert.equal(p.idempotencyKey, 'relay-pay-inv-1-balance');
    assert.deepEqual(p.payload, { Invoice: { InvoiceID: 'xi-1' }, Account: { Code: '090' }, Date: '2026-10-21', Amount: 330, Reference: 'Bank Transfer' });
  });

  test('a Stripe payment is keyed by its session and lands in the Stripe clearing account', () => {
    const [p] = buildPayments(paid({ payment_method: 'Stripe (online)', stripe_session_id: 'cs_test_1' }), { settings: SETTINGS });
    assert.equal(p.ref, 'stripe:cs_test_1');
    assert.equal(p.payload.Account.Code, '091');
    const [fallback] = buildPayments(paid({ payment_method: 'Stripe (online)', stripe_session_id: 'cs_test_1' }), { settings: { paymentAccountCode: '090' } });
    assert.equal(fallback.payload.Account.Code, '090');
  });

  test('recorded part-payments go individually, plus any balance once paid', () => {
    const inv = paid();
    inv.line_items.payments = [
      { id: 'pay-a', amount: 100, date: '2026-10-10', method: 'Cash', reference: 'Receipt 7' },
      { id: 'pay-b', amount: 0 },
    ];
    const out = buildPayments(inv, { settings: SETTINGS });
    assert.deepEqual(out.map((p) => [p.ref, p.payload.Amount, p.payload.Date]), [
      ['p:pay-a', 100, '2026-10-10'],
      ['balance', 230, '2026-10-21'],
    ]);
    assert.equal(out[0].payload.Reference, 'Cash · Receipt 7');

    // Sent (not yet paid) with a part-payment: only the part-payment.
    const partial = invoice({ status: 'Sent', xero_invoice_id: 'xi-1' });
    partial.line_items.payments = [{ id: 'pay-a', amount: 100, date: '2026-10-10' }];
    assert.deepEqual(buildPayments(partial, { settings: SETTINGS }).map((p) => p.ref), ['p:pay-a']);
  });

  test('already-pushed payments are never sent again', () => {
    assert.deepEqual(buildPayments(paid({ xero_payment_ids: { balance: 'xp-1' } }), { settings: SETTINGS }), []);
  });

  test('needs the invoice in Xero and a payment account', () => {
    assert.equal(code(() => buildPayments(paid({ xero_invoice_id: null }), { settings: SETTINGS })), 'not_in_xero');
    assert.equal(code(() => buildPayments(paid(), { settings: {} })), 'no_payment_account');
    assert.equal(buildPayments(paid({ xero_invoice_id: null }), { settings: SETTINGS, xeroInvoiceId: 'xi-new' })[0].payload.Invoice.InvoiceID, 'xi-new');
  });
});

describe('webhook events', () => {
  test('keeps unique invoice events and ignores contacts and the handshake', () => {
    assert.deepEqual(invoiceEvents({ events: [], firstEventSequence: 0 }), []);
    assert.deepEqual(invoiceEvents(null), []);
    const out = invoiceEvents({
      events: [
        { tenantId: 't1', eventCategory: 'INVOICE', eventType: 'UPDATE', resourceId: 'i1' },
        { tenantId: 't1', eventCategory: 'INVOICE', eventType: 'UPDATE', resourceId: 'i1' },
        { tenantId: 't1', eventCategory: 'CONTACT', eventType: 'UPDATE', resourceId: 'c1' },
        { tenantId: 't2', eventCategory: 'INVOICE', eventType: 'CREATE', resourceId: 'i2' },
        { eventCategory: 'INVOICE', resourceId: 'i3' },
      ],
    });
    assert.deepEqual(out, [
      { tenantId: 't1', resourceId: 'i1', type: 'UPDATE' },
      { tenantId: 't2', resourceId: 'i2', type: 'CREATE' },
    ]);
  });

  test('groups invoice ids by tenant for one enqueue call each', () => {
    assert.deepEqual(
      invoiceIdsByTenant([
        { tenantId: 't1', resourceId: 'i1' },
        { tenantId: 't2', resourceId: 'i2' },
        { tenantId: 't1', resourceId: 'i3' },
      ]),
      { t1: ['i1', 'i3'], t2: ['i2'] }
    );
    assert.deepEqual(invoiceIdsByTenant([]), {});
  });
});

describe('payment dates', () => {
  test('an invoice marked paid without a paid date is dated by its last change', () => {
    const inv = {
      id: 'inv-1', status: 'Paid', total: 110, paid_date: null, payment_method: 'Bank Transfer',
      updated_at: '2026-10-20T23:30:00.000Z', xero_invoice_id: 'xi-1', xero_payment_ids: {}, line_items: { sections: [] },
    };
    const [p] = buildPayments(inv, { settings: { paymentAccountCode: '090' } });
    assert.equal(p.payload.Date, '2026-10-21'); // Sydney time
  });
});
