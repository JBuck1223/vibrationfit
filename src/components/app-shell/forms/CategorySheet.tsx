'use client'

import React from 'react'
import { createPortal } from 'react-dom'
import { cn } from '@/lib/utils'
import { VISION_CATEGORIES } from '@/lib/design-system/vision-categories'

export const LIFE_CATEGORIES = VISION_CATEGORIES.filter((c) => c.key !== 'forward' && c.key !== 'conclusion')

/**
 * The life-categories picker as a glass sheet (a centered card on desktop).
 * Used to tag a new entry and to filter the journal list.
 */
export function CategorySheet({
  open,
  onClose,
  selected,
  onToggle,
  title = 'Life categories',
  onClear,
}: {
  open: boolean
  onClose: () => void
  selected: string[]
  onToggle: (key: string) => void
  title?: string
  /** Shows a "Clear" action when given and something is selected. */
  onClear?: () => void
}) {
  React.useEffect(() => {
    if (!open) return
    const esc = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    document.addEventListener('keydown', esc)
    return () => document.removeEventListener('keydown', esc)
  }, [open, onClose])

  if (!open || typeof document === 'undefined') return null
  // Portaled to <body>: a blurred (glass) parent would otherwise trap the fixed sheet.
  return createPortal(
    <div className="fixed inset-0 z-[80] flex items-end justify-center bg-black/55 md:items-center" onClick={onClose}>
      <div
        role="dialog"
        aria-label={title}
        onClick={(e) => e.stopPropagation()}
        className="vf-glass w-full max-w-lg rounded-t-[26px] border border-white/[0.14] bg-[rgba(28,22,38,0.97)] p-5 pb-[calc(1.25rem+env(safe-area-inset-bottom,0px))] backdrop-blur-2xl md:rounded-[26px]"
      >
        <div className="mx-auto mb-3 h-1 w-9 rounded-full bg-white/25 md:hidden" />
        <div className="mb-3 flex items-center justify-between">
          <p className="text-base font-semibold text-white">{title}</p>
          {onClear && selected.length > 0 ? (
            <button type="button" onClick={onClear} className="text-sm text-white/60 hover:text-white">
              Clear
            </button>
          ) : null}
        </div>
        <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
          {LIFE_CATEGORIES.map((category) => {
            const isOn = selected.includes(category.key)
            const Icon = category.icon
            return (
              <button
                key={category.key}
                type="button"
                aria-pressed={isOn}
                onClick={() => onToggle(category.key)}
                className={cn(
                  'flex flex-col items-center gap-1 rounded-2xl border px-1 py-2.5 text-xs transition-colors',
                  isOn ? 'border-[#39FF14] bg-[rgba(57,255,20,0.12)] text-[#39FF14]' : 'border-white/15 text-white/80 hover:text-white',
                )}
              >
                {Icon ? <Icon className="h-4 w-4" aria-hidden /> : null}
                {category.label}
              </button>
            )
          })}
        </div>
        <button
          type="button"
          onClick={onClose}
          className="mt-4 h-11 w-full rounded-full bg-white/10 text-sm font-medium text-white hover:bg-white/15"
        >
          Done
        </button>
      </div>
    </div>,
    document.body,
  )
}
