export default function NotFound() {
  return (
    <main className="site">
      <header className="docket-header">
        <div className="shell"><a href="/" className="wordmark">INTERNET COURT<small>PUBLIC CASE DOCKET</small></a></div>
      </header>
      <div className="shell section" id="main" style={{ maxWidth: 560 }}>
        <p className="kicker">No. 404</p>
        <h1 className="display" style={{ fontSize: 'clamp(28px,4vw,40px)', marginTop: 8 }}>No case on file.</h1>
        <p className="lede" style={{ marginTop: 12 }}>The page may have been removed, or the link may be wrong.</p>
        <div style={{ display: 'flex', gap: 12, marginTop: 28, flexWrap: 'wrap' }}>
          <a className="btn" href="/">Return to court</a>
          <a className="btn btn-outline" href="/pricing">See membership</a>
        </div>
      </div>
    </main>
  );
}
