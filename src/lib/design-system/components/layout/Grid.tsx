'use client'

import React from 'react'
import { cn } from '../shared-utils'

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

