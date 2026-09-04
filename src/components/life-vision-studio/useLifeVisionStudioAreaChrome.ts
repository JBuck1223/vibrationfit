'use client'

import { useEffect } from 'react'
import { useLifeVisionStudio, type LifeVisionStudioAreaChrome } from './LifeVisionStudioContext'

/**
 * Pushes eyebrow / helper text / Walkthrough toggle into `LifeVisionAreaBar`
 * for the current route. Inline `chrome` objects are fine: updates follow
 * `contextEyebrow`, `contextText`, and `walkthrough`.
 * The area title always stays "Life Vision".
 */
export function useLifeVisionStudioAreaChrome(chrome: LifeVisionStudioAreaChrome | null) {
  const { setStudioAreaChrome } = useLifeVisionStudio()
  useEffect(() => {
    setStudioAreaChrome(chrome)
    return () => {
      setStudioAreaChrome(null)
    }
  }, [
    setStudioAreaChrome,
    chrome?.contextEyebrow,
    chrome?.contextText,
    chrome?.walkthrough?.active,
    chrome?.walkthrough?.onToggle,
  ])
}
