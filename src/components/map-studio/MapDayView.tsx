'use client'

import { useState } from 'react'
import Link from 'next/link'
import { ChevronLeft, ChevronRight, ArrowRight, ChevronDown } from 'lucide-react'
import { Button, Spinner } from '@/lib/design-system/components'
import { useMapStudio } from './MapStudioContext'
import { useMapNavigation } from './use-map-navigation'
import { MapVerifyButtons } from './MapVerifyButtons'
import { MapOccurrenceStatus } from './MapOccurrenceStatus'
import { PILLAR_ORDER, PILLAR_META } from '@/lib/map/map-pillar-config'
import { getActivityDefinition, getMapActivityDeepLink } from '@/lib/map/activities'
import { getVisionCategory } from '@/lib/design-system/vision-categories'
import {
  addDays,
  formatDisplayDate,
} from '@/lib/map/map-date-utils'
import type { Commitment, CommitmentOccurrence } from '@/lib/map/types'
import { mapTodayStyles } from '@/lib/map/map-today-styles'

export function MapDayView() {
  const { navigateMap, today } = useMapNavigation()
  const {
    loading,
    selectedDate,
    dateOccurrences,
    activeCommitments,
    systemCommitments,
    customCommitments,
    commitmentsByPillar,
    commitmentsByLifeCategory,
    verifyOccurrence,
  } = useMapStudio()

  const isPast = selectedDate < today
  const isToday = selectedDate === today

  if (loading) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <Spinner size="lg" />
      </div>
    )
  }

  if (activeCommitments.length === 0) {
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

  const customCategories = Object.keys(commitmentsByLifeCategory).sort()
  const hasCustomPendingPast = isPast && customOccs.some(o => o.status === 'pending')

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-2">
        <button
          type="button"
          onClick={() => navigateMap({ view: 'day', date: addDays(selectedDate, -1) })}
          className="p-2 rounded-lg bg-neutral-900 hover:bg-neutral-800 transition-colors"
          aria-label="Previous day"
        >
          <ChevronLeft className="w-5 h-5 text-neutral-400" />
        </button>
        <div className="flex-1 flex justify-center min-w-0 px-1">
          <div
            className={`text-center rounded-2xl min-w-0 w-max max-w-[min(100%,18rem)] py-2 ${
              isToday ? 'px-5' : 'px-2'
            }`}
            style={
              isToday
                ? {
                    backgroundColor: mapTodayStyles.dayChipBg,
                    boxShadow: `0 0 0 2px ${mapTodayStyles.dayChipRing}, ${mapTodayStyles.dayChipShadow}`,
                  }
                : undefined
            }
          >
            {isToday && (
              <p
                className="text-[10px] font-bold uppercase tracking-[0.2em] mb-0.5"
                style={{ color: mapTodayStyles.primaryHex }}
              >
                Today
              </p>
            )}
            <p className="text-sm font-semibold text-white truncate">
              {formatDisplayDate(selectedDate)}
            </p>
            {!isToday && (
              <button
                type="button"
                onClick={() => navigateMap({ view: 'day', date: today })}
                className="text-xs mt-0.5 hover:opacity-90 transition-opacity"
                style={{ color: mapTodayStyles.primaryHex }}
              >
                Back to today
              </button>
            )}
          </div>
        </div>
        <button
          type="button"
          onClick={() => navigateMap({ view: 'day', date: addDays(selectedDate, 1) })}
          className="p-2 rounded-lg bg-neutral-900 hover:bg-neutral-800 transition-colors"
          aria-label="Next day"
        >
          <ChevronRight className="w-5 h-5 text-neutral-400" />
        </button>
      </div>

      {(systemOccs.length > 0 || customOccs.length > 0) && (
        <div className="flex flex-wrap items-center gap-4 text-xs">
          {systemOccs.length > 0 && (
            <div className="flex items-center gap-2">
              <span className="text-neutral-500">System</span>
              <span className="font-medium text-neutral-300">
                {systemDone}/{systemOccs.length} aligned
              </span>
            </div>
          )}
          {customOccs.length > 0 && (
            <div className="flex items-center gap-2">
              <span className="text-neutral-500">Custom</span>
              <span className="font-medium text-neutral-300">
                {customLogged}/{customOccs.length} logged
              </span>
            </div>
          )}
        </div>
      )}

      {hasCustomPendingPast && (
        <div className="rounded-xl border border-amber-500/20 bg-amber-500/5 px-4 py-3">
          <p className="text-xs text-amber-200/90">
            Logging custom actions for {formatDisplayDate(selectedDate)} — update anything you did but forgot to record.
          </p>
        </div>
      )}

      {/* System — auto-tracked via platform activity */}
      <section>
        <div className="mb-3">
          <p className="text-[11px] uppercase tracking-[0.2em] font-bold text-neutral-500">
            System
          </p>
          <p className="text-xs text-neutral-600 mt-0.5">
            Tap to open the tool — tracking updates automatically. Log manually if needed.
          </p>
        </div>
        <div className="space-y-4">
          {PILLAR_ORDER.map(pillar => {
            const meta = PILLAR_META[pillar]
            const pillarCommitments = commitmentsByPillar[pillar]
            const primary = pillarCommitments[0]
            const supplements = pillarCommitments.slice(1)

            if (!primary) {
              return (
                <div
                  key={pillar}
                  className="rounded-2xl border border-dashed p-4"
                  style={{ borderColor: `${meta.color}20` }}
                >
                  <span
                    className="text-[11px] uppercase tracking-[0.2em] font-bold"
                    style={{ color: `${meta.color}50` }}
                  >
                    {meta.verb}
                  </span>
                  <p className="text-xs text-neutral-600 mt-1">
                    Not set —{' '}
                    <Link href="/map/update/system" className="text-primary-400 hover:underline">
                      configure in Update
                    </Link>
                  </p>
                </div>
              )
            }

            return (
              <div key={pillar} className="space-y-2">
                <p
                  className="text-[11px] uppercase tracking-[0.2em] font-bold"
                  style={{ color: meta.color }}
                >
                  {meta.verb}
                </p>
                <SystemCommitmentRow
                  commitment={primary}
                  occurrence={occurrenceMap.get(primary.id)}
                  pillarColor={meta.color}
                  onVerify={async (status) => {
                    const occ = occurrenceMap.get(primary.id)
                    if (occ) await verifyOccurrence(occ.id, status)
                  }}
                />
                {supplements.map(s => (
                  <SystemCommitmentRow
                    key={s.id}
                    commitment={s}
                    occurrence={occurrenceMap.get(s.id)}
                    pillarColor={meta.color}
                    supplement
                    onVerify={async (status) => {
                      const occ = occurrenceMap.get(s.id)
                      if (occ) await verifyOccurrence(occ.id, status)
                    }}
                  />
                ))}
              </div>
            )
          })}
        </div>
      </section>

      {/* Custom — manual Yes/No/Skip */}
      <section>
        <div className="mb-3">
          <p className="text-[11px] uppercase tracking-[0.2em] font-bold text-neutral-500">
            Custom
          </p>
          <p className="text-xs text-neutral-600 mt-0.5">
            Personal commitments you log yourself.
          </p>
        </div>
        {customCategories.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-neutral-800 p-4 text-center">
            <p className="text-xs text-neutral-600">
              No personal commitments yet.{' '}
              <Link href="/map/update/custom" className="text-primary-400 hover:underline">
                Add one in Update
              </Link>
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {customCategories.map(catKey => {
              const cat = getVisionCategory(catKey as Parameters<typeof getVisionCategory>[0])
              const items = commitmentsByLifeCategory[catKey]
              const CatIcon = cat?.icon

              return (
                <div key={catKey} className="space-y-2">
                  <div className="flex items-center gap-2">
                    {CatIcon && <CatIcon className="w-3.5 h-3.5 text-neutral-500" />}
                    <p className="text-[11px] uppercase tracking-[0.2em] font-bold text-neutral-400">
                      {cat?.label || catKey}
                    </p>
                  </div>
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
              )
            })}
          </div>
        )}
      </section>
    </div>
  )
}

