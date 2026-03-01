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
  if (!res.ok) {
    const err = await res.text();
    throw new Error(err);
  }
  const text = await res.text();
  return text ? JSON.parse(text) : [];
}

const css = `
  @import url('https://fonts.googleapis.com/css2?family=Instrument+Serif:ital@0;1&family=Inter:wght@300;400;500;600&display=swap');
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
  :root {
    --bg: #f9f9f8; --surface: #ffffff; --surface2: #f4f4f2; --border: #e5e5e3;
    --border2: #d4d4d1; --text: #1a1a18; --text2: #6b6b68; --text3: #9b9b97;
    --accent: #d97706; --blue: #2563eb; --blue-bg: #eff6ff;
    --green: #16a34a; --green-bg: #f0fdf4; --red: #dc2626; --red-bg: #fef2f2;
    --radius: 10px; --shadow: 0 1px 3px rgba(0,0,0,0.06); --shadow-md: 0 4px 12px rgba(0,0,0,0.08);
  }
  body { background: var(--bg); color: var(--text); font-family: 'Inter', sans-serif; font-size: 14px; line-height: 1.5; -webkit-font-smoothing: antialiased; }
  .app { max-width: 1400px; margin: 0 auto; padding: 32px 24px; }

  .header { display: flex; align-items: flex-end; justify-content: space-between; margin-bottom: 28px; padding-bottom: 24px; border-bottom: 1px solid var(--border); }
  .logo-row { display: flex; align-items: center; gap: 8px; margin-bottom: 4px; }
  .logo-mark { width: 7px; height: 7px; background: var(--accent); border-radius: 50%; }
  .logo-name { font-size: 11px; font-weight: 500; color: var(--text3); letter-spacing: 0.06em; text-transform: uppercase; }
  .title { font-family: 'Instrument Serif', serif; font-size: 26px; color: var(--text); line-height: 1; }
  .title em { font-style: italic; color: var(--accent); }
  .header-stats { display: flex; gap: 32px; }
  .stat { text-align: right; }
  .stat-n { font-family: 'Instrument Serif', serif; font-size: 24px; color: var(--text); line-height: 1; }
  .stat-l { font-size: 11px; color: var(--text3); text-transform: uppercase; letter-spacing: 0.06em; }

  .panel { background: var(--surface); border: 1px solid var(--border); border-radius: var(--radius); padding: 20px; margin-bottom: 20px; box-shadow: var(--shadow); }
  .panel-label { font-size: 11px; font-weight: 500; color: var(--text3); letter-spacing: 0.08em; text-transform: uppercase; margin-bottom: 14px; }
  .command-row { display: flex; gap: 10px; align-items: flex-end; flex-wrap: wrap; }
  .field { display: flex; flex-direction: column; gap: 5px; }
  .field-label { font-size: 11px; font-weight: 500; color: var(--text2); }
  .field input, .field select { background: var(--bg); border: 1px solid var(--border2); border-radius: 7px; padding: 8px 12px; font-family: 'Inter', sans-serif; font-size: 13px; color: var(--text); outline: none; transition: border-color 0.15s; height: 36px; }
  .field input:focus, .field select:focus { border-color: var(--blue); background: var(--surface); }

  .run-btn { background: var(--text); color: white; border: none; border-radius: 7px; padding: 0 20px; font-family: 'Inter', sans-serif; font-size: 13px; font-weight: 500; cursor: pointer; display: flex; align-items: center; gap: 7px; transition: all 0.15s; height: 36px; white-space: nowrap; }
  .run-btn:hover:not(:disabled) { background: #2d2d2b; transform: translateY(-1px); box-shadow: var(--shadow-md); }
  .run-btn:disabled { opacity: 0.5; cursor: not-allowed; }
  .clear-btn { background: none; border: 1px solid var(--border2); border-radius: 7px; padding: 0 14px; font-family: 'Inter', sans-serif; font-size: 12px; color: var(--text2); cursor: pointer; transition: all 0.15s; height: 36px; }
  .clear-btn:hover { border-color: var(--red); color: var(--red); }

  .spinner { width: 13px; height: 13px; border: 2px solid rgba(255,255,255,0.3); border-top-color: white; border-radius: 50%; animation: spin 0.7s linear infinite; }
  @keyframes spin { to { transform: rotate(360deg); } }
  .progress-bar { margin-top: 12px; height: 2px; background: var(--border); border-radius: 2px; overflow: hidden; }
  .progress-fill { height: 100%; background: var(--accent); border-radius: 2px; transition: width 0.4s ease; }
  .progress-text { margin-top: 7px; font-size: 12px; color: var(--text3); }
  .progress-text span { color: var(--accent); font-weight: 500; }
  .error-msg { margin-top: 10px; padding: 10px 14px; background: var(--red-bg); border: 1px solid #fca5a5; border-radius: 7px; font-size: 12px; color: var(--red); }
  .success-msg { margin-top: 10px; font-size: 12px; color: var(--green); }
  .db-badge { display: inline-flex; align-items: center; gap: 5px; margin-top: 8px; font-size: 11px; color: var(--green); }
  .db-dot { width: 6px; height: 6px; background: var(--green); border-radius: 50%; }

  .tabs { display: flex; gap: 2px; margin-bottom: 16px; border-bottom: 1px solid var(--border); }
  .tab { padding: 9px 16px; font-size: 13px; font-weight: 500; color: var(--text3); cursor: pointer; border: none; background: none; border-bottom: 2px solid transparent; margin-bottom: -1px; transition: all 0.15s; display: flex; align-items: center; gap: 6px; }
  .tab:hover { color: var(--text2); }
  .tab.active { color: var(--text); border-bottom-color: var(--text); }
  .tab-count { background: var(--surface2); color: var(--text3); font-size: 11px; font-weight: 500; padding: 1px 6px; border-radius: 10px; }
  .tab.active .tab-count { background: var(--text); color: white; }

  .toolbar { display: flex; align-items: center; gap: 8px; margin-bottom: 14px; flex-wrap: wrap; }
  .export-btn { background: var(--surface); border: 1px solid var(--border2); border-radius: 7px; padding: 6px 14px; font-family: 'Inter', sans-serif; font-size: 12px; font-weight: 500; color: var(--text2); cursor: pointer; transition: all 0.15s; }
  .export-btn:hover { border-color: var(--blue); color: var(--blue); }
  .record-count { font-size: 12px; color: var(--text3); margin-left: auto; }
  .filter-chip { padding: 4px 12px; border-radius: 20px; border: 1px solid var(--border2); background: var(--surface); font-size: 12px; color: var(--text2); cursor: pointer; transition: all 0.15s; font-family: 'Inter', sans-serif; }
  .filter-chip:hover { border-color: var(--blue); color: var(--blue); }
  .filter-chip.active { background: var(--text); color: white; border-color: var(--text); }

  .table-wrap { background: var(--surface); border: 1px solid var(--border); border-radius: var(--radius); overflow: hidden; box-shadow: var(--shadow); }
  table { width: 100%; border-collapse: collapse; font-size: 13px; }
  thead th { background: var(--surface2); padding: 10px 14px; text-align: left; font-size: 11px; font-weight: 600; color: var(--text3); letter-spacing: 0.06em; text-transform: uppercase; border-bottom: 1px solid var(--border); white-space: nowrap; }
  tbody tr { border-bottom: 1px solid var(--border); cursor: pointer; transition: background 0.1s; }
  tbody tr:last-child { border-bottom: none; }
  tbody tr:hover { background: var(--bg); }
  td { padding: 12px 14px; vertical-align: top; }
  .hotel-name { font-weight: 500; color: var(--text); margin-bottom: 2px; }
  .hotel-sub { font-size: 12px; color: var(--text3); }

  .badge { display: inline-block; padding: 2px 8px; border-radius: 20px; font-size: 11px; font-weight: 500; white-space: nowrap; }
  .badge-luxury { background: #fef3c7; color: #92400e; }
  .badge-upper { background: var(--blue-bg); color: #1e40af; }
  .badge-h { background: var(--green-bg); color: #166534; }
  .badge-m { background: #fffbeb; color: #92400e; }
  .badge-l { background: var(--surface2); color: var(--text3); }
  .badge-dgm { background: var(--blue-bg); color: #1e40af; }
  .badge-hold { background: var(--surface2); color: var(--text3); }
  .link { color: var(--blue); text-decoration: none; font-size: 12px; }
  .link:hover { text-decoration: underline; }
  .null-val { color: var(--text3); font-size: 12px; }

  .empty { text-align: center; padding: 80px 40px; }
  .empty-icon { font-size: 36px; margin-bottom: 12px; opacity: 0.5; }
  .empty-title { font-family: 'Instrument Serif', serif; font-size: 18px; color: var(--text2); margin-bottom: 6px; }
  .empty-sub { font-size: 13px; color: var(--text3); line-height: 1.6; }

  .overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.15); z-index: 50; }
  .drawer { position: fixed; top: 0; right: 0; bottom: 0; width: 520px; background: var(--surface); border-left: 1px solid var(--border); z-index: 51; overflow-y: auto; padding: 28px; animation: slideIn 0.2s ease; box-shadow: -8px 0 32px rgba(0,0,0,0.08); }
  @keyframes slideIn { from { transform: translateX(100%); } to { transform: translateX(0); } }
  .drawer-close { position: absolute; top: 20px; right: 20px; background: var(--surface2); border: none; border-radius: 6px; width: 28px; height: 28px; cursor: pointer; color: var(--text2); display: flex; align-items: center; justify-content: center; font-size: 16px; }
  .drawer-hotel { font-family: 'Instrument Serif', serif; font-size: 20px; margin-bottom: 4px; padding-right: 36px; }
  .drawer-meta { font-size: 12px; color: var(--text3); margin-bottom: 20px; }
  .section { margin-bottom: 20px; padding-bottom: 20px; border-bottom: 1px solid var(--border); }
  .section:last-child { border-bottom: none; }
  .section-title { font-size: 11px; font-weight: 600; color: var(--text3); text-transform: uppercase; letter-spacing: 0.08em; margin-bottom: 10px; }
  .info-row { display: flex; gap: 10px; margin-bottom: 6px; font-size: 13px; }
  .info-key { color: var(--text3); min-width: 90px; flex-shrink: 0; }
  .email-card { background: var(--bg); border: 1px solid var(--border); border-radius: 8px; padding: 14px; font-size: 13px; line-height: 1.65; color: var(--text2); white-space: pre-wrap; }
  .subject-line { font-weight: 500; color: var(--text); margin-bottom: 10px; font-size: 13px; }
  .email-day { font-size: 11px; font-weight: 600; color: var(--accent); text-transform: uppercase; letter-spacing: 0.06em; margin-bottom: 6px; margin-top: 16px; }
  .copy-btn { margin-top: 8px; background: var(--surface2); border: 1px solid var(--border); border-radius: 6px; padding: 5px 12px; font-family: 'Inter', sans-serif; font-size: 11px; font-weight: 500; color: var(--text2); cursor: pointer; transition: all 0.15s; text-transform: uppercase; letter-spacing: 0.05em; }
  .copy-btn:hover { border-color: var(--blue); color: var(--blue); }
  .copy-btn.copied { background: var(--green-bg); border-color: #86efac; color: var(--green); }

  .cards-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(260px, 1fr)); gap: 12px; }
  .track-card { background: var(--surface); border: 1px solid var(--border); border-radius: var(--radius); padding: 16px; cursor: pointer; transition: all 0.15s; box-shadow: var(--shadow); }
  .track-card:hover { border-color: var(--border2); box-shadow: var(--shadow-md); }
  .track-hotel { font-weight: 500; margin-bottom: 2px; font-size: 13px; }
  .track-gm { font-size: 12px; color: var(--text3); margin-bottom: 8px; }
  .track-email { font-size: 12px; color: var(--blue); margin-bottom: 10px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
  .touch-row { display: flex; gap: 8px; }
  .touch-item { text-align: center; }
  .touch-btn { width: 32px; height: 32px; border-radius: 6px; border: none; font-size: 11px; font-weight: 600; font-family: 'Inter', sans-serif; cursor: pointer; transition: all 0.15s; display: flex; align-items: center; justify-content: center; }
  .touch-btn.done { background: var(--green-bg); color: var(--green); }
  .touch-btn.todo { background: var(--surface2); color: var(--text3); }
  .touch-btn.todo:hover { background: var(--blue-bg); color: var(--blue); }
  .touch-label { font-size: 10px; color: var(--text3); margin-top: 3px; white-space: nowrap; }
  .track-date { font-size: 11px; color: var(--text3); margin-top: 8px; }
  .track-sdr { font-size: 11px; color: var(--accent); font-weight: 500; margin-top: 3px; }
`;

