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
import { customerLabel, resolveCustomer } from './customers.js';
import { findTechnician } from './leads.js';
import { parseDate } from './dates.js';

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

function newTaskNode({ name, estimatedHours, people }) {
  const node = {
    id: store.generateId(),
    name: name || 'New Task',
    status: 'Not Started',
    progress: 0,
    startDate: new Date().toISOString(),
    technicians: [],
    subTasks: [],
  };
  if (estimatedHours != null) node.estimatedHours = estimatedHours;
  if (people != null) node.people = people;
  return node;
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

defineAction({
  name: 'create_job',
  title: 'Create job',
  description:
    'Create a job for a customer, optionally with a first list of tasks, a priority and a scheduled date. Use this for new work that is not coming from a quote.',
  permission: { module: 'Jobs', key: 'create' },
  inputSchema: objectSchema(
    {
      customer: str('Customer name, number or id the job is for.'),
      title: str('Short job title, e.g. "Switchboard upgrade".'),
      description: str('What the job involves. Shown on the job card.'),
      siteAddress: str('Site address if different from the customer address.'),
      contactName: str('On-site contact person.'),
      priority: enumOf(JOB_PRIORITIES, 'Job priority. Defaults to Medium.'),
      status: enumOf(JOB_STATUSES, 'Starting status. Defaults to Scheduled when a date is given, otherwise Pending.'),
      scheduledDate: dateish('Date the job is booked for.'),
      estimatedHours: num('Estimated labour hours for the whole job.'),
      tasks: list(
        objectOf(
          {
            name: str('Task name.'),
            estimatedHours: num('Estimated hours for this task.'),
            people: int('How many people are needed for this task.'),
          },
          'A task in the job checklist.',
          ['name']
        ),
        'Optional first tasks, in order.'
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
    const tasks = (input.tasks || []).map((task) => newTaskNode(task));
    const scheduledDate = input.scheduledDate ? parseDate(input.scheduledDate) : null;
    const status = input.status || (scheduledDate ? 'Scheduled' : 'Pending');
    const number = store.getNextNumber('J-', 'jobs');

    const job = store.create('jobs', {
      number,
      customerId: customer.id,
      customerName: customerLabel(customer),
      contactName: input.contactName || customer.contactName || '',
      siteAddress: input.siteAddress || customer.siteAddress || customer.address || '',
      title: input.title,
      // `jobs.notes` is what survives to Postgres; the UI reads `description || notes`.
      description: input.description || '',
      notes: input.description || '',
      status,
      priority: input.priority || 'Medium',
      scheduledDate,
      estimatedHours: input.estimatedHours || 0,
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
  description: 'Change the details of an existing job — title, description, priority, site address, contact or estimated hours.',
  permission: { module: 'Jobs', key: 'edit' },
  inputSchema: objectSchema(
    {
      job: str('Job number, title, customer or id.'),
      customer: str('Customer, to narrow the job down when the name is not unique.'),
      title: str('New job title.'),
      description: str('New job description.'),
      priority: enumOf(JOB_PRIORITIES, 'New priority.'),
      contactName: str('New on-site contact.'),
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

    const entry = historyEntry(`Job status changed from "${job.status}" to "${input.status}"${input.note ? ` — ${input.note}` : ''}`);
    const historyLog = [entry, ...(job.historyLog || [])];
    const activityLog = input.note
      ? [{ id: store.generateId(), type: 'combined', content: input.note, files: [], date: new Date().toISOString(), author: entry.author }, ...(job.activityLog || [])]
      : job.activityLog;

    await store.update('jobs', job.id, { status: input.status, historyLog, ...(activityLog ? { activityLog } : {}) });
    await logActivity({
      type: 'status_changed',
      text: entry.content,
      recordType: 'job',
      recordId: job.id,
      status: input.status,
    });

    return { job: store.getById('jobs', job.id), changed: true, from: job.status, historyLog };
  },
});

defineAction({
  name: 'add_job_task',
  title: 'Add job task',
  description: 'Add a task to a job checklist, or a sub-task under an existing task.',
  permission: { module: 'Jobs', key: 'manage_tasks' },
  inputSchema: objectSchema(
    {
      job: str('Job number, title, customer or id.'),
      customer: str('Customer, to narrow the job down when the name is not unique.'),
      name: str('Task name.'),
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
  description: 'Rename a job task, change its estimate, or set how complete it is. Parent task progress is recalculated automatically.',
  permission: { module: 'Jobs', key: 'manage_tasks' },
  inputSchema: objectSchema(
    {
      job: str('Job number, title, customer or id.'),
      customer: str('Customer, to narrow the job down when the name is not unique.'),
      task: str('Task name, or a sub-task name.'),
      name: str('New task name.'),
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
  name: 'complete_job',
  title: 'Complete job',
  description: 'Mark a job as Completed. The reply lists any tasks that were still open so you can finish them off.',
  permission: { module: 'Jobs', key: 'edit' },
  inputSchema: objectSchema(
    {
      job: str('Job number, title, customer or id.'),
      customer: str('Customer, to narrow the job down when the name is not unique.'),
      note: str('Optional completion note.'),
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

    const entry = historyEntry(`Job status changed from "${job.status}" to "Completed"${input.note ? ` — ${input.note}` : ''}`);
    await store.update('jobs', job.id, { status: 'Completed', historyLog: [entry, ...(job.historyLog || [])] });
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
