'use client';

import { useEffect, useState } from 'react';
import { getSupabase } from '../../../../lib/supabase';

export default function PayPalSuccessPage() {
  const [status, setStatus] = useState<'checking' | 'active' | 'pending' | 'error'>('checking');

  useEffect(() => {
    let cancelled = false;
    let attempts = 0;

    async function check() {
      const supabase = getSupabase();
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) {
        if (!cancelled) setStatus('error');
        return;
      }

      const { data, error } = await supabase
        .from('subscriptions')
        .select('status')
        .eq('user_id', userData.user.id)
        .eq('provider', 'paypal')
        .in('status', ['active', 'past_due', 'cancelled', 'expired'])
        .order('updated_at', { ascending: false })
        .limit(1);

      if (error) {
        if (!cancelled) setStatus('error');
        return;
      }

      if (data?.[0]?.status === 'active') {
        if (!cancelled) setStatus('active');
        return;
      }

      attempts += 1;
      if (attempts >= 10) {
        if (!cancelled) setStatus('pending');
        return;
      }

      window.setTimeout(check, 2000);
    }

    check();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className="site">
      <header className="docket-header"><div className="shell"><a href="/" className="wordmark">INTERNET COURT<small>PUBLIC CASE DOCKET</small></a></div></header>
      <main id="main">
        <div className="shell section" style={{ maxWidth: 600 }}>
          {status === 'checking' && <><p className="kicker">Payment approved</p><h1 className="display" style={{ fontSize: 'clamp(28px,4vw,38px)', marginTop: 8 }}>Confirming your membership.</h1><p>PayPal has returned you to Internet Court. We are waiting for the verified PayPal webhook before granting access.</p></>}
          {status === 'active' && <><p className="kicker">Membership active</p><h1 className="display" style={{ fontSize: 'clamp(28px,4vw,38px)', marginTop: 8 }}>Welcome to the court.</h1><p>Your verified PayPal subscription is active. Your membership features are now available.</p><a className="btn" style={{ marginTop: 20 }} href="/">Return to Internet Court</a></>}
          {status === 'pending' && <><p className="kicker">Still confirming</p><h1 className="display" style={{ fontSize: 'clamp(28px,4vw,38px)', marginTop: 8 }}>Your payment is not being guessed.</h1><p>PayPal has returned you, but Internet Court has not yet received the verified subscription event. Your access will only change after that event is confirmed.</p><a className="btn" style={{ marginTop: 20 }} href="/">Return to Internet Court</a></>}
          {status === 'error' && <><p className="kicker">Could not confirm</p><h1 className="display" style={{ fontSize: 'clamp(28px,4vw,38px)', marginTop: 8 }}>We could not verify the membership yet.</h1><p>No premium access has been granted. Return to the court or try the membership flow again.</p><a className="btn" style={{ marginTop: 20 }} href="/pricing">Back to membership</a></>}
        </div>
      </main>
    </div>
  );
}
