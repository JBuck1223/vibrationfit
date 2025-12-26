'use client'

import React, { useState, useRef, useEffect } from 'react'
import { X, ChevronLeft, ChevronRight, ArrowDown, CheckCircle } from 'lucide-react'
import { cn } from '../shared-utils'
import { Card } from '../cards/Card'
import { Badge } from '../badges/Badge'
import { Button } from '../forms/Button'
import { VIVAButton } from '../forms/VIVAButton'
import { Heading } from '../typography/Heading'
import { Text } from '../typography/Text'
import { Stack } from '../layout/Stack'
import { Inline } from '../layout/Inline'
import { Icon } from './Icon'
import { Modal } from '../overlays/Modal'
export interface SwipeableCard {
  id: string
  title?: string
  content: React.ReactNode
  image?: string
  imageAlt?: string
  badge?: string
  badgeVariant?: 'success' | 'info' | 'warning' | 'error' | 'premium'
  /**
   * Active image for vision transformation cards (top image with "Active" badge)
   */
  activeImage?: string
  activeImageAlt?: string
  /**
   * Actualized image for vision transformation cards (bottom image with "Actualized" badge)
   */
  actualizedImage?: string
  actualizedImageAlt?: string
  footer?: React.ReactNode
  onClick?: () => void
  /**
   * Control whether the card title appears beneath the images.
   * @default true
   */
  showTitleOnCard?: boolean
  /**
   * Control whether the card content appears beneath the images.
   * @default true
   */
  showContentOnCard?: boolean
  /**
   * Control whether the modal displays images when opened from the card button.
   * @default true
   */
  showModalImages?: boolean
  /**
   * Optional member name to display in the modal header.
   */
  memberName?: string
  memberNames?: string[]
}

export interface SwipeableCardsProps extends React.HTMLAttributes<HTMLDivElement> {
  cards: SwipeableCard[]
  title?: string
  subtitle?: string
  /**
   * Enable on mobile only, desktop shows grid
   * @default true
   */
  mobileOnly?: boolean
  /**
   * Force swipe stack on desktop (instead of grid)
   * @default false
   */
  desktopSwipe?: boolean
  /**
   * Cards per view on desktop
   * @default 3
   */
  desktopCardsPerView?: number
  /**
   * Threshold for swipe (0-1)
   * @default 0.25
   */
  swipeThreshold?: number
  /**
   * Enable haptic feedback on swipe
   * @default true
   */
  hapticFeedback?: boolean
  /**
   * Auto-snap cards to center after swipe
   * @default true
   */
  autoSnap?: boolean
  /**
   * Automatically advance cards (carousel)
   * @default false
   */
  autoScroll?: boolean
  /**
   * Interval for auto scroll in ms
   * @default 6000
   */
  autoScrollInterval?: number
  /**
   * Show card indicators
   * @default true
   */
  showIndicators?: boolean
  /**
   * Card variant
   * @default 'default'
   */
  cardVariant?: 'default' | 'elevated' | 'outlined'
  /**
   * Callback when card is swiped
   */
  onCardSwiped?: (cardId: string, direction: 'left' | 'right') => void
  /**
   * Callback when card is clicked/tapped
   */
  onCardClick?: (cardId: string) => void
}

