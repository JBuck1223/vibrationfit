'use client'

import React from 'react'
import { Grid } from './Grid'

/**
 * @deprecated Use <Grid responsiveCols={{mobile: 2, desktop: 4}}> instead
 */
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

