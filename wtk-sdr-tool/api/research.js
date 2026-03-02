const PROVIDER_MAP = {"ritz-carlton":"Qualtrics","marriott":"Qualtrics","sheraton":"Qualtrics","westin":"Qualtrics","le meridien":"Qualtrics","renaissance":"Qualtrics","autograph":"Qualtrics","moxy":"Qualtrics","aloft":"Qualtrics","intercontinental":"Medallia","kimpton":"Medallia","six senses":"Medallia","regent":"Medallia","hotel indigo":"Medallia","crowne plaza":"Medallia","voco":"Medallia","ihg":"Medallia","park hyatt":"Medallia","andaz":"Medallia","grand hyatt":"Medallia","hyatt":"Medallia","wyndham":"Medallia","radisson":"ReviewPro","park plaza":"ReviewPro","anantara":"ReviewPro","peninsula":"ReviewPro","capella":"ReviewPro","raffles":"TrustYou","fairmont":"TrustYou","sofitel":"TrustYou","accor":"TrustYou","rosewood":"TrustYou","mandarin oriental":"TrustYou"};
function inferProvider(b,n){const s=((b||"")+" "+(n||"")).toLowerCase();for(const[k,v]of Object.entries(PROVIDER_MAP)){if(s.includes(k))return v;}return null;}

const SYSTEM=`Return ONLY a raw JSON array. No markdown.
Each hotel:{"hotel_name":"","brand":"brand only e.g. Kimpton","hotel_group":"parent group e.g. IHG or Independent","tier":"Luxury|Premium|Lifestyle|Economy|Function","city":"","country":"","address":"","website":"","rooms":null,"restaurants":null,"adr_usd":null,"rating":null,"review_count":null,"current_provider":null,"gm_name":null,"gm_first_name":null,"gm_title":"General Manager","email":null,"linkedin":null,"phone":null,"email_source":null,"contact_confidence":"L","outreach_email_subject":"REQUIRED - specific tension hook, no generic titles","outreach_email_body":"REQUIRED. Write naturally, NO [P1][P2] labels, NO placeholders. Structure:\n1. Hello [FirstName],\n2. One specific tension sentence from recent reviews (cite platform + timeframe).\n3. One sentence: why this pattern stays invisible to the management team.\n4. One sentence: business consequence (occupancy, loyalty, reputation).\n5. If provider known: 'We know you have [Provider] — Where to know works alongside it, adding [specific gap Provider does not cover: competitor benchmarking / real-time theme alerts / solution mapping]. Most of our clients use both.' If provider unknown: skip this.\n6. One sentence outcome Where to know delivers (no AI/tech/dashboard language).\n7. CTA: specific days for 15-min call.\n8. Best,\\nZishuo Wang | Where to know","linkedin_dm":"<280 chars, first name only","engagement_strategy":"DIRECT-TO-GM","strategy_reason":"","research_notes":"• GM: name\\n• ADR: $X\\n• Provider: X\\n• Theme: X"}
Our provider map (use to infer current_provider): Marriott brands=Qualtrics, IHG brands(InterContinental/Kimpton/Hotel Indigo/Six Senses/Regent/Crowne Plaza/voco/Holiday Inn/EVEN/Staybridge/Candlewood)=Medallia, Hyatt/Wyndham=Medallia, Radisson/NH/Park Plaza/Anantara/Peninsula/Capella=ReviewPro, Accor/Rosewood/Mandarin Oriental=TrustYou.
outreach_email_subject and outreach_email_body are REQUIRED always. Never use placeholder labels like [P1] in the final email.`;

const DEEP_SYSTEM=`Search for this hotel. Return ONLY JSON: {"adr_usd":null,"rating":null,"review_count":null,"research_notes":"• GM: name+LinkedIn\n• ADR: $X (Booking.com)\n• Rating: X/10 (N reviews)\n• Theme 1: X\n• Theme 2: X\n• Provider: X"}`;

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
    const r=await fetch('https://api.anthropic.com/v1/messages',{method:'POST',headers:{'Content-Type':'application/json','x-api-key':process.env.ANTHROPIC_API_KEY,'anthropic-version':'2023-06-01','anthropic-beta':'web-search-2025-03-05'},body:JSON.stringify({model:'claude-haiku-4-5-20251001',max_tokens:4000,system:SYSTEM,tools:[{type:'web_search_20250305',name:'web_search',max_uses:6}],messages:[{role:'user',content:prompt}]})});
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
