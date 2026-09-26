'use client';

import { useEffect, useState } from 'react';
import { getSupabase } from '../lib/supabase';
import DocketHeader from './components/DocketHeader';
import ComparisonTable from './components/ComparisonTable';
import { ArrowRight } from '@phosphor-icons/react';

export default function Home() {
  const [user, setUser] = useState<any>(null);
  type HighlightRow = { slug: string; title: string; for_votes: number; against_votes: number; view_count: number; comment_count: number };
  const [highlights, setHighlights] = useState<{ popular: HighlightRow[]; trending: HighlightRow[]; most_commented: HighlightRow[] }>({ popular: [], trending: [], most_commented: [] });

  useEffect(() => {
    const supabase = getSupabase();
    supabase.auth.getUser().then(({ data }) => setUser(data.user));
    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => setUser(session?.user ?? null));
    return () => listener.subscription.unsubscribe();
  }, []);

  useEffect(() => {
    getSupabase().rpc('get_homepage_case_highlights').then(({ data }) => {
      if (!data) return;
      const grouped: { popular: HighlightRow[]; trending: HighlightRow[]; most_commented: HighlightRow[] } = { popular: [], trending: [], most_commented: [] };
      (data as (HighlightRow & { category: 'popular' | 'trending' | 'most_commented' })[]).forEach((row) => {
        grouped[row.category].push(row);
      });
      setHighlights(grouped);
    });
  }, []);

  const faqStructuredData = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: [
      { '@type': 'Question', name: 'Can anyone read a public case?', acceptedAnswer: { '@type': 'Answer', text: 'Yes. Public cases are designed to be opened and shared by anyone. You only need to sign in when you want to vote or file a case.' } },
      { '@type': 'Question', name: 'How is the verdict decided?', acceptedAnswer: { '@type': 'Answer', text: 'The verdict is based on the stored for and against vote totals. There is no hidden consensus score.' } },
      { '@type': 'Question', name: 'Do I need a password?', acceptedAnswer: { '@type': 'Answer', text: 'No. Internet Court uses Google sign in, so you can enter without creating or remembering another password.' } },
      { '@type': 'Question', name: 'Can I report a case?', acceptedAnswer: { '@type': 'Answer', text: 'Yes. Every public case has a reporting path for abuse such as harassment, threats, personal data, hate and spam.' } },
      { '@type': 'Question', name: 'Is filing a case free?', acceptedAnswer: { '@type': 'Answer', text: 'Public cases are free to file. Membership is for people who want more control over their cases and identity.' } },
      { '@type': 'Question', name: 'Does Internet Court use fake votes?', acceptedAnswer: { '@type': 'Answer', text: 'No. The product is built around real authenticated votes and server side checks. Nothing is seeded.' } },
    ],
  };

  return (
    <div className="site">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqStructuredData) }} />
      <DocketHeader user={user} currentPath="/" />

      <main id="main">
        {/* Hero */}
        <section className="shell hero-grid">
          <div>
            <p className="kicker">Filed in the court of public opinion</p>
            <h1 className="display" style={{ marginTop: 12 }}>Someone is wrong.<br />Probably you.</h1>
            <p className="lede" style={{ marginTop: 20 }}>Put your argument on trial. Let strangers vote. Get a verdict worth sending to the group chat.</p>
            <div style={{ display: 'flex', gap: 12, marginTop: 32, flexWrap: 'wrap' }}>
              <a className="btn" href="/new">File a case <ArrowRight className="btn-icon" weight="bold" size={16} /></a>
              <a className="btn btn-outline" href="#how">See how it works</a>
            </div>
            <p className="faint" style={{ marginTop: 24, fontSize: 13 }}>Real votes, permanent case links, no fabricated activity — see our <a href="/terms" style={{ textDecoration: 'underline' }}>terms</a>.</p>
          </div>

          <div className="case-mock" aria-hidden="true">
            <div className="case-mock-bar"><span>No. 2026-PUB-0001</span><span>Illustrative example</span></div>
            <div className="case-mock-body">
              <h3>"I ate the last slice. My roommate says I owe them."</h3>
              <p>Filed by a real user, voted on by real strangers. This is what a filing looks like — not an actual case.</p>
              <div className="vote-bar"><div className="vote-bar-for" style={{ width: '54%' }} /><div className="vote-bar-against" style={{ width: '46%' }} /></div>
              <div className="vote-meta"><span>FOR · 54%</span><span>AGAINST · 46%</span></div>
              <div style={{ marginTop: 16 }}><span className="stamp">VERDICT PENDING</span></div>
            </div>
          </div>
        </section>

        <hr className="rule shell" />

        {/* How it works — genuinely a sequence */}
        <section className="shell section" id="how">
          <p className="kicker">How it works</p>
          <h2 className="section-head" style={{ marginTop: 8 }}>Three steps to a verdict.</h2>
          <div className="steps-grid">
            <div>
              <p className="mono" style={{ fontSize: 13, color: 'var(--ink-faint)', marginBottom: 8 }}>Step 1</p>
              <h3 style={{ fontSize: 19, margin: '0 0 8px' }}>File the case</h3>
              <p className="muted" style={{ fontSize: 15, lineHeight: 1.5 }}>Write the argument the way you'd actually explain it to someone. No character-limit gimmicks.</p>
            </div>
            <div>
              <p className="mono" style={{ fontSize: 13, color: 'var(--ink-faint)', marginBottom: 8 }}>Step 2</p>
              <h3 style={{ fontSize: 19, margin: '0 0 8px' }}>Strangers vote</h3>
              <p className="muted" style={{ fontSize: 15, lineHeight: 1.5 }}>Anyone with a public link can read it. Signed-in users cast one real vote per case.</p>
            </div>
            <div>
              <p className="mono" style={{ fontSize: 13, color: 'var(--ink-faint)', marginBottom: 8 }}>Step 3</p>
              <h3 style={{ fontSize: 19, margin: '0 0 8px' }}>Get the verdict</h3>
              <p className="muted" style={{ fontSize: 15, lineHeight: 1.5 }}>The verdict is just the real vote count. Share the link, settle the argument.</p>
            </div>
          </div>
        </section>

        <hr className="rule shell" />

        {highlights.popular.length > 0 && (
          <section className="shell section">
            <p className="kicker">On the docket now</p>
            <h2 className="section-head" style={{ marginTop: 8, marginBottom: 24 }}>What people are voting on.</h2>
            <div className="highlights-grid">
              {(['popular', 'trending', 'most_commented'] as const).map((category) => {
                const rows = highlights[category];
                if (rows.length === 0) return null;
                const heading = category === 'popular' ? 'Most voted' : category === 'trending' ? 'Trending' : 'Most commented';
                return (
                  <div key={category}>
                    <p className="mono" style={{ fontSize: 11, color: 'var(--ink-faint)', marginBottom: 10, letterSpacing: '.04em', textTransform: 'uppercase' }}>{heading}</p>
                    <div style={{ display: 'grid', gap: 10 }}>
                      {rows.map((row) => (
                        <a className="docket" href={`/c/${row.slug}`} key={`${category}-${row.slug}`} style={{ display: 'block' }}>
                          <div className="docket-body" style={{ padding: 14 }}>
                            <p style={{ margin: '0 0 6px', fontSize: 14, fontWeight: 600, lineHeight: 1.35 }}>{row.title}</p>
                            <p className="faint mono" style={{ fontSize: 11, margin: 0 }}>
                              {row.for_votes + row.against_votes} votes · {row.view_count} views{row.comment_count > 0 ? ` · ${row.comment_count} comments` : ''}
                            </p>
                          </div>
                        </a>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        )}

        <hr className="rule shell" />

        {/* Comparison vs alternatives */}
        <section className="shell section">
          <p className="kicker">The alternative</p>
          <h2 className="section-head" style={{ marginTop: 8 }}>You have other ways to settle this.</h2>
          <p className="muted" style={{ marginBottom: 24 }}>Here's how they stack up.</p>
          <ComparisonTable
            columns={['Internet Court', 'Group chat', 'Reddit thread', 'Actual court']}
            highlightColumn={0}
            rows={[
              { label: 'Ends with a real verdict', values: ['Yes, a number decides', 'Never. Still going.', 'Upvotes, not a verdict', 'Yes. Legally binding.'] },
              { label: 'Costs to start', values: ['Free', 'Free', 'Free', 'Filing fees + a lawyer'] },
              { label: 'Time to a result', values: ['Minutes', 'Eternal', 'Buried by page 2', 'Months, maybe years'] },
              { label: 'Your mom can see it', values: ['Only if you share it', "She's already in the chat", 'Anonymous, so no', 'Public record, so yes'] },
            ]}
            caption="We're not replacing small claims court. We're replacing the group chat argument that never actually ends."
          />
        </section>

        <hr className="rule shell" />

        {/* FAQ */}
        <section className="shell section">
          <p className="kicker">Questions</p>
          <h2 className="section-head" style={{ marginTop: 8, marginBottom: 24 }}>What people ask before filing.</h2>
          <div style={{ display: 'grid', gap: 20, maxWidth: 720 }}>
            {faqStructuredData.mainEntity.map((item) => (
              <div key={item.name} style={{ borderBottom: '1px solid var(--paper-line)', paddingBottom: 20 }}>
                <h3 style={{ fontSize: 17, margin: '0 0 6px' }}>{item.name}</h3>
                <p className="muted" style={{ fontSize: 15, lineHeight: 1.55, margin: 0 }}>{item.acceptedAnswer.text}</p>
              </div>
            ))}
          </div>
        </section>

        <hr className="rule shell" />

        {/* Membership CTA */}
        <section className="shell section cta-row">
          <div>
            <p className="kicker">Membership</p>
            <h2 className="section-head" style={{ marginTop: 8, marginBottom: 8 }}>Keep the jury free. Pay for more control.</h2>
            <p className="muted" style={{ margin: 0, maxWidth: 480 }}>Free users can file public cases and vote. Membership adds private and unlisted cases.</p>
          </div>
          <a className="btn" href="/pricing">See membership <ArrowRight className="btn-icon" weight="bold" size={16} /></a>
        </section>
      </main>

      <footer className="docket-footer">
        <div className="shell">
          <span>Internet Court</span>
          <span style={{ display: 'flex', gap: 16 }}>
            <a href="/pricing">Membership</a>
            <a href="/contact">Contact</a>
            <a href="/privacy">Privacy</a>
            <a href="/terms">Terms</a>
            <a href="https://x.com/qofeno" target="_blank" rel="me noopener noreferrer">X</a>
          </span>
        </div>
      </footer>
    </div>
  );
}
