import { useState, useEffect } from "react";

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
    "Austria": ["Vienna","Salzburg","Innsbruck","Graz"],
    "France": ["Paris","Lyon","Nice","Cannes","Bordeaux","Marseille"],
    "Germany": ["Berlin","Munich","Hamburg","Frankfurt","Düsseldorf","Cologne"],
    "Italy": ["Rome","Milan","Florence","Venice","Naples","Amalfi"],
    "Spain": ["Madrid","Barcelona","Seville","Marbella","Ibiza"],
    "Switzerland": ["Zurich","Geneva","Basel","Zermatt","St. Moritz"],
    "United Kingdom": ["London","Edinburgh","Manchester","Bath","Oxford"],
    "Netherlands": ["Amsterdam","Rotterdam","The Hague"],
    "Portugal": ["Lisbon","Porto","Algarve"],
    "Greece": ["Athens","Santorini","Mykonos","Thessaloniki"],
    "Turkey": ["Istanbul","Antalya","Bodrum"],
    "Czech Republic": ["Prague","Brno"],
    "Poland": ["Warsaw","Krakow"],
    "Belgium": ["Brussels","Bruges","Antwerp"],
    "Denmark": ["Copenhagen"],
    "Sweden": ["Stockholm","Gothenburg"],
    "Norway": ["Oslo","Bergen"],
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

