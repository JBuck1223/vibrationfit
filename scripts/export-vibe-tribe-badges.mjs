import sharp from 'sharp';
import { mkdirSync, readdirSync, unlinkSync, writeFileSync } from 'fs';
import { join } from 'path';

const SIZE = 512;
const STROKE_WIDTH = 1.75;

// ============================================
// VIBE TAGS (post type badges)
// ============================================
const VIBE_TAGS = [
  { key: 'win',           label: 'Win',           lucide: 'trophy',    color: '#39FF14' },
  { key: 'wobble',        label: 'Wobble',        lucide: 'heart',     color: '#00FFFF' },
  { key: 'vision',        label: 'Vision',        lucide: 'sparkles',  color: '#BF00FF' },
  { key: 'collaboration', label: 'Collaboration', lucide: 'lightbulb', color: '#FFFF00' },
];

// ============================================
// ACHIEVEMENT BADGES (by category)
// ============================================
const ACHIEVEMENT_BADGES = [
  // Sessions (teal)
  { key: 'gym_rookie',       label: 'First Reps',           lucide: 'dumbbell',        color: '#14B8A6', category: 'sessions' },
  { key: 'gym_regular',      label: 'Consistent Practice',  lucide: 'users',           color: '#14B8A6', category: 'sessions' },
  { key: 'gym_og',           label: 'Vibration Fit',        lucide: 'crown',           color: '#14B8A6', category: 'sessions' },
  // Connections (purple)
  { key: 'first_signal',     label: 'First Signal Sent',    lucide: 'message-circle',  color: '#8B5CF6', category: 'connections' },
  { key: 'vibe_contributor', label: 'Conscious Connector',  lucide: 'heart',           color: '#8B5CF6', category: 'connections' },
  { key: 'vibe_anchor',      label: 'Vibe Anchor',          lucide: 'anchor',          color: '#8B5CF6', category: 'connections' },
  // Activations (green)
  { key: 'graduate_72h',     label: '72-Hour Graduate',     lucide: 'graduation-cap',  color: '#199D67', category: 'activations' },
  { key: 'activated_3d',     label: '3-Day Activated',      lucide: 'sparkles',        color: '#199D67', category: 'activations' },
  { key: 'activated_7d',     label: '7-Day Activated',      lucide: 'zap',             color: '#199D67', category: 'activations' },
  { key: 'activated_14d',    label: '14-Day Activated',     lucide: 'target',          color: '#199D67', category: 'activations' },
  { key: 'activated_21d',    label: '21-Day Activated',     lucide: 'star',            color: '#199D67', category: 'activations' },
  { key: 'activated_28d',    label: '28-Day Activated',     lucide: 'award',           color: '#199D67', category: 'activations' },
  // Creations (gold)
  { key: 'life_author',      label: 'Life I Choose Author', lucide: 'book-open',       color: '#FFB701', category: 'creations' },
  { key: 'vision_weaver',    label: 'Vision Weaver',        lucide: 'layers',          color: '#FFB701', category: 'creations' },
  { key: 'audio_architect',  label: 'Audio Architect',      lucide: 'headphones',      color: '#FFB701', category: 'creations' },
  { key: 'board_builder',    label: 'Board Builder',        lucide: 'layout-grid',     color: '#FFB701', category: 'creations' },
];

async function fetchSvg(iconName) {
  const url = `https://unpkg.com/lucide-static@latest/icons/${iconName}.svg`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Failed to fetch ${iconName}: ${res.status}`);
  return res.text();
}

async function exportIcon(icon, outDir) {
  let svg = await fetchSvg(icon.lucide);
  svg = svg
    .replace(/width="[^"]*"/, `width="${SIZE}"`)
    .replace(/height="[^"]*"/, `height="${SIZE}"`)
    .replace(/stroke="[^"]*"/g, `stroke="${icon.color}"`)
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

  return pngName;
}

async function main() {
  const baseDir = join(process.cwd(), 'scripts', 'vibe-tribe-badges');

  // --- Vibe Tags ---
  const tagsDir = join(baseDir, 'vibe-tags');
  mkdirSync(tagsDir, { recursive: true });
  for (const f of readdirSync(tagsDir).filter(f => f.endsWith('.png'))) {
    unlinkSync(join(tagsDir, f));
  }

  console.log(`=== VIBE TAGS (${VIBE_TAGS.length}) ===\n`);
  for (const tag of VIBE_TAGS) {
    try {
      const name = await exportIcon(tag, tagsDir);
      console.log(`  ${tag.label.padEnd(16)} ${tag.color}  ->  ${name}`);
    } catch (err) {
      console.error(`  FAILED ${tag.label}: ${err.message}`);
    }
  }

  // --- Achievement Badges ---
  const badgesDir = join(baseDir, 'achievement-badges');
  mkdirSync(badgesDir, { recursive: true });
  for (const f of readdirSync(badgesDir).filter(f => f.endsWith('.png'))) {
    unlinkSync(join(badgesDir, f));
  }

  console.log(`\n=== ACHIEVEMENT BADGES (${ACHIEVEMENT_BADGES.length}) ===\n`);
  let lastCategory = '';
  for (const badge of ACHIEVEMENT_BADGES) {
    if (badge.category !== lastCategory) {
      console.log(`  -- ${badge.category.toUpperCase()} (${badge.color}) --`);
      lastCategory = badge.category;
    }
    try {
      const name = await exportIcon(badge, badgesDir);
      console.log(`  ${badge.label.padEnd(22)} ->  ${name}`);
    } catch (err) {
      console.error(`  FAILED ${badge.label}: ${err.message}`);
    }
  }

  console.log(`\nDone! Files saved to:`);
  console.log(`  Vibe Tags:          ${tagsDir}`);
  console.log(`  Achievement Badges: ${badgesDir}`);
}

main();
