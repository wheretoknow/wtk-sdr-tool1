// ═══════════════════════════════════════════════════════════════════════════════
// Where to know Insights GmbH — SDR Research API Handler v8.0 (Anthropic Only)
// ═══════════════════════════════════════════════════════════════════════════════
// SINGLE-PROVIDER ARCHITECTURE (Claude Haiku for everything):
//   Step 1 "list"   — Haiku, NO web search. Training data only. (~$0.001)
//   Step 2 "verify" — Haiku + web search. Rooms + GM verification. (~$0.02-0.05)
//
// Why single provider: One API key, one rate limit, simpler debugging.
// Claude Haiku's built-in web search is the most reliable for hotel verification.
// Auth: ANTHROPIC_API_KEY only
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

// ─── CANONICAL BRAND/GROUP NORMALIZATION ─────────────────────────────────────

const CANONICAL_BRANDS = [
  "Kimpton","InterContinental","Holiday Inn","Holiday Inn Express","Hotel Indigo",
  "Crowne Plaza","voco","Six Senses","Regent","Vignette Collection","Staybridge","Candlewood","Even Hotels","Hualuxe","Avid",
  "Marriott","Ritz-Carlton","St. Regis","JW Marriott","W Hotels","Luxury Collection",
  "EDITION","Sheraton","Westin","Le Méridien","Renaissance","Autograph Collection",
  "Tribute Portfolio","Design Hotels","Moxy","AC Hotels","Courtyard","Four Points",
  "Delta Hotels","Aloft","Residence Inn","Fairfield","TownePlace","SpringHill","Element","Protea",
  "Hilton","Waldorf Astoria","Conrad","LXR","Curio","Canopy","DoubleTree","Tapestry",
  "Embassy Suites","Hampton","Homewood","Home2","Tru","Motto","Signia","Spark",
  "Hyatt","Park Hyatt","Grand Hyatt","Hyatt Regency","Andaz","Hyatt Centric","Alila","Thompson","Hyatt Place",
  "Accor","Fairmont","Raffles","Sofitel","Pullman","MGallery","Swissôtel","Mövenpick",
  "Novotel","Mercure","ibis","25hours","TRIBE","Banyan Tree",
  "Radisson Collection","Radisson Blu","Radisson RED","Radisson","Park Plaza","Park Inn","Prizeotel",
  "Anantara","Avani","Oaks","Tivoli","NH Collection","NH Hotels","nhow",
  "Kempinski","Barceló","Meliá","Innside","Sol","Pestana","Iberostar",
  "Peninsula","Capella","Patina","Mandarin Oriental","Rosewood","Langham","Dorchester Collection",
  "Shangri-La","Pan Pacific","PARKROYAL","Jumeirah","Four Seasons","Aman",
  "Wyndham","La Quinta","Ramada","TRYP",
  "Relais & Châteaux","Leading Hotels of the World","Small Luxury Hotels","Preferred Hotels",
];

const CANONICAL_GROUPS = [
  "IHG","Marriott","Hilton","Hyatt","Accor","Radisson","Minor Hotels",
  "Wyndham","Kempinski","Barceló","Meliá","Pestana","Iberostar",
  "Mandarin Oriental","Rosewood","Langham","Dorchester Collection",
  "Shangri-La","Pan Pacific","Jumeirah","Four Seasons","Aman",
  "Relais & Châteaux","Leading Hotels of the World","Independent",
];

