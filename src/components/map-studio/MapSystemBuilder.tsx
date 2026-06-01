'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import {
  Stack,
  Button,
  Select,
  TimePicker,
  Spinner,
} from '@/lib/design-system/components'
import { Check, Loader2, Bell, Mail, MessageSquare, ChevronDown } from 'lucide-react'
import { useMapStudio } from './MapStudioContext'
import { getActivityDefinition, getActivitiesByCategory, type ActivityDefinition } from '@/lib/map/activities'
import { PILLAR_ORDER, PILLAR_META } from '@/lib/map/map-pillar-config'
import {
  INTENSIVE_DEFAULT_SELECTIONS,
  intensiveReminderDefaults,
  isIntensiveSelectableActivity,
} from '@/lib/map/intensive-map-config'
import { partitionCommitments } from '@/lib/map/commitment-classification'
import {
  builderSelectionsFromSystemCommitments,
  daysForCadence,
  maxSelectableDaysFromCadenceJson,
  type BuilderSelection,
} from '@/lib/map/map-builder-cadence'
import {
  DEFAULT_WEEKLY_DIGEST_TIME,
  normalizeReminderTimeForPicker,
  reminderTimeToPostgresTime,
} from '@/lib/map/reminder-time'
import { MapActivityScheduleControls } from './MapActivityScheduleControls'
import { isDailyCadence } from '@/lib/map/map-builder-cadence'
import type { MapCategory } from '@/lib/map/types'

function buildSelectionFromActivity(
  activity: ActivityDefinition,
  cadenceJson: string,
  options?: { intensiveStarter?: boolean },
): BuilderSelection {
  const reminder =
    options?.intensiveStarter
      ? intensiveReminderDefaults(activity)
      : {
          notifySms: false,
          notifyEmail: false,
          reminderTime: activity.usesPublishedSchedule ? '' : activity.defaultTimeOfDay || '',
        }
  return {
    activityType: activity.type,
    cadenceJson,
    notifySms: reminder.notifySms,
    notifyEmail: reminder.notifyEmail,
    reminderTime: reminder.reminderTime,
    reminderDays: daysForCadence(cadenceJson),
  }
}

function buildIntensiveInitialSelections(): Record<MapCategory, BuilderSelection[]> {
  const empty: Record<MapCategory, BuilderSelection[]> = {
    activations: [],
    creations: [],
    connections: [],
    sessions: [],
  }
  for (const def of INTENSIVE_DEFAULT_SELECTIONS) {
    const activity = getActivityDefinition(def.activityType)
    if (!activity) continue
    empty[activity.category].push(
      buildSelectionFromActivity(activity, def.cadenceJson, { intensiveStarter: true }),
    )
  }
  return empty
}

export type MapSystemBuilderVariant = 'full' | 'intensive-first-cycle'

