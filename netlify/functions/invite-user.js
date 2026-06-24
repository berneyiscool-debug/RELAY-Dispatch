// ============================================
// NETLIFY FUNCTION: CREATE & INVITE USER
// ============================================
const { createClient } = require('@supabase/supabase-js');

const headers = {
  "Content-Type": "application/json",
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
  "Access-Control-Allow-Methods": "POST, OPTIONS"
};

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

exports.handler = async (event, context) => {
  // CORS Preflight handling
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ error: 'Method Not Allowed' })
    };
  }

  if (!supabaseUrl || !supabaseServiceKey) {
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: 'Internal Server Error: Supabase keys are not configured.' })
    };
  }

  const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

  try {
    // 1. Authenticate calling Admin/Manager user using their JWT access token
    const authHeader = event.headers.authorization || '';
    if (!authHeader.startsWith('Bearer ')) {
      return {
        statusCode: 401,
        headers,
        body: JSON.stringify({ error: 'Unauthorized: Missing token' })
      };
    }

    const token = authHeader.substring(7);
    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token);

    if (authError || !user) {
      return {
        statusCode: 401,
        headers,
        body: JSON.stringify({ error: 'Unauthorized: Invalid token' })
      };
    }

    // 2. Fetch calling user's profile to confirm they are an Admin or Manager
    const { data: profile, error: profileError } = await supabaseAdmin
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single();

    if (profileError || !profile || (profile.role !== 'admin' && profile.role !== 'manager')) {
      return {
        statusCode: 403,
        headers,
        body: JSON.stringify({ error: 'Forbidden: Only administrators can create users.' })
      };
    }

    // 3. Extract payload
    const { action, userId, email, username, password, name, role, userTypeId, color, payRate } = JSON.parse(event.body || '{}');

    if (action === 'update') {
      if (!userId) {
        return {
          statusCode: 400,
          headers,
          body: JSON.stringify({ error: 'Bad Request: userId is required for updates.' })
        };
      }

      // 1. Get target profile to prevent updating another admin
      const { data: targetProfile } = await supabaseAdmin
        .from('profiles')
        .select('role')
        .eq('id', userId)
        .single();

      if (targetProfile && targetProfile.role === 'admin' && user.id !== userId) {
        return {
          statusCode: 403,
          headers,
          body: JSON.stringify({ error: 'Forbidden: You cannot modify another administrator\'s account.' })
        };
      }

      // 2. Prevent setting role or userType to Admin for other users
      const isAdminType = (id) => id === 'ut_admin' || (id && id.endsWith('_ut_admin'));
      if (user.id !== userId && (role === 'admin' || isAdminType(userTypeId))) {
        return {
          statusCode: 400,
          headers,
          body: JSON.stringify({ error: 'Only one administrator is allowed per company.' })
        };
      }

      // Update Auth record
      const authUpdates = {};
      if (email) authUpdates.email = email;
      if (password) authUpdates.password = password;
      
      const defaultTechType = profile.company_id === '8dc14565-23c2-4f7d-aeb3-1da615df7644' ? 'ut_tech' : `${profile.company_id}_ut_tech`;
      authUpdates.user_metadata = {
        name,
        role: role || 'technician',
        userTypeId: userTypeId || defaultTechType,
        username: username
      };

      const { data: authData, error: updateAuthError } = await supabaseAdmin.auth.admin.updateUserById(
        userId,
        authUpdates
      );

      if (updateAuthError) {
        return {
          statusCode: 400,
          headers,
          body: JSON.stringify({ error: 'Update User Auth Error: ' + updateAuthError.message })
        };
      }

      // Update DB Profile record
      const profileUpdates = {
        name,
        username,
        email,
        role: role || 'technician',
        user_type_id: userTypeId,
        color: color || '#1B6DE0',
        pay_rate: payRate || 0
      };

      if (password) {
        profileUpdates.force_password_change = true; // Force password change on next login if admin reset it!
      }

      const { error: updateProfileError } = await supabaseAdmin
        .from('profiles')
        .update(profileUpdates)
        .eq('id', userId);

      if (updateProfileError) {
        return {
          statusCode: 400,
          headers,
          body: JSON.stringify({ error: 'Update Profile Error: ' + updateProfileError.message })
        };
      }

      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({
          success: true,
          user: authData?.user
        })
      };

    } else {
      // DEFAULT: Create new user
      if (!email || !name || !password) {
        return {
          statusCode: 400,
          headers,
          body: JSON.stringify({ error: 'Bad Request: Email, Name, and Password are required.' })
        };
      }

      const isAdminType = (id) => id === 'ut_admin' || (id && id.endsWith('_ut_admin'));
      if (role === 'admin' || isAdminType(userTypeId)) {
        return {
          statusCode: 400,
          headers,
          body: JSON.stringify({ error: 'Only one administrator is allowed per company.' })
        };
      }

      const defaultTechType = profile.company_id === '8dc14565-23c2-4f7d-aeb3-1da615df7644' ? 'ut_tech' : `${profile.company_id}_ut_tech`;
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
      });

      if (createError) {
        return {
          statusCode: 400,
          headers,
          body: JSON.stringify({ error: 'Create User Error: ' + createError.message })
        };
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
        .eq('id', authData?.user?.id);

      if (updateError) {
        console.error('Failed to update created user profile details:', updateError);
      }

      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({
          success: true,
          user: authData?.user
        })
      };
    }

  } catch (error) {
    console.error('Netlify Create/Update User Error:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: 'Internal Server Error: ' + error.message })
    };
  }
};
