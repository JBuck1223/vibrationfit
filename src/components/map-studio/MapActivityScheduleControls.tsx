'use client'

import Link from 'next/link'
import { Mail, MessageSquare } from 'lucide-react'
import { Select, TimePicker } from '@/lib/design-system/components'
import { getActivityDefinition } from '@/lib/map/activities'
import {
  CADENCE_SELECT_OPTIONS,
  maxSelectableDaysFromCadenceJson,
  type BuilderSelection,
} from '@/lib/map/map-builder-cadence'
import { normalizeReminderTimeForPicker } from '@/lib/map/reminder-time'

const BUILDER_DAY_LABELS = ['S', 'M', 'T', 'W', 'T', 'F', 'S'] as const

export function MapActivityScheduleControls({
  sel,
  isDaily,
  activityType,
  hasPhone,
  smsOptIn,
  onCadenceChange,
  onReminderChange,
}: {
  sel: BuilderSelection
  isDaily: boolean
  activityType: string
  hasPhone: boolean
  smsOptIn: boolean
  onCadenceChange: (activityType: string, cadenceJson: string) => void
  onReminderChange: (activityType: string, patch: Partial<BuilderSelection>) => void
}) {
  const maxDays = maxSelectableDaysFromCadenceJson(sel.cadenceJson)
  const sched = getActivityDefinition(activityType)
  const usesPublishedSchedule = sched?.usesPublishedSchedule === true
  const smsDisabled = !hasPhone || !smsOptIn

  if (usesPublishedSchedule) {
    return (
      <div className="mt-2 w-full min-w-0 rounded-xl border border-neutral-800/70 bg-black/25 p-3">
        <p className="text-[11px] leading-snug text-neutral-500">
          Attending live or opening the session page after counts as complete. Schedule and replays:{' '}
          <Link href={sched?.defaultDeepLink ?? '/alignment-gym'} className="text-primary-400 hover:underline">
            Alignment Gym
          </Link>
          .
        </p>
      </div>
    )
  }

  const channelsOn = sel.notifySms || sel.notifyEmail

  return (
    <div className="mt-2 w-full min-w-0 rounded-xl border border-neutral-800/70 bg-black/25 p-3">
      <div className="flex min-w-0 flex-col gap-2.5 xl:flex-row xl:flex-wrap xl:items-center xl:gap-3">
        <div className="w-full min-w-0 shrink-0 xl:w-44">
          <Select
            options={CADENCE_SELECT_OPTIONS}
            value={sel.cadenceJson}
            onChange={v => onCadenceChange(activityType, v)}
            placeholder="Cadence"
            className="[&_button]:py-2 [&_button]:text-sm"
          />
        </div>

        <div
          className="inline-grid shrink-0 grid-cols-7 gap-1"
          role="group"
          aria-label={isDaily ? 'Every day' : 'Days for this cadence'}
        >
          {BUILDER_DAY_LABELS.map((label, idx) => {
            const isOn = isDaily || sel.reminderDays.includes(idx)
            const atCap = !isDaily && sel.reminderDays.length >= maxDays
            const cannotTurnOn = !isDaily && !isOn && atCap
            return (
              <button
                key={idx}
                type="button"
                disabled={isDaily || cannotTurnOn}
                onClick={() => {
                  if (isDaily) return
                  if (isOn) {
                    if (sel.reminderDays.length <= 1) return
                    onReminderChange(activityType, {
                      reminderDays: sel.reminderDays.filter(d => d !== idx),
                    })
                    return
                  }
                  if (sel.reminderDays.length >= maxDays) return
                  onReminderChange(activityType, {
                    reminderDays: [...sel.reminderDays, idx].sort((a, b) => a - b),
                  })
                }}
                className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-[10px] font-semibold leading-none transition-all ${
                  cannotTurnOn ? 'cursor-not-allowed opacity-35' : ''
                } ${
                  isOn
                    ? 'bg-primary-500 text-black ring-1 ring-primary-500/50'
                    : 'bg-neutral-800/70 text-neutral-500 hover:bg-neutral-700'
                }`}
              >
                {label}
              </button>
            )
          })}
        </div>

        <div className="flex w-full min-w-0 shrink-0 flex-wrap items-center gap-x-2 gap-y-2 xl:w-auto">
          <button
            type="button"
            onClick={() => onReminderChange(activityType, { notifyEmail: !sel.notifyEmail })}
            className={`inline-flex shrink-0 items-center gap-1.5 rounded-lg border px-3 py-2 text-[11px] font-medium transition-all ${
              sel.notifyEmail
                ? 'border-primary-500/40 bg-primary-500/10 text-primary-400'
                : 'border-neutral-800 text-neutral-500 hover:border-neutral-700 hover:text-neutral-400'
            }`}
          >
            <Mail className="h-3.5 w-3.5 shrink-0" />
            Email
          </button>
          <button
            type="button"
            onClick={() => !smsDisabled && onReminderChange(activityType, { notifySms: !sel.notifySms })}
            disabled={smsDisabled}
            title={
              !hasPhone
                ? 'Add a phone number in Account Settings to enable SMS'
                : !smsOptIn
                  ? 'Enable SMS in Account Settings'
                  : undefined
            }
            className={`inline-flex shrink-0 items-center gap-1.5 rounded-lg border px-3 py-2 text-[11px] font-medium transition-all disabled:cursor-not-allowed disabled:opacity-40 ${
              sel.notifySms
                ? 'border-primary-500/40 bg-primary-500/10 text-primary-400'
                : 'border-neutral-800 text-neutral-500 hover:border-neutral-700 hover:text-neutral-400'
            }`}
          >
            <MessageSquare className="h-3.5 w-3.5 shrink-0" />
            SMS
          </button>
          {channelsOn && (
            <div className="flex shrink-0 items-center gap-2">
              <span className="shrink-0 text-[10px] font-medium uppercase tracking-wide text-neutral-500">
                at
              </span>
              <TimePicker
                size="sm"
                placeholder="Time"
                value={normalizeReminderTimeForPicker(sel.reminderTime) || undefined}
                onChange={v => onReminderChange(activityType, { reminderTime: v })}
                popoverAlign="end"
                className="w-[8.5rem] shrink-0"
              />
            </div>
          )}
        </div>
      </div>
      {isDaily && channelsOn && (
        <p className="text-[10px] text-neutral-600 mt-2 leading-relaxed">
          Reminders send every day at the time you pick.
        </p>
      )}
    </div>
  )
}
