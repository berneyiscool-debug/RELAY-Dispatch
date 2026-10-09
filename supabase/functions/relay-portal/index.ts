import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import {
  ACCESS_OUTCOMES,
  PIN_ATTEMPT_LIMIT,
  PIN_ATTEMPT_WINDOW_MS,
  canInsert,
  canUpdate,
  grantExpiry,
  hashGrant,
  hashPin,
  isForbiddenMutation,
  isPortalKind,
  isWellFormedToken,
  isWritableCollection,
  needsPinUpgrade,
  newGrant,
  normalizePin,
  ownershipRuleFor,
  pinRequirement,
  portalCreatedBy,
  portalEnabled,
  projectRecord,
  publicRecord,
  publicSettings,
  recordTableFor,
  rejectedColumns,
  relatedPlanFor,
  throttleDecision,
  verifyPin,
} from './portal.js'

// ============================================
// RELAY — PORTAL RESOLVER
// ============================================
// Resolves a customer or contractor magic link on the server.
//
// Why this exists: the portals used to resolve their own token with
// `store.getAll('customers').find(c => c.portalToken === token)`. getAll() is
// synchronous and never fetches, and 030_rls_hardening.sql scopes every policy
// TO authenticated — so a signed-out visitor booted an empty local store, matched
// nothing, and every link landed on "Invalid Access Link". It only ever worked in
// the operator's own already-synced browser profile, which is why it went
// unnoticed. There was no server-side path to a link at all; this is it.
//
// PUBLIC (verify_jwt = false): the caller is an anonymous customer. It is
// authorised by the portal token — a 32-byte bearer credential — plus, once the
// portal is secured, a PIN-derived grant. Deploy with:
//     supabase functions deploy relay-portal --no-verify-jwt
// There is no supabase/config.toml in this repo, so verify_jwt = false has to be
// passed at deploy time or every anonymous call 401s.
//
// Every query runs as the service role, which BYPASSES RLS. All scoping is
// therefore explicit below: the row is reached from the token's own record, the
// collection and columns are checked against fixed allow-lists, and ownership is
// re-proven against the database before a write lands. portal.js holds those
// rules, and supabase/tests/relay-portal.test.js covers them.
//
// The company settings in every response are an allow-list too (publicSettings).
// The blob also carries the tenant's `ai` provider API key, and these responses
// reach an anonymous visitor — see PUBLIC_SETTINGS_KEYS in portal.js.
//
// Request body: { action: 'load',      token, kind, grant? }
//               { action: 'unlock',    token, kind, pin }
//               { action: 'setPasscode', token, kind, pin, grant? }
//               { action: 'write',     token, kind, grant, collection, id?, payload }
// Response:     { status: 'ok'|'invalid'|'offline'|'locked'|'passcode_setup'|'throttled' }
//               { ok: true|false } for writes
//
// Secrets: SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })
  if (req.method !== 'POST') return json({ error: 'Method Not Allowed' }, 405)

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')
    const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
    if (!supabaseUrl || !serviceKey) return json({ error: 'Supabase keys are not configured' }, 500)

    const admin = createClient(supabaseUrl, serviceKey)

    const body = await req.json().catch(() => null)
    if (!body || typeof body !== 'object') return json({ error: 'Invalid request body' }, 400)

    const { action, token, kind } = body
    if (!isPortalKind(kind)) return json({ error: 'Unknown portal' }, 400)
    // A malformed token gets the same answer as an unknown one, so a probe cannot
    // tell "wrong shape" from "not issued".
    if (!isWellFormedToken(token)) return json({ status: 'invalid' })

    const table = recordTableFor(kind)
    const record = await findRecord(admin, kind, token)
    if (!record) return json({ status: 'invalid' })

    const rawSettings = await companySettings(admin, record.company_id)
    // Checked against the raw blob, so narrowing the public projection below can
    // never silently take a portal offline.
    if (!portalEnabled(kind, rawSettings)) {
      return json({ status: 'offline', settings: publicSettings(rawSettings) })
    }

    // Projected once, here. Every response below spreads ctx.settings, and each of
    // them reaches an anonymous visitor: the company blob also carries the tenant's
    // `ai` provider key, which must never leave the server.
    const ctx = { admin, kind, table, record, settings: publicSettings(rawSettings) }

    switch (action) {
      case 'load': return await handleLoad(ctx, body)
      case 'unlock': return await handleUnlock(ctx, body)
      case 'setPasscode': return await handleSetPasscode(ctx, body)
      case 'write': return await handleWrite(ctx, body)
      default: return json({ error: 'Unknown action' }, 400)
    }
  } catch (err) {
    console.error('relay-portal error:', err)
    return json({ error: String(err?.message || err) }, 500)
  }
})

