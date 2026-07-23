// ============================================
// RELAY — DATA PLATFORM: shared metric computation (Phase 1, Ticket 3)
// ============================================
// The SINGLE source of truth for turning a tenant's operational records into
// anonymized, aggregated `contributed_metrics` rows. Both collection paths call
// this so cloud and local tenants produce byte-identical output:
//   - cloud: supabase/functions/contrib-aggregate-cloud (server-side cron)
//   - local: src/utils/contribSync.js (Electron client, weekly)
//
// PII FIREWALL: the returned rows must NEVER contain customer names, emails,
// phones, street addresses, technician names, or free-text. Addresses are used
// ONLY to derive a coarse `region_bucket` (postcode), then discarded. This is
// enforced by contribMetrics.test.js, which fails if any seed PII string leaks
// into the payload. Do not add raw record fields to the output.
//
// See docs/DATA_PLATFORM_STRATEGY.md (§2) and docs/DATA_PLATFORM_PHASE1.md.

export const CONTRIB_SCHEMA_VERSION = 1;

// ---- small pure stats helpers (no Date.now / no Math.random) ----

function median(sorted) {
  const n = sorted.length;
  if (!n) return null;
  const mid = Math.floor(n / 2);
  return n % 2 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
}

// Linear-interpolation percentile on an ascending-sorted array.
function percentile(sorted, p) {
  const n = sorted.length;
  if (!n) return null;
  if (n === 1) return sorted[0];
  const idx = (p / 100) * (n - 1);
  const lo = Math.floor(idx);
  const hi = Math.ceil(idx);
  if (lo === hi) return sorted[lo];
  return sorted[lo] + (sorted[hi] - sorted[lo]) * (idx - lo);
}

function round(n) {
  return n == null ? null : Math.round(n * 100) / 100;
}

// ---- de-identification helpers ----

// Coarsen an address to a region bucket. AU postcodes are 4 digits; that's a
// non-identifying bucket. Everything else about the address is dropped.
export function deriveRegionBucket(address) {
  if (!address || typeof address !== 'string') return null;
  const m = address.match(/\b(\d{4})\b/);
  return m ? m[1] : null;
}

// 'YYYY-MM' from an ISO string, by slice (deterministic, no Date needed).
function periodOf(iso) {
  if (!iso || typeof iso !== 'string' || iso.length < 7) return null;
  return iso.slice(0, 7);
}

// costCenterId -> trade label. Prefer the costCenters collection; fall back to
// stripping the 'cc_' prefix so unknown cost centers still bucket sanely.
function buildTradeIndex(costCenters) {
  const idx = {};
  (costCenters || []).forEach((cc) => {
    if (!cc || !cc.id) return;
    // Use the code or a trimmed name — never anything free-text/identifying.
    idx[cc.id] = cc.code || cc.name || cc.id.replace(/^cc_/, '');
  });
  return idx;
}

function tradeOf(job, tradeIndex) {
  if (!job) return null;
  const id = job.costCenterId;
  if (id && tradeIndex[id]) return tradeIndex[id];
  if (id) return id.replace(/^cc_/, '');
  return null;
}

// ---- aggregation accumulator ----
// Groups raw values by (metric_key|trade|region|period), then emits one row per
// group with median/p25/p75/count/sum. Keys carry no identity.

class Agg {
  constructor() { this.groups = new Map(); }

  key(metric, trade, region, period) {
    return [metric, trade || '', region || '', period || ''].join('|');
  }

  push(metric, trade, region, period, value) {
    if (value == null || Number.isNaN(value)) return;
    const k = this.key(metric, trade, region, period);
    let g = this.groups.get(k);
    if (!g) { g = { metric, trade, region, period, values: [] }; this.groups.set(k, g); }
    g.values.push(value);
  }

  // A pure count metric (no distribution) — e.g. job.count.
  count(metric, trade, region, period) {
    const k = this.key(metric, trade, region, period);
    let g = this.groups.get(k);
    if (!g) { g = { metric, trade, region, period, values: [], countOnly: true, n: 0 }; this.groups.set(k, g); }
    g.countOnly = true;
    g.n = (g.n || 0) + 1;
  }

  rows(ctx) {
    const out = [];
    for (const g of this.groups.values()) {
      if (g.countOnly) {
        out.push(this.row(ctx, g.metric, g.trade, g.region, g.period, {
          value_count: g.n, value_median: null, value_p25: null, value_p75: null, value_sum: null,
        }));
        continue;
      }
      if (!g.values.length) continue;
      const sorted = [...g.values].sort((a, b) => a - b);
      out.push(this.row(ctx, g.metric, g.trade, g.region, g.period, {
        value_count: sorted.length,
        value_median: round(median(sorted)),
        value_p25: round(percentile(sorted, 25)),
        value_p75: round(percentile(sorted, 75)),
        value_sum: round(sorted.reduce((s, v) => s + v, 0)),
      }));
    }
    return out;
  }

