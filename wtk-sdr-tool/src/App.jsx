import { useState, useEffect, Component } from "react";

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
  "ritz-carlton":"Qualtrics","st. regis":"Qualtrics","jw marriott":"Qualtrics","w hotels":"Qualtrics",
  "luxury collection":"Qualtrics","edition":"Qualtrics","sheraton":"Qualtrics","westin":"Qualtrics",
  "le méridien":"Qualtrics","le meridien":"Qualtrics","renaissance":"Qualtrics","autograph collection":"Qualtrics",
  "tribute portfolio":"Qualtrics","design hotels":"Qualtrics","marriott":"Qualtrics","delta hotels":"Qualtrics",
  "aloft":"Qualtrics","moxy":"Qualtrics","ac hotels":"Qualtrics","courtyard":"Qualtrics",
  "intercontinental":"Medallia","kimpton":"Medallia","six senses":"Medallia","regent":"Medallia",
  "vignette collection":"Medallia","hotel indigo":"Medallia","crowne plaza":"Medallia","voco":"Medallia",
  "holiday inn":"Medallia","hualuxe":"Medallia","ihg":"Medallia",
  "park hyatt":"Medallia","andaz":"Medallia","grand hyatt":"Medallia","hyatt regency":"Medallia",
  "hyatt centric":"Medallia","alila":"Medallia","thompson hotels":"Medallia","hyatt":"Medallia",
  "wyndham":"Medallia","dolce by wyndham":"Medallia","ramada":"Medallia",
  "radisson collection":"ReviewPro","radisson blu":"ReviewPro","radisson red":"ReviewPro",
  "radisson":"ReviewPro","park plaza":"ReviewPro","park inn":"ReviewPro","country inn":"ReviewPro",
  "anantara":"ReviewPro","nh collection":"ReviewPro","nh hotels":"ReviewPro","nhow":"ReviewPro",
  "tivoli":"ReviewPro","minor hotels":"ReviewPro","peninsula":"ReviewPro","capella":"ReviewPro",
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
const TIER_OPTIONS = [
  { value: "Luxury", label: "Luxury", desc: "Six Senses, Park Hyatt, Rosewood, Mandarin Oriental, Four Seasons, Aman, Peninsula, LHW independents" },
  { value: "Premium", label: "Premium", desc: "Hilton, Marriott, Hyatt Regency, Voco, Radisson, NH, Anantara, upper 4-star independents" },
  { value: "Lifestyle", label: "Lifestyle", desc: "W Hotels, Kimpton, Hoxton, 25Hours, Tribute Portfolio, Edition, boutique lifestyle" },
  { value: "Economy", label: "Economy", desc: "Ibis, Holiday Inn, Novotel, Courtyard, 3-star independents" },
  { value: "Function", label: "Function", desc: "Airport hotels, convention center hotels, large conference properties" },
];


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

  .cmd-panel { background: var(--surface); border: 1px solid var(--border); border-radius: var(--radius); padding: 20px 24px; margin-bottom: 20px; box-shadow: var(--shadow-sm); }
  .cmd-title { font-size: 11px; font-weight: 600; color: var(--text3); text-transform: uppercase; letter-spacing: 0.07em; margin-bottom: 16px; }
  .cmd-row { display: flex; gap: 16px; align-items: flex-end; flex-wrap: wrap; }
  .cmd-row > .field { display: flex; flex-direction: column; gap: 4px; justify-content: flex-end; }
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
  table { width: 100%; border-collapse: collapse; }
  thead th { background: var(--bg); padding: 9px 14px; text-align: left; font-size: 11px; font-weight: 600; color: var(--text3); letter-spacing: 0.05em; text-transform: uppercase; border-bottom: 1px solid var(--border); white-space: nowrap; }
  tbody tr { border-bottom: 1px solid var(--border); cursor: pointer; transition: background 0.1s; }
  tbody tr:last-child { border-bottom: none; }
  tbody tr:hover { background: #f9fafb; }
  td { padding: 11px 14px; vertical-align: middle; color: var(--text); }
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
  .pipeline-legend { font-size: 12px; color: var(--text3); margin-bottom: 14px; display: flex; align-items: center; gap: 16px; flex-wrap: wrap; }
  .legend-item { display: flex; align-items: center; gap: 5px; }
  .legend-dot { width: 8px; height: 8px; border-radius: 50%; }
  .cards-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); gap: 12px; }
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
`;

function uid() { return Math.random().toString(36).slice(2, 9); }
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
  "Not interested (no reason given)",
  "Has existing provider — satisfied",
  "No budget right now",
  "Come back next quarter",
  "No authority to decide",
  "Bad timing / busy period",
  "Already in evaluation with competitor",
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
  return `Hi ${sel.gm_first_name || sel.gm_name?.split(" ")[0] || "[Name]"},\n\nJust following up on my note from Monday.\n\nOne question worth sitting with: at ${sel.rating || "[rating]"} across ${sel.review_count ? sel.review_count.toLocaleString() : "[count]"} reviews, do you currently have visibility into which specific issue is appearing most frequently in written guest feedback — before it shows up in the score?\n\nHappy to show you one example from a comparable property. 15 minutes next week?\n\nBest,\nZishuo Wang | Where to know`;
}
function touch3Body(sel) {
  return `Hi ${sel.gm_first_name || sel.gm_name?.split(" ")[0] || "[Name]"},\n\nI've reached out a couple of times — I'll keep this brief.\n\nIn competitive markets like ${sel.city}, perception shifts often appear in competitor guest commentary before rankings adjust. We're seeing this pattern across comparable properties in the area.\n\nWhereToKnow surfaces those competitor signals automatically, so you see where the gap is forming before it affects your standing.\n\nWould early next week or later work better for a 15-minute look? No prep needed.\n\nBest,\nZishuo Wang | Where to know`;
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
      current = line.replace(/^[•\-*]\s*/, "");
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

