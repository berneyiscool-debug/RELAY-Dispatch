import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import {
  HttpError, adminClient, clientFor, decryptTokens, deleteXeroConnection, finishConnection, handle, json,
  listConnections, loadConnection, requireUser, revokeRefreshToken, saveConnection, skipQueuedJobs, xeroEnv,
} from '../_xero/edge.ts'
import { XeroError } from '../_xero/client.js'
import { grantedTenants, statusPayload, summariseSettings } from '../_xero/connect.js'

// ============================================
// RELAY — XERO STATUS / MANAGE
// ============================================
// One endpoint for the Settings card. Any company user may read the status;
// everything that changes the connection is admin-only.
//
// Request body (one of):
//   {}                       → status
//   { selectTenant: "<id>" } → finish a multi-organisation consent
//   { accounts: true }       → chart of accounts, tracking categories, tax rates
//   { disconnect: true }     → drop the connection and revoke its tokens
//   { retry: <jobId>|"all" } → requeue failed sync jobs
// Response: the status payload ({ connected, status, tenantName, ... }), plus
//   `settings` for { accounts }, or `requeued` for { retry }.
//
// Secrets: see _xero/edge.ts

serve(handle('relay-xero-status', async (req) => {
  if (req.method !== 'POST') return json({ error: 'Method Not Allowed' }, 405)
  const env = xeroEnv()
  const admin = adminClient()
  const body = await req.json().catch(() => ({}))
  const changes = !!(body.selectTenant || body.accounts || body.disconnect || body.retry)
  const caller = await requireUser(req, admin, { adminOnly: changes })
  const companyId = caller.companyId

  let row = await loadConnection(admin, companyId)

  if (body.selectTenant) {
    if (row?.status !== 'choose_tenant') throw new HttpError(409, 'There is no organisation choice waiting.')
    const tokens = await freshTokens(admin, env, row)
    const granted = grantedTenants(await listConnections(tokens.accessToken), tokens.accessToken)
    const tenant = granted.find((t) => t.tenantId === String(body.selectTenant))
    if (!tenant) throw new HttpError(400, 'That organisation was not part of this Xero consent.')
    const outcome = await finishConnection(admin, env, {
      companyId, userId: caller.userId, tokens, tenant,
      otherTenants: granted.filter((t) => t.tenantId !== tenant.tenantId),
    })
    row = await loadConnection(admin, companyId)
    return json({ ...(await status(admin, env, row)), outcome })
  }

  if (body.disconnect) {
    if (row && row.status !== 'disconnected') {
      try {
        const tokens = await decryptTokens(row, env.tokenKey)
        if (tokens.accessToken) await deleteXeroConnection(tokens.accessToken, row.connection_id)
        await revokeRefreshToken(env, tokens.refreshToken)
      } catch (err) {
        console.warn('relay-xero-status: token cleanup on disconnect failed (ignored):', err)
      }
      // tenant_id is kept: reconnecting the same organisation keeps every link.
      await saveConnection(admin, companyId, {
        status: 'disconnected', connection_id: null, last_error: null,
        access_token_enc: null, refresh_token_enc: null, access_expires_at: null,
      })
      const { error } = await skipQueuedJobs(admin, companyId, 'Xero was disconnected.')
      if (error) throw new Error(`Could not clear the Xero queue: ${error.message}`)
    }
    row = await loadConnection(admin, companyId)
    return json(await status(admin, env, row))
  }

  if (body.retry) {
    const jobId = body.retry === 'all' ? null : Number(body.retry)
    if (jobId !== null && !Number.isInteger(jobId)) throw new HttpError(400, 'retry must be a job id or "all"')
    const { data, error } = await admin.rpc('xero_retry_failed_jobs', { p_company_id: companyId, p_job_id: jobId })
    if (error) throw new Error(`Could not requeue: ${error.message}`)
    return json({ ...(await status(admin, env, row)), requeued: data || 0 })
  }

  if (body.accounts) {
    if (row?.status !== 'active') throw new HttpError(409, 'Connect Xero first.')
    const client = clientFor(admin, env, companyId, row.tenant_id, await decryptTokens(row, env.tokenKey))
    try {
      const [accounts, tracking, taxRates] = [
        await client.request('GET', '/Accounts'),
        await client.request('GET', '/TrackingCategories'),
        await client.request('GET', '/TaxRates'),
      ]
      return json({
        ...(await status(admin, env, row)),
        settings: summariseSettings({
          accounts: accounts.data?.Accounts || [],
          trackingCategories: tracking.data?.TrackingCategories || [],
          taxRates: taxRates.data?.TaxRates || [],
        }),
      })
    } catch (err) {
      if (err instanceof XeroError && err.kind === 'auth_revoked') {
        await saveConnection(admin, companyId, { status: 'needs_reauth', last_error: err.message })
        row = await loadConnection(admin, companyId)
        return json(await status(admin, env, row))
      }
      throw err
    }
  }

  return json(await status(admin, env, row))
}))

/** Tokens with at least a couple of minutes left, refreshing (and saving) if not. */
async function freshTokens(admin: any, env: ReturnType<typeof xeroEnv>, row: any) {
  const tokens = await decryptTokens(row, env.tokenKey)
  // No tenant yet (choose_tenant), so the client is only used for its refresh.
  const client = clientFor(admin, env, row.company_id, row.tenant_id || 'pending', tokens)
  const expires = Date.parse(tokens.accessExpiresAt || '')
  if (!Number.isFinite(expires) || expires - Date.now() < 2 * 60 * 1000) await client.refresh()
  return client.tokens as typeof tokens
}

async function status(admin: any, env: ReturnType<typeof xeroEnv>, row: any) {
  const count = async (statuses: string[]) => {
    const { count: n } = await admin.from('xero_sync_jobs')
      .select('id', { count: 'exact', head: true })
      .eq('company_id', row.company_id).in('status', statuses)
    return n || 0
  }
  if (!row || row.status === 'disconnected') return statusPayload(row)
  let tenants: Array<{ tenantId: string, tenantName: string }> = []
  if (row.status === 'choose_tenant') {
    try {
      const tokens = await freshTokens(admin, env, row)
      tenants = grantedTenants(await listConnections(tokens.accessToken), tokens.accessToken)
    } catch (err) {
      console.warn('relay-xero-status: could not list organisations:', err)
    }
  }
  return statusPayload(row, { pendingJobs: await count(['pending', 'running']), failedJobs: await count(['failed']), tenants })
}

