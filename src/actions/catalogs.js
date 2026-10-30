/**
 * The catalogues Settings maintains: storage locations and their types, kit
 * types, cost centres and tasklist templates.
 *
 * The same helpers the Settings screens call are used here, so a rename still
 * moves every stock row and job material with it, and a location that holds stock
 * still cannot be deleted.
 */

import { store } from '../data/store.js';
import { defineAction } from './registry.js';
import { objectSchema, str, num, bool, list, objectOf } from './schema.js';
import { conflict, invalidInput, notFound } from './errors.js';
import { logActivity } from './context.js';
import {
  getStorageLocations,
  getStockHeldAtLocation,
  renameStorageLocation,
} from '../utils/storageLocations.js';
import { getActiveLocationTypes, getLocationTypes, renameLocationType } from '../utils/locationTypes.js';
import { createKitType, getKitTypes, renameKitType } from '../utils/kitTypes.js';
import { findTechnician } from './leads.js';

const SETTINGS_EDIT = { module: 'Settings', key: 'edit_company' };
const STOCK_VIEW = { module: 'Stock', key: 'view' };
const STOCK_CREATE = { module: 'Stock', key: 'create' };
const STOCK_EDIT = { module: 'Stock', key: 'edit' };

function byName(rows, query, what) {
  const text = String(query || '').trim().toLowerCase();
  const hit = (rows || []).find((row) => String(row.name || '').toLowerCase() === text || String(row.id) === String(query));
  if (!hit) throw notFound(what, query);
  return hit;
}

// ── Storage locations ───────────────────────────────────────────────────

defineAction({
  name: 'list_storage_locations',
  title: 'List storage locations',
  description: 'List where stock is kept — warehouses, vans, site containers — with their type, assigned technician and how many items they hold.',
  permission: STOCK_VIEW,
  readOnly: true,
  inputSchema: objectSchema({}),
  summarize: (input, result) => `${result.locations.length} storage location(s).`,
  run: async () => {
    const technicians = store.getAll('technicians') || [];
    return {
      locations: getStorageLocations().map((location) => ({
        id: location.id,
        name: location.name,
        type: location.type || 'Warehouse',
        technician: technicians.find((person) => person.id === location.technicianId)?.name || null,
        active: location.active !== false,
        itemsHeld: getStockHeldAtLocation(location.name),
      })),
      types: getActiveLocationTypes().map((type) => type.name),
    };
  },
});

defineAction({
  name: 'create_storage_location',
  title: 'Create a storage location',
  description: 'Add a warehouse, vehicle or other place stock is kept. The type must be one of the active location types.',
  permission: STOCK_CREATE,
  inputSchema: objectSchema(
    {
      name: str('Location name, e.g. "Van 4" or "Yard container".'),
      type: str('Location type, e.g. Warehouse or Vehicle.'),
      technician: str('Technician the vehicle is assigned to. Vehicle types only.'),
    },
    ['name', 'type']
  ),
  summarize: (input, result) => result.summary,
  run: async ({ name, type, technician }) => {
    const clean = String(name).trim();
    if ((store.getAll('storageLocations') || []).some((location) => String(location.name).toLowerCase() === clean.toLowerCase())) {
      throw conflict(`A storage location called "${clean}" already exists.`);
    }
    const activeTypes = getActiveLocationTypes();
    const match = activeTypes.find((entry) => String(entry.name).toLowerCase() === String(type).toLowerCase());
    if (!match) throw invalidInput(`There is no active location type called "${type}". Types: ${activeTypes.map((entry) => entry.name).join(', ')}.`);
    const person = technician ? findTechnician(technician) : null;
    if (technician && !person) throw notFound('technician', technician);
    const location = store.create('storageLocations', {
      name: clean,
      type: match.name,
      technicianId: match.name === 'Vehicle' ? person?.id || null : null,
      active: true,
    });
    logActivity({ type: 'storage_location_created', text: `Storage location ${clean} (${match.name}) created.` });
    return { summary: `Created storage location ${clean} (${match.name}).`, location };
  },
});

