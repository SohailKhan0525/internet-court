export default function PayPalCancelPage() {
  return (
    <div className="site">
      <header className="docket-header"><div className="shell"><a href="/" className="wordmark">INTERNET COURT<small>PUBLIC CASE DOCKET</small></a></div></header>
      <main id="main">
        <div className="shell section" style={{ maxWidth: 600 }}>
          <p className="kicker">Checkout cancelled</p>
          <h1 className="display" style={{ fontSize: 'clamp(28px,4vw,38px)', marginTop: 8 }}>No charge was confirmed here.</h1>
          <p>You left PayPal before completing the subscription. Internet Court has not granted premium access.</p>
          <a className="btn" style={{ marginTop: 20 }} href="/pricing">Return to membership</a>
        </div>
      </main>
    </div>
  );
}
