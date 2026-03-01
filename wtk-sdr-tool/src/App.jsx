import { useState, useEffect, useRef } from "react";

// ─── SYSTEM PROMPT for SDR Research Agent ───────────────────────────────────
const SDR_SYSTEM_PROMPT = `You are an expert SDR research agent for Where to know Insights GmbH, a Berlin-based hospitality intelligence platform. Your task is to research luxury and upper-scale hotels and produce structured prospect data.

RESEARCH INSTRUCTIONS:
For each hotel, find and return EXACTLY this JSON structure (no markdown, no preamble, just valid JSON array):

[
  {
    "hotel_name": "Full hotel name",
    "brand": "Brand name (e.g. Marriott, IHG, Hilton, independent)",
    "segment": "Luxury | Upper Scale",
    "city": "City",
    "country": "Country",
    "address": "Street address if known",
    "website": "Official website URL",
    "rooms": "Number of rooms if known, else null",
    "current_provider": "Known review/feedback tool (TrustYou, Medallia, ReviewPro, etc.) or null",
    "gm_name": "General Manager full name or null",
    "gm_title": "Exact title (e.g. General Manager, Managing Director)",
    "email": "Public email address if found, else null",
    "linkedin": "LinkedIn profile URL if found, else null",
    "phone": "Public phone if found, else null",
    "email_source": "Where email was found (hotel website, press release, TripAdvisor response, etc.) or null",
    "contact_confidence": "H (confirmed GM + email) | M (name confirmed, no email) | L (uncertain)",
    "outreach_email_subject": "One compelling subject line for cold outreach",
    "outreach_email_body": "Cold email body 100-130 words. Use pattern-visibility framing. Reference a guest experience signal. Never accusatory. Sign off as Where to know Insights team.",
    "linkedin_dm": "LinkedIn DM under 280 characters",
    "engagement_strategy": "DIRECT-TO-GM | THROUGH-REGIONAL-SPONSOR | STRATEGIC-HOLD | HOLD",
    "strategy_reason": "1-2 sentence justification",
    "research_notes": "Any useful context (competitor intel, recent news, ownership structure)"
  }
]

TONE RULES (mandatory):
- Use "pattern visibility" not "you failed" framing
- Approved phrases: "recurring friction point", "handover consistency gap", "peak-hour capacity signal", "recognition protocol drift", "service visibility gap"
- Avoid: "guests complained", "negative reviews", "your team failed"
- Position WTK as complementary to existing tools, not a replacement
- Frame as: "market radar vs internal mirror"

OUTREACH EMAIL FORMAT:
- Opening: reference a specific operational pattern signal you observed from public reviews
- Middle: connect to what WTK does differently (multi-layer analysis, automated competitive tracking)
- Close: low-friction CTA (15-min call or send sample report)
- Sign: Where to know Insights | zishuo@wheretoknow.com

Return ONLY the JSON array. No explanation text before or after.`;

// ─── COLORS & STYLES ─────────────────────────────────────────────────────────
const COLORS = {
  bg: "#0a0c0f",
  surface: "#111318",
  surfaceHover: "#161a22",
  border: "#1e2530",
  borderActive: "#2d4a6e",
  accent: "#1e6fd9",
  accentGlow: "#1e6fd930",
  accentBright: "#4d9fff",
  gold: "#c9a84c",
  goldDim: "#c9a84c40",
  textPrimary: "#e8edf5",
  textSecondary: "#8892a4",
  textMuted: "#4a5568",
  success: "#22c55e",
  successDim: "#22c55e20",
  warning: "#f59e0b",
  warningDim: "#f59e0b20",
  error: "#ef4444",
  errorDim: "#ef444420",
  tag1: "#1e3a5f",
  tag2: "#1a3a2a",
};

