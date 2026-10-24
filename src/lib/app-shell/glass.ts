/**
 * Frosted glass for cards that sit on the photo backdrop (Home first),
 * matched to the reference mockup: a dark, slightly violet translucent fill,
 * one even hairline outline, generous corners, a strong blur that lets the
 * photo's color through, and a soft shadow. No inner highlight line, so the
 * edge reads as a single clean outline.
 * Tailwind classes (not a stylesheet rule) so it ships with the component.
 */
export const GLASS_CARD = [
  'vf-glass rounded-[22px] border border-white/[0.12]',
  'bg-[linear-gradient(180deg,rgba(44,36,60,0.50)_0%,rgba(24,20,34,0.58)_100%)]',
  'shadow-[0_10px_30px_rgba(0,0,0,0.22)]',
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

/**
 * One pill recipe for every tab row and filter in the shell. Inactive pills are
 * solid violet glass (not a faint white tint) so they read over bright photos;
 * the active pill is the brand green outline.
 */
export const PILL_BASE = 'shrink-0 whitespace-nowrap rounded-full border px-4 py-2 text-sm font-medium transition-colors'
export const PILL_ON = 'border-[#39FF14] bg-[rgba(57,255,20,0.16)] text-[#39FF14]'
export const PILL_OFF = 'border-white/15 bg-[rgba(28,22,38,0.45)] text-white/90 backdrop-blur-xl hover:text-white'
/** The well a segmented toggle sits in (Listen | Create, View | Update). */
export const PILL_WELL = 'rounded-full border border-white/15 bg-[rgba(28,22,38,0.45)] p-1 backdrop-blur-xl'
/** Floating menus and sheets: solid enough to read over anything underneath. */
export const GLASS_MENU = 'vf-glass rounded-[20px] border border-white/[0.14] bg-[rgba(28,22,38,0.97)] shadow-[0_16px_40px_rgba(0,0,0,0.35)] backdrop-blur-2xl'
/** Dialog and sheet panels in the shell. */
export const GLASS_SHEET = 'vf-glass rounded-[24px] border border-white/[0.14] bg-[rgba(28,22,38,0.97)] shadow-[0_24px_60px_rgba(0,0,0,0.4)] backdrop-blur-2xl'
/** The dimmed layer behind a dialog. */
export const SCRIM = 'bg-black/60 backdrop-blur-sm'
