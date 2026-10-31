/**
 * Assets and maintenance plans — the equipment the business owns or services.
 *
 * Assets are written with the fields `AssetForm.js` writes, service logs the way
 * `AssetDetail.js` appends them, and maintenance plans with the same shape as the
 * plan drawer on the asset page. After a meter reading, a service log or a plan
 * change the maintenance engine is run, as the asset page does, so a plan that
 * has come due raises its notification straight away.
 */

import { store } from '../data/store.js';
import { defineAction } from './registry.js';
import { resolveOne } from './resolve.js';
import { objectSchema, str, num, int, enumOf, dateish } from './schema.js';
import { invalidInput, notFound } from './errors.js';
import { logActivity } from './context.js';
import { customerLabel, resolveCustomer, resolveSite, siteAmbiguous, siteNotFound } from './customers.js';
import { findTechnician } from './leads.js';
import { resolveQuote } from './quotes.js';
import { parseDate, todayLocalISO } from './dates.js';

export const ASSET_TYPES = ['Vehicle', 'Plant & Equipment', 'Specialized Tool', 'Fixed Asset (HVAC/Solar/Fire)', 'Other'];
export const ASSET_STATUSES = ['Active', 'In Maintenance', 'Commissioning', 'Decommissioned', 'Lost/Stolen'];
export const LOG_TYPES = ['Service', 'Repair', 'Inspection', 'Refuel', 'Other'];
export const PLAN_FREQUENCIES = ['Weekly', 'Monthly', 'Quarterly', 'Semi-Annually', 'Annually'];
const METER_UNITS = ['hrs', 'kmls'];

export const assetSearch = {
  label: (asset) => `${asset.name || asset.id}${asset.customerName ? ` — ${asset.customerName}` : ''}`,
  searchFields: ['name', 'serial', 'identifier', 'customerName', 'site', 'type'],
  what: 'asset',
};

export function resolveAsset(query) {
  return resolveOne('assets', query, assetSearch).record;
}

/** Run the maintenance engine the way the asset page does. Never fails the action. */
async function checkPlans() {
  try {
    const { checkMaintenancePlans } = await import('../utils/maintenanceEngine.js');
    await checkMaintenancePlans();
  } catch (error) {
    console.warn('brny: maintenance check after an asset change failed', error);
  }
}

/** Owner, customer and site fields, shared by create and update. */
function ownerPatch(input) {
  const patch = {};
  if (input.customer) {
    const { customer } = resolveCustomer(input.customer, { create: false });
    if (!customer) throw notFound('customer', input.customer);
    patch.ownerType = 'Customer';
    patch.customerId = customer.id;
    patch.customerName = customerLabel(customer);
    if (input.site) {
      const found = resolveSite(customer, input.site);
      if (found.kind === 'many') throw siteAmbiguous(input.site, found.hits);
      if (found.kind === 'none') throw siteNotFound(customer, input.site);
      patch.site = found.site.name;
    }
  } else if (input.site) {
    throw invalidInput('A site belongs to a customer — pass the customer too.');
  }
  return patch;
}

const assetFields = {
  description: str('What the asset is, in a sentence.'),
  type: enumOf(ASSET_TYPES, 'Kind of asset.'),
  serial: str('Serial number or other identifier.'),
  customer: str('The customer who owns it, when it is equipment you service for them. Leave out for the business\'s own vehicles, plant and tools.'),
  site: str('Which of the customer\'s sites it is installed at.'),
  installDate: dateish('Date it was installed or bought.'),
  serviceIntervalMonths: int('Months between routine services.'),
  meterUnit: enumOf(METER_UNITS, 'What the meter counts: hours (hrs) or kilometres (kmls).'),
  currentMeter: num('Current meter reading.'),
  assignedTo: str('Staff member the asset is assigned to, e.g. the driver of a van.'),
};

function fieldPatch(input) {
  const patch = ownerPatch(input);
  ['description', 'type', 'meterUnit'].forEach((key) => { if (input[key] != null) patch[key] = input[key]; });
  if (input.serial != null) { patch.serial = input.serial; patch.identifier = input.serial; }
  if (input.installDate != null) patch.installDate = parseDate(input.installDate);
  if (input.serviceIntervalMonths != null) patch.serviceIntervalMonths = input.serviceIntervalMonths;
  if (input.currentMeter != null) patch.currentMeter = input.currentMeter;
  if (input.assignedTo != null) patch.assignedToId = findTechnician(input.assignedTo)?.id || '';
  return patch;
}

