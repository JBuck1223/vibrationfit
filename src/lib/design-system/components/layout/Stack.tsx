'use client'

import React from 'react'
import { Grid } from './Grid'

interface StackProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode
  gap?: 'xs' | 'sm' | 'md' | 'lg' | 'xl'
  align?: 'start' | 'center' | 'end' | 'stretch'
}

export const Stack = React.forwardRef<HTMLDivElement, StackProps>(
  ({ children, gap = 'md', align = 'stretch', className = '', ...props }, ref) => {
    return (
      <Grid
        ref={ref}
        mode="flex-col"
        gap={gap}
        align={align || 'stretch'}
        className={className}
        {...props}
      >
        {children}
      </Grid>
    )
  }
)
Stack.displayName = 'Stack'

