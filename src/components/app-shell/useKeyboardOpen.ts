'use client'

import { useEffect, useState } from 'react'
import { isNativeShell } from '@/lib/mobile/native-shell'

/**
 * True while the on-screen keyboard is up. Uses Capacitor Keyboard events in
 * the native apps and the visual viewport on the mobile web.
 */
export function useKeyboardOpen(): boolean {
  const [open, setOpen] = useState(false)

  useEffect(() => {
    let cleanup: (() => void) | undefined

    if (isNativeShell()) {
      let cancelled = false
      import('@capacitor/keyboard')
        .then(({ Keyboard }) => {
          if (cancelled) return
          const show = Keyboard.addListener('keyboardWillShow', () => setOpen(true))
          const hide = Keyboard.addListener('keyboardWillHide', () => setOpen(false))
          cleanup = () => {
            void show.then((h) => h.remove())
            void hide.then((h) => h.remove())
          }
        })
        .catch(() => {
          // Keyboard plugin missing on this platform; the pill simply stays.
        })
      return () => {
        cancelled = true
        cleanup?.()
      }
    }

    const vv = window.visualViewport
    if (!vv) return
    const baseline = window.innerHeight
    const onResize = () => setOpen(baseline - vv.height > 150)
    vv.addEventListener('resize', onResize)
    return () => vv.removeEventListener('resize', onResize)
  }, [])

  return open
}