defineAction({
  name: 'create_asset',
  title: 'Create asset',
  description:
    'Register an asset: a customer\'s equipment you service (a split system, a switchboard, a fire panel) or the business\'s own vehicle, plant or tool. Set up its servicing afterwards with set_maintenance_plan.',
  permission: { module: 'Assets', key: 'create' },
  inputSchema: objectSchema({ name: str('Asset name, e.g. "Daikin 7kW split — Level 2".'), ...assetFields }, ['name']),
  summarize: (input, result) => `Registered asset ${result.asset.name}${result.asset.customerName ? ` for ${result.asset.customerName}` : ''}.`,
  artifacts: (result) => [{ label: result.asset.name, path: `/assets/${result.asset.id}` }],
  async run(input) {
    const asset = store.create('assets', {
      name: input.name.trim(),
      description: '',
      serial: '',
      identifier: '',
      type: 'Other',
      status: 'Active',
      assignedToId: '',
      ownerType: 'Business',
      customerId: null,
      customerName: null,
      site: '',
      installDate: '',
      recoveryRate: 0,
      serviceIntervalMonths: 6,
      currentMeter: 0,
      meterUnit: 'hrs',
      ...fieldPatch(input),
      logs: [],
    });
    logActivity({ type: 'asset_created', text: `Asset ${asset.name} registered.`, recordType: 'asset', recordId: asset.id });
    return { asset };
  },
});

defineAction({
  name: 'update_asset',
  title: 'Update asset',
  description: 'Change an asset\'s details, owner, site, assignment or status — e.g. mark it In Maintenance or Decommissioned.',
  permission: { module: 'Assets', key: 'edit' },
  inputSchema: objectSchema(
    { asset: str('Asset name, serial, customer or id.'), name: str('New name.'), status: enumOf(ASSET_STATUSES, 'New status.'), ...assetFields },
    ['asset']
  ),
  summarize: (input, result) => `Updated asset ${result.asset.name} (${result.fields.join(', ')}).`,
  artifacts: (result) => [{ label: result.asset.name, path: `/assets/${result.asset.id}` }],
  async run(input) {
    const asset = resolveAsset(input.asset);
    const patch = fieldPatch(input);
    if (input.name != null) patch.name = input.name.trim();
    if (input.status != null) patch.status = input.status;
    const fields = Object.keys(patch);
    if (!fields.length) throw invalidInput('Nothing to update — pass at least one new value.');
    await store.update('assets', asset.id, patch);
    logActivity({ type: 'asset_updated', text: `Asset ${patch.name || asset.name} updated (${fields.join(', ')}).`, recordType: 'asset', recordId: asset.id });
    if (patch.currentMeter != null) await checkPlans();
    return { asset: store.getById('assets', asset.id), fields };
  },
});

defineAction({
  name: 'log_asset_service',
  title: 'Log asset service',
  description:
    'Record a service, repair, inspection or refuel against an asset, with the meter reading and cost. A repair puts the asset In Maintenance. Use update_asset to set it back to Active once it is fixed.',
  permission: { module: 'Assets', key: 'edit' },
  inputSchema: objectSchema(
    {
      asset: str('Asset name, serial, customer or id.'),
      type: enumOf(LOG_TYPES, 'What was done. Defaults to Service.'),
      date: dateish('When. Defaults to today.'),
      meter: num('Meter reading at the time. Defaults to the current reading.'),
      cost: num('What it cost, ex GST.'),
      notes: str('What was done or found.'),
    },
    ['asset']
  ),
  summarize: (input, result) => `${result.log.type} logged on ${result.asset.name} for ${result.log.date}.`,
  artifacts: (result) => [{ label: result.asset.name, path: `/assets/${result.asset.id}` }],
  async run(input) {
    const asset = resolveAsset(input.asset);
    const log = {
      date: input.date ? parseDate(input.date) : todayLocalISO(),
      type: input.type || 'Service',
      meter: input.meter != null ? input.meter : (parseFloat(asset.currentMeter) || 0),
      cost: input.cost != null ? input.cost : 0,
      notes: input.notes || '',
    };
    await store.update('assets', asset.id, {
      logs: [...(asset.logs || []), log],
      currentMeter: log.meter,
      status: log.type === 'Repair' ? 'In Maintenance' : asset.status,
    });
    logActivity({ type: 'asset_logged', text: `${log.type} logged on ${asset.name}.`, recordType: 'asset', recordId: asset.id });
    await checkPlans();
    return { asset: store.getById('assets', asset.id), log };
  },
});

