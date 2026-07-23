-- =====================================================================
-- DATA PLATFORM — Phase 1: contributed_metrics (Layer 1 landing table)
-- =====================================================================
-- Anonymized, aggregated industry statistics contributed by consenting
-- tenants (cloud cron + local Electron clients). This table is CROSS-TENANT
-- by design and MUST NOT contain PII: no customer names/addresses/contacts,
-- no technician names, no free-text. Region is bucketed to postcode/town only.
--
-- See docs/DATA_PLATFORM_STRATEGY.md (§2, Layer 1) and
-- docs/DATA_PLATFORM_PHASE1.md (Ticket 2).
--
-- Access model: RLS is ENABLED with NO permissive policy, so normal
-- authenticated clients are denied all access. Only the service role
-- (used by the contrib-ingest and contrib-aggregate-cloud edge functions)
-- can read/write, because the service role bypasses RLS. This makes the
-- table effectively write-only from the app's perspective.

CREATE TABLE contributed_metrics (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  install_id     text NOT NULL,          -- pseudonymous per-install id; NOT tenant identity
  source         text NOT NULL,          -- 'cloud' | 'local'
  schema_version int  NOT NULL,
  metric_key     text NOT NULL,          -- e.g. 'labor_rate.standard', 'job.duration_delta'
  trade          text,                   -- Electrical | Solar | HVAC | ...
  region_bucket  text,                   -- postcode or town; coarsened, never a street address
  period         text NOT NULL,          -- 'YYYY-MM'
  country        text NOT NULL,          -- ISO code; for jurisdiction routing / allowlist
  value_count    int  NOT NULL,          -- how many underlying records fed this metric
  value_median   numeric,
  value_p25      numeric,
  value_p75      numeric,
  value_sum      numeric,                -- only where sums are non-identifying
  submitted_at   timestamp with time zone DEFAULT now() NOT NULL
);

-- Aggregation lookups (Phase 2 benchmark_cells reads by these dimensions).
CREATE INDEX contributed_metrics_dims_idx
  ON contributed_metrics (metric_key, trade, region_bucket, period);

-- Dedupe / rate-limit lookups by install + period.
CREATE INDEX contributed_metrics_install_period_idx
  ON contributed_metrics (install_id, period);

-- Deny-by-default: enable RLS and add NO policy. Regular clients get nothing;
-- the service role (edge functions) bypasses RLS.
ALTER TABLE contributed_metrics ENABLE ROW LEVEL SECURITY;
