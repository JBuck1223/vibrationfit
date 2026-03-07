import sharp from 'sharp';
import { mkdirSync, readdirSync, unlinkSync, writeFileSync } from 'fs';
import { join } from 'path';

const COLOR = '#39FF14';
const SIZE = 512;
const STROKE_WIDTH = 1.75;

const ICONS = [
  { key: 'forward',      label: 'Forward',      lucide: 'sparkles' },
  { key: 'fun',          label: 'Fun',           lucide: 'party-popper' },
  { key: 'health',       label: 'Health',        lucide: 'activity' },
  { key: 'travel',       label: 'Travel',        lucide: 'plane' },
  { key: 'love',         label: 'Love',          lucide: 'heart' },
  { key: 'family',       label: 'Family',        lucide: 'users' },
  { key: 'social',       label: 'Social',        lucide: 'user-plus' },
  { key: 'home',         label: 'Home',          lucide: 'home' },
  { key: 'work',         label: 'Work',          lucide: 'briefcase' },
  { key: 'money',        label: 'Money',         lucide: 'dollar-sign' },
  { key: 'stuff',        label: 'Stuff',         lucide: 'package' },
  { key: 'giving',       label: 'Giving',        lucide: 'gift' },
  { key: 'spirituality', label: 'Spirituality',  lucide: 'star' },
  { key: 'conclusion',   label: 'Conclusion',    lucide: 'check-circle' },
];

async function fetchSvg(iconName) {
  const url = `https://unpkg.com/lucide-static@latest/icons/${iconName}.svg`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Failed to fetch ${iconName}: ${res.status}`);
  return res.text();
}

async function main() {
  const outDir = join(process.cwd(), 'scripts', 'vision-category-icons');
  mkdirSync(outDir, { recursive: true });

  for (const f of readdirSync(outDir)) {
    if (f.endsWith('.png')) unlinkSync(join(outDir, f));
  }

  console.log(`Exporting ${ICONS.length} vision category icons at ${SIZE}x${SIZE} with stroke ${COLOR}\n`);

  for (const icon of ICONS) {
    try {
      let svg = await fetchSvg(icon.lucide);
      svg = svg
        .replace(/width="[^"]*"/, `width="${SIZE}"`)
        .replace(/height="[^"]*"/, `height="${SIZE}"`)
        .replace(/stroke="[^"]*"/g, `stroke="${COLOR}"`)
        .replace(/stroke-width="[^"]*"/g, `stroke-width="${STROKE_WIDTH}"`)
        .replace(/fill="[^"]*"/g, 'fill="none"');

      const pngName = `${icon.key}-${icon.lucide}.png`;
      const pngPath = join(outDir, pngName);

      await sharp(Buffer.from(svg))
        .resize(SIZE, SIZE)
        .png({ quality: 100 })
        .toFile(pngPath);

      const svgDir = join(outDir, 'svg');
      mkdirSync(svgDir, { recursive: true });
      writeFileSync(join(svgDir, `${icon.key}-${icon.lucide}.svg`), svg);

      console.log(`  ${icon.label.padEnd(14)} -> ${pngName}`);
    } catch (err) {
      console.error(`  FAILED ${icon.label} (${icon.lucide}): ${err.message}`);
    }
  }

  console.log(`\nDone! PNGs saved to: ${outDir}`);
}

main();
