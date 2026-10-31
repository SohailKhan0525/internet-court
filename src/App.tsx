import { useEffect, useRef, useState } from 'react';
import type { FormEvent, ReactNode } from 'react';
import { AnimatePresence, LayoutGroup, MotionConfig, motion, useReducedMotion } from 'motion/react';
import { cases } from './cases';
import type { CourtCase, Verdict } from './cases';
import { GavelScene } from './GavelScene';
import { DRAFT_KEY, VOTES_KEY, readDraft, readVotes, saveValue, validateDraft } from './persistence.mjs';

type Modal = { type: 'case'; id: string } | { type: 'file' } | null;
type Draft = { title: string; story: string };
const filters = ['All cases', 'Everyday life', 'Friendships', 'Work'] as const;

function Arrow({ diagonal = false, className = '' }: { diagonal?: boolean; className?: string }) {
  return <svg className={className} width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d={diagonal ? 'M6 18 18 6M6 6h12v12' : 'M4 12h16m-6-6 6 6-6 6'} stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" /></svg>;
}
function ScaleIcon({ size = 28 }: { size?: number }) {
  return <svg width={size} height={size} viewBox="0 0 32 32" fill="none" aria-hidden="true"><path d="M16 4v24M9 28h14M5 10h22M7 10 2 20h10L7 10Zm18 0-5 10h10l-5-10Z" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"/><circle cx="16" cy="7" r="2.5" fill="currentColor"/></svg>;
}
function Check() {
  return <svg width="19" height="19" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="m5 12 4 4 10-10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>;
}

function CaseArt({ type }: { type: CourtCase['illustration'] }) {
  const common = { stroke: '#282d25', strokeWidth: 2.2, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const };
  return <svg viewBox="0 0 220 160" fill="none" aria-hidden="true">
    {type === 'pizza' && <g {...common} transform="rotate(-12 110 80)"><ellipse cx="116" cy="140" rx="65" ry="7" fill="#282d25" opacity=".12" stroke="none"/><path d="M45 31c39-14 90-14 129 1l-64 108Z" fill="#f8dc7d"/><path d="M45 31c41-16 88-14 129 1l-4 16c-38-15-83-16-121-1Z" fill="#b96c3f"/><circle cx="90" cy="68" r="12" fill="#cf684c"/><circle cx="132" cy="64" r="11" fill="#cf684c"/><path d="M105 94c15-8 28 6 14 18" fill="#cf684c"/><path d="m67 56 8 4m43 19 7 4m-15-30 7-2" stroke="#60734c" strokeWidth="4"/><path d="M89 127v13m43-17 6 10M37 71l-10 4"/></g>}
    {type === 'chat' && <g {...common}><path d="M34 33h131v72H81l-25 22v-22H34Z" fill="#f6f3e9" transform="rotate(-6 100 70)"/><path d="M75 76h112v56h-20l-17 15v-15H75Z" fill="#9a91c3" transform="rotate(8 130 110)"/><path d="M57 53h82M57 67h58"/><circle cx="104" cy="103" r="3" fill="#282d25"/><circle cx="124" cy="105" r="3" fill="#282d25"/><circle cx="144" cy="108" r="3" fill="#282d25"/><path d="m179 33 8-11m0 23 13-2"/></g>}
    {type === 'music' && <g {...common}><ellipse cx="110" cy="134" rx="65" ry="8" fill="#282d25" stroke="none" opacity=".12"/><rect x="48" y="33" width="130" height="91" rx="9" fill="#edf0d6" transform="rotate(-9 110 80)"/><rect x="65" y="50" width="91" height="30" rx="12" fill="#667761" transform="rotate(-9 110 80)"/><circle cx="83" cy="69" r="9" fill="#edf0d6"/><circle cx="136" cy="60" r="9" fill="#edf0d6"/><path d="m79 115 6-23 56-8 13 20Z" fill="#bccda9"/><path d="M39 45v-16l-10 3v16m148-16V19l11-3v11"/><circle cx="26" cy="50" r="5" fill="#282d25"/><circle cx="36" cy="47" r="5" fill="#282d25"/></g>}
    {type === 'mug' && <g {...common}><ellipse cx="108" cy="138" rx="54" ry="7" fill="#282d25" opacity=".12" stroke="none"/><path d="M149 59h14c27 0 27 40 0 40h-14" strokeWidth="10"/><path d="M60 46h92v63c0 24-92 24-92 0Z" fill="#f6f2e7"/><ellipse cx="106" cy="46" rx="46" ry="12" fill="#b99974"/><path d="M83 20c-9-9 9-12 2-21m27 20c-9-9 9-12 2-21" stroke="#718899"/><text x="82" y="89" fill="#282d25" stroke="none" fontFamily="Georgia,serif" fontSize="18" transform="rotate(-5 105 85)">my mug.</text></g>}
  </svg>;
}

