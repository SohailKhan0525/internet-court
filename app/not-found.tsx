export default function NotFound() {
  return (
    <main className="site">
      <section className="hero" id="main">
        <span className="eyebrow">404</span>
        <h1>That case does not exist.</h1>
        <p>The page may have been removed, or the link may be wrong.</p>
        <div className="hero-actions"><a className="button" href="/">Return to court</a><a className="button secondary" href="/pricing">See membership</a></div>
      </section>
    </main>
  );
}
