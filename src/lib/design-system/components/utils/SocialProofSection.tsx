'use client'

import React, { useState, useEffect, useCallback, useRef } from 'react'
import { ChevronLeft, ChevronRight, X, Star } from 'lucide-react'
import { cn } from '../shared-utils'
import { Video } from '../media/Video'

// ============================================================================
// SOCIAL PROOF SECTION — Cinematic Video + Scrolling Testimonial Strip
// ============================================================================

const MARQUEE_CSS = `
@keyframes vf-scroll-left {
  from { transform: translateX(0); }
  to { transform: translateX(-50%); }
}
`

export interface SocialProofVideo {
  id: string
  src: string
  poster?: string
  caption?: string
  label?: string
}

export interface ScreenshotTestimonial {
  id: string
  src: string
  alt: string
  caption?: string
  name?: string
}

export interface SocialProofSectionProps extends React.HTMLAttributes<HTMLDivElement> {
  videos: SocialProofVideo[]
  screenshots: ScreenshotTestimonial[]
  eyebrow?: string
  title?: string
  subtitle?: string
  microcopy?: string
  videoTitle?: string
  screenshotTitle?: string
  autoPlay?: boolean
  autoPlayInterval?: number
  accentColor?: string
  className?: string
}

export const SocialProofSection = React.forwardRef<HTMLDivElement, SocialProofSectionProps>(
  (
    {
      videos,
      screenshots,
      eyebrow,
      title,
      subtitle,
      microcopy,
      videoTitle = 'See It in Action',
      screenshotTitle = 'Unedited Member Messages',
      autoPlay = false,
      autoPlayInterval = 8000,
      accentColor = '#39FF14',
      className = '',
      ...props
    },
    ref
  ) => {
    const [currentVideoIndex, setCurrentVideoIndex] = useState(0)
    const [isVideoAnimating, setIsVideoAnimating] = useState(false)
    const [lightboxOpen, setLightboxOpen] = useState(false)
    const [lightboxIndex, setLightboxIndex] = useState(0)
    const [isPaused, setIsPaused] = useState(false)
    const [isScrollPaused, setIsScrollPaused] = useState(false)
    const touchStartX = useRef(0)
    const touchEndX = useRef(0)

    const totalVideos = videos.length

    useEffect(() => {
      if (typeof document === 'undefined') return
      const id = 'vf-social-proof-scroll-css'
      if (document.getElementById(id)) return
      const style = document.createElement('style')
      style.id = id
      style.textContent = MARQUEE_CSS
      document.head.appendChild(style)
      return () => { document.getElementById(id)?.remove() }
    }, [])

    const goToVideo = useCallback(
      (index: number) => {
        if (isVideoAnimating || totalVideos <= 1) return
        setIsVideoAnimating(true)
        setCurrentVideoIndex(((index % totalVideos) + totalVideos) % totalVideos)
        setTimeout(() => setIsVideoAnimating(false), 500)
      },
      [isVideoAnimating, totalVideos]
    )

    const nextVideo = useCallback(() => goToVideo(currentVideoIndex + 1), [currentVideoIndex, goToVideo])
    const prevVideo = useCallback(() => goToVideo(currentVideoIndex - 1), [currentVideoIndex, goToVideo])

    useEffect(() => {
      if (!autoPlay || isPaused || totalVideos <= 1) return
      const interval = setInterval(nextVideo, autoPlayInterval)
      return () => clearInterval(interval)
    }, [autoPlay, autoPlayInterval, isPaused, totalVideos, nextVideo])

    const handleTouchStart = (e: React.TouchEvent) => { touchStartX.current = e.touches[0].clientX }
    const handleTouchMove = (e: React.TouchEvent) => { touchEndX.current = e.touches[0].clientX }
    const handleTouchEnd = () => {
      const diff = touchStartX.current - touchEndX.current
      if (Math.abs(diff) > 50) diff > 0 ? nextVideo() : prevVideo()
    }

    const openLightbox = (index: number) => { setLightboxIndex(index); setLightboxOpen(true) }
    const closeLightbox = () => setLightboxOpen(false)
    const lightboxNext = () => setLightboxIndex(p => (p + 1) % screenshots.length)
    const lightboxPrev = () => setLightboxIndex(p => (p - 1 + screenshots.length) % screenshots.length)

    useEffect(() => {
      if (!lightboxOpen) return
      const handleKey = (e: KeyboardEvent) => {
        if (e.key === 'Escape') closeLightbox()
        if (e.key === 'ArrowRight') lightboxNext()
        if (e.key === 'ArrowLeft') lightboxPrev()
      }
      document.addEventListener('keydown', handleKey)
      return () => document.removeEventListener('keydown', handleKey)
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [lightboxOpen, screenshots.length])

    if (videos.length === 0 && screenshots.length === 0) return null

    const duplicatedScreenshots = [...screenshots, ...screenshots]

    return (
      <>
        <div ref={ref} className={cn('w-full relative', className)} {...props}>
          {/* Ambient glow */}
          <div className="absolute inset-0 pointer-events-none overflow-hidden" aria-hidden="true">
            <div
              className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[500px] rounded-full blur-[160px]"
              style={{ background: accentColor, opacity: 0.05 }}
            />
          </div>

          <div className="relative z-10 space-y-10 md:space-y-14">
            {/* ─── HEADER ─── */}
            {(eyebrow || title || subtitle) && (
              <div className="text-center space-y-3 px-4">
                {eyebrow && (
                  <p
                    className="text-xs font-bold tracking-[0.2em] uppercase"
                    style={{ color: accentColor }}
                  >
                    {eyebrow}
                  </p>
                )}
                {title && (
                  <h2 className="text-3xl md:text-5xl lg:text-6xl font-bold text-white tracking-tight leading-tight">
                    {title}
                  </h2>
                )}
                {subtitle && (
                  <p className="text-neutral-400 max-w-2xl mx-auto text-base md:text-lg leading-relaxed">
                    {subtitle}
                  </p>
                )}
              </div>
            )}

            {/* ─── CINEMATIC VIDEO SECTION ─── */}
            {videos.length > 0 && (
              <div
                className="w-full max-w-4xl mx-auto px-4"
                onMouseEnter={() => setIsPaused(true)}
                onMouseLeave={() => setIsPaused(false)}
              >
                <div className="relative">
                  <div
                    className="overflow-hidden rounded-2xl"
                    onTouchStart={handleTouchStart}
                    onTouchMove={handleTouchMove}
                    onTouchEnd={handleTouchEnd}
                  >
                    <div
                      className="flex transition-transform duration-500 ease-out"
                      style={{ transform: `translateX(-${currentVideoIndex * 100}%)` }}
                    >
                      {videos.map((video) => (
                        <div key={video.id} className="w-full flex-shrink-0">
                          <Video
                            src={video.src}
                            poster={video.poster}
                            variant="default"
                            className="w-full"
                          />
                        </div>
                      ))}
                    </div>
                  </div>

                  {totalVideos > 1 && (
                    <>
                      <button
                        onClick={prevVideo}
                        className="absolute left-2 md:left-3 top-1/2 -translate-y-1/2 z-10 w-10 h-10 flex items-center justify-center rounded-full transition-all duration-300 hover:scale-110 bg-black/70 backdrop-blur-md border"
                        style={{ borderColor: `${accentColor}40` }}
                        aria-label="Previous video"
                      >
                        <ChevronLeft className="w-5 h-5" style={{ color: accentColor }} />
                      </button>
                      <button
                        onClick={nextVideo}
                        className="absolute right-2 md:right-3 top-1/2 -translate-y-1/2 z-10 w-10 h-10 flex items-center justify-center rounded-full transition-all duration-300 hover:scale-110 bg-black/70 backdrop-blur-md border"
                        style={{ borderColor: `${accentColor}40` }}
                        aria-label="Next video"
                      >
                        <ChevronRight className="w-5 h-5" style={{ color: accentColor }} />
                      </button>
                    </>
                  )}
                </div>

                {totalVideos > 1 && (
                  <div className="flex items-center justify-center gap-2 mt-3">
                    {videos.map((video, index) => {
                      const isActive = index === currentVideoIndex
                      return (
                        <button
                          key={video.id}
                          onClick={() => goToVideo(index)}
                          className="transition-all duration-300 rounded-full"
                          style={{
                            width: isActive ? '1.5rem' : '0.5rem',
                            height: '0.5rem',
                            backgroundColor: isActive ? accentColor : '#4B5563',
                            boxShadow: isActive ? `0 0 8px ${accentColor}60` : 'none',
                          }}
                          aria-label={video.label || `Video ${index + 1}`}
                        />
                      )
                    })}
                  </div>
                )}
              </div>
            )}

            {/* ─── SCROLLING SCREENSHOT STRIP ─── */}
            {screenshots.length > 0 && (
              <div className="space-y-6">
                {screenshotTitle && (
                  <div className="flex items-center justify-center gap-4 px-4">
                    <div
                      className="h-px flex-1 max-w-[100px]"
                      style={{ background: `linear-gradient(to right, transparent, ${accentColor}25)` }}
                    />
                    <div className="flex items-center gap-2.5">
                      <Star className="w-3.5 h-3.5" style={{ color: accentColor }} fill={accentColor} />
                      <span
                        className="text-xs font-bold tracking-[0.2em] uppercase"
                        style={{ color: accentColor }}
                      >
                        {screenshotTitle}
                      </span>
                      <Star className="w-3.5 h-3.5" style={{ color: accentColor }} fill={accentColor} />
                    </div>
                    <div
                      className="h-px flex-1 max-w-[100px]"
                      style={{ background: `linear-gradient(to left, transparent, ${accentColor}25)` }}
                    />
                  </div>
                )}

                <div
                  className="overflow-hidden"
                  style={{
                    maskImage: 'linear-gradient(to right, transparent, black 60px, black calc(100% - 60px), transparent)',
                    WebkitMaskImage: 'linear-gradient(to right, transparent, black 60px, black calc(100% - 60px), transparent)',
                  }}
                  onMouseEnter={() => setIsScrollPaused(true)}
                  onMouseLeave={() => setIsScrollPaused(false)}
                >
                  <div
                    className="flex gap-5 w-max will-change-transform"
                    style={{
                      animation: 'vf-scroll-left 60s linear infinite',
                      animationPlayState: isScrollPaused ? 'paused' : 'running',
                    }}
                  >
                    {duplicatedScreenshots.map((screenshot, i) => (
                      <button
                        key={`${screenshot.id}-${i}`}
                        onClick={() => {
                          const idx = screenshots.findIndex(s => s.id === screenshot.id)
                          if (idx !== -1) openLightbox(idx)
                        }}
                        className="group flex-shrink-0 w-[200px] md:w-[240px] rounded-2xl overflow-hidden bg-white shadow-lg shadow-black/20 cursor-pointer transition-transform duration-300 hover:scale-[1.03] hover:-translate-y-1"
                      >
                        <img
                          src={screenshot.src}
                          alt={screenshot.alt}
                          className="w-full h-auto block"
                          draggable={false}
                        />
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {microcopy && (
              <p className="text-center text-xs text-neutral-500 max-w-xl mx-auto px-4 leading-relaxed !-mt-6 md:!-mt-8">
                {microcopy}
              </p>
            )}
          </div>
        </div>

        {/* ─── LIGHTBOX ─── */}
        {lightboxOpen && screenshots[lightboxIndex] && (
          <div
            className="fixed inset-0 z-50 bg-black/95 backdrop-blur-md flex items-center justify-center p-4 md:p-8"
            onClick={closeLightbox}
          >
            <button
              onClick={closeLightbox}
              className="absolute top-4 right-4 z-50 w-10 h-10 rounded-full bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center hover:bg-white/20 transition-colors"
              aria-label="Close"
            >
              <X className="w-5 h-5 text-white" />
            </button>

            {screenshots.length > 1 && (
              <>
                <button
                  onClick={(e) => { e.stopPropagation(); lightboxPrev() }}
                  className="absolute left-2 md:left-6 top-1/2 -translate-y-1/2 z-50 w-11 h-11 rounded-full flex items-center justify-center transition-all duration-300 hover:scale-110 bg-black/60 backdrop-blur-md border"
                  style={{ borderColor: `${accentColor}40` }}
                  aria-label="Previous"
                >
                  <ChevronLeft className="w-5 h-5" style={{ color: accentColor }} />
                </button>
                <button
                  onClick={(e) => { e.stopPropagation(); lightboxNext() }}
                  className="absolute right-2 md:right-6 top-1/2 -translate-y-1/2 z-50 w-11 h-11 rounded-full flex items-center justify-center transition-all duration-300 hover:scale-110 bg-black/60 backdrop-blur-md border"
                  style={{ borderColor: `${accentColor}50` }}
                  aria-label="Next"
                >
                  <ChevronRight className="w-5 h-5" style={{ color: accentColor }} />
                </button>
              </>
            )}

            <div className="relative max-w-lg max-h-[85vh] w-full" onClick={e => e.stopPropagation()}>
              <img
                src={screenshots[lightboxIndex].src}
                alt={screenshots[lightboxIndex].alt}
                className="w-full h-auto max-h-[80vh] object-contain rounded-2xl shadow-2xl"
              />
              {(screenshots[lightboxIndex].name || screenshots[lightboxIndex].caption) && (
                <div className="text-center mt-4">
                  {screenshots[lightboxIndex].name && (
                    <p className="text-base font-semibold text-white">{screenshots[lightboxIndex].name}</p>
                  )}
                  {screenshots[lightboxIndex].caption && (
                    <p className="text-sm text-neutral-400 mt-1">{screenshots[lightboxIndex].caption}</p>
                  )}
                </div>
              )}

              {screenshots.length > 1 && (
                <div className="flex items-center justify-center gap-1.5 mt-4">
                  {screenshots.map((_, index) => (
                    <button
                      key={index}
                      onClick={(e) => { e.stopPropagation(); setLightboxIndex(index) }}
                      className="transition-all duration-300 rounded-full"
                      style={{
                        width: index === lightboxIndex ? '1.25rem' : '0.375rem',
                        height: '0.375rem',
                        backgroundColor: index === lightboxIndex ? accentColor : '#4B5563',
                        boxShadow: index === lightboxIndex ? `0 0 8px ${accentColor}60` : 'none',
                      }}
                      aria-label={`Screenshot ${index + 1}`}
                    />
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </>
    )
  }
)
SocialProofSection.displayName = 'SocialProofSection'
