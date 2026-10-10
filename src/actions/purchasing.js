/**
 * Purchasing — purchase orders and the stock they bring in.
 *
 * A PO is created the way `PurchaseOrderDetail.js` creates it: always a Draft,
 * priced from the sum of its lines. Issuing and receiving are separate steps
 * because they are separate buttons in the UI too, and receiving is the one that
 * moves stock — it reuses `receiveStockIntoLocation`, the same helper the
 * receive modal calls, so the "On Order" pool is cleared exactly once.
 */

import { store } from '../data/store.js';
import { defineAction } from './registry.js';
import { resolveOne } from './resolve.js';
import { objectSchema, str, num, list, objectOf, dateish } from './schema.js';
import { invalidInput, notFound, conflict } from './errors.js';
import { logActivity } from './context.js';
import { resolveJob } from './jobs.js';
import { findStockItem } from './timeMaterials.js';
import { parseDate } from './dates.js';
import { roundCurrency } from '../utils/pricing.js';
import { receiveStockIntoLocation } from '../utils/storageLocations.js';
import { todayLocalISO } from '../utils/dateUtils.js';

const PO_STATUSES = ['Draft', 'Issued', 'Received'];

const poLabel = (po) => (po ? `${po.number || po.id} ${po.supplierName || ''}`.trim() : '');

export const poSearch = {
  label: poLabel,
  searchFields: ['number', 'supplierName', 'jobNumber', 'notes'],
  what: 'purchase order',
};

/** The purchase order a reference like "PO-0041" or "the Reece order" means. */
export function resolvePurchaseOrder(query) {
  return resolveOne('purchaseOrders', query, poSearch).record;
}

function supplierSearch() {
  return { searchFields: ['name', 'contactName', 'email', 'category'], what: 'supplier' };
}

/** The supplier a reference like "Reece" means. Falls back to an exact name match. */
function findSupplier(query) {
  if (!query) return null;
  try {
    return resolveOne('suppliers', query, supplierSearch()).record;
  } catch (error) {
    if (error.code === 'not_found') return null;
    throw error;
  }
}

function supplierScope(query) {
  if (!query) return {};
  const supplier = findSupplier(query);
  if (!supplier) {
    const known = (store.getAll('suppliers') || []).filter((entry) => entry.status !== 'Inactive');
    const names = known.slice(0, 12).map((entry) => entry.name).join(', ');
    throw notFound('supplier', `${query}${names ? ` — known suppliers: ${names}` : ''}`);
  }
  return { supplierId: supplier.id, supplierName: supplier.name };
}

/**
 * Price up one PO line. A line either names a stock part (which brings its id
 * and cost price with it) or is free text — both forms exist in the UI's line
 * item table, so both are accepted here.
 */
function buildLineItems(items) {
  return (items || []).map((item) => {
    const quantity = Number(item.quantity ?? 1) || 0;
    if (!(quantity > 0)) throw invalidInput(`Order at least 1 of "${item.part || item.description}".`);

    if (item.part) {
      const part = findStockItem(item.part);
      if (!part) throw notFound('stock item', item.part);
      const unitCost = Number(item.unitCost ?? part.costPrice ?? 0) || 0;
      return {
        stockId: part.id,
        description: part.name,
        sku: part.sku || '',
        unitCost: roundCurrency(unitCost),
        quantity,
      };
    }

    if (!item.description) throw invalidInput('Each ordered item needs either a part or a description.');
    const unitCost = Number(item.unitCost || 0) || 0;
    return {
      stockId: '',
      description: item.description,
      sku: '',
      unitCost: roundCurrency(unitCost),
      quantity,
    };
  });
}

/** `PurchaseOrderDetail.js` sums the rendered rows, so totals are quantity × unit cost. */
function totalOf(lineItems) {
  return roundCurrency(
    (lineItems || []).reduce((sum, item) => sum + (Number(item.quantity) || 0) * (Number(item.unitCost) || 0), 0)
  );
}

