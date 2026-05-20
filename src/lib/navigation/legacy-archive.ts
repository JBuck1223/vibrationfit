/**
 * Admin-only archive for deprecated member routes.
 * Public URLs redirect to canonical replacements; archived UI lives under /admin/legacy/archive.
 */

import type { LegacyPageEntry } from './legacy-pages'

export const LEGACY_ARCHIVE_PREFIX = '/admin/legacy/archive'

/** Member routes that were moved to the archive (deprecate + remove-now, except kept routes like /vision-board/export). */
export const MOVED_LEGACY_ROUTES = new Set(
  [
    '/life-vision/[id]/audio',
    '/life-vision/[id]/audio/sets',
    '/life-vision/[id]/audio/generate',
    '/life-vision/[id]/audio/generate/single',
    '/life-vision/[id]/audio/mix',
    '/life-vision/[id]/audio/record',
    '/life-vision/[id]/audio/queue',
    '/life-vision/[id]/audio/queue/[batchId]',
    '/life-vision/[id]/audio-generate',
    '/life-vision/audio',
    '/life-vision/audio/new',
    '/life-vision/audio/generate/new',
    '/life-vision/audio/mix/new',
    '/life-vision/audio/record/new',
    '/life-vision/manual',
    '/life-vision/[id]/experiment',
    '/life-vision/[id]/refine/viva',
    '/life-vision/refine/new',
    '/story/[storyId]/audio',
    '/story/[storyId]/audio/generate',
    '/story/[storyId]/audio/record',
    '/vision-board/gallery',
    '/profile/compare',
    '/profile/[id]/refine',
    '/activation-protocol',
    '/north-star',
    '/voice-profile',
    '/voice-profile/analyze',
    '/voice-profile/analyze/initial',
  ] as const
)

export function isMovedLegacyRoute(route: string): boolean {
  return (MOVED_LEGACY_ROUTES as Set<string>).has(route)
}

export function archiveHrefFromPublicTemplate(hrefTemplate: string): string {
  if (hrefTemplate.startsWith(LEGACY_ARCHIVE_PREFIX)) return hrefTemplate
  return `${LEGACY_ARCHIVE_PREFIX}${hrefTemplate}`
}

export function archiveAppPathFromPublicFile(publicFile: string): string {
  // src/app/life-vision/[id]/audio/page.tsx -> src/app/admin/legacy/archive/life-vision/[id]/audio/page.tsx
  const rel = publicFile.replace(/^src\/app\//, '')
  return `src/app/admin/legacy/archive/${rel}`
}

/**
 * Resolve where a public URL should redirect after archival.
 */
export function resolveLegacyPublicRedirect(
  route: string,
  params: Record<string, string>
): string {
  const id = params.id
  const storyId = params.storyId
  const batchId = params.batchId

  switch (route) {
    case '/life-vision/[id]/audio':
    case '/life-vision/[id]/audio/sets':
    case '/life-vision/audio':
      return '/audio'
    case '/life-vision/[id]/audio/generate':
    case '/life-vision/[id]/audio/generate/single':
    case '/life-vision/[id]/audio-generate':
    case '/life-vision/audio/generate/new':
      return '/audio/generate'
    case '/life-vision/[id]/audio/mix':
    case '/life-vision/audio/mix/new':
      return '/audio/mix'
    case '/life-vision/[id]/audio/record':
    case '/life-vision/audio/record/new':
      return '/audio/record'
    case '/life-vision/[id]/audio/queue':
      return '/audio/queue'
    case '/life-vision/[id]/audio/queue/[batchId]':
      return batchId ? `/audio/queue/${batchId}` : '/audio/queue'
    case '/life-vision/audio/new':
      return '/audio/create'
    case '/life-vision/manual':
    case '/life-vision/refine/new':
      return '/life-vision/create'
    case '/life-vision/[id]/experiment':
      return id ? `/life-vision/${id}` : '/life-vision'
    case '/life-vision/[id]/refine/viva':
      return id ? `/life-vision/${id}/refine` : '/life-vision'
    case '/story/[storyId]/audio':
      return '/audio/create'
    case '/story/[storyId]/audio/generate':
      return '/audio/generate'
    case '/story/[storyId]/audio/record':
      return '/audio/record'
    case '/vision-board/gallery':
      return '/vision-board'
    case '/profile/compare':
      return '/profile'
    case '/profile/[id]/refine':
      return id ? `/profile/${id}/edit` : '/profile/create'
    case '/activation-protocol':
      return '/intensive'
    case '/north-star':
      return '/dashboard'
    case '/voice-profile':
    case '/voice-profile/analyze':
    case '/voice-profile/analyze/initial':
      return '/dashboard'
    default:
      return '/admin/legacy'
  }
}

export function applyLegacyArchiveToEntry(entry: LegacyPageEntry): LegacyPageEntry {
  if (!isMovedLegacyRoute(entry.route)) return entry
  return {
    ...entry,
    hrefTemplate: archiveHrefFromPublicTemplate(
      entry.hrefTemplate.startsWith(LEGACY_ARCHIVE_PREFIX)
        ? entry.hrefTemplate.slice(LEGACY_ARCHIVE_PREFIX.length)
        : entry.hrefTemplate
    ),
    file: entry.file ? archiveAppPathFromPublicFile(entry.file) : entry.file,
    archived: true,
  }
}
