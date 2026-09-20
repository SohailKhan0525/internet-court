import { notFound } from 'next/navigation';
import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';

type Profile = { id: string; username: string; display_name: string; avatar_url: string | null; bio: string | null; created_at: string };
type CaseItem = { slug: string; title: string; argument: string; status: string; for_votes: number; against_votes: number; created_at: string };
type Badge = { code: string; label: string; description: string; earned: boolean };

export default async function ProfilePage({ params }: { params: Promise<{ username: string }> }) {
  const { username } = await params;
  const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!);
  const [{ data: profile }, { data: cases }, { data: badgeData }] = await Promise.all([
    supabase.rpc('get_public_profile', { p_username: username }).maybeSingle<Profile>(),
    supabase.rpc('get_public_profile_cases', { p_username: username }),
    supabase.rpc('get_profile_badges', { p_username: username }),
  ]);

  if (!profile) notFound();
  const publicCases = (cases ?? []) as CaseItem[];
  const badges = (badgeData ?? []) as Badge[];

  return (
    <main className="site">
      <header className="docket-header">
        <div className="shell">
          <a href="/" className="wordmark">INTERNET COURT<small>PUBLIC CASE DOCKET</small></a>
          <a className="btn" href="/new">File a case</a>
        </div>
      </header>
      <div className="shell section" id="main" style={{ maxWidth: 760 }}>
        <p className="kicker">@{profile.username}</p>
        <h1 className="display" style={{ fontSize: 'clamp(28px,4vw,40px)', marginTop: 8 }}>{profile.display_name}</h1>
        {profile.bio && <p className="lede" style={{ marginTop: 12 }}>{profile.bio}</p>}
        <p className="faint" style={{ marginTop: 12, fontSize: 14 }}>{publicCases.length} {publicCases.length === 1 ? 'public case' : 'public cases'}</p>

        {badges.length > 0 && (
          <div className="badge-row" aria-label="Achievements">
            {badges.map((badge) => (
              <span key={badge.code} className={`badge ${badge.earned ? 'badge-earned' : ''}`} title={badge.description}>
                {badge.earned ? '✓' : '○'} {badge.label}
              </span>
            ))}
          </div>
        )}

        <hr className="rule" style={{ margin: '32px 0' }} />

        <h2 className="section-head" style={{ fontSize: 22, marginBottom: 16 }}>Cases filed</h2>
        {publicCases.length === 0 ? (
          <div className="docket"><div className="docket-body"><p className="muted" style={{ margin: 0 }}>This profile has not published a case yet.</p></div></div>
        ) : (
          <div style={{ display: 'grid', gap: 16 }}>
            {publicCases.map((item) => (
              <a className="docket" href={`/c/${item.slug}`} key={item.slug} style={{ display: 'block' }}>
                <div className="docket-body">
                  <p className="mono" style={{ fontSize: 11, color: 'var(--ink-faint)', margin: '0 0 6px', letterSpacing: '.04em' }}>No. {item.slug}</p>
                  <h3 style={{ fontSize: 19, margin: '0 0 8px' }}>{item.title}</h3>
                  <p className="muted" style={{ fontSize: 15, lineHeight: 1.5, margin: '0 0 10px' }}>{item.argument.slice(0, 180)}{item.argument.length > 180 ? '…' : ''}</p>
                  <p className="faint" style={{ fontSize: 13, margin: 0 }}>{item.for_votes + item.against_votes} {item.for_votes + item.against_votes === 1 ? 'vote' : 'votes'}</p>
                </div>
              </a>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
