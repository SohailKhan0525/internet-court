export default function PayPalCancelPage() {
  return (
    <div className="site">
      <header className="nav"><a className="brand" href="/">INTERNET COURT</a></header>
      <main id="main">
        <section className="section section-shell result-page">
          <span className="eyebrow">Checkout cancelled</span>
          <h1 className="section-title">No charge was confirmed here.</h1>
          <p>You left PayPal before completing the subscription. Internet Court has not granted premium access.</p>
          <a className="button" href="/pricing">Return to membership</a>
        </section>
      </main>
    </div>
  );
}
