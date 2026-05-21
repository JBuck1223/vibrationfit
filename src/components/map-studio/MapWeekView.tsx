'use client'

import { useState, useEffect, useCallback } from 'react'
import { ChevronLeft, ChevronRight, Check, X, Minus } from 'lucide-react'
import { Spinner } from '@/lib/design-system/components'
import { useMapStudio } from './MapStudioContext'
import { useMapNavigation } from './use-map-navigation'
import { MapDateTravelTrigger } from './MapDateTravelTrigger'
import { isSystemCommitment } from '@/lib/map/commitment-classification'
import { PILLAR_META } from '@/lib/map/map-pillar-config'
import { getVisionCategory } from '@/lib/design-system/vision-categories'
import {
  getWeekDatesForDate,
  getWeekLabel,
  todayDateString,
  addDays,
} from '@/lib/map/map-date-utils'
import type { CommitmentOccurrence, OccurrenceStatus } from '@/lib/map/types'
import { mapTodayStyles } from '@/lib/map/map-today-styles'

const DAY_LABELS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

const STATUS_ICONS: Record<string, React.ReactNode> = {
  yes: <Check className="w-3 h-3" style={{ color: mapTodayStyles.primaryHex }} />,
  no: <X className="w-3 h-3 text-red-400" />,
  skipped: <Minus className="w-3 h-3 text-neutral-500" />,
}

const STATUS_BG: Record<string, string> = {
  no: 'bg-red-500/10',
  skipped: 'bg-neutral-800',
  pending: 'bg-neutral-900 border border-neutral-700',
}