defineAction({
  name: 'set_maintenance_plan',
  title: 'Set maintenance plan',
  description:
    'Create or change the servicing plan on an asset: on a calendar ("Quarterly", next due date) or on the meter (every N hours or km). Each plan copies a blueprint quote — the standard service priced up — into the work it raises, so pass that quote. A plan with the same name on the asset is updated rather than duplicated; set status Paused to stop it.',
  permission: { module: 'Assets', key: 'edit' },
  inputSchema: objectSchema(
    {
      asset: str('Asset name, serial, customer or id.'),
      name: str('Plan name, e.g. "Quarterly filter clean".'),
      quote: str('Blueprint quote for the service: its number or title.'),
      trigger: enumOf(['Calendar', 'Meter'], 'Due by date or by meter reading. Defaults to Calendar.'),
      frequency: enumOf(PLAN_FREQUENCIES, 'Calendar plans: how often. Defaults to Quarterly.'),
      nextServiceDate: dateish('Calendar plans: when the next service is due.'),
      meterInterval: num('Meter plans: hours or km between services.'),
      lastServiceMeter: num('Meter plans: the reading at the last service. Defaults to the current reading.'),
      priority: int('1-10, higher wins when two plans fall due together. Defaults to 5.'),
      technician: str('Technician the raised job is assigned to by default.'),
      status: enumOf(['Active', 'Paused'], 'Defaults to Active.'),
    },
    ['asset', 'name']
  ),
  summarize: (input, result) => `${result.created ? 'Set up' : 'Updated'} ${result.plan.name} on ${result.asset.name} — ${result.plan.triggerType === 'Meter' ? `every ${result.plan.meterInterval} ${result.asset.meterUnit || 'hrs'}` : `${result.plan.frequency}, next ${result.plan.nextServiceDate}`}.`,
  artifacts: (result) => [{ label: result.asset.name, path: `/assets/${result.asset.id}` }],
  async run(input) {
    const asset = resolveAsset(input.asset);
    const existing = (store.getAll('maintenancePlans') || [])
      .find((plan) => plan.assetId === asset.id && String(plan.name || '').toLowerCase() === input.name.trim().toLowerCase());

    const quoteRef = input.quote || null;
    if (!quoteRef && !existing?.quoteId) throw invalidInput('A maintenance plan needs a blueprint quote — the priced standard service. Create one with create_quote first if there is none.');
    const quoteId = quoteRef ? resolveQuote(quoteRef).id : existing.quoteId;

    const technician = input.technician ? findTechnician(input.technician) : null;
    if (input.technician && !technician) throw notFound('technician', input.technician);

    const triggerType = input.trigger || existing?.triggerType || 'Calendar';
    if (triggerType === 'Meter' && !(input.meterInterval || existing?.meterInterval)) {
      throw invalidInput('A meter plan needs a meterInterval — the hours or km between services.');
    }

    const plan = {
      name: input.name.trim(),
      assetId: asset.id,
      quoteId,
      triggerType,
      status: input.status || existing?.status || 'Active',
      priority: input.priority != null ? input.priority : (existing?.priority ?? 5),
      collisionMerging: existing?.collisionMerging ?? false,
      mergeTasks: existing?.mergeTasks ?? false,
      taskTemplateId: existing?.taskTemplateId ?? null,
      defaultTechnicianId: technician ? technician.id : (existing?.defaultTechnicianId ?? null),
      frequency: triggerType === 'Calendar' ? (input.frequency || existing?.frequency || 'Quarterly') : null,
      nextServiceDate: triggerType === 'Calendar'
        ? (input.nextServiceDate ? parseDate(input.nextServiceDate) : (existing?.nextServiceDate || todayLocalISO()))
        : null,
      meterInterval: triggerType === 'Meter' ? (input.meterInterval ?? existing.meterInterval) : null,
      lastTriggeredMeter: triggerType === 'Meter'
        ? (input.lastServiceMeter ?? existing?.lastTriggeredMeter ?? (parseFloat(asset.currentMeter) || 0))
        : 0,
      lastNotificationDate: existing ? existing.lastNotificationDate : null,
    };

    const saved = existing ? (await store.update('maintenancePlans', existing.id, plan), store.getById('maintenancePlans', existing.id)) : store.create('maintenancePlans', plan);
    logActivity({ type: 'maintenance_plan', text: `Maintenance plan "${plan.name}" ${existing ? 'updated' : 'set up'} on ${asset.name}.`, recordType: 'asset', recordId: asset.id });
    await checkPlans();
    return { asset, plan: saved, created: !existing };
  },
});

