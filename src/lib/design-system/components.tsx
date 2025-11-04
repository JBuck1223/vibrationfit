'use client'

// VibrationFit Design System - Component Library
// Mobile-First, Neon Cyberpunk Aesthetic
// Path: /src/lib/design-system/components.tsx

import React, { useState, useEffect, useRef, useCallback } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { getActiveProfileClient } from '@/lib/supabase/profile-client'
import { useStorageData } from '@/hooks/useStorageData'
import { userNavigation, adminNavigation as centralAdminNav, mobileNavigation as centralMobileNav, isNavItemActive, type NavItem as CentralNavItem } from '@/lib/navigation'
import { LucideIcon, Check, Sparkles, Home, User, Target, FileText, Image, Brain, BarChart3, CreditCard, Users, Zap, ChevronLeft, ChevronRight, ChevronDown, Plus, Eye, Edit, ShoppingCart, HardDrive, X, Settings, CheckCircle, Rocket, Lock, CheckCircle2, Save, AlertTriangle, Volume2, Play, File, Mic, Video as VideoIcon, Loader2, SkipBack, SkipForward, Pause, PlayCircle, Repeat, Shuffle, MoreHorizontal, ArrowDown } from 'lucide-react'

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

// Stack - Vertical rhythm with consistent gaps (Grid wrapper)
interface StackProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode
  gap?: 'xs' | 'sm' | 'md' | 'lg' | 'xl'
  align?: 'start' | 'center' | 'end' | 'stretch'
}

export const Stack = React.forwardRef<HTMLDivElement, StackProps>(
  ({ children, gap = 'md', align = 'stretch', className = '', ...props }, ref) => {
    return (
      <Grid
        ref={ref}
        mode="flex-col"
        gap={gap}
        align={align || 'stretch'}
        className={className}
        {...props}
      >
        {children}
      </Grid>
    )
  }
)
Stack.displayName = 'Stack'

// Inline - Mobile-first responsive horizontal row (Grid wrapper)
interface InlineProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode
  gap?: 'xs' | 'sm' | 'md' | 'lg'
  align?: 'start' | 'center' | 'end' | 'stretch'
  justify?: 'start' | 'center' | 'end' | 'between' | 'around'
  wrap?: boolean
}

export const Inline = React.forwardRef<HTMLDivElement, InlineProps>(
  ({ children, gap = 'md', align = 'center', justify = 'start', wrap = true, className = '', ...props }, ref) => {
    return (
      <Grid
        ref={ref}
        mode="flex-row"
        gap={gap}
        align={align}
        justify={justify}
        wrap={wrap}
        className={className}
        {...props}
      >
        {children}
      </Grid>
    )
  }
)
Inline.displayName = 'Inline'

// Grid - Unified responsive layout component (powers all layout primitives)
interface GridProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode
  // Fixed columns (legacy)
  cols?: number
  minWidth?: string
  // Responsive columns (new)
  responsiveCols?: {
    mobile?: number | 'auto'
    tablet?: number | 'auto'
    desktop?: number | 'auto'
  }
  // Layout mode (for Stack/Inline wrappers)
  mode?: 'grid' | 'flex-col' | 'flex-row'
  // Gap spacing
  gap?: 'xs' | 'sm' | 'md' | 'lg' | 'xl'
  // Flexbox-specific props (when using flex modes)
  justify?: 'start' | 'center' | 'end' | 'between' | 'around' | 'evenly'
  align?: 'start' | 'center' | 'end' | 'stretch'
  wrap?: boolean
}

export const Grid = React.forwardRef<HTMLDivElement, GridProps>(
  ({ 
    children, 
    cols, 
    minWidth = '280px', 
    responsiveCols,
    mode = 'grid',
    gap = 'md', 
    justify,
    align,
    wrap = true,
    className = '', 
    ...props 
  }, ref) => {
    const gaps = {
      xs: 'gap-2',
      sm: 'gap-4',
      md: 'gap-6',
      lg: 'gap-8',
      xl: 'gap-12'
    }
    
    const justifications = {
      start: 'justify-start',
      center: 'justify-center',
      end: 'justify-end',
      between: 'justify-between',
      around: 'justify-around',
      evenly: 'justify-evenly'
    }
    
    const alignments = {
      start: 'items-start',
      center: 'items-center',
      end: 'items-end',
      stretch: 'items-stretch'
    }

    // Handle responsive columns - use Tailwind arbitrary values for dynamic columns
    const getGridColsClass = (cols: number | 'auto' | undefined, breakpoint?: 'mobile' | 'tablet' | 'desktop'): string => {
      if (cols === undefined) return ''
      if (cols === 'auto') {
        return breakpoint === 'tablet' 
          ? 'md:grid-cols-[repeat(auto-fit,minmax(0,1fr))]'
          : breakpoint === 'desktop'
          ? 'lg:grid-cols-[repeat(auto-fit,minmax(0,1fr))]'
          : 'grid-cols-[repeat(auto-fit,minmax(0,1fr))]'
      }
      
      // Map common values to Tailwind classes, use arbitrary values for others
      const commonCols: Record<number, string> = {
        1: breakpoint === 'tablet' ? 'md:grid-cols-1' : breakpoint === 'desktop' ? 'lg:grid-cols-1' : 'grid-cols-1',
        2: breakpoint === 'tablet' ? 'md:grid-cols-2' : breakpoint === 'desktop' ? 'lg:grid-cols-2' : 'grid-cols-2',
        3: breakpoint === 'tablet' ? 'md:grid-cols-3' : breakpoint === 'desktop' ? 'lg:grid-cols-3' : 'grid-cols-3',
        4: breakpoint === 'tablet' ? 'md:grid-cols-4' : breakpoint === 'desktop' ? 'lg:grid-cols-4' : 'grid-cols-4',
        5: breakpoint === 'tablet' ? 'md:grid-cols-5' : breakpoint === 'desktop' ? 'lg:grid-cols-5' : 'grid-cols-5',
        6: breakpoint === 'tablet' ? 'md:grid-cols-6' : breakpoint === 'desktop' ? 'lg:grid-cols-6' : 'grid-cols-6',
        12: breakpoint === 'tablet' ? 'md:grid-cols-12' : breakpoint === 'desktop' ? 'lg:grid-cols-12' : 'grid-cols-12',
        14: breakpoint === 'tablet' ? 'md:grid-cols-[repeat(14,minmax(0,1fr))]' : breakpoint === 'desktop' ? 'lg:grid-cols-[repeat(14,minmax(0,1fr))]' : 'grid-cols-[repeat(14,minmax(0,1fr))]',
      }
      
      if (commonCols[cols]) return commonCols[cols]
      
      // Use arbitrary value for uncommon column counts
      return breakpoint === 'tablet'
        ? `md:grid-cols-[repeat(${cols},minmax(0,1fr))]`
        : breakpoint === 'desktop'
        ? `lg:grid-cols-[repeat(${cols},minmax(0,1fr))]`
        : `grid-cols-[repeat(${cols},minmax(0,1fr))]`
    }

    // Grid mode (default)
    if (mode === 'grid') {
      let gridStyle: React.CSSProperties = {}
      
      // Only use inline style if responsiveCols is not provided
      if (!responsiveCols) {
        gridStyle = cols 
          ? { gridTemplateColumns: `repeat(${cols}, 1fr)` }
          : { gridTemplateColumns: `repeat(auto-fit, minmax(${minWidth}, 1fr))` }
      }
      // If responsiveCols is provided, rely on className-based classes (no inline style needed)

      // Build className with responsive column classes
      let gridColsClasses: string[] = []
      if (responsiveCols) {
        const { mobile, tablet, desktop } = responsiveCols
        if (mobile !== undefined) {
          gridColsClasses.push(getGridColsClass(mobile))
        } else {
          gridColsClasses.push('grid-cols-1') // Default to 1 column on mobile
        }
        
        if (tablet !== undefined) {
          gridColsClasses.push(getGridColsClass(tablet, 'tablet'))
        }
        
        if (desktop !== undefined) {
          gridColsClasses.push(getGridColsClass(desktop, 'desktop'))
        }
      }

      return (
        <div 
          ref={ref}
          className={cn(
            'grid',
            ...gridColsClasses,
            gaps[gap],
            align && alignments[align],
            className
          )}
          style={gridStyle}
          {...props}
        >
          {children}
        </div>
      )
    }

    // Flex-col mode (for Stack)
    if (mode === 'flex-col') {
      return (
        <div 
          ref={ref}
          className={cn(
            'flex flex-col',
            gaps[gap],
            align && alignments[align],
            justify && justifications[justify],
            className
          )}
          {...props}
        >
          {children}
        </div>
      )
    }

    // Flex-row mode (for Inline)
    if (mode === 'flex-row') {
      return (
        <div 
          ref={ref}
          className={cn(
            'flex flex-row',
            wrap && 'flex-wrap',
            gaps[gap],
            align && alignments[align],
            justify && justifications[justify],
            className
          )}
          {...props}
        >
          {children}
        </div>
      )
    }

    return null
  }
)
Grid.displayName = 'Grid'

