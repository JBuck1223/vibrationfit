'use client'

import { useCallback, useEffect, useMemo, useState, type ComponentType, type CSSProperties } from 'react'
import Link from 'next/link'
import { ChevronLeft, ChevronRight, ArrowRight, CheckCircle2, Circle, XCircle, MinusCircle, Map as MapIcon } from 'lucide-react'
import { Button, Spinner } from '@/lib/design-system/components'
import { useMapStudio } from './MapStudioContext'
import { useMapNavigation } from './use-map-navigation'
import { MapVerifyButtons } from './MapVerifyButtons'
import { MapOccurrenceJournal } from './MapOccurrenceJournal'
import { MapDateTravelTrigger } from './MapDateTravelTrigger'
import { PILLAR_ORDER, PILLAR_META } from '@/lib/map/map-pillar-config'
import { getActivityDefinition, getMapActivityDeepLink } from '@/lib/map/activities'
import { getVisionCategory } from '@/lib/design-system/vision-categories'
import {
  getCommitmentCadenceStatus,
  getTallyOccurrenceRange,
  type CommitmentCadenceStatus,
  type CommitmentPeriodTally,
} from '@/lib/map/commitment-period-tally'
import {
  addDays,
  formatDisplayDate,
} from '@/lib/map/map-date-utils'
import type { Commitment, CommitmentOccurrence, Cadence } from '@/lib/map/types'
import { formatCadenceLabel } from '@/lib/map/map-builder-cadence'
import { mapTodayStyles } from '@/lib/map/map-today-styles'

function formatCommitmentCadence(cadence: Cadence | null): string {
  if (!cadence) return ''
  return formatCadenceLabel(JSON.stringify(cadence))
}

function PeriodTallyBadge({ tally }: { tally: CommitmentPeriodTally }) {
  const met = tally.completed >= tally.target
  return (
    <span
      className={`shrink-0 text-[11px] tabular-nums font-medium ${
        met ? 'text-primary-500' : 'text-neutral-500'
      }`}
      aria-label={`${tally.completed} of ${tally.target} completed this week`}
    >
      {tally.completed}/{tally.target}
    </span>
  )
}

function CadenceStatusBadge({ status }: { status: CommitmentCadenceStatus }) {
  if (status.mode === 'weekly' && status.periodTally) {
    return (
      <div className="flex shrink-0 flex-col items-end">
        <PeriodTallyBadge tally={status.periodTally} />
      </div>
    )
  }

  const met =
    status.periodTally != null &&
    status.periodTally.completed >= status.periodTally.target

  let sinceLabel: string
  if (status.loggedYesOnAnchorDate) {
    sinceLabel = 'Done today'
  } else if (!status.hasPriorYes && status.daysSinceLastYes === 0) {
    sinceLabel = 'Not yet'
  } else if (!status.hasPriorYes) {
    sinceLabel = `${status.daysSinceLastYes}d since start`
  } else {
    sinceLabel = `${status.daysSinceLastYes}d since last`
  }

  return (
    <div className="flex shrink-0 flex-col items-end gap-0.5 text-right">
      <span
        className={`text-[10px] tabular-nums leading-tight ${
          status.loggedYesOnAnchorDate || met
            ? 'text-primary-500 font-medium'
            : 'text-neutral-500'
        }`}
      >
        {sinceLabel}
      </span>
      {status.dueSoon && status.daysUntilDue != null ? (
        <span className="text-[10px] font-medium leading-tight text-amber-300/90">
          Due in {status.daysUntilDue}d
        </span>
      ) : null}
      {status.overdue ? (
        <span className="text-[10px] font-medium leading-tight text-red-400/90">
          Overdue
        </span>
      ) : null}
    </div>
  )
}

