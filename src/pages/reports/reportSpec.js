// ============================================
// RELAY DISPATCH — REPORT CONTENT
// ============================================
// Each report's content as plain data, in named blocks (a row of figures, a
// chart, a table, the insights), built from a buildReport() result. The PDF
// export draws these blocks, and the export dialog lists them so the user can
// pick exactly what goes in. No DOM, no store: everything comes in as arguments.

export const REPORTS = [
  { id: 'overview', label: 'Business Overview' },
  { id: 'revenue', label: 'Revenue & Profit' },
  { id: 'jobs', label: 'Job Performance' },
  { id: 'job_costing', label: 'Job Costing' },
  { id: 'technicians', label: 'Technician Productivity' },
  { id: 'timesheets_labor', label: 'Timesheet & Labor' },
  { id: 'assets_maintenance', label: 'Asset Maintenance' },
  { id: 'customers', label: 'Customer Analysis' },
  { id: 'inventory', label: 'Inventory Report' },
];

// ── Formatting ───────────────────────────────────────────────────────────────

export const money = (n) => `$${(Number(n) || 0).toLocaleString('en-AU', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
export const wholeMoney = (n) => {
  const v = Math.round(Number(n) || 0);
  return `${v < 0 ? '-' : ''}$${Math.abs(v).toLocaleString('en-AU')}`;
};
export const pct = (v, digits = 1) => (v == null ? '—' : `${(v * 100).toFixed(digits)}%`);
export const hrs = (n, digits = 1) => `${(Number(n) || 0).toFixed(digits)} hrs`;

const isoDay = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
const dayLabel = (v) => {
  const d = v instanceof Date ? v : (v ? new Date(v) : null);
  return d && !isNaN(d) ? d.toLocaleDateString('en-AU', { day: 'numeric', month: 'short', year: 'numeric' }) : '';
};

// ── Shared record helpers ────────────────────────────────────────────────────

export function assetServiceCost(asset) {
  return ((asset && asset.logs) || []).filter(l => l.type === 'Service').reduce((s, l) => s + (Number(l.cost) || 0), 0);
}
export const lowStock = (stock) => stock.filter(i => (Number(i.quantity) || 0) <= (Number(i.reorderLevel) || 0));
export const stockValue = (stock) => stock.reduce((s, i) => s + (Number(i.quantity) || 0) * (Number(i.costPrice) || 0), 0);
export const costedSub = (p) => (p.jobsTotal > p.jobsKnown ? `${p.jobsKnown} of ${p.jobsTotal} invoiced jobs costed` : '');
export const NOT_COSTED = { 'no-pay-rate': 'Time logged with no pay rate', 'no-costs': 'No time or materials logged' };

const byValue = (obj) => Object.entries(obj).sort((a, b) => b[1] - a[1]);
const jobNo = (job, id) => (job && job.number) || String(id);

// ── Insights (on-device) ─────────────────────────────────────────────────────

// On-device insights. They state what the figures show; they don't measure the
// business against targets nobody set.
export function localInsights(reportId, r, companyName = 'your company') {
  const d = r.scoped;
  if (d.jobs.length < 5) {
    const insights = [{
      headline: `Welcome to RELAY, ${companyName}!`,
      detail: 'Your workspace is set up and ready to run dispatch.',
      action: 'Head to Settings to set your labour rates and material markups.',
      confidence: 'high',
    }];
    insights.push(d.technicians.length > 0 ? {
      headline: `${d.technicians.length} people on the team`,
      detail: 'Your field team is added and ready for scheduling.',
      action: 'Assign a job to your team from the Jobs page or the calendar.',
      confidence: 'high',
    } : {
      headline: 'Add your first technician',
      detail: "With nobody on the team you can't assign jobs or track timesheets yet.",
      action: 'Go to Admin -> People to add your field team.',
      confidence: 'high',
    });
    insights.push(d.customers.length > 0 ? {
      headline: `${d.customers.length} customers added`,
      detail: 'Your customer list is starting to grow.',
      action: 'Create a quote or job for one of your customers.',
      confidence: 'high',
    } : {
      headline: 'Add your first customer',
      detail: 'Customers are where quotes and jobs start.',
      action: 'Go to People -> Customers -> Add Customer.',
      confidence: 'high',
    });
    if (d.quotes.length > 0) insights.push({ headline: `${d.quotes.length} quotes prepared`, detail: 'Good progress bidding for new work.', action: 'Follow up on sent quotes to win approval.', confidence: 'high' });
    if (d.jobs.length > 0) insights.push({ headline: `${d.jobs.length} jobs logged`, detail: 'Your first jobs are in the system.', action: "Move active jobs to 'Scheduled' or 'In Progress' as work begins.", confidence: 'high' });
    return insights;
  }

  const insights = [];
  if (reportId === 'overview' || reportId === 'revenue') {
    if (r.money.overdue > 0) {
      insights.push({
        headline: `${wholeMoney(r.money.overdue)} overdue on ${r.money.overdueCount} invoices`,
        detail: `Of ${wholeMoney(r.money.outstanding)} still owed, this part is past its due date.`,
        action: 'Open the overdue invoices and send reminders.',
        confidence: 'high',
      });
    }
    if (r.profit.margin != null) {
      insights.push({
        headline: `${pct(r.profit.margin)} gross margin on ${r.profit.jobsKnown} costed jobs`,
        detail: `${wholeMoney(r.profit.revenue)} invoiced against ${wholeMoney(r.profit.cost)} of labour, materials and purchases.`,
        action: 'Check Job Costing for the jobs pulling the margin down.',
        confidence: r.profit.jobsKnown >= 10 ? 'high' : 'medium',
      });
    }
    if (r.profit.jobsTotal > r.profit.jobsKnown) {
      insights.push({
        headline: `${r.profit.jobsTotal - r.profit.jobsKnown} invoiced jobs couldn't be costed`,
        detail: "They have no logged time or materials, or time logged by someone with no pay rate, so they're left out of profit.",
        action: 'Add pay rates in People and log time against jobs.',
        confidence: 'high',
      });
    }
    if (r.sales.winRate != null) {
      insights.push({
        headline: `${pct(r.sales.winRate, 0)} of ${r.sales.quotesDecided} decided quotes won`,
        detail: 'Won quotes include those already converted to jobs.',
        action: 'Follow up on quotes still awaiting an answer.',
        confidence: r.sales.quotesDecided >= 10 ? 'high' : 'low',
      });
    }
  } else if (reportId === 'jobs' || reportId === 'job_costing') {
    const losing = r.profit.jobs.filter(j => j.known && j.profit < 0);
    if (losing.length) {
      insights.push({
        headline: `${losing.length} costed jobs lost money`,
        detail: `Together they cost ${wholeMoney(-losing.reduce((s, j) => s + j.profit, 0))} more than they invoiced.`,
        action: 'Open the red rows in Job Costing to see whether labour or materials ran over.',
        confidence: 'high',
      });
    }
    const overrun = r.jobs.completed.filter(j => (j.estimatedHours || 0) > 0 && (r.jobs.hoursByJob.get(String(j.id)) || 0) > j.estimatedHours * 1.1);
    if (overrun.length) {
      insights.push({
        headline: `${overrun.length} completed jobs ran over their estimated hours`,
        detail: 'Time logged was more than 10% above the estimate.',
        action: 'Compare these jobs with their quotes before the next similar job.',
        confidence: 'medium',
      });
    }
    if (r.jobs.readyToInvoice > 0) {
      insights.push({
        headline: `${r.jobs.readyToInvoice} completed jobs not invoiced yet`,
        detail: "Finished work that hasn't been billed.",
        action: 'Invoice them from the Jobs list.',
        confidence: 'high',
      });
    }
  } else if (reportId === 'timesheets_labor' || reportId === 'technicians') {
    if (r.labour.hours > 0 && r.labour.billableHours >= r.labour.hours) {
      insights.push({
        headline: `All ${r.labour.hours.toFixed(0)} logged hours were on jobs`,
        detail: 'Every timesheet in this range is logged against a job, so job costs include all of it.',
        action: 'Keep logging time to jobs as it happens.',
        confidence: 'high',
      });
    } else if (r.labour.hours > 0) {
      insights.push({
        headline: `${pct(r.labour.billableShare)} of ${r.labour.hours.toFixed(0)} logged hours were on jobs`,
        detail: `${(r.labour.hours - r.labour.billableHours).toFixed(1)} hours weren't logged against a job.`,
        action: 'Check whether that time was travel, yard or admin, and log it to jobs where it belongs.',
        confidence: 'high',
      });
    }
    if (r.labour.unratedHours > 0) {
      insights.push({
        headline: `${r.labour.unratedHours.toFixed(1)} hours have no pay rate`,
        detail: "These hours aren't in labour cost, so cost and margins read low.",
        action: 'Add pay rates in People.',
        confidence: 'high',
      });
    }
  } else if (reportId === 'customers') {
    const top = r.customers.top[0];
    if (top) {
      insights.push({
        headline: `Largest customer is ${pct(top.share, 0)} of revenue`,
        detail: `${top.name || 'One customer'} invoiced ${wholeMoney(top.revenue)} in this range.`,
        action: 'Keep an eye on how much the business depends on one account.',
        confidence: r.customers.invoiced >= 5 ? 'high' : 'low',
      });
    }
    if (r.customers.invoiced > 0) {
      insights.push({
        headline: `${r.customers.repeat} of ${r.customers.invoiced} invoiced customers are repeat`,
        detail: 'Repeat customers have been invoiced more than once.',
        action: 'Offer maintenance agreements to one-off customers.',
        confidence: 'medium',
      });
    }
  } else if (reportId === 'assets_maintenance') {
    const costs = d.assets.map(a => [a.name, assetServiceCost(a)]).filter(([, c]) => c > 0).sort((a, b) => b[1] - a[1]);
    if (costs.length) {
      insights.push({
        headline: `Highest service cost: ${costs[0][0]} (${wholeMoney(costs[0][1])})`,
        detail: 'This asset has the most service cost logged against it.',
        action: 'Check whether replacing it would cost less than repairing it.',
        confidence: 'medium',
      });
    }
    const active = d.maintenancePlans.filter(p => p.status === 'Active').length;
    if (active) {
      insights.push({ headline: `${active} active service agreements`, detail: 'Each has a next-service date to keep.', action: 'Review the due dates weekly.', confidence: 'high' });
    }
  } else if (reportId === 'inventory') {
    const low = lowStock(d.stock);
    insights.push(low.length ? {
      headline: `${low.length} stock items at or below reorder level`,
      detail: 'Jobs that need these parts could be held up.',
      action: 'Raise purchase orders for the low items.',
      confidence: 'high',
    } : {
      headline: 'All stock above reorder levels',
      detail: 'Nothing needs reordering right now.',
      action: 'Do a routine count to confirm the numbers.',
      confidence: 'high',
    });
    insights.push({ headline: `${wholeMoney(stockValue(d.stock))} held in stock at cost`, detail: 'Money tied up on the shelf.', action: 'Look for slow-moving lines to run down.', confidence: 'high' });
  }
  return insights.slice(0, 5);
}

