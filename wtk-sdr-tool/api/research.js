// ═══════════════════════════════════════════════════════════════════════════════
// Where to know Insights GmbH — SDR Research API Handler v5.0
// ═══════════════════════════════════════════════════════════════════════════════
// TWO-STEP ARCHITECTURE:
//   Step 1 "list"   — Haiku, NO web search. Lists hotel names from training data.
//                      Cost: ~$0.001. Returns: [{hotel_name, city, country, brand}]
//   Step 2 "verify" — Haiku, 2 web searches per hotel. Verifies rooms + GM.
//                      Cost: ~$0.02-0.05 per batch. Returns full hotel objects.
//
// This eliminates the "dice roll" problem where the model wastes searches
// rediscovering hotels it already knows about.
// ═══════════════════════════════════════════════════════════════════════════════

// ─── PROVIDER KNOWLEDGE BASE ────────────────────────────────────────────────

const PROVIDER_MAP = {
  "ritz-carlton":"Qualtrics","st. regis":"Qualtrics","jw marriott":"Qualtrics",
  "w hotels":"Qualtrics","luxury collection":"Qualtrics","edition":"Qualtrics",
  "sheraton":"Qualtrics","westin":"Qualtrics","le méridien":"Qualtrics",
  "le meridien":"Qualtrics","renaissance":"Qualtrics","autograph collection":"Qualtrics",
  "tribute portfolio":"Qualtrics","design hotels":"Qualtrics","marriott":"Qualtrics",
  "delta hotels":"Qualtrics","aloft":"Qualtrics","moxy":"Qualtrics",
  "ac hotels":"Qualtrics","courtyard":"Qualtrics","four points":"Qualtrics",
  "protea":"Qualtrics","springhill":"Qualtrics","towneplace":"Qualtrics",
  "element":"Qualtrics","residence inn":"Qualtrics","fairfield":"Qualtrics",

  "intercontinental":"Medallia","kimpton":"Medallia","six senses":"Medallia",
  "regent":"Medallia","vignette collection":"Medallia","hotel indigo":"Medallia",
  "crowne plaza":"Medallia","voco":"Medallia","holiday inn":"Medallia",
  "hualuxe":"Medallia","even hotels":"Medallia","staybridge":"Medallia",
  "candlewood":"Medallia","avid":"Medallia","ihg":"Medallia",

  "park hyatt":"Medallia","andaz":"Medallia","grand hyatt":"Medallia",
  "hyatt regency":"Medallia","hyatt centric":"Medallia","alila":"Medallia",
  "thompson hotels":"Medallia","hyatt":"Medallia","hyatt place":"Medallia",

  "waldorf astoria":"Medallia","conrad":"Medallia","lxr":"Medallia",
  "canopy":"Medallia","curio":"Medallia","doubletree":"Medallia",
  "tapestry":"Medallia","hilton":"Medallia","hampton":"Medallia",
  "embassy suites":"Medallia","tru by hilton":"Medallia","homewood":"Medallia",
  "home2":"Medallia","motto":"Medallia","spark":"Medallia","signia":"Medallia",

  "wyndham":"Medallia","dolce by wyndham":"Medallia","ramada":"Medallia",
  "tryp":"Medallia","la quinta":"Medallia",

  "radisson collection":"ReviewPro","radisson blu":"ReviewPro",
  "radisson red":"ReviewPro","radisson":"ReviewPro","park plaza":"ReviewPro",
  "park inn":"ReviewPro","country inn":"ReviewPro","prizeotel":"ReviewPro",

  "anantara":"ReviewPro","avani":"ReviewPro","oaks":"ReviewPro",
  "tivoli":"ReviewPro","nh collection":"ReviewPro","nh hotels":"ReviewPro",
  "nhow":"ReviewPro","minor hotels":"ReviewPro",

  "kempinski":"ReviewPro",
  "barceló":"ReviewPro","barcelo":"ReviewPro",
  "meliá":"ReviewPro","melia":"ReviewPro","innside":"ReviewPro","sol hotels":"ReviewPro",
  "pestana":"ReviewPro","iberostar":"ReviewPro",
  "peninsula":"ReviewPro","capella":"ReviewPro","patina":"ReviewPro",

  "raffles":"TrustYou","fairmont":"TrustYou","sofitel":"TrustYou",
  "mgallery":"TrustYou","pullman":"TrustYou","swissôtel":"TrustYou",
  "swissotel":"TrustYou","mövenpick":"TrustYou","movenpick":"TrustYou",
  "novotel":"TrustYou","mercure":"TrustYou","ibis":"TrustYou",
  "25hours":"TrustYou","banyan tree":"TrustYou","accor":"TrustYou",
  "mantra":"TrustYou","peppers":"TrustYou","tribe":"TrustYou",

  "mandarin oriental":"TrustYou","rosewood":"TrustYou",
  "langham":"Medallia","dorchester":"Medallia",
  "shangri-la":"ReviewPro","shangri la":"ReviewPro",
  "pan pacific":"ReviewPro","parkroyal":"ReviewPro",
  "jumeirah":"TrustYou","four seasons":"Medallia","aman":"Medallia",
};

