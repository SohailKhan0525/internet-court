export default function PayPalCancelPage() {
  return (
    <div className="site">
      <header className="nav"><a className="brand" href="/">INTERNET COURT</a></header>
      <main id="main">
        <section className="section" style={{ paddingTop: 96, maxWidth: 720 }}>
          <span className="eyebrow">Checkout cancelled</span>
          <h1 className="section-title" style={{ fontSize: 56 }}>No charge was confirmed here.</h1>
          <p style={{ color: '#a3a3a3', lineHeight: 1.6 }}>You left PayPal before completing the subscription. Internet Court has not granted premium access.</p>
          <a className="button" href="/pricing">Return to membership</a>
        </section>
      </main>
    </div>
  );
}
