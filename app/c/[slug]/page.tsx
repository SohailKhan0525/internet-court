'use client';

import { use, useEffect, useMemo, useState } from 'react';
import { getSupabase } from '../../../lib/supabase';

type CaseRow = { id: string; slug: string; owner_id: string; title: string; argument: string; status: string; visibility: string; for_votes: number; against_votes: number; created_at: string };
type ProfileRow = { username: string; display_name: string | null };

const reasons = ['harassment', 'personal_data', 'threats', 'defamation', 'hate', 'spam', 'other'] as const;

export default function CasePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = use(params);
  const [item, setItem] = useState<CaseRow | null>(null);
  const [profile, setProfile] = useState<ProfileRow | null>(null);
  const [user, setUser] = useState<any>(null);
  const [error, setError] = useState('');
  const [voting, setVoting] = useState(false);
  const [voted, setVoted] = useState<boolean | null>(null);
  const [verdict, setVerdict] = useState('');
  const [reporting, setReporting] = useState(false);
  const [reportReason, setReportReason] = useState<(typeof reasons)[number]>('spam');
  const [reportDetails, setReportDetails] = useState('');
  const [reportStatus, setReportStatus] = useState('');

  useEffect(() => {
    const supabase = getSupabase();
    Promise.all([
      supabase.from('cases').select('id,slug,owner_id,title,argument,status,visibility,for_votes,against_votes,created_at').eq('slug', slug).maybeSingle(),
      supabase.auth.getUser(),
    ]).then(async ([caseResult, userResult]) => {
      if (caseResult.error) setError(caseResult.error.message);
      else {
        const next = caseResult.data as CaseRow | null;
        setItem(next);
        if (next) {
          const { data } = await supabase.from('profiles').select('username,display_name').eq('id', next.owner_id).maybeSingle();
          setProfile(data as ProfileRow | null);
        }
      }
      setUser(userResult.data.user ?? null);
    });
  }, [slug]);

  const total = useMemo(() => (item?.for_votes ?? 0) + (item?.against_votes ?? 0), [item]);
  const liveVerdict = useMemo(() => {
    if (!item) return '';
    if (total === 0) return 'No verdict yet.';
    if (total < 5) return 'Early verdict. The jury is still warming up.';
    if (item.for_votes === item.against_votes) return 'Too close to call.';
    return item.for_votes > item.against_votes ? 'The jury sides with you.' : 'The jury sides against you.';
  }, [item, total]);

  async function vote(choice: boolean) {
    setError('');
    if (!user) return setError('Sign in before voting.');
    if (!item) return;
    setVoting(true);
    const supabase = getSupabase();
    const { error: voteError } = await supabase.rpc('cast_vote', { p_case_id: item.id, p_choice: choice });
    if (voteError) setError(voteError.message);
    else {
      setVoted(choice);
      const { data: refreshed } = await supabase.from('cases').select('id,slug,owner_id,title,argument,status,visibility,for_votes,against_votes,created_at').eq('id', item.id).single();
      if (refreshed) setItem(refreshed as CaseRow);
      const { data: result } = await supabase.rpc('get_case_verdict', { p_for: refreshed?.for_votes ?? item.for_votes, p_against: refreshed?.against_votes ?? item.against_votes });
      if (typeof result === 'string') setVerdict(result);
    }
    setVoting(false);
  }

  async function share() {
    const url = window.location.href;
    if (navigator.share) await navigator.share({ title: item?.title ?? 'Internet Court case', url });
    else await navigator.clipboard.writeText(url);
  }

  async function submitReport() {
    setReportStatus('');
    if (!user) return setReportStatus('Sign in before reporting a case.');
    if (!item) return;
    setReporting(true);
    const supabase = getSupabase();
    const { error: reportError } = await supabase.from('reports').insert({ case_id: item.id, reporter_id: user.id, reason: reportReason, details: reportDetails.trim() || null });
    if (reportError) setReportStatus(reportError.message);
    else { setReportStatus('Report submitted.'); setReportDetails(''); }
    setReporting(false);
  }

  if (error && !item) return <main className="hero"><p className="error">{error}</p></main>;
  if (!item) return <main className="hero"><p>Loading the case…</p></main>;
  if (item.status === 'removed') return <main className="hero"><h1>Case unavailable.</h1><p>This case is no longer public.</p></main>;

  return <main className="site"><header className="nav"><a className="brand" href="/">INTERNET COURT</a><a className="button ghost" href="/">Start your own case</a></header><section className="section"><span className="eyebrow">CASE {item.slug}</span><h1 className="section-title">{item.title}</h1>{profile?.username && <p>Filed by <a href={`/u/${profile.username}`}>{profile.display_name || profile.username}</a></p>}<div className="card"><p style={{ whiteSpace: 'pre-wrap', color: '#f5f5f5' }}>{item.argument}</p></div><div className="grid" style={{ marginTop: 16 }}><button className="button" disabled={voting || voted !== null} onClick={() => vote(true)}>I agree</button><button className="button secondary" disabled={voting || voted !== null} onClick={() => vote(false)}>I disagree</button></div>{error && <p className="error">{error}</p>}<div className="card" style={{ marginTop: 32 }}><h2>{verdict || liveVerdict}</h2><p>{total} {total === 1 ? 'vote' : 'votes'} · {item.for_votes} for · {item.against_votes} against</p>{voted !== null && <p className="success">Your vote is recorded.</p>}<button className="button ghost" onClick={share}>Share this case</button></div><details style={{ marginTop: 32 }}><summary>Report this case</summary><div className="card" style={{ marginTop: 16 }}><label>Reason<select value={reportReason} onChange={(e) => setReportReason(e.target.value as (typeof reasons)[number])}>{reasons.map((reason) => <option key={reason} value={reason}>{reason.replace('_', ' ')}</option>)}</select></label><label style={{ display: 'block', marginTop: 16 }}>Details<textarea value={reportDetails} maxLength={2000} onChange={(e) => setReportDetails(e.target.value)} /></label><button className="button secondary" disabled={reporting} onClick={submitReport}>{reporting ? 'Submitting…' : 'Submit report'}</button>{reportStatus && <p>{reportStatus}</p>}</div></details></section></main>;
}
