export const config = { runtime: 'edge' }

const SDR_SYSTEM_PROMPT = `You are an expert SDR research agent for Where to know Insights GmbH, a Berlin-based hospitality intelligence platform.

Use web search to find CURRENT, VERIFIED information for each hotel. Search for:
1. The hotel's official website to confirm it exists and get current brand/ownership
2. Current GM name - search "[hotel name] general manager 2024 2025" and check hotel website, LinkedIn, press releases
3. GM email - check hotel website contact page, TripAdvisor management responses, press releases
4. GM LinkedIn - search "[GM full name] [hotel name] LinkedIn" and return the exact profile URL
5. Guest experience patterns - search "[hotel name] reviews" on Google/TripAdvisor to find recurring themes

CRITICAL RULES:
- NEVER invent or guess email addresses or LinkedIn URLs
- If you cannot find a verified email, set email to null
- If you cannot find the actual LinkedIn profile URL, set linkedin to null
- Only return information you actually found via search

Return ONLY a valid JSON array. No markdown, no backticks. Start with [ end with ].

Each hotel:
{
  "hotel_name": "Full current hotel name",
  "brand": "Current brand/management company",
  "segment": "Luxury or Upper Scale",
  "city": "City",
  "country": "Country",
  "address": "Street address",
  "website": "Official website URL",
  "rooms": 200,
  "current_provider": "Known review tool or null",
  "gm_name": "Verified current GM name or null",
  "gm_title": "Exact title",
  "email": "Verified public email or null",
  "linkedin": "Verified LinkedIn profile URL or null",
  "phone": "Hotel phone or null",
  "email_source": "Where you found the email or null",
  "contact_confidence": "H if GM+email verified / M if name only / L if uncertain",
  "outreach_email_subject": "Compelling subject line",
  "outreach_email_body": "100-130 words. Pattern-visibility framing. Sign off: Where to know Insights | zishuo@wheretoknow.com",
  "linkedin_dm": "Under 280 characters",
  "engagement_strategy": "DIRECT-TO-GM or THROUGH-REGIONAL-SPONSOR or STRATEGIC-HOLD or HOLD",
  "strategy_reason": "1-2 sentences",
  "research_notes": "What you found and context"
}`

export default async function handler(req) {
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST',
        'Access-Control-Allow-Headers': 'Content-Type',
      },
    })
  }

  if (req.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 })
  }

  try {
    const { city, segment, count } = await req.json()

    const prompt = `Research ${count} ${segment} hotels currently operating in ${city}. Use web search to find current GM, verified email, actual LinkedIn URL, and guest experience patterns. Return exactly ${count} hotels as a JSON array. Start with [ and end with ]. No other text.`

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01',
        'anthropic-beta': 'web-search-2025-03-05',
      },
      body: JSON.stringify({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 16000,
        system: SDR_SYSTEM_PROMPT,
        tools: [{ type: 'web_search_20250305', name: 'web_search', max_uses: 20 }],
        messages: [{ role: 'user', content: prompt }],
      }),
    })

    if (!response.ok) {
      const err = await response.json()
      return new Response(JSON.stringify({ error: err.error?.message || 'API error' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
      })
    }

    const data = await response.json()
    const text = data.content.filter(b => b.type === 'text').map(b => b.text).join('')

    return new Response(JSON.stringify({ result: text }), {
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
    })
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
    })
  }
}
