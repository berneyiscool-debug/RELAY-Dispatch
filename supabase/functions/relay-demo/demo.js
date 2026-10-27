// ============================================
// RELAY — relay-demo rules
// ============================================
// The pure half of relay-demo: which events a browser may record, where a
// visitor's request came from, how big a guest's brny allowance is, and what a
// guest is allowed to send upstream.
//
// The guest allowance reuses relay-copilot's maths (limits.js) with two
// substitutions: one visitor (a hashed IP) stands in for one seat, and every
// guest together stands in for one company's pool. So the 429 body, the usage
// meters and the Sydney reset are exactly what a cloud user sees.
//
// Plain ESM, no Deno APIs, no types: importable from both the edge function and
// the node test runner.

import { readLimits, formatResetText, unitsToMessages, RESET_TIME_ZONE } from '../relay-copilot/limits.js'

/** Events a browser may record. assistant_call is written by relay-demo itself. */
export const CLIENT_EVENTS = new Set(['demo_started', 'signup_clicked', 'signup_completed'])

/** Where a demo was opened from (demo_events.source). */
export const DEMO_SOURCES = new Set(['launch', 'site', 'link', 'in_app'])

export const DEMO_LIMIT_ENV_NAMES = {
  cap: 'RELAY_AI_DEMO_CAP',
  pool: 'RELAY_AI_DEMO_POOL',
  eventsPerDay: 'RELAY_DEMO_EVENTS_PER_DAY',
}

// A guest gets a sixth of a cloud user's daily ceiling: enough to see brny run
// the business, not enough to run a business on.
export const DEMO_CAP_SHARE = 6

export const DEMO_LIMIT_DEFAULTS = {
  // Every guest together, per Sydney day: the hard ceiling on demo AI spend.
  pool: 2000,
  // Browser-recorded events per visitor per day. Real use is a handful; this
  // only stops a script filling the table.
  eventsPerDay: 60,
}

// A guest turn never needs a long answer, and this bounds what one costs.
export const GUEST_MAX_TOKENS = 2048
// Upper bound on one request body, so a guest can't send a huge prompt.
export const GUEST_MAX_REQUEST_CHARS = 200_000

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

/** True for a well-formed demo id (a UUID the browser generated). */
export function isDemoId(value) {
  return typeof value === 'string' && UUID_RE.test(value)
}

function positiveInt(raw) {
  const n = Number(raw)
  return Number.isFinite(n) && n > 0 ? Math.floor(n) : null
}

/**
 * The guest allowance in billable calls. `cap` defaults to a sixth of the cloud
 * per-user ceiling (RELAY_AI_USER_CAP), so retuning cloud retunes the demo too.
 */
export function readDemoLimits(getEnv) {
  const read = getEnv || ((name) => (globalThis.Deno?.env.get(name)))
  const { userCap } = readLimits(read)
  return {
    cap: positiveInt(read(DEMO_LIMIT_ENV_NAMES.cap)) ?? Math.max(1, Math.floor(userCap / DEMO_CAP_SHARE)),
    pool: positiveInt(read(DEMO_LIMIT_ENV_NAMES.pool)) ?? DEMO_LIMIT_DEFAULTS.pool,
    eventsPerDay: positiveInt(read(DEMO_LIMIT_ENV_NAMES.eventsPerDay)) ?? DEMO_LIMIT_DEFAULTS.eventsPerDay,
  }
}

/**
 * Validates a browser event. Returns { demoId, event, source } or { error }.
 * The source is only kept on demo_started, the one event it describes.
 */
export function parseClientEvent(body) {
  const { demoId, event, source } = body || {}
  if (!isDemoId(demoId)) return { error: 'demoId must be a UUID' }
  if (!CLIENT_EVENTS.has(event)) return { error: 'Unknown event' }
  if (event !== 'demo_started') return { demoId, event, source: null }
  return { demoId, event, source: DEMO_SOURCES.has(source) ? source : 'link' }
}

/**
 * The visitor's IP as the edge runtime reports it, or ''. Supabase's gateway
 * sets x-forwarded-for; the first entry is the client.
 */
export function clientIp(headers) {
  const get = (name) => (headers && typeof headers.get === 'function' ? headers.get(name) : null) || ''
  const forwarded = get('x-forwarded-for').split(',')[0].trim()
  return forwarded || get('cf-connecting-ip').trim() || get('x-real-ip').trim()
}

/** A keyed SHA-256 of the IP, so the table never holds an address. */
export async function hashVisitor(ip, secret) {
  if (!ip || !secret) return null
  const enc = new TextEncoder()
  const key = await crypto.subtle.importKey('raw', enc.encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign'])
  const sig = await crypto.subtle.sign('HMAC', key, enc.encode(ip))
  return Array.from(new Uint8Array(sig), (b) => b.toString(16).padStart(2, '0')).join('')
}

/** The guest version of limitMessage(): the way on is an account, not tomorrow. */
export function guestLimitMessage({ scope, cap, resetsAt, timeZone = RESET_TIME_ZONE }) {
  const resetText = formatResetText(resetsAt, timeZone)
  const signup = 'Create a free account to keep going with brny on your own business.'
  if (scope === 'company') {
    return `brny's demo allowance is used up for today. It resets at ${resetText}. ${signup}`
  }
  return `You've used this demo's brny allowance for today (~${unitsToMessages(cap)} messages). It resets at ${resetText}. ${signup}`
}

/**
 * The upstream payload for a guest turn, or { error }. Only the conversation,
 * system prompt and tools are taken from the caller: the model is the default,
 * the output ceiling is clamped, and there is no endpoint to choose.
 */
export function guestPayload(body, { model }) {
  const { messages, system, tools, tool_choice, max_tokens } = body || {}
  if (!Array.isArray(messages) || messages.length === 0) return { error: 'messages is required' }
  const size = JSON.stringify({ messages, system, tools }).length
  if (size > GUEST_MAX_REQUEST_CHARS) return { error: 'This demo request is too large.' }
  const requested = Number(max_tokens)
  const payload = {
    model,
    max_tokens: requested > 0 ? Math.min(Math.floor(requested), GUEST_MAX_TOKENS) : GUEST_MAX_TOKENS,
    messages,
  }
  if (typeof system === 'string' && system) payload.system = system
  if (Array.isArray(tools) && tools.length) {
    payload.tools = tools
    payload.tool_choice = tool_choice || { type: 'auto' }
  }
  return { payload }
}
