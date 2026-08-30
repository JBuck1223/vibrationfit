'use client'

import React from 'react'
import { cn } from '../shared-utils'

// Slim page title row. Not a card, not a marketing hero.
// Studio pages should use AreaBar instead — do not render this inside a studio layout.

export interface PageHeroProps extends Omit<React.HTMLAttributes<HTMLDivElement>, 'title'> {
  eyebrow?: React.ReactNode
  title: React.ReactNode
  subtitle?: React.ReactNode
  children?: React.ReactNode
}

export const PageHero = React.forwardRef<HTMLDivElement, PageHeroProps>(
  (
    {
      eyebrow,
      title,
      subtitle,
      children,
      className = '',
      ...props
    },
    ref
  ) => {
    return (
      <div
        ref={ref}
        className={cn('space-y-3', className)}
        {...props}
      >
        <div className="min-w-0">
          {eyebrow && (
            <p className="mb-1 text-[10px] font-semibold uppercase tracking-widest text-neutral-500">
              {eyebrow}
            </p>
          )}
          <h1 className="text-lg font-semibold leading-tight text-white md:text-2xl">
            {title}
          </h1>
          {subtitle && (
            <p className="mt-1 max-w-2xl text-sm text-neutral-400">
              {subtitle}
            </p>
          )}
        </div>
        {children && (
          <div className="flex flex-wrap items-center gap-2">
            {children}
          </div>
        )}
      </div>
    )
  }
)
PageHero.displayName = 'PageHero'
