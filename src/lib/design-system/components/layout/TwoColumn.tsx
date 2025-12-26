'use client'

import React from 'react'
import { Grid } from './Grid'
import { cn } from '../shared-utils'

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

