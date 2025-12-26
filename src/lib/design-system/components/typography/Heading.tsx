'use client'

import React from 'react'
import { cn } from '../shared-utils'

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

