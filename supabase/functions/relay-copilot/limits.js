// ============================================
// RELAY — relay-copilot daily allowance
// ============================================
// The pure half of the pooled AI cap: how big a company's daily pool is, how
// much of it one seat may spend, whether the next call is allowed, and when the
// allowance resets.
//
// This lives in its own module (rather than inline in index.ts) so node:test can
// exercise the real maths. The Sydney day window is the part most likely to be
// wrong without anyone noticing: a UTC midnight reset is 10–11am in Sydney, and
// a naive 24-hour window is an hour out on the two DST transition days.
//
// Plain ESM, no Deno APIs, no types: importable from both the edge function and
// the node test runner.

// Deputy's customers are Australian, and nothing in the app records a company
// timezone, so the boundary is fixed. The 429 response still reports the reset
// instant, which the client renders in the user's own local time.
export const RESET_TIME_ZONE = 'Australia/Sydney'

// A chat turn is usually two billable calls (the reply, then any follow-up
// lookup/action turn), so allowance is quoted to the user in messages.
export const CALLS_PER_MESSAGE = 2

export const LIMIT_ENV_NAMES = {
  perSeat: 'RELAY_AI_POOL_PER_SEAT',
  perSeatPlus: 'RELAY_AI_POOL_PER_SEAT_PLUS',
  floor: 'RELAY_AI_POOL_FLOOR',
  userCap: 'RELAY_AI_USER_CAP',
  userCapPlus: 'RELAY_AI_USER_CAP_PLUS',
}

// Generous for a small trade business, while still bounding what one account
// can spend of a budget every tenant shares.
export const LIMIT_DEFAULTS = {
  perSeat: 50,
  perSeatPlus: 75,
  floor: 150,
  userCap: 150,
  userCapPlus: 200,
}

/** A positive whole number from an env string, or the fallback when unset/unparsable. */
export function envNumber(raw, fallback) {
  const n = Number(raw)
  return Number.isFinite(n) && n > 0 ? Math.floor(n) : fallback
}

/** Reads the five allowance secrets. Omitted/invalid values fall back to the defaults above. */
export function readLimits(getEnv) {
  const read = getEnv || ((name) => (globalThis.Deno?.env.get(name)))
  const limits = {}
  for (const key of Object.keys(LIMIT_DEFAULTS)) {
    limits[key] = envNumber(read(LIMIT_ENV_NAMES[key]), LIMIT_DEFAULTS[key])
  }
  return limits
}

// ── Tenant identity ──────────────────────────────────────────────────────

// Server-side tier, mirroring the client's hasDeputyMax()/isCloudPlus(): a
// complimentary Cloud+ grant, a live Cloud+ subscription, or the legacy
// `settings.ai.tier = 'cloudPlus'` flag written by the Stripe webhook.
export function isCloudPlusCompany(company) {
  if (!company) return false
  if (company.comp_tier === 'cloud_plus') return true
  if (company.subscription_tier === 'cloud_plus') return true
  // The legacy flag is normally selected straight out of the JSONB column as
  // `ai_tier`: the whole settings document is deliberately not fetched, because
  // it can carry an uploaded logo as a data URL.
  if (company.ai_tier === 'cloudPlus') return true
  const tier = company.settings && company.settings.ai && company.settings.ai.tier
  return tier === 'cloudPlus'
}

// Seats come from the Stripe-synced quantity when it exists, else from a live
// count of non-deactivated profiles (the same helper the billing functions
// reconcile against). One seat is the floor: an unsubscribed or brand-new
// company still gets a usable allowance.
export function resolveSeats(company, activeSeatCount) {
  const stored = Number(company && company.subscription_seats)
  if (Number.isFinite(stored) && stored > 0) return Math.floor(stored)
  const counted = Number(activeSeatCount)
  if (Number.isFinite(counted) && counted > 0) return Math.floor(counted)
  return 1
}

// ── Allowance ────────────────────────────────────────────────────────────

/** The company's daily pool: max(floor, seats × per-seat). */
export function poolLimit(seats, cloudPlus, limits) {
  const perSeat = cloudPlus ? limits.perSeatPlus : limits.perSeat
  return Math.max(limits.floor, seats * perSeat)
}

/** The company's per-user daily ceiling. */
export function userLimit(cloudPlus, limits) {
  return cloudPlus ? limits.userCapPlus : limits.userCap
}

/**
 * Decides whether one more call may run. The per-user ceiling is checked
 * independently of the pool, so a seat that has spent its own day is refused
 * while its teammates carry on against the remaining pool.
 */
export function evaluateLimits({ companyUnits, userUnits, pool, cap }) {
  const poolRemainingUnits = Math.max(0, pool - companyUnits)
  const userRemainingUnits = Math.max(0, cap - userUnits)
  if (userUnits + 1 > cap) {
    return { allowed: false, scope: 'user', userRemainingUnits, poolRemainingUnits }
  }
  if (companyUnits + 1 > pool) {
    return { allowed: false, scope: 'company', userRemainingUnits, poolRemainingUnits }
  }
  return { allowed: true, scope: null, userRemainingUnits, poolRemainingUnits }
}

/** Billable calls → the approximate number of chat messages they buy. */
export function unitsToMessages(units) {
  return Math.floor(Math.max(0, Number(units) || 0) / CALLS_PER_MESSAGE)
}

/**
 * Used ÷ limit as a whole percentage, clamped to 0–100. Rounded rather than
 * floored so the first call of the day registers as 1% instead of looking like
 * a meter that is not counting.
 */
