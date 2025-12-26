'use client'

import React from 'react'
import { cn } from '../shared-utils'

interface PageLayoutProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode
}

export const PageLayout = React.forwardRef<HTMLDivElement, PageLayoutProps>(
  ({ children, className = '', ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn('min-h-screen bg-black text-white pt-6 pb-12 md:py-12 lg:pt-8 px-4 sm:px-6 lg:px-8', className)}
        {...props}
      >
        {children}
      </div>
    )
  }
)
PageLayout.displayName = 'PageLayout'
