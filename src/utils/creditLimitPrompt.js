// ============================================
// RELAY DISPATCH — OVER-LIMIT PROMPT
// ============================================
//
// One call site shape for the credit-limit warning, so every path that creates
// an invoice asks the same question in the same words. It warns and lets the
// office proceed; a customer with no limit, or one still inside it, is never
// interrupted. The agent path (actions/invoices.js) reports the same figures in
// its summary instead of asking, because it cannot answer a dialog.

import { store } from '../data/store.js';
import { showConfirm } from './confirmDialog.js';
import { creditLimitCheck, creditLimitMessage } from './customerTerms.js';

/**
 * Ask before creating an invoice that would take the customer over their credit
 * limit. Resolves true when the office confirms (or when there is nothing to
 * confirm), false when they back out.
 */
export async function confirmOverCreditLimit({ customerId, customerName, amount, invoices }) {
  if (!customerId) return true;

  const customer = store.getById('customers', customerId);
  const check = creditLimitCheck(customer, invoices || store.getAll('invoices'), amount);
  if (!check) return true;

  const name = customerName || customer?.company || [customer?.firstName, customer?.lastName].filter(Boolean).join(' ') || 'This customer';
  return showConfirm(creditLimitMessage(check, name), {
    title: 'Over credit limit',
    confirmLabel: 'Create anyway',
  });
}
