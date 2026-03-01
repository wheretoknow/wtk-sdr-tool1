const SDR_SYSTEM_PROMPT = `You are an expert SDR research agent for Where to know Insights GmbH. Use web search to find CURRENT verified information.

CRITICAL: Return ONLY a raw JSON array. Start with [ end with ]. No markdown, no backticks, no explanation.

For each hotel search for:
1. Current official name and brand/ownership (may have rebranded)
2. Current GM - search hotel website and recent press releases
3. Public email from hotel website or TripAdvisor management responses
4. GM LinkedIn profile URL (verified, real URL only)
5. Guest feedback software provider (TrustYou/ReviewPro/Medallia/Revinate etc) - NOT hotel brand
6. Guest experience patterns from recent reviews

Never invent emails or LinkedIn URLs. Use null if not found.

Each hotel JSON:
{"hotel_name":"","brand":"","segment":"Luxury or Upper Scale","city":"","country":"","address":"","website":"","rooms":0,"current_provider":null,"gm_name":null,"gm_title":"General Manager","email":null,"linkedin":null,"phone":null,"email_source":null,"contact_confidence":"H or M or L","outreach_email_subject":"","outreach_email_body":"100-130 words, pattern-visibility framing, sign off: Where to know Insights | zishuo@wheretoknow.com","linkedin_dm":"under 280 chars","engagement_strategy":"DIRECT-TO-GM","strategy_reason":"","research_notes":""}`

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')
  if (req.method === 'OPTIONS') return res.status(200).end()
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  try {
    const { city, segment, count } = req.body
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
        tools: [{ type: 'web_search_20250305', name: 'web_search', max_uses: 15 }],
        messages: [{ role: 'user', content: `Research ${count} ${segment} hotels in ${city}. Use web search to verify current GM, brand, email, LinkedIn, and guest feedback software provider. Return JSON array only, start with [` }],
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