const BRAND_ALIASES = {
  "kimpton hotels":"Kimpton","kimpton hotels and restaurants":"Kimpton","kimpton hotel":"Kimpton",
  "intercontinental hotels and resorts":"InterContinental","intercontinental hotels":"InterContinental",
  "holiday inn hotels":"Holiday Inn","holiday inn resorts":"Holiday Inn",
  "crowne plaza hotels":"Crowne Plaza","crowne plaza hotels and resorts":"Crowne Plaza",
  "hotel indigo hotels":"Hotel Indigo",
  "the luxury collection":"Luxury Collection","luxury collection marriott international":"Luxury Collection","luxury collection marriott":"Luxury Collection",
  "the ritz carlton":"Ritz-Carlton","ritz carlton":"Ritz-Carlton",
  "st regis":"St. Regis","the st regis":"St. Regis",
  "jw marriott hotels":"JW Marriott","jw marriott hotels and resorts":"JW Marriott",
  "w hotel":"W Hotels","w hotels and resorts":"W Hotels",
  "autograph collection hotels":"Autograph Collection",
  "tribute portfolio hotels":"Tribute Portfolio",
  "waldorf astoria hotels":"Waldorf Astoria","waldorf astoria hotels and resorts":"Waldorf Astoria",
  "conrad hotels":"Conrad","conrad hotels and resorts":"Conrad",
  "doubletree by hilton":"DoubleTree","double tree":"DoubleTree",
  "embassy suites by hilton":"Embassy Suites",
  "hampton by hilton":"Hampton","hampton inn":"Hampton",
  "homewood suites":"Homewood","homewood suites by hilton":"Homewood",
  "tru by hilton":"Tru",
  "park hyatt hotels":"Park Hyatt",
  "grand hyatt hotels":"Grand Hyatt",
  "hyatt regency hotels":"Hyatt Regency",
  "andaz hotels":"Andaz",
  "fairmont hotels":"Fairmont","fairmont hotels and resorts":"Fairmont",
  "raffles hotels":"Raffles","raffles hotels and resorts":"Raffles",
  "sofitel hotels":"Sofitel","sofitel hotels and resorts":"Sofitel",
  "pullman hotels":"Pullman","pullman hotels and resorts":"Pullman",
  "mgallery hotel collection":"MGallery","mgallery":"MGallery",
  "swissotel":"Swissôtel","swissotel hotels":"Swissôtel",
  "movenpick":"Mövenpick","movenpick hotels":"Mövenpick","moevenpick":"Mövenpick",
  "radisson blu hotels":"Radisson Blu",
  "anantara hotels":"Anantara","anantara hotels and resorts":"Anantara",
  "mandarin oriental hotel group":"Mandarin Oriental",
  "shangri la":"Shangri-La","shangri la hotels":"Shangri-La","shangri la hotels and resorts":"Shangri-La",
  "four seasons hotels":"Four Seasons","four seasons hotels and resorts":"Four Seasons",
  "aman resorts":"Aman",
  "sacher hotels":"Sacher","sacher":"Sacher",
  "corinthia hotels":"Corinthia","corinthia":"Corinthia",
  "ax hotels":"AX Hotels","ax":"AX Hotels",
};

const GROUP_ALIASES = {
  "intercontinental hotels group":"IHG","ihg hotels and resorts":"IHG","ihg hotels":"IHG",
  "marriott international":"Marriott","marriott international inc":"Marriott",
  "hilton worldwide":"Hilton","hilton hotels":"Hilton","hilton hotels corporation":"Hilton",
  "hyatt hotels":"Hyatt","hyatt hotels corporation":"Hyatt",
  "accor hotels":"Accor","accor sa":"Accor","accor group":"Accor",
  "radisson hotel group":"Radisson","radisson hospitality":"Radisson",
  "minor international":"Minor Hotels","minor hotel group":"Minor Hotels",
  "wyndham hotels and resorts":"Wyndham","wyndham hotel group":"Wyndham","wyndham worldwide":"Wyndham",
  "kempinski hotels":"Kempinski",
  "melia hotels international":"Meliá","melia hotels":"Meliá",
  "barcelo hotel group":"Barceló","barcelo hotels":"Barceló",
  "mandarin oriental hotel group":"Mandarin Oriental",
  "shangri la hotels and resorts":"Shangri-La","shangri la group":"Shangri-La",
  "four seasons hotels and resorts":"Four Seasons",
  "jumeirah group":"Jumeirah","jumeirah international":"Jumeirah",
  "independent":"Independent","independ":"Independent",
  "jdv":"JdV by Hyatt","jdv by hyatt":"JdV by Hyatt",
};

