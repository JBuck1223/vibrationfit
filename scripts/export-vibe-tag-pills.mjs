import sharp from 'sharp';
import { mkdirSync, writeFileSync, readdirSync, unlinkSync } from 'fs';
import { join } from 'path';

// Exact Tailwind values from PostComposer:
//   flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium border-2
//   Icon: w-4 h-4
//   Font: Poppins 500
const PX = 16;        // px-4
const PY = 8;         // py-2
const GAP = 8;        // gap-2
const ICON = 16;      // w-4 h-4
const FONT_SIZE = 14; // text-sm
const LINE_H = 20;    // text-sm line-height
const BORDER = 2;     // border-2
const BG = 'rgba(0,0,0,0.8)';

const SCALE = 4;

const VIBE_TAGS = [
  { key: 'win',           label: 'Win',           lucide: 'trophy',    color: '#39FF14' },
  { key: 'wobble',        label: 'Wobble',        lucide: 'heart',     color: '#00FFFF' },
  { key: 'vision',        label: 'Vision',        lucide: 'sparkles',  color: '#BF00FF' },
  { key: 'collaboration', label: 'Collaboration', lucide: 'lightbulb', color: '#FFFF00' },
];

async function fetchFontBase64() {
  const cssRes = await fetch(
    'https://fonts.googleapis.com/css2?family=Poppins:wght@500&display=swap',
    { headers: { 'User-Agent': 'Mozilla/4.0 (compatible; MSIE 6.0)' } }
  );
  const css = await cssRes.text();
  const urlMatch = css.match(/url\(([^)]+)\)/);
  if (!urlMatch) throw new Error('Could not find font URL');
  const fontRes = await fetch(urlMatch[1]);
  const buf = Buffer.from(await fontRes.arrayBuffer());
  return buf.toString('base64');
}

async function fetchSvgInner(iconName) {
  const url = `https://unpkg.com/lucide-static@latest/icons/${iconName}.svg`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Failed to fetch ${iconName}: ${res.status}`);
  const svg = await res.text();
  const match = svg.match(/<svg[^>]*>([\s\S]*)<\/svg>/);
  return match ? match[1].trim() : '';
}

async function measureTextWidth(text, fontBase64) {
  const s = SCALE;
  const fs = FONT_SIZE * s;
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="2000" height="${fs * 2}">
  <defs><style>
    @font-face {
      font-family: 'Poppins';
      src: url('data:font/truetype;base64,${fontBase64}') format('truetype');
      font-weight: 500;
    }
  </style></defs>
  <text x="0" y="${fs}" fill="white"
        font-family="Poppins, sans-serif" font-size="${fs}" font-weight="500">${text}</text>
</svg>`;
  const buf = await sharp(Buffer.from(svg)).png().toBuffer();
  const trimmed = await sharp(buf).trim({ threshold: 10 }).toBuffer();
  const meta = await sharp(trimmed).metadata();
  return meta.width || 0;
}

function createPillSvg({ iconPaths, label, color, textWidth, fontBase64 }) {
  const s = SCALE;
  const bw  = BORDER * s;
  const px  = PX * s;
  const py  = PY * s;
  const gap = GAP * s;
  const ico = ICON * s;
  const fs  = FONT_SIZE * s;
  const lh  = LINE_H * s;

  const height = bw + py + lh + py + bw;
  const width  = bw + px + ico + gap + textWidth + px + bw;
  const rx = height / 2;

  const iconX = bw + px;
  const iconY = (height - ico) / 2;
  const textX = iconX + ico + gap;
  const textY = height / 2;

  return { width, height, svg: `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}">
  <defs><style>
    @font-face {
      font-family: 'Poppins';
      src: url('data:font/truetype;base64,${fontBase64}') format('truetype');
      font-weight: 500;
    }
  </style></defs>
  <rect x="${bw/2}" y="${bw/2}" width="${width - bw}" height="${height - bw}"
        rx="${rx}" ry="${rx}" fill="${BG}" stroke="${color}" stroke-width="${bw}" />
  <svg x="${iconX}" y="${iconY}" width="${ico}" height="${ico}"
       viewBox="0 0 24 24" fill="none" stroke="${color}" stroke-width="2"
       stroke-linecap="round" stroke-linejoin="round">
    ${iconPaths}
  </svg>
  <text x="${textX}" y="${textY}" fill="${color}"
        font-family="Poppins, sans-serif" font-size="${fs}" font-weight="500"
        dominant-baseline="central">${label}</text>
</svg>` };
}

async function main() {
  const outDir = join(process.cwd(), 'scripts', 'vibe-tribe-badges', 'pill-badges');
  mkdirSync(outDir, { recursive: true });
  const svgDir = join(outDir, 'svg');
  mkdirSync(svgDir, { recursive: true });

  for (const f of readdirSync(outDir).filter(f => f.endsWith('.png'))) {
    unlinkSync(join(outDir, f));
  }

  console.log('Downloading Poppins Medium font...');
  const fontBase64 = await fetchFontBase64();
  console.log(`Font loaded (${Math.round(fontBase64.length / 1024)}KB base64)\n`);

  console.log('Measuring text widths & generating pills...\n');

  for (const tag of VIBE_TAGS) {
    try {
      const [iconPaths, textWidth] = await Promise.all([
        fetchSvgInner(tag.lucide),
        measureTextWidth(tag.label, fontBase64),
      ]);

      console.log(`  ${tag.label.padEnd(16)} text=${textWidth}px`);

      const { svg } = createPillSvg({
        iconPaths,
        label: tag.label,
        color: tag.color,
        textWidth: textWidth + 4,
        fontBase64,
      });

      const pngName = `${tag.key}-pill.png`;
      writeFileSync(join(svgDir, `${tag.key}-pill.svg`), svg);

      await sharp(Buffer.from(svg))
        .png({ quality: 100 })
        .toFile(join(outDir, pngName));

      console.log(`  ${''.padEnd(16)} -> ${pngName}`);
    } catch (err) {
      console.error(`  FAILED ${tag.label}: ${err.message}`);
    }
  }

  console.log(`\nDone! ${SCALE}x resolution pills saved to: ${outDir}`);
}

main();
