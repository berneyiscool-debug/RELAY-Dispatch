// ============================================
// NETLIFY FUNCTION: INVITE USER
// ============================================
const { createClient } = require('@supabase/supabase-js');

const headers = {
  "Content-Type": "application/json",
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
  "Access-Control-Allow-Methods": "POST, OPTIONS"
};

// Initialize Supabase client with the admin Service Role key (bypasses RLS to invite users)
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
    // 1. Authenticate the calling Admin user using their JWT access token
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
        body: JSON.stringify({ error: 'Forbidden: Only administrators can invite users.' })
      };
    }

    // 3. Extract invitation payload
    const { email, name, role, userTypeId, color, payRate } = JSON.parse(event.body || '{}');

    if (!email || !name) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Bad Request: Email and Name are required.' })
      };
    }

    // 4. Invite user via Supabase Auth Admin API
    // The user_metadata will contain name, role, userTypeId, color, payRate, and company_id.
    // Our DB trigger `on_auth_user_created` will automatically create the profile row from this metadata!
    const { data: inviteData, error: inviteError } = await supabaseAdmin.auth.admin.inviteUserByEmail(
      email,
      {
        data: {
          name,
          phone: '',
          role: role || 'technician',
          userTypeId: userTypeId || 'ut_tech',
          company_id: profile.company_id // Inherit the admin's company id for security
        }
      }
    );

    if (inviteError) {
      // If user already exists in auth.users, check if they are in our profiles table.
      // If not, we can manually create a profile link.
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Invite Error: ' + inviteError.message })
      };
    }

    // 5. Update the profile with color and payRate (since inviteUserByEmail metadata is created automatically)
    // The DB trigger creates the profile row, so we can update it immediately.
    // Wait a brief millisecond for trigger to execute if needed
    const { error: updateError } = await supabaseAdmin
      .from('profiles')
      .update({
        color: color || '#1B6DE0',
        pay_rate: payRate || 0,
        user_type_id: userTypeId
      })
      .eq('id', inviteData.user.id);

    if (updateError) {
      console.error('Failed to update invited user details:', updateError);
    }

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: true,
        user: inviteData.user
      })
    };

  } catch (error) {
    console.error('Netlify Invite User Error:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: 'Internal Server Error: ' + error.message })
    };
  }
};
