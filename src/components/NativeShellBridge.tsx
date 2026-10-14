'use client'

import { useEffect } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import {
  getNativePlatform,
  isNativeExternalPath,
  isNativeShell,
  openExternal,
} from '@/lib/mobile/native-shell'

/**
 * Wires the Capacitor shell to the web app. Renders nothing.
 *
 * - Marks <html data-native-shell="ios|android"> for CSS hooks
 * - Hides the splash and sets dark status bar chrome
 * - Android hardware back button -> history.back() or minimize
 * - Deep links (appUrlOpen) -> client-side navigation
 * - Clicks to members-only-excluded paths (checkout, billing, admin, ...)
 *   open in the system browser instead of the WebView
 *
 * No-op on the regular web.
 */
export function NativeShellBridge() {
  const router = useRouter()
  const pathname = usePathname()

  useEffect(() => {
    if (!isNativeShell()) return

    document.documentElement.dataset.nativeShell = getNativePlatform()

    let cleanup: Array<() => void> = []

    ;(async () => {
      const [{ App }, { StatusBar, Style }, { SplashScreen }] = await Promise.all([
        import('@capacitor/app'),
        import('@capacitor/status-bar'),
        import('@capacitor/splash-screen'),
      ])

      try {
        await StatusBar.setStyle({ style: Style.Dark })
        if (getNativePlatform() === 'android') {
          await StatusBar.setBackgroundColor({ color: '#000000' })
        }
      } catch {
        // StatusBar is unavailable on some Android WebView configs; ignore.
      }

      await SplashScreen.hide().catch(() => undefined)

      const back = await App.addListener('backButton', ({ canGoBack }) => {
        if (canGoBack) window.history.back()
        else App.minimizeApp()
      })

      const urlOpen = await App.addListener('appUrlOpen', ({ url }) => {
        try {
          const target = new URL(url)
          if (target.origin === window.location.origin) {
            router.push(target.pathname + target.search + target.hash)
          }
        } catch {
          // Ignore malformed deep links.
        }
      })

      cleanup = [() => back.remove(), () => urlOpen.remove()]
    })()

    return () => cleanup.forEach((fn) => fn())
  }, [router])

  // Intercept in-app clicks to paths that must live in the system browser.
  useEffect(() => {
    if (!isNativeShell()) return

    const onClick = (event: MouseEvent) => {
      if (event.defaultPrevented || event.button !== 0) return
      if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return

      const anchor = (event.target as HTMLElement | null)?.closest?.('a[href]')
      if (!(anchor instanceof HTMLAnchorElement)) return

      let url: URL
      try {
        url = new URL(anchor.href, window.location.href)
      } catch {
        return
      }

      if (url.origin !== window.location.origin) return
      if (!isNativeExternalPath(url.pathname)) return

      event.preventDefault()
      event.stopPropagation()
      void openExternal(url.toString())
    }

    document.addEventListener('click', onClick, true)
    return () => document.removeEventListener('click', onClick, true)
  }, [])

  // If the shell lands on an excluded path (server redirect, stale link),
  // bounce it to the browser and go home.
  useEffect(() => {
    if (!isNativeShell() || !pathname) return
    if (!isNativeExternalPath(pathname)) return
    void openExternal(window.location.href)
    router.replace('/dashboard')
  }, [pathname, router])

  return null
}
