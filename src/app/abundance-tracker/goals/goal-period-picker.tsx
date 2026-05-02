'use client'

import React from 'react'
import { Select, DatePicker } from '@/lib/design-system/components'
import { getPeriodKey, type PeriodType } from '@/lib/abundance/period-utils'
import {
  sectionLabel,
  segmentTrackFour,
  periodSelectClassName,
  customRangeDateClassName,
  PERIOD_OPTIONS,
} from './ui-constants'

export type GoalPeriodPickerProps = {
  now: Date
  periodType: PeriodType
  onPeriodTypeChange: (p: PeriodType) => void
  periodKey: string
  onPeriodKeyChange: (key: string) => void
  customStart: string
  onCustomStartChange: (v: string) => void
  customEnd: string
  onCustomEndChange: (v: string) => void
  /** Label above segment control (default: Select time period) */
  sectionTitle?: string
}

export function GoalPeriodPicker(props: GoalPeriodPickerProps) {
  const {
    now,
    periodType,
    onPeriodTypeChange,
    periodKey,
    onPeriodKeyChange,
    customStart,
    onCustomStartChange,
    customEnd,
    onCustomEndChange,
    sectionTitle = 'Select time period',
  } = props

  return (
    <div className="border-b border-[#252525] px-4 pb-4 pt-5 md:px-6 md:pb-5 md:pt-6">
      <p className={`${sectionLabel} mb-3`}>{sectionTitle}</p>
      <div className="mx-auto w-full max-w-xl" role="group" aria-label="Goal period type">
        <div className={segmentTrackFour}>
          {PERIOD_OPTIONS.map(({ value, label }, index, arr) => {
            const selected = periodType === value
            const short =
              value === 'month' ? 'Mo' : value === 'quarter' ? 'Qtr' : value === 'year' ? 'Yr' : 'Custom'
            const endCaps =
              index === 0 ? 'rounded-l-lg' : index === arr.length - 1 ? 'rounded-r-lg' : ''
            return (
              <button
                key={value}
                type="button"
                aria-pressed={selected}
                onClick={() => {
                  onPeriodTypeChange(value)
                  if (value !== 'custom') onPeriodKeyChange(getPeriodKey(now, value))
                }}
                className={`min-h-[2.75rem] overflow-hidden px-1 py-2 text-center text-[11px] font-medium leading-tight transition-colors sm:min-h-11 sm:px-2 sm:text-sm ${endCaps} ${
                  selected
                    ? 'bg-zinc-900/85 font-semibold text-primary-400'
                    : 'text-zinc-500 hover:bg-white/[0.04] hover:text-zinc-200'
                }`}
              >
                <span className="hidden sm:inline">{label}</span>
                <span className="sm:hidden">{short}</span>
              </button>
            )
          })}
        </div>
      </div>
      {periodType !== 'custom' && (
        <div className="mx-auto mt-5 w-full max-w-md space-y-2 pt-1">
          <p className="text-center text-[10px] font-medium uppercase tracking-[0.22em] text-neutral-500">
            {periodType === 'month'
              ? 'Choose month'
              : periodType === 'quarter'
                ? 'Choose quarter'
                : 'Choose year'}
          </p>
          {periodType === 'month' &&
            (() => {
              const currentYear = now.getFullYear()
              const currentMonth = now.getMonth()
              const options: { value: string; label: string }[] = []
              for (let i = 0; i < 24; i++) {
                const d = new Date(currentYear, currentMonth + i, 1)
                const y = d.getFullYear()
                const m = d.getMonth() + 1
                const value = `${y}-${String(m).padStart(2, '0')}`
                const label = d.toLocaleString('en-US', { month: 'long', year: 'numeric' })
                options.push({ value, label })
              }
              return (
                <Select
                  value={periodKey}
                  onChange={(value) => onPeriodKeyChange(value)}
                  placeholder="Select month..."
                  options={options}
                  className={periodSelectClassName}
                />
              )
            })()}
          {periodType === 'quarter' &&
            (() => {
              const currentYear = now.getFullYear()
              const currentQ = Math.ceil((now.getMonth() + 1) / 3)
              const options: { value: string; label: string }[] = []
              for (let y = currentYear; y <= currentYear + 2; y++) {
                const startQ = y === currentYear ? currentQ : 1
                for (let q = startQ; q <= 4; q++) {
                  options.push({ value: `${y}-Q${q}`, label: `Q${q} ${y}` })
                }
              }
              return (
                <Select
                  value={periodKey}
                  onChange={(value) => onPeriodKeyChange(value)}
                  placeholder="Select quarter..."
                  options={options}
                  className={periodSelectClassName}
                />
              )
            })()}
          {periodType === 'year' && (
            <Select
              value={periodKey}
              onChange={(value) => onPeriodKeyChange(value)}
              placeholder="Select year..."
              options={Array.from({ length: 5 }, (_, i) => {
                const y = now.getFullYear() + i
                return { value: String(y), label: String(y) }
              })}
              className={periodSelectClassName}
            />
          )}
        </div>
      )}
      {periodType === 'custom' && (
        <div className="mx-auto mt-5 w-full max-w-2xl space-y-5 pt-5">
          <p className="text-center text-[10px] font-medium uppercase tracking-[0.22em] text-neutral-500">
            Custom date range
          </p>
          <div className="space-y-3">
            <div className="hidden gap-3 sm:grid sm:grid-cols-[1fr_auto_1fr]">
              <p className="text-center text-[10px] font-medium uppercase tracking-[0.18em] text-neutral-500">
                Start date
              </p>
              <span aria-hidden className="block" />
              <p className="text-center text-[10px] font-medium uppercase tracking-[0.18em] text-neutral-500">
                End date
              </p>
            </div>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-[1fr_auto_1fr] sm:items-center sm:gap-3">
              <div className="min-w-0 space-y-2 sm:space-y-0">
                <p className="text-center text-[10px] font-medium uppercase tracking-[0.18em] text-neutral-500 sm:hidden">
                  Start date
                </p>
                <DatePicker
                  value={customStart}
                  onChange={(dateString: string) => onCustomStartChange(dateString)}
                  className={customRangeDateClassName}
                />
              </div>
              <span className="flex justify-center text-xs font-medium uppercase tracking-wider text-neutral-500">
                to
              </span>
              <div className="min-w-0 space-y-2 sm:space-y-0">
                <p className="text-center text-[10px] font-medium uppercase tracking-[0.18em] text-neutral-500 sm:hidden">
                  End date
                </p>
                <DatePicker
                  value={customEnd}
                  onChange={(dateString: string) => onCustomEndChange(dateString)}
                  minDate={customStart || undefined}
                  className={customRangeDateClassName}
                />
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
