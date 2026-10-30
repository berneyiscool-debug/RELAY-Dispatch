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
import { objectSchema, str, num, int, enumOf, list, bool } from './schema.js';
import { conflict, invalidInput } from './errors.js';
import { logActivity, assertCloudOnly } from './context.js';
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

// ── Kits ────────────────────────────────────────────────────────────────

export function resolveKit(query) {
  return resolveOne('kits', query, {
    label: (kit) => kit.name || kit.id,
    searchFields: ['name', 'category', 'description'],
    what: 'kit',
  }).record;
}

const kitItemSchema = () => {
  return {
    type: 'object',
    properties: {
      type: { type: 'string', enum: ['material', 'labor'], description: 'Material parts the job uses, or a labour allowance. Defaults to material.' },
      name: { type: 'string', description: 'Part or labour description.' },
      stockItem: { type: 'string', description: 'Stock item to link this line to, so job use takes stock off the shelf.' },
      quantity: { type: 'number', description: 'How many. Defaults to 1.' },
      unit: { type: 'string', description: 'Unit, e.g. Each, m, Box.' },
      costPrice: { type: 'number', description: 'Cost each, ex GST. Defaults to the stock item\'s cost.' },
      unitPrice: { type: 'number', description: 'Sell price each, ex GST. Defaults to the stock item\'s price.' },
    },
    required: ['name'],
    additionalProperties: false,
  };
};

function buildKitItems(items) {
  return (items || []).map((item) => {
    const stock = item.stockItem ? resolveStockItem(item.stockItem) : null;
    const qty = Number(item.quantity ?? 1) || 1;
    return {
      id: store.generateId(),
      type: item.type === 'labor' ? 'labor' : 'material',
      name: item.name || stock?.name || 'Item',
      sku: stock?.sku || '',
      qty,
      unit: item.unit || stock?.unit || 'Each',
      costPrice: Number(item.costPrice ?? stock?.costPrice ?? 0) || 0,
      unitPrice: Number(item.unitPrice ?? stock?.unitPrice ?? 0) || 0,
      ...(stock ? { stockId: stock.id } : {}),
    };
  });
}

/** The totals the kit screen shows, including the combined-rate margin override. */
function kitTotals(items, { marginOverrideEnabled, marginOverride } = {}) {
  const totalCost = (items || []).reduce((sum, item) => sum + (Number(item.qty) || 0) * (Number(item.costPrice) || 0), 0);
  const listPrice = (items || []).reduce((sum, item) => sum + (Number(item.qty) || 0) * (Number(item.unitPrice) || 0), 0);
  const override = Number(marginOverride);
  const useOverride = !!marginOverrideEnabled && Number.isFinite(override) && override > 0 && override < 100;
  return {
    totalCost: Math.round(totalCost * 100) / 100,
    totalPrice: Math.round((useOverride ? totalCost / (1 - override / 100) : listPrice) * 100) / 100,
  };
}

defineAction({
  name: 'list_kits',
  title: 'List kits',
  description: 'List the saved kits — bundles of parts and labour used on a job — with what each contains.',
  permission: { module: 'Stock', key: 'view' },
  readOnly: true,
  inputSchema: objectSchema({}),
  summarize: (input, result) => `${result.kits.length} kit(s).`,
  run: async () => ({
    kits: (store.getAll('kits') || []).map((kit) => ({
      id: kit.id,
      name: kit.name,
      category: kit.category || '',
      items: (kit.items || []).length,
      totalCost: kit.totalCost || 0,
      totalPrice: kit.totalPrice || 0,
      active: kit.active !== false,
    })),
  }),
});

