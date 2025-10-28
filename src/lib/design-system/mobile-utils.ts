'use client'

// VibrationFit Mobile Design System Utilities
// Mobile-first responsive utilities and hooks
// Path: /src/lib/design-system/mobile-utils.ts
//
// CRITICAL: These utilities support the mandatory rules defined in:
// @see rules/mobile-design-rules.md
//
// Always follow the three critical rules:
// 1. NO OFF-SCREEN FLOW - Never allow content to overflow horizontally
// 2. MOBILE-FIRST UX - Prioritize mobile experience, ensure 44px+ touch targets
// 3. INTELLIGENT RESPONSIVE GRIDS - Always start with single column on mobile

import { useState, useEffect } from 'react'

/**
 * Breakpoints matching Tailwind CSS and tokens.ts
 */
export const breakpoints = {
  sm: 640,   // Mobile landscape
  md: 768,   // Tablet
  lg: 1024,  // Desktop
  xl: 1280,  // Large desktop
  '2xl': 1536, // Extra large
} as const

/**
 * Standard mobile device widths for testing
 */
export const deviceWidths = {
  iphoneSE: 375,      // Smallest common mobile
  iphone12: 390,      // Standard mobile
  iphonePro: 428,     // Large mobile
  ipad: 768,          // Tablet
  desktop: 1280,      // Desktop
} as const

/**
 * Minimum touch target sizes (iOS/Android standards)
 */
export const touchTargets = {
  minimum: 44,  // iOS minimum (Apple HIG)
  recommended: 48, // Android minimum (Material Design)
  comfortable: 56, // Comfortable size for easy tapping
} as const

/**
 * Hook: Detect if viewport matches a media query
 * 
 * @param query - Media query string (e.g., "(max-width: 768px)")
 * @returns boolean - true if query matches
 * 
 * @example
 * const isMobile = useMediaQuery("(max-width: 767px)")
 * const prefersDark = useMediaQuery("(prefers-color-scheme: dark)")
 */
export function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState(false)

  useEffect(() => {
    // Check if we're in a browser environment
    if (typeof window === 'undefined') {
      return
    }

    const mediaQuery = window.matchMedia(query)
    
    // Set initial value
    setMatches(mediaQuery.matches)

    // Create listener
    const handler = (event: MediaQueryListEvent) => {
      setMatches(event.matches)
    }

    // Modern browsers
    if (mediaQuery.addEventListener) {
      mediaQuery.addEventListener('change', handler)
      return () => mediaQuery.removeEventListener('change', handler)
    } else {
      // Fallback for older browsers
      mediaQuery.addListener(handler)
      return () => mediaQuery.removeListener(handler)
    }
  }, [query])

  return matches
}

/**
 * Hook: Detect if current viewport is mobile (< 768px)
 * 
 * @returns boolean - true if viewport is mobile
 */
export function useIsMobile(): boolean {
  return useMediaQuery(`(max-width: ${breakpoints.md - 1}px)`)
}

/**
 * Hook: Detect if current viewport is tablet (768px - 1023px)
 * 
 * @returns boolean - true if viewport is tablet
 */
export function useIsTablet(): boolean {
  const isTablet = useMediaQuery(`(min-width: ${breakpoints.md}px) and (max-width: ${breakpoints.lg - 1}px)`)
  return isTablet
}

/**
 * Hook: Detect if current viewport is desktop (>= 1024px)
 * 
 * @returns boolean - true if viewport is desktop
 */
export function useIsDesktop(): boolean {
  return useMediaQuery(`(min-width: ${breakpoints.lg}px)`)
}

/**
 * Hook: Get current viewport width
 * 
 * @returns number - viewport width in pixels
 */
export function useViewportWidth(): number {
  const [width, setWidth] = useState(0)

  useEffect(() => {
    if (typeof window === 'undefined') {
      return
    }

    const updateWidth = () => {
      setWidth(window.innerWidth)
    }

    // Set initial width
    updateWidth()

    // Listen for resize events
    window.addEventListener('resize', updateWidth)
    return () => window.removeEventListener('resize', updateWidth)
  }, [])

  return width
}

/**
 * Hook: Detect if device supports touch
 * 
 * @returns boolean - true if device supports touch
 */
