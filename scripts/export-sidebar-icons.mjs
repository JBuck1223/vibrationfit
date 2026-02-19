import sharp from 'sharp';
import { mkdirSync, readdirSync, unlinkSync } from 'fs';
import { join } from 'path';

const COLOR = '#39FF14';
const SIZE = 512;
const STROKE_WIDTH = 1.75;

const ICONS = [
  { step: '00', name: 'start-intensive',    icon: 'rocket',           lucide: 'rocket' },
  { step: '01', name: 'settings',           icon: 'settings',         lucide: 'settings' },
  { step: '02', name: 'baseline-intake',    icon: 'file-text',        lucide: 'file-text' },
  { step: '03', name: 'profile',            icon: 'user',             lucide: 'user' },
  { step: '04', name: 'assessment',         icon: 'clipboard-check',  lucide: 'clipboard-check' },
  { step: '05', name: 'life-vision',        icon: 'sparkles',         lucide: 'sparkles' },
  { step: '06', name: 'refine-vision',      icon: 'wand-2',           lucide: 'wand-2' },
  { step: '07', name: 'generate-audio',     icon: 'music',            lucide: 'music' },
  { step: '08', name: 'record-voice',       icon: 'mic',              lucide: 'mic' },
  { step: '09', name: 'audio-mix',          icon: 'sliders',          lucide: 'sliders-horizontal' },
  { step: '10', name: 'vision-board',       icon: 'image',            lucide: 'image' },
  { step: '11', name: 'journal',            icon: 'book-open',        lucide: 'book-open' },
  { step: '12', name: 'book-call',          icon: 'calendar',         lucide: 'calendar' },
  { step: '13', name: 'my-activation-plan', icon: 'rocket',           lucide: 'rocket' },
  { step: '14', name: 'unlock-platform',    icon: 'unlock',           lucide: 'lock-open' },
];

async function fetchSvg(iconPath) {
  const url = `https://unpkg.com/lucide-static@latest/icons/${iconPath}.svg`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Failed to fetch ${iconPath}: ${res.status}`);
  return res.text();
}

async function main() {
  const outDir = join(process.cwd(), 'scripts', 'intensive-icons');
  mkdirSync(outDir, { recursive: true });

  // Clean old PNGs
  for (const f of readdirSync(outDir)) {
    if (f.endsWith('.png')) unlinkSync(join(outDir, f));
  }

  console.log(`Exporting ${ICONS.length} icons (exact sidebar matches) at ${SIZE}x${SIZE} in ${COLOR}\n`);

  for (const icon of ICONS) {
    try {
      let svg = await fetchSvg(icon.lucide);
      svg = svg
        .replace(/width="[^"]*"/, `width="${SIZE}"`)
        .replace(/height="[^"]*"/, `height="${SIZE}"`)
        .replace(/stroke="[^"]*"/g, `stroke="${COLOR}"`)
        .replace(/stroke-width="[^"]*"/g, `stroke-width="${STROKE_WIDTH}"`);

      const pngName = `${icon.step}-${icon.name}-${icon.icon}.png`;
      const pngPath = join(outDir, pngName);

      await sharp(Buffer.from(svg))
        .resize(SIZE, SIZE)
        .png({ quality: 100 })
        .toFile(pngPath);

      // Also save SVG
      const svgName = `${icon.step}-${icon.name}-${icon.icon}.svg`;
      const svgDir = join(outDir, 'svg');
      mkdirSync(svgDir, { recursive: true });
      const { writeFileSync } = await import('fs');
      writeFileSync(join(svgDir, svgName), svg);

      console.log(`  Step ${icon.step}: ${pngName}`);
    } catch (err) {
      console.error(`  FAILED Step ${icon.step} (${icon.name}): ${err.message}`);
    }
  }

  console.log(`\nDone! PNGs saved to: ${outDir}`);
}

main();
