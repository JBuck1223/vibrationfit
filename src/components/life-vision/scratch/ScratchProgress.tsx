'use client'

/**
 * Header for Start From Scratch: title, "n of 12 ready", a 12-cell bar, and
 * the Write My Life Vision button in the slot Commit as Active uses on the
 * update page.
 */

import { Sparkles } from 'lucide-react'
import { Button } from '@/lib/design-system/components'
import { ORDERED_VISION_CATEGORIES, type LifeCategoryKey } from '@/lib/design-system/vision-categories'
import { useInShell } from '@/lib/app-shell/shell-context'
import { GLASS_CARD } from '@/lib/app-shell/glass'
import { cn } from '@/lib/utils'

interface ScratchProgressProps {
  readyKeys: Set<LifeCategoryKey>
  total: number
  onWrite: () => void
  disabled?: boolean
  /** Labels of areas still thin or empty, for the button tooltip. */
  pendingLabels?: string[]
}

export function ScratchProgress({
  readyKeys,
  total,
  onWrite,
  disabled,
  pendingLabels,
}: ScratchProgressProps) {
  const ready = readyKeys.size
  const allReady = ready >= total
  const lifeCategories = ORDERED_VISION_CATEGORIES.filter(
    (c) => c.key !== 'forward' && c.key !== 'conclusion',
  )
  const inShell = useInShell()
  const writeTitle = allReady
    ? 'VIVA writes all 12 areas from your words'
    : pendingLabels?.length
      ? `Still needs more: ${pendingLabels.join(', ')}`
      : `${total - ready} ${total - ready === 1 ? 'area' : 'areas'} still need more`

  if (inShell) {
    // App shell: a hero card. Each life area is an icon that lights up once
    // it has enough to write from; Write My Life Vision glows when all do.
    return (
      <div className={cn(GLASS_CARD, 'p-4 md:p-5')}>
        <div className="flex items-end justify-between gap-3">
          <div className="min-w-0">
            <h1 className="text-xl font-bold text-white md:text-2xl">Your Life Vision</h1>
            <p className="mt-0.5 text-sm text-white/60">
              {allReady
                ? 'Every area is ready. VIVA can write it now.'
                : `${ready} of ${total} areas ready · ${total - ready} to go`}
            </p>
          </div>
          <span className="shrink-0 text-2xl font-bold tabular-nums text-[#39FF14]">
            {Math.round((ready / total) * 100)}%
          </span>
        </div>

        <div className="mt-4 grid grid-cols-6 gap-2 sm:grid-cols-12" aria-label={`${ready} of ${total} areas ready`}>
          {lifeCategories.map((c) => {
            const isReady = readyKeys.has(c.key as LifeCategoryKey)
            const CatIcon = c.icon
            return (
              <span
                key={c.key}
                title={`${c.label}${isReady ? ' · ready' : ''}`}
                className={cn(
                  'flex aspect-square items-center justify-center rounded-full transition-colors',
                  isReady
                    ? 'bg-[rgba(57,255,20,0.16)] text-[#39FF14] shadow-[0_0_12px_rgba(57,255,20,0.25)]'
                    : 'bg-white/[0.05] text-white/35',
                )}
              >
                <CatIcon className="h-4 w-4" aria-hidden />
              </span>
            )
          })}
        </div>

        <button
          type="button"
          onClick={onWrite}
          disabled={!allReady || disabled}
          title={writeTitle}
          className={cn(
            'mt-4 flex h-12 w-full items-center justify-center gap-2 rounded-full text-[15px] font-semibold transition-transform active:scale-[0.98] md:mx-auto md:w-[320px]',
            allReady && !disabled
              ? 'bg-[#39FF14] text-black shadow-[0_0_24px_rgba(57,255,20,0.4)]'
              : 'cursor-not-allowed bg-white/[0.07] text-white/45',
          )}
        >
          <Sparkles className="h-4 w-4" />
          Write My Life Vision
        </button>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div className="min-w-0 flex-1">
        <div className="flex items-baseline gap-2">
          <h1 className="text-base font-semibold text-white">Your Life Vision</h1>
          <span className="text-xs text-neutral-500">
            {`${ready} of ${total} ready`}
          </span>
        </div>
        <div className="mt-2 grid grid-cols-12 gap-1" aria-hidden="true">
          {lifeCategories.map((c) => {
            const isReady = readyKeys.has(c.key as LifeCategoryKey)
            return (
              <span
                key={c.key}
                title={c.label}
                className={`h-1.5 rounded-full transition-colors ${
                  isReady ? 'bg-[#39FF14]' : 'bg-[#2a2a2a]'
                }`}
              />
            )
          })}
        </div>
      </div>
      <Button
        variant="primary"
        size="sm"
        disabled={!allReady || disabled}
        onClick={onWrite}
        title={
          allReady
            ? 'VIVA writes all 12 areas from your words'
            : pendingLabels?.length
              ? `Still needs more: ${pendingLabels.join(', ')}`
              : `${total - ready} ${total - ready === 1 ? 'area' : 'areas'} still need more`
        }
        className="shrink-0"
      >
        <Sparkles className="mr-1.5 h-4 w-4" />
        Write My Life Vision
      </Button>
    </div>
  )
}
