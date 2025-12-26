'use client'

import React from 'react'
import { cn } from '../shared-utils'

/**
 * Container - Apple.com Style Width Constraint
 * Provides max-width constraint and centering ONLY (no padding)
 * 
 * Apple.com Pattern:
 * - PageLayout = Padding only (no width constraint)
 * - Container = Width constraint only (no padding)
 *
 * PageLayout provides all padding. Container only constrains width.
 *
 * Usage Examples:
 *
 * Inside PageLayout (uses PageLayout padding):
 *   <PageLayout>
 *     <Container size="xl">
 *       <section>...</section>
 *     </Container>
 *   </PageLayout>
 *
 * Standalone (add padding manually if needed):
 *   <div className="px-4 sm:px-6 lg:px-8">
 *     <Container size="xl">
 *       <section>...</section>
 *     </Container>
 *   </div>
 *
 * Or use PageLayout even for standalone:
 *   <PageLayout>
 *     <Container size="xl">...</Container>
 *   </PageLayout>
 */
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