function uid() { return Math.random().toString(36).slice(2, 9); }
function fmt(d) { if (!d) return "—"; return new Date(d).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "2-digit" }); }
function parseJSON(raw) {
  try {
    const clean = raw.replace(/```json|```/g, "").trim();
    const s = clean.indexOf("["), e = clean.lastIndexOf("]");
    if (s === -1 || e === -1) return [];
    return JSON.parse(clean.slice(s, e + 1));
  } catch { return []; }
}

const TOUCH_LABELS = ["1st", "Day 4", "Day 11", "Final"];

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
    } catch (e) {
      console.error("Load error:", e);
    }
    setLoading(false);
  }

  function saveSdrName(name) {
    setSdrName(name);
    localStorage.setItem("wtk_sdr_name", name);
  }

  async function run() {
    setRunning(true); setError(null); setProgress(10);
    const n = Math.min(Math.max(parseInt(count) || 5, 1), 50);
    setLog(`Searching ${n} hotels in ${market}...`);
    try {
      setProgress(30);
      const res = await fetch("/api/research", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ city: market, brand, segment, count: n }),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setProgress(65); setLog("Saving to database...");
      const raw = parseJSON(data.result);
      if (!raw.length) throw new Error("No hotels returned.");
      const batch = `${market} · ${fmt(new Date())}`;
      const sdr = sdrName || "Unknown";
      const enriched = raw.map(p => ({ ...p, id: uid(), created_at: new Date().toISOString(), batch, sdr }));
      const newT = enriched.map(p => ({ id: uid(), prospect_id: p.id, hotel: p.hotel_name, gm: p.gm_name, email: p.email, done: [], sdr, created_at: new Date().toISOString() }));

      // Save to Supabase
      await sbFetch("/prospects", { method: "POST", prefer: "return=minimal", body: JSON.stringify(enriched) });
      await sbFetch("/tracking", { method: "POST", prefer: "return=minimal", body: JSON.stringify(newT) });

      setProspects(prev => [...enriched, ...prev]);
      setTracking(prev => [...newT, ...prev]);
      setProgress(100);
      setLog(`${enriched.length} prospects saved to database · ${enriched.filter(p=>p.email).length} emails found`);
      setTab("hotels");
    } catch (err) {
      setError(err.message);
    } finally {
      setRunning(false);
      setTimeout(() => setProgress(0), 2000);
    }
  }

  async function touch(tid, n) {
    const t = tracking.find(x => x.id === tid);
    if (!t) return;
    const done = [...(t.done || [])];
    const i = done.indexOf(n);
    if (i === -1) done.push(n); else done.splice(i, 1);
    done.sort((a,b)=>a-b);
    const update = { done, [`d${n}`]: new Date().toISOString() };
    setTracking(prev => prev.map(x => x.id === tid ? { ...x, ...update } : x));
    try {
      await sbFetch(`/tracking?id=eq.${tid}`, { method: "PATCH", prefer: "return=minimal", body: JSON.stringify(update) });
    } catch (e) { console.error(e); }
  }

  function copy(text, key) {
    navigator.clipboard.writeText(text).then(() => { setCopied(key); setTimeout(() => setCopied(null), 1500); });
  }

  function exportCSV() {
    const h = ["Hotel","Brand","Segment","City","Country","Rooms","F&B","ADR USD","GM","Title","Email","LinkedIn","Confidence","Strategy","Provider","SDR","Batch"];
    const rows = filteredP.map(p => [p.hotel_name,p.brand,p.segment,p.city,p.country,p.rooms||"",p.restaurants||"",p.adr_usd||"",p.gm_name||"",p.gm_title||"",p.email||"",p.linkedin||"",p.contact_confidence||"",p.engagement_strategy||"",p.current_provider||"",p.sdr||"",p.batch||""]);
    const csv = [h,...rows].map(r=>r.map(v=>`"${String(v).replace(/"/g,'""')}"`).join(",")).join("\n");
    const a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob([csv],{type:"text/csv"}));
    a.download = `WTK_SDR_${new Date().toISOString().slice(0,10)}.csv`;
    a.click();
  }

  const sel = selected ? prospects.find(p => p.id === selected) : null;
  const sdrs = ["all", ...new Set(prospects.map(p=>p.sdr).filter(Boolean))];
  const filteredP = filterSdr === "all" ? prospects : prospects.filter(p => p.sdr === filterSdr);
  const filteredT = filterSdr === "all" ? tracking : tracking.filter(t => t.sdr === filterSdr);
  const contacted = tracking.filter(t => (t.done||[]).length > 0).length;

  return (
    <>
      <style>{css}</style>
      <div className="app">
        {/* Header */}
        <div className="header">
          <div>
            <div className="logo-row"><div className="logo-mark"/><span className="logo-name">Where to know Insights</span></div>
            <h1 className="title">SDR <em>Intelligence</em></h1>
          </div>
          <div className="header-stats">
            <div className="stat"><div className="stat-n">{prospects.length}</div><div className="stat-l">Total Prospects</div></div>
            <div className="stat"><div className="stat-n">{prospects.filter(p=>p.email).length}</div><div className="stat-l">Emails</div></div>
            <div className="stat"><div className="stat-n">{contacted}</div><div className="stat-l">Contacted</div></div>
          </div>
        </div>

        {/* Command */}
        <div className="panel">
          <div className="panel-label">Research Command</div>
          <div className="command-row">
            <div className="field">
              <label className="field-label">Market / City / Region</label>
              <input value={market} onChange={e=>setMarket(e.target.value)} placeholder="Vienna, UK, Europe..." style={{minWidth:180}} />
            </div>
            <div className="field">
              <label className="field-label">Brand (optional)</label>
              <input value={brand} onChange={e=>setBrand(e.target.value)} placeholder="IHG, Kempinski..." style={{minWidth:150}} />
            </div>
            <div className="field">
              <label className="field-label">Segment</label>
              <select value={segment} onChange={e=>setSegment(e.target.value)} style={{minWidth:180}}>
                <option>Luxury and Upper Scale</option>
                <option>Luxury only</option>
                <option>Upper Scale only</option>
              </select>
            </div>
            <div className="field">
              <label className="field-label">Count (max 50)</label>
              <input type="number" min="1" max="50" value={count} onChange={e=>setCount(e.target.value)} style={{width:80}} />
            </div>
            <div className="field">
              <label className="field-label">Your Name (SDR)</label>
              <input value={sdrName} onChange={e=>saveSdrName(e.target.value)} placeholder="e.g. Vincent" style={{width:120}} />
            </div>
            <button className="run-btn" onClick={run} disabled={running||!market} style={{marginTop:20}}>
              {running ? <><div className="spinner"/>Researching...</> : "▶ Run Research"}
            </button>
          </div>
          {running && (<><div className="progress-bar"><div className="progress-fill" style={{width:`${progress}%`}}/></div><div className="progress-text"><span>›</span> {log}</div></>)}
          {!running && log && !error && (
            <div>
              <div className="success-msg">{log}</div>
              <div className="db-badge"><div className="db-dot"/>Saved to shared database — all team members can see this</div>
            </div>
          )}
          {error && <div className="error-msg">⚠ {error}</div>}
          {loading && <div style={{marginTop:8,fontSize:12,color:"var(--text3)"}}>Loading shared database...</div>}
        </div>

        {/* SDR Filter + Toolbar */}
        <div className="toolbar">
          {sdrs.length > 1 && sdrs.map(s => (
            <button key={s} className={`filter-chip ${filterSdr===s?"active":""}`} onClick={()=>setFilterSdr(s)}>
              {s === "all" ? "All SDRs" : s}
            </button>
          ))}
          {filteredP.length > 0 && <button className="export-btn" onClick={exportCSV}>↓ Export CSV</button>}
          <span className="record-count">{filteredP.length} prospects</span>
        </div>

        {/* Tabs */}
        <div className="tabs">
          {[["hotels","Hotels",filteredP.length],["outreach","Outreach Tracker",filteredT.length]].map(([id,label,cnt])=>(
            <button key={id} className={`tab ${tab===id?"active":""}`} onClick={()=>setTab(id)}>
              {label}<span className="tab-count">{cnt}</span>
            </button>
          ))}
        </div>

        {/* Hotels Table */}
        {tab === "hotels" && (filteredP.length === 0 ? (
          <div className="empty">
            <div className="empty-icon">🏨</div>
            <div className="empty-title">{loading ? "Loading..." : "No prospects yet"}</div>
            <div className="empty-sub">Set your market and click Run Research to start.</div>
          </div>
        ) : (
          <div className="table-wrap">
            <table>
              <thead><tr>
                <th>Hotel</th><th>Segment</th><th>GM</th><th>Email</th>
                <th>Conf.</th><th>Rooms</th><th>F&B</th><th>ADR</th>
                <th>Provider</th><th>Strategy</th><th>SDR</th><th>Added</th>
              </tr></thead>
              <tbody>
                {filteredP.map(p=>(
                  <tr key={p.id} onClick={()=>setSelected(p.id)}>
                    <td><div className="hotel-name">{p.hotel_name}</div><div className="hotel-sub">{p.brand} · {p.city}</div></td>
                    <td><span className={`badge ${p.segment==="Luxury"?"badge-luxury":"badge-upper"}`}>{p.segment}</span></td>
                    <td><div style={{fontWeight:500}}>{p.gm_name||<span className="null-val">—</span>}</div><div className="hotel-sub">{p.gm_title}</div></td>
                    <td>{p.email ? <a className="link" href={`mailto:${p.email}`} onClick={e=>e.stopPropagation()}>{p.email}</a> : <span className="null-val">—</span>}</td>
                    <td><span className={`badge badge-${(p.contact_confidence||"l").toLowerCase()}`}>{p.contact_confidence||"L"}</span></td>
                    <td><span className="null-val">{p.rooms||"—"}</span></td>
                    <td><span className="null-val">{p.restaurants||"—"}</span></td>
                    <td><span className="null-val">{p.adr_usd ? `~$${p.adr_usd}` : "—"}</span></td>
                    <td><span className="null-val">{p.current_provider||"—"}</span></td>
                    <td><span className={`badge ${p.engagement_strategy==="DIRECT-TO-GM"?"badge-dgm":"badge-hold"}`}>{(p.engagement_strategy||"—").replace(/-/g," ")}</span></td>
                    <td><span style={{fontSize:12,color:"var(--accent)",fontWeight:500}}>{p.sdr||"—"}</span></td>
                    <td><span className="null-val">{fmt(p.created_at)}</span></td>
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
              const done = t.done||[];
              return (
                <div key={t.id} className="track-card" onClick={()=>setSelected(t.prospect_id)}>
                  <div className="track-hotel">{t.hotel}</div>
                  <div className="track-gm">{t.gm||"—"}</div>
                  {t.email && <div className="track-email">{t.email}</div>}
                  <div className="touch-row" onClick={e=>e.stopPropagation()}>
                    {[1,2,3,4].map(n=>(
                      <div key={n} className="touch-item">
                        <button className={`touch-btn ${done.includes(n)?"done":"todo"}`} onClick={()=>touch(t.id,n)}>
                          {done.includes(n)?"✓":n}
                        </button>
                        <div className="touch-label">{TOUCH_LABELS[n-1]}</div>
                      </div>
                    ))}
                  </div>
                  {done.length > 0 && <div className="track-date">Last contact: {fmt(t[`d${Math.max(...done)}`])}</div>}
                  {t.sdr && <div className="track-sdr">{t.sdr}</div>}
                </div>
              );
            })}
          </div>
        ))}
      </div>

      {/* Detail Drawer */}
      {sel && (
        <>
          <div className="overlay" onClick={()=>setSelected(null)}/>
          <div className="drawer">
            <button className="drawer-close" onClick={()=>setSelected(null)}>✕</button>
            <div className="drawer-hotel">{sel.hotel_name}</div>
            <div className="drawer-meta">{sel.brand} · {sel.city}, {sel.country} · Added by {sel.sdr} · {fmt(sel.created_at)}</div>

            <div className="section">
              <div className="section-title">Property</div>
              <div className="info-row"><span className="info-key">Address</span><span>{sel.address||"—"}</span></div>
              <div className="info-row"><span className="info-key">Rooms</span><span>{sel.rooms||"—"}</span></div>
              <div className="info-row"><span className="info-key">Restaurants</span><span>{sel.restaurants||"—"}</span></div>
              <div className="info-row"><span className="info-key">Est. ADR</span><span>{sel.adr_usd ? `~$${sel.adr_usd}/night` : "—"}</span></div>
              <div className="info-row"><span className="info-key">Provider</span><span>{sel.current_provider||"Unknown"}</span></div>
              <div className="info-row"><span className="info-key">Website</span><span>{sel.website ? <a className="link" href={sel.website} target="_blank" rel="noreferrer">{sel.website}</a> : "—"}</span></div>
            </div>

            <div className="section">
              <div className="section-title">Decision Maker</div>
              <div className="info-row"><span className="info-key">Name</span><span style={{fontWeight:500}}>{sel.gm_name||"—"}</span></div>
              <div className="info-row"><span className="info-key">Title</span><span>{sel.gm_title||"—"}</span></div>
              <div className="info-row"><span className="info-key">Email</span><span>{sel.email ? <a className="link" href={`mailto:${sel.email}`}>{sel.email}</a> : <span className="null-val">Not found</span>}</span></div>
              <div className="info-row"><span className="info-key">LinkedIn</span><span>{sel.linkedin ? <a className="link" href={sel.linkedin} target="_blank" rel="noreferrer">↗ View Profile</a> : <span className="null-val">Not found</span>}</span></div>
              <div className="info-row"><span className="info-key">Confidence</span><span><span className={`badge badge-${(sel.contact_confidence||"l").toLowerCase()}`}>{sel.contact_confidence}</span></span></div>
            </div>

            {sel.outreach_email_subject && (
              <div className="section">
                <div className="section-title">4-Touch Email Sequence</div>

                <div className="email-day">Touch 1 — Initial Outreach</div>
                <div className="subject-line">Subject: {sel.outreach_email_subject}</div>
                <div className="email-card">{sel.outreach_email_body}</div>
                <button className={`copy-btn ${copied==="e1"?"copied":""}`} onClick={()=>copy(`Subject: ${sel.outreach_email_subject}\n\n${sel.outreach_email_body}`,"e1")}>{copied==="e1"?"✓ Copied":"Copy"}</button>

                <div className="email-day">Touch 2 — Day 4 (reply in same thread)</div>
                <div className="email-card">{`Hi ${sel.gm_name?.split(" ")[0]||"[Name]"},\n\nJust following up on my note from a few days ago — wanted to make sure it didn't get buried.\n\nThe pattern I mentioned is something we're seeing across multiple properties in ${sel.city}. Happy to share a quick overview specific to ${sel.hotel_name}.\n\nWorth 15 minutes this week?\n\nBest,\nZishuo Wang\nWhere to know Insights | zishuo@wheretoknow.com`}</div>
                <button className={`copy-btn ${copied==="e2"?"copied":""}`} onClick={()=>copy(`Hi ${sel.gm_name?.split(" ")[0]||"[Name]"},\n\nJust following up on my note from a few days ago — wanted to make sure it didn't get buried.\n\nThe pattern I mentioned is something we're seeing across multiple properties in ${sel.city}. Happy to share a quick overview specific to ${sel.hotel_name}.\n\nWorth 15 minutes this week?\n\nBest,\nZishuo Wang\nWhere to know Insights | zishuo@wheretoknow.com`,"e2")}>{copied==="e2"?"✓ Copied":"Copy"}</button>

                <div className="email-day">Touch 3 — Day 11 (competition angle)</div>
                <div className="email-card">{`Hi ${sel.gm_name?.split(" ")[0]||"[Name]"},\n\nOne more thought — beyond internal feedback, we've been tracking how ${sel.hotel_name}'s key competitors are positioning on the same guest experience signals.\n\nA few of them have closed visibility gaps that currently show as open in market data for ${sel.city}. Happy to share what we're seeing — no pitch, just a 10-minute look at your competitive standing.\n\nBest,\nZishuo Wang\nWhere to know Insights | zishuo@wheretoknow.com`}</div>
                <button className={`copy-btn ${copied==="e3"?"copied":""}`} onClick={()=>copy(`Hi ${sel.gm_name?.split(" ")[0]||"[Name]"},\n\nOne more thought — beyond internal feedback, we've been tracking how ${sel.hotel_name}'s key competitors are positioning on the same guest experience signals.\n\nA few of them have closed visibility gaps that currently show as open in market data for ${sel.city}. Happy to share what we're seeing — no pitch, just a 10-minute look at your competitive standing.\n\nBest,\nZishuo Wang\nWhere to know Insights | zishuo@wheretoknow.com`,"e3")}>{copied==="e3"?"✓ Copied":"Copy"}</button>

                <div className="email-day">Touch 4 — Final (keep in touch)</div>
                <div className="email-card">{`Hi ${sel.gm_name?.split(" ")[0]||"[Name]"},\n\nI'll keep this brief — I've reached out a few times and don't want to overstay my welcome.\n\nIf the timing isn't right, no worries at all. I'll keep ${sel.hotel_name} on our radar and reach back when relevant market data comes up.\n\nIf you're ever curious about how peers in ${sel.city} are using guest intelligence to drive loyalty and ADR, I'm here.\n\nWarm regards,\nZishuo Wang\nWhere to know Insights | zishuo@wheretoknow.com`}</div>
                <button className={`copy-btn ${copied==="e4"?"copied":""}`} onClick={()=>copy(`Hi ${sel.gm_name?.split(" ")[0]||"[Name]"},\n\nI'll keep this brief — I've reached out a few times and don't want to overstay my welcome.\n\nIf the timing isn't right, no worries at all. I'll keep ${sel.hotel_name} on our radar and reach back when relevant market data comes up.\n\nIf you're ever curious about how peers in ${sel.city} are using guest intelligence to drive loyalty and ADR, I'm here.\n\nWarm regards,\nZishuo Wang\nWhere to know Insights | zishuo@wheretoknow.com`,"e4")}>{copied==="e4"?"✓ Copied":"Copy"}</button>
              </div>
            )}

            {sel.linkedin_dm && (
              <div className="section">
                <div className="section-title">LinkedIn DM</div>
                <div className="email-card">{sel.linkedin_dm}</div>
                <button className={`copy-btn ${copied==="dm"?"copied":""}`} onClick={()=>copy(sel.linkedin_dm,"dm")}>{copied==="dm"?"✓ Copied":"Copy DM"}</button>
              </div>
            )}

            {sel.research_notes && (
              <div className="section">
                <div className="section-title">Research Notes</div>
                <div style={{fontSize:13,color:"var(--text2)",lineHeight:1.6}}>{sel.research_notes}</div>
              </div>
            )}
          </div>
        </>
      )}
    </>
  );
}
