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

  return (
    <header className="docket-header">
      <div className="shell">
        <a href="/" className="wordmark">INTERNET COURT<small>PUBLIC CASE DOCKET</small></a>
        <nav className="header-links" aria-label="Primary">
          <a className="header-link header-link-secondary" href="/pricing">Pricing</a>
          <a className="header-link header-link-secondary" href="/contact">Contact</a>
          {user ? (
            <button className="btn-quiet header-link" type="button" onClick={signOut}>Sign out</button>
          ) : (
            <a className="header-link" href={`/signin?next=${encodeURIComponent(currentPath)}`}>Sign in</a>
          )}
          <a className="btn" href="/new">File a case</a>
        </nav>
      </div>
    </header>
  );
}