function lineItemSchema() {
  return objectOf(
    {
      part: str('Name or SKU of a stock part. Omit this to order something not in stock.'),
      description: str('Free-text description, used when there is no stock part.'),
      quantity: num('How many. Defaults to 1.'),
      unitCost: num('Cost each, excluding GST. Defaults to the stock part’s cost price.'),
    },
    'One ordered item.',
    []
  );
}

defineAction({
  name: 'create_purchase_order',
  title: 'Raise a purchase order',
  description:
    'Create a Draft purchase order for parts or services from a supplier, optionally against a job. Drafts can still be edited; use issue_purchase_order to send it to the supplier.',
  permission: { module: 'Purchase Orders', key: 'create' },
  inputSchema: objectSchema(
    {
      supplier: str('Supplier name. Must already exist in the supplier list.'),
      items: list(lineItemSchema(), 'What is being ordered.'),
      job: str('Job to charge the order to, e.g. "J-02412". Optional.'),
      expectedDate: dateish('When the parts are expected, e.g. "Friday" or "2026-04-02".'),
      notes: str('Anything else to record on the order.'),
    },
    ['supplier', 'items']
  ),
  summarize: (input, result) => result.summary,
  run: async ({ supplier, items, job, expectedDate, notes }) => {
    const scope = supplierScope(supplier);
    const lineItems = buildLineItems(items);

    const targetJob = job ? resolveJob(job) : null;

    const po = store.create('purchaseOrders', {
      number: store.getNextNumber('PO-', 'purchaseOrders'),
      ...scope,
      jobId: targetJob ? targetJob.id : null,
      jobNumber: targetJob ? targetJob.number : '',
      issueDate: todayLocalISO(),
      expectedDate: expectedDate ? parseDate(expectedDate) : '',
      status: 'Draft',
      lineItems,
      total: totalOf(lineItems),
      notes: notes || '',
    });

    logActivity({
      type: 'purchase_order',
      text: `Purchase order ${po.number} raised with ${po.supplierName}`,
      recordType: 'purchaseOrder',
      recordId: po.id,
    });

    return {
      summary: `Draft purchase order ${po.number} raised with ${po.supplierName} for $${po.total.toFixed(2)}${targetJob ? ` against ${targetJob.number}` : ''}.`,
      purchaseOrder: po,
      job: targetJob,
    };
  },
});

defineAction({
  name: 'update_purchase_order',
  title: 'Edit a purchase order',
  description: 'Change a Draft purchase order — supplier, lines, job, expected date or notes. Issued and received orders cannot be edited.',
  permission: { module: 'Purchase Orders', key: 'create' },
  inputSchema: objectSchema(
    {
      purchaseOrder: str('The order to edit, e.g. "PO-0041".'),
      supplier: str('Replacement supplier.'),
      items: list(lineItemSchema(), 'Replacement lines. Any lines you pass replace the old ones.'),
      job: str('Job to charge the order to.'),
      expectedDate: dateish('When the parts are expected.'),
      notes: str('Replacement notes.'),
    },
    ['purchaseOrder']
  ),
  summarize: (input, result) => result.summary,
  run: async ({ purchaseOrder, supplier, items, job, expectedDate, notes }) => {
    const po = resolvePurchaseOrder(purchaseOrder);
    if (po.status !== 'Draft') {
      throw conflict(`${po.number} is ${po.status.toLowerCase()} — only draft purchase orders can be edited.`);
    }

    const updates = {};
    if (supplier) Object.assign(updates, supplierScope(supplier));
    if (items) {
      updates.lineItems = buildLineItems(items);
      updates.total = totalOf(updates.lineItems);
    }
    if (job) {
      const targetJob = resolveJob(job);
      updates.jobId = targetJob.id;
      updates.jobNumber = targetJob.number;
    }
    if (expectedDate) updates.expectedDate = parseDate(expectedDate);
    if (notes != null) updates.notes = notes;

    const changed = Object.keys(updates).filter((key) => key !== 'lineItems' && key !== 'total');
    if (!Object.keys(updates).length) throw invalidInput('Nothing to change — pass at least one field.');

    store.update('purchaseOrders', po.id, updates);
    const updated = store.getById('purchaseOrders', po.id) || { ...po, ...updates };

    return {
      summary: `Updated ${updated.number}${changed.length ? ` (${changed.join(', ')})` : ' lines'} — now $${(updated.total || 0).toFixed(2)}.`,
      purchaseOrder: updated,
      changed,
    };
  },
});

