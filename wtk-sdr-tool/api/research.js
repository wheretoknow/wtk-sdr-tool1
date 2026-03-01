const BRAND_PROVIDER_MAP = {
  // Marriott International → Qualtrics
  "ritz-carlton": "Qualtrics", "st. regis": "Qualtrics", "jw marriott": "Qualtrics",
  "w hotels": "Qualtrics", "luxury collection": "Qualtrics", "edition": "Qualtrics",
  "sheraton": "Qualtrics", "westin": "Qualtrics", "le méridien": "Qualtrics",
  "le meridien": "Qualtrics", "renaissance": "Qualtrics", "autograph collection": "Qualtrics",
  "tribute portfolio": "Qualtrics", "design hotels": "Qualtrics", "gaylord": "Qualtrics",
  "courtyard": "Qualtrics", "ac hotels": "Qualtrics", "moxy": "Qualtrics",
  "marriott": "Qualtrics", "delta hotels": "Qualtrics", "aloft": "Qualtrics",
  // IHG → Medallia
  "intercontinental": "Medallia", "kimpton": "Medallia", "six senses": "Medallia",
  "regent": "Medallia", "vignette collection": "Medallia", "hotel indigo": "Medallia",
  "crowne plaza": "Medallia", "voco": "Medallia", "holiday inn": "Medallia",
  "hualuxe": "Medallia", "ihg": "Medallia",
  // Radisson → ReviewPro
  "radisson collection": "ReviewPro", "radisson blu": "ReviewPro", "radisson red": "ReviewPro",
  "radisson": "ReviewPro", "park plaza": "ReviewPro", "park inn": "ReviewPro",
  "country inn": "ReviewPro",
  // Accor → TrustYou
  "raffles": "TrustYou", "fairmont": "TrustYou", "sofitel": "TrustYou",
  "mgallery": "TrustYou", "pullman": "TrustYou", "swissôtel": "TrustYou",
  "swissotel": "TrustYou", "mövenpick": "TrustYou", "movenpick": "TrustYou",
  "novotel": "TrustYou", "mercure": "TrustYou", "ibis": "TrustYou",
  "25hours": "TrustYou", "banyan tree": "TrustYou", "accor": "TrustYou",
  // Rosewood → TrustYou
  "rosewood": "TrustYou", "new world hotels": "TrustYou",
  // Hyatt → Medallia
  "park hyatt": "Medallia", "andaz": "Medallia", "grand hyatt": "Medallia",
  "hyatt regency": "Medallia", "hyatt centric": "Medallia", "hyatt": "Medallia",
  "alila": "Medallia", "thompson hotels": "Medallia", "dream hotels": "Medallia",
  // Mandarin Oriental → TrustYou
  "mandarin oriental": "TrustYou",
  // Minor/NH → ReviewPro
  "anantara": "ReviewPro", "avani": "ReviewPro", "nh collection": "ReviewPro",
  "nh hotels": "ReviewPro", "nhow": "ReviewPro", "tivoli": "ReviewPro",
  "minor hotels": "ReviewPro",
  // Peninsula → ReviewPro
  "peninsula": "ReviewPro",
  // Capella → ReviewPro
  "capella": "ReviewPro",
  // Wyndham → Medallia
  "wyndham": "Medallia", "dolce": "Medallia", "ramada": "Medallia",
};

function inferProvider(brand, hotelName) {
  if (!brand && !hotelName) return null;
  const searchStr = ((brand || "") + " " + (hotelName || "")).toLowerCase();
  for (const [key, provider] of Object.entries(BRAND_PROVIDER_MAP)) {
    if (searchStr.includes(key)) return provider;
  }
  return null;
}

