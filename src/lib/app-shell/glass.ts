/**
 * Frosted glass for cards that sit on the photo backdrop (Home first).
 * Lighter and more translucent than `.glass-panel`: a soft white sheen over a
 * thin dark tint, a strong blur that picks up the photo's color, a bright top
 * edge like real glass, and a soft drop shadow so it floats.
 * Tailwind classes (not a stylesheet rule) so it ships with the component.
 */
export const GLASS_CARD = [
  'rounded-3xl border border-white/[0.16]',
  'bg-[linear-gradient(150deg,rgba(255,255,255,0.13)_0%,rgba(255,255,255,0.04)_55%,rgba(255,255,255,0.02)_100%),linear-gradient(rgba(16,12,24,0.32),rgba(16,12,24,0.32))]',
  'shadow-[inset_0_1px_0_rgba(255,255,255,0.22),inset_0_0_0_1px_rgba(255,255,255,0.03),0_16px_44px_rgba(0,0,0,0.32)]',
  'backdrop-blur-2xl backdrop-saturate-150',
].join(' ')

/** The same glass for a colored tile: pass the tile's tint (an rgba). */
export function glassTint(tint: string) {
  return {
    background: `linear-gradient(150deg, ${tint} 0%, rgba(255,255,255,0.05) 60%, rgba(255,255,255,0.02) 100%), linear-gradient(rgba(16,12,24,0.30), rgba(16,12,24,0.30))`,
    boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.22), 0 14px 36px rgba(0,0,0,0.3)',
    WebkitBackdropFilter: 'blur(24px) saturate(150%)',
    backdropFilter: 'blur(24px) saturate(150%)',
  } as const
}
