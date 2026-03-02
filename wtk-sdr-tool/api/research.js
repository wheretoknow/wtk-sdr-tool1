const PROVIDER_MAP = {"ritz-carlton":"Qualtrics","marriott":"Qualtrics","sheraton":"Qualtrics","westin":"Qualtrics","le meridien":"Qualtrics","renaissance":"Qualtrics","autograph":"Qualtrics","moxy":"Qualtrics","aloft":"Qualtrics","courtyard":"Qualtrics","intercontinental":"Medallia","kimpton":"Medallia","six senses":"Medallia","regent":"Medallia","hotel indigo":"Medallia","crowne plaza":"Medallia","voco":"Medallia","holiday inn":"Medallia","ihg":"Medallia","park hyatt":"Medallia","andaz":"Medallia","grand hyatt":"Medallia","hyatt":"Medallia","wyndham":"Medallia","radisson":"ReviewPro","park plaza":"ReviewPro","anantara":"ReviewPro","nh ":"ReviewPro","peninsula":"ReviewPro","capella":"ReviewPro","raffles":"TrustYou","fairmont":"TrustYou","sofitel":"TrustYou","pullman":"TrustYou","novotel":"TrustYou","ibis":"TrustYou","accor":"TrustYou","rosewood":"TrustYou","mandarin oriental":"TrustYou"};

function inferProvider(b,n){const s=((b||"")+" "+(n||"")).toLowerCase();for(const[k,v]of Object.entries(PROVIDER_MAP)){if(s.includes(k))return v;}return null;}

// STAGE 1 - Fast Mode. Minimal search. Always generate email.
const SYSTEM = `Return ONLY a raw JSON array. No markdown, no backticks, no explanation.

For each hotel search: GM name, brand/group, room count, estimated ADR (check Booking.com or hotel website), one guest feedback theme from recent reviews.

Return this exact JSON structure per hotel:
{
  "hotel_name": "Full official name",
  "brand": "Brand name only e.g. Ritz-Carlton",
  "hotel_group": "Parent group e.g. Marriott International, or Independent",
  "tier": "Luxury|Premium|Lifestyle|Economy|Function",
  "city": "", "country": "", "address": "", "website": "",
  "rooms": null, "restaurants": null, "adr_usd": null,
  "rating": null, "review_count": null,
  "current_provider": null,
  "gm_name": null, "gm_first_name": null, "gm_title": "General Manager",
  "email": null, "linkedin": null, "phone": null, "email_source": null,
  "contact_confidence": "L",
  "outreach_email_subject": "REQUIRED - e.g. [Hotel] — [tension hook]",
  "outreach_email_body": "REQUIRED - Hello [FirstName],\n\n[P1: one sentence, real tension using score or pattern.]\n\n[P2: one sentence, why this is invisible to the team.]\n\n[P3: one sentence, business consequence.]\n\nWhere to know [P4: one sentence operational outcome, NO AI/dashboard/features].\n\n[P5: 15-min CTA, offer specific days].\n\nBest,\nZishuo Wang | Where to know",
  "linkedin_dm": "Under 280 chars. First name only.",
  "engagement_strategy": "DIRECT-TO-GM",
  "strategy_reason": "",
  "research_notes": "• GM: name (source)\n• Rooms: N\n• ADR: ~$X/night (source)\n• Provider: inferred from brand\n• Feedback theme: theme"
}

CRITICAL: outreach_email_subject and outreach_email_body are ALWAYS required. Never return null for these. Use Hello [FirstName] never Dear Mr/Ms. Provider: Marriott=Qualtrics, IHG=Medallia, Radisson/Anantara/NH/Peninsula/Capella=ReviewPro, Accor/Rosewood/Mandarin=TrustYou, Hyatt/Wyndham=Medallia.`;

