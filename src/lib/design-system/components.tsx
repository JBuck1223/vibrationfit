import React from 'react'
import { cn } from '@/lib/utils'

// Button Component with VibrationFit Brand Styling (Pill-shaped, HTML Brand Kit Match)
interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'accent' | 'ghost' | 'danger' | 'outline'
  size?: 'sm' | 'md' | 'lg' | 'xl'
  loading?: boolean
  asChild?: boolean
  responsive?: boolean // New prop for mobile responsiveness
  mobileText?: string // Alternative text for mobile screens
  children: React.ReactNode
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'primary', size = 'md', loading = false, disabled, asChild = false, responsive = false, mobileText, children, ...props }, ref) => {
    const baseClasses = 'inline-flex items-center justify-center font-semibold transition-all duration-300 transform focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-black disabled:opacity-50 disabled:cursor-not-allowed rounded-full'
    
    const variants = {
      primary: 'bg-[#39FF14] hover:bg-[rgba(57,255,20,0.1)] text-black hover:text-[#39FF14] hover:border hover:border-[rgba(57,255,20,0.2)] hover:-translate-y-0.5 shadow-[0_4px_14px_rgba(0,0,0,0.25)] hover:shadow-none active:translate-y-0 active:shadow-none',
      secondary: 'bg-[#00FFFF] hover:bg-[rgba(0,255,255,0.1)] text-black hover:text-[#00FFFF] hover:border hover:border-[rgba(0,255,255,0.2)] hover:-translate-y-0.5 shadow-[0_4px_14px_rgba(0,0,0,0.25)] hover:shadow-none active:translate-y-0 active:shadow-none',
      accent: 'bg-[#BF00FF] hover:bg-[rgba(191,0,255,0.1)] text-white hover:text-[#BF00FF] hover:border hover:border-[rgba(191,0,255,0.2)] hover:-translate-y-0.5 shadow-[0_4px_14px_rgba(0,0,0,0.25)] hover:shadow-none active:translate-y-0 active:shadow-none',
      ghost: 'bg-[rgba(57,255,20,0.1)] text-[#39FF14] border border-[rgba(57,255,20,0.2)] hover:bg-[rgba(57,255,20,0.2)] hover:border-[rgba(57,255,20,0.4)] hover:-translate-y-px shadow-none',
      outline: 'bg-transparent border-2 border-[#39FF14] text-[#39FF14] hover:bg-[#39FF14] hover:text-black hover:-translate-y-0.5 shadow-none hover:shadow-[0_6px_20px_rgba(57,255,20,0.3)]',
      danger: 'bg-[#FF0040] hover:bg-[rgba(255,0,64,0.1)] text-white hover:text-[#FF0040] hover:border hover:border-[rgba(255,0,64,0.2)] hover:-translate-y-0.5 shadow-[0_4px_14px_rgba(0,0,0,0.25)] hover:shadow-none active:translate-y-0 active:shadow-none',
    }
    
    const sizes = {
      sm: 'h-auto py-2 px-3 sm:px-5 text-xs sm:text-sm',
      md: 'h-auto py-2.5 px-4 sm:py-3.5 sm:px-7 text-sm sm:text-base',
      lg: 'h-auto py-3 px-6 sm:py-4.5 sm:px-10 text-base sm:text-lg',
      xl: 'h-auto py-3.5 px-8 sm:py-5 sm:px-12 text-lg sm:text-xl',
    }
    
    const classes = cn(
      baseClasses,
      variants[variant],
      sizes[size],
      className
    )
    
    if (asChild && React.isValidElement(children)) {
      return React.cloneElement(children, {
        className: cn(classes, (children.props as any)?.className),
        disabled: disabled || loading,
        ...props,
      } as React.HTMLAttributes<HTMLElement>)
    }
    
    const renderContent = () => {
      if (loading) {
        return (
          <>
            <Spinner variant="branded" size="sm" className="mr-2" />
            {responsive && mobileText ? (
              <span className="sm:hidden">{mobileText}</span>
            ) : (
              children
            )}
          </>
        )
      }

      if (responsive && mobileText) {
        return (
          <>
            <span className="sm:hidden">{mobileText}</span>
            <span className="hidden sm:inline">{children}</span>
          </>
        )
      }

      return children
    }

    return (
      <button
        className={classes}
        disabled={disabled || loading}
        ref={ref}
        {...props}
      >
        {renderContent()}
      </button>
    )
  }
)
Button.displayName = 'Button'

