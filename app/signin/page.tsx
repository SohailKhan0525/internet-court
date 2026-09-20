'use client';

import { Suspense, useCallback, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { getSupabase } from '../../lib/supabase';
import { invokeEdgeFunction } from '../../lib/functions';
import { useToast } from '../components/Toast';
import Turnstile from '../components/Turnstile';

function SignInForm() {
  const { showToast } = useToast();
  const searchParams = useSearchParams();
  const next = searchParams.get('next') || '/';
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

  function callbackUrl() {
    const callback = new URL('/auth/callback', process.env.NEXT_PUBLIC_SITE_URL || window.location.origin);
    const safePath = next.startsWith('/') && !next.startsWith('//') ? next : '/';
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
  }

  return (
    <div className="docket" style={{ maxWidth: 440, margin: '0 auto' }}>
      <span className="docket-tab">Sign in</span>
      <div className="docket-body">
        <h1 style={{ fontFamily: 'var(--font-fraunces)', fontSize: 28, margin: '0 0 8px' }}>Enter the court</h1>
        <p className="muted" style={{ margin: '0 0 24px' }}>Sign in with Google. No password to remember, no email to check.</p>
        <div style={{ margin: '20px 0' }}>
          <Turnstile onToken={handleTurnstileToken} onError={handleTurnstileError} />
          {turnstileStatus === 'loading' && <p className="faint" style={{ fontSize: 13, marginTop: 8 }}>Loading security check…</p>}
          {turnstileStatus === 'error' && <p className="error-text" role="alert">Security check failed to load. Check your connection and refresh.</p>}
        </div>
        <button className="btn btn-block" type="button" disabled={loading || turnstileStatus !== 'ready'} onClick={signInWithGoogle}>
          {loading ? 'Opening Google…' : turnstileStatus === 'ready' ? 'Continue with Google' : 'Waiting for security check…'}
        </button>
      </div>
    </div>
  );
}

export default function SignInPage() {
  return (
    <main className="site">
      <header className="docket-header">
        <div className="shell">
          <a href="/" className="wordmark">INTERNET COURT<small>PUBLIC CASE DOCKET</small></a>
        </div>
      </header>
      <div className="shell section" id="main">
        <Suspense fallback={null}>
          <SignInForm />
        </Suspense>
      </div>
    </main>
  );
}