const PROVIDER_SOURCES = {
  "Qualtrics":  { brands: "Marriott International", url: "https://www.qualtrics.com/customers/marriott/" },
  "Medallia":   { brands: "IHG, Hilton, Hyatt, Four Seasons, Wyndham", url: "https://www.medallia.com/customers/" },
  "ReviewPro":  { brands: "Kempinski, Radisson, Minor/NH, Barceló, Meliá, Pestana, Iberostar, Shangri-La", url: "https://www.shijigroup.com/press-news/shiji-reviewpro-forms-customer-advisory-board" },
  "TrustYou":   { brands: "Accor, Mandarin Oriental, Rosewood, Jumeirah", url: "https://hoteltechreport.com/marketing/reputation-management/trustyou" },
};

function inferProvider(brand, hotelName) {
  const s = ((brand || "") + " " + (hotelName || "")).toLowerCase();
  const sorted = Object.entries(PROVIDER_MAP).sort((a, b) => b[0].length - a[0].length);
  for (const [k, v] of sorted) { if (s.includes(k)) return v; }
  return null;
}

function getProviderSource(provider) {
  return PROVIDER_SOURCES[provider] || null;
}

// ─── ROBUST JSON EXTRACTION ─────────────────────────────────────────────────

function extractJSON(content, expectArray = true) {
  const blocks = (content || []).filter(b => b.type === 'text').map(b => b.text || '');
  const fullText = blocks.join('\n');

  // Strategy 1: Strip markdown code fences
  const fenceMatch = fullText.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (fenceMatch) {
    try {
      const parsed = JSON.parse(fenceMatch[1].trim());
      if (expectArray ? Array.isArray(parsed) : typeof parsed === 'object') return fenceMatch[1].trim();
    } catch {}
  }

  // Strategy 2: Bracket depth matching
  const open = expectArray ? '[' : '{';
  const close = expectArray ? ']' : '}';
  let depth = 0, start = -1;
  for (let i = 0; i < fullText.length; i++) {
    if (fullText[i] === open) { if (depth === 0) start = i; depth++; }
    else if (fullText[i] === close) {
      depth--;
      if (depth === 0 && start >= 0) {
        const candidate = fullText.slice(start, i + 1);
        try { JSON.parse(candidate); return candidate; } catch {}
        start = -1;
      }
    }
  }

  // Strategy 3: Collect scattered {} objects
  if (expectArray) {
    const objects = [];
    let objDepth = 0, objStart = -1;
    for (let i = 0; i < fullText.length; i++) {
      if (fullText[i] === '{') { if (objDepth === 0) objStart = i; objDepth++; }
      else if (fullText[i] === '}') {
        objDepth--;
        if (objDepth === 0 && objStart >= 0) {
          try {
            const obj = JSON.parse(fullText.slice(objStart, i + 1));
            if (obj.hotel_name) objects.push(obj);
          } catch {}
          objStart = -1;
        }
      }
    }
    if (objects.length > 0) return JSON.stringify(objects);
  }

  // Strategy 4: Individual text blocks
  for (let i = blocks.length - 1; i >= 0; i--) {
    try {
      const p = JSON.parse(blocks[i].trim());
      if (expectArray ? Array.isArray(p) : typeof p === 'object') return blocks[i].trim();
    } catch {}
  }

  return null;
}

// ─── SYSTEM PROMPTS ─────────────────────────────────────────────────────────