defineAction({
  name: 'create_kit',
  title: 'Create kit',
  description:
    'Build a saved kit — the parts and labour a standard job uses, e.g. "Split system install kit". Add it to a job with add_kit_to_job.',
  permission: { module: 'Stock', key: 'create' },
  inputSchema: objectSchema(
    {
      name: str('Kit name.'),
      category: str('Category, e.g. Air Conditioning.'),
      description: str('What the kit is for.'),
      items: list(kitItemSchema(), 'The parts and labour lines in the kit.'),
      marginOverrideEnabled: { type: 'boolean', description: 'Price the kit on a target margin instead of the sum of its sell prices.' },
      marginOverride: num('Target margin percent, 0-99.9. Only used when marginOverrideEnabled is true.'),
    },
    ['name', 'items']
  ),
  summarize: (input, result) => result.summary,
  run: async ({ name, category, description, items, marginOverrideEnabled, marginOverride }) => {
    const kitItems = buildKitItems(items);
    const totals = kitTotals(kitItems, { marginOverrideEnabled, marginOverride });
    const kit = store.create('kits', {
      name: name.trim(),
      category: category || '',
      description: description || '',
      active: true,
      items: kitItems,
      marginOverrideEnabled: !!marginOverrideEnabled,
      marginOverride: marginOverride ?? null,
      ...totals,
    });
    logActivity({ type: 'kit_created', text: `Kit ${kit.name} created (${kitItems.length} line${kitItems.length === 1 ? '' : 's'}).`, recordType: 'kit', recordId: kit.id });
    return {
      summary: `Created kit ${kit.name} with ${kitItems.length} line${kitItems.length === 1 ? '' : 's'} ($${totals.totalPrice.toFixed(2)} sell, $${totals.totalCost.toFixed(2)} cost).`,
      kit,
    };
  },
  artifacts: (result) => [{ label: result.kit.name, path: `/kits/${result.kit.id}` }],
});

defineAction({
  name: 'update_kit',
  title: 'Update kit',
  description: 'Rename a kit, change its category or description, mark it inactive, or replace its contents.',
  permission: { module: 'Stock', key: 'edit' },
  inputSchema: objectSchema(
    {
      kit: str('Kit name or id.'),
      name: str('New name.'),
      category: str('New category.'),
      description: str('New description.'),
      active: { type: 'boolean', description: 'false to stop offering the kit.' },
      items: list(kitItemSchema(), 'Replacement contents. The existing lines are replaced.'),
      marginOverrideEnabled: { type: 'boolean', description: 'Price on a target margin instead of sell prices.' },
      marginOverride: num('Target margin percent, 0-99.9.'),
    },
    ['kit']
  ),
  summarize: (input, result) => result.summary,
  run: async ({ kit: reference, name, category, description, active, items, marginOverrideEnabled, marginOverride }) => {
    const kit = resolveKit(reference);
    const patch = {};
    const fields = [];
    if (name != null) { patch.name = name.trim(); fields.push('name'); }
    if (category != null) { patch.category = category; fields.push('category'); }
    if (description != null) { patch.description = description; fields.push('description'); }
    if (active != null) { patch.active = !!active; fields.push('active'); }
    if (marginOverrideEnabled != null) { patch.marginOverrideEnabled = !!marginOverrideEnabled; fields.push('margin'); }
    if (marginOverride !== undefined) { patch.marginOverride = marginOverride; fields.push('margin'); }
    if (items != null) {
      patch.items = buildKitItems(items);
      fields.push('items');
    }
    if (!fields.length) throw invalidInput('Nothing to update — pass at least one new value.');
    const next = { ...kit, ...patch };
    Object.assign(patch, kitTotals(next.items, next));
    await store.update('kits', kit.id, patch);
    const updated = store.getById('kits', kit.id);
    logActivity({ type: 'kit_updated', text: `Kit ${updated.name} updated (${fields.join(', ')}).`, recordType: 'kit', recordId: kit.id });
    return { summary: `Updated kit ${updated.name} (${fields.join(', ')}).`, kit: updated, fields };
  },
  artifacts: (result) => [{ label: result.kit.name, path: `/kits/${result.kit.id}` }],
});

