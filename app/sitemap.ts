import type { MetadataRoute } from 'next';
import { createClient } from '@supabase/supabase-js';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = process.env.NEXT_PUBLIC_SITE_URL;
  if (!base) return [];
  const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!);
  const { data } = await supabase.from('cases').select('slug,updated_at').eq('status','open').eq('visibility','public').order('updated_at',{ascending:false});
  return [
    { url: base, changeFrequency: 'daily', priority: 1 },
    { url: `${base}/pricing`, changeFrequency: 'weekly', priority: 0.7 },
    ...(data ?? []).map((item) => ({ url: `${base}/c/${item.slug}`, lastModified: item.updated_at, changeFrequency: 'hourly' as const, priority: 0.8 })),
  ];
}
