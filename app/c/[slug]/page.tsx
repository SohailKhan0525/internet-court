'use client';

import { FormEvent, use, useEffect, useMemo, useState } from 'react';
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
  const [authOpen, setAuthOpen] = useState(false);
  const [email, setEmail] = useState('');
  const [authMessage, setAuthMessage] = useState('');
  const [authError, setAuthError] = useState('');
  const [pendingVote, setPendingVote] = useState<boolean | null>(null);

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

    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      if (session?.user) setAuthOpen(false);
    });
    return () => listener.subscription.unsubscribe();
  }, [slug]);

  useEffect(() => {
    if (user && pendingVote !== null && item && !voting) {
      const choice = pendingVote;
      setPendingVote(null);
      void submitVote(choice);
    }
  }, [user, pendingVote, item, voting]);

  const total = useMemo(() => (item?.for_votes ?? 0) + (item?.against_votes ?? 0), [item]);
  const liveVerdict = useMemo(() => {
    if (!item) return '';
    if (total === 0) return 'No verdict yet.';
    if (total < 5) return 'Early verdict. The jury is still warming up.';
    if (item.for_votes === item.against_votes) return 'Too close to call.';
    return item.for_votes > item.against_votes ? 'The jury sides with you.' : 'The jury sides against you.';
  }, [item, total]);

  async function sendMagicLink(event: FormEvent) {
    event.preventDefault();
    setAuthError('');
    setAuthMessage('');
    const supabase = getSupabase();
    const { error: signInError } = await supabase.auth.signInWithOtp({
      email: email.trim(),
      options: { emailRedirectTo: window.location.href },
    });
    if (signInError) setAuthError(signInError.message);
    else setAuthMessage('Check your email for the sign in link. You will return to this case.');
  }

  async function submitVote(choice: boolean) {
    if (!item) return;
    setError('');
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

  function vote(choice: boolean) {
    setError('');
    if (!user) {
      setPendingVote(choice);
      setAuthError('');
      setAuthMessage('');
      setAuthOpen(true);
      return;
    }
    void submitVote(choice);
  }

  async function share() {
    const url = window.location.href;
    try {
      if (navigator.share) await navigator.share({ title: item?.title ?? 'Internet Court case', url });
      else await navigator.clipboard.writeText(url);
    } catch (shareError) {
      if (shareError instanceof DOMException && shareError.name === 'AbortError') return;
      setError('We could not share this case. Please copy the URL from your browser.');
    }
  }

  async function submitReport() {
    setReportStatus('');
    if (!user) {
      setAuthOpen(true);
      setReportStatus('Sign in to report a case.');
      return;
    }
    if (!item) return;
    setReporting(true);
    const supabase = getSupabase();
    const { error: reportError } = await supabase.rpc('submit_report', {
      p_case_id: item.id,
      p_reason: reportReason,
      p_details: reportDetails.trim() || null,
    });
    if (reportError) setReportStatus(reportError.message);
    else { setReportStatus('Report submitted.'); setReportDetails(''); }
    setReporting(false);
  }

  if (error && !item) return <main className="hero"><p className="error">{error}</p></main>;
  if (!item) return <main className="hero"><p>Loading the case…</p></main>;
  if (item.status === 'removed') return <main className="hero"><h1>Case unavailable.</h1><p>This case is no longer public.</p></main>;

  return (
    <main className="site">
      <header className="nav">
        <a className="brand" href="/">INTERNET COURT</a>
        <div className="nav-actions">
          {!user && <button className="button ghost" onClick={() => setAuthOpen(true)}>Sign in</button>}
          <a className="button ghost" href="/">Start your own case</a>
        </div>
      </header>
      <section className="section">
        <span className="eyebrow">CASE {item.slug}</span>
        <h1 className="section-title">{item.title}</h1>
        {profile?.username && <p>Filed by {profile.display_name || profile.username}</p>}
        <article className="card case-argument"><p>{item.argument}</p></article>
        <div className="grid vote-grid">
          <button className="button" disabled={voting || voted !== null} onClick={() => vote(true)}>I agree</button>
          <button className="button secondary" disabled={voting || voted !== null} onClick={() => vote(false)}>I disagree</button>
        </div>
        {!user && <p className="muted">Sign in is required to cast a vote. Your vote is counted once.</p>}
        {error && <p className="error" role="alert">{error}</p>}
        <article className="card verdict-card">
          <span className="eyebrow">THE VERDICT</span>
          <h2>{verdict || liveVerdict}</h2>
          <p>{total} {total === 1 ? 'vote' : 'votes'} · {item.for_votes} for · {item.against_votes} against</p>
          {voted !== null && <p className="success">Your vote is recorded.</p>}
          <button className="button ghost" onClick={share}>Share this case</button>
        </article>
        <details className="report-panel">
          <summary>Report this case</summary>
          <div className="card report-card">
            <label>Reason<select value={reportReason} onChange={(e) => setReportReason(e.target.value as (typeof reasons)[number])}>{reasons.map((reason) => <option key={reason} value={reason}>{reason.replace('_', ' ')}</option>)}</select></label>
            <label className="report-details">Details<textarea value={reportDetails} maxLength={2000} onChange={(e) => setReportDetails(e.target.value)} /></label>
            <button className="button secondary" disabled={reporting} onClick={submitReport}>{reporting ? 'Submitting…' : 'Submit report'}</button>
            {reportStatus && <p>{reportStatus}</p>}
          </div>
        </details>
      </section>
      {authOpen && (
        <div className="modal-backdrop" role="presentation" onMouseDown={(e) => e.currentTarget === e.target && setAuthOpen(false)}>
          <div className="modal" role="dialog" aria-modal="true" aria-labelledby="case-auth-title">
            <button className="modal-close" aria-label="Close sign in" onClick={() => setAuthOpen(false)}>×</button>
            <h2 id="case-auth-title">Enter the court</h2>
            <p>Sign in with a magic link. We will bring you back to this case.</p>
            <form onSubmit={sendMagicLink}>
              <div className="field"><label htmlFor="case-email">Email</label><input id="case-email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" /></div>
              {authError && <div className="error" role="alert">{authError}</div>}
              {authMessage && <div className="success">{authMessage}</div>}
              <button className="button" type="submit">Email me a sign in link</button>
            </form>
          </div>
        </div>
      )}
    </main>
  );
}
