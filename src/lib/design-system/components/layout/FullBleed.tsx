'use client'

import React from 'react'
import { cn } from '../shared-utils'

interface FullBleedProps {
  children: React.ReactNode
  className?: string
}

/**
 * Expands a section to fill the full width on mobile, breaking out of the
 * parent's horizontal padding. Reads the `--content-px` CSS custom property
 * set by the studio layout's <main> element, so the expansion always stays
 * in sync with the padding — no hardcoded values to maintain.
 *
 * On desktop (md+) the negative margin is removed since PageLayout handles
 * padding at that breakpoint.
 */
export function FullBleed({ children, className }: FullBleedProps) {
  return (
    <div
      className={cn(
        'max-md:ml-[calc(-1*var(--content-px,0px))] max-md:mr-[calc(-1*var(--content-px,0px))]',
        className,
      )}
    >
      {children}
    </div>
  )
}