function cleanLabel(s) {
  return (s || "")
    .toLowerCase()
    .replace(/\([^)]*\)/g, " ")
    .replace(/&/g, " and ")
    .replace(/\b(international|intl|hotels|hotel|group|worldwide|company|co|inc|ltd|plc|resorts|resort|the)\b/g, " ")
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function toCanonicalBrand(input) {
  if (!input) return null;
  const key = cleanLabel(input);
  if (!key) return null;
  if (BRAND_ALIASES[key]) return BRAND_ALIASES[key];
  for (const b of CANONICAL_BRANDS) { if (cleanLabel(b) === key) return b; }
  // Partial match: if canonical is contained in key
  for (const b of CANONICAL_BRANDS) {
    const cb = cleanLabel(b);
    if (cb.length > 3 && key.includes(cb)) return b;
  }
  return null;
}

function toCanonicalGroup(input) {
  if (!input) return null;
  const key = cleanLabel(input);
  if (!key) return null;
  if (GROUP_ALIASES[key]) return GROUP_ALIASES[key];
  for (const g of CANONICAL_GROUPS) { if (cleanLabel(g) === key) return g; }
  for (const g of CANONICAL_GROUPS) {
    const cg = cleanLabel(g);
    if (cg.length > 3 && key.includes(cg)) return g;
  }
  return null;
}

// ─── BRAND/GROUP OVERRIDE SAFETY ────────────────────────────────────────────

