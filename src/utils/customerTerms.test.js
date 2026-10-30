import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import {
  DEFAULT_PAYMENT_TERMS_DAYS,
  PAYMENT_TERMS_PRESETS,
  paymentTermsDaysFromInput,
  paymentTermsLabel,
  paymentTermsDaysFor,
  customerPaymentTermsLabel,
  dueDateForCustomer,
  creditLimitFor,
  customerOutstanding,
  creditUsage,
  creditLimitCheck,
  creditLimitMessage,
} from './customerTerms.js';

const close = (actual, expected, msg) => assert.ok(Math.abs(actual - expected) < 0.01, `${msg}: ${actual} ≠ ${expected}`);

describe('payment terms parsing', () => {
  test('reads the numbers customers are actually stored with', () => {
    assert.equal(paymentTermsDaysFromInput(14), 14);
    assert.equal(paymentTermsDaysFromInput('14'), 14);
    assert.equal(paymentTermsDaysFromInput('14 Days'), 14);
    assert.equal(paymentTermsDaysFromInput('Net 30'), 30);
    // The wording the supplier trade accounts already use.
    assert.equal(paymentTermsDaysFromInput('30 Days EOM'), 30);
  });

  test('COD is due on issue, which is zero days rather than unset', () => {
    assert.equal(paymentTermsDaysFromInput(0), 0);
    assert.equal(paymentTermsDaysFromInput('0'), 0);
    assert.equal(paymentTermsDaysFromInput('COD'), 0);
    assert.equal(paymentTermsDaysFromInput('cod'), 0);
  });

  test('blank, missing and nonsense values mean "no terms of their own"', () => {
    assert.equal(paymentTermsDaysFromInput(null), null);
    assert.equal(paymentTermsDaysFromInput(undefined), null);
    assert.equal(paymentTermsDaysFromInput(''), null);
    assert.equal(paymentTermsDaysFromInput('   '), null);
    assert.equal(paymentTermsDaysFromInput('on account'), null);
    assert.equal(paymentTermsDaysFromInput(-5), null);
    assert.equal(paymentTermsDaysFromInput(NaN), null);
  });
});

describe('what a customer account uses', () => {
  test('an unset account falls back to the 30-day default that invoices always used', () => {
    assert.equal(DEFAULT_PAYMENT_TERMS_DAYS, 30);
    assert.equal(paymentTermsDaysFor({}), 30);
    assert.equal(paymentTermsDaysFor(null), 30);
    assert.equal(paymentTermsDaysFor({ paymentTermsDays: null }), 30);
  });

  test('the customer’s own terms win', () => {
    assert.equal(paymentTermsDaysFor({ paymentTermsDays: 7 }), 7);
    assert.equal(paymentTermsDaysFor({ paymentTermsDays: '14 Days' }), 14);
    assert.equal(paymentTermsDaysFor({ paymentTermsDays: 0 }), 0);
  });

  test('labels say when the default is standing in, and COD for zero', () => {
    assert.equal(paymentTermsLabel(0), 'COD');
    assert.equal(paymentTermsLabel(14), '14 Days');
    assert.equal(customerPaymentTermsLabel({}), '30 Days (default)');
    assert.equal(customerPaymentTermsLabel({ paymentTermsDays: 0 }), 'COD');
    assert.equal(customerPaymentTermsLabel({ paymentTermsDays: 7 }), '7 Days');
  });

  test('every preset is a whole number of days with a label', () => {
    assert.deepEqual(PAYMENT_TERMS_PRESETS.map((p) => p.days), [0, 7, 14, 30]);
    PAYMENT_TERMS_PRESETS.forEach((preset) => assert.ok(preset.label.length > 0));
  });
});

describe('due dates from terms', () => {
  const issue = new Date(2026, 9, 1, 9, 0); // 1 October 2026, local

  test('a customer with no terms gets 30 days', () => {
    const due = dueDateForCustomer({}, issue);
    assert.equal(due.getDate(), 31);
    assert.equal(due.getMonth(), 9);
  });

  test('a customer’s own terms set the date', () => {
    assert.equal(dueDateForCustomer({ paymentTermsDays: 7 }, issue).getDate(), 8);
    assert.equal(dueDateForCustomer({ paymentTermsDays: 14 }, issue).getDate(), 15);
  });

  test('COD is due on the issue date', () => {
    assert.equal(dueDateForCustomer({ paymentTermsDays: 0 }, issue).getDate(), 1);
  });

  test('accepts the date-input string the invoice form holds', () => {
    const due = dueDateForCustomer({ paymentTermsDays: 7 }, '2026-10-01');
    assert.equal(due.toISOString().slice(0, 10), '2026-10-08');
  });
});

