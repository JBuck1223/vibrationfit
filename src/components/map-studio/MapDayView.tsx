'use client'

import { useCallback, useEffect, useMemo, useState, type ComponentType, type CSSProperties } from 'react'
import { usePathname } from 'next/navigation'
import Link from 'next/link'
import { ChevronLeft, ChevronRight, ArrowRight, CheckCircle2, Map as MapIcon } from 'lucide-react'
import { Button, Spinner } from '@/lib/design-system/components'
import { useMapStudio } from './MapStudioContext'
import { useMapNavigation } from './use-map-navigation'
import { MapCompleteIndicator } from './MapCompleteIndicator'
import { MapOccurrenceActions } from './MapOccurrenceActions'
import { MapOccurrenceJournal } from './MapOccurrenceJournal'
import { MapCompleteButton } from './MapCompleteButton'
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
import { createClient } from '@/lib/supabase/client'

function formatCommitmentCadence(cadence: Cadence | null): string {
  if (!cadence) return ''
  return formatCadenceLabel(JSON.stringify(cadence))
}

/** Hide auto-verified Alignment Gym weekly tally until they attend a live session. */
function cadenceStatusForIntensivePreview(
  commitment: Commitment,
  status: CommitmentCadenceStatus | undefined,
  readOnly: boolean,
  hasGymAttendance: boolean | null,
): CommitmentCadenceStatus | undefined {
  if (!status || !readOnly || commitment.activity_type !== 'alignment_gym') return status
  if (hasGymAttendance) return status
  return {
    ...status,
    loggedYesOnAnchorDate: false,
    periodTally: status.periodTally
      ? { ...status.periodTally, completed: 0 }
      : undefined,
  }
}

function countsAsDoneForIntensivePreview(
  commitment: Commitment,
  occurrence: CommitmentOccurrence | undefined,
  readOnly: boolean,
  hasGymAttendance: boolean | null,
): boolean {
  if (occurrence?.status !== 'yes') return false
  if (!readOnly || commitment.activity_type !== 'alignment_gym') return true
  return hasGymAttendance === true
}

function PeriodTallyBadge({ tally }: { tally: CommitmentPeriodTally }) {
  const met = tally.completed >= tally.target
  return (
    <span
      className={`inline-flex items-center gap-0.5 shrink-0 tabular-nums font-medium leading-none text-[11px] ${
        met ? 'text-primary-500' : 'text-neutral-500'
      }`}
      aria-label={
        met
          ? `${tally.completed} of ${tally.target} completed for this period`
          : `${tally.completed} of ${tally.target} completed this period`
      }
    >
      <span>
        {tally.completed}/{tally.target}
      </span>
      {met ? (
        <CheckCircle2 className="w-3.5 h-3.5 text-primary-500" strokeWidth={2} aria-hidden />
      ) : null}
    </span>
  )
}

function CadenceStatusBadge({ status }: { status: CommitmentCadenceStatus }) {
  if (status.mode === 'weekly' && status.periodTally) {
    return <PeriodTallyBadge tally={status.periodTally} />
  }

  if (status.mode === 'interval' && status.periodTally) {
    return (
      <div className="flex shrink-0 flex-col items-end gap-0.5 text-right">
        <PeriodTallyBadge tally={status.periodTally} />
        {status.dueSoon && status.daysUntilDue != null ? (
          <span className="text-[10px] font-medium leading-tight text-amber-300/90">
            Due in {status.daysUntilDue}d
          </span>
        ) : null}
        {status.overdue ? (
          <span className="text-[10px] font-medium leading-tight text-red-400/90">Overdue</span>
        ) : null}
      </div>
    )
  }

  return null
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
    <div className="flex min-w-0 flex-1 items-start gap-2">
      {Icon ? (
        <Icon
          className="w-4 h-4 shrink-0 opacity-70 mt-0.5"
          style={iconColor ? { color: iconColor } : undefined}
        />
      ) : null}
      <div className="min-w-0">
        <p className="truncate text-[13px] font-medium leading-tight text-neutral-200">
          {title}
        </p>
        {cadenceLabel ? (
          <p className="text-[10px] text-neutral-500 mt-0.5 leading-tight">{cadenceLabel}</p>
        ) : null}
      </div>
    </div>
  )
}

