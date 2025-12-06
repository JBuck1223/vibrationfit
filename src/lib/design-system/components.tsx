'use client'

// VibrationFit Design System - Component Library
// Mobile-First, Neon Cyberpunk Aesthetic
// Path: /src/lib/design-system/components.tsx

import React, { useState, useEffect, useRef, useCallback, useId } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { getActiveProfileClient } from '@/lib/supabase/profile-client'
import { useStorageData } from '@/hooks/useStorageData'
import { userNavigation, adminNavigation as centralAdminNav, mobileNavigation as centralMobileNav, isNavItemActive, type NavItem as CentralNavItem } from '@/lib/navigation'
import {
  Activity,
  AlertTriangle,
  ArrowDown,
  ArrowRight,
  Award,
  BarChart3,
  BookOpen,
  Brain,
  CalendarDays,
  Check,
  CheckCircle,
  CheckCircle2,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Circle,
  Clock,
  CreditCard,
  Crown,
  DollarSign,
  Download,
  Dumbbell,
  Edit,
  Eye,
  FileText,
  Gift,
  Globe,
  HardDrive,
  Headphones,
  HelpCircle,
  Home,
  Image,
  Layers,
  Lock,
  Maximize2,
  Minimize2,
  Pause,
  Play,
  PlayCircle,
  Plus,
  RefreshCw,
  Repeat,
  Rocket,
  Save,
  Settings,
  Shield,
  ShoppingCart,
  Shuffle,
  SkipBack,
  SkipForward,
  Sparkles,
  Star,
  Target,
  TrendingUp,
  Upload,
  User,
  UserPlus,
  Users,
  Volume2,
  X,
  Zap,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import * as tokens from './tokens'

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
 *    ✅ NEVER use PageLayout in individual pages (GlobalLayout provides it automatically)
 *    ✅ USE Container with size="xl" (1600px) as the standard default for all pages
 *    ✅ Container has NO padding - uses PageLayout's padding automatically
 *    ✅ USE size="lg" (1400px) or size="default" (1280px) for narrower content if needed
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

// Container - Apple.com Style Width Constraint
// Provides max-width constraint and centering ONLY (no padding)
// 
// Apple.com Pattern:
// - PageLayout = Padding only (no width constraint)
// - Container = Width constraint only (no padding)
//
// PageLayout provides all padding. Container only constrains width.
//
// Usage Examples:
//
// Inside PageLayout (uses PageLayout padding):
//   <PageLayout>
//     <Container size="xl">
//       <section>...</section>
//     </Container>
//   </PageLayout>
//
// Standalone (add padding manually if needed):
//   <div className="px-4 sm:px-6 lg:px-8">
//     <Container size="xl">
//       <section>...</section>
//     </Container>
//   </div>
//
// Or use PageLayout even for standalone:
//   <PageLayout>
//     <Container size="xl">...</Container>
//   </PageLayout>
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
        className={cn('mx-auto w-full', sizes[size], className)}
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
    
    // Standardized padding: Mobile p-4 (16px), Tablet p-6 (24px), Desktop p-8 (32px)
    return (
      <div 
        ref={ref}
        className={cn('rounded-2xl p-4 md:p-6 lg:p-8', variants[variant], hoverEffect, className)}
        {...props}
      >
        {children}
      </div>
    )
  }
)
Card.displayName = 'Card'

