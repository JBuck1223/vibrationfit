'use client'

// VibrationFit Design System - Component Library
// Mobile-First, Neon Cyberpunk Aesthetic
// Path: /src/lib/design-system/components.tsx

import React, { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { useStorageData } from '@/hooks/useStorageData'
import { LucideIcon, Check, Sparkles, Home, User, Target, FileText, Image, Brain, BarChart3, CreditCard, Users, Zap, ChevronLeft, ChevronRight, ChevronDown, Plus, Eye, Edit, ShoppingCart, HardDrive, X, Settings, CheckCircle, Rocket, Lock, CheckCircle2, Save, AlertTriangle, Volume2, Play, File, Mic, Video as VideoIcon, Loader2, SkipBack, SkipForward, Pause, PlayCircle, Repeat, Shuffle, MoreHorizontal } from 'lucide-react'

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
 *    ✅ USE containerSize="xl" (1408px) as the standard default for all pages
 *    ✅ USE containerSize="lg" (1280px) for narrower content if needed
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
  ({ children, cols, minWidth = '280px', gap = 'md', className = '', ...props }, ref) => {
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
        className={cn('rounded-2xl px-2 py-6 md:p-8', variants[variant], hoverEffect, className)}
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
      sm: 'px-4 py-3 text-sm md:text-sm md:px-5 gap-1.5', // Increased mobile padding for 44px+ touch target
      md: 'px-4 py-3 text-sm md:text-sm md:px-7 md:py-3 gap-2', // Increased mobile padding
      lg: 'px-5 py-4 text-sm md:text-base md:px-10 md:py-4 gap-2.5', // Increased mobile padding
      xl: 'px-5 py-4 text-sm md:text-base md:px-6 md:py-4 gap-3', // Increased mobile padding
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
        type="button"
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

/**
 * ActionButtons - Standardized View/Delete button pair for list cards
 * 
 * This component provides a consistent way to display View and Delete actions
 * across all list cards in your application. It automatically handles responsive
 * design and follows your design system patterns.
 * 
 * Features:
 * - Consistent styling and behavior across all pages
 * - Responsive design (full-width on mobile, inline on desktop)
 * - Customizable variants and sizes
 * - Optional labels for icon-only buttons
 * - Built-in accessibility features
 * 
 * Usage Examples:
 * 
 * Basic usage:
 * <ActionButtons
 *   viewHref={`/vision-board/${item.id}`}
 *   onDelete={() => handleDelete(item.id)}
 * />
 * 
 * Custom styling:
 * <ActionButtons
 *   viewHref={`/item/${item.id}`}
 *   onDelete={() => handleDelete(item.id)}
 *   size="md"
 *   variant="secondary"
 *   deleteVariant="danger"
 * />
 * 
 * Icon-only buttons (compact layout):
 * <ActionButtons
 *   viewHref={`/item/${item.id}`}
 *   onDelete={() => handleDelete(item.id)}
 *   showLabels={false}
 *   size="sm"
 * />
 * 
 * Props:
 * - viewHref: string - Link destination for the View button
 * - onDelete: () => void - Function to call when Delete is clicked
 * - size?: 'sm' | 'md' | 'lg' - Button size (default: 'sm')
 * - variant?: Button variant for View button (default: 'ghost')
 * - deleteVariant?: Button variant for Delete button (default: 'danger')
 * - className?: string - Additional CSS classes
 * - showLabels?: boolean - Show text labels (default: true)
 */

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

// Auto-Resize Textarea Component
interface AutoResizeTextareaProps extends Omit<React.TextareaHTMLAttributes<HTMLTextAreaElement>, 'onChange'> {
  label?: string
  error?: string
  helperText?: string
  value: string
  onChange: (value: string) => void
  minHeight?: number
  maxHeight?: number
}

export const AutoResizeTextarea = React.forwardRef<HTMLTextAreaElement, AutoResizeTextareaProps>(
  ({ label, error, helperText, className = '', value, onChange, minHeight = 120, maxHeight = 400, ...props }, ref) => {
    const textareaRef = React.useRef<HTMLTextAreaElement>(null)
    const combinedRef = React.useMemo(() => {
      if (ref) {
        if (typeof ref === 'function') {
          return (node: HTMLTextAreaElement | null) => {
            textareaRef.current = node
            ref(node)
          }
        } else {
          ref.current = textareaRef.current
          return textareaRef
        }
      }
      return textareaRef
    }, [ref])

    const autoResize = React.useCallback(() => {
      if (textareaRef.current) {
        // Reset height to auto to get the natural height
        textareaRef.current.style.height = 'auto'
        // Get the scroll height (content height)
        const scrollHeight = textareaRef.current.scrollHeight
        // Set height to content height (no maxHeight limit!)
        const newHeight = Math.max(scrollHeight, minHeight)
        textareaRef.current.style.height = `${newHeight}px`
        
        // Always keep overflow hidden since we're expanding to full content
        textareaRef.current.style.overflowY = 'hidden'
      }
    }, [minHeight])

    // Auto-resize when value changes
    React.useEffect(() => {
      // Use requestAnimationFrame to ensure DOM has updated
      requestAnimationFrame(() => {
        autoResize()
      })
    }, [value, autoResize])

    // Also auto-resize on mount
    React.useEffect(() => {
      autoResize()
    }, [autoResize])

    const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      onChange(e.target.value)
      // Use requestAnimationFrame for smoother resize
      requestAnimationFrame(() => {
        autoResize()
      })
    }

    return (
      <div className="space-y-2 w-full">
        {label && (
          <label className="block text-sm font-medium text-[#E5E7EB]">
            {label}
          </label>
        )}
        <textarea
          ref={combinedRef}
          value={value}
          onChange={handleChange}
          className={cn(
            'w-full px-4 py-3 bg-[#404040] border-2 rounded-xl text-white placeholder-[#9CA3AF]',
            'focus:outline-none focus:ring-2 transition-all duration-200 resize-none',
            error 
              ? 'border-[#FF0040] focus:ring-[#FF0040] focus:border-[#FF0040]' 
              : 'border-[#666666] focus:ring-[#39FF14] focus:border-[#39FF14]',
            className
          )}
          style={{ minHeight: `${minHeight}px` }}
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
AutoResizeTextarea.displayName = 'AutoResizeTextarea'

// Page Layout Component - Standardized site-wide layout
interface PageLayoutProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode
  containerSize?: 'sm' | 'md' | 'default' | 'lg' | 'xl' | 'full'
}

export const PageLayout = React.forwardRef<HTMLDivElement, PageLayoutProps>(
  ({ children, containerSize = 'xl', className = '', ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn('min-h-screen bg-black text-white', className)}
        {...props}
      >
        <Container size={containerSize} className="pt-6 pb-12 md:py-12">
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
      sm: 'px-4 py-3 text-sm md:text-sm', // Increased mobile padding for 44px+ touch target
      md: 'px-6 py-4 text-sm md:text-base', // Increased mobile padding
      lg: 'px-8 py-5 text-sm md:text-base', // Increased mobile padding
      xl: 'px-12 py-6 text-base md:text-lg' // Increased mobile padding
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

/**
 * DeleteConfirmationDialog - Beautiful, reusable delete confirmation popup
 * 
 * This component provides a consistent and beautiful way to confirm delete actions
 * across your entire application. It features a prominent red trash icon, clear
 * messaging, and proper loading states.
 * 
 * Features:
 * - Consistent visual design across all pages
 * - Customizable item type ("Creation", "Item", "Entry", etc.)
 * - Loading states with disabled buttons during deletion
 * - Proper accessibility and keyboard navigation
 * - Beautiful red trash icon with backdrop
 * - Mobile-responsive design
 * 
 * Usage Examples:
 * 
 * Basic usage:
 * <DeleteConfirmationDialog
 *   isOpen={showDeleteConfirm}
 *   onClose={cancelDelete}
 *   onConfirm={confirmDelete}
 *   itemName={itemToDelete?.name || ''}
 * />
 * 
 * With custom item type:
 * <DeleteConfirmationDialog
 *   isOpen={showDeleteConfirm}
 *   onClose={cancelDelete}
 *   onConfirm={confirmDelete}
 *   itemName="My Vision Board Item"
 *   itemType="Creation"
 *   isLoading={deleting}
 *   loadingText="Removing..."
 * />
 * 
 * With loading state:
 * <DeleteConfirmationDialog
 *   isOpen={showDeleteConfirm}
 *   onClose={cancelDelete}
 *   onConfirm={confirmDelete}
 *   itemName={itemToDelete?.name || ''}
 *   itemType="Journal Entry"
 *   isLoading={deleting}
 *   loadingText="Deleting..."
 * />
 * 
 * Props:
 * - isOpen: boolean - Controls dialog visibility
 * - onClose: () => void - Function to call when dialog should close
 * - onConfirm: () => void - Function to call when delete is confirmed
 * - itemName: string - Name of the item being deleted (shown in message)
 * - itemType?: string - Type of item ("Creation", "Item", "Entry", etc.)
 * - isLoading?: boolean - Shows loading state and disables buttons
 * - loadingText?: string - Text to show during loading (default: "Deleting...")
 * 
 * Integration with useDeleteItem hook:
 * The DeleteConfirmationDialog works perfectly with the useDeleteItem hook:
 * 
 * const {
 *   showDeleteConfirm,
 *   deleting,
 *   itemToDelete,
 *   initiateDelete,
 *   confirmDelete,
 *   cancelDelete
 * } = useDeleteItem({
 *   onSuccess: () => setItems(prev => prev.filter(i => i.id !== itemToDelete?.id)),
 *   onError: (error) => alert(`Failed to delete: ${error.message}`)
 * })
 * 
 * <DeleteConfirmationDialog
 *   isOpen={showDeleteConfirm}
 *   onClose={cancelDelete}
 *   onConfirm={confirmDelete}
 *   itemName={itemToDelete?.name || ''}
 *   itemType="Creation"
 *   isLoading={deleting}
 * />
 */

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

// ============================================================================
// 8. LIST COMPONENTS
// ============================================================================

// Bulleted List Component
interface BulletedListProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode
  variant?: 'default' | 'primary' | 'secondary' | 'accent' | 'success' | 'warning' | 'error'
  size?: 'sm' | 'md' | 'lg'
  spacing?: 'tight' | 'normal' | 'loose'
  className?: string
}

export const BulletedList = React.forwardRef<HTMLDivElement, BulletedListProps>(
  ({ 
    children, 
    variant = 'default', 
    size = 'md', 
    spacing = 'normal',
    className = '', 
    ...props 
  }, ref) => {
    const baseClasses = 'text-left'
    
    const variantClasses = {
      default: 'text-neutral-300',
      primary: 'text-[#39FF14]',
      secondary: 'text-[#14B8A6]',
      accent: 'text-[#8B5CF6]',
      success: 'text-[#39FF14]',
      warning: 'text-[#FFB701]',
      error: 'text-[#D03739]'
    }
    
    const sizeClasses = {
      sm: 'text-sm',
      md: 'text-base',
      lg: 'text-lg'
    }
    
    const spacingClasses = {
      tight: 'space-y-1',
      normal: 'space-y-2',
      loose: 'space-y-3'
    }
    
    return (
      <div
        ref={ref}
        className={cn(
          baseClasses,
          variantClasses[variant],
          sizeClasses[size],
          spacingClasses[spacing],
          className
        )}
        {...props}
      >
        {children}
      </div>
    )
  }
)
BulletedList.displayName = 'BulletedList'

// List Item Component
interface ListItemProps extends React.HTMLAttributes<HTMLLIElement> {
  children: React.ReactNode
  variant?: 'default' | 'primary' | 'secondary' | 'accent' | 'success' | 'warning' | 'error'
  size?: 'sm' | 'md' | 'lg'
  icon?: React.ComponentType<{ className?: string }>
  className?: string
}

export const ListItem = React.forwardRef<HTMLLIElement, ListItemProps>(
  ({ 
    children, 
    variant = 'default', 
    size = 'md',
    icon: Icon,
    className = '', 
    ...props 
  }, ref) => {
    const baseClasses = 'flex items-start gap-3'
    
    const variantClasses = {
      default: 'text-neutral-300',
      primary: 'text-[#39FF14]',
      secondary: 'text-[#14B8A6]',
      accent: 'text-[#8B5CF6]',
      success: 'text-[#39FF14]',
      warning: 'text-[#FFB701]',
      error: 'text-[#D03739]'
    }
    
    const sizeClasses = {
      sm: 'text-sm',
      md: 'text-base',
      lg: 'text-lg'
    }
    
    const bulletClasses = {
      default: 'text-neutral-500',
      primary: 'text-[#39FF14]',
      secondary: 'text-[#14B8A6]',
      accent: 'text-[#8B5CF6]',
      success: 'text-[#39FF14]',
      warning: 'text-[#FFB701]',
      error: 'text-[#D03739]'
    }
    
    return (
      <li
        ref={ref}
        className={cn(
          baseClasses,
          variantClasses[variant],
          sizeClasses[size],
          className
        )}
        {...props}
      >
        {Icon ? (
          <Icon className={cn('w-4 h-4 mt-0.5 flex-shrink-0', bulletClasses[variant])} />
        ) : (
          <span className={cn('w-2 h-2 rounded-full mt-2 flex-shrink-0', bulletClasses[variant])} />
        )}
        <span className="flex-1">{children}</span>
      </li>
    )
  }
)
ListItem.displayName = 'ListItem'

// Ordered List Component
interface OrderedListProps extends React.HTMLAttributes<HTMLOListElement> {
  children: React.ReactNode
  variant?: 'default' | 'primary' | 'secondary' | 'accent' | 'success' | 'warning' | 'error'
  size?: 'sm' | 'md' | 'lg'
  spacing?: 'tight' | 'normal' | 'loose'
  className?: string
}

export const OrderedList = React.forwardRef<HTMLOListElement, OrderedListProps>(
  ({ 
    children, 
    variant = 'default', 
    size = 'md', 
    spacing = 'normal',
    className = '', 
    ...props 
  }, ref) => {
    const baseClasses = 'text-left list-decimal list-inside'
    
    const variantClasses = {
      default: 'text-neutral-300',
      primary: 'text-[#39FF14]',
      secondary: 'text-[#14B8A6]',
      accent: 'text-[#8B5CF6]',
      success: 'text-[#39FF14]',
      warning: 'text-[#FFB701]',
      error: 'text-[#D03739]'
    }
    
    const sizeClasses = {
      sm: 'text-sm',
      md: 'text-base',
      lg: 'text-lg'
    }
    
    const spacingClasses = {
      tight: 'space-y-1',
      normal: 'space-y-2',
      loose: 'space-y-3'
    }
    
    return (
      <ol
        ref={ref}
        className={cn(
          baseClasses,
          variantClasses[variant],
          sizeClasses[size],
          spacingClasses[spacing],
          className
        )}
        {...props}
      >
        {children}
      </ol>
    )
  }
)
OrderedList.displayName = 'OrderedList'

// ============================================================================
// 9. NAVIGATION COMPONENTS
// ============================================================================

// Navigation Item Interface
interface NavItem {
  name: string
  href: string
  icon: React.ComponentType<{ className?: string }>
  badge?: string
  children?: NavItem[]
  hasDropdown?: boolean
}

// Admin Navigation Configuration
const adminNavigation: NavItem[] = [
  {
    name: 'Admin Dashboard',
    href: '/admin/dashboard',
    icon: BarChart3,
  },
  {
    name: 'User Management',
    href: '/admin/users',
    icon: Users,
    hasDropdown: true,
    children: [
      { name: 'All Users', href: '/admin/users', icon: Users },
      { name: 'Add Admin', href: '/admin/users/add-admin', icon: Plus },
      { name: 'Adjust Tokens', href: '/admin/users/adjust-tokens', icon: Zap },
      { name: 'Adjust Storage', href: '/admin/users/adjust-storage', icon: HardDrive },
      { name: 'Toggle Admin', href: '/admin/users/toggle-admin', icon: Settings },
    ]
  },
  {
    name: 'AI Management',
    href: '/admin/ai-models',
    icon: Brain,
    hasDropdown: true,
    children: [
      { name: 'AI Models', href: '/admin/ai-models', icon: Brain },
      { name: 'AI Overrides', href: '/api/admin/ai-overrides', icon: Settings },
    ]
  },
  {
    name: 'Analytics',
    href: '/admin/token-usage',
    icon: BarChart3,
    hasDropdown: true,
    children: [
      { name: 'Token Usage', href: '/admin/token-usage', icon: Zap },
      { name: 'Activity Feed', href: '/api/activity/feed', icon: BarChart3 },
    ]
  },
  {
    name: 'Database Tools',
    href: '/api/admin/fix-database',
    icon: HardDrive,
    hasDropdown: true,
    children: [
      { name: 'Fix Database', href: '/api/admin/fix-database', icon: HardDrive },
      { name: 'Fix Green Line', href: '/api/admin/fix-green-line', icon: CheckCircle },
      { name: 'Fix Response Constraint', href: '/api/admin/fix-response-constraint', icon: Settings },
    ]
  },
  {
    name: 'Intensive Management',
    href: '/api/admin/intensive/enroll',
    icon: Rocket,
    hasDropdown: true,
    children: [
      { name: 'Enroll User', href: '/api/admin/intensive/enroll', icon: Plus },
    ]
  },
  {
    name: 'Sitemap',
    href: '/sitemap',
    icon: FileText,
    badge: 'Dev',
  },
  {
    name: 'User Dashboard',
    href: '/dashboard',
    icon: Home,
    badge: 'Switch',
  },
]

// Default Navigation Configuration
const defaultNavigation: NavItem[] = [
  {
    name: 'Dashboard',
    href: '/dashboard',
    icon: Home,
  },
  {
    name: 'Profile',
    href: '/profile',
    icon: User,
    hasDropdown: true,
    children: [
      { name: 'See Profile', href: '/profile', icon: Eye },
      { name: 'Edit Profile', href: '/profile/edit', icon: Edit },
      { name: 'New Profile', href: '/profile/new', icon: Plus },
    ]
  },
  {
    name: 'Life Vision',
    href: '/life-vision',
    icon: Target,
    hasDropdown: true,
    children: [
      { name: 'See Vision', href: '/life-vision', icon: Eye },
      { name: 'Edit Vision', href: '/life-vision/edit', icon: Edit },
      { name: 'Refine Vision', href: '/life-vision/refine', icon: Target },
    ]
  },
  {
    name: 'Assessment',
    href: '/assessment',
    icon: Brain,
    hasDropdown: true,
    children: [
      { name: 'Take Assessment', href: '/assessment', icon: Eye },
      { name: 'View Results', href: '/assessment/results', icon: BarChart3 },
      { name: 'New Assessment', href: '/assessment/new', icon: Plus },
    ]
  },
  {
    name: 'Vision Board',
    href: '/vision-board',
    icon: Image,
    hasDropdown: true,
    children: [
      { name: 'See Vision Board', href: '/vision-board', icon: Eye },
      { name: 'New Item', href: '/vision-board/new', icon: Plus },
    ]
  },
  {
    name: 'Journal',
    href: '/journal',
    icon: FileText,
    hasDropdown: true,
    children: [
      { name: 'See Journal', href: '/journal', icon: Eye },
      { name: 'New Entry', href: '/journal/new', icon: Plus },
    ]
  },
  {
    name: 'VIVA Assistant',
    href: '/dashboard/vibe-assistant-usage',
    icon: Sparkles,
    hasDropdown: true,
    children: [
      { name: 'Chat with VIVA', href: '/dashboard/vibe-assistant-usage', icon: Sparkles },
      { name: 'VIVA Actions Here', href: '/dashboard/vibe-assistant-actions', icon: Zap },
    ]
  },
  {
    name: 'Activity',
    href: '/dashboard/activity',
    icon: BarChart3,
  },
  {
    name: 'Token Tracking',
    href: '/dashboard/tokens',
    icon: Zap,
    hasDropdown: true,
    children: [
      { name: 'See Activity', href: '/dashboard/activity', icon: BarChart3 },
      { name: 'Token Tracking', href: '/dashboard/token-history', icon: BarChart3 },
      { name: 'Buy Tokens', href: '/dashboard/add-tokens', icon: ShoppingCart },
    ]
  },
  {
    name: 'Storage',
    href: '/dashboard/storage',
    icon: HardDrive,
    hasDropdown: true,
    children: [
      { name: 'See Usage', href: '/dashboard/storage', icon: Eye },
      { name: 'Add Storage', href: '/dashboard/storage', icon: Plus },
    ]
  },
  {
    name: 'Billing',
    href: '/billing',
    icon: CreditCard,
  },
  {
    name: 'Support',
    href: '/support',
    icon: Users,
  },
]

// Sidebar Component
interface SidebarProps extends React.HTMLAttributes<HTMLDivElement> {
  className?: string
  navigation?: NavItem[]
  isAdmin?: boolean
}

export const Sidebar = React.forwardRef<HTMLDivElement, SidebarProps>(
  ({ className, navigation, isAdmin = false, ...props }, ref) => {
    // Use admin navigation if isAdmin is true, otherwise use provided navigation or default
    const navItems = isAdmin ? adminNavigation : (navigation || defaultNavigation)
    const [collapsed, setCollapsed] = useState(false)
    const [expandedItems, setExpandedItems] = useState<string[]>([])
    const [user, setUser] = useState<any>(null)
    const [profile, setProfile] = useState<any>(null)
    const [loading, setLoading] = useState(true)
    const pathname = usePathname()
    const supabase = createClient()
    
    // Fetch real-time storage data
    const { data: storageData, loading: storageLoading } = useStorageData()

    useEffect(() => {
      const getUser = async () => {
        const { data: { user } } = await supabase.auth.getUser()
        setUser(user)
        
        // Fetch profile data if user is logged in
        if (user) {
          const { data: profileData, error } = await supabase
            .from('user_profiles')
            .select('first_name, profile_picture_url, vibe_assistant_tokens_remaining')
            .eq('user_id', user.id)
            .single()
          
          if (error) {
            console.error('Error fetching profile:', error)
            // If profile doesn't exist, create one with default values
            if (error.code === 'PGRST116') {
              const { data: newProfile, error: createError } = await supabase
                .from('user_profiles')
                .insert({
                  user_id: user.id,
                  vibe_assistant_tokens_remaining: 100
                })
                .select()
                .single()
              
              if (createError) {
                console.error('Error creating profile:', createError)
              } else {
                setProfile(newProfile)
              }
            }
          } else {
            setProfile(profileData)
          }
        }
        
        setLoading(false)
      }

      getUser()

      const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
        setUser(session?.user ?? null)
        if (!session?.user) {
          setProfile(null)
        }
      })

      return () => subscription.unsubscribe()
    }, [supabase.auth])

    const toggleExpanded = (itemName: string) => {
      setExpandedItems(prev => 
        prev.includes(itemName) 
          ? prev.filter(name => name !== itemName)
          : [...prev, itemName]
      )
    }

    return (
      <div 
        ref={ref}
        className={cn(
          'hidden md:flex flex-col bg-neutral-900 border-r border-neutral-800 transition-all duration-300 sticky top-0 h-screen overflow-hidden',
          collapsed ? 'w-16' : 'w-64',
          className
        )}
        {...props}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-neutral-800">
          {!collapsed && (
            <div className="flex items-center gap-3">
              {/* Profile Picture */}
              {loading ? (
                <div className="w-8 h-8 rounded-full bg-neutral-700 animate-pulse flex-shrink-0" />
              ) : profile?.profile_picture_url ? (
                <img
                  src={profile.profile_picture_url}
                  alt={profile.first_name || 'Profile'}
                  className="w-8 h-8 rounded-full object-cover border-2 border-primary-500"
                />
              ) : profile?.first_name ? (
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary-500 to-secondary-500 flex items-center justify-center text-white font-semibold text-sm">
                  {profile.first_name[0].toUpperCase()}
                </div>
              ) : (
                <div className="w-8 h-8 rounded-full bg-neutral-700 animate-pulse flex-shrink-0" />
              )}
              
              {/* Name */}
              {loading ? (
                <div className="w-24 h-4 bg-neutral-700 rounded animate-pulse" />
              ) : profile?.first_name ? (
                <span className="text-white font-medium truncate">
                  {profile.first_name}
                </span>
              ) : (
                <div className="w-24 h-4 bg-neutral-700 rounded animate-pulse" />
              )}
            </div>
          )}
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="p-1.5 rounded-lg hover:bg-neutral-800 transition-colors"
          >
            {collapsed ? (
              <ChevronRight className="w-4 h-4 text-neutral-400" />
            ) : (
              <ChevronLeft className="w-4 h-4 text-neutral-400" />
            )}
          </button>
        </div>


        {/* Navigation */}
        <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
          {navItems.map((item) => {
            const isActive = pathname === item.href || (item.children && item.children.some(child => pathname === child.href))
            const isExpanded = expandedItems.includes(item.name)
            const Icon = item.icon

            return (
              <div key={item.name}>
                {item.hasDropdown && !collapsed ? (
                  <div>
                    <button
                      onClick={() => toggleExpanded(item.name)}
                      className={cn(
                        'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 w-full text-left',
                        isActive
                          ? 'bg-[#39FF14]/20 text-[#39FF14] border border-[#39FF14]/30'
                          : 'text-neutral-300 hover:text-white hover:bg-neutral-800'
                      )}
                    >
                      <Icon className="w-5 h-5 flex-shrink-0" />
                      <span className="flex-1">{item.name}</span>
                      <ChevronDown className={cn(
                        'w-4 h-4 transition-transform duration-200',
                        isExpanded ? 'rotate-180' : ''
                      )} />
                    </button>
                    
                    {isExpanded && item.children && (
                      <div className="ml-6 mt-2 space-y-1">
                        {/* Special Token Balance Display for Token Tracking */}
                        {item.name === 'Token Tracking' && (
                          <div className="px-3 py-2 bg-neutral-800/50 rounded-lg border border-neutral-700 mb-2">
                            <div className="flex items-center justify-between mb-1">
                              <span className="text-xs font-semibold text-neutral-400 uppercase tracking-wider">
                                Current Balance
                              </span>
                              <Zap className="w-3 h-3 text-[#FFB701]" />
                            </div>
                            <div className="flex items-baseline gap-2">
                              <span className="text-lg font-bold text-white">
                                {(profile?.vibe_assistant_tokens_remaining ?? 0).toLocaleString()}
                              </span>
                              <span className="text-xs text-neutral-500">tokens</span>
                            </div>
                          </div>
                        )}
                        
                        {item.children.map((child) => {
                          const ChildIcon = child.icon
                          const isChildActive = pathname === child.href
                          
                          return (
                            <Link
                              key={child.name}
                              href={child.href}
                              className={cn(
                                'flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-all duration-200',
                                isChildActive
                                  ? 'bg-[#39FF14]/20 text-[#39FF14] border border-[#39FF14]/30'
                                  : 'text-neutral-400 hover:text-white hover:bg-neutral-800'
                              )}
                            >
                              <ChildIcon className="w-4 h-4 flex-shrink-0" />
                              <span>{child.name}</span>
                            </Link>
                          )
                        })}
                      </div>
                    )}
                  </div>
                ) : (
                  <Link
                    href={item.href}
                    className={cn(
                      'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200',
                      isActive
                        ? 'bg-[#00CC44]/20 text-[#00CC44] border border-[#00CC44]/30'
                        : 'text-neutral-300 hover:text-white hover:bg-neutral-800',
                      collapsed && 'justify-center'
                    )}
                  >
                    <Icon className="w-5 h-5 flex-shrink-0" />
                    {!collapsed && (
                      <>
                        <span className="flex-1">{item.name}</span>
                        {item.badge && (
                          <span className="px-2 py-0.5 text-xs bg-[#39FF14] text-black rounded-full">
                            {item.badge}
                          </span>
                        )}
                      </>
                    )}
                  </Link>
                )}
              </div>
            )
          })}
        </nav>

        {/* Token Balance and Storage Cards */}
        {!collapsed && (
          <div className="p-4 border-t border-neutral-800 space-y-3">
            {/* Token Balance Card */}
            <div className="px-3 py-2 bg-neutral-800/50 rounded-lg border border-neutral-700">
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-semibold text-neutral-400 uppercase tracking-wider">
                  Token Balance
                </span>
                <Zap className="w-3 h-3 text-[#FFB701]" />
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-lg font-bold text-white">
                  {(profile?.vibe_assistant_tokens_remaining ?? 0).toLocaleString()}
                </span>
                <span className="text-xs text-neutral-500">tokens</span>
              </div>
            </div>

            {/* Storage Usage Card */}
            <div className="px-3 py-2 bg-neutral-800/50 rounded-lg border border-neutral-700">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold text-neutral-400 uppercase tracking-wider">
                  Storage Usage
                </span>
                <HardDrive className="w-3 h-3 text-[#14B8A6]" />
              </div>
              
              {/* Storage Stats */}
              <div className="space-y-2">
                {storageLoading ? (
                  <div className="flex items-center justify-center py-2">
                    <div className="animate-spin w-4 h-4 border-2 border-[#14B8A6] border-t-transparent rounded-full" />
                  </div>
                ) : (
                  <>
                    <div className="flex items-baseline justify-between">
                      <span className="text-lg font-bold text-white">
                        {storageData ? `${(storageData.totalSize / (1024 * 1024 * 1024)).toFixed(1)}` : '0.0'}
                      </span>
                      <span className="text-xs text-neutral-500">GB used</span>
                    </div>
                    
                    {/* Progress Bar */}
                    <div className="w-full bg-neutral-700 rounded-full h-1.5">
                      <div 
                        className="bg-gradient-to-r from-[#14B8A6] to-[#39FF14] h-1.5 rounded-full transition-all duration-300"
                        style={{ 
                          width: `${Math.min((storageData?.totalSize || 0) / (10 * 1024 * 1024 * 1024) * 100, 100)}%` 
                        }}
                      />
                    </div>
                    
                    {/* Storage Limit */}
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-neutral-500">of 10 GB limit</span>
                      <span className={`font-medium ${
                        (storageData?.totalSize || 0) / (10 * 1024 * 1024 * 1024) > 0.8 
                          ? 'text-[#FFB701]' 
                          : 'text-[#14B8A6]'
                      }`}>
                        {((storageData?.totalSize || 0) / (10 * 1024 * 1024 * 1024) * 100).toFixed(1)}%
                      </span>
                    </div>
                    
                    {/* File Count */}
                    {storageData?.totalFiles && (
                      <div className="text-xs text-neutral-500">
                        {storageData.totalFiles} {storageData.totalFiles === 1 ? 'file' : 'files'}
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Footer */}
        {!collapsed && (
          <div className="p-4 border-t border-neutral-800">
            <div className="text-xs text-neutral-500 text-center">
              Above the Green Line
            </div>
          </div>
        )}
      </div>
    )
  }
)
Sidebar.displayName = 'Sidebar'

// Mobile Bottom Navigation Component
interface MobileBottomNavProps extends React.HTMLAttributes<HTMLDivElement> {
  className?: string
  navigation?: NavItem[]
  isAdmin?: boolean
}

export const MobileBottomNav = React.forwardRef<HTMLDivElement, MobileBottomNavProps>(
  ({ className, navigation, isAdmin = false, ...props }, ref) => {
    const pathname = usePathname()
    const [isDrawerOpen, setIsDrawerOpen] = useState(false)
    const [selectedCategory, setSelectedCategory] = useState<string | null>(null)
    
    // Use admin navigation if isAdmin is true, otherwise use provided navigation or default
    const navItems = isAdmin ? adminNavigation : (navigation || defaultNavigation)
    
    // Admin mobile nav items
    const adminMobileNavItems = [
      { name: 'Users', href: '/admin/users', icon: Users },
      { name: 'AI', href: '/admin/ai-models', icon: Brain },
      { name: 'Analytics', href: '/admin/token-usage', icon: BarChart3 },
      { name: 'Tools', href: '/api/admin/fix-database', icon: HardDrive },
      { name: 'More', href: '#', icon: Settings, isAction: true },
    ]
    
    // User mobile nav items
    const userMobileNavItems = [
      { name: 'Vision', href: '/life-vision', icon: Target },
      { name: 'Board', href: '/vision-board', icon: Image },
      { name: 'Journal', href: '/journal', icon: FileText },
      { name: 'VIVA', href: '/dashboard/vibe-assistant-usage', icon: Sparkles },
      { name: 'More', href: '#', icon: Settings, isAction: true },
    ]
    
    const mobileNavItems = isAdmin ? adminMobileNavItems : userMobileNavItems

    // Get all sidebar items for the drawer (exclude main nav items)
    const allSidebarItems = navItems.filter(item => 
      !mobileNavItems.some(mobileItem => 
        mobileItem.href === item.href || 
        (mobileItem.href === '/life-vision' && item.href === '/life-vision') ||
        (mobileItem.href === '/vision-board' && item.href === '/vision-board') ||
        (mobileItem.href === '/journal' && item.href === '/journal') ||
        (mobileItem.href === '/admin/users' && item.href === '/admin/users') ||
        (mobileItem.href === '/admin/ai-models' && item.href === '/admin/ai-models') ||
        (mobileItem.href === '/admin/token-usage' && item.href === '/admin/token-usage')
      )
    )

    const handleItemClick = (item: any) => {
      if (item.hasDropdown && item.children) {
        setSelectedCategory(item.name)
        setIsDrawerOpen(true)
      }
    }

    const closeDrawer = () => {
      setIsDrawerOpen(false)
      setSelectedCategory(null)
    }

    return (
      <>
        <div 
          ref={ref}
          className={cn(
            'fixed bottom-0 left-0 right-0 z-50',
            'bg-neutral-900 border-t border-neutral-800',
            'md:hidden', // Only show on mobile
            className
          )}
          {...props}
        >
          <div className="flex items-center justify-around py-2">
            {mobileNavItems.map((item) => {
              const Icon = item.icon
              const isActive = pathname === item.href || 
                (item.href === '/life-vision' && pathname.startsWith('/life-vision')) ||
                (item.href === '/profile' && pathname.startsWith('/profile')) ||
                (item.href === '/journal' && pathname.startsWith('/journal'))
              
              if (item.isAction) {
                return (
                  <button
                    key={item.name}
                    onClick={() => setIsDrawerOpen(!isDrawerOpen)}
                    className={cn(
                      'flex flex-col items-center justify-center py-2 px-3 rounded-lg transition-all duration-200 min-w-0 flex-1',
                      isDrawerOpen 
                        ? 'text-[#39FF14] bg-[#39FF14]/10' 
                        : 'text-neutral-400 hover:text-white hover:bg-neutral-800/50'
                    )}
                  >
                    <Icon className="w-5 h-5 mb-1" />
                    <span className="text-xs font-medium truncate">{item.name}</span>
                  </button>
                )
              }
              
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={cn(
                    'flex flex-col items-center justify-center py-2 px-3 rounded-lg transition-all duration-200 min-w-0 flex-1',
                    isActive
                      ? 'text-[#39FF14] bg-[#39FF14]/10'
                      : 'text-neutral-400 hover:text-white hover:bg-neutral-800/50'
                  )}
                >
                  <Icon className="w-5 h-5 mb-1" />
                  <span className="text-xs font-medium truncate">{item.name}</span>
                </Link>
              )
            })}
          </div>
        </div>

        {/* Slideout Drawer */}
        <div className={cn(
          'fixed inset-0 z-40 md:hidden',
          'transition-all duration-300 ease-in-out',
          isDrawerOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
        )}>
          {/* Backdrop */}
          <div 
            className="absolute inset-0 bg-black/30 backdrop-blur-sm"
            onClick={closeDrawer}
          />
          
          {/* Drawer Content - positioned above bottom bar */}
          <div className={cn(
            'absolute left-0 right-0',
            'bg-neutral-900 border-t border-neutral-800 rounded-t-2xl',
            'transform transition-transform duration-300 ease-in-out',
            isDrawerOpen ? 'translate-y-0' : 'translate-y-full',
            'bottom-16' // Position above the bottom bar (assuming bottom bar is ~64px tall)
          )}>
            <div className="p-4">
              {/* Header */}
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold text-white">
                  {selectedCategory ? `${selectedCategory} Options` : 'More Options'}
                </h3>
                <button
                  onClick={closeDrawer}
                  className="p-2 rounded-lg hover:bg-neutral-800 transition-colors"
                >
                  <X className="w-5 h-5 text-neutral-400" />
                </button>
              </div>

              {/* Grid of Items */}
              <div className="grid grid-cols-2 gap-3">
                {allSidebarItems.map((item) => {
                  const Icon = item.icon
                  const isActive = pathname === item.href || 
                    (item.children && item.children.some(child => pathname === child.href))
                  
                  return (
                    <Link
                      key={item.name}
                      href={item.href}
                      onClick={closeDrawer}
                      className={cn(
                        'flex flex-col items-center justify-center p-4 rounded-xl transition-all duration-200',
                        'border-2 border-neutral-700 hover:border-neutral-600',
                        isActive
                          ? 'bg-[#39FF14]/20 border-[#39FF14]/50 text-[#39FF14]'
                          : 'bg-neutral-800/50 text-neutral-300 hover:bg-neutral-800 hover:text-white'
                      )}
                    >
                      <Icon className="w-6 h-6 mb-2" />
                      <span className="text-sm font-medium text-center">{item.name}</span>
                      {item.badge && (
                        <span className="mt-1 px-2 py-0.5 text-xs bg-[#39FF14] text-black rounded-full">
                          {item.badge}
                        </span>
                      )}
                    </Link>
                  )
                })}
              </div>
            </div>
          </div>
        </div>
      </>
    )
  }
)
MobileBottomNav.displayName = 'MobileBottomNav'

// Sidebar Layout Component
interface SidebarLayoutProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode
  className?: string
  navigation?: NavItem[]
  isAdmin?: boolean
}

export const SidebarLayout = React.forwardRef<HTMLDivElement, SidebarLayoutProps>(
  ({ children, className, navigation, isAdmin = false, ...props }, ref) => {
    return (
      <div 
        ref={ref}
        className="flex min-h-screen min-h-[100dvh] bg-black"
        {...props}
      >
        <Sidebar navigation={navigation} isAdmin={isAdmin} />
        <main className={cn('flex-1 overflow-auto pb-20 md:pb-0 min-h-[100dvh]', className)}>
          {children}
        </main>
        <MobileBottomNav navigation={navigation} isAdmin={isAdmin} />
      </div>
    )
  }
)
SidebarLayout.displayName = 'SidebarLayout'

// ============================================================================
// OFFER STACK ACCORDION COMPONENT
// ============================================================================

interface OfferStackItem {
  id: string
  title: string
  description?: string
  icon?: LucideIcon
  included?: boolean
  locked?: boolean
}

interface OfferStackProps extends React.HTMLAttributes<HTMLDivElement> {
  title?: string
  subtitle?: string
  items: OfferStackItem[]
  defaultExpanded?: string[]
  allowMultiple?: boolean
  className?: string
}

export const OfferStack = React.forwardRef<HTMLDivElement, OfferStackProps>(
  ({ 
    title, 
    subtitle, 
    items, 
    defaultExpanded = [],
    allowMultiple = true,
    className,
    ...props 
  }, ref) => {
    const [expandedItems, setExpandedItems] = useState<string[]>(defaultExpanded)

    const toggleItem = (itemId: string) => {
      setExpandedItems(prev => {
        const newItems = allowMultiple
          ? (prev.includes(itemId) 
              ? prev.filter(id => id !== itemId)
              : [...prev, itemId])
          : (prev.includes(itemId) ? [] : [itemId])
        return newItems
      })
    }

    return (
      <div 
        ref={ref}
        className={cn('w-full', className)}
        {...props}
      >
        {/* Header */}
        {(title || subtitle) && (
          <div className="text-center mb-6">
            {title && (
              <h3 className="text-2xl md:text-3xl font-bold text-white mb-2">
                {title}
              </h3>
            )}
            {subtitle && (
              <p className="text-neutral-400 text-base md:text-lg">
                {subtitle}
              </p>
            )}
          </div>
        )}

        {/* Individual Accordion Items */}
        <div className="space-y-1 md:space-y-2">
          {items.map((item, index) => {
            const isExpanded = expandedItems.includes(item.id)
            const IconComponent = item.icon

            return (
              <div
                key={item.id}
                className={cn(
                  'bg-[#1F1F1F] border-2 border-[#333] rounded-xl overflow-hidden transition-all duration-300',
                  'hover:border-[#39FF14]/50 hover:-translate-y-0.5',
                  isExpanded && 'border-[#39FF14]'
                )}
              >
                {/* Item Header - Clickable */}
                <button
                  onClick={(e) => {
                    e.preventDefault()
                    e.stopPropagation()
                    toggleItem(item.id)
                  }}
                  className="w-full px-2 md:px-6 py-2 md:py-4 flex flex-col text-left transition-colors duration-200 hover:bg-[#39FF14]/5 cursor-pointer"
                  type="button"
                  tabIndex={0}
                >
                  <div className="flex items-center justify-between w-full">
                    <div className="flex items-center gap-2 md:gap-4">
                      {/* Icon */}
                      {IconComponent && (
                        <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 bg-[#39FF14]/20">
                          <IconComponent className="w-4 h-4 text-[#39FF14]" />
                        </div>
                      )}
                      
                      {/* Title */}
                      <div className="flex-1">
                        <h4 className="text-base md:text-lg font-semibold text-white">
                          {item.title}
                        </h4>
                      </div>
                    </div>

                    {/* Chevron */}
                    <ChevronDown className={cn(
                      'w-5 h-5 transition-transform duration-200 text-neutral-400',
                      isExpanded && 'rotate-180'
                    )} />
                  </div>

                  {/* Lock Status - Under the main content */}
                  {item.locked && (
                    <div className="flex items-center gap-2 mt-2 ml-0">
                      <Lock className="w-3 h-3 text-neutral-500" />
                      <span className="text-xs text-neutral-500">
                        <span className="md:hidden">Locked until Profile & Assessment complete</span>
                        <span className="hidden md:inline">Locked until you complete Profile & Assessment</span>
                      </span>
                    </div>
                  )}
                </button>

                {/* Item Content - Expandable */}
                {isExpanded && item.description && (
                  <div className="px-2 md:px-6 pb-2 md:pb-4 border-t border-[#333]">
                    <div className="pt-4">
                      {item.description.split('\n').map((line, index) => (
                        <div key={index} className="flex items-start gap-2 mb-2 last:mb-0">
                          <span className="text-[#39FF14] text-sm mt-0.5 flex-shrink-0">•</span>
                          <span className="text-neutral-300 text-sm leading-relaxed">
                            {line.replace(/^•\s*/, '')}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>
    )
  }
)

OfferStack.displayName = 'OfferStack'

// ============================================================================
// STANDARDIZED ACTION COMPONENTS
// ============================================================================

/**
 * DeleteConfirmationDialog - Beautiful, reusable delete confirmation popup
 * 
 * Features:
 * - Consistent visual design across all pages
 * - Customizable item type ("Creation", "Item", "Entry", etc.)
 * - Loading states with disabled buttons
 * - Proper accessibility and keyboard navigation
 * 
 * Usage:
 * <DeleteConfirmationDialog
 *   isOpen={showDeleteConfirm}
 *   onClose={cancelDelete}
 *   onConfirm={confirmDelete}
 *   itemName={itemToDelete?.name || ''}
 *   itemType="Creation"
 *   isLoading={deleting}
 *   loadingText="Deleting..."
 * />
 */
interface DeleteConfirmationDialogProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: () => void
  itemName: string
  itemType?: string // e.g., "Creation", "Item", "Entry"
  isLoading?: boolean
  loadingText?: string
}

export const DeleteConfirmationDialog: React.FC<DeleteConfirmationDialogProps> = ({
  isOpen,
  onClose,
  onConfirm,
  itemName,
  itemType = "Item",
  isLoading = false,
  loadingText = "Deleting..."
}) => {
  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <Card className="max-w-md mx-4">
        <div className="text-center">
          <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <X className="w-8 h-8 text-red-400" />
          </div>
          <h3 className="text-xl font-bold text-white mb-2">Delete {itemType}</h3>
          <p className="text-neutral-300 mb-6">
            Are you sure you want to delete "{itemName}"? This action cannot be undone.
          </p>
          <div className="flex gap-3">
            <Button
              variant="ghost"
              onClick={onClose}
              className="flex-1"
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button
              onClick={onConfirm}
              loading={isLoading}
              disabled={isLoading}
              className="flex-1 bg-red-500 hover:bg-red-600 text-white"
            >
              {isLoading ? loadingText : 'Delete'}
            </Button>
          </div>
        </div>
      </Card>
    </div>
  )
}

/**
 * ActionButtons - Smart button component that handles both draft and completed versions
 * 
 * Features:
 * - Automatically shows appropriate buttons based on versionType
 * - Draft versions: Edit | View | Commit
 * - Completed versions: Edit | View | Delete
 * - Consistent styling and behavior
 * - Responsive design (full-width on mobile, inline on desktop)
 * - Customizable variants and sizes
 * - Optional labels for icon-only buttons
 * 
 * Usage:
 * <ActionButtons
 *   versionType="draft"
 *   editHref={`/item/${item.id}/edit`}
 *   viewHref={`/item/${item.id}`}
 *   onCommit={() => handleCommit(item.id)}
 *   onDelete={() => handleDeleteItem(item.id)}
 *   size="sm"
 *   variant="outline"
 *   deleteVariant="danger"
 * />
 */
interface ActionButtonsProps {
  versionType: 'draft' | 'completed'
  editHref?: string
  viewHref: string
  onCommit?: () => void
  onDelete: () => void
  size?: 'sm' | 'md' | 'lg'
  variant?: 'primary' | 'secondary' | 'accent' | 'ghost' | 'outline' | 'danger'
  className?: string
  showLabels?: boolean
  deleteVariant?: 'primary' | 'secondary' | 'accent' | 'ghost' | 'outline' | 'danger'
  commitVariant?: 'primary' | 'secondary' | 'accent' | 'ghost' | 'outline' | 'danger'
  isCommitting?: boolean
}

export const ActionButtons: React.FC<ActionButtonsProps> = ({
  versionType,
  editHref,
  viewHref,
  onCommit,
  onDelete,
  size = 'sm',
  variant = 'ghost',
  className = '',
  showLabels = true,
  deleteVariant = 'danger',
  commitVariant = 'primary',
  isCommitting = false
}) => {
  if (versionType === 'draft') {
    return (
      <div className={cn('flex flex-row gap-2 w-full md:w-auto', className)}>
        {/* Edit Button */}
        <Button 
          asChild 
          size={size} 
          variant={variant} 
          className="text-xs md:text-sm flex-1 md:flex-none"
        >
          <Link href={editHref || viewHref}>
            <Edit className="w-4 h-4" />
            {showLabels && <span className="ml-1">Edit</span>}
          </Link>
        </Button>
        
        {/* View Button */}
        <Button 
          asChild 
          size={size} 
          variant={variant} 
          className="text-xs md:text-sm flex-1 md:flex-none"
        >
          <Link href={viewHref}>
            <Eye className="w-4 h-4" />
            {showLabels && <span className="ml-1">View</span>}
          </Link>
        </Button>
        
        {/* Commit Button */}
        <Button
          size={size}
          variant={commitVariant}
          onClick={onCommit}
          disabled={isCommitting}
          className="text-xs md:text-sm flex-1 md:flex-none"
        >
          {isCommitting ? (
            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
          ) : (
            <CheckCircle2 className="w-4 h-4" />
          )}
          {showLabels && <span className="ml-1">Commit</span>}
        </Button>
      </div>
    )
  }

  // Completed version - show Edit, View and Delete
  return (
    <div className={cn('flex flex-row gap-2 w-full md:w-auto', className)}>
      {/* Edit Button */}
      <Button 
        asChild 
        size={size} 
        variant={variant} 
        className="text-xs md:text-sm flex-1 md:flex-none"
      >
        <Link href={editHref || viewHref}>
          <Edit className="w-4 h-4" />
          {showLabels && <span className="ml-1">Edit</span>}
        </Link>
      </Button>
      
      {/* View Button */}
      <Button 
        asChild 
        size={size} 
        variant={variant} 
        className="text-xs md:text-sm flex-1 md:flex-none"
      >
        <Link href={viewHref}>
          <Eye className="w-4 h-4" />
          {showLabels && <span className="ml-1">View</span>}
        </Link>
      </Button>
      
      {/* Delete Button */}
      <Button
        size={size}
        variant={deleteVariant}
        onClick={onDelete}
        className="text-xs md:text-sm flex-1 md:flex-none"
      >
        <X className="w-4 h-4" />
        {showLabels && <span className="ml-1">Delete</span>}
      </Button>
    </div>
  )
}

/**
 * WarningConfirmationDialog - Reusable warning confirmation dialog for edit actions
 * 
 * Features:
 * - Customizable title, message, and button text
 * - Different warning types (save, commit, etc.)
 * - Consistent styling with DeleteConfirmationDialog
 * - Accessible with proper ARIA attributes
 * 
 * Usage:
 * <WarningConfirmationDialog
 *   isOpen={showWarning}
 *   onClose={() => setShowWarning(false)}
 *   onConfirm={handleConfirm}
 *   title="Save Changes?"
 *   message="This will update your current profile version."
 *   confirmText="Save"
 *   type="save"
 * />
 */
interface WarningConfirmationDialogProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: () => void
  title: string
  message: string
  confirmText: string
  type: 'save' | 'commit' | 'draft'
  isLoading?: boolean
}

export const WarningConfirmationDialog = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText,
  type,
  isLoading = false
}: WarningConfirmationDialogProps) => {
  if (!isOpen) return null

  const getIcon = () => {
    switch (type) {
      case 'save':
        return <Save className="w-6 h-6 text-blue-500" />
      case 'commit':
        return <CheckCircle2 className="w-6 h-6 text-green-500" />
      case 'draft':
        return <FileText className="w-6 h-6 text-yellow-500" />
      default:
        return <AlertTriangle className="w-6 h-6 text-yellow-500" />
    }
  }

  const getButtonVariant = () => {
    switch (type) {
      case 'save':
        return 'primary'
      case 'commit':
        return 'primary'
      case 'draft':
        return 'secondary'
      default:
        return 'primary'
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />
      
      {/* Dialog */}
      <div 
        className="relative bg-[#1F1F1F] border-2 border-[#333] rounded-2xl p-8 max-w-md w-full mx-4 shadow-2xl"
        role="dialog"
        aria-modal="true"
        aria-labelledby="warning-title"
        aria-describedby="warning-message"
      >
        {/* Icon and Title */}
        <div className="flex items-center gap-4 mb-6">
          <div className="flex-shrink-0">
            {getIcon()}
          </div>
          <div>
            <h3 id="warning-title" className="text-xl font-bold text-white">
              {title}
            </h3>
          </div>
        </div>

        {/* Message */}
        <p id="warning-message" className="text-neutral-300 mb-8 leading-relaxed">
          {message}
        </p>

        {/* Actions */}
        <div className="flex gap-3 justify-end">
          <Button
            variant="outline"
            onClick={onClose}
            disabled={isLoading}
            className="px-6"
          >
            Cancel
          </Button>
          <Button
            variant={getButtonVariant()}
            onClick={onConfirm}
            disabled={isLoading}
            className="px-6"
          >
            {isLoading ? (
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
            ) : null}
            {confirmText}
          </Button>
        </div>
      </div>
    </div>
  )
}

// ============================================================================
// AUDIO PLAYER COMPONENTS
// ============================================================================

export interface AudioTrack {
  id: string
  title: string
  artist: string
  duration: number // in seconds
  url: string
  thumbnail?: string
  variant?: string // Optional: 'sleep', 'meditation', 'energy' for background mixing
}

interface AudioPlayerProps {
  track: AudioTrack
  autoPlay?: boolean
  className?: string
  onTrackEnd?: () => void
  showInfo?: boolean
}

export const AudioPlayer = React.forwardRef<HTMLAudioElement, AudioPlayerProps>(
  ({ track, autoPlay = false, className = '', onTrackEnd, showInfo = true }, ref) => {
    const [isPlaying, setIsPlaying] = useState(false)
    const [currentTime, setCurrentTime] = useState(0)
    const [duration, setDuration] = useState(0)
    const [volume, setVolume] = useState(1)
    const [isMuted, setIsMuted] = useState(false)
    const audioRef = useRef<HTMLAudioElement>(null)

    useEffect(() => {
      const audio = audioRef.current
      if (!audio) return

      const setAudioData = () => {
        setDuration(audio.duration)
      }

      const setAudioTime = () => {
        setCurrentTime(audio.currentTime)
      }

      const handleEnded = () => {
        setIsPlaying(false)
        setCurrentTime(0)
        onTrackEnd?.()
      }

      audio.addEventListener('loadeddata', setAudioData)
      audio.addEventListener('timeupdate', setAudioTime)
      audio.addEventListener('ended', handleEnded)

      return () => {
        audio.removeEventListener('loadeddata', setAudioData)
        audio.removeEventListener('timeupdate', setAudioTime)
        audio.removeEventListener('ended', handleEnded)
      }
    }, [track, onTrackEnd])

    const togglePlayPause = () => {
      const audio = audioRef.current
      if (!audio) return

      if (isPlaying) {
        audio.pause()
      } else {
        audio.play()
      }
      setIsPlaying(!isPlaying)
    }

    const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
      const audio = audioRef.current
      if (!audio) return

      const newTime = parseFloat(e.target.value)
      audio.currentTime = newTime
      setCurrentTime(newTime)
    }

    const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const audio = audioRef.current
      if (!audio) return

      const newVolume = parseFloat(e.target.value)
      audio.volume = newVolume
      setVolume(newVolume)
      setIsMuted(newVolume === 0)
    }

    const toggleMute = () => {
      const audio = audioRef.current
      if (!audio) return

      if (isMuted) {
        audio.volume = volume || 0.5
        setIsMuted(false)
      } else {
        audio.volume = 0
        setIsMuted(true)
      }
    }

    const formatTime = (seconds: number) => {
      const mins = Math.floor(seconds / 60)
      const secs = Math.floor(seconds % 60)
      return `${mins}:${secs.toString().padStart(2, '0')}`
    }

    const progress = duration > 0 ? (currentTime / duration) * 100 : 0

    return (
      <div className={cn('w-full', className)}>
        <audio 
          ref={audioRef} 
          src={track.url} 
          preload="metadata"
          onError={(e) => {
            console.warn('Audio failed to load:', track.url, e)
          }}
        />
        
        {/* Track Info */}
        {showInfo && (
          <div className="mb-4">
            <h3 className="text-lg font-semibold text-white truncate">{track.title}</h3>
            <p className="text-sm text-neutral-400 truncate">{track.artist}</p>
          </div>
        )}

        {/* Main Player Controls */}
        <div className="flex items-center gap-3 md:gap-4 mb-3">
          {/* Play/Pause Button */}
          <button
            onClick={togglePlayPause}
            className="w-12 h-12 md:w-14 md:h-14 flex items-center justify-center rounded-full bg-[#39FF14] text-black hover:bg-[rgba(57,255,20,0.8)] transition-all duration-300 hover:scale-105 active:scale-95 flex-shrink-0"
            aria-label={isPlaying ? 'Pause' : 'Play'}
          >
            {isPlaying ? (
              <Pause className="w-6 h-6 md:w-7 md:h-7" fill="currentColor" />
            ) : (
              <Play className="w-6 h-6 md:w-7 md:h-7 ml-0.5" fill="currentColor" />
            )}
          </button>

          {/* Volume Control */}
          <div className="hidden md:flex items-center gap-2 flex-1 max-w-[200px]">
            <button
              onClick={toggleMute}
              className="text-neutral-400 hover:text-white transition-colors p-1"
              aria-label={isMuted ? 'Unmute' : 'Mute'}
            >
              <Volume2 className={cn('w-5 h-5', isMuted && 'line-through')} />
            </button>
            <input
              type="range"
              min="0"
              max="1"
              step="0.01"
              value={isMuted ? 0 : volume}
              onChange={handleVolumeChange}
              className="w-full h-1 bg-neutral-700 rounded-full appearance-none cursor-pointer accent-[#39FF14]"
            />
          </div>
        </div>

        {/* Progress Bar */}
        <div className="mb-3">
          <input
            type="range"
            min="0"
            max={duration || 0}
            step="0.1"
            value={currentTime}
            onChange={handleSeek}
            className="w-full h-2 bg-neutral-700 rounded-full appearance-none cursor-pointer accent-[#39FF14]"
            style={{
              background: `linear-gradient(to right, #39FF14 0%, #39FF14 ${progress}%, #404040 ${progress}%, #404040 100%)`
            }}
          />
        </div>

        {/* Time Display */}
        <div className="flex justify-between items-center text-xs text-neutral-400">
          <span>{formatTime(currentTime)}</span>
          <span>{formatTime(duration)}</span>
        </div>

        {/* Mobile Volume Toggle */}
        <div className="md:hidden flex items-center justify-center mt-2">
          <button
            onClick={toggleMute}
            className="text-neutral-400 hover:text-white transition-colors p-2"
            aria-label={isMuted ? 'Unmute' : 'Mute'}
          >
            <Volume2 className={cn('w-5 h-5', isMuted && 'line-through')} />
          </button>
        </div>
      </div>
    )
  }
)
AudioPlayer.displayName = 'AudioPlayer'

// ============================================================================
// PLAYLIST PLAYER COMPONENT
// ============================================================================

interface PlaylistPlayerProps {
  tracks: AudioTrack[]
  className?: string
  autoPlay?: boolean
}

export const PlaylistPlayer: React.FC<PlaylistPlayerProps> = ({ 
  tracks, 
  className = '',
  autoPlay = false 
}) => {
  const [currentTrackIndex, setCurrentTrackIndex] = useState(0)
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const [volume, setVolume] = useState(1)
  const [isMuted, setIsMuted] = useState(false)
  const [repeatMode, setRepeatMode] = useState<'off' | 'all' | 'one'>('off')
  const [isShuffled, setIsShuffled] = useState(false)
  const [originalOrder, setOriginalOrder] = useState<number[]>([])
  
  const audioRef = useRef<HTMLAudioElement>(null)
  const audioContextRef = useRef<AudioContext | null>(null)
  const voiceSourceRef = useRef<AudioBufferSourceNode | null>(null)
  const bgSourceRef = useRef<AudioBufferSourceNode | null>(null)

  const currentTrack = tracks[currentTrackIndex]
  
  // Import background mixing when needed
  useEffect(() => {
    const initMixing = async () => {
      if (!currentTrack?.variant || currentTrack.variant === 'standard') {
        // No mixing needed for standard
        return
      }
      
      try {
        // Lazy load the mixing utility
        const { createMixedAudio } = await import('@/lib/audio/backgroundMixing')
        
        // Create audio context
        if (!audioContextRef.current) {
          audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)()
        }
        
        // Stop any existing sources
        if (voiceSourceRef.current) {
          try {
            voiceSourceRef.current.stop()
          } catch (e) {}
        }
        if (bgSourceRef.current) {
          try {
            bgSourceRef.current.stop()
          } catch (e) {}
        }
        
        // Create mixed audio
        const mixed = await createMixedAudio(
          currentTrack.url,
          currentTrack.variant,
          audioContextRef.current
        )
        
        voiceSourceRef.current = (mixed as any).voice
        bgSourceRef.current = (mixed as any).background
        
        console.log('✅ Background mixing initialized for:', currentTrack.variant)
      } catch (error) {
        console.warn('Background mixing failed, using standard playback:', error)
      }
    }
    
    initMixing()
  }, [currentTrack])

  useEffect(() => {
    const audio = audioRef.current
    if (!audio) return

    const setAudioData = () => {
      setDuration(audio.duration)
    }

    const setAudioTime = () => {
      setCurrentTime(audio.currentTime)
    }

    const handleEnded = () => {
      handleNext()
    }

    audio.addEventListener('loadeddata', setAudioData)
    audio.addEventListener('timeupdate', setAudioTime)
    audio.addEventListener('ended', handleEnded)

    return () => {
      audio.removeEventListener('loadeddata', setAudioData)
      audio.removeEventListener('timeupdate', setAudioTime)
      audio.removeEventListener('ended', handleEnded)
    }
  }, [currentTrackIndex])

  useEffect(() => {
    if (autoPlay && isPlaying) {
      audioRef.current?.play()
    }
  }, [currentTrackIndex])

  const togglePlayPause = async () => {
    // If mixing is enabled, use Web Audio API
    if (currentTrack?.variant && currentTrack.variant !== 'standard' && voiceSourceRef.current && bgSourceRef.current) {
      if (isPlaying) {
        // Pause mixing
        try {
          voiceSourceRef.current.stop()
          bgSourceRef.current.stop()
        } catch (e) {}
        setIsPlaying(false)
      } else {
        // Start mixing
        try {
          // Resume audio context if suspended
          if (audioContextRef.current?.state === 'suspended') {
            await audioContextRef.current.resume()
          }
          
          voiceSourceRef.current.start(0)
          bgSourceRef.current.start(0)
          setIsPlaying(true)
        } catch (error) {
          console.warn('Failed to start mixed audio, using fallback:', error)
          // Fallback to regular audio
          audioRef.current?.play()
          setIsPlaying(true)
        }
      }
    } else {
      // Use standard HTML audio
      const audio = audioRef.current
      if (!audio) return

      if (isPlaying) {
        audio.pause()
      } else {
        audio.play()
      }
      setIsPlaying(!isPlaying)
    }
  }

  const handlePrevious = () => {
    const audio = audioRef.current
    if (!audio || currentTime > 3) {
      audio && (audio.currentTime = 0)
      return
    }

    let newIndex = currentTrackIndex - 1
    if (newIndex < 0) {
      newIndex = tracks.length - 1
    }
    setCurrentTrackIndex(newIndex)
    setCurrentTime(0)
  }

  const handleNext = () => {
    let newIndex = currentTrackIndex + 1

    if (repeatMode === 'one') {
      newIndex = currentTrackIndex
    } else if (repeatMode === 'all' && newIndex >= tracks.length) {
      newIndex = 0
    } else if (newIndex >= tracks.length) {
      setIsPlaying(false)
      return
    }

    setCurrentTrackIndex(newIndex)
    setCurrentTime(0)
  }

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const audio = audioRef.current
    if (!audio) return

    const newTime = parseFloat(e.target.value)
    audio.currentTime = newTime
    setCurrentTime(newTime)
  }

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const audio = audioRef.current
    if (!audio) return

    const newVolume = parseFloat(e.target.value)
    audio.volume = newVolume
    setVolume(newVolume)
    setIsMuted(newVolume === 0)
  }

  const toggleMute = () => {
    const audio = audioRef.current
    if (!audio) return

    if (isMuted) {
      audio.volume = volume || 0.5
      setIsMuted(false)
    } else {
      audio.volume = 0
      setIsMuted(true)
    }
  }

  const toggleRepeat = () => {
    const modes: ('off' | 'all' | 'one')[] = ['off', 'all', 'one']
    const currentIndex = modes.indexOf(repeatMode)
    const nextIndex = (currentIndex + 1) % modes.length
    setRepeatMode(modes[nextIndex])
  }

  const toggleShuffle = () => {
    if (!isShuffled) {
      // Store original order
      setOriginalOrder(Array.from(Array(tracks.length).keys()))
      
      // Shuffle tracks
      const shuffled = [...tracks].sort(() => Math.random() - 0.5)
      // For simplicity, we'll just set the shuffle flag
      // In a real implementation, you'd manage the shuffled array
      setIsShuffled(true)
    } else {
      // Restore original order
      setIsShuffled(false)
    }
  }

  const handleTrackSelect = (index: number) => {
    setCurrentTrackIndex(index)
    setCurrentTime(0)
    if (isPlaying) {
      // Small delay to ensure audio is loaded
      setTimeout(() => {
        audioRef.current?.play()
      }, 100)
    }
  }

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = Math.floor(seconds % 60)
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  const progress = duration > 0 ? (currentTime / duration) * 100 : 0

  return (
    <div className={cn('w-full', className)}>
      <audio 
        ref={audioRef} 
        src={currentTrack?.url} 
        preload="metadata"
        onError={(e) => {
          console.warn('Audio failed to load:', currentTrack?.url, e)
        }}
      />

      {/* Current Track Info */}
      <Card variant="elevated" className="mb-6">
        <div className="flex items-center gap-4">
          {currentTrack?.thumbnail && (
            <img 
              src={currentTrack.thumbnail} 
              alt={currentTrack.title}
              className="w-16 h-16 rounded-lg object-cover flex-shrink-0"
            />
          )}
          <div className="flex-1 min-w-0">
            <h3 className="text-lg font-semibold text-white truncate">{currentTrack?.title}</h3>
            <p className="text-sm text-neutral-400 truncate">{currentTrack?.artist}</p>
          </div>
        </div>
      </Card>

      {/* Main Player Controls */}
      <div className="flex items-center justify-center gap-2 md:gap-4 mb-4">
        {/* Shuffle Button */}
        <button
          onClick={toggleShuffle}
          className={cn(
            'w-10 h-10 flex items-center justify-center rounded-full transition-colors',
            isShuffled 
              ? 'bg-[#39FF14] text-black' 
              : 'text-neutral-400 hover:text-white'
          )}
          aria-label="Shuffle"
        >
          <Shuffle className="w-5 h-5" />
        </button>

        {/* Previous Button */}
        <button
          onClick={handlePrevious}
          className="w-12 h-12 flex items-center justify-center rounded-full bg-neutral-800 hover:bg-neutral-700 text-white transition-colors"
          aria-label="Previous"
        >
          <SkipBack className="w-6 h-6" />
        </button>

        {/* Play/Pause Button */}
        <button
          onClick={togglePlayPause}
          className="w-16 h-16 md:w-20 md:h-20 flex items-center justify-center rounded-full bg-[#39FF14] text-black hover:bg-[rgba(57,255,20,0.8)] transition-all duration-300 hover:scale-105 active:scale-95"
          aria-label={isPlaying ? 'Pause' : 'Play'}
        >
          {isPlaying ? (
            <Pause className="w-8 h-8 md:w-10 md:h-10" fill="currentColor" />
          ) : (
            <Play className="w-8 h-8 md:w-10 md:h-10 ml-1" fill="currentColor" />
          )}
        </button>

        {/* Next Button */}
        <button
          onClick={handleNext}
          className="w-12 h-12 flex items-center justify-center rounded-full bg-neutral-800 hover:bg-neutral-700 text-white transition-colors"
          aria-label="Next"
        >
          <SkipForward className="w-6 h-6" />
        </button>

        {/* Repeat Button */}
        <button
          onClick={toggleRepeat}
          className={cn(
            'w-10 h-10 flex items-center justify-center rounded-full transition-colors',
            repeatMode !== 'off'
              ? 'bg-[#39FF14] text-black' 
              : 'text-neutral-400 hover:text-white'
          )}
          aria-label="Repeat"
        >
          <Repeat className={cn('w-5 h-5', repeatMode === 'one' && 'text-black')} />
        </button>
      </div>

      {/* Progress Bar */}
      <div className="mb-4">
        <input
          type="range"
          min="0"
          max={duration || 0}
          step="0.1"
          value={currentTime}
          onChange={handleSeek}
          className="w-full h-2 bg-neutral-700 rounded-full appearance-none cursor-pointer accent-[#39FF14]"
          style={{
            background: `linear-gradient(to right, #39FF14 0%, #39FF14 ${progress}%, #404040 ${progress}%, #404040 100%)`
          }}
        />
      </div>

      {/* Time Display */}
      <div className="flex justify-between items-center text-sm text-neutral-400 mb-6">
        <span>{formatTime(currentTime)}</span>
        <span>{formatTime(duration)}</span>
      </div>

      {/* Volume Control */}
      <div className="flex items-center gap-3 mb-6">
        <button
          onClick={toggleMute}
          className="text-neutral-400 hover:text-white transition-colors p-1"
          aria-label={isMuted ? 'Unmute' : 'Mute'}
        >
          <Volume2 className={cn('w-5 h-5', isMuted && 'line-through')} />
        </button>
        <input
          type="range"
          min="0"
          max="1"
          step="0.01"
          value={isMuted ? 0 : volume}
          onChange={handleVolumeChange}
          className="flex-1 h-1 bg-neutral-700 rounded-full appearance-none cursor-pointer accent-[#39FF14]"
        />
      </div>

      {/* Track List */}
      <Card variant="default" className="max-h-80 overflow-y-auto">
        <Stack gap="xs">
          <h4 className="text-lg font-semibold text-white mb-2">Playlist</h4>
          {tracks.map((track, index) => (
            <button
              key={track.id}
              onClick={() => handleTrackSelect(index)}
              className={cn(
                'w-full text-left p-3 rounded-lg transition-all duration-200',
                'hover:bg-neutral-800',
                currentTrackIndex === index && 'bg-[#39FF14]/20 border border-[#39FF14]'
              )}
            >
              <div className="flex items-center gap-3">
                <div className="flex-shrink-0">
                  {currentTrackIndex === index && isPlaying ? (
                    <PlayCircle className="w-5 h-5 text-[#39FF14]" />
                  ) : (
                    <Play className="w-5 h-5 text-neutral-400" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className={cn(
                    'text-sm font-medium truncate',
                    currentTrackIndex === index ? 'text-[#39FF14]' : 'text-white'
                  )}>
                    {track.title}
                  </p>
                  <p className="text-xs text-neutral-400 truncate">{track.artist}</p>
                </div>
                <div className="text-xs text-neutral-500">
                  {formatTime(track.duration)}
                </div>
              </div>
            </button>
          ))}
        </Stack>
      </Card>
    </div>
  )
}
PlaylistPlayer.displayName = 'PlaylistPlayer'
