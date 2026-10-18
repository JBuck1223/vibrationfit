'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { ArrowLeftRight } from 'lucide-react'

interface BeforeAfterSliderProps {
  beforeSrc: string
  afterSrc: string
  className?: string
  /** Cap the photo to the viewport. Used by the fullscreen viewer. */
  fill?: boolean
  /** Fill the column width. Used on the board so photos stay inside their masonry column. */
  stretch?: boolean
  /** Unused. Kept so existing call sites still type-check. */
  contain?: boolean
}

/** Aspects within this factor can share a slider without cropping a slice or letterboxing. */
const SIMILAR_ASPECT = 1.2

function useImageRatio(src: string): number | null {
  const [ratio, setRatio] = useState<number | null>(null)

  useEffect(() => {
    let cancelled = false
    const img = new Image()
    img.onload = () => {
      if (cancelled || !img.naturalWidth || !img.naturalHeight) return
      setRatio(img.naturalWidth / img.naturalHeight)
    }
    img.src = src
    return () => {
      cancelled = true
    }
  }, [src])

  return ratio
}

function aspectsMatch(beforeRatio: number | null, afterRatio: number | null): boolean {
  if (!beforeRatio || !afterRatio) return false
  const wider = Math.max(beforeRatio, afterRatio)
  const narrower = Math.min(beforeRatio, afterRatio)
  return wider / narrower <= SIMILAR_ASPECT
}

/**
 * Photos with a similar shape share a drag slider.
 * When one is wide and the other is tall, show one photo at a time in its own shape
 * so neither is cropped into a slice or letterboxed inside the other.
 */
export function BeforeAfterSlider({
  beforeSrc,
  afterSrc,
  className = '',
  fill = false,
  stretch = false,
}: BeforeAfterSliderProps) {
  const beforeRatio = useImageRatio(beforeSrc)
  const afterRatio = useImageRatio(afterSrc)
  const [showing, setShowing] = useState<'before' | 'after'>('after')

  if (aspectsMatch(beforeRatio, afterRatio)) {
    return (
      <MatchedSlider
        beforeSrc={beforeSrc}
        afterSrc={afterSrc}
        className={className}
        fill={fill}
        stretch={stretch}
      />
    )
  }

  const src = showing === 'before' ? beforeSrc : afterSrc
  const limit = fill
    ? 'max-h-[95vh] max-w-[95vw]'
    : stretch
      ? 'w-full'
      : 'max-h-[inherit] max-w-full'

  return (
    <div className={`relative max-w-full ${stretch ? 'w-full' : 'w-fit'} ${className}`}>
      <img
        src={src}
        alt=""
        draggable={false}
        className={`block h-auto ${stretch ? 'w-full' : 'w-auto'} ${limit}`}
        style={{ imageOrientation: 'from-image' }}
      />
      {beforeRatio != null && afterRatio != null && (
        <div
          className="absolute bottom-3 left-1/2 z-10 flex -translate-x-1/2 gap-1 rounded-full bg-black/60 p-1"
          onClick={(event) => event.stopPropagation()}
          onPointerDown={(event) => event.stopPropagation()}
        >
          <FrameButton active={showing === 'before'} onClick={() => setShowing('before')}>
            Vision
          </FrameButton>
          <FrameButton active={showing === 'after'} onClick={() => setShowing('after')}>
            Actualized
          </FrameButton>
        </div>
      )}
    </div>
  )
}

function FrameButton({
  active,
  onClick,
  children,
}: {
  active: boolean
  onClick: () => void
  children: string
}) {
  return (
    <button
      type="button"
      onClick={(event) => {
        event.stopPropagation()
        onClick()
      }}
      className={`rounded-full px-3 py-1 text-[11px] font-medium ${
        active ? 'bg-white text-black' : 'text-white/80 hover:text-white'
      }`}
    >
      {children}
    </button>
  )
}

function MatchedSlider({
  beforeSrc,
  afterSrc,
  className,
  fill,
  stretch,
}: {
  beforeSrc: string
  afterSrc: string
  className: string
  fill: boolean
  stretch: boolean
}) {
  const containerRef = useRef<HTMLDivElement>(null)
  const handleRef = useRef<HTMLDivElement>(null)
  const [position, setPosition] = useState(50)
  const isDragging = useRef(false)
  const didDrag = useRef(false)
  const limit = fill
    ? 'max-h-[95vh] max-w-[95vw]'
    : stretch
      ? 'w-full'
      : 'max-h-[inherit] max-w-full'

  const updatePosition = useCallback((clientX: number) => {
    const container = containerRef.current
    if (!container) return
    const rect = container.getBoundingClientRect()
    if (rect.width <= 0) return
    const pct = Math.max(0, Math.min(100, ((clientX - rect.left) / rect.width) * 100))
    setPosition(pct)
  }, [])

  const handlePointerDown = useCallback((event: React.PointerEvent) => {
    event.preventDefault()
    event.stopPropagation()
    isDragging.current = true
    didDrag.current = false
    handleRef.current?.setPointerCapture(event.pointerId)
    updatePosition(event.clientX)
  }, [updatePosition])

  const handlePointerMove = useCallback((event: React.PointerEvent) => {
    if (!isDragging.current) return
    event.preventDefault()
    event.stopPropagation()
    didDrag.current = true
    updatePosition(event.clientX)
  }, [updatePosition])

  const handlePointerUp = useCallback((event: React.PointerEvent) => {
    event.stopPropagation()
    isDragging.current = false
  }, [])

  return (
    <div
      ref={containerRef}
      className={`relative max-w-full select-none overflow-hidden ${stretch ? 'w-full' : 'w-fit'} ${className}`}
      onClick={(event) => {
        if (!didDrag.current) return
        event.stopPropagation()
        event.preventDefault()
        didDrag.current = false
      }}
    >
      <img
        src={afterSrc}
        alt=""
        draggable={false}
        className={`block h-auto ${stretch ? 'w-full' : 'w-auto'} ${limit}`}
        style={{ imageOrientation: 'from-image' }}
      />
      <img
        src={beforeSrc}
        alt=""
        draggable={false}
        className="pointer-events-none absolute inset-0 h-full w-full object-cover"
        style={{
          imageOrientation: 'from-image',
          clipPath: `inset(0 ${100 - position}% 0 0)`,
        }}
      />
      <div
        ref={handleRef}
        className="absolute bottom-0 top-0 z-10"
        style={{
          left: `${position}%`,
          transform: 'translateX(-50%)',
          width: '44px',
          touchAction: 'none',
          cursor: 'col-resize',
        }}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
      >
        <div className="pointer-events-none absolute bottom-0 left-1/2 top-0 w-0.5 -translate-x-1/2 bg-purple-500" />
        <div className="pointer-events-none absolute left-1/2 top-1/2 flex h-9 w-9 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border-2 border-white/30 bg-purple-500 shadow-lg shadow-purple-500/40">
          <ArrowLeftRight className="h-4 w-4 text-white" />
        </div>
      </div>
    </div>
  )
}
