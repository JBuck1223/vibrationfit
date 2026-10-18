'use client'

import type { ComponentType, ReactNode } from 'react'
import Link from 'next/link'
import { ArrowRight, ChevronLeft, ChevronRight, EyeOff, GripVertical, Pin, PinOff } from 'lucide-react'
import type { LucideProps } from 'lucide-react'
import { Spinner } from '@/lib/design-system/components'
import { cn } from '@/lib/utils'
import { WIDGET_SIZE_META, adjacentWidgetSize, type WidgetSize } from '@/lib/dashboard/widgets/registry'

export interface WidgetChromeProps {
  size: WidgetSize
  customizing: boolean
  pinned?: boolean
  onHide?: () => void
  onResize?: (next: WidgetSize) => void
  onTogglePin?: () => void
  dragHandleRef?: (el: HTMLElement | null) => void
  dragHandleProps?: Record<string, unknown>
}

interface WidgetFrameProps extends WidgetChromeProps {
  title: string
  icon: ComponentType<LucideProps>
  accent?: string
  href?: string
  hrefLabel?: string
  loading?: boolean
  children: ReactNode
  className?: string
  /** Remove inner padding for edge-to-edge content (images, heatmaps). */
  flush?: boolean
}

/**
 * Consistent card chrome for every dashboard widget: title row, deep link,
 * customize controls (drag handle, hide, size), skeleton state.
 */
export function WidgetFrame({
  title,
  icon: Icon,
  accent = '#39FF14',
  href,
  hrefLabel = 'Open',
  loading,
  children,
  className,
  flush,
  size,
  customizing,
  pinned,
  onHide,
  onResize,
  onTogglePin,
  dragHandleRef,
  dragHandleProps,
}: WidgetFrameProps) {
  const narrower = adjacentWidgetSize(size, -1)
  const wider = adjacentWidgetSize(size, 1)

  return (
    <section
      aria-label={title}
      className={cn(
        'flex h-full min-h-[180px] flex-col overflow-hidden rounded-2xl border-2 border-[#333] bg-[#1F1F1F] transition-colors',
        customizing && 'border-dashed border-neutral-600',
        className,
      )}
    >
      <header className="flex items-center gap-2 border-b border-white/[0.06] px-4 py-3">
        {customizing ? (
          <button
            type="button"
            ref={dragHandleRef}
            {...dragHandleProps}
            aria-label={`Move ${title}`}
            className="-ml-1 cursor-grab touch-none rounded-md p-1 text-neutral-500 hover:bg-white/5 hover:text-white active:cursor-grabbing"
          >
            <GripVertical className="h-4 w-4" />
          </button>
        ) : null}
        <span
          className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg"
          style={{ backgroundColor: `${accent}1A`, color: accent }}
        >
          <Icon className="h-4 w-4" />
        </span>
        <h2 className="min-w-0 flex-1 truncate text-sm font-semibold text-white">{title}</h2>

        {customizing ? (
          <div className="flex items-center gap-0.5">
            {onTogglePin ? (
              <button
                type="button"
                onClick={onTogglePin}
                aria-pressed={Boolean(pinned)}
                aria-label={pinned ? `Unpin ${title}` : `Pin ${title} to the top`}
                title={pinned ? 'Unpin' : 'Pin to top'}
                className={cn(
                  'rounded-md p-1.5 hover:bg-white/5',
                  pinned ? 'text-primary-500 hover:text-primary-400' : 'text-neutral-400 hover:text-white',
                )}
              >
                {pinned ? <PinOff className="h-4 w-4" /> : <Pin className="h-4 w-4" />}
              </button>
            ) : null}
            {onResize ? (
              <div
                role="group"
                aria-label={`${title} width`}
                className="mr-1 inline-flex items-center rounded-md border border-white/10 bg-black/30"
              >
                <button
                  type="button"
                  onClick={() => narrower && onResize(narrower)}
                  disabled={!narrower}
                  aria-label={`Make ${title} narrower`}
                  className="rounded-l-md p-1 text-neutral-400 hover:bg-white/5 hover:text-white disabled:cursor-not-allowed disabled:opacity-30 disabled:hover:bg-transparent"
                >
                  <ChevronLeft className="h-3.5 w-3.5" />
                </button>
                <span className="min-w-[2.25rem] px-1 text-center text-[11px] font-semibold tabular-nums text-neutral-200">
                  {WIDGET_SIZE_META[size].label}
                </span>
                <button
                  type="button"
                  onClick={() => wider && onResize(wider)}
                  disabled={!wider}
                  aria-label={`Make ${title} wider`}
                  className="rounded-r-md p-1 text-neutral-400 hover:bg-white/5 hover:text-white disabled:cursor-not-allowed disabled:opacity-30 disabled:hover:bg-transparent"
                >
                  <ChevronRight className="h-3.5 w-3.5" />
                </button>
              </div>
            ) : null}
            {onHide ? (
              <button
                type="button"
                onClick={onHide}
                aria-label={`Hide ${title}`}
                className="rounded-md p-1.5 text-neutral-400 hover:bg-white/5 hover:text-white"
              >
                <EyeOff className="h-4 w-4" />
              </button>
            ) : null}
          </div>
        ) : href ? (
          <Link
            href={href}
            className="inline-flex items-center gap-1 text-xs font-medium text-neutral-400 transition-colors hover:text-white"
          >
            {hrefLabel}
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        ) : null}
      </header>

      <div className={cn('relative flex min-h-0 flex-1 flex-col', flush ? '' : 'p-4')}>
        {loading ? (
          <div className="flex flex-1 items-center justify-center py-8">
            <Spinner size="sm" />
          </div>
        ) : (
          children
        )}
      </div>
    </section>
  )
}

/** Small helper for consistent empty states inside a widget. */
export function WidgetEmpty({
  title,
  body,
  action,
}: {
  title: string
  body?: string
  action?: ReactNode
}) {
  return (
    <div className="flex flex-1 flex-col items-start justify-center gap-2 py-2">
      <p className="text-sm font-medium text-white">{title}</p>
      {body ? <p className="text-xs leading-relaxed text-neutral-400">{body}</p> : null}
      {action ? <div className="pt-1">{action}</div> : null}
    </div>
  )
}

/** Stat chip used across widgets. */
export function WidgetStat({
  label,
  value,
  hint,
}: {
  label: string
  value: ReactNode
  hint?: string
}) {
  return (
    <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] px-3 py-2">
      <p className="text-[10px] font-medium uppercase tracking-wider text-neutral-500">{label}</p>
      <p className="mt-0.5 text-lg font-semibold tabular-nums text-white">{value}</p>
      {hint ? <p className="text-[11px] text-neutral-500">{hint}</p> : null}
    </div>
  )
}
