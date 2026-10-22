'use client'

import React from 'react'
import { createPortal } from 'react-dom'
import { CalendarDays, ChevronLeft, ChevronRight } from 'lucide-react'
import { cn } from '@/lib/utils'

const DAY = ['S', 'M', 'T', 'W', 'T', 'F', 'S']
const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']

/** YYYY-MM-DD in local time. */
function toKey(d: Date) {
  return d.toLocaleDateString('en-CA')
}
function fromKey(key: string) {
  const [y, m, d] = key.split('-').map(Number)
  return new Date(y, (m || 1) - 1, d || 1)
}
function addDays(d: Date, n: number) {
  const c = new Date(d)
  c.setDate(c.getDate() + n)
  return c
}

/** "Today", "Yesterday", or "Mon, Oct 3" (with the year when it isn't this year). */
export function friendlyDate(key: string) {
  if (!key) return 'Pick a date'
  const today = new Date()
  if (key === toKey(today)) return 'Today'
  if (key === toKey(addDays(today, -1))) return 'Yesterday'
  const d = fromKey(key)
  return d.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    ...(d.getFullYear() !== today.getFullYear() ? { year: 'numeric' } : {}),
  })
}

/**
 * App-style date field: shows "Today" / "Yesterday" / a short date, and opens
 * a glass sheet (a centered card on desktop) with quick picks and a big
 * calendar you can swipe between months. Future days are off by default.
 */
