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
      }),
    )
    .max(WIDGET_IDS.length * 2),
})

export const DEFAULT_LAYOUT: DashboardLayout = {
  version: DASHBOARD_LAYOUT_VERSION,
  widgets: WIDGET_META.map((w) => ({ id: w.id, size: w.defaultSize, visible: w.defaultVisible })),
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
    const { id, size, visible } = raw as { id?: unknown; size?: unknown; visible?: unknown }
    if (!isWidgetId(id) || seen.has(id)) continue
    seen.add(id)
    const meta = WIDGET_META_BY_ID[id]
    widgets.push({
      id,
      size: coerceWidgetSize(size, meta.defaultSize),
      visible: meta.pinned ? true : typeof visible === 'boolean' ? visible : meta.defaultVisible,
    })
  }

  for (const meta of WIDGET_META) {
    if (seen.has(meta.id)) continue
    widgets.push({ id: meta.id, size: meta.defaultSize, visible: meta.defaultVisible })
  }

  const pinned = widgets.filter((w) => WIDGET_META_BY_ID[w.id].pinned)
  const rest = widgets.filter((w) => !WIDGET_META_BY_ID[w.id].pinned)

  return { version: DASHBOARD_LAYOUT_VERSION, widgets: [...pinned, ...rest] }
}
