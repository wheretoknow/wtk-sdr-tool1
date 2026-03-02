const PROVIDER_MAP = {"ritz-carlton":"Qualtrics","marriott":"Qualtrics","sheraton":"Qualtrics","westin":"Qualtrics","le meridien":"Qualtrics","renaissance":"Qualtrics","autograph":"Qualtrics","moxy":"Qualtrics","aloft":"Qualtrics","intercontinental":"Medallia","kimpton":"Medallia","six senses":"Medallia","regent":"Medallia","hotel indigo":"Medallia","crowne plaza":"Medallia","voco":"Medallia","ihg":"Medallia","park hyatt":"Medallia","andaz":"Medallia","grand hyatt":"Medallia","hyatt":"Medallia","wyndham":"Medallia","radisson":"ReviewPro","park plaza":"ReviewPro","anantara":"ReviewPro","peninsula":"ReviewPro","capella":"ReviewPro","kempinski":"ReviewPro","raffles":"TrustYou","fairmont":"TrustYou","sofitel":"TrustYou","accor":"TrustYou","rosewood":"TrustYou","mandarin oriental":"TrustYou"};
function inferProvider(b,n){const s=((b||"")+" "+(n||"")).toLowerCase();for(const[k,v]of Object.entries(PROVIDER_MAP)){if(s.includes(k))return v;}return null;}

const SYSTEM=`Return ONLY a raw JSON array. No markdown. No explanation. No preamble. Start your response with [ and end with ].
Each hotel:{"hotel_name":"","brand":"brand only e.g. Kimpton","hotel_group":"parent group e.g. IHG or Independent","tier":"Luxury|Premium|Lifestyle|Economy|Function","city":"","country":"","address":"","website":"","rooms":null,"restaurants":null,"adr_usd":null,"rating":null,"review_count":null,"current_provider":null,"gm_name":null,"gm_first_name":null,"gm_title":"General Manager","email":null,"linkedin":null,"phone":null,"email_source":null,"contact_confidence":"L","outreach_email_subject":"REQUIRED - specific tension hook, no generic titles","outreach_email_body":"REQUIRED. MAX 100 words. No labels, no placeholders. Format:\nHello [FirstName],\n\n[1 sentence: specific tension from reviews with platform+timeframe. Be concrete.]\n\n[1 sentence: why invisible to management.]\n\n[If provider known: 'We know you have [Provider] — Where to know works alongside it, adding what [Provider] doesn't cover: local competitor benchmarking and pattern-to-action mapping. Most clients run both.' Else: skip.]\n\n[1 sentence: concrete outcome. No AI/tech/dashboard words.]\n\nAvailable for 15 min [specific days]?\n\nBest,\nZishuo Wang | Where to know","engagement_strategy":"DIRECT-TO-GM","strategy_reason":"","research_notes":"• GM: name (source)\n• ADR: $X (source)\n• Rating: X/SCALE from PLATFORM (N reviews) — SCALE is 5 for Google/TripAdvisor, 10 for Booking.com/Agoda/Trip.com\n• Provider: X (confirmed source) or Unknown\n• Theme: X"}
Our provider map (use to infer current_provider): Marriott brands=Qualtrics, IHG brands(InterContinental/Kimpton/Hotel Indigo/Six Senses/Regent/Crowne Plaza/voco/Holiday Inn/EVEN/Staybridge/Candlewood)=Medallia, Hyatt/Wyndham=Medallia, Radisson/NH/Park Plaza/Anantara/Peninsula/Capella=ReviewPro, Accor/Rosewood/Mandarin Oriental=TrustYou.
outreach_email_subject and outreach_email_body are REQUIRED always. Never use placeholder labels like [P1] in the final email. For email field: search for GM personal email (firstname.lastname@brand.com or @hotel.com). Only use generic emails (info@, reservations@, contact@) as last resort — mark email_source as "generic". PLATFORM PRIORITY FOR REVIEWS: Europe/Americas hotels → prefer Booking.com (highest volume), then Google. Asia hotels → prefer Agoda or Trip.com, then Google. Always use the platform with the most reviews. Never use a low-volume platform when a high-volume one exists for the same hotel. PROVIDER ACCURACY: Only set current_provider if confirmed from a public source. If not confirmed, set null — never guess.`;

