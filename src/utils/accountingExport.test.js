import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { XERO_IMPORT_HEADERS, plainCsv, toCsv, toMappingInvoice, xeroImportCsv } from './accountingExport.js';

const parse = (csv) => csv.split('\r\n').map((line) => line.slice(1, -1).split('","').map((c) => c.replace(/""/g, '"')));

const invoice = (overrides = {}) => ({
  id: 'inv-1', number: 'INV-1001', title: 'Hot water', status: 'Sent', customerId: 'cust-1', customerName: 'Acme Pty Ltd',
  jobId: 'job-1', jobNumbers: ['J-42'], subtotal: 300, tax: 30, total: 330,
  issueDate: '2026-10-19T23:30:00.000Z', dueDate: '2026-11-19', createdAt: '2026-10-19T23:30:00.000Z',
  sections: [{ lineItems: [
    { description: 'Labour', type: 'labor', qty: 2, rate: 100 },
    { description: 'Valve', type: 'material', qty: 1, rate: 100 },
  ] }],
  ...overrides,
});

const ctx = (overrides = {}) => ({
  customers: [{ id: 'cust-1', company: 'Acme Pty Ltd', email: 'a@acme.test' }],
  jobs: [{ id: 'job-1', number: 'J-42', costCenterId: 'cc-1' }],
  costCenters: [{ id: 'cc-1', xeroSalesAccountCode: '201', xeroTrackingCategoryName: 'Division', xeroTrackingOptionName: 'Plumbing' }],
  settings: { defaultSalesAccountCode: '200' },
  ...overrides,
});

describe('Xero import file', () => {
  test('one row per line in Xero\'s template, coded like the sync, with AU dates and tax names', () => {
    const { csv, exported, skipped } = xeroImportCsv([invoice()], ctx());
    assert.equal(exported, 1);
    assert.deepEqual(skipped, []);
    const [header, ...rows] = parse(csv);
    assert.deepEqual(header, [...XERO_IMPORT_HEADERS]);
    assert.equal(rows.length, 2);
    const at = (row, name) => row[XERO_IMPORT_HEADERS.indexOf(name)];
    assert.equal(at(rows[0], '*ContactName'), 'Acme Pty Ltd');
    assert.equal(at(rows[0], 'EmailAddress'), 'a@acme.test');
    assert.equal(at(rows[0], '*InvoiceNumber'), 'INV-1001');
    assert.equal(at(rows[0], 'Reference'), 'J-42');
    assert.equal(at(rows[0], '*InvoiceDate'), '20/10/2026'); // Sydney date of the issue timestamp
    assert.equal(at(rows[0], '*DueDate'), '19/11/2026');
    assert.equal(at(rows[0], '*Quantity'), '2');
    assert.equal(at(rows[0], '*UnitAmount'), '100');
    assert.equal(at(rows[0], '*AccountCode'), '201'); // the job's cost center wins
    assert.equal(at(rows[0], '*TaxType'), 'GST on Income');
    assert.equal(at(rows[0], 'TrackingName1'), 'Division');
    assert.equal(at(rows[0], 'TrackingOption1'), 'Plumbing');
    assert.equal(at(rows[1], '*Description'), 'Valve');
  });

  test('cost centers without an override are tagged with their own name, like the sync', () => {
    const { csv } = xeroImportCsv([invoice()], ctx({
      costCenters: [{ id: 'cc-1', name: 'Gas Fitting', xeroSalesAccountCode: '201' }],
      settings: { defaultSalesAccountCode: '200', trackingCategoryName: 'Trade' },
    }));
    const row = parse(csv)[1];
    assert.equal(row[XERO_IMPORT_HEADERS.indexOf('TrackingName1')], 'Trade');
    assert.equal(row[XERO_IMPORT_HEADERS.indexOf('TrackingOption1')], 'Gas Fitting');
  });

  test('GST-free invoices and line-type accounts follow the same rules as the sync', () => {
    const { csv } = xeroImportCsv([invoice({ tax: 0, total: 300, jobId: null })], ctx({
      settings: { defaultSalesAccountCode: '200', labourAccountCode: '210' },
    }));
    const rows = parse(csv).slice(1);
    assert.deepEqual(rows.map((r) => r[XERO_IMPORT_HEADERS.indexOf('*AccountCode')]), ['210', '200']);
    assert.ok(rows.every((r) => r[XERO_IMPORT_HEADERS.indexOf('*TaxType')] === 'GST Free Income'));
  });

  test('drafts, voids and invoices with no account are skipped with a reason, the rest still export', () => {
    const result = xeroImportCsv([
      invoice({ id: 'a', number: 'INV-A', status: 'Draft' }),
      invoice({ id: 'b', number: 'INV-B', status: 'Void' }),
      invoice({ id: 'c', number: 'INV-C', jobId: null }),
      invoice({ id: 'd', number: 'INV-D' }),
    ], ctx({ settings: {} }));
    assert.equal(result.exported, 1);
    assert.deepEqual(result.skipped.map((s) => s.number), ['INV-A', 'INV-B', 'INV-C']);
    assert.match(result.skipped[2].reason, /No Xero sales account/);
  });

  test('falls back to the invoice\'s customer name when the customer record is gone', () => {
    const { csv } = xeroImportCsv([invoice({ customerId: 'gone', customerName: 'Walk-in' })], ctx());
    assert.equal(parse(csv)[1][0], 'Walk-in');
    const none = xeroImportCsv([invoice({ customerId: 'gone', customerName: '' })], ctx());
    assert.equal(none.exported, 0);
    assert.match(none.skipped[0].reason, /no customer name/);
  });

  test('deposit credits stay negative numbers, not text', () => {
    const inv = invoice({ subtotal: 200, tax: 20, total: 220 });
    inv.sections.push({ lineItems: [{ description: 'Less Deposit Billed (INV-0999)', type: 'other', qty: 1, rate: -100 }] });
    const rows = parse(xeroImportCsv([inv], ctx()).csv).slice(1);
    assert.equal(rows[2][XERO_IMPORT_HEADERS.indexOf('*UnitAmount')], '-100');
  });
});

describe('plain CSV', () => {
  test('one row per invoice with AU dates and two-decimal money', () => {
    const csv = plainCsv([invoice({ status: 'Paid', paidDate: '2026-10-21', paymentMethod: 'Cash' })], { jobRefs: () => ['J-42'] });
    const [header, row] = parse(csv);
    assert.equal(header[0], 'Invoice number');
    assert.deepEqual(row, ['INV-1001', 'Acme Pty Ltd', 'J-42', '20/10/2026', '19/11/2026', 'Paid', '300.00', '30.00', '330.00', '21/10/2026', 'Cash']);
  });
});

describe('csv safety', () => {
  test('quotes everything, doubles quotes, and defuses spreadsheet formulas', () => {
    assert.equal(toCsv([['a "b"', '=HYPERLINK("x")', '-12.5', '@cmd']]), '"a ""b""","\'=HYPERLINK(""x"")","-12.5","\'@cmd"');
  });

  test('maps store invoices onto the sync\'s row shape', () => {
    const row = toMappingInvoice(invoice());
    assert.equal(row.job_id, 'job-1');
    assert.equal(row.line_items.issueDate, '2026-10-19T23:30:00.000Z');
    assert.equal(row.line_items.sections.length, 1);
  });
});
