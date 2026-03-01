import { useState, useEffect } from "react";

const SUPABASE_URL = "https://rzksmbzlmzvodywfasht.supabase.co";
const SUPABASE_KEY = "sb_publishable_PT6OfaeYiOb_lM5sTP30Lw_XJsir-4E";

async function sbFetch(path, opts = {}) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1${path}`, {
    ...opts,
    headers: {
      "apikey": SUPABASE_KEY,
      "Authorization": `Bearer ${SUPABASE_KEY}`,
      "Content-Type": "application/json",
      "Prefer": opts.prefer || "return=representation",
      ...(opts.headers || {}),
    },
  });
  if (!res.ok) { const e = await res.text(); throw new Error(e); }
  const t = await res.text();
  return t ? JSON.parse(t) : [];
}

const css = `
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
  :root {
    --bg: #f5f6fa;
    --surface: #ffffff;
    --border: #e8eaed;
    --border2: #d1d5db;
    --text: #111827;
    --text2: #374151;
    --text3: #6b7280;
    --accent: #2563eb;
    --accent-light: #eff6ff;
    --accent-dark: #1d4ed8;
    --green: #059669;
    --green-bg: #ecfdf5;
    --green-border: #a7f3d0;
    --amber: #d97706;
    --amber-bg: #fffbeb;
    --red: #dc2626;
    --red-bg: #fef2f2;
    --radius: 8px;
    --shadow-sm: 0 1px 2px rgba(0,0,0,0.05);
    --shadow: 0 1px 3px rgba(0,0,0,0.1), 0 1px 2px rgba(0,0,0,0.06);
    --shadow-md: 0 4px 6px rgba(0,0,0,0.07), 0 2px 4px rgba(0,0,0,0.05);
  }
  body { background: var(--bg); color: var(--text); font-family: 'Inter', -apple-system, sans-serif; font-size: 14px; line-height: 1.5; -webkit-font-smoothing: antialiased; }
  .app { max-width: 1440px; margin: 0 auto; padding: 0; min-height: 100vh; }

  /* Top nav */
  .topnav { background: var(--surface); border-bottom: 1px solid var(--border); padding: 0 28px; display: flex; align-items: center; justify-content: space-between; height: 56px; position: sticky; top: 0; z-index: 10; }
  .nav-left { display: flex; align-items: center; gap: 10px; }
  .wtk-logo { display: flex; align-items: center; gap: 7px; text-decoration: none; }
  .wtk-logo-icon { width: 28px; height: 28px; background: var(--accent); border-radius: 6px; display: flex; align-items: center; justify-content: center; }
  .wtk-logo-icon svg { width: 16px; height: 16px; fill: white; }
  .wtk-logo-text { font-size: 13px; font-weight: 600; color: var(--text); }
  .nav-divider { width: 1px; height: 20px; background: var(--border); }
  .nav-title { font-size: 13px; font-weight: 500; color: var(--text3); }
  .nav-stats { display: flex; gap: 24px; }
  .nav-stat { display: flex; align-items: center; gap: 6px; }
  .nav-stat-n { font-size: 15px; font-weight: 700; color: var(--text); }
  .nav-stat-l { font-size: 12px; color: var(--text3); }

  /* Main content */
  .main { padding: 24px 28px; }

  /* Command panel */
  .cmd-panel { background: var(--surface); border: 1px solid var(--border); border-radius: var(--radius); padding: 20px 24px; margin-bottom: 20px; box-shadow: var(--shadow-sm); }
  .cmd-title { font-size: 11px; font-weight: 600; color: var(--text3); text-transform: uppercase; letter-spacing: 0.07em; margin-bottom: 14px; }
  .cmd-row { display: flex; gap: 12px; align-items: flex-end; flex-wrap: wrap; }
  .field { display: flex; flex-direction: column; gap: 4px; }
  .field-label { font-size: 11px; font-weight: 500; color: var(--text2); }
  .field input, .field select {
    background: var(--bg); border: 1px solid var(--border2); border-radius: 6px;
    padding: 7px 11px; font-family: 'Inter', sans-serif; font-size: 13px;
    color: var(--text); outline: none; transition: all 0.15s; height: 34px;
  }
  .field input:focus, .field select:focus { border-color: var(--accent); background: white; box-shadow: 0 0 0 3px rgba(37,99,235,0.1); }
  .field input::placeholder { color: var(--text3); }
  .run-btn {
    background: var(--accent); color: white; border: none; border-radius: 6px;
    padding: 0 18px; font-family: 'Inter', sans-serif; font-size: 13px; font-weight: 600;
    cursor: pointer; display: flex; align-items: center; gap: 6px; height: 34px;
    transition: all 0.15s; white-space: nowrap; margin-top: 20px;
  }
  .run-btn:hover:not(:disabled) { background: var(--accent-dark); }
  .run-btn:disabled { opacity: 0.5; cursor: not-allowed; }

  .spinner { width: 12px; height: 12px; border: 2px solid rgba(255,255,255,0.3); border-top-color: white; border-radius: 50%; animation: spin 0.7s linear infinite; }
  @keyframes spin { to { transform: rotate(360deg); } }
  .progress-wrap { margin-top: 12px; }
  .progress-bar { height: 3px; background: var(--border); border-radius: 3px; overflow: hidden; }
  .progress-fill { height: 100%; background: var(--accent); border-radius: 3px; transition: width 0.4s; }
  .progress-text { margin-top: 6px; font-size: 12px; color: var(--text3); }
  .success-msg { margin-top: 10px; font-size: 12px; color: var(--green); font-weight: 500; }
  .db-note { margin-top: 4px; font-size: 11px; color: var(--text3); display: flex; align-items: center; gap: 4px; }
  .db-dot { width: 6px; height: 6px; border-radius: 50%; background: var(--green); display: inline-block; }
  .error-msg { margin-top: 10px; padding: 8px 12px; background: var(--red-bg); border: 1px solid #fca5a5; border-radius: 6px; font-size: 12px; color: var(--red); }

  /* Toolbar row */
  .toolbar { display: flex; align-items: center; gap: 8px; margin-bottom: 14px; flex-wrap: wrap; }
  .filter-pill { padding: 4px 12px; border-radius: 20px; border: 1px solid var(--border2); background: var(--surface); font-size: 12px; font-weight: 500; color: var(--text2); cursor: pointer; font-family: 'Inter', sans-serif; transition: all 0.15s; }
  .filter-pill:hover { border-color: var(--accent); color: var(--accent); }
  .filter-pill.active { background: var(--accent); color: white; border-color: var(--accent); }
  .export-btn { padding: 5px 12px; border: 1px solid var(--border2); border-radius: 6px; background: var(--surface); font-size: 12px; font-weight: 500; color: var(--text2); cursor: pointer; font-family: 'Inter', sans-serif; transition: all 0.15s; }
  .export-btn:hover { border-color: var(--accent); color: var(--accent); }
  .record-count { font-size: 12px; color: var(--text3); margin-left: auto; }

  /* Tabs */
  .tabs { display: flex; gap: 0; border-bottom: 1px solid var(--border); margin-bottom: 16px; }
  .tab { padding: 8px 16px; font-size: 13px; font-weight: 500; color: var(--text3); cursor: pointer; border: none; background: none; border-bottom: 2px solid transparent; margin-bottom: -1px; transition: all 0.15s; display: flex; align-items: center; gap: 6px; font-family: 'Inter', sans-serif; }
  .tab:hover { color: var(--text2); }
  .tab.active { color: var(--accent); border-bottom-color: var(--accent); }
  .tab-badge { background: var(--border); color: var(--text3); font-size: 11px; font-weight: 600; padding: 1px 6px; border-radius: 10px; }
  .tab.active .tab-badge { background: var(--accent-light); color: var(--accent); }

  /* Table */
  .table-card { background: var(--surface); border: 1px solid var(--border); border-radius: var(--radius); overflow: hidden; box-shadow: var(--shadow-sm); }
  table { width: 100%; border-collapse: collapse; }
  thead th { background: var(--bg); padding: 9px 14px; text-align: left; font-size: 11px; font-weight: 600; color: var(--text3); letter-spacing: 0.05em; text-transform: uppercase; border-bottom: 1px solid var(--border); white-space: nowrap; }
  tbody tr { border-bottom: 1px solid var(--border); cursor: pointer; transition: background 0.1s; }
  tbody tr:last-child { border-bottom: none; }
  tbody tr:hover { background: #f9fafb; }
  td { padding: 11px 14px; vertical-align: middle; color: var(--text); }
  .hotel-name { font-size: 13px; font-weight: 600; color: var(--text); }
  .hotel-sub { font-size: 12px; color: var(--text3); margin-top: 1px; }
  .gm-name { font-size: 13px; font-weight: 500; color: var(--text); }
  .gm-title { font-size: 11px; color: var(--text3); margin-top: 1px; }
  .cell-muted { font-size: 13px; color: var(--text3); }
  .email-link { font-size: 12px; color: var(--accent); text-decoration: none; }
  .email-link:hover { text-decoration: underline; }
  .ext-link { font-size: 12px; color: var(--accent); text-decoration: none; }

  /* Badges */
  .badge { display: inline-flex; align-items: center; padding: 2px 8px; border-radius: 4px; font-size: 11px; font-weight: 600; letter-spacing: 0.02em; white-space: nowrap; }
  .badge-luxury { background: #fef3c7; color: #92400e; border: 1px solid #fde68a; }
  .badge-upper { background: var(--accent-light); color: #1e40af; border: 1px solid #bfdbfe; }
  .badge-h { background: var(--green-bg); color: #065f46; border: 1px solid var(--green-border); }
  .badge-m { background: var(--amber-bg); color: #92400e; border: 1px solid #fde68a; }
  .badge-l { background: #f3f4f6; color: var(--text3); border: 1px solid var(--border); }
  .badge-dgm { background: var(--accent-light); color: #1e40af; border: 1px solid #bfdbfe; }
  .badge-hold { background: #f3f4f6; color: var(--text3); border: 1px solid var(--border); }
  .sdr-tag { font-size: 12px; font-weight: 600; color: var(--amber); }

  /* Empty */
  .empty { text-align: center; padding: 80px 40px; }
  .empty-icon { font-size: 40px; margin-bottom: 14px; }
  .empty-title { font-size: 16px; font-weight: 600; color: var(--text2); margin-bottom: 6px; }
  .empty-sub { font-size: 13px; color: var(--text3); }

  /* Overlay + Drawer */
  .overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.2); z-index: 40; }
  .drawer {
    position: fixed; top: 0; right: 0; bottom: 0; width: 540px;
    background: var(--surface); border-left: 1px solid var(--border);
    z-index: 50; overflow-y: auto; padding: 28px 28px 40px;
    box-shadow: -8px 0 24px rgba(0,0,0,0.08);
    animation: slideIn 0.2s ease;
  }
  @keyframes slideIn { from { transform: translateX(100%); } to { transform: translateX(0); } }
  .drawer-close { position: absolute; top: 16px; right: 16px; width: 28px; height: 28px; border: none; background: var(--border); border-radius: 6px; cursor: pointer; font-size: 14px; color: var(--text2); display: flex; align-items: center; justify-content: center; transition: background 0.15s; }
  .drawer-close:hover { background: var(--border2); }
  .drawer-hotel { font-size: 20px; font-weight: 700; color: var(--text); margin-bottom: 4px; padding-right: 40px; line-height: 1.3; }
  .drawer-meta { font-size: 12px; color: var(--text3); margin-bottom: 24px; }
  .d-section { margin-bottom: 20px; padding-bottom: 20px; border-bottom: 1px solid var(--border); }
  .d-section:last-child { border-bottom: none; margin-bottom: 0; }
  .d-section-title { font-size: 11px; font-weight: 700; color: var(--text3); text-transform: uppercase; letter-spacing: 0.07em; margin-bottom: 12px; }
  .d-row { display: grid; grid-template-columns: 96px 1fr; gap: 8px; margin-bottom: 8px; font-size: 13px; align-items: start; }
  .d-key { color: var(--text3); font-weight: 500; }
  .d-val { color: var(--text); font-weight: 500; }

  /* Email sequence */
  .email-touch { margin-bottom: 20px; }
  .touch-label { font-size: 11px; font-weight: 700; color: var(--accent); text-transform: uppercase; letter-spacing: 0.07em; margin-bottom: 6px; display: flex; align-items: center; gap: 6px; }
  .touch-label span { background: var(--accent); color: white; font-size: 10px; padding: 1px 6px; border-radius: 10px; }
  .subject-line { font-size: 13px; font-weight: 600; color: var(--text); margin-bottom: 8px; }
  .email-body { background: #f9fafb; border: 1px solid var(--border); border-radius: 6px; padding: 14px; font-size: 13px; line-height: 1.7; color: var(--text2); white-space: pre-wrap; }
  .copy-btn { margin-top: 7px; padding: 4px 12px; border: 1px solid var(--border2); border-radius: 5px; background: var(--surface); font-size: 11px; font-weight: 600; color: var(--text3); cursor: pointer; font-family: 'Inter', sans-serif; text-transform: uppercase; letter-spacing: 0.05em; transition: all 0.15s; }
  .copy-btn:hover { border-color: var(--accent); color: var(--accent); }
  .copy-btn.copied { background: var(--green-bg); border-color: var(--green-border); color: var(--green); }

  /* Outreach cards */
  .cards-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(260px, 1fr)); gap: 12px; }
  .track-card { background: var(--surface); border: 1px solid var(--border); border-radius: var(--radius); padding: 16px; cursor: pointer; transition: all 0.15s; box-shadow: var(--shadow-sm); }
  .track-card:hover { border-color: var(--border2); box-shadow: var(--shadow); }
  .track-hotel { font-size: 13px; font-weight: 600; color: var(--text); margin-bottom: 2px; }
  .track-gm { font-size: 12px; color: var(--text3); margin-bottom: 8px; }
  .track-email { font-size: 12px; color: var(--accent); margin-bottom: 10px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
  .touch-row { display: flex; gap: 8px; }
  .touch-item { text-align: center; }
  .touch-btn { width: 34px; height: 34px; border-radius: 6px; border: 1px solid var(--border2); font-size: 11px; font-weight: 700; font-family: 'Inter', sans-serif; cursor: pointer; transition: all 0.15s; display: flex; align-items: center; justify-content: center; background: var(--surface); color: var(--text3); }
  .touch-btn.done { background: var(--green-bg); border-color: var(--green-border); color: var(--green); }
  .touch-btn.todo:hover { background: var(--accent-light); border-color: #93c5fd; color: var(--accent); }
  .touch-label-txt { font-size: 10px; color: var(--text3); margin-top: 3px; font-weight: 500; }
  .track-footer { margin-top: 10px; display: flex; justify-content: space-between; align-items: center; }
  .track-date { font-size: 11px; color: var(--text3); }
  .track-sdr-tag { font-size: 11px; font-weight: 600; color: var(--amber); }
`;

function uid() { return Math.random().toString(36).slice(2, 9); }
function fmt(d) { if (!d) return "—"; return new Date(d).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "2-digit" }); }
function parseJSON(raw) {
  try {
    const clean = raw.replace(/```json|```/g, "").trim();
    const s = clean.indexOf("["), e = clean.lastIndexOf("]");
    if (s < 0 || e < 0) return [];
    return JSON.parse(clean.slice(s, e + 1));
  } catch { return []; }
}

const TOUCH_LABELS = ["1st", "Day 4", "Day 11", "Final"];

const touch2Body = (sel) => `Hi ${sel.gm_name?.split(" ")[0] || "[Name]"},\n\nJust following up on my note from a few days ago — wanted to make sure it didn't get buried.\n\nThe pattern I mentioned is something we're tracking across multiple properties in ${sel.city}. Happy to share a quick overview specific to ${sel.hotel_name}.\n\nWorth 15 minutes this week?\n\nBest,\nZishuo Wang\nWhere to know Insights | zishuo@wheretoknow.com`;
const touch3Body = (sel) => `Hi ${sel.gm_name?.split(" ")[0] || "[Name]"},\n\nOne more thought — beyond internal feedback, we've been tracking how ${sel.hotel_name}'s key competitors are positioning on the same guest experience signals.\n\nA few have closed visibility gaps that currently show as open in market data for ${sel.city}. Happy to share — no pitch, just a 10-minute look at your competitive standing.\n\nBest,\nZishuo Wang\nWhere to know Insights | zishuo@wheretoknow.com`;
const touch4Body = (sel) => `Hi ${sel.gm_name?.split(" ")[0] || "[Name]"},\n\nI'll keep this brief — I've reached out a few times and don't want to overstay my welcome.\n\nIf the timing isn't right, no worries at all. I'll keep ${sel.hotel_name} on our radar.\n\nIf you're ever curious how peers in ${sel.city} are using guest intelligence to drive ADR and loyalty, I'm here.\n\nWarm regards,\nZishuo Wang\nWhere to know Insights | zishuo@wheretoknow.com`;

export default function App() {
  const [tab, setTab] = useState("hotels");
  const [market, setMarket] = useState("Bangkok");
  const [brand, setBrand] = useState("");
  const [segment, setSegment] = useState("Luxury and Upper Scale");
  const [count, setCount] = useState("5");
  const [sdrName, setSdrName] = useState("");
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
    const saved = localStorage.getItem("wtk_sdr_name");
    if (saved) setSdrName(saved);
    loadData();
  }, []);

  async function loadData() {
    setLoading(true);
    try {
      const [p, t] = await Promise.all([
        sbFetch("/prospects?order=created_at.desc&limit=500"),
        sbFetch("/tracking?order=created_at.desc&limit=500"),
      ]);
      setProspects(p || []);
      setTracking(t || []);
    } catch (e) { console.error(e); }
    setLoading(false);
  }

  function saveSdrName(v) { setSdrName(v); localStorage.setItem("wtk_sdr_name", v); }

  async function run() {
    setRunning(true); setError(null); setProgress(15);
    const n = Math.min(Math.max(parseInt(count) || 5, 1), 50);
    setLog(`Searching ${n} hotels in ${market}...`);
    try {
      setProgress(35);
      const res = await fetch("/api/research", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ city: market, brand, segment, count: n }),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setProgress(70); setLog("Saving to database...");
      const raw = parseJSON(data.result);
      if (!raw.length) throw new Error("No hotels returned. Try a different market.");
      const sdr = sdrName || "Unknown";
      const batch = `${market} · ${fmt(new Date())}`;
      const enriched = raw.map(p => ({ ...p, id: uid(), created_at: new Date().toISOString(), batch, sdr }));
      const newT = enriched.map(p => ({ id: uid(), prospect_id: p.id, hotel: p.hotel_name, gm: p.gm_name, email: p.email, done: [], sdr, created_at: new Date().toISOString() }));
      await sbFetch("/prospects", { method: "POST", prefer: "return=minimal", body: JSON.stringify(enriched) });
      await sbFetch("/tracking", { method: "POST", prefer: "return=minimal", body: JSON.stringify(newT) });
      setProspects(prev => [...enriched, ...prev]);
      setTracking(prev => [...newT, ...prev]);
      setProgress(100);
      setLog(`${enriched.length} prospects saved · ${enriched.filter(p => p.email).length} emails found`);
      setTab("hotels");
    } catch (err) { setError(err.message); }
    finally { setRunning(false); setTimeout(() => setProgress(0), 2000); }
  }

  async function touch(tid, n) {
    const t = tracking.find(x => x.id === tid);
    if (!t) return;
    const done = [...(t.done || [])];
    const i = done.indexOf(n);
    if (i < 0) done.push(n); else done.splice(i, 1);
    done.sort((a, b) => a - b);
    const upd = { done, [`d${n}`]: new Date().toISOString() };
    setTracking(prev => prev.map(x => x.id === tid ? { ...x, ...upd } : x));
    try { await sbFetch(`/tracking?id=eq.${tid}`, { method: "PATCH", prefer: "return=minimal", body: JSON.stringify(upd) }); }
    catch (e) { console.error(e); }
  }

  function copy(text, key) {
    navigator.clipboard.writeText(text).then(() => { setCopied(key); setTimeout(() => setCopied(null), 1500); });
  }

  function exportCSV() {
    const h = ["Hotel","Brand","Segment","City","Country","Rooms","F&B","ADR USD","GM","Title","Email","LinkedIn","Confidence","Strategy","Provider","SDR","Batch","Date"];
    const rows = filteredP.map(p => [p.hotel_name,p.brand,p.segment,p.city,p.country,p.rooms||"",p.restaurants||"",p.adr_usd||"",p.gm_name||"",p.gm_title||"",p.email||"",p.linkedin||"",p.contact_confidence||"",p.engagement_strategy||"",p.current_provider||"",p.sdr||"",p.batch||"",fmt(p.created_at)]);
    const csv = [h,...rows].map(r => r.map(v => `"${String(v).replace(/"/g,'""')}"`).join(",")).join("\n");
    const a = document.createElement("a"); a.href = URL.createObjectURL(new Blob([csv],{type:"text/csv"})); a.download = `WTK_SDR_${new Date().toISOString().slice(0,10)}.csv`; a.click();
  }

  const sel = selected ? prospects.find(p => p.id === selected) : null;
  const sdrs = ["all", ...new Set(prospects.map(p => p.sdr).filter(Boolean))];
  const filteredP = filterSdr === "all" ? prospects : prospects.filter(p => p.sdr === filterSdr);
  const filteredT = filterSdr === "all" ? tracking : tracking.filter(t => t.sdr === filterSdr);
  const contacted = tracking.filter(t => (t.done || []).length > 0).length;

  return (
    <>
      <style>{css}</style>
      <div className="app">

        {/* Top Nav */}
        <nav className="topnav">
          <div className="nav-left">
            <div className="wtk-logo">
              <div className="wtk-logo-icon">
                <svg viewBox="0 0 16 16"><path d="M8 1a7 7 0 100 14A7 7 0 008 1zm0 2a5 5 0 110 10A5 5 0 018 3zm0 2a3 3 0 100 6A3 3 0 008 5z"/></svg>
              </div>
              <span className="wtk-logo-text">Where to know</span>
            </div>
            <div className="nav-divider"/>
            <span className="nav-title">SDR Intelligence</span>
          </div>
          <div className="nav-stats">
            <div className="nav-stat"><span className="nav-stat-n">{prospects.length}</span><span className="nav-stat-l">Prospects</span></div>
            <div className="nav-stat"><span className="nav-stat-n">{prospects.filter(p=>p.email).length}</span><span className="nav-stat-l">Emails</span></div>
            <div className="nav-stat"><span className="nav-stat-n">{contacted}</span><span className="nav-stat-l">Contacted</span></div>
          </div>
        </nav>

        <div className="main">
          {/* Command Panel */}
          <div className="cmd-panel">
            <div className="cmd-title">Research Command</div>
            <div className="cmd-row">
              <div className="field">
                <span className="field-label">Market / City / Region</span>
                <input value={market} onChange={e=>setMarket(e.target.value)} placeholder="Vienna, UK, Europe..." style={{width:180}} />
              </div>
              <div className="field">
                <span className="field-label">Brand (optional)</span>
                <input value={brand} onChange={e=>setBrand(e.target.value)} placeholder="IHG, Kempinski..." style={{width:160}} />
              </div>
              <div className="field">
                <span className="field-label">Segment</span>
                <select value={segment} onChange={e=>setSegment(e.target.value)} style={{width:200}}>
                  <option>Luxury and Upper Scale</option>
                  <option>Luxury only</option>
                  <option>Upper Scale only</option>
                </select>
              </div>
              <div className="field">
                <span className="field-label">Count (max 50)</span>
                <input type="number" min="1" max="50" value={count} onChange={e=>setCount(e.target.value)} style={{width:80}} />
              </div>
              <div className="field">
                <span className="field-label">Your Name (SDR)</span>
                <input value={sdrName} onChange={e=>saveSdrName(e.target.value)} placeholder="e.g. Vincent" style={{width:130}} />
              </div>
              <button className="run-btn" onClick={run} disabled={running||!market}>
                {running ? <><div className="spinner"/>Researching...</> : "▶ Run Research"}
              </button>
            </div>
            {running && <div className="progress-wrap"><div className="progress-bar"><div className="progress-fill" style={{width:`${progress}%`}}/></div><div className="progress-text">› {log}</div></div>}
            {!running && log && !error && (<div><div className="success-msg">✓ {log}</div><div className="db-note"><span className="db-dot"/>Saved to shared database — visible to all team members</div></div>)}
            {error && <div className="error-msg">⚠ {error}</div>}
          </div>

          {/* Toolbar */}
          <div className="toolbar">
            {sdrs.length > 1 && sdrs.map(s => (
              <button key={s} className={`filter-pill ${filterSdr===s?"active":""}`} onClick={()=>setFilterSdr(s)}>
                {s === "all" ? "All SDRs" : s}
              </button>
            ))}
            {filteredP.length > 0 && <button className="export-btn" onClick={exportCSV}>↓ Export CSV</button>}
            <span className="record-count">{loading ? "Loading..." : `${filteredP.length} prospects in database`}</span>
          </div>

          {/* Tabs */}
          <div className="tabs">
            {[["hotels","Hotels",filteredP.length],["outreach","Outreach Tracker",filteredT.length]].map(([id,label,cnt])=>(
              <button key={id} className={`tab ${tab===id?"active":""}`} onClick={()=>setTab(id)}>
                {label}<span className="tab-badge">{cnt}</span>
              </button>
            ))}
          </div>

          {/* Hotels Table */}
          {tab === "hotels" && (filteredP.length === 0 ? (
            <div className="empty">
              <div className="empty-icon">🏨</div>
              <div className="empty-title">{loading ? "Loading database..." : "No prospects yet"}</div>
              <div className="empty-sub">Set your market and click Run Research to start.</div>
            </div>
          ) : (
            <div className="table-card">
              <table>
                <thead><tr>
                  <th>Hotel</th><th>Segment</th><th>GM</th><th>Email</th>
                  <th>Conf.</th><th>Rooms</th><th>F&B</th><th>ADR</th>
                  <th>Provider</th><th>Strategy</th><th>SDR</th><th>Added</th>
                </tr></thead>
                <tbody>
                  {filteredP.map(p => (
                    <tr key={p.id} onClick={()=>setSelected(p.id)}>
                      <td><div className="hotel-name">{p.hotel_name}</div><div className="hotel-sub">{p.brand} · {p.city}</div></td>
                      <td><span className={`badge ${p.segment==="Luxury"?"badge-luxury":"badge-upper"}`}>{p.segment}</span></td>
                      <td><div className="gm-name">{p.gm_name||<span className="cell-muted">—</span>}</div><div className="gm-title">{p.gm_title}</div></td>
                      <td>{p.email ? <a className="email-link" href={`mailto:${p.email}`} onClick={e=>e.stopPropagation()}>{p.email}</a> : <span className="cell-muted">not found</span>}</td>
                      <td><span className={`badge badge-${(p.contact_confidence||"l").toLowerCase()}`}>{p.contact_confidence||"L"}</span></td>
                      <td><span className="cell-muted">{p.rooms||"—"}</span></td>
                      <td><span className="cell-muted">{p.restaurants||"—"}</span></td>
                      <td><span className="cell-muted">{p.adr_usd?`~$${p.adr_usd}`:"—"}</span></td>
                      <td><span className="cell-muted">{p.current_provider||"—"}</span></td>
                      <td><span className={`badge ${p.engagement_strategy==="DIRECT-TO-GM"?"badge-dgm":"badge-hold"}`}>{(p.engagement_strategy||"—").replace(/-/g," ")}</span></td>
                      <td><span className="sdr-tag">{p.sdr||"—"}</span></td>
                      <td><span className="cell-muted">{fmt(p.created_at)}</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ))}

          {/* Outreach Tracker */}
          {tab === "outreach" && (filteredT.length === 0 ? (
            <div className="empty">
              <div className="empty-icon">📬</div>
              <div className="empty-title">No outreach tracked</div>
              <div className="empty-sub">Run research to populate the tracker.</div>
            </div>
          ) : (
            <div className="cards-grid">
              {filteredT.map(t => {
                const done = t.done || [];
                return (
                  <div key={t.id} className="track-card" onClick={()=>setSelected(t.prospect_id)}>
                    <div className="track-hotel">{t.hotel}</div>
                    <div className="track-gm">{t.gm || "—"}</div>
                    {t.email && <div className="track-email">{t.email}</div>}
                    <div className="touch-row" onClick={e=>e.stopPropagation()}>
                      {[1,2,3,4].map(n=>(
                        <div key={n} className="touch-item">
                          <button className={`touch-btn ${done.includes(n)?"done":"todo"}`} onClick={()=>touch(t.id,n)}>{done.includes(n)?"✓":n}</button>
                          <div className="touch-label-txt">{TOUCH_LABELS[n-1]}</div>
                        </div>
                      ))}
                    </div>
                    <div className="track-footer">
                      <span className="track-date">{done.length > 0 ? `Last: ${fmt(t[`d${Math.max(...done)}`])}` : "Not contacted"}</span>
                      {t.sdr && <span className="track-sdr-tag">{t.sdr}</span>}
                    </div>
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      </div>

      {/* Detail Drawer */}
      {sel && (
        <>
          <div className="overlay" onClick={()=>setSelected(null)}/>
          <div className="drawer">
            <button className="drawer-close" onClick={()=>setSelected(null)}>✕</button>
            <div className="drawer-hotel">{sel.hotel_name}</div>
            <div className="drawer-meta">{sel.brand} · {sel.city}, {sel.country} · Added by {sel.sdr} · {fmt(sel.created_at)}</div>

            <div className="d-section">
              <div className="d-section-title">Property</div>
              <div className="d-row"><span className="d-key">Address</span><span className="d-val">{sel.address||"—"}</span></div>
              <div className="d-row"><span className="d-key">Rooms</span><span className="d-val">{sel.rooms||"—"}</span></div>
              <div className="d-row"><span className="d-key">Restaurants</span><span className="d-val">{sel.restaurants||"—"}</span></div>
              <div className="d-row"><span className="d-key">Est. ADR</span><span className="d-val">{sel.adr_usd?`~$${sel.adr_usd}/night`:"—"}</span></div>
              <div className="d-row"><span className="d-key">Provider</span><span className="d-val">{sel.current_provider||"Unknown"}</span></div>
              <div className="d-row"><span className="d-key">Website</span><span className="d-val">{sel.website?<a className="ext-link" href={sel.website} target="_blank" rel="noreferrer">↗ Visit</a>:"—"}</span></div>
            </div>

            <div className="d-section">
              <div className="d-section-title">Decision Maker</div>
              <div className="d-row"><span className="d-key">Name</span><span className="d-val" style={{fontWeight:700}}>{sel.gm_name||"—"}</span></div>
              <div className="d-row"><span className="d-key">Title</span><span className="d-val">{sel.gm_title||"—"}</span></div>
              <div className="d-row"><span className="d-key">Email</span><span className="d-val">{sel.email?<a className="email-link" href={`mailto:${sel.email}`}>{sel.email}</a>:<span className="cell-muted">Not found</span>}</span></div>
              <div className="d-row"><span className="d-key">LinkedIn</span><span className="d-val">{sel.linkedin?<a className="ext-link" href={sel.linkedin} target="_blank" rel="noreferrer">↗ View Profile</a>:<span className="cell-muted">Not found</span>}</span></div>
              <div className="d-row"><span className="d-key">Confidence</span><span className="d-val"><span className={`badge badge-${(sel.contact_confidence||"l").toLowerCase()}`}>{sel.contact_confidence}</span></span></div>
            </div>

            <div className="d-section">
              <div className="d-section-title">Strategy</div>
              <div className="d-row"><span className="d-key">Approach</span><span className="d-val"><span className={`badge ${sel.engagement_strategy==="DIRECT-TO-GM"?"badge-dgm":"badge-hold"}`}>{(sel.engagement_strategy||"—").replace(/-/g," ")}</span></span></div>
              <div style={{fontSize:13,color:sel.strategy_reason?"var(--text2)":"var(--text3)",marginTop:8,lineHeight:1.65}}>{sel.strategy_reason||"—"}</div>
            </div>

            {sel.outreach_email_subject && (
              <div className="d-section">
                <div className="d-section-title">4-Touch Email Sequence</div>

                <div className="email-touch">
                  <div className="touch-label">Touch 1 <span>Initial</span></div>
                  <div className="subject-line">Subject: {sel.outreach_email_subject}</div>
                  <div className="email-body">{sel.outreach_email_body}</div>
                  <button className={`copy-btn ${copied==="e1"?"copied":""}`} onClick={()=>copy(`Subject: ${sel.outreach_email_subject}\n\n${sel.outreach_email_body}`,"e1")}>{copied==="e1"?"✓ Copied":"Copy"}</button>
                </div>

                <div className="email-touch">
                  <div className="touch-label">Touch 2 <span>Day 4 — Reply in thread</span></div>
                  <div className="email-body">{touch2Body(sel)}</div>
                  <button className={`copy-btn ${copied==="e2"?"copied":""}`} onClick={()=>copy(touch2Body(sel),"e2")}>{copied==="e2"?"✓ Copied":"Copy"}</button>
                </div>

                <div className="email-touch">
                  <div className="touch-label">Touch 3 <span>Day 11 — Competition angle</span></div>
                  <div className="email-body">{touch3Body(sel)}</div>
                  <button className={`copy-btn ${copied==="e3"?"copied":""}`} onClick={()=>copy(touch3Body(sel),"e3")}>{copied==="e3"?"✓ Copied":"Copy"}</button>
                </div>

                <div className="email-touch">
                  <div className="touch-label">Touch 4 <span>Final — Keep in touch</span></div>
                  <div className="email-body">{touch4Body(sel)}</div>
                  <button className={`copy-btn ${copied==="e4"?"copied":""}`} onClick={()=>copy(touch4Body(sel),"e4")}>{copied==="e4"?"✓ Copied":"Copy"}</button>
                </div>
              </div>
            )}

            {sel.linkedin_dm && (
              <div className="d-section">
                <div className="d-section-title">LinkedIn DM</div>
                <div className="email-body">{sel.linkedin_dm}</div>
                <button className={`copy-btn ${copied==="dm"?"copied":""}`} onClick={()=>copy(sel.linkedin_dm,"dm")}>{copied==="dm"?"✓ Copied":"Copy DM"}</button>
              </div>
            )}

            {sel.research_notes && (
              <div className="d-section">
                <div className="d-section-title">Research Notes</div>
                <div style={{fontSize:13,color:"var(--text2)",lineHeight:1.65}}>{sel.research_notes}</div>
              </div>
            )}
          </div>
        </>
      )}
    </>
  );
}
