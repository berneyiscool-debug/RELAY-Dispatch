import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
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
    const authHeader = req.headers.get('Authorization') || ''
    if (!authHeader.startsWith('Bearer ')) return json({ error: 'Unauthorized: missing token' }, 401)

    const { data: { user }, error: authError } = await admin.auth.getUser(authHeader.substring(7))
    if (authError || !user) return json({ error: 'Unauthorized: invalid token' }, 401)

    const { data: profile, error: profileError } = await admin
      .from('profiles')
      .select('company_id, role')
      .eq('id', user.id)
      .single()

    if (profileError || !profile) return json({ error: 'Forbidden: no profile' }, 403)
    if (profile.role !== 'admin') return json({ error: 'Forbidden: only administrators can delete a company' }, 403)

    const { data: profiles, error: profilesError } = await admin
      .from('profiles')
      .select('id')
      .eq('company_id', profile.company_id)

    if (profilesError) throw new Error(`Failed to collect company users: ${profilesError.message}`)

    let deletedAuthUsers = 0
    for (const companyProfile of profiles || []) {
      const { error: deleteUserError } = await admin.auth.admin.deleteUser(companyProfile.id)
      if (deleteUserError) {
        throw new Error(`Auth user cleanup failed for ${companyProfile.id}; company data was not deleted: ${deleteUserError.message}`)
      }
      deletedAuthUsers += 1
    }

    // Auth users must be removed before the tenant. Deleting the company
    // cascades profiles, so doing this in the opposite order would make a
    // failed Auth cleanup unrecoverable through the company relationship.
    const { error: companyError } = await admin
      .from('companies')
      .delete()
      .eq('id', profile.company_id)

    if (companyError) throw new Error(`Auth users were deleted, but company data cleanup failed: ${companyError.message}`)

    return json({ success: true, deletedAuthUsers })
  } catch (err) {
    console.error('delete-company error:', err)
    return json({ error: String(err?.message || err) }, 500)
  }
})
