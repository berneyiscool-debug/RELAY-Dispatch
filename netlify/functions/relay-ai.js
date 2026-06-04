// ============================================
// NETLIFY FUNCTION: RELAY AI
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
    const body = JSON.parse(event.body || '{}');
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        message: 'Relay AI backend endpoint is online. DeepSeek V4 integration coming in Phase 4.',
        receivedText: body.text
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