export function DateSheetField({
  value,
  onChange,
  allowFuture = false,
  className,
}: {
  value: string
  onChange: (value: string) => void
  allowFuture?: boolean
  className?: string
}) {
  const [open, setOpen] = React.useState(false)
  const [month, setMonth] = React.useState(() => (value ? fromKey(value) : new Date()))
  const [pickingYear, setPickingYear] = React.useState(false)
  const touchX = React.useRef<number | null>(null)
  const todayKey = toKey(new Date())

  React.useEffect(() => {
    if (open) {
      setMonth(value ? fromKey(value) : new Date())
      setPickingYear(false)
    }
  }, [open, value])

  React.useEffect(() => {
    if (!open) return
    const esc = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false)
    document.addEventListener('keydown', esc)
    return () => document.removeEventListener('keydown', esc)
  }, [open])

  const pick = (key: string) => {
    onChange(key)
    setOpen(false)
  }
  const shiftMonth = (n: number) => setMonth((m) => new Date(m.getFullYear(), m.getMonth() + n, 1))

  const first = new Date(month.getFullYear(), month.getMonth(), 1)
  const daysInMonth = new Date(month.getFullYear(), month.getMonth() + 1, 0).getDate()
  const cells: (number | null)[] = [...Array(first.getDay()).fill(null), ...Array.from({ length: daysInMonth }, (_, i) => i + 1)]
  const thisYear = new Date().getFullYear()
  const years = Array.from({ length: 8 }, (_, i) => thisYear - 6 + i).filter((y) => allowFuture || y <= thisYear)
  const canGoForward = allowFuture || new Date(month.getFullYear(), month.getMonth() + 1, 1) <= new Date()

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={cn('flex items-center gap-1.5 text-xs text-white/65 hover:text-white', className)}
      >
        <CalendarDays className="h-3.5 w-3.5" />
        {friendlyDate(value)}
      </button>

      {/* Portaled to <body>: a blurred (glass) parent would otherwise trap the fixed sheet. */}
      {open && typeof document !== 'undefined' ? createPortal(
        <div className="fixed inset-0 z-[80] flex items-end justify-center bg-black/55 md:items-center" onClick={() => setOpen(false)}>
          <div
            role="dialog"
            aria-label="Choose a date"
            onClick={(e) => e.stopPropagation()}
            onTouchStart={(e) => (touchX.current = e.touches[0].clientX)}
            onTouchEnd={(e) => {
              if (touchX.current === null || pickingYear) return
              const dx = e.changedTouches[0].clientX - touchX.current
              touchX.current = null
              if (dx > 50) shiftMonth(-1)
              else if (dx < -50 && canGoForward) shiftMonth(1)
            }}
            className="vf-glass w-full max-w-sm rounded-t-[26px] border border-white/[0.14] bg-[rgba(28,22,38,0.97)] p-5 pb-[calc(1.25rem+env(safe-area-inset-bottom,0px))] backdrop-blur-2xl md:rounded-[26px]"
          >
            <div className="mx-auto mb-4 h-1 w-9 rounded-full bg-white/25 md:hidden" />
            <div className="mb-4 grid grid-cols-2 gap-2">
              {[
                { label: 'Today', key: todayKey },
                { label: 'Yesterday', key: toKey(addDays(new Date(), -1)) },
              ].map((q) => (
                <button
                  key={q.label}
                  type="button"
                  onClick={() => pick(q.key)}
                  className={cn(
                    'h-10 rounded-full text-sm font-semibold transition-colors',
                    value === q.key ? 'bg-[#39FF14] text-black' : 'border border-white/20 text-white/85 hover:text-white',
                  )}
                >
                  {q.label}
                </button>
              ))}
            </div>

            <div className="mb-3 flex items-center justify-between">
              <button type="button" onClick={() => shiftMonth(-1)} aria-label="Previous month" className="flex h-9 w-9 items-center justify-center rounded-full text-white/75 hover:bg-white/10">
                <ChevronLeft className="h-5 w-5" />
              </button>
              <button type="button" onClick={() => setPickingYear((p) => !p)} className="rounded-full px-3 py-1 text-[15px] font-semibold text-white hover:bg-white/10">
                {MONTHS[month.getMonth()]} {month.getFullYear()}
              </button>
              <button
                type="button"
                onClick={() => shiftMonth(1)}
                disabled={!canGoForward}
                aria-label="Next month"
                className="flex h-9 w-9 items-center justify-center rounded-full text-white/75 hover:bg-white/10 disabled:opacity-30"
              >
                <ChevronRight className="h-5 w-5" />
              </button>
            </div>

            {pickingYear ? (
              <div className="grid grid-cols-4 gap-2">
                {years.map((y) => (
                  <button
                    key={y}
                    type="button"
                    onClick={() => {
                      setMonth(new Date(y, allowFuture || y < thisYear ? month.getMonth() : Math.min(month.getMonth(), new Date().getMonth()), 1))
                      setPickingYear(false)
                    }}
                    className={cn(
                      'h-10 rounded-xl text-sm transition-colors',
                      y === month.getFullYear() ? 'bg-[rgba(57,255,20,0.16)] text-[#39FF14]' : 'text-white/85 hover:bg-white/10',
                    )}
                  >
                    {y}
                  </button>
                ))}
              </div>
            ) : (
              <>
                <div className="mb-1 grid grid-cols-7 text-center text-[11px] text-white/45">
                  {DAY.map((d, i) => (
                    <span key={i}>{d}</span>
                  ))}
                </div>
                <div className="grid grid-cols-7 gap-y-1 text-center">
                  {cells.map((day, i) => {
                    if (!day) return <span key={i} />
                    const key = toKey(new Date(month.getFullYear(), month.getMonth(), day))
                    const future = !allowFuture && key > todayKey
                    const selected = key === value
                    return (
                      <button
                        key={i}
                        type="button"
                        disabled={future}
                        onClick={() => pick(key)}
                        className={cn(
                          'mx-auto flex h-10 w-10 items-center justify-center rounded-full text-sm transition-colors',
                          selected ? 'bg-[#39FF14] font-semibold text-black' : key === todayKey ? 'border border-[#39FF14]/60 text-white' : 'text-white/90 hover:bg-white/10',
                          future && 'text-white/25 hover:bg-transparent',
                        )}
                      >
                        {day}
                      </button>
                    )
                  })}
                </div>
              </>
            )}
          </div>
        </div>,
        document.body,
      ) : null}
    </>
  )
}
