'use client'

import { useCallback, type ReactNode } from 'react'
import { DatePicker } from '@/lib/design-system/components'
import { cn } from '@/lib/design-system/components/shared-utils'
import { useMapStudio } from './MapStudioContext'
import { useMapNavigation } from './use-map-navigation'

interface MapDateTravelTriggerProps {
  children: ReactNode
  /** ISO date for the picker (defaults to studio selectedDate) */
  value?: string
  className?: string
  popoverAlign?: 'start' | 'end'
}

export function MapDateTravelTrigger({
  children,
  value,
  className,
  popoverAlign = 'start',
}: MapDateTravelTriggerProps) {
  const { today, goToDate } = useMapNavigation()
  const {
    selectedDate,
    selectablePlanDates,
    planSnapshotLoading,
  } = useMapStudio()

  const pickerValue = value ?? selectedDate

  const handleDateChange = useCallback(
    (date: string) => {
      if (!date) return
      if (selectablePlanDates.size > 0 && !selectablePlanDates.has(date)) return
      goToDate(date)
    },
    [goToDate, selectablePlanDates],
  )

  if (selectablePlanDates.size === 0) {
    return <>{children}</>
  }

  const sortedDates = [...selectablePlanDates].sort()
  const minDate = sortedDates[0]
  const maxDate = sortedDates[sortedDates.length - 1] <= today ? sortedDates[sortedDates.length - 1] : today

  return (
    <DatePicker
      value={pickerValue}
      onChange={handleDateChange}
      minDate={minDate}
      maxDate={maxDate}
      allowedDates={selectablePlanDates}
      customTrigger={children}
      popoverAlign={popoverAlign}
      disabled={planSnapshotLoading}
      className={cn('w-auto', className)}
    />
  )
}
