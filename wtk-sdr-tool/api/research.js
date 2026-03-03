// ═══════════════════════════════════════════════════════════════════════════════
// Where to know Insights GmbH — SDR Research API Handler v4.2
// ═══════════════════════════════════════════════════════════════════════════════
// v4.2: batch 10 × 2 searches (skip rating). Rating/ADR added manually later.
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
  "pestana":"ReviewPro",
  "iberostar":"ReviewPro",
  "peninsula":"ReviewPro",
  "capella":"ReviewPro","patina":"ReviewPro",

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
  "jumeirah":"TrustYou",
  "four seasons":"Medallia",
  "aman":"Medallia",
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
      if (expectArray ? Array.isArray(parsed) : typeof parsed === 'object') {
        return fenceMatch[1].trim();
      }
    } catch {}
  }

  // Strategy 2: Find outermost bracket pair
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

  // Strategy 3: Collect individual {} hotel objects from scattered text
  if (expectArray) {
    const objects = [];
    let objDepth = 0, objStart = -1;
    for (let i = 0; i < fullText.length; i++) {
      if (fullText[i] === '{') { if (objDepth === 0) objStart = i; objDepth++; }
      else if (fullText[i] === '}') {
        objDepth--;
        if (objDepth === 0 && objStart >= 0) {
          const candidate = fullText.slice(objStart, i + 1);
          try {
            const obj = JSON.parse(candidate);
            if (obj.hotel_name) objects.push(obj);
          } catch {}
          objStart = -1;
        }
      }
    }
    if (objects.length > 0) return JSON.stringify(objects);
  }

  // Strategy 4: Try each text block individually
  for (let i = blocks.length - 1; i >= 0; i--) {
    const t = blocks[i].trim();
    try {
      const p = JSON.parse(t);
      if (expectArray ? Array.isArray(p) : typeof p === 'object') return t;
    } catch {}
  }

  return null;
}

// ─── SYSTEM PROMPT ──────────────────────────────────────────────────────────

const CURRENT_YEAR = new Date().getFullYear();
const PREV_YEAR = CURRENT_YEAR - 1;

const DISCOVERY_SYSTEM = `You are a hotel research API. Your ONLY output is a valid JSON array. No thinking, no explanation, no markdown. Start with [ immediately.

TASK: Discover hotels in a given market. For each hotel return these fields:
hotel_name, brand, hotel_group, tier, city, country, address, website, rooms, gm_name, gm_first_name, gm_title, contact_confidence, research_notes

SEARCH STRATEGY — for each hotel, run exactly 2 searches:
1. "[hotel name] official site" → rooms, address, website, brand
2. "[hotel name] general manager ${CURRENT_YEAR} OR ${PREV_YEAR}" → GM name. ONLY accept results from ${PREV_YEAR} or ${CURRENT_YEAR}. Older = flag "⚠ possibly outdated".

DO NOT search for ratings, reviews, ADR, email addresses, or restaurants. Set rating, rating_scale, rating_platform, review_count to null.

CRITICAL RULES:
- rooms: MUST come from official hotel website or a verified booking platform. Never guess.
- gm_name: MUST include the SOURCE and YEAR in research_notes. If source is before ${PREV_YEAR}, mark "⚠ possibly outdated" and set contact_confidence to "L".
- contact_confidence: "H" = official website or press release from ${PREV_YEAR}+. "M" = LinkedIn or news article. "L" = old/unverified.
- research_notes: MANDATORY. Format: "Field: value (source, date)" per line. No bullet characters.
- tier: classify as "Luxury" (5-star), "Premium" (4-star+), "Lifestyle" (boutique/design), "Economy" (3-star or below).

★★★ CRITICAL OUTPUT RULES ★★★
1. You MUST output a JSON array even if you only found 1 hotel.
2. If you run out of search budget, output what you have. Use null for missing fields.
3. NEVER output explanation text. NEVER say "I cannot fulfill". Just output the array.
4. If you found 0 hotels, output: []
5. Start with [ and end with ]. Nothing else.

Start with [ immediately.`;


