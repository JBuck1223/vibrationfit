'use client'

import React, { useState, useEffect, useCallback, useRef } from 'react'
import { ChevronLeft, ChevronRight, Star, Quote } from 'lucide-react'
import { cn } from '../shared-utils'
import { Card } from '../cards/Card'
import { Heading } from '../typography/Heading'
import { Text } from '../typography/Text'
import { Stack } from '../layout/Stack'
import { Icon } from './Icon'

export interface Testimonial {
  id: string
  name: string
  role?: string
  quote: string
  avatar?: string
  rating?: number
  accentColor?: string
}

export interface TestimonialsCarouselProps extends React.HTMLAttributes<HTMLDivElement> {
  testimonials: Testimonial[]
  title?: string
  subtitle?: string
  autoPlay?: boolean
  autoPlayInterval?: number
  pauseOnHover?: boolean
  showArrows?: boolean
  showDots?: boolean
  showRating?: boolean
  accentColor?: string
  className?: string
}

export const TestimonialsCarousel = React.forwardRef<HTMLDivElement, TestimonialsCarouselProps>(
  ({
    testimonials,
    title,
    subtitle,
    autoPlay = true,
    autoPlayInterval = 5000,
    pauseOnHover = true,
    showArrows = true,
    showDots = true,
    showRating = true,
    accentColor = '#BF00FF',
    className = '',
    ...props
  }, ref) => {
    const [currentIndex, setCurrentIndex] = useState(0)
    const [isPaused, setIsPaused] = useState(false)
    const [direction, setDirection] = useState<'left' | 'right'>('right')
    const [isAnimating, setIsAnimating] = useState(false)
    const touchStartX = useRef(0)
    const touchEndX = useRef(0)

    const totalSlides = testimonials.length

    const goToSlide = useCallback((index: number, dir?: 'left' | 'right') => {
      if (isAnimating || totalSlides <= 1) return
      setIsAnimating(true)

      const wrappedIndex = ((index % totalSlides) + totalSlides) % totalSlides
      setDirection(dir || (wrappedIndex > currentIndex ? 'right' : 'left'))
      setCurrentIndex(wrappedIndex)

      setTimeout(() => setIsAnimating(false), 500)
    }, [currentIndex, isAnimating, totalSlides])

    const goNext = useCallback(() => {
      goToSlide(currentIndex + 1, 'right')
    }, [currentIndex, goToSlide])

    const goPrev = useCallback(() => {
      goToSlide(currentIndex - 1, 'left')
    }, [currentIndex, goToSlide])

    useEffect(() => {
      if (!autoPlay || isPaused || totalSlides <= 1) return

      const interval = setInterval(goNext, autoPlayInterval)
      return () => clearInterval(interval)
    }, [autoPlay, autoPlayInterval, isPaused, totalSlides, goNext])

    const handleTouchStart = (e: React.TouchEvent) => {
      touchStartX.current = e.touches[0].clientX
    }

    const handleTouchMove = (e: React.TouchEvent) => {
      touchEndX.current = e.touches[0].clientX
    }

    const handleTouchEnd = () => {
      const diff = touchStartX.current - touchEndX.current
      const threshold = 50

      if (Math.abs(diff) > threshold) {
        if (diff > 0) {
          goNext()
        } else {
          goPrev()
        }
      }
    }

    const handleKeyDown = (e: React.KeyboardEvent) => {
      if (e.key === 'ArrowLeft') goPrev()
      if (e.key === 'ArrowRight') goNext()
    }

    if (testimonials.length === 0) return null

    const currentTestimonial = testimonials[currentIndex]
    const itemAccent = currentTestimonial.accentColor || accentColor

    return (
      <div
        ref={ref}
        className={cn('w-full', className)}
        onMouseEnter={() => pauseOnHover && setIsPaused(true)}
        onMouseLeave={() => pauseOnHover && setIsPaused(false)}
        onKeyDown={handleKeyDown}
        tabIndex={0}
        role="region"
        aria-label="Testimonials carousel"
        aria-roledescription="carousel"
        {...props}
      >
        <Stack gap="lg">
          {(title || subtitle) && (
            <Stack gap="sm" className="items-center text-center">
              {title && (
                <Heading level={2} className="text-white">
                  {title}
                </Heading>
              )}
              {subtitle && (
                <Text size="base" className="text-neutral-400 max-w-2xl mx-auto">
                  {subtitle}
                </Text>
              )}
            </Stack>
          )}

          <div className="relative">
            {showArrows && totalSlides > 1 && (
              <>
                <button
                  onClick={goPrev}
                  className="group absolute left-0 top-1/2 -translate-y-1/2 z-10 hidden md:flex w-11 h-11 items-center justify-center rounded-full border-2 transition-all duration-300 hover:scale-110"
                  style={{
                    borderColor: `${itemAccent}60`,
                    backgroundColor: `${itemAccent}15`,
                  }}
                  aria-label="Previous testimonial"
                >
                  <Icon
                    icon={ChevronLeft}
                    size="sm"
                    className="transition-transform duration-200 group-hover:-translate-x-0.5"
                    color={itemAccent}
                  />
                </button>
                <button
                  onClick={goNext}
                  className="group absolute right-0 top-1/2 -translate-y-1/2 z-10 hidden md:flex w-11 h-11 items-center justify-center rounded-full border-2 transition-all duration-300 hover:scale-110"
                  style={{
                    borderColor: itemAccent,
                    backgroundColor: itemAccent,
                  }}
                  aria-label="Next testimonial"
                >
                  <Icon
                    icon={ChevronRight}
                    size="sm"
                    className="text-white transition-transform duration-200 group-hover:translate-x-0.5"
                    color="#FFFFFF"
                  />
                </button>
              </>
            )}

            <div
              className="overflow-hidden md:mx-14"
              onTouchStart={handleTouchStart}
              onTouchMove={handleTouchMove}
              onTouchEnd={handleTouchEnd}
            >
              <div
                className="flex transition-transform duration-500 ease-out"
                style={{
                  transform: `translateX(-${currentIndex * 100}%)`,
                }}
              >
                {testimonials.map((testimonial) => {
                  const cardAccent = testimonial.accentColor || accentColor
                  return (
                    <div
                      key={testimonial.id}
                      className="w-full flex-shrink-0 px-1"
                      role="group"
                      aria-roledescription="slide"
                      aria-label={`Testimonial from ${testimonial.name}`}
                    >
                      <Card
                        className="relative overflow-hidden border-2 transition-all duration-300"
                        style={{
                          borderColor: `${cardAccent}40`,
                        }}
                      >
                        <div
                          className="absolute top-0 left-0 right-0 h-1"
                          style={{
                            background: `linear-gradient(90deg, ${cardAccent}, ${cardAccent}80, transparent)`,
                          }}
                        />

                        <Stack gap="md" className="p-6 md:p-8 relative">
                          <div className="flex items-start justify-between">
                            <div
                              className="w-10 h-10 rounded-full flex items-center justify-center"
                              style={{ backgroundColor: `${cardAccent}20` }}
                            >
                              <Icon icon={Quote} size="sm" color={cardAccent} />
                            </div>

                            {showRating && testimonial.rating && (
                              <div className="flex items-center gap-0.5">
                                {Array.from({ length: 5 }).map((_, i) => (
                                  <Star
                                    key={i}
                                    className="w-4 h-4 transition-colors"
                                    fill={i < testimonial.rating! ? '#FFFF00' : 'transparent'}
                                    stroke={i < testimonial.rating! ? '#FFFF00' : '#4B5563'}
                                    strokeWidth={1.5}
                                  />
                                ))}
                              </div>
                            )}
                          </div>

                          <Text
                            size="lg"
                            className="text-neutral-200 leading-relaxed italic"
                          >
                            &ldquo;{testimonial.quote}&rdquo;
                          </Text>

                          <div className="flex items-center gap-4 pt-2 border-t border-neutral-700/50">
                            {testimonial.avatar ? (
                              <img
                                src={testimonial.avatar}
                                alt={testimonial.name}
                                className="w-12 h-12 rounded-full object-cover border-2"
                                style={{ borderColor: `${cardAccent}60` }}
                              />
                            ) : (
                              <div
                                className="w-12 h-12 rounded-full flex items-center justify-center text-lg font-bold"
                                style={{
                                  backgroundColor: `${cardAccent}20`,
                                  color: cardAccent,
                                }}
                              >
                                {testimonial.name.charAt(0).toUpperCase()}
                              </div>
                            )}
                            <div>
                              <Text
                                size="base"
                                className="font-semibold text-white"
                              >
                                {testimonial.name}
                              </Text>
                              {testimonial.role && (
                                <Text size="sm" className="text-neutral-400">
                                  {testimonial.role}
                                </Text>
                              )}
                            </div>
                          </div>
                        </Stack>
                      </Card>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>

          {showDots && totalSlides > 1 && (
            <div className="flex items-center justify-center gap-2 pt-2">
              {testimonials.map((_, index) => (
                <button
                  key={index}
                  onClick={() => goToSlide(index)}
                  className="transition-all duration-300 rounded-full"
                  style={{
                    width: index === currentIndex ? '2rem' : '0.5rem',
                    height: '0.5rem',
                    backgroundColor: index === currentIndex ? accentColor : '#4B5563',
                    boxShadow: index === currentIndex ? `0 0 8px ${accentColor}60` : 'none',
                  }}
                  aria-label={`Go to testimonial ${index + 1}`}
                  aria-current={index === currentIndex ? 'true' : undefined}
                />
              ))}
            </div>
          )}
        </Stack>
      </div>
    )
  }
)
TestimonialsCarousel.displayName = 'TestimonialsCarousel'