export function MapSystemBuilder({
  redirectTo = '/map',
  variant = 'full',
  onActivateComplete,
  showHeader = true,
  gridLayout = false,
  customSlot,
}: {
  redirectTo?: string
  variant?: MapSystemBuilderVariant
  onActivateComplete?: () => void | Promise<void>
  showHeader?: boolean
  /** Render pillar sections in a 2-col desktop grid with collapsible toggles */
  gridLayout?: boolean
  /** Extra grid item (e.g. custom section) inserted after the pillar sections */
  customSlot?: React.ReactNode
}) {
  const isIntensive = variant === 'intensive-first-cycle'
  const router = useRouter()
  const { activeCommitments, loading: studioLoading, refreshAll } = useMapStudio()
  const [selections, setSelections] = useState<Record<MapCategory, BuilderSelection[]>>(() =>
    isIntensive ? buildIntensiveInitialSelections() : {
      activations: [],
      creations: [],
      connections: [],
      sessions: [],
    },
  )
  const [selectionsHydrated, setSelectionsHydrated] = useState(isIntensive)
  const [weeklyDigestEmail, setWeeklyDigestEmail] = useState(true)
  const [weeklyDigestSms, setWeeklyDigestSms] = useState(true)
  const [weeklyDigestTime, setWeeklyDigestTime] = useState(DEFAULT_WEEKLY_DIGEST_TIME)
  const [hasPhone, setHasPhone] = useState(false)
  const [smsOptIn, setSmsOptIn] = useState(true)
  const [userTimezone, setUserTimezone] = useState('America/New_York')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    const loadPrefs = async () => {
      const supabase = createClient()
      const { data: { session } } = await supabase.auth.getSession()
      if (!session?.user) return

      const [accountResult, mapResult] = await Promise.all([
        supabase
          .from('user_accounts')
          .select('phone, sms_opt_in, timezone')
          .eq('id', session.user.id)
          .single(),
        supabase
          .from('user_maps')
          .select('map_weekly_reminder_email, map_weekly_reminder_sms, map_weekly_reminder_time')
          .eq('user_id', session.user.id)
          .eq('is_active', true)
          .eq('is_draft', false)
          .maybeSingle(),
      ])

      if (cancelled) return

      if (accountResult.data) {
        setHasPhone(!!accountResult.data.phone?.trim())
        setSmsOptIn(accountResult.data.sms_opt_in !== false)
        if (accountResult.data.timezone) {
          setUserTimezone(accountResult.data.timezone)
        }
      }

      if (mapResult.data) {
        const row = mapResult.data as {
          map_weekly_reminder_email?: boolean | null
          map_weekly_reminder_sms?: boolean | null
          map_weekly_reminder_time?: string | null
        }
        if (row.map_weekly_reminder_email != null) setWeeklyDigestEmail(!!row.map_weekly_reminder_email)
        if (row.map_weekly_reminder_sms != null) setWeeklyDigestSms(!!row.map_weekly_reminder_sms)
        const n = normalizeReminderTimeForPicker(row.map_weekly_reminder_time ?? undefined)
        if (n) setWeeklyDigestTime(n)
      }
    }
    loadPrefs()
    return () => { cancelled = true }
  }, [])

  useEffect(() => {
    if (isIntensive || selectionsHydrated || studioLoading) return
    const { system } = partitionCommitments(activeCommitments)
    if (system.length > 0) {
      setSelections(builderSelectionsFromSystemCommitments(system))
    }
    setSelectionsHydrated(true)
  }, [isIntensive, selectionsHydrated, studioLoading, activeCommitments])

  const toggleActivity = (pillar: MapCategory, activityType: string, defaultCadenceJson: string, activity: ActivityDefinition) => {
    setSelections(prev => {
      const current = prev[pillar]
      const exists = current.find(s => s.activityType === activityType)
      if (exists) {
        return { ...prev, [pillar]: current.filter(s => s.activityType !== activityType) }
      }
      return {
        ...prev,
        [pillar]: [...current, {
          activityType,
          cadenceJson: defaultCadenceJson,
          notifySms: false,
          notifyEmail: false,
          reminderTime: activity.usesPublishedSchedule ? '' : activity.defaultTimeOfDay || '',
          reminderDays: daysForCadence(defaultCadenceJson),
        }],
      }
    })
  }

  const updateCadence = (pillar: MapCategory, activityType: string, cadenceJson: string) => {
    setSelections(prev => ({
      ...prev,
      [pillar]: prev[pillar].map(s =>
        s.activityType === activityType
          ? { ...s, cadenceJson, reminderDays: daysForCadence(cadenceJson) }
          : s
      ),
    }))
  }

  const updateReminder = (pillar: MapCategory, activityType: string, patch: Partial<BuilderSelection>) => {
    setSelections(prev => ({
      ...prev,
      [pillar]: prev[pillar].map(s =>
        s.activityType === activityType ? { ...s, ...patch } : s
      ),
    }))
  }

  const totalSelected = Object.values(selections).reduce((sum, arr) => sum + arr.length, 0)
  const everyPillarHasOne = PILLAR_ORDER.every(p => selections[p].length > 0)
  const canActivate = everyPillarHasOne

  const handleActivate = async () => {
    if (!canActivate) return
    setSaving(true)
    setError(null)

    try {
      const supabase = createClient()
      const { data: { session } } = await supabase.auth.getSession()
      const user = session?.user
      if (!user) { setError('Please log in.'); return }

      const commitmentRows = PILLAR_ORDER.flatMap(pillar =>
        selections[pillar].map(sel => {
          const activity = getActivityDefinition(sel.activityType)
          if (!activity) return null
          return {
            category: pillar,
            type: 'recurring' as const,
            title: activity.label,
            description: activity.description,
            cadence: JSON.parse(sel.cadenceJson),
            activity_type: sel.activityType,
            notify_sms: activity.usesPublishedSchedule ? false : sel.notifySms,
            notify_email: activity.usesPublishedSchedule ? false : sel.notifyEmail,
            reminder_time: activity.usesPublishedSchedule
              ? null
              : sel.reminderTime
                ? reminderTimeToPostgresTime(sel.reminderTime)
                : null,
            reminder_days: (() => {
              const maxD = maxSelectableDaysFromCadenceJson(sel.cadenceJson)
              const unique = [...new Set(sel.reminderDays)]
              if (unique.length === 0) return null
              if (unique.length > maxD) return daysForCadence(sel.cadenceJson)
              return unique
            })(),
          }
        })
      ).filter(Boolean)

      const activateRes = await fetch('/api/map/activate-system', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: 'My MAP',
          timezone: userTimezone,
          map_weekly_reminder_email: weeklyDigestEmail,
          map_weekly_reminder_sms: weeklyDigestSms,
          map_weekly_reminder_time: weeklyDigestTime,
          commitments: commitmentRows,
        }),
      })

      if (!activateRes.ok) {
        const errBody = await activateRes.json().catch(() => ({}))
        throw new Error(
          (errBody as { error?: string }).error || 'Failed to activate MAP',
        )
      }

      await fetch('/api/map/generate-occurrences', { method: 'POST' })
      await fetch('/api/map/schedule-reminders', { method: 'POST' }).catch(() => {})
      await refreshAll()
      if (onActivateComplete) {
        await onActivateComplete()
      } else if (redirectTo) {
        router.push(redirectTo)
      }
    } catch (err: unknown) {
      console.error('Error creating MAP:', err)
      setError(err instanceof Error ? err.message : 'Something went wrong.')
    } finally {
      setSaving(false)
    }
  }

  const visiblePillars = isIntensive
    ? PILLAR_ORDER.filter(pillar =>
        getActivitiesByCategory(pillar).some(isIntensiveSelectableActivity),
      )
    : PILLAR_ORDER

  const builderReady = isIntensive || selectionsHydrated

  return (
    <Stack gap="lg">
      {showHeader && (
        <div className={isIntensive ? 'text-center' : undefined}>
          <h1 className="text-2xl font-bold text-white">
            {isIntensive ? 'Your Commitments For This First Cycle' : 'System MAP'}
          </h1>
          <p className={`text-sm text-neutral-500 mt-1${isIntensive ? ' leading-relaxed' : ''}`}>
            {isIntensive
              ? 'We pre-selected one commitment per area; adjust anything you want.'
              : 'Your current MAP is loaded below — adjust selections, cadence, and reminders, then save.'}
          </p>
        </div>
      )}

      {!builderReady ? (
        <div className="flex min-h-[24vh] items-center justify-center">
          <Spinner size="lg" />
        </div>
      ) : (
      <>
      <div className={gridLayout ? 'grid min-w-0 grid-cols-1 lg:grid-cols-2 gap-5' : 'space-y-4'}>
        {visiblePillars.map(pillar => {
          const meta = PILLAR_META[pillar]
          const picker = (
            <PillarPicker
              key={pillar}
              pillar={pillar}
              meta={meta}
              selections={selections[pillar]}
              activityFilter={isIntensive ? isIntensiveSelectableActivity : undefined}
              onToggle={(activityType, defaultCadence, activity) => toggleActivity(pillar, activityType, defaultCadence, activity)}
              onCadenceChange={(activityType, cadence) => updateCadence(pillar, activityType, cadence)}
              onReminderChange={(activityType, patch) => updateReminder(pillar, activityType, patch)}
              hasPhone={hasPhone}
              smsOptIn={smsOptIn}
              bare={gridLayout}
            />
          )
          if (!gridLayout) return picker
          return (
            <ToggleSection
              key={pillar}
              label={meta.verb}
              color={meta.color}
              count={selections[pillar].length}
            >
              {picker}
            </ToggleSection>
          )
        })}
        {gridLayout && customSlot}
      </div>

      <div className="border-t border-neutral-800 pt-6">
      <div className="rounded-2xl border border-[#1A1A1A] bg-[#0A0A0A] overflow-hidden p-4 text-center">
        <div className="flex items-center justify-center gap-2 mb-1">
          <Bell className="w-4 h-4 text-neutral-400" />
          <span className="text-sm font-semibold text-white">Weekly MAP digest</span>
        </div>
        <p className="text-xs text-neutral-600 mb-3 leading-relaxed md:mb-2 max-w-md mx-auto">
          {isIntensive
            ? 'Optional Monday summary of your week ahead — uses your account time zone.'
            : 'Monday summary of your week ahead — uses your MAP time zone.'}
        </p>
        <div className="flex flex-col items-center gap-2.5 md:flex-row md:flex-wrap md:justify-center md:items-center md:gap-3">
          <div className="grid w-full max-w-[14rem] grid-cols-2 gap-2.5 md:flex md:w-auto md:max-w-none md:gap-3">
          <button
            type="button"
            onClick={() => setWeeklyDigestEmail(!weeklyDigestEmail)}
            className={`inline-flex items-center justify-center gap-1.5 rounded-lg border px-3 py-2 text-[11px] font-medium min-w-0 ${
              weeklyDigestEmail ? 'border-primary-500/40 bg-primary-500/10 text-primary-400' : 'border-neutral-800 text-neutral-500'
            }`}
          >
            <Mail className="h-3.5 w-3.5" /> Email
          </button>
          <button
            type="button"
            onClick={() => setWeeklyDigestSms(!weeklyDigestSms)}
            className={`inline-flex items-center justify-center gap-1.5 rounded-lg border px-3 py-2 text-[11px] font-medium min-w-0 ${
              weeklyDigestSms ? 'border-primary-500/40 bg-primary-500/10 text-primary-400' : 'border-neutral-800 text-neutral-500'
            }`}
          >
            <MessageSquare className="h-3.5 w-3.5" /> SMS
          </button>
          </div>
          {(weeklyDigestEmail || weeklyDigestSms) && (
            <div className="w-full max-w-[8.5rem] shrink-0 md:w-[8.5rem]">
              <TimePicker
                size="sm"
                value={normalizeReminderTimeForPicker(weeklyDigestTime) || undefined}
                onChange={v => setWeeklyDigestTime(v)}
              />
            </div>
          )}
        </div>
        {isIntensive && !hasPhone && weeklyDigestSms && (
          <p className="text-[10px] text-neutral-600 mt-2 max-w-md mx-auto">
            Add a phone number in Account Settings to receive weekly SMS.
          </p>
        )}
      </div>
      </div>

      {error && <p className="text-sm text-red-400 text-center">{error}</p>}

      {gridLayout ? (
        <div className="sticky bottom-0 z-10 mt-4 bg-black/80 py-3 backdrop-blur-lg md:border-t md:border-neutral-800/60">
          <div className="flex w-full items-center justify-center gap-3">
            <Button
              variant="primary"
              size="md"
              className="w-full md:w-auto"
              onClick={handleActivate}
              disabled={!canActivate || saving}
            >
              {saving ? (
                <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Saving...</>
              ) : (
                <>Save Plan ({totalSelected})</>
              )}
            </Button>
          </div>
          {!everyPillarHasOne && totalSelected > 0 && (
            <p className="text-xs text-yellow-400/80 mt-2 text-center">Pick at least one action in each area.</p>
          )}
        </div>
      ) : (
        <div className="text-center pb-4">
          <Button variant="primary" size="lg" onClick={handleActivate} disabled={!canActivate || saving}>
            {saving ? (
              <><Loader2 className="w-5 h-5 mr-2 animate-spin" />{isIntensive ? 'Activating...' : 'Saving...'}</>
            ) : (
              <>{isIntensive ? `Activate MAP (${totalSelected})` : `Save System MAP (${totalSelected})`}</>
            )}
          </Button>
          {!everyPillarHasOne && totalSelected > 0 && (
            <p className="text-xs text-yellow-400/80 mt-2">Pick at least one action in each area.</p>
          )}
        </div>
      )}
      </>
      )}
    </Stack>
  )
}

