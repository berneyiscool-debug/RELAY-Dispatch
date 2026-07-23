// ============================================
// RELAY — DEPUTY WEATHER CAPABILITY (v1.3 #4)
// ============================================
// Lets Deputy answer weather questions grounded in real forecast data: "will it
// rain at the Newcastle job tomorrow?", "what's the weather at the office today?".
// The LLM emits a [ACTION: WEATHER_LOOKUP, {...}] tag; we fetch the real forecast
// here and feed it back so Deputy phrases the answer (same two-phase pattern as
// deputyMaps). Fails soft into a plain-text note rather than throwing.

import { store } from '../data/store.js';
import { getForecast } from './weather.js';
import { getStartLocation } from './routing.js';
import { getCachedGeo, geocodeAddress } from './geocode.js';

const WEATHER_ACTIONS = new Set(['WEATHER_LOOKUP']);

export function hasWeatherAction(reply) {
  const regex = /\[ACTION:\s*([A-Z_]+)/gi;
  let m;
  while ((m = regex.exec(reply)) !== null) {
    if (WEATHER_ACTIONS.has(m[1].toUpperCase())) return true;
  }
  return false;
}

export async function runWeatherActions(reply) {
  const regex = /\[ACTION:\s*([A-Z_]+)(?:\s*,\s*(\{.*?\}|[^\]]+))?\]/gis;
  const results = [];
  let m;
  while ((m = regex.exec(reply)) !== null) {
    if (!WEATHER_ACTIONS.has(m[1].toUpperCase())) continue;
    const json = parseJson(m[2]);
    try {
      results.push(await weatherLookup(json || {}));
    } catch (err) {
      console.error('Deputy weather action failed:', err);
      results.push(`Weather lookup failed (${err.message || err}).`);
    }
  }
  return results.length ? results.join('\n\n') : null;
}

function parseJson(raw) {
  if (!raw) return null;
  const t = raw.trim();
  if (t.startsWith('{') && t.endsWith('}')) { try { return JSON.parse(t); } catch { return null; } }
  return null;
}

function ymd(d) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}
function resolveDate(input) {
  const now = new Date();
  if (!input) return ymd(now);
  const t = String(input).trim().toLowerCase();
  if (t === 'today') return ymd(now);
  if (t === 'tomorrow') { const d = new Date(now); d.setDate(d.getDate() + 1); return ymd(d); }
  if (/^\d{4}-\d{2}-\d{2}$/.test(t)) return t;
  const parsed = new Date(input);
  return isNaN(parsed) ? ymd(now) : ymd(parsed);
}

async function geoFor(address) {
  if (!address) return null;
  return getCachedGeo(address) || await geocodeAddress(address).catch(() => null);
}

// Resolve a token (office / job # / customer name / literal address) → {lat,lng,label}
async function resolveLocation(token) {
  const raw = String(token || '').trim();
  const t = raw.toLowerCase();

  if (!raw || ['office', 'base', 'depot', 'hq', 'the office', 'company'].includes(t)) {
    const start = await getStartLocation();
    return start ? { lat: start.lat, lng: start.lng, label: start.label } : null;
  }

  const jobNum = raw.match(/#?\s*(\d{3,})/);
  if (jobNum) {
    const job = (store.getAll('jobs') || []).find(j => String(j.number) === jobNum[1] || j.id === jobNum[1]);
    if (job?.siteAddress) {
      const geo = job.geo || await geoFor(job.siteAddress);
      if (geo) return { lat: geo.lat, lng: geo.lng, label: `Job #${job.number} — ${job.siteAddress}` };
    }
  }

  const cust = (store.getAll('customers') || []).find(c => {
    const full = `${c.first_name || ''} ${c.last_name || ''}`.trim().toLowerCase();
    return (full && full === t) || (c.company && c.company.toLowerCase() === t);
  });
  if (cust?.address) {
    const geo = cust.geo || await geoFor(cust.address);
    if (geo) return { lat: geo.lat, lng: geo.lng, label: `${cust.company || `${cust.first_name || ''} ${cust.last_name || ''}`.trim()} — ${cust.address}` };
  }

  const geo = await geoFor(raw);
  return geo ? { lat: geo.lat, lng: geo.lng, label: raw } : null;
}

// WEATHER_LOOKUP { location?, date? }
async function weatherLookup({ location, date } = {}) {
  const day = resolveDate(date);
  const loc = await resolveLocation(location);
  if (!loc) return `WEATHER_LOOKUP: Couldn't locate "${location || 'the office'}"${location ? '' : ' — set a company office address'}.`;

  const fc = await getForecast({ lat: loc.lat, lng: loc.lng, days: 7 });
  if (!fc) return `WEATHER_LOOKUP: The forecast service was unavailable just now.`;

  const today = ymd(new Date());
  if (day === today) {
    const c = fc.current;
    const todayDaily = fc.daily.find(d => d.date === today);
    const hiLo = todayDaily ? ` High ${todayDaily.maxC}° / low ${todayDaily.minC}°.` : '';
    const rain = todayDaily && todayDaily.precipProb != null ? ` Rain chance ${todayDaily.precipProb}%.` : '';
    return `WEATHER_LOOKUP for ${loc.label} today: ${c.text}, ${c.tempC}° (feels ${c.feelsLikeC}°), wind ${c.windKph} km/h.${hiLo}${rain}${c.severe ? ' ⚠️ Severe conditions now.' : ''}`;
  }

  const d = fc.daily.find(x => x.date === day);
  if (!d) return `WEATHER_LOOKUP for ${loc.label}: I only have a 7-day forecast, and ${day} is outside it.`;
  const rain = d.precipProb != null ? ` Rain chance ${d.precipProb}%.` : '';
  return `WEATHER_LOOKUP for ${loc.label} on ${day}: ${d.text}, high ${d.maxC}° / low ${d.minC}°.${rain}${d.severe ? ' ⚠️ Severe conditions expected.' : ''}`;
}