// TwoColumn - Responsive two column layout that stacks on mobile (Grid wrapper)
interface TwoColumnProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode
  gap?: 'xs' | 'sm' | 'md' | 'lg'
  reverse?: boolean // Reverse order on mobile
}

export const TwoColumn = React.forwardRef<HTMLDivElement, TwoColumnProps>(
  ({ children, gap = 'md', reverse = false, className = '', ...props }, ref) => {
    return (
      <Grid
        ref={ref}
        responsiveCols={{mobile: 1, desktop: 2}}
        gap={gap}
        mode="grid"
        className={cn(
          reverse && 'flex-col-reverse md:flex-row-reverse',
          className
        )}
        {...props}
      >
        {children}
      </Grid>
    )
  }
)
TwoColumn.displayName = 'TwoColumn'

// FourColumn - Responsive four column layout (DEPRECATED - use Grid with responsiveCols)
// @deprecated Use <Grid responsiveCols={{mobile: 2, desktop: 4}}> instead
interface FourColumnProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode
  gap?: 'xs' | 'sm' | 'md' | 'lg'
}

export const FourColumn = React.forwardRef<HTMLDivElement, FourColumnProps>(
  ({ children, gap = 'md', className = '', ...props }, ref) => {
    if (process.env.NODE_ENV === 'development') {
      console.warn('FourColumn is deprecated. Use Grid with responsiveCols={{mobile: 2, desktop: 4}} instead.')
    }
    
    return (
      <Grid
        ref={ref}
        responsiveCols={{mobile: 2, desktop: 4}}
        gap={gap}
        className={className}
        {...props}
      >
        {children}
      </Grid>
    )
  }
)
FourColumn.displayName = 'FourColumn'

// Switcher - Toggles from row to column when items don't fit (DEPRECATED)
// @deprecated Use <Grid responsiveCols={{mobile: 1, desktop: 'auto'}}> or <Grid mode="flex-row" className="flex-col md:flex-row"> instead
interface SwitcherProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode
  gap?: 'xs' | 'sm' | 'md' | 'lg'
}

export const Switcher = React.forwardRef<HTMLDivElement, SwitcherProps>(
  ({ children, gap = 'md', className = '', ...props }, ref) => {
    if (process.env.NODE_ENV === 'development') {
      console.warn('Switcher is deprecated. Use Grid with responsiveCols={{mobile: 1, desktop: "auto"}} or Grid with mode="flex-row" className="flex-col md:flex-row" instead.')
    }
    
    return (
      <Grid
        ref={ref}
        mode="flex-row"
        gap={gap}
        className={cn('flex-col md:flex-row', className)}
        {...props}
      >
        {children}
      </Grid>
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

// Section - Container with vertical padding for page sections
interface SectionProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode
  containerSize?: 'sm' | 'md' | 'default' | 'lg' | 'xl' | 'full'
  padding?: 'none' | 'sm' | 'md' | 'lg'
}

export const Section = React.forwardRef<HTMLDivElement, SectionProps>(
  (
    { 
      children, 
      containerSize = 'xl', 
      padding = 'md', 
      className = '', 
      ...props 
    }, 
    ref
  ) => {
    const paddingClasses = {
      none: 'py-0',
      sm: 'py-6',            // 24px top/bottom on mobile
      md: 'py-8 md:py-12',   // 32px mobile, 48px md+
      lg: 'py-12 md:py-16',  // 48px mobile, 64px md+
    }
    return (
      <Container size={containerSize} className={cn(paddingClasses[padding], className)} {...props} ref={ref}>
        {children}
      </Container>
    )
  }
)
Section.displayName = 'Section'

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
    
    const hoverEffect = hover ? 'hover:border-[#00CC44] hover:shadow-2xl transition-all duration-200' : ''
    
    // Standardized padding: Mobile p-4 (16px all around), Desktop p-6 (24px all around)
    return (
      <div 
        ref={ref}
        className={cn('rounded-2xl p-4 md:p-6', variants[variant], hoverEffect, className)}
        {...props}
      >
        {children}
      </div>
    )
  }
)
Card.displayName = 'Card'

// FeatureCard Component - Icon on top, title under icon, body text under title
interface FeatureCardProps extends React.HTMLAttributes<HTMLDivElement> {
  icon: React.ElementType
  title: string
  children: React.ReactNode
  iconColor?: string
  iconSize?: 'xs' | 'sm' | 'md' | 'lg' | 'xl'
  variant?: 'default' | 'elevated' | 'outlined' | 'glass'
  hover?: boolean
  number?: number
}

