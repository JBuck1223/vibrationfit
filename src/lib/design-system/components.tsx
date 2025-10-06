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
      primary: 'bg-[#199D67] hover:bg-[#5EC49A] text-white hover:-translate-y-0.5 shadow-[0_4px_14px_rgba(0,0,0,0.25)] hover:shadow-[0_6px_20px_rgba(25,157,103,0.4)] active:translate-y-0 active:shadow-[0_2px_8px_rgba(25,157,103,0.3)]',
      secondary: 'bg-[#14B8A6] hover:bg-[#2DD4BF] text-white hover:-translate-y-0.5 shadow-[0_4px_14px_rgba(0,0,0,0.25)] hover:shadow-[0_6px_20px_rgba(20,184,166,0.4)] active:translate-y-0 active:shadow-[0_2px_8px_rgba(20,184,166,0.3)]',
      accent: 'bg-[#8B5CF6] hover:bg-[#A78BFA] text-white hover:-translate-y-0.5 shadow-[0_4px_14px_rgba(0,0,0,0.25)] hover:shadow-[0_6px_20px_rgba(139,92,246,0.4)] active:translate-y-0 active:shadow-[0_2px_8px_rgba(139,92,246,0.3)]',
      ghost: 'bg-[rgba(25,157,103,0.1)] text-[#199D67] border border-[rgba(25,157,103,0.2)] hover:bg-[rgba(25,157,103,0.2)] hover:border-[rgba(25,157,103,0.4)] hover:-translate-y-px shadow-none',
      outline: 'bg-transparent border-2 border-[#199D67] text-[#199D67] hover:bg-[#199D67] hover:text-white hover:-translate-y-0.5 shadow-none hover:shadow-[0_6px_20px_rgba(25,157,103,0.3)]',
      danger: 'bg-[#D03739] hover:bg-[#EF4444] text-white hover:-translate-y-0.5 shadow-[0_4px_14px_rgba(0,0,0,0.25)] hover:shadow-[0_6px_20px_rgba(208,55,57,0.4)] active:translate-y-0 active:shadow-[0_2px_8px_rgba(208,55,57,0.3)]',
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
            <svg className="animate-spin -ml-1 mr-2 h-4 w-4" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
            </svg>
            {responsive && mobileText ? (
              <>
                <span className="sm:hidden">{mobileText}</span>
                <span className="hidden sm:inline">{children}</span>
              </>
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
  ({ className, gradient = 'brand', size = 'md', children, ...props }, ref) => {
    const gradients = {
      green: 'bg-gradient-to-r from-[#199D67] to-[#5EC49A] hover:from-[#5EC49A] hover:to-[#2DD4BF]',
      teal: 'bg-gradient-to-r from-[#14B8A6] to-[#2DD4BF] hover:from-[#2DD4BF] hover:to-[#0D9488]',
      purple: 'bg-gradient-to-r from-[#601B9F] to-[#8B5CF6] hover:from-[#8B5CF6] hover:to-[#A78BFA]',
      brand: 'bg-gradient-to-r from-[#199D67] to-[#14B8A6] hover:from-[#5EC49A] hover:to-[#2DD4BF]',
      cosmic: 'bg-gradient-to-r from-[#601B9F] via-[#B629D4] to-[#2DD4BF] hover:opacity-90',
    }
    
    const sizes = {
      sm: 'h-auto py-2 px-3 sm:px-5 text-xs sm:text-sm',
      md: 'h-auto py-2.5 px-4 sm:py-3.5 sm:px-7 text-sm sm:text-base',
      lg: 'h-auto py-3 px-6 sm:py-4.5 sm:px-10 text-base sm:text-lg',
      xl: 'h-auto py-3.5 px-8 sm:py-5 sm:px-12 text-lg sm:text-xl',
    }
    
    return (
      <button
        ref={ref}
        className={cn(
          'inline-flex items-center justify-center font-semibold rounded-full text-white',
          'transition-all duration-300 transform',
          'hover:-translate-y-0.5 shadow-[0_4px_14px_rgba(0,0,0,0.25)]',
          'hover:shadow-[0_6px_20px_rgba(25,157,103,0.4)]',
          'active:translate-y-0 active:shadow-[0_2px_8px_rgba(25,157,103,0.3)]',
          'disabled:opacity-50 disabled:cursor-not-allowed',
          gradients[gradient],
          sizes[size],
          className
        )}
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
  ({ className, size = 'md', children, ...props }, ref) => {
    const sizes = {
      sm: 'h-auto py-2 px-5 text-sm',
      md: 'h-auto py-3.5 px-7 text-base',
      lg: 'h-auto py-4.5 px-10 text-lg',
      xl: 'h-auto py-5 px-12 text-xl',
    }
    
    return (
      <button
        ref={ref}
        className={cn(
          'inline-flex items-center justify-center font-semibold rounded-full',
          'bg-transparent text-[#8B5CF6] border-2 border-[#8B5CF6]',
          'shadow-[0_0_20px_rgba(139,92,246,0.3)]',
          'hover:bg-[rgba(139,92,246,0.1)] hover:border-[#A78BFA] hover:text-[#A78BFA]',
          'hover:-translate-y-0.5 hover:shadow-[0_0_30px_rgba(139,92,246,0.5)]',
          'active:translate-y-0 active:shadow-[0_0_15px_rgba(139,92,246,0.4)]',
          'transition-all duration-300',
          'disabled:opacity-50 disabled:cursor-not-allowed',
          'before:content-["✨"] before:mr-2',
          sizes[size],
          className
        )}
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
      default: 'bg-[#1F1F1F] border-2 border-[#333] hover:border-[#199D67] hover:-translate-y-1',
      elevated: 'bg-[#1F1F1F] border-2 border-[#333] shadow-lg hover:border-[#199D67] hover:-translate-y-1',
      outlined: 'bg-transparent border-2 border-[#333] hover:border-[#199D67]',
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
            'w-full px-4 py-3 bg-[#404040] border rounded-lg text-white placeholder-[#9CA3AF] focus:outline-none focus:ring-2 focus:ring-[#199D67] focus:border-transparent transition-all duration-200',
            error ? 'border-[#D03739] focus:ring-[#D03739]' : 'border-[#666666]',
            className
          )}
          ref={ref}
          {...props}
        />
        {error && (
          <p className="text-sm text-[#D03739]">{error}</p>
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
            'w-full px-4 py-3 bg-[#404040] border rounded-lg text-white placeholder-[#9CA3AF] focus:outline-none focus:ring-2 focus:ring-[#199D67] focus:border-transparent transition-all duration-200 resize-none',
            error ? 'border-[#D03739] focus:ring-[#D03739]' : 'border-[#666666]',
            className
          )}
          ref={ref}
          {...props}
        />
        {error && (
          <p className="text-sm text-[#D03739]">{error}</p>
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
      success: 'bg-[#199D67]/20 text-[#199D67] border-[#199D67]/30',
      warning: 'bg-[#FFB701]/20 text-[#FFB701] border-[#FFB701]/30',
      info: 'bg-[#14B8A6]/20 text-[#14B8A6] border-[#14B8A6]/30',
      error: 'bg-[#D03739]/20 text-[#D03739] border-[#D03739]/30',
      premium: 'bg-[#8B5CF6]/20 text-[#8B5CF6] border-[#8B5CF6]/30',
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
      primary: 'bg-gradient-to-r from-[#199D67] to-[#5EC49A]',
      secondary: 'bg-gradient-to-r from-[#14B8A6] to-[#2DD4BF]',
      accent: 'bg-gradient-to-r from-[#8B5CF6] to-[#A78BFA]',
      warning: 'bg-gradient-to-r from-[#FFB701] to-[#FCD34D]',
    }
    
    return (
      <div ref={ref} className={cn('space-y-2', className)} {...props}>
        {showLabel && (
          <div className="flex items-center justify-between">
            <span className="text-sm text-[#9CA3AF]">{label || 'Progress'}</span>
            <span className="text-sm font-semibold text-[#199D67]">
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
  variant?: 'primary' | 'secondary' | 'accent'
}

export const Spinner = React.forwardRef<HTMLDivElement, SpinnerProps>(
  ({ className, size = 'md', variant = 'primary', ...props }, ref) => {
    const sizes = {
      sm: 'h-4 w-4',
      md: 'h-8 w-8',
      lg: 'h-12 w-12',
    }
    
    const variants = {
      primary: 'text-[#199D67]',
      secondary: 'text-[#14B8A6]',
      accent: 'text-[#8B5CF6]',
    }
    
    return (
      <div
        ref={ref}
        className={cn(
          'animate-spin rounded-full border-2 border-current border-t-transparent',
          sizes[size],
          variants[variant],
          className
        )}
        {...props}
      />
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