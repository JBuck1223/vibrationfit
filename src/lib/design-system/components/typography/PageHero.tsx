'use client'

import React from 'react'
import { cn } from '../shared-utils'
import { ScriptTitle } from './ScriptTitle'

// Slim page title row. Not a card, not a marketing hero.
// Studio pages should use AreaBar instead — do not render this inside a studio layout.

export interface PageHeroProps extends Omit<React.HTMLAttributes<HTMLDivElement>, 'title'> {
  eyebrow?: React.ReactNode
  title: React.ReactNode
  subtitle?: React.ReactNode
  /** Sits on the title line, vertically centered with the heading. */
  action?: React.ReactNode
  children?: React.ReactNode
}

export const PageHero = React.forwardRef<HTMLDivElement, PageHeroProps>(
  (
    {
      eyebrow,
      title,
      subtitle,
      action,
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
          <div className="flex items-center gap-3">
            <h1 className="min-w-0 flex-1 py-0.5 text-lg font-semibold leading-normal text-white md:text-2xl">
              {typeof title === 'string' ? <ScriptTitle text={title} /> : title}
            </h1>
            {action ? <div className="shrink-0">{action}</div> : null}
          </div>
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
