'use client'

import { Container, Stack, PracticeCard, Spinner } from '@/lib/design-system/components'
import { useAllAreaStats, type AreaSlug } from '@/hooks/useAreaStats'
import {
  Headphones,
  BookOpen,
  Music,
  PenTool,
  FileText,
  Video,
  TrendingUp,
  UsersRound,
  Image,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'

const STREAK_AREAS: {
  area: AreaSlug
  title: string
  icon: LucideIcon
  theme: 'green' | 'yellow' | 'purple' | 'teal'
  href: string
  cta: string
  ctaDone: string
  streakUnit?: 'weeks'
}[] = [
  { area: 'vision-audio', title: 'Life Vision', icon: Headphones, theme: 'green', href: '/audio', cta: 'Listen', ctaDone: 'Listen again' },
  { area: 'story-listen', title: 'Stories', icon: BookOpen, theme: 'purple', href: '/audio', cta: 'Listen', ctaDone: 'Listen again' },
  { area: 'music-listen', title: 'Music', icon: Music, theme: 'teal', href: '/audio', cta: 'Listen', ctaDone: 'Listen again' },
  { area: 'journal', title: 'Journal', icon: PenTool, theme: 'yellow', href: '/journal/new', cta: 'Open Journal', ctaDone: 'Write again' },
  { area: 'daily-paper', title: 'Daily Paper', icon: FileText, theme: 'yellow', href: '/daily-paper/new', cta: 'Open Daily Paper', ctaDone: 'Review' },
  { area: 'alignment-gym', title: 'Alignment Gym', icon: Video, theme: 'teal', href: '/alignment-gym', cta: 'Join Session', ctaDone: 'Watch Replay', streakUnit: 'weeks' },
  { area: 'abundance-tracker', title: 'Abundance', icon: TrendingUp, theme: 'green', href: '/abundance-tracker/new', cta: 'Log Abundance', ctaDone: 'Log another' },
  { area: 'vibe-tribe', title: 'Vibe Tribe', icon: UsersRound, theme: 'purple', href: '/vibe-tribe', cta: 'Share', ctaDone: 'Back to Tribe' },
  { area: 'vision-board', title: 'Vision Board', icon: Image, theme: 'green', href: '/vision-board', cta: 'Open Vision Board', ctaDone: 'View Board' },
]

export default function TrackingStreaksPage() {
  const { allStats, loading } = useAllAreaStats()

  if (loading) {
    return (
      <Container size="xl">
        <div className="flex min-h-[calc(100vh-16rem)] items-center justify-center">
          <Spinner size="md" />
        </div>
      </Container>
    )
  }

  return (
    <Container size="xl">
      <Stack gap="md">
        <div className="space-y-3">
          {STREAK_AREAS.map(({ area, title, icon, theme, href, cta, ctaDone, streakUnit }) => {
            const s = allStats[area]
            return (
              <PracticeCard
                key={area}
                title={title}
                icon={icon}
                theme={theme}
                inline
                todayCompleted={s?.todayCompleted ?? false}
                currentStreak={s?.currentStreak ?? 0}
                streakUnit={streakUnit}
                countLast7={s?.countLast7 ?? 0}
                countLast30={s?.countLast30 ?? 0}
                countAllTime={s?.countAllTime ?? 0}
                streakFreezeAvailable={s?.streakFreezeAvailable ?? false}
                streakFreezeUsedThisWeek={s?.streakFreezeUsedThisWeek ?? false}
                ctaHref={href}
                ctaLabel={cta}
                ctaDoneLabel={ctaDone}
              />
            )
          })}
        </div>
      </Stack>
    </Container>
  )
}
