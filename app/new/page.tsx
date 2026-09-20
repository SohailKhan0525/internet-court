'use client';

import { useEffect, useState } from 'react';
import { getSupabase } from '../../lib/supabase';
import { invokeEdgeFunction } from '../../lib/functions';
import { useToast } from '../components/Toast';

export default function NewCasePage() {
  const { showToast } = useToast();
  const [checkingAuth, setCheckingAuth] = useState(true);
  const [title, setTitle] = useState('');
  const [argument, setArgument] = useState('');
  const [error, setError] = useState('');
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    getSupabase().auth.getUser().then(({ data }) => {
      if (!data.user) {
        window.location.href = '/signin?next=/new';
        return;
      }
      setCheckingAuth(false);
    });
  }, []);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setError('');
    if (title.trim().length < 8) return setError('Give the case a real title — at least 8 characters.');
    if (argument.trim().length < 40) return setError('Lay out the actual argument — at least 40 characters.');
    setCreating(true);
    const { data, error: invokeError } = await invokeEdgeFunction<{ case: unknown }>('create-case', {
      title: title.trim(), argument: argument.trim(), visibility: 'public',
    });
    setCreating(false);
    if (invokeError) {
      showToast(invokeError, 'error');
      return setError(invokeError);
    }
    const created = Array.isArray(data?.case) ? data.case[0] : data?.case;
    const slug = (created as { slug?: string } | null)?.slug;
    if (!slug) return setError('The case was not returned by the server.');
    window.location.href = `/c/${slug}`;
  }

  if (checkingAuth) return null;

  return (
    <main className="site">
      <header className="docket-header">
        <div className="shell">
          <a href="/" className="wordmark">INTERNET COURT<small>PUBLIC CASE DOCKET</small></a>
          <a href="/" className="header-link">Cancel</a>
        </div>
      </header>
      <div className="shell section" id="main" style={{ maxWidth: 640 }}>
        <span className="kicker">New filing</span>
        <h1 className="display" style={{ fontSize: 'clamp(30px,4vw,40px)', margin: '10px 0 8px' }}>State your case.</h1>
        <p className="lede" style={{ marginBottom: 32 }}>Write it the way you'd actually explain it to a stranger. The jury only sees what you put here.</p>
        <form onSubmit={submit}>
          <div className="field">
            <label htmlFor="case-title">Case title</label>
            <input id="case-title" required maxLength={140} value={title} onChange={(event) => setTitle(event.target.value)} placeholder="Was I wrong to eat the last slice?" />
          </div>
          <div className="field">
            <label htmlFor="case-argument">Your argument</label>
            <textarea id="case-argument" required maxLength={4000} value={argument} onChange={(event) => setArgument(event.target.value)} placeholder="Lay out what happened and why you think you're right." />
            <p className="field-hint">{argument.length}/4000</p>
          </div>
          {error && <p className="error-text" role="alert">{error}</p>}
          <button className="btn" type="submit" disabled={creating}>{creating ? 'Filing…' : 'File the case'}</button>
        </form>
      </div>
    </main>
  );
}
