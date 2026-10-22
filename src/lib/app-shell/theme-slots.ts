/**
 * Theme image slots. Every place the shell or a section shows themed imagery
 * asks for one of these by name; a theme supplies an image per slot.
 */

export const SECTION_HERO_SLOTS = [
  'home.hero',
  'viva.hero',
  'listen.hero',
  'capture.hero',
  'tribe.hero',
  'tools.hero',
  'account.hero',
] as const

export const STUDIO_SLOTS = [
  'studio.daily-paper',
  'studio.journal',
  'studio.abundance',
  'studio.map',
  'studio.manifestations',
  'studio.life-vision',
  'studio.story',
  'studio.meditations',
  'studio.songs',
] as const

export const CARD_SLOTS = ['card.1', 'card.2', 'card.3', 'card.4', 'card.5', 'card.6'] as const

export const BACKDROP_SLOT = 'area.backdrop' as const

export type ThemeSlot =
  | typeof BACKDROP_SLOT
  | (typeof SECTION_HERO_SLOTS)[number]
  | (typeof STUDIO_SLOTS)[number]
  | (typeof CARD_SLOTS)[number]

export const ALL_SLOTS: readonly ThemeSlot[] = [
  BACKDROP_SLOT,
  ...SECTION_HERO_SLOTS,
  ...STUDIO_SLOTS,
  ...CARD_SLOTS,
]

/** Wide slots are generated 16:9; cards are square. */
export function slotDimension(slot: ThemeSlot): 'landscape_16_9' | 'square' {
  return slot.startsWith('card.') ? 'square' : 'landscape_16_9'
}

/**
 * What each slot falls back to when a theme has no image for it.
 * Studio slots fall back to their section hero; everything ends at the backdrop.
 */
export function slotFallback(slot: ThemeSlot): ThemeSlot | null {
  if (slot === BACKDROP_SLOT) return null
  if (slot.startsWith('card.')) return BACKDROP_SLOT
  if (slot.startsWith('studio.')) {
    switch (slot) {
      case 'studio.daily-paper':
      case 'studio.journal':
      case 'studio.abundance':
        return 'capture.hero'
      case 'studio.map':
        return 'home.hero'
      case 'studio.manifestations':
        return 'tools.hero'
      default:
        return 'listen.hero'
    }
  }
  return BACKDROP_SLOT
}

/**
 * Prompt scaffolding per theme and slot. The world comes from the theme, the
 * subject from the slot, and every prompt asks for empty text-safe foreground
 * so headlines and the scrim always have room.
 */
export const THEME_WORLDS: Record<string, string> = {
  sunset: 'a warm coastal sunset, golden hour light over the sea, soft purple and amber sky',
  beach: 'a quiet beach at sunrise, pale sand, gentle turquoise water, soft morning haze',
  tropical: 'a lush tropical coast, palms, deep green foliage, warm light through leaves',
  mountains: 'high alpine mountains at dawn, pine forest, mist in the valleys, cool blue light',
  snow: 'a calm snowy landscape at blue hour, soft drifts, pine trees, quiet winter light',
  light: 'a bright, airy coastal morning, pale sky, white sand and soft sea mist, gentle diffuse daylight',
  watercolor: 'a dreamy coastal landscape with hills, sea and sky in soft pastel washes',
}

/**
 * How each theme is rendered. Photographic by default; some themes are a
 * different medium or key. Dark has no imagery at all (plain charcoal).
 */
const THEME_STYLES: Record<string, string> = {
  default:
    'Photorealistic, cinematic lighting, rich blacks and deep shadows, premium wellness retreat mood.',
  light:
    'Photorealistic, high-key bright daylight, soft whites and pale pastels, airy and serene, gentle contrast.',
  watercolor:
    'Loose hand-painted watercolor on textured cold-press paper, soft bleeding pigments, visible paper grain, gentle granulation, painterly and calm.',
}

/** Themes that deliberately carry no images (the backdrop stays plain). */
export const IMAGELESS_THEMES = ['dark', 'light'] as const

const SLOT_SUBJECTS: Record<ThemeSlot, string> = {
  'area.backdrop': 'a wide, soft, slightly out-of-focus landscape view with no single subject',
  'home.hero': 'a cinematic wide view from a comfortable vantage point looking out at the horizon',
  'viva.hero': 'a serene, intimate scene with deep violet and magenta tones in the sky',
  'listen.hero': 'a peaceful overlook where someone might sit and listen, headphones-worthy calm',
  'capture.hero': 'a quiet writing spot outdoors, a journal-friendly table or ledge in soft light',
  'tribe.hero': 'a welcoming gathering place outdoors, warm lanterns or a fire pit, no people',
  'tools.hero': 'an organized creative studio space open to the landscape, natural materials',
  'account.hero': 'a minimal, calm corner of the landscape with lots of negative space',
  'studio.daily-paper': 'early morning light, a clean surface ready for the day, fresh and clear',
  'studio.journal': 'a cozy reflective nook with soft diffused light',
  'studio.abundance': 'a generous, golden, flourishing view suggesting plenty',
  'studio.map': 'a winding path or trail leading toward the horizon',
  'studio.manifestations': 'the landscape at its most colorful moment, rich saturated sky and reflections',
  'studio.life-vision': 'an expansive vista at the brightest moment of the day',
  'studio.story': 'a scene with narrative depth, layered foreground and distant light',
  'studio.meditations': 'perfectly still water or air, symmetrical calm',
  'studio.songs': 'a rhythmic natural pattern, waves or ridgelines, musical in feel',
  'card.1': 'a close-up of natural texture from the landscape: sand, stone, bark or snow',
  'card.2': 'a single tree, rock or dune in the middle distance, calm and simple',
  'card.3': 'light on water or snow or leaves, abstract and soft',
  'card.4': 'a sky study with gentle gradients',
  'card.5': 'a shoreline, ridgeline or treeline in soft focus',
  'card.6': 'a small sheltered spot in the landscape lit by warm evening light',
}

export function buildSlotPrompt(themeSlug: string, slot: ThemeSlot, worldOverride?: string): string {
  const world = worldOverride ?? THEME_WORLDS[themeSlug] ?? THEME_WORLDS.sunset
  const subject = SLOT_SUBJECTS[slot]
  const style = THEME_STYLES[themeSlug] ?? THEME_STYLES.default
  return (
    `${subject}, set in ${world}. ${style} ` +
    `Full-bleed frame edge to edge: no letterboxing, no black bars, no borders. No people, no text, no logos, no watermarks. ` +
    `Keep the lower third and left side uncluttered with soft tones so text can sit on top.`
  )
}
