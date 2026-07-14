'use client'

import { useEffect } from 'react'
import { useLifeVisionStudio, type LifeVisionStudioAreaChrome } from './LifeVisionStudioContext'

/**
 * Pushes eyebrow / helper text into `LifeVisionAreaBar` for the current route.
 * Inline `chrome` objects are fine: updates follow `contextEyebrow` and `contextText`.
 * The area title always stays "Life Vision".
 */
export function useLifeVisionStudioAreaChrome(chrome: LifeVisionStudioAreaChrome | null) {
  const { setStudioAreaChrome } = useLifeVisionStudio()
  useEffect(() => {
    setStudioAreaChrome(chrome)
    return () => {
      setStudioAreaChrome(null)
    }
  }, [setStudioAreaChrome, chrome?.contextEyebrow, chrome?.contextText])
}
