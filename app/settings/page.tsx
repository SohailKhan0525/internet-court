'use client';

import { FormEvent, useEffect, useState } from 'react';
import { getSupabase } from '../../lib/supabase';
import { useToast } from '../components/Toast';
import DocketHeader from '../components/DocketHeader';

type Profile = { username: string; display_name: string; bio: string | null };

export default function SettingsPage() {
  const { showToast } = useToast();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [username, setUsername] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [bio, setBio] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    const supabase = getSupabase();
    supabase.auth.getUser().then(async ({ data }) => {
      if (!data.user) {
        window.location.href = '/signin?next=/settings';
        return;
      }
      setUser(data.user);
      const { data: profile } = await supabase
        .from('profiles')
        .select('username,display_name,bio')
        .eq('id', data.user.id)
        .maybeSingle<Profile>();
      if (profile) {
        setUsername(profile.username);
        setDisplayName(profile.display_name);
        setBio(profile.bio ?? '');
      }
      setLoading(false);
    });
  }, []);

  async function save(event: FormEvent) {
    event.preventDefault();
    setError('');
    setSaving(true);
    const { data, error: rpcError } = await getSupabase().rpc('update_profile', {
      p_username: username.trim().toLowerCase(),
      p_display_name: displayName.trim(),
      p_bio: bio.trim() || null,
    });
    setSaving(false);
    if (rpcError) {
      setError(rpcError.message);
      showToast(rpcError.message, 'error');
      return;
    }
    const saved = Array.isArray(data) ? data[0] : data;
    if (saved?.username) setUsername(saved.username);
    showToast('Profile saved.', 'success');
  }

  async function signOutEverywhere() {
    await getSupabase().auth.signOut({ scope: 'global' });
    window.location.href = '/';
  }

  if (loading) {
    return (
      <main className="site">
        <DocketHeader user={user} currentPath="/settings" />
        <div className="shell section"><p className="muted">Loading your profile…</p></div>
      </main>
    );
  }

  return (
    <main className="site">
      <DocketHeader user={user} currentPath="/settings" />
      <div className="shell section" id="main" style={{ maxWidth: 620 }}>
        <p className="kicker">Settings</p>
        <h1 className="display" style={{ fontSize: 'clamp(28px,4vw,38px)', marginTop: 8 }}>Your profile</h1>
        <p className="lede" style={{ marginTop: 12 }}>This is what people see on your public profile and on every case you file.</p>

        <form onSubmit={save} style={{ marginTop: 28 }}>
          <div className="field">
            <label htmlFor="settings-username">Username</label>
            <input
              id="settings-username"
              required
              value={username}
              onChange={(event) => setUsername(event.target.value)}
              autoComplete="username"
            />
            <p className="field-hint">
              3–30 characters. Lowercase letters, numbers and underscores only. Your profile lives at
              {' '}loopproof.me/u/{username || 'your-username'}
            </p>
          </div>

          <div className="field">
            <label htmlFor="settings-display">Display name</label>
            <input
              id="settings-display"
              required
              maxLength={80}
              value={displayName}
              onChange={(event) => setDisplayName(event.target.value)}
              autoComplete="name"
            />
          </div>

          <div className="field">
            <label htmlFor="settings-bio">Bio</label>
            <textarea
              id="settings-bio"
              maxLength={280}
              value={bio}
              onChange={(event) => setBio(event.target.value)}
              style={{ minHeight: 100 }}
            />
            <p className="field-hint">{bio.length}/280 — optional.</p>
          </div>

          {error && <p className="error-text" role="alert">{error}</p>}

          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
            <button className="btn" type="submit" disabled={saving}>{saving ? 'Saving…' : 'Save changes'}</button>
            {username && <a className="btn btn-outline" href={`/u/${username}`}>View public profile</a>}
          </div>
        </form>

        <hr className="rule" style={{ margin: '40px 0 24px' }} />

        <h2 className="section-head" style={{ fontSize: 20, marginBottom: 8 }}>Account</h2>
        <p className="muted" style={{ fontSize: 15, marginTop: 0 }}>
          Signed in as {user?.email}. Signing out everywhere ends your session on every device.
        </p>
        <button className="btn btn-outline" type="button" onClick={signOutEverywhere} style={{ marginTop: 12 }}>
          Sign out everywhere
        </button>

        <hr className="rule" style={{ margin: '40px 0 24px' }} />

        <h2 className="section-head" style={{ fontSize: 20, marginBottom: 8 }}>Deleting your account</h2>
        <p className="muted" style={{ fontSize: 15, marginTop: 0 }}>
          Account deletion is handled by a person so that published verdicts are not silently
          rewritten. Email us from your account address through the{' '}
          <a href="/contact" style={{ textDecoration: 'underline' }}>contact page</a> and we will remove
          your account and your cases.
        </p>
      </div>
    </main>
  );
}
