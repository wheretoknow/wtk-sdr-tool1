// ═══════════════════════════════════════════════════════════════════════════════
// Where to know Insights GmbH — SDR Research API Handler v4.0
// ═══════════════════════════════════════════════════════════════════════════════
// Changes from v3.0:
//   1. REMOVED deep research + email-only modes (discovery only)
//   2. New filter logic: scope=chain (group+brand) vs scope=independent (minADR)
//   3. Parse-safe: prompt enforces partial results over giving up
//   4. Fallback JSON extraction: collects individual {} objects from text
//   5. Email sanitization: strips "[email protected]" web-scraping artifacts
//   6. Max 10 hotels per API call to prevent prompt overload
// ═══════════════════════════════════════════════════════════════════════════════

// ─── PROVIDER KNOWLEDGE BASE ────────────────────────────────────────────────

const PROVIDER_MAP = {
  // Marriott International → Qualtrics (confirmed: qualtrics.com/customers/marriott)
  "ritz-carlton":"Qualtrics","st. regis":"Qualtrics","jw marriott":"Qualtrics",
  "w hotels":"Qualtrics","luxury collection":"Qualtrics","edition":"Qualtrics",
  "sheraton":"Qualtrics","westin":"Qualtrics","le méridien":"Qualtrics",
  "le meridien":"Qualtrics","renaissance":"Qualtrics","autograph collection":"Qualtrics",
  "tribute portfolio":"Qualtrics","design hotels":"Qualtrics","marriott":"Qualtrics",
  "delta hotels":"Qualtrics","aloft":"Qualtrics","moxy":"Qualtrics",
  "ac hotels":"Qualtrics","courtyard":"Qualtrics","four points":"Qualtrics",
  "protea":"Qualtrics","springhill":"Qualtrics","towneplace":"Qualtrics",
  "element":"Qualtrics","residence inn":"Qualtrics","fairfield":"Qualtrics",

  // IHG Hotels & Resorts → Medallia (confirmed: medallia.com/customers)
  "intercontinental":"Medallia","kimpton":"Medallia","six senses":"Medallia",
  "regent":"Medallia","vignette collection":"Medallia","hotel indigo":"Medallia",
  "crowne plaza":"Medallia","voco":"Medallia","holiday inn":"Medallia",
  "hualuxe":"Medallia","even hotels":"Medallia","staybridge":"Medallia",
  "candlewood":"Medallia","avid":"Medallia","ihg":"Medallia",

  // Hyatt Hotels Corporation → Medallia (confirmed: medallia.com/customers)
  "park hyatt":"Medallia","andaz":"Medallia","grand hyatt":"Medallia",
  "hyatt regency":"Medallia","hyatt centric":"Medallia","alila":"Medallia",
  "thompson hotels":"Medallia","hyatt":"Medallia","hyatt place":"Medallia",

  // Hilton Worldwide → Medallia (confirmed: medallia.com/customers)
  "waldorf astoria":"Medallia","conrad":"Medallia","lxr":"Medallia",
  "canopy":"Medallia","curio":"Medallia","doubletree":"Medallia",
  "tapestry":"Medallia","hilton":"Medallia","hampton":"Medallia",
  "embassy suites":"Medallia","tru by hilton":"Medallia","homewood":"Medallia",
  "home2":"Medallia","motto":"Medallia","spark":"Medallia","signia":"Medallia",

  // Wyndham Hotels & Resorts → Medallia
  "wyndham":"Medallia","dolce by wyndham":"Medallia","ramada":"Medallia",
  "tryp":"Medallia","la quinta":"Medallia",

  // Radisson Hotel Group → ReviewPro (confirmed: Shiji ReviewPro CAB member)
  "radisson collection":"ReviewPro","radisson blu":"ReviewPro",
  "radisson red":"ReviewPro","radisson":"ReviewPro","park plaza":"ReviewPro",
  "park inn":"ReviewPro","country inn":"ReviewPro","prizeotel":"ReviewPro",

  // Minor International → ReviewPro (confirmed: Shiji ReviewPro CAB member)
  "anantara":"ReviewPro","avani":"ReviewPro","oaks":"ReviewPro",
  "tivoli":"ReviewPro","nh collection":"ReviewPro","nh hotels":"ReviewPro",
  "nhow":"ReviewPro","minor hotels":"ReviewPro",

  // Kempinski → ReviewPro (confirmed: Global Master Service Agreement with Shiji ReviewPro)
  "kempinski":"ReviewPro",

  // Barceló → ReviewPro (confirmed: ReviewPro CAB member)
  "barceló":"ReviewPro","barcelo":"ReviewPro",

  // Meliá → ReviewPro (confirmed: ReviewPro CAB member)
  "meliá":"ReviewPro","melia":"ReviewPro","innside":"ReviewPro","sol hotels":"ReviewPro",

  // Pestana → ReviewPro (confirmed: ReviewPro CAB member)
  "pestana":"ReviewPro",

  // Iberostar → ReviewPro (confirmed: ReviewPro CAB member)
  "iberostar":"ReviewPro",

  // Peninsula Hotels → ReviewPro
  "peninsula":"ReviewPro",

  // Capella Hotel Group → ReviewPro
  "capella":"ReviewPro","patina":"ReviewPro",

  // Accor → TrustYou (confirmed: hoteltechreport.com)
  "raffles":"TrustYou","fairmont":"TrustYou","sofitel":"TrustYou",
  "mgallery":"TrustYou","pullman":"TrustYou","swissôtel":"TrustYou",
  "swissotel":"TrustYou","mövenpick":"TrustYou","movenpick":"TrustYou",
  "novotel":"TrustYou","mercure":"TrustYou","ibis":"TrustYou",
  "25hours":"TrustYou","banyan tree":"TrustYou","accor":"TrustYou",
  "mantra":"TrustYou","peppers":"TrustYou","tribe":"TrustYou",

  // Other confirmed
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
hotel_name, brand, hotel_group, tier, city, country, address, website, rooms, gm_name, gm_first_name, gm_title, rating, rating_scale, rating_platform, review_count, contact_confidence, research_notes

SEARCH STRATEGY — for each hotel, run these searches:
1. "[hotel name] official site" → rooms, address, website
2. "[hotel name] general manager ${CURRENT_YEAR} OR ${PREV_YEAR}" → GM name. ONLY accept results from ${PREV_YEAR} or ${CURRENT_YEAR}. Older = flag "⚠ possibly outdated".
3. "[hotel name] Booking.com" OR "[hotel name] Google reviews" → rating + review count

CRITICAL RULES:
- rooms: MUST come from official hotel website or a verified booking platform. Never guess.
- gm_name: MUST include the SOURCE and YEAR in research_notes. If source is before ${PREV_YEAR}, mark "⚠ possibly outdated" and set contact_confidence to "L".
- contact_confidence: "H" = official website or press release from ${PREV_YEAR}+. "M" = LinkedIn or news article. "L" = old/unverified.
- rating: note the platform (Google/Booking.com/TripAdvisor) and scale (out of 5 or 10).
- research_notes: MANDATORY. Format each line as "• Field: value (source, date)".
- tier: classify as "Luxury" (5-star, ADR>$200), "Premium" (4-star+, ADR $100-200), "Lifestyle" (boutique/design), "Economy" (3-star or below).

DO NOT generate emails. DO NOT search for email addresses or restaurants.

★ PARTIAL RESULTS RULE (CRITICAL) ★
If you run out of search budget or cannot find all requested hotels:
- Output whatever you HAVE found so far as a valid JSON array
- An array with 1-2 hotels is BETTER than no output
- NEVER output explanation text instead of JSON
- NEVER say "I cannot fulfill" — just return the partial array
- Even if you found 0 verified hotels, output an empty array: []

Output the JSON array now. Start with [ immediately.`;


// ─── API HANDLER ────────────────────────────────────────────────────────────

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const { city, brand, group, scope, minAdr, count, exclude } = req.body;

    // Cap per-call hotel count at 10 to prevent prompt overload
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

For EACH hotel found, search for:
1. "[hotel name] official site" → rooms, address, website
2. "[hotel name] general manager ${CURRENT_YEAR} OR ${PREV_YEAR}" → current GM
3. "[hotel name] Booking.com" → rating and review count

DO NOT generate emails. Focus ALL searches on rooms, GM, and rating.
If you find fewer than ${safeCount}, output what you found. Partial results are fine.

Start with [ immediately.`;

    // Scale search budget: 3 per hotel, min 6, max 20
    const maxUses = Math.min(20, Math.max(6, safeCount * 3));
    const maxTokens = Math.min(16000, Math.max(4000, safeCount * 600 + 1000));

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
