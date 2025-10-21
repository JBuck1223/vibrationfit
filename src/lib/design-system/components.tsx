// VibrationFit Design System - Component Library
// Mobile-First, Neon Cyberpunk Aesthetic
// Path: /src/lib/design-system/components.tsx

import React from 'react'
import { LucideIcon, Sparkles, Check } from 'lucide-react'

// ============================================================================
// UTILITY FUNCTION
// ============================================================================
const cn = (...classes: (string | undefined | false)[]) => {
  return classes.filter(Boolean).join(' ')
}

// ============================================================================
// RESPONSIVE DESIGN GUIDELINES
// ============================================================================

/**
 * MOBILE-FIRST RESPONSIVE DESIGN RULES
 * 
 * 1. GRID MINWIDTH RULES:
 *    ❌ NEVER use minWidth > 350px for mobile compatibility
 *    ✅ USE minWidth="300px" or smaller for mobile-first grids
 *    ✅ USE minWidth="200px" for category cards and small items
 * 
 * 2. TEXT SIZE RULES:
 *    ❌ NEVER use fixed large text (text-4xl, text-5xl) without responsive variants
 *    ✅ ALWAYS use responsive text: text-xl md:text-4xl
 *    ✅ MOBILE: text-sm, text-base, text-lg, text-xl (max)
 *    ✅ DESKTOP: text-xl, text-2xl, text-3xl, text-4xl, text-5xl
 * 
 * 3. SPACING RULES:
 *    ❌ NEVER use fixed large spacing (mx-8, mx-12) on mobile
 *    ✅ ALWAYS use responsive spacing: mx-2 md:mx-4
 *    ✅ MOBILE: mx-1, mx-2, mx-3, mx-4 (max)
 *    ✅ DESKTOP: mx-4, mx-6, mx-8, mx-12
 * 
 * 4. PADDING RULES:
 *    ❌ NEVER use excessive padding (p-12, p-16) on mobile
 *    ✅ ALWAYS use responsive padding: p-4 md:p-8
 *    ✅ MOBILE: p-2, p-4, p-6 (max)
 *    ✅ DESKTOP: p-6, p-8, p-12, p-16
 * 
 * 5. GRID BREAKPOINT RULES:
 *    ❌ NEVER use minmax(400px, 1fr) - causes mobile overflow
 *    ✅ USE minmax(280px, 1fr) or smaller for mobile compatibility
 *    ✅ USE Grid minWidth="300px" for standard content
 *    ✅ USE Grid minWidth="200px" for small items
 * 
 * 6. CONTAINER RULES:
 *    ✅ ALWAYS use PageLayout component for consistent container sizing
 *    ✅ USE containerSize="lg" (1400px) for sidebar-compatible layouts
 *    ✅ USE containerSize="xl" (1600px) for full-width content
 * 
 * 7. TESTING CHECKLIST:
 *    ✅ Test on iPhone SE (375px width) - smallest common mobile
 *    ✅ Test on iPhone 12/13/14 (390px width) - standard mobile
 *    ✅ Test on iPad (768px width) - tablet breakpoint
 *    ✅ Test on desktop (1200px+ width) - desktop experience
 * 
 * 8. COMMON MOBILE OVERFLOW PATTERNS TO AVOID:
 *    ❌ Long text without responsive sizing
 *    ❌ Grid items with minWidth > 350px
 *    ❌ Fixed large margins/padding
 *    ❌ Wide tables or data displays
 *    ❌ Long form fields without wrapping
 */

// ============================================================================
// 1. LAYOUT PRIMITIVES
// ============================================================================

// Stack - Vertical rhythm with consistent gaps
interface StackProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode
  gap?: 'xs' | 'sm' | 'md' | 'lg' | 'xl'
  align?: 'start' | 'center' | 'end' | 'stretch'
}

export const Stack = React.forwardRef<HTMLDivElement, StackProps>(
  ({ children, gap = 'md', align = 'stretch', className = '', ...props }, ref) => {
    const gaps = {
      xs: 'gap-2',
      sm: 'gap-4',
      md: 'gap-6',
      lg: 'gap-8',
      xl: 'gap-12'
    }
    
    const alignments = {
      start: 'items-start',
      center: 'items-center',
      end: 'items-end',
      stretch: 'items-stretch'
    }
    
    return (
      <div 
        ref={ref}
        className={cn('flex flex-col', gaps[gap], alignments[align], className)}
        {...props}
      >
        {children}
      </div>
    )
  }
)
Stack.displayName = 'Stack'

// Inline/Cluster - Mobile-first responsive horizontal row
interface InlineProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode
  gap?: 'xs' | 'sm' | 'md' | 'lg'
  align?: 'start' | 'center' | 'end' | 'stretch'
  justify?: 'start' | 'center' | 'end' | 'between' | 'around'
  wrap?: boolean
}

