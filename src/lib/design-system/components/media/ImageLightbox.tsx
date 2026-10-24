'use client'

import React, { useState, useEffect } from 'react'
import { X, ChevronLeft, ChevronRight, Check, Download } from 'lucide-react'
import { cn } from '../shared-utils'
import { Button } from '../forms/Button'
import { OverlayPortal } from '../overlays/OverlayPortal'

export interface ImageLightboxImage {
  url: string
  alt?: string
  caption?: string
  number?: number // Optional number to display on image
}

interface ImageLightboxProps {
  images: ImageLightboxImage[]
  currentIndex: number
  isOpen: boolean
  onClose: () => void
  onNavigate?: (index: number) => void
  showCopyButton?: boolean
  showNavigation?: boolean
  showThumbnails?: boolean
  showNumbers?: boolean // Show numbers on thumbnails
  showCounter?: boolean // Show image counter (e.g., "1 of 5")
  onCopy?: (url: string) => void
  actionButtonText?: string // Text for action button (default: "Copy Link")
  actionButtonIcon?: React.ReactNode // Custom icon for action button
  subtitleText?: string // Optional subtitle text below image
  className?: string
}

export const ImageLightbox = React.forwardRef<HTMLDivElement, ImageLightboxProps>(
  (
    {
      images,
      currentIndex,
      isOpen,
      onClose,
      onNavigate,
      showCopyButton = true,
      showNavigation = true,
      showThumbnails = true,
      showNumbers = false,
      showCounter = true,
      onCopy,
      actionButtonText = 'Copy Link',
      actionButtonIcon,
      subtitleText,
      className = ''
    },
    ref
  ) => {
    const [copied, setCopied] = useState(false)
    
    const currentImage = images[currentIndex] || images[0]
    const hasMultipleImages = images.length > 1
    
    const handlePrevious = () => {
      if (hasMultipleImages && onNavigate) {
        const newIndex = (currentIndex - 1 + images.length) % images.length
        onNavigate(newIndex)
      }
    }
    
    const handleNext = () => {
      if (hasMultipleImages && onNavigate) {
        const newIndex = (currentIndex + 1) % images.length
        onNavigate(newIndex)
      }
    }
    
    const handleCopy = async () => {
      try {
        await navigator.clipboard.writeText(currentImage.url)
        setCopied(true)
        onCopy?.(currentImage.url)
        setTimeout(() => setCopied(false), 2000)
      } catch (error) {
        console.error('Failed to copy:', error)
      }
    }
    
    // Keyboard navigation
    useEffect(() => {
      const handleKeyDown = (e: KeyboardEvent) => {
        if (!isOpen) return
        
        switch (e.key) {
          case 'Escape':
            onClose()
            break
          case 'ArrowLeft':
            handlePrevious()
            break
          case 'ArrowRight':
            handleNext()
            break
        }
      }
      
      window.addEventListener('keydown', handleKeyDown)
      return () => window.removeEventListener('keydown', handleKeyDown)
    }, [isOpen, currentIndex, images.length])
    
    // Early return after all hooks
    if (!isOpen || images.length === 0) return null
    
    return (
      <OverlayPortal>
      <div
        ref={ref}
        data-shell-mode-skip
        role="dialog"
        aria-modal="true"
        className={cn(
          // No dark backdrop: the picture sits over the page, as wide as the
          // viewport allows with a little padding. The layer only catches clicks.
          'fixed inset-0 z-[100] flex flex-col items-center justify-center gap-3 p-4',
          className
        )}
        onClick={onClose}
      >
          {/* Close Button */}
          <button
            onClick={(e) => {
              e.stopPropagation()
              onClose()
            }}
            className="absolute right-4 top-[max(1rem,env(safe-area-inset-top))] z-10 rounded-full border border-white/15 bg-[rgba(28,22,38,0.7)] p-2 text-white shadow-[0_6px_18px_rgba(0,0,0,0.3)] backdrop-blur-xl transition-colors hover:bg-[rgba(28,22,38,0.9)]"
            aria-label="Close lightbox"
          >
            <X className="w-6 h-6" />
          </button>

          {/* Navigation Arrows */}
          {showNavigation && hasMultipleImages && (
            <>
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  handlePrevious()
                }}
                className="absolute left-4 top-1/2 z-10 -translate-y-1/2 rounded-full border border-white/15 bg-[rgba(28,22,38,0.7)] p-2 text-white shadow-[0_6px_18px_rgba(0,0,0,0.3)] backdrop-blur-xl transition-colors hover:bg-[rgba(28,22,38,0.9)]"
                aria-label="Previous image"
              >
                <ChevronLeft className="w-6 h-6" />
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  handleNext()
                }}
                className="absolute right-4 top-1/2 z-10 -translate-y-1/2 rounded-full border border-white/15 bg-[rgba(28,22,38,0.7)] p-2 text-white shadow-[0_6px_18px_rgba(0,0,0,0.3)] backdrop-blur-xl transition-colors hover:bg-[rgba(28,22,38,0.9)]"
                aria-label="Next image"
              >
                <ChevronRight className="w-6 h-6" />
              </button>
            </>
          )}

          {/* The picture: full width minus the padding, never taller than the screen */}
          <img
            src={currentImage.url}
            alt={currentImage.alt || `Image ${currentIndex + 1}`}
            className="min-h-0 w-auto max-w-full flex-1 rounded-2xl object-contain shadow-[0_24px_60px_rgba(0,0,0,0.45)]"
            style={{ maxHeight: 'calc(100dvh - 2rem)' }}
            onClick={(e) => e.stopPropagation()}
          />

          {/* Caption, Subtitle, Counter, Thumbnails, Actions */}
          {(currentImage.caption || subtitleText || (hasMultipleImages && (showCounter || showThumbnails)) || showCopyButton) && (
            <div className="flex w-full max-w-[1200px] shrink-0 flex-col items-center gap-2" onClick={(e) => e.stopPropagation()}>
              {currentImage.caption && (
                <div className="max-w-2xl rounded-full border border-white/15 bg-[rgba(28,22,38,0.7)] px-4 py-1.5 text-center text-sm text-white backdrop-blur-xl">
                  {currentImage.caption}
                </div>
              )}
              {subtitleText && (
                <div className="max-w-2xl text-center text-xs text-white/70">
                  {subtitleText}
                </div>
              )}
              {hasMultipleImages && showCounter && (
                <div className="rounded-full border border-white/15 bg-[rgba(28,22,38,0.7)] px-3 py-1 text-sm text-white backdrop-blur-xl">
                  {currentIndex + 1} of {images.length}
                </div>
              )}
              {hasMultipleImages && showThumbnails && (
                <div className="flex max-w-full gap-2 overflow-x-auto pb-1">
                  {images.map((image, index) => (
                    <button
                      key={index}
                      onClick={(e) => {
                        e.stopPropagation()
                        onNavigate?.(index)
                      }}
                      className={cn(
                        'relative h-14 w-14 flex-shrink-0 overflow-hidden rounded-xl border-2 transition-colors',
                        index === currentIndex ? 'border-[#39FF14]' : 'border-white/20 hover:border-white/50'
                      )}
                    >
                      <img
                        src={image.url}
                        alt={image.alt || `Thumbnail ${index + 1}`}
                        className="h-full w-full object-cover"
                      />
                      {(showNumbers || image.number) && (
                        <div className="absolute left-1 top-1 flex h-5 w-5 items-center justify-center rounded-full bg-[#39FF14]">
                          <span className="text-xs font-bold text-black">
                            {image.number || index + 1}
                          </span>
                        </div>
                      )}
                    </button>
                  ))}
                </div>
              )}
              {showCopyButton && (
                <Button
                  variant="primary"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation()
                    handleCopy()
                  }}
                >
                  {copied ? (
                    <>
                      <Check className="w-4 h-4 mr-2" />
                      Copied!
                    </>
                  ) : (
                    <>
                      {actionButtonIcon || <Download className="w-4 h-4 mr-2" />}
                      {actionButtonText}
                    </>
                  )}
                </Button>
              )}
            </div>
          )}
      </div>
      </OverlayPortal>
    )
  }
)
ImageLightbox.displayName = 'ImageLightbox'

