import { corsHeaders } from '@supabase/supabase-js/cors'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { symptoms, age_group, location } = await req.json()

    if (!symptoms || !symptoms.trim()) {
      return new Response(JSON.stringify({ error: 'Symptoms are required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const apiKey = Deno.env.get('LOVABLE_API_KEY')
    if (!apiKey) {
      return new Response(JSON.stringify({ error: 'API key not configured' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const prompt = `You are an expert medical AI assistant for Indian patients. Analyze the following symptoms and provide a detailed health report.

Patient Info:
- Symptoms: ${symptoms}
- Age Group: ${age_group || 'Adult'}
- Location: ${location || 'India'}

Return ONLY a valid JSON object with this exact structure (no markdown, no code fences):
{
  "summary": "Brief 2-3 sentence summary of likely condition",
  "risk_level": "safe" or "risk" or "critical",
  "confidence": 75,
  "conditions": [
    {"name": "Condition Name", "probability": 80, "description": "Brief description"}
  ],
  "medicines": [
    {
      "name": "Medicine Name (e.g. Paracetamol 500mg)",
      "dosage": "1 tablet twice daily after food",
      "duration": "3-5 days",
      "how_it_works": "Single line explaining how this medicine helps for the specific condition/symptoms described",
      "buy_url": "https://www.1mg.com/search/all?name=MEDICINE_NAME"
    }
  ],
  "remedies": [
    {"name": "Remedy name", "description": "How to do it"}
  ],
  "advice": ["Advice point 1", "Advice point 2"],
  "doctors": [
    {"specialization": "e.g. General Physician", "reason": "Why this specialist"}
  ],
  "emergency": null or "Emergency instruction if critical"
}

IMPORTANT RULES:
- For each medicine, "how_it_works" must be a single line explaining how this specific medicine works for the patient's particular symptoms/condition
- For buy_url, encode the medicine name for the URL (replace spaces with +)
- If risk_level is "critical" and symptoms involve blood loss, bleeding, accidents, or need for blood transfusion, set emergency to include "BLOOD_NEEDED"
- If risk_level is "critical" and symptoms involve organ failure or transplant needs, set emergency to include "ORGAN_NEEDED"
- Recommend specialists relevant to the location: ${location || 'India'}
- Be accurate and helpful but always recommend consulting a real doctor`

    const response = await fetch('https://api.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.3,
      }),
    })

    if (!response.ok) {
      const errText = await response.text()
      console.error('AI API error:', errText)
      return new Response(JSON.stringify({ error: 'AI service error' }), {
        status: 502,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const aiData = await response.json()
    let content = aiData.choices?.[0]?.message?.content || ''

    // Clean and parse JSON
    content = content.replace(/```json\s*/g, '').replace(/```\s*/g, '').trim()
    const firstBrace = content.indexOf('{')
    const lastBrace = content.lastIndexOf('}')
    if (firstBrace === -1 || lastBrace === -1) {
      console.error('No JSON found in response:', content)
      return new Response(JSON.stringify({ error: 'AI response format error' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    let jsonStr = content.substring(firstBrace, lastBrace + 1)
    // Fix trailing commas
    jsonStr = jsonStr.replace(/,\s*([}\]])/g, '$1')

    let result
    try {
      result = JSON.parse(jsonStr)
    } catch (e) {
      console.error('JSON parse error:', e.message, 'Raw:', jsonStr.substring(0, 500))
      return new Response(JSON.stringify({ error: 'Failed to parse AI response' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // Ensure all required fields
    result.risk_level = result.risk_level || 'safe'
    result.confidence = result.confidence || 75
    result.conditions = result.conditions || []
    result.medicines = result.medicines || []
    result.remedies = result.remedies || []
    result.advice = result.advice || []
    result.doctors = result.doctors || []
    result.summary = result.summary || 'Analysis complete.'
    result.location = location || ''

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (error) {
    console.error('Edge function error:', error)
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