const rules = [
  ['Keep it petty. Keep it kind.', 'This is a place for harmless disagreements, not harassment. Leave out real names, private details, and anything that could put someone at risk.'],
  ['There are always two sides.', 'Read the claimant’s version, then the defence. A good verdict starts with a fair hearing—even when the pizza evidence looks pretty conclusive.'],
  ['Your opinion is not a court order.', 'This is playful perspective, not real adjudication. You can change your mind, disagree politely, and absolutely still be friends afterwards.'],
  ['What happens in this demo?', 'Every case is fictional. Your verdicts and any case draft are saved only in this browser. Nothing is submitted publicly, and there are no community vote totals.'],
];

function SectionLabel({ children }: { children: ReactNode }) { return <span className="eyebrow">{children}</span>; }

function CourtPage() {
  const reduce = useReducedMotion() !== false;
  const [filter, setFilter] = useState<string>('All cases');
  const [modal, setModal] = useState<Modal>(null);
  const [votes, setVotes] = useState<Record<string, Verdict>>({});
  const [draft, setDraft] = useState<Draft>({ title: '', story: '' });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saved, setSaved] = useState(false);
  const [toast, setToast] = useState('');
  const [menuOpen, setMenuOpen] = useState(false);
  const [strike, setStrike] = useState(0);
  const [activeNav, setActiveNav] = useState('');
  const dialog = useRef<HTMLDialogElement>(null);
  const returnFocus = useRef<HTMLElement | null>(null);
  const titleInput = useRef<HTMLInputElement>(null);
  const storyInput = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    try {
      setVotes(readVotes(localStorage, cases.map(item => item.id)) as Record<string, Verdict>);
      const prior = readDraft(localStorage);
      if (prior) setDraft(prior);
    } catch { /* Private browsing can make storage unavailable. Interactions still work. */ }
  }, []);
  useEffect(() => {
    if (!toast) return;
    const timer = window.setTimeout(() => setToast(''), 5500);
    return () => window.clearTimeout(timer);
  }, [toast]);
  useEffect(() => {
    if (modal && !dialog.current?.open) dialog.current?.showModal();
    if (!modal && dialog.current?.open) dialog.current?.close();
  }, [modal]);
  useEffect(() => {
    if (!modal) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = previous; };
  }, [modal]);
  useEffect(() => {
    const update = () => setActiveNav(window.location.hash);
    update();
    window.addEventListener('hashchange', update);
    return () => window.removeEventListener('hashchange', update);
  }, []);

  function openModal(next: Exclude<Modal, null>) {
    returnFocus.current = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    setMenuOpen(false); setErrors({}); setSaved(false); setModal(next);
  }
  function restoreFocus() {
    if (returnFocus.current?.isConnected) returnFocus.current.focus();
    else (document.querySelector('.mobile-menu-button') as HTMLElement | null)?.focus();
  }
  function closeModal() {
    dialog.current?.close(); setModal(null);
    restoreFocus();
  }
  function vote(item: CourtCase, verdict: Verdict) {
    const next = { ...votes, [item.id]: verdict };
    setVotes(next);
    let persisted = false;
    try { persisted = saveValue(localStorage, VOTES_KEY, next); } catch { /* handled below */ }
    setToast(persisted ? 'Verdict noted. Saved only on this device.' : 'Verdict noted for this visit. Your browser could not save it.');
  }
  function saveDraft(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const nextErrors = validateDraft(draft.title, draft.story) as Record<string, string>;
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length) {
      if (nextErrors.title) titleInput.current?.focus(); else storyInput.current?.focus();
      return;
    }
    let persisted = false;
    try { persisted = saveValue(localStorage, DRAFT_KEY, { title: draft.title.trim(), story: draft.story.trim() }); } catch { /* handled below */ }
    setSaved(persisted);
    if (!persisted) setErrors({ storage: 'Your browser could not save this draft. Your text is still here; download a copy instead.' });
  }
  function downloadDraft() {
    const content = `INTERNET COURT — PRIVATE DRAFT\n\n${draft.title.trim() || 'Untitled case'}\n\n${draft.story.trim()}\n\nThis draft has not been submitted or published.`;
    const url = URL.createObjectURL(new Blob([content], { type: 'text/plain;charset=utf-8' }));
    const link = document.createElement('a'); link.href = url; link.download = 'internet-court-private-draft.txt'; link.click();
    window.setTimeout(() => URL.revokeObjectURL(url), 1000);
    setToast('Your private draft is ready to download.');
  }
  const shown = cases.filter(item => filter === 'All cases' || item.category === filter);
  const selectedCase = modal?.type === 'case' ? cases.find(item => item.id === modal.id) : undefined;

  if (window.location.pathname !== '/' && window.location.pathname !== '/index.html') {
    return <main className="not-found"><ScaleIcon size={64}/><p className="eyebrow">Case not found · 404</p><h1>This case is<br/>out of our jurisdiction.</h1><p>Let’s get you back to something worth arguing about.</p><a href="/" className="button dark">Back to the court <Arrow/></a></main>;
  }

  return <>
    <a href="#main" className="skip-link">Skip to content</a>
    <header className="site-header shell">
      <a className="wordmark" href="/" aria-label="Internet Court home"><ScaleIcon/><span>internet court<span className="brand-dot">.</span></span></a>
      <nav className="desktop-nav" aria-label="Main navigation">
        {[['The docket', '#docket'], ['How it works', '#how-it-works'], ['House rules', '#house-rules']].map(([label, href]) => <a key={href} href={href} aria-current={activeNav === href ? 'location' : undefined}>{label}</a>)}
      </nav>
      <button className="button dark header-cta" onClick={() => openModal({ type: 'file' })}>File a case <Arrow diagonal/></button>
      <button className="mobile-menu-button" aria-label={menuOpen ? 'Close navigation' : 'Open navigation'} aria-expanded={menuOpen} aria-controls="mobile-navigation" onClick={() => setMenuOpen(!menuOpen)}><span className={menuOpen ? 'menu-lines open' : 'menu-lines'}/></button>
    </header>
    {menuOpen && <nav id="mobile-navigation" className="mobile-nav shell" aria-label="Mobile navigation" onKeyDown={event => { if (event.key === 'Escape') { setMenuOpen(false); (document.querySelector('.mobile-menu-button') as HTMLElement)?.focus(); } }}>
      <a href="#docket" onClick={() => setMenuOpen(false)}>The docket <Arrow/></a><a href="#how-it-works" onClick={() => setMenuOpen(false)}>How it works <Arrow/></a><a href="#house-rules" onClick={() => setMenuOpen(false)}>House rules <Arrow/></a><button className="button dark" onClick={() => openModal({ type: 'file' })}>File a case <Arrow diagonal/></button>
    </nav>}

    <main id="main">
      <section className="hero shell" aria-labelledby="hero-title">
        <div className="hero-copy">
          <SectionLabel><span className="status-dot"/> The court of public opinion</SectionLabel>
          <h1 id="hero-title">Small disputes.<br/><span>Big opinions.</span></h1>
          <p className="hero-description">For the things you really shouldn’t be arguing about.<br className="desktop-break"/> Hear both sides. Pick a side. Settle absolutely nothing.</p>
          <div className="hero-actions"><a className="button dark" href="#docket">Take a seat on the jury <Arrow/></a><button className="text-button" onClick={() => openModal({ type: 'file' })}>Or, make your case <Arrow diagonal/></button></div>
          <div className="hero-footnote"><span className="small-seal"><ScaleIcon size={20}/></span><span>No law degree required.<br/><strong>Just a very strong opinion.</strong></span></div>
        </div>
        <div className="hero-art">
          <div className="art-heading"><span>INTERNET COURT</span><span>EST. RIGHT NOW</span></div>
          <GavelScene strike={strike}/>
          <div className="art-stamp"><span>ORDER IN</span><span>THE INTERNET</span><span className="stamp-star">✳</span></div>
          <div className="art-bottom"><span>A little perspective.<br/>A lot of deliberation.</span><motion.button className="gavel-button" whileTap={reduce ? undefined : { scale: .94 }} aria-label="Call the court to order" onClick={() => { setStrike(value => value + 1); setToast('Order in the internet. The court is in session.'); }}><ScaleIcon size={23}/></motion.button></div>
        </div>
      </section>

      <div className="principle-strip"><div className="shell"><span>EVERY DISAGREEMENT HAS TWO SIDES.</span><span className="strip-star">✳</span><span>THE INTERNET HAS SEVERAL MORE.</span><span className="strip-star" aria-hidden="true">✳</span><span className="strip-final">LET’S HEAR THEM.</span></div></div>

      <section id="docket" className="docket-section shell" aria-labelledby="docket-title">
        <div className="section-heading"><div><SectionLabel>01 / Cases worth your time, probably</SectionLabel><h2 id="docket-title">On the docket<span className="accent-period">.</span></h2></div><p>Everyday drama.<br/>Extraordinary commitment to being right.</p></div>
        <div className="docket-toolbar"><LayoutGroup id="case-filters"><div className="filters" aria-label="Filter cases">{filters.map(value => <button key={value} className={value === filter ? 'filter active' : 'filter'} aria-pressed={value === filter} onClick={() => setFilter(value)}>{filter === value && <motion.span className="filter-highlight" layoutId="selected-filter" transition={{ duration: reduce ? 0 : .2 }}/>}<span>{value}</span></button>)}</div></LayoutGroup><span className="demo-label"><span/> Fictional cases · Demo edition</span></div>
        <div className="case-list" aria-live="polite" aria-relevant="additions removals">
          {shown.map(item => <motion.button key={item.id} className="case-row" layout={!reduce} initial={false} onClick={() => openModal({ type: 'case', id: item.id })} aria-label={`Open case ${item.number}: ${item.title}`}>
            <span className="case-number">{item.number}<span>CASE FILE</span></span>
            <span className={`case-art ${item.color}`}><CaseArt type={item.illustration}/></span>
            <span className="case-copy"><span className="case-category">{item.category}{votes[item.id] && <span className="voted-label"><Check/> You’ve ruled</span>}</span><span className="case-title">{item.title}</span><span className="case-summary">{item.summary}</span></span>
            <span className="case-open"><span>Hear the case</span><span className="circle-arrow"><Arrow diagonal/></span></span>
          </motion.button>)}
        </div>
        <div className="docket-foot"><span>THE VERDICT IS YOURS. THE STAKES ARE LOW.</span><span>{shown.length.toString().padStart(2, '0')} CASES ON THE DOCKET</span></div>
      </section>

      <section id="how-it-works" className="how-section" aria-labelledby="how-title"><div className="shell how-layout">
        <div className="how-intro"><SectionLabel>02 / A fair hearing</SectionLabel><h2 id="how-title">A little drama.<br/>Due process.</h2><p>You don’t need a robe or a gavel.<br/>Although we do think they help.</p><div className="justice-mark" aria-hidden="true"><ScaleIcon size={86}/><span>FAIR ENOUGH™</span></div></div>
        <div className="steps">
          {[['Bring the evidence.', 'The group chat. The last slice. The “quick question” at 5:59. There’s a case in there somewhere.'], ['Hear both sides.', 'Read the claim and the defence. Give everyone their moment. Yes, even the person who ate your leftovers.'], ['Make the call.', 'Trust your judgement. Cast your verdict. Change your mind if the defence makes a suspiciously good point.']].map(([title, body], index) => <div className="step" key={title}><span className="step-number">0{index + 1}</span><div><h3>{title}</h3><p>{body}</p></div><span className="step-spark" aria-hidden="true">{index === 0 ? '↗' : index === 1 ? '↔' : '✓'}</span></div>)}
        </div>
      </div></section>

      <section id="house-rules" className="rules-section shell" aria-labelledby="rules-title"><div><SectionLabel>03 / Before we proceed</SectionLabel><h2 id="rules-title">A few<br/>house rules.</h2><p>Strong opinions.<br/>Soft landings.</p></div><div className="rules-list">{rules.map(([title, body], index) => <details key={title} open={index === 0 ? true : undefined}><summary><span className="rule-index">0{index + 1}</span>{title}<span className="plus" aria-hidden="true"/></summary><p>{body}</p></details>)}</div></section>

      <section className="closing-section shell" aria-labelledby="closing-title"><div className="closing-top"><SectionLabel>The court is always in session</SectionLabel><ScaleIcon size={37}/></div><div className="closing-content"><h2 id="closing-title">Got a case?<br/><span>We’re all ears.</span></h2><div><p>That disagreement isn’t going<br/>to overthink itself.</p><button className="button dark" onClick={() => openModal({ type: 'file' })}>Make your case <Arrow diagonal/></button></div></div><div className="closing-bottom"><span>NO LEGAL POWERS.</span><span>PLENTY OF OPINIONS.</span></div></section>
    </main>

    <footer className="site-footer shell"><a className="wordmark" href="/"><ScaleIcon/><span>internet court.</span></a><p>A little less arguing. A little more perspective.</p><a href="#main" className="back-top">Back to top <Arrow diagonal/></a><div className="footer-note"><span>© 2026 Internet Court · A fictional design study.</span><span>Your verdicts and drafts stay on this device.</span></div></footer>

    <dialog ref={dialog} className="court-dialog" aria-labelledby="dialog-title" onCancel={event => { event.preventDefault(); closeModal(); }} onClose={() => { setModal(null); restoreFocus(); }} onClick={event => { if (event.target === dialog.current) { const bounds = dialog.current.getBoundingClientRect(); if (event.clientX < bounds.left || event.clientX > bounds.right || event.clientY < bounds.top || event.clientY > bounds.bottom) closeModal(); } }}>
      <button type="button" className="dialog-close" aria-label="Close dialog" onClick={closeModal}>×</button>
      {selectedCase && <div className="case-dialog-content"><SectionLabel>Case file {selectedCase.number} / {selectedCase.category}</SectionLabel><h2 id="dialog-title">{selectedCase.title}</h2><p className="dialog-demo-note">Fictional case. Your verdict is private to this device.</p><div className="testimonies"><article><span className="testimony-label">THE CLAIM</span><p>“{selectedCase.claimant}”</p></article><article><span className="testimony-label">THE DEFENCE</span><p>“{selectedCase.respondent}”</p></article></div><div className="evidence"><h3>Exhibits for your consideration</h3><ul>{selectedCase.evidence.map(text => <li key={text}>{text}</li>)}</ul></div><div className="verdict-area"><h3>{votes[selectedCase.id] ? 'Your ruling is on record.' : 'The court awaits your opinion.'}</h3><div className="verdict-buttons">{(['claimant', 'respondent'] as const).map(side => <button className={votes[selectedCase.id] === side ? 'verdict-button selected' : 'verdict-button'} key={side} aria-pressed={votes[selectedCase.id] === side} onClick={() => vote(selectedCase, side)}><span>{side === 'claimant' ? selectedCase.claimantLabel : selectedCase.respondentLabel}</span>{votes[selectedCase.id] === side ? <Check/> : <Arrow/>}</button>)}</div><p>{votes[selectedCase.id] ? 'Changed your mind? Select the other side. That’s allowed here.' : 'No public vote counts. Just your considered judgement.'}</p></div></div>}
      {modal?.type === 'file' && <div className="file-dialog-content"><SectionLabel>A matter for the internet</SectionLabel><h2 id="dialog-title">Make your case.</h2><p className="form-intro">Tell the story. Leave out real names and private details. Give the other side a fair hearing.</p><form onSubmit={saveDraft} noValidate><label htmlFor="case-title">Give it a title <span>{draft.title.length}/100</span></label><input ref={titleInput} id="case-title" name="title" required maxLength={100} value={draft.title} placeholder="The curious case of the missing leftovers" aria-invalid={!!errors.title} aria-describedby={errors.title ? 'title-error' : undefined} onChange={event => { setDraft({ ...draft, title: event.target.value }); setSaved(false); }}/>{errors.title && <p id="title-error" className="field-error">{errors.title}</p>}<label htmlFor="case-story">What happened? <span>{draft.story.length}/1,200</span></label><textarea ref={storyInput} id="case-story" name="story" required rows={6} maxLength={1200} value={draft.story} placeholder="Your side, their side, and the evidence worth hearing…" aria-invalid={!!errors.story} aria-describedby={errors.story ? 'story-error' : undefined} onChange={event => { setDraft({ ...draft, story: event.target.value }); setSaved(false); }}/>{errors.story && <p id="story-error" className="field-error">{errors.story}</p>}<div className="draft-notice"><ScaleIcon size={22}/><p>This is a private draft. This demo saves it on your device and does not post it to the internet.</p></div><div role="status">{saved && <p className="save-success"><Check/> Draft saved on this device. Nothing has been posted.</p>}{errors.storage && <p className="field-error">{errors.storage}</p>}</div><div className="form-actions"><button type="submit" className="button dark">Save my draft <Arrow/></button><button type="button" className="text-button" onClick={downloadDraft} disabled={!draft.title.trim() && !draft.story.trim()}>Download a copy <Arrow diagonal/></button></div></form></div>}
      <div className="dialog-feedback" role="status" aria-live="polite">{modal && toast && <p><Check/>{toast}</p>}</div>
    </dialog>
    <div className="toast-region" role="status" aria-live="polite"><AnimatePresence>{toast && !modal && <motion.div className="toast" key={toast} initial={{ opacity: 0, y: reduce ? 0 : 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: reduce ? 0 : 8 }} transition={{ duration: reduce ? 0 : .2 }}><Check/><span>{toast}</span><button aria-label="Dismiss notification" onClick={() => setToast('')}>×</button></motion.div>}</AnimatePresence></div>
  </>;
}

export function App() {
  return <MotionConfig reducedMotion="user" transition={{ duration: .24, ease: [.22, 1, .36, 1] }}><CourtPage/></MotionConfig>;
}
