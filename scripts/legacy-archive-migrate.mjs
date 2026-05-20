#!/usr/bin/env node
/**
 * Moves deprecated page.tsx files to admin/legacy/archive and leaves public redirects.
 * Run once from repo root: node scripts/legacy-archive-migrate.mjs
 */

import fs from 'fs'
import path from 'path'

const ROOT = path.resolve(import.meta.dirname, '..')

const MOVED = [
  'life-vision/[id]/audio/page.tsx',
  'life-vision/[id]/audio/sets/page.tsx',
  'life-vision/[id]/audio/generate/page.tsx',
  'life-vision/[id]/audio/generate/single/page.tsx',
  'life-vision/[id]/audio/mix/page.tsx',
  'life-vision/[id]/audio/record/page.tsx',
  'life-vision/[id]/audio/queue/page.tsx',
  'life-vision/[id]/audio/queue/[batchId]/page.tsx',
  'life-vision/[id]/audio-generate/page.tsx',
  'life-vision/audio/page.tsx',
  'life-vision/audio/new/page.tsx',
  'life-vision/audio/generate/new/page.tsx',
  'life-vision/audio/mix/new/page.tsx',
  'life-vision/audio/record/new/page.tsx',
  'life-vision/manual/page.tsx',
  'life-vision/[id]/experiment/page.tsx',
  'life-vision/[id]/refine/viva/page.tsx',
  'life-vision/refine/new/page.tsx',
  'story/[storyId]/audio/page.tsx',
  'story/[storyId]/audio/generate/page.tsx',
  'story/[storyId]/audio/record/page.tsx',
  'vision-board/gallery/page.tsx',
  'profile/compare/page.tsx',
  'profile/[id]/refine/page.tsx',
  'activation-protocol/page.tsx',
  'dashboard/north-star/page.tsx',
  'voice-profile/page.tsx',
  'voice-profile/analyze/page.tsx',
  'voice-profile/analyze/initial/page.tsx',
]

function publicRouteFromRel(rel) {
  return '/' + rel.replace(/\/page\.tsx$/, '')
}

function redirectSource(publicRoute) {
  return `import { createLegacyPublicRedirect } from '@/lib/navigation/legacy-redirect-page'

export default createLegacyPublicRedirect('${publicRoute}')
`
}

for (const rel of MOVED) {
  const src = path.join(ROOT, 'src/app', rel)
  const dest = path.join(ROOT, 'src/app/admin/legacy/archive', rel)
  const publicRoute = publicRouteFromRel(rel)

  if (!fs.existsSync(src)) {
    console.warn('skip (missing):', rel)
    continue
  }

  fs.mkdirSync(path.dirname(dest), { recursive: true })
  fs.renameSync(src, dest)
  fs.writeFileSync(src, redirectSource(publicRoute), 'utf8')
  console.log('moved:', rel, '->', path.relative(ROOT, dest))
}

console.log('Done.')
