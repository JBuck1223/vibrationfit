import { z } from 'zod'
import {
  WIDGET_IDS,
  WIDGET_META,
  WIDGET_META_BY_ID,
  WIDGET_SIZES,
  coerceWidgetSize,
  isWidgetId,
  type WidgetId,
  type WidgetSize,
} from './widgets/registry'

export interface DashboardWidgetPlacement {
  id: WidgetId
  size: WidgetSize
  visible: boolean
  /** Pinned widgets render first, in their own order, and are always visible. */
  pinned: boolean
}

export interface DashboardLayout {
  version: 1
  widgets: DashboardWidgetPlacement[]
}

export const DASHBOARD_LAYOUT_VERSION = 1 as const

export const dashboardLayoutSchema = z.object({
  version: z.literal(DASHBOARD_LAYOUT_VERSION),
  widgets: z
    .array(
      z.object({
        id: z.enum(WIDGET_IDS),
        size: z.enum(WIDGET_SIZES),
        visible: z.boolean(),
        pinned: z.boolean().optional(),
      }),
    )
    .max(WIDGET_IDS.length * 2),
})

export const LAYOUT_PRESET_IDS = ['recommended', 'tools', 'social', 'stats'] as const
export type LayoutPresetId = (typeof LAYOUT_PRESET_IDS)[number]

export interface LayoutPreset {
  id: LayoutPresetId
  label: string
  description: string
  layout: DashboardLayout
}

/** Listed widgets show in order at the given width; every other widget is hidden. */
function presetLayout(entries: [WidgetId, WidgetSize][]): DashboardLayout {
  const listed = new Set(entries.map(([id]) => id))
  return normalizeLayout({
    version: DASHBOARD_LAYOUT_VERSION,
    widgets: [
      ...entries.map(([id, size]) => ({ id, size, visible: true })),
      ...WIDGET_META.filter((w) => !listed.has(w.id)).map((w) => ({ id: w.id, size: w.defaultSize, visible: false })),
    ],
  })
}

/**
 * Each preset fills every row to 12 columns at desktop width. "Recommended"
 * is ordered by how many members use each area (vision audio, board, MAP,
 * Life Vision, VIVA, journal, tribe, Daily Paper, abundance).
 */
export const LAYOUT_PRESETS: LayoutPreset[] = [
  {
    id: 'recommended',
    label: 'Recommended',
    description: 'What members use most, at the top.',
    layout: presetLayout([
      ['listen', 'two-thirds'],
      ['life-vision', 'third'],
      ['today-map', 'two-thirds'],
      ['viva', 'third'],
      ['manifestations', 'two-thirds'],
      ['journal', 'third'],
      ['vibe-tribe', 'third'],
      ['daily-paper', 'third'],
      ['streaks', 'third'],
      ['momentum', 'half'],
      ['alignment-gym', 'quarter'],
      ['abundance', 'quarter'],
    ]),
  },
  {
    id: 'tools',
    label: 'Tools',
    description: 'Your daily practice: MAP, audio, paper, journal.',
    layout: presetLayout([
      ['today-map', 'two-thirds'],
      ['daily-paper', 'third'],
      ['listen', 'two-thirds'],
      ['viva', 'third'],
      ['journal', 'third'],
      ['abundance', 'third'],
      ['life-vision', 'third'],
    ]),
  },
  {
    id: 'social',
    label: 'Social',
    description: 'Tribe, live sessions, and shared wins first.',
    layout: presetLayout([
      ['vibe-tribe', 'two-thirds'],
      ['alignment-gym', 'third'],
      ['manifestations', 'two-thirds'],
      ['viva', 'third'],
      ['streaks', 'half'],
      ['journal', 'quarter'],
      ['abundance', 'quarter'],
    ]),
  },
  {
    id: 'stats',
    label: 'Stats',
    description: 'Momentum, streaks, and numbers up front.',
    layout: presetLayout([
      ['momentum', 'full'],
      ['streaks', 'two-thirds'],
      ['abundance', 'third'],
      ['today-map', 'half'],
      ['life-vision', 'quarter'],
      ['tokens', 'quarter'],
    ]),
  },
]

export const LAYOUT_PRESETS_BY_ID = Object.fromEntries(LAYOUT_PRESETS.map((p) => [p.id, p])) as Record<
  LayoutPresetId,
  LayoutPreset
>

export const DEFAULT_LAYOUT: DashboardLayout = LAYOUT_PRESETS_BY_ID.recommended.layout

function visibleSignature(widgets: DashboardWidgetPlacement[], includePinned: boolean) {
  return widgets
    .filter((w) => w.visible && (includePinned || !w.pinned))
    .map((w) => `${w.id}:${w.size}${w.pinned ? ':p' : ''}`)
    .join('|')
}

/**
 * The preset whose unpinned widgets (order and width) this layout matches.
 * Pins are the member's own choice and carry across presets.
 */
export function matchLayoutPreset(layout: DashboardLayout): LayoutPresetId | null {
  const current = visibleSignature(layout.widgets, false)
  return LAYOUT_PRESETS.find((p) => visibleSignature(p.layout.widgets, false) === current)?.id ?? null
}

/** True when the layout looks exactly like the default, pins included. */
export function isDefaultLayout(layout: DashboardLayout): boolean {
  return visibleSignature(layout.widgets, true) === visibleSignature(DEFAULT_LAYOUT.widgets, true)
}

/** A preset's widgets with the member's current pins (and pinned widths) kept. */
export function applyPinsToPreset(
  preset: DashboardLayout,
  current: DashboardWidgetPlacement[],
): DashboardWidgetPlacement[] {
  const currentById = new Map(current.map((w) => [w.id, w]))
  const pinned = current.filter((w) => w.pinned)
  const rest = preset.widgets
    .filter((w) => !currentById.get(w.id)?.pinned)
    .map((w) => ({ ...w, pinned: false }))
  return [...pinned, ...rest]
}

/**
 * Bring any saved layout up to date with the registry: drop unknown ids,
 * dedupe, force pinned widgets to the front and visible, and append widgets
 * the member has never seen with their defaults.
 */
export function normalizeLayout(saved: unknown): DashboardLayout {
  const seen = new Set<WidgetId>()
  const widgets: DashboardWidgetPlacement[] = []

  const rawWidgets =
    saved && typeof saved === 'object' && Array.isArray((saved as { widgets?: unknown }).widgets)
      ? ((saved as { widgets: unknown[] }).widgets)
      : []

  for (const raw of rawWidgets) {
    if (!raw || typeof raw !== 'object') continue
    const { id, size, visible, pinned: rawPinned } = raw as {
      id?: unknown
      size?: unknown
      visible?: unknown
      pinned?: unknown
    }
    if (!isWidgetId(id) || seen.has(id)) continue
    seen.add(id)
    const meta = WIDGET_META_BY_ID[id]
    const pinned = typeof rawPinned === 'boolean' ? rawPinned : Boolean(meta.defaultPinned)
    widgets.push({
      id,
      size: coerceWidgetSize(size, meta.defaultSize),
      visible: pinned ? true : typeof visible === 'boolean' ? visible : meta.defaultVisible,
      pinned,
    })
  }

  for (const meta of WIDGET_META) {
    if (seen.has(meta.id)) continue
    const pinned = Boolean(meta.defaultPinned)
    widgets.push({ id: meta.id, size: meta.defaultSize, visible: pinned || meta.defaultVisible, pinned })
  }

  const pinned = widgets.filter((w) => w.pinned)
  const rest = widgets.filter((w) => !w.pinned)

  return { version: DASHBOARD_LAYOUT_VERSION, widgets: [...pinned, ...rest] }
}