export const Inline = React.forwardRef<HTMLDivElement, InlineProps>(
  ({ children, gap = 'md', align = 'center', justify = 'start', wrap = true, className = '', ...props }, ref) => {
    const gaps = {
      xs: 'gap-2',
      sm: 'gap-4',
      md: 'gap-6',
      lg: 'gap-8'
    }
    
    const alignments = {
      start: 'items-start',
      center: 'items-center',
      end: 'items-end',
      stretch: 'items-stretch'
    }
    
    const justifications = {
      start: 'justify-start',
      center: 'justify-center',
      end: 'justify-end',
      between: 'justify-between',
      around: 'justify-around'
    }
    
    return (
      <div 
        ref={ref}
        className={cn(
          'flex flex-col md:flex-row',
          wrap ? 'flex-wrap' : '',
          gaps[gap],
          alignments[align],
          justifications[justify],
          className
        )}
        {...props}
      >
        {React.Children.map(children, (child) => {
          if (React.isValidElement(child)) {
            return React.cloneElement(child as any, {
              className: cn(
                'w-full md:flex-1',
                (child as any).props.className
              )
            })
          }
          return child
        })}
      </div>
    )
  }
)
Inline.displayName = 'Inline'

// Grid - Intrinsic grid with auto card wrapping
interface GridProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode
  cols?: number
  minWidth?: string
  gap?: 'xs' | 'sm' | 'md' | 'lg'
}

export const Grid = React.forwardRef<HTMLDivElement, GridProps>(
  ({ children, cols, minWidth = '300px', gap = 'md', className = '', ...props }, ref) => {
    const gaps = {
      xs: 'gap-2',
      sm: 'gap-4',
      md: 'gap-6',
      lg: 'gap-8'
    }
    
    const gridStyle = cols 
      ? { gridTemplateColumns: `repeat(${cols}, 1fr)` }
      : { gridTemplateColumns: `repeat(auto-fit, minmax(${minWidth}, 1fr))` }

    return (
      <div 
        ref={ref}
        className={cn('grid', gaps[gap], className)}
        style={gridStyle}
        {...props}
      >
        {children}
      </div>
    )
  }
)
Grid.displayName = 'Grid'

// TwoColumn - Responsive two column layout that stacks on mobile
interface TwoColumnProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode
  gap?: 'xs' | 'sm' | 'md' | 'lg'
  reverse?: boolean // Reverse order on mobile
}

export const TwoColumn = React.forwardRef<HTMLDivElement, TwoColumnProps>(
  ({ children, gap = 'md', reverse = false, className = '', ...props }, ref) => {
    const gaps = {
      xs: 'gap-2',
      sm: 'gap-4',
      md: 'gap-6',
      lg: 'gap-8'
    }
    
    const direction = reverse ? 'flex-col md:flex-row-reverse' : 'flex-col md:flex-row'
    
    return (
      <div 
        ref={ref}
        className={cn('flex w-full', direction, gaps[gap], className)}
        {...props}
      >
        {React.Children.map(children, (child) => (
          <div className="w-full md:w-1/2">
            {child}
          </div>
        ))}
      </div>
    )
  }
)
TwoColumn.displayName = 'TwoColumn'

// FourColumn - Responsive four column layout (2x2 on mobile, 4x1 on desktop)
interface FourColumnProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode
  gap?: 'xs' | 'sm' | 'md' | 'lg'
}

export const FourColumn = React.forwardRef<HTMLDivElement, FourColumnProps>(
  ({ children, gap = 'md', className = '', ...props }, ref) => {
    const gaps = {
      xs: 'gap-2',
      sm: 'gap-4',
      md: 'gap-6',
      lg: 'gap-8'
    }
    
    return (
      <div 
        ref={ref}
        className={cn('grid grid-cols-2 md:grid-cols-4', gaps[gap], className)}
        {...props}
      >
        {children}
      </div>
    )
  }
)
FourColumn.displayName = 'FourColumn'

// Switcher - Toggles from row to column when items don't fit
interface SwitcherProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode
  gap?: 'xs' | 'sm' | 'md' | 'lg'
}

export const Switcher = React.forwardRef<HTMLDivElement, SwitcherProps>(
  ({ children, gap = 'md', className = '', ...props }, ref) => {
    const gaps = {
      xs: 'gap-2',
      sm: 'gap-4',
      md: 'gap-6',
      lg: 'gap-8'
    }
    
    return (
      <div 
        ref={ref}
        className={cn('flex flex-col md:flex-row', gaps[gap], className)}
        {...props}
      >
        {children}
      </div>
    )
  }
)
Switcher.displayName = 'Switcher'

// Cover - Hero that centers content with min-height
interface CoverProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode
  minHeight?: string
}

export const Cover = React.forwardRef<HTMLDivElement, CoverProps>(
  ({ children, minHeight = '400px', className = '', ...props }, ref) => {
    return (
      <div 
        ref={ref}
        className={cn('flex flex-col items-center justify-center p-6 md:p-12', className)}
        style={{ minHeight }}
        {...props}
      >
        {children}
      </div>
    )
  }
)
Cover.displayName = 'Cover'

