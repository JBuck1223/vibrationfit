'use client'

import React from 'react'
import { cn } from '../shared-utils'

interface BulletedListProps extends React.HTMLAttributes<HTMLUListElement> {
  children: React.ReactNode
  variant?: 'default' | 'primary' | 'secondary' | 'accent' | 'success' | 'warning' | 'error'
  size?: 'sm' | 'md' | 'lg'
  spacing?: 'tight' | 'normal' | 'loose' | 'sm' | 'md' | 'lg'
  className?: string
}

export const BulletedList = React.forwardRef<HTMLUListElement, BulletedListProps>(
  ({ children, variant = 'default', size, spacing = 'normal', className = '', ...props }, ref) => {
    const spacings = {
      tight: 'space-y-1',
      normal: 'space-y-3',
      loose: 'space-y-6',
      sm: 'space-y-2',
      md: 'space-y-3',
      lg: 'space-y-4'
    }
    
    return (
      <ul ref={ref} className={cn('list-none', spacings[spacing], className)} {...props}>
        {children}
      </ul>
    )
  }
)
BulletedList.displayName = 'BulletedList'
