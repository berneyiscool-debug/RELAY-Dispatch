/**
 * Jobs — creation, edits, the task tree, notes, completion and deletion.
 *
 * Job records, task nodes, the weighted progress roll-up and the history
 * entries are written exactly the way `JobForm.js`/`JobDetail.js` write them, so
 * a job built by brny is indistinguishable from one built by hand.
 *
 * Scheduling and technician assignment live in `scheduling.js`, time and
 * materials in `timeMaterials.js`, invoicing in `invoices.js`.
 */

import { store } from '../data/store.js';
import { defineAction } from './registry.js';
import { resolveOne, scoreRecord } from './resolve.js';
import { objectSchema, str, num, int, bool, enumOf, list, objectOf, dateish } from './schema.js';
import { ambiguousMatch, invalidInput, notFound } from './errors.js';
import { actorStamp, logActivity } from './context.js';
import { customerLabel, resolveCustomer, resolveSite, siteAmbiguous, siteNotFound } from './customers.js';
import { findTechnician } from './leads.js';
import { parseDate } from './dates.js';
import { newHistoryEvent } from '../data/jobHistory.js';
import { ASSET_CONDITIONS } from '../utils/assetCondition.js';

export const JOB_STATUSES = ['Pending', 'Scheduled', 'In Progress', 'On Hold', 'Completed', 'Invoiced'];
export const JOB_PRIORITIES = ['Low', 'Medium', 'High', 'Urgent'];
export const TASK_STATUSES = ['Not Started', 'In Progress', 'Completed'];
const CLOSED_STATUSES = ['Completed', 'Invoiced'];

export const jobSearch = { searchFields: ['number', 'title', 'customerName', 'siteAddress', 'contactName'] };

export function jobLabel(job) {
  if (!job) return 'job';
  const who = job.customerName ? ` — ${job.customerName}` : '';
  return `${job.number || job.id}${job.title ? ` ${job.title}` : ''}${who}`;
}

/**
 * One customer easily has several open jobs, so a customer name on its own is
 * not a useful ambiguity: when the lookup is scoped to a customer we fall back
 * to their most recently touched active job.
 */
export function resolveJob(query, { customerId, filter } = {}) {
  const scoped = (job) => (!customerId || job.customerId === customerId) && (typeof filter === 'function' ? filter(job) : true);
  try {
    return resolveOne('jobs', query, { ...jobSearch, filter: scoped }).record;
  } catch (error) {
    if (!customerId || error.code !== 'ambiguous') throw error;
    const candidates = (store.getAll('jobs') || []).filter((job) => job.customerId === customerId);
    const active = candidates.filter((job) => !CLOSED_STATUSES.includes(job.status));
    const pool = (active.length ? active : candidates).sort((a, b) => String(b.updatedAt || '').localeCompare(String(a.updatedAt || '')));
    if (!pool.length) throw error;
    return pool[0];
  }
}

const subTasksOf = (node) => node.subTasks || [];

/** Flatten a task tree into `{node, path, parents}` so a task name is addressable. */
export function taskEntries(tasks, path = [], parents = []) {
  const entries = [];
  (tasks || []).forEach((node, index) => {
    const entryPath = [...path, index];
    entries.push({ node, path: entryPath, parents });
    entries.push(...taskEntries(subTasksOf(node), entryPath, [...parents, node.name]));
  });
  return entries;
}

function taskParent(tasks, path) {
  let node = null;
  for (const index of path) {
    const siblings = node ? subTasksOf(node) : tasks;
    node = siblings[index];
    if (!node) return null;
  }
  return node;
}

export function resolveJobTask(job, query) {
  if (!query) throw invalidInput('Which task?');
  const scored = taskEntries(job.tasks)
    .map((entry) => ({ ...entry, score: scoreRecord({ id: entry.node.id, name: entry.node.name }, query, ['name']) }))
    .filter((entry) => entry.score > 0)
    .sort((a, b) => b.score - a.score);

  if (!scored.length) throw notFound('task', query);
  const [top, next] = scored;
  if (top.score >= 0.9 || scored.length === 1 || top.score - next.score >= 0.15) return top;

  throw ambiguousMatch('task', query, scored.slice(0, 5).map((entry) => ({
    id: entry.node.id,
    label: [...entry.parents, entry.node.name].join(' › '),
  })));
}

