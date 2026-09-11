'use client';

import { useEffect, useState } from 'react';
import { getSupabase } from '../../lib/supabase';

const plans = [
  {
    code: 'jury_member',
    name: 'Jury Member',
    price: '$3',
    description: 'For people who want more control over who can see their cases.',
    features: ['Public case creation', 'Private cases', 'Unlisted cases', 'Membership badge'],
  },
  {
    code: 'supreme_court',
    name: 'Supreme Court',
    price: '$7',
    description: 'For people who want the highest membership tier in Internet Court.',
    features: ['Everything in Jury Member', 'Supreme Court membership tier', 'Membership badge', 'Priority tier recognition'],
  },
] as const;

export default function PricingPage() {
  const [user, setUser] = useState<any>(null);
  const [loadingPlan, setLoadingPlan] = useState<string | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    const supabase = getSupabase();
    supabase.auth.getUser().then(({ data }) => setUser(data.user ?? null));
    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => setUser(session?.user ?? null));
    return () => listener.subscription.unsubscribe();
  }, []);

  async function subscribe(planCode: string) {
    setError('');
    if (!user) {
      window.location.href = '/?signin=required';
      return;
    }

    setLoadingPlan(planCode);
    const supabase = getSupabase();
    const { data, error: invokeError } = await supabase.functions.invoke('create-paypal-subscription', {
      body: {
        plan_code: planCode,
        return_url: `${window.location.origin}/billing/paypal/success?plan=${encodeURIComponent(planCode)}`,
        cancel_url: `${window.location.origin}/billing/paypal/cancel`,
      },
    });

    if (invokeError || !data?.approval_url) {
      setLoadingPlan(null);
      setError(invokeError?.message ?? 'PayPal did not return an approval link.');
      return;
    }

    window.location.assign(data.approval_url);
  }

  return (
    <div className="site">
      <header className="nav">
        <a className="brand" href="/">INTERNET COURT</a>
        <a className="button ghost" href="/">Back</a>
      </header>
      <main id="main">
        <section className="section" style={{ paddingTop: 80 }}>
          <span className="eyebrow">Membership</span>
          <h1 className="section-title" style={{ fontSize: 'clamp(48px, 8vw, 80px)', marginBottom: 24 }}>Choose your seat in the court.</h1>
          <p style={{ maxWidth: 680, color: '#a3a3a3', fontSize: 20, lineHeight: 1.55 }}>The jury stays open to everyone. Membership unlocks private and unlisted cases and identifies paid members on the court.</p>
        </section>
        <section className="section" aria-label="Subscription plans">
          <div className="grid">
            {plans.map((plan) => (
              <article className="card" key={plan.code} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                <div>
                  <h2 style={{ margin: 0, fontSize: 28, textWrap: 'balance' }}>{plan.name}</h2>
                  <p style={{ marginTop: 12 }}>{plan.description}</p>
                </div>
                <div style={{ fontSize: 40, fontWeight: 700, letterSpacing: '-.04em' }}>{plan.price}<span style={{ fontSize: 16, color: '#737373' }}> / month</span></div>
                <ul style={{ margin: 0, paddingLeft: 20, color: '#d4d4d4', lineHeight: 1.7 }}>
                  {plan.features.map((feature) => <li key={feature}>{feature}</li>)}
                </ul>
                <button className="button" disabled={loadingPlan !== null} onClick={() => subscribe(plan.code)}>
                  {loadingPlan === plan.code ? 'Opening PayPal…' : `Choose ${plan.name}`}
                </button>
              </article>
            ))}
          </div>
          {error && <div className="error" role="alert" style={{ marginTop: 24 }}>{error}</div>}
          <p style={{ color: '#737373', marginTop: 32, fontSize: 14 }}>Payments are processed by PayPal. Internet Court does not store your PayPal credentials. Premium access changes only after a verified PayPal event updates the subscription record.</p>
        </section>
      </main>
      <footer className="footer"><span>Internet Court</span><a href="/">Return to court</a></footer>
    </div>
  );
}