defineAction({
  name: 'delete_kit',
  title: 'Delete kit',
  description: 'Permanently delete a saved kit. Jobs already given its parts are not affected. This cannot be undone.',
  permission: { module: 'Stock', key: 'delete' },
  risky: true,
  inputSchema: objectSchema(
    {
      kit: str('Kit name or id.'),
      reason: str('Why the kit is being deleted.'),
    },
    ['kit']
  ),
  summarize: (input, result) => result.summary,
  run: async ({ kit: reference, reason }) => {
    const kit = resolveKit(reference);
    const snapshot = { id: kit.id, name: kit.name, items: (kit.items || []).length };
    await store.delete('kits', kit.id);
    logActivity({
      type: 'kit_deleted',
      text: `Kit ${snapshot.name} deleted${reason ? ` — ${reason}` : ''}.`,
      recordType: 'kit',
      recordId: snapshot.id,
    });
    return { summary: `Deleted kit ${snapshot.name}.`, kit: snapshot, reason: reason || null };
  },
});

defineAction({
  name: 'delete_stock_item',
  title: 'Delete stock item',
  description:
    'Permanently delete a part from the stock list. This cannot be undone. Job materials and kits that used it keep their line, but new stock movements will not find it. Use update_stock_item to stop using it without erasing the history.',
  permission: { module: 'Stock', key: 'delete' },
  risky: true,
  inputSchema: objectSchema(
    {
      item: str('Stock item name or SKU.'),
      reason: str('Why the item is being deleted.'),
    },
    ['item']
  ),
  summarize: (input, result) => result.summary,
  run: async ({ item: reference, reason }) => {
    const item = resolveStockItem(reference);
    const kits = (store.getAll('kits') || []).filter((kit) => (kit.items || []).some((line) => line.stockId === item.id)).length;
    const snapshot = { id: item.id, name: item.name, sku: item.sku || null, quantity: item.quantity || 0 };
    await store.delete('stock', item.id);
    logActivity({
      type: 'stock_deleted',
      text: `Stock item ${snapshot.name}${snapshot.sku ? ` (${snapshot.sku})` : ''} deleted${reason ? ` — ${reason}` : ''}.`,
      recordType: 'stock',
      recordId: snapshot.id,
    });
    return {
      summary: `Deleted stock item ${snapshot.name}${snapshot.sku ? ` (${snapshot.sku})` : ''}${kits ? `; ${kits} kit${kits === 1 ? '' : 's'} still list it` : ''}.`,
      item: snapshot,
      usedByKits: kits,
      reason: reason || null,
    };
  },
});

defineAction({
  name: 'duplicate_kit',
  title: 'Duplicate a kit',
  description: 'Copy a kit and its contents into a new kit, so a variation can be built without changing the original.',
  permission: { module: 'Stock', key: 'create' },
  inputSchema: objectSchema(
    {
      kit: str('Kit name or id.'),
      name: str('Name for the copy. Defaults to the original plus " (Copy)".'),
    },
    ['kit']
  ),
  summarize: (input, result) => result.summary,
  run: async ({ kit: reference, name }) => {
    const kit = resolveKit(reference);
    const copy = JSON.parse(JSON.stringify(kit));
    delete copy.id;
    copy.name = name ? String(name).trim() : `${kit.name} (Copy)`;
    copy.createdAt = new Date().toISOString();
    copy.updatedAt = new Date().toISOString();
    copy.items = (copy.items || []).map((item) => ({ ...item, id: store.generateId() }));
    const created = store.create('kits', copy);
    logActivity({ type: 'kit_created', text: `Kit ${created.name} duplicated from ${kit.name}.`, recordType: 'kit', recordId: created.id });
    return { summary: `Created ${created.name} from ${kit.name}.`, kit: created };
  },
  artifacts: (result) => [{ label: result.kit.name, path: `/kits/${result.kit.id}` }],
});