/** Port of `JobDetail.js#updateParentProgress` — weighted by hours × people. */
export function rollUpProgress(tasks, path) {
  if (!path || path.length <= 1) return false;
  const parent = taskParent(tasks, path.slice(0, -1));
  if (!parent || !subTasksOf(parent).length) return false;

  let totalWeight = 0;
  let completedWeight = 0;
  subTasksOf(parent).forEach((child) => {
    const weight = (parseFloat(child.estimatedHours) || 1) * (parseInt(child.people, 10) || 1);
    totalWeight += weight;
    completedWeight += weight * ((child.progress || 0) / 100);
  });

  parent.progress = totalWeight > 0 ? Math.round((completedWeight / totalWeight) * 100) : 0;
  if (parent.progress === 100) parent.status = 'Completed';
  else if (parent.progress > 0) parent.status = 'In Progress';
  else parent.status = 'Not Started';

  rollUpProgress(tasks, path.slice(0, -1));
  return true;
}

function newTaskNode({ name, description, estimatedHours, people }) {
  const node = {
    id: store.generateId(),
    name: name || 'New Task',
    status: 'Not Started',
    progress: 0,
    startDate: new Date().toISOString(),
    technicians: [],
    subTasks: [],
  };
  // Written only when there is something to say, so a bare node keeps the same
  // shape the job screens hand-build in `JobForm.js` and `JobDetail.js`.
  if (description != null && String(description).trim()) node.description = String(description).trim();
  if (estimatedHours != null) node.estimatedHours = estimatedHours;
  if (people != null) node.people = people;
  return node;
}

/**
 * The one task every job starts with.
 *
 * Hours are booked against a task, not against a job, so a job with no tasks is
 * a dead end: `log_time` has nothing to attach to and the timesheet has to
 * invent a task the first time somebody opens it. `JobDetail.js`,
 * `ScheduleView.js` and `timesheetModals.js` all create this same node by hand,
 * and this is the same node built the same way.
 */
export function mainTaskNode() {
  return newTaskNode({ name: 'Main Task' });
}

/**
 * Keep the job's estimate and its task list in step when a job is created.
 *
 * The job screens read the task leaves first and fall back to the job's own
 * `estimatedHours` only when the task list carries no hours (`JobDetail.js`),
 * while the scheduler and the dashboards read `estimatedHours` alone, so a job
 * written with one figure and not the other looks like a different size
 * depending on where it is opened. Whichever side the caller filled in is
 * copied to the other; when both are given they are left exactly as written.
 *
 * @param {Array<object>} tasks Task nodes to fill in, mutated in place.
 * @param {number|string} [requestedHours] The job-level estimate the caller gave.
 * @returns {number} The estimate the job record itself should carry.
 */
export function syncEstimateWithTasks(tasks, requestedHours) {
  const requested = Number(requestedHours) || 0;
  const fromTasks = tasks.reduce((sum, task) => sum + (Number(task.estimatedHours) || 0), 0);
  if (fromTasks > 0) return requested > 0 ? requested : fromTasks;
  if (requested <= 0 || !tasks.length) return requested;

  // Nothing to work from on the task list, so the job's estimate is split across
  // it. The last task takes the rounding remainder so the parts add back up.
  const share = Math.round((requested / tasks.length) * 100) / 100;
  tasks.forEach((task, index) => {
    const isLast = index === tasks.length - 1 && tasks.length > 1;
    task.estimatedHours = isLast ? Math.round((requested - share * index) * 100) / 100 : share;
  });
  return requested;
}

function cloneTasks(tasks) {
  return JSON.parse(JSON.stringify(tasks || []));
}

function historyEntry(content) {
  const actor = actorStamp();
  return {
    id: store.generateId(),
    type: 'system',
    action: 'status_changed',
    date: new Date().toISOString(),
    author: actor.createdBy || 'brny',
    content,
  };
}

// History goes in its own job_events row, never back into the job, so a
// concurrent save on another device can't erase it.
function recordHistory(job, entry, payload) {
  return store.create('jobEvents', newHistoryEvent({ ...entry, jobId: job.id, payload }));
}

export function technicianPatch(technician) {
  return {
    technicianId: technician.id,
    technicianName: technician.name,
    technicians: [{ id: technician.id, name: technician.name }],
  };
}

export async function notifyJobAssigned(job, technician) {
  await store.create('notifications', {
    title: 'New Job Assigned',
    message: `${technician.name} was assigned to job ${job.number}${job.title ? ` — ${job.title}` : ''}.`,
    description: job.siteAddress || '',
    type: 'Job Assigned',
    priority: 'High',
    status: 'Pending',
    jobId: job.id,
    link: `/jobs/${job.id}`,
    createdAt: new Date().toISOString(),
    ...actorStamp(),
    origin: 'system',
  });
}

