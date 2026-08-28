'use client'

import { useEffect, useState } from 'react'

/**
 * Visible viewport height, including iOS Safari keyboard open/close.
 * `100vh` / `100dvh` do not shrink with the software keyboard, which freezes
 * overflow-hidden chat layouts after send.
 */
export function useVisualViewportHeight(): number | null {
  const [height, setHeight] = useState<number | null>(null)

  useEffect(() => {
    const update = () => {
      const next = window.visualViewport?.height ?? window.innerHeight
      setHeight(next)
    }
    update()
    window.visualViewport?.addEventListener('resize', update)
    window.visualViewport?.addEventListener('scroll', update)
    window.addEventListener('resize', update)
    return () => {
      window.visualViewport?.removeEventListener('resize', update)
      window.visualViewport?.removeEventListener('scroll', update)
      window.removeEventListener('resize', update)
    }
  }, [])

  return height
}
