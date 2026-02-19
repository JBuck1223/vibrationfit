import sharp from 'sharp';
import { mkdir } from 'fs/promises';
import { join } from 'path';

const COLOR = '#39FF14';
const SIZE = 512;
const STROKE_WIDTH = 1.75;

const ICONS = [
  { step: '01', name: 'settings', label: 'Account Settings', path: 'settings' },
  { step: '02', name: 'clipboard-list', label: 'Baseline Intake', path: 'clipboard-list' },
  { step: '03', name: 'user-circle', label: 'Create Your Profile', path: 'circle-user' },
  { step: '04', name: 'activity', label: 'Vibration Assessment', path: 'activity' },
  { step: '05', name: 'eye', label: 'Build Your Life Vision', path: 'eye' },
  { step: '06', name: 'sparkles', label: 'Refine Your Vision', path: 'sparkles' },
  { step: '07', name: 'audio-lines', label: 'Generate Vision Audio', path: 'audio-lines' },
  { step: '08', name: 'mic', label: 'Record Your Voice', path: 'mic' },
  { step: '09', name: 'music', label: 'Create Audio Mix', path: 'music' },
  { step: '10', name: 'layout-grid', label: 'Create Vision Board', path: 'layout-grid' },
  { step: '11', name: 'pen-line', label: 'First Journal Entry', path: 'pen-line' },
  { step: '12', name: 'phone', label: 'Book Calibration Call', path: 'phone' },
  { step: '13', name: 'map', label: 'My Activation Plan', path: 'map' },
  { step: '14', name: 'unlock', label: 'Platform Unlock', path: 'lock-open' },
];

async function fetchSvg(iconPath) {
  const url = `https://unpkg.com/lucide-static@latest/icons/${iconPath}.svg`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Failed to fetch ${iconPath}: ${res.status}`);
  return res.text();
}

async function main() {
  const outDir = join(process.cwd(), 'scripts', 'intensive-icons');
  await mkdir(outDir, { recursive: true });

  console.log(`Exporting ${ICONS.length} icons at ${SIZE}x${SIZE} in ${COLOR}\n`);

  for (const icon of ICONS) {
    try {
      let svg = await fetchSvg(icon.path);

      svg = svg
        .replace(/width="[^"]*"/, `width="${SIZE}"`)
        .replace(/height="[^"]*"/, `height="${SIZE}"`)
        .replace(/stroke="[^"]*"/g, `stroke="${COLOR}"`)
        .replace(/stroke-width="[^"]*"/g, `stroke-width="${STROKE_WIDTH}"`);

      const filename = `step-${icon.step}-${icon.name}.png`;
      const outPath = join(outDir, filename);

      await sharp(Buffer.from(svg))
        .resize(SIZE, SIZE)
        .png({ quality: 100 })
        .toFile(outPath);

      console.log(`  Step ${icon.step}: ${filename} (${icon.label})`);
    } catch (err) {
      console.error(`  FAILED Step ${icon.step} (${icon.name}): ${err.message}`);
    }
  }

  console.log(`\nDone! Icons saved to: ${outDir}`);
}

main();