export function ToggleSection({
  label,
  color,
  count,
  defaultOpen = true,
  children,
  className,
  headerAction,
}: {
  label: string
  color: string
  count?: number
  defaultOpen?: boolean
  children: React.ReactNode
  className?: string
  headerAction?: React.ReactNode
}) {
  const [open, setOpen] = useState(defaultOpen)

  const labelEl = (
    <span className="text-xs uppercase tracking-[0.15em] font-bold shrink-0 text-white">
      {label}
    </span>
  )

  const countBadge =
    count != null && count > 0 ? (
      <span className="inline-flex size-7 items-center justify-center rounded-full text-[10px] font-bold tabular-nums leading-none shrink-0 bg-neutral-900 text-neutral-300 ring-1 ring-neutral-700">
        {count}
      </span>
    ) : null

  const headerTrailing = headerAction ?? countBadge

  return (
    <div
      className={`rounded-2xl overflow-hidden bg-[#0A0A0A] border border-neutral-800/60 ${className ?? ''}`}
    >
      {/* Mobile: collapsible header */}
      <div className="flex lg:hidden items-center gap-2 px-4 py-3.5">
        <button
          type="button"
          onClick={() => setOpen(v => !v)}
          className="p-1 shrink-0 text-neutral-500"
          aria-label={open ? 'Collapse section' : 'Expand section'}
        >
          <ChevronDown
            className="w-4 h-4 transition-transform duration-200"
            style={{ transform: open ? 'rotate(180deg)' : undefined }}
          />
        </button>
        {labelEl}
        {headerTrailing ? (
          <div className="ml-auto shrink-0">{headerTrailing}</div>
        ) : null}
      </div>
      {/* Desktop: static header */}
      <div className="hidden lg:flex items-center gap-2.5 px-4 py-3.5">
        {labelEl}
        {headerTrailing ? (
          <div className="ml-auto shrink-0">{headerTrailing}</div>
        ) : null}
      </div>
      {/* Mobile: animated collapse. Desktop: always visible */}
      <div
        className="grid lg:!grid-rows-[1fr] transition-[grid-template-rows] duration-200 ease-in-out"
        style={{ gridTemplateRows: open ? '1fr' : '0fr' }}
      >
        <div className="overflow-hidden lg:!overflow-visible min-w-0">
          {children}
        </div>
      </div>
    </div>
  )
}

