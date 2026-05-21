'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import { ChevronLeft, ChevronRight, ChevronDown, CheckCircle2, Circle, XCircle, MinusCircle } from 'lucide-react'
import { Button, Spinner } from '@/lib/design-system/components'
import { useMapStudio } from './MapStudioContext'
import { useMapNavigation } from './use-map-navigation'
import { MapVerifyButtons } from './MapVerifyButtons'
import { MapDateTravelTrigger } from './MapDateTravelTrigger'
import { PILLAR_ORDER, PILLAR_META } from '@/lib/map/map-pillar-config'
import { getActivityDefinition, getMapActivityDeepLink } from '@/lib/map/activities'
import { getVisionCategory } from '@/lib/design-system/vision-categories'
import {
  addDays,
  formatDisplayDate,
} from '@/lib/map/map-date-utils'
import type { Commitment, CommitmentOccurrence } from '@/lib/map/types'
import { mapTodayStyles } from '@/lib/map/map-today-styles'
import { getAdjacentSelectableDate } from '@/lib/map/snapshot'

export function MapDayView() {
  const { navigateMap, today } = useMapNavigation()
  const {
    loading,
    selectedDate,
    dateOccurrences,
    planCommitments,
    isHistoricalPlan,
    systemCommitments,
    customCommitments,
    commitmentsByPillar,
    commitmentsByLifeCategory,
    verifyOccurrence,
    selectablePlanDates,
  } = useMapStudio()

  const sortedSelectableDates = useMemo(
    () => [...selectablePlanDates].sort(),
    [selectablePlanDates],
  )
  const prevSelectableDate = getAdjacentSelectableDate(selectedDate, -1, sortedSelectableDates)
  const nextSelectableDate = getAdjacentSelectableDate(selectedDate, 1, sortedSelectableDates)
  const canJumpToToday = selectablePlanDates.has(today)

  const isPast = selectedDate < today
  const isToday = selectedDate === today

  if (loading) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <Spinner size="lg" />
      </div>
    )
  }

  if (planCommitments.length === 0) {
    return (
      <div className="text-center py-16 px-4">
        <h2 className="text-xl font-bold text-white mb-2">No commitments yet</h2>
        <p className="text-sm text-neutral-500 mb-6 max-w-md mx-auto">
          Set up your System MAP and Custom actions in Update, then track them here day by day.
        </p>
        <Button variant="primary" asChild>
          <Link href="/map/update">Go to Update</Link>
        </Button>
      </div>
    )
  }

  const occurrenceMap = new Map<string, CommitmentOccurrence>()
  for (const occ of dateOccurrences) {
    occurrenceMap.set(occ.commitment_id, occ)
  }

  const systemOccs = dateOccurrences.filter(o =>
    systemCommitments.some(c => c.id === o.commitment_id),
  )
  const customOccs = dateOccurrences.filter(o =>
    customCommitments.some(c => c.id === o.commitment_id),
  )
  const systemDone = systemOccs.filter(o => o.status === 'yes').length
  const customLogged = customOccs.filter(o => o.status === 'yes').length
  const systemTotal = systemOccs.length > 0 ? systemOccs.length : systemCommitments.length
  const customTotal = customOccs.length > 0 ? customOccs.length : customCommitments.length
  const customCategories = Object.keys(commitmentsByLifeCategory).sort()
  const hasCustomPendingPast = isPast && customOccs.some(o => o.status === 'pending')

  return (
    <div className="w-full space-y-4 sm:space-y-5">
      {isHistoricalPlan && (
        <p className="text-center text-xs text-neutral-500 px-1">
          Plan on {formatDisplayDate(selectedDate)} — logs reflect that day.
        </p>
      )}

      <div className="flex justify-center">
        <div className="inline-flex items-center gap-0.5 sm:gap-1">
          <button
            type="button"
            onClick={() => prevSelectableDate && navigateMap({ view: 'day', date: prevSelectableDate })}
            disabled={!prevSelectableDate}
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-neutral-400 hover:text-white hover:bg-white/5 active:scale-95 transition-all disabled:opacity-30 disabled:pointer-events-none"
            aria-label="Previous day"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <div className="text-center px-2 sm:px-3">
            {isToday && (
              <p className="text-[10px] font-medium text-neutral-400 uppercase tracking-wider mb-0.5">
                Today
              </p>
            )}
            <MapDateTravelTrigger>
              <span className="text-sm sm:text-base font-medium text-white whitespace-nowrap cursor-pointer rounded-md px-1 hover:bg-white/5 transition-colors">
                {formatDisplayDate(selectedDate)}
              </span>
            </MapDateTravelTrigger>
            {!isToday && canJumpToToday && (
              <button
                type="button"
                onClick={() => navigateMap({ view: 'day', date: today })}
                className="text-[11px] mt-1 text-neutral-500 hover:text-white transition-colors"
              >
                Jump to today
              </button>
            )}
          </div>
          <button
            type="button"
            onClick={() => nextSelectableDate && navigateMap({ view: 'day', date: nextSelectableDate })}
            disabled={!nextSelectableDate}
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-neutral-400 hover:text-white hover:bg-white/5 active:scale-95 transition-all disabled:opacity-30 disabled:pointer-events-none"
            aria-label="Next day"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      </div>

      {hasCustomPendingPast && (
        <p className="text-center text-[11px] text-amber-200/80 px-2">
          Backfill custom logs for {formatDisplayDate(selectedDate)}.
        </p>
      )}

      {/* System pillars */}
      {systemCommitments.length > 0 && (
        <section className="rounded-xl bg-neutral-900/40 overflow-hidden">
          <div className="relative px-3 pt-3 pb-3">
            <p className="absolute right-3 top-3 text-sm tabular-nums shrink-0">
              <span style={{ color: mapTodayStyles.primaryHex }}>{systemDone}</span>
              <span className="text-neutral-600">/{systemTotal}</span>
            </p>
            <div className="text-center px-10">
              <p className="text-sm font-medium text-white">System MAP</p>
              <p className="text-[11px] text-neutral-600 mt-0.5">
                Tap a ritual to open — alignment tracks automatically.
              </p>
            </div>
          </div>
          <div className="px-2 pb-2">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 items-stretch">
          {PILLAR_ORDER.map(pillar => {
            const meta = PILLAR_META[pillar]
            const pillarCommitments = commitmentsByPillar[pillar]
            const pillarDone = pillarCommitments.filter(
              c => occurrenceMap.get(c.id)?.status === 'yes',
            ).length

            if (pillarCommitments.length === 0) {
              return (
                <div
                  key={pillar}
                  className="rounded-xl bg-neutral-900/35 flex flex-col h-full min-h-[5.5rem] overflow-hidden"
                >
                  <PillarTitleHeader
                    verb={meta.verb}
                    color={meta.color}
                    done={0}
                    total={0}
                  />
                  <div className="px-3 py-3 text-center flex-1 flex items-center justify-center">
                    <p className="text-[11px] text-neutral-600">
                      <Link href="/map/update/system" className="hover:text-neutral-400 transition-colors">
                        Set up
                      </Link>
                    </p>
                  </div>
                </div>
              )
            }

            return (
              <div
                key={pillar}
                className="rounded-xl bg-neutral-900/40 flex flex-col h-full overflow-hidden"
              >
                <PillarTitleHeader
                  verb={meta.verb}
                  color={meta.color}
                  done={pillarDone}
                  total={pillarCommitments.length}
                />
                <div className="flex flex-col flex-1 gap-1 px-1.5 pt-2 pb-2">
                  {pillarCommitments.map(c => (
                    <SystemCommitmentRow
                      key={c.id}
                      commitment={c}
                      occurrence={occurrenceMap.get(c.id)}
                      pillarColor={meta.color}
                      compact
                      onVerify={async (status) => {
                        const occ = occurrenceMap.get(c.id)
                        if (occ) await verifyOccurrence(occ.id, status)
                      }}
                    />
                  ))}
                </div>
              </div>
            )
          })}
            </div>
          </div>
        </section>
      )}

      {/* Custom */}
      {customCommitments.length > 0 && (
        <section className="rounded-xl bg-neutral-900/40 overflow-hidden">
          <div className="relative px-3 pt-3 pb-2">
            <p className="absolute right-3 top-3 text-sm tabular-nums shrink-0">
              <span className="text-white">{customLogged}</span>
              <span className="text-neutral-600">/{customTotal}</span>
            </p>
            <div className="text-center px-10">
              <p className="text-sm font-medium text-white">Custom Commitments</p>
              <p className="text-[11px] text-neutral-500 mt-0.5">
                Tap yes when complete.
              </p>
            </div>
          </div>
          <div className="px-2 pb-2 space-y-3">
            {customCategories.map(catKey => {
              const cat = getVisionCategory(catKey as Parameters<typeof getVisionCategory>[0])
              const items = commitmentsByLifeCategory[catKey]

              return (
                <div key={catKey}>
                  <p className="text-[10px] text-neutral-600 px-2 py-1">
                    {cat?.label || catKey}
                  </p>
                  <div className="rounded-lg bg-black/20 overflow-hidden">
                    {items.map(c => (
                      <CustomCommitmentRow
                        key={c.id}
                        commitment={c}
                        occurrence={occurrenceMap.get(c.id)}
                        onVerify={async (status) => {
                          const occ = occurrenceMap.get(c.id)
                          if (occ) await verifyOccurrence(occ.id, status)
                        }}
                      />
                    ))}
                  </div>
                </div>
              )
            })}
          </div>
        </section>
      )}
    </div>
  )
}

