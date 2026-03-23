import { useState, useEffect, useRef } from "react";
import "../../assets/styles/app.css";
import { GEO } from "../../data/geo.js";
import { CHAIN_BRANDS } from "../../data/hotelMaps.js";
import { sbFetch } from "../../api/supabase.js";
import { postResearch } from "../../api/researchApi.js";
import { uid } from "../../utils/uid.js";
import { normalizeSearch } from "../../utils/strings.js";
import { parseJSON } from "../../utils/jsonUtils.js";
import { fmtDateShort } from "../../utils/dateUtils.js";
import {
  getProvider,
  normalizeGroup,
  normalizeBrand,
  inferBrandFromName,
  inferProvider,
} from "../../utils/hotelNormalize.js";
import { findDuplicates, groupIsDismissed, groupToPairs } from "../../utils/duplicateFinder.js";
import { parseDone } from "../../utils/pipelineTouch.js";
import { calcLeadScore } from "../../utils/leadScore.js";
import { DashboardTab } from "./components/DashboardTab.jsx";
import { HotelsTab } from "./components/HotelsTab.jsx";
import { PipelineTab } from "./components/PipelineTab.jsx";
import { ContactTrackerTab } from "./components/ContactTrackerTab.jsx";
import { DeleteHotelConfirm } from "./components/DeleteHotelConfirm.jsx";
import { DuplicateFinderModal } from "./components/DuplicateFinderModal.jsx";
import { AddHotelModal } from "./components/AddHotelModal.jsx";
import { RejectLostModal } from "./components/RejectLostModal.jsx";
import { HotelDetailDrawer } from "./components/HotelDetailDrawer.jsx";
import { Toast } from "./components/Toast.jsx";

