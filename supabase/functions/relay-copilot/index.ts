import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { messages, endpoint, model } = await req.json()
    const targetEndpoint = endpoint || 'https://api.deepseek.com/chat/completions'

    // Pick the server-side key that matches the target provider. Text chat runs on
    // DeepSeek; image/PDF (vision) requests target Gemini's OpenAI-compatible endpoint,
    // which needs the Gemini key instead.
    const isGemini = targetEndpoint.includes('generativelanguage.googleapis.com')
    const apiKey = isGemini
      ? Deno.env.get('GEMINI_API_KEY')
      : Deno.env.get('DEEPSEEK_API_KEY')

    if (!apiKey) {
      const which = isGemini ? 'GEMINI_API_KEY' : 'DEEPSEEK_API_KEY'
      return new Response(
        JSON.stringify({ error: `${which} is not set on Supabase.` }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const response = await fetch(targetEndpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: model || 'deepseek-chat',
        messages,
        temperature: 0.3
      })
    })

    if (!response.ok) {
      const text = await response.text()
      return new Response(
        JSON.stringify({ error: `AI API error (model ${model}): ${response.status} - ${text}` }),
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
