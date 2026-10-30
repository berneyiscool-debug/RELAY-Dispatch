// ============================================
// RELAY DISPATCH — CUSTOMER ACCOUNT TERMS
// ============================================
//
// A customer's payment terms and credit limit used to be display-only: the
// Financials tab printed `paymentTermsDays` and `creditLimit`, but there was no
// field to set them, they were never persisted, no invoice honoured the terms
// and nothing compared a balance to the limit. This module is the single place
// that turns those two numbers into behaviour:
//
//   * `paymentTermsDaysFor` / `dueDateForCustomer` — every invoice-creation path
//     asks this for its due date instead of hard-coding 30 days.
//   * `creditLimitCheck` — the over-limit warning shown before an invoice is
//     created. It warns; it never blocks.
//
// Both are nullable by design: no terms means the 30-day company default (what
// the invoice paths always used), and no limit means unlimited credit.

import { roundCurrency } from './pricing.js';
import { invoiceBalance } from './kpis.js';

/** Used whenever a customer has no terms of their own. */
export const DEFAULT_PAYMENT_TERMS_DAYS = 30;

/** The choices the editors offer; anything else is a "custom" number of days. */
export const PAYMENT_TERMS_PRESETS = [
  { days: 0, label: 'COD (due on issue)' },
  { days: 7, label: '7 Days' },
  { days: 14, label: '14 Days' },
  { days: 30, label: '30 Days' },
];

const DAY_MS = 86400000;

const money = (value) => `$${(Number(value) || 0).toLocaleString('en-AU', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

/**
 * Days of credit from a stored or typed value, or null when it says nothing.
 *
 * Accepts the shapes the app already holds — 14, '14', '14 Days', 'Net 30' —
 * and the trade-account wording used on suppliers ('30 Days EOM'). 'COD' means
 * due on issue, which is 0 days, not "unset".
 */
export function paymentTermsDaysFromInput(value) {
  if (value === null || value === undefined) return null;
  if (typeof value === 'number') return Number.isFinite(value) && value >= 0 ? Math.round(value) : null;

  const text = String(value).trim().toLowerCase();
  if (!text) return null;
  if (/^cod\b|cash on delivery|due on (issue|receipt)/.test(text)) return 0;

  const digits = text.match(/\d+/);
  return digits ? Number(digits[0]) : null;
}

/** A label for a number of days: 'COD' for zero, otherwise '14 Days'. */
export function paymentTermsLabel(days) {
  return days === 0 ? 'COD' : `${days} Days`;
}

/** What the customer's account actually uses, falling back to the default. */
export function paymentTermsDaysFor(customer) {
  const days = paymentTermsDaysFromInput(customer?.paymentTermsDays);
  return days === null ? DEFAULT_PAYMENT_TERMS_DAYS : days;
}

/** The Financials-tab label, saying so when the default is standing in. */
export function customerPaymentTermsLabel(customer) {
  const own = paymentTermsDaysFromInput(customer?.paymentTermsDays);
  return own === null ? `${DEFAULT_PAYMENT_TERMS_DAYS} Days (default)` : paymentTermsLabel(own);
}

/** The due date a new invoice for this customer gets, from `from` (default now). */
export function dueDateForCustomer(customer, from = new Date()) {
  const start = from instanceof Date ? from : new Date(from);
  return new Date(start.getTime() + paymentTermsDaysFor(customer) * DAY_MS);
}

/** The customer's credit limit, or null when they have none (0 means none too). */
export function creditLimitFor(customer) {
  const limit = Number(customer?.creditLimit);
  return Number.isFinite(limit) && limit > 0 ? limit : null;
}

/**
 * What the customer owes today: the unpaid balance of every live invoice,
 * summed the same way the KPI cards do (drafts and voids are not debt, and
 * part-payments reduce the balance).
 */
export function customerOutstanding(customerId, invoices) {
  if (!customerId) return 0;
  return roundCurrency(
    (invoices || [])
      .filter((invoice) => invoice && invoice.customerId === customerId)
      .reduce((sum, invoice) => sum + invoiceBalance(invoice), 0)
  );
}

/** Credit limit, current debt and what is left of it, for the Financials tab. */
export function creditUsage(customer, invoices) {
  const limit = creditLimitFor(customer);
  const outstanding = customerOutstanding(customer?.id, invoices);
  return {
    limit,
    outstanding,
    available: limit === null ? null : roundCurrency(Math.max(0, limit - outstanding)),
    over: limit !== null && outstanding > limit,
  };
}

/**
 * Whether adding `amount` of new debt would take the customer over their limit.
 * Returns null when there is no limit to breach or the amount still fits, so a
 * caller can treat a truthy result as "warn about this".
 *
 * `amount` is the invoice total including GST, which is what the customer will
 * actually owe — the same basis as `outstanding`, so both sides of the
 * comparison are GST-inclusive.
 */
export function creditLimitCheck(customer, invoices, amount = 0) {
  const limit = creditLimitFor(customer);
  if (limit === null) return null;

  const outstanding = customerOutstanding(customer?.id, invoices);
  const invoiceAmount = roundCurrency(Number(amount) || 0);
  const projected = roundCurrency(outstanding + invoiceAmount);
  if (projected <= limit) return null;

  return { limit, outstanding, amount: invoiceAmount, projected, overBy: roundCurrency(projected - limit) };
}

/** The sentence read out in the over-limit warning. */
export function creditLimitMessage(check, customerName = 'This customer') {
  if (!check) return '';
  // Naming the invoice amount matters: without it the projected total looks
  // like it came from nowhere (a $8,500 subtotal is a $9,350 invoice with GST).
  const owing = check.outstanding > 0
    ? `and already owes ${money(check.outstanding)}`
    : 'and nothing owing';
  return (
    `${customerName} has a ${money(check.limit)} credit limit ${owing}. ` +
    `This invoice is ${money(check.amount)} incl. GST, which takes the account to ` +
    `${money(check.projected)} — ${money(check.overBy)} over the limit.`
  );
}
