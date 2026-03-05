import { useState, useEffect, useRef, Component, Fragment } from "react";

const SUPABASE_URL = "https://rzksmbzlmzvodywfasht.supabase.co";
const SUPABASE_KEY = "sb_publishable_PT6OfaeYiOb_lM5sTP30Lw_XJsir-4E";

async function sbFetch(path, opts = {}) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1${path}`, {
    ...opts,
    headers: { "apikey": SUPABASE_KEY, "Authorization": `Bearer ${SUPABASE_KEY}`, "Content-Type": "application/json", "Prefer": opts.prefer || "return=representation", ...(opts.headers || {}) },
  });
  if (!res.ok) { const e = await res.text(); throw new Error(e); }
  const t = await res.text(); return t ? JSON.parse(t) : [];
}

// ── Geography data ────────────────────────────────────────────────────
const GEO = {
  "Europe": {
    "Austria": ["Vienna","Salzburg","Innsbruck","Graz","Linz"],
    "Belgium": ["Brussels","Bruges","Antwerp","Ghent","Liège"],
    "Croatia": ["Dubrovnik","Zagreb","Split","Hvar","Rovinj"],
    "Czech Republic": ["Prague","Brno","Karlovy Vary"],
    "Denmark": ["Copenhagen","Aarhus","Odense"],
    "Finland": ["Helsinki","Espoo","Tampere"],
    "France": ["Paris","Lyon","Nice","Cannes","Bordeaux","Marseille","Strasbourg","Biarritz","Courchevel","Monaco"],
    "Germany": ["Berlin","Munich","Hamburg","Frankfurt","Düsseldorf","Cologne","Stuttgart","Dresden","Heidelberg"],
    "Greece": ["Athens","Santorini","Mykonos","Thessaloniki","Rhodes","Crete","Corfu"],
    "Hungary": ["Budapest","Debrecen"],
    "Iceland": ["Reykjavik"],
    "Ireland": ["Dublin","Galway","Cork","Killarney"],
    "Italy": ["Rome","Milan","Florence","Venice","Naples","Amalfi","Lake Como","Tuscany","Capri","Positano","Portofino","Bologna","Turin"],
    "Luxembourg": ["Luxembourg City"],
    "Malta": ["Valletta","St. Julian's"],
    "Monaco": ["Monte Carlo"],
    "Montenegro": ["Budva","Kotor","Tivat"],
    "Netherlands": ["Amsterdam","Rotterdam","The Hague","Utrecht"],
    "Norway": ["Oslo","Bergen","Tromsø","Stavanger"],
    "Poland": ["Warsaw","Krakow","Gdansk","Wroclaw","Poznan"],
    "Portugal": ["Lisbon","Porto","Algarve","Madeira","Azores","Sintra"],
    "Romania": ["Bucharest","Cluj-Napoca","Brasov"],
    "Scotland": ["Edinburgh","Glasgow","Highlands"],
    "Serbia": ["Belgrade"],
    "Slovakia": ["Bratislava"],
    "Slovenia": ["Ljubljana","Bled"],
    "Spain": ["Madrid","Barcelona","Seville","Marbella","Ibiza","Mallorca","Bilbao","Valencia","San Sebastián","Granada","Malaga"],
    "Sweden": ["Stockholm","Gothenburg","Malmö","Kiruna"],
    "Switzerland": ["Zurich","Geneva","Basel","Zermatt","St. Moritz","Interlaken","Lucerne","Lausanne","Davos"],
    "Turkey": ["Istanbul","Antalya","Bodrum","Cappadocia","Izmir","Ankara"],
    "Ukraine": ["Kyiv","Lviv"],
    "United Kingdom": ["London","Edinburgh","Manchester","Bath","Oxford","Cambridge","Birmingham","Bristol","Liverpool","Brighton","Cotswolds"],
  },
  "Asia Pacific": {
    "China": ["Shanghai","Beijing","Shenzhen","Guangzhou","Chengdu","Hangzhou","Suzhou"],
    "Japan": ["Tokyo","Osaka","Kyoto","Yokohama","Nagoya"],
    "Thailand": ["Bangkok","Phuket","Chiang Mai","Pattaya","Koh Samui"],
    "Singapore": ["Singapore"],
    "Hong Kong": ["Hong Kong"],
    "South Korea": ["Seoul","Busan"],
    "Indonesia": ["Bali","Jakarta","Lombok"],
    "Vietnam": ["Ho Chi Minh City","Hanoi","Da Nang","Hoi An"],
    "Malaysia": ["Kuala Lumpur","Penang","Langkawi"],
    "Philippines": ["Manila","Cebu","Boracay"],
    "India": ["Mumbai","Delhi","Bangalore","Goa","Jaipur","Udaipur"],
    "Australia": ["Sydney","Melbourne","Brisbane","Perth","Gold Coast"],
    "New Zealand": ["Auckland","Queenstown","Wellington"],
    "Maldives": ["Malé","North Malé Atoll","South Malé Atoll"],
  },
  "Middle East": {
    "UAE": ["Dubai","Abu Dhabi","Sharjah"],
    "Saudi Arabia": ["Riyadh","Jeddah","NEOM"],
    "Qatar": ["Doha"],
    "Bahrain": ["Manama"],
    "Oman": ["Muscat","Salalah"],
    "Jordan": ["Amman","Aqaba","Petra"],
  },
  "Americas": {
    "United States": ["New York","Los Angeles","Miami","Chicago","Las Vegas","San Francisco","Boston","Washington DC","Honolulu"],
    "Canada": ["Toronto","Vancouver","Montreal","Calgary"],
    "Mexico": ["Mexico City","Cancun","Los Cabos","Tulum","Guadalajara"],
    "Brazil": ["São Paulo","Rio de Janeiro","Salvador","Florianópolis"],
    "Argentina": ["Buenos Aires","Bariloche"],
    "Colombia": ["Bogotá","Cartagena","Medellín"],
    "Peru": ["Lima","Cusco","Machu Picchu"],
    "Caribbean": ["Barbados","St. Barts","Turks and Caicos","Jamaica","Bahamas"],
  },
  "Africa": {
    "South Africa": ["Cape Town","Johannesburg","Durban","Kruger"],
    "Morocco": ["Marrakech","Casablanca","Fes","Tangier"],
    "Kenya": ["Nairobi","Mombasa","Masai Mara"],
    "Tanzania": ["Dar es Salaam","Zanzibar","Serengeti"],
    "Egypt": ["Cairo","Hurghada","Sharm El Sheikh","Luxor"],
    "Mauritius": ["Port Louis","Grand Baie"],
  },
};

const CLIENT_PROVIDER_MAP = {
  // Marriott → Qualtrics
  "ritz-carlton":"Qualtrics","st. regis":"Qualtrics","jw marriott":"Qualtrics","w hotels":"Qualtrics",
  "luxury collection":"Qualtrics","edition":"Qualtrics","sheraton":"Qualtrics","westin":"Qualtrics",
  "le méridien":"Qualtrics","le meridien":"Qualtrics","renaissance":"Qualtrics","autograph collection":"Qualtrics",
  "tribute portfolio":"Qualtrics","design hotels":"Qualtrics","marriott":"Qualtrics","delta hotels":"Qualtrics",
  "aloft":"Qualtrics","moxy":"Qualtrics","ac hotels":"Qualtrics","courtyard":"Qualtrics",
  // IHG → Medallia
  "intercontinental":"Medallia","kimpton":"Medallia","six senses":"Medallia","regent":"Medallia",
  "vignette collection":"Medallia","hotel indigo":"Medallia","crowne plaza":"Medallia","voco":"Medallia",
  "holiday inn":"Medallia","hualuxe":"Medallia","ihg":"Medallia",
  // Hyatt → Medallia
  "park hyatt":"Medallia","andaz":"Medallia","grand hyatt":"Medallia","hyatt regency":"Medallia",
  "hyatt centric":"Medallia","alila":"Medallia","thompson hotels":"Medallia","hyatt":"Medallia",
  // Wyndham → Medallia
  "wyndham":"Medallia","dolce by wyndham":"Medallia","ramada":"Medallia",
  // Radisson/NH/Minor → ReviewPro
  "radisson collection":"ReviewPro","radisson blu":"ReviewPro","radisson red":"ReviewPro",
  "radisson":"ReviewPro","park plaza":"ReviewPro","park inn":"ReviewPro","country inn":"ReviewPro",
  "anantara":"ReviewPro","nh collection":"ReviewPro","nh hotels":"ReviewPro","nhow":"ReviewPro",
  "tivoli":"ReviewPro","minor hotels":"ReviewPro","peninsula":"ReviewPro","capella":"ReviewPro",
  // Kempinski → ReviewPro (confirmed: Shiji ReviewPro partnership since 2016)
  "kempinski":"ReviewPro",
  // Accor brands → TrustYou
  "raffles":"TrustYou","fairmont":"TrustYou","sofitel":"TrustYou","mgallery":"TrustYou",
  "pullman":"TrustYou","swissôtel":"TrustYou","swissotel":"TrustYou","mövenpick":"TrustYou",
  "movenpick":"TrustYou","novotel":"TrustYou","mercure":"TrustYou","ibis":"TrustYou",
  "25hours":"TrustYou","banyan tree":"TrustYou","accor":"TrustYou",
  "rosewood":"TrustYou","new world hotels":"TrustYou","mandarin oriental":"TrustYou",
};

function inferProvider(brand, hotelName) {
  const s = ((brand||"") + " " + (hotelName||"")).toLowerCase();
  for (const [k, v] of Object.entries(CLIENT_PROVIDER_MAP)) {
    if (s.includes(k)) return v;
  }
  return null;
}

// Normalize messy provider strings from DB to canonical names
function normalizeProvider(raw) {
  if (!raw) return null;
  const s = raw.toLowerCase();
  if (s.includes("medallia")) return "Medallia";
  if (s.includes("qualtrics")) return "Qualtrics";
  if (s.includes("reviewpro") || s.includes("review pro")) return "ReviewPro";
  if (s.includes("trustyou") || s.includes("trust you")) return "TrustYou";
  if (s.includes("revinate")) return "Revinate";
  if (s.includes("guestfeedback") || s.includes("guest feedback")) return "Guestfeedback";
  if (s.includes("reputation.com") || s.includes("reputation com")) return "Reputation.com";
  if (s.includes("olery")) return "Olery";
  return raw.split(/[-–—·,]/)[0].trim(); // Take first part before any dash/description
}

// Get display provider: infer from brand map first, then normalize DB value
function getProvider(p) {
  return inferProvider(p.brand, p.hotel_name) || normalizeProvider(p.current_provider) || null;
}
function normalizeGroup(g) {
  if (!g) return null;
  const s = g.toLowerCase();
  if (s.includes('marriott')) return 'Marriott';
  if (s.includes('ihg') || s.includes('intercontinental hotels group') || s.includes('intercontinental hotel group')) return 'IHG';
  if (s.includes('hilton')) return 'Hilton';
  if (s.includes('hyatt')) return 'Hyatt';
  if (s.includes('accor') || s.includes('ennismore') || s.includes('mgallery')) return 'Accor';
  if (s.includes('radisson')) return 'Radisson';
  if (s.includes('rosewood')) return 'Rosewood';
  if (s.includes('wyndham')) return 'Wyndham';
  if (s.includes('shangri')) return 'Shangri-La';
  if (s.includes('peninsula')) return 'Peninsula';
  if (s.includes('mandarin oriental')) return 'Mandarin Oriental';
  if (s.includes('four seasons')) return 'Four Seasons';
  if (s.includes('banyan tree')) return 'Banyan Tree';
  if (s.includes('minor')) return 'Minor';
  if (s.includes('onyx')) return 'Onyx';
  if (s.includes('kempinski')) return 'Kempinski';
  if (s.includes('lore group')) return 'Lore Group';
  if (s.includes('dorchester')) return 'Dorchester';
  if (s.includes('langham')) return 'Langham';
  if (s.includes('aman')) return 'Aman';
  if (s.includes('como')) return 'COMO';
  if (s.includes('belmond')) return 'Belmond';
  if (s.includes('oetker')) return 'Oetker';
  if (s.includes('jumeirah')) return 'Jumeirah';
  if (s.includes('melia') || s.includes('meliá')) return 'Meliá';
  if (s.includes('barcelo') || s.includes('barceló')) return 'Barceló';
  if (s.includes('pestana')) return 'Pestana';
  if (s.includes('iberostar')) return 'Iberostar';
  return g.replace(/\s*\b(Hotels?( & Resorts?)?|International|Worldwide|Ltd\.?|Inc\.?|plc|GmbH)\b\s*/gi, ' ').replace(/\s*\bS\.A\.?\b\s*/g, ' ').replace(/\s*\bGroup\b\s*/gi, ' ').trim() || g;
}

const BRAND_KEYWORDS = ["Fairmont","InterContinental","Kimpton","Holiday Inn Express","Holiday Inn","Crowne Plaza","Hotel Indigo","Vignette","Six Senses","Regent","Waldorf Astoria","Conrad","Canopy","Curio","DoubleTree","Embassy Suites","Hampton","Hilton Garden Inn","Hilton","Hyatt Regency","Grand Hyatt","Park Hyatt","Andaz","Thompson","Hyatt Centric","Hyatt Place","Alila","JW Marriott","W Hotels","Westin","Sheraton","St. Regis","Ritz-Carlton","Marriott","Courtyard","Residence Inn","Le Méridien","Le Meridien","Sofitel","Raffles","MGallery","Pullman","Novotel","Mercure","Swissôtel","Mövenpick","ibis Styles","ibis","Mandarin Oriental","Four Seasons","Kempinski","Shangri-La","Anantara","Avani","NH Collection","NH Hotels","Radisson Blu","Radisson","Park Plaza","Melia","Gran Melia","Innside","Rosewood","Aman","Peninsula","Langham","Belmond","Banyan Tree","Como","Oetker Collection"];
function inferBrandFromName(name) {
  if (!name) return null;
  const n = name.toLowerCase();
  for (const b of BRAND_KEYWORDS) { if (n.includes(b.toLowerCase())) return b; }
  return null;
}
function normalizeBrand(b) {
  if (!b) return null;
  const s = b.toLowerCase().replace(/\(.*?\)/g, '').trim();
  const BRAND_CANON = {
    "kimpton hotels":"Kimpton","kimpton hotels and restaurants":"Kimpton","kimpton hotels & restaurants":"Kimpton",
    "intercontinental hotels & resorts":"InterContinental","intercontinental hotels":"InterContinental","intercontinental hotels and resorts":"InterContinental",
    "the luxury collection":"Luxury Collection","luxury collection":"Luxury Collection",
    "holiday inn hotels":"Holiday Inn","holiday inn hotels & resorts":"Holiday Inn",
    "holiday inn express hotels":"Holiday Inn Express",
    "crowne plaza hotels":"Crowne Plaza","crowne plaza hotels & resorts":"Crowne Plaza",
    "hotel indigo hotels":"Hotel Indigo",
    "waldorf astoria hotels":"Waldorf Astoria","waldorf astoria hotels & resorts":"Waldorf Astoria",
    "conrad hotels":"Conrad","conrad hotels & resorts":"Conrad",
    "doubletree by hilton":"DoubleTree","double tree":"DoubleTree",
    "embassy suites by hilton":"Embassy Suites",
    "hampton by hilton":"Hampton","hampton inn":"Hampton","hampton inn & suites":"Hampton",
    "homewood suites":"Homewood","homewood suites by hilton":"Homewood",
    "tru by hilton":"Tru",
    "park hyatt hotels":"Park Hyatt",
    "grand hyatt hotels":"Grand Hyatt",
    "hyatt regency hotels":"Hyatt Regency",
    "fairmont hotels":"Fairmont","fairmont hotels & resorts":"Fairmont",
    "raffles hotels":"Raffles","raffles hotels & resorts":"Raffles",
    "sofitel hotels":"Sofitel","sofitel hotels & resorts":"Sofitel",
    "pullman hotels":"Pullman","pullman hotels & resorts":"Pullman",
    "mgallery hotel collection":"MGallery","mgallery":"MGallery",
    "swissotel":"Swissôtel","swissotel hotels":"Swissôtel",
    "movenpick":"Mövenpick","movenpick hotels":"Mövenpick","mövenpick hotels":"Mövenpick",
    "mandarin oriental hotel group":"Mandarin Oriental",
    "shangri-la hotels":"Shangri-La","shangri-la hotels & resorts":"Shangri-La","shangri la":"Shangri-La",
    "four seasons hotels":"Four Seasons","four seasons hotels and resorts":"Four Seasons",
    "aman resorts":"Aman",
    "design hotels":"Design Hotels",
    "sacher hotels":"Sacher","sacher":"Sacher",
    "corinthia hotels":"Corinthia","corinthia":"Corinthia",
    "ax hotels":"AX Hotels",
    "independ":"Independent","independent":"Independent",
    "jdv":"JdV by Hyatt","jdv by hyatt":"JdV by Hyatt",
  };
  const key = s.toLowerCase().replace(/&/g, 'and').replace(/[^a-z0-9\s]/g, ' ').replace(/\s+/g, ' ').trim();
  if (BRAND_CANON[key]) return BRAND_CANON[key];
  // Strip common suffixes
  return b.replace(/\(.*?\)/g, '').replace(/\s*(Hotels?( & Resorts?)?|International|Worldwide)\s*$/gi, '').trim() || b;
}
const CHAIN_BRANDS = {
  "Marriott": ["Ritz-Carlton","Ritz-Carlton Reserve","St. Regis","W Hotels","JW Marriott","Luxury Collection","EDITION","Autograph Collection","Tribute Portfolio","Design Hotels","Marriott Hotels","Sheraton","Delta Hotels","Le Méridien","Westin","Renaissance","Gaylord Hotels","Courtyard","Four Points","SpringHill Suites","AC Hotels","Moxy","Protea Hotels","Fairfield","Residence Inn","TownePlace Suites","Element","Aloft","City Express"],
  "IHG": ["Six Senses","Regent","InterContinental","Vignette Collection","Kimpton","Hotel Indigo","voco","Hualuxe","Crowne Plaza","Even Hotels","Holiday Inn","Holiday Inn Express","Staybridge Suites","Candlewood Suites","Garner","Avid Hotels","Atwell Suites"],
  "Hilton": ["Waldorf Astoria","Conrad","LXR","NoMad","Signia","Hilton Hotels & Resorts","Curio Collection","Canopy","Tempo","Motto","DoubleTree","Embassy Suites","Hilton Garden Inn","Hampton","Tru","Homewood Suites","Home2 Suites","Tapestry Collection","Spark"],
  "Hyatt": ["Park Hyatt","Miraval","Grand Hyatt","Alila","Andaz","Unbound Collection","Destination by Hyatt","Hyatt Regency","Hyatt","Hyatt Centric","Caption by Hyatt","JdV","Thompson","Dream Hotels","Hyatt Place","Hyatt House","Hyatt Studios"],
  "Accor": ["Raffles","Orient Express","Fairmont","Sofitel Legend","Sofitel","MGallery","Emblems","Pullman","Swissôtel","Mövenpick","Grand Mercure","Novotel","Mercure","TRIBE","Mama Shelter","25hours","JO&JOE","ibis","ibis Styles","Adagio","Mantra","Peppers"],
  "Four Seasons": ["Four Seasons"],
  "Mandarin Oriental": ["Mandarin Oriental"],
  "Shangri-La": ["Shangri-La","Kerry Hotels","JEN","Traders"],
  "Rosewood": ["Rosewood","New World Hotels"],
  "Kempinski": ["Kempinski"],
  "Aman": ["Aman"],
  "Belmond": ["Belmond"],
  "Banyan Tree": ["Banyan Tree","Angsana","Cassia","Dhawa"],
  "COMO": ["COMO"],
  "Oetker Collection": ["Oetker Collection"],
  "Dorchester Collection": ["Dorchester Collection"],
  "Auberge Resorts": ["Auberge Resorts"],
  "Capella": ["Capella","Patina"],
  "One&Only": ["One&Only"],
  "Soneva": ["Soneva"],
  "Langham": ["Langham","Cordis","Eaton"],
  "Pan Pacific": ["Pan Pacific","Parkroyal"],
  "Minor Hotels": ["Anantara","Avani","NH Hotels","NH Collection","Tivoli","Oaks","Elewana"],
  "Radisson": ["Radisson","Radisson Collection","Radisson Blu","Radisson Red","Park Plaza","Park Inn","Country Inn & Suites","Prizeotel","art'otel"],
  "Wyndham": ["Wyndham","Registry Collection","Wyndham Grand","Dolce by Wyndham","Ramada","La Quinta","Baymont","Days Inn","Super 8","Microtel","Howard Johnson","Trademark Collection"],
  "Choice Hotels": ["Ascend Collection","Cambria","Radisson Americas","Comfort","Quality","Clarion","Sleep Inn","MainStay Suites","WoodSpring Suites"],
  "BWH": ["WorldHotels","Best Western","Best Western Plus","Best Western Premier","SureStay"],
  "Meliá": ["Gran Meliá","ME by Meliá","Paradisus","INNSiDE","Zel","Meliá Hotels"],
  "Barceló": ["Barceló","Royal Hideaway","Occidental","Allegro"],
  "Jumeirah": ["Jumeirah"],
  "Peninsula": ["Peninsula"],
  "IHCL (Tata)": ["Taj","SeleQtions","Vivanta","Ginger"],
  "Hoshino Resorts": ["Hoshinoya","Risonare","OMO","BEB"],
  "Okura Nikko": ["The Okura","Nikko Hotels","Hotel JAL City"],
  "Centara": ["Centara","Centara Grand","Centara Reserve","Centara Boutique","COSI"],
  "Dusit": ["Dusit Thani","Dusit Devarana","Dusit Princess","ASAI"],
  "Onyx Hospitality": ["Amari","OZO","Shama"],
  "Lotte Hotels": ["Lotte Hotels"],
  "Scandic": ["Scandic"],
  "Riu": ["Riu"],
  "CitizenM": ["CitizenM"],
  "Virgin Hotels": ["Virgin Hotels"],
  "Ennismore": ["Hoxton","Gleneagles","Mama Shelter","25hours","Delano","Mondrian","SLS"],
  "Jin Jiang": ["Jin Jiang Hotels","Campanile","Kyriad","Louvre Hotels"],
  "Huazhu": ["Steigenberger","IntercityHotel","Jaz in the City","MAXX"],
  "Bulgari Hotels": ["Bulgari Hotels"],
  "Rocco Forte": ["Rocco Forte"],
  "Red Carnation": ["Red Carnation"],
  "Preferred Hotels": ["Preferred Hotels"],
  "Leading Hotels": ["Leading Hotels of the World"],
  "Small Luxury Hotels": ["Small Luxury Hotels"],
  "Relais & Châteaux": ["Relais & Châteaux"],
};

// ─── DUPLICATE FINDER UTILITIES ─────────────────────────────────────────────

const CORPORATE_DOMAINS = new Set([
  "marriott.com","hilton.com","hyatt.com","ihg.com","accor.com","all.accor.com",
  "radissonhotels.com","wyndhamhotels.com","fourseasons.com","mandarinoriental.com",
  "rosewoodhotels.com","aman.com","kempinski.com","shangri-la.com","jumeirah.com",
  "peninsula.com","langhamhotels.com","dorchestercollection.com","belmond.com",
  "minorhotels.com","anantara.com","centarahotelsresorts.com","dusit.com",
  "bfrands.com","booking.com","expedia.com","tripadvisor.com","hotels.com",
]);

function canonicalizeUrl(url) {
  if (!url) return null;
  try {
    const u = new URL(url.startsWith("http") ? url : "https://" + url);
    return (u.hostname.replace(/^www\./, "") + u.pathname.replace(/\/+$/, "")).toLowerCase();
  } catch { return null; }
}

function getUrlDomain(url) {
  if (!url) return null;
  try {
    const u = new URL(url.startsWith("http") ? url : "https://" + url);
    const h = u.hostname.replace(/^www\./, "").toLowerCase();
    // Extract registrable domain (last two parts)
    const parts = h.split(".");
    return parts.length >= 2 ? parts.slice(-2).join(".") : h;
  } catch { return null; }
}

function isHotelLevelUrl(url) {
  if (!url) return false;
  const domain = getUrlDomain(url);
  if (!domain) return false;
  if (!CORPORATE_DOMAINS.has(domain)) return true; // independent domain = hotel level
  // Corporate domain: check if path is specific enough
  try {
    const u = new URL(url.startsWith("http") ? url : "https://" + url);
    const path = u.pathname.replace(/\/+$/, "");
    // Needs at least 2 path segments to be property-specific
    const segments = path.split("/").filter(Boolean);
    return segments.length >= 2;
  } catch { return false; }
}

function normalizeAddr(addr) {
  if (!addr) return "";
  return addr.toLowerCase()
    .replace(/\bstreet\b/g, "st").replace(/\broad\b/g, "rd").replace(/\bavenue\b/g, "ave")
    .replace(/\bboulevard\b/g, "blvd").replace(/\bdrive\b/g, "dr").replace(/\blane\b/g, "ln")
    .replace(/[^a-z0-9\s]/g, " ").replace(/\s+/g, " ").trim();
}

function dedupNormName(s) {
  return (s || "").toLowerCase()
    .replace(/&/g, " and ").replace(/[^a-z0-9]+/g, " ")
    .replace(/\b(hotel|resort|spa|the|a|an|at|by|and|of|in|suites?)\b/g, " ")
    .replace(/\s+/g, " ").trim();
}

function dedupJaccard(a, b) {
  const A = new Set(dedupNormName(a).split(" ").filter(Boolean));
  const B = new Set(dedupNormName(b).split(" ").filter(Boolean));
  if (A.size === 0 || B.size === 0) return 0;
  let inter = 0;
  for (const t of A) if (B.has(t)) inter++;
  return inter / (A.size + B.size - inter);
}

function findDuplicates(prospects) {
  const groups = [];
  const assigned = new Set();

  // Index by city for blocking
  const byCity = {};
  for (const p of prospects) {
    const city = (p.city || "unknown").toLowerCase().trim();
    if (!byCity[city]) byCity[city] = [];
    byCity[city].push(p);
  }

  // Pass 0: Identical — exact normalized name + same city (safe to auto-merge)
  for (const [city, cityPs] of Object.entries(byCity)) {
    const byName = {};
    for (const p of cityPs) {
      if (assigned.has(p.id)) continue;
      const key = dedupNormName(p.hotel_name);
      if (!key) continue;
      if (!byName[key]) byName[key] = [];
      byName[key].push(p);
    }
    for (const [name, ps] of Object.entries(byName)) {
      if (ps.length < 2) continue;
      groups.push({ confidence: "Identical", reason: "Exact same name (same city)", hotels: ps, key: name });
      ps.forEach(p => assigned.add(p.id));
    }
  }

  // Pass 1: Identical — same hotel-level website
  const byUrl = {};
  for (const p of prospects) {
    if (assigned.has(p.id)) continue;
    if (!isHotelLevelUrl(p.website)) continue;
    const key = canonicalizeUrl(p.website);
    if (!key) continue;
    if (!byUrl[key]) byUrl[key] = [];
    byUrl[key].push(p);
  }
  for (const [url, ps] of Object.entries(byUrl)) {
    if (ps.length < 2) continue;
    const ids = ps.map(p => p.id);
    if (ids.some(id => assigned.has(id))) continue;
    groups.push({ confidence: "Identical", reason: "Same hotel-level website", hotels: ps, key: url });
    ids.forEach(id => assigned.add(id));
  }

  // Pass 2: High — same normalized address (same city)
  for (const [city, cityPs] of Object.entries(byCity)) {
    const byAddr = {};
    for (const p of cityPs) {
      if (assigned.has(p.id)) continue;
      const addr = normalizeAddr(p.address);
      if (!addr || addr.length < 10) continue;
      if (!byAddr[addr]) byAddr[addr] = [];
      byAddr[addr].push(p);
    }
    for (const [addr, ps] of Object.entries(byAddr)) {
      if (ps.length < 2) continue;
      const ids = ps.map(p => p.id);
      groups.push({ confidence: "High", reason: "Same normalized address", hotels: ps, key: addr });
      ids.forEach(id => assigned.add(id));
    }
  }

  // Pass 3: High — very similar name (>=0.80) + same city + rooms match
  // Medium — similar name (>=0.70) + same city
  for (const [city, cityPs] of Object.entries(byCity)) {
    for (let i = 0; i < cityPs.length; i++) {
      if (assigned.has(cityPs[i].id)) continue;
      const cluster = [cityPs[i]];
      for (let j = i + 1; j < cityPs.length; j++) {
        if (assigned.has(cityPs[j].id)) continue;
        const jac = dedupJaccard(cityPs[i].hotel_name, cityPs[j].hotel_name);
        if (jac >= 0.70) {
          cluster.push(cityPs[j]);
        }
      }
      if (cluster.length >= 2) {
        const jac = dedupJaccard(cluster[0].hotel_name, cluster[1].hotel_name);
        const roomsMatch = cluster.every(p => p.rooms) &&
          Math.abs((cluster[0].rooms || 0) - (cluster[1].rooms || 0)) <= 5;
        const isHigh = jac >= 0.80 && roomsMatch;
        groups.push({
          confidence: isHigh ? "High" : "Medium",
          reason: isHigh ? "Very similar name + matching rooms" : "Similar hotel name (same city)",
          hotels: cluster,
          key: dedupNormName(cityPs[i].hotel_name),
        });
        cluster.forEach(p => assigned.add(p.id));
      }
    }
  }

  // Pass 4: Low — cross-city name similarity
  const allCities = Object.keys(byCity);
  for (let ci = 0; ci < allCities.length; ci++) {
    for (let cj = ci + 1; cj < allCities.length; cj++) {
      for (const a of byCity[allCities[ci]]) {
        if (assigned.has(a.id)) continue;
        for (const b of byCity[allCities[cj]]) {
          if (assigned.has(b.id)) continue;
          if (dedupJaccard(a.hotel_name, b.hotel_name) >= 0.85) {
            groups.push({
              confidence: "Low",
              reason: `Similar name across cities (${a.city} / ${b.city})`,
              hotels: [a, b],
              key: dedupNormName(a.hotel_name),
            });
            assigned.add(a.id);
            assigned.add(b.id);
          }
        }
      }
    }
  }

  return groups.sort((a, b) => {
    const order = { Identical: 0, High: 1, Medium: 2, Low: 3 };
    return (order[a.confidence] || 4) - (order[b.confidence] || 4);
  });
}


const css = `
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
  :root {
    --bg: #f5f6fa; --surface: #ffffff; --border: #e8eaed; --border2: #d1d5db;
    --text: #111827; --text2: #374151; --text3: #6b7280;
    --accent: #2563eb; --accent-light: #eff6ff; --accent-dark: #1d4ed8;
    --green: #059669; --green-bg: #ecfdf5; --green-border: #a7f3d0;
    --amber: #d97706; --amber-bg: #fffbeb;
    --red: #dc2626; --red-bg: #fef2f2;
    --orange: #ea580c; --orange-bg: #fff7ed;
    --radius: 8px;
    --shadow-sm: 0 1px 2px rgba(0,0,0,0.05);
    --shadow: 0 1px 3px rgba(0,0,0,0.1), 0 1px 2px rgba(0,0,0,0.06);
    --shadow-md: 0 4px 6px rgba(0,0,0,0.07);
  }
  body { background: var(--bg); color: var(--text); font-family: 'Inter', -apple-system, sans-serif; font-size: 14px; line-height: 1.5; -webkit-font-smoothing: antialiased; }
  .app { max-width: 1440px; margin: 0 auto; min-height: 100vh; }

  .topnav { background: var(--surface); border-bottom: 1px solid var(--border); padding: 0 28px; display: flex; align-items: center; justify-content: space-between; height: 56px; position: sticky; top: 0; z-index: 10; }
  .nav-left { display: flex; align-items: center; gap: 10px; }
  .wtk-icon { width: 28px; height: 28px; display: flex; align-items: center; justify-content: center; flex-shrink: 0; font-size: 18px; font-weight: 800; background: linear-gradient(135deg, #6db3c4, #8b5fbf, #e8a444); -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text; }
  .nav-brand { font-size: 13px; font-weight: 600; color: var(--text); }
  .nav-sep { width: 1px; height: 20px; background: var(--border); }
  .nav-page { font-size: 13px; color: var(--text3); }
  .nav-stats { display: flex; gap: 28px; }
  .nav-stat { text-align: right; }
  .nav-stat-n { font-size: 18px; font-weight: 700; color: var(--text); display: block; line-height: 1.1; }
  .nav-stat-l { font-size: 11px; color: var(--text3); }

  .main { padding: 24px 28px; }

  .cmd-panel { background: var(--surface); border: 1px solid var(--border); border-radius: var(--radius); padding: 10px 16px; margin-bottom: 16px; box-shadow: var(--shadow-sm); }
  .cmd-inline { display: flex; align-items: center; gap: 6px; flex-wrap: wrap; }
  .cmd-geo { display: flex; align-items: center; gap: 4px; }
  .cmd-input { background: var(--bg); border: 1px solid var(--border2); border-radius: 5px; padding: 5px 8px; font-family: 'Inter',sans-serif; font-size: 12px; color: var(--text); outline: none; height: 30px; }
  .cmd-input:focus { border-color: var(--accent); }
  .cmd-link { background: none; border: none; font-size: 11px; color: var(--accent); cursor: pointer; padding: 0 2px; white-space: nowrap; }
  .cmd-divider { width: 1px; height: 20px; background: var(--border2); margin: 0 2px; }
  .tier-btn { padding: 4px 10px; border: 1px solid var(--border2); border-radius: 5px; background: var(--surface); font-family: 'Inter',sans-serif; font-size: 11px; font-weight: 500; color: var(--text2); cursor: pointer; transition: all 0.15s; height: 30px; }
  .tier-btn:hover { border-color: var(--accent); color: var(--accent); }
  .tier-btn.active { background: var(--accent); color: white; border-color: var(--accent); }
  .field { display: flex; flex-direction: column; gap: 4px; }
  .field-label { font-size: 11px; font-weight: 600; color: var(--text2); text-transform: uppercase; letter-spacing: 0.05em; }
  .field input, .field select { background: var(--bg); border: 1px solid var(--border2); border-radius: 6px; padding: 7px 11px; font-family: 'Inter', sans-serif; font-size: 13px; color: var(--text); outline: none; transition: all 0.15s; height: 34px; }
  .field input:focus, .field select:focus { border-color: var(--accent); background: white; box-shadow: 0 0 0 3px rgba(37,99,235,0.1); }
  .geo-row { display: flex; gap: 8px; align-items: flex-end; }
  .geo-row .field { gap: 3px; min-width: 0; }
  .tier-grid { display: flex; gap: 8px; flex-wrap: wrap; margin-top: 12px; }
  .tier-btn { padding: 6px 14px; border: 1px solid var(--border2); border-radius: 6px; background: var(--surface); font-family: 'Inter', sans-serif; font-size: 12px; font-weight: 500; color: var(--text2); cursor: pointer; transition: all 0.15s; }
  .tier-btn:hover { border-color: var(--accent); color: var(--accent); }
  .tier-btn.active { background: var(--accent); color: white; border-color: var(--accent); }
  .tier-desc { font-size: 11px; color: var(--text3); margin-top: 6px; }
  .run-btn { background: var(--accent); color: white; border: none; border-radius: 6px; padding: 0 20px; font-family: 'Inter', sans-serif; font-size: 13px; font-weight: 600; cursor: pointer; display: flex; align-items: center; gap: 6px; height: 34px; transition: all 0.15s; white-space: nowrap; }
  .run-btn:hover:not(:disabled) { background: var(--accent-dark); }
  .run-btn:disabled { opacity: 0.5; cursor: not-allowed; }
  .spinner { width: 12px; height: 12px; border: 2px solid rgba(255,255,255,0.3); border-top-color: white; border-radius: 50%; animation: spin 0.7s linear infinite; }
  @keyframes spin { to { transform: rotate(360deg); } }
  .progress-wrap { margin-top: 12px; }
  .progress-bar { height: 3px; background: var(--border); border-radius: 3px; overflow: hidden; }
  .progress-fill { height: 100%; background: var(--accent); border-radius: 3px; transition: width 0.4s; }
  .progress-text { margin-top: 6px; font-size: 12px; color: var(--text3); }
  .success-msg { margin-top: 10px; font-size: 12px; color: var(--green); font-weight: 500; }
  .db-note { margin-top: 4px; font-size: 11px; color: var(--text3); display: flex; align-items: center; gap: 5px; }
  .db-dot { width: 6px; height: 6px; border-radius: 50%; background: var(--green); }
  .error-msg { margin-top: 10px; padding: 8px 12px; background: var(--red-bg); border: 1px solid #fca5a5; border-radius: 6px; font-size: 12px; color: var(--red); }

  .toolbar { display: flex; align-items: center; gap: 8px; margin-bottom: 14px; flex-wrap: wrap; }
  .filter-pill { padding: 4px 12px; border-radius: 20px; border: 1px solid var(--border2); background: var(--surface); font-size: 12px; font-weight: 500; color: var(--text2); cursor: pointer; font-family: 'Inter', sans-serif; transition: all 0.15s; }
  .filter-pill:hover { border-color: var(--accent); color: var(--accent); }
  .filter-pill.active { background: var(--accent); color: white; border-color: var(--accent); }
  .export-btn { padding: 5px 12px; border: 1px solid var(--border2); border-radius: 6px; background: var(--surface); font-size: 12px; font-weight: 500; color: var(--text2); cursor: pointer; font-family: 'Inter', sans-serif; transition: all 0.15s; }
  .export-btn:hover { border-color: var(--accent); color: var(--accent); }
  .record-count { font-size: 12px; color: var(--text3); margin-left: auto; }

  .tabs { display: flex; border-bottom: 1px solid var(--border); margin-bottom: 16px; }
  .tab { padding: 8px 16px; font-size: 13px; font-weight: 500; color: var(--text3); cursor: pointer; border: none; background: none; border-bottom: 2px solid transparent; margin-bottom: -1px; transition: all 0.15s; display: flex; align-items: center; gap: 6px; font-family: 'Inter', sans-serif; }
  .tab.active { color: var(--accent); border-bottom-color: var(--accent); }
  .tab-badge { background: var(--border); color: var(--text3); font-size: 11px; font-weight: 600; padding: 1px 6px; border-radius: 10px; }
  .tab.active .tab-badge { background: var(--accent-light); color: var(--accent); }

  .table-card { background: var(--surface); border: 1px solid var(--border); border-radius: var(--radius); overflow: hidden; box-shadow: var(--shadow-sm); }
  table { width: 100%; border-collapse: collapse; table-layout: fixed; }
  thead th { background: var(--bg); padding: 8px 8px; text-align: left; font-size: 10px; font-weight: 600; color: var(--text3); letter-spacing: 0.05em; text-transform: uppercase; border-bottom: 1px solid var(--border); white-space: nowrap; }
  thead th.sortable { cursor: pointer; user-select: none; }
  thead th.sortable:hover { color: var(--accent); }
  .sort-arrow { font-size: 10px; margin-left: 2px; opacity: 0.4; }
  .sort-arrow.active { opacity: 1; color: var(--accent); }
  tbody tr { border-bottom: 1px solid var(--border); cursor: pointer; transition: background 0.1s; }
  tbody tr:last-child { border-bottom: none; }
  tbody tr:hover { background: #f9fafb; }
  td { padding: 7px 8px; vertical-align: middle; color: var(--text); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
  .hotel-name { font-size: 13px; font-weight: 600; color: var(--text); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
  .hotel-sub { font-size: 12px; color: var(--text3); margin-top: 1px; }
  .gm-name { font-size: 13px; font-weight: 500; }
  .gm-title-sm { font-size: 11px; color: var(--text3); margin-top: 1px; }
  .cell-muted { font-size: 13px; color: var(--text3); }
  .email-link { font-size: 12px; color: var(--accent); text-decoration: none; }
  .email-link:hover { text-decoration: underline; }

  .badge { display: inline-flex; align-items: center; padding: 2px 8px; border-radius: 4px; font-size: 11px; font-weight: 600; white-space: nowrap; }
  .badge-luxury { background: #fef3c7; color: #92400e; border: 1px solid #fde68a; }
  .badge-premium { background: var(--accent-light); color: #1e40af; border: 1px solid #bfdbfe; }
  .badge-lifestyle { background: #f3e8ff; color: #6b21a8; border: 1px solid #d8b4fe; }
  .badge-economy { background: #f3f4f6; color: var(--text3); border: 1px solid var(--border); }
  .badge-h { background: var(--green-bg); color: #065f46; border: 1px solid var(--green-border); }
  .badge-m { background: var(--amber-bg); color: #92400e; border: 1px solid #fde68a; }
  .badge-l { background: #f3f4f6; color: var(--text3); border: 1px solid var(--border); }
  .badge-dgm { background: var(--accent-light); color: #1e40af; border: 1px solid #bfdbfe; }
  .badge-hold { background: #f3f4f6; color: var(--text3); border: 1px solid var(--border); }
  .sdr-tag { font-size: 12px; font-weight: 600; color: var(--amber); }

  .empty { text-align: center; padding: 80px 40px; }
  .empty-icon { font-size: 36px; margin-bottom: 12px; }
  .empty-title { font-size: 15px; font-weight: 600; color: var(--text2); margin-bottom: 6px; }
  .empty-sub { font-size: 13px; color: var(--text3); }

  /* Outreach tracker - pipeline view */
  .view-toggle { display: flex; gap: 4px; }
  .view-btn { padding: 4px 10px; border: 1px solid var(--border2); border-radius: 5px; background: var(--surface); font-size: 11px; color: var(--text2); cursor: pointer; }
  .view-btn.active { background: var(--accent); color: white; border-color: var(--accent); }
  .outreach-list { width: 100%; border-collapse: collapse; font-size: 12px; background: var(--surface); }
  .outreach-list th { padding: 8px 10px; text-align: left; font-size: 10px; font-weight: 600; color: var(--text3); text-transform: uppercase; letter-spacing: 0.05em; border-bottom: 2px solid var(--border); white-space: nowrap; background: var(--bg); }
  .outreach-list td { padding: 8px 10px; border-bottom: 1px solid var(--border); vertical-align: middle; }
  .outreach-list tr:hover td { background: #f9fafb; }
  .touch-mini { display: flex; gap: 3px; }
  .touch-dot { width: 18px; height: 18px; border-radius: 50%; border: 1.5px solid var(--border2); display: flex; align-items: center; justify-content: center; font-size: 9px; font-weight: 600; color: var(--text3); flex-shrink: 0; }
  .touch-dot.done { background: var(--green); border-color: var(--green); color: white; }
  .touch-dot.overdue { border-color: var(--red); color: var(--red); }
  .touch-dot.upcoming { border-color: var(--amber); color: var(--amber); }
  .notes-cell { max-width: 160px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; color: var(--text3); font-style: italic; cursor: pointer; }
  .notes-cell:hover { color: var(--accent); }
  .note-input { width: 100%; font-size: 12px; border: 1px solid var(--accent); border-radius: 4px; padding: 4px 6px; font-family: 'Inter',sans-serif; resize: vertical; min-height: 48px; box-sizing: border-box; }
  .del-btn { background: none; border: none; color: var(--text3); cursor: pointer; font-size: 14px; padding: 2px 5px; border-radius: 3px; line-height: 1; }
  .del-btn:hover { color: var(--red); background: #fee2e2; }
  .confirm-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.5); z-index: 200; display: flex; align-items: center; justify-content: center; }
  .dup-modal { background: var(--bg); border-radius: 12px; width: 90vw; max-width: 900px; max-height: 80vh; overflow-y: auto; padding: 24px; box-shadow: 0 20px 60px rgba(0,0,0,0.3); }
  .dup-group { border: 1px solid var(--border); border-radius: 8px; margin-bottom: 12px; overflow: hidden; }
  .dup-group-hdr { padding: 10px 14px; font-size: 12px; font-weight: 600; display: flex; align-items: center; gap: 8px; cursor: pointer; }
  .dup-group-hdr:hover { background: var(--bg2); }
  .dup-badge-identical { background: #fee2e2; color: #991b1b; padding: 2px 8px; border-radius: 10px; font-size: 10px; font-weight: 700; }
  .dup-badge-high { background: #fef3c7; color: #d97706; padding: 2px 8px; border-radius: 10px; font-size: 10px; font-weight: 700; }
  .dup-badge-med { background: #fef3c7; color: #d97706; padding: 2px 8px; border-radius: 10px; font-size: 10px; font-weight: 700; }
  .dup-badge-low { background: #e0e7ff; color: #4338ca; padding: 2px 8px; border-radius: 10px; font-size: 10px; font-weight: 700; }
  .dup-hotels { padding: 8px 14px; border-top: 1px solid var(--border); }
  .dup-hotel-row { display: grid; grid-template-columns: 1.5fr 80px 80px 60px 60px 1fr 70px; gap: 6px; padding: 6px 0; font-size: 11px; border-bottom: 1px solid var(--border2); align-items: center; }
  .dup-hotel-row:last-child { border-bottom: none; }
  .dup-keep-btn { background: var(--green); color: white; border: none; border-radius: 4px; padding: 3px 8px; font-size: 10px; font-weight: 600; cursor: pointer; }
  .dup-keep-btn:hover { opacity: 0.85; }
  .dup-actions { display: flex; gap: 6px; padding: 8px 14px; border-top: 1px solid var(--border); background: var(--bg2); }
  .confirm-box { background: white; border-radius: 10px; padding: 24px 28px; max-width: 380px; width: 90%; box-shadow: 0 10px 40px rgba(0,0,0,0.25); }
  .confirm-title { font-weight: 700; font-size: 15px; margin-bottom: 6px; }
  .confirm-sub { font-size: 13px; color: var(--text2); margin-bottom: 20px; line-height: 1.5; }
  .confirm-btns { display: flex; gap: 8px; justify-content: flex-end; }
  .confirm-cancel { padding: 7px 16px; border: 1px solid var(--border2); border-radius: 6px; background: var(--surface); cursor: pointer; font-size: 13px; }
  .confirm-del { padding: 7px 16px; border-radius: 6px; background: var(--red); color: white; border: none; cursor: pointer; font-size: 13px; font-weight: 600; }
  .pipeline-legend { font-size: 12px; color: var(--text3); margin-bottom: 14px; display: flex; align-items: center; gap: 16px; flex-wrap: wrap; }
  .legend-item { display: flex; align-items: center; gap: 5px; }
  .legend-dot { width: 8px; height: 8px; border-radius: 50%; }
  .cards-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); gap: 12px; }

/* ═══ KANBAN BOARD ═══ */
  .kanban-board { display: flex; gap: 8px; overflow-x: auto; padding-bottom: 12px; min-height: 400px; }
  .kanban-col { min-width: 155px; width: 155px; flex-shrink: 0; display: flex; flex-direction: column; background: var(--bg); border-radius: var(--radius); border: 1px solid var(--border); transition: all 0.15s; }
  .kanban-col.drag-over { border-color: var(--accent); background: var(--accent-light); box-shadow: 0 0 0 2px rgba(37,99,235,0.15); }
  .kanban-col-header { padding: 8px 10px; border-top: 3px solid; display: flex; align-items: center; justify-content: space-between; border-radius: var(--radius) var(--radius) 0 0; background: var(--surface); }
  .kanban-col-title { font-size: 11px; font-weight: 700; color: var(--text); text-transform: uppercase; letter-spacing: 0.04em; }
  .kanban-col-count { font-size: 10px; font-weight: 700; padding: 0px 6px; border-radius: 8px; min-width: 18px; text-align: center; }
  .kanban-col-body { flex: 1; padding: 4px; display: flex; flex-direction: column; gap: 4px; overflow-y: auto; max-height: 65vh; }
  .kb-card { background: var(--surface); border: 1px solid var(--border); border-radius: 5px; padding: 8px 10px; cursor: grab; transition: all 0.12s; }
  .kb-card:hover { border-color: var(--accent); box-shadow: var(--shadow); }
  .kb-card:active { cursor: grabbing; opacity: 0.85; }
  .kb-card-top { display: flex; align-items: flex-start; justify-content: space-between; gap: 4px; }
  .kb-hotel { font-size: 11px; font-weight: 600; color: var(--text); line-height: 1.25; }
  .kb-city { font-size: 10px; color: var(--text3); margin-top: 3px; line-height: 1.2; }
  .kb-bottom { display: flex; align-items: center; justify-content: space-between; margin-top: 5px; padding-top: 4px; border-top: 1px solid var(--border); }
  .kb-last { font-size: 9px; color: var(--text3); }
  .kb-sdr { font-size: 9px; font-weight: 600; color: var(--text3); }
  .kb-menu-btn { background: none; border: none; font-size: 14px; color: var(--text3); cursor: pointer; padding: 0 2px; line-height: 1; }
  .kb-menu-btn:hover { color: var(--text); }
  .kb-menu { position: absolute; right: 0; top: 20px; background: var(--surface); border: 1px solid var(--border); border-radius: 6px; box-shadow: var(--shadow-md); z-index: 50; min-width: 120px; padding: 4px 0; }
  .kb-menu-title { font-size: 9px; font-weight: 700; color: var(--text3); text-transform: uppercase; letter-spacing: 0.05em; padding: 4px 10px 2px; }
  .kb-menu-item { display: flex; align-items: center; gap: 6px; width: 100%; padding: 5px 10px; border: none; background: none; font-size: 11px; color: var(--text2); cursor: pointer; font-family: inherit; text-align: left; }
  .kb-menu-item:hover { background: var(--accent-light); color: var(--accent); }
  .kb-menu-dot { width: 6px; height: 6px; border-radius: 50%; flex-shrink: 0; }
  .int-tag { font-size: 8px; font-weight: 700; padding: 1px 5px; border-radius: 3px; text-transform: uppercase; letter-spacing: 0.04em; flex-shrink: 0; white-space: nowrap; }
  .int-hot { background: #fef2f2; color: #dc2626; }
  .int-warm { background: #fffbeb; color: #d97706; }
  .int-cold { background: #eff6ff; color: #6b7280; }
  .pipeline-summary { display: flex; gap: 6px; align-items: center; font-size: 12px; color: var(--text3); padding: 8px 12px; background: var(--surface); border: 1px solid var(--border); border-radius: var(--radius); margin-bottom: 12px; flex-wrap: wrap; }
  .pipeline-summary strong { color: var(--text); font-weight: 700; }
  .ps-sep { color: var(--border2); }
  .stage-select { font-size: 10px; font-weight: 600; padding: 2px 4px; border-radius: 4px; border: 1px solid var(--border); cursor: pointer; font-family: inherit; min-width: 55px; }
  .intent-select { font-size: 10px; font-weight: 600; padding: 2px 2px; border-radius: 4px; border: 1px solid var(--border); cursor: pointer; font-family: inherit; min-width: 50px; background: white; }
  .add-hotel-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin: 12px 0; }
  .add-hotel-grid label { font-size: 11px; font-weight: 600; color: var(--text2); display: flex; flex-direction: column; gap: 3px; }
  .add-hotel-grid input, .add-hotel-grid select, .add-hotel-grid textarea { padding: 6px 8px; border: 1px solid var(--border2); border-radius: 5px; font-size: 12px; font-family: inherit; }
  .add-hotel-grid .full-width { grid-column: 1 / -1; }
  .contact-tracker { width: 100%; border-collapse: collapse; font-size: 12px; background: var(--surface); }
  .contact-tracker th { padding: 6px 8px; text-align: left; font-size: 10px; font-weight: 600; color: var(--text3); text-transform: uppercase; letter-spacing: 0.04em; border-bottom: 2px solid var(--border); white-space: nowrap; background: var(--bg); position: sticky; top: 0; }
  .contact-tracker td { padding: 5px 8px; border-bottom: 1px solid var(--border); vertical-align: middle; }
  .contact-tracker tr:hover td { background: #f9fafb; }
  .ct-badge { font-size: 9px; font-weight: 700; padding: 1px 6px; border-radius: 3px; text-transform: uppercase; }
  .track-card { background: var(--surface); border: 1px solid var(--border); border-radius: var(--radius); padding: 16px; cursor: pointer; transition: all 0.15s; box-shadow: var(--shadow-sm); }
  .track-card:hover { border-color: var(--border2); box-shadow: var(--shadow); }
  .track-card.closed { opacity: 0.55; background: #fafafa; }
  .track-card.reopen { opacity: 0.7; }
  .track-hotel { font-size: 13px; font-weight: 600; color: var(--text); margin-bottom: 2px; }
  .track-gm { font-size: 12px; color: var(--text3); margin-bottom: 10px; }

  /* Touch timeline */
  .touch-timeline { display: flex; align-items: flex-start; gap: 0; margin-bottom: 10px; }
  .touch-node { display: flex; flex-direction: column; align-items: center; gap: 3px; flex: 1; position: relative; }
  .touch-node:not(:last-child)::after { content: ''; position: absolute; top: 14px; left: 55%; width: 88%; height: 2px; background: var(--border); z-index: 0; }
  .touch-node.t-done:not(:last-child)::after { background: var(--green); }
  .touch-node.t-skipped:not(:last-child)::after { background: #e5e7eb; }
  .touch-circle { width: 28px; height: 28px; border-radius: 50%; border: 2px solid var(--border2); background: var(--surface); font-size: 11px; font-weight: 700; cursor: pointer; display: flex; align-items: center; justify-content: center; color: var(--text3); transition: all 0.15s; z-index: 1; position: relative; }
  .touch-circle.t-done { background: var(--green-bg); border-color: var(--green); color: var(--green); }
  .touch-circle.t-overdue { background: var(--red-bg); border-color: var(--red); color: var(--red); animation: pulse 2s infinite; }
  .touch-circle.t-upcoming { background: var(--amber-bg); border-color: var(--amber); color: var(--amber); }
  .touch-circle.t-locked { background: #f9fafb; border-color: var(--border); color: #d1d5db; cursor: not-allowed; }
  .touch-circle.t-demo { background: #f0fdf4; border-color: #22c55e; color: #16a34a; }
  .touch-circle:not(.t-locked):not(.t-done):hover { border-color: var(--accent); color: var(--accent); background: var(--accent-light); }
  @keyframes pulse { 0%,100%{box-shadow:0 0 0 0 rgba(220,38,38,0.3)} 50%{box-shadow:0 0 0 4px rgba(220,38,38,0)} }
  .touch-lbl { font-size: 10px; font-weight: 500; color: var(--text3); white-space: nowrap; }
  .touch-date { font-size: 9px; white-space: nowrap; color: var(--text3); }
  .touch-date.od { color: var(--red); font-weight: 600; }
  .touch-date.up { color: var(--amber); font-weight: 600; }
  .touch-date.ok { color: var(--green); }

  /* Status bar at bottom of card */
  .card-footer { display: flex; justify-content: space-between; align-items: center; margin-top: 8px; gap: 8px; }
  .pipeline-status { font-size: 11px; font-weight: 600; padding: 3px 9px; border-radius: 4px; display: inline-flex; align-items: center; gap: 4px; }
  .ps-active { background: var(--accent-light); color: var(--accent); }
  .ps-demo { background: #f0fdf4; color: #16a34a; border: 1px solid #bbf7d0; }
  .ps-won { background: var(--green-bg); color: var(--green); border: 1px solid var(--green-border); }
  .ps-dead { background: #f3f4f6; color: var(--text3); }
  .ps-overdue { background: var(--red-bg); color: var(--red); }
  .ps-reopen { background: var(--amber-bg); color: var(--amber); }

  /* Pipeline action buttons on card */
  .card-actions { display: flex; gap: 6px; margin-top: 10px; flex-wrap: wrap; }
  .act-btn { padding: 4px 10px; border-radius: 5px; border: 1px solid var(--border2); background: var(--surface); font-size: 11px; font-weight: 600; cursor: pointer; font-family: 'Inter',sans-serif; transition: all 0.15s; color: var(--text2); }
  .act-btn:hover { border-color: var(--accent); color: var(--accent); }
  .act-btn.danger { color: var(--red); }
  .act-btn.danger:hover { border-color: var(--red); background: var(--red-bg); }
  .act-btn.success { color: var(--green); }
  .act-btn.success:hover { border-color: var(--green); background: var(--green-bg); }

  /* Rejection modal */
  .modal-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.5); z-index: 200; display: flex; align-items: center; justify-content: center; }
  .modal { background: var(--surface); border-radius: 10px; padding: 24px; width: 420px; box-shadow: var(--shadow-md); }
  .modal-title { font-size: 15px; font-weight: 700; color: var(--text); margin-bottom: 6px; }
  .modal-sub { font-size: 13px; color: var(--text3); margin-bottom: 16px; }
  .reason-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; margin-bottom: 16px; }
  .reason-btn { padding: 8px 12px; border-radius: 6px; border: 1px solid var(--border2); background: var(--surface); font-size: 12px; font-weight: 500; color: var(--text2); cursor: pointer; font-family: 'Inter',sans-serif; text-align: left; transition: all 0.15s; }
  .reason-btn:hover { border-color: var(--accent); color: var(--accent); background: var(--accent-light); }
  .reason-btn.selected { border-color: var(--accent); background: var(--accent-light); color: var(--accent); }
  .modal-footer { display: flex; justify-content: flex-end; gap: 8px; }
  .modal-cancel { padding: 7px 16px; border: 1px solid var(--border2); border-radius: 6px; background: var(--surface); font-size: 13px; cursor: pointer; font-family: 'Inter',sans-serif; }
  .modal-confirm { padding: 7px 16px; border: none; border-radius: 6px; background: var(--accent); color: white; font-size: 13px; font-weight: 600; cursor: pointer; font-family: 'Inter',sans-serif; }
  .modal-confirm.danger-btn { background: var(--red); }

  /* Filter tabs for pipeline stage */
  .stage-tabs { display: flex; gap: 6px; margin-bottom: 14px; flex-wrap: wrap; }
  .stage-tab { padding: 4px 12px; border-radius: 20px; border: 1px solid var(--border2); background: var(--surface); font-size: 12px; font-weight: 500; color: var(--text2); cursor: pointer; font-family: 'Inter',sans-serif; transition: all 0.15s; display: flex; align-items: center; gap: 4px; }
  .stage-tab:hover { border-color: var(--accent); color: var(--accent); }
  .stage-tab.active { background: var(--accent); color: white; border-color: var(--accent); }
  .stage-cnt { font-size: 10px; font-weight: 700; opacity: 0.8; }


  /* Drawer */
  .overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.2); z-index: 70; }
  .drawer { position: fixed; top: 0; right: 0; bottom: 0; width: 560px; background: var(--surface); border-left: 1px solid var(--border); z-index: 80; overflow-y: auto; padding: 28px 28px 40px; box-shadow: -8px 0 24px rgba(0,0,0,0.08); animation: slideIn 0.2s ease; }
  @keyframes slideIn { from { transform: translateX(100%); } to { transform: translateX(0); } }
  .drawer-close { position: absolute; top: 16px; right: 16px; width: 28px; height: 28px; border: none; background: var(--border); border-radius: 6px; cursor: pointer; font-size: 14px; color: var(--text2); display: flex; align-items: center; justify-content: center; }
  .drawer-hotel { font-size: 20px; font-weight: 700; color: var(--text); margin-bottom: 4px; padding-right: 40px; }
  .drawer-meta { font-size: 12px; color: var(--text3); margin-bottom: 24px; }
  .d-sec { margin-bottom: 20px; padding-bottom: 20px; border-bottom: 1px solid var(--border); }
  .d-sec:last-child { border-bottom: none; margin-bottom: 0; }
  .d-sec-title { font-size: 11px; font-weight: 700; color: var(--text3); text-transform: uppercase; letter-spacing: 0.07em; margin-bottom: 12px; }
  .d-row { display: grid; grid-template-columns: 96px 1fr; gap: 8px; margin-bottom: 8px; font-size: 13px; }
  .d-key { color: var(--text3); font-weight: 500; }
  .d-val { color: var(--text); font-weight: 500; }
  .email-touch { margin-bottom: 20px; }
  .touch-hdr { font-size: 11px; font-weight: 700; color: var(--accent); text-transform: uppercase; letter-spacing: 0.07em; margin-bottom: 6px; display: flex; align-items: center; gap: 6px; flex-wrap: wrap; }
  .touch-hdr .tag { background: var(--accent); color: white; font-size: 10px; padding: 2px 7px; border-radius: 10px; font-weight: 600; }
  .subject-line { font-size: 13px; font-weight: 600; color: var(--text); margin-bottom: 8px; }
  .email-body { background: #f9fafb; border: 1px solid var(--border); border-radius: 6px; padding: 14px; font-size: 13px; line-height: 1.75; color: var(--text2); }
  .email-para { margin-bottom: 12px; }
  .email-para:last-child { margin-bottom: 0; }
  .copy-btn { margin-top: 7px; padding: 4px 12px; border: 1px solid var(--border2); border-radius: 5px; background: var(--surface); font-size: 11px; font-weight: 600; color: var(--text3); cursor: pointer; font-family: 'Inter', sans-serif; text-transform: uppercase; letter-spacing: 0.05em; transition: all 0.15s; }
  .copy-btn:hover { border-color: var(--accent); color: var(--accent); }
  .copy-btn.copied { background: var(--green-bg); border-color: var(--green-border); color: var(--green); }
  .research-notes { font-size: 13px; color: var(--text2); line-height: 1.8; }
  .research-notes .bullet { display: flex; gap: 8px; margin-bottom: 3px; }
  .research-notes .bullet-dot { color: var(--accent); font-weight: 700; flex-shrink: 0; }
  .research-notes .bullet-text { color: var(--text2); }

  /* Editable field in drawer */
  .d-val-edit { cursor: pointer; border-bottom: 1px dashed var(--border2); padding-bottom: 1px; transition: all 0.15s; }
  .d-val-edit:hover { border-bottom-color: var(--accent); color: var(--accent); }

  /* Dashboard */
  .dash-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 12px; margin-bottom: 16px; }
  .dash-card { background: var(--surface); border: 1px solid var(--border); border-radius: var(--radius); padding: 16px 18px; }
  .dash-card-label { font-size: 11px; font-weight: 600; color: var(--text3); text-transform: uppercase; letter-spacing: 0.04em; margin-bottom: 6px; }
  .dash-card-val { font-size: 28px; font-weight: 700; color: var(--text); line-height: 1.1; }
  .dash-card-sub { font-size: 11px; color: var(--text3); margin-top: 4px; }
  .dash-stage-bar { display: flex; height: 8px; border-radius: 4px; overflow: hidden; margin: 12px 0 6px; background: var(--bg); }
  .dash-stage-seg { transition: width 0.3s; min-width: 2px; }
  .dash-stage-legend { display: flex; flex-wrap: wrap; gap: 10px; font-size: 11px; color: var(--text3); }
  .dash-stage-dot { width: 8px; height: 8px; border-radius: 50%; display: inline-block; margin-right: 4px; vertical-align: middle; }

  /* Batch select */
  .batch-bar { display: flex; align-items: center; gap: 8px; padding: 8px 14px; background: var(--accent-light); border: 1px solid #bfdbfe; border-radius: var(--radius); margin-bottom: 8px; flex-wrap: wrap; }
  .batch-bar-count { font-size: 13px; font-weight: 600; color: var(--accent); }
  .batch-bar select, .batch-bar button { font-size: 11px; }
  .cb-cell { width: 28px; text-align: center; flex-shrink: 0; }
  .cb-cell input[type="checkbox"] { cursor: pointer; width: 14px; height: 14px; accent-color: var(--accent); }

  /* Focus mode */
  .focus-card { background: var(--surface); border: 1px solid var(--border); border-radius: var(--radius); padding: 14px 16px; margin-bottom: 8px; display: flex; align-items: center; gap: 14px; transition: border-color 0.15s; }
  .focus-card:hover { border-color: var(--accent); }
  .focus-card.overdue { border-left: 3px solid var(--red); }
  .focus-card.due-today { border-left: 3px solid var(--orange); }
  .focus-card.due-soon { border-left: 3px solid var(--amber); }
  .focus-done-btn { width: 28px; height: 28px; border-radius: 50%; border: 2px solid var(--border2); background: transparent; cursor: pointer; display: flex; align-items: center; justify-content: center; flex-shrink: 0; transition: all 0.15s; font-size: 13px; color: transparent; }
  .focus-done-btn:hover { border-color: var(--green); color: var(--green); background: var(--green-bg); }
  .focus-done-btn.checked { border-color: var(--green); color: var(--green); background: var(--green-bg); }
`;

function uid() { return Math.random().toString(36).slice(2, 9); }

// Normalize string for accent-insensitive, case-insensitive search
function normalizeSearch(s) {
  if (!s) return "";
  return s.toLowerCase()
    .normalize("NFD").replace(/[\u0300-\u036f]/g, "") // strip diacritics: ö→o, é→e, etc.
    .replace(/ø/g, "o").replace(/ß/g, "ss").replace(/æ/g, "ae").replace(/þ/g, "th");
}

function addBusinessDays(date, days) {
  const d = new Date(date);
  let added = 0;
  while (added < days) {
    d.setDate(d.getDate() + 1);
    const dow = d.getDay();
    if (dow !== 0 && dow !== 6) added++;
  }
  return d;
}
function parseJSON(raw) {
  try { const c = raw.replace(/```json|```/g, "").trim(); const s = c.indexOf("["), e = c.lastIndexOf("]"); if (s < 0 || e < 0) return []; return JSON.parse(c.slice(s, e + 1)); } catch { return []; }
}



const TOUCH_CONFIG = [
  { n: 1, label: "Touch 1", day: 0, desc: "Initial outreach" },
  { n: 2, label: "Touch 2", day: 4, desc: "Day 4 reply in thread" },
  { n: 3, label: "Touch 3", day: 9, desc: "Day 9 new angle" },
  { n: 4, label: "Touch 4", day: 16, desc: "Day 16 close out" },
];

const REJECTION_REASONS = [
  "Budget",
  "Already using competitor",
  "Not priority",
  "No response",
  "Timing issue",
  "Corporate decision",
  "Other",
];

function addDays(d, n) { const x = new Date(d); x.setDate(x.getDate() + n); return x; }
function fmtDate(d) { if (!d) return null; return new Date(d).toLocaleDateString("en-GB", { day: "2-digit", month: "short" }); }
function fmtDateShort(d) { if (!d) return null; return new Date(d).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "2-digit" }); }
function pluralDays(n) { const a = Math.abs(n); return a === 1 ? "1 day" : a + " days"; }
const STAGE_LABELS = {new:"New","1st":"Email #1","2nd":"Follow-up #1","3rd":"Follow-up #2","4th":"Follow-up #3",replied:"Replied",bounced:"Bounced",demo:"Demo",trial:"Trial",won:"Won",lost:"Lost"};
function stageLabel(s) { return STAGE_LABELS[s] || s?.charAt(0).toUpperCase() + s?.slice(1) || "New"; }
const TODAY = new Date();
function isOverdue(d) { return d && new Date(d) < TODAY; }

// Supabase returns done as JSON array or string - parse safely
function parseDone(done) {
  if (!done) return [];
  if (Array.isArray(done)) return done;
  try { return JSON.parse(done); } catch { return []; }
}

function getTouchState(t, tc) {
  const done = parseDone(t.done);
  const stage = t.pipeline_stage || "active";
  if (stage === "dead" || stage === "won") return "t-skipped";
  if (done.includes(tc.n)) return "t-done";
  const prevDone = tc.n === 1 || done.includes(tc.n - 1);
  if (!prevDone) return "t-locked";
  if (!t.d1) return tc.n === 1 ? "t-upcoming" : "t-locked";
  const dueDate = addDays(new Date(t.d1), tc.day + 1);
  return isOverdue(dueDate) ? "t-overdue" : "t-upcoming";
}

function getTouchDueStr(t, tc) {
  if (!t.d1) return null;
  const done = parseDone(t.done);
  if (done.includes(tc.n)) return { str: fmtDate(t[`d${tc.n}`]), cls: "ok" };
  const due = addDays(new Date(t.d1), tc.day + 1);
  return isOverdue(due) ? { str: `Due ${fmtDate(due)}`, cls: "od" } : { str: `Due ${fmtDate(due)}`, cls: "up" };
}

function getPipelineStatus(t) {
  const stage = t.pipeline_stage || "active";
  const done = parseDone(t.done);
  if (stage === "won") return { label: "🏆 Won", cls: "ps-won" };
  if (stage === "dead") return { label: `✕ Closed${t.rejection_reason ? ` · ${t.rejection_reason.split("(")[0].trim()}` : ""}`, cls: "ps-dead" };
  if (stage === "reopen") return { label: "⟳ Re-engage in 3 months", cls: "ps-reopen" };
  if (stage === "demo") return { label: "📅 Demo scheduled", cls: "ps-demo" };
  if (done.length === 0) return { label: "Not started", cls: "ps-active" };
  if (done.length === 4) return { label: "Sequence complete", cls: "ps-active" };
  if (t.d1) {
    const nextTc = TOUCH_CONFIG.find(tc => !done.includes(tc.n));
    if (nextTc) {
      const due = addDays(new Date(t.d1), nextTc.day + 1);
      if (isOverdue(due)) return { label: `⚠ Touch ${nextTc.n} overdue`, cls: "ps-overdue" };
      return { label: `Touch ${nextTc.n} due ${fmtDate(due)}`, cls: "ps-active" };
    }
  }
  return { label: `${done.length}/4 sent`, cls: "ps-active" };
}


function touch2Body(sel) {
  const provider = getProvider(sel);
  const providerLine = provider
    ? `\n\nOne thing worth mentioning: we're not here to replace ${provider}. Where to know works alongside it — specifically on the gaps ${provider} doesn't cover, like real-time competitor benchmarking and turning review patterns into actionable next steps for your team. Most of our hotel partners run both.`
    : "";
  return `Hi ${sel.gm_first_name || sel.gm_name?.split(" ")[0] || "[Name]"},\n\nJust following up on my note from earlier.\n\nAt ${sel.rating || "your current score"} across ${sel.review_count ? sel.review_count.toLocaleString() : "your"} reviews, do you have visibility into which specific issue is appearing most frequently in written guest feedback — before it shows up in the score?${providerLine}\n\nHappy to show you one example from a comparable property. 15 minutes next week?\n\nBest,\nZishuo Wang | Where to know`;
}
function touch3Body(sel) {
  return `Hi ${sel.gm_first_name || sel.gm_name?.split(" ")[0] || "[Name]"},\n\nI've reached out a couple of times — I'll keep this brief.\n\nIn competitive markets like ${sel.city}, perception shifts often appear in competitor guest commentary before rankings adjust. We're seeing this pattern across comparable properties in the area.\n\nWhere to know surfaces those competitor signals automatically, so you see where the gap is forming before it affects your standing.\n\nWould early next week or later work better for a 15-minute look? No prep needed.\n\nBest,\nZishuo Wang | Where to know`;
}
function touch4Body(sel) {
  return `Hi ${sel.gm_first_name || sel.gm_name?.split(" ")[0] || "[Name]"},\n\nI'll pause outreach after this — I don't want to keep landing in your inbox without purpose.\n\nIf the timing isn't right, I completely understand.\n\nOne thought to leave with you: the GMs who find this most useful tend to be the ones who engage before a score change, not after. If anything shifts — a competitive concern, a score movement, or a change in review volume — I'm easy to reach.\n\nWishing you and the team a strong season ahead.\n\nZishuo Wang | Where to know`;
}

function EmailBody({ text }) {
  if (!text) return null;
  const paras = text.split(/\n\n+/).filter(Boolean);
  return (
    <div className="email-body">
      {paras.map((p, i) => <div key={i} className="email-para">{p}</div>)}
    </div>
  );
}

function ResearchNotes({ text }) {
  if (!text) return null;
  // Strip the contacts JSON block — it's machine data, not for display
  const clean = text.replace(/<!--contacts:.*?-->\n?/s, "").trim();
  if (!clean) return null;
  // Split on bullet markers (• or - at line start) or newlines
  const lines = clean.split(/\n/).map(l => l.trim()).filter(Boolean);
  const bullets = [];
  let current = "";
  for (const line of lines) {
    if (line.startsWith("•") || line.startsWith("-") || line.startsWith("*")) {
      if (current) bullets.push(current);
      current = line.replace(/^[•\-*]+\s*/, "").replace(/^[•\-*]+\s*/, "");
    } else if (bullets.length === 0 && !current) {
      // No bullets found yet — paragraph mode, split on sentences
      current = line;
    } else {
      current += " " + line;
    }
  }
  if (current) bullets.push(current);

  // If no bullets found (pure paragraph), split into logical chunks
  if (bullets.length <= 1) {
    const para = clean.trim();
    const parts = para.split(/\.\s+/).filter(Boolean).map(s => s.endsWith(".") ? s : s + ".");
    return (
      <div className="research-notes">
        {parts.map((p, i) => (
          <div key={i} className="bullet">
            <span className="bullet-dot">•</span>
            <span className="bullet-text">{p}</span>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="research-notes">
      {bullets.map((b, i) => (
        <div key={i} className="bullet">
          <span className="bullet-dot">•</span>
          <span className="bullet-text">{b}</span>
        </div>
      ))}
    </div>
  );
}

function TierBadge({ tier }) {
  const t = (tier || "").toLowerCase();
  const cls = t.includes("lux") ? "badge-luxury" : t.includes("prem") ? "badge-premium" : t.includes("life") ? "badge-lifestyle" : "badge-economy";
  return <span className={`badge ${cls}`}>{tier || "—"}</span>;
}

// ── Inline editable field for the drawer ────────────────────────────────────
function EditableField({ value, placeholder, onSave, type, options }) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value || "");

  function startEdit() { setDraft(value || ""); setEditing(true); }
  function cancel() { setEditing(false); }
  function save() {
    const trimmed = draft.trim();
    if (trimmed !== (value || "")) onSave(trimmed);
    setEditing(false);
  }
  function handleKey(e) {
    if (e.key === "Enter") save();
    if (e.key === "Escape") cancel();
  }

  if (editing) {
    if (options) {
      return (
        <select value={draft} onChange={e => { setDraft(e.target.value); }} onBlur={save} autoFocus
          style={{fontSize:13,border:"1px solid var(--accent)",borderRadius:4,padding:"2px 6px",fontFamily:"'Inter',sans-serif",background:"white",outline:"none",minWidth:100}}>
          <option value="">—</option>
          {options.map(o => <option key={o} value={o}>{o}</option>)}
        </select>
      );
    }
    return (
      <input value={draft} onChange={e => setDraft(e.target.value)} onBlur={save} onKeyDown={handleKey} autoFocus
        type={type === "number" ? "number" : "text"}
        placeholder={placeholder || ""}
        style={{fontSize:13,border:"1px solid var(--accent)",borderRadius:4,padding:"2px 6px",fontFamily:"'Inter',sans-serif",width:"100%",background:"white",outline:"none",boxSizing:"border-box"}} />
    );
  }

  // Sanitize display: strip "[email protected]" artifacts
  let display = value;
  if (display && (display.includes('[email') || display.includes('email protected'))) {
    display = null;
  }

  return (
    <span onClick={startEdit} style={{cursor:"pointer",borderBottom:"1px dashed var(--border2)",paddingBottom:1}} title="Click to edit">
      {display || <span style={{color:"var(--text3)",fontStyle:"italic"}}>{placeholder || "Click to add"}</span>}
    </span>
  );
}


class ErrorBoundary extends Component {
  constructor(props) { super(props); this.state = { error: null }; }
  static getDerivedStateFromError(e) { return { error: e }; }
  render() {
    if (this.state.error) {
      return <div style={{padding:24,color:"var(--red)",fontSize:13}}>
        <strong>Error loading this section:</strong> {this.state.error.message}
        <div style={{marginTop:8,fontSize:11,color:"var(--text3)"}}>Check browser console for details.</div>
      </div>;
    }
    return this.props.children;
  }
}

function OutreachTab({ filteredT, stageFilter, setStageFilter, setSelected, touchToggle, updatePipeline, openRejectModal, reopenSequence, outreachView, setOutreachView, setDeleteConfirm, editingNote, setEditingNote, noteText, setNoteText, saveNote, prospects,
  outreachSearch, setOutreachSearch, outreachCountry, setOutreachCountry, outreachCity, setOutreachCity, outreachGroup, setOutreachGroup, outreachTier, setOutreachTier, outreachProvider, setOutreachProvider,
  allCountries, allCities, allGroups, allProviders, updateIntention,
  pipeStageFilter, setPipeStageFilter, pipeHasGM, setPipeHasGM, pipeHasEmail, setPipeHasEmail }) {

  const [dragOver, setDragOver] = useState(null);
  const [menuOpen, setMenuOpen] = useState(null);
  const hasActiveFilters = outreachSearch || outreachCountry || outreachCity || outreachGroup || outreachTier || outreachProvider || pipeStageFilter || pipeHasGM || pipeHasEmail;
  function clearFilters() { setOutreachSearch(""); setOutreachCountry(""); setOutreachCity(""); setOutreachGroup(""); setOutreachTier(""); setOutreachProvider(""); setPipeStageFilter(""); setPipeHasGM(false); setPipeHasEmail(false); }
  if (filteredT.length === 0 && !hasActiveFilters) return <div className="empty"><div className="empty-icon">{"\u{1F4EC}"}</div><div className="empty-title">No outreach tracked</div><div className="empty-sub">Run research to start the tracker.</div></div>;

  const STAGES = [
    { key: "new", label: "New", color: "#6b7280", bg: "#f9fafb" },
    { key: "1st", label: "Email #1", color: "#2563eb", bg: "#eff6ff" },
    { key: "2nd", label: "Follow-up #1", color: "#0891b2", bg: "#ecfeff" },
    { key: "3rd", label: "Follow-up #2", color: "#7c3aed", bg: "#f5f3ff" },
    { key: "4th", label: "Follow-up #3", color: "#6d28d9", bg: "#ede9fe" },
    { key: "replied", label: "Replied", color: "#0d9488", bg: "#f0fdfa" },
    { key: "bounced", label: "Bounced", color: "#b45309", bg: "#fef3c7" },
    { key: "demo", label: "Demo", color: "#c026d3", bg: "#fdf4ff" },
    { key: "trial", label: "Trial", color: "#ea580c", bg: "#fff7ed" },
    { key: "won", label: "Won", color: "#059669", bg: "#ecfdf5" },
    { key: "lost", label: "Lost", color: "#dc2626", bg: "#fef2f2" },
  ];
  const SK = STAGES.map(s => s.key);

  function effectiveStage(t) {
    const s = t.pipeline_stage || "new";
    // Legacy migration only — never use done to derive stage
    if (s === "active") return "new";
    if (s === "emailed") return "1st";
    if (s === "followup") return "2nd";
    if (s === "dead") return "lost";
    return SK.includes(s) ? s : "new";
  }

  // Summary counts should exclude stage filter (so you see total breakdown while filtering)
  const stageMap = {};
  STAGES.forEach(s => { stageMap[s.key] = []; });
  filteredT.forEach(t => { const s = effectiveStage(t); (stageMap[s] || stageMap["new"]).push(t); });

  // Apply stage filter for display only
  const displayT = pipeStageFilter ? filteredT.filter(t => effectiveStage(t) === pipeStageFilter) : filteredT;

  const IL = { 1: "Cold", 2: "Low", 3: "Medium", 4: "Warm", 5: "Hot" };
  const IC = { 1: "#9ca3af", 2: "#6b7280", 3: "#eab308", 4: "#f59e0b", 5: "#ef4444" };
  function intLabel(v) { return (!v || v < 1) ? null : { text: IL[v], cls: v >= 4 ? "int-hot" : v >= 3 ? "int-warm" : "int-cold" }; }

  function lastAct(t) {
    const d = t.done || [];
    if (!d.length) return "No contact";
    const last = d[d.length - 1], dt = t["d" + last];
    if (!dt) return "Touch " + last;
    const days = Math.floor((Date.now() - new Date(dt)) / 86400000);
    if (days === 0) return "Today";
    if (days === 1) return "Yesterday";
    if (days < 0) return "in " + Math.abs(days) + "d";
    return days + "d ago";
  }

  function changeStage(tid, stageKey, e) {
    if (e) e.stopPropagation();
    setMenuOpen(null);
    if (stageKey === "lost") { openRejectModal(tid, "lost", e); return; }
    const stageToTouch = { "1st": 1, "2nd": 2, "3rd": 3, "4th": 4 };
    const touchN = stageToTouch[stageKey];
    const t = filteredT.find(x => x.id === tid);
    if (!t) { updatePipeline(tid, { pipeline_stage: stageKey }); return; }
    const now = new Date().toISOString();
    const updates = { pipeline_stage: stageKey };
    // Clear rejection reason when moving out of lost
    const currentStage = effectiveStage(t);
    if (currentStage === "lost" && stageKey !== "lost") {
      updates.rejection_reason = null;
    }
    // Moving forward to 1st-4th: auto-create missing preceding actual dates
    if (touchN) {
      const done = [...(t.done || [])];
      for (let i = 1; i <= touchN; i++) {
        if (!t["d" + i]) updates["d" + i] = now;
        if (!done.includes(i)) done.push(i);
      }
      done.sort((a,b) => a - b);
      updates.done = done;
    }
    // Moving backward: if going back to "new", clear contact history
    if (stageKey === "new") {
      updates.d1 = null; updates.d2 = null; updates.d3 = null; updates.d4 = null;
      updates.done = [];
    }
    updatePipeline(tid, updates);
  }

  function onDragStart(e, tid) { e.dataTransfer.setData("text/plain", tid); e.dataTransfer.effectAllowed = "move"; }
  function onDragOver(e, sk) { e.preventDefault(); e.dataTransfer.dropEffect = "move"; setDragOver(sk); }
  function onDragLeave() { setDragOver(null); }
  function onDrop(e, sk) { e.preventDefault(); setDragOver(null); const tid = e.dataTransfer.getData("text/plain"); if (tid) changeStage(tid, sk); }

  function KCard({ t }) {
    const p = prospects ? prospects.find(x => x.id === t.prospect_id) : null;
    const int = intLabel(t.intention), last = lastAct(t), stage = effectiveStage(t), isOpen = menuOpen === t.id;
    return (
      <div className="kb-card" draggable onDragStart={e => onDragStart(e, t.id)} onClick={() => setSelected(t.prospect_id)}>
        <div className="kb-card-top">
          <div className="kb-hotel">{t.hotel}</div>
          <div style={{position:"relative",flexShrink:0,display:"flex",alignItems:"center",gap:3}}>
            {int && <span className={"int-tag " + int.cls}>{int.text}</span>}
            <button className="kb-menu-btn" onClick={e => { e.stopPropagation(); setMenuOpen(isOpen ? null : t.id); }}>{"\u22EE"}</button>
            {isOpen && <div className="kb-menu" onClick={e => e.stopPropagation()}>
              <div className="kb-menu-title">Move to</div>
              {STAGES.filter(s => s.key !== stage).map(s => <button key={s.key} className="kb-menu-item" onClick={() => changeStage(t.id, s.key)}><span className="kb-menu-dot" style={{background: s.color}}/>{s.label}</button>)}
            </div>}
          </div>
        </div>
        <div className="kb-city">{p?.city || "\u2014"}{p?.country && p.country !== "\u2014" ? ", " + p.country : ""}</div>
        <div className="kb-bottom"><span className="kb-last">{last}</span>{t.sdr && <span className="kb-sdr">{t.sdr}</span>}</div>
      </div>
    );
  }

  const tActive = filteredT.filter(t => !["won","lost","dead"].includes(effectiveStage(t))).length;
  const tDemo = (stageMap.demo||[]).length, tTrial = (stageMap.trial||[]).length;
  const tWon = (stageMap.won||[]).length, tLost = (stageMap.lost||[]).length;
  const conv = (tWon+tLost) > 0 ? Math.round(tWon/(tWon+tLost)*100) : 0;

  return (<>
    <div style={{display:"flex",gap:8,alignItems:"center",marginBottom:10,flexWrap:"wrap",padding:"12px 0 8px"}}>
      <input className="cmd-input" style={{minWidth:130,flexShrink:0}} placeholder={"\uD83D\uDD0D Search..."} value={outreachSearch} onChange={e=>setOutreachSearch(e.target.value)}/>
      <select className="cmd-input" style={{minWidth:90,flexShrink:0}} value={outreachCountry} onChange={e=>{setOutreachCountry(e.target.value);setOutreachCity("");}}>
        <option value="">All Countries</option>{allCountries.map(c=><option key={c} value={c}>{c}</option>)}
      </select>
      <select className="cmd-input" style={{width:130,flexShrink:0}} value={outreachGroup} onChange={e=>setOutreachGroup(e.target.value)}>
        <option value="">All Groups</option>{allGroups.map(g=><option key={g} value={g}>{g.length>20?g.slice(0,18)+"\u2026":g}</option>)}
      </select>
      <select className="cmd-input" style={{minWidth:100,flexShrink:0}} value={pipeStageFilter} onChange={e=>setPipeStageFilter(e.target.value)}>
        <option value="">All Stages</option>
        {STAGES.map(s=><option key={s.key} value={s.key}>{s.label}</option>)}
      </select>
      <button className="act-btn" style={{fontSize:11,flexShrink:0,background:pipeHasGM?"var(--accent)":"transparent",color:pipeHasGM?"white":"var(--text2)",border:pipeHasGM?"1px solid var(--accent)":"1px solid var(--border)",borderRadius:4,padding:"4px 8px"}} onClick={()=>setPipeHasGM(v=>!v)}>Has GM</button>
      <button className="act-btn" style={{fontSize:11,flexShrink:0,background:pipeHasEmail?"var(--accent)":"transparent",color:pipeHasEmail?"white":"var(--text2)",border:pipeHasEmail?"1px solid var(--accent)":"1px solid var(--border)",borderRadius:4,padding:"4px 8px"}} onClick={()=>setPipeHasEmail(v=>!v)}>Has Email</button>
      {hasActiveFilters && <button className="act-btn" style={{fontSize:11,flexShrink:0}} onClick={clearFilters}>{"\u2715"} Clear</button>}
      <div style={{marginLeft:"auto"}} className="view-toggle">
        <button className={"view-btn " + (outreachView==="card"?"active":"")} onClick={()=>setOutreachView("card")}>{"\u25A4"} Kanban</button>
        <button className={"view-btn " + (outreachView==="list"?"active":"")} onClick={()=>setOutreachView("list")}>{"\u2630"} List</button>
      </div>
    </div>
    <div className="pipeline-summary">
      <span>Active <strong>{tActive}</strong></span><span className="ps-sep">{"\u00B7"}</span>
      <span>Demo <strong>{tDemo}</strong></span><span className="ps-sep">{"\u00B7"}</span>
      <span>Trial <strong>{tTrial}</strong></span><span className="ps-sep">{"\u00B7"}</span>
      <span style={{color:"var(--green)"}}>Won <strong>{tWon}</strong></span><span className="ps-sep">{"\u00B7"}</span>
      <span style={{color:"var(--red)"}}>Lost <strong>{tLost}</strong></span><span className="ps-sep">{"\u00B7"}</span>
      <span>Conv <strong>{conv}%</strong></span>
    </div>
    {displayT.length === 0 ? (
      <div className="empty"><div className="empty-icon">{"\uD83D\uDD0D"}</div><div className="empty-title">No matches</div><button className="act-btn" style={{marginTop:8}} onClick={clearFilters}>{"\u2190"} Clear</button></div>
    ) : outreachView === "list" ? (
      <div className="table-card" style={{overflowX:"auto"}}><table className="outreach-list"><thead><tr>
        <th style={{width:"16%"}}>Hotel</th><th style={{width:"7%"}}>City</th><th style={{width:"8%"}}>Group</th><th style={{width:"12%"}}>Contact</th><th style={{width:"9%"}}>Stage</th><th style={{width:"9%"}}>Intent</th><th style={{width:"10%"}}>Last</th><th style={{width:"17%"}}>Notes</th><th style={{width:"8%"}}>Owner</th><th style={{width:"4%"}}></th>
      </tr></thead><tbody>
        {displayT.map(t => {
          const stage = effectiveStage(t), stg = STAGES.find(s=>s.key===stage)||STAGES[0];
          const p = prospects?prospects.find(x=>x.id===t.prospect_id):null, last = lastAct(t);
          return (<tr key={t.id}>
            <td style={{fontWeight:600,cursor:"pointer",color:"var(--text)",maxWidth:180,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}} onClick={()=>setSelected(t.prospect_id)}>{t.hotel}</td>
            <td style={{color:"var(--text3)",fontSize:11}}>{p?.city||"\u2014"}</td>
            <td style={{color:"var(--text3)",fontSize:11,maxWidth:80,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{p?.hotel_group||"\u2014"}</td>
            <td style={{color:"var(--text2)",fontSize:12}}>{t.gm||"\u2014"}</td>
            <td onClick={e=>e.stopPropagation()}>
              <select className="stage-select" value={stage} style={{color:stg.color,background:stg.bg}} onChange={e=>changeStage(t.id,e.target.value)}>
                {STAGES.map(s=><option key={s.key} value={s.key}>{s.label}</option>)}
              </select>
            </td>
            <td onClick={e=>e.stopPropagation()}>
              <select className="intent-select" value={t.intention||0} style={{color:IC[t.intention]||"var(--text3)"}} onChange={e=>updateIntention(t.id,parseInt(e.target.value))}>
                <option value={0}>{"\u2014"}</option>{[1,2,3,4,5].map(v=><option key={v} value={v}>{"\u25CF"} {v} {IL[v]}</option>)}
              </select>
            </td>
            <td style={{fontSize:11,color:"var(--text3)",whiteSpace:"nowrap"}}>{last}</td>
            <td onClick={e=>e.stopPropagation()}>
              {editingNote===t.id ? (<div style={{display:"flex",gap:3}}>
                <textarea className="note-input" value={noteText} onChange={e=>setNoteText(e.target.value)} autoFocus/>
                <div style={{display:"flex",flexDirection:"column",gap:2}}>
                  <button className="act-btn success" style={{fontSize:9,padding:"2px 4px"}} onClick={()=>saveNote(t.id)}>{"\u2713"}</button>
                  <button className="act-btn" style={{fontSize:9,padding:"2px 4px"}} onClick={()=>setEditingNote(null)}>{"\u2715"}</button>
                </div></div>
              ) : (<div className="notes-cell" onClick={()=>{setEditingNote(t.id);setNoteText(t.sales_notes||"");}}>{t.sales_notes||<span style={{color:"var(--border2)"}}>+</span>}</div>)}
            </td>
            <td><span className="kb-sdr">{t.sdr||"\u2014"}</span></td>
            <td onClick={e=>e.stopPropagation()}><button className="del-btn" onClick={()=>setDeleteConfirm(t.prospect_id)}>{"\uD83D\uDDD1"}</button></td>
          </tr>);
        })}
      </tbody></table></div>
    ) : (
      <div className="kanban-board">
        {STAGES.map(stg => {
          const cards = stageMap[stg.key]||[], isDrag = dragOver === stg.key;
          return (<div key={stg.key} className={"kanban-col"+(isDrag?" drag-over":"")} onDragOver={e=>onDragOver(e,stg.key)} onDragLeave={onDragLeave} onDrop={e=>onDrop(e,stg.key)}>
            <div className="kanban-col-header" style={{borderTopColor:stg.color}}>
              <span className="kanban-col-title">{stg.label}</span>
              <span className="kanban-col-count" style={{background:stg.bg,color:stg.color}}>{cards.length}</span>
            </div>
            <div className="kanban-col-body">
              {cards.length===0&&<div style={{padding:"16px 4px",textAlign:"center",color:"var(--text3)",fontSize:10,fontStyle:"italic"}}>Empty</div>}
              {cards.map(t=><KCard key={t.id} t={t}/>)}
            </div>
          </div>);
        })}
      </div>
    )}
  </>);
}
export default function App() {
  const [tab, setTab] = useState("dashboard");
  const [addHotelModal, setAddHotelModal] = useState(false);
  const [addHotelForm, setAddHotelForm] = useState({});
  const [ctExpanded, setCtExpanded] = useState(null);
  const [ctStageFilter, setCtStageFilter] = useState("");
  const [ctPriorityFilter, setCtPriorityFilter] = useState("");
  const [leadStatusFilter, setLeadStatusFilter] = useState(["Active"]);
  // Geo state
  const [region, setRegion] = useState("Europe");
  const [country, setCountry] = useState("Austria");
  const [cityInput, setCityInput] = useState("Vienna");
  const [customMarket, setCustomMarket] = useState("");
  const [multiMode, setMultiMode] = useState(false);
  // Other filters
  const [scope, setScope] = useState("chain");
  const [group, setGroup] = useState("");
  const [brand, setBrand] = useState("");
  const [minAdr, setMinAdr] = useState("150");
  const [count, setCount] = useState("8");
  const [sdrName, setSdrName] = useState("");
  // State
  const [running, setRunning] = useState(false);
  const [loading, setLoading] = useState(true);
  const [progress, setProgress] = useState(0);
  const [log, setLog] = useState("");
  const [error, setError] = useState(null);
  const [selected, setSelected] = useState(null);
  const [copied, setCopied] = useState(null);
  const [filterSdr, setFilterSdr] = useState("all");
  const [stageFilter, setStageFilter] = useState("all");
  const [filterCountry, setFilterCountry] = useState("");
  const [filterCity, setFilterCity] = useState("");
  const [filterGroup, setFilterGroup] = useState("");
  const [filterBrand, setFilterBrand] = useState("");
  const [filterSearch, setFilterSearch] = useState("");
  const [hotelsPage, setHotelsPage] = useState(1);
  const HOTELS_PER_PAGE = 20;
  const [prospects, setProspects] = useState([]);
  const [tracking, setTracking] = useState([]);
  const [rejectModal, setRejectModal] = useState(null); // { tid, stage: 'dead'|'reopen' }
  const [rejectReason, setRejectReason] = useState("");
  const [rejectOtherText, setRejectOtherText] = useState("");
  const [outreachView, setOutreachView] = useState("card");
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [dupGroups, setDupGroups] = useState(null);
  const [dupExpanded, setDupExpanded] = useState(new Set());
  const [cooldown, setCooldown] = useState(0); // seconds until next search allowed
  const lastBatchTime = useRef(0); // timestamp of last API batch completion
  const cooldownTimer = useRef(null);
  const [editingNote, setEditingNote] = useState(null);
  const [noteText, setNoteText] = useState("");
  const [filterProvider, setFilterProvider] = useState("");
  const [filterHasEmail, setFilterHasEmail] = useState(false);
  const [filterHasGM, setFilterHasGM] = useState(false);
  // Outreach tracker filters
  const [outreachSearch, setOutreachSearch] = useState("");
  const [outreachCountry, setOutreachCountry] = useState("");
  const [outreachCity, setOutreachCity] = useState("");
  const [outreachGroup, setOutreachGroup] = useState("");
  const [outreachTier, setOutreachTier] = useState("");
  const [outreachProvider, setOutreachProvider] = useState("");
  const [pipeStageFilter, setPipeStageFilter] = useState("");
  const [pipeHasGM, setPipeHasGM] = useState(false);
  const [pipeHasEmail, setPipeHasEmail] = useState(false);
  const [ctOwnerFilter, setCtOwnerFilter] = useState("");
  const [ctDueFilter, setCtDueFilter] = useState("");
  const [ctPriFilter, setCtPriFilter] = useState("");
  const [ctSortCol, setCtSortCol] = useState(null);
  const [ctSortDir, setCtSortDir] = useState("asc");
  const [ctPage, setCtPage] = useState(1);
  const CT_PER_PAGE = 20;
  const [selectedIds, setSelectedIds] = useState(new Set()); // batch select
  const [ctFocusMode, setCtFocusMode] = useState(true); // focus mode default on
  const [focusDoneIds, setFocusDoneIds] = useState(new Set()); // temporarily dismissed in focus
  const [sortCol, setSortCol] = useState(null); // "adr" | "rooms" | null
  const [sortDir, setSortDir] = useState("desc"); // "asc" | "desc"
  const [addContactDraft, setAddContactDraft] = useState({name:"",title:"",email:"",linkedin:"",phone:"",is_primary:false});
  // Multi-contact state: { [prospect_id]: [{id, name, title, email, linkedin, phone, is_primary}] }
  const [contacts, setContacts] = useState({});
  const [addContactForm, setAddContactForm] = useState(null); // prospect_id or null

  function toggleSort(col) {
    if (sortCol === col) { setSortDir(d => d === "asc" ? "desc" : "asc"); }
    else { setSortCol(col); setSortDir("desc"); }
    setHotelsPage(1);
  }

  async function deleteProspect(pid) {
    try {
      await sbFetch(`/tracking?prospect_id=eq.${pid}`, { method: "DELETE", prefer: "return=minimal" });
      await sbFetch(`/prospects?id=eq.${pid}`, { method: "DELETE", prefer: "return=minimal" });
      setProspects(prev => prev.filter(p => p.id !== pid));
      setTracking(prev => prev.filter(t => t.prospect_id !== pid));
      if (selected === pid) setSelected(null);
    } catch(e) { alert("Delete failed: " + e.message); }
    setDeleteConfirm(null);
  }

  async function saveNote(tid) {
    try {
      await sbFetch(`/tracking?id=eq.${tid}`, { method: "PATCH", prefer: "return=minimal", body: JSON.stringify({ sales_notes: noteText }) });
      setTracking(prev => prev.map(t => t.id === tid ? { ...t, sales_notes: noteText } : t));
    } catch(e) { console.error(e); }
    setEditingNote(null);
  }

  // ── Inline editing for prospect fields ──────────────────────────────
  async function updateProspectField(pid, field, value) {
    // Sanitize email values
    if (field === 'email' && value) {
      if (value.includes('[email') || value.includes('email protected') || value.includes('email\u00a0protected')) {
        value = null;
      }
    }
    // Coerce numeric fields
    if (['rooms', 'restaurants', 'review_count'].includes(field)) {
      value = value ? parseInt(value) || null : null;
    }
    if (['adr_usd', 'rating'].includes(field)) {
      value = value ? parseFloat(value) || null : null;
    }
    const patch = { [field]: value || null };
    // If updating gm_name, auto-update gm_first_name
    if (field === 'gm_name' && value) {
      patch.gm_first_name = value.split(' ')[0];
    }
    // Also sync tracking table if updating gm or email
    if (field === 'gm_name' || field === 'email') {
      const t = tracking.find(x => x.prospect_id === pid);
      if (t) {
        const tPatch = field === 'gm_name' ? { gm: value } : { email: value };
        setTracking(prev => prev.map(x => x.prospect_id === pid ? { ...x, ...tPatch } : x));
        try { await sbFetch(`/tracking?prospect_id=eq.${pid}`, { method: "PATCH", prefer: "return=minimal", body: JSON.stringify(tPatch) }); } catch(e) { console.error(e); }
      }
    }
    setProspects(prev => prev.map(p => p.id === pid ? { ...p, ...patch } : p));
    try { await sbFetch(`/prospects?id=eq.${pid}`, { method: "PATCH", prefer: "return=minimal", body: JSON.stringify(patch) }); } catch(e) { console.error(e); }
  }

  // ── Multi-contact helpers ────────────────────────────────────────────────────
  // Contacts stored in prospects.research_notes as JSON block at top, prefixed with <!--contacts:
  function parseContacts(pid) {
    if (contacts[pid]) return contacts[pid];
    const p = prospects.find(x => x.id === pid);
    if (!p) return [];
    const match = (p.research_notes || "").match(/<!--contacts:(.*?)-->/s);
    if (match) { try { return JSON.parse(match[1]); } catch { return []; } }
    // Bootstrap from existing primary contact fields
    if (p.gm_name || p.email) {
      return [{ id: uid(), name: p.gm_name || "", title: p.gm_title || "General Manager", email: p.email || "", linkedin: p.linkedin || "", phone: "", is_primary: true }];
    }
    return [];
  }

  function serializeContacts(list) {
    return `<!--contacts:${JSON.stringify(list)}-->`;
  }

  async function saveContacts(pid, list) {
    setContacts(prev => ({ ...prev, [pid]: list }));
    const p = prospects.find(x => x.id === pid);
    const existingNotes = (p?.research_notes || "").replace(/<!--contacts:.*?-->/s, "").trim();
    const newNotes = serializeContacts(list) + (existingNotes ? "\n" + existingNotes : "");
    // Sync primary contact back to main fields
    const primary = list.find(c => c.is_primary) || list[0];
    const patch = { research_notes: newNotes };
    if (primary) {
      patch.gm_name = primary.name || null;
      patch.gm_first_name = primary.name ? primary.name.split(" ")[0] : null;
      patch.gm_title = primary.title || null;
      patch.email = primary.email || null;
      patch.linkedin = primary.linkedin || null;
    }
    setProspects(prev => prev.map(x => x.id === pid ? { ...x, ...patch } : x));
    try { await sbFetch(`/prospects?id=eq.${pid}`, { method: "PATCH", prefer: "return=minimal", body: JSON.stringify(patch) }); } catch(e) { console.error(e); }
    // Sync tracking primary
    if (primary) {
      const tPatch = { gm: primary.name || null, email: primary.email || null };
      setTracking(prev => prev.map(x => x.prospect_id === pid ? { ...x, ...tPatch } : x));
      try { await sbFetch(`/tracking?prospect_id=eq.${pid}`, { method: "PATCH", prefer: "return=minimal", body: JSON.stringify(tPatch) }); } catch(e) { console.error(e); }
    }
  }

  useEffect(() => {
    const n = localStorage.getItem("wtk_sdr_name"); if (n) setSdrName(n);
    loadData();
  }, []);

  async function loadData() {
    setLoading(true);
    try {
      // Load all records in parallel pages (Supabase max 1000/request)
      async function loadAll(path) {
        const all = [];
        let offset = 0;
        const PAGE = 1000;
        while (true) {
          const page = await sbFetch(`${path}&limit=${PAGE}&offset=${offset}`);
          if (!page || !page.length) break;
          all.push(...page);
          if (page.length < PAGE) break;
          offset += PAGE;
        }
        return all;
      }
      const [p, t] = await Promise.all([
        loadAll("/prospects?order=created_at.desc"),
        loadAll("/tracking?order=created_at.desc")
      ]);
      setProspects(p || []); setTracking(t || []);
    } catch (e) { console.error(e); }
    setLoading(false);
  }

  function saveSdrName(v) { setSdrName(v); localStorage.setItem("wtk_sdr_name", v); }

  // Compute market string from geo selections
  function getMarket() {
    if (multiMode && customMarket.trim()) return customMarket.trim();
    if (cityInput.trim()) return `${cityInput.trim()}${country ? ", " + country : ""}${region ? ", " + region : ""}`;
    if (country) return `${country}${region ? ", " + region : ""}`;
    if (region) return region;
    return "Global";
  }

  // ── Cooldown timer: 15s between verify batches (Claude Haiku rate limit) ────
  const COOLDOWN_SEC = 15;

  function startCooldown() {
    lastBatchTime.current = Date.now();
    if (cooldownTimer.current) clearInterval(cooldownTimer.current);
    setCooldown(COOLDOWN_SEC);
    cooldownTimer.current = setInterval(() => {
      const elapsed = Math.floor((Date.now() - lastBatchTime.current) / 1000);
      const remaining = Math.max(0, COOLDOWN_SEC - elapsed);
      setCooldown(remaining);
      if (remaining <= 0) { clearInterval(cooldownTimer.current); cooldownTimer.current = null; }
    }, 1000);
  }

  async function run() {
    // Auto-wait if cooldown from previous search is still active
    const elapsed = Math.floor((Date.now() - lastBatchTime.current) / 1000);
    const remaining = Math.max(0, COOLDOWN_SEC - elapsed);
    if (remaining > 0 && lastBatchTime.current > 0) {
      setRunning(true); setError(null);
      for (let s = remaining; s > 0; s--) {
        setLog(`Cooling down — ${s}s remaining...`);
        setCooldown(s);
        await new Promise(r => setTimeout(r, 1000));
      }
      setCooldown(0);
    }

    setRunning(true); setError(null); setProgress(5);
    const market = getMarket();
    const n = Math.min(Math.max(parseInt(count) || 8, 1), 8);

    const normKey = (name, city) => `${(name||"").toLowerCase().replace(/[^a-z0-9]/g,"")}::${(city||"").toLowerCase().replace(/[^a-z0-9]/g,"")}`;
    const existingKeys = new Set(prospects.map(p => normKey(p.hotel_name, p.city)));

    const PROSPECT_FIELDS = ["id","hotel_name","brand","hotel_group","tier","city","country","address","website","rooms","restaurants","adr_usd","rating","review_count","current_provider","gm_name","gm_first_name","gm_title","email","linkedin","phone","email_source","contact_confidence","outreach_email_subject","outreach_email_body","linkedin_dm","engagement_strategy","strategy_reason","research_notes","sdr","batch","created_at"];
    const sdr = sdrName || "Unknown";
    const batchLabel = `${market} · ${fmtDateShort(new Date())}`;
    const sleep = ms => new Promise(r => setTimeout(r, ms));

    async function rateLimitWait(seconds) {
      for (let s = seconds; s > 0; s--) {
        setLog(`Cooling down — ${s}s before next batch...`);
        setCooldown(s);
        await sleep(1000);
      }
      setCooldown(0);
    }

    async function apiFetch(body, attempt = 0) {
      const r = await fetch("/api/research", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body)
      });
      const data = await r.json();
      // Backend now returns rateLimited/overloaded as explicit flags
      const isRateLimit = data?.rateLimited || (data?.error && data.error.toLowerCase().includes("rate limit"));
      const isOverloaded = data?.overloaded || (data?.error && data.error.toLowerCase().includes("overloaded"));
      if (isRateLimit) {
        if (attempt >= 1) return { ...data, rateLimited: true };
        startCooldown();
        await rateLimitWait(62);
        return apiFetch(body, attempt + 1);
      }
      if (isOverloaded) {
        if (attempt >= 1) return { ...data, overloaded: true, error: data.error || "API overloaded" };
        setLog("API overloaded — waiting 30s before retry...");
        await rateLimitWait(30);
        return apiFetch(body, attempt + 1);
      }
      return data;
    }

    try {
      // ═══════════════════════════════════════════════════════════════════
      // STEP 1: LIST — get hotel names (no web search, instant, ~$0.001)
      // ═══════════════════════════════════════════════════════════════════
      setProgress(10);
      setLog("Step 1: Building hotel list from knowledge base...");

      const listData = await apiFetch({
        mode: "list", city: market, brand, group, scope, minAdr,
        region: region || "", country: country || ""
      });

      if (listData?.error) {
        if (listData.rateLimited) { setError("Rate limit hit — wait and try again."); return; }
        if (listData.overloaded) { setError("API overloaded — wait 30s and try again."); return; }
        setError("List step failed: " + listData.error);
        return;
      }
      if (listData?.debug) setLog(`Backend: ${listData.debug}`);

      const allKnown = parseJSON(listData.result).filter(h => h.hotel_name && h.hotel_name.trim());

      // ── Geographic safety filter: remove results outside selected region/country ──
      const regionCountries = region ? new Set(Object.keys(GEO[region] || {}).map(c => c.toLowerCase())) : null;
      const selectedCountryLower = country ? country.toLowerCase() : null;
      const geoFiltered = allKnown.filter(h => {
        if (!h.country) return false; // no country = discard (backend v9.1 already strips these, this is safety net)
        const hCountry = (h.country || "").toLowerCase();
        // If a specific country was selected, enforce it
        if (selectedCountryLower && hCountry !== selectedCountryLower) return false;
        // If only region selected, enforce region membership
        if (!selectedCountryLower && regionCountries && !regionCountries.has(hCountry)) return false;
        return true;
      });
      const geoDropped = allKnown.length - geoFiltered.length;
      if (geoDropped > 0) setLog(`Filtered out ${geoDropped} hotels outside ${country || region || "target region"}`);

      if (!geoFiltered.length) {
        setError("No hotels found in knowledge base. Try a different brand or market.");
        setProgress(100);
        return;
      }

      // Filter out hotels already in DB
      const newHotels = geoFiltered.filter(h => !existingKeys.has(normKey(h.hotel_name, h.city)));
      const dupeCount = allKnown.length - newHotels.length;

      // Take only up to requested count
      const toVerify = newHotels.slice(0, n);

      setLog(`Found ${geoFiltered.length} hotels in ${country || region || "target"} · ${dupeCount} already in DB · ${toVerify.length} to verify${geoDropped > 0 ? ` · ${geoDropped} outside region removed` : ""}`);
      setProgress(20);

      if (toVerify.length === 0) {
        setLog(`All ${geoFiltered.length} known hotels already in database. ${geoFiltered.length < 50 ? "This may not be the complete list — the model only knows hotels from its training data." : ""}`);
        setProgress(100);
        setTab("hotels");
        return;
      }

      // ═══════════════════════════════════════════════════════════════════
      // STEP 2: VERIFY — web search for rooms + GM (batches of 10)
      // ═══════════════════════════════════════════════════════════════════
      const BATCH_SIZE = 5; // 5×2=10 searches, leaves margin in 20 budget for retries
      const batches = [];
      for (let i = 0; i < toVerify.length; i += BATCH_SIZE) {
        batches.push(toVerify.slice(i, i + BATCH_SIZE));
      }

      let allFresh = [];
      let totalErrors = 0;
      let rateLimitHit = false;

      for (let i = 0; i < batches.length; i++) {
        const batchHotels = batches[i];
        const pct = Math.round(20 + (i / batches.length) * 70);
        setProgress(pct);
        setLog(`Step 2: Verifying batch ${i + 1}/${batches.length} (${batchHotels.length} hotels)${allFresh.length ? ` · ${allFresh.length} saved so far` : ""}...`);

        // Inter-batch cooldown — 15s between verify calls
        if (i > 0) {
          await rateLimitWait(15);
        }

        const data = await apiFetch({ mode: "verify", hotels: batchHotels, brand, group });

        if (data?.rateLimited || data?.overloaded) {
          rateLimitHit = true;
          startCooldown();
          setError(`${data.rateLimited ? "Rate limit" : "API overloaded"} after batch ${i + 1}. ${allFresh.length} hotels saved. Wait and run again.`);
          break;
        }

        if (data?.error) {
          totalErrors++;
          setError("Verify error: " + data.error);
          if (allFresh.length === 0 && i === 0) break;
          continue;
        }

        const raw = parseJSON(data.result);
        
        // If verify returned no usable data, skip this batch entirely — don't save garbage
        if (!raw.length) {
          const debugInfo = data.debug || (data.result || "").slice(0, 300);
          setLog(`⚠ Verify failed for batch ${i + 1} — skipping (won't save unverified data). ${debugInfo ? "Debug: " + debugInfo.slice(0,100) : ""}`);
          totalErrors++;
          continue;
        }

        const hotelsToSave = raw;

        // Save this batch immediately — skip entries without hotel_name
        const batchFresh = [];
        for (const p of hotelsToSave) {
          if (!p.hotel_name || !p.hotel_name.trim()) continue; // skip empty entries
          const key = normKey(p.hotel_name, p.city);
          if (existingKeys.has(key)) continue;
          batchFresh.push(p);
          existingKeys.add(key);
        }

        if (batchFresh.length > 0) {
          const enriched = batchFresh.map(p => {
            const base = { ...p, id: uid(), created_at: new Date().toISOString(), batch: batchLabel, sdr };
            const safe = {};
            PROSPECT_FIELDS.forEach(k => { if (base[k] !== undefined) safe[k] = base[k]; });
            return safe;
          });
          const newT = enriched.map(p => ({ id: uid(), prospect_id: p.id, hotel: p.hotel_name, gm: p.gm_name, email: p.email, done: [], sdr, created_at: new Date().toISOString() }));

          try {
            await sbFetch("/prospects", { method: "POST", prefer: "return=minimal", body: JSON.stringify(enriched) });
            await sbFetch("/tracking", { method: "POST", prefer: "return=minimal", body: JSON.stringify(newT) });
          } catch (e) { console.error("Batch save error:", e); }

          setProspects(prev => [...enriched, ...prev]);
          setTracking(prev => [...newT, ...prev]);
          allFresh.push(...enriched);
          startCooldown();

          setLog(`✓ ${allFresh.length} hotels verified & saved${i < batches.length - 1 ? ` · batch ${i + 2} next...` : ""}`);
        }
      }

      // Final summary
      const dupeNote = dupeCount > 0 ? ` · ${dupeCount} already in DB` : "";
      const errNote = totalErrors > 0 ? ` · ${totalErrors} batch(es) failed` : "";
      const rlNote = rateLimitHit ? ` · rate limited, ${toVerify.length - allFresh.length} remaining` : "";
      if (allFresh.length > 0) {
        setLog(`Done — ${allFresh.length} new hotels saved${dupeNote}${errNote}${rlNote}`);
      } else if (!rateLimitHit) {
        setLog(`No new hotels verified${dupeNote}. Try a different market.`);
      }
      setProgress(100);
      setTab("hotels");
    } catch (err) { setError(err.message); }
    finally { setRunning(false); setTimeout(() => setProgress(0), 3000); }
  }

  async function touchToggle(tid, n, e) {
    if (e) e.stopPropagation();
    const t = tracking.find(x => x.id === tid); if (!t) return;
    const stage = t.pipeline_stage || "active";
    if (stage === "dead" || stage === "won") return;
    // Lock: can't click n if n-1 not done
    const done = [...parseDone(t.done)];
    if (n > 1 && !done.includes(n - 1)) return;
    const i = done.indexOf(n);
    if (i < 0) done.push(n); else done.splice(i, 1);
    done.sort((a, b) => a - b);
    const upd = { done };
    if (n === 1 && i < 0 && !t.d1) upd.d1 = new Date().toISOString();
    if (n === 2 && i < 0) upd.d2 = new Date().toISOString();
    if (n === 3 && i < 0) upd.d3 = new Date().toISOString();
    if (n === 4 && i < 0) upd.d4 = new Date().toISOString();
    setTracking(prev => prev.map(x => x.id === tid ? { ...x, ...upd } : x));
    try { await sbFetch(`/tracking?id=eq.${tid}`, { method: "PATCH", prefer: "return=minimal", body: JSON.stringify(upd) }); } catch (e) { console.error(e); }
  }

  async function updatePipeline(tid, updates, e) {
    if (e) e.stopPropagation();
    setTracking(prev => prev.map(x => x.id === tid ? { ...x, ...updates } : x));
    try { await sbFetch(`/tracking?id=eq.${tid}`, { method: "PATCH", prefer: "return=minimal", body: JSON.stringify(updates) }); } catch (e) { console.error(e); }
  }

  async function updateProspect(pid, updates) {
    setProspects(prev => prev.map(p => p.id === pid ? { ...p, ...updates } : p));
    try { await sbFetch(`/prospects?id=eq.${pid}`, { method: "PATCH", prefer: "return=minimal", body: JSON.stringify(updates) }); } catch (e) { console.error("updateProspect:", e); }
  }

  function openRejectModal(tid, stage, e) {
    if (e) e.stopPropagation();
    setRejectReason("");
    setRejectOtherText("");
    setRejectModal({ tid, stage });
  }

  async function confirmReject() {
    if (!rejectModal) return;
    const stageVal = rejectModal.stage === "dead" ? "lost" : rejectModal.stage;
    const reason = rejectReason === "Other" && rejectOtherText ? "Other: " + rejectOtherText.trim() : (rejectReason || "Not specified");
    const updates = { pipeline_stage: stageVal, rejection_reason: reason };
    await updatePipeline(rejectModal.tid, updates);
    setRejectModal(null);
    setRejectOtherText("");
  }

  async function reopenSequence(tid, e) {
    if (e) e.stopPropagation();
    const upd = { pipeline_stage: "new", rejection_reason: null };
    setTracking(prev => prev.map(x => x.id === tid ? { ...x, ...upd } : x));
    try { await sbFetch(`/tracking?id=eq.${tid}`, { method: "PATCH", prefer: "return=minimal", body: JSON.stringify(upd) }); } catch (e) { console.error(e); }
  }

  async function updateIntention(tid, val) {
    const t = tracking.find(x => x.id === tid);
    // Toggle off if clicking same value
    const newVal = (t?.intention || 0) === val ? 0 : val;
    setTracking(prev => prev.map(x => x.id === tid ? { ...x, intention: newVal } : x));
    try { await sbFetch(`/tracking?id=eq.${tid}`, { method: "PATCH", prefer: "return=minimal", body: JSON.stringify({ intention: newVal }) }); } catch (e) { console.error(e); }
  }


  function copy(text, key) { navigator.clipboard.writeText(text).then(() => { setCopied(key); setTimeout(() => setCopied(null), 1500); }); }

  async function saveManualHotel() {
    console.log("saveManualHotel called", addHotelForm);
    const f = addHotelForm;
    if (!f.hotel_name || !f.hotel_name.trim()) { alert("Hotel name is required"); return; }
    const record = {
      id: uid(), hotel_name: f.hotel_name.trim(), city: f.city?.trim() || null, country: f.country?.trim() || null,
      hotel_group: f.hotel_group?.trim() || null, brand: f.brand?.trim() || null,
      address: f.address?.trim() || null, website: f.website?.trim() || null,
      adr_usd: f.adr_usd ? Number(f.adr_usd) : null, rooms: f.rooms ? Number(f.rooms) : null,
      current_provider: f.current_provider || null,
      gm_name: f.gm_name?.trim() || null,
      gm_first_name: f.gm_name?.trim() ? f.gm_name.trim().split(" ")[0] : null,
      gm_title: f.gm_title?.trim() || null,
      email: f.email?.trim() || null,
      linkedin: f.linkedin?.trim() || null,
      management_company: f.management_company?.trim() || null,
      operating_model: f.operating_model || null,
      research_notes: f.notes?.trim() || "Manually added",
      sdr: sdrName || "Unknown", batch: "manual-" + new Date().toISOString().slice(0,10),
    };
    try {
      const res = await fetch(`${SUPABASE_URL}/rest/v1/prospects`, {
        method: "POST",
        headers: { "apikey": SUPABASE_KEY, "Authorization": `Bearer ${SUPABASE_KEY}`, "Content-Type": "application/json", "Prefer": "return=representation" },
        body: JSON.stringify(record)
      });
      if (!res.ok) { const e = await res.text(); alert("Save failed: " + e); return; }
      const resp = await res.json();
      if (resp && resp.length > 0) {
        setProspects(prev => [...prev, resp[0]]);
        // Auto-create tracking entry
        const tRes = await fetch(`${SUPABASE_URL}/rest/v1/tracking`, {
          method: "POST",
          headers: { "apikey": SUPABASE_KEY, "Authorization": `Bearer ${SUPABASE_KEY}`, "Content-Type": "application/json", "Prefer": "return=representation" },
          body: JSON.stringify({ id: uid(), prospect_id: resp[0].id, hotel: resp[0].hotel_name, gm: resp[0].gm_name || null, sdr: sdrName || "Unknown", pipeline_stage: "new", done: [], intention: 0 })
        });
        if (tRes.ok) { const tData = await tRes.json(); if (tData?.length > 0) setTracking(prev => [...prev, tData[0]]); }
      }
      setAddHotelModal(false); setAddHotelForm({});
    } catch (err) { console.error("Save hotel error:", err); alert("Error: " + err.message); }
  }

  function exportCSV() {
    const h = ["Hotel","Brand","Tier","City","Country","Rooms","F&B","ADR USD","Rating","Reviews","Contact","Title","Email","LinkedIn","Confidence","Strategy","Provider","SDR","Batch","Added"];
    const rows = filteredP.map(p => [p.hotel_name,p.brand,p.tier,p.city,p.country,p.rooms||"",p.restaurants||"",p.adr_usd||"",p.rating||"",p.review_count||"",p.gm_name||"",p.gm_title||"",p.email||"",p.linkedin||"",p.contact_confidence||"",p.engagement_strategy||"",p.current_provider||"",p.sdr||"",p.batch||"",fmtDateShort(p.created_at)]);
    const csv = [h,...rows].map(r => r.map(v => `"${String(v).replace(/"/g,'""')}"`).join(",")).join("\n");
    const a = document.createElement("a"); a.href = URL.createObjectURL(new Blob([csv],{type:"text/csv"})); a.download = `WTK_SDR_${new Date().toISOString().slice(0,10)}.csv`; a.click();
  }

  async function importCSV(e) {
    const file = e.target.files[0];
    if (!file) return;
    e.target.value = "";

    let lines;
    const isExcel = file.name.endsWith('.xlsx') || file.name.endsWith('.xls');

    if (isExcel) {
      // Parse Excel using SheetJS (available as global XLSX from CDN)
      try {
        const ab = await file.arrayBuffer();
        const mod = await import('https://cdn.sheetjs.com/xlsx-0.20.3/package/xlsx.mjs');
        const wb = mod.read(ab, { type: 'array' });
        const ws = wb.Sheets[wb.SheetNames[0]];
        const csv = mod.utils.sheet_to_csv(ws);
        lines = csv.split(/\r?\n/).filter(Boolean);
      } catch (err) {
        return alert("Failed to parse Excel file: " + err.message);
      }
    } else {
      let text = await file.text();
      if (text.charCodeAt(0) === 0xFEFF) text = text.slice(1);
      lines = text.split(/\r?\n/).filter(Boolean);
    }
    if (lines.length < 2) return alert("CSV appears empty.");

    function parseRow(line) {
      const cols = []; let cur = "", inQ = false;
      for (let i = 0; i < line.length; i++) {
        const c = line[i];
        if (c === '"') { if (inQ && line[i+1] === '"') { cur += '"'; i++; } else inQ = !inQ; }
        else if (c === ',' && !inQ) { cols.push(cur); cur = ""; }
        else cur += c;
      }
      cols.push(cur); return cols.map(s => s.trim());
    }

    const DB_FIELDS = ["id","hotel_name","brand","hotel_group","tier","city","country","address","website","rooms","restaurants","adr_usd","rating","review_count","current_provider","gm_name","gm_first_name","gm_title","email","linkedin","phone","email_source","contact_confidence","outreach_email_subject","outreach_email_body","linkedin_dm","engagement_strategy","strategy_reason","research_notes","sdr","batch","created_at","lead_status","management_company","operating_model","operating_model_note"];
    const headers = parseRow(lines[0]).map(h => h.toLowerCase().trim());
    const isDirectMode = DB_FIELDS.filter(f => headers.includes(f)).length >= 5;

    function col(row, ...names) {
      for (const n of names) {
        const idx = headers.findIndex(h => h.includes(n));
        if (idx >= 0 && row[idx] && row[idx].trim()) return row[idx].trim();
      }
      return null;
    }
    function direct(row, field) {
      const idx = headers.indexOf(field);
      if (idx >= 0 && row[idx] && row[idx].trim() && row[idx].trim() !== 'None') return row[idx].trim();
      return null;
    }
    function num(v) { const n = parseFloat(v); return isNaN(n) ? null : n; }
    function inte(v) { const n = parseInt(v); return isNaN(n) ? null : n; }

    const imported = [];
    for (const line of lines.slice(1)) {
      const row = parseRow(line);
      if (!row.some(Boolean)) continue;

      let p;
      if (isDirectMode) {
        // CSV has exact DB field names — map directly
        const hotelName = direct(row, "hotel_name");
        if (!hotelName) continue;
        p = { id: direct(row,"id") || uid(), created_at: direct(row,"created_at") || new Date().toISOString() };
        for (const f of DB_FIELDS) {
          if (f === "id" || f === "created_at") continue;
          p[f] = direct(row, f);
        }
        // Coerce numeric fields
        p.rooms = inte(p.rooms);
        p.restaurants = inte(p.restaurants);
        p.adr_usd = num(p.adr_usd);
        p.rating = num(p.rating);
        p.review_count = inte(p.review_count);
        if (!p.current_provider && p.brand) p.current_provider = inferProvider(p.brand, p.hotel_name);
        if (!p.gm_first_name && p.gm_name) p.gm_first_name = p.gm_name.split(" ")[0];
      } else {
        // Generic flexible mapping
        const hotelName = col(row, "hotel","property","name");
        if (!hotelName) continue;
        const brand = col(row, "brand");
        p = {
          id: uid(), created_at: new Date().toISOString(), batch: "import",
          hotel_name: hotelName, brand: brand || null,
          hotel_group: col(row, "group","chain","company") || brand || null,
          tier: col(row, "tier","segment","category") || "Luxury",
          city: col(row, "city","location"), country: col(row, "country"),
          address: col(row, "address"), website: col(row, "website","url","web"),
          rooms: inte(col(row, "room","rooms")), restaurants: inte(col(row, "f&b","restaurant")),
          adr_usd: num(col(row, "adr","rate","price")), rating: num(col(row, "rating","score")),
          review_count: inte(col(row, "review")),
          gm_name: col(row, "gm","general manager","contact"),
          gm_first_name: null, gm_title: col(row, "title","position") || "General Manager",
          email: col(row, "email","mail"), linkedin: col(row, "linkedin"),
          current_provider: col(row, "provider","platform","tech") || inferProvider(brand, hotelName),
          engagement_strategy: col(row, "strategy","engagement") || "DIRECT-TO-GM",
          sdr: col(row, "sdr","owner","assigned") || sdrName || "Unknown",
          outreach_email_subject: null, outreach_email_body: null, linkedin_dm: null,
          research_notes: null, contact_confidence: "L",
        };
        if (p.gm_name) p.gm_first_name = p.gm_name.split(" ")[0];
      }
      imported.push(p);
    }

    if (!imported.length) return alert("No valid rows found.");
    if (!confirm(`Import ${imported.length} hotels? (Mode: ${isDirectMode ? "Direct field match" : "Flexible mapping"})`)) return;

    try {
      // Supabase has 1000 row insert limit — chunk it
      const CHUNK = 500;
      for (let i = 0; i < imported.length; i += CHUNK) {
        await sbFetch("/prospects", { method: "POST", prefer: "return=minimal", body: JSON.stringify(imported.slice(i, i+CHUNK)) });
      }
      // Create tracking records so Pipeline + Contact Tracker show these hotels
      // Skip hotels that already have tracking records (e.g. re-import)
      const existingPids = new Set(tracking.map(t => t.prospect_id));
      const needTracking = imported.filter(p => !existingPids.has(p.id));
      const newTracking = needTracking.map(p => ({
        id: uid(),
        prospect_id: p.id,
        hotel: p.hotel_name,
        gm: p.gm_name || null,
        email: p.email || null,   // stored independently — email valid even if no GM name
        sdr: p.sdr || sdrName || "Unknown",
        pipeline_stage: "new",
        done: [],
        created_at: p.created_at || new Date().toISOString(),
      }));
      if (newTracking.length > 0) {
        for (let i = 0; i < newTracking.length; i += CHUNK) {
          await sbFetch("/tracking", { method: "POST", prefer: "return=minimal", body: JSON.stringify(newTracking.slice(i, i+CHUNK)) });
        }
      }
      setProspects(prev => [...prev, ...imported]);
      setTracking(prev => [...prev, ...newTracking]);
      alert(`✓ ${imported.length} hotels imported with pipeline tracking.`);
    } catch(err) {
      alert("Import failed: " + err.message);
    }
  }

  const sel = selected ? prospects.find(p => p.id === selected) : null;
  const sdrs = ["all", ...new Set(prospects.map(p => p.sdr).filter(Boolean))];
  const filteredP = prospects.filter(p => {
    if (leadStatusFilter.length > 0 && !leadStatusFilter.includes(p.lead_status || "Active")) return false;
    if (filterSdr !== "all" && p.sdr !== filterSdr) return false;
    if (filterCountry && (p.country||"") !== filterCountry) return false;
    if (filterCity && (p.city||"") !== filterCity) return false;
    if (filterGroup && normalizeGroup(p.hotel_group||p.brand||"") !== filterGroup) return false;
    if (filterBrand && normalizeBrand(p.brand) !== filterBrand) return false;
    if (filterProvider) {
      const prov = getProvider(p) || "Unknown";
      if (prov !== filterProvider) return false;
    }
    if (filterHasEmail && !p.email) return false;
    if (filterHasGM && !p.gm_name) return false;
    if (filterSearch) {
      const q = normalizeSearch(filterSearch);
      if (!normalizeSearch(p.hotel_name).includes(q) && !normalizeSearch(p.gm_name).includes(q) && !normalizeSearch(p.city).includes(q)) return false;
    }
    return true;
  });
  // Sort if active — nulls always at bottom
  const sortedP = sortCol ? [...filteredP].sort((a, b) => {
    const va = sortCol === "adr" ? (a.adr_usd||null) : sortCol === "rooms" ? (a.rooms||null) : null;
    const vb = sortCol === "adr" ? (b.adr_usd||null) : sortCol === "rooms" ? (b.rooms||null) : null;
    if (va == null && vb == null) return 0;
    if (va == null) return 1;
    if (vb == null) return -1;
    return sortDir === "asc" ? va - vb : vb - va;
  }) : filteredP;
  const filteredT = tracking.filter(t => {
    if (filterSdr !== "all" && t.sdr !== filterSdr) return false;
    const p = prospects.find(x => x.id === t.prospect_id);
    if (leadStatusFilter.length > 0 && !leadStatusFilter.includes(p?.lead_status || "Active")) return false;
    if (outreachSearch) {
      const q = normalizeSearch(outreachSearch);
      if (!normalizeSearch(t.hotel).includes(q) && !normalizeSearch(t.gm).includes(q)) return false;
    }
    if (outreachCountry && (p?.country||"") !== outreachCountry) return false;
    if (outreachCity && (p?.city||"") !== outreachCity) return false;
    if (outreachGroup && normalizeGroup(p?.hotel_group||p?.brand||"") !== outreachGroup) return false;
    if (outreachTier && p?.brand !== outreachTier) return false;
    if (outreachProvider) {
      const prov = p ? (getProvider(p) || "Unknown") : "Unknown";
      if (prov !== outreachProvider) return false;
    }
    if (pipeHasGM && !t.gm) return false;
    if (pipeHasEmail && !t.email) return false;
    return true;
  });
  const contacted = tracking.filter(t => (t.done || []).length > 0).length;
  const totalHotelPages = Math.ceil(sortedP.length / HOTELS_PER_PAGE);
  const pagedP = sortedP.slice((hotelsPage-1)*HOTELS_PER_PAGE, hotelsPage*HOTELS_PER_PAGE);
  const allCountries = [...new Set(prospects.map(p=>p.country).filter(Boolean))].sort();
  const allCities = filterCountry ? [...new Set(prospects.filter(p=>p.country===filterCountry).map(p=>p.city).filter(Boolean))].sort() : [...new Set(prospects.map(p=>p.city).filter(Boolean))].sort();
  const allGroups = [...new Set(prospects.map(p=>normalizeGroup(p.hotel_group||p.brand)).filter(Boolean))].sort();
  const allBrands = [...new Set(prospects.map(p=>normalizeBrand(p.brand)).filter(Boolean))].sort();
  const allProviders = [...new Set(prospects.map(p=>getProvider(p)||"Unknown"))].sort();
  const countries = region ? Object.keys(GEO[region] || {}) : [];
  const cities = region && country ? (GEO[region] || {})[country] || [] : [];
  const chainGroups = Object.keys(CHAIN_BRANDS).sort();
  const brandOptions = group ? (CHAIN_BRANDS[group] || []) : [];

  return (
    <>
      <style>{css}</style>
      <div className="app">
        <nav className="topnav">
          <div className="nav-left">
            <div className="wtk-icon">W</div>
            <span className="nav-brand">Where to know</span>
            <div className="nav-sep"/>
            <span className="nav-page">SDR Intelligence</span>
          </div>
          <div className="nav-stats">
            <div className="nav-stat"><span className="nav-stat-n">{prospects.length}</span><span className="nav-stat-l">Prospects</span></div>
            <div className="nav-stat"><span className="nav-stat-n">{prospects.filter(p=>p.email).length}</span><span className="nav-stat-l">Emails</span></div>
            <div className="nav-stat"><span className="nav-stat-n">{contacted}</span><span className="nav-stat-l">Contacted</span></div>
          </div>
        </nav>

        <div className="main">
          <div className="cmd-panel">
            <div className="cmd-inline">
              {!multiMode ? (
                <div className="cmd-geo">
                  <select value={region} onChange={e=>{setRegion(e.target.value);setCountry("");setCityInput("");}} title="Region" className="cmd-input">
                    <option value="">Global</option>
                    {Object.keys(GEO).map(r=><option key={r}>{r}</option>)}
                  </select>
                  <select value={country} onChange={e=>{setCountry(e.target.value);setCityInput((GEO[region]||{})[e.target.value]?.[0]||"")}} title="Country" className="cmd-input" disabled={!region}>
                    <option value="">All Countries</option>
                    {countries.map(c=><option key={c}>{c}</option>)}
                  </select>
                  <select value={cityInput} onChange={e=>setCityInput(e.target.value)} title="City" className="cmd-input">
                    <option value="">All cities</option>
                    {cities.map(c=><option key={c}>{c}</option>)}
                  </select>
                  <button className="cmd-link" onClick={()=>setMultiMode(true)}>custom ▾</button>
                </div>
              ) : (
                <div className="cmd-geo">
                  <input value={customMarket} onChange={e=>setCustomMarket(e.target.value)} placeholder="e.g. Europe, China + Japan" className="cmd-input" style={{width:200}} />
                  <button className="cmd-link" onClick={()=>setMultiMode(false)}>← picker</button>
                </div>
              )}
              <div className="cmd-divider"/>
              <button className={`tier-btn ${scope==="chain"?"active":""}`} onClick={()=>{setScope("chain");setBrand("");}} title="Search by hotel chain/brand">Chain</button>
              <button className={`tier-btn ${scope==="independent"?"active":""}`} onClick={()=>{setScope("independent");setGroup("");setBrand("");}} title="Independent/boutique hotels">Independent</button>
              <button className={`tier-btn ${scope==="all"?"active":""}`} onClick={()=>{setScope("all");setGroup("");setBrand("");}} title="All hotels in market">All</button>
              <div className="cmd-divider"/>
              {scope === "chain" && (
                <>
                  <select value={group} onChange={e=>{setGroup(e.target.value);setBrand("");}} className="cmd-input" style={{width:120}}>
                    <option value="">Group</option>
                    {chainGroups.map(g=><option key={g} value={g}>{g}</option>)}
                  </select>
                  {group && brandOptions.length > 1 && (
                    <select value={brand} onChange={e=>setBrand(e.target.value)} className="cmd-input" style={{width:130}}>
                      <option value="">All {group} brands</option>
                      {brandOptions.map(b=><option key={b} value={b}>{b}</option>)}
                    </select>
                  )}
                  {!group && <input value={brand} onChange={e=>setBrand(e.target.value)} placeholder="or type brand..." className="cmd-input" style={{width:120}} />}
                </>
              )}
              {scope === "independent" && (
                <div style={{display:"flex",alignItems:"center",gap:4}}>
                  <span style={{fontSize:11,color:"var(--text3)",whiteSpace:"nowrap"}}>Min ADR $</span>
                  <input type="number" min="50" max="2000" step="50" value={minAdr} onChange={e=>setMinAdr(e.target.value)} className="cmd-input" style={{width:60}} title="Minimum ADR in USD" />
                </div>
              )}
              <input type="number" min="1" max="8" value={count} onChange={e=>setCount(e.target.value)} className="cmd-input" style={{width:44}} title="Count (max 8)" />
              <input value={sdrName} onChange={e=>saveSdrName(e.target.value)} placeholder="Your name" className="cmd-input" style={{width:90}} />
              <button className="run-btn" onClick={run} disabled={running}>
                {running ? <><div className="spinner"/>Searching...</> : cooldown > 0 ? `⏱ ${cooldown}s` : "▶ Run"}
              </button>
            </div>
            {running && <div className="progress-wrap" style={{marginTop:8}}><div className="progress-bar"><div className="progress-fill" style={{width:`${progress}%`}}/></div><div className="progress-text">› {log}</div></div>}
            {!running && log && !error && <div className="success-msg" style={{marginTop:6}}>✓ {log}</div>}
            {error && <div className="error-msg" style={{marginTop:6}}>⚠ {error}</div>}
          </div>

          <div className="toolbar">
            {sdrs.length > 1 && sdrs.map(s=><button key={s} className={`filter-pill ${filterSdr===s?"active":""}`} onClick={()=>{setFilterSdr(s);setHotelsPage(1);}}>{s==="all"?"All SDRs":s}</button>)}
            <span style={{width:1,height:24,background:"var(--border)",margin:"0 4px",flexShrink:0}}/>
            {["Active","Dormant","Closed"].map(ls=><button key={ls} className={`filter-pill ${leadStatusFilter.includes(ls)?"active":""}`} onClick={()=>setLeadStatusFilter(prev=>prev.includes(ls)?prev.filter(x=>x!==ls):[...prev,ls])} style={{borderColor:({Active:"var(--green)",Dormant:"#d97706",Closed:"var(--text3)"})[ls]}}>{ls}</button>)}
            <span style={{width:1,height:24,background:"var(--border)",margin:"0 4px",flexShrink:0}}/>
            <button className="export-btn" style={{fontWeight:600}} onClick={()=>{setAddHotelForm({});setAddHotelModal(true);}}>+ Add Hotel</button>
            {filteredP.length > 0 && <button className="export-btn" onClick={exportCSV}>↓ Export CSV</button>}
            <label className="export-btn" style={{cursor:"pointer"}} title="Import hotels from CSV/Excel (exported from this tool or mapped manually)">
              ↑ Import CSV
              <input type="file" accept=".csv,.xlsx,.xls,text/csv,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" style={{display:"none"}} onChange={importCSV}/>
            </label>
            <span style={{width:1,height:24,background:"var(--border)",margin:"0 4px",flexShrink:0}}/>
            {filteredP.length > 1 && <button className="export-btn" onClick={()=>{const g=findDuplicates(filteredP);setDupGroups(g);setDupExpanded(new Set());}}>Find Duplicates</button>}
            <span className="record-count">{loading?"Loading...":`${filteredP.length} prospects in shared database`}</span>
          </div>

          <div className="tabs">
            <button className={`tab ${tab==="dashboard"?"active":""}`} onClick={()=>setTab("dashboard")}>Dashboard</button>
            <button className={`tab ${tab==="hotels"?"active":""}`} onClick={()=>setTab("hotels")}>Hotels<span className="tab-badge">{sortedP.length}</span></button>
              <button className={`tab ${tab==="outreach"?"active":""}`} onClick={()=>setTab("outreach")}>Pipeline<span className="tab-badge">{filteredT.length}</span></button>
              <button className={`tab ${tab==="contacts"?"active":""}`} onClick={()=>setTab("contacts")}>Contact Tracker<span className="tab-badge">{tracking.filter(t=>t.d1).length}</span></button>
          </div>

          {tab==="dashboard" && (() => {
            const totalProspects = prospects.length;
            const withEmail = prospects.filter(p => p.email).length;
            const withGM = prospects.filter(p => p.gm_name).length;
            const inPipeline = tracking.length;
            const contacted1 = tracking.filter(t => t.d1).length;
            // Stage distribution
            const SM2 = s => { if (s==="active") return "new"; if (s==="emailed") return "1st"; if (s==="followup") return "2nd"; if (s==="dead") return "lost"; return s||"new"; };
            const stCounts = {};
            const ST_ALL = ["new","1st","2nd","3rd","4th","replied","bounced","demo","trial","won","lost"];
            ST_ALL.forEach(s => stCounts[s] = 0);
            tracking.forEach(t => { const s = SM2(t.pipeline_stage); stCounts[s] = (stCounts[s]||0) + 1; });
            const stColors = {new:"#6b7280","1st":"#2563eb","2nd":"#0891b2","3rd":"#7c3aed","4th":"#6d28d9",replied:"#0d9488",bounced:"#b45309",demo:"#c026d3",trial:"#ea580c",won:"#059669",lost:"#dc2626"};
            const stLabels = {new:"New","1st":"Email #1","2nd":"Follow-up #1","3rd":"Follow-up #2","4th":"Follow-up #3",replied:"Replied",bounced:"Bounced",demo:"Demo",trial:"Trial",won:"Won",lost:"Lost"};
            // Conversion metrics
            const repliedCount = stCounts["replied"] + stCounts["demo"] + stCounts["trial"] + stCounts["won"];
            const replyRate = contacted1 > 0 ? Math.round(repliedCount / contacted1 * 100) : 0;
            // Overdue from contact tracker
            const CAD2 = [0, 0, 3, 7, 7];
            let overdueCount = 0, dueTodayCount = 0;
            tracking.filter(t => t.d1).forEach(t => {
              const actual = [null, t.d1, t.d2, t.d3, t.d4];
              const due = [null, null, null, null, null];
              for (let n = 2; n <= 4; n++) { const a = actual[n-1] || due[n-1]; if (a) due[n] = addBusinessDays(a, CAD2[n]); }
              const stage = SM2(t.pipeline_stage);
              const isClosed = ["won","lost","demo","trial"].includes(stage);
              if (isClosed) return;
              let nextDue = null;
              for (let n = 2; n <= 4; n++) { if (!actual[n] && due[n]) { nextDue = due[n]; break; } }
              if (!nextDue) return;
              const target = new Date(nextDue); target.setHours(0,0,0,0);
              const now = new Date(); now.setHours(0,0,0,0);
              const diff = Math.round((target - now) / 86400000);
              if (diff < 0) overdueCount++;
              else if (diff === 0) dueTodayCount++;
            });
            // SDR breakdown
            const sdrMap = {};
            tracking.forEach(t => { const s = t.sdr || "Unassigned"; sdrMap[s] = (sdrMap[s]||0) + 1; });
            const sdrEntries = Object.entries(sdrMap).sort((a,b) => b[1] - a[1]);

            return (<div style={{padding:"8px 0"}}>
              <div className="dash-grid">
                <div className="dash-card">
                  <div className="dash-card-label">Total Hotels</div>
                  <div className="dash-card-val">{totalProspects}</div>
                  <div className="dash-card-sub">{withGM} with contact · {withEmail} with email</div>
                </div>
                <div className="dash-card">
                  <div className="dash-card-label">In Pipeline</div>
                  <div className="dash-card-val">{inPipeline}</div>
                  <div className="dash-card-sub">{contacted1} contacted · {inPipeline - contacted1} pending</div>
                </div>
                <div className="dash-card">
                  <div className="dash-card-label">Reply Rate</div>
                  <div className="dash-card-val">{replyRate}%</div>
                  <div className="dash-card-sub">{repliedCount} replies from {contacted1} contacted</div>
                </div>
                <div className="dash-card">
                  <div className="dash-card-label">Today's Actions</div>
                  <div className="dash-card-val" style={{color: overdueCount > 0 ? "var(--red)" : dueTodayCount > 0 ? "var(--orange)" : "var(--green)"}}>{overdueCount + dueTodayCount}</div>
                  <div className="dash-card-sub">{overdueCount > 0 ? overdueCount + " overdue · " : ""}{dueTodayCount} due today</div>
                </div>
              </div>

              <div className="dash-card" style={{marginBottom: 16}}>
                <div className="dash-card-label" style={{marginBottom: 10}}>Pipeline Distribution</div>
                <div className="dash-stage-bar">
                  {ST_ALL.filter(s => stCounts[s] > 0).map(s => (
                    <div key={s} className="dash-stage-seg" style={{width: (stCounts[s] / Math.max(inPipeline,1) * 100) + "%", background: stColors[s]}} title={stLabels[s] + ": " + stCounts[s]} />
                  ))}
                </div>
                <div className="dash-stage-legend">
                  {ST_ALL.filter(s => stCounts[s] > 0).map(s => (
                    <span key={s} style={{display:"flex",alignItems:"center",gap:3}}>
                      <span className="dash-stage-dot" style={{background: stColors[s]}} />
                      {stLabels[s]} <b>{stCounts[s]}</b>
                    </span>
                  ))}
                </div>
              </div>

              {sdrEntries.length > 0 && <div className="dash-card">
                <div className="dash-card-label" style={{marginBottom: 10}}>By SDR</div>
                {sdrEntries.map(([sdr, cnt]) => {
                  const sdrTracking = tracking.filter(t => (t.sdr||"Unassigned") === sdr);
                  const sdrContacted = sdrTracking.filter(t => t.d1).length;
                  const sdrReplied = sdrTracking.filter(t => ["replied","demo","trial","won"].includes(SM2(t.pipeline_stage))).length;
                  return <div key={sdr} style={{display:"flex",alignItems:"center",gap:10,padding:"6px 0",borderBottom:"1px solid var(--border)"}}>
                    <span style={{fontSize:13,fontWeight:600,minWidth:100,color:"var(--text)"}}>{sdr}</span>
                    <div style={{flex:1,height:6,background:"var(--bg)",borderRadius:3,overflow:"hidden"}}>
                      <div style={{height:"100%",width:(cnt/Math.max(...sdrEntries.map(e=>e[1]),1)*100)+"%",background:"var(--accent)",borderRadius:3,transition:"width 0.3s"}} />
                    </div>
                    <span style={{fontSize:12,color:"var(--text3)",minWidth:140,textAlign:"right"}}>{cnt} assigned · {sdrContacted} sent · {sdrReplied} replied</span>
                  </div>;
                })}
              </div>}
            </div>);
          })()}

          {tab==="hotels" && (
            <div className="table-card">
              <div style={{display:"flex",gap:8,alignItems:"center",padding:"12px 0 8px",flexWrap:"wrap",overflowX:"auto"}}>
                <input className="cmd-input" style={{minWidth:150,flexShrink:0}} placeholder="🔍 Hotel or person..." value={filterSearch} onChange={e=>{setFilterSearch(e.target.value);setHotelsPage(1);}}/>
                <select className="cmd-input" style={{minWidth:110,flexShrink:0}} value={filterCountry} onChange={e=>{setFilterCountry(e.target.value);setFilterCity("");setHotelsPage(1);}}>
                  <option value="">All Countries</option>
                  {allCountries.map(c=><option key={c} value={c}>{c}</option>)}
                </select>
                <select className="cmd-input" style={{minWidth:110,flexShrink:0}} value={filterCity} onChange={e=>{setFilterCity(e.target.value);setHotelsPage(1);}}>
                  <option value="">All Cities</option>
                  {allCities.map(c=><option key={c} value={c}>{c}</option>)}
                </select>
                <select className="cmd-input" style={{width:160,flexShrink:0,maxWidth:160}} value={filterGroup} onChange={e=>{setFilterGroup(e.target.value);setHotelsPage(1);}}>
                  <option value="">All Groups</option>
                  {allGroups.map(g=><option key={g} value={g}>{g.length>28?g.slice(0,26)+"…":g}</option>)}
                </select>
                <select className="cmd-input" style={{minWidth:100,flexShrink:0}} value={filterBrand} onChange={e=>{setFilterBrand(e.target.value);setHotelsPage(1);}}>
                  <option value="">All Brands</option>
                  {allBrands.map(b=><option key={b} value={b}>{b}</option>)}
                </select>
                <select className="cmd-input" style={{minWidth:100,flexShrink:0}} value={filterProvider} onChange={e=>{setFilterProvider(e.target.value);setHotelsPage(1);}}>
                  <option value="">All Providers</option>
                  {allProviders.map(p=><option key={p} value={p}>{p}</option>)}
                </select>
                <button className="act-btn" style={{fontSize:11,flexShrink:0,background:filterHasGM?"var(--accent)":"transparent",color:filterHasGM?"white":"var(--text2)",border:filterHasGM?"1px solid var(--accent)":"1px solid var(--border)",borderRadius:4,padding:"4px 8px"}} onClick={()=>{setFilterHasGM(v=>!v);setHotelsPage(1);}}>Has GM</button>
                <button className="act-btn" style={{fontSize:11,flexShrink:0,background:filterHasEmail?"var(--accent)":"transparent",color:filterHasEmail?"white":"var(--text2)",border:filterHasEmail?"1px solid var(--accent)":"1px solid var(--border)",borderRadius:4,padding:"4px 8px"}} onClick={()=>{setFilterHasEmail(v=>!v);setHotelsPage(1);}}>Has Email</button>
                {(filterCountry||filterCity||filterGroup||filterBrand||filterSearch||filterProvider||filterHasEmail||filterHasGM) && <button className="act-btn" style={{fontSize:11,flexShrink:0}} onClick={()=>{setFilterCountry("");setFilterCity("");setFilterGroup("");setFilterBrand("");setFilterSearch("");setFilterProvider("");setFilterHasEmail(false);setFilterHasGM(false);setHotelsPage(1);setSortCol(null);}}>✕ Clear</button>}
                <span style={{marginLeft:"auto",fontSize:12,color:"var(--text2)",whiteSpace:"nowrap",flexShrink:0,fontWeight:600,background:"var(--bg)",padding:"4px 10px",borderRadius:5,border:"1px solid var(--border)"}}>{sortedP.length} hotels{(filterCountry||filterCity||filterGroup||filterBrand||filterSearch||filterProvider||filterHasEmail||filterHasGM)?" (filtered)":""}</span>
              </div>
              {filteredP.length === 0 ? (
                <div className="empty">
                  <div className="empty-icon">{loading ? "⏳" : "🔍"}</div>
                  <div className="empty-title">{loading ? "Loading database..." : "No hotels match your filters"}</div>
                  <div className="empty-sub" style={{marginBottom:12}}>{loading ? "" : "Try adjusting your search or filters."}</div>
                  {!loading && <button className="act-btn" onClick={()=>{setFilterCountry("");setFilterCity("");setFilterGroup("");setFilterBrand("");setFilterSearch("");setFilterProvider("");setHotelsPage(1);}}>← Clear all filters</button>}
                </div>
              ) : (
              <>
              {selectedIds.size > 0 && (
                <div className="batch-bar">
                  <span className="batch-bar-count">{selectedIds.size} selected</span>
                  <select className="cmd-input" style={{minWidth:100}} defaultValue="" onChange={async e => {
                    const val = e.target.value; if (!val) return; e.target.value = "";
                    const ids = [...selectedIds];
                    for (const pid of ids) { await updateProspect(pid, {lead_status: val}); }
                    setSelectedIds(new Set());
                  }}>
                    <option value="">Set Lead Status</option>
                    <option value="Active">Active</option>
                    <option value="Dormant">Dormant</option>
                    <option value="Closed">Closed</option>
                  </select>
                  <select className="cmd-input" style={{minWidth:100}} defaultValue="" onChange={async e => {
                    const val = e.target.value; if (!val) return; e.target.value = "";
                    const ids = [...selectedIds];
                    for (const pid of ids) {
                      const t = tracking.find(x => x.prospect_id === pid);
                      if (t) await updatePipeline(t.id, {pipeline_stage: val});
                    }
                    setSelectedIds(new Set());
                  }}>
                    <option value="">Set Stage</option>
                    {["new","1st","2nd","3rd","4th","replied","bounced","demo","trial","won","lost"].map(s => <option key={s} value={s}>{s==="1st"?"Email #1":s==="2nd"?"Follow-up #1":s==="3rd"?"Follow-up #2":s==="4th"?"Follow-up #3":s.charAt(0).toUpperCase()+s.slice(1)}</option>)}
                  </select>
                  <select className="cmd-input" style={{minWidth:100}} defaultValue="" onChange={async e => {
                    const val = e.target.value; if (!val) return; e.target.value = "";
                    const ids = [...selectedIds];
                    for (const pid of ids) {
                      const t = tracking.find(x => x.prospect_id === pid);
                      if (t) await updatePipeline(t.id, {sdr: val});
                    }
                    setSelectedIds(new Set());
                  }}>
                    <option value="">Assign SDR</option>
                    {[...new Set(tracking.map(t=>t.sdr).filter(Boolean))].sort().map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                  <button className="act-btn" style={{fontSize:11,color:"var(--red)",border:"1px solid #fecaca",background:"#fef2f2"}} onClick={async () => {
                    if (!confirm(`Delete ${selectedIds.size} selected hotels permanently?`)) return;
                    for (const pid of [...selectedIds]) { await deleteProspect(pid); }
                    setSelectedIds(new Set());
                  }}>Delete {selectedIds.size}</button>
                  <button className="act-btn" style={{fontSize:11,marginLeft:"auto"}} onClick={()=>setSelectedIds(new Set())}>✕ Deselect</button>
                </div>
              )}
              <div style={{overflowX:"auto"}}>
              <table>
                <thead><tr>
                  <th className="cb-cell" onClick={e => e.stopPropagation()}><input type="checkbox" checked={pagedP.length > 0 && pagedP.every(p => selectedIds.has(p.id))} onChange={e => {
                    const next = new Set(selectedIds);
                    if (e.target.checked) pagedP.forEach(p => next.add(p.id));
                    else pagedP.forEach(p => next.delete(p.id));
                    setSelectedIds(next);
                  }} /></th>
                  <th style={{width:"16%"}}>Hotel</th>
                  <th style={{width:"6%"}}>City</th>
                  <th style={{width:"7%"}}>Country</th>
                  <th style={{width:"7%"}}>Group</th>
                  <th style={{width:"9%"}}>Brand</th>
                  <th style={{width:"10%"}}>Contact</th>
                  <th style={{width:"12%"}}>Email</th>
                  <th className="sortable" style={{width:"5%"}} onClick={()=>toggleSort("rooms")}>Rooms <span className={`sort-arrow ${sortCol==="rooms"?"active":""}`}>{sortCol==="rooms"?(sortDir==="asc"?"▲":"▼"):"⇅"}</span></th>
                  <th className="sortable" style={{width:"5%"}} onClick={()=>toggleSort("adr")}>ADR <span className={`sort-arrow ${sortCol==="adr"?"active":""}`}>{sortCol==="adr"?(sortDir==="asc"?"▲":"▼"):"⇅"}</span></th>
                  <th style={{width:"7%"}}>Provider</th>
                  <th style={{width:"7%"}}>Lead</th>
                  <th style={{width:"3%"}}></th>
                </tr></thead>
                <tbody>
                  {pagedP.map(p=>{
                    const isIndependent = !p.hotel_group && !p.brand;
                    const isChecked = selectedIds.has(p.id);
                    return (
                    <tr key={p.id} onClick={()=>setSelected(p.id)} style={{background: isChecked ? "var(--accent-light)" : undefined}}>
                      <td className="cb-cell" onClick={e=>e.stopPropagation()}><input type="checkbox" checked={isChecked} onChange={e => {
                        const next = new Set(selectedIds);
                        e.target.checked ? next.add(p.id) : next.delete(p.id);
                        setSelectedIds(next);
                      }} /></td>
                      <td><div className="hotel-name">{p.hotel_name}</div></td>
                      <td><span className="cell-muted" style={{fontSize:12}}>{p.city||"—"}</span></td>
                      <td><span className="cell-muted" style={{fontSize:12}}>{p.country||"—"}</span></td>
                      <td><div style={{fontSize:12,color:"var(--text2)",maxWidth:110,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}} title={normalizeGroup(p.hotel_group||p.brand)||"Independent"}>{isIndependent?"Independent":normalizeGroup(p.hotel_group||p.brand)||"—"}</div></td>
                      <td><span className="cell-muted" style={{fontSize:12}}>{normalizeBrand(p.brand) || inferBrandFromName(p.hotel_name) || "—"}</span></td>
                      <td><div className="gm-name" style={{fontSize:12}}>{p.gm_name||<span className="cell-muted">—</span>}</div>{p.gm_name && p.gm_title && p.gm_title!=="General Manager" ? <div className="gm-title-sm">{p.gm_title}</div> : null}</td>
                      <td>{(()=>{const em=p.email; if(!em||em.includes('[email')||em.includes('email protected'))return<span className="cell-muted">—</span>; return<a className="email-link" href={`mailto:${em}`} onClick={e=>e.stopPropagation()} style={{maxWidth:150,display:"inline-block",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}} title={em}>{em}</a>;})()}</td>
                      <td><span className="cell-muted" style={{fontSize:12}}>{p.rooms||"—"}</span></td>
                      <td><span className="cell-muted" style={{fontSize:12}}>{p.adr_usd?`~$${p.adr_usd}`:"—"}</span></td>
                      <td><span className="cell-muted" style={{fontSize:11}}>{getProvider(p)||"—"}</span></td>
                                            <td style={{overflow:"visible"}} onClick={e=>e.stopPropagation()}><select style={{fontSize:10,border:"1px solid var(--border2)",borderRadius:3,padding:"2px 4px",background:"transparent",cursor:"pointer",color:({Active:"var(--green)",Dormant:"#d97706",Closed:"var(--text3)"})[p.lead_status||"Active"]}} value={p.lead_status||"Active"} onChange={e=>updateProspect(p.id,{lead_status:e.target.value})}><option value="Active">Active</option><option value="Dormant">Dormant</option><option value="Closed">Closed</option></select></td>
<td style={{overflow:"visible",textOverflow:"clip"}} onClick={e=>e.stopPropagation()}><button className="del-btn" onClick={()=>setDeleteConfirm(p.id)} title="Delete">🗑</button></td>
                    </tr>
                  );})}
                </tbody>
              </table>
              </div>
              {totalHotelPages > 1 && (
                <div style={{display:"flex",alignItems:"center",justifyContent:"center",gap:6,padding:"12px",borderTop:"1px solid var(--border)"}}>
                  <button className="act-btn" disabled={hotelsPage===1} onClick={()=>setHotelsPage(p=>p-1)}>← Prev</button>
                  {Array.from({length:Math.min(totalHotelPages,7)}, (_,i) => {
                    let page;
                    if (totalHotelPages <= 7) page = i+1;
                    else if (hotelsPage <= 4) page = i+1;
                    else if (hotelsPage >= totalHotelPages-3) page = totalHotelPages-6+i;
                    else page = hotelsPage-3+i;
                    return <button key={page} className={`act-btn ${hotelsPage===page?"success":""}`} style={{minWidth:32}} onClick={()=>setHotelsPage(page)}>{page}</button>;
                  })}
                  <button className="act-btn" disabled={hotelsPage===totalHotelPages} onClick={()=>setHotelsPage(p=>p+1)}>Next →</button>
                  <span style={{fontSize:11,color:"var(--text3)",marginLeft:4}}>{(hotelsPage-1)*HOTELS_PER_PAGE+1}–{Math.min(hotelsPage*HOTELS_PER_PAGE,sortedP.length)} of {sortedP.length}</span>
                </div>
              )}
              </>
              )}
            </div>
          )}

          {tab==="outreach" && <ErrorBoundary><OutreachTab filteredT={filteredT} stageFilter={stageFilter} setStageFilter={setStageFilter} setSelected={setSelected} touchToggle={touchToggle} updatePipeline={updatePipeline} openRejectModal={openRejectModal} reopenSequence={reopenSequence} outreachView={outreachView} setOutreachView={setOutreachView} setDeleteConfirm={setDeleteConfirm} editingNote={editingNote} setEditingNote={setEditingNote} noteText={noteText} setNoteText={setNoteText} saveNote={saveNote} prospects={prospects}
            outreachSearch={outreachSearch} setOutreachSearch={setOutreachSearch}
            outreachCountry={outreachCountry} setOutreachCountry={setOutreachCountry}
            outreachCity={outreachCity} setOutreachCity={setOutreachCity}
            outreachGroup={outreachGroup} setOutreachGroup={setOutreachGroup}
            outreachTier={outreachTier} setOutreachTier={setOutreachTier}
            outreachProvider={outreachProvider} setOutreachProvider={setOutreachProvider}
            allCountries={allCountries} allCities={allCities} allGroups={allGroups} allProviders={allProviders}
            updateIntention={updateIntention}
            pipeStageFilter={pipeStageFilter} setPipeStageFilter={setPipeStageFilter}
            pipeHasGM={pipeHasGM} setPipeHasGM={setPipeHasGM}
            pipeHasEmail={pipeHasEmail} setPipeHasEmail={setPipeHasEmail}
          /></ErrorBoundary>}
      {/* Contact Tracker page */}
      {tab === "contacts" && (() => {
        const CAD = [0, 0, 3, 7, 7]; // cadence: 1st->2nd=+3bd, 2nd->3rd=+7bd, 3rd->4th=+7bd
        const SM = { active:"new", emailed:"1st", followup:"2nd", dead:"lost" };
        const ms = s => SM[s] || s || "new";
        const EM = String.fromCodePoint(0x2014);
        const SC = {new:"#6b7280","1st":"#2563eb","2nd":"#0891b2","3rd":"#7c3aed","4th":"#6d28d9",replied:"#0d9488",bounced:"#b45309",demo:"#c026d3",trial:"#ea580c",won:"#059669",lost:"#dc2626"};
        function toInput(d) { if (!d) return ""; const dt=new Date(d),y=dt.getFullYear(),m=String(dt.getMonth()+1).padStart(2,"0"),dd=String(dt.getDate()).padStart(2,"0"); return y+"-"+m+"-"+dd; }
        function fmtD(d) { if (!d) return null; const dt = new Date(d); const days=["Sun","Mon","Tue","Wed","Thu","Fri","Sat"]; return fmtDateShort(d)+" ("+days[dt.getDay()]+")"; }

        // Compute schedule for a tracking record
        function computeSchedule(t) {
          const actual = [null, t.d1, t.d2, t.d3, t.d4];
          const due = [null, null, null, null, null];
          // Due dates: anchor from previous ACTUAL (or previous due as fallback)
          for (let n = 2; n <= 4; n++) {
            const anchor = actual[n-1] || due[n-1];
            if (anchor) due[n] = addBusinessDays(anchor, CAD[n]);
          }
          const stage = ms(t.pipeline_stage);
          const isClosed = ["won","lost","demo","trial"].includes(stage);
          // Next step: first step without actual date
          let nextStep = null, nextDue = null;
          if (!isClosed && stage !== "new") {
            for (let n = 2; n <= 4; n++) {
              if (!actual[n]) { nextStep = n; nextDue = due[n]; break; }
            }
          }
          // If stage is NEW and no d1: no nextDue
          if (stage === "new" && !actual[1]) { nextStep = null; nextDue = null; }
          // If stage is NEW but has d1: next is 2nd
          if (stage === "new" && actual[1] && !actual[2]) { nextStep = 2; nextDue = due[2]; }
          // Last actual contact
          let lastN = 0;
          for (let n = 4; n >= 1; n--) { if (actual[n]) { lastN = n; break; } }
          const lastDate = lastN > 0 ? actual[lastN] : null;
          const daysSince = lastDate ? Math.floor((Date.now() - new Date(lastDate)) / 86400000) : null;
          // Countdown: daysToDue = targetDate - today (positive = future, negative = overdue)
          let daysUntilDue = null;
          if (nextDue) {
            const target = new Date(nextDue); target.setHours(0,0,0,0);
            const now = new Date(); now.setHours(0,0,0,0);
            daysUntilDue = Math.round((target - now) / 86400000);
          }
          // Status
          let status = "ok";
          if (isClosed || (lastN >= 4 && !nextStep)) status = "done";
          else if (daysUntilDue !== null && daysUntilDue < 0) status = "overdue";
          else if (daysUntilDue !== null && daysUntilDue <= 2) status = "due-soon";
          return { actual, due, nextStep, nextDue, lastN, lastDate, daysSince, daysUntilDue, status, isClosed };
        }

        function updateDate(tid, touchNum, dateVal) {
          // Guard: no future dates
          if (dateVal) {
            const sel = new Date(dateVal + "T12:00:00");
            const today = new Date(); today.setHours(23,59,59,999);
            if (sel > today) { alert("Cannot set a future date as actual contact date."); return; }
          }
          const t = tracking.find(x => x.id === tid);
          if (!t) return;
          // Guard: no step skipping (must have previous step)
          if (dateVal && touchNum > 1 && !t["d" + (touchNum - 1)]) {
            const ord = ["","1st","2nd","3rd","4th"];
            alert("Set " + ord[touchNum-1] + " contact date first."); return;
          }
          const key = "d" + touchNum;
          const isoVal = dateVal ? new Date(dateVal + "T12:00:00").toISOString() : null;
          const done = [...((t.done) || [])];
          if (dateVal && !done.includes(touchNum)) { done.push(touchNum); done.sort((a,b)=>a-b); }
          if (!dateVal) { const idx=done.indexOf(touchNum); if(idx>=0) done.splice(idx,1); }
          const updates = { [key]: isoVal, done };
          // Auto-derive stage from highest done touch (only if not in demo/trial/won/lost)
          const maxD = done.length > 0 ? Math.max(...done) : 0;
          const stMap = {0:"new",1:"1st",2:"2nd",3:"3rd",4:"4th"};
          const cur = ms(t.pipeline_stage);
          if (stMap[maxD] && !["demo","trial","won","lost"].includes(cur)) {
            updates.pipeline_stage = stMap[maxD];
          }
          updatePipeline(tid, updates);
        }

        function ctToggleSort(col) {
          if (ctSortCol === col) setCtSortDir(d => d === "asc" ? "desc" : "asc");
          else { setCtSortCol(col); setCtSortDir("asc"); }
        }

        const rows = tracking.filter(t => t.d1 || (t.done && t.done.length > 0)).map(t => {
          const p = prospects.find(x => x.id === t.prospect_id);
          const sched = computeSchedule(t);
          const stage = ms(t.pipeline_stage);
          return { t, p, stage, ...sched };
        }).sort((a, b) => {
          const pri = { overdue: 0, "due-soon": 1, ok: 2, done: 3 };
          return (pri[a.status]||2) - (pri[b.status]||2);
        });

        const overdueN = rows.filter(r => r.status === "overdue").length;
        const dueTodayN = rows.filter(r => r.daysUntilDue === 0).length;
        const dueSoonN = rows.filter(r => r.status === "due-soon" && r.daysUntilDue !== 0).length;
        const doneN = rows.filter(r => r.status === "done").length;
        const upcomingN = rows.filter(r => r.status === "ok").length;

        // Apply CT filters
        const ctSdrs = [...new Set(rows.map(r => r.t.sdr).filter(Boolean))].sort();
        const filteredRows = rows.filter(r => {
          if (ctOwnerFilter && (r.t.sdr || "Unknown") !== ctOwnerFilter) return false;
          if (ctDueFilter) {
            const d = r.daysUntilDue;
            if (ctDueFilter === "overdue" && !(d !== null && d < 0)) return false;
            if (ctDueFilter === "today" && d !== 0) return false;
            if (ctDueFilter === "3days" && !(d !== null && d >= 0 && d <= 3)) return false;
            if (ctDueFilter === "7days" && !(d !== null && d >= 0 && d <= 7)) return false;
            if (ctDueFilter === "none" && d !== null) return false;
          }
          if (ctPriFilter) {
            const pri = r.status === "done" ? "done" : r.status === "overdue" ? "high" : (r.daysUntilDue !== null && r.daysUntilDue <= 2) ? "high" : (r.daysUntilDue !== null && r.daysUntilDue <= 5) ? "medium" : "low";
            if (pri !== ctPriFilter) return false;
          }
          if (ctStageFilter) {
            if (ctStageFilter === "done" && r.status !== "done") return false;
            else if (ctStageFilter !== "done" && r.stage !== ctStageFilter) return false;
          }
          return true;
        });
        const ctHasFilters = ctOwnerFilter || ctDueFilter || ctPriFilter || ctStageFilter;

        // Apply user sort on top of priority sort
        const sortedRows = ctSortCol ? [...filteredRows].sort((a, b) => {
          let va, vb, aN, bN;
          if (ctSortCol === "lastDate") { va = a.lastDate ? new Date(a.lastDate).getTime() : null; vb = b.lastDate ? new Date(b.lastDate).getTime() : null; }
          if (ctSortCol === "nextDue") { va = a.nextDue ? new Date(a.nextDue).getTime() : null; vb = b.nextDue ? new Date(b.nextDue).getTime() : null; }
          if (ctSortCol === "countdown") { va = a.daysUntilDue ?? null; vb = b.daysUntilDue ?? null; }
          aN = va === null; bN = vb === null;
          if (aN && bN) return 0;
          if (aN) return 1;
          if (bN) return -1;
          return ctSortDir === "asc" ? va - vb : vb - va;
        }) : filteredRows;

        function SortTh({ col, label, width }) {
          const active = ctSortCol === col;
          return <th style={{width, cursor:"pointer", userSelect:"none", whiteSpace:"nowrap"}} onClick={() => ctToggleSort(col)}>
            {label} <span style={{fontSize:10, opacity: active ? 1 : 0.35, color: active ? "var(--accent)" : "inherit"}}>{active ? (ctSortDir === "asc" ? "▲" : "▼") : "⇅"}</span>
          </th>;
        }

        return (<>
          <div style={{display:"flex",gap:8,alignItems:"center",padding:"12px 0 8px",flexWrap:"wrap"}}>
            <div style={{fontSize:13,fontWeight:600,color:"var(--text)"}}>Today: {fmtDateShort(new Date())}</div>
            <span style={{fontSize:12,color:"var(--text3)",padding:"4px 10px",background:"var(--bg)",borderRadius:5,border:"1px solid var(--border)"}}>{rows.length} tracked</span>
            {overdueN > 0 && <span style={{fontSize:12,fontWeight:600,padding:"4px 10px",background:"#fef2f2",color:"#dc2626",borderRadius:5,border:"1px solid #fecaca"}}>{overdueN} Overdue</span>}
            {dueTodayN > 0 && <span style={{fontSize:12,fontWeight:600,padding:"4px 10px",background:"#fff7ed",color:"#ea580c",borderRadius:5,border:"1px solid #fed7aa"}}>{dueTodayN} Due today</span>}
            {dueSoonN > 0 && <span style={{fontSize:12,fontWeight:600,padding:"4px 10px",background:"#fffbeb",color:"#d97706",borderRadius:5,border:"1px solid #fde68a"}}>{dueSoonN} Due soon</span>}
            {upcomingN > 0 && <span style={{fontSize:12,padding:"4px 10px",background:"#f0fdf4",color:"#059669",borderRadius:5,border:"1px solid #bbf7d0"}}>{upcomingN} Upcoming</span>}
            {doneN > 0 && <span style={{fontSize:12,padding:"4px 10px",background:"#f9fafb",color:"var(--text3)",borderRadius:5,border:"1px solid var(--border)"}}>{doneN} Completed</span>}
            <div style={{marginLeft:"auto",display:"flex",gap:4,background:"var(--bg)",borderRadius:6,border:"1px solid var(--border)",padding:2}}>
              <button style={{fontSize:11,fontWeight:600,padding:"4px 10px",borderRadius:4,border:"none",cursor:"pointer",background:ctFocusMode?"var(--accent)":"transparent",color:ctFocusMode?"white":"var(--text3)"}} onClick={()=>{setCtFocusMode(true);setFocusDoneIds(new Set());}}>Focus</button>
              <button style={{fontSize:11,fontWeight:600,padding:"4px 10px",borderRadius:4,border:"none",cursor:"pointer",background:!ctFocusMode?"var(--accent)":"transparent",color:!ctFocusMode?"white":"var(--text3)"}} onClick={()=>setCtFocusMode(false)}>Full List</button>
            </div>
          </div>

          {ctFocusMode ? (() => {
            // Focus mode: only show overdue + due today + due within 2 days, excluding dismissed
            const focusRows = rows.filter(r => {
              if (r.status === "done") return false;
              if (focusDoneIds.has(r.t.id)) return false;
              return r.status === "overdue" || (r.daysUntilDue !== null && r.daysUntilDue <= 2);
            });
            const ordLabel = ["","1st","2nd","3rd","4th"];
            if (focusRows.length === 0) return (
              <div style={{textAlign:"center",padding:"40px 0"}}>
                <div style={{fontSize:32,marginBottom:8}}>✓</div>
                <div style={{fontSize:16,fontWeight:600,color:"var(--green)"}}>All caught up!</div>
                <div style={{fontSize:13,color:"var(--text3)",marginTop:4}}>No overdue or imminent follow-ups. Next due items will appear here.</div>
                <button className="act-btn" style={{marginTop:12}} onClick={()=>setCtFocusMode(false)}>View full list →</button>
              </div>
            );
            return (<div style={{padding:"4px 0"}}>
              <div style={{fontSize:11,color:"var(--text3)",marginBottom:8,fontWeight:600}}>{focusRows.length} action{focusRows.length!==1?"s":""} to do</div>
              {focusRows.map(({t, p, stage, actual, due, nextStep, nextDue, daysUntilDue, status, lastN}) => {
                const emailAddr = t.email || p?.email;
                const gmFirst = (t.gm || p?.gm_name || "").split(" ")[0] || "there";
                const isOverdue = status === "overdue";
                const isDueToday = daysUntilDue === 0;
                const nextAction = !actual[1] ? "Send Email #1" : nextStep ? `Send Follow-up #${nextStep-1}` : "Waiting reply";
                return (
                  <div key={t.id} className={`focus-card ${isOverdue?"overdue":isDueToday?"due-today":"due-soon"}`}>
                    <button className={`focus-done-btn ${focusDoneIds.has(t.id)?"checked":""}`} onClick={() => {
                      setFocusDoneIds(prev => { const n = new Set(prev); n.add(t.id); return n; });
                    }} title="Mark done for today">✓</button>
                    <div style={{flex:1,minWidth:0}}>
                      <div style={{display:"flex",alignItems:"baseline",gap:8,flexWrap:"wrap"}}>
                        <span style={{fontWeight:600,color:"var(--text)",cursor:"pointer",fontSize:13}} onClick={()=>setSelected(t.prospect_id)}>{t.hotel}</span>
                        <span style={{fontSize:11,color:"var(--text3)"}}>{p?.city||""}{t.gm?" · "+t.gm:""}</span>
                      </div>
                      <div style={{display:"flex",alignItems:"center",gap:10,marginTop:4,fontSize:12}}>
                        <span style={{fontWeight:600,color:isOverdue?"var(--red)":isDueToday?"var(--orange)":"var(--amber)"}}>
                          {isOverdue ? pluralDays(daysUntilDue)+" overdue" : isDueToday ? "Due today" : "Due in "+pluralDays(daysUntilDue)}
                        </span>
                        <span style={{color:"var(--text3)"}}>→ {nextAction}</span>
                        {nextDue && <span style={{color:"var(--text3)",fontSize:11}}>{fmtDateShort(nextDue)} ({ordLabel[nextStep]})</span>}
                      </div>
                    </div>
                    <div style={{display:"flex",gap:6,flexShrink:0}}>
                      {emailAddr && <button className="act-btn" style={{fontSize:10,padding:"4px 10px",background:"var(--accent)",color:"white",border:"none",borderRadius:4,cursor:"pointer"}} onClick={e=>{e.stopPropagation();const subj=encodeURIComponent("Guest feedback insights for "+t.hotel);const body=encodeURIComponent(`Hi ${gmFirst},\n\nI recently reviewed guest feedback trends for ${t.hotel}...\n\nBest,\nZishuo Wang | Where to know`);window.open(`https://outlook.office.com/mail/deeplink/compose?to=${encodeURIComponent(emailAddr)}&subject=${subj}&body=${body}`);}}>✉ Email</button>}
                      <button className="act-btn" style={{fontSize:10,padding:"4px 10px"}} onClick={()=>{setCtFocusMode(false);setCtExpanded(t.id);}}>Details</button>
                    </div>
                  </div>
                );
              })}
            </div>);
          })() : (<>
          <div style={{display:"flex",gap:8,alignItems:"center",padding:"8px 0",flexWrap:"wrap"}}>
            <select className="cmd-input" style={{minWidth:90,flexShrink:0}} value={ctOwnerFilter} onChange={e=>{setCtOwnerFilter(e.target.value);setCtPage(1);}}>
              <option value="">All Owners</option>{ctSdrs.map(s=><option key={s} value={s}>{s}</option>)}
            </select>
            <select className="cmd-input" style={{minWidth:100,flexShrink:0}} value={ctDueFilter} onChange={e=>{setCtDueFilter(e.target.value);setCtPage(1);}}>
              <option value="">All Due Dates</option>
              <option value="overdue">Overdue</option>
              <option value="today">Due today</option>
              <option value="3days">Next 3 days</option>
              <option value="7days">Next 7 days</option>
              <option value="none">No due date</option>
            </select>
            <select className="cmd-input" style={{minWidth:80,flexShrink:0}} value={ctPriFilter} onChange={e=>{setCtPriFilter(e.target.value);setCtPage(1);}}>
              <option value="">All Priority</option>
              <option value="high">High</option>
              <option value="medium">Medium</option>
              <option value="low">Low</option>
              <option value="done">Done</option>
            </select>
            <select className="cmd-input" style={{minWidth:90,flexShrink:0}} value={ctStageFilter} onChange={e=>{setCtStageFilter(e.target.value);setCtPage(1);}}>
              <option value="">All Stages</option>
              <option value="new">New</option>
              <option value="1st">Email #1</option>
              <option value="2nd">Follow-up #1</option>
              <option value="3rd">Follow-up #2</option>
              <option value="4th">Follow-up #3</option>
              <option value="replied">Replied</option>
              <option value="bounced">Bounced</option>
              <option value="done">Completed</option>
            </select>
            {ctHasFilters && <button className="act-btn" style={{fontSize:11}} onClick={()=>{setCtOwnerFilter("");setCtDueFilter("");setCtPriFilter("");setCtStageFilter("");setCtPage(1);}}>✕ Clear</button>}
            <span style={{marginLeft:"auto",fontSize:12,color:"var(--text3)",fontWeight:600}}>{filteredRows.length} / {rows.length}</span>
          </div>
          {(() => {
            const totalCtPages = Math.ceil(sortedRows.length / CT_PER_PAGE);
            const pagedCtRows = sortedRows.slice((ctPage - 1) * CT_PER_PAGE, ctPage * CT_PER_PAGE);
            return (<>
          <div className="table-card" style={{overflowX:"auto"}}><table className="contact-tracker"><thead><tr>
            <th style={{width:"20%"}}>Hotel</th><th style={{width:"12%"}}>Stage</th>
            <SortTh col="lastDate" label="Last Contact" width="14%" />
            <SortTh col="nextDue" label="Next Due" width="16%" />
            <SortTh col="countdown" label="Countdown" width="9%" />
            <th style={{width:"7%"}}>Priority</th><th style={{width:"17%"}}>Next Action</th><th style={{width:"8%"}}>Owner</th>
          </tr></thead><tbody>
            {pagedCtRows.map(({t, p, stage, actual, due, nextStep, nextDue, lastN, lastDate, daysSince, daysUntilDue, status}) => {
              const isExp = ctExpanded === t.id;
              const ordLabel = ["","1st","2nd","3rd","4th"];
              // Priority logic
              const priority = status === "done" ? "done" : status === "overdue" ? "high" : (daysUntilDue !== null && daysUntilDue <= 2) ? "high" : (daysUntilDue !== null && daysUntilDue <= 5) ? "medium" : "low";
              const priStyle = { high: {bg:"#fef2f2",color:"#dc2626",label:"High"}, medium: {bg:"#fffbeb",color:"#d97706",label:"Medium"}, low: {bg:"#f3f4f6",color:"#6b7280",label:"Low"}, done: {bg:"#ecfdf5",color:"#059669",label:"Done"} }[priority];
              // Next Action logic
              const nextAction = status === "done" ? null : !actual[1] ? "\u2709 Send Email #1" : nextStep ? `\u21BA Send Follow-up #${nextStep-1}` : "\u23F3 Waiting reply";
              const emailAddr = t.email || p?.email;
              const gmFirst = (t.gm || p?.gm_name || "").split(" ")[0] || "there";
              return (<Fragment key={t.id}>
                <tr style={{cursor:"pointer",borderLeft:priority==="high"?"3px solid #dc2626":priority==="medium"?"3px solid #d97706":"3px solid transparent",opacity:priority==="done"?0.45:1,background:priority==="done"?"#fafafa":undefined}} onClick={()=>setCtExpanded(isExp?null:t.id)}>
                  <td>
                    <div style={{display:"flex",alignItems:"center",gap:5}}>
                      <span style={{fontSize:10,color:"var(--text3)",flexShrink:0,transition:"transform 0.15s",transform:isExp?"rotate(90deg)":"rotate(0deg)"}}>▸</span>
                      <div style={{minWidth:0}}>
                        <div style={{fontWeight:600,color:"var(--text)",cursor:"pointer"}} onClick={e=>{e.stopPropagation();setSelected(t.prospect_id);}}>{t.hotel}</div>
                        <div style={{fontSize:10,color:"var(--text3)"}}>{p?.city||""}{p?.country?", "+p.country:""}{t.gm?" · "+t.gm:""}</div>
                      </div>
                    </div>
                  </td>
                  <td style={{overflow:"visible"}}><select style={{fontSize:11,fontWeight:600,color:SC[stage]||"#6b7280",background:"transparent",border:"1px solid var(--border2)",borderRadius:4,padding:"2px 4px",cursor:"pointer",textTransform:"uppercase",minWidth:90}} value={stage} onClick={e=>e.stopPropagation()} onChange={e=>{e.stopPropagation();const newStage=e.target.value;const updates={pipeline_stage:newStage};if(newStage==="new"){updates.d1=null;updates.d2=null;updates.d3=null;updates.d4=null;updates.done=[];}if(newStage!=="lost"&&(t.rejection_reason)){updates.rejection_reason=null;}updatePipeline(t.id,updates);}}>{["new","1st","2nd","3rd","4th","replied","bounced","demo","trial","won","lost"].map(s=><option key={s} value={s} style={{color:SC[s]||"#6b7280"}}>{stageLabel(s)}</option>)}</select></td>
                  <td style={{fontSize:11,whiteSpace:"nowrap"}}>{lastDate ? <span>{fmtD(lastDate)}<span style={{fontSize:9,color:"var(--text3)",marginLeft:3}}>({ordLabel[lastN]})</span></span> : EM}</td>
                  <td style={{fontSize:11,whiteSpace:"nowrap"}}>{nextDue ? <span title={ordLabel[nextStep]+" follow-up"}>{fmtD(nextDue)}<span style={{fontSize:9,color:"var(--text3)",marginLeft:3}}>({ordLabel[nextStep]})</span></span> : <span style={{color:"var(--text3)"}}>{status==="done"?EM:EM}</span>}</td>
                  <td style={{fontSize:12,fontWeight:600,whiteSpace:"nowrap",color:daysUntilDue!==null&&daysUntilDue<0?"var(--red)":daysUntilDue!==null&&daysUntilDue<=2?"#d97706":"var(--text)"}}>{daysUntilDue!==null?(daysUntilDue<0?pluralDays(daysUntilDue)+" overdue":daysUntilDue===0?"due today":"in "+pluralDays(daysUntilDue)):EM}</td>
                  <td>{status==="done"?<span style={{fontSize:10,color:"var(--text3)"}}>—</span>:<span style={{fontSize:10,fontWeight:600,padding:"2px 8px",borderRadius:10,background:priStyle.bg,color:priStyle.color}}>{priStyle.label}</span>}</td>
                  <td>
                    <div style={{display:"flex",alignItems:"center",gap:6}}>
                      <span style={{fontSize:11,color:status==="done"?"var(--text3)":"var(--text)"}}>{nextAction||EM}</span>
                      {emailAddr ? <button className="act-btn" style={{fontSize:9,padding:"2px 6px",background:"var(--accent)",color:"white",border:"none",borderRadius:4,cursor:"pointer",whiteSpace:"nowrap",flexShrink:0}} onClick={e=>{e.stopPropagation();const subj=encodeURIComponent("Guest feedback insights for "+t.hotel);const body=encodeURIComponent(`Hi ${gmFirst},\n\nI recently reviewed guest feedback trends for ${t.hotel}...\n\nBest,\nZishuo Wang | Where to know`);const webUrl=`https://outlook.office.com/mail/deeplink/compose?to=${encodeURIComponent(emailAddr)}&subject=${subj}&body=${body}`;const t0=Date.now();window.location.href=`ms-outlook://compose?to=${encodeURIComponent(emailAddr)}&subject=${subj}&body=${body}`;setTimeout(()=>{if(Date.now()-t0<1500)window.open(webUrl);},1200);}}>✉ Email</button>
                      : <button className="act-btn" style={{fontSize:9,padding:"2px 6px",background:"transparent",color:"var(--text3)",border:"1px solid var(--border)",borderRadius:4,cursor:"pointer",whiteSpace:"nowrap",flexShrink:0}} onClick={e=>{e.stopPropagation();setSelected(t.prospect_id);}}>+ Add email</button>}
                    </div>
                  </td>
                  <td><span style={{fontSize:11,color:"var(--text3)"}}>{t.sdr||EM}</span></td>
                </tr>
                {isExp && <tr><td colSpan={8} style={{background:"#f9fafb",padding:"10px 16px"}}>
                  <div style={{display:"flex",gap:12,alignItems:"flex-start"}}>
                    {[1,2,3,4].map(n => {
                      const hasActual = !!actual[n];
                      const isDue = nextStep === n;
                      const dueDate = due[n];
                      const dotColor = hasActual ? "#059669" : isDue ? "#d97706" : "#d1d5db";
                      const label = n === 1 ? "Email #1" : `Follow-up #${n-1}`;
                      return (<div key={n} style={{flex:1,minWidth:0,textAlign:"center"}}>
                        <div style={{width:10,height:10,borderRadius:"50%",background:dotColor,margin:"0 auto 4px"}}/>
                        <div style={{fontSize:10,fontWeight:600,color:hasActual?"#059669":isDue?"#d97706":"var(--text3)"}}>{label}</div>
                        <input type="date" value={toInput(actual[n])} onChange={e=>updateDate(t.id,n,e.target.value)} onClick={e=>e.stopPropagation()}
                          style={{fontSize:11,border:"1px solid var(--border2)",borderRadius:4,padding:"2px 4px",width:"100%",fontFamily:"inherit",cursor:"pointer",marginTop:2}} />
                        {n >= 2 && !hasActual && <div style={{fontSize:8,color:"var(--text3)",marginTop:1}}>Due: {dueDate ? fmtD(dueDate) : "—"}</div>}
                        {hasActual && <div style={{fontSize:8,color:"#059669",marginTop:1}}>{"\u2713"} {fmtD(actual[n])}</div>}
                      </div>);
                    })}
                  </div>
                </td></tr>}
              </Fragment>);
            })}
          </tbody></table></div>
          {totalCtPages > 1 && (
            <div style={{display:"flex",alignItems:"center",justifyContent:"center",gap:6,padding:"12px",borderTop:"1px solid var(--border)"}}>
              <button className="act-btn" disabled={ctPage===1} onClick={()=>setCtPage(p=>p-1)}>← Prev</button>
              {Array.from({length:Math.min(totalCtPages,7)}, (_,i) => {
                let page;
                if (totalCtPages <= 7) page = i+1;
                else if (ctPage <= 4) page = i+1;
                else if (ctPage >= totalCtPages-3) page = totalCtPages-6+i;
                else page = ctPage-3+i;
                return <button key={page} className={`act-btn ${ctPage===page?"success":""}`} style={{minWidth:32}} onClick={()=>setCtPage(page)}>{page}</button>;
              })}
              <button className="act-btn" disabled={ctPage===totalCtPages} onClick={()=>setCtPage(p=>p+1)}>Next →</button>
              <span style={{fontSize:11,color:"var(--text3)",marginLeft:4}}>{(ctPage-1)*CT_PER_PAGE+1}–{Math.min(ctPage*CT_PER_PAGE,sortedRows.length)} of {sortedRows.length}</span>
            </div>
          )}
          </>); })()}
        </>)}
        </>);
      })()}
        </div>
      </div>

      {deleteConfirm && (
        <div className="confirm-overlay" onClick={()=>setDeleteConfirm(null)}>
          <div className="confirm-box" onClick={e=>e.stopPropagation()}>
            <div className="confirm-title">Delete this prospect?</div>
            <div className="confirm-sub">This will permanently remove the hotel and all outreach history from the shared database. This action cannot be undone.</div>
            <div className="confirm-btns">
              <button className="confirm-cancel" onClick={()=>setDeleteConfirm(null)}>Cancel</button>
              <button className="confirm-del" onClick={()=>deleteProspect(deleteConfirm)}>Delete permanently</button>
            </div>
          </div>
        </div>
      )}

      {/* Duplicate Finder Modal */}
      {dupGroups !== null && (
        <div className="confirm-overlay" style={{zIndex:65}} onClick={()=>setDupGroups(null)}>
          <div className="dup-modal" onClick={e=>e.stopPropagation()}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:16}}>
              <div>
                <div style={{fontSize:16,fontWeight:700}}>Duplicate Finder</div>
                <div style={{fontSize:12,color:"var(--text3)",marginTop:2}}>
                  {dupGroups.length === 0 ? "No duplicates found." : `${dupGroups.length} suspected duplicate group${dupGroups.length>1?"s":""} found`}
                </div>
              </div>
              <div style={{display:"flex",gap:8,alignItems:"center"}}>
                {dupGroups.length > 0 && <button className="act-btn" style={{fontSize:11,background:"#991b1b",color:"white",border:"none",borderRadius:4,padding:"6px 12px",cursor:"pointer",fontWeight:600}} onClick={async()=>{
                  const identicalGroups = dupGroups.filter(g=>g.confidence==="Identical");
                  if(!identicalGroups.length) return alert("No Identical groups found.");
                  if(!confirm(`Auto-merge ${identicalGroups.length} Identical groups? These are exact same-name duplicates. The entry with the most data will be kept for each.`)) return;
                  const allDeleteIds = [];
                  for(const g of identicalGroups){
                    const scored = g.hotels.map(h=>({h,s:(h.website?2:0)+(h.rooms?2:0)+(h.gm_name?2:0)+(h.email?2:0)+(h.address?1:0)+((h.hotel_name||"").length>25?1:0)}));
                    scored.sort((a,b)=>b.s-a.s);
                    scored.slice(1).forEach(x=>allDeleteIds.push(x.h.id));
                  }
                  try{
                    const CHUNK=100;
                    for(let i=0;i<allDeleteIds.length;i+=CHUNK){
                      const batch=allDeleteIds.slice(i,i+CHUNK);
                      const ids=batch.map(id=>`"${id}"`).join(",");
                      await sbFetch(`/tracking?prospect_id=in.(${ids})`,{method:"DELETE",prefer:"return=minimal"}).catch(()=>{});
                      await sbFetch(`/prospects?id=in.(${ids})`,{method:"DELETE",prefer:"return=minimal"});
                    }
                    setProspects(prev=>prev.filter(p=>!allDeleteIds.includes(p.id)));
                    setTracking(prev=>prev.filter(t=>!allDeleteIds.includes(t.prospect_id)));
                    setDupGroups(prev=>prev.filter(g=>g.confidence!=="Identical"));
                    alert(`✓ Merged ${identicalGroups.length} groups, deleted ${allDeleteIds.length} duplicates.`);
                  }catch(e){alert("Error: "+e.message);}
                }}>Merge All Identical ({dupGroups.filter(g=>g.confidence==="Identical").length})</button>}
                <button className="act-btn" onClick={()=>setDupGroups(null)} style={{fontSize:16,padding:"4px 10px"}}>✕</button>
              </div>
            </div>
            {dupGroups.map((g, gi) => {
              const isExp = dupExpanded.has(gi);
              const badge = g.confidence === "Identical" ? "dup-badge-identical" : g.confidence === "High" ? "dup-badge-high" : g.confidence === "Medium" ? "dup-badge-med" : "dup-badge-low";
              return (
                <div key={gi} className="dup-group">
                  <div className="dup-group-hdr" onClick={()=>setDupExpanded(prev=>{const n=new Set(prev);n.has(gi)?n.delete(gi):n.add(gi);return n;})}>
                    <span>{isExp ? "▾" : "▸"}</span>
                    <span className={badge}>{g.confidence}</span>
                    <span style={{flex:1}}>{g.hotels.map(h=>h.hotel_name).join(" / ")}</span>
                    <span style={{fontSize:10,color:"var(--text3)"}}>{g.hotels.length} hotels</span>
                  </div>
                  {isExp && (
                    <>
                      <div style={{padding:"4px 14px",fontSize:10,color:"var(--text3)",background:"var(--bg2)"}}>{g.reason}</div>
                      <div className="dup-hotels">
                        <div className="dup-hotel-row" style={{fontWeight:600,fontSize:10,color:"var(--text3)"}}>
                          <span>Hotel</span><span>City</span><span>Brand</span><span>Rooms</span><span>ADR</span><span>Contact / Email</span><span></span>
                        </div>
                        {g.hotels.map(h => (
                          <div key={h.id} className="dup-hotel-row">
                            <div>
                              <div style={{fontWeight:500,cursor:"pointer",color:"var(--accent)",textDecoration:"underline"}} onClick={()=>setSelected(h.id)}>{h.hotel_name}</div>
                              <div style={{fontSize:9,color:"var(--text3)",marginTop:1}}>{h.website ? new URL(h.website.startsWith("http")?h.website:"https://"+h.website).hostname.replace("www.","") : "\u2014"}</div>
                            </div>
                            <span>{h.city||"\u2014"}</span>
                            <span>{normalizeBrand(h.brand)||"\u2014"}</span>
                            <span>{h.rooms||"\u2014"}</span>
                            <span>{h.adr_usd ? "$"+h.adr_usd : "\u2014"}</span>
                            <div>
                              <div style={{fontSize:10}}>{h.gm_name||"\u2014"}</div>
                              <div style={{fontSize:9,color:"var(--text3)"}}>{h.email||""}</div>
                            </div>
                            <button className="dup-keep-btn" onClick={async()=>{
                              const deleteIds = g.hotels.filter(x=>x.id!==h.id).map(x=>x.id);
                              if(!confirm(`Keep "${h.hotel_name}" and delete ${deleteIds.length} other(s)?`)) return;
                              try{
                                for(const id of deleteIds){
                                  await sbFetch(`/tracking?prospect_id=eq.${id}`,{method:"DELETE",prefer:"return=minimal"}).catch(()=>{});
                                  await sbFetch(`/prospects?id=eq.${id}`,{method:"DELETE",prefer:"return=minimal"});
                                }
                                setProspects(prev=>prev.filter(p=>!deleteIds.includes(p.id)));
                                setTracking(prev=>prev.filter(t=>!deleteIds.includes(t.prospect_id)));
                                setDupGroups(prev=>prev.filter((_,i)=>i!==gi));
                              }catch(e){alert("Delete error: "+e.message);}
                            }}>Keep</button>
                          </div>
                        ))}
                      </div>
                      <div className="dup-actions">
                        <button className="act-btn" style={{fontSize:11}} onClick={()=>setDupGroups(prev=>prev.filter((_,i)=>i!==gi))}>Not duplicate</button>
                      </div>
                    </>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
      {/* Add Hotel Modal */}
      {addHotelModal && (
        <div className="modal-overlay" onClick={()=>setAddHotelModal(false)}>
          <div className="modal" style={{maxWidth:560}} onClick={e=>e.stopPropagation()}>
            <div className="modal-title">Add Hotel</div>
            <div className="add-hotel-grid">
              <label className="full-width">Hotel Name *<input value={addHotelForm.hotel_name||""} onChange={e=>setAddHotelForm(p=>({...p,hotel_name:e.target.value}))} placeholder="e.g. Kimpton Hotel Monaco DC"/></label>
              <label>City<input value={addHotelForm.city||""} onChange={e=>setAddHotelForm(p=>({...p,city:e.target.value}))} placeholder="Washington"/></label>
              <label>Country<input value={addHotelForm.country||""} onChange={e=>setAddHotelForm(p=>({...p,country:e.target.value}))} placeholder="United States"/></label>
              <label>Group<input value={addHotelForm.hotel_group||""} onChange={e=>setAddHotelForm(p=>({...p,hotel_group:e.target.value}))} placeholder="IHG"/></label>
              <label>Brand<input value={addHotelForm.brand||""} onChange={e=>setAddHotelForm(p=>({...p,brand:e.target.value}))} placeholder="Kimpton"/></label>
              <label>Address<input value={addHotelForm.address||""} onChange={e=>setAddHotelForm(p=>({...p,address:e.target.value}))} placeholder="1726 M St NW"/></label>
              <label>Website<input value={addHotelForm.website||""} onChange={e=>setAddHotelForm(p=>({...p,website:e.target.value}))} placeholder="https://..."/></label>
              <label>ADR (USD)<input type="number" value={addHotelForm.adr_usd||""} onChange={e=>setAddHotelForm(p=>({...p,adr_usd:e.target.value}))} placeholder="250"/></label>
              <label>Rooms<input type="number" value={addHotelForm.rooms||""} onChange={e=>setAddHotelForm(p=>({...p,rooms:e.target.value}))} placeholder="335"/></label>
              <label>Provider<select value={addHotelForm.current_provider||""} onChange={e=>setAddHotelForm(p=>({...p,current_provider:e.target.value}))}>
                <option value="">Select...</option>
                {["Medallia","Qualtrics","ReviewPro","TrustYou","Revinate","Reputation.com","Unknown","Other"].map(p=><option key={p} value={p}>{p}</option>)}
              </select></label>
              <div style={{gridColumn:"1/-1",borderTop:"1px solid var(--border)",marginTop:4,paddingTop:8}}>
                <div style={{fontSize:10,fontWeight:700,color:"var(--text3)",textTransform:"uppercase",letterSpacing:"0.06em",marginBottom:8}}>Decision Maker</div>
                <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8}}>
                  <label>Contact Name<input value={addHotelForm.gm_name||""} onChange={e=>setAddHotelForm(p=>({...p,gm_name:e.target.value}))} placeholder="e.g. John Smith"/></label>
                  <label>Title<input value={addHotelForm.gm_title||""} onChange={e=>setAddHotelForm(p=>({...p,gm_title:e.target.value}))} placeholder="General Manager"/></label>
                  <label>Email<input value={addHotelForm.email||""} onChange={e=>setAddHotelForm(p=>({...p,email:e.target.value}))} placeholder="gm@hotel.com" type="email"/></label>
                  <label>LinkedIn<input value={addHotelForm.linkedin||""} onChange={e=>setAddHotelForm(p=>({...p,linkedin:e.target.value}))} placeholder="linkedin.com/in/..."/></label>
                </div>
              </div>
              <div style={{gridColumn:"1/-1",borderTop:"1px solid var(--border)",marginTop:4,paddingTop:8}}>
                <div style={{fontSize:10,fontWeight:700,color:"var(--text3)",textTransform:"uppercase",letterSpacing:"0.06em",marginBottom:8}}>Operations</div>
                <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8}}>
                  <label>Mgmt Company<input value={addHotelForm.management_company||""} onChange={e=>setAddHotelForm(p=>({...p,management_company:e.target.value}))} placeholder="e.g. IHG Hotels & Resorts"/></label>
                  <label>Operating Model<select value={addHotelForm.operating_model||""} onChange={e=>setAddHotelForm(p=>({...p,operating_model:e.target.value}))}>
                    <option value="">Select...</option>
                    {["Owned","Managed","Franchised","Leased","Other"].map(o=><option key={o} value={o}>{o}</option>)}
                  </select></label>
                </div>
              </div>
              <label className="full-width">Notes<input value={addHotelForm.notes||""} onChange={e=>setAddHotelForm(p=>({...p,notes:e.target.value}))} placeholder="Any context..."/></label>
            </div>
            <div className="modal-footer">
              <button className="modal-cancel" onClick={()=>setAddHotelModal(false)}>Cancel</button>
              <button className="modal-confirm" disabled={!(addHotelForm.hotel_name && addHotelForm.hotel_name.trim())} style={{opacity:(addHotelForm.hotel_name && addHotelForm.hotel_name.trim())?1:0.5}} onClick={saveManualHotel}>Save Hotel</button>
            </div>
          </div>
        </div>
      )}

      {rejectModal && (
        <div className="modal-overlay" onClick={()=>setRejectModal(null)}>
          <div className="modal" onClick={e=>e.stopPropagation()}>
            <div className="modal-title">Mark as Lost</div>
            <div className="modal-sub">Select lost reason (required)</div>
            <div className="reason-grid">
              {REJECTION_REASONS.map(r=>(
                <button key={r} className={`reason-btn ${rejectReason===r?"selected":""}`} onClick={()=>setRejectReason(r)}>{r}</button>
              ))}
            </div>
            {rejectReason === "Other" && (
              <div style={{marginBottom:12}}>
                <input className="cmd-input" style={{width:"100%"}} placeholder="Please specify reason (required)..." 
                  value={rejectOtherText||""} onChange={e=>setRejectOtherText(e.target.value)} autoFocus />
              </div>
            )}
            <div className="modal-footer">
              <button className="modal-cancel" onClick={()=>setRejectModal(null)}>Cancel</button>
              <button className="modal-confirm danger-btn" 
                disabled={!rejectReason || (rejectReason==="Other" && (!rejectOtherText || rejectOtherText.trim().length<3))}
                style={{opacity: (!rejectReason || (rejectReason==="Other" && (!rejectOtherText || rejectOtherText.trim().length<3))) ? 0.5 : 1}}
                onClick={confirmReject}>Confirm</button>
            </div>
          </div>
        </div>
      )}

      {sel && (
        <>
          <div className="overlay" onClick={()=>{ if (!rejectModal) setSelected(null); }}/>
          <div className="drawer" onClick={e => e.stopPropagation()}>
            <button className="drawer-close" onClick={()=>setSelected(null)}>✕</button>
            <div className="drawer-hotel">{sel.hotel_name}</div>
            <div className="drawer-meta">{sel.brand}{sel.hotel_group && sel.hotel_group !== sel.brand ? ` · ${sel.hotel_group}` : ""} · {sel.city}, {sel.country} · Added by {sel.sdr} · {fmtDateShort(sel.created_at)}</div>
            <div className="d-sec">
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:10}}>
                <span className="d-sec-title" style={{margin:0}}>Property</span>
              </div>
              <div className="d-row"><span className="d-key">Address</span><span className="d-val"><EditableField value={sel.address} placeholder="Add address" onSave={v => updateProspectField(sel.id, 'address', v)} /></span></div>
              <div className="d-row"><span className="d-key">Rooms</span><span className="d-val"><EditableField value={sel.rooms ? String(sel.rooms) : ""} placeholder="Add rooms" type="number" onSave={v => updateProspectField(sel.id, 'rooms', v)} /></span></div>
              <div className="d-row"><span className="d-key">Restaurants</span><span className="d-val"><EditableField value={sel.restaurants ? String(sel.restaurants) : ""} placeholder="Add count" type="number" onSave={v => updateProspectField(sel.id, 'restaurants', v)} /></span></div>
              <div className="d-row"><span className="d-key">Est. ADR</span><span className="d-val"><EditableField value={sel.adr_usd ? String(sel.adr_usd) : ""} placeholder="Add ADR (USD)" type="number" onSave={v => updateProspectField(sel.id, 'adr_usd', v)} /></span></div>
              <div className="d-row"><span className="d-key">Rating</span><span className="d-val">
                {(() => {
                  if (!sel.rating) return <EditableField value="" placeholder="Add rating" type="number" onSave={v => updateProspectField(sel.id, 'rating', v)} />;
                  const notes = (sel.research_notes || "").toLowerCase();
                  const hasGoogle = notes.includes("google");
                  const hasBooking = notes.includes("booking");
                  const hasTripAdvisor = notes.includes("tripadvisor");
                  const hasAgoda = notes.includes("agoda");
                  const hasTripCom = notes.includes("trip.com");
                  let src = null, scale = null;
                  if (hasBooking && !hasGoogle) { src = "Booking.com"; scale = 10; }
                  else if (hasGoogle && !hasBooking) { src = "Google"; scale = 5; }
                  else if (hasTripAdvisor) { src = "TripAdvisor"; scale = 5; }
                  else if (hasAgoda) { src = "Agoda"; scale = 10; }
                  else if (hasTripCom) { src = "Trip.com"; scale = 10; }
                  else { return <span><EditableField value={String(sel.rating)} onSave={v => updateProspectField(sel.id, 'rating', v)} type="number" /> <span style={{fontSize:11,color:"var(--text3)"}}>({sel.review_count ? `${Number(sel.review_count).toLocaleString()} reviews` : ""} · source unknown)</span></span>; }
                  return <span><EditableField value={String(sel.rating)} onSave={v => updateProspectField(sel.id, 'rating', v)} type="number" /> / {scale} <span style={{fontSize:11,color:"var(--text3)"}}>({sel.review_count ? `${Number(sel.review_count).toLocaleString()} reviews, ` : ""}{src})</span></span>;
                })()}
              </span></div>
              <div className="d-row"><span className="d-key">Brand</span><span className="d-val"><EditableField value={sel.brand || ""} placeholder="Add brand" onSave={v => updateProspectField(sel.id, 'brand', v)} /></span></div>
              <div className="d-row"><span className="d-key">Group</span><span className="d-val"><EditableField value={sel.hotel_group || ""} placeholder="Add group" onSave={v => updateProspectField(sel.id, 'hotel_group', v)} /></span></div>
              <div className="d-row"><span className="d-key">Tech Provider</span><span className="d-val"><EditableField value={getProvider(sel) || ""} placeholder="Add provider" onSave={v => updateProspectField(sel.id, 'current_provider', v)} options={["Medallia","Qualtrics","ReviewPro","TrustYou","Revinate","Reputation.com","Olery","Guestfeedback"]} /></span></div>
              <div className="d-row"><span className="d-key">Website</span><span className="d-val">{sel.website?<a className="email-link" href={sel.website.startsWith("http")?sel.website:`https://${sel.website}`} target="_blank" rel="noreferrer" title={sel.website}>↗ {sel.website.replace(/^https?:\/\/(www\.)?/,"").slice(0,40)}</a>:<EditableField value="" placeholder="Add URL" onSave={v => updateProspectField(sel.id, 'website', v)} />}</span></div>
            </div>
            <div className="d-sec">
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:10}}>
                <span className="d-sec-title" style={{margin:0}}>Contacts</span>
                <button className="act-btn" style={{fontSize:11,padding:"3px 10px"}} onClick={()=>setAddContactForm(sel.id)}>+ Add</button>
              </div>
              {(() => {
                const ctList = parseContacts(sel.id);
                if (ctList.length === 0) return (
                  <div style={{fontSize:12,color:"var(--text3)",fontStyle:"italic",padding:"8px 0"}}>
                    No contacts yet. <span style={{cursor:"pointer",color:"var(--accent)"}} onClick={()=>setAddContactForm(sel.id)}>Add one →</span>
                  </div>
                );
                return ctList.map((c, ci) => (
                  <div key={c.id||ci} style={{border:"1px solid var(--border)",borderRadius:6,padding:"10px 12px",marginBottom:8,background:c.is_primary?"var(--accent-light)":"var(--bg)"}}>
                    <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:6}}>
                      <div style={{flex:1,marginRight:8}}>
                        <EditableField value={c.name} placeholder="(No name)" onSave={v=>{const u=[...ctList];u[ci]={...u[ci],name:v};saveContacts(sel.id,u);}} />
                        {c.is_primary && <span style={{fontSize:9,fontWeight:700,background:"var(--accent)",color:"white",padding:"1px 6px",borderRadius:10,marginLeft:6}}>PRIMARY</span>}
                      </div>
                      <div style={{display:"flex",gap:4}}>
                        {!c.is_primary && <button className="act-btn" style={{fontSize:9,padding:"2px 6px"}} onClick={()=>{const updated=ctList.map((x,xi)=>({...x,is_primary:xi===ci}));saveContacts(sel.id,updated);}}>Set Primary</button>}
                        <button className="del-btn" style={{fontSize:11}} onClick={()=>{if(ctList.length===1&&c.is_primary){alert("Cannot remove the only primary contact.");return;}const updated=ctList.filter((_,xi)=>xi!==ci);if(c.is_primary&&updated.length>0)updated[0].is_primary=true;saveContacts(sel.id,updated);}}>🗑</button>
                      </div>
                    </div>
                    <div style={{display:"grid",gridTemplateColumns:"80px 1fr",gap:"4px 8px",fontSize:12}}>
                      <span style={{color:"var(--text3)"}}>Title</span><EditableField value={c.title} placeholder="General Manager" onSave={v=>{const u=[...ctList];u[ci]={...u[ci],title:v};saveContacts(sel.id,u);}} />
                      <span style={{color:"var(--text3)"}}>Email</span><EditableField value={c.email} placeholder="Add email" onSave={v=>{const u=[...ctList];u[ci]={...u[ci],email:v};saveContacts(sel.id,u);}} />
                      <span style={{color:"var(--text3)"}}>LinkedIn</span><EditableField value={c.linkedin} placeholder="Add LinkedIn" onSave={v=>{const u=[...ctList];u[ci]={...u[ci],linkedin:v};saveContacts(sel.id,u);}} />
                      <span style={{color:"var(--text3)"}}>Phone</span><EditableField value={c.phone} placeholder="Add phone" onSave={v=>{const u=[...ctList];u[ci]={...u[ci],phone:v};saveContacts(sel.id,u);}} />
                    </div>
                  </div>
                ));
              })()}
              {addContactForm === sel.id && (
                  <div style={{border:"1px dashed var(--accent)",borderRadius:6,padding:"10px 12px",background:"#f8faff"}}>
                    <div style={{fontSize:12,fontWeight:600,color:"var(--accent)",marginBottom:8}}>New Contact</div>
                    <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:6,fontSize:12}}>
                      <label style={{display:"flex",flexDirection:"column",gap:2}}>Name<input style={{fontSize:12,border:"1px solid var(--border2)",borderRadius:4,padding:"4px 6px"}} value={addContactDraft.name} onChange={e=>setAddContactDraft(d=>({...d,name:e.target.value}))} placeholder="Full name"/></label>
                      <label style={{display:"flex",flexDirection:"column",gap:2}}>Title<input style={{fontSize:12,border:"1px solid var(--border2)",borderRadius:4,padding:"4px 6px"}} value={addContactDraft.title} onChange={e=>setAddContactDraft(d=>({...d,title:e.target.value}))} placeholder="General Manager"/></label>
                      <label style={{display:"flex",flexDirection:"column",gap:2}}>Email<input style={{fontSize:12,border:"1px solid var(--border2)",borderRadius:4,padding:"4px 6px"}} value={addContactDraft.email} onChange={e=>setAddContactDraft(d=>({...d,email:e.target.value}))} placeholder="email@hotel.com"/></label>
                      <label style={{display:"flex",flexDirection:"column",gap:2}}>LinkedIn<input style={{fontSize:12,border:"1px solid var(--border2)",borderRadius:4,padding:"4px 6px"}} value={addContactDraft.linkedin} onChange={e=>setAddContactDraft(d=>({...d,linkedin:e.target.value}))} placeholder="linkedin.com/in/..."/></label>
                      <label style={{display:"flex",flexDirection:"column",gap:2}}>Phone<input style={{fontSize:12,border:"1px solid var(--border2)",borderRadius:4,padding:"4px 6px"}} value={addContactDraft.phone} onChange={e=>setAddContactDraft(d=>({...d,phone:e.target.value}))} placeholder="+1 ..."/></label>
                    </div>
                    <div style={{display:"flex",gap:6,marginTop:8,alignItems:"center"}}>
                      <label style={{fontSize:11,display:"flex",alignItems:"center",gap:4,cursor:"pointer"}}><input type="checkbox" checked={addContactDraft.is_primary} onChange={e=>setAddContactDraft(d=>({...d,is_primary:e.target.checked}))}/> Set as primary</label>
                      <div style={{marginLeft:"auto",display:"flex",gap:6}}>
                        <button className="modal-cancel" style={{padding:"4px 10px",fontSize:12}} onClick={()=>{setAddContactForm(null);setAddContactDraft({name:"",title:"",email:"",linkedin:"",phone:"",is_primary:false});}}>Cancel</button>
                        <button className="modal-confirm" style={{padding:"4px 10px",fontSize:12}} onClick={()=>{
                          if (!addContactDraft.name.trim()) { alert("Name required"); return; }
                          const existing = parseContacts(sel.id);
                          const newC = {...addContactDraft, id: uid()};
                          let updated;
                          if (newC.is_primary || existing.length===0) {
                            updated = [...existing.map(c=>({...c,is_primary:false})), {...newC,is_primary:true}];
                          } else {
                            updated = [...existing, newC];
                          }
                          saveContacts(sel.id, updated);
                          setAddContactForm(null);
                          setAddContactDraft({name:"",title:"",email:"",linkedin:"",phone:"",is_primary:false});
                        }}>Save</button>
                      </div>
                    </div>
                  </div>
              )}
            </div>
            {(() => {
              const trk = tracking.find(x => x.prospect_id === sel.id);
              if (!trk) return null;
              const DS = [
                {key:"new",label:"New",color:"#6b7280"},{key:"1st",label:"Email #1",color:"#2563eb"},
                {key:"2nd",label:"Follow-up #1",color:"#0891b2"},{key:"3rd",label:"Follow-up #2",color:"#7c3aed"},
                {key:"4th",label:"Follow-up #3",color:"#6d28d9"},{key:"replied",label:"Replied",color:"#0d9488"},
                {key:"bounced",label:"Bounced",color:"#b45309"},{key:"demo",label:"Demo",color:"#c026d3"},
                {key:"trial",label:"Trial",color:"#ea580c"},{key:"won",label:"Won",color:"#059669"},
                {key:"lost",label:"Lost",color:"#dc2626"}
              ];
              const ms = s => { if (s==="active") return "new"; if (s==="emailed") return "1st"; if (s==="followup") return "2nd"; if (s==="dead") return "lost"; return s; };
              const stage = ms(trk.pipeline_stage || "new");
              const so = DS.find(s=>s.key===stage) || DS[0];
              return (
                <div className="d-sec">
                  <div className="d-sec-title">Pipeline Status</div>
                  <div className="d-row">
                    <span className="d-key">Stage</span>
                    <span className="d-val">
                      <select
                        value={stage}
                        onChange={async e => {
                          const newStage = e.target.value;
                          if (newStage === "lost") { openRejectModal(trk.id, "lost"); return; }
                          const updates = { pipeline_stage: newStage };
                          if (newStage !== "lost" && trk.rejection_reason) updates.rejection_reason = null;
                          if (newStage === "new") { updates.d1=null; updates.d2=null; updates.d3=null; updates.d4=null; updates.done=[]; }
                          await updatePipeline(trk.id, updates);
                        }}
                        style={{fontSize:13,fontWeight:700,color:so.color,background:"transparent",border:"1px solid var(--border2)",borderRadius:5,padding:"3px 8px",cursor:"pointer",fontFamily:"'Inter',sans-serif"}}
                      >
                        {DS.map(s => <option key={s.key} value={s.key} style={{color:s.color}}>{s.label}</option>)}
                      </select>
                    </span>
                  </div>
                  {trk.intention > 0 && <div className="d-row"><span className="d-key">Intent</span><span className="d-val">{trk.intention}/5 {String.fromCodePoint(0x2014)} {({1:"Cold",2:"Low",3:"Medium",4:"Warm",5:"Hot"})[trk.intention]||""}</span></div>}
                  {trk.rejection_reason && <div className="d-row"><span className="d-key">Lost Reason</span><span className="d-val" style={{color:"var(--red)"}}><EditableField value={trk.rejection_reason} placeholder="Add reason" onSave={async v=>{await updatePipeline(trk.id,{rejection_reason:v||null});}} /></span></div>}
                  <div style={{marginTop:10}}>
                    <div style={{fontSize:10,fontWeight:700,color:"var(--text3)",textTransform:"uppercase",letterSpacing:"0.04em",marginBottom:6}}>Activity Timeline</div>
                    {(trk.done||[]).map(n => {
                      const d = trk["d"+n];
                      const lbl = {1:"Email #1 sent",2:"Follow-up #1 sent",3:"Follow-up #2 sent",4:"Follow-up #3 sent"};
                      return <div key={n} style={{fontSize:11,color:"var(--text2)",padding:"2px 0",display:"flex",gap:8}}>
                        <span style={{color:"var(--text3)",minWidth:70}}>{d?fmtDate(d):"\u2014"}</span>
                        <span>{lbl[n]||("Touch "+n)}</span>
                      </div>;
                    })}
                    {(trk.done||[]).length===0 && <div style={{fontSize:11,color:"var(--text3)",fontStyle:"italic"}}>No contacts yet</div>}
                  </div>
                </div>
              );
            })()}
            <div className="d-sec">
              <div className="d-sec-title">Hotel Profile</div>
              <div className="d-row"><span className="d-key">Lead Status</span><span className="d-val"><select style={{fontSize:12,border:"1px solid var(--border2)",borderRadius:4,padding:"2px 4px"}} value={sel.lead_status||"Active"} onChange={e=>updateProspect(sel.id,{lead_status:e.target.value})}><option value="Active">Active</option><option value="Dormant">Dormant</option><option value="Closed">Closed</option></select></span></div>
              <div className="d-row"><span className="d-key">Management</span><span className="d-val"><input type="text" style={{fontSize:12,border:"1px solid var(--border2)",borderRadius:4,padding:"2px 4px",width:"100%"}} defaultValue={sel.management_company||""} placeholder="e.g. IHG Hotels & Resorts" onBlur={e=>{const v=e.target.value.trim();if(v!==(sel.management_company||""))updateProspect(sel.id,{management_company:v||null});}}/></span></div>
              <div className="d-row"><span className="d-key">Op. Model</span><span className="d-val"><select style={{fontSize:12,border:"1px solid var(--border2)",borderRadius:4,padding:"2px 4px"}} value={sel.operating_model||""} onChange={e=>updateProspect(sel.id,{operating_model:e.target.value||null})}><option value="">Select...</option><option value="Owned">Owned</option><option value="Managed">Managed</option><option value="Franchised">Franchised</option><option value="Leased">Leased</option><option value="Other">Other</option></select></span></div>
              {sel.operating_model==="Other"&&<div className="d-row"><span className="d-key">Model Note</span><span className="d-val"><input type="text" style={{fontSize:12,border:"1px solid var(--border2)",borderRadius:4,padding:"2px 4px",width:"100%"}} defaultValue={sel.operating_model_note||""} placeholder="Required for Other" onBlur={e=>{const v=e.target.value.trim();if(v.length<3){alert("Note required (min 3 chars)");return;}updateProspect(sel.id,{operating_model_note:v});}}/></span></div>}
            </div>
            {(() => {
              const trk = tracking.find(x => x.prospect_id === sel.id);
              if (!trk) return null;
              return (
                <div className="d-sec">
                  <div className="d-sec-title">Sales Notes</div>
                  <textarea className="note-input" style={{width:"100%",minHeight:60,fontSize:12,padding:6,border:"1px solid var(--border2)",borderRadius:5,fontFamily:"inherit",resize:"vertical"}}
                    value={editingNote === trk.id ? noteText : (trk.sales_notes || "")}
                    onFocus={() => { if (editingNote !== trk.id) { setEditingNote(trk.id); setNoteText(trk.sales_notes || ""); } }}
                    onChange={e => setNoteText(e.target.value)}
                    onBlur={() => { if (editingNote === trk.id) saveNote(trk.id); }}
                    placeholder="Add sales notes..." />
                </div>
              );
            })()}
            {(sel.outreach_email_subject || sel.outreach_email_body) && (
              <div className="d-sec">
                <div className="d-sec-title">4-Touch Email Sequence</div>
                <div className="email-touch">
                  <div className="touch-hdr">Touch 1 <span className="tag">Day 1 · Initial</span></div>
                  <div className="subject-line">Subject: {sel.outreach_email_subject||"—"}</div>
                  <EmailBody text={sel.outreach_email_body} />
                  <button className={`copy-btn ${copied==="e1"?"copied":""}`} onClick={()=>copy(`Subject: ${sel.outreach_email_subject}\n\n${sel.outreach_email_body}`,"e1")}>{copied==="e1"?"✓ Copied":"Copy"}</button>
                </div>
                <div className="email-touch">
                  <div className="touch-hdr">Touch 2 <span className="tag">Day 4 · Reply in thread</span></div>
                  <div className="subject-line">Subject: Re: {sel.outreach_email_subject}</div>
                  <EmailBody text={touch2Body(sel)} />
                  <button className={`copy-btn ${copied==="e2"?"copied":""}`} onClick={()=>copy(touch2Body(sel),"e2")}>{copied==="e2"?"✓ Copied":"Copy"}</button>
                </div>
                <div className="email-touch">
                  <div className="touch-hdr">Touch 3 <span className="tag">Day 9 · New angle</span></div>
                  <EmailBody text={touch3Body(sel)} />
                  <button className={`copy-btn ${copied==="e3"?"copied":""}`} onClick={()=>copy(touch3Body(sel),"e3")}>{copied==="e3"?"✓ Copied":"Copy"}</button>
                </div>
                <div className="email-touch">
                  <div className="touch-hdr">Touch 4 <span className="tag">Day 16 · Close out</span></div>
                  <div className="subject-line">Subject: {sel.hotel_name} — closing the loop</div>
                  <EmailBody text={touch4Body(sel)} />
                  <button className={`copy-btn ${copied==="e4"?"copied":""}`} onClick={()=>copy(touch4Body(sel),"e4")}>{copied==="e4"?"✓ Copied":"Copy"}</button>
                </div>
              </div>
            )}
            {sel.linkedin_dm && (
              <div className="d-sec">
                <div className="d-sec-title">LinkedIn DM</div>
                <div className="email-body">{sel.linkedin_dm}</div>
                <button className={`copy-btn ${copied==="dm"?"copied":""}`} onClick={()=>copy(sel.linkedin_dm,"dm")}>{copied==="dm"?"✓ Copied":"Copy DM"}</button>
              </div>
            )}
            {sel.research_notes && (
              <div className="d-sec">
                <div className="d-sec-title">Research Notes</div>
                <ResearchNotes text={sel.research_notes} />
              </div>
            )}
          </div>
        </>
      )}
    </>
  );

}
