import { notFound } from 'next/navigation';
import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';

type Profile = { id: string; username: string; display_name: string; avatar_url: string | null; bio: string | null; created_at: string };
type CaseItem = { slug: string; title: string; argument: string; status: string; for_votes: number; against_votes: number; created_at: string };

export default async function ProfilePage({ params }: { params: Promise<{ username: string }> }) {
  const { username } = await params;
  const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!);
  const [{ data: profile }, { data: cases }] = await Promise.all([
    supabase.rpc('get_public_profile', { p_username: username }).maybeSingle<Profile>(),
    supabase.rpc('get_public_profile_cases', { p_username: username }),
  ]);

  if (!profile) notFound();
  const publicCases = (cases ?? []) as CaseItem[];

  return (
    <main className="site">
      <header className="nav"><a className="brand" href="/">INTERNET COURT<span className="case-tagline">A public court for real arguments</span></a><a className="button ghost" href="/">Start a case</a></header>
      <section className="section section-shell">
        <div className="card">
          <p className="eyebrow">@{profile.username}</p>
          <h1 className="section-title">{profile.display_name}</h1>
          {profile.bio && <p>{profile.bio}</p>}
          <p>{publicCases.length} {publicCases.length === 1 ? 'public case' : 'public cases'}</p>
        </div>
        <div className="mt-8">
          <h2>Cases filed</h2>
          {publicCases.length === 0 ? (
            <div className="card"><p>This profile has not published a case yet.</p></div>
          ) : (
            <div className="grid">
              {publicCases.map((item) => (
                <a className="card" href={`/c/${item.slug}`} key={item.slug}>
                  <p className="eyebrow">{item.status}</p>
                  <h3>{item.title}</h3>
                  <p>{item.argument.slice(0, 180)}{item.argument.length > 180 ? '…' : ''}</p>
                  <p>{item.for_votes + item.against_votes} {item.for_votes + item.against_votes === 1 ? 'vote' : 'votes'}</p>
                </a>
              ))}
            </div>
          )}
        </div>
      </section>
    </main>
  );
}
