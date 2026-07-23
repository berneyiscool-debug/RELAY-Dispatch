// ============================================
// RELAY — DATA PLATFORM: local contribution sync (Phase 1, Ticket 4)
// ============================================
// Runs in the Electron client for LOCAL/offline tenants, whose data never
// reaches Supabase. Once a week it computes anonymized aggregates on-device and
// POSTs only the statistics to the `contrib-ingest` edge function. Cloud tenants
// are handled server-side by contrib-aggregate-cloud, so this no-ops for them to
// avoid double-counting.
//
// Gated on: FLAGS.contrib AND consent (settings.dataContribution.enabled) AND an
// eligible jurisdiction AND the weekly cadence having elapsed. Best-effort:
// failures never advance the cadence and never disrupt app launch.
//
// See docs/DATA_PLATFORM_PHASE1.md (Ticket 4).

import { store } from '../data/store.js';
import { supabase } from './supabase.js';
import { FLAGS } from './flags.js';
import { evaluateContributionEligibility } from './jurisdiction.js';
import { computeContributions, CONTRIB_SCHEMA_VERSION } from './contribMetrics.js';

const INSTALL_ID_KEY = 'relay_install_id';
const LAST_RUN_KEY = 'relay_contrib_last_run';
const CADENCE_MS = 7 * 24 * 60 * 60 * 1000; // weekly (resolved 2026-07-22)

// Pseudonymous, per-install id. Random, never tied to identity — used only for
// dedupe/rate-limit on the server. Generated once and persisted locally.
function getInstallId() {
  try {
    let id = localStorage.getItem(INSTALL_ID_KEY);
    if (!id) {
      id = (typeof crypto !== 'undefined' && crypto.randomUUID)
        ? crypto.randomUUID()
        : 'inst_' + Math.random().toString(36).slice(2) + Date.now().toString(36);
      localStorage.setItem(INSTALL_ID_KEY, id);
    }
    return id;
  } catch {
    return null;
  }
}

function isLocalTenant() {
  // Local/offline = no companyId or an acct_-prefixed one (mirrors the store's
  // cloud/local boundary). Cloud tenants are handled by the server cron.
  return !(store.companyId && !String(store.companyId).startsWith('acct_'));
}

function cadenceElapsed() {
  try {
    const last = localStorage.getItem(LAST_RUN_KEY);
    if (!last) return true;
    return (Date.now() - new Date(last).getTime()) >= CADENCE_MS;
  } catch {
    return true;
  }
}

function currentPeriod() {
  return new Date().toISOString().slice(0, 7); // 'YYYY-MM'
}

/**
 * Attempt one local contribution. Returns a small status object for logging/tests.
 * Never throws — all failures degrade to a skipped/failed status.
 */
export async function runLocalContribution({ force = false } = {}) {
  try {
    if (!FLAGS.contrib) return { ran: false, reason: 'flag-off' };
    if (!isLocalTenant()) return { ran: false, reason: 'cloud-tenant' };

    const settings = store.getSettings();
    if (!settings || !settings.dataContribution || settings.dataContribution.enabled === false) {
      return { ran: false, reason: 'consent-off' };
    }

    const elig = evaluateContributionEligibility(settings);
    if (!elig.allowed) return { ran: false, reason: elig.reason };

    if (!force && !cadenceElapsed()) return { ran: false, reason: 'cadence' };

    const installId = getInstallId();
    if (!installId) return { ran: false, reason: 'no-install-id' };

    if (typeof navigator !== 'undefined' && navigator.onLine === false) {
      return { ran: false, reason: 'offline' };
    }

    const period = currentPeriod();
    const collections = {
      settings,
      customers: store.getAll('customers') || [],
      costCenters: store.getAll('costCenters') || [],
      jobs: store.getAll('jobs') || [],
      quotes: store.getAll('quotes') || [],
      invoices: store.getAll('invoices') || [],
    };

    const rows = computeContributions(collections, {
      installId,
      source: 'local',
      country: elig.country,
      period,
    });

    if (!rows.length) {
      // Nothing to send, but count it as a successful cycle so we don't retry
      // every launch on an empty dataset.
      localStorage.setItem(LAST_RUN_KEY, new Date().toISOString());
      return { ran: true, reason: 'no-data', sent: 0 };
    }

    const { data, error } = await supabase.functions.invoke('contrib-ingest', {
      body: {
        installId,
        source: 'local',
        country: elig.country,
        period,
        schemaVersion: CONTRIB_SCHEMA_VERSION,
        rows,
      },
    });
    if (error) throw error;

    // Only advance the cadence on a confirmed accept.
    localStorage.setItem(LAST_RUN_KEY, new Date().toISOString());
    return { ran: true, sent: rows.length, accepted: data && data.accepted };
  } catch (err) {
    // Best-effort: do NOT advance last-run; retry next launch.
    console.warn('RELAY contrib sync failed:', err && (err.message || err));
    return { ran: false, reason: 'error', error: err && (err.message || String(err)) };
  }
}

/**
 * Fire-and-forget launch hook. Schedules the attempt shortly after boot so it
 * never blocks or slows app startup.
 */
export function scheduleLocalContribution() {
  if (!FLAGS.contrib) return;
  try {
    setTimeout(() => { runLocalContribution(); }, 15000);
  } catch { /* ignore */ }
}
