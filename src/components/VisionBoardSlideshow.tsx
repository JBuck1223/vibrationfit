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
  SlidersHorizontal,
  CheckCircle,
} from 'lucide-react'
import { useInShell } from '@/lib/app-shell/shell-context'

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
const CROSSFADE_MS = 800

interface SlideLayer {
  key: number
  url: string
  alt: string
  /** Alternates per slide to vary the Ken Burns pan direction */
  parity: number
  /** Ken Burns duration is frozen at layer creation so speed changes don't restart the motion */
  motionDurationSec: number
  state: 'in' | 'out'
}

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
  const [layers, setLayers] = useState<SlideLayer[]>([])
  const inShell = useInShell()
  // Shell, phones: speed, shuffle, captions and motion live in one options sheet.
  const [optionsOpen, setOptionsOpen] = useState(false)

  const containerRef = useRef<HTMLDivElement>(null)
  const hideControlsTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const touchStartX = useRef<number | null>(null)
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
    setLayers([])
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen])

  const currentSlide = slides[order[pos]] ?? null

  // Slide layers: the outgoing layer keeps its React key (and DOM node) so its
  // Ken Burns animation continues uninterrupted while it fades out underneath
  // the incoming layer — otherwise the image snaps back to its starting scale.
  useEffect(() => {
    if (!isOpen || !currentSlide) return
    setLayers((prev) => {
      const top = prev[prev.length - 1]
      if (top && top.state === 'in' && top.url === currentSlide.url) return prev
      slideKeyCounter.current += 1
      return [
        ...prev.map((layer) => ({ ...layer, state: 'out' as const })),
        {
          key: slideKeyCounter.current,
          url: currentSlide.url,
          alt: currentSlide.item.name,
          parity: slideKeyCounter.current % 2,
          motionDurationSec: Math.max(intervalSec, 4) + 2,
          state: 'in' as const,
        },
      ]
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, currentSlide])

  // Cull faded-out layers once the crossfade completes
  useEffect(() => {
    if (!layers.some((layer) => layer.state === 'out')) return
    const timer = setTimeout(() => {
      setLayers((prev) => prev.filter((layer) => layer.state !== 'out'))
    }, CROSSFADE_MS + 50)
    return () => clearTimeout(timer)
  }, [layers])

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
      setOptionsOpen(false)
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

  if (inShell) {
    const glass = 'border border-white/[0.14] bg-[rgba(28,22,38,0.62)] backdrop-blur-2xl backdrop-saturate-150'
    const iconBtn = (on = false) =>
      `flex h-10 w-10 items-center justify-center rounded-full transition-colors ${on ? 'bg-[rgba(57,255,20,0.16)] text-[#39FF14]' : 'text-white/80 hover:bg-white/10 hover:text-white'}`
    const fade = controlsVisible ? 'opacity-100' : 'opacity-0 pointer-events-none'
    const options = [
      { key: 'shuffle', label: 'Shuffle', icon: Shuffle, on: shuffled, toggle: toggleShuffle },
      { key: 'captions', label: 'Captions', icon: Type, on: showCaptions, toggle: () => setShowCaptions((c) => !c) },
      { key: 'motion', label: 'Motion', icon: Film, on: motionEnabled, toggle: () => setMotionEnabled((m) => !m) },
    ]
    const speedChips = (
      <div className="flex flex-wrap gap-1.5">
        {SPEED_OPTIONS.map((option) => (
          <button
            key={option.seconds}
            type="button"
            onClick={() => { setIntervalSec(option.seconds); setSpeedMenuOpen(false); wakeControls() }}
            className={`rounded-full border px-3 py-1.5 text-xs font-medium transition-colors ${
              intervalSec === option.seconds
                ? 'border-[#39FF14] bg-[rgba(57,255,20,0.16)] text-[#39FF14]'
                : 'border-white/15 bg-white/[0.05] text-white/80 hover:text-white'
            }`}
          >
            {option.label} <span className="opacity-60">{option.seconds}s</span>
          </button>
        ))}
      </div>
    )

    return createPortal(
      <div
        ref={containerRef}
        className="fixed inset-0 z-[500] flex select-none items-center justify-center overflow-hidden bg-[#0b0910]"
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
          @keyframes vb-slideshow-fade-in { from { opacity: 0; } to { opacity: 1; } }
          @keyframes vb-slideshow-fade-out { from { opacity: 1; } to { opacity: 0; } }
          @keyframes vb-slideshow-kenburns-a { from { transform: scale(1) translate(0, 0); } to { transform: scale(1.08) translate(-1%, 1%); } }
          @keyframes vb-slideshow-kenburns-b { from { transform: scale(1.08) translate(1%, -1%); } to { transform: scale(1) translate(0, 0); } }
          @keyframes vb-slideshow-progress { from { transform: scaleX(0); } to { transform: scaleX(1); } }
        `}</style>

        {slides.length === 0 ? (
          <div className={`mx-6 max-w-sm rounded-[26px] p-6 text-center ${glass}`}>
            <Film className="mx-auto mb-3 h-10 w-10 text-white/40" />
            <p className="text-sm text-white/70">No images to play yet. Add creations with images to your board first.</p>
            <button
              type="button"
              onClick={handleClose}
              className="mt-5 rounded-full bg-[#39FF14] px-6 py-2.5 text-sm font-semibold text-black"
            >
              Close
            </button>
          </div>
        ) : (
          <>
            {/* Each slide: a soft blurred wash of the image fills the screen,
                with the whole image on top, so nothing reads as black bars. */}
            <div className="absolute inset-0">
              {layers.map((layer) => (
                <div
                  key={layer.key}
                  className="absolute inset-0"
                  style={{
                    animationName: layer.state === 'in' ? 'vb-slideshow-fade-in' : 'vb-slideshow-fade-out',
                    animationDuration: `${CROSSFADE_MS}ms`,
                    animationTimingFunction: 'ease',
                    animationFillMode: 'both',
                  }}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={layer.url} alt="" aria-hidden className="absolute inset-0 h-full w-full scale-110 object-cover opacity-55 blur-3xl saturate-150" />
                  <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_35%,rgba(11,9,16,0.75)_100%)]" />
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={layer.url}
                    alt={layer.alt}
                    className="absolute inset-0 h-full w-full object-contain"
                    style={
                      motionEnabled
                        ? {
                            animationName: layer.parity === 0 ? 'vb-slideshow-kenburns-a' : 'vb-slideshow-kenburns-b',
                            animationDuration: `${layer.motionDurationSec}s`,
                            animationTimingFunction: 'ease-out',
                            animationFillMode: 'both',
                            animationPlayState: playing ? 'running' : 'paused',
                          }
                        : undefined
                    }
                  />
                </div>
              ))}
            </div>

            {/* Top: time left on this slide, the count, and close. */}
            <div
              className={`absolute inset-x-0 top-0 px-4 transition-opacity duration-300 ${fade}`}
              style={{ paddingTop: 'calc(env(safe-area-inset-top, 0px) + 12px)' }}
            >
              {slides.length > 1 && (
                <div className="mb-3 h-[3px] overflow-hidden rounded-full bg-white/15">
                  <div
                    key={`${pos}-${intervalSec}-${order[pos]}`}
                    className="h-full origin-left rounded-full bg-[#39FF14]"
                    style={{
                      animationName: 'vb-slideshow-progress',
                      animationDuration: `${intervalSec}s`,
                      animationTimingFunction: 'linear',
                      animationFillMode: 'both',
                      animationPlayState: playing ? 'running' : 'paused',
                    }}
                  />
                </div>
              )}
              <div className="flex items-center justify-between">
                <span className={`rounded-full px-3 py-1.5 text-xs font-medium tabular-nums text-white/85 ${glass}`}>
                  {pos + 1} of {slides.length}
                </span>
                <button type="button" onClick={handleClose} aria-label="Close slideshow" className={`flex h-10 w-10 items-center justify-center rounded-full text-white/85 hover:text-white ${glass}`}>
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>

            {/* Side arrows on larger screens; phones swipe. */}
            {slides.length > 1 && (
              <>
                <button
                  type="button"
                  onClick={() => { goPrev(); wakeControls() }}
                  aria-label="Previous"
                  className={`absolute left-6 top-1/2 hidden h-12 w-12 -translate-y-1/2 items-center justify-center rounded-full text-white/80 transition-opacity duration-300 hover:text-white md:flex ${glass} ${fade}`}
                >
                  <ChevronLeft className="h-6 w-6" />
                </button>
                <button
                  type="button"
                  onClick={() => { goNext(); wakeControls() }}
                  aria-label="Next"
                  className={`absolute right-6 top-1/2 hidden h-12 w-12 -translate-y-1/2 items-center justify-center rounded-full text-white/80 transition-opacity duration-300 hover:text-white md:flex ${glass} ${fade}`}
                >
                  <ChevronRight className="h-6 w-6" />
                </button>
              </>
            )}

            {/* Bottom: caption over a soft fade, then the controls. */}
            <div
              className="pointer-events-none absolute inset-x-0 bottom-0 bg-gradient-to-t from-[#0b0910]/90 via-[#0b0910]/45 to-transparent px-5 pt-28 md:px-12"
              style={{ paddingBottom: 'calc(env(safe-area-inset-bottom, 0px) + 92px)' }}
            >
              {showCaptions && currentSlide && (
                <div className="mx-auto max-w-3xl text-center">
                  {currentSlide.item.status === 'actualized' && (
                    <span className="mb-2 inline-flex items-center gap-1 rounded-full bg-[rgba(191,0,255,0.25)] px-2.5 py-0.5 text-xs font-medium text-[#e2b3ff]">
                      <CheckCircle className="h-3 w-3" /> Actualized
                    </span>
                  )}
                  <h3 className="text-2xl font-bold leading-tight text-white drop-shadow-lg md:text-4xl">{currentSlide.item.name}</h3>
                  {currentSlide.item.description && (
                    <p className="mx-auto mt-2 max-w-2xl text-sm leading-relaxed text-white/75 line-clamp-3 drop-shadow md:text-base">
                      {currentSlide.item.description}
                    </p>
                  )}
                </div>
              )}
            </div>

            <div
              className={`absolute inset-x-0 bottom-0 flex justify-center px-4 transition-all duration-300 ${controlsVisible ? 'translate-y-0 opacity-100' : 'pointer-events-none translate-y-2 opacity-0'}`}
              style={{ paddingBottom: 'calc(env(safe-area-inset-bottom, 0px) + 20px)' }}
            >
              <div className={`relative flex items-center gap-1 rounded-full px-2 py-1.5 shadow-[0_16px_40px_rgba(0,0,0,0.45)] ${glass}`}>
                <button type="button" onClick={() => { goPrev(); wakeControls() }} aria-label="Previous" className={iconBtn()}>
                  <ChevronLeft className="h-5 w-5" />
                </button>
                <button
                  type="button"
                  onClick={() => { setPlaying((p) => !p); wakeControls() }}
                  aria-label={playing ? 'Pause' : 'Play'}
                  className="flex h-12 w-12 items-center justify-center rounded-full bg-[#39FF14] text-black shadow-[0_0_18px_rgba(57,255,20,0.4)] transition-transform active:scale-95"
                >
                  {playing ? <Pause className="h-5 w-5" fill="currentColor" /> : <Play className="ml-0.5 h-5 w-5" fill="currentColor" />}
                </button>
                <button type="button" onClick={() => { goNext(); wakeControls() }} aria-label="Next" className={iconBtn()}>
                  <ChevronRight className="h-5 w-5" />
                </button>

                <div className="mx-1 h-6 w-px bg-white/15" />

                {/* Phones: one options button. */}
                <button
                  type="button"
                  onClick={() => { setOptionsOpen((o) => !o); wakeControls() }}
                  aria-label="Slideshow options"
                  aria-expanded={optionsOpen}
                  className={`${iconBtn(optionsOpen)} md:hidden`}
                >
                  <SlidersHorizontal className="h-5 w-5" />
                </button>

                {/* Larger screens: every option inline. */}
                <div className="relative hidden md:block">
                  <button
                    type="button"
                    onClick={() => { setSpeedMenuOpen((o) => !o); wakeControls() }}
                    aria-label="Slideshow speed"
                    className={`${iconBtn(speedMenuOpen)} w-auto gap-1.5 px-3`}
                  >
                    <Gauge className="h-5 w-5" />
                    <span className="text-xs font-semibold tabular-nums">{intervalSec}s</span>
                  </button>
                  {speedMenuOpen && (
                    <div className={`absolute bottom-full left-1/2 mb-3 w-[300px] -translate-x-1/2 rounded-[20px] p-3 shadow-2xl ${glass} bg-[rgba(28,22,38,0.92)]`}>
                      <p className="mb-2 text-xs font-medium text-white/55">Time on each slide</p>
                      {speedChips}
                    </div>
                  )}
                </div>
                {options.map((o) => {
                  const OptionIcon = o.icon
                  return (
                    <button
                      key={o.key}
                      type="button"
                      onClick={() => { o.toggle(); wakeControls() }}
                      aria-label={o.label}
                      aria-pressed={o.on}
                      title={o.label}
                      className={`${iconBtn(o.on)} hidden md:flex`}
                    >
                      <OptionIcon className="h-5 w-5" />
                    </button>
                  )
                })}
                <button
                  type="button"
                  onClick={() => { toggleFullscreen(); wakeControls() }}
                  aria-label={isFullscreen ? 'Exit fullscreen' : 'Enter fullscreen'}
                  className={`${iconBtn()} hidden md:flex`}
                >
                  {isFullscreen ? <Minimize className="h-5 w-5" /> : <Maximize className="h-5 w-5" />}
                </button>

                {optionsOpen && (
                  <div className={`absolute bottom-full left-1/2 mb-3 w-[min(calc(100vw-2rem),340px)] -translate-x-1/2 rounded-[22px] p-4 shadow-2xl md:hidden ${glass} bg-[rgba(28,22,38,0.92)]`}>
                    <p className="mb-2 text-xs font-medium text-white/55">Time on each slide</p>
                    {speedChips}
                    <div className="mt-4 grid grid-cols-3 gap-2">
                      {options.map((o) => {
                        const OptionIcon = o.icon
                        return (
                          <button
                            key={o.key}
                            type="button"
                            onClick={() => { o.toggle(); wakeControls() }}
                            aria-pressed={o.on}
                            className={`flex flex-col items-center gap-1 rounded-2xl border px-2 py-2.5 text-xs transition-colors ${
                              o.on ? 'border-[#39FF14] bg-[rgba(57,255,20,0.12)] text-[#39FF14]' : 'border-white/15 text-white/75'
                            }`}
                          >
                            <OptionIcon className="h-4 w-4" />
                            {o.label}
                          </button>
                        )
                      })}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </>
        )}
      </div>,
      document.body
    )
  }

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
          {/* Slide layers: the outgoing image fades out underneath the incoming one */}
          <div className="absolute inset-0 overflow-hidden">
            {layers.map((layer) => (
              <div
                key={layer.key}
                className="absolute inset-0"
                style={{
                  animationName: layer.state === 'in' ? 'vb-slideshow-fade-in' : 'vb-slideshow-fade-out',
                  animationDuration: `${CROSSFADE_MS}ms`,
                  animationTimingFunction: 'ease',
                  animationFillMode: 'both',
                }}
              >
                <img
                  src={layer.url}
                  alt={layer.alt}
                  className="w-full h-full object-contain"
                  style={
                    motionEnabled
                      ? {
                          animationName: layer.parity === 0 ? 'vb-slideshow-kenburns-a' : 'vb-slideshow-kenburns-b',
                          animationDuration: `${layer.motionDurationSec}s`,
                          animationTimingFunction: 'ease-out',
                          animationFillMode: 'both',
                          animationPlayState: playing ? 'running' : 'paused',
                        }
                      : undefined
                  }
                />
              </div>
            ))}
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
