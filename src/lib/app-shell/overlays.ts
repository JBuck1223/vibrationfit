/**
 * Color overlays a member can lay over their theme's imagery (Account >
 * Appearance). Each is a CSS background painted above the photo and below
 * the content; gradients run top to bottom so the header and the lower cards
 * stay readable while the middle of the picture shows through.
 */

export interface OverlayPreset {
  id: string
  label: string
  description: string
  /** CSS background value; null means "no overlay". */
  css: string | null
}

export const OVERLAY_PRESETS: OverlayPreset[] = [
  { id: 'none', label: 'Clear', description: 'The picture as it is.', css: null },
  {
    id: 'dusk',
    label: 'Dusk',
    description: 'Muted violet, darker and serene.',
    css: 'linear-gradient(180deg, rgba(30,24,52,0.78) 0%, rgba(44,32,70,0.55) 22%, rgba(58,40,86,0.40) 42%, rgba(40,30,62,0.58) 62%, rgba(24,20,38,0.80) 80%, rgba(14,12,22,0.90) 100%)',
  },
  {
    id: 'violet',
    label: 'Violet',
    description: 'A lighter purple glow.',
    css: 'linear-gradient(180deg, rgba(40,20,86,0.62) 0%, rgba(64,28,118,0.30) 28%, rgba(96,40,140,0.14) 50%, rgba(52,22,92,0.42) 72%, rgba(22,10,40,0.82) 100%)',
  },
  {
    id: 'midnight',
    label: 'Midnight',
    description: 'Deep blue-black, very calm.',
    css: 'linear-gradient(180deg, rgba(8,12,28,0.80) 0%, rgba(14,20,44,0.58) 35%, rgba(10,14,32,0.70) 65%, rgba(4,6,14,0.92) 100%)',
  },
  {
    id: 'ember',
    label: 'Ember',
    description: 'Warm rose and amber.',
    css: 'linear-gradient(180deg, rgba(48,18,30,0.70) 0%, rgba(90,36,40,0.30) 35%, rgba(70,28,36,0.45) 65%, rgba(24,10,14,0.88) 100%)',
  },
  {
    id: 'shade',
    label: 'Shade',
    description: 'Neutral darkening, no color.',
    css: 'linear-gradient(180deg, rgba(0,0,0,0.65) 0%, rgba(0,0,0,0.35) 40%, rgba(0,0,0,0.55) 70%, rgba(0,0,0,0.88) 100%)',
  },
]

export function getOverlay(id: string | null | undefined): OverlayPreset | null {
  return OVERLAY_PRESETS.find((o) => o.id === id) ?? null
}
