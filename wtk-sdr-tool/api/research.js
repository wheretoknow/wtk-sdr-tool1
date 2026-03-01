const SDR_SYSTEM_PROMPT = `You are an expert SDR research agent for Where to know Insights GmbH. Use web search to find CURRENT verified information.

CRITICAL: Return ONLY a raw JSON array. Start with [ end with ]. No markdown, no backticks, no explanation.

For each hotel search for:
1. Current official name and brand/ownership (may have rebranded - verify)
2. Current GM - search hotel website and recent press releases 2024/2025
3. Public email from hotel website or TripAdvisor management responses
4. GM LinkedIn profile URL (must be real verified URL, format: https://www.linkedin.com/in/name/)
5. Guest feedback software (TrustYou/ReviewPro/Medallia/Revinate/Qualtrics - NOT hotel brand)
6. Room count - from hotel website or press materials
7. Number of restaurants/F&B outlets - from hotel website
8. ADR estimate - search "[hotel name] rate" or booking sites for approximate average daily rate in USD
9. Guest experience patterns from recent reviews for outreach angle

RULES:
- Never invent emails or LinkedIn URLs - use null if not found
- current_provider = feedback SOFTWARE not hotel group
- adr_usd = estimated average daily rate as integer (e.g. 350), or null
- restaurants = number of F&B outlets as integer, or null

Each hotel JSON:
{
  "hotel_name": "Full current hotel name",
  "brand": "Current brand/management company",
  "segment": "Luxury or Upper Scale",
  "city": "City",
  "country": "Country",
  "address": "Street address",
  "website": "Official website URL",
  "rooms": 200,
  "restaurants": 3,
  "adr_usd": 350,
  "current_provider": null,
  "gm_name": null,
  "gm_title": "General Manager",
  "email": null,
  "linkedin": null,
  "phone": null,
  "email_source": null,
  "contact_confidence": "H or M or L",
  "outreach_email_subject": "Compelling subject line",
  "outreach_email_body": "100-130 words. Pattern-visibility framing. Reference specific guest experience signal. Sign off: Where to know Insights | zishuo@wheretoknow.com",
  "linkedin_dm": "Under 280 characters",
  "engagement_strategy": "DIRECT-TO-GM or THROUGH-REGIONAL-SPONSOR or STRATEGIC-HOLD or HOLD",
  "strategy_reason": "1-2 sentences",
  "research_notes": "Key findings and sources"
}`

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')
  if (req.method === 'OPTIONS') return res.status(200).end()
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  try {
    const { city, brand, segment, count } = req.body
    const brandFilter = brand ? ` Focus on ${brand} branded properties only.` : ''
    const prompt = `Research ${count} ${segment} hotels currently operating in ${city}.${brandFilter} Use web search to verify current GM, brand ownership, email, LinkedIn, rooms, restaurants, ADR, and guest feedback software. Return JSON array only, start with [`

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

    const data = await response.json()
    if (!response.ok) return res.status(500).json({ error: data.error?.message || 'API error' })
    const text = data.content.filter(b => b.type === 'text').map(b => b.text).join('')
    res.status(200).json({ result: text })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
}
