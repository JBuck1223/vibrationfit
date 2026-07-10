'use client'

import { useState, useEffect, useMemo, useRef, useCallback } from 'react'
import { createPortal } from 'react-dom'
import {
  Play,
  Pause,
  ChevronLeft,
  ChevronRight,
  X,
  Shuffle,
  Type,
  Maximize,
  Minimize,
  Gauge,
  Film,
} from 'lucide-react'

export interface SlideshowItem {
  id: string
  name: string
  description?: string | null
  image_url?: string | null
  actualized_image_url?: string | null
  status?: string
}

interface VisionBoardSlideshowProps {
  items: SlideshowItem[]
  isOpen: boolean
  onClose: () => void
  startIndex?: number
}

const SPEED_OPTIONS = [
  { label: 'Fast', seconds: 3 },
  { label: 'Normal', seconds: 5 },
  { label: 'Relaxed', seconds: 8 },
  { label: 'Slow', seconds: 12 },
  { label: 'Meditative', seconds: 20 },
]

const CONTROLS_HIDE_DELAY_MS = 3000

function getSlideImageUrl(item: SlideshowItem): string | null {
  if (item.status === 'actualized' && item.actualized_image_url) {
    return item.actualized_image_url
  }
  return item.image_url || null
}

function shuffleOrder(length: number, keepFirst: number): number[] {
  const rest: number[] = []
  for (let i = 0; i < length; i++) {
    if (i !== keepFirst) rest.push(i)
  }
  for (let i = rest.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[rest[i], rest[j]] = [rest[j], rest[i]]
  }
  return [keepFirst, ...rest]
}

