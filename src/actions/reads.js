/**
 * Read tools.
 *
 * These exist so the context sent to the model can shrink to a short "today"
 * briefing: instead of dumping the database into the prompt, brny looks things up.
 * Every one of them is `readOnly`, so no approval card and no audit trail.
 */

import { store } from '../data/store.js';
import { defineAction } from './registry.js';
import { resolveOne, scoreRecord } from './resolve.js';
import { objectSchema, str, num, enumOf, bool, dateish } from './schema.js';
import { toDateKey, todayLocalISO, parseDate, dateLabel } from './dates.js';
import { LEAD_STAGES, LEAD_STAGE_ORDER, weightedLeadValue, isOpenLead, isLeadStale } from '../pages/leads/leadStages.js';
import { invalidInput } from './errors.js';

/** Per-collection search fields, compact output shape and label. */
const RECORD_TYPES = {
  leads: {
    collection: 'leads',
    label: (r) => `${r.number || ''} ${r.title || ''}`.trim() || r.customerName || r.id,
    search: ['number', 'title', 'customerName', 'contactName', 'company'],
    fields: ['id', 'number', 'title', 'customerName', 'contactName', 'status', 'value', 'priority', 'assignedTo', 'nextActionDate', 'origin'],
  },
  quotes: {
    collection: 'quotes',
    label: (r) => `${r.number || ''} ${r.title || ''}`.trim() || r.customerName || r.id,
    search: ['number', 'title', 'customerName', 'contactName'],
    fields: ['id', 'number', 'title', 'customerName', 'status', 'total', 'validUntil', 'createdAt'],
  },
  jobs: {
    collection: 'jobs',
    label: (r) => `${r.number || ''} ${r.title || ''}`.trim() || r.customerName || r.id,
    search: ['number', 'title', 'customerName', 'siteAddress', 'technicianName'],
    fields: ['id', 'number', 'title', 'customerName', 'siteAddress', 'status', 'priority', 'technicianId', 'technicianName', 'scheduledDate', 'quoteId', 'type'],
  },
  invoices: {
    collection: 'invoices',
    label: (r) => `${r.number || ''} ${r.title || ''}`.trim() || r.customerName || r.id,
    search: ['number', 'title', 'customerName', 'jobNumber', 'contactName'],
    fields: ['id', 'number', 'title', 'customerName', 'jobId', 'jobNumber', 'status', 'total', 'subtotal', 'issueDate', 'dueDate', 'paidDate', 'paymentMethod'],
  },
  customers: {
    collection: 'customers',
    label: (r) => r.company || [r.firstName, r.lastName].filter(Boolean).join(' ') || r.id,
    search: ['company', 'firstName', 'lastName', 'email', 'phone', 'address'],
    fields: ['id', 'company', 'firstName', 'lastName', 'email', 'phone', 'address', 'status', 'type'],
  },
  technicians: {
    collection: 'technicians',
    label: (r) => r.name || r.email || r.id,
    search: ['name', 'email', 'phone', 'role'],
    fields: ['id', 'name', 'email', 'phone', 'role', 'status', 'userTypeId'],
  },
  stock: {
    collection: 'stock',
    label: (r) => r.name || r.sku || r.id,
    search: ['name', 'sku', 'category', 'supplier'],
    fields: ['id', 'name', 'sku', 'category', 'unit', 'quantity', 'reorderLevel', 'costPrice', 'unitPrice', 'supplier', 'locations'],
  },
  purchaseOrders: {
    collection: 'purchaseOrders',
    label: (r) => `${r.number || ''} ${r.supplierName || ''}`.trim() || r.id,
    search: ['number', 'supplierName', 'jobNumber'],
    fields: ['id', 'number', 'supplierName', 'jobId', 'jobNumber', 'status', 'total', 'issueDate', 'expectedDate'],
  },
  projects: {
    collection: 'projects',
    label: (r) => `${r.number || ''} ${r.name || ''}`.trim() || r.customerName || r.id,
    search: ['number', 'name', 'customerName', 'siteAddress'],
    fields: ['id', 'number', 'name', 'customerName', 'siteAddress', 'status', 'startDate', 'endDate'],
  },
  timesheets: {
    collection: 'timesheets',
    label: (r) => `${r.technicianName || ''} ${dateLabel(r.date) || r.date || ''}`.trim() || r.id,
    search: ['technicianName', 'jobId', 'date', 'status'],
    fields: ['id', 'technicianId', 'technicianName', 'date', 'durationHours', 'hours', 'jobId', 'status', 'notes'],
  },
  contractors: {
    collection: 'contractors',
    label: (r) => r.name || r.company || r.id,
    search: ['name', 'company', 'email', 'phone', 'trade'],
    fields: ['id', 'name', 'company', 'email', 'phone', 'trade', 'status'],
  },
  suppliers: {
    collection: 'suppliers',
    label: (r) => r.name || r.company || r.id,
    search: ['name', 'company', 'email', 'phone'],
    fields: ['id', 'name', 'company', 'email', 'phone', 'address'],
  },
  assets: {
    collection: 'assets',
    label: (r) => r.name || r.assetNumber || r.serialNumber || r.id,
    search: ['name', 'assetNumber', 'serialNumber', 'location', 'customerName'],
    fields: ['id', 'name', 'assetNumber', 'serialNumber', 'customerId', 'customerName', 'location', 'status', 'nextServiceDate'],
  },
  todos: {
    collection: 'todos',
    label: (r) => r.title || r.id,
    search: ['title', 'recordId'],
    fields: ['id', 'title', 'assignedTo', 'dueAt', 'status', 'recordType', 'recordId', 'createdBy', 'completedAt'],
  },
};