const TIER_OPTIONS = [
  { value: "Luxury only", label: "Luxury", desc: "Six Senses, Park Hyatt, Rosewood, Mandarin Oriental, Four Seasons, Aman, LHW independents" },
  { value: "Premium only", label: "Premium", desc: "Hilton, Marriott, Hyatt Regency, Voco, Radisson, NH, 4-star independents" },
  { value: "Luxury and Premium", label: "Luxury + Premium", desc: "Both luxury and premium tiers" },
  { value: "Lifestyle", label: "Lifestyle", desc: "W Hotels, Kimpton, Hoxton, 25Hours, Tribute Portfolio" },
  { value: "Economy", label: "Economy", desc: "Ibis, Holiday Inn, Novotel, 3-star independents" },
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
  .cmd-row { display: flex; gap: 12px; align-items: flex-end; flex-wrap: wrap; }
  .field { display: flex; flex-direction: column; gap: 4px; }
  .field-label { font-size: 11px; font-weight: 600; color: var(--text2); text-transform: uppercase; letter-spacing: 0.05em; }
  .field input, .field select { background: var(--bg); border: 1px solid var(--border2); border-radius: 6px; padding: 7px 11px; font-family: 'Inter', sans-serif; font-size: 13px; color: var(--text); outline: none; transition: all 0.15s; height: 34px; }
  .field input:focus, .field select:focus { border-color: var(--accent); background: white; box-shadow: 0 0 0 3px rgba(37,99,235,0.1); }
  .geo-row { display: flex; gap: 8px; align-items: flex-end; }
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

  /* Outreach tracker cards */
  .cards-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 12px; }
  .track-card { background: var(--surface); border: 1px solid var(--border); border-radius: var(--radius); padding: 16px; cursor: pointer; transition: all 0.15s; box-shadow: var(--shadow-sm); }
  .track-card:hover { border-color: var(--border2); box-shadow: var(--shadow); }
  .track-hotel { font-size: 13px; font-weight: 600; color: var(--text); margin-bottom: 2px; }
  .track-gm { font-size: 12px; color: var(--text3); margin-bottom: 10px; }
  .touch-timeline { display: flex; align-items: center; gap: 0; margin-bottom: 12px; }
  .touch-node { display: flex; flex-direction: column; align-items: center; gap: 3px; flex: 1; position: relative; }
  .touch-node:not(:last-child)::after { content: ''; position: absolute; top: 15px; left: 55%; width: 90%; height: 2px; background: var(--border); z-index: 0; }
  .touch-node.done:not(:last-child)::after { background: var(--green); }
  .touch-circle { width: 30px; height: 30px; border-radius: 50%; border: 2px solid var(--border2); background: var(--surface); font-size: 11px; font-weight: 700; font-family: 'Inter', sans-serif; cursor: pointer; display: flex; align-items: center; justify-content: center; color: var(--text3); transition: all 0.15s; z-index: 1; position: relative; }
  .touch-circle.done { background: var(--green-bg); border-color: var(--green); color: var(--green); }
  .touch-circle.overdue { background: var(--red-bg); border-color: var(--red); color: var(--red); }
  .touch-circle.upcoming { background: var(--amber-bg); border-color: var(--amber); color: var(--amber); }
  .touch-circle:hover:not(.done) { border-color: var(--accent); color: var(--accent); background: var(--accent-light); }
  .touch-label-txt { font-size: 10px; font-weight: 500; color: var(--text3); white-space: nowrap; }
  .touch-date-txt { font-size: 9px; color: var(--text3); white-space: nowrap; }
  .touch-date-txt.overdue { color: var(--red); font-weight: 600; }
  .touch-date-txt.upcoming { color: var(--amber); font-weight: 600; }
  .track-status-row { display: flex; justify-content: space-between; align-items: center; margin-top: 4px; }
  .track-status { font-size: 11px; font-weight: 600; padding: 2px 8px; border-radius: 4px; }
  .status-fresh { background: #f3f4f6; color: var(--text3); }
  .status-active { background: var(--accent-light); color: var(--accent); }
  .status-overdue { background: var(--red-bg); color: var(--red); }
  .status-done { background: var(--green-bg); color: var(--green); }

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
  .email-body { background: #f9fafb; border: 1px solid var(--border); border-radius: 6px; padding: 14px; font-size: 13px; line-height: 1.75; color: var(--text2); white-space: pre-wrap; }
  .copy-btn { margin-top: 7px; padding: 4px 12px; border: 1px solid var(--border2); border-radius: 5px; background: var(--surface); font-size: 11px; font-weight: 600; color: var(--text3); cursor: pointer; font-family: 'Inter', sans-serif; text-transform: uppercase; letter-spacing: 0.05em; transition: all 0.15s; }
  .copy-btn:hover { border-color: var(--accent); color: var(--accent); }
  .copy-btn.copied { background: var(--green-bg); border-color: var(--green-border); color: var(--green); }
  .research-notes { font-size: 13px; color: var(--text2); line-height: 1.7; white-space: pre-wrap; }
`;

function uid() { return Math.random().toString(36).slice(2, 9); }
function parseJSON(raw) {
  try { const c = raw.replace(/```json|```/g, "").trim(); const s = c.indexOf("["), e = c.lastIndexOf("]"); if (s < 0 || e < 0) return []; return JSON.parse(c.slice(s, e + 1)); } catch { return []; }
}

// Date helpers for outreach tracker
function addDays(date, n) { const d = new Date(date); d.setDate(d.getDate() + n); return d; }
function fmtDate(d) { if (!d) return null; return new Date(d).toLocaleDateString("en-GB", { day: "2-digit", month: "short" }); }
function fmtDateShort(d) { if (!d) return null; return new Date(d).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "2-digit" }); }
function isOverdue(date) { return date && new Date(date) < new Date(); }
function daysAgo(date) { return date ? Math.floor((new Date() - new Date(date)) / 86400000) : null; }

// Sequence timing: Day 1, Day 4, Day 8-10, Day 15-17
const TOUCH_CONFIG = [
  { n: 1, label: "1st", offsetDays: 0, dueOffsetDays: 1, desc: "Initial" },
  { n: 2, label: "Day 4", offsetDays: 4, dueOffsetDays: 4, desc: "Reply in thread" },
  { n: 3, label: "Day 9", offsetDays: 9, dueOffsetDays: 10, desc: "New angle" },
  { n: 4, label: "Day 16", offsetDays: 16, dueOffsetDays: 17, desc: "Close out" },
];

function getTouchStatus(t) {
  const done = t.done || [];
  if (done.length === 4) return { label: "Sequence complete", cls: "status-done" };
  const nextTouch = TOUCH_CONFIG.find(tc => !done.includes(tc.n));
  if (!nextTouch) return { label: "Done", cls: "status-done" };
  if (!t.d1 && nextTouch.n === 1) return { label: "Not started", cls: "status-fresh" };
  const firstContact = t.d1 ? new Date(t.d1) : null;
  if (!firstContact) return { label: "Not started", cls: "status-fresh" };
  const dueDate = addDays(firstContact, nextTouch.dueOffsetDays);
  if (new Date() > dueDate) return { label: `Touch ${nextTouch.n} overdue`, cls: "status-overdue" };
  return { label: `Touch ${nextTouch.n} due ${fmtDate(dueDate)}`, cls: "status-active" };
}

function getTouchNodeInfo(t, tc) {
  const done = (t.done || []).includes(tc.n);
  if (done) return { cls: "done", dateStr: fmtDate(t[`d${tc.n}`]), dateCls: "" };
  if (!t.d1) return { cls: "", dateStr: null, dateCls: "" };
  const dueDate = addDays(new Date(t.d1), tc.dueOffsetDays);
  const overdue = new Date() > dueDate;
  return { cls: overdue ? "overdue" : "upcoming", dateStr: `Due ${fmtDate(dueDate)}`, dateCls: overdue ? "overdue" : "upcoming" };
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

function TierBadge({ tier }) {
  const t = (tier || "").toLowerCase();
  const cls = t.includes("lux") ? "badge-luxury" : t.includes("prem") ? "badge-premium" : t.includes("life") ? "badge-lifestyle" : "badge-economy";
  return <span className={`badge ${cls}`}>{tier || "—"}</span>;
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
  const [tier, setTier] = useState("Luxury and Premium");
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
  const [prospects, setProspects] = useState([]);
  const [tracking, setTracking] = useState([]);

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
      const enriched = raw.map(p => ({ ...p, id: uid(), created_at: new Date().toISOString(), batch, sdr }));
      const newT = enriched.map(p => ({ id: uid(), prospect_id: p.id, hotel: p.hotel_name, gm: p.gm_name, email: p.email, done: [], sdr, created_at: new Date().toISOString() }));
      await sbFetch("/prospects", { method: "POST", prefer: "return=minimal", body: JSON.stringify(enriched) });
      await sbFetch("/tracking", { method: "POST", prefer: "return=minimal", body: JSON.stringify(newT) });
      setProspects(prev => [...enriched, ...prev]); setTracking(prev => [...newT, ...prev]);
      setProgress(100); setLog(`${enriched.length} prospects saved · ${enriched.filter(p => p.email).length} emails found`);
      setTab("hotels");
    } catch (err) { setError(err.message); }
    finally { setRunning(false); setTimeout(() => setProgress(0), 2000); }
  }

  async function touchToggle(tid, n) {
    const t = tracking.find(x => x.id === tid); if (!t) return;
    const done = [...(t.done || [])];
    const i = done.indexOf(n);
    if (i < 0) done.push(n); else done.splice(i, 1);
    done.sort((a, b) => a - b);
    const upd = { done };
    // Set d1 to now if touching for first time
    if (!t.d1 && n === 1 && i < 0) upd.d1 = new Date().toISOString();
    if (n === 2 && i < 0) upd.d2 = new Date().toISOString();
    if (n === 3 && i < 0) upd.d3 = new Date().toISOString();
    if (n === 4 && i < 0) upd.d4 = new Date().toISOString();
    setTracking(prev => prev.map(x => x.id === tid ? { ...x, ...upd } : x));
    try { await sbFetch(`/tracking?id=eq.${tid}`, { method: "PATCH", prefer: "return=minimal", body: JSON.stringify(upd) }); } catch (e) { console.error(e); }
  }

  // Mark first contact when 1st touch done
  async function setFirstContact(tid) {
    const t = tracking.find(x => x.id === tid); if (!t || t.d1) return;
    const upd = { d1: new Date().toISOString(), done: [1] };
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
                <div className="field">
                  <span className="field-label">Market</span>
                  <div className="geo-row">
                    <select value={region} onChange={e=>{setRegion(e.target.value);const cs=Object.keys(GEO[e.target.value]||{});setCountry(cs[0]||"");setCityInput((GEO[e.target.value]||{})[cs[0]]?.[0]||"")}} style={{width:130}}>
                      {Object.keys(GEO).map(r=><option key={r}>{r}</option>)}
                    </select>
                    <select value={country} onChange={e=>{setCountry(e.target.value);setCityInput((GEO[region]||{})[e.target.value]?.[0]||"")}} style={{width:130}}>
                      {countries.map(c=><option key={c}>{c}</option>)}
                    </select>
                    <select value={cityInput} onChange={e=>setCityInput(e.target.value)} style={{width:130}}>
                      {cities.map(c=><option key={c}>{c}</option>)}
                      <option value="">All cities</option>
                    </select>
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
                <thead><tr><th>Hotel</th><th>Tier</th><th>GM</th><th>Email</th><th>Conf.</th><th>Rooms</th><th>F&B</th><th>ADR</th><th>Rating</th><th>Provider</th><th>Strategy</th><th>SDR</th><th>Added</th></tr></thead>
                <tbody>
                  {filteredP.map(p=>(
                    <tr key={p.id} onClick={()=>setSelected(p.id)}>
                      <td><div className="hotel-name">{p.hotel_name}</div><div className="hotel-sub">{p.brand} · {p.city}</div></td>
                      <td><TierBadge tier={p.tier}/></td>
                      <td><div className="gm-name">{p.gm_name||<span className="cell-muted">—</span>}</div><div className="gm-title-sm">{p.gm_title}</div></td>
                      <td>{p.email?<a className="email-link" href={`mailto:${p.email}`} onClick={e=>e.stopPropagation()}>{p.email}</a>:<span className="cell-muted">—</span>}</td>
                      <td><span className={`badge badge-${(p.contact_confidence||"l").toLowerCase()}`}>{p.contact_confidence||"L"}</span></td>
                      <td><span className="cell-muted">{p.rooms||"—"}</span></td>
                      <td><span className="cell-muted">{p.restaurants||"—"}</span></td>
                      <td><span className="cell-muted">{p.adr_usd?`~$${p.adr_usd}`:"—"}</span></td>
                      <td><span className="cell-muted">{p.rating||"—"}</span></td>
                      <td><span className="cell-muted">{p.current_provider||"—"}</span></td>
                      <td><span className={`badge ${p.engagement_strategy==="DIRECT-TO-GM"?"badge-dgm":"badge-hold"}`}>{(p.engagement_strategy||"—").replace(/-/g," ")}</span></td>
                      <td><span className="sdr-tag">{p.sdr||"—"}</span></td>
                      <td><span className="cell-muted">{fmtDateShort(p.created_at)}</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ))}

          {tab==="outreach" && (filteredT.length===0 ? (
            <div className="empty"><div className="empty-icon">📬</div><div className="empty-title">No outreach tracked</div><div className="empty-sub">Run research to start the tracker.</div></div>
          ) : (
            <div>
              <div style={{fontSize:12,color:"var(--text3)",marginBottom:12,display:"flex",gap:16}}>
                <span>Today: <strong>{fmtDate(new Date())}</strong></span>
                <span style={{color:"var(--red)"}}>● Overdue</span>
                <span style={{color:"var(--amber)"}}>● Due soon</span>
                <span style={{color:"var(--green)"}}>● Done</span>
              </div>
              <div className="cards-grid">
                {filteredT.map(t=>{
                  const status = getTouchStatus(t);
                  return (
                    <div key={t.id} className="track-card" onClick={()=>setSelected(t.prospect_id)}>
                      <div className="track-hotel">{t.hotel}</div>
                      <div className="track-gm">{t.gm||"—"}{t.d1?` · Started ${fmtDate(t.d1)}`:""}</div>
                      <div className="touch-timeline" onClick={e=>e.stopPropagation()}>
                        {TOUCH_CONFIG.map(tc=>{
                          const info = getTouchNodeInfo(t, tc);
                          return (
                            <div key={tc.n} className={`touch-node ${info.cls}`}>
                              <div className={`touch-circle ${info.cls}`} onClick={()=>touchToggle(t.id,tc.n)} title={`Mark touch ${tc.n} ${info.cls==="done"?"undone":"done"}`}>
                                {info.cls==="done"?"✓":tc.n}
                              </div>
                              <div className="touch-label-txt">{tc.label}</div>
                              {info.dateStr && <div className={`touch-date-txt ${info.dateCls}`}>{info.dateStr}</div>}
                            </div>
                          );
                        })}
                      </div>
                      <div className="track-status-row">
                        <span className={`track-status ${status.cls}`}>{status.label}</span>
                        {t.sdr && <span className="sdr-tag">{t.sdr}</span>}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>

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
              <div className="d-row"><span className="d-key">Provider</span><span className="d-val">{sel.current_provider||"Unknown"}</span></div>
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
                  <div className="email-body">{sel.outreach_email_body}</div>
                  <button className={`copy-btn ${copied==="e1"?"copied":""}`} onClick={()=>copy(`Subject: ${sel.outreach_email_subject}\n\n${sel.outreach_email_body}`,"e1")}>{copied==="e1"?"✓ Copied":"Copy"}</button>
                </div>
                <div className="email-touch">
                  <div className="touch-hdr">Touch 2 <span className="tag">Day 4 · Reply in thread</span></div>
                  <div className="subject-line">Subject: Re: {sel.outreach_email_subject}</div>
                  <div className="email-body">{touch2Body(sel)}</div>
                  <button className={`copy-btn ${copied==="e2"?"copied":""}`} onClick={()=>copy(touch2Body(sel),"e2")}>{copied==="e2"?"✓ Copied":"Copy"}</button>
                </div>
                <div className="email-touch">
                  <div className="touch-hdr">Touch 3 <span className="tag">Day 9 · New angle</span></div>
                  <div className="email-body">{touch3Body(sel)}</div>
                  <button className={`copy-btn ${copied==="e3"?"copied":""}`} onClick={()=>copy(touch3Body(sel),"e3")}>{copied==="e3"?"✓ Copied":"Copy"}</button>
                </div>
                <div className="email-touch">
                  <div className="touch-hdr">Touch 4 <span className="tag">Day 16 · Close out</span></div>
                  <div className="subject-line">Subject: {sel.hotel_name} — closing the loop</div>
                  <div className="email-body">{touch4Body(sel)}</div>
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
                <div className="research-notes">{sel.research_notes}</div>
              </div>
            )}
          </div>
        </>
      )}
    </>
  );
}
