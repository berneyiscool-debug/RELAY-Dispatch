import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// The only host the proxy may talk to. Never trust a caller-supplied URL:
// forwarding the server-side API key to an arbitrary endpoint exfiltrates it.
// Deputy is DeepSeek-only, and clients no longer send an endpoint at all, so the
// allowlist below is defence in depth for older deployed builds.
// The single model: Flash covers chat AND the attachment images. The legacy ids
// `deepseek-chat` / `deepseek-reasoner` were retired on 2026-07-24, and V4-Pro
// cannot read images.
const ALLOWED_HOST = 'api.deepseek.com'
const API_KEY_ENV = 'DEEPSEEK_API_KEY'
const DEFAULT_MODEL = 'deepseek-flash'
const DEFAULT_ENDPOINT = 'https://api.deepseek.com/chat/completions'

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // ── Authenticate the caller ────────────────────────────────────────
    const supabaseUrl = Deno.env.get('SUPABASE_URL')
    const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
    if (!supabaseUrl || !serviceKey) {
      return new Response(
        JSON.stringify({ error: 'Server configuration error.' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const authHeader = req.headers.get('Authorization') || ''
    if (!authHeader.startsWith('Bearer ')) {
      return new Response(JSON.stringify({ error: 'Unauthorized: missing token' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    }

    const admin = createClient(supabaseUrl, serviceKey)
    const { data: { user }, error: authErr } = await admin.auth.getUser(authHeader.substring(7))
    if (authErr || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized: invalid token' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    }

    // ── Resolve target against the allowlist ───────────────────────────
    const { messages, endpoint, model } = await req.json()
    if (!Array.isArray(messages) || messages.length === 0) {
      return new Response(JSON.stringify({ error: 'messages is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    }

    let targetUrl: URL
    try {
      targetUrl = new URL(endpoint || DEFAULT_ENDPOINT)
    } catch {
      return new Response(JSON.stringify({ error: 'Invalid endpoint URL.' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    }

    if (targetUrl.protocol !== 'https:') {
      return new Response(JSON.stringify({ error: 'Only https endpoints are allowed.' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    }

    if (targetUrl.hostname !== ALLOWED_HOST) {
      return new Response(JSON.stringify({ error: 'Endpoint is not allowed.' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    }

    const apiKey = Deno.env.get(API_KEY_ENV)
    if (!apiKey) {
      return new Response(
        JSON.stringify({ error: `${API_KEY_ENV} is not set on Supabase.` }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const response = await fetch(targetUrl.toString(), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: model || DEFAULT_MODEL,
        messages,
        temperature: 0.3
      })
    })

    if (!response.ok) {
      const text = await response.text()
      return new Response(
        JSON.stringify({ error: `AI API error (model ${model || DEFAULT_MODEL}): ${response.status} - ${text}` }),
        { status: response.status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const data = await response.json()
    return new Response(
      JSON.stringify(data),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
