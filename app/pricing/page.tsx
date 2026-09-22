'use client';

import { useEffect, useState } from 'react';
import { getSupabase } from '../../lib/supabase';
import { invokeEdgeFunction } from '../../lib/functions';
import DocketHeader from '../components/DocketHeader';
import ComparisonTable from '../components/ComparisonTable';
import { useToast } from '../components/Toast';

const plans = [
  {
    code: 'jury_member',
    name: 'Jury Member',
    price: '$3',
    description: 'For people who want more control over who can see their cases.',
    features: ['Public case filing', 'Private cases', 'Unlisted cases', 'Membership badge'],
  },
  {
    code: 'supreme_court',
    name: 'Supreme Court',
    price: '$7',
    description: 'For people who want the highest membership tier in Internet Court.',
    features: ['Everything in Jury Member', 'Comment on any public case', 'Supreme Court membership tier', 'Membership badge'],
  },
] as const;

export default function PricingPage() {
  const { showToast } = useToast();
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
      window.location.href = '/signin?next=/pricing';
      return;
    }

    setLoadingPlan(planCode);
    const { data, error: invokeError } = await invokeEdgeFunction<{ approval_url: string }>('create-paypal-subscription', {
      plan_code: planCode,
      return_url: `${window.location.origin}/billing/paypal/success?plan=${encodeURIComponent(planCode)}`,
      cancel_url: `${window.location.origin}/billing/paypal/cancel`,
    });

    if (invokeError || !data?.approval_url) {
      setLoadingPlan(null);
      const message = invokeError ?? 'PayPal did not return an approval link.';
      setError(message);
      showToast(message, 'error');
      return;
    }

    window.location.assign(data.approval_url);
  }

  return (
    <div className="site">
      <DocketHeader user={user} currentPath="/pricing" />
      <main id="main">
        <div className="shell section" style={{ paddingBottom: 32 }}>
          <p className="kicker">Membership</p>
          <h1 className="display" style={{ fontSize: 'clamp(32px,5vw,48px)', marginTop: 8 }}>Choose your seat in the court.</h1>
          <p className="lede" style={{ marginTop: 16 }}>The jury stays open to everyone. Membership unlocks private and unlisted cases and identifies paid members on the court.</p>
        </div>

        <div className="shell" style={{ paddingBottom: 48 }}>
          <div className="plans-grid">
            {plans.map((plan) => (
              <div className="docket" key={plan.code}>
                <div className="docket-body">
                  <h2 style={{ fontFamily: 'var(--font-fraunces)', fontSize: 24, margin: 0 }}>{plan.name}</h2>
                  <p className="muted" style={{ marginTop: 8, fontSize: 14 }}>{plan.description}</p>
                  <p style={{ fontSize: 36, fontWeight: 700, margin: '16px 0', letterSpacing: '-0.02em' }}>{plan.price}<span style={{ fontSize: 15, fontWeight: 500, color: 'var(--ink-faint)' }}> / month</span></p>
                  <ul style={{ margin: '0 0 20px', paddingLeft: 18, color: 'var(--ink-soft)', fontSize: 14, lineHeight: 1.9 }}>
                    {plan.features.map((feature) => <li key={feature}>{feature}</li>)}
                  </ul>
                  <button className="btn btn-block" disabled={loadingPlan !== null} onClick={() => subscribe(plan.code)}>
                    {loadingPlan === plan.code ? 'Opening PayPal…' : `Choose ${plan.name}`}
                  </button>
                </div>
              </div>
            ))}
          </div>
          {error && <p className="error-text" role="alert" style={{ marginTop: 24 }}>{error}</p>}
          <p className="faint" style={{ marginTop: 24, fontSize: 13, maxWidth: 640 }}>Payments are processed by PayPal. Internet Court does not store your PayPal credentials. Premium access changes only after a verified PayPal event updates the subscription record. Subscriptions are billed monthly and can be cancelled anytime from your PayPal account; see our <a href="/terms" style={{ textDecoration: 'underline' }}>Terms</a> for the refund policy.</p>
        </div>

        <hr className="rule shell" />

        <div className="shell section" aria-label="Feature comparison">
          <p className="kicker">Compare</p>
          <h2 className="section-head" style={{ marginTop: 8 }}>What each tier actually unlocks.</h2>
          <p className="muted" style={{ marginBottom: 24 }}>No hidden features. This is the whole list.</p>
          <ComparisonTable
            columns={['Free', 'Jury Member — $3/mo', 'Supreme Court — $7/mo']}
            highlightColumn={2}
            rows={[
              { label: 'Vote on public cases', values: [true, true, true] },
              { label: 'File public cases', values: [true, true, true] },
              { label: 'File private cases', values: [false, true, true] },
              { label: 'File unlisted cases (link-only)', values: [false, true, true] },
              { label: 'Membership badge on your profile', values: [false, true, true] },
              { label: 'Comment on public cases', values: [false, false, true] },
            ]}
            caption="Jury Member and Supreme Court share the same private/unlisted case abilities. Supreme Court's real difference is the ability to comment on any public case — if you don't need that, Jury Member covers everything else."
          />
        </div>
      </main>
      <footer className="docket-footer"><div className="shell"><span>Internet Court</span><span style={{ display: 'flex', gap: 16 }}><a href="/contact">Contact</a><a href="https://x.com/qofeno" target="_blank" rel="me noopener noreferrer">X</a><a href="/">Return to court</a></span></div></footer>
    </div>
  );
}
