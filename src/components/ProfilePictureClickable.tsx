'use client'

import React, { useState } from 'react'
import { cn } from '@/lib/utils'
import { ProfilePictureLightbox } from '@/components/ProfilePictureLightbox'

export type ProfilePictureClickableProps = {
  /** Image URL; when missing, children render without a lightbox trigger */
  src: string | null | undefined
  alt: string
  children: React.ReactNode
  /** Applied to the clickable wrapper when `src` is present */
  className?: string
  /**
   * Use span + role="button" instead of `<button>` so the trigger can live inside a `<Link>`
   * without invalid HTML nesting.
   */
  avoidNestedButton?: boolean
}

/**
 * Wraps a profile thumbnail; click opens full-size preview. Skips the wrapper when there is no image URL.
 */
export function ProfilePictureClickable({
  src,
  alt,
  children,
  className,
  avoidNestedButton,
}: ProfilePictureClickableProps) {
  const [open, setOpen] = useState(false)
  const resolved = typeof src === 'string' ? src.trim() : ''

  const openPreview = (e: React.SyntheticEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setOpen(true)
  }

  if (!resolved) {
    return <>{children}</>
  }

  const triggerClass = cn(
    'cursor-zoom-in border-0 bg-transparent p-0 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500',
    avoidNestedButton ? 'inline-flex' : '',
    className
  )

  return (
    <>
      {avoidNestedButton ? (
        <span
          role="button"
          tabIndex={0}
          className={triggerClass}
          aria-label={`View ${alt} larger`}
          onClick={openPreview}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault()
              openPreview(e)
            }
          }}
        >
          {children}
        </span>
      ) : (
        <button
          type="button"
          onClick={openPreview}
          className={triggerClass}
          aria-label={`View ${alt} larger`}
        >
          {children}
        </button>
      )}
      <ProfilePictureLightbox src={resolved} alt={alt} isOpen={open} onClose={() => setOpen(false)} />
    </>
  )
}
