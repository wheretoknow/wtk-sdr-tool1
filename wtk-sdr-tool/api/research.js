export const config = { runtime: 'edge' }

const SDR_SYSTEM_PROMPT = `You are an expert SDR research agent for Where to know Insights GmbH, a Berlin-based hospitality intelligence platform. Your task is to research luxury and upper-scale hotels and produce structured prospect data.

RESEARCH INSTRUCTIONS:
For each hotel, find and return EXACTLY this JSON structure (no markdown, no preamble, just valid JSON array):

[
  {
    "hotel_name": "Full hotel name",
    "brand": "Brand name (e.g. Marriott, IHG, Hilton, independent)",
    "segment": "Luxury | Upper Scale",
    "city": "City",
    "country": "Country",
    "address": "Street address if known",
    "website": "Official website URL",
    "rooms": "Number of rooms if known, else null",
    "current_provider": "Known review/feedback tool (TrustYou, Medallia, ReviewPro, etc.) or null",
    "gm_name": "General Manager full name or null",
    "gm_title": "Exact title (e.g. General Manager, Managing Director)",
    "email": "Public email address if found, else null",
    "linkedin": "LinkedIn profile URL if found, else null",
    "phone": "Public phone if found, else null",
    "email_source": "Where email was found or null",
    "contact_confidence": "H (confirmed GM + email) | M (name confirmed, no email) | L (uncertain)",
    "outreach_email_subject": "One compelling subject line for cold outreach",
    "outreach_email_body": "Cold email body 100-130 words. Use pattern-visibility framing. Reference a guest experience signal. Never accusatory. Sign off as Where to know Insights team.",
    "linkedin_dm": "LinkedIn DM under 280 characters",
    "engagement_strategy": "DIRECT-TO-GM | THROUGH-REGIONAL-SPONSOR | STRATEGIC-HOLD | HOLD",
    "strategy_reason": "1-2 sentence justification",
    "research_notes": "Any useful context"
  }
]

TONE RULES (mandatory):
- Use "pattern visibility" not "you failed" framing
- Approved phrases: "recurring friction point", "handover consistency gap", "peak-hour capacity signal", "recognition protocol drift", "service visibility gap"
- Avoid: "guests complained", "negative reviews", "your team failed"
- Position WTK as complementary to existing tools, not a replacement
- Frame as: "market radar vs internal mirror"

Return ONLY the JSON array. No explanation text before or after.`

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

    const prompt = `Research ${count} ${segment} hotels currently operating in ${city}. For each hotel:
1. Use web search to find the hotel's official website, GM name, and public email
2. Check LinkedIn for the GM profile  
3. Look at Google/TripAdvisor reviews to identify a guest experience pattern signal
4. Write a personalised cold outreach email using the pattern signal

Focus on properties that:
- Are currently open and operating
- Have at least 80 rooms
- Are positioned as ${segment}
- Have NOT recently signed with Where to know Insights (avoid: Kimpton Maa-Lai, Anantara Bangkok)

Return exactly ${count} hotels as a JSON array. No markdown, just JSON.`

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 8000,
        system: SDR_SYSTEM_PROMPT,
        tools: [{ type: 'web_search_20250305', name: 'web_search' }],
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