const CURRENT_YEAR = new Date().getFullYear();
const PREV_YEAR = CURRENT_YEAR - 1;

// Step 1: LIST — no web search, uses training data only
const LIST_SYSTEM = `You are a hotel database. Output ONLY a JSON array. No explanation. Start with [ immediately.

List all hotels you know that match the query. For each hotel output:
{"hotel_name":"Full Hotel Name","city":"City","country":"Country","brand":"Brand Name","hotel_group":"Parent Group"}

RULES:
- Include ONLY hotels you are confident actually exist as of ${CURRENT_YEAR}.
- Do NOT invent hotels. If unsure, omit.
- Include hotels worldwide unless a specific region is requested.
- Output as many as you know. 50+ is fine for large chains.
- Start with [ immediately. End with ]. Nothing else.`;

// Step 2: VERIFY — web search to fill in rooms + GM
const VERIFY_SYSTEM = `You are a hotel research API. Output ONLY a JSON array. No explanation. Start with [ immediately.

You will receive hotel names with approximate cities. Verify each via web search.

For EACH hotel, run exactly 2 searches:
1. "[hotel name] Booking.com" → EXACT hotel name as listed on Booking.com, rooms, address, city, country, website
2. "[hotel name] general manager ${CURRENT_YEAR} OR ${PREV_YEAR}" → GM name

Return for each hotel:
hotel_name, brand, hotel_group, tier, city, country, address, website, rooms, gm_name, gm_first_name, gm_title, contact_confidence, research_notes

★ HOTEL NAME RULE: hotel_name MUST match the EXACT name on Booking.com. Example: "Kimpton Hotel Monaco Portland" not "Hotel Monaco Portland".
★ CITY RULE: Use the ACTUAL city from the hotel's address, not the approximate city from the input.

RULES:
- brand: keep as given in input.
- rooms: from official site or Booking.com. Never guess.
- gm_name: SOURCE and YEAR in research_notes. Before ${PREV_YEAR} = "⚠ possibly outdated", contact_confidence="L".
- contact_confidence: "H" = official/press ${PREV_YEAR}+. "M" = LinkedIn/news. "L" = old/unverified.
- research_notes: "Field: value (source, date)" per line. No bullet characters.
- Set rating, rating_scale, rating_platform, review_count to null.
- tier: "Luxury" (5-star), "Premium" (4-star+), "Lifestyle" (boutique), "Economy" (3-star-).

★★★ CRITICAL ★★★
- Output JSON array even if you only verified 1 hotel. Use null for unfound fields.
- NEVER output explanation text. Just the array. Start with [ immediately.`;