const DEEP_SYSTEM=`Search for this hotel. Return ONLY JSON: {"adr_usd":null,"rating":null,"review_count":null,"research_notes":"• GM: name+LinkedIn\n• ADR: $X (Booking.com)\n• Rating: X/5 (N reviews, Google) or X/10 (N reviews, Booking.com) — specify platform and correct scale\n• Theme 1: X\n• Theme 2: X\n• Provider: X"}`;

// Extract only the last text block — the actual JSON output, not search narration
function extractLastText(content) {
  const textBlocks = (content || []).filter(b => b.type === 'text');
  if (!textBlocks.length) return '';
  // Take only the last text block — that's where the final JSON is after tool use
  return textBlocks[textBlocks.length - 1].text || '';
}

export default async function handler(req,res){
  res.setHeader('Access-Control-Allow-Origin','*');
  res.setHeader('Access-Control-Allow-Methods','POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers','Content-Type');
  if(req.method==='OPTIONS')return res.status(200).end();
  if(req.method!=='POST')return res.status(405).json({error:'Method not allowed'});
  try{
    const{city,brand,segment,count,mode,hotel_name,exclude}=req.body;
    if(mode==='deep'&&hotel_name){
      const r=await fetch('https://api.anthropic.com/v1/messages',{method:'POST',headers:{'Content-Type':'application/json','x-api-key':process.env.ANTHROPIC_API_KEY,'anthropic-version':'2023-06-01','anthropic-beta':'web-search-2025-03-05'},body:JSON.stringify({model:'claude-haiku-4-5-20251001',max_tokens:2000,system:DEEP_SYSTEM,tools:[{type:'web_search_20250305',name:'web_search',max_uses:4}],messages:[{role:'user',content:`Research: ${hotel_name}. Find ADR, rating, reviews, GM LinkedIn, feedback themes.`}]})});
      const data=await r.json();
      if(!r.ok)return res.status(500).json({error:data.error?.message||'API error'});
      const text=extractLastText(data.content);
      const s=text.indexOf('{'),e=text.lastIndexOf('}');
      if(s>=0&&e>=0)return res.status(200).json({result:text.slice(s,e+1)});
      return res.status(200).json({result:text});
    }
    const tiers={"Luxury":"luxury 5-star","Premium":"premium 4-star","Lifestyle":"lifestyle boutique","Economy":"economy 3-star","Function":"airport/convention"};
    const t=tiers[segment]||"luxury";
    const b=brand?` ${brand} brand only.`:"";
    const brandFilter = brand ? ` IMPORTANT: Only include hotels that are CONFIRMED ${brand} brand properties. Do NOT include non-${brand} hotels.` : "";
    // Exclusion list — hotels already in our DB, model must skip these
    const excludeClause = (exclude&&exclude.length)
      ? `\n\nDo NOT include any of these hotels (already in our database): ${exclude.slice(0,80).join(', ')}. Find different hotels only.`
      : "";

    // Phase 1: search with web tool, gather raw info
    const searchPrompt=`Find ${count} ${t} hotels in ${city}.${b}${brandFilter}${excludeClause} For each hotel find: exact hotel name, GM name, GM email if public, room count, ADR from Booking.com or Agoda, recent guest feedback theme, brand, parent group. Be thorough.`;
    const r1=await fetch('https://api.anthropic.com/v1/messages',{method:'POST',headers:{'Content-Type':'application/json','x-api-key':process.env.ANTHROPIC_API_KEY,'anthropic-version':'2023-06-01','anthropic-beta':'web-search-2025-03-05'},body:JSON.stringify({model:'claude-haiku-4-5-20251001',max_tokens:4000,tools:[{type:'web_search_20250305',name:'web_search',max_uses:8}],messages:[{role:'user',content:searchPrompt}]})});
    const d1=await r1.json();
    if(!r1.ok)return res.status(500).json({error:d1.error?.message||'API error (phase 1)'});
    const searchSummary=extractLastText(d1.content);

    // Phase 2: convert gathered info to clean JSON, no web search needed
    const jsonPrompt=`Based on this research:\n\n${searchSummary}\n\nNow output ONLY a JSON array for ${count} ${t}${brand?' '+brand:''} hotels in ${city}. Start with [ end with ]. No text before or after.`;
    const r2=await fetch('https://api.anthropic.com/v1/messages',{method:'POST',headers:{'Content-Type':'application/json','x-api-key':process.env.ANTHROPIC_API_KEY,'anthropic-version':'2023-06-01'},body:JSON.stringify({model:'claude-haiku-4-5-20251001',max_tokens:5000,system:SYSTEM,messages:[{role:'user',content:jsonPrompt}]})});
    const d2=await r2.json();
    if(!r2.ok)return res.status(500).json({error:d2.error?.message||'API error (phase 2)'});
    let text=extractLastText(d2.content);
    try{
      const s=text.indexOf('['),e=text.lastIndexOf(']');
      if(s>=0&&e>=0){
        const arr=JSON.parse(text.slice(s,e+1));
        text=JSON.stringify(arr.map(p=>({...p,current_provider:inferProvider(p.brand,p.hotel_name)||p.current_provider||null,hotel_group:p.hotel_group||p.brand||"Independent"})));
      }
    }catch(e){}
    res.status(200).json({result:text});
  }catch(err){res.status(500).json({error:err.message});}
}

