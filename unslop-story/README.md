# Internet Court — Unslop story

A 9.2-second before-and-after animation of the Internet Court landing page, rendered with [Unslop](https://github.com/heydamir/unslop) by Damir Sokolovsky ([@heydamir](https://x.com/heydamir)). Unslop and its renderer are licensed under [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/). The on-screen credit is retained.

The opening frame reconstructs the original hero from commit `4e91aa6d10e0835d2729a1578c3bee37d622797c`. Four cumulative passes animate the same page elements: spacing, color, type and copy, then the case-file details and courtroom illustration. This is a presentation, separate from the production landing page and its browser-local demo.

## Render

Install Node.js 20+, FFmpeg, and Playwright with Chromium. From the repository root:

```sh
npm install --no-save playwright
npx playwright install chromium
node unslop-story/render.mjs unslop-story/story.html internet-court-unslop-master.mp4
ffmpeg -i internet-court-unslop-master.mp4 -vf scale=1080:1080:flags=lanczos -c:v libx264 -pix_fmt yuv420p -crf 18 -preset medium -movflags +faststart internet-court-unslop.mp4
```

The master is 2160 × 2160 at 60 fps. The social export is 1080 × 1080 at 60 fps, H.264 MP4, with no audio. Add music in your posting app if desired. The renderer needs internet access for the fonts in `story.html`.

`render.mjs` is the upstream Unslop story renderer, unchanged. It reads `unslop-steps` and `unslop-frame`, animates `.s1` through `.s4`, and generates the moving measurements, letter transitions, radius outlines, and credit. Keep all three input files together when rendering.
