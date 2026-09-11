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
      <header className="nav"><a className="brand" href="/">INTERNET COURT</a></header>
      <main id="main">
        <section className="section" style={{ paddingTop: 96, maxWidth: 720 }}>
          {status === 'checking' && <><span className="eyebrow">Payment approved</span><h1 className="section-title" style={{ fontSize: 56 }}>Confirming your membership.</h1><p style={{ color: '#a3a3a3', lineHeight: 1.6 }}>PayPal has returned you to Internet Court. We are waiting for the verified PayPal webhook before granting access.</p></>}
          {status === 'active' && <><span className="eyebrow">Membership active</span><h1 className="section-title" style={{ fontSize: 56 }}>Welcome to the court.</h1><p style={{ color: '#a3a3a3', lineHeight: 1.6 }}>Your verified PayPal subscription is active. Your membership features are now available.</p><a className="button" href="/">Return to Internet Court</a></>}
          {status === 'pending' && <><span className="eyebrow">Still confirming</span><h1 className="section-title" style={{ fontSize: 56 }}>Your payment is not being guessed.</h1><p style={{ color: '#a3a3a3', lineHeight: 1.6 }}>PayPal has returned you, but Internet Court has not yet received the verified subscription event. Your access will only change after that event is confirmed.</p><a className="button" href="/">Return to Internet Court</a></>}
          {status === 'error' && <><span className="eyebrow">Could not confirm</span><h1 className="section-title" style={{ fontSize: 56 }}>We could not verify the membership yet.</h1><p style={{ color: '#a3a3a3', lineHeight: 1.6 }}>No premium access has been granted. Return to the court or try the membership flow again.</p><a className="button" href="/pricing">Back to membership</a></>}
        </section>
      </main>
    </div>
  );
}
