/**
 * The Life Explorers — the recurring storybook cast.
 *
 * Starter characters are defined here in code. A row is created in
 * le_characters (per user) the first time a character is used, and a portrait
 * "character sheet" image is generated once and reused as the visual anchor
 * for every book they appear in.
 *
 * Kids (Oliver, Leila) are human children. Animals stay animals.
 * Never mix a child's head onto an animal body.
 */

import type { SupabaseClient } from '@supabase/supabase-js'
import type { LeCharacter } from './types'

export interface StarterCharacter {
  slug: string
  name: string
  species: string
  personality: string
  catchphrase: string
  /** Detailed, stable visual description — injected into every image prompt. */
  visual_description: string
}

export function isHumanSpecies(species?: string | null): boolean {
  const s = (species || '').toLowerCase()
  return s === 'boy' || s === 'girl' || s === 'child' || s === 'human'
}

/**
 * One shared illustration style for every Life Explorers book.
 * Appended to every image prompt (portraits, covers, pages).
 */
export const BOOK_STYLE_BIBLE = [
  'Modern children\'s picture-book illustration.',
  'Flat bold shapes with thick, clean outlines and soft rounded corners.',
  'Big expressive eyes, exaggerated funny facial expressions.',
  'Rich saturated colors, warm lighting, subtle paper-grain texture.',
  'Simple uncluttered backgrounds that keep focus on the characters.',
  'Characters may be human children or animals. Never mix a child\'s head onto an animal body.',
  'A named child stays a child. A named animal stays that complete animal.',
  'Absolutely no words, letters, numbers, or text anywhere in the image.',
].join(' ')

export const STARTER_CHARACTERS: StarterCharacter[] = [
  {
    slug: 'oliver',
    name: 'Oliver',
    species: 'boy',
    personality:
      'A seven-year-old Gulf kid who is first in the water. Thinks with his body. Asks why out loud. Bets they can. Loyal, loud laugh. He is himself — not an animal, not a mascot.',
    catchphrase: "Let's GO.",
    visual_description:
      'A 7-year-old human boy, not an animal. Sandy-blonde hair, sun-lightened and a little salt-stiff, usually messy. Bright blue eyes. Sun-kissed surfer kid: tanned face, a few freckles, easy grin. Faded blue board shorts, a rash guard or bare shoulders, thin shark-tooth necklace. Barefoot more often than not. Sandy ankles. Human head, human arms, human legs.',
  },
  {
    slug: 'leila',
    name: 'Leila',
    species: 'girl',
    personality:
      'A seven-year-old Gulf kid and Oliver\'s dock friend — a friend, not a crush. Oliver runs. Leila crouches. She finds the tiny crab he stepped over. She will say wait when he is about to wreck the tide pool — then she jumps in too. The science move is look again.',
    catchphrase: 'Hold up. Look at THIS.',
    visual_description:
      'A 7-year-old human girl, not an animal. Dark brown hair in a salt-stiff braid that never stays neat. Warm brown eyes, freckles across the nose. Sun-browned skin. Faded coral rash guard, rolled shorts, one yellow flip-flop (the other lives in her mesh bag). Mesh bag of shells, sea glass, and a soggy notebook. Human head, human arms, human legs.',
  },
  {
    slug: 'pip',
    name: 'Pip',
    species: 'penguin',
    personality:
      'A can-do engineer who believes every problem can be fixed by building something — usually something way too big. Measures everything twice, still gets it wrong, laughs about it.',
    catchphrase: "Let's build it BIGGER!",
    visual_description:
      'A small chubby penguin with shiny black-and-white feathers, a bright yellow hard hat worn slightly crooked, an orange tool belt with a tiny wrench and hammer, and round safety goggles pushed up on the forehead. Short flappy wings, big curious eyes, orange webbed feet.',
  },
  {
    slug: 'waffles',
    name: 'Waffles',
    species: 'hamster',
    personality:
      'Nervous about everything but always comes along anyway — and usually ends up saving the day by accident. Packs an enormous backpack of snacks for every adventure, no matter how short.',
    catchphrase: 'I brought snacks. A LOT of snacks.',
    visual_description:
      'A round golden-brown hamster with puffy cheeks always slightly full, wearing a red knitted scarf and an enormous green hiking backpack twice his size with snacks poking out of every pocket. Tiny pink paws, huge worried eyes, one ear that flops over.',
  },
  {
    slug: 'zigzag',
    name: 'Professor Zigzag',
    species: 'raccoon',
    personality:
      'A know-it-all who reads facts from a battered field notebook — which is sometimes upside down, so the facts come out hilariously wrong. Never admits a mistake; calls it "a new discovery."',
    catchphrase: 'According to my notebook…',
    visual_description:
      'A scruffy gray raccoon with a black eye-mask, tiny round spectacles perched on the nose, a tweed vest with a pocket watch chain, and a battered brown leather field notebook clutched under one arm. A striped tail held up like an exclamation point.',
  },
  {
    slug: 'octavia',
    name: 'Octavia',
    species: 'octopus',
    personality:
      'A cheerful inventor with a gadget in every tentacle — umbrella, magnifying glass, flashlight, fishing rod — and she can never remember which tentacle has what. Loves testing inventions on her friends.',
    catchphrase: "I've got a tentacle for that!",
    visual_description:
      'A bright purple octopus with pink polka dots, wearing a tiny aviator cap with brass goggles. Each of her eight tentacles holds or wears a different small gadget: a magnifying glass, a flashlight, an umbrella, a compass, a net, a bell, a spoon, and one empty tentacle for waving. Big friendly smile.',
  },
  {
    slug: 'boots',
    name: 'Boots',
    species: 'puppy',
    personality:
      'A golden retriever puppy who is the best digger and sniffer on the team — and the most easily distracted. Will abandon any mission instantly if a squirrel appears. Fiercely loyal, endlessly happy.',
    catchphrase: 'Did somebody say DIG?!',
    visual_description:
      'A fluffy golden retriever puppy with floppy ears, one white front paw, a blue explorer bandana around the neck, and four tiny red rubber boots (one always missing). Tongue out, tail mid-wag, dirt on the nose from digging.',
  },
]

