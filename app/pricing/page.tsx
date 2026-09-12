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
        <section className="section section-shell pricing-hero">
          <span className="eyebrow">Membership</span>
          <h1 className="section-title">Choose your seat in the court.</h1>
          <p className="muted" style={{ maxWidth: 680, fontSize: 18 }}>The jury stays open to everyone. Membership unlocks private and unlisted cases and identifies paid members on the court.</p>
        </section>
        <section className="section section-shell" aria-label="Subscription plans">
          <div className="grid pricing-grid">
            {plans.map((plan) => (
              <article className="card" key={plan.code}>
                <div>
                  <h2>{plan.name}</h2>
                  <p className="muted" style={{ marginTop: 12 }}>{plan.description}</p>
                </div>
                <div className="price">{plan.price}<span> / month</span></div>
                <ul className="feature-list">
                  {plan.features.map((feature) => <li key={feature}>{feature}</li>)}
                </ul>
                <button className="button" disabled={loadingPlan !== null} onClick={() => subscribe(plan.code)}>
                  {loadingPlan === plan.code ? 'Opening PayPal…' : `Choose ${plan.name}`}
                </button>
              </article>
            ))}
          </div>
          {error && <div className="error" role="alert" style={{ marginTop: 24 }}>{error}</div>}
          <p className="pricing-note">Payments are processed by PayPal. Internet Court does not store your PayPal credentials. Premium access changes only after a verified PayPal event updates the subscription record. Subscriptions are billed monthly and can be cancelled anytime from your PayPal account; see our <a href="/terms">Terms</a> for the refund policy.</p>
        </section>
      </main>
      <footer className="footer"><span>Internet Court</span><a href="/">Return to court</a></footer>
    </div>
  );
}
