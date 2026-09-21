'use client';

import { useEffect, useState } from 'react';
import { getSupabase } from '../../../lib/supabase';
import DocketHeader from '../../components/DocketHeader';
import { useToast } from '../../components/Toast';

type Report = {
  id: string; reason: string; details: string | null; status: string; created_at: string;
  case_id: string; case_slug: string; case_title: string; case_status: string;
  reporter_username: string | null;
};

export default function AdminReportsPage() {
  const { showToast } = useToast();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [authorized, setAuthorized] = useState(false);
  const [reports, setReports] = useState<Report[]>([]);
  const [busyId, setBusyId] = useState<string | null>(null);

  async function load() {
    const { data, error } = await getSupabase().rpc('list_reports');
    if (error) {
      setAuthorized(false);
      showToast(error.message, 'error');
      return;
    }
    setAuthorized(true);
    setReports((data ?? []) as Report[]);
  }

  useEffect(() => {
    getSupabase().auth.getUser().then(async ({ data }) => {
      if (!data.user) {
        window.location.href = '/signin?next=/admin/reports';
        return;
      }
      setUser(data.user);
      await load();
      setLoading(false);
    });
  }, []);

  async function resolve(reportId: string, removeCase: boolean) {
    setBusyId(reportId);
    const { error } = await getSupabase().rpc('resolve_report', { p_report_id: reportId, p_remove_case: removeCase });
    setBusyId(null);
    if (error) {
      showToast(error.message, 'error');
      return;
    }
    showToast(removeCase ? 'Report resolved, case removed.' : 'Report resolved.', 'success');
    await load();
  }

  if (loading) {
    return (
      <main className="site">
        <DocketHeader user={user} currentPath="/admin/reports" />
        <div className="shell section"><p className="muted">Loading…</p></div>
      </main>
    );
  }

  if (!authorized) {
    return (
      <main className="site">
        <DocketHeader user={user} currentPath="/admin/reports" />
        <div className="shell section" style={{ maxWidth: 480 }}>
          <p className="kicker">Reports</p>
          <h1 className="display" style={{ fontSize: 28, marginTop: 8 }}>Not authorized.</h1>
          <p className="muted">This page is restricted to court administrators.</p>
        </div>
      </main>
    );
  }

  const pending = reports.filter((report) => report.status === 'pending' || report.status === 'reviewing');
  const handled = reports.filter((report) => report.status === 'resolved' || report.status === 'dismissed');

  return (
    <main className="site">
      <DocketHeader user={user} currentPath="/admin/reports" />
      <div className="shell section" id="main">
        <p className="kicker">Moderation</p>
        <h1 className="display" style={{ fontSize: 'clamp(28px,4vw,38px)', marginTop: 8 }}>Reports</h1>
        <p className="lede" style={{ marginTop: 12 }}>{pending.length} pending, {handled.length} resolved.</p>

        <div style={{ display: 'grid', gap: 16, marginTop: 28 }}>
          {pending.length === 0 && <p className="muted">No pending reports. All clear.</p>}
          {pending.map((report) => (
            <div className="docket" key={report.id}>
              <span className="docket-tab">{report.reason.replace('_', ' ')}</span>
              <div className="docket-body">
                <p className="mono" style={{ fontSize: 11, color: 'var(--ink-faint)', margin: '0 0 6px' }}>
                  No. {report.case_slug} · reported by @{report.reporter_username ?? 'unknown'} · {new Date(report.created_at).toLocaleString()}
                </p>
                <h3 style={{ fontSize: 18, margin: '0 0 8px' }}><a href={`/c/${report.case_slug}`} target="_blank" rel="noopener noreferrer">{report.case_title}</a></h3>
                {report.details && <p className="muted" style={{ fontSize: 14, marginBottom: 12 }}>"{report.details}"</p>}
                <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                  <button className="btn-outline btn" disabled={busyId === report.id} onClick={() => resolve(report.id, false)}>Dismiss (case stays up)</button>
                  <button className="btn" disabled={busyId === report.id} onClick={() => resolve(report.id, true)}>Remove case</button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {handled.length > 0 && (
          <>
            <hr className="rule" style={{ margin: '40px 0 24px' }} />
            <h2 className="section-head" style={{ fontSize: 20, marginBottom: 16 }}>Resolved</h2>
            <div style={{ display: 'grid', gap: 10 }}>
              {handled.map((report) => (
                <p key={report.id} className="faint" style={{ fontSize: 13 }}>
                  {report.reason.replace('_', ' ')} on <a href={`/c/${report.case_slug}`}>{report.case_title}</a> — {report.case_status === 'removed' ? 'case removed' : 'dismissed'}
                </p>
              ))}
            </div>
          </>
        )}
      </div>
    </main>
  );
}