function OutreachTab({ filteredT, stageFilter, setStageFilter, setSelected, touchToggle, updatePipeline, openRejectModal, reopenSequence }) {
  if (filteredT.length === 0) {
    return <div className="empty"><div className="empty-icon">📬</div><div className="empty-title">No outreach tracked</div><div className="empty-sub">Run research to start the tracker.</div></div>;
  }
  const stageGroups = { all: filteredT.length, active: 0, demo: 0, won: 0, dead: 0 };
  filteredT.forEach(t => { const s = t.pipeline_stage || "active"; if (stageGroups[s] !== undefined) stageGroups[s]++; else stageGroups.active++; });
  const visibleT = stageFilter === "all" ? filteredT : filteredT.filter(t => (t.pipeline_stage || "active") === stageFilter);
  return (
    <>
      <div className="pipeline-legend">
        <span>Today: <strong>{fmtDate(new Date())}</strong></span>
        <span className="legend-item"><span className="legend-dot" style={{background:"var(--red)"}}/>Overdue</span>
        <span className="legend-item"><span className="legend-dot" style={{background:"var(--amber)"}}/>Due soon</span>
        <span className="legend-item"><span className="legend-dot" style={{background:"var(--green)"}}/>Sent</span>
        <span className="legend-item"><span className="legend-dot" style={{background:"var(--text3)"}}/>Locked</span>
      </div>
      <div className="stage-tabs">
        {[["all","All"],["active","Active"],["demo","Demo"],["won","Won"],["dead","Closed"]].map(([v,l])=>(
          <button key={v} className={`stage-tab ${stageFilter===v?"active":""}`} onClick={()=>setStageFilter(v)}>
            {l} <span className="stage-cnt">{stageGroups[v]||0}</span>
          </button>
        ))}
      </div>
      <div className="cards-grid">
        {visibleT.map(t => {
          const stage = t.pipeline_stage || "active";
          const status = getPipelineStatus(t);
          const isClosed = stage === "dead" || stage === "won";
          return (
            <div key={t.id} className={`track-card ${isClosed?"closed":""}`} onClick={()=>setSelected(t.prospect_id)}>
              <div className="track-hotel">{t.hotel}</div>
              <div className="track-gm">{t.gm||"—"}{t.d1?` · First contact: ${fmtDate(t.d1)}`:""}</div>
              <div className="touch-timeline" onClick={e=>e.stopPropagation()}>
                {TOUCH_CONFIG.map(tc => {
                  const tstate = getTouchState(t, tc);
                  const dateInfo = getTouchDueStr(t, tc);
                  return (
                    <div key={tc.n} className={`touch-node ${tstate==="t-done"?"t-done":""}`}>
                      <div className={`touch-circle ${tstate}`}
                        onClick={(e)=>{ if(tstate!=="t-locked" && !isClosed) touchToggle(t.id,tc.n,e); else e.stopPropagation(); }}
                        title={tstate==="t-locked"?"Complete previous touch first":tc.desc}>
                        {tstate==="t-done" ? "✓" : tc.n}
                      </div>
                      <div className="touch-lbl">{tc.label}</div>
                      {dateInfo && <div className={`touch-date ${dateInfo.cls}`}>{dateInfo.str}</div>}
                    </div>
                  );
                })}
              </div>
              {!isClosed && (
                <div className="card-actions" onClick={e=>e.stopPropagation()}>
                  {stage !== "demo" && stage !== "won" && (
                    <button className="act-btn success" onClick={(e)=>updatePipeline(t.id,{pipeline_stage:"demo"},e)}>📅 Demo booked</button>
                  )}
                  {stage === "demo" && (
                    <button className="act-btn success" onClick={(e)=>updatePipeline(t.id,{pipeline_stage:"won"},e)}>🏆 Mark Won</button>
                  )}
                  <button className="act-btn danger" onClick={(e)=>openRejectModal(t.id,"dead",e)}>✕ Not interested</button>
                </div>
              )}
              {isClosed && stage === "dead" && (
                <div className="card-actions" onClick={e=>e.stopPropagation()}>
                  <button className="act-btn" onClick={(e)=>reopenSequence(t.id,e)}>⟳ Re-open sequence</button>
                  <button className="act-btn" onClick={(e)=>updatePipeline(t.id,{pipeline_stage:"reopen"},e)}>⏰ Re-engage in 3 months</button>
                </div>
              )}
              <div className="card-footer">
                <span className={`pipeline-status ${status.cls}`}>{status.label}</span>
                {t.sdr && <span className="sdr-tag">{t.sdr}</span>}
              </div>
            </div>
          );
        })}
      </div>
    </>
  );
}

