/**
 * Recurring jobs — the templates that spawn a job on every occurrence.
 *
 * A template is a job record with `isRecurring: true`, status "Recurring
 * Template", a `T-` number and a `recurringConfig`, written exactly the way
 * `JobForm.js#buildJobPayload` writes one. The maintenance engine does the
 * spawning, so after every write the same engine calls `JobForm.js` makes are
 * made here and the next week's jobs appear straight away.
 */

import { store } from '../data/store.js';
import { defineAction } from './registry.js';
import { objectSchema, str, num, int, bool, enumOf, list, objectOf, dateish } from './schema.js';
import { invalidInput } from './errors.js';
import { actorStamp, logActivity } from './context.js';
import { customerLabel, resolveCustomer, resolveSite, siteAmbiguous, siteNotFound } from './customers.js';
import { findTechnician } from './leads.js';
import { parseDate, todayLocalISO, toDateKey } from './dates.js';
import { JOB_PRIORITIES, resolveJob, mainTaskNode, syncEstimateWithTasks } from './jobs.js';

export const FREQUENCIES = ['Daily', 'Weekly', 'Monthly'];
export const WEEKDAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

const isTemplate = (job) => job.isRecurring === true || job.status === 'Recurring Template';

export function templateLabel(job) {
  if (!job) return 'recurring job';
  return `${job.number || job.id}${job.title ? ` ${job.title}` : ''}${job.customerName ? ` — ${job.customerName}` : ''}`;
}

export function resolveTemplate(query) {
  return resolveJob(query, { filter: isTemplate });
}

/** `["Monday", "Thursday"]` → `[1, 4]`, the `Date#getDay` numbers the engine matches on. */
function weekdayNumbers(days) {
  return [...new Set((days || []).map((day) => WEEKDAYS.indexOf(day)).filter((n) => n >= 0))].sort((a, b) => a - b);
}

function monthDays(days) {
  const clean = (days || []).map((day) => parseInt(day, 10));
  const bad = clean.filter((day) => !(day >= 1 && day <= 31));
  if (bad.length) throw invalidInput('Days of the month run from 1 to 31.');
  return [...new Set(clean)].sort((a, b) => a - b);
}

/** One year on from `startKey`, the end the series gets when none is given. */
function defaultEnd(startKey) {
  const [y, m, d] = startKey.split('-').map(Number);
  return toDateKey(new Date(y + 1, m - 1, d));
}

/** A plain-English description of a recurrence, for summaries and the list view. */
export function describeRecurrence(config) {
  if (!config) return 'no schedule';
  let pattern = config.freq || 'Weekly';
  if (config.freq === 'Weekly' && config.daysOfWeek?.length) pattern = `Weekly on ${config.daysOfWeek.map((n) => WEEKDAYS[n]).join(', ')}`;
  if (config.freq === 'Monthly' && config.daysOfMonth?.length) pattern = `Monthly on day ${config.daysOfMonth.join(', ')}`;
  return `${pattern}, ${config.start} to ${config.end}`;
}

/**
 * Spawn the coming week's occurrences, and push template edits to the jobs
 * already spawned. Loaded lazily like `JobForm.js` does, because the engine
 * pulls in the reminder and Supabase modules.
 */
async function runEngine(template, { propagate = false } = {}) {
  const engine = await import('../utils/maintenanceEngine.js');
  if (propagate) engine.propagateParentJobUpdates(store.getById('jobs', template.id) || template);
  engine.checkRecurringJobs();
  return engine;
}

async function upcomingDates(config, count = 5) {
  const { getOccurrenceDatesBetween, isOccurrenceSkipped } = await import('../utils/maintenanceEngine.js');
  const today = todayLocalISO();
  return getOccurrenceDatesBetween(config, today, config.end)
    .filter((date) => !isOccurrenceSkipped(config, date))
    .slice(0, count);
}

function scheduleInput(required) {
  return {
    frequency: enumOf(FREQUENCIES, `How often the job repeats.${required ? '' : ' Leave out to keep the current one.'}`),
    daysOfWeek: list(enumOf(WEEKDAYS, 'A weekday.'), 'Weekly only: which days of the week. Defaults to the start date\'s weekday.'),
    daysOfMonth: list(int('A day of the month, 1-31.'), 'Monthly only: which days of the month. Defaults to the start date\'s day.'),
    start: dateish(`First date the job can fall on.${required ? ' Defaults to today.' : ''}`),
    end: dateish(`Last date the job can fall on.${required ? ' Defaults to one year after the start.' : ' Set it to today to stop the series.'}`),
    technician: str('Technician every occurrence is assigned to. Occurrences with a technician are booked as Scheduled.'),
  };
}