function requireCustomer(input) {
  if (!input.customer) throw invalidInput('Which customer is this job for?');
  const { customer } = resolveCustomer(input.customer, {
    create: !!input.createCustomer,
    extra: input.customerType ? { type: input.customerType } : {},
  });
  if (!customer) throw notFound('customer', input.customer);
  return customer;
}

function jobScope(input) {
  if (!input.customer) return {};
  const { customer } = resolveCustomer(input.customer, { create: false });
  return customer ? { customerId: customer.id } : {};
}

function customerAddress(customer) {
  return customer?.siteAddress || customer?.address || '';
}

/** The live customer record a job belongs to, so its sites can be read. */
function jobCustomer(job) {
  const customer = job.customerId ? store.getById('customers', job.customerId) : null;
  if (!customer) throw invalidInput(`${jobLabel(job)} is not linked to a customer, so it has no sites to book to.`);
  return customer;
}

/**
 * The site a job is being booked to, as the name and address to store on it.
 *
 * A site has to be a real one: a name that matches nothing is refused with the
 * customer's actual sites rather than written onto the job as a guess.
 */
function resolveJobSite(customer, query) {
  const found = resolveSite(customer, query);
  if (found.kind === 'many') throw siteAmbiguous(query, found.hits);
  if (found.kind === 'none') throw siteNotFound(customer, query);
  return {
    siteName: String(found.site.name || '').trim(),
    siteAddress: String(found.site.address || '').trim(),
  };
}

defineAction({
  name: 'create_job',
  title: 'Create job',
  description:
    'Create a job for a customer, optionally with a first list of tasks, a priority and a scheduled date. Use this for new work that is not coming from a quote. Name the job from what the customer asked for, describe the work on the job, and break anything with more than one piece of work into named tasks that each carry a description and their hours. When the customer has more than one site, pass `site` so the job is booked to the right premises — `list_sites` shows what they have. The job always starts with a Main Task when no tasks are given, because hours are booked against a task, and an estimate given only for the whole job is placed on that task list.',
  permission: { module: 'Jobs', key: 'create' },
  inputSchema: objectSchema(
    {
      customer: str('Customer name, number or id the job is for.'),
      title: str('Short job title naming the work, e.g. "Switchboard upgrade".'),
      description: str('What the job involves, in a sentence or two. Shown on the job card.'),
      site: str('Which of the customer\'s sites the job is at — the site name or its address. Use list_sites to see them.'),
      siteAddress: str('Site address if different from the customer address.'),
      contactName: str('On-site contact person.'),
      priority: enumOf(JOB_PRIORITIES, 'Job priority. Defaults to Medium.'),
      asset: str('Equipment asset at the site this job is for — the asset name or serial number. Use it when the customer\'s unit is being serviced or repaired.'),
      status: enumOf(JOB_STATUSES, 'Starting status. Defaults to Scheduled when a date is given, otherwise Pending.'),
      scheduledDate: dateish('Date the job is booked for.'),
      estimatedHours: num('Estimated labour hours for the whole job. Placed on the task list so the tasks are costed too.'),
      tasks: list(
        objectOf(
          {
            name: str('Task name, e.g. "Rough in" or "Fit off".'),
            description: str('What this task covers.'),
            estimatedHours: num('Estimated hours for this task.'),
            people: int('How many people are needed for this task.'),
          },
          'A task in the job checklist.',
          ['name']
        ),
        'The job checklist, in order. Worth filling in whenever the work has more than one step.'
      ),
      createCustomer: bool('Create the customer if no existing customer matches the name.'),
      customerType: enumOf(['Company', 'Individual'], 'Type to use when creating a new customer.'),
    },
    ['customer', 'title']
  ),
  summarize: (input, result) => `Created job ${result.job.number} for ${result.job.customerName}.`,
  artifacts: (result) => [{ label: `Open job ${result.job.number}`, path: `/jobs/${result.job.id}` }],
  async run(input) {
    const customer = requireCustomer(input);
    const site = input.site ? resolveJobSite(customer, input.site) : null;
    const tasks = (input.tasks || []).map((task) => newTaskNode(task));
    // A job without a task cannot take hours, so the checklist is never empty.
    if (!tasks.length) tasks.push(mainTaskNode());
    const estimatedHours = syncEstimateWithTasks(tasks, input.estimatedHours);
    const scheduledDate = input.scheduledDate ? parseDate(input.scheduledDate) : null;
    const status = input.status || (scheduledDate ? 'Scheduled' : 'Pending');
    const number = store.getNextNumber('J-', 'jobs');
    let asset = null;
    if (input.asset) {
      asset = resolveOne('assets', input.asset, { searchFields: ['name', 'serial', 'identifier', 'customerName'], what: 'asset' }).record;
    }

    const job = store.create('jobs', {
      number,
      customerId: customer.id,
      customerName: customerLabel(customer),
      contactName: input.contactName || customer.contactName || '',
      ...(site ? { siteName: site.siteName } : {}),
      siteAddress: site ? (site.siteAddress || customerAddress(customer)) : (input.siteAddress || customerAddress(customer)),
      ...(asset ? { assetId: asset.id } : {}),
      title: input.title,
      // `jobs.notes` is what survives to Postgres; the UI reads `description || notes`.
      description: input.description || '',
      notes: input.description || '',
      status,
      priority: input.priority || 'Medium',
      scheduledDate,
      estimatedHours,
      laborCost: 0,
      materialCost: 0,
      tasks,
      ...actorStamp(),
    });

    await logActivity({
      type: 'job_created',
      text: `Job ${job.number} created for ${job.customerName}.`,
      recordType: 'job',
      recordId: job.id,
    });

    return { job, tasks, created: true };
  },
});

