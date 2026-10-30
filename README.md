# Internet Court

A fresh landing page for the court of public opinion. Built with semantic HTML, CSS, and JavaScript; no runtime dependencies.

## Run

- `npm run check` checks JavaScript syntax.
- `npm run build` creates the deployable `dist/` directory.
- Serve `dist/` with any static HTTP server. Vercel configuration is included.

## Preview behavior

The three example cases are fictional and explicitly labeled. Votes are browser-local demo choices, not public vote totals. The case dialog saves a private draft to local storage and can download it as a text file. No backend, authentication, payment, public submission, or community voting is connected. The earlier application is preserved in `backup/pre-unslop-2026-10-30` and Git history.

Native dialogs support Escape, focus trapping, and return focus. Case tabs support arrow keys, Home, and End. Forms validate input, storage failures produce useful feedback, and the layout adapts to small screens. Animations respect reduced-motion settings.

## Design and attribution

Designed using [Unslop](https://github.com/heydamir/unslop) by Damir Sokolovsky ([@heydamir](https://x.com/heydamir)), licensed under [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/). The skill is installed in the user's skills and its design process is documented in `DESIGN.md`.

The brass balance-scale scene was generated for this project with OpenAI's built-in image generation tool. The interface uses Instrument Sans from Google Fonts. The hero combines the generated scene with a cached yes/no glyph layer, a single staggered entrance, and evidence labels. Case changes, votes, menus, and dialogs have explicit transition feedback; reduced-motion mode removes movement and shows the static scene. The production canonical URL remains `https://www.loopproof.me/`, matching the existing Vercel domain configuration.
