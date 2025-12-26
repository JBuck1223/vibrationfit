'use client'

import React from 'react'
import { cn } from '../shared-utils'

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

