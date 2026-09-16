'use client';

import { useState } from 'react';
import { getSupabase } from '../../lib/supabase';
import { useToast } from './Toast';

type AuthModalProps = {
  open: boolean;
  nextPath?: string;
  onClose: () => void;
};

export default function AuthModal({ open, nextPath = '/', onClose }: AuthModalProps) {
  const { showToast } = useToast();
  const [loading, setLoading] = useState(false);

  if (!open) return null;

  function callbackUrl() {
    const callback = new URL('/auth/callback', process.env.NEXT_PUBLIC_SITE_URL || window.location.origin);
    const safePath = nextPath.startsWith('/') && !nextPath.startsWith('//') ? nextPath : '/';
    callback.searchParams.set('next', safePath);
    return callback.toString();
  }

  async function signInWithGoogle() {
    setLoading(true);
    const { error: signInError } = await getSupabase().auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: callbackUrl() },
    });
    if (signInError) {
      setLoading(false);
      showToast(signInError.message, 'error');
    }
    // On success the browser navigates away to Google immediately, so there is
    // nothing further to render here — the redirect back to /auth/callback
    // (and then to nextPath) is handled by the callback route.
  }

  return (
    <div className="modal-backdrop" role="presentation" onMouseDown={(event) => event.currentTarget === event.target && onClose()}>
      <div className="modal" role="dialog" aria-modal="true" aria-labelledby="auth-title">
        <button className="modal-close" aria-label="Close sign in" onClick={onClose}>Close</button>
        <h2 id="auth-title">Enter the court</h2>
        <p>Sign in with Google. No password to remember, no email to check.</p>
        <button className="button provider-button" type="button" disabled={loading} onClick={signInWithGoogle}>
          {loading ? 'Opening Google…' : 'Continue with Google'}
        </button>
      </div>
    </div>
  );
}