function CommitmentInlineLabel({
  title,
  cadenceLabel,
  icon: Icon,
  iconColor,
}: {
  title: string
  cadenceLabel: string
  icon?: ComponentType<{ className?: string; style?: CSSProperties }>
  iconColor?: string
}) {
  return (
    <div className="flex flex-1 min-w-0 items-center gap-1.5">
      {Icon ? (
        <Icon
          className="w-4 h-4 shrink-0 opacity-70"
          style={iconColor ? { color: iconColor } : undefined}
        />
      ) : null}
      <p className="min-w-0 truncate text-[13px] leading-tight">
        <span className="text-neutral-200">{title}</span>
        {cadenceLabel ? (
          <>
            <span className="text-neutral-600"> · </span>
            <span className="text-[11px] text-neutral-600">{cadenceLabel}</span>
          </>
        ) : null}
      </p>
    </div>
  )
}

export function MapDayView() {
  const { goToDate, today } = useMapNavigation()
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
    loadOccurrencesForRange,
    refreshDateOccurrences,
  } = useMapStudio()

  const [periodOccurrences, setPeriodOccurrences] = useState<CommitmentOccurrence[]>([])

  const refreshPeriodOccurrences = useCallback(async () => {
    const { from, to } = getTallyOccurrenceRange(selectedDate)
    const occs = await loadOccurrencesForRange(from, to)
    setPeriodOccurrences(occs)
  }, [selectedDate, loadOccurrencesForRange])

  const refreshAfterJournal = useCallback(async () => {
    await refreshDateOccurrences(selectedDate)
    await refreshPeriodOccurrences()
  }, [selectedDate, refreshDateOccurrences, refreshPeriodOccurrences])

  useEffect(() => {
    void refreshPeriodOccurrences()
  }, [refreshPeriodOccurrences])

  const cadenceStatusByCommitmentId = useMemo(() => {
    const map = new Map<string, CommitmentCadenceStatus>()
    for (const c of planCommitments) {
      const status = getCommitmentCadenceStatus(c, periodOccurrences, selectedDate)
      if (status) map.set(c.id, status)
    }
    return map
  }, [planCommitments, periodOccurrences, selectedDate])

  const isPast = selectedDate < today
  const isToday = selectedDate === today

  const canJumpToToday =
    !isToday && (selectablePlanDates.size === 0 || selectablePlanDates.has(today))

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
        <MapIcon className="w-10 h-10 text-neutral-600 mx-auto mb-4" strokeWidth={1.5} />
        <h2 className="text-xl font-bold text-white mb-2">No commitments yet</h2>
        <p className="text-sm text-neutral-500 mb-6 max-w-md mx-auto">
          Update your MAP commitments, then track them here daily.
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
            onClick={() => goToDate(addDays(selectedDate, -1))}
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-neutral-400 hover:text-white hover:bg-white/5 active:scale-95 transition-all"
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
                onClick={() => goToDate(today)}
                className="text-[11px] mt-1 text-neutral-500 hover:text-white transition-colors"
              >
                Jump to today
              </button>
            )}
          </div>
          <button
            type="button"
            onClick={() => goToDate(addDays(selectedDate, 1))}
            disabled={selectedDate >= today}
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
                      cadenceStatus={cadenceStatusByCommitmentId.get(c.id)}
                      pillarColor={meta.color}
                      compact
                      onVerify={async (status) => {
                        const occ = occurrenceMap.get(c.id)
                        if (occ) {
                          await verifyOccurrence(occ.id, status)
                          await refreshPeriodOccurrences()
                        }
                      }}
                      onJournalUpdated={refreshAfterJournal}
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
              const CategoryIcon = cat?.icon
              const items = commitmentsByLifeCategory[catKey]

              return (
                <div key={catKey}>
                  <div className="flex items-center gap-1.5 px-2 py-1">
                    {CategoryIcon ? (
                      <CategoryIcon className="w-3.5 h-3.5 shrink-0 text-neutral-500" aria-hidden />
                    ) : null}
                    <p className="text-[10px] text-neutral-600">
                      {cat?.label || catKey}
                    </p>
                  </div>
                  <div className="rounded-lg bg-black/20 overflow-hidden">
                    {items.map(c => (
                      <CustomCommitmentRow
                        key={c.id}
                        commitment={c}
                        occurrence={occurrenceMap.get(c.id)}
                        cadenceStatus={cadenceStatusByCommitmentId.get(c.id)}
                        onVerify={async (status) => {
                          const occ = occurrenceMap.get(c.id)
                          if (occ) {
                            await verifyOccurrence(occ.id, status)
                            await refreshPeriodOccurrences()
                          }
                        }}
                        onJournalUpdated={refreshAfterJournal}
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
      <p className="text-[13px] font-medium leading-tight text-white">
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
  cadenceStatus,
  pillarColor,
  compact = false,
  onVerify,
  onJournalUpdated,
}: {
  commitment: Commitment
  occurrence?: CommitmentOccurrence
  cadenceStatus?: CommitmentCadenceStatus
  pillarColor?: string
  compact?: boolean
  onVerify: (status: 'yes' | 'no' | 'skipped') => Promise<void>
  onJournalUpdated: () => void | Promise<void>
}) {
  const activity = commitment.activity_type
    ? getActivityDefinition(commitment.activity_type)
    : null
  const Icon = activity?.icon
  const status = occurrence?.status ?? 'pending'
  const isVerified = status === 'yes'
  const showGoArrow = !isVerified && status !== 'no' && status !== 'skipped'
  const deepLink = commitment.activity_type
    ? getMapActivityDeepLink(commitment.activity_type, { completed: isVerified })
    : '/map'
  const cadenceLabel = formatCommitmentCadence(commitment.cadence)

  return (
    <div className="overflow-hidden rounded-lg bg-white/[0.03]">
      <Link
        href={deepLink}
        className={`flex w-full items-center gap-2.5 transition-colors hover:bg-white/[0.04] active:bg-white/[0.06] ${
          compact ? 'px-2.5 py-2' : 'px-3 py-2.5'
        }`}
      >
        <CommitmentInlineLabel
          title={commitment.title}
          cadenceLabel={cadenceLabel}
          icon={Icon ?? undefined}
          iconColor={pillarColor}
        />
        {cadenceStatus ? <CadenceStatusBadge status={cadenceStatus} /> : null}
        {showGoArrow ? (
          <ArrowRight className="w-[18px] h-[18px] shrink-0 text-neutral-500" aria-hidden />
        ) : (
          <MapStatusIndicator status={occurrence ? status : 'none'} />
        )}
      </Link>

      {occurrence ? (
        <div className="flex items-center justify-end gap-1 px-2.5 pb-2">
          <MapVerifyButtons status={status} onVerify={onVerify} compact />
          <MapOccurrenceJournal
            occurrence={occurrence}
            commitmentTitle={commitment.title}
            lifeCategory={commitment.category}
            onUpdated={onJournalUpdated}
          />
        </div>
      ) : null}
    </div>
  )
}

function CustomCommitmentRow({
  commitment,
  occurrence,
  cadenceStatus,
  onVerify,
  onJournalUpdated,
}: {
  commitment: Commitment
  occurrence?: CommitmentOccurrence
  cadenceStatus?: CommitmentCadenceStatus
  onVerify: (status: 'yes' | 'no' | 'skipped') => Promise<void>
  onJournalUpdated: () => void | Promise<void>
}) {
  const status = occurrence?.status ?? 'pending'
  const cadenceLabel = formatCommitmentCadence(commitment.cadence)

  return (
    <div className="px-2.5 py-2.5 border-b border-white/[0.04] last:border-0">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:gap-3">
        <div className="flex w-full min-w-0 flex-1 items-center gap-2 sm:flex-1">
          <CommitmentInlineLabel
            title={commitment.title}
            cadenceLabel={cadenceLabel}
          />
          {cadenceStatus ? <CadenceStatusBadge status={cadenceStatus} /> : null}
        </div>
        {occurrence ? (
          <div className="flex items-center gap-1 w-full shrink-0 sm:w-auto sm:pt-0.5 justify-end">
            <MapVerifyButtons status={status} onVerify={onVerify} compact />
            <MapOccurrenceJournal
              occurrence={occurrence}
              commitmentTitle={commitment.title}
              lifeCategory={commitment.category}
              onUpdated={onJournalUpdated}
            />
          </div>
        ) : (
          <span className="text-[10px] text-neutral-600 shrink-0">—</span>
        )}
      </div>
    </div>
  )
}
