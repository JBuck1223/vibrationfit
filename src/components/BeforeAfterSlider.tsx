'use client'

import { useState, useRef, useCallback, useEffect } from 'react'
import { ArrowLeftRight } from 'lucide-react'

interface BeforeAfterSliderProps {
  beforeSrc: string
  afterSrc: string
  className?: string
  /** When true, contains images within parent and constrains slider to image bounds */
  fill?: boolean
}

export function BeforeAfterSlider({
  beforeSrc,
  afterSrc,
  className = '',
  fill = false,
}: BeforeAfterSliderProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const afterImgRef = useRef<HTMLImageElement>(null)
  const [position, setPosition] = useState(50)
  const isDragging = useRef(false)
  const didDrag = useRef(false)
  const [imgBounds, setImgBounds] = useState<{ left: number; width: number } | null>(null)

  const computeImgBounds = useCallback(() => {
    if (!fill || !afterImgRef.current || !containerRef.current) {
      setImgBounds(null)
      return
    }
    const img = afterImgRef.current
    const container = containerRef.current
    if (!img.naturalWidth || !img.naturalHeight) return

    const containerRect = container.getBoundingClientRect()
    const containerW = containerRect.width
    const containerH = containerRect.height
    const imgRatio = img.naturalWidth / img.naturalHeight
    const containerRatio = containerW / containerH

    let renderedW: number
    if (imgRatio > containerRatio) {
      renderedW = containerW
    } else {
      renderedW = containerH * imgRatio
    }
    const offsetLeft = (containerW - renderedW) / 2
    setImgBounds({ left: offsetLeft, width: renderedW })
  }, [fill])

  useEffect(() => {
    if (!fill) return
    computeImgBounds()
    window.addEventListener('resize', computeImgBounds)
    return () => window.removeEventListener('resize', computeImgBounds)
  }, [fill, computeImgBounds])

  const updatePosition = useCallback((clientX: number) => {
    const container = containerRef.current
    if (!container) return
    const rect = container.getBoundingClientRect()

    if (fill && imgBounds) {
      const x = clientX - rect.left - imgBounds.left
      const pct = Math.max(0, Math.min(100, (x / imgBounds.width) * 100))
      setPosition(pct)
    } else {
      const x = clientX - rect.left
      const pct = Math.max(0, Math.min(100, (x / rect.width) * 100))
      setPosition(pct)
    }
  }, [fill, imgBounds])

  const handleRef = useRef<HTMLDivElement>(null)

  const handlePointerDown = useCallback((e: React.PointerEvent) => {
    e.preventDefault()
    e.stopPropagation()
    isDragging.current = true
    didDrag.current = false
    handleRef.current?.setPointerCapture(e.pointerId)
  }, [])

  const handlePointerMove = useCallback((e: React.PointerEvent) => {
    if (!isDragging.current) return
    e.preventDefault()
    e.stopPropagation()
    didDrag.current = true
    updatePosition(e.clientX)
  }, [updatePosition])

  const handlePointerUp = useCallback((e: React.PointerEvent) => {
    e.stopPropagation()
    isDragging.current = false
  }, [])

  const handleClick = useCallback((e: React.MouseEvent) => {
    if (didDrag.current) {
      e.stopPropagation()
      e.preventDefault()
    }
    didDrag.current = false
  }, [])

  const containerWidth = containerRef.current?.getBoundingClientRect().width ?? 0

  let sliderLeftPx: number | null = null
  let clipRightPct = 100 - position

  if (fill && imgBounds && containerWidth > 0) {
    sliderLeftPx = imgBounds.left + (position / 100) * imgBounds.width
    clipRightPct = ((containerWidth - sliderLeftPx) / containerWidth) * 100
  }

  return (
    <div
      ref={containerRef}
      className={`relative select-none overflow-hidden ${className}`}
      onClick={handleClick}
    >
      {/* After image (full, bottom layer) */}
      <img
        ref={afterImgRef}
        src={afterSrc}
        alt=""
        className={fill ? 'w-full h-full object-contain block' : 'w-full h-auto object-cover block'}
        draggable={false}
        onLoad={computeImgBounds}
      />

      {/* Before image (clipped, top layer) */}
      <img
        src={beforeSrc}
        alt=""
        className={fill ? 'absolute inset-0 w-full h-full object-contain' : 'absolute inset-0 w-full h-full object-cover'}
        draggable={false}
        style={{ clipPath: `inset(0 ${clipRightPct}% 0 0)` }}
      />

      {/* Slider drag zone — wide invisible hit area for easy grabbing */}
      <div
        ref={handleRef}
        className="absolute top-0 bottom-0 z-10"
        style={{
          left: sliderLeftPx !== null ? `${sliderLeftPx}px` : `${position}%`,
          transform: 'translateX(-50%)',
          width: '44px',
          touchAction: 'none',
          cursor: 'col-resize',
        }}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
      >
        {/* Visible line */}
        <div className="absolute left-1/2 -translate-x-1/2 top-0 bottom-0 w-0.5 bg-purple-500 pointer-events-none" />
        {/* Visible handle circle */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-purple-500 flex items-center justify-center shadow-lg shadow-purple-500/40 border-2 border-white/30 pointer-events-none">
          <ArrowLeftRight className="w-4 h-4 text-white" />
        </div>
      </div>
    </div>
  )
}
