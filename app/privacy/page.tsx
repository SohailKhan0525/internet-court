export const metadata = { title: 'Privacy | Internet Court', description: 'How Internet Court handles account, case, voting, moderation, and payment information.' };

export default function PrivacyPage() {
  return (
    <main className="site">
      <header className="docket-header">
        <div className="shell">
          <a href="/" className="wordmark">INTERNET COURT<small>PUBLIC CASE DOCKET</small></a>
          <a className="btn-quiet header-link" href="/">Back to court</a>
        </div>
      </header>
      <div className="shell section legal">
        <p className="kicker">Privacy</p>
        <h1 className="display">Your data. Your account. Your cases.</h1>
        <p>Internet Court (loopproof.me) is operated by Sohail Khan, an individual based in India. This page explains what is collected and why, in plain language.</p>

        <h2>What we collect</h2>
        <p>When you sign in with Google, we receive your email address, name, and avatar as provided by Google. When you create a case, vote, comment, or report, we store the information needed to provide those features and prevent abuse. If you purchase a membership, PayPal handles the payment itself; we only store the subscription status they send us. If you use the contact form, we receive whatever you write, including your email address for replying.</p>

        <h2>Who we share data with</h2>
        <p>Internet Court runs on a small set of external services, each of which processes some data on our behalf:</p>
        <p>• <strong>Supabase</strong> — database, authentication, and file storage<br />
        • <strong>Google</strong> — sign-in identity provider<br />
        • <strong>PayPal</strong> — payment processing for memberships; Internet Court never sees or stores your card or bank details<br />
        • <strong>Vercel</strong> — website hosting<br />
        • <strong>Cloudflare</strong> — bot/abuse protection (Turnstile) during sign-in<br />
        • <strong>Resend</strong> — sending confirmation and contact-form emails</p>
        <p>We do not sell your data, and we do not share it with anyone else for advertising.</p>

        <h2>Cookies and local storage</h2>
        <p>Internet Court uses your browser's local storage to keep you signed in and to remember basic preferences. We do not use third-party advertising or tracking cookies.</p>

        <h2>Public information</h2>
        <p>Public cases, votes counts, comments, and public profile information (username, display name, bio) are visible to anyone, including search engines. Private and unlisted cases (a paid membership feature) are not indexed and are only reachable by people you share the direct link with, or, for private cases, by you alone.</p>

        <h2>Your rights</h2>
        <p>You can update your username, display name, and bio anytime from <a href="/settings">Settings</a>. You can request a copy of your data, request deletion of your account and cases, or ask any other privacy question through our <a href="/contact">contact page</a>. We aim to respond within a reasonable time and, where legally required (such as under GDPR for EU users), within the timeframes that law sets out.</p>

        <h2>Retention</h2>
        <p>We retain information for as long as needed to operate the service, meet security and legal obligations, and resolve abuse or payment disputes. Deleted cases and accounts are removed from active use; some records may be kept briefly for fraud prevention or legal compliance.</p>

        <h2>Children</h2>
        <p>Internet Court is not directed at children under 16, and accounts for people under that age are not permitted.</p>

        <h2>Changes</h2>
        <p>This policy may be updated as the product evolves. Meaningful changes will be reflected here with an updated page.</p>

        <h2>Contact</h2>
        <p>For privacy requests, use our <a href="/contact">contact page</a>.</p>

        <p className="muted">This page is written in good faith for a solo, self-funded project and is not a substitute for advice from a qualified lawyer in your jurisdiction, particularly around GDPR, CCPA, or India's DPDP Act as the service grows.</p>
      </div>
    </main>
  );
}
