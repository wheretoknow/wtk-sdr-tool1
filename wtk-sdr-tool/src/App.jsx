import { useState, useEffect, useRef, Component } from "react";

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
  // Strip common suffixes for unknown groups
  return g.replace(/\s*(Hotels?( & Resorts?)?|International|Group|Collection|Worldwide|Ltd\.?|Inc\.?|plc|S\.?A\.?|GmbH)\s*/gi, '').trim() || g;
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
  .wtk-icon { width: 28px; height: 28px; background: var(--accent); border-radius: 6px; display: flex; align-items: center; justify-content: center; color: white; font-size: 13px; font-weight: 700; flex-shrink: 0; }
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
  thead th { background: var(--bg); padding: 8px 10px; text-align: left; font-size: 10px; font-weight: 600; color: var(--text3); letter-spacing: 0.05em; text-transform: uppercase; border-bottom: 1px solid var(--border); white-space: nowrap; }
  thead th.sortable { cursor: pointer; user-select: none; }
  thead th.sortable:hover { color: var(--accent); }
  .sort-arrow { font-size: 10px; margin-left: 2px; opacity: 0.4; }
  .sort-arrow.active { opacity: 1; color: var(--accent); }
  tbody tr { border-bottom: 1px solid var(--border); cursor: pointer; transition: background 0.1s; }
  tbody tr:last-child { border-bottom: none; }
  tbody tr:hover { background: #f9fafb; }
  td { padding: 9px 10px; vertical-align: middle; color: var(--text); }
  .hotel-name { font-size: 13px; font-weight: 600; color: var(--text); }
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
  .confirm-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.45); z-index: 200; display: flex; align-items: center; justify-content: center; }
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
  .modal-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.3); z-index: 60; display: flex; align-items: center; justify-content: center; }
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
  .overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.2); z-index: 40; }
  .drawer { position: fixed; top: 0; right: 0; bottom: 0; width: 560px; background: var(--surface); border-left: 1px solid var(--border); z-index: 50; overflow-y: auto; padding: 28px 28px 40px; box-shadow: -8px 0 24px rgba(0,0,0,0.08); animation: slideIn 0.2s ease; }
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
`;

function uid() { return Math.random().toString(36).slice(2, 9); }

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
  // Split on bullet markers (• or - at line start) or newlines
  const lines = text.split(/\n/).map(l => l.trim()).filter(Boolean);
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
    const para = text.trim();
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
  allCountries, allCities, allGroups, allProviders, updateIntention }) {

  const [dragOver, setDragOver] = useState(null);
  const [menuOpen, setMenuOpen] = useState(null);
  const hasActiveFilters = outreachSearch || outreachCountry || outreachCity || outreachGroup || outreachTier || outreachProvider;
  function clearFilters() { setOutreachSearch(""); setOutreachCountry(""); setOutreachCity(""); setOutreachGroup(""); setOutreachTier(""); setOutreachProvider(""); }
  if (filteredT.length === 0 && !hasActiveFilters) return <div className="empty"><div className="empty-icon">{"\u{1F4EC}"}</div><div className="empty-title">No outreach tracked</div><div className="empty-sub">Run research to start the tracker.</div></div>;

  const STAGES = [
    { key: "new", label: "New", color: "#6b7280", bg: "#f9fafb" },
    { key: "1st", label: "1st", color: "#2563eb", bg: "#eff6ff" },
    { key: "2nd", label: "2nd", color: "#0891b2", bg: "#ecfeff" },
    { key: "3rd", label: "3rd", color: "#7c3aed", bg: "#f5f3ff" },
    { key: "4th", label: "4th", color: "#6d28d9", bg: "#ede9fe" },
    { key: "demo", label: "Demo", color: "#c026d3", bg: "#fdf4ff" },
    { key: "trial", label: "Trial", color: "#ea580c", bg: "#fff7ed" },
    { key: "won", label: "Won", color: "#059669", bg: "#ecfdf5" },
    { key: "lost", label: "Lost", color: "#dc2626", bg: "#fef2f2" },
  ];
  const SK = STAGES.map(s => s.key);

  function effectiveStage(t) {
    const s = t.pipeline_stage || "new";
    if (s === "active") return "new";
    if (s === "emailed") return "1st";
    if (s === "followup") return "2nd";
    if (s === "dead") return "lost";
    if (s === "new") { const d = t.done || []; return d.length === 0 ? "new" : d.length === 1 ? "1st" : d.length === 2 ? "2nd" : d.length === 3 ? "3rd" : "4th"; }
    return SK.includes(s) ? s : "new";
  }

  const stageMap = {};
  STAGES.forEach(s => { stageMap[s.key] = []; });
  filteredT.forEach(t => { const s = effectiveStage(t); (stageMap[s] || stageMap["new"]).push(t); });

  const IL = { 1: "Cold", 2: "Low", 3: "Medium", 4: "Warm", 5: "Hot" };
  const IC = { 1: "#9ca3af", 2: "#6b7280", 3: "#eab308", 4: "#f59e0b", 5: "#ef4444" };
  function intLabel(v) { return (!v || v < 1) ? null : { text: IL[v], cls: v >= 4 ? "int-hot" : v >= 3 ? "int-warm" : "int-cold" }; }

  function lastAct(t) {
    const d = t.done || [];
    if (!d.length) return "No contact";
    const last = d[d.length - 1], dt = t["d" + last];
    if (!dt) return "Touch " + last;
    const days = Math.floor((Date.now() - new Date(dt)) / 86400000);
    return days === 0 ? "Today" : days === 1 ? "Yesterday" : days + "d ago";
  }

  function changeStage(tid, stageKey, e) {
    if (e) e.stopPropagation();
    setMenuOpen(null);
    if (stageKey === "lost") { openRejectModal(tid, "lost", e); return; }
    const stageToTouch = { "1st": 1, "2nd": 2, "3rd": 3, "4th": 4 };
    const touchN = stageToTouch[stageKey];
    if (touchN) {
      const now = new Date().toISOString();
      const t = filteredT.find(x => x.id === tid);
      const done = [...((t && t.done) || [])];
      const updates = { pipeline_stage: stageKey };
      // Fill ALL preceding touch dates (e.g. drag New->3rd fills d1,d2,d3)
      for (let i = 1; i <= touchN; i++) {
        if (!done.includes(i)) done.push(i);
        if (t && !t["d" + i]) updates["d" + i] = now;
      }
      done.sort((a,b) => a - b);
      updates.done = done;
      updatePipeline(tid, updates);
    } else {
      updatePipeline(tid, { pipeline_stage: stageKey });
    }
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
    <div style={{display:"flex",gap:6,alignItems:"center",marginBottom:10,flexWrap:"nowrap",overflowX:"auto"}}>
      <input className="cmd-input" style={{minWidth:130,flexShrink:0}} placeholder={"\uD83D\uDD0D Search..."} value={outreachSearch} onChange={e=>setOutreachSearch(e.target.value)}/>
      <select className="cmd-input" style={{minWidth:90,flexShrink:0}} value={outreachCountry} onChange={e=>{setOutreachCountry(e.target.value);setOutreachCity("");}}>
        <option value="">All Countries</option>{allCountries.map(c=><option key={c} value={c}>{c}</option>)}
      </select>
      <select className="cmd-input" style={{width:130,flexShrink:0}} value={outreachGroup} onChange={e=>setOutreachGroup(e.target.value)}>
        <option value="">All Groups</option>{allGroups.map(g=><option key={g} value={g}>{g.length>20?g.slice(0,18)+"\u2026":g}</option>)}
      </select>
      {hasActiveFilters && <button className="act-btn" style={{fontSize:11,flexShrink:0}} onClick={clearFilters}>{"\u2715"}</button>}
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
    {filteredT.length === 0 ? (
      <div className="empty"><div className="empty-icon">{"\uD83D\uDD0D"}</div><div className="empty-title">No matches</div><button className="act-btn" style={{marginTop:8}} onClick={clearFilters}>{"\u2190"} Clear</button></div>
    ) : outreachView === "list" ? (
      <div className="table-card" style={{overflowX:"auto"}}><table className="outreach-list"><thead><tr>
        <th>Hotel</th><th>City</th><th>Group</th><th>GM</th><th>Stage</th><th>Intent</th><th>Last</th><th>Notes</th><th>Owner</th><th></th>
      </tr></thead><tbody>
        {filteredT.map(t => {
          const stage = effectiveStage(t), stg = STAGES.find(s=>s.key===stage)||STAGES[0];
          const p = prospects?prospects.find(x=>x.id===t.prospect_id):null, last = lastAct(t);
          return (<tr key={t.id}>
            <td style={{fontWeight:600,cursor:"pointer",color:"var(--accent)",maxWidth:180}} onClick={()=>setSelected(t.prospect_id)}>{t.hotel}</td>
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
  const [tab, setTab] = useState("hotels");
  const [addHotelModal, setAddHotelModal] = useState(false);
  const [addHotelForm, setAddHotelForm] = useState({});
  const [ctExpanded, setCtExpanded] = useState(null);
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
  const [cooldown, setCooldown] = useState(0); // seconds until next search allowed
  const lastBatchTime = useRef(0); // timestamp of last API batch completion
  const cooldownTimer = useRef(null);
  const [editingNote, setEditingNote] = useState(null);
  const [noteText, setNoteText] = useState("");
  const [filterProvider, setFilterProvider] = useState("");
  // Outreach tracker filters
  const [outreachSearch, setOutreachSearch] = useState("");
  const [outreachCountry, setOutreachCountry] = useState("");
  const [outreachCity, setOutreachCity] = useState("");
  const [outreachGroup, setOutreachGroup] = useState("");
  const [outreachTier, setOutreachTier] = useState("");
  const [outreachProvider, setOutreachProvider] = useState("");
  const [sortCol, setSortCol] = useState(null); // "adr" | "rooms" | null
  const [sortDir, setSortDir] = useState("desc"); // "asc" | "desc"

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

  // ── Cooldown timer: 62s between web search API calls ────
  const COOLDOWN_SEC = 62;

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
      if (data?.error && data.error.toLowerCase().includes("rate limit")) {
        if (attempt >= 1) return { ...data, rateLimited: true };
        startCooldown();
        await rateLimitWait(62);
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
        mode: "list", city: market, brand, group, scope, minAdr
      });

      if (listData?.error) {
        setError("List step failed: " + listData.error);
        return;
      }

      const allKnown = parseJSON(listData.result).filter(h => h.hotel_name && h.hotel_name.trim());
      if (!allKnown.length) {
        setError("No hotels found in knowledge base. Try a different brand or market.");
        setProgress(100);
        return;
      }

      // Filter out hotels already in DB
      const newHotels = allKnown.filter(h => !existingKeys.has(normKey(h.hotel_name, h.city)));
      const dupeCount = allKnown.length - newHotels.length;

      // Take only up to requested count
      const toVerify = newHotels.slice(0, n);

      setLog(`Found ${allKnown.length} known hotels · ${dupeCount} already in DB · ${toVerify.length} to verify`);
      setProgress(20);

      if (toVerify.length === 0) {
        setLog(`All ${allKnown.length} known hotels already in database. ${allKnown.length < 50 ? "This may not be the complete list — the model only knows hotels from its training data." : ""}`);
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

        // Inter-batch cooldown — 62s to stay under 50k tokens/min
        if (i > 0) {
          await rateLimitWait(62);
        }

        const data = await apiFetch({ mode: "verify", hotels: batchHotels, brand, group });

        if (data?.rateLimited) {
          rateLimitHit = true;
          startCooldown();
          setError(`Rate limit after batch ${i + 1}. ${allFresh.length} hotels saved. Wait and run again — remaining hotels are queued.`);
          break;
        }

        if (data?.error) {
          totalErrors++;
          setError("Verify error: " + data.error);
          if (allFresh.length === 0 && i === 0) break;
          continue;
        }

        const raw = parseJSON(data.result);
        
        // FALLBACK: if verify parse failed, use Step 1 data directly (hotel_name + city + country + brand)
        const hotelsToSave = raw.length > 0 ? raw : batchHotels.map(h => ({
          hotel_name: h.hotel_name,
          brand: brand || h.brand,
          hotel_group: group || h.hotel_group || h.brand,
          city: h.city,
          country: h.country,
          tier: null,
          rooms: null,
          gm_name: null,
          gm_title: null,
          contact_confidence: null,
          research_notes: "Verify failed — basic info from knowledge base only. Rooms and GM need manual lookup."
        }));
        
        if (!raw.length) {
          const debugInfo = data.debug || (data.result || "").slice(0, 300);
          setLog(`⚠ Verify failed for batch ${i + 1} — saving basic info. ${debugInfo ? "Debug: " + debugInfo.slice(0,100) : ""}`);
        }

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
    const upd = { pipeline_stage: "new", done: [], d1: null, d2: null, d3: null, d4: null, rejection_reason: null };
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
      current_provider: f.current_provider || null, research_notes: f.notes?.trim() || "Manually added",
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
    const h = ["Hotel","Brand","Tier","City","Country","Rooms","F&B","ADR USD","Rating","Reviews","GM","Title","Email","LinkedIn","Confidence","Strategy","Provider","SDR","Batch","Added"];
    const rows = filteredP.map(p => [p.hotel_name,p.brand,p.tier,p.city,p.country,p.rooms||"",p.restaurants||"",p.adr_usd||"",p.rating||"",p.review_count||"",p.gm_name||"",p.gm_title||"",p.email||"",p.linkedin||"",p.contact_confidence||"",p.engagement_strategy||"",p.current_provider||"",p.sdr||"",p.batch||"",fmtDateShort(p.created_at)]);
    const csv = [h,...rows].map(r => r.map(v => `"${String(v).replace(/"/g,'""')}"`).join(",")).join("\n");
    const a = document.createElement("a"); a.href = URL.createObjectURL(new Blob([csv],{type:"text/csv"})); a.download = `WTK_SDR_${new Date().toISOString().slice(0,10)}.csv`; a.click();
  }

  async function importCSV(e) {
    const file = e.target.files[0];
    if (!file) return;
    e.target.value = "";
    const text = await file.text();
    const lines = text.split(/\r?\n/).filter(Boolean);
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

    const DB_FIELDS = ["id","hotel_name","brand","hotel_group","tier","city","country","address","website","rooms","restaurants","adr_usd","rating","review_count","current_provider","gm_name","gm_first_name","gm_title","email","linkedin","phone","email_source","contact_confidence","outreach_email_subject","outreach_email_body","linkedin_dm","engagement_strategy","strategy_reason","research_notes","sdr","batch","created_at"];
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
      setProspects(prev => [...prev, ...imported]);
      alert(`✓ ${imported.length} hotels imported.`);
    } catch(err) {
      alert("Import failed: " + err.message);
    }
  }

  const sel = selected ? prospects.find(p => p.id === selected) : null;
  const sdrs = ["all", ...new Set(prospects.map(p => p.sdr).filter(Boolean))];
  const filteredP = prospects.filter(p => {
    if (filterSdr !== "all" && p.sdr !== filterSdr) return false;
    if (filterCountry && (p.country||"") !== filterCountry) return false;
    if (filterCity && (p.city||"") !== filterCity) return false;
    if (filterGroup && normalizeGroup(p.hotel_group||p.brand||"") !== filterGroup) return false;
    if (filterBrand && p.brand !== filterBrand) return false;
    if (filterProvider) {
      const prov = getProvider(p) || "Unknown";
      if (prov !== filterProvider) return false;
    }
    if (filterSearch) {
      const q = filterSearch.toLowerCase();
      if (!(p.hotel_name||"").toLowerCase().includes(q) && !(p.gm_name||"").toLowerCase().includes(q) && !(p.city||"").toLowerCase().includes(q)) return false;
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
    if (outreachSearch) {
      const q = outreachSearch.toLowerCase();
      if (!(t.hotel||"").toLowerCase().includes(q) && !(t.gm||"").toLowerCase().includes(q)) return false;
    }
    if (outreachCountry && (p?.country||"") !== outreachCountry) return false;
    if (outreachCity && (p?.city||"") !== outreachCity) return false;
    if (outreachGroup && normalizeGroup(p?.hotel_group||p?.brand||"") !== outreachGroup) return false;
    if (outreachTier && p?.brand !== outreachTier) return false;
    if (outreachProvider) {
      const prov = p ? (getProvider(p) || "Unknown") : "Unknown";
      if (prov !== outreachProvider) return false;
    }
    return true;
  });
  const contacted = tracking.filter(t => (t.done || []).length > 0).length;
  const totalHotelPages = Math.ceil(sortedP.length / HOTELS_PER_PAGE);
  const pagedP = sortedP.slice((hotelsPage-1)*HOTELS_PER_PAGE, hotelsPage*HOTELS_PER_PAGE);
  const allCountries = [...new Set(prospects.map(p=>p.country).filter(Boolean))].sort();
  const allCities = filterCountry ? [...new Set(prospects.filter(p=>p.country===filterCountry).map(p=>p.city).filter(Boolean))].sort() : [...new Set(prospects.map(p=>p.city).filter(Boolean))].sort();
  const allGroups = [...new Set(prospects.map(p=>normalizeGroup(p.hotel_group||p.brand)).filter(Boolean))].sort();
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
            <button className="cmd-btn" style={{background:"var(--accent)",color:"white",fontWeight:600}} onClick={()=>{setAddHotelForm({});setAddHotelModal(true);}}>+ Add Hotel</button>
            {filteredP.length > 0 && <button className="export-btn" onClick={exportCSV}>↓ Export CSV</button>}
            <label className="export-btn" style={{cursor:"pointer"}} title="Import hotels from CSV/Excel (exported from this tool or mapped manually)">
              ↑ Import CSV
              <input type="file" accept=".csv" style={{display:"none"}} onChange={importCSV}/>
            </label>
            <span className="record-count">{loading?"Loading...":`${filteredP.length} prospects in shared database`}</span>
          </div>

          <div className="tabs">
            <button className={`tab ${tab==="hotels"?"active":""}`} onClick={()=>setTab("hotels")}>Hotels<span className="tab-badge">{sortedP.length}</span></button>
              <button className={`tab ${tab==="outreach"?"active":""}`} onClick={()=>setTab("outreach")}>Pipeline<span className="tab-badge">{filteredT.length}</span></button>
              <button className={`tab ${tab==="contacts"?"active":""}`} onClick={()=>setTab("contacts")}>Contact Tracker<span className="tab-badge">{tracking.filter(t=>t.d1).length}</span></button>
          </div>

          {tab==="hotels" && (
            <div className="table-card">
              <div style={{display:"flex",gap:6,alignItems:"center",padding:"10px 0 6px",flexWrap:"nowrap",overflowX:"auto"}}>
                <input className="cmd-input" style={{minWidth:160,flexShrink:0}} placeholder="🔍 Hotel or person..." value={filterSearch} onChange={e=>{setFilterSearch(e.target.value);setHotelsPage(1);}}/>
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
                  {[...new Set(prospects.map(p=>p.brand).filter(Boolean))].sort().map(b=><option key={b} value={b}>{b}</option>)}
                </select>
                <select className="cmd-input" style={{minWidth:100,flexShrink:0}} value={filterProvider} onChange={e=>{setFilterProvider(e.target.value);setHotelsPage(1);}}>
                  <option value="">All Providers</option>
                  {allProviders.map(p=><option key={p} value={p}>{p}</option>)}
                </select>
                {(filterCountry||filterCity||filterGroup||filterBrand||filterSearch||filterProvider) && <button className="act-btn" style={{fontSize:11,flexShrink:0}} onClick={()=>{setFilterCountry("");setFilterCity("");setFilterGroup("");setFilterBrand("");setFilterSearch("");setFilterProvider("");setHotelsPage(1);setSortCol(null);}}>✕ Clear</button>}
                <span style={{marginLeft:"auto",fontSize:12,color:"var(--text2)",whiteSpace:"nowrap",flexShrink:0,fontWeight:600,background:"var(--bg)",padding:"4px 10px",borderRadius:5,border:"1px solid var(--border)"}}>{sortedP.length} hotels{(filterCountry||filterCity||filterGroup||filterBrand||filterSearch||filterProvider)?" (filtered)":""}</span>
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
              <div style={{overflowX:"auto"}}>
              <table>
                <thead><tr>
                  <th style={{width:"20%"}}>Hotel</th>
                  <th style={{width:"8%"}}>City</th>
                  <th style={{width:"8%"}}>Country</th>
                  <th style={{width:"10%"}}>Group</th>
                  <th style={{width:"7%"}}>Brand</th>
                  <th style={{width:"12%"}}>GM</th>
                  <th style={{width:"15%"}}>Email</th>
                  <th className="sortable" style={{width:"6%"}} onClick={()=>toggleSort("rooms")}>Rooms <span className={`sort-arrow ${sortCol==="rooms"?"active":""}`}>{sortCol==="rooms"?(sortDir==="asc"?"▲":"▼"):"⇅"}</span></th>
                  <th className="sortable" style={{width:"6%"}} onClick={()=>toggleSort("adr")}>ADR <span className={`sort-arrow ${sortCol==="adr"?"active":""}`}>{sortCol==="adr"?(sortDir==="asc"?"▲":"▼"):"⇅"}</span></th>
                  <th style={{width:"8%"}}>Provider</th>
                  <th style={{width:"3%"}}></th>
                </tr></thead>
                <tbody>
                  {pagedP.map(p=>{
                    const isIndependent = !p.hotel_group && !p.brand;
                    return (
                    <tr key={p.id} onClick={()=>setSelected(p.id)}>
                      <td><div className="hotel-name">{p.hotel_name}</div></td>
                      <td><span className="cell-muted" style={{fontSize:12}}>{p.city||"—"}</span></td>
                      <td><span className="cell-muted" style={{fontSize:12}}>{p.country||"—"}</span></td>
                      <td><div style={{fontSize:12,color:"var(--text2)",maxWidth:110,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}} title={normalizeGroup(p.hotel_group||p.brand)||"Independent"}>{isIndependent?"Independent":normalizeGroup(p.hotel_group||p.brand)||"—"}</div></td>
                      <td><span className="cell-muted" style={{fontSize:12}}>{p.brand||"—"}</span></td>
                      <td><div className="gm-name" style={{fontSize:12}}>{p.gm_name||<span className="cell-muted">—</span>}</div><div className="gm-title-sm">{p.gm_title&&p.gm_title!=="General Manager"?p.gm_title:""}</div></td>
                      <td>{(()=>{const em=p.email; if(!em||em.includes('[email')||em.includes('email protected'))return<span className="cell-muted">—</span>; return<a className="email-link" href={`mailto:${em}`} onClick={e=>e.stopPropagation()} style={{maxWidth:150,display:"inline-block",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}} title={em}>{em}</a>;})()}</td>
                      <td><span className="cell-muted" style={{fontSize:12}}>{p.rooms||"—"}</span></td>
                      <td><span className="cell-muted" style={{fontSize:12}}>{p.adr_usd?`~$${p.adr_usd}`:"—"}</span></td>
                      <td><span className="cell-muted" style={{fontSize:11}}>{getProvider(p)||"—"}</span></td>
                      <td onClick={e=>e.stopPropagation()}><button className="del-btn" onClick={()=>setDeleteConfirm(p.id)} title="Delete">🗑</button></td>
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
          /></ErrorBoundary>}
      {/* Contact Tracker page */}
      {tab === "contacts" && (() => {
        const CAD = [0, 0, 3, 7, 7]; // cadence: 1st->2nd=+3bd, 2nd->3rd=+7bd, 3rd->4th=+7bd
        const SM = { active:"new", emailed:"1st", followup:"2nd", dead:"lost" };
        const ms = s => SM[s] || s || "new";
        const EM = String.fromCodePoint(0x2014);
        const SC = {new:"#6b7280","1st":"#2563eb","2nd":"#0891b2","3rd":"#7c3aed","4th":"#6d28d9",demo:"#c026d3",trial:"#ea580c",won:"#059669",lost:"#dc2626"};
        function toInput(d) { if (!d) return ""; const dt=new Date(d),y=dt.getFullYear(),m=String(dt.getMonth()+1).padStart(2,"0"),dd=String(dt.getDate()).padStart(2,"0"); return y+"-"+m+"-"+dd; }
        function fmtD(d) { if (!d) return null; const dt = new Date(d); const days=["Sun","Mon","Tue","Wed","Thu","Fri","Sat"]; return fmtDateShort(d)+" ("+days[dt.getDay()]+")"; }

        // Compute schedule for a tracking record
        function computeSchedule(t) {
          const actual = [null, t.d1, t.d2, t.d3, t.d4]; // 1-indexed
          const due = [null, null, null, null, null];
          // Compute due dates: due[n] = actual[n-1] (or due[n-1]) + CAD[n] business days
          for (let n = 2; n <= 4; n++) {
            const anchor = actual[n-1] || due[n-1];
            if (anchor) due[n] = addBusinessDays(anchor, CAD[n]);
          }
          // Find next step
          const isClosed = ["won","lost","demo","trial"].includes(ms(t.pipeline_stage));
          let nextStep = null, nextDue = null;
          if (!isClosed) {
            for (let n = 1; n <= 4; n++) {
              if (!actual[n]) { nextStep = n; nextDue = n === 1 ? null : due[n]; break; }
            }
          }
          // Last actual
          let lastN = 0;
          for (let n = 4; n >= 1; n--) { if (actual[n]) { lastN = n; break; } }
          const lastDate = lastN > 0 ? actual[lastN] : null;
          const daysSince = lastDate ? Math.floor((Date.now() - new Date(lastDate)) / 86400000) : null;
          const daysUntilDue = nextDue ? Math.floor((new Date(nextDue) - Date.now()) / 86400000) : null;
          let status = "ok";
          if (isClosed || (lastN >= 4 && !nextStep)) status = "done";
          else if (daysUntilDue !== null && daysUntilDue < 0) status = "overdue";
          else if (daysUntilDue !== null && daysUntilDue <= 2) status = "due-soon";
          return { actual, due, nextStep, nextDue, lastN, lastDate, daysSince, daysUntilDue, status, isClosed };
        }

        function updateDate(tid, touchNum, dateVal) {
          const key = "d" + touchNum;
          const isoVal = dateVal ? new Date(dateVal + "T12:00:00").toISOString() : null;
          const t = tracking.find(x => x.id === tid);
          const done = [...((t && t.done) || [])];
          if (dateVal && !done.includes(touchNum)) { done.push(touchNum); done.sort((a,b)=>a-b); }
          if (!dateVal) { const idx=done.indexOf(touchNum); if(idx>=0) done.splice(idx,1); }
          const updates = { [key]: isoVal, done };
          const maxD = done.length > 0 ? Math.max(...done) : 0;
          const stMap = {0:"new",1:"1st",2:"2nd",3:"3rd",4:"4th"};
          if (t && stMap[maxD]) {
            const cur = ms(t.pipeline_stage);
            if (!["demo","trial","won","lost"].includes(cur)) updates.pipeline_stage = stMap[maxD];
          }
          updatePipeline(tid, updates);
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
        const dueSoonN = rows.filter(r => r.status === "due-soon").length;

        return (<>
          <div style={{display:"flex",gap:12,marginBottom:12,alignItems:"center",flexWrap:"wrap"}}>
            <div style={{fontSize:13,fontWeight:600,color:"var(--text)"}}>Today: {fmtDateShort(new Date())}</div>
            {overdueN > 0 && <span className="ct-badge" style={{background:"#fef2f2",color:"#dc2626"}}>{overdueN} Overdue</span>}
            {dueSoonN > 0 && <span className="ct-badge" style={{background:"#fffbeb",color:"#d97706"}}>{dueSoonN} Due soon</span>}
            <span style={{fontSize:12,color:"var(--text3)"}}>{rows.length} contacts tracked</span>
          </div>
          <div className="table-card" style={{overflowX:"auto"}}><table className="contact-tracker"><thead><tr>
            <th style={{width:"22%"}}>Hotel</th><th>Stage</th><th>Last Contact</th><th>Next Due</th><th>Countdown</th><th>Status</th><th>Owner</th>
          </tr></thead><tbody>
            {rows.map(({t, p, stage, actual, due, nextStep, nextDue, lastN, lastDate, daysSince, daysUntilDue, status}) => {
              const isExp = ctExpanded === t.id;
              const ordLabel = ["","1st","2nd","3rd","4th"];
              return (<React.Fragment key={t.id}>
                <tr style={{cursor:"pointer"}} onClick={()=>setCtExpanded(isExp?null:t.id)}>
                  <td>
                    <div style={{fontWeight:600,color:"var(--accent)"}} onClick={e=>{e.stopPropagation();setSelected(t.prospect_id);}}>{t.hotel}</div>
                    <div style={{fontSize:10,color:"var(--text3)"}}>{p?.city||""}{p?.country?", "+p.country:""}{t.gm?" "+String.fromCodePoint(0x00B7)+" "+t.gm:""}</div>
                  </td>
                  <td><span style={{fontSize:11,fontWeight:600,color:SC[stage]||"#6b7280",textTransform:"uppercase"}}>{stage}</span></td>
                  <td style={{fontSize:11,whiteSpace:"nowrap"}}>{lastDate ? <span>{fmtD(lastDate)}<span style={{fontSize:9,color:"var(--text3)",marginLeft:3}}>({ordLabel[lastN]})</span></span> : EM}</td>
                  <td style={{fontSize:11,whiteSpace:"nowrap"}}>{nextDue ? <span>{fmtD(nextDue)}<span style={{fontSize:9,color:"var(--text3)",marginLeft:3}}>({ordLabel[nextStep]} follow-up)</span></span> : <span style={{color:"var(--text3)"}}>{status==="done"?"Sequence complete":EM}</span>}</td>
                  <td style={{fontSize:12,fontWeight:600,whiteSpace:"nowrap",color:daysUntilDue!==null&&daysUntilDue<0?"var(--red)":daysUntilDue!==null&&daysUntilDue<=2?"#d97706":"var(--text)"}}>{daysUntilDue!==null?(daysUntilDue<0?Math.abs(daysUntilDue)+" days overdue":daysUntilDue===0?"due today":"in "+daysUntilDue+" days"):EM}</td>
                  <td>{status==="overdue"?<span className="ct-badge" style={{background:"#fef2f2",color:"#dc2626"}}>Overdue</span>:status==="due-soon"?<span className="ct-badge" style={{background:"#fffbeb",color:"#d97706"}}>Due soon</span>:status==="done"?<span className="ct-badge" style={{background:"#ecfdf5",color:"#059669"}}>Done</span>:<span className="ct-badge" style={{background:"#f0fdf4",color:"#059669"}}>OK</span>}</td>
                  <td><span style={{fontSize:11,color:"var(--text3)"}}>{t.sdr||EM}</span></td>
                </tr>
                {isExp && <tr><td colSpan={7} style={{background:"#f9fafb",padding:"10px 16px"}}>
                  <div style={{fontSize:11,fontWeight:700,color:"var(--text3)",marginBottom:6,textTransform:"uppercase",letterSpacing:"0.04em"}}>Contact Plan</div>
                  <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:10}}>
                    {[1,2,3,4].map(n => {
                      const hasActual = !!actual[n];
                      const dueDate = due[n];
                      return (<div key={n} style={{background:"white",border:"1px solid var(--border)",borderRadius:6,padding:"8px 10px"}}>
                        <div style={{fontSize:10,fontWeight:700,color:SC[ordLabel[n].replace(/\s/g,"")]||"var(--text3)",textTransform:"uppercase",marginBottom:4}}>{ordLabel[n]} {n===1?"Contact":"Follow-up"}</div>
                        <div style={{fontSize:10,color:"var(--text3)",marginBottom:3}}>Actual:</div>
                        <input type="date" value={toInput(actual[n])} onChange={e=>updateDate(t.id,n,e.target.value)} onClick={e=>e.stopPropagation()}
                          style={{fontSize:12,border:"1px solid var(--border2)",borderRadius:4,padding:"3px 6px",width:"100%",fontFamily:"inherit",cursor:"pointer"}} />
                        {n >= 2 && <div style={{fontSize:9,color:"var(--text3)",marginTop:4}}>Auto due: {dueDate ? fmtD(dueDate) : "needs "+ordLabel[n-1]}</div>}
                        {hasActual && <div style={{fontSize:9,color:"var(--green)",marginTop:2}}>{String.fromCodePoint(0x2713)} Done</div>}
                      </div>);
                    })}
                  </div>
                </td></tr>}
              </React.Fragment>);
            })}
          </tbody></table></div>
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

      {/* Add Hotel Modal */}
      {addHotelModal && (
        <div className="modal-overlay" onClick={()=>setAddHotelModal(false)}>
          <div className="modal" style={{maxWidth:520}} onClick={e=>e.stopPropagation()}>
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
          <div className="overlay" onClick={()=>setSelected(null)}/>
          <div className="drawer">
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
              <div className="d-sec-title">Decision Maker</div>
              <div className="d-row"><span className="d-key">Name</span><span className="d-val" style={{fontWeight:700}}><EditableField value={sel.gm_name} placeholder="Add GM name" onSave={v => updateProspectField(sel.id, 'gm_name', v)} /></span></div>
              <div className="d-row"><span className="d-key">Title</span><span className="d-val"><EditableField value={sel.gm_title} placeholder="Add title" onSave={v => updateProspectField(sel.id, 'gm_title', v)} /></span></div>
              <div className="d-row"><span className="d-key">Email</span><span className="d-val"><EditableField value={sel.email} placeholder="Add email" onSave={v => updateProspectField(sel.id, 'email', v)} /></span></div>
              <div className="d-row"><span className="d-key">LinkedIn</span><span className="d-val"><EditableField value={sel.linkedin} placeholder="Add LinkedIn URL" onSave={v => updateProspectField(sel.id, 'linkedin', v)} /></span></div>
            </div>
            {(() => {
              const trk = tracking.find(x => x.prospect_id === sel.id);
              if (!trk) return null;
              const DS = [{key:"new",label:"New",color:"#6b7280"},{key:"1st",label:"1st",color:"#2563eb"},{key:"2nd",label:"2nd",color:"#0891b2"},{key:"3rd",label:"3rd",color:"#7c3aed"},{key:"4th",label:"4th",color:"#6d28d9"},{key:"demo",label:"Demo",color:"#c026d3"},{key:"trial",label:"Trial",color:"#ea580c"},{key:"won",label:"Won",color:"#059669"},{key:"lost",label:"Lost",color:"#dc2626"}];
              const ms = s => { if (s==="active") return "new"; if (s==="emailed") return "1st"; if (s==="followup") return "2nd"; if (s==="dead") return "lost"; return s; };
              const stage = ms(trk.pipeline_stage || "new");
              const so = DS.find(s=>s.key===stage) || DS[0];
              return (
                <div className="d-sec">
                  <div className="d-sec-title">Pipeline Status</div>
                  <div className="d-row"><span className="d-key">Stage</span><span className="d-val"><span style={{fontWeight:700,color:so.color}}>{so.label}</span></span></div>
                  {trk.intention > 0 && <div className="d-row"><span className="d-key">Intent</span><span className="d-val">{trk.intention}/5 \u2014 {({1:"Cold",2:"Low",3:"Medium",4:"Warm",5:"Hot"})[trk.intention]||"\u2014"}</span></div>}
                  {trk.rejection_reason && <div className="d-row"><span className="d-key">Lost Reason</span><span className="d-val" style={{color:"var(--red)"}}>{trk.rejection_reason}</span></div>}
                  <div style={{marginTop:10}}>
                    <div style={{fontSize:10,fontWeight:700,color:"var(--text3)",textTransform:"uppercase",letterSpacing:"0.04em",marginBottom:6}}>Activity Timeline</div>
                    {(trk.done||[]).map(n => {
                      const d = trk["d"+n];
                      const lbl = {1:"1st Email sent",2:"2nd Follow-up sent",3:"3rd Follow-up sent",4:"4th Follow-up sent"};
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
