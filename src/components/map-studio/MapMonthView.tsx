'use client'

import { useState, useEffect, useCallback } from 'react'
import { ChevronLeft, ChevronRight, CheckCircle2 } from 'lucide-react'
import { Spinner } from '@/lib/design-system/components'
import { cn } from '@/lib/design-system/components/shared-utils'
import { useMapStudio } from './MapStudioContext'
import { useMapNavigation } from './use-map-navigation'
import { MapDateTravelTrigger } from './MapDateTravelTrigger'
import {
  getMonthGrid,
  getMonthLabel,
  monthFromDateStr,
  todayDateString,
} from '@/lib/map/map-date-utils'
import type { CommitmentOccurrence } from '@/lib/map/types'
import { mapTodayStyles } from '@/lib/map/map-today-styles'

const WEEKDAYS_SHORT = ['M', 'T', 'W', 'T', 'F', 'S', 'S'] as const
const WEEKDAYS_FULL = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'] as const

const RING_RADIUS = 15
const RING_CIRCUMFERENCE = 2 * Math.PI * RING_RADIUS

function MapMonthDayRing({
  dayNum,
  yes,
  total,
  isSelected,
  isToday,
  showRing,
}: {
  dayNum: number
  yes: number
  total: number
  isSelected: boolean
  isToday: boolean
  showRing: boolean
}) {
  const progress = total > 0 ? Math.min(1, yes / total) : 0
  const allDone = total > 0 && yes === total
  const strokeDashoffset = RING_CIRCUMFERENCE * (1 - progress)
  const showProgressRing = showRing && !isSelected

  return (
    <div className="relative h-11 w-11 shrink-0">
      {showProgressRing && (
        <svg
          className="absolute inset-0 h-full w-full -rotate-90"
          viewBox="0 0 36 36"
          aria-hidden
        >
          {!allDone && (
            <circle
              cx="18"
              cy="18"
              r={RING_RADIUS}
              fill="none"
              className="stroke-neutral-600"
              strokeWidth="2.5"
            />
          )}
          {total > 0 && !allDone && (
            <circle
              cx="18"
              cy="18"
              r={RING_RADIUS}
              fill="none"
              stroke={mapTodayStyles.primaryHex}
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeDasharray={RING_CIRCUMFERENCE}
              strokeDashoffset={strokeDashoffset}
              className="transition-[stroke-dashoffset] duration-300"
            />
          )}
          {allDone && (
            <circle
              cx="18"
              cy="18"
              r={RING_RADIUS}
              fill="none"
              stroke={mapTodayStyles.primaryHex}
              strokeWidth="2.5"
            />
          )}
        </svg>
      )}
      <span
        className={cn(
          'absolute inset-[4px] z-10 flex items-center justify-center rounded-full text-sm font-medium tabular-nums transition-colors',
          isSelected && !allDone && 'bg-primary-500 text-black font-semibold',
          !allDone && isToday && !isSelected && 'text-primary-400',
          !allDone && !isToday && !isSelected && 'text-neutral-200',
        )}
      >
        {allDone ? (
          <CheckCircle2 className="h-5 w-5 text-black" strokeWidth={2} aria-hidden />
        ) : (
          <span className={cn(isSelected && 'font-semibold text-black')}>{dayNum}</span>
        )}
      </span>
    </div>
  )
}

