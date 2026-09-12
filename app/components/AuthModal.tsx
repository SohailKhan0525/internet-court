'use client';

import { FormEvent, useState } from 'react';
import { getSupabase } from '../../lib/supabase';

type AuthModalProps = {
  open: boolean;
  nextPath?: string;
  onClose: () => void;
};

export default function AuthModal({ open, nextPath = '/', onClose }: AuthModalProps) {
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState<'provider' | 'email' | null>(null);

  if (!open) return null;

  function callbackUrl() {
    const callback = new URL('/auth/callback', window.location.origin);
    const safePath = nextPath.startsWith('/') && !nextPath.startsWith('//') ? nextPath : '/';
    callback.searchParams.set('next', safePath);
    return callback.toString();
  }

  async function signInWithProvider() {
    setError('');
    setMessage('');
    setLoading('provider');
    const { error: signInError } = await getSupabase().auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: callbackUrl() },
    });
    if (signInError) {
      setLoading(null);
      setError(signInError.message);
    }
  }

  async function sendMagicLink(event: FormEvent) {
    event.preventDefault();
    setError('');
    setMessage('');
    setLoading('email');
    const { error: signInError } = await getSupabase().auth.signInWithOtp({
      email: email.trim(),
      options: { emailRedirectTo: callbackUrl() },
    });
    setLoading(null);
    if (signInError) setError(signInError.message);
    else setMessage('Check your email for the sign in link.');
  }

  return (
    <div className="modal-backdrop" role="presentation" onMouseDown={(event) => event.currentTarget === event.target && onClose()}>
      <div className="modal" role="dialog" aria-modal="true" aria-labelledby="auth-title">
        <button className="modal-close" aria-label="Close sign in" onClick={onClose}>Close</button>
        <h2 id="auth-title">Enter the court</h2>
        <p>Continue with Google or use a magic link. No password to remember.</p>
        <button className="button provider-button" type="button" disabled={loading !== null} onClick={signInWithProvider}>
          {loading === 'provider' ? 'Opening Google' : 'Continue with Google'}
        </button>
        <div className="auth-divider" aria-hidden="true"><span>or</span></div>
        <form onSubmit={sendMagicLink}>
          <div className="field">
            <label htmlFor="auth-email">Email</label>
            <input id="auth-email" type="email" required value={email} onChange={(event) => setEmail(event.target.value)} autoComplete="email" />
          </div>
          {error && <div className="error" role="alert">{error}</div>}
          {message && <div className="success">{message}</div>}
          <button className="button secondary auth-email-button" type="submit" disabled={loading !== null}>
            {loading === 'email' ? 'Sending link' : 'Email me a sign in link'}
          </button>
        </form>
      </div>
    </div>
  );
}