const css = `
  @import url('https://fonts.googleapis.com/css2?family=DM+Mono:wght@300;400;500&family=Syne:wght@400;500;600;700;800&display=swap');

  * { box-sizing: border-box; margin: 0; padding: 0; }

  body {
    background: ${COLORS.bg};
    color: ${COLORS.textPrimary};
    font-family: 'DM Mono', monospace;
    min-height: 100vh;
  }

  .app {
    max-width: 1400px;
    margin: 0 auto;
    padding: 32px 24px;
  }

  /* Header */
  .header {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    margin-bottom: 40px;
    padding-bottom: 24px;
    border-bottom: 1px solid ${COLORS.border};
  }
  .header-left {}
  .logo-line {
    display: flex;
    align-items: center;
    gap: 10px;
    margin-bottom: 4px;
  }
  .logo-dot {
    width: 8px; height: 8px;
    background: ${COLORS.accent};
    border-radius: 50%;
    box-shadow: 0 0 12px ${COLORS.accent};
    animation: pulse 2s infinite;
  }
  @keyframes pulse {
    0%, 100% { opacity: 1; }
    50% { opacity: 0.4; }
  }
  .logo-text {
    font-family: 'Syne', sans-serif;
    font-size: 13px;
    font-weight: 600;
    letter-spacing: 0.15em;
    color: ${COLORS.textSecondary};
    text-transform: uppercase;
  }
  .title {
    font-family: 'Syne', sans-serif;
    font-size: 28px;
    font-weight: 800;
    color: ${COLORS.textPrimary};
    letter-spacing: -0.02em;
    line-height: 1.1;
  }
  .title span { color: ${COLORS.accentBright}; }
  .subtitle {
    font-size: 12px;
    color: ${COLORS.textMuted};
    margin-top: 6px;
    letter-spacing: 0.05em;
  }
  .header-stats {
    display: flex;
    gap: 24px;
  }
  .stat-box {
    text-align: right;
  }
  .stat-num {
    font-family: 'Syne', sans-serif;
    font-size: 22px;
    font-weight: 700;
    color: ${COLORS.accentBright};
  }
  .stat-label {
    font-size: 10px;
    color: ${COLORS.textMuted};
    letter-spacing: 0.1em;
    text-transform: uppercase;
  }

  /* Command Panel */
  .command-panel {
    background: ${COLORS.surface};
    border: 1px solid ${COLORS.border};
    border-radius: 12px;
    padding: 24px;
    margin-bottom: 24px;
  }
  .command-title {
    font-family: 'Syne', sans-serif;
    font-size: 11px;
    font-weight: 600;
    letter-spacing: 0.15em;
    color: ${COLORS.textMuted};
    text-transform: uppercase;
    margin-bottom: 16px;
  }
  .command-row {
    display: flex;
    gap: 12px;
    align-items: flex-end;
    flex-wrap: wrap;
  }
  .field-group {
    display: flex;
    flex-direction: column;
    gap: 6px;
    flex: 1;
    min-width: 140px;
  }
  .field-label {
    font-size: 10px;
    color: ${COLORS.textMuted};
    letter-spacing: 0.1em;
    text-transform: uppercase;
  }
  .field-input, .field-select {
    background: ${COLORS.bg};
    border: 1px solid ${COLORS.border};
    border-radius: 8px;
    padding: 10px 14px;
    color: ${COLORS.textPrimary};
    font-family: 'DM Mono', monospace;
    font-size: 13px;
    outline: none;
    transition: border-color 0.2s;
    width: 100%;
  }
  .field-input:focus, .field-select:focus {
    border-color: ${COLORS.accent};
  }
  .field-select option { background: ${COLORS.surface}; }

  .run-btn {
    background: ${COLORS.accent};
    border: none;
    border-radius: 8px;
    padding: 10px 24px;
    color: white;
    font-family: 'Syne', sans-serif;
    font-size: 13px;
    font-weight: 600;
    letter-spacing: 0.05em;
    cursor: pointer;
    transition: all 0.2s;
    white-space: nowrap;
    display: flex;
    align-items: center;
    gap: 8px;
    height: 40px;
  }
  .run-btn:hover:not(:disabled) {
    background: ${COLORS.accentBright};
    transform: translateY(-1px);
    box-shadow: 0 4px 20px ${COLORS.accentGlow};
  }
  .run-btn:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
  .run-btn.running {
    background: ${COLORS.border};
    color: ${COLORS.textMuted};
  }

  .spinner {
    width: 14px; height: 14px;
    border: 2px solid ${COLORS.textMuted};
    border-top-color: ${COLORS.accentBright};
    border-radius: 50%;
    animation: spin 0.8s linear infinite;
  }
  @keyframes spin { to { transform: rotate(360deg); } }

  /* Progress */
  .progress-bar-wrap {
    margin-top: 14px;
    background: ${COLORS.bg};
    border-radius: 4px;
    height: 3px;
    overflow: hidden;
  }
  .progress-bar-fill {
    height: 100%;
    background: linear-gradient(90deg, ${COLORS.accent}, ${COLORS.accentBright});
    border-radius: 4px;
    transition: width 0.5s ease;
  }
  .progress-log {
    margin-top: 8px;
    font-size: 11px;
    color: ${COLORS.textMuted};
    font-family: 'DM Mono', monospace;
    min-height: 16px;
  }
  .progress-log span { color: ${COLORS.accentBright}; }

  /* Tabs */
  .tabs {
    display: flex;
    gap: 4px;
    margin-bottom: 20px;
    border-bottom: 1px solid ${COLORS.border};
  }
  .tab {
    padding: 10px 20px;
    font-family: 'Syne', sans-serif;
    font-size: 12px;
    font-weight: 600;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    color: ${COLORS.textMuted};
    cursor: pointer;
    border-bottom: 2px solid transparent;
    transition: all 0.2s;
    margin-bottom: -1px;
    background: none;
    border-top: none;
    border-left: none;
    border-right: none;
  }
  .tab:hover { color: ${COLORS.textSecondary}; }
  .tab.active {
    color: ${COLORS.accentBright};
    border-bottom-color: ${COLORS.accentBright};
  }
  .tab-badge {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 18px; height: 18px;
    background: ${COLORS.border};
    border-radius: 4px;
    font-size: 10px;
    margin-left: 6px;
    color: ${COLORS.textSecondary};
  }
  .tab.active .tab-badge {
    background: ${COLORS.accentGlow};
    color: ${COLORS.accentBright};
  }

  /* Table */
  .table-wrap {
    overflow-x: auto;
    border: 1px solid ${COLORS.border};
    border-radius: 12px;
  }
  table {
    width: 100%;
    border-collapse: collapse;
    font-size: 12px;
  }
  thead th {
    background: ${COLORS.surface};
    padding: 12px 16px;
    text-align: left;
    font-family: 'Syne', sans-serif;
    font-size: 10px;
    font-weight: 600;
    letter-spacing: 0.12em;
    text-transform: uppercase;
    color: ${COLORS.textMuted};
    border-bottom: 1px solid ${COLORS.border};
    white-space: nowrap;
  }
  tbody tr {
    border-bottom: 1px solid ${COLORS.border};
    transition: background 0.15s;
    cursor: pointer;
  }
  tbody tr:hover { background: ${COLORS.surfaceHover}; }
  tbody tr:last-child { border-bottom: none; }
  td {
    padding: 12px 16px;
    vertical-align: top;
    color: ${COLORS.textPrimary};
    max-width: 220px;
  }
  .cell-muted { color: ${COLORS.textMuted}; font-size: 11px; }
  .cell-name {
    font-family: 'Syne', sans-serif;
    font-size: 13px;
    font-weight: 600;
    color: ${COLORS.textPrimary};
  }
  .cell-sub { font-size: 11px; color: ${COLORS.textSecondary}; margin-top: 2px; }

  /* Badges */
  .badge {
    display: inline-block;
    padding: 2px 8px;
    border-radius: 4px;
    font-size: 10px;
    font-weight: 600;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    white-space: nowrap;
  }
  .badge-luxury { background: ${COLORS.goldDim}; color: ${COLORS.gold}; }
  .badge-upper { background: ${COLORS.tag1}; color: ${COLORS.accentBright}; }
  .badge-h { background: ${COLORS.successDim}; color: ${COLORS.success}; }
  .badge-m { background: ${COLORS.warningDim}; color: ${COLORS.warning}; }
  .badge-l { background: ${COLORS.errorDim}; color: ${COLORS.error}; }
  .badge-dgm { background: ${COLORS.tag1}; color: ${COLORS.accentBright}; }
  .badge-hold { background: ${COLORS.border}; color: ${COLORS.textMuted}; }

  .email-link {
    color: ${COLORS.accentBright};
    text-decoration: none;
    font-size: 11px;
  }
  .email-link:hover { text-decoration: underline; }
  .linkedin-link {
    color: ${COLORS.textSecondary};
    font-size: 11px;
    text-decoration: none;
  }
  .linkedin-link:hover { color: ${COLORS.accentBright}; }

  /* Detail Panel */
  .detail-overlay {
    position: fixed;
    top: 0; right: 0; bottom: 0;
    width: 520px;
    background: ${COLORS.surface};
    border-left: 1px solid ${COLORS.border};
    z-index: 100;
    overflow-y: auto;
    padding: 32px;
    animation: slideIn 0.2s ease;
  }
  @keyframes slideIn {
    from { transform: translateX(100%); }
    to { transform: translateX(0); }
  }
  .detail-close {
    position: absolute;
    top: 20px; right: 20px;
    background: ${COLORS.border};
    border: none;
    border-radius: 6px;
    width: 32px; height: 32px;
    color: ${COLORS.textSecondary};
    cursor: pointer;
    font-size: 16px;
    display: flex; align-items: center; justify-content: center;
  }
  .detail-close:hover { background: ${COLORS.borderActive}; color: white; }
  .detail-hotel-name {
    font-family: 'Syne', sans-serif;
    font-size: 20px;
    font-weight: 700;
    margin-bottom: 4px;
    padding-right: 40px;
  }
  .detail-meta { font-size: 12px; color: ${COLORS.textSecondary}; margin-bottom: 20px; }
  .detail-section {
    margin-bottom: 20px;
    padding-bottom: 20px;
    border-bottom: 1px solid ${COLORS.border};
  }
  .detail-section:last-child { border-bottom: none; }
  .detail-section-title {
    font-family: 'Syne', sans-serif;
    font-size: 10px;
    font-weight: 600;
    letter-spacing: 0.15em;
    text-transform: uppercase;
    color: ${COLORS.textMuted};
    margin-bottom: 10px;
  }
  .detail-row { display: flex; gap: 8px; margin-bottom: 6px; font-size: 12px; }
  .detail-key { color: ${COLORS.textMuted}; min-width: 80px; flex-shrink: 0; }
  .detail-val { color: ${COLORS.textPrimary}; }
  .email-box {
    background: ${COLORS.bg};
    border: 1px solid ${COLORS.border};
    border-radius: 8px;
    padding: 14px;
    font-size: 12px;
    line-height: 1.6;
    color: ${COLORS.textSecondary};
    white-space: pre-wrap;
  }
  .subject-line {
    font-family: 'Syne', sans-serif;
    font-size: 13px;
    font-weight: 600;
    color: ${COLORS.textPrimary};
    margin-bottom: 10px;
  }
  .copy-btn {
    background: ${COLORS.border};
    border: none;
    border-radius: 6px;
    padding: 6px 12px;
    color: ${COLORS.textSecondary};
    font-family: 'DM Mono', monospace;
    font-size: 10px;
    letter-spacing: 0.08em;
    cursor: pointer;
    margin-top: 8px;
    transition: all 0.15s;
  }
  .copy-btn:hover { background: ${COLORS.borderActive}; color: white; }
  .copy-btn.copied { background: ${COLORS.successDim}; color: ${COLORS.success}; }

  /* Export bar */
  .export-bar {
    display: flex;
    gap: 10px;
    align-items: center;
    margin-bottom: 16px;
    flex-wrap: wrap;
  }
  .export-btn {
    background: ${COLORS.surface};
    border: 1px solid ${COLORS.border};
    border-radius: 8px;
    padding: 8px 16px;
    color: ${COLORS.textSecondary};
    font-family: 'Syne', sans-serif;
    font-size: 11px;
    font-weight: 600;
    letter-spacing: 0.08em;
    cursor: pointer;
    transition: all 0.2s;
    display: flex; align-items: center; gap: 6px;
  }
  .export-btn:hover { border-color: ${COLORS.accent}; color: ${COLORS.accentBright}; }
  .filter-count {
    font-size: 11px;
    color: ${COLORS.textMuted};
    margin-left: auto;
  }

  /* Empty state */
  .empty-state {
    text-align: center;
    padding: 80px 40px;
    color: ${COLORS.textMuted};
  }
  .empty-icon { font-size: 40px; margin-bottom: 16px; opacity: 0.4; }
  .empty-title {
    font-family: 'Syne', sans-serif;
    font-size: 16px;
    font-weight: 600;
    color: ${COLORS.textSecondary};
    margin-bottom: 8px;
  }
  .empty-sub { font-size: 12px; line-height: 1.6; }

  /* Error */
  .error-box {
    background: ${COLORS.errorDim};
    border: 1px solid ${COLORS.error}40;
    border-radius: 8px;
    padding: 12px 16px;
    font-size: 12px;
    color: ${COLORS.error};
    margin-top: 12px;
  }

  /* Tracking tab */
  .tracking-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
    gap: 12px;
  }
  .tracking-card {
    background: ${COLORS.surface};
    border: 1px solid ${COLORS.border};
    border-radius: 10px;
    padding: 16px;
    cursor: pointer;
    transition: all 0.2s;
  }
  .tracking-card:hover { border-color: ${COLORS.borderActive}; }
  .tracking-card-name {
    font-family: 'Syne', sans-serif;
    font-size: 13px;
    font-weight: 600;
    margin-bottom: 8px;
  }
  .contact-dots {
    display: flex;
    gap: 6px;
    margin-top: 10px;
  }
  .contact-dot {
    width: 28px; height: 28px;
    border-radius: 6px;
    display: flex; align-items: center; justify-content: center;
    font-size: 10px;
    font-weight: 600;
    cursor: pointer;
    border: none;
    transition: all 0.15s;
    font-family: 'Syne', sans-serif;
  }
  .contact-dot.done { background: ${COLORS.successDim}; color: ${COLORS.success}; }
  .contact-dot.todo { background: ${COLORS.border}; color: ${COLORS.textMuted}; }
  .contact-dot.todo:hover { background: ${COLORS.accentGlow}; color: ${COLORS.accentBright}; }
  .contact-dot-label { font-size: 9px; color: ${COLORS.textMuted}; margin-top: 4px; text-align: center; letter-spacing: 0.05em; }
`;

