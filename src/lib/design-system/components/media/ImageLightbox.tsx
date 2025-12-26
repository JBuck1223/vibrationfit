'use client'

import React, { useState, useEffect } from 'react'
import { X, ChevronLeft, ChevronRight, Check, Download } from 'lucide-react'
import { cn } from '../shared-utils'
import { Button } from '../forms/Button'

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
      <div
        ref={ref}
        className={cn(
          'fixed inset-0 bg-black/90 z-[100] flex items-center justify-center',
          className
        )}
        onClick={onClose}
      >
        <div
          className="relative w-full h-full flex flex-col items-center justify-center p-4"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Close Button */}
          <button
            onClick={(e) => {
              e.stopPropagation()
              onClose()
            }}
            className="absolute top-4 right-4 z-10 p-2 bg-black/50 rounded-full text-white hover:bg-black/70 transition-colors"
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
                className="absolute left-4 top-1/2 -translate-y-1/2 z-10 p-2 bg-black/50 rounded-full text-white hover:bg-black/70 transition-colors"
                aria-label="Previous image"
              >
                <ChevronLeft className="w-6 h-6" />
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  handleNext()
                }}
                className="absolute right-4 top-1/2 -translate-y-1/2 z-10 p-2 bg-black/50 rounded-full text-white hover:bg-black/70 transition-colors"
                aria-label="Next image"
              >
                <ChevronRight className="w-6 h-6" />
              </button>
            </>
          )}
          
          {/* Content Container with proper spacing */}
          <div className="flex-1 flex flex-col items-center justify-between max-w-6xl w-full py-2">
            {/* Top Section: Image */}
            <div className="flex-1 flex flex-col items-center justify-center w-full">
              <div className="relative w-full flex-1 flex items-center justify-center" style={{ maxHeight: 'calc(100vh - 200px)' }}>
                <img
                  src={currentImage.url}
                  alt={currentImage.alt || `Image ${currentIndex + 1}`}
                  className="max-w-full max-h-full object-contain rounded-lg"
                />
              </div>
            </div>
            
            {/* Bottom Section: Caption, Subtitle, Counter, Thumbnails, Actions */}
            <div className="flex flex-col items-center w-full gap-2 px-4 pt-2">
              {/* Caption */}
              {currentImage.caption && (
                <div className="text-center text-white text-sm max-w-2xl">
                  {currentImage.caption}
                </div>
              )}
              
              {/* Subtitle Text */}
              {subtitleText && (
                <div className="text-center text-neutral-400 text-xs max-w-2xl">
                  {subtitleText}
                </div>
              )}
              
              {/* Counter */}
              {hasMultipleImages && showCounter && (
                <div className="bg-black/50 text-white px-3 py-1 rounded-full text-sm">
                  {currentIndex + 1} of {images.length}
                </div>
              )}
              
              {/* Thumbnail Strip */}
              {hasMultipleImages && showThumbnails && (
                <div className="flex gap-2 max-w-full overflow-x-auto pb-2">
                  {images.map((image, index) => (
                    <button
                      key={index}
                      onClick={(e) => {
                        e.stopPropagation()
                        onNavigate?.(index)
                      }}
                      className={cn(
                        'relative flex-shrink-0 w-16 h-16 rounded-lg overflow-hidden border-2 transition-colors',
                        index === currentIndex
                          ? 'border-primary-500'
                          : 'border-neutral-600 hover:border-neutral-400'
                      )}
                    >
                      <img
                        src={image.url}
                        alt={image.alt || `Thumbnail ${index + 1}`}
                        className="w-full h-full object-cover"
                      />
                      {/* Number overlay */}
                      {(showNumbers || image.number) && (
                        <div className="absolute top-1 left-1 w-5 h-5 bg-primary-500 rounded-full flex items-center justify-center">
                          <span className="text-xs font-bold text-black">
                            {image.number || index + 1}
                          </span>
                        </div>
                      )}
                    </button>
                  ))}
                </div>
              )}
              
              {/* Actions */}
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
          </div>
        </div>
      </div>
    )
  }
)
ImageLightbox.displayName = 'ImageLightbox'

