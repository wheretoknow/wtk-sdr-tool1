// ═══════════════════════════════════════════════════════════════════════════════
// Where to know Insights GmbH — SDR Research API Handler v3.1
// ═══════════════════════════════════════════════════════════════════════════════
// Changes from v3.0:
//   1. REMOVED deep research mode (will re-add later if needed)
//   2. REMOVED email-only mode (will re-add later if needed)
//   3. Email sanitization: strips "[email protected]" web-scraping artifacts
//   4. Discovery-only: single mode, batch hotel search
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

// Verification sources — these are the URLs we can cite when a GM asks "how do you know?"
const PROVIDER_SOURCES = {
  "Qualtrics":  { brands: "Marriott International", url: "https://www.qualtrics.com/customers/marriott/" },
  "Medallia":   { brands: "IHG, Hilton, Hyatt, Four Seasons, Wyndham", url: "https://www.medallia.com/customers/" },
  "ReviewPro":  { brands: "Kempinski, Radisson, Minor/NH, Barceló, Meliá, Pestana, Iberostar, Shangri-La", url: "https://www.shijigroup.com/press-news/shiji-reviewpro-forms-customer-advisory-board" },
  "TrustYou":   { brands: "Accor, Mandarin Oriental, Rosewood, Jumeirah", url: "https://hoteltechreport.com/marketing/reputation-management/trustyou" },
};

function inferProvider(brand, hotelName) {
  const s = ((brand || "") + " " + (hotelName || "")).toLowerCase();
  // Try longer keys first (more specific matches beat shorter ones)
  const sorted = Object.entries(PROVIDER_MAP).sort((a, b) => b[0].length - a[0].length);
  for (const [k, v] of sorted) { if (s.includes(k)) return v; }
  return null;
}

function getProviderSource(provider) {
  return PROVIDER_SOURCES[provider] || null;
}

// ─── ROBUST JSON EXTRACTION ─────────────────────────────────────────────────
// The model sometimes wraps JSON in markdown fences or adds preamble text.
// This parser tries multiple strategies to find valid JSON.

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
        // If parse fails, keep looking
        start = -1;
      }
    }
  }

  // Strategy 3: Last resort — try each text block individually
  for (let i = blocks.length - 1; i >= 0; i--) {
    const t = blocks[i].trim();
    try {
      const p = JSON.parse(t);
      if (expectArray ? Array.isArray(p) : typeof p === 'object') return t;
    } catch {}
  }

  return null;
}

// ─── SYSTEM PROMPTS ─────────────────────────────────────────────────────────

const CURRENT_YEAR = new Date().getFullYear();
const PREV_YEAR = CURRENT_YEAR - 1;

// ── DISCOVERY (batch mode): find hotels + critical fields only ──────────────
const DISCOVERY_SYSTEM = `You are a hotel research API. Output ONLY a valid JSON array. No text before or after. Start with [ immediately.

TASK: Discover hotels in a given market. For each hotel return these fields:
hotel_name, brand, hotel_group, tier (Luxury|Premium|Lifestyle), city, country, address, website, rooms, gm_name, gm_first_name, gm_title, rating, rating_scale, rating_platform, review_count, contact_confidence, research_notes

SEARCH STRATEGY — for each hotel, run these searches:
1. "[hotel name] official site" → rooms, address, website
2. "[hotel name] general manager ${CURRENT_YEAR} OR ${PREV_YEAR}" → GM name. ONLY accept results from ${PREV_YEAR} or ${CURRENT_YEAR}. Older = flag "⚠ possibly outdated".
3. "[hotel name] Booking.com" OR "[hotel name] Google reviews" → rating + review count

CRITICAL RULES:
- rooms: MUST come from official hotel website or a verified booking platform. Never guess.
- gm_name: MUST include the SOURCE and YEAR in research_notes. If source is before ${PREV_YEAR}, mark "⚠ possibly outdated" and set contact_confidence to "L".
- contact_confidence: "H" = official website or press release from ${PREV_YEAR}+. "M" = LinkedIn or news article. "L" = old/unverified.
- rating: note the platform (Google/Booking.com/TripAdvisor) and scale (out of 5 or 10).
- research_notes: MANDATORY. Format each line as "• Field: value (source, date)". This is how we verify data quality.

DO NOT generate emails. DO NOT search for ADR, email addresses, or restaurants.

Output the JSON array now. Start with [ immediately.`;

// ─── API HANDLER ────────────────────────────────────────────────────────────

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const { city, brand, segment, count, exclude } = req.body;

    // ═════════════════════════════════════════════════════════════════════
    // BATCH / DISCOVERY MODE — find hotels in a market
    // ═════════════════════════════════════════════════════════════════════
    const tiers = {
      "Luxury": "luxury 5-star",
      "Premium": "premium upper-upscale 4-star",
      "Lifestyle": "lifestyle boutique",
      "Economy": "economy 3-star",
      "Function": "airport/convention"
    };
    const t = tiers[segment] || "luxury";
    const brandFilter = brand ? ` Only CONFIRMED ${brand} properties. Exclude all non-${brand}.` : "";
    const excludeClause = (exclude && exclude.length)
      ? `\nSkip these (already in database): ${exclude.slice(0, 60).join(', ')}.`
      : "";

    const prompt = `Find ${count} ${t} hotels in ${city}.${brandFilter}${excludeClause}

For EACH hotel, run these searches:
1. "[hotel name] official site" → rooms, address, website
2. "[hotel name] general manager ${CURRENT_YEAR} OR ${PREV_YEAR}" → current GM name (MUST be from ${PREV_YEAR}+)
3. "[hotel name] Booking.com" → rating and review count

DO NOT generate emails. DO NOT search for email, ADR, or restaurants. Focus ALL searches on rooms, GM, and rating.

Start with [ immediately.`;

    // Scale search budget: 3 per hotel is the sweet spot for discovery
    const maxUses = Math.min(20, Math.max(6, count * 3));
    const maxTokens = Math.min(16000, Math.max(4000, count * 600 + 1000));

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

      // Sanitize email: strip "[email protected]" artifacts from web scraping
      let email = p.email || null;
      if (email) {
        // Common anti-spam patterns from web scraping
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
        // No email copy in discovery mode — that's for deep research
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