// Frame - Aspect ratio media wrapper
interface FrameProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode
  ratio?: string
}

export const Frame = React.forwardRef<HTMLDivElement, FrameProps>(
  ({ children, ratio = '16/9', className = '', ...props }, ref) => {
    return (
      <div 
        ref={ref}
        className={cn('relative w-full', className)} 
        style={{ aspectRatio: ratio }}
        {...props}
      >
        <div className="absolute inset-0">
          {children}
        </div>
      </div>
    )
  }
)
Frame.displayName = 'Frame'

// Container - Page width container
interface ContainerProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode
  size?: 'sm' | 'md' | 'default' | 'lg' | 'xl' | 'full'
}

export const Container = React.forwardRef<HTMLDivElement, ContainerProps>(
  ({ children, size = 'default', className = '', ...props }, ref) => {
    const sizes = {
      sm: 'max-w-3xl',
      md: 'max-w-5xl',
      default: 'max-w-7xl',
      lg: 'max-w-[1400px]',
      xl: 'max-w-[1600px]',
      full: 'max-w-full'
    }
    
    return (
      <div 
        ref={ref}
        className={cn('mx-auto px-4 sm:px-6 lg:px-8 w-full', sizes[size], className)}
        {...props}
      >
        {children}
      </div>
    )
  }
)
Container.displayName = 'Container'

// ============================================================================
// 2. UI COMPONENTS
// ============================================================================

// Card Component
interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode
  variant?: 'default' | 'elevated' | 'outlined' | 'glass'
  hover?: boolean
}

export const Card = React.forwardRef<HTMLDivElement, CardProps>(
  ({ children, variant = 'default', hover = false, className = '', ...props }, ref) => {
    const variants = {
      default: 'bg-[#1F1F1F] border-2 border-[#333]',
      elevated: 'bg-[#1F1F1F] border-2 border-[#333] shadow-xl',
      outlined: 'bg-transparent border-2 border-[#333]',
      glass: 'bg-[#1F1F1F]/50 backdrop-blur-lg border border-[#333]/50'
    }
    
    const hoverEffect = hover ? 'hover:border-[#00CC44] hover:-translate-y-1 transition-all duration-200' : ''
    
    return (
      <div 
        ref={ref}
        className={cn('rounded-2xl p-6 md:p-8', variants[variant], hoverEffect, className)}
        {...props}
      >
        {children}
      </div>
    )
  }
)
Card.displayName = 'Card'

// Button Component
interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode
  variant?: 'primary' | 'secondary' | 'accent' | 'ghost' | 'outline' | 'danger'
  size?: 'sm' | 'md' | 'lg' | 'xl'
  fullWidth?: boolean
  loading?: boolean
  asChild?: boolean
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ children, variant = 'primary', size = 'md', fullWidth = false, loading = false, disabled, asChild = false, className = '', ...props }, ref) => {
    const variants = {
      primary: `
        bg-[#39FF14] text-black font-semibold
        hover:bg-[rgba(57,255,20,0.1)] hover:text-[#39FF14] 
        hover:border hover:border-[rgba(57,255,20,0.2)]
        shadow-[0_4px_14px_rgba(0,0,0,0.25)]
        hover:shadow-none
        hover:-translate-y-0.5
        active:translate-y-0 active:shadow-none
      `,
      secondary: `
        bg-[#00FFFF] text-black font-semibold
        hover:bg-[rgba(0,255,255,0.1)] hover:text-[#00FFFF]
        hover:border hover:border-[rgba(0,255,255,0.2)]
        shadow-[0_4px_14px_rgba(0,0,0,0.25)]
        hover:shadow-none
        hover:-translate-y-0.5
        active:translate-y-0 active:shadow-none
      `,
      accent: `
        bg-[#BF00FF] text-white font-semibold
        hover:bg-[rgba(191,0,255,0.1)] hover:text-[#BF00FF]
        hover:border hover:border-[rgba(191,0,255,0.2)]
        shadow-[0_4px_14px_rgba(0,0,0,0.25)]
        hover:shadow-none
        hover:-translate-y-0.5
        active:translate-y-0 active:shadow-none
      `,
      ghost: `
        bg-[rgba(57,255,20,0.1)] text-[#39FF14] 
        border border-[rgba(57,255,20,0.2)]
        hover:bg-[rgba(57,255,20,0.2)] hover:border-[rgba(57,255,20,0.4)]
        hover:-translate-y-px
        shadow-none
      `,
      outline: `
        bg-transparent border-2 border-[#39FF14] text-[#39FF14]
        hover:bg-[#39FF14] hover:text-black
        hover:-translate-y-0.5
        shadow-none hover:shadow-[0_6px_20px_rgba(57,255,20,0.3)]
      `,
      danger: `
        bg-[#FF0040] text-white font-semibold
        hover:bg-[rgba(255,0,64,0.1)] hover:text-[#FF0040]
        hover:border hover:border-[rgba(255,0,64,0.2)]
        shadow-[0_4px_14px_rgba(0,0,0,0.25)]
        hover:shadow-none
        hover:-translate-y-0.5
        active:translate-y-0 active:shadow-none
      `,
    }
    
    const sizes = {
      sm: 'px-3 py-2 text-xs md:text-sm md:px-5 gap-1.5',
      md: 'px-3 py-2.5 text-xs md:text-sm md:px-7 md:py-3 gap-2',
      lg: 'px-4 py-3 text-sm md:text-base md:px-10 md:py-4 gap-2.5',
      xl: 'px-4 py-3.5 text-sm md:text-base md:px-6 md:py-4 gap-3',
    }
    
    const buttonClasses = cn(
      'inline-flex items-center justify-center',
      'rounded-full transition-all duration-300 transform disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap',
      variants[variant],
      sizes[size],
      fullWidth ? 'w-full' : '',
      className
    )

    if (asChild && React.isValidElement(children)) {
      return React.cloneElement(children as React.ReactElement<any>, {
        className: cn(buttonClasses, (children as any).props.className),
        disabled: disabled || loading,
        ...props
      })
    }

    return (
      <button
        ref={ref}
        disabled={disabled || loading}
        className={buttonClasses}
        {...props}
      >
        {loading ? 'Loading...' : children}
      </button>
    )
  }
)
Button.displayName = 'Button'