defineAction({
  name: 'create_recurring_job',
  title: 'Create recurring job',
  description:
    'Set up a job that repeats on a schedule — a monthly service, a weekly clean, a daily check. This creates a recurring template (numbered T-); the app then creates a real job for every occurrence in the coming week, automatically, from the template\'s title, tasks and hours. Use this whenever the user asks for anything that happens "every", "each", "weekly", "monthly" or "on a schedule". Author it like create_job: a name from what the customer asked for, a description, and tasks with hours.',
  permission: { module: 'Jobs', key: 'create' },
  inputSchema: objectSchema(
    {
      customer: str('Customer name, number or id the work is for.'),
      title: str('Short title naming the work, e.g. "Monthly RCD test". Every occurrence carries it.'),
      description: str('What each visit involves.'),
      site: str('Which of the customer\'s sites the work is at — the site name or its address. Use list_sites to see them.'),
      siteAddress: str('Site address if different from the customer address.'),
      contactName: str('On-site contact person.'),
      priority: enumOf(JOB_PRIORITIES, 'Priority of every occurrence. Defaults to Medium.'),
      estimatedHours: num('Estimated labour hours per visit.'),
      tasks: list(
        objectOf(
          {
            name: str('Task name.'),
            description: str('What this task covers.'),
            estimatedHours: num('Estimated hours for this task, per visit.'),
            people: int('How many people are needed for this task.'),
          },
          'A task done on every visit.',
          ['name']
        ),
        'The checklist every occurrence starts with.'
      ),
      ...scheduleInput(true),
    },
    ['customer', 'title', 'frequency']
  ),
  summarize: (input, result) => `Set up ${result.template.number} ${result.template.title}: ${describeRecurrence(result.template.recurringConfig)}.`,
  artifacts: (result) => [{ label: `Open ${result.template.number}`, path: `/jobs/${result.template.id}` }],
  async run(input) {
    const { customer } = resolveCustomer(input.customer, { create: false });
    if (!customer) throw invalidInput(`No customer matches "${input.customer}". Create the customer first.`);

    let site = null;
    if (input.site) {
      const found = resolveSite(customer, input.site);
      if (found.kind === 'many') throw siteAmbiguous(input.site, found.hits);
      if (found.kind === 'none') throw siteNotFound(customer, input.site);
      site = found.site;
    }

    const start = input.start ? parseDate(input.start) : todayLocalISO();
    const end = input.end ? parseDate(input.end) : defaultEnd(start);
    if (end < start) throw invalidInput('The series ends before it starts.');
    const technician = input.technician ? findTechnician(input.technician) : null;

    const tasks = (input.tasks || []).map((task) => ({ ...mainTaskNode(), name: task.name, ...(task.description ? { description: task.description } : {}), ...(task.estimatedHours != null ? { estimatedHours: task.estimatedHours } : {}), ...(task.people != null ? { people: task.people } : {}) }));
    if (!tasks.length) tasks.push(mainTaskNode());
    const estimatedHours = syncEstimateWithTasks(tasks, input.estimatedHours);

    const recurringConfig = {
      freq: input.frequency,
      start,
      end,
      defaultTechnicianId: technician ? technician.id : null,
      daysOfWeek: input.frequency === 'Weekly' ? weekdayNumbers(input.daysOfWeek) : [],
      daysOfMonth: input.frequency === 'Monthly' ? monthDays(input.daysOfMonth) : [],
      skippedDates: [],
    };

    const customerAddress = customer.siteAddress || customer.address || '';
    const template = store.create('jobs', {
      number: store.getNextNumber('T-', 'jobs'),
      customerId: customer.id,
      customerName: customerLabel(customer),
      contactName: input.contactName || customer.contactName || '',
      ...(site ? { siteName: String(site.name || '').trim() } : {}),
      siteAddress: site ? (String(site.address || '').trim() || customerAddress) : (input.siteAddress || customerAddress),
      title: input.title,
      description: input.description || '',
      notes: input.description || '',
      status: 'Recurring Template',
      isRecurring: true,
      recurringConfig,
      priority: input.priority || 'Medium',
      scheduledDate: null,
      estimatedHours,
      laborCost: 0,
      materialCost: 0,
      tasks,
      ...actorStamp(),
    });

    await logActivity({
      type: 'job_created',
      text: `Recurring job ${template.number} set up for ${template.customerName} — ${describeRecurrence(recurringConfig)}.`,
      recordType: 'job',
      recordId: template.id,
    });

    await runEngine(template);
    return { template: store.getById('jobs', template.id) || template, nextDates: await upcomingDates(recurringConfig) };
  },
});