defineAction({
  name: 'update_storage_location',
  title: 'Update a storage location',
  description:
    'Rename a storage location or change its type, assigned technician or active state. Renaming moves every stock row and job material with it.',
  permission: STOCK_EDIT,
  inputSchema: objectSchema(
    {
      location: str('Current location name or id.'),
      name: str('New name.'),
      type: str('New location type.'),
      technician: str('Technician for a vehicle. Leave empty to unassign.'),
      active: bool('false to retire the location. It must hold no stock.'),
    },
    ['location']
  ),
  summarize: (input, result) => result.summary,
  run: async ({ location: reference, name, type, technician, active }) => {
    const existing = byName(store.getAll('storageLocations') || [], reference, 'storage location');
    const patch = {};
    const fields = [];
    if (name != null) {
      const clean = String(name).trim();
      if (!clean) throw invalidInput('A location name is required.');
      if ((store.getAll('storageLocations') || []).some((row) => row.id !== existing.id && String(row.name).toLowerCase() === clean.toLowerCase())) {
        throw conflict(`A storage location called "${clean}" already exists.`);
      }
      patch.name = clean;
      fields.push('name');
    }
    if (type != null) {
      const match = getActiveLocationTypes().find((entry) => String(entry.name).toLowerCase() === String(type).toLowerCase());
      if (!match) throw invalidInput(`There is no active location type called "${type}".`);
      patch.type = match.name;
      fields.push('type');
    }
    if (technician !== undefined) {
      const person = technician ? findTechnician(technician) : null;
      if (technician && !person) throw notFound('technician', technician);
      patch.technicianId = person?.id || null;
      fields.push('technician');
    }
    if (active != null) {
      if (!active) {
        const held = getStockHeldAtLocation(existing.name);
        if (held > 0) throw invalidInput(`${existing.name} still holds ${held} item(s), so it cannot be deactivated.`);
      }
      patch.active = !!active;
      fields.push('active');
    }
    if (!fields.length) throw invalidInput('Nothing to update — pass at least one new value.');
    if (patch.name && patch.name !== existing.name) renameStorageLocation(existing.name, patch.name);
    await store.update('storageLocations', existing.id, patch);
    logActivity({ type: 'storage_location_updated', text: `Storage location ${patch.name || existing.name} updated (${fields.join(', ')}).` });
    return { summary: `Updated ${patch.name || existing.name} (${fields.join(', ')}).`, location: store.getById('storageLocations', existing.id) };
  },
});

defineAction({
  name: 'delete_storage_location',
  title: 'Delete a storage location',
  description: 'Permanently delete a storage location that holds no stock. This cannot be undone.',
  permission: { module: 'Stock', key: 'delete' },
  risky: true,
  inputSchema: objectSchema({ location: str('Location name or id.'), reason: str('Why it is being deleted.') }, ['location']),
  summarize: (input, result) => result.summary,
  run: async ({ location: reference, reason }) => {
    const existing = byName(store.getAll('storageLocations') || [], reference, 'storage location');
    const held = getStockHeldAtLocation(existing.name);
    if (held > 0) throw invalidInput(`${existing.name} still holds ${held} item(s). Move the stock before deleting it.`);
    await store.delete('storageLocations', existing.id);
    logActivity({ type: 'storage_location_deleted', text: `Storage location ${existing.name} deleted${reason ? ` — ${reason}` : ''}.` });
    return { summary: `Deleted storage location ${existing.name}.`, location: { id: existing.id, name: existing.name }, reason: reason || null };
  },
});

// ── Location types ──────────────────────────────────────────────────────

defineAction({
  name: 'list_location_types',
  title: 'List location types',
  description: 'List the location types storage locations are grouped under, e.g. Warehouse, Vehicle.',
  permission: STOCK_VIEW,
  readOnly: true,
  inputSchema: objectSchema({}),
  summarize: (input, result) => `${result.types.length} location type(s).`,
  run: async () => ({ types: getLocationTypes() }),
});

defineAction({
  name: 'create_location_type',
  title: 'Create a location type',
  description: 'Add a new type of place stock is kept — Warehouse, Vehicle, Site Container, and so on.',
  permission: STOCK_CREATE,
  inputSchema: objectSchema({ name: str('Type name.') }, ['name']),
  summarize: (input, result) => result.summary,
  run: async ({ name }) => {
    const clean = String(name).trim();
    if (!clean) throw invalidInput('A type name is required.');
    if (getLocationTypes().some((type) => String(type.name).toLowerCase() === clean.toLowerCase())) {
      throw conflict(`A location type called "${clean}" already exists.`);
    }
    const type = store.create('locationTypes', { name: clean, active: true });
    logActivity({ type: 'location_type_created', text: `Location type ${clean} created.` });
    return { summary: `Created location type ${clean}.`, type };
  },
});

