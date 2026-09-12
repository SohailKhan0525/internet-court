'use client';

import { FormEvent, useCallback, useEffect, useRef, useState } from 'react';
import { getSupabase } from '../lib/supabase';
import Turnstile from './components/Turnstile';

const taglineWords = ['You', 'make', 'the', 'argument.', 'The', 'internet', 'makes', 'the', 'call.'];

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
  const [turnstileToken, setTurnstileToken] = useState('');
  const taglineRef = useRef<HTMLDivElement>(null);
  const [taglineVisible, setTaglineVisible] = useState(false);

  useEffect(() => {
    const supabase = getSupabase();
    supabase.auth.getUser().then(({ data }) => setUser(data.user ?? null));
    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      if (session?.user) setAuthOpen(false);
    });
    return () => listener.subscription.unsubscribe();
  }, []);

  useEffect(() => {
    const element = taglineRef.current;
    if (!element) return;
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        setTaglineVisible(true);
        observer.disconnect();
      }
    }, { threshold: 0.35 });
    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('auth') === 'error') setAuthError('That sign in link could not be completed. Please request a new one.');
  }, []);

  const handleTurnstileToken = useCallback((token: string) => {
    setTurnstileToken(token);
    if (!token) setCaseError('Security verification expired. Please complete it again.');
  }, []);

  const handleTurnstileError = useCallback(() => {
    setTurnstileToken('');
    setCaseError('Security verification could not be completed. Please try again.');
  }, []);

  async function sendMagicLink(event: FormEvent) {
    event.preventDefault();
    setAuthError('');
    setAuthMessage('');
    const supabase = getSupabase();
    const { error } = await supabase.auth.signInWithOtp({
      email: email.trim(),
      options: { emailRedirectTo: `${window.location.origin}/auth/callback` },
    });
    if (error) setAuthError(error.message);
    else setAuthMessage('Check your email for the sign in link.');
  }

  async function createCase(event: FormEvent) {
    event.preventDefault();
    setCaseError('');
    if (!user) return setAuthOpen(true);
    if (title.trim().length < 5) return setCaseError('Give the case a title of at least 5 characters.');
    if (argument.trim().length < 20) return setCaseError('Make the argument at least 20 characters so the jury has something real to judge.');
    if (!turnstileToken) return setCaseError('Complete the security verification before opening your case.');
    setCreating(true);
    const supabase = getSupabase();
    const { data, error } = await supabase.functions.invoke('create-case', {
      body: { title: title.trim(), argument: argument.trim(), visibility: 'public', turnstile_token: turnstileToken },
    });
    setCreating(false);
    if (error) return setCaseError(error.message);
    const created = Array.isArray(data?.case) ? data.case[0] : data?.case;
    if (!created?.slug) return setCaseError('The case was not returned by the server.');
    window.location.href = `/c/${created.slug}`;
  }

  async function signOut() {
    await getSupabase().auth.signOut();
    setUser(null);
  }

  return (
    <div className="site">
      <header className="nav">
        <a className="brand" href="/" aria-label="Internet Court home">INTERNET COURT</a>
        <nav className="nav-actions" aria-label="Primary navigation">
          <a className="nav-link" href="#how">How it works</a>
          <a className="nav-link" href="/pricing">Membership</a>
          {user ? <button className="button ghost" onClick={signOut}>Sign out</button> : <button className="button ghost" onClick={() => setAuthOpen(true)}>Sign in</button>}
          <button className="button" onClick={() => user ? setCaseOpen(true) : setAuthOpen(true)}>Start a case</button>
        </nav>
      </header>

      <main id="main">
        <section className="hero section-shell">
          <div className="hero-copy">
            <span className="eyebrow">A public court for private arguments</span>
            <h1>Someone is wrong.<br />Probably you.</h1>
            <p>Put your argument on trial. Let strangers vote. Get a verdict worth sending to the group chat.</p>
            <div className="hero-actions">
              <button className="button" onClick={() => user ? setCaseOpen(true) : setAuthOpen(true)}>Start a case</button>
              <a className="button secondary" href="#how">See how it works</a>
            </div>
            <p className="proof-line">Real votes. Permanent case links. No fake consensus.</p>
          </div>

          <div className="hero-visual" aria-label="Internet Court product preview">
            <div className="court-window">
              <div className="window-bar"><span>INTERNET COURT</span><span>CASE RECORD</span></div>
              <div className="court-content">
                <span className="mini-label">YOUR ARGUMENT</span>
                <div className="preview-lines"><span /><span /><span className="short" /></div>
                <div className="preview-votes">
                  <div><span className="mini-label">FOR</span><strong>Vote</strong></div>
                  <div><span className="mini-label">AGAINST</span><strong>Vote</strong></div>
                </div>
                <div className="preview-verdict"><span className="mini-label">THE VERDICT</span><strong>Let the jury decide.</strong></div>
              </div>
            </div>
          </div>
        </section>

        <section className="reveal section-shell" aria-label="Tagline reveal">
          <div ref={taglineRef} className="reveal-card">
            <p className="tagline-reveal">
              {taglineWords.map((word, index) => (
                <span className={taglineVisible ? 'tagline-word is-active' : 'tagline-word'} style={{ transitionDelay: `${index * 70}ms` }} key={`${word}-${index}`}>
                  {word}{index < taglineWords.length - 1 ? ' ' : ''}
                </span>
              ))}
            </p>
          </div>
        </section>

        <section className="section section-shell" id="how">
          <div className="section-heading">
            <span className="eyebrow">How it works</span>
            <h2 className="section-title">The court is simple.</h2>
            <p>One clear argument. One shareable case. A verdict made from the people who actually showed up.</p>
          </div>
          <div className="grid">
            <article className="card"><span className="step">01</span><h3>Make your case</h3><p>State what happened and what you think the internet should decide.</p></article>
            <article className="card"><span className="step">02</span><h3>Call the jury</h3><p>Share the permanent case link. Real people choose for or against.</p></article>
            <article className="card"><span className="step">03</span><h3>Get the verdict</h3><p>The result comes from votes stored by the court. Nothing is seeded.</p></article>
          </div>
        </section>

        <section className="section section-shell">
          <div className="section-heading">
            <span className="eyebrow">Why it spreads</span>
            <h2 className="section-title">Every argument becomes a thing worth sharing.</h2>
          </div>
          <div className="grid benefits-grid">
            <article className="card"><h3>One permanent link</h3><p>Send one case URL anywhere. People can open it, judge it and pass it on.</p></article>
            <article className="card"><h3>A real verdict</h3><p>The verdict is calculated from actual votes stored by the court.</p></article>
            <article className="card"><h3>A reason to return</h3><p>After judging one argument, anyone can bring their own question to the court.</p></article>
          </div>
        </section>

        <section className="section section-shell membership-panel">
          <div className="section-heading">
            <span className="eyebrow">Membership</span>
            <h2 className="section-title">Keep the jury free. Pay for more control.</h2>
            <p>Free users can create public cases and vote. Membership adds private and unlisted cases and membership identity.</p>
          </div>
          <a className="button" href="/pricing">See membership</a>
        </section>

        <section className="section section-shell">
          <div className="section-heading">
            <span className="eyebrow">The rules</span>
            <h2 className="section-title">A court needs boundaries.</h2>
          </div>
          <div className="grid">
            <article className="card"><h3>Vote once</h3><p>Authenticated voting and server side checks keep the result tied to real accounts.</p></article>
            <article className="card"><h3>Report abuse</h3><p>Cases can be reported for harassment, threats, personal data, hate, spam and other abuse.</p></article>
            <article className="card"><h3>No fake proof</h3><p>We do not manufacture votes, users, testimonials or popularity claims.</p></article>
          </div>
        </section>

        <section className="section section-shell">
          <div className="section-heading">
            <span className="eyebrow">FAQ</span>
            <h2 className="section-title">Questions people actually ask.</h2>
          </div>
          <div className="faq">
            <details className="card"><summary>Can anyone read a public case?</summary><p>Yes. Public cases are designed to be opened and shared by anyone. You only need to sign in when you want to vote or create a case.</p></details>
            <details className="card"><summary>How is the verdict decided?</summary><p>The verdict is based on the stored for and against vote totals. There is no hidden consensus score.</p></details>
            <details className="card"><summary>Do I need a password?</summary><p>No. Internet Court uses a magic link so you can sign in without remembering another password.</p></details>
            <details className="card"><summary>Can I report a case?</summary><p>Yes. Every public case has a reporting path for abuse such as harassment, threats, personal data, hate and spam.</p></details>
            <details className="card"><summary>Is starting a case free?</summary><p>Public cases are free to start. Membership is for people who want more control over their cases and identity.</p></details>
            <details className="card"><summary>Does Internet Court use fake votes?</summary><p>No. The product is built around real authenticated votes and server side checks.</p></details>
          </div>
        </section>

        <section className="section section-shell final-cta">
          <div>
            <span className="eyebrow">Ready for judgment</span>
            <h2 className="section-title">Bring your argument to court.</h2>
            <p>Make the claim. Share the link. Find out what the jury thinks.</p>
          </div>
          <button className="button" onClick={() => user ? setCaseOpen(true) : setAuthOpen(true)}>Start a case</button>
        </section>
      </main>

      <footer className="footer section-shell">
        <span>Internet Court</span>
        <span><a href="/pricing">Membership</a><span className="footer-dot">·</span><a href="/privacy">Privacy</a><span className="footer-dot">·</span><a href="/terms">Terms</a></span>
      </footer>

      {authOpen && (
        <div className="modal-backdrop" role="presentation" onMouseDown={(e) => e.currentTarget === e.target && setAuthOpen(false)}>
          <div className="modal" role="dialog" aria-modal="true" aria-labelledby="auth-title">
            <button className="modal-close" aria-label="Close sign in" onClick={() => setAuthOpen(false)}>Close</button>
            <h2 id="auth-title">Enter the court</h2>
            <p>Use a magic link. No password to remember.</p>
            <form onSubmit={sendMagicLink}>
              <div className="field"><label htmlFor="email">Email</label><input id="email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" /></div>
              {authError && <div className="error" role="alert">{authError}</div>}
              {authMessage && <div className="success">{authMessage}</div>}
              <button className="button" type="submit">Email me a sign in link</button>
            </form>
          </div>
        </div>
      )}

      {caseOpen && (
        <div className="modal-backdrop" role="presentation" onMouseDown={(e) => e.currentTarget === e.target && setCaseOpen(false)}>
          <div className="modal" role="dialog" aria-modal="true" aria-labelledby="case-title">
            <button className="modal-close" aria-label="Close case form" onClick={() => setCaseOpen(false)}>Close</button>
            <h2 id="case-title">Make your case</h2>
            <p>The jury only gets what you put here. Keep it clear, specific and human.</p>
            <form onSubmit={createCase}>
              <div className="field"><label htmlFor="title">Case title</label><input id="title" maxLength={160} required value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Was I wrong to leave the group chat?" /></div>
              <div className="field"><label htmlFor="argument">Your argument</label><textarea id="argument" maxLength={5000} required value={argument} onChange={(e) => setArgument(e.target.value)} placeholder="Tell the jury what happened and what you think the verdict should be." /></div>
              <Turnstile onToken={handleTurnstileToken} onError={handleTurnstileError} />
              {caseError && <div className="error" role="alert">{caseError}</div>}
              <button className="button" disabled={creating || !turnstileToken} type="submit">{creating ? 'Opening case' : 'Open case'}</button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
