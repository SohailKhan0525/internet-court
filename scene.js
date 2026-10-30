'use strict';
// Image treatment inspired by Unslop's glyph technique, by @heydamir (CC BY 4.0).
// The scale is drawn with yes/no characters: the material of a public verdict.
(() => {
  const image = document.getElementById('scene-image');
  const canvas = document.getElementById('scene-glyphs');
  if (!image || !canvas) return;
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const prepare = () => {
    if (reduced.matches || !image.naturalWidth) return;
    const width = image.naturalWidth, height = image.naturalHeight, cell = 6;
    canvas.width = width; canvas.height = height;
    const cols = Math.ceil(width / cell), rows = Math.ceil(height / cell);
    const sample = document.createElement('canvas'); sample.width = cols; sample.height = rows;
    const sampleCtx = sample.getContext('2d', { willReadFrequently: true });
    const ctx = canvas.getContext('2d');
    if (!sampleCtx || !ctx) return;
    sampleCtx.drawImage(image, 0, 0, cols, rows);
    const pixels = sampleCtx.getImageData(0, 0, cols, rows).data;
    ctx.font = `500 ${cell + 1}px ui-monospace, monospace`;
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    const chars = ['·', ':', 'n', 'o', '?', 'y', 'e', 's'];
    for (let y = 0; y < rows; y++) for (let x = 0; x < cols; x++) {
      const i = (y * cols + x) * 4;
      const light = (.2126 * pixels[i] + .7152 * pixels[i + 1] + .0722 * pixels[i + 2]) / 255;
      if (light < .095 || x < cols * .40) continue;
      const char = chars[Math.min(chars.length - 1, Math.floor(light * chars.length))];
      ctx.fillStyle = `rgb(${Math.min(255,pixels[i]*1.15)},${Math.min(255,pixels[i+1]*1.15)},${Math.min(255,pixels[i+2]*1.15)})`;
      ctx.fillText(char, x * cell + cell / 2, y * cell + cell / 2);
    }
    image.closest('.hero-scene').classList.add('glyph-ready');
    window.__sceneReady = true;
  };
  if (image.complete) prepare(); else image.addEventListener('load', prepare, { once: true });
  reduced.addEventListener('change', () => { if (!reduced.matches) prepare(); });
})();
