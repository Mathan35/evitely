import { Resvg } from '@resvg/resvg-js';
import { copyFileSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const publicDir = join(root, 'public');
const iconsDir = join(publicDir, 'icons');
const svgPath = join(publicDir, 'favicon.svg');

mkdirSync(iconsDir, { recursive: true });

const baseSvg = readFileSync(svgPath, 'utf8');

function wrapForMaskable(size, padPct) {
    const pad = size * padPct;
    const inner = size - pad * 2;
    const innerMarkup = baseSvg
        .replace(/<svg[^>]*>/i, '')
        .replace(/<\/svg>\s*$/i, '');

    return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
  <rect width="${size}" height="${size}" fill="#241c16"/>
  <svg x="${pad}" y="${pad}" width="${inner}" height="${inner}" viewBox="0 0 40 40">
    ${innerMarkup}
  </svg>
</svg>`;
}

function writePng(size, outPath, { maskable = false } = {}) {
    const svg = maskable ? wrapForMaskable(size, 0.1) : baseSvg;
    const resvg = new Resvg(svg, {
        fitTo: { mode: 'width', value: size },
        background: '#241c16',
    });
    writeFileSync(outPath, resvg.render().asPng());
    console.log(`wrote ${outPath} (${size}px)`);
}

writePng(192, join(iconsDir, 'icon-192.png'));
writePng(512, join(iconsDir, 'icon-512.png'));
writePng(512, join(iconsDir, 'icon-maskable-512.png'), { maskable: true });
writePng(180, join(publicDir, 'apple-touch-icon.png'));
writePng(512, join(publicDir, 'brand', 'invidora-mark.png'));
copyFileSync(svgPath, join(iconsDir, 'icon.svg'));

console.log('PWA icons rasterized from favicon.svg (website brand mark).');