export default function App() {
  const [tab, setTab] = useState("hotels");
  // Geo state
  const [region, setRegion] = useState("Europe");
  const [country, setCountry] = useState("Austria");
  const [cityInput, setCityInput] = useState("Vienna");
  const [customMarket, setCustomMarket] = useState("");
  const [multiMode, setMultiMode] = useState(false);
  // Other filters
  const [tier, setTier] = useState("Luxury");
  const [brand, setBrand] = useState("");
  const [count, setCount] = useState("5");
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
  const [prospects, setProspects] = useState([]);
  const [tracking, setTracking] = useState([]);
  const [rejectModal, setRejectModal] = useState(null); // { tid, stage: 'dead'|'reopen' }
  const [rejectReason, setRejectReason] = useState("");

  useEffect(() => {
    const n = localStorage.getItem("wtk_sdr_name"); if (n) setSdrName(n);
    loadData();
  }, []);

  async function loadData() {
    setLoading(true);
    try {
      const [p, t] = await Promise.all([sbFetch("/prospects?order=created_at.desc&limit=500"), sbFetch("/tracking?order=created_at.desc&limit=500")]);
      setProspects(p || []); setTracking(t || []);
    } catch (e) { console.error(e); }
    setLoading(false);
  }

  function saveSdrName(v) { setSdrName(v); localStorage.setItem("wtk_sdr_name", v); }

  // Compute market string from geo selections
  function getMarket() {
    if (multiMode && customMarket.trim()) return customMarket.trim();
    if (cityInput.trim()) return `${cityInput.trim()}, ${country}, ${region}`;
    return `${country}, ${region}`;
  }

  async function run() {
    setRunning(true); setError(null); setProgress(15);
    const market = getMarket();
    const n = Math.min(Math.max(parseInt(count) || 5, 1), 50);
    setLog(`Searching ${n} hotels in ${market}...`);
    try {
      setProgress(35);
      const res = await fetch("/api/research", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ city: market, brand, segment: tier, count: n }) });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setProgress(70); setLog("Saving to shared database...");
      const raw = parseJSON(data.result);
      if (!raw.length) throw new Error("No hotels returned. Try a different market.");
      const sdr = sdrName || "Unknown";
      const batch = `${market} · ${fmtDateShort(new Date())}`;
      const PROSPECT_FIELDS = ["id","hotel_name","brand","tier","city","country","address","website","rooms","restaurants","adr_usd","rating","review_count","current_provider","gm_name","gm_first_name","gm_title","email","linkedin","phone","email_source","contact_confidence","outreach_email_subject","outreach_email_body","linkedin_dm","engagement_strategy","strategy_reason","research_notes","sdr","batch","created_at"];
      const enriched = raw.map(p => {
        const base = { ...p, id: uid(), created_at: new Date().toISOString(), batch, sdr };
        // Only keep known DB columns to avoid schema cache errors
        const safe = {};
        PROSPECT_FIELDS.forEach(k => { if (base[k] !== undefined) safe[k] = base[k]; });
        return safe;
      });
      const newT = enriched.map(p => ({ id: uid(), prospect_id: p.id, hotel: p.hotel_name, gm: p.gm_name, email: p.email, done: [], sdr, created_at: new Date().toISOString() }));
      await sbFetch("/prospects", { method: "POST", prefer: "return=minimal", body: JSON.stringify(enriched) });
      await sbFetch("/tracking", { method: "POST", prefer: "return=minimal", body: JSON.stringify(newT) });
      setProspects(prev => [...enriched, ...prev]); setTracking(prev => [...newT, ...prev]);
      setProgress(100); setLog(`${enriched.length} prospects saved · ${enriched.filter(p => p.email).length} emails found`);
      setTab("hotels");
    } catch (err) { setError(err.message); }
    finally { setRunning(false); setTimeout(() => setProgress(0), 2000); }
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
    setRejectModal({ tid, stage });
  }

  async function confirmReject() {
    if (!rejectModal) return;
    const updates = { pipeline_stage: rejectModal.stage, rejection_reason: rejectReason || "Not specified" };
    await updatePipeline(rejectModal.tid, updates);
    setRejectModal(null);
  }

  async function reopenSequence(tid, e) {
    if (e) e.stopPropagation();
    const upd = { pipeline_stage: "active", done: [], d1: null, d2: null, d3: null, d4: null, rejection_reason: null };
    setTracking(prev => prev.map(x => x.id === tid ? { ...x, ...upd } : x));
    try { await sbFetch(`/tracking?id=eq.${tid}`, { method: "PATCH", prefer: "return=minimal", body: JSON.stringify(upd) }); } catch (e) { console.error(e); }
  }


  function copy(text, key) { navigator.clipboard.writeText(text).then(() => { setCopied(key); setTimeout(() => setCopied(null), 1500); }); }

  function exportCSV() {
    const h = ["Hotel","Brand","Tier","City","Country","Rooms","F&B","ADR USD","Rating","Reviews","GM","Title","Email","LinkedIn","Confidence","Strategy","Provider","SDR","Batch","Added"];
    const rows = filteredP.map(p => [p.hotel_name,p.brand,p.tier,p.city,p.country,p.rooms||"",p.restaurants||"",p.adr_usd||"",p.rating||"",p.review_count||"",p.gm_name||"",p.gm_title||"",p.email||"",p.linkedin||"",p.contact_confidence||"",p.engagement_strategy||"",p.current_provider||"",p.sdr||"",p.batch||"",fmtDateShort(p.created_at)]);
    const csv = [h,...rows].map(r => r.map(v => `"${String(v).replace(/"/g,'""')}"`).join(",")).join("\n");
    const a = document.createElement("a"); a.href = URL.createObjectURL(new Blob([csv],{type:"text/csv"})); a.download = `WTK_SDR_${new Date().toISOString().slice(0,10)}.csv`; a.click();
  }

  const sel = selected ? prospects.find(p => p.id === selected) : null;
  const sdrs = ["all", ...new Set(prospects.map(p => p.sdr).filter(Boolean))];
  const filteredP = filterSdr === "all" ? prospects : prospects.filter(p => p.sdr === filterSdr);
  const filteredT = filterSdr === "all" ? tracking : tracking.filter(t => t.sdr === filterSdr);
  const contacted = tracking.filter(t => (t.done || []).length > 0).length;
  const countries = Object.keys(GEO[region] || {});
  const cities = (GEO[region] || {})[country] || [];
  const selectedTierObj = TIER_OPTIONS.find(t => t.value === tier);

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
            <div className="cmd-title">Research Command</div>
            <div className="cmd-row">
              {/* Geography */}
              {!multiMode ? (
                <div>
                  <div className="geo-row">
                    <div className="field">
                      <span className="field-label">Region</span>
                      <select value={region} onChange={e=>{setRegion(e.target.value);const cs=Object.keys(GEO[e.target.value]||{});setCountry(cs[0]||"");setCityInput((GEO[e.target.value]||{})[cs[0]]?.[0]||"")}} style={{width:110}}>
                        {Object.keys(GEO).map(r=><option key={r}>{r}</option>)}
                      </select>
                    </div>
                    <div className="field" style={{gap:3}}>
                      <span className="field-label">Country</span>
                      <select value={country} onChange={e=>{setCountry(e.target.value);setCityInput((GEO[region]||{})[e.target.value]?.[0]||"")}} style={{width:130}}>
                        {countries.map(c=><option key={c}>{c}</option>)}
                      </select>
                    </div>
                    <div className="field" style={{gap:3}}>
                      <span className="field-label">City</span>
                      <select value={cityInput} onChange={e=>setCityInput(e.target.value)} style={{width:120}}>
                        <option value="">All cities</option>
                        {cities.map(c=><option key={c}>{c}</option>)}
                      </select>
                    </div>
                  </div>
                  <button style={{marginTop:4,background:"none",border:"none",fontSize:11,color:"var(--accent)",cursor:"pointer",textAlign:"left",padding:0}} onClick={()=>setMultiMode(true)}>+ Multi-market / custom</button>
                </div>
              ) : (
                <div className="field">
                  <span className="field-label">Custom Market (multi-country OK)</span>
                  <input value={customMarket} onChange={e=>setCustomMarket(e.target.value)} placeholder="e.g. Europe, or China + Japan, or UK" style={{width:320}} />
                  <button style={{marginTop:4,background:"none",border:"none",fontSize:11,color:"var(--text3)",cursor:"pointer",textAlign:"left",padding:0}} onClick={()=>setMultiMode(false)}>← Use region/country picker</button>
                </div>
              )}
              <div className="field">
                <span className="field-label">Brand (optional)</span>
                <input value={brand} onChange={e=>setBrand(e.target.value)} placeholder="IHG, Kempinski..." style={{width:150}} />
              </div>
              <div className="field">
                <span className="field-label">Count (max 50)</span>
                <input type="number" min="1" max="50" value={count} onChange={e=>setCount(e.target.value)} style={{width:80}} />
              </div>
              <div className="field">
                <span className="field-label">Your Name (SDR)</span>
                <input value={sdrName} onChange={e=>saveSdrName(e.target.value)} placeholder="e.g. Vincent" style={{width:120}} />
              </div>
              <button className="run-btn" onClick={run} disabled={running} style={{marginTop:20}}>
                {running ? <><div className="spinner"/>Researching...</> : "▶ Run Research"}
              </button>
            </div>

            {/* Tier selector */}
            <div style={{marginTop:14}}>
              <div className="field-label" style={{marginBottom:8}}>Hotel Tier</div>
              <div className="tier-grid">
                {TIER_OPTIONS.map(t => <button key={t.value} className={`tier-btn ${tier===t.value?"active":""}`} onClick={()=>setTier(t.value)}>{t.label}</button>)}
              </div>
              {selectedTierObj && <div className="tier-desc">{selectedTierObj.desc}</div>}
            </div>

            {running && <div className="progress-wrap"><div className="progress-bar"><div className="progress-fill" style={{width:`${progress}%`}}/></div><div className="progress-text">› {log}</div></div>}
            {!running && log && !error && (<div><div className="success-msg">✓ {log}</div><div className="db-note"><div className="db-dot"/>Saved to shared database — visible to all team members</div></div>)}
            {error && <div className="error-msg">⚠ {error}</div>}
          </div>

          <div className="toolbar">
            {sdrs.length > 1 && sdrs.map(s=><button key={s} className={`filter-pill ${filterSdr===s?"active":""}`} onClick={()=>setFilterSdr(s)}>{s==="all"?"All SDRs":s}</button>)}
            {filteredP.length > 0 && <button className="export-btn" onClick={exportCSV}>↓ Export CSV</button>}
            <span className="record-count">{loading?"Loading...":` ${filteredP.length} prospects in shared database`}</span>
          </div>

          <div className="tabs">
            {[["hotels","Hotels",filteredP.length],["outreach","Outreach Tracker",filteredT.length]].map(([id,label,cnt])=>(
              <button key={id} className={`tab ${tab===id?"active":""}`} onClick={()=>setTab(id)}>{label}<span className="tab-badge">{cnt}</span></button>
            ))}
          </div>

          {tab==="hotels" && (filteredP.length===0 ? (
            <div className="empty"><div className="empty-icon">🏨</div><div className="empty-title">{loading?"Loading database...":"No prospects yet"}</div><div className="empty-sub">Select your market and tier, then click Run Research.</div></div>
          ) : (
            <div className="table-card">
              <table>
                <thead><tr><th>Hotel</th><th>Group</th><th>Tier</th><th>GM</th><th>Email</th><th>Conf.</th><th>Rooms</th><th>F&B</th><th>ADR</th><th>Provider</th><th>SDR</th><th>Added</th></tr></thead>
                <tbody>
                  {filteredP.map(p=>{
                    const trackRec = tracking.find(t=>t.prospect_id===p.id);
                    const firstContact = trackRec?.d1;
                    return (
                    <tr key={p.id} onClick={()=>setSelected(p.id)}>
                      <td><div className="hotel-name">{p.hotel_name}</div><div className="hotel-sub">{p.city}, {p.country}</div></td>
                      <td><div style={{fontSize:12,color:"var(--text2)",fontWeight:500}}>{p.brand||"—"}</div></td>
                      <td><TierBadge tier={p.tier}/></td>
                      <td><div className="gm-name">{p.gm_name||<span className="cell-muted">—</span>}</div><div className="gm-title-sm">{p.gm_title}</div></td>
                      <td>{p.email?<a className="email-link" href={`mailto:${p.email}`} onClick={e=>e.stopPropagation()}>{p.email}</a>:<span className="cell-muted">—</span>}</td>
                      <td><span className={`badge badge-${(p.contact_confidence||"l").toLowerCase()}`}>{p.contact_confidence||"L"}</span></td>
                      <td><span className="cell-muted">{p.rooms||"—"}</span></td>
                      <td><span className="cell-muted">{p.restaurants||"—"}</span></td>
                      <td><span className="cell-muted">{p.adr_usd?`~$${p.adr_usd}`:"—"}</span></td>
                      <td><span className="cell-muted">{p.current_provider || inferProvider(p.brand, p.hotel_name) || "—"}</span></td>
                      <td><div className="sdr-tag">{p.sdr||"—"}</div>{firstContact&&<div style={{fontSize:10,color:"var(--text3)"}}>contacted {fmtDate(firstContact)}</div>}</td>
                      <td><span className="cell-muted">{fmtDateShort(p.created_at)}</span></td>
                    </tr>
                  );})}
                </tbody>
              </table>
            </div>
          ))}

          {tab==="outreach" && <ErrorBoundary><OutreachTab filteredT={filteredT} stageFilter={stageFilter} setStageFilter={setStageFilter} setSelected={setSelected} touchToggle={touchToggle} updatePipeline={updatePipeline} openRejectModal={openRejectModal} reopenSequence={reopenSequence} /></ErrorBoundary>}
        </div>
      </div>

      {rejectModal && (
        <div className="modal-overlay" onClick={()=>setRejectModal(null)}>
          <div className="modal" onClick={e=>e.stopPropagation()}>
            <div className="modal-title">Mark as Not Interested</div>
            <div className="modal-sub">Select the reason (helps improve targeting)</div>
            <div className="reason-grid">
              {REJECTION_REASONS.map(r=>(
                <button key={r} className={`reason-btn ${rejectReason===r?"selected":""}`} onClick={()=>setRejectReason(r)}>{r}</button>
              ))}
            </div>
            <div className="modal-footer">
              <button className="modal-cancel" onClick={()=>setRejectModal(null)}>Cancel</button>
              <button className="modal-confirm danger-btn" onClick={confirmReject}>Confirm</button>
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
            <div className="drawer-meta">{sel.brand} · {sel.city}, {sel.country} · Added by {sel.sdr} · {fmtDateShort(sel.created_at)}</div>
            <div className="d-sec">
              <div className="d-sec-title">Property</div>
              <div className="d-row"><span className="d-key">Address</span><span className="d-val">{sel.address||"—"}</span></div>
              <div className="d-row"><span className="d-key">Rooms</span><span className="d-val">{sel.rooms||"—"}</span></div>
              <div className="d-row"><span className="d-key">Restaurants</span><span className="d-val">{sel.restaurants||"—"}</span></div>
              <div className="d-row"><span className="d-key">Est. ADR</span><span className="d-val">{sel.adr_usd?`~$${sel.adr_usd}/night`:"—"}</span></div>
              <div className="d-row"><span className="d-key">Rating</span><span className="d-val">{sel.rating?`${sel.rating} / 10`:"—"}{sel.review_count?` (${sel.review_count.toLocaleString()} reviews)`:""}</span></div>
              <div className="d-row"><span className="d-key">Provider</span><span className="d-val">{sel.current_provider || inferProvider(sel.brand, sel.hotel_name) || "Unknown"}</span></div>
              <div className="d-row"><span className="d-key">Website</span><span className="d-val">{sel.website?<a className="email-link" href={sel.website} target="_blank" rel="noreferrer">↗ Visit</a>:"—"}</span></div>
            </div>
            <div className="d-sec">
              <div className="d-sec-title">Decision Maker</div>
              <div className="d-row"><span className="d-key">Name</span><span className="d-val" style={{fontWeight:700}}>{sel.gm_name||"—"}</span></div>
              <div className="d-row"><span className="d-key">Title</span><span className="d-val">{sel.gm_title||"—"}</span></div>
              <div className="d-row"><span className="d-key">Email</span><span className="d-val">{sel.email?<a className="email-link" href={`mailto:${sel.email}`}>{sel.email}</a>:<span className="cell-muted">Not found</span>}</span></div>
              <div className="d-row"><span className="d-key">LinkedIn</span><span className="d-val">{sel.linkedin?<a className="email-link" href={sel.linkedin} target="_blank" rel="noreferrer">↗ View Profile</a>:<span className="cell-muted">Not found</span>}</span></div>
              <div className="d-row"><span className="d-key">Confidence</span><span className="d-val"><span className={`badge badge-${(sel.contact_confidence||"l").toLowerCase()}`}>{sel.contact_confidence}</span></span></div>
            </div>
            {sel.outreach_email_subject && (
              <div className="d-sec">
                <div className="d-sec-title">4-Touch Email Sequence</div>
                <div className="email-touch">
                  <div className="touch-hdr">Touch 1 <span className="tag">Day 1 · Initial</span></div>
                  <div className="subject-line">Subject: {sel.outreach_email_subject}</div>
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
