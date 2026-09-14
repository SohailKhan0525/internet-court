'use client';

import { useCallback, useState } from 'react';
import { getSupabase } from '../../lib/supabase';
import { invokeEdgeFunction } from '../../lib/functions';
import { useToast } from './Toast';
import Turnstile from './Turnstile';

type AuthModalProps = {
  open: boolean;
  nextPath?: string;
  onClose: () => void;
};

export default function AuthModal({ open, nextPath = '/', onClose }: AuthModalProps) {
  const { showToast } = useToast();
  const [loading, setLoading] = useState(false);
  const [turnstileToken, setTurnstileToken] = useState('');
  const [turnstileStatus, setTurnstileStatus] = useState<'loading' | 'ready' | 'error'>('loading');

  const handleTurnstileToken = useCallback((token: string) => {
    setTurnstileToken(token);
    setTurnstileStatus(token ? 'ready' : 'loading');
  }, []);
  const handleTurnstileError = useCallback(() => {
    setTurnstileToken('');
    setTurnstileStatus('error');
  }, []);

  if (!open) return null;

  function callbackUrl() {
    const callback = new URL('/auth/callback', process.env.NEXT_PUBLIC_SITE_URL || window.location.origin);
    const safePath = nextPath.startsWith('/') && !nextPath.startsWith('//') ? nextPath : '/';
    callback.searchParams.set('next', safePath);
    return callback.toString();
  }

  async function signInWithGoogle() {
    if (!turnstileToken) {
      showToast('Complete the security check above before continuing.', 'error');
      return;
    }
    setLoading(true);
    const { data, error: verifyError } = await invokeEdgeFunction<{ verified: boolean }>('verify-turnstile', {
      turnstile_token: turnstileToken,
    });
    if (verifyError || !data?.verified) {
      setLoading(false);
      showToast(verifyError ?? 'Security verification failed. Please try again.', 'error');
      return;
    }
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
        <div className="turnstile-slot">
          <Turnstile onToken={handleTurnstileToken} onError={handleTurnstileError} />
          {turnstileStatus === 'loading' && <p className="muted turnstile-status">Loading security check…</p>}
          {turnstileStatus === 'error' && <p className="error turnstile-status" role="alert">Security check failed to load. Check your connection and refresh the page.</p>}
        </div>
        <button className="button provider-button" type="button" disabled={loading || turnstileStatus !== 'ready'} onClick={signInWithGoogle}>
          {loading ? 'Opening Google…' : turnstileStatus === 'ready' ? 'Continue with Google' : 'Waiting for security check…'}
        </button>
      </div>
    </div>
  );
}