export function VisionBoardSlideshow({
  items,
  isOpen,
  onClose,
  startIndex = 0,
}: VisionBoardSlideshowProps) {
  // Only items that actually have an image can be shown as slides
  const slides = useMemo(
    () =>
      items
        .map((item) => ({ item, url: getSlideImageUrl(item) }))
        .filter((s): s is { item: SlideshowItem; url: string } => Boolean(s.url)),
    [items]
  )

  const [order, setOrder] = useState<number[]>([])
  const [pos, setPos] = useState(0)
  const [playing, setPlaying] = useState(true)
  const [intervalSec, setIntervalSec] = useState(5)
  const [shuffled, setShuffled] = useState(false)
  const [showCaptions, setShowCaptions] = useState(true)
  const [motionEnabled, setMotionEnabled] = useState(true)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [controlsVisible, setControlsVisible] = useState(true)
  const [speedMenuOpen, setSpeedMenuOpen] = useState(false)
  const [prevSlideKey, setPrevSlideKey] = useState<{ url: string; key: number } | null>(null)

  const containerRef = useRef<HTMLDivElement>(null)
  const hideControlsTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const touchStartX = useRef<number | null>(null)
  const lastShownUrl = useRef<string | null>(null)
  const slideKeyCounter = useRef(0)

  // Reset state each time the slideshow opens
  useEffect(() => {
    if (!isOpen) return
    const clampedStart = Math.min(Math.max(startIndex, 0), Math.max(slides.length - 1, 0))
    setOrder(Array.from({ length: slides.length }, (_, i) => i))
    setPos(clampedStart)
    setPlaying(true)
    setShuffled(false)
    setControlsVisible(true)
    setSpeedMenuOpen(false)
    setPrevSlideKey(null)
    lastShownUrl.current = null
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen])

  const currentSlide = slides[order[pos]] ?? null

  // Track the previous image so we can crossfade between slides
  useEffect(() => {
    if (!currentSlide) return
    if (lastShownUrl.current && lastShownUrl.current !== currentSlide.url) {
      slideKeyCounter.current += 1
      setPrevSlideKey({ url: lastShownUrl.current, key: slideKeyCounter.current })
    }
    lastShownUrl.current = currentSlide.url
  }, [currentSlide])

  const goNext = useCallback(() => {
    setPos((p) => (slides.length ? (p + 1) % slides.length : 0))
  }, [slides.length])

  const goPrev = useCallback(() => {
    setPos((p) => (slides.length ? (p - 1 + slides.length) % slides.length : 0))
  }, [slides.length])

  // Autoplay timer
  useEffect(() => {
    if (!isOpen || !playing || slides.length <= 1) return
    const timer = setTimeout(goNext, intervalSec * 1000)
    return () => clearTimeout(timer)
  }, [isOpen, playing, intervalSec, pos, order, slides.length, goNext])

  // Preload the next image so transitions are seamless
  useEffect(() => {
    if (!isOpen || slides.length <= 1) return
    const nextSlide = slides[order[(pos + 1) % slides.length]]
    if (nextSlide) {
      const img = new Image()
      img.src = nextSlide.url
    }
  }, [isOpen, pos, order, slides])

  // Lock body scroll while open
  useEffect(() => {
    if (!isOpen) return
    const previous = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = previous
    }
  }, [isOpen])

  const wakeControls = useCallback(() => {
    setControlsVisible(true)
    if (hideControlsTimer.current) clearTimeout(hideControlsTimer.current)
    hideControlsTimer.current = setTimeout(() => {
      setControlsVisible(false)
      setSpeedMenuOpen(false)
    }, CONTROLS_HIDE_DELAY_MS)
  }, [])

  useEffect(() => {
    if (!isOpen) return
    wakeControls()
    return () => {
      if (hideControlsTimer.current) clearTimeout(hideControlsTimer.current)
    }
  }, [isOpen, wakeControls])

  const handleClose = useCallback(() => {
    if (document.fullscreenElement) {
      document.exitFullscreen().catch(() => {})
    }
    onClose()
  }, [onClose])

  // Keyboard controls
  useEffect(() => {
    if (!isOpen) return
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        // In browser fullscreen, Escape exits fullscreen natively; don't also close
        if (document.fullscreenElement) return
        handleClose()
      } else if (e.key === 'ArrowRight') {
        goNext()
        wakeControls()
      } else if (e.key === 'ArrowLeft') {
        goPrev()
        wakeControls()
      } else if (e.key === ' ') {
        e.preventDefault()
        setPlaying((p) => !p)
        wakeControls()
      } else if (e.key === 'f' || e.key === 'F') {
        toggleFullscreen()
      }
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, goNext, goPrev, handleClose, wakeControls])

  // Track browser fullscreen state
  useEffect(() => {
    const handleChange = () => setIsFullscreen(Boolean(document.fullscreenElement))
    document.addEventListener('fullscreenchange', handleChange)
    return () => document.removeEventListener('fullscreenchange', handleChange)
  }, [])

  const toggleFullscreen = () => {
    if (document.fullscreenElement) {
      document.exitFullscreen().catch(() => {})
    } else {
      containerRef.current?.requestFullscreen().catch(() => {})
    }
  }

  const toggleShuffle = () => {
    setShuffled((wasShuffled) => {
      const currentSlideIndex = order[pos] ?? 0
      if (wasShuffled) {
        // Restore sequential order, keeping the current slide in place
        setOrder(Array.from({ length: slides.length }, (_, i) => i))
        setPos(currentSlideIndex)
      } else {
        setOrder(shuffleOrder(slides.length, currentSlideIndex))
        setPos(0)
      }
      return !wasShuffled
    })
  }

  if (!isOpen || typeof document === 'undefined') return null

  const controlButtonClass =
    'p-2.5 rounded-full text-white/70 hover:text-white hover:bg-white/10 transition-colors'
  const activeControlButtonClass =
    'p-2.5 rounded-full bg-[#39FF14]/20 text-[#39FF14] transition-colors'

  return createPortal(
    <div
      ref={containerRef}
      className="fixed inset-0 z-[500] bg-black flex items-center justify-center select-none"
      onMouseMove={wakeControls}
      onTouchStart={(e) => {
        wakeControls()
        touchStartX.current = e.touches[0].clientX
      }}
      onTouchEnd={(e) => {
        if (touchStartX.current === null) return
        const delta = e.changedTouches[0].clientX - touchStartX.current
        if (Math.abs(delta) > 50) {
          delta < 0 ? goNext() : goPrev()
        }
        touchStartX.current = null
      }}
      style={{ cursor: controlsVisible ? 'default' : 'none' }}
    >
      <style>{`
        @keyframes vb-slideshow-fade-in {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes vb-slideshow-fade-out {
          from { opacity: 1; }
          to { opacity: 0; }
        }
        @keyframes vb-slideshow-kenburns-a {
          from { transform: scale(1) translate(0, 0); }
          to { transform: scale(1.08) translate(-1%, 1%); }
        }
        @keyframes vb-slideshow-kenburns-b {
          from { transform: scale(1.08) translate(1%, -1%); }
          to { transform: scale(1) translate(0, 0); }
        }
        @keyframes vb-slideshow-progress {
          from { width: 0%; }
          to { width: 100%; }
        }
      `}</style>

      {slides.length === 0 ? (
        <div className="text-center px-6">
          <Film className="w-12 h-12 text-neutral-700 mx-auto mb-4" />
          <p className="text-neutral-400">No images to play. Add creations with images to your board first.</p>
          <button
            onClick={handleClose}
            className="mt-6 px-6 py-2.5 rounded-full bg-neutral-800 text-white hover:bg-neutral-700 transition-colors"
          >
            Close
          </button>
        </div>
      ) : (
        <>
          {/* Slide layers: previous image fades out underneath the incoming one */}
          <div className="absolute inset-0 overflow-hidden">
            {prevSlideKey && (
              <img
                key={`prev-${prevSlideKey.key}`}
                src={prevSlideKey.url}
                alt=""
                className="absolute inset-0 w-full h-full object-contain"
                style={{ animation: 'vb-slideshow-fade-out 800ms ease forwards' }}
              />
            )}
            {currentSlide && (
              <div
                key={`slide-${order[pos]}-${pos}`}
                className="absolute inset-0"
                style={{ animation: 'vb-slideshow-fade-in 800ms ease both' }}
              >
                <img
                  src={currentSlide.url}
                  alt={currentSlide.item.name}
                  className="w-full h-full object-contain"
                  style={
                    motionEnabled
                      ? {
                          animation: `${pos % 2 === 0 ? 'vb-slideshow-kenburns-a' : 'vb-slideshow-kenburns-b'} ${Math.max(intervalSec, 4) + 2}s ease-out both`,
                          animationPlayState: playing ? 'running' : 'paused',
                        }
                      : undefined
                  }
                />
              </div>
            )}
          </div>

          {/* Caption overlay */}
          {showCaptions && currentSlide && (
            <div
              className={`absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/85 via-black/40 to-transparent pt-24 pb-20 px-6 md:px-12 transition-opacity duration-500 pointer-events-none ${
                controlsVisible ? 'opacity-100' : 'opacity-90'
              }`}
            >
              <h3 className="text-white text-xl md:text-3xl font-bold drop-shadow-lg max-w-3xl">
                {currentSlide.item.name}
              </h3>
              {currentSlide.item.description && (
                <p className="text-white/70 text-sm md:text-base mt-1.5 max-w-2xl line-clamp-2 drop-shadow">
                  {currentSlide.item.description}
                </p>
              )}
            </div>
          )}

          {/* Progress bar for current slide */}
          {playing && slides.length > 1 && (
            <div className="absolute top-0 left-0 right-0 h-0.5 bg-white/10">
              <div
                key={`progress-${pos}-${intervalSec}`}
                className="h-full bg-[#39FF14]"
                style={{ animation: `vb-slideshow-progress ${intervalSec}s linear both` }}
              />
            </div>
          )}

          {/* Top bar: counter + close */}
          <div
            className={`absolute top-0 left-0 right-0 flex items-center justify-between px-4 pt-3 transition-opacity duration-300 ${
              controlsVisible ? 'opacity-100' : 'opacity-0 pointer-events-none'
            }`}
          >
            <span className="text-xs text-white/50 font-medium px-2">
              {pos + 1} / {slides.length}
            </span>
            <button
              onClick={handleClose}
              className="p-2.5 rounded-full bg-black/40 backdrop-blur-sm text-white/70 hover:text-white hover:bg-white/10 transition-colors"
              aria-label="Close slideshow"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Side navigation arrows */}
          {slides.length > 1 && (
            <>
              <button
                onClick={() => { goPrev(); wakeControls() }}
                className={`absolute left-2 md:left-6 top-1/2 -translate-y-1/2 p-2.5 rounded-full bg-black/40 backdrop-blur-sm text-white/50 hover:text-white hover:bg-white/10 transition-all duration-300 ${
                  controlsVisible ? 'opacity-100' : 'opacity-0 pointer-events-none'
                }`}
                aria-label="Previous"
              >
                <ChevronLeft className="w-6 h-6" />
              </button>
              <button
                onClick={() => { goNext(); wakeControls() }}
                className={`absolute right-2 md:right-6 top-1/2 -translate-y-1/2 p-2.5 rounded-full bg-black/40 backdrop-blur-sm text-white/50 hover:text-white hover:bg-white/10 transition-all duration-300 ${
                  controlsVisible ? 'opacity-100' : 'opacity-0 pointer-events-none'
                }`}
                aria-label="Next"
              >
                <ChevronRight className="w-6 h-6" />
              </button>
            </>
          )}

          {/* Bottom control bar */}
          <div
            className={`absolute bottom-4 left-1/2 -translate-x-1/2 transition-all duration-300 ${
              controlsVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2 pointer-events-none'
            }`}
          >
            <div className="relative flex items-center gap-1 md:gap-1.5 px-3 py-2 rounded-full bg-black/60 backdrop-blur-md border border-white/10 shadow-2xl">
              <button
                onClick={() => { goPrev(); wakeControls() }}
                className={controlButtonClass}
                aria-label="Previous"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>

              <button
                onClick={() => { setPlaying((p) => !p); wakeControls() }}
                className="p-3 rounded-full bg-[#39FF14] text-black hover:bg-[#2FE60F] transition-colors shadow-lg"
                aria-label={playing ? 'Pause' : 'Play'}
              >
                {playing ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5 ml-0.5" />}
              </button>

              <button
                onClick={() => { goNext(); wakeControls() }}
                className={controlButtonClass}
                aria-label="Next"
              >
                <ChevronRight className="w-5 h-5" />
              </button>

              <div className="w-px h-6 bg-white/15 mx-1" />

              {/* Speed selector */}
              <div className="relative">
                <button
                  onClick={() => { setSpeedMenuOpen((o) => !o); wakeControls() }}
                  className={`${speedMenuOpen ? activeControlButtonClass : controlButtonClass} flex items-center gap-1.5`}
                  aria-label="Slideshow speed"
                >
                  <Gauge className="w-5 h-5" />
                  <span className="text-xs font-semibold tabular-nums">{intervalSec}s</span>
                </button>
                {speedMenuOpen && (
                  <div className="absolute bottom-full mb-3 left-1/2 -translate-x-1/2 min-w-[160px] rounded-2xl bg-neutral-900 border border-white/10 shadow-2xl p-1.5">
                    <p className="text-[10px] uppercase tracking-wider text-neutral-500 font-semibold px-3 pt-1.5 pb-1">
                      Speed per slide
                    </p>
                    {SPEED_OPTIONS.map((option) => (
                      <button
                        key={option.seconds}
                        onClick={() => { setIntervalSec(option.seconds); setSpeedMenuOpen(false); wakeControls() }}
                        className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-sm transition-colors ${
                          intervalSec === option.seconds
                            ? 'bg-[#39FF14]/15 text-[#39FF14] font-semibold'
                            : 'text-neutral-300 hover:bg-white/5 hover:text-white'
                        }`}
                      >
                        <span>{option.label}</span>
                        <span className="text-xs tabular-nums opacity-70">{option.seconds}s</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <button
                onClick={() => { toggleShuffle(); wakeControls() }}
                className={shuffled ? activeControlButtonClass : controlButtonClass}
                aria-label={shuffled ? 'Disable shuffle' : 'Enable shuffle'}
              >
                <Shuffle className="w-5 h-5" />
              </button>

              <button
                onClick={() => { setShowCaptions((c) => !c); wakeControls() }}
                className={showCaptions ? activeControlButtonClass : controlButtonClass}
                aria-label={showCaptions ? 'Hide captions' : 'Show captions'}
              >
                <Type className="w-5 h-5" />
              </button>

              <button
                onClick={() => { setMotionEnabled((m) => !m); wakeControls() }}
                className={motionEnabled ? activeControlButtonClass : controlButtonClass}
                aria-label={motionEnabled ? 'Disable motion effect' : 'Enable motion effect'}
              >
                <Film className="w-5 h-5" />
              </button>

              <div className="w-px h-6 bg-white/15 mx-1" />

              <button
                onClick={() => { toggleFullscreen(); wakeControls() }}
                className={controlButtonClass}
                aria-label={isFullscreen ? 'Exit fullscreen' : 'Enter fullscreen'}
              >
                {isFullscreen ? <Minimize className="w-5 h-5" /> : <Maximize className="w-5 h-5" />}
              </button>
            </div>
          </div>
        </>
      )}
    </div>,
    document.body
  )
}