// Gradient Button (from HTML Brand Kit)
interface GradientButtonProps extends ButtonProps {
  gradient?: 'green' | 'teal' | 'purple' | 'brand' | 'cosmic'
}

export const GradientButton = React.forwardRef<HTMLButtonElement, GradientButtonProps>(
  ({ className, gradient = 'brand', size = 'md', asChild = false, children, ...props }, ref) => {
    const gradients = {
      green: 'bg-gradient-to-r from-[#39FF14] to-[#00FF88] hover:from-[#00FF88] hover:to-[#22C55E]',
      teal: 'bg-gradient-to-r from-[#00FFFF] to-[#06B6D4] hover:from-[#06B6D4] hover:to-[#0F766E]',
      purple: 'bg-gradient-to-r from-[#BF00FF] to-[#FF0080] hover:from-[#FF0080] hover:to-[#A855F7]',
      brand: 'bg-gradient-to-r from-[#39FF14] to-[#00FFFF] hover:from-[#00FF88] hover:to-[#06B6D4]',
      cosmic: 'bg-gradient-to-r from-[#BF00FF] via-[#FF0080] to-[#00FFFF] hover:opacity-90',
    }
    
    const sizes = {
      sm: 'h-auto py-2 px-3 sm:px-5 text-xs sm:text-sm',
      md: 'h-auto py-2.5 px-4 sm:py-3.5 sm:px-7 text-sm sm:text-base',
      lg: 'h-auto py-3 px-6 sm:py-4.5 sm:px-10 text-base sm:text-lg',
      xl: 'h-auto py-3.5 px-8 sm:py-5 sm:px-12 text-lg sm:text-xl',
    }
    
    const classes = cn(
      'inline-flex items-center justify-center font-semibold rounded-full text-black',
      'transition-all duration-300 transform',
      'hover:-translate-y-0.5 shadow-[0_4px_14px_rgba(0,0,0,0.25)]',
      'hover:shadow-[0_6px_20px_rgba(57,255,20,0.4)]',
      'active:translate-y-0 active:shadow-[0_2px_8px_rgba(57,255,20,0.3)]',
      'disabled:opacity-50 disabled:cursor-not-allowed',
      gradients[gradient],
      sizes[size],
      className
    )
    
    if (asChild && React.isValidElement(children)) {
      return React.cloneElement(children, {
        className: cn(classes, (children.props as any)?.className),
        ...props,
      } as React.HTMLAttributes<HTMLElement>)
    }
    
    return (
      <button
        ref={ref}
        className={classes}
        {...props}
      >
        {children}
      </button>
    )
  }
)
GradientButton.displayName = 'GradientButton'

// AI Button with mystical glow effect (from HTML Brand Kit)
export const AIButton = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, size = 'md', asChild = false, children, ...props }, ref) => {
    const sizes = {
      sm: 'h-auto py-2 px-5 text-sm',
      md: 'h-auto py-3.5 px-7 text-base',
      lg: 'h-auto py-4.5 px-10 text-lg',
      xl: 'h-auto py-5 px-12 text-xl',
    }
    
    const classes = cn(
      'inline-flex items-center justify-center font-semibold rounded-full',
      'bg-transparent text-[#BF00FF] border-2 border-[#BF00FF]',
      'shadow-[0_0_20px_rgba(191,0,255,0.3)]',
      'hover:bg-[rgba(191,0,255,0.1)] hover:border-[#A855F7] hover:text-[#A855F7]',
      'hover:-translate-y-0.5 hover:shadow-[0_0_30px_rgba(191,0,255,0.5)]',
      'active:translate-y-0 active:shadow-[0_0_15px_rgba(191,0,255,0.4)]',
      'transition-all duration-300',
      'disabled:opacity-50 disabled:cursor-not-allowed',
      'before:content-["✨"] before:mr-2',
      sizes[size],
      className
    )
    
    if (asChild && React.isValidElement(children)) {
      return React.cloneElement(children, {
        className: cn(classes, (children.props as any)?.className),
        ...props,
      } as React.HTMLAttributes<HTMLElement>)
    }
    
    return (
      <button
        ref={ref}
        className={classes}
        {...props}
      >
        {children}
      </button>
    )
  }
)
AIButton.displayName = 'AIButton'

