'use client'

import React, { useCallback, useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
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
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

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

  if (!isOpen || !mounted || typeof document === 'undefined') return null

  const overlay = (
    <div
      data-shell-mode-skip
      className="fixed inset-0 z-[2147483000] flex items-center justify-center p-4"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label={alt}
    >
      <button
        type="button"
        onClick={onClose}
        className="absolute right-4 top-[max(1rem,env(safe-area-inset-top))] z-10 rounded-full border border-white/15 bg-[rgba(28,22,38,0.7)] p-2 text-white shadow-[0_6px_18px_rgba(0,0,0,0.3)] backdrop-blur-xl transition-colors hover:bg-[rgba(28,22,38,0.9)] focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500"
        aria-label="Close"
      >
        <X className="h-6 w-6" />
      </button>
      <div
        className="flex max-h-[calc(100dvh-2rem)] w-full max-w-[min(calc(100vw-2rem),900px)] items-center justify-center"
        onClick={(e) => e.stopPropagation()}
      >
        {/* eslint-disable-next-line @next/next/no-img-element -- intentional: full-resolution source, no optimizer */}
        <img
          src={src}
          alt={alt}
          className="max-h-[calc(100dvh-2rem)] max-w-full rounded-2xl object-contain shadow-[0_24px_60px_rgba(0,0,0,0.45)]"
          decoding="async"
        />
      </div>
    </div>
  )

  return createPortal(overlay, document.body)
}
