import { Spinner } from '@/lib/design-system/components'

/**
 * Route loading state, site-wide: a full-screen glass-styled layer with the
 * branded spinner. Fully opaque so it looks identical whether or not the
 * shell's backdrop has mounted underneath yet (hard refresh paints it before
 * the shell flag resolves).
 */
export function RouteLoading() {
  return (
    <div
      role="status"
      aria-label="Loading"
      className="fixed inset-0 z-[60] flex items-center justify-center bg-[linear-gradient(180deg,#1f1a2b_0%,#110e18_100%)]"
    >
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_20%_15%,rgba(191,0,255,0.18),transparent_55%),radial-gradient(ellipse_at_85%_90%,rgba(57,255,20,0.10),transparent_50%),radial-gradient(ellipse_at_80%_10%,rgba(0,255,255,0.08),transparent_45%)]"
      />
      <div className="relative flex h-24 w-24 items-center justify-center rounded-full border border-white/[0.12] bg-white/[0.06] shadow-[0_10px_30px_rgba(0,0,0,0.28)] backdrop-blur-xl">
        <Spinner size="lg" />
      </div>
    </div>
  )
}
