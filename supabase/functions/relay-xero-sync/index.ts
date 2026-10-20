import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import {
  HttpError, adminClient, clientFor, decryptTokens, handle, json, loadConnection, requireUser, saveConnection, xeroEnv,
} from '../_xero/edge.ts'
import { XeroError } from '../_xero/client.js'
import { timingSafeEqual } from '../_xero/crypto.js'
import { IDLE_REFRESH_DAYS, WORKER_ACTIONS, runJobs } from '../_xero/worker.js'

// ============================================
// RELAY — XERO SYNC WORKER
// ============================================
// Drains xero_sync_jobs (filled by the invoices/customers triggers) into Xero.
// Two callers:
//   * the scheduler, every minute, with header x-relay-cron: <XERO_CRON_SECRET>
//     → every company's due jobs, plus a keep-alive refresh for idle connections
//   * the app after an invoice changes (signed-in user JWT) → that company only,
//     so a sent invoice shows up in Xero without waiting for the next tick
//
// PUBLIC (verify_jwt = false) so the scheduler needs no JWT; this function
// checks the cron secret or the user's token itself.
//
// Up to XERO_SYNC_CONCURRENCY companies (default 8) sync side by side; each
// company's jobs stay one at a time and in order, and a company that is close
// to Xero's per-minute or daily allowance is paused rather than run into 429s.
//
// Request body: {}   Response: { done, skipped, failed, retried, released, paced, refreshed? }
// Secrets: XERO_CRON_SECRET, XERO_SYNC_CONCURRENCY (optional), plus those in _xero/edge.ts

const TIME_BUDGET_MS = 45_000
// Enough claimed work to keep every lane busy for a while; the claim RPC caps it at 200.
const BATCH = 100
const CONCURRENCY = Math.max(1, Math.min(Number(Deno.env.get('XERO_SYNC_CONCURRENCY')) || 8, 25))

serve(handle('relay-xero-sync', async (req) => {
  if (req.method !== 'POST') return json({ error: 'Method Not Allowed' }, 405)
  const env = xeroEnv()
  const admin = adminClient()

  const cronSecret = Deno.env.get('XERO_CRON_SECRET') || ''
  const fromCron = !!cronSecret && timingSafeEqual(req.headers.get('x-relay-cron') || '', cronSecret)
  const companyId = fromCron ? null : (await requireUser(req, admin)).companyId

  const started = Date.now()
  const outOfTime = () => Date.now() - started > TIME_BUDGET_MS
  const db = supabaseAdapter(admin)
  const xeroFor = async (id: string) => {
    const row = await loadConnection(admin, id)
    if (row?.status !== 'active') return null
    return clientFor(admin, env, id, row.tenant_id, await decryptTokens(row, env.tokenKey))
  }

  const total = { done: 0, skipped: 0, failed: 0, retried: 0, released: 0, paced: 0 }
  while (!outOfTime()) {
    const { data: jobs, error } = await admin.rpc('xero_claim_sync_jobs', {
      p_limit: BATCH, p_company_id: companyId, p_actions: WORKER_ACTIONS,
    })
    if (error) throw new Error(`Could not claim jobs: ${error.message}`)
    if (!jobs?.length) break
    const summary = await runJobs({ jobs, db, xeroFor, outOfTime, concurrency: CONCURRENCY })
    for (const k of Object.keys(total) as Array<keyof typeof total>) total[k] += summary[k]
    // Everything released (rate limit, reconnect needed): don't spin on it.
    if (summary.released === jobs.length) break
  }

  const refreshed = fromCron && !outOfTime() ? await refreshIdleConnections(admin, env) : undefined
  return json({ ...total, ...(refreshed !== undefined ? { refreshed } : {}) })
}))

function supabaseAdapter(admin: any) {
  const one = async (query: any) => {
    const { data, error } = await query.maybeSingle()
    if (error) throw new Error(error.message)
    return data
  }
  const write = async (query: any) => {
    const { error } = await query
    if (error) throw new Error(error.message)
  }
  return {
    getInvoice: (id: string) => one(admin.from('invoices').select('*').eq('id', id)),
    getCustomer: (id: string) => one(admin.from('customers').select('*').eq('id', id)),
    getJobs: async (companyId: string, ids: string[]) => {
      if (!ids.length) return []
      const { data, error } = await admin.from('jobs').select('id, number, cost_center_id').eq('company_id', companyId).in('id', ids)
      if (error) throw new Error(error.message)
      return data || []
    },
    getCostCenters: async (companyId: string) => {
      const { data, error } = await admin.from('cost_centers').select('*').eq('company_id', companyId)
      if (error) throw new Error(error.message)
      return data || []
    },
    getXeroSettings: async (companyId: string) => {
      const company = await one(admin.from('companies').select('settings').eq('id', companyId))
      const xero = company?.settings?.xero
      return xero && typeof xero === 'object' ? xero : {}
    },
    // Only xero_* columns are written here, so the enqueue trigger stays quiet.
    updateInvoice: (id: string, fields: Record<string, unknown>) => write(admin.from('invoices').update(fields).eq('id', id)),
    updateCustomer: (id: string, fields: Record<string, unknown>) => write(admin.from('customers').update(fields).eq('id', id)),
    finishJob: (id: number, fields: Record<string, unknown>) =>
      write(admin.from('xero_sync_jobs').update({ ...fields, updated_at: new Date().toISOString() }).eq('id', id)),
    markConnection: (companyId: string, fields: Record<string, unknown>) => saveConnection(admin, companyId, fields),
    // Status changes from Xero go through the RPC, which keeps the enqueue
    // trigger quiet (relay.xero_sync) and never auto-voids.
    applyInvoicePull: async (companyId: string, xeroInvoiceId: string, s: { status: string | null, amountDue: number | null, paidDate: string | null }) => {
      const { data, error } = await admin.rpc('xero_apply_invoice_pull', {
        p_company_id: companyId, p_xero_invoice_id: xeroInvoiceId,
        p_xero_status: s.status, p_amount_due: s.amountDue, p_paid_date: s.paidDate,
      })
      if (error) throw new Error(error.message)
      return data || null
    },
  }
}

// Refresh tokens expire after 60 days unused. Refreshing anything idle for 30
// keeps quiet companies connected; a few per run is plenty.
async function refreshIdleConnections(admin: any, env: ReturnType<typeof xeroEnv>) {
  const cutoff = new Date(Date.now() - IDLE_REFRESH_DAYS * 86_400_000).toISOString()
  const { data: rows, error } = await admin.from('xero_connections').select('*')
    .eq('status', 'active').lt('refreshed_at', cutoff).limit(5)
  if (error) throw new HttpError(500, `Could not list idle connections: ${error.message}`)
  let refreshed = 0
  for (const row of rows || []) {
    try {
      await clientFor(admin, env, row.company_id, row.tenant_id, await decryptTokens(row, env.tokenKey)).refresh()
      refreshed++
    } catch (err) {
      if (err instanceof XeroError && err.kind === 'auth_revoked') {
        await saveConnection(admin, row.company_id, { status: 'needs_reauth', last_error: err.message })
      } else {
        console.warn('relay-xero-sync: idle refresh failed for', row.company_id, err)
      }
    }
  }
  return refreshed
}