export function useIsTouchDevice(): boolean {
  const [isTouch, setIsTouch] = useState(false)

  useEffect(() => {
    if (typeof window === 'undefined') {
      return
    }

    // Check for touch support
    setIsTouch(
      'ontouchstart' in window ||
      navigator.maxTouchPoints > 0 ||
      // @ts-ignore - for legacy browsers
      navigator.msMaxTouchPoints > 0
    )
  }, [])

  return isTouch
}

/**
 * Hook: Get current breakpoint name
 * 
 * @returns 'sm' | 'md' | 'lg' | 'xl' | '2xl' | 'mobile'
 */
export function useBreakpoint(): 'mobile' | 'sm' | 'md' | 'lg' | 'xl' | '2xl' {
  const width = useViewportWidth()

  if (width === 0) {
    // SSR/default state
    return 'mobile'
  }

  if (width < breakpoints.sm) {
    return 'mobile'
  }
  if (width < breakpoints.md) {
    return 'sm'
  }
  if (width < breakpoints.lg) {
    return 'md'
  }
  if (width < breakpoints.xl) {
    return 'lg'
  }
  if (width < breakpoints['2xl']) {
    return 'xl'
  }
  return '2xl'
}

/**
 * Utility: Check if element has minimum touch target size
 * 
 * @param element - HTMLElement to check
 * @param minimum - Minimum size in pixels (default: 44)
 * @returns boolean - true if element meets minimum size
 */
export function hasMinimumTouchTarget(
  element: HTMLElement | null,
  minimum: number = touchTargets.minimum
): boolean {
  if (!element) return false

  const rect = element.getBoundingClientRect()
  const minDimension = Math.min(rect.width, rect.height)
  return minDimension >= minimum
}

/**
 * Utility: Get responsive text size classes
 * 
 * @param mobile - Mobile text size (e.g., 'sm', 'base')
 * @param desktop - Desktop text size (e.g., 'lg', 'xl')
 * @returns string - Responsive Tailwind classes
 * 
 * @example
 * const textClasses = getResponsiveText('sm', 'lg') // "text-sm md:text-lg"
 */
export function getResponsiveText(
  mobile: string,
  desktop: string
): string {
  return `text-${mobile} md:text-${desktop}`
}

/**
 * Utility: Get responsive spacing classes
 * 
 * @param mobile - Mobile spacing (e.g., '2', '4')
 * @param desktop - Desktop spacing (e.g., '6', '8')
 * @param property - Spacing property ('p', 'px', 'py', 'm', 'mx', 'my', 'gap')
 * @returns string - Responsive Tailwind classes
 * 
 * @example
 * const paddingClasses = getResponsiveSpacing('4', '8', 'p') // "p-4 md:p-8"
 * const gapClasses = getResponsiveSpacing('4', '6', 'gap') // "gap-4 md:gap-6"
 */
export function getResponsiveSpacing(
  mobile: string,
  desktop: string,
  property: 'p' | 'px' | 'py' | 'm' | 'mx' | 'my' | 'gap' = 'p'
): string {
  return `${property}-${mobile} md:${property}-${desktop}`
}

/**
 * Utility: Get responsive grid columns
 * 
 * @param mobile - Mobile columns (default: 1)
 * @param tablet - Tablet columns (default: 2)
 * @param desktop - Desktop columns (default: 3)
 * @param large - Large desktop columns (default: 4)
 * @returns string - Responsive Tailwind grid classes
 * 
 * @example
 * const gridClasses = getResponsiveGrid(1, 2, 3, 4)
 * // "grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4"
 */
export function getResponsiveGrid(
  mobile: number = 1,
  tablet: number = 2,
  desktop: number = 3,
  large: number = 4
): string {
  return `grid-cols-${mobile} sm:grid-cols-${tablet} md:grid-cols-${desktop} lg:grid-cols-${large}`
}

/**
 * Utility: Check if text will overflow container
 * 
 * @param text - Text content
 * @param containerWidth - Container width in pixels
 * @param fontSize - Font size in pixels
 * @param fontFamily - Font family (default: 'Poppins')
 * @returns boolean - true if text will overflow
 */