// ─── HELPERS ─────────────────────────────────────────────────────────────────
function generateId() {
  return Math.random().toString(36).slice(2, 9);
}

function formatDate(d) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "2-digit" });
}

async function callClaudeAPI(city, segment, count) {
  const response = await fetch("/api/research", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ city, segment, count }),
  });

  if (!response.ok) {
    const err = await response.json();
    throw new Error(err.error || "API error");
  }

  const data = await response.json();
  if (data.error) throw new Error(data.error);
  return data.result;
}

function parseProspects(raw) {
  try {
    // Strip markdown fences
    const clean = raw.replace(/```json|```/g, "").trim();
    // Find JSON array
    const start = clean.indexOf("[");
    const end = clean.lastIndexOf("]");
    if (start === -1 || end === -1) return [];
    const parsed = JSON.parse(clean.slice(start, end + 1));
    return Array.isArray(parsed) ? parsed : [];
  } catch (e) {
    console.error("Parse error:", e, raw.slice(0, 200));
    return [];
  }
}

// ─── MAIN APP ─────────────────────────────────────────────────────────────────
export default function WTKSDRTool() {
  const [tab, setTab] = useState("prospects");
  const [city, setCity] = useState("Bangkok");
  const [segment, setSegment] = useState("Luxury and Upper Scale");
  const [count, setCount] = useState("20");
  const [running, setRunning] = useState(false);
  const [progress, setProgress] = useState(0);
  const [progressLog, setProgressLog] = useState("");
  const [error, setError] = useState(null);
  const [selected, setSelected] = useState(null);
  const [copiedField, setCopiedField] = useState(null);

  // Persistent storage
  const [prospects, setProspects] = useState([]);
  const [contacts, setContacts] = useState([]);
  const [tracking, setTracking] = useState([]);

  // Load from storage on mount
  useEffect(() => {
    async function load() {
      try {
        const p = await window.storage.get("wtk_prospects");
        const c = await window.storage.get("wtk_contacts");
        const t = await window.storage.get("wtk_tracking");
        if (p) setProspects(JSON.parse(p.value));
        if (c) setContacts(JSON.parse(c.value));
        if (t) setTracking(JSON.parse(t.value));
      } catch (e) {
        // Fresh start
      }
    }
    load();
  }, []);

  async function saveAll(p, c, t) {
    try {
      await window.storage.set("wtk_prospects", JSON.stringify(p));
      await window.storage.set("wtk_contacts", JSON.stringify(c));
      await window.storage.set("wtk_tracking", JSON.stringify(t));
    } catch (e) {
      console.error("Storage save error:", e);
    }
  }

  async function runResearch() {
    setRunning(true);
    setError(null);
    setProgress(5);
    setProgressLog("Initialising research agent...");

    try {
      const batchSize = Math.min(parseInt(count) || 10, 20);

      setProgress(15);
      setProgressLog(`Searching for ${batchSize} ${segment} hotels in ${city}...`);

      const prompt = `Research ${batchSize} ${segment} hotels currently operating in ${city}. For each hotel:
1. Use web search to find the hotel's official website, GM name, and public email
2. Check LinkedIn for the GM profile
3. Look at Google/TripAdvisor reviews to identify a guest experience pattern signal
4. Write a personalised cold outreach email using the pattern signal

Focus on properties that:
- Are currently open and operating
- Have at least 80 rooms
- Are positioned as ${segment}
- Have NOT recently signed with Where to know Insights (avoid: Kimpton Maa-Lai, Anantara Bangkok)

Return exactly ${batchSize} hotels as a JSON array following the schema provided. No markdown, just JSON.`;

      setProgress(40);
      setProgressLog(`Agent running web searches for ${city} hotels...`);

      const raw = await callClaudeAPI(city, segment, batchSize);

      setProgress(70);
      setProgressLog("Parsing and structuring results...");

      const newProspects = parseProspects(raw);

      if (newProspects.length === 0) {
        throw new Error("Could not parse hotel data from API response. Raw preview: " + raw.slice(0, 300));
      }

      setProgress(85);
      setProgressLog(`Found ${newProspects.length} prospects. Building contact records...`);

      // Enrich with IDs and timestamps
      const enriched = newProspects.map(p => ({
        ...p,
        id: generateId(),
        created_at: new Date().toISOString(),
        batch: `${city} · ${new Date().toLocaleDateString("en-GB")}`,
      }));

      // Build contacts
      const newContacts = enriched
        .filter(p => p.gm_name)
        .map(p => ({
          id: generateId(),
          prospect_id: p.id,
          hotel: p.hotel_name,
          city: p.city,
          name: p.gm_name,
          title: p.gm_title || "General Manager",
          email: p.email,
          linkedin: p.linkedin,
          phone: p.phone,
          confidence: p.contact_confidence,
          created_at: new Date().toISOString(),
        }));

      // Build tracking entries
      const newTracking = enriched.map(p => ({
        id: generateId(),
        prospect_id: p.id,
        hotel: p.hotel_name,
        contact: p.gm_name,
        contacts_done: [],
        created_at: new Date().toISOString(),
      }));

      const updatedProspects = [...prospects, ...enriched];
      const updatedContacts = [...contacts, ...newContacts];
      const updatedTracking = [...tracking, ...newTracking];

      setProspects(updatedProspects);
      setContacts(updatedContacts);
      setTracking(updatedTracking);

      await saveAll(updatedProspects, updatedContacts, updatedTracking);

      setProgress(100);
      setProgressLog(`✓ ${newProspects.length} prospects added · ${newContacts.filter(c => c.email).length} emails found`);
      setTab("prospects");

    } catch (err) {
      setError(err.message);
      setProgressLog("");
    } finally {
      setRunning(false);
      setTimeout(() => setProgress(0), 3000);
    }
  }

  function markContact(trackingId, round) {
    const updated = tracking.map(t => {
      if (t.id !== trackingId) return t;
      const done = [...(t.contacts_done || [])];
      const idx = done.indexOf(round);
      if (idx === -1) {
        done.push(round);
        done.sort((a, b) => a - b);
      } else {
        done.splice(idx, 1);
      }
      return { ...t, contacts_done: done, [`contact_${round}_date`]: new Date().toISOString() };
    });
    setTracking(updated);
    saveAll(prospects, contacts, updated);
  }

  function copyToClipboard(text, field) {
    navigator.clipboard.writeText(text).then(() => {
      setCopiedField(field);
      setTimeout(() => setCopiedField(null), 1500);
    });
  }

  function clearAll() {
    if (!confirm("Clear all prospect data? This cannot be undone.")) return;
    setProspects([]); setContacts([]); setTracking([]);
    saveAll([], [], []);
    setSelected(null);
  }

  function exportCSV() {
    const headers = ["Hotel", "Brand", "Segment", "City", "GM Name", "Title", "Email", "LinkedIn", "Confidence", "Strategy", "Current Provider", "Batch"];
    const rows = prospects.map(p => [
      p.hotel_name, p.brand, p.segment, p.city, p.gm_name || "",
      p.gm_title || "", p.email || "", p.linkedin || "",
      p.contact_confidence || "", p.engagement_strategy || "",
      p.current_provider || "", p.batch || ""
    ]);
    const csv = [headers, ...rows].map(r => r.map(v => `"${String(v).replace(/"/g, '""')}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url;
    a.download = `WTK_Prospects_${city}_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
  }

  const selectedProspect = selected ? prospects.find(p => p.id === selected) : null;

  const contactsDone = tracking.filter(t => (t.contacts_done || []).length > 0).length;

  return (
    <>
      <style>{css}</style>
      <div className="app">

        {/* Header */}
        <div className="header">
          <div className="header-left">
            <div className="logo-line">
              <div className="logo-dot" />
              <span className="logo-text">Where to know Insights</span>
            </div>
            <h1 className="title">SDR <span>Intelligence</span></h1>
            <p className="subtitle">AI-POWERED HOTEL PROSPECTING · PRODUCTION v1.0</p>
          </div>
          <div className="header-stats">
            <div className="stat-box">
              <div className="stat-num">{prospects.length}</div>
              <div className="stat-label">Prospects</div>
            </div>
            <div className="stat-box">
              <div className="stat-num">{contacts.filter(c => c.email).length}</div>
              <div className="stat-label">Emails</div>
            </div>
            <div className="stat-box">
              <div className="stat-num">{contactsDone}</div>
              <div className="stat-label">Contacted</div>
            </div>
          </div>
        </div>

        {/* Command Panel */}
        <div className="command-panel">
          <div className="command-title">// Research Command</div>
          <div className="command-row">
            <div className="field-group" style={{ maxWidth: 160 }}>
              <label className="field-label">City / Market</label>
              <input className="field-input" value={city} onChange={e => setCity(e.target.value)} placeholder="Bangkok" />
            </div>
            <div className="field-group" style={{ maxWidth: 220 }}>
              <label className="field-label">Segment</label>
              <select className="field-select" value={segment} onChange={e => setSegment(e.target.value)}>
                <option>Luxury and Upper Scale</option>
                <option>Luxury only</option>
                <option>Upper Scale only</option>
                <option>All segments</option>
              </select>
            </div>
            <div className="field-group" style={{ maxWidth: 100 }}>
              <label className="field-label">Count</label>
              <select className="field-select" value={count} onChange={e => setCount(e.target.value)}>
                <option>5</option>
                <option>10</option>
                <option>15</option>
                <option>20</option>
              </select>
            </div>
            <button
              className={`run-btn ${running ? "running" : ""}`}
              onClick={runResearch}
              disabled={running || !city}
            >
              {running ? <><div className="spinner" /> Researching...</> : "▶ Run Research"}
            </button>
            {prospects.length > 0 && (
              <button className="export-btn" onClick={clearAll} style={{ marginLeft: "auto" }}>
                ✕ Clear All
              </button>
            )}
          </div>

          {running && (
            <div>
              <div className="progress-bar-wrap">
                <div className="progress-bar-fill" style={{ width: `${progress}%` }} />
              </div>
              <div className="progress-log">
                {progressLog && <><span>›</span> {progressLog}</>}
              </div>
            </div>
          )}
          {!running && progressLog && (
            <div className="progress-log"><span>✓</span> {progressLog}</div>
          )}
          {error && <div className="error-box">⚠ {error}</div>}
        </div>

        {/* Tabs */}
        <div className="tabs">
          <button className={`tab ${tab === "prospects" ? "active" : ""}`} onClick={() => setTab("prospects")}>
            Hotels <span className="tab-badge">{prospects.length}</span>
          </button>
          <button className={`tab ${tab === "contacts" ? "active" : ""}`} onClick={() => setTab("contacts")}>
            Contacts <span className="tab-badge">{contacts.length}</span>
          </button>
          <button className={`tab ${tab === "tracking" ? "active" : ""}`} onClick={() => setTab("tracking")}>
            Outreach <span className="tab-badge">{tracking.length}</span>
          </button>
        </div>

        {/* Export bar */}
        {prospects.length > 0 && (
          <div className="export-bar">
            <button className="export-btn" onClick={exportCSV}>↓ Export CSV</button>
            <span className="filter-count">{prospects.length} records</span>
          </div>
        )}

        {/* ─── PROSPECTS TAB ─── */}
        {tab === "prospects" && (
          <>
            {prospects.length === 0 ? (
              <div className="empty-state">
                <div className="empty-icon">🏨</div>
                <div className="empty-title">No prospects yet</div>
                <div className="empty-sub">Set your market parameters above and click Run Research.<br />The AI agent will find hotels, GMs, emails, and draft outreach.</div>
              </div>
            ) : (
              <div className="table-wrap">
                <table>
                  <thead>
                    <tr>
                      <th>Hotel</th>
                      <th>Segment</th>
                      <th>GM / Contact</th>
                      <th>Email</th>
                      <th>Confidence</th>
                      <th>Strategy</th>
                      <th>Provider</th>
                      <th>Batch</th>
                    </tr>
                  </thead>
                  <tbody>
                    {prospects.map(p => (
                      <tr key={p.id} onClick={() => setSelected(p.id)}>
                        <td>
                          <div className="cell-name">{p.hotel_name}</div>
                          <div className="cell-sub">{p.brand} · {p.city}</div>
                        </td>
                        <td>
                          <span className={`badge ${p.segment === "Luxury" ? "badge-luxury" : "badge-upper"}`}>
                            {p.segment}
                          </span>
                        </td>
                        <td>
                          <div>{p.gm_name || <span className="cell-muted">—</span>}</div>
                          <div className="cell-sub">{p.gm_title}</div>
                        </td>
                        <td>
                          {p.email
                            ? <a className="email-link" href={`mailto:${p.email}`} onClick={e => e.stopPropagation()}>{p.email}</a>
                            : <span className="cell-muted">not found</span>}
                        </td>
                        <td>
                          <span className={`badge badge-${(p.contact_confidence || "l").toLowerCase()}`}>
                            {p.contact_confidence || "L"}
                          </span>
                        </td>
                        <td>
                          <span className={`badge ${p.engagement_strategy === "DIRECT-TO-GM" ? "badge-dgm" : "badge-hold"}`}>
                            {(p.engagement_strategy || "—").replace(/-/g, " ")}
                          </span>
                        </td>
                        <td><span className="cell-muted">{p.current_provider || "unknown"}</span></td>
                        <td><span className="cell-muted" style={{ fontSize: 10 }}>{p.batch}</span></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </>
        )}

        {/* ─── CONTACTS TAB ─── */}
        {tab === "contacts" && (
          <>
            {contacts.length === 0 ? (
              <div className="empty-state">
                <div className="empty-icon">👤</div>
                <div className="empty-title">No contacts yet</div>
                <div className="empty-sub">Run a research batch to populate contact records.</div>
              </div>
            ) : (
              <div className="table-wrap">
                <table>
                  <thead>
                    <tr>
                      <th>Hotel</th>
                      <th>Name</th>
                      <th>Title</th>
                      <th>Email</th>
                      <th>Phone</th>
                      <th>LinkedIn</th>
                      <th>Confidence</th>
                    </tr>
                  </thead>
                  <tbody>
                    {contacts.map(c => (
                      <tr key={c.id} onClick={() => setSelected(c.prospect_id)}>
                        <td>
                          <div className="cell-name">{c.hotel}</div>
                          <div className="cell-sub">{c.city}</div>
                        </td>
                        <td>{c.name}</td>
                        <td><span className="cell-muted">{c.title}</span></td>
                        <td>
                          {c.email
                            ? <a className="email-link" href={`mailto:${c.email}`} onClick={e => e.stopPropagation()}>{c.email}</a>
                            : <span className="cell-muted">—</span>}
                        </td>
                        <td><span className="cell-muted">{c.phone || "—"}</span></td>
                        <td>
                          {c.linkedin
                            ? <a className="linkedin-link" href={c.linkedin} target="_blank" rel="noreferrer" onClick={e => e.stopPropagation()}>↗ LinkedIn</a>
                            : <span className="cell-muted">—</span>}
                        </td>
                        <td>
                          <span className={`badge badge-${(c.confidence || "l").toLowerCase()}`}>
                            {c.confidence || "L"}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </>
        )}

        {/* ─── TRACKING TAB ─── */}
        {tab === "tracking" && (
          <>
            {tracking.length === 0 ? (
              <div className="empty-state">
                <div className="empty-icon">📡</div>
                <div className="empty-title">No outreach tracked yet</div>
                <div className="empty-sub">Run a research batch, then mark contacts as you send outreach.</div>
              </div>
            ) : (
              <div className="tracking-grid">
                {tracking.map(t => {
                  const p = prospects.find(x => x.id === t.prospect_id);
                  const done = t.contacts_done || [];
                  return (
                    <div key={t.id} className="tracking-card" onClick={() => setSelected(t.prospect_id)}>
                      <div className="tracking-card-name">{t.hotel}</div>
                      <div className="cell-muted">{t.contact || "—"}</div>
                      {p?.email && <div style={{ fontSize: 11, color: COLORS.accentBright, marginTop: 4 }}>{p.email}</div>}
                      <div className="contact-dots" onClick={e => e.stopPropagation()}>
                        {[1, 2, 3].map(round => (
                          <div key={round} style={{ textAlign: "center" }}>
                            <button
                              className={`contact-dot ${done.includes(round) ? "done" : "todo"}`}
                              onClick={() => markContact(t.id, round)}
                              title={done.includes(round) ? `Contact ${round} sent` : `Mark contact ${round}`}
                            >
                              {done.includes(round) ? "✓" : round}
                            </button>
                            <div className="contact-dot-label">{["1st", "2nd", "3rd"][round - 1]}</div>
                          </div>
                        ))}
                      </div>
                      {done.length > 0 && (
                        <div style={{ fontSize: 10, color: COLORS.textMuted, marginTop: 8 }}>
                          Last: {formatDate(t[`contact_${Math.max(...done)}_date`])}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </>
        )}

      </div>

      {/* ─── DETAIL PANEL ─── */}
      {selectedProspect && (
        <div className="detail-overlay">
          <button className="detail-close" onClick={() => setSelected(null)}>✕</button>

          <div className="detail-hotel-name">{selectedProspect.hotel_name}</div>
          <div className="detail-meta">{selectedProspect.brand} · {selectedProspect.city} · {selectedProspect.segment}</div>

          <div className="detail-section">
            <div className="detail-section-title">// Property Info</div>
            <div className="detail-row"><span className="detail-key">Address</span><span className="detail-val">{selectedProspect.address || "—"}</span></div>
            <div className="detail-row"><span className="detail-key">Rooms</span><span className="detail-val">{selectedProspect.rooms || "—"}</span></div>
            <div className="detail-row"><span className="detail-key">Provider</span><span className="detail-val">{selectedProspect.current_provider || "Unknown"}</span></div>
            <div className="detail-row">
              <span className="detail-key">Website</span>
              <span className="detail-val">
                {selectedProspect.website
                  ? <a className="email-link" href={selectedProspect.website} target="_blank" rel="noreferrer">{selectedProspect.website}</a>
                  : "—"}
              </span>
            </div>
          </div>

          <div className="detail-section">
            <div className="detail-section-title">// Decision Maker</div>
            <div className="detail-row"><span className="detail-key">Name</span><span className="detail-val">{selectedProspect.gm_name || "—"}</span></div>
            <div className="detail-row"><span className="detail-key">Title</span><span className="detail-val">{selectedProspect.gm_title || "—"}</span></div>
            <div className="detail-row">
              <span className="detail-key">Email</span>
              <span className="detail-val">
                {selectedProspect.email
                  ? <><a className="email-link" href={`mailto:${selectedProspect.email}`}>{selectedProspect.email}</a>
                    <span style={{ fontSize: 10, color: COLORS.textMuted, marginLeft: 8 }}>via {selectedProspect.email_source}</span></>
                  : "Not found"}
              </span>
            </div>
            <div className="detail-row">
              <span className="detail-key">LinkedIn</span>
              <span className="detail-val">
                {selectedProspect.linkedin
                  ? <a className="linkedin-link" href={selectedProspect.linkedin} target="_blank" rel="noreferrer">↗ View Profile</a>
                  : "—"}
              </span>
            </div>
            <div className="detail-row">
              <span className="detail-key">Confidence</span>
              <span className="detail-val">
                <span className={`badge badge-${(selectedProspect.contact_confidence || "l").toLowerCase()}`}>
                  {selectedProspect.contact_confidence}
                </span>
              </span>
            </div>
          </div>

          <div className="detail-section">
            <div className="detail-section-title">// Engagement</div>
            <div className="detail-row">
              <span className="detail-key">Strategy</span>
              <span className="detail-val">
                <span className={`badge ${selectedProspect.engagement_strategy === "DIRECT-TO-GM" ? "badge-dgm" : "badge-hold"}`}>
                  {(selectedProspect.engagement_strategy || "—").replace(/-/g, " ")}
                </span>
              </span>
            </div>
            <div style={{ fontSize: 12, color: COLORS.textSecondary, marginTop: 8, lineHeight: 1.6 }}>
              {selectedProspect.strategy_reason}
            </div>
          </div>

          {selectedProspect.outreach_email_subject && (
            <div className="detail-section">
              <div className="detail-section-title">// Outreach Email</div>
              <div className="subject-line">Subject: {selectedProspect.outreach_email_subject}</div>
              <div className="email-box">{selectedProspect.outreach_email_body}</div>
              <button
                className={`copy-btn ${copiedField === "email" ? "copied" : ""}`}
                onClick={() => copyToClipboard(`Subject: ${selectedProspect.outreach_email_subject}\n\n${selectedProspect.outreach_email_body}`, "email")}
              >
                {copiedField === "email" ? "✓ COPIED" : "COPY EMAIL"}
              </button>
            </div>
          )}

          {selectedProspect.linkedin_dm && (
            <div className="detail-section">
              <div className="detail-section-title">// LinkedIn DM</div>
              <div className="email-box">{selectedProspect.linkedin_dm}</div>
              <button
                className={`copy-btn ${copiedField === "dm" ? "copied" : ""}`}
                onClick={() => copyToClipboard(selectedProspect.linkedin_dm, "dm")}
              >
                {copiedField === "dm" ? "✓ COPIED" : "COPY DM"}
              </button>
            </div>
          )}

          {selectedProspect.research_notes && (
            <div className="detail-section">
              <div className="detail-section-title">// Research Notes</div>
              <div style={{ fontSize: 12, color: COLORS.textSecondary, lineHeight: 1.6 }}>
                {selectedProspect.research_notes}
              </div>
            </div>
          )}
        </div>
      )}
    </>
  );
}
