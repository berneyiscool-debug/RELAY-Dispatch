// ============================================
// RELAY — BACKUP EMAIL CONFIRMATION ENDPOINT
// ============================================
//   { action: 'confirm', token }      public: redeems the link from the email
//   { action: 'resend', userId? }     signed in: sends a fresh link — to the
//                                     caller, or (admin/manager) to a user in
//                                     their own company
//
// Deployed with verify_jwt off because 'confirm' is opened by someone who is
// not signed in; 'resend' checks the caller's JWT itself.
//
// Env: RESEND_API_KEY, RELAY_EMAIL_DOMAIN (default relaydispatch.com.au).

import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { confirmBackupEmail, startBackupEmailConfirmation } from '../_shared/backupEmailConfirmation.js'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS'
}

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })
  if (req.method !== 'POST') return json({ error: 'Method Not Allowed' }, 405)

  const supabaseUrl = Deno.env.get('SUPABASE_URL')
  const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
  if (!supabaseUrl || !serviceKey) return json({ error: 'Internal Server Error: Supabase keys are not configured.' }, 500)
  const admin = createClient(supabaseUrl, serviceKey)

  try {
    const body = await req.json().catch(() => ({}))

    if (body.action === 'confirm') {
      const result = await confirmBackupEmail({ admin, token: body.token })
      return result.confirmed ? json({ success: true }) : json({ error: result.error }, result.status)
    }

    if (body.action === 'resend') {
      const authHeader = req.headers.get('Authorization') || ''
      if (!authHeader.startsWith('Bearer ')) return json({ error: 'Unauthorized: Missing token' }, 401)
      const { data: { user }, error: authError } = await admin.auth.getUser(authHeader.substring(7))
      if (authError || !user) return json({ error: 'Unauthorized: Invalid token' }, 401)

      const targetId = body.userId || user.id
      if (targetId !== user.id) {
        const { data: caller } = await admin.from('profiles').select('role, company_id').eq('id', user.id).maybeSingle()
        const { data: target } = await admin.from('profiles').select('company_id').eq('id', targetId).maybeSingle()
        if (!caller || (caller.role !== 'admin' && caller.role !== 'manager')) {
          return json({ error: 'Forbidden: Only administrators can resend for another user.' }, 403)
        }
        if (!target || target.company_id !== caller.company_id) {
          return json({ error: 'Forbidden: That user does not belong to your company.' }, 403)
        }
      }

      const result = await startBackupEmailConfirmation({
        admin,
        userId: targetId,
        resendKey: Deno.env.get('RESEND_API_KEY'),
        domain: Deno.env.get('RELAY_EMAIL_DOMAIN') || undefined,
      })
      return result.sent
        ? json({ success: true, email: result.email })
        : json({ error: result.error, retryAfterMs: result.retryAfterMs }, result.status)
    }

    return json({ error: 'Bad Request: unknown action.' }, 400)
  } catch (error) {
    console.error('relay-confirm-email error:', error)
    return json({ error: 'Internal Server Error: ' + (error?.message || error) }, 500)
  }
})
