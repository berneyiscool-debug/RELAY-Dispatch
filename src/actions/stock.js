/**
 * Stock — parts on the shelves and in the vans, and the kits built from them.
 *
 * A stock item holds a `locations` list of `{location, quantity}` rows with
 * `quantity` and `location` kept as the total and the first row, exactly as
 * `StockForm.js` and `utils/storageLocations.js` keep them. The app has no
 * separate movement ledger, so every count, adjustment and transfer here is
 * written to the activity log instead, with its reason.
 */

import { store } from '../data/store.js';
import { defineAction, executeAction } from './registry.js';
import { resolveOne } from './resolve.js';
import { objectSchema, str, num, int, enumOf } from './schema.js';
import { conflict, invalidInput } from './errors.js';
import { logActivity } from './context.js';
import { getStorageLocations } from '../utils/storageLocations.js';

export const stockSearch = {
  label: (item) => `${item.name || item.id}${item.sku ? ` (${item.sku})` : ''}`,
  searchFields: ['name', 'sku', 'supplier', 'category'],
  what: 'stock item',
};

export function resolveStockItem(query) {
  return resolveOne('stock', query, stockSearch).record;
}

/** The location name as the company spells it — an existing row, a storage location, or "On Order". */
function resolveLocation(item, name) {
  const wanted = String(name || '').trim().toLowerCase();
  if (!wanted) throw invalidInput('Which location?');
  if (wanted === 'on order') return 'On Order';
  const known = [
    ...(item?.locations || []).map((row) => row.location),
    ...getStorageLocations().filter((loc) => loc.active !== false).map((loc) => loc.name),
  ];
  const match = known.find((loc) => String(loc).toLowerCase() === wanted);
  if (match) return match;
  const options = [...new Set(getStorageLocations().filter((loc) => loc.active !== false).map((loc) => loc.name))];
  throw invalidInput(`There is no stock location called "${name}".${options.length ? ` Locations: ${options.join(', ')}.` : ''}`);
}

/** Write a new set of location rows, keeping the totals the stock screens read. */
function withLocations(locations) {
  const rows = locations
    .map((row) => ({ location: row.location, quantity: Math.max(0, parseFloat(row.quantity) || 0) }))
    .filter((row) => row.quantity > 0);
  return {
    locations: rows,
    quantity: rows.reduce((sum, row) => sum + row.quantity, 0),
    location: rows[0]?.location || 'Main Warehouse',
  };
}

/** The same alert `StockForm.js` raises when an item reaches its reorder level. */
function reorderAlert(item) {
  const reorderLevel = parseFloat(item.reorderLevel);
  if (!Number.isFinite(reorderLevel) || item.quantity > reorderLevel) return false;
  store.create('notifications', {
    title: 'Stock Auto-Reorder',
    message: `${item.name} (SKU: ${item.sku}) has reached its reorder level. Current quantity: ${item.quantity}. Please reorder from ${item.supplier || 'supplier'}.`,
    read: false,
    link: '/stock',
    origin: 'system',
  });
  return true;
}

const itemFields = {
  sku: str('Stock code. Made up when left out.'),
  category: str('Category, e.g. Cable, Breakers, Fittings.'),
  supplier: str('Usual supplier.'),
  unit: str('Unit it is counted in, e.g. Each, m, Box.'),
  costPrice: num('Cost each, ex GST.'),
  unitPrice: num('Sell price each, ex GST.'),
  reorderLevel: int('Reorder when the total falls to this. Defaults to 10.'),
};

defineAction({
  name: 'create_stock_item',
  title: 'Create stock item',
  description: 'Add a part to the stock list, optionally with an opening quantity at one location.',
  permission: { module: 'Stock', key: 'create' },
  inputSchema: objectSchema(
    {
      name: str('Part name, e.g. "20A RCBO 6kA".'),
      ...itemFields,
      quantity: num('Opening quantity on hand.'),
      location: str('Where the opening quantity is, e.g. "Main Warehouse" or "Van 2". Required with a quantity.'),
    },
    ['name']
  ),
  summarize: (input, result) => `Added ${result.item.name} to stock${result.item.quantity ? ` — ${result.item.quantity} at ${result.item.location}` : ''}.`,
  artifacts: (result) => [{ label: result.item.name, path: `/stock/${result.item.id}` }],
  async run(input) {
    const clash = (store.getAll('stock') || []).find((item) =>
      String(item.name || '').toLowerCase() === input.name.trim().toLowerCase()
      || (input.sku && String(item.sku || '').toLowerCase() === input.sku.toLowerCase()));
    if (clash) throw conflict(`"${clash.name}" is already on the stock list. Update it instead.`);

    let rows = [];
    if (input.quantity) {
      if (!input.location) throw invalidInput('Where is the opening quantity held? Pass a location.');
      rows = [{ location: resolveLocation(null, input.location), quantity: input.quantity }];
    }
    const item = store.create('stock', {
      name: input.name.trim(),
      sku: input.sku || `SKU-${Date.now().toString().slice(-4)}`,
      category: input.category || '',
      supplier: input.supplier || '',
      unit: input.unit || 'Each',
      costPrice: input.costPrice || 0,
      unitPrice: input.unitPrice || 0,
      reorderLevel: input.reorderLevel != null ? input.reorderLevel : 10,
      ...withLocations(rows),
    });
    logActivity({ type: 'stock_created', text: `Stock item ${item.name} added.`, recordType: 'stock', recordId: item.id });
    return { item, reorderAlert: rows.length ? reorderAlert(item) : false };
  },
});

