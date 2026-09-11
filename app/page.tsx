'use client';

import { FormEvent, useEffect, useState } from 'react';
import { getSupabase } from '../lib/supabase';

export default function Home() {
  const [user, setUser] = useState<any>(null);
  const [authOpen, setAuthOpen] = useState(false);
  const [email, setEmail] = useState('');
  const [authMessage, setAuthMessage] = useState('');
  const [authError, setAuthError] = useState('');
  const [caseOpen, setCaseOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [argument, setArgument] = useState('');
  const [caseError, setCaseError] = useState('');
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    const supabase = getSupabase();
    supabase.auth.getUser().then(({ data }) => setUser(data.user ?? null));
    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      if (session?.user) setAuthOpen(false);
    });
    return () => listener.subscription.unsubscribe();
  }, []);

  async function sendMagicLink(event: FormEvent) {
    event.preventDefault();
    setAuthError('');
    setAuthMessage('');
    const supabase = getSupabase();
    const { error } = await supabase.auth.signInWithOtp({ email: email.trim(), options: { emailRedirectTo: window.location.origin } });
    if (error) setAuthError(error.message);
    else setAuthMessage('Check your email for the sign in link.');
  }

  async function createCase(event: FormEvent) {
    event.preventDefault();
    setCaseError('');
    if (!user) return setAuthOpen(true);
    if (title.trim().length < 5) return setCaseError('Give the case a title of at least 5 characters.');
    if (argument.trim().length < 20) return setCaseError('Make the argument at least 20 characters so the jury has something real to judge.');
    setCreating(true);
    const supabase = getSupabase();
    const { data, error } = await supabase.rpc('create_case', { p_title: title.trim(), p_argument: argument.trim(), p_visibility: 'public' });
    setCreating(false);
    if (error) return setCaseError(error.message);
    const created = Array.isArray(data) ? data[0] : data;
    if (!created?.slug) return setCaseError('The case was not returned by the database.');
    window.location.href = `/c/${created.slug}`;
  }

  async function signOut() {
    await getSupabase().auth.signOut();
    setUser(null);
  }

  return (
    <div className="site">
      <header className="nav">
        <a className="brand" href="/">INTERNET COURT</a>
        <div className="nav-actions">
          {user ? <button className="button ghost" onClick={signOut}>Sign out</button> : <button className="button ghost" onClick={() => setAuthOpen(true)}>Sign in</button>}
          <button className="button" onClick={() => user ? setCaseOpen(true) : setAuthOpen(true)}>Start a case</button>
        </div>
      </header>
      <main id="main">
        <section className="hero"><span className="eyebrow">A public court for private arguments</span><h1>Someone is wrong. Probably you.</h1><p>Put your argument on trial. Let strangers vote. Get a verdict worth sending to the group chat.</p><div className="hero-actions"><button className="button" onClick={() => user ? setCaseOpen(true) : setAuthOpen(true)}>Start a case</button><a className="button secondary" href="#how">See how it works</a></div></section>
        <section className="reveal" aria-label="Tagline"><div className="reveal-card"><p>You make the argument. The internet makes the call.</p></div></section>
        <section className="section" id="how"><h2 className="section-title">The court is simple.</h2><div className="grid"><article className="card"><h3>Make your case</h3><p>State what happened and what you think the internet should decide.</p></article><article className="card"><h3>Call the jury</h3><p>Share the permanent case link. Real people choose for or against.</p></article><article className="card"><h3>Get the verdict</h3><p>The result comes from real votes. No seeded consensus. No fake social proof.</p></article></div></section>
        <section className="section"><h2 className="section-title">Built to be shared.</h2><div className="card"><p>Every case has a public URL designed to travel. Someone opens it, votes, argues with the verdict, and can bring their own case to court.</p></div></section>
      </main>
      <footer className="footer"><span>Internet Court</span><span><a href="/pricing">Membership</a> · Real users. Real votes. Real verdicts.</span></footer>
      {authOpen && <div className="modal-backdrop" role="presentation" onMouseDown={(e) => e.currentTarget === e.target && setAuthOpen(false)}><div className="modal" role="dialog" aria-modal="true" aria-labelledby="auth-title"><h2 id="auth-title">Enter the court</h2><p>Use a magic link. No password to remember.</p><form onSubmit={sendMagicLink}><div className="field"><label htmlFor="email">Email</label><input id="email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" /></div>{authError && <div className="error">{authError}</div>}{authMessage && <div className="success">{authMessage}</div>}<button className="button" type="submit">Email me a sign in link</button></form></div></div>}
      {caseOpen && <div className="modal-backdrop" role="presentation" onMouseDown={(e) => e.currentTarget === e.target && setCaseOpen(false)}><div className="modal" role="dialog" aria-modal="true" aria-labelledby="case-title"><h2 id="case-title">Make your case</h2><p>The jury only gets what you put here. Keep it clear, specific and human.</p><form onSubmit={createCase}><div className="field"><label htmlFor="title">Case title</label><input id="title" maxLength={160} required value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Was I wrong to leave the group chat?" /></div><div className="field"><label htmlFor="argument">Your argument</label><textarea id="argument" maxLength={5000} required value={argument} onChange={(e) => setArgument(e.target.value)} placeholder="Tell the jury what happened and what you think the verdict should be." /></div>{caseError && <div className="error">{caseError}</div>}<button className="button" disabled={creating} type="submit">{creating ? 'Opening case…' : 'Open case'}</button></form></div></div>}
    </div>
  );
}