// ---------------------------------------------------------------------------
// Resolution
// ---------------------------------------------------------------------------

// The unique partial index from 042 is what makes this unambiguous. maybeSingle()
// rather than single() so zero rows is an answer, not an error to catch.
async function findRecord(admin, kind, token) {
  const { data, error } = await admin
    .from(recordTableFor(kind))
    .select('*')
    .eq('portal_token', token)
    .maybeSingle()
  if (error) throw error
  return data || null
}

async function companySettings(admin, companyId) {
  if (!companyId) return {}
  const { data } = await admin.from('companies').select('settings').eq('id', companyId).maybeSingle()
  return (data && data.settings) || {}
}

// Only failures inside the window are fetched, so the throttle is a genuine
// sliding window: five wrong PINs in fifteen minutes locks the link, and the
// lock lifts on its own as the oldest attempt ages out.
async function recentFailures(admin, kind, recordId) {
  const since = new Date(Date.now() - PIN_ATTEMPT_WINDOW_MS).toISOString()
  const { data } = await admin
    .from('portal_access_log')
    .select('outcome, occurred_at')
    .eq('token_kind', kind)
    .eq('record_id', String(recordId))
    .eq('outcome', ACCESS_OUTCOMES.passcodeFail)
    .gte('occurred_at', since)
    .order('occurred_at', { ascending: false })
    .limit(PIN_ATTEMPT_LIMIT * 4)
  return data || []
}

async function logAccess(admin, kind, recordId, companyId, outcome, action) {
  const { error } = await admin.from('portal_access_log').insert({
    token_kind: kind,
    record_id: String(recordId),
    company_id: companyId || null,
    outcome,
    action: action || null,
  })
  // An audit row must never be the reason a legitimate visitor is refused, but a
  // lost failure row would under-count the throttle, so say so loudly.
  if (error) console.error('relay-portal access log failed:', error.message)
}

// ---------------------------------------------------------------------------
// Grants
// ---------------------------------------------------------------------------
// The PIN used to be verified in the browser and the result kept in sessionStorage
// as the string 'true' — a claim the server never checked, which left the PIN
// gating reads only. A grant is the same idea with something the server can verify:
// minted after a real PIN check, stored as a digest, scoped to one record, and
// expiring.

async function mintGrant(admin, kind, record) {
  const grant = newGrant()
  const { error } = await admin.from('portal_sessions').insert({
    grant_hash: await hashGrant(grant),
    token_kind: kind,
    record_id: String(record.id),
    company_id: record.company_id || null,
    expires_at: grantExpiry(Date.now()),
  })
  if (error) throw error
  return grant
}

async function grantIsLive(admin, kind, record, grant) {
  if (typeof grant !== 'string' || !grant) return false
  const hash = await hashGrant(grant)
  const { data } = await admin
    .from('portal_sessions')
    .select('record_id, token_kind, expires_at')
    .eq('grant_hash', hash)
    .maybeSingle()
  // A grant is bound to one record on one portal; presenting it anywhere else
  // fails here rather than being caught later by an ownership check.
  if (!data) return false
  if (data.token_kind !== kind) return false
  if (String(data.record_id) !== String(record.id)) return false
  if (Date.parse(data.expires_at) <= Date.now()) return false
  await admin.from('portal_sessions').update({ last_used_at: new Date().toISOString() }).eq('grant_hash', hash)
  return true
}

