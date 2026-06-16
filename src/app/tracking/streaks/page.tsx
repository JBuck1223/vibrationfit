'use client'

import { Container, Stack, PracticeCard, Spinner } from '@/lib/design-system/components'
import { useAllAreaStats } from '@/hooks/useAreaStats'
import { PILLAR_ORDER, PILLAR_META } from '@/lib/map/map-pillar-config'
import { getStreakAreaIcon, STREAK_AREAS } from '@/lib/tracking/streak-area-config'

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
      <Stack gap="lg">
        {PILLAR_ORDER.map(pillar => {
          const areas = STREAK_AREAS.filter(area => area.pillar === pillar)
          if (areas.length === 0) return null

          const meta = PILLAR_META[pillar]

          return (
            <section key={pillar}>
              <div
                className="mb-4 flex items-center justify-center rounded-xl px-4 py-3"
                style={{ backgroundColor: `${meta.color}18` }}
              >
                <h2 className="text-lg font-bold" style={{ color: meta.color }}>
                  {meta.label}
                </h2>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
                {areas.map(({ area, title, theme, href, cta, ctaDone, streakUnit }) => {
                  const s = allStats[area]
                  return (
                    <PracticeCard
                      key={area}
                      title={title}
                      icon={getStreakAreaIcon(area)}
                      theme={theme}
                      compact
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
            </section>
          )
        })}
      </Stack>
    </Container>
  )
}