const SYSTEM=`Return ONLY a raw JSON array. No markdown.
Each hotel:{"hotel_name":"","brand":"brand only e.g. Kimpton","hotel_group":"parent group e.g. IHG or Independent","tier":"Luxury|Premium|Lifestyle|Economy|Function","city":"","country":"","address":"","website":"","rooms":null,"restaurants":null,"adr_usd":null,"rating":null,"review_count":null,"current_provider":null,"gm_name":null,"gm_first_name":null,"gm_title":"General Manager","email":null,"linkedin":null,"phone":null,"email_source":null,"contact_confidence":"L","outreach_email_subject":"REQUIRED - specific tension hook, no generic titles","outreach_email_body":"REQUIRED. MAX 100 words. No labels, no placeholders. Format:\nHello [FirstName],\n\n[1 sentence: specific tension from reviews with platform+timeframe. Be concrete.]\n\n[1 sentence: why invisible to management.]\n\n[If provider known: 'We know you have [Provider] — Where to know works alongside it, adding what [Provider] doesn't cover: local competitor benchmarking and pattern-to-action mapping. Most clients run both.' Else: skip.]\n\n[1 sentence: concrete outcome. No AI/tech/dashboard words.]\n\nAvailable for 15 min [specific days]?\n\nBest,\nZishuo Wang | Where to know","engagement_strategy":"DIRECT-TO-GM","strategy_reason":"","research_notes":"• GM: name (source)\n• ADR: $X (source)\n• Rating: X/SCALE from PLATFORM (N reviews) — SCALE is 5 for Google/TripAdvisor, 10 for Booking.com/Agoda/Trip.com\n• Provider: X (confirmed source) or Unknown\n• Theme: X"}
Our provider map (use to infer current_provider): Marriott brands=Qualtrics, IHG brands(InterContinental/Kimpton/Hotel Indigo/Six Senses/Regent/Crowne Plaza/voco/Holiday Inn/EVEN/Staybridge/Candlewood)=Medallia, Hyatt/Wyndham=Medallia, Radisson/NH/Park Plaza/Anantara/Peninsula/Capella=ReviewPro, Accor/Rosewood/Mandarin Oriental=TrustYou.
outreach_email_subject and outreach_email_body are REQUIRED always. Never use placeholder labels like [P1] in the final email. For email field: search for GM personal email (firstname.lastname@brand.com or @hotel.com). Only use generic emails (info@, reservations@, contact@) as last resort — mark email_source as "generic". PLATFORM PRIORITY FOR REVIEWS: Europe/Americas hotels → prefer Booking.com (highest volume), then Google. Asia hotels → prefer Agoda or Trip.com, then Google. Always use the platform with the most reviews. Never use a low-volume platform when a high-volume one exists for the same hotel. PROVIDER ACCURACY: Only set current_provider if confirmed from a public source. If not confirmed, set null — never guess.`;