defineAction({
  name: 'update_recurring_job',
  title: 'Update recurring job',
  description:
    'Change a recurring job — its schedule (frequency, days, start or end date), its technician, or its title, description or priority. Jobs it has already created that are not finished pick up the change. To stop a series, set `end` to today; the jobs already created stay.',
  permission: { module: 'Jobs', key: 'edit' },
  inputSchema: objectSchema(
    {
      template: str('The recurring job: its T- number, title, customer or id.'),
      title: str('New title.'),
      description: str('New description.'),
      priority: enumOf(JOB_PRIORITIES, 'New priority.'),
      ...scheduleInput(false),
    },
    ['template']
  ),
  summarize: (input, result) => `Updated ${result.template.number} (${result.fields.join(', ')}): ${describeRecurrence(result.template.recurringConfig)}.`,
  artifacts: (result) => [{ label: `Open ${result.template.number}`, path: `/jobs/${result.template.id}` }],
  async run(input) {
    const template = resolveTemplate(input.template);
    const config = { ...(template.recurringConfig || {}) };
    const patch = {};
    const fields = [];

    if (input.title != null) { patch.title = input.title; fields.push('title'); }
    if (input.description != null) { patch.description = input.description; patch.notes = input.description; fields.push('description'); }
    if (input.priority != null) { patch.priority = input.priority; fields.push('priority'); }

    if (input.frequency != null) { config.freq = input.frequency; fields.push('frequency'); }
    if (input.daysOfWeek != null) { config.daysOfWeek = weekdayNumbers(input.daysOfWeek); fields.push('daysOfWeek'); }
    if (input.daysOfMonth != null) { config.daysOfMonth = monthDays(input.daysOfMonth); fields.push('daysOfMonth'); }
    if (input.start != null) { config.start = parseDate(input.start); fields.push('start'); }
    if (input.end != null) { config.end = parseDate(input.end); fields.push('end'); }
    if (input.technician != null) { config.defaultTechnicianId = findTechnician(input.technician).id; fields.push('technician'); }

    if (!fields.length) throw invalidInput('Nothing to update — pass at least one new value.');
    if (config.freq !== 'Weekly') config.daysOfWeek = [];
    if (config.freq !== 'Monthly') config.daysOfMonth = [];
    if (config.start && config.end && config.end < config.start) throw invalidInput('The series ends before it starts.');
    patch.recurringConfig = config;

    await store.update('jobs', template.id, patch);
    await logActivity({
      type: 'job_updated',
      text: `Recurring job ${template.number} updated (${fields.join(', ')}).`,
      recordType: 'job',
      recordId: template.id,
    });

    const updated = store.getById('jobs', template.id);
    await runEngine(updated, { propagate: true });
    return { template: store.getById('jobs', template.id), fields, nextDates: await upcomingDates(config) };
  },
});

defineAction({
  name: 'skip_recurring_occurrence',
  title: 'Skip recurring occurrence',
  description:
    'Skip one date of a recurring job so no job is created for it — a public holiday, a site shutdown. Pass `restore: true` to bring a skipped date back. If a job was already created for that date, the reply names it; delete it with delete_job if it should go too.',
  permission: { module: 'Jobs', key: 'edit' },
  inputSchema: objectSchema(
    {
      template: str('The recurring job: its T- number, title, customer or id.'),
      date: dateish('The occurrence date to skip.'),
      restore: bool('Un-skip the date instead. Defaults to false.'),
    },
    ['template', 'date']
  ),
  summarize: (input, result) => `${result.restored ? 'Restored' : 'Skipped'} ${result.date} on ${result.template.number}.`,
  artifacts: (result) => [{ label: `Open ${result.template.number}`, path: `/jobs/${result.template.id}` }],
  async run(input) {
    const template = resolveTemplate(input.template);
    const date = parseDate(input.date);
    const { canonicalSkippedDates, hasOccurrenceForDate, collectTemplateChildren, childFillsOccurrence } = await import('../utils/maintenanceEngine.js');
    const current = canonicalSkippedDates(template.recurringConfig);
    const skippedDates = input.restore ? current.filter((d) => d !== date) : [...new Set([...current, date])].sort();

    await store.update('jobs', template.id, { recurringConfig: { ...template.recurringConfig, skippedDates } });
    await logActivity({
      type: 'job_updated',
      text: `${input.restore ? 'Restored' : 'Skipped'} the ${date} occurrence of ${template.number}.`,
      recordType: 'job',
      recordId: template.id,
    });

    const jobs = store.getAll('jobs') || [];
    const existing = hasOccurrenceForDate(template, date, jobs)
      ? collectTemplateChildren(template, jobs).filter((child) => childFillsOccurrence(child, date, template)).map((child) => ({ id: child.id, number: child.number, status: child.status }))
      : [];
    if (input.restore) await runEngine(template);

    return { template: store.getById('jobs', template.id), date, restored: !!input.restore, existingJobs: existing };
  },
});