defineAction({
  name: 'update_job',
  title: 'Update job',
  description: 'Change the details of an existing job — title, description, priority, the customer site it is booked to, contact or estimated hours.',
  permission: { module: 'Jobs', key: 'edit' },
  inputSchema: objectSchema(
    {
      job: str('Job number, title, customer or id.'),
      customer: str('Customer, to narrow the job down when the name is not unique.'),
      title: str('New job title.'),
      description: str('New job description.'),
      priority: enumOf(JOB_PRIORITIES, 'New priority.'),
      asset: str('Move the job to a different equipment asset — the asset name or serial.'),
      removeAsset: bool('Take the asset off the job.'),
      contactName: str('New on-site contact.'),
      site: str('Move the job to one of the customer\'s sites — the site name or its address. Use list_sites to see them.'),
      siteAddress: str('New site address.'),
      estimatedHours: num('New estimated labour hours.'),
      project: str('Project to file the job under.'),
    },
    ['job']
  ),
  summarize: (input, result) => `Updated job ${result.job.number} (${result.fields.join(', ')}).`,
  artifacts: (result) => [{ label: `Open job ${result.job.number}`, path: `/jobs/${result.job.id}` }],
  async run(input) {
    const job = resolveJob(input.job, jobScope(input));
    const patch = {};
    const fields = [];

    const text = { title: 'title', contactName: 'contactName', siteAddress: 'siteAddress' };
    Object.entries(text).forEach(([key, column]) => {
      if (input[key] != null) {
        patch[column] = input[key];
        fields.push(key);
      }
    });

    if (input.site) {
      const customer = jobCustomer(job);
      const site = resolveJobSite(customer, input.site);
      const existing = fields.indexOf('siteAddress');
      if (existing === -1) fields.push('site');
      else fields[existing] = 'site';
      // The chosen site carries both its name and its address, so it wins over
      // a bare siteAddress passed in the same call. A site saved without an
      // address leaves the job's own address alone.
      patch.siteName = site.siteName;
      patch.siteAddress = site.siteAddress || job.siteAddress || customerAddress(customer);
    }

    if (input.description != null) {
      patch.description = input.description;
      patch.notes = input.description;
      fields.push('description');
    }
    if (input.priority != null) {
      patch.priority = input.priority;
      fields.push('priority');
    }
    if (input.estimatedHours != null) {
      patch.estimatedHours = input.estimatedHours;
      fields.push('estimatedHours');
    }
    if (input.project != null) {
      const project = resolveOne('projects', input.project, { searchFields: ['name', 'number'] }).record;
      patch.projectId = project.id;
      fields.push('project');
    }
    if (input.removeAsset) {
      patch.assetId = null;
      fields.push('asset');
    } else if (input.asset != null) {
      const asset = resolveOne('assets', input.asset, { searchFields: ['name', 'serial', 'identifier', 'customerName'], what: 'asset' }).record;
      patch.assetId = asset.id;
      fields.push('asset');
    }

    if (!fields.length) throw invalidInput('Nothing to update — pass at least one new value.');

    await store.update('jobs', job.id, patch);
    await logActivity({
      type: 'job_updated',
      text: `Job ${job.number} updated (${fields.join(', ')}).`,
      recordType: 'job',
      recordId: job.id,
    });

    return { job: store.getById('jobs', job.id), fields };
  },
});

