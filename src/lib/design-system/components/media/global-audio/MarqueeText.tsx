'use client'

import React, { createContext, useCallback, useContext, useEffect, useId, useMemo, useRef, useState } from 'react'
import { cn } from '../../shared-utils'

// Tuned to feel like Apple Music / Spotify: a long rest, then a slow, steady
// glide left that loops seamlessly into a second copy of the text.
const SPEED_PX_PER_SEC = 24
const START_PAUSE_MS = 3000
const GAP_PX = 48
const EDGE_FADE = 'linear-gradient(to right, #000 calc(100% - 24px), transparent)'

type MarqueeGroupValue = {
  report: (key: string, distance: number) => void
  maxDistance: number
  epoch: number | null
}

const MarqueeGroupContext = createContext<MarqueeGroupValue | null>(null)

/**
 * Keeps several MarqueeText lines (a title and its subtitle) in step: they
 * start together, move at the same pace and share one loop length, so the
 * shorter line finishes and waits for the longer one.
 */
export function MarqueeGroup({ children }: { children: React.ReactNode }) {
  const [distances, setDistances] = useState<Record<string, number>>({})
  const report = useCallback((key: string, distance: number) => {
    setDistances((prev) => (prev[key] === distance ? prev : { ...prev, [key]: distance }))
  }, [])
  const maxDistance = Math.max(0, ...Object.values(distances))
  // A shared start time on the document timeline, renewed whenever the loop changes.
  const epoch = useMemo(
    () => (typeof document === 'undefined' ? null : Number(document.timeline.currentTime ?? 0)),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [maxDistance]
  )
  const value = useMemo(() => ({ report, maxDistance, epoch }), [report, maxDistance, epoch])
  return <MarqueeGroupContext.Provider value={value}>{children}</MarqueeGroupContext.Provider>
}

/**
 * One line of text that, while `active`, scrolls left to reveal what doesn't
 * fit — so a long title can be read in full while it plays. When inactive (or
 * under reduced motion) it truncates with an ellipsis as usual.
 */
export function MarqueeText({
  children,
  active,
  className,
  title,
}: {
  children: React.ReactNode
  active: boolean
  className?: string
  title?: string
}) {
  const outerRef = useRef<HTMLSpanElement>(null)
  const trackRef = useRef<HTMLSpanElement>(null)
  const copyRef = useRef<HTMLSpanElement>(null)
  // How far one loop travels (text width + gap); 0 when the text fits.
  const [distance, setDistance] = useState(0)
  const group = useContext(MarqueeGroupContext)
  const groupKey = useId()
  const report = group?.report

  useEffect(() => {
    report?.(groupKey, distance)
  }, [report, groupKey, distance])
  useEffect(() => () => report?.(groupKey, 0), [report, groupKey])

  useEffect(() => {
    const outer = outerRef.current
    const copy = copyRef.current
    if (!active || !outer || !copy) {
      setDistance(0)
      return
    }
    if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return
    const measure = () => {
      const width = copy.offsetWidth
      setDistance(width - outer.clientWidth > 1 ? width + GAP_PX : 0)
    }
    measure()
    const ro = new ResizeObserver(measure)
    ro.observe(outer)
    ro.observe(copy)
    return () => ro.disconnect()
  }, [active])

  const groupMax = group?.maxDistance ?? 0
  const epoch = group?.epoch ?? null

  useEffect(() => {
    const track = trackRef.current
    if (!active || !distance || !track) return
    const travel = (distance / SPEED_PX_PER_SEC) * 1000
    const loopDistance = Math.max(distance, groupMax)
    const total = START_PAUSE_MS + (loopDistance / SPEED_PX_PER_SEC) * 1000
    const end = `translateX(${-distance}px)`
    // Holding at the end looks the same as the start: the second copy sits where the first began.
    const anim = track.animate(
      [
        { transform: 'translateX(0)', offset: 0 },
        { transform: 'translateX(0)', offset: START_PAUSE_MS / total },
        { transform: end, offset: (START_PAUSE_MS + travel) / total },
        { transform: end, offset: 1 },
      ],
      { duration: total, iterations: Infinity, easing: 'linear' }
    )
    if (epoch !== null) anim.startTime = epoch
    return () => anim.cancel()
  }, [active, distance, groupMax, epoch])

  const scrolling = active && distance > 0

  return (
    <span
      ref={outerRef}
      className={cn('block overflow-hidden', className)}
      title={title}
      style={scrolling ? { maskImage: EDGE_FADE, WebkitMaskImage: EDGE_FADE } : undefined}
    >
      <span ref={trackRef} className={active ? 'inline-flex whitespace-nowrap' : 'block truncate'}>
        <span ref={copyRef} className={active ? 'inline-block' : undefined}>{children}</span>
        {scrolling && (
          <span aria-hidden className="inline-block" style={{ paddingLeft: GAP_PX }}>
            {children}
          </span>
        )}
      </span>
    </span>
  )
}
