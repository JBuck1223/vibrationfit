import type { PeriodType } from '@/lib/abundance/period-utils'

export const shellCard =
  'overflow-hidden rounded-2xl border border-[#282828] bg-[#101010] shadow-[0_1px_0_rgba(255,255,255,0.04)_inset]'
export const sectionLabel = 'text-center text-[10px] font-medium uppercase tracking-[0.22em] text-neutral-500'
export const segmentTrackFour =
  'grid grid-cols-4 gap-0 overflow-hidden rounded-xl bg-zinc-950/90 p-1 ring-1 ring-inset ring-white/[0.08]'
export const selectTriggerSurface =
  '[&_button]:!min-h-[3rem] [&_button]:!rounded-xl [&_button]:!border [&_button]:!border-[#282828] [&_button]:!bg-[#1A1A1A] [&_button]:!py-3 [&_button]:!pl-4 [&_button]:!pr-12 [&_button]:!text-left [&_button]:shadow-[0_1px_0_rgba(255,255,255,0.04)_inset] [&_button]:transition-colors [&_button]:hover:!border-primary-500/40'
export const periodSelectClassName = `w-full max-w-md mx-auto ${selectTriggerSurface}`
export const goalsFilterBarShell =
  'rounded-xl border border-[#282828] bg-[#101010]/90 p-3 shadow-[0_4px_24px_rgba(0,0,0,0.22)] md:p-4'
export const customRangeDateClassName =
  'w-full [&_input]:!min-h-[3rem] [&_input]:!rounded-xl [&_input]:!border [&_input]:!border-solid [&_input]:!border-[#282828] [&_input]:!bg-[#1A1A1A] [&_input]:!py-3 [&_input]:!pl-4 [&_input]:!pr-10 [&_input]:!text-white [&_input]:placeholder:!text-neutral-500 [&_input]:shadow-[0_1px_0_rgba(255,255,255,0.04)_inset] [&_input]:transition-colors [&_input]:hover:!border-primary-500/40 [&_svg]:!text-neutral-400'
export const chartHeaderBar =
  'flex items-center justify-center border-b border-[#252525] px-4 py-3 md:min-h-[3.5rem] md:px-6'
export const metricTile =
  'rounded-xl border border-[#282828] bg-[#101010] p-4 shadow-[0_1px_0_rgba(255,255,255,0.04)_inset]'

export const PERIOD_OPTIONS: { value: PeriodType; label: string }[] = [
  { value: 'month', label: 'Month' },
  { value: 'quarter', label: 'Quarter' },
  { value: 'year', label: 'Year' },
  { value: 'custom', label: 'Custom' },
]

export const TIME_FRAME_FILTERS: { value: string; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'week', label: 'Week' },
  { value: 'month', label: 'Month' },
  { value: 'quarter', label: 'Quarter' },
  { value: 'year', label: 'Year' },
  { value: 'other', label: 'Other' },
]
