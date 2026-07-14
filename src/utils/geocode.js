// ============================================
// RELAY — GEOCODING CLIENT
// ============================================
// Wraps the `relay-geocode` Supabase edge function with a persistent cache so
// each unique address is only ever billed to Google once. Addresses in RELAY
// almost never change, so in practice this collapses map/geocode call volume to
// roughly one Google call per new address — keeping usage far under the free
// monthly cap and making coordinates available offline once fetched.
//
// A geo record is: { lat, lng, formattedAddress, placeId, partialMatch, geocodedAt }

import { supabase } from './supabase.js';

const CACHE_KEY = 'relay.geocodeCache.v1';
const inFlight = new Map(); // normalizedAddress -> Promise, dedupes concurrent lookups

// Normalise so trivial formatting differences ("14 Industrial Lane, Dubbo NSW 2830"
// vs "14 industrial lane,  dubbo  nsw 2830") share one cache entry / one billed call.
export function normalizeAddress(address) {
  return (address || '')
    .toLowerCase()
    .replace(/[.,]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function loadCache() {
  try {
    return JSON.parse(localStorage.getItem(CACHE_KEY)) || {};
  } catch {
    return {};
  }
}

function saveCache(cache) {
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify(cache));
  } catch (err) {
    // localStorage full or unavailable — degrade to no-cache rather than throwing.
    console.warn('RELAY geocode: could not persist cache', err);
  }
}

/** Synchronous cache peek — returns a geo record or null without any network call. */
export function getCachedGeo(address) {
  const key = normalizeAddress(address);
  if (!key) return null;
  return loadCache()[key] || null;
}

/**
 * Seed the cache with coordinates obtained elsewhere (e.g. Places Autocomplete
 * returns geometry with the selected address). This lets the store's geo hooks
 * persist them without spending a separate Geocoding call.
 */
export function setCachedGeo(address, geo) {
  const key = normalizeAddress(address);
  if (!key || !geo) return;
  const cache = loadCache();
  cache[key] = { ...geo, geocodedAt: geo.geocodedAt || new Date().toISOString() };
  saveCache(cache);
}

/**
 * Resolve an address to a geo record, using the cache first.
 * @param {string} address
 * @param {{ force?: boolean }} [opts] force=true bypasses the cache (e.g. re-verify a partial match).
 * @returns {Promise<object|null>} geo record, or null if unresolved / offline with no cache hit.
 */
export async function geocodeAddress(address, opts = {}) {
  const key = normalizeAddress(address);
  if (!key) return null;

  const cache = loadCache();
  if (!opts.force && cache[key]) return cache[key];

  // Offline and not cached — nothing we can do now; caller can retry when online.
  if (typeof navigator !== 'undefined' && navigator.onLine === false) return null;

  if (inFlight.has(key)) return inFlight.get(key);

  const promise = (async () => {
    try {
      const { data, error } = await supabase.functions.invoke('relay-geocode', {
        body: { address },
      });
      if (error) throw error;
      if (!data || !data.result) return null;

      const geo = { ...data.result, geocodedAt: new Date().toISOString() };
      const fresh = loadCache();
      fresh[key] = geo;
      saveCache(fresh);
      return geo;
    } catch (err) {
      console.warn('RELAY geocode failed:', err?.message || err);
      return null;
    } finally {
      inFlight.delete(key);
    }
  })();

  inFlight.set(key, promise);
  return promise;
}

/**
 * Batch-geocode many addresses in one edge-function round trip (for backfilling
 * existing records). Cached addresses are served locally; only misses are sent
 * to Google. Returns a Map of original-address -> geo record (or null).
 * @param {string[]} addresses
 * @returns {Promise<Map<string, object|null>>}
 */
export async function geocodeBatch(addresses) {
  const out = new Map();
  const cache = loadCache();
  const misses = [];

  for (const addr of addresses) {
    const key = normalizeAddress(addr);
    if (!key) { out.set(addr, null); continue; }
    if (cache[key]) { out.set(addr, cache[key]); continue; }
    misses.push(addr);
  }

  if (misses.length === 0) return out;
  if (typeof navigator !== 'undefined' && navigator.onLine === false) {
    for (const addr of misses) out.set(addr, null);
    return out;
  }

  try {
    const { data, error } = await supabase.functions.invoke('relay-geocode', {
      body: { addresses: misses },
    });
    if (error) throw error;

    const results = data?.results || [];
    const fresh = loadCache();
    misses.forEach((addr, i) => {
      const r = results[i];
      if (r) {
        const geo = { ...r, geocodedAt: new Date().toISOString() };
        fresh[normalizeAddress(addr)] = geo;
        out.set(addr, geo);
      } else {
        out.set(addr, null);
      }
    });
    saveCache(fresh);
  } catch (err) {
    console.warn('RELAY geocode batch failed:', err?.message || err);
    for (const addr of misses) out.set(addr, null);
  }

  return out;
}