const TYPE_NAMES = Object.keys(RECORD_TYPES);

export { RECORD_TYPES };

function collectionFor(type) {
  const spec = RECORD_TYPES[type];
  if (!spec) throw invalidInput(`Unknown record type "${type}". Valid types: ${TYPE_NAMES.join(', ')}.`, { allowed: TYPE_NAMES });
  return spec;
}

/** Only the fields worth sending back to the model, with empties dropped. */
function compact(type, record) {
  const spec = collectionFor(type);
  const out = {};
  for (const field of spec.fields) {
    if (field === 'id') continue;
    const value = record[field];
    if (value === undefined || value === null || value === '') continue;
    out[field] = value;
  }
  return { id: record.id, ...out };
}

function matchesFilters(record, filters) {
  if (!filters || typeof filters !== 'object') return true;
  return Object.entries(filters).every(([field, wanted]) => {
    if (wanted === undefined || wanted === null || wanted === '') return true;
    const actual = record[field];
    if (Array.isArray(wanted)) return wanted.some((w) => matchesFilters(record, { [field]: w }));
    if (typeof wanted === 'string' && typeof actual === 'string') {
      return actual.toLowerCase().includes(wanted.toLowerCase());
    }
    return actual === wanted;
  });
}

function filterList(type, filters) {
  return (store.getAll(collectionFor(type).collection) || []).filter((record) => matchesFilters(record, filters));
}