defineAction({
  name: 'update_stock_item',
  title: 'Update stock item',
  description: 'Change a stock item\'s name, code, prices, supplier or reorder level. Quantities change with adjust_stock and transfer_stock.',
  permission: { module: 'Stock', key: 'edit' },
  inputSchema: objectSchema({ item: str('Stock item name, SKU or id.'), name: str('New name.'), ...itemFields }, ['item']),
  summarize: (input, result) => `Updated ${result.item.name} (${result.fields.join(', ')}).`,
  artifacts: (result) => [{ label: result.item.name, path: `/stock/${result.item.id}` }],
  async run(input) {
    const item = resolveStockItem(input.item);
    const patch = {};
    ['name', 'sku', 'category', 'supplier', 'unit', 'costPrice', 'unitPrice', 'reorderLevel'].forEach((key) => {
      if (input[key] != null) patch[key] = typeof input[key] === 'string' ? input[key].trim() : input[key];
    });
    const fields = Object.keys(patch);
    if (!fields.length) throw invalidInput('Nothing to update — pass at least one new value.');
    await store.update('stock', item.id, patch);
    logActivity({ type: 'stock_updated', text: `Stock item ${patch.name || item.name} updated (${fields.join(', ')}).`, recordType: 'stock', recordId: item.id });
    return { item: store.getById('stock', item.id), fields };
  },
});

defineAction({
  name: 'adjust_stock',
  title: 'Adjust stock',
  description:
    'Change how many of a part are held at one location: a stocktake count (`count`, the new total there) or a change (`change`, e.g. -3 for damaged, +10 found). Give a reason. Parts used on a job go through add_job_material instead, so the job is costed.',
  permission: { module: 'Stock', key: 'edit' },
  inputSchema: objectSchema(
    {
      item: str('Stock item name, SKU or id.'),
      location: str('The location, e.g. "Main Warehouse" or "Van 2".'),
      count: num('Stocktake: the quantity actually there now.'),
      change: num('Add (positive) or remove (negative) this many.'),
      reason: str('Why, e.g. "stocktake", "damaged", "returned to supplier".'),
    },
    ['item', 'location', 'reason']
  ),
  summarize: (input, result) => `${result.item.name} at ${result.location}: ${result.from} → ${result.to}. ${result.item.quantity} in total.`,
  artifacts: (result) => [{ label: result.item.name, path: `/stock/${result.item.id}` }],
  async run(input) {
    if ((input.count == null) === (input.change == null)) throw invalidInput('Pass either count (the new quantity there) or change (how many to add or remove), not both.');
    const item = resolveStockItem(input.item);
    const location = resolveLocation(item, input.location);
    const rows = (item.locations || []).map((row) => ({ ...row }));
    const row = rows.find((entry) => entry.location === location);
    const from = row ? (parseFloat(row.quantity) || 0) : 0;
    const to = input.count != null ? input.count : from + input.change;
    if (to < 0) throw invalidInput(`Only ${from} of ${item.name} at ${location} — cannot remove ${-input.change}.`);
    if (row) row.quantity = to; else rows.push({ location, quantity: to });

    await store.update('stock', item.id, withLocations(rows));
    const saved = store.getById('stock', item.id);
    logActivity({ type: 'stock_adjusted', text: `${item.name} at ${location}: ${from} → ${to} (${input.reason}).`, recordType: 'stock', recordId: item.id });
    return { item: saved, location, from, to, reorderAlert: to < from ? reorderAlert(saved) : false };
  },
});

