'use client'

import { useCallback, useMemo } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { todayDateString } from '@/lib/map/map-date-utils'
import type { MapViewMode } from '@/lib/map/map-date-utils'

function parseDateParam(value: string | null): string | null {
  if (value && /^\d{4}-\d{2}-\d{2}$/.test(value)) return value
  return null
}

export function useMapNavigation() {
  const router = useRouter()
  const searchParams = useSearchParams()

  const viewMode = useMemo((): MapViewMode => {
    const view = searchParams.get('view')
    if (view === 'week' || view === 'month') return view
    return 'day'
  }, [searchParams])

  const urlDate = useMemo(
    () => parseDateParam(searchParams.get('date')),
    [searchParams],
  )

  const buildMapPath = useCallback(
    (options: { view?: MapViewMode; date?: string | null }) => {
      const params = new URLSearchParams()
      const view = options.view ?? viewMode
      const date = options.date !== undefined ? options.date : urlDate

      if (view !== 'day') params.set('view', view)
      if (date) params.set('date', date)

      const qs = params.toString()
      return qs ? `/map?${qs}` : '/map'
    },
    [viewMode, urlDate],
  )

  const navigateMap = useCallback(
    (options: { view?: MapViewMode; date?: string | null }) => {
      router.replace(buildMapPath(options), { scroll: false })
    },
    [router, buildMapPath],
  )

  return {
    viewMode,
    urlDate,
    today: todayDateString(),
    buildMapPath,
    navigateMap,
  }
}