// Card Component (matching HTML Brand Kit style)
interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'elevated' | 'outlined'
  children: React.ReactNode
}

export const Card = React.forwardRef<HTMLDivElement, CardProps>(
  ({ className, variant = 'default', children, ...props }, ref) => {
    const variants = {
      default: 'bg-[#1F1F1F] border-2 border-[#333] hover:border-[#00CC44] hover:-translate-y-1',
      elevated: 'bg-[#1F1F1F] border-2 border-[#333] shadow-lg hover:border-[#00CC44] hover:-translate-y-1',
      outlined: 'bg-transparent border-2 border-[#333] hover:border-[#00CC44]',
    }
    
    return (
      <div
        ref={ref}
        className={cn(
          'rounded-2xl p-8 transition-all duration-200',
          variants[variant],
          className
        )}
        {...props}
      >
        {children}
      </div>
    )
  }
)
Card.displayName = 'Card'

// Input Component
interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
  helperText?: string
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, label, error, helperText, ...props }, ref) => {
    return (
      <div className="space-y-2">
        {label && (
          <label className="block text-sm font-medium text-[#E5E7EB]">
            {label}
          </label>
        )}
        <input
          className={cn(
            'w-full px-4 py-3 bg-[#404040] border rounded-lg text-white placeholder-[#9CA3AF] focus:outline-none focus:ring-2 focus:ring-[#39FF14] focus:border-transparent transition-all duration-200',
            error ? 'border-[#FF0040] focus:ring-[#FF0040]' : 'border-[#666666]',
            className
          )}
          ref={ref}
          {...props}
        />
        {error && (
          <p className="text-sm text-[#FF0040]">{error}</p>
        )}
        {helperText && !error && (
          <p className="text-sm text-[#9CA3AF]">{helperText}</p>
        )}
      </div>
    )
  }
)
Input.displayName = 'Input'

// Textarea Component
interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string
  error?: string
  helperText?: string
}

export const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, label, error, helperText, ...props }, ref) => {
    return (
      <div className="space-y-2">
        {label && (
          <label className="block text-sm font-medium text-[#E5E7EB]">
            {label}
          </label>
        )}
        <textarea
          className={cn(
            'w-full px-4 py-3 bg-[#404040] border rounded-lg text-white placeholder-[#9CA3AF] focus:outline-none focus:ring-2 focus:ring-[#39FF14] focus:border-transparent transition-all duration-200 resize-none',
            error ? 'border-[#FF0040] focus:ring-[#FF0040]' : 'border-[#666666]',
            className
          )}
          ref={ref}
          {...props}
        />
        {error && (
          <p className="text-sm text-[#FF0040]">{error}</p>
        )}
        {helperText && !error && (
          <p className="text-sm text-[#9CA3AF]">{helperText}</p>
        )}
      </div>
    )
  }
)
Textarea.displayName = 'Textarea'

// Badge Component
interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: 'success' | 'warning' | 'info' | 'error' | 'premium' | 'neutral'
  children: React.ReactNode
}

export const Badge = React.forwardRef<HTMLSpanElement, BadgeProps>(
  ({ className, variant = 'neutral', children, ...props }, ref) => {
    const variants = {
      success: 'bg-[#39FF14]/20 text-[#39FF14] border-[#39FF14]/30',
      warning: 'bg-[#FFFF00]/20 text-[#FFFF00] border-[#FFFF00]/30',
      info: 'bg-[#00FFFF]/20 text-[#00FFFF] border-[#00FFFF]/30',
      error: 'bg-[#FF0040]/20 text-[#FF0040] border-[#FF0040]/30',
      premium: 'bg-[#BF00FF]/20 text-[#BF00FF] border-[#BF00FF]/30',
      neutral: 'bg-[#404040]/50 text-[#9CA3AF] border-[#404040]',
    }
    
    return (
      <span
        ref={ref}
        className={cn(
          'inline-flex items-center px-3 py-1 rounded-full text-sm font-medium border',
          variants[variant],
          className
        )}
        {...props}
      >
        {children}
      </span>
    )
  }
)
Badge.displayName = 'Badge'