defineAction({
  name: 'list_recurring_jobs',
  title: 'List recurring jobs',
  description: 'List the recurring job templates, with each one\'s schedule, technician and next few dates. Filter by customer.',
  permission: { module: 'Jobs', key: 'view' },
  readOnly: true,
  inputSchema: objectSchema({
    customer: str('Only this customer\'s recurring jobs.'),
  }),
  summarize: (input, result) => `${result.templates.length} recurring job(s).`,
  async run(input) {
    let customerId = null;
    if (input.customer) {
      const { customer } = resolveCustomer(input.customer, { create: false });
      if (!customer) throw invalidInput(`No customer matches "${input.customer}".`);
      customerId = customer.id;
    }
    const technicians = store.getAll('technicians') || [];
    const templates = (store.getAll('jobs') || []).filter((job) => isTemplate(job) && (!customerId || job.customerId === customerId));
    const rows = [];
    for (const job of templates) {
      const config = job.recurringConfig || null;
      rows.push({
        id: job.id,
        number: job.number,
        title: job.title,
        customerName: job.customerName,
        siteAddress: job.siteAddress,
        schedule: describeRecurrence(config),
        technician: technicians.find((t) => t.id === config?.defaultTechnicianId)?.name || null,
        skippedDates: config?.skippedDates || [],
        nextDates: config ? await upcomingDates(config, 3) : [],
      });
    }
    return { templates: rows };
  },
});

defineAction({
  name: 'delete_recurring_job',
  title: 'Delete recurring job',
  description:
    'Permanently delete a recurring job template, so it stops creating new jobs. This cannot be undone. Jobs it has already created (and any work already booked) are kept unless `deleteFutureJobs` is set, which also removes the occurrences that have not started yet.',
  permission: { module: 'Jobs', key: 'delete' },
  risky: true,
  inputSchema: objectSchema(
    {
      template: str('The recurring job: its T- number, title, customer or id.'),
      deleteFutureJobs: bool('Also delete its unstarted future jobs. Defaults to false, matching the recurring templates page.'),
      reason: str('Why the series is being deleted.'),
    },
    ['template']
  ),
  summarize: (input, result) => result.summary,
  async run(input) {
    const template = resolveTemplate(input.template);
    const snapshot = {
      id: template.id,
      number: template.number,
      title: template.title,
      customerName: template.customerName,
      schedule: describeRecurrence(template.recurringConfig),
    };

    const { collectTemplateChildren, occurrenceDateKey } = await import('../utils/maintenanceEngine.js');
    const jobs = store.getAll('jobs') || [];
    const children = collectTemplateChildren(template, jobs);
    const today = todayLocalISO();
    const future = children.filter((child) => {
      if (child.status === 'Completed' || child.status === 'Invoiced') return false;
      const date = occurrenceDateKey(child);
      return !!date && date >= today;
    });

    const removed = [];
    if (input.deleteFutureJobs) {
      for (const child of future) {
        removed.push({ id: child.id, number: child.number, status: child.status, date: occurrenceDateKey(child) });
        await store.delete('jobs', child.id);
      }
    }

    await store.delete('jobs', template.id);
    await logActivity({
      type: 'job_deleted',
      text: `Recurring job ${template.number} deleted${input.reason ? ` — ${input.reason}` : ''}${removed.length ? `, with ${removed.length} unstarted occurrence${removed.length === 1 ? '' : 's'}` : ''}.`,
      recordType: 'job',
      recordId: template.id,
    });

    const kept = children.length - removed.length;
    return {
      summary: `Deleted recurring job ${template.number}${template.title ? ` ${template.title}` : ''}${kept ? `; ${kept} existing job${kept === 1 ? '' : 's'} kept` : ''}${removed.length ? `, ${removed.length} unstarted future job${removed.length === 1 ? '' : 's'} removed` : ''}.`,
      template: snapshot,
      removedJobs: removed,
      keptJobs: kept,
      reason: input.reason || null,
    };
  },
});