defineAction({
  name: 'set_job_status',
  title: 'Set job status',
  description: 'Move a job to a different status, e.g. Put On Hold, resume it to In Progress, or mark it Invoiced.',
  permission: { module: 'Jobs', key: 'edit' },
  inputSchema: objectSchema(
    {
      job: str('Job number, title, customer or id.'),
      customer: str('Customer, to narrow the job down when the name is not unique.'),
      status: enumOf(JOB_STATUSES, 'The status to move the job to.'),
      note: str('Optional note explaining the change.'),
    },
    ['job', 'status']
  ),
  summarize: (input, result) => (result.changed
    ? `Job ${result.job.number} moved from ${result.from} to ${result.job.status}.`
    : `Job ${result.job.number} is already ${result.job.status}.`),
  artifacts: (result) => [{ label: `Open job ${result.job.number}`, path: `/jobs/${result.job.id}` }],
  async run(input) {
    const job = resolveJob(input.job, jobScope(input));
    if (job.status === input.status) return { job, changed: false, from: job.status };

    const from = job.status;
    const entry = historyEntry(`Job status changed from "${from}" to "${input.status}"${input.note ? ` — ${input.note}` : ''}`);
    const patch = { status: input.status };
    if (input.note) {
      patch.activityLog = [{ id: store.generateId(), type: 'combined', content: input.note, files: [], date: new Date().toISOString(), author: entry.author }, ...(job.activityLog || [])];
    }

    await store.update('jobs', job.id, patch);
    await recordHistory(job, entry, { from, to: input.status });
    await logActivity({
      type: 'status_changed',
      text: entry.content,
      recordType: 'job',
      recordId: job.id,
      status: input.status,
    });

    return { job: store.getById('jobs', job.id), changed: true, from };
  },
});

defineAction({
  name: 'add_job_task',
  title: 'Add job task',
  description: 'Add a task with a name, a description and its hours to a job checklist, or a sub-task under an existing task.',
  permission: { module: 'Jobs', key: 'manage_tasks' },
  inputSchema: objectSchema(
    {
      job: str('Job number, title, customer or id.'),
      customer: str('Customer, to narrow the job down when the name is not unique.'),
      name: str('Task name.'),
      description: str('What this task covers.'),
      parent: str('Existing task to nest this under, for a sub-task.'),
      estimatedHours: num('Estimated hours for this task.'),
      people: int('How many people are needed for this task.'),
      technician: str('Technician to assign to this task.'),
    },
    ['job', 'name']
  ),
  summarize: (input, result) => `Added task "${result.task.name}"${result.parent ? ` under ${result.parent.name}` : ''} to job ${result.job.number}.`,
  artifacts: (result) => [{ label: `Open job ${result.job.number}`, path: `/jobs/${result.job.id}` }],
  async run(input) {
    const job = resolveJob(input.job, jobScope(input));
    const technician = input.technician ? findTechnician(input.technician) : null;
    const tasks = cloneTasks(job.tasks);

    let parent = null;
    if (input.parent) {
      const entry = resolveJobTask({ tasks }, input.parent);
      parent = taskParent(tasks, entry.path);
    }

    const node = newTaskNode(input);
    if (technician) node.technicians = [{ id: technician.id, name: technician.name }];
    if (parent) parent.subTasks.push(node);
    else tasks.push(node);

    await store.update('jobs', job.id, { tasks });
    await logActivity({
      type: 'task_added',
      text: `Task "${node.name}" added to job ${job.number}.`,
      recordType: 'job',
      recordId: job.id,
    });

    return { job, task: node, parent, tasks };
  },
});

