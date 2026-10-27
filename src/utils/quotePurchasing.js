/**
 * Create purchase orders from a job's quote.
 *
 * Quote lines don't carry a supplier; the stock item they match does. A line is
 * matched to stock by `stockId`/`partId`, falling back to an exact name match —
 * the same rule "Import Parts from Quote" uses, since lines typed into the quote
 * editor only keep the stock item's name. Lines are grouped by that supplier into
 * one draft PO each. Anything that can't be placed is flagged so the user can
 * pick a supplier by hand or leave it out.
 *
 * Each PO line remembers the quote line it came from (`quoteId` + `quoteLineKey`),
 * so running this again only offers what hasn't been ordered yet.
 */

export const LINE_ISSUES = {
  no_stock: 'Not a stock item — choose a supplier',
  no_supplier: 'Stock item has no supplier — choose one',
  inactive_supplier: 'Supplier is inactive — choose another',
};

const round2 = (n) => Math.round((Number(n) || 0) * 100) / 100;

export const isActiveSupplier = (s) => !!s && s.active !== false && s.status !== 'Inactive';

/** The quote for a job: its converted/accepted quote first, then any linked one. */
export function quoteForJob(job, quotes) {
  if (!job) return null;
  const linked = (quotes || []).filter(
    (q) => q.jobId === job.id || q.id === job.quoteId || (job.quoteNumber && q.number === job.quoteNumber)
  );
  return (
    linked.find((q) => q.id === job.quoteId) ||
    linked.find((q) => q.status === 'Converted' || q.status === 'Accepted') ||
    linked[0] ||
    null
  );
}

/** Every material line on a quote, each with a key that stays stable across runs. */
export function quoteMaterialLines(quote) {
  if (!quote) return [];
  const out = [];
  const take = (items, prefix) =>
    (items || []).forEach((item, idx) => {
      if (!item) return;
      const isMaterial = item.type === 'material' || item.type === 'part' || item.stockId || item.partId;
      if (!isMaterial) return;
      out.push({ item, key: item.id ? String(item.id) : `${prefix}:${idx}` });
    });
  (quote.sections || []).forEach((sec, sIdx) => take(sec.lineItems, `s${sIdx}`));
  take(quote.lineItems, 'l');
  take(quote.items, 'i');
  return out;
}

function matchStock(item, stock) {
  const byId = item.stockId || item.partId;
  if (byId) {
    const hit = stock.find((s) => s.id === byId);
    if (hit) return hit;
  }
  const name = String(item.description || item.name || '').trim().toLowerCase();
  if (!name) return null;
  return stock.find((s) => String(s.name || '').trim().toLowerCase() === name) || null;
}

function supplierOf(part, suppliers) {
  if (!part) return null;
  if (part.supplierId) {
    const hit = suppliers.find((s) => s.id === part.supplierId);
    if (hit) return hit;
  }
  const name = String(part.supplier || '').trim().toLowerCase();
  if (!name) return null;
  return suppliers.find((s) => String(s.name || '').trim().toLowerCase() === name) || null;
}

/** How much of each quote line is already on a (non-cancelled) PO. */
export function orderedQuantities(quoteId, purchaseOrders) {
  const ordered = new Map();
  (purchaseOrders || []).forEach((po) => {
    if (po.status === 'Cancelled') return;
    (po.lineItems || []).forEach((li) => {
      if (li.quoteId !== quoteId || !li.quoteLineKey) return;
      ordered.set(li.quoteLineKey, (ordered.get(li.quoteLineKey) || 0) + (Number(li.quantity) || 0));
    });
  });
  return ordered;
}

/**
 * One row per quote material line: what it is, how many are still to order,
 * the supplier it would go to, and why it's flagged if it can't be placed.
 */
export function planQuotePurchasing({ quote, stock = [], suppliers = [], purchaseOrders = [] }) {
  const ordered = orderedQuantities(quote?.id, purchaseOrders);
  return quoteMaterialLines(quote).map(({ item, key }) => {
    const part = matchStock(item, stock);
    const supplier = supplierOf(part, suppliers);
    const quantity = Number(item.qty ?? item.quantity ?? 1) || 0;
    const alreadyOrdered = ordered.get(key) || 0;

    let issue = null;
    if (!part) issue = 'no_stock';
    else if (!supplier) issue = 'no_supplier';
    else if (!isActiveSupplier(supplier)) issue = 'inactive_supplier';

    return {
      key,
      description: item.description || item.name || (part ? part.name : 'Item'),
      stockId: part ? part.id : '',
      sku: part ? part.sku || '' : '',
      unitCost: round2(part ? part.costPrice ?? item.internalCost ?? 0 : item.internalCost ?? item.costPrice ?? 0),
      quantity,
      alreadyOrdered,
      remaining: Math.max(0, quantity - alreadyOrdered),
      supplierId: issue ? '' : supplier.id,
      supplierName: issue ? '' : supplier.name,
      issue,
    };
  });
}

/**
 * Turn the chosen rows into one draft PO per supplier. Each row needs a
 * `supplierId` and an order `qty`; rows without either are skipped.
 */
export function groupIntoPurchaseOrders(rows, { quote, suppliers = [] }) {
  const bySupplier = new Map();
  (rows || []).forEach((row) => {
    const qty = Number(row.qty) || 0;
    if (!row.supplierId || !(qty > 0)) return;
    const supplier = suppliers.find((s) => s.id === row.supplierId);
    if (!supplier) return;
    if (!bySupplier.has(supplier.id)) {
      bySupplier.set(supplier.id, { supplierId: supplier.id, supplierName: supplier.name, lineItems: [] });
    }
    bySupplier.get(supplier.id).lineItems.push({
      description: row.description,
      sku: row.sku || '',
      stockId: row.stockId || '',
      unitCost: round2(row.unitCost),
      quantity: qty,
      quoteId: quote.id,
      quoteLineKey: row.key,
    });
  });
  return [...bySupplier.values()].map((po) => ({
    ...po,
    total: round2(po.lineItems.reduce((sum, li) => sum + li.quantity * li.unitCost, 0)),
  }));
}
