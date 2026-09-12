import { NextResponse } from 'next/server';
import { createClient } from '../../../lib/supabase/server';

export async function GET(request: Request) {
  const url = new URL(request.url);
  const code = url.searchParams.get('code');
  const next = url.searchParams.get('next');
  const safeNext = next && next.startsWith('/') && !next.startsWith('//') ? next : '/';

  if (!code) return NextResponse.redirect(new URL('/auth/auth-code-error', request.url));

  const supabase = await createClient();
  const { error } = await supabase.auth.exchangeCodeForSession(code);

  if (error) return NextResponse.redirect(new URL('/auth/auth-code-error', request.url));

  const origin = process.env.NEXT_PUBLIC_SITE_URL || url.origin;
  return NextResponse.redirect(`${origin}${safeNext}`);
}
