import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { adminClient, handle, json, requireUser, xeroEnv } from '../_xero/edge.ts'
import { buildAuthorizeUrl } from '../_xero/oauth.js'
import { signState } from '../_xero/crypto.js'
import { connectReturnUrl } from '../_xero/connect.js'
import { parseExtraOrigins } from '../_shared/returnUrls.js'

// ============================================
// RELAY — XERO CONNECT (start OAuth)
// ============================================
// Returns the Xero consent URL for the calling admin's company. The signed
// `state` carries the company, the admin and where to send them back, so the
// public callback can't be replayed into another company. Auth: admin.
//
// Request body: { "returnPath"? }   e.g. "/settings?tab=cost_centers"
// Response:     { "url": "https://login.xero.com/identity/connect/authorize?..." }
//
// Secrets: see _xero/edge.ts

serve(handle('relay-xero-connect', async (req) => {
  if (req.method !== 'POST') return json({ error: 'Method Not Allowed' }, 405)
  const env = xeroEnv()
  const admin = adminClient()
  const caller = await requireUser(req, admin, { adminOnly: true })

  const { returnPath } = await req.json().catch(() => ({}))
  const returnUrl = connectReturnUrl({
    origin: req.headers.get('origin'),
    returnPath,
    extraOrigins: parseExtraOrigins(env.returnOrigins),
  })
  const state = await signState({ companyId: caller.companyId, userId: caller.userId, returnUrl }, env.stateSecret)
  return json({ url: buildAuthorizeUrl({ clientId: env.clientId, redirectUri: env.redirectUri, state }) })
}))