defineAction({
  name: 'update_location_type',
  title: 'Update a location type',
  description: 'Rename a location type (every storage location follows) or retire one that nothing uses.',
  permission: STOCK_EDIT,
  inputSchema: objectSchema(
    {
      locationType: str('Current type name or id.'),
      name: str('New name.'),
      active: bool('false to retire the type. It must not be in use.'),
    },
    ['locationType']
  ),
  summarize: (input, result) => result.summary,
  run: async ({ locationType: reference, name, active }) => {
    const existing = byName(getLocationTypes(), reference, 'location type');
    const inUse = (store.getAll('storageLocations') || []).filter((location) => location.type === existing.name).length;
    const patch = {};
    const fields = [];
    if (name != null) {
      const clean = String(name).trim();
      if (!clean) throw invalidInput('A type name is required.');
      if (getLocationTypes().some((type) => type.id !== existing.id && String(type.name).toLowerCase() === clean.toLowerCase())) {
        throw conflict(`A location type called "${clean}" already exists.`);
      }
      patch.name = clean;
      fields.push('name');
    }
    if (active != null) {
      if (!active && inUse) throw invalidInput(`${existing.name} is used by ${inUse} location(s), so it cannot be retired.`);
      patch.active = !!active;
      fields.push('active');
    }
    if (!fields.length) throw invalidInput('Nothing to update — pass at least one new value.');
    if (patch.name && patch.name !== existing.name) renameLocationType(existing.name, patch.name);
    await store.update('locationTypes', existing.id, patch);
    logActivity({ type: 'location_type_updated', text: `Location type ${patch.name || existing.name} updated.` });
    return { summary: `Updated location type ${patch.name || existing.name} (${fields.join(', ')}).`, type: store.getById('locationTypes', existing.id) };
  },
});

defineAction({
  name: 'delete_location_type',
  title: 'Delete a location type',
  description: 'Permanently delete a location type that no storage location uses.',
  permission: { module: 'Stock', key: 'delete' },
  risky: true,
  inputSchema: objectSchema({ locationType: str('Type name or id.'), reason: str('Why it is being deleted.') }, ['locationType']),
  summarize: (input, result) => result.summary,
  run: async ({ locationType: reference, reason }) => {
    const existing = byName(getLocationTypes(), reference, 'location type');
    const inUse = (store.getAll('storageLocations') || []).filter((location) => location.type === existing.name).length;
    if (inUse) throw invalidInput(`${existing.name} is used by ${inUse} location(s). Change them first.`);
    await store.delete('locationTypes', existing.id);
    logActivity({ type: 'location_type_deleted', text: `Location type ${existing.name} deleted${reason ? ` — ${reason}` : ''}.` });
    return { summary: `Deleted location type ${existing.name}.`, type: { id: existing.id, name: existing.name }, reason: reason || null };
  },
});

// ── Kit types ───────────────────────────────────────────────────────────

defineAction({
  name: 'list_kit_types',
  title: 'List kit types',
  description: 'List the types kits are grouped under, and how many kits use each.',
  permission: STOCK_VIEW,
  readOnly: true,
  inputSchema: objectSchema({}),
  summarize: (input, result) => `${result.types.length} kit type(s).`,
  run: async () => ({
    types: getKitTypes().map((type) => ({
      id: type.id,
      name: type.name,
      active: type.active !== false,
      kits: (store.getAll('kits') || []).filter((kit) => kit.category === type.name).length,
    })),
  }),
});

defineAction({
  name: 'create_kit_type',
  title: 'Create a kit type',
  description: 'Add a kit type so kits can be grouped and filtered by it.',
  permission: STOCK_CREATE,
  inputSchema: objectSchema({ name: str('Kit type name, e.g. Air Conditioning.') }, ['name']),
  summarize: (input, result) => result.summary,
  run: async ({ name }) => {
    const clean = String(name).trim();
    if (!clean) throw invalidInput('A kit type name is required.');
    if (getKitTypes().some((type) => String(type.name).toLowerCase() === clean.toLowerCase())) {
      throw conflict(`A kit type called "${clean}" already exists.`);
    }
    const created = createKitType(clean);
    logActivity({ type: 'kit_type_created', text: `Kit type ${clean} created.` });
    return { summary: `Created kit type ${clean}.`, type: created };
  },
});

