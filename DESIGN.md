# Internet Court design study

Built using the updated `premium-next-react` skill, including its visitor-intent, token, state, motion, and quality references.

## Purpose and page role

A playful editorial homepage, reached through a shared demo link. The visitor needs to understand the premise, inspect a fictional disagreement, and make a private judgement. Secondary intent: try writing a harmless case draft. Cases are fictional; the experience has no legal powers or public community data.

## Direction

Two compositions were considered: a dense newspaper docket and a sculptural courtroom poster. The selected direction combines a spacious poster-like introduction with an editorial case index. The subject supplies its identity: gavel, docket numbers, exhibits, testimony, verdicts, and a deliberately low-stakes voice.

Warm paper, dark olive ink, and acid green carry the composition. Libre Caslon Display provides an expressive headline voice; DM Sans handles navigation, controls, and reading. The hero's original shaded SVG gavel provides depth without loading a 3D engine. Case illustrations express the actual disputes.

No testimonial strips, pricing tables, invented community counts, forced intro, custom cursor, or scroll interception are needed.

## Token contract

| Role | Implementation | Review target |
| --- | --- | --- |
| Display/section type | Libre Caslon Display, fluid limits and compact leading | Long headings and narrow viewports |
| Reading/controls | DM Sans Variable | Labels, testimony, form fields |
| Canvas/ink/quiet/action | `--paper`, `--ink`, `--muted`, `--acid` | Actual text pairs and active controls |
| Layout | `--gutter`, `--section-space`, bounded `.shell` | Mobile reading order and wide composition |
| Shape | Circular controls, compact file corners, one cutaway hero corner | Clear role differences |
| Feedback | Named success/error colors and visible focus | Keyboard and blocked storage |

## Motion contract

| Trigger | Change and purpose | Rest/reduced motion |
| --- | --- | --- |
| Call court to order | Finite gavel swing/impact, initiated by the visitor | Full static illustration; no loop |
| Case filter | Shared selection marker; layout continuity | Immediate selection and stable content |
| Case hover | Small drawing/arrow response | Visible focus and click/tap work independently |
| Confirmation | Brief status appearance | Immediate readable status |

Core copy never starts at opacity zero. Native scrolling remains intact. There are no autoplay videos, WebGL loops, or tracking requests.

## Interaction states

| Component | States | Recovery |
| --- | --- | --- |
| Navigation | Rest, hover, focus, anchor location, mobile open | Escape closes mobile navigation; real anchors |
| Case dialog | Open, close, no verdict, selected verdict, changed verdict | Native modal keyboard behavior and focus return |
| Votes | Unsaved selection, browser-persisted, storage unavailable | Selection works for the visit if storage is blocked |
| Case draft | Editing, invalid, saved, storage unavailable | Keep text, focus invalid field, offer download |
| Unknown URL | Branded recovery view | Return to homepage |

## Verification

- TypeScript and production build run successfully.
- Twelve node:test cases cover corrupted storage, invalid vote IDs/values, blocked/quota storage, draft truncation, and validation boundaries.
- Source review checked modal focus, visible status inside native dialog, finite/reduced motion, direct URLs, and honest persistence copy.
- Local browser QA was unavailable: `sites-preview` reported a missing preview-daemon mailbox. No screenshots, mobile interaction pass, Lighthouse score, or field performance pass are claimed.
- The HTML includes an explicit JavaScript-disabled explanation, descriptive metadata, favicon, noindex for this private demo, and a generated static 404 entry.

These are implementation records, not proof of visual quality or accessibility conformance.
