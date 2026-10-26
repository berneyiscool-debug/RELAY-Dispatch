import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { decryptToken, encryptToken } from './crypto.js'
import { createXeroClient } from './client.js'
import { XERO_CONNECTIONS_URL, revokeRequest } from './oauth.js'
import { checkOrganisation } from './connect.js'

// ============================================
// RELAY — XERO EDGE-FUNCTION PLUMBING (Deno)
// ============================================
// Shared by relay-xero-connect, relay-xero-callback and relay-xero-status: CORS,
// caller auth, encrypted token storage and finishing a connection. The pure
// rules live in the .js modules next to this file, which the tests cover.
//
// Secrets: XERO_CLIENT_ID, XERO_CLIENT_SECRET, XERO_REDIRECT_URI,
//          XERO_STATE_SECRET, XERO_TOKEN_KEY (32 bytes, base64),
//          RELAY_RETURN_ORIGINS (optional), SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY

export const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

export function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })
}

export function redirect(url: string) {
  return new Response(null, { status: 302, headers: { Location: url, 'Cache-Control': 'no-store' } })
}

export class HttpError extends Error {
  status: number
  constructor(status: number, message: string) { super(message); this.status = status }
}

export function xeroEnv() {
  const env = {
    clientId: Deno.env.get('XERO_CLIENT_ID') || '',
    clientSecret: Deno.env.get('XERO_CLIENT_SECRET') || '',
    redirectUri: Deno.env.get('XERO_REDIRECT_URI') || '',
    stateSecret: Deno.env.get('XERO_STATE_SECRET') || '',
    tokenKey: Deno.env.get('XERO_TOKEN_KEY') || '',
    returnOrigins: Deno.env.get('RELAY_RETURN_ORIGINS') || '',
  }
  const missing = Object.entries({
    XERO_CLIENT_ID: env.clientId, XERO_CLIENT_SECRET: env.clientSecret, XERO_REDIRECT_URI: env.redirectUri,
    XERO_STATE_SECRET: env.stateSecret, XERO_TOKEN_KEY: env.tokenKey,
  }).filter(([, v]) => !v).map(([k]) => k)
  if (missing.length) throw new HttpError(500, `Xero is not configured (${missing.join(', ')})`)
  return env
}

export function adminClient() {
  const url = Deno.env.get('SUPABASE_URL')
  const key = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
  if (!url || !key) throw new HttpError(500, 'Supabase keys are not configured')
  return createClient(url, key)
}

/** The signed-in caller and their company. `adminOnly` for anything that changes the connection. */
export async function requireUser(req: Request, admin: any, { adminOnly = false } = {}) {
  const authHeader = req.headers.get('Authorization') || ''
  if (!authHeader.startsWith('Bearer ')) throw new HttpError(401, 'Unauthorized: missing token')
  const { data: { user }, error } = await admin.auth.getUser(authHeader.substring(7))
  if (error || !user) throw new HttpError(401, 'Unauthorized: invalid token')
  return requireProfile(admin, user.id, { adminOnly })
}

export async function requireProfile(admin: any, userId: string, { adminOnly = false, companyId = '' } = {}) {
  const { data: profile } = await admin
    .from('profiles').select('id, company_id, role, deactivated').eq('id', userId).single()
  if (!profile || profile.deactivated) throw new HttpError(403, 'Forbidden: no active profile')
  if (companyId && String(profile.company_id) !== String(companyId)) throw new HttpError(403, 'Forbidden: wrong company')
  if (adminOnly && profile.role !== 'admin') throw new HttpError(403, 'Only an administrator can manage the Xero connection.')
  return { userId: String(profile.id), companyId: String(profile.company_id), role: String(profile.role || '') }
}

export async function loadConnection(admin: any, companyId: string) {
  const { data, error } = await admin.from('xero_connections').select('*').eq('company_id', companyId).maybeSingle()
  if (error) throw new Error(`Could not read the Xero connection: ${error.message}`)
  return data
}