// Changing a PIN retires every session for that record, so a grant handed out
// under the old PIN stops working the moment it is changed.
async function clearGrants(admin, kind, recordId) {
  await admin.from('portal_sessions').delete().eq('token_kind', kind).eq('record_id', String(recordId))
}

// The staff-facing "Last Accessed" value PersonDetail.js:162 renders. Best-effort:
// a failure here must not cost the customer their portal.
async function stampAccess(admin, table, record) {
  const { error } = await admin
    .from(table)
    .update({ portal_last_accessed: new Date().toISOString() })
    .eq('id', record.id)
  if (error) console.error('relay-portal last-accessed stamp failed:', error.message)
}

// ---------------------------------------------------------------------------
// Reads
// ---------------------------------------------------------------------------

// Each related row is fetched with `*` on purpose. The portals run every record
// through store.js's normaliseRecord, which unpacks packed columns (`notes` holds
// the job's activityLog/customerActivityLog meta, quotes pack into line_items), so
// a partial column list would silently drop fields the UI expects. Scoping happens
// by row, not by column.
async function loadRelated(admin, kind, record) {
  const tables = {}
  let assets = []

  for (const item of relatedPlanFor(kind)) {
    if (item.via === 'contractor_task_assignment') {
      // job.contractorId is not a column — assignment lives in the tasks jsonb,
      // which PostgREST cannot filter. The RPC does the walk server-side, so a
      // contractor is never handed the company's other jobs to filter locally.
      const { data, error } = await admin.rpc('portal_contractor_job_ids', {
        p_company: record.company_id,
        p_contractor: String(record.id),
      })
      if (error) throw error
      const ids = (data || []).map((row) => (typeof row === 'string' ? row : row.id)).filter(Boolean)
      tables[item.key] = await selectIn(admin, item.table, 'id', ids)
      continue
    }

    const values = item.from === 'assetIds'
      ? assets.map((a) => String(a.id))
      : [String(record.id)]
    if (!values.length) {
      tables[item.key] = []
      continue
    }

    let query = admin.from(item.table).select('*').in(item.column, values)
    // Mirrors the filter the portal applied in the browser, so the row never travels.
    if (item.exclude) query = query.neq(item.exclude.column, item.exclude.equals)
    if (item.require) query = query.eq(item.require.column, item.require.equals)
    const { data, error } = await query
    if (error) throw error
    tables[item.key] = data || []
    if (item.key === 'assets') assets = tables[item.key]
  }

  return tables
}

async function selectIn(admin, table, column, values) {
  if (!values.length) return []
  const { data, error } = await admin.from(table).select('*').in(column, values)
  if (error) throw error
  return data || []
}

async function okBundle(ctx, grant) {
  const { admin, kind, record, settings } = ctx
  return json({
    status: 'ok',
    kind,
    settings,
    record: projectRecord(record),
    tables: await loadRelated(admin, kind, record),
    grant,
  })
}

// ---------------------------------------------------------------------------
// Actions
// ---------------------------------------------------------------------------

async function handleLoad(ctx, body) {
  const { admin, kind, table, record, settings } = ctx
  await logAccess(admin, kind, record.id, record.company_id, ACCESS_OUTCOMES.resolve, null)

  // Nobody has claimed this link yet: the first visitor sets the PIN. Confirmed
  // with the operator as the intended behaviour, so it is preserved.
  if (pinRequirement(record.portal_passcode) === 'setup') {
    return json({ status: 'passcode_setup', settings, record: publicRecord(record) })
  }

  if (await grantIsLive(admin, kind, record, body.grant)) {
    await stampAccess(admin, table, record)
    return await okBundle(ctx, body.grant)
  }

  const throttle = throttleDecision(await recentFailures(admin, kind, record.id), Date.now())
  return json({
    status: 'locked',
    settings,
    record: publicRecord(record),
    ...(throttle.throttled ? { retryAfterSeconds: throttle.retryAfterSeconds } : {}),
  })
}

