// ═══════════════════════════════════════════════════════════════════════════════
// Where to know Insights GmbH — SDR Research API Handler v3.0
// ═══════════════════════════════════════════════════════════════════════════════
// Changes from v2:
//   1. Two-pass deep research: RESEARCH pass (Sonnet, 12 searches) → EMAIL pass (Haiku, 0 searches)
//   2. Discovery mode: scaled search budget (3 per hotel), focused prompts
//   3. Email output: first outreach + follow-up ONLY (no 3rd/4th emails, no LinkedIn DM)
//   4. Provider: skip search for known chains, only search for independents/unknowns
//   5. GM recency: explicit year-gating in prompts, staleness flag
//   6. JSON extraction: robust multi-strategy parser with fallback
//   7. research_notes: mandatory sourced citations for every field
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

// ── DEEP RESEARCH (single hotel, pass 1): thorough fact-finding ─────────────
function buildDeepResearchSystem(knownProvider) {
  const providerInstruction = knownProvider
    ? `PROVIDER: Already known as "${knownProvider}" from brand-chain mapping. Do NOT waste a search on this. Set current_provider="${knownProvider}".`
    : `PROVIDER: This is an independent/unknown-chain hotel. Search: "[hotel name] ReviewPro OR TrustYou OR Medallia OR guest feedback platform". If found, note the source URL. If not found, set current_provider and provider_source to null.`;

  return `You are researching ONE hotel in depth. Your job is to find VERIFIED FACTS with sources. Output ONLY a JSON object. Start with { immediately.

SEARCH PRIORITY (execute in this order):

🔴 CRITICAL — use 2+ searches if first attempt fails:

1. GM NAME + RECENCY VERIFICATION
   Search A: "[hotel name] general manager ${CURRENT_YEAR}" OR "${PREV_YEAR}"
   Search B: "[hotel name] general manager appointed" site:hospitalitynet.org OR site:hotelnewsresource.com
   Search C (if found): "[GM name] ${CURRENT_YEAR}" → confirm they are STILL at this hotel, not moved elsewhere
   - If LinkedIn shows a DIFFERENT current role → they have LEFT. Mark "⚠ GM has likely changed" and set contact_confidence="L"
   - contact_confidence: "H" = press release or official site, ${PREV_YEAR}+. "M" = LinkedIn/news. "L" = old/uncertain.

2. GM EMAIL + CONTACT
   Search: "[hotel name] TripAdvisor" → read management responses, GMs sometimes sign with email
   Search: hotel official website /contact or /about or /team page
   - If email found: note the exact source URL
   - If NOT found: provide the hotel's general contact/reservations email and note "GM direct email not found"
   - NEVER construct or guess email addresses (e.g. firstname.lastname@brand.com = FORBIDDEN)

3. ROOM COUNT
   Search: hotel official website "rooms" OR "accommodations" OR "about"
   Fallback: "[hotel name] rooms suites" on Booking.com or conference databases
   - MUST have a source. Never leave null without trying.

4. RATING + REVIEWS
   Search: "[hotel name] Booking.com" (Europe/ME) OR "[hotel name] Google reviews" (Asia/Americas)
   Record: rating value, scale (5 or 10), platform name, review count

🟡 SECONDARY — one search each, skip if budget is tight:

5. ADR: "[hotel name] Booking.com" → standard room price. Round to nearest $10.
6. RESTAURANTS: check hotel website /dining. Count distinct restaurant/bar venues.
7. ${providerInstruction}

OUTPUT JSON SCHEMA:
{
  "gm_name": null,
  "gm_first_name": null,
  "gm_title": "General Manager",
  "email": null,
  "email_source": null,
  "contact_confidence": "L",
  "rooms": null,
  "rooms_source": null,
  "restaurants": null,
  "adr_usd": null,
  "adr_source": null,
  "rating": null,
  "rating_scale": null,
  "rating_platform": null,
  "review_count": null,
  "linkedin": null,
  "current_provider": null,
  "provider_source": null,
  "research_notes": "mandatory — see format below"
}

research_notes FORMAT (every field must have a source citation):
• GM: [name] ([source URL or publication], [month year]) — [CURRENT ✓ / ⚠ possibly outdated / ⚠ GM has likely changed]
• Email: [email] ([source]) OR "Not found — general contact: [email]"
• Rooms: [N] ([source URL])
• Rating: [X]/[scale] ([N] reviews, [platform])
• ADR: ~$[X] ([platform], [date checked]) OR "Not checked"
• Restaurants: [N] ([source]) OR "Not checked"
• Provider: [name] ([source URL]) OR "Inferred from brand map" OR "Unknown"
• LinkedIn: [URL] OR "Not found"

CRITICAL: null = not found after searching. NEVER fabricate. Start with { immediately.`;
}