defineAction({
  name: 'delete_maintenance_plan',
  title: 'Delete a maintenance plan',
  description: 'Permanently remove a servicing plan from an asset, so it stops raising work. This cannot be undone. Set the plan inactive with set_maintenance_plan when the history should stay.',
  permission: { module: 'Assets', key: 'edit' },
  risky: true,
  inputSchema: objectSchema(
    {
      asset: str('Asset name, serial number or id.'),
      plan: str('The plan name.'),
      reason: str('Why the plan is being deleted.'),
    },
    ['asset', 'plan']
  ),
  summarize: (input, result) => result.summary,
  run: async ({ asset: assetRef, plan: planName, reason }) => {
    const asset = resolveAsset(assetRef);
    const text = String(planName || '').trim().toLowerCase();
    const plan = (store.getAll('maintenancePlans') || []).find((row) => row.assetId === asset.id && String(row.name || '').toLowerCase() === text);
    if (!plan) throw invalidInput(`${asset.name} has no maintenance plan called "${planName}".`);
    await store.delete('maintenancePlans', plan.id);
    logActivity({ type: 'maintenance_plan', text: `Maintenance plan "${plan.name}" deleted from ${asset.name}${reason ? ` — ${reason}` : ''}.`, recordType: 'asset', recordId: asset.id });
    return { summary: `Deleted the ${plan.name} plan from ${asset.name}.`, asset: { id: asset.id, name: asset.name }, plan: { id: plan.id, name: plan.name }, reason: reason || null };
  },
});

defineAction({
  name: 'delete_asset',
  title: 'Delete asset',
  description:
    'Permanently delete an asset, together with its maintenance plans and the notifications they raised. This cannot be undone. Jobs that recorded work on it keep their history. Use update_asset to set status Decommissioned when the record should stay.',
  permission: { module: 'Assets', key: 'delete' },
  risky: true,
  inputSchema: objectSchema(
    {
      asset: str('Asset name, serial number or id.'),
      reason: str('Why the asset is being deleted.'),
    },
    ['asset']
  ),
  summarize: (input, result) => result.summary,
  run: async ({ asset: reference, reason }) => {
    const asset = resolveAsset(reference);
    const plans = (store.getAll('maintenancePlans') || []).filter((plan) => plan.assetId === asset.id).length;
    const jobs = (store.getAll('jobs') || []).filter((job) => job.assetId === asset.id).length;
    const snapshot = {
      id: asset.id,
      name: asset.name || asset.id,
      serial: asset.serial || null,
      customerName: asset.customerName || null,
    };
    await store.delete('assets', asset.id);
    logActivity({
      type: 'asset_deleted',
      text: `Asset ${snapshot.name} deleted${reason ? ` — ${reason}` : ''}${plans ? ` with ${plans} maintenance plan${plans === 1 ? '' : 's'}` : ''}.`,
      recordType: 'asset',
      recordId: snapshot.id,
    });
    return {
      summary: `Deleted asset ${snapshot.name}${plans ? ` and ${plans} maintenance plan${plans === 1 ? '' : 's'}` : ''}${jobs ? `; ${jobs} job${jobs === 1 ? '' : 's'} keep their history` : ''}.`,
      asset: snapshot,
      removedPlans: plans,
      keptJobs: jobs,
      reason: reason || null,
    };
  },
});
