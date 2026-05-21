'use client'

import { useCallback, useMemo } from 'react'
import { useMapStudio } from './MapStudioContext'
import { todayDateString } from '@/lib/map/map-date-utils'
import type { MapViewMode } from '@/lib/map/map-date-utils'

/** MAP day/week/month navigation via studio context (no URL query params). */
export function useMapNavigation() {
  const {
    selectedDate,
    viewMode,
    setSelectedDate,
    setViewMode,
    refreshPlanForDate,
    selectablePlanDates,
  } = useMapStudio()

  const today = todayDateString()

  const sortedDates = useMemo(
    () => [...selectablePlanDates].sort(),
    [selectablePlanDates],
  )

  const goToDate = useCallback(
    (date: string) => {
      setSelectedDate(date)
      void refreshPlanForDate(date)
    },
    [setSelectedDate, refreshPlanForDate],
  )

  const prevSelectableDate = useMemo(() => {
    const idx = sortedDates.indexOf(selectedDate)
    if (idx > 0) return sortedDates[idx - 1]
    if (idx < 0 && sortedDates.length > 0) {
      const earlier = sortedDates.filter(d => d < selectedDate)
      return earlier.length > 0 ? earlier[earlier.length - 1] : null
    }
    return null
  }, [sortedDates, selectedDate])

  const nextSelectableDate = useMemo(() => {
    const idx = sortedDates.indexOf(selectedDate)
    if (idx >= 0 && idx < sortedDates.length - 1) return sortedDates[idx + 1]
    if (idx < 0 && sortedDates.length > 0) {
      const later = sortedDates.filter(d => d > selectedDate)
      return later.length > 0 ? later[0] : null
    }
    return null
  }, [sortedDates, selectedDate])

  const openDayView = useCallback(
    (date: string) => {
      setViewMode('day')
      setSelectedDate(date)
      void refreshPlanForDate(date)
    },
    [setViewMode, setSelectedDate, refreshPlanForDate],
  )

  return {
    selectedDate,
    viewMode,
    today,
    setViewMode,
    goToDate,
    openDayView,
    prevSelectableDate,
    nextSelectableDate,
  }
}

export type { MapViewMode }
