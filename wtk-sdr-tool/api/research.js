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

const SYSTEM = `You are a hotel data extraction API. Output ONLY a valid JSON array. Start with [, end with ]. No text before or after. Unknown fields = null. Never refuse to output JSON.

SEARCH STRATEGY — for each hotel, execute these searches in order:

1. GM NAME (priority source: LinkedIn or news)
   → Search: "[hotel name] general manager 2024" on Google News
   → Search: "[hotel name] general manager" on LinkedIn
   → Also check: hospitalitynet.org, hotelnewsresource.com for appointment announcements
   → contact_confidence: "H"=official/press, "M"=news article, "L"=unconfirmed

2. GM EMAIL (best sources in order)
   → TripAdvisor: find management responses for this hotel, check if GM signed with email
   → Hotel official website: check /contact, /press, /about pages
   → If brand email pattern is known (e.g. firstname.lastname@fourseasons.com), try it
   → If nothing found: email=null. NEVER fabricate an email address.

3. ROOMS + RESTAURANTS
   → Official hotel website (always listed under "rooms" or "accommodations")
   → Brand website property page
   → These are almost always findable — do not leave as null without searching

4. ADR
   → Search Booking.com or Agoda for "[hotel name]", pick any available rate for a standard room on a mid-week date
   → This is an estimate — round to nearest $10, set adr_usd as integer
   → Note the platform and date in research_notes

5. RATING + REVIEW COUNT
   → Asia hotels: search "[hotel name] Agoda" or "[hotel name] Trip.com rating"
   → Europe/Americas: search "[hotel name] Booking.com" (rating out of 10) or Google (out of 5)
   → rating field = numeric value only (e.g. 8.7 or 4.5)
   → review_count field = integer
   → Always findable if the hotel exists — do not leave as null without searching

6. FEEDBACK THEME
   → Read 2-3 recent Google or TripAdvisor reviews, identify the most common operational friction
   → Use neutral language: "breakfast capacity signal", "check-in wait pattern", "housekeeping consistency"

OUTPUT SCHEMA:
{"hotel_name":"","brand":"","hotel_group":"","tier":"Luxury|Premium|Lifestyle|Economy|Function","city":"","country":"","address":"","website":"","rooms":null,"restaurants":null,"adr_usd":null,"rating":null,"review_count":null,"current_provider":null,"gm_name":null,"gm_first_name":null,"gm_title":"General Manager","email":null,"linkedin":null,"phone":null,"email_source":null,"contact_confidence":"L","outreach_email_subject":"specific tension hook — no generic titles","outreach_email_body":"MAX 100 words. Hello [FirstName],\n\n[1 sentence: specific operational tension from reviews with platform+timeframe]\n\n[1 sentence: why this is invisible to management without pattern-level visibility]\n\n[if provider known: We know you have [Provider] — Where to know works alongside it, adding local competitor benchmarking and pattern-to-action mapping. Most clients run both.]\n\n[1 sentence: concrete outcome, no AI/tech/dashboard words]\n\nAvailable for 15 min this week or next?\n\nBest,\nZishuo Wang | Where to know","engagement_strategy":"DIRECT-TO-GM","strategy_reason":"","research_notes":"• GM: [name] ([source: LinkedIn/news/website])\n• Rooms: [N]\n• Restaurants: [N]\n• ADR: ~$[X] ([platform], [date])\n• Rating: [X]/[SCALE] ([N] reviews, [PLATFORM])\n• Provider: [X or Unknown]\n• Theme: [feedback theme]"}

Provider map: Marriott→Qualtrics, IHG(InterContinental/Kimpton/Hotel Indigo/Six Senses/Regent/Crowne Plaza/voco)→Medallia, Hyatt/Wyndham→Medallia, Radisson/NH/Park Plaza/Anantara/Peninsula/Capella→ReviewPro, Accor/Rosewood/Mandarin Oriental→TrustYou.`;

const DEEP_SYSTEM = `Research this hotel thoroughly. Execute these searches:
1. "[hotel name] general manager" on Google News and LinkedIn — get GM name and title
2. Hotel official website — get room count, restaurant count, address
3. "[hotel name] Booking.com" or Agoda — get current room rate (ADR estimate) and rating
4. "[hotel name] Google reviews" or TripAdvisor — get rating, review count, feedback themes
5. TripAdvisor management responses for this hotel — check if GM email appears in signature
6. Hotel /contact or /press page — check for GM email

Return ONLY a JSON object (no array, no markdown):
{"adr_usd":null,"rating":null,"review_count":null,"gm_name":null,"gm_first_name":null,"email":null,"email_source":null,"contact_confidence":"L","rooms":null,"restaurants":null,"linkedin":null,"research_notes":"• GM: [name] ([source])\n• Rooms: [N]\n• Restaurants: [N]\n• ADR: ~$[X] ([platform], [date])\n• Rating: [X]/[SCALE] ([N] reviews, [PLATFORM])\n• Theme 1: [X]\n• Theme 2: [X]\n• Provider: [X]"}
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

For EACH hotel, search for all of the following — do not skip:
- GM name: search "[hotel name] general manager" on Google News and LinkedIn
- Room count and restaurant count: hotel official website
- ADR: current rate on Booking.com or Agoda
- Rating + review count: Google or Booking.com
- One guest feedback theme: Google reviews or TripAdvisor

Then output the JSON array with all fields populated.`;

    const maxUses = count <= 3 ? 4 : count <= 6 ? 5 : 6;

    const r = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-api-key': process.env.ANTHROPIC_API_KEY, 'anthropic-version': '2023-06-01', 'anthropic-beta': 'web-search-2025-03-05' },
      body: JSON.stringify({ model: 'claude-haiku-4-5-20251001', max_tokens: 5000, system: SYSTEM, tools: [{ type: 'web_search_20250305', name: 'web_search', max_uses: maxUses }], messages: [{ role: 'user', content: prompt }] })
    });
    const data = await r.json();
    if (!r.ok) return res.status(500).json({ error: data.error?.message || 'API error' });

    const jsonStr = extractJSON(data.content);
    if (!jsonStr) return res.status(200).json({ result: '[]' });

    try {
      const arr = JSON.parse(jsonStr);
      const enriched = JSON.stringify(arr.map(p => ({
        ...p,
        current_provider: inferProvider(p.brand, p.hotel_name) || p.current_provider || null,
        hotel_group: p.hotel_group || p.brand || "Independent"
      })));
      return res.status(200).json({ result: enriched });
    } catch (e) {
      return res.status(200).json({ result: jsonStr });
    }

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}
