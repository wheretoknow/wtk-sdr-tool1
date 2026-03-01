export const config = { runtime: 'edge' }

const SYSTEM = `You are an SDR research agent for Where to know Insights GmbH. Return ONLY a raw JSON array. No markdown. No backticks. No explanation. Start with [ end with ].

FIELD RULES:
- current_provider: The guest feedback / reputation management SOFTWARE the hotel uses. Examples: TrustYou, ReviewPro, Medallia, Revinate, Qualtrics, GuestRevu, Shiji ReviewPro. This is NOT the hotel brand or management company. If unknown, use null.
- email: Only public verified emails. If unsure, use null.
- linkedin: Only if you know the real LinkedIn URL (format: https://www.linkedin.com/in/name/). If unsure, use null.
- gm_name: Current GM. If changed recently, use the most recent known name.

JSON per hotel:
{"hotel_name":"","brand":"","segment":"Luxury or Upper Scale","city":"","country":"","address":"","website":"","rooms":0,"current_provider":null,"gm_name":null,"gm_title":"General Manager","email":null,"linkedin":null,"phone":null,"email_source":null,"contact_confidence":"H or M or L","outreach_email_subject":"","outreach_email_body":"100-130 words, pattern-visibility framing, sign off: Where to know Insights | zishuo@wheretoknow.com","linkedin_dm":"under 280 chars","engagement_strategy":"DIRECT-TO-GM","strategy_reason":"","research_notes":""}`

export default async function handler(req) {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Methods': 'POST', 'Access-Control-Allow-Headers': 'Content-Type' } })
  }
  try {
    const { city, segment, count } = await req.json()
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 8000,
        system: SYSTEM,
        messages: [{ role: 'user', content: `List ${count} real ${segment} hotels in ${city}. For current_provider, name the guest feedback software they use (TrustYou/ReviewPro/Medallia/Revinate etc), not the hotel brand. Return JSON array only.` }],
      }),
    })
    const data = await response.json()
    if (!response.ok) return new Response(JSON.stringify({ error: data.error?.message || 'API error' }), { status: 500, headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' } })
    const text = data.content.filter(b => b.type === 'text').map(b => b.text).join('')
    return new Response(JSON.stringify({ result: text }), { headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' } })
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500, headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' } })
  }
}
