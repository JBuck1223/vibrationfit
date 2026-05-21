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
import { Check, Sparkles, Loader2, Bell, Mail, MessageSquare } from 'lucide-react'
import { useMapStudio } from './MapStudioContext'
import { getActivityDefinition, getActivitiesByCategory, type ActivityDefinition } from '@/lib/map/activities'
import { PILLAR_ORDER, PILLAR_META } from '@/lib/map/map-pillar-config'
import {
  INTENSIVE_DEFAULT_SELECTIONS,
  intensiveReminderDefaults,
  isIntensiveSelectableActivity,
} from '@/lib/map/intensive-map-config'
import {
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
}: {
  redirectTo?: string
  variant?: MapSystemBuilderVariant
  onActivateComplete?: () => void | Promise<void>
}) {
  const isIntensive = variant === 'intensive-first-cycle'
  const router = useRouter()
  const { refreshAll } = useMapStudio()
  const [selections, setSelections] = useState<Record<MapCategory, BuilderSelection[]>>(() =>
    isIntensive ? buildIntensiveInitialSelections() : {
      activations: [],
      creations: [],
      connections: [],
      sessions: [],
    },
  )
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

      await supabase.from('user_maps').update({ is_active: false }).eq('user_id', user.id).eq('is_active', true)

      const { count } = await supabase
        .from('user_maps')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .eq('is_draft', false)

      const nextVersion = (count ?? 0) + 1

      const { data: newMap, error: mapError } = await supabase
        .from('user_maps')
        .insert({
          user_id: user.id,
          title: `MAP v${nextVersion}`,
          is_draft: false,
          is_active: true,
          version_number: nextVersion,
          timezone: userTimezone,
          map_weekly_reminder_email: weeklyDigestEmail,
          map_weekly_reminder_sms: weeklyDigestSms,
          map_weekly_reminder_time: reminderTimeToPostgresTime(weeklyDigestTime),
        })
        .select('id')
        .single()

      if (mapError || !newMap) throw mapError || new Error('Failed to create MAP')

      await supabase
        .from('commitments')
        .update({ status: 'archived' })
        .eq('user_id', user.id)
        .eq('status', 'active')
        .in('category', PILLAR_ORDER)

      const commitmentRows = PILLAR_ORDER.flatMap(pillar =>
        selections[pillar].map(sel => {
          const activity = getActivityDefinition(sel.activityType)
          if (!activity) return null
          return {
            user_id: user.id,
            category: pillar,
            type: 'recurring' as const,
            title: activity.label,
            description: activity.description,
            cadence: JSON.parse(sel.cadenceJson),
            activity_type: sel.activityType,
            status: 'active' as const,
            notify_sms: activity.usesPublishedSchedule ? false : sel.notifySms,
            notify_email: activity.usesPublishedSchedule ? false : sel.notifyEmail,
            reminder_time: activity.usesPublishedSchedule
              ? null
              : normalizeReminderTimeForPicker(sel.reminderTime) || null,
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

      const { error: commitError } = await supabase.from('commitments').insert(commitmentRows)
      if (commitError) throw commitError

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

  return (
    <Stack gap="lg">
      <div>
        <h1 className="text-2xl font-bold text-white">
          {isIntensive ? 'Your Commitments For This First Cycle' : 'System MAP'}
        </h1>
        <p className="text-sm text-neutral-500 mt-1">
          {isIntensive
            ? 'These are the practices you built in your Intensive — vision audio, journal, Vibe Tribe, and Alignment Gym. We pre-selected one commitment per area; adjust anything you want.'
            : 'Select the actions you want to commit to in each area.'}
        </p>
      </div>

      <div className="space-y-4">
        {visiblePillars.map(pillar => (
          <PillarPicker
            key={pillar}
            pillar={pillar}
            meta={PILLAR_META[pillar]}
            selections={selections[pillar]}
            activityFilter={isIntensive ? isIntensiveSelectableActivity : undefined}
            onToggle={(activityType, defaultCadence, activity) => toggleActivity(pillar, activityType, defaultCadence, activity)}
            onCadenceChange={(activityType, cadence) => updateCadence(pillar, activityType, cadence)}
            onReminderChange={(activityType, patch) => updateReminder(pillar, activityType, patch)}
            hasPhone={hasPhone}
            smsOptIn={smsOptIn}
          />
        ))}
      </div>

      <div className="rounded-2xl border border-[#1A1A1A] bg-[#0A0A0A] overflow-hidden p-4">
        <div className="flex items-center gap-2 mb-1">
          <Bell className="w-4 h-4 text-neutral-400" />
          <span className="text-sm font-semibold text-white">Weekly MAP digest</span>
        </div>
        <p className="text-xs text-neutral-600 mb-3 leading-relaxed md:mb-2">
          {isIntensive
            ? 'Optional Monday summary of your week ahead — uses your account time zone.'
            : 'Monday summary of your week ahead — uses your MAP time zone.'}
        </p>
        <div className="flex flex-col gap-2.5 sm:flex-row sm:flex-wrap sm:items-center md:flex-nowrap md:items-center md:gap-3">
          <button
            type="button"
            onClick={() => setWeeklyDigestEmail(!weeklyDigestEmail)}
            className={`inline-flex items-center gap-1.5 rounded-lg border px-3 py-2 text-[11px] font-medium ${
              weeklyDigestEmail ? 'border-primary-500/40 bg-primary-500/10 text-primary-400' : 'border-neutral-800 text-neutral-500'
            }`}
          >
            <Mail className="h-3.5 w-3.5" /> Email
          </button>
          <button
            type="button"
            onClick={() => setWeeklyDigestSms(!weeklyDigestSms)}
            className={`inline-flex items-center gap-1.5 rounded-lg border px-3 py-2 text-[11px] font-medium ${
              weeklyDigestSms ? 'border-primary-500/40 bg-primary-500/10 text-primary-400' : 'border-neutral-800 text-neutral-500'
            }`}
          >
            <MessageSquare className="h-3.5 w-3.5" /> SMS
          </button>
          {(weeklyDigestEmail || weeklyDigestSms) && (
            <TimePicker
              size="sm"
              value={normalizeReminderTimeForPicker(weeklyDigestTime) || undefined}
              onChange={v => setWeeklyDigestTime(v)}
              className="w-[8.5rem]"
            />
          )}
        </div>
        {isIntensive && !hasPhone && weeklyDigestSms && (
          <p className="text-[10px] text-neutral-600 mt-2">
            Add a phone number in Account Settings to receive weekly SMS.
          </p>
        )}
      </div>

      {error && <p className="text-sm text-red-400 text-center">{error}</p>}

      <div className="text-center pb-4">
        <Button variant="primary" size="lg" onClick={handleActivate} disabled={!canActivate || saving}>
          {saving ? (
            <><Loader2 className="w-5 h-5 mr-2 animate-spin" />{isIntensive ? 'Activating...' : 'Saving...'}</>
          ) : (
            <><Sparkles className="w-5 h-5 mr-2" />{isIntensive ? `Activate MAP (${totalSelected})` : `Save System MAP (${totalSelected})`}</>
          )}
        </Button>
        {!everyPillarHasOne && totalSelected > 0 && (
          <p className="text-xs text-yellow-400/80 mt-2">Pick at least one action in each area.</p>
        )}
      </div>
    </Stack>
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
}) {
  const activities = getActivitiesByCategory(pillar).filter(a => !activityFilter || activityFilter(a))
  const hasSelections = selections.length > 0

  return (
    <div
      className="rounded-2xl border overflow-hidden"
      style={{ borderColor: hasSelections ? `${meta.color}30` : '#1A1A1A', backgroundColor: '#0A0A0A' }}
    >
      <div className="h-0.5" style={{ backgroundColor: hasSelections ? meta.color : `${meta.color}30` }} />
      <div className="p-4">
        <span className="text-[11px] uppercase tracking-[0.2em] font-bold" style={{ color: meta.color }}>
          {meta.verb}
        </span>
        <div className="space-y-2 mt-3">
          {activities.map(activity => {
            const sel = selections.find(s => s.activityType === activity.type)
            const isSelected = !!sel
            const daysCount = activity.defaultDaysOfWeek.length
            const defaultCadence = daysCount >= 7
              ? JSON.stringify({ kind: 'daily' })
              : JSON.stringify({ kind: 'days_per_week', count: daysCount })

            return (
              <div key={activity.type}>
                <button
                  type="button"
                  onClick={() => onToggle(activity.type, defaultCadence, activity)}
                  className={`w-full flex items-center gap-3 p-2.5 rounded-xl text-left ${
                    isSelected ? 'bg-neutral-800/80 border' : 'bg-neutral-900/50 hover:bg-neutral-800 border border-transparent'
                  }`}
                  style={isSelected ? { borderColor: `${meta.color}30` } : undefined}
                >
                  <div
                    className={`w-5 h-5 rounded flex items-center justify-center border ${
                      isSelected ? 'border-transparent' : 'border-neutral-600'
                    }`}
                    style={isSelected ? { backgroundColor: meta.color } : undefined}
                  >
                    {isSelected && <Check className="w-3.5 h-3.5 text-black" />}
                  </div>
                  <activity.icon className="w-4 h-4" style={{ color: meta.color }} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-white">{activity.label}</p>
                    <p className="text-xs text-neutral-600 truncate">{activity.description}</p>
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
          })}
        </div>
      </div>
    </div>
  )
}
