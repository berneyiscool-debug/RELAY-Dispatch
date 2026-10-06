import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import {
  companyTechTypeId,
  ensureProfileForUser,
  findAuthUserByEmail,
  isCompanyStaffEmail,
  isDuplicateAuthUserError,
  readProfileForUser,
  staffProfileValues
} from './provision.js'

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
    const { action, userId, email, username, password, name, role, userTypeId, color, payRate, deactivated } = body

    if (action === 'update') {
      if (!userId) {
        return new Response(
          JSON.stringify({ error: 'Bad Request: userId is required for updates.' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      // Get target profile to prevent updating another admin.
      // A missing profile row is NOT a reason to skip the tenant check: an
      // auth-only account (an invite that never got its profile) is exactly the
      // kind an administrator of any company must not be able to reset.
      const { data: targetProfile } = await supabaseAdmin
        .from('profiles')
        .select('role, company_id')
        .eq('id', userId)
        .single()

      if (!targetProfile || targetProfile.company_id !== profile.company_id) {
        return new Response(
          JSON.stringify({ error: 'Forbidden: That user does not belong to your company.' }),
          { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      if (targetProfile.role === 'admin' && user.id !== userId) {
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

      // Nobody can deactivate their own account — the company would lose its admin.
      if (user.id === userId && deactivated === true) {
        return new Response(
          JSON.stringify({ error: 'You cannot deactivate your own account.' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      // Update Auth record
      const authUpdates: any = {}
      if (email) authUpdates.email = email
      if (password) authUpdates.password = password
      
      const defaultTechType = companyTechTypeId(profile.company_id)
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

      if (deactivated !== undefined) {
        profileUpdates.deactivated = !!deactivated
        profileUpdates.deactivated_at = deactivated ? new Date().toISOString() : null
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

      // The company's own `email_slug` is the only trustworthy link back to it
      // for an Auth account whose profile row was never written: see
      // isCompanyStaffEmail() in provision.js.
      const { data: company, error: companyError } = await supabaseAdmin
        .from('companies')
        .select('email_slug')
        .eq('id', profile.company_id)
        .single()

      if (companyError || !company) {
        return new Response(
          JSON.stringify({ error: 'Internal Server Error: Could not read your company record.' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      const authMetadata = {
        name,
        username,
        role: role || 'technician',
        userTypeId: userTypeId || companyTechTypeId(profile.company_id)
      }

      // Create user directly in Supabase Auth with password, auto-confirming email
      const { data: authData, error: createError } = await supabaseAdmin.auth.admin.createUser({
        email,
        password,
        email_confirm: true, // auto-confirms email so user can log in instantly
        user_metadata: authMetadata,
        // The auth signup trigger reads company membership from app_metadata —
        // user_metadata is client-editable, app_metadata is server-only, so the
        // profile for this user can never be forged by a self-signup.
        app_metadata: {
          ...authMetadata,
          company_id: profile.company_id // Inherit company ID
        }
      })

      let authUser = authData?.user || null
      let repaired = false

      if (createError) {
        if (!isDuplicateAuthUserError(createError)) {
          return new Response(
            JSON.stringify({ error: 'Create User Error: ' + createError.message }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          )
        }

        // A taken address is usually an earlier invite for this same person that
        // stopped halfway: GoTrue created the account but no profile row was
        // written, so the user cannot sign in and is invisible in the team list.
        // Re-adding them finishes that invite. It is only safe for an address
        // that really is this company's staff address and that has no profile —
        // anything else belongs to somebody else's account.
        const existing = await findAuthUserByEmail(supabaseAdmin, email)

        if (!existing || !isCompanyStaffEmail(existing.email, company.email_slug)) {
          return new Response(
            JSON.stringify({ error: 'That email address already has an account. Choose a different username.' }),
            { status: 409, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          )
        }

        const { profile: existingProfile, error: existingProfileError } = await readProfileForUser(supabaseAdmin, existing.id)

        if (existingProfileError) {
          return new Response(
            JSON.stringify({ error: 'Internal Server Error: ' + existingProfileError }),
            { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          )
        }

        if (existingProfile) {
          return new Response(
            JSON.stringify({ error: 'That team member already has an account. Edit them in your team list instead of adding them again.' }),
            { status: 409, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          )
        }

        // Replace the stale metadata rather than merging it: older builds wrote
        // the company into user_metadata, and that value must not survive.
        const { data: repairedData, error: repairError } = await supabaseAdmin.auth.admin.updateUserById(existing.id, {
          password,
          email_confirm: true,
          user_metadata: authMetadata,
          app_metadata: {
            ...(existing.app_metadata || {}),
            ...authMetadata,
            company_id: profile.company_id
          }
        })

        if (repairError) {
          return new Response(
            JSON.stringify({ error: 'Repair User Error: ' + repairError.message }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          )
        }

        authUser = repairedData?.user || existing
        repaired = true
      }

      if (!authUser?.id) {
        return new Response(
          JSON.stringify({ error: 'Internal Server Error: Supabase did not return the new user, so no profile could be created. Try again.' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      // Write the profile row here instead of trusting `on_auth_user_created` to
      // have done it: a deployment of this function that predates the hardened
      // trigger leaves the account without a company, and the user is then sent to
      // "Create your company" on their first sign-in.
      const profileValues = staffProfileValues({
        userId: authUser.id,
        companyId: profile.company_id,
        email: authUser.email || email,
        name,
        username,
        role,
        userTypeId,
        color,
        payRate,
        // Whoever just had a password set for them by someone else changes it on
        // first sign-in, whether the account is new or was repaired.
        forcePasswordChange: repaired
      })

      let ensured
      try {
        ensured = await ensureProfileForUser({
          admin: supabaseAdmin,
          userId: authUser.id,
          create: profileValues.create,
          updates: profileValues.updates
        })
      } catch (profileWriteError) {
        ensured = { error: String(profileWriteError?.message || profileWriteError) }
      }

      if (ensured.error) {
        console.error('Failed to provision the invited user profile:', ensured.error)
        return new Response(
          JSON.stringify({
            error: `Internal Server Error: ${ensured.error} The sign-in account was created (${authUser.id}) but has no company yet. Adding the same username again will finish it.`
          }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      return new Response(
        JSON.stringify({ success: true, user: authUser, repaired }),
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
