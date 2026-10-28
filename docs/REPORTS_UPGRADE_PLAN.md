# Reports upgrade plan

Status: planning (2026-10-28). Covers `src/pages/reports/Reports.js` and the shared
KPI engine in `supabase/functions/dashboard-kpis/kpis.js`.

## Decisions

- **Audience: both** the owner (profit, cash) and the office (operations). The
  Overview tab carries both; each detail tab leans one way.
- **The Simple/Detailed toggle goes.** One layout per report, chart first, table below.
- **One profit definition app-wide:** invoiced revenue (ex GST) less actual job cost
  (timesheet hours × pay rate + job materials at cost + purchase orders), the
  dashboard's `invoicedJobProfit`. Jobs with no cost data or a missing pay rate are
  left out and shown as "n of m jobs costed", never guessed.
- **Charts are the primary read** on every tab. Each has a hover tooltip, a legend
  (two or more series), and a table view underneath.

## Current problems (fix in Phase 0)

| # | Problem | Where |
|---|---|---|
| 1 | Money figures include GST, revenue counts only `Paid` invoices (part-payments missed), and outstanding ignores part-payments. The dashboard does all three correctly, so the two screens disagree. | `Reports.js:167-168` |
| 2 | Gross profit = revenue − materials; labour is shown but not subtracted. | `Reports.js:1260` |
| 3 | Job Costing "billable" = hours × rate profile (falls back to $85), not what was invoiced; ignores materials and POs. The dashboard's Gross margin card links here. | `Reports.js:1333-1341` |
| 4 | Technician "revenue" is job cost, and multi-tech jobs count in full for every tech. Avg job value is also cost. | `Reports.js:169, 187` |
| 5 | Timesheet labour total uses `ts.payRate` only; the rows below fall back to `tech.payRate`. | `Reports.js:1449` vs `1461` |
| 6 | Utilisation differs from the dashboard's (booked ÷ available). | `Reports.js:1445` |
| 7 | Revenue by Month isn't in date order. | `Reports.js:1252-1256` |
| 8 | Technician, customer and asset-type filters exist with no controls; the date filter uses job `createdAt`. | `Reports.js:20-22, 57` |
| 9 | CSV values unescaped (quotes and commas break rows; no formula-injection guard); the Customers export ignores filters. | `exportCSV` |
| 10 | Offline insights use invented targets (45% win rate, 35% lead conversion). | `getLocalInsightsJSON` |
| 11 | One "Access Reports" permission exposes pay rates and labour cost. | `permissions.js:162` |
| 12 | `.sort()` mutates the shared arrays; no tests at all. | `Reports.js:1313, 1416, 1522` |

## Phases

### Phase 0: correct numbers
- New pure module `src/utils/reportMetrics.js` (no DOM, like `kpis.js`), reusing
  `exGst`, `invoicePayments`, `invoiceBalance`, `invoiceJobShares`, `jobCosts`,
  `jobCompletedAt`, `periodRanges`. Export the helpers from `kpis.js` that are
  module-private today.
- Fix problems 1–9 and 12 there, with `reportMetrics.test.js`. The dashboard and
  Reports must agree; add a test that asserts it.

### Phase 1: layout, filters, charts
- Filter row above all charts: period (the dashboard's `PERIODS` plus custom range),
  compare-to (previous period / same period last year), technician, customer, job
  type, asset type. All filters are saved in the URL query.
- KPI tiles carry a change against the comparison period and a sparkline.
- Every figure, bar and row links to the filtered list behind it (`KPI_FILTERS`).
- Tables move to the shared `DataTable` (sortable); inline styles move to CSS; mobile layout.
- The chart kit below.

### Phase 2: new reports
Debtors ageing, cash received, ready to invoice, job profit by type/customer/cost
centre, estimate vs actual (roadmap §6), quote pipeline, callbacks, supplier and
contractor spend, maintenance due, stock usage.

### Phase 3: export
CSV of the table on screen, escaped properly; PDF of the tab through `jspdf` /
`PrintPreview`; later, a scheduled emailed summary.

### Phase 4: insights and permissions
Insights take their input from `reportMetrics` (including the comparison period);
no invented targets; every suggested action is a link. Add a separate "view labour
cost and pay" permission.

## Chart kit

**Technology: small in-house SVG components** in `src/components/charts/`, with no
new dependency. Reasons:
- The CSP (`script-src 'self'`) means any library has to be bundled anyway.
- SVG reads the app's CSS tokens, so light, dark and the alternate themes in
  `components.css` work without re-rendering. Canvas can't read CSS variables.
- It prints and exports to PDF crisply, and is accessible (`role="img"`, a title,
  and a table view).
- The set of chart forms we need is small (below).

Components: `columnChart` (single, stacked, grouped), `barChart` (horizontal, for
long labels), `lineChart` (with optional area and a comparison-period ghost line),
`sparkline`, `stackedBar` (one-row part-to-whole), `dumbbell` (estimate → actual),
`heatmap` (weekday × hour, sequential), `funnel` (rendered as horizontal bars).
Shared: one y-axis only, hover tooltip/crosshair, legend, `prefers-reduced-motion`.

**Palette:** a categorical palette led by the brand colour, in fixed order. It has
passed the dataviz validator for lightness, chroma, colour-blind separation and
normal-vision separation, in both modes:

| Slot | Light | Dark (on `#18181B`) |
|---|---|---|
| 1 orange | `#eb6834` | `#d95926` |
| 2 blue | `#2a78d6` | `#3987e5` |
| 3 aqua | `#1baf7a` | `#199e70` |
| 4 yellow | `#eda100` | `#c98500` |
| 5 magenta | `#e87ba4` | `#d55181` |
| 6 green | `#008300` | `#008300` |

Slots 3–5 are under 3:1 contrast on white, so charts using them always carry
direct labels or the table view. Sequential (ageing, heatmaps) uses one blue ramp,
`#b7d3f6 → #184f95`. The current `JOB_STATUS_COLORS` fail as chart colours
(`#1B6DE0` and `#3B82F6` are indistinguishable; grey reads as no colour), so
status charts use this palette plus labels, while badges keep their existing colours.

### Charts per report

| Report | Charts |
|---|---|
| Overview | KPI tiles + sparklines; revenue columns with gross-profit line by month; debtors ageing stacked bar; margin by job type (emphasis: worst highlighted, rest grey) |
| Revenue and profit | Revenue vs cost vs profit by month (grouped columns); labour vs materials share (stacked bar); revenue by customer top 10 + Other; this period vs comparison (line + ghost line) |
| Cash and debtors (new) | Ageing stacked bar; cash received by week; days-to-pay trend line; top overdue customers bar |
| Jobs | Completed per week (columns); status pipeline (bars); callback rate line; ready-to-invoice value by age |
| Job costing | Margin by job (sorted bars, diverging around 0); estimate vs actual hours (dumbbell); cost mix per job type (stacked) |
| Team | Utilisation by tech (bars vs available); hours heatmap weekday × hour; billable vs non-billable stacked; jobs completed per tech |
| Sales (new) | Lead → quote → won funnel; win rate trend; days to accept distribution; open pipeline by age |
| Customers | New vs repeat by month (stacked columns); revenue concentration (top customer share); lifetime value distribution (histogram) |
| Assets and maintenance | Maintenance due by week ahead (columns, overdue highlighted); service cost by asset type |
| Inventory | Stock value by category; usage per month for top items; low-stock items vs reorder level (bullet bars) |
| Purchasing (new) | Spend by supplier/contractor (bars); PO spend by month; spend vs job revenue by cost centre |