async function handleUnlock(ctx, body) {
  const { admin, kind, table, record, settings } = ctx

  const throttle = throttleDecision(await recentFailures(admin, kind, record.id), Date.now())
  if (throttle.throttled) {
    // The record travels with the throttle answer so the client can keep naming who
    // the link belongs to instead of re-rendering an empty shell.
    return json({
      status: 'throttled',
      settings,
      record: publicRecord(record),
      retryAfterSeconds: throttle.retryAfterSeconds,
    })
  }

  if (pinRequirement(record.portal_passcode) === 'setup') {
    return json({ status: 'passcode_setup', settings, record: publicRecord(record) })
  }

  const pin = normalizePin(body.pin)
  if (!pin || !(await verifyPin(pin, record.portal_passcode))) {
    await logAccess(admin, kind, record.id, record.company_id, ACCESS_OUTCOMES.passcodeFail, null)
    return json({ status: 'locked', settings, record: publicRecord(record), error: 'Incorrect Portal PIN.' })
  }

  await logAccess(admin, kind, record.id, record.company_id, ACCESS_OUTCOMES.passcodeOk, null)

  // A PIN stored before hashing landed is still cleartext; the plaintext is in hand
  // now, so replace it and let the stored copy stop being the secret itself.
  if (needsPinUpgrade(record.portal_passcode)) {
    const upgraded = await hashPin(pin)
    await admin.from(table).update({ portal_passcode: upgraded }).eq('id', record.id)
    await logAccess(admin, kind, record.id, record.company_id, ACCESS_OUTCOMES.passcodeUpgraded, null)
  }

  const grant = await mintGrant(admin, kind, record)
  await stampAccess(admin, table, record)
  return await okBundle(ctx, grant)
}

async function handleSetPasscode(ctx, body) {
  const { admin, kind, table, record, settings } = ctx

  const pin = normalizePin(body.pin)
  if (!pin) return json({ ok: false, error: 'PIN must be between 4 and 6 digits.' }, 400)

  const digest = await hashPin(pin)
  const claiming = pinRequirement(record.portal_passcode) === 'setup'

  if (claiming) {
    // First visitor wins, but not two first visitors at once: the WHERE clause
    // carries the stored value we read, so a concurrent claim updates zero rows and
    // is told to use the PIN instead. Without this the slower writer would silently
    // take over the link.
    let claim = admin
      .from(table)
      .update({ portal_passcode: digest, updated_at: new Date().toISOString() })
      .eq('id', record.id)
    claim = record.portal_passcode == null
      ? claim.is('portal_passcode', null)
      : claim.eq('portal_passcode', record.portal_passcode)
    const { data: claimed, error } = await claim.select('id')
    if (error) throw error
    if (!claimed || !claimed.length) {
      return json({
        status: 'locked',
        settings,
        record: publicRecord(record),
        error: 'This portal was secured by someone else. Please enter the PIN.',
      })
    }
    await logAccess(admin, kind, record.id, record.company_id, ACCESS_OUTCOMES.passcodeSetup, null)
  } else {
    // Changing an existing PIN is only allowed to someone already holding the grant
    // that proves they knew the old one.
    if (!(await grantIsLive(admin, kind, record, body.grant))) {
      return json({
        status: 'locked',
        settings,
        record: publicRecord(record),
        error: 'Your session has expired. Please re-enter your PIN.',
      })
    }
    // The old PIN is asked for again even though the grant already proves it: an
    // unattended unlocked tab must not be enough to lock the owner out of their own
    // portal. The digest never reaches the browser, so this is checked here.
    const current = normalizePin(body.currentPin)
    if (!current || !(await verifyPin(current, record.portal_passcode))) {
      return json({ ok: false, error: 'Current PIN is incorrect.' }, 403)
    }
    const { error } = await admin.from(table).update({ portal_passcode: digest }).eq('id', record.id)
    if (error) throw error
    await logAccess(admin, kind, record.id, record.company_id, ACCESS_OUTCOMES.passcodeSetup, 'change_passcode')
  }

  // Any grant issued under the previous PIN dies with it.
  await clearGrants(admin, kind, record.id)
  const grant = await mintGrant(admin, kind, record)
  await stampAccess(admin, table, record)

  const refreshed = await findRecordById(admin, table, record.id)
  return await okBundle({ ...ctx, record: refreshed || record }, grant)
}

