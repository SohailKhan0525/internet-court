'use client';

import { getSupabase } from '../../lib/supabase';

type DocketHeaderProps = {
  user: { email?: string | null } | null;
  currentPath?: string;
};

export default function DocketHeader({ user, currentPath = '/' }: DocketHeaderProps) {
  async function signOut() {
    await getSupabase().auth.signOut();
    window.location.href = '/';
  }

  const links = (
    <>
      <a className="header-link" href="/pricing">Pricing</a>
      <a className="header-link" href="/contact">Contact</a>
      {user ? (
        <>
          <a className="header-link" href="/settings">Settings</a>
          <button className="btn-quiet header-link" type="button" onClick={signOut}>Sign out</button>
        </>
      ) : (
        <a className="header-link" href={`/signin?next=${encodeURIComponent(currentPath)}`}>Sign in</a>
      )}
      <a className="btn" href="/new">File a case</a>
    </>
  );

  return (
    <header className="docket-header">
      <div className="shell">
        <a href="/" className="wordmark">INTERNET COURT<small>PUBLIC CASE DOCKET</small></a>

        {/* Desktop: full inline nav. Nothing here is ever hidden. */}
        <nav className="header-links header-links-desktop" aria-label="Primary">
          {links}
        </nav>

        {/* Mobile: every link still exists, just reorganised into a
            disclosure panel instead of squeezed into one row.
            <details>/<summary> needs no JS state and is keyboard/AT
            accessible by default — not a modal, doesn't block the page. */}
        <details className="header-menu">
          <summary className="header-menu-toggle" aria-label="Menu">
            <span />
            <span />
            <span />
          </summary>
          <nav className="header-menu-panel" aria-label="Menu">
            {links}
          </nav>
        </details>
      </div>
    </header>
  );
}
