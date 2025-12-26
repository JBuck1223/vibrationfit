'use client'

import React from 'react'
import { cn } from '../shared-utils'

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

