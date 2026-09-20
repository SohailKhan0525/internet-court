'use client';

import { use, useEffect, useMemo, useState } from 'react';
import { getSupabase } from '../../../lib/supabase';
import { useToast } from '../../components/Toast';
import DocketHeader from '../../components/DocketHeader';

type CaseRow = { id: string; slug: string; owner_id: string; title: string; argument: string; status: string; visibility: string; for_votes: number; against_votes: number; created_at: string };
type ProfileRow = { username: string; display_name: string | null };

const reasons = ['harassment', 'personal_data', 'threats', 'defamation', 'hate', 'spam', 'other'] as const;

export default function CasePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = use(params);
  const { showToast } = useToast();
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

    if (typeof window !== 'undefined' && new URLSearchParams(window.location.search).get('filed') === '1') {
      showToast('Case filed. Share it to get real votes.', 'success');
      window.history.replaceState({}, '', window.location.pathname);
    }
  }, [slug]);

  const total = useMemo(() => (item?.for_votes ?? 0) + (item?.against_votes ?? 0), [item]);
  const forPct = total > 0 ? Math.round(((item?.for_votes ?? 0) / total) * 100) : 50;
  const liveVerdict = useMemo(() => {
    if (!item) return '';
    if (total === 0) return 'No verdict yet.';
    if (total < 5) return 'Early verdict. The jury is still warming up.';
    if (item.for_votes === item.against_votes) return 'Too close to call.';
    return item.for_votes > item.against_votes ? 'The jury sides with you.' : 'The jury sides against you.';
  }, [item, total]);

  async function submitVote(choice: boolean) {
    if (!item) return;
    setError('');
    setVoting(true);
    const supabase = getSupabase();
    const { error: voteError } = await supabase.rpc('cast_vote', { p_case_id: item.id, p_choice: choice });
    if (voteError) {
      setError(voteError.message);
      showToast(voteError.message, 'error');
    } else {
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
      window.location.href = `/signin?next=${encodeURIComponent(`/c/${slug}`)}`;
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
      showToast('We could not share this case. Please copy the URL from your browser.', 'error');
    }
  }

  async function submitReport() {
    setReportStatus('');
    if (!user) {
      window.location.href = `/signin?next=${encodeURIComponent(`/c/${slug}`)}`;
      return;
    }
    if (!item) return;
    setReporting(true);
    const { error: reportError } = await getSupabase().rpc('submit_report', { p_case_id: item.id, p_reason: reportReason, p_details: reportDetails.trim() || null });
    if (reportError) {
      setReportStatus(reportError.message);
      showToast(reportError.message, 'error');
    } else { setReportStatus('Report submitted.'); setReportDetails(''); showToast('Report submitted. A moderator will review it.', 'success'); }
    setReporting(false);
  }

  if (error && !item) return <main className="site"><div className="shell section"><p className="error-text">{error}</p></div></main>;
  if (!item) return <main className="site"><div className="shell section"><p className="muted">Loading the case…</p></div></main>;
  if (item.status === 'removed') return <main className="site"><div className="shell section"><h1 className="display" style={{ fontSize: 32 }}>Case unavailable.</h1><p className="muted">This case is no longer public.</p></div></main>;

  return (
    <main className="site">
      <DocketHeader user={user} currentPath={`/c/${slug}`} />
      <div className="shell section" style={{ maxWidth: 720 }}>
        <p className="kicker">Case No. {item.slug}</p>
        <h1 className="display" style={{ fontSize: 'clamp(28px,4vw,40px)', marginTop: 8 }}>{item.title}</h1>
        {profile?.username && <p className="muted" style={{ marginTop: 8 }}>Filed by {profile.display_name || profile.username}</p>}

        <div className="docket" style={{ marginTop: 24 }}>
          <div className="docket-body"><p style={{ margin: 0, fontSize: 17, lineHeight: 1.6, whiteSpace: 'pre-wrap' }}>{item.argument}</p></div>
        </div>

        <p className="muted" style={{ marginTop: 20, fontSize: 14 }}>Read the argument above, then pick a side. The verdict below is just the real vote count — no hidden algorithm, no fake votes.</p>

        <div style={{ display: 'flex', gap: 12, marginTop: 16 }}>
          <button className="btn" disabled={voting || voted !== null} onClick={() => vote(true)}>I agree</button>
          <button className="btn btn-outline" disabled={voting || voted !== null} onClick={() => vote(false)}>I disagree</button>
        </div>
        {!user && <p className="faint" style={{ fontSize: 13, marginTop: 8 }}>Sign in is required to cast a vote. Your vote is counted once.</p>}
        {error && <p className="error-text" role="alert">{error}</p>}

        <div className="docket" style={{ marginTop: 32 }}>
          <span className="docket-tab">The verdict</span>
          <div className="docket-body">
            <h2 style={{ fontFamily: 'var(--font-fraunces)', fontSize: 24, margin: '0 0 12px' }}>{verdict || liveVerdict}</h2>
            {total > 0 && (
              <>
                <div className="vote-bar"><div className="vote-bar-for" style={{ width: `${forPct}%` }} /><div className="vote-bar-against" style={{ width: `${100 - forPct}%` }} /></div>
                <div className="vote-meta"><span>FOR · {item.for_votes}</span><span>AGAINST · {item.against_votes}</span></div>
              </>
            )}
            {voted !== null && <p className="success-text">Your vote is recorded.</p>}
            <div style={{ display: 'flex', gap: 10, marginTop: 16, flexWrap: 'wrap' }}>
              <button className="btn-outline btn" onClick={share}>Share this case</button>
              <a
                className="btn-outline btn"
                href={`https://x.com/intent/post?text=${encodeURIComponent(`"${item.title}" — vote on it at Internet Court`)}&url=${encodeURIComponent(typeof window !== 'undefined' ? window.location.href : '')}`}
                target="_blank"
                rel="noopener noreferrer"
              >
                Share on X
              </a>
            </div>
          </div>
        </div>

        <details style={{ marginTop: 32 }}>
          <summary style={{ cursor: 'pointer', fontWeight: 600, fontSize: 14 }}>Report this case</summary>
          <div className="docket" style={{ marginTop: 12 }}>
            <div className="docket-body">
              <div className="field">
                <label htmlFor="report-reason">Reason</label>
                <select id="report-reason" value={reportReason} onChange={(event) => setReportReason(event.target.value as (typeof reasons)[number])}>
                  {reasons.map((reason) => <option key={reason} value={reason}>{reason.replace('_', ' ')}</option>)}
                </select>
              </div>
              <div className="field">
                <label htmlFor="report-details">Details</label>
                <textarea id="report-details" value={reportDetails} maxLength={2000} onChange={(event) => setReportDetails(event.target.value)} />
              </div>
              <button className="btn btn-outline" disabled={reporting} onClick={submitReport}>{reporting ? 'Submitting…' : 'Submit report'}</button>
              {reportStatus && <p className="muted" style={{ marginTop: 8 }}>{reportStatus}</p>}
            </div>
          </div>
        </details>
      </div>
    </main>
  );
}
