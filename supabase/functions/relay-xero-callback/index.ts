import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import {
  adminClient, encryptedTokenColumns, finishConnection, listConnections, redirect, requireProfile, saveConnection, xeroEnv,
} from '../_xero/edge.ts'
import { codeExchangeRequest, parseTokenResponse } from '../_xero/oauth.js'
import { verifyState } from '../_xero/crypto.js'
import { callbackRedirect, grantedTenants } from '../_xero/connect.js'
import { PUBLIC_APP_BASE, parseExtraOrigins } from '../_shared/returnUrls.js'

// ============================================
// RELAY — XERO CALLBACK (OAuth redirect URI)
// ============================================
// Xero sends the admin's browser here after consent. Always answers with a 302
// back to Settings carrying ?xero=<outcome>:
//   connected | choose (several orgs granted; pick one in Settings) | cancelled |
//   no_org | unsupported_currency | tenant_in_use | forbidden | error
//
// PUBLIC (verify_jwt = false): a top-level browser redirect carries no RELAY
// JWT. Trust comes from the signed state (company + admin + return URL, 10 min)
// and re-checking that the admin still is one. There is no supabase/config.toml
// in this repo, so verify_jwt = false is set when deploying.
//
// Secrets: see _xero/edge.ts. XERO_REDIRECT_URI must be this function's URL.

const FALLBACK = `${PUBLIC_APP_BASE}/#/settings?tab=accounting`

serve(async (req) => {
  if (req.method !== 'GET') return new Response('Method Not Allowed', { status: 405 })
  let extraOrigins: string[] = []
  let back = FALLBACK
  try {
    const env = xeroEnv()
    extraOrigins = parseExtraOrigins(env.returnOrigins)
    const params = new URL(req.url).searchParams

    const state = await verifyState(params.get('state'), env.stateSecret)
    if (!state) return redirect(callbackRedirect(FALLBACK, 'error', extraOrigins))
    back = String(state.returnUrl || FALLBACK)

    if (params.get('error')) {
      return redirect(callbackRedirect(back, params.get('error') === 'access_denied' ? 'cancelled' : 'error', extraOrigins))
    }

    const admin = adminClient()
    try {
      await requireProfile(admin, String(state.userId), { adminOnly: true, companyId: String(state.companyId) })
    } catch {
      return redirect(callbackRedirect(back, 'forbidden', extraOrigins))
    }

    const exchange = codeExchangeRequest({
      code: params.get('code') || '', redirectUri: env.redirectUri, clientId: env.clientId, clientSecret: env.clientSecret,
    })
    const tokenRes = await fetch(exchange.url, exchange.init)
    if (!tokenRes.ok) throw new Error(`Xero code exchange HTTP ${tokenRes.status}`)
    const tokens = parseTokenResponse(await tokenRes.json())

    const tenants = grantedTenants(await listConnections(tokens.accessToken), tokens.accessToken)
    if (!tenants.length) return redirect(callbackRedirect(back, 'no_org', extraOrigins))

    if (tenants.length > 1) {
      // Hold the tokens until the admin picks one in Settings (relay-xero-status
      // { selectTenant }). Syncing pauses until then; tenant_id still names any
      // previous organisation, so switching away from it is detected.
      await saveConnection(admin, String(state.companyId), {
        status: 'choose_tenant', last_error: null, connected_by: String(state.userId),
        ...(await encryptedTokenColumns(tokens, env.tokenKey, String(state.companyId))),
      })
      return redirect(callbackRedirect(back, 'choose', extraOrigins))
    }

    const outcome = await finishConnection(admin, env, {
      companyId: String(state.companyId), userId: String(state.userId), tokens, tenant: tenants[0],
    })
    return redirect(callbackRedirect(back, outcome, extraOrigins))
  } catch (err) {
    console.error('relay-xero-callback error:', err)
    return redirect(callbackRedirect(back, 'error', extraOrigins))
  }
})
