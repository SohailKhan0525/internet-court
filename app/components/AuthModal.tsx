'use client';

import { FormEvent, useCallback, useState } from 'react';
import { getSupabase } from '../../lib/supabase';
import { useToast } from './Toast';
import Turnstile from './Turnstile';

type AuthModalProps = {
  open: boolean;
  nextPath?: string;
  onClose: () => void;
};

export default function AuthModal({ open, nextPath = '/', onClose }: AuthModalProps) {
  const { showToast } = useToast();
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState<'provider' | 'email' | null>(null);
  const [turnstileToken, setTurnstileToken] = useState('');

  const handleTurnstileToken = useCallback((token: string) => setTurnstileToken(token), []);
  const handleTurnstileError = useCallback(() => {
    setTurnstileToken('');
    showToast('Security verification failed to load. Refresh and try again.', 'error');
  }, [showToast]);

  if (!open) return null;

  function callbackUrl() {
    const callback = new URL('/auth/callback', process.env.NEXT_PUBLIC_SITE_URL || window.location.origin);
    const safePath = nextPath.startsWith('/') && !nextPath.startsWith('//') ? nextPath : '/';
    callback.searchParams.set('next', safePath);
    return callback.toString();
  }

  async function verifyHuman(): Promise<boolean> {
    if (!turnstileToken) {
      showToast('Complete the security check before continuing.', 'error');
      return false;
    }
    const { data, error } = await getSupabase().functions.invoke('verify-turnstile', {
      body: { turnstile_token: turnstileToken },
    });
    if (error || !data?.verified) {
      showToast('Security verification failed. Please try again.', 'error');
      return false;
    }
    return true;
  }

  async function signInWithProvider() {
    setMessage('');
    setLoading('provider');
    const verified = await verifyHuman();
    if (!verified) {
      setLoading(null);
      return;
    }
    const { error: signInError } = await getSupabase().auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: callbackUrl() },
    });
    if (signInError) {
      setLoading(null);
      showToast(signInError.message, 'error');
    }
    // On success the browser navigates away to Google immediately, so there is
    // nothing further to render here — the redirect back to /auth/callback
    // (and then to nextPath) is handled by the callback route.
  }

  async function sendMagicLink(event: FormEvent) {
    event.preventDefault();
    setMessage('');
    setLoading('email');
    const verified = await verifyHuman();
    if (!verified) {
      setLoading(null);
      return;
    }
    const { error: signInError } = await getSupabase().auth.signInWithOtp({
      email: email.trim(),
      options: { emailRedirectTo: callbackUrl() },
    });
    setLoading(null);
    if (signInError) showToast(signInError.message, 'error');
    else {
      setMessage('Check your email for the sign in link.');
      showToast('Sign in link sent — check your email.', 'success');
    }
  }

  return (
    <div className="modal-backdrop" role="presentation" onMouseDown={(event) => event.currentTarget === event.target && onClose()}>
      <div className="modal" role="dialog" aria-modal="true" aria-labelledby="auth-title">
        <button className="modal-close" aria-label="Close sign in" onClick={onClose}>Close</button>
        <h2 id="auth-title">Enter the court</h2>
        <p>Continue with Google or use a magic link. No password to remember.</p>
        <Turnstile onToken={handleTurnstileToken} onError={handleTurnstileError} />
        <button className="button provider-button" type="button" disabled={loading !== null} onClick={signInWithProvider}>
          {loading === 'provider' ? 'Opening Google' : 'Continue with Google'}
        </button>
        <div className="auth-divider" aria-hidden="true"><span>or</span></div>
        <form onSubmit={sendMagicLink}>
          <div className="field">
            <label htmlFor="auth-email">Email</label>
            <input id="auth-email" type="email" required value={email} onChange={(event) => setEmail(event.target.value)} autoComplete="email" />
          </div>
          {message && <div className="success">{message}</div>}
          <button className="button secondary auth-email-button" type="submit" disabled={loading !== null}>
            {loading === 'email' ? 'Sending link' : 'Email me a sign in link'}
          </button>
        </form>
      </div>
    </div>
  );
}
