'use client'

import React from 'react'
import { Container } from './Container'
import { cn } from '../shared-utils'

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

