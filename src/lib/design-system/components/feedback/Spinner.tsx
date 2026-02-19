'use client'

import React from 'react'
import { cn } from '../shared-utils'

interface SpinnerProps extends React.HTMLAttributes<HTMLDivElement> {
  size?: 'sm' | 'md' | 'lg'
  variant?: 'primary' | 'secondary' | 'accent' | 'branded'
  className?: string
}

export const Spinner = React.forwardRef<HTMLDivElement, SpinnerProps>(
  ({ className, size = 'md', variant = 'primary', ...props }, ref) => {
    const sizes = {
      sm: 'h-4 w-4',
      md: 'h-8 w-8',
      lg: 'h-12 w-12',
    }
    
    const variants = {
      primary: '#39FF14',
      secondary: '#00FFFF',
      accent: '#BF00FF',
    }
    
    if (variant === 'branded') {
      return (
        <div
          ref={ref}
          className={cn('flex items-center justify-center', className)}
          {...props}
        >
          <div className="relative">
            {/* Spinning border - bigger to not cover logo */}
            <div className={cn(
              'absolute inset-0 rounded-full border-2 border-transparent',
              'animate-spin',
              'scale-125'
            )} style={{
              borderTopColor: '#39FF14',
              borderRightColor: '#39FF14'
            }} />
            {/* Original VibrationFit Logo with pulse */}
            <img 
              src="https://media.vibrationfit.com/site-assets/brand/logo/logo-bar.svg"
              alt="Vibration Fit Loading"
              className={cn(
                'relative z-10 logo-loading',
                sizes[size]
              )}
              style={{
                filter: 'brightness(0) saturate(100%) invert(58%) sepia(95%) saturate(1352%) hue-rotate(75deg) brightness(101%) contrast(101%)'
              }}
            />
          </div>
        </div>
      )
    }

    return (
      <div
        ref={ref}
        className={cn('flex items-center justify-center', className)}
        {...props}
      >
        <div className="relative">
          {/* Spinning border - bigger to not cover logo */}
          <div className={cn(
            'absolute inset-0 rounded-full border-2 border-transparent',
            'animate-spin',
            'scale-125'
          )} style={{
            borderTopColor: variants[variant],
            borderRightColor: variants[variant]
          }} />
          {/* VibrationFit Logo Loading Animation with pulse */}
          <img 
            src="https://media.vibrationfit.com/site-assets/brand/logo/logo-bar.svg"
            alt="VibrationFit Loading"
            className={cn(
              'relative z-10 logo-loading',
              sizes[size]
            )}
            style={{
              filter: variant === 'primary' ? 'brightness(0) saturate(100%) invert(58%) sepia(95%) saturate(1352%) hue-rotate(75deg) brightness(101%) contrast(101%)' :
                     variant === 'secondary' ? 'brightness(0) saturate(100%) invert(70%) sepia(100%) saturate(2000%) hue-rotate(180deg) brightness(100%) contrast(100%)' :
                     'brightness(0) saturate(100%) invert(25%) sepia(100%) saturate(2000%) hue-rotate(270deg) brightness(100%) contrast(100%)'
            }}
          />
        </div>
      </div>
    )
  }
)
Spinner.displayName = 'Spinner'