async function findRecordById(admin, table, id) {
  const { data } = await admin.from(table).select('*').eq('id', id).maybeSingle()
  return data || null
}

// ---------------------------------------------------------------------------
// Writes
// ---------------------------------------------------------------------------
// The client prepares the row — it already owns the snake_case mapping and the
// packed-column packing in store.js — and this decides whether that row may land.
// The checks run in order of how cheap they are to get wrong: collection, then
// columns, then ownership against the database.

async function handleWrite(ctx, body) {
  const { admin, kind, record, settings } = ctx
  const { collection, id, payload } = body

  if (!isWritableCollection(kind, collection)) {
    return json({ ok: false, error: 'That is not something a portal can change.' }, 403)
  }

  // A write without a live grant would mean the PIN gated reads only, and anyone
  // holding the link could accept a quote without ever knowing it.
  if (!(await grantIsLive(admin, kind, record, body.grant))) {
    return json({
      status: 'locked',
      settings,
      record: publicRecord(record),
      error: 'Your session has expired. Please re-enter your PIN.',
    }, 403)
  }

  const mode = id ? 'update' : 'insert'
  if (mode === 'update' && !canUpdate(kind, collection)) {
    return json({ ok: false, error: 'That is not something a portal can change.' }, 403)
  }
  if (mode === 'insert' && !canInsert(kind, collection)) {
    return json({ ok: false, error: 'That is not something a portal can create.' }, 403)
  }

  const rejected = rejectedColumns(kind, collection, payload, mode)
  if (rejected.length) {
    return json({ ok: false, error: `Not permitted: ${rejected.join(', ')}` }, 403)
  }

  if (isForbiddenMutation(kind, collection, payload)) {
    return json({ ok: false, error: 'A portal PIN cannot be cleared from the portal.' }, 403)
  }

  const rule = ownershipRuleFor(kind, collection)
  if (!rule) return json({ ok: false, error: 'That is not something a portal can change.' }, 403)

  if (mode === 'insert') {
    return await insertRow(ctx, collection, payload, rule)
  }
  // Every collection a portal may update also proves ownership by self, customer or
  // assignment; an insert-only rule reaching this point would skip the check
  // entirely, so refuse rather than trust the table above to stay in step.
  if (rule === 'insert') {
    return json({ ok: false, error: 'That is not something a portal can change.' }, 403)
  }
  return await updateRow(ctx, collection, id, payload, rule)
}

