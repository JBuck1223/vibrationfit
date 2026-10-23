'use client'

import { Suspense, useEffect, useRef } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Container, Stack, Spinner } from '@/lib/design-system/components'
import { MapDayView } from '@/components/map-studio/MapDayView'
import { MapWeekView } from '@/components/map-studio/MapWeekView'
import { MapMonthView } from '@/components/map-studio/MapMonthView'
import { useMapStudio } from '@/components/map-studio'
import { todayDateString } from '@/lib/map/map-date-utils'
import type { MapViewMode } from '@/lib/map/map-date-utils'

function MapPageContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { viewMode, setViewMode, setSelectedDate } = useMapStudio()
  const didInitRef = useRef(false)

  useEffect(() => {
    if (didInitRef.current) return
    didInitRef.current = true

    const view = searchParams.get('view')
    const date = searchParams.get('date')
    if (view === 'week' || view === 'month') {
      setViewMode(view as MapViewMode)
    }
    if (date && /^\d{4}-\d{2}-\d{2}$/.test(date)) {
      setSelectedDate(date)
    } else {
      setSelectedDate(todayDateString())
    }
    if (searchParams.toString()) {
      router.replace('/map', { scroll: false })
    }
  }, [searchParams, router, setViewMode, setSelectedDate])

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