// Stage 2 - Deep mode for demo-ready prospects
const DEEP_SYSTEM = `You are a hotel research specialist. Search for detailed information about this specific hotel and return a JSON object with these fields:
{
  "adr_usd": estimated nightly rate in USD (search Booking.com or hotel website),
  "rating": overall guest score out of 10,
  "review_count": approximate total reviews,
  "research_notes": "detailed bullet points under 500 chars total:\n• GM: confirmed name + LinkedIn\n• ADR: $X/night (Booking.com)\n• Rating: X.X/10 (N reviews)\n• Top theme 1: description\n• Top theme 2: description\n• Competitor: nearby comparable hotel\n• Provider: name"
}
Return ONLY the JSON object. No markdown.`;

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin','*');
  res.setHeader('Access-Control-Allow-Methods','POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers','Content-Type');
  if(req.method==='OPTIONS')return res.status(200).end();
  if(req.method!=='POST')return res.status(405).json({error:'Method not allowed'});

  try {
    const {city, brand, segment, count, mode, hotel_name} = req.body;

    // Stage 2: Deep research for single hotel
    if (mode === 'deep' && hotel_name) {
      const r = await fetch('https://api.anthropic.com/v1/messages', {
        method:'POST',
        headers:{'Content-Type':'application/json','x-api-key':process.env.ANTHROPIC_API_KEY,'anthropic-version':'2023-06-01','anthropic-beta':'web-search-2025-03-05'},
        body: JSON.stringify({model:'claude-haiku-4-5-20251001', max_tokens:2000, system:DEEP_SYSTEM, tools:[{type:'web_search_20250305',name:'web_search',max_uses:5}], messages:[{role:'user',content:`Research this hotel: ${hotel_name}. Find ADR, rating, review count, top feedback themes, GM LinkedIn.`}]}),
      });
      const data = await r.json();
      if(!r.ok) return res.status(500).json({error:data.error?.message||'API error'});
      const text = data.content.filter(b=>b.type==='text').map(b=>b.text).join('');
      try {
        const s=text.indexOf('{'), e=text.lastIndexOf('}');
        if(s>=0&&e>=0) return res.status(200).json({result: text.slice(s,e+1)});
      } catch(e) {}
      return res.status(200).json({result:text});
    }

    // Stage 1: Fast batch research
    const tiers={"Luxury":"luxury 5-star","Premium":"premium 4-star","Lifestyle":"lifestyle boutique","Economy":"economy 3-star","Function":"airport/convention"};
    const t=tiers[segment]||"luxury";
    const b=brand?` ${brand} brand only.`:"";
    const prompt=`List ${count} ${t} hotels in ${city}.${b} For each find: GM name, brand, parent group, room count, ADR from Booking.com, one recent feedback theme. JSON array.`;

    const r=await fetch('https://api.anthropic.com/v1/messages',{
      method:'POST',
      headers:{'Content-Type':'application/json','x-api-key':process.env.ANTHROPIC_API_KEY,'anthropic-version':'2023-06-01','anthropic-beta':'web-search-2025-03-05'},
      body:JSON.stringify({model:'claude-haiku-4-5-20251001',max_tokens:6000,system:SYSTEM,tools:[{type:'web_search_20250305',name:'web_search',max_uses:10}],messages:[{role:'user',content:prompt}]}),
    });

    const data=await r.json();
    if(!r.ok)return res.status(500).json({error:data.error?.message||'API error'});

    let text=data.content.filter(b=>b.type==='text').map(b=>b.text).join('');
    try{
      const s=text.indexOf('['),e=text.lastIndexOf(']');
      if(s>=0&&e>=0){
        const arr=JSON.parse(text.slice(s,e+1));
        text=JSON.stringify(arr.map(p=>({
          ...p,
          current_provider: p.current_provider||inferProvider(p.brand,p.hotel_name),
          hotel_group: p.hotel_group||p.brand||"Independent",
        })));
      }
    }catch(e){}

    res.status(200).json({result:text});
  }catch(err){res.status(500).json({error:err.message});}
}
