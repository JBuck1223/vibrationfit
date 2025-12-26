'use client'

import React from 'react'
import { Grid } from './Grid'

interface InlineProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode
  gap?: 'xs' | 'sm' | 'md' | 'lg'
  align?: 'start' | 'center' | 'end' | 'stretch'
  justify?: 'start' | 'center' | 'end' | 'between' | 'around'
  wrap?: boolean
}

export const Inline = React.forwardRef<HTMLDivElement, InlineProps>(
  ({ children, gap = 'md', align = 'center', justify = 'start', wrap = true, className = '', ...props }, ref) => {
    return (
      <Grid
        ref={ref}
        mode="flex-row"
        gap={gap}
        align={align}
        justify={justify}
        wrap={wrap}
        className={className}
        {...props}
      >
        {children}
      </Grid>
    )
  }
)
Inline.displayName = 'Inline'

