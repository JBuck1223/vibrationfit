'use client'

import React, { useCallback, useEffect } from 'react'
import { X } from 'lucide-react'

export type ProfilePictureLightboxProps = {
  src: string
  alt: string
  isOpen: boolean
  onClose: () => void
}

/**
 * Full-screen preview. Uses a plain <img> so the CDN/original file is shown without
 * Next.js Image re-encoding (preserves uploaded JPEG quality).
 */
export function ProfilePictureLightbox({ src, alt, isOpen, onClose }: ProfilePictureLightboxProps) {
  const onKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    },
    [onClose]
  )

  useEffect(() => {
    if (!isOpen) return
    document.addEventListener('keydown', onKeyDown)
    const prevOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKeyDown)
      document.body.style.overflow = prevOverflow
    }
  }, [isOpen, onKeyDown])

  if (!isOpen) return null

  return (
    <div
      className="fixed inset-0 z-[1000000] flex items-center justify-center bg-black/90 p-4"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label={alt}
    >
      <button
        type="button"
        onClick={onClose}
        className="absolute right-4 top-4 z-10 rounded-full bg-black/50 p-2 text-white transition-colors hover:bg-black/70 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500"
        aria-label="Close"
      >
        <X className="h-6 w-6" />
      </button>
      <div
        className="flex max-h-[85vh] max-w-[min(90vw,720px)] items-center justify-center"
        onClick={(e) => e.stopPropagation()}
      >
        {/* eslint-disable-next-line @next/next/no-img-element -- intentional: full-resolution source, no optimizer */}
        <img
          src={src}
          alt={alt}
          className="max-h-[85vh] max-w-full object-contain"
          decoding="async"
        />
      </div>
    </div>
  )
}
