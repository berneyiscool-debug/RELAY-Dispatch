// ============================================
// RELAY — DEPUTY MAPS CAPABILITY
// ============================================
// Gives the Deputy assistant real routing answers: best visit order + ETAs for a
// technician's day, and point-to-point drive times. The LLM can't do this on its
// own — it emits a [ACTION: ROUTE_PLAN|DRIVE_TIME, {...}] tag, we compute the real
// numbers here (geocode + `relay-route` edge function), then feed the result back
// so Deputy phrases the final answer. See RelayAssistant.callAIEngine.
//
// Everything fails soft: if a location can't be geocoded or the route service is
// down, we return a plain-text note the LLM can relay rather than throwing.

import { store } from '../data/store.js';
import { computeRoute, getStartLocation, fmtDuration } from './routing.js';
import { getCachedGeo, geocodeAddress } from './geocode.js';

// Maps action tags Deputy is allowed to emit (advertised only when the flag is on).
const MAPS_ACTIONS = new Set(['ROUTE_PLAN', 'DRIVE_TIME']);

/** True if a reply contains at least one maps action tag we should handle async. */
export function hasMapsAction(reply) {
  const regex = /\[ACTION:\s*([A-Z_]+)/gi;
  let m;
  while ((m = regex.exec(reply)) !== null) {
    if (MAPS_ACTIONS.has(m[1].toUpperCase())) return true;
  }
  return false;
}

/**
 * Run every maps action found in `reply` and return a plain-text results block to
 * feed back to the model, or null if there were no maps actions.
 */
export async function runMapsActions(reply) {
  const regex = /\[ACTION:\s*([A-Z_]+)(?:\s*,\s*(\{.*?\}|[^\]]+))?\]/gis;
  const results = [];
  let m;
  while ((m = regex.exec(reply)) !== null) {
    const action = m[1].toUpperCase();
    if (!MAPS_ACTIONS.has(action)) continue;
    const json = parseJson(m[2]);
    try {
      if (action === 'ROUTE_PLAN') results.push(await routePlan(json || {}));
      else if (action === 'DRIVE_TIME') results.push(await driveTime(json || {}));
    } catch (err) {
      console.error('Deputy maps action failed:', action, err);
      results.push(`Route lookup failed (${err.message || err}).`);
    }
  }
  return results.length ? results.join('\n\n') : null;
}

function parseJson(raw) {
  if (!raw) return null;
  const t = raw.trim();
  if (t.startsWith('{') && t.endsWith('}')) {
    try { return JSON.parse(t); } catch { return null; }
  }
  return null;
}

// ── Date helpers ────────────────────────────────────────────────────────────────
function ymd(d) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}
function resolveDate(input) {
  const now = new Date();
  if (!input) return ymd(now);
  const t = String(input).trim().toLowerCase();
  if (t === 'today') return ymd(now);
  if (t === 'tomorrow') { const d = new Date(now); d.setDate(d.getDate() + 1); return ymd(d); }
  if (t === 'yesterday') { const d = new Date(now); d.setDate(d.getDate() - 1); return ymd(d); }
  // Already YYYY-MM-DD (or close enough for a direct compare)
  if (/^\d{4}-\d{2}-\d{2}$/.test(t)) return t;
  const parsed = new Date(input);
  return isNaN(parsed) ? ymd(now) : ymd(parsed);
}

// ── Location resolution (job # / customer / office / literal address) ────────────
async function geoFor(address) {
  if (!address) return null;
  return getCachedGeo(address) || await geocodeAddress(address).catch(() => null);
}