// Progress Bar Component
interface ProgressBarProps extends React.HTMLAttributes<HTMLDivElement> {
  value: number
  max?: number
  variant?: 'primary' | 'secondary' | 'accent' | 'warning'
  showLabel?: boolean
  label?: string
}

export const ProgressBar = React.forwardRef<HTMLDivElement, ProgressBarProps>(
  ({ className, value, max = 100, variant = 'primary', showLabel = true, label, ...props }, ref) => {
    const percentage = Math.min(Math.max((value / max) * 100, 0), 100)
    
    const variants = {
      primary: 'bg-gradient-to-r from-[#39FF14] to-[#00FF88]',
      secondary: 'bg-gradient-to-r from-[#00FFFF] to-[#06B6D4]',
      accent: 'bg-gradient-to-r from-[#BF00FF] to-[#FF0080]',
      warning: 'bg-gradient-to-r from-[#FFFF00] to-[#FF6600]',
    }
    
    return (
      <div ref={ref} className={cn('space-y-2', className)} {...props}>
        {showLabel && (
          <div className="flex items-center justify-between">
            <span className="text-sm text-[#9CA3AF]">{label || 'Progress'}</span>
            <span className="text-sm font-semibold text-[#39FF14]">
              {Math.round(percentage)}%
            </span>
          </div>
        )}
        <div className="w-full bg-[#404040] rounded-full h-2">
          <div
            className={cn(
              'h-2 rounded-full transition-all duration-300',
              variants[variant]
            )}
            style={{ width: `${percentage}%` }}
          />
        </div>
      </div>
    )
  }
)
ProgressBar.displayName = 'ProgressBar'

// Loading Spinner Component
interface SpinnerProps extends React.HTMLAttributes<HTMLDivElement> {
  size?: 'sm' | 'md' | 'lg'
  variant?: 'primary' | 'secondary' | 'accent' | 'branded'
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
              alt="VibrationFit Loading"
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

// Container Component
interface ContainerProps extends React.HTMLAttributes<HTMLDivElement> {
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'full'
  children: React.ReactNode
}

export const Container = React.forwardRef<HTMLDivElement, ContainerProps>(
  ({ className, size = 'lg', children, ...props }, ref) => {
    const sizes = {
      sm: 'max-w-2xl',
      md: 'max-w-4xl',
      lg: 'max-w-6xl',
      xl: 'max-w-7xl',
      full: 'max-w-full',
    }
    
    return (
      <div
        ref={ref}
        className={cn(
          'mx-auto px-6',
          sizes[size],
          className
        )}
        {...props}
      >
        {children}
      </div>
    )
  }
)
Container.displayName = 'Container'

// Page Layout Component
interface PageLayoutProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode
}

export const PageLayout = React.forwardRef<HTMLDivElement, PageLayoutProps>(
  ({ className, children, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          'min-h-screen bg-black text-white',
          className
        )}
        {...props}
      >
        {children}
      </div>
    )
  }
)
PageLayout.displayName = 'PageLayout'

// Footer Component
interface FooterProps extends React.HTMLAttributes<HTMLElement> {
  children?: React.ReactNode
}

export const Footer = React.forwardRef<HTMLElement, FooterProps>(
  ({ className, children, ...props }, ref) => {
    return (
      <footer
        ref={ref}
        className={cn(
          'border-t border-[#333] bg-black',
          className
        )}
        {...props}
      >
        {children || (
          <Container size="xl" className="py-12">
            <div className="text-center text-[#9CA3AF]">
              <p className="mb-2">VibrationFit - Above the Green Line</p>
              <p className="text-sm">© 2025 VibrationFit. All rights reserved.</p>
            </div>
          </Container>
        )}
      </footer>
    )
  }
)
Footer.displayName = 'Footer'