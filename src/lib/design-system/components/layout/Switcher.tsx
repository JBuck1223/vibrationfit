'use client'

import React from 'react'
import { Grid } from './Grid'
import { cn } from '../shared-utils'

/**
 * @deprecated Use <Grid responsiveCols={{mobile: 1, desktop: 'auto'}}> or <Grid mode="flex-row" className="flex-col md:flex-row"> instead
 */
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

