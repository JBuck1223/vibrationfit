/**
 * The `shell=next` flag. While Phase 0 to 3 ship, the new AppShell renders only
 * for browsers that carry this cookie, so it can be reviewed on production from
 * the real iOS and Android apps without anyone else seeing it.
 *
 * Set it by visiting any member page with `?shell=next`; clear it with `?shell=off`.
 */

export const SHELL_FLAG_COOKIE = 'vf_shell'
export const SHELL_FLAG_VALUE = 'next'

export function readShellFlagFromCookie(cookieHeader: string | null | undefined): boolean {
  if (!cookieHeader) return false
  return cookieHeader
    .split(';')
    .map((c) => c.trim())
    .some((c) => c === `${SHELL_FLAG_COOKIE}=${SHELL_FLAG_VALUE}`)
}

export function isShellFlagOn(): boolean {
  if (typeof document === 'undefined') return false
  return readShellFlagFromCookie(document.cookie)
}

/** Handles `?shell=next` / `?shell=off` on the current URL. Returns the flag state after. */
export function syncShellFlagFromUrl(): boolean {
  if (typeof window === 'undefined') return false
  const params = new URLSearchParams(window.location.search)
  const value = params.get('shell')
  if (value === SHELL_FLAG_VALUE) {
    document.cookie = `${SHELL_FLAG_COOKIE}=${SHELL_FLAG_VALUE}; path=/; max-age=${60 * 60 * 24 * 365}; SameSite=Lax`
    return true
  }
  if (value === 'off') {
    document.cookie = `${SHELL_FLAG_COOKIE}=; path=/; max-age=0; SameSite=Lax`
    return false
  }
  return isShellFlagOn()
}