defineAction({
  name: 'search_records',
  title: 'Search records',
  description:
    'Find records by free text. Use this before any action that needs a record id, and to answer questions about what exists. Returns up to 25 matches with the fields that matter. Query can be a name, number, address or partial title.',
  readOnly: true,
  inputSchema: objectSchema(
    {
      type: enumOf(TYPE_NAMES, 'Which kind of record to search.'),
      query: str('Free text: customer name, job title, document number, address.'),
      filters: { type: 'object', additionalProperties: true, description: 'Exact-ish field filters, e.g. {"status":"Open"}.' },
      limit: num('Maximum matches to return (default 10, max 25).'),
    },
    ['type', 'query']
  ),
  run: async ({ type, query, filters, limit }) => {
    const spec = collectionFor(type);
    const max = Math.min(Math.max(Number(limit) || 10, 1), 25);

    const scored = filterList(type, filters)
      .map((record) => ({ record, score: scoreRecord(record, query, spec.search) }))
      .filter((hit) => hit.score >= 0.4)
      .sort((a, b) => b.score - a.score)
      .slice(0, max);

    return {
      summary: scored.length ? `Found ${scored.length} ${type} match${scored.length === 1 ? '' : 'es'} for "${query}".` : `No ${type} matched "${query}".`,
      type,
      count: scored.length,
      matches: scored.map((hit) => compact(type, hit.record)),
      hint: scored.length === 0 ? `Try a shorter or differently spelled query, or list all ${type}.` : undefined,
    };
  },
});

defineAction({
  name: 'get_record',
  title: 'Open a record',
  description:
    'Fetch one complete record including line items, tasks and history. Use after search_records when you need the detail, or when you already know the record id.',
  readOnly: true,
  inputSchema: objectSchema(
    {
      type: enumOf(TYPE_NAMES, 'Which kind of record.'),
      query: str('The record id, document number, or a distinctive name.'),
    },
    ['type', 'query']
  ),
  run: async ({ type, query }) => {
    const spec = collectionFor(type);
    const { record } = resolveOne(spec.collection, query, {
      label: spec.label,
      searchFields: spec.search,
      what: type.replace(/s$/, ''),
    });
    return { summary: `Opened ${type.replace(/s$/, '')} ${spec.label(record)}.`, type, record };
  },
});

defineAction({
  name: 'list_records',
  title: 'List records',
  description:
    'List records filtered by field, ordered most recent first. Use for questions like "which jobs are in progress", "show me unsent quotes" or "what stock is low".',
  readOnly: true,
  inputSchema: objectSchema(
    {
      type: enumOf(TYPE_NAMES, 'Which kind of record.'),
      filters: { type: 'object', additionalProperties: true, description: 'Field filters, e.g. {"status":"In Progress"}.' },
      orderBy: str('Field to sort by (default updatedAt, then createdAt).'),
      limit: num('Maximum rows (default 20, max 50).'),
    },
    ['type']
  ),
  run: async ({ type, filters, orderBy, limit }) => {
    const spec = collectionFor(type);
    const max = Math.min(Math.max(Number(limit) || 20, 1), 50);
    const order = orderBy || 'updatedAt';
    const rows = filterList(type, filters)
      .sort((a, b) => String(b[order] || b.createdAt || '').localeCompare(String(a[order] || a.createdAt || '')))
      .slice(0, max);
    return {
      summary: `${rows.length} ${type} listed.`,
      type,
      count: rows.length,
      records: rows.map((record) => compact(type, record)),
    };
  },
});

