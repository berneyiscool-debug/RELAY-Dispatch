/**
 * Time & materials — booking labour onto a job and allocating parts to it.
 *
 * Both writes mirror what the job screen does. A timesheet is created with the
 * same field names and `hours` rounding as `JobDetail.js`, and a material is
 * written to the `jobMaterials` collection *and* pushed onto the job's cached
 * `materials` array, because the invoice fallback reads that array.
 *
 * The one place this layer is deliberately more careful than the UI: stock is
 * only deducted when the tool was told which location to take it from (or when
 * the part sits in a single location). An allocation never silently empties the
 * wrong bin.
 */

import { store } from '../data/store.js';
import { defineAction } from './registry.js';
import { resolveOne } from './resolve.js';
import { objectSchema, str, num, enumOf, dateish } from './schema.js';
import { invalidInput, notFound } from './errors.js';
import { logActivity, currentActor } from './context.js';
import { parseClock, parseDate, todayLocalISO } from './dates.js';
import { resolveJob, resolveJobTask } from './jobs.js';
import { findTechnician } from './leads.js';
import { resolveCustomer } from './customers.js';
import { roundCurrency } from '../utils/pricing.js';
import { deductStockFromLocation } from '../utils/storageLocations.js';

export const TIMESHEET_STATUSES = ['Pending', 'Approved'];

const MINUTES_IN_DAY = 1440;

const pad = (value) => String(Math.floor(value)).padStart(2, '0');

/** Local-naive `YYYY-MM-DDTHH:MM` — the format `schedule`/`timesheets` store. */
function localDateTime(dateKey, clock) {
  return `${dateKey}T${pad(clock.hours)}:${pad(clock.minutes)}`;
}

/**
 * Port of `JobDetail.js#getJobTasklistHours`: leaf tasks only, weighted by the
 * number of people on the task.
 */
export function tasklistHours(tasks) {
  const nodeHours = (node) => {
    const children = node.subTasks || [];
    if (!children.length) return (parseFloat(node.estimatedHours) || 0) * (parseInt(node.people, 10) || 1);
    return children.reduce((sum, child) => sum + nodeHours(child), 0);
  };
  return (tasks || []).reduce((sum, task) => sum + nodeHours(task), 0);
}

/** Port of `JobDetail.js#generateWorksDoneDescription` — the invoice's "works done" note. */
export function worksDoneDescription(tasks) {
  const names = [];
  const collect = (node) => {
    const children = node.subTasks || [];
    if (!children.length) names.push(node.name);
    else children.forEach(collect);
  };
  (tasks || []).forEach(collect);
  if (!names.length) return 'General maintenance and service work completed.';
  return 'Works Done:\n' + names.map((name) => `• ${name}`).join('\n');
}

function stockSearch() {
  return { searchFields: ['name', 'sku', 'supplier', 'category'] };
}

/** The stock part a reference like "15A RCBO" means, or null when nothing matches. */
export function findStockItem(query) {
  if (!query) return null;
  try {
    return resolveOne('stock', query, stockSearch()).record;
  } catch (error) {
    if (error.code === 'not_found') return null;
    throw error;
  }
}

/**
 * Take `quantity` of `part` out of stock at `location`.
 *
 * A part that is not held in stock at all (a one-off purchase) is allocated
 * without touching the shelves, and so is a part held in several places when no
 * location was given — both return a note for the reply. But a location the
 * caller named explicitly has to be right: taking more than the shelf holds, or
 * naming a location that never held the part, is a mistake worth raising.
 */
