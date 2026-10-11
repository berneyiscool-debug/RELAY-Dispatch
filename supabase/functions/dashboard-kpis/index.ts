import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { computeAll, kpiNeeds, PERIODS, DEFAULT_PERIOD } from './kpis.js'
import { KPI_TABLES, normalizeRows, wallClockDate, isValidTimeZone } from './rows.js'
import { allowedKpiIds } from './access.js'

// ============================================
// RELAY — DASHBOARD KPIs (cloud accounts)
// ============================================
// Calculates the dashboard's KPI cards for a cloud company from Postgres, using
// the same formulas the app runs for local accounts (kpis.js), so the numbers
// cover the whole team and match on every device.
//
// Authentication: a signed-in RELAY user (Bearer JWT). Rows are read with the
// service key but always filtered to the caller's company, and each card is
// only served if the caller's permissions allow it.
//
// Request body:
//   {
//     "ids":      ["overdue", "revenue_invoiced", ...],  // card ids (kpis.js)
//     "period":   "month",          // today | week | month | quarter | fy
//     "timeZone": "Australia/Sydney", // the business's zone, for day boundaries
//     "refresh":  false             // true after a save: skip the 5-minute cache
//   }
//
// Response:
//   { "results": { [id]: { empty, value, prev, delta, good, extra } },
//     "period": "month", "timeZone": "Australia/Sydney",
//     "asOf": "2026-10-08T00:12:03.000Z", "cached": false }

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), {
  status, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
})

const CACHE_MS = 5 * 60 * 1000
const PAGE = 1000
const MAX_ROWS = 50000 // per table; far beyond any small business, stops a runaway read
const DEFAULT_TZ = 'Australia/Sydney'

// Per-instance cache: company + period + zone + cards → last payload.
const cache = new Map<string, { at: number; payload: Record<string, unknown> }>()

// deno-lint-ignore no-explicit-any
async function loadTable(admin: any, companyId: string, collection: string) {
  const { table, columns } = (KPI_TABLES as Record<string, { table: string; columns: string }>)[collection]
  const rows: unknown[] = []
  for (let from = 0; from < MAX_ROWS; from += PAGE) {
    const { data, error } = await admin.from(table).select(columns)
      .eq('company_id', companyId).order('id').range(from, from + PAGE - 1)
    if (error) throw new Error(`${table}: ${error.message}`)
    rows.push(...(data || []))
    if (!data || data.length < PAGE) break
  }
  return rows
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })
  if (req.method !== 'POST') return json({ error: 'Method not allowed' }, 405)

  try {
    const admin = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!)

    const authHeader = req.headers.get('Authorization') || ''
    if (!authHeader.startsWith('Bearer ')) return json({ error: 'Unauthorized: missing token' }, 401)
    const { data: { user }, error: authErr } = await admin.auth.getUser(authHeader.substring(7))
    if (authErr || !user) return json({ error: 'Unauthorized: invalid token' }, 401)

    const { data: profile, error: profErr } = await admin
      .from('profiles').select('company_id, role, user_type_id, deactivated').eq('id', user.id).single()
    if (profErr || !profile?.company_id) return json({ error: 'No company is linked to this user' }, 403)
    if (profile.deactivated) return json({ error: 'This account is deactivated' }, 403)
    const companyId = profile.company_id as string

    const body = await req.json().catch(() => ({}))
    const requested: string[] = Array.isArray(body.ids) ? body.ids.filter((x: unknown) => typeof x === 'string').slice(0, 64) : []
    const period = PERIODS.some((p: { id: string }) => p.id === body.period) ? body.period : DEFAULT_PERIOD
    const timeZone = isValidTimeZone(body.timeZone) ? body.timeZone : DEFAULT_TZ
    if (!requested.length) return json({ results: {}, period, timeZone, asOf: new Date().toISOString(), cached: false })

    let userType = null
    if (profile.user_type_id) {
      const { data } = await admin.from('user_types').select('permissions')
        .eq('id', profile.user_type_id).eq('company_id', companyId).maybeSingle()
      userType = data
    }

    // Staff count decides team-only cards, so the team is always loaded.
    const technicians = normalizeRows('technicians', await loadTable(admin, companyId, 'technicians'))
    const staffCount = technicians.filter((t: { deactivated?: boolean; role?: string }) => !t.deactivated && t.role !== 'customer').length
    const ids = allowedKpiIds(requested, profile, userType, { staffCount })

    // The business's "now", as wall-clock time: also part of the cache key, so a
    // cached answer never outlives the day it was calculated for.
    const now = wallClockDate(new Date(), timeZone)
    const key = [companyId, period, timeZone, now.toDateString(), [...ids].sort().join(',')].join('|')
    const hit = cache.get(key)
    if (!body.refresh && hit && Date.now() - hit.at < CACHE_MS) return json({ ...hit.payload, cached: true })

    const data: Record<string, unknown[]> = { technicians }
    for (const coll of kpiNeeds(ids)) {
      if (coll === 'technicians') continue
      data[coll] = normalizeRows(coll, await loadTable(admin, companyId, coll), timeZone)
    }

    const payload = {
      results: computeAll(ids, data, { period, now }),
      period, timeZone,
      asOf: new Date().toISOString(),
    }
    cache.set(key, { at: Date.now(), payload })
    if (cache.size > 500) cache.delete(cache.keys().next().value)
    return json({ ...payload, cached: false })
  } catch (err) {
    console.error('dashboard-kpis error:', err)
    return json({ error: 'Could not calculate the dashboard figures' }, 500)
  }
})