defineAction({
  name: 'issue_purchase_order',
  title: 'Issue a purchase order',
  description: 'Send a Draft purchase order to the supplier by marking it Issued. This commits the order, so it asks for approval first.',
  permission: { module: 'Purchase Orders', key: 'approve' },
  risky: true,
  inputSchema: objectSchema({ purchaseOrder: str('The order to issue, e.g. "PO-0041".') }, ['purchaseOrder']),
  summarize: (input, result) => result.summary,
  run: async ({ purchaseOrder }) => {
    const po = resolvePurchaseOrder(purchaseOrder);
    if (po.status !== 'Draft') throw conflict(`${po.number} is already ${po.status.toLowerCase()}.`);
    if (!po.lineItems || !po.lineItems.length) throw conflict(`${po.number} has no line items to order.`);

    store.update('purchaseOrders', po.id, { status: 'Issued' });
    const issued = store.getById('purchaseOrders', po.id) || { ...po, status: 'Issued' };

    logActivity({
      type: 'purchase_order',
      text: `Purchase order ${issued.number} issued to ${issued.supplierName}`,
      recordType: 'purchaseOrder',
      recordId: issued.id,
      status: 'Issued',
    });

    return { summary: `${issued.number} issued to ${issued.supplierName} for $${(issued.total || 0).toFixed(2)}.`, purchaseOrder: issued };
  },
});

defineAction({
  name: 'receive_purchase_order',
  title: 'Receive a purchase order',
  description:
    'Book an Issued purchase order in: every ordered stock part is added to the location you name, its On Order quantity is cleared, and the order is marked Received.',
  permission: { module: 'Stock', key: 'edit' },
  risky: true,
  inputSchema: objectSchema(
    {
      purchaseOrder: str('The order to receive, e.g. "PO-0041".'),
      location: str('Where the parts are being put, e.g. "Main Warehouse" or "Van 1".'),
    },
    ['purchaseOrder', 'location']
  ),
  summarize: (input, result) => result.summary,
  run: async ({ purchaseOrder, location }) => {
    const po = resolvePurchaseOrder(purchaseOrder);
    if (po.status === 'Received') throw conflict(`${po.number} has already been received.`);
    if (po.status !== 'Issued') throw conflict(`${po.number} is still a draft — issue it before receiving.`);

    const allStock = store.getAll('stock') || [];
    let received = 0;
    const receivedParts = [];

    for (const item of po.lineItems || []) {
      if (!item.stockId) continue;
      const part = allStock.find((entry) => entry.id === item.stockId);
      if (!part) continue;
      receiveStockIntoLocation(part, location, item.quantity);
      received += 1;
      receivedParts.push(part.name);
    }

    if (received) store.save('stock', allStock);
    store.update('purchaseOrders', po.id, { status: 'Received' });
    const updated = store.getById('purchaseOrders', po.id) || { ...po, status: 'Received' };

    logActivity({
      type: 'purchase_order',
      text: `Purchase order ${updated.number} received${received ? ` into ${location}` : ''}`,
      recordType: 'purchaseOrder',
      recordId: updated.id,
      status: 'Received',
    });

    const detail = received
      ? `${received} part${received === 1 ? '' : 's'} into ${location} (${receivedParts.join(', ')}).`
      : 'Nothing on this order is a stocked part, so no stock moved.';
    return { summary: `${updated.number} marked received — ${detail}`, purchaseOrder: updated, received, location };
  },
});

export { PO_STATUSES };
