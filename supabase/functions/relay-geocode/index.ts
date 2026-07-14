import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

// ============================================
// RELAY — GEOCODE PROXY (Google Maps Geocoding API)
// ============================================
// Keeps GOOGLE_MAPS_API_KEY server-side. Accepts a single address or a
// batch of addresses (for backfilling existing records in one round trip),
// biased to Australia. Returns normalised coordinates or null per address.
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
    const apiKey = Deno.env.get('GOOGLE_MAPS_API_KEY')
    if (!apiKey) {
      return new Response(
        JSON.stringify({ error: 'GOOGLE_MAPS_API_KEY is not set on Supabase.' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const body = await req.json()
    const { address, addresses } = body

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
      return new Response(
        JSON.stringify({ results }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Single mode ------------------------------------------------------------
    const result = await geocodeOne(address, apiKey)
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
