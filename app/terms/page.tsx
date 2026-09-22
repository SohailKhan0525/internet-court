export const metadata = { title: 'Terms | Internet Court', description: 'Terms for using Internet Court.' };

export default function TermsPage() {
  return (
    <main className="site">
      <header className="docket-header">
        <div className="shell">
          <a href="/" className="wordmark">INTERNET COURT<small>PUBLIC CASE DOCKET</small></a>
          <a className="btn-quiet header-link" href="/">Back to court</a>
        </div>
      </header>
      <div className="shell section legal">
        <p className="kicker">Terms</p>
        <h1 className="display">Use the court like a court.</h1>
        <p>Internet Court (loopproof.me) is operated by Sohail Khan, an individual based in India, not by a registered company. These terms are a plain-language agreement between you and the operator for using the service.</p>

        <h2>Who can use this</h2>
        <p>You must be at least 16 years old to create an account or use Internet Court. If you are purchasing a membership, you must also be old enough to enter a binding contract in your country.</p>

        <h2>Rules</h2>
        <p>Do not use Internet Court to threaten people, expose personal information, harass others, promote hate, impersonate others, spam the service, or submit unlawful content. Do not attempt to bypass voting, membership, security, or rate limits.</p>

        <h2>Cases, votes, and comments</h2>
        <p>Public cases may be visible to anyone. Votes are intended to represent individual user choices and are limited to one vote per user per case. Comments are a Supreme Court membership feature and follow the same rules as cases. Internet Court does not promise that a verdict is correct, fair, popular, or legally meaningful — it is the honest count of real votes, nothing more.</p>

        <h2>Your content</h2>
        <p>You keep ownership of what you write. By publishing a case, vote, or comment, you give Internet Court permission to display, distribute, and store it as part of operating the service, including on public case pages that can be shared or indexed by search engines.</p>

        <h2>Moderation</h2>
        <p>Cases and comments may be reviewed, restricted, or removed when they violate these rules or create security, legal, or abuse risks. Reporting content does not guarantee a particular moderation outcome.</p>

        <h2>Memberships and billing</h2>
        <p>Paid memberships provide the features shown at the time of purchase and are billed monthly in advance through PayPal. Membership access depends on the subscription status received by Internet Court from PayPal. As of now, the operator's turnover is below India's GST registration threshold, so GST is not currently charged; this may change if that changes.</p>

        <h2>Refunds</h2>
        <p>All membership payments are final. Internet Court does not offer refunds for partial billing periods, unused features, or cases where a member forgets to cancel before the next billing date. You can cancel your membership at any time through your PayPal account to stop future charges; cancelling does not refund the current billing period.</p>

        <h2>No warranty</h2>
        <p>Internet Court is provided "as is," without warranties of any kind, express or implied. The operator does not guarantee the service will be uninterrupted, error-free, or fit for any particular purpose.</p>

        <h2>Limitation of liability</h2>
        <p>To the fullest extent permitted by law, the operator's total liability for any claim relating to Internet Court is limited to the amount you paid the operator in the 3 months before the claim arose, or ₹1,000, whichever is greater. The operator is not liable for indirect, incidental, or consequential damages, including loss of data, reputation, or profits arising from content posted by other users.</p>

        <h2>Indemnification</h2>
        <p>You agree to indemnify the operator against claims arising from your content or your violation of these terms.</p>

        <h2>Governing law</h2>
        <p>These terms are governed by the laws of India. Any dispute will be handled in the courts having jurisdiction over the operator's location in India, unless local consumer-protection law in your country requires otherwise.</p>

        <h2>Changes</h2>
        <p>These terms may be updated as the product evolves. Continued use of Internet Court after a change means you accept the updated terms.</p>

        <h2>Contact</h2>
        <p>Questions about these terms should be directed to our <a href="/contact">contact page</a>.</p>

        <p className="muted">This page is written in good faith for a solo, self-funded project and is not a substitute for advice from a qualified lawyer or chartered accountant in your jurisdiction. If Internet Court starts generating meaningful revenue, get a real legal and tax review — LegalZoom or a local CA are reasonable starting points.</p>
      </div>
    </main>
  );
}
