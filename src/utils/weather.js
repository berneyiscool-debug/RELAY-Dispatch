// ============================================
// RELAY — WEATHER CLIENT (v1.3 #4)
// ============================================
// Forecasts for the dispatch office and job sites. Uses Open-Meteo (free, keyless,
// CORS-enabled, strong AU coverage) so it's testable in the dev env with zero
// setup. Cached 1h per lat/lng+day — a town's forecast changes hourly, not per
// request. Flag-gated (FLAGS.weather), so it's dark in packaged builds.
//
// Production note: before v1.3.0 ships this moves behind a `relay-weather` edge
// function on Google's Weather API (commercial licence + Google billing). The
// normalized shape below is the contract, so swapping the provider won't touch
// the widgets/Deputy that consume it.
//
// Forecast shape:
//   { source, current: {tempC, feelsLikeC, code, text, icon, emoji, windKph,
//                        humidity, precipMm},
//     daily: [{ date, minC, maxC, code, text, icon, emoji, precipProb }] }

import { getStartLocation } from './routing.js';

const CACHE_KEY = 'relay.weatherCache.v1';
const TTL_MS = 60 * 60 * 1000; // 1h
const inFlight = new Map();

// WMO weather-code → human text + Material icon + emoji (severe flag drives warnings)
const WMO = {
  0:  { text: 'Clear',            icon: 'clear_day',      emoji: '☀️' },
  1:  { text: 'Mainly clear',     icon: 'clear_day',      emoji: '🌤️' },
  2:  { text: 'Partly cloudy',    icon: 'partly_cloudy_day', emoji: '⛅' },
  3:  { text: 'Overcast',         icon: 'cloud',          emoji: '☁️' },
  45: { text: 'Fog',              icon: 'foggy',          emoji: '🌫️' },
  48: { text: 'Rime fog',         icon: 'foggy',          emoji: '🌫️' },
  51: { text: 'Light drizzle',    icon: 'rainy',          emoji: '🌦️' },
  53: { text: 'Drizzle',          icon: 'rainy',          emoji: '🌦️' },
  55: { text: 'Heavy drizzle',    icon: 'rainy',          emoji: '🌧️' },
  56: { text: 'Freezing drizzle', icon: 'rainy',          emoji: '🌧️' },
  57: { text: 'Freezing drizzle', icon: 'rainy',          emoji: '🌧️' },
  61: { text: 'Light rain',       icon: 'rainy',          emoji: '🌦️' },
  63: { text: 'Rain',             icon: 'rainy',          emoji: '🌧️' },
  65: { text: 'Heavy rain',       icon: 'rainy',          emoji: '🌧️', severe: true },
  66: { text: 'Freezing rain',    icon: 'rainy',          emoji: '🌧️', severe: true },
  67: { text: 'Freezing rain',    icon: 'rainy',          emoji: '🌧️', severe: true },
  71: { text: 'Light snow',       icon: 'ac_unit',        emoji: '🌨️' },
  73: { text: 'Snow',             icon: 'ac_unit',        emoji: '🌨️' },
  75: { text: 'Heavy snow',       icon: 'ac_unit',        emoji: '❄️', severe: true },
  77: { text: 'Snow grains',      icon: 'ac_unit',        emoji: '🌨️' },
  80: { text: 'Light showers',    icon: 'rainy',          emoji: '🌦️' },
  81: { text: 'Showers',          icon: 'rainy',          emoji: '🌧️' },
  82: { text: 'Violent showers',  icon: 'rainy',          emoji: '⛈️', severe: true },
  85: { text: 'Snow showers',     icon: 'ac_unit',        emoji: '🌨️' },
  86: { text: 'Snow showers',     icon: 'ac_unit',        emoji: '❄️', severe: true },
  95: { text: 'Thunderstorm',     icon: 'thunderstorm',   emoji: '⛈️', severe: true },
  96: { text: 'Storm + hail',     icon: 'thunderstorm',   emoji: '⛈️', severe: true },
  99: { text: 'Storm + hail',     icon: 'thunderstorm',   emoji: '⛈️', severe: true },
};

