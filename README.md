# Internet Court — Premium React design demo

An original editorial website for everyday disagreements, built with React, TypeScript, Vite, and Motion using [premium-next-react](https://github.com/SohailKhan0525/skills/tree/main/skills/premium-next-react).

This demo lives on `demo/premium-next-react`. Existing branches, including `main`, were preserved.

## Run

```bash
npm ci
npm run dev
```

```bash
npm run check
npm test
npm run build
```

The static production output is `dist/`. Vercel configuration is included; the private Sites preview uses `.openai/hosting.json`. A matching `404.html` provides the app's recovery view on compatible static hosts. It is a client-rendered demo and requires JavaScript for interactions.

## Experience

- Original dimensional SVG gavel with a finite, user-triggered Motion animation.
- Responsive editorial typography, semantic design tokens, custom case illustrations, and native scrolling.
- Case filters, complete claim/defence/evidence dialogs, personal verdicts, and verdict changes.
- A validated private case draft with download and browser-storage recovery states.
- Native modal dialogs, focus return, keyboard navigation, reduced-motion treatment, and local font files.

All cases are fictional. Votes and drafts stay in this browser. There is no public submission, public vote total, authentication, analytics, or backend. A successful draft save means browser storage accepted it; the UI never claims public delivery.

## Design and attribution

Read [DESIGN.md](DESIGN.md) for the direction, motion/state contracts, and verification record. All case narratives, SVG artwork, and styling in this branch are original. The skill's research notes credit the reference sources that informed its process.

DM Sans and Libre Caslon Display are distributed under the SIL Open Font License; their notices are preserved in [public/licenses](public/licenses). React, Motion, Vite, and other packages retain their respective package licenses.

## Validation

The production build/type check and twelve persistence/validation tests pass. Local browser QA could not run because this workspace's managed preview daemon was unavailable. This is not a claim of verified WCAG conformance or measured Core Web Vitals.
