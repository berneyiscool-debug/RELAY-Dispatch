import { test, describe } from 'node:test';
import assert from 'node:assert';
import { quoteForJob, planQuotePurchasing, groupIntoPurchaseOrders } from './quotePurchasing.js';

const suppliers = [
  { id: 'sup-reece', name: 'Reece', active: true },
  { id: 'sup-mmem', name: 'MMEM', active: true },
  { id: 'sup-old', name: 'Old Wholesale', active: false },
];

const stock = [
  { id: 'st-gpo', name: 'Double GPO', sku: 'GPO2', costPrice: 6.5, supplierId: 'sup-reece' },
  { id: 'st-rcbo', name: 'RCBO 20A', sku: 'RC20', costPrice: 38, supplier: 'MMEM' },
  { id: 'st-dl', name: 'LED Downlight', sku: 'DL10', costPrice: 12 },
  { id: 'st-tps', name: 'TPS 2.5mm', sku: 'TPS25', costPrice: 1.2, supplierId: 'sup-old' },
];

const quote = {
  id: 'q1',
  number: 'Q-0007',
  sections: [
    {
      lineItems: [
        { id: 'li-gpo', description: 'Double GPO', type: 'material', qty: 4, rate: 14 },
        { id: 'li-rcbo', description: 'rcbo 20a', type: 'material', qty: 2, rate: 70 },
        { id: 'li-lab', description: 'Labour', type: 'labor', qty: 6, rate: 110 },
      ],
    },
    {
      lineItems: [
        { id: 'li-dl', stockId: 'st-dl', description: 'LED Downlight', type: 'material', qty: 8 },
        { id: 'li-tps', description: 'TPS 2.5mm', type: 'material', qty: 50 },
        { description: 'Custom bracket', type: 'material', qty: 1, internalCost: 40 },
      ],
    },
  ],
};

describe('Create POs from quote', () => {
  test('finds the job’s own quote before other linked ones', () => {
    const job = { id: 'j1', quoteId: 'q1' };
    const quotes = [{ id: 'q0', jobId: 'j1', status: 'Draft' }, quote];
    assert.strictEqual(quoteForJob(job, quotes).id, 'q1');
    assert.strictEqual(quoteForJob({ id: 'j2' }, quotes), null);
  });

  test('works out a supplier for every material line and flags the rest', () => {
    const rows = planQuotePurchasing({ quote, stock, suppliers });
    const byKey = Object.fromEntries(rows.map((r) => [r.key, r]));

    assert.deepStrictEqual(Object.keys(byKey), ['li-gpo', 'li-rcbo', 'li-dl', 'li-tps', 's1:2']);
    assert.strictEqual(byKey['li-gpo'].supplierId, 'sup-reece');
    assert.strictEqual(byKey['li-gpo'].unitCost, 6.5, 'priced at cost, not the quoted sell rate');
    assert.strictEqual(byKey['li-rcbo'].supplierId, 'sup-mmem', 'matched by name, supplier by name');
    assert.strictEqual(byKey['li-dl'].issue, 'no_supplier');
    assert.strictEqual(byKey['li-tps'].issue, 'inactive_supplier');
    assert.strictEqual(byKey['s1:2'].issue, 'no_stock');
    assert.strictEqual(byKey['s1:2'].unitCost, 40);
  });

  test('groups chosen lines into one PO per supplier, linked back to the quote', () => {
    const rows = planQuotePurchasing({ quote, stock, suppliers }).map((r) => ({ ...r, qty: r.remaining }));
    // The user picks a supplier for the downlights; the bracket is left without one.
    rows.find((r) => r.key === 'li-dl').supplierId = 'sup-reece';

    const pos = groupIntoPurchaseOrders(rows, { quote, suppliers });
    assert.deepStrictEqual(pos.map((p) => p.supplierName), ['Reece', 'MMEM']);
    assert.deepStrictEqual(pos[0].lineItems.map((li) => li.description), ['Double GPO', 'LED Downlight']);
    assert.strictEqual(pos[0].total, 4 * 6.5 + 8 * 12);
    assert.deepStrictEqual(
      { quoteId: pos[1].lineItems[0].quoteId, quoteLineKey: pos[1].lineItems[0].quoteLineKey },
      { quoteId: 'q1', quoteLineKey: 'li-rcbo' }
    );
  });

  test('only offers what hasn’t already been ordered', () => {
    const purchaseOrders = [
      { status: 'Issued', lineItems: [{ quoteId: 'q1', quoteLineKey: 'li-gpo', quantity: 3 }] },
      { status: 'Cancelled', lineItems: [{ quoteId: 'q1', quoteLineKey: 'li-rcbo', quantity: 2 }] },
      { status: 'Draft', lineItems: [{ quoteId: 'other', quoteLineKey: 'li-rcbo', quantity: 2 }] },
    ];
    const rows = planQuotePurchasing({ quote, stock, suppliers, purchaseOrders });
    const gpo = rows.find((r) => r.key === 'li-gpo');
    const rcbo = rows.find((r) => r.key === 'li-rcbo');
    assert.deepStrictEqual([gpo.alreadyOrdered, gpo.remaining], [3, 1]);
    assert.deepStrictEqual([rcbo.alreadyOrdered, rcbo.remaining], [0, 2]);
  });

  test('skips rows with no supplier or nothing to order', () => {
    const rows = [
      { key: 'a', description: 'A', supplierId: '', qty: 1, unitCost: 1 },
      { key: 'b', description: 'B', supplierId: 'sup-reece', qty: 0, unitCost: 1 },
    ];
    assert.deepStrictEqual(groupIntoPurchaseOrders(rows, { quote, suppliers }), []);
  });
});