defineAction({
  name: 'update_job_task',
  title: 'Update job task',
  description: 'Rename a job task, change its description or estimate, or set how complete it is. Parent task progress is recalculated automatically.',
  permission: { module: 'Jobs', key: 'manage_tasks' },
  inputSchema: objectSchema(
    {
      job: str('Job number, title, customer or id.'),
      customer: str('Customer, to narrow the job down when the name is not unique.'),
      task: str('Task name, or a sub-task name.'),
      name: str('New task name.'),
      description: str('New description of what this task covers.'),
      status: enumOf(TASK_STATUSES, 'New task status.'),
      progress: int('Percent complete, 0-100.'),
      estimatedHours: num('New estimated hours for this task.'),
      people: int('New number of people for this task.'),
      technician: str('Technician to assign to this task.'),
    },
    ['job', 'task']
  ),
  summarize: (input, result) => `Updated task "${result.task.name}" on job ${result.job.number}.`,
  artifacts: (result) => [{ label: `Open job ${result.job.number}`, path: `/jobs/${result.job.id}` }],
  async run(input) {
    const job = resolveJob(input.job, jobScope(input));
    const tasks = cloneTasks(job.tasks);
    const entry = resolveJobTask({ tasks }, input.task);
    const fields = [];

    if (input.name != null) {
      entry.node.name = input.name;
      fields.push('name');
    }
    if (input.description != null) {
      entry.node.description = input.description;
      fields.push('description');
    }
    if (input.estimatedHours != null) {
      entry.node.estimatedHours = input.estimatedHours;
      fields.push('estimatedHours');
    }
    if (input.people != null) {
      entry.node.people = input.people;
      fields.push('people');
    }
    if (input.technician != null) {
      const technician = findTechnician(input.technician);
      entry.node.technicians = [{ id: technician.id, name: technician.name }];
      fields.push('technician');
    }
    if (input.progress != null) {
      entry.node.progress = Math.max(0, Math.min(100, input.progress));
      entry.node.status = entry.node.progress === 100 ? 'Completed' : entry.node.progress === 0 ? 'Not Started' : 'In Progress';
      fields.push('progress');
    }
    if (input.status != null) {
      entry.node.status = input.status;
      if (input.status === 'Completed') entry.node.progress = 100;
      fields.push('status');
    }

    if (!fields.length) throw invalidInput('Nothing to update — pass at least one new value.');
    if (input.progress == null && input.status == null && fields.some((field) => ['estimatedHours', 'people'].includes(field))) {
      rollUpProgress(tasks, entry.path);
    }

    await store.update('jobs', job.id, { tasks });
    await logActivity({
      type: 'task_updated',
      text: `Task "${entry.node.name}" on job ${job.number} updated (${fields.join(', ')}).`,
      recordType: 'job',
      recordId: job.id,
    });

    return { job, task: entry.node, fields, tasks };
  },
});

defineAction({
  name: 'delete_job_task',
  title: 'Delete job task',
  description:
    'Permanently remove a task and its sub-tasks from a job. Here is permanent — untick a finished task with complete_job_task instead. The job keeps every other task, and parent progress is recalculated.',
  permission: { module: 'Jobs', key: 'manage_tasks' },
  risky: true,
  inputSchema: objectSchema(
    {
      job: str('Job number, title, customer or id.'),
      customer: str('Customer, to narrow the job down when the name is not unique.'),
      task: str('Task name, or a sub-task name, to remove.'),
    },
    ['job', 'task']
  ),
  summarize: (input, result) => `Deleted task "${result.task.name}"${result.subTasks ? ` and ${result.subTasks} sub-task${result.subTasks === 1 ? '' : 's'}` : ''} from job ${result.job.number}.`,
  artifacts: (result) => [{ label: `Open job ${result.job.number}`, path: `/jobs/${result.job.id}` }],
  async run(input) {
    const job = resolveJob(input.job, jobScope(input));
    const tasks = cloneTasks(job.tasks);
    const entry = resolveJobTask({ tasks }, input.task);
    const siblings = entry.path.length === 1 ? tasks : subTasksOf(taskParent(tasks, entry.path.slice(0, -1)));
    if (!siblings) throw invalidInput(`Could not find "${input.task}" in job ${job.number}'s task list.`);
    const [removed] = siblings.splice(entry.path[entry.path.length - 1], 1);
    const subTasks = taskEntries(subTasksOf(removed)).length;
    rollUpProgress(tasks, entry.path);

    await store.update('jobs', job.id, { tasks });
    await logActivity({
      type: 'task_deleted',
      text: `Task "${removed.name}" deleted from job ${job.number}${subTasks ? ` with ${subTasks} sub-task${subTasks === 1 ? '' : 's'}` : ''}.`,
      recordType: 'job',
      recordId: job.id,
    });

    return { job, task: removed, subTasks, tasks };
  },
});

