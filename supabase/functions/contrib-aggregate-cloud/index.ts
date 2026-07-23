import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
// Single source of truth for the STATISTICS logic, shared with the local client
// (src/utils/contribSync.js). The DB→shape adaptation below is platform-specific;
// the metric math is not, so it lives in one place.
import { computeContributions, CONTRIB_SCHEMA_VERSION } from "../../../src/utils/contribMetrics.js"

// ============================================
// RELAY — DATA PLATFORM: cloud aggregation cron (Phase 1, Ticket 6)
// ============================================
// For each CONSENTING cloud tenant, read their Supabase records, run the SAME
// computeContributions() the local client uses, and idempotently write the
// results into contributed_metrics (source='cloud'). Local tenants are handled
// by contrib-ingest instead.
//
// DEPLOY:
//   - Schedule via Supabase cron (weekly), e.g. a pg_cron job that invokes this
//     function, OR the dashboard's scheduled functions.
//   - Protect with a secret: set CONTRIB_CRON_SECRET and pass it as the
//     `x-cron-secret` header (so the endpoint can't be triggered publicly).
//   - verify_jwt = false (it authenticates via the cron secret, not a user JWT).
//
// See docs/DATA_PLATFORM_PHASE1.md (Ticket 6).

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-cron-secret',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

const ALLOWED_COUNTRIES = new Set(['AU']) // keep in sync with jurisdiction.js

function detectCountry(settings: any, address: string): string | null {
  const explicit = settings && typeof settings.country === 'string' && settings.country.trim()
  if (explicit) return explicit.toUpperCase()
  const a = address || ''
  if (/\b(NSW|VIC|QLD|WA|SA|TAS|ACT|NT)\b/i.test(a) && /\b\d{4}\b/.test(a)) return 'AU'
  if (/\baustralia\b/i.test(a)) return 'AU'
  return null
}

// ---- DB (snake_case) → module shape (camelCase) adapters ----
function mapCustomer(r: any) { return { id: r.id, address: r.address } }
function mapCostCenter(r: any) { return { id: r.id, code: r.code, name: r.name } }
function mapJob(r: any) {
  return {
    id: r.id,
    customerId: r.customer_id,
    costCenterId: r.cost_center_id,
    createdAt: r.created_at,
    updatedAt: r.updated_at,
    // Cloud jobs store roll-up numerics, not per-line materials/labor arrays, so
    // material-margin / duration-delta are computed only where derivable.
    labor: r.estimated_hours ? [{ hours: r.estimated_hours }] : [],
  }
}
function mapQuote(r: any) {
  return { id: r.id, total: r.total, status: r.status, createdAt: r.created_at, updatedAt: r.updated_at }
}
function mapInvoice(r: any) {
  return { id: r.id, jobId: r.job_id, total: r.total, createdAt: r.created_at, updatedAt: r.updated_at }
}

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })
  if (req.method !== 'POST') return json({ error: 'Method Not Allowed' }, 405)

  const cronSecret = Deno.env.get('CONTRIB_CRON_SECRET')
  if (cronSecret && req.headers.get('x-cron-secret') !== cronSecret) {
    return json({ error: 'Forbidden' }, 403)
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL')
  const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
  if (!supabaseUrl || !serviceKey) return json({ error: 'Server not configured' }, 500)

  const admin = createClient(supabaseUrl, serviceKey)
  const period = new Date().toISOString().slice(0, 7) // 'YYYY-MM'

  try {
    const { data: companies, error: cErr } = await admin
      .from('companies')
      .select('id, address, settings')
    if (cErr) return json({ error: 'Failed to list companies: ' + cErr.message }, 500)

    let processed = 0, skipped = 0, totalRows = 0
    const results: any[] = []

    for (const company of companies || []) {
      const settings = { ...(company.settings || {}), address: company.address }
      // Consent: opt-out default — contribute unless explicitly disabled.
      if (settings.dataContribution && settings.dataContribution.enabled === false) { skipped++; continue }
      const country = detectCountry(settings, company.address)
      if (!country || !ALLOWED_COUNTRIES.has(country)) { skipped++; continue }

      // Pull this tenant's records (service role bypasses RLS).
      const [cust, cc, jobs, quotes, invoices] = await Promise.all([
        admin.from('customers').select('id, address').eq('company_id', company.id),
        admin.from('cost_centers').select('id, code, name').eq('company_id', company.id),
        admin.from('jobs').select('id, customer_id, cost_center_id, estimated_hours, created_at, updated_at').eq('company_id', company.id),
        admin.from('quotes').select('id, total, status, created_at, updated_at').eq('company_id', company.id),
        admin.from('invoices').select('id, job_id, total, created_at, updated_at').eq('company_id', company.id),
      ])

      const collections = {
        settings,
        customers: (cust.data || []).map(mapCustomer),
        costCenters: (cc.data || []).map(mapCostCenter),
        jobs: (jobs.data || []).map(mapJob),
        quotes: (quotes.data || []).map(mapQuote),
        invoices: (invoices.data || []).map(mapInvoice),
      }

      const installId = `cloud_${company.id}` // stable per-tenant id for idempotent replace
      const rows = computeContributions(collections, { installId, source: 'cloud', country, period })
      if (!rows.length) { processed++; continue }

      // Idempotent replace for this tenant + period + source.
      await admin.from('contributed_metrics').delete()
        .eq('install_id', installId).eq('period', period).eq('source', 'cloud')
      const { error: insErr } = await admin.from('contributed_metrics').insert(rows)
      if (insErr) { results.push({ company: company.id, error: insErr.message }); continue }

      processed++; totalRows += rows.length
    }

    return json({ success: true, period, processed, skipped, totalRows, errors: results })
  } catch (e) {
    return json({ error: 'Internal error: ' + (e as Error).message }, 500)
  }
})