export function willTextOverflow(
  text: string,
  containerWidth: number,
  fontSize: number = 14,
  fontFamily: string = 'Poppins'
): boolean {
  if (typeof document === 'undefined') return false

  // Create temporary element to measure text
  const temp = document.createElement('span')
  temp.style.position = 'absolute'
  temp.style.visibility = 'hidden'
  temp.style.whiteSpace = 'nowrap'
  temp.style.fontSize = `${fontSize}px`
  temp.style.fontFamily = fontFamily
  temp.textContent = text

  document.body.appendChild(temp)
  const textWidth = temp.offsetWidth
  document.body.removeChild(temp)

  return textWidth > containerWidth
}

/**
 * Utility: Safe area inset utilities for iOS notched devices
 * 
 * CSS custom properties that can be used in Tailwind:
 * - safe-area-inset-top
 * - safe-area-inset-bottom
 * - safe-area-inset-left
 * - safe-area-inset-right
 * 
 * These are automatically set by iOS Safari.
 */
export const safeAreaInsets = {
  /**
   * Get padding that respects safe area insets
   * 
   * @param sides - Which sides to add padding ('top' | 'bottom' | 'both' | 'all')
   * @returns string - CSS classes for safe area padding
   */
  getPadding: (sides: 'top' | 'bottom' | 'both' | 'all' = 'both'): string => {
    const classes = []
    if (sides === 'top' || sides === 'both' || sides === 'all') {
      classes.push('pt-[env(safe-area-inset-top)]')
    }
    if (sides === 'bottom' || sides === 'both' || sides === 'all') {
      classes.push('pb-[env(safe-area-inset-bottom)]')
    }
    if (sides === 'all') {
      classes.push('pl-[env(safe-area-inset-left)]')
      classes.push('pr-[env(safe-area-inset-right)]')
    }
    return classes.join(' ')
  },
}

/**
 * Mobile-first responsive value utility
 * Returns mobile value on mobile, desktop value on desktop
 * 
 * @param mobile - Value for mobile
 * @param desktop - Value for desktop
 * @param width - Current viewport width (optional, will use hook if not provided)
 * @returns mobile or desktop value
 */
export function responsiveValue<T>(
  mobile: T,
  desktop: T,
  width?: number
): T {
  // If width is provided, use it
  if (width !== undefined) {
    return width < breakpoints.md ? mobile : desktop
  }
  
  // Otherwise, default to mobile (SSR-safe)
  if (typeof window === 'undefined') {
    return mobile
  }
  
  return window.innerWidth < breakpoints.md ? mobile : desktop
}

/**
 * Hook: Get responsive value based on breakpoint
 * 
 * @param mobile - Value for mobile
 * @param desktop - Value for desktop
 * @returns Current responsive value
 */
export function useResponsiveValue<T>(mobile: T, desktop: T): T {
  const width = useViewportWidth()
  return responsiveValue(mobile, desktop, width)
}

/**
 * Component props type for mobile-aware components
 */
export interface MobileAwareProps {
  /**
   * Force mobile styling (overrides automatic detection)
   */
  forceMobile?: boolean
  
  /**
   * Force desktop styling (overrides automatic detection)
   */
  forceDesktop?: boolean
}

/**
 * Get mobile-aware classes
 * 
 * @param mobileClass - Class for mobile
 * @param desktopClass - Class for desktop
 * @param props - Mobile-aware props
 * @param isMobile - Current mobile state (from hook)
 * @returns Appropriate class string
 */
export function getMobileAwareClass(
  mobileClass: string,
  desktopClass: string,
  props: MobileAwareProps,
  isMobile: boolean
): string {
  if (props.forceMobile) return mobileClass
  if (props.forceDesktop) return desktopClass
  return isMobile ? mobileClass : desktopClass
}

/**
 * Mobile Design Rules Enforcement
 * 
 * These utilities help enforce the rules defined in:
 * @see rules/mobile-design-rules.md
 */

/**
 * Validate component against mobile design rules
 * 
 * @param element - HTMLElement to validate
 * @returns Object with validation results
 */
