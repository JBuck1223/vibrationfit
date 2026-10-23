/**
 * The app shell switch. The new AppShell is the member app for everyone; a
 * browser can still opt back into the old layout while it is retired.
 *
 * Opt out by visiting any member page with `?shell=off` (remembered in the
 * `vf_shell=off` cookie); come back with `?shell=next`.
 */

export const SHELL_FLAG_COOKIE = 'vf_shell'
export const SHELL_FLAG_VALUE = 'next'
export const SHELL_FLAG_OFF = 'off'

/** On unless this browser opted out. */
export function readShellFlagFromCookie(cookieHeader: string | null | undefined): boolean {
  if (!cookieHeader) return true
  return !cookieHeader
    .split(';')
    .map((c) => c.trim())
    .some((c) => c === `${SHELL_FLAG_COOKIE}=${SHELL_FLAG_OFF}`)
}

export function isShellFlagOn(): boolean {
  if (typeof document === 'undefined') return true
  return readShellFlagFromCookie(document.cookie)
}

/** Handles `?shell=next` / `?shell=off` on the current URL. Returns the flag state after. */
export function syncShellFlagFromUrl(): boolean {
  if (typeof window === 'undefined') return true
  const params = new URLSearchParams(window.location.search)
  const value = params.get('shell')
  if (value === SHELL_FLAG_VALUE) {
    document.cookie = `${SHELL_FLAG_COOKIE}=; path=/; max-age=0; SameSite=Lax`
    return true
  }
  if (value === SHELL_FLAG_OFF) {
    document.cookie = `${SHELL_FLAG_COOKIE}=${SHELL_FLAG_OFF}; path=/; max-age=${60 * 60 * 24 * 365}; SameSite=Lax`
    return false
  }
  return isShellFlagOn()
}