function percentUsed(usedUnits, limitUnits) {
  const used = Number(usedUnits)
  const limit = Number(limitUnits)
  if (!Number.isFinite(limit) || limit <= 0) return 0
  if (!Number.isFinite(used) || used <= 0) return 0
  return Math.min(100, Math.round((used / limit) * 100))
}

/**
 * The two allowance meters — one seat's own day, one company's — as the app's
 * usage bars need them.
 *
 * Built on evaluateLimits() on purpose: the remainders a bar displays come from
 * the same arithmetic that allows or refuses the next call, so a meter can never
 * disagree with the 429 that follows it.
 *
 * `percent` is computed in billable calls, not messages. Calls are what the cap
 * actually counts, and converting first would round a 1-unit cap down to a
 * permanent 0%.
 */
export function usageSnapshot({ companyUnits, userUnits, pool, cap, seats }) {
  const { allowed, scope, userRemainingUnits, poolRemainingUnits } = evaluateLimits({
    companyUnits,
    userUnits,
    pool,
    cap,
  })

  const meter = (usedUnits, limitUnits, remainingUnits) => ({
    usedUnits: Math.max(0, Math.floor(Number(usedUnits) || 0)),
    limitUnits,
    remainingUnits,
    usedMessages: unitsToMessages(usedUnits),
    limitMessages: unitsToMessages(limitUnits),
    remainingMessages: unitsToMessages(remainingUnits),
    percent: percentUsed(usedUnits, limitUnits),
  })

  return {
    // null when the next call would be allowed; 'user' or 'company' when not.
    blocked: allowed ? null : scope,
    seats,
    user: meter(userUnits, cap, userRemainingUnits),
    company: meter(companyUnits, pool, poolRemainingUnits),
  }
}

// ── The Sydney day window ────────────────────────────────────────────────

const formatters = new Map()

function partsFormatter(timeZone) {
  let formatter = formatters.get(timeZone)
  if (!formatter) {
    formatter = new Intl.DateTimeFormat('en-US', {
      timeZone,
      hour12: false,
      hourCycle: 'h23',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    })
    formatters.set(timeZone, formatter)
  }
  return formatter
}

/** The wall-clock (local) calendar/clock fields for an instant in a timezone. */
export function zonedParts(date, timeZone = RESET_TIME_ZONE) {
  const parts = {}
  for (const { type, value } of partsFormatter(timeZone).formatToParts(date)) {
    if (type !== 'literal') parts[type] = value
  }
  return parts
}

/** How far ahead of UTC the zone is at that instant (+11h during Sydney DST). */
export function timeZoneOffsetMs(date, timeZone = RESET_TIME_ZONE) {
  const instant = Math.floor(date.getTime() / 1000) * 1000
  const p = zonedParts(new Date(instant), timeZone)
  return Date.UTC(+p.year, +p.month - 1, +p.day, +p.hour, +p.minute, +p.second) - instant
}

// The UTC instant of local midnight on a wall-clock date. Date.UTC normalises
// out-of-range day numbers, so callers can add a day by passing day + 1.
function wallMidnightUtc(year, month, day, timeZone) {
  const wall = Date.UTC(year, month - 1, day, 0, 0, 0)
  // The offset at the guessed instant can differ from the offset at midnight on
  // a DST-transition day, so refine once.
  let instant = wall - timeZoneOffsetMs(new Date(wall), timeZone)
  const refined = wall - timeZoneOffsetMs(new Date(instant), timeZone)
  if (refined !== instant) instant = refined
  return instant
}

/** Local midnight that starts the day `now` falls in. */
export function startOfDayUtc(now, timeZone = RESET_TIME_ZONE) {
  const p = zonedParts(now, timeZone)
  return new Date(wallMidnightUtc(+p.year, +p.month, +p.day, timeZone))
}

/** The next local midnight after `now` — when the allowance comes back. */
export function nextResetUtc(now, timeZone = RESET_TIME_ZONE) {
  const p = zonedParts(now, timeZone)
  return new Date(wallMidnightUtc(+p.year, +p.month, +p.day + 1, timeZone))
}

/** "10:00 am AEDT on 5 Oct" — the server-side fallback for old clients. */
export function formatResetText(resetsAt, timeZone = RESET_TIME_ZONE) {
  const time = new Intl.DateTimeFormat('en-AU', {
    timeZone, hour: 'numeric', minute: '2-digit', timeZoneName: 'short',
  }).format(resetsAt)
  const day = new Intl.DateTimeFormat('en-AU', {
    timeZone, day: 'numeric', month: 'short',
  }).format(resetsAt)
  return `${time} on ${day}`
}

/**
 * The message a blocked caller sees. `scope: 'user'` names the personal
 * ceiling; `scope: 'company'` names the team pool — the two are different
 * problems, and only one of them is the caller's own doing.
 */
export function limitMessage({ scope, cap, pool, poolRemainingUnits, resetsAt, timeZone = RESET_TIME_ZONE }) {
  const resetText = formatResetText(resetsAt, timeZone)
  if (scope === 'company') {
    return `Your team's brny allowance for today (~${unitsToMessages(pool)} messages) is used up. It resets at ${resetText}.`
  }
  const teamLeft = unitsToMessages(poolRemainingUnits)
  const tail = teamLeft > 0
    ? ` Your team can still send about ${teamLeft} more message${teamLeft === 1 ? '' : 's'} today.`
    : ''
  return `You've reached your personal brny allowance for today (~${unitsToMessages(cap)} messages). It resets at ${resetText}.${tail}`
}
