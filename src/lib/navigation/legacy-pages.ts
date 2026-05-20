/**
 * Legacy / deprecated member routes — catalog for admin review during studio migration.
 * Used by /admin/legacy to link old pages without hunting through the codebase.
 */

import { applyLegacyArchiveToEntry } from './legacy-archive'

export type LegacyPageTier = 'remove-now' | 'deprecate' | 'redirect-only' | 'review'

export type LegacySampleKey =
  | 'visionId'
  | 'storyId'
  | 'journalId'
  | 'profileId'
  | 'visionBoardId'
  | 'batchId'
  | 'mapId'
  | 'assessmentId'
  | 'dailyPaperId'
  | 'abundanceEventId'
  | 'categoryKey'

export interface LegacyPageEntry {
  /** Route pattern shown in the admin list */
  route: string
  label: string
  tier: LegacyPageTier
  studio?: string
  replacement?: string | null
  reason: string
  file?: string
  /** Static path or template with {visionId}, {storyId}, etc. */
  hrefTemplate: string
  /** Sample IDs needed to build a preview link (admin account) */
  sampleKeys?: LegacySampleKey[]
  /** UI moved under /admin/legacy/archive; public URL redirects */
  archived?: boolean
}

export interface LegacySampleIds {
  visionId?: string
  storyId?: string
  journalId?: string
  profileId?: string
  visionBoardId?: string
  batchId?: string
  mapId?: string
  assessmentId?: string
  dailyPaperId?: string
  abundanceEventId?: string
  categoryKey?: string
}

export const LEGACY_PAGE_TIER_LABELS: Record<LegacyPageTier, string> = {
  'remove-now': 'Remove now',
  deprecate: 'Deprecate',
  'redirect-only': 'Redirect shim',
  review: 'Review',
}

export const LEGACY_PAGE_TIER_BADGE: Record<LegacyPageTier, 'danger' | 'warning' | 'info' | 'neutral'> = {
  'remove-now': 'danger',
  deprecate: 'warning',
  'redirect-only': 'info',
  review: 'neutral',
}

export function buildLegacyHref(
  entry: LegacyPageEntry,
  samples: LegacySampleIds
): string | null {
  let href = entry.hrefTemplate
  const keys = entry.sampleKeys ?? []

  for (const key of keys) {
    const value = samples[key] ?? (key === 'categoryKey' ? 'fun' : undefined)
    if (!value) return null
    href = href.replace(`{${key}}`, value)
  }

  if (/\{[a-zA-Z]+\}/.test(href)) return null
  return href
}

export function canPreviewLegacyPage(entry: LegacyPageEntry, samples: LegacySampleIds): boolean {
  return buildLegacyHref(entry, samples) !== null
}