export function validateMobileRules(element: HTMLElement | null): {
  isValid: boolean
  errors: string[]
  warnings: string[]
} {
  const errors: string[] = []
  const warnings: string[] = []

  if (!element) {
    return { isValid: false, errors: ['Element is null'], warnings: [] }
  }

  const rect = element.getBoundingClientRect()
  const computed = window.getComputedStyle(element)

  // RULE #1: NO OFF-SCREEN FLOW
  const viewportWidth = window.innerWidth
  if (rect.left < 0 || rect.right > viewportWidth) {
    errors.push('Element flows off-screen horizontally (RULE #1 violation)')
  }

  // RULE #2: TOUCH TARGETS
  const minDimension = Math.min(rect.width, rect.height)
  if (minDimension < touchTargets.minimum) {
    warnings.push(
      `Touch target is ${minDimension}px (minimum: ${touchTargets.minimum}px). Use size="sm" for buttons.`
    )
  }

  // Check for fixed widths without responsive variants
  const width = computed.width
  if (width && !width.includes('auto') && !width.includes('calc')) {
    // Check if parent has responsive width constraints
    const parent = element.parentElement
    const parentWidth = parent ? window.getComputedStyle(parent).width : null
    if (parentWidth && parseFloat(width) > parseFloat(parentWidth)) {
      warnings.push('Fixed width may cause overflow on mobile')
    }
  }

  // Check for long text without truncation
  const textContent = element.textContent || ''
  if (textContent.length > 100 && !computed.textOverflow.includes('ellipsis')) {
    warnings.push('Long text should use truncate or line-clamp')
  }

  // Check for excessive padding on mobile
  const paddingLeft = parseFloat(computed.paddingLeft)
  const paddingRight = parseFloat(computed.paddingRight)
  const totalPadding = paddingLeft + paddingRight
  if (totalPadding > 48) { // 3rem = 48px
    warnings.push('Excessive padding detected. Use responsive padding: p-4 md:p-8')
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
  }
}

/**
 * Generate responsive classes from mobile design rules
 * 
 * @param config - Configuration object
 * @returns Object with responsive class strings
 */
export function getMobileRuleClasses(config: {
  text?: { mobile: string; desktop: string }
  spacing?: { mobile: string; desktop: string; property?: 'p' | 'px' | 'py' | 'm' | 'mx' | 'my' | 'gap' }
  grid?: { mobile: number; tablet: number; desktop: number; large?: number }
  flex?: { mobile: 'col' | 'row'; desktop: 'col' | 'row' }
}) {
  const classes: string[] = []

  if (config.text) {
    classes.push(getResponsiveText(config.text.mobile, config.text.desktop))
  }

  if (config.spacing) {
    classes.push(
      getResponsiveSpacing(
        config.spacing.mobile,
        config.spacing.desktop,
        config.spacing.property || 'p'
      )
    )
  }

  if (config.grid) {
    classes.push(
      getResponsiveGrid(
        config.grid.mobile,
        config.grid.tablet,
        config.grid.desktop,
        config.grid.large
      )
    )
  }

  if (config.flex) {
    const mobileDir = config.flex.mobile === 'col' ? 'flex-col' : 'flex-row'
    const desktopDir = config.flex.desktop === 'col' ? 'flex-col' : 'flex-row'
    classes.push(mobileDir, `md:${desktopDir}`)
  }

  return classes.join(' ')
}

/**
 * Pre-configured mobile rule classes for common patterns
 */
export const mobileRuleClasses = {
  // Card with mobile-first padding
  cardPadding: 'p-4 md:p-8',
  
  // Responsive text sizes (following Rule #2)
  heading: 'text-xl md:text-3xl',
  subheading: 'text-lg md:text-2xl',
  body: 'text-sm md:text-base',
  caption: 'text-xs md:text-sm',
  
  // Responsive grid (following Rule #3)
  cardGrid: 'grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4',
  twoColumnGrid: 'grid-cols-1 md:grid-cols-2',
  threeColumnGrid: 'grid-cols-1 sm:grid-cols-2 md:grid-cols-3',
  
  // Responsive flex (following Rule #6)
  stackOnMobile: 'flex-col md:flex-row',
  
  // Container padding (following Rule #5)
  containerPadding: 'px-4 md:px-6 lg:px-8',
  
  // Responsive gap (following Rule #3)
  gap: 'gap-4 md:gap-6',
  gapSmall: 'gap-2 md:gap-4',
} as const

// Re-export for convenience
export {
  touchTargets as TOUCH_TARGETS,
  deviceWidths as DEVICE_WIDTHS,
  breakpoints as BREAKPOINTS,
}