export default function HomePage() {
  const [tab, setTab] = useState("dashboard");
  const [addHotelModal, setAddHotelModal] = useState(false);
  const [addHotelForm, setAddHotelForm] = useState({});
  const [ctExpanded, setCtExpanded] = useState(null);
  const [ctStageFilter, setCtStageFilter] = useState("");
  const [ctPriorityFilter, setCtPriorityFilter] = useState("");
  const [leadStatusFilter, setLeadStatusFilter] = useState(["Active"]);
  const [filterGrade, setFilterGrade] = useState([]);
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
  const [minAdr, setMinAdr] = useState("100");
  const [count, setCount] = useState("5");
  const [minRooms, setMinRooms] = useState("40");
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
  // pair-level ignore: each entry is "minId|maxId"
  const [dismissedDupPairs, setDismissedDupPairs] = useState(() => {
    try {
      return new Set(JSON.parse(localStorage.getItem("wtk_dismissed_dup_pairs") || "[]"));
    } catch {
      return new Set();
    }
  });
  const [cooldown, setCooldown] = useState(0); // seconds until next search allowed
  const lastBatchTime = useRef(0); // timestamp of last API batch completion
  const cooldownTimer = useRef(null);
  const [editingNote, setEditingNote] = useState(null);
  const [noteText, setNoteText] = useState("");
  const [filterProvider, setFilterProvider] = useState("");
  const [filterHasEmail, setFilterHasEmail] = useState(false);
  const [filterHasGM, setFilterHasGM] = useState(false);
  const [filterVerified, setFilterVerified] = useState(""); // "" | "yes" | "no"
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
  const [selectedIds, setSelectedIds] = useState(new Set()); // batch select
  const [ctFocusMode, setCtFocusMode] = useState(true); // focus mode default on
  const [focusDoneIds, setFocusDoneIds] = useState(new Set()); // temporarily dismissed in focus
  const [sortCol, setSortCol] = useState("score"); // "adr" | "rooms" | "score" | null
  const [sortDir, setSortDir] = useState("desc"); // "asc" | "desc"
  const [addContactDraft, setAddContactDraft] = useState({name:"",title:"",email:"",linkedin:"",phone:"",is_primary:false});
  // Multi-contact state: { [prospect_id]: [{id, name, title, email, linkedin, phone, is_primary}] }
  const [contacts, setContacts] = useState({});
  const [addContactForm, setAddContactForm] = useState(null); // prospect_id or null
  const [toast, setToast] = useState(null);
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
  useEffect(() => {
  function handleKeyDown(e) {
    if (e.key !== "Escape") return;
    if (addHotelModal) { closeAddHotelModal(); return; }
    if (selected && !rejectModal) { setSelected(null); return; }
    if (dupGroups !== null) { setDupGroups(null); return; }
  }
  document.addEventListener("keydown", handleKeyDown);
  return () => document.removeEventListener("keydown", handleKeyDown);
}, [addHotelModal, selected, rejectModal, dupGroups, addHotelForm]);

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
      const prospects = p || [], trackingData = t || [];
      setProspects(prospects); setTracking(trackingData);

      // ── Auto-verify migration ──────────────────────────────────────────────
      // Prospects that already have real outreach (stage beyond "new") are
      // implicitly verified — someone already contacted them. Mark them verified
      // so they remain visible in Pipeline. Runs once on load, skips already-verified.
      const CONTACTED_STAGES = new Set(["1st","2nd","3rd","4th","replied","bounced","demo","trial","won","lost","emailed","followup"]);
      const contactedPids = new Set(
        trackingData
          .filter(t => CONTACTED_STAGES.has(t.pipeline_stage))
          .map(t => t.prospect_id)
      );
      const toAutoVerify = prospects.filter(p => !p.verified && contactedPids.has(p.id));
      if (toAutoVerify.length > 0) {
        const ids = toAutoVerify.map(p => p.id);
        // Patch in DB (fire-and-forget, non-blocking)
        sbFetch(`/prospects?id=in.(${ids.join(",")})`, {
          method: "PATCH", prefer: "return=minimal",
          body: JSON.stringify({ verified: true })
        }).catch(e => console.error("Auto-verify migration failed:", e));
        // Update local state immediately so UI reflects it right away
        setProspects(prev => prev.map(p => ids.includes(p.id) ? { ...p, verified: true } : p));
        console.log(`[WTK] Auto-verified ${toAutoVerify.length} prospects with existing outreach.`);
      }
      // ─────────────────────────────────────────────────────────────────────
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
    const n = Math.min(Math.max(parseInt(count) || 5, 1), 5);

    const normKey = (name, city) => `${(name||"").toLowerCase().replace(/[^a-z0-9]/g,"")}::${(city||"").toLowerCase().replace(/[^a-z0-9]/g,"")}`;
    const existingKeys = new Set(prospects.map(p => normKey(p.hotel_name, p.city)));

    const PROSPECT_FIELDS = ["id","hotel_name","brand","hotel_group","tier","city","country","address","website","rooms","restaurants","adr_usd","rating","review_count","current_provider","gm_name","gm_first_name","gm_title","email","linkedin","phone","email_source","contact_confidence","outreach_email_subject","outreach_email_body","linkedin_dm","engagement_strategy","strategy_reason","research_notes","sdr","batch","created_at","verified"];
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
        mode: "list", city: market, brand, group, scope, minAdr, minRooms,
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
            const base = { ...p, id: uid(), created_at: new Date().toISOString(), batch: batchLabel, sdr, verified: false };
            const safe = {};
            PROSPECT_FIELDS.forEach(k => { if (base[k] !== undefined) safe[k] = base[k]; });
            return safe;
          });
          // No tracking rows created here — hotels start as unverified in Hotel list.
          // SDR must manually verify each hotel before it enters the Pipeline.

          try {
            await sbFetch("/prospects", { method: "POST", prefer: "return=minimal", body: JSON.stringify(enriched) });
          } catch (e) { console.error("Batch save error:", e); }

          setProspects(prev => [...enriched, ...prev]);
          allFresh.push(...enriched);
          startCooldown();

          setLog(`✓ ${allFresh.length} hotels saved to Hotel list${i < batches.length - 1 ? ` · batch ${i + 2} next...` : ""} — verify to add to Pipeline`);
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

  // Verify a prospect and ensure it has a tracking row so it appears in Pipeline.
  async function verifyAndAddToPipeline(pid) {
    const p = prospects.find(x => x.id === pid);
    if (!p) return;

    // Optimistic update
    setProspects(prev => prev.map(x => x.id === pid ? { ...x, verified: true } : x));

    try {
      await sbFetch(`/prospects?id=eq.${pid}`, { method: "PATCH", prefer: "return=minimal", body: JSON.stringify({ verified: true }) });
    } catch (e) {
      // Rollback on failure
      setProspects(prev => prev.map(x => x.id === pid ? { ...x, verified: false } : x));
      console.error("verifyAndAddToPipeline: prospect patch failed", e);
      alert(`Failed to verify "${p.hotel_name}". Please try again.`);
      return;
    }

    // If no tracking row exists yet, create one so the hotel enters the Pipeline "Verified" column
    const hasTracking = tracking.some(t => t.prospect_id === pid);
    if (!hasTracking) {
      const newRow = { id: uid(), prospect_id: pid, hotel: p.hotel_name, gm: p.gm_name || null, sdr: sdrName || "Unknown", pipeline_stage: "new", done: [], intention: 0, created_at: new Date().toISOString() };
      // Optimistic update
      setTracking(prev => [...prev, newRow]);
      try {
        await sbFetch("/tracking", { method: "POST", prefer: "return=minimal", body: JSON.stringify(newRow) });
      } catch (e) {
        // Rollback tracking row on failure (verified stays true — prospect was patched successfully)
        setTracking(prev => prev.filter(t => t.id !== newRow.id));
        console.error("verifyAndAddToPipeline: tracking insert failed", e);
        alert(`"${p.hotel_name}" was verified but couldn't be added to Pipeline. Please refresh and try again.`);
      }
    }
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

function showToast(msg, type = "success") {
  setToast({ msg, type });
  setTimeout(() => setToast(null), 3000);
}

function addHotelFormHasData() {
  return Object.values(addHotelForm).some(v => v !== null && v !== undefined && String(v).trim() !== "");
}

function closeAddHotelModal() {
  if (addHotelFormHasData()) {
    if (!window.confirm("You have unsaved changes. Close anyway?")) return;
  }
  setAddHotelModal(false);
  setAddHotelForm({});
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
      setAddHotelModal(false);
      setAddHotelForm({});
      showToast(`✓ "${record.hotel_name}" added to hotel list`);
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

    const DB_FIELDS = ["id","hotel_name","brand","hotel_group","tier","city","country","address","website","rooms","restaurants","adr_usd","rating","review_count","current_provider","gm_name","gm_first_name","gm_title","email","linkedin","phone","email_source","contact_confidence","outreach_email_subject","outreach_email_body","linkedin_dm","engagement_strategy","strategy_reason","research_notes","sdr","batch","created_at","lead_status","management_company","operating_model","operating_model_note","verified"];
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
        const hotelName = direct(row, "hotel_name") || direct(row, "hotel");
        if (!hotelName) continue;
        p = { id: direct(row,"id") || uid(), created_at: direct(row,"created_at") || new Date().toISOString() };
        for (const f of DB_FIELDS) {
          if (f === "id" || f === "created_at") continue;
          p[f] = direct(row, f);
        }
        // Force hotel_name from common aliases
        if (!p.hotel_name) p.hotel_name = hotelName;
        // Map common column aliases that don't match DB field names exactly
        if (!p.hotel_group) p.hotel_group = direct(row, "group") || direct(row, "chain");
        if (!p.current_provider) p.current_provider = direct(row, "provider");
        if (!p.gm_name) p.gm_name = direct(row, "contact") || direct(row, "gm");
        if (!p.gm_title) p.gm_title = direct(row, "position") || direct(row, "title");
        if (!p.management_company) p.management_company = direct(row, "mgmt company") || direct(row, "management");
        if (!p.operating_model) p.operating_model = direct(row, "ownership");
        if (!p.adr_usd && !p.adr_usd) { const adr = num(direct(row, "adr")); if (adr) p.adr_usd = adr; }
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

      // ── Sanitize multi-value fields: take first value only ──
      function firstVal(v, sep) {
        if (!v) return v;
        const s = String(v);
        // Split on comma, semicolon, newline, " / ", " & " (but not within names like "JW Marriott")
        const parts = s.split(/[,;\n]|(?:\s\/\s)/).map(x => x.trim()).filter(Boolean);
        return parts[0] || v;
      }
      function firstEmail(v) {
        if (!v) return v;
        const s = String(v);
        // Find first email-like pattern
        const emails = s.match(/[^\s,;]+@[^\s,;]+/g);
        return emails ? emails[0] : null;
      }
      if (p.gm_name && /[,;\n]/.test(p.gm_name)) p.gm_name = firstVal(p.gm_name);
      if (p.email) p.email = firstEmail(p.email);
      if (p.phone && /[,;\n]/.test(String(p.phone))) p.phone = firstVal(String(p.phone));
      if (p.gm_name) p.gm_first_name = p.gm_name.split(" ")[0];

      imported.push(p);
    }

    if (!imported.length) {
      // Debug: show what the parser actually saw
      const debugHeaders = headers.join(" | ");
      const debugRow1 = lines[1] ? parseRow(lines[1]).join(" | ") : "(no data)";
      const debugMatched = headers.findIndex(h => h.includes("hotel"));
      console.error("[Import Debug]", { headers, debugRow1, isDirectMode, hotelColIndex: debugMatched, lineCount: lines.length });
      return alert(`No valid rows found.\n\nDebug info:\n- Lines: ${lines.length}\n- Mode: ${isDirectMode ? "Direct" : "Flexible"}\n- Headers: ${debugHeaders.slice(0,200)}\n- "hotel" col index: ${debugMatched}\n- Row 1 sample: ${debugRow1.slice(0,150)}`);
    }
    if (!confirm(`Import ${imported.length} hotels? (Mode: ${isDirectMode ? "Direct field match" : "Flexible mapping"})`)) return;

    try {
      // Supabase has 1000 row insert limit — chunk it
      const CHUNK = 500;
      // Ensure all imported records have verified=false — they start in Hotel list only.
      // SDR must manually verify before they enter Pipeline.
      const toSave = imported.map(p => ({ ...p, verified: p.verified ?? false }));
      for (let i = 0; i < toSave.length; i += CHUNK) {
        await sbFetch("/prospects", { method: "POST", prefer: "return=minimal", body: JSON.stringify(toSave.slice(i, i+CHUNK)) });
      }
      // No tracking rows created on import — verify flow handles that.
      setProspects(prev => [...prev, ...toSave]);
      alert(`✓ ${toSave.length} hotels imported to Hotel list. Verify each hotel to add to Pipeline.`);
    } catch(err) {
      alert("Import failed: " + err.message);
    }
  }

  const sel = selected ? prospects.find(p => p.id === selected) : null;
  const sdrs = ["all", ...new Set(prospects.map(p => p.sdr).filter(Boolean))];
  const filteredP = prospects.filter(p => {
    if (leadStatusFilter.length > 0 && !leadStatusFilter.includes(p.lead_status || "Active")) return false;
    if (filterSdr !== "all" && p.sdr !== filterSdr) return false;
    if (filterCountry === "__blank__" ? !!(p.country||"").trim() : filterCountry && (p.country||"") !== filterCountry) return false;
    if (filterCity === "__blank__" ? !!(p.city||"").trim() : filterCity && (p.city||"") !== filterCity) return false;
    if (filterGroup === "__blank__" ? !!(normalizeGroup(p.hotel_group||p.brand||"")) : filterGroup && normalizeGroup(p.hotel_group||p.brand||"") !== filterGroup) return false;
    if (filterBrand === "__blank__" ? !!(normalizeBrand(p.brand)) : filterBrand && normalizeBrand(p.brand) !== filterBrand) return false;
    if (filterProvider) {
      const prov = getProvider(p) || "Unknown";
      if (prov !== filterProvider) return false;
    }
    if (filterGrade.length > 0 && !filterGrade.includes(calcLeadScore(p).grade)) return false;
    if (filterHasEmail && !p.email) return false;
    if (filterHasGM && !p.gm_name) return false;
    if (filterVerified === "yes" && !p.verified) return false;
    if (filterVerified === "no" && p.verified) return false;
    if (filterSearch) {
      const q = normalizeSearch(filterSearch);
      if (!normalizeSearch(p.hotel_name).includes(q) && !normalizeSearch(p.gm_name).includes(q) && !normalizeSearch(p.city).includes(q)) return false;
    }
    return true;
  });
  // Sort if active — nulls always at bottom
  const sortedP = sortCol ? [...filteredP].sort((a, b) => {
    const va = sortCol === "adr" ? (a.adr_usd||null) : sortCol === "rooms" ? (a.rooms||null) : sortCol === "score" ? calcLeadScore(a).total : null;
    const vb = sortCol === "adr" ? (b.adr_usd||null) : sortCol === "rooms" ? (b.rooms||null) : sortCol === "score" ? calcLeadScore(b).total : null;
    if (va == null && vb == null) return 0;
    if (va == null) return 1;
    if (vb == null) return -1;
    return sortDir === "asc" ? va - vb : vb - va;
  }) : filteredP;
  // validTracking: only tracking rows whose prospect still exists in the prospects array.
  // This is the single source of truth for all counts (Pipeline, Contact Tracker, Dashboard).
  // When a prospect is deleted, its tracking row may linger in Supabase until next full reload;
  // filtering here keeps all three views consistent without requiring an immediate DB cleanup.
  const validProspectIds = new Set(prospects.map(p => p.id));
  const validTracking = tracking.filter(t => validProspectIds.has(t.prospect_id));

  const filteredT = validTracking.filter(t => {
    if (filterSdr !== "all" && t.sdr !== filterSdr) return false;
    const p = prospects.find(x => x.id === t.prospect_id);
    // Pipeline gate: only verified prospects are shown. Prospects that have been
    // contacted (stage >= "1st") are auto-verified on load; unverified prospects
    // with pipeline_stage="new" sit in the Hotel list only until manually verified.
    if (!p?.verified) return false;
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
    if (filterGrade.length > 0 && p && !filterGrade.includes(calcLeadScore(p).grade)) return false;
    return true;
  });
  const contacted = validTracking.filter(t => (t.done || []).length > 0).length;
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
      <div className="app">
        <nav className="topnav">
          <div className="nav-left">
            <div className="wtk-icon">W</div>
            <span className="nav-brand">Where to know</span>
            <div className="nav-sep"/>
            <span className="nav-page">SDR Intelligence</span>
          </div>
          <div className="nav-stats">
            <div className="nav-stat"><span className="nav-stat-n">{filteredP.length}</span><span className="nav-stat-l">{filterSdr !== "all" ? filterSdr : "Prospects"}</span></div>
            <div className="nav-stat"><span className="nav-stat-n">{filteredP.filter(p=>p.email).length}</span><span className="nav-stat-l">Emails</span></div>
            <div className="nav-stat"><span className="nav-stat-n">{validTracking.filter(t=>(t.done||[]).length>0 && (filterSdr==="all"||t.sdr===filterSdr)).length}</span><span className="nav-stat-l">Contacted</span></div>
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
                <div style={{display:"flex",alignItems:"center",gap:6}}>
                  <span style={{fontSize:11,color:"var(--text3)",whiteSpace:"nowrap"}}>Min ADR $</span>
                  <input type="number" min="50" max="2000" step="50" value={minAdr} onChange={e=>setMinAdr(e.target.value)} className="cmd-input" style={{width:60}} title="Minimum ADR in USD" />
                  <span style={{fontSize:11,color:"var(--text3)",whiteSpace:"nowrap"}}>Min Rooms</span>
                  <input type="number" min="10" max="500" step="10" value={minRooms} onChange={e=>setMinRooms(e.target.value)} className="cmd-input" style={{width:52}} title="Minimum room count" />
                </div>
              )}
              <input type="number" min="1" max="5" value={count} onChange={e=>setCount(e.target.value)} className="cmd-input" style={{width:44}} title="Count (max 5)" />
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
            {["A","B","C"].map(g=><button key={g} className={`filter-pill ${filterGrade.includes(g)?"active":""}`} onClick={()=>{setFilterGrade(prev=>prev.includes(g)?prev.filter(x=>x!==g):[...prev,g]);setHotelsPage(1);}} style={{borderColor:{A:"#1d4ed8",B:"#475569",C:"#94a3b8"}[g],color:filterGrade.includes(g)?undefined:{A:"#1d4ed8",B:"#475569",C:"#94a3b8"}[g]}}>{g}</button>)}
            <span style={{width:1,height:24,background:"var(--border)",margin:"0 4px",flexShrink:0}}/>
            <button className="export-btn" style={{fontWeight:600}} onClick={()=>{setAddHotelForm({});setAddHotelModal(true);}}>+ Add Hotel</button>
            {filteredP.length > 0 && <button className="export-btn" onClick={exportCSV}>↓ Export CSV</button>}
            <label className="export-btn" style={{cursor:"pointer"}} title="Import hotels from CSV/Excel (exported from this tool or mapped manually)">
              ↑ Import CSV
              <input type="file" accept=".csv,.xlsx,.xls,text/csv,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" style={{display:"none"}} onChange={importCSV}/>
            </label>
            <span style={{width:1,height:24,background:"var(--border)",margin:"0 4px",flexShrink:0}}/>
            {filteredP.length > 1 && <button className="export-btn" onClick={()=>{const g=findDuplicates(filteredP).filter(g=>!groupIsDismissed(g.hotels,dismissedDupPairs));setDupGroups(g);setDupExpanded(new Set());}}>Find Duplicates</button>}
            <span className="record-count">{loading?"Loading...":`${filteredP.length} prospects in shared database`}</span>
          </div>

          <div className="tabs">
            <button className={`tab ${tab==="dashboard"?"active":""}`} onClick={()=>setTab("dashboard")}>Dashboard</button>
            <button className={`tab ${tab==="hotels"?"active":""}`} onClick={()=>setTab("hotels")}>Hotels<span className="tab-badge">{sortedP.length}</span></button>
              <button className={`tab ${tab==="outreach"?"active":""}`} onClick={()=>setTab("outreach")}>Pipeline<span className="tab-badge">{filteredT.length}</span></button>
              <button className={`tab ${tab==="contacts"?"active":""}`} onClick={()=>setTab("contacts")}>Contact Tracker<span className="tab-badge">{validTracking.filter(t=>t.d1).length}</span></button>
          </div>

          {tab==="dashboard" && <DashboardTab prospects={prospects} validTracking={validTracking} />}

          {tab==="hotels" && (
            <HotelsTab
              loading={loading}
              filteredP={filteredP}
              sortedP={sortedP}
              pagedP={pagedP}
              totalHotelPages={totalHotelPages}
              hotelsPage={hotelsPage}
              setHotelsPage={setHotelsPage}
              allCountries={allCountries}
              allCities={allCities}
              allGroups={allGroups}
              allBrands={allBrands}
              allProviders={allProviders}
              filterSearch={filterSearch}
              setFilterSearch={setFilterSearch}
              filterCountry={filterCountry}
              setFilterCountry={setFilterCountry}
              filterCity={filterCity}
              setFilterCity={setFilterCity}
              filterGroup={filterGroup}
              setFilterGroup={setFilterGroup}
              filterBrand={filterBrand}
              setFilterBrand={setFilterBrand}
              filterProvider={filterProvider}
              setFilterProvider={setFilterProvider}
              filterHasEmail={filterHasEmail}
              setFilterHasEmail={setFilterHasEmail}
              filterHasGM={filterHasGM}
              setFilterHasGM={setFilterHasGM}
              filterVerified={filterVerified}
              setFilterVerified={setFilterVerified}
              selectedIds={selectedIds}
              setSelectedIds={setSelectedIds}
              selected={selected}
              setSelected={setSelected}
              sortCol={sortCol}
              sortDir={sortDir}
              setSortCol={setSortCol}
              toggleSort={toggleSort}
              updateProspect={updateProspect}
              updatePipeline={updatePipeline}
              verifyAndAddToPipeline={verifyAndAddToPipeline}
              deleteProspect={deleteProspect}
              setDeleteConfirm={setDeleteConfirm}
              tracking={tracking}
            />
          )}

          {tab==="outreach" && (
            <PipelineTab
              filteredT={filteredT}
              stageFilter={stageFilter}
              setStageFilter={setStageFilter}
              setSelected={setSelected}
              touchToggle={touchToggle}
              updatePipeline={updatePipeline}
              openRejectModal={openRejectModal}
              reopenSequence={reopenSequence}
              outreachView={outreachView}
              setOutreachView={setOutreachView}
              setDeleteConfirm={setDeleteConfirm}
              editingNote={editingNote}
              setEditingNote={setEditingNote}
              noteText={noteText}
              setNoteText={setNoteText}
              saveNote={saveNote}
              prospects={prospects}
              outreachSearch={outreachSearch}
              setOutreachSearch={setOutreachSearch}
              outreachCountry={outreachCountry}
              setOutreachCountry={setOutreachCountry}
              outreachCity={outreachCity}
              setOutreachCity={setOutreachCity}
              outreachGroup={outreachGroup}
              setOutreachGroup={setOutreachGroup}
              outreachTier={outreachTier}
              setOutreachTier={setOutreachTier}
              outreachProvider={outreachProvider}
              setOutreachProvider={setOutreachProvider}
              allCountries={allCountries}
              allCities={allCities}
              allGroups={allGroups}
              allProviders={allProviders}
              updateIntention={updateIntention}
              pipeStageFilter={pipeStageFilter}
              setPipeStageFilter={setPipeStageFilter}
              pipeHasGM={pipeHasGM}
              setPipeHasGM={setPipeHasGM}
              pipeHasEmail={pipeHasEmail}
              setPipeHasEmail={setPipeHasEmail}
            />
          )}

          {tab === "contacts" && (
            <ContactTrackerTab
              prospects={prospects}
              validTracking={validTracking}
              tracking={tracking}
              updatePipeline={updatePipeline}
              setSelected={setSelected}
              ctExpanded={ctExpanded}
              setCtExpanded={setCtExpanded}
              ctStageFilter={ctStageFilter}
              setCtStageFilter={setCtStageFilter}
              ctPriFilter={ctPriFilter}
              setCtPriFilter={setCtPriFilter}
              ctOwnerFilter={ctOwnerFilter}
              setCtOwnerFilter={setCtOwnerFilter}
              ctDueFilter={ctDueFilter}
              setCtDueFilter={setCtDueFilter}
              ctSortCol={ctSortCol}
              setCtSortCol={setCtSortCol}
              ctSortDir={ctSortDir}
              setCtSortDir={setCtSortDir}
              ctPage={ctPage}
              setCtPage={setCtPage}
              ctFocusMode={ctFocusMode}
              setCtFocusMode={setCtFocusMode}
              focusDoneIds={focusDoneIds}
              setFocusDoneIds={setFocusDoneIds}
            />
          )}
        </div>
      </div>

      <DeleteHotelConfirm
        deleteId={deleteConfirm}
        hotelName={prospects.find((x) => x.id === deleteConfirm)?.hotel_name}
        onCancel={() => setDeleteConfirm(null)}
        onConfirmDelete={deleteProspect}
      />

      <DuplicateFinderModal
        dupGroups={dupGroups}
        onClose={() => setDupGroups(null)}
        dupExpanded={dupExpanded}
        setDupExpanded={setDupExpanded}
        dismissedDupPairs={dismissedDupPairs}
        setDismissedDupPairs={setDismissedDupPairs}
        setSelected={setSelected}
        setProspects={setProspects}
        setTracking={setTracking}
        setDupGroups={setDupGroups}
      />

      <AddHotelModal
        open={addHotelModal}
        form={addHotelForm}
        setForm={setAddHotelForm}
        onClose={closeAddHotelModal}
        onSave={saveManualHotel}
      />

      <RejectLostModal
        open={!!rejectModal}
        onClose={() => setRejectModal(null)}
        rejectReason={rejectReason}
        setRejectReason={setRejectReason}
        rejectOtherText={rejectOtherText}
        setRejectOtherText={setRejectOtherText}
        onConfirm={confirmReject}
      />

      <HotelDetailDrawer
        prospect={sel}
        rejectModalOpen={!!rejectModal}
        onClose={() => setSelected(null)}
        tracking={tracking}
        updateProspectField={updateProspectField}
        parseContacts={parseContacts}
        saveContacts={saveContacts}
        addContactForm={addContactForm}
        setAddContactForm={setAddContactForm}
        addContactDraft={addContactDraft}
        setAddContactDraft={setAddContactDraft}
        openRejectModal={openRejectModal}
        updatePipeline={updatePipeline}
        updateProspect={updateProspect}
        editingNote={editingNote}
        setEditingNote={setEditingNote}
        noteText={noteText}
        setNoteText={setNoteText}
        saveNote={saveNote}
        copied={copied}
        copy={copy}
      />

      <Toast toast={toast} />

    </>
  );

}