defineAction({
  name: 'get_schedule',
  title: 'Read the schedule',
  description:
    "Show what is booked between two dates — jobs with their technician, time and site. Use for 'what's on tomorrow', 'what is Pat doing this week', 'is anything double booked'.",
  readOnly: true,
  inputSchema: objectSchema(
    {
      from: dateish('Start date. Defaults to today.'),
      to: dateish('End date. Defaults to the same day as `from`.'),
      technician: str('Optional technician name or id to filter by.'),
      includeUnscheduled: bool('Also list open jobs with no scheduled date.'),
    },
    []
  ),
  run: async ({ from, to, technician, includeUnscheduled }) => {
    const startKey = parseDate(from || todayLocalISO());
    const endKey = parseDate(to || startKey);
    const techFilter = technician ? String(technician).toLowerCase() : null;

    const techs = store.getAll('technicians') || [];
    const techName = (id, fallback) => techs.find((t) => t.id === id)?.name || fallback || null;

    const entries = [];
    for (const job of store.getAll('jobs') || []) {
      const key = toDateKey(job.scheduledDate);
      if (!key || key < startKey || key > endKey) continue;
      const name = techName(job.technicianId, job.technicianName);
      if (techFilter && !`${name || ''} ${job.technicianId || ''}`.toLowerCase().includes(techFilter)) continue;
      entries.push({
        id: job.id,
        kind: 'job',
        number: job.number,
        title: job.title,
        customerName: job.customerName,
        siteAddress: job.siteAddress,
        status: job.status,
        technicianId: job.technicianId || null,
        technicianName: name,
        scheduledDate: key,
        estimatedHours: job.estimatedHours ?? null,
      });
    }

    // Explicit calendar rows carry the hour-level detail when present.
    for (const slot of store.getAll('schedule') || []) {
      const key = toDateKey(slot.date);
      if (!key || key < startKey || key > endKey) continue;
      if (techFilter && !`${slot.technicianName || ''} ${slot.technicianId || ''}`.toLowerCase().includes(techFilter)) continue;
      if (entries.some((entry) => entry.id === slot.jobId && entry.scheduledDate === key)) continue;
      entries.push({
        id: slot.id,
        kind: 'slot',
        jobId: slot.jobId || null,
        number: slot.jobNumber || null,
        title: slot.title,
        customerName: slot.customerName,
        siteAddress: slot.siteAddress,
        status: slot.status,
        technicianId: slot.technicianId || null,
        technicianName: slot.technicianName || null,
        scheduledDate: key,
        hours: slot.hours ?? null,
        startTime: slot.startTime || null,
        finishTime: slot.finishTime || null,
      });
    }

    entries.sort((a, b) => a.scheduledDate.localeCompare(b.scheduledDate) || String(a.startTime || '').localeCompare(String(b.startTime || '')));

    let unscheduled = [];
    if (includeUnscheduled) {
      unscheduled = (store.getAll('jobs') || [])
        .filter((job) => !toDateKey(job.scheduledDate) && !['Completed', 'Cancelled'].includes(job.status))
        .slice(0, 25)
        .map((job) => compact('jobs', job));
    }

    return {
      summary: entries.length
        ? `${entries.length} booking${entries.length === 1 ? '' : 's'} between ${dateLabel(startKey)} and ${dateLabel(endKey)}.`
        : `Nothing booked between ${dateLabel(startKey)} and ${dateLabel(endKey)}.`,
      from: startKey,
      to: endKey,
      count: entries.length,
      entries,
      unscheduled,
    };
  },
});

/** Sum a numeric field across records. */
function sum(rows, field) {
  return rows.reduce((total, row) => total + (Number(row[field]) || 0), 0);
}

function inRange(record, field, fromKey, toKey) {
  const key = toDateKey(record[field]);
  return !!key && key >= fromKey && key <= toKey;
}

