const PROVIDER_MAP = {"ritz-carlton":"Qualtrics","marriott":"Qualtrics","sheraton":"Qualtrics","westin":"Qualtrics","le meridien":"Qualtrics","renaissance":"Qualtrics","autograph":"Qualtrics","moxy":"Qualtrics","aloft":"Qualtrics","intercontinental":"Medallia","kimpton":"Medallia","six senses":"Medallia","regent":"Medallia","hotel indigo":"Medallia","crowne plaza":"Medallia","voco":"Medallia","ihg":"Medallia","park hyatt":"Medallia","andaz":"Medallia","grand hyatt":"Medallia","hyatt":"Medallia","wyndham":"Medallia","radisson":"ReviewPro","park plaza":"ReviewPro","anantara":"ReviewPro","peninsula":"ReviewPro","capella":"ReviewPro","kempinski":"ReviewPro","raffles":"TrustYou","fairmont":"TrustYou","sofitel":"TrustYou","accor":"TrustYou","rosewood":"TrustYou","mandarin oriental":"TrustYou"};

function inferProvider(b, n) {
  const s = ((b || "") + " " + (n || "")).toLowerCase();
  for (const [k, v] of Object.entries(PROVIDER_MAP)) { if (s.includes(k)) return v; }
  return null;
}

// Search ALL text blocks for one containing a JSON array — not just the last block.
// The last block is sometimes a disclaimer ("I couldn't find X"). The JSON is in an earlier block.
function extractJSON(content) {
  const blocks = (content || []).filter(b => b.type === 'text').map(b => b.text || '');
  // Search from last to first — prefer later blocks but fall back to any block with [
  for (let i = blocks.length - 1; i >= 0; i--) {
    const s = blocks[i].indexOf('[');
    const e = blocks[i].lastIndexOf(']');
    if (s >= 0 && e > s) return blocks[i].slice(s, e + 1);
  }
  return '';
}

function extractJSONObject(content) {
  const blocks = (content || []).filter(b => b.type === 'text').map(b => b.text || '');
  for (let i = blocks.length - 1; i >= 0; i--) {
    const s = blocks[i].indexOf('{');
    const e = blocks[i].lastIndexOf('}');
    if (s >= 0 && e > s) return blocks[i].slice(s, e + 1);
  }
  return '';
}

const SYSTEM = `You are a data extraction API. You MUST always return a valid JSON array, no matter what.

CRITICAL RULES:
1. Start your response with [ and end with ]. Nothing before [, nothing after ].
2. If a field is unknown or not found, use null. NEVER refuse to output JSON because data is missing.
3. Do NOT write explanations, disclaimers, or apologies. JSON only.
4. outreach_email_subject and outreach_email_body are REQUIRED — write them based on whatever you know about the hotel, even if details are limited.

Each hotel object schema:
{"hotel_name":"","brand":"","hotel_group":"","tier":"Luxury|Premium|Lifestyle|Economy|Function","city":"","country":"","address":"","website":"","rooms":null,"restaurants":null,"adr_usd":null,"rating":null,"review_count":null,"current_provider":null,"gm_name":null,"gm_first_name":null,"gm_title":"General Manager","email":null,"linkedin":null,"phone":null,"email_source":null,"contact_confidence":"L","outreach_email_subject":"specific tension hook based on hotel reputation","outreach_email_body":"MAX 100 words. Hello [FirstName],\n\n[specific operational tension from reviews or known reputation, with platform+timeframe if available]\n\n[why this is invisible to management without the right tool]\n\n[if provider known: We know you have [Provider] — Where to know works alongside it, adding local competitor benchmarking and pattern-to-action mapping. Most clients run both.]\n\n[one concrete outcome sentence]\n\nAvailable for 15 min this week or next?\n\nBest,\nZishuo Wang | Where to know","engagement_strategy":"DIRECT-TO-GM","strategy_reason":"","research_notes":"• GM: name (source)\n• ADR: $X or Unknown\n• Rating: X/SCALE (N reviews, PLATFORM) or Unknown\n• Provider: X or Unknown\n• Theme: X"}

Provider inference: Marriott brands→Qualtrics, IHG brands(InterContinental/Kimpton/Hotel Indigo/Six Senses/Regent/Crowne Plaza/voco)→Medallia, Hyatt/Wyndham→Medallia, Radisson/NH/Park Plaza/Anantara/Peninsula/Capella→ReviewPro, Accor/Rosewood/Mandarin Oriental→TrustYou.
For email: search for GM personal email first; use hotel generic email (info@, reservations@) as last resort and set email_source="generic". If nothing found, email=null.
Asia hotels: prefer Agoda/Trip.com ratings. Europe/Americas: prefer Booking.com.`;

const DEEP_SYSTEM = `Search for this hotel. Return ONLY a JSON object (no array, no markdown):
{"adr_usd":null,"rating":null,"review_count":null,"research_notes":"• GM: name+LinkedIn\n• ADR: $X (source)\n• Rating: X/5 or X/10 (N reviews, PLATFORM)\n• Theme 1: X\n• Theme 2: X\n• Provider: X"}
If data is unavailable, use null. Always output the JSON object.`;

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
      const text = extractJSONObject(data.content);
      if (text) return res.status(200).json({ result: text });
      return res.status(200).json({ result: '{}' });
    }

    // ── Main search mode ─────────────────────────────────────────────────────
    const tiers = { "Luxury": "luxury 5-star", "Premium": "premium 4-star", "Lifestyle": "lifestyle boutique", "Economy": "economy 3-star", "Function": "airport/convention" };
    const t = tiers[segment] || "luxury";
    const brandFilter = brand ? ` Only include CONFIRMED ${brand} brand properties. Exclude all non-${brand} hotels.` : "";
    const excludeClause = (exclude && exclude.length)
      ? `\n\nSkip these hotels (already in database): ${exclude.slice(0, 60).join(', ')}.`
      : "";

    const prompt = `Find ${count} ${t} hotels in ${city}.${brandFilter}${excludeClause} Search for GM names, room counts, ADR, recent guest feedback themes. Then output the JSON array.`;

    // Scale searches with batch size — cap at 5 to stay within token limits (~3k tokens/search)
    const maxUses = count <= 3 ? 2 : count <= 6 ? 3 : count <= 10 ? 4 : 5;

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
      // JSON parse failed — return raw string, let frontend try
      return res.status(200).json({ result: jsonStr });
    }

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}
