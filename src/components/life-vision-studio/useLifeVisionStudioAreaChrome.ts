'use client'

import { useEffect } from 'react'
import { useLifeVisionStudio, type LifeVisionStudioAreaChrome } from './LifeVisionStudioContext'

/**
 * Pushes headline / eyebrow / helper text into `LifeVisionAreaBar` for the current route.
 * Inline `chrome` objects are fine: updates follow `headline`, `contextEyebrow`, and `contextText`.
 */
export function useLifeVisionStudioAreaChrome(chrome: LifeVisionStudioAreaChrome | null) {
  const { setStudioAreaChrome } = useLifeVisionStudio()
  useEffect(() => {
    setStudioAreaChrome(chrome)
    return () => {
      setStudioAreaChrome(null)
    }
  }, [setStudioAreaChrome, chrome?.headline, chrome?.contextEyebrow, chrome?.contextText])
}