// ── Blocks ───────────────────────────────────────────────────────────────────
// { key, kind: 'kpis', title, items: [{ label, value, sub }] }
// { key, kind: 'chart', title, note?, rows: [{ label, value, display }] }
// { key, kind: 'table', title, columns: [{ label, align }], rows: [[cell…]], empty }
// { key, kind: 'insights', title, items: [{ headline, detail, action, confidence }] }

const kpis = (key, title, items) => ({ key, kind: 'kpis', title, items });
const chart = (key, title, rows, extra = {}) => ({ key, kind: 'chart', title, rows, ...extra });
const table = (key, title, columns, rows, empty) => ({
  key, kind: 'table', title, empty,
  columns: columns.map(c => (typeof c === 'string' ? { label: c, align: 'left' } : c)),
  rows,
});
const R = (label) => ({ label, align: 'right' });
const countRows = (obj) => byValue(obj).map(([label, value]) => ({ label, value, display: String(value) }));
const moneyRows = (pairs) => pairs.map(([label, value]) => ({ label, value, display: wholeMoney(value) }));

function blocksFor(id, r) {
  const d = r.scoped;
  const p = r.profit;
  switch (id) {
    case 'overview':
      return [
        kpis('headline', 'Headline figures', [
          { label: 'Revenue (ex GST)', value: money(r.money.revenue), sub: `${r.money.invoiceCount} invoices issued` },
          { label: 'Payments received', value: money(r.money.received) },
          { label: 'Outstanding', value: money(r.money.outstanding), sub: r.money.overdue > 0 ? `${money(r.money.overdue)} overdue` : '' },
          { label: 'Gross margin', value: pct(p.margin), sub: costedSub(p) },
        ]),
        kpis('more', 'More figures', [
          { label: 'Jobs completed', value: String(r.jobs.completed.length) },
          { label: 'Quotes sent', value: String(r.sales.quotesSent) },
          { label: 'Quote win rate', value: pct(r.sales.winRate, 0) },
          { label: 'Lead conversion', value: pct(r.sales.leadConversion, 0) },
          { label: 'Avg invoice value', value: r.money.averageInvoice == null ? '—' : wholeMoney(r.money.averageInvoice) },
          { label: 'Stock items', value: `${d.stock.length} (${lowStock(d.stock).length} low)` },
        ]),
        chart('jobs-by-status', 'New jobs by status', countRows(r.jobs.byStatus)),
        chart('invoices-by-status', 'Invoices issued by status', countRows(r.invoicesByStatus)),
      ];

    case 'revenue':
      return [
        kpis('headline', 'Headline figures', [
          { label: 'Revenue (ex GST)', value: wholeMoney(r.money.revenue), sub: `${r.money.invoiceCount} invoices issued` },
          { label: 'Labour cost', value: wholeMoney(p.labour), sub: 'on costed jobs' },
          { label: 'Materials and purchases', value: wholeMoney(p.materials + p.purchases), sub: 'on costed jobs' },
          { label: 'Gross profit', value: wholeMoney(p.profit), sub: costedSub(p) || `${pct(p.margin)} margin` },
        ]),
        chart('by-month', 'Revenue by month', moneyRows(r.monthly.slice(-24).map(m => [m.label, m.revenue]))),
        chart('breakdown', 'Profit breakdown (costed jobs)', moneyRows([
          ['Revenue', p.revenue], ['Labour cost', p.labour], ['Material cost', p.materials],
          ['Purchase orders', p.purchases], ['Gross profit', p.profit],
        ])),
        table('monthly', 'Monthly figures', ['Month', R('Revenue'), R('Revenue on costed jobs'), R('Cost'), R('Gross profit')],
          r.monthly.map(m => [m.label, wholeMoney(m.revenue), wholeMoney(m.costedRevenue), wholeMoney(m.cost), wholeMoney(m.profit)]),
          'No invoices in this range'),
        table('invoices', 'Invoices issued', ['Invoice', 'Customer', 'Status', 'Issued', R('Subtotal (ex GST)')],
          r.money.issued.map(i => [i.number || '', i.customerName || '', i.status || '', dayLabel(i.issueDate), money(i.subtotal)]),
          'No invoices issued in this range'),
      ];

    case 'jobs':
      return [
        kpis('headline', 'Headline figures', [
          { label: 'Jobs completed', value: String(r.jobs.completed.length) },
          { label: 'New jobs', value: String(r.jobs.created.length) },
          { label: 'Active now', value: String(r.jobs.active), sub: 'scheduled, in progress or on hold' },
          { label: 'Avg hours per job', value: r.jobs.averageHours == null ? '—' : r.jobs.averageHours.toFixed(1), sub: 'logged on completed jobs' },
        ]),
        chart('by-status', 'New jobs by status', countRows(r.jobs.byStatus)),
        table('top', 'Top jobs by invoiced value', ['Job', 'Customer', 'Status', R('Invoiced (ex GST)')],
          p.jobs.slice(0, 8).map(j => [jobNo(j.job, j.jobId), j.job?.customerName || '', j.job?.status || '', wholeMoney(j.revenue)]),
          'No jobs invoiced in this range'),
        table('completed', 'Jobs completed', ['Job', 'Title', 'Customer', 'Completed', R('Hours logged')],
          r.jobs.completed.map(j => [j.number || '', j.title || '', j.customerName || '', dayLabel(r.jobs.completedAt(j)), (r.jobs.hoursByJob.get(String(j.id)) || 0).toFixed(1)]),
          'No jobs completed in this range'),
      ];

    case 'job_costing':
      return [
        kpis('headline', 'Headline figures', [
          { label: 'Job cost', value: money(p.cost), sub: 'labour, materials and purchases' },
          { label: 'Revenue (ex GST)', value: money(p.revenue), sub: 'on costed jobs' },
          { label: 'Gross margin', value: pct(p.margin), sub: costedSub(p) },
        ]),
        table('jobs', 'Jobs invoiced in this range', ['Job', 'Customer', R('Hrs'), R('Revenue'), R('Labour'), R('Materials'), R('Profit'), R('Margin')],
          p.jobs.map(j => [jobNo(j.job, j.jobId), j.job?.customerName || '', j.hours.toFixed(2), money(j.revenue),
            ...(j.known ? [money(j.labour), money(j.materials + j.purchases), money(j.profit), pct(j.margin)] : [NOT_COSTED[j.reason] || 'Not costed', '', '', ''])]),
          'No jobs invoiced in this range'),
      ];

    case 'technicians': {
      const team = [...r.team].sort((a, b) => b.invoiced - a.invoiced);
      return [
        table('performance', 'Technician performance', ['Name', 'Role', R('Jobs completed'), R('Hours logged'), R('Invoiced (shared)')],
          team.map(t => [t.name || '', t.role || '', String(t.jobsCompleted), t.hours.toFixed(1), money(t.invoiced)]),
          'No technicians'),
        chart('invoiced', 'Invoiced by technician', moneyRows(team.map(t => [t.name || '', t.invoiced])),
          { note: "A job's invoice is split evenly between everyone on the job." }),
      ];
    }

    case 'timesheets_labor': {
      const team = [...r.team].sort((a, b) => (b.billableShare || 0) - (a.billableShare || 0));
      return [
        kpis('headline', 'Headline figures', [
          { label: 'Hours logged', value: hrs(r.labour.hours) },
          { label: 'Hours on jobs', value: hrs(r.labour.billableHours) },
          { label: 'Share on jobs', value: pct(r.labour.billableShare) },
          { label: 'Labour cost', value: money(r.labour.cost), sub: r.labour.unratedHours > 0 ? `${hrs(r.labour.unratedHours)} with no pay rate` : '' },
        ]),
        table('by-tech', 'Hours and cost by technician', ['Technician', 'Role', R('Logged hrs'), R('On jobs'), R('Labour cost')],
          team.map(t => [t.name || '', t.role || '', t.hours.toFixed(2), pct(t.billableShare), money(t.labourCost)]),
          'No timesheet records logged'),
        chart('share', 'Share of hours on jobs', team.filter(t => t.billableShare != null)
          .map(t => ({ label: t.name || '', value: t.billableShare, display: pct(t.billableShare) })), { max: 1 }),
      ];
    }

    case 'assets_maintenance': {
      const costs = d.assets.map(a => [a.name || '', assetServiceCost(a)]).filter(([, c]) => c > 0).sort((a, b) => b[1] - a[1]);
      const logs = [];
      d.assets.forEach(a => (a.logs || []).forEach(l => { if (l.type === 'Service') logs.push({ ...l, asset: a }); }));
      logs.sort((a, b) => new Date(b.date) - new Date(a.date));
      return [
        kpis('headline', 'Headline figures', [
          { label: 'Total assets', value: String(d.assets.length) },
          { label: 'Active agreements', value: String(d.maintenancePlans.filter(pl => pl.status === 'Active').length) },
          { label: 'Service actions logged', value: String(logs.length) },
          { label: 'Total service cost', value: wholeMoney(costs.reduce((s, [, c]) => s + c, 0)) },
        ]),
        table('agreements', 'Maintenance agreements', ['Agreement plan', 'Asset', 'Customer', R('Priority'), 'Next due'],
          d.maintenancePlans.map(pl => [pl.name || '', pl.assetName || '', pl.customerName || '', String(pl.priority || 5), pl.nextServiceDate || pl.nextDue || '']),
          'No maintenance plans'),
        chart('cost-by-asset', 'Service cost by asset', moneyRows(costs.slice(0, 10))),
        table('history', 'Service history', ['Date', 'Asset', 'Serial', 'Technician', 'Job', R('Cost'), 'Notes'],
          logs.map(l => [dayLabel(l.date), l.asset.name || '', l.asset.serial || '', l.technicianName || '', l.jobNumber || '', money(l.cost), l.notes || '']),
          'No service logs registered yet'),
      ];
    }

    case 'customers': {
      const c = r.customers;
      const cr = r.credit;
      const ag = r.aging;
      const overRows = cr.over.map(a => [
        a.name,
        a.terms,
        money(a.limit),
        money(a.owing),
        money(a.overBy),
      ]);
      return [
        kpis('headline', 'Headline figures', [
          { label: 'Active customers', value: String(c.active), sub: `${c.total} in total` },
          { label: 'New customers', value: String(c.new), sub: 'added in this range' },
          { label: 'Invoiced', value: String(c.invoiced), sub: 'customers invoiced in this range' },
          { label: 'Repeat', value: String(c.repeat), sub: 'invoiced more than once' },
        ]),
        kpis('credit', 'Credit limits (incl. GST)', [
          { label: 'Credit granted', value: money(cr.granted), sub: cr.accounts > 0 ? `${cr.accounts} customers with a limit` : 'No limits set' },
          { label: 'Credit used', value: money(cr.used), sub: cr.utilization == null ? '' : `${pct(cr.utilization)} of limits` },
          { label: 'Over limit', value: String(cr.overCount), sub: cr.overCount > 0 ? `${money(cr.overTotal)} over in total` : 'Nobody over their limit' },
        ]),
        table('credit-over', 'Customers over their credit limit', ['Customer', 'Terms', R('Limit'), R('Owing'), R('Over by')],
          overRows,
          'Nobody is over their credit limit'),
        kpis('aging', 'Aged receivables (incl. GST)', [
          { label: 'Current', value: money(ag.buckets.current), sub: 'not yet due' },
          { label: '1–30 days', value: money(ag.buckets.d1_30), sub: 'past due' },
          { label: '31–60 days', value: money(ag.buckets.d31_60) },
          { label: '61–90 days', value: money(ag.buckets.d61_90) },
          { label: '90+ days', value: money(ag.buckets.d90p) },
        ]),
        table('aging-by-customer', 'Receivables by customer', ['Customer', 'Terms', R('Current'), R('1–30'), R('31–60'), R('61–90'), R('90+'), R('Total')],
          ag.rows.map(a => [a.name, a.terms, money(a.current), money(a.d1_30), money(a.d31_60), money(a.d61_90), money(a.d90p), money(a.total)]),
          'Nothing owing by any customer'),
        table('top', 'Top customers by revenue', [R('#'), 'Customer', R('Revenue (ex GST)'), R('Share')],
          c.top.map((t, i) => [String(i + 1), t.name || 'Customer', money(t.revenue), pct(t.share)]),
          'No customers invoiced in this range'),
      ];
    }

    case 'inventory': {
      const stock = d.stock;
      const sell = stock.reduce((s, i) => s + (Number(i.quantity) || 0) * (Number(i.unitPrice) || 0), 0);
      const byCategory = {};
      stock.forEach(i => { const k = i.category || 'Uncategorised'; byCategory[k] = (byCategory[k] || 0) + (Number(i.quantity) || 0); });
      return [
        kpis('headline', 'Headline figures', [
          { label: 'Total items', value: String(stock.length) },
          { label: 'Stock value (cost)', value: wholeMoney(stockValue(stock)) },
          { label: 'Stock value (sell)', value: wholeMoney(sell) },
        ]),
        table('low', 'Low stock', ['Item', 'SKU', R('Qty'), R('Reorder level'), 'Supplier'],
          lowStock(stock).map(i => [i.name || '', i.sku || '', String(i.quantity ?? ''), String(i.reorderLevel ?? ''), i.supplier || '']),
          'Nothing at or below its reorder level'),
        chart('by-category', 'Stock by category', countRows(byCategory)),
        table('on-hand', 'Stock on hand', ['Item', 'SKU', 'Category', R('Qty'), R('Cost'), R('Value at cost')],
          stock.map(i => [i.name || '', i.sku || '', i.category || '', String(i.quantity ?? ''), money(i.costPrice), money((Number(i.quantity) || 0) * (Number(i.costPrice) || 0))]),
          'No stock items'),
      ];
    }
    default:
      return [];
  }
}

/**
 * One report's content.
 * @param {string} id  a REPORTS id
 * @param {object} r   buildReport() result
 * @param {{ insights?: { items: object[], source: string } }} [opts]
 *   the insights to include; the on-device ones when not given
 */
export function reportSpec(id, r, { insights, companyName } = {}) {
  const meta = REPORTS.find(x => x.id === id);
  const ins = insights || { items: localInsights(id, r, companyName), source: 'local' };
  return {
    id,
    title: meta ? meta.label : id,
    blocks: [
      { key: 'insights', kind: 'insights', title: ins.source === 'live' ? 'RELAY AI Insights' : 'RELAY Insights', items: ins.items || [] },
      ...blocksFor(id, r),
    ],
  };
}

// Keep only the chosen blocks. `selection` maps a report id to a Set of block
// keys; reports with nothing chosen are dropped.
export function selectBlocks(specs, selection) {
  return specs
    .map(s => ({ ...s, blocks: s.blocks.filter(b => selection[s.id] && selection[s.id].has(b.key)) }))
    .filter(s => s.blocks.length);
}

export { isoDay };
