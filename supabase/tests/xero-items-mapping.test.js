/**
 * Tests for the stock → Xero Item mapping (Phase 2a): which Code an item goes
 * with, how existing Xero items are matched, what the payload carries, and that
 * invoice material lines pick up their item's code.
 *
 * Run with: npm run test:migrations
 */
import { describe, test } from 'node:test';
import assert from 'node:assert/strict';
import {
  MappingError,
  buildInvoice,
  buildItem,
  importableItems,
  invoiceStockIds,
  itemCodeFor,
  itemIdempotencyKey,
  itemLookups,
  pickItemMatch,
} from '../functions/_xero/mapping.js';

const stock = (overrides = {}) => ({
  id: '8f3c2a10-1b2c-4d5e-9f00-123456789abc',
  name: 'Tempering valve 15mm',
  sku: 'TV-15',
  unit_price: 145.5,
  cost_price: 82.125,
  updated_at: '2026-10-27T01:00:00.000Z',
  xero_item_id: null,
  xero_item_code: null,
  ...overrides,
});

describe('itemCodeFor', () => {
  test('uses the SKU when it fits', () => {
    assert.equal(itemCodeFor(stock()), 'TV-15');
    assert.equal(itemCodeFor(stock({ sku: '  TV-15  ' })), 'TV-15');
  });

  test('a long or missing SKU falls back to the code already in Xero', () => {
    assert.equal(itemCodeFor(stock({ sku: 'X'.repeat(31), xero_item_code: 'VALVE' })), 'VALVE');
    assert.equal(itemCodeFor(stock({ sku: '', xero_item_code: 'VALVE' })), 'VALVE');
  });

  test('otherwise a stable RELAY code from the id, within 30 characters', () => {
    const code = itemCodeFor(stock({ sku: null }));
    assert.equal(code, 'RELAY-8f3c2a101b2c4d5e9f001234');
    assert.ok(code.length <= 30);
    assert.equal(itemCodeFor(stock({ sku: null })), code, 'same row, same code');
  });

  test('no id at all is a mapping error', () => {
    assert.throws(() => itemCodeFor({ name: 'x' }), MappingError);
  });
});

describe('matching existing Xero items', () => {
  test('looks up by code, then by name', () => {
    assert.deepEqual(itemLookups(stock()).map((l) => l.where), [
      'Code=="TV-15"',
      'Name=="Tempering valve 15mm"',
    ]);
  });

  test('a code match wins over a name match, case-insensitively', () => {
    const byName = { ItemID: 'X-name', Code: 'OTHER', Name: 'tempering valve 15mm' };
    const byCode = { ItemID: 'X-code', Code: 'tv-15', Name: 'Something else' };
    assert.equal(pickItemMatch(stock(), [byName, byCode]).ItemID, 'X-code');
    assert.equal(pickItemMatch(stock(), [byName]).ItemID, 'X-name');
    assert.equal(pickItemMatch(stock(), [{ ItemID: 'X', Code: 'NOPE', Name: 'Nope' }]), null);
    assert.equal(pickItemMatch(stock(), undefined), null);
  });
});

describe('buildItem', () => {
  test('an untracked item with sales and purchase details', () => {
    const item = buildItem(stock(), { settings: { materialsAccountCode: '220', defaultSalesAccountCode: '200', purchasesAccountCode: '300' } });
    assert.deepEqual(item, {
      Code: 'TV-15',
      Name: 'Tempering valve 15mm',
      Description: 'Tempering valve 15mm',
      IsSold: true,
      IsPurchased: true,
      SalesDetails: { UnitPrice: 145.5, AccountCode: '220', TaxType: 'OUTPUT' },
      PurchaseDescription: 'Tempering valve 15mm',
      PurchaseDetails: { UnitPrice: 82.125, AccountCode: '300', TaxType: 'INPUT' },
    });
    assert.equal('IsTrackedAsInventory' in item, false);
  });

  test('no purchases account means sales details only', () => {
    const item = buildItem(stock(), { settings: { defaultSalesAccountCode: '200' } });
    assert.equal(item.IsPurchased, false);
    assert.equal(item.PurchaseDetails, undefined);
    assert.equal(item.SalesDetails.AccountCode, '200');
  });

  test('no sales account still sends the price, without an account', () => {
    assert.deepEqual(buildItem(stock(), {}).SalesDetails, { UnitPrice: 145.5, TaxType: 'OUTPUT' });
  });

  test('a long name is clipped to 50 for Name and kept whole in Description', () => {
    const long = 'Copper pipe type B 15mm x 6m length, annealed, for hot and cold water';
    const item = buildItem(stock({ name: long }));
    assert.equal(item.Name.length, 50);
    assert.equal(item.Description, long);
  });

  test('a linked row updates its Xero item', () => {
    assert.equal(buildItem(stock({ xero_item_id: 'X1' })).ItemID, 'X1');
    assert.equal(buildItem(stock()).ItemID, undefined);
  });

  test('a row with no name is refused', () => {
    assert.throws(() => buildItem(stock({ name: '  ' })), MappingError);
  });

  test('the idempotency key follows the row version', () => {
    assert.notEqual(itemIdempotencyKey(stock()), itemIdempotencyKey(stock({ updated_at: '2026-10-28T01:00:00.000Z' })));
  });
});

describe('importableItems', () => {
  test('keeps id, code, name and prices; drops items with nothing to match on', () => {
    assert.deepEqual(importableItems([
      { ItemID: 'X1', Code: 'TAPE', Name: 'Thread tape', SalesDetails: { UnitPrice: 4.5 }, PurchaseDetails: { UnitPrice: 1.2 } },
      { ItemID: 'X2', Code: '', Name: 'Name only' },
      { ItemID: 'X3' },
      { Code: 'NOID', Name: 'No id' },
    ]), [
      { id: 'X1', code: 'TAPE', name: 'Thread tape', description: null, salePrice: 4.5, purchasePrice: 1.2 },
      { id: 'X2', code: null, name: 'Name only', description: null, salePrice: null, purchasePrice: null },
    ]);
  });
});

describe('invoice lines carry item codes', () => {
  const inv = {
    id: 'inv-1', number: 'INV-1', title: 'Job', status: 'Sent', subtotal: 300, tax: 30, total: 330,
    due_date: '2026-11-19', created_at: '2026-10-19T23:30:00.000Z',
    line_items: {
      sections: [{
        name: 'Job Items',
        lineItems: [
          { description: 'Labour', type: 'labor', qty: 1, rate: 100 },
          { description: 'Tempering valve', type: 'material', qty: 1, rate: 145.5, stockId: 'S1' },
          { description: 'Sundries', type: 'material', qty: 1, rate: 54.5, stockId: 'S-unsynced' },
        ],
      }],
      issueDate: '2026-10-19',
    },
  };

  test('invoiceStockIds lists each stock row once', () => {
    assert.deepEqual(invoiceStockIds(inv), ['S1', 'S-unsynced']);
  });

  test('material lines with a known code get ItemCode; the rest go without', () => {
    const { payload } = buildInvoice(inv, {
      contactId: 'C1', settings: { defaultSalesAccountCode: '200' }, itemCodes: new Map([['S1', 'TV-15']]),
    });
    assert.deepEqual(payload.LineItems.map((l) => l.ItemCode), [undefined, 'TV-15', undefined]);
    assert.equal(payload.LineItems[1].UnitAmount, 145.5, 'RELAY\'s price still wins');
  });
});