defineAction({
  name: 'get_metrics',
  title: 'Read the numbers',
  description:
    'Business numbers for a date range: money invoiced and paid, what is outstanding, pipeline value, job and lead counts, hours worked, and low stock. Use this instead of adding up records yourself.',
  readOnly: true,
  inputSchema: objectSchema(
    {
      metric: enumOf(
        ['overview', 'revenue', 'outstanding', 'pipeline', 'jobs', 'leads', 'hours', 'low_stock'],
        'Which summary to compute. Use "overview" when unsure.'
      ),
      from: dateish('Start date. Defaults to the first day of this month.'),
      to: dateish('End date. Defaults to today.'),
      technician: str('Optional technician name to restrict hours to.'),
    },
    ['metric']
  ),
  run: async ({ metric, from, to, technician }) => {
    const now = new Date();
    const monthStart = todayLocalISO(new Date(now.getFullYear(), now.getMonth(), 1));
    const fromKey = parseDate(from || monthStart);
    const toKey = parseDate(to || todayLocalISO());
    const invoices = store.getAll('invoices') || [];
    const jobs = store.getAll('jobs') || [];
    const leads = store.getAll('leads') || [];
    const period = `${dateLabel(fromKey)} – ${dateLabel(toKey)}`;

    const revenue = () => {
      const issued = invoices.filter((invoice) => inRange(invoice, 'issueDate', fromKey, toKey));
      const paid = invoices.filter((invoice) => inRange(invoice, 'paidDate', fromKey, toKey));
      return {
        summary: `Invoiced $${sum(issued, 'total').toFixed(2)} across ${issued.length} invoices for ${period}; $${sum(paid, 'total').toFixed(2)} collected.`,
        period: { from: fromKey, to: toKey },
        invoicedTotal: sum(issued, 'total'),
        invoicedCount: issued.length,
        collectedTotal: sum(paid, 'total'),
        collectedCount: paid.length,
      };
    };

    const outstanding = () => {
      const unpaid = invoices.filter((invoice) => ['Sent', 'Overdue', 'Issued'].includes(invoice.status));
      const overdue = unpaid.filter((invoice) => {
        const due = toDateKey(invoice.dueDate);
        return due && due < todayLocalISO();
      });
      return {
        summary: `$${sum(unpaid, 'total').toFixed(2)} outstanding on ${unpaid.length} invoices, $${sum(overdue, 'total').toFixed(2)} of it overdue.`,
        outstandingTotal: sum(unpaid, 'total'),
        outstandingCount: unpaid.length,
        overdueTotal: sum(overdue, 'total'),
        overdueCount: overdue.length,
        overdueInvoices: overdue.slice(0, 20).map((invoice) => compact('invoices', invoice)),
      };
    };

    const pipeline = () => {
      const open = leads.filter(isOpenLead);
      const byStage = {};
      for (const stage of LEAD_STAGE_ORDER) byStage[stage] = { count: 0, value: 0, weighted: 0 };
      for (const lead of leads) {
        const stage = lead.status || 'New';
        const bucket = byStage[stage] || (byStage[stage] = { count: 0, value: 0, weighted: 0 });
        bucket.count += 1;
        bucket.value += Number(lead.value) || 0;
        bucket.weighted += weightedLeadValue(lead);
      }
      return {
        summary: `${open.length} open leads worth $${sum(open, 'value').toFixed(2)} (weighted $${open.reduce((t, lead) => t + weightedLeadValue(lead), 0).toFixed(2)}).`,
        openCount: open.length,
        openValue: sum(open, 'value'),
        weightedValue: open.reduce((total, lead) => total + weightedLeadValue(lead), 0),
        byStage,
        stages: LEAD_STAGES,
      };
    };

    const jobsMetric = () => {
      const counts = {};
      for (const job of jobs) counts[job.status || 'Unknown'] = (counts[job.status || 'Unknown'] || 0) + 1;
      const scheduled = jobs.filter((job) => inRange(job, 'scheduledDate', fromKey, toKey));
      return {
        summary: `${jobs.length} jobs in total, ${scheduled.length} booked for ${period}. ${Object.entries(counts).map(([k, v]) => `${k}: ${v}`).join(', ')}.`,
        total: jobs.length,
        byStatus: counts,
        scheduledInPeriod: scheduled.length,
      };
    };

    const leadsMetric = () => {
      const created = leads.filter((lead) => inRange(lead, 'createdAt', fromKey, toKey));
      const won = leads.filter((lead) => lead.status === 'Won' && inRange(lead, 'updatedAt', fromKey, toKey));
      const lost = leads.filter((lead) => lead.status === 'Lost' && inRange(lead, 'updatedAt', fromKey, toKey));
      return {
        summary: `${created.length} leads created for ${period}; ${won.length} won, ${lost.length} lost.`,
        created: created.length,
        won: won.length,
        lost: lost.length,
        wonValue: sum(won, 'value'),
      };
    };

    const hours = () => {
      const techs = store.getAll('technicians') || [];
      const filter = technician ? String(technician).toLowerCase() : null;
      const rows = (store.getAll('timesheets') || []).filter((sheet) => {
        if (!inRange(sheet, 'date', fromKey, toKey)) return false;
        if (!filter) return true;
        return `${sheet.technicianName || ''} ${sheet.technicianId || ''}`.toLowerCase().includes(filter);
      });
      const hoursOf = (sheet) => Number(sheet.hours ?? sheet.durationHours ?? sheet.duration_hours ?? 0) || 0;
      const byTechnician = {};
      for (const sheet of rows) {
        const name = techs.find((t) => t.id === sheet.technicianId)?.name || sheet.technicianName || 'Unassigned';
        byTechnician[name] = (byTechnician[name] || 0) + hoursOf(sheet);
      }
      const totalHours = rows.reduce((total, sheet) => total + hoursOf(sheet), 0);
      return {
        summary: `${totalHours.toFixed(1)} hours logged for ${period}.`,
        totalHours,
        entries: rows.length,
        byTechnician,
      };
    };

    const lowStock = () => {
      const rows = (store.getAll('stock') || []).filter((item) => Number(item.quantity) <= Number(item.reorderLevel ?? 0));
      return {
        summary: `${rows.length} stock item${rows.length === 1 ? '' : 's'} at or below reorder level.`,
        count: rows.length,
        items: rows.slice(0, 25).map((item) => compact('stock', item)),
      };
    };

    const calculators = { revenue, outstanding, pipeline, jobs: jobsMetric, leads: leadsMetric, hours, low_stock: lowStock };
    if (metric === 'overview') {
      const parts = { revenue: revenue(), outstanding: outstanding(), pipeline: pipeline(), jobs: jobsMetric() };
      return { summary: parts.revenue.summary, period: { from: fromKey, to: toKey }, ...parts };
    }
    return calculators[metric]();
  },
});

