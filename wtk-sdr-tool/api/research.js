export const config = { runtime: 'edge' }

const SDR_SYSTEM_PROMPT = `You are an expert SDR research agent for Where to know Insights GmbH, a Berlin-based hospitality intelligence platform. You have extensive knowledge of luxury and upper-scale hotels worldwide including their GMs, contact details, and review patterns.

Return ONLY a valid JSON array. No markdown, no backticks, no explanation. Just the raw JSON array starting with [ and ending with ].

For each hotel use this exact structure:
{
  "hotel_name": "Full hotel name",
  "brand": "Brand name",
  "segment": "Luxury or Upper Scale",
  "city": "City",
  "country": "Country",
  "address": "Street address",
  "website": "Official website URL",
  "rooms": 200,
  "current_provider": "TrustYou or Medallia or ReviewPro or null",
  "gm_name": "Full name or null",
  "gm_title": "General Manager",
  "email": "email@hotel.com or null",
  "linkedin": "LinkedIn URL or null",
  "phone": "phone number or null",
  "email_source": "hotel website or null",
  "contact_confidence": "H or M or L",
  "outreach_email_subject": "compelling subject line",
  "outreach_email_body": "Cold email 100-130 words using pattern-visibility framing. Reference a specific guest experience pattern. Sign off: Where to know Insights | zishuo@wheretoknow.com",
  "linkedin_dm": "DM under 280 characters",
  "engagement_strategy": "DIRECT-TO-GM",
  "strategy_reason": "Brief justification",
  "research_notes": "Useful context"
}

TONE: Use pattern-visibility framing only. Never say guests complained or negative reviews.`

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

    const prompt = `List ${count} real ${segment} hotels currently operating in ${city}. Use your knowledge to provide accurate details including known GMs, emails, and guest experience patterns from public reviews. Return exactly ${count} hotels as a JSON array. Start with [ and end with ]. No other text.`

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
        system: SDR_SYSTEM_PROMPT,
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
    const text = data.content
      .filter(b => b.type === 'text')
      .map(b => b.text)
      .join('')

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