defineAction({
  name: 'update_kit_type',
  title: 'Update a kit type',
  description: 'Rename a kit type (kits follow) or retire one no kit uses.',
  permission: STOCK_EDIT,
  inputSchema: objectSchema(
    {
      kitType: str('Current kit type name or id.'),
      name: str('New name.'),
      active: bool('false to retire the type. It must not be used by a kit.'),
    },
    ['kitType']
  ),
  summarize: (input, result) => result.summary,
  run: async ({ kitType: reference, name, active }) => {
    const existing = byName(getKitTypes(), reference, 'kit type');
    const inUse = (store.getAll('kits') || []).filter((kit) => kit.category === existing.name).length;
    const patch = {};
    const fields = [];
    if (name != null) {
      const clean = String(name).trim();
      if (!clean) throw invalidInput('A kit type name is required.');
      if (getKitTypes().some((type) => type.id !== existing.id && String(type.name).toLowerCase() === clean.toLowerCase())) {
        throw conflict(`A kit type called "${clean}" already exists.`);
      }
      patch.name = clean;
      fields.push('name');
    }
    if (active != null) {
      if (!active && inUse) throw invalidInput(`${existing.name} is used by ${inUse} kit(s), so it cannot be retired.`);
      patch.active = !!active;
      fields.push('active');
    }
    if (!fields.length) throw invalidInput('Nothing to update — pass at least one new value.');
    if (patch.name && patch.name !== existing.name) renameKitType(existing.name, patch.name);
    await store.update('kitTypes', existing.id, patch);
    logActivity({ type: 'kit_type_updated', text: `Kit type ${patch.name || existing.name} updated.` });
    return { summary: `Updated kit type ${patch.name || existing.name} (${fields.join(', ')}).`, type: store.getById('kitTypes', existing.id) };
  },
});

defineAction({
  name: 'delete_kit_type',
  title: 'Delete a kit type',
  description: 'Permanently delete a kit type no kit uses.',
  permission: { module: 'Stock', key: 'delete' },
  risky: true,
  inputSchema: objectSchema({ kitType: str('Kit type name or id.'), reason: str('Why it is being deleted.') }, ['kitType']),
  summarize: (input, result) => result.summary,
  run: async ({ kitType: reference, reason }) => {
    const existing = byName(getKitTypes(), reference, 'kit type');
    const inUse = (store.getAll('kits') || []).filter((kit) => kit.category === existing.name).length;
    if (inUse) throw invalidInput(`${existing.name} is used by ${inUse} kit(s). Change them first.`);
    await store.delete('kitTypes', existing.id);
    logActivity({ type: 'kit_type_deleted', text: `Kit type ${existing.name} deleted${reason ? ` — ${reason}` : ''}.` });
    return { summary: `Deleted kit type ${existing.name}.`, type: { id: existing.id, name: existing.name }, reason: reason || null };
  },
});

// ── Cost centres ────────────────────────────────────────────────────────

function costCenterLabel(center) {
  return center ? `${center.code || ''} ${center.name || ''}`.trim() || center.id : '';
}

function resolveCostCenter(query) {
  const text = String(query || '').trim().toLowerCase();
  const hit = (store.getAll('costCenters') || []).find((center) =>
    String(center.id) === String(query)
    || String(center.code || '').toLowerCase() === text
    || String(center.name || '').toLowerCase() === text);
  if (!hit) throw notFound('cost center', query);
  return hit;
}

defineAction({
  name: 'list_cost_centers',
  title: 'List cost centres',
  description: 'List the cost centres used for accounting and Xero tracking, with their codes, active state and Xero account codes.',
  permission: { module: 'Reports', key: 'view' },
  readOnly: true,
  inputSchema: objectSchema({ includeInactive: bool('Include retired cost centres.') }),
  summarize: (input, result) => `${result.costCenters.length} cost centre(s).`,
  run: async ({ includeInactive }) => ({
    costCenters: (store.getAll('costCenters') || [])
      .filter((center) => includeInactive || center.active !== false)
      .map((center) => ({
        id: center.id,
        code: center.code,
        name: center.name,
        active: center.active !== false,
        salesAccountCode: center.xeroSalesAccountCode || '',
        expenseAccountCode: center.xeroExpenseAccountCode || '',
        trackingCategory: center.xeroTrackingCategoryName || '',
        trackingOption: center.xeroTrackingOptionName || '',
      })),
  }),
});

