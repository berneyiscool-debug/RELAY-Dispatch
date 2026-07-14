import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS'
}

serve(async (req) => {
  // CORS Preflight handling
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  if (req.method !== 'POST') {
    return new Response(
      JSON.stringify({ error: 'Method Not Allowed' }),
      { status: 405, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL')
  const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')

  if (!supabaseUrl || !supabaseServiceKey) {
    return new Response(
      JSON.stringify({ error: 'Internal Server Error: Supabase keys are not configured.' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }

  const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey)

  try {
    // 1. Authenticate calling Admin/Manager user using their JWT access token
    const authHeader = req.headers.get('Authorization') || ''
    if (!authHeader.startsWith('Bearer ')) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized: Missing token' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const token = authHeader.substring(7)
    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token)

    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized: Invalid token' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // 2. Fetch calling user's profile to confirm they are an Admin or Manager
    const { data: profile, error: profileError } = await supabaseAdmin
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single()

    if (profileError || !profile || (profile.role !== 'admin' && profile.role !== 'manager')) {
      return new Response(
        JSON.stringify({ error: 'Forbidden: Only administrators can create users.' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // 3. Extract payload
    const body = await req.json()
    const { action, userId, email, username, password, name, role, userTypeId, color, payRate } = body

    if (action === 'update') {
      if (!userId) {
        return new Response(
          JSON.stringify({ error: 'Bad Request: userId is required for updates.' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      // Get target profile to prevent updating another admin
      const { data: targetProfile } = await supabaseAdmin
        .from('profiles')
        .select('role')
        .eq('id', userId)
        .single()

      if (targetProfile && targetProfile.role === 'admin' && user.id !== userId) {
        return new Response(
          JSON.stringify({ error: "Forbidden: You cannot modify another administrator's account." }),
          { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      // Prevent setting role or userType to Admin for other users
      const isAdminType = (id: string) => id === 'ut_admin' || (id && id.endsWith('_ut_admin'))
      if (user.id !== userId && (role === 'admin' || isAdminType(userTypeId))) {
        return new Response(
          JSON.stringify({ error: 'Only one administrator is allowed per company.' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      // Update Auth record
      const authUpdates: any = {}
      if (email) authUpdates.email = email
      if (password) authUpdates.password = password
      
      const defaultTechType = profile.company_id === '8dc14565-23c2-4f7d-aeb3-1da615df7644' ? 'ut_tech' : `${profile.company_id}_ut_tech`
      authUpdates.user_metadata = {
        name,
        role: role || 'technician',
        userTypeId: userTypeId || defaultTechType,
        username: username
      }

      const { data: authData, error: updateAuthError } = await supabaseAdmin.auth.admin.updateUserById(
        userId,
        authUpdates
      )

      if (updateAuthError) {
        return new Response(
          JSON.stringify({ error: 'Update User Auth Error: ' + updateAuthError.message }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      // Update DB Profile record
      const profileUpdates: any = {
        name,
        username,
        email,
        role: role || 'technician',
        user_type_id: userTypeId,
        color: color || '#1B6DE0',
        pay_rate: payRate || 0
      }

      if (password) {
        profileUpdates.force_password_change = true // Force password change on next login if admin reset it!
      }

      const { error: updateProfileError } = await supabaseAdmin
        .from('profiles')
        .update(profileUpdates)
        .eq('id', userId)

      if (updateProfileError) {
        return new Response(
          JSON.stringify({ error: 'Update Profile Error: ' + updateProfileError.message }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      return new Response(
        JSON.stringify({ success: true, user: authData?.user }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )

    } else {
      // DEFAULT: Create new user
      if (!email || !name || !password) {
        return new Response(
          JSON.stringify({ error: 'Bad Request: Email, Name, and Password are required.' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      const isAdminType = (id: string) => id === 'ut_admin' || (id && id.endsWith('_ut_admin'))
      if (role === 'admin' || isAdminType(userTypeId)) {
        return new Response(
          JSON.stringify({ error: 'Only one administrator is allowed per company.' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      const defaultTechType = profile.company_id === '8dc14565-23c2-4f7d-aeb3-1da615df7644' ? 'ut_tech' : `${profile.company_id}_ut_tech`
      // Create user directly in Supabase Auth with password, auto-confirming email
      const { data: authData, error: createError } = await supabaseAdmin.auth.admin.createUser({
        email,
        password,
        email_confirm: true, // auto-confirms email so user can log in instantly
        user_metadata: {
          name,
          username,
          role: role || 'technician',
          userTypeId: userTypeId || defaultTechType,
          company_id: profile.company_id // Inherit company ID
        }
      })

      if (createError) {
        return new Response(
          JSON.stringify({ error: 'Create User Error: ' + createError.message }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      // Update the profile with color, payRate and userTypeId
      const { error: updateError } = await supabaseAdmin
        .from('profiles')
        .update({
          color: color || '#1B6DE0',
          pay_rate: payRate || 0,
          user_type_id: userTypeId,
          username: username,
          force_password_change: false
        })
        .eq('id', authData?.user?.id)

      if (updateError) {
        console.error('Failed to update created user profile details:', updateError)
      }

      return new Response(
        JSON.stringify({ success: true, user: authData?.user }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

  } catch (error) {
    console.error('Create/Update User Error:', error)
    return new Response(
      JSON.stringify({ error: 'Internal Server Error: ' + error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