function PillarPicker({
  pillar,
  meta,
  selections,
  activityFilter,
  onToggle,
  onCadenceChange,
  onReminderChange,
  hasPhone,
  smsOptIn,
  bare = false,
}: {
  pillar: MapCategory
  meta: typeof PILLAR_META[string]
  selections: BuilderSelection[]
  activityFilter?: (activity: ActivityDefinition) => boolean
  onToggle: (activityType: string, defaultCadenceJson: string, activity: ActivityDefinition) => void
  onCadenceChange: (activityType: string, cadenceJson: string) => void
  onReminderChange: (activityType: string, patch: Partial<BuilderSelection>) => void
  hasPhone: boolean
  smsOptIn: boolean
  /** Strip outer chrome when nested inside a ToggleSection */
  bare?: boolean
}) {
  const activities = getActivitiesByCategory(pillar).filter(a => !activityFilter || activityFilter(a))
  const hasSelections = selections.length > 0

  if (bare) {
    return (
      <div className="px-3 pb-3 space-y-2 min-w-0 overflow-hidden">
        {activities.map(activity => (
          <ActivityRow
            key={activity.type}
            activity={activity}
            meta={meta}
            sel={selections.find(s => s.activityType === activity.type)}
            onToggle={onToggle}
            onCadenceChange={onCadenceChange}
            onReminderChange={onReminderChange}
            hasPhone={hasPhone}
            smsOptIn={smsOptIn}
          />
        ))}
      </div>
    )
  }

  return (
    <div
      className="rounded-2xl border overflow-hidden"
      style={{ borderColor: hasSelections ? `${meta.color}30` : '#1A1A1A', backgroundColor: '#0A0A0A' }}
    >
      <div className="h-0.5" style={{ backgroundColor: hasSelections ? meta.color : `${meta.color}30` }} />
      <div className="p-4">
        <span className="text-[11px] uppercase tracking-[0.2em] font-bold text-white">
          {meta.verb}
        </span>
        <div className="space-y-2 mt-3">
          {activities.map(activity => (
            <ActivityRow
              key={activity.type}
              activity={activity}
              meta={meta}
              sel={selections.find(s => s.activityType === activity.type)}
              onToggle={onToggle}
              onCadenceChange={onCadenceChange}
              onReminderChange={onReminderChange}
              hasPhone={hasPhone}
              smsOptIn={smsOptIn}
            />
          ))}
        </div>
      </div>
    </div>
  )
}