defineAction({
  name: 'transfer_stock',
  title: 'Transfer stock',
  description: 'Move a quantity of a part from one location to another, e.g. restocking a van from the warehouse.',
  permission: { module: 'Stock', key: 'edit' },
  inputSchema: objectSchema(
    {
      item: str('Stock item name, SKU or id.'),
      from: str('Location it is taken from.'),
      to: str('Location it goes to.'),
      quantity: num('How many to move.'),
    },
    ['item', 'from', 'to', 'quantity']
  ),
  summarize: (input, result) => `Moved ${result.quantity} × ${result.item.name} from ${result.from} to ${result.to}.`,
  artifacts: (result) => [{ label: result.item.name, path: `/stock/${result.item.id}` }],
  async run(input) {
    if (!(input.quantity > 0)) throw invalidInput('Quantity must be greater than zero.');
    const item = resolveStockItem(input.item);
    const from = resolveLocation(item, input.from);
    const to = resolveLocation(item, input.to);
    if (from === to) throw invalidInput('The two locations are the same.');
    const rows = (item.locations || []).map((row) => ({ ...row }));
    const source = rows.find((row) => row.location === from);
    const held = source ? (parseFloat(source.quantity) || 0) : 0;
    if (held < input.quantity) throw invalidInput(`Only ${held} of ${item.name} at ${from}.`);
    source.quantity = held - input.quantity;
    const target = rows.find((row) => row.location === to);
    if (target) target.quantity = (parseFloat(target.quantity) || 0) + input.quantity;
    else rows.push({ location: to, quantity: input.quantity });

    await store.update('stock', item.id, withLocations(rows));
    logActivity({ type: 'stock_transferred', text: `${input.quantity} × ${item.name} moved from ${from} to ${to}.`, recordType: 'stock', recordId: item.id });
    return { item: store.getById('stock', item.id), from, to, quantity: input.quantity };
  },
});

defineAction({
  name: 'list_low_stock',
  title: 'List low stock',
  description: 'Parts at or below their reorder level, with what is on order and the usual supplier — the list to raise purchase orders from.',
  permission: { module: 'Stock', key: 'view' },
  readOnly: true,
  inputSchema: objectSchema({ supplier: str('Only parts from this supplier.') }),
  summarize: (input, result) => `${result.items.length} part(s) at or below reorder level.`,
  async run(input) {
    const supplier = String(input.supplier || '').toLowerCase();
    const items = (store.getAll('stock') || [])
      .filter((item) => {
        const level = parseFloat(item.reorderLevel);
        const onHand = (item.locations || []).filter((row) => row.location !== 'On Order').reduce((sum, row) => sum + (parseFloat(row.quantity) || 0), 0);
        return Number.isFinite(level) && onHand <= level && (!supplier || String(item.supplier || '').toLowerCase().includes(supplier));
      })
      .map((item) => ({
        id: item.id,
        name: item.name,
        sku: item.sku,
        supplier: item.supplier || null,
        reorderLevel: item.reorderLevel,
        onHand: (item.locations || []).filter((row) => row.location !== 'On Order').reduce((sum, row) => sum + (parseFloat(row.quantity) || 0), 0),
        onOrder: parseFloat((item.locations || []).find((row) => row.location === 'On Order')?.quantity) || 0,
        costPrice: item.costPrice,
      }));
    return { items };
  },
});

defineAction({
  name: 'add_kit_to_job',
  title: 'Add kit to job',
  description:
    'Put every material in a kit (a saved bundle of parts, e.g. "Split system install kit") onto a job, taking stock off the shelf as add_job_material does. Labour lines in the kit are not materials; the reply lists them so the hours can be put on the job\'s tasks.',
  permission: { module: 'Jobs', key: 'manage_materials' },
  inputSchema: objectSchema(
    {
      kit: str('Kit name or id.'),
      job: str('Job number, title, customer or id.'),
      location: str('Stock location to take the parts from, e.g. "Van 1".'),
      quantity: int('How many of the kit. Defaults to 1.'),
    },
    ['kit', 'job']
  ),
  summarize: (input, result) => `Added ${result.added.length} material line(s) from ${result.kit.name} to job ${result.jobNumber}${result.failed.length ? `, ${result.failed.length} could not be added` : ''}.`,
  async run(input, ctx) {
    const kit = resolveOne('kits', input.kit, { searchFields: ['name', 'category'], what: 'kit' }).record;
    const times = input.quantity || 1;
    const added = [];
    const failed = [];
    const labour = [];
    let jobNumber = input.job;

    for (const line of kit.items || []) {
      if (line.type === 'labor') {
        labour.push({ name: line.name, hours: (parseFloat(line.qty) || 0) * times });
        continue;
      }
      const part = (line.stockId && store.getById('stock', line.stockId)) || null;
      try {
        const outcome = await executeAction('add_job_material', {
          job: input.job,
          part: part ? part.name : line.name,
          quantity: (parseFloat(line.qty) || 1) * times,
          ...(input.location ? { location: input.location } : {}),
          ...(part ? {} : { unitCost: parseFloat(line.costPrice) || 0 }),
        }, ctx);
        jobNumber = outcome.result.job.number;
        added.push({ name: outcome.result.material.partName, quantity: outcome.result.material.quantity, stockNote: outcome.result.stockNote || undefined });
      } catch (error) {
        failed.push({ name: line.name, reason: error.message });
      }
    }

    if (!added.length && failed.length) throw invalidInput(`None of ${kit.name} could be added: ${failed[0].reason}`);
    return { kit: { id: kit.id, name: kit.name }, jobNumber, added, failed, labour };
  },
});