async function updateRow(ctx, collection, id, payload, rule) {
  const { admin, kind, record } = ctx

  if (rule === 'self' && String(id) !== String(record.id)) {
    return json({ ok: false, error: 'Not permitted' }, 403)
  }

  if (rule === 'customer') {
    // Ownership is re-read here, not inferred from the token: the token proves who
    // the visitor is, not that this particular row is theirs.
    const { data: existing } = await admin.from(collection).select('id, customer_id').eq('id', id).maybeSingle()
    if (!existing) return json({ ok: false, error: 'Not found' }, 404)
    if (String(existing.customer_id) !== String(record.id)) {
      return json({ ok: false, error: 'Not permitted' }, 403)
    }
  }

  if (rule === 'contractor') {
    const { data, error } = await admin.rpc('portal_contractor_job_ids', {
      p_company: record.company_id,
      p_contractor: String(record.id),
    })
    if (error) throw error
    const ids = (data || []).map((row) => (typeof row === 'string' ? row : row.id))
    if (!ids.includes(String(id))) return json({ ok: false, error: 'Not permitted' }, 403)
  }

  // company_id is re-asserted even though ownership was proven, so a row can never
  // be moved across tenants by a write.
  const { data, error } = await admin
    .from(collection)
    .update(payload)
    .eq('id', id)
    .eq('company_id', record.company_id)
    .select('*')
  if (error) throw error
  if (!data || !data.length) return json({ ok: false, error: 'Not found' }, 404)

  await logAccess(admin, kind, record.id, record.company_id, ACCESS_OUTCOMES.action, `${collection}:update`)
  return json({ ok: true, record: data[0] })
}

// Which customer of this tenant a portal-created job belongs to.
//
// The B2B import invents an id for the row representing the office, then references it
// from the job — but the resolver refuses to add a second customer for an office that
// is already on file, and hands back the row it found instead. The job would then point
// at an id that was never created. So the id is resolved here, from the id first and
// then from the name the job carries: an id that is real is kept, an id that is not is
// replaced by the customer of that name.
//
// Returns the id to store, '' when the job carries no customer at all, or null when the
// payload names a customer that is not this tenant's — which is a refusal.
async function resolveTenantCustomer(admin, companyId, payload) {
  const wanted = typeof payload.customer_id === 'string' ? payload.customer_id.trim() : ''
  if (wanted) {
    const { data } = await admin
      .from('customers')
      .select('id')
      .eq('id', wanted)
      .eq('company_id', companyId)
      .maybeSingle()
    if (data) return wanted
  }

  const name = typeof payload.customer_name === 'string' ? payload.customer_name.trim() : ''
  if (!name) return wanted ? null : ''

  const { data: byName } = await admin
    .from('customers')
    .select('id')
    .eq('company_id', companyId)
    .eq('company', name)
    .limit(1)
    .maybeSingle()
  return byName ? byName.id : null
}

async function insertRow(ctx, collection, payload, rule) {
  const { admin, kind, record } = ctx

  // A contractor's B2B dispatch job may only be attached to a customer of this same
  // tenant, or a portal could drop work into another business's books.
  if (collection === 'jobs' && payload) {
    const resolved = await resolveTenantCustomer(admin, record.company_id, payload)
    if (resolved === null) return json({ ok: false, error: 'Unknown customer' }, 403)
    if (resolved) payload.customer_id = resolved
    else delete payload.customer_id
  }

  if (rule === 'insert' && collection === 'customers') {
    // The B2B import used to look the office up in the copy of the bundle it was
    // handed, so a concurrent staff edit could produce a duplicate. Resolve it here
    // against the real table instead.
    const name = String(payload?.company ?? '').trim()
    if (name) {
      const { data: existing } = await admin
        .from('customers')
        .select('*')
        .eq('company_id', record.company_id)
        .eq('company', name)
        .limit(1)
        .maybeSingle()
      if (existing) {
        return json({ ok: true, record: existing, existing: true })
      }
    }
  }

  const row = { ...payload, company_id: record.company_id }
  // created_by is stripped from every payload the store sends (SERVER_OWNED_COLUMNS):
  // it is attribution, but it also decides whether the bell treats a notification as
  // machine-generated (utils/notificationVisibility.js reads 'System Engine'), so the
  // resolver says who raised it rather than the caller.
  if (collection === 'notifications') row.created_by = portalCreatedBy(kind)
  const { data, error } = await admin.from(collection).insert(row).select('*')
  if (error) throw error
  if (!data || !data.length) return json({ ok: false, error: 'Not created' }, 500)

  await logAccess(admin, kind, record.id, record.company_id, ACCESS_OUTCOMES.action, `${collection}:insert`)
  return json({ ok: true, record: data[0] })
}