export function MapMonthView() {
  const { openDayView } = useMapNavigation()
  const {
    loading,
    selectedDate,
    loadOccurrencesForRange,
    ensureOccurrencesForDate,
    selectablePlanDates,
    activeCommitments,
  } = useMapStudio()

  const initial = monthFromDateStr(selectedDate)
  const [year, setYear] = useState(initial.year)
  const [month, setMonth] = useState(initial.month)

  useEffect(() => {
    const next = monthFromDateStr(selectedDate)
    setYear(next.year)
    setMonth(next.month)
  }, [selectedDate])

  const [monthOccurrences, setMonthOccurrences] = useState<CommitmentOccurrence[]>([])
  const [loadingMonth, setLoadingMonth] = useState(false)

  const todayStr = todayDateString()
  const weeks = getMonthGrid(year, month)

  const monthStart = `${year}-${String(month + 1).padStart(2, '0')}-01`
  const lastDay = new Date(year, month + 1, 0).getDate()
  const monthEnd = `${year}-${String(month + 1).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`

  const hasLivePlan = activeCommitments.length > 0

  const loadMonth = useCallback(async () => {
    setLoadingMonth(true)
    try {
      await ensureOccurrencesForDate(todayStr)
      const occs = await loadOccurrencesForRange(monthStart, monthEnd)
      setMonthOccurrences(occs)
    } finally {
      setLoadingMonth(false)
    }
  }, [monthStart, monthEnd, todayStr, loadOccurrencesForRange, ensureOccurrencesForDate])

  useEffect(() => {
    if (!loading) loadMonth()
  }, [loading, loadMonth])

  const prevMonth = () => {
    if (month === 0) {
      setMonth(11)
      setYear(y => y - 1)
    } else {
      setMonth(m => m - 1)
    }
  }

  const nextMonth = () => {
    if (month === 11) {
      setMonth(0)
      setYear(y => y + 1)
    } else {
      setMonth(m => m + 1)
    }
  }

  const hasSelectableRegistry = selectablePlanDates.size > 0

  function dayHadActivePlan(dateStr: string): boolean {
    if (dateStr > todayStr) return false
    if (hasSelectableRegistry) return selectablePlanDates.has(dateStr)
    return hasLivePlan && dateStr === todayStr
  }

  const summaryByDate = new Map<string, { yes: number; total: number }>()
  for (const occ of monthOccurrences) {
    if (!dayHadActivePlan(occ.occurred_on)) continue
    const cur = summaryByDate.get(occ.occurred_on) || { yes: 0, total: 0 }
    cur.total++
    if (occ.status === 'yes') cur.yes++
    summaryByDate.set(occ.occurred_on, cur)
  }

  if (loading) {
    return (
      <div className="flex min-h-[36vh] items-center justify-center">
        <Spinner size="lg" />
      </div>
    )
  }

  return (
    <div className="mx-auto w-full max-w-xl space-y-4">
      <div className="flex justify-center">
        <div className="inline-flex items-center gap-0.5 sm:gap-1">
          <button
            type="button"
            onClick={prevMonth}
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-neutral-400 hover:text-white hover:bg-white/5 active:scale-95 transition-all"
            aria-label="Previous month"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <div className="text-center px-2 sm:px-3">
            <MapDateTravelTrigger>
              <span className="text-sm sm:text-base font-medium text-white whitespace-nowrap cursor-pointer rounded-md px-1 hover:bg-white/5 transition-colors">
                {getMonthLabel(year, month)}
              </span>
            </MapDateTravelTrigger>
          </div>
          <button
            type="button"
            onClick={nextMonth}
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-neutral-400 hover:text-white hover:bg-white/5 active:scale-95 transition-all"
            aria-label="Next month"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      </div>

      {loadingMonth ? (
        <div className="flex justify-center py-12">
          <Spinner size="md" />
        </div>
      ) : !hasLivePlan && !hasSelectableRegistry ? (
        <div className="rounded-2xl border border-white/[0.06] bg-[#111] px-6 py-12 text-center">
          <h3 className="text-base font-semibold text-white">No commitments yet</h3>
          <p className="mx-auto mt-2 max-w-sm text-sm text-neutral-400">
            Set up your MAP commitments to start tracking your monthly alignment.
          </p>
          <a
            href="/map/update"
            className="mt-5 inline-flex items-center justify-center rounded-full px-5 py-2.5 text-sm font-semibold text-black transition-opacity hover:opacity-90"
            style={{ backgroundColor: mapTodayStyles.primaryHex }}
          >
            Go to Update
          </a>
        </div>
      ) : (
        <div className="rounded-2xl bg-neutral-900/40 p-3 sm:p-4">
          <div className="mb-2 grid grid-cols-7 gap-1.5 text-center">
            {WEEKDAYS_FULL.map((label, i) => (
              <div
                key={label}
                className="py-1 text-[11px] font-medium text-neutral-500 sm:text-xs"
              >
                <span className="hidden sm:inline">{label}</span>
                <span className="sm:hidden">{WEEKDAYS_SHORT[i]}</span>
              </div>
            ))}
          </div>

          <div className="space-y-1.5">
            {weeks.map((week, wi) => (
              <div key={wi} className="grid grid-cols-7 gap-1.5">
                {week.map((dateStr, di) => {
                  if (!dateStr) {
                    return <div key={`empty-${wi}-${di}`} className="min-h-[3.5rem] sm:min-h-[3.75rem]" />
                  }

                  const summary = summaryByDate.get(dateStr)
                  const isToday = dateStr === todayStr
                  const isSelected = dateStr === selectedDate
                  const dayNum = new Date(dateStr + 'T12:00:00').getDate()
                  const logged = summary?.yes ?? 0
                  const total = summary?.total ?? 0
                  const hadPlan = dayHadActivePlan(dateStr)
                  const canOpenDay = hadPlan
                  const showRing = hadPlan && total > 0

                  return (
                    <button
                      key={dateStr}
                      type="button"
                      disabled={!canOpenDay}
                      onClick={() => openDayView(dateStr)}
                      aria-label={
                        total > 0 && logged === total
                          ? `${dayNum}: all ${total} completed`
                          : total > 0
                            ? `${dayNum}: ${logged} of ${total} completed`
                            : `${dayNum}`
                      }
                      className={cn(
                        'flex min-h-[3.5rem] sm:min-h-[3.75rem] items-center justify-center rounded-xl p-1 transition-all active:scale-[0.98]',
                        !canOpenDay && 'cursor-not-allowed opacity-25',
                        canOpenDay && !isSelected && 'hover:bg-neutral-800/50',
                      )}
                    >
                      <MapMonthDayRing
                        dayNum={dayNum}
                        yes={logged}
                        total={total}
                        isSelected={isSelected}
                        isToday={isToday}
                        showRing={showRing}
                      />
                    </button>
                  )
                })}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