const DEEP_SYSTEM=`Search for this hotel. Return ONLY JSON: {"adr_usd":null,"rating":null,"review_count":null,"research_notes":"• GM: name+LinkedIn\n• ADR: $X (Booking.com)\n• Rating: X/5 (N reviews, Google) or X/10 (N reviews, Booking.com) — specify platform and correct scale\n• Theme 1: X\n• Theme 2: X\n• Provider: X"}`;

export default async function handler(req,res){
  res.setHeader('Access-Control-Allow-Origin','*');
  res.setHeader('Access-Control-Allow-Methods','POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers','Content-Type');
  if(req.method==='OPTIONS')return res.status(200).end();
  if(req.method!=='POST')return res.status(405).json({error:'Method not allowed'});
  try{
    const{city,brand,segment,count,mode,hotel_name}=req.body;
    if(mode==='deep'&&hotel_name){
      const r=await fetch('https://api.anthropic.com/v1/messages',{method:'POST',headers:{'Content-Type':'application/json','x-api-key':process.env.ANTHROPIC_API_KEY,'anthropic-version':'2023-06-01','anthropic-beta':'web-search-2025-03-05'},body:JSON.stringify({model:'claude-haiku-4-5-20251001',max_tokens:1000,system:DEEP_SYSTEM,tools:[{type:'web_search_20250305',name:'web_search',max_uses:4}],messages:[{role:'user',content:`Research: ${hotel_name}. Find ADR, rating, reviews, GM LinkedIn, feedback themes.`}]})});
      const data=await r.json();
      if(!r.ok)return res.status(500).json({error:data.error?.message||'API error'});
      const text=data.content.filter(b=>b.type==='text').map(b=>b.text).join('');
      const s=text.indexOf('{'),e=text.lastIndexOf('}');
      if(s>=0&&e>=0)return res.status(200).json({result:text.slice(s,e+1)});
      return res.status(200).json({result:text});
    }
    const tiers={"Luxury":"luxury 5-star","Premium":"premium 4-star","Lifestyle":"lifestyle boutique","Economy":"economy 3-star","Function":"airport/convention"};
    const t=tiers[segment]||"luxury";
    const b=brand?` ${brand} brand only.`:"";
    const brandFilter = brand ? ` IMPORTANT: Only include hotels that are CONFIRMED ${brand} brand properties. Verify brand affiliation before including. Do NOT include hotels that are not ${brand} branded.` : "";
    const prompt=`List ${count} ${t} hotels in ${city}.${b}${brandFilter} For each find: GM name+email, brand, parent group, rooms, ADR from Booking.com, one feedback theme from recent reviews. JSON array.`;
    const r=await fetch('https://api.anthropic.com/v1/messages',{method:'POST',headers:{'Content-Type':'application/json','x-api-key':process.env.ANTHROPIC_API_KEY,'anthropic-version':'2023-06-01','anthropic-beta':'web-search-2025-03-05'},body:JSON.stringify({model:'claude-haiku-4-5-20251001',max_tokens:6000,system:SYSTEM,tools:[{type:'web_search_20250305',name:'web_search',max_uses:8}],messages:[{role:'user',content:prompt}]})});
    const data=await r.json();
    if(!r.ok)return res.status(500).json({error:data.error?.message||'API error'});
    let text=data.content.filter(b=>b.type==='text').map(b=>b.text).join('');
    try{
      const s=text.indexOf('['),e=text.lastIndexOf(']');
      if(s>=0&&e>=0){
        const arr=JSON.parse(text.slice(s,e+1));
        text=JSON.stringify(arr.map(p=>({...p,current_provider:inferProvider(p.brand,p.hotel_name)||p.current_provider||null,hotel_group:p.hotel_group||p.brand||"Independent"})));
      }
    }catch(e){}
    res.status(200).json({result:text});
  }catch(err){res.status(500).json({error:err.message});}
}