type Tokens = { accessToken: string, refreshToken: string, accessExpiresAt: string, scopes?: string }

export async function encryptedTokenColumns(tokens: Tokens, tokenKey: string, companyId: string) {
  return {
    access_token_enc: await encryptToken(tokens.accessToken, tokenKey, companyId),
    refresh_token_enc: await encryptToken(tokens.refreshToken, tokenKey, companyId),
    access_expires_at: tokens.accessExpiresAt,
    refreshed_at: new Date().toISOString(),
    ...(tokens.scopes ? { scopes: tokens.scopes } : {}),
  }
}

export async function decryptTokens(row: any, tokenKey: string): Promise<Tokens> {
  return {
    accessToken: await decryptToken(row.access_token_enc, tokenKey, row.company_id),
    refreshToken: await decryptToken(row.refresh_token_enc, tokenKey, row.company_id),
    accessExpiresAt: row.access_expires_at,
  }
}

export async function saveConnection(admin: any, companyId: string, fields: Record<string, unknown>) {
  const { error } = await admin.from('xero_connections')
    .upsert({ company_id: companyId, ...fields, updated_at: new Date().toISOString() }, { onConflict: 'company_id' })
  if (error) throw new Error(`Could not save the Xero connection: ${error.message}`)
}

/** An API client for one tenant whose rotated tokens are saved before use. */
export function clientFor(admin: any, env: ReturnType<typeof xeroEnv>, companyId: string, tenantId: string, tokens: Tokens) {
  return createXeroClient({
    connection: { tenantId, ...tokens },
    clientId: env.clientId,
    clientSecret: env.clientSecret,
    onTokens: async (fresh: Tokens) => {
      const { error } = await admin.from('xero_connections')
        .update({ ...(await encryptedTokenColumns(fresh, env.tokenKey, companyId)), updated_at: new Date().toISOString() })
        .eq('company_id', companyId)
      if (error) throw new Error(`Could not save refreshed Xero tokens: ${error.message}`)
    },
  })
}

/** GET /connections with a bare access token (no tenant yet). */
export async function listConnections(accessToken: string) {
  const res = await fetch(XERO_CONNECTIONS_URL, { headers: { Authorization: `Bearer ${accessToken}`, Accept: 'application/json' } })
  if (!res.ok) throw new Error(`Xero /connections HTTP ${res.status}`)
  return await res.json()
}

/** Best-effort DELETE /connections/{id}: frees the org from the app's connection count. */
export async function deleteXeroConnection(accessToken: string, connectionId: string) {
  if (!connectionId) return
  try {
    await fetch(`${XERO_CONNECTIONS_URL}/${encodeURIComponent(connectionId)}`, {
      method: 'DELETE', headers: { Authorization: `Bearer ${accessToken}` },
    })
  } catch (err) {
    console.warn('Xero connection delete failed (ignored):', err)
  }
}

export async function revokeRefreshToken(env: ReturnType<typeof xeroEnv>, refreshToken: string) {
  if (!refreshToken) return
  try {
    const { url, init } = revokeRequest({ refreshToken, clientId: env.clientId, clientSecret: env.clientSecret })
    await fetch(url, init)
  } catch (err) {
    console.warn('Xero token revoke failed (ignored):', err)
  }
}

/**
 * Bind a company to one granted organisation. Checks the org is usable and not
 * already feeding another company, drops the other orgs from the same consent
 * (each one counts towards the app's Xero connection limit), and stores the
 * encrypted tokens. Returns the outcome to report back to Settings.
 */