  row(ctx, metric_key, trade, region_bucket, period, stats) {
    return {
      install_id: ctx.installId,
      source: ctx.source,
      schema_version: CONTRIB_SCHEMA_VERSION,
      metric_key,
      trade: trade || null,
      region_bucket: region_bucket || null,
      period,
      country: ctx.country,
      ...stats,
    };
  }
}

// ============================================
// Main entry point
// ============================================
// collections: { settings, customers, costCenters, jobs, quotes, invoices }
// ctx:         { installId, source: 'cloud'|'local', country, period: 'YYYY-MM' }
// Returns: array of contributed_metrics rows (PII-free).
export function computeContributions(collections = {}, ctx = {}) {
  const { settings, customers, costCenters, jobs, quotes, invoices } = collections;
  const agg = new Agg();

  const companyRegion = deriveRegionBucket(settings && settings.address);
  const tradeIndex = buildTradeIndex(costCenters);

  // customerId -> region bucket (address used ONLY here, then discarded).
  const custRegion = {};
  (customers || []).forEach((c) => {
    if (c && c.id) custRegion[c.id] = deriveRegionBucket(c.address) || companyRegion;
  });

  // jobId -> { trade, region } index (built from jobs; no identity retained).
  const jobIndex = {};
  (jobs || []).forEach((job) => {
    if (!job || !job.id) return;
    jobIndex[job.id] = {
      trade: tradeOf(job, tradeIndex),
      region: custRegion[job.customerId] || companyRegion,
    };
  });

  // 1. Labor rates — company-level config, dateless → bucket to ctx.period.
  if (settings && Array.isArray(settings.laborRates)) {
    settings.laborRates.forEach((r) => {
      if (!r || typeof r.rate !== 'number') return;
      const name = (r.name || '').toLowerCase();
      let key = 'labor_rate.other';
      if (name.includes('after')) key = 'labor_rate.afterhours';
      else if (name.includes('emergency')) key = 'labor_rate.emergency';
      else if (name.includes('standard') || r.isDefault) key = 'labor_rate.standard';
      agg.push(key, null, companyRegion, ctx.period, r.rate);
      if (typeof r.minCallOutFee === 'number' && r.minCallOutFee > 0) {
        agg.push('labor_rate.callout_fee', null, companyRegion, ctx.period, r.minCallOutFee);
      }
    });
  }

  // 2. Invoice totals (revenue signal) by trade+region+period.
  (invoices || []).forEach((inv) => {
    if (!inv || typeof inv.total !== 'number') return;
    const ji = jobIndex[inv.jobId] || {};
    const region = ji.region || companyRegion;
    const period = periodOf(inv.paymentReceivedDate || inv.createdAt || inv.updatedAt);
    if (!period) return;
    agg.push('invoice.total', ji.trade || null, region, period, inv.total);
  });

  // 3. Quotes: totals + win rate by trade+region+period.
  const quoteWin = new Map(); // key -> {won, total, trade, region, period}
  (quotes || []).forEach((q) => {
    if (!q) return;
    // A quote may reference a job via jobs[].quoteId; approximate trade/region
    // from the company if not resolvable (kept coarse either way).
    const region = companyRegion;
    const period = periodOf(q.createdAt || q.updatedAt);
    if (!period) return;
    if (typeof q.total === 'number') agg.push('quote.total', null, region, period, q.total);
    const k = ['', region, period].join('|');
    let w = quoteWin.get(k);
    if (!w) { w = { won: 0, total: 0, trade: null, region, period }; quoteWin.set(k, w); }
    w.total += 1;
    const status = (q.status || '').toLowerCase();
    if (status === 'accepted' || status === 'converted' || status === 'won') w.won += 1;
  });
  for (const w of quoteWin.values()) {
    if (w.total > 0) {
      agg.push('quote.win_rate', w.trade, w.region, w.period, round(w.won / w.total));
      // carry sample size via a parallel count metric
      for (let i = 0; i < w.total; i++) agg.count('quote.count', w.trade, w.region, w.period);
    }
  }

  // 4. Jobs: counts + material margins + estimate/actual delta (forward-compatible).
  (jobs || []).forEach((job) => {
    if (!job) return;
    const ji = jobIndex[job.id] || {};
    const region = ji.region || companyRegion;
    const period = periodOf(job.updatedAt || job.createdAt);
    if (!period) return;

    agg.count('job.count', ji.trade || null, region, period);

    (job.materials || []).forEach((m) => {
      if (m && typeof m.cost === 'number' && typeof m.price === 'number' && m.cost > 0) {
        agg.push('material.margin_pct', ji.trade || null, region, period,
          round(((m.price - m.cost) / m.cost) * 100));
      }
    });

    // Estimate vs actual hours — present only once actuals are captured.
    const est = Array.isArray(job.labor)
      ? job.labor.reduce((s, l) => s + (Number(l.hours) || 0), 0) : null;
    const act = typeof job.actualHours === 'number' ? job.actualHours : null;
    if (est && act && est > 0) {
      agg.push('job.duration_delta_pct', ji.trade || null, region, period,
        round(((act - est) / est) * 100));
    }
  });

  return agg.rows(ctx);
}
