const PROVIDER_MAP = {"ritz-carlton":"Qualtrics","marriott":"Qualtrics","sheraton":"Qualtrics","westin":"Qualtrics","le meridien":"Qualtrics","renaissance":"Qualtrics","autograph":"Qualtrics","moxy":"Qualtrics","aloft":"Qualtrics","intercontinental":"Medallia","kimpton":"Medallia","six senses":"Medallia","regent":"Medallia","hotel indigo":"Medallia","crowne plaza":"Medallia","voco":"Medallia","ihg":"Medallia","park hyatt":"Medallia","andaz":"Medallia","grand hyatt":"Medallia","hyatt":"Medallia","wyndham":"Medallia","radisson":"ReviewPro","park plaza":"ReviewPro","anantara":"ReviewPro","peninsula":"ReviewPro","capella":"ReviewPro","kempinski":"ReviewPro","raffles":"TrustYou","fairmont":"TrustYou","sofitel":"TrustYou","accor":"TrustYou","rosewood":"TrustYou","mandarin oriental":"TrustYou"};

function inferProvider(b, n) {
  const s = ((b || "") + " " + (n || "")).toLowerCase();
  for (const [k, v] of Object.entries(PROVIDER_MAP)) { if (s.includes(k)) return v; }
  return null;
}

function extractJSON(content) {
  const blocks = (content || []).filter(b => b.type === 'text').map(b => b.text || '');
  for (let i = blocks.length - 1; i >= 0; i--) {
    const s = blocks[i].indexOf('['), e = blocks[i].lastIndexOf(']');
    if (s >= 0 && e > s) return blocks[i].slice(s, e + 1);
  }
  return '';
}

function extractJSONObject(content) {
  const blocks = (content || []).filter(b => b.type === 'text').map(b => b.text || '');
  for (let i = blocks.length - 1; i >= 0; i--) {
    const s = blocks[i].indexOf('{'), e = blocks[i].lastIndexOf('}');
    if (s >= 0 && e > s) return blocks[i].slice(s, e + 1);
  }
  return '';
}

