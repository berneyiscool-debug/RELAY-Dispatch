/**
 * Reports — the same figures and CSV the Reports page builds.
 *
 * `buildReport` runs the dashboard's own formulas over the filters, and
 * `reportSpec` turns the result into the named blocks the page renders, so a
 * number brny reports and a number on screen cannot disagree.
 */

import { store } from '../data/store.js';
import { defineAction } from './registry.js';
import { objectSchema, str, enumOf, dateish } from './schema.js';
import { invalidInput, notFound } from './errors.js';
import { buildReport, emptyFilters, toCsv } from '../utils/reportMetrics.js';
import { REPORTS, reportSpec, isoDay, ASSET_CSV_HEADERS, assetCsvRows } from '../pages/reports/reportSpec.js';
import { toDate } from '../utils/kpis.js';
import { findTechnician } from './leads.js';
import { resolveCustomer } from './customers.js';

const COLLECTIONS = [
  'jobs', 'quotes', 'invoices', 'customers', 'stock', 'technicians', 'leads', 'timesheets',
  'assets', 'maintenancePlans', 'schedule', 'jobMaterials', 'purchaseOrders',
];

const REPORT_IDS = REPORTS.map((report) => report.id);

function reportData() {
  return Object.fromEntries(COLLECTIONS.map((collection) => [collection, store.getAll(collection) || []]));
}

function build(id, input) {
  const filters = emptyFilters();
  if (input.from) filters.start = input.from;
  if (input.to) filters.end = input.to;
  if (input.technician) {
    const person = findTechnician(input.technician);
    if (!person) throw notFound('technician', input.technician);
    filters.technicianId = person.id;
  }
  if (input.customer) {
    const { customer } = resolveCustomer(input.customer, { create: false });
    if (!customer) throw notFound('customer', input.customer);
    filters.customerId = customer.id;
  }
  if (input.assetType) filters.assetType = input.assetType;
  const report = buildReport(reportData(), filters);
  return { filters, report };
}

function csvFor(id, r) {
  const d = r.scoped;
  switch (id) {
    case 'overview':
    case 'revenue':
      return toCsv(['Invoice #', 'Customer', 'Status', 'Subtotal (ex GST)', 'Total', 'Issue date', 'Due date'],
        r.money.issued.map((invoice) => [invoice.number, invoice.customerName, invoice.status, Number(invoice.subtotal) || 0, Number(invoice.total) || 0, invoice.issueDate || '', invoice.dueDate || '']));
    case 'jobs':
      return toCsv(['Job #', 'Title', 'Customer', 'Technician', 'Status', 'Completed', 'Hours logged'],
        r.jobs.completed.map((job) => {
          const done = toDate(r.jobs.completedAt(job));
          return [job.number, job.title, job.customerName, job.technicianName || '', job.status, done ? isoDay(done) : '', r.jobs.hoursByJob.get(String(job.id)) || 0];
        }));
    case 'job_costing':
      return toCsv(['Job #', 'Customer', 'Hours', 'Revenue (ex GST)', 'Labour', 'Materials', 'Purchases', 'Cost', 'Profit', 'Margin %'],
        r.profit.jobs.map((job) => [job.job?.number || job.jobId, job.job?.customerName || '', job.hours, job.revenue,
          job.known ? job.labour : '', job.known ? job.materials : '', job.known ? job.purchases : '', job.known ? job.cost : '',
          job.known ? job.profit : '', job.margin != null ? job.margin * 100 : 'Not costed']));
    case 'technicians':
      return toCsv(['Name', 'Role', 'Jobs completed', 'Hours logged', 'Invoiced (shared)'],
        r.team.map((person) => [person.name, person.role, person.jobsCompleted, person.hours, person.invoiced]));
    case 'timesheets_labor':
      return toCsv(['Technician', 'Role', 'Hours logged', 'Hours on jobs', 'Share on jobs %', 'Labour cost', 'Hours with no pay rate'],
        r.team.map((person) => [person.name, person.role, person.hours, person.billableHours, person.billableShare != null ? person.billableShare * 100 : '', person.labourCost, person.unratedHours]));
    case 'assets_maintenance':
      return toCsv(ASSET_CSV_HEADERS, assetCsvRows(r));
    case 'customers':
      return toCsv(['Company', 'First name', 'Last name', 'Email', 'Phone', 'Status', 'Invoiced in range (ex GST)'],
        d.customers.map((customer) => [customer.company, customer.firstName, customer.lastName, customer.email, customer.phone, customer.status, r.customers.revenueById.get(String(customer.id)) || 0]));
    case 'inventory':
      return toCsv(['Name', 'SKU', 'Category', 'Quantity', 'Cost price', 'Sell price', 'Location', 'Supplier'],
        d.stock.map((item) => [item.name, item.sku, item.category, Number(item.quantity) || 0, Number(item.costPrice) || 0, Number(item.unitPrice) || 0, item.location, item.supplier]));
    default:
      return '';
  }
}

defineAction({
  name: 'run_report',
  title: 'Run a report',
  description:
    'Run one of the business reports — overview, revenue, jobs, job costing, technicians, timesheets and labour, assets, customers or inventory — for a date range and optional filters. Returns the same figures and tables the Reports page shows.',
  permission: { module: 'Reports', key: 'view' },
  readOnly: true,
  inputSchema: objectSchema({
    report: enumOf(REPORT_IDS, 'Which report.'),
    from: dateish('First day. Defaults to all time.'),
    to: dateish('Last day. Defaults to today.'),
    technician: str('Only this technician\'s figures.'),
    customer: str('Only this customer\'s figures.'),
    assetType: str('Only assets of this type.'),
  }, ['report']),
  summarize: (input, result) => result.summary,
  run: async (input) => {
    const { report } = build(input.report, input);
    const spec = reportSpec(input.report, report, { insights: { items: [], source: 'local' }, companyName: store.getSettings().name || '' });
    const from = report.range.start.toISOString().slice(0, 10);
    const to = new Date(report.range.end - 86400000).toISOString().slice(0, 10);
    return {
      summary: `${spec.title || input.report} report, ${from} to ${to}.`,
      report: input.report,
      range: { from, to },
      blocks: spec.blocks || [],
    };
  },
});

defineAction({
  name: 'export_report_csv',
  title: 'Export a report as CSV',
  description: 'Return a report as CSV text that can be saved or pasted into a spreadsheet. Same filters and columns as the Reports page export.',
  permission: { module: 'Reports', key: 'export' },
  readOnly: true,
  inputSchema: objectSchema({
    report: enumOf(REPORT_IDS, 'Which report.'),
    from: dateish('First day. Defaults to all time.'),
    to: dateish('Last day. Defaults to today.'),
    technician: str('Only this technician\'s figures.'),
    customer: str('Only this customer\'s figures.'),
  }, ['report']),
  summarize: (input, result) => result.summary,
  run: async (input) => {
    const { report } = build(input.report, input);
    const csv = csvFor(input.report, report);
    if (!csv) throw invalidInput(`There is no CSV export for "${input.report}".`);
    const from = report.range.start.toISOString().slice(0, 10);
    const to = new Date(report.range.end - 86400000).toISOString().slice(0, 10);
    return {
      summary: `${input.report} report CSV ready (${from} to ${to}, ${csv.split('\r\n').filter(Boolean).length - 1} row(s)).`,
      report: input.report,
      range: { from, to },
      filename: `relay_${input.report}_report.csv`,
      csv,
    };
  },
});
