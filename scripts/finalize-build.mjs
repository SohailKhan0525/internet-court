import { copyFile } from 'node:fs/promises';

// Preserve a branded recovery view on static hosts that use 404.html.
await copyFile(new URL('../dist/index.html', import.meta.url), new URL('../dist/404.html', import.meta.url));