const SDR_SYSTEM_PROMPT = `You are an expert SDR research agent for Where to know Insights GmbH. Use web search to find CURRENT verified information.

CRITICAL: Return ONLY a raw JSON array. Start with [ end with ]. No markdown, no backticks.

For each hotel search for:
1. Current official name and brand/ownership (verify - may have rebranded)
2. Current GM - search hotel website, LinkedIn, and recent press releases 2024/2025
3. Public email from hotel website or TripAdvisor management responses (NOT guessed)
4. GM LinkedIn (real verified URL only)
5. Room count, number of F&B outlets, estimated ADR in USD
6. Hotel's current TripAdvisor/Google rating and approximate review count
7. 1-2 specific recurring guest feedback themes from actual recent reviews

CRITICAL EMAIL RULES - FOLLOW EXACTLY:
- First name ONLY: "Hello Leonard," NEVER "Dear Mr. Cernko," NEVER "Dear Ms. Smith,"
- Structure: P1 one sentence tension → P2 one sentence hidden dynamic → P3 one sentence consequence → P4 one sentence WTK resolution → P5 CTA
- Each paragraph is ONE sentence, separated by blank lines
- P1 must use real data: "At [X.X] across [N] reviews, [tension line]."
- P4: "WhereToKnow [operational outcome]." NO mention of AI/dashboard/features/platform
- CTA: 15 minutes, specific days/times offered, low friction
- Total email body: 120-150 words MAX
- Chain hotel P4 must include: "complementary to existing systems"
- NO literary language, NO abstract phrases, NO "perception drift"

RESEARCH NOTES: Must be bullet points like:
• GM: [Name] confirmed via [source] ([date if known])
• Rating: [X.X] across ~[N] reviews on [platform]
• Key feedback theme 1: [theme]
• Key feedback theme 2: [theme]  
• ADR: ~$[X]/night (source: [where])
• Provider: [inferred from brand OR found via search]
• LinkedIn: [found/not found]
• Email: [found via X / not publicly available]

current_provider: IMPORTANT - infer from brand if known (Marriott=Qualtrics, IHG=Medallia, Radisson=ReviewPro, Accor=TrustYou, Hyatt=Medallia, Mandarin Oriental=TrustYou, Rosewood=TrustYou, Minor/NH=ReviewPro, Peninsula=ReviewPro, Capella=ReviewPro). Set null only for truly unknown independents.

Each hotel JSON:
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
  "current_provider": "Qualtrics or Medallia or ReviewPro or TrustYou or null",
  "gm_name": "Full Name",
  "gm_first_name": "FirstName",
  "gm_title": "General Manager",
  "email": null,
  "linkedin": null,
  "phone": null,
  "email_source": null,
  "contact_confidence": "H or M or L",
  "outreach_email_subject": "[Hotel Name] — [tension hook e.g. stability at 9.1 / rating pressure at 7.8]",
  "outreach_email_body": "Hello [FirstName],\n\nAt [X.X] across [N] reviews, [P1 tension line - one sentence].\n\n[P2 hidden dynamic - one sentence].\n\n[P3 consequence - one sentence].\n\nWhereToKnow [P4 operational resolution - one sentence, no AI/features].\n\n[P5 CTA - 15 min, specific time slots].\n\nBest,\nZishuo Wang | Where to know",
  "linkedin_dm": "Under 280 chars. First name only. No Mr/Ms.",
  "engagement_strategy": "DIRECT-TO-GM",
  "strategy_reason": "1-2 sentences",
  "research_notes": "• GM: [name] confirmed via [source]\n• Rating: [X.X] across ~[N] reviews on [platform]\n• Key feedback theme 1: [theme]\n• Key feedback theme 2: [theme]\n• ADR: ~$[X]/night (source: [where])\n• Provider: [Qualtrics/Medallia/etc - inferred from brand]\n• LinkedIn: [found/not found]\n• Email: [status]"
}`;

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')
  if (req.method === 'OPTIONS') return res.status(200).end()
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  try {
    const { city, brand, segment, count } = req.body
    const brandFilter = brand ? ` Focus on ${brand} branded properties only.` : ''
    const segmentMap = {
      'Luxury': 'Luxury tier (Six Senses, Park Hyatt, Rosewood, Mandarin Oriental, Four Seasons, Aman, Peninsula, LHW independent 5-star)',
      'Premium': 'Premium tier (Hilton, Marriott, Hyatt Regency, Voco, Radisson, NH, Anantara, independent 4-star)',
      'Lifestyle': 'Lifestyle tier (W Hotels, Kimpton, Hoxton, 25Hours, Tribute Portfolio, Edition)',
      'Economy': 'Economy tier (Ibis, Holiday Inn, Novotel, Courtyard, independent 3-star)',
      'Function': 'Function/purpose-built hotels (airport hotels, convention center hotels, large conference properties — e.g. Hilton Airport, Sheraton Convention Center)',
    }
    const tierDesc = segmentMap[segment] || 'Luxury and Premium tier (5-star and high-end 4-star hotels)'
    const prompt = `Research ${count} ${tierDesc} hotels currently operating in ${city}.${brandFilter} Use web search to verify current GM, brand, rooms, restaurants, ADR, rating, review count. Return JSON array only.`

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
    
    // Post-process: inject provider from brand map where missing
    let text = data.content.filter(b => b.type === 'text').map(b => b.text).join('')
    
    // Try to fix provider in parsed results
    try {
      const clean = text.replace(/```json|```/g, "").trim();
      const s = clean.indexOf("["), e = clean.lastIndexOf("]");
      if (s >= 0 && e >= 0) {
        const arr = JSON.parse(clean.slice(s, e + 1));
        const fixed = arr.map(p => ({
          ...p,
          current_provider: p.current_provider || inferProvider(p.brand, p.hotel_name)
        }));
        text = JSON.stringify(fixed);
      }
    } catch(e) { /* keep original text */ }
    
    res.status(200).json({ result: text })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
}
