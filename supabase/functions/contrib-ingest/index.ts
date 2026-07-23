import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

// ============================================
// RELAY — DATA PLATFORM: contribution ingest (Phase 1, Ticket 5)
// ============================================
// Public endpoint that accepts anonymized aggregate rows from LOCAL Electron
// clients (cloud tenants are handled server-side by contrib-aggregate-cloud, so
// they must NOT post here — that would double-count). Validates shape, ranges,
// jurisdiction, and schema version; then idempotently replaces this install's
// rows for the period. Inserts via the service role into `contributed_metrics`.
//
// DEPLOY NOTE: local clients are not Supabase-authenticated, so this function
// must be deployed with JWT verification OFF:
//   supabase/config.toml → [functions.contrib-ingest]  verify_jwt = false
//
// See docs/DATA_PLATFORM_PHASE1.md (Ticket 5).

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

// Jurisdiction allowlist — server-side belt to the client's suspenders.
// Keep in sync with src/utils/jurisdiction.js. AU-first (2026-07-22).
const ALLOWED_COUNTRIES = new Set(['AU'])

const SCHEMA_VERSION = 1
const MAX_ROWS = 1000
const ALLOWED_SOURCES = new Set(['local'])

// Allowed metric_key prefixes — reject anything unexpected so a compromised or
// buggy client can't write arbitrary keys.
const ALLOWED_METRIC_PREFIXES = [
  'labor_rate.', 'invoice.', 'quote.', 'job.', 'material.',
]

function bad(msg: string, status = 400) {
  return new Response(
    JSON.stringify({ error: msg }),
    { status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
  )
}

function isFiniteNumOrNull(v: unknown): boolean {
  return v === null || v === undefined || (typeof v === 'number' && Number.isFinite(v))
}

// Sanity ranges — reject impossible values (poisoning / bugs).
function rowInRange(r: any): boolean {
  if (!Number.isInteger(r.value_count) || r.value_count < 0 || r.value_count > 10_000_000) return false
  for (const k of ['value_median', 'value_p25', 'value_p75', 'value_sum']) {
    if (!isFiniteNumOrNull(r[k])) return false
    if (typeof r[k] === 'number' && Math.abs(r[k]) > 1_000_000_000) return false
  }
  return true
}

function shortStrOrNull(v: unknown, max = 64): boolean {
  return v === null || v === undefined || (typeof v === 'string' && v.length <= max)
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })
  if (req.method !== 'POST') return bad('Method Not Allowed', 405)

  const supabaseUrl = Deno.env.get('SUPABASE_URL')
  const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
  if (!supabaseUrl || !serviceKey) return bad('Server not configured', 500)

  let body: any
  try {
    body = await req.json()
  } catch {
    return bad('Invalid JSON')
  }

  const { installId, source, country, period, schemaVersion, rows } = body || {}

  // ---- top-level validation ----
  if (typeof installId !== 'string' || installId.length < 8 || installId.length > 64) return bad('Bad installId')
  if (!ALLOWED_SOURCES.has(source)) return bad('Bad source')
  if (typeof country !== 'string' || !ALLOWED_COUNTRIES.has(country)) return bad('Region not eligible', 403)
  if (typeof period !== 'string' || !/^\d{4}-\d{2}$/.test(period)) return bad('Bad period')
  if (schemaVersion !== SCHEMA_VERSION) return bad(`Unsupported schemaVersion (expected ${SCHEMA_VERSION})`)
  if (!Array.isArray(rows) || rows.length === 0) return bad('No rows')
  if (rows.length > MAX_ROWS) return bad('Too many rows')

  // ---- per-row validation ----
  const clean: any[] = []
  for (const r of rows) {
    if (!r || typeof r.metric_key !== 'string') return bad('Bad row: metric_key')
    if (!ALLOWED_METRIC_PREFIXES.some((p) => r.metric_key.startsWith(p))) return bad(`Disallowed metric_key: ${r.metric_key}`)
    if (!shortStrOrNull(r.trade) || !shortStrOrNull(r.region_bucket) || !shortStrOrNull(r.metric_key)) return bad('Bad row: field too long')
    if (typeof r.period !== 'string' || !/^\d{4}-\d{2}$/.test(r.period)) return bad('Bad row: period')
    if (!rowInRange(r)) return bad('Bad row: value out of range')
    // Whitelist exactly the columns we store — nothing else is persisted.
    clean.push({
      install_id: installId,
      source,
      schema_version: SCHEMA_VERSION,
      metric_key: r.metric_key,
      trade: r.trade ?? null,
      region_bucket: r.region_bucket ?? null,
      period: r.period,
      country,
      value_count: r.value_count,
      value_median: r.value_median ?? null,
      value_p25: r.value_p25 ?? null,
      value_p75: r.value_p75 ?? null,
      value_sum: r.value_sum ?? null,
    })
  }

  const admin = createClient(supabaseUrl, serviceKey)

  try {
    // Idempotent replace: clear this install's prior rows for this period+source,
    // then insert the fresh set. Re-running a period never duplicates or inflates.
    const { error: delErr } = await admin
      .from('contributed_metrics')
      .delete()
      .eq('install_id', installId)
      .eq('period', period)
      .eq('source', source)
    if (delErr) return bad('Ingest failed (clear): ' + delErr.message, 500)

    const { error: insErr } = await admin.from('contributed_metrics').insert(clean)
    if (insErr) return bad('Ingest failed (insert): ' + insErr.message, 500)

    return new Response(
      JSON.stringify({ success: true, accepted: clean.length }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    )
  } catch (e) {
    return bad('Internal error: ' + (e as Error).message, 500)
  }
})
