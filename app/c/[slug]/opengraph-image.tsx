import { ImageResponse } from 'next/og';
import { createClient } from '@supabase/supabase-js';

export const runtime = 'edge';

export default async function Image({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  if (!url || !key) return new ImageResponse(<div style={{fontSize:64}}>Internet Court</div>, { width:1200, height:630 });
  const supabase = createClient(url, key);
  const { data } = await supabase.from('cases').select('title,argument,for_votes,against_votes,status,visibility').eq('slug', slug).eq('visibility','public').neq('status','removed').maybeSingle();
  const title = data?.title ?? 'A case is waiting for the jury';
  const argument = data?.argument ?? 'Put an argument on trial. Let the internet decide.';
  const total = (data?.for_votes ?? 0) + (data?.against_votes ?? 0);
  const verdict = total === 0 ? 'No verdict yet' : data?.for_votes === data?.against_votes ? 'Too close to call' : data?.for_votes > data?.against_votes ? 'The jury sides with the argument' : 'The jury sides against the argument';
  return new ImageResponse(<div style={{background:'#0b0b0b',color:'#fff',width:'100%',height:'100%',display:'flex',flexDirection:'column',justifyContent:'space-between',padding:72,fontFamily:'sans-serif'}}><div style={{display:'flex',fontSize:28,letterSpacing:3}}>INTERNET COURT</div><div style={{display:'flex',flexDirection:'column',gap:24}}><div style={{fontSize:58,fontWeight:700,lineHeight:1.08}}>{title}</div><div style={{fontSize:28,color:'#bdbdbd',lineHeight:1.3}}>{argument.slice(0,220)}{argument.length > 220 ? '…' : ''}</div><div style={{fontSize:30}}>{verdict} · {total} {total === 1 ? 'vote' : 'votes'}</div></div><div style={{fontSize:24,color:'#888'}}>Someone is wrong. Probably you.</div></div>, { width:1200, height:630 });
}