function ActivityRow({
  activity,
  meta,
  sel,
  onToggle,
  onCadenceChange,
  onReminderChange,
  hasPhone,
  smsOptIn,
}: {
  activity: ActivityDefinition
  meta: typeof PILLAR_META[string]
  sel: BuilderSelection | undefined
  onToggle: (activityType: string, defaultCadenceJson: string, activity: ActivityDefinition) => void
  onCadenceChange: (activityType: string, cadenceJson: string) => void
  onReminderChange: (activityType: string, patch: Partial<BuilderSelection>) => void
  hasPhone: boolean
  smsOptIn: boolean
}) {
  const isSelected = !!sel
  const daysCount = activity.defaultDaysOfWeek.length
  const defaultCadence = daysCount >= 7
    ? JSON.stringify({ kind: 'daily' })
    : JSON.stringify({ kind: 'days_per_week', count: daysCount })

  return (
    <div className="min-w-0 overflow-hidden">
      <button
        type="button"
        onClick={() => onToggle(activity.type, defaultCadence, activity)}
        className={`w-full flex items-center gap-3 p-2.5 rounded-xl text-left transition-colors ${
          isSelected ? 'bg-neutral-800/80 border' : 'bg-neutral-900/50 hover:bg-neutral-800 border border-transparent'
        }`}
        style={isSelected ? { borderColor: `${meta.color}30` } : undefined}
      >
        <div
          className={`w-5 h-5 rounded flex items-center justify-center border transition-colors ${
            isSelected ? 'border-transparent' : 'border-neutral-600'
          }`}
          style={isSelected ? { backgroundColor: meta.color } : undefined}
        >
          {isSelected && <Check className="w-3.5 h-3.5 text-black" />}
        </div>
        <activity.icon className="w-4 h-4" style={{ color: meta.color }} />
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-white">{activity.label}</p>
          <p className="text-xs text-neutral-600">{activity.description}</p>
        </div>
      </button>
      {isSelected && sel && (
        <MapActivityScheduleControls
          sel={sel}
          isDaily={isDailyCadence(sel.cadenceJson)}
          activityType={activity.type}
          hasPhone={hasPhone}
          smsOptIn={smsOptIn}
          onCadenceChange={onCadenceChange}
          onReminderChange={onReminderChange}
        />
      )}
    </div>
  )
}
