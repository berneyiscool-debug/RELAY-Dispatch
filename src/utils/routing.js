// ============================================
// RELAY — ROUTING CLIENT (drive times & route order)
// ============================================
// Wraps the `relay-route` Supabase edge function with a short-lived cache.
// Traffic-aware ETAs go stale, so cached results expire after 15 minutes —
// still collapsing the "every dashboard repaint" call pattern into ~4 Google
// calls per hour per route, while optimized-order requests (traffic-unaware)
// are cached for the whole day.
//
// A route result: { legs:[{fromId,toId,durationSec,distanceMeters}],
//                   totalDurationSec, totalDistanceMeters, order:[stopIds] }

import { supabase } from './supabase.js';
import { store } from '../data/store.js';
import { geocodeAddress, getCachedGeo } from './geocode.js';

const CACHE_KEY = 'relay.routeCache.v1';
const ETA_TTL_MS = 15 * 60 * 1000;        // traffic-aware ETAs
const ORDER_TTL_MS = 12 * 60 * 60 * 1000; // optimized order (traffic-unaware)
const inFlight = new Map();

function loadCache() {
  try { return JSON.parse(localStorage.getItem(CACHE_KEY)) || {}; } catch { return {}; }
}
function saveCache(cache) {
  try { localStorage.setItem(CACHE_KEY, JSON.stringify(cache)); } catch (e) { /* degrade to no-cache */ }
}
function cacheKeyFor(origin, stops, roundTrip, optimize) {
  const pt = p => `${p.lat.toFixed(5)},${p.lng.toFixed(5)}`;
  return [pt(origin), stops.map(s => `${s.id}@${pt(s)}`).join('|'), roundTrip ? 'rt' : 'ow', optimize ? 'opt' : 'seq'].join('::');
}

/**
 * Compute a driving route origin → stops (→ origin when roundTrip).
 * origin: {lat,lng} · stops: [{id,lat,lng}] · returns the route result or null on failure.
 */
export async function computeRoute({ origin, stops, roundTrip = true, optimize = false }) {
  if (!origin || !stops?.length) return null;
  const key = cacheKeyFor(origin, stops, roundTrip, optimize);
  const ttl = optimize ? ORDER_TTL_MS : ETA_TTL_MS;

  const cache = loadCache();
  const hit = cache[key];
  if (hit && Date.now() - hit.at < ttl) return hit.result;
  if (inFlight.has(key)) return inFlight.get(key);

  const promise = (async () => {
    try {
      const { data, error } = await supabase.functions.invoke('relay-route', {
        body: { origin, stops, roundTrip, optimize },
      });
      if (error || !data || data.error) {
        console.warn('RELAY route: lookup failed', error || data?.error);
        return null;
      }
      const fresh = loadCache();
      fresh[key] = { at: Date.now(), result: data };
      // Evict stale entries so the cache doesn't grow unbounded
      Object.keys(fresh).forEach(k => { if (Date.now() - fresh[k].at > ORDER_TTL_MS) delete fresh[k]; });
      saveCache(fresh);
      return data;
    } finally {
      inFlight.delete(key);
    }
  })();
  inFlight.set(key, promise);
  return promise;
}

/**
 * The dispatch start/end point for routing.
 * Per-user override (technician profile `startLocation` = {address, geo}) when set,
 * otherwise the company office address — geocoded once and cached.
 * Returns { lat, lng, label, source: 'user'|'company' } or null if nothing resolvable.
 */
export async function getStartLocation() {
  const currentUser = JSON.parse(localStorage.getItem('currentUser') || 'null');

  // 1. Per-user override, stored on the user's profile record
  if (currentUser?.id) {
    const me = store.getById('technicians', currentUser.id);
    const sl = me?.startLocation;
    if (sl?.geo?.lat !== undefined) {
      return { lat: sl.geo.lat, lng: sl.geo.lng, label: sl.address || 'My start location', source: 'user' };
    }
    if (sl?.address) {
      const geo = getCachedGeo(sl.address) || await geocodeAddress(sl.address);
      if (geo) return { lat: geo.lat, lng: geo.lng, label: sl.address, source: 'user' };
    }
  }

  // 2. Company office (default)
  const settings = store.getSettings();
  if (settings?.address) {
    const geo = getCachedGeo(settings.address) || await geocodeAddress(settings.address);
    if (geo) return { lat: geo.lat, lng: geo.lng, label: settings.address, source: 'company' };
  }
  return null;
}

/** Free (no API cost) Google Maps directions deep-link for a set of addresses. */
export function navigateUrl(addresses) {
  const parts = (addresses || []).filter(Boolean).map(a => encodeURIComponent(a));
  if (!parts.length) return null;
  const destination = parts[parts.length - 1];
  const waypoints = parts.slice(0, -1).join('|');
  return `https://www.google.com/maps/dir/?api=1&destination=${destination}${waypoints ? `&waypoints=${waypoints}` : ''}`;
}

/** "1h 25m" / "12m" formatting for leg + total durations. */
export function fmtDuration(sec) {
  if (!sec && sec !== 0) return '—';
  const m = Math.round(sec / 60);
  if (m < 60) return `${m}m`;
  return `${Math.floor(m / 60)}h ${String(m % 60).padStart(2, '0')}m`;
}
