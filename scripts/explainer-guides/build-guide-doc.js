// Builds GUIDE.md — a per-area shot list + voiceover skeleton from steps.json files.
const fs = require('fs')
const path = require('path')

const OUT = path.join(__dirname, 'output')
const rawRoot = path.join(OUT, 'raw')
const ORDER = [
  'dashboard',
  'profile',
  'life-vision',
  'vision-board',
  'journal',
  'audio',
  'abundance-tracker',
  'daily-paper',
  'map',
]

let md = `# VibrationFit Feature Explainer Guides

**Last Updated:** July 18, 2026
**Status:** Active

Branded 1920x1080 walkthrough frames for every major platform area, ready to drop
into video explainers. Frames live in \`output/frames/<area>/\`, raw unbranded
captures in \`output/raw/<area>/\`.

To re-capture after a UI change:

\`\`\`bash
node scripts/explainer-guides/capture.js [area ...]   # raw screenshots (uses prod + auto-login)
node scripts/explainer-guides/composite.js [area ...] # branded frames
\`\`\`

---
`

for (const slug of ORDER) {
  const metaPath = path.join(rawRoot, slug, 'steps.json')
  if (!fs.existsSync(metaPath)) continue
  const meta = JSON.parse(fs.readFileSync(metaPath, 'utf8'))
  md += `\n## ${meta.areaLabel}\n\n`
  let n = 0
  for (const s of meta.steps) {
    n++
    md += `**Step ${n} — ${s.title}**\n`
    md += `${s.desc}\n`
    md += `Frame: \`output/frames/${slug}/${String(n).padStart(2, '0')}-${s.slug}.png\`\n\n`
  }
  md += '---\n'
}

fs.writeFileSync(path.join(OUT, 'GUIDE.md'), md)
console.log('wrote', path.join(OUT, 'GUIDE.md'))
