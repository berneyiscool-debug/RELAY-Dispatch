// ============================================
// RELAY — DATA PLATFORM: jurisdiction / geo-gate (Phase 1, Ticket 7)
// ============================================
// We only operate the data platform where the privacy regime has been cleared.
// AU-first (2026-07-22). This is the client-side gate; contrib-ingest enforces
// the same allowlist server-side as a belt-and-suspenders check.
//
// Keep ALLOWED_COUNTRIES in sync with the server list in
// supabase/functions/contrib-ingest/index.ts.
//
// See docs/DATA_PLATFORM_STRATEGY.md (§6) and docs/DATA_PLATFORM_PHASE1.md (Ticket 7).

export const ALLOWED_COUNTRIES = ['AU'];

// Map a country to its consent model. AU = opt-out (contribution on by default);
// anything added later that requires opt-in (e.g. EU/GDPR) is listed here.
const OPT_IN_COUNTRIES = new Set([]); // e.g. EU/EEA/UK when those launch

/**
 * Best-effort country for a tenant.
 * - Explicit `settings.country` wins if present.
 * - Otherwise infer coarsely from the company address (AU postcode/state) or the
 *   runtime locale/timezone. This is a soft signal, refined later.
 * Returns an ISO-3166 alpha-2 code, or null if genuinely unknown.
 */
export function detectCountry(settings) {
  const explicit = settings && typeof settings.country === 'string' && settings.country.trim();
  if (explicit) return explicit.toUpperCase();

  const addr = (settings && settings.address) || '';
  // AU signal: a state abbrev + 4-digit postcode, or the word Australia.
  if (/\b(NSW|VIC|QLD|WA|SA|TAS|ACT|NT)\b/i.test(addr) && /\b\d{4}\b/.test(addr)) return 'AU';
  if (/\baustralia\b/i.test(addr)) return 'AU';

  try {
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone || '';
    if (tz.startsWith('Australia/')) return 'AU';
    const loc = (typeof navigator !== 'undefined' && navigator.language) || '';
    if (/-AU$/i.test(loc)) return 'AU';
  } catch { /* ignore */ }

  return null;
}

/** Is this country cleared for the data platform? */
export function isCountryAllowed(country) {
  return !!country && ALLOWED_COUNTRIES.includes(country);
}

/** Does this country require opt-in consent (vs AU's opt-out default)? */
export function requiresOptIn(country) {
  return OPT_IN_COUNTRIES.has(country);
}

/**
 * The single gate the sync job asks before contributing.
 * @returns {{ allowed: boolean, country: string|null, reason?: string }}
 */
export function evaluateContributionEligibility(settings) {
  const country = detectCountry(settings);
  if (!country) return { allowed: false, country: null, reason: 'unknown-region' };
  if (!isCountryAllowed(country)) return { allowed: false, country, reason: 'region-not-eligible' };
  return { allowed: true, country };
}