export function starterBySlug(slug: string): StarterCharacter | undefined {
  return STARTER_CHARACTERS.find((c) => c.slug === slug)
}

/**
 * Prompt for a character's one-time reference portrait (the "character sheet").
 * Full-body, neutral background so it works as an edit reference for any scene.
 */
export function buildPortraitPrompt(character: {
  name: string
  species?: string | null
  visual_description: string
}): string {
  const who = isHumanSpecies(character.species)
    ? `${character.name}, a 7-year-old human ${character.species} (not an animal, not anthropomorphic)`
    : `${character.name}${character.species ? `, a ${character.species}` : ''}`
  return [
    `Character sheet portrait of ${who}.`,
    character.visual_description,
    'Full body, standing, facing slightly toward the viewer, friendly confident pose.',
    'Plain soft cream background, no scenery, no props beyond what the character wears or carries.',
    BOOK_STYLE_BIBLE,
  ].join(' ')
}

/** Create any missing starter rows for this user. Oliver is tagged to the student. */
export async function ensureStarterCharacters(
  supabase: SupabaseClient,
  userId: string,
  options?: { studentId?: string | null; householdId?: string | null }
): Promise<LeCharacter[]> {
  const { data: existingRows } = await supabase
    .from('le_characters')
    .select('*')
    .eq('created_by', userId)
    .order('is_starter', { ascending: false })
    .order('created_at', { ascending: true })

  let characters = (existingRows || []) as LeCharacter[]
  const existingSlugs = new Set(characters.map((c) => c.slug))
  const missing = STARTER_CHARACTERS.filter((s) => !existingSlugs.has(s.slug))

  if (missing.length > 0) {
    const { data: inserted } = await supabase
      .from('le_characters')
      .insert(
        missing.map((s) => ({
          created_by: userId,
          household_id: options?.householdId || null,
          student_id: s.slug === 'oliver' ? options?.studentId || null : null,
          slug: s.slug,
          name: s.name,
          species: s.species,
          personality: s.personality,
          catchphrase: s.catchphrase,
          visual_description: s.visual_description,
          is_starter: true,
        }))
      )
      .select('*')
    characters = [...characters, ...((inserted || []) as LeCharacter[])]
  }

  const oliver = characters.find((c) => c.slug === 'oliver')
  if (oliver && options?.studentId && oliver.student_id !== options.studentId) {
    await supabase
      .from('le_characters')
      .update({ student_id: options.studentId, updated_at: new Date().toISOString() })
      .eq('id', oliver.id)
    oliver.student_id = options.studentId
  }

  return characters
}
