// ============================================
// RELAY — QUOTE DETAIL: STATUS AND ESTIMATE RULES
// ============================================
// Small pure rules behind the quote detail page, kept apart from the DOM so
// they can be tested.

const EDITABLE_STATUSES = ['Draft', 'Finalised', 'Sent', 'Accepted', 'Declined', 'Archived'];

/**
 * The options for the Status select. "Converted" is set by Convert to Job, not
 * picked by hand, so it is only listed for a quote that already has it: left
 * out, the select showed "Draft" and saving wrote Draft over a converted quote.
 */
export function quoteStatusOptions(current) {
  return current === 'Converted' ? [...EDITABLE_STATUSES, 'Converted'] : EDITABLE_STATUSES;
}

/** A quote the customer has signed: accepted, or accepted and turned into a job. */
export function isSignedQuote(status) {
  return status === 'Accepted' || status === 'Converted';
}

const money = (n) => (Number.isFinite(Number(n)) ? Number(n) : 0);

/**
 * The Internal Estimation card's figures. The editor stores totalInternalCost
 * on save; a quote without it (older records, imports) is costed from its line
 * items instead of showing $0 cost and a NaN% margin.
 */
export function quoteEstimate(quote) {
  const q = quote || {};
  const subtotal = money(q.subtotal);
  const stored = Number(q.totalInternalCost);
  const cost = Number.isFinite(stored)
    ? stored
    : (q.sections || []).reduce((sum, section) => sum + (section.lineItems || [])
      .reduce((s, item) => s + money(item.qty) * money(item.internalCost), 0), 0);
  const margin = subtotal - cost;
  const percent = subtotal > 0 ? Math.round((margin / subtotal) * 100) : 0;
  return { cost, margin, percent };
}