export const SwipeableCards = React.forwardRef<HTMLDivElement, SwipeableCardsProps>(
  ({ 
    cards, 
    title,
    subtitle,
    mobileOnly = true,
    desktopSwipe = false,
    desktopCardsPerView = 3,
    swipeThreshold = 0.25,
    hapticFeedback = true,
    autoSnap = true,
    autoScroll = false,
    autoScrollInterval = 6000,
    showIndicators = true,
    cardVariant = 'default',
    onCardSwiped,
    onCardClick,
    className = '',
    ...props 
  }, ref) => {
    const [currentIndex, setCurrentIndex] = useState(0)
    const totalCards = cards.length
    const hasLooping = totalCards > 1
    const [carouselIndex, setCarouselIndex] = useState(() => (hasLooping ? 1 : 0))
    const [isTransitionDisabled, setIsTransitionDisabled] = useState(false)
    const [isDragging, setIsDragging] = useState(false)
    const [startX, setStartX] = useState(0)
    const [startY, setStartY] = useState(0)
    const [translateX, setTranslateX] = useState(0)
    const [translateY, setTranslateY] = useState(0)
    const [isMobile, setIsMobile] = useState(false)
    const [selectedCardId, setSelectedCardId] = useState<string | null>(null)
    const [lightboxImage, setLightboxImage] = useState<{ src: string; alt: string; type: 'active' | 'actualized' } | null>(null)
    
    const containerRef = useRef<HTMLDivElement>(null)
    const cardRefs = useRef<(HTMLDivElement | null)[]>([])
    const extendedCards = React.useMemo(() => {
      if (totalCards === 0) {
        return [] as Array<{ card: SwipeableCard; key: string; actualIndex: number }>
      }

      if (!hasLooping) {
        return cards.map((card, idx) => ({
          card,
          key: card.id ?? `card-${idx}`,
          actualIndex: idx,
        }))
      }

      const lastIdx = totalCards - 1
      const items: Array<{ card: SwipeableCard; key: string; actualIndex: number }> = [
        {
          card: cards[lastIdx],
          key: `${cards[lastIdx].id}-clone-start`,
          actualIndex: lastIdx,
        },
      ]

      cards.forEach((card, idx) => {
        items.push({
          card,
          key: card.id ?? `card-${idx}`,
          actualIndex: idx,
        })
      })

      items.push({
        card: cards[0],
        key: `${cards[0].id}-clone-end`,
        actualIndex: 0,
      })

      return items
    }, [cards, hasLooping, totalCards])

    useEffect(() => {
      if (totalCards === 0) {
        setCurrentIndex(0)
        setCarouselIndex(0)
        return
      }

      if (!hasLooping) {
        setCarouselIndex(0)
        setCurrentIndex((prev) => Math.min(Math.max(prev, 0), totalCards - 1))
        return
      }

      setCarouselIndex((prev) => {
        if (prev === 0) return 1
        if (prev > totalCards) return totalCards
        return prev
      })

      setCurrentIndex((prev) => {
        if (prev >= totalCards) return totalCards - 1
        return Math.max(prev, 0)
      })
    }, [hasLooping, totalCards])

    useEffect(() => {
      if (!hasLooping || totalCards === 0) {
        return
      }

      if (carouselIndex === 0) {
        setIsTransitionDisabled(true)
        setCarouselIndex(totalCards)
        return
      }

      if (carouselIndex === totalCards + 1) {
        setIsTransitionDisabled(true)
        setCarouselIndex(1)
        return
      }

      setCurrentIndex(carouselIndex - 1)

      if (isTransitionDisabled) {
        setIsTransitionDisabled(false)
      }
    }, [carouselIndex, hasLooping, totalCards, isTransitionDisabled])

    // Detect mobile viewport
    useEffect(() => {
      const checkMobile = () => {
        setIsMobile(window.innerWidth < 768)
      }
      
      checkMobile()
      window.addEventListener('resize', checkMobile)
      return () => window.removeEventListener('resize', checkMobile)
    }, [])

    // Haptic feedback helper
    const triggerHaptic = (type: 'light' | 'medium' | 'heavy' = 'light') => {
      if (!hapticFeedback || typeof navigator === 'undefined' || !navigator.vibrate) {
        return
      }
      
      const patterns = {
        light: [10],
        medium: [20, 10, 20],
        heavy: [30, 20, 30]
      }
      
      navigator.vibrate(patterns[type])
    }

    // Touch handlers
    const handleTouchStart = (e: React.TouchEvent) => {
      if (!isMobile && mobileOnly && !desktopSwipe) return
      
      setIsDragging(true)
      setStartX(e.touches[0].clientX)
      setStartY(e.touches[0].clientY)
      setTranslateX(0)
      setTranslateY(0)
    }

    const handleTouchMove = (e: React.TouchEvent) => {
      if (!isDragging || (!isMobile && mobileOnly && !desktopSwipe)) return

      const currentX = e.touches[0].clientX
      const currentY = e.touches[0].clientY
      const deltaX = currentX - startX
      const deltaY = currentY - startY

      // Only allow horizontal swiping if horizontal movement is greater than vertical
      if (Math.abs(deltaX) > Math.abs(deltaY)) {
        e.preventDefault()
        setTranslateX(deltaX)
      } else {
        setTranslateY(deltaY)
      }
    }

    const handleTouchEnd = () => {
      if (!isDragging) return

      const threshold = containerRef.current 
        ? containerRef.current.offsetWidth * swipeThreshold 
        : 100

      // Determine swipe direction
      if (Math.abs(translateX) > threshold) {
        const direction = translateX > 0 ? 'right' : 'left'
        triggerHaptic('medium')

        const nextIndex = direction === 'left'
          ? currentIndex + 1
          : currentIndex - 1

        if (cards[currentIndex]) {
          onCardSwiped?.(cards[currentIndex].id, direction)
        }

        if (hasLooping) {
          setCarouselIndex((prev) => prev + (direction === 'left' ? 1 : -1))
          setTranslateX(0)
          setTranslateY(0)
        } else {
          goToCard(nextIndex)
        }
      } else {
        // Snap back - didn't reach threshold
        triggerHaptic('light')
        if (autoSnap) {
          setTranslateX(0)
          setTranslateY(0)
        }
      }

      setIsDragging(false)
    }

    // Mouse handlers (for desktop testing)
    const handleMouseDown = (e: React.MouseEvent) => {
      if (!isMobile && mobileOnly && !desktopSwipe) return
      
      setIsDragging(true)
      setStartX(e.clientX)
      setStartY(e.clientY)
      setTranslateX(0)
      setTranslateY(0)
    }

    const handleMouseMove = (e: React.MouseEvent) => {
      if (!isDragging || (!isMobile && mobileOnly && !desktopSwipe)) return

      const currentX = e.clientX
      const currentY = e.clientY
      const deltaX = currentX - startX
      const deltaY = currentY - startY

      if (Math.abs(deltaX) > Math.abs(deltaY)) {
        e.preventDefault()
        setTranslateX(deltaX)
      } else {
        setTranslateY(deltaY)
      }
    }

    const handleMouseUp = () => {
      if (!isDragging) return

      const threshold = containerRef.current 
        ? containerRef.current.offsetWidth * swipeThreshold 
        : 100

      if (Math.abs(translateX) > threshold) {
        const direction = translateX > 0 ? 'right' : 'left'
        triggerHaptic('medium')

        const nextIndex = direction === 'left'
          ? currentIndex + 1
          : currentIndex - 1

        if (cards[currentIndex]) {
          onCardSwiped?.(cards[currentIndex].id, direction)
        }

        if (hasLooping) {
          setCarouselIndex((prev) => prev + (direction === 'left' ? 1 : -1))
          setTranslateX(0)
          setTranslateY(0)
        } else {
          goToCard(nextIndex)
        }
      } else {
        triggerHaptic('light')
        if (autoSnap) {
          setTranslateX(0)
          setTranslateY(0)
        }
      }

      setIsDragging(false)
    }

    // Navigate to specific card
    const goToCard = (index: number) => {
      if (totalCards === 0) return
      const wrappedIndex = ((index % totalCards) + totalCards) % totalCards

      if (hasLooping) {
        setCarouselIndex(wrappedIndex + 1)
      } else {
        setCurrentIndex(wrappedIndex)
      }

      setTranslateX(0)
      setTranslateY(0)
    }

    // Reset position when index changes
    useEffect(() => {
      setTranslateX(0)
      setTranslateY(0)
    }, [currentIndex])

    // Handle ESC key for lightbox
    useEffect(() => {
      const handleEscape = (e: KeyboardEvent) => {
        if (e.key === 'Escape' && lightboxImage) {
          setLightboxImage(null)
        }
      }
      
      if (lightboxImage) {
        document.addEventListener('keydown', handleEscape)
        document.body.style.overflow = 'hidden'
      }
      
      return () => {
        document.removeEventListener('keydown', handleEscape)
        document.body.style.overflow = 'unset'
      }
    }, [lightboxImage])

    // Show grid on desktop if not mobile-only
    const showDesktopGrid = (!mobileOnly || !isMobile) && !desktopSwipe

    // Auto-scroll for swipeable modes (mobile and desktopSwipe)
    useEffect(() => {
      if (!autoScroll) return
      if (totalCards <= 1) return
      if (isMobile) return
      if (!desktopSwipe) return

      const interval = setInterval(() => {
        if (hasLooping) {
          setCarouselIndex((prev) => prev + 1)
        } else {
          setCurrentIndex((prev) => (prev + 1) % totalCards)
        }

        if (autoSnap) {
          setTranslateX(0)
          setTranslateY(0)
        }
      }, autoScrollInterval)

      return () => clearInterval(interval)
    }, [autoScroll, autoScrollInterval, totalCards, isMobile, desktopSwipe, autoSnap, hasLooping])

    // Desktop scrollable view ref (used only in desktop view)
    const scrollContainerRef = React.useRef<HTMLDivElement>(null)
    const pointerIdRef = React.useRef<number | null>(null)
    const desktopDragState = React.useRef({
      isDragging: false,
      startX: 0,
      scrollLeft: 0,
      hasMoved: false,
    })

    const scrollCards = React.useCallback((direction: 'left' | 'right') => {
      if (!scrollContainerRef.current) return

      const container = scrollContainerRef.current
      const firstCard = container.querySelector<HTMLElement>('[data-swipeable-card]')
      const cardWidth = firstCard
        ? firstCard.getBoundingClientRect().width
        : container.clientWidth / desktopCardsPerView
      const gap = 24 // gap-6
      const scrollAmount = cardWidth + gap

      if (direction === 'left') {
        if (container.scrollLeft <= 0) {
          container.scrollTo({
            left: container.scrollWidth,
            behavior: 'smooth'
          })
        } else {
          container.scrollBy({
            left: -scrollAmount,
            behavior: 'smooth'
          })
        }
      } else {
        if (container.scrollLeft + container.clientWidth >= container.scrollWidth - 1) {
          container.scrollTo({
            left: 0,
            behavior: 'smooth'
          })
        } else {
          container.scrollBy({
            left: scrollAmount,
            behavior: 'smooth'
          })
        }
      }
    }, [desktopCardsPerView])

    const handleDesktopPointerMove = React.useCallback((e: React.PointerEvent<HTMLDivElement> | PointerEvent) => {
      if (!desktopDragState.current.isDragging) return
      if (!scrollContainerRef.current) return
      if (pointerIdRef.current !== null && e.pointerId !== pointerIdRef.current) return

      e.preventDefault()
      const deltaX = e.clientX - desktopDragState.current.startX
      if (Math.abs(deltaX) > 4) {
        desktopDragState.current.hasMoved = true
      }
      scrollContainerRef.current.scrollLeft = desktopDragState.current.scrollLeft - deltaX
    }, [])

    const handleDesktopPointerUp = React.useCallback((e: PointerEvent | React.PointerEvent<HTMLDivElement>) => {
      if (pointerIdRef.current !== null && 'pointerId' in e && e.pointerId !== pointerIdRef.current) {
        return
      }

      desktopDragState.current.isDragging = false
      pointerIdRef.current = null
      window.removeEventListener('pointermove', handleDesktopPointerMove as any)
      window.removeEventListener('pointerup', handleDesktopPointerUp as any)
      window.removeEventListener('pointercancel', handleDesktopPointerUp as any)
      // Delay reset so clicks immediately after a drag are ignored
      setTimeout(() => {
        desktopDragState.current.hasMoved = false
      }, 0)
    }, [handleDesktopPointerMove])

    const handleDesktopPointerDown = React.useCallback((e: React.PointerEvent<HTMLDivElement>) => {
      if (isMobile || desktopSwipe) return
      if (!scrollContainerRef.current) return

      // Only respond to primary mouse/pen button
      if (e.button !== 0) return

      desktopDragState.current.isDragging = true
      desktopDragState.current.startX = e.clientX
      desktopDragState.current.scrollLeft = scrollContainerRef.current.scrollLeft
      desktopDragState.current.hasMoved = false
      pointerIdRef.current = e.pointerId

      window.addEventListener('pointermove', handleDesktopPointerMove as any)
      window.addEventListener('pointerup', handleDesktopPointerUp as any)
      window.addEventListener('pointercancel', handleDesktopPointerUp as any)
    }, [isMobile, desktopSwipe, handleDesktopPointerMove, handleDesktopPointerUp])

    useEffect(() => {
      return () => {
        window.removeEventListener('pointermove', handleDesktopPointerMove as any)
        window.removeEventListener('pointerup', handleDesktopPointerUp as any)
        window.removeEventListener('pointercancel', handleDesktopPointerUp as any)
      }
    }, [handleDesktopPointerMove, handleDesktopPointerUp])

    if (cards.length === 0) {
      return null
    }

    const renderDesktopContent = () => (
      <>
        {title && (
          <Heading level={2} className="text-white text-center mb-4 md:mb-6">
            {title}
          </Heading>
        )}
        {subtitle && (
          <Text size="base" className="text-neutral-400 text-center mb-6 md:mb-8">
            {subtitle}
          </Text>
        )}

        <div className="relative overflow-hidden px-16 xl:px-20">
          {/* Scrollable container - shows 3 cards at a time */}
          <div
            ref={scrollContainerRef}
            className="overflow-x-auto scrollbar-hide scroll-smooth snap-x snap-mandatory cursor-grab active:cursor-grabbing select-none"
            onPointerDown={handleDesktopPointerDown}
            onPointerMove={handleDesktopPointerMove}
            onPointerUp={handleDesktopPointerUp}
            onPointerLeave={handleDesktopPointerUp}
            onPointerCancel={handleDesktopPointerUp}
            style={{
              scrollbarWidth: 'none',
              msOverflowStyle: 'none',
              WebkitOverflowScrolling: 'touch',
            }}
          >
            <div className="flex gap-6">
                {cards.map((card) => (
                <div
                  key={card.id}
                  data-swipeable-card
                  className="flex-shrink-0 snap-start pt-1 md:pt-2 px-3 xl:px-4"
                  style={{ 
                    width: `calc((100% - ${(desktopCardsPerView - 1) * 3}rem) / ${desktopCardsPerView})`,
                    minWidth: `calc((100% - ${(desktopCardsPerView - 1) * 3}rem) / ${desktopCardsPerView})`,
                  }}
                >
                  <Card
                    variant={cardVariant}
                    className={cn(
                      'overflow-hidden transition-all duration-300 ease-out h-full',
                      'shadow-[0_6px_20px_rgba(0,0,0,0.45)]',
                      'hover:-translate-y-1 hover:shadow-[0_18px_36px_rgba(191,0,255,0.28)]',
                      'hover:border-[#BF00FF]',
                      'group'
                    )}
                    onClick={(event) => {
                      if (desktopDragState.current.hasMoved) {
                        event.preventDefault()
                        event.stopPropagation()
                        desktopDragState.current.hasMoved = false
                        return
                      }
                      card.onClick?.()
                      onCardClick?.(card.id)
                    }}
                  >
                    <Stack gap="md" className="h-full">
                      {/* Vision Transformation: Active/Actualized Images */}
                      {(card.activeImage || card.actualizedImage) ? (
                        <Stack gap="sm" className="w-full">
                          {/* Active Image (Top) */}
                          {card.activeImage && (
                            <div 
                              className="relative w-full aspect-[4/3] overflow-hidden rounded-2xl cursor-pointer group"
                              onClick={(e) => {
                                e.stopPropagation()
                                setLightboxImage({ 
                                  src: card.activeImage!, 
                                  alt: card.activeImageAlt || card.title || 'Active vision',
                                  type: 'active'
                                })
                              }}
                            >
                              <img
                                src={card.activeImage}
                                alt={card.activeImageAlt || card.title || 'Active vision'}
                                className="w-full h-full object-contain transition-opacity group-hover:opacity-90"
                              />
                              {/* Active Badge - top right corner */}
                              <div className="absolute top-2 right-2 bg-green-600 rounded-full px-3 py-1.5 flex items-center gap-2 shadow-lg pointer-events-none">
                                <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
                                <span className="text-white text-xs font-semibold">Active</span>
                              </div>
                              {/* Click hint overlay */}
                              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors pointer-events-none"></div>
                            </div>
                          )}

                          {/* Pulsing Arrow - centered */}
                          {(card.activeImage && card.actualizedImage) && (
                            <div className="flex items-center justify-center py-1">
                              <Icon icon={ArrowDown} size="md" color="#BF00FF" className="animate-pulse" />
                            </div>
                          )}

                          {/* Actualized Image (Bottom) */}
                          {card.actualizedImage && (
                            <div 
                              className="relative w-full aspect-[4/3] overflow-hidden rounded-2xl cursor-pointer group"
                              onClick={(e) => {
                                e.stopPropagation()
                                setLightboxImage({ 
                                  src: card.actualizedImage!, 
                                  alt: card.actualizedImageAlt || card.title || 'Actualized result',
                                  type: 'actualized'
                                })
                              }}
                            >
                              <img
                                src={card.actualizedImage}
                                alt={card.actualizedImageAlt || card.title || 'Actualized result'}
                                className="w-full h-full object-contain transition-opacity group-hover:opacity-90"
                              />
                              {/* Actualized Badge - top right corner */}
                              <div className="absolute top-2 right-2 bg-purple-500 rounded-full px-3 py-1.5 flex items-center gap-2 shadow-lg pointer-events-none">
                                <CheckCircle className="w-4 h-4 text-white" />
                                <span className="text-white text-xs font-semibold">Actualized</span>
                              </div>
                              {/* Click hint overlay */}
                              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors pointer-events-none"></div>
                            </div>
                          )}
                        </Stack>
                      ) : card.image ? (
                        /* Standard Single Image */
                        <div className="relative aspect-[4/3] overflow-hidden rounded-xl bg-neutral-800 -mx-4 -mt-4 mb-0">
                          <img
                            src={card.image}
                            alt={card.imageAlt || card.title || 'Card image'}
                            className="w-full h-full object-cover"
                          />
                          {card.badge && (
                            <div className="absolute top-2 right-2">
                              <Badge variant={card.badgeVariant || 'success'}>
                                {card.badge}
                              </Badge>
                            </div>
                          )}
                        </div>
                      ) : null}
                      
                      {card.title && card.showTitleOnCard !== false && (
                        <Heading level={4} className="text-white text-base md:text-lg">
                          {card.title}
                        </Heading>
                      )}
                      
                      {card.content && card.showContentOnCard !== false && (
                        <div className="flex-1">
                          {card.content}
                        </div>
                      )}

                      <VIVAButton
                        size="sm"
                        className="self-center mt-auto"
                        onClick={(event) => {
                          event.stopPropagation()
                          setSelectedCardId(card.id)
                        }}
                      >
                        Actualization Story
                      </VIVAButton>
                      
                      {card.footer && (
                        <div 
                          className={cn(card.title || card.content ? "border-t border-neutral-700 pt-2" : "pt-4")}
                          onClick={(e) => {
                            // Check if the click target is a button
                            const target = e.target as HTMLElement
                            if (target.tagName === 'BUTTON' || target.closest('button')) {
                              e.stopPropagation()
                              setSelectedCardId(card.id)
                            }
                          }}
                        >
                          {card.footer}
                        </div>
                      )}
                    </Stack>
                  </Card>
                </div>
              ))}
            </div>
          </div>

          {/* Navigation buttons */}
          {cards.length > desktopCardsPerView && (
            <>
              <button
                onClick={() => scrollCards('left')}
                className="group absolute left-0 top-1/2 -translate-y-1/2 hidden lg:flex w-12 h-12 bg-[#BF00FF]/15 border-2 border-[#BF00FF]/60 rounded-full items-center justify-center hover:border-[#BF00FF] transition-all duration-200 z-10"
                aria-label="Scroll left"
              >
                <Icon icon={ChevronLeft} size="md" className="text-[#BF00FF] transition-transform duration-200 group-hover:-translate-x-1" />
              </button>
              <button
                onClick={() => scrollCards('right')}
                className="group absolute right-0 top-1/2 -translate-y-1/2 hidden lg:flex w-12 h-12 bg-[#BF00FF] border-2 border-[#BF00FF] rounded-full items-center justify-center hover:border-[#BF00FF] transition-all duration-200 z-10"
                aria-label="Scroll right"
              >
                <Icon icon={ChevronRight} size="md" className="text-white transition-transform duration-200 group-hover:translate-x-1" />
              </button>
            </>
          )}
        </div>
      </>
    )

    const renderMobileContent = () => {
      const trackIndex = hasLooping ? carouselIndex : currentIndex

      return (
        <>
          {title && (
            <Heading level={2} className="text-white text-center mb-4 text-xl md:text-2xl">
              {title}
            </Heading>
          )}
          {subtitle && (
            <Text size="sm" className="text-neutral-400 text-center mb-4 md:mb-6">
              {subtitle}
            </Text>
          )}

          <div
            ref={containerRef}
            className="relative w-full overflow-hidden"
            style={{ touchAction: 'pan-y pinch-zoom' }}
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
          >
            <div
              className="flex transition-transform duration-300 ease-out"
              style={{
                transform: `translateX(calc(${trackIndex * -100}% + ${translateX}px))`,
                transition: isDragging || isTransitionDisabled ? 'none' : 'transform 0.35s cubic-bezier(0.22, 1, 0.36, 1)',
              }}
            >
              {extendedCards.map(({ card, key, actualIndex }, idx) => {
                const isActive = hasLooping ? idx === trackIndex : actualIndex === currentIndex
                return (
                  <div
                    key={key}
                    ref={(el) => {
                      cardRefs.current[idx] = el
                    }}
                    className="flex-shrink-0 w-full px-1"
                    style={{
                      opacity: isActive ? 1 : 0.4,
                      pointerEvents: isActive ? 'auto' : 'none',
                    }}
                    onClick={() => {
                      if (isActive && !isDragging) {
                        card.onClick?.()
                        onCardClick?.(card.id)
                      }
                    }}
                  >
                    <Card
                      variant={cardVariant}
                      className={cn(
                        'w-full overflow-hidden transition-all duration-300 border-2 border-[#BF00FF]/30',
                        isActive && 'border-[#BF00FF]',
                        card.onClick && !isDragging && 'cursor-pointer'
                      )}
                    >
                      <div className="w-full space-y-2">
                        {(card.activeImage || card.actualizedImage) ? (
                          <>
                            {card.activeImage && (
                              <div
                                className="relative w-full aspect-[4/3] overflow-hidden rounded-2xl cursor-pointer group"
                                onClick={(e) => {
                                  e.stopPropagation()
                                  setLightboxImage({
                                    src: card.activeImage!,
                                    alt: card.activeImageAlt || card.title || 'Active vision',
                                    type: 'active'
                                  })
                                }}
                              >
                                <img
                                  src={card.activeImage}
                                  alt={card.activeImageAlt || card.title || 'Active vision'}
                                  className="w-full h-full object-contain transition-opacity group-hover:opacity-90"
                                />
                                <div className="absolute top-2 right-2 bg-green-600 rounded-full px-3 py-1.5 flex items-center gap-2 shadow-lg pointer-events-none">
                                  <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
                                  <span className="text-white text-xs font-semibold">Active</span>
                                </div>
                                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors pointer-events-none"></div>
                              </div>
                            )}

                            {(card.activeImage && card.actualizedImage) && (
                              <div className="flex items-center justify-center">
                                <Icon icon={ArrowDown} size="md" color="#BF00FF" className="animate-pulse" />
                              </div>
                            )}

                            {card.actualizedImage && (
                              <div
                                className="relative w-full aspect-[4/3] overflow-hidden rounded-2xl cursor-pointer group"
                                onClick={(e) => {
                                  e.stopPropagation()
                                  setLightboxImage({
                                    src: card.actualizedImage!,
                                    alt: card.actualizedImageAlt || card.title || 'Actualized result',
                                    type: 'actualized'
                                  })
                                }}
                              >
                                <img
                                  src={card.actualizedImage}
                                  alt={card.actualizedImageAlt || card.title || 'Actualized result'}
                                  className="w-full h-full object-contain transition-opacity group-hover:opacity-90"
                                />
                                <div className="absolute top-2 right-2 bg-purple-500 rounded-full px-3 py-1.5 flex items-center gap-2 shadow-lg pointer-events-none">
                                  <CheckCircle className="w-4 h-4 text-white" />
                                  <span className="text-white text-xs font-semibold">Actualized</span>
                                </div>
                                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors pointer-events-none"></div>
                              </div>
                            )}
                          </>
                        ) : card.image ? (
                          <div className="relative aspect-[4/3] overflow-hidden rounded-xl bg-neutral-800 -mx-4 -mt-4 mb-0">
                            <img
                              src={card.image}
                              alt={card.imageAlt || card.title || 'Card image'}
                              className="w-full h-full object-cover"
                            />
                            {card.badge && (
                              <div className="absolute top-2 right-2">
                                <Badge variant={card.badgeVariant || 'success'}>
                                  {card.badge}
                                </Badge>
                              </div>
                            )}
                          </div>
                        ) : null}

                        {card.title && card.showTitleOnCard !== false && (
                          <Heading level={4} className="text-white text-lg md:text-xl">
                            {card.title}
                          </Heading>
                        )}

                        {card.content && card.showContentOnCard !== false && (
                          <div className="flex-1 overflow-y-auto">
                            {card.content}
                          </div>
                        )}

                        <div className="flex justify-center pt-2">
                          <VIVAButton
                            size="sm"
                            onClick={(event) => {
                              event.stopPropagation()
                              setSelectedCardId(card.id)
                            }}
                          >
                            Actualization Story
                          </VIVAButton>
                        </div>

                        {card.footer && (
                          <div
                            className={cn(card.title || card.content ? "border-t border-neutral-700 pt-2" : "pt-[7px]")}
                            onClick={(e) => {
                              const target = e.target as HTMLElement
                              if (target.tagName === 'BUTTON' || target.closest('button')) {
                                e.stopPropagation()
                                setSelectedCardId(card.id)
                              }
                            }}
                          >
                            {card.footer}
                          </div>
                        )}
                      </div>
                    </Card>
                  </div>
                )
              })}
            </div>
          </div>

          {showIndicators && cards.length > 1 && (
            <div className="w-full mt-4 px-4 flex items-center justify-center gap-2">
              <Text size="xs" className="text-neutral-500 uppercase tracking-[0.25em]">
                Swipe for more
              </Text>
              <div className="flex items-center text-neutral-500">
                <ChevronRight className="w-4 h-4 animate-pulse" />
                <ChevronRight className="w-4 h-4 -ml-2 animate-pulse delay-150" />
                <ChevronRight className="w-4 h-4 -ml-2 animate-pulse delay-300" />
              </div>
            </div>
          )}
        </>
      )
    }

    return (
      <div
        ref={ref}
        className={cn('w-full', className)}
        {...props}
      >
        {showDesktopGrid && !isMobile ? renderDesktopContent() : renderMobileContent()}

        {/* Story Modal */}
        {selectedCardId && (() => {
          const selectedCard = cards.find(card => card.id === selectedCardId)
          if (!selectedCard) return null
          
          return (
            <Modal
              isOpen={!!selectedCardId}
              onClose={() => setSelectedCardId(null)}
              title={selectedCard.title || 'Actualization Story'}
              size={selectedCard.showModalImages === false ? 'md' : 'lg'}
              variant="card"
              className="border-[#BF00FF] shadow-[0_0_40px_rgba(191,0,255,0.25)]"
            >
              <div className="space-y-4 max-h-[70vh] overflow-y-auto pr-2">
                {(() => {
                  const memberBadges =
                    selectedCard.memberNames ??
                    (selectedCard.memberName ? [selectedCard.memberName] : [])
                  return memberBadges.length > 0 ? (
                    <Inline gap="xs" justify="start" className="flex-wrap">
                      {memberBadges.map((name) => (
                        <Badge key={name} variant="secondary" className="text-xs md:text-sm">
                          {name}
                        </Badge>
                      ))}
                    </Inline>
                  ) : null
                })()}
                {selectedCard.showModalImages !== false && selectedCard.activeImage && selectedCard.actualizedImage && (
                  <div className="space-y-4">
                    <div className="relative w-full aspect-[4/3] overflow-hidden rounded-2xl">
                      <img
                        src={selectedCard.activeImage}
                        alt={selectedCard.activeImageAlt || 'Active vision'}
                        className="w-full h-full object-contain"
                      />
                      <div className="absolute top-2 right-2 bg-green-600 rounded-full px-3 py-1.5 flex items-center gap-2 shadow-lg">
                        <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
                        <span className="text-white text-xs font-semibold">Active</span>
                      </div>
                    </div>
                    <div className="flex items-center justify-center">
                      <Icon icon={ArrowDown} size="md" color="#BF00FF" className="animate-pulse" />
                    </div>
                    <div className="relative w-full aspect-[4/3] overflow-hidden rounded-2xl">
                      <img
                        src={selectedCard.actualizedImage}
                        alt={selectedCard.actualizedImageAlt || 'Actualized result'}
                        className="w-full h-full object-contain"
                      />
                      <div className="absolute top-2 right-2 bg-purple-500 rounded-full px-3 py-1.5 flex items-center gap-2 shadow-lg">
                        <CheckCircle className="w-4 h-4 text-white" />
                        <span className="text-white text-xs font-semibold">Actualized</span>
                      </div>
                    </div>
                  </div>
                )}
                {selectedCard.content && (
                  <div className="rounded-2xl border border-[#BF00FF]/40 bg-[#BF00FF]/10 p-5 shadow-[0_0_20px_rgba(191,0,255,0.15)] text-justify">
                    {selectedCard.content}
                  </div>
                )}
                {!selectedCard.content && !(
                  selectedCard.showModalImages !== false &&
                  (selectedCard.activeImage || selectedCard.actualizedImage)
                ) && (
                  <Text size="base" className="text-neutral-300 text-justify">
                    This story is coming soon!
                  </Text>
                )}
              </div>
            </Modal>
          )
        })()}

        {/* Image Lightbox */}
        {lightboxImage && (
          <div 
            className="fixed inset-0 bg-black/90 z-[100] flex items-center justify-center p-4 cursor-pointer"
            onClick={() => setLightboxImage(null)}
          >
            {/* Close Button */}
            <button
              onClick={(e) => {
                e.stopPropagation()
                setLightboxImage(null)
              }}
              className="absolute top-4 right-4 z-10 p-3 bg-black/50 rounded-full text-white hover:bg-black/70 transition-colors"
              aria-label="Close lightbox"
            >
              <X className="w-6 h-6" />
            </button>

            {/* Image Container */}
            <div 
              className="relative w-full max-w-5xl max-h-[90vh] mx-auto flex items-center justify-center px-2 sm:px-6 cursor-default"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="relative w-full h-full rounded-3xl overflow-hidden border border-white/10 bg-black/40 shadow-[0_20px_60px_rgba(0,0,0,0.65)] flex items-center justify-center">
                <img
                  src={lightboxImage.src}
                  alt={lightboxImage.alt}
                  className="w-full h-full object-contain rounded-3xl"
                />
              </div>
            </div>
          </div>
        )}
      </div>
    )
  }
)
SwipeableCards.displayName = 'SwipeableCards'
