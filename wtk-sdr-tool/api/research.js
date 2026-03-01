const PROVIDER_MAP = {"ritz-carlton":"Qualtrics","marriott":"Qualtrics","sheraton":"Qualtrics","westin":"Qualtrics","le meridien":"Qualtrics","renaissance":"Qualtrics","autograph":"Qualtrics","moxy":"Qualtrics","aloft":"Qualtrics","courtyard":"Qualtrics","intercontinental":"Medallia","kimpton":"Medallia","six senses":"Medallia","regent":"Medallia","hotel indigo":"Medallia","crowne plaza":"Medallia","voco":"Medallia","holiday inn":"Medallia","ihg":"Medallia","park hyatt":"Medallia","andaz":"Medallia","grand hyatt":"Medallia","hyatt":"Medallia","wyndham":"Medallia","radisson":"ReviewPro","park plaza":"ReviewPro","anantara":"ReviewPro","nh ":"ReviewPro","peninsula":"ReviewPro","capella":"ReviewPro","raffles":"TrustYou","fairmont":"TrustYou","sofitel":"TrustYou","pullman":"TrustYou","novotel":"TrustYou","ibis":"TrustYou","accor":"TrustYou","rosewood":"TrustYou","mandarin oriental":"TrustYou"};

function inferProvider(b,n){const s=((b||"")+" "+(n||"")).toLowerCase();for(const[k,v]of Object.entries(PROVIDER_MAP)){if(s.includes(k))return v;}return null;}

// Stage 1: Fast Mode - minimal search, just enough to send Touch 1
const SYSTEM = `Return ONLY a raw JSON array. No markdown.

For each hotel find: name, brand, GM name, GM first name, rooms, city, country, tier, current feedback software provider, one guest feedback theme from recent reviews.

JSON structure (all fields required, use null if not found):
{"hotel_name":"","brand":"","tier":"Luxury|Premium|Lifestyle|Economy|Function","city":"","country":"","address":"","website":"","rooms":null,"restaurants":null,"adr_usd":null,"rating":null,"review_count":null,"current_provider":null,"gm_name":null,"gm_first_name":null,"gm_title":"General Manager","email":null,"linkedin":null,"phone":null,"email_source":null,"contact_confidence":"L","outreach_email_subject":"","outreach_email_body":"","linkedin_dm":"","engagement_strategy":"DIRECT-TO-GM","strategy_reason":"","research_notes":""}

EMAIL (outreach_email_body): 5 short paragraphs separated by blank lines. Hello [FirstName], (never Dear Mr/Ms). P1: tension with score or pattern. P2: hidden dynamic. P3: business consequence. P4: WhereToKnow [outcome] — no AI/features/dashboard. P5: 15-min CTA. Under 140 words.

research_notes: bullet points (• key: value format).`;

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin','*');
  res.setHeader('Access-Control-Allow-Methods','POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers','Content-Type');
  if(req.method==='OPTIONS')return res.status(200).end();
  if(req.method!=='POST')return res.status(405).json({error:'Method not allowed'});

  try {
    const {city,brand,segment,count}=req.body;
    const tiers={"Luxury":"luxury 5-star","Premium":"premium 4-star","Lifestyle":"lifestyle boutique","Economy":"economy 3-star","Function":"airport/convention"};
    const t=tiers[segment]||"luxury";
    const b=brand?` ${brand} brand only.`:"";
    const prompt=`List ${count} ${t} hotels in ${city}.${b} For each: GM name, brand, rooms, one recent guest feedback theme. JSON array only.`;

    const r=await fetch('https://api.anthropic.com/v1/messages',{
      method:'POST',
      headers:{'Content-Type':'application/json','x-api-key':process.env.ANTHROPIC_API_KEY,'anthropic-version':'2023-06-01','anthropic-beta':'web-search-2025-03-05'},
      body:JSON.stringify({model:'claude-haiku-4-5-20251001',max_tokens:6000,system:SYSTEM,tools:[{type:'web_search_20250305',name:'web_search',max_uses:8}],messages:[{role:'user',content:prompt}]}),
    });

    const data=await r.json();
    if(!r.ok)return res.status(500).json({error:data.error?.message||'API error'});

    let text=data.content.filter(b=>b.type==='text').map(b=>b.text).join('');
    try{
      const s=text.indexOf('['),e=text.lastIndexOf(']');
      if(s>=0&&e>=0){
        const arr=JSON.parse(text.slice(s,e+1));
        text=JSON.stringify(arr.map(p=>({...p,current_provider:p.current_provider||inferProvider(p.brand,p.hotel_name)})));
      }
    }catch(e){}

    res.status(200).json({result:text});
  }catch(err){res.status(500).json({error:err.message});}
}