// ─── API HANDLER ────────────────────────────────────────────────────────────

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const { mode, city, brand, group, scope, minAdr, count, exclude, hotels } = req.body;

    // ═════════════════════════════════════════════════════════════════════
    // STEP 1: LIST — no web search, cheap and fast
    // Returns hotel names from model's training data
    // ═════════════════════════════════════════════════════════════════════
    if (mode === 'list') {
      let listPrompt = "";

      if (scope === "chain" && (brand || group)) {
        if (brand && group) {
          listPrompt = `List ALL known ${brand} hotels (part of ${group} group) worldwide. Include every property you know of.`;
        } else if (brand) {
          listPrompt = `List ALL known ${brand} hotels worldwide. Include every property you know of.`;
        } else {
          listPrompt = `List ALL known hotels belonging to ${group} group worldwide. Include every brand within ${group}.`;
        }
      } else if (scope === "independent") {
        const adr = parseInt(minAdr) || 150;
        const market = city || "worldwide";
        listPrompt = `List luxury independent hotels (NOT part of major chains) in ${market} with estimated ADR above $${adr}/night. Include members of Relais & Châteaux, Leading Hotels of the World, Small Luxury Hotels.`;
      } else {
        const market = city || "worldwide";
        listPrompt = `List all luxury and upscale hotels in ${market}.`;
      }

      // Add market filter if specified
      if (city && scope === "chain") {
        listPrompt += `\nFilter to hotels in or near: ${city}.`;
      }

      const r = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': process.env.ANTHROPIC_API_KEY,
          'anthropic-version': '2023-06-01',
        },
        body: JSON.stringify({
          model: 'claude-haiku-4-5-20251001',
          max_tokens: 8000,
          system: LIST_SYSTEM,
          messages: [{ role: 'user', content: listPrompt }]
        })
      });

      const data = await r.json();
      if (!r.ok) return res.status(500).json({ error: data.error?.message || 'List API error' });

      const jsonStr = extractJSON(data.content, true);
      if (!jsonStr) {
        return res.status(200).json({ result: '[]', debug: 'No JSON from list step' });
      }

      let arr;
      try { arr = JSON.parse(jsonStr); } catch { return res.status(200).json({ result: '[]', debug: 'List JSON parse failed' }); }

      return res.status(200).json({ result: JSON.stringify(arr || []) });
    }

    // ═════════════════════════════════════════════════════════════════════
    // STEP 2: VERIFY — web search for specific hotels
    // Takes hotel names, verifies rooms + GM via web search
    // ═════════════════════════════════════════════════════════════════════
    if (mode === 'verify' && hotels && hotels.length > 0) {
      const batch = hotels.slice(0, 10); // 10 × 2 = 20 searches at limit; fallback if parse fails
      const maxUses = Math.min(20, batch.length * 2);
      const maxTokens = Math.min(12000, batch.length * 600 + 1000);

      const hotelList = batch.map((h, i) =>
        `${i+1}. "${h.hotel_name}" in ${h.city}, ${h.country} (brand: ${h.brand || "unknown"})`
      ).join('\n');

      const prompt = `[${hotelList}]

Verify these ${batch.length} hotels. For EACH:
1. Search "[hotel name] Booking.com" → get EXACT Booking.com name, rooms, address, actual city
2. Search "[hotel name] general manager ${CURRENT_YEAR} OR ${PREV_YEAR}" → GM name

hotel_name must match Booking.com listing exactly. City must be from actual address.
Output JSON array. Start with [ immediately.`;

      const r = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': process.env.ANTHROPIC_API_KEY,
          'anthropic-version': '2023-06-01',
          'anthropic-beta': 'web-search-2025-03-05'
        },
        body: JSON.stringify({
          model: 'claude-haiku-4-5-20251001',
          max_tokens: maxTokens,
          system: VERIFY_SYSTEM,
          tools: [{ type: 'web_search_20250305', name: 'web_search', max_uses: maxUses }],
          messages: [{ role: 'user', content: prompt }]
        })
      });

      const data = await r.json();
      if (!r.ok) return res.status(500).json({ error: data.error?.message || 'Verify API error' });

      const jsonStr = extractJSON(data.content, true);
      if (!jsonStr) {
        const allText = (data.content || []).filter(b => b.type === 'text').map(b => b.text || '').join('\n');
        return res.status(200).json({ result: '[]', debug: allText.slice(0, 500) });
      }

      let arr;
      try { arr = JSON.parse(jsonStr); } catch { return res.status(200).json({ result: '[]', debug: 'Verify parse failed' }); }

      // Enrich with provider data + force group/brand from user's filter selection
      const inputLookup = {};
      for (const h of batch) {
        const key = (h.hotel_name || "").toLowerCase().replace(/[^a-z0-9]/g, "");
        inputLookup[key] = h;
      }

      // Authoritative brand/group from user selection (e.g. user picked IHG > Kimpton)
      const authBrand = brand || null;
      const authGroup = group || null;

      const enriched = (arr || []).map(p => {
        const effectiveBrand = authBrand || p.brand;
        const provider = inferProvider(effectiveBrand, p.hotel_name) || p.current_provider || null;
        const providerSrc = provider ? getProviderSource(provider) : null;

        let email = p.email || null;
        if (email && (email.includes('[email') || email.includes('email protected'))) email = null;

        return {
          ...p,
          // Force brand/group from user's filter selection (authoritative)
          brand: authBrand || p.brand,
          hotel_group: authGroup || p.hotel_group || "Independent",
          email,
          current_provider: provider,
          provider_source: p.provider_source || (providerSrc ? providerSrc.url : null),
          tier: p.tier || "Luxury",
          outreach_email_subject: null,
          outreach_email_body: null,
          followup_email_body: null,
        };
      });

      return res.status(200).json({ result: JSON.stringify(enriched) });
    }

    return res.status(400).json({ error: 'Invalid mode. Use "list" or "verify".' });

  } catch (err) {
    console.error('Handler error:', err);
    res.status(500).json({ error: err.message });
  }
}
