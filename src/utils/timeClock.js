// ============================================
// RELAY — CLOCK IN / CLOCK OUT ATTENDANCE
// ============================================
// Shared helpers for the clock in/out attendance tracker. Records live in the
// `timeClocks` collection (Supabase `time_clocks` table) and go through the
// existing local-first store, so they persist to IndexedDB offline and sync to
// the cloud when online.

import { store } from '../data/store.js';

function localDateString(iso) {
  if (!iso) return '';
  const d = new Date(iso);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function todayStr() {
  return localDateString(new Date().toISOString());
}

// The currently-open clock record for a technician (clocked in, not yet out).
// Deliberately not limited to today so a forgotten clock-out from a previous day
// can still be found and fixed.
export function getActiveClock(technicianId) {
  const clocks = store.getAll('timeClocks') || [];
  const open = clocks
    .filter(c => String(c.technicianId) === String(technicianId) && c.clockInAt && !c.clockOutAt)
    .sort((a, b) => new Date(b.clockInAt) - new Date(a.clockInAt));
  return open[0] || null;
}

// All clock records whose clock-in falls on the given local date (YYYY-MM-DD).
export function getClocksForDate(dateStr) {
  const clocks = store.getAll('timeClocks') || [];
  return clocks.filter(c => localDateString(c.clockInAt) === dateStr);
}

// Best-effort browser geolocation → {lat, lng, accuracy, timestamp} or null.
export function captureLocation() {
  return new Promise((resolve) => {
    if (typeof navigator === 'undefined' || !navigator.geolocation) {
      resolve(null);
      return;
    }
    const ok = (pos) => resolve({
      lat: pos.coords.latitude,
      lng: pos.coords.longitude,
      accuracy: pos.coords.accuracy,
      timestamp: new Date(pos.timestamp || Date.now()).toISOString()
    });
    const fail = () => resolve(null);
    // Keep it snappy: 6s timeout, accept a slightly stale fix up to 30s old.
    navigator.geolocation.getCurrentPosition(ok, fail, {
      enableHighAccuracy: true,
      timeout: 6000,
      maximumAge: 30000
    });
  });
}

// Derive a technician's attendance status for the "Who's In" board.
// Returns { status: 'in'|'out'|'not-in', clockInAt, clockOutAt, location, durationMs }.
export function getClockStatusForToday(technicianId) {
  const id = String(technicianId);
  const clocks = store.getAll('timeClocks') || [];

  // Anytime there's an open record, they are currently clocked in.
  const open = clocks
    .filter(c => String(c.technicianId) === id && c.clockInAt && !c.clockOutAt)
    .sort((a, b) => new Date(b.clockInAt) - new Date(a.clockInAt))[0];
  if (open) {
    return {
      status: 'in',
      clockInAt: open.clockInAt,
      clockOutAt: null,
      location: open.clockInLocation,
      durationMs: Date.now() - new Date(open.clockInAt).getTime()
    };
  }

  // No open record — fall back to today's most recent completed record.
  const todays = getClocksForDate(todayStr()).filter(c => String(c.technicianId) === id);
  const latest = todays.sort((a, b) => new Date(b.clockInAt) - new Date(a.clockInAt))[0];
  if (latest && latest.clockOutAt) {
    return {
      status: 'out',
      clockInAt: latest.clockInAt,
      clockOutAt: latest.clockOutAt,
      location: latest.clockInLocation,
      durationMs: new Date(latest.clockOutAt) - new Date(latest.clockInAt)
    };
  }

  return { status: 'not-in', clockInAt: null, clockOutAt: null, location: null, durationMs: 0 };
}

// Clock a technician in. Captures location best-effort and creates a record.
// @returns {Promise<{record: object, location: object|null}>}
export async function clockIn(technician) {
  const location = await captureLocation();
  const now = new Date().toISOString();
  const record = store.create('timeClocks', {
    technicianId: technician.id,
    technicianName: technician.name,
    clockInAt: now,
    clockInLocation: location,
    status: 'in',
    approvalStatus: 'pending'
  });
  return { record, location };
}

// Clock an open record out. Captures location and sets clockOutAt + status.
// @returns {Promise<{record: object, location: object|null}>}
export async function clockOut(recordId) {
  const location = await captureLocation();
  const record = store.update('timeClocks', recordId, {
    clockOutAt: new Date().toISOString(),
    clockOutLocation: location,
    status: 'out'
  });
  return { record, location };
}

// Format a millisecond duration as "H:MM".
export function formatDuration(ms) {
  if (!ms || ms < 0) return '0:00';
  const totalMinutes = Math.floor(ms / 60000);
  const h = Math.floor(totalMinutes / 60);
  const m = totalMinutes % 60;
  return `${h}:${String(m).padStart(2, '0')}`;
}

// Google Maps deep-link for a location record (or '' if none).
export function mapsLink(loc) {
  if (!loc || loc.lat == null || loc.lng == null) return '';
  return `https://www.google.com/maps?q=${encodeURIComponent(loc.lat + ',' + loc.lng)}`;
}
