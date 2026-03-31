'use client'

import React, { useState, useEffect, useCallback, useRef } from 'react'
import { ChevronLeft, ChevronRight, Play, X, ZoomIn } from 'lucide-react'
import { cn } from '../shared-utils'
import { Card } from '../cards/Card'
import { Heading } from '../typography/Heading'
import { Text } from '../typography/Text'
import { Stack } from '../layout/Stack'
import { Icon } from './Icon'
import { Video } from '../media/Video'

// ============================================================================
// SOCIAL PROOF SECTION — Video Carousel + Screenshot Testimonials
// ============================================================================

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
  title?: string
  subtitle?: string
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
      title,
      subtitle,
      videoTitle = 'See It in Action',
      screenshotTitle = 'Real Results',
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
    const touchStartX = useRef(0)
    const touchEndX = useRef(0)

    const totalVideos = videos.length

    const goToVideo = useCallback(
      (index: number) => {
        if (isVideoAnimating || totalVideos <= 1) return
        setIsVideoAnimating(true)
        setCurrentVideoIndex(((index % totalVideos) + totalVideos) % totalVideos)
        setTimeout(() => setIsVideoAnimating(false), 400)
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

    const handleTouchStart = (e: React.TouchEvent) => {
      touchStartX.current = e.touches[0].clientX
    }
    const handleTouchMove = (e: React.TouchEvent) => {
      touchEndX.current = e.touches[0].clientX
    }
    const handleTouchEnd = () => {
      const diff = touchStartX.current - touchEndX.current
      if (Math.abs(diff) > 50) {
        diff > 0 ? nextVideo() : prevVideo()
      }
    }

    const openLightbox = (index: number) => {
      setLightboxIndex(index)
      setLightboxOpen(true)
    }

    const closeLightbox = () => setLightboxOpen(false)

    const lightboxNext = () => {
      setLightboxIndex((prev) => (prev + 1) % screenshots.length)
    }

    const lightboxPrev = () => {
      setLightboxIndex((prev) => (prev - 1 + screenshots.length) % screenshots.length)
    }

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

    return (
      <>
        <div ref={ref} className={cn('w-full', className)} {...props}>
          <Stack gap="lg">
            {(title || subtitle) && (
              <Stack gap="sm" className="items-center text-center">
                {title && <Heading level={2} className="text-white">{title}</Heading>}
                {subtitle && (
                  <Text size="base" className="text-neutral-400 max-w-2xl mx-auto">
                    {subtitle}
                  </Text>
                )}
              </Stack>
            )}

            <div className="flex flex-col lg:flex-row gap-6 lg:gap-8">
              {/* Left: Video Carousel */}
              {videos.length > 0 && (
                <div
                  className={cn(
                    'w-full',
                    screenshots.length > 0 ? 'lg:w-3/5' : 'lg:w-full'
                  )}
                  onMouseEnter={() => setIsPaused(true)}
                  onMouseLeave={() => setIsPaused(false)}
                >
                  <Card className="overflow-hidden border-2 bg-black/40" style={{ borderColor: `${accentColor}30` }}>
                    <Stack gap="md" className="p-4 md:p-6">
                      {videoTitle && (
                        <div className="flex items-center gap-2">
                          <Icon icon={Play} size="sm" color={accentColor} />
                          <Text size="base" className="font-semibold text-white">{videoTitle}</Text>
                        </div>
                      )}

                      <div className="relative">
                        <div
                          className="overflow-hidden rounded-xl"
                          onTouchStart={handleTouchStart}
                          onTouchMove={handleTouchMove}
                          onTouchEnd={handleTouchEnd}
                        >
                          <div
                            className="flex transition-transform duration-400 ease-out"
                            style={{ transform: `translateX(-${currentVideoIndex * 100}%)` }}
                          >
                            {videos.map((video) => (
                              <div key={video.id} className="w-full flex-shrink-0">
                                <Video
                                  src={video.src}
                                  poster={video.poster}
                                  caption={video.caption}
                                  variant="default"
                                  className="w-full border-0 rounded-none"
                                />
                              </div>
                            ))}
                          </div>
                        </div>

                        {totalVideos > 1 && (
                          <>
                            <button
                              onClick={prevVideo}
                              className="absolute left-2 top-1/2 -translate-y-1/2 z-10 w-9 h-9 flex items-center justify-center rounded-full border-2 transition-all duration-300 hover:scale-110 bg-black/60 backdrop-blur-sm"
                              style={{ borderColor: `${accentColor}60` }}
                              aria-label="Previous video"
                            >
                              <Icon icon={ChevronLeft} size="sm" color={accentColor} />
                            </button>
                            <button
                              onClick={nextVideo}
                              className="absolute right-2 top-1/2 -translate-y-1/2 z-10 w-9 h-9 flex items-center justify-center rounded-full border-2 transition-all duration-300 hover:scale-110 bg-black/60 backdrop-blur-sm"
                              style={{ borderColor: `${accentColor}60` }}
                              aria-label="Next video"
                            >
                              <Icon icon={ChevronRight} size="sm" color={accentColor} />
                            </button>
                          </>
                        )}
                      </div>

                      {/* Video Thumbnails / Dots */}
                      {totalVideos > 1 && (
                        <div className="flex items-center justify-center gap-3 pt-1">
                          {videos.map((video, index) => (
                            <button
                              key={video.id}
                              onClick={() => goToVideo(index)}
                              className={cn(
                                'relative rounded-lg overflow-hidden transition-all duration-300 border-2',
                                index === currentVideoIndex
                                  ? 'ring-2 scale-105 opacity-100'
                                  : 'opacity-50 hover:opacity-80 border-transparent'
                              )}
                              style={{
                                borderColor: index === currentVideoIndex ? accentColor : 'transparent',
                                ['--tw-ring-color' as string]: index === currentVideoIndex ? `${accentColor}40` : undefined,
                              }}
                              aria-label={video.label || `Video ${index + 1}`}
                            >
                              {video.label ? (
                                <div
                                  className="px-3 py-1.5 text-xs font-medium whitespace-nowrap"
                                  style={{
                                    color: index === currentVideoIndex ? accentColor : '#9CA3AF',
                                    backgroundColor: index === currentVideoIndex ? `${accentColor}15` : '#1F1F1F',
                                  }}
                                >
                                  {video.label}
                                </div>
                              ) : (
                                <div
                                  className="w-3 h-3 rounded-full transition-all duration-300"
                                  style={{
                                    backgroundColor: index === currentVideoIndex ? accentColor : '#4B5563',
                                    boxShadow: index === currentVideoIndex ? `0 0 8px ${accentColor}60` : 'none',
                                  }}
                                />
                              )}
                            </button>
                          ))}
                        </div>
                      )}
                    </Stack>
                  </Card>
                </div>
              )}

              {/* Right: Screenshot Testimonials */}
              {screenshots.length > 0 && (
                <div
                  className={cn(
                    'w-full',
                    videos.length > 0 ? 'lg:w-2/5' : 'lg:w-full'
                  )}
                >
                  <Card className="overflow-hidden border-2 h-full bg-black/40" style={{ borderColor: `${accentColor}30` }}>
                    <Stack gap="md" className="p-4 md:p-6 h-full">
                      {screenshotTitle && (
                        <div className="flex items-center gap-2">
                          <Icon icon={ZoomIn} size="sm" color={accentColor} />
                          <Text size="base" className="font-semibold text-white">{screenshotTitle}</Text>
                        </div>
                      )}

                      <div className={cn(
                        'grid gap-3 flex-1',
                        screenshots.length === 1 && 'grid-cols-1',
                        screenshots.length === 2 && 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-1',
                        screenshots.length >= 3 && 'grid-cols-2 sm:grid-cols-3 lg:grid-cols-2',
                      )}>
                        {screenshots.map((screenshot, index) => (
                          <button
                            key={screenshot.id}
                            onClick={() => openLightbox(index)}
                            className="group relative rounded-xl overflow-hidden border-2 border-[#333] hover:border-opacity-100 transition-all duration-300 hover:scale-[1.02] hover:shadow-lg cursor-pointer bg-neutral-900"
                            style={{
                              ['--hover-border' as string]: accentColor,
                            }}
                            aria-label={`View ${screenshot.alt}`}
                          >
                            <div className="relative aspect-[4/5] w-full">
                              <img
                                src={screenshot.src}
                                alt={screenshot.alt}
                                className="absolute inset-0 w-full h-full object-cover object-top"
                                loading="lazy"
                              />
                              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors duration-300 flex items-center justify-center">
                                <div
                                  className="w-10 h-10 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300 scale-75 group-hover:scale-100"
                                  style={{ backgroundColor: `${accentColor}CC` }}
                                >
                                  <ZoomIn className="w-5 h-5 text-black" />
                                </div>
                              </div>
                            </div>
                            {(screenshot.name || screenshot.caption) && (
                              <div className="p-2.5 bg-[#1A1A1A]">
                                {screenshot.name && (
                                  <Text size="sm" className="font-medium text-white truncate">
                                    {screenshot.name}
                                  </Text>
                                )}
                                {screenshot.caption && (
                                  <Text size="xs" className="text-neutral-400 truncate">
                                    {screenshot.caption}
                                  </Text>
                                )}
                              </div>
                            )}
                          </button>
                        ))}
                      </div>
                    </Stack>
                  </Card>
                </div>
              )}
            </div>
          </Stack>
        </div>

        {/* Lightbox Overlay */}
        {lightboxOpen && screenshots[lightboxIndex] && (
          <div
            className="fixed inset-0 z-50 bg-black/90 backdrop-blur-sm flex items-center justify-center p-4 md:p-8"
            onClick={closeLightbox}
          >
            <button
              onClick={closeLightbox}
              className="absolute top-4 right-4 z-50 w-10 h-10 rounded-full bg-neutral-800/80 border border-neutral-600 flex items-center justify-center hover:bg-neutral-700 transition-colors"
              aria-label="Close lightbox"
            >
              <X className="w-5 h-5 text-white" />
            </button>

            {screenshots.length > 1 && (
              <>
                <button
                  onClick={(e) => { e.stopPropagation(); lightboxPrev() }}
                  className="absolute left-4 top-1/2 -translate-y-1/2 z-50 w-11 h-11 rounded-full border-2 flex items-center justify-center transition-all duration-300 hover:scale-110 bg-black/60 backdrop-blur-sm"
                  style={{ borderColor: `${accentColor}60` }}
                  aria-label="Previous screenshot"
                >
                  <Icon icon={ChevronLeft} size="sm" color={accentColor} />
                </button>
                <button
                  onClick={(e) => { e.stopPropagation(); lightboxNext() }}
                  className="absolute right-4 top-1/2 -translate-y-1/2 z-50 w-11 h-11 rounded-full border-2 flex items-center justify-center transition-all duration-300 hover:scale-110 bg-black/60 backdrop-blur-sm"
                  style={{ borderColor: `${accentColor}60` }}
                  aria-label="Next screenshot"
                >
                  <Icon icon={ChevronRight} size="sm" color={accentColor} />
                </button>
              </>
            )}

            <div
              className="relative max-w-3xl max-h-[85vh] w-full"
              onClick={(e) => e.stopPropagation()}
            >
              <img
                src={screenshots[lightboxIndex].src}
                alt={screenshots[lightboxIndex].alt}
                className="w-full h-auto max-h-[80vh] object-contain rounded-xl"
              />
              {(screenshots[lightboxIndex].name || screenshots[lightboxIndex].caption) && (
                <div className="text-center mt-4">
                  {screenshots[lightboxIndex].name && (
                    <Text size="base" className="font-semibold text-white">
                      {screenshots[lightboxIndex].name}
                    </Text>
                  )}
                  {screenshots[lightboxIndex].caption && (
                    <Text size="sm" className="text-neutral-400 mt-1">
                      {screenshots[lightboxIndex].caption}
                    </Text>
                  )}
                </div>
              )}

              {screenshots.length > 1 && (
                <div className="flex items-center justify-center gap-2 mt-4">
                  {screenshots.map((_, index) => (
                    <button
                      key={index}
                      onClick={(e) => { e.stopPropagation(); setLightboxIndex(index) }}
                      className="transition-all duration-300 rounded-full"
                      style={{
                        width: index === lightboxIndex ? '1.5rem' : '0.5rem',
                        height: '0.5rem',
                        backgroundColor: index === lightboxIndex ? accentColor : '#4B5563',
                        boxShadow: index === lightboxIndex ? `0 0 8px ${accentColor}60` : 'none',
                      }}
                      aria-label={`Go to screenshot ${index + 1}`}
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
