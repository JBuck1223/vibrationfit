'use client'

import { useEffect, Suspense } from 'react'
import { Container, Stack, Spinner } from '@/lib/design-system/components'
import { MapDayView } from '@/components/map-studio/MapDayView'
import { MapWeekView } from '@/components/map-studio/MapWeekView'
import { MapMonthView } from '@/components/map-studio/MapMonthView'
import { useMapStudio } from '@/components/map-studio'
import { useMapNavigation } from '@/components/map-studio/use-map-navigation'

function MapPageContent() {
  const { viewMode, urlDate } = useMapNavigation()
  const { setSelectedDate } = useMapStudio()

  useEffect(() => {
    if (urlDate) {
      setSelectedDate(urlDate)
    }
  }, [urlDate, setSelectedDate])

  return (
    <Container size="xl">
      <Stack gap="lg">
        {viewMode === 'day' && <MapDayView />}
        {viewMode === 'week' && <MapWeekView />}
        {viewMode === 'month' && <MapMonthView />}
      </Stack>
    </Container>
  )
}

export default function MapPage() {
  return (
    <Suspense
      fallback={
        <Container size="xl">
          <div className="flex min-h-[calc(100vh-16rem)] items-center justify-center">
            <Spinner size="lg" />
          </div>
        </Container>
      }
    >
      <MapPageContent />
    </Suspense>
  )
}
