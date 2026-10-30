# Internet Court — Unslop redesign

Built with [Unslop](https://github.com/heydamir/unslop) by Damir Sokolovsky ([@heydamir](https://x.com/heydamir)), CC BY 4.0. The previous cream-and-burgundy version and first story remain in Git history. This revision responds to the user's supplied 7.77-second, 3840 × 2156, 60 fps reference video.

## Audit

- The previous hero paired a large three-line serif headline with a small engraving and a paper card; the illustration and product did not read as one scene.
- The previous video showed too much of the page in a square crop, leaving the meaningful changes too small.
- The live page had hover feedback but almost no visible entrance or interaction animation.
- The paper card repeated the same example later in the page without letting visitors use it immediately.
- The mixed serif hierarchy, repeated labels, and large empty areas made the page feel more like a document than an internet product.
- Hidden line breaks needed explicit spaces for readable mobile copy.

## Direction

1. **Product:** a court of public opinion for people arguing about everyday, low-stakes disagreements.
2. **Character:** wry, decisive, theatrical.
3. **World:** a quiet courtroom after hours, charcoal surroundings, brass scales, evidence and receipts.
4. **Moments:** a large brass scale weighing a pizza slice against a note; a working case preview rising below the hero.
5. **Signature:** evidence labels tied to the scene and yes/no characters forming the scale's surface.

## Nine passes

1. **Spacing:** a 1280px content area, 4px rhythm, 112px hero offset, 24–32px content grouping, and consistent control heights. Mobile stacks the copy, scene, and preview.
2. **Color:** charcoal surfaces, three readable text roles, warm brass as the limited accent, and quiet white primary controls. The richness stays in the scene.
3. **Icons:** the existing line-icon system, one stroke weight; no decorative emoji.
4. **Copy:** “Your group chat needs a jury” names the audience and reason to use the product. Fictional cases and local-only votes remain labeled.
5. **Type:** Instrument Sans at 400–500, with size and contrast establishing hierarchy. No all-caps tracking or italic emphasis.
6. **Layout:** a full-width scene with text in its calm left half, followed by an interactive product preview. The remaining how-to, docket, comparison, questions, and closing content retains its order.
7. **Details:** matched 8px controls and 12px panels, explicit focus states, real two-sided case content, keyboard-operable tabs, and accessible native dialogs.
8. **Visuals:** a custom generated brass scale scene, then a canvas glyph treatment using yes/no characters. Pixel data is read once; the finished layer is cached and never continuously redrawn.
9. **Motion:** one staggered hero entrance; evidence labels appear in sequence; selected cases enter over 360ms; votes acknowledge the choice over 400ms; dialogs rise over 360ms; menus and FAQ content use short fade/rise transitions. One easing curve, transform/opacity feedback, no parallax, no fake live pulses, and no perpetual loops. Reduced-motion mode removes animations and shows the original static scene.

## Image asset and prompt

Asset: `assets/justice-scene.webp`, generated with OpenAI's built-in image tool; source image 1672 × 941. Exported as WebP for the site.

Prompt: “One elegant sculptural brass balance scale is weighing a single small realistic pepperoni pizza slice in the left hanging pan against a folded cream paper note in the right hanging pan. The balance is very slightly tilted. Strong realistic silhouette: central turned brass stem, beautiful slim symmetrical crossbar and two delicate chains per pan, matte black circular pedestal. Refined brushed warm brass, a little patina, soft warm rim lighting, restrained charcoal reflections, soft contact shadow. Subject fills the right half of a wide 16:9 composition; the left 45% is calm empty dark charcoal #101110 for HTML copy. The lower 15% is calm and dark for a coded product preview. Crisp studio product photography and cinematic still life. No ornamental filigree, colored haze, spotlight circle, blue or purple, decorative glows, grain, text, logos, UI, badges, or watermark.”

## Verification

- JavaScript syntax and static production build pass.
- Desktop composition and 390px phone layout visually reviewed; the mobile body does not overflow horizontally.
- Preview case selection updates the full docket, with animated content and synchronized vote state.
- Demo voting, changing votes, and private draft save/delete behavior checked in the browser.
- Mobile navigation opens with the correct expanded state.
- The story uses the same morphing page and six text swaps, not a slideshow of screenshots. Its renderer retains the required creator credit and follows the supplied reference's sequence and landscape duration.