describe('credit limits', () => {
  const invoices = [
    { id: 'i1', customerId: 'c1', status: 'Sent', total: 500 },            // owed in full
    { id: 'i2', customerId: 'c1', status: 'Overdue', total: 800, payments: [{ amount: 300 }] }, // part paid
    { id: 'i3', customerId: 'c1', status: 'Paid', total: 400 },            // settled
    { id: 'i4', customerId: 'c1', status: 'Draft', total: 900 },           // not debt yet
    { id: 'i5', customerId: 'c1', status: 'Void', total: 250 },            // cancelled
    { id: 'i6', customerId: 'c2', status: 'Sent', total: 1000 },           // someone else
  ];

  test('a blank, zero or negative limit means no limit', () => {
    assert.equal(creditLimitFor({}), null);
    assert.equal(creditLimitFor({ creditLimit: null }), null);
    assert.equal(creditLimitFor({ creditLimit: 0 }), null);
    assert.equal(creditLimitFor({ creditLimit: '' }), null);
    assert.equal(creditLimitFor({ creditLimit: -100 }), null);
  });

  test('a limit reads through strings and numbers', () => {
    assert.equal(creditLimitFor({ creditLimit: 5000 }), 5000);
    assert.equal(creditLimitFor({ creditLimit: '5000.00' }), 5000);
  });

  test('outstanding is live invoices only, net of part payments', () => {
    // 500 + (800 − 300); paid, draft, void and other customers are excluded.
    close(customerOutstanding('c1', invoices), 1000, 'outstanding');
    close(customerOutstanding('c2', invoices), 1000, 'other customer');
    assert.equal(customerOutstanding(null, invoices), 0);
    assert.equal(customerOutstanding('nobody', invoices), 0);
    assert.equal(customerOutstanding('c1', undefined), 0);
  });

  test('usage reports what is left of the limit, and whether it is gone', () => {
    const usage = creditUsage({ id: 'c1', creditLimit: 1500 }, invoices);
    assert.equal(usage.limit, 1500);
    close(usage.outstanding, 1000, 'used');
    close(usage.available, 500, 'available');
    assert.equal(usage.over, false);

    const over = creditUsage({ id: 'c1', creditLimit: 800 }, invoices);
    close(over.available, 0, 'nothing available once over');
    assert.equal(over.over, true);
  });

  test('no limit means no over-limit answer and nothing to warn about', () => {
    assert.equal(creditUsage({ id: 'c1' }, invoices).limit, null);
    assert.equal(creditUsage({ id: 'c1' }, invoices).available, null);
    assert.equal(creditLimitCheck({ id: 'c1' }, invoices, 100000), null);
  });

  test('a new invoice that still fits raises no warning', () => {
    assert.equal(creditLimitCheck({ id: 'c1', creditLimit: 1500 }, invoices, 400), null);
    assert.equal(creditLimitCheck({ id: 'c1', creditLimit: 1000 }, invoices, 0), null);
  });

  test('a new invoice that does not fit reports how far over it goes', () => {
    const check = creditLimitCheck({ id: 'c1', creditLimit: 1500 }, invoices, 800);
    assert.ok(check);
    assert.equal(check.limit, 1500);
    close(check.outstanding, 1000, 'already owing');
    close(check.amount, 800, 'the invoice itself');
    close(check.projected, 1800, 'projected');
    close(check.overBy, 300, 'over by');
  });

  test('the warning spells out the limit, the debt, the invoice and the overshoot', () => {
    const check = creditLimitCheck({ id: 'c1', creditLimit: 1500 }, invoices, 800);
    const message = creditLimitMessage(check, 'Seaview Strata Management');
    assert.match(message, /Seaview Strata Management/);
    assert.match(message, /\$1,500\.00 credit limit/);
    assert.match(message, /already owes \$1,000\.00/);
    // The invoice amount has to be in the sentence, or the projected total looks
    // like it came from nowhere (a subtotal plus GST is what the account carries).
    assert.match(message, /This invoice is \$800\.00 incl\. GST/);
    assert.match(message, /\$1,800\.00/);
    assert.match(message, /\$300\.00 over the limit/);
    assert.equal(creditLimitMessage(null), '');
  });

  test('a customer who owes nothing is described that way', () => {
    // The case from the screenshot: $1,000 limit, nothing owing, a $9,350
    // GST-inclusive invoice (an $8,500 subtotal plus $850 GST).
    const check = creditLimitCheck({ id: 'c9', creditLimit: 1000 }, [], 9350);
    const message = creditLimitMessage(check, 'Jane Doe');
    assert.match(message, /and nothing owing/);
    assert.doesNotMatch(message, /already owes \$0\.00/, 'no "owes $0.00"');
    assert.match(message, /This invoice is \$9,350\.00 incl\. GST/);
    assert.match(message, /takes the account to \$9,350\.00/);
    assert.match(message, /\$8,350\.00 over the limit/);
  });
});
