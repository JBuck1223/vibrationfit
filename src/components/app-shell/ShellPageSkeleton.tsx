import { Spinner } from '@/lib/design-system/components'

const DISC = 'relative flex h-24 w-24 items-center justify-center rounded-full border border-white/[0.12] bg-white/[0.06] shadow-[0_10px_30px_rgba(0,0,0,0.22)] backdrop-blur-xl'

/**
 * Route loading state, site-wide: a full-screen layer with the branded
 * spinner. It paints the member's theme picture (the --theme-backdrop var on
 * <html> survives client navigations) blurred under the glass disc, so moving
 * between pages never flashes a dark slab; the violet gradient underneath is
 * only seen on a hard refresh before the theme has loaded.
 */
export function RouteLoading() {
  return (
    <div
      role="status"
      aria-label="Loading"
      className="fixed inset-0 z-[60] flex items-center justify-center overflow-hidden bg-[linear-gradient(180deg,#2a2238_0%,#1a1426_100%)]"
    >
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-cover bg-center"
        style={{ backgroundImage: 'var(--theme-backdrop, none)', filter: 'blur(18px) saturate(125%) brightness(0.8)', transform: 'scale(1.08)' }}
      />
      <div aria-hidden className="pointer-events-none absolute inset-0" style={{ background: 'var(--theme-tint, transparent)' }} />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_20%_15%,rgba(191,0,255,0.18),transparent_55%),radial-gradient(ellipse_at_85%_90%,rgba(57,255,20,0.10),transparent_50%)]"
      />
      <div className={DISC}>
        <Spinner size="lg" />
      </div>
    </div>
  )
}

/**
 * In-page loading state for a page or panel that already sits inside the
 * shell: the same glass disc, no background of its own, so the theme shows
 * through. Replaces the old `min-h-screen bg-black` + Spinner pattern.
 */
export function PageLoading({ label = 'Loading', className = '' }: { label?: string; className?: string }) {
  return (
    <div role="status" aria-label={label} className={`flex min-h-[50dvh] w-full items-center justify-center py-12 ${className}`}>
      <div className={DISC}>
        <Spinner size="lg" />
      </div>
    </div>
  )
}