function SystemCommitmentRow({
  commitment,
  occurrence,
  pillarColor,
  supplement = false,
  onVerify,
}: {
  commitment: Commitment
  occurrence?: CommitmentOccurrence
  pillarColor?: string
  supplement?: boolean
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

  const cadenceLabel = commitment.cadence
    ? commitment.cadence.kind === 'daily'
      ? 'Daily'
      : `${commitment.cadence.count}x/week`
    : ''

  return (
    <div
      className={`rounded-2xl border overflow-hidden ${supplement ? 'ml-3' : ''}`}
      style={{
        borderColor: isVerified ? `${pillarColor}40` : '#1A1A1A',
        backgroundColor: '#0A0A0A',
      }}
    >
      {pillarColor && !supplement && (
        <div className="h-0.5" style={{ backgroundColor: pillarColor }} />
      )}
      <div className="p-4">
        <Link href={deepLink} className="block group">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0 flex-1">
              {Icon && (
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                  style={{ backgroundColor: `${pillarColor}10` }}
                >
                  <Icon className="w-5 h-5" style={{ color: pillarColor }} />
                </div>
              )}
              <div className="min-w-0">
                <p className="text-sm font-semibold text-white group-hover:text-primary-300 transition-colors truncate">
                  {commitment.title}
                </p>
                {cadenceLabel && (
                  <p className="text-xs text-neutral-500">{cadenceLabel}</p>
                )}
              </div>
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
              {occurrence ? (
                <MapOccurrenceStatus status={status} />
              ) : (
                <span className="text-xs text-neutral-600">Not scheduled</span>
              )}
              <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-neutral-800/60 group-hover:bg-primary-500/20 transition-colors">
                <ArrowRight className="w-4 h-4 text-neutral-500 group-hover:text-primary-400" />
              </div>
            </div>
          </div>
        </Link>

        {occurrence && (
          <div className="mt-2 pt-2 border-t border-[#151515]">
            <button
              type="button"
              onClick={() => setManualOpen(v => !v)}
              className="flex items-center gap-1 text-[11px] text-neutral-600 hover:text-neutral-400 transition-colors"
            >
              <ChevronDown
                className={`w-3 h-3 transition-transform ${manualOpen ? 'rotate-180' : ''}`}
              />
              Log manually
            </button>
            {manualOpen && (
              <div className="mt-2 flex flex-col gap-1.5">
                <p className="text-[10px] text-neutral-600">
                  Use if you completed this outside the app or tracking did not update.
                </p>
                <MapVerifyButtons
                  status={status}
                  onVerify={onVerify}
                  compact
                />
              </div>
            )}
          </div>
        )}
      </div>
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

  const cadenceLabel = commitment.cadence
    ? commitment.cadence.kind === 'daily'
      ? 'Daily'
      : `${commitment.cadence.count}x/week`
    : ''

  return (
    <div className="rounded-2xl border border-[#1A1A1A] bg-[#0A0A0A] p-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium text-white truncate">{commitment.title}</p>
          {cadenceLabel && (
            <p className="text-xs text-neutral-500">{cadenceLabel}</p>
          )}
        </div>
        {occurrence ? (
          <MapVerifyButtons status={status} onVerify={onVerify} />
        ) : (
          <span className="text-xs text-neutral-600">Not scheduled</span>
        )}
      </div>
    </div>
  )
}