const LEGACY_PAGES_RAW: LegacyPageEntry[] = [
  // ── Life Vision — per-ID audio (→ Audio Studio) ──────────────────────────
  {
    route: '/life-vision/[id]/audio',
    label: 'Vision audio hub',
    tier: 'deprecate',
    studio: 'Life Vision / Audio',
    replacement: '/audio',
    reason: 'Per-vision audio hub replaced by Audio Studio Listen tab',
    file: 'src/app/life-vision/[id]/audio/page.tsx',
    hrefTemplate: '/life-vision/{visionId}/audio',
    sampleKeys: ['visionId'],
  },
  {
    route: '/life-vision/[id]/audio/sets',
    label: 'Vision audio sets',
    tier: 'deprecate',
    studio: 'Life Vision / Audio',
    replacement: '/audio',
    reason: 'Set management/listening moved to /audio with version selector',
    file: 'src/app/life-vision/[id]/audio/sets/page.tsx',
    hrefTemplate: '/life-vision/{visionId}/audio/sets',
    sampleKeys: ['visionId'],
  },
  {
    route: '/life-vision/[id]/audio/generate',
    label: 'Vision audio generate',
    tier: 'deprecate',
    studio: 'Life Vision / Audio',
    replacement: '/audio/generate',
    reason: 'Generate tool moved to Audio Studio Create tab',
    file: 'src/app/life-vision/[id]/audio/generate/page.tsx',
    hrefTemplate: '/life-vision/{visionId}/audio/generate',
    sampleKeys: ['visionId'],
  },
  {
    route: '/life-vision/[id]/audio/generate/single',
    label: 'Vision single-section generate',
    tier: 'deprecate',
    studio: 'Life Vision / Audio',
    replacement: '/audio/generate',
    reason: 'Folded into global /audio/generate',
    file: 'src/app/life-vision/[id]/audio/generate/single/page.tsx',
    hrefTemplate: '/life-vision/{visionId}/audio/generate/single',
    sampleKeys: ['visionId'],
  },
  {
    route: '/life-vision/[id]/audio/mix',
    label: 'Vision audio mix',
    tier: 'deprecate',
    studio: 'Life Vision / Audio',
    replacement: '/audio/mix',
    reason: 'Mix tool moved to Audio Studio Create tab',
    file: 'src/app/life-vision/[id]/audio/mix/page.tsx',
    hrefTemplate: '/life-vision/{visionId}/audio/mix',
    sampleKeys: ['visionId'],
  },
  {
    route: '/life-vision/[id]/audio/record',
    label: 'Vision audio record',
    tier: 'deprecate',
    studio: 'Life Vision / Audio',
    replacement: '/audio/record',
    reason: 'Record tool moved to Audio Studio Create tab',
    file: 'src/app/life-vision/[id]/audio/record/page.tsx',
    hrefTemplate: '/life-vision/{visionId}/audio/record',
    sampleKeys: ['visionId'],
  },
  {
    route: '/life-vision/[id]/audio/queue',
    label: 'Vision audio queue',
    tier: 'deprecate',
    studio: 'Life Vision / Audio',
    replacement: '/audio/queue',
    reason: 'Queue moved to Audio Studio Create tab',
    file: 'src/app/life-vision/[id]/audio/queue/page.tsx',
    hrefTemplate: '/life-vision/{visionId}/audio/queue',
    sampleKeys: ['visionId'],
  },
  {
    route: '/life-vision/[id]/audio/queue/[batchId]',
    label: 'Vision audio batch detail',
    tier: 'deprecate',
    studio: 'Life Vision / Audio',
    replacement: '/audio/queue/[batchId]',
    reason: 'Batch detail moved to global audio queue',
    file: 'src/app/life-vision/[id]/audio/queue/[batchId]/page.tsx',
    hrefTemplate: '/life-vision/{visionId}/audio/queue/{batchId}',
    sampleKeys: ['visionId', 'batchId'],
  },
  {
    route: '/life-vision/[id]/audio-generate',
    label: 'Vision audio-generate (hyphenated)',
    tier: 'remove-now',
    studio: 'Life Vision / Audio',
    replacement: '/audio/generate',
    reason: 'Broken duplicate; redirects to dead audio-queue paths',
    file: 'src/app/life-vision/[id]/audio-generate/page.tsx',
    hrefTemplate: '/life-vision/{visionId}/audio-generate',
    sampleKeys: ['visionId'],
  },

  // ── Life Vision — old audio hub & onboarding ─────────────────────────────
  {
    route: '/life-vision/audio',
    label: 'All vision audios hub',
    tier: 'deprecate',
    studio: 'Life Vision / Audio',
    replacement: '/audio',
    reason: 'Old cross-vision audio list superseded by Audio Studio',
    file: 'src/app/life-vision/audio/page.tsx',
    hrefTemplate: '/life-vision/audio',
  },
  {
    route: '/life-vision/audio/new',
    label: 'Audio intro / onboarding',
    tier: 'deprecate',
    studio: 'Life Vision / Audio',
    replacement: '/audio/create',
    reason: 'Intro page for old per-vision audio flow',
    file: 'src/app/life-vision/audio/new/page.tsx',
    hrefTemplate: '/life-vision/audio/new',
  },
  {
    route: '/life-vision/audio/generate/new',
    label: 'Generate intro page',
    tier: 'deprecate',
    studio: 'Life Vision / Audio',
    replacement: '/audio/generate',
    reason: 'Intro before old per-ID generate',
    file: 'src/app/life-vision/audio/generate/new/page.tsx',
    hrefTemplate: '/life-vision/audio/generate/new',
  },
  {
    route: '/life-vision/audio/mix/new',
    label: 'Mix intro page',
    tier: 'deprecate',
    studio: 'Life Vision / Audio',
    replacement: '/audio/mix',
    reason: 'Intro before old per-ID mix',
    file: 'src/app/life-vision/audio/mix/new/page.tsx',
    hrefTemplate: '/life-vision/audio/mix/new',
  },
  {
    route: '/life-vision/audio/record/new',
    label: 'Record intro page',
    tier: 'deprecate',
    studio: 'Life Vision / Audio',
    replacement: '/audio/record',
    reason: 'Intro before old per-ID record',
    file: 'src/app/life-vision/audio/record/new/page.tsx',
    hrefTemplate: '/life-vision/audio/record/new',
  },

  // ── Life Vision — dead / duplicate ───────────────────────────────────────
  {
    route: '/life-vision/manual',
    label: 'Manual vision creation',
    tier: 'remove-now',
    studio: 'Life Vision',
    replacement: '/life-vision/create',
    reason: 'Unused manual creation flow',
    file: 'src/app/life-vision/manual/page.tsx',
    hrefTemplate: '/life-vision/manual',
  },
  {
    route: '/life-vision/[id]/experiment',
    label: 'Vision experiment view',
    tier: 'remove-now',
    studio: 'Life Vision',
    replacement: '/life-vision/[id]',
    reason: 'Unused experimental card layout',
    file: 'src/app/life-vision/[id]/experiment/page.tsx',
    hrefTemplate: '/life-vision/{visionId}/experiment',
    sampleKeys: ['visionId'],
  },
  {
    route: '/life-vision/[id]/refine/viva',
    label: 'VIVA refine (duplicate)',
    tier: 'remove-now',
    studio: 'Life Vision',
    replacement: '/life-vision/[id]/refine',
    reason: 'Duplicate refine implementation',
    file: 'src/app/life-vision/[id]/refine/viva/page.tsx',
    hrefTemplate: '/life-vision/{visionId}/refine/viva',
    sampleKeys: ['visionId'],
  },
  {
    route: '/life-vision/refine/new',
    label: 'Refine onboarding',
    tier: 'deprecate',
    studio: 'Life Vision',
    replacement: '/life-vision/create',
    reason: 'Old intensive refine onboarding',
    file: 'src/app/life-vision/refine/new/page.tsx',
    hrefTemplate: '/life-vision/refine/new',
  },

  // ── Story audio (→ Audio Studio) ─────────────────────────────────────────
  {
    route: '/story/[storyId]/audio',
    label: 'Story audio hub',
    tier: 'deprecate',
    studio: 'Story / Audio',
    replacement: '/audio/create',
    reason: 'Story audio tools moved to global Audio Studio',
    file: 'src/app/story/[storyId]/audio/page.tsx',
    hrefTemplate: '/story/{storyId}/audio',
    sampleKeys: ['storyId'],
  },
  {
    route: '/story/[storyId]/audio/generate',
    label: 'Story audio generate',
    tier: 'deprecate',
    studio: 'Story / Audio',
    replacement: '/audio/generate',
    reason: 'Use /audio/generate with story source selector',
    file: 'src/app/story/[storyId]/audio/generate/page.tsx',
    hrefTemplate: '/story/{storyId}/audio/generate',
    sampleKeys: ['storyId'],
  },
  {
    route: '/story/[storyId]/audio/record',
    label: 'Story audio record',
    tier: 'deprecate',
    studio: 'Story / Audio',
    replacement: '/audio/record',
    reason: 'Use /audio/record with story source selector',
    file: 'src/app/story/[storyId]/audio/record/page.tsx',
    hrefTemplate: '/story/{storyId}/audio/record',
    sampleKeys: ['storyId'],
  },
  {
    route: '/story/audio',
    label: 'Story audio landing',
    tier: 'review',
    studio: 'Story / Audio',
    replacement: '/audio/create',
    reason: 'Cross-story audio hub — may fold into Audio Studio',
    file: 'src/app/story/audio/page.tsx',
    hrefTemplate: '/story/audio',
  },

  // ── Vision Board orphans ───────────────────────────────────────────────────
  {
    route: '/vision-board/gallery',
    label: 'Vision gallery',
    tier: 'deprecate',
    studio: 'Vision Board',
    replacement: '/vision-board',
    reason: 'Not in My Board / Create tab structure',
    file: 'src/app/vision-board/gallery/page.tsx',
    hrefTemplate: '/vision-board/gallery',
  },
  {
    route: '/vision-board/[id]',
    label: 'Single board item page',
    tier: 'review',
    studio: 'Vision Board',
    replacement: '/vision-board (lightbox)',
    reason: 'Standalone item view vs inline board experience',
    file: 'src/app/vision-board/[id]/page.tsx',
    hrefTemplate: '/vision-board/{visionBoardId}',
    sampleKeys: ['visionBoardId'],
  },

  // ── Profile orphans ────────────────────────────────────────────────────────
  {
    route: '/profile/compare',
    label: 'Profile version compare',
    tier: 'deprecate',
    studio: 'Profile',
    replacement: '/profile',
    reason: 'Compare not in View / Update tabs',
    file: 'src/app/profile/compare/page.tsx',
    hrefTemplate: '/profile/compare',
  },
  {
    route: '/profile/[id]/refine',
    label: 'Profile refine summary',
    tier: 'deprecate',
    studio: 'Profile',
    replacement: '/profile/create',
    reason: 'Old refine summary outside studio flow',
    file: 'src/app/profile/[id]/refine/page.tsx',
    hrefTemplate: '/profile/{profileId}/refine',
    sampleKeys: ['profileId'],
  },
  {
    route: '/profile/[id]',
    label: 'Profile read-only detail',
    tier: 'review',
    studio: 'Profile',
    replacement: '/profile (version selector)',
    reason: 'May fold into main profile view with version picker',
    file: 'src/app/profile/[id]/page.tsx',
    hrefTemplate: '/profile/{profileId}',
    sampleKeys: ['profileId'],
  },

  // ── Journal / Daily Paper / Abundance detail pages ─────────────────────────
  {
    route: '/journal/[id]',
    label: 'Journal entry detail',
    tier: 'review',
    studio: 'Journal',
    replacement: '/journal (inline expand)',
    reason: 'Read-only detail vs list-first studio',
    file: 'src/app/journal/[id]/page.tsx',
    hrefTemplate: '/journal/{journalId}',
    sampleKeys: ['journalId'],
  },
  {
    route: '/journal/resources',
    label: 'Journal resources',
    tier: 'review',
    studio: 'Journal',
    replacement: null,
    reason: 'Learn/resources not in My Journal / Create tabs',
    file: 'src/app/journal/resources/page.tsx',
    hrefTemplate: '/journal/resources',
  },
  {
    route: '/daily-paper/[id]',
    label: 'Daily paper entry detail',
    tier: 'review',
    studio: 'Daily Paper',
    replacement: '/daily-paper (inline)',
    reason: 'Detail page outside list-first pattern',
    file: 'src/app/daily-paper/[id]/page.tsx',
    hrefTemplate: '/daily-paper/{dailyPaperId}',
    sampleKeys: ['dailyPaperId'],
  },
  {
    route: '/daily-paper/resources',
    label: 'Daily paper resources',
    tier: 'review',
    studio: 'Daily Paper',
    replacement: null,
    reason: 'Resources not in AreaBar tabs',
    file: 'src/app/daily-paper/resources/page.tsx',
    hrefTemplate: '/daily-paper/resources',
  },
  {
    route: '/abundance-tracker/[id]',
    label: 'Abundance event detail',
    tier: 'review',
    studio: 'Abundance Tracker',
    replacement: '/abundance-tracker (inline)',
    reason: 'Event detail vs Log / Goals / Reports tabs',
    file: 'src/app/abundance-tracker/[id]/page.tsx',
    hrefTemplate: '/abundance-tracker/{abundanceEventId}',
    sampleKeys: ['abundanceEventId'],
  },

  // ── Audio orphans ──────────────────────────────────────────────────────────
  {
    route: '/audio/explore',
    label: 'Audio explore (background tracks)',
    tier: 'review',
    studio: 'Audio',
    replacement: null,
    reason: 'Not in Listen / Create tabs — orphaned or future Explore tab',
    file: 'src/app/audio/explore/page.tsx',
    hrefTemplate: '/audio/explore',
  },

  // ── Assessment ─────────────────────────────────────────────────────────────
  {
    route: '/assessment/start',
    label: 'Assessment start flow',
    tier: 'review',
    studio: 'Assessment',
    replacement: '/assessment',
    reason: 'Pre-dates assessment hub; has AreaBar but old PageHero',
    file: 'src/app/assessment/start/page.tsx',
    hrefTemplate: '/assessment/start',
  },
  {
    route: '/assessment/in-progress',
    label: 'Assessment in-progress (generic)',
    tier: 'review',
    studio: 'Assessment',
    replacement: '/assessment/[id]/in-progress',
    reason: 'Generic in-progress state page',
    file: 'src/app/assessment/in-progress/page.tsx',
    hrefTemplate: '/assessment/in-progress',
  },

  // ── Site-wide dead ─────────────────────────────────────────────────────────
  {
    route: '/activation-protocol',
    label: 'Activation protocol',
    tier: 'remove-now',
    studio: 'Program',
    replacement: '/intensive',
    reason: 'Superseded by intensive program',
    file: 'src/app/activation-protocol/page.tsx',
    hrefTemplate: '/activation-protocol',
  },
  {
    route: '/north-star',
    label: 'North star dashboard',
    tier: 'remove-now',
    studio: 'Dashboard',
    replacement: '/dashboard',
    reason: 'Dead concept',
    file: 'src/app/admin/legacy/archive/north-star/page.tsx',
    hrefTemplate: '/north-star',
  },
  {
    route: '/scenes/builder',
    label: 'Scenes builder',
    tier: 'review',
    studio: 'Tools',
    replacement: '/tools/scenes',
    reason: 'Possibly replaced by /tools/scenes',
    file: 'src/app/scenes/builder/page.tsx',
    hrefTemplate: '/scenes/builder',
  },
  {
    route: '/voice-profile',
    label: 'Voice profile hub',
    tier: 'remove-now',
    studio: 'Voice Profile',
    replacement: null,
    reason: 'Archived feature',
    file: 'src/app/voice-profile/page.tsx',
    hrefTemplate: '/voice-profile',
  },
  {
    route: '/voice-profile/analyze',
    label: 'Voice profile analyze',
    tier: 'remove-now',
    studio: 'Voice Profile',
    replacement: null,
    reason: 'Archived feature',
    file: 'src/app/voice-profile/analyze/page.tsx',
    hrefTemplate: '/voice-profile/analyze',
  },
  {
    route: '/voice-profile/analyze/initial',
    label: 'Voice profile initial analyze',
    tier: 'remove-now',
    studio: 'Voice Profile',
    replacement: null,
    reason: 'Archived feature',
    file: 'src/app/voice-profile/analyze/initial/page.tsx',
    hrefTemplate: '/voice-profile/analyze/initial',
  },

  // ── Redirect shims (still on disk) ─────────────────────────────────────────
  {
    route: '/audio/listen',
    label: 'Audio listen redirect',
    tier: 'redirect-only',
    studio: 'Audio',
    replacement: '/audio',
    reason: 'Thin redirect — safe to keep until links cleaned',
    file: 'src/app/audio/listen/page.tsx',
    hrefTemplate: '/audio/listen',
  },
  {
    route: '/audio/ritual',
    label: 'Audio ritual redirect',
    tier: 'redirect-only',
    studio: 'Audio',
    replacement: '/audio',
    reason: 'Ritual tab merged into /audio',
    file: 'src/app/audio/ritual/page.tsx',
    hrefTemplate: '/audio/ritual',
  },
  {
    route: '/life-vision/active',
    label: 'Active vision redirect',
    tier: 'redirect-only',
    studio: 'Life Vision',
    replacement: '/life-vision/[activeId]',
    reason: 'Redirects to active vision detail',
    file: 'src/app/life-vision/active/page.tsx',
    hrefTemplate: '/life-vision/active',
  },
  {
    route: '/profile/active',
    label: 'Active profile redirect',
    tier: 'redirect-only',
    studio: 'Profile',
    replacement: '/profile/[activeId]',
    reason: 'Redirects to active profile',
    file: 'src/app/profile/active/page.tsx',
    hrefTemplate: '/profile/active',
  },
  {
    route: '/profile/active/edit',
    label: 'Active profile edit redirect',
    tier: 'redirect-only',
    studio: 'Profile',
    replacement: '/profile/[activeId]/edit',
    reason: 'Redirects to active profile editor',
    file: 'src/app/profile/active/edit/page.tsx',
    hrefTemplate: '/profile/active/edit',
  },
  {
    route: '/intensive/life-vision/new',
    label: 'Intensive LV new redirect',
    tier: 'redirect-only',
    studio: 'Intensive',
    replacement: '/intensive/life-vision/create',
    reason: 'Redirect to new create flow',
    file: 'src/app/intensive/life-vision/new/page.tsx',
    hrefTemplate: '/intensive/life-vision/new',
  },
  {
    route: '/intensive/life-vision/refine',
    label: 'Intensive LV refine redirect',
    tier: 'redirect-only',
    studio: 'Intensive',
    replacement: '/intensive/dashboard',
    reason: 'Refine deprecated in intensive',
    file: 'src/app/intensive/life-vision/refine/page.tsx',
    hrefTemplate: '/intensive/life-vision/refine',
  },
  {
    route: '/vibe-tribe/wins',
    label: 'Vibe Tribe wins filter',
    tier: 'redirect-only',
    studio: 'Community',
    replacement: '/vibe-tribe?filter=win',
    reason: 'Filter redirect shim',
    file: 'src/app/vibe-tribe/wins/page.tsx',
    hrefTemplate: '/vibe-tribe/wins',
  },
  {
    route: '/vibe-tribe/wobbles',
    label: 'Vibe Tribe wobbles filter',
    tier: 'redirect-only',
    studio: 'Community',
    replacement: '/vibe-tribe?filter=wobble',
    reason: 'Filter redirect shim',
    file: 'src/app/vibe-tribe/wobbles/page.tsx',
    hrefTemplate: '/vibe-tribe/wobbles',
  },
  {
    route: '/vibe-tribe/visions',
    label: 'Vibe Tribe visions filter',
    tier: 'redirect-only',
    studio: 'Community',
    replacement: '/vibe-tribe?filter=vision',
    reason: 'Filter redirect shim',
    file: 'src/app/vibe-tribe/visions/page.tsx',
    hrefTemplate: '/vibe-tribe/visions',
  },
  {
    route: '/vibe-tribe/collaboration',
    label: 'Vibe Tribe collaboration filter',
    tier: 'redirect-only',
    studio: 'Community',
    replacement: '/vibe-tribe?filter=collaboration',
    reason: 'Filter redirect shim',
    file: 'src/app/vibe-tribe/collaboration/page.tsx',
    hrefTemplate: '/vibe-tribe/collaboration',
  },
]

export const LEGACY_PAGES: LegacyPageEntry[] = LEGACY_PAGES_RAW.map(applyLegacyArchiveToEntry)

export const LEGACY_STUDIOS = [...new Set(LEGACY_PAGES.map(p => p.studio).filter(Boolean))].sort() as string[]

export const LEGACY_TIER_ORDER: LegacyPageTier[] = ['remove-now', 'deprecate', 'review', 'redirect-only']