defineAction({
  name: 'create_cost_center',
  title: 'Create a cost centre',
  description: 'Add a cost centre with its code and name, optionally mapping it to Xero sales and expense accounts and a tracking option.',
  permission: SETTINGS_EDIT,
  inputSchema: objectSchema(
    {
      code: str('Short code, e.g. ELEC.'),
      name: str('Cost centre name, e.g. Electrical Services.'),
      xeroSalesAccountCode: str('Xero sales account code.'),
      xeroExpenseAccountCode: str('Xero expense account code.'),
      xeroTrackingCategory: str('Xero tracking category.'),
      xeroTrackingOption: str('Xero tracking option. Defaults to the name when a category is given.'),
    },
    ['code', 'name']
  ),
  summarize: (input, result) => result.summary,
  run: async (input) => {
    const code = String(input.code).trim().toUpperCase();
    if ((store.getAll('costCenters') || []).some((center) => String(center.code || '').toUpperCase() === code)) {
      throw conflict(`A cost centre with code ${code} already exists.`);
    }
    const center = await store.create('costCenters', {
      code,
      name: String(input.name).trim(),
      active: true,
      xeroSalesAccountCode: input.xeroSalesAccountCode || null,
      xeroExpenseAccountCode: input.xeroExpenseAccountCode || null,
      xeroTrackingCategoryName: input.xeroTrackingOption ? input.xeroTrackingCategory || null : null,
      xeroTrackingOptionName: input.xeroTrackingOption || null,
    });
    logActivity({ type: 'cost_center_created', text: `Cost centre ${center.code} ${center.name} created.` });
    return { summary: `Created cost centre ${center.code} ${center.name}.`, costCenter: center };
  },
});

defineAction({
  name: 'update_cost_center',
  title: 'Update a cost centre',
  description: 'Change a cost centre\'s code, name, Xero account codes or tracking option, or retire it.',
  permission: SETTINGS_EDIT,
  inputSchema: objectSchema(
    {
      costCenter: str('Code, name or id.'),
      code: str('New code.'),
      name: str('New name.'),
      active: bool('false to retire it.'),
      xeroSalesAccountCode: str('Xero sales account code.'),
      xeroExpenseAccountCode: str('Xero expense account code.'),
      xeroTrackingCategory: str('Xero tracking category.'),
      xeroTrackingOption: str('Xero tracking option.'),
    },
    ['costCenter']
  ),
  summarize: (input, result) => result.summary,
  run: async (input) => {
    const existing = resolveCostCenter(input.costCenter);
    const patch = {};
    const fields = [];
    if (input.code != null) { patch.code = String(input.code).trim().toUpperCase(); fields.push('code'); }
    if (input.name != null) { patch.name = String(input.name).trim(); fields.push('name'); }
    if (input.active != null) { patch.active = !!input.active; fields.push('active'); }
    ['xeroSalesAccountCode', 'xeroExpenseAccountCode'].forEach((key) => {
      if (input[key] != null) { patch[key] = input[key] || null; fields.push(key); }
    });
    if (input.xeroTrackingCategory != null) { patch.xeroTrackingCategoryName = input.xeroTrackingCategory || null; fields.push('tracking category'); }
    if (input.xeroTrackingOption != null) { patch.xeroTrackingOptionName = input.xeroTrackingOption || null; fields.push('tracking option'); }
    if (!fields.length) throw invalidInput('Nothing to update — pass at least one new value.');
    await store.update('costCenters', existing.id, patch);
    logActivity({ type: 'cost_center_updated', text: `Cost centre ${costCenterLabel(existing)} updated (${fields.join(', ')}).` });
    return { summary: `Updated cost centre ${costCenterLabel(store.getById('costCenters', existing.id))}.`, costCenter: store.getById('costCenters', existing.id), fields };
  },
});

// ── Tasklist templates ──────────────────────────────────────────────────

const subTaskNodeSchema = () => objectOf(
  {
    name: str('Sub-task name.'),
    description: str('What the sub-task covers.'),
    estimatedHours: num('Estimated hours.'),
    people: num('How many people.'),
  },
  'A sub-task in the template.'
);

const taskNodeSchema = () => objectOf(
  {
    name: str('Task name.'),
    description: str('What the task covers.'),
    estimatedHours: num('Estimated hours.'),
    people: num('How many people.'),
    subTasks: list(subTaskNodeSchema(), 'Sub-tasks under this task.'),
  },
  'A task in the template.'
);

function buildTemplateTasks(tasks) {
  return (tasks || []).map((task) => ({
    id: store.generateId(),
    name: String(task.name || 'Task').trim(),
    ...(task.description ? { description: String(task.description).trim() } : {}),
    estimatedHours: Number(task.estimatedHours) || 0,
    people: Number(task.people) || 1,
    status: 'Not Started',
    progress: 0,
    subTasks: buildTemplateTasks(task.subTasks || []),
  }));
}

