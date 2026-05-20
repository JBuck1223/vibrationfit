'use client'

import { useState, useEffect, useCallback, type CSSProperties } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { Spinner } from '@/lib/design-system/components'
import { useMapStudio } from './MapStudioContext'
import { useMapNavigation } from './use-map-navigation'
import {
  getMonthGrid,
  getMonthLabel,
  monthFromDateStr,
  todayDateString,
} from '@/lib/map/map-date-utils'
import type { CommitmentOccurrence } from '@/lib/map/types'
import { mapTodayStyles } from '@/lib/map/map-today-styles'

export function MapMonthView() {
  const { navigateMap } = useMapNavigation()
  const {
    loading,
    selectedDate,
    loadOccurrencesForRange,
    ensureOccurrencesForDate,
  } = useMapStudio()

  const initial = monthFromDateStr(selectedDate)
  const [year, setYear] = useState(initial.year)
  const [month, setMonth] = useState(initial.month)
  const [monthOccurrences, setMonthOccurrences] = useState<CommitmentOccurrence[]>([])
  const [loadingMonth, setLoadingMonth] = useState(false)

  const todayStr = todayDateString()
  const weeks = getMonthGrid(year, month)

  const monthStart = `${year}-${String(month + 1).padStart(2, '0')}-01`
  const lastDay = new Date(year, month + 1, 0).getDate()
  const monthEnd = `${year}-${String(month + 1).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`

  const loadMonth = useCallback(async () => {
    setLoadingMonth(true)
    try {
      await ensureOccurrencesForDate(monthStart)
      const occs = await loadOccurrencesForRange(monthStart, monthEnd)
      setMonthOccurrences(occs)
    } finally {
      setLoadingMonth(false)
    }
  }, [monthStart, monthEnd, loadOccurrencesForRange, ensureOccurrencesForDate])

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

  const summaryByDate = new Map<string, { yes: number; total: number }>()
  for (const occ of monthOccurrences) {
    const cur = summaryByDate.get(occ.occurred_on) || { yes: 0, total: 0 }
    cur.total++
    if (occ.status === 'yes') cur.yes++
    summaryByDate.set(occ.occurred_on, cur)
  }

  if (loading) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <Spinner size="lg" />
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <button type="button" onClick={prevMonth} className="p-2 rounded-lg bg-neutral-900 hover:bg-neutral-800">
          <ChevronLeft className="w-5 h-5 text-neutral-400" />
        </button>
        <p className="text-sm font-medium text-white">{getMonthLabel(year, month)}</p>
        <button type="button" onClick={nextMonth} className="p-2 rounded-lg bg-neutral-900 hover:bg-neutral-800">
          <ChevronRight className="w-5 h-5 text-neutral-400" />
        </button>
      </div>

      {loadingMonth ? (
        <div className="flex justify-center py-12">
          <Spinner size="md" />
        </div>
      ) : (
        <>
          <div className="grid grid-cols-7 gap-1 text-center text-[10px] text-neutral-500 uppercase">
            {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map(d => (
              <div key={d} className="py-1">{d}</div>
            ))}
          </div>
          <div className="space-y-1">
            {weeks.map((week, wi) => (
              <div key={wi} className="grid grid-cols-7 gap-1">
                {week.map((dateStr, di) => {
                  if (!dateStr) {
                    return <div key={`empty-${wi}-${di}`} className="aspect-square" />
                  }
                  const summary = summaryByDate.get(dateStr)
                  const isToday = dateStr === todayStr
                  const isSelected = dateStr === selectedDate
                  const dayNum = new Date(dateStr + 'T12:00:00').getDate()

                  const cellSurface: CSSProperties =
                    isSelected
                      ? {
                          backgroundColor: mapTodayStyles.monthSelectedBg,
                          boxShadow: `0 0 0 2px ${mapTodayStyles.monthSelectedRing}, ${mapTodayStyles.monthSelectedShadow}`,
                        }
                      : isToday
                        ? {
                            backgroundColor: mapTodayStyles.monthTodayBg,
                            boxShadow: `0 0 0 2px ${mapTodayStyles.monthTodayRing}, ${mapTodayStyles.monthTodayShadow}`,
                          }
                        : {}

                  return (
                    <button
                      key={dateStr}
                      type="button"
                      onClick={() => navigateMap({ view: 'day', date: dateStr })}
                      className={`aspect-square rounded-xl flex flex-col items-center justify-center gap-0.5 transition-all ${
                        !isSelected && !isToday
                          ? 'bg-neutral-900/50 hover:bg-neutral-800'
                          : ''
                      }`}
                      style={cellSurface}
                    >
                      {isToday && (
                        <span
                          className="text-[8px] font-bold uppercase tracking-wider leading-none"
                          style={{ color: mapTodayStyles.primaryHex }}
                        >
                          Today
                        </span>
                      )}
                      <span
                        className="text-sm font-medium"
                        style={{
                          color:
                            isToday || isSelected
                              ? mapTodayStyles.primaryHex
                              : '#ffffff',
                        }}
                      >
                        {dayNum}
                      </span>
                      {summary && summary.total > 0 && (
                        <span className="text-[9px] text-neutral-500">
                          {summary.yes}/{summary.total}
                        </span>
                      )}
                    </button>
                  )
                })}
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  )
}
