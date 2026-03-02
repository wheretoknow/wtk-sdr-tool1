const PROVIDER_MAP = {"ritz-carlton":"Qualtrics","marriott":"Qualtrics","sheraton":"Qualtrics","westin":"Qualtrics","le meridien":"Qualtrics","renaissance":"Qualtrics","autograph":"Qualtrics","moxy":"Qualtrics","aloft":"Qualtrics","intercontinental":"Medallia","kimpton":"Medallia","six senses":"Medallia","regent":"Medallia","hotel indigo":"Medallia","crowne plaza":"Medallia","voco":"Medallia","ihg":"Medallia","park hyatt":"Medallia","andaz":"Medallia","grand hyatt":"Medallia","hyatt":"Medallia","wyndham":"Medallia","radisson":"ReviewPro","park plaza":"ReviewPro","anantara":"ReviewPro","peninsula":"ReviewPro","capella":"ReviewPro","kempinski":"ReviewPro","raffles":"TrustYou","fairmont":"TrustYou","sofitel":"TrustYou","accor":"TrustYou","rosewood":"TrustYou","mandarin oriental":"TrustYou"};

function inferProvider(b, n) {
  const s = ((b || "") + " " + (n || "")).toLowerCase();
  for (const [k, v] of Object.entries(PROVIDER_MAP)) { if (s.includes(k)) return v; }
  return null;
}

// When web search is used, Claude emits multiple text blocks (search narration).
// The actual JSON is always in the LAST text block. join('') breaks parsing.
function extractLastText(content) {
  const blocks = (content || []).filter(b => b.type === 'text');
  return blocks.length ? blocks[blocks.length - 1].text : '';
}

const SYSTEM = `Return ONLY a raw JSON array. No markdown. No explanation. No preamble. Start your response with [ and end with ].
Each hotel: {"hotel_name":"","brand":"brand only e.g. Kimpton","hotel_group":"parent group e.g. IHG or Independent","tier":"Luxury|Premium|Lifestyle|Economy|Function","city":"","country":"","address":"","website":"","rooms":null,"restaurants":null,"adr_usd":null,"rating":null,"review_count":null,"current_provider":null,"gm_name":null,"gm_first_name":null,"gm_title":"General Manager","email":null,"linkedin":null,"phone":null,"email_source":null,"contact_confidence":"L","outreach_email_subject":"REQUIRED - specific tension hook, no generic titles","outreach_email_body":"REQUIRED. MAX 100 words. No labels, no placeholders. Format:\nHello [FirstName],\n\n[1 sentence: specific tension from reviews with platform+timeframe. Be concrete.]\n\n[1 sentence: why invisible to management.]\n\n[If provider known: 'We know you have [Provider] — Where to know works alongside it, adding what [Provider] does not cover: local competitor benchmarking and pattern-to-action mapping. Most clients run both.' Else: skip.]\n\n[1 sentence: concrete outcome. No AI/tech/dashboard words.]\n\nAvailable for 15 min [specific days]?\n\nBest,\nZishuo Wang | Where to know","engagement_strategy":"DIRECT-TO-GM","strategy_reason":"","research_notes":"• GM: name (source)\n• ADR: $X (source)\n• Rating: X/SCALE from PLATFORM (N reviews) — SCALE is 5 for Google/TripAdvisor, 10 for Booking.com/Agoda/Trip.com\n• Provider: X (confirmed source) or Unknown\n• Theme: X"}
Provider map: Marriott brands=Qualtrics, IHG brands(InterContinental/Kimpton/Hotel Indigo/Six Senses/Regent/Crowne Plaza/voco/Holiday Inn)=Medallia, Hyatt/Wyndham=Medallia, Radisson/NH/Park Plaza/Anantara/Peninsula/Capella=ReviewPro, Accor/Rosewood/Mandarin Oriental=TrustYou.
Rules: outreach_email_subject and outreach_email_body are REQUIRED always. For email: search for GM personal email first; use generic (info@, reservations@) as last resort and mark email_source as "generic". Asia hotels: prefer Agoda or Trip.com reviews. Europe/Americas: prefer Booking.com. PROVIDER ACCURACY: only set current_provider if confirmed from a public source, else null.`;

const DEEP_SYSTEM = `Search for this hotel. Return ONLY a JSON object (no array): {"adr_usd":null,"rating":null,"review_count":null,"research_notes":"• GM: name+LinkedIn\n• ADR: $X (Booking.com)\n• Rating: X/5 (N reviews, Google) or X/10 (N reviews, Booking.com)\n• Theme 1: X\n• Theme 2: X\n• Provider: X"}`;

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const { city, brand, segment, count, mode, hotel_name, exclude } = req.body;

    // ── Deep research mode ───────────────────────────────────────────────────
    if (mode === 'deep' && hotel_name) {
      const r = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-api-key': process.env.ANTHROPIC_API_KEY, 'anthropic-version': '2023-06-01', 'anthropic-beta': 'web-search-2025-03-05' },
        body: JSON.stringify({ model: 'claude-haiku-4-5-20251001', max_tokens: 2000, system: DEEP_SYSTEM, tools: [{ type: 'web_search_20250305', name: 'web_search', max_uses: 4 }], messages: [{ role: 'user', content: `Research: ${hotel_name}. Find ADR, rating, reviews, GM LinkedIn, feedback themes.` }] })
      });
      const data = await r.json();
      if (!r.ok) return res.status(500).json({ error: data.error?.message || 'API error' });
      const text = extractLastText(data.content);
      const s = text.indexOf('{'), e = text.lastIndexOf('}');
      if (s >= 0 && e >= 0) return res.status(200).json({ result: text.slice(s, e + 1) });
      return res.status(200).json({ result: text });
    }

    // ── Main search mode ─────────────────────────────────────────────────────
    const tiers = { "Luxury": "luxury 5-star", "Premium": "premium 4-star", "Lifestyle": "lifestyle boutique", "Economy": "economy 3-star", "Function": "airport/convention" };
    const t = tiers[segment] || "luxury";
    const brandFilter = brand ? ` Only include CONFIRMED ${brand} brand properties. Exclude all non-${brand} hotels.` : "";
    const excludeClause = (exclude && exclude.length)
      ? `\n\nDo NOT include these hotels (already in our database): ${exclude.slice(0, 80).join(', ')}. Find different hotels only.`
      : "";

    const prompt = `List ${count} ${t} hotels in ${city}.${brandFilter}${excludeClause} For each: GM name+email, rooms, ADR, recent review theme, brand, parent group. Output as JSON array only.`;

    const r = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-api-key': process.env.ANTHROPIC_API_KEY, 'anthropic-version': '2023-06-01', 'anthropic-beta': 'web-search-2025-03-05' },
      body: JSON.stringify({ model: 'claude-haiku-4-5-20251001', max_tokens: 5000, system: SYSTEM, tools: [{ type: 'web_search_20250305', name: 'web_search', max_uses: 6 }], messages: [{ role: 'user', content: prompt }] })
    });
    const data = await r.json();
    if (!r.ok) return res.status(500).json({ error: data.error?.message || 'API error' });

    let text = extractLastText(data.content);
    try {
      const s = text.indexOf('['), e = text.lastIndexOf(']');
      if (s >= 0 && e >= 0) {
        const arr = JSON.parse(text.slice(s, e + 1));
        text = JSON.stringify(arr.map(p => ({
          ...p,
          current_provider: inferProvider(p.brand, p.hotel_name) || p.current_provider || null,
          hotel_group: p.hotel_group || p.brand || "Independent"
        })));
      }
    } catch (e) {}

    res.status(200).json({ result: text });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}