const SYSTEM = `You are a JSON-only API. YOUR ENTIRE RESPONSE MUST BE A VALID JSON ARRAY. No explanations. No commentary. No markdown. No preamble. No "I'll help you" or "Based on my research". NOTHING except the raw JSON array starting with [ and ending with ]. If you write even one word outside the JSON, you have failed. Start your response with [ immediately.

â”â”â” FIELD PRIORITY â”â”â”

ðŸ”´ CRITICAL â€” allocate most searches here, do not leave null without 2 attempts:
  â€¢ gm_name â€” GM full name
  â€¢ email or linkedin â€” at least one GM contact method
  â€¢ rating + review_count â€” score from any major platform
  â€¢ rooms â€” total room count
  â€¢ current_provider â€” infer from brand OR search "[hotel] Medallia/ReviewPro/Qualtrics"

ðŸŸ¡ SECONDARY â€” one search attempt, null if not found:
  â€¢ restaurants â€” F&B outlet count
  â€¢ adr_usd â€” estimated nightly rate

â”â”â” SEARCH INSTRUCTIONS â”â”â”

ðŸ”´ GM NAME â€” search in this order, stop when found:
  1. Google News: "[hotel name] general manager 2025" or "2024"
  2. LinkedIn: "[hotel name] general manager"
  3. hospitalitynet.org or hotelnewsresource.com: "[hotel name] GM appointed"
  contact_confidence: "H"=press release, "M"=news article, "L"=other

ðŸ”´ GM CONTACT â€” search in this order, stop when found:
  1. TripAdvisor management responses for this hotel â€” GM sometimes signs with email
  2. Hotel official website /contact /press /about page
  3. LinkedIn profile URL (linkedin.com/in/...) â€” set in linkedin field
  email=null if not found. NEVER fabricate. linkedin URL is acceptable if email unavailable.

ðŸ”´ ROOMS â€” always on official hotel website under "rooms" or "accommodations". Never null.

ðŸ”´ RATING + REVIEW COUNT â€” always publicly visible:
  Asia: search "[hotel name] Agoda" or "[hotel name] Trip.com"
  Europe/Americas: search "[hotel name] Booking.com" (out of 10) or "[hotel name] Google reviews" (out of 5)
  Try a second platform if first fails. Never null if hotel is findable.

ðŸ”´ CURRENT PROVIDER â€” infer from brand map below first. If brand is ambiguous, search "[hotel name] Medallia" or "[hotel name] guest experience platform".

ðŸŸ¡ ADR â€” Booking.com or Agoda, any standard room rate, round to $10. One search only.

ðŸŸ¡ RESTAURANTS â€” hotel website /dining page. One search only.

OUTPUT SCHEMA:
{"hotel_name":"","brand":"","hotel_group":"","tier":"Luxury|Premium|Lifestyle|Economy|Function","city":"","country":"","address":"","website":"","rooms":null,"restaurants":null,"adr_usd":null,"rating":null,"review_count":null,"current_provider":null,"gm_name":null,"gm_first_name":null,"gm_title":"General Manager","email":null,"linkedin":null,"phone":null,"email_source":null,"contact_confidence":"L","outreach_email_subject":"specific tension hook â€” no generic titles","outreach_email_body":"REQUIRED. 80-120 words. Follow this structure exactly â€” do not shorten:\n\nHello [FirstName],\n\n[1-2 sentences: specific operational tension observed across recent reviews on [PLATFORM] over [TIMEFRAME]. Be concrete â€” name the pattern, e.g. breakfast wait times, late checkout friction, recognition gaps. Not vague.]\n\n[1 sentence: why this pattern is structurally invisible to management â€” it lives in written text, not scores.]\n\n[REQUIRED if provider known: We know you have [Provider] â€” Where to know works alongside it, not instead of it. What [Provider] does not cover: real-time local competitor benchmarking and turning written feedback patterns into specific next steps for your team. Most of our hotel partners run both.]\n\n[1 sentence: the concrete operational outcome â€” what changes for the GM. No AI, no dashboard, no tech words.]\n\nAvailable for 15 min this week or next?\n\nBest,\nZishuo Wang | Where to know","engagement_strategy":"DIRECT-TO-GM","strategy_reason":"","research_notes":"â€¢ GM: [name] ([source: LinkedIn/news/website])\nâ€¢ Rooms: [N]\nâ€¢ Restaurants: [N]\nâ€¢ ADR: ~$[X] ([platform], [date])\nâ€¢ Rating: [X]/[SCALE] ([N] reviews, [PLATFORM])\nâ€¢ Provider: [X or Unknown]\nâ€¢ Theme: [feedback theme]"}

Provider map: Marriottâ†’Qualtrics, IHG(InterContinental/Kimpton/Hotel Indigo/Six Senses/Regent/Crowne Plaza/voco)â†’Medallia, Hyatt/Wyndhamâ†’Medallia, Radisson/NH/Park Plaza/Anantara/Peninsula/Capellaâ†’ReviewPro, Accor/Rosewood/Mandarin Orientalâ†’TrustYou.`;

