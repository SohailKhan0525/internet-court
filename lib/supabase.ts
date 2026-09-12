import { createBrowserClient } from '@supabase/ssr';

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

export function getSupabase() {
  if (!url || !key) throw new Error('Supabase environment variables are not configured.');
  return createBrowserClient(url, key);
}
