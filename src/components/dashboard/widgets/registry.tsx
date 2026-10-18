'use client'

import type { WidgetId } from '@/lib/dashboard/widgets/registry'
import type { WidgetComponent } from '../DashboardGrid'
import { ToolsTrainingWidget } from './ToolsTrainingWidget'
import { TodayMapWidget } from './TodayMapWidget'
import { DailyPaperWidget } from './DailyPaperWidget'
import { ListenWidget } from './ListenWidget'
import { StreaksWidget } from './StreaksWidget'
import { VivaWidget } from './VivaWidget'
import { JournalWidget } from './JournalWidget'
import { AbundanceWidget } from './AbundanceWidget'
import { ManifestationsWidget } from './ManifestationsWidget'
import { VibeTribeWidget } from './VibeTribeWidget'
import { AlignmentGymWidget } from './AlignmentGymWidget'
import { LifeVisionWidget } from './LifeVisionWidget'
import { MomentumWidget } from './MomentumWidget'
import { TokensWidget } from './TokensWidget'

/** Widget id -> component. Metadata lives in src/lib/dashboard/widgets/registry.ts. */
export const WIDGET_COMPONENTS: Record<WidgetId, WidgetComponent> = {
  'tools-training': ToolsTrainingWidget,
  'today-map': TodayMapWidget,
  'daily-paper': DailyPaperWidget,
  listen: ListenWidget,
  streaks: StreaksWidget,
  viva: VivaWidget,
  journal: JournalWidget,
  abundance: AbundanceWidget,
  manifestations: ManifestationsWidget,
  'vibe-tribe': VibeTribeWidget,
  'alignment-gym': AlignmentGymWidget,
  'life-vision': LifeVisionWidget,
  momentum: MomentumWidget,
  tokens: TokensWidget,
}