export async function finishConnection(
  admin: any,
  env: ReturnType<typeof xeroEnv>,
  { companyId, userId, tokens, tenant, otherTenants = [] }:
    { companyId: string, userId: string, tokens: Tokens, tenant: { tenantId: string, tenantName: string, connectionId: string }, otherTenants?: Array<{ connectionId: string }> },
): Promise<string> {
  const { data: clash } = await admin.from('xero_connections')
    .select('company_id').eq('tenant_id', tenant.tenantId).neq('company_id', companyId).neq('status', 'disconnected').limit(1)
  if (clash && clash.length) return 'tenant_in_use'

  const client = clientFor(admin, env, companyId, tenant.tenantId, tokens)
  const { data } = await client.request('GET', '/Organisation')
  const check = checkOrganisation(data?.Organisations?.[0])

  for (const other of otherTenants) await deleteXeroConnection(client.tokens.accessToken, other.connectionId)

  if (!check.ok) {
    await deleteXeroConnection(client.tokens.accessToken, tenant.connectionId)
    await revokeRefreshToken(env, client.tokens.refreshToken)
    await saveConnection(admin, companyId, {
      tenant_id: tenant.tenantId, tenant_name: check.name || tenant.tenantName, connection_id: null,
      base_currency: check.baseCurrency, status: 'unsupported_currency',
      access_token_enc: null, refresh_token_enc: null, access_expires_at: null,
      last_error: `RELAY supports Xero organisations that use AUD. This one uses ${check.baseCurrency || 'an unknown currency'}.`,
      connected_by: userId,
    })
    return 'unsupported_currency'
  }

  // Reconnecting to a different organisation: release the previous one, and
  // forget the old org's record ids, since they mean nothing in the new org.
  const previous = await loadConnection(admin, companyId)
  if (previous?.tenant_id && previous.tenant_id !== tenant.tenantId) {
    if (previous.connection_id) await deleteXeroConnection(client.tokens.accessToken, previous.connection_id)
    await forgetXeroLinks(admin, companyId, 'Xero was reconnected to a different organisation.')
  }

  await saveConnection(admin, companyId, {
    tenant_id: tenant.tenantId,
    tenant_name: check.name || tenant.tenantName,
    connection_id: tenant.connectionId,
    base_currency: check.baseCurrency,
    status: 'active',
    last_error: null,
    connected_by: userId,
    ...(await encryptedTokenColumns(client.tokens as Tokens, env.tokenKey, companyId)),
  })
  return 'connected'
}

/**
 * Clear a company's links to its old Xero organisation and skip its queued work.
 * Only xero_* columns change, so the enqueue trigger stays quiet.
 */
export async function forgetXeroLinks(admin: any, companyId: string, reason: string) {
  const steps = [
    admin.from('invoices').update({
      xero_invoice_id: null, xero_status: null, xero_amount_due: null, xero_synced_at: null,
      xero_sync_error: null, xero_payment_ids: {},
    }).eq('company_id', companyId).not('xero_invoice_id', 'is', null),
    admin.from('customers').update({ xero_contact_id: null }).eq('company_id', companyId).not('xero_contact_id', 'is', null),
    admin.from('stock').update({
      xero_item_id: null, xero_item_code: null, xero_synced_at: null, xero_sync_error: null,
    }).eq('company_id', companyId).not('xero_item_id', 'is', null),
    skipQueuedJobs(admin, companyId, reason),
  ]
  for (const step of steps) {
    const { error } = await step
    if (error) throw new Error(`Could not reset Xero links: ${error.message}`)
  }
}

export function skipQueuedJobs(admin: any, companyId: string, reason: string) {
  return admin.from('xero_sync_jobs')
    .update({ status: 'skipped', last_error: reason, updated_at: new Date().toISOString() })
    .eq('company_id', companyId).in('status', ['pending', 'failed'])
}

/** Wrap a handler so HttpErrors become JSON responses and anything else a logged 500. */
export function handle(name: string, fn: (req: Request) => Promise<Response>) {
  return async (req: Request) => {
    if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })
    try {
      return await fn(req)
    } catch (err) {
      if (err instanceof HttpError) return json({ error: err.message }, err.status)
      console.error(`${name} error:`, err)
      return json({ error: String((err as Error)?.message || err) }, 500)
    }
  }
}
