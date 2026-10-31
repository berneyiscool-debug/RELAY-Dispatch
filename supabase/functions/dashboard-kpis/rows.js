// ============================================
// RELAY — DASHBOARD KPIs: DATABASE ROWS → KPI RECORDS
// ============================================
// The KPI formulas (kpis.js) read the app's camelCase records, which the
// browser store builds from database rows (src/data/store.js normalizeRecord).
// This is the server-side equivalent for just the tables and fields the KPIs
// read: snake_case → camelCase, plus the __meta__ blobs the store packs extra
// fields into. Plain JS with no imports so Node tests can check it against the
// store, and the Edge Function can import it.
//
// Time zones: the formulas use local calendar days. On the server "local" is
// UTC, so every absolute timestamp is first rewritten as the business's own
// wall-clock time with no zone ('2026-10-07T22:30:00Z' → '2026-10-08T09:30:00'
// in Sydney). A zone-less string parses as local time in any runtime, so the
// formulas see the business's days wherever they run.

// Collection → table and the columns the KPIs need.
export const KPI_TABLES = {
  invoices:         { table: 'invoices', columns: 'id,job_id,customer_id,customer_name,status,line_items,subtotal,tax,total,due_date,paid_date,created_at,updated_at' },
  jobs:             { table: 'jobs', columns: 'id,customer_id,type,status,technician_id,quote_id,material_cost,tasks,notes,created_at,updated_at' },
  quotes:           { table: 'quotes', columns: 'id,customer_id,status,line_items,subtotal,valid_until,created_at,updated_at' },
  schedule:         { table: 'schedule', columns: 'id,job_id,technician_id,title,type,date,start_hour,end_hour,start_time,finish_time,hours,color,created_at' },
  leads:            { table: 'leads', columns: 'id,status,stage_history,created_at,updated_at' },
  timesheets:       { table: 'timesheets', columns: 'id,technician_id,date,duration_hours,job_id,status,approved_by,created_at' },
  customers:        { table: 'customers', columns: 'id,status,created_at,credit_limit' },
  technicians:      { table: 'profiles', columns: 'id,role,pay_rate,deactivated' },
  jobMaterials:     { table: 'job_materials', columns: 'id,job_id,quantity,unit_cost,total_cost,date' },
  purchaseOrders:   { table: 'purchase_orders', columns: 'id,job_id,status,total,issue_date' },
  maintenancePlans: { table: 'maintenance_plans', columns: 'id,asset_id,status,next_service_date,trigger_type,meter_interval,last_triggered_meter' },
  assets:           { table: 'assets', columns: 'id,status,current_meter' },
};

const NUMERIC = new Set(['subtotal', 'tax', 'total', 'payRate', 'materialCost', 'quantity', 'unitCost', 'totalCost', 'hours', 'startHour', 'endHour', 'creditLimit', 'meterInterval', 'lastTriggeredMeter', 'currentMeter']);

const camel = (k) => k.replace(/_([a-z])/g, (_, c) => c.toUpperCase());

function parseMaybe(v) {
  if (typeof v !== 'string') return v;
  try { return JSON.parse(v); } catch { return v; }
}

function parseMeta(v) {
  if (typeof v !== 'string' || !v.startsWith('__meta__:')) return null;
  try { return JSON.parse(v.slice(9)); } catch { return null; }
}

// ── Time zone shift ──────────────────────────────────────────────────────────

const ABSOLUTE = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(:\d{2}(\.\d+)?)?(Z|[+-]\d{2}:?\d{2})$/;
const formatters = new Map();

function partsFormatter(timeZone) {
  if (!formatters.has(timeZone)) {
    formatters.set(timeZone, new Intl.DateTimeFormat('en-CA', {
      timeZone, hourCycle: 'h23',
      year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', second: '2-digit',
    }));
  }
  return formatters.get(timeZone);
}

/** True when Intl knows the zone. */
export function isValidTimeZone(tz) {
  if (typeof tz !== 'string' || !tz) return false;
  try { partsFormatter(tz); return true; } catch { return false; }
}

/** The wall-clock time of an instant in `timeZone`, as 'YYYY-MM-DDTHH:mm:ss'. */
export function wallClock(instant, timeZone) {
  const d = instant instanceof Date ? instant : new Date(instant);
  if (isNaN(d)) return null;
  const p = Object.fromEntries(partsFormatter(timeZone).formatToParts(d).map(x => [x.type, x.value]));
  return `${p.year}-${p.month}-${p.day}T${p.hour}:${p.minute}:${p.second}`;
}

/** A Date whose local fields read as `instant`'s wall clock in `timeZone`. */
export function wallClockDate(instant, timeZone) {
  const w = wallClock(instant, timeZone);
  const [date, time] = w.split('T');
  const [y, mo, d] = date.split('-').map(Number);
  const [h, mi, s] = time.split(':').map(Number);
  return new Date(y, mo - 1, d, h, mi, s);
}

// Rewrite every absolute timestamp in a value (deeply) as wall-clock time.
function shiftTimes(v, tz) {
  if (typeof v === 'string') return ABSOLUTE.test(v) ? (wallClock(v, tz) || v) : v;
  if (Array.isArray(v)) return v.map(x => shiftTimes(x, tz));
  if (v && typeof v === 'object') {
    const out = {};
    for (const [k, x] of Object.entries(v)) out[k] = shiftTimes(x, tz);
    return out;
  }
  return v;
}

// ── Rows ─────────────────────────────────────────────────────────────────────

/**
 * One database row → the record shape the KPI formulas read.
 * Pass `timeZone` to rewrite timestamps as that zone's wall clock.
 */
export function normalizeRow(collection, row, timeZone) {
  const r = {};
  for (const [k, v] of Object.entries(row)) {
    const key = camel(k);
    r[key] = NUMERIC.has(key) && v != null && v !== '' ? parseFloat(v) : v;
  }

  if (collection === 'invoices' || collection === 'quotes') {
    const meta = parseMaybe(r.lineItems);
    if (meta && !Array.isArray(meta) && typeof meta === 'object') {
      const { sections, ...rest } = meta;
      r.sections = sections || [];
      Object.entries(rest).forEach(([k, v]) => { if (v != null && v !== '') r[k] = v; });
    } else if (Array.isArray(meta)) {
      r.sections = [{ lineItems: meta }];
    }
    delete r.lineItems;
  }

  if (collection === 'jobs') {
    const meta = parseMeta(r.notes);
    if (meta) {
      ['isRecurring', 'completedAt', 'isCallback', 'isEmergency', 'parentJobId'].forEach(k => { if (meta[k] != null) r[k] = meta[k]; });
    }
    delete r.notes;
    r.tasks = parseMaybe(r.tasks);
  }

  if (collection === 'schedule') {
    const meta = parseMeta(r.color);
    if (meta) ['date', 'startTime', 'finishTime', 'hours', 'startHour', 'endHour', 'type'].forEach(k => { if (meta[k] != null) r[k] = meta[k]; });
    delete r.color;
  }

  if (collection === 'timesheets') {
    const meta = parseMeta(r.approvedBy);
    r.hours = parseFloat(meta && meta.hours != null ? meta.hours : r.durationHours) || 0;
    delete r.durationHours;
    delete r.approvedBy;
  }

  if (collection === 'leads') r.stageHistory = parseMaybe(r.stageHistory) || [];

  return timeZone ? shiftTimes(r, timeZone) : r;
}

export function normalizeRows(collection, rows, timeZone) {
  return (rows || []).map(row => normalizeRow(collection, row, timeZone));
}
