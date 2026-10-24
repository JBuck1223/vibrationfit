'use client'

import React, { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'

/**
 * Renders an overlay into document.body. Inside the app shell, cards and glass
 * panels use backdrop-filter, which makes them the containing block for any
 * position: fixed child; an overlay rendered in place would be clipped to the
 * card. Every dialog, sheet and lightbox goes through here.
 */
export function OverlayPortal({ children }: { children: React.ReactNode }) {
  const [mounted, setMounted] = useState(false)
  useEffect(() => {
    setMounted(true)
  }, [])
  if (!mounted) return null
  return createPortal(children, document.body)
}
