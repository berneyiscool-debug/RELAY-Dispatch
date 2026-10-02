import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

// ============================================
// RELAY — GEOCODE PROXY (Google Maps Geocoding API)
// ============================================
// Keeps GOOGLE_MAPS_API_KEY server-side. Accepts a single address or a
// batch of addresses (for backfilling existing records in one round trip),
// biased to Australia. Returns normalised coordinates or null per address.
//
// Authentication: requires a signed-in RELAY user (Bearer JWT). Without it the
// endpoint is an open billing proxy for the shared Google Maps quota.
//
// Request body:
//   { "address": "14 Industrial Lane, Dubbo NSW 2830" }
//   { "addresses": ["addr a", "addr b", ...] }   // max 50 per call
//
// Response:
//   { "result":  { lat, lng, formattedAddress, placeId, partialMatch } | null }
//   { "results": [ ... same shape, index-aligned with input ... ] }

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const MAX_BATCH = 50

interface GeoResult {
  lat: number
  lng: number
  formattedAddress: string
  placeId: string
  partialMatch: boolean
}

async function geocodeOne(address: string, apiKey: string): Promise<GeoResult | null> {
  const trimmed = (address || '').trim()
  if (!trimmed) return null

  const url = new URL('https://maps.googleapis.com/maps/api/geocode/json')
  url.searchParams.set('address', trimmed)
  url.searchParams.set('key', apiKey)
  // Bias results toward Australia. `region` is a soft bias; `components` is a
  // hard filter that prevents matching same-named streets on other continents.
  url.searchParams.set('region', 'au')
  url.searchParams.set('components', 'country:AU')

  const res = await fetch(url.toString())
  if (!res.ok) {
    throw new Error(`Google Geocoding HTTP ${res.status}`)
  }
  const data = await res.json()

  if (data.status === 'ZERO_RESULTS') return null
  if (data.status !== 'OK') {
    // OVER_QUERY_LIMIT / REQUEST_DENIED / INVALID_REQUEST bubble up so the
    // client can distinguish "no match" (null) from "something is wrong".
    throw new Error(`Google Geocoding status ${data.status}: ${data.error_message || ''}`)
  }

  const top = data.results?.[0]
  if (!top) return null

  return {
    lat: top.geometry.location.lat,
    lng: top.geometry.location.lng,
    formattedAddress: top.formatted_address,
    placeId: top.place_id,
    partialMatch: Boolean(top.partial_match),
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // ── Authenticate the caller ────────────────────────────────────────
    const supabaseUrl = Deno.env.get('SUPABASE_URL')
    const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
    if (!supabaseUrl || !serviceKey) {
      return new Response(
        JSON.stringify({ error: 'Server configuration error.' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const authHeader = req.headers.get('Authorization') || ''
    if (!authHeader.startsWith('Bearer ')) {
      return new Response(JSON.stringify({ error: 'Unauthorized: missing token' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    }

    const admin = createClient(supabaseUrl, serviceKey)
    const { data: { user }, error: authErr } = await admin.auth.getUser(authHeader.substring(7))
    if (authErr || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized: invalid token' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    }

    // ── Per-tenant daily cap ───────────────────────────────────────────
    // Google Maps quota is shared by every tenant, so no single account may
    // drain it. Spend is ledgered in public.api_usage (migration 031).
    const dailyCap = Number(Deno.env.get('RELAY_GEOCODE_DAILY_CAP') || '1000') || 1000
    const { data: profile, error: profErr } = await admin
      .from('profiles').select('company_id').eq('id', user.id).single()
    if (profErr || !profile?.company_id) {
      return new Response(JSON.stringify({ error: 'No company is linked to this user' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    }

    const apiKey = Deno.env.get('GOOGLE_MAPS_API_KEY')
    if (!apiKey) {
      return new Response(
        JSON.stringify({ error: 'GOOGLE_MAPS_API_KEY is not set on Supabase.' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const body = await req.json()
    const { address, addresses } = body

    // One unit per address, so a 50-address backfill batch costs 50.
    const units = Array.isArray(addresses) ? addresses.length : 1
    if ((await spentToday(admin, profile.company_id, 'geocode')) + units > dailyCap) {
      return new Response(
        JSON.stringify({ error: `Daily geocoding limit reached (${dailyCap} addresses). Try again tomorrow or contact RELAY support.` }),
        { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    }

    // Batch mode -------------------------------------------------------------
    if (Array.isArray(addresses)) {
      if (addresses.length > MAX_BATCH) {
        return new Response(
          JSON.stringify({ error: `Batch limit is ${MAX_BATCH} addresses per call.` }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }
      // Run sequentially to stay well under Google's per-second QPS limits and
      // avoid a burst that could trip rate limiting on large backfills.
      const results: (GeoResult | null)[] = []
      for (const a of addresses) {
        results.push(await geocodeOne(a, apiKey))
      }
      await recordUsage(admin, profile.company_id, 'geocode', units)
      return new Response(
        JSON.stringify({ results }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Single mode ------------------------------------------------------------
    const result = await geocodeOne(address, apiKey)
    await recordUsage(admin, profile.company_id, 'geocode', units)
    return new Response(
      JSON.stringify({ result }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : String(error) }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})

/** Units already spent by one tenant today (UTC). */
async function spentToday(admin: any, companyId: string, kind: string) {
  const since = new Date()
  since.setUTCHours(0, 0, 0, 0)
  const { data, error } = await admin
    .from('api_usage')
    .select('units')
    .eq('company_id', companyId)
    .eq('kind', kind)
    .gte('created_at', since.toISOString())
  if (error) {
    // Migration 031 not applied yet: stay uncapped rather than break every user.
    console.error('api_usage read failed:', error.message)
    return 0
  }
  return (data || []).reduce((sum: number, row: any) => sum + (row.units || 0), 0)
}

/** Ledger write. Never fails the caller's request. */
async function recordUsage(admin: any, companyId: string, kind: string, units: number) {
  if (!(units > 0)) return
  try {
    const { error } = await admin.from('api_usage').insert({ company_id: companyId, kind, units })
    if (error) console.error('api_usage write failed:', error.message)
  } catch (err) {
    console.error('api_usage write threw:', err)
  }
}