export function MapDayView({ readOnly = false }: { readOnly?: boolean }) {
  const pathname = usePathname()
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
  const [hasAlignmentGymAttendance, setHasAlignmentGymAttendance] = useState<boolean | null>(
    null,
  )

  useEffect(() => {
    if (!readOnly) {
      setHasAlignmentGymAttendance(null)
      return
    }

    let cancelled = false
    async function loadGymAttendance() {
      const supabase = createClient()
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) {
        if (!cancelled) setHasAlignmentGymAttendance(false)
        return
      }

      const { count, error } = await supabase
        .from('video_session_participants')
        .select('id, video_sessions!inner(session_type, title)', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .eq('attended', true)
        .or('session_type.eq.alignment_gym,title.ilike.%alignment gym%', {
          referencedTable: 'video_sessions',
        })

      if (!cancelled) {
        setHasAlignmentGymAttendance(!error && (count ?? 0) > 0)
      }
    }

    void loadGymAttendance()
    return () => {
      cancelled = true
    }
  }, [readOnly])

  /** Refresh occurrence state only — never bulk auto-verify (that marked everything complete). */
  const refreshDayState = useCallback(async () => {
    await refreshDateOccurrences(selectedDate)
    const { from, to } = getTallyOccurrenceRange(selectedDate)
    const occs = await loadOccurrencesForRange(from, to)
    setPeriodOccurrences(occs)
  }, [selectedDate, refreshDateOccurrences, loadOccurrencesForRange])

  useEffect(() => {
    const onReturn = () => {
      if (document.visibilityState === 'visible') {
        void refreshDayState()
      }
    }
    const onVerified = () => {
      void refreshDayState()
    }
    window.addEventListener('focus', onReturn)
    document.addEventListener('visibilitychange', onReturn)
    window.addEventListener('pageshow', onReturn)
    window.addEventListener('map:occurrence-verified', onVerified)
    return () => {
      window.removeEventListener('focus', onReturn)
      document.removeEventListener('visibilitychange', onReturn)
      window.removeEventListener('pageshow', onReturn)
      window.removeEventListener('map:occurrence-verified', onVerified)
    }
  }, [refreshDayState])

  useEffect(() => {
    if (pathname === '/map' || pathname.startsWith('/map/')) {
      void refreshDayState()
    }
  }, [pathname, refreshDayState])

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
          {readOnly
            ? 'Activate your starter MAP below to preview your weekly rhythm.'
            : 'Update your MAP commitments, then track them here daily.'}
        </p>
        {!readOnly && (
          <Button variant="primary" asChild>
            <Link href="/map/update">Go to Update</Link>
          </Button>
        )}
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
  const systemDone = systemCommitments.filter(c =>
    countsAsDoneForIntensivePreview(
      c,
      occurrenceMap.get(c.id),
      readOnly,
      hasAlignmentGymAttendance,
    ),
  ).length
  const customLogged = customOccs.filter(o => o.status === 'yes').length
  const systemTotal = systemOccs.length > 0 ? systemOccs.length : systemCommitments.length
  const customTotal = customOccs.length > 0 ? customOccs.length : customCommitments.length
  const customCategories = Object.keys(commitmentsByLifeCategory).sort()
  const hasCustomPendingPast = isPast && customOccs.some(o => o.status === 'pending')

  const sectionTitleClass = readOnly
    ? 'text-lg md:text-xl font-bold text-white'
    : 'text-sm font-medium text-white'
  const sectionSubtextClass = readOnly
    ? 'text-sm text-neutral-400 mt-1 leading-relaxed'
    : 'text-[11px] text-neutral-600 mt-0.5'

  return (
    <div className="w-full space-y-4 sm:space-y-5">
      {isHistoricalPlan && (
        <p className="text-center text-xs text-neutral-500 px-1">
          Plan on {formatDisplayDate(selectedDate)} — logs reflect that day.
        </p>
      )}

      {!readOnly && (
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
      )}

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
            <div className="text-center px-6 sm:px-10">
              <h2 className={sectionTitleClass}>System MAP</h2>
              <p className={sectionSubtextClass}>
                {readOnly
                  ? 'Preview only — open rituals and log reps after you graduate.'
                  : 'Tap a ritual to open — alignment tracks automatically.'}
              </p>
            </div>
          </div>
          <div className="px-2 pb-2">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 items-stretch">
          {PILLAR_ORDER.map(pillar => {
            const meta = PILLAR_META[pillar]
            const pillarCommitments = commitmentsByPillar[pillar]
            const pillarDone = pillarCommitments.filter(c =>
              countsAsDoneForIntensivePreview(
                c,
                occurrenceMap.get(c.id),
                readOnly,
                hasAlignmentGymAttendance,
              ),
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
                      {readOnly ? '—' : (
                        <Link href="/map/update/system" className="hover:text-neutral-400 transition-colors">
                          Set up
                        </Link>
                      )}
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
                      cadenceStatus={cadenceStatusForIntensivePreview(
                        c,
                        cadenceStatusByCommitmentId.get(c.id),
                        readOnly,
                        hasAlignmentGymAttendance,
                      )}
                      pillarColor={meta.color}
                      compact
                      readOnly={readOnly}
                      onVerify={async (status) => {
                        const occ = occurrenceMap.get(c.id)
                        if (occ) {
                          await verifyOccurrence(occ.id, status)
                          await refreshPeriodOccurrences()
                        }
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
            <div className="text-center px-6 sm:px-10">
              <h2 className={sectionTitleClass}>Custom Commitments</h2>
              <p className={readOnly ? sectionSubtextClass : 'text-[11px] text-neutral-500 mt-0.5'}>
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
                        cadenceStatus={cadenceStatusForIntensivePreview(
                          c,
                          cadenceStatusByCommitmentId.get(c.id),
                          readOnly,
                          hasAlignmentGymAttendance,
                        )}
                        readOnly={readOnly}
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

function SystemCommitmentRow({
  commitment,
  occurrence,
  cadenceStatus,
  pillarColor,
  compact = false,
  readOnly = false,
  onVerify,
}: {
  commitment: Commitment
  occurrence?: CommitmentOccurrence
  cadenceStatus?: CommitmentCadenceStatus
  pillarColor?: string
  compact?: boolean
  readOnly?: boolean
  onVerify: (status: 'yes' | 'pending') => Promise<void>
}) {
  const activity = commitment.activity_type
    ? getActivityDefinition(commitment.activity_type)
    : null
  const Icon = activity?.icon
  const status = occurrence?.status ?? 'pending'
  const doneToday = status === 'yes'
  const deepLink = commitment.activity_type
    ? getMapActivityDeepLink(commitment.activity_type, { completed: doneToday })
    : '/map'
  const cadenceLabel = formatCommitmentCadence(commitment.cadence)

  const rowPad = compact ? 'px-2.5 py-2' : 'px-3 py-2.5'
  const rowContent = (
    <>
      <CommitmentInlineLabel
        title={commitment.title}
        cadenceLabel={cadenceLabel}
        icon={Icon ?? undefined}
        iconColor={pillarColor}
      />
      <div className="flex shrink-0 items-center gap-1.5">
        {cadenceStatus ? <CadenceStatusBadge status={cadenceStatus} /> : null}
        {!readOnly && occurrence ? (
          doneToday ? (
            <MapCompleteIndicator compact />
          ) : (
            <ArrowRight className="w-[18px] h-[18px] shrink-0 text-neutral-500" aria-hidden />
          )
        ) : null}
      </div>
    </>
  )

  return (
    <div className="overflow-hidden rounded-lg bg-white/[0.03]">
      {readOnly ? (
        <div className={`flex w-full items-center gap-2.5 ${rowPad}`}>{rowContent}</div>
      ) : (
        <Link
          href={deepLink}
          className={`flex w-full items-center gap-2.5 transition-colors hover:bg-white/[0.04] active:bg-white/[0.06] ${rowPad}`}
        >
          {rowContent}
        </Link>
      )}

      {!readOnly && occurrence ? (
        <MapOccurrenceActions
          status={status}
          onVerify={onVerify}
          manualLogHint="Click Mark Complete if you finished the activity but it did not update automatically."
        />
      ) : null}
    </div>
  )
}

function CustomCommitmentRow({
  commitment,
  occurrence,
  cadenceStatus,
  readOnly = false,
  onVerify,
  onJournalUpdated,
}: {
  commitment: Commitment
  occurrence?: CommitmentOccurrence
  cadenceStatus?: CommitmentCadenceStatus
  readOnly?: boolean
  onVerify: (status: 'yes' | 'pending') => Promise<void>
  onJournalUpdated: () => void | Promise<void>
}) {
  const status = occurrence?.status ?? 'pending'
  const cadenceLabel = formatCommitmentCadence(commitment.cadence)

  return (
    <div className="flex items-center gap-2 px-2.5 py-2.5 border-b border-white/[0.04] last:border-0">
      <CommitmentInlineLabel
        title={commitment.title}
        cadenceLabel={cadenceLabel}
      />
      {cadenceStatus ? (
        <CadenceStatusBadge status={cadenceStatus} />
      ) : null}
      {!readOnly && occurrence ? (
        <div className="flex shrink-0 items-center gap-1">
          <MapCompleteButton status={status} onVerify={onVerify} compact />
          <MapOccurrenceJournal
            occurrence={occurrence}
            commitmentTitle={commitment.title}
            lifeCategory={commitment.category}
            onUpdated={onJournalUpdated}
          />
        </div>
      ) : readOnly ? null : (
        <span className="text-[10px] text-neutral-600 shrink-0">—</span>
      )}
    </div>
  )
}
