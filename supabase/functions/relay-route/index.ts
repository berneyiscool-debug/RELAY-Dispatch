import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

// ============================================
// RELAY — ROUTE PROXY (Google Routes API v2)
// ============================================
// Keeps GOOGLE_MAPS_API_KEY server-side. Computes a driving route
// start → stop 1 → stop 2 → … [→ back to start], optionally letting Google
// pick the best stop order. Used by dispatch (Today's Schedule / Schedule
// route view) and Deputy.
//
// Request body:
//   {
//     "origin":    { "lat": -32.24, "lng": 148.60 },
//     "stops":     [ { "id": "job_1", "lat": ..., "lng": ... }, ... ],  // 1..25
//     "roundTrip": true,        // default true: return to origin
//     "optimize":  false        // true: let Google reorder the stops
//   }
//
// Response:
//   {
//     "legs": [ { "fromId": "origin"|stopId, "toId": stopId|"origin",
//                 "durationSec": 812, "distanceMeters": 10432 }, ... ],
//     "totalDurationSec": 4290,
//     "totalDistanceMeters": 51200,
//     "order": ["job_3", "job_1", "job_2"]   // stop ids in travel order
//   }

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const MAX_STOPS = 25

interface Stop { id: string; lat: number; lng: number }

function loc(p: { lat: number; lng: number }) {
  return { location: { latLng: { latitude: p.lat, longitude: p.lng } } }
}

async function computeRoute(origin: Stop, stops: Stop[], roundTrip: boolean, optimize: boolean, apiKey: string) {
  const destination = roundTrip ? origin : stops[stops.length - 1]
  const intermediates = roundTrip ? stops : stops.slice(0, -1)

  const body: Record<string, unknown> = {
    origin: loc(origin),
    destination: loc(destination),
    intermediates: intermediates.map(loc),
    travelMode: 'DRIVE',
    // Waypoint optimization is not supported with TRAFFIC_AWARE routing, so we
    // trade live-traffic ETAs for optimization when asked to reorder stops.
    routingPreference: optimize ? 'TRAFFIC_UNAWARE' : 'TRAFFIC_AWARE',
    optimizeWaypointOrder: optimize,
  }
  if (!optimize) {
    // TRAFFIC_AWARE needs a departure time in the future
    body.departureTime = new Date(Date.now() + 60_000).toISOString()
  }

  const res = await fetch('https://routes.googleapis.com/directions/v2:computeRoutes', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Goog-Api-Key': apiKey,
      'X-Goog-FieldMask': [
        'routes.duration',
        'routes.distanceMeters',
        'routes.legs.duration',
        'routes.legs.distanceMeters',
        'routes.optimizedIntermediateWaypointIndex',
      ].join(','),
    },
    body: JSON.stringify(body),
  })

  const data = await res.json()
  if (!res.ok) {
    throw new Error(`Google Routes HTTP ${res.status}: ${data?.error?.message || JSON.stringify(data).slice(0, 200)}`)
  }
  const route = data.routes?.[0]
  if (!route) throw new Error('Google Routes returned no route')

  // Waypoint order: optimizedIntermediateWaypointIndex indexes into `intermediates`
  const idxOrder: number[] = route.optimizedIntermediateWaypointIndex
    ?? intermediates.map((_: unknown, i: number) => i)
  const orderedIntermediates = idxOrder.map(i => intermediates[i])
  const orderedStops = roundTrip ? orderedIntermediates : [...orderedIntermediates, stops[stops.length - 1]]

  // Legs run origin → first stop → … → destination, in optimized order
  const pointIds = ['origin', ...orderedStops.map(s => s.id), ...(roundTrip ? ['origin'] : [])]
  const parseSec = (d: string | undefined) => d ? parseInt(String(d).replace('s', ''), 10) || 0 : 0
  const legs = (route.legs || []).map((leg: { duration?: string; distanceMeters?: number }, i: number) => ({
    fromId: pointIds[i],
    toId: pointIds[i + 1],
    durationSec: parseSec(leg.duration),
    distanceMeters: leg.distanceMeters || 0,
  }))

  return {
    legs,
    totalDurationSec: parseSec(route.duration),
    totalDistanceMeters: route.distanceMeters || 0,
    order: orderedStops.map(s => s.id),
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const apiKey = Deno.env.get('GOOGLE_MAPS_API_KEY')
    if (!apiKey) throw new Error('GOOGLE_MAPS_API_KEY is not configured')

    const { origin, stops, roundTrip = true, optimize = false } = await req.json()

    if (!origin || typeof origin.lat !== 'number' || typeof origin.lng !== 'number') {
      return new Response(JSON.stringify({ error: 'origin {lat,lng} is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    }
    const validStops: Stop[] = (Array.isArray(stops) ? stops : [])
      .filter((s: Stop) => s && typeof s.lat === 'number' && typeof s.lng === 'number')
    if (validStops.length === 0 || validStops.length > MAX_STOPS) {
      return new Response(JSON.stringify({ error: `stops must contain 1..${MAX_STOPS} entries with {id,lat,lng}` }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    }

    const result = await computeRoute({ id: 'origin', ...origin }, validStops, !!roundTrip, !!optimize, apiKey)
    return new Response(JSON.stringify(result),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
  } catch (err) {
    console.error('relay-route error:', err)
    return new Response(JSON.stringify({ error: String(err?.message || err) }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
  }
})
