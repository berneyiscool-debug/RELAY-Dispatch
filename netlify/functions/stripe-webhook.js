// ============================================
// NETLIFY FUNCTION: STRIPE WEBHOOK
// ============================================

const headers = {
  "Content-Type": "application/json",
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS"
};

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

  try {
    // Note: Stripe webhook verification will require raw body signatures.
    // For now, we stub a success response.
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        message: 'Stripe webhook endpoint is online. Full signature verification coming in Phase 3.'
      })
    };
  } catch (error) {
    return {
      statusCode: 400,
      headers,
      body: JSON.stringify({ error: 'Bad Request: ' + error.message })
    };
  }
};