// Icon Component Wrapper
interface IconProps {
  icon: LucideIcon
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl'
  color?: string
  className?: string
}

export const Icon: React.FC<IconProps> = ({ icon: IconComponent, size = 'md', color = 'currentColor', className = '' }) => {
  const sizes = {
    xs: 16,
    sm: 20,
    md: 24,
    lg: 32,
    xl: 48
  }
  
  return (
    <IconComponent 
      size={sizes[size]} 
      color={color} 
      className={cn('flex-shrink-0', className)}
      strokeWidth={2}
    />
  )
}

// Select/Dropdown Component
interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string
  options: Array<{ value: string; label: string }>
  placeholder?: string
}

export const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  ({ label, options, placeholder = 'Select...', className = '', ...props }, ref) => {
    return (
      <div className={cn('w-full', className)}>
        {label && (
          <label className="block text-sm font-medium text-[#E5E7EB] mb-2">
            {label}
          </label>
        )}
        <select
          ref={ref}
          className="
            w-full px-4 py-3 
            bg-[#404040] 
            border-2 border-[#666666] 
            rounded-xl 
            text-white
            focus:outline-none 
            focus:ring-2 
            focus:ring-[#39FF14]
            focus:border-[#39FF14]
            cursor-pointer
            transition-all duration-200
          "
          {...props}
        >
          <option value="">{placeholder}</option>
          {options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>
    )
  }
)
Select.displayName = 'Select'

// Badge Component
interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  children: React.ReactNode
  variant?: 'primary' | 'secondary' | 'accent' | 'success' | 'warning' | 'danger' | 'error' | 'info' | 'premium' | 'neutral'
}

export const Badge = React.forwardRef<HTMLSpanElement, BadgeProps>(
  ({ children, variant = 'primary', className = '', ...props }, ref) => {
    const variants = {
      primary: 'bg-[#39FF14]/20 text-[#39FF14] border-[#39FF14]/30',
      secondary: 'bg-[#00FFFF]/20 text-[#00FFFF] border-[#00FFFF]/30',
      accent: 'bg-[#BF00FF]/20 text-[#BF00FF] border-[#BF00FF]/30',
      success: 'bg-green-500/20 text-green-400 border-green-500/30',
      warning: 'bg-[#FFFF00]/20 text-[#FFFF00] border-[#FFFF00]/30',
      danger: 'bg-[#FF0040]/20 text-[#FF0040] border-[#FF0040]/30',
      error: 'bg-red-500/20 text-red-400 border-red-500/30',
      info: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
      premium: 'bg-gradient-to-r from-[#BF00FF]/20 to-[#8B5CF6]/20 text-[#BF00FF] border-[#BF00FF]/30',
      neutral: 'bg-[#404040]/50 text-[#9CA3AF] border-[#404040]'
    }
    
    return (
      <span 
        ref={ref}
        className={cn(
          'inline-flex items-center justify-center px-3 py-1 rounded-full text-xs md:text-sm font-semibold border',
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

// Input Component
interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
  helperText?: string
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, helperText, className = '', ...props }, ref) => {
    return (
      <div className="space-y-2 w-full">
        {label && (
          <label className="block text-sm font-medium text-[#E5E7EB]">
            {label}
          </label>
        )}
        <input
          ref={ref}
          className={cn(
            'w-full px-4 py-3 bg-[#404040] border-2 rounded-xl text-white placeholder-[#9CA3AF]',
            'focus:outline-none focus:ring-2 transition-all duration-200',
            error 
              ? 'border-[#FF0040] focus:ring-[#FF0040] focus:border-[#FF0040]' 
              : 'border-[#666666] focus:ring-[#39FF14] focus:border-[#39FF14]',
            className
          )}
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
  ({ label, error, helperText, className = '', ...props }, ref) => {
    return (
      <div className="space-y-2 w-full">
        {label && (
          <label className="block text-sm font-medium text-[#E5E7EB]">
            {label}
          </label>
        )}
        <textarea
          ref={ref}
          className={cn(
            'w-full px-4 py-3 bg-[#404040] border-2 rounded-xl text-white placeholder-[#9CA3AF]',
            'focus:outline-none focus:ring-2 transition-all duration-200 resize-none',
            error 
              ? 'border-[#FF0040] focus:ring-[#FF0040] focus:border-[#FF0040]' 
              : 'border-[#666666] focus:ring-[#39FF14] focus:border-[#39FF14]',
            className
          )}
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

// Page Layout Component - Standardized site-wide layout
interface PageLayoutProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode
  containerSize?: 'sm' | 'md' | 'default' | 'lg' | 'xl' | 'full'
  showHeader?: boolean
  headerContent?: React.ReactNode
}

export const PageLayout = React.forwardRef<HTMLDivElement, PageLayoutProps>(
  ({ children, containerSize = 'lg', showHeader = false, headerContent, className = '', ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn('min-h-screen bg-black text-white', className)}
        {...props}
      >
        {showHeader && (
          <div className="sticky top-0 z-50 bg-[#1F1F1F] border-b-2 border-[#333]">
            <Container size={containerSize}>
              <div className="py-4">
                {headerContent}
              </div>
            </Container>
          </div>
        )}
        
        <Container size={containerSize} className="py-12">
          {children}
        </Container>
      </div>
    )
  }
)
PageLayout.displayName = 'PageLayout'

// ============================================================================
// 3. FEEDBACK COMPONENTS
// ============================================================================

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

// ProgressBar - Progress indicator
interface ProgressBarProps extends React.HTMLAttributes<HTMLDivElement> {
  value: number
  max?: number
  variant?: 'primary' | 'secondary' | 'accent' | 'success' | 'warning' | 'danger'
  size?: 'sm' | 'md' | 'lg'
  showLabel?: boolean
  label?: string
  className?: string
}

export const ProgressBar = React.forwardRef<HTMLDivElement, ProgressBarProps>(
  ({ 
    value, 
    max = 100, 
    variant = 'primary', 
    size = 'md', 
    showLabel = false, 
    label, 
    className = '', 
    ...props 
  }, ref) => {
    const percentage = Math.min(Math.max((value / max) * 100, 0), 100)
    
    const sizes = {
      sm: 'h-2',
      md: 'h-3',
      lg: 'h-4'
    }
    
    const variants = {
      primary: 'bg-[#39FF14]',
      secondary: 'bg-[#00FFFF]',
      accent: 'bg-[#BF00FF]',
      success: 'bg-green-500',
      warning: 'bg-yellow-500',
      danger: 'bg-red-500'
    }
    
    return (
      <div className={cn('w-full', className)} {...props}>
        {showLabel && (
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm text-neutral-300">
              {label || `${Math.round(percentage)}%`}
            </span>
            <span className="text-sm text-neutral-400">
              {value}/{max}
            </span>
          </div>
        )}
        <div
          ref={ref}
          className={cn(
            'w-full bg-neutral-800 rounded-full overflow-hidden',
            sizes[size]
          )}
        >
          <div
            className={cn(
              'h-full transition-all duration-500 ease-out rounded-full',
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

// Removed GradientButton - colors are already poppy enough

// VIVAButton - Special button for VIVA features
interface VIVAButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  size?: 'sm' | 'md' | 'lg' | 'xl'
  children: React.ReactNode
  className?: string
  asChild?: boolean
}

export const VIVAButton = React.forwardRef<HTMLButtonElement, VIVAButtonProps>(
  ({ size = 'md', children, asChild = false, className = '', ...props }, ref) => {
    const sizes = {
      sm: 'px-4 py-2 text-xs md:text-sm',
      md: 'px-6 py-3 text-sm md:text-base',
      lg: 'px-8 py-4 text-sm md:text-base', // Reduced from text-base/text-lg to text-sm/text-base
      xl: 'px-12 py-6 text-base md:text-lg' // Reduced from text-lg/text-xl to text-base/text-lg
    }
    
    const buttonClasses = cn(
      'inline-flex items-center justify-center font-semibold rounded-full transition-all duration-300 transform hover:-translate-y-0.5 hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-black disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap',
      'bg-[#BF00FF] text-white hover:bg-[rgba(191,0,255,0.1)] hover:text-[#BF00FF] hover:border hover:border-[rgba(191,0,255,0.2)] shadow-[0_4px_14px_rgba(0,0,0,0.25)] hover:shadow-none active:translate-y-0 active:shadow-none',
      sizes[size],
      className
    )

    if (asChild && React.isValidElement(children)) {
      return React.cloneElement(children as React.ReactElement<any>, {
        className: cn(buttonClasses, (children as any).props.className),
        ...props
      })
    }

    return (
      <button
        ref={ref}
        className={buttonClasses}
        {...props}
      >
        {children}
      </button>
    )
  }
)

VIVAButton.displayName = 'VIVAButton'

// ============================================================================
// 6. MEDIA COMPONENTS
// ============================================================================

// Video - Lightning-fast S3 video player with VibrationFit styling and engagement tracking
interface VideoProps extends React.VideoHTMLAttributes<HTMLVideoElement> {
  src: string
  poster?: string
  variant?: 'default' | 'hero' | 'card'
  autoplay?: boolean
  muted?: boolean
  loop?: boolean
  controls?: boolean
  className?: string
  // Performance optimization
  preload?: 'none' | 'metadata' | 'auto'
  quality?: 'auto' | 'high' | 'medium' | 'low'
  // Engagement tracking props
  onMilestoneReached?: (milestone: 25 | 50 | 75 | 95, currentTime: number) => void
  onLeadCapture?: (data: { name: string; email: string }) => void
  showLeadCaptureAt?: 25 | 50 | 75 | 95
  trackingId?: string
  saveProgress?: boolean
  // Analytics
  onPlay?: () => void
  onPause?: () => void
  onComplete?: () => void
}

export const Video = React.forwardRef<HTMLVideoElement, VideoProps>(
  ({ 
    src, 
    poster, 
    variant = 'default', 
    autoplay = false, 
    muted = false, 
    loop = false, 
    controls = true,
    className = '',
    preload = 'metadata',
    quality = 'auto',
    onMilestoneReached,
    onLeadCapture,
    showLeadCaptureAt,
    trackingId,
    saveProgress = true,
    onPlay,
    onPause,
    onComplete,
    ...props 
  }, ref) => {
    const videoRef = React.useRef<HTMLVideoElement>(null)
    const [currentTime, setCurrentTime] = React.useState(0)
    const [duration, setDuration] = React.useState(0)
    const [isPlaying, setIsPlaying] = React.useState(false)
    const [milestonesReached, setMilestonesReached] = React.useState<Set<number>>(new Set())
    const [showLeadForm, setShowLeadForm] = React.useState(false)
    const [leadFormData, setLeadFormData] = React.useState({ name: '', email: '' })

    const variants = {
      default: 'rounded-xl border-2 border-[#404040]',
      hero: 'rounded-3xl border-2 border-[#39FF14] shadow-[0_0_20px_rgba(57,255,20,0.3)]',
      card: 'rounded-2xl border border-[#404040]'
    }

    // Combine refs
    React.useImperativeHandle(ref, () => videoRef.current!)

    // Load saved progress
    React.useEffect(() => {
      if (saveProgress && trackingId) {
        const savedTime = localStorage.getItem(`video-progress-${trackingId}`)
        if (savedTime && videoRef.current) {
          videoRef.current.currentTime = parseFloat(savedTime)
        }
      }
    }, [trackingId, saveProgress])

    // Track progress and milestones
    const handleTimeUpdate = () => {
      if (!videoRef.current) return
      
      const time = videoRef.current.currentTime
      const total = videoRef.current.duration
      
      setCurrentTime(time)
      setDuration(total)

      // Save progress to localStorage
      if (saveProgress && trackingId) {
        localStorage.setItem(`video-progress-${trackingId}`, time.toString())
      }

      // Check milestones
      if (total > 0) {
        const percentage = (time / total) * 100
        const milestones = [25, 50, 75, 95]
        
        milestones.forEach(milestone => {
          if (percentage >= milestone && !milestonesReached.has(milestone)) {
            setMilestonesReached(prev => new Set([...prev, milestone]))
            onMilestoneReached?.(milestone as 25 | 50 | 75 | 95, time)
            
            // Show lead capture form if specified
            if (showLeadCaptureAt === milestone) {
              setShowLeadForm(true)
            }
          }
        })
      }
    }

    const handleLoadedMetadata = () => {
      if (videoRef.current) {
        setDuration(videoRef.current.duration)
      }
    }

    const handlePlay = () => {
      setIsPlaying(true)
      onPlay?.()
    }

    const handlePause = () => {
      setIsPlaying(false)
      onPause?.()
    }

    const handleEnded = () => {
      onComplete?.()
    }

    // Use the provided src directly - quality selection handled by the URL
    const getOptimizedSrc = () => {
      return src
    }

    const handleLeadSubmit = (e: React.FormEvent) => {
      e.preventDefault()
      onLeadCapture?.(leadFormData)
      setShowLeadForm(false)
      setLeadFormData({ name: '', email: '' })
    }

    const handlePlayButtonClick = () => {
      if (videoRef.current) {
        videoRef.current.play()
      }
    }


    return (
      <div className={cn('relative overflow-hidden', variants[variant], className)}>
        <video
          ref={videoRef}
          src={getOptimizedSrc()}
          poster={poster}
          autoPlay={autoplay}
          muted={muted}
          loop={loop}
          controls={controls}
          preload={preload}
          onTimeUpdate={handleTimeUpdate}
          onLoadedMetadata={handleLoadedMetadata}
          onPlay={handlePlay}
          onPause={handlePause}
          onEnded={handleEnded}
          className="w-full h-auto"
          style={{
            aspectRatio: '16/9'
          }}
          {...props}
        />
        
        {!controls && !isPlaying && (
          <div 
            className="absolute inset-0 flex items-center justify-center bg-black/20 cursor-pointer"
            onClick={handlePlayButtonClick}
          >
            <div className="w-20 h-14 bg-[#D03739] rounded-lg flex items-center justify-center shadow-lg border border-white/20">
              <div className="w-0 h-0 border-l-[16px] border-l-white border-y-[10px] border-y-transparent ml-1"></div>
            </div>
          </div>
        )}

        {/* Lead Capture Form Overlay */}
        {showLeadForm && (
          <div className="absolute inset-0 bg-black/80 flex items-center justify-center p-4">
            <div className="bg-[#1F1F1F] border-2 border-[#39FF14] rounded-2xl p-6 max-w-md w-full">
              <h3 className="text-xl font-semibold text-white mb-4">
                Get More VibrationFit Content
              </h3>
              <form onSubmit={handleLeadSubmit} className="space-y-4">
                <input
                  type="text"
                  placeholder="Your Name"
                  value={leadFormData.name}
                  onChange={(e) => setLeadFormData(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full px-4 py-3 bg-[#404040] border-2 border-[#39FF14] rounded-xl text-white placeholder-[#9CA3AF] focus:outline-none focus:ring-2 focus:ring-[#39FF14]"
                  required
                />
                <input
                  type="email"
                  placeholder="Your Email"
                  value={leadFormData.email}
                  onChange={(e) => setLeadFormData(prev => ({ ...prev, email: e.target.value }))}
                  className="w-full px-4 py-3 bg-[#404040] border-2 border-[#39FF14] rounded-xl text-white placeholder-[#9CA3AF] focus:outline-none focus:ring-2 focus:ring-[#39FF14]"
                  required
                />
                <div className="flex gap-3">
                  <button
                    type="submit"
                    className="flex-1 bg-[#39FF14] text-black font-semibold py-3 px-6 rounded-xl hover:bg-[#00FF88] transition-colors"
                  >
                    Continue Watching
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowLeadForm(false)}
                    className="px-4 py-3 bg-[#404040] text-white rounded-xl hover:bg-[#666666] transition-colors"
                  >
                    Skip
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Progress Indicator - Only show when controls are disabled */}
        {!controls && duration > 0 && (
          <div className="absolute bottom-2 left-2 right-2 bg-black/50 rounded-full h-1">
            <div 
              className="bg-[#39FF14] h-full rounded-full transition-all duration-300"
              style={{ width: `${(currentTime / duration) * 100}%` }}
            />
          </div>
        )}
      </div>
    )
  }
)
Video.displayName = 'Video'

// ============================================================================
// 7. OVERLAY COMPONENTS
// ============================================================================

// Modal - Accessible modal with overlay and animations
interface ModalProps extends React.HTMLAttributes<HTMLDivElement> {
  isOpen: boolean
  onClose: () => void
  title?: string
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'full'
  variant?: 'default' | 'hero' | 'card'
  children: React.ReactNode
}

export const Modal = React.forwardRef<HTMLDivElement, ModalProps>(
  ({ 
    isOpen, 
    onClose, 
    title, 
    size = 'md', 
    variant = 'default',
    children, 
    className = '',
    ...props 
  }, ref) => {
    const sizes = {
      sm: 'max-w-md',
      md: 'max-w-2xl',
      lg: 'max-w-4xl',
      xl: 'max-w-6xl',
      full: 'max-w-full mx-4'
    }
    
    const variants = {
      default: 'bg-[#1F1F1F] border-2 border-[#404040]',
      hero: 'bg-gradient-to-br from-[#1F1F1F] to-[#000000] border-2 border-[#39FF14] shadow-[0_0_30px_rgba(57,255,20,0.4)]',
      card: 'bg-[#1F1F1F] border border-[#404040]'
    }
    
    React.useEffect(() => {
      const handleEscape = (e: KeyboardEvent) => {
        if (e.key === 'Escape') onClose()
      }
      
      if (isOpen) {
        document.addEventListener('keydown', handleEscape)
        document.body.style.overflow = 'hidden'
      }
      
      return () => {
        document.removeEventListener('keydown', handleEscape)
        document.body.style.overflow = 'unset'
      }
    }, [isOpen, onClose])
    
    if (!isOpen) return null
    
    return (
      <div 
        className="fixed inset-0 z-50 flex items-center justify-center p-4"
        role="dialog"
        aria-modal="true"
        aria-labelledby={title ? 'modal-title' : undefined}
      >
        {/* Backdrop */}
        <div 
          className="absolute inset-0 bg-black/80 backdrop-blur-sm"
          onClick={onClose}
        />
        
        {/* Modal Content */}
        <div 
          ref={ref}
          className={cn(
            'relative w-full rounded-2xl shadow-2xl transform transition-all duration-300',
            sizes[size],
            variants[variant],
            className
          )}
          {...props}
        >
          {/* Header */}
          {title && (
            <div className="flex items-center justify-between p-6 border-b border-[#404040]">
              <h2 id="modal-title" className="text-xl font-semibold text-white">
                {title}
              </h2>
              <button
                onClick={onClose}
                className="w-8 h-8 flex items-center justify-center rounded-full bg-[#404040] hover:bg-[#FF3366] transition-colors"
                aria-label="Close modal"
              >
                <span className="text-white text-lg">×</span>
              </button>
            </div>
          )}
          
          {/* Content */}
          <div className={cn('p-6', !title && 'pt-6')}>
            {children}
          </div>
        </div>
      </div>
    )
  }
)
Modal.displayName = 'Modal'

// ============================================================================
// ITEM LIST CARD COMPONENT
// ============================================================================

interface ItemListCardProps extends React.HTMLAttributes<HTMLDivElement> {
  title: string
  items: string[]
  iconColor?: string
  variant?: 'default' | 'elevated'
}

export const ItemListCard = React.forwardRef<HTMLDivElement, ItemListCardProps>(
  ({ title, items, iconColor = '#39FF14', variant = 'default', className = '', ...props }, ref) => {
    const variants = {
      default: 'rounded-2xl p-6 md:p-8 bg-[#1F1F1F] border-2 border-[#333]',
      elevated: 'rounded-2xl p-6 md:p-8 bg-[#1F1F1F] border-2 border-[#333] shadow-xl'
    }

    return (
      <div
        ref={ref}
        className={cn(variants[variant], className)}
        {...props}
      >
        <div className="flex flex-col gap-6 items-stretch">
          <h3 className="text-xl font-bold" style={{ color: iconColor }}>
            {title}
          </h3>
          <div 
            className="grid gap-4" 
            style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))' }}
          >
            {items.map((item, idx) => (
              <div key={idx} className="flex items-center gap-3">
                <Check className="w-4 h-4 flex-shrink-0" style={{ color: iconColor }} />
                <span className="text-neutral-200 text-sm">{item}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    )
  }
)
ItemListCard.displayName = 'ItemListCard'

// ============================================================================
// PRICING CARD COMPONENT
// ============================================================================

interface PricingCardProps extends React.HTMLAttributes<HTMLDivElement> {
  title: string
  price: string
  description?: string
  badge?: string
  icon?: React.ElementType
  iconColor?: string
  selected?: boolean
  onClick?: () => void
  variant?: 'default' | 'elevated'
}

export const PricingCard = React.forwardRef<HTMLDivElement, PricingCardProps>(
  ({ 
    title, 
    price, 
    description, 
    badge, 
    icon: IconComponent, 
    iconColor = '#39FF14', 
    selected = false, 
    onClick, 
    variant = 'default',
    className = '', 
    ...props 
  }, ref) => {
    const variants = {
      default: 'rounded-2xl p-6 md:p-8 bg-[#1F1F1F] border-2 border-[#333] shadow-xl hover:border-[#00CC44] hover:-translate-y-1 transition-all duration-200 cursor-pointer',
      elevated: 'rounded-2xl p-6 md:p-8 bg-[#1F1F1F] border-2 border-[#333] shadow-xl hover:border-[#00CC44] hover:-translate-y-1 transition-all duration-200 cursor-pointer transition-all ring-2 border-[#39FF14]'
    }

    const cardClasses = cn(
      variants[variant],
      selected ? 'ring-2 ring-[#39FF14] border-[#39FF14]' : '',
      className
    )

    return (
      <div
        ref={ref}
        className={cardClasses}
        onClick={onClick}
        {...props}
      >
        <div className="flex flex-col gap-6 items-center text-center">
          <div className="flex flex-col gap-4 items-center">
            {IconComponent && (
              <IconComponent className="w-6 h-6" style={{ color: iconColor }} />
            )}
            <h3 className="text-xl font-bold text-white">{title}</h3>
            {badge && (
              <span className="inline-flex items-center justify-center px-3 py-1 rounded-full text-xs md:text-sm font-semibold border bg-green-500/20 text-green-400 border-green-500/30">
                {badge}
              </span>
            )}
          </div>
          <div className="text-3xl font-bold" style={{ color: iconColor }}>
            {price}
          </div>
          {description && (
            <div className="text-neutral-400">{description}</div>
          )}
        </div>
      </div>
    )
  }
)
PricingCard.displayName = 'PricingCard'