// ─── API HANDLER ────────────────────────────────────────────────────────────

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const { city, brand, group, scope, minAdr, count, exclude } = req.body;

    // Cap per-call at 10 hotels — 10×2 = 20 searches, fits in budget
    const safeCount = Math.min(Math.max(parseInt(count) || 5, 1), 10);

    // ── Build scope instruction ─────────────────────────────────────
    let scopeInstruction = "";

    if (scope === "chain" && (brand || group)) {
      if (brand && group) {
        scopeInstruction = `Only CONFIRMED ${brand} brand properties (part of ${group} group). Exclude all non-${brand} hotels.`;
      } else if (brand) {
        scopeInstruction = `Only CONFIRMED ${brand} properties. Exclude all non-${brand} hotels.`;
      } else {
        scopeInstruction = `Only hotels belonging to ${group} group (any brand within ${group}). Exclude non-${group} hotels.`;
      }
    } else if (scope === "independent") {
      const adr = parseInt(minAdr) || 150;
      scopeInstruction = `Only INDEPENDENT hotels (NOT part of any major chain like Marriott, IHG, Hilton, Hyatt, Accor, Radisson, Kempinski, etc). Target upscale/luxury independents with estimated ADR above $${adr}/night. Include boutique hotels, members of Relais & Châteaux, Leading Hotels of the World, Small Luxury Hotels, and local luxury brands.`;
    } else if (brand) {
      // Legacy fallback
      scopeInstruction = `Only CONFIRMED ${brand} properties. Exclude all non-${brand} hotels.`;
    }

    const excludeClause = (exclude && exclude.length)
      ? `\nSkip these (already in database): ${exclude.slice(0, 60).join(', ')}.`
      : "";

    const marketDesc = city || "the requested market";
    const prompt = `Find ${safeCount} hotels in ${marketDesc}.${scopeInstruction ? '\n' + scopeInstruction : ''}${excludeClause}

For EACH hotel found, run exactly 2 searches:
1. "[hotel name] official site" → rooms, address, website
2. "[hotel name] general manager ${CURRENT_YEAR} OR ${PREV_YEAR}" → current GM

DO NOT search for ratings, reviews, or email. Use null for rating fields.
If you find fewer than ${safeCount}, output what you found. Use null for missing fields.

Start with [ immediately.`;

    // Search budget: 2 per hotel (skip rating), max 20
    const maxUses = Math.min(20, Math.max(6, safeCount * 2));
    const maxTokens = Math.min(12000, Math.max(4000, safeCount * 500 + 1000));

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
        system: DISCOVERY_SYSTEM,
        tools: [{ type: 'web_search_20250305', name: 'web_search', max_uses: maxUses }],
        messages: [{ role: 'user', content: prompt }]
      })
    });

    const data = await r.json();
    if (!r.ok) {
      return res.status(500).json({ error: data.error?.message || 'Discovery API error' });
    }

    const jsonStr = extractJSON(data.content, true);

    if (!jsonStr) {
      const allText = (data.content || []).filter(b => b.type === 'text').map(b => b.text || '').join('\n');
      return res.status(200).json({
        result: '[]',
        debug: allText.slice(0, 500) || `stop_reason: ${data.stop_reason}, blocks: ${(data.content || []).length}`
      });
    }

    let arr;
    try {
      arr = JSON.parse(jsonStr);
    } catch (e) {
      return res.status(200).json({ result: '[]', debug: 'JSON.parse failed: ' + e.message });
    }

    if (!Array.isArray(arr) || arr.length === 0) {
      return res.status(200).json({ result: '[]', debug: 'Parsed but empty array' });
    }

    // Enrich each hotel with provider data from brand map
    const enriched = arr.map(p => {
      const provider = inferProvider(p.brand, p.hotel_name) || p.current_provider || null;
      const providerSrc = provider ? getProviderSource(provider) : null;

      // Sanitize email
      let email = p.email || null;
      if (email) {
        if (email.includes('[email') || email.includes('email protected') || email.includes('email\u00a0protected')) {
          email = null;
        }
      }

      return {
        ...p,
        email: email,
        current_provider: provider,
        provider_source: p.provider_source || (providerSrc ? providerSrc.url : null),
        hotel_group: p.hotel_group || p.brand || "Independent",
        tier: p.tier || "Luxury",
        outreach_email_subject: null,
        outreach_email_body: null,
        followup_email_body: null,
      };
    });

    return res.status(200).json({ result: JSON.stringify(enriched) });

  } catch (err) {
    console.error('Handler error:', err);
    res.status(500).json({ error: err.message });
  }
}