const DEEP_SYSTEM = `Research this hotel thoroughly. Execute these searches:
1. "[hotel name] general manager" on Google News and LinkedIn â€” get GM name and title
2. Hotel official website â€” get room count, restaurant count, address
3. "[hotel name] Booking.com" or Agoda â€” get current room rate (ADR estimate) and rating
4. "[hotel name] Google reviews" or TripAdvisor â€” get rating, review count, feedback themes
5. TripAdvisor management responses for this hotel â€” check if GM email appears in signature
6. Hotel /contact or /press page â€” check for GM email

Return ONLY a JSON object (no array, no markdown):
{"adr_usd":null,"rating":null,"review_count":null,"gm_name":null,"gm_first_name":null,"email":null,"email_source":null,"contact_confidence":"L","rooms":null,"restaurants":null,"linkedin":null,"research_notes":"â€¢ GM: [name] ([source])\nâ€¢ Rooms: [N]\nâ€¢ Restaurants: [N]\nâ€¢ ADR: ~$[X] ([platform], [date])\nâ€¢ Rating: [X]/[SCALE] ([N] reviews, [PLATFORM])\nâ€¢ Theme 1: [X]\nâ€¢ Theme 2: [X]\nâ€¢ Provider: [X]"}
Unknown = null. Always output the JSON object.`;

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const { city, brand, segment, count, mode, hotel_name, exclude } = req.body;

    if (mode === 'deep' && hotel_name) {
      const r = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-api-key': process.env.ANTHROPIC_API_KEY, 'anthropic-version': '2023-06-01', 'anthropic-beta': 'web-search-2025-03-05' },
        body: JSON.stringify({ model: 'claude-haiku-4-5-20251001', max_tokens: 2000, system: DEEP_SYSTEM, tools: [{ type: 'web_search_20250305', name: 'web_search', max_uses: 6 }], messages: [{ role: 'user', content: `Research: ${hotel_name}` }] })
      });
      const data = await r.json();
      if (!r.ok) return res.status(500).json({ error: data.error?.message || 'API error' });
      return res.status(200).json({ result: extractJSONObject(data.content) || '{}' });
    }

    const tiers = { "Luxury": "luxury 5-star", "Premium": "premium 4-star", "Lifestyle": "lifestyle boutique", "Economy": "economy 3-star", "Function": "airport/convention" };
    const t = tiers[segment] || "luxury";
    const brandFilter = brand ? ` Only CONFIRMED ${brand} properties. Exclude all non-${brand}.` : "";
    const excludeClause = (exclude && exclude.length) ? `\nSkip (already in DB): ${exclude.slice(0, 60).join(', ')}.` : "";

    const prompt = `Find ${count} ${t} hotels in ${city}.${brandFilter}${excludeClause}

For EACH hotel, prioritize these searches:
ðŸ”´ CRITICAL (search until found):
- GM name: Google News "[hotel name] general manager 2025" then LinkedIn
- GM contact: LinkedIn URL or email from TripAdvisor responses / hotel website
- Room count: official hotel website
- Rating + review count: Booking.com or Google
- Current provider: infer from brand, or search "[hotel name] Medallia"

ðŸŸ¡ SECONDARY (one attempt each):
- Restaurant count: hotel website /dining
- ADR: Booking.com or Agoda current rate

OUTPUT ONLY THE JSON ARRAY NOW. Start with [ immediately. No text before or after.`;

    const maxUses = count <= 3 ? 5 : count <= 6 ? 6 : 7; // enough for GM + ADR + rating + reviews + email
    // ~800 tokens per hotel for full JSON output; add 1000 buffer
    const maxTokens = Math.min(16000, Math.max(4000, count * 900 + 1000));

    const r = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-api-key': process.env.ANTHROPIC_API_KEY, 'anthropic-version': '2023-06-01', 'anthropic-beta': 'web-search-2025-03-05' },
      body: JSON.stringify({ model: 'claude-haiku-4-5-20251001', max_tokens: maxTokens, system: SYSTEM, tools: [{ type: 'web_search_20250305', name: 'web_search', max_uses: maxUses }], messages: [{ role: 'user', content: prompt }] })
    });
    const data = await r.json();
    if (!r.ok) return res.status(500).json({ error: data.error?.message || 'API error' });

    // Collect all text blocks
    const allText = (data.content || [])
      .filter(b => b.type === 'text')
      .map(b => b.text || '')
      .join('\n');

    const jsonStr = extractJSON(data.content);

    if (!jsonStr) {
      const preview = allText.slice(0, 500);
      return res.status(200).json({ result: '[]', debug: preview || `stop_reason: ${data.stop_reason}, blocks: ${(data.content||[]).length}` });
    }

    try {
      const arr = JSON.parse(jsonStr);
      if (!Array.isArray(arr) || arr.length === 0) {
        return res.status(200).json({ result: '[]', debug: 'Empty array. Raw: ' + allText.slice(0, 400) });
      }
      const enriched = JSON.stringify(arr.map(p => ({
        ...p,
        current_provider: inferProvider(p.brand, p.hotel_name) || p.current_provider || null,
        hotel_group: p.hotel_group || p.brand || "Independent"
      })));
      return res.status(200).json({ result: enriched });
    } catch (e) {
      return res.status(200).json({ result: jsonStr, debug: 'JSON.parse failed: ' + e.message });
    }

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}
