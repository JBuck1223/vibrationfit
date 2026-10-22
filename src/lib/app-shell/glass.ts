/**
 * Frosted glass for cards that sit on the photo backdrop (Home first),
 * matched to the reference mockup: a dark, slightly violet translucent fill,
 * one even hairline outline, generous corners, a strong blur that lets the
 * photo's color through, and a soft shadow. No inner highlight line, so the
 * edge reads as a single clean outline.
 * Tailwind classes (not a stylesheet rule) so it ships with the component.
 */
export const GLASS_CARD = [
  'rounded-[22px] border border-white/[0.12]',
  'bg-[linear-gradient(180deg,rgba(44,36,60,0.50)_0%,rgba(24,20,34,0.58)_100%)]',
  'shadow-[0_10px_30px_rgba(0,0,0,0.28)]',
  'backdrop-blur-2xl backdrop-saturate-150',
].join(' ')

/** The same glass for a colored tile: the tile's hue tints the fill and outline. */
export function glassTint(tint: string) {
  return {
    background: `linear-gradient(180deg, ${tint} 0%, rgba(24,20,34,0.60) 100%)`,
    boxShadow: '0 10px 28px rgba(0,0,0,0.26)',
    WebkitBackdropFilter: 'blur(24px) saturate(150%)',
    backdropFilter: 'blur(24px) saturate(150%)',
  } as const
}
