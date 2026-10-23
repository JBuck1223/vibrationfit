import { Capacitor } from '@capacitor/core'

export type NativePlatform = 'ios' | 'android' | 'web'

/**
 * True when running inside the Capacitor iOS/Android shell.
 * Safe to call during SSR (returns false).
 */
export function isNativeShell(): boolean {
  if (typeof window === 'undefined') return false
  try {
    return Capacitor.isNativePlatform()
  } catch {
    return false
  }
}

export function getNativePlatform(): NativePlatform {
  if (!isNativeShell()) return 'web'
  return Capacitor.getPlatform() as NativePlatform
}

/**
 * Paths that should never render inside the native shell.
 * Members-only v1: no purchasing, no pricing, no admin, no heavy generation.
 * Clicks to these are redirected to the system browser by NativeShellBridge.
 */
export const NATIVE_EXTERNAL_PATH_PREFIXES = [
  '/join',
  '/checkout',
  '/billing',
  '/account/billing',
  '/member/offers',
  '/premium-application',
  '/free-activation',
  '/intensive',
  '/admin',
  '/print',
  '/homeschool',
]

export function isNativeExternalPath(pathname: string): boolean {
  return NATIVE_EXTERNAL_PATH_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`)
  )
}

/**
 * Open a URL outside the WebView: SFSafariViewController on iOS,
 * Chrome Custom Tab on Android, new tab on the web.
 */
export async function openExternal(url: string): Promise<void> {
  if (isNativeShell()) {
    const { Browser } = await import('@capacitor/browser')
    await Browser.open({ url, presentationStyle: 'popover' })
    return
  }
  window.open(url, '_blank', 'noopener,noreferrer')
}
