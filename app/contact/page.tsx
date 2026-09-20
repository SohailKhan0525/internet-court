'use client';

import { FormEvent, useEffect, useState } from 'react';
import { getSupabase } from '../../lib/supabase';
import { invokeEdgeFunction } from '../../lib/functions';
import { useToast } from '../components/Toast';
import DocketHeader from '../components/DocketHeader';

export default function ContactPage() {
  const { showToast } = useToast();
  const [user, setUser] = useState<any>(null);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  // Honeypot: a field real users never see or fill in (hidden via CSS, not
  // type="hidden" -- bots that fill every field in a scraped form will
  // trip this). No Turnstile here since this form isn't gated by sign-in.
  const [website, setWebsite] = useState('');
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    getSupabase().auth.getUser().then(({ data }) => setUser(data.user));
  }, []);

  async function submit(event: FormEvent) {
    event.preventDefault();
    setError('');
    if (website) return; // honeypot tripped — silently drop, don't tip off the bot
    setSending(true);
    const { data, error: invokeError } = await invokeEdgeFunction<{ sent: boolean }>('send-contact-message', {
      name: name.trim(), email: email.trim(), message: message.trim(), website,
    });
    setSending(false);
    if (invokeError || !data?.sent) {
      const messageText = invokeError ?? 'The message could not be sent. Please try again.';
      setError(messageText);
      showToast(messageText, 'error');
      return;
    }
    setSent(true);
    showToast('Message sent. We will reply by email.', 'success');
  }

  return (
    <main className="site">
      <DocketHeader user={user} currentPath="/contact" />
      <div className="shell section" style={{ maxWidth: 560 }}>
        <p className="kicker">Contact</p>
        <h1 className="display" style={{ fontSize: 'clamp(28px,4vw,38px)', marginTop: 8 }}>Something wrong? Tell us.</h1>
        <p className="lede" style={{ marginTop: 12 }}>Account issues, billing problems, abuse you want reviewed faster, or anything else. A real person reads this inbox.</p>
        {sent ? (
          <div className="docket" role="status" style={{ marginTop: 24 }}>
            <div className="docket-body"><p style={{ margin: 0 }}>Message sent. We reply by email, usually within a couple of days.</p></div>
          </div>
        ) : (
          <form onSubmit={submit} style={{ marginTop: 28 }}>
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
            <div aria-hidden="true" style={{ position: 'absolute', left: '-9999px', width: 1, height: 1, overflow: 'hidden' }}>
              <label htmlFor="contact-website">Leave this field empty</label>
              <input id="contact-website" tabIndex={-1} autoComplete="off" value={website} onChange={(event) => setWebsite(event.target.value)} />
            </div>
            {error && <p className="error-text" role="alert">{error}</p>}
            <button className="btn" type="submit" disabled={sending}>{sending ? 'Sending…' : 'Send message'}</button>
          </form>
        )}
      </div>
    </main>
  );
}