// ── DEEP RESEARCH (single hotel, pass 2): generate outreach copy ────────────
const EMAIL_SYSTEM = `You are an SDR copywriter for Where to know Insights GmbH, a Berlin-based AI guest feedback intelligence platform for luxury hotels.

You will receive a JSON research brief about one hotel. Using ONLY the facts in that brief, write:

1. outreach_email_subject — one subject line, max 60 characters
2. outreach_email_body — the first cold outreach email (80-120 words)
3. followup_email_body — a day-7 follow-up email (max 80 words)

EMAIL STRUCTURE (outreach_email_body):
  Hello [gm_first_name],

  [1-2 sentences: specific operational pattern from guest reviews on [PLATFORM] over [TIMEFRAME]. Use "pattern visibility" language — e.g. "recurring friction point", "handover consistency gap", "peak-hour capacity signal", "recognition protocol drift". NEVER say "guests complained" or "negative reviews show".]

  [1 sentence: why this pattern is structurally invisible — it lives in free-text, not in scores or dashboards.]

  [If provider is known: "We know your team works with [Provider] — Where to know sits alongside it as an external intelligence layer, surfacing what [Provider] doesn't structure." — adjust naturally.]

  [1 sentence: concrete operational outcome — e.g. "a 15-minute walkthrough could show how this surfaces for [hotel_name] specifically."]

  Available for a brief call this week or next?

  Best regards,
  Zishuo Wang
  Where to know Insights

FOLLOW-UP STRUCTURE (followup_email_body, day 7):
  Hello [gm_first_name],

  [1-2 sentences: brief, different angle — e.g. reference a second theme, or a competitive visibility point.]

  [1 sentence: low-pressure CTA.]

  Best regards,
  Zishuo Wang

TONE RULES (★ HARD):
- "Pattern visibility" framing, NEVER "you failed" framing
- Approved vocabulary: "recurring friction point", "handover consistency gap", "peak-hour capacity signal", "recognition protocol drift", "service visibility gap"
- FORBIDDEN: "guests complained", "your team failed", "you didn't deliver", "negative reviews show", "issues", "problems"
- Confident, concise, no filler. No "I hope this email finds you well."
- Do NOT repeat the value proposition — say it once, clearly.

Output ONLY a JSON object:
{"outreach_email_subject":"","outreach_email_body":"","followup_email_body":""}

Start with { immediately.`;


