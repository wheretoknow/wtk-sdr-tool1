const BRAND_PROVIDER_MAP = {"ritz-carlton":"Qualtrics","st. regis":"Qualtrics","jw marriott":"Qualtrics","w hotels":"Qualtrics","luxury collection":"Qualtrics","edition":"Qualtrics","sheraton":"Qualtrics","westin":"Qualtrics","le meridien":"Qualtrics","renaissance":"Qualtrics","autograph collection":"Qualtrics","marriott":"Qualtrics","moxy":"Qualtrics","aloft":"Qualtrics","courtyard":"Qualtrics","ac hotels":"Qualtrics","intercontinental":"Medallia","kimpton":"Medallia","six senses":"Medallia","regent":"Medallia","vignette collection":"Medallia","hotel indigo":"Medallia","crowne plaza":"Medallia","voco":"Medallia","holiday inn":"Medallia","ihg":"Medallia","park hyatt":"Medallia","andaz":"Medallia","grand hyatt":"Medallia","hyatt regency":"Medallia","hyatt":"Medallia","wyndham":"Medallia","radisson collection":"ReviewPro","radisson blu":"ReviewPro","radisson red":"ReviewPro","radisson":"ReviewPro","park plaza":"ReviewPro","park inn":"ReviewPro","anantara":"ReviewPro","nh collection":"ReviewPro","nh hotels":"ReviewPro","peninsula":"ReviewPro","capella":"ReviewPro","minor hotels":"ReviewPro","raffles":"TrustYou","fairmont":"TrustYou","sofitel":"TrustYou","pullman":"TrustYou","swissotel":"TrustYou","movenpick":"TrustYou","novotel":"TrustYou","mercure":"TrustYou","ibis":"TrustYou","25hours":"TrustYou","accor":"TrustYou","rosewood":"TrustYou","mandarin oriental":"TrustYou"};

function inferProvider(brand, name) {
  const s = ((brand||"")+" "+(name||"")).toLowerCase();
  for (const [k,v] of Object.entries(BRAND_PROVIDER_MAP)) { if (s.includes(k)) return v; }
  return null;
}

const SYSTEM = `Return ONLY a raw JSON array. No markdown, no backticks.

Research each hotel and return this exact structure:
{"hotel_name":"Full Name","brand":"Brand/Management","tier":"Luxury|Premium|Lifestyle|Economy|Function","city":"City","country":"Country","address":"Address","website":"URL","rooms":200,"restaurants":2,"adr_usd":350,"rating":8.5,"review_count":1200,"current_provider":null,"gm_name":"Full Name","gm_first_name":"First","gm_title":"General Manager","email":null,"linkedin":null,"phone":null,"email_source":null,"contact_confidence":"M","outreach_email_subject":"[Hotel] — [tension hook]","outreach_email_body":"Hello [FirstName],\n\n[P1: one sentence with real score/review data, signal tension.]\n\n[P2: one sentence, the hidden dynamic why this is invisible.]\n\n[P3: one sentence, business consequence.]\n\nWhereToKnow [P4: one sentence operational outcome, NO mention of AI/dashboard/features].\n\n[P5: 15-min CTA with specific days offered].\n\nBest,\nZishuo Wang | Where to know","linkedin_dm":"<280 chars, first name only, no Mr/Ms","engagement_strategy":"DIRECT-TO-GM","strategy_reason":"1 sentence","research_notes":"• GM: name via source\n• Rating: X.X across ~N reviews\n• Feedback theme 1: theme\n• Feedback theme 2: theme\n• ADR: ~$X/night\n• Provider: inferred\n• Email: status"}

EMAIL RULES: First name only (Hello Leonard, NOT Dear Mr. Cernko). P1-P5 each one sentence separated by blank lines. 120-150 words max. Chain hotels: P4 must say "complementary to existing systems". Provider: infer from brand (Marriott=Qualtrics, IHG=Medallia, Radisson=ReviewPro, Accor/Rosewood/Mandarin=TrustYou, Hyatt/Wyndham=Medallia, Anantara/NH/Peninsula/Capella=ReviewPro).`;

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const { city, brand, segment, count } = req.body;
    const tierMap = {
      'Luxury': 'Luxury 5-star (Six Senses, Park Hyatt, Rosewood, Four Seasons, Aman, Peninsula)',
      'Premium': 'Premium 4-star (Hilton, Marriott, Hyatt Regency, Radisson, Anantara)',
      'Lifestyle': 'Lifestyle (Kimpton, W Hotels, Hoxton, 25Hours, Edition)',
      'Economy': 'Economy 3-star (Ibis, Holiday Inn, Novotel)',
      'Function': 'Airport/convention center hotels',
    };
    const tierDesc = tierMap[segment] || 'Luxury and Premium hotels';
    const brandFilter = brand ? ` Focus on ${brand} only.` : '';
    const prompt = `Research ${count} ${tierDesc} in ${city}.${brandFilter} Use web search. Return JSON array only.`;

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-api-key': process.env.ANTHROPIC_API_KEY, 'anthropic-version': '2023-06-01', 'anthropic-beta': 'web-search-2025-03-05' },
      body: JSON.stringify({ model: 'claude-haiku-4-5-20251001', max_tokens: 8000, system: SYSTEM, tools: [{ type: 'web_search_20250305', name: 'web_search', max_uses: 15 }], messages: [{ role: 'user', content: prompt }] }),
    });

    const data = await response.json();
    if (!response.ok) return res.status(500).json({ error: data.error?.message || 'API error' });

    let text = data.content.filter(b => b.type === 'text').map(b => b.text).join('');
    try {
      const s = text.indexOf('['), e = text.lastIndexOf(']');
      if (s >= 0 && e >= 0) {
        const arr = JSON.parse(text.slice(s, e + 1));
        const fixed = arr.map(p => ({ ...p, current_provider: p.current_provider || inferProvider(p.brand, p.hotel_name) }));
        text = JSON.stringify(fixed);
      }
    } catch(e) {}

    res.status(200).json({ result: text });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}