// Resolve a free-text token to { lat, lng, label } or null.
async function resolveLocation(token) {
  if (!token) return null;
  const raw = String(token).trim();
  const t = raw.toLowerCase();

  // Office / dispatch base
  if (['office', 'base', 'start', 'depot', 'hq', 'the office', 'company'].includes(t)) {
    const start = await getStartLocation();
    return start ? { lat: start.lat, lng: start.lng, label: start.label } : null;
  }

  // Job by number (e.g. "#1005", "job 1005", "1005")
  const jobNumMatch = raw.match(/#?\s*(\d{3,})/);
  if (jobNumMatch) {
    const num = jobNumMatch[1];
    const job = (store.getAll('jobs') || []).find(j => String(j.number) === num || j.id === num);
    if (job?.siteAddress) {
      const geo = job.geo || await geoFor(job.siteAddress);
      if (geo) return { lat: geo.lat, lng: geo.lng, label: `Job #${job.number} — ${job.siteAddress}` };
    }
  }

  // Customer by name → their address
  const customers = store.getAll('customers') || [];
  const cust = customers.find(c => {
    const full = `${c.first_name || ''} ${c.last_name || ''}`.trim().toLowerCase();
    return (full && full === t) || (c.company && c.company.toLowerCase() === t);
  });
  if (cust?.address) {
    const geo = cust.geo || await geoFor(cust.address);
    if (geo) return { lat: geo.lat, lng: geo.lng, label: `${cust.company || `${cust.first_name || ''} ${cust.last_name || ''}`.trim()} — ${cust.address}` };
  }

  // Literal address
  const geo = await geoFor(raw);
  return geo ? { lat: geo.lat, lng: geo.lng, label: raw } : null;
}

// ── ROUTE_PLAN: best order + ETAs for a technician's day ─────────────────────────
// Params: { technicianName?, date? }. Uses real schedule allocations for the day;
// falls back to jobs stamped with that scheduledDate when no allocations exist.
async function routePlan({ technicianName, date } = {}) {
  const day = resolveDate(date);
  const techName = (technicianName || '').trim();

  // 1. Gather the day's stops for this tech — schedule blocks first (real allocations)
  const blocks = (store.getAll('schedule') || [])
    .filter(s => s.date === day)
    .filter(s => !techName || (s.technicianName || '').toLowerCase() === techName.toLowerCase())
    .sort((a, b) => (a.startHour - b.startHour) || ((a.startMinute || 0) - (b.startMinute || 0)));

  let jobRefs;
  if (blocks.length) {
    jobRefs = blocks.map(s => store.getById('jobs', s.jobId)).filter(Boolean);
  } else {
    // Fallback: jobs directly stamped with this date (+ tech)
    jobRefs = (store.getAll('jobs') || [])
      .filter(j => j.scheduledDate === day)
      .filter(j => !techName || (j.technicianName || '').toLowerCase() === techName.toLowerCase());
  }

  const who = techName || 'the team';
  if (!jobRefs.length) return `ROUTE_PLAN: No jobs scheduled for ${who} on ${day}.`;

  // 2. Geocode each stop
  const start = await getStartLocation();
  if (!start) return `ROUTE_PLAN: No dispatch start location set — add a company office address (or a personal start location) so I can compute drive times.`;

  const stops = [];
  const ungeocoded = [];
  for (const job of jobRefs) {
    const addr = job.siteAddress;
    if (!addr) { ungeocoded.push(`Job #${job.number} (no site address)`); continue; }
    const geo = job.geo || await geoFor(addr);
    if (!geo) { ungeocoded.push(`Job #${job.number} (${addr})`); continue; }
    stops.push({ id: String(job.id), lat: geo.lat, lng: geo.lng, number: job.number, title: job.title, address: addr });
  }
  if (!stops.length) return `ROUTE_PLAN: Couldn't geocode any of the ${who}'s stops on ${day}. Unresolved: ${ungeocoded.join('; ')}.`;

  // 3. Optimize the visit order (traffic-unaware) round-tripping from the office
  const route = await computeRoute({
    origin: { lat: start.lat, lng: start.lng },
    stops,
    roundTrip: true,
    optimize: true,
  });
  if (!route) return `ROUTE_PLAN: The routing service was unavailable just now — try again in a moment.`;

  // 4. Order the stops per the optimized result and stitch drive times from legs
  const byId = new Map(stops.map(s => [s.id, s]));
  const ordered = (route.order && route.order.length ? route.order : stops.map(s => s.id))
    .map(id => byId.get(id)).filter(Boolean);

  const legTo = new Map();       // toId -> durationSec
  let returnLeg = null;
  (route.legs || []).forEach(l => {
    if (l.toId === 'origin') returnLeg = l.durationSec;
    else legTo.set(l.toId, l.durationSec);
  });

  const lines = ordered.map((s, i) => {
    const drive = legTo.has(s.id) ? ` (${fmtDuration(legTo.get(s.id))} drive)` : '';
    return `  ${i + 1}. Job #${s.number} — ${s.title || 'Untitled'} @ ${s.address}${drive}`;
  });
  if (returnLeg != null) lines.push(`  ↩ Return to ${start.label} (${fmtDuration(returnLeg)} drive)`);

  const totalDrive = fmtDuration(route.totalDurationSec);
  const totalKm = (route.totalDistanceMeters / 1000).toFixed(0);

  let out = `ROUTE_PLAN for ${who} on ${day} — starting from ${start.label}:\n${lines.join('\n')}\n`;
  out += `Totals: ${totalDrive} driving · ${totalKm} km (includes the return to base).`;
  if (ungeocoded.length) out += `\nNote: couldn't place ${ungeocoded.join('; ')} — excluded from the route.`;
  return out;
}

// ── DRIVE_TIME: point-to-point (one-way) ─────────────────────────────────────────
// Params: { from, to }. Either endpoint may be a job #, customer name, "office", or
// a literal address.
async function driveTime({ from, to } = {}) {
  if (!from || !to) return `DRIVE_TIME: I need both a start and a destination.`;
  const a = await resolveLocation(from);
  const b = await resolveLocation(to);
  if (!a) return `DRIVE_TIME: Couldn't locate "${from}".`;
  if (!b) return `DRIVE_TIME: Couldn't locate "${to}".`;

  const route = await computeRoute({
    origin: { lat: a.lat, lng: a.lng },
    stops: [{ id: 'dest', lat: b.lat, lng: b.lng }],
    roundTrip: false,
  });
  if (!route) return `DRIVE_TIME: The routing service was unavailable just now — try again in a moment.`;

  const km = (route.totalDistanceMeters / 1000).toFixed(1);
  return `DRIVE_TIME: ${a.label} → ${b.label} is ${fmtDuration(route.totalDurationSec)} driving · ${km} km (current traffic, one way).`;
}