defineAction({
  name: 'bulk_update_stock',
  title: 'Bulk update stock',
  description:
    'Change the category of several stock items at once, adjust their sell prices by a percentage, or do both. This is a bulk change, so it asks for approval first.',
  permission: { module: 'Stock', key: 'edit' },
  risky: true,
  inputSchema: objectSchema(
    {
      items: list(str('A stock item name or SKU.'), 'The items to change.'),
      category: str('New category for every item.'),
      pricePercent: num('Adjust the sell price by this percentage, e.g. 5 or -5.'),
    },
    ['items']
  ),
  summarize: (input, result) => result.summary,
  run: async ({ items, category, pricePercent }) => {
    if (category == null && pricePercent == null) throw invalidInput('Pass a category, a price percent, or both.');
    if (pricePercent != null && !Number.isFinite(Number(pricePercent))) throw invalidInput('The price percent must be a number.');
    const factor = 1 + (Number(pricePercent) || 0) / 100;
    const changed = [];
    const failed = [];
    for (const reference of items) {
      try {
        const item = resolveStockItem(reference);
        const patch = {};
        if (category != null) patch.category = String(category).trim();
        if (pricePercent != null) patch.unitPrice = Math.round((Number(item.unitPrice) || 0) * factor * 100) / 100;
        await store.update('stock', item.id, patch);
        changed.push({ id: item.id, name: item.name, category: patch.category ?? item.category, unitPrice: patch.unitPrice ?? item.unitPrice });
      } catch (error) {
        failed.push({ item: reference, reason: error.message });
      }
    }
    if (!changed.length) throw invalidInput(`No stock items were updated${failed.length ? `: ${failed[0].reason}` : ''}.`);
    logActivity({
      type: 'stock_bulk_updated',
      text: `${changed.length} stock item(s) updated${category != null ? ` to category ${category}` : ''}${pricePercent != null ? ` with prices ${pricePercent > 0 ? '+' : ''}${pricePercent}%` : ''}.`,
    });
    return {
      summary: `Updated ${changed.length} stock item(s)${category != null ? ` to ${category}` : ''}${pricePercent != null ? ` with prices ${pricePercent > 0 ? '+' : ''}${pricePercent}%` : ''}${failed.length ? `; ${failed.length} could not be found` : ''}.`,
      changed,
      failed,
    };
  },
});

defineAction({
  name: 'push_stock_to_xero',
  title: 'Send stock to Xero',
  description: 'Send stock items that are not in Xero yet, or update the ones that are. Check the result with get_xero_sync.',
  permission: { module: 'Stock', key: 'edit' },
  risky: true,
  cloudOnly: true,
  inputSchema: objectSchema({}),
  summarize: (input, result) => result.summary,
  run: async () => {
    assertCloudOnly('Xero');
    const { xeroEnabled, pushStockToXero } = await import('../utils/xero.js');
    if (!xeroEnabled()) return { summary: 'Xero is not available on this account.', queued: 0 };
    const queued = await pushStockToXero('missing');
    logActivity({ type: 'xero_stock_push', text: queued ? `Queued ${queued} stock item(s) for Xero.` : 'Stock checked — everything is already in Xero.' });
    return { summary: queued ? `Queued ${queued} stock item(s) for Xero.` : 'Every stock item is already in Xero or queued.', queued };
  },
});

defineAction({
  name: 'import_xero_items',
  title: 'Import stock from Xero',
  description: 'Preview or import Xero items as stock. Preview only counts; confirm links matching items by SKU then name and adds the rest at zero quantity.',
  permission: { module: 'Stock', key: 'edit' },
  risky: true,
  cloudOnly: true,
  inputSchema: objectSchema({ confirm: bool('Import for real. Leave false to preview the counts.') }),
  summarize: (input, result) => result.summary,
  run: async ({ confirm }) => {
    assertCloudOnly('Xero');
    const { importXeroItems } = await import('../utils/xero.js');
    const result = await importXeroItems(confirm ? 'confirm' : 'preview');
    logActivity({ type: 'xero_stock_import', text: `${confirm ? 'Imported' : 'Previewed'} Xero items (${result.linked || 0} linked, ${result.created || 0} new).` });
    return {
      summary: confirm
        ? `Imported Xero items — ${result.linked || 0} linked to existing stock, ${result.created || 0} added.`
        : `Preview: ${result.linked || 0} Xero items match existing stock and ${result.created || 0} would be added. Pass confirm to import.`,
      import: result,
      applied: !!result.applied,
    };
  },
});
