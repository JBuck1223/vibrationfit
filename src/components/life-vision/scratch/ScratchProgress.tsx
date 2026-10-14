'use client'

/**
 * Header for Start From Scratch: title, "n of 12 ready", a 12-cell bar, and
 * the Write My Life Vision button in the slot Commit as Active uses on the
 * update page.
 */

import { Loader2, Sparkles } from 'lucide-react'
import { Button } from '@/lib/design-system/components'
import { ORDERED_VISION_CATEGORIES, type LifeCategoryKey } from '@/lib/design-system/vision-categories'

interface ScratchProgressProps {
  readyKeys: Set<LifeCategoryKey>
  total: number
  composing: boolean
  composedCount: number
  onWrite: () => void
  disabled?: boolean
}

export function ScratchProgress({
  readyKeys,
  total,
  composing,
  composedCount,
  onWrite,
  disabled,
}: ScratchProgressProps) {
  const ready = readyKeys.size
  const allReady = ready >= total
  const lifeCategories = ORDERED_VISION_CATEGORIES.filter(
    (c) => c.key !== 'forward' && c.key !== 'conclusion',
  )

  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div className="min-w-0 flex-1">
        <div className="flex items-baseline gap-2">
          <h1 className="text-base font-semibold text-white">Your Life Vision</h1>
          <span className="text-xs text-neutral-500">
            {composing
              ? `Writing ${total} areas from your words — ${composedCount} done`
              : `${ready} of ${total} ready`}
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
        disabled={!allReady || composing || disabled}
        onClick={onWrite}
        title={allReady ? 'VIVA writes all 12 areas from your words' : `${total - ready} ${total - ready === 1 ? 'area' : 'areas'} still need both parts`}
        className="shrink-0"
      >
        {composing
          ? <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />
          : <Sparkles className="mr-1.5 h-4 w-4" />}
        {composing ? 'Writing…' : 'Write My Life Vision'}
      </Button>
    </div>
  )
}
