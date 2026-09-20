export default function AuthCodeErrorPage() {
  return (
    <main className="site" id="main">
      <header className="docket-header">
        <div className="shell"><a href="/" className="wordmark">INTERNET COURT<small>PUBLIC CASE DOCKET</small></a></div>
      </header>
      <div className="shell section" style={{ maxWidth: 520 }}>
        <div className="docket">
          <span className="docket-tab">Sign in</span>
          <div className="docket-body">
            <h1 style={{ fontFamily: 'var(--font-fraunces)', fontSize: 24, margin: '0 0 10px' }}>That sign in could not be completed.</h1>
            <p className="muted" style={{ marginTop: 0 }}>Start the Google sign in again. If it keeps failing, your browser may be blocking third-party cookies.</p>
            <a className="btn" href="/signin" style={{ marginTop: 16 }}>Try signing in again</a>
          </div>
        </div>
      </div>
    </main>
  );
}