function deductStock(part, location, quantity) {
  if (!part) return null;
  const held = (part.locations || []).filter((entry) => (parseFloat(entry.quantity) || 0) > 0);
  const where = (list) => list.map((entry) => entry.location).join(', ');

  if (!held.length) return `No stock of "${part.name}" is on hand, so stock was left unchanged.`;

  if (location) {
    const at = held.find((entry) => String(entry.location).toLowerCase() === String(location).toLowerCase());
    if (!at) throw invalidInput(`"${part.name}" is not held at ${location} — it is in ${where(held)}.`);
    if ((parseFloat(at.quantity) || 0) < quantity) {
      throw invalidInput(`Only ${at.quantity} of "${part.name}" at ${location} — allocate ${at.quantity} or fewer, or pick another location.`);
    }
  } else if (held.length > 1) {
    return `"${part.name}" is held in ${where(held)} — pass a location to take it from stock.`;
  }

  const target = location || held[0].location;
  const clone = { ...part, locations: (part.locations || []).map((entry) => ({ ...entry })) };
  const result = deductStockFromLocation(clone, target, quantity);
  if (!result.ok) return result.reason;

  store.update('stock', part.id, {
    locations: clone.locations,
    quantity: clone.quantity,
    location: clone.location,
  });
  return null;
}

function resolveTechnicianFor(job, query) {
  if (query) {
    const technician = findTechnician(query);
    if (!technician) throw notFound('technician', query);
    return technician;
  }
  if (job.technicianId) {
    const assigned = store.getById('technicians', job.technicianId);
    if (assigned) return assigned;
  }
  const actor = currentActor();
  const self = findTechnician(actor.name || '');
  if (self) return self;
  throw invalidInput('Who did the work? Pass a technician name.');
}

defineAction({
  name: 'log_time',
  title: 'Log time on a job',
  description:
    'Record hours worked on a job. Give either the total hours, or a start and finish time and the hours are calculated. The entry starts as Pending so an approver can still review it.',
  permission: { module: 'Timesheets', key: 'create' },
  inputSchema: objectSchema(
    {
      job: str('Job number, title, customer or id.'),
      customer: str('Customer, to narrow the job down when the name is not unique.'),
      technician: str('Who did the work. Defaults to the job\'s assigned technician.'),
      hours: num('Total hours worked, e.g. 2.5. Calculated from the start and finish times when omitted.'),
      startTime: str('Start time, e.g. "07:30" or "2026-10-14T07:30".'),
      finishTime: str('Finish time, e.g. "15:30" or "2026-10-14T15:30".'),
      date: dateish('Day the work was done. Defaults to today.'),
      task: str('Name of the task the time belongs to.'),
      description: str('What was done, for the office to read.'),
      status: enumOf(TIMESHEET_STATUSES, 'Pending (default) or Approved.'),
    },
    ['job']
  ),
  summarize: (input, result) =>
    `Logged ${result.timesheet.hours} hour${result.timesheet.hours === 1 ? '' : 's'} on job ${result.job.number} for ${result.timesheet.technicianName}${
      result.timesheet.taskName ? ` (${result.timesheet.taskName})` : ''
    }.`,
  artifacts: (result) => [{ label: `Open job ${result.job.number}`, path: `/jobs/${result.job.id}` }],
  async run(input) {
    const job = resolveJob(input.job, customerScope(input.customer));
    const technician = resolveTechnicianFor(job, input.technician);

    const dateKey = input.date ? parseDate(input.date) : todayLocalISO();
    const start = input.startTime ? parseClock(input.startTime) : null;
    const finish = input.finishTime ? parseClock(input.finishTime) : null;

    if ((input.startTime && !start) || (input.finishTime && !finish)) {
      throw invalidInput('Times should look like "07:30" or "2026-10-14T07:30".');
    }
    if (input.hours == null && (!start || !finish)) {
      throw invalidInput('Give the hours worked, or both a start and a finish time.');
    }

    let hours = input.hours == null ? null : Number(input.hours);
    if (start && finish) {
      const minutes = (finish.hours * 60 + finish.minutes) - (start.hours * 60 + start.minutes);
      if (minutes <= 0) throw invalidInput('The finish time must be after the start time.');
      if (minutes > MINUTES_IN_DAY) throw invalidInput('A single time entry cannot exceed 24 hours.');
      if (hours == null) hours = Math.round((minutes / 60) * 100) / 100;
    }
    if (!(hours > 0)) throw invalidInput('Hours must be greater than zero.');

    const entry = {
      jobId: job.id,
      jobNumber: job.number,
      technicianId: technician.id,
      technicianName: technician.name,
      date: dateKey,
      hours,
      description: input.description || '',
      status: input.status || 'Pending',
    };

    if (start && finish) {
      entry.startTime = localDateTime(dateKey, start);
      entry.finishTime = localDateTime(dateKey, finish);
    }

    let taskName = null;
    if (input.task) {
      const match = resolveJobTask(job, input.task);
      entry.taskId = match.path.join('-');
      entry.taskName = match.node.name;
      taskName = match.node.name;
    }

    const timesheet = await store.create('timesheets', entry);
    await logActivity({
      type: 'time_logged',
      text: `${hours}h logged on job ${job.number} by ${technician.name}${taskName ? ` for "${taskName}"` : ''}.`,
      recordType: 'job',
      recordId: job.id,
    });

    return { summary: `${hours}h logged on job ${job.number}.`, job, timesheet, technician };
  },
});