function PillarTitleHeader({
  verb,
  color,
  done,
  total,
}: {
  verb: string
  color: string
  done: number
  total: number
}) {
  return (
    <div
      className="flex items-center justify-between gap-2 px-3 pt-2.5 pb-3 shrink-0"
      style={{ backgroundColor: `${color}18` }}
    >
      <p className="text-[13px] font-medium leading-tight" style={{ color }}>
        {verb}
      </p>
      {total > 0 && (
        <p className="text-[11px] text-neutral-500 tabular-nums shrink-0">
          {done}/{total}
        </p>
      )}
    </div>
  )
}

function MapStatusIndicator({
  status,
}: {
  status: CommitmentOccurrence['status'] | 'none'
}) {
  if (status === 'yes') {
    return (
      <span className="inline-flex items-center gap-1 shrink-0">
        <span className="text-[11px] font-medium text-primary-500">Complete</span>
        <CheckCircle2
          className="w-[18px] h-[18px] text-primary-500"
          strokeWidth={2}
          aria-hidden
        />
      </span>
    )
  }
  if (status === 'no') {
    return <XCircle className="w-[18px] h-[18px] shrink-0 text-red-400/85" strokeWidth={1.75} aria-label="Missed" />
  }
  if (status === 'skipped') {
    return <MinusCircle className="w-[18px] h-[18px] shrink-0 text-neutral-500" strokeWidth={1.75} aria-label="Skipped" />
  }
  if (status === 'none') {
    return <span className="w-[18px] h-[18px] shrink-0 flex items-center justify-center text-neutral-600 text-xs">—</span>
  }
  return <Circle className="w-[18px] h-[18px] shrink-0 text-neutral-600" strokeWidth={1.75} aria-label="Not yet" />
}