function resolveTaskTemplate(query) {
  const text = String(query || '').trim().toLowerCase();
  const hit = (store.getAll('taskTemplates') || []).find((template) =>
    String(template.id) === String(query) || String(template.name || '').toLowerCase() === text);
  if (!hit) throw notFound('tasklist template', query);
  return hit;
}

defineAction({
  name: 'list_task_templates',
  title: 'List tasklist templates',
  description: 'List the reusable tasklists used to build a job checklist in one step.',
  permission: { module: 'Jobs', key: 'view' },
  readOnly: true,
  inputSchema: objectSchema({}),
  summarize: (input, result) => `${result.templates.length} tasklist template(s).`,
  run: async () => ({
    templates: (store.getAll('taskTemplates') || []).map((template) => ({
      id: template.id,
      name: template.name,
      description: template.description || '',
      tags: template.tags || [],
      tasks: (template.tasks || []).length,
    })),
  }),
});

defineAction({
  name: 'create_task_template',
  title: 'Create a tasklist template',
  description: 'Save a reusable tasklist — the standard steps and hours for a kind of job — so it can be added to a job in one step.',
  permission: { module: 'Jobs', key: 'create' },
  inputSchema: objectSchema(
    {
      name: str('Template name, e.g. "Switchboard upgrade".'),
      description: str('When to use it.'),
      tags: list(str('A tag.'), 'Tags for finding the template.'),
      tasks: list(taskNodeSchema(), 'The tasks in the template.'),
    },
    ['name', 'tasks']
  ),
  summarize: (input, result) => result.summary,
  run: async ({ name, description, tags, tasks }) => {
    if (!tasks?.length) throw invalidInput('A tasklist template needs at least one task.');
    const template = store.create('taskTemplates', {
      name: String(name).trim(),
      description: description || '',
      tags: (tags || []).map(String).filter(Boolean),
      tasks: buildTemplateTasks(tasks),
    });
    logActivity({ type: 'task_template_created', text: `Tasklist template ${template.name} created.` });
    return { summary: `Created tasklist template ${template.name} (${tasks.length} task(s)).`, template };
  },
});

defineAction({
  name: 'update_task_template',
  title: 'Update a tasklist template',
  description: 'Rename a tasklist template, change its description or tags, or replace its tasks.',
  permission: { module: 'Jobs', key: 'edit' },
  inputSchema: objectSchema(
    {
      template: str('Template name or id.'),
      name: str('New name.'),
      description: str('New description.'),
      tags: list(str('A tag.'), 'Replacement tags.'),
      tasks: list(taskNodeSchema(), 'Replacement tasks.'),
    },
    ['template']
  ),
  summarize: (input, result) => result.summary,
  run: async ({ template: reference, name, description, tags, tasks }) => {
    const template = resolveTaskTemplate(reference);
    const patch = {};
    const fields = [];
    if (name != null) { patch.name = String(name).trim(); fields.push('name'); }
    if (description != null) { patch.description = description; fields.push('description'); }
    if (tags != null) { patch.tags = tags.map(String).filter(Boolean); fields.push('tags'); }
    if (tasks != null) { patch.tasks = buildTemplateTasks(tasks); fields.push('tasks'); }
    if (!fields.length) throw invalidInput('Nothing to update — pass at least one new value.');
    await store.update('taskTemplates', template.id, patch);
    logActivity({ type: 'task_template_updated', text: `Tasklist template ${patch.name || template.name} updated.` });
    return { summary: `Updated tasklist template ${patch.name || template.name} (${fields.join(', ')}).`, template: store.getById('taskTemplates', template.id) };
  },
});

defineAction({
  name: 'delete_task_template',
  title: 'Delete a tasklist template',
  description: 'Permanently delete a tasklist template. Jobs already built from it are not affected.',
  permission: { module: 'Jobs', key: 'delete' },
  risky: true,
  inputSchema: objectSchema({ template: str('Template name or id.'), reason: str('Why it is being deleted.') }, ['template']),
  summarize: (input, result) => result.summary,
  run: async ({ template: reference, reason }) => {
    const template = resolveTaskTemplate(reference);
    await store.delete('taskTemplates', template.id);
    logActivity({ type: 'task_template_deleted', text: `Tasklist template ${template.name} deleted${reason ? ` — ${reason}` : ''}.` });
    return { summary: `Deleted tasklist template ${template.name}.`, template: { id: template.id, name: template.name }, reason: reason || null };
  },
});
