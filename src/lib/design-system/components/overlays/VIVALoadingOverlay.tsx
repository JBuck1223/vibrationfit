'use client'

import React, { useState, useEffect } from 'react'
import { cn } from '../shared-utils'
import { Spinner } from '../feedback/Spinner'

interface VIVALoadingOverlayProps extends React.HTMLAttributes<HTMLDivElement> {
  isVisible: boolean
  messages?: string[]
  cycleDuration?: number // milliseconds between message changes
  estimatedTime?: string
  showProgressBar?: boolean
  size?: 'sm' | 'md' | 'lg'
  progress?: number // 0-100, shows actual progress if provided
  estimatedDuration?: number // milliseconds, for auto-calculating progress
}

export const VIVALoadingOverlay = React.forwardRef<HTMLDivElement, VIVALoadingOverlayProps>(
  ({ 
    isVisible,
    messages = [
      "VIVA is bringing your vision to life...",
      "Crafting your perfect experience...",
      "Channeling creative energy...",
      "Putting finishing touches..."
    ],
    cycleDuration = 3000,
    estimatedTime = "This usually takes 15-30 seconds",
    showProgressBar = true,
    size = 'lg',
    progress,
    estimatedDuration,
    className = '',
    ...props
  }, ref) => {
    const [messageIndex, setMessageIndex] = useState(0)
    const [autoProgress, setAutoProgress] = useState(0)

    // Cycle through messages once, then stay on final message
    const [reachedEnd, setReachedEnd] = useState(false)
    
    useEffect(() => {
      if (isVisible && messages.length > 1 && !reachedEnd) {
        const interval = setInterval(() => {
          setMessageIndex((prev) => {
            // Stop at the last message instead of wrapping around
            if (prev >= messages.length - 1) {
              setReachedEnd(true) // Mark as done to clear interval
              return prev // Stay on final message
            }
            return prev + 1
          })
        }, cycleDuration)
        return () => clearInterval(interval)
      }
    }, [isVisible, messages.length, cycleDuration, reachedEnd])

    // Auto-calculate progress based on elapsed time
    // Only use auto-progress if estimatedDuration is provided AND progress is not manually set to 100
    useEffect(() => {
      if (isVisible && estimatedDuration && (progress === undefined || progress < 100)) {
        const startTime = Date.now()
        
        const interval = setInterval(() => {
          const elapsed = Date.now() - startTime
          const linearProgress = Math.min(elapsed / estimatedDuration, 1)
          
          // Easing function: starts fast, slows down at the end (easeOutCubic)
          const easedProgress = 1 - Math.pow(1 - linearProgress, 3)
          
          // Scale from 0% to 95% using eased progress
          const calculatedProgress = easedProgress * 95
          
          setAutoProgress(Math.min(calculatedProgress, 95))
        }, 50) // Update every 50ms for smoother animation
        
        return () => clearInterval(interval)
      }
    }, [isVisible, estimatedDuration, progress])

    // Reset state when overlay becomes visible
    useEffect(() => {
      if (isVisible) {
        setMessageIndex(0)
        setAutoProgress(0)
        setReachedEnd(false)
      }
    }, [isVisible])

    if (!isVisible) return null

    const spinnerSizes = {
      sm: 'md' as const,
      md: 'lg' as const,
      lg: 'lg' as const
    }

    const headingSizes = {
      sm: 'text-base md:text-lg',
      md: 'text-lg md:text-xl',
      lg: 'text-lg sm:text-xl'
    }

    return (
      <div 
        ref={ref}
        className={cn(
          'absolute inset-0 bg-black/80 backdrop-blur-sm rounded-2xl flex flex-col items-center justify-center z-50',
          className
        )}
        {...props}
      >
        <div className="text-center space-y-6 px-4">
          {/* VIVA Logo Spinner */}
          <div className="flex justify-center">
            <Spinner size={spinnerSizes[size]} variant="branded" />
          </div>
          
          {/* Animated Loading Message */}
          <div className="space-y-2">
            <h3 className={cn(
              'font-bold text-white text-center break-words hyphens-auto',
              headingSizes[size]
            )}>
              {messages[messageIndex]}
            </h3>
            <div className="flex justify-center space-x-1">
              <div className="w-2 h-2 bg-primary-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
              <div className="w-2 h-2 bg-secondary-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
              <div className="w-2 h-2 bg-accent-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
            </div>
          </div>
          
          {/* Progress Indicator */}
          {showProgressBar && (
            <div className="flex justify-center">
              <div className="w-80 max-w-full bg-neutral-800 rounded-full h-2.5 overflow-hidden">
                <div 
                  className="h-full bg-gradient-to-r from-primary-500 via-secondary-500 to-accent-500 rounded-full transition-all duration-300 ease-out"
                  style={{ 
                    width: `${progress !== undefined ? progress : autoProgress}%`
                  }}
                ></div>
              </div>
            </div>
          )}
          
          {/* Estimated Time */}
          {estimatedTime && (
            <p className="text-sm text-neutral-400">
              {estimatedTime}
            </p>
          )}
        </div>
      </div>
    )
  }
)
VIVALoadingOverlay.displayName = 'VIVALoadingOverlay'