// ─── API HANDLER ────────────────────────────────────────────────────────────

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const { city, brand, segment, count, mode, hotel_name, hotel_data, exclude } = req.body;

    // ═════════════════════════════════════════════════════════════════════
    // DEEP MODE — thorough single-hotel research
    // Two passes: (1) Research with web search → (2) Email copy without search
    // ═════════════════════════════════════════════════════════════════════
    if (mode === 'deep' && hotel_name) {

      // Check if provider is already known from brand map
      const knownProvider = inferProvider(brand || '', hotel_name);

      // ── PASS 1: Research (Sonnet + 12 web searches) ─────────────────
      const researchResponse = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': process.env.ANTHROPIC_API_KEY,
          'anthropic-version': '2023-06-01',
          'anthropic-beta': 'web-search-2025-03-05'
        },
        body: JSON.stringify({
          model: 'claude-sonnet-4-5-20250514',
          max_tokens: 4000,
          system: buildDeepResearchSystem(knownProvider),
          tools: [{ type: 'web_search_20250305', name: 'web_search', max_uses: 12 }],
          messages: [{ role: 'user', content: `Research this hotel thoroughly: ${hotel_name}` }]
        })
      });

      const researchData = await researchResponse.json();
      if (!researchResponse.ok) {
        return res.status(500).json({ error: researchData.error?.message || 'Research API error' });
      }

      const rawResearch = extractJSON(researchData.content, false);
      if (!rawResearch) {
        return res.status(200).json({
          result: '{}',
          debug: 'No JSON found in research response. Blocks: ' + (researchData.content || []).length
        });
      }

      let research;
      try {
        research = JSON.parse(rawResearch);
      } catch (e) {
        return res.status(200).json({ result: rawResearch, debug: 'Research JSON parse error: ' + e.message });
      }

      // Enrich provider from brand map if model didn't find one
      if (!research.current_provider && knownProvider) {
        research.current_provider = knownProvider;
        const src = getProviderSource(knownProvider);
        research.provider_source = src ? src.url : 'inferred from brand map';
      }

      // ── PASS 2: Email copy (Haiku, no web search — uses research as input) ──
      const emailResponse = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': process.env.ANTHROPIC_API_KEY,
          'anthropic-version': '2023-06-01',
        },
        body: JSON.stringify({
          model: 'claude-haiku-4-5-20251001',
          max_tokens: 1500,
          system: EMAIL_SYSTEM,
          messages: [{
            role: 'user',
            content: `Generate outreach emails for this hotel based on the research:\n\nHotel: ${hotel_name}\n\nResearch:\n${JSON.stringify(research, null, 2)}`
          }]
        })
      });

      const emailData = await emailResponse.json();
      let emailCopy = {};

      if (emailResponse.ok) {
        const rawEmail = extractJSON(emailData.content, false);
        if (rawEmail) {
          try { emailCopy = JSON.parse(rawEmail); } catch {}
        }
      }

      // Merge research + email copy into final result
      const result = {
        ...research,
        outreach_email_subject: emailCopy.outreach_email_subject || null,
        outreach_email_body: emailCopy.outreach_email_body || null,
        followup_email_body: emailCopy.followup_email_body || null,
      };

      return res.status(200).json({ result: JSON.stringify(result) });
    }

    // ═════════════════════════════════════════════════════════════════════
    // EMAIL-ONLY MODE — regenerate email copy from existing research data
    // Used when user wants to re-draft email without re-running research
    // ═════════════════════════════════════════════════════════════════════
    if (mode === 'email' && hotel_name && hotel_data) {
      const emailResponse = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': process.env.ANTHROPIC_API_KEY,
          'anthropic-version': '2023-06-01',
        },
        body: JSON.stringify({
          model: 'claude-haiku-4-5-20251001',
          max_tokens: 1500,
          system: EMAIL_SYSTEM,
          messages: [{
            role: 'user',
            content: `Generate outreach emails for this hotel based on the research:\n\nHotel: ${hotel_name}\n\nResearch:\n${JSON.stringify(hotel_data, null, 2)}`
          }]
        })
      });

      const emailData = await emailResponse.json();
      if (!emailResponse.ok) {
        return res.status(500).json({ error: emailData.error?.message || 'Email API error' });
      }

      const rawEmail = extractJSON(emailData.content, false);
      if (!rawEmail) {
        return res.status(200).json({ result: '{}', debug: 'No JSON in email response' });
      }

      return res.status(200).json({ result: rawEmail });
    }

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

      return {
        ...p,
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
