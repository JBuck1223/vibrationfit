import { redirect } from 'next/navigation'
import { resolveLegacyPublicRedirect } from './legacy-archive'

/**
 * Factory for thin redirect pages left at former public routes after archival.
 */
export function createLegacyPublicRedirect(publicRoute: string) {
  return async function LegacyPublicRedirectPage({
    params,
  }: {
    params?: Promise<Record<string, string>>
  }) {
    const resolved = params ? await params : {}
    redirect(resolveLegacyPublicRedirect(publicRoute, resolved))
  }
}