function SystemCommitmentRow({
  commitment,
  occurrence,
  pillarColor,
  compact = false,
  onVerify,
}: {
  commitment: Commitment
  occurrence?: CommitmentOccurrence
  pillarColor?: string
  compact?: boolean
  onVerify: (status: 'yes' | 'no' | 'skipped') => Promise<void>
}) {
  const [manualOpen, setManualOpen] = useState(false)
  const activity = commitment.activity_type
    ? getActivityDefinition(commitment.activity_type)
    : null
  const Icon = activity?.icon
  const status = occurrence?.status ?? 'pending'
  const isVerified = status === 'yes'
  const deepLink = commitment.activity_type
    ? getMapActivityDeepLink(commitment.activity_type, { completed: isVerified })
    : '/map'

  return (
    <div className="overflow-hidden rounded-lg bg-white/[0.03]">
      <Link
        href={deepLink}
        className={`flex w-full items-center gap-2.5 transition-colors hover:bg-white/[0.04] active:bg-white/[0.06] ${
          compact ? 'px-2.5 py-2' : 'px-3 py-2.5'
        }`}
      >
        {Icon && pillarColor && (
          <Icon className="w-4 h-4 shrink-0 opacity-70" style={{ color: pillarColor }} />
        )}
        <span className="flex-1 min-w-0 text-[13px] text-neutral-200 truncate leading-tight">
          {commitment.title}
        </span>
        <MapStatusIndicator status={occurrence ? status : 'none'} />
      </Link>

      {occurrence && manualOpen && (
        <div className="px-2.5 pb-2 w-full">
          <MapVerifyButtons status={status} onVerify={onVerify} compact />
        </div>
      )}
      {occurrence && (
        <button
          type="button"
          onClick={() => setManualOpen(v => !v)}
          className="flex w-full items-center justify-center gap-0.5 text-[10px] text-neutral-600 hover:bg-white/[0.04] hover:text-neutral-500 py-1 transition-colors"
        >
          <span>{manualOpen ? 'Hide' : 'Manual log'}</span>
          <ChevronDown
            className={`w-3 h-3 transition-transform duration-200 ${manualOpen ? 'rotate-180' : ''}`}
          />
        </button>
      )}
    </div>
  )
}

function CustomCommitmentRow({
  commitment,
  occurrence,
  onVerify,
}: {
  commitment: Commitment
  occurrence?: CommitmentOccurrence
  onVerify: (status: 'yes' | 'no' | 'skipped') => Promise<void>
}) {
  const status = occurrence?.status ?? 'pending'

  return (
    <div className="flex flex-col gap-2 px-2.5 py-2.5 border-b border-white/[0.04] last:border-0 sm:flex-row sm:items-start sm:gap-3">
      <p className="w-full text-[13px] text-neutral-200 leading-snug break-words sm:flex-1 sm:min-w-0">
        {commitment.title}
      </p>
      {occurrence ? (
        <div className="w-full shrink-0 sm:w-auto sm:pt-0.5">
          <MapVerifyButtons status={status} onVerify={onVerify} compact />
        </div>
      ) : (
        <span className="text-[10px] text-neutral-600 shrink-0">—</span>
      )}
    </div>
  )
}