export const FeatureCard = React.forwardRef<HTMLDivElement, FeatureCardProps>(
  ({ icon: IconComponent, title, children, iconColor = '#39FF14', iconSize = 'lg', variant = 'default', hover = false, number, className = '', ...props }, ref) => {
    const variants = {
      default: 'bg-[#1F1F1F] border-2 border-[#333]',
      elevated: 'bg-[#1F1F1F] border-2 border-[#333] shadow-xl',
      outlined: 'bg-transparent border-2 border-[#333]',
      glass: 'bg-[#1F1F1F]/50 backdrop-blur-lg border border-[#333]/50'
    }
    
    const hoverEffect = hover ? 'hover:border-[#00CC44] hover:shadow-2xl transition-all duration-200' : ''
    
    return (
      <div 
        ref={ref}
        className={cn('rounded-2xl p-4 md:p-6 flex flex-col items-center text-center', variants[variant], hoverEffect, className)}
        {...props}
      >
        {/* Number above icon */}
        {number !== undefined && (
          <div className="w-8 h-8 md:w-10 md:h-10 rounded-full bg-[#39FF14]/20 border-2 border-[#39FF14]/30 flex items-center justify-center mb-2">
            <span className="text-xs md:text-sm font-bold text-[#39FF14]">
              {number}
            </span>
          </div>
        )}
        
        {/* Icon */}
        <div className="mb-3 md:mb-4">
          <IconComponent 
            size={iconSize === 'xs' ? 16 : iconSize === 'sm' ? 20 : iconSize === 'md' ? 24 : iconSize === 'lg' ? 32 : 48} 
            color={iconColor} 
            className="flex-shrink-0"
            strokeWidth={2}
          />
        </div>
        
        {/* Title */}
        <Text size="base" className="text-white mb-2 md:mb-3 font-semibold">
          {title}
        </Text>
        
        {/* Body text */}
        <Text size="sm" className="text-neutral-300">
          {children}
        </Text>
      </div>
    )
  }
)
FeatureCard.displayName = 'FeatureCard'

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
        border-2 border-transparent
        hover:bg-[rgba(57,255,20,0.1)] hover:text-[#39FF14] hover:border-[rgba(57,255,20,0.2)]
        active:opacity-80
      `,
      secondary: `
        bg-[#00FFFF] text-black font-semibold
        border-2 border-transparent
        hover:bg-[rgba(0,255,255,0.1)] hover:text-[#00FFFF] hover:border-[rgba(0,255,255,0.2)]
        active:opacity-80
      `,
      accent: `
        bg-[#BF00FF] text-white font-semibold
        border-2 border-transparent
        hover:bg-[rgba(191,0,255,0.1)] hover:text-[#BF00FF] hover:border-[rgba(191,0,255,0.2)]
        active:opacity-80
      `,
      ghost: `
        bg-[rgba(57,255,20,0.1)] text-[#39FF14] 
        border-2 border-[rgba(57,255,20,0.2)]
        hover:bg-[rgba(57,255,20,0.2)]
        active:opacity-80
      `,
      outline: `
        bg-transparent border-2 border-[#39FF14] text-[#39FF14]
        hover:bg-[#39FF14] hover:text-black
        active:opacity-80
      `,
      danger: `
        bg-[#FF0040] text-white font-semibold
        border-2 border-transparent
        hover:bg-[rgba(255,0,64,0.1)] hover:text-[#FF0040] hover:border-[rgba(255,0,64,0.2)]
        active:opacity-80
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
      'rounded-full transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap',
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

    // Auto-resize when container width changes (e.g., grid toggles)
    React.useEffect(() => {
      const textarea = textareaRef.current
      if (!textarea) return

      const resizeObserver = new ResizeObserver(() => {
        requestAnimationFrame(() => {
          autoResize()
        })
      })

      resizeObserver.observe(textarea)

      return () => {
        resizeObserver.disconnect()
      }
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
      'inline-flex items-center justify-center font-semibold rounded-full transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-black disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap',
      'bg-[#BF00FF] text-white border-2 border-transparent hover:bg-[rgba(191,0,255,0.1)] hover:text-[#BF00FF] hover:border-[rgba(191,0,255,0.2)] active:opacity-80',
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
          <h3 className="text-lg md:text-3xl lg:text-4xl font-bold text-center mb-2 md:mb-3" style={{ color: iconColor }}>
            {title}
          </h3>
          <div className="flex flex-col gap-4">
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
// FLOW CARDS COMPONENT - Vertically stacked cards with arrows
// ============================================================================

interface FlowCardsProps extends React.HTMLAttributes<HTMLDivElement> {
  items: Array<{
    label: string
    description: string
    icon?: React.ElementType
    iconColor?: string
  }>
  arrowColor?: string
}

export const FlowCards = React.forwardRef<HTMLDivElement, FlowCardsProps>(
  ({ items, arrowColor = '#39FF14', className = '', ...props }, ref) => {
    const ArrowDownIcon = () => (
      <svg className="w-6 h-6" style={{ color: arrowColor }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
      </svg>
    )

    return (
      <div
        ref={ref}
        className={cn('flex flex-col gap-4 w-full', className)}
        {...props}
      >
        {items.map((item, index) => {
          const IconComponent = item.icon
          return (
            <React.Fragment key={index}>
              <Card variant="default" hover>
                <Stack gap="sm">
                  <div className="flex items-start gap-4">
                    {IconComponent && (
                      <div 
                        className="w-10 h-10 md:w-12 md:h-12 rounded-xl flex items-center justify-center flex-shrink-0"
                        style={{ 
                          backgroundColor: `${item.iconColor || arrowColor}20`,
                          border: `2px solid ${item.iconColor || arrowColor}30`
                        }}
                      >
                        <IconComponent 
                          className="w-5 h-5 md:w-6 md:h-6" 
                          style={{ color: item.iconColor || arrowColor }}
                          strokeWidth={2}
                        />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <Heading level={4} className="text-white mb-2">
                        {item.label}
                      </Heading>
                      <Text size="sm" className="text-neutral-300">
                        {item.description}
                      </Text>
                    </div>
                  </div>
                </Stack>
              </Card>
              
              {/* Arrow between cards (except after last card) */}
              {index < items.length - 1 && (
                <div className="flex justify-center my-2">
                  <div className="animate-bounce">
                    <ArrowDownIcon />
                  </div>
                </div>
              )}
            </React.Fragment>
          )
        })}
      </div>
    )
  }
)
FlowCards.displayName = 'FlowCards'

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
      default: 'rounded-2xl p-6 md:p-8 bg-[#1F1F1F] border-2 border-[#333] shadow-xl hover:border-[#00CC44] hover:shadow-2xl transition-all duration-200 cursor-pointer',
      elevated: 'rounded-2xl p-6 md:p-8 bg-[#1F1F1F] border-2 border-[#333] shadow-xl hover:border-[#00CC44] hover:shadow-2xl transition-all duration-200 cursor-pointer ring-2 border-[#39FF14]'
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
          'leading-relaxed',
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

// Navigation Item Interface - Using centralized type from @/lib/navigation
// Legacy interface kept for backward compatibility but prefer CentralNavItem
type NavItem = CentralNavItem

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
    // Use admin navigation if isAdmin is true, otherwise use provided navigation or centralized userNavigation
    const navItems = isAdmin ? centralAdminNav : (navigation || userNavigation)
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
        
        // Fetch active profile using single source of truth
        if (user) {
          const profileData = await getActiveProfileClient(user.id)
          setProfile(profileData)
        } else {
          setProfile(null)
        }
        
        setLoading(false)
      }

      getUser()

      const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
        setUser(session?.user ?? null)
        if (session?.user) {
          // Refetch active profile when user changes
          const profileData = await getActiveProfileClient(session.user.id)
          setProfile(profileData)
        } else {
          setProfile(null)
        }
      })

      return () => subscription.unsubscribe()
    }, [supabase])

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
          {navItems.map((item: NavItem) => {
            const isActive = isNavItemActive(item, pathname)
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
                        
                        {item.children.map((child: NavItem) => {
                          const ChildIcon = child.icon
                          const isChildActive = isNavItemActive(child, pathname)
                          
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
    
    // Use admin navigation if isAdmin is true, otherwise use provided navigation or centralized userNavigation
    const navItems = isAdmin ? centralAdminNav : (navigation || userNavigation)
    
    // Use centralized mobile navigation
    const mobileNavItems = centralMobileNav.map((item: CentralNavItem) => ({
      ...item,
      isAction: item.href === '#', // "More" button is an action
    }))

    // Get all sidebar items for the drawer (exclude main nav items)
    const allSidebarItems = navItems.filter((item: NavItem) => 
      !mobileNavItems.some((mobileItem: NavItem & { isAction?: boolean }) => 
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
            {mobileNavItems.map((item: NavItem & { isAction?: boolean }) => {
              const Icon = item.icon
              const isActive = isNavItemActive(item, pathname)
              
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
                {allSidebarItems.map((item: NavItem) => {
                  const Icon = item.icon
                  const isActive = isNavItemActive(item, pathname)
                  
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
                  'hover:border-[#39FF14]/50 hover:shadow-xl',
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
    <div className="fixed inset-0 bg-black/50 z-[9999] overflow-y-auto">
      <div className="flex min-h-full items-center justify-center p-4 pt-6 pb-20 md:pb-4">
        <Card className="max-w-md w-full my-auto">
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
    </div>
  )
}

/**
 * InsufficientTokensDialog - Beautiful dialog shown when user runs out of tokens
 * 
 * Features:
 * - Consistent visual design matching DeleteConfirmationDialog
 * - Shows current token balance
 * - Call-to-action button to purchase more tokens
 * - Beautiful energy-themed design with Zap icon
 * - Proper accessibility and keyboard navigation
 * 
 * Usage:
 * <InsufficientTokensDialog
 *   isOpen={showInsufficientTokens}
 *   onClose={() => setShowInsufficientTokens(false)}
 *   tokensRemaining={0}
 *   estimatedTokens={500}
 * />
 */
interface InsufficientTokensDialogProps {
  isOpen: boolean
  onClose: () => void
  tokensRemaining: number
  estimatedTokens?: number // How many tokens the action would require
  actionName?: string // Optional: "refine vision", "generate audio", etc.
}

export const InsufficientTokensDialog: React.FC<InsufficientTokensDialogProps> = ({
  isOpen,
  onClose,
  tokensRemaining,
  estimatedTokens,
  actionName = 'this action'
}) => {
  if (!isOpen) return null

  const formatTokens = (tokens: number) => {
    if (tokens >= 1_000_000) {
      return `${(tokens / 1_000_000).toFixed(1)}M`
    }
    if (tokens >= 1_000) {
      return `${(tokens / 1_000).toFixed(1)}K`
    }
    return tokens.toLocaleString()
  }

  const handleBuyTokens = () => {
    window.location.href = '/dashboard/add-tokens'
  }

  return (
    <div className="fixed inset-0 bg-black/50 z-[9999] overflow-y-auto">
      <div className="flex min-h-full items-center justify-center p-4 pt-6 pb-20 md:pb-4">
        <Card className="max-w-md w-full my-auto">
        <div className="text-center">
          {/* Icon */}
          <div className="w-16 h-16 bg-energy-500/20 rounded-full flex items-center justify-center mx-auto mb-4 relative">
            <Zap className="w-8 h-8 text-energy-500" />
            <div className="absolute inset-0 bg-energy-500/10 rounded-full animate-ping" />
          </div>

          {/* Title */}
          <h3 className="text-2xl font-bold text-white mb-3">
            Insufficient Tokens
          </h3>

          {/* Current Balance */}
          <div className="bg-neutral-900 rounded-xl p-4 mb-4 border border-neutral-700">
            <div className="text-sm text-neutral-400 mb-1">Current Balance</div>
            <div className="flex items-center justify-center gap-2">
              <Zap className="w-5 h-5 text-energy-500" />
              <span className="text-3xl font-bold text-white">
                {formatTokens(tokensRemaining)}
              </span>
              <span className="text-sm text-neutral-500">tokens</span>
            </div>
          </div>

          {/* Message */}
          <p className="text-neutral-300 mb-1">
            {estimatedTokens && estimatedTokens > tokensRemaining ? (
              <>
                This {actionName} requires <span className="font-semibold text-white">{formatTokens(estimatedTokens)} tokens</span>, but you only have <span className="font-semibold text-white">{formatTokens(tokensRemaining)} tokens</span> remaining.
              </>
            ) : (
              <>
                You don't have enough tokens to perform {actionName}.
              </>
            )}
          </p>
          <p className="text-sm text-neutral-400 mb-6">
            Purchase more tokens to continue creating with VIVA.
          </p>

          {/* Actions */}
          <div className="flex flex-col gap-3">
            <Button
              variant="primary"
              size="lg"
              onClick={handleBuyTokens}
              className="w-full"
            >
              <ShoppingCart className="w-4 h-4 mr-2" />
              Buy More Tokens
            </Button>
            <Button
              variant="ghost"
              onClick={onClose}
              className="w-full"
            >
              Maybe Later
            </Button>
          </div>

          {/* Info Footer */}
          <div className="mt-6 pt-6 border-t border-neutral-700">
            <p className="text-xs text-neutral-500">
              Tokens never expire • Use anytime • Instant delivery
            </p>
          </div>
        </div>
      </Card>
      </div>
    </div>
  )
}

/**
 * InsufficientStorageDialog - Beautiful dialog shown when user runs out of storage
 * 
 * Features:
 * - Consistent visual design matching InsufficientTokensDialog
 * - Shows current storage usage and quota
 * - Call-to-action button to upgrade storage
 * - Beautiful storage-themed design with HardDrive icon
 * - Proper accessibility and keyboard navigation
 * 
 * Usage:
 * <InsufficientStorageDialog
 *   isOpen={showInsufficientStorage}
 *   onClose={() => setShowInsufficientStorage(false)}
 *   storageUsedGB={24.5}
 *   storageQuotaGB={25}
 *   estimatedSizeGB={2.5}
 *   actionName="upload file"
 * />
 */
interface InsufficientStorageDialogProps {
  isOpen: boolean
  onClose: () => void
  storageUsedGB: number // Current storage used
  storageQuotaGB: number // Total storage quota
  estimatedSizeGB?: number // Optional: Size of file/action that would exceed quota
  actionName?: string // Optional: "upload file", "save recording", etc.
}

export const InsufficientStorageDialog: React.FC<InsufficientStorageDialogProps> = ({
  isOpen,
  onClose,
  storageUsedGB,
  storageQuotaGB,
  estimatedSizeGB,
  actionName = 'this action'
}) => {
  if (!isOpen) return null

  const formatGB = (gb: number) => {
    if (gb < 0.1) {
      return `${(gb * 1024).toFixed(1)} MB`
    }
    return `${gb.toFixed(2)} GB`
  }

  const remainingGB = Math.max(0, storageQuotaGB - storageUsedGB)
  const usagePercentage = (storageUsedGB / storageQuotaGB) * 100

  const handleUpgradeStorage = () => {
    // Link to pricing or billing page where they can upgrade
    window.location.href = '/pricing'
  }

  return (
    <div className="fixed inset-0 bg-black/50 z-[9999] overflow-y-auto">
      <div className="flex min-h-full items-center justify-center p-4 pt-6 pb-20 md:pb-4">
        <Card className="max-w-md w-full my-auto">
        <div className="text-center">
          {/* Icon */}
          <div className="w-16 h-16 bg-secondary-500/20 rounded-full flex items-center justify-center mx-auto mb-4 relative">
            <HardDrive className="w-8 h-8 text-secondary-500" />
            <div className="absolute inset-0 bg-secondary-500/10 rounded-full animate-ping" />
          </div>

          {/* Title */}
          <h3 className="text-2xl font-bold text-white mb-3">
            Insufficient Storage
          </h3>

          {/* Current Usage */}
          <div className="bg-neutral-900 rounded-xl p-4 mb-4 border border-neutral-700">
            <div className="text-sm text-neutral-400 mb-2">Storage Usage</div>
            
            {/* Progress Bar */}
            <div className="w-full bg-neutral-800 rounded-full h-2 mb-3">
              <div 
                className="h-2 rounded-full bg-gradient-to-r from-secondary-500 to-primary-500 transition-all duration-300"
                style={{ width: `${Math.min(100, usagePercentage)}%` }}
              />
            </div>
            
            {/* Usage Stats */}
            <div className="flex items-center justify-center gap-2 mb-1">
              <HardDrive className="w-5 h-5 text-secondary-500" />
              <span className="text-2xl font-bold text-white">
                {formatGB(storageUsedGB)}
              </span>
              <span className="text-sm text-neutral-500">/</span>
              <span className="text-2xl font-bold text-white">
                {formatGB(storageQuotaGB)}
              </span>
            </div>
            <div className="text-xs text-neutral-400">
              {formatGB(remainingGB)} remaining
            </div>
          </div>

          {/* Message */}
          <p className="text-neutral-300 mb-1">
            {estimatedSizeGB && (remainingGB < estimatedSizeGB) ? (
              <>
                This {actionName} requires <span className="font-semibold text-white">{formatGB(estimatedSizeGB)}</span>, but you only have <span className="font-semibold text-white">{formatGB(remainingGB)}</span> of storage remaining.
              </>
            ) : (
              <>
                You don't have enough storage space to perform {actionName}.
              </>
            )}
          </p>
          <p className="text-sm text-neutral-400 mb-6">
            Upgrade your plan or add storage to continue uploading and creating.
          </p>

          {/* Actions */}
          <div className="flex flex-col gap-3">
            <Button
              variant="primary"
              size="lg"
              onClick={handleUpgradeStorage}
              className="w-full"
            >
              <ShoppingCart className="w-4 h-4 mr-2" />
              Upgrade Storage
            </Button>
            <Button
              variant="ghost"
              onClick={onClose}
              className="w-full"
            >
              Maybe Later
            </Button>
          </div>

          {/* Info Footer */}
          <div className="mt-6 pt-6 border-t border-neutral-700">
            <p className="text-xs text-neutral-500">
              Annual plans include 100GB • Add-ons available • Instant upgrade
            </p>
          </div>
        </div>
      </Card>
      </div>
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
 * - Responsive design: Buttons try to fit side-by-side on mobile, wrap to stack only if needed
 * - Customizable variants and sizes
 * - Optional labels for icon-only buttons
 * 
 * Mobile Behavior:
 * - Uses flex-row with flex-wrap to allow buttons side-by-side when they fit
 * - Automatically wraps to new line if buttons don't fit (prevents overflow)
 * - Preference: Side-by-side when space allows, stack only when necessary
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
      <div className={cn('flex flex-row flex-wrap gap-2 md:gap-4 w-full', className)}>
        {/* Edit Button */}
        <Button 
          asChild 
          size={size} 
          variant={variant} 
          className="text-xs md:text-sm flex-1 min-w-0 shrink"
        >
          <Link href={editHref || viewHref}>
            <Edit className="w-4 h-4 flex-shrink-0" />
            {showLabels && <span className="ml-1">Edit</span>}
          </Link>
        </Button>
        
        {/* View Button */}
        <Button 
          asChild 
          size={size} 
          variant={variant} 
          className="text-xs md:text-sm flex-1 min-w-0 shrink"
        >
          <Link href={viewHref}>
            <Eye className="w-4 h-4 flex-shrink-0" />
            {showLabels && <span className="ml-1">View</span>}
          </Link>
        </Button>
        
        {/* Commit Button */}
        <Button
          size={size}
          variant={commitVariant}
          onClick={onCommit}
          disabled={isCommitting}
          className="text-xs md:text-sm flex-1 min-w-0 shrink"
        >
          {isCommitting ? (
            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin flex-shrink-0" />
          ) : (
            <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
          )}
          {showLabels && <span className="ml-1">Commit</span>}
        </Button>
      </div>
    )
  }

  // Completed version - show Edit, View and Delete
  return (
    <div className={cn('flex flex-row flex-wrap gap-2 md:gap-4 w-full', className)}>
      {/* Edit Button */}
      <Button 
        asChild 
        size={size} 
        variant={variant} 
        className="text-xs md:text-sm flex-1 min-w-0 shrink"
      >
        <Link href={editHref || viewHref}>
          <Edit className="w-4 h-4 flex-shrink-0" />
          {showLabels && <span className="ml-1">Edit</span>}
        </Link>
      </Button>
      
      {/* View Button */}
      <Button 
        asChild 
        size={size} 
        variant={variant} 
        className="text-xs md:text-sm flex-1 min-w-0 shrink"
      >
        <Link href={viewHref}>
          <Eye className="w-4 h-4 flex-shrink-0" />
          {showLabels && <span className="ml-1">View</span>}
        </Link>
      </Button>
      
      {/* Delete Button */}
      <Button
        size={size}
        variant={deleteVariant}
        onClick={onDelete}
        className="text-xs md:text-sm flex-1 min-w-0 shrink"
      >
        <X className="w-4 h-4 flex-shrink-0" />
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

        {/* Play Button + Progress Bar in Line */}
        <div className="flex items-center gap-3 mb-3">
          {/* Play/Pause Button */}
          <button
            onClick={togglePlayPause}
            className="w-10 h-10 flex items-center justify-center rounded-full bg-[#39FF14] text-black hover:bg-[rgba(57,255,20,0.8)] transition-all duration-300 hover:scale-105 active:scale-95 flex-shrink-0"
            aria-label={isPlaying ? 'Pause' : 'Play'}
          >
            {isPlaying ? (
              <Pause className="w-5 h-5" fill="currentColor" />
            ) : (
              <Play className="w-5 h-5 ml-0.5" fill="currentColor" />
            )}
          </button>

          {/* Progress Bar */}
          <div className="flex-1">
            <input
              type="range"
              min="0"
              max={duration || 0}
              step="0.1"
              value={currentTime}
              onChange={handleSeek}
              className="w-full h-1.5 bg-neutral-700 rounded-full appearance-none cursor-pointer accent-[#39FF14]"
              style={{
                background: `linear-gradient(to right, #39FF14 0%, #39FF14 ${progress}%, #404040 ${progress}%, #404040 100%)`
              }}
            />
          </div>
        </div>

        {/* Time Display */}
        <div className="flex justify-between items-center text-xs text-neutral-400">
          <span>{formatTime(currentTime)}</span>
          <span>{formatTime(duration)}</span>
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
  const lastRepeatClickRef = useRef<number>(0)

  const currentTrack = tracks[currentTrackIndex]
  
  // Audio mixing handled by server-side Lambda
  
  // Define handleNext before useEffects
  const handleNext = useCallback(() => {
    setCurrentTrackIndex((currentIndex) => {
      let newIndex = currentIndex + 1

      if (repeatMode === 'one') {
        newIndex = currentIndex
      } else if (repeatMode === 'all' && newIndex >= tracks.length) {
        newIndex = 0
      } else if (newIndex >= tracks.length) {
        setIsPlaying(false)
        return currentIndex
      }

      setCurrentTime(0)
      return newIndex
    })
  }, [repeatMode, tracks.length])

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
  }, [handleNext])

  useEffect(() => {
    const audio = audioRef.current
    if (!audio) return
    
    // Update audio source when track changes
    audio.src = currentTrack?.url || ''
    
    // Auto-play if currently playing
    if (isPlaying && currentTrack?.url) {
      audio.play().catch(() => setIsPlaying(false))
    }
  }, [currentTrackIndex, currentTrack?.url, isPlaying])

  const togglePlayPause = async () => {
    // Use standard HTML audio (server-side mixing handles all mixing)
    const audio = audioRef.current
    if (!audio) return

    if (isPlaying) {
      audio.pause()
    } else {
      audio.play()
    }
    setIsPlaying(!isPlaying)
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

  const handleRepeatClick = () => {
    const now = Date.now()
    const timeSinceLastClick = now - lastRepeatClickRef.current
    
    // Double-click detected (within 500ms)
    if (timeSinceLastClick < 500) {
      // Restart current track
      const audio = audioRef.current
      if (audio) {
        audio.currentTime = 0
        if (!isPlaying) {
          audio.play()
          setIsPlaying(true)
        }
      }
      lastRepeatClickRef.current = 0 // Reset to prevent triple-click
    } else {
      // Single click - cycle repeat mode
      lastRepeatClickRef.current = now
      setTimeout(() => {
        // Check if it's still the same timestamp (no double-click occurred)
        if (lastRepeatClickRef.current === now) {
          const modes: ('off' | 'all' | 'one')[] = ['off', 'all', 'one']
          const currentIndex = modes.indexOf(repeatMode)
          const nextIndex = (currentIndex + 1) % modes.length
          setRepeatMode(modes[nextIndex])
        }
      }, 500)
    }
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
          onClick={handleRepeatClick}
          className={cn(
            'w-10 h-10 flex items-center justify-center rounded-full transition-colors relative',
            repeatMode !== 'off'
              ? 'bg-[#39FF14] text-black' 
              : 'text-neutral-400 hover:text-white'
          )}
          aria-label="Repeat"
        >
          <Repeat className="w-5 h-5" />
          {repeatMode === 'one' && (
            <span className="absolute inset-0 flex items-center justify-center text-[10px] font-bold leading-none">
              1
            </span>
          )}
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
      <Card variant="default" className="overflow-hidden">
        <Stack gap="xs">
          <h4 className="text-lg font-semibold text-white mb-2">Playlist</h4>
          <div className="max-h-[60vh] overflow-y-auto">
          {tracks.map((track, index) => (
            <button
              key={`playlist-item-${index}`}
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
          </div>
        </Stack>
      </Card>
    </div>
  )
}
PlaylistPlayer.displayName = 'PlaylistPlayer'

// ============================================================================
// TYPOGRAPHY COMPONENTS
// ============================================================================

interface HeadingProps extends React.HTMLAttributes<HTMLHeadingElement> {
  children: React.ReactNode
  level?: 1 | 2 | 3 | 4
  className?: string
}

export const Heading = React.forwardRef<HTMLHeadingElement, HeadingProps>(
  ({ children, level = 1, className = '', ...props }, ref) => {
    const sizes = {
      1: 'text-2xl md:text-5xl lg:text-6xl',      // Hero titles
      2: 'text-xl md:text-4xl lg:text-5xl',       // Section titles
      3: 'text-lg md:text-3xl lg:text-4xl',       // Subsection titles
      4: 'text-lg md:text-2xl'      // Card titles
    }
    
    const margins = {
      1: 'mb-4 md:mb-6',
      2: 'mb-3 md:mb-4',
      3: 'mb-2 md:mb-3',
      4: 'mb-2'
    }
    
    const weights = {
      1: 'font-bold',
      2: 'font-bold',
      3: 'font-bold',
      4: '' // H4 is not bold
    }
    
    const baseClassName = cn(weights[level], sizes[level], margins[level], className)
    
    switch (level) {
      case 1:
        return (
          <h1 ref={ref} className={baseClassName} {...props}>
            {children}
          </h1>
        )
      case 2:
        return (
          <h2 ref={ref} className={baseClassName} {...props}>
            {children}
          </h2>
        )
      case 3:
        return (
          <h3 ref={ref} className={baseClassName} {...props}>
            {children}
          </h3>
        )
      case 4:
        return (
          <h4 ref={ref} className={baseClassName} {...props}>
            {children}
          </h4>
        )
    }
  }
)
Heading.displayName = 'Heading'

interface TextProps extends React.HTMLAttributes<HTMLParagraphElement> {
  children: React.ReactNode
  size?: 'xs' | 'sm' | 'base' | 'lg' | 'xl' | '2xl'
  className?: string
}

export const Text = React.forwardRef<HTMLParagraphElement, TextProps>(
  ({ children, size = 'base', className = '', ...props }, ref) => {
    const sizes = {
      xs: 'text-xs',
      sm: 'text-sm md:text-base',
      base: 'text-base md:text-lg',
      lg: 'text-lg md:text-xl',
      xl: 'text-lg md:text-2xl',
      '2xl': 'text-xl md:text-3xl'
    }
    
    return (
      <p
        ref={ref}
        className={cn(sizes[size], className)}
        {...props}
      >
        {children}
      </p>
    )
  }
)
Text.displayName = 'Text'

interface TitleProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode
  level?: 'hero' | 'section' | 'card'
  className?: string
}

export const Title = React.forwardRef<HTMLDivElement, TitleProps>(
  ({ children, level = 'section', className = '', ...props }, ref) => {
    const styles = {
      hero: 'text-2xl md:text-5xl lg:text-6xl font-bold leading-tight',
      section: 'text-xl md:text-4xl lg:text-5xl font-bold',
      card: 'text-lg md:text-3xl lg:text-4xl font-bold'
    }
    
    return (
      <div
        ref={ref}
        className={cn(styles[level], className)}
        {...props}
      >
        {children}
      </div>
    )
  }
)
Title.displayName = 'Title'

// ============================================================================
// TOGGLE COMPONENT
// ============================================================================

interface ToggleOption<T extends string> {
  value: T
  label: string
  badge?: string
  badgeColor?: string
}

interface ToggleProps<T extends string> extends Omit<React.HTMLAttributes<HTMLDivElement>, 'onChange'> {
  options: ToggleOption<T>[]
  value: T
  onChange: (value: T) => void
  activeColor?: string
  inactiveColor?: string
  size?: 'sm' | 'md' | 'lg'
}

export function Toggle<T extends string>({
  options,
  value,
  onChange,
  activeColor = '#39FF14',
  inactiveColor = 'neutral',
  size = 'md',
  className = '',
  ...props
}: ToggleProps<T>) {
  const sizes = {
    sm: 'px-3 py-2 text-sm',
    md: 'px-4 py-3.5 text-base',
    lg: 'px-6 py-4 text-lg'
  }

  // Convert hex color to rgba for shadow
  const hexToRgba = (hex: string, alpha: number) => {
    const r = parseInt(hex.slice(1, 3), 16)
    const g = parseInt(hex.slice(3, 5), 16)
    const b = parseInt(hex.slice(5, 7), 16)
    return `rgba(${r}, ${g}, ${b}, ${alpha})`
  }

  return (
    <div 
      className={cn(
        'inline-flex items-center gap-2 p-2 bg-neutral-800/80 backdrop-blur-sm rounded-full border border-neutral-700',
        className
      )}
      {...props}
    >
      {options.map((option) => {
        const isActive = value === option.value
        return (
          <button
            key={option.value}
            onClick={() => onChange(option.value)}
            className={cn(
              'rounded-full font-semibold transition-all duration-300',
              sizes[size],
              !isActive && 'text-neutral-400 hover:text-white hover:bg-neutral-700/50'
            )}
            style={isActive ? {
              backgroundColor: activeColor,
              color: '#000000',
              boxShadow: `0 10px 15px -3px ${hexToRgba(activeColor, 0.3)}, 0 4px 6px -2px ${hexToRgba(activeColor, 0.2)}`,
              transform: 'scale(1.05)'
            } : {}}
          >
            <span className="flex items-center gap-2">
              {option.label}
              {option.badge && isActive && (
                <span 
                  className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold text-black shadow-md"
                  style={{ backgroundColor: option.badgeColor || '#FFB701' }}
                >
                  {option.badge}
                </span>
              )}
            </span>
          </button>
        )
      })}
    </div>
  )
}

// ============================================================================
// PROOF WALL COMPONENT - Before/After Carousel
// ============================================================================

interface ProofWallItem {
  id: string
  beforeImage: string
  afterImage: string
  beforeAlt?: string
  afterAlt?: string
  story: string
  storyTitle?: string
}

interface ProofWallProps extends React.HTMLAttributes<HTMLDivElement> {
  items: ProofWallItem[]
  title?: string
  className?: string
}

export const ProofWall = React.forwardRef<HTMLDivElement, ProofWallProps>(
  ({ items, title, className = '', ...props }, ref) => {
    const [currentIndex, setCurrentIndex] = useState(1) // Start at 1 to account for duplicate slide
    const [selectedStory, setSelectedStory] = useState<ProofWallItem | null>(null)
    const [isDragging, setIsDragging] = useState(false)
    const [startX, setStartX] = useState(0)
    const [scrollLeft, setScrollLeft] = useState(0)
    const carouselRef = useRef<HTMLDivElement>(null)
    const isTransitioning = useRef(false)

    const totalSlides = items.length

    // Create infinite scroll by duplicating first and last slides
    const getSlidesToRender = useCallback(() => {
      if (items.length === 0) return []
      
      // Duplicate last slide at beginning and first slide at end for seamless loop
      return [
        items[items.length - 1], // Clone of last item
        ...items,                 // All original items
        items[0]                  // Clone of first item
      ]
    }, [items])

    const slidesToRender = getSlidesToRender()
    const adjustedSlidesCount = slidesToRender.length

    const goToSlide = useCallback((index: number, skipAnimation = false) => {
      if (isTransitioning.current) return
      
      setCurrentIndex(index)
      
      if (carouselRef.current && !skipAnimation) {
        isTransitioning.current = true
        carouselRef.current.scrollTo({
          left: index * carouselRef.current.offsetWidth,
          behavior: 'smooth'
        })
        
        setTimeout(() => {
          isTransitioning.current = false
        }, 500)
      }
    }, [])

    const handleTouchStart = (e: React.TouchEvent) => {
      setIsDragging(true)
      setStartX(e.touches[0].pageX - (carouselRef.current?.offsetLeft || 0))
      setScrollLeft(carouselRef.current?.scrollLeft || 0)
    }

    const handleTouchMove = (e: React.TouchEvent) => {
      if (!isDragging) return
      e.preventDefault()
      const x = e.touches[0].pageX - (carouselRef.current?.offsetLeft || 0)
      const walk = (x - startX) * 2
      if (carouselRef.current) {
        carouselRef.current.scrollLeft = scrollLeft - walk
      }
    }

    const handleTouchEnd = () => {
      if (!isDragging) return
      setIsDragging(false)
      
      if (carouselRef.current) {
        const containerWidth = carouselRef.current.offsetWidth
        const scrollPosition = carouselRef.current.scrollLeft
        const slideWidth = containerWidth
        const newIndex = Math.round(scrollPosition / slideWidth)
        goToSlide(newIndex)
      }
    }

    const handleMouseDown = (e: React.MouseEvent) => {
      setIsDragging(true)
      setStartX(e.pageX - (carouselRef.current?.offsetLeft || 0))
      setScrollLeft(carouselRef.current?.scrollLeft || 0)
    }

    const handleMouseMove = (e: React.MouseEvent) => {
      if (!isDragging) return
      e.preventDefault()
      const x = e.pageX - (carouselRef.current?.offsetLeft || 0)
      const walk = (x - startX) * 2
      if (carouselRef.current) {
        carouselRef.current.scrollLeft = scrollLeft - walk
      }
    }

    const handleMouseUp = () => {
      setIsDragging(false)
      
      if (carouselRef.current) {
        const containerWidth = carouselRef.current.offsetWidth
        const scrollPosition = carouselRef.current.scrollLeft
        const slideWidth = containerWidth
        const newIndex = Math.round(scrollPosition / slideWidth)
        goToSlide(newIndex)
      }
    }

    useEffect(() => {
      if (carouselRef.current && !isTransitioning.current) {
        isTransitioning.current = true
        carouselRef.current.scrollTo({
          left: currentIndex * carouselRef.current.offsetWidth,
          behavior: 'smooth'
        })
        setTimeout(() => {
          isTransitioning.current = false
        }, 500)
      }
    }, [currentIndex])

    // Handle infinite scroll looping
    useEffect(() => {
      const handleScroll = () => {
        if (!carouselRef.current || isTransitioning.current) return
        
        const containerWidth = carouselRef.current.offsetWidth
        const scrollPosition = carouselRef.current.scrollLeft
        const slideWidth = containerWidth
        
        // If at the last duplicate slide (cloned first slide), jump to the real first slide
        if (scrollPosition >= slideWidth * (adjustedSlidesCount - 1)) {
          carouselRef.current.scrollTo({
            left: slideWidth, // Jump to real first slide
            behavior: 'auto' // Instant jump, no animation
          })
          setCurrentIndex(1)
        }
        // If at the first duplicate slide (cloned last slide), jump to the real last slide
        else if (scrollPosition < slideWidth) {
          carouselRef.current.scrollTo({
            left: slideWidth * totalSlides, // Jump to real last slide
            behavior: 'auto' // Instant jump, no animation
          })
          setCurrentIndex(totalSlides)
        } else {
          const newIndex = Math.round(scrollPosition / slideWidth)
          setCurrentIndex(newIndex)
        }
      }

      const carousel = carouselRef.current
      if (carousel) {
        carousel.addEventListener('scroll', handleScroll)
        return () => carousel.removeEventListener('scroll', handleScroll)
      }
    }, [adjustedSlidesCount, totalSlides])

    // Initialize scroll position to the first real slide
    useEffect(() => {
      if (carouselRef.current) {
        carouselRef.current.scrollLeft = carouselRef.current.offsetWidth
      }
    }, [])

    return (
      <div
        ref={ref}
        className={cn('w-full', className)}
        {...props}
      >
        {title && (
          <Heading level={2} className="text-white text-center mb-6">
            {title}
          </Heading>
        )}
        
        <div className="relative">
          {/* Carousel Container */}
          <div
            ref={carouselRef}
            className="flex overflow-x-hidden scroll-smooth snap-x snap-mandatory scrollbar-hide"
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
            style={{ WebkitOverflowScrolling: 'touch' }}
          >
            {/* Render slides with infinite scroll duplication */}
            {slidesToRender.map((item, slideIndex) => (
              <div
                key={`slide-${slideIndex}`}
                className="min-w-full snap-center px-2 md:px-4"
              >
                <Card variant="default" className="overflow-hidden">
                  <Stack gap="md">
                    {/* Before/After Images */}
                    <div className="grid grid-cols-2 gap-4">
                      <div className="relative aspect-[4/3] overflow-hidden rounded-xl bg-neutral-800">
                        <img
                          src={item.beforeImage}
                          alt={item.beforeAlt || 'Vision'}
                          className="w-full h-full object-cover"
                        />
                        <div className="absolute top-2 left-2 bg-red-500/80 text-white text-xs font-semibold px-2 py-1 rounded">
                          Vision
                        </div>
                      </div>
                      <div className="relative aspect-[4/3] overflow-hidden rounded-xl bg-neutral-800">
                        <img
                          src={item.afterImage}
                          alt={item.afterAlt || 'Actualized'}
                          className="w-full h-full object-cover"
                        />
                        <div className="absolute top-2 right-2 bg-[#39FF14]/80 text-black text-xs font-semibold px-2 py-1 rounded">
                          Actualized
                        </div>
                      </div>
                    </div>
                    
                    {/* Story Button */}
                    <div className="text-center">
                      <Button
                        variant="primary"
                        onClick={() => setSelectedStory(item)}
                        size="md"
                      >
                        Actualization Story
                      </Button>
                    </div>
                  </Stack>
                </Card>
              </div>
            ))}
          </div>

          {/* Navigation Arrows */}
          {totalSlides > 1 && (
            <>
              <button
                onClick={() => goToSlide(currentIndex - 1)}
                className="absolute left-2 top-1/2 -translate-y-1/2 w-10 h-10 bg-[#1F1F1F]/90 border-2 border-[#39FF14] rounded-full flex items-center justify-center text-[#39FF14] hover:bg-[#39FF14] hover:text-black transition-all duration-200 z-10"
                aria-label="Previous"
              >
                <ChevronLeft className="w-6 h-6" />
              </button>
              <button
                onClick={() => goToSlide(currentIndex + 1)}
                className="absolute right-2 top-1/2 -translate-y-1/2 w-10 h-10 bg-[#1F1F1F]/90 border-2 border-[#39FF14] rounded-full flex items-center justify-center text-[#39FF14] hover:bg-[#39FF14] hover:text-black transition-all duration-200 z-10"
                aria-label="Next"
              >
                <ChevronRight className="w-6 h-6" />
              </button>
            </>
          )}

          {/* Dots Indicator */}
          {totalSlides > 1 && (
            <div className="flex justify-center gap-2 mt-4">
              {Array.from({ length: totalSlides }).map((_, index) => {
                // Map currentIndex (1-3 for 3 slides) to display index (0-2)
                const adjustedIndex = index + 1 // dot 0 = slide 1, dot 1 = slide 2, etc.
                const isActive = currentIndex === adjustedIndex
                
                return (
                  <button
                    key={index}
                    onClick={() => goToSlide(adjustedIndex)}
                    className={cn(
                      'w-2 h-2 rounded-full transition-all duration-200',
                      isActive
                        ? 'bg-[#39FF14] w-8'
                        : 'bg-neutral-600 hover:bg-neutral-500'
                    )}
                    aria-label={`Go to slide ${index + 1}`}
                  />
                )
              })}
            </div>
          )}
        </div>

        {/* Story Modal */}
        <Modal
          isOpen={!!selectedStory}
          onClose={() => setSelectedStory(null)}
          title={selectedStory?.storyTitle || 'Actualization Story'}
          size="lg"
          variant="default"
        >
          <div className="p-4">
            <Text size="base" className="text-neutral-200 whitespace-pre-line">
              {selectedStory?.story}
            </Text>
          </div>
        </Modal>
      </div>
    )
  }
)
ProofWall.displayName = 'ProofWall'

// ============================================================================
// SWIPEABLE CARDS COMPONENT - Mobile-Optimized Swipeable Card Stack
// ============================================================================

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
    desktopCardsPerView = 3,
    swipeThreshold = 0.25,
    hapticFeedback = true,
    autoSnap = true,
    showIndicators = true,
    cardVariant = 'default',
    onCardSwiped,
    onCardClick,
    className = '',
    ...props 
  }, ref) => {
    const [currentIndex, setCurrentIndex] = useState(0)
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
      if (!isMobile && mobileOnly) return
      
      setIsDragging(true)
      setStartX(e.touches[0].clientX)
      setStartY(e.touches[0].clientY)
      setTranslateX(0)
      setTranslateY(0)
    }

    const handleTouchMove = (e: React.TouchEvent) => {
      if (!isDragging || (!isMobile && mobileOnly)) return

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
        
        if (direction === 'left' && currentIndex < cards.length - 1) {
          // Swipe left - next card
          triggerHaptic('medium')
          const newIndex = currentIndex + 1
          setCurrentIndex(newIndex)
          onCardSwiped?.(cards[currentIndex].id, 'left')
        } else if (direction === 'right' && currentIndex > 0) {
          // Swipe right - previous card
          triggerHaptic('medium')
          const newIndex = currentIndex - 1
          setCurrentIndex(newIndex)
          onCardSwiped?.(cards[currentIndex].id, 'right')
        } else {
          // Snap back
          triggerHaptic('light')
          if (autoSnap) {
            // Reset position
            setTranslateX(0)
            setTranslateY(0)
          }
        }
      } else {
        // Snap back - didn't reach threshold
        if (autoSnap) {
          setTranslateX(0)
          setTranslateY(0)
        }
      }

      setIsDragging(false)
    }

    // Mouse handlers (for desktop testing)
    const handleMouseDown = (e: React.MouseEvent) => {
      if (!isMobile && mobileOnly) return
      
      setIsDragging(true)
      setStartX(e.clientX)
      setStartY(e.clientY)
      setTranslateX(0)
      setTranslateY(0)
    }

    const handleMouseMove = (e: React.MouseEvent) => {
      if (!isDragging || (!isMobile && mobileOnly)) return

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
        
        if (direction === 'left' && currentIndex < cards.length - 1) {
          triggerHaptic('medium')
          const newIndex = currentIndex + 1
          setCurrentIndex(newIndex)
          onCardSwiped?.(cards[currentIndex].id, 'left')
        } else if (direction === 'right' && currentIndex > 0) {
          triggerHaptic('medium')
          const newIndex = currentIndex - 1
          setCurrentIndex(newIndex)
          onCardSwiped?.(cards[currentIndex].id, 'right')
        } else {
          triggerHaptic('light')
          if (autoSnap) {
            setTranslateX(0)
            setTranslateY(0)
          }
        }
      } else {
        if (autoSnap) {
          setTranslateX(0)
          setTranslateY(0)
        }
      }

      setIsDragging(false)
    }

    // Navigate to specific card
    const goToCard = (index: number) => {
      if (index < 0 || index >= cards.length) return
      setCurrentIndex(index)
      setTranslateX(0)
      setTranslateY(0)
      triggerHaptic('light')
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
    const showDesktopGrid = !mobileOnly || !isMobile

    // Desktop scrollable view ref (used only in desktop view)
    const scrollContainerRef = React.useRef<HTMLDivElement>(null)
    
    const scrollCards = React.useCallback((direction: 'left' | 'right') => {
        if (!scrollContainerRef.current) return
        
        const container = scrollContainerRef.current
        const cardWidth = container.clientWidth / desktopCardsPerView
        const scrollAmount = cardWidth * desktopCardsPerView + (24 * (desktopCardsPerView - 1)) // card width * cards + gaps
        const currentScroll = container.scrollLeft
        
        if (direction === 'left') {
          container.scrollTo({
            left: Math.max(0, currentScroll - scrollAmount),
            behavior: 'smooth'
          })
        } else {
          container.scrollTo({
            left: Math.min(container.scrollWidth - container.clientWidth, currentScroll + scrollAmount),
            behavior: 'smooth'
          })
        }
    }, [desktopCardsPerView])
    
    if (showDesktopGrid && !isMobile) {
      // Desktop scrollable view - 3 cards at a time
      return (
        <div
          ref={ref}
          className={cn('w-full', className)}
          {...props}
        >
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
          
          <div className="relative overflow-hidden">
            {/* Scrollable container - shows 3 cards at a time */}
            <div
              ref={scrollContainerRef}
              className="overflow-x-auto scrollbar-hide scroll-smooth snap-x snap-mandatory"
              style={{
                scrollbarWidth: 'none',
                msOverflowStyle: 'none',
                WebkitOverflowScrolling: 'touch',
              }}
            >
              <div className="flex gap-6">
                {cards.map((card, index) => (
                  <div
                    key={card.id}
                    className="flex-shrink-0 snap-start"
                    style={{ 
                      width: `calc((100% - ${(desktopCardsPerView - 1) * 1.5}rem) / ${desktopCardsPerView})`,
                      minWidth: `calc((100% - ${(desktopCardsPerView - 1) * 1.5}rem) / ${desktopCardsPerView})`,
                    }}
                  >
                    <Card
                      variant={cardVariant}
                      className={cn(
                        'overflow-hidden transition-all duration-300 h-full',
                        'hover:-translate-y-1 hover:border-primary-500',
                        card.onClick && 'cursor-pointer'
                      )}
                      onClick={() => {
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
                          className="relative w-full aspect-[3/2] overflow-hidden rounded-2xl cursor-pointer group"
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
                          <Icon icon={ArrowDown} size="md" color="#39FF14" className="animate-pulse" />
                        </div>
                      )}

                      {/* Actualized Image (Bottom) */}
                      {card.actualizedImage && (
                        <div 
                          className="relative w-full aspect-[3/2] overflow-hidden rounded-2xl cursor-pointer group"
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
                  
                  {card.title && (
                    <Heading level={4} className="text-white text-base md:text-lg">
                      {card.title}
                    </Heading>
                  )}
                  
                  {card.content && (
                    <div className="flex-1">
                      {card.content}
                    </div>
                  )}
                  
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
                  className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-4 w-10 h-10 bg-[#1F1F1F] border-2 border-[#333] rounded-full flex items-center justify-center hover:border-primary-500 transition-colors z-10"
                  aria-label="Scroll left"
                >
                  <Icon icon={ChevronLeft} size="md" />
                </button>
                <button
                  onClick={() => scrollCards('right')}
                  className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-4 w-10 h-10 bg-[#1F1F1F] border-2 border-[#333] rounded-full flex items-center justify-center hover:border-primary-500 transition-colors z-10"
                  aria-label="Scroll right"
                >
                  <Icon icon={ChevronRight} size="md" />
                </button>
              </>
            )}
          </div>
        </div>
      )
    }

    // Mobile swipeable view
    if (cards.length === 0) {
      return null
    }

    return (
      <div
        ref={ref}
        className={cn('w-full', className)}
        {...props}
      >
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

        <div className="relative">
          {/* Swipeable Cards Container */}
          <div
            ref={containerRef}
            className="relative w-full overflow-hidden"
            style={{ touchAction: 'pan-y pinch-zoom' }}
          >
            {/* Card Stack */}
            <div className="relative w-full">
              {cards.map((card, index) => {
                const isActive = index === currentIndex
                const isNext = index === currentIndex + 1
                const isPrev = index === currentIndex - 1
                
                // Calculate position and scale
                let position = 0
                let scale = 0.9
                let opacity = 0.5
                let zIndex = 0

                if (isActive) {
                  position = translateX
                  scale = 1
                  opacity = 1
                  zIndex = 10
                } else if (isNext) {
                  position = containerRef.current ? containerRef.current.offsetWidth * 0.05 : 20
                  scale = 0.95
                  opacity = 0.8
                  zIndex = 5
                } else if (isPrev) {
                  position = containerRef.current ? -containerRef.current.offsetWidth * 0.05 : -20
                  scale = 0.95
                  opacity = 0.8
                  zIndex = 5
                } else {
                  // Cards further away
                  scale = 0.85
                  opacity = 0.3
                  zIndex = 1
                }

                return (
                  <div
                    key={card.id}
                    ref={(el) => {
                      cardRefs.current[index] = el
                    }}
                    className={cn(
                      'transition-transform duration-300 ease-out',
                      isActive ? 'relative w-full' : 'absolute inset-0'
                    )}
                    style={{
                      transform: `translateX(${position}px) scale(${scale})`,
                      opacity,
                      zIndex,
                      touchAction: isActive ? 'pan-x' : 'none',
                      pointerEvents: isActive ? 'auto' : 'none',
                    }}
                    onTouchStart={isActive ? handleTouchStart : undefined}
                    onTouchMove={isActive ? handleTouchMove : undefined}
                    onTouchEnd={isActive ? handleTouchEnd : undefined}
                    onMouseDown={isActive ? handleMouseDown : undefined}
                    onMouseMove={isActive ? handleMouseMove : undefined}
                    onMouseUp={isActive ? handleMouseUp : undefined}
                    onMouseLeave={isActive ? handleMouseUp : undefined}
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
                        'w-full overflow-hidden transition-all duration-300',
                        isActive && 'border-primary-500',
                        card.onClick && !isDragging && 'cursor-pointer'
                      )}
                    >
                      <div className="w-full space-y-2">
                        {/* Vision Transformation: Active/Actualized Images */}
                        {(card.activeImage || card.actualizedImage) ? (
                          <>
                            {/* Active Image (Top) */}
                            {card.activeImage && (
                              <div 
                                className="relative w-full aspect-[3/2] overflow-hidden rounded-2xl cursor-pointer group"
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
                              <div className="flex items-center justify-center">
                                <Icon icon={ArrowDown} size="md" color="#39FF14" className="animate-pulse" />
                              </div>
                            )}

                            {/* Actualized Image (Bottom) */}
                            {card.actualizedImage && (
                              <div 
                                className="relative w-full aspect-[3/2] overflow-hidden rounded-2xl cursor-pointer group"
                                onClick={() => setLightboxImage({ 
                                  src: card.actualizedImage!, 
                                  alt: card.actualizedImageAlt || card.title || 'Actualized result',
                                  type: 'actualized'
                                })}
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
                          </>
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
                        
                        {card.title && (
                          <Heading level={4} className="text-white text-lg md:text-xl">
                            {card.title}
                          </Heading>
                        )}
                        
                        {card.content && (
                          <div className="flex-1 overflow-y-auto">
                            {card.content}
                          </div>
                        )}
                        
                        {card.footer && (
                          <div 
                            className={cn(card.title || card.content ? "border-t border-neutral-700 pt-2" : "pt-[7px]")}
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
                      </div>
                    </Card>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Card Indicators */}
          {showIndicators && cards.length > 1 && (
            <div className="flex justify-center gap-2 mt-4">
              {cards.map((_, index) => (
                <button
                  key={index}
                  onClick={() => goToCard(index)}
                  className={cn(
                    'h-2 rounded-full transition-all duration-200 min-w-[44px]',
                    index === currentIndex
                      ? 'bg-primary-500 w-8'
                      : 'bg-neutral-600 hover:bg-neutral-500 w-2'
                  )}
                  aria-label={`Go to card ${index + 1}`}
                />
              ))}
            </div>
          )}

        </div>

        {/* Story Modal */}
        {selectedCardId && (() => {
          const selectedCard = cards.find(card => card.id === selectedCardId)
          if (!selectedCard) return null
          
          return (
            <Modal
              isOpen={!!selectedCardId}
              onClose={() => setSelectedCardId(null)}
              title={selectedCard.title || 'Full Story'}
              size="lg"
              variant="default"
            >
              <div className="space-y-4">
                {selectedCard.activeImage && selectedCard.actualizedImage && (
                  <div className="space-y-4">
                    <div className="relative w-full aspect-[3/2] overflow-hidden rounded-2xl">
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
                      <Icon icon={ArrowDown} size="md" color="#39FF14" className="animate-pulse" />
                    </div>
                    <div className="relative w-full aspect-[3/2] overflow-hidden rounded-2xl">
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
                  <div className="text-neutral-300">
                    {selectedCard.content}
                  </div>
                )}
                {!selectedCard.content && !selectedCard.activeImage && (
                  <Text size="base" className="text-neutral-300">
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
              className="relative max-w-7xl max-h-full w-full h-full flex items-center justify-center cursor-default"
              onClick={(e) => e.stopPropagation()}
            >
              <img
                src={lightboxImage.src}
                alt={lightboxImage.alt}
                className="max-w-full max-h-full object-contain"
              />
            </div>
          </div>
        )}
      </div>
    )
  }
)
SwipeableCards.displayName = 'SwipeableCards'
