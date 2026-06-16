import type { AreaSlug } from '@/hooks/useAreaStats'
import type { MapCategory } from '@/lib/map/types'
import { getActivityDefinition } from '@/lib/map/activities'
import { userNavigation } from '@/lib/navigation/menu-definitions'
import type { LucideIcon } from 'lucide-react'

/** MAP activity types used for streak cards — icons come from ACTIVITY_DEFINITIONS. */
export const STREAK_AREA_ACTIVITY_TYPE: Record<AreaSlug, string> = {
  'vision-audio': 'vision_audio',
  'story-listen': 'story_audio',
  'music-listen': 'music_listen',
  'vision-board': 'vision_board_view',
  journal: 'journal_entry',
  'daily-paper': 'daily_paper',
  'abundance-tracker': 'abundance_tracker',
  'vibe-tribe': 'vibe_tribe_post',
  'alignment-gym': 'alignment_gym',
}

/** Sidebar hrefs when the nav icon should win over MAP (same feature, different MAP type). */
const SIDEBAR_ICON_HREF: Partial<Record<AreaSlug, string>> = {
  'story-listen': '/story',
  'vision-audio': '/audio',
  journal: '/journal',
  'daily-paper': '/daily-paper',
  'vision-board': '/vision-board',
  'vibe-tribe': '/vibe-tribe',
  'alignment-gym': '/alignment-gym',
}

function getSidebarIcon(href: string): LucideIcon | undefined {
  const item = userNavigation.find(
    entry => 'href' in entry && entry.href === href,
  )
  return item && 'icon' in item ? item.icon : undefined
}

export function getStreakAreaIcon(area: AreaSlug): LucideIcon {
  const sidebarHref = SIDEBAR_ICON_HREF[area]
  if (sidebarHref) {
    const sidebarIcon = getSidebarIcon(sidebarHref)
    if (sidebarIcon) return sidebarIcon
  }

  const activityType = STREAK_AREA_ACTIVITY_TYPE[area]
  const activity = getActivityDefinition(activityType)
  if (activity?.icon) return activity.icon

  throw new Error(`Missing icon for streak area: ${area}`)
}

export type StreakAreaConfig = {
  area: AreaSlug
  pillar: MapCategory
  title: string
  theme: 'green' | 'yellow' | 'purple' | 'teal'
  href: string
  cta: string
  ctaDone: string
  streakUnit?: 'weeks'
}

export const STREAK_AREAS: StreakAreaConfig[] = [
  {
    area: 'vision-audio',
    pillar: 'activations',
    title: 'Life Vision',
    theme: 'green',
    href: '/audio',
    cta: 'Listen',
    ctaDone: 'Listen again',
  },
  {
    area: 'story-listen',
    pillar: 'activations',
    title: 'Stories',
    theme: 'purple',
    href: '/audio',
    cta: 'Listen',
    ctaDone: 'Listen again',
  },
  {
    area: 'music-listen',
    pillar: 'activations',
    title: 'Music',
    theme: 'teal',
    href: '/audio',
    cta: 'Listen',
    ctaDone: 'Listen again',
  },
  {
    area: 'vision-board',
    pillar: 'activations',
    title: 'Vision Board',
    theme: 'green',
    href: '/vision-board',
    cta: 'Open Vision Board',
    ctaDone: 'View Board',
  },
  {
    area: 'journal',
    pillar: 'creations',
    title: 'Journal',
    theme: 'yellow',
    href: '/journal/new',
    cta: 'Open Journal',
    ctaDone: 'Write again',
  },
  {
    area: 'daily-paper',
    pillar: 'creations',
    title: 'Daily Paper',
    theme: 'yellow',
    href: '/daily-paper/new',
    cta: 'Open Daily Paper',
    ctaDone: 'Review',
  },
  {
    area: 'abundance-tracker',
    pillar: 'creations',
    title: 'Abundance',
    theme: 'green',
    href: '/abundance-tracker/new',
    cta: 'Log Abundance',
    ctaDone: 'Log another',
  },
  {
    area: 'vibe-tribe',
    pillar: 'connections',
    title: 'Vibe Tribe',
    theme: 'purple',
    href: '/vibe-tribe',
    cta: 'Share',
    ctaDone: 'Back to Tribe',
  },
  {
    area: 'alignment-gym',
    pillar: 'sessions',
    title: 'Alignment Gym',
    theme: 'teal',
    href: '/alignment-gym',
    cta: 'Join Session',
    ctaDone: 'Watch Replay',
    streakUnit: 'weeks',
  },
]
