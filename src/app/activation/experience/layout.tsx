/**
 * Force per-request rendering for the Activation Experience.
 *
 * The page itself is a fully-client component, so Next statically prerenders
 * this route against a shared layout shell where usePathname() is not yet
 * resolved — GlobalLayout then SSRs the default chrome (footer, min-h-screen)
 * while the client renders the full-height activation chrome, causing a
 * hydration mismatch. Dynamic rendering makes the server see the real
 * pathname, matching the client.
 */

export const dynamic = 'force-dynamic'

export default function ActivationExperienceLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}