export function wmoInfo(code) {
  return WMO[code] || { text: 'Unknown', icon: 'help', emoji: '❓' };
}

// True when a code represents genuinely hazardous conditions (drives warning badges).
export function isSevereCode(code) {
  return !!(WMO[code] && WMO[code].severe);
}

function loadCache() {
  try { return JSON.parse(localStorage.getItem(CACHE_KEY)) || {}; } catch { return {}; }
}
function saveCache(c) {
  try { localStorage.setItem(CACHE_KEY, JSON.stringify(c)); } catch { /* degrade to no-cache */ }
}
function keyFor(lat, lng, days) {
  return `${lat.toFixed(3)},${lng.toFixed(3)}:${days}`;
}

function normalize(data) {
  const cur = data.current || {};
  const curCode = cur.weather_code;
  const curInfo = wmoInfo(curCode);
  const d = data.daily || {};
  const days = (d.time || []).map((date, i) => {
    const code = d.weather_code?.[i];
    const info = wmoInfo(code);
    return {
      date,
      minC: Math.round(d.temperature_2m_min?.[i]),
      maxC: Math.round(d.temperature_2m_max?.[i]),
      code, text: info.text, icon: info.icon, emoji: info.emoji,
      severe: !!info.severe,
      precipProb: d.precipitation_probability_max?.[i] ?? null,
    };
  });
  return {
    source: 'open-meteo',
    current: {
      tempC: Math.round(cur.temperature_2m),
      feelsLikeC: Math.round(cur.apparent_temperature),
      code: curCode, text: curInfo.text, icon: curInfo.icon, emoji: curInfo.emoji,
      severe: !!curInfo.severe,
      windKph: Math.round(cur.wind_speed_10m),
      humidity: cur.relative_humidity_2m ?? null,
      precipMm: cur.precipitation ?? null,
    },
    daily: days,
  };
}

/**
 * Forecast for a lat/lng. `days` = number of daily entries (incl. today).
 * Returns the normalized shape or null on failure. Cached 1h.
 */
export async function getForecast({ lat, lng, days = 7 } = {}) {
  if (typeof lat !== 'number' || typeof lng !== 'number') return null;
  const key = keyFor(lat, lng, days);

  const cache = loadCache();
  const hit = cache[key];
  if (hit && Date.now() - hit.at < TTL_MS) return hit.result;
  if (inFlight.has(key)) return inFlight.get(key);

  const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lng}`
    + `&current=temperature_2m,apparent_temperature,weather_code,wind_speed_10m,relative_humidity_2m,precipitation`
    + `&daily=weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max`
    + `&timezone=auto&forecast_days=${days}&wind_speed_unit=kmh`;

  const promise = (async () => {
    try {
      const res = await fetch(url);
      if (!res.ok) { console.warn('RELAY weather: HTTP', res.status); return null; }
      const data = await res.json();
      const result = normalize(data);
      const fresh = loadCache();
      fresh[key] = { at: Date.now(), result };
      Object.keys(fresh).forEach(k => { if (Date.now() - fresh[k].at > TTL_MS) delete fresh[k]; });
      saveCache(fresh);
      return result;
    } catch (e) {
      console.warn('RELAY weather: lookup failed', e);
      return null;
    } finally {
      inFlight.delete(key);
    }
  })();
  inFlight.set(key, promise);
  return promise;
}

/** Forecast for the dispatch office (or per-user start location). */
export async function getOfficeForecast(days = 7) {
  const start = await getStartLocation();
  if (!start) return null;
  const fc = await getForecast({ lat: start.lat, lng: start.lng, days });
  return fc ? { ...fc, label: start.label } : null;
}

/** Short weekday label, e.g. "Mon". Today → "Today". */
export function dayLabel(dateStr) {
  const d = new Date(dateStr + 'T00:00:00');
  const today = new Date(); today.setHours(0, 0, 0, 0);
  if (d.getTime() === today.getTime()) return 'Today';
  return d.toLocaleDateString('en-AU', { weekday: 'short' });
}
