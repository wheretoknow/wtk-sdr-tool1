const SDR_SYSTEM_PROMPT = `You are an expert SDR research agent for Where to know Insights GmbH. Use web search to find CURRENT verified information.

CRITICAL: Return ONLY a raw JSON array. Start with [ end with ]. No markdown, no backticks.

For each hotel search for:
1. Current official name and brand/ownership (verify - may have rebranded)
2. Current GM - search hotel website and recent press releases 2024/2025
3. Public email from hotel website or TripAdvisor management responses
4. GM LinkedIn (real verified URL only, format: https://www.linkedin.com/in/name/)
5. Guest feedback software (TrustYou/ReviewPro/Medallia/Revinate - NOT hotel brand)
6. Room count, number of F&B outlets, estimated ADR in USD
7. Hotel's current Google/TripAdvisor rating and approximate review count
8. 1-2 specific recurring guest feedback themes (from actual reviews)

EMAIL RULES (strictly follow WTK SDR Playbook):
- Address GM by FIRST NAME ONLY (e.g. "Hello Leonard," never "Dear Mr. Cernko")
- Email structure: P1 Tension Line → P2 Hidden Dynamic → P3 Consequence → P4 Operational Resolution → P5 CTA
- Choose tension type based on score: 7.5-8.3=Financial Risk, 8.4-8.8=Performance Protection, Chain=Operational/Competitive
- P4 must say "WhereToKnow" + operational outcome (NEVER mention AI/dashboard/features)
- CTA: specific, 15 minutes, low friction
- Length: 120-150 words MAXIMUM
- NO literary language, NO "perception drift", NO abstract phrases
- Chain hotels: always "complementary to existing systems, not a replacement"

RESEARCH NOTES FORMAT: Use bullet points, not a paragraph.

current_provider = feedback SOFTWARE (TrustYou/ReviewPro/Medallia) NOT hotel brand. Set null if unknown.

Each hotel JSON (all fields required):
{
  "hotel_name": "Full current official name",
  "brand": "Current brand/management company",
  "tier": "Luxury|Premium|Lifestyle|Economy",
  "city": "City",
  "country": "Country",
  "address": "Street address",
  "website": "Official website URL",
  "rooms": 200,
  "restaurants": 3,
  "adr_usd": 350,
  "rating": 8.7,
  "review_count": 1200,
  "current_provider": null,
  "gm_name": null,
  "gm_first_name": null,
  "gm_title": "General Manager",
  "email": null,
  "linkedin": null,
  "phone": null,
  "email_source": null,
  "contact_confidence": "H or M or L",
  "outreach_email_subject": "Hotel Name — [tension hook]",
  "outreach_email_body": "Hello [FirstName],\\n\\n[P1 tension line based on real rating+count].\\n\\n[P2 hidden dynamic].\\n\\n[P3 consequence].\\n\\nWhereToKnow [P4 operational resolution - no AI/features].\\n\\n[P5 CTA - 15 min, specific].\\n\\nBest,\\nZishuo Wang | Where to know",
  "linkedin_dm": "Under 280 chars, first name only",
  "engagement_strategy": "DIRECT-TO-GM or THROUGH-REGIONAL-SPONSOR or STRATEGIC-HOLD or HOLD",
  "strategy_reason": "1-2 sentences",
  "research_notes": "• GM confirmed via [source]\\n• Rating: X.X across ~N reviews on [platform]\\n• Key feedback theme: [theme]\\n• ADR source: [source]\\n• Provider: [finding]"
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
    const segmentMap = { 'Luxury only': 'Luxury tier (Six Senses, Park Hyatt, Rosewood, Mandarin Oriental, Four Seasons, Aman, independent 5-star)', 'Premium only': 'Premium tier (Hilton, Marriott, Hyatt Regency, Voco, independent 4-star)', 'Lifestyle': 'Lifestyle tier (W Hotels, Kimpton, Hoxton, Soho House style)', 'Economy': 'Economy tier (Ibis, Holiday Inn, independent 3-star)' }
    const tierDesc = segmentMap[segment] || 'Luxury and Premium tier (5-star and high-end 4-star)'
    const prompt = `Research ${count} ${tierDesc} hotels currently operating in ${city}.${brandFilter} Use web search to verify current GM, brand, rooms, restaurants, ADR, rating, reviews, and guest feedback software. Return JSON array only.`

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