export function MapWeekView() {
  const { navigateMap } = useMapNavigation()
  const {
    loading,
    selectedDate,
    planCommitments,
    loadOccurrencesForRange,
    verifyOccurrence,
    ensureOccurrencesForDate,
  } = useMapStudio()

  const [weekOccurrences, setWeekOccurrences] = useState<CommitmentOccurrence[]>([])
  const [loadingWeek, setLoadingWeek] = useState(false)
  const [weekAnchor, setWeekAnchor] = useState(selectedDate)

  useEffect(() => {
    setWeekAnchor(selectedDate)
  }, [selectedDate])

  const weekDates = getWeekDatesForDate(weekAnchor)
  const todayStr = todayDateString()

  const loadWeek = useCallback(async () => {
    setLoadingWeek(true)
    try {
      await ensureOccurrencesForDate(weekDates[0])
      const occs = await loadOccurrencesForRange(weekDates[0], weekDates[6])
      setWeekOccurrences(occs)
    } finally {
      setLoadingWeek(false)
    }
  }, [weekDates.join(','), loadOccurrencesForRange, ensureOccurrencesForDate])

  useEffect(() => {
    if (!loading) loadWeek()
  }, [loading, loadWeek])

  if (loading) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <Spinner size="lg" />
      </div>
    )
  }

  const occurrenceMap = new Map<string, CommitmentOccurrence>()
  for (const occ of weekOccurrences) {
    occurrenceMap.set(`${occ.commitment_id}:${occ.occurred_on}`, occ)
  }

  const handleCellClick = async (
    occ: CommitmentOccurrence | undefined,
    commitment: (typeof planCommitments)[0],
  ) => {
    if (!occ || isSystemCommitment(commitment)) return
    const next: OccurrenceStatus = occ.status === 'yes' ? 'pending' : 'yes'
    await verifyOccurrence(occ.id, next)
    await loadWeek()
  }

  const isCurrentWeek = weekDates.includes(todayStr)

  return (
    <div className="space-y-4">
      <div className="flex justify-center">
        <div className="inline-flex items-center gap-0.5 sm:gap-1">
          <button
            type="button"
            onClick={() => setWeekAnchor(addDays(weekAnchor, -7))}
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-neutral-400 hover:text-white hover:bg-white/5 active:scale-95 transition-all"
            aria-label="Previous week"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <div className="text-center px-2 sm:px-3">
            <MapDateTravelTrigger value={weekAnchor}>
              <span className="text-sm sm:text-base font-medium text-white whitespace-nowrap cursor-pointer rounded-md px-1 hover:bg-white/5 transition-colors">
                {getWeekLabel(weekDates)}
              </span>
            </MapDateTravelTrigger>
            {!isCurrentWeek && (
              <button
                type="button"
                onClick={() => setWeekAnchor(todayStr)}
                className="text-[11px] mt-1 hover:opacity-90 transition-opacity"
                style={{ color: mapTodayStyles.primaryHex }}
              >
                This week
              </button>
            )}
          </div>
          <button
            type="button"
            onClick={() => setWeekAnchor(addDays(weekAnchor, 7))}
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-neutral-400 hover:text-white hover:bg-white/5 active:scale-95 transition-all"
            aria-label="Next week"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      </div>

      {loadingWeek ? (
        <div className="flex justify-center py-12">
          <Spinner size="md" />
        </div>
      ) : (
        <div className="overflow-x-auto -mx-4 px-4">
          <table className="w-full min-w-[640px]">
            <thead>
              <tr>
                <th className="text-left text-xs text-neutral-500 pb-3 pr-3 w-[180px]">Commitment</th>
                {weekDates.map((date, i) => {
                  const isToday = date === todayStr
                  return (
                    <th
                      key={date}
                      className={`text-center text-xs pb-3 w-[52px] ${
                        isToday ? 'rounded-t-lg' : ''
                      }`}
                      style={
                        isToday
                          ? {
                              backgroundColor: mapTodayStyles.weekHeaderBg,
                              boxShadow: `inset 0 0 0 2px ${mapTodayStyles.weekHeaderOutline}`,
                            }
                          : undefined
                      }
                    >
                      <button
                        type="button"
                        onClick={() => navigateMap({ view: 'day', date })}
                        className={`w-full rounded-lg py-1 ${
                          isToday ? 'font-bold text-white' : 'text-neutral-500 hover:text-white'
                        }`}
                      >
                        {!isToday && (
                          <span className="block text-[9px] font-bold uppercase tracking-wider invisible mb-0.5 select-none" aria-hidden>
                            Today
                          </span>
                        )}
                        {isToday && (
                          <span
                            className="block text-[9px] font-bold uppercase tracking-wider mb-0.5"
                            style={{ color: mapTodayStyles.primaryHex }}
                          >
                            Today
                          </span>
                        )}
                        {DAY_LABELS[i]}
                        <br />
                        <span className="text-[10px] font-normal">
                          {new Date(date + 'T12:00:00').getDate()}
                        </span>
                      </button>
                    </th>
                  )
                })}
              </tr>
            </thead>
            <tbody>
              {planCommitments.map(commitment => {
                const label = isSystemCommitment(commitment)
                  ? PILLAR_META[commitment.category]?.verb
                  : getVisionCategory(commitment.category as Parameters<typeof getVisionCategory>[0])?.label
                return (
                  <tr key={commitment.id} className="border-t border-neutral-800/50">
                    <td className="py-2 pr-3">
                      <p className="text-sm text-neutral-300 truncate max-w-[180px]">
                        {commitment.title}
                      </p>
                      {label && (
                        <p className="text-[10px] text-neutral-600 truncate">{label}</p>
                      )}
                    </td>
                    {weekDates.map(date => {
                      const key = `${commitment.id}:${date}`
                      const occ = occurrenceMap.get(key)
                      const isToday = date === todayStr
                      return (
                        <td
                          key={date}
                          className="py-2 text-center"
                          style={
                            isToday ? { backgroundColor: mapTodayStyles.weekColBg } : undefined
                          }
                        >
                          {occ ? (
                            isSystemCommitment(commitment) ? (
                              <div
                                className={`w-8 h-8 rounded-lg mx-auto flex items-center justify-center ${
                                  occ.status === 'yes' ? '' : STATUS_BG[occ.status] ?? ''
                                }`}
                                style={{
                                  ...(occ.status === 'yes'
                                    ? { backgroundColor: mapTodayStyles.commitmentYesBg }
                                    : {}),
                                  ...(isToday
                                    ? {
                                        boxShadow: `0 0 0 2px ${mapTodayStyles.weekCellRing}, ${mapTodayStyles.weekCellShadow}`,
                                      }
                                    : {}),
                                }}
                                title="Auto-tracked"
                              >
                                {STATUS_ICONS[occ.status] || (
                                  <div className="w-2 h-2 rounded-full bg-neutral-600" />
                                )}
                              </div>
                            ) : (
                              <button
                                type="button"
                                onClick={() => handleCellClick(occ, commitment)}
                                className={`w-8 h-8 rounded-lg mx-auto flex items-center justify-center ${
                                  occ.status === 'yes' ? '' : STATUS_BG[occ.status] ?? ''
                                }`}
                                style={{
                                  ...(occ.status === 'yes'
                                    ? { backgroundColor: mapTodayStyles.commitmentYesBg }
                                    : {}),
                                  ...(isToday
                                    ? {
                                        boxShadow: `0 0 0 2px ${mapTodayStyles.weekCellRing}, ${mapTodayStyles.weekCellShadow}`,
                                      }
                                    : {}),
                                }}
                              >
                                {STATUS_ICONS[occ.status] || (
                                  <div className="w-2 h-2 rounded-full bg-neutral-600" />
                                )}
                              </button>
                            )
                          ) : (
                            <div
                              className="w-8 h-8 rounded-lg mx-auto"
                              style={
                                isToday
                                  ? {
                                      boxShadow: `0 0 0 2px ${mapTodayStyles.weekEmptyRing}`,
                                      backgroundColor: mapTodayStyles.weekEmptyBg,
                                    }
                                  : undefined
                              }
                            />
                          )}
                        </td>
                      )
                    })}
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
