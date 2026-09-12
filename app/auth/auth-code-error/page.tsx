export default function AuthCodeErrorPage() {
  return (
    <main id="main" className="site">
      <header className="nav">
        <a className="brand" href="/">INTERNET COURT</a>
        <a className="button ghost" href="/">Back to court</a>
      </header>
      <section className="section section-shell">
        <div className="card auth-error-page">
          <span className="eyebrow">Sign in</span>
          <h1 className="section-title">That sign in link could not be completed.</h1>
          <p>Request a new link and try again. If you were signing in with Google, start the Google sign in again.</p>
          <a className="button" href="/">Return to Internet Court</a>
        </div>
      </section>
    </main>
  );
}
