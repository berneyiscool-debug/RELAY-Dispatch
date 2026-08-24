import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Provider -> server-side key env var. Add providers here without touching the
// request logic (e.g. a future DeepSeek multimodal model).
const PROVIDER_KEYS = {
  deepseek: 'DEEPSEEK_API_KEY',
  gemini: 'GEMINI_API_KEY',
}

function pickProvider(endpoint) {
  if (endpoint.includes('generativelanguage.googleapis.com')) return 'gemini'
  return 'deepseek'
}

// In-memory anti-abuse rate limit (per function instance). Stops a runaway loop
// or scripted bot from burning the shared key in seconds; never trips for a real
// human. Not a usage cap — legitimate heavy use is welcome.
const WINDOW_MS = 10_000
const MAX_REQUESTS = 10
const hits = new Map()

function rateLimited(key) {
  const now = Date.now()
  const list = (hits.get(key) || []).filter((t) => now - t < WINDOW_MS)
  if (list.length >= MAX_REQUESTS) {
    hits.set(key, list)
    return true
  }
  list.push(now)
  hits.set(key, list)
  return false
}

function json(obj, status) {
  return new Response(JSON.stringify(obj), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')
    if (!supabaseUrl || !supabaseAnonKey) {
      return json({ error: 'Supabase environment is not configured.' }, 500)
    }

    const authHeader = req.headers.get('Authorization') || ''
    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
      auth: { persistSession: false, autoRefreshToken: false },
    })

    // 1. Auth — reject anonymous callers. supabase.functions.invoke sends the
    //    signed-in user's JWT automatically.
    const token = authHeader.replace('Bearer ', '')
    const { data: { user }, error: authError } = await supabase.auth.getUser(token)
    if (authError || !user) {
      return json({ error: 'Unauthorized.' }, 401)
    }

    // 2. Anti-abuse rate limit (per user).
    if (rateLimited(user.id)) {
      return json({ error: 'Too many requests. Please slow down.' }, 429)
    }

    const { messages, endpoint, model } = await req.json()
    const targetEndpoint = endpoint || 'https://api.deepseek.com/chat/completions'

    const provider = pickProvider(targetEndpoint)
    const apiKey = Deno.env.get(PROVIDER_KEYS[provider] || '')
    if (!apiKey) {
      return json({ error: `${PROVIDER_KEYS[provider]} is not set on Supabase.` }, 500)
    }

    const response = await fetch(targetEndpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: model || 'deepseek-chat',
        messages,
        temperature: 0.3,
      }),
    })

    if (!response.ok) {
      const text = await response.text()
      return json(
        { error: `AI API error (model ${model}): ${response.status} - ${text}` },
        response.status,
      )
    }

    const data = await response.json()

    // 3. Internal metering — record token usage per org. Best-effort: never fail
    //    the request because logging failed.
    try {
      const { company_id } = await supabase
        .from('profiles')
        .select('company_id')
        .eq('id', user.id)
        .single()

      let tier = 'cloud'
      if (company_id) {
        const { data: company } = await supabase
          .from('companies')
          .select('settings')
          .eq('id', company_id)
          .single()
        if (company?.settings?.ai?.tier === 'cloudPlus') tier = 'cloudPlus'
      }

      const usage = data?.usage || {}
      await supabase.from('llm_usage').insert({
        company_id,
        user_id: user.id,
        model: model || 'deepseek-chat',
        provider,
        tier,
        prompt_tokens: usage.prompt_tokens ?? 0,
        completion_tokens: usage.completion_tokens ?? 0,
        total_tokens: usage.total_tokens ?? 0,
      })
    } catch (logErr) {
      console.error('llm_usage log failed:', logErr)
    }

    return json(data, 200)
  } catch (error) {
    return json({ error: error.message }, 400)
  }
})