// FeatureCard Component - Icon on top, title under icon, body text under title
interface FeatureCardProps extends Omit<React.HTMLAttributes<HTMLDivElement>, 'title'> {
  icon: React.ElementType
  title: string | React.ReactNode
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

// CategoryCard Component - Square category selection card with icon and label
// Optimized for mobile with minimal padding to maintain square aspect ratio
interface CategoryCardProps extends React.HTMLAttributes<HTMLDivElement> {
  category: {
    key: string
    label: string
    icon: React.ElementType
  }
  selected?: boolean
  onClick?: () => void
  variant?: 'default' | 'elevated' | 'outlined'
  hover?: boolean
  iconColor?: string
  selectedIconColor?: string
  textSize?: 'xs' | 'sm'
  selectionStyle?: 'ring' | 'border'
}

export const CategoryCard = React.forwardRef<HTMLDivElement, CategoryCardProps>(
  ({ 
    category, 
    selected = false, 
    onClick, 
    variant = 'default',
    hover = true,
    iconColor = tokens.colors.secondary[500], // Default: cyan
    selectedIconColor = tokens.colors.primary[500], // Selected: green
    textSize = 'xs',
    selectionStyle = 'ring',
    className = '', 
    ...props 
  }, ref) => {
    const IconComponent = category.icon
    
    // Use design tokens for variants
    const variants = {
      default: `bg-[${tokens.colors.neutral.cardBg}] border-2 border-[${tokens.colors.neutral.borderLight}]`,
      elevated: `bg-[${tokens.colors.neutral.cardBg}] border-2 border-[${tokens.colors.neutral.borderLight}] shadow-xl`,
      outlined: `bg-transparent border-2 border-[${tokens.colors.neutral.borderLight}]`,
    }
    
    const hoverEffect = hover ? `hover:border-[${tokens.colors.primary[200]}] hover:shadow-2xl transition-all ${tokens.durations[200]}` : ''
    
    const selectionClass = selected 
      ? selectionStyle === 'ring' 
        ? `ring-2 ring-[${tokens.colors.primary[500]}] border-[${tokens.colors.primary[500]}]`
        : 'border border-primary-500'
      : ''
    
    const textSizeClass = textSize === 'xs' ? 'text-[10px]' : 'text-xs'
    
    return (
      <Card 
        ref={ref}
        variant={variant} 
        hover={hover}
        className={cn(
          'cursor-pointer aspect-square',
          `transition-all ${tokens.durations[300]}`,
          // Override Card's default padding with minimal padding for square aspect ratio
          '!p-1 md:!p-2',
          selectionClass,
          className
        )}
        onClick={onClick}
        {...props}
      >
        <div className="flex flex-col items-center gap-0.5 md:gap-1 justify-center h-full">
          <Icon 
            icon={IconComponent} 
            size="sm" 
            color={selected ? selectedIconColor : iconColor} 
          />
          <span className={cn(
            textSizeClass,
            'font-medium text-center leading-tight text-neutral-300 break-words hyphens-auto'
          )}>
            {category.label}
          </span>
        </div>
      </Card>
    )
  }
)
CategoryCard.displayName = 'CategoryCard'

// Button Component
interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode
  variant?: 'primary' | 'secondary' | 'accent' | 'draft' | 'ghost' | 'outline' | 'outline-purple' | 'outline-yellow' | 'danger' | 'ghost-yellow' | 'ghost-blue' | 'ghost-purple'
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
      draft: `
        bg-[#FFFF00] text-black font-semibold
        border-2 border-transparent
        hover:bg-[rgba(255,255,0,0.1)] hover:text-[#FFFF00] hover:border-[rgba(255,255,0,0.2)]
        active:opacity-80
      `,
      ghost: `
        bg-[rgba(57,255,20,0.1)] text-[#39FF14] 
        border-2 border-[rgba(57,255,20,0.2)]
        hover:bg-[rgba(57,255,20,0.2)]
        active:opacity-80
      `,
      'ghost-yellow': `
        bg-[rgba(255,255,0,0.1)] text-[#FFFF00] 
        border-2 border-[rgba(255,255,0,0.2)]
        hover:bg-[rgba(255,255,0,0.2)]
        active:opacity-80
      `,
      'ghost-blue': `
        bg-[rgba(59,130,246,0.1)] text-[#3B82F6] 
        border-2 border-[rgba(59,130,246,0.2)]
        hover:bg-[rgba(59,130,246,0.2)]
        active:opacity-80
      `,
      'ghost-purple': `
        bg-[rgba(139,92,246,0.1)] text-[#8B5CF6] 
        border-2 border-[rgba(139,92,246,0.2)]
        hover:bg-[rgba(139,92,246,0.2)]
        active:opacity-80
      `,
      outline: `
        bg-transparent border-2 border-[#39FF14] text-[#39FF14]
        hover:bg-[#39FF14] hover:text-black
        active:opacity-80
      `,
      'outline-purple': `
        bg-transparent border-2 border-[#BF00FF] text-[#BF00FF]
        hover:bg-[#BF00FF] hover:text-white
        active:opacity-80
      `,
      'outline-yellow': `
        bg-transparent border-2 border-[#FFFF00] text-[#FFFF00]
        hover:bg-[#FFFF00] hover:text-black
        active:opacity-80
      `,
      danger: `
        bg-transparent text-[#FF0040] font-semibold
        border-2 border-[#FF0040]
        hover:bg-[#FF0040] hover:text-white hover:border-transparent
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

    const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
      e.preventDefault()
      e.stopPropagation()
      props.onClick?.(e)
    }

    return (
      <button
        ref={ref}
        type="button"
        disabled={disabled || loading}
        className={buttonClasses}
        {...props}
        onClick={handleClick}
      >
        {loading ? 'Loading...' : children}
      </button>
    )
  }
)
Button.displayName = 'Button'

/**
 * SaveButton - Specialized button for save/saved states
 * Uses design tokens for consistent styling
 * @param hasUnsavedChanges - Controls saved vs save state
 * @param isSaving - Shows saving state
 * @param onClick - Save handler
 * @param disabled - Disables the button
 * @param className - Additional CSS classes
 */
interface SaveButtonProps extends Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, 'children'> {
  hasUnsavedChanges?: boolean
  isSaving?: boolean
}

export const SaveButton = React.forwardRef<HTMLButtonElement, SaveButtonProps>(
  ({ hasUnsavedChanges = false, isSaving = false, disabled, className = '', ...props }, ref) => {
    // Use design tokens for colors
    const primaryGreen = tokens.colors.primary[500]
    const black = tokens.colors.neutral[0]
    const lightGreenBg = `rgba(57, 255, 20, 0.1)` // 10% opacity of primary green
    const lightGreenBorder = `rgba(57, 255, 20, 0.2)` // 20% opacity of primary green
    const transparent = 'transparent'
    
    const baseClasses = cn(
      'inline-flex items-center justify-center gap-2',
      'px-4 py-3 text-sm md:px-7 md:py-3',
      'font-semibold',
      'border-2',
      'disabled:opacity-50 disabled:cursor-not-allowed',
      'whitespace-nowrap',
      className
    )
    
    // Define state-specific styles using tokens
    const savedStyle = {
      backgroundColor: lightGreenBg,
      color: primaryGreen,
      borderColor: lightGreenBorder,
      borderRadius: tokens.borderRadius.full,
      transition: `all ${tokens.durations[300]} ${tokens.easings['in-out']}`
    }
    
    const saveStyle = {
      backgroundColor: primaryGreen,
      color: black,
      borderColor: transparent,
      borderRadius: tokens.borderRadius.full,
      transition: `all ${tokens.durations[300]} ${tokens.easings['in-out']}`
    }
    
    const [isHovered, setIsHovered] = React.useState(false)
    
    // Apply hover state for save button only
    const currentStyle = hasUnsavedChanges 
      ? (isHovered ? savedStyle : saveStyle)
      : savedStyle

    return (
      <button
        ref={ref}
        type="button"
        disabled={disabled || isSaving}
        className={baseClasses}
        style={currentStyle}
        onMouseEnter={() => hasUnsavedChanges && setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        {...props}
      >
        {!hasUnsavedChanges ? (
          <>
            <CheckCircle className="w-4 h-4" />
            Saved
          </>
        ) : (
          <>
            <Save className="w-4 h-4" />
            {isSaving ? 'Saving...' : 'Save'}
          </>
        )}
      </button>
    )
  }
)
SaveButton.displayName = 'SaveButton'

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
  icon: React.ElementType
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

// Select/Dropdown Component - Custom styled dropdown matching input fields
interface SelectProps {
  label?: string
  options: Array<{ value: string; label: string }>
  placeholder?: string
  value?: string
  onChange?: (value: string) => void
  error?: string
  helperText?: string
  disabled?: boolean
  className?: string
}

export const Select = React.forwardRef<HTMLDivElement, SelectProps>(
  ({ label, options, placeholder = 'Select...', value, onChange, error, helperText, disabled = false, className = '' }, ref) => {
    const [isOpen, setIsOpen] = useState(false)
    const containerRef = useRef<HTMLDivElement>(null)

    // Get selected option label
    const selectedOption = options.find(opt => opt.value === value)
    const displayValue = selectedOption?.label || placeholder

    // Close dropdown when clicking outside
    useEffect(() => {
      const handleClickOutside = (event: MouseEvent) => {
        if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
          setIsOpen(false)
        }
      }
      
      if (isOpen) {
        document.addEventListener('mousedown', handleClickOutside)
      }
      
      return () => {
        document.removeEventListener('mousedown', handleClickOutside)
      }
    }, [isOpen])

    const handleSelect = (optionValue: string) => {
      onChange?.(optionValue)
      setIsOpen(false)
    }

    return (
      <div className={cn('w-full relative', className)} ref={containerRef}>
        {label && (
          <label className="block text-sm font-medium text-neutral-200 mb-2">
            {label}
          </label>
        )}
        
        {/* Select Button */}
        <div className="relative">
          <button
            type="button"
            onClick={() => !disabled && setIsOpen(!isOpen)}
            disabled={disabled}
            className={cn(
              'w-full pl-6 pr-12 py-3 rounded-xl border-2 hover:border-primary-500 focus:border-primary-500 focus:outline-none transition-colors cursor-pointer text-left',
              'bg-[#404040]',
              disabled && 'opacity-50 cursor-not-allowed',
              !selectedOption && 'text-[#9CA3AF]',
              selectedOption && 'text-white',
              error
                ? 'border-[#FF0040] focus:border-[#FF0040]'
                : 'border-[#666666] focus:border-[#39FF14]'
            )}
          >
            {displayValue}
          </button>
          
          {/* Custom Chevron */}
          <div className="absolute right-5 top-1/2 -translate-y-1/2 pointer-events-none">
            <svg className={cn('w-4 h-4 text-neutral-400 transition-transform', isOpen && 'rotate-180')} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </div>
        </div>

        {/* Custom Dropdown */}
        {isOpen && !disabled && (
          <>
            <div 
              className="fixed inset-0 z-10" 
              onClick={() => setIsOpen(false)}
            />
            <div className="absolute z-20 w-full top-full mt-1 py-2 bg-[#1F1F1F] border-2 border-[#333] rounded-2xl shadow-xl max-h-48 overflow-y-auto overscroll-contain">
              {options.map((option) => {
                const isSelected = option.value === value
                return (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => handleSelect(option.value)}
                    className={cn(
                      'w-full px-6 py-2 text-left transition-colors',
                      isSelected
                        ? 'bg-primary-500/20 text-primary-500 font-semibold'
                        : 'text-white hover:bg-[#333]'
                    )}
                  >
                    {option.label}
                  </button>
                )
              })}
            </div>
          </>
        )}

        {error && (
          <p className="mt-2 text-sm text-[#FF0040]">{error}</p>
        )}
        {!error && helperText && (
          <p className="mt-2 text-sm text-[#9CA3AF]">{helperText}</p>
        )}
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

// CreatedDateBadge - Reusable component for displaying created date/time in a box
interface CreatedDateBadgeProps {
  createdAt: string | Date
  className?: string
  showTime?: boolean
}

export const CreatedDateBadge: React.FC<CreatedDateBadgeProps> = ({ 
  createdAt, 
  className = '',
  showTime = true 
}) => {
  const date = new Date(createdAt)
  const dateString = date.toLocaleDateString()
  const timeString = date.toLocaleTimeString('en-US', { 
    hour: 'numeric', 
    minute: '2-digit', 
    hour12: true 
  })

  return (
    <div className={cn('flex items-center justify-center', className)}>
      <div className="flex items-center px-3 py-2 md:px-5 bg-neutral-800/50 border border-neutral-700 rounded-lg">
        <div className="text-xs md:text-sm">
          <p className="text-white font-medium">
            {/* Mobile: date only, Desktop: date + time */}
            <span className="md:hidden">{dateString}</span>
            <span className="hidden md:inline">{showTime ? `${dateString} at ${timeString}` : dateString}</span>
          </p>
        </div>
      </div>
    </div>
  )
}

// ============================================================================
// GLOBAL STATUS BADGE SYSTEM
// Standardized status styling across all iterative features
// Uses VibrationFit design tokens for consistency
// ============================================================================

// Status color constants for consistent theming
export const STATUS_COLORS = {
  active: {
    // Electric Lime Green - "Above the Green Line"
    bg: tokens.colors.primary[500],        // #39FF14
    text: tokens.colors.neutral[0],        // Black
    border: tokens.colors.primary[500],
    bgSubtle: 'rgba(57, 255, 20, 0.2)',
    textSubtle: tokens.colors.primary[500],
    borderSubtle: 'rgba(57, 255, 20, 0.3)',
  },
  draft: {
    // Neon Yellow - Work in Progress / Celebration
    bg: tokens.colors.semantic.warning,     // #FFFF00
    text: tokens.colors.neutral[0],         // Black
    border: tokens.colors.semantic.warning,
    bgSubtle: 'rgba(255, 255, 0, 0.2)',
    textSubtle: '#FFFF00',                  // Neon Yellow
    borderSubtle: 'rgba(255, 255, 0, 0.3)',
  },
  complete: {
    // Blue - Completed/Finished state
    bg: '#3B82F6',                   // Blue 500
    text: '#FFFFFF',                 // White
    border: '#3B82F6',
    bgSubtle: 'rgba(59, 130, 246, 0.2)',
    textSubtle: '#60A5FA',           // Blue 400
    borderSubtle: 'rgba(59, 130, 246, 0.3)',
  },
  paused: {
    // Neon Orange - Paused state
    bg: tokens.colors.energy.orange[500],   // #FF6600
    text: '#FFFFFF',                        // White
    border: tokens.colors.energy.orange[500],
    bgSubtle: 'rgba(255, 102, 0, 0.2)',
    textSubtle: '#FF6600',                  // Neon Orange
    borderSubtle: 'rgba(255, 102, 0, 0.3)',
  },
  archived: {
    // Neutral Gray - Archived/Inactive
    bg: tokens.colors.neutral[600],         // #4B5563
    text: '#FFFFFF',                        // White
    border: tokens.colors.neutral[600],
    bgSubtle: 'rgba(75, 85, 99, 0.2)',
    textSubtle: tokens.colors.neutral[400], // #9CA3AF
    borderSubtle: 'rgba(75, 85, 99, 0.3)',
  },
} as const

export type StatusType = keyof typeof STATUS_COLORS

// StatusBadge - Global status indicator with consistent styling
interface StatusBadgeProps {
  status: StatusType | string
  className?: string
  subtle?: boolean // Use subtle styling (transparent background)
  showIcon?: boolean // Show status icon (checkmark for active, etc.)
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ 
  status, 
  className = '',
  subtle = true,
  showIcon = true 
}) => {
  // Normalize status to lowercase for matching
  const normalizedStatus = status.toLowerCase() as StatusType
  
  // Get colors from STATUS_COLORS, default to neutral if status not found
  const statusColors = STATUS_COLORS[normalizedStatus] || {
    bg: tokens.colors.neutral[600],
    text: '#FFFFFF',
    border: tokens.colors.neutral[600],
    bgSubtle: 'rgba(75, 85, 99, 0.2)',
    textSubtle: tokens.colors.neutral[400],
    borderSubtle: 'rgba(75, 85, 99, 0.3)',
  }
  
  // Capitalize first letter for display
  const displayText = status.charAt(0).toUpperCase() + status.slice(1).toLowerCase()

  const styles = subtle ? {
    backgroundColor: statusColors.bgSubtle,
    color: statusColors.textSubtle,
    borderColor: statusColors.borderSubtle,
  } : {
    backgroundColor: statusColors.bg,
    color: statusColors.text,
    borderColor: statusColors.border,
  }

  // Get icon for status - only show checkmark for Active
  const getStatusIcon = () => {
    if (!showIcon) return null
    
    const iconColor = subtle ? statusColors.textSubtle : statusColors.text
    
    // Only show icon for active status
    if (normalizedStatus === 'active') {
      return <CheckCircle className="w-4 h-4 mr-1" style={{ color: iconColor }} />
    }
    
    return null
  }

  // Add extra left padding when wide letter spacing is used for optical balance
  const hasWideTracking = className.includes('tracking-')
  
  return (
    <span 
      className={cn(
        'inline-flex items-center justify-center py-1 rounded-full text-xs md:text-sm font-semibold border',
        hasWideTracking ? 'px-3 pl-4' : 'px-3',
        className
      )}
      style={styles}
    >
      {getStatusIcon()}
      {displayText}
    </span>
  )
}

// VersionBadge - Version number badge with status-matched colors
interface VersionBadgeProps {
  versionNumber: number
  status: StatusType | string
  className?: string
}

export const VersionBadge: React.FC<VersionBadgeProps> = ({ 
  versionNumber, 
  status, 
  className = '' 
}) => {
  // Normalize status to lowercase for matching
  const normalizedStatus = status.toLowerCase() as StatusType
  
  // Get colors from STATUS_COLORS, default to neutral if status not found
  const statusColors = STATUS_COLORS[normalizedStatus] || {
    bg: tokens.colors.neutral[600],
    text: '#FFFFFF',
  }

  return (
    <span 
      className={cn(
        'w-7 h-7 flex items-center justify-center rounded-full text-xs font-semibold',
        className
      )}
      style={{
        backgroundColor: statusColors.bg,
        color: statusColors.text,
      }}
    >
      V{versionNumber}
    </span>
  )
}

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
            'focus:outline-none transition-all duration-200',
            error 
              ? 'border-[#FF0040] focus:border-[#FF0040]' 
              : 'border-[#666666] focus:border-[#39FF14]',
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

// DatePicker Component - Custom branded calendar
interface DatePickerProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'value' | 'onChange'> {
  label?: string
  error?: string
  helperText?: string
  value?: string // ISO date string (YYYY-MM-DD)
  onChange?: (date: string) => void
  minDate?: string // ISO date string
  maxDate?: string // ISO date string
}

export const DatePicker = React.forwardRef<HTMLInputElement, DatePickerProps>(
  ({ label, error, helperText, value, onChange, minDate, maxDate, className = '', ...props }, ref) => {
    const [isOpen, setIsOpen] = useState(false)
    const [selectedDate, setSelectedDate] = useState<Date | null>(value ? new Date(value) : null)
    const [currentMonth, setCurrentMonth] = useState<Date>(value ? new Date(value) : new Date())
    const [isYearDropdownOpen, setIsYearDropdownOpen] = useState(false)
    const [isMonthDropdownOpen, setIsMonthDropdownOpen] = useState(false)
    const containerRef = useRef<HTMLDivElement>(null)
    const yearDropdownRef = useRef<HTMLDivElement>(null)
    const monthDropdownRef = useRef<HTMLDivElement>(null)

    // Close calendar when clicking outside
    useEffect(() => {
      const handleClickOutside = (event: MouseEvent) => {
        if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
          setIsOpen(false)
        }
        if (yearDropdownRef.current && !yearDropdownRef.current.contains(event.target as Node)) {
          setIsYearDropdownOpen(false)
        }
        if (monthDropdownRef.current && !monthDropdownRef.current.contains(event.target as Node)) {
          setIsMonthDropdownOpen(false)
        }
      }
      
      if (isOpen || isYearDropdownOpen || isMonthDropdownOpen) {
        document.addEventListener('mousedown', handleClickOutside)
      }
      
      return () => {
        document.removeEventListener('mousedown', handleClickOutside)
      }
    }, [isOpen, isYearDropdownOpen, isMonthDropdownOpen])

    // Format date for display
    const formatDisplayDate = (date: Date | null) => {
      if (!date) return ''
      return new Intl.DateTimeFormat('en-US', { 
        month: 'short', 
        day: 'numeric', 
        year: 'numeric' 
      }).format(date)
    }

    // Get days in month
    const getDaysInMonth = (date: Date) => {
      const year = date.getFullYear()
      const month = date.getMonth()
      const firstDay = new Date(year, month, 1)
      const lastDay = new Date(year, month + 1, 0)
      const daysInMonth = lastDay.getDate()
      const startingDayOfWeek = firstDay.getDay()
      
      return { daysInMonth, startingDayOfWeek, year, month }
    }

    const handleDateSelect = (day: number) => {
      const newDate = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day)
      const isoString = newDate.toISOString().split('T')[0]
      
      // Check if date is within min/max range
      if (minDate && isoString < minDate) return
      if (maxDate && isoString > maxDate) return
      
      setSelectedDate(newDate)
      onChange?.(isoString)
      setIsOpen(false)
    }

    const handlePrevMonth = () => {
      setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1))
    }

    const handleNextMonth = () => {
      setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1))
    }

    const handleYearSelect = (year: number) => {
      setCurrentMonth(new Date(year, currentMonth.getMonth()))
      setIsYearDropdownOpen(false)
    }

    const handleMonthSelect = (monthIndex: number) => {
      setCurrentMonth(new Date(currentMonth.getFullYear(), monthIndex))
      setIsMonthDropdownOpen(false)
    }

    // Generate year options (current year descending, no future years)
    const currentYear = new Date().getFullYear()
    const years = Array.from({ length: 51 }, (_, i) => currentYear - i)

    // Month options
    const months = [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'
    ]

    const { daysInMonth, startingDayOfWeek, year, month } = getDaysInMonth(currentMonth)
    const monthName = new Intl.DateTimeFormat('en-US', { month: 'short' }).format(currentMonth)

    // Check if date is disabled
    const isDateDisabled = (day: number) => {
      const dateStr = new Date(year, month, day).toISOString().split('T')[0]
      if (minDate && dateStr < minDate) return true
      if (maxDate && dateStr > maxDate) return true
      return false
    }

    // Check if date is selected
    const isDateSelected = (day: number) => {
      if (!selectedDate) return false
      return (
        selectedDate.getDate() === day &&
        selectedDate.getMonth() === month &&
        selectedDate.getFullYear() === year
      )
    }

    // Check if date is today
    const isToday = (day: number) => {
      const today = new Date()
      return (
        today.getDate() === day &&
        today.getMonth() === month &&
        today.getFullYear() === year
      )
    }

    return (
      <div className={cn('relative w-full', className)} ref={containerRef}>
        {label && (
          <label className="block text-sm font-medium text-[#E5E7EB] mb-2">
            {label}
          </label>
        )}
        
        {/* Input Field */}
        <div className="relative">
          <input
            ref={ref}
            type="text"
            readOnly
            value={formatDisplayDate(selectedDate)}
            onClick={() => setIsOpen(!isOpen)}
            placeholder="Select date..."
            className={cn(
              'w-full px-4 py-3 pr-10',
              'bg-[#404040]',
              'border-2',
              'rounded-xl',
              'text-white',
              'placeholder-[#9CA3AF]',
              'focus:outline-none',
              'transition-all duration-200',
              'cursor-pointer',
              error
                ? 'border-[#FF0040]'
                : isOpen
                ? 'border-[#39FF14]'
                : 'border-[#666666]'
            )}
            {...props}
          />
          <CalendarDays 
            className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-400 pointer-events-none" 
            strokeWidth={2.5}
          />
        </div>

        {/* Calendar Dropdown */}
        {isOpen && (
          <div className="absolute z-50 mt-2 left-1/2 -translate-x-1/2 md:left-auto md:right-0 md:translate-x-0 w-[min(calc(100vw-2rem),360px)] md:w-[360px] bg-[#1F1F1F] border-2 border-[#333] rounded-2xl overflow-hidden">
            {/* Calendar Header */}
            <div className="flex items-center justify-between p-4 border-b border-[#333]">
              <button
                type="button"
                onClick={handlePrevMonth}
                className="inline-flex items-center justify-center rounded-full transition-all duration-300 bg-[rgba(57,255,20,0.1)] text-[#39FF14] border-2 border-[rgba(57,255,20,0.2)] hover:bg-[rgba(57,255,20,0.2)] active:opacity-80 p-2"
              >
                <ChevronLeft className="w-5 h-5" strokeWidth={2.5} />
              </button>
              
              <div className="flex items-center justify-center gap-2">
                <div className="relative inline-block" ref={monthDropdownRef}>
                  <button
                    type="button"
                    onClick={() => setIsMonthDropdownOpen(!isMonthDropdownOpen)}
                    className="inline-flex items-center gap-1 font-semibold text-white hover:text-[#39FF14] transition-colors cursor-pointer"
                  >
                    {monthName}
                    <svg className={`w-4 h-4 text-neutral-400 transition-transform ${isMonthDropdownOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>
                  
                  {isMonthDropdownOpen && (
                    <>
                      <div 
                        className="fixed inset-0 z-10" 
                        onClick={() => setIsMonthDropdownOpen(false)}
                      />
                      <div className="absolute z-20 left-1/2 -translate-x-1/2 top-full mt-2 w-40 max-h-48 overflow-y-auto bg-[#1F1F1F] border-2 border-[#333] rounded-2xl shadow-xl py-2">
                        {months.map((month, index) => (
                          <button
                            key={index}
                            type="button"
                            onClick={() => handleMonthSelect(index)}
                            className={`w-full px-4 py-2 text-left transition-colors ${
                              index === currentMonth.getMonth()
                                ? 'bg-primary-500/20 text-primary-500 font-semibold'
                                : 'text-white hover:bg-[#333]'
                            }`}
                          >
                            {month}
                          </button>
                        ))}
                      </div>
                    </>
                  )}
                </div>
                <div className="relative inline-block" ref={yearDropdownRef}>
                  <button
                    type="button"
                    onClick={() => setIsYearDropdownOpen(!isYearDropdownOpen)}
                    className="inline-flex items-center gap-1 font-semibold text-white hover:text-[#39FF14] transition-colors cursor-pointer"
                  >
                    {year}
                    <svg className={`w-4 h-4 text-neutral-400 transition-transform ${isYearDropdownOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>
                  
                  {isYearDropdownOpen && (
                    <>
                      <div 
                        className="fixed inset-0 z-10" 
                        onClick={() => setIsYearDropdownOpen(false)}
                      />
                      <div className="absolute z-20 left-1/2 -translate-x-1/2 top-full mt-2 w-32 max-h-48 overflow-y-auto bg-[#1F1F1F] border-2 border-[#333] rounded-2xl shadow-xl py-2">
                        {years.map((y) => (
                          <button
                            key={y}
                            type="button"
                            onClick={() => handleYearSelect(y)}
                            className={`w-full px-4 py-2 text-left transition-colors ${
                              y === year
                                ? 'bg-primary-500/20 text-primary-500 font-semibold'
                                : 'text-white hover:bg-[#333]'
                            }`}
                          >
                            {y}
                          </button>
                        ))}
                      </div>
                    </>
                  )}
                </div>
              </div>
              
              <button
                type="button"
                onClick={handleNextMonth}
                className="inline-flex items-center justify-center rounded-full transition-all duration-300 bg-[rgba(57,255,20,0.1)] text-[#39FF14] border-2 border-[rgba(57,255,20,0.2)] hover:bg-[rgba(57,255,20,0.2)] active:opacity-80 p-2"
              >
                <ChevronRight className="w-5 h-5" strokeWidth={2.5} />
              </button>
            </div>

            {/* Calendar Grid */}
            <div className="p-4">
              {/* Day Names */}
              <div className="grid grid-cols-7 gap-1 mb-2">
                {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map((day) => (
                  <div
                    key={day}
                    className="text-center font-semibold text-[#9CA3AF] py-2"
                  >
                    {day}
                  </div>
                ))}
              </div>

              {/* Days */}
              <div className="grid grid-cols-7 gap-1">
                {/* Empty cells for days before month starts */}
                {Array.from({ length: startingDayOfWeek }).map((_, i) => (
                  <div key={`empty-${i}`} className="aspect-square" />
                ))}

                {/* Actual days */}
                {Array.from({ length: daysInMonth }).map((_, i) => {
                  const day = i + 1
                  const selected = isDateSelected(day)
                  const today = isToday(day)
                  const disabled = isDateDisabled(day)

                  return (
                    <button
                      key={day}
                      type="button"
                      onClick={() => !disabled && handleDateSelect(day)}
                      disabled={disabled}
                      className={cn(
                        'aspect-square rounded-lg font-medium transition-all duration-200',
                        'flex items-center justify-center',
                        disabled && 'opacity-30 cursor-not-allowed',
                        !disabled && !selected && 'hover:bg-[#404040] text-white',
                        !disabled && selected && 'bg-[#39FF14] text-black font-bold',
                        !disabled && !selected && today && 'border-2 border-[#39FF14] text-[#39FF14]'
                      )}
                    >
                      {day}
                    </button>
                  )
                })}
              </div>
            </div>
          </div>
        )}

        {error && (
          <p className="mt-2 text-sm text-[#FF0040]">{error}</p>
        )}
        {!error && helperText && (
          <p className="mt-2 text-sm text-[#9CA3AF]">{helperText}</p>
        )}
      </div>
    )
  }
)
DatePicker.displayName = 'DatePicker'

// Radio Component - Custom branded radio button
interface RadioProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type' | 'size'> {
  label?: string
  error?: string
  helperText?: string
}

export const Radio = React.forwardRef<HTMLInputElement, RadioProps>(
  ({ label, error, helperText, className = '', id, ...props }, ref) => {
    const generatedId = useId()
    const radioId = id || generatedId
    
    return (
      <div className={className}>
        <label 
          htmlFor={radioId}
          className="flex items-center gap-2 cursor-pointer group"
        >
          {/* Custom Radio Button */}
          <div className="relative flex-shrink-0">
            <input
              ref={ref}
              type="radio"
              id={radioId}
              className="sr-only peer"
              {...props}
            />
            {/* Outer Circle */}
            <div className="w-5 h-5 rounded-full border-2 border-[#666666] bg-[#404040] peer-checked:bg-[#39FF14] transition-all duration-200 group-hover:border-[#39FF14]/60 peer-checked:group-hover:border-[#666666]">
              {/* Inner Circle (when checked) */}
              <div className="absolute inset-0 flex items-center justify-center opacity-0 peer-checked:opacity-100 transition-opacity duration-200">
                <div className="w-2.5 h-2.5 rounded-full bg-black" />
              </div>
            </div>
          </div>
          
          {/* Label Text */}
          {label && (
            <span className={`text-base text-white group-hover:text-[#39FF14]/80 transition-colors ${
              props.disabled ? 'text-neutral-500 cursor-not-allowed' : ''
            }`}>
              {label}
            </span>
          )}
        </label>
        
        {/* Error Message */}
        {error && (
          <p className="mt-1 text-sm text-[#FF0040]">{error}</p>
        )}
        
        {/* Helper Text */}
        {helperText && !error && (
          <p className="mt-1 text-sm text-neutral-400">{helperText}</p>
        )}
      </div>
    )
  }
)
Radio.displayName = 'Radio'

// RadioGroup Component - Container for multiple radio buttons
interface RadioGroupProps {
  label?: string
  name: string
  value?: string | number | boolean
  onChange?: (value: string | number | boolean) => void
  options: Array<{ value: string | number | boolean; label: string }>
  error?: string
  helperText?: string
  className?: string
  orientation?: 'horizontal' | 'vertical'
}

export const RadioGroup = React.forwardRef<HTMLDivElement, RadioGroupProps>(
  ({ label, name, value, onChange, options, error, helperText, className = '', orientation = 'horizontal' }, ref) => {
    return (
      <div ref={ref} className={className}>
        {/* Label */}
        {label && (
          <label className="block text-sm font-medium text-neutral-200 mb-3">
            {label}
          </label>
        )}
        
        {/* Radio Options */}
        <div className={`flex ${orientation === 'horizontal' ? 'flex-row gap-3' : 'flex-col gap-3'}`}>
          {options.map((option, index) => {
            const optionId = `${name}-${index}`
            const isChecked = value === option.value
            
            return (
              <Radio
                key={optionId}
                id={optionId}
                name={name}
                label={option.label}
                checked={isChecked}
                onChange={() => onChange?.(option.value)}
                className={orientation === 'horizontal' ? '' : 'flex-1'}
              />
            )
          })}
        </div>
        
        {/* Error Message */}
        {error && (
          <p className="mt-2 text-sm text-[#FF0040]">{error}</p>
        )}
        
        {/* Helper Text */}
        {helperText && !error && (
          <p className="mt-2 text-sm text-neutral-400">{helperText}</p>
        )}
      </div>
    )
  }
)
RadioGroup.displayName = 'RadioGroup'

// Checkbox Component - Custom branded checkbox
interface CheckboxProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type' | 'size'> {
  label?: string
  error?: string
  helperText?: string
}

export const Checkbox = React.forwardRef<HTMLInputElement, CheckboxProps>(
  ({ label, error, helperText, className = '', id, ...props }, ref) => {
    const generatedId = useId()
    const checkboxId = id || generatedId
    
    return (
      <div className={className}>
        <label 
          htmlFor={checkboxId}
          className="flex items-center gap-2 cursor-pointer group"
        >
          {/* Custom Checkbox */}
          <div className="relative flex-shrink-0">
            <input
              ref={ref}
              type="checkbox"
              id={checkboxId}
              className="sr-only peer"
              {...props}
            />
            {/* Outer Square */}
            <div className="w-5 h-5 rounded border-2 border-[#666666] bg-[#404040] peer-checked:bg-[#39FF14] transition-all duration-200 group-hover:border-[#39FF14]/60 peer-checked:group-hover:border-[#666666] relative">
              {/* Checkmark (when checked) */}
              <div className={`absolute inset-0 flex items-center justify-center pointer-events-none transition-opacity duration-200 ${props.checked ? 'opacity-100' : 'opacity-0'}`}>
                <svg className="w-3.5 h-3.5 text-[#666666]" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={3}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
              </div>
            </div>
          </div>
          
          {/* Label Text */}
          {label && (
            <span className={`text-base text-white group-hover:text-[#39FF14]/80 transition-colors ${
              props.disabled ? 'text-neutral-500 cursor-not-allowed' : ''
            }`}>
              {label}
            </span>
          )}
        </label>
        
        {/* Error Message */}
        {error && (
          <p className="mt-1 text-sm text-[#FF0040]">{error}</p>
        )}
        
        {/* Helper Text */}
        {helperText && !error && (
          <p className="mt-1 text-sm text-neutral-400">{helperText}</p>
        )}
      </div>
    )
  }
)
Checkbox.displayName = 'Checkbox'

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
            'focus:outline-none transition-all duration-200 resize-none',
            error 
              ? 'border-[#FF0040] focus:border-[#FF0040]' 
              : 'border-[#666666] focus:border-[#39FF14]',
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
              'focus:outline-none transition-all duration-200 resize-none',
              error 
                ? 'border-[#FF0040] focus:border-[#FF0040]' 
                : 'border-[#666666] focus:border-[#39FF14]',
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

// Page Layout Component - Apple.com Style Pattern
// Provides outer shell with consistent padding ONLY (no width constraint)
// Pattern: PageLayout = Padding | Container = Width Constraint
// 
// Usage Examples:
// 
// Full-width section (no Container):
//   <PageLayout>
//     <section className="w-full">...</section>
//   </PageLayout>
//
// Constrained content (with Container):
//   <PageLayout>
//     <Container size="xl">
//       <section>...</section>
//     </Container>
//   </PageLayout>
//
// Mixed (Apple.com style):
//   <PageLayout>
//     <section className="w-full bg-gradient">...</section>  {/* Full width */}
//     <Container size="xl">
//       <section>...</section>  {/* Constrained */}
//     </Container>
//   </PageLayout>
interface PageLayoutProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode
}

export const PageLayout = React.forwardRef<HTMLDivElement, PageLayoutProps>(
  ({ children, className = '', ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn('min-h-screen bg-black text-white pt-6 pb-12 md:py-12 px-4 sm:px-6 lg:px-8', className)}
        {...props}
      >
        {children}
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
                className="w-8 h-8 flex items-center justify-center rounded-full bg-[#404040] hover:bg-[#BF00FF] transition-colors"
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
  description?: string | React.ReactNode
  icon?: React.ElementType
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
                        <h4 className="text-base md:text-lg text-white">
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
                    <div className="pt-4 space-y-2 text-neutral-300 text-sm leading-relaxed">
                      {typeof item.description === 'string' ? (
                        item.description.split('\n').map((line, index) => (
                          <div key={index} className="flex items-start gap-2 mb-2 last:mb-0">
                            <span className="text-[#39FF14] text-sm mt-0.5 flex-shrink-0">•</span>
                            <span>
                              {line.replace(/^•\s*/, '')}
                            </span>
                          </div>
                        ))
                      ) : (
                        item.description
                      )}
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
              variant="outline"
              onClick={onClose}
              className="flex-1"
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button
              variant="danger"
              onClick={onConfirm}
              loading={isLoading}
              disabled={isLoading}
              className="flex-1"
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
    // Link to home page pricing section where they can upgrade
    window.location.href = '/#pricing'
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
    const hasTrackedCurrentPlay = useRef<boolean>(false)

    // Track play completion (80% threshold)
    const handleTrackComplete = useCallback(async (trackId: string) => {
      if (hasTrackedCurrentPlay.current) return // Already tracked this play
      
      try {
        const { createClient } = await import('@/lib/supabase/client')
        const supabase = createClient()
        await supabase.rpc('increment_audio_play', {
          p_track_id: trackId
        })
        hasTrackedCurrentPlay.current = true
      } catch (error) {
        console.error('Failed to track audio play:', error)
      }
    }, [])

    const checkAndTrackCompletion = useCallback(() => {
      const audio = audioRef.current
      if (!audio || !audio.duration || hasTrackedCurrentPlay.current) return
      
      const completionPercentage = (audio.currentTime / audio.duration) * 100
      if (completionPercentage >= 80 && track?.id) {
        handleTrackComplete(track.id)
      }
    }, [track?.id, handleTrackComplete])

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
        checkAndTrackCompletion()
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
    }, [track, onTrackEnd, checkAndTrackCompletion])

    // Track completion when track changes or component unmounts
    useEffect(() => {
      return () => {
        // Check for completion before track changes
        checkAndTrackCompletion()
      }
    }, [track?.id, checkAndTrackCompletion])

    // Reset tracking flag when track changes
    useEffect(() => {
      hasTrackedCurrentPlay.current = false
    }, [track?.id])

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
  const [trackDurations, setTrackDurations] = useState<Map<string, number>>(new Map())
  
  const audioRef = useRef<HTMLAudioElement>(null)
  const lastRepeatClickRef = useRef<number>(0)
  const hasTrackedCurrentPlay = useRef<boolean>(false)

  const currentTrack = tracks[currentTrackIndex]
  
  // Audio mixing handled by server-side Lambda
  
  // Track play completion (80% threshold)
  const handleTrackComplete = useCallback(async (trackId: string) => {
    if (hasTrackedCurrentPlay.current) return // Already tracked this play
    
    try {
      const { createClient } = await import('@/lib/supabase/client')
      const supabase = createClient()
      await supabase.rpc('increment_audio_play', {
        p_track_id: trackId
      })
      hasTrackedCurrentPlay.current = true
    } catch (error) {
      console.error('Failed to track audio play:', error)
    }
  }, [])

  const checkAndTrackCompletion = useCallback(() => {
    const audio = audioRef.current
    if (!audio || !audio.duration || hasTrackedCurrentPlay.current) return
    
    const completionPercentage = (audio.currentTime / audio.duration) * 100
    if (completionPercentage >= 80) {
      const track = tracks[currentTrackIndex]
      if (track?.id) {
        handleTrackComplete(track.id)
      }
    }
  }, [currentTrackIndex, tracks, handleTrackComplete])
  
  // Preload durations for all tracks
  useEffect(() => {
    tracks.forEach(track => {
      if (track.url && !trackDurations.has(track.id)) {
        const tempAudio = new Audio()
        tempAudio.src = track.url
        tempAudio.addEventListener('loadedmetadata', () => {
          if (tempAudio.duration && !isNaN(tempAudio.duration) && isFinite(tempAudio.duration)) {
            setTrackDurations(prev => {
              const newMap = new Map(prev)
              newMap.set(track.id, tempAudio.duration)
              return newMap
            })
          }
        })
      }
    })
  }, [tracks])
  
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
      // Store the actual duration for this track
      if (currentTrack && audio.duration && !isNaN(audio.duration)) {
        setTrackDurations(prev => {
          const newMap = new Map(prev)
          newMap.set(currentTrack.id, audio.duration)
          return newMap
        })
      }
    }

    const setAudioTime = () => {
      setCurrentTime(audio.currentTime)
    }

    const handleEnded = () => {
      checkAndTrackCompletion()
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
  }, [handleNext, currentTrack, checkAndTrackCompletion])

  useEffect(() => {
    const audio = audioRef.current
    if (!audio) return
    
    // Check for completion before track changes (when user skips)
    checkAndTrackCompletion()
    
    // Reset tracking flag for new track
    hasTrackedCurrentPlay.current = false
    
    // Update audio source when track changes
    audio.src = currentTrack?.url || ''
    
    // Auto-play if currently playing
    if (isPlaying && currentTrack?.url) {
      audio.play().catch(() => setIsPlaying(false))
    }
  }, [currentTrackIndex, currentTrack?.url, isPlaying, checkAndTrackCompletion])

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
    // Always play when a track is clicked
    setIsPlaying(true)
    // Small delay to ensure audio is loaded
    setTimeout(() => {
      audioRef.current?.play().catch(() => {
        console.warn('Failed to auto-play track')
        setIsPlaying(false)
      })
    }, 100)
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
      <div className="mb-6 py-4">
        <div className="flex items-center justify-center gap-4">
          {currentTrack?.thumbnail && (
            <img 
              src={currentTrack.thumbnail} 
              alt={currentTrack.title}
              className="w-16 h-16 rounded-lg object-cover flex-shrink-0"
            />
          )}
          <div className="flex-1 min-w-0 text-center">
            <h3 className="text-2xl md:text-3xl font-semibold text-white truncate">{currentTrack?.title}</h3>
            <p className="text-sm text-neutral-400 truncate">{currentTrack?.artist}</p>
          </div>
        </div>
      </div>

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
          <div className="max-h-[60vh] overflow-y-auto pr-2">
          {tracks.map((track, index) => {
            const handlePlayClick = (e: React.MouseEvent) => {
              e.stopPropagation()
              if (currentTrackIndex === index) {
                // If it's the current track, toggle play/pause
                togglePlayPause()
              } else {
                // If it's a different track, select it and play it
                handleTrackSelect(index)
              }
            }

            return (
              <div
                key={`playlist-item-${index}`}
                onClick={() => handleTrackSelect(index)}
                className={cn(
                  'w-full text-left p-3 rounded-lg transition-all duration-200 cursor-pointer',
                  'hover:bg-neutral-800',
                  currentTrackIndex === index && 'bg-[#39FF14]/20 border border-[#39FF14]'
                )}
              >
                <div className="flex items-center gap-3">
                  <button
                    onClick={handlePlayClick}
                    className="flex-shrink-0 hover:scale-110 transition-transform"
                    aria-label={currentTrackIndex === index && isPlaying ? 'Pause' : 'Play'}
                  >
                    {currentTrackIndex === index && isPlaying ? (
                      <Pause className="w-5 h-5 text-[#39FF14]" fill="currentColor" />
                    ) : (
                      <Play className="w-5 h-5 text-neutral-400" fill="currentColor" />
                    )}
                  </button>
                  <div className="flex-1 min-w-0">
                    <p className={cn(
                      'text-sm font-medium truncate capitalize',
                      currentTrackIndex === index ? 'text-[#39FF14]' : 'text-white'
                    )}>
                      {track.title}
                    </p>
                    <p className="text-xs text-neutral-400 truncate">{track.artist}</p>
                  </div>
                  <div className="text-xs text-neutral-500">
                    {(() => {
                      const storedDuration = trackDurations.get(track.id)
                      const displayDuration = storedDuration || track.duration
                      return displayDuration > 0 ? formatTime(displayDuration) : '--:--'
                    })()}
                  </div>
                </div>
              </div>
            )
          })}
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

interface PageTitleMetaItem {
  label: string
  value: string
  icon?: LucideIcon
}

export interface PageTitleAction {
  label: string
  onClick?: () => void
  href?: string
  target?: '_self' | '_blank' | '_parent' | '_top'
  variant?: ButtonProps['variant']
  size?: ButtonProps['size']
  icon?: LucideIcon
  iconPosition?: 'left' | 'right'
  loading?: boolean
  className?: string
}

interface PageTitlesProps extends Omit<React.HTMLAttributes<HTMLDivElement>, 'title'> {
  eyebrow?: React.ReactNode
  title: React.ReactNode
  subtitle?: React.ReactNode
  supportingText?: React.ReactNode
  breadcrumbs?: React.ReactNode
  status?: {
    label: React.ReactNode
    variant?: BadgeProps['variant']
  }
  metaItems?: PageTitleMetaItem[]
  actions?: PageTitleAction[]
  alignment?: 'left' | 'center'
  children?: React.ReactNode
}

export const PageTitles = React.forwardRef<HTMLDivElement, PageTitlesProps>(
  (
    {
      eyebrow,
      title,
      subtitle,
      supportingText,
      breadcrumbs,
      status,
      metaItems = [],
      actions = [],
      alignment = 'left',
      className = '',
      children,
      ...props
    },
    ref
  ) => {
    const isCenterAligned = alignment === 'center'
    const alignmentClasses = isCenterAligned ? 'items-center text-center' : 'items-start text-left'
    const textAlignment = isCenterAligned ? 'text-center' : 'text-left'
    const hasMetaItems = metaItems.length > 0
    const hasActions = actions.length > 0

    return (
      <div
        ref={ref}
        className={cn('w-full', className)}
        {...props}
      >
        <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4 md:gap-8">
          <div className={cn('flex flex-col gap-3 md:gap-4', alignmentClasses)}>
            {breadcrumbs && (
              <div className={cn('text-xs md:text-sm text-neutral-500', textAlignment)}>
                {breadcrumbs}
              </div>
            )}

            {eyebrow && (
              <div className="text-xs uppercase tracking-[0.35em] text-primary-500/80 font-semibold">
                {eyebrow}
              </div>
            )}

            <div className={cn('flex flex-col gap-3 md:gap-4 w-full', isCenterAligned ? 'items-center' : 'items-start')}>
              <div
                className={cn(
                  'flex flex-col md:flex-row md:items-center gap-3 md:gap-4 w-full',
                  isCenterAligned ? 'items-center' : 'items-start md:items-center'
                )}
              >
                <h1 className={cn('text-3xl md:text-5xl font-bold leading-tight text-white', textAlignment)}>
                  {title}
                </h1>
                {status?.label && (
                  <Badge
                    variant={status.variant ?? 'primary'}
                    className="whitespace-nowrap"
                  >
                    {status.label}
                  </Badge>
                )}
              </div>

              {subtitle && (
                <p className={cn('text-sm md:text-lg text-neutral-300 max-w-3xl', textAlignment)}>
                  {subtitle}
                </p>
              )}

              {supportingText && (
                <p className={cn('text-xs md:text-sm text-neutral-400 max-w-2xl', textAlignment)}>
                  {supportingText}
                </p>
              )}

              {hasMetaItems && (
                <div
                  className={cn(
                    'flex flex-col sm:flex-row sm:flex-wrap gap-3 md:gap-4 pt-2',
                    isCenterAligned ? 'items-center justify-center' : 'items-start'
                  )}
                >
                  {metaItems.map((item, index) => (
                    <div
                      key={`${item.label}-${item.value}-${index}`}
                      className="flex items-center gap-2 px-3 py-2 rounded-2xl border border-neutral-700 bg-neutral-900/60"
                    >
                      {item.icon && (
                        <Icon icon={item.icon} size="sm" className="text-primary-500" />
                      )}
                      <div className="text-left">
                        <div className="text-[10px] uppercase tracking-[0.2em] text-neutral-500">
                          {item.label}
                        </div>
                        <div className="text-sm font-semibold text-white">
                          {item.value}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {children}
            </div>
          </div>

          {hasActions && (
            <div
              className={cn(
                'w-full md:w-auto flex flex-col gap-2 sm:flex-row md:flex-col md:gap-3',
                isCenterAligned
                  ? 'items-center sm:items-center md:items-center'
                  : 'items-stretch sm:items-center md:items-end'
              )}
            >
              {actions.map((action, index) => {
                const {
                  label,
                  variant = 'primary',
                  size = 'sm',
                  icon: ActionIcon,
                  iconPosition = 'left',
                  href,
                  target,
                  onClick,
                  className: actionClassName = '',
                  loading,
                } = action

                const key = `${label}-${index}`

                if (href) {
                  return (
                    <Button
                      key={key}
                      variant={variant}
                      size={size}
                      className={cn('w-full sm:w-auto md:w-full', actionClassName)}
                      loading={loading}
                      asChild
                    >
                      <Link
                        href={href}
                        target={target}
                        rel={target === '_blank' ? 'noopener noreferrer' : undefined}
                      >
                        {ActionIcon && iconPosition === 'left' && (
                          <Icon icon={ActionIcon} size="sm" className="shrink-0" />
                        )}
                        <span className="truncate">{label}</span>
                        {ActionIcon && iconPosition === 'right' && (
                          <Icon icon={ActionIcon} size="sm" className="shrink-0" />
                        )}
                      </Link>
                    </Button>
                  )
                }

                return (
                  <Button
                    key={key}
                    variant={variant}
                    size={size}
                    onClick={onClick}
                    loading={loading}
                    className={cn('w-full sm:w-auto md:w-full', actionClassName)}
                  >
                    {ActionIcon && iconPosition === 'left' && (
                      <Icon icon={ActionIcon} size="sm" className="shrink-0" />
                    )}
                    <span className="truncate">{label}</span>
                    {ActionIcon && iconPosition === 'right' && (
                      <Icon icon={ActionIcon} size="sm" className="shrink-0" />
                    )}
                  </Button>
                )
              })}
            </div>
          )}
        </div>
      </div>
    )
  }
)
PageTitles.displayName = 'PageTitles'

// ============================================================================
// PAGE HEADER COMPONENT
// Centered header with eyebrow, title, badges, and actions
// Based on life-vision/[id] page header pattern
// ============================================================================

export interface PageHeaderBadge {
  label: React.ReactNode
  variant?: BadgeProps['variant']
  icon?: LucideIcon
  className?: string
}

export interface PageHeaderMetaItem {
  label: string
  value: string | number
  icon?: LucideIcon
  className?: string
}

export interface PageHeaderAction {
  label: string
  onClick?: () => void
  href?: string
  variant?: ButtonProps['variant']
  size?: ButtonProps['size']
  icon?: LucideIcon
  loading?: boolean
  disabled?: boolean
  className?: string
}

interface PageHeaderProps extends Omit<React.HTMLAttributes<HTMLDivElement>, 'title'> {
  eyebrow?: React.ReactNode
  title: React.ReactNode
  subtitle?: React.ReactNode
  badges?: PageHeaderBadge[]
  metaItems?: PageHeaderMetaItem[]
  actions?: PageHeaderAction[]
  gradient?: boolean
  children?: React.ReactNode
}

export const PageHeader = React.forwardRef<HTMLDivElement, PageHeaderProps>(
  (
    {
      eyebrow,
      title,
      subtitle,
      badges = [],
      metaItems = [],
      actions = [],
      gradient = true,
      className = '',
      children,
      ...props
    },
    ref
  ) => {
    const hasBadgesOrMeta = badges.length > 0 || metaItems.length > 0
    const hasActions = actions.length > 0

    return (
      <div
        ref={ref}
        className={cn('w-full', className)}
        {...props}
      >
        {/* Background Gradient (optional) */}
        {gradient && (
          <div className="absolute inset-0 bg-gradient-to-b from-primary-500/5 via-transparent to-transparent pointer-events-none" />
        )}

        {/* Content */}
        <div className="relative z-10">
          {/* Eyebrow */}
          {eyebrow && (
            <div className="text-center mb-4">
              <div className="text-[10px] md:text-xs uppercase tracking-[0.35em] text-primary-500/80 font-semibold">
                {eyebrow}
              </div>
            </div>
          )}

          {/* Title Section */}
          <div className="text-center mb-4">
            <h1 className="text-xl md:text-4xl lg:text-5xl font-bold leading-tight text-white">
              {title}
            </h1>
            {subtitle && (
              <p className="text-sm md:text-base text-neutral-400 mt-2 max-w-3xl mx-auto">
                {subtitle}
              </p>
            )}
          </div>

          {/* Badges & Meta Items */}
          {hasBadgesOrMeta && (
            <div className="text-center mb-6">
              <div className="inline-flex flex-wrap items-center justify-center gap-2 md:gap-3 px-3 md:px-4 py-2 md:py-3 rounded-2xl bg-neutral-900/60 border border-neutral-700/50 backdrop-blur-sm">
                {/* Badges */}
                {badges.map((badge, index) => {
                  const BadgeIcon = badge.icon
                  return (
                    <Badge
                      key={`badge-${index}`}
                      variant={badge.variant ?? 'primary'}
                      className={cn('uppercase tracking-[0.25em]', badge.className)}
                    >
                      {BadgeIcon && (
                        <Icon icon={BadgeIcon} size="sm" className="mr-1" />
                      )}
                      {badge.label}
                    </Badge>
                  )
                })}

                {/* Meta Items */}
                {metaItems.map((item, index) => {
                  const MetaIcon = item.icon
                  return (
                    <div
                      key={`meta-${index}`}
                      className={cn(
                        'flex items-center gap-1.5 text-neutral-300 text-xs md:text-sm',
                        item.className
                      )}
                    >
                      {MetaIcon && (
                        <Icon icon={MetaIcon} size="sm" className="text-neutral-500" />
                      )}
                      <span className="font-medium">{item.label}:</span>
                      <span>{item.value}</span>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {/* Action Buttons */}
          {hasActions && (
            <div className="flex flex-row flex-wrap lg:flex-nowrap gap-2 md:gap-4 max-w-2xl mx-auto">
              {actions.map((action, index) => {
                const ActionIcon = action.icon
                const key = `action-${index}`

                if (action.href) {
                  return (
                    <Button
                      key={key}
                      variant={action.variant ?? 'outline'}
                      size={action.size ?? 'sm'}
                      disabled={action.disabled}
                      loading={action.loading}
                      className={cn(
                        'flex-1 flex items-center justify-center gap-1 md:gap-2 hover:-translate-y-0.5 transition-all duration-300 text-xs md:text-sm',
                        action.className
                      )}
                      asChild
                    >
                      <Link href={action.href}>
                        {ActionIcon && (
                          <Icon icon={ActionIcon} size="sm" className="shrink-0" />
                        )}
                        <span>{action.label}</span>
                      </Link>
                    </Button>
                  )
                }

                return (
                  <Button
                    key={key}
                    onClick={action.onClick}
                    variant={action.variant ?? 'outline'}
                    size={action.size ?? 'sm'}
                    disabled={action.disabled}
                    loading={action.loading}
                    className={cn(
                      'flex-1 flex items-center justify-center gap-1 md:gap-2 hover:-translate-y-0.5 transition-all duration-300 text-xs md:text-sm',
                      action.className
                    )}
                  >
                    {ActionIcon && !action.loading && (
                      <Icon icon={ActionIcon} size="sm" className="shrink-0" />
                    )}
                    <span>{action.label}</span>
                  </Button>
                )
              })}
            </div>
          )}

          {/* Custom Children */}
          {children && (
            <div className="mt-6">
              {children}
            </div>
          )}
        </div>
      </div>
    )
  }
)
PageHeader.displayName = 'PageHeader'

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
  heading?: string | null
  className?: string
  showHeadingOutside?: boolean
  showStoryHighlight?: boolean
}

export const ProofWall = React.forwardRef<HTMLDivElement, ProofWallProps>(
  ({
    items,
    heading,
    className = '',
    showHeadingOutside = true,
    showStoryHighlight = true,
    ...props
  }, ref) => {
    const primaryItem: ProofWallItem = items[0] ?? {
      id: 'default-proof',
      beforeImage: 'https://media.vibrationfit.com/site-assets/proof-wall/boa-screenshot.jpg',
      afterImage: 'https://media.vibrationfit.com/site-assets/proof-wall/business-account-1.jpg',
      story: '',
    }

    const displayTitle = heading === undefined ? 'Lock It In and Let It Flow' : heading

    return (
      <div
        ref={ref}
        className={cn('w-full', className)}
        {...props}
      >
        {showHeadingOutside && displayTitle && (
          <Stack gap="sm" className="items-center text-center mb-6">
            <Heading level={2} className="text-white">
              {displayTitle}
            </Heading>
          </Stack>
        )}

        <Card
          variant="default"
          className="p-4 md:p-6 space-y-6 bg-black border border-[#404040]"
        >
          {displayTitle && (
            <Heading level={2} className="text-white text-center">
              {displayTitle}
            </Heading>
          )}

          <Stack gap="lg">
            <Text size="base" className="text-neutral-400 text-center leading-relaxed">
              From no money &amp; 6-figures in the hole to 6-figures in the bank. Once we locked in the system, abundance flowed.
            </Text>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8">
              <div className="space-y-4 rounded-2xl border border-[#FF0040]/60 bg-[#FF0040]/10 p-4">
                <Heading level={4} className="text-[#FF0040] uppercase tracking-[0.2em] text-center font-extrabold">
                  Before
                </Heading>
                <div className="relative aspect-[4/3] overflow-hidden rounded-xl bg-neutral-800">
                  <img
                    src={primaryItem.beforeImage || 'https://media.vibrationfit.com/site-assets/proof-wall/boa-screenshot.jpg'}
                    alt={primaryItem.beforeAlt || 'Before transformation'}
                    className="w-full h-full object-cover"
                  />
                </div>
              </div>

              <div className="space-y-4 rounded-2xl border border-[#39FF14]/60 bg-[#39FF14]/10 p-4">
                <Heading level={4} className="text-[#39FF14] uppercase tracking-[0.2em] text-center font-extrabold">
                  After
                </Heading>
                <div className="relative aspect-[4/3] overflow-hidden rounded-xl bg-neutral-800">
                  <img
                    src={primaryItem.afterImage || 'https://media.vibrationfit.com/site-assets/proof-wall/business-account-1.jpg'}
                    alt={primaryItem.afterAlt || 'After transformation'}
                    className="w-full h-full object-cover"
                  />
                </div>
              </div>
            </div>
          </Stack>
        </Card>
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

// ============================================================================
// TrackingMilestoneCard - Metric display card with themed styling
// ============================================================================

interface TrackingMilestoneCardProps {
  label: string
  value?: string | number
  theme?: 'primary' | 'secondary' | 'accent' | 'neutral'
  action?: React.ReactNode
}

export const TrackingMilestoneCard: React.FC<TrackingMilestoneCardProps> = ({
  label,
  value,
  theme = 'primary',
  action
}) => {
  const themeColors = {
    primary: 'border-[#199D67]/25 bg-[#199D67]/10',
    secondary: 'border-[#14B8A6]/25 bg-[#14B8A6]/10',
    accent: 'border-[#8B5CF6]/25 bg-[#8B5CF6]/10',
    neutral: 'border-[#666666]/25 bg-[#666666]/10'
  }

  const textColors = {
    primary: 'text-[#5EC49A]',
    secondary: 'text-[#2DD4BF]',
    accent: 'text-[#C4B5FD]',
    neutral: 'text-neutral-400'
  }

  return (
    <div className={`rounded-2xl border-2 p-4 md:p-6 lg:p-8 ${themeColors[theme]}`}>
      <div className="space-y-2">
        <p className={`text-xs uppercase tracking-[0.2em] ${textColors[theme]}`}>
          {label}
        </p>
        {value !== undefined && (
          <p className="text-2xl md:text-3xl font-bold text-white">
            {value}
          </p>
        )}
        {action && (
          <div className="mt-3">
            {action}
          </div>
        )}
      </div>
    </div>
  )
}