defineAction({
  name: 'complete_job_task',
  title: 'Complete job task',
  description: 'Tick a job task off. Parent task progress is recalculated automatically.',
  permission: { module: 'Jobs', key: 'manage_tasks' },
  inputSchema: objectSchema(
    {
      job: str('Job number, title, customer or id.'),
      customer: str('Customer, to narrow the job down when the name is not unique.'),
      task: str('Task name, or a sub-task name.'),
      complete: bool('Set false to un-tick the task instead. Defaults to true.'),
    },
    ['job', 'task']
  ),
  summarize: (input, result) => (result.changed
    ? `Task "${result.task.name}" marked ${result.task.status} on job ${result.job.number}.`
    : `Task "${result.task.name}" is already ${result.task.status}.`),
  artifacts: (result) => [{ label: `Open job ${result.job.number}`, path: `/jobs/${result.job.id}` }],
  async run(input) {
    const job = resolveJob(input.job, jobScope(input));
    const complete = input.complete !== false;
    const tasks = cloneTasks(job.tasks);
    const entry = resolveJobTask({ tasks }, input.task);
    const target = complete ? 100 : 0;

    if (entry.node.progress === target && entry.node.status === (complete ? 'Completed' : 'Not Started')) {
      return { job, task: entry.node, changed: false, tasks };
    }

    entry.node.progress = target;
    entry.node.status = complete ? 'Completed' : 'Not Started';
    rollUpProgress(tasks, entry.path);

    await store.update('jobs', job.id, { tasks });
    await logActivity({
      type: 'task_completed',
      text: `Task "${entry.node.name}" marked ${entry.node.status} on job ${job.number}.`,
      recordType: 'job',
      recordId: job.id,
    });

    return { job, task: entry.node, changed: true, tasks };
  },
});

defineAction({
  name: 'add_job_note',
  title: 'Add job note',
  description: 'Add a note to a job, either internally for the office or onto the customer-visible message thread.',
  permission: { module: 'Jobs', key: 'edit' },
  inputSchema: objectSchema(
    {
      job: str('Job number, title, customer or id.'),
      customer: str('Customer, to narrow the job down when the name is not unique.'),
      note: str('The note or message to record.'),
      audience: enumOf(['internal', 'customer'], 'Internal office note (default) or a message on the customer thread.'),
    },
    ['job', 'note']
  ),
  summarize: (input, result) => `Note added to job ${result.job.number}${result.audience === 'customer' ? ' customer thread' : ''}.`,
  artifacts: (result) => [{ label: `Open job ${result.job.number}`, path: `/jobs/${result.job.id}` }],
  async run(input) {
    const job = resolveJob(input.job, jobScope(input));
    const audience = input.audience || 'internal';
    const actor = actorStamp();
    const entry = {
      id: store.generateId(),
      content: input.note,
      date: new Date().toISOString(),
      author: actor.createdBy || 'brny',
    };

    const patch = audience === 'customer'
      ? { customerActivityLog: [{ ...entry, isCustomer: false }, ...(job.customerActivityLog || [])] }
      : { activityLog: [{ ...entry, type: 'combined', files: [] }, ...(job.activityLog || [])] };

    await store.update('jobs', job.id, patch);
    await logActivity({
      type: 'note',
      text: `${audience === 'customer' ? 'Customer message' : 'Note'} on job ${job.number}: ${input.note}`,
      recordType: 'job',
      recordId: job.id,
    });

    return { job, entry, audience };
  },
});

defineAction({
  name: 'delete_job_note',
  title: 'Delete a job note',
  description: 'Permanently delete a note or customer message from a job\'s history. This cannot be undone. Match it by a few words of the note.',
  permission: { module: 'Jobs', key: 'edit' },
  risky: true,
  inputSchema: objectSchema(
    {
      job: str('Job number, title, customer or id.'),
      customer: str('Customer, to narrow the job down when the name is not unique.'),
      note: str('A few words from the note or message to delete.'),
      audience: enumOf(['internal', 'customer'], 'The internal notes or the customer thread. Defaults to internal.'),
    },
    ['job', 'note']
  ),
  summarize: (input, result) => result.summary,
  artifacts: (result) => [{ label: `Open job ${result.job.number}`, path: `/jobs/${result.job.id}` }],
  async run(input) {
    const job = resolveJob(input.job, jobScope(input));
    const audience = input.audience || 'internal';
    const key = audience === 'customer' ? 'customerActivityLog' : 'activityLog';
    const rows = Array.isArray(job[key]) ? job[key] : [];
    const wanted = String(input.note || '').toLowerCase();
    const matches = rows.filter((row) => String(row.content || row.text || '').toLowerCase().includes(wanted));
    if (!matches.length) throw invalidInput(`Job ${job.number} has no ${audience} note matching "${input.note}".`);
    if (matches.length > 1) {
      throw invalidInput(`"${input.note}" matches ${matches.length} notes on ${job.number}. Use a longer phrase — the matches start: ${matches.slice(0, 3).map((row) => `"${String(row.content || row.text || '').slice(0, 40)}"`).join('; ')}.`);
    }
    const [removed] = matches;
    await store.update('jobs', job.id, { [key]: rows.filter((row) => row !== removed) });
    await logActivity({
      type: 'note_deleted',
      text: `A ${audience === 'customer' ? 'customer message' : 'note'} was deleted from job ${job.number}.`,
      recordType: 'job',
      recordId: job.id,
    });
    return {
      summary: `Deleted the ${audience === 'customer' ? 'customer message' : 'note'} from ${job.number}.`,
      job: { id: job.id, number: job.number },
      note: { id: removed.id, content: removed.content || removed.text || '' },
    };
  },
});

