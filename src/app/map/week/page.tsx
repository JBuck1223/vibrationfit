'use client'

import { useState, useEffect, useCallback } from 'react'
import {
  Container,
  Stack,
  Card,
  Spinner,
  Badge,
} from '@/lib/design-system/components'
import { ChevronLeft, ChevronRight, Check, X, Minus } from 'lucide-react'
import { useMapStudio } from '@/components/map-studio'
import { toDateString } from '@/lib/map/cadence'
import type { CommitmentOccurrence } from '@/lib/map/types'

const DAY_LABELS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

const STATUS_ICONS: Record<string, React.ReactNode> = {
  yes: <Check className="w-3 h-3 text-primary-400" />,
  no: <X className="w-3 h-3 text-red-400" />,
  skipped: <Minus className="w-3 h-3 text-neutral-500" />,
}

const STATUS_BG: Record<string, string> = {
  yes: 'bg-primary-500/20',
  no: 'bg-red-500/10',
  skipped: 'bg-neutral-800',
  pending: 'bg-neutral-900 border border-neutral-700',
}

export default function MapWeekPage() {
  const { commitments, loading } = useMapStudio()
  const [weekOffset, setWeekOffset] = useState(0)
  const [weekOccurrences, setWeekOccurrences] = useState<CommitmentOccurrence[]>([])
  const [loadingWeek, setLoadingWeek] = useState(false)

  const weekDates = getWeekDates(weekOffset)

  const loadWeekOccurrences = useCallback(async () => {
    setLoadingWeek(true)
    try {
      const occurrences: CommitmentOccurrence[] = []
      for (const date of weekDates) {
        const res = await fetch(`/api/map/occurrences?date=${date}`)
        if (res.ok) {
          const data = await res.json()
          occurrences.push(...(data.occurrences || []))
        }
      }
      setWeekOccurrences(occurrences)
    } catch (e) {
      console.error('Error loading week occurrences:', e)
    } finally {
      setLoadingWeek(false)
    }
  }, [weekDates.join(',')])

  useEffect(() => {
    if (!loading) {
      loadWeekOccurrences()
    }
  }, [loading, weekOffset])

  if (loading) {
    return (
      <Container size="xl">
        <div className="flex min-h-[calc(100vh-16rem)] items-center justify-center">
          <Spinner size="lg" />
        </div>
      </Container>
    )
  }

  const activeCommitments = commitments.filter(c => c.status === 'active' && c.type === 'recurring')
  const todayStr = toDateString(new Date())
  const weekLabel = getWeekLabel(weekDates)

  const occurrenceMap = new Map<string, CommitmentOccurrence>()
  for (const occ of weekOccurrences) {
    occurrenceMap.set(`${occ.commitment_id}:${occ.occurred_on}`, occ)
  }

  return (
    <Container size="xl">
      <Stack gap="lg">
        {/* Week Navigation */}
        <div className="flex items-center justify-between">
          <button
            onClick={() => setWeekOffset(w => w - 1)}
            className="p-2 rounded-lg bg-neutral-900 hover:bg-neutral-800 transition-colors"
          >
            <ChevronLeft className="w-5 h-5 text-neutral-400" />
          </button>
          <div className="text-center">
            <p className="text-sm font-medium text-white">{weekLabel}</p>
            {weekOffset !== 0 && (
              <button
                onClick={() => setWeekOffset(0)}
                className="text-xs text-primary-400 hover:text-primary-300 mt-0.5"
              >
                Back to this week
              </button>
            )}
          </div>
          <button
            onClick={() => setWeekOffset(w => w + 1)}
            className="p-2 rounded-lg bg-neutral-900 hover:bg-neutral-800 transition-colors"
          >
            <ChevronRight className="w-5 h-5 text-neutral-400" />
          </button>
        </div>

        {/* Grid */}
        {loadingWeek ? (
          <div className="flex justify-center py-12">
            <Spinner size="md" />
          </div>
        ) : (
          <div className="overflow-x-auto -mx-4 px-4">
            <table className="w-full min-w-[600px]">
              <thead>
                <tr>
                  <th className="text-left text-xs text-neutral-500 pb-3 pr-3 w-[160px]">Commitment</th>
                  {weekDates.map((date, i) => {
                    const isToday = date === todayStr
                    return (
                      <th
                        key={date}
                        className={`text-center text-xs pb-3 w-[50px] ${
                          isToday ? 'text-primary-400 font-bold' : 'text-neutral-500'
                        }`}
                      >
                        {DAY_LABELS[i]}
                        <br />
                        <span className="text-[10px] font-normal">
                          {new Date(date + 'T12:00:00').getDate()}
                        </span>
                      </th>
                    )
                  })}
                </tr>
              </thead>
              <tbody>
                {activeCommitments.map(commitment => (
                  <tr key={commitment.id} className="border-t border-neutral-800/50">
                    <td className="py-2 pr-3">
                      <p className="text-sm text-neutral-300 truncate max-w-[160px]">
                        {commitment.title}
                      </p>
                    </td>
                    {weekDates.map(date => {
                      const key = `${commitment.id}:${date}`
                      const occ = occurrenceMap.get(key)
                      const isToday = date === todayStr
                      return (
                        <td key={date} className="py-2 text-center">
                          {occ ? (
                            <div className={`w-8 h-8 rounded-lg mx-auto flex items-center justify-center ${STATUS_BG[occ.status]} ${isToday ? 'ring-1 ring-primary-500/30' : ''}`}>
                              {STATUS_ICONS[occ.status] || (
                                <div className="w-2 h-2 rounded-full bg-neutral-600" />
                              )}
                            </div>
                          ) : (
                            <div className={`w-8 h-8 rounded-lg mx-auto ${isToday ? 'ring-1 ring-neutral-700' : ''}`} />
                          )}
                        </td>
                      )
                    })}
                  </tr>
                ))}

                {activeCommitments.length === 0 && (
                  <tr>
                    <td colSpan={8} className="py-12 text-center text-sm text-neutral-500">
                      No active recurring commitments
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* Week Summary */}
        {weekOccurrences.length > 0 && (
          <div className="flex items-center justify-center gap-6 text-center">
            <div>
              <p className="text-2xl font-bold text-primary-400">
                {weekOccurrences.filter(o => o.status === 'yes').length}
              </p>
              <p className="text-xs text-neutral-500">Verified</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-red-400">
                {weekOccurrences.filter(o => o.status === 'no').length}
              </p>
              <p className="text-xs text-neutral-500">Missed</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-neutral-400">
                {weekOccurrences.filter(o => o.status === 'pending').length}
              </p>
              <p className="text-xs text-neutral-500">Pending</p>
            </div>
          </div>
        )}
      </Stack>
    </Container>
  )
}

function getWeekDates(offset: number): string[] {
  const now = new Date()
  const day = now.getDay()
  const mondayDiff = day === 0 ? -6 : 1 - day
  const monday = new Date(now)
  monday.setDate(now.getDate() + mondayDiff + offset * 7)

  const dates: string[] = []
  for (let i = 0; i < 7; i++) {
    const d = new Date(monday)
    d.setDate(monday.getDate() + i)
    dates.push(toDateString(d))
  }
  return dates
}

function getWeekLabel(dates: string[]): string {
  if (dates.length < 7) return ''
  const start = new Date(dates[0] + 'T12:00:00')
  const end = new Date(dates[6] + 'T12:00:00')
  const opts: Intl.DateTimeFormatOptions = { month: 'short', day: 'numeric' }
  return `${start.toLocaleDateString('en-US', opts)} – ${end.toLocaleDateString('en-US', opts)}`
}