/** Scope a job lookup to one customer when the job name alone is ambiguous. */
function customerScope(name) {
  if (!name) return {};
  const { customer } = resolveCustomer(name, { create: false });
  return customer ? { customerId: customer.id } : {};
}

defineAction({
  name: 'add_job_material',
  title: 'Add material to a job',
  description:
    'Allocate a part or material to a job. When the item is in stock it is taken off the shelf — pass a location when the part is stored in more than one place.',
  permission: { module: 'Jobs', key: 'manage_materials' },
  inputSchema: objectSchema(
    {
      job: str('Job number, title, customer or id.'),
      customer: str('Customer, to narrow the job down when the name is not unique.'),
      part: str('Stock item name or SKU. Matched against the stock list, and against job materials already used.'),
      quantity: num('How many were used. Defaults to 1.'),
      location: str('Stock location to take the items from, e.g. "Van 1".'),
      unitCost: num('Cost per unit. Defaults to the stock item\'s cost price.'),
      date: dateish('Day the material was used. Defaults to today.'),
    },
    ['job', 'part']
  ),
  summarize: (input, result) =>
    `Added ${result.material.quantity} × ${result.material.partName} to job ${result.job.number}${
      result.stockNote ? ` (${result.stockNote})` : ''
    }.`,
  artifacts: (result) => [{ label: `Open job ${result.job.number}`, path: `/jobs/${result.job.id}` }],
  async run(input) {
    const job = resolveJob(input.job, customerScope(input.customer));
    const quantity = input.quantity == null ? 1 : Number(input.quantity);
    if (!Number.isFinite(quantity) || quantity <= 0) {
      throw invalidInput('Quantity must be greater than zero.', { quantity: input.quantity });
    }

    const name = String(input.part || '').trim();
    if (!name) throw invalidInput('What material was used?');
    const part = findStockItem(name);

    const unitCost = input.unitCost != null
      ? Number(input.unitCost)
      : parseFloat(part ? part.costPrice : 0) || 0;

    const stockNote = deductStock(part, input.location, quantity);

    const material = await store.create('jobMaterials', {
      jobId: job.id,
      jobNumber: job.number,
      partId: part ? part.id : null,
      partName: name,
      name,
      quantity,
      unitCost: roundCurrency(unitCost),
      totalCost: roundCurrency(unitCost * quantity),
      location: input.location || (part && part.location) || '',
      date: input.date ? parseDate(input.date) : new Date().toISOString(),
    });

    await store.update('jobs', job.id, { materials: [...(job.materials || []), material] });
    await logActivity({
      type: 'material_added',
      text: `${quantity} × ${name} allocated to job ${job.number}.`,
      recordType: 'job',
      recordId: job.id,
    });

    return { summary: `${quantity} × ${name} added to job ${job.number}.`, job, material, stockNote: stockNote || null };
  },
});