defineAction({
  name: 'complete_job',
  title: 'Complete job',
  description: 'Mark a job as Completed. For a job on an asset, pass the meter reading and the condition it was left in; they go on the asset\'s service log. The reply lists any tasks that were still open so you can finish them off.',
  permission: { module: 'Jobs', key: 'edit' },
  inputSchema: objectSchema(
    {
      job: str('Job number, title, customer or id.'),
      customer: str('Customer, to narrow the job down when the name is not unique.'),
      note: str('Optional completion note.'),
      meter: num('For a job on an asset: the meter reading when the work was finished.'),
      condition: enumOf(ASSET_CONDITIONS, 'For a job on an asset: the condition it was left in.'),
      conditionNotes: str('Anything about the asset\'s condition the next visit should know.'),
    },
    ['job']
  ),
  summarize: (input, result) => (result.changed
    ? `Job ${result.job.number} marked Completed${result.openTasks.length ? ` with ${result.openTasks.length} task(s) still open` : ''}.`
    : `Job ${result.job.number} is already ${result.job.status}.`),
  artifacts: (result) => [{ label: `Open job ${result.job.number}`, path: `/jobs/${result.job.id}` }],
  async run(input) {
    const job = resolveJob(input.job, jobScope(input));
    const openTasks = taskEntries(job.tasks)
      .filter((entry) => entry.node.status !== 'Completed')
      .map((entry) => ({ id: entry.node.id, label: [...entry.parents, entry.node.name].join(' › '), status: entry.node.status }));

    if (job.status === 'Completed') return { job, changed: false, openTasks };

    const from = job.status;
    const entry = historyEntry(`Job status changed from "${from}" to "Completed"${input.note ? ` — ${input.note}` : ''}`);
    if (input.meter != null && input.meter < 0) throw invalidInput('A meter reading cannot be negative.');
    // The asset reading rides on the job; completing it writes the service log.
    await store.update('jobs', job.id, {
      status: 'Completed',
      ...(job.assetId && input.meter != null ? { completionMeter: input.meter } : {}),
      ...(job.assetId && input.condition ? { assetCondition: input.condition, assetConditionNotes: input.conditionNotes || '' } : {}),
    });
    await recordHistory(job, entry, { from, to: 'Completed' });
    await logActivity({
      type: 'status_changed',
      text: entry.content,
      recordType: 'job',
      recordId: job.id,
      status: 'Completed',
    });

    return { job: store.getById('jobs', job.id), changed: true, openTasks };
  },
});

defineAction({
  name: 'delete_job',
  title: 'Delete job',
  description: 'Permanently delete a job and its task list. This cannot be undone.',
  permission: { module: 'Jobs', key: 'delete' },
  risky: true,
  inputSchema: objectSchema(
    {
      job: str('Job number, title, customer or id.'),
      customer: str('Customer, to narrow the job down when the name is not unique.'),
      reason: str('Why the job is being deleted.'),
    },
    ['job']
  ),
  summarize: (input, result) => `Deleted job ${result.job.number}${result.job.customerName ? ` for ${result.job.customerName}` : ''}.`,
  async run(input) {
    const job = resolveJob(input.job, jobScope(input));
    const snapshot = { id: job.id, number: job.number, title: job.title, customerName: job.customerName, status: job.status };

    await store.delete('jobs', job.id);
    await logActivity({
      type: 'job_deleted',
      text: `Job ${snapshot.number} deleted${input.reason ? ` — ${input.reason}` : ''}.`,
      recordType: 'job',
      recordId: snapshot.id,
    });

    return { job: snapshot, reason: input.reason || null };
  },
});
