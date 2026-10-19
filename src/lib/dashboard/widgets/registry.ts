/**
 * Dashboard widget metadata (no React). Shared by the API route (validation)
 * and the client registry (which attaches components in
 * src/components/dashboard/widgets/registry.tsx).
 */

/** Widget width as a fraction of the 12-column grid, narrowest to widest. */
export const WIDGET_SIZES = ['quarter', 'third', 'half', 'two-thirds', 'three-quarters', 'full'] as const

export type WidgetSize = (typeof WIDGET_SIZES)[number]

export const WIDGET_SIZE_META: Record<WidgetSize, { label: string; span: number }> = {
  quarter: { label: '1/4', span: 3 },
  third: { label: '1/3', span: 4 },
  half: { label: '1/2', span: 6 },
  'two-thirds': { label: '2/3', span: 8 },
  'three-quarters': { label: '3/4', span: 9 },
  full: { label: 'Full', span: 12 },
}

export function isWidgetSize(value: unknown): value is WidgetSize {
  return typeof value === 'string' && (WIDGET_SIZES as readonly string[]).includes(value)
}

/** Translate pre-fraction saved values ('sm' | 'lg') and validate the rest. */
export function coerceWidgetSize(value: unknown, fallback: WidgetSize): WidgetSize {
  if (value === 'sm') return 'third'
  if (value === 'lg') return 'two-thirds'
  return isWidgetSize(value) ? value : fallback
}

/** Half width or wider: widgets can lay content out in more columns. */
export function isWideWidget(size: WidgetSize): boolean {
  return WIDGET_SIZE_META[size].span >= 6
}

export function adjacentWidgetSize(size: WidgetSize, direction: -1 | 1): WidgetSize | null {
  const index = WIDGET_SIZES.indexOf(size) + direction
  return index >= 0 && index < WIDGET_SIZES.length ? WIDGET_SIZES[index] : null
}

export const WIDGET_IDS = [
  'tools-training',
  'today-map',
  'daily-paper',
  'listen',
  'viva',
  'streaks',
  'journal',
  'abundance',
  'manifestations',
  'vibe-tribe',
  'momentum',
  'alignment-gym',
  'life-vision',
  'tokens',
  'referrals',
] as const

export type WidgetId = (typeof WIDGET_IDS)[number]

export interface WidgetMeta {
  id: WidgetId
  title: string
  description: string
  defaultSize: WidgetSize
  defaultVisible: boolean
  /** Starts pinned to the top. Members can unpin (or pin others) in Customize. */
  defaultPinned?: boolean
  /** Conditional widgets only exist for members matching this flag. */
  availability?: 'always' | 'training-open'
}

/** Default order follows the daily rhythm: do today's thing, press play, log, reflect. */
export const WIDGET_META: WidgetMeta[] = [
  {
    id: 'tools-training',
    title: 'Tools Training',
    description: 'Finish the walk-through of each room.',
    defaultSize: 'half',
    defaultVisible: true,
    defaultPinned: true,
    availability: 'training-open',
  },
  {
    id: 'today-map',
    title: "Today's MAP",
    description: 'Verify today\'s commitments without leaving home.',
    defaultSize: 'two-thirds',
    defaultVisible: true,
  },
  {
    id: 'daily-paper',
    title: 'Daily Paper',
    description: 'Gratitude, three tasks, and a fun plan.',
    defaultSize: 'third',
    defaultVisible: true,
  },
  {
    id: 'listen',
    title: 'Listen',
    description: 'Press play on your Life Vision, latest song, or story.',
    defaultSize: 'two-thirds',
    defaultVisible: true,
  },
  {
    id: 'viva',
    title: 'VIVA',
    description: 'Pick up your last conversation or start a new one.',
    defaultSize: 'third',
    defaultVisible: true,
  },
  {
    id: 'streaks',
    title: 'Streaks',
    description: 'Your practice streaks at a glance.',
    defaultSize: 'half',
    defaultVisible: true,
  },
  {
    id: 'journal',
    title: 'Journal',
    description: 'Capture, review, and turn entries into stories.',
    defaultSize: 'quarter',
    defaultVisible: true,
  },
  {
    id: 'abundance',
    title: 'Abundance',
    description: 'What came in this month.',
    defaultSize: 'quarter',
    defaultVisible: true,
  },
  {
    id: 'manifestations',
    title: 'Manifestations',
    description: 'Your board, in motion.',
    defaultSize: 'two-thirds',
    defaultVisible: true,
  },
  {
    id: 'vibe-tribe',
    title: 'Vibe Tribe',
    description: 'What the tribe is sharing right now.',
    defaultSize: 'third',
    defaultVisible: true,
  },
  {
    id: 'momentum',
    title: 'Momentum',
    description: 'Twelve weeks of practice, day by day.',
    defaultSize: 'two-thirds',
    defaultVisible: true,
  },
  {
    id: 'alignment-gym',
    title: 'Alignment Gym',
    description: 'Your next live session.',
    defaultSize: 'third',
    defaultVisible: true,
  },
  {
    id: 'life-vision',
    title: 'Life Vision',
    description: 'Read, listen, or refine the life you choose.',
    defaultSize: 'half',
    defaultVisible: true,
  },
  {
    id: 'tokens',
    title: 'Tokens',
    description: 'VIVA token balance for you and your household.',
    defaultSize: 'half',
    defaultVisible: false,
  },
  {
    id: 'referrals',
    title: 'Referral Partners',
    description: 'Share your link, send intros, and earn bill credit.',
    defaultSize: 'half',
    defaultVisible: true,
    defaultPinned: true,
  },
]

export const WIDGET_META_BY_ID: Record<WidgetId, WidgetMeta> = Object.fromEntries(
  WIDGET_META.map((w) => [w.id, w]),
) as Record<WidgetId, WidgetMeta>

export function isWidgetId(value: unknown): value is WidgetId {
  return typeof value === 'string' && (WIDGET_IDS as readonly string[]).includes(value)
}