function normalizeName(s) {
  return (s || "")
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, " ")
    .replace(/\b(hotel|resort|spa|the|a|an|at|by|and|of|in)\b/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function jaccardSimilarity(a, b) {
  const A = new Set(normalizeName(a).split(" ").filter(Boolean));
  const B = new Set(normalizeName(b).split(" ").filter(Boolean));
  if (A.size === 0 || B.size === 0) return 0;
  let inter = 0;
  for (const t of A) if (B.has(t)) inter++;
  const union = A.size + B.size - inter;
  return union === 0 ? 0 : inter / union;
}

function shouldOverrideBrand(inputName, verifiedName, inputCity, verifiedCity) {
  const jac = jaccardSimilarity(inputName, verifiedName);
  const cityMatch = !inputCity || !verifiedCity
    ? true
    : normalizeName(inputCity) === normalizeName(verifiedCity);
  return cityMatch ? jac >= 0.6 : jac >= 0.75;
}

// ─── FUZZY DEDUP (within verify batch) ───────────────────────────────────────

function pickBetter(a, b) {
  const score = (x) => {
    let s = 0;
    if (x.website) s += 2;
    if (Number.isFinite(x.rooms)) s += 2;
    if (x.rooms_source) s += 1;
    if (x.gm_name) s += 2;
    if (x.gm_source) s += 1;
    if (x.address) s += 1;
    if ((x.hotel_name || "").length > 25) s += 1;
    return s;
  };
  return score(b) > score(a) ? b : a;
}

function dedupeHotelsFuzzy(list) {
  const out = [];
  for (const h of (list || [])) {
    let merged = false;
    for (let i = 0; i < out.length; i++) {
      const e = out[i];
      const nameSim = jaccardSimilarity(h.hotel_name, e.hotel_name);
      const cityKnown = !!h.city && !!e.city;
      const sameCity = cityKnown ? normalizeName(h.city) === normalizeName(e.city) : false;
      const isSame = (sameCity && nameSim >= 0.65) || (!sameCity && nameSim >= 0.80);
      if (isSame) {
        out[i] = pickBetter(e, h);
        merged = true;
        break;
      }
    }
    if (!merged) out.push(h);
  }
  return out;
}

// ─── JSON EXTRACTION (handles Anthropic content blocks) ─────────────────────

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

// ─── RETRY HELPER ───────────────────────────────────────────────────────────

async function fetchWithRetry(url, opts, retries = 2, delay = 5000) {
  for (let i = 0; i <= retries; i++) {
    const r = await fetch(url, opts);
    if (r.status === 529 && i < retries) {
      console.log(`API overloaded (529), retry ${i+1}/${retries} in ${delay/1000}s...`);
      await new Promise(ok => setTimeout(ok, delay));
      continue;
    }
    return r;
  }
}

// ─── SYSTEM PROMPTS ─────────────────────────────────────────────────────────

const YEAR = new Date().getFullYear();
const PREV = YEAR - 1;

const LIST_SYSTEM = `You are a hotel database. Output ONLY a JSON array. No explanation. Start with [ immediately.

List hotels that match the query. For each hotel output:
{"hotel_name":"Full Hotel Name","city":"City","country":"Country","brand":"Brand Name","hotel_group":"Parent Group"}

RULES:
- Include ONLY hotels you are confident actually exist as of ${YEAR}.
- Do NOT invent or fabricate hotels. If unsure, omit.
- Use the property's Booking.com listing name if you know it.
- When a city is specified, only include hotels in that city or metro area.
- When no city is specified, include worldwide but cap at 40 results.
- Do NOT output name variants for the same property. If two names look like the same hotel, output ONLY ONE (prefer the official brand full name).
- Avoid generic short names (e.g. "Phoenix Hotel") unless it is the confirmed official listing name.
- brand must be from the standard canonical list (Kimpton, InterContinental, Sofitel, Novotel, etc.). If unknown, set brand=null.
- hotel_group must be from: IHG, Marriott, Hilton, Hyatt, Accor, Minor Hotels, Wyndham, Kempinski, Shangri-La, Four Seasons, Mandarin Oriental, Rosewood, Aman, Independent. If unknown, use "Independent".
- Start with [ immediately. End with ]. Nothing else.`;

const VERIFY_SYSTEM = `Hotel research API. Output ONLY a JSON array. Start with [ immediately.

For each hotel: search the web to verify rooms, address, website, and current GM.

SEARCH STRATEGY per hotel:
1. Search official hotel site → rooms count, address, website URL
2. Search "[Hotel Name] General Manager appointed ${PREV} OR ${YEAR}" → check hospitalitynet.org, hotelnewsresource.com, LinkedIn
3. If GM not found in step 2, try broader: "[Hotel Name] General Manager"

Return per hotel: hotel_name (use Booking.com name if different), brand, hotel_group, tier, city (from actual address), country, address, website, rooms, rooms_source (URL), gm_name, gm_first_name, gm_title, gm_source (URL), gm_source_year, contact_confidence (H/M/L), research_notes

STRICT RULES:
- rooms: ONLY from official site or Booking.com. rooms_source must be the exact URL where the room count is visibly displayed on the page. If the page does not explicitly show a room count, set rooms=null and rooms_source=null. Do not use press releases or blog posts as rooms_source.
- gm_name: ONLY if confirmed from a real source that explicitly states the GM name + title + this hotel name. LinkedIn profile pages are acceptable if they show this hotel. If not explicit, set gm_name=null.
- gm_source: Must be a real URL where the GM name and hotel appear together. If you cannot verify, set gm_name=null and gm_source=null.
- email: Always null. Do not guess emails.

WEBSITE RULES (strict):
- website must be a property-specific page that clearly belongs to this hotel (hotel name or property slug visible in URL or page).
- Do NOT use corporate homepages (marriott.com, ihg.com, hilton.com, accor.com, hyatt.com, radissonhotels.com, wyndhamhotels.com home/landing pages) as website.
- If only a corporate domain exists, the URL must contain a property-specific path (hotel slug, city name, property code). Example: marriott.com/en-us/hotels/abcde-hotel-name/ is OK. marriott.com/ alone is NOT OK. Otherwise set website=null.

CANONICAL LABEL RULES (strict):
- brand MUST be EXACTLY one of: Kimpton, InterContinental, Holiday Inn, Holiday Inn Express, Hotel Indigo, Crowne Plaza, voco, Six Senses, Regent, Vignette Collection, Staybridge, Marriott, Ritz-Carlton, St. Regis, JW Marriott, W Hotels, Luxury Collection, EDITION, Sheraton, Westin, Le Meridien, Renaissance, Autograph Collection, Tribute Portfolio, Design Hotels, Moxy, AC Hotels, Courtyard, Four Points, Delta Hotels, Aloft, Hilton, Waldorf Astoria, Conrad, LXR, Curio, Canopy, DoubleTree, Embassy Suites, Hampton, Tru, Hyatt, Park Hyatt, Grand Hyatt, Hyatt Regency, Andaz, Hyatt Centric, Alila, Thompson, Fairmont, Raffles, Sofitel, Pullman, MGallery, Swissotel, Movenpick, Novotel, Mercure, ibis, 25hours, Banyan Tree, Anantara, Avani, Tivoli, NH Collection, NH Hotels, Kempinski, Mandarin Oriental, Shangri-La, Four Seasons, Rosewood, Aman, Centara, Dusit, Radisson, Radisson Blu, Radisson Collection, Wyndham, Peninsula, Capella, Langham, Jumeirah, Meliá, Barceló. If uncertain or not in this list, set brand=null.
- hotel_group MUST be EXACTLY one of: IHG, Marriott, Hilton, Hyatt, Accor, Radisson, Minor Hotels, Wyndham, Kempinski, Mandarin Oriental, Shangri-La, Four Seasons, Rosewood, Aman, Centara, Dusit, Banyan Tree, Peninsula, Capella, Langham, Jumeirah, Dorchester Collection, Belmond, Oetker Collection, COMO, Meliá, Barceló, Independent. If uncertain or not in this list, set hotel_group="Independent". Do NOT invent new group names.

- research_notes: 2-3 sentences. State WHERE rooms and GM found, WHAT YEAR. No bullets.
- Prefer the most recent information. If multiple GM sources exist, prefer ${YEAR} over ${PREV}. Ignore sources older than ${PREV} unless nothing newer exists.
- Partial data OK. null is always better than guessing.
- Set rating and review_count to null.
- Start with [ immediately.`;


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
    // STEP 1: LIST — no web search, training data only (~$0.001)
    // ═════════════════════════════════════════════════════════════════════
    if (mode === 'list') {
      let listPrompt = "";

      if (scope === "chain" && (brand || group)) {
        if (brand && group) {
          listPrompt = `List ALL known ${brand} hotels (part of ${group} group) worldwide.`;
        } else if (brand) {
          listPrompt = `List ALL known ${brand} hotels worldwide.`;
        } else {
          listPrompt = `List ALL known hotels belonging to ${group} group worldwide. Include every brand.`;
        }
      } else if (scope === "independent") {
        const adr = parseInt(minAdr) || 150;
        const market = city || "worldwide";
        listPrompt = `List luxury independent hotels (NOT part of major chains) in ${market} with estimated ADR above $${adr}/night.`;
      } else {
        const market = city || "worldwide";
        listPrompt = `List all luxury and upscale hotels in ${market}.`;
      }

      if (city && scope === "chain") {
        listPrompt += `\nFilter to hotels in or near: ${city}.`;
      }

      const r = await fetchWithRetry('https://api.anthropic.com/v1/messages', {
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
      if (!r.ok) return res.status(r.status === 529 ? 503 : 500).json({
        error: r.status === 529 ? 'API overloaded — please wait 30s and retry' : (data.error?.message || 'List API error')
      });

      const jsonStr = extractJSON(data.content, true);
      if (!jsonStr) {
        return res.status(200).json({ result: '[]', debug: 'No JSON from list step' });
      }

      let arr;
      try { arr = JSON.parse(jsonStr); } catch { return res.status(200).json({ result: '[]', debug: 'List JSON parse failed' }); }

      // Canonicalize brand/group in list results too (prevents dirty data on import before verify)
      arr = (arr || []).map(h => ({
        ...h,
        brand: toCanonicalBrand(h.brand) || null,
        hotel_group: toCanonicalGroup(h.hotel_group) || "Independent",
      }));

      return res.status(200).json({ result: JSON.stringify(arr) });
    }

    // ═════════════════════════════════════════════════════════════════════
    // STEP 2: VERIFY — web search for rooms + GM (~$0.02-0.05/batch)
    // ═════════════════════════════════════════════════════════════════════
    if (mode === 'verify' && hotels && hotels.length > 0) {
      const batch = hotels.slice(0, 10);
      const maxUses = Math.min(25, batch.length * 2 + 5);
      const maxTokens = Math.min(10000, batch.length * 700 + 2000);

      const hotelList = batch.map((h, i) =>
        `${i+1}. "${h.hotel_name}" in ${h.city}, ${h.country} (brand: ${h.brand || "unknown"})`
      ).join('\n');

      const prompt = `Verify these ${batch.length} hotels and return JSON array:

${hotelList}

For each hotel do 2 web searches:
1. Official site for rooms and address
2. GM name from ${PREV}-${YEAR} industry sources

Return JSON array with all required fields. Use null for anything unverified. Start with [.`;

      const r = await fetchWithRetry('https://api.anthropic.com/v1/messages', {
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
      if (!r.ok) return res.status(r.status === 529 ? 503 : 500).json({
        error: r.status === 529 ? 'API overloaded — please wait 30s and retry' : (data.error?.message || 'Verify API error')
      });

      const jsonStr = extractJSON(data.content, true);
      if (!jsonStr) {
        const allText = (data.content || []).filter(b => b.type === 'text').map(b => b.text || '').join('\n');
        return res.status(200).json({ result: '[]', debug: allText.slice(0, 500) });
      }

      let arr;
      try { arr = JSON.parse(jsonStr); } catch { return res.status(200).json({ result: '[]', debug: 'Verify parse failed' }); }

      // Fuzzy dedup within batch
      arr = dedupeHotelsFuzzy(arr);

      // Build input lookup for similarity matching
      const inputLookup = {};
      for (const h of batch) {
        inputLookup[normalizeName(h.hotel_name)] = h;
      }

      const authBrand = brand || null;
      const authGroup = group || null;

      const enriched = (arr || []).map(p => {
        const effectiveBrand = authBrand || p.brand || "";
        const provider = inferProvider(effectiveBrand, p.hotel_name) || p.current_provider || null;
        const providerSrc = provider ? getProviderSource(provider) : null;

        // Find matching input hotel for similarity check
        let inputHotel = null;
        const pKey = normalizeName(p.hotel_name);
        for (const [k, v] of Object.entries(inputLookup)) {
          if (jaccardSimilarity(k, pKey) > 0.5) { inputHotel = v; break; }
        }

        // Only override brand/group if hotel name closely matches
        const canOverride = inputHotel
          ? shouldOverrideBrand(inputHotel.hotel_name, p.hotel_name, inputHotel.city, p.city)
          : false;

        const rawBrand = canOverride ? (authBrand || p.brand) : p.brand;
        const rawGroup = canOverride ? (authGroup || p.hotel_group) : p.hotel_group;
        const canonBrand = toCanonicalBrand(rawBrand) || rawBrand || null;
        const canonGroup = toCanonicalGroup(rawGroup) || "Independent";

        return {
          ...p,
          brand: canonBrand,
          hotel_group: canonGroup,
          email: null,
          last_verified_at: new Date().toISOString(),
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
