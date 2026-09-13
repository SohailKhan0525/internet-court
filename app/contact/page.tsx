'use client';

import { FormEvent, useCallback, useState } from 'react';
import { getSupabase } from '../../lib/supabase';
import { useToast } from '../components/Toast';
import Turnstile from '../components/Turnstile';

export default function ContactPage() {
  const { showToast } = useToast();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [turnstileToken, setTurnstileToken] = useState('');
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');

  const handleTurnstileToken = useCallback((token: string) => setTurnstileToken(token), []);
  const handleTurnstileError = useCallback(() => setTurnstileToken(''), []);

  async function submit(event: FormEvent) {
    event.preventDefault();
    setError('');
    if (!turnstileToken) {
      setError('Complete the security check before sending.');
      return;
    }
    setSending(true);
    const { data, error: invokeError } = await getSupabase().functions.invoke('send-contact-message', {
      body: { name: name.trim(), email: email.trim(), message: message.trim(), turnstile_token: turnstileToken },
    });
    setSending(false);
    if (invokeError || !data?.sent) {
      const messageText = invokeError?.message ?? 'The message could not be sent. Please try again.';
      setError(messageText);
      showToast(messageText, 'error');
      return;
    }
    setSent(true);
    showToast('Message sent. We will reply by email.', 'success');
  }

  return (
    <main className="site">
      <header className="nav">
        <a className="brand" href="/">INTERNET COURT</a>
        <a className="button ghost" href="/">Back to court</a>
      </header>
      <section className="section section-shell result-page">
        <span className="eyebrow">Contact</span>
        <h1 className="section-title">Something wrong? Tell us.</h1>
        <p>Account issues, billing problems, abuse you want reviewed faster, or anything else. A real person reads this inbox.</p>
        {sent ? (
          <div className="card success" role="status" style={{ marginTop: 24 }}>
            <p>Message sent. We reply by email, usually within a couple of days.</p>
          </div>
        ) : (
          <form onSubmit={submit} style={{ marginTop: 24 }}>
            <div className="field">
              <label htmlFor="contact-name">Name</label>
              <input id="contact-name" required maxLength={120} value={name} onChange={(event) => setName(event.target.value)} autoComplete="name" />
            </div>
            <div className="field">
              <label htmlFor="contact-email">Email</label>
              <input id="contact-email" type="email" required maxLength={254} value={email} onChange={(event) => setEmail(event.target.value)} autoComplete="email" />
            </div>
            <div className="field">
              <label htmlFor="contact-message">Message</label>
              <textarea id="contact-message" required maxLength={4000} value={message} onChange={(event) => setMessage(event.target.value)} />
            </div>
            <Turnstile onToken={handleTurnstileToken} onError={handleTurnstileError} />
            {error && <div className="error" role="alert">{error}</div>}
            <button className="button" type="submit" disabled={sending}>{sending ? 'Sending…' : 'Send message'}</button>
          </form>
        )}
      </section>
    </main>
  );
}