defineAction({
  name: 'get_today',
  title: "Read today's briefing",
  description:
    "A short briefing for today: jobs booked, overdue invoices, overdue to-dos and any leads going cold. Call this first when the request is open-ended like 'what should I do today'.",
  readOnly: true,
  inputSchema: objectSchema({}, []),
  run: async () => {
    const today = todayLocalISO();
    const jobs = (store.getAll('jobs') || []).filter((job) => toDateKey(job.scheduledDate) === today);
    const techs = store.getAll('technicians') || [];
    const overdueInvoices = (store.getAll('invoices') || []).filter((invoice) => {
      const due = toDateKey(invoice.dueDate);
      return due && due < today && ['Sent', 'Overdue', 'Issued'].includes(invoice.status);
    });
    const openTodos = (store.getAll('todos') || []).filter((todo) => todo.status !== 'done');
    const overdueTodos = openTodos.filter((todo) => {
      const due = toDateKey(todo.dueAt);
      return due && due < today;
    });
    const staleLeads = (store.getAll('leads') || []).filter((lead) => isOpenLead(lead) && isLeadStale(lead));

    return {
      summary: `${jobs.length} job${jobs.length === 1 ? '' : 's'} booked today, ${overdueInvoices.length} overdue invoice${overdueInvoices.length === 1 ? '' : 's'}, ${overdueTodos.length} overdue to-do${overdueTodos.length === 1 ? '' : 's'}.`,
      date: today,
      jobsToday: jobs.slice(0, 25).map((job) => ({
        ...compact('jobs', job),
        technicianName: techs.find((t) => t.id === job.technicianId)?.name || job.technicianName || null,
      })),
      overdueInvoices: overdueInvoices.slice(0, 15).map((invoice) => compact('invoices', invoice)),
      openTodos: openTodos.slice(0, 25).map((todo) => compact('todos', todo)),
      overdueTodos: overdueTodos.map((todo) => compact('todos', todo)),
      staleLeads: staleLeads.map((lead) => compact('leads', lead)),
    };
  },
});
