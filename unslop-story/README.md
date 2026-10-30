# Internet Court — Unslop story, second edition

A 7.77-second widescreen before-and-after animation following the pacing of the reference video supplied by the user. It morphs the previous cream page into the new charcoal-and-brass landing page.

Made with [Unslop](https://github.com/heydamir/unslop) by Damir Sokolovsky ([@heydamir](https://x.com/heydamir)), [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/). `render.mjs` adapts the upstream renderer: it adds a reference timeline, widescreen framing, and live layout-selection measurements. The original wave transitions, text rolls, spacing measurements, radius outlines, and on-screen credit remain.

## Render

Install Node.js 20+, FFmpeg, Playwright, and Chromium, then run from the repository root:

```sh
npm install --no-save playwright
npx playwright install chromium
node unslop-story/render.mjs unslop-story/story.html internet-court-unslop-v2.mp4 --wide
```

The reference metadata selects a 3840 × 2160, 60 fps H.264 master of 466 frames (7.7667 seconds). A smaller 1920 × 1080 sharing export can be produced with FFmpeg. There is no audio, matching the supplied reference.

Five cumulative passes alter the same DOM: spacing, layout, color, type and copy, then details and the visual. Six text swaps are used. The final scene and product preview are built from the production page; the opening frame reconstructs the prior hero with its original styles. The runtime is presentation-only and is excluded from the production build.

Keep `story.html`, `render.mjs`, `courtroom.webp`, and `justice-scene.webp` together. The story loads the same public Google Fonts as the page. Keep the creator credit in derivative videos.
